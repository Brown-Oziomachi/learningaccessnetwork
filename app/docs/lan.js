"use client";

import { useState, useEffect, useRef, useCallback } from "react";

// ── TOC DATA ─────────────────────────────────────────────────────────────────
const TOC = [
    { id: "overview", label: "What is LAN Library" },
    { id: "what-it-does", label: "What LAN Library Does", subs: ["Key Features"] },
    { id: "what-makes-special", label: "What Makes It Special", subs: ["Built-in Security", "Fair Pricing Model"] },
    { id: "who-benefits", label: "Who Benefits", subs: ["Students & Learners", "Educators & Researchers", "Professionals", "Authors & Creators"] },
    { id: "vision", label: "The Vision", subs: ["Democratizing Education", "Rewarding Creators", "Knowledge Economy"] },
    { id: "how-it-works", label: "How It Works", subs: ["For Buyers", "For Sellers", "Quality Control"] },
    { id: "security", label: "Security & Trust" },
    { id: "community", label: "Community & Growth" },
    { id: "future", label: "The Future" },
    { id: "about-lan", label: "The L.A.N Network", subs: ["Purpose of L.A.N", "Core Values", "Key Features", "Benefits of Joining"] },
];

// ── SEARCH INDEX ──────────────────────────────────────────────────────────────
const SEARCH_INDEX = [
    { title: "What is LAN Library?", section: "Getting Started", path: "Getting Started › Overview", id: "overview", desc: "LAN Library is a digital knowledge marketplace and access platform designed to make learning easy and rewarding." },
    { title: "The L.A.N Network", section: "Getting Started", path: "Getting Started › L.A.N Network", id: "about-lan", desc: "The Learning Access Network — a transformative platform for leadership development and personal growth." },
    { title: "Quick Start Guide", section: "Getting Started", path: "Getting Started › Quick Start", id: "how-it-works", desc: "Get up and running with LAN Library quickly. Create your account and start browsing." },
    { title: "Creating Your Account", section: "Getting Started", path: "Getting Started › Account", id: "how-it-works", desc: "Sign up in minutes with your email. No subscription required to browse the catalog." },
    { title: "Platform Overview", section: "Getting Started", path: "Getting Started › Platform", id: "overview", desc: "An overview of all platform features, marketplace functions, and user experience." },
    { title: "Browsing the Catalog", section: "For Buyers", path: "For Buyers › Catalog", id: "how-it-works", desc: "Browse by subject, author, document type, or popularity with advanced filters." },
    { title: "Purchasing Documents", section: "For Buyers", path: "For Buyers › Purchasing", id: "how-it-works", desc: "Pay through our secure payment system. Your document is instantly added to your personal library." },
    { title: "Your Personal Library", section: "For Buyers", path: "For Buyers › Library", id: "how-it-works", desc: "Your purchases are permanent. Organize with custom folders and access from any device, any time." },
    { title: "Payment Methods", section: "For Buyers", path: "For Buyers › Payments", id: "security", desc: "Secure payment processing protected by international security standards and trusted providers." },
    { title: "Reviews & Ratings", section: "For Buyers", path: "For Buyers › Reviews", id: "community", desc: "Leave reviews and ratings on documents you purchase, helping others make informed decisions." },
    { title: "Becoming a Seller", section: "For Sellers", path: "For Sellers › Getting Started", id: "how-it-works", desc: "Complete your seller profile and pass our quick verification process to start selling." },
    { title: "Uploading Documents", section: "For Sellers", path: "For Sellers › Uploads", id: "how-it-works", desc: "Add detailed descriptions, set your price, and submit for quality review." },
    { title: "Pricing Your Content", section: "For Sellers", path: "For Sellers › Pricing", id: "what-makes-special", desc: "Creators set their own prices, giving them full control over the value of their work." },
    { title: "Earnings & Withdrawals", section: "For Sellers", path: "For Sellers › Earnings", id: "what-makes-special", desc: "Earnings accumulate in your secure wallet. Request withdrawals at any time." },
    { title: "Analytics Dashboard", section: "For Sellers", path: "For Sellers › Analytics", id: "how-it-works", desc: "Track your sales, monitor performance, and view detailed analytics for your content." },
    { title: "Quality Standards", section: "For Sellers", path: "For Sellers › Quality", id: "how-it-works", desc: "Every document goes through verification to ensure originality, relevance, and appropriateness." },
    { title: "Security & Trust", section: "Platform", path: "Platform › Security", id: "security", desc: "Every transaction is encrypted and protected using industry-standard security protocols." },
    { title: "Wallet System", section: "Platform", path: "Platform › Wallet", id: "what-makes-special", desc: "Managed wallet system where every transaction is tracked, verified, and protected." },
    { title: "Content Protection", section: "Platform", path: "Platform › Protection", id: "security", desc: "Digital watermarking and tracking systems prevent unauthorized sharing and copyright violations." },
    { title: "Seller Verification", section: "Platform", path: "Platform › Verification", id: "security", desc: "Every seller goes through a verification process ensuring only genuine content reaches the marketplace." },
    { title: "Terms of Service", section: "Reference", path: "Reference › Legal", id: "security", desc: "Transparent terms so everyone knows how the system works and their rights." },
    { title: "Refund Policy", section: "Reference", path: "Reference › Refunds", id: "security", desc: "Our refund policy protects buyers while maintaining fairness for content creators." },
    { title: "Commission Structure", section: "Reference", path: "Reference › Commission", id: "what-makes-special", desc: "The platform takes a small commission to maintain operations — more money goes to creators." },
    { title: "Contact Support", section: "Reference", path: "Reference › Support", id: "community", desc: "Get help from our support team. We are here to assist buyers and sellers." },
    { title: "Creating Your Account", section: "Help Center", path: "Help Center › Getting Started", id: "overview", desc: "Create your LAN Library account using Google Sign In or email and password.", href: "/lan/net/help-center/article/creating-your-account" },
    { title: "How to Purchase a Book", section: "Help Center", path: "Help Center › Payments", id: "how-it-works", desc: "Step-by-step guide to purchasing books securely on LAN Library.", href: "/lan/net/help-center/article/how-to-purchase-book" },
    { title: "Downloading Your PDFs", section: "Help Center", path: "Help Center › Downloads", id: "how-it-works", desc: "Access and download your purchased books from any device anytime.", href: "/lan/net/help-center/article/downloading-pdfs" },
    { title: "Refund Policy", section: "Help Center", path: "Help Center › Payments", id: "security", desc: "Understand our refund policy and when exceptions are made.", href: "/lan/net/help-center/article/refund-policy" },
    { title: "Payment Failed", section: "Help Center", path: "Help Center › Support", id: "security", desc: "Fix failed payments — common causes and step-by-step solutions.", href: "/lan/net/help-center/article/payment-failed" },
    { title: "Data Protection", section: "Help Center", path: "Help Center › Privacy", id: "security", desc: "How we protect your personal data and what rights you have.", href: "/lan/net/help-center/article/data-protection" },
];

