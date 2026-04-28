"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
    ShieldCheck, ChevronLeft, BookOpen, Tag,
    CheckCircle, Lock, ArrowRight, AlertCircle, X
} from "lucide-react";
import Link from "next/link";

/* ─── colour tokens (matching PaymentClient) ───────────────────── */
const NAVY  = "#0d2244";
const GOLD  = "#b8963e";
const CREAM = "#f5f0e8";
const BG    = "#f5f1ea";

/* ─── PayPal SDK loader ─────────────────────────────────────────── */
function usePayPalSDK(clientId, currency = "USD") {
    const [ready, setReady] = useState(false);
    useEffect(() => {
        if (!clientId || clientId === "YOUR_PAYPAL_CLIENT_ID") return;
        if (window.paypal) { setReady(true); return; }
        const script = document.createElement("script");
        script.src = `https://www.paypal.com/sdk/js?client-id=${clientId}&currency=${currency}&components=buttons`;
        script.async  = true;
        script.onload = () => setReady(true);
        script.onerror = () => console.error("Failed to load PayPal SDK");
        document.head.appendChild(script);
        return () => { if (document.head.contains(script)) document.head.removeChild(script); };
    }, [clientId, currency]);
    return ready;
}

/* ─── helpers ───────────────────────────────────────────────────── */
const NGN_TO_USD_RATE = 0.00065;
const toUSD = (ngn) => (ngn * NGN_TO_USD_RATE).toFixed(2);

const getThumbnailUrl = (coverParam) => {
    if (!coverParam) return "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400";
    try { return decodeURIComponent(coverParam); } catch { return coverParam; }
};

/* ─── PayPal wordmark SVG ───────────────────────────────────────── */
const PayPalWordmark = () => (
    <svg width="72" height="18" viewBox="0 0 120 30" fill="none">
        <text x="0" y="23" fontFamily="Arial" fontWeight="bold" fontSize="30" fill={NAVY}>Pay</text>
        <text x="46" y="23" fontFamily="Arial" fontWeight="bold" fontSize="30" fill="#0070ba">Pal</text>
    </svg>
);

/* ─── PayPal icon ───────────────────────────────────────────────── */
const PayPalIcon = () => (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
        <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.291-.077.446-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.097Z" fill="#009cde"/>
        <path d="M22.925 6.812c-.9 4.612-3.97 7.198-8.862 7.198H12.1c-.626 0-1.157.456-1.255 1.075l-1.342 8.499a.667.667 0 0 1-.659.564H5.18a.54.54 0 0 1-.534-.624l.292-1.844h2.24c.524 0 .968-.383 1.05-.9l1.12-7.098c.082-.517.526-.9 1.05-.9h2.19c4.299 0 7.664-1.748 8.647-6.797.316-1.625.13-2.936-.31-3.173Z" fill="#003087"/>
    </svg>
);

