
// ============================================
// 2. CREATE: /lib/flutterwaveService.js
// ============================================

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

export const createFlutterwaveConfig = (book, formData, userId, sellerInfo = null) => {
    return {
        public_key: 'FLWPUBK_TEST-4bcf55a81b93a172d06a778a532937db-X',
        tx_ref: `TXN${Date.now()}_${book.id}`,
        amount: book.price,
        currency: 'NGN',
        payment_options: 'card,ussd,bank_transfer',
        customer: {
            email: formData.email,
            phone_number: formData.phone,
            name: formData.name,
        },
        customizations: {
            title: 'LAN Library',
            description: `Payment for ${book.title}`,
            logo: 'https://yourwebsite.com/logo.png',
        },
        meta: {
            sellerId: sellerInfo?.id || 'platform',
            sellerEmail: sellerInfo?.email || 'admin@lanlibrary.com',
            sellerName: sellerInfo?.name || 'LAN Library',
            bookTitle: book.title,
            bookId: book.firestoreId || book.id,
            buyerId: userId,
            buyerEmail: formData.email,
            buyerName: formData.name
        }
    };
};

export const handleFlutterwavePayment = async (config, onSuccess, onError, onClose) => {
    try {
        const FlutterwaveCheckout = await initializeFlutterwave();

        FlutterwaveCheckout({
            ...config,
            callback: onSuccess,
            onclose: onClose
        });
    } catch (error) {
        console.error('Flutterwave initialization error:', error);
        onError(error);
    }
};