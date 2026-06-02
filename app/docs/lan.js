"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";

/* ─── Design tokens — identical to Student Network ───────────── */
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
const GOLD = "#b8963e";
const GOLDD = "#d4aa5a";
const NAVY = "#0d2244";

/* ─── Shared accent bar ──────────────────────────────────────── */
const AccentBar = () => (
    <div style={{ width: "4px", height: "28px", background: `linear-gradient(180deg, ${PURPLE}, ${LIME})`, flexShrink: 0 }} />
);

/* ─── Section label ──────────────────────────────────────────── */
const Label = ({ children }) => (
    <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "10px" }}>
        <AccentBar />
        <p style={{ fontSize: "10px", fontWeight: 700, letterSpacing: ".2em", textTransform: "uppercase", color: PURPLEL, fontFamily: "'Space Grotesk',sans-serif", margin: 0 }}>
            {children}
        </p>
    </div>
);

/* ─── Section heading ────────────────────────────────────────── */
const SectionH = ({ children }) => (
    <h2 style={{ fontFamily: "'Syne',sans-serif", fontSize: "clamp(28px,4vw,52px)", fontWeight: 800, color: WHITE, lineHeight: 1.0, marginBottom: "48px", letterSpacing: "-.03em" }}>
        {children}
    </h2>
);

/* ─── Callout box ────────────────────────────────────────────── */
const Callout = ({ icon, label, children }) => (
    <div style={{ background: "rgba(124,58,237,.12)", border: "1px solid rgba(124,58,237,.3)", borderLeft: `3px solid ${PURPLE}`, padding: "20px 24px", margin: "24px 0" }}>
        <div style={{ fontSize: "10px", fontWeight: 700, letterSpacing: ".18em", textTransform: "uppercase", color: PURPLEL, marginBottom: "8px", fontFamily: "'Space Grotesk',sans-serif" }}>
            {icon} {label}
        </div>
        <p style={{ fontSize: "14px", color: MUTED, lineHeight: 1.75, fontFamily: "'Space Grotesk',sans-serif", margin: 0 }}>{children}</p>
    </div>
);

/* ─── Feature card ───────────────────────────────────────────── */
const FCard = ({ icon, tag, title, body, accent = PURPLE }) => (
    <div style={{ background: DARK, padding: "28px", borderTop: `3px solid ${accent}`, transition: "background .15s" }}
        onMouseEnter={e => e.currentTarget.style.background = DARK2}
        onMouseLeave={e => e.currentTarget.style.background = DARK}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", marginBottom: "14px" }}>
            <span style={{ fontSize: "22px" }}>{icon}</span>
            {tag && <span style={{ fontSize: "9px", fontWeight: 700, letterSpacing: ".18em", textTransform: "uppercase", color: accent, fontFamily: "'Space Grotesk',sans-serif" }}>{tag}</span>}
        </div>
        <h3 style={{ fontFamily: "'Syne',sans-serif", fontSize: "18px", fontWeight: 700, color: WHITE, marginBottom: "10px", letterSpacing: "-.01em" }}>{title}</h3>
        <p style={{ fontSize: "13px", color: MUTED, lineHeight: 1.85, fontFamily: "'Space Grotesk',sans-serif", margin: 0 }}>{body}</p>
    </div>
);

