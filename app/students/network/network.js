"use client";
import React, { useState } from "react";
import Link from "next/link";

/* ─── colour tokens ─────────────────────────────────────────── */
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
                {[["#explore", "Explore"], ["#earn", "Earn"], ["#connect", "Connect"], ["#bounties", "Bounties"], ["#faq", "FAQ"]].map(([href, label]) => (
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
                >Get Started</Link>
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
   HERO — full-bleed dark with giant text + floating tags
═══════════════════════════════════════════════════════════════ */
function Hero() {
  const tags = ["Past Questions", "Lecture Notes", "Textbooks", "Study Groups", "Bounty Board", "200+ Universities", "Exam Prep"];
  return (
    <section style={{
      minHeight: "92vh",
      display: "flex", flexDirection: "column", justifyContent: "center",
      padding: "80px 40px 60px",
      position: "relative", overflow: "hidden",
    }}>
      {/* ── Full-bleed background image ── */}
      <img
        src="/lanstu.png"
        alt=""
        style={{
          position: "absolute", inset: 0,
          width: "100%", height: "100%",
          objectFit: "cover",
          filter: "brightness(0.35) saturate(0.8)",
          zIndex: 0,
        }}
        onError={e => {
          e.target.src = "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=1600";
        }}
      />

      {/* Purple/void overlay */}
      <div style={{
        position: "absolute", inset: 0, zIndex: 1,
        background: "linear-gradient(135deg, rgba(11,11,15,.92) 0%, rgba(124,58,237,.25) 60%, rgba(11,11,15,.85) 100%)",
      }} />

      {/* Glow orbs on top of image */}
      <div style={{ position: "absolute", top: "-100px", left: "-100px", width: "500px", height: "500px", borderRadius: "50%", background: "radial-gradient(circle, rgba(124,58,237,.2) 0%, transparent 70%)", pointerEvents: "none", zIndex: 1 }} />
      <div style={{ position: "absolute", bottom: "-50px", right: "-50px", width: "400px", height: "400px", borderRadius: "50%", background: "radial-gradient(circle, rgba(163,230,53,.12) 0%, transparent 70%)", pointerEvents: "none", zIndex: 1 }} />

      {/* ── Content ── */}
      <div style={{ maxWidth: "1100px", margin: "0 auto", width: "100%", position: "relative", zIndex: 2 }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "rgba(124,58,237,.2)", border: "1px solid rgba(124,58,237,.4)", padding: "6px 16px", marginBottom: "28px" }}>
          <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: LIME, display: "inline-block", animation: "pulse 1.5s ease-in-out infinite" }} />
          <span style={{ fontSize: "10px", fontWeight: 700, letterSpacing: ".16em", textTransform: "uppercase", color: PURPLEL, fontFamily: "'Space Grotesk',sans-serif" }}>Student Network · 40,000+ Active Students</span>
        </div>

        <h1 style={{
          fontFamily: "'Syne',sans-serif",
          fontSize: "clamp(48px,8vw,110px)", fontWeight: 800,
          color: WHITE, lineHeight: .95, letterSpacing: "-.04em",
          marginBottom: "32px",
        }}>
          Study<br />
          Smarter<span style={{ color: LIME }}>.</span><br />
          <span style={{ color: PURPLE }}>Earn</span><br />
          More<span style={{ color: LIME }}>.</span>
        </h1>

        <p style={{
          fontSize: "17px", color: MUTED, lineHeight: 1.85,
          fontWeight: 400, maxWidth: "500px", marginBottom: "40px",
          fontFamily: "'Space Grotesk',sans-serif",
        }}>
          LAN is Africa's largest academic knowledge platform — 128,000+ documents,
          live study groups, and a bounty system that pays you to find what other students need.
        </p>

        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginBottom: "48px" }}>
          <Link href="/documents" style={{
            padding: "14px 30px", background: LIME, color: VOID,
            fontSize: "12px", fontWeight: 800, letterSpacing: ".08em", textTransform: "uppercase",
            textDecoration: "none", fontFamily: "'Space Grotesk',sans-serif",
            clipPath: "polygon(0 0, 94% 0, 100% 100%, 6% 100%)",
          }}
            onMouseEnter={e => e.currentTarget.style.background = LIMEL}
            onMouseLeave={e => e.currentTarget.style.background = LIME}
          >Browse 128K+ Docs</Link>
          <Link href="/auth/signup" style={{
            padding: "14px 26px", background: "transparent", color: WHITE,
            fontSize: "12px", fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase",
            border: "1px solid rgba(248,248,255,.2)", textDecoration: "none",
            fontFamily: "'Space Grotesk',sans-serif",
          }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = PURPLEL; e.currentTarget.style.color = PURPLEL; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(248,248,255,.2)"; e.currentTarget.style.color = WHITE; }}
          >Create Free Account</Link>
        </div>

        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "48px" }}>
          {tags.map((tag, i) => (
            <span key={tag} style={{
              padding: "6px 14px", fontSize: "10px", fontWeight: 700, letterSpacing: ".06em",
              textTransform: "uppercase", fontFamily: "'Space Grotesk',sans-serif",
              background: i % 3 === 0 ? "rgba(124,58,237,.2)" : i % 3 === 1 ? "rgba(163,230,53,.12)" : "rgba(248,248,255,.06)",
              color: i % 3 === 0 ? PURPLEL : i % 3 === 1 ? LIME : MUTED,
              border: `1px solid ${i % 3 === 0 ? "rgba(124,58,237,.35)" : i % 3 === 1 ? "rgba(163,230,53,.25)" : "rgba(248,248,255,.12)"}`,
            }}>{tag}</span>
          ))}
        </div>

        <div style={{ display: "flex", gap: "0", flexWrap: "wrap", borderTop: "1px solid rgba(248,248,255,.07)", paddingTop: "32px" }}>
          {[["128,000+", "Documents"], ["40,000+", "Students"], ["200+", "Universities"], ["₦0", "To Join"]].map(([v, l], i) => (
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
   WHAT CAN YOU DO — feature grid
═══════════════════════════════════════════════════════════════ */
function WhatCanYouDo() {
    const features = [
        {
            icon: "🔍", label: "EXPLORE", title: "Find Any Academic Document",
            body: "Search 128,000+ documents across 200+ universities. Filter by course code, department, year, or document type. Past questions, lecture notes, textbooks, lab manuals — everything in one place.",
            accent: PURPLE,
        },
        {
            icon: "💰", label: "EARN", title: "Get Paid for Your Knowledge",
            body: "You don't have to just buy on LAN — you can sell too. Upload your own academic materials and earn 80% of every sale. Some student sellers earn ₦200,000+ per month from their uploads.",
            accent: LIME,
        },
        {
            icon: "🎯", label: "BOUNTIES", title: "Post Requests, Get Results",
            body: "Can't find what you need? Post a Bounty. Describe the document you need, set a reward, and watch verified sellers compete to fulfil it. Most bounties are filled within 24–72 hours.",
            accent: "#f59e0b",
        },
        {
            icon: "👥", label: "CONNECT", title: "Build Your Academic Network",
            body: "Join course-specific study groups, connect with top-performing students at your institution, find academic collaborators, and build your reputation on LAN's student community hub.",
            accent: "#06b6d4",
        },
        {
            icon: "📈", label: "TRACK", title: "Manage Your Academic Portfolio",
            body: "Your personal dashboard tracks every document you've purchased, every sale you've made, your bounty history, study group memberships, and your earnings — all in one clean interface.",
            accent: "#ec4899",
        },
        {
            icon: "🛡️", label: "TRUST", title: "Verified, Protected, Guaranteed",
            body: "Every document is vetted before it goes live. Every transaction is protected by LAN's buyer guarantee. If a document doesn't match its description, you get a full refund — no questions asked.",
            accent: PURPLEL,
        },
    ];

    return (
        <section id="explore" style={{ background: DARK, padding: "88px 40px" }}>
            <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "10px" }}>
                    <div style={{ width: "4px", height: "28px", background: `linear-gradient(180deg, ${PURPLE}, ${LIME})` }} />
                    <p style={{ fontSize: "10px", fontWeight: 700, letterSpacing: ".2em", textTransform: "uppercase", color: PURPLEL, fontFamily: "'Space Grotesk',sans-serif" }}>Everything You Can Do</p>
                </div>
                <h2 style={{ fontFamily: "'Syne',sans-serif", fontSize: "clamp(28px,4vw,56px)", fontWeight: 800, color: WHITE, lineHeight: 1.0, marginBottom: "52px", letterSpacing: "-.03em" }}>
                    One Platform.<br /><span style={{ color: LIME }}>Endless Possibilities.</span>
                </h2>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))", gap: "1px", background: "rgba(124,58,237,.12)" }}>
                    {features.map((f, i) => (
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
   BOUNTY BOARD FEATURE
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
        <section id="bounties" style={{ background: VOID, padding: "88px 40px" }}>
            <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "56px", alignItems: "start" }} className="lan-bounty-grid">
                    {/* Left: text */}
                    <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "10px" }}>
                            <div style={{ width: "4px", height: "28px", background: `linear-gradient(180deg, ${PURPLE}, ${LIME})` }} />
                            <p style={{ fontSize: "10px", fontWeight: 700, letterSpacing: ".2em", textTransform: "uppercase", color: PURPLEL, fontFamily: "'Space Grotesk',sans-serif" }}>Bounty Board</p>
                        </div>
                        <h2 style={{ fontFamily: "'Syne',sans-serif", fontSize: "clamp(28px,4vw,52px)", fontWeight: 800, color: WHITE, lineHeight: 1.0, marginBottom: "20px", letterSpacing: "-.03em" }}>
                            Can't Find It?<br /><span style={{ color: LIME }}>Request It.</span>
                        </h2>
                        <p style={{ fontSize: "15px", color: MUTED, lineHeight: 1.9, marginBottom: "28px", fontFamily: "'Space Grotesk',sans-serif" }}>
                            The Bounty Board is LAN's live request marketplace. Students post what they need with a reward attached — and verified sellers race to fulfil it.
                        </p>
                        {[
                            ["Post a Bounty", "Describe the exact document you need and set your reward amount."],
                            ["Sellers Compete", "Verified sellers with matching materials see your request and submit."],
                            ["Get It Fast", "LAN releases the escrow reward to the seller once you confirm."],
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
                            textDecoration: "none", fontFamily: "'Space Grotesk',sans-serif",
                            transition: "background .15s",
                        }}
                            onMouseEnter={e => e.currentTarget.style.background = PURPLED}
                            onMouseLeave={e => e.currentTarget.style.background = PURPLE}
                        >View Live Bounties →</Link>
                    </div>
                    {/* Right: live bounty board */}
                    <div>
                        <div style={{ background: DARK, border: "1px solid rgba(124,58,237,.3)", overflow: "hidden" }}>
                            <div style={{ background: DARK2, padding: "14px 20px", borderBottom: "1px solid rgba(124,58,237,.2)", display: "flex", alignItems: "center", gap: "10px" }}>
                                <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#ef4444", display: "inline-block" }} />
                                <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#f59e0b", display: "inline-block" }} />
                                <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: LIME, display: "inline-block" }} />
                                <span style={{ fontSize: "11px", color: MUTED, fontFamily: "'Space Grotesk',sans-serif", marginLeft: "8px" }}>Live Bounty Board</span>
                            </div>
                            {bounties.map((b, i) => (
                                <div key={b.title}
                                    style={{
                                        padding: "16px 20px", borderBottom: "1px solid rgba(248,248,255,.05)",
                                        transition: "background .15s", cursor: "pointer",
                                    }}
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
   HOW IT WORKS
═══════════════════════════════════════════════════════════════ */
function HowItWorks() {
    const steps = [
        { num: "1", icon: "✉️", title: "Create Your Free Account", body: "Sign up with your student email in under 2 minutes. No credit card. No subscription fee. Your LAN account is free forever — you only pay when you choose to purchase documents." },
        { num: "2", icon: "🔍", title: "Search, Filter, Find", body: "Use our search engine to find documents by course code, university, department, year, or content type. Advanced filters help you find exactly what you need — not just something similar." },
        { num: "3", icon: "💳", title: "Buy With Confidence", body: "Purchase with any Nigerian payment method — card, bank transfer, USSD, or your LAN wallet. Every purchase is covered by our buyer guarantee: full refund if the document doesn't match its description." },
        { num: "4", icon: "📱", title: "Access Anywhere, Always", body: "Downloaded documents are available in your account forever. Read on web, on mobile, or download PDFs for offline access. No expiry, no access window — your library belongs to you." },
        { num: "5", icon: "📤", title: "Start Selling (Optional)", body: "Have materials you're not using? Upload them, set a price, and earn 80% of every sale. Turn your existing notes and past questions into a passive income stream with zero upfront cost." },
    ];
    return (
        <section style={{ background: DARK2, padding: "88px 40px" }}>
            <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "10px" }}>
                    <div style={{ width: "4px", height: "28px", background: `linear-gradient(180deg, ${PURPLE}, ${LIME})` }} />
                    <p style={{ fontSize: "10px", fontWeight: 700, letterSpacing: ".2em", textTransform: "uppercase", color: PURPLEL, fontFamily: "'Space Grotesk',sans-serif" }}>Getting Started</p>
                </div>
                <h2 style={{ fontFamily: "'Syne',sans-serif", fontSize: "clamp(28px,4vw,52px)", fontWeight: 800, color: WHITE, lineHeight: 1.0, marginBottom: "52px", letterSpacing: "-.03em" }}>
                    Go from Zero to<br /><span style={{ color: LIME }}>First Purchase in 5 Min.</span>
                </h2>
                <div style={{ position: "relative" }}>
                    {/* Connector line */}
                    <div style={{ position: "absolute", left: "22px", top: "28px", bottom: "28px", width: "2px", background: "rgba(124,58,237,.2)" }} className="lan-step-line" />
                    {steps.map((s, i) => (
                        <div key={s.num}
                            style={{
                                display: "flex", gap: "28px", alignItems: "flex-start",
                                padding: "20px 0", marginLeft: "0",
                                transition: "opacity .15s",
                            }}
                        >
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
                                <p style={{ fontSize: "13px", color: MUTED, lineHeight: 1.85, maxWidth: "560px", fontFamily: "'Space Grotesk',sans-serif" }}>{s.body}</p>
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
   EARNING AS A STUDENT
═══════════════════════════════════════════════════════════════ */
function StudentEarnings() {
    return (
        <section id="earn" style={{ background: VOID, padding: "88px 40px" }}>
            <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "10px" }}>
                    <div style={{ width: "4px", height: "28px", background: `linear-gradient(180deg, ${PURPLE}, ${LIME})` }} />
                    <p style={{ fontSize: "10px", fontWeight: 700, letterSpacing: ".2em", textTransform: "uppercase", color: PURPLEL, fontFamily: "'Space Grotesk',sans-serif" }}>Earn on LAN</p>
                </div>
                <h2 style={{ fontFamily: "'Syne',sans-serif", fontSize: "clamp(28px,4vw,52px)", fontWeight: 800, color: WHITE, lineHeight: 1.0, marginBottom: "20px", letterSpacing: "-.03em" }}>
                    Students Who Earn<br /><span style={{ color: LIME }}>₦200,000+/Month</span>
                </h2>
                <p style={{ fontSize: "15px", color: MUTED, lineHeight: 1.9, maxWidth: "560px", marginBottom: "52px", fontFamily: "'Space Grotesk',sans-serif" }}>
                    You don't need to just buy on LAN. Thousands of students across Nigeria monetise their notes, past questions, and course materials while still in school.
                </p>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px" }} className="lan-earn-grid">
                    {[
                        { icon: "📄", accent: PURPLE, title: "Upload Documents", body: "Your lecture notes, past questions, textbooks — every academic document you have is worth something to a student at another school. Upload, price, and earn 80% of every sale." },
                        { icon: "🎯", accent: LIME, limeText: true, title: "Fulfil Bounties", body: "Browse the Bounty Board daily. Claim high-reward requests you can fill. Get paid instantly from escrow when the student confirms receipt. Top bounty hunters earn ₦50,000+ per week." },
                        { icon: "🔗", accent: "#06b6d4", title: "Refer & Earn", body: "Share your unique referral link. Earn commissions every time someone you refer makes a purchase or upload. Build passive income stacked on top of your document earnings." },
                    ].map(s => (
                        <div key={s.title}
                            style={{
                                background: DARK, padding: "28px", borderBottom: `3px solid ${s.accent}`,
                                transition: "transform .15s, box-shadow .15s",
                            }}
                            onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-6px)"; e.currentTarget.style.boxShadow = `0 16px 48px rgba(0,0,0,.4)`; }}
                            onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; }}
                        >
                            <div style={{ fontSize: "30px", marginBottom: "16px" }}>{s.icon}</div>
                            <h3 style={{ fontFamily: "'Syne',sans-serif", fontSize: "20px", fontWeight: 700, color: WHITE, marginBottom: "10px", letterSpacing: "-.01em" }}>{s.title}</h3>
                            <p style={{ fontSize: "13px", color: MUTED, lineHeight: 1.85, fontFamily: "'Space Grotesk',sans-serif" }}>{s.body}</p>
                        </div>
                    ))}
                </div>

                {/* Revenue callout */}
                <div style={{ marginTop: "28px", background: "linear-gradient(135deg, rgba(124,58,237,.15) 0%, rgba(163,230,53,.1) 100%)", border: "1px solid rgba(124,58,237,.3)", padding: "32px 36px", display: "flex", gap: "28px", alignItems: "center", flexWrap: "wrap" }}>
                    <div>
                        <div style={{ fontFamily: "'Syne',sans-serif", fontSize: "clamp(36px,5vw,56px)", fontWeight: 800, color: LIME, letterSpacing: "-.03em" }}>₦200,000</div>
                        <div style={{ fontSize: "10px", fontWeight: 700, letterSpacing: ".14em", textTransform: "uppercase", color: MUTED, fontFamily: "'Space Grotesk',sans-serif" }}>Average Top Student Earner / Month</div>
                    </div>
                    <div style={{ width: "1px", height: "60px", background: "rgba(163,230,53,.2)" }} />
                    <div style={{ maxWidth: "500px" }}>
                        <p style={{ fontSize: "14px", color: MUTED, lineHeight: 1.85, fontFamily: "'Space Grotesk',sans-serif" }}>
                            Our highest-earning student sellers maintain catalogues of 100+ documents, actively engage with the Bounty Board, and treat LAN as a part-time income — earning consistently throughout the academic year.
                        </p>
                    </div>
                </div>
            </div>
            <style>{`@media(max-width:768px){ .lan-earn-grid{ grid-template-columns:1fr !important; } }`}</style>
        </section>
    );
}

/* ═══════════════════════════════════════════════════════════════
   STUDY GROUPS & COMMUNITY
═══════════════════════════════════════════════════════════════ */
function Community() {
    return (
        <section id="connect" style={{ background: DARK, padding: "88px 40px" }}>
            <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "56px", alignItems: "center" }} className="lan-community-grid">
                    <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "10px" }}>
                            <div style={{ width: "4px", height: "28px", background: `linear-gradient(180deg, ${PURPLE}, ${LIME})` }} />
                            <p style={{ fontSize: "10px", fontWeight: 700, letterSpacing: ".2em", textTransform: "uppercase", color: PURPLEL, fontFamily: "'Space Grotesk',sans-serif" }}>Community</p>
                        </div>
                        <h2 style={{ fontFamily: "'Syne',sans-serif", fontSize: "clamp(28px,4vw,48px)", fontWeight: 800, color: WHITE, lineHeight: 1.0, marginBottom: "20px", letterSpacing: "-.03em" }}>
                            Study with<br /><span style={{ color: LIME }}>The Best.</span>
                        </h2>
                        <p style={{ fontSize: "15px", color: MUTED, lineHeight: 1.9, marginBottom: "28px", fontFamily: "'Space Grotesk',sans-serif" }}>
                            LAN isn't just a document marketplace — it's a living academic community. Connect with students at your institution and across Africa.
                        </p>
                        {[
                            ["🏫", "Course Study Groups", "Join or create groups for specific courses. Share resources, ask questions, solve problems together."],
                            ["🏆", "Academic Leaderboards", "See the top-performing students at your institution. Compete, collaborate, and get noticed by peers."],
                            ["💬", "Direct Messaging", "Message any student on LAN to arrange study sessions, request materials, or collaborate on academic projects."],
                            ["📣", "Department Feeds", "Follow your department's feed for new materials, bounties, and discussions relevant to your courses."],
                        ].map(([ico, title, body]) => (
                            <div key={title} style={{ display: "flex", gap: "14px", marginBottom: "18px", alignItems: "flex-start" }}>
                                <div style={{ fontSize: "20px", width: "36px", textAlign: "center", flexShrink: 0 }}>{ico}</div>
                                <div>
                                    <div style={{ fontSize: "13px", fontWeight: 700, color: WHITE, marginBottom: "2px", fontFamily: "'Space Grotesk',sans-serif" }}>{title}</div>
                                    <div style={{ fontSize: "12px", color: MUTED, fontFamily: "'Space Grotesk',sans-serif', lineHeight: 1.7" }}>{body}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                    {/* Mock community UI */}
                    <div style={{ background: DARK2, border: "1px solid rgba(124,58,237,.2)", overflow: "hidden" }}>
                        <div style={{ padding: "16px 20px", borderBottom: "1px solid rgba(248,248,255,.06)", display: "flex", alignItems: "center", gap: "8px" }}>
                            <span style={{ fontSize: "14px" }}>👥</span>
                            <span style={{ fontSize: "12px", fontWeight: 700, color: WHITE, fontFamily: "'Space Grotesk',sans-serif" }}>Study Groups</span>
                            <span style={{ marginLeft: "auto", fontSize: "10px", color: LIME, fontWeight: 700, fontFamily: "'Space Grotesk',sans-serif" }}>● LIVE</span>
                        </div>
                        {[
                            { name: "UNILAG Medicine 500L", members: "284 members", active: "12 online", icon: "💉" },
                            { name: "OAU Engineering Year 4", members: "156 members", active: "8 online", icon: "⚙️" },
                            { name: "ABU Law 300L", members: "98 members", active: "5 online", icon: "⚖️" },
                            { name: "UI Economics 200L", members: "213 members", active: "19 online", icon: "📊" },
                            { name: "FUTA CS Year 3", members: "177 members", active: "14 online", icon: "💻" },
                        ].map(g => (
                            <div key={g.name}
                                style={{ padding: "14px 20px", borderBottom: "1px solid rgba(248,248,255,.05)", display: "flex", alignItems: "center", gap: "12px", transition: "background .12s", cursor: "pointer" }}
                                onMouseEnter={e => e.currentTarget.style.background = "rgba(124,58,237,.08)"}
                                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                            >
                                <div style={{ width: "36px", height: "36px", background: "rgba(124,58,237,.2)", border: "1px solid rgba(124,58,237,.3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px", flexShrink: 0 }}>{g.icon}</div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: "12px", fontWeight: 700, color: WHITE, fontFamily: "'Space Grotesk',sans-serif" }}>{g.name}</div>
                                    <div style={{ fontSize: "10px", color: MUTED, fontFamily: "'Space Grotesk',sans-serif" }}>{g.members}</div>
                                </div>
                                <div style={{ fontSize: "10px", color: LIME, fontWeight: 700, fontFamily: "'Space Grotesk',sans-serif" }}>{g.active}</div>
                            </div>
                        ))}
                        <div style={{ padding: "14px 20px", textAlign: "center", fontSize: "11px", color: PURPLEL, fontWeight: 600, fontFamily: "'Space Grotesk',sans-serif", cursor: "pointer", borderTop: "1px solid rgba(124,58,237,.15)" }}>
                            Browse all 1,800+ study groups →
                        </div>
                    </div>
                </div>
            </div>
            <style>{`@media(max-width:900px){ .lan-community-grid{ grid-template-columns:1fr !important; } }`}</style>
        </section>
    );
}