// ── SIDEBAR DATA ──────────────────────────────────────────────────────────────
const SIDEBAR = [
    {
        label: "Getting Started",
        items: [
            { label: "What is LAN Library?", href: "#overview", active: true },
            { label: "The L.A.N Network", href: "#about-lan" },
            { label: "Quick Start Guide", href: "#how-it-works" },
            { label: "Creating Your Account", href: "#how-it-works" },
            { label: "Platform Overview", href: "#overview" },
        ],
    },
    {
        label: "For Buyers",
        items: [
            { label: "Browsing the Catalog", href: "#how-it-works" },
            { label: "Purchasing Documents", href: "#how-it-works" },
            { label: "Your Personal Library", href: "#how-it-works" },
            { label: "Payment Methods", href: "#security" },
            { label: "Reviews & Ratings", href: "#community" },
        ],
    },
    {
        label: "For Sellers",
        items: [
            { label: "Becoming a Seller", href: "#how-it-works", hasArrow: true },
            { label: "Uploading Documents", href: "#how-it-works" },
            { label: "Pricing Your Content", href: "#what-makes-special" },
            { label: "Earnings & Withdrawals", href: "#what-makes-special" },
            { label: "Analytics Dashboard", href: "#how-it-works" },
            { label: "Quality Standards", href: "#how-it-works" },
        ],
    },
    {
        label: "Platform",
        items: [
            { label: "Security & Trust", href: "#security", hasArrow: true },
            { label: "Wallet System", href: "#what-makes-special" },
            { label: "Content Protection", href: "#security" },
            { label: "Seller Verification", href: "#security" },
        ],
    },
    {
        label: "Reference",
        items: [
            { label: "Terms of Service", href: "#security" },
            { label: "Commission Structure", href: "#what-makes-special" },
            { label: "Contact Support", href: "#community" },
        ],
    },
    {
        label: "Help Center",
        items: [
            { label: "Creating Your Account", href: "/lan/net/help-center/article/creating-your-account" },
            { label: "How to Purchase a Book", href: "/lan/net/help-center/article/how-to-purchase-book" },
            { label: "Downloading Your PDFs", href: "/lan/net/help-center/article/downloading-pdfs" },
            { label: "Payment Methods", href: "/lan/net/help-center/article/payment-methods" },
            { label: "Refund Policy", href: "/lan/net/help-center/article/refund-policy" },
            { label: "Data Protection", href: "/lan/net/help-center/article/data-protection" },
            { label: "Payment Failed", href: "/lan/net/help-center/article/payment-failed" },
            { label: "Can't Access My Books", href: "/lan/net/help-center/article/cant-access-books" },
        ],
    },
];

// ── REUSABLE COMPONENTS ───────────────────────────────────────────────────────
function ImgPlaceholder({ label }) {
    return (
        <div className="w-full rounded-xl border border-white/[0.08] bg-[#1c1c30] my-5 flex items-center justify-center h-40 flex-col gap-2">
            <svg className="opacity-25" width="44" height="44" fill="none" stroke="currentColor" strokeWidth="1.2" viewBox="0 0 24 24">
                <path d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 18h16.5M3.75 6.75h16.5" />
            </svg>
            <p className="text-xs text-[#606080]">{label}</p>
        </div>
    );
}

function SectionTitle({ id, children }) {
    return <h2 id={id} className="text-[28px] font-bold text-[#e8e8f0] mb-4 tracking-tight scroll-mt-20">{children}</h2>;
}

function SubTitle({ children }) {
    return <h3 className="text-[17px] font-semibold text-[#e8e8f0] mt-7 mb-2.5 scroll-mt-20">{children}</h3>;
}

function Para({ children, className = "" }) {
    return <p className={`text-[15px] text-[#9090b0] leading-[1.78] mb-3.5 ${className}`}>{children}</p>;
}

function Callout({ label, children }) {
    return (
        <div className="bg-[#1a2540] border-l-[3px] border-[#4a9eff] rounded-r-xl px-5 py-4 my-6">
            <div className="text-[11px] font-bold text-[#4a9eff] uppercase tracking-wider mb-2">{label}</div>
            <p className="text-[14px] text-[#8ab4e8] leading-[1.68]">{children}</p>
        </div>
    );
}

