// app/hooks/usePayment.js - FIXED VERSION
import { useState, useEffect } from 'react';
import { db, auth } from '@/lib/firebaseConfig';
import { collection, addDoc, doc, updateDoc, serverTimestamp, increment, getDoc, setDoc } from 'firebase/firestore';

const calculatePaymentDistribution = (book) => {
    const isPlatformBook = book.source === 'platform' || book.isPlatformBook === true;

    if (isPlatformBook) {
        // Platform book: Owner gets 100%, no platform fee
        return {
            isPlatformBook: true,
            platformFee: 0,
            sellerAmount: book.price, // 100% to owner
            distributionType: 'platform_owner_book'
        };
    } else {
        // User book: Seller gets 80%, platform gets 25%
        return {
            isPlatformBook: false,
            platformFee: Math.round(book.price * 0.25),
            sellerAmount: Math.round(book.price * 0.80),
            distributionType: 'user_seller_book'
        };
    }
};

const getPaymentSplitDescription = (book) => {
    const isPlatformBook = book.source === 'platform' || book.isPlatformBook === true;

    if (isPlatformBook) {
        return `100% (₦${book.price.toLocaleString()}) to platform owner`;
    } else {
        const sellerAmount = Math.round(book.price * 0.80);
        const platformFee = Math.round(book.price * 0.25);
        return `80% (₦${sellerAmount.toLocaleString()}) to seller, 25% (₦${platformFee.toLocaleString()}) platform fee`;
    }
};

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

   
    const saveTransaction = async (paymentData, status = 'completed') => {
        try {
            console.log('=== SAVING TRANSACTION ===');

            // CALCULATE PAYMENT DISTRIBUTION (ADD THIS)
            const distribution = calculatePaymentDistribution(book);
            console.log('Payment Distribution:', distribution);
            console.log('Split:', getPaymentSplitDescription(book));

            const currentUser = auth.currentUser;
            if (!currentUser) {
                throw new Error('User not authenticated');
            }

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
                bookSource: book.source || 'firestore', // ADD THIS

                // Buyer details
                buyerId: currentUser.uid,
                buyerEmail: formData.email,
                buyerName: formData.name,
                buyerPhone: formData.phone,

                // Seller details
                sellerId: sellerDetails?.id || null,
                sellerName: sellerDetails?.name || 'Unknown Seller',
                sellerEmail: sellerDetails?.email || null,
                sellerPhone: sellerDetails?.phone || null,

                // UPDATED: Use calculated distribution
                platformFee: distribution.platformFee,
                sellerAmount: distribution.sellerAmount,
                isPlatformBook: distribution.isPlatformBook,
                distributionType: distribution.distributionType,

                // Timestamps
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
                purchaseDate: new Date().toISOString(),
            };

            // 1. Save to transactions collection
            const transactionRef = await addDoc(collection(db, 'transactions'), transactionData);
            console.log('✓ Transaction saved with ID:', transactionRef.id);

            // 2. Update buyer's purchased books (UNCHANGED - keep your existing code)
            try {
                const userRef = doc(db, 'users', currentUser.uid);
                const userDoc = await getDoc(userRef);

                const purchaseData = {
                    id: book.id,
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

                const updates = {
                    updatedAt: serverTimestamp()
                };

                if (!userDoc.exists() || !userDoc.data()?.purchasedBooks) {
                    updates.purchasedBooks = {};
                }
                updates[`purchasedBooks.${book.id}`] = purchaseData;

                // Store underfirestoreId if different from main ID
                if (book.firestoreId && book.firestoreId !== book.id) {
                    updates[`purchasedBooks.${book.firestoreId}`] = purchaseData;
                }
                

                await updateDoc(userRef, updates);
                console.log('✓ Buyer purchase record updated');
            } catch (buyerError) {
                console.error('✗ Error updating buyer record:', buyerError);
            }

            // 3. Update seller's records - UPDATED with dynamic amount
            if (sellerDetails?.id) {
                const sellerAmount = distribution.sellerAmount; 
                const platformFee = distribution.platformFee; 

                try {
                    // Update users collection (seller profile)
                    const userSellerRef = doc(db, 'users', sellerDetails.id);
                    const sellerSnapshot = await getDoc(userSellerRef);

                    if (sellerSnapshot.exists()) {
                        const sellerUpdates = {
                            [`sales.${transactionRef.id}`]: {
                                transactionId: transactionRef.id,
                                bookId: book.id,
                                bookTitle: book.title,
                                amount: book.price,
                                sellerEarnings: sellerAmount,
                                platformFee: platformFee,
                                distributionType: distribution.distributionType, // NEW
                                buyerId: currentUser.uid,
                                buyerName: formData.name,
                                buyerEmail: formData.email,
                                saleDate: new Date().toISOString(),
                                status: status,
                            },
                            totalSales: increment(1),
                            totalRevenue: increment(book.price),
                            totalEarnings: increment(sellerAmount),
                            lastSaleDate: serverTimestamp(),
                            updatedAt: serverTimestamp()
                        };

                        await updateDoc(userSellerRef, sellerUpdates);
                        console.log('✓ Seller user profile updated');
                    }

                    const sellersRef = doc(db, 'sellers', sellerDetails.id);
                    const sellerDoc = await getDoc(sellersRef);

                    if (sellerDoc.exists()) {
                        await updateDoc(sellersRef, {
                            accountBalance: increment(sellerAmount),
                            totalEarnings: increment(sellerAmount),
                            booksSold: increment(1),
                            lastSaleDate: serverTimestamp(),
                            updatedAt: serverTimestamp()
                        });
                        console.log('✓ Seller account balance updated');
                    } else {
                        console.log('ℹ️ No seller doc found — skipping seller wallet update');
                    }

                    console.log('✓ Seller credited:', {
                        sellerId: sellerDetails.id,
                        amount: sellerAmount,
                        type: distribution.distributionType,
                        bookTitle: book.title
                    });
                } catch (sellerUpdateError) {
                    console.error('✗ Error updating seller record:', sellerUpdateError);
                }
            }

            // 4. Update book's sales count (UNCHANGED)
            if (book.firestoreId) {
                try {
                    const bookRef = doc(db, 'advertMyBook', book.firestoreId);
                    const bookDoc = await getDoc(bookRef);

                    if (bookDoc.exists()) {
                        await updateDoc(bookRef, {
                            salesCount: increment(1),
                            lastPurchaseDate: serverTimestamp(),
                            updatedAt: serverTimestamp()
                        });
                        console.log('✓ Book sales count updated');
                    }
                } catch (bookUpdateError) {
                    console.error('✗ Error updating book sales count:', bookUpdateError);
                }
            }

            return transactionRef.id;
        } catch (err) {
            console.error('✗ CRITICAL Error saving transaction:', err);
            throw err;
        }
    };


    /**
     * Process Flutterwave payment
     */
    const processFlutterwavePayment = () => {
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

        console.log('=== INITIATING PAYMENT ===');
        console.log('Book:', book.id, book.title);
        console.log('Seller:', sellerDetails.id, sellerDetails.name);

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
            callback: async (response) => {
                console.log('=== PAYMENT CALLBACK ===');
                console.log('Status:', response.status);

                if (response.status === 'successful') {
                    try {
                        const transactionId = await saveTransaction(response, 'completed');
                        console.log('✓ Payment processed successfully');
                        console.log('Transaction ID:', transactionId);
                        setPaymentSuccess(true);
                    } catch (err) {
                        console.error('✗ Error processing payment:', err);
                        setError({
                            message: 'Payment successful but failed to save transaction. Please contact support with reference: ' + response.tx_ref
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
                if (!paymentSuccess) {
                    setProcessing(false);
                }
            },
        };

        window.FlutterwaveCheckout(paymentConfig);
    };

    const processPayPalPayment = async () => {
        // PayPal implementation (mock for now)
        setProcessing(true);
        setError(null);

        try {
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