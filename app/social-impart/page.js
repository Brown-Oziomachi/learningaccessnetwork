"use client";
import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";

const NAVY = "#0d2244";
const NAVY2 = "#162f5a";
const GOLD = "#b8963e";
const GOLDD = "#d4aa5a";
const CREAM = "#f5f0e8";
const BG = "#f5f1ea";

/* ── tiny animated counter ── */
function Counter({ target, suffix = "", prefix = "" }) {
    const [count, setCount] = useState(0);
    const ref = useRef(null);
    const started = useRef(false);
    useEffect(() => {
        const obs = new IntersectionObserver(([e]) => {
            if (e.isIntersecting && !started.current) {
                started.current = true;
                const steps = 60;
                const inc = target / steps;
                let cur = 0;
                const t = setInterval(() => {
                    cur += inc;
                    if (cur >= target) { setCount(target); clearInterval(t); }
                    else setCount(Math.floor(cur));
                }, 25);
            }
        }, { threshold: 0.3 });
        if (ref.current) obs.observe(ref.current);
        return () => obs.disconnect();
    }, [target]);
    return <span ref={ref}>{prefix}{count.toLocaleString()}{suffix}</span>;
}

/* ═══════════════════════════════════════════════════════════════
   NAV
═══════════════════════════════════════════════════════════════ */
function Nav() {
    return (
        <nav style={{
            position: "sticky", top: 0, zIndex: 100,
            background: NAVY, borderBottom: "1px solid rgba(184,150,62,.2)",
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "0 40px", height: "64px",
        }}>
            <Link href="/" style={{ fontFamily: "'Lato',sans-serif", fontWeight: 900, fontSize: "18px", color: "#fff", textDecoration: "none" }}>
                LAN <span style={{ color: GOLD }}>Library</span>
            </Link>
            <div style={{ display: "flex", gap: "28px", alignItems: "center" }} className="lan-nav-links">
                {[["/#how-it-works", "How It Works"], ["/#earnings", "Impact"], ["/#tiers", "Our Work"], ["/#faq", "FAQ"]].map(([href, label]) => (
                    <a key={href} href={href} style={{ color: "rgba(255,255,255,.65)", fontSize: "13px", fontWeight: 700, textDecoration: "none", letterSpacing: ".06em", textTransform: "uppercase", fontFamily: "'Lato',sans-serif", transition: "color .2s" }}
                        onMouseEnter={e => e.currentTarget.style.color = GOLD}
                        onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,.65)"}
                    >{label}</a>
                ))}
                <Link href="/auth/signup" style={{ background: GOLD, color: NAVY, padding: "10px 24px", fontSize: "12px", fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", textDecoration: "none", fontFamily: "'Lato',sans-serif" }}>Join LAN</Link>
            </div>
            <style>{`@media(max-width:768px){.lan-nav-links{display:none!important;}}`}</style>
        </nav>
    );
}

/* ═══════════════════════════════════════════════════════════════
   HERO
═══════════════════════════════════════════════════════════════ */
function Hero() {
    return (
        <section style={{
            background: NAVY,
            backgroundImage: "radial-gradient(rgba(184,150,62,.06) 1px,transparent 1px)",
            backgroundSize: "24px 24px",
            padding: "100px 40px 80px",
            position: "relative", overflow: "hidden",
        }}>
            {/* decorative rings */}
            {[280, 480, 680].map((s, i) => (
                <div key={i} style={{
                    position: "absolute", top: "50%", right: "-100px",
                    width: s, height: s, borderRadius: "50%",
                    border: `0.5px solid rgba(184,150,62,${0.06 - i * 0.015})`,
                    transform: "translateY(-50%)", pointerEvents: "none",
                }} />
            ))}

            <div style={{ maxWidth: "1100px", margin: "0 auto", position: "relative" }}>
                <div style={{
                    display: "inline-flex", alignItems: "center", gap: "8px",
                    background: "rgba(184,150,62,.14)", border: "1px solid rgba(184,150,62,.3)",
                    borderRadius: "999px", padding: "7px 18px", marginBottom: "28px",
                    fontSize: "10px", fontWeight: 700, letterSpacing: ".16em",
                    textTransform: "uppercase", color: GOLDD, fontFamily: "'Lato',sans-serif",
                }}>
                    🌍 Making an Impact
                </div>

                <h1 style={{
                    fontFamily: "'Playfair Display',serif",
                    fontSize: "clamp(42px,6vw,80px)", fontWeight: 900,
                    color: "#fff", lineHeight: 1.0, letterSpacing: "-.5px",
                    margin: "0 0 28px", maxWidth: "780px",
                }}>
                    Africa's Academic<br />
                    <em style={{ color: GOLD, fontStyle: "italic" }}>Transformation</em><br />
                    Starts Here
                </h1>

                <p style={{
                    fontSize: "18px", color: "rgba(245,240,232,.6)",
                    lineHeight: 1.85, fontWeight: 300, maxWidth: "600px",
                    marginBottom: "16px", fontFamily: "'Lato',sans-serif",
                }}>
                    LAN Library exists because millions of African students deserve equal access to the knowledge that shapes careers, breaks cycles of poverty, and builds the continent's future.
                </p>
                <p style={{
                    fontSize: "18px", color: "rgba(245,240,232,.6)",
                    lineHeight: 1.85, fontWeight: 300, maxWidth: "600px",
                    marginBottom: "48px", fontFamily: "'Lato',sans-serif",
                }}>
                    We are not just a library. We are a movement — connecting students, educators, and knowledge creators across 54 countries in the most ambitious academic democratisation Africa has ever seen.
                </p>

                <div style={{ display: "flex", gap: "14px", flexWrap: "wrap" }}>
                    <Link href="/auth/signup" style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "14px 28px", background: GOLD, color: NAVY, fontSize: "12px", fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", textDecoration: "none", fontFamily: "'Lato',sans-serif" }}>
                        🚀 Join the Movement
                    </Link>
                    <a href="#mission" style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "14px 22px", background: "rgba(255,255,255,.06)", color: "rgba(245,240,232,.8)", fontSize: "12px", fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", border: "1px solid rgba(255,255,255,.15)", textDecoration: "none", fontFamily: "'Lato',sans-serif" }}>
                        Our Story ↓
                    </a>
                </div>
            </div>
        </section>
    );
}

/* ═══════════════════════════════════════════════════════════════
   IMPACT NUMBERS
═══════════════════════════════════════════════════════════════ */
function ImpactNumbers() {
    const stats = [
        { val: 90, suffix: "M+", label: "Students We Aim to Reach", sub: "Across Africa by 2030" },
        { val: 200, suffix: "+", label: "Universities Covered", sub: "And growing every month" },
        { val: 128, suffix: "K+", label: "Documents Published", sub: "By students & lecturers" },
        { val: 47, suffix: "M+", label: "₦ Paid to Sellers", sub: "Earned by knowledge creators", prefix: "₦" },
        { val: 54, suffix: "", label: "African Countries", sub: "In our network" },
        { val: 2400, suffix: "+", label: "Verified Sellers", sub: "Turning knowledge into income" },
    ];
    return (
        <div style={{ background: "#07131f", borderTop: "1px solid rgba(184,150,62,.12)", borderBottom: "1px solid rgba(184,150,62,.12)" }}>
            <div style={{ maxWidth: "1100px", margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))" }}>
                {stats.map((s, i) => (
                    <div key={s.label} style={{ padding: "32px 24px", borderRight: i < stats.length - 1 ? "1px solid rgba(184,150,62,.08)" : "none" }}>
                        <div style={{ fontFamily: "'Playfair Display',serif", fontSize: "36px", fontWeight: 700, color: GOLD, marginBottom: "4px" }}>
                            <Counter target={s.val} suffix={s.suffix} prefix={s.prefix || ""} />
                        </div>
                        <div style={{ fontSize: "12px", fontWeight: 700, color: "#fff", marginBottom: "2px", fontFamily: "'Lato',sans-serif" }}>{s.label}</div>
                        <div style={{ fontSize: "10px", color: "rgba(245,240,232,.35)", fontFamily: "'Lato',sans-serif" }}>{s.sub}</div>
                    </div>
                ))}
            </div>
        </div>
    );
}

/* ═══════════════════════════════════════════════════════════════
   MISSION STATEMENT BANNER
═══════════════════════════════════════════════════════════════ */
function MissionBanner() {
    return (
        <div id="mission" style={{ background: GOLD, padding: "56px 40px", textAlign: "center" }}>
            <p style={{ fontSize: "10px", fontWeight: 700, letterSpacing: ".2em", textTransform: "uppercase", color: NAVY, marginBottom: "14px", fontFamily: "'Lato',sans-serif" }}>Our Social Impact Mission</p>
            <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: "clamp(22px,3.5vw,38px)", fontWeight: 700, color: NAVY, maxWidth: "820px", margin: "0 auto", lineHeight: 1.3 }}>
                Make knowledge accessible to every African student — regardless of institution, income, or geography.
            </h2>
        </div>
    );
}

