
export const calculatePaymentDistribution = (book, amount) => {
    const isPlatformBook = book.source === 'platform' || book.isPlatformBook === true;

    if (isPlatformBook) {
        // Platform book: Platform owner gets 100%
        return {
            isPlatformBook: true,
            bookSource: 'platform',
            platformAmount: 0, 
            platformFee: 0,
            sellerAmount: amount, // Platform owner gets full amount
            sellerReceivesPayment: true, // YES, platform owner gets paid
            distributionType: 'platform_owner_book',
            paymentSplit: '100% to platform owner',
            sellerDetails: {
                sellerId: book.sellerId,
                sellerName: book.sellerName,
                sellerEmail: book.sellerEmail,
                sellerPhone: book.sellerPhone,
                accountType: 'platform_owner'
            }
        };
    } else {
        // User-uploaded book: Seller gets 85%, Platform gets 15%
        const platformFee = Math.round(amount * 0.15);
        const sellerAmount = amount - platformFee;

        return {
            isPlatformBook: false,
            bookSource: 'firestore',
            platformAmount: platformFee,
            platformFee: platformFee,
            sellerAmount: sellerAmount,
            sellerReceivesPayment: true, // YES, user seller gets paid
            distributionType: 'user_seller_book',
            paymentSplit: '85% to seller, 15% to platform',
            sellerDetails: {
                sellerId: book.sellerId,
                sellerName: book.sellerName,
                sellerEmail: book.sellerEmail,
                sellerPhone: book.sellerPhone,
                accountType: 'regular_seller'
            }
        };
    }
};

export const shouldCreditSeller = (book) => {
    // Platform books: Credit platform owner
    if (book.source === 'platform' || book.isPlatformBook) {
        return book.sellerId ? true : false;
    }

    // Firestore books: Credit user seller
    if (book.source === 'firestore' && book.sellerId) {
        return true;
    }

    return false;
};

export const getPaymentRecipient = (book) => {
    if (book.source === 'platform' || book.isPlatformBook) {
        return {
            type: 'platform_owner',
            message: 'Payment will be credited to platform owner account',
            percentage: 100
        };
    } else {
        return {
            type: 'user_seller',
            message: 'Payment will be credited to seller account (85%)',
            percentage: 85
        };
    }
};