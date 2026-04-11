"use client"
// lib/flutterwaveService.js
// NOTE: The checkout modal still uses v3.js (that hasn't changed in v4)
// Only the backend API calls (transfers, bills) moved to v4

import { db } from '@/lib/firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';

export const initializeFlutterwave = () => {
    return new Promise((resolve, reject) => {
        // If already loaded, resolve immediately
        if (window.FlutterwaveCheckout) {
            resolve(window.FlutterwaveCheckout);
            return;
        }

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
 * Fetches seller information from Firestore
 */
export const getBookSellerInfo = async (bookId) => {
    try {
        const cleanBookId = bookId.replace('firestore-', '');
        const bookRef = doc(db, 'advertMyBook', cleanBookId);
        const bookDoc = await getDoc(bookRef);

        if (!bookDoc.exists()) {
            throw new Error('Book not found');
        }

        const bookData = bookDoc.data();

        if (!bookData.userId) {
            throw new Error('Book missing seller information');
        }

        return {
            sellerId: bookData.userId,
            sellerEmail: bookData.userEmail || 'unknown@email.com',
            sellerName: bookData.userName || 'Unknown Seller',
            bookTitle: bookData.title,
            bookPrice: bookData.price,
        };
    } catch (error) {
        console.error('Error fetching seller info:', error);
        throw error;
    }
};

/**
 * Creates Flutterwave payment config
 * Uses NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY — never the secret key
 */
export const createFlutterwaveConfig = async (book, formData, userId) => {
    const publicKey = process.env.NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY;

    if (!publicKey) {
        throw new Error('Missing NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY in .env.local');
    }

    const sellerInfo = await getBookSellerInfo(book.id || book.firestoreId);

    const bookId = `firestore-${book.id || book.firestoreId}`.replace(
        'firestore-firestore-',
        'firestore-'
    );

    const config = {
        public_key: publicKey,           // ✅ public key only — never secret key on frontend
        tx_ref: `TXN${Date.now()}_${bookId}`,
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
            sellerId: sellerInfo.sellerId,
            sellerEmail: sellerInfo.sellerEmail,
            sellerName: sellerInfo.sellerName,
            bookId,
            bookTitle: book.title || sellerInfo.bookTitle,
            bookPrice: book.price || sellerInfo.bookPrice,
            userId,
            buyerEmail: formData.email,
            buyerName: formData.name,
        },
    };

    return config;
};

/**
 * Opens the Flutterwave payment modal
 */
export const handleFlutterwavePayment = async (config, onSuccess, onError, onClose) => {
    try {
        const FlutterwaveCheckout = await initializeFlutterwave();

        FlutterwaveCheckout({
            ...config,
            callback: (response) => {
                console.log('Payment callback:', response);
                onSuccess(response);
            },
            onclose: () => {
                console.log('Payment modal closed');
                onClose();
            },
        });
    } catch (error) {
        console.error('Flutterwave initialization error:', error);
        onError(error);
    }
};

/**
 * Verifies a book has valid seller info before initiating payment
 */
export const verifyBookHasSellerInfo = async (bookId) => {
    try {
        const sellerInfo = await getBookSellerInfo(bookId);
        return { valid: true, sellerInfo };
    } catch (error) {
        return { valid: false, error: error.message };
    }
};
