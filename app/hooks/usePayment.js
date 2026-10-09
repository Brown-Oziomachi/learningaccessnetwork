"use client"
import { useState, useEffect } from 'react';
import { db, auth } from '@/lib/firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';

// ─────────────────────────────────────────────────────────────────────────────
// Fallback exchange matrix (NGN base): same currencies as PaymentClient
// ─────────────────────────────────────────────────────────────────────────────
// CHANGED: was only NGN/GHS/KES/UGX. Any other currency (ZAR, XOF, XAF, EGP...)
// silently fell back to a 1.0 multiplier, so a buyer was charged e.g. R1500 for a ₦1500 book.
const FALLBACK_EXCHANGE_MATRIX = {
    NGN: 1, GHS: 0.010, KES: 0.11, UGX: 2.85,
    TZS: 2.62, RWF: 1.38, ZMW: 0.028, MWK: 1.77,
    EGP: 0.051, MAD: 0.105, ZAR: 0.019,
    XOF: 6.56, XAF: 6.56,
};

// Fetch live rates
// CHANGED: keep ALL live rates, not just 3 of them
const fetchLiveExchangeRates = async () => {
    try {
        const res = await fetch('https://open.er-api.com/v6/latest/NGN');
        if (!res.ok) throw new Error('Rate fetch failed');
        const data = await res.json();
        if (data?.rates) {
            return { ...FALLBACK_EXCHANGE_MATRIX, ...data.rates, NGN: 1, __live: true };
        }
        return { ...FALLBACK_EXCHANGE_MATRIX, __live: false };
    } catch {
        return { ...FALLBACK_EXCHANGE_MATRIX, __live: false };
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

const callApi = async (path, body) => {
    const user = auth.currentUser;
    if (!user) throw new Error('Please sign in again.');
    const res = await fetchWithTimeout(path, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${await user.getIdToken()}` },
        body: JSON.stringify(body || {}),
    }, 15000);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'Request failed.');
    return data;
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
        // NEW: don't charge a foreign currency before live rates are in
        if (targetCurrency !== 'NGN' && (!ratesLoaded || !exchangeMatrix.__live)) {
            setError({ message: "Live exchange rates are unavailable. Please pay in NGN or try again shortly." });
            return;
        }

        let regionalChargedAmount;
        if (targetCurrency === 'NGN') {
            regionalChargedAmount = Math.round(book.price);
        } else {
            const currencyScalar = exchangeMatrix[targetCurrency]
                || FALLBACK_EXCHANGE_MATRIX[targetCurrency];
            // NEW: refuse instead of silently using 1.0
            if (!currencyScalar) {
                setError({ message: `${targetCurrency} is not supported right now.` });
                return;
            }
            regionalChargedAmount = Math.round(book.price * currencyScalar * 100) / 100;
        }

        const txRef = `TXN-FLW-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        window.FlutterwaveCheckout({
            public_key: process.env.NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY,
            tx_ref: txRef,
            amount: regionalChargedAmount,
            currency: targetCurrency,
            payment_options: "card,ussd,banktransfer,mobilemoney,mpesa",
            // NEW: the webhook (Route D) requires userId + bookId, and uses negotiationId
            meta: {
                userId: auth.currentUser?.uid,
                bookId: book.id,
                negotiationId: book.negotiationId || extraData?.negotiationId || "",
            },
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

        const waitForPurchase = async (bookIdToCheck) => {
        const uid = auth.currentUser?.uid;
        if (!uid || !bookIdToCheck) return false;
        const clean = String(bookIdToCheck).replace('firestore-', '');
        for (let i = 0; i < 5; i++) {
            try {
                const snap = await getDoc(doc(db, 'users', uid));
                const pb = snap.data()?.purchasedBooks || {};
                if (pb[clean] || pb[bookIdToCheck]) return true;
            } catch { /* keep trying */ }
            await new Promise(r => setTimeout(r, 2000));
        }
        return false;
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
                    // The server loads the real price from the database
                    pin: enteredPin.toString().trim(),
                    email: formData?.email || null,
                    name: formData?.name || null,
                    // NEW: guarantee the negotiation id reaches /api/wallet-purchase
                    extraData: {
                        ...extraData,
                        negotiationId: extraData?.negotiationId || book.negotiationId || null,
                    },
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
            // The server may have finished after the browser gave up. Check before failing.
            if (err.message?.startsWith('Request timed out')) {
                const landed = await waitForPurchase(book?.id);
                if (landed) {
                    setPaymentSuccess(true);
                    setProcessing(false);
                    return;
                }
            }
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
    // PIN management helpers (UNCHANGED, still insecure, see note below)
    // ─────────────────────────────────────────────────────────────────────────
    const setupInitialPin = async (newPin) => {
        setProcessing(true);
        try {
            await callApi('/api/pin/set', { pin: String(newPin).trim() });
            return { success: true };
        } catch (e) {
            setError({ message: e.message });
            return { success: false };
        } finally { setProcessing(false); }
    };

    const requestPinReset = async () => {
        setProcessing(true);
        try {
            await callApi('/api/pin/reset/request');
            return { success: true };
        } catch (e) {
            setError({ message: e.message });
            return { success: false };
        } finally { setProcessing(false); }
    };

    const verifyOtpAndSetPin = async (enteredOtp, newPin) => {
        setProcessing(true);
        try {
            await callApi('/api/pin/reset/confirm', {
                otp: String(enteredOtp).trim(),
                newPin: String(newPin).trim(),
            });
            return true;
        } finally { setProcessing(false); }   // errors reach the dashboard's catch
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