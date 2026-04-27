'use client';

import React, { useState, useEffect } from 'react';
import { ArrowLeft, AlertCircle, Search, Mail, Eye, EyeOff, Lock, Phone } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { signInWithEmailAndPassword, onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebaseConfig';
import Link from 'next/link';

const NAVY = "#0d2244";
const GOLD  = "#b8963e";
const BG    = "#f5f1ea";
const CREAM = "#f5f0e8";

export default function FindAccountClient() {
    const router = useRouter();

    const [step, setStep] = useState('search'); // search | confirm | password
    const [searchInput, setSearchInput] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [checkingAuth, setCheckingAuth] = useState(true);
    const [showSuspendedModal, setShowSuspendedModal] = useState(false);
    const [showPendingModal, setShowPendingModal] = useState(false);

    const [maskedEmail, setMaskedEmail] = useState('');
    const [maskedPhone, setMaskedPhone] = useState('');
    const [actualEmail, setActualEmail] = useState('');

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) router.replace("/home");
            else setCheckingAuth(false);
        });
        return () => unsubscribe();
    }, [router]);

    const handleSearch = async () => {
        if (!searchInput.trim()) { setError('Please enter your email or mobile number'); return; }
        setLoading(true); setError('');
        try {
            const res = await fetch('/api/find-account', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ searchTerm: searchInput.trim() }),
            });
            const data = await res.json();
            if (!res.ok) { setError(data.error || 'Something went wrong.'); return; }
            if (!data.found) { setError('No account found. Please check and try again.'); return; }
            if (data.accountStatus === 'suspended') { setShowSuspendedModal(true); return; }
            if (data.accountStatus === 'pending') { setShowPendingModal(true); return; }
            setMaskedEmail(data.maskedEmail);
            setMaskedPhone(data.maskedPhone);
            setActualEmail(data.email);
            setStep('confirm');
        } catch { setError('Something went wrong. Please try again.'); }
        finally { setLoading(false); }
    };

    const handleLogin = async () => {
        if (!password.trim()) { setError('Enter your password'); return; }
        setLoading(true); setError('');
        try {
            await signInWithEmailAndPassword(auth, actualEmail, password);
            router.push('/home');
        } catch (err) {
            switch (err.code) {
                case 'auth/invalid-credential':
                case 'auth/wrong-password':
                case 'auth/user-not-found': setError('Incorrect email or password. Please try again.'); break;
                case 'auth/too-many-requests': setError('Too many failed login attempts. Please try again later or reset your password.'); break;
                case 'auth/user-disabled': setError('This account has been disabled. Please contact support.'); break;
                default: setError('Failed to sign in. Please try again later.');
            }
        } finally { setLoading(false); }
    };

    const resetFlow = () => {
        setStep('search'); setSearchInput(''); setPassword(''); setError('');
        setMaskedEmail(''); setMaskedPhone(''); setActualEmail('');
    };

    const stepTitles = { search: 'Find your account', confirm: 'Is this you?', password: 'Enter your password' };
    const stepSubtitles = {
        search: 'Enter your mobile number or email address.',
        confirm: 'We found an account matching your details.',
        password: `Signing in with ${maskedEmail}`,
    };

    if (checkingAuth) return (
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: BG }}>
            <div style={{ width: 36, height: 36, border: `3px solid rgba(13,34,68,0.1)`, borderTopColor: NAVY, borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );

    return (
        <>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400&family=Lato:wght@300;400;700&display=swap');
                .lan-serif { font-family: 'Playfair Display', Georgia, serif; }
                .lan-body  { font-family: 'Lato', sans-serif; }
                .hero-bg {
                    background-color: ${NAVY};
                    background-image:
                        radial-gradient(rgba(184,150,62,0.06) 1px, transparent 1px),
                        radial-gradient(rgba(255,255,255,0.03) 1px, transparent 1px);
                    background-size: 28px 28px, 14px 14px;
                    background-position: 0 0, 7px 7px;
                }
                .lan-input {
                    width: 100%; padding: 13px 16px 13px 44px;
                    background: #fff; border: 0.5px solid #e5ddd0;
                    font-family: 'Lato', sans-serif; font-size: 13px; color: ${NAVY};
                    outline: none; transition: border-color 0.15s; box-sizing: border-box;
                }
                .lan-input:focus { border-color: ${GOLD}; }
                .lan-input::placeholder { color: #bbb; }
                .lan-input-plain {
                    width: 100%; padding: 13px 44px 13px 44px;
                    background: #fff; border: 0.5px solid #e5ddd0;
                    font-family: 'Lato', sans-serif; font-size: 13px; color: ${NAVY};
                    outline: none; transition: border-color 0.15s; box-sizing: border-box;
                }
                .lan-input-plain:focus { border-color: ${GOLD}; }
                .lan-input-plain::placeholder { color: #bbb; }
                .btn-primary {
                    width: 100%; padding: 14px; background: ${NAVY}; color: #fff;
                    border: none; font-family: 'Lato', sans-serif; font-size: 13px;
                    font-weight: 700; letter-spacing: 0.04em; cursor: pointer;
                    transition: background 0.15s; display: flex; align-items: center; justify-content: center; gap: 8px;
                    box-sizing: border-box;
                }
                .btn-primary:hover:not(:disabled) { background: #162d57; }
                .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
                .btn-outline {
                    width: 100%; padding: 14px; background: transparent; color: ${NAVY};
                    border: 0.5px solid ${NAVY}; font-family: 'Lato', sans-serif; font-size: 13px;
                    font-weight: 700; letter-spacing: 0.04em; cursor: pointer;
                    transition: background 0.15s; box-sizing: border-box;
                }
                .btn-outline:hover { background: rgba(13,34,68,0.05); }
                @keyframes slideUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
                .anim-up { animation: slideUp 0.45s cubic-bezier(0.4,0,0.2,1) both; }
                @keyframes spin { to { transform: rotate(360deg); } }

                .fa-card { width: 100%; max-width: 480px; background: #fff; border: 0.5px solid #e5ddd0; padding: 42px 40px; }

                @media (max-width: 600px) {
                    .fa-card { padding: 32px 20px; border: none; }
                    .fa-main { padding: 28px 16px 48px !important; }
                    header { padding: 14px 20px !important; }
                    .fa-breadcrumb { padding: 10px 16px !important; }
                }
            `}</style>

            <div className="lan-body" style={{ minHeight: "100vh", background: BG, display: "flex", flexDirection: "column" }}>

                {/* ── Header ── */}
                <header className="hero-bg" style={{ padding: "18px 32px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span className="lan-serif" style={{ fontSize: 20, fontWeight: 900, color: "#fff", letterSpacing: -0.5 }}>
                        [LAN <span style={{ color: GOLD, fontStyle: "italic" }}>Library</span>]
                    </span>
                    <button
                        onClick={() => step === 'search' ? router.back() : resetFlow()}
                        style={{ color: GOLD, background: "none", border: "none", fontSize: 12, fontWeight: 700, display: "flex", gap: 6, alignItems: "center", cursor: "pointer" }}
                    >
                        <ArrowLeft size={14} /> Back
                    </button>
                </header>

                {/* ── Breadcrumb ── */}
                <div className="fa-breadcrumb" style={{ background: "#fff", borderBottom: "0.5px solid #e5ddd0", padding: "10px 32px" }}>
                    <div style={{ maxWidth: 1000, margin: "0 auto", fontSize: 12, color: "#888" }}>
                        Home › Sign In › <span style={{ color: NAVY, fontWeight: 700 }}>Find Account</span>
                    </div>
                </div>

                {/* ── Main ── */}
                <main className="fa-main" style={{ flex: 1, maxWidth: 1000, margin: "0 auto", width: "100%", padding: "60px 24px", display: "flex", justifyContent: "center", boxSizing: "border-box" }}>
                    <div className="fa-card anim-up" key={step}>

                        {/* Label */}
                        <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: GOLD, marginBottom: 8 }}>
                            {step === 'search' ? 'Account Lookup' : step === 'confirm' ? 'Confirm Identity' : 'Secure Login'}
                        </p>
                        <h1 className="lan-serif" style={{ fontSize: 26, fontWeight: 700, color: NAVY, marginBottom: 6 }}>
                            {stepTitles[step]}
                        </h1>
                        <div style={{ width: 36, height: 3, background: GOLD, marginBottom: 18 }} />
                        <p style={{ fontSize: 13, color: "#888", lineHeight: 1.7, marginBottom: 24 }}>
                            {stepSubtitles[step]}
                        </p>

                        {/* ── STEP 1: SEARCH ── */}
                        {step === 'search' && (
                            <>
                                <div style={{ position: "relative", marginBottom: error ? 12 : 20 }}>
                                    <Search size={15} color="#bbb" style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
                                    <input
                                        className="lan-input"
                                        type="text"
                                        placeholder="Mobile number or email address"
                                        value={searchInput}
                                        onChange={e => { setSearchInput(e.target.value); setError(''); }}
                                        onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(); }}
                                    />
                                    {loading && (
                                        <div style={{ position: "absolute", right: 16, top: "50%", transform: "translateY(-50%)", width: 14, height: 14, border: "2px solid rgba(13,34,68,0.15)", borderTopColor: NAVY, borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
                                    )}
                                </div>
                                {error && <ErrorBox message={error} />}
                                <button className="btn-primary" onClick={handleSearch} disabled={loading || !searchInput.trim()}>
                                    {loading ? <Spinner /> : "Continue"}
                                </button>
                            </>
                        )}

                        {/* ── STEP 2: CONFIRM ── */}
                        {step === 'confirm' && (
                            <>
                                <div style={{ background: CREAM, border: "0.5px solid #e5ddd0", padding: "20px", marginBottom: 20 }}>
                                    {maskedEmail && (
                                        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: maskedPhone ? 12 : 0 }}>
                                            <div style={{ width: 36, height: 36, background: `rgba(13,34,68,0.07)`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                                <Mail size={16} color={NAVY} />
                                            </div>
                                            <div>
                                                <p style={{ fontSize: 10, color: "#888", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 2 }}>Email</p>
                                                <p style={{ fontSize: 13, color: NAVY, fontWeight: 700 }}>{maskedEmail}</p>
                                            </div>
                                        </div>
                                    )}
                                    {maskedPhone && (
                                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                            <div style={{ width: 36, height: 36, background: `rgba(13,34,68,0.07)`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                                <Phone size={16} color={NAVY} />
                                            </div>
                                            <div>
                                                <p style={{ fontSize: 10, color: "#888", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 2 }}>Phone</p>
                                                <p style={{ fontSize: 13, color: NAVY, fontWeight: 700 }}>{maskedPhone}</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <button className="btn-primary" onClick={() => setStep('password')} style={{ marginBottom: 10 }}>
                                    Yes, continue
                                </button>
                                <button className="btn-outline" onClick={resetFlow}>
                                    No, try again
                                </button>
                            </>
                        )}

                        {/* ── STEP 3: PASSWORD ── */}
                        {step === 'password' && (
                            <>
                                <div style={{ position: "relative", marginBottom: error ? 12 : 20 }}>
                                    <Lock size={15} color="#bbb" style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
                                    <input
                                        className="lan-input-plain"
                                        type={showPassword ? 'text' : 'password'}
                                        placeholder="Enter your password"
                                        value={password}
                                        onChange={e => { setPassword(e.target.value); setError(''); }}
                                        autoFocus
                                        onKeyDown={(e) => { if (e.key === 'Enter') handleLogin(); }}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(v => !v)}
                                        style={{ position: "absolute", right: 16, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#bbb", display: "flex" }}
                                    >
                                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                                {error && <ErrorBox message={error} />}
                                <button className="btn-primary" onClick={handleLogin} disabled={loading || !password.trim()} style={{ marginBottom: 16 }}>
                                    {loading ? <Spinner /> : "Sign In"}
                                </button>
                                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                                    <button onClick={resetFlow} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12, color: NAVY, fontWeight: 700, textAlign: "left", padding: 0 }}>
                                        ← Not you? Use a different account
                                    </button>
                                    <button onClick={() => router.push('/auth/forgot-password')} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12, color: "#888", textAlign: "left", padding: 0 }}>
                                        Forgot password?
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </main>

                {/* ── Footer ── */}
                <footer className="hero-bg" style={{ padding: "18px", textAlign: "center" }}>
                    <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>
                        © {new Date().getFullYear()} LAN Library
                    </p>
                </footer>
            </div>

            {/* ── Suspended Modal ── */}
            {showSuspendedModal && <StatusModal
                color="#dc2626"
                title="Account Suspended"
                subtitle="Your access has been restricted"
                body="This account has been suspended due to a violation of our Terms of Service or Community Guidelines."
                points={["You cannot log in to this account", "Your listings are not visible to others", "Pending transactions may be on hold"]}
                onClose={() => { setShowSuspendedModal(false); resetFlow(); }}
            />}

            {/* ── Pending Modal ── */}
            {showPendingModal && <StatusModal
                color="#d97706"
                title="Account Under Review"
                subtitle="We're verifying your account"
                body="Your account is currently under review. This usually takes 24–48 hours."
                points={["You cannot log in yet", "We may contact you for more information", "You'll be notified once approved"]}
                onClose={() => { setShowPendingModal(false); resetFlow(); }}
            />}
        </>
    );
}

/* ── Sub-components ── */

function ErrorBox({ message }) {
    return (
        <div style={{ background: "#fef2f2", border: "0.5px solid #fecaca", padding: "12px 16px", display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 16 }}>
            <AlertCircle size={15} color="#dc2626" style={{ flexShrink: 0, marginTop: 1 }} />
            <p style={{ fontSize: 12, color: "#991b1b", margin: 0 }}>{message}</p>
        </div>
    );
}

function Spinner() {
    return <span style={{ width: 14, height: 14, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", display: "inline-block", animation: "spin 0.7s linear infinite" }} />;
}

function StatusModal({ color, title, subtitle, body, points, onClose }) {
    const NAVY = "#0d2244";
    return (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50, padding: 16 }}>
            <div style={{ background: "#fff", maxWidth: 420, width: "100%", overflow: "hidden" }}>
                <div style={{ background: color, padding: "32px 24px", textAlign: "center" }}>
                    <div style={{ width: 56, height: 56, background: "rgba(255,255,255,0.15)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
                        <AlertCircle size={28} color="#fff" />
                    </div>
                    <h3 style={{ color: "#fff", fontSize: 20, fontWeight: 900, fontFamily: "'Playfair Display', serif", marginBottom: 4 }}>{title}</h3>
                    <p style={{ color: "rgba(255,255,255,0.75)", fontSize: 12 }}>{subtitle}</p>
                </div>
                <div style={{ padding: "24px" }}>
                    <p style={{ fontSize: 13, color: "#555", marginBottom: 16, lineHeight: 1.7 }}>{body}</p>
                    <div style={{ background: "#fef2f2", border: "0.5px solid #fecaca", padding: "14px 16px", marginBottom: 20 }}>
                        <p style={{ fontSize: 11, fontWeight: 700, color: "#991b1b", marginBottom: 6 }}>What this means:</p>
                        <ul style={{ fontSize: 11, color: "#991b1b", paddingLeft: 16, margin: 0, lineHeight: 1.8 }}>
                            {points.map(p => <li key={p}>{p}</li>)}
                        </ul>
                    </div>
                    <a href="mailto:support@lanlibrary.com" style={{ display: "block", width: "100%", background: color, color: "#fff", textAlign: "center", padding: 14, fontWeight: 700, fontSize: 13, textDecoration: "none", marginBottom: 10, boxSizing: "border-box" }}>
                        Contact Support
                    </a>
                    <button onClick={onClose} style={{ width: "100%", background: "transparent", border: "0.5px solid #e5ddd0", color: NAVY, padding: 14, fontWeight: 700, fontSize: 13, cursor: "pointer", boxSizing: "border-box" }}>
                        Go Back
                    </button>
                </div>
            </div>
        </div>
    );
}