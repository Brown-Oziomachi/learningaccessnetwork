"use client"
// lib/flutterwaveService.js

import { db } from '@/lib/firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';

// ─────────────────────────────────────────────────────────────────────────────
// Script loader
// ─────────────────────────────────────────────────────────────────────────────
export const initializeFlutterwave = () => {
    return new Promise((resolve, reject) => {
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
                reject(new Error('Flutterwave SDK failed to expose FlutterwaveCheckout'));
            }
        };
        script.onerror = () => reject(new Error('Failed to load Flutterwave SDK'));
        document.body.appendChild(script);
    });
};

// ─────────────────────────────────────────────────────────────────────────────
// Seller info fetcher — read-only Firestore lookup, no writes
// ─────────────────────────────────────────────────────────────────────────────
export const getBookSellerInfo = async (bookId) => {
    try {
        const cleanBookId = bookId.replace('firestore-', '');
        const bookDoc = await getDoc(doc(db, 'advertMyBook', cleanBookId));

        if (!bookDoc.exists()) throw new Error(`Book not found: ${cleanBookId}`);

        const bookData = bookDoc.data();
        if (!bookData.userId) throw new Error('Book document is missing seller userId');

        return {
            sellerId: bookData.userId,
            sellerEmail: bookData.userEmail || 'unknown@email.com',
            sellerName: bookData.userName || 'Unknown Seller',
            bookTitle: bookData.title,
            bookPrice: bookData.price,
        };
    } catch (error) {
        console.error('[FlutterwaveService] getBookSellerInfo error:', error);
        throw error;
    }
};

export const createFlutterwaveConfig = async (book, formData, userId, currency = 'NGN') => {
    // ── FIX 1: Guard userId before the modal opens, not after money moves ──
    if (!userId || typeof userId !== 'string' || userId.trim() === '') {
        throw new Error(
            'createFlutterwaveConfig: userId is required. ' +
            'Ensure the user is authenticated before initiating payment.'
        );
    }

    const publicKey = process.env.NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY;
    if (!publicKey) {
        throw new Error('Missing NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY in environment config');
    }

    const sellerInfo = await getBookSellerInfo(book.id || book.firestoreId);

    const rawId = book.id || book.firestoreId;
    const bookId = rawId.startsWith('firestore-') ? rawId : `firestore-${rawId}`;

    const txRef = `BOOK-FLW-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    return {
        public_key: publicKey,
        tx_ref: txRef,
        amount: book.price || sellerInfo.bookPrice,
        currency,
        payment_options: 'card,ussd,bank_transfer',
        customer: {
            email: formData.email,
            phone_number: formData.phone || '',
            name: formData.name || formData.email,
        },
        customizations: {
            title: 'LAN Library — Digital Publication',
            description: `Payment for ${book.title || sellerInfo.bookTitle}`,
            logo: '/lanlog.png',
        },

  
        meta: {
            userId,                                          // 🔑 required by webhook Route D
            bookId,                                          // 🔑 required by webhook Route D
            sellerId: sellerInfo.sellerId,                // seller wallet credit
            sellerEmail: sellerInfo.sellerEmail,             // sale alert email
            sellerName: sellerInfo.sellerName,              // sale alert email
            bookTitle: book.title || sellerInfo.bookTitle, // ledger + receipt
            bookPrice: book.price || sellerInfo.bookPrice, // authoritative price ref
            buyerEmail: formData.email,                     // receipt email
            buyerName: formData.name || formData.email,   // receipt email
            currency,                                        // explicit ledger record
        },
    };
};

// ─────────────────────────────────────────────────────────────────────────────
// All transaction recording is the exclusive responsibility of the webhook.
// ─────────────────────────────────────────────────────────────────────────────
export const handleFlutterwavePayment = async (config, onSuccess, onError, onClose) => {
    try {
        const FlutterwaveCheckout = await initializeFlutterwave();

        FlutterwaveCheckout({
            ...config,

            callback: (response) => {
                if (response.status === 'successful' || response.status === 'completed') {
                    onSuccess(response);
                } else {
                    // Flutterwave can invoke callback with status 'failed';
                    // treat it as an error rather than silently ignoring it.
                    onError(new Error(`Payment returned status: ${response.status}`));
                }
            },

            onclose: () => {
                onClose?.();
            },
        });
    } catch (error) {
        console.error('[FlutterwaveService] Modal initialization error:', error);
        onError(error);
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// Pre-flight seller verification — read-only, used before opening modal
// ─────────────────────────────────────────────────────────────────────────────
export const verifyBookHasSellerInfo = async (bookId) => {
    try {
        const sellerInfo = await getBookSellerInfo(bookId);
        return { valid: true, sellerInfo };
    } catch (error) {
        return { valid: false, error: error.message };
    }
};