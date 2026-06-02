"use client";
import React, { useState } from "react";
import Link from "next/link";

/* ─── colour tokens (Student Network palette) ──────────────── */
const VOID = "#0b0b0f";
const DARK = "#11111a";
const DARK2 = "#18182a";
const PURPLE = "#7c3aed";
const PURPLEL = "#a855f7";
const PURPLED = "#5b21b6";
const LIME = "#a3e635";
const LIMEL = "#d9f99d";
const LIMED = "#65a30d";
const WHITE = "#f8f8ff";
const GRAY = "#2a2a3e";
const MUTED = "rgba(248,248,255,.4)";

/* ═══════════════════════════════════════════════════════════════
   NAV
═══════════════════════════════════════════════════════════════ */
function Nav() {
    return (
        <nav style={{
            position: "sticky", top: 0, zIndex: 100,
            background: VOID,
            borderBottom: "1px solid rgba(124,58,237,.25)",
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "0 40px", height: "64px",
        }}>
            <Link href="#" style={{
                fontFamily: "'Space Grotesk',sans-serif", fontWeight: 800, fontSize: "18px",
                color: WHITE, letterSpacing: "-.02em", textDecoration: "none",
                display: "flex", alignItems: "center", gap: "8px",
            }}>
                LAN<span style={{ color: LIME }}>.</span>Library
            </Link>

            <div style={{ display: "flex", gap: "24px", alignItems: "center" }} className="lan-nav-links">
                {[["#how-it-works", "How It Works"], ["#earnings", "Earnings"], ["#who-qualifies", "Who Qualifies"], ["#tiers", "Tiers"], ["#faq", "FAQ"]].map(([href, label]) => (
                    <a key={href} href={href} style={{
                        color: MUTED, fontSize: "12px", fontWeight: 600,
                        textDecoration: "none", letterSpacing: ".06em", textTransform: "uppercase",
                        transition: "color .15s", fontFamily: "'Space Grotesk',sans-serif",
                    }}
                        onMouseEnter={e => e.currentTarget.style.color = LIME}
                        onMouseLeave={e => e.currentTarget.style.color = MUTED}
                    >{label}</a>
                ))}
                <Link href="/auth/signup" style={{
                    background: LIME, color: VOID, padding: "10px 22px",
                    fontSize: "11px", fontWeight: 800, letterSpacing: ".1em", textTransform: "uppercase",
                    textDecoration: "none", fontFamily: "'Space Grotesk',sans-serif", display: "inline-block",
                    transition: "background .15s", clipPath: "polygon(0 0, 94% 0, 100% 100%, 6% 100%)",
                }}
                    onMouseEnter={e => e.currentTarget.style.background = LIMEL}
                    onMouseLeave={e => e.currentTarget.style.background = LIME}
                >Start Selling</Link>
            </div>
            <style>{`@media(max-width:768px){ .lan-nav-links{ display:none !important; } }`}</style>
        </nav>
    );
}

/* ═══════════════════════════════════════════════════════════════
   NETWORK TABS
═══════════════════════════════════════════════════════════════ */
function NetworkTabs({ active, setActive }) {
    const tabs = [
        { key: "seller", label: "📚 Seller Network" },
        { key: "student", label: "🎓 Student Network" },
        { key: "faculty", label: "🏛️ Faculty Network" },
    ];
    return (
        <div style={{
            background: DARK, display: "flex", justifyContent: "center",
            borderBottom: "1px solid rgba(124,58,237,.2)", overflowX: "auto",
        }}>
            {tabs.map(t => (
                <button key={t.key} onClick={() => setActive(t.key)} style={{
                    padding: "12px 32px", fontSize: "10px", fontWeight: 700,
                    letterSpacing: ".12em", textTransform: "uppercase",
                    color: active === t.key ? LIME : "rgba(248,248,255,.3)",
                    border: "none", background: "none",
                    borderBottom: `2px solid ${active === t.key ? LIME : "transparent"}`,
                    cursor: "pointer", fontFamily: "'Space Grotesk',sans-serif",
                    transition: "all .15s", whiteSpace: "nowrap",
                }}>{t.label}</button>
            ))}
        </div>
    );
}

