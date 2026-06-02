"use client";

import React, { useState } from "react";
import { Search, ArrowRight, FileText, Star, Sparkles, GraduationCap, BookOpen } from "lucide-react";
import Link from "next/link";
import Navbar from "@/components/NavBar";

/* ─── colour tokens ─────────────────────────────────────────── */
const NAVY  = "#0d2244";
const GOLD  = "#b8963e";
const GOLDD = "#d4aa5a";
const CREAM = "#f5f0e8";
const BG    = "#f5f1ea";

const helpCategories = [
    {
        title: "Getting Started", icon: "📖", articles: [
            { title: "Creating an account", slug: "creating-your-account" },
            { title: "Signing in to your account", slug: "signing-in" },
            { title: "Browsing the library", slug: "browsing-the-library" },
            { title: "Using the search function", slug: "using-search-function" },
        ]
    },
    {
    title: "Overview & Getting Started", icon: "🌍", articles: [
        { title: "What is LAN Library?", slug: "what-is-lan-library" },
        { title: "Becoming a LAN Seller", slug: "seller-account-overview" },
    ]
},
{
    title: "Uploading & Content", icon: "📤", articles: [
        { title: "Uploading Your First Book", slug: "uploading-first-book" },
        { title: "Responding to Student Reviews", slug: "responding-to-reviews" },
    ]
},
{
    title: "Physical & Print", icon: "📦", articles: [
        { title: "Consigning Physical Books to Abuja Registry", slug: "consigning-physical-books" },
        { title: "Enabling Print Licensing on Your Books", slug: "enabling-print-licensing" },
    ]
},
{
    title: "Bounty Board", icon: "🎯", articles: [
        { title: "How to Request Materials (For Buyers)", slug: "bounty-board-for-buyers" },
        { title: "Earning Money on the Bounty Board (For Sellers)", slug: "bounty-board-for-authors" },
    ]
},
    { title:"Payments & Subscriptions", icon:"💳", articles:[
        { title:"How to purchase a book",    slug:"how-to-purchase-book" },
        { title:"Accepted payment methods",  slug:"payment-methods" },
        { title:"Payment failed",            slug:"payment-failed" },
        { title:"Refund policy",             slug:"refund-policy" },
    ]},
    { title:"Downloads & Access", icon:"⬇️", articles:[
        { title:"Downloading your PDFs",     slug:"downloading-pdfs" },
        { title:"Accessing My Books",        slug:"accessing-my-books" },
        { title:"PDF won't open",            slug:"pdf-wont-open" },
    ]},
    {
        title: "Seller Tools", icon: "🛒", articles: [
            { title: "Physical Repository",           slug: "physical-repository" },
            { title: "My Physical Orders",            slug: "my-physical-orders" },
            { title: "Print License Ledger",          slug: "print-license-ledger" },
            { title: "Promotion Analytics",           slug: "promotion-analytics" },
            { title: "Impact Analytics",              slug: "impact-analytics" },
            { title: "How the Bounty Board works",    slug: "bounty-board" },
        ]
    },
    { title:"Account Management", icon:"👤", articles:[
        { title:"Updating your profile",     slug:"updating-profile" },
        { title:"Changing your password",    slug:"changing-password" },
        { title:"Deleting your account",     slug:"deleting-account" },
    ]},
    { title:"Security & Privacy", icon:"🔒", articles:[
        { title:"Privacy policy",            slug:"privacy-policy" },
        { title:"Terms of service",          slug:"terms-of-service" },
        { title:"Data protection",           slug:"data-protection" },
    ]},
];

