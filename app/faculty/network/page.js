"use client";
import React, { useState } from "react";
import Link from "next/link";

/* ─── colour tokens ─────────────────────────────────────────── */
const INK = "#1a1a2e";
const INK2 = "#16213e";
const TEAL = "#0f7173";
const TEALL = "#14a6a9";
const TEALD = "#0a5557";
const IVORY = "#f9f6f0";
const IVORY2 = "#f2ede4";
const SAGE = "#e8f4f4";
const WARM = "#faf8f4";

/* ═══════════════════════════════════════════════════════════════
   NAV
═══════════════════════════════════════════════════════════════ */
function Nav() {
    const [mobileOpen, setMobileOpen] = useState(false);
    return (
        <nav style={{
            position: "sticky", top: 0, zIndex: 100,
            background: IVORY,
            borderBottom: "2px solid " + INK,
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "0 48px", height: "68px",
        }}>
            <Link href="#" style={{
                fontFamily: "'Cormorant Garamond',serif", fontWeight: 700, fontSize: "22px",
                color: INK, letterSpacing: ".04em", textDecoration: "none",
                display: "flex", alignItems: "center", gap: "10px",
            }}>
                LAN <span style={{ color: TEAL, fontStyle: "italic" }}>Library</span>
            </Link>

            <div style={{ display: "flex", gap: "32px", alignItems: "center" }} className="lan-nav-links">
                {[["#why-join", "Why Join"], ["#benefits", "Benefits"], ["#tiers", "Tiers"], ["#tools", "Tools"], ["#faq", "FAQ"]].map(([href, label]) => (
                    <a key={href} href={href} style={{
                        color: INK, fontSize: "12px", fontWeight: 400,
                        textDecoration: "none", letterSpacing: ".12em", textTransform: "uppercase",
                        transition: "color .2s", fontFamily: "'Montserrat',sans-serif",
                        borderBottom: "1px solid transparent", paddingBottom: "2px",
                    }}
                        onMouseEnter={e => { e.currentTarget.style.color = TEAL; e.currentTarget.style.borderBottomColor = TEAL; }}
                        onMouseLeave={e => { e.currentTarget.style.color = INK; e.currentTarget.style.borderBottomColor = "transparent"; }}
                    >{label}</a>
                ))}
                <Link href="/auth/signup" style={{
                    background: INK, color: IVORY, padding: "11px 26px",
                    fontSize: "11px", fontWeight: 600, letterSpacing: ".12em", textTransform: "uppercase",
                    textDecoration: "none", fontFamily: "'Montserrat',sans-serif", display: "inline-block",
                    transition: "background .18s",
                }}
                    onMouseEnter={e => e.currentTarget.style.background = TEAL}
                    onMouseLeave={e => e.currentTarget.style.background = INK}
                >Join Faculty Network</Link>
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
            background: INK2,
            display: "flex", justifyContent: "center",
            borderBottom: "1px solid rgba(15,113,115,.25)",
            overflowX: "auto",
        }}>
            {tabs.map(t => (
                <button key={t.key} onClick={() => setActive(t.key)} style={{
                    padding: "13px 36px", fontSize: "10px", fontWeight: 600,
                    letterSpacing: ".14em", textTransform: "uppercase",
                    color: active === t.key ? TEALL : "rgba(255,255,255,.35)",
                    border: "none", background: "none",
                    borderBottom: `2px solid ${active === t.key ? TEALL : "transparent"}`,
                    cursor: "pointer", fontFamily: "'Montserrat',sans-serif",
                    transition: "all .2s", whiteSpace: "nowrap",
                }}>{t.label}</button>
            ))}
        </div>
    );
}

