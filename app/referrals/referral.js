"use client";

import React, { useState, useEffect } from 'react';
import {
    Gift, Users, Copy, Share2, Check, Eye, EyeOff,
    Loader2, AlertCircle, CheckCircle2, Wallet,
    ChevronRight, Sparkles, ArrowRight, TrendingUp, Star
} from 'lucide-react';
import Navbar from '@/components/NavBar';
import Footer from '@/components/FooterComp';
import { useAuth } from '@/hooks/useAuth';
import { onAuthStateChanged } from 'firebase/auth';
import {
    doc, getDoc, updateDoc, collection, query,
    where, getDocs, addDoc, serverTimestamp,
    increment, runTransaction
} from 'firebase/firestore';
import { auth, db } from '@/lib/firebaseConfig';
import { generateShortCode } from '@/lib/auth/authHelpers'; 

const NAVY  = "#0d2244";
const GOLD  = "#b8963e";
const GOLDD = "#d4aa5a";
const CREAM = "#f5f0e8";
const BG    = "#f5f1ea";



function StatCard({ icon, label, value, highlight }) {
    return (
        <div style={{
            background: '#fff',
            border: '0.5px solid #e5ddd0',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            position: 'relative',
            overflow: 'hidden',
            minWidth: 0,
        }}>
            {highlight && (
                <div style={{
                    position: 'absolute',
                    top: 0, left: 0, right: 0,
                    height: '2px',
                    background: `linear-gradient(90deg, ${GOLD}, ${GOLDD})`
                }} />
            )}
            <div style={{
                width: '36px', height: '36px',
                border: '0.5px solid #e5ddd0',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: CREAM, flexShrink: 0,
            }}>
                {icon}
            </div>
            <p style={{
                fontSize: '9px', fontWeight: 700, letterSpacing: '0.14em',
                textTransform: 'uppercase', color: '#aaa', margin: 0,
                fontFamily: "'Lato',sans-serif"
            }}>
                {label}
            </p>
            <p style={{
                fontFamily: "'Playfair Display',serif",
                fontSize: 'clamp(16px,3.5vw,24px)',
                fontWeight: 700, color: NAVY, margin: 0, lineHeight: 1,
                wordBreak: 'break-word',
            }}>
                {value}
            </p>
        </div>
    );
}

