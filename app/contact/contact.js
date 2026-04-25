'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
    Mail, Phone, MapPin, Send, Clock, ShieldCheck, Users, BookOpen,
    ArrowRight, ChevronDown, MessageSquare, Zap, Globe, Star, CheckCircle
} from 'lucide-react';
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from 'next/navigation';
import { auth } from "@/lib/firebaseConfig";
import Navbar from '@/components/NavBar';
import Footer from '@/components/FooterComp';

// ── IN-VIEW HOOK ──────────────────────────────────────────────────────────────
function useInView(threshold = 0.15) {
    const ref = useRef(null);
    const [inView, setInView] = useState(false);
    useEffect(() => {
        const obs = new IntersectionObserver(([e]) => {
            if (e.isIntersecting) setInView(true);
        }, { threshold });
        if (ref.current) obs.observe(ref.current);
        return () => obs.disconnect();
    }, [threshold]);
    return [ref, inView];
}

// ── ANIMATED SECTION WRAPPER ──────────────────────────────────────────────────
function Reveal({ children, delay = '0s', style = {} }) {
    const [ref, inView] = useInView(0.1);
    return (
        <div ref={ref} style={{
            opacity: inView ? 1 : 0,
            transform: inView ? 'translateY(0)' : 'translateY(28px)',
            transition: `opacity 0.75s ease ${delay}, transform 0.75s ease ${delay}`,
            ...style
        }}>
            {children}
        </div>
    );
}

// ── CONSTANTS ─────────────────────────────────────────────────────────────────
const APPROACH_TABS = [
    { id: 'trust', label: 'Trust & Safety' },
    { id: 'creators', label: 'Creators & Partners' },
    { id: 'ip', label: 'Copyright & IP' },
];

const APPROACH_CONTENT = {
    trust: {
        heading: 'Every transaction, every user, every document — protected.',
        body: [
            'LAN Library is built on accountability. We believe open access to knowledge elevates everyone, but that access must be earned — through verified sellers, encrypted payments, and quality-reviewed content.',
            'Our security infrastructure meets international standards. User data stays private. Payments are processed through end-to-end encrypted channels. Nothing goes live without a manual check by our review team.',
        ],
        cards: [
            { title: 'Payment Security', body: 'Industry-standard encryption on every transaction. Your money — and your sellers\' earnings — never touch an unsecured channel.', stroke: '#16a34a' },
            { title: 'Verified Sellers', body: 'Every seller passes a verification process before their first document goes live. Fake accounts and recycled content don\'t make it through.', stroke: '#1a56db' },
            { title: 'Digital Watermarking', body: 'Purchased documents carry unique digital fingerprints. Unauthorised redistribution is identifiable and actionable on our end.', stroke: '#c8922a' },
            { title: 'Transparent Policies', body: 'No hidden terms. Every user — buyer, seller, or lecturer — has access to the same clear, plain-language policies that govern the platform.', stroke: '#dc2626' },
        ],
        steps: null,
        callout: null,
    },
    creators: {
        heading: 'If you created it, you should earn from it — on your terms.',
        body: [
            'Lecturers spend years building materials. Students compile brilliant revision packs. Researchers produce work that rarely finds an audience. LAN gives all of them a marketplace that rewards the effort behind the document.',
            'You set the price. You keep 80% of every sale — the highest revenue share in any academic marketplace in Africa. Earnings hit your wallet instantly, with full analytics on every download.',
        ],
        cards: null,
        steps: [
            { title: 'Register as a seller', body: 'Complete your seller profile. Verification is quick — most creators are approved within 24 hours of submission.' },
            { title: 'Upload your document', body: 'PDF or Google Drive link. Add a title, category, level, institution type, course code, and your price. Done in under 5 minutes.' },
            { title: 'Pass the quality review', body: 'Our team manually reviews every submission within 48 hours. We check for originality, formatting, relevance, and accuracy.' },
            { title: 'Start earning — indefinitely', body: 'Once live, your document earns on every download. No expiry. No delistings without notice. Your catalogue grows while you sleep.' },
        ],
        callout: {
            label: 'How your wallet works',
            text: 'When a buyer purchases your document, their payment is processed instantly and 80% is credited to your LAN wallet. Every transaction is logged and auditable. Withdraw anytime — no minimum threshold, no waiting period.',
        },
    },
    ip: {
        heading: 'You own your work. We just help you distribute it.',
        body: [
            'LAN Library is a distribution platform, not a rights holder. Every document you upload stays entirely yours. We do not claim ownership, resell rights, or repurpose your content in any way.',
            'Our review process checks every submission for originality before it goes live. Plagiarised content is rejected and the submitter is flagged. Digital watermarks on purchased documents ensure that redistribution outside the platform is traceable.',
        ],
        cards: [
            { title: 'Full Ownership Retained', body: 'Creators retain 100% of the intellectual property in everything they upload. Listing on LAN grants us a non-exclusive distribution licence only.', stroke: '#7c3aed' },
            { title: 'Originality Verified', body: 'Every submission is reviewed for originality before going live. Content that appears copied or recycled is rejected without exception.', stroke: '#15803d' },
            { title: 'Watermark Tracking', body: 'Every purchased document carries a unique digital watermark tied to the buyer\'s account. If it\'s shared without authorisation, we can trace it.', stroke: '#1d4ed8' },
        ],
        steps: null,
        callout: null,
    },
};

