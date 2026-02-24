'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ArrowRight, Copy, Check, Loader2, CheckCircle2, AlertCircle, ArrowUpRight, Wallet, Search, Shield, Lock, Eye, EyeOff, X } from 'lucide-react';
import Navbar from '@/components/NavBar';
import { onAuthStateChanged } from 'firebase/auth';
import {
    doc, getDoc, collection, query, where,
    getDocs, runTransaction, serverTimestamp,
    increment, orderBy, limit, updateDoc
} from 'firebase/firestore';
import { auth, db } from '@/lib/firebaseConfig';
import TransferReceipt, { TransferReceiptModal } from '@/components/Transferreceipt';

export const generateAccountNumber = () => {
    const digits = Math.floor(1000000 + Math.random() * 9000000);
    return `LAN${digits}`;
};

const formatAccountNumber = (acc) => {
    if (!acc) return '';
    const num = acc.replace('LAN', '');
    return `LAN-${num.slice(0, 3)}-${num.slice(3)}`;
};

// ── PIN Input Grid ─────────────────────────────────────────────────────────
function PinInput({ value, onChange, disabled = false, masked = true }) {
    const inputs = useRef([]);

    const handleChange = (i, e) => {
        const v = e.target.value.replace(/\D/g, '').slice(-1);
        const arr = value.split('');
        arr[i] = v;
        const next = arr.join('').slice(0, 4);
        onChange(next);
        if (v && i < 3) inputs.current[i + 1]?.focus();
    };

    const handleKeyDown = (i, e) => {
        if (e.key === 'Backspace' && !value[i] && i > 0) {
            inputs.current[i - 1]?.focus();
            const arr = value.split('');
            arr[i - 1] = '';
            onChange(arr.join(''));
        }
    };

    const handlePaste = (e) => {
        const paste = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 4);
        onChange(paste);
        inputs.current[Math.min(paste.length, 3)]?.focus();
        e.preventDefault();
    };

    // Auto-focus first input on mount
    useEffect(() => { inputs.current[0]?.focus(); }, []);

    return (
        <div className="flex gap-3 justify-center">
            {[0, 1, 2, 3].map((i) => (
                <input
                    key={i}
                    ref={(el) => (inputs.current[i] = el)}
                    type={masked ? 'password' : 'text'}
                    inputMode="numeric"
                    maxLength={1}
                    value={value[i] || ''}
                    onChange={(e) => handleChange(i, e)}
                    onKeyDown={(e) => handleKeyDown(i, e)}
                    onPaste={handlePaste}
                    disabled={disabled}
                    className={`w-14 h-14 text-center text-2xl font-bold rounded-2xl border-2 outline-none transition-all duration-150
                        ${value[i]
                            ? 'border-blue-950 bg-blue-950 text-white shadow-lg scale-105'
                            : 'border-gray-200 bg-gray-50 text-gray-900'
                        }
                        focus:border-blue-950 focus:bg-blue-50 focus:scale-105
                        disabled:opacity-40 disabled:cursor-not-allowed`}
                />
            ))}
        </div>
    );
}

