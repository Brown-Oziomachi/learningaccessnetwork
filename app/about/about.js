"use client";

import { useState, useEffect, useRef } from 'react';
import { BookOpen, Users, Globe, Target, Award, TrendingUp, ArrowRight, ChevronDown, Zap, Shield, Heart, Star } from 'lucide-react';
import Link from 'next/link';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from "@/lib/firebaseConfig";
import { useRouter } from 'next/navigation';
import Navbar from '@/components/NavBar';
import Footer from '@/components/FooterComp';

// ── COUNTER HOOK ──────────────────────────────────────────────────────────────
function useCounter(target, duration, isDecimal, triggered) {
    const [count, setCount] = useState(0);
    useEffect(() => {
        if (!triggered) return;
        let start = null;
        const step = (ts) => {
            if (!start) start = ts;
            const p = Math.min((ts - start) / (duration || 2200), 1);
            const e = 1 - Math.pow(1 - p, 3);
            setCount(isDecimal ? parseFloat((e * target).toFixed(1)) : Math.floor(e * target));
            if (p < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
    }, [triggered, target, duration, isDecimal]);
    return count;
}

function useInView(threshold) {
    const ref = useRef(null);
    const [inView, setInView] = useState(false);
    useEffect(() => {
        const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setInView(true); }, { threshold: threshold || 0.15 });
        if (ref.current) obs.observe(ref.current);
        return () => obs.disconnect();
    }, [threshold]);
    return [ref, inView];
}

function StatCard({ value, suffix, label, isDecimal, triggered, delay }) {
    const count = useCounter(value, 2200, isDecimal, triggered);
    return (
        <div className="stat-card" style={{ textAlign: 'center', opacity: 0, transform: 'translateY(20px)', animation: triggered ? `fadeUp 0.7s ease ${delay} forwards` : 'none' }}>
            <div style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 'clamp(2.8rem, 7vw, 5.5rem)', fontWeight: 800, color: '#0d1f35', lineHeight: 1 }}>
                {isDecimal ? count.toFixed(1) : count.toLocaleString()}{suffix}
            </div>
            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#6b7280', marginTop: 8 }}>{label}</div>
        </div>
    );
}