/* ═══════════════════════════════════════════════════════════════
   HERO
═══════════════════════════════════════════════════════════════ */
function Hero() {
    const tags = ["Upload Once. Earn Forever.", "Past Questions", "Lecture Notes", "Bounty Board", "2,400+ Sellers", "Instant Withdrawals", "80% Revenue Share"];
    return (
        <section style={{
            minHeight: "92vh",
            display: "flex", flexDirection: "column", justifyContent: "center",
            padding: "80px 40px 60px",
            position: "relative", overflow: "hidden",
        }}>
            <img
                src="/LAN seller.png"
                alt=""
                style={{
                    position: "absolute", inset: 0,
                    width: "100%", height: "100%",
                    objectFit: "cover",
                    filter: "brightness(0.3) saturate(0.7)",
                    zIndex: 0,
                }}
                onError={e => {
                    e.target.src = "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=1600";
                }}
            />
            <div style={{
                position: "absolute", inset: 0, zIndex: 1,
                background: "linear-gradient(135deg, rgba(11,11,15,.95) 0%, rgba(124,58,237,.2) 60%, rgba(11,11,15,.88) 100%)",
            }} />
            <div style={{ position: "absolute", top: "-100px", left: "-100px", width: "500px", height: "500px", borderRadius: "50%", background: "radial-gradient(circle, rgba(163,230,53,.15) 0%, transparent 70%)", pointerEvents: "none", zIndex: 1 }} />
            <div style={{ position: "absolute", bottom: "-50px", right: "-50px", width: "400px", height: "400px", borderRadius: "50%", background: "radial-gradient(circle, rgba(124,58,237,.18) 0%, transparent 70%)", pointerEvents: "none", zIndex: 1 }} />

            <div style={{ maxWidth: "1100px", margin: "0 auto", width: "100%", position: "relative", zIndex: 2 }}>
                <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "rgba(163,230,53,.12)", border: "1px solid rgba(163,230,53,.3)", padding: "6px 16px", marginBottom: "28px" }}>
                    <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: LIME, display: "inline-block", animation: "pulse 1.5s ease-in-out infinite" }} />
                    <span style={{ fontSize: "10px", fontWeight: 700, letterSpacing: ".16em", textTransform: "uppercase", color: LIME, fontFamily: "'Space Grotesk',sans-serif" }}>Seller Network · 2,400+ Verified Sellers · ₦47M+ Paid Out</span>
                </div>

                <h1 style={{
                    fontFamily: "'Syne',sans-serif",
                    fontSize: "clamp(48px,8vw,110px)", fontWeight: 800,
                    color: WHITE, lineHeight: .95, letterSpacing: "-.04em",
                    marginBottom: "32px",
                }}>
                    Upload<br />
                    Once<span style={{ color: LIME }}>.</span><br />
                    <span style={{ color: PURPLE }}>Earn</span><br />
                    Forever<span style={{ color: LIME }}>.</span>
                </h1>

                <p style={{
                    fontSize: "17px", color: MUTED, lineHeight: 1.85,
                    fontWeight: 400, maxWidth: "520px", marginBottom: "40px",
                    fontFamily: "'Space Grotesk',sans-serif",
                }}>
                    LAN's Seller Network is Africa's most powerful academic publishing platform.
                    Turn your notes, past questions, and expertise into a passive income stream
                    that pays you while you sleep — reaching 40,000+ active students across 200+ universities.
                </p>

                <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginBottom: "48px" }}>
                    <Link href="/auth/signup" style={{
                        padding: "14px 30px", background: LIME, color: VOID,
                        fontSize: "12px", fontWeight: 800, letterSpacing: ".08em", textTransform: "uppercase",
                        textDecoration: "none", fontFamily: "'Space Grotesk',sans-serif",
                        clipPath: "polygon(0 0, 94% 0, 100% 100%, 6% 100%)",
                        transition: "background .15s",
                    }}
                        onMouseEnter={e => e.currentTarget.style.background = LIMEL}
                        onMouseLeave={e => e.currentTarget.style.background = LIME}
                    >🚀 Start Selling — Free</Link>
                    <a href="#how-it-works" style={{
                        padding: "14px 26px", background: "transparent", color: WHITE,
                        fontSize: "12px", fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase",
                        border: "1px solid rgba(248,248,255,.2)", textDecoration: "none",
                        fontFamily: "'Space Grotesk',sans-serif", transition: "all .15s",
                    }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = PURPLEL; e.currentTarget.style.color = PURPLEL; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(248,248,255,.2)"; e.currentTarget.style.color = WHITE; }}
                    >See How It Works</a>
                </div>

                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "48px" }}>
                    {tags.map((tag, i) => (
                        <span key={tag} style={{
                            padding: "6px 14px", fontSize: "10px", fontWeight: 700, letterSpacing: ".06em",
                            textTransform: "uppercase", fontFamily: "'Space Grotesk',sans-serif",
                            background: i % 3 === 0 ? "rgba(163,230,53,.12)" : i % 3 === 1 ? "rgba(124,58,237,.2)" : "rgba(248,248,255,.06)",
                            color: i % 3 === 0 ? LIME : i % 3 === 1 ? PURPLEL : MUTED,
                            border: `1px solid ${i % 3 === 0 ? "rgba(163,230,53,.25)" : i % 3 === 1 ? "rgba(124,58,237,.35)" : "rgba(248,248,255,.12)"}`,
                        }}>{tag}</span>
                    ))}
                </div>

                <div style={{ display: "flex", gap: "0", flexWrap: "wrap", borderTop: "1px solid rgba(248,248,255,.07)", paddingTop: "32px" }}>
                    {[["₦47M+", "Paid to Sellers"], ["2,400+", "Verified Sellers"], ["80%", "Revenue Share"], ["₦0", "To Join"]].map(([v, l], i) => (
                        <div key={l} style={{ flex: "1 1 120px", paddingRight: "32px", borderRight: i < 3 ? "1px solid rgba(248,248,255,.07)" : "none", marginRight: "32px" }}>
                            <div style={{ fontFamily: "'Syne',sans-serif", fontSize: "clamp(24px,3vw,36px)", fontWeight: 800, color: WHITE, letterSpacing: "-.02em" }}>{v}</div>
                            <div style={{ fontSize: "9px", fontWeight: 700, letterSpacing: ".14em", textTransform: "uppercase", color: "rgba(163,230,53,.6)", marginTop: "2px", fontFamily: "'Space Grotesk',sans-serif" }}>{l}</div>
                        </div>
                    ))}
                </div>
            </div>
            <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }`}</style>
        </section>
    );
}

/* ═══════════════════════════════════════════════════════════════
   WHO QUALIFIES
═══════════════════════════════════════════════════════════════ */
function WhoQualifies() {
    const profiles = [
        {
            icon: "🏆", label: "TOP STUDENTS", title: "Academic High-Performers",
            body: "You've consistently scored high. Your notes are organised, your past question collections are complete, your summaries are clear. That academic excellence translates directly into sellable assets that students across Nigeria will pay for.",
            accent: LIME,
        },
        {
            icon: "🎓", label: "RECENT ALUMNI", title: "Graduates With Pristine Archives",
            body: "Just finished school and still have all your notes? You're sitting on a goldmine. Your 300-level and 400-level materials are exactly what current students need right now. Upload once and earn from what you already created.",
            accent: PURPLE,
        },
        {
            icon: "✍️", label: "CONTENT CREATORS", title: "Independent Academic Creators",
            body: "You create study guides, write summaries, or compile resources for courses you know well — even if you're not currently enrolled. If you can produce accurate, structured academic content, the Seller Network wants you.",
            accent: "#f59e0b",
        },
        {
            icon: "🏛️", label: "LECTURERS & FACULTY", title: "Academic Staff & Instructors",
            body: "You write lectures and course notes already. Publishing them on LAN puts your expertise in front of students across Africa — and pays you every time a student benefits from your work beyond your own classroom.",
            accent: "#06b6d4",
        },
        {
            icon: "📦", label: "BULK UPLOADERS", title: "Students With Large Archives",
            body: "Have folders of materials from multiple courses across multiple years? Bulk upload and price each item individually. Sellers who start with 50+ documents see compounding visibility effects within the first academic month.",
            accent: "#ec4899",
        },
        {
            icon: "🎯", label: "BOUNTY HUNTERS", title: "On-Demand Fulfillers",
            body: "Some sellers focus entirely on the Bounty Board — checking daily for high-reward requests and fulfilling them on demand. If you can source or create materials quickly, bounty-focused selling can earn you ₦50,000+ per week.",
            accent: PURPLEL,
        },
    ];

    return (
        <section id="who-qualifies" style={{ background: DARK, padding: "88px 40px" }}>
            <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "10px" }}>
                    <div style={{ width: "4px", height: "28px", background: `linear-gradient(180deg, ${PURPLE}, ${LIME})` }} />
                    <p style={{ fontSize: "10px", fontWeight: 700, letterSpacing: ".2em", textTransform: "uppercase", color: PURPLEL, fontFamily: "'Space Grotesk',sans-serif" }}>Who Should Sell on LAN?</p>
                </div>
                <h2 style={{ fontFamily: "'Syne',sans-serif", fontSize: "clamp(28px,4vw,56px)", fontWeight: 800, color: WHITE, lineHeight: 1.0, marginBottom: "16px", letterSpacing: "-.03em" }}>
                    You Qualify If<br /><span style={{ color: LIME }}>You Have Knowledge.</span>
                </h2>
                <p style={{ fontSize: "15px", color: MUTED, lineHeight: 1.85, maxWidth: "580px", marginBottom: "52px", fontFamily: "'Space Grotesk',sans-serif" }}>
                    LAN is not a freelance marketplace. You don't bid on gigs. You upload your existing academic materials and earn passively from every student who benefits. Here's who's already winning on the Seller Network.
                </p>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))", gap: "1px", background: "rgba(124,58,237,.12)" }}>
                    {profiles.map((f) => (
                        <div key={f.title}
                            style={{
                                background: DARK, padding: "32px 28px",
                                borderTop: `3px solid transparent`,
                                transition: "border-color .15s, background .15s", cursor: "default",
                            }}
                            onMouseEnter={e => { e.currentTarget.style.borderTopColor = f.accent; e.currentTarget.style.background = DARK2; }}
                            onMouseLeave={e => { e.currentTarget.style.borderTopColor = "transparent"; e.currentTarget.style.background = DARK; }}
                        >
                            <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
                                <span style={{ fontSize: "24px" }}>{f.icon}</span>
                                <span style={{ fontSize: "9px", fontWeight: 700, letterSpacing: ".18em", textTransform: "uppercase", color: f.accent, fontFamily: "'Space Grotesk',sans-serif" }}>{f.label}</span>
                            </div>
                            <h3 style={{ fontFamily: "'Syne',sans-serif", fontSize: "20px", fontWeight: 700, color: WHITE, marginBottom: "12px", letterSpacing: "-.02em" }}>{f.title}</h3>
                            <p style={{ fontSize: "13px", color: MUTED, lineHeight: 1.85, fontFamily: "'Space Grotesk',sans-serif" }}>{f.body}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

/* ═══════════════════════════════════════════════════════════════
   HOW IT WORKS
═══════════════════════════════════════════════════════════════ */
function HowItWorks() {
    const steps = [
        { num: "1", icon: "👤", title: "Create Your Seller Account", body: "Sign up with your student or institutional email in under 3 minutes. Verify your identity and institution. Your seller profile is your permanent storefront — it never expires and stays live as long as you want." },
        { num: "2", icon: "📤", title: "Upload Your First Document", body: "Upload any academic document — PDF, Word, or image-based scans. Set your price, add course codes and tags, select the university and department. Rich metadata = more visibility in search results = more sales." },
        { num: "3", icon: "🔍", title: "LAN Reviews & Approves", body: "Our team reviews every submission within 48 hours for quality, accuracy, and relevance. Documents that meet our standards go live instantly. You receive in-app and email notification on approval." },
        { num: "4", icon: "📡", title: "Your Document Goes Live", body: "Once live, your document is indexed across LAN, promoted in relevant university search feeds, and visible to 40,000+ active students. The LAN algorithm continuously boosts documents that accumulate downloads and positive reviews — early quality signals compound over time." },
        { num: "5", icon: "💸", title: "Students Buy. You Earn Instantly.", body: "80% of every sale price goes directly to your LAN wallet the moment the transaction clears — no waiting, no thresholds. Price a document at ₦2,000 and earn ₦1,600 per sale. Sell 100 copies: ₦160,000 from a single upload." },
        { num: "6", icon: "🏦", title: "Withdraw to Your Bank or Mobile Money", body: "Withdraw your wallet balance to any Nigerian bank account or mobile money wallet at any time. Minimum withdrawal is ₦1,000. Transfers are processed within 24 hours on business days — no hidden fees." },
    ];

    return (
        <section id="how-it-works" style={{ background: DARK2, padding: "88px 40px" }}>
            <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "10px" }}>
                    <div style={{ width: "4px", height: "28px", background: `linear-gradient(180deg, ${PURPLE}, ${LIME})` }} />
                    <p style={{ fontSize: "10px", fontWeight: 700, letterSpacing: ".2em", textTransform: "uppercase", color: PURPLEL, fontFamily: "'Space Grotesk',sans-serif" }}>Step-by-Step</p>
                </div>
                <h2 style={{ fontFamily: "'Syne',sans-serif", fontSize: "clamp(28px,4vw,52px)", fontWeight: 800, color: WHITE, lineHeight: 1.0, marginBottom: "52px", letterSpacing: "-.03em" }}>
                    From First Upload<br /><span style={{ color: LIME }}>to First Withdrawal.</span>
                </h2>
                <div style={{ position: "relative" }}>
                    <div style={{ position: "absolute", left: "22px", top: "28px", bottom: "28px", width: "2px", background: "rgba(124,58,237,.2)" }} className="lan-step-line" />
                    {steps.map((s, i) => (
                        <div key={s.num} style={{ display: "flex", gap: "28px", alignItems: "flex-start", padding: "20px 0" }}>
                            <div style={{
                                width: "44px", height: "44px", borderRadius: "50%",
                                background: i === 0 || i === steps.length - 1 ? PURPLE : DARK,
                                border: `2px solid ${PURPLE}`,
                                display: "flex", alignItems: "center", justifyContent: "center",
                                fontSize: "14px", fontWeight: 800, color: WHITE, flexShrink: 0,
                                fontFamily: "'Syne',sans-serif", zIndex: 2, position: "relative",
                            }}>{s.num}</div>
                            <div style={{ flex: 1, paddingTop: "8px" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
                                    <span style={{ fontSize: "18px" }}>{s.icon}</span>
                                    <h3 style={{ fontFamily: "'Syne',sans-serif", fontSize: "18px", fontWeight: 700, color: WHITE, letterSpacing: "-.01em" }}>{s.title}</h3>
                                </div>
                                <p style={{ fontSize: "13px", color: MUTED, lineHeight: 1.85, maxWidth: "600px", fontFamily: "'Space Grotesk',sans-serif" }}>{s.body}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            <style>{`@media(max-width:768px){ .lan-step-line{ display:none !important; } }`}</style>
        </section>
    );
}

/* ═══════════════════════════════════════════════════════════════
   UPLOAD ONCE EARN FOREVER — Compounding Algorithm
═══════════════════════════════════════════════════════════════ */
function CompoundingModel() {
    return (
        <section style={{ background: VOID, padding: "88px 40px" }}>
            <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "56px", alignItems: "start" }} className="lan-compound-grid">
                    {/* Left */}
                    <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "10px" }}>
                            <div style={{ width: "4px", height: "28px", background: `linear-gradient(180deg, ${PURPLE}, ${LIME})` }} />
                            <p style={{ fontSize: "10px", fontWeight: 700, letterSpacing: ".2em", textTransform: "uppercase", color: PURPLEL, fontFamily: "'Space Grotesk',sans-serif" }}>The Core Model</p>
                        </div>
                        <h2 style={{ fontFamily: "'Syne',sans-serif", fontSize: "clamp(28px,4vw,52px)", fontWeight: 800, color: WHITE, lineHeight: 1.0, marginBottom: "20px", letterSpacing: "-.03em" }}>
                            Upload Once.<br /><span style={{ color: LIME }}>Earn Forever.</span>
                        </h2>
                        <p style={{ fontSize: "15px", color: MUTED, lineHeight: 1.9, marginBottom: "28px", fontFamily: "'Space Grotesk',sans-serif" }}>
                            Unlike freelancing where you trade time for money, LAN's model is fundamentally different. Every document you upload becomes a permanent, compounding asset that earns passively with no additional effort.
                        </p>
                        {[
                            ["📈", "Compounding Search Authority", "Early downloads and positive reviews feed LAN's algorithm. Documents that perform well in their first semester gain permanent ranking authority — staying visible and profitable for semesters to come, long after you've stopped thinking about them."],
                            ["🔄", "Seasonal Re-Activation", "Past questions re-surge in demand every exam period. A document you uploaded 2 years ago gets a fresh wave of buyers every semester without you lifting a finger. Your catalogue grows in value the older it gets."],
                            ["🌍", "Cross-University Reach", "A lecture note from OAU Engineering reaches students at FUTA, UNILAG, and ABU who study similar courses. LAN's algorithm surfaces your content to students who need it — regardless of where you studied."],
                        ].map(([ico, title, body]) => (
                            <div key={title} style={{ display: "flex", gap: "14px", marginBottom: "22px", alignItems: "flex-start" }}>
                                <div style={{ width: "32px", height: "32px", background: "rgba(163,230,53,.1)", border: "1px solid rgba(163,230,53,.25)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px", flexShrink: 0, marginTop: "2px" }}>{ico}</div>
                                <div>
                                    <div style={{ fontSize: "14px", fontWeight: 700, color: WHITE, marginBottom: "4px", fontFamily: "'Space Grotesk',sans-serif" }}>{title}</div>
                                    <div style={{ fontSize: "12px", color: MUTED, fontFamily: "'Space Grotesk',sans-serif", lineHeight: 1.75 }}>{body}</div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Right: compounding visual */}
                    <div>
                        <div style={{ background: DARK, border: "1px solid rgba(163,230,53,.2)", overflow: "hidden" }}>
                            <div style={{ background: DARK2, padding: "14px 20px", borderBottom: "1px solid rgba(163,230,53,.15)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                <span style={{ fontSize: "11px", fontWeight: 700, color: WHITE, fontFamily: "'Space Grotesk',sans-serif" }}>Catalogue Earnings Over Time</span>
                                <span style={{ fontSize: "9px", color: LIME, fontWeight: 700, fontFamily: "'Space Grotesk',sans-serif" }}>● COMPOUNDING</span>
                            </div>
                            <div style={{ padding: "24px" }}>
                                {[
                                    { month: "Month 1", docs: "10 docs", earn: "₦18,000", bar: 9, note: "Building momentum" },
                                    { month: "Month 3", docs: "25 docs", earn: "₦52,000", bar: 26, note: "Algorithm picks up" },
                                    { month: "Month 6", docs: "40 docs", earn: "₦120,000", bar: 60, note: "Seasonal exam surge" },
                                    { month: "Month 12", docs: "60 docs", earn: "₦240,000", bar: 100, note: "Compounding authority" },
                                ].map(r => (
                                    <div key={r.month} style={{ marginBottom: "18px" }}>
                                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                                            <div>
                                                <span style={{ fontSize: "12px", fontWeight: 700, color: WHITE, fontFamily: "'Space Grotesk',sans-serif" }}>{r.month}</span>
                                                <span style={{ fontSize: "10px", color: MUTED, marginLeft: "8px", fontFamily: "'Space Grotesk',sans-serif" }}>{r.docs}</span>
                                            </div>
                                            <div style={{ textAlign: "right" }}>
                                                <span style={{ fontFamily: "'Syne',sans-serif", fontSize: "14px", fontWeight: 700, color: LIME }}>{r.earn}</span>
                                                <div style={{ fontSize: "9px", color: MUTED, fontFamily: "'Space Grotesk',sans-serif" }}>{r.note}</div>
                                            </div>
                                        </div>
                                        <div style={{ height: "6px", background: "rgba(248,248,255,.06)", position: "relative" }}>
                                            <div style={{ position: "absolute", top: 0, left: 0, height: "100%", width: `${r.bar}%`, background: `linear-gradient(90deg, ${PURPLE}, ${LIME})`, transition: "width .4s" }} />
                                        </div>
                                    </div>
                                ))}
                                <div style={{ marginTop: "20px", padding: "16px", background: "rgba(163,230,53,.06)", border: "1px solid rgba(163,230,53,.15)" }}>
                                    <div style={{ fontSize: "10px", fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", color: LIME, marginBottom: "6px", fontFamily: "'Space Grotesk',sans-serif" }}>The Compounding Effect</div>
                                    <div style={{ fontSize: "12px", color: MUTED, lineHeight: 1.75, fontFamily: "'Space Grotesk',sans-serif" }}>Each new upload adds to your authority. Each review boosts visibility. Each semester brings new buyers for old documents. Your income grows even when you don't add new content.</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <style>{`@media(max-width:900px){ .lan-compound-grid{ grid-template-columns:1fr !important; } }`}</style>
        </section>
    );
}

/* ═══════════════════════════════════════════════════════════════
   EARNINGS ENGINE
═══════════════════════════════════════════════════════════════ */
function EarningsEngine() {
    return (
        <section id="earnings" style={{ background: DARK, padding: "88px 40px" }}>
            <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "10px" }}>
                    <div style={{ width: "4px", height: "28px", background: `linear-gradient(180deg, ${PURPLE}, ${LIME})` }} />
                    <p style={{ fontSize: "10px", fontWeight: 700, letterSpacing: ".2em", textTransform: "uppercase", color: PURPLEL, fontFamily: "'Space Grotesk',sans-serif" }}>Revenue Model</p>
                </div>
                <h2 style={{ fontFamily: "'Syne',sans-serif", fontSize: "clamp(28px,4vw,52px)", fontWeight: 800, color: WHITE, lineHeight: 1.0, marginBottom: "20px", letterSpacing: "-.03em" }}>
                    Three Ways<br /><span style={{ color: LIME }}>Money Flows to You.</span>
                </h2>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))", gap: "1px", background: "rgba(124,58,237,.12)", marginBottom: "32px" }}>
                    {[
                        {
                            badge: "💰 Stream 1", title: "Document Sales", sub: "Passive Income",
                            body: "Upload once, earn indefinitely. 80% of every sale price goes directly to your LAN wallet the moment a transaction clears. You set the price. LAN handles discovery, payment processing, and delivery.",
                            amount: "₦1,600", amountSub: "per ₦2,000 sale", accent: LIME,
                        },
                        {
                            badge: "🎯 Stream 2", title: "Bounty Board Rewards", sub: "Active Income",
                            body: "Students post paid requests for specific materials. You claim the bounty, upload the matching document, and earn the full escrow reward once the student confirms receipt. Bounties range from ₦500 to ₦500,000.",
                            amount: "₦400 – ₦400k", amountSub: "per bounty", accent: PURPLE,
                        },
                        {
                            badge: "🔗 Stream 3", title: "Referral Commissions", sub: "Compounding Passive",
                            body: "Share your unique referral link. Earn every time someone you refer makes a purchase or upload. Build a referral network and create passive income layered on top of your document earnings.",
                            amount: "₦500+", amountSub: "per qualified referral", accent: "#f59e0b",
                        },
                    ].map(s => (
                        <div key={s.title}
                            style={{ background: DARK, padding: "32px 28px", borderTop: `3px solid ${s.accent}`, transition: "background .15s" }}
                            onMouseEnter={e => e.currentTarget.style.background = DARK2}
                            onMouseLeave={e => e.currentTarget.style.background = DARK}
                        >
                            <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "rgba(124,58,237,.15)", border: "1px solid rgba(124,58,237,.25)", padding: "4px 12px", fontSize: "9px", fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", color: PURPLEL, marginBottom: "16px", fontFamily: "'Space Grotesk',sans-serif" }}>{s.badge}</div>
                            <div style={{ fontFamily: "'Syne',sans-serif", fontSize: "22px", fontWeight: 700, color: WHITE, marginBottom: "4px" }}>{s.title}</div>
                            <div style={{ fontSize: "9px", fontWeight: 700, letterSpacing: ".14em", textTransform: "uppercase", color: s.accent, marginBottom: "14px", fontFamily: "'Space Grotesk',sans-serif" }}>{s.sub}</div>
                            <div style={{ fontSize: "13px", color: MUTED, lineHeight: 1.8, fontFamily: "'Space Grotesk',sans-serif", marginBottom: "20px" }}>{s.body}</div>
                            <div style={{ fontFamily: "'Syne',sans-serif", fontSize: "28px", fontWeight: 800, color: s.accent }}>{s.amount} <span style={{ fontSize: "12px", color: MUTED, fontFamily: "'Space Grotesk',sans-serif" }}>{s.amountSub}</span></div>
                        </div>
                    ))}
                </div>

                {/* Monthly breakdown callout */}
                <div style={{ background: DARK2, border: "1px solid rgba(124,58,237,.2)", padding: "36px" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "40px", alignItems: "start" }} className="lan-breakdown-grid">
                        <div>
                            <div style={{ fontSize: "10px", fontWeight: 700, letterSpacing: ".16em", textTransform: "uppercase", color: PURPLEL, marginBottom: "16px", fontFamily: "'Space Grotesk',sans-serif" }}>Revenue Breakdown — Example Month</div>
                            {[
                                ["30 document sales @ avg ₦1,500", "₦45,000", WHITE],
                                ["LAN platform fee (20%)", "– ₦9,000", "#f87171"],
                                ["Your net from sales", "₦36,000", "#86efac"],
                                ["2 bounty fulfilments @ ₦15k avg", "₦24,000", "#86efac"],
                                ["5 referral commissions", "₦2,500", "#86efac"],
                            ].map(([k, v, c]) => (
                                <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid rgba(248,248,255,.06)", fontSize: "12px", fontFamily: "'Space Grotesk',sans-serif" }}>
                                    <span style={{ color: MUTED }}>{k}</span>
                                    <span style={{ fontWeight: 700, color: c }}>{v}</span>
                                </div>
                            ))}
                            <div style={{ height: "1px", background: `rgba(163,230,53,.2)`, margin: "14px 0" }} />
                            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "14px", fontFamily: "'Space Grotesk',sans-serif" }}>
                                <span style={{ color: WHITE, fontWeight: 700 }}>Total Monthly Income</span>
                                <span style={{ fontFamily: "'Syne',sans-serif", fontSize: "20px", fontWeight: 800, color: LIME }}>₦62,500</span>
                            </div>
                            <div style={{ height: "6px", background: "rgba(248,248,255,.06)", margin: "12px 0 4px", position: "relative" }}>
                                <div style={{ position: "absolute", top: 0, left: 0, height: "100%", width: "80%", background: `linear-gradient(90deg, ${PURPLE}, ${LIME})` }} />
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "9px", fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", fontFamily: "'Space Grotesk',sans-serif" }}>
                                <span style={{ color: "rgba(163,230,53,.6)" }}>YOUR SHARE 80%</span>
                                <span style={{ color: "rgba(248,248,255,.2)" }}>LAN 20%</span>
                            </div>
                        </div>
                        <div>
                            <div style={{ fontSize: "10px", fontWeight: 700, letterSpacing: ".16em", textTransform: "uppercase", color: LIME, marginBottom: "12px", fontFamily: "'Space Grotesk',sans-serif" }}>Power Seller Potential</div>
                            <p style={{ fontSize: "14px", color: MUTED, lineHeight: 1.9, marginBottom: "16px", fontFamily: "'Space Grotesk',sans-serif" }}>
                                Top sellers maintain catalogues of <span style={{ color: WHITE, fontWeight: 700 }}>200+ documents</span> across multiple departments. With diverse, well-tagged content, a single seller can earn <span style={{ color: LIME, fontWeight: 700 }}>₦500,000 – ₦2,000,000 per month</span> from passive document sales alone.
                            </p>
                            <p style={{ fontSize: "14px", color: MUTED, lineHeight: 1.9, fontFamily: "'Space Grotesk',sans-serif" }}>
                                The key insight: <span style={{ color: WHITE, fontWeight: 700 }}>each upload compounds.</span> Your catalogue grows, search visibility increases, and your monthly income scales without proportionally increasing your effort.
                            </p>
                            <div style={{ marginTop: "24px", padding: "20px", background: "rgba(163,230,53,.06)", border: "1px solid rgba(163,230,53,.15)" }}>
                                <div style={{ fontFamily: "'Syne',sans-serif", fontSize: "36px", fontWeight: 800, color: LIME }}>₦200,000</div>
                                <div style={{ fontSize: "9px", fontWeight: 700, letterSpacing: ".14em", textTransform: "uppercase", color: MUTED, fontFamily: "'Space Grotesk',sans-serif" }}>Average top seller monthly income</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <style>{`@media(max-width:768px){ .lan-breakdown-grid{ grid-template-columns:1fr !important; } }`}</style>
        </section>
    );
}

/* ═══════════════════════════════════════════════════════════════
   ANALYTICS DASHBOARD FEATURE
═══════════════════════════════════════════════════════════════ */
function AnalyticsDashboard() {
    return (
        <section style={{ background: VOID, padding: "88px 40px" }}>
            <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "56px", alignItems: "start" }} className="lan-analytics-grid">
                    {/* Left: mock dashboard */}
                    <div>
                        <div style={{ background: DARK, border: "1px solid rgba(124,58,237,.3)", overflow: "hidden" }}>
                            <div style={{ background: DARK2, padding: "14px 20px", borderBottom: "1px solid rgba(124,58,237,.2)", display: "flex", alignItems: "center", gap: "10px" }}>
                                <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#ef4444", display: "inline-block" }} />
                                <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#f59e0b", display: "inline-block" }} />
                                <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: LIME, display: "inline-block" }} />
                                <span style={{ fontSize: "11px", color: MUTED, fontFamily: "'Space Grotesk',sans-serif", marginLeft: "8px" }}>Seller Analytics Dashboard</span>
                                <span style={{ marginLeft: "auto", fontSize: "9px", color: LIME, fontWeight: 700, fontFamily: "'Space Grotesk',sans-serif" }}>● LIVE</span>
                            </div>
                            {/* Revenue row */}
                            <div style={{ padding: "16px 20px", borderBottom: "1px solid rgba(248,248,255,.05)", display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }} className="lan-revenue-row">                                {[["₦38,400", "This Month"], ["₦12,600", "This Week"], ["₦1,200", "Today"]].map(([v, l]) => (
                                    <div key={l} style={{ background: DARK2, padding: "12px 14px" }}>
                                        <div style={{ fontFamily: "'Syne',sans-serif", fontSize: "16px", fontWeight: 800, color: LIME }}>{v}</div>
                                        <div style={{ fontSize: "9px", fontWeight: 700, color: MUTED, letterSpacing: ".1em", textTransform: "uppercase", fontFamily: "'Space Grotesk',sans-serif" }}>{l}</div>
                                    </div>
                                ))}
                            </div>
                            {/* Trending searches */}
                            <div style={{ padding: "16px 20px", borderBottom: "1px solid rgba(248,248,255,.05)" }}>
                                <div style={{ fontSize: "9px", fontWeight: 700, letterSpacing: ".14em", textTransform: "uppercase", color: PURPLEL, marginBottom: "12px", fontFamily: "'Space Grotesk',sans-serif" }}>🔥 What Students Are Searching For Right Now</div>
                                {[
                                    ["UNILAG Medicine • Past Questions 2023", "847 searches", 95],
                                    ["OAU Engineering Structural Analysis", "612 searches", 72],
                                    ["ABU Law • Constitutional Law Notes", "489 searches", 58],
                                    ["FUTA CS • Data Structures Slides", "371 searches", 44],
                                ].map(([term, count, pct]) => (
                                    <div key={term} style={{ marginBottom: "10px" }}>
                                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                                            <span style={{ fontSize: "11px", color: WHITE, fontFamily: "'Space Grotesk',sans-serif" }}>{term}</span>
                                            <span style={{ fontSize: "10px", color: LIME, fontWeight: 700, fontFamily: "'Space Grotesk',sans-serif" }}>{count}</span>
                                        </div>
                                        <div style={{ height: "3px", background: "rgba(248,248,255,.06)" }}>
                                            <div style={{ height: "100%", width: `${pct}%`, background: `linear-gradient(90deg, ${PURPLE}, ${LIME})` }} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                            {/* Top performing docs */}
                            <div style={{ padding: "16px 20px" }}>
                                <div style={{ fontSize: "9px", fontWeight: 700, letterSpacing: ".14em", textTransform: "uppercase", color: PURPLEL, marginBottom: "12px", fontFamily: "'Space Grotesk',sans-serif" }}>📄 Your Top Earning Documents</div>
                                {[
                                    ["MBBS Final Year Past Questions 2018–2023", "92 sales", "₦147,200"],
                                    ["Structural Engineering Lecture Notes 400L", "54 sales", "₦54,000"],
                                    ["Constitutional Law Case Summaries", "31 sales", "₦24,800"],
                                ].map(([title, sales, earn]) => (
                                    <div key={title} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 0", borderBottom: "1px solid rgba(248,248,255,.04)" }}>
                                        <div>
                                            <div style={{ fontSize: "11px", fontWeight: 600, color: WHITE, fontFamily: "'Space Grotesk',sans-serif" }}>{title}</div>
                                            <div style={{ fontSize: "9px", color: MUTED, fontFamily: "'Space Grotesk',sans-serif" }}>{sales}</div>
                                        </div>
                                        <div style={{ fontFamily: "'Syne',sans-serif", fontSize: "13px", fontWeight: 700, color: LIME }}>{earn}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Right: text */}
                    <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "10px" }}>
                            <div style={{ width: "4px", height: "28px", background: `linear-gradient(180deg, ${PURPLE}, ${LIME})` }} />
                            <p style={{ fontSize: "10px", fontWeight: 700, letterSpacing: ".2em", textTransform: "uppercase", color: PURPLEL, fontFamily: "'Space Grotesk',sans-serif" }}>The Analytics Advantage</p>
                        </div>
                        <h2 style={{ fontFamily: "'Syne',sans-serif", fontSize: "clamp(28px,4vw,48px)", fontWeight: 800, color: WHITE, lineHeight: 1.0, marginBottom: "20px", letterSpacing: "-.03em" }}>
                            Know What<br /><span style={{ color: LIME }}>Students Need Before They Ask.</span>
                        </h2>
                        <p style={{ fontSize: "15px", color: MUTED, lineHeight: 1.9, marginBottom: "28px", fontFamily: "'Space Grotesk',sans-serif" }}>
                            Your Seller Dashboard doesn't just show you what you've earned — it shows you what the market is actively searching for, so you can create materials that match real, live demand.
                        </p>
                        {[
                            ["📊", "Real-Time Search Intelligence", "See exactly what course codes, universities, and document types students are searching for right now. Create what the market needs before your competitors do."],
                            ["💸", "Instant Earnings Notifications", "Every sale triggers an immediate in-app and email notification. You always know the exact moment money lands in your wallet — no delays, no guessing."],
                            ["📈", "Document Performance Analytics", "See which documents earn the most, which are trending this semester, and which underperform — so you can price, promote, and optimise your catalogue."],
                            ["🎯", "Bounty Board Alerts", "Set custom alerts for new bounties in your subject area or university. Get notified the moment a high-reward request is posted that matches what you can fulfil."],
                        ].map(([ico, title, body]) => (
                            <div key={title} style={{ display: "flex", gap: "14px", marginBottom: "18px", alignItems: "flex-start" }}>
                                <div style={{ fontSize: "20px", width: "36px", textAlign: "center", flexShrink: 0 }}>{ico}</div>
                                <div>
                                    <div style={{ fontSize: "13px", fontWeight: 700, color: WHITE, marginBottom: "2px", fontFamily: "'Space Grotesk',sans-serif" }}>{title}</div>
                                    <div style={{ fontSize: "12px", color: MUTED, fontFamily: "'Space Grotesk',sans-serif", lineHeight: 1.7 }}>{body}</div>
                                </div>
                            </div>
                        ))}
                        <Link href="/auth/signup" style={{
                            display: "inline-flex", alignItems: "center", gap: "8px",
                            marginTop: "12px", padding: "13px 28px", background: PURPLE, color: WHITE,
                            fontSize: "11px", fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase",
                            textDecoration: "none", fontFamily: "'Space Grotesk',sans-serif", transition: "background .15s",
                        }}
                            onMouseEnter={e => e.currentTarget.style.background = PURPLED}
                            onMouseLeave={e => e.currentTarget.style.background = PURPLE}
                        >Access Your Dashboard →</Link>
                    </div>
                </div>
            </div>
            <style>{`
  @media(max-width:900px){ .lan-analytics-grid{ grid-template-columns:1fr !important; } }
  @media(max-width:600px){ .lan-revenue-row{ grid-template-columns:1fr !important; } }
