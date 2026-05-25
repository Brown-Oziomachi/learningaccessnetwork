"use client"
import { useState, useEffect } from 'react';
import { db, auth } from '@/lib/firebaseConfig';
import {
    collection, addDoc, doc, updateDoc, serverTimestamp,
    increment, getDoc, runTransaction
} from 'firebase/firestore';
import { qualifyReferral } from '@/lib/referralUtils';

// 📊 Fallback African Exchange Matrix (NGN base)
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

const calculatePaymentDistribution = (book) => {
    const isPlatformBook = book.source === 'platform' || book.isPlatformBook === true;
    if (isPlatformBook) {
        return {
            isPlatformBook: true,
            platformFee: 0,
            sellerAmount: book.price,
            distributionType: 'platform_owner_book'
        };
    } else {
        return {
            isPlatformBook: false,
            platformFee: Math.round(book.price * 0.20),
            sellerAmount: Math.round(book.price * 0.80),
            distributionType: 'user_seller_book'
        };
    }
};

const triggerEmailNotifications = async (buyerEmail, buyerName, bookItem, sellerInfo, orderId) => {
    const distribution = calculatePaymentDistribution(bookItem);
    try {
        fetch('/api/send-seller-notification', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                type: 'order_receipt',
                to: buyerEmail,
                buyerName: buyerName || "Reader",
                bookTitle: bookItem.title,
                amount: bookItem.price,
                sellerName: sellerInfo?.name || "LAN Library",
                orderId: orderId
            })
        }).catch(err => console.error("[Mail System] Buyer receipt failed:", err));

        if (sellerInfo?.email && !distribution.isPlatformBook) {
            fetch('/api/send-seller-notification', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'sale_alert',
                    to: sellerInfo.email,
                    userId: sellerInfo.id,
                    sellerName: sellerInfo.name || "Seller",
                    bookTitle: bookItem.title,
                    amount: bookItem.price,
                    netEarning: distribution.sellerAmount,
                    buyerEmail: buyerEmail,
                    currentBalance: (Number(sellerInfo.accountBalance) || 0) + distribution.sellerAmount
                })
            }).catch(err => console.error("[Mail System] Seller sale alert failed:", err));
        }
    } catch (e) {
        console.error("[Mail System] Notification error:", e);
    }
};