export default function HelpCenterPage() {
    const [searchQuery, setSearchQuery] = useState("");

    const filtered = helpCategories.map(cat => ({
        ...cat,
        articles: cat.articles.filter(a =>
            a.title.toLowerCase().includes(searchQuery.toLowerCase())
        )
    })).filter(cat => cat.articles.length > 0);

    return (
        <>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400&family=Lato:wght@300;400;700&display=swap');
                .hc-root { font-family:'Lato',sans-serif; background:${BG}; }
                .lan-serif { font-family:'Playfair Display',Georgia,serif; }

                /* header dot-grid */
                .hc-header {
                    background-color:${NAVY};
                    background-image:
                        radial-gradient(rgba(184,150,62,0.06) 1px,transparent 1px),
                        radial-gradient(rgba(255,255,255,0.03) 1px,transparent 1px);
                    background-size:28px 28px,14px 14px;
                    background-position:0 0,7px 7px;
                }

                /* search input */
                .hc-search {
                    width:100%; padding:14px 16px 14px 48px;
                    background:#fff; border:0.5px solid #e5ddd0;
                    font-family:'Lato',sans-serif; font-size:14px; color:${NAVY};
                    outline:none; transition:border-color 0.2s, box-shadow 0.2s;
                    box-sizing:border-box;
                }
                .hc-search:focus { border-color:${GOLD}; box-shadow:0 0 0 3px rgba(184,150,62,0.1); }
                .hc-search::placeholder { color:#bbb; }

                /* category block */
                .cat-block { margin-bottom:40px; }

                /* article row */
                .art-row {
                    display:flex; align-items:center; justify-content:space-between;
                    padding:16px 20px; border-bottom:0.5px solid #e5ddd0;
                    text-decoration:none; transition:background 0.15s, padding-left 0.2s;
                    background:#fff;
                }
                .art-row:last-child { border-bottom:none; }
                .art-row:hover { background:${CREAM}; padding-left:26px; }
                .art-row:hover .art-arrow { color:${GOLD}; transform:translateX(3px); }
                .art-row:hover .art-title { color:${GOLD}; }
                .art-title { font-size:14px; font-weight:700; color:${NAVY}; transition:color 0.15s; font-family:'Playfair Display',serif; }
                .art-arrow { color:#ccc; transition:color 0.2s, transform 0.2s; }

                /* cat header */
                .cat-header {
                    display:flex; align-items:center; gap:12px;
                    padding:14px 20px; background:${NAVY};
                    border-bottom:0.5px solid rgba(184,150,62,0.2);
                }

                /* gold line */
                .gold-line { display:flex; align-items:center; gap:14px; }
                .gold-line::before,.gold-line::after { content:""; flex:1; height:1px; background:rgba(184,150,62,0.3); }

                /* no-results */
                .no-results { padding:48px 24px; text-align:center; background:#fff; border:0.5px solid #e5ddd0; }

                @keyframes slideUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
                .anim-up   { animation:slideUp 0.55s cubic-bezier(.4,0,.2,1) both; }
                .anim-up-2 { animation:slideUp 0.55s 0.1s cubic-bezier(.4,0,.2,1) both; }
            `}</style>

            <div className="hc-root" style={{ minHeight:"100vh" }}>
                <Navbar />

                {/* ══ HEADER ══ */}
                <section className="hc-header" style={{ padding:"72px 24px 60px" }}>
                    <div style={{ maxWidth:"720px", margin:"0 auto", textAlign:"center" }}>
                        {/* eyebrow */}
                        <div className="anim-up" style={{ display:"inline-flex", alignItems:"center", gap:"8px", background:"rgba(184,150,62,0.14)", border:`1px solid rgba(184,150,62,0.3)`, borderRadius:"999px", padding:"7px 16px", marginBottom:"24px" }}>
                            <Sparkles size={13} style={{ color: GOLD }} />
                            <span style={{ fontSize:"11px", fontWeight:700, letterSpacing:"0.14em", textTransform:"uppercase", color: GOLDD }}>Support for LAN Library</span>
                        </div>

                        <h1 className="lan-serif anim-up-2" style={{ fontSize:"clamp(38px,6vw,64px)", fontWeight:900, color:"#fff", lineHeight:1.06, letterSpacing:"-1px", margin:"0 0 16px" }}>
                            Help Center
                        </h1>

                        <p style={{ fontSize:"16px", color:"rgba(245,240,232,0.65)", margin:"0 0 36px", lineHeight:1.75, fontWeight:300 }}>
                            Find answers, guides, and support for Learning Access Network
                        </p>

                        {/* search */}
                        <div style={{ position:"relative", maxWidth:"540px", margin:"0 auto" }}>
                            <Search size={18} style={{ position:"absolute", left:"16px", top:"50%", transform:"translateY(-50%)", color:"#bbb", pointerEvents:"none" }} />
                            <input
                                className="hc-search"
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                placeholder="Search articles…"
                            />
                        </div>

                        {/* stats strip */}
                        <div style={{ borderTop:"0.5px solid rgba(184,150,62,0.2)", marginTop:"52px", display:"flex", flexWrap:"wrap" }}>
                            {[{ val:`${helpCategories.length}`, label:"Categories" },{ val:`${helpCategories.reduce((s,c)=>s+c.articles.length,0)}`, label:"Articles" },{ val:"24h", label:"Response Time" },{ val:"Free", label:"Support" }].map(({ val, label }) => (
                                <div key={label} style={{ flex:"1 1 100px", padding:"20px 16px 0", borderRight:"0.5px solid rgba(184,150,62,0.12)" }}>
                                    <div className="lan-serif" style={{ fontSize:"24px", fontWeight:700, color:"#fff" }}>{val}</div>
                                    <div style={{ fontSize:"10px", fontWeight:700, letterSpacing:"0.12em", textTransform:"uppercase", color:"rgba(184,150,62,0.7)", marginTop:"3px" }}>{label}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ══ ARTICLES ══ */}
                <main style={{ maxWidth:"900px", margin:"0 auto", padding:"60px 24px" }}>

                    {filtered.length === 0 ? (
                        <div className="no-results">
                            <BookOpen size={40} style={{ color:"#e5ddd0", margin:"0 auto 16px" }} />
                            <h3 className="lan-serif" style={{ fontSize:"22px", color: NAVY, marginBottom:"8px" }}>No articles found</h3>
                            <p style={{ fontSize:"13px", color:"#bbb" }}>Try a different search term</p>
                        </div>
                    ) : (
                        filtered.map((cat, i) => (
                            <div key={i} className="cat-block">
                                {/* category header bar */}
                                <div className="cat-header">
                                    <span style={{ fontSize:"16px" }}>{cat.icon}</span>
                                    <span className="lan-serif" style={{ fontSize:"15px", fontWeight:700, color:"#fff" }}>{cat.title}</span>
                                    <span style={{ marginLeft:"auto", fontSize:"10px", fontWeight:700, letterSpacing:"0.1em", textTransform:"uppercase", color:"rgba(184,150,62,0.7)" }}>
                                        {cat.articles.length} {cat.articles.length === 1 ? "article" : "articles"}
                                    </span>
                                </div>

                                {/* articles list */}
                                <div style={{ border:"0.5px solid #e5ddd0", borderTop:"none", overflow:"hidden" }}>
                                    {cat.articles.map((art, j) => (
                                        <Link key={j} href={`/lan/net/help-center/article/${art.slug}`} className="art-row">
                                            <div style={{ display:"flex", alignItems:"center", gap:"12px" }}>
                                                <div style={{ width:"28px", height:"28px", border:"0.5px solid #e5ddd0", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                                                    <FileText size={13} style={{ color: GOLD }} />
                                                </div>
                                                <span className="art-title">{art.title}</span>
                                            </div>
                                            <ArrowRight size={15} className="art-arrow" />
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        ))
                    )}
                </main>

                {/* ══ STILL NEED HELP ══ */}
                <section style={{ background:"#fff", borderTop:"0.5px solid #e5ddd0", borderBottom:"0.5px solid #e5ddd0", padding:"64px 24px" }}>
                    <div style={{ maxWidth:"1100px", margin:"0 auto", display:"flex", flexWrap:"wrap", gap:"40px", alignItems:"center" }}>
                        {/* crest */}
                        <div style={{ textAlign:"center", flexShrink:0 }}>
                            <div style={{ width:"64px", height:"64px", margin:"0 auto 12px", border:`2px solid ${NAVY}`, transform:"rotate(45deg)", display:"flex", alignItems:"center", justifyContent:"center" }}>
                                <GraduationCap size={24} style={{ color: NAVY, transform:"rotate(-45deg)" }} />
                            </div>
                            <p className="lan-serif" style={{ fontSize:"10px", color:"#bbb", fontStyle:"italic" }}>LAN Support</p>
                        </div>

                        <div style={{ width:"1px", height:"72px", background:"#e5ddd0", flexShrink:0 }} />

                        <div style={{ flex:1, minWidth:"220px" }}>
                            <p style={{ fontSize:"10px", fontWeight:700, letterSpacing:"0.2em", textTransform:"uppercase", color: GOLD, marginBottom:"8px", fontFamily:"'Lato',sans-serif" }}>Still need help?</p>
                            <h3 className="lan-serif" style={{ fontSize:"clamp(20px,3vw,28px)", fontWeight:700, color: NAVY, margin:"0 0 10px" }}>Our team is here for you.</h3>
                            <p style={{ fontSize:"13px", color:"#888", lineHeight:1.7, maxWidth:"440px", fontWeight:300, margin:0 }}>
                                Can't find what you're looking for? Contact our support team and we'll get back to you within 24 hours.
                            </p>
                        </div>

                        <div style={{ display:"flex", flexDirection:"column", gap:"10px", flexShrink:0 }}>
                            <Link href="/contact/lan/4/enquiry"
                                style={{ display:"flex", alignItems:"center", gap:"8px", padding:"12px 24px", background: NAVY, color:"#fff", fontSize:"13px", fontWeight:700, fontFamily:"'Lato',sans-serif", textDecoration:"none", letterSpacing:"0.04em", transition:"background 0.15s" }}
                                onMouseEnter={e => e.currentTarget.style.background="#1a3a6e"}
                                onMouseLeave={e => e.currentTarget.style.background=NAVY}
                            >
                                Contact Support
                            </Link>
                            <Link href="/lan/faqs"
                                style={{ display:"flex", alignItems:"center", gap:"8px", padding:"12px 24px", border:`0.5px solid ${NAVY}`, color: NAVY, fontSize:"13px", fontWeight:700, fontFamily:"'Lato',sans-serif", textDecoration:"none", letterSpacing:"0.04em", transition:"background 0.15s" }}
                                onMouseEnter={e => e.currentTarget.style.background="rgba(13,34,68,0.05)"}
                                onMouseLeave={e => e.currentTarget.style.background="transparent"}
                            >
                                Browse FAQ
                            </Link>
                        </div>
                    </div>
                </section>

                {/* ══ FOOTER ══ */}
                <footer style={{ background: NAVY, padding:"28px 24px", textAlign:"center", borderTop:"0.5px solid rgba(184,150,62,0.15)" }}>
                    <p style={{ fontSize:"12px", color:"rgba(245,240,232,0.4)", fontFamily:"'Lato',sans-serif", margin:0 }}>
                        © {new Date().getFullYear()} Learning Access Network. All rights reserved.
                    </p>
                </footer>
            </div>
        </>
    );
}