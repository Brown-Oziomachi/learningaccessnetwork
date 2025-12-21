
// ============================================
// 4. CREATE: /hooks/usePayment.js
// ============================================

import { useState } from 'react';
import { auth } from '@/lib/firebaseConfig';
import {
    createMinimalPurchaseRecord,
    savePurchaseToFirebase,
    getSellerInfo,
    updateSellerEarnings
} from '@/lib/paymentHelpers';
import {
    createFlutterwaveConfig,
    handleFlutterwavePayment
} from '@/lib/flutterwaveService';
import { renderPayPalButtons } from '@/lib/paypalService';

export const usePayment = (book, formData) => {
    const [processing, setProcessing] = useState(false);
    const [paymentSuccess, setPaymentSuccess] = useState(false);
    const [error, setError] = useState(null);

    const processFlutterwavePayment = async () => {
        if (!formData.email || !formData.phone || !formData.name) {
            alert('Please fill in all required fields');
            return;
        }

        setProcessing(true);
        setError(null);

        try {
            // Get seller info if applicable
            const sellerInfo = await getSellerInfo(book.sellerId || book.userId);

            // Create Flutterwave config
            const config = createFlutterwaveConfig(
                book,
                formData,
                auth.currentUser?.uid,
                sellerInfo
            );

            // Handle payment
            await handleFlutterwavePayment(
                config,
                async (response) => {
                    console.log('Payment Response:', response);
                    if (response.status === 'successful') {
                        // Update seller earnings if applicable
                        if (sellerInfo && sellerInfo.id !== 'platform') {
                            await updateSellerEarnings(
                                sellerInfo.id,
                                book.price,
                                book.title,
                                { email: formData.email, name: formData.name },
                                response.tx_ref
                            );
                        }

                        // Save purchase
                        await handlePaymentSuccess(response, 'flutterwave');
                    } else {
                        setProcessing(false);
                        alert('Payment failed. Please try again.');
                    }
                },
                (error) => {
                    setError(error);
                    setProcessing(false);
                },
                () => {
                    setProcessing(false);
                }
            );
        } catch (error) {
            console.error('Payment error:', error);
            setError(error);
            setProcessing(false);
        }
    };

    const processPayPalPayment = async () => {
        if (!formData.email || !formData.phone || !formData.name) {
            alert('Please fill in all required fields');
            return;
        }

        setProcessing(true);
        setError(null);

        try {
            await renderPayPalButtons(
                'paypal-button-container',
                book,
                async (details) => {
                    await handlePaymentSuccess(details, 'paypal');
                },
                (error) => {
                    setError(error);
                    setProcessing(false);
                    alert('Payment failed. Please try again.');
                },
                () => {
                    setProcessing(false);
                }
            );
        } catch (error) {
            console.error('PayPal error:', error);
            setError(error);
            setProcessing(false);
        }
    };

    const handlePaymentSuccess = async (paymentDetails, paymentMethod) => {
        try {
            const user = auth.currentUser;
            if (!user) {
                throw new Error('User not authenticated');
            }

            // Create minimal purchase record
            const purchaseRecord = createMinimalPurchaseRecord(book, paymentDetails, paymentMethod);

            // Save to Firebase
            await savePurchaseToFirebase(user.uid, purchaseRecord);

            // Also save to localStorage for backwards compatibility
            const purchased = JSON.parse(localStorage.getItem(`purchased_${user.email}`) || '[]');
            const alreadyPurchased = purchased.some(p => p.id === book.id);

            if (!alreadyPurchased) {
                purchased.push(purchaseRecord);
                localStorage.setItem(`purchased_${user.email}`, JSON.stringify(purchased));
            }

            setProcessing(false);
            setPaymentSuccess(true);

            return true;
        } catch (error) {
            console.error('Error processing payment success:', error);
            setError(error);
            setProcessing(false);
            return false;
        }
    };

    return {
        processing,
        paymentSuccess,
        error,
        processFlutterwavePayment,
        processPayPalPayment
    };
};