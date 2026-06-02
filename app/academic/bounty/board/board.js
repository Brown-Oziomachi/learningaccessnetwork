"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "@/lib/firebaseConfig";
import { doc, getDoc } from "firebase/firestore";
import {
  subscribeToBounties,
  incrementProposals,
  createBounty,
  claimBountyWithNotification,
} from "@/lib/bountyService";
import { createPortal } from "react-dom";
import { UNIVERSITIES_BY_COUNTRY, UNIVERSITY_COUNTRIES } from "@/lib/africanUniversities";
import BountyCard from "@/components/BountyCard";
import { useCurrency } from "@/app/context/CurrencyContext";

/* ─── Departments (used in CreateModal) ────────────────────── */
/* ─── Brand tokens ──────────────────────────────────────────── */
const NAVY = "#0d2244";
const GOLD = "#b8963e";
const GOLDD = "#d4aa5a";
const CREAM = "#f5f0e8";
const BG = "#f5f1ea";

/* ─── Departments (unchanged) ───────────────────────────────── */
const DEPARTMENTS_BY_FACULTY = {
  "Sciences": [
    "Medicine & Health Sciences", "Pharmacy", "Nursing", "Biochemistry",
    "Microbiology", "Biology", "Chemistry", "Physics", "Mathematics",
    "Statistics", "Veterinary Medicine", "Dentistry", "Nutrition & Dietetics", "Optometry",
  ],
  "Engineering & Technology": [
    "Computer Science", "Electrical Engineering", "Mechanical Engineering",
    "Civil Engineering", "Chemical Engineering", "Petroleum Engineering",
    "Architecture", "Information Technology", "Agricultural Engineering",
    "Environmental Engineering", "Mining Engineering",
  ],
  "Arts & Social Sciences": [
    "Law", "Economics", "Accounting", "Business Administration",
    "Political Science", "Sociology", "Psychology", "Mass Communication",
    "History & International Studies", "Public Administration",
    "Geography", "Philosophy", "Linguistics",
  ],
  "Humanities & Creative Arts": [
    "Literature", "Fine & Applied Arts", "Music",
    "Theatre & Performing Arts", "Languages & Linguistics", "Religious Studies",
  ],
  "Agriculture & Environment": [
    "Agriculture", "Forestry & Wildlife", "Fisheries & Aquaculture",
    "Environmental Sciences", "Food Science & Technology",
  ],
  "Education": [
    "Education", "Guidance & Counselling", "Early Childhood Education",
    "Special Education", "Physical & Health Education",
  ],
  "Professional": [
    "Finance & Banking", "Insurance", "Estate Management",
    "Hospitality & Tourism", "Library & Information Science",
    "Quantity Surveying", "Urban & Regional Planning", "Social Work",
  ],
};

/* ─────────────────────────────────────────────────────────────
   COUNTRY → CURRENCY MAP
   Maps every country name used in africanUniversities to its
   Flutterwave-supported currency code, symbol, and flag.
   ───────────────────────────────────────────────────────────── */
const COUNTRY_CURRENCY_MAP = {
  // West Africa
  "Nigeria": { currency: "NGN", symbol: "₦", flag: "🇳🇬" },
  "Ghana": { currency: "GHS", symbol: "GH₵", flag: "🇬🇭" },
  "Senegal": { currency: "XOF", symbol: "CFA", flag: "🇸🇳" },
  "Ivory Coast": { currency: "XOF", symbol: "CFA", flag: "🇨🇮" },
  "Côte d'Ivoire": { currency: "XOF", symbol: "CFA", flag: "🇨🇮" },
  "Mali": { currency: "XOF", symbol: "CFA", flag: "🇲🇱" },
  "Benin": { currency: "XOF", symbol: "CFA", flag: "🇧🇯" },
  "Burkina Faso": { currency: "XOF", symbol: "CFA", flag: "🇧🇫" },
  "Niger": { currency: "XOF", symbol: "CFA", flag: "🇳🇪" },
  "Togo": { currency: "XOF", symbol: "CFA", flag: "🇹🇬" },
  "Guinea": { currency: "GNF", symbol: "FG", flag: "🇬🇳" },
  "Guinea-Bissau": { currency: "XOF", symbol: "CFA", flag: "🇬🇼" },
  "Sierra Leone": { currency: "SLL", symbol: "Le", flag: "🇸🇱" },
  "Liberia": { currency: "LRD", symbol: "L$", flag: "🇱🇷" },
  "Gambia": { currency: "GMD", symbol: "D", flag: "🇬🇲" },
  "Cape Verde": { currency: "CVE", symbol: "Esc", flag: "🇨🇻" },
  // East Africa
  "Kenya": { currency: "KES", symbol: "KSh", flag: "🇰🇪" },
  "Uganda": { currency: "UGX", symbol: "USh", flag: "🇺🇬" },
  "Tanzania": { currency: "TZS", symbol: "TSh", flag: "🇹🇿" },
  "Rwanda": { currency: "RWF", symbol: "RF", flag: "🇷🇼" },
  "Ethiopia": { currency: "ETB", symbol: "Br", flag: "🇪🇹" },
  "Somalia": { currency: "SOS", symbol: "Sh", flag: "🇸🇴" },
  "Djibouti": { currency: "DJF", symbol: "Fdj", flag: "🇩🇯" },
  "Eritrea": { currency: "ERN", symbol: "Nfk", flag: "🇪🇷" },
  "Sudan": { currency: "SDG", symbol: "ج.س.", flag: "🇸🇩" },
  "South Sudan": { currency: "SSP", symbol: "£", flag: "🇸🇸" },
  "Burundi": { currency: "BIF", symbol: "Fr", flag: "🇧🇮" },
  "Comoros": { currency: "KMF", symbol: "Fr", flag: "🇰🇲" },
  // Central Africa
  "Cameroon": { currency: "XAF", symbol: "CFA", flag: "🇨🇲" },
  "Gabon": { currency: "XAF", symbol: "CFA", flag: "🇬🇦" },
  "Chad": { currency: "XAF", symbol: "CFA", flag: "🇹🇩" },
  "Republic of the Congo": { currency: "XAF", symbol: "CFA", flag: "🇨🇬" },
  "DR Congo": { currency: "CDF", symbol: "FC", flag: "🇨🇩" },
  "Democratic Republic of Congo": { currency: "CDF", symbol: "FC", flag: "🇨🇩" },
  "Equatorial Guinea": { currency: "XAF", symbol: "CFA", flag: "🇬🇶" },
  "Central African Republic": { currency: "XAF", symbol: "CFA", flag: "🇨🇫" },
  "São Tomé and Príncipe": { currency: "STN", symbol: "Db", flag: "🇸🇹" },
  // North Africa
  "Egypt": { currency: "EGP", symbol: "E£", flag: "🇪🇬" },
  "Morocco": { currency: "MAD", symbol: "DH", flag: "🇲🇦" },
  "Algeria": { currency: "DZD", symbol: "DA", flag: "🇩🇿" },
  "Tunisia": { currency: "TND", symbol: "DT", flag: "🇹🇳" },
  "Libya": { currency: "LYD", symbol: "LD", flag: "🇱🇾" },
  "Mauritania": { currency: "MRU", symbol: "UM", flag: "🇲🇷" },
  // Southern Africa
  "South Africa": { currency: "ZAR", symbol: "R", flag: "🇿🇦" },
  "Zimbabwe": { currency: "ZWL", symbol: "Z$", flag: "🇿🇼" },
  "Zambia": { currency: "ZMW", symbol: "ZK", flag: "🇿🇲" },
  "Malawi": { currency: "MWK", symbol: "MK", flag: "🇲🇼" },
  "Mozambique": { currency: "MZN", symbol: "MT", flag: "🇲🇿" },
  "Botswana": { currency: "BWP", symbol: "P", flag: "🇧🇼" },
  "Namibia": { currency: "NAD", symbol: "N$", flag: "🇳🇦" },
  "Lesotho": { currency: "LSL", symbol: "L", flag: "🇱🇸" },
  "Eswatini": { currency: "SZL", symbol: "L", flag: "🇸🇿" },
  "Madagascar": { currency: "MGA", symbol: "Ar", flag: "🇲🇬" },
  "Mauritius": { currency: "MUR", symbol: "Rs", flag: "🇲🇺" },
  "Seychelles": { currency: "SCR", symbol: "Rs", flag: "🇸🇨" },
  "Angola": { currency: "AOA", symbol: "Kz", flag: "🇦🇴" },
  // Extra / overlap
  "Uganda ": { currency: "UGX", symbol: "USh", flag: "🇺🇬" }, // trailing-space guard
};

/* NGN-based fallback exchange rates */
const FALLBACK_RATES = {
  NGN: 1, GHS: 0.010, KES: 0.11, UGX: 2.85, TZS: 2.62,
  RWF: 1.38, ZMW: 0.028, MWK: 1.77, EGP: 0.051, MAD: 0.105,
  ZAR: 0.019, XOF: 6.56, XAF: 6.56, ETB: 0.057, DZD: 0.13,
  TND: 0.031, BWP: 0.014, NAD: 0.019, MZN: 0.064, MUR: 0.046,
  CDF: 2.85,
};

/* Format a number in a given currency */
function fmtCurrency(amount, currency, symbol) {
  const big = ["UGX", "RWF", "TZS", "XOF", "XAF", "MWK", "BIF", "GNF", "CDF", "SOS", "MGA"].includes(currency);
  const val = big ? Math.round(amount).toLocaleString() : amount.toFixed(2).replace(/\.00$/, "");
  return `${symbol}${val}`;
}

/* Convert local → NGN */
function toNGN(localAmount, currency, rates) {
  const rate = rates[currency] ?? FALLBACK_RATES[currency] ?? 1;
  return rate === 0 ? localAmount : Math.round(localAmount / rate);
}

/* ─────────────────────────────────────────────────────────────
   CountrySelector  (searchable dropdown)
   ───────────────────────────────────────────────────────────── */
