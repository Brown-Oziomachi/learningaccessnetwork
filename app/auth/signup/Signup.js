'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Globe, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

const NAVY  = "#0d2244";
const GOLD  = "#b8963e";
const CREAM = "#f5f0e8";
const BG    = "#f5f1ea";

export default function SignUpClient() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const email = searchParams.get('email');
    const ref = searchParams.get('referral_code');

    const roleSelectionUrl = `/auth/role-selection${
        email || ref
            ? `?${email ? `email=${email}` : ''}${email && ref ? '&' : ''}${ref ? `referral_code=${ref}` : ''}`
            : ''
    }`;

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
                .lan-btn-primary {
                    width: 100%; background: ${NAVY}; color: #fff;
                    padding: 14px; border: none;
                    font-family: 'Lato', sans-serif; font-size: 13px;
                    font-weight: 700; letter-spacing: 0.04em;
                    cursor: pointer; transition: background 0.15s;
                    margin-bottom: 12px; display: block; text-align: center;
                    text-decoration: none; box-sizing: border-box;
                }
                .lan-btn-primary:hover { background: #162d57; }
                .lan-btn-outline {
                    width: 100%; background: transparent; color: ${NAVY};
                    padding: 14px; border: 0.5px solid ${NAVY};
                    font-family: 'Lato', sans-serif; font-size: 13px;
                    font-weight: 700; letter-spacing: 0.04em;
                    cursor: pointer; transition: background 0.15s;
                    display: block; text-align: center; text-decoration: none;
                    box-sizing: border-box;
                }
                .lan-btn-outline:hover { background: rgba(13,34,68,0.05); }
                @keyframes slideUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
                .anim-up { animation: slideUp 0.5s cubic-bezier(0.4,0,0.2,1) both; }
                .anim-up2 { animation: slideUp 0.5s 0.1s cubic-bezier(0.4,0,0.2,1) both; }

                .signup-card {
                    width: 100%; max-width: 480px;
                    background: #fff; border: 0.5px solid #e5ddd0;
                    padding: 42px 40px;
                }

                @media (max-width: 600px) {
                    .signup-card { padding: 32px 20px; border: none; }
                    .signup-main { padding: 28px 16px 48px !important; }
                    header { padding: 14px 20px !important; }
                    .signup-breadcrumb { padding: 10px 16px !important; }
                }
            `}</style>

            <div className="lan-body" style={{ minHeight: "100vh", background: BG, display: "flex", flexDirection: "column" }}>

                {/* ── Header ── */}
                <header className="hero-bg" style={{ padding: "18px 32px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span className="lan-serif" style={{ fontSize: 20, fontWeight: 900, color: "#fff", letterSpacing: -0.5 }}>
                        [LAN <span style={{ color: GOLD, fontStyle: "italic" }}>Library</span>]
                    </span>
                    <Link href="/auth/signin" style={{ color: GOLD, textDecoration: "none", fontSize: 12, fontWeight: 700, display: "flex", gap: 6, alignItems: "center" }}>
                        <ArrowLeft size={14} /> Back
                    </Link>
                </header>

                {/* ── Breadcrumb ── */}
                <div className="signup-breadcrumb" style={{ background: "#fff", borderBottom: "0.5px solid #e5ddd0", padding: "10px 32px" }}>
                    <div style={{ maxWidth: 1000, margin: "0 auto", fontSize: 12, color: "#888" }}>
                        Home › <span style={{ color: NAVY, fontWeight: 700 }}>Create Account</span>
                    </div>
                </div>

                {/* ── Main ── */}
                <main className="signup-main" style={{ flex: 1, maxWidth: 1000, margin: "0 auto", width: "100%", padding: "60px 24px", display: "flex", justifyContent: "center", boxSizing: "border-box" }}>
                    <div className="signup-card anim-up">

                        {/* Label */}
                        <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: GOLD, marginBottom: 8 }}>New Account</p>

                        {/* Title */}
                        <h1 className="lan-serif" style={{ fontSize: 30, fontWeight: 700, color: NAVY, margin: "0 0 10px" }}>
                            Join Learning Access Network
                        </h1>
                        <div style={{ width: 36, height: 3, background: GOLD, marginBottom: 18 }} />

                        <p style={{ fontSize: 13, color: "#888", lineHeight: 1.7, marginBottom: 28 }}>
                            Create an account to access thousands of PDF books, connect with learners, and build your digital library.
                        </p>

                        {/* Hero visual block */}
                        <div className="anim-up2" style={{ background: CREAM, border: "0.5px solid #e5ddd0", padding: "28px 24px", textAlign: "center", marginBottom: 28 }}>
                            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 14 }}>
                                <Globe size={40} color={NAVY} />
                                <span style={{ fontSize: 40 }}>📚</span>
                                <span style={{ fontSize: 40 }}>👍</span>
                            </div>
                            <p style={{ marginTop: 14, fontSize: 12, color: "#888" }}>
                                Build your global learning library
                            </p>
                        </div>

                        {/* Stats row */}
                        <div style={{ display: "flex", borderTop: "0.5px solid #e5ddd0", paddingTop: 20, marginBottom: 28 }}>
                            {[{ v: "90M+", l: "Documents" }, { v: "2.4M+", l: "Learners" }, { v: "Free", l: "Basic Access" }].map(({ v, l }, i) => (
                                <div key={l} style={{ flex: 1, textAlign: "center", borderRight: i < 2 ? "0.5px solid #e5ddd0" : "none" }}>
                                    <div className="lan-serif" style={{ fontSize: 20, fontWeight: 700, color: NAVY }}>{v}</div>
                                    <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: GOLD, marginTop: 3 }}>{l}</div>
                                </div>
                            ))}
                        </div>

                        {/* Actions */}
                        <Link href={roleSelectionUrl} className="lan-btn-primary">
                            Create new account
                        </Link>

                        <Link href="/auth/find-my-account" className="lan-btn-outline">
                            Find my account
                        </Link>

                        <p style={{ fontSize: 11, color: "#bbb", textAlign: "center", marginTop: 20 }}>
                            Learning Access Network &nbsp;·&nbsp; Africa's Student Library
                        </p>
                    </div>
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