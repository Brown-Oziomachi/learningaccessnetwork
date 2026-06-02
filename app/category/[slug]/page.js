"use client"
import React, { useState, useEffect, useMemo } from 'react';
import { ArrowLeft, ShoppingBag, ChevronRight, ThumbsUp } from 'lucide-react';
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

/* ─── colour tokens (matches AllBooksClient exactly) ─────────── */
const NAVY  = "#0d2244";
const GOLD  = "#b8963e";
const CREAM = "#f5f0e8";
const BG    = "#f5f1ea";

function AdBookCard({ ad }) {
    const tierColors = { Gold: GOLD, Silver: "#94a3b8", Bronze: "#cd7f32" };
    const tierColor = tierColors[ad.adTier] || GOLD;
    return (
        <a
            href={ad.adLink}
            style={{ flexShrink: 0, width: '200px', textDecoration: 'none', display: 'block' }}
            className="lan-book-card"
            onClick={() => {
                import("firebase/firestore").then(({ doc, updateDoc, increment }) => {
        import("@/lib/firebaseConfig").then(({ db }) => {
            updateDoc(doc(db, "promotions", ad.adId), { clicks: increment(1) }).catch(() => { });
        });
    });
}}
        >
    {/* Cover — identical dimensions to BookCard */ }
    < div style = {{ position: 'relative', marginBottom: '12px', background: '#e8e4dc' }}>
        <img
            src={ad.image}
            alt={ad.title}
            className="lan-book-img"
            style={{ width: '100%', aspectRatio: '3/4', objectFit: 'cover', display: 'block' }}
            onError={e => { e.target.src = 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400'; }}
        />
{/* PDF badge */ }
<div style={{
    position: 'absolute', top: '10px', left: '10px',
    display: 'flex', alignItems: 'center', gap: '5px',
    background: NAVY, padding: '4px 10px',
}}>
    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#22c55e', flexShrink: 0 }} />
    <span style={{ fontSize: '9px', fontWeight: 700, color: GOLD, fontFamily: "'Lato',sans-serif", letterSpacing: '0.1em', textTransform: 'uppercase' }}>PDF</span>
</div>
{/* AD badge */ }
<div style={{
    position: 'absolute', top: '10px', right: '10px',
    background: GOLD, color: NAVY,
    fontSize: '9px', fontWeight: 700, padding: '3px 8px',
    fontFamily: "'Lato',sans-serif",
}}>AD</div>
{/* Tier ribbon */ }
<div style={{
    position: 'absolute', bottom: '8px', left: '8px',
    background: 'rgba(13,34,68,0.82)', padding: '3px 8px',
    fontSize: '9px', fontWeight: 700, color: tierColor,
    fontFamily: "'Lato',sans-serif",
}}>{ad.adTier?.toUpperCase()} SPONSOR</div>
            </div >

    {/* Meta — identical layout to BookCard */ }
    < div >
                <h4 style={{
                    fontFamily: "'Playfair Display',serif",
                    fontSize: '13px', fontWeight: 700, color: NAVY,
                    margin: '0 0 4px', lineHeight: 1.35,
                    display: '-webkit-box', WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical', overflow: 'hidden',
                }}>{ad.title}</h4>
                <p style={{
                    fontSize: '11px', color: '#888', margin: '0 0 8px',
                    fontFamily: "'Lato',sans-serif",
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>{ad.author}</p>
{
    ad.category && (
        <span style={{
            fontSize: '9px', fontWeight: 700,
            background: CREAM, border: `0.5px solid rgba(184,150,62,0.35)`,
            color: GOLD, padding: '3px 8px',
            fontFamily: "'Lato',sans-serif", letterSpacing: '0.08em',
            textTransform: 'uppercase', whiteSpace: 'nowrap',
            display: 'inline-block',
        }}>{ad.category}</span>
    )
}
{
    ad.price && (
        <p style={{ fontSize: '13px', fontWeight: 700, color: NAVY, margin: '6px 0 0', fontFamily: "'Lato',sans-serif" }}>
            ₦{Number(ad.price).toLocaleString()}
        </p>
    )
}
            </div >
        </a >
    );
}
/* ═══════════════════════════════════════════════════════════════
   SHARED BOOK CARD  —  identical to AllBooksClient
═══════════════════════════════════════════════════════════════ */
function BookCard({ book, isPurchased, bookSalesCount }) {
    const sold  = bookSalesCount[book.id] || bookSalesCount[book.firestoreId] || 0;
    const owned = isPurchased(book.id);

    return (
        <a
            href={`/book/preview?id=${String(book.id).replace("firestore-", "")}`}
            style={{ flexShrink: 0, width: '200px', textDecoration: 'none', display: 'block' }}
            className="lan-book-card"
        >
            {/* Cover */}
            <div style={{ position: 'relative', marginBottom: '12px', background: '#e8e4dc' }}>
                <img
                    src={book.image}
                    alt={book.title}
                    className="lan-book-img"
                    style={{ width: '100%', aspectRatio: '3/4', objectFit: 'cover', display: 'block' }}
                    onError={e => { e.target.src = 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400'; }}
                />

                {/* LIVE badge */}
                {book.isFromFirestore && (
                    <div style={{
                        position: 'absolute', top: '10px', left: '10px',
                        display: 'flex', alignItems: 'center', gap: '5px',
                        background: NAVY, padding: '4px 10px',
                    }}>
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#22c55e', flexShrink: 0 }} />
                        <span style={{ fontSize: '9px', fontWeight: 700, color: GOLD, fontFamily: "'Lato',sans-serif", letterSpacing: '0.1em', textTransform: 'uppercase' }}>PDF</span>
                    </div>
                )}

                {/* OWNED badge */}
                {owned && (
                    <span style={{
                        position: 'absolute', top: '10px', right: '10px',
                        background: '#16a34a', color: '#fff',
                        fontSize: '9px', fontWeight: 700,
                        padding: '3px 8px', fontFamily: "'Lato',sans-serif", letterSpacing: '0.06em',
                    }}>OWNED</span>
                )}
            </div>

            {/* Meta */}
            <div>
                <h4 style={{
                    fontFamily: "'Playfair Display',serif",
                    fontSize: '13px', fontWeight: 700, color: NAVY,
                    margin: '0 0 4px', lineHeight: 1.35,
                    display: '-webkit-box', WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical', overflow: 'hidden',
                }}>{book.title}</h4>

                <p style={{
                    fontSize: '11px', color: '#888', margin: '0 0 8px',
                    fontFamily: "'Lato',sans-serif",
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>{book.author}</p>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: NAVY, fontFamily: "'Lato',sans-serif" }}>
                        {book.price > 0 ? `₦${Number(book.price).toLocaleString()}` : 'Free'}
                    </span>
                    {book.category && (
                        <span style={{
                            fontSize: '9px', fontWeight: 700,
                            background: CREAM, border: `0.5px solid rgba(184,150,62,0.35)`,
                            color: GOLD, padding: '3px 8px',
                            fontFamily: "'Lato',sans-serif", letterSpacing: '0.08em',
                            textTransform: 'uppercase', whiteSpace: 'nowrap',
                        }}>{book.category}</span>
                    )}
                </div>

                {sold > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '3px', marginTop: '6px' }}>
                        <span style={{ fontSize: '10px', color: '#bbb', display: 'flex', alignItems: 'center', gap: '3px', fontFamily: "'Lato',sans-serif" }}>
                            <ShoppingBag size={9} /> {sold} sold
                        </span>
                    </div>
                )}
            </div>
        </a>
    );
}

/* ═══════════════════════════════════════════════════════════════
   CATEGORY PAGE
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

    /* ── helpers ── */
    const getThumbnailUrl = (book) => {
        if (!book) return 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400';
        if (book.driveFileId) return `https://drive.google.com/thumbnail?id=${book.driveFileId}&sz=w400`;
        if (book.embedUrl) {
            const m = book.embedUrl.match(/\/d\/([\w-]{25,})|\/file\/d\/([\w-]{25,})/);
            if (m) return `https://drive.google.com/thumbnail?id=${m[1] || m[2]}&sz=w400`;
        }
        const pdfSource = book.pdfUrl || book.pdfLink;
        if (pdfSource?.includes('drive.google.com')) {
            const m = pdfSource.match(/\/d\/([\w-]{25,})|\/file\/d\/([\w-]{25,})/);
            if (m) return `https://drive.google.com/thumbnail?id=${m[1] || m[2]}&sz=w400`;
        }
        return book.image || book.coverImage || 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400';
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

    const categoryDescriptions = {
        'education': "Sharpen your skills with structured learning materials, study guides, and academic resources curated for students and professionals. Every document here is designed to help you learn faster and retain more.",
        'personal-development': "Invest in yourself. Discover books on mindset, habits, productivity, and emotional intelligence that successful people swear by — practical tools to help you become your best self.",
        'business': "From startup playbooks to financial strategy and leadership mastery — get the insider knowledge that drives real businesses forward. Read what the top 1% of entrepreneurs are reading.",
        'technology': "Stay ahead of the curve with the latest in software engineering, AI, cybersecurity, and digital innovation. Whether you're a developer or a tech enthusiast, these documents give you the edge.",
        'science': "Explore the frontiers of human knowledge — from biology and chemistry to physics and environmental science. Rigorous, insightful, and written to make complex ideas accessible.",
        'literature': "Timeless stories, modern voices, and everything in between. Expand your imagination and perspective with carefully selected literary works that leave a lasting impression.",
        'health-wellness': "Your health is your wealth. Access expert-backed guides on nutrition, fitness, mental health, and holistic wellness to help you feel stronger, think clearer, and live longer.",
        'history': "Those who understand history are equipped to shape the future. Dive into detailed accounts of civilisations, events, and figures that changed the world — and discover what they mean for today.",
        'arts-culture': "Celebrate human creativity. From visual arts and music theory to cultural studies and design — these documents are for those who believe beauty and expression matter.",
        'relationship': "Build deeper connections, resolve conflict, and create lasting love. Evidence-based and experience-driven guides on relationships, marriage, communication, and emotional intimacy.",
        'law': "Statutes, case summaries, constitutional law, and legal practice guides for law students and practitioners across Nigerian and international jurisdictions.",
        'medicine': "Clinical guides, anatomy references, pharmacology notes, and MBBS past questions to help medical students and healthcare professionals excel.",
        'engineering': "Structural analysis, circuit theory, thermodynamics, and more — comprehensive engineering resources across civil, mechanical, electrical, and computer disciplines.",
        'mathematics': "From calculus and linear algebra to statistics and number theory — clear, worked-example-rich documents to demystify even the most complex mathematical concepts.",
        'economics': "Micro and macroeconomics, development economics, econometrics, and policy analysis — resources that connect theory to real-world African economic contexts.",
        'agriculture': "Crop science, animal husbandry, soil management, and agribusiness guides tailored for students and practitioners in African agricultural systems.",
        'architecture': "Design principles, building technology, urban planning, and studio project resources for architecture and environmental design students.",
        'pharmacy': "Pharmacology, pharmaceutical chemistry, clinical pharmacy, and drug interaction guides for pharmacy students and healthcare professionals.",
        'accounting': "Financial accounting, management accounting, auditing, taxation, and ICAN/ATSWA study materials for accounting and finance students.",
        'political-science': "Government systems, international relations, public administration, and Nigerian political history — essential reading for political science students.",
        'mass-communication': "Journalism, broadcasting, public relations, advertising, and media studies resources for communication students and media professionals.",
        'psychology': "Abnormal psychology, cognitive science, counselling, developmental psychology, and research methods for psychology students and practitioners.",
        'sociology': "Social theory, research methodology, Nigerian social structures, and community development resources for sociology and social work students.",
        'philosophy': "Logic, ethics, metaphysics, epistemology, and African philosophy texts to challenge your thinking and sharpen your analytical skills.",
        'religious-studies': "Biblical studies, Islamic studies, African traditional religion, and comparative religion materials for theology and religious studies students.",
        'past-questions': "Exam-ready past questions from WAEC, NECO, JAMB, post-UTME, and university final exams across all departments and levels.",
        'lecture-notes': "Comprehensive, well-structured lecture notes from verified lecturers and top students across 200+ Nigerian universities and institutions.",
        'research': "Full dissertations, theses, seminar papers, and research methodology guides to help undergraduate and postgraduate students excel in academic research.",
        'self-help': "Practical guides on productivity, confidence, financial freedom, goal-setting, and emotional resilience — tools to unlock your full potential.",
        'fiction': "Compelling novels, short stories, and creative writing from African and global authors — stories that entertain, provoke, and inspire.",
    };

    const categoryDescription = categoryDescriptions[categorySlug] || "Browse our carefully curated collection of documents in this category. Each title is selected to deliver real value — knowledge you can apply immediately.";

    /* ── auth ── */
    useEffect(() => {
        const unsub = onAuthStateChanged(auth, cu => { cu ? setUser(cu) : router.push('/auth/signin'); });
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
                        pages: data.pages, format: data.format || 'PDF',
                        description: data.description, rating: 4.5, reviews: 0,
                        driveFileId: data.driveFileId || data.fileId,
                        pdfUrl: data.pdfUrl, embedUrl: data.embedUrl,
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

    /* ── derived data ── */
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

    const displayBooks = useMemo(() => sortBooks(categoryBooks), [categoryBooks, sortBy]);

    const isPurchased = id =>
        purchasedBookIds.has(id) || purchasedBookIds.has(String(id)) ||
        purchasedBookIds.has(`firestore-${id}`) || purchasedBookIds.has(String(id).replace('firestore-', ''));

    /* ── rows (10 per row, same as AllBooksClient) ── */
    const booksPerRow = 10;
    const bookRows    = [];
    for (let i = 0; i < Math.ceil(displayBooks.length / booksPerRow); i++) {
        bookRows.push(displayBooks.slice(i * booksPerRow, (i + 1) * booksPerRow));
    }

    /* ── loading ── */
    if (loading) return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: BG }}>
            <div style={{ textAlign: 'center' }}>
                <div style={{
                    width: '56px', height: '56px',
                    border: `3px solid ${GOLD}`, borderTopColor: 'transparent',
                    borderRadius: '50%', animation: 'spin 0.8s linear infinite',
                    margin: '0 auto 16px',
                }} />
                <p style={{ fontFamily: "'Playfair Display',serif", fontSize: '18px', color: NAVY, letterSpacing: '0.05em' }}>
                    Loading Documents…
                </p>
                <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
            </div>
        </div>
    );

    /* ── render ── */
    return (
        <>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400&family=Lato:wght@300;400;700&display=swap');
                .lan-root  { font-family:'Lato',sans-serif; background:${BG}; }
                .lan-serif { font-family:'Playfair Display',Georgia,serif; }
                .lan-book-card  { text-decoration:none; display:block; }
                .lan-book-img   { transition:opacity 0.22s; }
                .lan-book-card:hover .lan-book-img { opacity:0.88; }
                .lan-book-card:hover h4 { color:${GOLD}; }
                h4 { transition:color 0.18s; }
                .sbar-none { scrollbar-width:none; -ms-overflow-style:none; }
                .sbar-none::-webkit-scrollbar { display:none; }
                .cat-pill {
                    border:0.5px solid #e5ddd0; background:#fff; color:${NAVY};
                    font-family:'Lato',sans-serif; font-size:11px; font-weight:700;
                    letter-spacing:0.07em; text-transform:uppercase; padding:8px 16px;
                    cursor:pointer; transition:background 0.18s,color 0.18s,border-color 0.18s;
                    white-space:nowrap;
                }
                .cat-pill:hover { background:${NAVY}; color:#fff; border-color:${NAVY}; }
                .filter-select {
                    border:0.5px solid #e5ddd0; background:#fff; color:${NAVY};
                    font-family:'Lato',sans-serif; font-size:12px; font-weight:700;
                    padding:9px 14px; outline:none; cursor:pointer;
                }
                @keyframes slideUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
                .anim-up { animation:slideUp 0.5s cubic-bezier(0.4,0,0.2,1) both; }
            `}</style>

            <div className="lan-root" style={{ minHeight: '100vh' }}>
                <Navbar />

                {/* ── Hero Banner ── */}
                <section style={{
                    background: NAVY,
                    backgroundImage: 'radial-gradient(rgba(184,150,62,0.06) 1px,transparent 1px)',
                    backgroundSize: '28px 28px',
                    padding: '60px 24px 52px',
                }}>
                    {/* Back button + Title */}
                    <div style={{ maxWidth: '1200px', margin: '0 auto 28px' }}>
                        <button
                            onClick={() => router.back()}
                            style={{
                                display: 'inline-flex', alignItems: 'center', gap: '8px',
                                background: 'rgba(184,150,62,0.1)', border: '0.5px solid rgba(184,150,62,0.3)',
                                color: GOLD, padding: '8px 16px', cursor: 'pointer',
                                fontFamily: "'Lato',sans-serif", fontSize: '11px',
                                fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase',
                                marginBottom: '20px',
                            }}
                        >
                            <ArrowLeft size={13} /> Back
                        </button>
                        <h1 className="lan-serif" style={{
                            fontSize: 'clamp(28px,4vw,48px)', fontWeight: 700,
                            color: '#fff', margin: 0, lineHeight: 1.1,
                        }}>
                            {categoryName}
                        </h1>
                        <p style={{
                            fontSize: '13px', color: 'rgba(255,255,255,0.45)',
                            marginTop: '10px', fontFamily: "'Lato',sans-serif",
                        }}>
                            Access on your web browser, Android, or iOS device.
                        </p>
                    </div>

                    {/* Stats strip */}
                    <div style={{
                        maxWidth: '1200px', margin: '0 auto',
                        display: 'flex', flexWrap: 'wrap', gap: '0',
                        borderTop: '0.5px solid rgba(184,150,62,0.2)', paddingTop: '28px',
                    }}>
                        {[
                            { val: `${displayBooks.length}`,   label: 'Documents' },
                            { val: `${categoriesData.length}`, label: 'Categories' },
                            { val: 'Free',                     label: 'Basic Access' },
                            { val: 'Instant',                  label: 'Download' },
                        ].map(({ val, label }) => (
                            <div key={label} style={{
                                flex: '1 1 110px', paddingRight: '20px',
                                borderRight: '0.5px solid rgba(184,150,62,0.12)', marginRight: '20px',
                            }}>
                                <div className="lan-serif" style={{ fontSize: '24px', fontWeight: 700, color: '#fff' }}>{val}</div>
                                <div style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(184,150,62,0.7)', marginTop: '3px' }}>{label}</div>
                            </div>
                        ))}
                    </div>
                </section>
                
                {/* ── Breadcrumb ── */}
                <div style={{ background: CREAM, borderBottom: '0.5px solid #e5ddd0', padding: '10px 24px' }}>
                    <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#888', fontFamily: "'Lato',sans-serif" }}>
                        <Link href="/home" style={{ color: NAVY, fontWeight: 700, textDecoration: 'none' }}>Home</Link>
                        <ChevronRight size={12} />
                        <Link href="/documents" style={{ color: NAVY, fontWeight: 700, textDecoration: 'none' }}>All Books</Link>
                        <ChevronRight size={12} />
                        <span style={{ color: '#aaa' }}>{categoryName}</span>
                    </div>
                </div>

                {/* ── Main ── */}
                <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '56px 24px' }}>

                    {/* Filter Bar */}
                    <div style={{
                        background: '#fff', border: '0.5px solid #e5ddd0',
                        padding: '18px 24px', marginBottom: '40px',
                        display: 'flex', flexWrap: 'wrap', gap: '14px', alignItems: 'center',
                    }}>
                        <div style={{ marginRight: 'auto', maxWidth: '560px' }}>
                            <p style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: GOLD, marginBottom: '6px', fontFamily: "'Lato',sans-serif" }}>
                                Now Browsing
                            </p>
                            <span style={{ fontFamily: "'Playfair Display',serif", fontSize: '20px', fontWeight: 700, color: NAVY, display: 'block', marginBottom: '8px' }}>
                                {categoryName}
                            </span>
                            <p style={{ fontSize: '12px', color: '#6b7280', fontFamily: "'Lato',sans-serif", lineHeight: 1.7, margin: 0 }}>
                                {categoryDescription}
                            </p>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#aaa' }}>Sort</span>
                            <select
                                value={sortBy}
                                onChange={e => setSortBy(e.target.value)}
                                className="filter-select"
                            >
                                <option value="popularity">Popularity</option>
                                <option value="price-low">Price: Low → High</option>
                                <option value="price-high">Price: High → Low</option>
                                <option value="newest">Newest First</option>
                                <option value="rating">Highest Rated</option>
                            </select>
                        </div>
                        <div style={{ fontSize: '11px', fontWeight: 700, color: '#aaa', whiteSpace: 'nowrap' }}>
                            {displayBooks.length} document{displayBooks.length !== 1 ? 's' : ''}
                        </div>
                    </div>

                    {/* Book Rows */}
                    {displayBooks.length === 0 ? (
                        <div style={{ background: '#fff', border: '0.5px solid #e5ddd0', padding: '80px 24px', textAlign: 'center' }}>
                            <h3 className="lan-serif" style={{ fontSize: '24px', color: NAVY, marginBottom: '8px' }}>No Documents Found</h3>
                            <p style={{ fontSize: '13px', color: '#aaa', marginBottom: '24px' }}>There are no documents in this category yet.</p>
                            <Link href="/documents" style={{
                                display: 'inline-block', padding: '12px 28px',
                                background: NAVY, color: '#fff', textDecoration: 'none',
                                fontSize: '13px', fontWeight: 700, fontFamily: "'Lato',sans-serif",
                            }}>Browse All Books</Link>
                        </div>
                    ) : (
                        <>
                            {bookRows.map((rowBooks, ri) => (
                                <div key={ri} style={{ marginBottom: '56px' }} className="anim-up">
                                    {ri === 0 && (
                                        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '24px' }}>
                                            <div>
                                                <p style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: GOLD, marginBottom: '6px', fontFamily: "'Lato',sans-serif" }}>
                                                    {categoryName} Collection
                                                </p>
                                                <h2 className="lan-serif" style={{ fontSize: 'clamp(22px,3vw,32px)', fontWeight: 700, color: NAVY, margin: 0 }}>
                                                    {displayBooks.length} Documents Available
                                                </h2>
                                            </div>
                                        </div>
                                    )}

                                    {/* Horizontal scroll row */}
                                    <div className="sbar-none" style={{ overflowX: 'auto', margin: '0 -4px', padding: '0 4px 12px' }}>
                                        <div style={{ display: 'flex', gap: '20px', paddingBottom: '4px' }}>
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
                                        </div>
                                    </div>

                                    {/* Gold divider between rows */}
                                    {ri < bookRows.length - 1 && (
                                        <div style={{ borderBottom: '0.5px solid rgba(184,150,62,0.2)', marginTop: '16px' }} />
                                    )}
                                </div>
                            ))}

                            {/* End cap */}
                            {displayBooks.length > booksPerRow && (
                                <div style={{ textAlign: 'center', marginTop: '40px', padding: '32px', background: '#fff', border: '0.5px solid #e5ddd0' }}>
                                    <div style={{ width: '40px', height: '1px', background: GOLD, margin: '0 auto 14px' }} />
                                    <p className="lan-serif" style={{ fontSize: '18px', color: NAVY, fontStyle: 'italic' }}>
                                        You've seen all {displayBooks.length} documents in {categoryName}.
                                    </p>
                                    <div style={{ width: '40px', height: '1px', background: GOLD, margin: '14px auto 0' }} />
                                </div>
                            )}
                        </>
                    )}

                    {/* ── Browse Other Categories ── */}
                    <div style={{
                        marginTop: '64px', background: '#fff',
                        border: '0.5px solid #e5ddd0', padding: '36px',
                    }}>
                        <div style={{ borderBottom: `2px solid ${GOLD}`, paddingBottom: '12px', marginBottom: '24px', display: 'inline-block' }}>
                            <p style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: GOLD, marginBottom: '4px', fontFamily: "'Lato',sans-serif" }}>Explore</p>
                            <h3 className="lan-serif" style={{ fontSize: '22px', fontWeight: 700, color: NAVY, margin: 0 }}>Other Categories</h3>
                        </div>

                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px' }}>
                            {categoriesData
                                .filter(cat => cat.slug !== categorySlug)
                                .map(cat => (
                                    <Link
                                        key={cat.slug}
                                        href={`/category/${cat.slug}`}
                                        className="cat-pill"
                                        style={{ textDecoration: 'none' }}
                                    >
                                        {cat.name} ({categoryCounts[cat.slug] || 0})
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