/* ═══════════════════════════════════════════════════════════════
   HERO — editorial split with large serif type
═══════════════════════════════════════════════════════════════ */
function Hero() {
    return (
        <section style={{
            background: IVORY,
            minHeight: "90vh",
            display: "flex", alignItems: "stretch",
            position: "relative", overflow: "hidden",
        }}>
            {/* Left panel — ivory text */}
            <div style={{
                flex: "1 1 55%", padding: "80px 60px",
                display: "flex", flexDirection: "column", justifyContent: "center",
                position: "relative", zIndex: 2,
            }} className="lan-hero-left">
                {/* Decorative rule */}
                <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "36px" }}>
                    <div style={{ width: "48px", height: "2px", background: TEAL }} />
                    <span style={{ fontSize: "10px", fontWeight: 600, letterSpacing: ".2em", textTransform: "uppercase", color: TEAL, fontFamily: "'Montserrat',sans-serif" }}>Faculty Network · LAN Library</span>
                </div>

                <h1 style={{
                    fontFamily: "'Cormorant Garamond',serif",
                    fontSize: "clamp(42px,5.5vw,82px)", fontWeight: 700,
                    color: INK, lineHeight: 1.0, letterSpacing: "-.5px", margin: "0 0 28px",
                }}>
                    Your Expertise<br />
                    <span style={{ fontStyle: "italic", color: TEAL }}>Deserves</span><br />
                    an Audience.
                </h1>

                <p style={{
                    fontSize: "17px", color: "rgba(26,26,46,.55)",
                    lineHeight: 1.9, fontWeight: 300, maxWidth: "480px", marginBottom: "40px",
                    fontFamily: "'Montserrat',sans-serif",
                }}>
                    Africa's first platform built exclusively for academics to publish, distribute,
                    and monetise their intellectual work — beyond the walls of any single institution.
                </p>

                <div style={{ display: "flex", gap: "14px", flexWrap: "wrap" }}>
                    <Link href="/auth/signup" style={{
                        padding: "14px 32px", background: TEAL, color: "#fff",
                        fontSize: "11px", fontWeight: 600, letterSpacing: ".12em", textTransform: "uppercase",
                        textDecoration: "none", fontFamily: "'Montserrat',sans-serif", transition: "background .18s",
                    }}
                        onMouseEnter={e => e.currentTarget.style.background = TEALD}
                        onMouseLeave={e => e.currentTarget.style.background = TEAL}
                    >Apply for Faculty Access</Link>
                    <a href="#why-join" style={{
                        padding: "14px 28px", background: "transparent",
                        color: INK, fontSize: "11px", fontWeight: 600,
                        letterSpacing: ".12em", textTransform: "uppercase",
                        border: "1px solid " + INK, textDecoration: "none",
                        fontFamily: "'Montserrat',sans-serif", transition: "all .18s",
                    }}
                        onMouseEnter={e => { e.currentTarget.style.background = INK; e.currentTarget.style.color = IVORY; }}
                        onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = INK; }}
                    >Learn More</a>
                </div>

                {/* Stats row */}
                <div style={{ display: "flex", gap: "36px", flexWrap: "wrap", marginTop: "52px", paddingTop: "36px", borderTop: "1px solid rgba(26,26,46,.1)" }}>
                    {[["3,200+", "Faculty Members"], ["₦180M+", "Paid to Lecturers"], ["58", "Disciplines Covered"]].map(([v, l]) => (
                        <div key={l}>
                            <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: "32px", fontWeight: 700, color: INK }}>{v}</div>
                            <div style={{ fontSize: "9px", fontWeight: 600, letterSpacing: ".14em", textTransform: "uppercase", color: "rgba(15,113,115,.7)", fontFamily: "'Montserrat',sans-serif", marginTop: "2px" }}>{l}</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Right panel — teal with pattern */}
            {/* Right panel — replace emoji with real image */}
            <div style={{
                flex: "0 0 42%", background: INK,
                position: "relative", overflow: "hidden",
                display: "flex", alignItems: "stretch",
            }} className="lan-hero-right">

                {/* Real image filling the panel */}
                <img
                    src="https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=800"
                    alt="Faculty lecturer"
                    style={{
                        position: "absolute", inset: 0,
                        width: "100%", height: "100%",
                        objectFit: "cover",
                        filter: "brightness(0.4) saturate(0.7)",
                    }}
                    onError={e => {
                        e.target.src = "https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=800";
                    }}
                />

                {/* Teal grid pattern on top of image */}
                <div style={{
                    position: "absolute", inset: 0,
                    backgroundImage: `
      linear-gradient(rgba(15,113,115,.15) 1px, transparent 1px),
      linear-gradient(90deg, rgba(15,113,115,.15) 1px, transparent 1px)
    `,
                    backgroundSize: "40px 40px",
                }} />

                {/* Gradient from bottom */}
                <div style={{
                    position: "absolute", inset: 0,
                    background: "linear-gradient(to top, rgba(26,26,46,.95) 0%, rgba(26,26,46,.3) 60%, transparent 100%)",
                }} />

                {/* Text content over image */}
                <div style={{ position: "relative", zIndex: 2, padding: "40px", display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
                    <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: "clamp(28px,3vw,42px)", fontWeight: 700, color: "#fff", lineHeight: 1.2, marginBottom: "20px" }}>
                        Verified<br /><span style={{ color: TEALL, fontStyle: "italic" }}>Faculty</span><br />Badge
                    </div>
                    <div style={{ fontSize: "12px", color: "rgba(255,255,255,.4)", marginBottom: "20px", fontFamily: "'Montserrat',sans-serif", lineHeight: 1.7 }}>
                        Exclusive to confirmed lecturers,<br />professors & academic staff
                    </div>
                    {/* Verification card mock */}
                    <div style={{ background: "rgba(15,113,115,.2)", border: "1px solid rgba(15,113,115,.4)", padding: "16px 20px" }}>
                        <div style={{ fontSize: "9px", fontWeight: 600, letterSpacing: ".16em", textTransform: "uppercase", color: TEALL, marginBottom: "10px", fontFamily: "'Montserrat',sans-serif" }}>✓ Faculty Verified</div>
                        {["Verified name & institution", "Department & course codes", "Trust badge on all listings", "Priority search placement"].map(f => (
                            <div key={f} style={{ fontSize: "11px", color: "rgba(255,255,255,.6)", padding: "5px 0", borderBottom: "1px solid rgba(255,255,255,.06)", fontFamily: "'Montserrat',sans-serif" }}>{f}</div>
                        ))}
                    </div>
                </div>
            </div>

            <style>{`
        @media(max-width:900px){
          .lan-hero-left{ padding: 60px 28px !important; flex: 1 1 100% !important; }
          .lan-hero-right{ display: none !important; }
        }
      `}</style>
        </section>
    );
}

