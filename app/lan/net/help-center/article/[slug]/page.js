'use client';

import React, { useState } from 'react';
import { ArrowLeft, Clock, Tag, ThumbsUp, MessageCircle, Loader2, Star, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { db } from '@/lib/firebaseConfig';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { articlesP1 } from '../../data/articlesData1';
import { articlesP2 } from '../../data/articlesData2';
import { sellerFeatureArticles } from '../../data/sellerFeatureArticles';
import { updatedCoreArticles } from '../../data/updatedCoreArticles';



const articles = { ...articlesP1, ...articlesP2, ...sellerFeatureArticles,...updatedCoreArticles};

/* ─── colour tokens ─────────────────────────────────────────── */
const NAVY  = "#0d2244";
const GOLD  = "#b8963e";
const GOLDD = "#d4aa5a";
const CREAM = "#f5f0e8";
const BG    = "#f5f1ea";

export default function HelpArticlePage() {
    const params  = useParams();
    const slug    = params?.slug;
    const article = articles[slug];

    const [feedback,     setFeedback]     = useState(null);
    const [feedbackText, setFeedbackText] = useState('');
    const [submitting,   setSubmitting]   = useState(false);

    const handleYes = async () => {
        setFeedback("yes");
        try {
            await addDoc(collection(db, "articleFeedback"), {
                slug: article.slug || slug, title: article.title,
                category: article.category, helpful: true, comment: null,
                createdAt: serverTimestamp(),
            });
        } catch (e) { console.error(e); }
    };

    const handleNoSubmit = async () => {
        setSubmitting(true);
        try {
            await addDoc(collection(db, "articleFeedback"), {
                slug: article.slug || slug, title: article.title,
                category: article.category, helpful: false,
                comment: feedbackText.trim() || null, createdAt: serverTimestamp(),
            });
            setFeedback("submitted");
        } catch (e) { console.error(e); }
        finally { setSubmitting(false); }
    };

    const renderContent = (item, index) => {
        switch (item.type) {
            case 'intro':
                return <p key={index} className="art-intro">{item.text}</p>;
            case 'heading':
                return <h2 key={index} className="lan-serif art-heading">{item.text}</h2>;
            case 'paragraph':
                return <p key={index} className="art-para">{item.text}</p>;
            case 'list':
                return (
                    <ul key={index} className="art-list">
                        {item.items.map((li, i) => (
                            <li key={i}>
                                <span style={{ width:"6px", height:"6px", background: GOLD, borderRadius:"50%", display:"inline-block", flexShrink:0, marginTop:"7px" }} />
                                {li}
                            </li>
                        ))}
                    </ul>
                );
            case 'steps':
                return (
                    <ol key={index} className="art-steps">
                        {item.items.map((step, i) => (
                            <li key={i}>
                                <span className="step-num">{String(i+1).padStart(2,'0')}</span>
                                <span>{step}</span>
                            </li>
                        ))}
                    </ol>
                );
            case 'note':
                return (
                    <div key={index} className="art-note">
                        <span style={{ fontSize:"10px", fontWeight:700, letterSpacing:"0.18em", textTransform:"uppercase", color: GOLD, display:"block", marginBottom:"6px", fontFamily:"'Lato',sans-serif" }}>Note</span>
                        <p style={{ margin:0, fontSize:"14px", lineHeight:1.75, color: NAVY }}>{item.text}</p>
                    </div>
                );
            default: return null;
        }
    };

    /* ── 404 ── */
    if (!article) return (
        <>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400&family=Lato:wght@300;400;700&display=swap');
                .lan-serif { font-family:'Playfair Display',Georgia,serif; }
            `}</style>
            <div style={{ minHeight:"100vh", background: BG, display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'Lato',sans-serif", padding:"24px" }}>
                <div style={{ textAlign:"center" }}>
                    <div className="lan-serif" style={{ fontSize:"80px", fontWeight:900, color:"#e5ddd0", lineHeight:1 }}>404</div>
                    <h1 className="lan-serif" style={{ fontSize:"28px", color: NAVY, margin:"16px 0 10px" }}>Article Not Found</h1>
                    <p style={{ fontSize:"14px", color:"#888", marginBottom:"28px" }}>This article doesn't exist or has been moved.</p>
                    <Link href="/lan/net/help-center"
                        style={{ display:"inline-flex", alignItems:"center", gap:"8px", padding:"12px 24px", background: NAVY, color:"#fff", fontSize:"13px", fontWeight:700, textDecoration:"none", letterSpacing:"0.04em" }}>
                        <ArrowLeft size={14} /> Back to Help Center
                    </Link>
                </div>
            </div>
        </>
    );

    return (
        <>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400&family=Lato:wght@300;400;700&display=swap');
                .ha-root  { font-family:'Lato',sans-serif; background:${BG}; }
                .lan-serif { font-family:'Playfair Display',Georgia,serif; }

                /* header */
                .ha-header {
                    background-color:${NAVY};
                    background-image:
                        radial-gradient(rgba(184,150,62,0.06) 1px,transparent 1px),
                        radial-gradient(rgba(255,255,255,0.03) 1px,transparent 1px);
                    background-size:28px 28px,14px 14px;
                    background-position:0 0,7px 7px;
                }

                /* breadcrumb */
                .breadcrumb { background:#fff; border-bottom:0.5px solid #e5ddd0; padding:12px 24px; font-size:12px; color:#888; }
                .breadcrumb a { color:${NAVY}; text-decoration:none; font-weight:700; }
                .breadcrumb a:hover { color:${GOLD}; }

                /* article content */
                .art-intro  { font-size:17px; color:${NAVY}; font-weight:700; line-height:1.75; margin:0 0 28px; font-family:'Playfair Display',serif; font-style:italic; }
                .art-heading { font-size:22px; font-weight:700; color:${NAVY}; margin:44px 0 14px; padding-top:16px; border-top:0.5px solid #e5ddd0; }
                .art-para   { font-size:15px; color:#555; line-height:1.85; margin:0 0 20px; font-weight:300; }
                .art-list   { list-style:none; padding:0; margin:0 0 20px; display:flex; flex-direction:column; gap:10px; }
                .art-list li { display:flex; align-items:flex-start; gap:10px; font-size:14px; color:#555; line-height:1.7; font-weight:300; }
                .art-steps  { list-style:none; padding:0; margin:0 0 20px; display:flex; flex-direction:column; gap:12px; }
                .art-steps li { display:flex; align-items:flex-start; gap:14px; font-size:14px; color:#555; line-height:1.7; }
                .step-num   { font-family:'Playfair Display',serif; font-size:11px; font-weight:700; color:${GOLD}; background:rgba(184,150,62,0.1); border:0.5px solid rgba(184,150,62,0.3); padding:3px 8px; flex-shrink:0; margin-top:2px; }
                .art-note   { background:${CREAM}; border-left:3px solid ${GOLD}; padding:16px 20px; margin:0 0 20px; }

                /* related card */
                .related-card { padding:20px; border:0.5px solid #e5ddd0; background:#fff; text-decoration:none; display:block; transition:transform 0.22s,border-color 0.22s,box-shadow 0.22s; }
                .related-card:hover { transform:translateY(-4px); border-color:${GOLD}; box-shadow:0 12px 32px rgba(13,34,68,0.1); }

                /* feedback */
                .fb-yes  { display:flex; align-items:center; gap:8px; padding:11px 24px; border:0.5px solid #16a34a; color:#16a34a; background:#fff; font-family:'Lato',sans-serif; font-size:13px; font-weight:700; cursor:pointer; letter-spacing:0.04em; transition:background 0.15s; }
                .fb-yes:hover { background:#f0fdf4; }
                .fb-no   { display:flex; align-items:center; gap:8px; padding:11px 24px; border:0.5px solid #e5ddd0; color:#888; background:#fff; font-family:'Lato',sans-serif; font-size:13px; font-weight:700; cursor:pointer; letter-spacing:0.04em; transition:background 0.15s; }
                .fb-no:hover { background:${CREAM}; color:${NAVY}; border-color:${NAVY}; }

                /* gold line */
                .gold-line { display:flex; align-items:center; gap:14px; }
                .gold-line::before,.gold-line::after { content:""; flex:1; height:1px; background:rgba(184,150,62,0.3); }

                @keyframes slideUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
                .anim-up { animation:slideUp 0.5s cubic-bezier(.4,0,.2,1) both; }
            `}</style>

            <div className="ha-root" style={{ minHeight:"100vh" }}>

                {/* ══ HEADER ══ */}
                <header className="ha-header" style={{ padding:"0 24px" }}>
                    <div style={{ maxWidth:"1100px", margin:"0 auto", padding:"18px 0", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                        <Link href="/lan/net/help-center"
                            style={{ display:"inline-flex", alignItems:"center", gap:"8px", fontSize:"12px", fontWeight:700, letterSpacing:"0.06em", textTransform:"uppercase", color: GOLD, textDecoration:"none", transition:"color 0.15s" }}
                            onMouseEnter={e => e.currentTarget.style.color="#fff"}
                            onMouseLeave={e => e.currentTarget.style.color=GOLD}
                        >
                            <ArrowLeft size={15} /> Back to Help Center
                        </Link>
                        <Link href="/home" style={{ textDecoration:"none" }}>
                            <span className="lan-serif" style={{ fontSize:"18px", fontWeight:900, color:"#fff" }}>[LAN Library]</span>
                        </Link>
                    </div>
                </header>

                {/* ══ BREADCRUMB ══ */}
                <div className="breadcrumb">
                    <div style={{ maxWidth:"1100px", margin:"0 auto", display:"flex", alignItems:"center", gap:"8px" }}>
                        <a href="/home">Home</a>
                        <span style={{ color:"#ccc" }}>›</span>
                        <a href="/lan/net/help-center">Help Center</a>
                        <span style={{ color:"#ccc" }}>›</span>
                        <span style={{ color: GOLD, fontWeight:700 }}>{article.category}</span>
                    </div>
                </div>

                {/* ══ MAIN ══ */}
                  <main
                    style={{
                      maxWidth:"1100px",
                      margin:"0 auto",
                      padding:"56px 24px",
                      display:"grid",
                      gridTemplateColumns:"1fr", // ✅ mobile default
                      gap:"56px",
                      alignItems:"start"
                    }}
                    className="md:grid-cols-[1fr_280px]"
>
                    {/* ── Article body ── */}
                    <article>
                        {/* article header */}
                        <div className="anim-up" style={{ marginBottom:"36px" }}>
                            <div style={{ display:"flex", flexWrap:"wrap", alignItems:"center", gap:"10px", marginBottom:"16px" }}>
                                <span style={{ background: NAVY, color:"#fff", fontSize:"10px", fontWeight:700, letterSpacing:"0.1em", textTransform:"uppercase", padding:"4px 12px", fontFamily:"'Lato',sans-serif" }}>
                                    {article.category}
                                </span>
                                <div style={{ display:"flex", alignItems:"center", gap:"6px", fontSize:"12px", color:"#aaa" }}>
                                    <Clock size={13} />
                                    <span>{article.readTime}</span>
                                </div>
                                <span style={{ fontSize:"12px", color:"#aaa" }}>· Updated: {article.lastUpdated}</span>
                            </div>

                            <h1 className="lan-serif" style={{ fontSize:"clamp(28px,4vw,46px)", fontWeight:700, color: NAVY, margin:"0 0 20px", lineHeight:1.1 }}>
                                {article.title}
                            </h1>

                            {/* gold divider */}
                            <div style={{ height:"3px", width:"48px", background: GOLD, marginBottom:"20px" }} />

                            {/* tags */}
                            <div style={{ display:"flex", flexWrap:"wrap", gap:"7px", alignItems:"center" }}>
                                <Tag size={13} style={{ color:"#ccc" }} />
                                {article.tags.map((tag, i) => (
                                    <span key={i} style={{ fontSize:"11px", background: CREAM, border:`0.5px solid rgba(184,150,62,0.25)`, color: GOLD, padding:"3px 10px", fontFamily:"'Lato',sans-serif", fontWeight:700, letterSpacing:"0.06em" }}>
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        </div>

                        {/* content */}
                        <div style={{ background:"#fff", border:"0.5px solid #e5ddd0", padding:"36px 32px" }}>
                            {article.content.map((item, i) => renderContent(item, i))}
                        </div>

                        {/* related articles */}
                        {article.relatedArticles?.length > 0 && (
                            <div style={{ marginTop:"48px" }}>
                                <p style={{ fontSize:"10px", fontWeight:700, letterSpacing:"0.22em", textTransform:"uppercase", color: GOLD, marginBottom:"10px", fontFamily:"'Lato',sans-serif" }}>Read Next</p>
                                <h3 className="lan-serif" style={{ fontSize:"22px", fontWeight:700, color: NAVY, margin:"0 0 24px" }}>Related Articles</h3>
                                <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))", gap:"14px" }}>
                                    {article.relatedArticles.slice(0,3).map((rel, i) => (
                                        <Link key={i} href={`/lan/net/help-center/article/${rel.slug}`} className="related-card">
                                            <span style={{ display:"inline-flex", alignItems:"center", gap:"5px", fontSize:"10px", color:"#aaa", marginBottom:"8px" }}>
                                                <Clock size={10} /> {rel.readTime || "3"} min read
                                            </span>
                                            <h4 className="lan-serif" style={{ fontSize:"14px", fontWeight:700, color: NAVY, margin:"0 0 10px", lineHeight:1.3 }}>{rel.title}</h4>
                                            <span style={{ fontSize:"11px", color: GOLD, fontWeight:700, letterSpacing:"0.06em", display:"flex", alignItems:"center", gap:"4px" }}>
                                                Read more <ArrowRight size={11} />
                                            </span>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* feedback */}
                        <div style={{ marginTop:"48px", background:"#fff", border:"0.5px solid #e5ddd0", padding:"36px 32px", textAlign:"center" }}>
                            <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:"16px", marginBottom:"20px" }}>
                                <div style={{ height:"1px", width:"40px", background:"rgba(184,150,62,0.3)" }} />
                                <Star size={12} style={{ color: GOLD, fill: GOLD }} />
                                <div style={{ height:"1px", width:"40px", background:"rgba(184,150,62,0.3)" }} />
                            </div>

                            <p style={{ fontSize:"10px", fontWeight:700, letterSpacing:"0.2em", textTransform:"uppercase", color: GOLD, marginBottom:"8px", fontFamily:"'Lato',sans-serif" }}>Feedback</p>
                            <h3 className="lan-serif" style={{ fontSize:"22px", fontWeight:700, color: NAVY, margin:"0 0 6px" }}>Was this article helpful?</h3>
                            <p style={{ fontSize:"13px", color:"#aaa", marginBottom:"24px" }}>Let us know so we can keep improving</p>

                            {feedback === null && (
                                <div style={{ display:"flex", justifyContent:"center", gap:"12px", flexWrap:"wrap" }}>
                                    <button className="fb-yes" onClick={handleYes}>
                                        <ThumbsUp size={14} /> Yes, it helped
                                    </button>
                                    <button className="fb-no" onClick={() => setFeedback("no")}>
                                        <MessageCircle size={14} /> No, I need more help
                                    </button>
                                </div>
                            )}

                            {feedback === "yes" && (
                                <div style={{ display:"inline-block", background:"#f0fdf4", border:"0.5px solid #bbf7d0", padding:"20px 32px" }}>
                                    <p style={{ fontWeight:700, color:"#15803d", margin:"0 0 4px" }}>Thanks for your feedback!</p>
                                    <p style={{ fontSize:"13px", color:"#16a34a", margin:0 }}>We're glad this article was helpful.</p>
                                    <button onClick={() => setFeedback(null)} style={{ fontSize:"11px", color:"#aaa", background:"none", border:"none", cursor:"pointer", marginTop:"10px", textDecoration:"underline" }}>Change response</button>
                                </div>
                            )}

                            {feedback === "no" && (
                                <div style={{ maxWidth:"420px", margin:"0 auto", background: CREAM, border:"0.5px solid #e5ddd0", padding:"24px 28px", textAlign:"left" }}>
                                    <p className="lan-serif" style={{ fontWeight:700, color: NAVY, textAlign:"center", marginBottom:"4px", fontSize:"16px" }}>Sorry to hear that</p>
                                    <p style={{ fontSize:"13px", color:"#888", textAlign:"center", marginBottom:"16px" }}>Tell us what was missing — we read every response.</p>
                                    <textarea
                                        value={feedbackText}
                                        onChange={e => setFeedbackText(e.target.value)}
                                        rows={3}
                                        placeholder="What could we explain better? (optional)"
                                        style={{ width:"100%", padding:"12px", border:"0.5px solid #e5ddd0", fontFamily:"'Lato',sans-serif", fontSize:"13px", color: NAVY, background:"#fff", outline:"none", resize:"none", boxSizing:"border-box" }}
                                    />
                                    <button
                                        onClick={handleNoSubmit}
                                        disabled={submitting}
                                        style={{ width:"100%", marginTop:"12px", padding:"12px", background: NAVY, color:"#fff", border:"none", fontFamily:"'Lato',sans-serif", fontSize:"13px", fontWeight:700, letterSpacing:"0.06em", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:"8px", opacity: submitting ? 0.6 : 1 }}
                                    >
                                        {submitting ? <><Loader2 size={14} style={{ animation:"spin 0.7s linear infinite" }} /> Sending…</> : "Send Feedback"}
                                    </button>
                                    <button onClick={() => setFeedback(null)} style={{ fontSize:"11px", color:"#aaa", background:"none", border:"none", cursor:"pointer", marginTop:"10px", textDecoration:"underline", display:"block", margin:"10px auto 0" }}>Change response</button>
                                </div>
                            )}

                            {feedback === "submitted" && (
                                <div style={{ display:"inline-block", background:"#f0fdf4", border:"0.5px solid #bbf7d0", padding:"20px 32px" }}>
                                    <p style={{ fontWeight:700, color:"#15803d", margin:"0 0 4px" }}>Feedback received</p>
                                    <p style={{ fontSize:"13px", color:"#16a34a", margin:0 }}>Our team will use this to improve the article.</p>
                                </div>
                            )}

                            <p style={{ fontSize:"13px", color:"#aaa", marginTop:"20px" }}>
                                Still need help?{" "}
                                <Link href="/contact/lan/4/enquiry" style={{ color: GOLD, textDecoration:"none", fontWeight:700 }}>
                                    Contact our support team
                                </Link>
                            </p>
                        </div>
                    </article>

                    {/* ── Sidebar ── */}
                        <aside className="hidden md:block" style={{ position:"sticky", top:"32px" }}>                        {/* article info card */}
                        <div style={{ background:"#fff", border:"0.5px solid #e5ddd0", marginBottom:"20px" }}>
                            <div style={{ background: NAVY, padding:"14px 18px" }}>
                                <p style={{ fontSize:"10px", fontWeight:700, letterSpacing:"0.18em", textTransform:"uppercase", color: GOLD, margin:0, fontFamily:"'Lato',sans-serif" }}>
                                    Article Info
                                </p>
                            </div>
                            <div style={{ padding:"18px" }}>
                                {[
                                    { label:"Category",     value: article.category },
                                    { label:"Read time",    value: article.readTime },
                                    { label:"Last updated", value: article.lastUpdated },
                                ].map(({ label, value }) => (
                                    <div key={label} style={{ padding:"10px 0", borderBottom:"0.5px solid #f0ebe0", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                                        <span style={{ fontSize:"11px", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.08em", color:"#bbb", fontFamily:"'Lato',sans-serif" }}>{label}</span>
                                        <span className="lan-serif" style={{ fontSize:"12px", fontWeight:700, color: NAVY }}>{value}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* help card */}
                        <div style={{ background: CREAM, border:"0.5px solid #e5ddd0", padding:"24px 20px", textAlign:"center" }}>
                            <div style={{ width:"44px", height:"44px", border:`2px solid ${NAVY}`, transform:"rotate(45deg)", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 14px" }}>
                                <MessageCircle size={18} style={{ color: NAVY, transform:"rotate(-45deg)" }} />
                            </div>
                            <p className="lan-serif" style={{ fontSize:"15px", fontWeight:700, color: NAVY, margin:"0 0 8px" }}>Need more help?</p>
                            <p style={{ fontSize:"12px", color:"#888", lineHeight:1.65, margin:"0 0 16px", fontWeight:300 }}>
                                Our support team responds within 24 hours.
                            </p>
                            <Link href="/contact/lan/4/enquiry"
                                style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:"6px", padding:"11px", background: NAVY, color:"#fff", fontSize:"12px", fontWeight:700, fontFamily:"'Lato',sans-serif", letterSpacing:"0.06em", textDecoration:"none", transition:"background 0.15s" }}
                                onMouseEnter={e => e.currentTarget.style.background="#1a3a6e"}
                                onMouseLeave={e => e.currentTarget.style.background=NAVY}
                            >
                                Contact Support
                            </Link>
                        </div>
                    </aside>
                </main>

                {/* ══ FOOTER ══ */}
                <footer style={{ background: NAVY, padding:"24px", textAlign:"center", borderTop:"0.5px solid rgba(184,150,62,0.15)" }}>
                    <p style={{ fontSize:"12px", color:"rgba(245,240,232,0.4)", fontFamily:"'Lato',sans-serif", margin:0 }}>
                        © {new Date().getFullYear()} Learning Access Network. All rights reserved.
                    </p>
                </footer>
            </div>

            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </>
    );
}