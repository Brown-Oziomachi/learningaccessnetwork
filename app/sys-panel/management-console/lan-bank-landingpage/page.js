"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword, onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebaseConfig";

const OWNER_EMAILS = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || "").split(",").map(e => e.trim());

const G = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400&family=Lato:wght@300;400;700&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Lato', sans-serif; }
  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes shimmer {
    0%   { background-position: -200% center; }
    100% { background-position:  200% center; }
  }
  .fade-up { animation: fadeUp 0.6s cubic-bezier(.4,0,.2,1) both; }
  .fade-up-2 { animation: fadeUp 0.6s 0.1s cubic-bezier(.4,0,.2,1) both; }
  .fade-up-3 { animation: fadeUp 0.6s 0.2s cubic-bezier(.4,0,.2,1) both; }
  .lan-input {
    width: 100%;
    background: rgba(255,255,255,0.07);
    border: 0.5px solid rgba(184,150,62,0.3);
    border-radius: 4px;
    padding: 13px 16px;
    color: #fff;
    font-size: 13px;
    font-family: 'Lato', sans-serif;
    outline: none;
    transition: border-color 0.2s, background 0.2s;
    backdrop-filter: blur(4px);
  }
  .lan-input:focus {
    border-color: #b8963e;
    background: rgba(255,255,255,0.1);
  }
  .lan-input::placeholder { color: rgba(255,255,255,0.3); }
  .lan-input:-webkit-autofill {
    -webkit-box-shadow: 0 0 0 1000px rgba(13,34,68,0.9) inset;
    -webkit-text-fill-color: #fff;
  }
