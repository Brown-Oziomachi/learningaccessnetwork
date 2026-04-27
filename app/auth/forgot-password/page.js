'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AlertCircle, CheckCircle, Mail, ArrowRight, Clock, ArrowLeft } from 'lucide-react';
import { resetPassword } from '@/lib/auth/authHelpers';

const NAVY = "#0d2244";
const GOLD  = "#b8963e";
const BG    = "#f5f1ea";
const CREAM = "#f5f0e8";

export default function ForgotPasswordPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');

    const handleReset = async () => {
        if (!email.trim()) { setError('Please enter your email address'); return; }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) { setError('Please enter a valid email address'); return; }

        setLoading(true); setError('');
        try {
            const result = await resetPassword(email.toLowerCase().trim());
            if (result.success) {
                setSuccess(true);
            } else {
                const code = result.error?.code || '';
                if (code === 'auth/user-not-found') setError('No account found with this email address.');
                else if (code === 'auth/invalid-email') setError('Invalid email address format.');
                else if (code === 'auth/too-many-requests') setError('Too many attempts. Please try again later.');
                else setError(`Failed to send reset email: ${result.error?.message || 'Unknown error'}`);
            }
        } catch { setError('An unexpected error occurred. Please try again.'); }
        finally { setLoading(false); }
    };

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
                    width: 100%; padding: 13px 16px;
                    background: #fff; border: 0.5px solid #e5ddd0;
                    font-family: 'Lato', sans-serif; font-size: 13px; color: ${NAVY};
                    outline: none; transition: border-color 0.15s;
                    box-sizing: border-box;
                }
                .lan-input:focus { border-color: ${GOLD}; }
                .lan-input::placeholder { color: #bbb; }
                .btn-primary {
                    padding: 13px 32px; background: ${NAVY}; color: #fff;
                    border: none; font-family: 'Lato', sans-serif; font-size: 13px;
                    font-weight: 700; letter-spacing: 0.04em; cursor: pointer;
                    transition: background 0.15s; display: inline-flex; align-items: center; gap: 8px;
                }
                .btn-primary:hover:not(:disabled) { background: #162d57; }
                .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
                .btn-primary-full {
                    width: 100%; padding: 14px; background: ${NAVY}; color: #fff;
                    border: none; font-family: 'Lato', sans-serif; font-size: 13px;
                    font-weight: 700; letter-spacing: 0.04em; cursor: pointer;
                    transition: background 0.15s; display: flex; align-items: center; justify-content: center; gap: 8px;
                    box-sizing: border-box;
                }
                .btn-primary-full:hover { background: #162d57; }
                @keyframes slideUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
                .anim-up { animation: slideUp 0.5s cubic-bezier(0.4,0,0.2,1) both; }
                .anim-up2 { animation: slideUp 0.5s 0.12s cubic-bezier(0.4,0,0.2,1) both; }
                @keyframes spin { to { transform: rotate(360deg); } }

                .fp-card { width: 100%; max-width: 460px; background: #fff; border: 0.5px solid #e5ddd0; padding: 42px 40px; }

                @media (max-width: 600px) {
                    .fp-card { padding: 32px 20px; border: none; }
                    .fp-main { padding: 28px 16px 48px !important; }
                    header { padding: 14px 20px !important; }
                    .fp-breadcrumb { padding: 10px 16px !important; }
                }
            `}</style>

            <div className="lan-body" style={{ minHeight: "100vh", background: BG, display: "flex", flexDirection: "column" }}>

                {/* ── Header ── */}
                <header className="hero-bg" style={{ padding: "18px 32px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span className="lan-serif" style={{ fontSize: 20, fontWeight: 900, color: "#fff", letterSpacing: -0.5 }}>
                        [LAN <span style={{ color: GOLD, fontStyle: "italic" }}>Library</span>]
                    </span>
                    <Link href="/auth/signin" style={{ color: GOLD, textDecoration: "none", fontSize: 12, fontWeight: 700, display: "flex", gap: 6, alignItems: "center" }}>
                        <ArrowLeft size={14} /> Back to Sign In
                    </Link>
                </header>

                {/* ── Breadcrumb ── */}
                <div className="fp-breadcrumb" style={{ background: "#fff", borderBottom: "0.5px solid #e5ddd0", padding: "10px 32px" }}>
                    <div style={{ maxWidth: 1000, margin: "0 auto", fontSize: 12, color: "#888" }}>
                        Home › Sign In › <span style={{ color: NAVY, fontWeight: 700 }}>Reset Password</span>
                    </div>
                </div>

                {/* ── Main ── */}
                <main className="fp-main" style={{ flex: 1, maxWidth: 1000, margin: "0 auto", width: "100%", padding: "60px 24px", display: "flex", justifyContent: "center", boxSizing: "border-box" }}>

                    {!success ? (
                        /* ── REQUEST FORM ── */
                        <div className="fp-card anim-up">
                            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: GOLD, marginBottom: 8 }}>Account Recovery</p>
                            <h1 className="lan-serif" style={{ fontSize: 28, fontWeight: 700, color: NAVY, marginBottom: 6 }}>
                                Let's get you back in
                            </h1>
                            <div style={{ width: 36, height: 3, background: GOLD, marginBottom: 20 }} />

                            <p style={{ fontSize: 13, color: "#888", lineHeight: 1.7, marginBottom: 28 }}>
                                Enter the email associated with your account and we'll send you password reset instructions.
                            </p>

                            <input
                                className="lan-input"
                                type="email"
                                placeholder="Email address"
                                value={email}
                                onChange={(e) => { setEmail(e.target.value); setError(''); }}
                                onKeyDown={(e) => { if (e.key === 'Enter') handleReset(); }}
                                style={{ marginBottom: error ? 12 : 24 }}
                            />

                            {error && (
                                <div style={{ background: "#fef2f2", border: "0.5px solid #fecaca", padding: "12px 16px", display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 24 }}>
                                    <AlertCircle size={15} color="#dc2626" style={{ flexShrink: 0, marginTop: 1 }} />
                                    <p style={{ fontSize: 12, color: "#991b1b" }}>{error}</p>
                                </div>
                            )}

                            <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
                                <button className="btn-primary" onClick={handleReset} disabled={loading || !email.trim()}>
                                    {loading
                                        ? <><span style={{ width: 12, height: 12, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", display: "inline-block", animation: "spin 0.7s linear infinite" }} /> Sending…</>
                                        : "Send reset link"
                                    }
                                </button>
                                <Link href="/auth/signin" style={{ fontSize: 12, color: NAVY, fontWeight: 700, textDecoration: "none" }}>
                                    Back to sign in
                                </Link>
                            </div>
                        </div>

                    ) : (
                        /* ── SUCCESS STATE ── */
                        <div className="fp-card anim-up" style={{ textAlign: "center" }}>
                            <div style={{ width: 72, height: 72, background: "#f0fdf4", border: "0.5px solid #bbf7d0", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px" }}>
                                <CheckCircle size={36} color="#16a34a" />
                            </div>

                            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: GOLD, marginBottom: 8 }}>Email Sent</p>
                            <h2 className="lan-serif" style={{ fontSize: 26, fontWeight: 700, color: NAVY, marginBottom: 6 }}>Check your inbox</h2>
                            <div style={{ width: 36, height: 3, background: GOLD, margin: "0 auto 20px" }} />

                            {/* Email badge */}
                            <div style={{ background: CREAM, border: "0.5px solid #e5ddd0", padding: "16px 20px", display: "flex", alignItems: "center", gap: 12, marginBottom: 20, textAlign: "left" }}>
                                <Mail size={18} color={NAVY} style={{ flexShrink: 0 }} />
                                <div>
                                    <p style={{ fontSize: 10, color: "#888", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 2 }}>Reset link sent to</p>
                                    <p style={{ fontSize: 13, color: NAVY, fontWeight: 700 }}>{email}</p>
                                </div>
                            </div>

                            {/* Notes */}
                            <div style={{ background: "#fffbeb", border: "0.5px solid #fde68a", padding: "14px 16px", display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 24, textAlign: "left" }}>
                                <Clock size={14} color="#92400e" style={{ flexShrink: 0, marginTop: 2 }} />
                                <div>
                                    <p style={{ fontSize: 11, fontWeight: 700, color: "#92400e", marginBottom: 6 }}>Important</p>
                                    <ul style={{ fontSize: 11, color: "#92400e", paddingLeft: 14, margin: 0, lineHeight: 1.8 }}>
                                        <li>The reset link expires in <strong>1 hour</strong></li>
                                        <li>Check your spam/junk folder if needed</li>
                                        <li>The link can only be used once</li>
                                    </ul>
                                </div>
                            </div>

                            <p style={{ fontSize: 12, color: "#888", marginBottom: 20 }}>
                                Didn't receive it?{' '}
                                <button onClick={() => { setSuccess(false); setEmail(''); }} style={{ color: NAVY, fontWeight: 700, background: "none", border: "none", cursor: "pointer", fontSize: 12, padding: 0 }}>
                                    Send again
                                </button>
                            </p>

                            <Link href="/auth/signin" style={{ textDecoration: "none" }}>
                                <button className="btn-primary-full">
                                    Return to Sign In <ArrowRight size={14} />
                                </button>
                            </Link>
                        </div>
                    )}
                </main>

                {/* ── Footer ── */}
                <footer className="hero-bg" style={{ padding: "18px", textAlign: "center" }}>
                    <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>
                        © {new Date().getFullYear()} LAN Library
                    </p>
                </footer>
            </div>
        </>
    );
}