function CountrySelector({ selected, onSelect, countries }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef(null);

  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const filtered = countries.filter(c =>
    c.name.toLowerCase().includes(query.toLowerCase()) ||
    (c.currency || "").toLowerCase().includes(query.toLowerCase())
  );

  const info = COUNTRY_CURRENCY_MAP[selected] || { currency: "NGN", symbol: "₦", flag: "🌍" };

  return (
    <div ref={ref} style={{ position: "relative" }}>
      {/* Trigger */}
      <button type="button" onClick={() => setOpen(o => !o)}
        style={{
          width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "10px 14px",
          border: `1.5px solid ${open ? GOLD : "#e5ddd0"}`, background: open ? CREAM : "#fff",
          cursor: "pointer", transition: "border-color .18s, background .18s",
          fontFamily: "'Lato', sans-serif", boxSizing: "border-box"
        }}>
        <span style={{ fontSize: 20, lineHeight: 1 }}>{info.flag}</span>
        <div style={{ flex: 1, textAlign: "left", minWidth: 0 }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: NAVY, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {selected || "— Select Country —"}
          </p>
          {selected && (
            <p style={{ fontSize: 10, color: "#aaa", margin: 0 }}>{info.currency} · {info.symbol}</p>
          )}
        </div>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="2.5"
          style={{ flexShrink: 0, transform: open ? "rotate(180deg)" : "none", transition: "transform .2s" }}>
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {/* Dropdown */}
      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0,
          background: "#fff", border: "1px solid #e5ddd0",
          boxShadow: "0 16px 40px rgba(13,34,68,.14)", zIndex: 300,
          maxHeight: 300, display: "flex", flexDirection: "column"
        }}>
          {/* Search */}
          <div style={{ padding: "8px 12px", borderBottom: "0.5px solid #f0ebe0", display: "flex", alignItems: "center", gap: 8 }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#bbb" strokeWidth="2" style={{ flexShrink: 0 }}>
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input autoFocus value={query} onChange={e => setQuery(e.target.value)}
              placeholder="Search country…"
              style={{
                border: "none", outline: "none", flex: 1, fontSize: 12,
                fontFamily: "'Lato',sans-serif", color: NAVY, background: "transparent"
              }} />
          </div>
          {/* List */}
          <div style={{ overflowY: "auto", flex: 1 }}
            className="country-scroll">
            {filtered.length === 0 ? (
              <p style={{ padding: 14, fontSize: 12, color: "#aaa", textAlign: "center" }}>No results</p>
            ) : filtered.map(c => {
              const ci = COUNTRY_CURRENCY_MAP[c.name] || { currency: "", symbol: "", flag: "🌍" };
              const isActive = c.name === selected;
              return (
                <button key={c.name} type="button"
                  onClick={() => { onSelect(c.name); setOpen(false); setQuery(""); }}
                  style={{
                    width: "100%", display: "flex", alignItems: "center", gap: 10,
                    padding: "9px 14px", border: "none",
                    borderLeft: isActive ? `3px solid ${GOLD}` : "3px solid transparent",
                    background: isActive ? CREAM : "transparent",
                    cursor: "pointer", textAlign: "left", transition: "background .1s"
                  }}
                  onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = "#fafaf8"; }}
                  onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = "transparent"; }}>
                  <span style={{ fontSize: 16, lineHeight: 1, flexShrink: 0 }}>{ci.flag}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{
                      fontSize: 12, fontWeight: 700, color: NAVY, margin: 0,
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap"
                    }}>{c.name}</p>
                    {ci.currency && (
                      <p style={{ fontSize: 10, color: "#aaa", margin: 0 }}>{ci.currency} · {ci.symbol}</p>
                    )}
                  </div>
                  {isActive && (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={GOLD} strokeWidth="2.5" style={{ flexShrink: 0 }}>
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Tier helper ───────────────────────────────────────────── */
const getTier = (r) => {
  if (r >= 50000) return { name: "Platinum", color: "#e2e8f0", bg: "rgba(226,232,240,.12)", emoji: "💎" };
  if (r >= 20000) return { name: "Gold", color: GOLD, bg: "rgba(184,150,62,.12)", emoji: "🥇" };
  if (r >= 5000) return { name: "Silver", color: "#94a3b8", bg: "rgba(148,163,184,.12)", emoji: "🥈" };
  return { name: "Bronze", color: "#cd7f32", bg: "rgba(205,127,50,.12)", emoji: "🥉" };
};

/* ─── Countdown ─────────────────────────────────────────────── */
function getDeadlineInfo(deadline) {
  if (!deadline) return { label: "Open deadline", color: "#94a3b8" };
  const d = deadline?.toDate ? deadline.toDate() : new Date(deadline);
  const diff = d - Date.now();
  if (diff <= 0) return { label: "Expired", color: "#ef4444" };
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  if (days === 0 && hours < 6) return { label: `${hours}h left ⚡`, color: "#ef4444" };
  if (days === 0) return { label: `${hours}h left`, color: "#f59e0b" };
  if (days <= 2) return { label: `${days}d ${hours}h left`, color: "#f59e0b" };
  return { label: `${days}d left`, color: "#16a34a" };
}

function timeAgo(d) {
  const s = (Date.now() - (d instanceof Date ? d : new Date(d))) / 1000;
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

/* ─── Avatar ────────────────────────────────────────────────── */
function Avatar({ name = "?", size = 28 }) {
  const initials = name.split(" ").map(n => n[0] || "").slice(0, 2).join("").toUpperCase() || "?";
  const hue = [...name].reduce((a, c) => a + c.charCodeAt(0), 0) % 360;
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", background: `hsl(${hue},42%,22%)`, border: `1.5px solid hsl(${hue},50%,38%)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.33, fontWeight: 900, color: `hsl(${hue},70%,80%)`, fontFamily: "'Lato',sans-serif", flexShrink: 0 }}>
      {initials}
    </div>
  );
}

function TierBadge({ reward }) {
  const t = getTier(reward || 0);
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, background: t.bg, border: `0.5px solid ${t.color}44`, padding: "3px 9px", fontSize: 9, fontWeight: 700, color: t.color, fontFamily: "'Lato',sans-serif", letterSpacing: "0.11em", textTransform: "uppercase" }}>
      {t.emoji} {t.name}
    </span>
  );
}

