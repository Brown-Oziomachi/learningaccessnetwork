// ============================================
// 1. CREATE: /lib/paymentHelpers.js
// ============================================

import { doc, getDoc, updateDoc, setDoc, arrayUnion, addDoc, collection } from 'firebase/firestore';
import { db } from './firebaseConfig';

/**
 * Minimal purchase record to avoid Firestore size limits
 */
export const createMinimalPurchaseRecord = (book, paymentDetails, paymentMethod) => {
    return {
        id: book.id,
        title: book.title,
        author: book.author,
        price: book.price,
        purchasedAt: new Date().toISOString(),
        transactionId: paymentDetails.tx_ref || paymentDetails.id || `TXN${Date.now()}`,
        paymentMethod: paymentMethod,
        status: 'completed'
    };
};

/**
 * Save purchase to user's document
 */
export const savePurchaseToFirebase = async (userId, purchaseRecord) => {
    try {
        const userDocRef = doc(db, 'users', userId);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
            await updateDoc(userDocRef, {
                purchasedBooks: arrayUnion(purchaseRecord)
            });
        } else {
            await setDoc(userDocRef, {
                purchasedBooks: [purchaseRecord],
                createdAt: new Date().toISOString()
            });
        }

        console.log('Purchase saved successfully');
        return true;
    } catch (error) {
        console.error('Error saving purchase:', error);
        throw error;
    }
};

/**
 * Get seller information
 */
export const getSellerInfo = async (sellerId) => {
    try {
        if (!sellerId) return null;

        const sellerDoc = await getDoc(doc(db, "users", sellerId));
        if (sellerDoc.exists()) {
            const data = sellerDoc.data();
            return {
                id: sellerId,
                email: data.email,
                name: data.displayName || `${data.firstName || ''} ${data.surname || ''}`.trim()
            };
        }
        return null;
    } catch (error) {
        console.error("Error fetching seller info:", error);
        return null;
    }
};

/**
 * Update seller earnings (80/20 split)
 */
export const updateSellerEarnings = async (sellerId, amount, bookTitle, buyerInfo, txRef) => {
    try {
        console.log('Updating seller earnings for:', sellerId);

        const saleAmount = parseFloat(amount);
        const commission = saleAmount * 0.20;
        const sellerEarning = saleAmount * 0.80;

        const sellerRef = doc(db, "sellers", sellerId);
        const sellerDoc = await getDoc(sellerRef);

        if (sellerDoc.exists()) {
            const sellerData = sellerDoc.data();
            const currentBalance = sellerData.accountBalance || 0;
            const currentEarnings = sellerData.totalEarnings || 0;
            const currentBooksSold = sellerData.booksSold || 0;

            await updateDoc(sellerRef, {
                accountBalance: currentBalance + sellerEarning,
                totalEarnings: currentEarnings + sellerEarning,
                booksSold: currentBooksSold + 1,
                updatedAt: new Date()
            });
        } else {
            await setDoc(sellerRef, {
                accountBalance: sellerEarning,
                totalEarnings: sellerEarning,
                booksSold: 1,
                createdAt: new Date(),
                updatedAt: new Date()
            });
        }

        // Create transaction record
        await addDoc(collection(db, "transactions"), {
            sellerId: sellerId,
            bookTitle: bookTitle,
            buyerEmail: buyerInfo.email,
            buyerName: buyerInfo.name,
            amount: saleAmount,
            commission: commission,
            netEarning: sellerEarning,
            txRef: txRef,
            date: new Date(),
            status: "completed"
        });

        console.log(`Seller earnings updated: +₦${sellerEarning}`);

        // Optional: Send notification email
        try {
            await fetch('/api/send-seller-notification', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sellerId,
                    bookTitle,
                    amount: saleAmount,
                    netEarning: sellerEarning,
                    buyerEmail: buyerInfo.email
                })
            });
        } catch (err) {
            console.log('Email notification error:', err);
        }

        return { success: true, earning: sellerEarning };
    } catch (error) {
        console.error('Error updating seller earnings:', error);
        return { success: false, error };
    }
};
