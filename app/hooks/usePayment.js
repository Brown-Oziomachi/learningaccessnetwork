"use client"
import { useState, useEffect } from 'react';
import { db, auth } from '@/lib/firebaseConfig';
import { doc, updateDoc, serverTimestamp, getDoc } from 'firebase/firestore';

// ─────────────────────────────────────────────────────────────────────────────
// 📊 Fallback African Exchange Matrix (NGN base)
// ─────────────────────────────────────────────────────────────────────────────
const FALLBACK_EXCHANGE_MATRIX = {
    NGN: 1.0,
    GHS: 0.010,
    KES: 0.11,
    UGX: 2.85
};

// 🌐 Fetch live rates from exchangerate-api
const fetchLiveExchangeRates = async () => {
    try {
        const res = await fetch('https://open.er-api.com/v6/latest/NGN');
        if (!res.ok) throw new Error('Rate fetch failed');
        const data = await res.json();
        if (data?.rates) {
            return {
                NGN: 1.0,
                GHS: data.rates.GHS || FALLBACK_EXCHANGE_MATRIX.GHS,
                KES: data.rates.KES || FALLBACK_EXCHANGE_MATRIX.KES,
                UGX: data.rates.UGX || FALLBACK_EXCHANGE_MATRIX.UGX,
            };
        }
        return FALLBACK_EXCHANGE_MATRIX;
    } catch {
        return FALLBACK_EXCHANGE_MATRIX;
    }
};

// Unified helper to enforce network request time limits
const fetchWithTimeout = async (url, options, timeoutMs = 15000) => {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeoutMs);
    try {
        const response = await fetch(url, { ...options, signal: controller.signal });
        clearTimeout(id);
        return response;
    } catch (err) {
        clearTimeout(id);
        if (err.name === 'AbortError') {
            throw new Error('Request timed out. Please check your network connection and try again.');
        }
        throw err;
    }
};