/* ─── Scrolling ticker ──────────────────────────────────────── */
function LiveTicker({ bounties, fmt }) {
  const items = useMemo(() => [...bounties].sort((a, b) => {
    const ta = a.createdAt?.toDate?.() || 0;
    const tb = b.createdAt?.toDate?.() || 0;
    return tb - ta;
  }).slice(0, 6), [bounties]);
  if (!items.length) return null;
  const msgs = [...items, ...items].map((b, i) => (
    <span key={i} style={{ fontSize: 11, color: "rgba(245,240,232,.75)", fontFamily: "'Lato',sans-serif", padding: "0 48px", fontWeight: 500, whiteSpace: "nowrap" }}>
      💰 <strong style={{ color: GOLD }}>{b.postedBy || "A student"}</strong> posted "{b.title?.slice(0, 38)}{b.title?.length > 38 ? "…" : ""}" — {fmt(b.reward)}
    </span>
  ));
  return (
    <div style={{ background: "#07131f", borderBottom: `1px solid rgba(184,150,62,.25)`, height: 36, display: "flex", alignItems: "center", overflow: "hidden" }}>
      <div style={{ padding: "0 16px", background: GOLD, height: "100%", display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
        <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#ef4444", animation: "blink 1.2s infinite" }} />
        <span style={{ fontSize: 9, fontWeight: 900, color: NAVY, letterSpacing: "0.18em", textTransform: "uppercase", fontFamily: "'Lato',sans-serif" }}>LIVE</span>
      </div>
      <div style={{ flex: 1, overflow: "hidden" }}>
        <div style={{ display: "inline-flex", animation: "ticker 45s linear infinite" }}>{msgs}</div>
      </div>
    </div>
  );
}

/* ─── How It Works ──────────────────────────────────────────── */
const STEPS = [
  {
    n: "01",
    emoji: "📤",
    title: "How to Request Materials on the Bounty Board",
    body: "Need a specific study material that isn't on LAN Library? Post a bounty and a creator will produce it for you — or you'll get your money back.",
    link: "/lan/net/help-center/article/bounty-board-for-buyers",
  },
  {
    n: "02",
    emoji: "🎯",
    title: "Earning Money on the Bounty Board",
    body: "The Bounty Board lets you earn cash by creating materials students specifically request. Find bounties that match your expertise, complete them, and get paid instantly.",
    link: "/lan/net/help-center/article/bounty-board-for-authors",
  },
  {
    n: "03",
    emoji: "💸",
    title: "How the Bounty Board Works",
    body: "The LAN Library Bounty Board is a community-powered marketplace that connects students who need specific study materials with authors and lecturers who can create them — with automatic, transparent payouts for everyone involved.",
    link: "/lan/net/help-center/article/bounty-board",
  },
];
function HowItWorksPanel() {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ background: "#fff", border: "0.5px solid #e5ddd0", marginBottom: 24 }}>
      <button onClick={() => setOpen(p => !p)} style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", background: "none", border: "none", cursor: "pointer" }}>
        <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={GOLD} strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
          <span style={{ fontSize: 12, fontWeight: 700, color: NAVY, fontFamily: "'Lato',sans-serif", letterSpacing: "0.06em", textTransform: "uppercase" }}>How the Bounty Board Works</span>
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={NAVY} strokeWidth="2.5" style={{ transform: open ? "rotate(180deg)" : "none", transition: "0.25s" }}><polyline points="6 9 12 15 18 9" /></svg>
        </span>
      </button>
      {open && (
        <div style={{ borderTop: "0.5px solid #f0ebe0", padding: "24px 20px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 16, marginBottom: 20 }}>
           {STEPS.map(s => (
  <div key={s.n} style={{ background: CREAM, border: "0.5px solid rgba(184,150,62,.2)", padding: "20px", display: "flex", flexDirection: "column" }}>
    <div style={{ fontSize: 32, marginBottom: 10 }}>{s.emoji}</div>
    <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 11, fontWeight: 900, color: "rgba(13,34,68,.15)", letterSpacing: "0.1em", marginBottom: 6 }}>{s.n}</div>
    <h4 style={{ fontFamily: "'Playfair Display',serif", fontSize: 15, fontWeight: 700, color: NAVY, marginBottom: 6, lineHeight: 1.3 }}>{s.title}</h4>
    <p style={{
      fontSize: 12, color: "#666", fontFamily: "'Lato',sans-serif", lineHeight: 1.75,
      margin: "0 0 10px",
      display: "-webkit-box",
      WebkitLineClamp: 3,
      WebkitBoxOrient: "vertical",
      overflow: "hidden",
    }}>{s.body}</p>
    
      <a href={s.link}
      target="_blank"
      rel="noreferrer"
      style={{
        fontSize: 11, fontWeight: 700, color: GOLD,
        fontFamily: "'Lato',sans-serif", textDecoration: "none",
        display: "inline-flex", alignItems: "center", gap: 4,
        marginTop: "auto",
      }}
      onMouseEnter={e => e.currentTarget.style.color = GOLDD}
      onMouseLeave={e => e.currentTarget.style.color = GOLD}
    >
      Read more
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <line x1="7" y1="17" x2="17" y2="7"/><polyline points="7 7 17 7 17 17"/>
      </svg>
    </a>
  </div>
))}
          </div>
          <div style={{ background: NAVY, padding: "14px 18px", display: "flex", gap: 12, alignItems: "center" }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={GOLD} strokeWidth="2" style={{ flexShrink: 0 }}><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
            <p style={{ fontSize: 12, color: "rgba(245,240,232,.7)", fontFamily: "'Lato',sans-serif", lineHeight: 1.7, margin: 0 }}>
              Every reward is locked in escrow the moment a request is posted. <strong style={{ color: GOLD }}>Authors are always paid</strong> for approved submissions.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── BID MODAL ─────────────────────────────────────────────── */
function BidModal({ bounty, user, onClose, fmt }) {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const payout = Math.round((bounty.reward || 0) * 0.8);
  const dlInfo = getDeadlineInfo(bounty.deadline);
  const slotsPct = Math.min(100, ((bounty.proposals || 0) / (bounty.maxProposals || 10)) * 100);
  const slotsLeft = Math.max(0, (bounty.maxProposals || 10) - (bounty.proposals || 0));

  const handleClaim = async () => {
    setLoading(true); setError("");
    try {
      await incrementProposals(bounty.id);
      await claimBountyWithNotification(bounty.id, user.uid, user);
      setSubmitted(true);
    } catch (e) {
      console.error("Claim failed:", e);
      if (e.message === "ALREADY_BID") setError("You already bid on this bounty. Go to Library → Publish to upload your material.");
      else if (e.message === "BOUNTY_PENDING_APPROVAL") setError("Someone already submitted a fulfillment — this bounty is under review.");
      else if (e.message === "BOUNTY_FULFILLED") setError("This bounty has already been fulfilled.");
      else if (e.message === "BOUNTY_NOT_FOUND") setError("This bounty no longer exists.");
      else setError(`Could not place bid: ${e.message}`);
    } finally { setLoading(false); }
  };

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(7,19,31,.78)", zIndex: 999, display: "flex", alignItems: "center", justifyContent: "center", padding: 24, backdropFilter: "blur(4px)" }}>
      <div onClick={e => e.stopPropagation()} style={{ background: "#fff", maxWidth: 500, width: "100%", border: "0.5px solid #e5ddd0", animation: "fadeUp .32s cubic-bezier(.4,0,.2,1) both", maxHeight: "92vh", overflowY: "auto", position: "relative" }}>
        {submitted ? (
          <div style={{ padding: "48px 32px", textAlign: "center" }}>
            <div style={{ fontSize: 64, marginBottom: 16 }}>🎉</div>
            <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: 26, fontWeight: 700, color: NAVY, marginBottom: 10 }}>Bid Placed!</h3>
            <p style={{ fontSize: 13, color: "#888", fontFamily: "'Lato',sans-serif", lineHeight: 1.75, marginBottom: 8 }}>
              You've been added to the bidder list for this bounty. Now upload the material to fulfil it and unlock:
            </p>
            <p style={{ fontFamily: "'Playfair Display',serif", fontSize: 28, fontWeight: 700, color: "#16a34a", marginBottom: 24 }}>
              {fmt(payout)}
            </p>
            <div style={{ padding: "12px 16px", background: "rgba(13,34,68,.04)", border: ".5px solid rgba(13,34,68,.12)", marginBottom: 24, textAlign: "left" }}>
              <p style={{ fontSize: 11, color: "#555", fontFamily: "'Lato',sans-serif", margin: 0, lineHeight: 1.7 }}>
                ⚡ <strong>First to submit a valid document wins the full reward.</strong> Other bidders can also submit — the bounty poster decides which to accept. Upload your material now before someone else does.
              </p>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <a href="/library/publish"
                style={{ display: "block", padding: "16px", background: GOLD, color: NAVY, textDecoration: "none", fontSize: 13, fontWeight: 700, fontFamily: "'Lato',sans-serif", textAlign: "center", letterSpacing: "0.09em", textTransform: "uppercase" }}>
                📤 Upload Your Material Now →
              </a>
              <button onClick={onClose}
                style={{ padding: "12px", background: "transparent", border: "0.5px solid #e5ddd0", fontSize: 12, color: "#888", cursor: "pointer", fontFamily: "'Lato',sans-serif" }}>
                Upload Later
              </button>
            </div>
          </div>
        ) : (
          <>
            <div style={{ background: NAVY, backgroundImage: "radial-gradient(rgba(184,150,62,.07) 1px,transparent 1px)", backgroundSize: "20px 20px", padding: "22px 24px" }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", gap: 7, marginBottom: 10, flexWrap: "wrap" }}>
                    <TierBadge reward={bounty.reward} />
                    {bounty.university && <span style={{ background: "rgba(184,150,62,.14)", border: "0.5px solid rgba(184,150,62,.3)", color: GOLDD, fontSize: 9, fontWeight: 700, padding: "3px 10px", fontFamily: "'Lato',sans-serif", letterSpacing: "0.1em", textTransform: "uppercase" }}>{bounty.university}</span>}
                  </div>
                  <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: 18, fontWeight: 700, color: "#fff", lineHeight: 1.3, margin: "0 0 4px", maxWidth: 360 }}>{bounty.title}</h3>
                  {bounty.department && <p style={{ fontSize: 11, color: "rgba(184,150,62,.6)", margin: 0, fontFamily: "'Lato',sans-serif" }}>{bounty.department}</p>}
                </div>
                <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,.4)", fontSize: 24, lineHeight: 1, flexShrink: 0, marginLeft: 12 }}>×</button>
              </div>
            </div>
            <div style={{ padding: 24 }}>
              <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
                <div style={{ flex: 1, background: CREAM, border: `1.5px solid ${GOLD}44`, padding: "16px 18px" }}>
                  <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "#aaa", fontFamily: "'Lato',sans-serif", marginBottom: 4 }}>Your Payout (80%)</div>
                  <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 32, fontWeight: 700, color: NAVY, lineHeight: 1 }}>
                      {fmt(payout)}
                  </div>
                </div>
                <div style={{ flex: 1, background: "rgba(13,34,68,.04)", border: "0.5px solid #e5ddd0", padding: "16px 18px" }}>
                  <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "#aaa", fontFamily: "'Lato',sans-serif", marginBottom: 4 }}>Full Bounty</div>
                  <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 32, fontWeight: 700, color: "#ccc", lineHeight: 1 }}>
                      {fmt(bounty.reward)}
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 14, alignItems: "center" }}>
                {bounty.deadline && <span style={{ fontSize: 10, fontWeight: 700, color: dlInfo.color, fontFamily: "'Lato',sans-serif" }}>⏱ {dlInfo.label}</span>}
                {bounty.postedBy && (
                  <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 10, color: "#888", fontFamily: "'Lato',sans-serif" }}>
                    <Avatar name={bounty.postedBy} size={18} /> Posted by <strong style={{ color: NAVY, marginLeft: 3 }}>{bounty.postedBy}</strong>
                  </span>
                )}
              </div>
              <div style={{ marginBottom: 18 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
                  <span style={{ fontSize: 10, color: "#aaa", fontFamily: "'Lato',sans-serif" }}>{bounty.proposals || 0}/{bounty.maxProposals || 10} proposal slots taken</span>
                  <span style={{ fontSize: 10, fontWeight: 700, color: slotsLeft <= 2 ? "#ef4444" : GOLD, fontFamily: "'Lato',sans-serif" }}>{slotsLeft} left</span>
                </div>
                <div style={{ height: 4, background: "#e5ddd0" }}>
                  <div style={{ height: "100%", width: `${slotsPct}%`, background: slotsPct > 80 ? "#ef4444" : GOLD, transition: "width .5s" }} />
                </div>
              </div>
              <div style={{ background: "rgba(13,34,68,.04)", border: "0.5px solid rgba(13,34,68,.1)", padding: "12px 14px", marginBottom: 16, display: "flex", gap: 10 }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={NAVY} strokeWidth="2" style={{ flexShrink: 0, marginTop: 1 }}><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                <p style={{ fontSize: 11, color: "#555", fontFamily: "'Lato',sans-serif", margin: 0, lineHeight: 1.65 }}>
                  Reward held in escrow. Released automatically when the student approves your upload. <strong>The requester will be notified of your bid.</strong>
                </p>
              </div>
              {error && (
                <div style={{ padding: "12px 14px", background: "rgba(220,38,38,.06)", border: "0.5px solid rgba(220,38,38,.25)", color: "#dc2626", fontSize: 12, fontFamily: "'Lato',sans-serif", marginBottom: 14, display: "flex", gap: 8, alignItems: "flex-start" }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" style={{ flexShrink: 0, marginTop: 1 }}><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                  {error}
                </div>
              )}
              <button onClick={handleClaim} disabled={loading}
                style={{ width: "100%", padding: "14px 20px", background: loading ? "#ccc" : GOLD, color: NAVY, border: "none", fontSize: 12, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", cursor: loading ? "not-allowed" : "pointer", fontFamily: "'Lato',sans-serif", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, transition: "background .18s" }}
                onMouseEnter={e => { if (!loading) e.currentTarget.style.background = GOLDD; }}
                onMouseLeave={e => { if (!loading) e.currentTarget.style.background = GOLD; }}>
                {loading
                  ? <><span style={{ width: 14, height: 14, border: "2px solid rgba(13,34,68,.25)", borderTopColor: NAVY, borderRadius: "50%", display: "inline-block", animation: "spin .7s linear infinite" }} />Claiming…</>
                  : <>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={NAVY} strokeWidth="2.5"><path d="M22 2L11 13" /><path d="M22 2L15 22 11 13 2 9l20-7z" /></svg>
                      Claim &amp; Earn {fmt(payout)}
                  </>
                }
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ─── BidButton ─────────────────────────────────────────────── */
function BidButton({ bounty, user }) {
  const [open, setOpen] = useState(false);

  // Fulfilled — show purchase/view link
  if (bounty.status === "fulfilled") {
    return bounty.linkedBookId
      ? (
        <a
          href={`/book/preview?id=${bounty.linkedBookId}`}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: "10px 20px",
            background: GOLD,
            color: NAVY,
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: "0.09em",
            textTransform: "uppercase",
            fontFamily: "'Lato',sans-serif",
            textDecoration: "none",
            cursor: "pointer",
            transition: "background 0.18s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = GOLDD)}
          onMouseLeave={(e) => (e.currentTarget.style.background = GOLD)}
        >
          📖 View & Purchase
        </a>
      )
      : (
        <span
          style={{
            fontSize: 11,
            color: "#16a34a",
            fontFamily: "'Lato',sans-serif",
            fontWeight: 700
          }}
        >
          ✅ Fulfilled
        </span>
      );
  }

  // Pending approval — locked state
  if (bounty.status === "pending_approval") {
    return (
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          padding: "10px 20px",
          background: "rgba(245,158,11,.08)",
          border: "0.5px solid rgba(245,158,11,.3)",
          color: "#b45309",
          fontSize: 11,
          fontWeight: 700,
          fontFamily: "'Lato',sans-serif",
          borderRadius: "4px",
        }}
      >
        ⏳ Under Review
      </span>
    );
  }

  // Check if current user already bid
  const alreadyBid = user && (bounty.claimedBy || []).includes(user.uid);

  // Already bid — show upload button
  if (alreadyBid) {
    return (
      <a
        href="/library/publish"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          padding: "10px 20px",
          background: "#16a34a",
          color: "#fff",
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          fontFamily: "'Lato',sans-serif",
          textDecoration: "none",
          whiteSpace: "nowrap",
          cursor: "pointer",
          transition: "background 0.18s",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = "#15803d")}
        onMouseLeave={(e) => (e.currentTarget.style.background = "#16a34a")}
      >
        📤 Upload Fulfillment
      </a>
    );
  }

  // Open bounty — anyone can bid
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 7,
          padding: "10px 20px",
          background: NAVY,
          color: "#fff",
          border: "none",
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          fontFamily: "'Lato',sans-serif",
          cursor: "pointer",
          transition: "background .15s",
          whiteSpace: "nowrap",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = "#1a3a6e")}
        onMouseLeave={(e) => (e.currentTarget.style.background = NAVY)}
      >
        Bid on Bounty
        <svg
          width="11"
          height="11"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
        >
          <line x1="7" y1="17" x2="17" y2="7" />
          <polyline points="7 7 17 7 17 17" />
        </svg>
      </button>

      {open && typeof document !== "undefined" && createPortal(
        <BidModal bounty={bounty} user={user} onClose={() => setOpen(false)} />,
        document.body
      )}
    </>
  );
}