/* ═══════════════════════════════════════════════════════════════
   WHY JOIN — horizontal scroll cards
═══════════════════════════════════════════════════════════════ */
function WhyJoin() {
    const reasons = [
        { num: "01", title: "Your Notes Are Already Written", body: "You spend hours crafting lecture notes, tutorials, and course materials every semester. That work doesn't have to end when the semester does. Every document you've ever created is a potential income stream." },
        { num: "02", title: "Reach Students You'll Never Meet", body: "Your expertise is geographically unlimited on LAN. A lecturer in Kano can earn from students in Lagos, Port Harcourt, or Abuja — from students at 200+ universities who need exactly what you teach." },
        { num: "03", title: "Academic Credibility Drives Sales", body: "Students trust lecturers. A document bearing a Verified Faculty badge converts at 3–4x the rate of anonymous uploads. Your institutional credibility is your strongest commercial asset." },
        { num: "04", title: "Passive Income, Forever", body: "Upload once. Earn indefinitely. Unlike consulting or teaching, a well-tagged document earns for years without any additional effort. Our highest-earning lecturers uploaded most of their catalogue in the first 3 months." },
        { num: "05", title: "Zero Conflict with Your Institution", body: "You own all materials you created. Distributing your own lecture notes and course materials through LAN is entirely within your rights — and thousands of Nigerian lecturers and professors already do it." },
        { num: "06", title: "Build Your Academic Brand", body: "Your LAN Faculty Profile is your public academic storefront — visible to 40,000+ students. It lists your courses, departments, publications, and earnings record. Over time, it becomes a powerful academic reputation asset." },
    ];
    return (
        <section id="why-join" style={{ padding: "88px 0", background: WARM, overflow: "hidden" }}>
            <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "0 48px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "10px" }}>
                    <div style={{ width: "40px", height: "2px", background: TEAL }} />
                    <p style={{ fontSize: "10px", fontWeight: 600, letterSpacing: ".2em", textTransform: "uppercase", color: TEAL, fontFamily: "'Montserrat',sans-serif" }}>Why Faculty Join</p>
                </div>
                <h2 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: "clamp(30px,4vw,52px)", fontWeight: 700, color: INK, lineHeight: 1.1, marginBottom: "52px" }}>
                    Six Reasons Academics <br /><em style={{ color: TEAL }}>Choose LAN</em>
                </h2>
            </div>
            <div style={{ paddingLeft: "48px", display: "grid", gridTemplateColumns: "repeat(3, 340px)", gap: "2px", overflowX: "auto", paddingBottom: "8px" }} className="lan-why-grid">
                {reasons.map((r, i) => (
                    <div key={r.num}
                        style={{
                            background: i % 2 === 0 ? "#fff" : IVORY2,
                            padding: "36px 32px", borderTop: "3px solid transparent",
                            transition: "border-color .2s, transform .2s", cursor: "default", flexShrink: 0,
                        }}
                        onMouseEnter={e => { e.currentTarget.style.borderTopColor = TEAL; e.currentTarget.style.transform = "translateY(-4px)"; }}
                        onMouseLeave={e => { e.currentTarget.style.borderTopColor = "transparent"; e.currentTarget.style.transform = "translateY(0)"; }}
                    >
                        <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: "52px", fontWeight: 700, color: "rgba(15,113,115,.15)", marginBottom: "14px", lineHeight: 1 }}>{r.num}</div>
                        <h3 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: "22px", fontWeight: 700, color: INK, marginBottom: "12px", lineHeight: 1.25 }}>{r.title}</h3>
                        <p style={{ fontSize: "13px", color: "rgba(26,26,46,.55)", lineHeight: 1.85, fontFamily: "'Montserrat',sans-serif" }}>{r.body}</p>
                    </div>
                ))}
            </div>
            <style>{`@media(max-width:900px){ .lan-why-grid{ grid-template-columns: repeat(3,85vw) !important; } }`}</style>
        </section>
    );
}

