"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ShieldCheck, ChevronLeft, BookOpen, Tag, CheckCircle2, Lock, ArrowRight, AlertCircle } from "lucide-react";
import Link from "next/link";

/* ─── PayPal SDK loader ─────────────────────────────────────────── */
function usePayPalSDK(clientId, currency = "USD") {
    const [ready, setReady] = useState(false);
    useEffect(() => {
        if (!clientId || clientId === "YOUR_PAYPAL_CLIENT_ID") return;
        if (window.paypal) { setReady(true); return; }
        const script = document.createElement("script");
        script.src = `https://www.paypal.com/sdk/js?client-id=${clientId}&currency=${currency}&components=buttons`;
        script.async = true;
        script.onload = () => setReady(true);
        script.onerror = () => console.error("Failed to load PayPal SDK");
        document.head.appendChild(script);
        return () => { if (document.head.contains(script)) document.head.removeChild(script); };
    }, [clientId, currency]);
    return ready;
}

/* ─── USD conversion ────────────────────────────────────────────── */
const NGN_TO_USD_RATE = 0.00065;
const toUSD = (ngn) => (ngn * NGN_TO_USD_RATE).toFixed(2);

/* ─── Thumbnail helper ──────────────────────────────────────────── */
const getThumbnailUrl = (coverParam) => {
    if (!coverParam) return "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400";
    try { return decodeURIComponent(coverParam); } catch { return coverParam; }
};

