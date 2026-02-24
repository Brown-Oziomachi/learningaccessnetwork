    'use client';

    import React, { useState, useEffect } from 'react';
    import { Gift, Users, Copy, Share2, Check, Eye, EyeOff, Loader2, AlertCircle, CheckCircle2, Wallet } from 'lucide-react';
    import Navbar from '@/components/NavBar';
    import Footer from '@/components/FooterComp';
    import { useAuth } from '@/hooks/useAuth';
    import { onAuthStateChanged } from 'firebase/auth';
    import {
        doc,
        getDoc,
        updateDoc,
        collection,
        query,
        where,
        getDocs,
        addDoc,
        serverTimestamp,
        increment,
        setDoc,
        runTransaction
    } from 'firebase/firestore';
    import { auth, db } from '@/lib/firebaseConfig';

// Generates a short code like "browne634920" from a UID
const generateShortCode = (uid) => {
    if (!uid) return '';
    const letters = uid.replace(/[^a-zA-Z]/g, '').slice(0, 5).toLowerCase();
    const numbers = uid.replace(/[^0-9]/g, '').slice(0, 6).padEnd(6, '0');
    return `${letters}${numbers}`;
};

    export default function ReferralClient() {
        const { currentUser } = useAuth();
        const [user, setUser] = useState(null);
        const [copied, setCopied] = useState(false);
        const [showBalance, setShowBalance] = useState(true);
        const [loading, setLoading] = useState(true);
        const [claiming, setClaiming] = useState(false);
        const [claimSuccess, setClaimSuccess] = useState(false);
        const [claimError, setClaimError] = useState('');
        const [claimSuccessAmount, setClaimSuccessAmount] = useState(0);

        const [referralStats, setReferralStats] = useState({
            totalEarnings: 0,
            pendingEarnings: 0,
            totalReferrals: 0,
            successfulReferrals: 0,
            claimedEarnings: 0,
            unclaimedEarnings: 0,
        });

        // Use UID as the referral code - unique and reliable
        const rawUid = user?.uid || currentUser?.uid || '';
        const shortCode = generateShortCode(rawUid);
        const referralLink = shortCode && typeof window !== 'undefined'
            ? `${window.location.origin}/auth/signup?referral_code=${shortCode}`            : '';

        // ── Fetch user & referral data from Firestore ──────────────────────────
        useEffect(() => {
            const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
                if (!firebaseUser) { setLoading(false); return; }

                try {
                    const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
                    if (userDoc.exists()) {
                        const userData = userDoc.data();
                        setUser({ uid: firebaseUser.uid, ...userData });

                        // ✅ Save shortCode once if not already set
                        if (!userData.referralCode) {
                            const short = generateShortCode(firebaseUser.uid);
                            await updateDoc(doc(db, 'users', firebaseUser.uid), {
                                referralCode: short
                            });
                        }
                    }

                    await fetchReferralStats(firebaseUser.uid);
                } catch (err) {
                    console.error('Error fetching user:', err);
                } finally {
                    setLoading(false);
                }
            });
            return () => unsubscribe();
        }, []);
        const fetchReferralStats = async (uid) => {
            try {
                // Get all referrals where this user is the referrer
                const referralsQuery = query(
                    collection(db, 'referrals'),
                    where('referrerId', '==', uid)
                );
                const snap = await getDocs(referralsQuery);
                const referrals = snap.docs.map(d => ({ id: d.id, ...d.data() }));

                const totalReferrals = referrals.length;
                const successful = referrals.filter(r => r.status === 'completed');
                const successfulReferrals = successful.length;

                const totalEarnings = successful.reduce((sum, r) => sum + (r.reward || 500), 0);
                const claimedEarnings = successful
                .filter(r => r.claimed === true)
                .reduce((sum, r) => sum + (r.reward || 500), 0);
                const unclaimedEarnings = totalEarnings - claimedEarnings;

                const pending = referrals.filter(r => r.status === 'pending');
                const pendingEarnings = pending.length * 500;

                setReferralStats({
                    totalEarnings,
                    pendingEarnings,
                    totalReferrals,
                    successfulReferrals,
                    claimedEarnings,
                    unclaimedEarnings,
                });
            } catch (err) {
                console.error('Error fetching referral stats:', err);
            }
        };

        const handleClaim = async () => {
            if (referralStats.unclaimedEarnings <= 0) return;
            setClaimError('');
            setClaiming(true);
            setReferralStats(prev => ({ ...prev, unclaimedEarnings: 0 }));

            try {
                const uid = user?.uid;
                if (!uid) throw new Error('User not authenticated');

                const referralsQuery = query(
                    collection(db, 'referrals'),
                    where('referrerId', '==', uid),
                    where('status', '==', 'completed'),
                    where('claimed', '==', false)
                );
                const snap = await getDocs(referralsQuery);

                if (snap.empty) {
                    setClaimError('No unclaimed rewards found.');
                    setClaiming(false);
                    return;
                }

                const claimAmount = referralStats.unclaimedEarnings;

                // ✅ Run transaction FIRST
                await runTransaction(db, async (transaction) => {
                    const sellerRef = doc(db, 'sellers', uid);
                    const sellerDoc = await transaction.get(sellerRef);

                    snap.docs.forEach(refDoc => {
                        transaction.update(refDoc.ref, {
                            claimed: true,
                            claimedAt: serverTimestamp(),
                        });
                    });

                    const creditRef = doc(collection(db, 'referralCredits'));
                    transaction.set(creditRef, {
                        userId: uid,
                        amount: claimAmount,
                        referralCount: snap.docs.length,
                        createdAt: serverTimestamp(),
                        status: 'completed',
                    });

                    if (sellerDoc.exists()) {
                        transaction.update(sellerRef, {
                            accountBalance: increment(claimAmount),
                            totalEarnings: increment(claimAmount),
                            referralEarnings: increment(claimAmount),
                            updatedAt: serverTimestamp(),
                        });
                    } else {
                        transaction.set(sellerRef, {
                            sellerId: uid,
                            sellerEmail: user?.email || '',
                            sellerName: user?.displayName || `${user?.firstName || ''} ${user?.surname || ''}`.trim(),
                            accountBalance: claimAmount,
                            totalEarnings: claimAmount,
                            referralEarnings: claimAmount,
                            booksSold: 0,
                            totalWithdrawn: 0,
                            createdAt: serverTimestamp(),
                            updatedAt: serverTimestamp(),
                        });
                    }
                });

                // ✅ THEN fetch updated stats & show success
                await fetchReferralStats(uid);
                setClaimSuccessAmount(claimAmount);
                setClaimSuccess(true);
                setTimeout(() => setClaimSuccess(false), 4000);

            } catch (err) {
                console.error('Claim error:', err);
                setClaimError('Failed to claim reward. Please try again.');
            } finally {
                setClaiming(false);
            }
        };

        // ── Copy & Share ───────────────────────────────────────────────────────
        const handleCopy = async () => {
            if (!referralLink) return;
            await navigator.clipboard.writeText(referralLink);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        };

        const handleShare = async () => {
            const shareData = {
                title: 'Join LAN | The Global Student Library 📚',
                text: 'Join me on LAN Library and get ₦100 bonus! Access thousands of educational documents.',
                url: referralLink,
            };
            if (navigator.share) {
                try { await navigator.share(shareData); } catch { handleCopy(); }
            } else {
                handleCopy();
            }
        };

        const displayName = user?.firstName || currentUser?.displayName?.split(' ')[0] || 'Friend';

        if (loading) {
            return (
                <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                    <Loader2 className="animate-spin text-blue-950" size={40} />
                </div>
            );
        }

        return (
            <div className="bg-gray-50 min-h-screen">
                <Navbar />
                <div className="max-w-7xl mx-auto px-4 py-12">

                    {/* Header */}
                    <div className="mb-8">
                        <h1 className="text-3xl md:text-4xl font-bold text-blue-900 mb-1">
                            Hi, {displayName} 👋
                        </h1>
                        <p className="text-gray-500">Invite friends and grow your wallet</p>
                    </div>

                    {/* Success Banner */}
                    {claimSuccess && (
                        <div className="mb-6 bg-green-50 border border-green-200 rounded-2xl p-4 flex items-center gap-3">
                            <CheckCircle2 className="text-green-600 flex-shrink-0" size={22} />
                            <div>
                                <p className="font-semibold text-green-800">Reward Claimed! 🎉</p>
                                <p className="text-sm text-green-700">
                                    ₦{claimSuccessAmount.toLocaleString()} has been added to your seller wallet.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Error Banner */}
                    {claimError && (
                        <div className="mb-6 bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center gap-3">
                            <AlertCircle className="text-red-600 flex-shrink-0" size={22} />
                            <p className="text-sm text-red-700">{claimError}</p>
                        </div>
                    )}

                    {/* Main Grid */}
                    <div className="grid lg:grid-cols-2 gap-6 mb-8">
                        {/* Referral Card */}
                        <div className="bg-blue-950 text-white rounded-2xl p-8 shadow-sm">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-12 h-12 bg-blue-800 rounded-xl flex items-center justify-center">
                                    <Users className="text-white" size={24} />
                                </div>
                                <h2 className="text-xl font-bold">Referral Program</h2>
                            </div>
                            <h3 className="text-3xl md:text-4xl font-bold mb-4">
                                Invite friends and earn ₦500
                            </h3>
                            <div className="space-y-3 text-blue-200">
                                <p className="leading-relaxed">
                                    Earn ₦500 for each friend who signs up using your link, verifies their email, and makes a purchase of ₦1,000 or more within 30 days.
                                </p>
                            </div>
                            {referralStats.successfulReferrals > 0 && (
                                <div className="mt-6 p-4 bg-blue-800/50 rounded-xl border border-blue-700">
                                    <p className="text-sm text-green-300 font-medium">
                                        🎉 You've successfully referred {referralStats.successfulReferrals}{' '}
                                        {referralStats.successfulReferrals === 1 ? 'friend' : 'friends'}!
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Reward Card */}
                        <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-200">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center">
                                    <Gift className="text-indigo-600" size={24} />
                                </div>
                                <h2 className="text-xl font-bold text-gray-900">Your Reward</h2>
                            </div>

                            <div className="mb-2">
                                <div className="flex items-center gap-3 mb-1">
                                    <h3 className="text-4xl md:text-5xl font-bold text-gray-900">
                                        {showBalance
                                            ? `₦${referralStats.totalEarnings.toLocaleString()}`
                                            : '₦****'}
                                    </h3>
                                    <button
                                        onClick={() => setShowBalance(!showBalance)}
                                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                    >
                                        {showBalance
                                            ? <Eye size={20} className="text-gray-500" />
                                            : <EyeOff size={20} className="text-gray-500" />}
                                    </button>
                                </div>
                                <p className="text-gray-500 text-sm mb-1">Total referral earnings</p>
                                {referralStats.claimedEarnings > 0 && (
                                    <p className="text-xs text-green-600 font-medium">
                                        ✅ ₦{referralStats.claimedEarnings.toLocaleString()} already added to wallet
                                    </p>
                                )}
                            </div>

                            {/* Unclaimed amount highlight */}
                            {referralStats.unclaimedEarnings > 0 && (
                                <div className="my-4 bg-green-50 border border-green-200 rounded-xl p-3">
                                    <p className="text-sm text-green-800 font-semibold">
                                        💰 ₦{referralStats.unclaimedEarnings.toLocaleString()} ready to claim!
                                    </p>
                                </div>
                            )}

                            {/* Claim Button */}
                            <button
                                onClick={handleClaim}
                                disabled={claiming || referralStats.unclaimedEarnings <= 0}
                                className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all
                                    ${referralStats.unclaimedEarnings > 0
                                        ? 'bg-blue-950 text-white hover:bg-blue-900 cursor-pointer'
                                        : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
                            >
                                {claiming ? (
                                    <>
                                        <Loader2 size={20} className="animate-spin" />
                                        Claiming...
                                    </>
                                ) : referralStats.unclaimedEarnings > 0 ? (
                                    <>
                                        <Wallet size={20} />
                                        Claim ₦{referralStats.unclaimedEarnings.toLocaleString()} to Wallet
                                    </>
                                ) : (
                                    <>
                                        <Wallet size={20} />
                                        {referralStats.totalEarnings > 0 ? 'All rewards claimed' : 'No rewards yet'}
                                    </>
                                )}
                            </button>

                            {referralStats.pendingEarnings > 0 && (
                                <p className="text-xs text-gray-500 mt-3 text-center">
                                    ⏳ ₦{referralStats.pendingEarnings.toLocaleString()} pending (friends yet to qualify)
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Referral Link Section */}
                    <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-gray-200 mb-8">
                        <p className="text-gray-700 font-semibold text-lg mb-4">Your Referral Link</p>
                        <div className="flex flex-col md:flex-row gap-3">
                            <div className="flex-1 bg-gray-50 rounded-xl px-5 py-4 border border-gray-200 overflow-hidden">
                                <p className="text-gray-900 font-mono text-sm truncate">
                                    {referralLink || 'Loading your link...'}
                                </p>
                            </div>
                            <div className="flex gap-3">
                                <button
                                    onClick={handleCopy}
                                    disabled={!referralLink}
                                    className="px-5 py-4 bg-white border-2 border-blue-950 text-blue-950 rounded-xl font-semibold hover:bg-blue-50 transition-all flex items-center gap-2 whitespace-nowrap disabled:opacity-50"
                                >
                                    {copied ? <><Check size={18} />Copied!</> : <><Copy size={18} />Copy</>}
                                </button>
                                <button
                                    onClick={handleShare}
                                    disabled={!referralLink}
                                    className="px-5 py-4 bg-blue-950 text-white rounded-xl font-semibold hover:bg-blue-900 transition-all flex items-center gap-2 whitespace-nowrap disabled:opacity-50"
                                >
                                    <Share2 size={18} />Share
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* How It Works */}
                    <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-200 mb-8">
                        <h3 className="text-2xl font-bold text-gray-900 mb-8">How it works</h3>
                        <div className="grid md:grid-cols-3 gap-8">
                            {[
                                {
                                    step: 1,
                                    title: 'Share your link',
                                    desc: 'Copy your unique referral link and share it via WhatsApp, email, or social media.',
                                },
                                {
                                    step: 2,
                                    title: 'Friend signs up',
                                    desc: 'Your friend creates an account, verifies their email, and makes their first purchase of ₦1,000 or more.',
                                },
                                {
                                    step: 3,
                                    title: 'Claim to wallet',
                                    desc: 'You earn ₦500 and your friend gets ₦100. Click "Claim to Wallet" and funds appear in your seller balance instantly.',
                                },
                            ].map(({ step, title, desc }) => (
                                <div key={step}>
                                    <div className="flex items-center gap-4 mb-4">
                                        <div className="w-10 h-10 bg-blue-950 text-white rounded-full flex items-center justify-center font-bold text-lg flex-shrink-0">
                                            {step}
                                        </div>
                                        <h4 className="text-lg font-bold text-gray-900">{title}</h4>
                                    </div>
                                    <p className="text-gray-600 ml-14">{desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Stats & Requirements */}
                    <div className="grid md:grid-cols-2 gap-6 mb-12">
                        {/* Stats */}
                        <div className="bg-gradient-to-br from-blue-950 to-indigo-900 rounded-2xl p-8">
                            <h4 className="text-xl font-bold text-white mb-6">Your Referral Stats</h4>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <span className="text-blue-200">Total referrals</span>
                                    <span className="text-2xl font-bold text-white">{referralStats.totalReferrals}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-blue-200">Successful referrals</span>
                                    <span className="text-2xl font-bold text-green-400">{referralStats.successfulReferrals}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-blue-200">Claimed to wallet</span>
                                    <span className="text-2xl font-bold text-yellow-300">₦{referralStats.claimedEarnings.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between items-center pt-4 border-t border-blue-700">
                                    <span className="text-blue-200">Total earned</span>
                                    <span className="text-2xl font-bold text-white">₦{referralStats.totalEarnings.toLocaleString()}</span>
                                </div>
                            </div>
                        </div>

                        {/* Requirements */}
                        <div className="bg-white rounded-2xl p-8 border border-gray-200">
                            <h4 className="text-xl font-bold text-gray-900 mb-6">Requirements</h4>
                            <ul className="space-y-3 text-gray-600">
                                {[
                                    'Friend must sign up using your referral link',
                                    'Friend must verify their email address',
                                    'Friend must make first purchase of ₦1,000+ within 30 days',
                                    'Rewards credited within 24 hours after qualification',
                                    'Claim anytime — funds go directly into your seller wallet',
                                ].map((req, i) => (
                                    <li key={i} className="flex items-start gap-3">
                                        <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                            <Check size={12} className="text-green-700" />
                                        </div>
                                        <span>{req}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    {/* CTA */}
                    <div className="bg-blue-950 rounded-2xl p-8 md:p-12 text-center text-white">
                        <h3 className="text-3xl md:text-4xl font-bold mb-4">Start earning today!</h3>
                        <p className="text-lg text-blue-200 mb-8 max-w-2xl mx-auto">
                            The more friends you refer, the more you earn. Rewards go straight into your wallet.
                        </p>
                        <button
                            onClick={handleShare}
                            disabled={!referralLink}
                            className="bg-white text-blue-950 px-8 py-4 rounded-xl font-bold hover:bg-gray-100 transition-all inline-flex items-center gap-2 text-lg disabled:opacity-50"
                        >
                            <Share2 size={24} />
                            Share Now
                        </button>
                    </div>
                </div>
                <Footer />
            </div>
        );
    }