function Cards({ items }) {
    return (
        <div className="grid grid-cols-2 gap-3 my-5">
            {items.map((c, i) => (
                <div key={i} className="bg-[#1c1c30] border border-white/[0.08] rounded-xl p-5 hover:border-white/[0.18] hover:bg-[#222238] transition-all">
                    <div className="text-xl mb-2.5">{c.icon}</div>
                    <div className="text-[13.5px] font-semibold text-[#e8e8f0] mb-1.5">{c.title}</div>
                    <div className="text-[13px] text-[#9090b0] leading-[1.62]">{c.body}</div>
                </div>
            ))}
        </div>
    );
}

function AudienceGrid({ items }) {
    return (
        <div className="grid grid-cols-2 gap-3 my-5">
            {items.map((a, i) => (
                <div key={i} className="bg-[#1c1c30] border border-white/[0.08] rounded-xl p-5 hover:border-white/[0.18] transition-all">
                    <div className="flex items-center gap-2.5 mb-2.5">
                        <div className="w-8 h-8 rounded-lg bg-white/[0.07] flex items-center justify-center text-sm flex-shrink-0">{a.icon}</div>
                        <div className="text-[13.5px] font-semibold text-[#e8e8f0]">{a.name}</div>
                    </div>
                    <div className="text-[13px] text-[#9090b0] leading-[1.64]">{a.body}</div>
                </div>
            ))}
        </div>
    );
}

function Steps({ items }) {
    return (
        <div className="my-4 divide-y divide-white/[0.06]">
            {items.map((s, i) => (
                <div key={i} className="flex gap-3.5 py-3.5">
                    <div className="w-[26px] h-[26px] rounded-full bg-white/[0.07] border border-white/[0.12] text-[12px] font-bold text-[#e8e8f0] flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</div>
                    <div>
                        <div className="text-[13.5px] font-semibold text-[#e8e8f0] mb-1">{s.title}</div>
                        <div className="text-[13px] text-[#9090b0] leading-[1.62]">{s.body}</div>
                    </div>
                </div>
            ))}
        </div>
    );
}

function Badges({ items }) {
    return (
        <div className="flex flex-wrap gap-2 my-4">
            {items.map((b, i) => (
                <span key={i} className="text-[12px] font-medium bg-white/[0.05] border border-white/[0.12] rounded-full px-3 py-1 text-[#9090b0]">{b}</span>
            ))}
        </div>
    );
}

