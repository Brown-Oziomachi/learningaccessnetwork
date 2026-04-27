"use client";

import { useState } from "react";
import {
    Play, ChevronLeft, ChevronRight, DollarSign, BookOpen,
    Users, TrendingUp, CheckCircle, ArrowRight, X, Upload,
    Star, Sparkles, GraduationCap,
} from "lucide-react";
import Link from "next/link";

/* ─── colour tokens (matches HomeClient exactly) ─────────────── */
const NAVY  = "#0d2244";
const GOLD  = "#b8963e";
const GOLDD = "#d4aa5a";
const CREAM = "#f5f0e8";
const BG    = "#f5f1ea";

const currentYear = new Date().getFullYear();

/* ─── data ─────────────────────────────────────────────────────── */
const videos = [
    { id:1, title:"Getting Started with LAN Library",       description:"Set up your account and learn the platform inside out.",                                      thumbnail:"/make.png", videoUrl:"https://www.youtube.com/embed/dQw4w9WgXcQ", duration:"5:30" },
    { id:2, title:"AI Tools For Writing Books",             description:"Today's the best time to write. Discover the tools that accelerate your output.",              thumbnail:"/make.png", videoUrl:"/tools.mp4",                             duration:"8:45" },
    { id:3, title:"Pricing Strategies That Work",           description:"Discover the best pricing strategies to maximise your earnings on every upload.",              thumbnail:"/make.png", videoUrl:"https://www.youtube.com/embed/dQw4w9WgXcQ", duration:"6:20" },
    { id:4, title:"Marketing Your Books Effectively",       description:"Learn how to promote your books and reach more buyers across the network.",                    thumbnail:"/make.png", videoUrl:"https://www.youtube.com/embed/dQw4w9WgXcQ", duration:"10:15" },
    { id:5, title:"Understanding Your Earnings",            description:"How the payment system works and when you get paid — no surprises.",                           thumbnail:"/make.png", videoUrl:"https://www.youtube.com/embed/dQw4w9WgXcQ", duration:"7:10" },
    { id:6, title:"Success Stories & Case Studies",         description:"Real sellers sharing their experiences and hard-won tips for scale.",                          thumbnail:"/make.png", videoUrl:"https://www.youtube.com/embed/dQw4w9WgXcQ", duration:"12:30" },
];

const stats = [
    { icon: DollarSign, value:"₦500K+", label:"Avg Monthly Earnings" },
    { icon: Users,      value:"1,000+", label:"Active Sellers"        },
    { icon: BookOpen,   value:"5,000+", label:"Books Sold Monthly"    },
    { icon: TrendingUp, value:"85%",    label:"Revenue Share"         },
];

const steps = [
    { number:"01", title:"Create Your Seller Account",  description:"Sign up and complete your seller profile with your bank details. Approved within 24 hours." },
    { number:"02", title:"Upload Your Books",            description:"Upload your PDF books with descriptions and set your prices. We accept academic materials, textbooks, and more." },
    { number:"03", title:"Start Earning",               description:"Every sale earns you 80% of the price. Withdraw any time you reach ₦1,000 — no holds, no fuss." },
];

const benefits = [
    "Earn 85% of every sale — highest in the industry",
    "No upfront costs or hidden fees",
    "Instant payment processing",
    "Reach thousands of students and professionals",
    "Keep full ownership of your content",
    "24/7 customer support for sellers",
    "Easy-to-use upload system",
    "Detailed sales analytics dashboard",
];