/* ─── CREATE MODAL ──────────────────────────────────────────── */
export function CreateModal({ onClose, user, userProfile }) {
  /* ── Build country list from africanUniversities ── */
  const countryList = UNIVERSITY_COUNTRIES.map(name => ({ name }));

  /* ── Form state ── */
  const [form, setForm] = useState({
    title: "", university: "", department: "",
    reward: "",          // local-currency amount entered by user
    rewardNGN: "",       // NGN equivalent (computed, stored in Firestore)
    deadline: "", tags: "",
    universityCountry: "",
    description: "",  // ← add this

  });
  const [contact, setContact] = useState({
    name: userProfile?.displayName || user?.displayName || "",
    email: user?.email || "",
    phone: userProfile?.phoneNumber || "",
  });

  /* ── Currency / exchange rates ── */
  const [rates, setRates] = useState(FALLBACK_RATES);
  const [ratesLoaded, setRatesLoaded] = useState(false);

  /* ── Payment step ── */
  const [payStep, setPayStep] = useState("form");
  const [payMethod, setPayMethod] = useState("flutterwave");
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");
  const [fwLoaded, setFwLoaded] = useState(false);
  const [walletBalance, setWalletBalance] = useState(null);
  const [showPin, setShowPin] = useState(false);
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState("");

  /* ── Derived currency info for selected country ── */
  const currInfo = COUNTRY_CURRENCY_MAP[form.universityCountry] || { currency: "NGN", symbol: "₦", flag: "🌍" };
  const isNGN = currInfo.currency === "NGN";

  /* ── Reward conversions ── */
  const localAmount = Number(form.reward) || 0;
  const ngnAmount = isNGN
    ? localAmount
    : Math.round(localAmount / (rates[currInfo.currency] ?? FALLBACK_RATES[currInfo.currency] ?? 1));
  const payoutNGN = Math.round(ngnAmount * 0.8);

  /* ── Fetch live exchange rates ── */
  useEffect(() => {
    const fetchRates = async () => {
      try {
        const res = await fetch("https://open.er-api.com/v6/latest/NGN");
        if (!res.ok) throw new Error();
        const data = await res.json();
        if (data?.rates) setRates({ ...FALLBACK_RATES, ...data.rates, NGN: 1 });
      } catch { /* use fallback */ }
      finally { setRatesLoaded(true); }
    };
    fetchRates();
  }, []);

  /* ── Load Flutterwave SDK ── */
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.FlutterwaveCheckout) { setFwLoaded(true); return; }
    const s = document.createElement("script");
    s.src = "https://checkout.flutterwave.com/v3.js"; s.async = true;
    s.onload = () => setFwLoaded(true); document.body.appendChild(s);
  }, []);

  /* ── Load wallet balance on pay step ── */
  useEffect(() => {
    if (payStep !== "pay" || !user?.uid) return;
    getDoc(doc(db, "sellers", user.uid))
      .then(s => { if (s.exists()) setWalletBalance(s.data().accountBalance || 0); })
      .catch(() => { });
  }, [payStep, user?.uid]);

  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }));
  const setC = k => e => setContact(p => ({ ...p, [k]: e.target.value }));

  /* ── Handle country change (resets university) ── */
  const handleCountryChange = (countryName) => {
    setForm(p => ({ ...p, universityCountry: countryName, university: "" }));
  };

  /* ── Universities for selected country ── */
  const universityOptions = form.universityCountry
    ? (UNIVERSITIES_BY_COUNTRY[form.universityCountry] || [])
    : [];

  /* ── Continue to payment ── */
  const handleContinueToPay = () => {
    if (!user) { setError("Please sign in."); return; }
    if (!form.title) { setError("Please enter a document title."); return; }
    if (!form.description || form.description.trim().length < 20) {
      setError("Please add more detail to your requirements (at least 20 characters).");
      return;
    }
    if (form.description.length > 500) {
      setError("Requirements must be under 500 characters.");
      return;
    }
    if (localAmount < 1) { setError("Please enter a reward amount."); return; }
    if (ngnAmount < 100) { setError("Minimum bounty reward is ₦100 equivalent."); return; }
    if (!contact.email || !contact.phone) { setError("Please fill in your email and phone."); return; }
    setError(""); setPayStep("pay");
  };

  /* ── Submit bounty after payment ── */
  const submitBounty = async (txRef) => {
    try {
      const tags = form.tags ? form.tags.split(",").map(t => t.trim()).filter(Boolean) : [];
      await createBounty({
        ...form,
        reward: ngnAmount,          // always store NGN
        rewardLocal: localAmount,         // original local amount
        rewardCurrency: currInfo.currency,  // original currency
        tags,
        paymentRef: txRef, paymentMethod: payMethod,
        contactEmail: contact.email, contactPhone: contact.phone,
      }, user);
      onClose();
    } catch (e) {
      console.error("Full error:", e); // <-- add this
      setError("Failed to post bounty after payment. Contact support with ref: " + txRef);
    } finally {
      setProcessing(false);
    }
  };

  /* ── Flutterwave payment ── */
  const handleFlutterwavePayment = () => {
    if (!fwLoaded || !window.FlutterwaveCheckout) {
      setError("Payment gateway loading. Please wait."); return;
    }
    const txRef = `bounty_${user.uid}_${Date.now()}`;
    window.FlutterwaveCheckout({
      public_key: process.env.NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY,
      tx_ref: txRef,
      amount: isNGN ? ngnAmount : localAmount,
      currency: currInfo.currency,
      payment_options: "card,ussd,banktransfer,mobilemoney",
      customer: { email: contact.email, phone_number: contact.phone, name: contact.name },
      customizations: {
        title: "LAN Library — Post a Bounty",
        description: `Bounty: ${form.title}`,
        logo: "/lanlog.png",
      },
      callback: async (res) => {
        if (res.status === "successful" || res.status === "completed") {
          setProcessing(true); await submitBounty(txRef);
        } else {
          setError("Payment was not successful. Please try again.");
        }
      },
      onclose: () => setProcessing(false),
    });
  };

  /* ── Wallet payment ── */
  const handleWalletPay = async () => {
    if (!pin || pin.length < 4) { setPinError("Enter your 4-digit PIN."); return; }
    const sellerSnap = await getDoc(doc(db, "sellers", user.uid));
    if (!sellerSnap.exists()) { setPinError("Wallet not active."); return; }
    const sd = sellerSnap.data();
    const storedPin = sd.transactionPin || sd.transferPin;
    if (!storedPin) { setPinError("No PIN set. Go to your seller account to set a PIN first."); return; }
    if (pin !== storedPin.toString()) { setPinError("Incorrect PIN. Please try again."); return; }
    if ((sd.accountBalance || 0) < ngnAmount) {
      setPinError(`Insufficient balance. You have ₦${(sd.accountBalance || 0).toLocaleString("en-NG")}.`);
      return;
    }
    setProcessing(true); setPinError("");
    try {
      const { runTransaction: rt, doc: fd, serverTimestamp: sts } = await import("firebase/firestore");
      await rt(db, async (txn) => {
        const ref = fd(db, "sellers", user.uid);
        const fresh = await txn.get(ref);
        const bal = fresh.data()?.accountBalance || 0;
        if (bal < ngnAmount) throw new Error("Insufficient balance.");
        txn.update(ref, { accountBalance: bal - ngnAmount, updatedAt: sts() });
      });
      await submitBounty(`wallet_${user.uid}_${Date.now()}`);
    } catch (e) {
      setPinError(e.message || "Wallet payment failed.");
      setProcessing(false);
    }
  };

  /* ── Shared input style ── */
  const inp = {
    padding: "10px 14px", border: "0.5px solid #e5ddd0", fontSize: 13,
    fontFamily: "'Lato',sans-serif", outline: "none", width: "100%",
    background: BG, color: NAVY, boxSizing: "border-box", transition: "border-color .18s",
  };

  return (
    <>
      <style>{`
        .ci:focus { border-color: ${GOLD} !important; outline: none; }
        .country-scroll::-webkit-scrollbar { width: 4px; }
        .country-scroll::-webkit-scrollbar-track { background: #f5f1ea; }
        .country-scroll::-webkit-scrollbar-thumb { background: rgba(184,150,62,.35); border-radius: 2px; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
      `}</style>

      <div onClick={onClose}
        style={{
          position: "fixed", inset: 0, background: "rgba(7,19,31,.78)", zIndex: 999,
          display: "flex", alignItems: "center", justifyContent: "center",
          padding: 24, backdropFilter: "blur(4px)"
        }}>
        <div onClick={e => e.stopPropagation()}
          style={{
            background: "#fff", border: "0.5px solid #e5ddd0", maxWidth: 560, width: "100%",
            position: "relative", animation: "fadeUp .32s cubic-bezier(.4,0,.2,1) both",
            maxHeight: "92vh", overflowY: "auto"
          }}>

          {/* ── Modal header ── */}
          <div style={{
            background: NAVY,
            backgroundImage: "radial-gradient(rgba(184,150,62,.07) 1px,transparent 1px)",
            backgroundSize: "20px 20px", padding: "22px 26px",
            display: "flex", alignItems: "flex-start", justifyContent: "space-between"
          }}>
            <div>
              <p style={{
                fontSize: 9, fontWeight: 700, letterSpacing: "0.18em",
                textTransform: "uppercase", color: GOLD, margin: "0 0 5px",
                fontFamily: "'Lato',sans-serif"
              }}>
                {payStep === "form" ? "New Request" : "Secure Payment"}
              </p>
              <h3 style={{
                fontFamily: "'Playfair Display',serif", fontSize: 22,
                fontWeight: 700, color: "#fff", margin: 0
              }}>
                {payStep === "form" ? "Post a Bounty" : "Escrow Payment"}
              </h3>
            </div>
            <button onClick={onClose}
              style={{
                background: "none", border: "none", cursor: "pointer",
                color: "rgba(255,255,255,.4)", fontSize: 24, lineHeight: 1
              }}>×</button>
          </div>

          <div style={{ padding: "24px 28px" }}>
            {error && (
              <div style={{
                padding: "12px 14px", background: "rgba(220,38,38,.07)",
                border: "0.5px solid rgba(220,38,38,.25)", color: "#dc2626",
                fontSize: 12, fontFamily: "'Lato',sans-serif", marginBottom: 16
              }}>
                {error}
              </div>
            )}

            {/* ════════════ STEP 1: FORM ════════════ */}
            {payStep === "form" && (
              <>
                <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 20 }}>

                  {/* Title */}
                  <input className="ci" placeholder="Document title or description (be specific)"
                    style={inp} value={form.title} onChange={set("title")} />

{/* ── Document Type + Auto-template ── */}
<div>
  <label style={{ display: "block", fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#aaa", marginBottom: 6, fontFamily: "'Lato',sans-serif" }}>
    Document Type
  </label>
  <select className="ci" style={inp}
    onChange={e => {
      const templates = {
        "Past Question":   "Course Code:\nYear:\nSemester:\nTopics covered:\nSpecific questions needed:",
        "Lecture Note":    "Course title:\nLecturer name:\nWeek/Topic:\nFormat preferred (PDF/Word):\nAdditional context:",
        "Textbook":        "Book title:\nAuthor (if known):\nEdition:\nChapters needed:\nISBN (if known):",
        "Assignment":      "Course:\nAssignment title:\nDeadline:\nRequirements:\nMark allocation:",
        "Thesis/Project":  "Topic area:\nResearch questions:\nMethodology preference:\nPage range:\nCitation style:",
        "Summary/Notes":   "Subject:\nTopic:\nAcademic level:\nKey areas to cover:\nPreferred format:",
        "Lab Manual":      "Course:\nExperiment title:\nEquipment list needed:\nProcedure detail level:\nSafety requirements:",
        "Exam Revision":   "Subject:\nExam date:\nTopics to cover:\nDifficulty level:\nPast paper year (if any):",
      };
      if (templates[e.target.value]) {
        setForm(p => ({ ...p, description: templates[e.target.value] }));
      }
    }}>
    <option value="">— Select type to auto-fill template —</option>
    {Object.keys({
      "Past Question": 1, "Lecture Note": 1, "Textbook": 1,
      "Assignment": 1, "Thesis/Project": 1, "Summary/Notes": 1,
      "Lab Manual": 1, "Exam Revision": 1,
    }).map(t => <option key={t} value={t}>{t}</option>)}
  </select>
</div>

{/* ── Description / Requirements ── */}
<div>
  <label style={{ display: "block", fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#aaa", marginBottom: 6, fontFamily: "'Lato',sans-serif" }}>
    Requirements <span style={{ color: "#ccc", fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>(select a type above to auto-fill)</span>
  </label>
  <textarea className="ci" rows={5}
    placeholder={"Course Code:\nYear:\nSemester:\nTopics covered:"}
    style={{ ...inp, resize: "vertical", lineHeight: 1.7 }}
    value={form.description || ""}
    onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
    aria-label="Document requirements"
  />
  <p style={{ fontSize: 10, color: "#aaa", margin: "4px 0 0", fontFamily: "'Lato',sans-serif" }}>
    {(form.description || "").length}/500 · Be specific — better descriptions get faster fulfillments
  </p>
                  </div>
                  
                  {/* ── Country selector (full-width, searchable) ── */}
                  <div>
                    <label style={{
                      display: "block", fontSize: 10, fontWeight: 700,
                      letterSpacing: "0.1em", textTransform: "uppercase",
                      color: "#aaa", marginBottom: 6, fontFamily: "'Lato',sans-serif"
                    }}>
                      Your Country
                    </label>
                    <CountrySelector
                      selected={form.universityCountry}
                      onSelect={handleCountryChange}
                      countries={countryList}
                    />
                    {form.universityCountry && !isNGN && ratesLoaded && (
                      <p style={{
                        fontSize: 10, color: "#888", fontFamily: "'Lato',sans-serif",
                        margin: "5px 0 0", display: "flex", alignItems: "center", gap: 5
                      }}>
                        <span>{currInfo.flag}</span>
                        Live rate: <strong style={{ color: NAVY }}>
                          1 {currInfo.currency} = ₦{(1 / (rates[currInfo.currency] ?? FALLBACK_RATES[currInfo.currency] ?? 1)).toFixed(2)}
                        </strong>
                        &nbsp;· open.er-api.com
                      </p>
                    )}
                  </div>

                  {/* ── University (filtered by country) ── */}
                  <div>
                    <label style={{
                      display: "block", fontSize: 10, fontWeight: 700,
                      letterSpacing: "0.1em", textTransform: "uppercase",
                      color: "#aaa", marginBottom: 6, fontFamily: "'Lato',sans-serif"
                    }}>
                      University {!form.universityCountry && <span style={{ color: "#ccc", fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>(select a country first)</span>}
                    </label>
                    <select className="ci" style={inp} value={form.university}
                      onChange={set("university")} disabled={!form.universityCountry}>
                      <option value="">— Select University —</option>
                      {universityOptions.map(u => (
                        <option key={u.name || u} value={u.name || u}>
                          {u.name || u}
                        </option>
                      ))}
                    </select>
                    {form.universityCountry && universityOptions.length === 0 && (
                      <p style={{ fontSize: 10, color: "#f59e0b", fontFamily: "'Lato',sans-serif", margin: "4px 0 0" }}>
                        No universities listed for this country yet — you can still proceed.
                      </p>
                    )}
                  </div>

                  {/* ── Department ── */}
                  <div>
                    <label style={{
                      display: "block", fontSize: 10, fontWeight: 700,
                      letterSpacing: "0.1em", textTransform: "uppercase",
                      color: "#aaa", marginBottom: 6, fontFamily: "'Lato',sans-serif"
                    }}>
                      Department / Faculty
                    </label>
                    <select className="ci" style={inp} value={form.department} onChange={set("department")}>
                      <option value="">— Select Department —</option>
                      {Object.entries(DEPARTMENTS_BY_FACULTY).map(([faculty, depts]) => (
                        <optgroup key={faculty} label={faculty}>
                          {depts.map(d => <option key={d} value={d}>{d}</option>)}
                        </optgroup>
                      ))}
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  {/* ── Reward + deadline ── */}
                  <div style={{ display: "flex", gap: 10 }}>
                    <div style={{ flex: 1, position: "relative" }}>
                      <label style={{
                        display: "block", fontSize: 10, fontWeight: 700,
                        letterSpacing: "0.1em", textTransform: "uppercase",
                        color: "#aaa", marginBottom: 6, fontFamily: "'Lato',sans-serif"
                      }}>
                        Reward amount {form.universityCountry ? `(${currInfo.currency})` : ""}
                      </label>
                      <div style={{ position: "relative" }}>
                        <span style={{
                          position: "absolute", left: 12, top: "50%",
                          transform: "translateY(-50%)", color: GOLD, fontWeight: 700,
                          fontSize: 13, fontFamily: "'Lato',sans-serif", pointerEvents: "none",
                          userSelect: "none"
                        }}>
                          {currInfo.symbol}
                        </span>
                        <input className="ci" type="number" min="1"
                          placeholder={isNGN ? "e.g. 5000" : "e.g. 50"}
                          style={{ ...inp, paddingLeft: currInfo.symbol.length > 2 ? 48 : 28 }}
                          value={form.reward} onChange={set("reward")} />
                      </div>
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={{
                        display: "block", fontSize: 10, fontWeight: 700,
                        letterSpacing: "0.1em", textTransform: "uppercase",
                        color: "#aaa", marginBottom: 6, fontFamily: "'Lato',sans-serif"
                      }}>
                        Deadline (optional)
                      </label>
                      <input className="ci" type="date" style={inp}
                        value={form.deadline} onChange={set("deadline")} />
                    </div>
                  </div>

                  {/* ── Escrow preview panel ── */}
                  {localAmount > 0 && (
                    <div style={{
                      background: NAVY, padding: "16px 18px",
                      display: "flex", justifyContent: "space-between", alignItems: "center",
                      flexWrap: "wrap", gap: 10
                    }}>
                      <div>
                        <div style={{
                          fontSize: 9, color: "rgba(184,150,62,.65)", fontWeight: 700,
                          letterSpacing: "0.14em", textTransform: "uppercase",
                          fontFamily: "'Lato',sans-serif", marginBottom: 3
                        }}>
                          Locked in Escrow
                        </div>
                        <div style={{
                          fontFamily: "'Playfair Display',serif", fontSize: 28,
                          fontWeight: 700, color: "#fff", lineHeight: 1
                        }}>
                          {fmtCurrency(localAmount, currInfo.currency, currInfo.symbol)}
                        </div>
                        {!isNGN && (
                          <div style={{
                            fontSize: 10, color: "rgba(255,255,255,.35)",
                            fontFamily: "'Lato',sans-serif", marginTop: 3
                          }}>
                            ≈ ₦{ngnAmount.toLocaleString("en-NG")} NGN
                          </div>
                        )}
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{
                          fontSize: 9, color: "rgba(255,255,255,.3)",
                          fontFamily: "'Lato',sans-serif", marginBottom: 3
                        }}>
                          Author earns (80%)
                        </div>
                        <div style={{
                          fontFamily: "'Playfair Display',serif", fontSize: 20,
                          fontWeight: 700, color: "#86efac"
                        }}>
                          {fmtCurrency(localAmount * 0.8, currInfo.currency, currInfo.symbol)}
                        </div>
                        {!isNGN && (
                          <div style={{
                            fontSize: 10, color: "rgba(134,239,172,.5)",
                            fontFamily: "'Lato',sans-serif", marginTop: 2
                          }}>
                            ≈ ₦{payoutNGN.toLocaleString("en-NG")} NGN
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Tags */}
                  <input className="ci"
                    placeholder="Tags, comma-separated (e.g. Past Questions, Maths)"
                    style={inp} value={form.tags} onChange={set("tags")} />
                </div>

                {/* Contact details */}
                <p style={{
                  fontSize: 10, fontWeight: 700, letterSpacing: "0.1em",
                  textTransform: "uppercase", color: "#aaa",
                  fontFamily: "'Lato',sans-serif", marginBottom: 10
                }}>
                  Your Contact Details
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
                  <input className="ci" placeholder="Full Name" style={inp}
                    value={contact.name} onChange={setC("name")} />
                  <input className="ci" placeholder="Email address" type="email" style={inp}
                    value={contact.email} onChange={setC("email")} />
                  <input className="ci" placeholder="Phone number" type="tel" style={inp}
                    value={contact.phone} onChange={setC("phone")} />
                </div>

                {/* Security note */}
                <div style={{
                  display: "flex", gap: 10, padding: "12px 14px",
                  background: "rgba(13,34,68,.04)", border: "0.5px solid rgba(13,34,68,.1)",
                  marginBottom: 20
                }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={NAVY}
                    strokeWidth="2" style={{ flexShrink: 0, marginTop: 1 }}>
                    <rect x="3" y="11" width="18" height="11" rx="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                  <p style={{
                    fontSize: 11, color: "#555", fontFamily: "'Lato',sans-serif",
                    margin: 0, lineHeight: 1.65
                  }}>
                    Reward held safely in escrow. Charged only when a valid submission is accepted.
                    Authors receive <strong style={{ color: NAVY }}>80%</strong>, LAN retains 20%.{" "}
                    <strong>All users will be notified of your bounty.</strong>
                  </p>
                </div>

                <button onClick={handleContinueToPay}
                  style={{
                    width: "100%", padding: "13px 28px", background: GOLD, color: NAVY,
                    fontSize: 12, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase",
                    border: "none", cursor: "pointer", fontFamily: "'Lato',sans-serif",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    gap: 8, transition: "background .18s"
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = GOLDD)}
                  onMouseLeave={e => (e.currentTarget.style.background = GOLD)}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={NAVY} strokeWidth="2.5">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="16" />
                    <line x1="8" y1="12" x2="16" y2="12" />
                  </svg>
                  Continue to Payment
                </button>
              </>
            )}

            {/* ════════════ STEP 2: PAYMENT ════════════ */}
            {payStep === "pay" && (
              <>
                {/* Bounty summary card */}
                <div style={{
                  background: CREAM, border: "0.5px solid rgba(184,150,62,.3)",
                  padding: "14px 18px", marginBottom: 20
                }}>
                  <div style={{
                    fontSize: 9, fontWeight: 700, letterSpacing: "0.14em",
                    textTransform: "uppercase", color: GOLD, margin: "0 0 4px",
                    fontFamily: "'Lato',sans-serif"
                  }}>
                    Bounty Summary
                  </div>
                  <p style={{
                    fontFamily: "'Playfair Display',serif", fontSize: 15,
                    fontWeight: 700, color: NAVY, margin: "0 0 4px", lineHeight: 1.3
                  }}>
                    {form.title}
                  </p>
                  {form.university && (
                    <span style={{
                      fontSize: 10, background: NAVY, color: GOLD,
                      padding: "2px 8px", fontWeight: 700, fontFamily: "'Lato',sans-serif"
                    }}>
                      {form.university}
                    </span>
                  )}
                </div>

                {/* Escrow amount */}
                <div style={{
                  background: NAVY, padding: "16px 20px", marginBottom: 20,
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  flexWrap: "wrap", gap: 10
                }}>
                  <div>
                    <div style={{
                      fontSize: 9, color: "rgba(184,150,62,.65)", fontWeight: 700,
                      letterSpacing: "0.14em", textTransform: "uppercase",
                      fontFamily: "'Lato',sans-serif", marginBottom: 3
                    }}>
                      You Pay (Escrow)
                    </div>
                    <div style={{
                      fontFamily: "'Playfair Display',serif", fontSize: 28,
                      fontWeight: 700, color: "#fff"
                    }}>
                      {fmtCurrency(localAmount, currInfo.currency, currInfo.symbol)}
                    </div>
                    {!isNGN && (
                      <div style={{
                        fontSize: 10, color: "rgba(255,255,255,.35)",
                        fontFamily: "'Lato',sans-serif", marginTop: 3
                      }}>
                        ≈ ₦{ngnAmount.toLocaleString("en-NG")} NGN
                      </div>
                    )}
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{
                      fontSize: 9, color: "rgba(255,255,255,.3)",
                      fontFamily: "'Lato',sans-serif", marginBottom: 2
                    }}>
                      Author earns
                    </div>
                    <div style={{
                      fontFamily: "'Playfair Display',serif", fontSize: 18,
                      fontWeight: 700, color: "#86efac"
                    }}>
                      {fmtCurrency(localAmount * 0.8, currInfo.currency, currInfo.symbol)}
                    </div>
                  </div>
                </div>

                {/* Payment method tabs */}
                <p style={{
                  fontSize: 10, fontWeight: 700, letterSpacing: "0.12em",
                  textTransform: "uppercase", color: "#aaa",
                  fontFamily: "'Lato',sans-serif", marginBottom: 10
                }}>
                  Payment Method
                </p>
                <div style={{ display: "flex", border: "0.5px solid #e5ddd0", marginBottom: 20 }}>
                  {[
                    { key: "flutterwave", label: `💳 Card / Bank (${currInfo.currency})`, desc: "Flutterwave checkout" },
                    {
                      key: "wallet", label: "💰 LAN Wallet",
                      desc: walletBalance !== null ? `Balance: ₦${walletBalance.toLocaleString("en-NG")}` : "Loading…"
                    },
                  ].map((opt, i) => (
                    <button key={opt.key}
                      onClick={() => { setPayMethod(opt.key); setShowPin(false); setPinError(""); }}
                      style={{
                        flex: 1, padding: "13px 10px", border: "none", cursor: "pointer",
                        background: payMethod === opt.key ? NAVY : "#fff",
                        color: payMethod === opt.key ? "#fff" : "#666",
                        transition: "all .18s", display: "flex", flexDirection: "column",
                        alignItems: "center", gap: 3,
                        borderRight: i === 0 ? "0.5px solid #e5ddd0" : "none"
                      }}>
                      <span style={{ fontSize: 12, fontWeight: 700 }}>{opt.label}</span>
                      <span style={{ fontSize: 10, opacity: .65 }}>{opt.desc}</span>
                    </button>
                  ))}
                </div>

                {/* Flutterwave pay button */}
                {payMethod === "flutterwave" && (
                  <button onClick={handleFlutterwavePayment}
                    disabled={processing || !fwLoaded}
                    style={{
                      width: "100%", padding: "14px",
                      background: processing || !fwLoaded ? "#ccc" : GOLD,
                      color: NAVY, border: "none", fontSize: 12, fontWeight: 700,
                      letterSpacing: "0.09em", textTransform: "uppercase",
                      cursor: processing || !fwLoaded ? "not-allowed" : "pointer",
                      fontFamily: "'Lato',sans-serif",
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 8
                    }}>
                    {!fwLoaded ? "Loading payment gateway…"
                      : processing
                        ? <><span style={{
                          width: 13, height: 13, border: "2px solid rgba(13,34,68,.25)",
                          borderTopColor: NAVY, borderRadius: "50%", display: "inline-block",
                          animation: "spin .7s linear infinite"
                        }} /> Processing…</>
                        : <>🌐 {currInfo.flag} Pay {fmtCurrency(localAmount, currInfo.currency, currInfo.symbol)} via Flutterwave</>
                    }
                  </button>
                )}

                {/* Wallet — show PIN pad */}
                {payMethod === "wallet" && !showPin && (
                  <button onClick={() => setShowPin(true)}
                    style={{
                      width: "100%", padding: "14px", background: NAVY, color: "#fff",
                      border: "none", fontSize: 12, fontWeight: 700, letterSpacing: "0.09em",
                      textTransform: "uppercase", cursor: "pointer",
                      fontFamily: "'Lato',sans-serif",
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 8
                    }}>
                    💰 Pay with LAN Wallet
                  </button>
                )}
                {payMethod === "wallet" && showPin && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    <p style={{
                      fontSize: 12, color: "#888", fontFamily: "'Lato',sans-serif",
                      margin: 0, textAlign: "center"
                    }}>
                      Enter your 4-digit wallet PIN
                    </p>
                    <div style={{ display: "flex", justifyContent: "center", gap: 10, marginBottom: 4 }}>
                      {Array.from({ length: 4 }, (_, i) => (
                        <div key={i} style={{
                          width: 48, height: 52,
                          border: `1.5px solid ${i < pin.length ? NAVY : "#e5ddd0"}`,
                          background: i < pin.length ? CREAM : "#fff",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: 20, color: i < pin.length ? NAVY : "#e5ddd0"
                        }}>
                          {i < pin.length ? "●" : "○"}
                        </div>
                      ))}
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 6, marginBottom: 4 }}>
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => (
                        <button key={n}
                          onClick={() => { if (pin.length < 4) { setPin(p => p + String(n)); setPinError(""); } }}
                          disabled={pin.length >= 4}
                          style={{
                            height: 48, border: "0.5px solid #e5ddd0", background: "#fff",
                            fontSize: 18, fontWeight: 700, color: NAVY, cursor: "pointer"
                          }}>
                          {n}
                        </button>
                      ))}
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 6, marginBottom: 8 }}>
                      <div />
                      <button onClick={() => { if (pin.length < 4) setPin(p => p + "0"); }}
                        disabled={pin.length >= 4}
                        style={{
                          height: 48, border: "0.5px solid #e5ddd0", background: "#fff",
                          fontSize: 18, fontWeight: 700, color: NAVY, cursor: "pointer"
                        }}>
                        0
                      </button>
                      <button onClick={() => setPin(p => p.slice(0, -1))}
                        style={{
                          height: 48, border: "0.5px solid #e5ddd0", background: "#fff",
                          fontSize: 18, color: "#aaa", cursor: "pointer"
                        }}>
                        ⌫
                      </button>
                    </div>
                    {pinError && (
                      <p style={{
                        fontSize: 11, color: "#dc2626",
                        fontFamily: "'Lato',sans-serif", margin: 0, textAlign: "center"
                      }}>
                        {pinError}
                      </p>
                    )}
                    <button onClick={handleWalletPay}
                      disabled={pin.length < 4 || processing}
                      style={{
                        width: "100%", padding: "14px",
                        background: pin.length < 4 || processing ? "#ccc" : GOLD,
                        color: NAVY, border: "none", fontSize: 12, fontWeight: 700,
                        cursor: pin.length < 4 ? "not-allowed" : "pointer",
                        fontFamily: "'Lato',sans-serif",
                        display: "flex", alignItems: "center", justifyContent: "center", gap: 8
                      }}>
                      {processing ? "Processing…" : "Confirm Payment"}
                    </button>
                  </div>
                )}

                <button onClick={() => { setPayStep("form"); setError(""); }}
                  style={{
                    width: "100%", marginTop: 10, padding: "10px",
                    background: "transparent", border: "0.5px solid #e5ddd0",
                    fontSize: 11, color: "#aaa", cursor: "pointer",
                    fontFamily: "'Lato',sans-serif"
                  }}>
                  ← Edit Bounty Details
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

/* ─── Featured ──────────────────────────────────────────────── */
function FeaturedBounties({ bounties, user }) {
  const featured = bounties.filter(b => (b.reward || 0) >= 20000 && b.status === "open").slice(0, 3);
  if (!featured.length) return null;
  return (
    <div style={{ marginBottom: 32 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
        <div style={{ height: 1, flex: 1, background: "linear-gradient(90deg,transparent,rgba(184,150,62,.4))" }} />
        <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: GOLD, fontFamily: "'Lato',sans-serif", whiteSpace: "nowrap" }}>⭐ High-Value Opportunities</span>
        <div style={{ height: 1, flex: 1, background: "linear-gradient(90deg,rgba(184,150,62,.4),transparent)" }} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))", gap: 14 }}>
        {featured.map(bounty => {
          const payout = Math.round((bounty.reward || 0) * 0.8);
          return (
            <div key={bounty.id} style={{ background: NAVY, backgroundImage: "radial-gradient(rgba(184,150,62,.06) 1px,transparent 1px)", backgroundSize: "18px 18px", border: `1px solid rgba(184,150,62,.3)`, padding: "22px", position: "relative", overflow: "hidden", transition: "transform .22s,box-shadow .22s" }}
              onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = "0 20px 48px rgba(13,34,68,.3)"; }}
              onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "none"; }}>
              <div style={{ display: "flex", gap: 7, marginBottom: 12, flexWrap: "wrap" }}>
                <TierBadge reward={bounty.reward} />
                {bounty.university && <span style={{ background: "rgba(184,150,62,.1)", border: "0.5px solid rgba(184,150,62,.2)", color: GOLDD, fontSize: 9, fontWeight: 700, padding: "3px 9px", fontFamily: "'Lato',sans-serif", letterSpacing: "0.1em" }}>{bounty.university}</span>}
              </div>
              <h4 style={{ fontFamily: "'Playfair Display',serif", fontSize: 15, fontWeight: 700, color: "#fff", lineHeight: 1.38, marginBottom: 14, minHeight: 40 }}>{bounty.title}</h4>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 14 }}>
                <div>
                  <div style={{ fontSize: 9, color: "rgba(184,150,62,.6)", fontWeight: 700, letterSpacing: "0.12em", fontFamily: "'Lato',sans-serif", marginBottom: 2 }}>YOUR PAYOUT</div>
                  <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 28, fontWeight: 700, color: "#fff" }}>₦{payout.toLocaleString("en-NG")}</div>
                </div>
              </div>
              <BidButton bounty={bounty} user={user} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