/* ═══════════════════════════════════════════════════════════════
   HOW IT WORKS
═══════════════════════════════════════════════════════════════ */
function HowItWorks() {
    const steps = [
        { icon: "📋", title: "Apply & Get Verified", body: "Submit your name, institution, department, and staff ID. LAN's faculty verification team cross-checks your credentials within 48 hours. Upon approval, your Verified Faculty badge activates across all your listings." },
        { icon: "📂", title: "Upload Your Course Materials", body: "Upload lecture notes, tutorial questions, course outlines, past exams you set, textbooks you authored, or any academic content you created. Set a price, assign course codes, tag your university and department — and submit." },
        { icon: "🌐", title: "Reach Students Across Africa", body: "Your documents are indexed in LAN's search engine, surfaced in departmental feeds, and featured in course-specific recommendations. Students from 200+ universities browse and purchase materials from verified faculty every day." },
        { icon: "💳", title: "Earn 80% of Every Sale", body: "Eighty percent of every transaction goes directly to your LAN wallet. Sales from students at any institution, any time of day, with no effort from you after upload. Monthly earnings for active faculty sellers average ₦120,000 – ₦400,000." },
        { icon: "🏦", title: "Withdraw Anytime", body: "Your wallet balance is withdrawable to any Nigerian bank account at any time. Minimum ₦1,000. Funds arrive within 24 hours. Faculty sellers at Silver tier and above have zero withdrawal fees." },
    ];
    return (
        <section style={{ background: INK, padding: "88px 48px" }}>
            <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "10px" }}>
                    <div style={{ width: "40px", height: "2px", background: TEAL }} />
                    <p style={{ fontSize: "10px", fontWeight: 600, letterSpacing: ".2em", textTransform: "uppercase", color: TEAL, fontFamily: "'Montserrat',sans-serif" }}>The Process</p>
                </div>
                <h2 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: "clamp(30px,4vw,52px)", fontWeight: 700, color: "#fff", lineHeight: 1.1, marginBottom: "52px", maxWidth: "600px" }}>
                    From Verification to<br /><em style={{ color: TEALL }}>First Withdrawal</em>
                </h2>
                <div style={{ display: "flex", gap: "0", flexDirection: "column" }}>
                    {steps.map((s, i) => (
                        <div key={s.title}
                            style={{
                                display: "flex", gap: "32px", alignItems: "flex-start",
                                padding: "28px 32px", borderLeft: `2px solid ${i < steps.length - 1 ? TEAL : "transparent"}`,
                                marginLeft: "28px", position: "relative",
                                transition: "background .2s",
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = "rgba(15,113,115,.06)"}
                            onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                        >
                            <div style={{
                                position: "absolute", left: "-14px", top: "28px",
                                width: "26px", height: "26px", borderRadius: "50%",
                                background: TEAL, display: "flex", alignItems: "center", justifyContent: "center",
                                fontSize: "12px", flexShrink: 0,
                            }}>{i + 1}</div>
                            <div style={{ fontSize: "28px", marginTop: "2px", flexShrink: 0 }}>{s.icon}</div>
                            <div>
                                <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: "22px", fontWeight: 700, color: "#fff", marginBottom: "8px" }}>{s.title}</div>
                                <div style={{ fontSize: "13px", color: "rgba(249,246,240,.45)", lineHeight: 1.85, fontFamily: "'Montserrat',sans-serif", maxWidth: "600px" }}>{s.body}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

/* ═══════════════════════════════════════════════════════════════
   EARNINGS
═══════════════════════════════════════════════════════════════ */
function Earnings() {
    const streams = [
        { icon: "📄", title: "Lecture Notes & Course Outlines", body: "Your most scalable asset. A well-tagged set of lecture notes for a popular 200-level course at a major Nigerian university can generate hundreds of sales per semester. Upload once, collect indefinitely.", range: "₦800 – ₦3,500 per sale" },
        { icon: "📋", title: "Past Examination Questions", body: "If you set exams for your department, those papers — once they are no longer active — are high-demand items on LAN. Students pay premium prices for lecturers' own past questions because they trust they reflect exam style accurately.", range: "₦500 – ₦2,000 per download" },
        { icon: "📖", title: "Textbooks & Course Readers", body: "Full-length academic texts, departmental readers, and course reference books you have authored or co-authored generate the highest per-unit price on LAN. Faculty-authored textbooks routinely command ₦5,000–₦15,000 per download.", range: "₦5,000 – ₦15,000 per book" },
        { icon: "🎯", title: "High-Value Bounty Fulfilments", body: "Faculty sellers have access to an exclusive tier of high-value Bounty Board requests — requests that only a verified academic can credibly fulfil. These include institution-specific curriculum summaries, course alignment documents, and professional study guides.", range: "₦5,000 – ₦500,000 per bounty" },
    ];
    return (
        <section id="benefits" style={{ background: IVORY2, padding: "88px 48px" }}>
            <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "10px" }}>
                    <div style={{ width: "40px", height: "2px", background: TEAL }} />
                    <p style={{ fontSize: "10px", fontWeight: 600, letterSpacing: ".2em", textTransform: "uppercase", color: TEAL, fontFamily: "'Montserrat',sans-serif" }}>Income Streams</p>
                </div>
                <h2 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: "clamp(30px,4vw,52px)", fontWeight: 700, color: INK, lineHeight: 1.1, marginBottom: "52px" }}>
                    How Faculty Members<br /><em style={{ color: TEAL }}>Earn on LAN</em>
                </h2>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }} className="lan-earn-grid">
                    {streams.map(s => (
                        <div key={s.title}
                            style={{
                                background: "#fff", padding: "32px", borderLeft: "3px solid transparent",
                                transition: "border-color .2s, box-shadow .2s", cursor: "default",
                            }}
                            onMouseEnter={e => { e.currentTarget.style.borderLeftColor = TEAL; e.currentTarget.style.boxShadow = "0 8px 32px rgba(15,113,115,.08)"; }}
                            onMouseLeave={e => { e.currentTarget.style.borderLeftColor = "transparent"; e.currentTarget.style.boxShadow = "none"; }}
                        >
                            <div style={{ fontSize: "32px", marginBottom: "16px" }}>{s.icon}</div>
                            <h3 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: "22px", fontWeight: 700, color: INK, marginBottom: "10px" }}>{s.title}</h3>
                            <p style={{ fontSize: "13px", color: "rgba(26,26,46,.55)", lineHeight: 1.85, marginBottom: "18px", fontFamily: "'Montserrat',sans-serif" }}>{s.body}</p>
                            <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: SAGE, padding: "8px 16px", fontSize: "12px", fontWeight: 600, color: TEALD, fontFamily: "'Montserrat',sans-serif", letterSpacing: ".04em" }}>
                                📈 {s.range}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Revenue calculator */}
                <div style={{ marginTop: "32px", background: INK, padding: "36px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "36px", alignItems: "center" }} className="lan-calc-grid">
                    <div>
                        <div style={{ fontSize: "10px", fontWeight: 600, letterSpacing: ".16em", textTransform: "uppercase", color: "rgba(15,113,115,.7)", marginBottom: "12px", fontFamily: "'Montserrat',sans-serif" }}>Monthly Revenue Example</div>
                        {[
                            { label: "20 lecture note sales @ ₦2,000", val: "₦32,000" },
                            { label: "LAN fee (20%)", val: "– ₦6,400", red: true },
                            { label: "Net from notes", val: "₦25,600", green: true },
                            { label: "2 past exam paper sales (10 units each) @ ₦1,000", val: "₦16,000", green: true },
                            { label: "1 bounty fulfilment @ ₦30,000", val: "₦24,000", green: true },
                        ].map(r => (
                            <div key={r.label} style={{ display: "flex", justifyContent: "space-between", padding: "9px 0", borderBottom: "1px solid rgba(255,255,255,.05)", fontSize: "12px", fontFamily: "'Montserrat',sans-serif" }}>
                                <span style={{ color: "rgba(249,246,240,.5)" }}>{r.label}</span>
                                <span style={{ fontWeight: 600, color: r.red ? "#f87171" : r.green ? "#86efac" : "#fff" }}>{r.val}</span>
                            </div>
                        ))}
                        <div style={{ height: "1px", background: TEAL, margin: "14px 0" }} />
                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                            <span style={{ color: "#fff", fontWeight: 600, fontFamily: "'Montserrat',sans-serif", fontSize: "13px" }}>Monthly Total</span>
                            <span style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: "28px", fontWeight: 700, color: TEALL }}>₦65,600</span>
                        </div>
                    </div>
                    <div>
                        <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: "clamp(28px,3vw,44px)", fontWeight: 700, color: "#fff", lineHeight: 1.2, marginBottom: "16px" }}>
                            Top Faculty Earn<br /><span style={{ color: TEALL, fontStyle: "italic" }}>₦400,000+</span><br />Per Month
                        </div>
                        <p style={{ fontSize: "13px", color: "rgba(249,246,240,.45)", lineHeight: 1.85, fontFamily: "'Montserrat',sans-serif" }}>
                            Lecturers with catalogues of 50+ documents across multiple courses and cohorts build compounding passive income that grows each semester without additional uploads.
                        </p>
                    </div>
                </div>
            </div>
            <style>{`
        @media(max-width:768px){ .lan-earn-grid{ grid-template-columns:1fr !important; } .lan-calc-grid{ grid-template-columns:1fr !important; } }
      `}</style>
        </section>
    );
}