export const usePayment = (book, formData, sellerDetails) => {
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

    // Load Flutterwave script
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

    // 🌐 Fetch live exchange rates on mount
    useEffect(() => {
        fetchLiveExchangeRates().then(rates => {
            setExchangeMatrix(rates);
            setRatesLoaded(true);
            console.log('[Exchange] Rates loaded:', rates);
        });
    }, []);

    const saveTransaction = async (paymentData, status = 'completed', extraData = {}, targetCurrency = 'NGN') => {
        try {
            const distribution = calculatePaymentDistribution(book);
            const currentUser = auth.currentUser;
            if (!currentUser) throw new Error('User not authenticated');

            const transactionData = {
                transactionId: paymentData?.transaction_id || paymentData?.tx_ref || `WAL-${Date.now()}`,
                transactionRef: paymentData?.tx_ref || `TXN-WAL-${Date.now()}`,
                status,
                amount: book.price,
                currency: targetCurrency,
                paymentMethod: paymentData?.payment_type || 'lan_wallet',
                bookId: book.id,
                bookTitle: book.title,
                buyerId: currentUser.uid,
                buyerEmail: formData.email,
                buyerName: formData.name || null,
                buyerPhone: formData.phone || null,
                studentRegNo: extraData.studentRegNo || null,
                department: extraData.department || null,
                sellerId: distribution.isPlatformBook ? 'platform' : (sellerDetails?.id || null),
                platformFee: distribution.platformFee,
                sellerAmount: distribution.sellerAmount,
                exchangeRateUsed: exchangeMatrix[targetCurrency] || 1.0,
                createdAt: serverTimestamp(),
            };

            const transactionRef = await addDoc(collection(db, 'transactions'), transactionData);

            const userRef = doc(db, 'users', currentUser.uid);
            await updateDoc(userRef, {
                [`purchasedBooks.${book.id}`]: {
                    id: book.id,
                    title: book.title,
                    purchaseDate: new Date().toISOString(),
                    transactionId: transactionRef.id
                }
            });

            if (sellerDetails?.id && !distribution.isPlatformBook) {
                const sellersRef = doc(db, 'sellers', sellerDetails.id);
                await updateDoc(sellersRef, {
                    accountBalance: increment(distribution.sellerAmount),
                    totalEarnings: increment(distribution.sellerAmount),
                    booksSold: increment(1),
                    updatedAt: serverTimestamp()
                });
            }

            // ── Print license record ──────────────────────────────────────
            if (extraData?.printLicense) {
                await addDoc(collection(db, 'print_licenses'), {
                    bookId: book.id,
                    bookTitle: book.title,
                    studentId: currentUser.uid,
                    studentEmail: formData.email,
                    studentName: formData.name || null,
                    sellerId: sellerDetails?.id || null,
                    sellerName: sellerDetails?.name || null,
                    totalAmount: book.price,
                    sellerRoyalty: Math.round(book.price * 0.8),
                    adminCommission: Math.round(book.price * 0.2),
                    pages: book.pages || 0,
                    transactionId: transactionRef.id,
                    createdAt: serverTimestamp(),
                });
            }

            await qualifyReferral(currentUser.uid, book.price);
            return transactionRef.id;
        } catch (err) {
            throw err;
        }
    };
    const processFlutterwavePayment = (extraData = {}, targetCurrency = 'NGN') => {
        if (!book || !formData.email) {
            setError({ message: "Please fill in your email before paying." });
            return;
        }
        if (!flutterwaveLoaded || !window.FlutterwaveCheckout) {
            setError({ message: "Payment gateway is still loading. Please try again." });
            return;
        }

        // 🎯 Use live rate from exchangeMatrix
        let regionalChargedAmount;
        if (targetCurrency === 'NGN') {
            regionalChargedAmount = Math.round(book.price);
        } else {
            const currencyScalar = exchangeMatrix[targetCurrency] || FALLBACK_EXCHANGE_MATRIX[targetCurrency] || 1.0;
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
                    try {
                        setProcessing(true);
                        const orderId = await saveTransaction(response, 'completed', extraData, targetCurrency);
                        await triggerEmailNotifications(formData.email, formData.name || formData.email, book, sellerDetails, orderId);
                        setPaymentSuccess(true);
                    } catch (err) {
                        setError({ message: "Payment recorded but failed to save. Contact support." });
                    } finally {
                        setProcessing(false);
                    }
                } else {
                    setError({ message: "Payment was not completed. Please try again." });
                }
            },
            onclose: () => console.log("Flutterwave modal closed"),
        });
    };

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
            await new Promise(resolve => setTimeout(resolve, 1500));
            let updatedBalance = null;

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
                transaction.update(sellerRef, { accountBalance: updatedBalance, updatedAt: serverTimestamp() });
            });

            const orderId = await saveTransaction(null, 'completed', extraData, 'NGN');
            await triggerEmailNotifications(formData.email, formData.name, book, sellerDetails, orderId);
            setNewBalance(updatedBalance);
            setPaymentSuccess(true);
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
                    otpExpiry: Date.now() + 600000
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
                    otpExpiry: null
                });
                const withdrawalLogRef = doc(collection(db, 'withdrawals'));
                transaction.set(withdrawalLogRef, {
                    userId: currentUser.uid,
                    amount,
                    status: 'completed',
                    type: 'withdrawal',
                    createdAt: serverTimestamp()
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

    const setupInitialPin = async (newPin) => {
        setProcessing(true);
        try {
            const currentUser = auth.currentUser;
            if (!currentUser) throw new Error("Auth required");
            const sellerRef = doc(db, 'sellers', currentUser.uid);
            await updateDoc(sellerRef, {
                transactionPin: newPin.toString().trim(),
                transferPin: newPin.toString().trim(),
                updatedAt: serverTimestamp()
            });
            return { success: true };
        } catch (err) {
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
                otpExpiry: null
            });
            return true;
        } else {
            throw new Error("Invalid or expired code.");
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
        processFlutterwavePayment,
        processWalletPayment,
        processWithdrawal,
        setupInitialPin,
        requestPinReset,
        verifyOtpAndSetPin
    };
};