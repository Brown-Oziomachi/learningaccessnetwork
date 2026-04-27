'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Library, Sparkles, Star, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import Navbar from '@/components/NavBar';
import Footer from '@/components/FooterComp';

/* ─── colour tokens ─────────────────────────────────────────── */
const NAVY  = "#0d2244";
const GOLD  = "#b8963e";
const GOLDD = "#d4aa5a";
const CREAM = "#f5f0e8";
const BG    = "#f5f1ea";

const faqs = [
    {
        category: "Getting Started",
        questions: [
            { question: "How do I create an account?", answer: "Click 'Sign In' at the top right, then select 'Create new account'. Sign up via Google or email — fill in your name, date of birth, and email, then set a password." },
            { question: "Is Learning Access Network free to use?", answer: "Creating an account and browsing our library is completely free. Purchasing and downloading PDF books requires payment, priced per book, with lifetime access after purchase." },
            { question: "What payment methods do you accept?", answer: "We accept credit/debit cards and bank transfers. All payments are processed securely through our payment partners." },
        ]
    },
    {
        category: "Purchasing & Downloads",
        questions: [
            { question: "How do I purchase a book?", answer: "Browse the library, select a book, and click 'Purchase & Access'. After payment, the PDF is sent to your registered email and added to your 'My Books' section." },
            { question: "Where can I find my purchased books?", answer: "All purchased books live in 'My Books' — accessible via the header menu. Download your PDFs anytime from there." },
            { question: "Can I download books multiple times?", answer: "Yes. Once purchased, you have lifetime access and can re-download from 'My Books' as many times as you need." },
            { question: "What format are the books in?", answer: "All books are in PDF format, readable on any device — computers, tablets, and smartphones — using any PDF reader." },
            { question: "Can I get a refund if I'm not satisfied?", answer: "Due to the digital nature of our products, refunds are unavailable once a PDF is downloaded. We encourage reading the description and preview before purchasing." },
        ]
    },
    {
        category: "Account Management",
        questions: [
            { question: "How do I reset my password?", answer: "Click 'Sign In' → 'Forgotten password?'. Enter your registered email and follow the reset link we send you." },
            { question: "Can I change my email address?", answer: "Yes, under Account › Settings. Note that purchased books are tied to the email used at purchase — you must log in with the original email to access them." },
            { question: "How do I upload my own PDF books?", answer: "Visit the 'Advertise with us' section and submit your book details. LAN reviews your submission and uploads it to the relevant category." },
        ]
    },
    {
        category: "Technical Support",
        questions: [
            { question: "I didn't receive my PDF after purchase. What should I do?", answer: "Check your spam/junk folder first. Then visit 'My Books' — all purchases are stored there. If it's missing, contact support with your transaction details." },
            { question: "The PDF won't open. How can I fix this?", answer: "Ensure you have a PDF reader installed (Adobe Acrobat Reader is free). If the problem persists, try re-downloading from 'My Books'." },
            { question: "Can I read books on multiple devices?", answer: "Yes — your books are tied to your account, not your device. Sign in on any device and access your library from 'My Books'." },
        ]
    },
    {
        category: "Categories & Search",
        questions: [
            { question: "What categories of books do you offer?", answer: "Education, Personal Development, Business, Technology, Science, Literature, Health & Wellness, History, and Arts & Culture — browse by category from the menu bar." },
            { question: "How do I search for a specific book?", answer: "Use the search bar at the top. Search by title, author, or keyword. Filter results by category, price, and rating." },
        ]
    },
];