/* ═══════════════════════════════════════════════════════════════
   STUDENT TESTIMONIALS
═══════════════════════════════════════════════════════════════ */
function Testimonials() {
    const stories = [
        { q: "I found 5 years of UNILAG Medicine past questions on LAN in 20 minutes. I spent one night going through them and passed my MBBS finals. LAN is not optional — it's essential.", name: "Chidimma N.", meta: "Medical Student · UNILAG", initials: "CN", stat: "5 years exams", statLabel: "Found in 20 mins" },
        { q: "I uploaded my 300 and 400 level engineering notes during NYSC and now they generate ₦35,000–₦60,000 every month while I work. Completely passive. Completely surreal.", name: "Emeka S.", meta: "Graduate · Engineering · FUTA", initials: "ES", stat: "₦50k avg", statLabel: "Monthly passive" },
        { q: "Posted a bounty for specific Law case summaries, offered ₦7,000. Had 3 responses in 6 hours. Paid ₦7,000 and got materials worth ₦50,000 in study value. The Bounty Board is insane.", name: "Aisha B.", meta: "Law Student · ABU", initials: "AB", stat: "₦7k bounty", statLabel: "Paid for ₦50k value" },
    ];

    return (
        <section style={{ background: VOID, padding: "88px 40px" }}>
            <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "10px" }}>
                    <div style={{ width: "4px", height: "28px", background: `linear-gradient(180deg, ${PURPLE}, ${LIME})` }} />
                    <p style={{ fontSize: "10px", fontWeight: 700, letterSpacing: ".2em", textTransform: "uppercase", color: PURPLEL, fontFamily: "'Space Grotesk',sans-serif" }}>Real Students</p>
                </div>
                <h2 style={{ fontFamily: "'Syne',sans-serif", fontSize: "clamp(28px,4vw,52px)", fontWeight: 800, color: WHITE, lineHeight: 1.0, marginBottom: "52px", letterSpacing: "-.03em" }}>
                    What Students<br /><span style={{ color: LIME }}>Actually Say</span>
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
        { q: "Is LAN Library free to use?", a: "Creating an account and browsing the platform is completely free. You only pay when you purchase a specific document. Selling is also free — LAN takes 20% only when you make a sale." },
        { q: "Can I access documents offline?", a: "Yes. Purchased documents can be downloaded as PDFs to your device and accessed offline at any time. There is no expiry on your downloads — once purchased, a document is in your library permanently." },
        { q: "How does the buyer guarantee work?", a: "If a document you purchase does not match its description, title, or listed course code, you can raise a dispute within 48 hours of purchase. LAN's team reviews every dispute within 24 hours. If your complaint is valid, a full refund is issued to your LAN wallet." },
        { q: "Do I need to be enrolled in a Nigerian university to use LAN?", a: "No. LAN is open to anyone who needs academic materials — students, graduates, researchers, and professionals. However, most of our content is specifically designed for Nigerian and African university curricula." },
        { q: "How do I fund my LAN wallet?", a: "You can fund your wallet via debit card, bank transfer, or USSD. Supported banks include all major Nigerian financial institutions. Funding is instant via card and typically within minutes via bank transfer." },
        { q: "Can I earn from LAN without uploading documents?", a: "Yes — through the referral programme. Earn a commission every time someone you refer makes a purchase or upload. Referral income stacks on top of any document or bounty income you earn." },
        { q: "What if the document I need doesn't exist on LAN?", a: "Post a Bounty. Describe exactly what you need, set a reward amount, and verified sellers will compete to fulfil your request. Most bounties are filled within 24–72 hours." },
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
                        { bg: "#0d2244", accent: "#b8963e", tag: "📚 Seller Network", title: "Turn Your Notes Into Income", body: "2,400+ verified sellers earn from academic materials. Join and monetise what you already have.", href: "/seller/network" },
                        { bg: "#1a1a2e", accent: LIMEL, tag: "🏛️ Faculty Network", title: "Verified Academic Publishing", body: "Lecturers and professors reach students across Africa and earn from their course materials.", href: "/faculty/network" },
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
            <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: "700px", height: "700px", borderRadius: "50%", background: "radial-gradient(circle, rgba(124,58,237,.1) 0%, transparent 70%)", pointerEvents: "none" }} />
            <div style={{ position: "relative", zIndex: 2 }}>
                <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "rgba(163,230,53,.1)", border: "1px solid rgba(163,230,53,.25)", padding: "7px 18px", marginBottom: "28px" }}>
                    <span style={{ width: "6px", height: "6px", background: LIME, borderRadius: "50%", display: "inline-block", animation: "pulse 1.5s ease-in-out infinite" }} />
                    <span style={{ fontSize: "10px", fontWeight: 700, letterSpacing: ".16em", textTransform: "uppercase", color: LIME, fontFamily: "'Space Grotesk',sans-serif" }}>Free Forever · Join 40,000+ Students</span>
                </div>
                <h2 style={{ fontFamily: "'Syne',sans-serif", fontSize: "clamp(36px,6vw,72px)", fontWeight: 800, color: WHITE, lineHeight: .95, marginBottom: "20px", letterSpacing: "-.04em" }}>
                    Your Degree.<br />Your <span style={{ color: LIME }}>Library.</span><br />Your <span style={{ color: PURPLEL }}>Income.</span>
                </h2>
                <p style={{ fontSize: "15px", color: MUTED, maxWidth: "460px", margin: "0 auto 40px", lineHeight: 1.85, fontFamily: "'Space Grotesk',sans-serif" }}>
                    Create your free account in 2 minutes. Start browsing 128,000+ documents immediately — no payment required to explore.
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
                    >Create Free Account</Link>
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
                <p style={{ fontSize: "11px", color: "rgba(248,248,255,.2)", marginTop: "24px", fontFamily: "'Space Grotesk',sans-serif" }}>No credit card. No subscription. Completely free to explore.</p>
            </div>
        </section>
    );
}

/* ═══════════════════════════════════════════════════════════════
   PAGE ROOT
═══════════════════════════════════════════════════════════════ */
export default function StudentNetworkClient() {
    const [activeTab, setActiveTab] = useState("student");
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
                <WhatCanYouDo />
                <BountyBoard />
                <HowItWorks />
                <StudentEarnings />
                <Community />
                <Testimonials />
                <FAQ />
                <OtherNetworks />
                <CTAFooter />
            </div>
        </>
    );
}