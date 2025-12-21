// app/hooks/usePayment.js
import { useState, useEffect } from 'react';
import { db, auth } from '@/lib/firebaseConfig';
import { collection, addDoc, doc, updateDoc, serverTimestamp, increment, getDoc, setDoc } from 'firebase/firestore';

export const usePayment = (book, formData, sellerDetails) => {
    const [processing, setProcessing] = useState(false);
    const [paymentSuccess, setPaymentSuccess] = useState(false);
    const [error, setError] = useState(null);
    const [flutterwaveLoaded, setFlutterwaveLoaded] = useState(false);

    // Load Flutterwave script
    useEffect(() => {
        if (typeof window !== 'undefined' && !window.FlutterwaveCheckout) {
            const script = document.createElement('script');
            script.src = 'https://checkout.flutterwave.com/v3.js';
            script.async = true;
            script.onload = () => setFlutterwaveLoaded(true);
            document.body.appendChild(script);
        } else if (window.FlutterwaveCheckout) {
            setFlutterwaveLoaded(true);
        }
    }, []);

    /**
     * Save transaction to Firestore database
     * @param {Object} paymentData - Payment response data
     * @param {string} status - Transaction status (completed, pending, failed)
     * @returns {Promise<string>} Transaction ID
     */
    const saveTransaction = async (paymentData, status = 'completed') => {
        try {
            const transactionData = {
                // Transaction details
                transactionId: paymentData.transaction_id || paymentData.tx_ref,
                transactionRef: paymentData.tx_ref,
                flutterwaveRef: paymentData.flw_ref || null,
                status: status,
                amount: book.price,
                currency: 'NGN',
                paymentMethod: paymentData.payment_type || 'flutterwave',

                // Book details
                bookId: book.id,
                firestoreId: book.firestoreId || null,
                bookTitle: book.title,
                bookAuthor: book.author,
                bookPrice: book.price,
                bookCategory: book.category || null,

                // Buyer details
                buyerId: auth.currentUser?.uid,
                buyerEmail: formData.email,
                buyerName: formData.name,
                buyerPhone: formData.phone,

                // Seller details - CRITICAL for crediting seller
                sellerId: sellerDetails?.id || null,
                sellerName: sellerDetails?.name || 'Unknown Seller',
                sellerEmail: sellerDetails?.email || null,
                sellerPhone: sellerDetails?.phone || null,
                sellerAccountDetails: sellerDetails?.accountDetails || null,
                sellerWalletId: sellerDetails?.walletId || null,

                // Platform commission
                platformFee: book.price * 0.15, // 15% platform fee
                sellerAmount: book.price * 0.85, // 85% to seller

                // Timestamps
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
                purchaseDate: new Date().toISOString(),

                // Additional metadata
                metadata: {
                    customerIp: paymentData.ip || null,
                    deviceFingerprint: paymentData.device_fingerprint || null,
                    paymentGateway: 'flutterwave',
                }
            };

            // Save to transactions collection
            const transactionRef = await addDoc(collection(db, 'transactions'), transactionData);
            console.log('Transaction saved with ID:', transactionRef.id);
            console.log('Seller will be credited:', {
                sellerId: sellerDetails?.id,
                sellerName: sellerDetails?.name,
                amount: book.price,
                sellerEarnings: book.price * 0.85
            });

            // Update buyer's purchased books
            if (auth.currentUser) {
                const userRef = doc(db, 'users', auth.currentUser.uid);

                // Store under both the original bookId and cleaned firestoreId for compatibility
                const updates = {
                    updatedAt: serverTimestamp()
                };

                // Add purchase record with the bookId as key
                const purchaseData = {
                    id: book.id, // Include id field for backward compatibility
                    bookId: book.id,
                    firestoreId: book.firestoreId || null,
                    title: book.title,
                    author: book.author,
                    purchaseDate: new Date().toISOString(),
                    transactionId: transactionRef.id,
                    amount: book.price,
                    sellerId: sellerDetails?.id,
                    sellerName: sellerDetails?.name,
                    pdfUrl: book.pdfUrl || null,
                };

                updates[`purchasedBooks.${book.id}`] = purchaseData;

                // Also store under firestoreId if different
                if (book.firestoreId && book.firestoreId !== book.id) {
                    updates[`purchasedBooks.${book.firestoreId}`] = purchaseData;
                }

                await updateDoc(userRef, updates);
                console.log('Buyer purchase record updated for:', book.id);
            }

            // Update seller's sales record and balance
            if (sellerDetails?.id) {
                try {
                    const sellerAmount = book.price * 0.85; // Seller gets 85%
                    const platformFee = book.price * 0.15; // Platform gets 15%

                    // Update the users collection (for seller profile)
                    const userSellerRef = doc(db, 'users', sellerDetails.id);
                    await updateDoc(userSellerRef, {
                        // Add individual sale record
                        [`sales.${transactionRef.id}`]: {
                            transactionId: transactionRef.id,
                            bookId: book.id,
                            bookTitle: book.title,
                            amount: book.price,
                            sellerEarnings: sellerAmount,
                            platformFee: platformFee,
                            buyerId: auth.currentUser?.uid,
                            buyerName: formData.name,
                            buyerEmail: formData.email,
                            saleDate: new Date().toISOString(),
                            status: status,
                        },
                        // Update seller's total sales and earnings
                        totalSales: increment(1),
                        totalRevenue: increment(book.price),
                        totalEarnings: increment(sellerAmount),
                        lastSaleDate: serverTimestamp(),
                        updatedAt: serverTimestamp()
                    });

                    // Update the sellers collection (for account balance and withdrawals)
                    const sellersRef = doc(db, 'sellers', sellerDetails.id);

                    // Check if seller document exists
                    const sellerDoc = await getDoc(sellersRef);

                    if (sellerDoc.exists()) {
                        // Update existing seller document
                        await updateDoc(sellersRef, {
                            accountBalance: increment(sellerAmount),
                            totalEarnings: increment(sellerAmount),
                            booksSold: increment(1),
                            lastSaleDate: serverTimestamp(),
                            updatedAt: serverTimestamp()
                        });
                    } else {
                        // Create new seller document if it doesn't exist
                        await setDoc(sellersRef, {
                            sellerId: sellerDetails.id,
                            sellerName: sellerDetails.name,
                            sellerEmail: sellerDetails.email,
                            accountBalance: sellerAmount,
                            totalEarnings: sellerAmount,
                            booksSold: 1,
                            createdAt: serverTimestamp(),
                            lastSaleDate: serverTimestamp(),
                            updatedAt: serverTimestamp()
                        });
                    }

                    console.log('Seller credited:', {
                        sellerId: sellerDetails.id,
                        amount: sellerAmount,
                        bookTitle: book.title
                    });
                } catch (sellerUpdateError) {
                    console.error('Error updating seller record:', sellerUpdateError);
                    // Log the error but don't throw - transaction is still saved
                    console.error('Seller update failed for:', {
                        sellerId: sellerDetails?.id,
                        amount: book.price * 0.85
                    });
                }
            }

            // Update book's sales count
            if (book.firestoreId) {
                try {
                    const bookRef = doc(db, 'advertMyBook', book.firestoreId);
                    await updateDoc(bookRef, {
                        salesCount: increment(1),
                        lastPurchaseDate: serverTimestamp(),
                        updatedAt: serverTimestamp()
                    });
                    console.log('Book sales count updated');
                } catch (bookUpdateError) {
                    console.error('Error updating book sales count:', bookUpdateError);
                }
            }

            return transactionRef.id;
        } catch (err) {
            console.error('Error saving transaction:', err);
            throw err;
        }
    };

    /**
     * Process Flutterwave payment using inline script
     */
    const processFlutterwavePayment = () => {
        // Validate required data
        if (!book) {
            setError({ message: 'Book information is missing' });
            return;
        }

        if (!sellerDetails) {
            setError({ message: 'Seller information is missing. Cannot process payment.' });
            return;
        }

        if (!formData.email || !formData.phone || !formData.name) {
            setError({ message: 'Please fill in all required fields' });
            return;
        }

        if (!flutterwaveLoaded || !window.FlutterwaveCheckout) {
            setError({ message: 'Payment system is loading. Please try again.' });
            return;
        }

        setProcessing(true);
        setError(null);

        console.log('Initiating Flutterwave payment with seller details:', {
            sellerId: sellerDetails.id,
            sellerName: sellerDetails.name,
            amount: book.price,
            bookTitle: book.title
        });

        const paymentConfig = {
            public_key: process.env.NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY,
            tx_ref: `TXN-${Date.now()}-${book?.id || 'unknown'}`,
            amount: book.price,
            currency: 'NGN',
            payment_options: 'card,ussd,banktransfer',
            customer: {
                email: formData.email,
                phone_number: formData.phone,
                name: formData.name,
            },
            customizations: {
                title: book.title || 'Book Purchase',
                description: `Purchase of ${book.title || 'book'}`,
                logo: book.image || '',
            },
            meta: {
                bookId: book.id,
                firestoreId: book.firestoreId,
                bookTitle: book.title,
                buyerId: auth.currentUser?.uid,
                buyerEmail: formData.email,
                sellerId: sellerDetails.id,
                sellerName: sellerDetails.name,
                sellerEmail: sellerDetails.email,
                transactionType: 'book_purchase',
            },
            callback: async (response) => {
                console.log('Flutterwave payment response:', response);

                if (response.status === 'successful') {
                    try {
                        const transactionId = await saveTransaction(response, 'completed');
                        console.log('Payment processed successfully. Transaction ID:', transactionId);
                        setPaymentSuccess(true);
                    } catch (err) {
                        console.error('Error processing successful payment:', err);
                        setError({
                            message: 'Payment successful but failed to save transaction. Please contact support with your transaction reference: ' + response.tx_ref
                        });
                    } finally {
                        setProcessing(false);
                    }
                } else if (response.status === 'cancelled') {
                    setError({ message: 'Payment was cancelled' });
                    setProcessing(false);
                } else {
                    setError({ message: `Payment failed: ${response.status}` });
                    setProcessing(false);
                }
            },
            onclose: () => {
                console.log('Payment modal closed');
                if (!paymentSuccess) {
                    setProcessing(false);
                }
            },
        };

        // Add subaccount for split payment if seller has walletId
        if (sellerDetails?.walletId) {
            paymentConfig.subaccounts = [{
                id: sellerDetails.walletId,
                transaction_split_ratio: 0.85, // Seller gets 85%
            }];
        }

        window.FlutterwaveCheckout(paymentConfig);
    };

    /**
     * Process PayPal payment (placeholder for future implementation)
     */
    const processPayPalPayment = async () => {
        if (!book || !sellerDetails) {
            setError({ message: 'Book or seller information is missing' });
            return;
        }

        setProcessing(true);
        setError(null);

        try {
            console.log('Processing PayPal payment with seller details:', sellerDetails);

            // TODO: Implement actual PayPal integration

            // Simulate payment processing
            await new Promise(resolve => setTimeout(resolve, 2000));

            const mockPayPalResponse = {
                transaction_id: `PAYPAL-${Date.now()}`,
                tx_ref: `TXN-${Date.now()}-${book.id}`,
                payment_type: 'paypal',
                status: 'successful'
            };

            const transactionId = await saveTransaction(mockPayPalResponse, 'completed');
            console.log('PayPal payment processed. Transaction ID:', transactionId);
            setPaymentSuccess(true);
        } catch (err) {
            console.error('PayPal payment error:', err);
            setError({ message: 'PayPal payment failed: ' + err.message });
        } finally {
            setProcessing(false);
        }
    };

    return {
        processing,
        paymentSuccess,
        error,
        flutterwaveLoaded,
        processFlutterwavePayment,
        processPayPalPayment,
        saveTransaction
    };
};