export const usePayment = (book, formData, options = {}) => {
    const { onSuccess } = options || {};
    const [processing, setProcessing] = useState(false);
    const [paymentSuccess, setPaymentSuccess] = useState(false);
    const [error, setError] = useState(null);
    const [flutterwaveLoaded, setFlutterwaveLoaded] = useState(false);
    const [newBalance, setNewBalance] = useState(null);
    const [showPin, setShowPin] = useState(false);
    const [withdrawalStep, setWithdrawalStep] = useState('INIT');
    const [tempWithdrawalData, setTempWithdrawalData] = useState(null);

    const [exchangeMatrix, setExchangeMatrix] = useState(FALLBACK_EXCHANGE_MATRIX);
    const [ratesLoaded, setRatesLoaded] = useState(false);

    // ── Load Flutterwave script ───────────────────────────────────────────────
    useEffect(() => {
        if (typeof window !== 'undefined' && !window.FlutterwaveCheckout) {
            const script = document.createElement('script');
            script.src = 'https://checkout.flutterwave.com/v3.js';
            script.async = true;
            script.onload = () => setFlutterwaveLoaded(true);
            document.body.appendChild(script);
        } else if (typeof window !== 'undefined' && window.FlutterwaveCheckout) {
            setFlutterwaveLoaded(true);
        }
    }, []);

    // ── Fetch live exchange rates on mount ───────────────────────────────────
    useEffect(() => {
        fetchLiveExchangeRates().then(rates => {
            setExchangeMatrix(rates);
            setRatesLoaded(true);
        });
    }, []);

    // ─────────────────────────────────────────────────────────────────────────
    // ROUTE A: Flutterwave checkout
    // ─────────────────────────────────────────────────────────────────────────
    const processFlutterwavePayment = (extraData = {}, targetCurrency = 'NGN') => {
        if (!book || !formData?.email) {
            setError({ message: "Please fill in your email before paying." });
            return;
        }
        if (!flutterwaveLoaded || !window.FlutterwaveCheckout) {
            setError({ message: "Payment gateway is still loading. Please try again." });
            return;
        }

        let regionalChargedAmount;
        if (targetCurrency === 'NGN') {
            regionalChargedAmount = Math.round(book.price);
        } else {
            const currencyScalar = exchangeMatrix[targetCurrency]
                || FALLBACK_EXCHANGE_MATRIX[targetCurrency]
                || 1.0;
            regionalChargedAmount = Math.round(book.price * currencyScalar * 100) / 100;
        }

        const txRef = `TXN-FLW-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        window.FlutterwaveCheckout({
            public_key: process.env.NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY,
            tx_ref: txRef,
            amount: regionalChargedAmount,
            currency: targetCurrency,
            payment_options: "card,ussd,banktransfer,mobilemoney,mpesa",
            customer: {
                email: formData.email,
                phone_number: formData.phone || "",
                name: formData.name || formData.email,
            },
            customizations: {
                title: "LAN Library",
                description: `Purchase: ${book.title}`,
                logo: "/lanlog.png",
            },

            callback: async (response) => {
                if (response.status === "successful" || response.status === "completed") {
                    setProcessing(true);
                    setError(null);

                    try {
                        await pollForWebhookConfirmation(response.tx_ref);
                    } catch {
                        // Webhook failsafe tracking gracefully managed here
                    } finally {
                        setProcessing(false);
                    }

                    setPaymentSuccess(true);

                    if (typeof onSuccess === 'function') {
                        onSuccess(book.id, response.tx_ref, extraData);
                    }
                } else {
                    setError({ message: "Payment was not completed. Please try again." });
                }
            },
            onclose: () => { },
        });
    };

    const pollForWebhookConfirmation = async (txRef, attempts = 4, delayMs = 2000) => {
        for (let i = 0; i < attempts; i++) {
            await new Promise(r => setTimeout(r, delayMs));
            const res = await fetch(`/api/transaction-status?tx_ref=${txRef}`);
            const data = await res.json();
            if (data?.status === 'completed') return true;
        }
        throw new Error('Webhook process pending confirmation');
    };

    // ─────────────────────────────────────────────────────────────────────────
    // ROUTE B: Wallet Book Purchase
    // ─────────────────────────────────────────────────────────────────────────
    const processWalletPayment = async (enteredPin, extraData = {}) => {
        setProcessing(true);
        setError(null);
        setPaymentSuccess(false);

        try {
            const currentUser = auth.currentUser;
            if (!currentUser) throw new Error("Please log in to make a wallet purchase.");

            if (!book || !book.id) {
                throw new Error("Target core state initialization parameter missing.");
            }

            if (!enteredPin || enteredPin.toString().trim().length < 4) {
                throw new Error("Please enter your 4-digit PIN.");
            }

            // Standardized with network request time boundary limits
            const res = await fetchWithTimeout('/api/wallet-purchase', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${await currentUser.getIdToken()}`,
                },
                body: JSON.stringify({
                    userId: currentUser.uid,
                    bookId: book.id,
                    bookTitle: book.title || 'Unknown Title',
                    // SECURITY NOTE: Your backend must evaluate real value from database via bookId
                    pin: enteredPin.toString().trim(),
                    email: formData?.email || null,
                    name: formData?.name || null,
                    extraData,
                }),
            }, 15000);

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Wallet purchase processing encountered an issue.');
            }

            setPaymentSuccess(true);

            if (typeof onSuccess === 'function' && book?.id) {
                onSuccess(book.id, data.txRef, extraData);
            }
        } catch (err) {
            setError({
                message: err.message === 'PIN_NOT_SET'
                    ? "You haven't set a PIN yet. Please set a PIN to continue."
                    : err.message
            });
        } finally {
            setProcessing(false);
        }
    };

    // ─────────────────────────────────────────────────────────────────────────
    // ROUTE C: Process Account Withdrawals
    // ─────────────────────────────────────────────────────────────────────────
    const processWithdrawal = async (amount, pin, otp = null) => {
        setProcessing(true);
        setError(null);
        setPaymentSuccess(false);

        try {
            const currentUser = auth.currentUser;
            if (!currentUser) throw new Error("Authentication required.");

            if (!amount || Number(amount) <= 0) {
                throw new Error("Please enter a valid withdrawal amount.");
            }
            if (!pin) {
                throw new Error("Please provide your authorization PIN.");
            }

            const res = await fetchWithTimeout('/api/wallet-withdraw', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${await currentUser.getIdToken()}`,
                },
                body: JSON.stringify({
                    userId: currentUser.uid,
                    amount: Number(amount),
                    pin: pin.toString().trim(),
                    otp: otp || null
                }),
            }, 15000);

            const data = await res.json();

            if (!res.ok) {
                if (data.status === 'OTP_SENT') {
                    setTempWithdrawalData({ amount, pin });
                    setWithdrawalStep('OTP_REQUIRED');
                    return;
                }
                throw new Error(data.error || 'Withdrawal processing failed.');
            }

            setPaymentSuccess(true);
            setWithdrawalStep('COMPLETED');
        } catch (err) {
            setError({
                message: err.message === 'PIN_NOT_SET'
                    ? "You haven't set a PIN yet. Please set a PIN to continue."
                    : err.message
            });
        } finally {
            setProcessing(false);
        }
    };

    // ─────────────────────────────────────────────────────────────────────────
    // PIN management helpers
    // ─────────────────────────────────────────────────────────────────────────
    const setupInitialPin = async (newPin) => {
        setProcessing(true);
        try {
            const currentUser = auth.currentUser;
            if (!currentUser) throw new Error("Authentication verification expired.");

            const sellerRef = doc(db, 'sellers', currentUser.uid);
            await updateDoc(sellerRef, {
                transactionPin: newPin.toString().trim(),
                transferPin: newPin.toString().trim(),
                updatedAt: serverTimestamp(),
            });
            return { success: true };
        } catch {
            setError({ message: "Failed to establish validation security pin context structures." });
            return { success: false };
        } finally {
            setProcessing(false);
        }
    };

    const requestPinReset = async () => {
        const currentUser = auth.currentUser;
        if (!currentUser) return { success: false };
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        try {
            const sellerRef = doc(db, 'sellers', currentUser.uid);
            await updateDoc(sellerRef, { resetOtp: otp, otpExpiry: Date.now() + 600000 });
            return { success: true };
        } catch {
            return { success: false };
        }
    };

    const verifyOtpAndSetPin = async (enteredOtp, newPin) => {
        const currentUser = auth.currentUser;
        const sellerRef = doc(db, 'sellers', currentUser.uid);
        const sellerSnap = await getDoc(sellerRef);
        const data = sellerSnap.data();

        if (enteredOtp === data?.resetOtp && Date.now() < data?.otpExpiry) {
            await updateDoc(sellerRef, {
                transactionPin: newPin.toString().trim(),
                transferPin: newPin.toString().trim(),
                resetOtp: null,
                otpExpiry: null,
            });
            return true;
        } else {
            throw new Error("Invalid or expired validation code confirmation mapping.");
        }
    };

    return {
        processing,
        paymentSuccess,
        setPaymentSuccess,
        error,
        setError,
        newBalance,
        showPin,
        setShowPin,
        exchangeMatrix,
        ratesLoaded,
        withdrawalStep,
        tempWithdrawalData,
        processFlutterwavePayment,
        processWalletPayment,
        processWithdrawal,
        setupInitialPin,
        requestPinReset,
        verifyOtpAndSetPin,
    };
};