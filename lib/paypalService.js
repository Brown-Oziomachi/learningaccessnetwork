
// ============================================
// 3. CREATE: /lib/paypalService.js
// ============================================

export const initializePayPal = (clientId = 'YOUR_PAYPAL_CLIENT_ID') => {
    return new Promise((resolve, reject) => {
        if (window.paypal) {
            resolve(window.paypal);
            return;
        }

        const existingScript = document.getElementById("paypal-sdk");
        if (existingScript) {
            existingScript.remove();
        }

        const script = document.createElement("script");
        script.id = "paypal-sdk";
        script.src = `https://www.paypal.com/sdk/js?client-id=${clientId}&currency=USD`;
        script.async = true;

        script.onload = () => {
            if (window.paypal) {
                resolve(window.paypal);
            } else {
                reject(new Error('PayPal SDK failed to load'));
            }
        };

        script.onerror = () => reject(new Error('Failed to load PayPal SDK'));
        document.body.appendChild(script);
    });
};

export const renderPayPalButtons = async (containerId, book, onApprove, onError, onCancel) => {
    try {
        const paypal = await initializePayPal();
        const container = document.getElementById(containerId);

        if (!container) {
            throw new Error('PayPal container not found');
        }

        container.innerHTML = '';

        paypal.Buttons({
            createOrder: (data, actions) => {
                return actions.order.create({
                    purchase_units: [{
                        amount: {
                            value: (book.price / 1500).toFixed(2),
                            currency_code: 'USD'
                        },
                        description: `${book.title} - ${book.author}`
                    }]
                });
            },
            onApprove: async (data, actions) => {
                const details = await actions.order.capture();
                onApprove(details);
            },
            onError: (err) => {
                console.error('PayPal Error:', err);
                onError(err);
            },
            onCancel: onCancel
        }).render(`#${containerId}`);

    } catch (error) {
        console.error('PayPal rendering error:', error);
        throw error;
    }
};