`;

export default function LANBankLandingPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [pass, setPass] = useState("");
    const [err, setErr] = useState("");
    const [loading, setLoading] = useState(false);
    const [checking, setChecking] = useState(true);
    const [showPass, setShowPass] = useState(false);

    useEffect(() => {
        // If opened from admin panel (?from=admin), always show login form — never auto-redirect
        const params = new URLSearchParams(window.location.search);
        const fromAdmin = params.get("from") === "admin";

        if (fromAdmin) {
            setChecking(false);
            return;
        }

        // Otherwise, auto-redirect if already logged in as owner
        const unsub = onAuthStateChanged(auth, async (u) => {
            if (u && OWNER_EMAILS.includes(u.email)) {
                try {
                    const snap = await getDoc(doc(db, "users", u.uid));
                    if (snap.exists() && (snap.data().isAdmin || snap.data().role === "admin")) {
                        router.replace("/sys-panel/management-console/lan-bank");
                        return;
                    }
                } catch { }
            }
            setChecking(false);
        });
        return () => unsub();
    }, [router]);

    const handleLogin = async () => {
        if (!email.trim() || !pass) { setErr("Both fields are required."); return; }
        setLoading(true); setErr("");
        try {
            const cred = await signInWithEmailAndPassword(auth, email.trim(), pass);

            // 1. Check email whitelist
            if (!OWNER_EMAILS.includes(cred.user.email)) {
                await auth.signOut();
                setErr("Access denied. This portal is owner-only.");
                return;
            }

            // 2. Double-check Firestore admin flag
            const snap = await getDoc(doc(db, "users", cred.user.uid));
            if (!snap.exists() || (!snap.data().isAdmin && snap.data().role !== "admin")) {
                await auth.signOut();
                setErr("Your account does not have admin privileges.");
                return;
            }

            // All good — go to bank
            router.push("/sys-panel/management-console/lan-bank");
        } catch (e) {
            const map = {
                "auth/user-not-found": "No account found with that email.",
                "auth/wrong-password": "Incorrect password.",
                "auth/invalid-email": "Invalid email address.",
                "auth/too-many-requests": "Too many attempts. Try again later.",
                "auth/invalid-credential": "Invalid credentials. Check your email and password.",
            };
            setErr(map[e.code] || "Authentication failed. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    if (checking) return (
        <>
            <style>{G}</style>
            <div style={{ minHeight: "100vh", background: "#0d2244", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <div style={{ width: 36, height: 36, border: "2px solid rgba(184,150,62,0.3)", borderTopColor: "#b8963e", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
            </div>
        </>
    );

    return (
        <>
            <style>{G}</style>

            {/* Full-viewport layout */}
            <div style={{ minHeight: "100vh", display: "flex", fontFamily: "'Lato', sans-serif" }}>

                {/* ── LEFT: Full image panel ── */}
                <div style={{
                    flex: 1,
                    minHeight: "100vh",
                    position: "relative",
                    overflow: "hidden",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "flex-end",
                    // Fallback rich gradient if image fails
                    background: "linear-gradient(160deg, #0a1628 0%, #0d2244 40%, #1a3a6e 100%)",
                }}>
                    {/* Background image — replace src with your own */}
                    <img
                        src="https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=1400&q=80"
                        alt=""
                        style={{
                            position: "absolute", inset: 0, width: "100%", height: "100%",
                            objectFit: "cover", objectPosition: "center",
                            opacity: 0.35,
                        }}
                    />

                    {/* Dark gradient overlay — bottom-up */}
                    <div style={{
                        position: "absolute", inset: 0,
                        background: "linear-gradient(to top, rgba(13,34,68,0.98) 0%, rgba(13,34,68,0.6) 40%, rgba(13,34,68,0.2) 100%)",
                    }} />

                    {/* Top-left badge */}
                    <div style={{ position: "absolute", top: 32, left: 36, zIndex: 2 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <div style={{ width: 36, height: 36, background: "rgba(184,150,62,0.15)", border: "0.5px solid rgba(184,150,62,0.4)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                                    <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" stroke="#b8963e" strokeWidth="1.5" />
                                    <path d="M9 22V12h6v10" stroke="#b8963e" strokeWidth="1.5" />
                                </svg>
                            </div>
                            <div>
                                <p style={{ fontSize: 8, fontWeight: 700, letterSpacing: "0.2em", color: "#b8963e", textTransform: "uppercase" }}>Learning Access Network</p>
                                <p style={{ fontFamily: "'Playfair Display', serif", fontSize: 14, fontWeight: 700, color: "#fff" }}>LAN Library</p>
                            </div>
                        </div>
                    </div>

                    {/* Bottom copy */}
                    <div style={{ position: "relative", zIndex: 2, padding: "0 36px 44px" }}>
                        <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", color: "#b8963e", marginBottom: 12 }}>
                            Private Banking Portal
                        </p>
                        <h1 style={{
                            fontFamily: "'Playfair Display', serif",
                            fontSize: "clamp(36px, 5vw, 58px)",
                            fontWeight: 900,
                            color: "#fff",
                            lineHeight: 1.05,
                            letterSpacing: "-1px",
                            marginBottom: 16,
                        }}>
                            LAN <em style={{ color: "#b8963e", fontStyle: "italic" }}>Bank</em>
                        </h1>
                        <p style={{ fontSize: 13, color: "rgba(245,240,232,0.55)", maxWidth: 380, lineHeight: 1.8, fontWeight: 300 }}>
                            Secure financial control for the LAN Library ecosystem.
                            Manage seller wallets, process transfers, and oversee all platform funds from one place.
                        </p>

                        {/* Stat strip */}
                        <div style={{ display: "flex", gap: 0, marginTop: 32, borderTop: "0.5px solid rgba(184,150,62,0.2)" }}>
                            {[
                                ["Instant", "Wallet Transfers"],
                                ["Secured", "By Firebase Auth"],
                                ["Owner", "Access Only"],
                            ].map(([val, lbl]) => (
                                <div key={lbl} style={{ flex: 1, padding: "16px 0", borderRight: "0.5px solid rgba(184,150,62,0.12)" }}>
                                    <p style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, fontWeight: 700, color: "#fff" }}>{val}</p>
                                    <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(184,150,62,0.6)", marginTop: 3 }}>{lbl}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* ── RIGHT: Login panel ── */}
                <div style={{
                    width: "440px",
                    flexShrink: 0,
                    background: "#0a1628",
                    borderLeft: "0.5px solid rgba(184,150,62,0.12)",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    padding: "48px 44px",
                    position: "relative",
                    backgroundImage: "radial-gradient(rgba(184,150,62,0.04) 1px, transparent 1px)",
                    backgroundSize: "24px 24px",
                }}>

                    {/* Top accent line */}
                    <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: "linear-gradient(90deg, transparent, #b8963e, transparent)" }} />

                    {/* Logo mark */}
                    <div className="fade-up" style={{ marginBottom: 40 }}>
                        <div style={{ width: 52, height: 52, background: "rgba(184,150,62,0.1)", border: "0.5px solid rgba(184,150,62,0.3)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20 }}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                                <rect x="2" y="7" width="20" height="14" rx="2" stroke="#b8963e" strokeWidth="1.5" />
                                <path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" stroke="#b8963e" strokeWidth="1.5" />
                                <circle cx="12" cy="14" r="2" stroke="#b8963e" strokeWidth="1.5" />
                            </svg>
                        </div>
                        <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.2em", color: "#b8963e", textTransform: "uppercase", marginBottom: 6 }}>
                            Secure Access
                        </p>
                        <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, fontWeight: 900, color: "#fff", lineHeight: 1.1, letterSpacing: "-0.5px" }}>
                            Owner Sign In
                        </h2>
                        <p style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", marginTop: 8, fontWeight: 300 }}>
                            Restricted to authorised personnel only
                        </p>
                    </div>

                    {/* Form */}
                    <div className="fade-up-2" style={{ display: "flex", flexDirection: "column", gap: 16 }}>

                        {/* Email */}
                        <div>
                            <label style={{ display: "block", fontSize: 9, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: "rgba(184,150,62,0.8)", marginBottom: 8 }}>
                                Email Address
                            </label>
                            <input
                                className="lan-input"
                                type="email"
                                placeholder="owner@lanlibrary.com"
                                value={email}
                                onChange={e => { setEmail(e.target.value); setErr(""); }}
                                onKeyDown={e => e.key === "Enter" && handleLogin()}
                                autoComplete="email"
                            />
                        </div>

                        {/* Password */}
                        <div>
                            <label style={{ display: "block", fontSize: 9, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: "rgba(184,150,62,0.8)", marginBottom: 8 }}>
                                Password
                            </label>
                            <div style={{ position: "relative" }}>
                                <input
                                    className="lan-input"
                                    type={showPass ? "text" : "password"}
                                    placeholder="••••••••••"
                                    value={pass}
                                    onChange={e => { setPass(e.target.value); setErr(""); }}
                                    onKeyDown={e => e.key === "Enter" && handleLogin()}
                                    autoComplete="current-password"
                                    style={{ paddingRight: 44 }}
                                />
                                <button
                                    onClick={() => setShowPass(p => !p)}
                                    style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.3)", padding: 4 }}
                                >
                                    {showPass ? (
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24M1 1l22 22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
                                    ) : (
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="1.5" /><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5" /></svg>
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Error */}
                        {err && (
                            <div style={{ display: "flex", alignItems: "flex-start", gap: 8, background: "rgba(239,68,68,0.08)", border: "0.5px solid rgba(239,68,68,0.3)", borderRadius: 4, padding: "10px 14px" }}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0, marginTop: 1 }}><circle cx="12" cy="12" r="10" stroke="#f87171" strokeWidth="1.5" /><path d="M12 8v4M12 16h.01" stroke="#f87171" strokeWidth="1.5" strokeLinecap="round" /></svg>
                                <p style={{ fontSize: 12, color: "#f87171", margin: 0, lineHeight: 1.5 }}>{err}</p>
                            </div>
                        )}

                        {/* Submit */}
                        <button
                            onClick={handleLogin}
                            disabled={loading || !email || !pass}
                            style={{
                                width: "100%",
                                padding: "14px",
                                background: loading || !email || !pass ? "rgba(184,150,62,0.3)" : "#b8963e",
                                color: loading || !email || !pass ? "rgba(255,255,255,0.4)" : "#0d2244",
                                border: "none",
                                borderRadius: 4,
                                fontSize: 12,
                                fontWeight: 700,
                                cursor: loading || !email || !pass ? "not-allowed" : "pointer",
                                fontFamily: "'Lato', sans-serif",
                                letterSpacing: "0.1em",
                                textTransform: "uppercase",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: 8,
                                transition: "all 0.2s",
                                marginTop: 4,
                            }}
                        >
                            {loading ? (
                                <>
                                    <div style={{ width: 14, height: 14, border: "2px solid rgba(13,34,68,0.3)", borderTopColor: "#0d2244", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                                    Authenticating…
                                </>
                            ) : (
                                <>
                                    Access LAN Bank
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                </>
                            )}
                        </button>
                    </div>

                    {/* Security notice */}
                    <div className="fade-up-3" style={{ marginTop: 32, padding: "14px 16px", background: "rgba(184,150,62,0.05)", border: "0.5px solid rgba(184,150,62,0.15)", borderRadius: 4 }}>
                        <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0, marginTop: 1 }}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="#b8963e" strokeWidth="1.5" /></svg>
                            <div>
                                <p style={{ fontSize: 10, fontWeight: 700, color: "#b8963e", marginBottom: 3, letterSpacing: "0.06em" }}>Protected Access</p>
                                <p style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", lineHeight: 1.6 }}>
                                    All sessions are verified against Firebase Auth and Firestore admin records. Unauthorized access attempts are logged.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <p style={{ marginTop: 28, fontSize: 10, color: "rgba(255,255,255,0.15)", textAlign: "center", letterSpacing: "0.06em" }}>
                        © {new Date().getFullYear()} LAN Library · Private Banking Portal
                    </p>
                </div>
            </div>
        </>
    );
}