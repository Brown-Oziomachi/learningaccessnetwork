"use client"
import { useState, useEffect } from 'react';
import { db, auth } from '@/lib/firebaseConfig';
import {
    doc, updateDoc, serverTimestamp,
    increment, getDoc, runTransaction, collection
} from 'firebase/firestore';

// ─────────────────────────────────────────────────────────────────────────────
// 📊 Fallback African Exchange Matrix (NGN base)
// ─────────────────────────────────────────────────────────────────────────────
const FALLBACK_EXCHANGE_MATRIX = {
    NGN: 1.0,
    GHS: 0.010,
    KES: 0.11,
    UGX: 2.85
};

// 🌐 Fetch live rates from exchangerate-api (free tier, no key needed)
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
        console.warn('[Exchange] Live rates unavailable, using fallback matrix');
        return FALLBACK_EXCHANGE_MATRIX;
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// Hook
// Parameters:
//   book         — the book object being purchased
//   formData     — { email, name, phone }
//   onSuccess    — callback(bookId, txRef) fired after a successful Flutterwave
//                  payment; use this in the parent to navigate to the reader
// ─────────────────────────────────────────────────────────────────────────────
export const usePayment = (book, formData, { onSuccess } = {}) => {
    const [processing, setProcessing] = useState(false);
    const [paymentSuccess, setPaymentSuccess] = useState(false);
    const [error, setError] = useState(null);
    const [flutterwaveLoaded, setFlutterwaveLoaded] = useState(false);
    const [newBalance, setNewBalance] = useState(null);
    const [showPin, setShowPin] = useState(false);
    const [withdrawalStep, setWithdrawalStep] = useState('INIT');
    const [tempWithdrawalData, setTempWithdrawalData] = useState(null);

    // 🌐 Live exchange rates state
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
            console.log('[Exchange] Rates loaded:', rates);
        });
    }, []);

    // ─────────────────────────────────────────────────────────────────────────
    // ROUTE A: Flutterwave checkout
    //
    // ⚠️  SECURITY BOUNDARY — CLIENT DOES ZERO DB WRITES ON THIS PATH ⚠️
    //
    // All database mutations for Flutterwave purchases are owned exclusively
    // by the backend webhook at /api/webhooks/flutterwave/route.js, which
    // uses the Firebase Admin SDK and Flutterwave's HMAC signature to verify
    // every event before writing. The client must not attempt to:
    //
    //   ✗  Write to `transactions` or any sub-collection
    //   ✗  Write to `purchasedBooks`
    //   ✗  Credit or debit any seller wallet document
    //   ✗  Fire email notifications
    //
    // Doing any of the above client-side risks double-increments and violates
    // Firestore security rules that are scoped to Admin SDK only for these
    // collections. The client's sole responsibility after a successful
    // Flutterwave callback is:
    //
    //   ✓  Update local UI state (paymentSuccess, processing)
    //   ✓  Optionally poll for webhook confirmation (read-only status check)
    //   ✓  Invoke onSuccess() so the parent can navigate to the reader
    // ─────────────────────────────────────────────────────────────────────────
    const processFlutterwavePayment = (extraData = {}, targetCurrency = 'NGN') => {
        if (!book || !formData.email) {
            setError({ message: "Please fill in your email before paying." });
            return;
        }
        if (!flutterwaveLoaded || !window.FlutterwaveCheckout) {
            setError({ message: "Payment gateway is still loading. Please try again." });
            return;
        }

        // 🎯 Convert price to the selected regional currency
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

            // ── Success callback ──────────────────────────────────────────────
            //
            // NO DB WRITES HERE. The backend webhook handles all persistence.
            // This block only manages UI state and hands off to the parent.
            //
            callback: async (response) => {
                if (response.status === "successful" || response.status === "completed") {
                    setProcessing(true);
                    setError(null);

                    try {
                        // Optional read-only status poll — verifies the webhook
                        // was received before surfacing success UI. Does not
                        // write anything; throws if the webhook hasn't landed
                        // yet, which is caught below and handled gracefully.
                        await pollForWebhookConfirmation(response.tx_ref);
                    } catch {
                        // Webhook may still be in-flight; Flutterwave guarantees
                        // delivery so we don't block the UX on this. The DB
                        // write will land shortly regardless.
                        console.warn('[Webhook] Confirmation poll timed out; proceeding to success UI.');
                    } finally {
                        setProcessing(false);
                    }

                    // ✅ Surface success state for the parent's toast / modal.
                    setPaymentSuccess(true);

                    // 🚀 Delegate navigation to the parent. The parent decides
                    //    whether to push to the reader route, show a modal, etc.
                    if (typeof onSuccess === 'function') {
                        onSuccess(book.id, response.tx_ref, extraData);
                    }
                } else {
                    setError({ message: "Payment was not completed. Please try again." });
                }
            },

            onclose: () => console.log("Flutterwave modal closed"),
        });
    };

    // ─────────────────────────────────────────────────────────────────────────
    // Read-only webhook confirmation poll (max ~8 s).
    // Calls a status route that checks whether the webhook has already written
    // to Firestore — never writes anything itself.
    // ─────────────────────────────────────────────────────────────────────────
    const pollForWebhookConfirmation = async (txRef, attempts = 4, delayMs = 2000) => {
        for (let i = 0; i < attempts; i++) {
            await new Promise(r => setTimeout(r, delayMs));
            const res = await fetch(`/api/transaction-status?tx_ref=${txRef}`);
            const data = await res.json();
            if (data?.status === 'completed') return true;
        }
        throw new Error('Webhook not confirmed within timeout');
    };

    // ─────────────────────────────────────────────────────────────────────────
    // ROUTE B: Wallet payment
    //
    // Wallet payments cannot go through a Flutterwave webhook because there is
    // no external payment event to listen for. The client therefore owns these
    // specific writes, scoped only to:
    //
    //   ✓  Deducting the buyer's wallet balance via a Firestore transaction
    //      (atomic, with PIN verification inline)
    //   ✓  Delegating the transaction ledger row + purchasedBooks entry to
    //      the server action at /api/wallet-purchase, which uses Admin SDK
    //
    // The client still does NOT write to `transactions` or `purchasedBooks`
    // directly — that remains server-side via recordWalletTransaction().
    // ─────────────────────────────────────────────────────────────────────────
    const processWalletPayment = async (enteredPin, extraData = {}) => {
        setProcessing(true);
        setError(null);
        try {
            const currentUser = auth.currentUser;
            if (!currentUser) throw new Error("Please log in.");
            if (!enteredPin || enteredPin.toString().trim().length < 4) {
                throw new Error("Please enter your 4-digit PIN.");
            }

            const sellerRef = doc(db, 'sellers', currentUser.uid);
            let updatedBalance = null;

            // Deduct balance atomically, verify PIN
            await runTransaction(db, async (transaction) => {
                const sellerSnap = await transaction.get(sellerRef);
                if (!sellerSnap.exists()) throw new Error("Wallet not active. Become a seller to use LAN wallet");

                const sellerData = sellerSnap.data();
                const storedValue = sellerData.transactionPin || sellerData.transferPin;

                if (storedValue === undefined || storedValue === null) throw new Error("PIN_NOT_SET");
                if (enteredPin.toString().trim() !== storedValue.toString().trim()) throw new Error("Incorrect PIN. Please try again.");

                const currentBalance = sellerData.accountBalance || 0;
                if (currentBalance < book.price) throw new Error(`Insufficient funds. Balance: ₦${currentBalance.toLocaleString()}`);

                updatedBalance = currentBalance - book.price;
                transaction.update(sellerRef, {
                    accountBalance: updatedBalance,
                    updatedAt: serverTimestamp(),
                });
            });

            // Persist the transaction record + grant book access server-side
            await recordWalletTransaction({
                userId: currentUser.uid,
                bookId: book.id,
                bookTitle: book.title,
                amount: book.price,
                extraData,
                email: formData.email,
                name: formData.name,
            });

            setNewBalance(updatedBalance);
            setPaymentSuccess(true);

            if (typeof onSuccess === 'function') {
                onSuccess(book.id, `WAL-${Date.now()}`, extraData);
            }
        } catch (err) {
            setError({
                message: err.message === "PIN_NOT_SET"
                    ? "You haven't set a PIN yet. Please set pin to continue."
                    : err.message
            });
        } finally {
            setProcessing(false);
        }
    };

    // ─────────────────────────────────────────────────────────────────────────
    // Server action: record the wallet transaction + grant book access.
    // Keeps the client free of multi-collection write logic for wallet path.
    // Used exclusively by processWalletPayment — NOT called on the Flutterwave
    // path (the webhook handles that instead).
    // ─────────────────────────────────────────────────────────────────────────
    const recordWalletTransaction = async (payload) => {
        const res = await fetch('/api/wallet-purchase', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });
        if (!res.ok) {
            const { error } = await res.json().catch(() => ({}));
            throw new Error(error || 'Failed to record wallet purchase.');
        }
        return res.json();
    };

    // ─────────────────────────────────────────────────────────────────────────
    // ROUTE C: Withdrawal
    // ─────────────────────────────────────────────────────────────────────────
    const processWithdrawal = async (amount, pin, otp = null) => {
        setProcessing(true);
        setError(null);
        const WITHDRAWAL_THRESHOLD = 5000;
        try {
            const currentUser = auth.currentUser;
            if (!currentUser) throw new Error("Authentication required.");

            const sellerRef = doc(db, 'sellers', currentUser.uid);
            const sellerSnap = await getDoc(sellerRef);
            const sellerData = sellerSnap.data();

            if (pin.toString().trim() !== sellerData.transactionPin?.toString().trim()) {
                throw new Error("Incorrect PIN.");
            }

            if (amount > WITHDRAWAL_THRESHOLD && !otp) {
                const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
                await updateDoc(sellerRef, {
                    withdrawalOtp: generatedOtp,
                    otpExpiry: Date.now() + 600000,
                });
                setTempWithdrawalData({ amount, pin });
                setWithdrawalStep('OTP_REQUIRED');
                return { status: "OTP_SENT" };
            }

            if (otp) {
                if (otp !== sellerData.withdrawalOtp || Date.now() > sellerData.otpExpiry) {
                    throw new Error("Invalid or expired OTP.");
                }
            }

            await runTransaction(db, async (transaction) => {
                const freshSnap = await transaction.get(sellerRef);
                const balance = freshSnap.data().accountBalance || 0;
                if (balance < amount) throw new Error("Insufficient funds.");
                transaction.update(sellerRef, {
                    accountBalance: increment(-amount),
                    withdrawalOtp: null,
                    otpExpiry: null,
                });
                const withdrawalLogRef = doc(collection(db, 'withdrawals'));
                transaction.set(withdrawalLogRef, {
                    userId: currentUser.uid,
                    amount,
                    status: 'completed',
                    type: 'withdrawal',
                    createdAt: serverTimestamp(),
                });
            });

            setPaymentSuccess(true);
            setWithdrawalStep('COMPLETED');
        } catch (err) {
            setError({ message: err.message });
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
            if (!currentUser) throw new Error("Auth required");
            const sellerRef = doc(db, 'sellers', currentUser.uid);
            await updateDoc(sellerRef, {
                transactionPin: newPin.toString().trim(),
                transferPin: newPin.toString().trim(),
                updatedAt: serverTimestamp(),
            });
            return { success: true };
        } catch {
            setError({ message: "Failed to set PIN. Please try again." });
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
            throw new Error("Invalid or expired code.");
        }
    };

    // ─────────────────────────────────────────────────────────────────────────
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