function ReferralCard({ step, title, desc, badge }) {
    return (
        <div style={{ flexShrink: 0, width: '160px' }} className="ref-book-card">
            <div style={{ position: 'relative', marginBottom: '10px' }}>
                <div style={{
                    width: '100%', aspectRatio: '3/4',
                    background: step === 1
                        ? `linear-gradient(145deg, ${NAVY} 0%, #1a3a6e 100%)`
                        : step === 2
                        ? `linear-gradient(145deg, #1a3a6e 0%, #2a4a8e 100%)`
                        : `linear-gradient(145deg, ${GOLD} 0%, ${GOLDD} 100%)`,
                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                    justifyContent: 'center', padding: '16px',
                    position: 'relative', overflow: 'hidden',
                    boxShadow: '0 8px 24px rgba(13,34,68,0.18)',
                }} className="ref-book-img">
                    <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(255,255,255,0.06) 1px,transparent 1px)', backgroundSize: '14px 14px' }} />
                    <p style={{ fontFamily: "'Playfair Display',serif", fontSize: '64px', fontWeight: 900, color: step === 3 ? NAVY : 'rgba(255,255,255,0.1)', margin: 0, lineHeight: 1, position: 'absolute', bottom: '8px', right: '12px', userSelect: 'none' }}>{step}</p>
                    <div style={{ width: '48px', height: '48px', background: step === 3 ? 'rgba(13,34,68,0.15)' : 'rgba(255,255,255,0.12)', border: `0.5px solid ${step === 3 ? 'rgba(13,34,68,0.2)' : 'rgba(255,255,255,0.2)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '10px' }}>
                        {step === 1 && <Share2 size={20} color={GOLDD} />}
                        {step === 2 && <Users size={20} color="rgba(255,255,255,0.8)" />}
                        {step === 3 && <Wallet size={20} color={NAVY} />}
                    </div>
                    <p style={{ fontFamily: "'Playfair Display',serif", fontSize: '13px', fontWeight: 700, color: step === 3 ? NAVY : '#fff', textAlign: 'center', lineHeight: 1.3, position: 'relative', zIndex: 1 }}>{title}</p>
                    <div style={{ position: 'absolute', top: '8px', left: '8px', background: step === 3 ? NAVY : GOLD, color: step === 3 ? GOLDD : NAVY, fontSize: '9px', fontWeight: 700, padding: '2px 6px', fontFamily: "'Lato',sans-serif", letterSpacing: '0.06em', display: 'flex', alignItems: 'center', gap: '3px' }}>
                        <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: step === 3 ? GOLDD : NAVY, display: 'inline-block' }} />
                        STEP {step}
                    </div>
                </div>
            </div>
            <h4 style={{ fontFamily: "'Playfair Display',serif", fontSize: '12px', fontWeight: 700, color: NAVY, margin: '0 0 3px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: 1.35 }}>{title}</h4>
            <p style={{ fontSize: '11px', color: '#888', margin: '0 0 4px', fontFamily: "'Lato',sans-serif", lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{desc}</p>
            <p style={{ fontSize: '11px', fontWeight: 700, color: GOLD, margin: 0, fontFamily: "'Lato',sans-serif" }}>{badge}</p>
        </div>
    );
}

export default function ReferralClient() {
    const { currentUser } = useAuth();
    const [user, setUser]               = useState(null);
    const [copied, setCopied]           = useState(false);
    const [showBalance, setShowBalance] = useState(true);
    const [loading, setLoading]         = useState(true);
    const [claiming, setClaiming]       = useState(false);
    const [claimSuccess, setClaimSuccess]     = useState(false);
    const [claimError, setClaimError]         = useState('');
    const [claimSuccessAmount, setClaimSuccessAmount] = useState(0);

    const [referralStats, setReferralStats] = useState({
        totalEarnings: 0, pendingEarnings: 0,
        totalReferrals: 0, successfulReferrals: 0,
        claimedEarnings: 0, unclaimedEarnings: 0,
    });

    const shortCode = user?.referralCode || '';
    const referralLink = shortCode && typeof window !== 'undefined'
        ? `${window.location.origin}/auth/signup?referral_code=${shortCode}` : '';

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (!firebaseUser) { setLoading(false); return; }
            try {
                const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
                if (userDoc.exists()) {
                    const userData = userDoc.data();
                    setUser({ uid: firebaseUser.uid, ...userData });

                    // ✅ Fix: normalize referralCode to lowercase if wrong
                    const storedCode = userData.referralCode || '';
                    const correctCode = generateShortCode(firebaseUser.uid); // always lowercase

                    if (!storedCode || storedCode !== storedCode.toLowerCase()) {
                        // Update to correct lowercase version
                        await updateDoc(doc(db, 'users', firebaseUser.uid), {
                            referralCode: correctCode
                        });
                        setUser(prev => ({ ...prev, referralCode: correctCode }));
                    }
                }
                await fetchReferralStats(firebaseUser.uid);
            } catch (err) { console.error(err); }
            finally { setLoading(false); }
        });
        return () => unsubscribe();
    }, []);


    const fetchReferralStats = async (uid) => {
        try {
            const snap = await getDocs(
                query(collection(db, 'referrals'), where('referrerId', '==', uid))
            );

            let totalEarnings = 0;
            let claimedEarnings = 0;
            let unclaimedEarnings = 0;
            let pendingEarnings = 0;
            let successfulReferrals = 0;

            snap.docs.forEach(d => {
                const data = d.data();
                const reward = data.reward || 500;

                if (data.status === 'completed') {
                    successfulReferrals++;
                    totalEarnings += reward;
                    if (data.claimed) {
                        claimedEarnings += reward;
                    } else {
                        unclaimedEarnings += reward;
                    }
                } else {
                    pendingEarnings += reward;
                }
            });

            setReferralStats({
                totalEarnings,
                pendingEarnings,
                totalReferrals: snap.size,
                successfulReferrals,
                claimedEarnings,
                unclaimedEarnings,
            });

        } catch (err) {
            console.error('fetchReferralStats ERROR:', err.code, err.message);
        }
    };

    const handleClaim = async () => {
        if (referralStats.unclaimedEarnings <= 0) return;
        setClaimError('');
        setClaiming(true);

        try {
            const uid = user?.uid;
            if (!uid) throw new Error('Not authenticated');

            const snap = await getDocs(
                query(
                    collection(db, 'referrals'),
                    where('referrerId', '==', uid),
                    where('status', '==', 'completed'),
                    where('claimed', '==', false)
                )
            );

            if (snap.empty) {
                setClaimError('No unclaimed rewards found.');
                setClaiming(false);
                return;
            }

            const claimAmount = snap.docs.reduce((s, d) => s + (d.data().reward || 500), 0);

            // ✅ Create the ref BEFORE the transaction
            const creditRef = doc(collection(db, 'referralCredits'));

            await runTransaction(db, async (transaction) => {
                // ALL READS FIRST
                const sellerRef = doc(db, 'sellers', uid);
                const sellerDoc = await transaction.get(sellerRef);

                // ALL WRITES AFTER
                snap.docs.forEach(d =>
                    transaction.update(d.ref, {
                        claimed: true,
                        claimedAt: serverTimestamp()
                    })
                );

                transaction.set(creditRef, {   // ✅ use pre-created ref
                    userId: uid,
                    amount: claimAmount,
                    referralCount: snap.docs.length,
                    createdAt: serverTimestamp(),
                    status: 'completed'
                });

                const userRef = doc(db, 'users', uid);
                transaction.update(userRef, {
                    accountBalance: increment(claimAmount),
                    updatedAt: serverTimestamp()
                });

                if (sellerDoc.exists()) {
                    transaction.update(sellerRef, {
                        accountBalance: increment(claimAmount),
                        referralEarnings: increment(claimAmount),
                        updatedAt: serverTimestamp()
                    });
                }
            });

            await fetchReferralStats(uid);
            setClaimSuccessAmount(claimAmount);
            setClaimSuccess(true);
            setTimeout(() => setClaimSuccess(false), 4000);

        } catch (err) {
            console.error('handleClaim error:', err);
            setClaimError('Failed to claim reward. Please try again.');
        } finally {
            setClaiming(false);
        }
    };

    const handleCopy = async () => {
        if (!referralLink) return;
        await navigator.clipboard.writeText(referralLink);
        setCopied(true); setTimeout(() => setCopied(false), 2000);
    };

    const handleShare = async () => {
        const shareData = { title: 'Join LAN | The Global Student Library 📚', text: 'Join me on LAN Library and get ₦100 bonus! Access thousands of educational documents.', url: referralLink };
        if (navigator.share) { try { await navigator.share(shareData); } catch { handleCopy(); } }
        else { handleCopy(); }
    };

    const displayName = user?.firstName || currentUser?.displayName?.split(' ')[0] || 'Friend';

    if (loading) return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: BG }}>
            <div style={{ textAlign: 'center' }}>
                <div style={{ width: '48px', height: '48px', border: `3px solid ${GOLD}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 14px' }} />
                <p style={{ fontFamily: "'Playfair Display',serif", fontSize: '16px', color: NAVY }}>Loading…</p>
                <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
            </div>
        </div>
    );

    const steps = [
        { step: 1, title: 'Share Your Link', desc: 'Copy your unique referral link and share via WhatsApp, email or social media.', badge: 'Start here' },
        { step: 2, title: 'Friend Signs Up', desc: 'Your friend creates an account, verifies their email & makes a ₦1,000+ purchase.', badge: 'Qualifying action' },
        { step: 3, title: 'Claim to Wallet', desc: 'You earn ₦500 and your friend gets ₦100 bonus. Claim instantly to your seller wallet.', badge: '₦500 per referral' },
    ];

    const requirements = [
        'Friend must sign up using your referral link',
        'Friend must verify their email address',
        'Friend must make first purchase of ₦1,000+ within 30 days',
        'Rewards credited within 24 hours after qualification',
        'Claim anytime — funds go directly into your seller wallet',
    ];

    return (
        <>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400&family=Lato:wght@300;400;700&display=swap');

                *, *::before, *::after { box-sizing: border-box; }

                .lan-root  { font-family:'Lato',sans-serif; background:${BG}; }
                .lan-serif { font-family:'Playfair Display',Georgia,serif; }

                .sbar-none { scrollbar-width:none; -ms-overflow-style:none; }
                .sbar-none::-webkit-scrollbar { display:none; }

                .ref-book-card:hover .ref-book-img {
                    box-shadow:0 16px 40px rgba(13,34,68,0.22) !important;
                    transform:translateY(-4px);
                }
                .ref-book-img { transition:box-shadow 0.25s, transform 0.25s; }

                .gold-pill {
                    display:inline-flex; align-items:center; gap:6px;
                    background:rgba(184,150,62,0.14);
                    border:1px solid rgba(184,150,62,0.3);
                    border-radius:999px; padding:5px 14px;
                }

                @keyframes slideUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
                .anim-up { animation:slideUp 0.5s cubic-bezier(0.4,0,0.2,1) both; }
                @keyframes spin { to{transform:rotate(360deg)} }

                /* ── Hero link bar ── */
                .hero-link-bar {
                    display:flex;
                    flex-direction:column;
                    gap:8px;
                    width:100%;
                    max-width:680px;
                }
                .hero-link-display {
                    background:rgba(255,255,255,0.07);
                    border:0.5px solid rgba(255,255,255,0.15);
                    padding:12px 14px;
                    min-width:0;
                    overflow:hidden;
                    width:100%;
                }
                .hero-link-actions {
                    display:flex;
                    gap:8px;
                    width:100%;
                }
                .hero-link-actions button {
                    flex:1 1 0;
                    min-width:0;
                }

                /* ── Two-col main layout ── */
                .ref-main-grid {
                    display:grid;
                    grid-template-columns:1fr;
                    gap:20px;
                }

                /* ── Stats grid: always 2-col, no overflow ── */
                .ref-stats-grid {
                    display:grid;
                    grid-template-columns:repeat(2,minmax(0,1fr));
                    gap:10px;
                }

                /* ── Claim card top row ── */
                .claim-top-row {
                    display:flex;
                    align-items:flex-start;
                    justify-content:space-between;
                    gap:12px;
                    flex-wrap:wrap;
                }

                /* ── CTA banner ── */
                .cta-banner {
                    display:flex;
                    flex-direction:column;
                    gap:16px;
                    padding:28px 20px;
                }

                /* ── Sidebar share buttons ── */
                .sidebar-share-btns {
                    display:flex;
                    gap:8px;
                    width:100%;
                }
                .sidebar-share-btns button {
                    flex:1 1 0;
                    min-width:0;
                }

                /* ── Desktop overrides ── */
                @media(min-width:900px) {
                    .ref-main-grid { grid-template-columns:2fr 1fr; }

                    .hero-link-bar { flex-direction:row; align-items:stretch; }
                    .hero-link-display { flex:1; width:auto; }
                    .hero-link-actions { width:auto; flex-shrink:0; }
                    .hero-link-actions button { flex:none; width:auto; }

                    .cta-banner {
                        flex-direction:row;
                        align-items:center;
                        justify-content:space-between;
                        padding:40px 32px;
                    }
                    .cta-banner-btn {
                        width:auto !important;
                        max-width:260px !important;
                        flex-shrink:0;
                    }
                }
            `}</style>

            <div className="lan-root" style={{ minHeight: '100vh' }}>
                <Navbar />

                {/* ══ HERO ══════════════════════════════════════════════════ */}
                <section style={{
                    background: NAVY,
                    backgroundImage: 'radial-gradient(rgba(184,150,62,0.06) 1px,transparent 1px)',
                    backgroundSize: '28px 28px',
                    padding: 'clamp(40px,6vw,60px) 20px 48px',
                }}>
                    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                        <div className="anim-up gold-pill" style={{ marginBottom: '18px' }}>
                            <Sparkles size={12} style={{ color: GOLD }} />
                            <span style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: GOLDD, fontFamily: "'Lato',sans-serif" }}>Referral Programme</span>
                        </div>

                        <h1 className="lan-serif anim-up" style={{
                            fontSize: 'clamp(26px,6vw,56px)', fontWeight: 900,
                            color: '#fff', lineHeight: 1.08,
                            letterSpacing: '-0.5px', margin: '0 0 12px',
                        }}>
                            Hi, {displayName} 👋<br />
                            <span style={{ color: GOLDD }}>Invite friends</span> &amp; earn ₦500
                        </h1>

                        <p style={{
                            fontSize: 'clamp(13px,2vw,15px)',
                            color: 'rgba(245,240,232,0.65)',
                            maxWidth: '540px', lineHeight: 1.75,
                            fontWeight: 300, margin: '0 0 24px',
                        }}>
                            Share your unique link — each friend who signs up and makes a qualifying purchase earns you ₦500 straight to your wallet.
                        </p>

                        {/* Referral Link Bar */}
                        <div className="hero-link-bar">
                            <div className="hero-link-display">
                                <p style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: GOLD, margin: '0 0 4px', fontFamily: "'Lato',sans-serif" }}>Your Referral Link</p>
                                <p style={{ fontFamily: 'monospace', fontSize: '12px', color: 'rgba(255,255,255,0.75)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {referralLink || 'Generating your link…'}
                                </p>
                            </div>
                            <div className="hero-link-actions">
                                <button onClick={handleCopy} disabled={!referralLink}
                                    style={{ padding: '12px 14px', background: 'rgba(255,255,255,0.1)', border: '0.5px solid rgba(255,255,255,0.2)', color: '#fff', fontSize: '12px', fontWeight: 700, cursor: referralLink ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontFamily: "'Lato',sans-serif", whiteSpace: 'nowrap', transition: 'background 0.18s' }}
                                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.18)'}
                                    onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                                >
                                    {copied ? <><Check size={14} />Copied!</> : <><Copy size={14} />Copy Link</>}
                                </button>
                                <button onClick={handleShare} disabled={!referralLink}
                                    style={{ padding: '12px 14px', background: GOLD, border: 'none', color: NAVY, fontSize: '12px', fontWeight: 700, cursor: referralLink ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontFamily: "'Lato',sans-serif", whiteSpace: 'nowrap', transition: 'background 0.18s' }}
                                    onMouseEnter={e => e.currentTarget.style.background = GOLDD}
                                    onMouseLeave={e => e.currentTarget.style.background = GOLD}
                                >
                                    <Share2 size={14} />Share
                                </button>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ══ BREADCRUMB ════════════════════════════════════════════ */}
                <div style={{ background: CREAM, borderBottom: '0.5px solid #e5ddd0', padding: '10px 20px' }}>
                    <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontFamily: "'Lato',sans-serif", flexWrap: 'wrap' }}>
                        <a href="/" style={{ color: NAVY, fontWeight: 700, textDecoration: 'none' }}>Home</a>
                        <ChevronRight size={11} style={{ color: '#bbb' }} />
                        <a href="/my-account/seller-account" style={{ color: NAVY, fontWeight: 700, textDecoration: 'none' }}>My Account</a>
                        <ChevronRight size={11} style={{ color: '#bbb' }} />
                        <span style={{ color: '#aaa' }}>Referral Programme</span>
                    </div>
                </div>

                {/* ══ MAIN CONTENT ══════════════════════════════════════════ */}
                <main style={{ maxWidth: '1200px', margin: '0 auto', padding: 'clamp(32px,5vw,56px) 20px' }}>

                    {/* Alerts */}
                    {claimSuccess && (
                        <div style={{ marginBottom: '20px', background: '#f0fdf4', border: '0.5px solid #86efac', padding: '14px 16px', display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                            <CheckCircle2 size={18} style={{ color: '#16a34a', flexShrink: 0, marginTop: '1px' }} />
                            <div>
                                <p style={{ fontWeight: 700, color: '#15803d', margin: '0 0 2px', fontSize: '13px', fontFamily: "'Lato',sans-serif" }}>Reward Claimed! 🎉</p>
                                <p style={{ fontSize: '12px', color: '#166534', margin: 0, fontFamily: "'Lato',sans-serif" }}>₦{claimSuccessAmount.toLocaleString()} has been added to your seller wallet.</p>
                            </div>
                        </div>
                    )}
                    {claimError && (
                        <div style={{ marginBottom: '20px', background: '#fef2f2', border: '0.5px solid #fecaca', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <AlertCircle size={18} style={{ color: '#ef4444', flexShrink: 0 }} />
                            <p style={{ fontSize: '12px', color: '#dc2626', margin: 0, fontFamily: "'Lato',sans-serif" }}>{claimError}</p>
                        </div>
                    )}

                    {/* ── Two-col grid ── */}
                    <div className="ref-main-grid">

                        {/* ═══ LEFT COLUMN ═══ */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', minWidth: 0 }}>

                            {/* Stats */}
                            <div className="ref-stats-grid">
                                <StatCard icon={<TrendingUp size={16} style={{ color: GOLD }} />} label="Total Earnings" value={showBalance ? `₦${referralStats.totalEarnings.toLocaleString()}` : '₦****'} highlight />
                                <StatCard icon={<Users size={16} style={{ color: GOLD }} />} label="Total Referrals" value={referralStats.totalReferrals} />
                                <StatCard icon={<CheckCircle2 size={16} style={{ color: GOLD }} />} label="Successful" value={referralStats.successfulReferrals} />
                                <StatCard icon={<Wallet size={16} style={{ color: GOLD }} />} label="Claimed" value={`₦${referralStats.claimedEarnings.toLocaleString()}`} />
                            </div>

                            {/* Claim card */}
                            <div style={{
                                background: NAVY,
                                backgroundImage: 'radial-gradient(rgba(184,150,62,0.07) 1px,transparent 1px)',
                                backgroundSize: '24px 24px',
                                padding: 'clamp(20px,4vw,28px)',
                                position: 'relative', overflow: 'hidden',
                            }}>
                                <div style={{ position: 'absolute', top: '-30px', right: '-30px', width: '100px', height: '100px', border: '0.5px solid rgba(184,150,62,0.15)', transform: 'rotate(45deg)' }} />

                                <p style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: GOLD, margin: '0 0 8px', fontFamily: "'Lato',sans-serif" }}>Available Reward</p>

                                <div className="claim-top-row">
                                    <div style={{ minWidth: 0 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <p style={{ fontFamily: "'Playfair Display',serif", fontSize: 'clamp(26px,6vw,48px)', fontWeight: 700, color: '#fff', margin: 0, lineHeight: 1 }}>
                                                {showBalance ? `₦${referralStats.unclaimedEarnings.toLocaleString()}` : '₦****'}
                                            </p>
                                            <button onClick={() => setShowBalance(!showBalance)}
                                                style={{ width: '32px', height: '32px', flexShrink: 0, border: '0.5px solid rgba(255,255,255,0.2)', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.6)' }}>
                                                {showBalance ? <Eye size={15} /> : <EyeOff size={15} />}
                                            </button>
                                        </div>
                                        <p style={{ fontSize: '11px', color: 'rgba(184,150,62,0.7)', marginTop: '5px', fontFamily: "'Lato',sans-serif" }}>Unclaimed rewards ready to transfer</p>
                                        {referralStats.claimedEarnings > 0 && (
                                            <p style={{ fontSize: '11px', color: '#86efac', marginTop: '3px', fontFamily: "'Lato',sans-serif" }}>✅ ₦{referralStats.claimedEarnings.toLocaleString()} already added to wallet</p>
                                        )}
                                    </div>

                                    {referralStats.successfulReferrals > 0 && (
                                        <div style={{ background: 'rgba(184,150,62,0.15)', border: '0.5px solid rgba(184,150,62,0.3)', padding: '10px 14px', flexShrink: 0 }}>
                                            <p style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: GOLD, margin: '0 0 3px', fontFamily: "'Lato',sans-serif" }}>Friends Referred</p>
                                            <p style={{ fontFamily: "'Playfair Display',serif", fontSize: '26px', fontWeight: 700, color: '#fff', margin: 0 }}>{referralStats.successfulReferrals}</p>
                                        </div>
                                    )}
                                </div>

                                {referralStats.pendingEarnings > 0 && (
                                    <div style={{ background: 'rgba(255,255,255,0.06)', border: '0.5px solid rgba(255,255,255,0.1)', padding: '10px 14px', margin: '14px 0 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <Loader2 size={13} style={{ color: GOLD, animation: 'spin 1.2s linear infinite', flexShrink: 0 }} />
                                        <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', margin: 0, fontFamily: "'Lato',sans-serif" }}>
                                            ₦{referralStats.pendingEarnings.toLocaleString()} pending — friends yet to qualify
                                        </p>
                                    </div>
                                )}

                                <button onClick={handleClaim}
                                    disabled={claiming || referralStats.unclaimedEarnings <= 0}
                                    style={{
                                        width: '100%', padding: '14px 16px', marginTop: '16px',
                                        background: referralStats.unclaimedEarnings > 0 ? GOLD : 'rgba(255,255,255,0.08)',
                                        border: 'none',
                                        color: referralStats.unclaimedEarnings > 0 ? NAVY : 'rgba(255,255,255,0.3)',
                                        fontSize: '13px', fontWeight: 700,
                                        cursor: referralStats.unclaimedEarnings > 0 && !claiming ? 'pointer' : 'not-allowed',
                                        fontFamily: "'Lato',sans-serif", letterSpacing: '0.05em',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                                        transition: 'background 0.18s',
                                    }}
                                    onMouseEnter={e => { if (referralStats.unclaimedEarnings > 0) e.currentTarget.style.background = GOLDD; }}
                                    onMouseLeave={e => e.currentTarget.style.background = referralStats.unclaimedEarnings > 0 ? GOLD : 'rgba(255,255,255,0.08)'}
                                >
                                    {claiming
                                        ? <><Loader2 size={15} style={{ animation: 'spin 0.8s linear infinite' }} />Claiming…</>
                                        : referralStats.unclaimedEarnings > 0
                                        ? <><Wallet size={15} />Claim ₦{referralStats.unclaimedEarnings.toLocaleString()} to Wallet</>
                                        : <><Wallet size={15} />{referralStats.totalEarnings > 0 ? 'All rewards claimed' : 'No rewards yet'}</>
                                    }
                                </button>
                            </div>

                            {/* How It Works */}
                            <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                                    <p style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: GOLD, margin: 0, fontFamily: "'Lato',sans-serif", whiteSpace: 'nowrap' }}>How It Works</p>
                                    <div style={{ height: '1px', flex: 1, background: 'rgba(184,150,62,0.2)' }} />
                                    <span style={{ fontSize: '11px', color: '#aaa', fontFamily: "'Lato',sans-serif", whiteSpace: 'nowrap' }}>3 steps</span>
                                </div>
                                <div className="sbar-none" style={{ overflowX: 'auto', margin: '0 -4px', padding: '0 4px 8px' }}>
                                    <div style={{ display: 'flex', gap: '14px', paddingBottom: '4px' }}>
                                        {steps.map(s => <ReferralCard key={s.step} {...s} />)}
                                    </div>
                                </div>
                            </div>

                            {/* Requirements */}
                            <div style={{ background: '#fff', border: '0.5px solid #e5ddd0', padding: 'clamp(16px,4vw,24px)' }}>
                                <p style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: GOLD, marginBottom: '4px', fontFamily: "'Lato',sans-serif" }}>Rules</p>
                                <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: 'clamp(16px,3vw,20px)', fontWeight: 700, color: NAVY, margin: '0 0 16px' }}>Qualification Requirements</h3>
                                <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    {requirements.map((req, i) => (
                                        <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                                            <div style={{ width: '18px', height: '18px', background: CREAM, border: '0.5px solid #e5ddd0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '2px' }}>
                                                <Check size={10} style={{ color: NAVY }} strokeWidth={3} />
                                            </div>
                                            <span style={{ fontSize: '13px', color: '#555', fontFamily: "'Lato',sans-serif", lineHeight: 1.6 }}>{req}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>

                        {/* ═══ RIGHT COLUMN (sidebar) ═══ */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px', minWidth: 0 }}>

                            {/* Referral code card */}
                            <div style={{ background: '#fff', border: '0.5px solid #e5ddd0', padding: 'clamp(16px,4vw,24px)' }}>
                                <p style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: GOLD, marginBottom: '4px', fontFamily: "'Lato',sans-serif" }}>Share</p>
                                <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: 'clamp(15px,3vw,18px)', fontWeight: 700, color: NAVY, margin: '0 0 14px' }}>Your Referral Link</h3>

                                <div style={{ background: CREAM, border: '0.5px solid #e5ddd0', padding: '10px 12px', marginBottom: '10px' }}>
                                    <p style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#aaa', margin: '0 0 3px', fontFamily: "'Lato',sans-serif" }}>Your code</p>
                                    <p style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '15px', color: NAVY, margin: 0, letterSpacing: '0.08em' }}>{shortCode || '—'}</p>
                                </div>

                                <div style={{ background: '#f9f9f9', border: '0.5px solid #e5ddd0', padding: '10px 12px', marginBottom: '12px', overflow: 'hidden' }}>
                                    <p style={{ fontFamily: 'monospace', fontSize: '11px', color: '#666', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {referralLink || 'Loading…'}
                                    </p>
                                </div>

                                <div className="sidebar-share-btns">
                                    <button onClick={handleCopy} disabled={!referralLink}
                                        style={{ padding: '11px 8px', border: `1.5px solid ${NAVY}`, background: '#fff', color: NAVY, fontSize: '11px', fontWeight: 700, cursor: referralLink ? 'pointer' : 'not-allowed', fontFamily: "'Lato',sans-serif", display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', transition: 'all 0.18s', opacity: referralLink ? 1 : 0.5 }}
                                        onMouseEnter={e => { if (referralLink) { e.currentTarget.style.background = NAVY; e.currentTarget.style.color = '#fff'; } }}
                                        onMouseLeave={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.color = NAVY; }}
                                    >
                                        {copied ? <><Check size={13} />Copied</> : <><Copy size={13} />Copy</>}
                                    </button>
                                    <button onClick={handleShare} disabled={!referralLink}
                                        style={{ padding: '11px 8px', border: 'none', background: NAVY, color: '#fff', fontSize: '11px', fontWeight: 700, cursor: referralLink ? 'pointer' : 'not-allowed', fontFamily: "'Lato',sans-serif", display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', transition: 'background 0.18s', opacity: referralLink ? 1 : 0.5 }}
                                        onMouseEnter={e => { if (referralLink) e.currentTarget.style.background = '#1a3a6e'; }}
                                        onMouseLeave={e => e.currentTarget.style.background = NAVY}
                                    >
                                        <Share2 size={13} />Share
                                    </button>
                                </div>
                            </div>

                            {/* Earnings potential */}
                            <div style={{
                                background: NAVY,
                                backgroundImage: 'radial-gradient(rgba(184,150,62,0.06) 1px,transparent 1px)',
                                backgroundSize: '20px 20px',
                                padding: 'clamp(16px,4vw,24px)',
                                position: 'relative', overflow: 'hidden',
                            }}>
                                <div style={{ position: 'absolute', bottom: '-20px', right: '-20px', width: '80px', height: '80px', border: '0.5px solid rgba(184,150,62,0.2)', transform: 'rotate(45deg)' }} />
                                <div className="gold-pill" style={{ marginBottom: '12px' }}>
                                    <Sparkles size={10} style={{ color: GOLD }} />
                                    <span style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: GOLD, fontFamily: "'Lato',sans-serif" }}>Earnings Potential</span>
                                </div>
                                <p style={{ fontFamily: "'Playfair Display',serif", fontSize: 'clamp(20px,4vw,28px)', fontWeight: 700, color: '#fff', margin: '0 0 4px' }}>Up to ₦5,000,000</p>
                                <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', marginBottom: '16px', fontFamily: "'Lato',sans-serif", lineHeight: 1.6 }}>No cap on earnings. Refer as many friends as you like.</p>
                                {[
                                    ['10 referrals', '₦5,000'],
                                    ['50 referrals', '₦25,000'],
                                    ['100 referrals', '₦50,000'],
                                ].map(([k, v]) => (
                                    <div key={k} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', padding: '7px 0', borderBottom: '0.5px solid rgba(255,255,255,0.06)', gap: '8px' }}>
                                        <span style={{ color: 'rgba(255,255,255,0.5)', fontFamily: "'Lato',sans-serif" }}>{k}</span>
                                        <span style={{ fontWeight: 700, color: GOLDD, fontFamily: "'Lato',sans-serif", flexShrink: 0 }}>{v}</span>
                                    </div>
                                ))}
                                <button onClick={handleShare} disabled={!referralLink}
                                    style={{ width: '100%', marginTop: '14px', background: GOLD, color: NAVY, padding: '12px', border: 'none', fontSize: '12px', fontWeight: 700, cursor: 'pointer', fontFamily: "'Lato',sans-serif", letterSpacing: '0.05em', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: 'background 0.18s', opacity: referralLink ? 1 : 0.5 }}
                                    onMouseEnter={e => e.currentTarget.style.background = GOLDD}
                                    onMouseLeave={e => e.currentTarget.style.background = GOLD}
                                >
                                    <Users size={14} />Invite Your Friends
                                </button>
                            </div>

                            {/* Stats detail */}
                            <div style={{ background: '#fff', border: '0.5px solid #e5ddd0', padding: 'clamp(16px,4vw,24px)' }}>
                                <p style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: GOLD, marginBottom: '4px', fontFamily: "'Lato',sans-serif" }}>Overview</p>
                                <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: 'clamp(15px,3vw,18px)', fontWeight: 700, color: NAVY, margin: '0 0 14px' }}>Your Stats</h3>
                                {[
                                    ['Total referrals',   referralStats.totalReferrals],
                                    ['Successful',        referralStats.successfulReferrals],
                                    ['Claimed to wallet', `₦${referralStats.claimedEarnings.toLocaleString()}`],
                                    ['Pending',           `₦${referralStats.pendingEarnings.toLocaleString()}`],
                                    ['Total earned',      `₦${referralStats.totalEarnings.toLocaleString()}`],
                                ].map(([k, v], i, arr) => (
                                    <div key={k} style={{
                                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                        fontSize: '12px', padding: '8px 0', gap: '8px',
                                        borderBottom: i < arr.length - 1 ? '0.5px solid #f0ebe0' : 'none',
                                        borderTop: i === arr.length - 1 ? '0.5px solid #e5ddd0' : 'none',
                                        marginTop: i === arr.length - 1 ? '4px' : 0,
                                        paddingTop: i === arr.length - 1 ? '12px' : '8px',
                                    }}>
                                        <span style={{ color: '#aaa', fontFamily: "'Lato',sans-serif" }}>{k}</span>
                                        <span style={{ fontWeight: 700, color: i === arr.length - 1 ? NAVY : '#555', fontFamily: "'Lato',sans-serif", fontSize: i === arr.length - 1 ? '14px' : '12px', flexShrink: 0 }}>{v}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* CTA Banner */}
                    <section style={{ background: CREAM, border: '0.5px solid #e5ddd0', marginTop: '20px' }} className="cta-banner">
                        <div>
                            <p style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: GOLD, marginBottom: '4px', fontFamily: "'Lato',sans-serif" }}>Start Today</p>
                            <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: 'clamp(18px,3vw,26px)', fontWeight: 700, color: NAVY, margin: '0 0 6px' }}>The more friends, the more you earn</h3>
                            <p style={{ fontSize: '13px', color: '#888', margin: 0, fontFamily: "'Lato',sans-serif" }}>Rewards go straight into your seller wallet — no waiting, no minimum.</p>
                        </div>
                        <button onClick={handleShare} disabled={!referralLink} className="cta-banner-btn"
                            style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '14px 24px', background: NAVY, color: '#fff', fontSize: '13px', fontWeight: 700, border: 'none', cursor: referralLink ? 'pointer' : 'not-allowed', fontFamily: "'Lato',sans-serif", letterSpacing: '0.05em', transition: 'background 0.18s', opacity: referralLink ? 1 : 0.5, width: '100%' }}
                            onMouseEnter={e => { if (referralLink) e.currentTarget.style.background = '#1a3a6e'; }}
                            onMouseLeave={e => e.currentTarget.style.background = NAVY}
                        >
                            <Share2 size={15} /> Share Now <ArrowRight size={13} />
                        </button>
                    </section>
                </main>

                <Footer />
            </div>
        </>
    );
}