export default function AboutClient() {
    const router = useRouter();
    const [user, setUser] = useState(null);
    const [statsTriggered, setStatsTriggered] = useState(false);
    const [statsRef, statsInView] = useInView(0.3);
    const [loaded, setLoaded] = useState(false);

    useEffect(() => { setTimeout(() => setLoaded(true), 80); }, []);
    useEffect(() => { if (statsInView) setStatsTriggered(true); }, [statsInView]);
    useEffect(() => {
        const unsub = onAuthStateChanged(auth, (u) => { if (u) setUser(u); });
        return () => unsub();
    }, []);

    const values = [
        {
            icon: BookOpen,
            title: 'Knowledge for All',
            description: "Geography shouldn't determine destiny. Whether you're in Lagos, Kano, Enugu, or a small town with no bookshop in sight — you deserve the same textbooks, the same notes, the same shot at excellence. We're building the infrastructure to close that gap across Africa."
        },
        {
            icon: Users,
            title: 'Community-Driven',
            description: "LAN isn't just a file-hosting service — it's a living academic community. Students browse and share. Lecturers publish and reach thousands. Reviews and ratings from real users keep quality high. Your upload today helps a student you'll never meet ace an exam tomorrow."
        },
        {
            icon: Shield,
            title: 'Verified Quality',
            description: "Every document submitted passes a manual review before it goes live. We check for accuracy, formatting, duplicates, and relevance. No spam. No recycled junk. Just materials that genuinely belong in an academic library — reviewed within 48 hours, guaranteed."
        },
        {
            icon: Zap,
            title: 'Instant Access',
            description: "Buy once, download immediately. No waiting for email confirmations. No DRM headaches. No expiry timers. Your purchased documents live permanently in your personal library, accessible any time — on desktop or mobile — for as long as you need them."
        },
        {
            icon: Heart,
            title: 'Author-First Earnings',
            description: "Sellers keep 80% of every single sale. We believe the people who invest time creating value should capture most of it — not the platform that hosts it. Upload your lecture notes, past questions, or study guides once, and earn on every download indefinitely."
        },
        {
            icon: TrendingUp,
            title: 'Built to Scale',
            description: "From JSS1 BECE prep to PhD dissertations. From WAEC revision packs to postgraduate research methods guides. Our library grows with your academic journey — every level, every institution, every document type — with smart search by course code, semester, and school."
        },
    ];

    const timeline = [
        {
            year: '2024',
            title: 'The Idea Is Born',
            body: 'Two final-year students, one recurring frustration: textbooks that cost a semester\'s allowance, lecture notes locked in private WhatsApp groups, and no single place to find what you actually needed for tomorrow\'s exam. LAN was conceived as the answer — a marketplace and library combined.'
        },
        {
            year: 'Early 2025',
            title: 'First Launch',
            body: 'LAN Library went live with 500 curated documents spanning 10 subject categories. We kept it lean and focused — only materials that passed our quality bar made the cut. Two hundred students signed up in the first week without a single paid ad.'
        },
        {
            year: 'Mid 2025',
            title: 'Sellers Join the Ecosystem',
            body: 'We opened the platform to student sellers and lecturers — enabling anyone with quality academic materials to earn from them on their own terms. The catalogue crossed 1,000 documents. Our 80% revenue share made LAN the most creator-friendly academic marketplace in Nigeria.'
        },
        {
            year: 'Late 2025',
            title: 'Going Continental',
            body: 'Readers from 10+ African countries. We added institutional categories for universities, polytechnics, colleges of education, and professional certifications — making LAN the first platform purpose-built for the full spectrum of African academic life.'
        },
        {
            year: '2026 →',
            title: 'What\'s Next',
            body: 'AI-powered personalised recommendations. Offline reading mode for students with unstable internet. Bulk institutional licensing so universities can distribute materials at scale. A dedicated lecturer portal. And a lot more we\'re not ready to announce yet.'
        },
    ];

    const offerings = [
        {
            emoji: '🎓',
            title: 'For Students',
            subtitle: 'Everything you need to pass — and excel.',
            items: [
                'Past questions and solved exam papers',
                'Lecture notes, summaries, and mind maps',
                'Textbooks at prices that don\'t hurt',
                'Search by level, course code, or institution',
                'Personal library dashboard for all your purchases',
            ]
        },
        {
            emoji: '✍️',
            title: 'For Sellers',
            subtitle: 'Turn what you know into income that lasts.',
            items: [
                'Upload in under 5 minutes — PDF or Drive link',
                'Keep 80% of every sale, forever',
                'Live earnings and sales analytics dashboard',
                'Manual review completed within 24–48 hours',
                'Grow a catalogue that earns while you sleep',
            ]
        },
        {
            emoji: '📚',
            title: 'For Lecturers',
            subtitle: 'Reach your students where they already are.',
            items: [
                'Distribute course materials directly to students',
                'Set your own pricing — free or paid',
                'Verified author badge and institutional credit',
                'Listed under your exact faculty and department',
                'Passive income from every student who downloads',
            ]
        },
    ];

    const docCategories = [
        ['Core Academic', 'Textbooks, lecture notes, syllabi, mind maps, flashcards, cheat sheets, study guides…'],
        ['Exam Prep', 'WAEC, JAMB CBT, NECO, Post-UTME, mock exams, quiz banks, marking schemes…'],
        ['Research', 'Thesis templates, journal articles, literature reviews, case studies, project essays…'],
        ['Practical', 'Lab reports, code samples, circuit diagrams, AutoCAD files, technical drawings…'],
        ['Professional', 'Medical notes, law case briefs, pharmacy, nursing, architecture portfolios…'],
        ['Career', 'CV templates, interview prep, scholarship guides, fellowship application kits…'],
    ];

    const v = loaded ? { opacity: 1, transform: 'translateY(0)' } : { opacity: 0, transform: 'translateY(28px)' };
    const t = (delay) => ({ transition: `opacity 0.8s ease ${delay}, transform 0.8s ease ${delay}` });

    return (
        <div style={{ fontFamily: "'Sora', system-ui, sans-serif", background: '#fdfcfa', color: '#111827', overflowX: 'hidden' }}>

            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;0,800;1,400;1,600&family=Sora:wght@300;400;500;600;700&display=swap');

                @keyframes fadeUp { to { opacity: 1; transform: translateY(0); } }
                @keyframes scrollBounce {
                    0%, 100% { transform: translateX(-50%) translateY(0); }
                    50% { transform: translateX(-50%) translateY(7px); }
                }
                * { box-sizing: border-box; margin: 0; padding: 0; }
                a { text-decoration: none; }

                /* ── RESPONSIVE GRID UTILITIES ── */
                .stats-grid {
                    display: grid;
                    grid-template-columns: repeat(5, 1fr);
                    gap: 2rem;
                }
                .mission-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 5rem;
                    align-items: center;
                }
                .offerings-grid {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 2rem;
                }
                .values-grid {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 1px;
                    background: rgba(13,31,53,0.08);
                    border: 1px solid rgba(13,31,53,0.08);
                }
                .doc-scope-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 5rem;
                    align-items: center;
                }
                .doc-cat-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 1px;
                    background: rgba(13,31,53,0.08);
                    border: 1px solid rgba(13,31,53,0.08);
                }
                .quick-facts-grid {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 1px;
                    background: rgba(13,31,53,0.08);
                    border: 1px solid rgba(13,31,53,0.08);
                }
                .cta-grid {
                    display: grid;
                    grid-template-columns: 1fr auto;
                    gap: 4rem;
                    align-items: end;
                }
                .hero-btns {
                    display: flex;
                    gap: 1rem;
                    flex-wrap: wrap;
                }
                .cta-btns {
                    display: flex;
                    gap: 1rem;
                    flex-wrap: wrap;
                }

                /* ── TIMELINE ── */
                .timeline-row {
                    display: grid;
                    grid-template-columns: 140px 1fr;
                    gap: 2.5rem;
                    padding-left: 2.5rem;
                    position: relative;
                }

                /* ── MOBILE BREAKPOINTS ── */
                @media (max-width: 1024px) {
                    .mission-grid { grid-template-columns: 1fr; gap: 3rem; }
                    .mission-img { display: none; }
                    .offerings-grid { grid-template-columns: 1fr; }
                    .values-grid { grid-template-columns: 1fr 1fr; }
                    .doc-scope-grid { grid-template-columns: 1fr; gap: 3rem; }
                    .cta-grid { grid-template-columns: 1fr; gap: 2.5rem; }
                    .stats-grid { grid-template-columns: repeat(3, 1fr); }
                }

                @media (max-width: 768px) {
                    .stats-grid { grid-template-columns: repeat(2, 1fr); gap: 2rem; }
                    .values-grid { grid-template-columns: 1fr; }
                    .doc-cat-grid { grid-template-columns: 1fr; }
                    .quick-facts-grid { grid-template-columns: 1fr; }
                    .timeline-row { grid-template-columns: 80px 1fr; gap: 1.5rem; padding-left: 1.5rem; }
                    section { padding: 4rem 1.25rem !important; }
                }

                @media (max-width: 480px) {
                    .stats-grid { grid-template-columns: 1fr 1fr; }
                    .hero-btns { flex-direction: column; }
                    .cta-btns { flex-direction: column; }
                }

                /* ── CARD HOVER ── */
                .offering-card {
                    background: #fff;
                    border: 1px solid rgba(13,31,53,0.08);
                    padding: 2.5rem;
                    position: relative;
                    overflow: hidden;
                    transition: transform 0.3s ease, box-shadow 0.3s ease;
                }
                .offering-card:hover {
                    transform: translateY(-5px);
                    box-shadow: 0 24px 64px rgba(13,31,53,0.1);
                }
                .value-card {
                    background: #fdfcfa;
                    padding: 2.5rem;
                    transition: background 0.2s ease;
                    cursor: default;
                }
                .value-card:hover { background: #f9f6f0; }
                .doc-cat-card {
                    background: #fff;
                    padding: 1.75rem;
                }
            `}</style>

            {/* ══ HERO ══════════════════════════════════════════════════════════════ */}
            <section style={{
                minHeight: '100vh',
                background: '#0d1f35',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden'
            }}>
                {/* Grain */}
                <div style={{ position: 'absolute', inset: 0, backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E\")", opacity: 0.5, pointerEvents: 'none' }} />
                {/* Grid */}
                <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(200,146,42,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(200,146,42,0.05) 1px, transparent 1px)', backgroundSize: '80px 80px', pointerEvents: 'none' }} />
                {/* Glow right */}
                <div style={{ position: 'absolute', top: '-20%', right: '-10%', width: '60vw', height: '60vw', maxWidth: 700, maxHeight: 700, background: 'radial-gradient(circle, rgba(200,146,42,0.12) 0%, transparent 65%)', pointerEvents: 'none' }} />
                {/* Glow left */}
                <div style={{ position: 'absolute', bottom: '-20%', left: '-10%', width: '50vw', height: '50vw', maxWidth: 500, maxHeight: 500, background: 'radial-gradient(circle, rgba(42,80,128,0.28) 0%, transparent 65%)', pointerEvents: 'none' }} />

                <div style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    padding: 'clamp(7rem, 12vw, 10rem) clamp(1.25rem, 5vw, 4rem) 5rem',
                    maxWidth: 1200,
                    margin: '0 auto',
                    width: '100%',
                    position: 'relative',
                    zIndex: 10
                }}>

                    {/* Eyebrow */}
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, fontSize: 11, fontWeight: 600, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#c8922a', marginBottom: '2rem', ...v, ...t('0s') }}>
                        <span style={{ width: 32, height: 1, background: '#c8922a', display: 'inline-block' }} />
                        Learning Access Network — About Us
                    </div>

                    {/* Main headline */}
                    <h1 style={{
                        fontFamily: "'Cormorant Garamond', Georgia, serif",
                        fontWeight: 800,
                        fontSize: 'clamp(4rem, 13vw, 10.5rem)',
                        lineHeight: 0.88,
                        letterSpacing: '-0.02em',
                        color: '#fff',
                        margin: '0 0 2.5rem',
                        ...v, ...t('0.15s')
                    }}>
                        Africa's<br />
                        Academic<br />
                        <span style={{ color: '#c8922a' }}>Library.</span>
                    </h1>

                    <p style={{
                        fontSize: 'clamp(1rem, 2.2vw, 1.25rem)',
                        color: 'rgba(255,255,255,0.55)',
                        maxWidth: 580,
                        lineHeight: 1.8,
                        fontWeight: 300,
                        marginBottom: '3rem',
                        ...v, ...t('0.3s')
                    }}>
                        LAN Library is where Nigerian and African students, sellers, and lecturers come together to share knowledge — and earn from it. One platform. 70+ document types. Instant access at prices that respect your budget.
                    </p>

                    <div className="hero-btns" style={{ ...v, ...t('0.45s') }}>
                        <Link href="/documents" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '15px 30px', background: '#c8922a', color: '#0d1f35', fontWeight: 700, fontSize: 13, letterSpacing: '0.05em', textTransform: 'uppercase', borderRadius: 4, transition: 'background 0.2s' }}
                            onMouseEnter={e => e.currentTarget.style.background = '#e8b24a'}
                            onMouseLeave={e => e.currentTarget.style.background = '#c8922a'}>
                            Browse Library <ArrowRight size={15} />
                        </Link>
                        <Link href="/upload-document" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '15px 30px', border: '1px solid rgba(255,255,255,0.25)', color: 'rgba(255,255,255,0.8)', fontWeight: 500, fontSize: 13, borderRadius: 4, transition: 'all 0.2s' }}
                            onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.7)'; e.currentTarget.style.color = '#fff'; }}
                            onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)'; e.currentTarget.style.color = 'rgba(255,255,255,0.8)'; }}>
                            Upload & Earn
                        </Link>
                    </div>
                </div>

                {/* Scroll indicator */}
                <div style={{ position: 'absolute', bottom: '2.5rem', left: '50%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, color: 'rgba(255,255,255,0.3)', fontSize: 10, letterSpacing: '0.15em', textTransform: 'uppercase', zIndex: 10, animation: 'scrollBounce 2s ease-in-out infinite' }}>
                    <ChevronDown size={16} />
                    <span>Scroll</span>
                </div>
            </section>

            {/* ══ STATS ══════════════════════════════════════════════════════════════ */}
            <section ref={statsRef} style={{ background: '#f9f6f0', borderTop: '1px solid rgba(13,31,53,0.08)', borderBottom: '1px solid rgba(13,31,53,0.08)', padding: '5rem clamp(1.25rem, 5vw, 3rem)' }}>
                <div style={{ maxWidth: 1100, margin: '0 auto' }}>
                    <div className="stats-grid">
                        <StatCard value={1000} suffix="+" label="Documents Published" triggered={statsTriggered} delay="0.05s" />
                        <StatCard value={500} suffix="+" label="Active Readers" triggered={statsTriggered} delay="0.15s" />
                        <StatCard value={10} suffix="+" label="Countries Reached" triggered={statsTriggered} delay="0.25s" />
                        <StatCard value={4.8} suffix="/5" label="Avg. User Rating" isDecimal triggered={statsTriggered} delay="0.35s" />
                        <StatCard value={80} suffix="%" label="Seller Revenue Share" triggered={statsTriggered} delay="0.45s" />
                    </div>
                </div>
            </section>

            {/* ══ MISSION ════════════════════════════════════════════════════════════ */}
            <section style={{ padding: '7rem clamp(1.25rem, 5vw, 4rem)', background: '#fff' }}>
                <div style={{ maxWidth: 1200, margin: '0 auto' }}>
                    <div className="mission-grid">
                        {/* Image collage */}
                        <div className="mission-img" style={{ position: 'relative' }}>
                            <img src="/student.jpg" alt="Students studying"
                                style={{ width: '100%', aspectRatio: '4/5', objectFit: 'cover', borderRadius: 4, display: 'block' }} />
                            <img src="https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=500&q=80" alt="Open book"
                                style={{ position: 'absolute', bottom: '-2rem', right: '-2rem', width: '55%', aspectRatio: '1', objectFit: 'cover', borderRadius: 4, border: '6px solid #fdfcfa', boxShadow: '0 20px 60px rgba(0,0,0,0.14)' }} />
                        </div>

                        {/* Text */}
                        <div>
                            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.25em', textTransform: 'uppercase', color: '#c8922a', display: 'flex', alignItems: 'center', gap: 10, marginBottom: '1.5rem' }}>
                                <span style={{ width: 28, height: 1, background: '#c8922a', display: 'inline-block' }} /> Our Mission
                            </p>
                            <h2 style={{
                                fontFamily: "'Cormorant Garamond', Georgia, serif",
                                fontWeight: 800,
                                fontSize: 'clamp(3.2rem, 7vw, 6rem)',
                                lineHeight: 0.9,
                                letterSpacing: '-0.02em',
                                color: '#0d1f35',
                                marginBottom: '2rem'
                            }}>
                                Knowledge<br />shouldn't<br />cost a<br />fortune.
                            </h2>
                            <div style={{ marginBottom: '2rem', paddingLeft: '1.5rem', borderLeft: '3px solid #c8922a' }}>
                                <p style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 'clamp(1.2rem, 2.5vw, 1.6rem)', fontStyle: 'italic', color: '#0d1f35', lineHeight: 1.4 }}>
                                    "Every student deserves the material their success depends on — regardless of where they grew up or what their family earns."
                                </p>
                            </div>
                            <p style={{ fontSize: 'clamp(0.92rem, 1.5vw, 1rem)', color: '#374151', lineHeight: 1.85, fontWeight: 300, marginBottom: '1.25rem' }}>
                                We built LAN because the textbook you need for tomorrow's exam shouldn't cost three weeks of allowance. Because your lecturer's notes shouldn't be locked behind a WhatsApp group you were never added to. Because great students in smaller cities deserve the same resources as students in Abuja or Lagos.
                            </p>
                            <p style={{ fontSize: 'clamp(0.92rem, 1.5vw, 1rem)', color: '#374151', lineHeight: 1.85, fontWeight: 300, marginBottom: '2.5rem' }}>
                                LAN is a marketplace and a library in one — built specifically for African academic life. Students browse and buy instantly. Sellers upload their materials and earn 80% of every sale. Every document is manually reviewed before it goes live. Quality is non-negotiable.
                            </p>

                            {/* 3 quick facts */}
                            <div className="quick-facts-grid">
                                {[['70+', 'Document Types'], ['48hr', 'Review Time'], ['₦0', 'Cost to Browse']].map(([val, lbl]) => (
                                    <div key={lbl} style={{ background: '#f9f6f0', padding: '1.5rem', textAlign: 'center' }}>
                                        <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 'clamp(2rem, 4vw, 2.75rem)', fontWeight: 800, color: '#0d1f35', lineHeight: 1 }}>{val}</div>
                                        <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#6b7280', marginTop: 6 }}>{lbl}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ══ TIMELINE ═══════════════════════════════════════════════════════════ */}
            <section style={{ padding: '7rem clamp(1.25rem, 5vw, 4rem)', background: '#0d1f35', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(200,146,42,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(200,146,42,0.04) 1px, transparent 1px)', backgroundSize: '80px 80px', pointerEvents: 'none' }} />
                <div style={{ maxWidth: 1200, margin: '0 auto', position: 'relative', zIndex: 2 }}>
                    <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.25em', textTransform: 'uppercase', color: '#c8922a', display: 'flex', alignItems: 'center', gap: 10, marginBottom: '1.5rem' }}>
                        <span style={{ width: 28, height: 1, background: '#c8922a', display: 'inline-block' }} /> Our Journey
                    </p>
                    <h2 style={{
                        fontFamily: "'Cormorant Garamond', Georgia, serif",
                        fontWeight: 800,
                        fontSize: 'clamp(3rem, 8vw, 7rem)',
                        lineHeight: 0.9,
                        letterSpacing: '-0.02em',
                        color: '#fff',
                        marginBottom: '4rem'
                    }}>
                        How we<br />got here.
                    </h2>
                    <div style={{ position: 'relative' }}>
                        {/* Vertical line */}
                        <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 1, background: 'linear-gradient(to bottom, #c8922a, rgba(200,146,42,0.05))' }} />
                        {timeline.map((item, i) => (
                            <div key={item.year} className="timeline-row" style={{ paddingBottom: i < timeline.length - 1 ? '3.5rem' : 0 }}>
                                <div style={{ position: 'absolute', left: -4, top: 7, width: 9, height: 9, borderRadius: '50%', background: '#c8922a', border: '2px solid #0d1f35', boxShadow: '0 0 0 4px rgba(200,146,42,0.2)' }} />
                                <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 'clamp(0.85rem, 1.5vw, 1.05rem)', fontWeight: 700, color: '#c8922a', paddingTop: 2, flexShrink: 0 }}>{item.year}</div>
                                <div>
                                    <div style={{ fontSize: 'clamp(0.95rem, 1.5vw, 1.1rem)', fontWeight: 700, color: '#fff', marginBottom: '0.5rem' }}>{item.title}</div>
                                    <div style={{ fontSize: 'clamp(0.82rem, 1.3vw, 0.9rem)', color: 'rgba(255,255,255,0.5)', lineHeight: 1.75, fontWeight: 300 }}>{item.body}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ══ OFFERINGS ══════════════════════════════════════════════════════════ */}
            <section style={{ padding: '7rem clamp(1.25rem, 5vw, 4rem)', background: '#f9f6f0' }}>
                <div style={{ maxWidth: 1200, margin: '0 auto' }}>
                    <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.25em', textTransform: 'uppercase', color: '#c8922a', display: 'flex', alignItems: 'center', gap: 10, marginBottom: '1.5rem' }}>
                        <span style={{ width: 28, height: 1, background: '#c8922a', display: 'inline-block' }} /> The Platform
                    </p>
                    <h2 style={{
                        fontFamily: "'Cormorant Garamond', Georgia, serif",
                        fontWeight: 800,
                        fontSize: 'clamp(3rem, 8vw, 7rem)',
                        lineHeight: 0.9,
                        letterSpacing: '-0.02em',
                        color: '#0d1f35',
                        marginBottom: '1.5rem'
                    }}>
                        Built for<br />everyone<br />in the room.
                    </h2>
                    <p style={{ fontSize: 'clamp(0.92rem, 1.5vw, 1.05rem)', color: '#374151', lineHeight: 1.8, fontWeight: 300, maxWidth: 560, marginBottom: '4rem' }}>
                        Whether you're cramming for a Monday exam, monetising years of carefully curated lecture notes, or distributing course materials to 300 students — LAN was designed for your exact workflow.
                    </p>
                    <div className="offerings-grid">
                        {offerings.map((o) => (
                            <div key={o.title} className="offering-card">
                                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'linear-gradient(90deg, #1a3a5c, #c8922a)' }} />
                                <span style={{ fontSize: 'clamp(2rem, 4vw, 2.5rem)', display: 'block', marginBottom: '1rem' }}>{o.emoji}</span>
                                <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 'clamp(1.6rem, 3vw, 2rem)', fontWeight: 700, color: '#0d1f35', marginBottom: '0.4rem' }}>{o.title}</div>
                                <div style={{ fontSize: '0.82rem', color: '#c8922a', fontWeight: 600, marginBottom: '1.5rem', letterSpacing: '0.02em' }}>{o.subtitle}</div>
                                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                                    {o.items.map(item => (
                                        <li key={item} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, fontSize: 'clamp(0.82rem, 1.3vw, 0.9rem)', color: '#374151', fontWeight: 400, lineHeight: 1.5 }}>
                                            <span style={{ width: 18, height: 1, background: '#c8922a', flexShrink: 0, marginTop: '0.6rem', display: 'inline-block' }} />
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ══ VALUES ═════════════════════════════════════════════════════════════ */}
            <section style={{ padding: '7rem clamp(1.25rem, 5vw, 4rem)', background: '#fff' }}>
                <div style={{ maxWidth: 1200, margin: '0 auto' }}>
                    <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.25em', textTransform: 'uppercase', color: '#c8922a', display: 'flex', alignItems: 'center', gap: 10, marginBottom: '1.5rem' }}>
                        <span style={{ width: 28, height: 1, background: '#c8922a', display: 'inline-block' }} /> What We Stand For
                    </p>
                    <h2 style={{
                        fontFamily: "'Cormorant Garamond', Georgia, serif",
                        fontWeight: 800,
                        fontSize: 'clamp(3rem, 8vw, 7rem)',
                        lineHeight: 0.9,
                        letterSpacing: '-0.02em',
                        color: '#0d1f35',
                        marginBottom: '4rem'
                    }}>
                        Principles,<br />not promises.
                    </h2>
                    <div className="values-grid">
                        {values.map((val) => (
                            <div key={val.title} className="value-card">
                                <div style={{ width: 44, height: 44, border: '1px solid rgba(13,31,53,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem', color: '#1a3a5c' }}>
                                    <val.icon size={20} />
                                </div>
                                <div style={{ fontSize: 'clamp(0.95rem, 1.5vw, 1.1rem)', fontWeight: 700, color: '#0d1f35', marginBottom: '0.75rem' }}>{val.title}</div>
                                <div style={{ fontSize: 'clamp(0.82rem, 1.3vw, 0.88rem)', color: '#6b7280', lineHeight: 1.8, fontWeight: 300 }}>{val.description}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ══ DOCUMENT SCOPE ═════════════════════════════════════════════════════ */}
            <section style={{ padding: '7rem clamp(1.25rem, 5vw, 4rem)', background: '#f9f6f0' }}>
                <div style={{ maxWidth: 1200, margin: '0 auto' }}>
                    <div className="doc-scope-grid">
                        <div>
                            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.25em', textTransform: 'uppercase', color: '#c8922a', display: 'flex', alignItems: 'center', gap: 10, marginBottom: '1.5rem' }}>
                                <span style={{ width: 28, height: 1, background: '#c8922a', display: 'inline-block' }} /> The Library
                            </p>
                            <h2 style={{
                                fontFamily: "'Cormorant Garamond', Georgia, serif",
                                fontWeight: 800,
                                fontSize: 'clamp(3rem, 7vw, 6rem)',
                                lineHeight: 0.9,
                                letterSpacing: '-0.02em',
                                color: '#0d1f35',
                                marginBottom: '2rem'
                            }}>
                                Every<br />document.<br />Every<br />level.
                            </h2>
                            <p style={{ fontSize: 'clamp(0.92rem, 1.5vw, 1rem)', color: '#374151', lineHeight: 1.85, fontWeight: 300, marginBottom: '1.25rem' }}>
                                From JSS1 revision packs to PhD dissertations. From WAEC past questions and JAMB CBT simulators to medical school lecture notes, law case briefs, and engineering formula sheets. If a Nigerian or African student needs it, it belongs on LAN.
                            </p>
                            <p style={{ fontSize: 'clamp(0.92rem, 1.5vw, 1rem)', color: '#374151', lineHeight: 1.85, fontWeight: 300 }}>
                                Our catalogue spans <strong style={{ color: '#0d1f35', fontWeight: 700 }}>70+ document types</strong> across core academic, exam prep, research, practical, professional, and digital categories — all tagged by level, course code, semester, and institution type so you always find what you need.
                            </p>
                        </div>
                        <div className="doc-cat-grid">
                            {docCategories.map(([title, desc]) => (
                                <div key={title} className="doc-cat-card">
                                    <div style={{ fontSize: 'clamp(0.8rem, 1.3vw, 0.85rem)', fontWeight: 700, color: '#0d1f35', marginBottom: '0.5rem' }}>{title}</div>
                                    <div style={{ fontSize: 'clamp(0.75rem, 1.2vw, 0.8rem)', color: '#6b7280', lineHeight: 1.7, fontWeight: 300 }}>{desc}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* ══ CTA ════════════════════════════════════════════════════════════════ */}
            <section style={{ padding: '7rem clamp(1.25rem, 5vw, 4rem)', background: '#0d1f35', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 70% 50%, rgba(200,146,42,0.1) 0%, transparent 60%)', pointerEvents: 'none' }} />
                <div style={{ maxWidth: 1200, margin: '0 auto', position: 'relative', zIndex: 2 }}>
                    <div className="cta-grid">
                        <div>
                            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.25em', textTransform: 'uppercase', color: '#c8922a', display: 'flex', alignItems: 'center', gap: 10, marginBottom: '1.5rem' }}>
                                <span style={{ width: 28, height: 1, background: '#c8922a', display: 'inline-block' }} /> Ready?
                            </p>
                            <h2 style={{
                                fontFamily: "'Cormorant Garamond', Georgia, serif",
                                fontWeight: 800,
                                fontSize: 'clamp(3.5rem, 10vw, 8.5rem)',
                                lineHeight: 0.9,
                                letterSpacing: '-0.02em',
                                color: '#fff'
                            }}>
                                Start learning.<br />
                                Start <span style={{ color: '#c8922a' }}>earning.</span>
                            </h2>
                        </div>
                        <div style={{ paddingBottom: '0.5rem' }}>
                            <p style={{ fontSize: 'clamp(0.92rem, 1.5vw, 1rem)', color: 'rgba(255,255,255,0.48)', lineHeight: 1.8, fontWeight: 300, maxWidth: 420, marginBottom: '2rem' }}>
                                Join thousands of students and sellers building Africa's academic knowledge economy — one document at a time. Your next upload could fund your semester. Your next download could change your result.
                            </p>
                            <div className="cta-btns">
                                <Link href="/documents"
                                    style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '15px 30px', background: '#c8922a', color: '#0d1f35', fontWeight: 700, fontSize: 13, letterSpacing: '0.05em', textTransform: 'uppercase', borderRadius: 4, transition: 'background 0.2s' }}
                                    onMouseEnter={e => e.currentTarget.style.background = '#e8b24a'}
                                    onMouseLeave={e => e.currentTarget.style.background = '#c8922a'}>
                                    Browse Library <ArrowRight size={15} />
                                </Link>
                                <Link href="/referrals"
                                    style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '15px 30px', border: '1px solid rgba(255,255,255,0.25)', color: 'rgba(255,255,255,0.8)', fontWeight: 500, fontSize: 13, borderRadius: 4, transition: 'all 0.2s' }}
                                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.7)'; e.currentTarget.style.color = '#fff'; }}
                                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)'; e.currentTarget.style.color = 'rgba(255,255,255,0.8)'; }}>
                                    Invite Friends
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

        </div>
    );
}