function AuthSpinner() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: BG }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ width: 48, height: 48, border: `3px solid rgba(184,150,62,.2)`, borderTopColor: GOLD, borderRadius: "50%", animation: "spin 0.7s linear infinite", margin: "0 auto 16px" }} />
        <p style={{ fontFamily: "'Lato',sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: GOLD }}>Loading…</p>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════════ */
export default function AcademicBountyBoardClient() {
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("newest");
  const [modal, setModal] = useState(false);
  const [bounties, setBounties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [userProfile, setUserProfile] = useState(null);
  const searchParams = useSearchParams();
  const highlightId = searchParams?.get("highlight") || null;
  const router = useRouter();
  const { fmt } = useCurrency();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (cu) => {
      if (cu) {
        setUser(cu);
        try { const snap = await getDoc(doc(db, "users", cu.uid)); if (snap.exists()) setUserProfile(snap.data()); } catch { }
      } else { router.push("/auth/signin"); }
      setAuthLoading(false);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsub = subscribeToBounties((list) => { setBounties(list); setLoading(false); });
    return () => unsub();
  }, []);

  const filtered = useMemo(() => {
    let list = [...bounties];
    if (filter === "open") list = list.filter(b => b.status === "open" || b.status === "claimed");
    if (filter === "fulfilled") list = list.filter(b => b.status === "fulfilled" || b.status === "pending_approval");
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(b => b.title?.toLowerCase().includes(q) || b.university?.toLowerCase().includes(q) || b.department?.toLowerCase().includes(q));
    }
    if (sort === "reward") list.sort((a, b) => (b.reward || 0) - (a.reward || 0));
    if (sort === "proposals") list.sort((a, b) => (b.proposals || 0) - (a.proposals || 0));
    return list;
  }, [bounties, filter, search, sort]);

const totalRewards = bounties.reduce((s, b) => s + (b.reward || 0), 0);
  const activeCt = bounties.filter(b => b.status === "open").length;
  const totalProps = bounties.reduce((s, b) => s + (b.proposals || 0), 0);
  const fulfilledCt = bounties.filter(b => b.status === "fulfilled").length;

  if (authLoading) return <AuthSpinner />;
  if (!user) return <AuthSpinner />;

  const statsData = [
    { n: fmt(totalRewards), l: "Total rewards posted", icon: "💰" },
    { n: String(activeCt), l: "Active bounties live", icon: "🔴" },
    { n: String(totalProps), l: "Proposals submitted", icon: "📨" },
    { n: String(fulfilledCt), l: "Bounties fulfilled", icon: "✅" },
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400;1,700&family=Lato:wght@300;400;700;900&display=swap');
        @keyframes fadeUp  {from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
        @keyframes spin    {to{transform:rotate(360deg)}}
        @keyframes blink   {0%,100%{opacity:1}50%{opacity:0.2}}
        @keyframes ticker  {from{transform:translateX(0)}to{transform:translateX(-50%)}}
        @keyframes shimmer {0%,100%{opacity:1}50%{opacity:0.4}}
        @keyframes float   {0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}
        .bb-input:focus{border-color:${GOLD}!important;outline:none}
        .ci:focus{border-color:${GOLD}!important;outline:none}
        .bb-tab:hover{background:rgba(13,34,68,.1)!important}

        /* ── Responsive stats grid: 2 per row on mobile ── */
        .stats-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
        }
        @media(min-width:640px){
          .stats-grid {
            display: flex;
            flex-direction: column;
            gap: 10px;
          }
        }

        /* ── Hero flex → stack on mobile ── */
        .hero-inner {
          display: flex;
          flex-wrap: wrap;
          gap: 32px;
          align-items: flex-start;
          justify-content: space-between;
        }
        @media(max-width:639px){
          .hero-inner { flex-direction: column; }
          .stats-grid { width: 100%; }
        }

        /* ── Stats bar → 2 cols on tiny screens ── */
        .stats-bar {
          display: flex;
          flex-wrap: wrap;
        }
        @media(max-width:479px){
          .stats-bar { display: grid; grid-template-columns: 1fr 1fr; }
        }

        /* ── Filter controls → wrap ── */
        .filter-row {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          align-items: center;
        }

    .bounty-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 14px;
}
@media (min-width: 640px) {
  .bounty-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
  .req-field-error { border-color: #ef4444 !important; }
.char-ok { color: #16a34a; }
.char-warn { color: #f59e0b; }
.char-over { color: #ef4444; }
      `}</style>

      <div style={{ fontFamily: "'Lato',sans-serif", background: BG, minHeight: "100vh", paddingBottom: 80 }}>
        <LiveTicker bounties={bounties} fmt={fmt} />

        {/* HERO */}
        <section style={{ backgroundColor: NAVY, backgroundImage: `radial-gradient(rgba(184,150,62,.07) 1px,transparent 1px),radial-gradient(rgba(255,255,255,.025) 1px,transparent 1px)`, backgroundSize: "28px 28px,14px 14px", backgroundPosition: "0 0,7px 7px", padding: "52px 24px 0", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: -60, right: -60, width: 220, height: 220, border: "0.5px solid rgba(184,150,62,.09)", transform: "rotate(45deg)" }} />
          <div style={{ maxWidth: 1100, margin: "0 auto" }} className="hero-inner">
            {/* Left text */}
            <div style={{ flex: "1 1 300px" }}>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(184,150,62,.14)", border: "1px solid rgba(184,150,62,.3)", borderRadius: 999, padding: "7px 18px", marginBottom: 20 }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill={GOLD} stroke={GOLD} strokeWidth="1"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
                <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: GOLDD, fontFamily: "'Lato',sans-serif" }}>Campus Knowledge Exchange · LAN Library</span>
              </div>
              <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: "clamp(34px,5.5vw,62px)", fontWeight: 900, color: "#fff", lineHeight: 1.02, letterSpacing: "-0.5px", margin: "0 0 4px" }}>Academic</h1>
              <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: "clamp(34px,5.5vw,62px)", fontWeight: 900, color: GOLD, lineHeight: 1.02, letterSpacing: "-0.5px", margin: "0 0 16px" }}>Bounty Board</h1>
              <p style={{ fontFamily: "'Playfair Display',serif", fontStyle: "italic", fontSize: "clamp(14px,2vw,19px)", color: "rgba(245,240,232,.55)", marginBottom: 14 }}>Post a request. Get it fulfilled. Earn rewards.</p>
              <p style={{ fontSize: 14, color: "rgba(245,240,232,.5)", maxWidth: 480, lineHeight: 1.85, fontWeight: 300, marginBottom: 32 }}>
                Can't find a past question or lecture note? Post a paid request and let 2,400+ verified campus sellers compete to create it — reward held safely in escrow.
              </p>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                <button onClick={() => setModal(true)}
                  style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "13px 24px", background: GOLD, color: NAVY, fontSize: 12, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", border: "none", cursor: "pointer", fontFamily: "'Lato',sans-serif", transition: "background .18s" }}
                  onMouseEnter={e => (e.currentTarget.style.background = GOLDD)}
                  onMouseLeave={e => (e.currentTarget.style.background = GOLD)}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={NAVY} strokeWidth="2.5"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="16" /><line x1="8" y1="12" x2="16" y2="12" /></svg>
                  Post a Bounty
                </button>
                <button onClick={() => setFilter("open")}
                  style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "13px 20px", background: "rgba(255,255,255,.06)", color: "rgba(245,240,232,.8)", fontSize: 12, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", border: "0.5px solid rgba(255,255,255,.15)", cursor: "pointer", fontFamily: "'Lato',sans-serif", transition: "background .18s" }}
                  onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,.1)")}
                  onMouseLeave={e => (e.currentTarget.style.background = "rgba(255,255,255,.06)")}>
                  Browse Open Requests
                </button>
              </div>
            </div>

            {/* ── Stats panel — 2-per-row on mobile via .stats-grid ── */}
            <div className="stats-grid">
              {loading
                ? statsData.map(({ l, icon }) => (
                  <div key={l} style={{ background: "rgba(184,150,62,.1)", border: "0.5px solid rgba(184,150,62,.22)", padding: "14px 20px", display: "flex", alignItems: "center", gap: 12 }}>
                    <span style={{ fontSize: 22 }}>{icon}</span>
                    <div>
                      <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 24, fontWeight: 700, color: "rgba(255,255,255,.3)", lineHeight: 1 }}>…</div>
                      <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(184,150,62,.45)", fontFamily: "'Lato',sans-serif", marginTop: 3 }}>{l}</div>
                    </div>
                  </div>
                ))
                : statsData.map(({ n, l, icon }) => (
                  <div key={l} style={{ background: "rgba(184,150,62,.1)", border: "0.5px solid rgba(184,150,62,.22)", padding: "14px 20px", display: "flex", alignItems: "center", gap: 12 }}>
                    <span style={{ fontSize: 22 }}>{icon}</span>
                    <div>
                      <div style={{ fontFamily: "'Playfair Display',serif", fontSize: "clamp(18px,3vw,26px)", fontWeight: 700, color: "#fff", lineHeight: 1 }}>{n}</div>
                      <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(184,150,62,.6)", fontFamily: "'Lato',sans-serif", marginTop: 3 }}>{l}</div>
                    </div>
                  </div>
                ))
              }
            </div>
          </div>

          {/* Stats bar */}
          <div className="stats-bar" style={{ borderTop: "0.5px solid rgba(184,150,62,.15)", marginTop: 40, maxWidth: 1100, marginLeft: "auto", marginRight: "auto" }}>
            {[{ val: "2,400+", label: "Verified Sellers" }, { val: "94%", label: "Fulfilment Rate" }, { val: "48hrs", label: "Avg. Delivery" }, { val: "200+", label: "Institutions" }, { val: "NGN", label: "Native Currency" }].map(({ val, label }) => (
              <div key={label} style={{ flex: "1 1 90px", padding: "18px 16px", borderRight: "0.5px solid rgba(184,150,62,.1)" }}>
                <div style={{ fontFamily: "'Playfair Display',serif", fontSize: "clamp(18px,3vw,24px)", fontWeight: 700, color: "#fff" }}>{val}</div>
                <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(184,150,62,.55)", marginTop: 4, fontFamily: "'Lato',sans-serif" }}>{label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* CONTENT */}
        <div style={{ maxWidth: 1100, margin: "32px auto 0", padding: "0 24px" }}>
          <HowItWorksPanel />
          <FeaturedBounties bounties={bounties} user={user} />

          {/* Filter bar */}
          <div style={{ background: "#fff", border: "0.5px solid #e5ddd0", padding: "14px 16px", marginBottom: 24 }} className="filter-row">
            <div style={{ display: "flex", gap: 0, border: "0.5px solid #e5ddd0", overflow: "hidden", flexShrink: 0 }}>
              {[["all", "All"], ["open", "Live"], ["fulfilled", "Fulfilled"]].map(([key, label], i) => (
                <button key={key} className="bb-tab" onClick={() => setFilter(key)}
                  style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", padding: "9px 16px", border: "none", borderRight: i < 2 ? "0.5px solid #e5ddd0" : "none", cursor: "pointer", fontFamily: "'Lato',sans-serif", background: filter === key ? NAVY : "#fff", color: filter === key ? "#fff" : "#777", transition: "all .16s" }}>
                  {label}
                  {key === "fulfilled" && fulfilledCt > 0 && <span style={{ marginLeft: 5, background: GOLD, color: NAVY, fontSize: 9, fontWeight: 900, padding: "1px 6px", borderRadius: 99, display: "inline-block" }}>{fulfilledCt}</span>}
                </button>
              ))}
            </div>
            <div style={{ flex: 1, minWidth: 160, position: "relative" }}>
              <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#bbb" }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
              </span>
              <input className="bb-input" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search bounties…"
                style={{ width: "100%", padding: "9px 12px 9px 34px", border: "0.5px solid #e5ddd0", fontSize: 13, fontFamily: "'Lato',sans-serif", background: BG, color: NAVY, boxSizing: "border-box", outline: "none" }} />
            </div>
            <select value={sort} onChange={e => setSort(e.target.value)}
              style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", padding: "9px 12px", border: "0.5px solid #e5ddd0", fontFamily: "'Lato',sans-serif", color: NAVY, background: BG, cursor: "pointer", outline: "none", flexShrink: 0 }}>
              <option value="newest">Newest First</option>
              <option value="reward">Highest Reward</option>
              <option value="proposals">Most Proposals</option>
            </select>
          </div>

          {/* Heading */}
          <div style={{ marginBottom: 20 }}>
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", color: GOLD, marginBottom: 6, fontFamily: "'Lato',sans-serif" }}>
              {filter === "fulfilled" ? "Fulfilled Requests" : "Open Requests"}
            </p>
            <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: "clamp(20px,3vw,30px)", fontWeight: 700, color: NAVY }}>
              {filtered.length > 0 ? `${filtered.length} Bounties Found` : "Browse Bounties"}
            </h2>
          </div>

          {/* List */}
          {loading
            ? [1, 2, 3].map(i => (
              <div key={i} style={{ background: "#fff", border: "0.5px solid #e5ddd0", padding: "24px", marginBottom: 12 }}>
                <div style={{ height: 10, background: "#f0ebe0", width: "30%", marginBottom: 14, borderRadius: 4, animation: "shimmer 1.6s ease-in-out infinite" }} />
                <div style={{ height: 20, background: "#f0ebe0", width: "72%", marginBottom: 10, borderRadius: 4 }} />
                <div style={{ height: 10, background: "#f0ebe0", width: "45%", borderRadius: 4 }} />
              </div>
            ))
            : filtered.length === 0
              ? (
                <div style={{ background: "#fff", border: "0.5px solid #e5ddd0", padding: "80px 32px", textAlign: "center" }}>
                  <div style={{ fontSize: 64, marginBottom: 16, animation: "float 3s ease-in-out infinite" }}>📭</div>
                  <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: 26, fontWeight: 700, color: NAVY, marginBottom: 10 }}>No bounties found</h3>
                  <p style={{ fontSize: 14, color: "#aaa", fontFamily: "'Lato',sans-serif", lineHeight: 1.7, maxWidth: 380, margin: "0 auto 28px" }}>Be the first to post a paid academic request.</p>
                  <button onClick={() => setModal(true)} style={{ padding: "13px 32px", background: GOLD, color: NAVY, border: "none", fontSize: 12, fontWeight: 700, letterSpacing: "0.09em", textTransform: "uppercase", cursor: "pointer", fontFamily: "'Lato',sans-serif" }}>Post the First Bounty</button>
                </div>
              ) : <div className="bounty-grid">
                {filtered.map((bounty, i) => (
                  <BountyCard key={bounty.id} bounty={bounty} user={user} highlighted={bounty.id === highlightId} />
                ))}
              </div>
          }

          {/* CTA banner */}
          <div style={{ background: NAVY, backgroundImage: "radial-gradient(rgba(184,150,62,.05) 1px,transparent 1px)", backgroundSize: "22px 22px", padding: "40px 28px", display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 24, marginTop: 40 }}>
            <div>
              <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: "clamp(18px,3vw,26px)", fontWeight: 700, color: "#fff", marginBottom: 8 }}>Turn your knowledge into income</h3>
              <p style={{ fontSize: 13, color: "rgba(255,255,255,.4)", fontWeight: 300, maxWidth: 440, lineHeight: 1.8 }}>Browse open requests, deliver academic materials, and earn direct rewards from students across Africa.</p>
            </div>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <button onClick={() => setFilter("open")}
                style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "13px 24px", background: GOLD, color: NAVY, fontSize: 12, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", border: "none", cursor: "pointer", fontFamily: "'Lato',sans-serif", whiteSpace: "nowrap", transition: "background .18s" }}
                onMouseEnter={e => (e.currentTarget.style.background = GOLDD)}
                onMouseLeave={e => (e.currentTarget.style.background = GOLD)}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={NAVY} strokeWidth="2.5"><path d="M22 2L11 13" /><path d="M22 2L15 22 11 13 2 9l20-7z" /></svg>
                Browse Open Requests
              </button>
              <a href="/upload-document" style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "13px 20px", background: "rgba(255,255,255,.06)", color: "rgba(245,240,232,.8)", fontSize: 12, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", border: "0.5px solid rgba(255,255,255,.12)", textDecoration: "none", fontFamily: "'Lato',sans-serif", whiteSpace: "nowrap" }}>
                📤 Upload a Document
              </a>
            </div>
          </div>
        </div>
      </div>

      {modal && <CreateModal onClose={() => setModal(false)} user={user} userProfile={userProfile} />}
    </>
  );
}