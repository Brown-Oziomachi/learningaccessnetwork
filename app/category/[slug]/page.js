"use client"
import React, { useState, useEffect, useMemo } from 'react';
import { ArrowLeft, ShoppingBag, ChevronRight, Lock, Unlock } from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "@/lib/firebaseConfig";
import { booksData } from "@/lib/booksData";
import { doc, getDoc, collection, getDocs, query, where } from 'firebase/firestore';
import Navbar from '@/components/NavBar';
import Footer from '@/components/FooterComp';
import FeaturedAdsCarousel from '@/components/FeaturedAdsCarousel';
import { useAds, injectAds } from "@/lib/useAds";

/* ─── colour tokens ─────────────────────────────────────────── */
const NAVY   = "#0d2244";
const GOLD   = "#b8963e";
const CREAM  = "#f5f0e8";
const BG     = "#f5f1ea";

/* ─── Open Access green tokens ──────────────────────────────── */
const GREEN       = "#16a34a";
const GREEN_DARK  = "#14532d";
const GREEN_MID   = "#166534";
const GREEN_LIGHT = "#86efac";
const GREEN_PALE  = "#dcfce7";

/* ═══════════════════════════════════════════════════════════════
   CATEGORY META  — icon, accent, description (short, 1–2 lines)
═══════════════════════════════════════════════════════════════ */
const CATEGORY_META = {
    'education': {
        icon: '🎓', accent: '#2563eb', bg: 'rgba(37,99,235,0.08)',
        description: 'Study guides, textbooks, and academic resources curated for students and professionals at every level.',
    },
    'personal-development': {
        icon: '🌱', accent: '#16a34a', bg: 'rgba(22,163,74,0.08)',
        description: 'Mindset, habits, productivity, and emotional intelligence tools to help you become your best self.',
    },
    'business': {
        icon: '💼', accent: '#b45309', bg: 'rgba(180,83,9,0.08)',
        description: 'Startup playbooks, financial strategy, and leadership mastery for the ambitious professional.',
    },
    'technology': {
        icon: '💻', accent: '#0891b2', bg: 'rgba(8,145,178,0.08)',
        description: 'Software engineering, AI, cybersecurity, and digital innovation — stay ahead of the curve.',
    },
    'science': {
        icon: '🔬', accent: '#059669', bg: 'rgba(5,150,105,0.08)',
        description: 'Biology, chemistry, physics, and more — rigorous science made accessible to every reader.',
    },
    'literature': {
        icon: '📖', accent: '#be185d', bg: 'rgba(190,24,93,0.08)',
        description: 'Timeless stories and modern voices that expand imagination and sharpen perspective.',
    },
    'health-wellness': {
        icon: '🩺', accent: '#dc2626', bg: 'rgba(220,38,38,0.08)',
        description: 'Expert-backed guides on nutrition, fitness, mental health, and holistic wellness.',
    },
    'history': {
        icon: '🏛️', accent: '#92400e', bg: 'rgba(146,64,14,0.08)',
        description: 'Civilisations, events, and figures that changed the world — and what they mean today.',
    },
    'arts-culture': {
        icon: '🎨', accent: '#7c3aed', bg: 'rgba(124,58,237,0.08)',
        description: 'Fine arts, music, theatre, film studies, and cultural theory celebrating Africa\'s creative identity.',
    },
    'relationship': {
        icon: '💞', accent: '#e11d48', bg: 'rgba(225,29,72,0.08)',
        description: 'Evidence-based guides on love, marriage, communication, and emotional intimacy.',
    },
    'law': {
        icon: '⚖️', accent: '#1e3a5f', bg: 'rgba(30,58,95,0.08)',
        description: 'Case briefs, statutes, and legal practice notes for students and practitioners.',
    },
    'medicine': {
        icon: '🏥', accent: '#b91c1c', bg: 'rgba(185,28,28,0.08)',
        description: 'Clinical guides, anatomy references, and pharmacology notes for medical students.',
    },
    'engineering': {
        icon: '⚙️', accent: '#374151', bg: 'rgba(55,65,81,0.08)',
        description: 'Civil, mechanical, electrical, and computer engineering resources for Africa\'s next builders.',
    },
    'mathematics': {
        icon: '📐', accent: '#0284c7', bg: 'rgba(2,132,199,0.08)',
        description: 'Calculus, algebra, statistics, and number theory — worked examples that make maths click.',
    },
    'economics': {
        icon: '📊', accent: '#0f766e', bg: 'rgba(15,118,110,0.08)',
        description: 'Micro, macro, and development economics connecting theory to real African contexts.',
    },
    'agriculture': {
        icon: '🌾', accent: '#65a30d', bg: 'rgba(101,163,13,0.08)',
        description: 'Crop science, soil management, and agribusiness guides for African agricultural systems.',
    },
    'architecture': {
        icon: '🏗️', accent: '#6b7280', bg: 'rgba(107,114,128,0.08)',
        description: 'Design principles, building technology, and urban planning for architecture students.',
    },
    'pharmacy': {
        icon: '💊', accent: '#7c3aed', bg: 'rgba(124,58,237,0.08)',
        description: 'Pharmacology, pharmaceutical chemistry, and clinical pharmacy guides.',
    },
    'accounting': {
        icon: '🧾', accent: '#0369a1', bg: 'rgba(3,105,161,0.08)',
        description: 'Financial accounting, auditing, taxation, and ICAN study materials.',
    },
    'political-science': {
        icon: '🗳️', accent: '#1d4ed8', bg: 'rgba(29,78,216,0.08)',
        description: 'Government systems, international relations, and Nigerian political history.',
    },
    'mass-communication': {
        icon: '📡', accent: '#0891b2', bg: 'rgba(8,145,178,0.08)',
        description: 'Journalism, broadcasting, public relations, and media studies resources.',
    },
    'psychology': {
        icon: '🧠', accent: '#7c3aed', bg: 'rgba(124,58,237,0.08)',
        description: 'Cognitive science, counselling, developmental psychology, and research methods.',
    },
    'sociology': {
        icon: '👥', accent: '#059669', bg: 'rgba(5,150,105,0.08)',
        description: 'Social theory, Nigerian social structures, and community development resources.',
    },
    'philosophy': {
        icon: '🦉', accent: '#4b5563', bg: 'rgba(75,85,99,0.08)',
        description: 'Logic, ethics, metaphysics, and African philosophy to sharpen analytical thinking.',
    },
    'religious-studies': {
        icon: '🕊️', accent: '#7c3aed', bg: 'rgba(124,58,237,0.08)',
        description: 'Biblical studies, Islamic studies, African traditional religion, and comparative religion.',
    },
    'past-questions': {
        icon: '📝', accent: '#7c3aed', bg: 'rgba(124,58,237,0.08)',
        description: 'WAEC, NECO, JAMB, Post-UTME, and university past questions across all departments.',
    },
    'lecture-notes': {
        icon: '📋', accent: '#b45309', bg: 'rgba(180,83,9,0.08)',
        description: 'Well-structured lecture notes from verified lecturers across 200+ Nigerian universities.',
    },
    'research': {
        icon: '🔭', accent: '#0f766e', bg: 'rgba(15,118,110,0.08)',
        description: 'Full dissertations, theses, and research methodology guides for postgraduate students.',
    },
    'self-help': {
        icon: '✨', accent: '#d97706', bg: 'rgba(217,119,6,0.08)',
        description: 'Practical guides on productivity, confidence, financial freedom, and emotional resilience.',
    },
    'fiction': {
        icon: '📚', accent: '#be185d', bg: 'rgba(190,24,93,0.08)',
        description: 'Compelling novels and short stories from African and global authors that entertain and inspire.',
    },
};