export default function PayPalCheckoutClient() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const bookId = searchParams.get("bookId") || "";
    const name = searchParams.get("name") || "";
    const email = searchParams.get("email") || "";
    const phone = searchParams.get("phone") || "";
    const priceNGN = Number(searchParams.get("price") || 0);
    const title = searchParams.get("title") || "Document";
    const author = searchParams.get("author") || "";
    const cover = searchParams.get("cover") || "";
    const priceUSD = toUSD(priceNGN);

    /* ── PayPal setup ── */
    const PAYPAL_CLIENT_ID = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || "YOUR_PAYPAL_CLIENT_ID";
    const sdkReady = usePayPalSDK(PAYPAL_CLIENT_ID);
    const paypalBtnRef = useRef(null);
    const btnRendered = useRef(false);

    const [status, setStatus] = useState("idle");
    const [errorMsg, setErrorMsg] = useState("");
    const [mounted, setMounted] = useState(false);

    useEffect(() => setMounted(true), []);

    /* ── Render PayPal buttons ── */
    useEffect(() => {
        if (!sdkReady || btnRendered.current || !paypalBtnRef.current) return;
        btnRendered.current = true;

        window.paypal.Buttons({
            style: { layout: "vertical", color: "gold", shape: "pill", label: "pay", height: 50 },

          
            createOrder: async () => {
                setStatus("processing");
                try {
                    const res = await fetch("/api/paypal/create-order", {
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
                    } else {
                        throw new Error(result.message || "Capture failed");
                    }
                } catch {
                    setStatus("error");
                    setErrorMsg("Payment capture failed. Please contact support with your order details.");
                }
            },

            onCancel: () => { setStatus("idle"); setErrorMsg("Payment was cancelled. You can try again below."); },
            onError: (err) => { console.error(err); setStatus("error"); setErrorMsg("Something went wrong with PayPal. Please try again or use a different method."); },
        }).render(paypalBtnRef.current);
    }, [sdkReady]);

    /* ── Success screen ── */
    if (status === "success") {
        return (
            <>
                <style>{`
                    @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600;700&family=DM+Sans:ital,wght@0,300;0,400;0,500;1,300&display=swap');
                    @keyframes fadeUp { from { opacity:0; transform:translateY(24px); } to { opacity:1; transform:translateY(0); } }
                    @keyframes scaleIn { from { transform:scale(0.7); opacity:0; } to { transform:scale(1); opacity:1; } }
                    @keyframes dash { to { stroke-dashoffset:0; } }
                `}</style>
                <div style={{ minHeight: "100vh", background: "#f8f6f1", display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem", fontFamily: "'DM Sans', sans-serif" }}>
                    <div style={{ background: "#fff", borderRadius: 20, padding: "3.5rem 3rem", maxWidth: 460, width: "100%", textAlign: "center", boxShadow: "0 20px 60px rgba(0,0,0,0.08)", animation: "fadeUp 0.6s ease both" }}>
                        <div style={{ width: 80, height: 80, borderRadius: "50%", background: "linear-gradient(135deg,#d1fae5,#a7f3d0)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 2rem", animation: "scaleIn 0.5s cubic-bezier(0.34,1.56,0.64,1) 0.2s both" }}>
                            <CheckCircle2 size={40} color="#059669" strokeWidth={1.5} />
                        </div>
                        <p style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: "2rem", fontWeight: 700, color: "#0d1f35", marginBottom: "0.5rem", lineHeight: 1.2 }}>Payment Confirmed</p>
                        <p style={{ color: "#6b7280", fontSize: "0.95rem", lineHeight: 1.7, marginBottom: "2rem" }}>
                            <strong style={{ color: "#111" }}>{title}</strong> is now in your library. Redirecting you there now…
                        </p>
                        <div style={{ background: "#f8f6f1", borderRadius: 12, padding: "1.25rem 1.5rem", marginBottom: "2rem", textAlign: "left" }}>
                            {[["Book", title], ["Paid", `₦${priceNGN.toLocaleString()} (~$${priceUSD})`], ["Buyer", email]].map(([k, v]) => (
                                <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "0.4rem 0", fontSize: "0.85rem", borderBottom: "1px solid #eee" }}>
                                    <span style={{ color: "#9ca3af" }}>{k}</span>
                                    <span style={{ color: "#111", fontWeight: 500, maxWidth: "65%", textAlign: "right", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{v}</span>
                                </div>
                            ))}
                        </div>
                        <Link href={`/book/preview?id=${bookId}&purchased=true`}
                            style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#0d1f35", color: "#fff", padding: "13px 28px", borderRadius: 100, fontWeight: 500, fontSize: "0.9rem", textDecoration: "none" }}>
                            View Your Book <ArrowRight size={16} />
                        </Link>
                    </div>
                </div>
            </>
        );
    }

    const isDemo = PAYPAL_CLIENT_ID === "YOUR_PAYPAL_CLIENT_ID";

    return (
        <>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600;700&family=DM+Sans:ital,wght@0,300;0,400;0,500;1,300&display=swap');

                *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

                body { background: #f8f6f1; }

                .checkout-root {
                    min-height: 100vh;
                    background: #f8f6f1;
                    font-family: 'DM Sans', sans-serif;
                    color: #111827;
                }

                @keyframes fadeUp {
                    from { opacity: 0; transform: translateY(20px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
                @keyframes spin { to { transform: rotate(360deg); } }

                .fade-up { animation: fadeUp 0.5s ease both; }
                .fade-up-1 { animation: fadeUp 0.5s ease 0.08s both; }
                .fade-up-2 { animation: fadeUp 0.5s ease 0.16s both; }

                /* Top nav */
                .co-nav {
                    background: #0d1f35;
                    height: 58px;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 0 2rem;
                    position: sticky;
                    top: 0;
                    z-index: 50;
                }
                .co-nav-brand {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    font-family: 'Cormorant Garamond', serif;
                    font-size: 1.25rem;
                    font-weight: 700;
                    color: #fff;
                    letter-spacing: 0.01em;
                }
                .co-nav-back {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    color: rgba(255,255,255,0.65);
                    background: rgba(255,255,255,0.08);
                    border: 1px solid rgba(255,255,255,0.12);
                    border-radius: 100px;
                    padding: 6px 14px;
                    font-size: 0.82rem;
                    cursor: pointer;
                    transition: all 0.2s;
                    font-family: inherit;
                }
                .co-nav-back:hover { background: rgba(255,255,255,0.14); color: #fff; }

                /* Hero strip */
                .co-hero {
                    background: #0d1f35;
                    padding: 2.5rem 2rem 4rem;
                    text-align: center;
                    position: relative;
                }
                .co-hero::after {
                    content: '';
                    position: absolute;
                    bottom: -1px;
                    left: 0; right: 0;
                    height: 48px;
                    background: #f8f6f1;
                    border-radius: 48px 48px 0 0;
                }
                .co-hero h1 {
                    font-family: 'Cormorant Garamond', serif;
                    font-size: clamp(1.7rem, 4vw, 2.4rem);
                    font-weight: 700;
                    color: #fff;
                    margin-bottom: 0.4rem;
                    letter-spacing: -0.01em;
                }
                .co-hero p {
                    color: rgba(255,255,255,0.55);
                    font-size: 0.9rem;
                    font-weight: 300;
                }

                /* Secure badge */
                .secure-badge {
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                    background: rgba(255,255,255,0.1);
                    border: 1px solid rgba(255,255,255,0.15);
                    border-radius: 100px;
                    padding: 5px 14px;
                    font-size: 0.75rem;
                    color: rgba(255,255,255,0.7);
                    margin-bottom: 1.25rem;
                }

                /* Main grid */
                .co-grid {
                    max-width: 960px;
                    margin: 0 auto;
                    padding: 0 1.5rem 5rem;
                    display: grid;
                    grid-template-columns: 1fr 360px;
                    gap: 1.5rem;
                    align-items: start;
                }
                @media (max-width: 740px) {
                    .co-grid { grid-template-columns: 1fr; }
                    .co-summary { order: -1; }
                }

                /* Cards */
                .co-card {
                    background: #fff;
                    border-radius: 16px;
                    overflow: hidden;
                    box-shadow: 0 1px 3px rgba(0,0,0,0.06), 0 8px 24px rgba(0,0,0,0.05);
                }

                /* Section label */
                .section-label {
                    font-size: 0.68rem;
                    font-weight: 500;
                    letter-spacing: 0.12em;
                    text-transform: uppercase;
                    color: #9ca3af;
                    margin-bottom: 0.75rem;
                }

                /* Buyer card */
                .buyer-section {
                    padding: 1.5rem 1.75rem;
                    border-bottom: 1px solid #f3f4f6;
                }
                .buyer-name {
                    font-size: 1rem;
                    font-weight: 500;
                    color: #111;
                    margin-bottom: 0.2rem;
                }
                .buyer-meta {
                    font-size: 0.84rem;
                    color: #6b7280;
                    line-height: 1.6;
                }

                /* PayPal section */
                .paypal-section {
                    padding: 1.5rem 1.75rem;
                }
                .paypal-badge {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 1rem 1.25rem;
                    border: 1.5px solid #e0ecfa;
                    border-radius: 12px;
                    background: #f5f9ff;
                    margin-bottom: 1.25rem;
                }
                .paypal-badge-text p { margin: 0; }
                .paypal-badge-text .pp-name { font-weight: 600; color: #003087; font-size: 0.92rem; }
                .paypal-badge-text .pp-sub  { font-size: 0.76rem; color: #6b7280; }

                /* Steps guide */
                .steps-guide {
                    background: #fffbf0;
                    border: 1px solid #fde68a;
                    border-radius: 10px;
                    padding: 1rem 1.25rem;
                    margin-bottom: 1.25rem;
                }
                .steps-guide p {
                    font-size: 0.78rem;
                    color: #92400e;
                    font-weight: 500;
                    margin-bottom: 0.5rem;
                }
                .steps-guide ol {
                    padding-left: 1.1rem;
                    font-size: 0.76rem;
                    color: #78350f;
                    line-height: 1.9;
                }

                /* Error */
                .co-error {
                    display: flex;
                    align-items: flex-start;
                    gap: 10px;
                    background: #fef2f2;
                    border: 1px solid #fecaca;
                    border-radius: 10px;
                    padding: 0.9rem 1.1rem;
                    margin-bottom: 1.25rem;
                    font-size: 0.84rem;
                    color: #dc2626;
                    line-height: 1.5;
                }

                /* Processing */
                .co-processing {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 10px;
                    padding: 0.75rem;
                    font-size: 0.86rem;
                    color: #0d1f35;
                    margin-bottom: 1rem;
                }
                .co-spinner {
                    width: 18px; height: 18px;
                    border: 2px solid #0d1f35;
                    border-top-color: transparent;
                    border-radius: 50%;
                    animation: spin 0.7s linear infinite;
                }

                /* Demo button */
                .demo-btn {
                    background: #ffd140;
                    border: none;
                    border-radius: 100px;
                    padding: 14px 24px;
                    width: 100%;
                    cursor: pointer;
                    font-weight: 700;
                    font-size: 0.95rem;
                    color: #003087;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                    transition: opacity 0.2s, transform 0.15s;
                    font-family: inherit;
                }
                .demo-btn:hover { opacity: 0.9; transform: translateY(-1px); }
                .demo-btn:active { transform: scale(0.98); }

                .demo-notice {
                    background: #f3f4f6;
                    border-radius: 8px;
                    padding: 0.75rem 1rem;
                    margin-top: 0.75rem;
                    font-size: 0.75rem;
                    color: #6b7280;
                    line-height: 1.6;
                }
                .demo-notice code {
                    background: #e5e7eb;
                    padding: 1px 6px;
                    border-radius: 4px;
                    font-family: monospace;
                    font-size: 0.72rem;
                }

                /* PayPal button container */
                .pp-btn-wrap { border-radius: 100px; overflow: hidden; }
                .pp-btn-wrap iframe { border-radius: 100px !important; }

                /* Trust footer */
                .co-trust {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 6px;
                    margin-top: 1.25rem;
                    font-size: 0.76rem;
                    color: #9ca3af;
                }

                /* Order summary card */
                .book-preview {
                    display: flex;
                    gap: 1rem;
                    padding: 1.5rem 1.75rem;
                    border-bottom: 1px solid #f3f4f6;
                    align-items: flex-start;
                }
                .book-cover {
                    width: 68px;
                    height: 92px;
                    object-fit: cover;
                    border-radius: 6px;
                    flex-shrink: 0;
                    border: 1px solid #e5e7eb;
                    box-shadow: 2px 4px 12px rgba(0,0,0,0.1);
                }
                .book-info { flex: 1; min-width: 0; }
                .book-title {
                    font-family: 'Cormorant Garamond', serif;
                    font-size: 1.05rem;
                    font-weight: 700;
                    color: #111;
                    line-height: 1.3;
                    margin-bottom: 0.25rem;
                    display: -webkit-box;
                    -webkit-line-clamp: 2;
                    -webkit-box-orient: vertical;
                    overflow: hidden;
                }
                .book-author { font-size: 0.82rem; color: #6b7280; margin-bottom: 0.6rem; }
                .digital-tag {
                    display: inline-flex;
                    align-items: center;
                    gap: 4px;
                    background: #f0fdf4;
                    border: 1px solid #bbf7d0;
                    border-radius: 100px;
                    padding: 2px 10px;
                    font-size: 0.72rem;
                    color: #16a34a;
                    font-weight: 500;
                }

                /* Pricing rows */
                .price-rows { padding: 0.75rem 1.75rem; }
                .price-row {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 0.65rem 0;
                    font-size: 0.85rem;
                    border-bottom: 1px solid #f9fafb;
                }
                .price-row:last-child { border: none; }
                .price-row .pl { color: #6b7280; }
                .price-row .pv { color: #111; font-weight: 500; }
                .price-row .pv.green { color: #16a34a; }
                .price-row .pv.muted { color: #9ca3af; font-size: 0.8rem; }

                /* Total */
                .price-total {
                    margin: 0 1.75rem;
                    padding: 1rem 0;
                    border-top: 2px solid #f3f4f6;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                .total-label { font-weight: 600; color: #111; font-size: 0.9rem; }
                .total-amount {
                    font-family: 'Cormorant Garamond', serif;
                    font-size: 1.7rem;
                    font-weight: 700;
                    color: #0d1f35;
                    line-height: 1;
                }

                /* What you get */
                .what-you-get {
                    background: #f8f6f1;
                    border-top: 1px solid #f0ece4;
                    padding: 1.25rem 1.75rem 1.5rem;
                }
                .wyg-item {
                    display: flex;
                    align-items: flex-start;
                    gap: 8px;
                    margin-bottom: 0.55rem;
                    font-size: 0.82rem;
                    color: #374151;
                    line-height: 1.4;
                }

                /* Legal */
                .legal-note {
                    font-size: 0.73rem;
                    color: #9ca3af;
                    margin-top: 1rem;
                    line-height: 1.6;
                    padding: 0 0.25rem;
                }
                .legal-note a { color: #6b7280; text-decoration: underline; }

                /* Back footer */
                .co-footer-back {
                    text-align: center;
                    padding: 1.5rem 0 0;
                    font-size: 0.84rem;
                    color: #6b7280;
                }
                .co-footer-back button {
                    color: #0d1f35;
                    font-weight: 600;
                    background: none;
                    border: none;
                    cursor: pointer;
                    font-family: inherit;
                    font-size: inherit;
                    text-decoration: underline;
                    text-underline-offset: 2px;
                }
            `}</style>

            <div className="checkout-root">
                {/* ── Nav ── */}
                <nav className="co-nav">
                    <div className="co-nav-brand">
                        <BookOpen size={18} strokeWidth={1.5} />
                        LAN Library
                    </div>
                    <button className="co-nav-back" onClick={() => router.back()}>
                        <ChevronLeft size={14} /> Back
                    </button>
                </nav>

                {/* ── Hero ── */}
                <div className="co-hero fade-up">
                    <div className="secure-badge">
                        <Lock size={11} /> SSL Secured Checkout
                    </div>
                    <h1>Complete Your Purchase</h1>
                    <p>Review your order and pay securely via PayPal</p>
                </div>

                {/* ── Main Grid ── */}
                <div className="co-grid">

                    {/* LEFT — Payment panel */}
                    <div className="fade-up-1">
                        <div className="co-card">

                            {/* Buyer info */}
                            <div className="buyer-section">
                                <p className="section-label">Paying as</p>
                                <p className="buyer-name">{name || "Guest"}</p>
                                <p className="buyer-meta">
                                    {email}<br />
                                    {phone && phone}
                                </p>
                            </div>

                            {/* PayPal section */}
                            <div className="paypal-section">
                                <p className="section-label">Payment method</p>

                                {/* PayPal badge */}
                                <div className="paypal-badge">
                                    <svg width="30" height="30" viewBox="0 0 24 24" fill="none">
                                        <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.291-.077.446-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.097Z" fill="#009cde" />
                                        <path d="M22.925 6.812c-.9 4.612-3.97 7.198-8.862 7.198H12.1c-.626 0-1.157.456-1.255 1.075l-1.342 8.499a.667.667 0 0 1-.659.564H5.18a.54.54 0 0 1-.534-.624l.292-1.844h2.24c.524 0 .968-.383 1.05-.9l1.12-7.098c.082-.517.526-.9 1.05-.9h2.19c4.299 0 7.664-1.748 8.647-6.797.316-1.625.13-2.936-.31-3.173Z" fill="#003087" />
                                    </svg>
                                    <div className="paypal-badge-text">
                                        <p className="pp-name">PayPal</p>
                                        <p className="pp-sub">Redirects to PayPal's secure checkout</p>
                                    </div>
                                </div>

                                {/* How it works guide */}
                                <div className="steps-guide">
                                    <p>📋 How this works:</p>
                                    <ol>
                                        <li>Click the PayPal button below</li>
                                        <li>Log in (or pay as guest) on PayPal's site</li>
                                        <li>Confirm payment — you're charged in USD</li>
                                        <li>You're redirected here & book unlocks instantly</li>
                                    </ol>
                                </div>

                                {/* Error */}
                                {errorMsg && (
                                    <div className="co-error">
                                        <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
                                        <span>{errorMsg}</span>
                                    </div>
                                )}

                                {/* Processing */}
                                {status === "processing" && (
                                    <div className="co-processing">
                                        <div className="co-spinner" /> Connecting to PayPal…
                                    </div>
                                )}

                                {/* PayPal button OR demo placeholder */}
                                {!isDemo ? (
                                    <div ref={paypalBtnRef} className="pp-btn-wrap" />
                                ) : (
                                    <>
                                        <button className="demo-btn" onClick={() => alert("⚠️ Set NEXT_PUBLIC_PAYPAL_CLIENT_ID in .env.local to enable real PayPal payments.")}>
                                            <svg width="56" height="14" viewBox="0 0 100 28" fill="none">
                                                <text x="0" y="22" fontFamily="Arial" fontWeight="bold" fontSize="28" fill="#003087">Pay</text>
                                                <text x="40" y="22" fontFamily="Arial" fontWeight="bold" fontSize="28" fill="#009cde">Pal</text>
                                            </svg>
                                            Pay ₦{priceNGN.toLocaleString()}
                                        </button>
                                      
                                    </>
                                )}

                                <div className="co-trust">
                                    <ShieldCheck size={12} />
                                    256-bit SSL · PayPal Buyer Protection · Cancel anytime
                                </div>
                            </div>
                        </div>

                        <div className="co-footer-back">
                            Want a different method?{" "}
                            <button onClick={() => router.back()}>Go back</button>
                        </div>
                    </div>

                    {/* RIGHT — Order summary */}
                    <div className="co-summary fade-up-2">
                        <div className="co-card">
                            {/* Book */}
                            <div className="book-preview">
                                <img
                                    src={getThumbnailUrl(cover)}
                                    alt={title}
                                    className="book-cover"
                                    onError={(e) => { e.target.src = "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400"; }}
                                />
                                <div className="book-info">
                                    <p className="book-title">{title}</p>
                                    {author && <p className="book-author">by {author}</p>}
                                    <span className="digital-tag">
                                        <Tag size={10} /> Digital download
                                    </span>
                                </div>
                            </div>

                            {/* Pricing */}
                            <div className="price-rows">
                                <div className="price-row">
                                    <span className="pl">Document price</span>
                                    <span className="pv">₦{priceNGN.toLocaleString()}</span>
                                </div>
                                <div className="price-row">
                                    <span className="pl">PayPal processing fee</span>
                                    <span className="pv green">Included</span>
                                </div>
                                <div className="price-row">
                                    <span className="pl" style={{ fontSize: "0.78rem", color: "#9ca3af" }}>USD equivalent (approx.)</span>
                                    <span className="pv muted">${priceUSD}</span>
                                </div>
                            </div>

                            {/* Total */}
                            <div className="price-total">
                                <span className="total-label">Total due today</span>
                                <span className="total-amount">₦{priceNGN.toLocaleString()}</span>
                            </div>

                            {/* What you get */}
                            <div className="what-you-get">
                                <p className="section-label" style={{ marginBottom: "0.85rem" }}>What you get</p>
                                {[
                                    "Instant access after payment completes",
                                    "Saved permanently to your library",
                                    "Read on any device, anytime",
                                    "Seller is notified of your purchase",
                                ].map(item => (
                                    <div key={item} className="wyg-item">
                                        <CheckCircle2 size={13} color="#16a34a" style={{ flexShrink: 0, marginTop: 1 }} />
                                        {item}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <p className="legal-note">
                            By completing this purchase you agree to LAN Library's{" "}
                            <Link href="/terms">Terms of Sale</Link> and{" "}
                            <Link href="/privacy">Privacy Policy</Link>.
                            PayPal charges in USD — your bank applies the exchange rate.
                            The NGN amount shown is an estimate.
                        </p>
                    </div>
                </div>
            </div>
        </>
    );
}