/* ═══════════════════════════════════════════════════════════════
   WHY WE EXIST
═══════════════════════════════════════════════════════════════ */
function WhyWeExist() {
    const problems = [
        { icon: "📚", title: "The Access Crisis", body: "Over 60% of African university students cannot afford the textbooks required for their courses. They attend lectures unprepared, fall behind, and graduate without the depth of knowledge their global peers have. This is not a talent problem. It is an access problem." },
        { icon: "💸", title: "Knowledge Without Return", body: "Thousands of lecturers and senior students create exceptional academic materials every year — past questions, comprehensive notes, research papers. Almost all of it circulates for free, undervalued, or simply disappears. The creators earn nothing." },
        { icon: "🏛️", title: "Institutional Gaps", body: "Most African universities cannot afford the licensing fees for major academic databases. Students are locked out of JSTOR, Springer, Elsevier — the very tools their counterparts in Europe and North America take for granted." },
        { icon: "🌐", title: "Fragmented Knowledge", body: "Academic knowledge is scattered across WhatsApp groups, physical printouts, private drives, and informal sharing networks. There is no organised, searchable, trusted repository built specifically for African academic content." },
    ];
    return (
        <section style={{ padding: "88px 40px", background: BG }}>
            <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
                <p style={{ fontSize: "10px", fontWeight: 700, letterSpacing: ".2em", textTransform: "uppercase", color: GOLD, marginBottom: "10px", fontFamily: "'Lato',sans-serif" }}>The Problem We Solve</p>
                <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: "clamp(28px,4vw,48px)", fontWeight: 700, color: NAVY, lineHeight: 1.1, marginBottom: "16px" }}>
                    Why LAN <em style={{ color: GOLD, fontStyle: "italic" }}>Had to Exist</em>
                </h2>
                <p style={{ fontSize: "15px", color: "#888", maxWidth: "560px", lineHeight: 1.85, fontWeight: 300, marginBottom: "56px", fontFamily: "'Lato',sans-serif" }}>
                    Africa has 1.4 billion people and the world's youngest population. Its universities produce millions of graduates every year. Yet the infrastructure of academic knowledge sharing has remained broken for decades.
                </p>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: "20px" }}>
                    {problems.map(p => (
                        <div key={p.title} style={{ background: "#fff", border: "1px solid #e5ddd0", padding: "32px 28px", position: "relative", overflow: "hidden" }}>
                            <div style={{ position: "absolute", top: 0, left: 0, width: "3px", height: "100%", background: GOLD }} />
                            <div style={{ fontSize: "36px", marginBottom: "16px" }}>{p.icon}</div>
                            <div style={{ fontFamily: "'Playfair Display',serif", fontSize: "20px", fontWeight: 700, color: NAVY, marginBottom: "12px" }}>{p.title}</div>
                            <div style={{ fontSize: "13px", color: "#666", lineHeight: 1.85, fontFamily: "'Lato',sans-serif" }}>{p.body}</div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

/* ═══════════════════════════════════════════════════════════════
   OUR ANSWER
═══════════════════════════════════════════════════════════════ */
function OurAnswer() {
    return (
        <section style={{ background: NAVY, padding: "88px 40px", backgroundImage: "radial-gradient(rgba(184,150,62,.05) 1px,transparent 1px)", backgroundSize: "22px 22px" }}>
            <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "64px", alignItems: "center" }} className="lan-answer-grid">
                    <div>
                        <p style={{ fontSize: "10px", fontWeight: 700, letterSpacing: ".2em", textTransform: "uppercase", color: GOLDD, marginBottom: "10px", fontFamily: "'Lato',sans-serif" }}>Our Answer</p>
                        <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: "clamp(28px,4vw,48px)", fontWeight: 700, color: "#fff", lineHeight: 1.1, marginBottom: "24px" }}>
                            A Library Built <em style={{ color: GOLD, fontStyle: "italic" }}>For Africa,</em><br />By Africans
                        </h2>
                        {[
                            "LAN Library is Africa's first peer-powered academic marketplace — a platform where the knowledge that has always existed within African institutions is finally organised, valued, and made accessible.",
                            "We built a system where students and lecturers earn real income by sharing what they know, while other students gain access to the materials they could never afford. The result is a self-sustaining knowledge economy that grows stronger with every upload.",
                            "This is not charity. This is infrastructure. The same way roads connect economies, LAN connects minds — and it pays the people who build those connections.",
                        ].map((t, i) => (
                            <p key={i} style={{ fontSize: "15px", color: "rgba(245,240,232,.6)", lineHeight: 1.9, marginBottom: "18px", fontFamily: "'Lato',sans-serif" }}>{t}</p>
                        ))}
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                        {[
                            { num: "01", title: "Peer Knowledge Economy", body: "Students and lecturers upload what they know. Others pay fair prices for it. 80% of every transaction goes back to the creator." },
                            { num: "02", title: "Institutional Coverage", body: "We index content from 200+ universities so every student, regardless of their school, can find materials relevant to their exact courses." },
                            { num: "03", title: "Bounty System", body: "When a student can't find what they need, they post a bounty. Sellers race to fulfill it. Rare knowledge is rewarded, not lost." },
                            { num: "04", title: "Zero Barrier Entry", body: "Free to join. Free to browse previews. No subscription required to sell. LAN earns only when creators earn." },
                        ].map(item => (
                            <div key={item.num} style={{ display: "flex", gap: "16px", background: "rgba(255,255,255,.04)", border: "1px solid rgba(184,150,62,.1)", padding: "20px 22px" }}>
                                <div style={{ fontFamily: "'Playfair Display',serif", fontSize: "28px", fontWeight: 900, color: "rgba(184,150,62,.25)", flexShrink: 0, lineHeight: 1 }}>{item.num}</div>
                                <div>
                                    <div style={{ fontSize: "13px", fontWeight: 700, color: "#fff", marginBottom: "6px", fontFamily: "'Lato',sans-serif" }}>{item.title}</div>
                                    <div style={{ fontSize: "12px", color: "rgba(245,240,232,.5)", lineHeight: 1.75, fontFamily: "'Lato',sans-serif" }}>{item.body}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            <style>{`@media(max-width:768px){.lan-answer-grid{grid-template-columns:1fr!important;}}`}</style>
        </section>
    );
}

/* ═══════════════════════════════════════════════════════════════
   FOCUS AREAS
═══════════════════════════════════════════════════════════════ */
function FocusAreas() {
    const areas = [
        {
            icon: (
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={GOLD} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
            ),
            title: "Student Economic Opportunity",
            body: "By giving students a platform to monetise their academic materials, LAN creates income streams for young Africans who would otherwise graduate into unemployment. A student who earns ₦200,000 per month from their notes is a student who can pay their fees, buy food, and stay in school.",
        },
        {
            icon: (
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={GOLD} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
            ),
            title: "Lecturer Dignity & Recognition",
            body: "Lecturers across Africa are underpaid and undervalued. LAN's Faculty Network gives them a legitimate, dignified income stream from their expertise — materials they've already created, now reaching students beyond their classroom and generating monthly income indefinitely.",
        },
        {
            icon: (
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={GOLD} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" />
                    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                </svg>
            ),
            title: "Knowledge Without Borders",
            body: "A student in Kano should have access to the same quality past questions as a student in Lagos. A student in Accra should be able to access notes from a brilliant professor in Nairobi. LAN breaks down the geographic walls that have long defined academic inequality in Africa.",
        },
    ];
    return (
        <section style={{ padding: "88px 40px", background: BG }}>
            <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
                <p style={{ fontSize: "10px", fontWeight: 700, letterSpacing: ".2em", textTransform: "uppercase", color: GOLD, marginBottom: "10px", fontFamily: "'Lato',sans-serif", textAlign: "center" }}>Empowering Impact Across Key Areas</p>
                <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: "clamp(28px,4vw,46px)", fontWeight: 700, color: NAVY, lineHeight: 1.1, marginBottom: "56px", textAlign: "center" }}>
                    Where We're Making a <em style={{ color: GOLD, fontStyle: "italic" }}>Difference</em>
                </h2>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: "24px" }}>
                    {areas.map(a => (
                        <div key={a.title} style={{ background: "#fff", border: "1px solid #e5ddd0", padding: "36px 28px", textAlign: "center" }}>
                            <div style={{ width: "64px", height: "64px", background: "rgba(184,150,62,.08)", border: "1px solid rgba(184,150,62,.2)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>{a.icon}</div>
                            <div style={{ fontFamily: "'Playfair Display',serif", fontSize: "20px", fontWeight: 700, color: NAVY, marginBottom: "14px" }}>{a.title}</div>
                            <div style={{ fontSize: "13px", color: "#666", lineHeight: 1.85, fontFamily: "'Lato',sans-serif" }}>{a.body}</div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

/* ═══════════════════════════════════════════════════════════════
   TIMELINE — OUR STORY
═══════════════════════════════════════════════════════════════ */
function OurStory() {
    const milestones = [
        {
            year: "2024",
            title: "The Idea Is Born",
            body: "Two final-year students, one recurring frustration: textbooks that cost a semester's allowance, lecture notes locked in private WhatsApp groups, and no single place to find what you actually needed for tomorrow's exam. LAN was conceived as the answer — a marketplace and library combined.",
        },
        {
            year: "Early 2025",
            title: "First Launch",
            body: "LAN Library went live with 1,000 curated documents spanning 10 subject categories. We kept it lean and focused — only materials that passed our quality bar made the cut. Two hundred students signed up in the first month without a single paid ad.",
        },
        {
            year: "Mid 2025",
            title: "Sellers Join the Ecosystem",
            body: "We opened the platform to student sellers and lecturers — enabling anyone with quality academic materials to earn from them on their own terms. The catalogue crossed 1,000 documents. Our 80% revenue share made LAN the most creator-friendly academic marketplace in Africa.",
        },
        {
            year: "Late 2025",
            title: "Going Continental",
            body: "Readers from 10+ African countries. We added institutional categories for universities, polytechnics, colleges of education, and professional certifications — making LAN the first platform purpose-built for the full spectrum of African academic life.",
        },
        {
            year: "2026 →",
            title: "What's Next",
            body: "AI-powered personalised recommendations. Offline reading mode for students with unstable internet. Bulk institutional licensing so universities can distribute materials at scale. A dedicated lecturer portal. And a lot more we're not ready to announce yet.",
        },
        {
            year: "2030 — Target",
            title: "The Vision",
            body: "90 million African students connected to quality academic resources. 500,000 knowledge creators earning sustainable income. Africa's academic infrastructure — finally built by Africans, for Africans.",
            future: true,
        },
    ];

    return (
        <section style={{ background: NAVY, padding: "88px 40px", backgroundImage: "radial-gradient(rgba(184,150,62,.04) 1px,transparent 1px)", backgroundSize: "20px 20px" }}>
            <div style={{ maxWidth: "800px", margin: "0 auto" }}>
                <p style={{ fontSize: "10px", fontWeight: 700, letterSpacing: ".2em", textTransform: "uppercase", color: GOLDD, marginBottom: "10px", fontFamily: "'Lato',sans-serif" }}>Our Journey</p>
                <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: "clamp(28px,4vw,46px)", fontWeight: 700, color: "#fff", lineHeight: 1.1, marginBottom: "8px" }}>
                    How We Got <em style={{ color: GOLD, fontStyle: "italic" }}>Here</em>
                </h2>
                <p style={{ fontSize: "14px", color: "rgba(245,240,232,.4)", marginBottom: "56px", fontFamily: "'Lato',sans-serif", fontWeight: 300 }}>
                    How we got here.
                </p>

                <div style={{ position: "relative" }}>
                    {/* vertical line */}
                    <div style={{ position: "absolute", left: "28px", top: 0, bottom: 0, width: "1px", background: "linear-gradient(180deg,rgba(184,150,62,.4),rgba(184,150,62,.1))" }} />

                    {milestones.map((m) => (
                        <div key={m.year} style={{ display: "flex", gap: "28px", marginBottom: "32px", position: "relative" }}>
                            {/* dot */}
                            <div style={{ flexShrink: 0, width: "56px", display: "flex", justifyContent: "center", paddingTop: "6px" }}>
                                <div style={{
                                    width: "14px", height: "14px", borderRadius: "50%",
                                    background: m.future ? "rgba(184,150,62,.25)" : GOLD,
                                    border: `2px solid ${GOLD}`,
                                    flexShrink: 0,
                                }} />
                            </div>

                            <div style={{
                                background: m.future ? "rgba(184,150,62,.06)" : "rgba(255,255,255,.04)",
                                border: `1px solid ${m.future ? "rgba(184,150,62,.25)" : "rgba(184,150,62,.1)"}`,
                                padding: "22px 24px",
                                flex: 1,
                            }}>
                                <div style={{ fontSize: "10px", fontWeight: 700, letterSpacing: ".14em", textTransform: "uppercase", color: GOLD, marginBottom: "6px", fontFamily: "'Lato',sans-serif" }}>
                                    {m.year}
                                </div>
                                <div style={{ fontFamily: "'Playfair Display',serif", fontSize: "18px", fontWeight: 700, color: m.future ? GOLDD : "#fff", marginBottom: "8px" }}>
                                    {m.title}
                                </div>
                                <div style={{ fontSize: "13px", color: "rgba(245,240,232,.55)", lineHeight: 1.8, fontFamily: "'Lato',sans-serif" }}>
                                    {m.body}
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
   KEY PROGRAMS
═══════════════════════════════════════════════════════════════ */
function KeyPrograms() {
    const programs = [
        {
            tag: "For Students", icon: "🎓",
            title: "Student Knowledge Network",
            body: "A peer-to-peer academic content marketplace where students discover, purchase, and build upon the work of their academic community. Access past questions, lecture notes, textbooks, and more — all organised by university, department, and course.",
            href: "/students/network", cta: "Explore Student Network",
        },
        {
            tag: "For Sellers", icon: "💰",
            title: "Seller Earning Programme",
            body: "A structured income platform for students and creators who turn their academic materials into lasting passive income. Upload once, earn forever. 80% revenue share, instant payouts, and a full analytics dashboard.",
            href: "/seller/network", cta: "Join as a Seller",
        },
        {
            tag: "For Lecturers", icon: "🏛️",
            title: "Faculty Verification & Monetisation",
            body: "A dedicated pathway for lecturers and professors to publish course materials, reach students beyond their campus, and build a verified academic brand on LAN — with exclusive tools, priority support, and a Verified Faculty badge.",
            href: "/faculty/network", cta: "Explore Faculty Network",
        },
        {
            tag: "Bounty System", icon: "🎯",
            title: "Bounty Board",
            body: "Students post cash-backed requests for specific academic materials they cannot find. Sellers race to fulfill them. Rare knowledge is surfaced, rewarded, and made permanently available to the wider community.",
            href: "/lan/net/help-center/article/bounty-board", cta: "Explore Bounty Board",
        },
    ];
    return (
        <section style={{ padding: "88px 40px", background: CREAM }}>
            <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
                <p style={{ fontSize: "10px", fontWeight: 700, letterSpacing: ".2em", textTransform: "uppercase", color: GOLD, marginBottom: "10px", fontFamily: "'Lato',sans-serif" }}>Key Programmes</p>
                <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: "clamp(28px,4vw,46px)", fontWeight: 700, color: NAVY, lineHeight: 1.1, marginBottom: "16px" }}>
                    See How We're <em style={{ color: GOLD, fontStyle: "italic" }}>Making an Impact</em>
                </h2>
                <p style={{ fontSize: "15px", color: "#888", maxWidth: "560px", lineHeight: 1.85, fontWeight: 300, marginBottom: "56px", fontFamily: "'Lato',sans-serif" }}>
                    Every programme on LAN serves the same north star: knowledge should flow freely and its creators should be rewarded.
                </p>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: "20px" }}>
                    {programs.map(p => (
                        <div key={p.title} style={{ background: "#fff", border: "1px solid #e5ddd0", padding: "32px 28px", display: "flex", flexDirection: "column" }}>
                            <div style={{ fontSize: "9px", fontWeight: 700, letterSpacing: ".14em", textTransform: "uppercase", color: GOLD, marginBottom: "12px", fontFamily: "'Lato',sans-serif" }}>{p.tag}</div>
                            <div style={{ fontSize: "32px", marginBottom: "14px" }}>{p.icon}</div>
                            <div style={{ fontFamily: "'Playfair Display',serif", fontSize: "18px", fontWeight: 700, color: NAVY, marginBottom: "10px" }}>{p.title}</div>
                            <div style={{ fontSize: "13px", color: "#666", lineHeight: 1.85, fontFamily: "'Lato',sans-serif", flex: 1, marginBottom: "20px" }}>{p.body}</div>
                            <Link href={p.href} style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "11px", fontWeight: 700, color: GOLD, textDecoration: "none", letterSpacing: ".06em", textTransform: "uppercase", fontFamily: "'Lato',sans-serif" }}>
                                {p.cta} →
                            </Link>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

/* ═══════════════════════════════════════════════════════════════
   MANIFESTO QUOTE
═══════════════════════════════════════════════════════════════ */
function Manifesto() {
    return (
        <section style={{ background: GOLD, padding: "80px 40px", textAlign: "center" }}>
            <div style={{ maxWidth: "800px", margin: "0 auto" }}>
                <p style={{ fontFamily: "'Playfair Display',serif", fontSize: "clamp(20px,3vw,32px)", fontStyle: "italic", fontWeight: 700, color: NAVY, lineHeight: 1.5, marginBottom: "24px" }}>
                    "When a student in Nigeria can access the same quality of academic resources as a student at Ghana — that is when Africa will truly compete. That is what LAN is building."
                </p>
                <p style={{ fontSize: "12px", fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", color: NAVY2, fontFamily: "'Lato',sans-serif" }}>— LAN Library Founding Team, Abuja, Nigeria</p>
            </div>
        </section>
    );
}

/* ═══════════════════════════════════════════════════════════════
   CTA
═══════════════════════════════════════════════════════════════ */
function CTAFooter() {
    return (
        <section style={{ background: NAVY, backgroundImage: "radial-gradient(rgba(184,150,62,.05) 1px,transparent 1px)", backgroundSize: "22px 22px", padding: "100px 40px", textAlign: "center" }}>
            <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: "clamp(32px,5vw,56px)", fontWeight: 900, color: "#fff", lineHeight: 1.05, marginBottom: "20px" }}>
                Be Part of the<br /><em style={{ color: GOLD, fontStyle: "italic" }}>Transformation</em>
            </h2>
            <p style={{ fontSize: "15px", color: "rgba(245,240,232,.45)", maxWidth: "500px", margin: "0 auto 40px", lineHeight: 1.85, fontWeight: 300, fontFamily: "'Lato',sans-serif" }}>
                Whether you are a student, a lecturer, or a creator — there is a place for you on LAN. Join the movement that is rewriting what African education looks like.
            </p>
            <div style={{ display: "flex", gap: "14px", justifyContent: "center", flexWrap: "wrap" }}>
                <Link href="/auth/signup" style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "16px 36px", background: GOLD, color: NAVY, fontSize: "13px", fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", textDecoration: "none", fontFamily: "'Lato',sans-serif" }}>
                    🎓 Join as a Student
                </Link>
                <Link href="/seller/network" style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "16px 28px", background: "rgba(255,255,255,.06)", color: "rgba(245,240,232,.8)", fontSize: "13px", fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", border: "1px solid rgba(255,255,255,.15)", textDecoration: "none", fontFamily: "'Lato',sans-serif" }}>
                    💰 Start Selling
                </Link>
            </div>
        </section>
    );
}

/* ═══════════════════════════════════════════════════════════════
   ROOT
═══════════════════════════════════════════════════════════════ */
export default function SocialImpactPage() {
    return (
        <>
            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400;1,700&family=Lato:wght@300;400;700;900&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
        html{scroll-behavior:smooth;overflow-x:hidden;}
        @media(max-width:768px){
          section{padding-left:20px!important;padding-right:20px!important;}
          nav{padding:0 20px!important;}
        }
      `}</style>
            <div style={{ fontFamily: "'Lato',sans-serif", background: BG, color: NAVY, overflowX: "hidden" }}>
                <Nav />
                <Hero />
                <ImpactNumbers />
                <MissionBanner />
                <WhyWeExist />
                <OurAnswer />
                <FocusAreas />
                <OurStory />
                <KeyPrograms />
                <Manifesto />
                <CTAFooter />
            </div>
        </>
    );
}