const getCategoryMeta = (slug) =>
    CATEGORY_META[slug] || {
        icon: '📚', accent: NAVY, bg: 'rgba(13,34,68,0.06)',
        description: 'Browse our curated collection in this category — knowledge you can apply immediately.',
    };

/* ═══════════════════════════════════════════════════════════════
   AD BOOK CARD
═══════════════════════════════════════════════════════════════ */
function AdBookCard({ ad }) {
    const tierColors = { Gold: GOLD, Silver: "#94a3b8", Bronze: "#cd7f32" };
    const tierColor = tierColors[ad.adTier] || GOLD;
    return (
        <a
            href={ad.adLink}
            style={{ flexShrink: 0, width: '180px', textDecoration: 'none', display: 'block' }}
            className="lan-book-card"
            onClick={() => {
                import("firebase/firestore").then(({ doc, updateDoc, increment }) => {
                    import("@/lib/firebaseConfig").then(({ db }) => {
                        updateDoc(doc(db, "promotions", ad.adId), { clicks: increment(1) }).catch(() => {});
                    });
                });
            }}
        >
            <div style={{ position: 'relative', marginBottom: '10px', background: '#e8e4dc' }}>
                <img
                    src={ad.image} alt={ad.title}
                    className="lan-book-img"
                    style={{ width: '100%', aspectRatio: '3/4', objectFit: 'cover', display: 'block' }}
                    onError={e => { e.target.src = 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400'; }}
                />
                <div style={{ position: 'absolute', top: '8px', left: '8px', display: 'flex', alignItems: 'center', gap: '4px', background: NAVY, padding: '3px 8px' }}>
                    <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#22c55e', flexShrink: 0 }} />
                    <span style={{ fontSize: '8px', fontWeight: 700, color: GOLD, fontFamily: "'Lato',sans-serif", letterSpacing: '0.1em', textTransform: 'uppercase' }}>PDF</span>
                </div>
                <div style={{ position: 'absolute', top: '8px', right: '8px', background: GOLD, color: NAVY, fontSize: '8px', fontWeight: 700, padding: '2px 7px', fontFamily: "'Lato',sans-serif" }}>AD</div>
                <div style={{ position: 'absolute', bottom: '6px', left: '6px', background: 'rgba(13,34,68,0.82)', padding: '2px 7px', fontSize: '8px', fontWeight: 700, color: tierColor, fontFamily: "'Lato',sans-serif" }}>{ad.adTier?.toUpperCase()} SPONSOR</div>
            </div>
            <div>
                <h4 style={{ fontFamily: "'Playfair Display',serif", fontSize: '12px', fontWeight: 700, color: NAVY, margin: '0 0 3px', lineHeight: 1.35, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{ad.title}</h4>
                <p style={{ fontSize: '10px', color: '#888', margin: '0 0 7px', fontFamily: "'Lato',sans-serif", overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ad.author}</p>
                {ad.category && <span style={{ fontSize: '8px', fontWeight: 700, background: CREAM, border: `0.5px solid rgba(184,150,62,0.35)`, color: GOLD, padding: '2px 7px', fontFamily: "'Lato',sans-serif", letterSpacing: '0.08em', textTransform: 'uppercase', display: 'inline-block' }}>{ad.category}</span>}
                {ad.price && <p style={{ fontSize: '12px', fontWeight: 700, color: NAVY, margin: '5px 0 0', fontFamily: "'Lato',sans-serif" }}>₦{Number(ad.price).toLocaleString()}</p>}
            </div>
        </a>
    );
}

/* ═══════════════════════════════════════════════════════════════
   PAID BOOK CARD
═══════════════════════════════════════════════════════════════ */
function BookCard({ book, isPurchased, bookSalesCount }) {
    const sold  = bookSalesCount[book.id] || bookSalesCount[book.firestoreId] || 0;
    const owned = isPurchased(book.id);

    return (
        <a
            href={`/book/preview?id=${String(book.id).replace("firestore-", "")}`}
            style={{ flexShrink: 0, width: '180px', textDecoration: 'none', display: 'block' }}
            className="lan-book-card"
        >
            <div style={{ position: 'relative', marginBottom: '10px', background: '#e8e4dc' }}>
                <img
                    src={book.image} alt={book.title}
                    className="lan-book-img"
                    style={{ width: '100%', aspectRatio: '3/4', objectFit: 'cover', display: 'block' }}
                    onError={e => { e.target.src = 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400'; }}
                />
                {book.isFromFirestore && (
                    <div style={{ position: 'absolute', top: '8px', left: '8px', display: 'flex', alignItems: 'center', gap: '4px', background: NAVY, padding: '3px 8px' }}>
                        <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#22c55e', flexShrink: 0 }} />
                        <span style={{ fontSize: '8px', fontWeight: 700, color: GOLD, fontFamily: "'Lato',sans-serif", letterSpacing: '0.1em', textTransform: 'uppercase' }}>PDF</span>
                    </div>
                )}
                {owned && (
                    <span style={{ position: 'absolute', top: '8px', right: '8px', background: '#16a34a', color: '#fff', fontSize: '8px', fontWeight: 700, padding: '2px 7px', fontFamily: "'Lato',sans-serif" }}>OWNED</span>
                )}
            </div>
            <div>
                <h4 style={{ fontFamily: "'Playfair Display',serif", fontSize: '12px', fontWeight: 700, color: NAVY, margin: '0 0 3px', lineHeight: 1.35, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{book.title}</h4>
                <p style={{ fontSize: '10px', color: '#888', margin: '0 0 7px', fontFamily: "'Lato',sans-serif", overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{book.author}</p>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '4px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: NAVY, fontFamily: "'Lato',sans-serif" }}>
                        {book.price > 0 ? `₦${Number(book.price).toLocaleString()}` : 'Free'}
                    </span>
                    {book.category && (
                        <span style={{ fontSize: '8px', fontWeight: 700, background: CREAM, border: `0.5px solid rgba(184,150,62,0.35)`, color: GOLD, padding: '2px 7px', fontFamily: "'Lato',sans-serif", letterSpacing: '0.08em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{book.category}</span>
                    )}
                </div>
                {sold > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '3px', marginTop: '5px' }}>
                        <span style={{ fontSize: '9px', color: '#bbb', display: 'flex', alignItems: 'center', gap: '3px', fontFamily: "'Lato',sans-serif" }}>
                            <ShoppingBag size={8} /> {sold} sold
                        </span>
                    </div>
                )}
            </div>
        </a>
    );
}

/* ═══════════════════════════════════════════════════════════════
   FREE BOOK CARD  — green-tinted variant
═══════════════════════════════════════════════════════════════ */
function FreeBookCard({ book, isPurchased }) {
    return (
        <Link
            href={`/book/preview?id=${String(book.id).replace("firestore-", "")}`}
            style={{ flexShrink: 0, width: '168px', textDecoration: 'none', display: 'block' }}
            className="oa-book-card"
        >
            <div style={{ position: 'relative', background: '#d1fae5', overflow: 'hidden' }}>
                <img
                    src={book.image} alt={book.title}
                    className="oa-book-img"
                    style={{ width: '100%', aspectRatio: '3/4', objectFit: 'cover', display: 'block' }}
                    onError={e => { e.target.src = 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400'; }}
                />
                <div style={{ position: 'absolute', top: '8px', left: '8px', display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(5,46,22,0.85)', padding: '3px 8px' }}>
                    <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: GREEN_LIGHT, display: 'inline-block' }} />
                    <span style={{ fontSize: '8px', fontWeight: 700, color: GREEN_LIGHT, fontFamily: "'Lato',sans-serif", letterSpacing: '.1em' }}>PDF</span>
                </div>
                <div style={{ position: 'absolute', top: '8px', right: '8px', background: GREEN, color: '#fff', fontSize: '8px', fontWeight: 700, padding: '3px 7px', fontFamily: "'Lato',sans-serif", display: 'flex', alignItems: 'center', gap: 3 }}>
                    🔓 FREE
                </div>
            </div>
            <div style={{ padding: '10px 10px 12px', borderTop: `0.5px solid rgba(22,163,74,0.15)`, background: '#fff' }}>
                <h4 className="oa-book-title" style={{ fontFamily: "'Playfair Display',serif", fontSize: '12px', fontWeight: 700, color: NAVY, margin: '0 0 3px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: 1.35, transition: 'color 0.18s' }}>
                    {book.title}
                </h4>
                <p style={{ fontSize: '10px', color: '#888', margin: '0 0 7px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: "'Lato',sans-serif" }}>
                    {book.author}
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <span style={{ width: 5, height: 5, borderRadius: '50%', background: GREEN, display: 'inline-block', flexShrink: 0 }} />
                    <span style={{ fontSize: '9px', fontWeight: 700, color: GREEN, fontFamily: "'Lato',sans-serif", letterSpacing: '.05em' }}>Open Access</span>
                </div>
            </div>
        </Link>
    );
}

/* ═══════════════════════════════════════════════════════════════
   SCROLL ROW with arrow buttons
═══════════════════════════════════════════════════════════════ */
function ScrollRow({ children, accentColor = NAVY }) {
    const ref = React.useRef(null);
    const scroll = (dir) => ref.current?.scrollBy({ left: dir * 920, behavior: 'smooth' });

    const arrowStyle = {
        position: 'absolute', top: '38%', transform: 'translateY(-50%)', zIndex: 10,
        width: 32, height: 32, borderRadius: '50%',
        background: accentColor, border: '1px solid rgba(255,255,255,0.2)',
        color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: `0 4px 14px ${accentColor}55`, transition: 'opacity 0.18s, transform 0.18s',
    };

    return (
        <div style={{ position: 'relative' }}>
            <button onClick={() => scroll(-1)} style={{ ...arrowStyle, left: -16 }}
                onMouseEnter={e => { e.currentTarget.style.opacity = '0.82'; e.currentTarget.style.transform = 'translateY(-50%) scale(1.08)'; }}
                onMouseLeave={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'translateY(-50%) scale(1)'; }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M15 18l-6-6 6-6" /></svg>
            </button>
            <div ref={ref} className="sbar-none" style={{ display: 'flex', gap: '16px', overflowX: 'auto', paddingBottom: '8px' }}>
                {children}
            </div>
            <button onClick={() => scroll(1)} style={{ ...arrowStyle, right: -16 }}
                onMouseEnter={e => { e.currentTarget.style.opacity = '0.82'; e.currentTarget.style.transform = 'translateY(-50%) scale(1.08)'; }}
                onMouseLeave={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'translateY(-50%) scale(1)'; }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 18l6-6-6-6" /></svg>
            </button>
        </div>
    );
}

/* ═══════════════════════════════════════════════════════════════
   SECTION HEADER  — shared by both Open Access + Paid sections
═══════════════════════════════════════════════════════════════ */
function SectionHeader({ icon, title, count, description, accentColor, badgeBg, badgeColor, badgeBorder, badge }) {
    return (
        <div style={{
            background: '#fff', border: '0.5px solid #e5ddd0',
            borderLeft: `4px solid ${accentColor}`,
            padding: '20px 24px', marginBottom: 20,
            display: 'flex', flexWrap: 'wrap', gap: 14, alignItems: 'flex-start',
        }}>
            <div style={{
                width: 50, height: 50, borderRadius: 12, flexShrink: 0,
                background: badgeBg || 'rgba(13,34,68,0.06)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22,
            }}>{icon}</div>
            <div style={{ flex: 1, minWidth: 200 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 5 }}>
                    <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: 'clamp(16px,2.5vw,20px)', fontWeight: 700, color: NAVY, margin: 0 }}>
                        {title}
                    </h3>
                    <span style={{ background: badgeBg, border: `0.5px solid ${badgeBorder}`, color: badgeColor, fontSize: '9px', fontWeight: 700, padding: '2px 10px', fontFamily: "'Lato',sans-serif", letterSpacing: '.08em', textTransform: 'uppercase' }}>
                        {count} doc{count !== 1 ? 's' : ''}
                    </span>
                    {badge && (
                        <span style={{ background: badge.bg, border: `0.5px solid ${badge.border}`, color: badge.color, fontSize: '9px', fontWeight: 700, padding: '2px 10px', fontFamily: "'Lato',sans-serif", letterSpacing: '.08em', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 4 }}>
                            {badge.label}
                        </span>
                    )}
                </div>
                <p style={{ fontSize: 12, color: '#666', lineHeight: 1.7, fontFamily: "'Lato',sans-serif", margin: 0, maxWidth: 640 }}>
                    {description}
                </p>
            </div>
        </div>
    );
}

/* ═══════════════════════════════════════════════════════════════
   MAIN CATEGORY PAGE
═══════════════════════════════════════════════════════════════ */
export default function CategoryPage() {
    const params       = useParams();
    const router       = useRouter();
    const categorySlug = params.slug;

    const [purchasedBookIds, setPurchasedBookIds] = useState(new Set());
    const [user,             setUser]             = useState(null);
    const [sortBy,           setSortBy]           = useState('popularity');
    const [allBooks,         setAllBooks]         = useState([]);
    const [loading,          setLoading]          = useState(true);
    const [bookSalesCount,   setBookSalesCount]   = useState({});

    const goldAds   = useAds("Gold",   3);
    const silverAds = useAds("Silver", 3);
    const bronzeAds = useAds("Bronze", 3);
    const allCatAds = [...goldAds, ...silverAds, ...bronzeAds];

    /* ── helpers — matches OpenAccessPage exactly ── */
    const getThumbnailUrl = (book) => {
        if (book.driveFileId) return `https://drive.google.com/thumbnail?id=${book.driveFileId}&sz=w400`;
        if (book.embedUrl) {
            const m = book.embedUrl.match(/\/d\/(.*?)\/|\/file\/d\/(.*?)\/|id=(.*?)(&|$)/);
            if (m) { const id = m[1] || m[2] || m[3]; if (id) return `https://drive.google.com/thumbnail?id=${id}&sz=w400`; }
        }
        if (book.pdfUrl?.includes("drive.google.com")) {
            const m = book.pdfUrl.match(/[-\w]{25,}/);
            if (m) return `https://drive.google.com/thumbnail?id=${m[0]}&sz=w400`;
        }
        return book.image || "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400";
    };

    const categoriesData = [
        { name: 'Education', slug: 'education' },
        { name: 'Personal Development', slug: 'personal-development' },
        { name: 'Business', slug: 'business' },
        { name: 'Technology', slug: 'technology' },
        { name: 'Science', slug: 'science' },
        { name: 'Literature', slug: 'literature' },
        { name: 'Health & Fitness', slug: 'health-wellness' },
        { name: 'History', slug: 'history' },
        { name: 'Arts & Culture', slug: 'arts-culture' },
        { name: 'Relation & Marriage', slug: 'relationship' },
        { name: 'Law', slug: 'law' },
        { name: 'Medicine & Health', slug: 'medicine' },
        { name: 'Engineering', slug: 'engineering' },
        { name: 'Mathematics', slug: 'mathematics' },
        { name: 'Economics', slug: 'economics' },
        { name: 'Agriculture', slug: 'agriculture' },
        { name: 'Architecture', slug: 'architecture' },
        { name: 'Pharmacy', slug: 'pharmacy' },
        { name: 'Accounting & Finance', slug: 'accounting' },
        { name: 'Political Science', slug: 'political-science' },
        { name: 'Mass Communication', slug: 'mass-communication' },
        { name: 'Psychology', slug: 'psychology' },
        { name: 'Sociology', slug: 'sociology' },
        { name: 'Philosophy', slug: 'philosophy' },
        { name: 'Religious Studies', slug: 'religious-studies' },
        { name: 'Past Questions', slug: 'past-questions' },
        { name: 'Lecture Notes', slug: 'lecture-notes' },
        { name: 'Research & Thesis', slug: 'research' },
        { name: 'Self Help', slug: 'self-help' },
        { name: 'Fiction', slug: 'fiction' },
    ];

    const currentCategory = categoriesData.find(c => c.slug === categorySlug);
    const categoryName    = currentCategory?.name || 'Category';
    const meta            = getCategoryMeta(categorySlug);

    /* ── auth ── */
    useEffect(() => {
        const unsub = onAuthStateChanged(auth, cu => { cu ? setUser(cu) : router.push('/signin'); });
        return () => unsub();
    }, [router]);

    /* ── sales ── */
    useEffect(() => {
        const fetchSales = async () => {
            try {
                const snap = await getDocs(collection(db, "users"));
                const map  = {};
                snap.docs.forEach(u => {
                    Object.values(u.data().purchasedBooks || {}).forEach(p => {
                        const id = p.bookId || p.id || p.firestoreId;
                        if (id) { map[id] = (map[id] || 0) + 1; map[`firestore-${id}`] = (map[`firestore-${id}`] || 0) + 1; }
                    });
                });
                setBookSalesCount(map);
            } catch {}
        };
        fetchSales();
    }, []);

    /* ── books ── */
    useEffect(() => {
        const fetchBooks = async () => {
            try {
                const processed = booksData.map(b => ({ ...b, image: getThumbnailUrl(b) }));
                const q         = query(collection(db, 'advertMyBook'), where('status', '==', 'approved'));
                const snap      = await getDocs(q);
                const fb        = [];
                snap.forEach(d => {
                    const data = d.data();
                    const book = {
                        id: `firestore-${d.id}`, firestoreId: d.id,
                        title: data.bookTitle, author: data.author,
                        category: data.category, price: data.price,
                        isFree: data.isFree === true || data.price === 0,
                        pages: data.pages, format: data.format || 'PDF',
                        description: data.description, rating: 4.5, reviews: 0,
                        driveFileId: data.driveFileId || data.fileId,
                        pdfUrl: data.pdfUrl, embedUrl: data.embedUrl,
                        /* set image/coverImage first so getThumbnailUrl fallback finds it */
                        image: data.coverImage || data.image || null,
                        isFromFirestore: true,
                    };
                    book.image = getThumbnailUrl(book);
                    fb.push(book);
                });
                setAllBooks([...processed, ...fb]);
            } catch {
                setAllBooks(booksData.map(b => ({ ...b, image: getThumbnailUrl(b) })));
            } finally { setLoading(false); }
        };
        fetchBooks();
    }, []);

    /* ── purchased ── */
    useEffect(() => {
        const load = async () => {
            try {
                const cu = auth.currentUser; if (!cu) return;
                const ud = await getDoc(doc(db, 'users', cu.uid));
                if (ud.exists()) {
                    const pb  = ud.data().purchasedBooks || {};
                    const arr = Array.isArray(pb) ? pb : Object.values(pb);
                    setPurchasedBookIds(new Set(arr.map(b => b.id || b.bookId || b.firestoreId).filter(Boolean)));
                }
            } catch {}
        };
        if (user) load();
    }, [user]);

    /* ── derived ── */
    const categoryCounts = useMemo(() => {
        const counts = {};
        categoriesData.forEach(cat => {
            counts[cat.slug] = allBooks.filter(b => {
                const bc = b.category?.toLowerCase().replace(/ & /g, '-').replace(/ /g, '-').trim();
                return bc === cat.slug;
            }).length;
        });
        return counts;
    }, [allBooks]);

    const categoryBooks = useMemo(() =>
        allBooks.filter(b => {
            const bc = b.category?.toLowerCase().replace(/ & /g, '-').replace(/ /g, '-').trim();
            return bc === categorySlug;
        }),
    [allBooks, categorySlug]);

    /* Split free / paid */
    const freeBooks = useMemo(() => categoryBooks.filter(b => b.isFree || b.price === 0), [categoryBooks]);
    const paidBooks = useMemo(() => categoryBooks.filter(b => !b.isFree && b.price > 0), [categoryBooks]);

    const sortBooks = (books) => {
        const s = [...books];
        switch (sortBy) {
            case 'price-low':  return s.sort((a, b) => a.price - b.price);
            case 'price-high': return s.sort((a, b) => b.price - a.price);
            case 'rating':     return s.sort((a, b) => b.rating - a.rating);
            case 'newest':     return s.sort((a, b) => (a.isFromFirestore ? -1 : 1));
            default:           return s.sort((a, b) => b.reviews - a.reviews);
        }
    };

    const displayFree = useMemo(() => sortBooks(freeBooks), [freeBooks, sortBy]);
    const displayPaid = useMemo(() => sortBooks(paidBooks), [paidBooks, sortBy]);

    const isPurchased = id =>
        purchasedBookIds.has(id) || purchasedBookIds.has(String(id)) ||
        purchasedBookIds.has(`firestore-${id}`) || purchasedBookIds.has(String(id).replace('firestore-', ''));

    const BOOKSPERROW = 10;
    const chunkBooks = (arr) => {
        const rows = [];
        for (let i = 0; i < Math.ceil(arr.length / BOOKSPERROW); i++) {
            rows.push(arr.slice(i * BOOKSPERROW, (i + 1) * BOOKSPERROW));
        }
        return rows;
    };

    const freeRows = useMemo(() => chunkBooks(displayFree), [displayFree]);
    const paidRows = useMemo(() => chunkBooks(displayPaid), [displayPaid]);

    /* ── loading ── */
    if (loading) return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: BG }}>
            <div style={{ textAlign: 'center' }}>
                <div style={{ width: '52px', height: '52px', border: `3px solid ${GOLD}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 14px' }} />
                <p style={{ fontFamily: "'Playfair Display',serif", fontSize: '17px', color: NAVY, letterSpacing: '0.05em' }}>Loading Documents…</p>
                <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
            </div>
        </div>
    );

    /* ═══════════════════════════════════════════════════════════════
       RENDER
    ═══════════════════════════════════════════════════════════════ */
    return (
        <>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400&family=Lato:wght@300;400;700&display=swap');

                .lan-root  { font-family:'Lato',sans-serif; background:${BG}; }
                .lan-book-card:hover .lan-book-img   { opacity:0.88; }
                .lan-book-card:hover h4, .oa-book-card:hover .oa-book-title { color:${GOLD}; }
                .oa-book-card:hover .oa-book-img { transform:scale(1.05); }
                .oa-book-img  { transition:transform 0.45s cubic-bezier(.4,0,.2,1); }
                .lan-book-img { transition:opacity 0.22s; }
                h4 { transition:color 0.18s; }
                .sbar-none { scrollbar-width:none; -ms-overflow-style:none; }
                .sbar-none::-webkit-scrollbar { display:none; }
                .cat-pill {
                    border:0.5px solid #e5ddd0; background:#fff; color:${NAVY};
                    font-family:'Lato',sans-serif; font-size:10px; font-weight:700;
                    letter-spacing:0.07em; text-transform:uppercase; padding:7px 14px;
                    cursor:pointer; transition:background 0.18s,color 0.18s,border-color 0.18s;
                    white-space:nowrap;
                }
                .cat-pill:hover { background:${NAVY}; color:#fff; border-color:${NAVY}; }
                .filter-select {
                    border:0.5px solid #e5ddd0; background:#fff; color:${NAVY};
                    font-family:'Lato',sans-serif; font-size:11px; font-weight:700;
                    padding:8px 13px; outline:none; cursor:pointer;
                }
                @keyframes slideUp { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:translateY(0)} }
                .anim-up { animation:slideUp 0.45s cubic-bezier(0.4,0,0.2,1) both; }
            `}</style>

            <div className="lan-root" style={{ minHeight: '100vh' }}>
                <Navbar />

                {/* ── Breadcrumb ── */}
                <div style={{ background: CREAM, borderBottom: '0.5px solid #e5ddd0', padding: '9px 24px' }}>
                    <div style={{ maxWidth: '1240px', margin: '0 auto', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: '#888', fontFamily: "'Lato',sans-serif" }}>
                        <Link href="/home" style={{ color: NAVY, fontWeight: 700, textDecoration: 'none' }}>Home</Link>
                        <ChevronRight size={11} />
                        <Link href="/documents" style={{ color: NAVY, fontWeight: 700, textDecoration: 'none' }}>All Books</Link>
                        <ChevronRight size={11} />
                        <span style={{ color: '#aaa' }}>{categoryName}</span>
                    </div>
                </div>

                {/* ── Main ── */}
                <main style={{ maxWidth: '1240px', margin: '0 auto', padding: '48px 40px' }}>

                    {/* Filter Bar */}
                    <div style={{
                        background: '#fff', border: '0.5px solid #e5ddd0',
                        padding: '16px 22px', marginBottom: '40px',
                        display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center',
                    }}>
                        <div style={{ marginRight: 'auto' }}>
                            <p style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: GOLD, marginBottom: '4px', fontFamily: "'Lato',sans-serif" }}>Now Browsing</p>
                            <span style={{ fontFamily: "'Playfair Display',serif", fontSize: '18px', fontWeight: 700, color: NAVY }}>{categoryName}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                            <span style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#aaa' }}>Sort</span>
                            <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="filter-select">
                                <option value="popularity">Popularity</option>
                                <option value="price-low">Price: Low → High</option>
                                <option value="price-high">Price: High → Low</option>
                                <option value="newest">Newest First</option>
                                <option value="rating">Highest Rated</option>
                            </select>
                        </div>
                        <div style={{ fontSize: '10px', fontWeight: 700, color: '#aaa', whiteSpace: 'nowrap' }}>
                            {categoryBooks.length} document{categoryBooks.length !== 1 ? 's' : ''}
                        </div>
                    </div>

                    {categoryBooks.length === 0 ? (
                        <div style={{ background: '#fff', border: '0.5px solid #e5ddd0', padding: '80px 24px', textAlign: 'center' }}>
                            <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: '22px', color: NAVY, marginBottom: '8px' }}>No Documents Found</h3>
                            <p style={{ fontSize: '13px', color: '#aaa', marginBottom: '24px' }}>There are no documents in this category yet.</p>
                            <Link href="/documents" style={{ display: 'inline-block', padding: '12px 28px', background: NAVY, color: '#fff', textDecoration: 'none', fontSize: '12px', fontWeight: 700, fontFamily: "'Lato',sans-serif" }}>Browse All Books</Link>
                        </div>
                    ) : (
                        <>
                            {/* ══════════════════════════════════════
                                OPEN ACCESS SECTION
                            ══════════════════════════════════════ */}
                            {displayFree.length > 0 && (
                                <div className="anim-up" style={{ marginBottom: 64 }}>
                                    <SectionHeader
                                        icon="🔓"
                                        title="Open Access Documents"
                                        count={displayFree.length}
                                        description={`Free ${categoryName} documents contributed by LAN lecturers, researchers, and students — no wallet balance needed. Read instantly.`}
                                        accentColor={GREEN}
                                        badgeBg={GREEN_PALE}
                                        badgeColor={GREEN_MID}
                                        badgeBorder="rgba(22,163,74,0.3)"
                                        badge={{ label: '🔓 Always Free', bg: GREEN_PALE, border: 'rgba(22,163,74,0.3)', color: GREEN_MID }}
                                    />

                                    {freeRows.map((rowBooks, ri) => (
                                        <div key={ri} style={{ marginBottom: ri < freeRows.length - 1 ? 28 : 0 }}>
                                            {freeRows.length > 1 && (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 10 }}>
                                                    <div style={{ width: 3, height: 12, background: GREEN, flexShrink: 0 }} />
                                                    <span style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', color: '#aaa', fontFamily: "'Lato',sans-serif" }}>
                                                        Page {ri + 1}
                                                    </span>
                                                </div>
                                            )}
                                            <ScrollRow accentColor={GREEN_DARK}>
                                                {rowBooks.map(book => (
                                                    <FreeBookCard key={book.id} book={book} isPurchased={isPurchased} />
                                                ))}
                                            </ScrollRow>
                                            {ri < freeRows.length - 1 && (
                                                <div style={{ height: 1, background: `linear-gradient(to right, transparent, ${GREEN}40, transparent)`, margin: '16px 0 20px' }} />
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* ── Divider between sections ── */}
                            {displayFree.length > 0 && displayPaid.length > 0 && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: 16, margin: '0 0 48px' }}>
                                    <div style={{ flex: 1, height: '0.5px', background: '#e5ddd0' }} />
                                    <span style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '.18em', textTransform: 'uppercase', color: '#bbb', fontFamily: "'Lato',sans-serif", whiteSpace: 'nowrap' }}>
                                        Premium Collection
                                    </span>
                                    <div style={{ flex: 1, height: '0.5px', background: '#e5ddd0' }} />
                                </div>
                            )}

                            {/* ══════════════════════════════════════
                                PAID / PREMIUM SECTION
                            ══════════════════════════════════════ */}
                            {displayPaid.length > 0 && (
                                <div className="anim-up" style={{ marginBottom: 48 }}>
                                    <SectionHeader
                                        icon={meta.icon}
                                        title={`Premium ${categoryName} Documents`}
                                        count={displayPaid.length}
                                        description={`Curated, professionally published ${categoryName} documents available for purchase. Each title delivers practical, applicable knowledge.`}
                                        accentColor={meta.accent}
                                        badgeBg={CREAM}
                                        badgeColor={GOLD}
                                        badgeBorder="rgba(184,150,62,0.35)"
                                        badge={{ label: '🔒 Premium', bg: CREAM, border: 'rgba(184,150,62,0.35)', color: GOLD }}
                                    />

                                    {paidRows.map((rowBooks, ri) => (
                                        <div key={ri} style={{ marginBottom: ri < paidRows.length - 1 ? 28 : 0 }}>
                                            {paidRows.length > 1 && (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 10 }}>
                                                    <div style={{ width: 3, height: 12, background: meta.accent, flexShrink: 0 }} />
                                                    <span style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', color: '#aaa', fontFamily: "'Lato',sans-serif" }}>
                                                        Page {ri + 1}
                                                    </span>
                                                </div>
                                            )}
                                            <ScrollRow accentColor={meta.accent}>
                                                {injectAds(rowBooks, ri === 0 ? allCatAds : [], 3).map(item =>
                                                    item.isAd ? (
                                                        <AdBookCard key={item.id} ad={item} />
                                                    ) : (
                                                        <BookCard
                                                            key={item.id}
                                                            book={item}
                                                            isPurchased={isPurchased}
                                                            bookSalesCount={bookSalesCount}
                                                        />
                                                    )
                                                )}
                                            </ScrollRow>
                                            {ri < paidRows.length - 1 && (
                                                <div style={{ borderBottom: '0.5px solid rgba(184,150,62,0.2)', marginTop: '16px' }} />
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* End cap */}
                            {categoryBooks.length > BOOKSPERROW && (
                                <div style={{ textAlign: 'center', marginTop: '40px', padding: '28px', background: '#fff', border: '0.5px solid #e5ddd0' }}>
                                    <div style={{ width: '36px', height: '1px', background: GOLD, margin: '0 auto 12px' }} />
                                    <p style={{ fontFamily: "'Playfair Display',serif", fontSize: '17px', color: NAVY, fontStyle: 'italic' }}>
                                        You've seen all {categoryBooks.length} documents in {categoryName}.
                                    </p>
                                    <div style={{ width: '36px', height: '1px', background: GOLD, margin: '12px auto 0' }} />
                                </div>
                            )}
                        </>
                    )}

                    {/* ── Browse Other Categories ── */}
                    <div style={{ marginTop: '56px', background: '#fff', border: '0.5px solid #e5ddd0', padding: '32px' }}>
                        <div style={{ borderBottom: `2px solid ${GOLD}`, paddingBottom: '10px', marginBottom: '20px', display: 'inline-block' }}>
                            <p style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: GOLD, marginBottom: '3px', fontFamily: "'Lato',sans-serif" }}>Explore</p>
                            <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: '20px', fontWeight: 700, color: NAVY, margin: 0 }}>Other Categories</h3>
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '7px', marginTop: '6px' }}>
                            {categoriesData
                                .filter(cat => cat.slug !== categorySlug)
                                .map(cat => (
                                    <Link
                                        key={cat.slug}
                                        href={`/category/${cat.slug}`}
                                        className="cat-pill"
                                        style={{ textDecoration: 'none' }}
                                    >
                                        {getCategoryMeta(cat.slug).icon} {cat.name} ({categoryCounts[cat.slug] || 0})
                                    </Link>
                                ))}
                        </div>
                    </div>
                </main>

                <Footer />
            </div>
        </>
    );
}