/* ═══════════════════════════════════════════════════════════════
   TIERS
═══════════════════════════════════════════════════════════════ */
function Tiers() {
    const tiers = [
        {
            icon: "🥉", name: "Associate Faculty", color: "#cd7f32",
            range: "₦0 – ₦9,999 total earnings",
            features: ["Verified Faculty badge", "Upload up to 30 documents", "Standard search placement", "Basic analytics dashboard", "Community forum access", "Email support"],
        },
        {
            icon: "🥈", name: "Senior Faculty", color: "#94a3b8",
            range: "₦10,000 – ₦49,999 total earnings",
            features: ["All Associate benefits", "Upload up to 150 documents", "Boosted search placement", "Bounty Board access (up to ₦20k)", "Priority review (12hr)", "Sales trend analytics"],
        },
        {
            icon: "🏆", name: "Distinguished Faculty", color: TEALL, featured: true,
            range: "₦50,000 – ₦149,999 total earnings",
            features: ["All Senior benefits", "Unlimited uploads", "Top-tier search placement", "High-value bounties (up to ₦200k)", "Homepage featured faculty slot", "Personal analytics suite", "Same-day payouts", "Dedicated support line"],
        },
        {
            icon: "⭐", name: "Emeritus Faculty", color: "#fbbf24", dark: true,
            range: "₦150,000+ total earnings",
            features: ["Everything in Distinguished", "Permanent top-of-search", "Named account manager", "Instant withdrawals, no limit", "Exclusive ₦500k+ bounties", "Co-branded faculty page", "LAN Academic Advisory Board invite", "Annual faculty summit access"],
        },
    ];

    return (
        <section id="tiers" style={{ background: WARM, padding: "88px 48px" }}>
            <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "10px" }}>
                    <div style={{ width: "40px", height: "2px", background: TEAL }} />
                    <p style={{ fontSize: "10px", fontWeight: 600, letterSpacing: ".2em", textTransform: "uppercase", color: TEAL, fontFamily: "'Montserrat',sans-serif" }}>Faculty Tiers</p>
                </div>
                <h2 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: "clamp(30px,4vw,52px)", fontWeight: 700, color: INK, lineHeight: 1.1, marginBottom: "52px" }}>
                    Your Academic <em style={{ color: TEAL }}>Rank on LAN</em>
                </h2>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(230px,1fr))", gap: "16px" }}>
                    {tiers.map(t => (
                        <div key={t.name} style={{
                            background: t.dark ? INK : "#fff",
                            border: t.featured ? `2px solid ${TEAL}` : "1px solid #e0d8cd",
                            padding: "32px 24px", position: "relative", overflow: "hidden",
                            transition: "transform .22s, box-shadow .22s",
                        }}
                            onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-6px)"; e.currentTarget.style.boxShadow = "0 16px 48px rgba(15,113,115,.1)"; }}
                            onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; }}
                        >
                            {t.featured && <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "3px", background: `linear-gradient(90deg, ${TEAL}, ${TEALL})` }} />}
                            <div style={{ fontSize: "36px", marginBottom: "12px" }}>{t.icon}</div>
                            <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: "22px", fontWeight: 700, color: t.color, marginBottom: "6px" }}>{t.name}</div>
                            <div style={{ fontSize: "10px", fontWeight: 600, letterSpacing: ".08em", color: t.dark ? "rgba(249,246,240,.35)" : "#aaa", marginBottom: "20px", fontFamily: "'Montserrat',sans-serif" }}>{t.range}</div>
                            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                                {t.features.map(f => (
                                    <li key={f} style={{ fontSize: "12px", color: t.dark ? "rgba(249,246,240,.65)" : "#555", padding: "7px 0", borderBottom: `1px solid ${t.dark ? "rgba(255,255,255,.07)" : "#f0ebe3"}`, display: "flex", alignItems: "flex-start", gap: "8px", fontFamily: "'Montserrat',sans-serif" }}>
                                        <span style={{ color: TEAL, fontWeight: 700, flexShrink: 0, marginTop: "1px" }}>✓</span>{f}
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
   TOOLS
═══════════════════════════════════════════════════════════════ */
function Tools() {
    const tools = [
        { icon: "📊", title: "Faculty Analytics Suite", body: "See which of your documents generate the most revenue, which courses are trending, and which institutions are buying your materials. Monthly reports and live dashboards included." },
        { icon: "🏅", title: "Verified Faculty Badge", body: "Displayed on every listing, your profile page, and search results. Trust converts to sales — verified faculty documents sell at 3–4x the rate of unverified uploads." },
        { icon: "🎯", title: "Exclusive Bounty Access", body: "Faculty sellers unlock high-value bounties that ordinary sellers cannot access. These are typically institution-specific or discipline-specific requests that require academic credibility." },
        { icon: "🌍", title: "Cross-Institution Distribution", body: "Your materials are automatically surfaced to students studying the same courses at any of the 200+ covered institutions — not just your own university. One upload, continental reach." },
        { icon: "🛡️", title: "IP Protection & DRM", body: "All faculty materials carry professional DRM and watermarking. Your documents cannot be redistributed. Your copyright is protected, and LAN enforces takedowns on your behalf." },
        { icon: "📞", title: "Dedicated Faculty Support", body: "A named academic liaison is available for Distinguished and Emeritus faculty. For all faculty, priority email and chat support resolves issues within 4 business hours." },
    ];
    return (
        <section id="tools" style={{ background: INK2, padding: "88px 48px" }}>
            <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "10px" }}>
                    <div style={{ width: "40px", height: "2px", background: TEAL }} />
                    <p style={{ fontSize: "10px", fontWeight: 600, letterSpacing: ".2em", textTransform: "uppercase", color: TEAL, fontFamily: "'Montserrat',sans-serif" }}>Faculty Toolkit</p>
                </div>
                <h2 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: "clamp(30px,4vw,52px)", fontWeight: 700, color: "#fff", lineHeight: 1.1, marginBottom: "52px" }}>
                    Built for the<br /><em style={{ color: TEALL }}>Academic Professional</em>
                </h2>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: "1px", background: "rgba(15,113,115,.12)" }}>
                    {tools.map((t, i) => (
                        <div key={t.title}
                            style={{
                                background: INK2, padding: "32px",
                                transition: "background .18s",
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = "rgba(15,113,115,.1)"}
                            onMouseLeave={e => e.currentTarget.style.background = INK2}
                        >
                            <div style={{ fontSize: "28px", marginBottom: "14px" }}>{t.icon}</div>
                            <div style={{ fontSize: "16px", fontWeight: 600, color: "#fff", marginBottom: "10px", fontFamily: "'Cormorant Garamond',serif", fontSize: "20px" }}>{t.title}</div>
                            <div style={{ fontSize: "12px", color: "rgba(249,246,240,.45)", lineHeight: 1.8, fontFamily: "'Montserrat',sans-serif" }}>{t.body}</div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

/* ═══════════════════════════════════════════════════════════════
   TESTIMONIALS
═══════════════════════════════════════════════════════════════ */
function Testimonials() {
    const quotes = [
        { q: "I put my 400-level Finance lecture notes on LAN in January. By May I had earned ₦240,000. I don't even know most of the students who bought them. That is what reach means.", name: "Dr. Chukwuemeka A.", meta: "Senior Lecturer · Finance · UNILAG", initials: "CA", earnings: "₦240k" },
        { q: "As a professor, I was already writing detailed reading summaries for my graduate students. Now those same summaries earn me ₦80,000 to ₦100,000 a month. It's income I never even imagined.", name: "Prof. Ngozi E.", meta: "Associate Professor · Law · UI", initials: "NE", earnings: "₦90k avg" },
        { q: "The Verified Faculty badge is a genuine competitive advantage. My documents sell 4x faster than similar documents from unverified sellers. Credibility is currency on LAN.", name: "Mr. Babatunde F.", meta: "Lecturer II · Engineering · FUTA", initials: "BF", earnings: "₦155k" },
    ];
    return (
        <section style={{ background: IVORY, padding: "88px 48px" }}>
            <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "10px" }}>
                    <div style={{ width: "40px", height: "2px", background: TEAL }} />
                    <p style={{ fontSize: "10px", fontWeight: 600, letterSpacing: ".2em", textTransform: "uppercase", color: TEAL, fontFamily: "'Montserrat',sans-serif" }}>Faculty Voices</p>
                </div>
                <h2 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: "clamp(30px,4vw,52px)", fontWeight: 700, color: INK, lineHeight: 1.1, marginBottom: "52px" }}>
                    What Academic Professionals <em style={{ color: TEAL }}>Say</em>
                </h2>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))", gap: "20px" }}>
                    {quotes.map(q => (
                        <div key={q.name} style={{ background: "#fff", borderTop: `3px solid ${TEAL}`, padding: "28px", position: "relative" }}>
                            <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: "60px", color: "rgba(15,113,115,.15)", lineHeight: 1, position: "absolute", top: "12px", left: "20px", userSelect: "none" }}>"</div>
                            <p style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: "17px", color: INK, lineHeight: 1.75, marginBottom: "24px", paddingTop: "24px", fontStyle: "italic" }}>{q.q}</p>
                            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                <div style={{ width: "40px", height: "40px", borderRadius: "50%", background: SAGE, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "13px", fontWeight: 700, color: TEALD, fontFamily: "'Montserrat',sans-serif" }}>{q.initials}</div>
                                <div>
                                    <div style={{ fontSize: "13px", fontWeight: 600, color: INK, fontFamily: "'Montserrat',sans-serif" }}>{q.name}</div>
                                    <div style={{ fontSize: "10px", color: "#999", fontFamily: "'Montserrat',sans-serif" }}>{q.meta}</div>
                                </div>
                                <div style={{ marginLeft: "auto" }}>
                                    <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: "22px", fontWeight: 700, color: TEAL }}>{q.earnings}</div>
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
        { q: "Do I need my institution's permission to upload course materials?", a: "Materials that you personally created — lecture notes, tutorials, reading guides, assessments you set — are your intellectual property. Uploading your own academic work to LAN does not require institutional approval. We recommend reviewing your employment contract, but the vast majority of Nigerian university staff contracts do not restrict personal monetisation of self-created materials." },
        { q: "How is my identity as a lecturer verified?", a: "LAN verifies faculty using a combination of institutional email addresses, staff ID verification, and department cross-referencing. The verification process takes 24–48 hours. Your Faculty badge activates immediately upon approval." },
        { q: "Can I upload materials for courses I no longer teach?", a: "Absolutely. Your old lecture notes, past exam papers, and course materials are often more valuable historically than current materials. Students preparing for exams often specifically seek multiple years of materials, making older content a reliable income stream." },
        { q: "Is there a conflict of interest with my university?", a: "LAN operates as a supplementary academic marketplace. You are distributing materials to students who are not enrolled in your institution — not replacing your university's role. This is analogous to a lecturer writing a textbook: entirely legitimate and widely practised across Nigerian academia." },
        { q: "What happens if a student complains my materials are inaccurate?", a: "LAN has a clear dispute resolution policy. All verified faculty disputes are reviewed by our academic team, not automated. Faculty members with strong track records are protected from unfair or bad-faith disputes. Your reputation is treated as seriously as the buyer's complaint." },
        { q: "Can PhD students or postdoctoral researchers join as Faculty?", a: "Yes. LAN's Faculty Network is open to all verified academic staff including PhD students who hold demonstrable teaching responsibilities, postdoctoral researchers, adjunct lecturers, and visiting faculty. Verification requirements apply equally." },
    ];
    return (
        <section id="faq" style={{ background: IVORY2, padding: "88px 48px" }}>
            <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "10px" }}>
                    <div style={{ width: "40px", height: "2px", background: TEAL }} />
                    <p style={{ fontSize: "10px", fontWeight: 600, letterSpacing: ".2em", textTransform: "uppercase", color: TEAL, fontFamily: "'Montserrat',sans-serif" }}>Questions & Answers</p>
                </div>
                <h2 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: "clamp(30px,4vw,52px)", fontWeight: 700, color: INK, lineHeight: 1.1, marginBottom: "40px" }}>
                    Faculty <em style={{ color: TEAL }}>FAQs</em>
                </h2>
                <div style={{ maxWidth: "740px" }}>
                    {items.map((item, i) => (
                        <div key={i} style={{ borderBottom: "1px solid #e0d8cd", padding: "20px 0" }}>
                            <button onClick={() => setOpen(open === i ? null : i)}
                                style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", fontSize: "15px", fontWeight: 600, color: INK, background: "none", border: "none", cursor: "pointer", textAlign: "left", fontFamily: "'Montserrat',sans-serif" }}
                            >
                                {item.q}
                                <span style={{ fontSize: "18px", color: TEAL, flexShrink: 0, transition: "transform .2s", transform: open === i ? "rotate(45deg)" : "none", display: "inline-block" }}>+</span>
                            </button>
                            {open === i && (
                                <div style={{ fontSize: "13px", color: "rgba(26,26,46,.55)", lineHeight: 1.9, paddingTop: "14px", fontFamily: "'Montserrat',sans-serif" }}>{item.a}</div>
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
        <section style={{ background: WARM, padding: "88px 48px" }}>
            <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "10px" }}>
                    <div style={{ width: "40px", height: "2px", background: TEAL }} />
                    <p style={{ fontSize: "10px", fontWeight: 600, letterSpacing: ".2em", textTransform: "uppercase", color: TEAL, fontFamily: "'Montserrat',sans-serif" }}>The Ecosystem</p>
                </div>
                <h2 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: "clamp(30px,4vw,52px)", fontWeight: 700, color: INK, lineHeight: 1.1, marginBottom: "48px" }}>
                    Explore the Other <em style={{ color: TEAL }}>Networks</em>
                </h2>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }} className="lan-networks-grid">
                    {[
                        { bg: "#0d2244", tag: "📚 Seller Network", title: "Turn Knowledge Into Income", body: "Students and graduates monetise academic materials — past questions, lecture notes, textbooks, and more. Join 2,400+ verified sellers already earning passive income on LAN.", href: "/seller/network" },
                        { bg: INK, tag: "🎓 Student Network", title: "Learn Smarter, Earn Rewards", body: "Access 128,000+ academic documents, join study groups, post Bounty requests, and build your academic reputation — all on Africa's largest student knowledge platform.", href: "/students/network" },
                    ].map(n => (
                        <Link key={n.tag} href={n.href} style={{
                            display: "block", padding: "36px 32px", background: n.bg,
                            textDecoration: "none", position: "relative", overflow: "hidden",
                            transition: "transform .2s, box-shadow .2s",
                        }}
                            onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = "0 12px 40px rgba(26,26,46,.12)"; }}
                            onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; }}
                        >
                            <div style={{ fontSize: "9px", fontWeight: 700, letterSpacing: ".18em", textTransform: "uppercase", color: TEALL, marginBottom: "12px", fontFamily: "'Montserrat',sans-serif" }}>{n.tag}</div>
                            <h3 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: "26px", fontWeight: 700, color: "#fff", marginBottom: "12px" }}>{n.title}</h3>
                            <p style={{ fontSize: "12px", color: "rgba(249,246,240,.45)", lineHeight: 1.8, marginBottom: "20px", fontFamily: "'Montserrat',sans-serif" }}>{n.body}</p>
                            <span style={{ fontSize: "11px", fontWeight: 600, color: TEALL, letterSpacing: ".08em", textTransform: "uppercase", fontFamily: "'Montserrat',sans-serif" }}>Explore →</span>
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
            background: INK, padding: "100px 48px", textAlign: "center",
            position: "relative", overflow: "hidden",
        }}>
            <div style={{
                position: "absolute", inset: 0,
                backgroundImage: `linear-gradient(rgba(15,113,115,.07) 1px, transparent 1px), linear-gradient(90deg, rgba(15,113,115,.07) 1px, transparent 1px)`,
                backgroundSize: "48px 48px",
            }} />
            <div style={{ position: "relative", zIndex: 2 }}>
                <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "14px", marginBottom: "28px" }}>
                    <div style={{ width: "60px", height: "1px", background: TEAL }} />
                    <span style={{ fontSize: "10px", fontWeight: 600, letterSpacing: ".2em", textTransform: "uppercase", color: TEAL, fontFamily: "'Montserrat',sans-serif" }}>Join Today</span>
                    <div style={{ width: "60px", height: "1px", background: TEAL }} />
                </div>
                <h2 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: "clamp(34px,5vw,62px)", fontWeight: 700, color: "#fff", lineHeight: 1.05, marginBottom: "20px" }}>
                    Your Scholarship Deserves<br /><em style={{ color: TEALL }}>To Be Paid</em>
                </h2>
                <p style={{ fontSize: "14px", color: "rgba(249,246,240,.4)", maxWidth: "480px", margin: "0 auto 40px", lineHeight: 1.9, fontFamily: "'Montserrat',sans-serif" }}>
                    Join 3,200+ verified academics already earning from their expertise. Faculty verification takes under 48 hours — and it's completely free.
                </p>
                <div style={{ display: "flex", gap: "14px", justifyContent: "center", flexWrap: "wrap" }}>
                    <Link href="/auth/signup" style={{
                        padding: "15px 36px", background: TEAL, color: "#fff",
                        fontSize: "12px", fontWeight: 600, letterSpacing: ".12em", textTransform: "uppercase",
                        textDecoration: "none", fontFamily: "'Montserrat',sans-serif", transition: "background .18s",
                    }}
                        onMouseEnter={e => e.currentTarget.style.background = TEALD}
                        onMouseLeave={e => e.currentTarget.style.background = TEAL}
                    >Apply for Faculty Access — Free</Link>
                    <Link href="/documents" style={{
                        padding: "15px 28px", background: "transparent", color: "rgba(249,246,240,.65)",
                        fontSize: "12px", fontWeight: 600, letterSpacing: ".12em", textTransform: "uppercase",
                        border: "1px solid rgba(249,246,240,.2)", textDecoration: "none",
                        fontFamily: "'Montserrat',sans-serif", transition: "all .18s",
                    }}
                        onMouseEnter={e => { e.currentTarget.style.background = "rgba(249,246,240,.06)"; e.currentTarget.style.borderColor = "rgba(249,246,240,.4)"; }}
                        onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = "rgba(249,246,240,.2)"; }}
                    >Browse Faculty Materials</Link>
                </div>
                <p style={{ fontSize: "11px", color: "rgba(249,246,240,.2)", marginTop: "28px", fontFamily: "'Montserrat',sans-serif" }}>No joining fee. No subscription. No listing costs. LAN earns only when you earn.</p>
            </div>
        </section>
    );
}

/* ═══════════════════════════════════════════════════════════════
   PAGE ROOT
═══════════════════════════════════════════════════════════════ */
export default function FacultyNetworkPage() {
    const [activeTab, setActiveTab] = useState("faculty");

    return (
        <>
            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400;1,600;1,700&family=Montserrat:wght@300;400;600;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; overflow-x: hidden; }
        body { overflow-x: hidden; }
        @media(max-width:768px){
          section { padding-left: 20px !important; padding-right: 20px !important; }
          nav { padding: 0 20px !important; }
        }
      `}</style>
            <div style={{ fontFamily: "'Montserrat',sans-serif", background: WARM, color: INK, lineHeight: 1.7, overflowX: "hidden" }}>
                <Nav />
                <NetworkTabs active={activeTab} setActive={setActiveTab} />
                <Hero />
                <WhyJoin />
                <HowItWorks />
                <Earnings />
                <Tiers />
                <Tools />
                <Testimonials />
                <FAQ />
                <OtherNetworks />
                <CTAFooter />
            </div>
        </>
    );
}