// ── COMPONENT ─────────────────────────────────────────────────────────────────
export default function ContactClient() {
    const router = useRouter();
    const [user, setUser] = useState(null);
    const [checkingAuth, setCheckingAuth] = useState(true);
    const [activeTab, setActiveTab] = useState('trust');
    const [loaded, setLoaded] = useState(false);
    const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '', type: 'general' });
    const [sending, setSending] = useState(false);
    const [sent, setSent] = useState(false);

    useEffect(() => { setTimeout(() => setLoaded(true), 80); }, []);

    useEffect(() => {
        const unsub = onAuthStateChanged(auth, (u) => {
            if (u) setUser(u);
            else router.push('/auth/signin');
            setCheckingAuth(false);
        });
        return () => unsub();
    }, [router]);

    const handleSubmit = () => {
        if (!formData.name || !formData.email || !formData.message) {
            alert('Please fill in all required fields.');
            return;
        }
        setSending(true);
        setTimeout(() => {
            setSending(false);
            setSent(true);
            setFormData({ name: '', email: '', subject: '', message: '', type: 'general' });
            setTimeout(() => setSent(false), 6000);
        }, 1600);
    };

    if (checkingAuth) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fdfcfa' }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ width: 44, height: 44, border: '2px solid #0d1f35', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto' }} />
                    <p style={{ marginTop: 16, color: '#6b7280', fontSize: 14 }}>Loading…</p>
                </div>
            </div>
        );
    }

    const v = loaded ? { opacity: 1, transform: 'translateY(0)' } : { opacity: 0, transform: 'translateY(28px)' };
    const t = (d) => ({ transition: `opacity 0.8s ease ${d}, transform 0.8s ease ${d}` });
    const tab = APPROACH_CONTENT[activeTab];

    return (
        <div style={{ fontFamily: "'Sora', system-ui, sans-serif", background: '#fdfcfa', color: '#111827', overflowX: 'hidden' }}>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;0,800;1,400;1,600&family=Sora:wght@300;400;500;600;700&display=swap');

                @keyframes fadeUp { to { opacity: 1; transform: translateY(0); } }
                @keyframes scrollBounce {
                    0%, 100% { transform: translateX(-50%) translateY(0); }
                    50% { transform: translateX(-50%) translateY(7px); }
                }
                @keyframes spin { to { transform: rotate(360deg); } }
                @keyframes pulse { 0%,100%{opacity:1}50%{opacity:0.5} }

                * { box-sizing: border-box; margin: 0; padding: 0; }
                a { text-decoration: none; color: inherit; }

                .contact-form-input {
                    width: 100%;
                    padding: 14px 18px;
                    font-size: 14px;
                    font-family: 'Sora', system-ui, sans-serif;
                    color: #111827;
                    background: #fff;
                    border: 1px solid rgba(13,31,53,0.12);
                    outline: none;
                    transition: border-color 0.2s;
                }
                .contact-form-input:focus { border-color: #0d1f35; }
                .contact-form-input::placeholder { color: rgba(17,24,39,0.3); }

                .approach-tab {
                    font-size: 12px;
                    font-weight: 600;
                    letter-spacing: 0.04em;
                    padding: 10px 22px;
                    border: 1px solid rgba(13,31,53,0.12);
                    cursor: pointer;
                    transition: all 0.2s;
                    background: transparent;
                    font-family: 'Sora', system-ui, sans-serif;
                }
                .approach-tab.active { background: #0d1f35; color: #fff; border-color: #0d1f35; }
                .approach-tab:not(.active) { color: #6b7280; }
                .approach-tab:not(.active):hover { border-color: #0d1f35; color: #0d1f35; }

                .info-card {
                    background: #fff;
                    border: 1px solid rgba(13,31,53,0.08);
                    padding: 2rem;
                    transition: transform 0.25s, box-shadow 0.25s;
                }
                .info-card:hover { transform: translateY(-4px); box-shadow: 0 20px 50px rgba(13,31,53,0.09); }

                .approach-card {
                    background: #fff;
                    border: 1px solid rgba(13,31,53,0.08);
                    padding: 1.75rem;
                    border-left-width: 3px;
                    transition: background 0.2s;
                }
                .approach-card:hover { background: #f9f6f0; }

                /* grids */
                .hero-meta-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1px; background: rgba(200,146,42,0.15); border: 1px solid rgba(200,146,42,0.15); }
                .contact-grid { display: grid; grid-template-columns: 1.1fr 0.9fr; gap: 5rem; align-items: start; }
                .channels-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 2rem; }
                .faq-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1px; background: rgba(13,31,53,0.08); border: 1px solid rgba(13,31,53,0.08); }
                .response-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1px; background: rgba(13,31,53,0.08); border: 1px solid rgba(13,31,53,0.08); }
                .approach-cards-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.25rem; margin-top: 2.5rem; }

                @media (max-width: 1024px) {
                    .contact-grid { grid-template-columns: 1fr; gap: 3.5rem; }
                    .channels-grid { grid-template-columns: 1fr; }
                    .hero-meta-grid { grid-template-columns: repeat(2, 1fr); }
                }
                @media (max-width: 768px) {
                    .faq-grid { grid-template-columns: 1fr; }
                    .approach-cards-grid { grid-template-columns: 1fr; }
                    .response-grid { grid-template-columns: repeat(2, 1fr); }
                    section { padding: 4.5rem 1.25rem !important; }
                }
                @media (max-width: 480px) {
                    .hero-meta-grid { grid-template-columns: 1fr 1fr; }
                    .response-grid { grid-template-columns: 1fr 1fr; }
                }
            `}</style>


            {/* ══ HERO ══════════════════════════════════════════════════════════════ */}
            <section style={{
                minHeight: '100vh',
                background: '#0d1f35',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
            }}>
                {/* Grain overlay */}
                <div style={{ position: 'absolute', inset: 0, backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E\")", opacity: 0.5, pointerEvents: 'none' }} />
                {/* Grid */}
                <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(200,146,42,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(200,146,42,0.05) 1px, transparent 1px)', backgroundSize: '80px 80px', pointerEvents: 'none' }} />
                {/* Glow right */}
                <div style={{ position: 'absolute', top: '-15%', right: '-8%', width: '55vw', height: '55vw', maxWidth: 650, maxHeight: 650, background: 'radial-gradient(circle, rgba(200,146,42,0.10) 0%, transparent 65%)', pointerEvents: 'none' }} />
                {/* Glow left-bottom */}
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
                    zIndex: 10,
                }}>
                    {/* Eyebrow */}
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, fontSize: 11, fontWeight: 600, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#c8922a', marginBottom: '2rem', ...v, ...t('0s') }}>
                        <span style={{ width: 32, height: 1, background: '#c8922a', display: 'inline-block' }} />
                        Contact & Support — LAN Library
                    </div>

                    {/* Headline */}
                    <h1 style={{
                        fontFamily: "'Cormorant Garamond', Georgia, serif",
                        fontWeight: 800,
                        fontSize: 'clamp(4rem, 13vw, 10.5rem)',
                        lineHeight: 0.88,
                        letterSpacing: '-0.02em',
                        color: '#fff',
                        margin: '0 0 2.5rem',
                        ...v, ...t('0.15s'),
                    }}>
                        Let's<br />
                        talk<br />
                        <span style={{ color: '#c8922a' }}>directly.</span>
                    </h1>

                    <p style={{
                        fontSize: 'clamp(1rem, 2.2vw, 1.2rem)',
                        color: 'rgba(255,255,255,0.52)',
                        maxWidth: 560,
                        lineHeight: 1.85,
                        fontWeight: 300,
                        marginBottom: '3.5rem',
                        ...v, ...t('0.3s'),
                    }}>
                        Whether you're a student looking for resources, a seller with questions about earnings, a lecturer wanting to distribute course materials, or a university exploring a partnership — we're here and we respond.
                    </p>

                    {/* Hero meta strip */}
                    <div className="hero-meta-grid" style={{ maxWidth: 700, ...v, ...t('0.45s') }}>
                        {[
                            { val: '24h', label: 'Support response' },
                            { val: '48h', label: 'General inquiries' },
                            { val: '1h', label: 'Billing & urgent' },
                            { val: '72h', label: 'Partnerships' },
                        ].map(({ val, label }) => (
                            <div key={label} style={{ padding: '1.5rem 1.25rem', background: 'rgba(255,255,255,0.03)' }}>
                                <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 'clamp(1.8rem, 4vw, 2.5rem)', fontWeight: 800, color: '#c8922a', lineHeight: 1 }}>{val}</div>
                                <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', marginTop: 6 }}>{label}</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Scroll indicator */}
                <div style={{ position: 'absolute', bottom: '2.5rem', left: '50%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, color: 'rgba(255,255,255,0.28)', fontSize: 10, letterSpacing: '0.15em', textTransform: 'uppercase', zIndex: 10, animation: 'scrollBounce 2s ease-in-out infinite' }}>
                    <ChevronDown size={16} />
                    <span>Scroll</span>
                </div>
            </section>

            {/* ══ CONTACT FORM + CHANNELS ════════════════════════════════════════════ */}
            <section style={{ padding: '7rem clamp(1.25rem, 5vw, 4rem)', background: '#fff' }}>
                <div style={{ maxWidth: 1200, margin: '0 auto' }}>
                    <div className="contact-grid">

                        {/* LEFT — FORM */}
                        <Reveal>
                            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.25em', textTransform: 'uppercase', color: '#c8922a', display: 'flex', alignItems: 'center', gap: 10, marginBottom: '1.5rem' }}>
                                <span style={{ width: 28, height: 1, background: '#c8922a', display: 'inline-block' }} /> Send a Message
                            </p>
                            <h2 style={{
                                fontFamily: "'Cormorant Garamond', Georgia, serif",
                                fontWeight: 800,
                                fontSize: 'clamp(3rem, 7vw, 5.5rem)',
                                lineHeight: 0.9,
                                letterSpacing: '-0.02em',
                                color: '#0d1f35',
                                marginBottom: '2.5rem',
                            }}>
                                We read<br />every<br />message.
                            </h2>

                            {/* Inquiry type pills */}
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: '2rem' }}>
                                {[
                                    { id: 'general', label: 'General' },
                                    { id: 'buyer', label: 'Buyer support' },
                                    { id: 'seller', label: 'Seller / earnings' },
                                    { id: 'lecturer', label: 'Lecturer access' },
                                    { id: 'partnership', label: 'Partnership' },
                                    { id: 'copyright', label: 'Copyright issue' },
                                ].map(({ id, label }) => (
                                    <button
                                        key={id}
                                        onClick={() => setFormData(p => ({ ...p, type: id }))}
                                        style={{
                                            fontSize: 11,
                                            fontWeight: 600,
                                            letterSpacing: '0.06em',
                                            padding: '7px 16px',
                                            border: '1px solid',
                                            borderColor: formData.type === id ? '#0d1f35' : 'rgba(13,31,53,0.14)',
                                            background: formData.type === id ? '#0d1f35' : 'transparent',
                                            color: formData.type === id ? '#fff' : '#6b7280',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s',
                                            fontFamily: "'Sora', system-ui, sans-serif",
                                        }}
                                    >
                                        {label}
                                    </button>
                                ))}
                            </div>

                            {/* Success banner */}
                            {sent && (
                                <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '1.25rem 1.5rem', marginBottom: '1.75rem', display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                                    <CheckCircle size={18} color="#16a34a" style={{ flexShrink: 0, marginTop: 2 }} />
                                    <div>
                                        <p style={{ fontSize: 13, fontWeight: 700, color: '#15803d', marginBottom: 2 }}>Message sent successfully.</p>
                                        <p style={{ fontSize: 12, color: '#16a34a', fontWeight: 300 }}>We'll get back to you within 24–48 hours.</p>
                                    </div>
                                </div>
                            )}

                            {/* Form fields */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                                    <div>
                                        <label style={{ display: 'block', fontSize: 10, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#9ca3af', marginBottom: 8 }}>Your name *</label>
                                        <input className="contact-form-input" type="text" value={formData.name} onChange={e => setFormData(p => ({ ...p, name: e.target.value }))} placeholder="Full name" />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: 10, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#9ca3af', marginBottom: 8 }}>Email address *</label>
                                        <input className="contact-form-input" type="email" value={formData.email} onChange={e => setFormData(p => ({ ...p, email: e.target.value }))} placeholder="you@example.com" />
                                    </div>
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: 10, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#9ca3af', marginBottom: 8 }}>Subject</label>
                                    <input className="contact-form-input" type="text" value={formData.subject} onChange={e => setFormData(p => ({ ...p, subject: e.target.value }))} placeholder="Brief description of your inquiry" />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: 10, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#9ca3af', marginBottom: 8 }}>Message *</label>
                                    <textarea className="contact-form-input" value={formData.message} onChange={e => setFormData(p => ({ ...p, message: e.target.value }))} placeholder="Tell us everything — the more detail, the faster we can help." rows={6} style={{ resize: 'none' }} />
                                </div>
                                <button
                                    onClick={handleSubmit}
                                    disabled={sending}
                                    style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: 10,
                                        padding: '16px 32px',
                                        background: sending ? '#6b7280' : '#0d1f35',
                                        color: '#fff',
                                        fontSize: 12,
                                        fontWeight: 700,
                                        letterSpacing: '0.08em',
                                        textTransform: 'uppercase',
                                        border: 'none',
                                        cursor: sending ? 'not-allowed' : 'pointer',
                                        transition: 'background 0.2s',
                                        fontFamily: "'Sora', system-ui, sans-serif",
                                        alignSelf: 'flex-start',
                                    }}
                                    onMouseEnter={e => { if (!sending) e.currentTarget.style.background = '#1a3a5c'; }}
                                    onMouseLeave={e => { if (!sending) e.currentTarget.style.background = '#0d1f35'; }}
                                >
                                    <Send size={14} />
                                    {sending ? 'Sending…' : 'Send Message'}
                                </button>
                            </div>
                        </Reveal>

                        {/* RIGHT — CONTACT INFO */}
                        <Reveal delay="0.15s">
                            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.25em', textTransform: 'uppercase', color: '#c8922a', display: 'flex', alignItems: 'center', gap: 10, marginBottom: '1.5rem' }}>
                                <span style={{ width: 28, height: 1, background: '#c8922a', display: 'inline-block' }} /> Direct Contacts
                            </p>
                            <h2 style={{
                                fontFamily: "'Cormorant Garamond', Georgia, serif",
                                fontWeight: 800,
                                fontSize: 'clamp(3rem, 7vw, 5.5rem)',
                                lineHeight: 0.9,
                                letterSpacing: '-0.02em',
                                color: '#0d1f35',
                                marginBottom: '3rem',
                            }}>
                                Reach us<br />your way.
                            </h2>

                            {/* Contact channels */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', marginBottom: '3rem' }}>
                                {[
                                    {
                                        icon: Mail,
                                        label: 'Email',
                                        primary: 'support@lanlibrary.com',
                                        secondary: 'sales@lanlibrary.com',
                                        note: 'For document disputes, billing, and creator support',
                                    },
                                    {
                                        icon: Phone,
                                        label: 'Phone',
                                        primary: '+234 800 123 4567',
                                        secondary: null,
                                        note: 'Mon–Fri, 9am–6pm West Africa Time',
                                    },
                                    {
                                        icon: MapPin,
                                        label: 'Office',
                                        primary: '123 Knowledge Street, Abuja',
                                        secondary: 'FCT 900001, Nigeria',
                                        note: 'Walk-ins by appointment only',
                                    },
                                ].map(({ icon: Icon, label, primary, secondary, note }) => (
                                    <div key={label} style={{ display: 'flex', alignItems: 'flex-start', gap: '1.25rem' }}>
                                        <div style={{ width: 48, height: 48, background: '#0d1f35', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                            <Icon size={18} color="#c8922a" />
                                        </div>
                                        <div>
                                            <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#9ca3af', marginBottom: 5 }}>{label}</p>
                                            <p style={{ fontSize: 14, fontWeight: 600, color: '#0d1f35', marginBottom: secondary ? 2 : 0 }}>{primary}</p>
                                            {secondary && <p style={{ fontSize: 13, color: '#374151', marginBottom: 2 }}>{secondary}</p>}
                                            <p style={{ fontSize: 11, color: '#9ca3af', fontWeight: 300, marginTop: 4 }}>{note}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Response times */}
                            <div>
                                <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#6b7280', marginBottom: '1rem' }}>Response Times</p>
                                <div className="response-grid">
                                    {[
                                        { val: '1h', label: 'Billing & urgent' },
                                        { val: '24h', label: 'Support tickets' },
                                        { val: '48h', label: 'General inquiries' },
                                        { val: '72h', label: 'Partnership requests' },
                                    ].map(({ val, label }) => (
                                        <div key={label} style={{ background: '#f9f6f0', padding: '1.25rem' }}>
                                            <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 'clamp(1.6rem, 3vw, 2.2rem)', fontWeight: 800, color: '#0d1f35', lineHeight: 1 }}>{val}</div>
                                            <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#9ca3af', marginTop: 5 }}>{label}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </Reveal>
                    </div>
                </div>
            </section>

            {/* ══ CONTACT CHANNELS (3 cards) ════════════════════════════════════════ */}
            <section style={{ padding: '7rem clamp(1.25rem, 5vw, 4rem)', background: '#f9f6f0', borderTop: '1px solid rgba(13,31,53,0.07)', borderBottom: '1px solid rgba(13,31,53,0.07)' }}>
                <div style={{ maxWidth: 1200, margin: '0 auto' }}>
                    <Reveal>
                        <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.25em', textTransform: 'uppercase', color: '#c8922a', display: 'flex', alignItems: 'center', gap: 10, marginBottom: '1.5rem' }}>
                            <span style={{ width: 28, height: 1, background: '#c8922a', display: 'inline-block' }} /> Who Are You?
                        </p>
                        <h2 style={{
                            fontFamily: "'Cormorant Garamond', Georgia, serif",
                            fontWeight: 800,
                            fontSize: 'clamp(3rem, 8vw, 7rem)',
                            lineHeight: 0.9,
                            letterSpacing: '-0.02em',
                            color: '#0d1f35',
                            marginBottom: '1.25rem',
                        }}>
                            We support<br />everyone<br />on the platform.
                        </h2>
                        <p style={{ fontSize: 'clamp(0.92rem, 1.5vw, 1.05rem)', color: '#374151', lineHeight: 1.8, fontWeight: 300, maxWidth: 520, marginBottom: '4rem' }}>
                            Different users have different needs. Here's what we handle for each group — and how to get to the right person quickly.
                        </p>
                    </Reveal>

                    <div className="channels-grid">
                        {[
                            {
                                emoji: '🎓',
                                title: 'Students & Buyers',
                                tag: 'support@lanlibrary.com',
                                items: [
                                    'Payment failed or double-charged',
                                    'Document not downloading after purchase',
                                    'Can\'t find a specific textbook or course code',
                                    'Request a document that\'s not in the library',
                                    'Account access or login issues',
                                ],
                            },
                            {
                                emoji: '✍️',
                                title: 'Sellers & Creators',
                                tag: 'sellers@lanlibrary.com',
                                items: [
                                    'Document pending review for over 48 hours',
                                    'Dispute on earnings or commission deductions',
                                    'Withdrawal request not processed',
                                    'Upload rejected — need clarification',
                                    'Analytics dashboard discrepancies',
                                ],
                            },
                            {
                                emoji: '📚',
                                title: 'Lecturers & Institutions',
                                tag: 'partners@lanlibrary.com',
                                items: [
                                    'Verified lecturer badge and department listing',
                                    'Bulk distribution of course materials',
                                    'Institutional licensing and pricing',
                                    'University partnership and integration',
                                    'Co-branded academic resource pages',
                                ],
                            },
                        ].map((ch) => (
                            <Reveal key={ch.title}>
                                <div className="info-card" style={{ height: '100%' }}>
                                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'linear-gradient(90deg, #1a3a5c, #c8922a)', position: 'relative' }} />
                                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'linear-gradient(90deg, #1a3a5c, #c8922a)' }} />
                                    <span style={{ fontSize: 'clamp(2rem, 4vw, 2.5rem)', display: 'block', marginBottom: '1rem', marginTop: '1rem' }}>{ch.emoji}</span>
                                    <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 'clamp(1.5rem, 2.5vw, 1.9rem)', fontWeight: 700, color: '#0d1f35', marginBottom: '0.5rem' }}>{ch.title}</div>
                                    <div style={{ fontSize: 11, color: '#c8922a', fontWeight: 600, letterSpacing: '0.04em', marginBottom: '1.5rem' }}>{ch.tag}</div>
                                    <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                        {ch.items.map(item => (
                                            <li key={item} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, fontSize: 'clamp(0.82rem, 1.3vw, 0.88rem)', color: '#374151', lineHeight: 1.5, fontWeight: 300 }}>
                                                <span style={{ width: 18, height: 1, background: '#c8922a', flexShrink: 0, marginTop: '0.55rem', display: 'inline-block' }} />
                                                {item}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </Reveal>
                        ))}
                    </div>
                </div>
            </section>

            {/* ══ FAQ ═══════════════════════════════════════════════════════════════ */}
            <section style={{ padding: '7rem clamp(1.25rem, 5vw, 4rem)', background: '#fff' }}>
                <div style={{ maxWidth: 1200, margin: '0 auto' }}>
                    <Reveal>
                        <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.25em', textTransform: 'uppercase', color: '#c8922a', display: 'flex', alignItems: 'center', gap: 10, marginBottom: '1.5rem' }}>
                            <span style={{ width: 28, height: 1, background: '#c8922a', display: 'inline-block' }} /> Before You Write
                        </p>
                        <h2 style={{
                            fontFamily: "'Cormorant Garamond', Georgia, serif",
                            fontWeight: 800,
                            fontSize: 'clamp(3rem, 8vw, 7rem)',
                            lineHeight: 0.9,
                            letterSpacing: '-0.02em',
                            color: '#0d1f35',
                            marginBottom: '4rem',
                        }}>
                            Quick<br />answers.
                        </h2>
                    </Reveal>
                    <div className="faq-grid">
                        {[
                            {
                                q: 'How long does document review take?',
                                a: 'All submitted documents are reviewed manually within 48 hours of upload. You\'ll receive an email notification when your document is approved, rejected, or flagged for revision.',
                            },
                            {
                                q: 'What\'s the seller revenue share?',
                                a: 'Sellers keep 80% of every sale — permanently. The platform retains a 20% commission to cover payment processing, hosting, review, and support. There are no hidden deductions.',
                            },
                            {
                                q: 'Can I upload a document for free distribution?',
                                a: 'Yes. When uploading, set your price to ₦0. Free documents still go through the same quality review process and will be listed in the public library.',
                            },
                            {
                                q: 'How do I withdraw my earnings?',
                                a: 'Go to your seller dashboard, click "Withdraw", and enter your bank details. Withdrawals are processed within 1–3 business days. There is no minimum withdrawal amount.',
                            },
                            {
                                q: 'What file formats are accepted?',
                                a: 'PDF is the primary format. We also accept Google Drive links to hosted documents. Files must be under 50MB. Documents in image-only format (non-searchable scans) may be rejected.',
                            },
                            {
                                q: 'My purchase isn\'t in my library — what do I do?',
                                a: 'First, refresh your library page. If the document still isn\'t there within 10 minutes of a successful payment, contact support@lanlibrary.com with your transaction reference and we\'ll resolve it within 1 hour.',
                            },
                            {
                                q: 'Does LAN work outside Nigeria?',
                                a: 'Yes. LAN Library is available across Africa. We currently have active users in 10+ countries and are adding institution-specific categories for more countries regularly.',
                            },
                            {
                                q: 'How do I report a copyright violation?',
                                a: 'Email copyright@lanlibrary.com with the document URL, your ownership proof, and a description of the violation. We investigate and remove infringing content within 48 hours.',
                            },
                        ].map(({ q, a }) => (
                            <div key={q} style={{ background: '#fdfcfa', padding: '2rem' }}>
                                <div style={{ fontSize: 'clamp(0.88rem, 1.4vw, 0.95rem)', fontWeight: 700, color: '#0d1f35', marginBottom: '0.75rem', lineHeight: 1.4 }}>{q}</div>
                                <div style={{ fontSize: 'clamp(0.8rem, 1.2vw, 0.87rem)', color: '#6b7280', lineHeight: 1.8, fontWeight: 300 }}>{a}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ══ OUR APPROACH (tabbed) ══════════════════════════════════════════════ */}
            <section style={{ padding: '7rem clamp(1.25rem, 5vw, 4rem) 0', background: '#f9f6f0', borderTop: '1px solid rgba(13,31,53,0.07)' }}>
                <div style={{ maxWidth: 1200, margin: '0 auto' }}>
                    <Reveal>
                        <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.25em', textTransform: 'uppercase', color: '#c8922a', display: 'flex', alignItems: 'center', gap: 10, marginBottom: '1.5rem' }}>
                            <span style={{ width: 28, height: 1, background: '#c8922a', display: 'inline-block' }} /> Our Approach
                        </p>
                        <h2 style={{
                            fontFamily: "'Cormorant Garamond', Georgia, serif",
                            fontWeight: 800,
                            fontSize: 'clamp(3rem, 8vw, 7rem)',
                            lineHeight: 0.9,
                            letterSpacing: '-0.02em',
                            color: '#0d1f35',
                            marginBottom: '3rem',
                        }}>
                            How we<br />operate.
                        </h2>

                        {/* Tab pills */}
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: '3.5rem' }}>
                            {APPROACH_TABS.map(tp => (
                                <button
                                    key={tp.id}
                                    className={`approach-tab ${activeTab === tp.id ? 'active' : ''}`}
                                    onClick={() => setActiveTab(tp.id)}
                                >
                                    {tp.label}
                                </button>
                            ))}
                        </div>
                    </Reveal>
                </div>

                {/* Tab panel */}
                <div style={{ maxWidth: 1200, margin: '0 auto', paddingBottom: '7rem' }}>
                    <div key={activeTab} style={{ animation: 'fadeUp 0.35s ease forwards', opacity: 0 }}>
                        <h3 style={{
                            fontFamily: "'Cormorant Garamond', Georgia, serif",
                            fontWeight: 700,
                            fontSize: 'clamp(1.6rem, 3.5vw, 2.8rem)',
                            lineHeight: 1.2,
                            color: '#0d1f35',
                            maxWidth: 680,
                            marginBottom: '1.75rem',
                        }}>
                            {tab.heading}
                        </h3>
                        {tab.body.map((p, i) => (
                            <p key={i} style={{ fontSize: 'clamp(0.92rem, 1.5vw, 1rem)', color: '#374151', lineHeight: 1.85, fontWeight: 300, maxWidth: 640, marginBottom: '1rem' }}>{p}</p>
                        ))}

                        {/* Cards */}
                        {tab.cards && (
                            <div className="approach-cards-grid">
                                {tab.cards.map(c => (
                                    <div key={c.title} className="approach-card" style={{ borderLeftColor: c.stroke }}>
                                        <div style={{ fontSize: 'clamp(0.88rem, 1.4vw, 0.95rem)', fontWeight: 700, color: '#0d1f35', marginBottom: '0.6rem' }}>{c.title}</div>
                                        <div style={{ fontSize: 'clamp(0.8rem, 1.2vw, 0.87rem)', color: '#6b7280', lineHeight: 1.8, fontWeight: 300 }}>{c.body}</div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Steps */}
                        {tab.steps && (
                            <div style={{ marginTop: '2.5rem', maxWidth: 600 }}>
                                {tab.steps.map((s, i) => (
                                    <div key={i} style={{ display: 'flex', gap: '1.25rem', paddingBottom: '2rem', borderBottom: i < tab.steps.length - 1 ? '1px solid rgba(13,31,53,0.07)' : 'none', marginBottom: i < tab.steps.length - 1 ? '2rem' : 0 }}>
                                        <div style={{ width: 32, height: 32, border: '1px solid rgba(13,31,53,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 11, fontWeight: 700, color: '#0d1f35', marginTop: 2 }}>{i + 1}</div>
                                        <div>
                                            <div style={{ fontSize: 'clamp(0.88rem, 1.4vw, 0.95rem)', fontWeight: 700, color: '#0d1f35', marginBottom: '0.5rem' }}>{s.title}</div>
                                            <div style={{ fontSize: 'clamp(0.8rem, 1.2vw, 0.87rem)', color: '#6b7280', lineHeight: 1.8, fontWeight: 300 }}>{s.body}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Callout */}
                        {tab.callout && (
                            <div style={{ marginTop: '2.5rem', borderLeft: '3px solid #0d1f35', paddingLeft: '1.5rem', maxWidth: 560 }}>
                                <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#0d1f35', marginBottom: 8 }}>{tab.callout.label}</p>
                                <p style={{ fontSize: 'clamp(0.88rem, 1.4vw, 0.95rem)', color: '#374151', lineHeight: 1.8, fontWeight: 300 }}>{tab.callout.text}</p>
                            </div>
                        )}
                    </div>
                </div>
            </section>

            {/* ══ CTA ════════════════════════════════════════════════════════════════ */}
            <section style={{ padding: '7rem clamp(1.25rem, 5vw, 4rem)', background: '#0d1f35', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 70% 50%, rgba(200,146,42,0.10) 0%, transparent 60%)', pointerEvents: 'none' }} />
                <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(200,146,42,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(200,146,42,0.04) 1px, transparent 1px)', backgroundSize: '80px 80px', pointerEvents: 'none' }} />
                <div style={{ maxWidth: 1200, margin: '0 auto', position: 'relative', zIndex: 2, display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '5rem', alignItems: 'end' }}>
                    <div>
                        <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.25em', textTransform: 'uppercase', color: '#c8922a', display: 'flex', alignItems: 'center', gap: 10, marginBottom: '1.5rem' }}>
                            <span style={{ width: 28, height: 1, background: '#c8922a', display: 'inline-block' }} /> Still have questions?
                        </p>
                        <h2 style={{
                            fontFamily: "'Cormorant Garamond', Georgia, serif",
                            fontWeight: 800,
                            fontSize: 'clamp(3.5rem, 10vw, 8.5rem)',
                            lineHeight: 0.9,
                            letterSpacing: '-0.02em',
                            color: '#fff',
                            whiteSpace: 'nowrap',
                        }}>
                            We're one<br />
                            message <span style={{ color: '#c8922a' }}>away.</span>
                        </h2>
                    </div>
                    <div style={{ paddingBottom: '0.5rem' }}>
                        <p style={{ fontSize: 'clamp(0.92rem, 1.5vw, 1rem)', color: 'rgba(255,255,255,0.45)', lineHeight: 1.85, fontWeight: 300, maxWidth: 380, marginBottom: '2.5rem' }}>
                            Every message is read by a real person. If you're a student struggling to find materials, a creator wanting to publish, or a university wanting to partner — reach out. We'll respond.
                        </p>
                        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                            <a href="#top"
                                onClick={e => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                                style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '15px 30px', background: '#c8922a', color: '#0d1f35', fontWeight: 700, fontSize: 12, letterSpacing: '0.06em', textTransform: 'uppercase', transition: 'background 0.2s' }}
                                onMouseEnter={e => e.currentTarget.style.background = '#e8b24a'}
                                onMouseLeave={e => e.currentTarget.style.background = '#c8922a'}>
                                Send a Message <ArrowRight size={14} />
                            </a>
                            <a href="mailto:support@lanlibrary.com"
                                style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '15px 30px', border: '1px solid rgba(255,255,255,0.22)', color: 'rgba(255,255,255,0.75)', fontWeight: 500, fontSize: 12, transition: 'all 0.2s' }}
                                onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.65)'; e.currentTarget.style.color = '#fff'; }}
                                onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.22)'; e.currentTarget.style.color = 'rgba(255,255,255,0.75)'; }}>
                                Email Directly
                            </a>
                        </div>
                    </div>
                </div>
            </section>

        </div>
    );
}