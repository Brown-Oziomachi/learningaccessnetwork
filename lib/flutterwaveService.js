// lib/flutterwaveService.js

import { db } from '@/lib/firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';

export const initializeFlutterwave = (config) => {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://checkout.flutterwave.com/v3.js';
        script.async = true;

        script.onload = () => {
            if (window.FlutterwaveCheckout) {
                resolve(window.FlutterwaveCheckout);
            } else {
                reject(new Error('Flutterwave SDK failed to load'));
            }
        };

        script.onerror = () => reject(new Error('Failed to load Flutterwave SDK'));
        document.body.appendChild(script);
    });
};

/**
 * Fetches seller information from the book document
 * This ensures we always have the correct seller details for payment
 */
export const getBookSellerInfo = async (bookId) => {
    try {
        // Remove 'firestore-' prefix if present
        const cleanBookId = bookId.replace('firestore-', '');

        const bookRef = doc(db, 'advertMyBook', cleanBookId);
        const bookDoc = await getDoc(bookRef);

        if (!bookDoc.exists()) {
            console.error('❌ Book not found:', cleanBookId);
            throw new Error('Book not found');
        }

        const bookData = bookDoc.data();

        // Validate seller information exists
        if (!bookData.userId) {
            console.error('❌ Book missing userId (seller ID):', bookData);
            throw new Error('Book missing seller information');
        }

        console.log('✅ Seller info retrieved:', {
            sellerId: bookData.userId,
            sellerEmail: bookData.userEmail,
            sellerName: bookData.userName
        });

        return {
            sellerId: bookData.userId,
            sellerEmail: bookData.userEmail || 'unknown@email.com',
            sellerName: bookData.userName || 'Unknown Seller',
            bookTitle: bookData.title,
            bookPrice: bookData.price
        };
    } catch (error) {
        console.error('Error fetching seller info:', error);
        throw error;
    }
};

/**
 * Creates Flutterwave payment configuration with seller metadata
 */
export const createFlutterwaveConfig = async (book, formData, userId) => {
    try {
        // Get seller info from Firestore
        const sellerInfo = await getBookSellerInfo(book.id || book.firestoreId);

        const config = {
            secret_key: 'FLWSECK_TEST-e570352e293142cdc7194539daca11f3-X',
            tx_ref: `TXN${Date.now()}_${book.id || book.firestoreId}`,
            amount: book.price || sellerInfo.bookPrice,
            currency: 'NGN',
            payment_options: 'card,ussd,bank_transfer',
            customer: {
                email: formData.email,
                phone_number: formData.phone,
                name: formData.name,
            },
            customizations: {
                title: 'LAN Library',
                description: `Payment for ${book.title || sellerInfo.bookTitle}`,
                logo: 'https://yourwebsite.com/logo.png',
            },
            meta: {
                // CRITICAL: Seller information for webhook
                sellerId: sellerInfo.sellerId,
                sellerEmail: sellerInfo.sellerEmail,
                sellerName: sellerInfo.sellerName,

                // Book information
                bookId: `firestore-${book.id || book.firestoreId}`.replace('firestore-firestore-', 'firestore-'),
                bookTitle: book.title || sellerInfo.bookTitle,
                bookPrice: book.price || sellerInfo.bookPrice,

                // Buyer information
                userId: userId,
                buyerEmail: formData.email,
                buyerName: formData.name
            }
        };

        console.log('💳 Flutterwave Config Created:', {
            tx_ref: config.tx_ref,
            amount: config.amount,
            seller: {
                id: config.meta.sellerId,
                email: config.meta.sellerEmail,
                name: config.meta.sellerName
            },
            buyer: {
                id: config.meta.userId,
                email: config.meta.buyerEmail
            }
        });

        return config;
    } catch (error) {
        console.error('Error creating Flutterwave config:', error);
        throw error;
    }
};

/**
 * Handles Flutterwave payment modal
 */
export const handleFlutterwavePayment = async (config, onSuccess, onError, onClose) => {
    try {
        console.log('Initializing Flutterwave payment...');

        const FlutterwaveCheckout = await initializeFlutterwave();

        FlutterwaveCheckout({
            ...config,
            callback: (response) => {
                console.log(' Payment callback received:', response);

                if (response.status === 'successful' || response.status === 'completed') {
                    console.log(' Payment successful!');
                    console.log(' Transaction details:', {
                        tx_ref: response.tx_ref,
                        transaction_id: response.transaction_id,
                        amount: response.amount
                    });
                }

                onSuccess(response);
            },
            onclose: () => {
                console.log(' Payment modal closed');
                onClose();
            }
        });
    } catch (error) {
        console.error(' Flutterwave initialization error:', error);
        onError(error);
    }
};

/**
 * Verifies book has seller information before payment
 * Use this to check books before initiating payment
 */
export const verifyBookHasSellerInfo = async (bookId) => {
    try {
        const sellerInfo = await getBookSellerInfo(bookId);
        return {
            valid: true,
            sellerInfo
        };
    } catch (error) {
        return {
            valid: false,
            error: error.message
        };
    }
};