/* ─── Step row ───────────────────────────────────────────────── */
const Step = ({ num, icon, title, body, isFirst, isLast }) => (
    <div style={{ display: "flex", gap: "24px", alignItems: "flex-start", padding: "18px 0" }}>
        <div style={{
            width: "44px", height: "44px", borderRadius: "50%",
            background: isFirst || isLast ? PURPLE : DARK,
            border: `2px solid ${PURPLE}`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "13px", fontWeight: 800, color: WHITE, flexShrink: 0,
            fontFamily: "'Syne',sans-serif", zIndex: 2, position: "relative",
        }}>{num}</div>
        <div style={{ flex: 1, paddingTop: "8px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
                <span style={{ fontSize: "18px" }}>{icon}</span>
                <h3 style={{ fontFamily: "'Syne',sans-serif", fontSize: "17px", fontWeight: 700, color: WHITE, letterSpacing: "-.01em", margin: 0 }}>{title}</h3>
            </div>
            <p style={{ fontSize: "13px", color: MUTED, lineHeight: 1.85, maxWidth: "560px", fontFamily: "'Space Grotesk',sans-serif", margin: 0 }}>{body}</p>
        </div>
    </div>
);

/* ─── Audience card ──────────────────────────────────────────── */
const ACard = ({ icon, name, body, accent = PURPLE }) => (
    <div style={{ background: DARK, padding: "24px", border: `1px solid rgba(124,58,237,.15)`, transition: "border-color .15s, background .15s" }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = accent; e.currentTarget.style.background = DARK2; }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(124,58,237,.15)"; e.currentTarget.style.background = DARK; }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
            <div style={{ width: "36px", height: "36px", background: "rgba(124,58,237,.2)", border: `1px solid rgba(124,58,237,.3)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px", flexShrink: 0 }}>{icon}</div>
            <span style={{ fontSize: "13px", fontWeight: 700, color: WHITE, fontFamily: "'Space Grotesk',sans-serif" }}>{name}</span>
        </div>
        <p style={{ fontSize: "12px", color: MUTED, lineHeight: 1.75, fontFamily: "'Space Grotesk',sans-serif", margin: 0 }}>{body}</p>
    </div>
);

/* ─── Badge pill ─────────────────────────────────────────────── */
const Badge = ({ children, accent }) => (
    <span style={{
        display: "inline-block", padding: "5px 14px",
        fontSize: "10px", fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase",
        fontFamily: "'Space Grotesk',sans-serif",
        background: accent ? `${accent}20` : "rgba(124,58,237,.15)",
        color: accent || PURPLEL,
        border: `1px solid ${accent ? `${accent}40` : "rgba(124,58,237,.3)"}`,
    }}>{children}</span>
);

/* ─── Search modal ───────────────────────────────────────────── */
const SEARCH_INDEX = [
    { title: "What is LAN Library?", path: "Overview", id: "overview", desc: "Africa's #1 digital academic knowledge marketplace." },
    { title: "The L.A.N Network", path: "About", id: "lan-network", desc: "Learning Access Network — community, leadership, growth." },
    { title: "For Students", path: "Who Benefits", id: "who-benefits", desc: "128,000+ documents, AI tutor, study groups, bounty board." },
    { title: "For Sellers", path: "Sellers", id: "sellers", desc: "Upload, price, earn 80% of every sale." },
    { title: "For Faculty / Lecturers", path: "Faculty", id: "faculty", desc: "Verified Faculty badge, Dr., Prof., Engr., Barr., Pharm." },
    { title: "Bounty Board", path: "Features", id: "bounty", desc: "Post document requests with rewards. Get results in 24–72h." },
    { title: "AI Tutor", path: "Features", id: "ai-tutor", desc: "Claude-powered assistant that reads your specific books." },
    { title: "Study Groups", path: "Community", id: "community", desc: "Course-specific groups, direct messaging, leaderboards." },
    { title: "LAN Wallet", path: "Payments", id: "earning hub", desc: "Instant earnings credits, withdrawals, recharge services." },
    { title: "Security & Trust", path: "Platform", id: "security", desc: "Watermarking, encrypted payments, buyer guarantee." },
    { title: "Referral Programme", path: "Earn", id: "referral", desc: "Earn commissions for every person you bring to LAN." },
    { title: "Seller Titles & Verified Faculty", path: "Sellers", id: "faculty", desc: "Dr., Prof., Engr., Barr., Pharm. — Verified Faculty badge." },
    { title: "Recharge Services", path: "Wallet", id: "wallet", desc: "Pay airtime, data, electricity, DSTV from your wallet." },
    { title: "How to Buy Documents", path: "Buyers", id: "buyers", desc: "Search, preview, purchase, instant library access." },
    { title: "Seller Dashboard", path: "Dashboard", id: "dashboard", desc: "Analytics, catalogue management, real-time earnings." },
    { title: "Withdraw Earnings", path: "Withdraw Earnings", id: "withdraw", desc: "Bank transfer, mobile money, 24h processing across Africa." },
    { title: "Past Questions", path: "Documents", id: "document-types", desc: "Largest collection of African university past exam papers." },
    { title: "Vision & Mission", path: "About", id: "vision", desc: "Democratising education. Rewarding creators. Building a knowledge economy." },
    { title: "Seller Network.", path: "Network Guide", id: "network", desc: "Africa's largest academic document marketplace." },

];

function SearchModal({ open, onClose, onNavigate }) {
    const [query, setQuery] = useState("");
    const inputRef = useRef(null);

    useEffect(() => {
        if (open) { setQuery(""); setTimeout(() => inputRef.current?.focus(), 50); }
    }, [open]);

    useEffect(() => {
        const h = (e) => { if (e.key === "Escape") onClose(); };
        window.addEventListener("keydown", h);
        return () => window.removeEventListener("keydown", h);
    }, [onClose]);

    const results = query.trim().length > 0
        ? SEARCH_INDEX.filter(i =>
            i.title.toLowerCase().includes(query.toLowerCase()) ||
            i.desc.toLowerCase().includes(query.toLowerCase()) ||
            i.path.toLowerCase().includes(query.toLowerCase())
        ).slice(0, 8)
        : [];

    const hl = (text, q) => {
        if (!q) return text;
        const idx = text.toLowerCase().indexOf(q.toLowerCase());
        if (idx === -1) return text;
        return <>{text.slice(0, idx)}<mark style={{ background: "transparent", color: LIME, fontWeight: 700 }}>{text.slice(idx, idx + q.length)}</mark>{text.slice(idx + q.length)}</>;
    };

    if (!open) return null;

    return (
        <div style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex", alignItems: "flex-start", justifyContent: "center", paddingTop: "80px", paddingLeft: "16px", paddingRight: "16px" }}>
            <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,.7)", backdropFilter: "blur(4px)" }} onClick={onClose} />
            <div style={{ position: "relative", width: "100%", maxWidth: "620px", background: DARK, border: "1px solid rgba(124,58,237,.3)", overflow: "hidden", animation: "fadeUp .15s ease-out" }}>
                {/* Input */}
                <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "14px 18px", borderBottom: "1px solid rgba(248,248,255,.07)" }}>
                    <svg width="16" height="16" fill="none" stroke={MUTED} strokeWidth="2" viewBox="0 0 24 24" style={{ flexShrink: 0 }}><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /></svg>
                    <input ref={inputRef} type="text" value={query} onChange={e => setQuery(e.target.value)} placeholder="Search LAN docs..." style={{ flex: 1, background: "transparent", border: "none", outline: "none", fontSize: "15px", color: WHITE, fontFamily: "'Space Grotesk',sans-serif" }} />
                    <button onClick={onClose} style={{ fontSize: "10px", color: MUTED, background: "rgba(248,248,255,.07)", border: "1px solid rgba(248,248,255,.12)", padding: "3px 8px", fontFamily: "monospace", cursor: "pointer" }}>ESC</button>
                </div>
                {/* Results */}
                {query.trim().length > 0 && (
                    <div style={{ maxHeight: "420px", overflowY: "auto" }}>
                        {results.length > 0 ? results.map((item, i) => (
                            <button key={i} onClick={() => { onNavigate(item.id); onClose(); }} style={{ width: "100%", display: "flex", alignItems: "flex-start", gap: "12px", padding: "14px 18px", background: "none", border: "none", borderBottom: "1px solid rgba(248,248,255,.04)", cursor: "pointer", textAlign: "left", transition: "background .12s" }}
                                onMouseEnter={e => e.currentTarget.style.background = "rgba(124,58,237,.1)"}
                                onMouseLeave={e => e.currentTarget.style.background = "none"}>
                                <div style={{ width: "28px", height: "28px", background: "rgba(124,58,237,.2)", border: "1px solid rgba(124,58,237,.3)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: "2px" }}>
                                    <svg width="12" height="12" fill="none" stroke={PURPLEL} strokeWidth="2" viewBox="0 0 24 24"><path d="M7 20h10M7 4h10M5 12h14" /></svg>
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: "10px", color: PURPLEL, marginBottom: "3px", fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase" }}>{item.path}</div>
                                    <div style={{ fontSize: "14px", fontWeight: 700, color: WHITE, marginBottom: "3px", fontFamily: "'Space Grotesk',sans-serif" }}>{hl(item.title, query)}</div>
                                    <div style={{ fontSize: "12px", color: MUTED, fontFamily: "'Space Grotesk',sans-serif" }}>{item.desc}</div>
                                </div>
                            </button>
                        )) : (
                            <div style={{ padding: "40px", textAlign: "center", color: MUTED, fontSize: "14px", fontFamily: "'Space Grotesk',sans-serif" }}>No results for "{query}"</div>
                        )}
                    </div>
                )}
                {query.trim().length === 0 && (
                    <div style={{ padding: "16px 18px" }}>
                        <div style={{ fontSize: "10px", fontWeight: 700, letterSpacing: ".14em", textTransform: "uppercase", color: MUTED, marginBottom: "12px", fontFamily: "'Space Grotesk',sans-serif" }}>Quick links</div>
                        {["What is LAN Library?", "For Students", "For Sellers", "Bounty Board", "AI Tutor", "LAN Wallet"].map((label, i) => {
                            const item = SEARCH_INDEX.find(s => s.title === label);
                            return (
                                <button key={i} onClick={() => { if (item) { onNavigate(item.id); onClose(); } }} style={{ display: "flex", alignItems: "center", gap: "10px", width: "100%", padding: "9px 8px", background: "none", border: "none", cursor: "pointer", textAlign: "left", borderRadius: "6px", transition: "background .12s" }}
                                    onMouseEnter={e => e.currentTarget.style.background = "rgba(124,58,237,.1)"}
                                    onMouseLeave={e => e.currentTarget.style.background = "none"}>
                                    <svg width="12" height="12" fill="none" stroke={MUTED} strokeWidth="2" viewBox="0 0 24 24"><path d="M13 5l7 7-7 7M5 5l7 7-7 7" /></svg>
                                    <span style={{ fontSize: "13px", color: MUTED, fontFamily: "'Space Grotesk',sans-serif" }}>{label}</span>
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>
            <style>{`@keyframes fadeUp { from{opacity:0;transform:translateY(-12px)} to{opacity:1;transform:translateY(0)} }`}</style>
        </div>
    );
}

/* ─── Top Nav ────────────────────────────────────────────────── */
function Nav({ onSearch }) {
    const [scrolled, setScrolled] = useState(false);
    useEffect(() => {
        const h = () => setScrolled(window.scrollY > 10);
        window.addEventListener("scroll", h);
        return () => window.removeEventListener("scroll", h);
    }, []);

    return (
        <nav style={{
            position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
            height: "56px", background: VOID,
            borderBottom: `1px solid rgba(124,58,237,.25)`,
            display: "flex", alignItems: "center", padding: "0 28px", gap: "0",
            boxShadow: scrolled ? "0 4px 24px rgba(0,0,0,.5)" : "none", transition: "box-shadow .2s",
        }}>
            {/* Logo */}
            <Link href="/" style={{ display: "flex", alignItems: "center", gap: "10px", paddingRight: "24px", borderRight: "1px solid rgba(124,58,237,.2)", marginRight: "20px", textDecoration: "none" }}>
                <img src="/lanlog.png" alt="LAN" style={{ width: "36px", height: "36px", borderRadius: "50%" }} onError={e => { e.target.style.display = "none"; }} />
                <span style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: "15px", color: WHITE, letterSpacing: "-.02em" }}>
                    LAN<span style={{ color: LIME }}>.</span>Docs
                </span>
            </Link>

            {/* Nav links */}
            <div style={{ display: "flex", alignItems: "center", gap: "4px", flex: 1 }} className="lan-nav-links">
                {[
                    ["#overview", "Overview"],
                    ["#who-benefits", "Who It's For"],
                    ["#sellers", "Sellers"],
                    ["#faculty", "Faculty"],
                    ["#bounty", "Bounties"],
                    ["#wallet", "Wallet"],
                    ["#community", "Community"],
                    ["#network", "Seller Network"],
                    ["#withdraw", "Withdraw"],
                ].map(([href, label]) => (
                    <a key={href} href={href} style={{ color: MUTED, fontSize: "12px", fontWeight: 600, textDecoration: "none", letterSpacing: ".05em", textTransform: "uppercase", transition: "color .15s", padding: "6px 10px", fontFamily: "'Space Grotesk',sans-serif" }}
                        onMouseEnter={e => e.currentTarget.style.color = LIME}
                        onMouseLeave={e => e.currentTarget.style.color = MUTED}>
                        {label}
                    </a>
                ))}
            </div>

            {/* Search + CTA */}
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginLeft: "auto", flexShrink: 0 }}>
                <button onClick={onSearch} style={{ display: "flex", alignItems: "center", gap: "8px", background: "rgba(248,248,255,.05)", border: "1px solid rgba(124,58,237,.25)", padding: "7px 14px", color: MUTED, fontSize: "12px", cursor: "pointer", fontFamily: "'Space Grotesk',sans-serif", transition: "all .15s" }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = PURPLEL; e.currentTarget.style.color = WHITE; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(124,58,237,.25)"; e.currentTarget.style.color = MUTED; }}>
                    <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /></svg>
                    <span>Search</span>
                    <span style={{ fontSize: "9px", background: "rgba(248,248,255,.08)", padding: "1px 6px", fontFamily: "monospace" }}>ctrl+K</span>
                </button>
                <Link href="/auth/signup" style={{ background: LIME, color: VOID, padding: "9px 20px", fontSize: "11px", fontWeight: 800, letterSpacing: ".1em", textTransform: "uppercase", textDecoration: "none", fontFamily: "'Space Grotesk',sans-serif", clipPath: "polygon(0 0, 94% 0, 100% 100%, 6% 100%)", transition: "background .15s" }}
                    onMouseEnter={e => e.currentTarget.style.background = LIMEL}
                    onMouseLeave={e => e.currentTarget.style.background = LIME}>
                    Get Started
                </Link>
            </div>

            <style>{`@media(max-width:900px){ .lan-nav-links{ display:none !important; } }`}</style>
        </nav>
    );
}

/* ─── Left sidebar ───────────────────────────────────────────── */
const SIDEBAR_DATA = [
    {
        label: "Introduction", items: [
            { label: "What is LAN Library?", id: "overview" },
            { label: "Vision & Mission", id: "vision" },
            { label: "The L.A.N Network", id: "lan-network" },
        ]
    },
    {
        label: "Who It's For", items: [
            { label: "Students & Learners", id: "who-benefits" },
            { label: "Sellers & Creators", id: "sellers" },
            { label: "Faculty & Educators", id: "faculty" },
            { label: "Professionals", id: "who-benefits" },
        ]
    },
    {
        label: "Key Features", items: [
            { label: "Document Marketplace", id: "document-types" },
            { label: "AI Tutor (LAN AI)", id: "ai-tutor" },
            { label: "Bounty Board", id: "bounty" },
            { label: "Study Groups", id: "community" },
        ]
    },
    {
        label: "Payments & Earnings", items: [
            { label: "LAN Wallet", id: "earning hub" },
            { label: "LAN Seller Network", id: "network" },
            { label: "Seller Earnings", id: "sellers" },
            { label: "Seller Dashboard", id: "dashboard" },
            { label: "Withdraw Earnings", id: "withdraw" },

            { label: "Referral Programme", id: "referral" },
            { label: "Recharge Services", id: "wallet" },
        ]
    },
    {
        label: "Platform", items: [
            { label: "Security & Trust", id: "security" },
            { label: "Quality Control", id: "security" },
            { label: "Seller Titles & Roles", id: "faculty" },
            { label: "The Future", id: "future" },
        ]
    },
    {
        label: "Platform Links", items: [
            { label: "Student Network →", href: "/students/network" },
            { label: "Seller Network →", href: "/seller/network" },
            { label: "Faculty Network →", href: "/faculty/network" },
            { label: "Bounty Board →", href: "/lan/net/help-center/article/bounty-board-for-authors" },
            { label: "Help Centre →", href: "/lan/net/help-center" },
        ]
    },
];

function Sidebar({ activeId, onNavigate, mobileOpen, onClose }) {
    return (
        <>
            {mobileOpen && <div style={{ position: "fixed", inset: 0, zIndex: 49, background: "rgba(0,0,0,.6)" }} onClick={onClose} />}
            <aside style={{
                position: "fixed", top: "56px", left: 0, bottom: 0,
                width: "248px", background: DARK, borderRight: "1px solid rgba(124,58,237,.15)",
                overflowY: "auto", zIndex: 50, transition: "transform .2s",
                transform: mobileOpen ? "translateX(0)" : "translateX(-100%)",
            }} className="lan-sidebar">
                <div style={{ padding: "16px 0 48px" }}>
                    {SIDEBAR_DATA.map((group, gi) => (
                        <div key={gi}>
                            {gi > 0 && <div style={{ height: "1px", background: "rgba(248,248,255,.05)", margin: "6px 12px" }} />}
                            <div style={{ padding: "0 12px" }}>
                                <div style={{ fontSize: "9px", fontWeight: 700, letterSpacing: ".16em", textTransform: "uppercase", color: "rgba(248,248,255,.25)", padding: "12px 10px 6px", fontFamily: "'Space Grotesk',sans-serif" }}>
                                    {group.label}
                                </div>
                                {group.items.map((item, ii) => {
                                    const isActive = activeId === item.id;
                                    if (item.href) {
                                        return (
                                            <Link key={ii} href={item.href} style={{ display: "block", fontSize: "13px", padding: "7px 10px", color: MUTED, textDecoration: "none", fontFamily: "'Space Grotesk',sans-serif", transition: "color .12s", borderLeft: "2px solid transparent" }}
                                                onMouseEnter={e => e.currentTarget.style.color = LIME}
                                                onMouseLeave={e => e.currentTarget.style.color = MUTED}>
                                                {item.label}
                                            </Link>
                                        );
                                    }
                                    return (
                                        <button key={ii} onClick={() => { onNavigate(item.id); onClose(); }} style={{
                                            display: "flex", alignItems: "center", width: "100%", background: "none", border: "none",
                                            fontSize: "13px", padding: "7px 10px", cursor: "pointer", textAlign: "left",
                                            fontFamily: "'Space Grotesk',sans-serif", transition: "all .12s",
                                            color: isActive ? WHITE : MUTED,
                                            borderLeft: `2px solid ${isActive ? LIME : "transparent"}`,
                                            background: isActive ? "rgba(163,230,53,.06)" : "transparent",
                                            fontWeight: isActive ? 600 : 400,
                                        }}
                                            onMouseEnter={e => { if (!isActive) { e.currentTarget.style.color = WHITE; e.currentTarget.style.background = "rgba(248,248,255,.04)"; } }}
                                            onMouseLeave={e => { if (!isActive) { e.currentTarget.style.color = MUTED; e.currentTarget.style.background = "transparent"; } }}>
                                            {item.label}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
                <style>{`@media(min-width:900px){ .lan-sidebar{ transform:translateX(0) !important; } }`}</style>
            </aside>
        </>
    );
}

/* ─── Right TOC ──────────────────────────────────────────────── */
const TOC_ITEMS = [
    { id: "overview", label: "What is LAN Library" },
    { id: "vision", label: "Vision & Mission" },
    { id: "who-benefits", label: "Who Benefits" },
    { id: "document-types", label: "Document Types" },
    { id: "ai-tutor", label: "AI Tutor" },
    { id: "bounty", label: "Bounty Board" },
    { id: "sellers", label: "For Sellers" },
    { id: "faculty", label: "Faculty & Educators" },
    { id: "wallet", label: "Wallet & Payments" },
    { id: "network", label: "LAN Seller Network" },
    { id: "referral", label: "Referral Programme" },
    { id: "community", label: "Community" },
    { id: "security", label: "Security & Trust" },
    { id: "lan-network", label: "The L.A.N Network" },
    { id: "future", label: "The Future" },
];

function RightTOC({ activeId, onNavigate }) {
    return (
        <aside style={{ position: "fixed", top: "56px", right: 0, bottom: 0, width: "220px", background: DARK, borderLeft: "1px solid rgba(124,58,237,.15)", overflowY: "auto", padding: "20px 16px 48px" }} className="lan-right-toc">
            <div style={{ fontSize: "9px", fontWeight: 700, letterSpacing: ".18em", textTransform: "uppercase", color: "rgba(248,248,255,.25)", marginBottom: "14px", fontFamily: "'Space Grotesk',sans-serif", display: "flex", alignItems: "center", gap: "6px" }}>
                <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" /></svg>
                On this page
            </div>
            {TOC_ITEMS.map(item => (
                <button key={item.id} onClick={() => onNavigate(item.id)} style={{
                    display: "block", width: "100%", textAlign: "left", background: "none", border: "none",
                    fontSize: "12px", padding: "5px 0 5px 10px", cursor: "pointer",
                    fontFamily: "'Space Grotesk',sans-serif", transition: "all .12s", marginBottom: "2px",
                    color: activeId === item.id ? LIME : MUTED,
                    borderLeft: `2px solid ${activeId === item.id ? LIME : "transparent"}`,
                    fontWeight: activeId === item.id ? 600 : 400,
                }}>
                    {item.label}
                </button>
            ))}
            <style>{`@media(max-width:1200px){ .lan-right-toc{ display:none !important; } }`}</style>
        </aside>
    );
}

/* ══════════════════════════════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════════════════════════════ */
export default function LANDocsClient() {
    const [activeId, setActiveId] = useState("overview");
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [searchOpen, setSearchOpen] = useState(false);

    /* Cmd+K */
    useEffect(() => {
        const h = (e) => { if ((e.ctrlKey || e.metaKey) && e.key === "k") { e.preventDefault(); setSearchOpen(true); } };
        window.addEventListener("keydown", h);
        return () => window.removeEventListener("keydown", h);
    }, []);

    /* Scroll spy */
    useEffect(() => {
        const ids = TOC_ITEMS.map(t => t.id);
        const obs = new IntersectionObserver(
            entries => entries.forEach(e => { if (e.isIntersecting) setActiveId(e.target.id); }),
            { rootMargin: "-10% 0px -80% 0px" }
        );
        ids.forEach(id => { const el = document.getElementById(id); if (el) obs.observe(el); });
        return () => obs.disconnect();
    }, []);

    const scrollTo = useCallback((id) => {
        const el = document.getElementById(id);
        if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
        setSidebarOpen(false);
    }, []);

    return (
        <>
            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;700;800&family=Space+Grotesk:wght@300;400;600;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; overflow-x: hidden; }
        body { overflow-x: hidden; }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(-10px)} to{opacity:1;transform:translateY(0)} }
        section { scroll-margin-top: 72px; }
        .lan-content { margin-left: 0; margin-right: 0; }
        @media(min-width: 900px) { .lan-content { margin-left: 248px; } }
        @media(min-width: 1200px) { .lan-content { margin-right: 220px; } }
        @media(max-width: 768px) { .lan-section-pad { padding-left: 20px !important; padding-right: 20px !important; } }
      `}</style>

            <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} onNavigate={scrollTo} />

            <div style={{ fontFamily: "'Space Grotesk',sans-serif", background: VOID, color: WHITE, minHeight: "100vh", overflowX: "hidden" }}>
                <Nav onSearch={() => setSearchOpen(true)} />
                <Sidebar activeId={activeId} onNavigate={scrollTo} mobileOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
                <RightTOC activeId={activeId} onNavigate={scrollTo} />

                {/* Mobile topbar */}
                <div style={{ position: "fixed", top: "56px", left: 0, right: 0, zIndex: 40, background: DARK, borderBottom: "1px solid rgba(124,58,237,.15)", padding: "10px 16px", display: "flex", alignItems: "center", gap: "10px" }} className="lan-mobile-topbar">
                    <button onClick={() => setSidebarOpen(o => !o)} style={{ background: "rgba(124,58,237,.2)", border: "1px solid rgba(124,58,237,.3)", padding: "7px 10px", color: PURPLEL, cursor: "pointer", display: "flex", alignItems: "center", gap: "6px", fontSize: "11px", fontWeight: 700, fontFamily: "'Space Grotesk',sans-serif" }}>
                        <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" /></svg>
                        Menu
                    </button>
                    <span style={{ fontSize: "11px", color: MUTED, fontFamily: "'Space Grotesk',sans-serif" }}>LAN Library — Complete Documentation</span>
                    <style>{`@media(min-width:900px){ .lan-mobile-topbar{ display:none !important; } }`}</style>
                </div>

                {/* ── CONTENT ── */}
                <div className="lan-content" style={{ paddingTop: "56px" }}>

                    {/* ── HERO ── */}
                    <div style={{ background: DARK2, padding: "72px 64px 64px", position: "relative", overflow: "hidden", borderBottom: "1px solid rgba(124,58,237,.2)" }} className="lan-section-pad">
                        {/* glow */}
                        <div style={{ position: "absolute", top: "-100px", right: "-100px", width: "500px", height: "500px", borderRadius: "50%", background: "radial-gradient(circle, rgba(124,58,237,.15) 0%, transparent 70%)", pointerEvents: "none" }} />
                        <div style={{ position: "absolute", bottom: "-60px", left: "20%", width: "400px", height: "400px", borderRadius: "50%", background: "radial-gradient(circle, rgba(163,230,53,.06) 0%, transparent 70%)", pointerEvents: "none" }} />

                        <div style={{ position: "relative", zIndex: 2, maxWidth: "760px" }}>
                            <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "rgba(124,58,237,.2)", border: "1px solid rgba(124,58,237,.4)", padding: "5px 14px", marginBottom: "24px" }}>
                                <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: LIME, display: "inline-block", animation: "pulse 1.5s ease-in-out infinite" }} />
                                <span style={{ fontSize: "9px", fontWeight: 700, letterSpacing: ".16em", textTransform: "uppercase", color: PURPLEL, fontFamily: "'Space Grotesk',sans-serif" }}>Complete Platform Documentation</span>
                            </div>

                            <h1 style={{ fontFamily: "'Syne',sans-serif", fontSize: "clamp(36px,5vw,64px)", fontWeight: 800, color: WHITE, lineHeight: .95, letterSpacing: "-.04em", marginBottom: "20px" }}>
                                Everything About<br /><span style={{ color: LIME }}>LAN Library</span><span style={{ color: PURPLE }}>.</span>
                            </h1>

                            <p style={{ fontSize: "16px", color: MUTED, lineHeight: 1.85, maxWidth: "580px", marginBottom: "32px", fontFamily: "'Space Grotesk',sans-serif" }}>
                                The complete reference for Africa's #1 academic knowledge platform — from how documents are bought and sold, to AI tutoring, bounties, verified faculty, wallet payments, and the vision behind it all.
                            </p>

                            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "36px" }}>
                                {["128,000+ Docs", "40,000+ Students", "2,400+ Sellers", "200+ Universities", "Bounty Board", "AI Tutor", "Verified Faculty", "LAN Wallet"].map((tag, i) => (
                                    <Badge key={tag} accent={i % 3 === 0 ? PURPLEL : i % 3 === 1 ? LIME : undefined}>{tag}</Badge>
                                ))}
                            </div>

                            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                                <button onClick={() => scrollTo("overview")} style={{ padding: "12px 28px", background: LIME, color: VOID, fontSize: "11px", fontWeight: 800, letterSpacing: ".1em", textTransform: "uppercase", border: "none", cursor: "pointer", fontFamily: "'Space Grotesk',sans-serif", clipPath: "polygon(0 0, 94% 0, 100% 100%, 6% 100%)", transition: "background .15s" }}
                                    onMouseEnter={e => e.currentTarget.style.background = LIMEL}
                                    onMouseLeave={e => e.currentTarget.style.background = LIME}>
                                    Start Reading
                                </button>
                                <button onClick={() => setSearchOpen(true)} style={{ padding: "12px 24px", background: "transparent", color: WHITE, fontSize: "11px", fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", border: "1px solid rgba(248,248,255,.2)", cursor: "pointer", fontFamily: "'Space Grotesk',sans-serif", transition: "all .15s" }}
                                    onMouseEnter={e => { e.currentTarget.style.borderColor = PURPLEL; e.currentTarget.style.color = PURPLEL; }}
                                    onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(248,248,255,.2)"; e.currentTarget.style.color = WHITE; }}>
                                    Search Docs ctrl+K
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* ══ SECTION: OVERVIEW ══ */}
                    <section id="overview" style={{ padding: "80px 64px", borderBottom: "1px solid rgba(248,248,255,.06)" }} className="lan-section-pad">
                        <Label>Getting Started</Label>
                        <SectionH>What is LAN<br /><span style={{ color: LIME }}>Library?</span></SectionH>

                        <p style={{ fontSize: "16px", color: MUTED, lineHeight: 1.9, maxWidth: "720px", marginBottom: "28px", fontFamily: "'Space Grotesk',sans-serif", borderLeft: `3px solid ${PURPLE}`, paddingLeft: "18px" }}>
                            <strong><span style={{ color: LIME }}>LAN Library</span></strong> is a digital academic resource platform dedicated to connecting African students and educators with quality learning materials. Its  Africa's largest <strong style={{ color: WHITE }}>digital academic knowledge marketplace</strong> — a platform where students find and purchase study materials, educators publish and earn from their content, and the entire African knowledge economy is connected in one trusted place.
                            LAN Library is known as the "The Global Student Library", its Africa's first peer-to-peer digital knowledge marketplace where students buy affordable PDFs from educators, authors, and sellers — and where creators earn real money from their knowledge. <strong><span style={{ color: LIME }}>LAN Library is operated by Learning Access Network Ltd.</span></strong>
                        </p>

                        <p style={{ fontSize: "15px", color: MUTED, lineHeight: 1.9, maxWidth: "720px", marginBottom: "36px", fontFamily: "'Space Grotesk',sans-serif" }}>
                            Think of it as a digital library combined with a marketplace. Instead of physical shelves, digital collections. Instead of library cards, secure user accounts. Instead of borrowing — <strong style={{ color: WHITE }}>permanent ownership</strong> of everything you purchase.
                        </p>

                        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "40px" }}>
                            {["📚 Textbooks", "📝 Lecture Notes", "📋 Past Questions", "🔬 Research Papers", "📖 Study Guides", "📄 Course Outlines", "💼 Professional Manuals"].map(t => (
                                <Badge key={t}>{t}</Badge>
                            ))}
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "1px", background: "rgba(124,58,237,.1)" }}>
                            {[
                                { icon: "🔍", tag: "DISCOVER", title: "Find Any Academic Document", body: "Search 128,000+ documents by course code, university, department, year, or document type. Filters narrow to exactly what you need in seconds.", accent: PURPLE },
                                { icon: "💰", tag: "EARN", title: "Turn Knowledge into Income", body: "Upload your materials, set your price, earn 80% of every sale. Some student sellers earn ₦200,000+ monthly from their uploads alone.", accent: LIME },
                                { icon: "🎯", tag: "BOUNTIES", title: "Request What Doesn't Exist Yet", body: "Post a bounty with a reward. Verified sellers compete to fulfil your specific document request — usually within 24–72 hours.", accent: "#f59e0b" },
                                { icon: "🤖", tag: "AI TUTOR", title: "Document-Aware AI Assistant", body: "Powered by LAN — ask questions about your specific purchased books. Summaries, concept breakdowns, exam prep, worked examples.", accent: PURPLEL },
                            ].map(c => <FCard key={c.title} {...c} />)}
                        </div>
                    </section>

                    {/* ══ SECTION: VISION ══ */}
                    <section id="vision" style={{ padding: "80px 64px", background: DARK, borderBottom: "1px solid rgba(248,248,255,.06)" }} className="lan-section-pad">
                        <Label>Vision & Mission</Label>
                        <SectionH>Democratising<br /><span style={{ color: LIME }}>African Education.</span></SectionH>

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "40px", alignItems: "start" }} className="lan-2col">
                            <div>
                                <p style={{ fontSize: "15px", color: MUTED, lineHeight: 1.9, marginBottom: "24px", fontFamily: "'Space Grotesk',sans-serif" }}>
                                    LAN Library is not just about selling documents. It is about building a <strong style={{ color: WHITE }}>trusted digital library</strong> where knowledge is preserved, organised, and made accessible — where creators are fairly rewarded and learners are never priced out of education.
                                </p>
                                <p style={{ fontSize: "15px", color: MUTED, lineHeight: 1.9, marginBottom: "24px", fontFamily: "'Space Grotesk',sans-serif" }}>
                                    We started with Nigeria and built outward. Today LAN serves students across Ghana, Kenya, South Africa, Uganda, Tanzania, Rwanda, and a growing number of African markets. The content is African, the currency is local, and the problem being solved is deeply real.
                                </p>
                                <Callout icon="✦" label="The LAN Promise">
                                    Every student deserves access to the best study materials. Every educator deserves to earn from their expertise. Every document has real value — and that value should flow to the person who created it.
                                  <br/> <br/> LAN pictured a great school of technology where young men and young women could be taught how to succeed in life by developing the ability to THINK in practical rather than in theoretical terms
                                </Callout>
                            </div>
                            <div>
                                {[
                                    { icon: "🌍", title: "Democratising Education", body: "Students in remote areas access the same materials as those in major cities. Self-learners find resources previously locked in expensive institutions." },
                                    { icon: "💸", title: "Rewarding Knowledge Creators", body: "Teachers, researchers, and students who create valuable content earn fair compensation. Not a token amount — real income that grows with catalogue size." },
                                    { icon: "📈", title: "Building a Knowledge Economy", body: "When knowledge has real economic value, more people share it. LAN creates incentives that accelerate the African knowledge commons." },
                                    { icon: "🤝", title: "Africa-First Infrastructure", body: "Local currencies, local payment methods, local content — built for the reality of African students, not an afterthought of a global platform." },
                                ].map(item => (
                                    <div key={item.title} style={{ display: "flex", gap: "14px", marginBottom: "20px", padding: "16px", background: DARK2, border: "1px solid rgba(124,58,237,.1)", transition: "border-color .15s" }}
                                        onMouseEnter={e => e.currentTarget.style.borderColor = "rgba(124,58,237,.3)"}
                                        onMouseLeave={e => e.currentTarget.style.borderColor = "rgba(124,58,237,.1)"}>
                                        <span style={{ fontSize: "22px", flexShrink: 0 }}>{item.icon}</span>
                                        <div>
                                            <div style={{ fontSize: "13px", fontWeight: 700, color: WHITE, marginBottom: "5px", fontFamily: "'Space Grotesk',sans-serif" }}>{item.title}</div>
                                            <div style={{ fontSize: "12px", color: MUTED, lineHeight: 1.75, fontFamily: "'Space Grotesk',sans-serif" }}>{item.body}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <style>{`@media(max-width:768px){ .lan-2col{ grid-template-columns:1fr !important; } }`}</style>
                    </section>

                    {/* ══ SECTION: WHO BENEFITS ══ */}
                    <section id="who-benefits" style={{ padding: "80px 64px", borderBottom: "1px solid rgba(248,248,255,.06)" }} className="lan-section-pad">
                        <Label>Who It's For</Label>
                        <SectionH>Built for Everyone<br /><span style={{ color: LIME }}>Who Learns or Teaches.</span></SectionH>

                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: "16px", marginBottom: "40px" }}>
                            {[
                                { icon: "🎓", name: "Students & Learners", body: "Find study materials, past questions, textbooks and lecture notes for every course at every major African university — all in one searchable place.", accent: PURPLE },
                                { icon: "✍️", name: "Sellers & Creators", body: "Any student, graduate, or independent creator can upload, price, and sell academic materials. 80% of every sale goes directly to you.", accent: LIME },
                                { icon: "🏛️", name: "Faculty & Educators", body: "Lecturers, professors, Dr., Prof., Engr., Barr., Pharm. — get a Verified Faculty badge, reach students across Africa, and earn from your course materials.", accent: PURPLEL },
                                { icon: "💼", name: "Professionals", body: "Specialists in law, medicine, engineering, finance, and tech access certification study guides, professional manuals, and specialist references.", accent: "#f59e0b" },
                                { icon: "🔬", name: "Researchers", body: "Publish and monetise research papers, thesis work, literature reviews, and methodological guides. Your years of work can fund your next project.", accent: "#06b6d4" },
                                { icon: "🏫", name: "Institutions", body: "Universities, polytechnics, and training centres can partner with LAN to provide official course materials and distribute content to enrolled students at scale.", accent: "#ec4899" },
                            ].map(a => <ACard key={a.name} {...a} />)}
                        </div>
                    </section>

                    {/* ══ SECTION: DOCUMENT TYPES ══ */}
                    <section id="document-types" style={{ padding: "80px 64px", background: DARK, borderBottom: "1px solid rgba(248,248,255,.06)" }} className="lan-section-pad">
                        <Label>Document Marketplace</Label>
                        <SectionH>128,000+ Documents.<br /><span style={{ color: LIME }}>Every Type You Need.</span></SectionH>

                        <p style={{ fontSize: "15px", color: MUTED, lineHeight: 1.9, maxWidth: "680px", marginBottom: "40px", fontFamily: "'Space Grotesk',sans-serif" }}>
                            The LAN catalogue covers the full range of academic document types. Everything is tagged by institution, course code, department, year, and document type — making it searchable at a precision that generic web search cannot match.
                        </p>

                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: "1px", background: "rgba(124,58,237,.1)", marginBottom: "40px" }}>
                            {[
                                { icon: "📝", tag: "HIGHEST DEMAND", title: "Past Examination Questions", body: "Years of past papers for university courses, WAEC, NECO, JAMB, and professional certifications — often with model answers and marking schemes.", accent: "#ef4444" },
                                { icon: "📚", tag: "POPULAR", title: "Lecture & Class Notes", body: "Semester-by-semester course summaries, week-by-week breakdowns, concise topic notes from top students at every major institution.", accent: PURPLE },
                                { icon: "📖", tag: "PREMIUM", title: "Textbooks & Course Guides", body: "Full textbooks, abridged course texts, reading companions, and syllabi-aligned study guides across every academic discipline.", accent: PURPLEL },
                                { icon: "🔬", tag: "RESEARCH", title: "Papers & Thesis Work", body: "Journal articles, conference papers, undergraduate and postgraduate theses, literature reviews, and research methodology guides.", accent: "#06b6d4" },
                                { icon: "💼", tag: "PROFESSIONAL", title: "Certification Study Materials", body: "ACCA, ICAN, CFA, CIMA, bar exams, medical licensing, engineering professional certification — materials created by practitioners who passed.", accent: LIME },
                                { icon: "🛠️", tag: "PRACTICAL", title: "Manuals & Technical Guides", body: "Lab manuals, equipment operating guides, technical references, field study reports, and vocational training materials.", accent: "#f59e0b" },
                            ].map(c => <FCard key={c.title} {...c} />)}
                        </div>

                        <Callout icon="🔍" label="How Search Works">
                            LAN's search engine understands course codes, institution abbreviations, and academic terminology. Search "MEE 301 FUTA past questions" and get exactly that — not a generic mechanical engineering result. Filters refine by institution, year, document type, and price range.
                        </Callout>
                    </section>

                    {/* ══ SECTION: AI TUTOR ══ */}
                    <section id="ai-tutor" style={{ padding: "80px 64px", borderBottom: "1px solid rgba(248,248,255,.06)" }} className="lan-section-pad">
                        <Label>AI Tutor — Powered by LAN</Label>
                        <SectionH>Ask Anything About<br /><span style={{ color: LIME }}>Your Books.</span></SectionH>

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "48px", alignItems: "start" }} className="lan-2col">
                            <div>
                                <p style={{ fontSize: "15px", color: MUTED, lineHeight: 1.9, marginBottom: "20px", fontFamily: "'Space Grotesk',sans-serif" }}>
                                    The LAN AI Tutor is not a generic chatbot. It is a <strong style={{ color: WHITE }}>document-aware assistant</strong> that reads the specific books in your library and answers questions about their exact content.
                                    Every student on LAN gets access to AI Tutor sessions. Whether you are wrestling with a thermodynamics derivation at 2am, trying to understand a legal principle before a morning tutorial, or looking for a concise summary of a 400-page text before an exam, LAN AI Tutor is built for that moment
                                </p>
                                <Label>How AI Tutor Works with Your Library</Label>

                                <p style={{ fontSize: "15px", color: MUTED, lineHeight: 1.9, marginBottom: "28px", fontFamily: "'Space Grotesk',sans-serif" }}>
                                    When you open an AI Tutor session linked to a book in your library, the AI loads the document content and uses it as the primary reference for every answer. Ask it to explain a passage, and it pulls the exact section. Ask for a summary, and it synthesises the author's own words. Ask a question not directly in the text, and it reasons from the material to give you the most accurate answer possible.
                                </p>
                                <p style={{ fontSize: "15px", color: MUTED, lineHeight: 1.9, marginBottom: "28px", fontFamily: "'Space Grotesk',sans-serif" }}>
                                This document-aware approach is what separates LAN AI Tutor from generic AI assistants. The AI does not guess or hallucinate generic answers — it reasons from your specific study material. The result is answers that match the terminology, framework, and examples your lecturer and textbook actually use, which is precisely what exam performance depends on.
                                </p>
                                <p style={{ fontSize: "15px", color: MUTED, lineHeight: 1.9, marginBottom: "28px", fontFamily: "'Space Grotesk',sans-serif" }}>
                              To start a session, go to your Library tab, select a book, and tap "Ask AI Tutor." Alternatively, open AI Tutor from the navigation and choose a book from your collection. Your session history is saved so you can continue where you left off across devices.
                                </p>
                                <p style={{ fontSize: "15px", color: MUTED, lineHeight: 1.9, marginBottom: "28px", fontFamily: "'Space Grotesk',sans-serif" }}>
                                    Ask it to explain a passage and it pulls the exact section. Ask for a summary and it synthesises the author's own words. Ask an exam question and it reasons from your specific study material — matching the terminology your lecturer and textbook actually use. 
                                </p>

                                {[
                                    ["Concept Explanations", "\"Explain the difference between mitosis and meiosis as described in Chapter 4.\""],
                                    ["Exam Question Generation", "\"Create 5 exam-style questions from Chapter 7 then answer them with mark schemes.\""],
                                    ["Passage Breakdown", "\"I don't understand the derivation on page 83 — walk me through it step by step.\""],
                                    ["Revision Summaries", "\"Summarise the 10 most important concepts across all my library books for this topic.\""],
                                ].map(([title, example]) => (
                                    <div key={title} style={{ marginBottom: "16px", padding: "14px 16px", background: DARK2, border: "1px solid rgba(124,58,237,.15)", borderLeft: `2px solid ${PURPLE}` }}>
                                        <div style={{ fontSize: "11px", fontWeight: 700, color: PURPLEL, marginBottom: "6px", fontFamily: "'Space Grotesk',sans-serif", letterSpacing: ".08em", textTransform: "uppercase" }}>{title}</div>
                                        <div style={{ fontSize: "12px", color: "rgba(163,230,53,.7)", fontFamily: "'Space Grotesk',sans-serif", fontStyle: "italic" }}>{example}</div>
                                    </div>
                                ))}
                            </div>
                            <div>
                                <div style={{ background: DARK, border: "1px solid rgba(124,58,237,.25)", overflow: "hidden" }}>
                                    <div style={{ background: DARK2, padding: "12px 16px", borderBottom: "1px solid rgba(124,58,237,.15)", display: "flex", alignItems: "center", gap: "8px" }}>
                                        <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#ef4444" }} />
                                        <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#f59e0b" }} />
                                        <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: LIME }} />
                                        <span style={{ marginLeft: "8px", fontSize: "11px", color: MUTED, fontFamily: "'Space Grotesk',sans-serif" }}>AI Tutor — Biochemistry 400L Notes.pdf</span>
                                    </div>
                                    {[
                                        { role: "user", msg: "Summarise the key mechanisms of enzyme inhibition covered in this chapter." },
                                        { role: "ai", msg: "This chapter covers three main mechanisms: competitive inhibition (inhibitor competes for the active site, overcome by increasing substrate), non-competitive inhibition (binds allosteric site, reduces Vmax), and uncompetitive inhibition (only binds enzyme-substrate complex). The chapter emphasises that competitive inhibition changes apparent Km while leaving Vmax unchanged — a common exam distinction." },
                                        { role: "user", msg: "Generate an exam question on this for me." },
                                        { role: "ai", msg: "\"A new drug is found to reduce the Vmax of an enzyme by 40% regardless of substrate concentration. What type of inhibition is this, and what would a Lineweaver-Burk plot reveal?\" [Non-competitive inhibition; parallel lines with lower y-intercept]" },
                                    ].map((m, i) => (
                                        <div key={i} style={{ padding: "12px 16px", borderBottom: "1px solid rgba(248,248,255,.04)", display: "flex", gap: "10px", alignItems: "flex-start" }}>
                                            <div style={{ width: "26px", height: "26px", borderRadius: "50%", background: m.role === "user" ? "rgba(124,58,237,.3)" : "rgba(163,230,53,.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", flexShrink: 0, fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, color: m.role === "user" ? PURPLEL : LIME }}>
                                                {m.role === "user" ? "S" : "AI"}
                                            </div>
                                            <p style={{ fontSize: "12px", color: m.role === "user" ? WHITE : MUTED, lineHeight: 1.7, fontFamily: "'Space Grotesk',sans-serif", margin: 0 }}>{m.msg}</p>
                                        </div>
                                    ))}
                                    <div style={{ padding: "12px 16px", display: "flex", gap: "8px", borderTop: "1px solid rgba(248,248,255,.06)" }}>
                                        <div style={{ flex: 1, background: DARK2, border: "1px solid rgba(124,58,237,.2)", padding: "9px 14px", fontSize: "12px", color: MUTED, fontFamily: "'Space Grotesk',sans-serif" }}>Ask about Biochemistry 400l Notes…</div>
                                        <div style={{ width: "36px", height: "36px", background: LIME, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}>
                                            <svg width="14" height="14" fill="none" stroke={VOID} strokeWidth="2.5" viewBox="0 0 24 24"><path d="M22 2L11 13M22 2L15 22 11 13 2 9l20-7z" /></svg>
                                        </div>
                                    </div>
                                </div>
                                <Link href="/ai-chat" style={{ display: "block", marginTop: "12px", padding: "13px 24px", background: PURPLE, color: WHITE, fontSize: "11px", fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", textDecoration: "none", fontFamily: "'Space Grotesk',sans-serif", textAlign: "center", transition: "background .15s" }}
                                    onMouseEnter={e => e.currentTarget.style.background = PURPLED}
                                    onMouseLeave={e => e.currentTarget.style.background = PURPLE}>
                                    Start AI Tutor Session →
                                </Link>
                            </div>
                        </div>
                    </section>

                    {/* ══ SECTION: BOUNTY BOARD ══ */}
                    <section id="bounty" style={{ padding: "80px 64px", background: DARK, borderBottom: "1px solid rgba(248,248,255,.06)" }} className="lan-section-pad">
                        <Label>Bounty Board</Label>
                        <SectionH>Can't Find It?<br /><span style={{ color: LIME }}>Request It.</span></SectionH>

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "48px", alignItems: "start" }} className="lan-2col">
                            <div>
                                <p style={{ fontSize: "15px", color: MUTED, lineHeight: 1.9, marginBottom: "28px", fontFamily: "'Space Grotesk',sans-serif" }}>
                                    The Bounty Board is LAN's <strong style={{ color: WHITE }}>live request marketplace</strong>. If you need a specific document that doesn't exist on the platform, post a bounty with a reward — verified sellers compete to fulfil it.
                                </p>
                                <p style={{ fontSize: "15px", color: MUTED, lineHeight: 1.9, marginBottom: "28px", fontFamily: "'Space Grotesk',sans-serif" }}>
                                    The Bounty Board lets you earn cash by creating materials students specifically request. Find bounties that match your expertise, complete them, and get paid instantly.
                                </p>
                                <p style={{ fontSize: "15px", color: MUTED, lineHeight: 1.9, marginBottom: "28px", fontFamily: "'Space Grotesk',sans-serif" }}>
                                The LAN Library Bounty Board is a community-powered marketplace that connects students who need specific study materials with authors and lecturers who can create them — with automatic, transparent payouts for everyone involved. 
                               The process runs in three stages: a student posts a request and funds it, an author fulfils the request by uploading the asset, and the platform automatically splits and releases the payment.
                                </p>
                                <div style={{ position: "relative" }}>
                                    <div style={{ position: "absolute", left: "22px", top: "28px", bottom: "28px", width: "2px", background: "rgba(124,58,237,.2)" }} />
                                    {[
                                        { num: "1", icon: "📋", title: "Post a Bounty", body: "Describe the exact document you need — course code, institution, year, type. Set a reward amount that goes into escrow immediately." },
                                        { num: "2", icon: "🏃", title: "Sellers Compete", body: "Verified sellers with matching materials see your request instantly. Multiple sellers may submit — you choose the best match." },
                                        { num: "3", icon: "✅", title: "Confirm & Pay", body: "Review the submitted document. If it matches your request, confirm — the escrow reward releases to the seller automatically." },
                                    ].map((s, i) => <Step key={s.num} {...s} isFirst={i === 0} isLast={i === 2} />)}
                                </div>
                                <div style={{ display: "flex", gap: "24px", marginTop: "28px", padding: "20px 24px", background: "rgba(163,230,53,.07)", border: "1px solid rgba(163,230,53,.2)" }}>
                                    <div><div style={{ fontFamily: "'Syne',sans-serif", fontSize: "28px", fontWeight: 800, color: LIME }}>2,400+</div><div style={{ fontSize: "9px", fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", color: MUTED, fontFamily: "'Space Grotesk',sans-serif" }}>Active bounties</div></div>
                                    <div style={{ width: "1px", background: "rgba(163,230,53,.2)" }} />
                                    <div><div style={{ fontFamily: "'Syne',sans-serif", fontSize: "28px", fontWeight: 800, color: LIME }}>24–72h</div><div style={{ fontSize: "9px", fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", color: MUTED, fontFamily: "'Space Grotesk',sans-serif" }}>Average fill time</div></div>
                                    <div style={{ width: "1px", background: "rgba(163,230,53,.2)" }} />
                                    <div><div style={{ fontFamily: "'Syne',sans-serif", fontSize: "28px", fontWeight: 800, color: LIME }}>₦500+</div><div style={{ fontSize: "9px", fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", color: MUTED, fontFamily: "'Space Grotesk',sans-serif" }}>Minimum reward</div></div>
                                </div>
                            </div>

                            <div style={{ background: DARK2, border: "1px solid rgba(124,58,237,.25)", overflow: "hidden" }}>
                                <div style={{ padding: "12px 18px", borderBottom: "1px solid rgba(124,58,237,.15)", display: "flex", alignItems: "center", gap: "8px" }}>
                                    <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#ef4444" }} />
                                    <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#f59e0b" }} />
                                    <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: LIME }} />
                                    <span style={{ marginLeft: "8px", fontSize: "11px", color: MUTED, fontFamily: "'Space Grotesk',sans-serif" }}>Live Bounty Board</span>
                                </div>
                                {[
                                    { school: "UNILAG", dept: "Medicine · 500L", title: "MBBS Finals Past Questions 2019–2023", reward: "₦15,000", status: "🔥 Hot", col: "#ef4444" },
                                    { school: "OAU", dept: "Engineering · 400L", title: "Structural Analysis II Lecture Notes", reward: "₦8,500", status: "⏳ Open", col: "#f59e0b" },
                                    { school: "ABU", dept: "Law · 300L", title: "Constitutional Law Course Outline", reward: "₦6,000", status: "🆕 New", col: LIME },
                                    { school: "UI", dept: "Economics · 200L", title: "Microeconomics Tutorial Qs 2020–2022", reward: "₦4,500", status: "⏳ Open", col: "#f59e0b" },
                                    { school: "FUTA", dept: "CS · 300L", title: "Data Structures Full Lecture Slides", reward: "₦7,200", status: "🔥 Hot", col: "#ef4444" },
                                ].map((b, i) => (
                                    <div key={i} style={{ padding: "14px 18px", borderBottom: "1px solid rgba(248,248,255,.05)", display: "flex", gap: "12px", alignItems: "center", cursor: "pointer", transition: "background .12s" }}
                                        onMouseEnter={e => e.currentTarget.style.background = "rgba(124,58,237,.08)"}
                                        onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ display: "flex", gap: "6px", marginBottom: "5px" }}>
                                                <span style={{ fontSize: "9px", fontWeight: 700, background: "rgba(124,58,237,.2)", color: PURPLEL, padding: "2px 7px", fontFamily: "'Space Grotesk',sans-serif" }}>{b.school}</span>
                                                <span style={{ fontSize: "9px", color: MUTED, fontFamily: "'Space Grotesk',sans-serif" }}>{b.dept}</span>
                                            </div>
                                            <div style={{ fontSize: "12px", fontWeight: 600, color: WHITE, lineHeight: 1.4, fontFamily: "'Space Grotesk',sans-serif" }}>{b.title}</div>
                                        </div>
                                        <div style={{ textAlign: "right", flexShrink: 0 }}>
                                            <div style={{ fontFamily: "'Syne',sans-serif", fontSize: "15px", fontWeight: 800, color: LIME }}>{b.reward}</div>
                                            <div style={{ fontSize: "9px", fontWeight: 700, color: b.col, fontFamily: "'Space Grotesk',sans-serif" }}>{b.status}</div>
                                        </div>
                                    </div>
                                ))}
                                <Link href="/academic/bounty/board" style={{ display: "block", padding: "14px", textAlign: "center", fontSize: "11px", color: PURPLEL, fontWeight: 600, fontFamily: "'Space Grotesk',sans-serif", textDecoration: "none", borderTop: "1px solid rgba(124,58,237,.15)", background: "rgba(124,58,237,.05)", transition: "background .12s" }}
                                    onMouseEnter={e => e.currentTarget.style.background = "rgba(124,58,237,.12)"}
                                    onMouseLeave={e => e.currentTarget.style.background = "rgba(124,58,237,.05)"}>
                                    View all 2,400+ active bounties →
                                </Link>
                            </div>
                        </div>
                    </section>

                    {/* ══ SECTION: SELLERS ══ */}
                    <section id="sellers" style={{ padding: "80px 64px", borderBottom: "1px solid rgba(248,248,255,.06)" }} className="lan-section-pad">
                        <Label>For Sellers & Creators</Label>
                        <SectionH>Upload Once.<br /><span style={{ color: LIME }}>Earn Forever.</span></SectionH>

                        <p style={{ fontSize: "15px", color: MUTED, lineHeight: 1.9, maxWidth: "680px", marginBottom: "40px", fontFamily: "'Space Grotesk',sans-serif" }}>
                            Any student, graduate, tutor, or independent creator can become a seller on LAN. There are no educational prerequisites, no institutional affiliations required, and no upfront fees. You upload, set a price, and earn 80% of every sale — immediately, permanently.
                        </p>

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "40px", marginBottom: "40px" }} className="lan-2col">
                            <div>
                                <div style={{ position: "relative" }}>
                                    <div style={{ position: "absolute", left: "22px", top: "28px", bottom: "28px", width: "2px", background: "rgba(124,58,237,.2)" }} />
                                    {[
                                        { num: "1", icon: "✉️", title: "Create a Seller Account", body: "Complete your seller profile — name, title, institution, faculty. Sellers with complete profiles convert 3× more viewers to buyers." },
                                        { num: "2", icon: "📤", title: "Upload Your Documents", body: "PDF, DOCX, or image formats. Add course code, institution, subject, year. Strong metadata = 4× more organic search traffic." },
                                        { num: "3", icon: "💲", title: "Set Your Price", body: "You control pricing. Past question papers typically ₦500–₦3,000. Comprehensive semester notes ₦2,000–₦8,000. Professional cert guides ₦5,000–₦50,000." },
                                        { num: "4", icon: "🚀", title: "Pass Quality Review (24–48h)", body: "LAN reviews every upload for originality, accuracy, and quality. Gold/Platinum sellers get priority review within 6–12 hours." },
                                        { num: "5", icon: "💰", title: "Earn 80% of Every Sale", body: "Earnings credit to your wallet instantly. Withdraw to any Nigerian bank, MTN MoMo, M-Pesa, or mobile money across Africa." },
                                    ].map((s, i) => <Step key={s.num} {...s} isFirst={i === 0} isLast={i === 4} />)}
                                </div>
                            </div>

                            <div>
                                <div style={{ background: DARK, border: "1px solid rgba(124,58,237,.2)", padding: "28px", marginBottom: "16px" }}>
                                    <div style={{ fontSize: "9px", fontWeight: 700, letterSpacing: ".18em", textTransform: "uppercase", color: PURPLEL, marginBottom: "12px", fontFamily: "'Space Grotesk',sans-serif" }}>Seller Tiers</div>
                                    {[
                                        { tier: "Bronze", color: "#cd7f32", desc: "New sellers. Small withdrawal fee. Access all core tools." },
                                        { tier: "Silver", color: "#aaa", desc: "Zero withdrawal fees. Priority upload queue." },
                                        { tier: "Gold", color: GOLD, desc: "Priority review (6–12h). Promoted listing eligibility. Featured in campaigns." },
                                        { tier: "Platinum", color: LIME, desc: "Dedicated account manager. Instant withdrawals. Maximum platform priority." },
                                    ].map(t => (
                                        <div key={t.tier} style={{ display: "flex", gap: "12px", alignItems: "flex-start", padding: "10px 0", borderBottom: "1px solid rgba(248,248,255,.05)" }}>
                                            <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: t.color, flexShrink: 0, marginTop: "4px" }} />
                                            <div>
                                                <span style={{ fontSize: "12px", fontWeight: 700, color: t.color, fontFamily: "'Space Grotesk',sans-serif" }}>{t.tier} </span>
                                                <span style={{ fontSize: "12px", color: MUTED, fontFamily: "'Space Grotesk',sans-serif" }}>— {t.desc}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div style={{ background: "linear-gradient(135deg, rgba(124,58,237,.15), rgba(163,230,53,.1))", border: "1px solid rgba(124,58,237,.3)", padding: "24px" }}>
                                    <div style={{ fontFamily: "'Syne',sans-serif", fontSize: "36px", fontWeight: 800, color: LIME, marginBottom: "4px" }}>₦200,000</div>
                                    <div style={{ fontSize: "9px", fontWeight: 700, letterSpacing: ".14em", textTransform: "uppercase", color: MUTED, fontFamily: "'Space Grotesk',sans-serif", marginBottom: "12px" }}>Average Top Seller / Month</div>
                                    <p style={{ fontSize: "12px", color: MUTED, lineHeight: 1.75, fontFamily: "'Space Grotesk',sans-serif", margin: 0 }}>Top sellers maintain catalogues of 100+ documents, engage actively with the Bounty Board, and generate consistent passive income throughout the academic year.</p>
                                </div>
                                <Link href="/become-seller" style={{ display: "block", marginTop: "12px", padding: "14px 24px", background: LIME, color: VOID, fontSize: "11px", fontWeight: 800, letterSpacing: ".1em", textTransform: "uppercase", textDecoration: "none", fontFamily: "'Space Grotesk',sans-serif", textAlign: "center", clipPath: "polygon(0 0, 96% 0, 100% 100%, 4% 100%)", transition: "background .15s" }}
                                    onMouseEnter={e => e.currentTarget.style.background = LIMEL}
                                    onMouseLeave={e => e.currentTarget.style.background = LIME}>
                                    Start Selling Now →
                                </Link>
                            </div>
                        </div>
                    </section>

                    <section id="dashboard" style={{ padding: "80px 64px", borderBottom: "1px solid rgba(248,248,255,.06)" }} className="lan-section-pad">
                        <Label>LAN Seller</Label>
                        <SectionH>Seller<br /><span style={{ color: LIME }}> Dashboard.</span></SectionH>
                         <Callout icon="✦" label="What is Verified Faculty?">
                            Real-time earnings, per-document analytics, catalogue management, and full financial control — all from one screen.                        
                            </Callout>
                        <p style={{ fontSize: "15px", color: MUTED, lineHeight: 1.9, maxWidth: "680px", marginBottom: "20px", fontFamily: "'Space Grotesk',sans-serif" }}>
                            The LAN Seller Dashboard is your complete command centre for managing your document business on the platform. Every sale, every document view, every referral conversion, every withdrawal, and every item in your catalogue is tracked, displayed, and actionable from a single interface that updates in real time.                       
                             </p>
                               <p style={{ fontSize: "15px", color: MUTED, lineHeight: 1.9, maxWidth: "680px", marginBottom: "40px", fontFamily: "'Space Grotesk',sans-serif" }}>
                            The sellers who generate the highest consistent income on LAN are not always those with the best content — they are those who understand their performance data and act on it. The dashboard is what makes that possible.                             
                            </p>
                             <Callout icon="✦" label="Earnings Overview: Reading Your Numbers">
                            </Callout>
                              <p style={{ fontSize: "15px", color: MUTED, lineHeight: 1.9, maxWidth: "680px", marginBottom: "10px", fontFamily: "'Space Grotesk',sans-serif" }}>
                            The earnings overview panel is the first thing you see when you open your Seller Dashboard. At the summary level, it shows your total lifetime earnings, your current month earnings with a trend line by day, your available wallet balance ready for withdrawal, and your projected month-end earnings based on current-month trajectory.
                            Beneath the summary panel, a revenue chart breaks down earnings by document, by buyer institution or location, and by time period. You can switch between weekly, monthly, quarterly, and annual views. The chart answers the questions sellers ask most often: which documents are generating the most revenue, where buyers are coming from geographically, and whether income is trending up or plateauing.
                            Every sale generates an immediate credit entry in your transaction ledger — the document title, the buyer's approximate region, the transaction amount, and your 80% payout are all recorded and visible. The ledger can be filtered and exported, making it straightforward to reconcile your LAN income with your broader personal financial records.                         
                               </p>
                                <p style={{ fontSize: "15px", color: LIMEL, marginBottom: "24px", fontFamily: "'Space Grotesk',sans-serif" }}>
                                    <a href="/seller/seller-dashboard" target="_bank">Read more </a>
                                </p>
                        </section>

                     <section id="withdraw" style={{ padding: "80px 64px", borderBottom: "1px solid rgba(248,248,255,.06)" }} className="lan-section-pad">
                        <Label>Withdraw Your Earnings</Label>
                        <SectionH>Your money.<br /><span style={{ color: LIME }}>Your account.</span></SectionH>
                         <Callout icon="✦" label="What is Verified Faculty?">
                            Your money. Your account. Bank transfers and mobile money across Africa — processed within 24 hours.
                        </Callout>

                        <p style={{ fontSize: "15px", color: MUTED, lineHeight: 1.9, maxWidth: "680px", marginBottom: "40px", fontFamily: "'Space Grotesk',sans-serif" }}>
                        The LAN withdrawal system was built to serve the financial reality of African sellers — not the assumption of a single banking system. A seller in Lagos withdrawing to a Nigerian bank account, a seller in Accra using MTN Mobile Money, a seller in Nairobi transferring to M-Pesa, a seller in Johannesburg receiving funds at a South African commercial bank: all of these are first-class, equally supported withdrawal experiences on LAN.                        </p>
                        <p style={{ fontSize: "15px", color: MUTED, lineHeight: 1.9, maxWidth: "680px", marginBottom: "40px", fontFamily: "'Space Grotesk',sans-serif" }}>
                        The money in your wallet is yours, and moving it to wherever you need it should be fast, transparent, and as close to fee-free as your seller tier allows.
                        </p>
                        <Label>How to Initiate a Withdrawal</Label>
                         <p style={{ fontSize: "15px", color: MUTED, lineHeight: 1.9, maxWidth: "680px", marginBottom: "15px", fontFamily: "'Space Grotesk',sans-serif" }}>
                        Withdrawals are initiated from the Wallet section of your Seller Dashboard. The process is designed to complete in under 60 seconds once you have a bank account or mobile money number linked.
                        Open your dashboard and navigate to Wallet, then select Withdraw Earnings. Enter the amount you want to withdraw — the minimum is the equivalent of USD 2.50 in your local currency. Confirm your linked account details on the preview screen, then authenticate the withdrawal with your 4-digit Transfer PIN. You receive an immediate in-app notification confirming the request, and a second notification when the transfer is complete.
                        If you have not yet linked a bank account or mobile money number, you will be prompted to add one before your first withdrawal. You can link up to three accounts and specify which one receives each withdrawal. Switching between linked accounts is available on the withdrawal confirmation screen without requiring a settings change. 
                        </p>
                        <p style={{ fontSize: "15px", color: LIMEL, marginBottom: "24px", fontFamily: "'Space Grotesk',sans-serif" }}>
                                    <a href="/seller/recharge-services" target="_bank">Read more </a>
                                </p>
                        </section>


                    {/* ══ SECTION: FACULTY ══ */}
                    <section id="faculty" style={{ padding: "80px 64px", background: DARK, borderBottom: "1px solid rgba(248,248,255,.06)" }} className="lan-section-pad">
                        <Label>Faculty & Educators</Label>
                        <SectionH>Verified Faculty.<br /><span style={{ color: LIME }}>Credentialed. Trusted.</span></SectionH>

                        <p style={{ fontSize: "15px", color: MUTED, lineHeight: 1.9, maxWidth: "680px", marginBottom: "32px", fontFamily: "'Space Grotesk',sans-serif" }}>
                            LAN recognises that many of its sellers are not just content creators — they are <strong style={{ color: WHITE }}>qualified professionals, academics, and licensed practitioners</strong> whose credentials add real credibility to the documents they publish. Sellers with professional titles receive a <strong style={{ color: PURPLEL }}>Verified Faculty</strong> badge instead of the standard Verified Seller label.
                       
                                <p style={{ fontSize: "15px", color: LIMEL, marginBottom: "24px", fontFamily: "'Space Grotesk',sans-serif" }}>
                                    <a href="/faculty/verify" target="_bank">Read full content... </a>
                                </p>
                        </p>
                        <Callout icon="✦" label="What is Verified Faculty?">
                            When a seller's profile carries a recognised professional title — Dr., Prof., Engr., Lecturer, Barr., or Pharm. — their account is automatically designated <strong style={{ color: WHITE }}>Verified Faculty</strong>. This signals to buyers that the content comes from a credentialed source, increasing trust and conversion.
                        </Callout>

                        <div style={{ marginBottom: "40px" }}>
                            <div style={{ fontSize: "10px", fontWeight: 700, letterSpacing: ".18em", textTransform: "uppercase", color: PURPLEL, marginBottom: "16px", fontFamily: "'Space Grotesk',sans-serif" }}>Recognised Professional Titles</div>
                            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                                {["Dr. — Doctor", "Prof. — Professor", "Engr. — Engineer", "Pharm. — Pharmacist", "Barr. — Barrister", "Lecturer"].map(t => (
                                    <Badge key={t} accent={PURPLEL}>{t}</Badge>
                                ))}
                            </div>
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: "16px", marginBottom: "40px" }}>
                            {[
                                { icon: "🎓", name: "Academics & Professors", body: "University lecturers, professors, and academic researchers who publish course materials, textbooks, and research findings." },
                                { icon: "⚖️", name: "Legal Practitioners", body: "Barristers sharing case studies, legal guides, law notes, and bar examination preparation resources." },
                                { icon: "⚙️", name: "Engineers", body: "Civil, electrical, mechanical, and software engineers sharing technical manuals and study materials." },
                                { icon: "💊", name: "Medical & Pharmacy", body: "Healthcare practitioners publishing clinical guides, pharmacology references, and professional study resources." },
                                { icon: "🏫", name: "Lecturers", body: "Teaching staff at colleges, polytechnics, and universities uploading structured course content and syllabi." },
                                { icon: "📊", name: "Finance & Accounting", body: "Chartered accountants, financial analysts, and banking professionals sharing professional study guides." },
                            ].map(a => <ACard key={a.name} {...a} />)}
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: "1px", background: "rgba(124,58,237,.1)" }}>
                            {[
                                { icon: "🏅", tag: "TRUST", title: "Increased Buyer Confidence", body: "Buyers immediately see the document comes from a credentialed professional, making purchase decisions easier and reducing hesitation.", accent: PURPLEL },
                                { icon: "🔝", tag: "VISIBILITY", title: "Featured Placement", body: "Verified Faculty sellers receive priority placement in search results and featured sections — your credentials translate directly into platform visibility.", accent: LIME },
                                { icon: "📊", tag: "TOOLS", title: "Faculty Analytics Tools", body: "Access additional seller tools including Student List Export — download CSV reports of buyers for your content to understand your reach.", accent: "#06b6d4" },
                                { icon: "🌍", tag: "REACH", title: "Continent-Wide Distribution", body: "Your materials reach students across 20+ African countries simultaneously. One upload, continent-wide impact.", accent: "#f59e0b" },
                            ].map(c => <FCard key={c.title} {...c} />)}
                        </div>
                    </section>


                    {/* ══ SECTION: WALLET ══ */}
                    <section id="wallet" style={{ padding: "80px 64px", borderBottom: "1px solid rgba(248,248,255,.06)" }} className="lan-section-pad">
                        <Label>LAN Wallet & Payments</Label>
                        <SectionH>Recharge <br /><span style={{ color: LIME }}>Services.</span></SectionH>
                          <Callout icon="" label="Convert your document earnings into everyday utilities — airtime, data, electricity, and cable TV — directly from your wallet, across Africa."></Callout>

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "48px" }} className="lan-2col">
                            <div>
                                <p style={{ fontSize: "15px", color: MUTED, lineHeight: 1.9, marginBottom: "24px", fontFamily: "'Space Grotesk',sans-serif" }}>
                                    For sellers who want to extract maximum value from their earnings without the friction of multiple transfers, Recharge Services is the most direct path from document sale to real-world value.  
                                    </p>                              
                                     <p style={{ fontSize: "15px", color: MUTED, lineHeight: 1.9, marginBottom: "24px", fontFamily: "'Space Grotesk',sans-serif" }}>
                                    LAN Recharge Services turns your wallet into a direct payment channel for the utilities you use every day. Instead of withdrawing your document income to a bank account and then separately purchasing airtime or paying your electricity bill, Recharge Services lets you do both in a single platform — at rates that are often more competitive than retail alternatives.                                </p>
                                  <p style={{ fontSize: "15px", color: LIMEL, lineHeight: 1.9, marginBottom: "24px", fontFamily: "'Space Grotesk',sans-serif" }}>
                                    <a href="/seller/recharge-services" target="_bank">Read more </a>
                                </p>
                                {[
                                    { icon: "⚡", title: "Instant Earnings Credits", body: "Sale confirmed → wallet credited within seconds. Track every transaction in real time with a full transaction ledger." },
                                    { icon: "🏦", title: "Withdraw to Any African Bank", body: "All major Nigerian banks, MTN MoMo, M-Pesa, AirtelTigo Money, and more. Processed within 24 hours on business days." },
                                    { icon: "📱", title: "Recharge Services", body: "Pay airtime, data bundles (at wholesale SME rates — 30–40% cheaper than retail), electricity, and DSTV directly from your wallet." },
                                    { icon: "🔄", title: "Peer-to-Peer Transfers", body: "Send wallet balance to any other LAN account. Split earnings with collaborators, settle bounty rewards instantly." },
                                    { icon: "🛡️", title: "PIN-Protected Security", body: "Two-layer security: account password + 4-digit Transfer PIN required for every outflow. One layer compromised doesn't expose your funds." },
                                ].map(item => (
                                    <div key={item.title} style={{ display: "flex", gap: "14px", marginBottom: "16px", alignItems: "flex-start" }}>
                                        <div style={{ width: "32px", height: "32px", background: "rgba(124,58,237,.2)", border: "1px solid rgba(124,58,237,.3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px", flexShrink: 0 }}>{item.icon}</div>
                                        <div>
                                            <div style={{ fontSize: "13px", fontWeight: 700, color: WHITE, marginBottom: "4px", fontFamily: "'Space Grotesk',sans-serif" }}>{item.title}</div>
                                            <div style={{ fontSize: "12px", color: MUTED, lineHeight: 1.7, fontFamily: "'Space Grotesk',sans-serif" }}>{item.body}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div>
                                <div style={{ background: DARK, border: "1px solid rgba(124,58,237,.2)", padding: "24px", marginBottom: "16px" }}>
                                    <div style={{ fontSize: "9px", fontWeight: 700, letterSpacing: ".18em", textTransform: "uppercase", color: PURPLEL, marginBottom: "16px", fontFamily: "'Space Grotesk',sans-serif" }}>Withdrawal Fees by Tier</div>
                                    {[
                                        { tier: "Bronze", fee: "₦100 flat fee", col: "#cd7f32" },
                                        { tier: "Silver", fee: "Zero fees", col: "#aaa" },
                                        { tier: "Gold", fee: "Zero fees + priority same-day", col: GOLD },
                                        { tier: "Platinum", fee: "Zero fees + near-instant", col: LIME },
                                    ].map(t => (
                                        <div key={t.tier} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid rgba(248,248,255,.05)" }}>
                                            <span style={{ fontSize: "12px", fontWeight: 700, color: t.col, fontFamily: "'Space Grotesk',sans-serif" }}>{t.tier}</span>
                                            <span style={{ fontSize: "12px", color: MUTED, fontFamily: "'Space Grotesk',sans-serif" }}>{t.fee}</span>
                                        </div>
                                    ))}
                                </div>
                                <div style={{ background: DARK, border: "1px solid rgba(124,58,237,.2)", padding: "24px" }}>
                                    <div style={{ fontSize: "9px", fontWeight: 700, letterSpacing: ".18em", textTransform: "uppercase", color: PURPLEL, marginBottom: "16px", fontFamily: "'Space Grotesk',sans-serif" }}>Recharge Services — Supported</div>
                                    {[
                                        ["📱 Airtime", "MTN, Airtel, Glo, 9mobile (NG) · MTN, AirtelTigo, Vodafone (GH) · Safaricom, Airtel (KE)"],
                                        ["📶 Data Bundles", "Wholesale SME rates — 30–40% cheaper than retail on all major networks"],
                                        ["⚡ Electricity", "All 10 Nigerian DISCOs · Kenya Power · ECG Ghana"],
                                        ["📺 Cable TV", "DSTV · GOTV · Startimes — all packages, all markets"],
                                    ].map(([label, body]) => (
                                        <div key={label} style={{ marginBottom: "12px" }}>
                                            <div style={{ fontSize: "11px", fontWeight: 700, color: WHITE, marginBottom: "3px", fontFamily: "'Space Grotesk',sans-serif" }}>{label}</div>
                                            <div style={{ fontSize: "11px", color: MUTED, lineHeight: 1.6, fontFamily: "'Space Grotesk',sans-serif" }}>{body}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </section>

                        <section id="earning hub" style={{ padding: "80px 64px", background: DARK, borderBottom: "1px solid rgba(248,248,255,.06)" }} className="lan-section-pad">
                        <Label>SELLER GUIDE</Label>
                        <SectionH>Your <br /><span style={{ color: LIME }}>LAN Wallet.</span></SectionH>
                              <Callout icon="" label="Your earnings hub · Africa.">
                        Your earnings hub — where every sale lands instantly, ready to withdraw, spend, or transfer across Africa.                        </Callout>
                        <p style={{ fontSize: "15px", color: MUTED, lineHeight: 1.9, marginBottom: "24px", fontFamily: "'Space Grotesk',sans-serif" }}>
                            The LAN Wallet is the financial core of your seller account. Every naira, cedi, shilling, or rand equivalent you earn from document sales lands here immediately. Every referral commission is credited here. Every Bounty reward is deposited here. And from here, you can move your money out in any direction that suits you — bank transfer, mobile money, or direct utility payment through Recharge Services.                        
                              </p>
                           <p style={{ fontSize: "15px", color: MUTED, lineHeight: 1.9, marginBottom: "24px", fontFamily: "'Space Grotesk',sans-serif" }}>
                            Understanding how the wallet works — how earnings are credited, what the available balance means, how transfers and spending work — is the foundation of managing your seller income effectively.
                          </p>
                          <p style={{ fontSize: "15px", color: MUTED, lineHeight: 1.9, marginBottom: "24px", fontFamily: "'Space Grotesk',sans-serif" }}>
                                               Every time a student purchases one of your documents, 80% of the transaction amount is credited to your LAN Wallet immediately. There is no processing delay, no weekly payment cycle, no end-of-month settlement. The credit happens within seconds of the buyer's payment being confirmed.
`
                            Your wallet displays two balance figures at all times: your total balance and your available balance. For most sellers at most times, these figures are identical. The distinction matters only in the rare case of an active buyer dispute — if a student initiates a dispute about a purchase, the corresponding amount is temporarily held from your available balance while the dispute is reviewed. Once resolved, the funds are either returned to your available balance or refunded to the buyer, depending on the dispute outcome. Disputes are uncommon and the resolution process is typically completed within 48 hours.

                        Your wallet also records earnings from the referral programme — commissions for students you referred who made purchases, and commissions for sellers you referred who made their first sales. These referral credits are logged separately in your transaction ledger so you can always see exactly how much of your wallet balance came from document sales versus referral commissions versus any other income stream                          
                        </p>
                          <p style={{ fontSize: "15px", color: LIMEL, lineHeight: 1.9, marginBottom: "24px", fontFamily: "'Space Grotesk',sans-serif" }}>
                            <a href="/seller/lan-wallet" target="_bank">Read more </a>
                        </p>
                        </section>

                       <section id="network" style={{ padding: "80px 64px", background: DARK, borderBottom: "1px solid rgba(248,248,255,.06)" }} className="lan-section-pad">
                        <Label>SELLER GUIDE</Label>
                        <SectionH>LAN<br /><span style={{ color: LIME }}>Seller Network.</span></SectionH>
                              <Callout icon="" label="Academic Document Marketplace · Africa.">
                            Africa's largest academic document marketplace — open to every student, graduate, tutor, and knowledge creator who has something valuable to share.
                        </Callout>

                         <p style={{ fontSize: "15px", color: MUTED, lineHeight: 1.9, marginBottom: "24px", fontFamily: "'Space Grotesk',sans-serif" }}>
                            The LAN Seller Network is the broadest participation tier on the platform — open to anyone across Africa who has created academic content worth sharing. You do not need to be a professor.
                            You do not need an institutional affiliation. If you have notes, summaries, guides, past papers, study materials, or any academic content that other students would find useful, you can sell it on LAN.
                         </p>
                          <p style={{ fontSize: "15px", color: MUTED, lineHeight: 1.9, marginBottom: "24px", fontFamily: "'Space Grotesk',sans-serif" }}>
                            Thousands of sellers across Nigeria, Ghana, Kenya, South Africa, Uganda, Tanzania, Rwanda, and a growing number of African countries are already generating consistent income from content they created as students, tutors, or independent educators. The Seller Network is the entry point for all of them — and for you.                         
                          </p>
                        <Label>What Is the LAN Seller Network?</Label>
                            <p style={{ fontSize: "15px", color: MUTED, lineHeight: 1.9, marginBottom: "24px", fontFamily: "'Space Grotesk',sans-serif" }}>
                            The LAN Seller Network is a verified community of document sellers serving the African student population. Unlike faculty-exclusive platforms, the Seller Network is intentionally broad: it accommodates final-year students selling their best notes, private tutors sharing structured study materials, professional exam coaches selling certification guides, independent educators creating original learning content, and graduates who accumulated exceptional academic resources during their studies.
                            What unites every member of the Seller Network is a commitment to quality and authenticity. LAN's review team examines every document before it goes live — checking that the content is original, accurate, relevant to the course or topic it claims to cover, and formatted in a way that serves students well. This quality filter is what makes LAN the most trusted academic document marketplace in Africa, and it is what allows sellers on the platform to charge meaningful prices and generate consistent income.
                            Every seller receives a public profile page, a personal document catalogue, a real-time earnings wallet, and access to the full suite of seller tools including analytics, pricing controls, and the referral programme. The network is the infrastructure that makes all of it work together.                        
                            </p>
                        <Label>Who Can Sell on LAN?</Label>
                        <p style={{ fontSize: "15px", color: MUTED, lineHeight: 1.9, marginBottom: "24px", fontFamily: "'Space Grotesk',sans-serif" }}>
                            The Seller Network is open to any individual who has created original academic content and wants to monetise it. There are no educational prerequisites, no institutional affiliations required, and no minimum number of documents to list. What matters is that your content is original, accurate, and genuinely useful to the students who will buy it.
                            Current students at African universities and polytechnics are among the most active sellers on the platform. A final-year student who has developed exceptional notes over four years of study has accumulated substantial intellectual assets. Those notes, past papers, and summary guides do not lose value at graduation — they continue to serve incoming cohorts of students for years.
                            Private tutors and academic coaches form another major segment of the Seller Network. If you teach A-level mathematics, JAMB preparation, WAEC revision, professional accounting examinations, or any other structured academic topic, your teaching materials have commercial value on LAN. Students actively seek preparation materials from known coaches and tutors — your reputation in your local tutoring market translates directly into demand for your documents on the platform.
                            Independent content creators who produce original study guides, examination preparation packs, or subject-specific reference materials are equally welcome. If you have created something genuinely useful for African students, the Seller Network is built for you.                         
                            </p>
                            <Label>How Earnings Work for Sellers</Label>
                        <p style={{ fontSize: "15px", color: MUTED, lineHeight: 1.9, marginBottom: "24px", fontFamily: "'Space Grotesk',sans-serif" }}>
                            Sellers earn 80% of every transaction. The remaining 20% covers platform operations, payment processing infrastructure, student discovery tools, and the review team that maintains quality standards. There are no listing fees, no monthly subscriptions, and no minimum sales requirements to keep your account active.
                            Every sale credits your LAN wallet immediately. There is no weekly payment cycle or holding period. When a student buys your document at any hour of any day, your wallet balance increases within seconds. Withdrawal to your bank account or mobile money wallet is available at any time, with processing completed within 24 hours on business days across all supported African markets.
                            Our top sellers — a mix of prolific note-takers, professional tutors, and dedicated content creators — maintain catalogues of 30 to 150 documents and earn the equivalent of USD 300 to USD 1,500 per month in passive document sales. The key differentiator between modest and high income is almost always catalogue size and metadata quality, not content quality alone. A large, well-tagged catalogue in high-demand course categories generates income around the clock without any ongoing effort.
                            </p>
                            <Label>How the Seller Network Supports Your Growth</Label>
                        <p style={{ fontSize: "15px", color: MUTED, lineHeight: 1.9, marginBottom: "24px", fontFamily: "'Space Grotesk',sans-serif" }}>
                            Joining the Seller Network is not just creating an account and uploading documents. It is joining a platform infrastructure designed to actively grow your income over time without requiring ongoing active effort from you.
                            LAN's search algorithm continuously surfaces your documents to students searching for relevant course materials. As your documents accumulate purchase history and buyer reviews, they rank progressively higher in search results — creating a compounding effect where early sales generate visibility that drives further sales. A document you upload today may take a few weeks to build its search ranking, but once established, it will continue generating income for years.
                            Your Seller Dashboard provides the analytics to understand what is working and what is not: which documents convert well, which courses are generating the most search traffic, where your buyers are located geographically, and what price points maximise your revenue. This data lets you make informed decisions about what to upload next and how to optimise your existing catalogue.
                            The referral programme creates an additional income layer that many sellers underutilise. Every student you refer who makes a purchase, and every seller you introduce who lists and sells documents, generates an automatic commission credited to your wallet. For sellers with large social networks or active academic communities around them, referral income can meaningfully supplement document sales income.                          </p>
                            <Label>Seller Tiers and What They Unlock</Label>
                             <p style={{ fontSize: "15px", color: MUTED, lineHeight: 1.9, marginBottom: "24px", fontFamily: "'Space Grotesk',sans-serif" }}>
                            The Seller Network has four progressive tiers — Bronze, Silver, Gold, and Platinum — determined by your cumulative earnings, document catalogue quality, buyer review ratings, and account standing. Each tier upgrade unlocks tangible benefits that compound your earning potential.
                            Bronze is the entry tier for all new sellers. Bronze sellers have access to all core platform features — uploading, pricing, analytics, referrals, and withdrawals with a small flat fee. As your catalogue grows and sales accumulate, you progress automatically to Silver, which eliminates withdrawal fees and increases your document upload priority in the review queue.
                            Gold sellers receive priority review processing for new uploads, eligibility for Promoted Listings at discounted rates, and access to the platform's seasonal marketing campaigns that surface featured sellers to students during peak demand periods. Platinum sellers — the top tier of the Seller Network — receive dedicated account management, maximum priority across all platform systems, and invitation to LAN's exclusive content partnership programmes.
                            Tier progression is automatic — there is no application process. The platform continuously evaluates your account metrics and upgrades your tier as you meet the thresholds. Your tier is displayed on your public profile, serving as a quality signal to buyers about your track record on the platform.                          
                            </p>
                        </section>

                    {/* ══ SECTION: REFERRAL ══ */}
                    <section id="referral" style={{ padding: "80px 64px", background: DARK, borderBottom: "1px solid rgba(248,248,255,.06)" }} className="lan-section-pad">
                        <Label>Referral Programme</Label>
                        <SectionH>Earn Commissions<br /><span style={{ color: LIME }}>for Every Referral.</span></SectionH>
                        <p style={{ fontSize: "15px", color: MUTED, lineHeight: 1.9, marginBottom: "24px", fontFamily: "'Space Grotesk',sans-serif" }}>
                            The LAN Referral Programme turns your social network into a passive income stream that runs alongside your document sales. Every student you refer who makes a purchase, every seller you introduce who uploads and sells, and every faculty member you bring to the platform who verifies and sells — all generate automatic commissions credited to your wallet with no action required after the initial introduction.                         
                             </p>
                            <Label>How the Referral System Works</Label>
                              <p style={{ fontSize: "15px", color: MUTED, lineHeight: 1.9, marginBottom: "24px", fontFamily: "'Space Grotesk',sans-serif" }}>
                        Every LAN account is assigned a unique referral link and referral code at the moment of account creation. Your referral link is a standard URL. When someone visits that link and creates a new LAN account, they are permanently attributed to you in the referral system.
                        The attribution is durable — it does not expire and cannot be overwritten. A student you referred six months ago who finally makes their first purchase today generates your referral commission today. A seller you referred who uploads their first document and makes their first sale three weeks after joining generates your commission at the moment of that first sale.
                        Share your referral link through any channel that reaches people who might benefit from LAN: WhatsApp groups, student Telegram channels, academic Facebook pages, university subreddits, email threads, in-person conversations, or your social media profiles. The link works identically regardless of sharing channel, and there is no limit on how many people can use it.                             
                        </p>
                        
                        <p style={{ fontSize: "15px", color: LIMEL, lineHeight: 1.9, marginBottom: "24px", fontFamily: "'Space Grotesk',sans-serif" }}>
                            <a href="/seller/referral" target="_bank">Read more </a>
                        </p>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: "16px", marginBottom: "32px" }}>
                            {[
                                { icon: "🎓", title: "Refer a Student Buyer", reward: "~₦500", body: "Referred student makes their first document purchase. Commission credits to your wallet automatically.", accent: PURPLE },
                                { icon: "📚", title: "Refer a New Seller", reward: "~₦500", body: "Referred seller uploads their first document and makes their first sale.", accent: LIME },
                                { icon: "🏛️", title: "Refer a Faculty Member", reward: "~₦1000", body: "Referred faculty member completes Verified Faculty setup and makes their first sale.", accent: PURPLEL },
                                { icon: "🔥", title: "Volume Bonus", reward: "~₦12,500", body: "Refer 10+ users in a calendar month — any combination of buyers, sellers, faculty — and receive a bonus on top of individual commissions.", accent: "#f59e0b" },
                            ].map(item => (
                                <div key={item.title} style={{ background: DARK2, padding: "24px", border: "1px solid rgba(124,58,237,.15)", borderTop: `3px solid ${item.accent}`, transition: "border-color .15s" }}
                                    onMouseEnter={e => e.currentTarget.style.borderLeftColor = item.accent}
                                    onMouseLeave={e => { }}>
                                    <div style={{ fontSize: "22px", marginBottom: "10px" }}>{item.icon}</div>
                                    <div style={{ fontFamily: "'Syne',sans-serif", fontSize: "22px", fontWeight: 800, color: item.accent, marginBottom: "4px" }}>{item.reward}</div>
                                    <div style={{ fontSize: "13px", fontWeight: 700, color: WHITE, marginBottom: "8px", fontFamily: "'Space Grotesk',sans-serif" }}>{item.title}</div>
                                    <div style={{ fontSize: "12px", color: MUTED, lineHeight: 1.7, fontFamily: "'Space Grotesk',sans-serif" }}>{item.body}</div>
                                </div>
                            ))}
                        </div>
                        <Callout icon="🔗" label="No Cap. No Expiry.">
                            There is no maximum on referral earnings and no expiry on your referral link. Top referrers in the Seller Network generate ₦80,000–₦250,000 per month in referral commissions alone — entirely separate from document and bounty income.
                        </Callout>
                    </section>

                    {/* ══ SECTION: COMMUNITY ══ */}
                    <section id="community" style={{ padding: "80px 64px", borderBottom: "1px solid rgba(248,248,255,.06)" }} className="lan-section-pad">
                        <Label>Community & Study Groups</Label>
                        <SectionH>Study with<br /><span style={{ color: LIME }}>The Best.</span></SectionH>

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "48px", alignItems: "start" }} className="lan-2col">
                            <div>
                                <p style={{ fontSize: "15px", color: MUTED, lineHeight: 1.9, marginBottom: "28px", fontFamily: "'Space Grotesk',sans-serif" }}>
                                    LAN is not just a document marketplace — it is a <strong style={{ color: WHITE }}>living academic community</strong> connecting students across institutions, cities, and countries who share the same courses, the same pressures, and the same drive to succeed.
                                </p>
                                {[
                                    ["🏫", "Course Study Groups", "Course-specific groups with persistent discussion threads, pinned resources, and coordinated live sessions."],
                                    ["🏆", "Academic Leaderboards", "Top-performing and most active students at every institution — surface-visible to the community, driving healthy competition."],
                                    ["💬", "Direct Messaging", "Message any student on LAN — arrange study sessions, request recommendations, collaborate on academic projects."],
                                    ["📣", "Department Feeds", "Follow your department for new materials, bounties, and discussions relevant to your specific courses."],
                                    ["🔔", "Message Notifications", "Real-time notifications for new messages, bounty responses, document reviews, and group activity."],
                                ].map(([ico, title, body]) => (
                                    <div key={title} style={{ display: "flex", gap: "14px", marginBottom: "18px", alignItems: "flex-start" }}>
                                        <div style={{ fontSize: "20px", width: "36px", textAlign: "center", flexShrink: 0 }}>{ico}</div>
                                        <div>
                                            <div style={{ fontSize: "13px", fontWeight: 700, color: WHITE, marginBottom: "3px", fontFamily: "'Space Grotesk',sans-serif" }}>{title}</div>
                                            <div style={{ fontSize: "12px", color: MUTED, lineHeight: 1.7, fontFamily: "'Space Grotesk',sans-serif" }}>{body}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div style={{ background: DARK, border: "1px solid rgba(124,58,237,.2)", overflow: "hidden" }}>
                                <div style={{ padding: "14px 18px", borderBottom: "1px solid rgba(248,248,255,.06)", display: "flex", alignItems: "center", gap: "8px" }}>
                                    <span style={{ fontSize: "14px" }}>👥</span>
                                    <span style={{ fontSize: "12px", fontWeight: 700, color: WHITE, fontFamily: "'Space Grotesk',sans-serif" }}>Study Groups</span>
                                    <span style={{ marginLeft: "auto", fontSize: "10px", color: LIME, fontWeight: 700, fontFamily: "'Space Grotesk',sans-serif" }}>● LIVE</span>
                                </div>
                                {[
                                    { name: "UNILAG Medicine 500L", members: "284", active: "12 online", icon: "💉" },
                                    { name: "OAU Engineering Year 4", members: "156", active: "8 online", icon: "⚙️" },
                                    { name: "ABU Law 300L", members: "98", active: "5 online", icon: "⚖️" },
                                    { name: "UI Economics 200L", members: "213", active: "19 online", icon: "📊" },
                                    { name: "FUTA CS Year 3", members: "177", active: "14 online", icon: "💻" },
                                    { name: "UNIPORT Pharmacy 400L", members: "134", active: "7 online", icon: "💊" },
                                ].map(g => (
                                    <div key={g.name} style={{ padding: "12px 18px", borderBottom: "1px solid rgba(248,248,255,.05)", display: "flex", alignItems: "center", gap: "12px", transition: "background .12s", cursor: "pointer" }}
                                        onMouseEnter={e => e.currentTarget.style.background = "rgba(124,58,237,.08)"}
                                        onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                                        <div style={{ width: "34px", height: "34px", background: "rgba(124,58,237,.2)", border: "1px solid rgba(124,58,237,.3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "15px", flexShrink: 0 }}>{g.icon}</div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontSize: "12px", fontWeight: 700, color: WHITE, fontFamily: "'Space Grotesk',sans-serif" }}>{g.name}</div>
                                            <div style={{ fontSize: "10px", color: MUTED, fontFamily: "'Space Grotesk',sans-serif" }}>{g.members} members</div>
                                        </div>
                                        <div style={{ fontSize: "10px", color: LIME, fontWeight: 700, fontFamily: "'Space Grotesk',sans-serif" }}>{g.active}</div>
                                    </div>
                                ))}
                                <Link href="/collaborate" style={{ display: "block", padding: "14px", textAlign: "center", fontSize: "11px", color: PURPLEL, fontWeight: 600, fontFamily: "'Space Grotesk',sans-serif", textDecoration: "none", borderTop: "1px solid rgba(124,58,237,.15)", background: "rgba(124,58,237,.05)" }}>
                                    Browse all 1,800+ study groups →
                                </Link>
                            </div>
                        </div>
                    </section>

                    {/* ══ SECTION: SECURITY ══ */}
                    <section id="security" style={{ padding: "80px 64px", background: DARK, borderBottom: "1px solid rgba(248,248,255,.06)" }} className="lan-section-pad">
                        <Label>Security & Trust</Label>
                        <SectionH>Built on<br /><span style={{ color: LIME }}>Trust.</span></SectionH>

                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: "1px", background: "rgba(124,58,237,.1)", marginBottom: "40px" }}>
                            {[
                                { icon: "💳", tag: "PAYMENTS", title: "Encrypted Payment Processing", body: "Industry-standard encryption on every transaction. Card details are never stored on LAN servers — handled by PCI-DSS compliant payment processors.", accent: PURPLE },
                                { icon: "🛡️", tag: "CONTENT", title: "Digital Watermarking", body: "Every purchased document carries an invisible buyer-specific watermark. Redistribution can be traced and attributed to the specific purchase that leaked it.", accent: PURPLEL },
                                { icon: "✅", tag: "QUALITY", title: "Verified Sellers & Content Review", body: "Every seller is verified. Every document is reviewed before going live — checked for originality, accuracy, and compliance with content policy.", accent: LIME },
                                { icon: "🔒", tag: "ACCOUNT", title: "Two-Layer Account Security", body: "Account password for access. Transfer PIN for all outflows. Anomaly detection flags unusual withdrawal volumes for additional OTP verification.", accent: "#f59e0b" },
                                { icon: "⚖️", tag: "BUYERS", title: "Buyer Protection & Disputes", body: "72-hour buyer dispute window. Valid disputes — where a document doesn't match its description — result in wallet credit. Reviewed within 48 hours.", accent: "#06b6d4" },
                                { icon: "📜", tag: "POLICIES", title: "Transparent Terms", body: "Terms of service, refund policy, seller agreement, and commission structure are publicly documented. No hidden fees, no ambiguous clauses.", accent: "#ec4899" },
                            ].map(c => <FCard key={c.title} {...c} />)}
                        </div>
                    </section>

                    {/* ══ SECTION: L.A.N NETWORK ══ */}
                    <section id="lan-network" style={{ padding: "80px 64px", borderBottom: "1px solid rgba(248,248,255,.06)" }} className="lan-section-pad">
                        <Label>The L.A.N Network</Label>
                        <SectionH>Raising Leaders.<br /><span style={{ color: LIME }}>Building People.</span></SectionH>

                        <p style={{ fontSize: "15px", color: MUTED, lineHeight: 1.9, maxWidth: "680px", marginBottom: "36px", fontFamily: "'Space Grotesk',sans-serif" }}>
                            The <strong style={{ color: WHITE }}>Learning Access Network (L.A.N)</strong> is the broader movement behind LAN Library — a transformative platform designed to foster leadership development and personal growth, connecting individuals with resources, mentors, and a supportive community across Africa.
                        </p>

                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: "16px", marginBottom: "36px" }}>
                            {[
                                { icon: "💪", name: "Empowerment", body: "L.A.N empowers individuals to take control of their own learning and development — on their own terms and timeline." },
                                { icon: "🤝", name: "Collaboration", body: "The network encourages collaboration and the sharing of knowledge and experiences across communities and disciplines." },
                                { icon: "🌍", name: "Inclusivity", body: "An inclusive environment where everyone is valued, heard, and supported regardless of background, institution, or location." },
                                { icon: "📈", name: "Continuous Learning", body: "A culture where growth is not a destination but an ongoing journey — continuously improving, expanding, evolving." },
                            ].map(a => <ACard key={a.name} {...a} />)}
                        </div>

                        <Callout icon="✦" label="The L.A.N Promise">
                            The Learning Access Network is more than a platform — it's a community dedicated to <strong style={{ color: WHITE }}>raising leaders and building people</strong>. By providing access to valuable resources and fostering a culture of continuous learning, L.A.N empowers individuals to reach their full potential and make a positive impact in their communities.
                        <br/><br/> LAN pictured a great school of technology where young men and young women could be taught how to succeed in life by developing the ability to THINK in practical rather than in theoretical terms
                        </Callout>
                    </section>

                    {/* ══ SECTION: FUTURE ══ */}
                    <section id="future" style={{ padding: "80px 64px", background: DARK, borderBottom: "1px solid rgba(248,248,255,.06)" }} className="lan-section-pad">
                        <Label>The Future</Label>
                        <SectionH>What's<br /><span style={{ color: LIME }}>Coming Next.</span></SectionH>

                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: "16px", marginBottom: "40px" }}>
                            {[
                                { icon: "🤖", tag: "Q3 2026", title: "Enhanced AI Study Tools", body: "Note-taking features, highlighting, bookmark syncing across devices, and AI-powered study assistants that work across your entire library simultaneously.", accent: PURPLEL },
                                { icon: "🎥", tag: "Q4 2027", title: "Video Lectures & Audio Courses", body: "Support for video lectures, audio courses, interactive presentations, and multimedia educational packages — LAN becomes a full learning ecosystem.", accent: LIME },
                                { icon: "🏛️", tag: "2028", title: "Institutional Partnerships", body: "Partnerships with universities, training centres, and professional organisations to provide official course materials and certification resources.", accent: PURPLE },
                                { icon: "🌍", tag: "2028", title: "Pan-African Expansion", body: "Deeper coverage in Francophone Africa (Côte d'Ivoire, Senegal, Cameroon) and East Africa. Multi-language content support for French and Swahili.", accent: "#f59e0b" },
                                { icon: "👥", tag: "ONGOING", title: "Live Tutoring Sessions", body: "Real-time tutoring sessions booked and paid through LAN — connecting students directly with verified educators for personalised academic support.", accent: "#06b6d4" },
                                { icon: "📱", tag: "ONGOING", title: "Native Mobile App", body: "Dedicated iOS and Android applications with offline reading, push notifications, and a fully optimised mobile study experience.", accent: "#ec4899" },
                            ].map(c => <FCard key={c.title} {...c} />)}
                        </div>
                    </section>

                    {/* ══ CONCLUSION ══ */}
                    <section style={{ padding: "80px 64px", borderBottom: "1px solid rgba(248,248,255,.06)" }} className="lan-section-pad">
                        <div style={{ background: "linear-gradient(135deg, rgba(124,58,237,.15), rgba(163,230,53,.1))", border: "1px solid rgba(124,58,237,.3)", borderLeft: `4px solid ${PURPLE}`, padding: "36px 40px", marginBottom: "32px" }}>
                            <div style={{ fontFamily: "'Syne',sans-serif", fontSize: "clamp(20px,3vw,28px)", fontWeight: 700, color: WHITE, marginBottom: "14px", lineHeight: 1.2 }}>
                                In simple terms: LAN Library connects knowledge to people, and turns knowledge into value.
                            </div>
                            <p style={{ fontSize: "14px", color: MUTED, lineHeight: 1.85, marginBottom: "10px", fontFamily: "'Space Grotesk',sans-serif" }}>
                                It is a marketplace where learning happens, earnings grow, and opportunities are created through the power of shared knowledge.
                            </p>
                            <p style={{ fontSize: "14px", color: MUTED, lineHeight: 1.85, fontFamily: "'Space Grotesk',sans-serif" }}>
                                We are building more than a platform — we are building a movement toward accessible education, fair compensation for creators, and a world where knowledge truly is power.
                            </p>
                        </div>
                        <p style={{ textAlign: "center", fontStyle: "italic", fontSize: "15px", color: MUTED, fontFamily: "'Space Grotesk',sans-serif" }}>
                            Welcome to LAN Library — <span style={{ color: LIME }}>The Global Student Library</span>
                        </p>
                    </section>

                    {/* ══ EXPLORE OTHER NETWORKS ══ */}
                    <section style={{ padding: "80px 64px" }} className="lan-section-pad">
                        <Label>Explore the Ecosystem</Label>
                        <SectionH>Go Deeper<br /><span style={{ color: LIME }}>into LAN.</span></SectionH>

                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: "16px" }}>
                            {[
                                { bg: DARK2, accent: PURPLEL, tag: "🎓 Student Network", title: "Browse 128,000+ Documents", body: "The full student experience — past questions, AI tutor, bounty board, study groups, and your personal academic library.", href: "/students/network" },
                                { bg: NAVY, accent: GOLD, tag: "📚 Seller Network", title: "Become a Seller", body: "Upload your materials, earn 80% of every sale, build a passive income from what you already know.", href: "/seller/network" },
                                { bg: "#0d1a10", accent: LIME, tag: "🏛️ Faculty Network", title: "Verified Faculty Publishing", body: "Lecturers and professors publishing course materials — verified credentials, continent-wide reach.", href: "/faculty/network" },
                                { bg: "#1a0d0d", accent: "#f59e0b", tag: "🎯 Bounty Board", title: "Request Any Document", body: "Post a bounty with a reward. Verified sellers fulfil your specific document request in 24–72 hours.", href: "/academic/bounty/board" },
                                { bg: DARK2, accent: PURPLEL, tag: "🤖 AI Tutor", title: "Start an AI Study Session", body: "Claude-powered AI that reads your specific purchased books and answers questions about their content.", href: "/ai-chat" },
                                { bg: DARK, accent: "#06b6d4", tag: "📖 Help Centre", title: "Get Platform Support", body: "Step-by-step guides for buying, selling, payments, account management, and everything else on LAN.", href: "/lan/net/help-center" },
                            ].map(n => (
                                <Link key={n.tag} href={n.href} style={{ display: "block", padding: "28px", background: n.bg, textDecoration: "none", border: "1px solid rgba(248,248,255,.06)", transition: "transform .15s, border-color .15s" }}
                                    onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.borderColor = n.accent; }}
                                    onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.borderColor = "rgba(248,248,255,.06)"; }}>
                                    <div style={{ fontSize: "9px", fontWeight: 700, letterSpacing: ".18em", textTransform: "uppercase", color: n.accent, marginBottom: "10px", fontFamily: "'Space Grotesk',sans-serif" }}>{n.tag}</div>
                                    <h3 style={{ fontFamily: "'Syne',sans-serif", fontSize: "18px", fontWeight: 700, color: WHITE, marginBottom: "8px", letterSpacing: "-.01em" }}>{n.title}</h3>
                                    <p style={{ fontSize: "12px", color: MUTED, lineHeight: 1.75, marginBottom: "16px", fontFamily: "'Space Grotesk',sans-serif" }}>{n.body}</p>
                                    <span style={{ fontSize: "11px", fontWeight: 700, color: n.accent, letterSpacing: ".08em", textTransform: "uppercase", fontFamily: "'Space Grotesk',sans-serif" }}>Explore →</span>
                                </Link>
                            ))}
                        </div>

                        {/* Final CTA */}
                        <div style={{ marginTop: "64px", textAlign: "center", padding: "64px 24px", background: DARK2, position: "relative", overflow: "hidden" }}>
                            <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: "600px", height: "600px", borderRadius: "50%", background: "radial-gradient(circle, rgba(124,58,237,.08) 0%, transparent 70%)", pointerEvents: "none" }} />
                            <div style={{ position: "relative", zIndex: 2 }}>
                                <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "rgba(163,230,53,.1)", border: "1px solid rgba(163,230,53,.25)", padding: "6px 16px", marginBottom: "24px" }}>
                                    <span style={{ width: "5px", height: "5px", background: LIME, borderRadius: "50%", display: "inline-block", animation: "pulse 1.5s ease-in-out infinite" }} />
                                    <span style={{ fontSize: "9px", fontWeight: 700, letterSpacing: ".16em", textTransform: "uppercase", color: LIME, fontFamily: "'Space Grotesk',sans-serif" }}>Free Forever · Join 40,000+ Students</span>
                                </div>
                                <h2 style={{ fontFamily: "'Syne',sans-serif", fontSize: "clamp(32px,5vw,60px)", fontWeight: 800, color: WHITE, lineHeight: .95, marginBottom: "16px", letterSpacing: "-.04em" }}>
                                    Ready to Join<br /><span style={{ color: LIME }}>LAN Library?</span>
                                </h2>
                                <p style={{ fontSize: "14px", color: MUTED, maxWidth: "420px", margin: "0 auto 32px", lineHeight: 1.85, fontFamily: "'Space Grotesk',sans-serif" }}>
                                    Create your free account in 2 minutes. Start browsing 128,000+ documents immediately.
                                </p>
                                <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
                                    <Link href="/auth/signup" style={{ padding: "14px 32px", background: LIME, color: VOID, fontSize: "11px", fontWeight: 800, letterSpacing: ".1em", textTransform: "uppercase", textDecoration: "none", fontFamily: "'Space Grotesk',sans-serif", clipPath: "polygon(0 0, 95% 0, 100% 100%, 5% 100%)", transition: "background .15s" }}
                                        onMouseEnter={e => e.currentTarget.style.background = LIMEL}
                                        onMouseLeave={e => e.currentTarget.style.background = LIME}>
                                        Create Free Account
                                    </Link>
                                    <Link href="/documents" style={{ padding: "14px 28px", background: "transparent", color: WHITE, fontSize: "11px", fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", border: "1px solid rgba(248,248,255,.2)", textDecoration: "none", fontFamily: "'Space Grotesk',sans-serif", transition: "all .15s" }}
                                        onMouseEnter={e => { e.currentTarget.style.background = "rgba(124,58,237,.15)"; e.currentTarget.style.borderColor = PURPLEL; }}
                                        onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = "rgba(248,248,255,.2)"; }}>
                                        Browse Documents
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </section>
                </div>
            </div>
        </>
    );
}