export default function FAQClient() {
    const [openIndex, setOpenIndex] = useState('0-0');

    const toggle = (ci, qi) => {
        const idx = `${ci}-${qi}`;
        setOpenIndex(openIndex === idx ? null : idx);
    };

    return (
        <>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400&family=Lato:wght@300;400;700&display=swap');
                .faq-root { font-family:'Lato',sans-serif; background:${BG}; }
                .lan-serif { font-family:'Playfair Display',Georgia,serif; }

                /* hero */
                .faq-hero {
                    background-color:${NAVY};
                    background-image:
                        radial-gradient(rgba(184,150,62,0.06) 1px,transparent 1px),
                        radial-gradient(rgba(255,255,255,0.03) 1px,transparent 1px);
                    background-size:28px 28px,14px 14px;
                    background-position:0 0,7px 7px;
                }

                /* category pill */
                .cat-pill {
                    display:inline-block;
                    padding:4px 12px;
                    background:rgba(184,150,62,0.12);
                    border:0.5px solid rgba(184,150,62,0.35);
                    font-size:9px; font-weight:700; letter-spacing:0.18em;
                    text-transform:uppercase; color:${GOLD};
                    font-family:'Lato',sans-serif; margin-bottom:20px;
                }

                /* faq row */
                .faq-row {
                    border-bottom:0.5px solid #e5ddd0;
                    transition:background 0.18s;
                }
                .faq-row:last-child { border-bottom:none; }
                .faq-btn {
                    width:100%; display:flex; align-items:center;
                    justify-content:space-between; padding:22px 0;
                    background:none; border:none; cursor:pointer;
                    text-align:left; gap:20px;
                    font-family:'Lato',sans-serif;
                }
                .faq-btn:hover .faq-q { color:${GOLD}; }
                .faq-q {
                    font-size:15px; font-weight:700; color:${NAVY};
                    line-height:1.4; transition:color 0.18s;
                    font-family:'Playfair Display',serif;
                }
                .faq-icon {
                    width:32px; height:32px; flex-shrink:0;
                    border:0.5px solid #e5ddd0;
                    display:flex; align-items:center; justify-content:center;
                    transition:background 0.22s, border-color 0.22s;
                }
                .faq-icon-open { background:${GOLD}; border-color:${GOLD}; }

                /* help card */
                .help-card {
                    background:#fff; border:0.5px solid #e5ddd0;
                    padding:32px 28px; text-align:center;
                    transition:transform 0.22s,box-shadow 0.22s,border-color 0.22s;
                    text-decoration:none; display:block;
                }
                .help-card:hover { transform:translateY(-5px); box-shadow:0 16px 40px rgba(13,34,68,0.1); border-color:${GOLD}; }

                /* gold line */
                .gold-line { display:flex; align-items:center; gap:14px; }
                .gold-line::before,.gold-line::after { content:""; flex:1; height:1px; background:rgba(184,150,62,0.3); }

                /* cta bg */
                .cta-bg {
                    background-color:${CREAM};
                    background-image:radial-gradient(rgba(13,34,68,0.05) 1px,transparent 1px);
                    background-size:22px 22px;
                }

                @keyframes slideUp { from{opacity:0;transform:translateY(22px)} to{opacity:1;transform:translateY(0)} }
                .anim-up   { animation:slideUp 0.6s cubic-bezier(.4,0,.2,1) both; }
                .anim-up-2 { animation:slideUp 0.6s 0.12s cubic-bezier(.4,0,.2,1) both; }
                .anim-up-3 { animation:slideUp 0.6s 0.24s cubic-bezier(.4,0,.2,1) both; }
            `
            }
            </style>

            <div className="faq-root" style={{ minHeight:"100vh" }}>
                <Navbar />

                {/* ══ HERO ══ */}
                <section className="faq-hero" style={{ padding:"80px 24px 72px" }}>
                    <div style={{ maxWidth:"1100px", margin:"0 auto", display:"flex", flexWrap:"wrap", gap:"48px", alignItems:"center" }}>
                        {/* left copy */}
                        <div style={{ flex:"1 1 360px" }}>
                            <div className="anim-up" style={{ display:"inline-flex", alignItems:"center", gap:"8px", background:"rgba(184,150,62,0.14)", border:`1px solid rgba(184,150,62,0.3)`, borderRadius:"999px", padding:"7px 16px", marginBottom:"24px" }}>
                                <Sparkles size={13} style={{ color: GOLD }} />
                                <span style={{ fontSize:"11px", fontWeight:700, letterSpacing:"0.14em", textTransform:"uppercase", color: GOLDD }}>Share &amp; Earn</span>
                            </div>

                            <h1 className="lan-serif anim-up-2" style={{ fontSize:"clamp(38px,6vw,68px)", fontWeight:900, color:"#fff", lineHeight:1.04, letterSpacing:"-1px", margin:"0 0 20px" }}>
                                Share LAN Library,<br />
                                <span style={{ color: GOLD, fontStyle:"italic" }}>earn ₦500.</span>
                            </h1>

                            <p className="anim-up-3" style={{ fontSize:"16px", color:"rgba(245,240,232,0.7)", maxWidth:"480px", lineHeight:1.8, margin:"0 0 36px", fontWeight:300 }}>
                                Invite friends to LAN Library and they unlock the privilege to sell their own books.
                                Help your friends earn while sharing knowledge with the community.
                            </p>

                            <div className="anim-up-3" style={{ display:"flex", flexWrap:"wrap", gap:"12px" }}>
                                <Link href="/referrals"
                                    style={{ display:"inline-flex", alignItems:"center", gap:"8px", padding:"13px 28px", background: GOLD, color: NAVY, fontSize:"13px", fontWeight:700, fontFamily:"'Lato',sans-serif", letterSpacing:"0.06em", textDecoration:"none", transition:"background 0.18s" }}
                                    onMouseEnter={e => e.currentTarget.style.background=GOLDD}
                                    onMouseLeave={e => e.currentTarget.style.background=GOLD}
                                >
                                    Get your link
                                </Link>
                                <Link href="/documents"
                                    style={{ display:"inline-flex", alignItems:"center", gap:"8px", padding:"13px 28px", border:"0.5px solid rgba(255,255,255,0.2)", color:"rgba(245,240,232,0.85)", fontSize:"13px", fontWeight:700, fontFamily:"'Lato',sans-serif", letterSpacing:"0.06em", textDecoration:"none", transition:"background 0.18s" }}
                                    onMouseEnter={e => e.currentTarget.style.background="rgba(255,255,255,0.07)"}
                                    onMouseLeave={e => e.currentTarget.style.background="transparent"}
                                >
                                    <Library size={14} /> Browse Library
                                </Link>
                            </div>
                        </div>

                        {/* right image */}
                        <div style={{ flex:"1 1 280px", position:"relative", minHeight:"320px", overflow:"hidden" }}>
                            <img src="/earn.png" alt="Students sharing knowledge" style={{ width:"100%", height:"400px", objectFit:"cover", display:"block" }} />
                            {/* gold corner accent */}
                            <div style={{ position:"absolute", bottom:0, left:0, right:0, height:"80px", background:`linear-gradient(to top, ${NAVY}, transparent)` }} />
                            <div style={{ position:"absolute", top:"12px", right:"12px", width:"40px", height:"40px", border:`2px solid ${GOLD}`, transform:"rotate(45deg)" }} />
                        </div>
                    </div>

                    {/* stats strip */}
                    <div style={{ maxWidth:"1100px", margin:"48px auto 0", borderTop:"0.5px solid rgba(184,150,62,0.2)", paddingTop:"0", display:"flex", flexWrap:"wrap" }}>
                        {[{ val:"90M+", label:"Documents" },{ val:"2.4M+", label:"Learners" },{ val:"1,000+", label:"Sellers" },{ val:"₦500", label:"Per Referral" }].map(({ val, label }) => (
                            <div key={label} style={{ flex:"1 1 120px", padding:"24px 20px 0", borderRight:"0.5px solid rgba(184,150,62,0.12)" }}>
                                <div className="lan-serif" style={{ fontSize:"28px", fontWeight:700, color:"#fff" }}>{val}</div>
                                <div style={{ fontSize:"10px", fontWeight:700, letterSpacing:"0.12em", textTransform:"uppercase", color:"rgba(184,150,62,0.7)", marginTop:"4px" }}>{label}</div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* ══ FAQ ══ */}
                <section style={{ background:"#fff", padding:"80px 24px" }}>
                            <div
                            style={{
                                maxWidth: "1100px",
                                margin: "0 auto",
                                display: "grid",
                                gridTemplateColumns: "1fr",
                                gap: "40px",
                            }}
                            className="faq-grid"
                            >
                                                    {/* sticky left */}
                            {/* sticky left */}
                            <div
                            className="faq-left"
                            style={{
                                position: "sticky",
                                top: "32px",
                                background: "#fff",   // fixes merging
                                zIndex: 10,           // keeps it above FAQs
                                paddingBottom: "20px"
                            }}
                            >                            
                            <p style={{ fontSize:"10px", fontWeight:700, letterSpacing:"0.22em", textTransform:"uppercase", color: GOLD, marginBottom:"12px", fontFamily:"'Lato',sans-serif" }}>Help &amp; Support</p>
                            <h2 className="lan-serif" style={{ fontSize:"clamp(32px,4vw,52px)", fontWeight:700, color: NAVY, margin:"0 0 20px", lineHeight:1.08 }}>
                                Frequently<br />
                                <span style={{ fontStyle:"italic", color: GOLD }}>asked</span><br />
                                questions.
                            </h2>
                            <div className="gold-line" style={{ maxWidth:"160px", margin:"0 0 24px" }}>
                                <div style={{ width:"7px", height:"7px", background: GOLD, transform:"rotate(45deg)", flexShrink:0 }} />
                            </div>
                            <p style={{ fontSize:"13px", color:"#888", lineHeight:1.7, fontWeight:300, maxWidth:"240px" }}>
                                Can't find an answer? Contact our support team and we'll respond within 24 hours.
                            </p>
                            <Link href="/contact/lan/4/enquiry"
                                style={{ display:"inline-flex", alignItems:"center", gap:"6px", marginTop:"20px", fontSize:"11px", fontWeight:700, letterSpacing:"0.06em", textTransform:"uppercase", color: NAVY, textDecoration:"none", border:`0.5px solid ${NAVY}`, padding:"10px 18px", transition:"background 0.18s" }}
                                onMouseEnter={e => e.currentTarget.style.background="rgba(13,34,68,0.06)"}
                                onMouseLeave={e => e.currentTarget.style.background="transparent"}
                            >
                                Contact Support <ArrowRight size={12} />
                            </Link>
                        </div>

                        {/* right FAQs */}
                        <div>
                            {faqs.map((cat, ci) => (
                                <div key={ci} style={{ marginBottom:"40px" }}>
                                    <span className="cat-pill">{cat.category}</span>

                                    <div style={{ border:"0.5px solid #e5ddd0", background: BG }}>
                                        {cat.questions.map((faq, qi) => {
                                            const idx = `${ci}-${qi}`;
                                            const open = openIndex === idx;
                                            return (
                                                <motion.div key={idx} className="faq-row" initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay: qi*0.04 }}>
                                                    <button className="faq-btn" onClick={() => toggle(ci, qi)} style={{ padding:"20px 20px" }}>
                                                        <span className="faq-q">{faq.question}</span>
                                                        <div className={`faq-icon ${open ? "faq-icon-open" : ""}`}>
                                                            <ChevronDown size={16} color={open ? "#fff" : NAVY} style={{ transform: open?"rotate(180deg)":"rotate(0)", transition:"transform 0.3s" }} />
                                                        </div>
                                                    </button>
                                                    <AnimatePresence>
                                                        {open && (
                                                            <motion.div
                                                                initial={{ height:0, opacity:0 }}
                                                                animate={{ height:"auto", opacity:1 }}
                                                                exit={{ height:0, opacity:0 }}
                                                                transition={{ duration:0.28, ease:"easeInOut" }}
                                                                style={{ overflow:"hidden" }}
                                                            >
                                                                <div style={{ padding:"0 20px 20px", borderTop:`0.5px solid #e5ddd0` }}>
                                                                    <p style={{ fontSize:"14px", color:"#666", lineHeight:1.8, margin:"16px 0 0", fontWeight:300 }}>{faq.answer}</p>
                                                                </div>
                                                            </motion.div>
                                                        )}
                                                    </AnimatePresence>
                                                </motion.div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ══ STILL NEED HELP ══ */}
                <section className="cta-bg" style={{ padding:"80px 24px" }}>
                    <div style={{ maxWidth:"800px", margin:"0 auto", textAlign:"center" }}>
                        {/* gold star divider */}
                        <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:"16px", marginBottom:"28px" }}>
                            <div style={{ height:"1px", width:"60px", background:"rgba(184,150,62,0.4)" }} />
                            <Star size={14} style={{ color: GOLD, fill: GOLD }} />
                            <div style={{ height:"1px", width:"60px", background:"rgba(184,150,62,0.4)" }} />
                        </div>

                        <p style={{ fontSize:"10px", fontWeight:700, letterSpacing:"0.22em", textTransform:"uppercase", color: GOLD, marginBottom:"12px", fontFamily:"'Lato',sans-serif" }}>We're Here</p>
                        <h3 className="lan-serif" style={{ fontSize:"clamp(28px,4vw,46px)", fontWeight:700, color: NAVY, margin:"0 0 16px" }}>
                            Still need help?
                        </h3>
                        <div className="gold-line" style={{ maxWidth:"200px", margin:"0 auto 20px" }}>
                            <div style={{ width:"7px", height:"7px", background: GOLD, transform:"rotate(45deg)", flexShrink:0 }} />
                        </div>
                        <p style={{ fontSize:"14px", color:"#888", maxWidth:"440px", margin:"0 auto 40px", lineHeight:1.75, fontWeight:300 }}>
                            Can't find the answer? Our support team is ready to help.
                        </p>

                        <div style={{ display:"flex", flexWrap:"wrap", gap:"12px", justifyContent:"center" }}>
                            <Link href="/contact/lan/4/enquiry"
                                style={{ display:"inline-flex", alignItems:"center", gap:"8px", padding:"13px 28px", background: NAVY, color:"#fff", fontSize:"13px", fontWeight:700, fontFamily:"'Lato',sans-serif", letterSpacing:"0.06em", textDecoration:"none", transition:"background 0.18s" }}
                                onMouseEnter={e => e.currentTarget.style.background="#1a3a6e"}
                                onMouseLeave={e => e.currentTarget.style.background=NAVY}
                            >
                                Contact Support
                            </Link>
                            <Link href="/lan/net/help-center"
                                style={{ display:"inline-flex", alignItems:"center", gap:"8px", padding:"13px 28px", border:`0.5px solid ${NAVY}`, color: NAVY, fontSize:"13px", fontWeight:700, fontFamily:"'Lato',sans-serif", letterSpacing:"0.06em", textDecoration:"none", transition:"background 0.18s" }}
                                onMouseEnter={e => e.currentTarget.style.background="rgba(13,34,68,0.06)"}
                                onMouseLeave={e => e.currentTarget.style.background="transparent"}
                            >
                                <Library size={13} /> Visit Help Center
                            </Link>
                        </div>
                    </div>
                </section>

                <Footer />
            </div>
        </>
    );
}