`}</style>
        </section>
    );
}

/* ═══════════════════════════════════════════════════════════════
   BOUNTY BOARD
═══════════════════════════════════════════════════════════════ */
function BountyBoard() {
    const bounties = [
        { school: "UNILAG", dept: "Medicine • 500L", title: "MBBS Final Year Past Questions 2019–2023", reward: "₦15,000", status: "🔥 Hot", statusColor: "#ef4444" },
        { school: "OAU", dept: "Engineering • 400L", title: "Structural Analysis II Lecture Notes", reward: "₦8,500", status: "⏳ Open", statusColor: "#f59e0b" },
        { school: "ABU", dept: "Law • 300L", title: "Constitutional Law Detailed Course Outline", reward: "₦6,000", status: "🆕 New", statusColor: LIME },
        { school: "UI", dept: "Economics • 200L", title: "Microeconomics Tutorial Questions 2020–2022", reward: "₦4,500", status: "⏳ Open", statusColor: "#f59e0b" },
        { school: "FUTA", dept: "CS • 300L", title: "Data Structures & Algorithms Full Lecture Slides", reward: "₦7,200", status: "🔥 Hot", statusColor: "#ef4444" },
    ];

    return (
        <section style={{ background: DARK, padding: "88px 40px" }}>
            <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "56px", alignItems: "start" }} className="lan-bounty-grid">
                    <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "10px" }}>
                            <div style={{ width: "4px", height: "28px", background: `linear-gradient(180deg, ${PURPLE}, ${LIME})` }} />
                            <p style={{ fontSize: "10px", fontWeight: 700, letterSpacing: ".2em", textTransform: "uppercase", color: PURPLEL, fontFamily: "'Space Grotesk',sans-serif" }}>Bounty Board</p>
                        </div>
                        <h2 style={{ fontFamily: "'Syne',sans-serif", fontSize: "clamp(28px,4vw,52px)", fontWeight: 800, color: WHITE, lineHeight: 1.0, marginBottom: "20px", letterSpacing: "-.03em" }}>
                            Get Paid to<br /><span style={{ color: LIME }}>Fill Requests.</span>
                        </h2>
                        <p style={{ fontSize: "15px", color: MUTED, lineHeight: 1.9, marginBottom: "28px", fontFamily: "'Space Grotesk',sans-serif" }}>
                            The Bounty Board is a live request marketplace. Students post exactly what they need with a reward attached — and verified sellers race to fulfil it. Top bounty hunters earn ₦50,000+ per week.
                        </p>
                        {[
                            ["Browse Live Requests", "Filter by reward tier, university, or department to find bounties you can fulfil."],
                            ["Claim & Upload", "Submit the exact document requested. The student reviews and confirms receipt."],
                            ["Earn From Escrow", "LAN releases the reward to your wallet instantly on confirmation. No disputes, no delays."],
                        ].map(([t, b]) => (
                            <div key={t} style={{ display: "flex", gap: "14px", marginBottom: "18px", alignItems: "flex-start" }}>
                                <div style={{ width: "28px", height: "28px", background: "rgba(163,230,53,.15)", border: "1px solid rgba(163,230,53,.3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", flexShrink: 0, marginTop: "2px" }}>✓</div>
                                <div>
                                    <div style={{ fontSize: "14px", fontWeight: 700, color: WHITE, marginBottom: "3px", fontFamily: "'Space Grotesk',sans-serif" }}>{t}</div>
                                    <div style={{ fontSize: "12px", color: MUTED, fontFamily: "'Space Grotesk',sans-serif" }}>{b}</div>
                                </div>
                            </div>
                        ))}
                        <Link href="/academic/bounty/board" style={{
                            display: "inline-flex", alignItems: "center", gap: "8px",
                            marginTop: "12px", padding: "13px 28px", background: PURPLE, color: WHITE,
                            fontSize: "11px", fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase",
                            textDecoration: "none", fontFamily: "'Space Grotesk',sans-serif", transition: "background .15s",
                        }}
                            onMouseEnter={e => e.currentTarget.style.background = PURPLED}
                            onMouseLeave={e => e.currentTarget.style.background = PURPLE}
                        >View Live Bounties →</Link>
                    </div>
                    <div>
                        <div style={{ background: DARK2, border: "1px solid rgba(124,58,237,.3)", overflow: "hidden" }}>
                            <div style={{ background: VOID, padding: "14px 20px", borderBottom: "1px solid rgba(124,58,237,.2)", display: "flex", alignItems: "center", gap: "10px" }}>
                                <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#ef4444", display: "inline-block" }} />
                                <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#f59e0b", display: "inline-block" }} />
                                <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: LIME, display: "inline-block" }} />
                                <span style={{ fontSize: "11px", color: MUTED, fontFamily: "'Space Grotesk',sans-serif", marginLeft: "8px" }}>Live Bounty Board</span>
                            </div>
                            {bounties.map((b) => (
                                <div key={b.title}
                                    style={{ padding: "16px 20px", borderBottom: "1px solid rgba(248,248,255,.05)", transition: "background .15s", cursor: "pointer" }}
                                    onMouseEnter={e => e.currentTarget.style.background = "rgba(124,58,237,.08)"}
                                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                                >
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px" }}>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ display: "flex", gap: "6px", marginBottom: "6px", flexWrap: "wrap" }}>
                                                <span style={{ fontSize: "9px", fontWeight: 700, letterSpacing: ".1em", background: "rgba(124,58,237,.2)", color: PURPLEL, padding: "2px 8px", fontFamily: "'Space Grotesk',sans-serif" }}>{b.school}</span>
                                                <span style={{ fontSize: "9px", fontWeight: 700, letterSpacing: ".08em", color: MUTED, padding: "2px 4px", fontFamily: "'Space Grotesk',sans-serif" }}>{b.dept}</span>
                                            </div>
                                            <div style={{ fontSize: "12px", fontWeight: 600, color: WHITE, lineHeight: 1.4, fontFamily: "'Space Grotesk',sans-serif" }}>{b.title}</div>
                                        </div>
                                        <div style={{ textAlign: "right", flexShrink: 0 }}>
                                            <div style={{ fontFamily: "'Syne',sans-serif", fontSize: "16px", fontWeight: 800, color: LIME }}>{b.reward}</div>
                                            <div style={{ fontSize: "9px", fontWeight: 700, color: b.statusColor, fontFamily: "'Space Grotesk',sans-serif", marginTop: "2px" }}>{b.status}</div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            <div style={{ padding: "14px 20px", background: "rgba(124,58,237,.1)", textAlign: "center", fontSize: "11px", color: PURPLEL, fontFamily: "'Space Grotesk',sans-serif", fontWeight: 600, cursor: "pointer" }}>
                                View all 2,400+ active bounties →
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <style>{`@media(max-width:900px){ .lan-bounty-grid{ grid-template-columns:1fr !important; } }`}</style>
        </section>
    );
}

/* ═══════════════════════════════════════════════════════════════
   SELLER TIERS
═══════════════════════════════════════════════════════════════ */
function Tiers() {
    const tiers = [
        {
            crown: "🥉", name: "Bronze", range: "₦0 – ₦4,999 earned", accent: "#cd7f32",
            features: ["Up to 20 documents", "Standard search placement", "Basic analytics dashboard", "Community support", "Seller badge"],
        },
        {
            crown: "🥈", name: "Silver", range: "₦5,000 – ₦19,999 earned", accent: "#94a3b8",
            features: ["Up to 100 documents", "Boosted search ranking", "Trend analytics", "Bounty Board access", "Priority review queue", "Department feed features"],
        },
        {
            crown: "🥇", name: "Gold", range: "₦20,000 – ₦49,999 earned", accent: LIME, featured: true, badge: "Most Sellers",
            features: ["Unlimited uploads", "Premium search placement", "Advanced revenue analytics", "High-value bounty access (₦5k+)", "Same-day withdrawal processing", "Dedicated support line", "Homepage featured slots", "Referral bonus upgrades"],
        },
        {
            crown: "💎", name: "Platinum", range: "₦50,000+ earned", accent: PURPLEL, dark: true,
            features: ["Unlimited uploads, zero queue", "Top-of-search permanently", "Personal account manager", "Instant withdrawal, no limits", "Exclusive platinum bounties (₦50k+)", "Co-branded seller page", "Early access to new features", "LAN Creators Programme invite"],
        },
    ];

    return (
        <section id="tiers" style={{ background: DARK2, padding: "88px 40px" }}>
            <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "10px" }}>
                    <div style={{ width: "4px", height: "28px", background: `linear-gradient(180deg, ${PURPLE}, ${LIME})` }} />
                    <p style={{ fontSize: "10px", fontWeight: 700, letterSpacing: ".2em", textTransform: "uppercase", color: PURPLEL, fontFamily: "'Space Grotesk',sans-serif" }}>Seller Tiers</p>
                </div>
                <h2 style={{ fontFamily: "'Syne',sans-serif", fontSize: "clamp(28px,4vw,52px)", fontWeight: 800, color: WHITE, lineHeight: 1.0, marginBottom: "16px", letterSpacing: "-.03em" }}>
                    The More You Earn,<br /><span style={{ color: LIME }}>The More You Unlock.</span>
                </h2>
                <p style={{ fontSize: "15px", color: MUTED, lineHeight: 1.85, maxWidth: "580px", marginBottom: "52px", fontFamily: "'Space Grotesk',sans-serif" }}>
                    Four tiers. As you upload, sell, and earn more — you automatically unlock greater visibility, higher limits, and exclusive privileges.
                </p>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: "1px", background: "rgba(124,58,237,.12)" }}>
                    {tiers.map(t => (
                        <div key={t.name}
                            style={{
                                background: t.dark ? VOID : DARK, padding: "28px 22px",
                                borderTop: `3px solid ${t.featured ? t.accent : "transparent"}`,
                                position: "relative", transition: "border-top-color .15s",
                            }}
                            onMouseEnter={e => { if (!t.featured) e.currentTarget.style.borderTopColor = t.accent; }}
                            onMouseLeave={e => { if (!t.featured) e.currentTarget.style.borderTopColor = "transparent"; }}
                        >
                            {t.badge && (
                                <div style={{ position: "absolute", top: "16px", right: "16px", fontSize: "9px", fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", padding: "4px 10px", background: "rgba(163,230,53,.12)", color: LIME, border: "1px solid rgba(163,230,53,.3)", fontFamily: "'Space Grotesk',sans-serif" }}>{t.badge}</div>
                            )}
                            <span style={{ fontSize: "36px", marginBottom: "14px", display: "block" }}>{t.crown}</span>
                            <div style={{ fontFamily: "'Syne',sans-serif", fontSize: "22px", fontWeight: 700, color: t.accent, marginBottom: "6px" }}>{t.name}</div>
                            <div style={{ fontSize: "10px", fontWeight: 700, letterSpacing: ".08em", color: MUTED, marginBottom: "16px", fontFamily: "'Space Grotesk',sans-serif" }}>{t.range}</div>
                            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                                {t.features.map(f => (
                                    <li key={f} style={{ fontSize: "12px", color: MUTED, padding: "7px 0", borderBottom: "1px solid rgba(248,248,255,.06)", display: "flex", alignItems: "flex-start", gap: "8px", fontFamily: "'Space Grotesk',sans-serif" }}>
                                        <span style={{ color: t.accent, fontWeight: 900, flexShrink: 0, marginTop: "1px" }}>✓</span>{f}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

/* ═══════════════════════════════════════════════════════════════
   SUCCESS STORIES / TESTIMONIALS
═══════════════════════════════════════════════════════════════ */
function SuccessStories() {
    const stories = [
        { q: "I uploaded 60 UNILAG past questions in one weekend during NYSC. Three months later I had earned ₦380,000 without lifting a finger. LAN changed my understanding of what passive income actually means.", name: "Adaeze O.", meta: "Graduate · Medicine · UNILAG", initials: "AO", stat: "₦380k", statLabel: "In 3 months" },
        { q: "I'm a lecturer and I was already writing notes for my students. Now I put those same notes on LAN and I earn ₦80,000–₦120,000 a month from students across Nigeria who never attended my class.", name: "Dr. Damilola K.", meta: "Lecturer · Economics · ABU", initials: "DK", stat: "₦100k", statLabel: "Monthly avg" },
        { q: "The Bounty Board is where I focus now. I fulfil 4–6 bounties a week. Last month I earned ₦240,000 just from bounties. It's the most reliable income I've ever had as a student.", name: "Tunde M.", meta: "Final Year · Engineering · OAU", initials: "TM", stat: "₦240k", statLabel: "1 month" },
    ];

    return (
        <section style={{ background: VOID, padding: "88px 40px" }}>
            <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "10px" }}>
                    <div style={{ width: "4px", height: "28px", background: `linear-gradient(180deg, ${PURPLE}, ${LIME})` }} />
                    <p style={{ fontSize: "10px", fontWeight: 700, letterSpacing: ".2em", textTransform: "uppercase", color: PURPLEL, fontFamily: "'Space Grotesk',sans-serif" }}>Real Results</p>
                </div>
                <h2 style={{ fontFamily: "'Syne',sans-serif", fontSize: "clamp(28px,4vw,52px)", fontWeight: 800, color: WHITE, lineHeight: 1.0, marginBottom: "52px", letterSpacing: "-.03em" }}>
                    Sellers Who Changed<br /><span style={{ color: LIME }}>Their Financial Lives.</span>
                </h2>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))", gap: "16px" }}>
                    {stories.map(s => (
                        <div key={s.name} style={{ background: DARK, padding: "28px", borderLeft: `3px solid ${PURPLE}`, position: "relative", overflow: "hidden" }}>
                            <div style={{ position: "absolute", top: "-8px", right: "16px", fontFamily: "'Syne',sans-serif", fontSize: "80px", fontWeight: 800, color: "rgba(124,58,237,.08)", lineHeight: 1, userSelect: "none" }}>"</div>
                            <p style={{ fontSize: "14px", color: "rgba(248,248,255,.75)", lineHeight: 1.8, marginBottom: "24px", fontFamily: "'Space Grotesk',sans-serif", position: "relative", zIndex: 2 }}>{s.q}</p>
                            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                <div style={{ width: "38px", height: "38px", background: "rgba(124,58,237,.25)", border: "1px solid rgba(124,58,237,.4)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: 800, color: PURPLEL, fontFamily: "'Syne',sans-serif" }}>{s.initials}</div>
                                <div>
                                    <div style={{ fontSize: "12px", fontWeight: 700, color: WHITE, fontFamily: "'Space Grotesk',sans-serif" }}>{s.name}</div>
                                    <div style={{ fontSize: "10px", color: MUTED, fontFamily: "'Space Grotesk',sans-serif" }}>{s.meta}</div>
                                </div>
                                <div style={{ marginLeft: "auto", textAlign: "right" }}>
                                    <div style={{ fontFamily: "'Syne',sans-serif", fontSize: "16px", fontWeight: 800, color: LIME }}>{s.stat}</div>
                                    <div style={{ fontSize: "9px", fontWeight: 700, color: MUTED, fontFamily: "'Space Grotesk',sans-serif", letterSpacing: ".06em", textTransform: "uppercase" }}>{s.statLabel}</div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

/* ═══════════════════════════════════════════════════════════════
   FAQ
═══════════════════════════════════════════════════════════════ */
function FAQ() {
    const [open, setOpen] = useState(null);
    const items = [
        { q: "Is it free to join the LAN Seller Network?", a: "Completely free. No joining fees, no listing fees, no monthly subscription. LAN earns only when you earn — taking 20% of each transaction. If you earn nothing, LAN earns nothing." },
        { q: "Who owns the documents I upload?", a: "You do — always. Uploading to LAN does not transfer ownership. You retain full intellectual property rights. You can withdraw and delete your documents at any time." },
        { q: "How quickly will my document be approved?", a: "Standard review takes 24–48 hours. Silver and Gold sellers benefit from priority queues with typical turnaround of 12–24 hours. Platinum sellers receive immediate review with a dedicated reviewer." },
        { q: "How do withdrawals work?", a: "Link your Nigerian bank account or mobile money wallet in your settings. Request a withdrawal at any time — minimum ₦1,000. Funds are transferred within 24 hours on business days with no withdrawal fees for Silver tier and above." },
        { q: "Can I sell documents from any Nigerian university?", a: "Yes. LAN covers 200+ universities and institutions across Nigeria and Africa. Whether your material is from UNILAG, ABU, OAU, UI, UNIBEN, FUTA, LASU, or any polytechnic — it can be listed and will reach students from that institution." },
        { q: "Can lecturers sell their course materials on LAN?", a: "Absolutely. Lecturers are among our highest-earning sellers. If you create the lecture materials yourself, you have every right to monetise them. LAN offers a Verified Faculty badge for confirmed lecturers which significantly boosts trust and conversion on your documents." },
        { q: "What happens if a student disputes a purchase?", a: "Disputes must be raised within 48 hours of purchase with a specific reason. LAN reviews every dispute fairly. Sellers with strong quality records are protected from unfair disputes. Only documents that genuinely misrepresent their content result in refunds." },
        { q: "Is there a limit to how much I can earn?", a: "No earning caps — ever. Your income is limited only by the size and quality of your catalogue, how well you tag your documents, and how actively you engage with the Bounty Board. Our top sellers have no ceiling on monthly earnings." },
    ];

    return (
        <section id="faq" style={{ background: DARK, padding: "88px 40px" }}>
            <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "10px" }}>
                    <div style={{ width: "4px", height: "28px", background: `linear-gradient(180deg, ${PURPLE}, ${LIME})` }} />
                    <p style={{ fontSize: "10px", fontWeight: 700, letterSpacing: ".2em", textTransform: "uppercase", color: PURPLEL, fontFamily: "'Space Grotesk',sans-serif" }}>FAQ</p>
                </div>
                <h2 style={{ fontFamily: "'Syne',sans-serif", fontSize: "clamp(28px,4vw,52px)", fontWeight: 800, color: WHITE, lineHeight: 1.0, marginBottom: "40px", letterSpacing: "-.03em" }}>
                    Got<br /><span style={{ color: LIME }}>Questions?</span>
                </h2>
                <div style={{ maxWidth: "740px" }}>
                    {items.map((item, i) => (
                        <div key={i} style={{ borderBottom: "1px solid rgba(248,248,255,.08)", padding: "18px 0" }}>
                            <button onClick={() => setOpen(open === i ? null : i)}
                                style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", fontSize: "14px", fontWeight: 700, color: WHITE, background: "none", border: "none", cursor: "pointer", textAlign: "left", fontFamily: "'Space Grotesk',sans-serif" }}
                            >
                                {item.q}
                                <span style={{ fontSize: "18px", color: LIME, flexShrink: 0, transition: "transform .15s", transform: open === i ? "rotate(45deg)" : "none", display: "inline-block", lineHeight: 1 }}>+</span>
                            </button>
                            {open === i && (
                                <div style={{ fontSize: "13px", color: MUTED, lineHeight: 1.9, paddingTop: "12px", fontFamily: "'Space Grotesk',sans-serif" }}>{item.a}</div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

/* ═══════════════════════════════════════════════════════════════
   OTHER NETWORKS
═══════════════════════════════════════════════════════════════ */
function OtherNetworks() {
    return (
        <section style={{ background: VOID, padding: "88px 40px" }}>
            <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "10px" }}>
                    <div style={{ width: "4px", height: "28px", background: `linear-gradient(180deg, ${PURPLE}, ${LIME})` }} />
                    <p style={{ fontSize: "10px", fontWeight: 700, letterSpacing: ".2em", textTransform: "uppercase", color: PURPLEL, fontFamily: "'Space Grotesk',sans-serif" }}>The Full Ecosystem</p>
                </div>
                <h2 style={{ fontFamily: "'Syne',sans-serif", fontSize: "clamp(28px,4vw,52px)", fontWeight: 800, color: WHITE, lineHeight: 1.0, marginBottom: "48px", letterSpacing: "-.03em" }}>
                    Explore the<br /><span style={{ color: LIME }}>Other Networks</span>
                </h2>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }} className="lan-networks-grid">
                    {[
                        { bg: "rgba(11,11,15,.9)", accent: PURPLEL, tag: "🎓 Student Network", title: "Learn Smarter. Connect Deeper.", body: "Access 128,000+ documents, join study groups, post bounty requests, and build your academic reputation across Africa.", href: "/students/network" },
                        { bg: DARK2, accent: "rgba(163,230,53,.6)", tag: "🏛️ Faculty Network", title: "Extend Your Academic Reach.", body: "Verified lecturers and professors reach students beyond their classroom and build academic authority across the continent.", href: "/faculty/network" },
                    ].map(n => (
                        <Link key={n.tag} href={n.href} style={{
                            display: "block", padding: "32px", background: n.bg,
                            textDecoration: "none", border: "1px solid rgba(248,248,255,.06)",
                            transition: "transform .15s, border-color .15s",
                        }}
                            onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.borderColor = n.accent; }}
                            onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.borderColor = "rgba(248,248,255,.06)"; }}
                        >
                            <div style={{ fontSize: "9px", fontWeight: 700, letterSpacing: ".18em", textTransform: "uppercase", color: n.accent, marginBottom: "12px", fontFamily: "'Space Grotesk',sans-serif" }}>{n.tag}</div>
                            <h3 style={{ fontFamily: "'Syne',sans-serif", fontSize: "22px", fontWeight: 700, color: WHITE, marginBottom: "10px", letterSpacing: "-.02em" }}>{n.title}</h3>
                            <p style={{ fontSize: "12px", color: MUTED, lineHeight: 1.8, marginBottom: "18px", fontFamily: "'Space Grotesk',sans-serif" }}>{n.body}</p>
                            <span style={{ fontSize: "11px", fontWeight: 700, color: n.accent, letterSpacing: ".08em", textTransform: "uppercase", fontFamily: "'Space Grotesk',sans-serif" }}>Explore →</span>
                        </Link>
                    ))}
                </div>
            </div>
            <style>{`@media(max-width:768px){ .lan-networks-grid{ grid-template-columns:1fr !important; } }`}</style>
        </section>
    );
}

/* ═══════════════════════════════════════════════════════════════
   CTA FOOTER
═══════════════════════════════════════════════════════════════ */
function CTAFooter() {
    return (
        <section style={{
            background: DARK2, padding: "100px 40px", textAlign: "center",
            position: "relative", overflow: "hidden",
        }}>
            <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: "700px", height: "700px", borderRadius: "50%", background: "radial-gradient(circle, rgba(163,230,53,.07) 0%, transparent 70%)", pointerEvents: "none" }} />
            <div style={{ position: "relative", zIndex: 2 }}>
                <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "rgba(163,230,53,.1)", border: "1px solid rgba(163,230,53,.25)", padding: "7px 18px", marginBottom: "28px" }}>
                    <span style={{ width: "6px", height: "6px", background: LIME, borderRadius: "50%", display: "inline-block", animation: "pulse 1.5s ease-in-out infinite" }} />
                    <span style={{ fontSize: "10px", fontWeight: 700, letterSpacing: ".16em", textTransform: "uppercase", color: LIME, fontFamily: "'Space Grotesk',sans-serif" }}>Free Forever · Join 2,400+ Verified Sellers</span>
                </div>
                <h2 style={{ fontFamily: "'Syne',sans-serif", fontSize: "clamp(36px,6vw,72px)", fontWeight: 800, color: WHITE, lineHeight: .95, marginBottom: "20px", letterSpacing: "-.04em" }}>
                    Your Knowledge.<br />Your <span style={{ color: LIME }}>Catalogue.</span><br />Your <span style={{ color: PURPLEL }}>Income.</span>
                </h2>
                <p style={{ fontSize: "15px", color: MUTED, maxWidth: "460px", margin: "0 auto 40px", lineHeight: 1.85, fontFamily: "'Space Grotesk',sans-serif" }}>
                    Create your free seller account in 3 minutes. Upload your first document and start earning from what you already know.
                </p>
                <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
                    <Link href="/auth/signup" style={{
                        padding: "16px 36px", background: LIME, color: VOID,
                        fontSize: "12px", fontWeight: 800, letterSpacing: ".1em", textTransform: "uppercase",
                        textDecoration: "none", fontFamily: "'Space Grotesk',sans-serif", transition: "background .15s",
                        clipPath: "polygon(0 0, 95% 0, 100% 100%, 5% 100%)",
                    }}
                        onMouseEnter={e => e.currentTarget.style.background = LIMEL}
                        onMouseLeave={e => e.currentTarget.style.background = LIME}
                    >🚀 Create Seller Account — Free</Link>
                    <Link href="/documents" style={{
                        padding: "16px 28px", background: "transparent", color: WHITE,
                        fontSize: "12px", fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase",
                        border: "1px solid rgba(248,248,255,.15)", textDecoration: "none",
                        fontFamily: "'Space Grotesk',sans-serif", transition: "all .15s",
                    }}
                        onMouseEnter={e => { e.currentTarget.style.background = "rgba(124,58,237,.15)"; e.currentTarget.style.borderColor = PURPLEL; }}
                        onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = "rgba(248,248,255,.15)"; }}
                    >Browse Documents First</Link>
                </div>
                <p style={{ fontSize: "11px", color: "rgba(248,248,255,.2)", marginTop: "24px", fontFamily: "'Space Grotesk',sans-serif" }}>No credit card. No subscription. No listing fees. LAN earns only when you earn.</p>
            </div>
        </section>
    );
}

/* ═══════════════════════════════════════════════════════════════
   PAGE ROOT
═══════════════════════════════════════════════════════════════ */
export default function SellerNetworkClient() {
    const [activeTab, setActiveTab] = useState("seller");
    return (
        <>
            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;700;800&family=Space+Grotesk:wght@300;400;600;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; overflow-x: hidden; }
        body { overflow-x: hidden; }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }
        @media(max-width:768px){
          section { padding-left: 20px !important; padding-right: 20px !important; }
          nav { padding: 0 20px !important; }
        }
      `}</style>
            <div style={{ fontFamily: "'Space Grotesk',sans-serif", background: VOID, color: WHITE, lineHeight: 1.7, overflowX: "hidden" }}>
                <Nav />
                <NetworkTabs active={activeTab} setActive={setActiveTab} />
                <Hero />
                <WhoQualifies />
                <CompoundingModel />
                <HowItWorks />
                <EarningsEngine />
                <AnalyticsDashboard />
                <BountyBoard />
                <Tiers />
                <SuccessStories />
                <FAQ />
                <OtherNetworks />
                <CTAFooter />
            </div>
        </>
    );
}