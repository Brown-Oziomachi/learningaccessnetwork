// utils/paymentProcessor.js

/**
 * Calculates the exact financial breakdown for a book purchase.
 * Standardized to ensure consistent object schemas for any downstream financial collections.
 */
export const calculatePaymentDistribution = (book, amount) => {
    const totalAmount = parseFloat(amount) || 0;
    // Explicit boolean check; treats anything that isn't explicitly a platform book as a marketplace book
    const isPlatformBook = book.source === 'platform' || book.isPlatformBook === true;

    if (isPlatformBook) {
        // Platform book: Platform owner retains 100% of the funds
        return {
            isPlatformBook: true,
            bookSource: 'platform',
            platformFee: totalAmount, // The platform's take is the entire amount
            sellerAmount: totalAmount,
            sellerReceivesPayment: true,
            distributionType: 'platform_owner_book',
            paymentSplit: '100% to platform owner',
            sellerDetails: {
                sellerId: book.sellerId || 'PLATFORM_ADMIN',
                sellerName: book.sellerName || 'Platform Admin',
                sellerEmail: book.sellerEmail || null,
                sellerPhone: book.sellerPhone || null,
                accountType: 'platform_owner'
            }
        };
    } else {
        // User-uploaded book: 80% to regular seller, 20% platform commission split
        const platformFee = Math.round(totalAmount * 0.20);
        const sellerAmount = totalAmount - platformFee;

        return {
            isPlatformBook: false,
            bookSource: book.source || 'firestore',
            platformFee: platformFee,
            sellerAmount: sellerAmount,
            sellerReceivesPayment: true,
            distributionType: 'user_seller_book',
            paymentSplit: '80% to seller, 20% to platform',
            sellerDetails: {
                sellerId: book.sellerId,
                sellerName: book.sellerName || 'Marketplace Seller',
                sellerEmail: book.sellerEmail || null,
                sellerPhone: book.sellerPhone || null,
                accountType: 'regular_seller'
            }
        };
    }
};

/**
 * Checks if an account exists that can safely receive virtual ledger credits.
 */
export const shouldCreditSeller = (book) => {
    if (!book || !book.sellerId) return false;

    // If it has a sellerId and isn't marked as platform, it's a valid user seller
    return true;
};

/**
 * Friendly helper primarily used to safely show payment details on the frontend UI
 */
export const getPaymentRecipient = (book) => {
    const isPlatformBook = book?.source === 'platform' || book?.isPlatformBook === true;

    if (isPlatformBook) {
        return {
            type: 'platform_owner',
            message: 'Payment will be credited to platform owner account',
            percentage: 100
        };
    } else {
        return {
            type: 'user_seller',
            message: 'Payment will be credited to seller account (80%)',
            percentage: 80
        };
    }
};