/* ════════════════════════════════════════════════════════════════ */
export default function MakeMoneyPage() {
    const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
    const [showModal,  setShowModal]  = useState(false);
    const [selected,   setSelected]   = useState(null);

    const openVideo  = (v) => { setSelected(v); setShowModal(true); };
    const closeVideo = ()  => { setShowModal(false); setSelected(null); };

    const prev = () => setCurrentVideoIndex(i => (i === 0 ? videos.length - 1 : i - 1));
    const next = () => setCurrentVideoIndex(i => (i === videos.length - 1 ? 0 : i + 1));
    const visible = [0,1,2].map(n => videos[(currentVideoIndex + n) % videos.length]);

    return (
        <>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400&family=Lato:wght@300;400;700&display=swap');

                .mm-root { font-family:'Lato',sans-serif; background:${BG}; color:${NAVY}; }
                .lan-serif { font-family:'Playfair Display',Georgia,serif; }

                /* header dot-grid */
                .mm-header {
                    background-color:${NAVY};
                    background-image:
                        radial-gradient(rgba(184,150,62,0.06) 1px,transparent 1px),
                        radial-gradient(rgba(255,255,255,0.03) 1px,transparent 1px);
                    background-size:28px 28px,14px 14px;
                    background-position:0 0,7px 7px;
                }

                /* hero */
                .mm-hero {
                    background-color:${NAVY};
                    background-image:
                        radial-gradient(rgba(184,150,62,0.06) 1px,transparent 1px),
                        radial-gradient(rgba(255,255,255,0.03) 1px,transparent 1px);
                    background-size:28px 28px,14px 14px;
                    background-position:0 0,7px 7px;
                }

                /* stat card */
                .stat-card {
                    background:#fff;
                    border:0.5px solid #e5ddd0;
                    padding:28px 20px;
                    text-align:center;
                    transition:transform 0.22s,box-shadow 0.22s,border-color 0.22s;
                }
                .stat-card:hover { transform:translateY(-5px); box-shadow:0 16px 40px rgba(13,34,68,0.12); border-color:${GOLD}; }

                /* video section bg */
                .video-bg {
                    background-color:${NAVY};
                    background-image:
                        repeating-linear-gradient(45deg,transparent,transparent 12px,rgba(255,255,255,0.018) 12px,rgba(255,255,255,0.018) 13px),
                        repeating-linear-gradient(-45deg,transparent,transparent 12px,rgba(255,255,255,0.018) 12px,rgba(255,255,255,0.018) 13px);
                }

                /* video card */
                .vid-card {
                    background:#fff;
                    transition:transform 0.25s,box-shadow 0.25s,border-color 0.25s;
                    border:0.5px solid #e5ddd0;
                    overflow:hidden;
                    cursor:pointer;
                }
                .vid-card:hover { box-shadow:0 20px 48px rgba(13,34,68,0.18); border-color:${GOLD}; }
                .vid-card:hover .vid-thumb { transform:scale(1.05); }
                .vid-thumb { transition:transform 0.5s cubic-bezier(.4,0,.2,1); }

                /* step card */
                .step-card {
                    background:rgba(255,255,255,0.04);
                    border:0.5px solid rgba(184,150,62,0.2);
                    padding:32px 28px;
                    transition:border-color 0.22s,background 0.22s;
                    flex-shrink:0;
                }
                .step-card:hover { border-color:${GOLD}; background:rgba(184,150,62,0.05); }

                /* benefits bg */
                .benefits-bg {
                    background:${CREAM};
                    background-image:radial-gradient(rgba(13,34,68,0.05) 1px,transparent 1px);
                    background-size:22px 22px;
                }

                /* gold line */
                .gold-line { display:flex; align-items:center; gap:14px; }
                .gold-line::before,.gold-line::after { content:""; flex:1; height:1px; background:rgba(184,150,62,0.3); }

                /* sbar hide */
                .sbar-none { scrollbar-width:none; -ms-overflow-style:none; }
                .sbar-none::-webkit-scrollbar { display:none; }

                /* play btn */
                .play-btn {
                    width:64px; height:64px;
                    background:rgba(255,255,255,0.18); backdrop-filter:blur(8px);
                    border-radius:50%; border:2px solid rgba(255,255,255,0.4);
                    display:flex; align-items:center; justify-content:center;
                    transition:transform 0.2s,background 0.2s;
                }
                .vid-card:hover .play-btn { transform:scale(1.1); background:rgba(255,255,255,0.28); }

                /* cta section */
                .cta-bg {
                    background-color:${NAVY};
                    background-image:
                        repeating-linear-gradient(45deg,transparent,transparent 12px,rgba(255,255,255,0.018) 12px,rgba(255,255,255,0.018) 13px),
                        repeating-linear-gradient(-45deg,transparent,transparent 12px,rgba(255,255,255,0.018) 12px,rgba(255,255,255,0.018) 13px);
                }

                @keyframes slideUp { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
                .anim-up   { animation:slideUp 0.6s cubic-bezier(.4,0,.2,1) both; }
                .anim-up-2 { animation:slideUp 0.6s 0.12s cubic-bezier(.4,0,.2,1) both; }
                .anim-up-3 { animation:slideUp 0.6s 0.24s cubic-bezier(.4,0,.2,1) both; }
            `}</style>

            <div className="mm-root" style={{ minHeight:"100vh" }}>

                {/* ══ HEADER ══ */}
                <header className="mm-header" style={{ padding:"0 24px", borderBottom:"0.5px solid rgba(184,150,62,0.15)" }}>
                    <div style={{ maxWidth:"1200px", margin:"0 auto", padding:"18px 0" }}>
                        <Link href="/home" style={{ textDecoration:"none" }}>
                            <div className="lan-serif" style={{ fontSize:"clamp(24px,4vw,34px)", fontWeight:900, color:"#fff", lineHeight:1 }}>
                                [LAN Library]
                            </div>
                            <div style={{ fontSize:"11px", fontWeight:300, color:"rgba(245,240,232,0.6)", letterSpacing:"0.1em", fontFamily:"'Lato',sans-serif" }}>
                                The Global Student Library
                            </div>
                        </Link>
                    </div>
                </header>

                {/* ══ HERO ══ */}
                <section className="mm-hero" style={{ padding:"80px 24px 72px" }}>
                    <div style={{ maxWidth:"900px", margin:"0 auto" }}>
                        {/* eyebrow */}
                        <div className="anim-up" style={{ display:"inline-flex", alignItems:"center", gap:"8px", background:"rgba(184,150,62,0.14)", border:`1px solid rgba(184,150,62,0.3)`, borderRadius:"999px", padding:"7px 16px", marginBottom:"28px" }}>
                            <Sparkles size={13} style={{ color: GOLD }} />
                            <span style={{ fontSize:"11px", fontWeight:700, letterSpacing:"0.14em", textTransform:"uppercase", color: GOLDD }}>Seller Programme</span>
                        </div>

                        <h1 className="lan-serif anim-up-2" style={{ fontSize:"clamp(42px,7vw,78px)", fontWeight:900, color:"#fff", lineHeight:1.02, letterSpacing:"-1.5px", margin:"0 0 24px" }}>
                            Make Money<br />
                            <span style={{ color: GOLD, fontStyle:"italic" }}>Selling Books.</span>
                        </h1>

                        <p className="anim-up-3" style={{ fontSize:"17px", color:"rgba(245,240,232,0.72)", maxWidth:"560px", lineHeight:1.75, margin:"0 0 40px", fontWeight:300 }}>
                            From developing ideas to marketing your finished work — learn every step
                            of the process and earn from Africa's fastest-growing academic library.
                        </p>

                        <div className="anim-up-3" style={{ display:"flex", flexWrap:"wrap", gap:"12px" }}>
                            <Link href="/become-seller"
                                style={{ display:"inline-flex", alignItems:"center", gap:"8px", padding:"14px 32px", background: GOLD, color: NAVY, fontSize:"13px", fontWeight:700, fontFamily:"'Lato',sans-serif", letterSpacing:"0.06em", textDecoration:"none", transition:"background 0.18s" }}
                                onMouseEnter={e => e.currentTarget.style.background=GOLDD}
                                onMouseLeave={e => e.currentTarget.style.background=GOLD}
                            >
                                <Upload size={14} /> Become a Seller
                            </Link>
                            <a href="#how-it-works"
                                style={{ display:"inline-flex", alignItems:"center", gap:"8px", padding:"14px 32px", border:"0.5px solid rgba(255,255,255,0.2)", color: CREAM, fontSize:"13px", fontWeight:700, fontFamily:"'Lato',sans-serif", letterSpacing:"0.06em", textDecoration:"none", transition:"background 0.18s" }}
                                onMouseEnter={e => e.currentTarget.style.background="rgba(255,255,255,0.07)"}
                                onMouseLeave={e => e.currentTarget.style.background="transparent"}
                            >
                                How it works <ArrowRight size={13} />
                            </a>
                        </div>

                        {/* stats strip */}
                        <div style={{ borderTop:"0.5px solid rgba(184,150,62,0.2)", marginTop:"60px", paddingTop:"0", display:"flex", flexWrap:"wrap" }}>
                            {stats.map(({ icon: Icon, value, label }) => (
                                <div key={label} style={{ flex:"1 1 120px", padding:"24px 20px 0", borderRight:"0.5px solid rgba(184,150,62,0.12)" }}>
                                    <div className="lan-serif" style={{ fontSize:"28px", fontWeight:700, color:"#fff" }}>{value}</div>
                                    <div style={{ fontSize:"11px", fontWeight:700, letterSpacing:"0.1em", textTransform:"uppercase", color:"rgba(184,150,62,0.7)", marginTop:"4px" }}>{label}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ══ STATS CARDS ══ */}
                <section style={{ background:"#fff", padding:"64px 24px" }}>
                    <div style={{ maxWidth:"1100px", margin:"0 auto" }}>
                        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))", gap:"20px" }}>
                            {stats.map(({ icon: Icon, value, label }) => (
                                <div key={label} className="stat-card">
                                    <div style={{ width:"46px", height:"46px", border:`0.5px solid #e5ddd0`, display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 16px" }}>
                                        <Icon size={20} style={{ color: NAVY }} strokeWidth={1.5} />
                                    </div>
                                    <div className="lan-serif" style={{ fontSize:"32px", fontWeight:700, color: NAVY, marginBottom:"6px" }}>{value}</div>
                                    <div style={{ fontSize:"11px", fontWeight:700, letterSpacing:"0.1em", textTransform:"uppercase", color: GOLD }}>{label}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ══ VIDEO CAROUSEL ══ */}
                <section className="video-bg" style={{ padding:"80px 24px" }}>
                    <div style={{ maxWidth:"1200px", margin:"0 auto" }}>
                        <div style={{ textAlign:"center", marginBottom:"52px" }}>
                            <p style={{ fontSize:"10px", fontWeight:700, letterSpacing:"0.22em", textTransform:"uppercase", color: GOLD, marginBottom:"10px", fontFamily:"'Lato',sans-serif" }}>
                                Step-by-Step Tutorials
                            </p>
                            <h2 className="lan-serif" style={{ fontSize:"clamp(28px,4vw,48px)", fontWeight:700, color:"#fff", margin:"0 0 14px" }}>
                                Watch &amp; Learn
                            </h2>
                            <div className="gold-line" style={{ maxWidth:"200px", margin:"0 auto" }}>
                                <div style={{ width:"7px", height:"7px", background: GOLD, transform:"rotate(45deg)", flexShrink:0 }} />
                            </div>
                        </div>

                        {/* Desktop carousel */}
                        <div style={{ display:"none", position:"relative" }} className="desk-carousel">
                            <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:"20px" }}>
                                {visible.map((v, i) => (
                                    <div key={v.id} className="vid-card" style={{ opacity: i===1?1:0.65, transform: i===1?"scale(1.04)":"scale(0.96)", transition:"all 0.3s" }}>
                                        <div style={{ position:"relative", overflow:"hidden", aspectRatio:"16/9", background:"#111" }}
                                            onClick={() => openVideo(v)}>
                                            <img src={v.thumbnail} alt={v.title} className="vid-thumb" style={{ width:"100%", height:"100%", objectFit:"cover", opacity:0.75 }} />
                                            <div style={{ position:"absolute", inset:0, background:"linear-gradient(to top,rgba(13,34,68,0.7) 0%,transparent 60%)" }} />
                                            <div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center" }}>
                                                <div className="play-btn"><Play size={22} style={{ color:"#fff", fill:"#fff", marginLeft:"3px" }} /></div>
                                            </div>
                                            <div style={{ position:"absolute", top:"10px", right:"10px", background:"rgba(0,0,0,0.7)", color:"#fff", fontSize:"10px", fontWeight:700, padding:"3px 8px", fontFamily:"'Lato',sans-serif" }}>{v.duration}</div>
                                        </div>
                                        <div style={{ padding:"18px" }}>
                                            <h3 className="lan-serif" style={{ fontSize:"15px", fontWeight:700, color: NAVY, margin:"0 0 6px" }}>{v.title}</h3>
                                            <p style={{ fontSize:"12px", color:"#888", lineHeight:1.6, margin:0 }}>{v.description}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            {/* nav */}
                            <button onClick={prev} style={{ position:"absolute", left:"-20px", top:"40%", transform:"translateY(-50%)", width:"40px", height:"40px", background:"rgba(255,255,255,0.1)", border:"0.5px solid rgba(184,150,62,0.3)", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer" }}>
                                <ChevronLeft size={18} color="#fff" />
                            </button>
                            <button onClick={next} style={{ position:"absolute", right:"-20px", top:"40%", transform:"translateY(-50%)", width:"40px", height:"40px", background:"rgba(255,255,255,0.1)", border:"0.5px solid rgba(184,150,62,0.3)", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer" }}>
                                <ChevronRight size={18} color="#fff" />
                            </button>
                        </div>

                        {/* Mobile/all-device scroll */}
                        <div className="sbar-none" style={{ display:"flex", gap:"16px", overflowX:"auto", paddingBottom:"12px" }}>
                            {videos.map(v => (
                                <div key={v.id} className="vid-card" style={{ flexShrink:0, width:"280px" }}>
                                    <div style={{ position:"relative", overflow:"hidden", aspectRatio:"16/9", background:"#111" }} onClick={() => openVideo(v)}>
                                        <img src={v.thumbnail} alt={v.title} className="vid-thumb" style={{ width:"100%", height:"100%", objectFit:"cover", opacity:0.75 }} />
                                        <div style={{ position:"absolute", inset:0, background:"linear-gradient(to top,rgba(13,34,68,0.7) 0%,transparent 60%)" }} />
                                        <div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center" }}>
                                            <div className="play-btn"><Play size={20} style={{ color:"#fff", fill:"#fff", marginLeft:"3px" }} /></div>
                                        </div>
                                        <div style={{ position:"absolute", top:"8px", right:"8px", background:"rgba(0,0,0,0.7)", color:"#fff", fontSize:"9px", fontWeight:700, padding:"3px 7px", fontFamily:"'Lato',sans-serif" }}>{v.duration}</div>
                                    </div>
                                    <div style={{ padding:"16px" }}>
                                        <h3 className="lan-serif" style={{ fontSize:"14px", fontWeight:700, color: NAVY, margin:"0 0 5px" }}>{v.title}</h3>
                                        <p style={{ fontSize:"11px", color:"#888", lineHeight:1.6, margin:0 }}>{v.description}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* dots */}
                        <div style={{ display:"flex", justifyContent:"center", gap:"8px", marginTop:"28px" }}>
                            {videos.map((_,i) => (
                                <button key={i} onClick={() => setCurrentVideoIndex(i)}
                                    style={{ height:"6px", width: i===currentVideoIndex?"28px":"6px", background: i===currentVideoIndex ? GOLD : "rgba(255,255,255,0.2)", border:"none", cursor:"pointer", transition:"all 0.3s", borderRadius:"999px", padding:0 }} />
                            ))}
                        </div>
                    </div>
                </section>

                {/* ══ HOW IT WORKS ══ */}
                <section id="how-it-works" style={{ background:"#fff", padding:"80px 24px" }}>
                    <div style={{ maxWidth:"1100px", margin:"0 auto" }}>
                        <div style={{ textAlign:"center", marginBottom:"52px" }}>
                            <p style={{ fontSize:"10px", fontWeight:700, letterSpacing:"0.22em", textTransform:"uppercase", color: GOLD, marginBottom:"10px", fontFamily:"'Lato',sans-serif" }}>Simple Process</p>
                            <h2 className="lan-serif" style={{ fontSize:"clamp(28px,4vw,48px)", fontWeight:700, color: NAVY, margin:"0 0 14px" }}>How It Works</h2>
                            <div className="gold-line" style={{ maxWidth:"200px", margin:"0 auto" }}>
                                <div style={{ width:"7px", height:"7px", background: GOLD, transform:"rotate(45deg)", flexShrink:0 }} />
                            </div>
                        </div>

                        <div className="sbar-none" style={{ display:"flex", gap:"2px", overflowX:"auto" }}>
                            {steps.map((step, i) => (
                                <div key={i} style={{ display:"flex", alignItems:"stretch", flex:"1 1 240px", minWidth:"240px" }}>
                                    <div className="step-card" style={{ flex:1, background: CREAM, border:`0.5px solid #e5ddd0` }}>
                                        <div className="lan-serif" style={{ fontSize:"56px", fontWeight:900, color:`rgba(184,150,62,0.2)`, lineHeight:1, marginBottom:"12px" }}>{step.number}</div>
                                        <h3 className="lan-serif" style={{ fontSize:"18px", fontWeight:700, color: NAVY, margin:"0 0 12px", lineHeight:1.25 }}>{step.title}</h3>
                                        <p style={{ fontSize:"13px", color:"#777", lineHeight:1.7, margin:0, fontWeight:300 }}>{step.description}</p>
                                    </div>
                                    {i < steps.length - 1 && (
                                        <div style={{ display:"flex", alignItems:"center", padding:"0 16px", flexShrink:0 }}>
                                            <ArrowRight size={20} style={{ color: GOLD }} />
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ══ BENEFITS ══ */}
                <section className="benefits-bg" style={{ padding:"80px 24px" }}>
                    <div style={{ maxWidth:"1000px", margin:"0 auto" }}>
                        {/* header */}
                        <div style={{ textAlign:"center", marginBottom:"52px" }}>
                            <p style={{ fontSize:"10px", fontWeight:700, letterSpacing:"0.22em", textTransform:"uppercase", color: GOLD, marginBottom:"10px", fontFamily:"'Lato',sans-serif" }}>Our Promise</p>
                            <h2 className="lan-serif" style={{ fontSize:"clamp(28px,4vw,48px)", fontWeight:700, color: NAVY, margin:"0 0 14px" }}>
                                Why Sell on LAN Library?
                            </h2>
                            <div className="gold-line" style={{ maxWidth:"200px", margin:"0 auto 16px" }}>
                                <div style={{ width:"7px", height:"7px", background: GOLD, transform:"rotate(45deg)", flexShrink:0 }} />
                            </div>
                        </div>

                        <div style={{ background:"#fff", border:"0.5px solid #e5ddd0", padding:"48px 40px" }}>
                            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))", gap:"20px" }}>
                                {benefits.map((b,i) => (
                                    <div key={i} style={{ display:"flex", alignItems:"flex-start", gap:"12px" }}>
                                        <div style={{ width:"22px", height:"22px", border:`0.5px solid rgba(22,163,74,0.4)`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, marginTop:"2px" }}>
                                            <CheckCircle size={14} style={{ color:"#16a34a" }} />
                                        </div>
                                        <span style={{ fontSize:"14px", color: NAVY, lineHeight:1.6, fontWeight:400 }}>{b}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                {/* ══ EDUCATOR NOTICE (matches HomeClient) ══ */}
                <section style={{ background:"#fff", borderTop:"1px solid #e5ddd0", borderBottom:"1px solid #e5ddd0", padding:"64px 24px" }}>
                    <div style={{ maxWidth:"1100px", margin:"0 auto", display:"flex", flexWrap:"wrap", gap:"40px", alignItems:"center" }}>
                        {/* crest */}
                        <div style={{ textAlign:"center", flexShrink:0 }}>
                            <div style={{ width:"72px", height:"72px", margin:"0 auto 12px", border:`2px solid ${NAVY}`, transform:"rotate(45deg)", display:"flex", alignItems:"center", justifyContent:"center" }}>
                                <GraduationCap size={28} style={{ color: NAVY, transform:"rotate(-45deg)" }} />
                            </div>
                            <p className="lan-serif" style={{ fontSize:"11px", color:"#bbb", fontStyle:"italic" }}>Est. LAN Library</p>
                        </div>

                        <div style={{ width:"1px", height:"80px", background:"#e5ddd0", flexShrink:0 }} />

                        <div style={{ flex:1, minWidth:"240px" }}>
                            <p style={{ fontSize:"10px", fontWeight:700, letterSpacing:"0.2em", textTransform:"uppercase", color: GOLD, marginBottom:"10px", fontFamily:"'Lato',sans-serif" }}>
                                Notice to All Scholars
                            </p>
                            <h3 className="lan-serif" style={{ fontSize:"clamp(20px,3vw,30px)", fontWeight:700, color: NAVY, margin:"0 0 12px" }}>
                                Ready to Start Earning?
                            </h3>
                            <p style={{ fontSize:"14px", color:"#777", lineHeight:1.75, maxWidth:"520px", fontWeight:300 }}>
                                Join thousands of sellers already making money from their knowledge.
                                Upload once, earn forever — no recurring fees, no hidden charges.
                            </p>
                        </div>

                        <div style={{ display:"flex", flexDirection:"column", gap:"10px", flexShrink:0 }}>
                            <Link href="/become-seller"
                                style={{ display:"flex", alignItems:"center", gap:"8px", padding:"12px 28px", background: NAVY, color:"#fff", fontSize:"13px", fontWeight:700, fontFamily:"'Lato',sans-serif", border:"none", cursor:"pointer", letterSpacing:"0.04em", textDecoration:"none", transition:"background 0.15s" }}
                                onMouseEnter={e => e.currentTarget.style.background="#1a3a6e"}
                                onMouseLeave={e => e.currentTarget.style.background=NAVY}
                            >
                                <Upload size={14} /> Become a Seller
                            </Link>
                            <Link href="/documents"
                                style={{ display:"flex", alignItems:"center", gap:"8px", padding:"12px 28px", border:`0.5px solid ${NAVY}`, color: NAVY, fontSize:"13px", fontWeight:700, fontFamily:"'Lato',sans-serif", textDecoration:"none", letterSpacing:"0.04em", transition:"background 0.15s" }}
                                onMouseEnter={e => e.currentTarget.style.background="rgba(13,34,68,0.05)"}
                                onMouseLeave={e => e.currentTarget.style.background="transparent"}
                            >
                                <BookOpen size={14} /> Browse Library
                            </Link>
                        </div>
                    </div>
                </section>

                {/* ══ CTA BANNER ══ */}
                <section className="cta-bg" style={{ padding:"80px 24px", textAlign:"center" }}>
                    {/* gold star divider */}
                    <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:"16px", marginBottom:"28px" }}>
                        <div style={{ height:"1px", width:"60px", background:"rgba(184,150,62,0.4)" }} />
                        <Star size={14} style={{ color: GOLD, fill: GOLD }} />
                        <div style={{ height:"1px", width:"60px", background:"rgba(184,150,62,0.4)" }} />
                    </div>

                    <h2 className="lan-serif" style={{ fontSize:"clamp(28px,5vw,52px)", fontWeight:700, color:"#fff", margin:"0 0 16px" }}>
                        Your Knowledge Has Value.
                    </h2>
                    <p style={{ fontSize:"15px", color:"rgba(255,255,255,0.5)", maxWidth:"500px", margin:"0 auto 40px", lineHeight:1.75, fontWeight:300 }}>
                        Join over 1,000 active sellers and reach 2.4 million learners across Nigeria and beyond.
                    </p>

                    <div style={{ display:"flex", flexWrap:"wrap", gap:"14px", justifyContent:"center" }}>
                        <Link href="/become-seller"
                            style={{ display:"inline-flex", alignItems:"center", gap:"8px", padding:"14px 28px", background: GOLD, color: NAVY, fontSize:"13px", fontWeight:700, textDecoration:"none", fontFamily:"'Lato',sans-serif", letterSpacing:"0.04em", transition:"background 0.18s" }}
                            onMouseEnter={e => e.currentTarget.style.background=GOLDD}
                            onMouseLeave={e => e.currentTarget.style.background=GOLD}
                        >
                            <Upload size={14} /> Become a Seller
                        </Link>
                        <Link href="/documents"
                            style={{ display:"inline-flex", alignItems:"center", gap:"8px", padding:"14px 28px", border:"0.5px solid rgba(255,255,255,0.2)", color: CREAM, fontSize:"13px", fontWeight:700, textDecoration:"none", fontFamily:"'Lato',sans-serif", letterSpacing:"0.04em", transition:"background 0.18s" }}
                            onMouseEnter={e => e.currentTarget.style.background="rgba(255,255,255,0.07)"}
                            onMouseLeave={e => e.currentTarget.style.background="transparent"}
                        >
                            <BookOpen size={14} /> Browse Library
                        </Link>
                    </div>
                </section>

                {/* ══ FOOTER ══ */}
                <footer style={{ background:"#fff", borderTop:"0.5px solid #e5ddd0", padding:"24px", textAlign:"center" }}>
                    <p style={{ fontSize:"12px", color:"#bbb", fontFamily:"'Lato',sans-serif" }}>
                        © {currentYear} [LAN Library] Learning Access Network. All rights reserved.
                    </p>
                </footer>
            </div>

            {/* ══ VIDEO MODAL ══ */}
            {showModal && selected && (
                <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.95)", zIndex:100, display:"flex", alignItems:"center", justifyContent:"center" }}>
                    <button onClick={closeVideo}
                        style={{ position:"absolute", top:"20px", right:"20px", width:"44px", height:"44px", background:"rgba(255,255,255,0.1)", border:"0.5px solid rgba(184,150,62,0.3)", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", transition:"background 0.18s", zIndex:110 }}
                        onMouseEnter={e => e.currentTarget.style.background="rgba(255,255,255,0.2)"}
                        onMouseLeave={e => e.currentTarget.style.background="rgba(255,255,255,0.1)"}
                    >
                        <X size={18} color="#fff" />
                    </button>
                    <div style={{ position:"absolute", top:"20px", left:"20px", background:"rgba(0,0,0,0.6)", backdropFilter:"blur(8px)", padding:"8px 16px", border:"0.5px solid rgba(184,150,62,0.2)" }}>
                        <p className="lan-serif" style={{ fontSize:"14px", color:"#fff", margin:0 }}>{selected.title}</p>
                    </div>
                    <div style={{ width:"90%", maxWidth:"1000px", aspectRatio:"16/9" }}>
                        <iframe src={selected.videoUrl} title={selected.title} style={{ width:"100%", height:"100%", border:"none" }} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
                    </div>
                </div>
            )}
        </>
    );
}