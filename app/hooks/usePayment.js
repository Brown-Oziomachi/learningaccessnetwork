// app/hooks/usePayment.js
import { useState, useEffect } from 'react';
import { db, auth } from '@/lib/firebaseConfig';
import {
    collection,
    addDoc,
    doc,
    updateDoc,
    serverTimestamp,
    increment,
    getDoc,
    runTransaction
} from 'firebase/firestore';

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

export const usePayment = (book, formData, sellerDetails) => {
    const [processing, setProcessing] = useState(false);
    const [paymentSuccess, setPaymentSuccess] = useState(false);
    const [error, setError] = useState(null);
    const [flutterwaveLoaded, setFlutterwaveLoaded] = useState(false);
    const [newBalance, setNewBalance] = useState(null);
    const [showPin, setShowPin] = useState(false);
    const [withdrawalStep, setWithdrawalStep] = useState('INIT'); // INIT, OTP_REQUIRED, PROCESSING
    const [tempWithdrawalData, setTempWithdrawalData] = useState(null);

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


    const processWithdrawal = async (amount, pin, otp = null) => {
        setProcessing(true);
        setError(null);
        const WITHDRAWAL_THRESHOLD = 5000;

        try {
            const currentUser = auth.currentUser;
            if (!currentUser) throw new Error("Authentication required.");

            // 1. VERIFY PIN (Every withdrawal needs a PIN)
            const sellerRef = doc(db, 'sellers', currentUser.uid);
            const sellerSnap = await getDoc(sellerRef);
            const sellerData = sellerSnap.data();

            if (pin.toString().trim() !== sellerData.transactionPin?.toString().trim()) {
                throw new Error("Incorrect PIN.");
            }

            // 2. CHECK THRESHOLD FOR OTP
            if (amount > WITHDRAWAL_THRESHOLD && !otp) {
                // This is the first attempt and it's a large amount
                const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();

                // Store OTP in Firebase temporarily to verify later
                await updateDoc(sellerRef, {
                    withdrawalOtp: generatedOtp,
                    otpExpiry: Date.now() + 600000 // 10 mins
                });

                console.log(`[SECURITY] Withdrawal OTP sent: ${generatedOtp}`); // Replace with actual Email service

                setTempWithdrawalData({ amount, pin });
                setWithdrawalStep('OTP_REQUIRED');
                return { status: "OTP_SENT" };
            }

            // 3. VERIFY OTP (If it was required)
            if (otp) {
                if (otp !== sellerData.withdrawalOtp || Date.now() > sellerData.otpExpiry) {
                    throw new Error("Invalid or expired OTP.");
                }
            }

            // 4. EXECUTE WITHDRAWAL (Using a Transaction for safety)
            await runTransaction(db, async (transaction) => {
                const freshSnap = await transaction.get(sellerRef);
                const balance = freshSnap.data().accountBalance || 0;

                if (balance < amount) throw new Error("Insufficient funds.");

                // Deduct from balance
                transaction.update(sellerRef, {
                    accountBalance: increment(-amount),
                    withdrawalOtp: null, // Clear OTP after use
                    otpExpiry: null
                });

                // Log the withdrawal
                const withdrawalLogRef = doc(collection(db, 'withdrawals'));
                transaction.set(withdrawalLogRef, {
                    userId: currentUser.uid,
                    amount: amount,
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

    const saveTransaction = async (paymentData, status = 'completed') => {
        try {
            const distribution = calculatePaymentDistribution(book);
            const currentUser = auth.currentUser;
            if (!currentUser) throw new Error('User not authenticated');

            const transactionData = {
                transactionId: paymentData.transaction_id || paymentData.tx_ref,
                transactionRef: paymentData.tx_ref,
                status,
                amount: book.price,
                currency: 'NGN',
                paymentMethod: paymentData.payment_type || 'external',
                bookId: book.id,
                bookTitle: book.title,
                buyerId: currentUser.uid,
                buyerEmail: formData.email,
                sellerId: sellerDetails?.id || null,
                platformFee: distribution.platformFee,
                sellerAmount: distribution.sellerAmount,
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
                    updatedAt: serverTimestamp()
                });
            }
            return transactionRef.id;
        } catch (err) {
            throw err;
        }
    };

    const processFlutterwavePayment = () => {
        if (!book || !formData.email) {
            setError({ message: "Please fill in your email before paying." });
            return;
        }

        if (!flutterwaveLoaded || !window.FlutterwaveCheckout) {
            setError({ message: "Payment gateway is still loading. Please try again." });
            return;
        }

        const txRef = `TXN-FLW-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        window.FlutterwaveCheckout({
            public_key: process.env.NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY,
            tx_ref: txRef,
            amount: book.price,
            currency: "NGN",
            payment_options: "card,ussd,banktransfer",
            customer: {
                email: formData.email,
                phone_number: formData.phone || "",
                name: formData.name || formData.email,
            },
            customizations: {
                title: "LAN Library",
                description: `Purchase: ${book.title}`,
                logo: "/lan-logo.png",
            },
            callback: async (response) => {
                if (response.status === "successful" || response.status === "completed") {
                    try {
                        setProcessing(true);
                        await saveTransaction(response, 'completed');
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
            onclose: () => {
                console.log("Flutterwave modal closed");
            },
        });
    };

    const processPayPalPayment = async (details) => {
        if (!details) return;
        try {
            setProcessing(true);
            await saveTransaction({
                transaction_id: details.id || `PP-${Date.now()}`,
                tx_ref: `TXN-PP-${Date.now()}`,
                payment_type: 'paypal',
            }, 'completed');
            setPaymentSuccess(true);
        } catch (err) {
            setError({ message: "Failed to record PayPal payment." });
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
            await updateDoc(sellerRef, {
                resetOtp: otp,
                otpExpiry: Date.now() + 600000
            });
            console.log(`[SECURITY] OTP: ${otp}`);
            return { success: true };
        } catch (err) {
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

    const processWalletPayment = async (enteredPin) => {
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

                if (storedValue === undefined || storedValue === null) {
                    throw new Error("PIN_NOT_SET");
                }

                if (enteredPin.toString().trim() !== storedValue.toString().trim()) {
                    throw new Error("Incorrect PIN. Please try again.");
                }

                const currentBalance = sellerData.accountBalance || 0;
                if (currentBalance < book.price) {
                    throw new Error(`Insufficient funds. Balance: ₦${currentBalance.toLocaleString()}`);
                }

                updatedBalance = currentBalance - book.price;
                transaction.update(sellerRef, {
                    accountBalance: updatedBalance,
                    updatedAt: serverTimestamp()
                });
            });

            const walletResponse = {
                transaction_id: `WAL-${Date.now()}`,
                tx_ref: `TXN-WAL-${Date.now()}`,
                payment_type: 'lan_wallet',
            };
            await saveTransaction(walletResponse, 'completed');
            setNewBalance(updatedBalance);
            setPaymentSuccess(true);

        } catch (err) {
            setError({
                message: err.message === "PIN_NOT_SET"
                    ? "You haven't set a PIN yet. Please set one to continue."
                    : err.message
            });
        } finally {
            setProcessing(false);
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
        processFlutterwavePayment,
        processPayPalPayment,
        processWalletPayment,
        setupInitialPin,
        requestPinReset,
        verifyOtpAndSetPin
    };
};