// ── SEARCH MODAL ──────────────────────────────────────────────────────────────
function SearchModal({ open, onClose, onNavigate }) {
    const [query, setQuery] = useState("");
    const inputRef = useRef(null);

    useEffect(() => {
        if (open) {
            setQuery("");
            setTimeout(() => inputRef.current?.focus(), 50);
        }
    }, [open]);

    useEffect(() => {
        const handler = (e) => {
            if (e.key === "Escape") onClose();
        };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [onClose]);

    const results = query.trim().length > 0
        ? SEARCH_INDEX.filter(item =>
            item.title.toLowerCase().includes(query.toLowerCase()) ||
            item.section.toLowerCase().includes(query.toLowerCase()) ||
            item.desc.toLowerCase().includes(query.toLowerCase())
        ).slice(0, 7)
        : [];

    const highlightMatch = (text, q) => {
        if (!q) return text;
        const idx = text.toLowerCase().indexOf(q.toLowerCase());
        if (idx === -1) return text;
        return (
            <>
                {text.slice(0, idx)}
                <mark className="bg-transparent text-[#4a9eff] font-semibold">{text.slice(idx, idx + q.length)}</mark>
                {text.slice(idx + q.length)}
            </>
        );
    };

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[80px] px-4">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

            {/* Modal */}
            <div className="relative w-full max-w-[640px] bg-[#1a1a2e] border border-white/[0.15] rounded-2xl shadow-2xl overflow-hidden animate-fadeIn">
                {/* Search Input */}
                <div className="flex items-center gap-3 px-4 py-3.5 border-b border-white/[0.08]">
                    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="text-[#9090b0] flex-shrink-0">
                        <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
                    </svg>
                    <input
                        ref={inputRef}
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search..."
                        className="flex-1 bg-transparent text-[15px] text-[#e8e8f0] placeholder-[#606080] outline-none"
                    />
                    <button onClick={onClose} className="text-[11px] text-[#606080] bg-white/[0.07] border border-white/[0.12] rounded px-1.5 py-0.5 font-mono hover:bg-white/[0.12] transition-colors">
                        ESC
                    </button>
                </div>

                {/* Results */}
                {query.trim().length > 0 && (
                    <div className="max-h-[420px] overflow-y-auto">
                        {results.length > 0 ? (
                            <>
                                {results.map((item, i) => (
                                    <button
                                        key={i}
                                        onClick={() => {
                                            if (item.href) {
                                                window.location.href = item.href;
                                            } else {
                                                onNavigate(item.id);
                                            }
                                            onClose();
                                        }}
                                        className="w-full flex items-start gap-3 px-4 py-3.5 hover:bg-white/[0.05] transition-colors border-b border-white/[0.04] last:border-0 text-left"
                                    >
                                        <div className="w-7 h-7 rounded-md bg-white/[0.07] border border-white/[0.1] flex items-center justify-center flex-shrink-0 mt-0.5">
                                            <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="text-[#9090b0]">
                                                <path d="M7 20h10M7 4h10M5 12h14" />
                                            </svg>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="text-[11px] text-[#606080] mb-0.5">{item.path}</div>
                                            <div className="text-[14px] font-semibold text-[#e8e8f0] mb-0.5">{highlightMatch(item.title, query)}</div>
                                            <div className="text-[12.5px] text-[#9090b0] truncate">{item.desc}</div>
                                        </div>
                                    </button>
                                ))}
                                {/* Ask AI row */}
                                <div className="px-4 py-3 border-t border-white/[0.08] flex items-center gap-2.5 text-[13px] text-[#9090b0] hover:bg-white/[0.04] cursor-pointer transition-colors">
                                    <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="text-[#4a9eff] flex-shrink-0">
                                        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                                    </svg>
                                    <span>Can you tell me about <strong className="text-[#e8e8f0]">{query}</strong>?</span>
                                </div>
                            </>
                        ) : (
                            <div className="px-4 py-8 text-center text-[#606080] text-[14px]">
                                No results for "<span className="text-[#9090b0]">{query}</span>"
                            </div>
                        )}
                    </div>
                )}

                {/* Empty state hint */}
                {query.trim().length === 0 && (
                    <div className="px-4 py-4">
                        <div className="text-[11px] font-semibold text-[#606080] uppercase tracking-wider mb-2.5">Quick Links</div>
                        {["What is LAN Library?", "Security & Trust", "Becoming a Seller", "Contact Support"].map((label, i) => (
                            <button key={i} onClick={() => { const item = SEARCH_INDEX.find(s => s.title === label); if (item) { onNavigate(item.id); onClose(); } }} className="flex items-center gap-2.5 w-full px-2 py-2 rounded-lg hover:bg-white/[0.05] transition-colors text-left">
                                <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="text-[#606080]">
                                    <path d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                                </svg>
                                <span className="text-[13.5px] text-[#9090b0]">{label}</span>
                            </button>
                        ))}
                    </div>
                )}
            </div>

            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(-12px) scale(0.98); }
                    to { opacity: 1; transform: translateY(0) scale(1); }
                }
                .animate-fadeIn { animation: fadeIn 0.15s ease-out; }
            `}</style>
        </div>
    );
}

// ── MAIN PAGE ─────────────────────────────────────────────────────────────────
export default function LANDocsClient() {
    const [activeId, setActiveId] = useState("overview");
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [searchOpen, setSearchOpen] = useState(false);

    // Keyboard shortcut Ctrl+K / Cmd+K
    useEffect(() => {
        const handler = (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === "k") {
                e.preventDefault();
                setSearchOpen(true);
            }
        };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, []);

    // Scroll spy
    useEffect(() => {
        const ids = TOC.map((t) => t.id);
        const observer = new IntersectionObserver(
            (entries) => { entries.forEach((e) => { if (e.isIntersecting) setActiveId(e.target.id); }); },
            { rootMargin: "-15% 0px -75% 0px" }
        );
        ids.forEach((id) => { const el = document.getElementById(id); if (el) observer.observe(el); });
        return () => observer.disconnect();
    }, []);

    const scrollTo = useCallback((id) => {
        const el = document.getElementById(id);
        if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
        setSidebarOpen(false);
    }, []);

    return (
        <div className="bg-[#0f0f1a] min-h-screen font-sans text-[#e8e8f0]">
            {/* Search Modal */}
            <SearchModal
                open={searchOpen}
                onClose={() => setSearchOpen(false)}
                onNavigate={scrollTo}
            />

            {/* ══════ TOP NAV ══════ */}
            <nav className="fixed top-0 left-0 right-0 z-50 h-[52px] bg-[#1a1a2e] border-b border-white/[0.08] flex items-center px-4 gap-0">
                {/* Logo */}
                <a href="#" className="flex items-center gap-2.5 pr-6 border-r border-white/[0.12] mr-4 flex-shrink-0 no-underline">
                    <div className="rounded-full">
                        <img src="/lanlog.png" alt="LAN Logo" className="w-10 h-10 rounded-full" />
                    </div>
                    <span className="text-[14.5px] font-semibold text-[#e8e8f0] whitespace-nowrap">LAN Library Docs</span>
                </a>
                {/* Nav links */}
                <div className="hidden md:flex items-center gap-0 flex-1">
                    {["Getting Started", "For Buyers", "For Sellers", "Security", "Platform", "Resources"].map((l, i) => (
                        <a key={l} href="#" onClick={(e) => { e.preventDefault(); const map = { "Getting Started": "overview", "For Buyers": "how-it-works", "For Sellers": "how-it-works", "Security": "security", "Platform": "what-makes-special", "Resources": "about-lan" }; scrollTo(map[l]); }}
                            className={`text-[13px] px-3 py-1.5 rounded-md transition-colors no-underline ${i === 0 ? "text-[#e8e8f0] font-medium" : "text-[#9090b0] hover:text-[#e8e8f0] hover:bg-white/[0.05]"}`}>
                            {l}
                        </a>
                    ))}
                </div>
                {/* Right */}
                <div className="flex items-center gap-2 ml-auto flex-shrink-0">
                    {/* Search bar — clickable */}
                    <button
                        onClick={() => setSearchOpen(true)}
                        className="hidden sm:flex items-center gap-2 bg-white/[0.05] border border-white/[0.12] rounded-lg px-3 py-1.5 text-[13px] text-[#606080] min-w-[200px] hover:bg-white/[0.09] hover:border-white/[0.2] transition-all cursor-text"
                    >
                        <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
                        </svg>
                        <span>Search...</span>
                        <span className="ml-auto text-[10px] bg-white/[0.07] rounded px-1.5 py-0.5 font-mono">Ctrl K</span>
                    </button>
                    <a href="#" className="text-[13px] font-medium text-white bg-white/[0.08] border border-white/[0.12] rounded-lg px-3 py-1.5 whitespace-nowrap hover:bg-white/[0.13] transition-colors no-underline">
                        LAN Platform <span className="text-[#606080]">›</span>
                    </a>
                    {/* Mobile search icon */}
                    <button onClick={() => setSearchOpen(true)} className="sm:hidden p-1.5 rounded-md hover:bg-white/[0.07] transition-colors text-[#9090b0]">
                        <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
                        </svg>
                    </button>
                    {/* Mobile menu toggle */}
                    <button onClick={() => setSidebarOpen((o) => !o)} className="md:hidden p-1.5 rounded-md hover:bg-white/[0.07] transition-colors text-[#9090b0]">
                        <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                        </svg>
                    </button>
                </div>
            </nav>

            <div className="flex pt-[52px]">
                {/* Mobile overlay */}
                {sidebarOpen && <div className="fixed inset-0 z-40 bg-black/60 md:hidden" onClick={() => setSidebarOpen(false)} />}

                {/* ══════ LEFT SIDEBAR ══════ */}
                <aside className={`fixed top-[52px] left-0 bottom-0 z-40 w-[260px] overflow-y-auto bg-[#141420] border-r border-white/[0.08] transition-transform duration-200 ${sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}>
                    <div className="py-3 pb-10">
                        {SIDEBAR.map((group, gi) => (
                            <div key={gi}>
                                {gi > 0 && <div className="h-px bg-white/[0.06] mx-2.5 my-1.5" />}
                                <div className="px-2">
                                    <div className="text-[11px] font-semibold text-[#606080] uppercase tracking-[0.08em] px-2.5 pt-3.5 pb-1.5">{group.label}</div>
                                    {group.items.map((item, ii) => (
                                        <a
                                            key={ii}
                                            href={item.href}
                                            onClick={(e) => {
                                                // ✅ Only prevent default for hash links (scroll behavior)
                                                // External paths like /lan/net/help-center/... navigate normally
                                                if (item.href.startsWith("#") && item.href.length > 1) {
                                                    e.preventDefault();
                                                    scrollTo(item.href.slice(1));
                                                }
                                                setSidebarOpen(false);
                                            }}
                                            className={`flex items-center justify-between text-[13.5px] px-2.5 py-1.5 rounded-md transition-all no-underline ${item.active ? "text-[#e8e8f0] bg-white/[0.07] font-medium" : "text-[#9090b0] hover:text-[#e8e8f0] hover:bg-white/[0.05]"}`}
                                        >
                                            {item.label}
                                            {item.hasArrow && <span className="text-[11px] text-[#606080]">›</span>}
                                        </a>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </aside>

                {/* ══════ MAIN CONTENT ══════ */}
                <main className="md:ml-[260px] xl:mr-[240px] flex-1 min-w-0 px-6 md:px-14 lg:px-16 py-11 pb-24">
                    <div className="text-[11.5px] font-semibold text-orange-500 uppercase tracking-[0.08em] mb-3.5">GETTING STARTED</div>
                    <div className="flex items-start justify-between gap-4 mb-4">
                        <h1 className="text-[38px] md:text-[42px] font-bold text-[#e8e8f0] leading-[1.12] tracking-tight">What is LAN Library?</h1>
                        <button className="flex items-center gap-1.5 text-[12.5px] text-[#9090b0] bg-white/[0.05] border border-white/[0.12] rounded-lg px-3 py-1.5 flex-shrink-0 hover:bg-white/[0.09] transition-colors mt-1.5">
                            <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" /></svg>
                            Copy page
                        </button>
                    </div>
                    <p className="text-[15.5px] text-[#9090b0] leading-[1.72] mb-11 pb-9 border-b border-white/[0.08]">
                        Read about LAN Library, its purpose, features, and how it benefits both learners, publishers, and universities. Welcome to the knowledge economy — where education is accessible, creators are rewarded, and every document has real value.
                    </p>

                    {/* ── 1. Overview ── */}
                    <section id="overview" className="py-11 border-b border-white/[0.08]">
                        <SectionTitle id="overview">What is LAN Library</SectionTitle>
                        <ImgPlaceholder label="LAN Library — Digital Knowledge Platform" />
                        <Para>LAN Library is a <strong className="text-[#e8e8f0] font-semibold">digital knowledge marketplace and access platform</strong> designed to make learning, reading, and sharing documents easy, secure, and rewarding. It is a place where knowledge meets opportunity, and where both writers, students, and learners benefit from the power of shared information.</Para>
                        <Para>Think of it as a digital library combined with a marketplace. Instead of physical shelves, we have digital collections. Instead of library cards, we have secure user accounts. And instead of borrowing, users <strong className="text-[#e8e8f0] font-semibold">purchase permanent access</strong> to the knowledge they need.</Para>
                        <Badges items={["📚 Books & Textbooks", "📝 Academic Notes", "🔬 Research Papers", "📋 Study Guides", "📖 Manuals", "🎓 Course Materials", "📄 E-Books"]} />
                    </section>

                    {/* ── 2. What It Does ── */}
                    <section id="what-it-does" className="py-11 border-b border-white/[0.08]">
                        <SectionTitle id="what-it-does">What LAN Library Does</SectionTitle>
                        <ImgPlaceholder label="Document Marketplace" />
                        <Para>At its core, LAN Library allows <strong className="text-[#e8e8f0] font-semibold">creators, authors, researchers, educators, and universities</strong> to upload valuable documents such as books, academic notes, research papers, manuals, study guides, and educational materials.</Para>
                        <Para>Think of it as a digital library combined with a marketplace — instead of physical shelves, we have digital collections, and instead of borrowing, users purchase permanent access to the knowledge they need.</Para>
                        <SubTitle>Key Features</SubTitle>
                        <Cards items={[
                            { icon: "🔍", title: "Advanced Search & Discovery", body: "Browse by subject, author, document type, or popularity. Advanced filters help learners find exactly what they need in seconds." },
                            { icon: "📦", title: "Permanent Access", body: "Once purchased, documents are stored in your personal library for unlimited access anytime, anywhere, from any device." },
                            { icon: "⭐", title: "Previews & Reviews", body: "Each document comes with a detailed preview, description, and user reviews to help buyers make informed decisions." },
                            { icon: "💰", title: "Seller Earnings", body: "Creators earn real money from their content. Earnings accumulate in a secure wallet with flexible withdrawal options." },
                        ]} />
                    </section>

                    {/* ── 3. Special ── */}
                    <section id="what-makes-special" className="py-11 border-b border-white/[0.08]">
                        <SectionTitle id="what-makes-special">What Makes LAN Library Special</SectionTitle>
                        <ImgPlaceholder label="Secure & Trusted Marketplace" />
                        <Para>What makes LAN Library special is its <strong className="text-[#e8e8f0] font-semibold">controlled and secure marketplace system</strong>. When a buyer purchases a document, they pay through a secure payment system. The money goes into a managed wallet system where every transaction is tracked, verified, and protected.</Para>
                        <Para>Sellers and creators earn real money from their content. Their earnings are safely stored in their wallet, and they can withdraw their funds when they choose to. This creates a fair economic model where <strong className="text-[#e8e8f0] font-semibold">knowledge has real value</strong>.</Para>
                        <SubTitle>Built-in Security</SubTitle>
                        <Para>The platform ensures fairness and trust. Buyers are protected from fraud through secure payment processing and verified seller accounts. Sellers are protected from unauthorized distribution through <strong className="text-[#e8e8f0] font-semibold">digital rights management and watermarking technology</strong>.</Para>
                        <SubTitle>Fair Pricing Model</SubTitle>
                        <Para>Creators set their own prices, giving them full control over the value of their work. The platform takes a small commission to maintain operations — more money goes directly to the people who create the content.</Para>
                        <Callout label="💡 How the wallet works">
                            When a buyer purchases a document, payment is processed securely and credited instantly to the seller's LAN wallet. Sellers can request withdrawals at any time. Every transaction is logged, auditable, and protected under our security protocols.
                        </Callout>
                    </section>

                    {/* ── 4. Who Benefits ── */}
                    <section id="who-benefits" className="py-11 border-b border-white/[0.08]">
                        <SectionTitle id="who-benefits">Who Benefits from LAN Library</SectionTitle>
                        <ImgPlaceholder label="Our Community" />
                        <AudienceGrid items={[
                            { icon: "🎓", name: "Students & Learners", body: "Find study materials, textbooks, and past exam questions — all in one trusted location. Affordable pricing means every student can access what they need." },
                            { icon: "🏫", name: "Educators & Researchers", body: "Share lesson plans, research findings, and course materials. Publish your work and earn income while reaching people who truly need it." },
                            { icon: "💼", name: "Professionals", body: "Access specialized manuals, industry guides, and certification study resources in technology, healthcare, finance, engineering, and law." },
                            { icon: "✍️", name: "Authors & Creators", body: "Publish and sell your work directly to readers. LAN Library handles payment, delivery, and support — you focus on creating." },
                        ]} />
                        <SubTitle>Students and Learners</SubTitle>
                        <Para>Students can find study materials, textbooks, lecture notes, and past examination questions to help them succeed. Everything they need is organized in one trusted location.</Para>
                        <Para>The affordable pricing model means that even students on tight budgets can access the materials they need to excel — whether preparing for exams, writing research papers, or learning new subjects.</Para>
                        <SubTitle>Educators and Researchers</SubTitle>
                        <Para>Educators and researchers can share their knowledge, publish their work, and earn income from their expertise. Teachers can upload lesson plans, researchers can publish findings, and graduate students can share their thesis work.</Para>
                        <SubTitle>Professionals and Career Builders</SubTitle>
                        <Para>Professionals can access specialized manuals, industry guides, training materials, and certification study resources. The platform is especially valuable in fields like technology, healthcare, finance, engineering, and law.</Para>
                        <SubTitle>Authors and Content Creators</SubTitle>
                        <Para>Authors and writers have a platform to publish and sell their work directly to readers without complicated publishing processes or middlemen taking large percentages. LAN Library handles payment processing, content delivery, and customer support.</Para>
                    </section>

                    {/* ── 5. Vision ── */}
                    <section id="vision" className="py-11 border-b border-white/[0.08]">
                        <SectionTitle id="vision">The Vision Behind LAN Library</SectionTitle>
                        <ImgPlaceholder label="Our Vision" />
                        <Para>LAN Library is not just about selling documents. It is about building a <strong className="text-[#e8e8f0] font-semibold">trusted digital library</strong> where knowledge is preserved, organized, and made accessible — encouraging knowledge sharing in a world where information should flow freely but also be valued properly.</Para>
                        <SubTitle>Democratizing Education</SubTitle>
                        <Para>We believe education should be accessible to everyone, regardless of location or economic status. Students in remote areas can access the same high-quality materials as those in major cities. Self-learners can find resources previously only available in expensive institutions.</Para>
                        <SubTitle>Rewarding Knowledge Creators</SubTitle>
                        <Para>Too often, teachers, researchers, and authors put countless hours into creating valuable content only to see it shared freely without recognition or compensation. LAN Library bridges that gap — learners get affordable access, and creators earn fair compensation.</Para>
                        <SubTitle>Building a Knowledge Economy</SubTitle>
                        <Para>This platform creates economic opportunities through education. It turns knowledge into value. Whether you are a student, a teacher, or an author — LAN Library is built for you. By creating a marketplace where knowledge has real economic value, we encourage more people to share what they know.</Para>
                    </section>

                    {/* ── 6. How It Works ── */}
                    <section id="how-it-works" className="py-11 border-b border-white/[0.08]">
                        <SectionTitle id="how-it-works">How LAN Library Works</SectionTitle>
                        <ImgPlaceholder label="Platform Workflow" />
                        <SubTitle>For Buyers</SubTitle>
                        <Steps items={[
                            { title: "Create a free account", body: "Sign up in minutes with your email. No subscription required to browse the catalog." },
                            { title: "Browse and discover", body: "Search by subject, author, or document type. Read descriptions, previews, and user reviews." },
                            { title: "Purchase securely", body: "Pay through our secure payment system. Your document is instantly added to your personal library." },
                            { title: "Access forever", body: "Your purchases are permanent. Organize with custom folders and access from any device, any time." },
                        ]} />
                        <SubTitle>For Sellers</SubTitle>
                        <Steps items={[
                            { title: "Register as a content creator", body: "Complete your seller profile and pass our quick verification process." },
                            { title: "Upload your documents", body: "Add detailed descriptions, set your price, and submit for quality review." },
                            { title: "Start earning", body: "When users purchase your content, earnings accumulate in your secure wallet instantly." },
                            { title: "Withdraw anytime", body: "Request withdrawals at any time. Track your sales through the analytics dashboard." },
                        ]} />
                        <SubTitle>Quality Control</SubTitle>
                        <Para>Every uploaded document goes through a verification process to ensure it meets our quality standards. We check for originality, relevance, and appropriateness. Sellers who consistently provide high-quality content earn badges and featured placement.</Para>
                    </section>

                    {/* ── 7. Security ── */}
                    <section id="security" className="py-11 border-b border-white/[0.08]">
                        <SectionTitle id="security">Security and Trust</SectionTitle>
                        <ImgPlaceholder label="Security & Trust Foundation" />
                        <Para>Security is at the heart of everything we do. Every transaction is encrypted and protected using industry-standard security protocols. User data is kept private and secure, and we never share personal information with third parties without explicit consent.</Para>
                        <Cards items={[
                            { icon: "💳", title: "Payment Security", body: "International security standards protect your money and financial information. We partner with trusted payment providers and use end-to-end encryption." },
                            { icon: "🛡️", title: "Content Protection", body: "Digital watermarking and tracking systems identify and address misuse. Continuous monitoring prevents fraud, unauthorized sharing, and copyright violations." },
                            { icon: "📜", title: "Clear Policies", body: "Transparent terms so everyone knows how the system works. Refund policy protects buyers; seller agreement protects creators' rights." },
                            { icon: "✅", title: "Verified Sellers", body: "Every seller goes through a verification process. Quality control ensures only genuine, valuable content reaches the marketplace." },
                        ]} />
                        <Para className="mt-4">Trust is not just a feature at LAN Library — it is our foundation. We work every day to maintain that trust through transparency, security, and fair practices.</Para>
                    </section>

                    {/* ── 8. Community ── */}
                    <section id="community" className="py-11 border-b border-white/[0.08]">
                        <SectionTitle id="community">Community and Growth</SectionTitle>
                        <ImgPlaceholder label="Community & Growth" />
                        <Para>LAN Library is more than a marketplace — it is a <strong className="text-[#e8e8f0] font-semibold">growing community</strong> of learners, educators, and knowledge enthusiasts. We foster connections between people who value education and understand the importance of quality information.</Para>
                        <SubTitle>User Engagement</SubTitle>
                        <Para>Users can leave reviews and ratings on documents they purchase, helping others make informed decisions. Sellers can respond to feedback and build relationships with their audience — creating a dynamic environment where quality is recognized and rewarded.</Para>
                        <SubTitle>Continuous Improvement</SubTitle>
                        <Para>We are constantly improving the platform based on user feedback. New features are added regularly to enhance the user experience, make navigation easier, and provide better tools for both buyers and sellers.</Para>
                        <SubTitle>Global Reach</SubTitle>
                        <Para>While we started with a focus on local content and needs, our vision is global. We are expanding to include content in multiple languages, covering subjects from around the world, and connecting learners and educators across borders. Knowledge has no boundaries, and neither should access to it.</Para>
                    </section>

                    {/* ── 9. Future ── */}
                    <section id="future" className="py-11 border-b border-white/[0.08]">
                        <SectionTitle id="future">The Future of LAN Library</SectionTitle>
                        <Para>We have ambitious plans for the future — live tutoring sessions, interactive learning modules, collaborative study groups, and subscription plans that give users access to entire collections at discounted rates.</Para>
                        <SubTitle>Enhanced Learning Tools</SubTitle>
                        <Para>Future updates will include note-taking features, highlighting capabilities, bookmark syncing across devices, and <strong className="text-[#e8e8f0] font-semibold">AI-powered study assistants</strong> that can help you understand complex materials better.</Para>
                        <SubTitle>Expanded Content Types</SubTitle>
                        <Para>We are working on supporting video lectures, audio courses, interactive presentations, and multimedia educational packages — making LAN Library a comprehensive learning ecosystem.</Para>
                        <SubTitle>Partnership Programs</SubTitle>
                        <Para>We plan to partner with educational institutions, training centers, and professional organizations to provide official course materials, certification preparation resources, and exclusive content.</Para>
                        <SubTitle>Global Expansion</SubTitle>
                        <Para>Expanding to multiple languages and regions — connecting learners and educators across borders. Knowledge has no boundaries, and neither will LAN Library.</Para>
                    </section>

                    {/* ── 10. About L.A.N ── */}
                    <section id="about-lan" className="py-11 border-b border-white/[0.08]">
                        <SectionTitle id="about-lan">The Learning Access Network (L.A.N)</SectionTitle>
                        <ImgPlaceholder label="Learning Access Network — Raising Leaders, Building People" />
                        <Para>The <strong className="text-[#e8e8f0] font-semibold">Learning Access Network (L.A.N)</strong> is a transformative platform designed to foster leadership development and personal growth. By connecting individuals with resources, mentors, and a supportive community, L.A.N aims to empower people to reach their full potential and become effective leaders in their respective fields.</Para>
                        <SubTitle>Purpose of L.A.N</SubTitle>
                        <Para>The primary purpose of L.A.N is to create an environment where individuals can learn, grow, and develop their leadership skills. The network focuses on providing access to educational resources, mentorship opportunities, and collaborative projects that encourage <strong className="text-[#e8e8f0] font-semibold">continuous improvement and innovation</strong>.</Para>
                        <SubTitle>Core Values</SubTitle>
                        <Cards items={[
                            { icon: "💪", title: "Empowerment", body: "L.A.N believes in empowering individuals to take control of their own learning and development — on their own terms and timeline." },
                            { icon: "🤝", title: "Collaboration", body: "The network encourages collaboration and the sharing of knowledge and experiences across communities and disciplines." },
                            { icon: "🌍", title: "Inclusivity", body: "L.A.N is committed to creating an inclusive environment where everyone feels valued, heard, and supported regardless of background." },
                            { icon: "📈", title: "Continuous Learning", body: "The network promotes a culture of continuous learning and improvement — growth is not a destination but an ongoing journey." },
                        ]} />
                        <SubTitle>Key Features</SubTitle>
                        <Steps items={[
                            { title: "Educational Resources", body: "Access to a wide range of educational materials, including online courses, webinars, and workshops designed to accelerate growth." },
                            { title: "Mentorship Programs", body: "Opportunities to connect with experienced mentors who can provide guidance, accountability, and real-world support." },
                            { title: "Community Engagement", body: "Participation in community events, discussions, and collaborative projects that build relationships and shared purpose." },
                            { title: "Personalized Learning Paths", body: "Tailored learning plans to meet individual needs and goals — because no two journeys to leadership are the same." },
                        ]} />
                        <SubTitle>Benefits of Joining L.A.N</SubTitle>
                        <AudienceGrid items={[
                            { icon: "🏆", name: "Leadership Development", body: "Gain the skills, mindset, and knowledge needed to become an effective leader in your field and community." },
                            { icon: "🔗", name: "Networking Opportunities", body: "Connect with like-minded individuals and professionals who share your drive for growth and impact." },
                            { icon: "🌱", name: "Personal Growth", body: "Access resources and support to help you achieve your personal and professional goals at every stage." },
                            { icon: "🫂", name: "Community Support", body: "Be part of a supportive community that genuinely values growth, celebrates wins, and lifts each other forward." },
                        ]} />
                        <Callout label="✦ The L.A.N Promise">
                            The Learning Access Network is more than just a platform — it's a community dedicated to <strong className="text-[#e8e8f0] font-semibold">raising leaders and building people</strong>. By providing access to valuable resources and fostering a culture of continuous learning, L.A.N empowers individuals to reach their full potential and make a positive impact in their communities.
                        </Callout>
                    </section>

                    {/* ── CONCLUSION ── */}
                    <div className="pt-11">
                        <div className="bg-gradient-to-br from-[#1a2540] to-[#1e1e38] border-l-4 border-orange-600 rounded-r-2xl px-8 py-7">
                            <div className="text-[19px] font-bold text-[#e8e8f0] mb-3.5 leading-snug">In simple terms: LAN Library connects knowledge to people, and turns knowledge into value.</div>
                            <p className="text-[14.5px] text-[#9090b8] leading-[1.72] mb-2.5">It is a marketplace where learning happens, earnings grow, and opportunities are created through the power of shared knowledge.</p>
                            <p className="text-[14.5px] text-[#9090b8] leading-[1.72]">We are building more than a platform — we are building a movement toward accessible education, fair compensation for creators, and a world where knowledge truly is power.</p>
                        </div>
                        <p className="text-center italic text-[16px] text-[#606080] pt-11">Welcome to LAN Library — The Global Student Library</p>
                    </div>
                </main>

                {/* ══════ RIGHT TOC ══════ */}
                <aside className="hidden xl:block fixed top-[52px] right-0 bottom-0 w-[240px] overflow-y-auto border-l border-white/[0.08] bg-[#141420] px-4 py-6">
                    <div className="text-[11px] font-semibold text-[#606080] uppercase tracking-[0.08em] mb-3 flex items-center gap-1.5">
                        <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 5.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                        </svg>
                        On this page
                    </div>
                    {TOC.map((item) => (
                        <div key={item.id}>
                            <button
                                onClick={() => scrollTo(item.id)}
                                className={`block w-full text-left text-[13px] py-1 pl-3 border-l-2 transition-all mb-0.5 ${activeId === item.id ? "text-[#4a9eff] border-[#4a9eff] font-medium" : "text-[#9090b0] border-transparent hover:text-[#e8e8f0] hover:border-white/[0.2]"}`}
                            >
                                {item.label}
                            </button>
                            {item.subs?.map((sub) => (
                                <button key={sub} onClick={() => scrollTo(item.id)} className="block w-full text-left text-[12.5px] py-0.5 pl-[22px] border-l-2 border-transparent text-[#606080] hover:text-[#9090b0] transition-colors mb-0.5">
                                    {sub}
                                </button>
                            ))}
                        </div>
                    ))}
                </aside>
            </div>
        </div>
    );
}