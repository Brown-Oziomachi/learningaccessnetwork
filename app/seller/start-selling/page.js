"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import {
    BadgeCheck, ShieldCheck, Upload, Wallet,
    ArrowRight, ArrowLeft, CheckCircle, ChevronDown, GraduationCap,
    Share2, Gift, MessageSquare, TrendingUp, Users, BookOpen, Smartphone,
    Laptop as LaptopIcon, Menu, X, ChevronRight,
} from "lucide-react";
import { auth } from "@/lib/firebaseConfig";

/* ─── design tokens (same as the landing page) ───────────────── */
const NAVY = "#0d2244";
const GOLD = "#b8963e";
const GOLDD = "#d4aa5a";
const CREAM = "#f5f0e8";
const BG = "#f5f1ea";
const BLUE = "#1d9bf0"; // blue check colour

/* Sellers earn 80% per sale. Note: the landing page stats strip still says 85% */
const REVENUE_SHARE = "80%";

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400;1,700&family=Lato:wght@300;400;700;900&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  .ss-page  { font-family: 'Lato', sans-serif; background: ${BG}; color: ${NAVY}; overflow-x: hidden; }
  .ss-serif { font-family: 'Playfair Display', Georgia, serif; }

  .hero-bg {
    background-color: ${NAVY};
    background-image:
      radial-gradient(rgba(184,150,62,0.07) 1px, transparent 1px),
      radial-gradient(rgba(255,255,255,0.03) 1px, transparent 1px);
    background-size: 28px 28px, 14px 14px;
    background-position: 0 0, 7px 7px;
  }
  .crest-bg {
    background-color: ${NAVY};
    background-image:
      repeating-linear-gradient(45deg,  transparent, transparent 12px, rgba(255,255,255,0.018) 12px, rgba(255,255,255,0.018) 13px),
      repeating-linear-gradient(-45deg, transparent, transparent 12px, rgba(255,255,255,0.018) 12px, rgba(255,255,255,0.018) 13px);
  }
  .cream-bg {
    background-color: ${CREAM};
    background-image: radial-gradient(rgba(13,34,68,0.05) 1px, transparent 1px);
    background-size: 22px 22px;
  }

  .ss-card {
    background: #fff; border: 0.5px solid #e5ddd0;
    transition: transform .25s cubic-bezier(.4,0,.2,1), box-shadow .25s, border-color .25s;
  }
  .ss-card:hover { transform: translateY(-5px); box-shadow: 0 16px 40px rgba(13,34,68,0.11); border-color: ${GOLD}; }

  .gold-line { display: flex; align-items: center; gap: 14px; }
  .gold-line::before, .gold-line::after { content: ""; flex: 1; height: 1px; background: rgba(184,150,62,0.3); }

  .btn-primary {
    display: inline-flex; align-items: center; justify-content: center; gap: 8px;
    padding: 14px 28px; background: ${GOLD}; color: ${NAVY};
    font-family: 'Lato', sans-serif; font-size: 13px; font-weight: 900; letter-spacing: .06em; text-transform: uppercase;
    border: none; cursor: pointer; text-decoration: none;
    transition: background .18s, transform .15s;
  }
  .btn-primary:hover { background: ${GOLDD}; transform: translateY(-1px); }

  .btn-ghost {
    display: inline-flex; align-items: center; justify-content: center; gap: 8px;
    padding: 14px 28px; background: transparent; color: #fff;
    font-family: 'Lato', sans-serif; font-size: 13px; font-weight: 700; letter-spacing: .06em; text-transform: uppercase;
    border: 0.5px solid rgba(255,255,255,0.35); cursor: pointer; text-decoration: none;
    transition: background .18s;
  }
  .btn-ghost:hover { background: rgba(255,255,255,0.08); }

  .btn-navy {
    display: inline-flex; align-items: center; justify-content: center; gap: 8px;
    padding: 14px 28px; background: ${NAVY}; color: #fff;
    font-family: 'Lato', sans-serif; font-size: 13px; font-weight: 700; letter-spacing: .06em; text-transform: uppercase;
    border: none; cursor: pointer; text-decoration: none;
    transition: background .18s, transform .15s;
  }
  .btn-navy:hover { background: #1a3560; transform: translateY(-1px); }

  .quiz-opt {
    display: block; width: 100%; text-align: left;
    padding: 16px 20px; background: ${CREAM}; border: 0.5px solid transparent;
    font-family: 'Lato', sans-serif; font-size: 14px; color: ${NAVY}; cursor: pointer;
    transition: border-color .18s, background .18s;
  }
  .quiz-opt:hover { border-color: ${GOLD}; background: #fff; }

  .faq-body { display: grid; grid-template-rows: 0fr; transition: grid-template-rows .25s ease; }
  .faq-body.open { grid-template-rows: 1fr; }
  .faq-body > div { overflow: hidden; }

  .step-link { text-decoration: none; color: inherit; display: block; }

  /* device illustrations: hover lift only when the device is a link */
  .device-link { display: block; text-decoration: none; color: inherit; transition: transform .25s cubic-bezier(.4,0,.2,1); }
  .device-link:hover { transform: translateY(-6px); }

  /* alternate image side on desktop only, so mobile always shows text first then image */
  @media (min-width: 769px) {
    .step-row.flip > .step-visual { order: -1; }
  }

  /* mobile menu toggle is hidden on desktop */
  .mnav-wrap { display: none; }
  @media (max-width: 768px) { .mnav-wrap { display: block; } }

  .ss-btn:focus-visible, .quiz-opt:focus-visible, .btn-primary:focus-visible,
  .btn-navy:focus-visible, .btn-ghost:focus-visible, .device-link:focus-visible { outline: 2px solid ${GOLD}; outline-offset: 3px; }

  @keyframes slideUp { from { opacity:0; transform:translateY(24px); } to { opacity:1; transform:translateY(0); } }
  .anim-up   { animation: slideUp .6s cubic-bezier(.4,0,.2,1) both; }
  .anim-up-2 { animation: slideUp .6s .12s cubic-bezier(.4,0,.2,1) both; }
  .anim-up-3 { animation: slideUp .6s .24s cubic-bezier(.4,0,.2,1) both; }

  @media (prefers-reduced-motion: reduce) {
    .anim-up, .anim-up-2, .anim-up-3 { animation: none; }
    .ss-card, .btn-primary, .btn-navy, .device-link { transition: none; }
  }
`;

/* ─── data ───────────────────────────────────────────────────── */
const TRUST_POINTS = [
    { title: "Buyers trust the blue check", body: "A verified badge tells students your materials come from a real person, so they are more willing to buy." },
    { title: "Stand out in search and listings", body: "Verified sellers look more credible next to unverified ones, which helps your documents get opened and bought." },
    { title: "Protect your name", body: "Verification ties your seller profile to you, so nobody else can pass off as you." },
    { title: "Build a following faster", body: "People follow sellers they trust. More followers means more people seeing every new upload." },
];

const QUIZ = [
    { q: "What do you want to sell?", options: ["Books or ebooks", "Lecture notes or study guides", "Past questions"] },
    { q: "Who are you?", options: ["Student", "Author or writer", "Lecturer or faculty"] },
    { q: "Is your account verified?", options: ["Yes, I have the blue check", "Not yet"] },
];

const TOOLS = [
    { icon: TrendingUp, title: "Seller Dashboard", body: "Track sales, views and earnings in one place.", href: "/seller/seller-dashboard" },
    { icon: Wallet, title: "Withdraw Earnings", body: "Move money from your wallet to your bank account.", href: "/seller/withdraw-earnings" },
    { icon: Users, title: "Grow Your Followers", body: "Practical ways to get more readers watching your uploads.", href: "/seller/grow-followers" },
    { icon: Gift, title: "Referral Programme", body: "Invite other sellers and students and get rewarded.", href: "/seller/referral" },
    { icon: Smartphone, title: "Recharge Services", body: "Buy airtime, data, electricity and cable from your wallet.", href: "/seller/recharge-services" },
    { icon: Share2, title: "Seller Network", body: "Meet other sellers, share strategies and ask for feedback.", href: "/seller/network" },
];

const TIPS = [
    { title: "Get verified first", body: "It is the single fastest way to look trustworthy to a new buyer." },
    { title: "Write a title students would search", body: "Use the course code, topic and level, for example the subject and the semester it belongs to." },
    { title: "Add a clear cover and description", body: "Say exactly what is inside, how many pages it has and who it is for." },
    { title: "Reply to price offers quickly", body: "Buyers who negotiate are ready to buy. A fast answer often closes the sale." },
    { title: "Upload often", body: "Each new document is another way for a student to find you and follow you." },
];

const FAQ = [
    { q: "Who can sell on LAN Library?", a: "Students, authors and verified lecturers can all upload and sell their own academic materials." },
    { q: "Why should I verify my account?", a: "Verified sellers get a blue check on their profile and documents. Buyers trust verified sellers more, which helps you earn more." },
    { q: "How do I get paid?", a: "Your earnings are added to your LAN Wallet when a buyer purchases your document. You can withdraw to your bank account whenever it suits you." },
    { q: "Can I set my own price?", a: "Yes. You choose the price, and buyers can send price offers that you can accept or decline." },
    { q: "Can I share my document for free?", a: "Yes. You decide whether a document is free or paid." },
    { q: "Where do I get help?", a: "Visit the Help Centre from the footer of the home page, or read the documentation for step-by-step guides." },
];

const NAV_GROUPS = [
    {
        heading: "Sellers",
        links: [
            { label: "Start Selling Guide", href: "/seller/start-selling" },
            { label: "Seller Network", href: "/seller/network" },
            { label: "Upload Document", href: "/seller/upload-document" },
            { label: "LAN Wallet", href: "/seller/lan-wallet" },
            { label: "Withdraw Earnings", href: "/seller/withdraw-earnings" },
            { label: "Referral Programme", href: "/seller/referral" },
            { label: "Seller Dashboard", href: "/seller/seller-dashboard" },
            { label: "Recharge Services", href: "/seller/recharge-services" },
            { label: "Growing Your Followers", href: "/seller/grow-followers" },
            { label: "Price Negotiation", href: "/students/negotiation" },
            { label: "Verification & the Blue Check", href: "/seller/verification" },
        ],
    },
    {
        heading: "Students",
        links: [
            { label: "AI Tutor", href: "/students/ai-tutor" },
            { label: "My Library", href: "/students/my-library" },
            { label: "How to Buy", href: "/students/how-to-buy" },
            { label: "Past Questions", href: "/students/past-questions" },
            { label: "Study Groups", href: "/students/study-groups" },
            { label: "Bookmark", href: "/students/wishlist" },
            { label: "Student Network", href: "/students/network" },
            { label: "Price Negotiation", href: "/students/negotiation" },
        ],
    },
    {
        heading: "Faculties",
        links: [
            { label: "Faculty Network", href: "/faculty/network" },
            { label: "Faculty Verification", href: "/faculty/verify" },
            { label: "Upload Materials", href: "/faculty/upload" },
            { label: "Faculty Dashboard", href: "/faculty/dashboard" },
            { label: "Withdraw Earnings", href: "/faculty/withdraw" },
            { label: "Recharge Services", href: "/faculty/recharge" },
            { label: "Referral Programme", href: "/faculty/referral" },
            { label: "Growing Your Followers", href: "/seller/grow-followers" },
        ],
    },
];

/* ═════════════════════════════════════════════════════════════
   DEVICE FRAMES
   Each frame draws a laptop or phone. Pass `href` to make the
   whole device a link, and `shot` (a path in /public) to show a
   real screenshot. If the screenshot is missing, the drawn
   sample screen is shown instead.
═════════════════════════════════════════════════════════════ */
function DeviceWrap({ href, hint, children }) {
    if (!href) return <div>{children}</div>;
    return (
        <Link href={href} className="device-link" aria-label={hint}>
            {children}
            <div style={{ display: "flex", justifyContent: "center", marginTop: 18 }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 700, color: GOLD }}>
                    {hint} <ArrowRight size={13} />
                </span>
            </div>
        </Link>
    );
}

function ScreenContent({ shot, children }) {
    const [bad, setBad] = useState(false);
    if (shot && !bad) {
        return <img src={shot} alt="" onError={() => setBad(true)} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />;
    }
    return children;
}

function LaptopFrame({ children, href, hint, shot }) {
    return (
        <DeviceWrap href={href} hint={hint}>
            <div style={{ width: "100%", maxWidth: 540, margin: "0 auto" }}>
                <div style={{ background: "#1a1f2b", padding: "10px 10px 0", borderRadius: "12px 12px 0 0", border: "1px solid #2b3345", borderBottom: "none", boxShadow: "0 30px 60px rgba(13,34,68,0.25)" }}>
                    <div style={{ background: "#fff", aspectRatio: "16/10", overflow: "hidden", position: "relative", fontSize: "clamp(8px,2.3vw,12px)" }}>
                        <ScreenContent shot={shot}>{children}</ScreenContent>
                    </div>
                </div>
                <div style={{ height: 14, background: "linear-gradient(#d5d9e0,#a9afba)", borderRadius: "0 0 14px 14px", width: "104%", marginLeft: "-2%" }} />
            </div>
        </DeviceWrap>
    );
}

function PhoneFrame({ children, href, hint, shot, width = 220, fontSize = 11 }) {
    return (
        <DeviceWrap href={href} hint={hint}>
            <div style={{ width, maxWidth: "100%", margin: "0 auto", background: "#10151f", borderRadius: 34, padding: 8, border: "1px solid #2b3345", boxShadow: "0 30px 60px rgba(13,34,68,0.3)" }}>
                <div style={{ background: "#fff", borderRadius: 26, overflow: "hidden", aspectRatio: "9/18", position: "relative", fontSize }}>
                    <div style={{ position: "absolute", top: 6, left: "50%", transform: "translateX(-50%)", width: "28%", height: 5, background: "#10151f", borderRadius: 4, zIndex: 3 }} />
                    <ScreenContent shot={shot}>{children}</ScreenContent>
                </div>
            </div>
        </DeviceWrap>
    );
}

/* ─── drawn sample screens (all sizes in em so they scale) ───── */
function Screen({ title, children }) {
    return (
        <div style={{ height: "100%", display: "flex", flexDirection: "column", fontFamily: "'Lato',sans-serif", color: NAVY, background: "#fff" }}>
            <div style={{ background: NAVY, color: "#fff", padding: "1.3em 1em 0.6em", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
                <span className="ss-serif" style={{ fontWeight: 900, fontSize: "1em" }}>LAN Library</span>
                <span style={{ fontSize: "0.8em", color: GOLDD, fontWeight: 700 }}>{title}</span>
            </div>
            <div style={{ flex: 1, padding: "1em", display: "flex", flexDirection: "column", gap: "0.7em", minHeight: 0 }}>{children}</div>
        </div>
    );
}

function Tick({ children }) {
    return (
        <div style={{ display: "flex", alignItems: "center", gap: "0.6em", fontSize: "0.95em", color: "#555" }}>
            <CheckCircle style={{ width: "1.2em", height: "1.2em", color: GOLD, flexShrink: 0 }} /> {children}
        </div>
    );
}

function GoldButton({ children }) {
    return (
        <div style={{ marginTop: "auto", background: GOLD, color: NAVY, textAlign: "center", padding: "0.8em", fontWeight: 900, fontSize: "0.95em" }}>{children}</div>
    );
}

function VerifyScreen() {
    return (
        <Screen title="Verification">
            <div style={{ display: "flex", alignItems: "center", gap: "0.8em" }}>
                <img src="/sirb.png" alt="" style={{ width: "3.6em", height: "3.6em", borderRadius: "50%", objectFit: "cover", border: `1px solid ${GOLD}` }} />
                <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.4em" }}>
                        <b className="ss-serif" style={{ fontSize: "1.4em" }}>Sir Brown AD </b>
                        <BadgeCheck style={{ width: "1.5em", height: "1.5em", color: BLUE }} />
                    </div>
                    <div style={{ color: BLUE, fontWeight: 700, fontSize: "0.9em" }}>Verified Seller</div>
                </div>
            </div>
            <Tick>Blue check on your profile</Tick>
            <Tick>Blue check on every document</Tick>
            <Tick>Buyers trust you faster</Tick>
            <GoldButton>Get verified</GoldButton>
        </Screen>
    );
}

function BadgeScreen() {
    return (
        <Screen title="Verified">
            <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "0.8em", textAlign: "center" }}>
                <BadgeCheck style={{ width: "7em", height: "7em", color: BLUE }} />
                <b className="ss-serif" style={{ fontSize: "1.6em" }}>Verified Seller</b>
                <span style={{ fontSize: "0.95em", color: "#777" }}>Buyers see the blue check on every document you sell</span>
            </div>
        </Screen>
    );
}

function Field({ label, value }) {
    return (
        <div>
            <div style={{ fontSize: "0.8em", color: "#888", marginBottom: "0.25em" }}>{label}</div>
            <div style={{ background: CREAM, padding: "0.6em 0.7em", fontSize: "0.95em", fontWeight: 700 }}>{value}</div>
        </div>
    );
}

function UploadScreen() {
    return (
        <Screen title="Upload document">
            <Field label="Title" value="Intro to Microeconomics" />
            <Field label="Course code" value="ECO 201" />
            <Field label="Price" value="₦1,500" />
            <div style={{ border: `1px dashed ${GOLD}`, padding: "0.9em", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5em", fontSize: "0.9em", color: GOLD, fontWeight: 700 }}>
                <Upload style={{ width: "1.2em", height: "1.2em" }} /> Choose PDF
            </div>
            <GoldButton>Publish</GoldButton>
        </Screen>
    );
}

function OfferScreen() {
    return (
        <Screen title="Price offers">
            <div style={{ background: CREAM, padding: "0.8em" }}>
                <div style={{ fontSize: "0.8em", color: "#888" }}>Your price</div>
                <div className="ss-serif" style={{ fontSize: "1.5em", fontWeight: 700 }}>₦1,500</div>
            </div>
            <div style={{ border: `1px solid ${GOLD}`, padding: "0.8em" }}>
                <div style={{ fontSize: "0.8em", color: "#888" }}>A buyer offers</div>
                <div className="ss-serif" style={{ fontSize: "1.5em", fontWeight: 700, marginBottom: "0.6em" }}>₦1,200</div>
                <div style={{ display: "flex", gap: "0.5em" }}>
                    <div style={{ flex: 1, background: "#16a34a", color: "#fff", textAlign: "center", padding: "0.6em", fontWeight: 700, fontSize: "0.9em" }}>Accept</div>
                    <div style={{ flex: 1, background: CREAM, color: NAVY, textAlign: "center", padding: "0.6em", fontWeight: 700, fontSize: "0.9em" }}>Decline</div>
                </div>
            </div>
            <div style={{ fontSize: "0.85em", color: "#888", lineHeight: 1.5 }}>You decide which offers to accept.</div>
        </Screen>
    );
}

function WalletScreen() {
    return (
        <Screen title="LAN Wallet">
            <div style={{ background: NAVY, color: "#fff", padding: "1em" }}>
                <div style={{ fontSize: "0.8em", color: GOLDD }}>Wallet balance</div>
                <div className="ss-serif" style={{ fontSize: "1.9em", fontWeight: 700 }}>₦12,500</div>
            </div>
            {[["Intro to Microeconomics", "+₦1,200"], ["Past questions pack", "+₦800"], ["Lecture notes", "+₦1,500"]].map(([n, a]) => (
                <div key={n} style={{ display: "flex", justifyContent: "space-between", fontSize: "0.9em", borderBottom: "0.5px solid #f0ebe0", paddingBottom: "0.5em" }}>
                    <span>{n}</span><b style={{ color: "#16a34a" }}>{a}</b>
                </div>
            ))}
            <GoldButton>Withdraw</GoldButton>
        </Screen>
    );
}

function DashboardScreen() {
    const bars = [35, 55, 40, 70, 60, 85, 75];
    return (
        <Screen title="Seller dashboard">
            <div style={{ display: "flex", gap: "0.6em" }}>
                {[["Sales", "24"], ["Views", "310"], ["Followers", "58"]].map(([l, v]) => (
                    <div key={l} style={{ flex: 1, background: CREAM, padding: "0.6em" }}>
                        <div style={{ fontSize: "0.75em", color: "#888" }}>{l}</div>
                        <div className="ss-serif" style={{ fontSize: "1.3em", fontWeight: 700 }}>{v}</div>
                    </div>
                ))}
            </div>
            <div style={{ flex: 1, display: "flex", alignItems: "flex-end", gap: "0.5em", borderBottom: "0.5px solid #e5ddd0", minHeight: "4em" }}>
                {bars.map((h, i) => (
                    <div key={i} style={{ flex: 1, height: `${h}%`, background: i === bars.length - 1 ? GOLD : "#e5ddd0" }} />
                ))}
            </div>
            <div style={{ fontSize: "0.8em", color: "#888" }}>Sales this week</div>
        </Screen>
    );
}

/* ─── step rows: text on one side, a device on the other ───── */
const ROWS = [
    {
        title: "Get verified first",
        body: "Verification is the first thing a new seller should do. It gives you the blue check, and buyers feel safe buying from you.",
        points: ["Blue check on your profile and documents", "Stand out from unverified sellers", "Lecturers can verify as faculty"],
        href: "/seller/verification", cta: "Get verified",
        caption: "Sample verification screen on a laptop",
        visual: (
            <LaptopFrame href="/seller/verification" hint="Click to open verification" shot="/guide/verify.png">
                <VerifyScreen />
            </LaptopFrame>
        ),
    },
    {
        title: "Upload your document",
        body: "Add your PDF, a clear title, the course or subject, and a cover. You can do it from your phone or your laptop.",
        points: ["PDF books, notes and past questions", "Clear titles help students find you", "Free or paid, you choose"],
        href: "/seller/upload-document", cta: "Upload a document",
        caption: "Sample upload form on a phone",
        visual: (
            <PhoneFrame href="/seller/upload-document" hint="Tap to open upload" shot="/guide/upload.png">
                <UploadScreen />
            </PhoneFrame>
        ),
    },
    {
        title: "Set your price",
        body: "Charge what your work is worth. Buyers can send you a price offer, and you decide whether to accept or decline.",
        points: ["You set the asking price", "Answer offers at your own pace", "Reply fast to close more sales"],
        href: "/students/negotiation", cta: "How negotiation works",
        caption: "Sample price offer on a phone (not clickable)",
        visual: (
            <PhoneFrame shot="/guide/offers.png">
                <OfferScreen />
            </PhoneFrame>
        ),
    },
    {
        title: "Get paid",
        body: "Your earnings go into your LAN Wallet after each purchase. Withdraw to your bank account whenever it suits you.",
        points: ["Paid as soon as a buyer purchases", "No hidden charges", "Withdraw any time"],
        href: "/seller/lan-wallet", cta: "See the LAN Wallet",
        caption: "Sample wallet screen on a laptop",
        visual: (
            <LaptopFrame href="/seller/lan-wallet" hint="Click to open the wallet" shot="/guide/wallet.png">
                <WalletScreen />
            </LaptopFrame>
        ),
    },
    {
        title: "Track sales and grow",
        body: "Your dashboard shows sales, views and followers. Use it to see what sells, then upload more of it.",
        points: ["Sales, views and followers in one place", "See your best days", "Grow your followers with simple habits"],
        href: "/seller/seller-dashboard", cta: "Open the dashboard",
        caption: "Sample dashboard on a laptop (not clickable)",
        visual: (
            <LaptopFrame shot="/guide/dashboard.png">
                <DashboardScreen />
            </LaptopFrame>
        ),
    },
];

/* ═════════════════════════════════════════════════════════════
   SMALL COMPONENTS
═════════════════════════════════════════════════════════════ */
const ROLES = [
    {
        key: "student", label: "Student", sub: "Buy and learn", href: "/students/network",
        image: "/stud2.png",
        fallback: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=600",
    },
    {
        key: "seller", label: "Seller", sub: "Upload and earn", href: "/seller/network",
        image: "/LAN seller.png",
        fallback: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=600",
    },
    {
        key: "faculty", label: "Faculty", sub: "Publish and verify", href: "/faculty/network",
        image: "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=600",
        fallback: "https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=600",
    },
];

/* hero background: Student | Seller | Faculty photos side by side, covering the whole hero.
   The labels at the bottom are links to each network. */
function HeroCover() {
    return (
        <>
            <div style={{ position: "absolute", inset: 0, display: "flex" }}>
                {ROLES.map((r, i) => (
                    <div key={r.key} style={{ position: "relative", flex: 1, minWidth: 0, overflow: "hidden", borderLeft: i ? "1px solid rgba(184,150,62,0.35)" : "none" }}>
                        <img
                            src={r.image}
                            alt=""
                            onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = r.fallback; }}
                            style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 2.95, display: "block" }}
                        />
                    </div>
                ))}
            </div>

            {/* navy wash so the text on the left stays readable */}
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg, rgba(13,34,68,0.9) 0%, rgba(13,34,68,0.55) 55%, rgba(13,34,68,0.3) 100%)", pointerEvents: "none" }} />

            {/* labels */}
            <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, zIndex: 2, display: "flex", background: "rgba(13,34,68,0.78)", borderTop: "1px solid rgba(184,150,62,0.3)", backdropFilter: "blur(4px)" }}>
                {ROLES.map((r, i) => (
                    <Link
                        key={r.key}
                        href={r.href}
                        aria-label={`${r.label} network`}
                        style={{ flex: 1, minWidth: 0, padding: "14px 8px", textAlign: "center", textDecoration: "none", borderLeft: i ? "1px solid rgba(184,150,62,0.3)" : "none" }}
                    >
                        <div className="ss-serif" style={{ fontSize: "clamp(15px,3.6vw,22px)", fontWeight: 700, color: "#fff", lineHeight: 1.1 }}>{r.label}</div>
                        <div style={{ fontSize: "clamp(9px,2.2vw,11px)", fontWeight: 700, color: GOLDD, marginTop: 4 }}>{r.sub}</div>
                    </Link>
                ))}
            </div>
        </>
    );
}

function SectionHead({ eyebrow, title, accent, body, align = "center" }) {
    return (
        <div style={{ textAlign: align, marginBottom: 48 }}>
            {eyebrow && (
                <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".18em", textTransform: "uppercase", color: GOLD, marginBottom: 12 }}>
                    {eyebrow}
                </p>
            )}
            <h2 className="ss-serif" style={{ fontSize: "clamp(28px,4vw,46px)", fontWeight: 700, color: NAVY, lineHeight: 1.1 }}>
                {title} {accent && <span style={{ color: GOLD, fontStyle: "italic" }}>{accent}</span>}
            </h2>
            {body && (
                <p style={{ fontSize: 15, color: "#777", maxWidth: 560, margin: align === "center" ? "16px auto 0" : "16px 0 0", lineHeight: 1.75, fontWeight: 300 }}>
                    {body}
                </p>
            )}
        </div>
    );
}

function MobileNav() {
    const [open, setOpen] = useState(false);
    const [openGroup, setOpenGroup] = useState(null);

    const close = () => { setOpen(false); setOpenGroup(null); };

    return (
        <div className="mnav-wrap">
            <button
                className="ss-btn"
                onClick={() => (open ? close() : setOpen(true))}
                aria-expanded={open}
                aria-label="Toggle menu"
                style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "10px 14px", background: "transparent", color: "#fff", border: "0.5px solid rgba(255,255,255,0.35)", cursor: "pointer", fontFamily: "'Lato',sans-serif", fontSize: 12, fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase" }}
            >
                {open ? <X size={16} /> : <Menu size={16} />}
            </button>

            {open && (
                <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: NAVY, borderTop: "0.5px solid rgba(184,150,62,0.25)", boxShadow: "0 24px 48px rgba(0,0,0,0.4)", maxHeight: "calc(100vh - 72px)", overflowY: "auto" }}>
                    {NAV_GROUPS.map(({ heading, links }) => {
                        const isOpen = openGroup === heading;
                        return (
                            <div key={heading} style={{ borderBottom: "0.5px solid rgba(184,150,62,0.15)" }}>
                                <button
                                    onClick={() => setOpenGroup(isOpen ? null : heading)}
                                    aria-expanded={isOpen}
                                    className="ss-btn"
                                    style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 24px", background: "none", border: "none", cursor: "pointer", color: isOpen ? GOLD : "#fff", fontFamily: "'Lato',sans-serif", fontSize: 15, fontWeight: 700 }}
                                >
                                    {heading}
                                    <ChevronRight size={18} style={{ color: GOLD, transform: isOpen ? "rotate(90deg)" : "none", transition: "transform .2s" }} />
                                </button>
                                <div className={`faq-body ${isOpen ? "open" : ""}`}>
                                    <div>
                                        <ul style={{ listStyle: "none", padding: "0 24px 16px", display: "flex", flexDirection: "column" }}>
                                            {links.map(({ label, href }) => (
                                                <li key={label}>
                                                    <Link href={href} onClick={close} style={{ display: "block", padding: "11px 0", fontSize: 14, color: "rgba(245,240,232,0.75)", textDecoration: "none", fontFamily: "'Lato',sans-serif" }}>
                                                        {label}
                                                    </Link>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

function StartQuiz({ onSignIn }) {
    const [step, setStep] = useState(0);
    const [answers, setAnswers] = useState([]);
    const done = step >= QUIZ.length;

    const choose = (opt) => {
        setAnswers((a) => [...a, opt]);
        setStep((s) => s + 1);
    };
    const reset = () => { setAnswers([]); setStep(0); };

    const notVerified = answers[2] === "Not yet";
    const isFaculty = answers[1] === "Lecturer or faculty";

    let result = { title: "You are ready to upload", body: "Your account is verified. Upload your first document and set your price.", href: "/seller/upload-document", cta: "Upload a document" };
    if (notVerified) {
        result = isFaculty
            ? { title: "Start with faculty verification", body: "Verified faculty materials show your institution, rank and department, which builds trust straight away.", href: "/faculty/verify", cta: "Verify as faculty" }
            : { title: "Start by getting verified", body: "A blue check makes buyers trust you. Verify first, then upload your first document.", href: "/seller/verification", cta: "Get the blue check" };
    } else if (isFaculty) {
        result = { title: "Upload your course materials", body: "Publish your notes and course packs from the faculty upload page.", href: "/faculty/upload", cta: "Upload materials" };
    }

    return (
        <div style={{ background: "#fff", border: "0.5px solid #e5ddd0", padding: "32px 28px", maxWidth: 640, margin: "0 auto" }}>
            {!done ? (
                <>
                    <p style={{ fontSize: 12, color: "#888", marginBottom: 10 }}>Question {step + 1} of {QUIZ.length}</p>
                    <div style={{ height: 6, background: CREAM, marginBottom: 28 }}>
                        <div style={{ height: "100%", width: `${((step + 1) / QUIZ.length) * 100}%`, background: GOLD, transition: "width .3s" }} />
                    </div>
                    <h3 className="ss-serif" style={{ fontSize: 22, fontWeight: 700, marginBottom: 20 }}>{QUIZ[step].q}</h3>
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                        {QUIZ[step].options.map((o) => (
                            <button key={o} className="quiz-opt" onClick={() => choose(o)}>{o}</button>
                        ))}
                    </div>
                </>
            ) : (
                <div>
                    <div style={{ display: "inline-flex", alignItems: "center", gap: 8, marginBottom: 14, color: GOLD }}>
                        <CheckCircle size={18} />
                        <span style={{ fontSize: 12, fontWeight: 700 }}>Your best next step</span>
                    </div>
                    <h3 className="ss-serif" style={{ fontSize: 26, fontWeight: 700, marginBottom: 10 }}>{result.title}</h3>
                    <p style={{ fontSize: 14, color: "#777", lineHeight: 1.75, marginBottom: 24 }}>{result.body}</p>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
                        <button className="btn-navy" onClick={() => onSignIn(result.href)}>
                            {result.cta} <ArrowRight size={14} />
                        </button>
                        <button className="btn-navy" style={{ background: "transparent", color: NAVY, border: "0.5px solid #e5ddd0" }} onClick={reset}>
                            Start over
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

function FaqItem({ q, a }) {
    const [open, setOpen] = useState(false);
    return (
        <div style={{ borderBottom: "0.5px solid #e5ddd0" }}>
            <button
                onClick={() => setOpen((o) => !o)}
                aria-expanded={open}
                className="ss-btn"
                style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, padding: "20px 4px", background: "none", border: "none", cursor: "pointer", textAlign: "left", fontFamily: "'Lato',sans-serif", fontSize: 15, fontWeight: 700, color: NAVY }}
            >
                {q}
                <ChevronDown size={18} style={{ color: GOLD, flexShrink: 0, transform: open ? "rotate(180deg)" : "none", transition: "transform .2s" }} />
            </button>
            <div className={`faq-body ${open ? "open" : ""}`}>
                <div>
                    <p style={{ fontSize: 14, color: "#777", lineHeight: 1.8, padding: "0 4px 20px", maxWidth: 640 }}>{a}</p>
                </div>
            </div>
        </div>
    );
}

/* ═════════════════════════════════════════════════════════════
   PAGE
═════════════════════════════════════════════════════════════ */
export default function StartSellingPage() {
    const router = useRouter();
    const [signedIn, setSignedIn] = useState(false);

    useEffect(() => {
        const unsub = onAuthStateChanged(auth, (user) => setSignedIn(!!user));
        return () => unsub();
    }, []);

    /* signed-in users go straight to the target page, everyone else signs in first */
    const go = (href) => router.push(signedIn ? href : "/signin");

    return (
        <>
            <style>{STYLES}</style>
            <div className="ss-page">

                {/* ══════ HEADER ══════ */}
                <header className="hero-bg" style={{ position: "sticky", top: 0, zIndex: 50, borderBottom: "0.5px solid rgba(184,150,62,0.18)" }}>
                    <div style={{ position: "relative", maxWidth: 1200, margin: "0 auto", padding: "0 24px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 72, gap: 12 }}>
                        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 12, textDecoration: "none" }}>
                            <img src="/lanlog.png" alt="LAN" style={{ width: 44, height: 44, borderRadius: "50%", objectFit: "cover", border: "1px solid rgba(184,150,62,0.3)" }} />
                            <div>
                                <div className="ss-serif" style={{ fontSize: 22, fontWeight: 900, color: "#fff", lineHeight: 1 }}>LAN Library</div>
                                <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: ".16em", textTransform: "uppercase", color: "rgba(184,150,62,0.7)" }}>Start selling</div>
                            </div>
                        </Link>
                        <MobileNav />
                    </div>
                </header>

                {/* ══════ HERO: VERIFY FIRST ══════ */}
                <section className="hero-bg" style={{ position: "relative", padding: "88px 24px 150px", overflow: "hidden" }}>
                    <HeroCover />
                    <div style={{ position: "relative", zIndex: 2, maxWidth: 1200, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))", gap: 56, alignItems: "center" }}>
                        <div>
                            <div className="anim-up" style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 14, marginBottom: 28 }}>
                                <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "rgba(245,240,232,0.6)", fontSize: 12, textDecoration: "none" }}>
                                    <ArrowLeft size={13} /> Back to home
                                </Link>
                                <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(184,150,62,0.14)", border: "1px solid rgba(184,150,62,0.3)", borderRadius: 999, padding: "7px 16px" }}>
                                    <BadgeCheck size={14} style={{ color: BLUE }} />
                                    <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".1em", color: GOLDD }}>Step one for every new seller</span>
                                </div>
                            </div>

                            <h1 className="ss-serif anim-up-2" style={{ fontSize: "clamp(38px,6.5vw,72px)", fontWeight: 900, color: "#fff", lineHeight: 1.04, letterSpacing: "-1.5px", margin: "0 0 20px" }}>
                                Verify your account.<br />
                                <span style={{ color: GOLD, fontStyle: "italic" }}>Earn trust, sell more.</span>
                            </h1>

                            <p className="anim-up-3" style={{ fontSize: 17, color: "rgba(245,240,232,0.72)", maxWidth: 540, lineHeight: 1.8, fontWeight: 300, margin: "0 0 12px" }}>
                                Students buy from sellers they trust. A verified account earns you the blue check, shows buyers who you are, and gives your documents a real edge over unverified ones.
                            </p>
                            <p className="anim-up-3" style={{ fontSize: 15, color: "rgba(245,240,232,0.55)", maxWidth: 540, lineHeight: 1.8, fontWeight: 300, margin: "0 0 36px" }}>
                                Do it once, before you upload. It applies to every document you sell afterwards.
                            </p>

                            <div className="anim-up-3" style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
                                <button className="btn-primary" onClick={() => go("/seller/verification")}>
                                    Get verified <ArrowRight size={14} />
                                </button>
                                <a href="#how-it-works" className="btn-ghost">See how selling works</a>
                            </div>
                        </div>

                        {/* laptop with a phone in front: verified seller */}
                        <div className="anim-up-3" style={{ position: "relative", paddingBottom: 30 }}>
                            <div style={{ position: "relative", maxWidth: 540, margin: "0 auto" }}>
                                <LaptopFrame>
                                    <VerifyScreen />
                                </LaptopFrame>
                                <div style={{ position: "absolute", right: -6, bottom: -34, width: "30%", minWidth: 96 }}>
                                    <PhoneFrame width="100%" fontSize="clamp(5px,1.4vw,8px)">
                                        <BadgeScreen />
                                    </PhoneFrame>
                                </div>
                            </div>
                            <p style={{ textAlign: "center", fontSize: 12, color: "rgba(245,240,232,0.5)", marginTop: 30 }}>
                                What buyers see when you are verified, on a laptop and a phone
                            </p>
                        </div>
                    </div>
                </section>

                {/* ══════ WHY VERIFY ══════ */}
                <section style={{ background: "#fff", padding: "96px 24px" }}>
                    <div style={{ maxWidth: 1100, margin: "0 auto" }}>
                        <SectionHead
                            eyebrow="Why verification matters"
                            title="A blue check turns browsers"
                            accent="into buyers."
                            body="Anyone can upload a document. Verification shows buyers that yours comes from someone real."
                        />
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(230px,1fr))", gap: 16 }}>
                            {TRUST_POINTS.map(({ title, body }) => (
                                <div key={title} className="ss-card" style={{ padding: "32px 24px" }}>
                                    <div style={{ width: 44, height: 44, border: "0.5px solid rgba(29,155,240,0.35)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 18 }}>
                                        <ShieldCheck size={20} style={{ color: BLUE }} />
                                    </div>
                                    <h3 className="ss-serif" style={{ fontSize: 18, fontWeight: 700, marginBottom: 10 }}>{title}</h3>
                                    <p style={{ fontSize: 13, color: "#888", lineHeight: 1.75 }}>{body}</p>
                                </div>
                            ))}
                        </div>
                        <div style={{ textAlign: "center", marginTop: 40 }}>
                            <Link href="/seller/verification" className="btn-navy">
                                Learn about the blue check <ArrowRight size={14} />
                            </Link>
                        </div>
                    </div>
                </section>

                {/* ══════ NOT SURE WHERE TO BEGIN ══════ */}
                <section className="cream-bg" style={{ padding: "96px 24px" }}>
                    <div style={{ maxWidth: 1100, margin: "0 auto" }}>
                        <SectionHead
                            title="Not sure where"
                            accent="to begin?"
                            body="Answer three quick questions and we will point you to the right first step."
                        />
                        <StartQuiz onSignIn={go} />
                    </div>
                </section>

                {/* ══════ HOW IT WORKS (device rows) ══════ */}
                <section id="how-it-works" style={{ background: "#fff", padding: "96px 24px", scrollMarginTop: 72 }}>
                    <div style={{ maxWidth: 1100, margin: "0 auto" }}>
                        <SectionHead
                            eyebrow="How it works"
                            title="From first upload to"
                            accent="first payout."
                            body="Five steps, shown on the screens you will use. Click or tap a screen to open that page."
                        />

                        <div style={{ display: "flex", flexDirection: "column", gap: 88 }}>
                            {ROWS.map((r, i) => (
                                <div
                                    key={r.title}
                                    className={`step-row ${i % 2 === 1 ? "flip" : ""}`}
                                    style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))", gap: 56, alignItems: "center" }}
                                >
                                    <div>
                                        <p style={{ fontSize: 12, fontWeight: 700, color: GOLD, marginBottom: 10 }}>Step {i + 1}</p>
                                        <h3 className="ss-serif" style={{ fontSize: "clamp(26px,3.5vw,38px)", fontWeight: 700, lineHeight: 1.12, marginBottom: 14 }}>{r.title}</h3>
                                        <p style={{ fontSize: 15, color: "#777", lineHeight: 1.8, fontWeight: 300, maxWidth: 460, marginBottom: 20 }}>{r.body}</p>
                                        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 28 }}>
                                            {r.points.map((p) => (
                                                <div key={p} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14, color: "#555" }}>
                                                    <CheckCircle size={16} style={{ color: GOLD, flexShrink: 0 }} /> {p}
                                                </div>
                                            ))}
                                        </div>
                                        <Link href={r.href} className="btn-navy">{r.cta} <ArrowRight size={14} /></Link>
                                    </div>

                                    <div className="step-visual">
                                        {r.visual}
                                        <p style={{ textAlign: "center", fontSize: 12, color: "#aaa", marginTop: r.visual.props.href ? 8 : 18 }}>{r.caption}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <p style={{ textAlign: "center", marginTop: 72, fontSize: 14, color: "#888" }}>
                            Want the full guide?{" "}
                            <Link href="/docs" style={{ color: GOLD, fontWeight: 700, textUnderlineOffset: 4 }}>
                                <BookOpen size={14} style={{ display: "inline", verticalAlign: "-2px", marginRight: 4 }} />Read the documentation
                            </Link>
                        </p>
                    </div>
                </section>

                {/* ══════ SELL FROM ANYWHERE: LAPTOP + PHONE ══════ */}
                <section className="cream-bg" style={{ padding: "96px 24px", overflow: "hidden" }}>
                    <div style={{ maxWidth: 1100, margin: "0 auto" }}>
                        <SectionHead
                            eyebrow="Laptop or phone"
                            title="Sell from"
                            accent="anywhere."
                            body="Upload on a laptop, check your wallet on a phone. LAN Library works the same on both."
                        />
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 48, alignItems: "center" }}>
                            <div>
                                <LaptopFrame href="/seller/seller-dashboard" hint="Click to open your dashboard" shot="/guide/dashboard.png">
                                    <DashboardScreen />
                                </LaptopFrame>
                                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 14, fontSize: 13, fontWeight: 700 }}>
                                    <LaptopIcon size={16} style={{ color: GOLD }} /> On a laptop: manage uploads and track sales
                                </div>
                            </div>
                            <div>
                                <PhoneFrame href="/seller/lan-wallet" hint="Tap to open your wallet" shot="/guide/wallet-phone.png">
                                    <WalletScreen />
                                </PhoneFrame>
                                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 14, fontSize: 13, fontWeight: 700 }}>
                                    <Smartphone size={16} style={{ color: GOLD }} /> On a phone: check earnings and withdraw
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ══════ SELLER PHOTO BANNER ══════ */}
                <section style={{ background: "#fff", padding: "72px 24px 0" }}>
                    <Link href="/seller/network" style={{ display: "block", position: "relative", maxWidth: 1100, margin: "0 auto", minHeight: 320, overflow: "hidden", border: "0.5px solid #e5ddd0", textDecoration: "none" }}>
                        <img
                            src="/LAN seller.png"
                            alt="Sellers on LAN Library"
                            onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=1200"; }}
                            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
                        />
                        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(13,34,68,0.95) 10%, rgba(13,34,68,0.55) 60%, rgba(13,34,68,0.25) 100%)" }} />
                        <div style={{ position: "relative", minHeight: 320, display: "flex", flexDirection: "column", justifyContent: "flex-end", padding: "32px 28px" }}>
                            <h3 className="ss-serif" style={{ fontSize: "clamp(24px,3.4vw,38px)", fontWeight: 700, color: "#fff", lineHeight: 1.15, marginBottom: 10, maxWidth: 560 }}>
                                Sellers across Africa earn from what they already know.
                            </h3>
                            <span style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 700, color: GOLDD }}>
                                Meet the Seller Network <ArrowRight size={14} />
                            </span>
                        </div>
                    </Link>
                </section>

                {/* ══════ EARNINGS BAND ══════ */}
                <section className="crest-bg" style={{ padding: "88px 24px", marginTop: 72 }}>
                    <div style={{ maxWidth: 1100, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 48, alignItems: "center" }}>
                        <div>
                            <h2 className="ss-serif" style={{ fontSize: "clamp(32px,5vw,56px)", fontWeight: 900, color: "#fff", lineHeight: 1.05, letterSpacing: "-1px", marginBottom: 20 }}>
                                Keep <span style={{ color: GOLD, fontStyle: "italic" }}>{REVENUE_SHARE}</span> of every sale.
                            </h2>
                            <p style={{ fontSize: 15, color: "rgba(245,240,232,0.6)", lineHeight: 1.8, maxWidth: 420, fontWeight: 300, marginBottom: 32 }}>
                                Upload once and earn each time a student buys. Your money goes into your LAN Wallet straight away, with no hidden charges.
                            </p>
                            <button className="btn-primary" onClick={() => go("/seller/upload-document")}>
                                Start selling <ArrowRight size={14} />
                            </button>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                            {[
                                { icon: Wallet, t: "Instant payout to your wallet", b: "Paid as soon as a buyer purchases your document." },
                                { icon: TrendingUp, t: "Withdraw when you want", b: "Send earnings to your bank account." },
                                { icon: MessageSquare, t: "You control the price", b: "Set your price and answer offers from buyers." },
                            ].map(({ icon: Icon, t, b }) => (
                                <div key={t} style={{ display: "flex", gap: 16, padding: "20px 22px", border: "0.5px solid rgba(184,150,62,0.25)", background: "rgba(255,255,255,0.03)" }}>
                                    <Icon size={20} style={{ color: GOLD, flexShrink: 0, marginTop: 2 }} />
                                    <div>
                                        <div style={{ fontSize: 14, fontWeight: 700, color: "#fff", marginBottom: 4 }}>{t}</div>
                                        <div style={{ fontSize: 13, color: "rgba(245,240,232,0.6)", lineHeight: 1.6 }}>{b}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ══════ TIPS ══════ */}
                <section style={{ background: "#fff", padding: "96px 24px" }}>
                    <div style={{ maxWidth: 900, margin: "0 auto" }}>
                        <SectionHead eyebrow="Sell more" title="Five habits of" accent="top sellers." />
                        <div className="ss-card" style={{ padding: 0 }}>
                            {TIPS.map(({ title, body }, i) => (
                                <div key={title} style={{ display: "flex", gap: 16, padding: "22px 26px", borderBottom: i < TIPS.length - 1 ? "0.5px solid #f0ebe0" : "none" }}>
                                    <div style={{ width: 32, height: 32, border: "0.5px solid rgba(184,150,62,0.3)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 2 }}>
                                        <CheckCircle size={15} style={{ color: GOLD }} />
                                    </div>
                                    <div>
                                        <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>{title}</div>
                                        <div style={{ fontSize: 13, color: "#888", lineHeight: 1.7 }}>{body}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ══════ TOOLS ══════ */}
                <section className="cream-bg" style={{ padding: "96px 24px" }}>
                    <div style={{ maxWidth: 1100, margin: "0 auto" }}>
                        <SectionHead
                            eyebrow="Seller tools"
                            title="Everything you need"
                            accent="in one place."
                            body="Tools and programmes that help you earn, grow and manage your sales."
                        />
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 16 }}>
                            {TOOLS.map(({ icon: Icon, title, body, href }) => (
                                <Link key={title} href={href} className="step-link">
                                    <div className="ss-card" style={{ padding: "26px 24px", height: "100%", display: "flex", gap: 16 }}>
                                        <div style={{ width: 40, height: 40, border: "0.5px solid rgba(184,150,62,0.3)", background: CREAM, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                            <Icon size={18} style={{ color: GOLD }} />
                                        </div>
                                        <div>
                                            <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>{title}</div>
                                            <div style={{ fontSize: 13, color: "#888", lineHeight: 1.65 }}>{body}</div>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ══════ FACULTY NOTE ══════ */}
                <section style={{ background: "#fff", padding: "72px 24px", borderTop: "0.5px solid #e5ddd0" }}>
                    <div style={{ maxWidth: 900, margin: "0 auto", display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 24 }}>
                        <div style={{ display: "flex", gap: 16, alignItems: "flex-start", maxWidth: 560 }}>
                            <GraduationCap size={28} style={{ color: GOLD, flexShrink: 0, marginTop: 4 }} />
                            <div>
                                <h3 className="ss-serif" style={{ fontSize: 22, fontWeight: 700, marginBottom: 6 }}>Are you a lecturer?</h3>
                                <p style={{ fontSize: 14, color: "#888", lineHeight: 1.75 }}>
                                    Faculty verification shows your institution, rank and department on every material you publish.
                                </p>
                            </div>
                        </div>
                        <Link href="/faculty/verify" className="btn-navy">Verify as faculty <ArrowRight size={14} /></Link>
                    </div>
                </section>

                {/* ══════ FAQ ══════ */}
                <section className="cream-bg" style={{ padding: "96px 24px" }}>
                    <div style={{ maxWidth: 760, margin: "0 auto" }}>
                        <SectionHead eyebrow="Questions" title="Frequently asked" accent="questions." />
                        <div style={{ background: "#fff", border: "0.5px solid #e5ddd0", padding: "4px 28px" }}>
                            {FAQ.map((f) => <FaqItem key={f.q} {...f} />)}
                        </div>
                    </div>
                </section>

                {/* ══════ FINAL CTA ══════ */}
                <section className="crest-bg" style={{ padding: "72px 24px", textAlign: "center" }}>
                    <div className="gold-line" style={{ maxWidth: 220, margin: "0 auto 28px" }}>
                        <BadgeCheck size={18} style={{ color: BLUE }} />
                    </div>
                    <h2 className="ss-serif" style={{ fontSize: "clamp(30px,5vw,56px)", fontWeight: 700, color: "#fff", lineHeight: 1.1, marginBottom: 16 }}>
                        Ready to <span style={{ color: GOLD, fontStyle: "italic" }}>start earning?</span>
                    </h2>
                    <p style={{ fontSize: 15, color: "rgba(255,255,255,0.55)", maxWidth: 480, margin: "0 auto 36px", lineHeight: 1.8, fontWeight: 300 }}>
                        Verify your account, upload your first document and let students find you.
                    </p>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 14, justifyContent: "center" }}>
                        <button className="btn-primary" onClick={() => go("/seller/verification")}>
                            Get verified <ArrowRight size={14} />
                        </button>
                        <button className="btn-ghost" onClick={() => go("/seller/upload-document")}>
                            <Upload size={14} /> Upload a document
                        </button>
                    </div>
                </section>

                {/* ══════ MINI FOOTER ══════ */}
                <footer className="hero-bg" style={{ padding: "32px 24px", borderTop: "0.5px solid rgba(184,150,62,0.15)" }}>
                    <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
                        <p style={{ fontSize: 12, color: "rgba(245,240,232,0.4)" }}>
                            © {new Date().getFullYear()} LAN Library, Learning Access Network. All rights reserved.
                        </p>
                        <div style={{ display: "flex", gap: 20 }}>
                            {[
                                { l: "Home", h: "/" },
                                { l: "Help Centre", h: "/lan/net/help-center" },
                                { l: "Terms", h: "/lan/terms-of-service" },
                                { l: "Privacy", h: "/lan/privacy-policy" },
                            ].map(({ l, h }) => (
                                <Link key={l} href={h} style={{ fontSize: 12, color: "rgba(245,240,232,0.55)", textDecoration: "none" }}>{l}</Link>
                            ))}
                        </div>
                    </div>
                </footer>
            </div>
        </>
    );
}