/* ════════════════════════════════════════════════════════════════
   MAIN COMPONENT
════════════════════════════════════════════════════════════════ */
export default function PayPalCheckoutClient() {
    const router       = useRouter();
    const searchParams = useSearchParams();

    const bookId   = searchParams.get("bookId")   || "";
    const name     = searchParams.get("name")     || "";
    const email    = searchParams.get("email")    || "";
    const phone    = searchParams.get("phone")    || "";
    const priceNGN = Number(searchParams.get("price") || 0);
    const title    = searchParams.get("title")    || "Document";
    const author   = searchParams.get("author")   || "";
    const cover    = searchParams.get("cover")    || "";
    const priceUSD = toUSD(priceNGN);

    const PAYPAL_CLIENT_ID = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || "YOUR_PAYPAL_CLIENT_ID";
    const sdkReady   = usePayPalSDK(PAYPAL_CLIENT_ID);
    const paypalBtnRef = useRef(null);
    const btnRendered  = useRef(false);

    const [status,   setStatus]   = useState("idle");
    const [errorMsg, setErrorMsg] = useState("");

    /* ── Render PayPal buttons ── */
    useEffect(() => {
        if (!sdkReady || btnRendered.current || !paypalBtnRef.current) return;
        btnRendered.current = true;
        window.paypal.Buttons({
            style: { layout: "vertical", color: "gold", shape: "rect", label: "pay", height: 46 },
            createOrder: async () => {
                setStatus("processing");
                try {
                    const res  = await fetch("/api/paypal/create-order", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ bookId, amount: priceUSD, currency: "USD", buyerEmail: email, buyerName: name }),
                    });
                    const data = await res.json();
                    if (!data.orderID) throw new Error("No orderID returned");
                    setStatus("idle");
                    return data.orderID;
                } catch (err) {
                    setStatus("error");
                    setErrorMsg("Could not initiate PayPal checkout. Please try again.");
                    throw err;
                }
            },
            onApprove: async (data) => {
                setStatus("processing");
                try {
                    const res = await fetch("/api/paypal/capture-order", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ orderID: data.orderID, bookId, buyerEmail: email, buyerName: name, buyerPhone: phone }),
                    });
                    const result = await res.json();
                    if (result.success) {
                        setStatus("success");
                        setTimeout(() => router.push(`/book/preview?id=${bookId}&purchased=true`), 3000);
                    } else throw new Error(result.message || "Capture failed");
                } catch {
                    setStatus("error");
                    setErrorMsg("Payment capture failed. Please contact support with your order details.");
                }
            },
            onCancel: () => { setStatus("idle"); setErrorMsg("Payment was cancelled. You can try again below."); },
            onError:  (err) => { console.error(err); setStatus("error"); setErrorMsg("Something went wrong with PayPal. Please try again or use a different method."); },
        }).render(paypalBtnRef.current);
    }, [sdkReady]);

    /* ── shared style objects (matching PaymentClient) ── */
    const navyBtn = {
        width: "100%", background: NAVY, color: "#fff",
        padding: "13px", border: "none", fontSize: "12px",
        fontWeight: 700, cursor: "pointer", fontFamily: "'Lato',sans-serif",
        letterSpacing: "0.06em", transition: "background 0.18s",
    };
    const goldBtn = {
        width: "100%", background: GOLD, color: NAVY,
        padding: "13px", border: "none", fontSize: "12px",
        fontWeight: 700, cursor: "pointer", fontFamily: "'Lato',sans-serif",
        letterSpacing: "0.06em",
    };

    /* ════════════════════════════════════════════════════════════════
       SUCCESS SCREEN
    ════════════════════════════════════════════════════════════════ */
    if (status === "success") return (
        <>
            <style>{`@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900&family=Lato:wght@300;400;700&display=swap'); @keyframes spin{to{transform:rotate(360deg)}}`}</style>
            <div style={{ minHeight: "100vh", background: BG, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px", fontFamily: "'Lato',sans-serif" }}>
                <div style={{ background: "#fff", border: "0.5px solid #e5ddd0", padding: "40px 32px", maxWidth: "420px", width: "100%", textAlign: "center" }}>
                    <div style={{ width: "64px", height: "64px", border: "0.5px solid #86efac", background: "#f0fdf4", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
                        <CheckCircle size={28} style={{ color: "#16a34a" }} />
                    </div>
                    <p style={{ fontSize: "9px", fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: GOLD, margin: "0 0 6px" }}>Payment Confirmed</p>
                    <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: "22px", fontWeight: 700, color: NAVY, margin: "0 0 20px" }}>Payment Successful!</h2>

                    <div style={{ background: CREAM, border: "0.5px solid rgba(184,150,62,0.2)", padding: "16px", marginBottom: "20px", textAlign: "left" }}>
                        {[["Book", title], ["Amount", `₦${priceNGN.toLocaleString()} (~$${priceUSD})`], ["Buyer", email]].map(([k, v]) => (
                            <div key={k} style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", padding: "5px 0", borderBottom: "0.5px solid rgba(184,150,62,0.15)" }}>
                                <span style={{ color: "#aaa" }}>{k}</span>
                                <span style={{ fontWeight: 700, color: NAVY, maxWidth: "220px", textAlign: "right", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{v}</span>
                            </div>
                        ))}
                    </div>

                    <p style={{ fontSize: "12px", color: "#aaa", marginBottom: "16px" }}>Redirecting to book preview…</p>
                    <Link href={`/book/preview?id=${bookId}&purchased=true`} style={{ display: "block", background: NAVY, color: "#fff", padding: "13px", fontSize: "12px", fontWeight: 700, textDecoration: "none", fontFamily: "'Lato',sans-serif", letterSpacing: "0.06em", textAlign: "center" }}>
                        VIEW YOUR BOOK
                    </Link>
                </div>
            </div>
        </>
    );

    const isDemo = PAYPAL_CLIENT_ID === "YOUR_PAYPAL_CLIENT_ID";

    /* ════════════════════════════════════════════════════════════════
       MAIN CHECKOUT PAGE
    ════════════════════════════════════════════════════════════════ */
    return (
        <>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400&family=Lato:wght@300;400;700&display=swap');

                *, *::before, *::after { box-sizing: border-box; }

                .pp-root {
                    font-family: 'Lato', sans-serif;
                    background: ${BG};
                    min-height: 100vh;
                    color: ${NAVY};
                }

                @keyframes spin  { to { transform: rotate(360deg); } }
                @keyframes fadeIn { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }

                /* ── Navbar ── */
                .pp-nav {
                    background: ${NAVY};
                    background-image: radial-gradient(rgba(184,150,62,0.06) 1px, transparent 1px);
                    background-size: 24px 24px;
                    height: 60px;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 0 24px;
                    border-bottom: 0.5px solid rgba(184,150,62,0.2);
                    position: sticky;
                    top: 0;
                    z-index: 50;
                }
                .pp-nav-brand {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    font-family: 'Playfair Display', serif;
                    font-size: 18px;
                    font-weight: 700;
                    color: #fff;
                    letter-spacing: 0.01em;
                    text-decoration: none;
                }
                .pp-nav-back {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    color: rgba(255,255,255,0.65);
                    background: rgba(255,255,255,0.07);
                    border: 0.5px solid rgba(255,255,255,0.15);
                    padding: 7px 14px;
                    font-size: 11px;
                    font-weight: 700;
                    letter-spacing: 0.06em;
                    text-transform: uppercase;
                    cursor: pointer;
                    font-family: 'Lato', sans-serif;
                    transition: background 0.18s, color 0.18s;
                }
                .pp-nav-back:hover { background: rgba(255,255,255,0.14); color: #fff; }

                /* ── Hero strip ── */
                .pp-hero {
                    background: ${NAVY};
                    background-image: radial-gradient(rgba(184,150,62,0.06) 1px, transparent 1px);
                    background-size: 24px 24px;
                    padding: 40px 24px 56px;
                    text-align: center;
                    border-bottom: 0.5px solid rgba(184,150,62,0.2);
                    position: relative;
                }
                .pp-hero::after {
                    content: '';
                    position: absolute;
                    bottom: -1px; left: 0; right: 0;
                    height: 32px;
                    background: ${BG};
                    clip-path: ellipse(60% 100% at 50% 100%);
                }
                .pp-hero-eyebrow {
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                    border: 0.5px solid rgba(184,150,62,0.35);
                    padding: 5px 14px;
                    font-size: 9px;
                    font-weight: 700;
                    letter-spacing: 0.14em;
                    text-transform: uppercase;
                    color: ${GOLD};
                    margin-bottom: 16px;
                }

                /* ── Main grid ── */
                .pp-grid {
                    max-width: 1100px;
                    margin: 0 auto;
                    padding: 32px 16px 60px;
                    display: grid;
                    grid-template-columns: 1fr;
                    gap: 16px;
                }
                @media (min-width: 1024px) {
                    .pp-grid { grid-template-columns: 1fr 320px; }
                }

                /* ── Section card (matches PaymentClient) ── */
                .section-card {
                    background: #fff;
                    border: 0.5px solid #e5ddd0;
                    padding: 24px;
                    margin-bottom: 16px;
                    animation: fadeIn 0.35s ease both;
                }
                .section-card:last-child { margin-bottom: 0; }

                /* ── PayPal wrapper ── */
                .pp-method-badge {
                    display: flex;
                    align-items: center;
                    gap: 14px;
                    background: ${CREAM};
                    border: 0.5px solid rgba(184,150,62,0.3);
                    padding: 14px 16px;
                    margin-bottom: 16px;
                }
                .pp-method-dot {
                    width: 18px; height: 18px;
                    border: 1.5px solid ${GOLD};
                    border-radius: 50%;
                    display: flex; align-items: center; justify-content: center;
                    flex-shrink: 0;
                }
                .pp-method-dot::after {
                    content: '';
                    width: 8px; height: 8px;
                    background: ${GOLD};
                    border-radius: 50%;
                }

                /* ── Steps guide ── */
                .steps-guide {
                    background: ${CREAM};
                    border: 0.5px solid rgba(184,150,62,0.25);
                    border-left: 3px solid ${GOLD};
                    padding: 12px 16px;
                    margin-bottom: 16px;
                }
                .step-item {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    padding: 6px 0;
                    font-size: 12px;
                    color: #555;
                    border-bottom: 0.5px solid rgba(184,150,62,0.12);
                    line-height: 1.5;
                }
                .step-item:last-child { border-bottom: none; }
                .step-num {
                    width: 20px; height: 20px;
                    background: ${NAVY};
                    color: ${GOLD};
                    font-size: 9px;
                    font-weight: 700;
                    display: flex; align-items: center; justify-content: center;
                    flex-shrink: 0;
                    letter-spacing: 0;
                }

                /* ── Error bar ── */
                .pp-error {
                    display: flex;
                    align-items: flex-start;
                    gap: 10px;
                    background: #fff1f2;
                    border: 0.5px solid #fca5a5;
                    padding: 10px 14px;
                    margin-bottom: 16px;
                    font-size: 12px;
                    color: #dc2626;
                    line-height: 1.5;
                    animation: fadeIn 0.2s ease;
                }

                /* ── Processing ── */
                .pp-processing {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 10px;
                    padding: 10px;
                    font-size: 12px;
                    color: ${NAVY};
                    font-weight: 700;
                    letter-spacing: 0.04em;
                    margin-bottom: 16px;
                }
                .pp-spinner {
                    width: 18px; height: 18px;
                    border: 2px solid ${NAVY};
                    border-top-color: ${GOLD};
                    border-radius: 50%;
                    animation: spin 0.8s linear infinite;
                }

                /* ── PayPal button slot ── */
                .pp-btn-slot {
                    border: 0.5px solid #e5ddd0;
                    padding: 4px;
                    margin-bottom: 12px;
                }

                /* ── Trust row ── */
                .trust-row {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 6px;
                    font-size: 10px;
                    color: #aaa;
                    margin-top: 14px;
                    letter-spacing: 0.04em;
                    text-transform: uppercase;
                }

                /* ── Meta rows (right panel) ── */
                .meta-row {
                    display: flex;
                    justify-content: space-between;
                    font-size: 11px;
                    padding: 7px 0;
                    border-bottom: 0.5px solid #f0ebe0;
                }
                .meta-row:last-child { border-bottom: none; }

                /* ── Divider ── */
                .gold-divider {
                    height: 0.5px;
                    background: linear-gradient(90deg, transparent, ${GOLD}, transparent);
                    margin: 20px 0;
                    opacity: 0.4;
                }

                /* ── Demo notice ── */
                .demo-notice {
                    background: ${CREAM};
                    border: 0.5px solid rgba(184,150,62,0.2);
                    padding: 10px 14px;
                    margin-top: 10px;
                    font-size: 11px;
                    color: #888;
                    line-height: 1.65;
                }

                /* ── Promo bar ── */
                .promo-bar {
                    background: ${NAVY};
                    background-image: radial-gradient(rgba(184,150,62,0.08) 1px,transparent 1px);
                    background-size: 24px 24px;
                    color: #fff;
                    padding: 14px 20px;
                    margin-bottom: 16px;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    border: 0.5px solid rgba(184,150,62,0.2);
                }
            `}</style>

            <div className="pp-root">

                {/* ── Navbar ── */}
                <nav className="pp-nav">
                    <Link href="/" className="pp-nav-brand">
                        <BookOpen size={16} strokeWidth={1.5} style={{ color: GOLD }} />
                        LAN Library
                    </Link>
                    <button className="pp-nav-back" onClick={() => router.back()}>
                        <ChevronLeft size={12} /> Back
                    </button>
                </nav>

                {/* ── Hero ── */}
                <div className="pp-hero">
                    <div className="pp-hero-eyebrow">
                        <Lock size={10} /> SSL Secured Checkout
                    </div>
                    <p style={{ fontSize: "9px", fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: GOLD, margin: "0 0 6px" }}>PayPal Checkout</p>
                    <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: "clamp(22px,4vw,32px)", fontWeight: 700, color: "#fff", margin: "0 0 6px", letterSpacing: "-0.01em" }}>Complete Your Purchase</h1>
                    <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.5)", margin: 0, fontWeight: 300 }}>Review your order and pay securely via PayPal</p>
                </div>

                {/* ── Main grid ── */}
                <main className="pp-grid">

                    {/* ════ LEFT — Payment panel ════ */}
                    <div>

                        {/* Page label */}
                        <div style={{ marginBottom: "20px" }}>
                            <p style={{ fontSize: "9px", fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: GOLD, margin: "0 0 4px" }}>Step 1</p>
                            <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: "22px", fontWeight: 700, color: NAVY, margin: 0 }}>Payment Information</h2>
                        </div>

                        {/* Buyer info card */}
                        <div className="section-card">
                            <p style={{ fontSize: "9px", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: GOLD, margin: "0 0 14px" }}>Paying As</p>
                            <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                                <div style={{ width: "40px", height: "40px", background: NAVY, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                    <span style={{ fontSize: "14px", fontWeight: 700, color: GOLD, fontFamily: "'Lato',sans-serif" }}>
                                        {(name || "G").charAt(0).toUpperCase()}
                                    </span>
                                </div>
                                <div>
                                    <p style={{ fontSize: "14px", fontWeight: 700, color: NAVY, margin: "0 0 2px", fontFamily: "'Lato',sans-serif" }}>{name || "Guest"}</p>
                                    <p style={{ fontSize: "12px", color: "#888", margin: 0, fontFamily: "'Lato',sans-serif" }}>{email}{phone ? ` · ${phone}` : ""}</p>
                                </div>
                            </div>
                        </div>

                        {/* PayPal payment card */}
                        <div className="section-card">
                            <p style={{ fontSize: "9px", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: GOLD, margin: "0 0 16px" }}>Payment Method</p>

                            {/* Selected method badge */}
                            <div className="pp-method-badge">
                                <div className="pp-method-dot" />
                                <PayPalIcon />
                                <div style={{ flex: 1 }}>
                                    <p style={{ fontSize: "13px", fontWeight: 700, color: NAVY, margin: "0 0 2px", fontFamily: "'Lato',sans-serif" }}>PayPal</p>
                                    <p style={{ fontSize: "11px", color: "#aaa", margin: 0, fontFamily: "'Lato',sans-serif" }}>Redirects to PayPal's secure checkout</p>
                                </div>
                                <PayPalWordmark />
                            </div>

                            {/* How it works */}
                            <div className="steps-guide">
                                <p style={{ fontSize: "9px", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: GOLD, margin: "0 0 8px" }}>How This Works</p>
                                {[
                                    "Click the PayPal button below",
                                    "Log in (or pay as guest) on PayPal's site",
                                    "Confirm payment — you're charged in USD",
                                    "You're redirected here & book unlocks instantly",
                                ].map((step, i) => (
                                    <div key={i} className="step-item">
                                        <div className="step-num">{i + 1}</div>
                                        {step}
                                    </div>
                                ))}
                            </div>

                            {/* Error */}
                            {errorMsg && (
                                <div className="pp-error">
                                    <AlertCircle size={14} style={{ flexShrink: 0, marginTop: 1 }} />
                                    <span>{errorMsg}</span>
                                </div>
                            )}

                            {/* Processing */}
                            {status === "processing" && (
                                <div className="pp-processing">
                                    <div className="pp-spinner" />
                                    CONNECTING TO PAYPAL…
                                </div>
                            )}

                            {/* Trust row */}
                            <div className="trust-row">
                                <ShieldCheck size={11} style={{ color: GOLD }} />
                                256-bit SSL
                                <span style={{ color: "rgba(184,150,62,0.4)" }}>·</span>
                                PayPal Buyer Protection
                                <span style={{ color: "rgba(184,150,62,0.4)" }}>·</span>
                                Cancel Anytime
                            </div>
                        </div>

                        {/* Referral strip — matches PaymentClient */}
                        <div style={{ background: CREAM, border: "0.5px solid rgba(184,150,62,0.2)", padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
                            <p style={{ fontSize: "12px", color: NAVY, fontWeight: 700, margin: 0 }}>Invite friends & earn ₦500</p>
                            <Link href="/referrals" style={{ fontSize: "11px", fontWeight: 700, color: GOLD, textDecoration: "none", fontFamily: "'Lato',sans-serif" }}>Get link →</Link>
                        </div>

                        {/* Back link */}
                        <button onClick={() => router.back()} style={{ background: "transparent", border: "none", cursor: "pointer", color: "#aaa", fontSize: "12px", fontFamily: "'Lato',sans-serif", padding: "8px 0", display: "flex", alignItems: "center", gap: "6px" }}>
                            <ChevronLeft size={12} /> Want a different payment method? Go back
                        </button>
                    </div>

                    {/* ════ RIGHT — Order summary ════ */}
                    <div>
                        {/* Book hero */}
                        <div className="section-card" style={{ padding: "20px", marginBottom: "16px" }}>
                            <p style={{ fontSize: "9px", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: GOLD, margin: "0 0 14px" }}>Order Summary</p>
                            <div style={{ display: "flex", gap: "14px", alignItems: "flex-start" }}>
                                <div style={{ position: "relative", flexShrink: 0 }}>
                                    <img
                                        src={getThumbnailUrl(cover)}
                                        alt={"Cover of " + title}
                                        style={{ width: "76px", aspectRatio: "3/4", objectFit: "cover", display: "block", border: "0.5px solid #e5ddd0" }}
                                        onError={e => { e.target.src = "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400"; }}
                                        loading="lazy"
                                    />
                                    <span style={{ position: "absolute", top: "5px", left: "5px", background: NAVY, color: GOLD, fontSize: "7px", fontWeight: 700, padding: "2px 5px", fontFamily: "'Lato',sans-serif" }}>PDF</span>
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <p style={{ fontFamily: "'Playfair Display',serif", fontSize: "15px", fontWeight: 700, color: NAVY, margin: "0 0 4px", lineHeight: 1.3, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{title}</p>
                                    {author && <p style={{ fontSize: "11px", color: "#888", margin: "0 0 10px" }}>by {author}</p>}
                                    <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", background: CREAM, border: "0.5px solid rgba(184,150,62,0.3)", color: NAVY, fontSize: "9px", fontWeight: 700, padding: "3px 8px", letterSpacing: "0.08em", fontFamily: "'Lato',sans-serif" }}>
                                        <Tag size={9} /> DIGITAL DOWNLOAD
                                    </span>
                                </div>
                            </div>

                            <div className="gold-divider" />

                            {/* Pricing */}
                            <div>
                                <div className="meta-row">
                                    <span style={{ color: "#aaa" }}>Document price</span>
                                    <span style={{ fontWeight: 700, color: NAVY }}>₦{priceNGN.toLocaleString()}</span>
                                </div>
                                <div className="meta-row">
                                    <span style={{ color: "#aaa" }}>PayPal processing fee</span>
                                    <span style={{ fontWeight: 700, color: "#16a34a" }}>Included</span>
                                </div>
                                <div className="meta-row" style={{ borderBottom: "none" }}>
                                    <span style={{ color: "#ccc", fontSize: "10px" }}>USD equivalent (approx.)</span>
                                    <span style={{ color: "#bbb", fontSize: "10px" }}>${priceUSD}</span>
                                </div>
                            </div>

                            {/* Total */}
                            <div style={{ borderTop: `0.5px solid rgba(184,150,62,0.3)`, marginTop: "4px", paddingTop: "14px", display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                                <span style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#aaa" }}>Total Due Today</span>
                                <span style={{ fontFamily: "'Playfair Display',serif", fontSize: "24px", fontWeight: 700, color: NAVY }}>₦{priceNGN.toLocaleString()}</span>
                            </div>
                        </div>

                        {/* What you get */}
                        <div className="section-card" style={{ padding: "20px", background: CREAM, border: "0.5px solid rgba(184,150,62,0.25)" }}>
                            <p style={{ fontSize: "9px", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: GOLD, margin: "0 0 14px" }}>What You Get</p>
                            {[
                                "Instant access after payment completes",
                                "Saved permanently to your library",
                                "Read on any device, anytime",
                                "Seller is notified of your purchase",
                            ].map(item => (
                                <div key={item} style={{ display: "flex", alignItems: "flex-start", gap: "10px", marginBottom: "10px", fontSize: "12px", color: "#555", lineHeight: 1.5 }}>
                                    <CheckCircle size={13} style={{ color: "#16a34a", flexShrink: 0, marginTop: 1 }} />
                                    {item}
                                </div>
                            ))}
                        </div>

                        {/* Legal note */}
                        <p style={{ fontSize: "10px", color: "#bbb", lineHeight: 1.65, marginTop: "12px", padding: "0 2px" }}>
                            By completing this purchase you agree to LAN Library's{" "}
                            <Link href="/lan/terms-of-service" style={{ color: "#999", textDecoration: "underline" }}>Terms of Sale</Link> and{" "}
                            <Link href="/lan/privacy-policy" style={{ color: "#999", textDecoration: "underline" }}>Privacy Policy</Link>.
                            PayPal charges in USD — your bank applies the exchange rate. The NGN amount shown is an estimate.
                        </p>
                    </div>
                </main>
            </div>
        </>
    );
}