// ── CREATE PIN SCREEN ──────────────────────────────────────────────────────
function CreatePinScreen({ onSave }) {
    const [step, setStep] = useState(1);
    const [pin, setPin] = useState('');
    const [confirmPin, setConfirmPin] = useState('');
    const [masked, setMasked] = useState(true);
    const [error, setError] = useState('');
    const [saving, setSaving] = useState(false);
    const [done, setDone] = useState(false);

    const handleNext = () => {
        if (pin.length < 4) { setError('Please enter all 4 digits'); return; }
        setError(''); setStep(2); setConfirmPin('');
    };

    const handleSave = async () => {
        if (confirmPin.length < 4) { setError('Please enter all 4 digits'); return; }
        if (confirmPin !== pin) { setError("PINs don't match. Try again."); setConfirmPin(''); return; }
        setError(''); setSaving(true);
        try {
            await onSave(pin);
            setDone(true);
        } catch {
            setError('Failed to save PIN. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    if (done) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="text-center">
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle2 size={40} className="text-green-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">PIN Created!</h2>
                    <p className="text-gray-500 text-sm">You can now make transfers securely.</p>
                    <div className="mt-4 w-6 h-6 border-2 border-blue-950 border-t-transparent rounded-full animate-spin mx-auto" />
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <Navbar />

            {/* Hero */}
            <div className="bg-blue-950 px-6 py-10 text-white text-center">
                <div className="w-16 h-16 bg-blue-800/60 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-blue-700">
                    <Shield size={30} className="text-blue-200" />
                </div>
                <h1 className="text-2xl font-bold mb-1">Secure Your Transfers</h1>
                <p className="text-blue-300 text-sm max-w-xs mx-auto">
                    Create a 4-digit PIN that will be required every time you send money
                </p>
            </div>

            {/* Step dots */}
            <div className="flex items-center justify-center gap-3 py-4 bg-white border-b border-gray-100">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all
                    ${step >= 1 ? 'bg-blue-950 text-white' : 'bg-gray-100 text-gray-400'}`}>1</div>
                <div className={`h-0.5 w-10 transition-all ${step >= 2 ? 'bg-blue-950' : 'bg-gray-200'}`} />
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all
                    ${step >= 2 ? 'bg-blue-950 text-white' : 'bg-gray-100 text-gray-400'}`}>2</div>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center p-6">
                <div className="w-full max-w-sm">
                    {step === 1 ? (
                        <>
                            <h2 className="text-xl font-bold text-gray-900 text-center mb-1">Create Your PIN</h2>
                            <p className="text-gray-500 text-sm text-center mb-8">Choose a 4-digit PIN you'll remember</p>
                            <PinInput value={pin} onChange={setPin} masked={masked} />
                            <button onClick={() => setMasked(m => !m)}
                                className="flex items-center gap-1.5 mx-auto mt-4 text-xs text-gray-400 hover:text-gray-600 transition-colors">
                                {masked ? <Eye size={13} /> : <EyeOff size={13} />}
                                {masked ? 'Show PIN' : 'Hide PIN'}
                            </button>
                            {error && <p className="mt-4 text-sm text-red-600 text-center font-medium">{error}</p>}
                            <button onClick={handleNext} disabled={pin.length < 4}
                                className="w-full mt-8 py-4 bg-blue-950 text-white rounded-2xl font-bold hover:bg-blue-900 transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed">
                                Continue <ArrowRight size={17} />
                            </button>
                        </>
                    ) : (
                        <>
                            <h2 className="text-xl font-bold text-gray-900 text-center mb-1">Confirm Your PIN</h2>
                            <p className="text-gray-500 text-sm text-center mb-8">Enter the same PIN again to confirm</p>
                            <PinInput value={confirmPin} onChange={setConfirmPin} masked={masked} />
                            <button onClick={() => setMasked(m => !m)}
                                className="flex items-center gap-1.5 mx-auto mt-4 text-xs text-gray-400 hover:text-gray-600 transition-colors">
                                {masked ? <Eye size={13} /> : <EyeOff size={13} />}
                                {masked ? 'Show PIN' : 'Hide PIN'}
                            </button>
                            {error && <p className="mt-4 text-sm text-red-600 text-center font-medium">{error}</p>}
                            <button onClick={handleSave} disabled={confirmPin.length < 4 || saving}
                                className="w-full mt-8 py-4 bg-blue-950 text-white rounded-2xl font-bold hover:bg-blue-900 transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed">
                                {saving
                                    ? <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving...</>
                                    : <><CheckCircle2 size={18} /> Set PIN</>
                                }
                            </button>
                            <button onClick={() => { setStep(1); setError(''); setConfirmPin(''); }}
                                className="w-full mt-3 py-3 text-gray-400 text-sm hover:text-gray-600 transition-colors">
                                ← Change PIN
                            </button>
                        </>
                    )}

                    <div className="mt-8 bg-amber-50 border border-amber-200 rounded-2xl p-4">
                        <p className="text-xs text-amber-700 text-center leading-relaxed">
                            <strong>Keep your PIN safe.</strong> You'll need it every time you send money. LAN will never ask for your PIN.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ── PIN CONFIRM MODAL (shown before every transfer) ────────────────────────
function PinConfirmModal({ onVerify, onClose }) {
    const [pin, setPin] = useState('');
    const [masked, setMasked] = useState(true);
    const [error, setError] = useState('');
    const [attempts, setAttempts] = useState(0);
    const MAX_ATTEMPTS = 3;

    const verify = (currentPin) => {
        if ((currentPin || pin).length < 4) return;
        const result = onVerify(currentPin || pin);
        if (!result) {
            const next = attempts + 1;
            setAttempts(next);
            setPin('');
            if (next >= MAX_ATTEMPTS) {
                setError('Too many incorrect attempts. Please close and try again later.');
            } else {
                setError(`Incorrect PIN. ${MAX_ATTEMPTS - next} attempt${MAX_ATTEMPTS - next === 1 ? '' : 's'} remaining.`);
            }
        }
    };

    // Auto-submit when 4 digits entered
    useEffect(() => {
        if (pin.length === 4 && attempts < MAX_ATTEMPTS) {
            verify(pin);
        }
    }, [pin]); // eslint-disable-line

    const locked = attempts >= MAX_ATTEMPTS;

    return (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/60 backdrop-blur-sm"
            onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
            <div className="bg-white w-full md:max-w-sm md:rounded-3xl rounded-t-3xl shadow-2xl overflow-hidden">

                {/* Header */}
                <div className="bg-blue-950 px-6 py-6 text-center relative">
                    <button onClick={onClose}
                        className="absolute top-4 right-4 p-1.5 hover:bg-blue-800 rounded-xl transition-colors">
                        <X size={18} className="text-blue-300" />
                    </button>
                    <div className="w-12 h-12 bg-blue-800/60 rounded-2xl flex items-center justify-center mx-auto mb-3 border border-blue-700">
                        <Lock size={22} className="text-blue-200" />
                    </div>
                    <h3 className="text-white font-bold text-lg">Enter Transfer PIN</h3>
                    <p className="text-blue-300 text-xs mt-1">Your 4-digit security PIN is required</p>
                </div>

                <div className="p-6">
                    <PinInput value={pin} onChange={locked ? () => { } : setPin} masked={masked} disabled={locked} />

                    <button onClick={() => setMasked(m => !m)}
                        className="flex items-center gap-1.5 mx-auto mt-4 text-xs text-gray-400 hover:text-gray-600 transition-colors">
                        {masked ? <Eye size={13} /> : <EyeOff size={13} />}
                        {masked ? 'Show PIN' : 'Hide PIN'}
                    </button>

                    {error && (
                        <div className="mt-4 bg-red-50 border border-red-200 rounded-xl p-3 text-center">
                            <p className="text-sm text-red-600 font-medium">{error}</p>
                        </div>
                    )}

                    {!locked && (
                        <button onClick={() => verify(pin)} disabled={pin.length < 4}
                            className="w-full mt-5 py-4 bg-blue-950 text-white rounded-2xl font-bold hover:bg-blue-900 transition-all disabled:opacity-40 disabled:cursor-not-allowed">
                            Confirm
                        </button>
                    )}

                    <button onClick={onClose}
                        className="w-full mt-3 py-3 text-gray-400 text-sm hover:text-gray-600 transition-colors">
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
}

// ── MAIN TRANSFER CLIENT ───────────────────────────────────────────────────
export default function TransferClient() {
    const [seller, setSeller] = useState(null);
    const [loading, setLoading] = useState(true);
    const [step, setStep] = useState(1);
    const [copied, setCopied] = useState(false);

    // PIN state
    const [hasPin, setHasPin] = useState(null); // null = not yet checked
    const [showPinModal, setShowPinModal] = useState(false);
    const [pinAction, setPinAction] = useState(null); // callback to run after PIN verified

    const [recipientAccount, setRecipientAccount] = useState('');
    const [amount, setAmount] = useState('');
    const [note, setNote] = useState('');
    const [recipientInfo, setRecipientInfo] = useState(null);
    const [lookingUp, setLookingUp] = useState(false);
    const [lookupError, setLookupError] = useState('');
    const [transferring, setTransferring] = useState(false);
    const [transferError, setTransferError] = useState('');
    const [recentTransfers, setRecentTransfers] = useState([]);
    const [selectedTransfer, setSelectedTransfer] = useState(null);
    const [showAllTransfers, setShowAllTransfers] = useState(false);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (!firebaseUser) { setLoading(false); return; }
            try {
                const sellerDoc = await getDoc(doc(db, 'sellers', firebaseUser.uid));
                if (sellerDoc.exists()) {
                    const data = sellerDoc.data();
                    if (!data.accountNumber) {
                        const newAccNum = generateAccountNumber();
                        await updateDoc(doc(db, 'sellers', firebaseUser.uid), { accountNumber: newAccNum });
                        setSeller({ uid: firebaseUser.uid, ...data, accountNumber: newAccNum });
                    } else {
                        setSeller({ uid: firebaseUser.uid, ...data });
                    }
                    // Check if PIN exists
                    setHasPin(!!data.transferPin);
                }
                await loadRecentTransfers(firebaseUser.uid);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        });
        return () => unsubscribe();
    }, []);

    const loadRecentTransfers = async (uid) => {
        try {
            const q = query(
                collection(db, 'transfers'),
                where('senderId', '==', uid),
                orderBy('createdAt', 'desc'),
                limit(20)
            );
            const snap = await getDocs(q);
            setRecentTransfers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        } catch (err) {
            console.error('Recent transfers error:', err);
        }
    };

    // ── Save PIN to Firestore ──
    const handleSavePin = async (pin) => {
        await updateDoc(doc(db, 'sellers', seller.uid), {
            transferPin: pin,
            updatedAt: serverTimestamp(),
        });
        setSeller(prev => ({ ...prev, transferPin: pin }));
        setHasPin(true);
    };

    // ── Verify PIN ──
    const handleVerifyPin = (enteredPin) => {
        if (enteredPin === seller?.transferPin) {
            setShowPinModal(false);
            if (pinAction) {
                pinAction();
                setPinAction(null);
            }
            return true;
        }
        return false;
    };

    // ── Request PIN then run action ──
    const requirePin = (action) => {
        setPinAction(() => action);
        setShowPinModal(true);
    };

    const handleLookup = async () => {
        const clean = recipientAccount.replace(/-/g, '').toUpperCase();
        if (!clean.startsWith('LAN') || clean.length < 10) {
            setLookupError('Enter a valid LAN account number e.g. LAN-284-7391');
            return;
        }
        if (clean === seller?.accountNumber) {
            setLookupError("You can't transfer to yourself.");
            return;
        }
        setLookupError('');
        setLookingUp(true);
        setRecipientInfo(null);
        try {
            const q = query(collection(db, 'sellers'), where('accountNumber', '==', clean));
            const snap = await getDocs(q);
            if (snap.empty) {
                setLookupError('Account number not found. Please check and try again.');
            } else {
                const data = snap.docs[0].data();
                setRecipientInfo({ id: snap.docs[0].id, ...data });
            }
        } catch {
            setLookupError('Error looking up account. Please try again.');
        } finally {
            setLookingUp(false);
        }
    };

    const TRANSFER_FEE = 50;
    const LAN_PLATFORM_UID = 'LAN_LIBRARY_PLATFORM';

    const handleTransfer = async () => {
        const amt = Number(amount);
        const totalDeducted = amt + TRANSFER_FEE;

        if (!amt || amt < 100) { setTransferError('Minimum transfer is ₦100'); return; }
        if (totalDeducted > (seller?.accountBalance || 0)) {
            setTransferError(`Insufficient balance. You need ₦${totalDeducted.toLocaleString()} (₦${amt.toLocaleString()} + ₦50 fee)`);
            return;
        }
        if (!recipientInfo) { setTransferError('Please look up a valid recipient first'); return; }

        setTransferring(true);
        setTransferError('');

        try {
            const senderRef = doc(db, 'sellers', seller.uid);
            const recipientRef = doc(db, 'sellers', recipientInfo.id);
            const platformRef = doc(db, 'sellers', LAN_PLATFORM_UID);

            await runTransaction(db, async (transaction) => {
                const senderSnap = await transaction.get(senderRef);
                if (senderSnap.data().accountBalance < totalDeducted) {
                    throw new Error(`Insufficient balance.`);
                }
                transaction.update(senderRef, { accountBalance: increment(-totalDeducted), updatedAt: serverTimestamp() });
                transaction.update(recipientRef, { accountBalance: increment(amt), updatedAt: serverTimestamp() });
                transaction.set(platformRef, {
                    accountBalance: increment(TRANSFER_FEE),
                    totalFeesCollected: increment(TRANSFER_FEE),
                    updatedAt: serverTimestamp(),
                }, { merge: true });

                const transferRef = doc(collection(db, 'transfers'));
                transaction.set(transferRef, {
                    senderId: seller.uid,
                    senderName: seller.businessInfo?.businessName || seller.bankDetails?.accountName || 'Unknown',
                    senderAccountNumber: seller.accountNumber || '',
                    recipientId: recipientInfo.id,
                    recipientName: recipientInfo.businessInfo?.businessName || recipientInfo.bankDetails?.accountName || recipientInfo.sellerName || 'Unknown',
                    recipientAccountNumber: recipientInfo.accountNumber || '',
                    amount: amt,
                    fee: TRANSFER_FEE,
                    totalDeducted: amt + TRANSFER_FEE,
                    note: note || '',
                    createdAt: serverTimestamp(),
                    status: 'completed',
                });

                const feeRef = doc(collection(db, 'platformFees'));
                transaction.set(feeRef, {
                    transferId: transferRef.id,
                    senderId: seller.uid,
                    senderName: seller.businessInfo?.businessName || seller.bankDetails?.accountName || 'Unknown',
                    fee: TRANSFER_FEE,
                    transferAmount: amt,
                    createdAt: serverTimestamp(),
                    disbursedToFlutterwave: false,
                });
            });

            setSeller(prev => ({ ...prev, accountBalance: (prev.accountBalance || 0) - totalDeducted }));
            await loadRecentTransfers(seller.uid);
            setStep(3);
        } catch (err) {
            setTransferError(err.message || 'Transfer failed. Please try again.');
        } finally {
            setTransferring(false);
        }
    };

    const handleCopyAccount = async () => {
        if (!seller?.accountNumber) return;
        await navigator.clipboard.writeText(formatAccountNumber(seller.accountNumber));
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const resetForm = () => {
        setRecipientAccount('');
        setAmount('');
        setNote('');
        setRecipientInfo(null);
        setLookupError('');
        setTransferError('');
        setStep(1);
    };

    // ── Loading ──
    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <Loader2 className="animate-spin text-blue-950" size={40} />
            </div>
        );
    }

    // ── No seller account ──
    if (!seller) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl p-8 text-center max-w-md shadow border border-gray-200">
                    <Wallet size={48} className="mx-auto text-gray-300 mb-4" />
                    <h2 className="text-xl font-bold text-gray-900 mb-2">No Seller Account</h2>
                    <p className="text-gray-500">You need a seller account to use LAN Bank transfers.</p>
                </div>
            </div>
        );
    }

    // ── No PIN yet → show create PIN screen ──
    if (hasPin === false) {
        return <CreatePinScreen onSave={handleSavePin} />;
    }

    const sellerName = seller.bankDetails?.accountName || seller.businessInfo?.businessName || 'Unknown Seller';

    // ── Transfer UI ──
    return (
        <div className="bg-gray-50 min-h-screen">
            <Navbar />

            <div className="max-w-5xl mx-auto px-4 py-6 md:py-12">

                {/* Page Header */}
                <div className="mb-6">
                    <h1 className="text-2xl md:text-4xl font-bold text-blue-900 mb-1">LAN Wallet Transfer</h1>
                    <p className="text-sm md:text-base text-gray-600">Send money instantly to any seller on LAN</p>
                </div>

                {/* Mobile account banner */}
                <div className="lg:hidden mb-4">
                    <div className="bg-blue-950 text-white rounded-2xl p-4">
                        <p className="text-blue-300 text-xs font-semibold uppercase tracking-widest mb-3">Your LAN Account</p>
                        <div className="flex items-center justify-between gap-3">
                            <div className="min-w-0 flex-1">
                                <p className="font-bold text-white text-sm truncate">{sellerName}</p>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="font-mono text-blue-200 text-xs tracking-wider">
                                        {formatAccountNumber(seller.accountNumber)}
                                    </span>
                                    <button onClick={handleCopyAccount}
                                        className="flex-shrink-0 p-1 hover:bg-blue-800 rounded transition-colors">
                                        {copied ? <Check size={13} className="text-green-400" /> : <Copy size={13} className="text-blue-300" />}
                                    </button>
                                </div>
                            </div>
                            <div className="flex-shrink-0 text-right">
                                <p className="text-blue-300 text-xs">Balance</p>
                                <p className="text-lg font-bold text-white">₦{(seller.accountBalance || 0).toLocaleString()}</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid lg:grid-cols-3 gap-6">

                    {/* Desktop sidebar */}
                    <div className="hidden lg:flex flex-col gap-6">
                        <div className="bg-blue-950 text-white rounded-2xl p-6 shadow-sm">
                            <p className="text-blue-300 text-xs font-semibold uppercase tracking-widest mb-4">Your LAN Account</p>
                            <div className="bg-blue-900/50 rounded-xl px-4 py-3 border border-blue-700 mb-3">
                                <p className="text-xl font-bold text-white truncate">{sellerName}</p>
                            </div>
                            <div className="flex items-center gap-2 bg-blue-900/50 rounded-xl px-4 py-3 border border-blue-700">
                                <span className="font-mono text-base font-bold text-white tracking-wider flex-1 truncate">
                                    {formatAccountNumber(seller.accountNumber)}
                                </span>
                                <button onClick={handleCopyAccount}
                                    className="flex-shrink-0 p-1.5 hover:bg-blue-800 rounded-lg transition-colors">
                                    {copied ? <Check size={16} className="text-green-400" /> : <Copy size={16} className="text-blue-300" />}
                                </button>
                            </div>
                            <div className="mt-4 pt-4 border-t border-blue-800">
                                <p className="text-blue-300 text-xs mb-1">Available Balance</p>
                                <p className="text-3xl font-bold text-white">₦{(seller.accountBalance || 0).toLocaleString()}</p>
                            </div>
                        </div>

                        {/* Recent Transfers desktop */}
                        {recentTransfers.length > 0 && (
                            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-200">
                                <h3 className="font-bold text-gray-900 text-sm mb-4">Recent Transfers</h3>
                                <div className="space-y-3">
                                    {(showAllTransfers ? recentTransfers : recentTransfers.slice(0, 5)).map(t => (
                                        <button key={t.id} onClick={() => setSelectedTransfer(t)}
                                            className="flex items-center gap-3 min-w-0 w-full text-left hover:bg-gray-50 rounded-xl p-1.5 -mx-1.5 transition-colors group">
                                            <div className="w-8 h-8 bg-red-50 rounded-full flex items-center justify-center flex-shrink-0">
                                                <ArrowUpRight size={14} className="text-red-500" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-semibold text-gray-900 truncate group-hover:text-blue-950">{t.recipientName}</p>
                                                <p className="text-xs text-gray-400 font-mono truncate">{formatAccountNumber(t.recipientAccountNumber)}</p>
                                            </div>
                                            <p className="text-xs font-bold text-red-500 flex-shrink-0">
                                                -₦{(t.totalDeducted || t.amount + 50).toLocaleString()}
                                            </p>
                                        </button>
                                    ))}
                                </div>
                                {recentTransfers.length > 5 && (
                                    <button onClick={() => setShowAllTransfers(p => !p)}
                                        className="mt-3 w-full text-xs font-semibold text-blue-950 hover:text-blue-700 py-2 border-t border-gray-100 transition-colors">
                                        {showAllTransfers ? '↑ Show Less' : `View All (${recentTransfers.length})`}
                                    </button>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Transfer Form */}
                    <div className="lg:col-span-2 w-full min-w-0">
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden w-full">

                            {/* Step 1 — Form */}
                            {step === 1 && (
                                <div className="p-5 md:p-8">
                                    <h2 className="text-lg md:text-xl font-bold text-gray-900 mb-5">Send Money</h2>

                                    {/* Recipient */}
                                    <div className="mb-5">
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Recipient Account Number</label>
                                        <div className="flex gap-2">
                                            <input type="text" placeholder="LAN-284-7391" value={recipientAccount}
                                                onChange={e => { setRecipientAccount(e.target.value); setRecipientInfo(null); setLookupError(''); }}
                                                className="flex-1 min-w-0 border text-black border-gray-200 rounded-xl px-3 py-3 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-950 focus:border-transparent" />
                                            <button onClick={handleLookup} disabled={lookingUp || !recipientAccount}
                                                className="flex-shrink-0 px-4 py-3 bg-blue-950 text-white rounded-xl font-semibold hover:bg-blue-900 transition-all flex items-center gap-1.5 disabled:opacity-50 text-sm whitespace-nowrap">
                                                {lookingUp ? <Loader2 size={15} className="animate-spin" /> : <Search size={15} />}
                                                Verify
                                            </button>
                                        </div>
                                        {lookupError && <p className="mt-2 text-sm text-red-600 flex items-center gap-1"><AlertCircle size={14} /> {lookupError}</p>}
                                        {recipientInfo && (
                                            <div className="mt-3 bg-green-50 border border-green-200 rounded-xl px-4 py-3 flex items-center gap-3">
                                                <CheckCircle2 size={18} className="text-green-600 flex-shrink-0" />
                                                <div className="min-w-0">
                                                    <p className="font-semibold text-green-900 truncate">
                                                        {recipientInfo.bankDetails?.accountName || recipientInfo.businessInfo?.businessName || 'Unknown account'}
                                                    </p>
                                                    <p className="text-xs text-green-700 font-mono">{formatAccountNumber(recipientInfo.accountNumber)}</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Amount */}
                                    <div className="mb-5">
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Amount (₦)</label>
                                        <div className="relative">
                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-lg">₦</span>
                                            <input type="number" placeholder="0.00" value={amount} onChange={e => setAmount(e.target.value)}
                                                className="w-full border text-black border-gray-200 rounded-xl pl-9 pr-4 py-3 text-lg font-bold focus:outline-none focus:ring-2 focus:ring-blue-950 focus:border-transparent" />
                                        </div>
                                        <div className="flex gap-2 mt-2 flex-wrap">
                                            {[500, 1000, 2000, 5000].map(q => (
                                                <button key={q} onClick={() => setAmount(String(q))}
                                                    className="text-xs px-3 py-1.5 bg-gray-100 hover:bg-blue-50 hover:text-blue-950 text-gray-600 rounded-lg font-semibold transition-colors">
                                                    ₦{q.toLocaleString()}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {amount && Number(amount) >= 100 && (
                                        <div className="mb-4 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 flex items-center justify-between">
                                            <div>
                                                <p className="text-xs text-blue-700 font-semibold">Transaction Fee</p>
                                                <p className="text-xs text-blue-500">Applied to every transfer</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm font-bold text-blue-950">+ ₦50</p>
                                                <p className="text-xs text-blue-600">Total: ₦{(Number(amount) + 50).toLocaleString()}</p>
                                            </div>
                                        </div>
                                    )}

                                    {/* Note */}
                                    <div className="mb-6">
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Note (optional)</label>
                                        <input type="text" placeholder="What's this for?" value={note} onChange={e => setNote(e.target.value)}
                                            className="w-full border text-black border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-950 focus:border-transparent" />
                                    </div>

                                    <button
                                        onClick={() => {
                                            if (!recipientInfo) { setLookupError('Please verify the account number first'); return; }
                                            if (!amount || Number(amount) < 100) { setTransferError('Minimum transfer is ₦100'); return; }
                                            if (Number(amount) + 50 > (seller?.accountBalance || 0)) { setTransferError('Insufficient balance'); return; }
                                            setTransferError('');
                                            setStep(2);
                                        }}
                                        disabled={!recipientInfo || !amount}
                                        className="w-full py-3.5 bg-blue-950 text-white rounded-xl font-bold text-base hover:bg-blue-900 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                                        Continue <ArrowRight size={18} />
                                    </button>
                                    {transferError && (
                                        <p className="mt-3 text-sm text-red-600 flex items-center gap-1 justify-center">
                                            <AlertCircle size={14} /> {transferError}
                                        </p>
                                    )}
                                </div>
                            )}

                            {/* Step 2 — Confirm + PIN */}
                            {step === 2 && (
                                <div className="p-5 md:p-8">
                                    <button onClick={() => setStep(1)} className="flex items-center gap-1 text-gray-500 text-sm mb-5 hover:text-gray-800">← Back</button>
                                    <h2 className="text-lg md:text-xl font-bold text-gray-900 mb-5">Confirm Transfer</h2>

                                    <div className="bg-gray-50 rounded-2xl p-5 mb-5 space-y-4 border border-gray-100">
                                        <div className="flex justify-between gap-4">
                                            <span className="text-gray-500 text-sm flex-shrink-0">From</span>
                                            <div className="text-right min-w-0">
                                                <p className="font-semibold text-gray-900 truncate">
                                                    {seller.businessInfo?.businessName || seller.bankDetails?.accountName || 'Unknown Seller'}
                                                </p>
                                                <p className="text-xs text-gray-500 font-mono">{formatAccountNumber(seller.accountNumber)}</p>
                                            </div>
                                        </div>
                                        <div className="flex justify-center">
                                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                                <ArrowRight size={16} className="text-blue-950" />
                                            </div>
                                        </div>
                                        <div className="flex justify-between gap-4">
                                            <span className="text-gray-500 text-sm flex-shrink-0">To</span>
                                            <div className="text-right min-w-0">
                                                <p className="font-semibold text-gray-900 truncate">
                                                    {recipientInfo?.businessInfo?.businessName || recipientInfo?.bankDetails?.accountName || recipientInfo?.sellerName || 'Unknown'}
                                                </p>
                                                <p className="text-xs text-gray-500 font-mono">{formatAccountNumber(recipientInfo?.accountNumber)}</p>
                                            </div>
                                        </div>
                                        <div className="border-t border-gray-200 pt-4">
                                            <div className="flex justify-between items-center">
                                                <span className="text-gray-500 text-sm">Amount</span>
                                                <span className="text-2xl font-bold text-blue-950">₦{Number(amount).toLocaleString()}</span>
                                            </div>
                                            <div className="flex justify-between items-center mt-2">
                                                <span className="text-gray-500 text-sm">Transfer Fee</span>
                                                <span className="text-sm font-semibold text-orange-600">+ ₦50</span>
                                            </div>
                                            <div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-200">
                                                <span className="text-gray-700 text-sm font-semibold">Total Deducted</span>
                                                <span className="text-lg font-bold text-blue-950">₦{(Number(amount) + 50).toLocaleString()}</span>
                                            </div>
                                            {note && (
                                                <div className="flex justify-between mt-2 gap-4">
                                                    <span className="text-gray-500 text-sm flex-shrink-0">Note</span>
                                                    <span className="text-sm text-gray-700 text-right">{note}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {transferError && (
                                        <div className="mb-4 bg-red-50 border border-red-200 rounded-xl p-3 flex items-center gap-2">
                                            <AlertCircle size={16} className="text-red-600 flex-shrink-0" />
                                            <p className="text-sm text-red-700">{transferError}</p>
                                        </div>
                                    )}

                                    {/* PIN-protected confirm button */}
                                    <button
                                        onClick={() => requirePin(handleTransfer)}
                                        disabled={transferring}
                                        className="w-full py-3.5 bg-blue-950 text-white rounded-xl font-bold text-base hover:bg-blue-900 transition-all flex items-center justify-center gap-2 disabled:opacity-70">
                                        {transferring
                                            ? <><Loader2 size={18} className="animate-spin" /> Processing...</>
                                            : <><Lock size={17} /> Confirm with PIN</>
                                        }
                                    </button>
                                </div>
                            )}

                            {/* Step 3 — Success */}
                            {step === 3 && (
                                <TransferReceipt
                                    seller={seller}
                                    recipientInfo={recipientInfo}
                                    amount={amount}
                                    note={note}
                                    onReset={resetForm}
                                />
                            )}
                        </div>

                        {/* Recent Transfers mobile */}
                        {recentTransfers.length > 0 && (
                            <div className="lg:hidden mt-4 bg-white rounded-2xl p-4 shadow-sm border border-gray-200">
                                <h3 className="font-bold text-gray-900 text-sm mb-3">Recent Transfers</h3>
                                <div className="space-y-3">
                                    {(showAllTransfers ? recentTransfers : recentTransfers.slice(0, 5)).map(t => (
                                        <button key={t.id} onClick={() => setSelectedTransfer(t)}
                                            className="flex items-center gap-3 min-w-0 w-full text-left hover:bg-gray-50 rounded-xl p-1.5 -mx-1.5 transition-colors group">
                                            <div className="w-8 h-8 bg-red-50 rounded-full flex items-center justify-center flex-shrink-0">
                                                <ArrowUpRight size={14} className="text-red-500" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-semibold text-gray-900 truncate group-hover:text-blue-950">{t.recipientName}</p>
                                                <p className="text-xs text-gray-400 font-mono truncate">{formatAccountNumber(t.recipientAccountNumber)}</p>
                                            </div>
                                            <p className="text-xs font-bold text-red-500 flex-shrink-0">
                                                -₦{(t.totalDeducted || t.amount + 50).toLocaleString()}
                                            </p>
                                        </button>
                                    ))}
                                </div>
                                {recentTransfers.length > 5 && (
                                    <button onClick={() => setShowAllTransfers(p => !p)}
                                        className="mt-3 w-full text-xs font-semibold text-blue-950 hover:text-blue-700 py-2 border-t border-gray-100 transition-colors">
                                        {showAllTransfers ? '↑ Show Less' : `View All (${recentTransfers.length})`}
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* PIN Confirm Modal */}
            {showPinModal && (
                <PinConfirmModal
                    onVerify={handleVerifyPin}
                    onClose={() => { setShowPinModal(false); setPinAction(null); }}
                />
            )}

            {/* Transfer Receipt Modal */}
            {selectedTransfer && (
                <TransferReceiptModal
                    transfer={selectedTransfer}
                    onClose={() => setSelectedTransfer(null)}
                />
            )}
        </div>
    );
}