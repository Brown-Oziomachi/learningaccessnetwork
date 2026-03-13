// app/hooks/usePayment.js - COMPLETE FIX
import { useState, useEffect } from 'react';
import { db, auth } from '@/lib/firebaseConfig';
import { collection, addDoc, doc, updateDoc, serverTimestamp, increment, getDoc, setDoc } from 'firebase/firestore';

const calculatePaymentDistribution = (book) => {
    const isPlatformBook = book.source === 'platform' || book.isPlatformBook === true;

    if (isPlatformBook) {
        return {
            isPlatformBook: true,
            platformFee: 0,
            sellerAmount: book.price,
            distributionType: 'platform_owner_book'
        };
    } else {
        return {
            isPlatformBook: false,
            platformFee: Math.round(book.price * 0.20),
            sellerAmount: Math.round(book.price * 0.80),
            distributionType: 'user_seller_book'
        };
    }
};

export const usePayment = (book, formData, sellerDetails) => {
    const [processing, setProcessing] = useState(false);
    const [paymentSuccess, setPaymentSuccess] = useState(false);
    const [error, setError] = useState(null);
    const [flutterwaveLoaded, setFlutterwaveLoaded] = useState(false);

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
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.log('=== SAVING TRANSACTION ===');
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

            const distribution = calculatePaymentDistribution(book);
            console.log('💰 Payment Distribution:', distribution);

            const currentUser = auth.currentUser;
            if (!currentUser) throw new Error('User not authenticated');

            const transactionData = {
                transactionId: paymentData.transaction_id || paymentData.tx_ref,
                transactionRef: paymentData.tx_ref,
                flutterwaveRef: paymentData.flw_ref || null,
                status: status,
                amount: book.price,
                currency: 'NGN',
                paymentMethod: paymentData.payment_type || 'flutterwave',
                bookId: book.id,
                firestoreId: book.firestoreId || null,
                bookTitle: book.title,
                bookAuthor: book.author,
                bookPrice: book.price,
                bookCategory: book.category || null,
                bookSource: book.source || 'firestore',
                buyerId: currentUser.uid,
                buyerEmail: formData.email,
                buyerName: formData.name,
                buyerPhone: formData.phone,
                sellerId: sellerDetails?.id || null,
                sellerName: sellerDetails?.name || 'Unknown Seller',
                sellerEmail: sellerDetails?.email || null,
                sellerPhone: sellerDetails?.phone || null,
                platformFee: distribution.platformFee,
                sellerAmount: distribution.sellerAmount,
                isPlatformBook: distribution.isPlatformBook,
                distributionType: distribution.distributionType,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
                purchaseDate: new Date().toISOString(),
            };

            // 1. Save transaction
            const transactionRef = await addDoc(collection(db, 'transactions'), transactionData);
            console.log('✅ Transaction saved:', transactionRef.id);

            // 2. Update buyer
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

                const updates = { updatedAt: serverTimestamp() };
                if (!userDoc.exists() || !userDoc.data()?.purchasedBooks) {
                    updates.purchasedBooks = {};
                }
                updates[`purchasedBooks.${book.id}`] = purchaseData;
                if (book.firestoreId && book.firestoreId !== book.id) {
                    updates[`purchasedBooks.${book.firestoreId}`] = purchaseData;
                }

                await updateDoc(userRef, updates);
                console.log('✅ Buyer record updated');
            } catch (buyerError) {
                console.error('❌ Error updating buyer record:', buyerError);
            }

            // 3. ✅ CRITICAL FIX: Update seller wallet - ALWAYS
            if (sellerDetails?.id) {
                const sellerAmount = distribution.sellerAmount;
                const platformFee = distribution.platformFee;

                console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
                console.log('💳 UPDATING SELLER WALLET');
                console.log('Seller ID:', sellerDetails.id);
                console.log('Amount to credit:', sellerAmount);
                console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

                try {
                    // Update users collection
                    const userSellerRef = doc(db, 'users', sellerDetails.id);
                    const sellerSnapshot = await getDoc(userSellerRef);

                    if (sellerSnapshot.exists()) {
                        await updateDoc(userSellerRef, {
                            [`sales.${transactionRef.id}`]: {
                                transactionId: transactionRef.id,
                                bookId: book.id,
                                bookTitle: book.title,
                                amount: book.price,
                                sellerEarnings: sellerAmount,
                                platformFee: platformFee,
                                distributionType: distribution.distributionType,
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
                        });
                        console.log('✅ Seller user profile updated');
                    }

                    // ✅ CRITICAL: Update sellers collection - CREATE IF NOT EXISTS
                    const sellersRef = doc(db, 'sellers', sellerDetails.id);
                    const sellerDoc = await getDoc(sellersRef);

                    console.log('📊 Seller doc exists?', sellerDoc.exists());

                    if (sellerDoc.exists()) {
                        const currentData = sellerDoc.data();
                        console.log('📊 Current seller data:', {
                            accountBalance: currentData.accountBalance || 0,
                            totalEarnings: currentData.totalEarnings || 0,
                            booksSold: currentData.booksSold || 0
                        });

                        // ✅ Update existing seller document
                        await updateDoc(sellersRef, {
                            accountBalance: increment(sellerAmount),  // ✅ THIS UPDATES BALANCE
                            totalEarnings: increment(sellerAmount),
                            booksSold: increment(1),
                            lastSaleDate: serverTimestamp(),
                            updatedAt: serverTimestamp()
                        });

                        console.log('✅ SELLER WALLET UPDATED SUCCESSFULLY');
                        console.log(`💰 Balance credited: +₦${sellerAmount.toLocaleString()}`);

                        // Verify the update
                        const verifyDoc = await getDoc(sellersRef);
                        const verifiedData = verifyDoc.data();
                        console.log('✅ Verified new balance:', verifiedData.accountBalance);

                    } else {
                        // ✅ CREATE new seller document if it doesn't exist
                        console.log('⚠️ Seller document does not exist. Creating...');

                        await setDoc(sellersRef, {
                            sellerId: sellerDetails.id,
                            sellerEmail: sellerDetails.email || 'unknown@email.com',
                            sellerName: sellerDetails.name || 'Unknown Seller',
                            accountBalance: sellerAmount,  // ✅ INITIAL BALANCE
                            totalEarnings: sellerAmount,
                            booksSold: 1,
                            lastSaleDate: serverTimestamp(),
                            createdAt: serverTimestamp(),
                            updatedAt: serverTimestamp()
                        });

                        console.log('✅ NEW SELLER DOCUMENT CREATED');
                        console.log(`💰 Initial balance set: ₦${sellerAmount.toLocaleString()}`);
                    }

                } catch (sellerUpdateError) {
                    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
                    console.error('❌ CRITICAL ERROR UPDATING SELLER WALLET');
                    console.error('Error:', sellerUpdateError);
                    console.error('Error code:', sellerUpdateError.code);
                    console.error('Error message:', sellerUpdateError.message);
                    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

                    // Don't throw - allow transaction to complete
                    // But log it for debugging
                }
            } else {
                console.error('❌ NO SELLER DETAILS PROVIDED');
            }

            // 4. Update book sales count
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
                        console.log('✅ Book sales count updated');
                    }
                } catch (bookUpdateError) {
                    console.error('❌ Error updating book sales count:', bookUpdateError);
                }
            }

            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.log('✅ TRANSACTION COMPLETE');
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

            return transactionRef.id;
        } catch (err) {
            console.error('❌ CRITICAL Error saving transaction:', err);
            throw err;
        }
    };

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

        if (!window.FlutterwaveCheckout) {
            const script = document.createElement('script');
            script.src = 'https://checkout.flutterwave.com/v3.js';
            document.body.appendChild(script);
            script.onload = () => {
                setProcessing(false);
                processFlutterwavePayment();
            };
            return;
        }

        setProcessing(true);
        setError(null);

        console.log('=== INITIATING PAYMENT ===');
        console.log('Book:', book.id, book.title, '₦' + book.price);
        console.log('Seller:', sellerDetails.id, sellerDetails.name);

        const paymentConfig = {
            public_key: process.env.NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY,
            tx_ref: `TXN-${Date.now()}-${(book?.id || 'unknown').replace('firestore-', '')}`,
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
                setProcessing(false);
            }
        };

        window.FlutterwaveCheckout(paymentConfig);
    };

    const processPayPalPayment = async () => {
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