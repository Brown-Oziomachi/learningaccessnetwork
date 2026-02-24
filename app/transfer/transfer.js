'use client';

import React, { useState, useEffect } from 'react';
import { ArrowRight, Copy, Check, Loader2, CheckCircle2, AlertCircle, ArrowUpRight, Wallet, Search } from 'lucide-react';
import Navbar from '@/components/NavBar';
import Footer from '@/components/FooterComp';
import { useAuth } from '@/hooks/useAuth';
import { onAuthStateChanged } from 'firebase/auth';
import {
    doc, getDoc, collection, query, where,
    getDocs, runTransaction, serverTimestamp,
    increment, orderBy, limit
} from 'firebase/firestore';
import { auth, db } from '@/lib/firebaseConfig';
import TransferReceipt from '@/components/Transferreceipt';

export const generateAccountNumber = () => {
    const digits = Math.floor(1000000 + Math.random() * 9000000);
    return `LAN${digits}`;
};

const formatAccountNumber = (acc) => {
    if (!acc) return '';
    const num = acc.replace('LAN', '');
    return `LAN-${num.slice(0, 3)}-${num.slice(3)}`;
};

export default function TransferClient() {
    const { currentUser } = useAuth();
    const [seller, setSeller] = useState(null);
    const [loading, setLoading] = useState(true);
    const [step, setStep] = useState(1);
    const [copied, setCopied] = useState(false);

    const [recipientAccount, setRecipientAccount] = useState('');
    const [amount, setAmount] = useState('');
    const [note, setNote] = useState('');
    const [recipientInfo, setRecipientInfo] = useState(null);
    const [lookingUp, setLookingUp] = useState(false);
    const [lookupError, setLookupError] = useState('');
    const [transferring, setTransferring] = useState(false);
    const [transferError, setTransferError] = useState('');
    const [recentTransfers, setRecentTransfers] = useState([]);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (!firebaseUser) { setLoading(false); return; }
            try {
                const sellerDoc = await getDoc(doc(db, 'sellers', firebaseUser.uid));
                if (sellerDoc.exists()) {
                    const data = sellerDoc.data();
                    if (!data.accountNumber) {
                        const { updateDoc } = await import('firebase/firestore');
                        const newAccNum = generateAccountNumber();
                        await updateDoc(doc(db, 'sellers', firebaseUser.uid), { accountNumber: newAccNum });
                        setSeller({ uid: firebaseUser.uid, ...data, accountNumber: newAccNum });
                    } else {
                        setSeller({ uid: firebaseUser.uid, ...data });
                    }
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
                limit(5)
            );
            const snap = await getDocs(q);
            const results = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            console.log('Recent transfers loaded:', results.length, results);
            setRecentTransfers(results);
        } catch (err) {
            console.error('Recent transfers error:', err); // This will show the real error
        }
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
    const LAN_PLATFORM_UID = 'LAN_LIBRARY_PLATFORM'; // fixed document ID in sellers collection

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
                    throw new Error(`Insufficient balance. You need ₦${totalDeducted.toLocaleString()} (₦${amt.toLocaleString()} + ₦50 fee)`);
                }

                // Deduct full amount + fee from sender
                transaction.update(senderRef, {
                    accountBalance: increment(-totalDeducted),
                    updatedAt: serverTimestamp(),
                });

                // Recipient gets exact amount (no fee deducted from them)
                transaction.update(recipientRef, {
                    accountBalance: increment(amt),
                    updatedAt: serverTimestamp(),
                });

                // ₦50 fee goes to LAN Library platform account
                transaction.set(platformRef, {
                    accountBalance: increment(TRANSFER_FEE),
                    totalFeesCollected: increment(TRANSFER_FEE),
                    updatedAt: serverTimestamp(),
                }, { merge: true }); // merge:true creates doc if it doesn't exist

                // Transfer record
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

                // Fee log (separate collection for easy accounting)
                const feeRef = doc(collection(db, 'platformFees'));
                transaction.set(feeRef, {
                    transferId: transferRef.id,
                    senderId: seller.uid,
                    senderName: seller.businessInfo?.businessName || seller.bankDetails?.accountName || 'Unknown',
                    fee: TRANSFER_FEE,
                    transferAmount: amt,
                    createdAt: serverTimestamp(),
                    disbursedToFlutterwave: false, // flag for batch payout later
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

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <Loader2 className="animate-spin text-blue-950" size={40} />
            </div>
        );
    }

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

    const sellerName = seller.businessInfo?.businessName || seller.bankDetails?.accountName || 'Unknown Seller';

    return (
        <div className="bg-gray-50 min-h-screen">
            <Navbar />

            <div className="max-w-5xl mx-auto px-4 py-6 md:py-12">

                {/* ── Page Header ── */}
                <div className="mb-6">
                    <h1 className="text-2xl md:text-4xl font-bold text-blue-900 mb-1">LAN Bank Transfer</h1>
                    <p className="text-sm md:text-base text-gray-600">Send money instantly to any seller on LAN</p>
                </div>

                {/* ── MOBILE: Compact account banner ── */}
                <div className="lg:hidden mb-4">
                    <div className="bg-blue-950 text-white rounded-2xl p-4">
                        <p className="text-blue-300 text-xs font-semibold uppercase tracking-widest mb-3">Your LAN Account</p>
                        <div className="flex items-center justify-between gap-3">
                            {/* Left: name + account number */}
                            <div className="min-w-0 flex-1">
                                <p className="font-bold text-white text-sm truncate">{sellerName}</p>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="font-mono text-blue-200 text-xs tracking-wider">
                                        {formatAccountNumber(seller.accountNumber)}
                                    </span>
                                    <button
                                        onClick={handleCopyAccount}
                                        className="flex-shrink-0 p-1 hover:bg-blue-800 rounded transition-colors"
                                    >
                                        {copied
                                            ? <Check size={13} className="text-green-400" />
                                            : <Copy size={13} className="text-blue-300" />
                                        }
                                    </button>
                                </div>
                            </div>
                            {/* Right: balance */}
                            <div className="flex-shrink-0 text-right">
                                <p className="text-blue-300 text-xs">Balance</p>
                                <p className="text-lg font-bold text-white">₦{(seller.accountBalance || 0).toLocaleString()}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── Main Layout ── */}
                <div className="grid lg:grid-cols-3 gap-6">

                    {/* ── LEFT SIDEBAR (desktop only) ── */}
                    <div className="hidden lg:flex flex-col gap-6">

                        {/* Full account card on desktop */}
                        <div className="bg-blue-950 text-white rounded-2xl p-6 shadow-sm">
                            <p className="text-blue-300 text-xs font-semibold uppercase tracking-widest mb-4">
                                Your LAN Account
                            </p>
                            <div className="bg-blue-900/50 rounded-xl px-4 py-3 border border-blue-700 mb-3">
                                <p className="text-xl font-bold text-white truncate">{sellerName}</p>
                            </div>
                            <div className="flex items-center gap-2 bg-blue-900/50 rounded-xl px-4 py-3 border border-blue-700">
                                <span className="font-mono text-base font-bold text-white tracking-wider flex-1 truncate">
                                    {formatAccountNumber(seller.accountNumber)}
                                </span>
                                <button
                                    onClick={handleCopyAccount}
                                    className="flex-shrink-0 p-1.5 hover:bg-blue-800 rounded-lg transition-colors"
                                >
                                    {copied
                                        ? <Check size={16} className="text-green-400" />
                                        : <Copy size={16} className="text-blue-300" />
                                    }
                                </button>
                            </div>
                            <div className="mt-4 pt-4 border-t border-blue-800">
                                <p className="text-blue-300 text-xs mb-1">Available Balance</p>
                                <p className="text-3xl font-bold text-white">
                                    ₦{(seller.accountBalance || 0).toLocaleString()}
                                </p>
                            </div>
                        </div>

                        {/* Recent Transfers — desktop */}
                        {recentTransfers.length > 0 && (
                            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-200">
                                <h3 className="font-bold text-gray-900 text-sm mb-4">Recent Transfers</h3>
                                <div className="space-y-3">
                                    {recentTransfers.map(t => (
                                        <div key={t.id} className="flex items-center gap-3 min-w-0">
                                            <div className="w-8 h-8 bg-red-50 rounded-full flex items-center justify-center flex-shrink-0">
                                                <ArrowUpRight size={14} className="text-red-500" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-semibold text-gray-900 truncate">{t.recipientName}</p>
                                                <p className="text-xs text-gray-400 font-mono truncate">
                                                    {formatAccountNumber(t.recipientAccountNumber)}
                                                </p>
                                            </div>
                                            <p className="text-xs font-bold text-red-500 flex-shrink-0">
                                                -₦{(t.totalDeducted || t.amount + 50).toLocaleString()}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* ── RIGHT — Transfer Form ── */}
                    <div className="lg:col-span-2 w-full min-w-0">
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden w-full">
                            {/* Step 1 — Form */}
                            {step === 1 && (
                                <div className="p-5 md:p-8">
                                    <h2 className="text-lg md:text-xl font-bold text-gray-900 mb-5">Send Money</h2>

                                    {/* Recipient */}
                                    <div className="mb-5">
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Recipient Account Number
                                        </label>
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                placeholder="LAN-284-7391"
                                                value={recipientAccount}
                                                onChange={e => {
                                                    setRecipientAccount(e.target.value);
                                                    setRecipientInfo(null);
                                                    setLookupError('');
                                                }}
                                                className="flex-1 min-w-0 border text-black border-gray-200 rounded-xl px-3 py-3 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-950 focus:border-transparent"
                                            />
                                            <button
                                                onClick={handleLookup}
                                                disabled={lookingUp || !recipientAccount}
                                                className="flex-shrink-0 px-4 py-3 bg-blue-950 text-white rounded-xl font-semibold hover:bg-blue-900 transition-all flex items-center gap-1.5 disabled:opacity-50 text-sm whitespace-nowrap"
                                            >
                                                {lookingUp
                                                    ? <Loader2 size={15} className="animate-spin" />
                                                    : <Search size={15} />
                                                }
                                                Verify
                                            </button>
                                        </div>

                                        {lookupError && (
                                            <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                                                <AlertCircle size={14} /> {lookupError}
                                            </p>
                                        )}

                                        {recipientInfo && (
                                            <div className="mt-3 bg-green-50 border border-green-200 rounded-xl px-4 py-3 flex items-center gap-3">
                                                <CheckCircle2 size={18} className="text-green-600 flex-shrink-0" />
                                                <div className="min-w-0">
                                                    <p className="font-semibold text-green-900 truncate">
                                                        {recipientInfo.businessInfo?.businessName || recipientInfo.bankDetails?.accountName || 'Unknown account'}
                                                    </p>
                                                    <p className="text-xs text-green-700 font-mono">
                                                        {formatAccountNumber(recipientInfo.accountNumber)}
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Amount */}
                                    <div className="mb-5">
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Amount (₦)</label>
                                        <div className="relative">
                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-lg">₦</span>
                                            <input
                                                type="number"
                                                placeholder="0.00"
                                                value={amount}
                                                onChange={e => setAmount(e.target.value)}
                                                className="w-full border text-black border-gray-200 rounded-xl pl-9 pr-4 py-3 text-lg font-bold focus:outline-none focus:ring-2 focus:ring-blue-950 focus:border-transparent"
                                            />
                                        </div>
                                        <div className="flex gap-2 mt-2 flex-wrap">
                                            {[500, 1000, 2000, 5000].map(q => (
                                                <button
                                                    key={q}
                                                    onClick={() => setAmount(String(q))}
                                                    className="text-xs px-3 py-1.5 bg-gray-100 hover:bg-blue-50 hover:text-blue-950 text-gray-600 rounded-lg font-semibold transition-colors"
                                                >
                                                    ₦{q.toLocaleString()}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* 👇 ADD HERE */}
                                    {amount && Number(amount) >= 100 && (
                                        <div className="mb-4 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 flex items-center justify-between">
                                            <div>
                                                <p className="text-xs text-blue-700 font-semibold">Transaction Fee</p>
                                                <p className="text-xs text-blue-500">Applied to every transfer</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm font-bold text-blue-950">+ ₦50</p>
                                                <p className="text-xs text-blue-600">
                                                    Total: ₦{(Number(amount) + 50).toLocaleString()}
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    {/* Note */}
                                    <div className="mb-6">
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Note (optional)</label>
                                        <input
                                            type="text"
                                            placeholder="What's this for?"
                                            value={note}
                                            onChange={e => setNote(e.target.value)}
                                            className="w-full border text-black border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-950 focus:border-transparent"
                                        />
                                    </div>

                                    <button
                                        onClick={() => {
                                            if (!recipientInfo) { setLookupError('Please verify the account number first'); return; }
                                            if (!amount || Number(amount) < 100) { setTransferError('Minimum transfer is ₦100'); return; }
                                            if (Number(amount) > (seller?.accountBalance || 0)) { setTransferError('Insufficient balance'); return; }
                                            setTransferError('');
                                            setStep(2);
                                        }}
                                        disabled={!recipientInfo || !amount}
                                        className="w-full py-3.5 bg-blue-950 text-white rounded-xl font-bold text-base hover:bg-blue-900 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Continue <ArrowRight size={18} />
                                    </button>

                                    {transferError && (
                                        <p className="mt-3 text-sm text-red-600 flex items-center gap-1 justify-center">
                                            <AlertCircle size={14} /> {transferError}
                                        </p>
                                    )}
                                </div>
                            )}

                            {/* Step 2 — Confirm */}
                            {step === 2 && (
                                <div className="p-5 md:p-8">
                                    <button onClick={() => setStep(1)} className="flex items-center gap-1 text-gray-500 text-sm mb-5 hover:text-gray-800">
                                        ← Back
                                    </button>
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

                                            {/* 👇 ADD HERE */}
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

                                    <button
                                        onClick={handleTransfer}
                                        disabled={transferring}
                                        className="w-full py-3.5 bg-blue-950 text-white rounded-xl font-bold text-base hover:bg-blue-900 transition-all flex items-center justify-center gap-2 disabled:opacity-70"
                                    >
                                        {transferring ? (
                                            <><Loader2 size={18} className="animate-spin" /> Processing...</>
                                        ) : (
                                            <>Confirm Transfer <ArrowRight size={18} /></>
                                        )}
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

                        {/* Recent Transfers — mobile (below form) */}
                        {recentTransfers.length > 0 && (
                            <div className="lg:hidden mt-4 bg-white rounded-2xl p-4 shadow-sm border border-gray-200">
                                <h3 className="font-bold text-gray-900 text-sm mb-3">Recent Transfers</h3>
                                <div className="space-y-3">
                                    {recentTransfers.map(t => (
                                        <div key={t.id} className="flex items-center gap-3 min-w-0">
                                            <div className="w-8 h-8 bg-red-50 rounded-full flex items-center justify-center flex-shrink-0">
                                                <ArrowUpRight size={14} className="text-red-500" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-semibold text-gray-900 truncate">{t.recipientName}</p>
                                                <p className="text-xs text-gray-400 font-mono truncate">
                                                    {formatAccountNumber(t.recipientAccountNumber)}
                                                </p>
                                            </div>
                                            <p className="text-xs font-bold text-red-500 flex-shrink-0">
                                                -₦{(t.totalDeducted || t.amount + 50).toLocaleString()}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                </div>
            </div>
            <Footer />
        </div>
    );
}