"use client"
import React, { useState, useEffect } from 'react';
import { Search, ShoppingBag, ChevronRight, FileText, Filter, Plus, ThumbsUp, ArrowRight, Sparkles, Unlock } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "@/lib/firebaseConfig";
import { booksData } from "@/lib/booksData";
import { doc, getDoc, updateDoc, collection, query, where, getDocs, increment, orderBy } from 'firebase/firestore';
import Navbar from '@/components/NavBar';
import Footer from '@/components/FooterComp';
import { useAds, injectAds } from "@/lib/useAds";
import FeaturedAdsCarousel from "@/components/FeaturedAdsCarousel";

/* ─── colour tokens ─────────────────────────────────────────── */
const NAVY = "#0d2244";
const GOLD = "#b8963e";
const GOLDD = "#d4aa5a";
const CREAM = "#f5f0e8";
const BG = "#f5f1ea";

const CAROUSEL_TIERS = ["Gold", "Silver", "Bronze"];

/* ─── helpers ─────────────────────────────────────────────────── */
const isFreeBook = (book) => book.isFree === true || Number(book.price) === 0;

/* ══════════════════════════════════════════════════════════════
   OPEN ACCESS BADGE
══════════════════════════════════════════════════════════════ */
function OpenAccessBadge({ style = {} }) {
    return (
        <span style={{
            display: 'inline-flex', alignItems: 'center', gap: '4px',
            fontSize: '9px', fontWeight: 700, letterSpacing: '0.1em',
            textTransform: 'uppercase', fontFamily: "'Lato',sans-serif",
            background: 'linear-gradient(135deg, #14532d, #166534)',
            color: '#86efac',
            padding: '3px 8px',
            border: '0.5px solid rgba(134,239,172,0.4)',
            ...style,
        }}>
            <Unlock size={8} strokeWidth={2.5} />
            Open Access
        </span>
    );
}

/* ══════════════════════════════════════════════════════════════
   SHARED BOOK CARD  — with Open Access conditional rendering
══════════════════════════════════════════════════════════════ */
function BookCard({ book, isPurchased, bookSalesCount, getFeedbackCount }) {
    const sold = bookSalesCount[book.id] || bookSalesCount[book.firestoreId] || 0;
    const feedback = getFeedbackCount ? getFeedbackCount(book) : 0;
    const owned = isPurchased(book.id);
    const free = isFreeBook(book);

    return (
        <a
            href={`/book/preview?id=${String(book.id).replace("firestore-", "")}`}
            style={{ flexShrink: 0, width: '200px', textDecoration: 'none', display: 'block' }}
            className="lan-book-card"
        >
            <div style={{ position: 'relative', marginBottom: '12px', background: '#e8e4dc' }}>
                <img
                    src={book.image}
                    alt={book.title}
                    className="lan-book-img"
                    style={{ width: '100%', aspectRatio: '3/4', objectFit: 'cover', display: 'block' }}
                    onError={e => { e.target.src = 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400'; }}
                />
                {book.isFromFirestore && (
                    <div style={{ position: 'absolute', top: '10px', left: '10px', display: 'flex', alignItems: 'center', gap: '5px', background: NAVY, padding: '4px 10px' }}>
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#22c55e', flexShrink: 0 }} />
                        <span style={{ fontSize: '9px', fontWeight: 700, color: GOLD, fontFamily: "'Lato',sans-serif", letterSpacing: '0.1em', textTransform: 'uppercase' }}>PDF</span>
                    </div>
                )}
                {/* Open Access ribbon — top-right corner badge */}
                {free && (
                    <div style={{
                        position: 'absolute', top: '10px', right: '10px',
                        background: 'linear-gradient(135deg,#14532d,#166534)',
                        color: '#86efac', fontSize: '8px', fontWeight: 700,
                        padding: '3px 7px', fontFamily: "'Lato',sans-serif",
                        letterSpacing: '0.06em', display: 'flex', alignItems: 'center', gap: 3,
                    }}>
                        <Unlock size={7} strokeWidth={2.5} /> FREE
                    </div>
                )}
                {owned && !free && (
                    <span style={{ position: 'absolute', top: '10px', right: '10px', background: '#16a34a', color: '#fff', fontSize: '9px', fontWeight: 700, padding: '3px 8px', fontFamily: "'Lato',sans-serif", letterSpacing: '0.06em' }}>OWNED</span>
                )}
            </div>

            <div>
                <h4 style={{ fontFamily: "'Playfair Display',serif", fontSize: '13px', fontWeight: 700, color: NAVY, margin: '0 0 4px', lineHeight: 1.35, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{book.title}</h4>
                <p style={{ fontSize: '11px', color: '#888', margin: '0 0 8px', fontFamily: "'Lato',sans-serif", overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{book.author}</p>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px', flexWrap: 'wrap' }}>
                    {/* Price OR Open Access badge */}
                    {free
                        ? <OpenAccessBadge />
                        : (
                            <span style={{ fontSize: '13px', fontWeight: 700, color: NAVY, fontFamily: "'Lato',sans-serif" }}>
                                {book.price ? `₦${Number(book.price).toLocaleString()}` : ''}
                            </span>
                        )
                    }
                    {book.category && (
                        <span style={{ fontSize: '9px', fontWeight: 700, background: CREAM, border: `0.5px solid rgba(184,150,62,0.35)`, color: GOLD, padding: '3px 8px', fontFamily: "'Lato',sans-serif", letterSpacing: '0.08em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{book.category}</span>
                    )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '6px' }}>
                    {sold > 0 && <span style={{ fontSize: '10px', color: '#bbb', display: 'flex', alignItems: 'center', gap: '3px', fontFamily: "'Lato',sans-serif" }}><ShoppingBag size={9} /> {sold}</span>}
                    {feedback > 0 && <span style={{ fontSize: '10px', color: '#bbb', display: 'flex', alignItems: 'center', gap: '3px', fontFamily: "'Lato',sans-serif" }}><ThumbsUp size={9} /> {feedback}</span>}
                </div>
            </div>
        </a>
    );
}

/* ══════════════════════════════════════════════════════════════
   AD CARD  (unchanged)
══════════════════════════════════════════════════════════════ */
function AdCard({ book }) {
    const handleClick = () => {
        updateDoc(doc(db, "promotions", book.adId), { clicks: increment(1) }).catch(() => { });
    };
    return (
        <a href={book.adLink} onClick={handleClick} style={{ flexShrink: 0, width: '200px', textDecoration: 'none', display: 'block' }} className="lan-book-card">
            <div style={{ position: 'relative', marginBottom: '12px', background: '#e8e4dc' }}>
                <img src={book.image} alt={book.title} className="lan-book-img" style={{ width: '100%', aspectRatio: '3/4', objectFit: 'cover', display: 'block' }} onError={e => { e.target.src = 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400'; }} />
                <div style={{ position: 'absolute', top: '10px', left: '10px', display: 'flex', alignItems: 'center', gap: '5px', background: NAVY, padding: '4px 10px' }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#22c55e', flexShrink: 0 }} />
                    <span style={{ fontSize: '9px', fontWeight: 700, color: GOLD, fontFamily: "'Lato',sans-serif", letterSpacing: '0.1em', textTransform: 'uppercase' }}>PDF</span>
                </div>
                <div style={{ position: 'absolute', top: '10px', right: '10px', background: GOLD, color: NAVY, fontSize: '9px', fontWeight: 700, padding: '3px 8px', fontFamily: "'Lato',sans-serif" }}>AD</div>
                <div style={{ position: 'absolute', bottom: '8px', left: '8px', background: 'rgba(13,34,68,0.82)', padding: '3px 8px', fontSize: '9px', fontWeight: 700, color: GOLD, fontFamily: "'Lato',sans-serif" }}>GOLD SPONSOR</div>
            </div>
            <div>
                <h4 style={{ fontFamily: "'Playfair Display',serif", fontSize: '13px', fontWeight: 700, color: NAVY, margin: '0 0 4px', lineHeight: 1.35, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{book.title}</h4>
                <p style={{ fontSize: '11px', color: '#888', margin: '0 0 8px', fontFamily: "'Lato',sans-serif", overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{book.author}</p>
                {book.category && <span style={{ fontSize: '9px', fontWeight: 700, background: CREAM, border: `0.5px solid rgba(184,150,62,0.35)`, color: GOLD, padding: '3px 8px', fontFamily: "'Lato',sans-serif", letterSpacing: '0.08em', textTransform: 'uppercase', display: 'inline-block' }}>{book.category}</span>}
            </div>
        </a>
    );
}

/* ══════════════════════════════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════════════════════════════ */
export default function AllBooksClient() {
    const router = useRouter();

    const [searchQuery, setSearchQuery] = useState('');
    const [purchasedBookIds, setPurchasedBookIds] = useState(new Set());
    const [sortBy, setSortBy] = useState('popularity');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [user, setUser] = useState(null);
    const [allBooks, setAllBooks] = useState([]);
    const [loadingBooks, setLoadingBooks] = useState(true);
    const [bookSalesCount, setBookSalesCount] = useState({});
    const [visibleRows, setVisibleRows] = useState(5);
    const [bookFeedbackCounts, setBookFeedbackCounts] = useState({});

    const goldAds = useAds("Gold", 4);
    const silverAds = useAds("Silver", 3);
    const booksPerRow = 10;
    const rowsPerLoad = 2;
    const searchParams = useSearchParams();
    const filter = searchParams.get('filter');

    /* ── categories (Open Access Hub added) ── */
    const categories = [
        { value: 'all', label: 'All Categories' },
        /* ▼ Open Access Hub — special filter chip ▼ */
        { value: 'open-access', label: '🔓 Open Access Hub', isSpecial: true },
        { value: 'past questions', label: 'Past Questions' },
        { value: 'education', label: 'Education' },
        { value: 'personal development', label: 'Personal Development' },
        { value: 'business', label: 'Business' },
        { value: 'technology', label: 'Technology' },
        { value: 'science', label: 'Science' },
        { value: 'literature', label: 'Literature' },
        { value: 'health wellness', label: 'Health & Wellness' },
        { value: 'history', label: 'History' },
        { value: 'arts culture', label: 'Arts & Culture' },
    ];

    const getThumbnailUrl = (book) => {
        if (book.driveFileId) return `https://drive.google.com/thumbnail?id=${book.driveFileId}&sz=w400`;
        if (book.embedUrl) {
            const m = book.embedUrl.match(/\/d\/(.*?)\/|\/file\/d\/(.*?)\/|id=(.*?)(&|$)/);
            if (m) { const id = m[1] || m[2] || m[3]; if (id) return `https://drive.google.com/thumbnail?id=${id}&sz=w400`; }
        }
        if (book.pdfUrl?.includes('drive.google.com')) {
            const m = book.pdfUrl.match(/[-\w]{25,}/);
            if (m) return `https://drive.google.com/thumbnail?id=${m[0]}&sz=w400`;
        }
        return book.image || 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400';
    };

    /* ── feedback ── */
    useEffect(() => {
        const fetchFeedback = async () => {
            try {
                const snap = await getDocs(collection(db, "bookFeedbacks"));
                const map = {};
                snap.forEach(d => {
                    const id = d.data().bookId; if (!id) return;
                    const clean = id.replace("firestore-", "");
                    [id, clean, `firestore-${clean}`].forEach(k => { map[k] = (map[k] || 0) + 1; });
                });
                setBookFeedbackCounts(map);
            } catch { }
        };
        fetchFeedback();
    }, []);

    const getFeedbackCount = (book) => {
        const id = String(book.id || "");
        const fid = String(book.firestoreId || "");
        const clean = id.replace("firestore-", "");
        return bookFeedbackCounts[id] || bookFeedbackCounts[fid] || bookFeedbackCounts[clean] || bookFeedbackCounts[`firestore-${clean}`] || 0;
    };

    useEffect(() => {
        if (filter === 'past-questions') { setSelectedCategory('past questions'); setSearchQuery('past questions'); }
        if (filter === 'open-access') { setSelectedCategory('open-access'); }
    }, [filter]);

    /* ── UNIFIED fetch: all approved books regardless of price ── */
    useEffect(() => {
        const fetchAllBooks = async () => {
            try {
                setLoadingBooks(true);
                const processed = booksData.map(b => ({ ...b, image: getThumbnailUrl(b) }));
                setAllBooks(processed);
                try {
                    /* Single query — no price filter; sort by createdAt desc for freshness */
                    const snap = await getDocs(
                        query(
                            collection(db, 'advertMyBook'),
                            where('status', '==', 'approved'),
                            orderBy('createdAt', 'desc')
                        )
                    );
                    if (!snap.empty) {
                        const fb = [];
                        snap.forEach(d => {
                            const data = d.data();
                            if (data.bookTitle) {        // ← removed price gate
                                const b = {
                                    id: `firestore-${d.id}`,
                                    firestoreId: d.id,
                                    title: data.bookTitle,
                                    author: data.author || 'Unknown',
                                    category: (data.category || 'education').toLowerCase(),
                                    price: Number(data.price) || 0,   // 0 = free
                                    isFree: data.isFree === true || Number(data.price) === 0,
                                    pages: data.pages || 100,
                                    format: 'PDF',
                                    description: data.description || 'No description',
                                    driveFileId: data.driveFileId,
                                    pdfUrl: data.pdfUrl,
                                    embedUrl: data.embedUrl,
                                    isFromFirestore: true,
                                    rating: 4.5,
                                    reviews: 0,
                                };
                                b.image = getThumbnailUrl(b);
                                fb.push(b);
                            }
                        });
                        setAllBooks([...processed, ...fb]);
                    }
                } catch { }
            } catch {
                setAllBooks(booksData.map(b => ({ ...b, image: getThumbnailUrl(b) })));
            } finally { setLoadingBooks(false); }
        };
        fetchAllBooks();
    }, []);

    /* ── filter + sort ── */
    const filteredBooks = allBooks.filter(b => {
        /* Open Access Hub shortcut */
        if (selectedCategory === 'open-access') return isFreeBook(b);

        const cat = selectedCategory === 'all' || b.category === selectedCategory;
        const srch = !searchQuery ||
            b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            b.author.toLowerCase().includes(searchQuery.toLowerCase());
        return cat && srch;
    }).filter(b => {
        /* When a text search is active, also apply it for Open Access view */
        if (selectedCategory !== 'open-access') return true;
        return !searchQuery ||
            b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            b.author.toLowerCase().includes(searchQuery.toLowerCase());
    });

    const sortBooks = (books) => {
        const s = [...books];
        switch (sortBy) {
            case 'price-low': return s.sort((a, b) => a.price - b.price);
            case 'price-high': return s.sort((a, b) => b.price - a.price);
            case 'rating': return s.sort((a, b) => (b.rating || 0) - (a.rating || 0));
            case 'newest': return s.sort((a, b) => (a.isFromFirestore ? -1 : 1));
            case 'title': return s.sort((a, b) => a.title.localeCompare(b.title));
            case 'free-first': return s.sort((a, b) => (isFreeBook(b) ? 1 : 0) - (isFreeBook(a) ? 1 : 0));
            default: return s.sort((a, b) => (b.reviews || 0) - (a.reviews || 0));
        }
    };

    const sortedBooks = sortBooks(filteredBooks);
    const totalRows = Math.ceil(sortedBooks.length / booksPerRow);
    const hasMoreRows = visibleRows < totalRows;
    const displayBooks = sortedBooks.slice(0, visibleRows * booksPerRow);

    const bookRows = [];
    for (let i = 0; i < visibleRows; i++) {
        const s = i * booksPerRow, e = Math.min(s + booksPerRow, displayBooks.length);
        if (s < displayBooks.length) bookRows.push(displayBooks.slice(s, e));
    }

    const handleLoadMore = () => {
        setVisibleRows(p => Math.min(p + rowsPerLoad, totalRows));
        setTimeout(() => window.scrollBy({ top: 400, behavior: 'smooth' }), 100);
    };

    useEffect(() => { setVisibleRows(5); }, [selectedCategory, searchQuery, sortBy]);

    /* ── sales ── */
    useEffect(() => {
        const fetchSales = async () => {
            try {
                const snap = await getDocs(collection(db, "users"));
                const map = {};
                snap.docs.forEach(u => {
                    Object.values(u.data().purchasedBooks || {}).forEach(p => {
                        const id = p.bookId || p.id || p.firestoreId;
                        if (id) { map[id] = (map[id] || 0) + 1; map[`firestore-${id}`] = (map[`firestore-${id}`] || 0) + 1; }
                    });
                });
                setBookSalesCount(map);
            } catch { }
        };
        fetchSales();
    }, []);

    /* ── auth ── */
    useEffect(() => {
        const unsub = onAuthStateChanged(auth, cu => { cu ? setUser(cu) : router.push('/auth/signin'); });
        return () => unsub();
    }, [router]);

    /* ── purchased ── */
    useEffect(() => {
        const load = async () => {
            try {
                const cu = auth.currentUser; if (!cu) return;
                const ud = await getDoc(doc(db, 'users', cu.uid));
                if (ud.exists()) {
                    const pb = ud.data().purchasedBooks || {};
                    const arr = Array.isArray(pb) ? pb : Object.values(pb);
                    setPurchasedBookIds(new Set(arr.map(b => b.id || b.bookId || b.firestoreId).filter(Boolean)));
                }
            } catch { }
        };
        if (user) load();
    }, [user]);

    const isPurchased = id =>
        purchasedBookIds.has(id) || purchasedBookIds.has(String(id)) ||
        purchasedBookIds.has(`firestore-${id}`) || purchasedBookIds.has(String(id).replace('firestore-', ''));

    /* count free books for badge on the filter chip */
    const freeBookCount = allBooks.filter(isFreeBook).length;

    if (loadingBooks) return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: BG }}>
            <div style={{ textAlign: 'center' }}>
                <div style={{ width: '56px', height: '56px', border: `3px solid ${GOLD}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
                <p style={{ fontFamily: "'Playfair Display',serif", fontSize: '18px', color: NAVY, letterSpacing: '0.05em' }}>Loading Documents…</p>
                <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
            </div>
        </div>
    );

    /* ── is Open Access Hub active? ── */
    const isOpenAccessView = selectedCategory === 'open-access';

    return (
        <>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400&family=Lato:wght@300;400;700&display=swap');
                .lan-root { font-family:'Lato',sans-serif; background:${BG}; }
                .lan-serif { font-family:'Playfair Display',Georgia,serif; }
                .lan-book-card { text-decoration:none; display:block; }
                .lan-book-img { transition:opacity 0.22s; }
                .lan-book-card:hover .lan-book-img { opacity:0.88; }
                .lan-book-card:hover h4 { color:${GOLD}; }
                h4 { transition:color 0.18s; }
                .sbar-none { scrollbar-width:none; -ms-overflow-style:none; }
                .sbar-none::-webkit-scrollbar { display:none; }

                /* Standard category pill */
                .cat-pill {
                    border:0.5px solid #e5ddd0; background:#fff; color:${NAVY};
                    font-family:'Lato',sans-serif; font-size:11px; font-weight:700;
                    letter-spacing:0.07em; text-transform:uppercase; padding:8px 16px;
                    cursor:pointer; transition:background 0.18s,color 0.18s,border-color 0.18s; white-space:nowrap;
                }
                .cat-pill.active,.cat-pill:hover { background:${NAVY}; color:#fff; border-color:${NAVY}; }

                /* Open Access Hub special pill */
                .open-access-pill {
                    border:0.5px solid rgba(134,239,172,0.5);
                    background:rgba(20,83,45,0.08); color:#166534;
                    font-family:'Lato',sans-serif; font-size:11px; font-weight:700;
                    letter-spacing:0.07em; padding:8px 16px;
                    cursor:pointer; transition:all 0.18s; white-space:nowrap;
                    display:inline-flex; align-items:center; gap:5px;
                }
                .open-access-pill.active,
                .open-access-pill:hover {
                    background:linear-gradient(135deg,#14532d,#166534);
                    color:#86efac; border-color:transparent;
                }

                .filter-select { border:0.5px solid #e5ddd0; background:#fff; color:${NAVY}; font-family:'Lato',sans-serif; font-size:12px; font-weight:700; padding:9px 14px; outline:none; cursor:pointer; }
                .load-btn { display:inline-flex; align-items:center; gap:8px; padding:14px 36px; background:${NAVY}; color:#fff; font-family:'Lato',sans-serif; font-size:13px; font-weight:700; letter-spacing:0.05em; border:none; cursor:pointer; transition:background 0.18s; }
                .load-btn:hover { background:#1a3a6e; }
                @keyframes slideUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
                .anim-up { animation:slideUp 0.5s cubic-bezier(0.4,0,0.2,1) both; }

                /* Open Access Hub hero banner */
                .oa-hero {
                    background:linear-gradient(135deg,#052e16,#14532d 60%,#166534);
                    border-bottom:0.5px solid rgba(134,239,172,0.25);
                    padding:32px 24px;
                    position:relative; overflow:hidden;
                }
                .oa-hero::before {
                    content:'';position:absolute;inset:0;
                    background-image:radial-gradient(rgba(134,239,172,0.06) 1px,transparent 1px);
                    background-size:22px 22px;
                }
            `}</style>

            <div className="lan-root" style={{ minHeight: '100vh' }}>
                <Navbar />

                {/* ── Hero Banner (standard) ── */}
                {!isOpenAccessView && (
                    <section style={{ background: NAVY, backgroundImage: 'radial-gradient(rgba(184,150,62,0.06) 1px,transparent 1px)', backgroundSize: '28px 28px', padding: '60px 24px 52px' }}>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0', borderTop: '0.5px solid rgba(184,150,62,0.2)', paddingTop: '28px' }}>
                            {[
                                { val: `${allBooks.length}+`, label: 'Documents' },
                                { val: `${freeBookCount}`, label: 'Free / Open Access' },
                                { val: 'Free', label: 'Basic Access' },
                                { val: 'Instant', label: 'Download' },
                            ].map(({ val, label }) => (
                                <div key={label} style={{ flex: '1 1 110px', paddingRight: '20px', borderRight: '0.5px solid rgba(184,150,62,0.12)', marginRight: '20px' }}>
                                    <div className="lan-serif" style={{ fontSize: '24px', fontWeight: 700, color: '#fff' }}>{val}</div>
                                    <div style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(184,150,62,0.7)', marginTop: '3px' }}>{label}</div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* ── Open Access Hub Hero ── */}
                {isOpenAccessView && (
                    <section className="oa-hero">
                        <div style={{ maxWidth: '900px', margin: '0 auto', position: 'relative' }}>
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(134,239,172,0.12)', border: '0.5px solid rgba(134,239,172,0.3)', padding: '6px 14px', marginBottom: '16px' }}>
                                <Unlock size={12} color="#86efac" />
                                <span style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#86efac', fontFamily: "'Lato',sans-serif" }}>Open Access Hub</span>
                            </div>
                            <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: 'clamp(28px,5vw,48px)', fontWeight: 700, color: '#fff', margin: '0 0 10px', lineHeight: 1.1 }}>
                                Free for <span style={{ color: '#86efac', fontStyle: 'italic' }}>Everyone.</span>
                            </h1>
                            <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.55)', fontWeight: 300, margin: 0 }}>
                                {freeBookCount} documents — no purchase required. Read, download, and share freely.
                            </p>
                        </div>
                    </section>
                )}

                {/* ── Breadcrumb ── */}
                <div style={{ background: CREAM, borderBottom: '0.5px solid #e5ddd0', padding: '10px 24px' }}>
                    <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#888', fontFamily: "'Lato',sans-serif" }}>
                        <Link href="/" style={{ color: NAVY, fontWeight: 700, textDecoration: 'none' }}>Home</Link>
                        <ChevronRight size={12} />
                        {isOpenAccessView
                            ? <><Link href="/documents" style={{ color: NAVY, fontWeight: 700, textDecoration: 'none' }}>All PDF Books</Link><ChevronRight size={12} /><span style={{ color: '#86efac', fontWeight: 700 }}>Open Access Hub</span></>
                            : <span style={{ color: '#aaa' }}>All PDF Books</span>
                        }
                    </div>
                </div>

                {/* ── Main ── */}
                <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '56px 24px' }}>

                    {/* Filter Bar */}
                    <div style={{ background: '#fff', border: '0.5px solid #e5ddd0', padding: '18px 24px', marginBottom: '40px', display: 'flex', flexWrap: 'wrap', gap: '14px', alignItems: 'center' }}>
                        <div style={{ flex: '1', minWidth: '200px', position: 'relative' }}>
                            <Search size={13} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#bbb' }} />
                            <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search books or authors…"
                                style={{ width: '100%', padding: '10px 12px 10px 34px', border: '0.5px solid #e5ddd0', fontSize: '13px', fontFamily: "'Lato',sans-serif", outline: 'none', color: NAVY, boxSizing: 'border-box' }} />
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#aaa' }}>Category</span>
                            <select value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)} className="filter-select">
                                {categories.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                            </select>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#aaa' }}>Sort</span>
                            <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="filter-select">
                                <option value="popularity">Popularity</option>
                                <option value="price-low">Price: Low → High</option>
                                <option value="price-high">Price: High → Low</option>
                                <option value="free-first">Free First</option>
                                <option value="newest">Newest First</option>
                                <option value="rating">Highest Rated</option>
                                <option value="title">Title (A–Z)</option>
                            </select>
                        </div>
                        <div style={{ marginLeft: 'auto', fontSize: '11px', fontWeight: 700, color: '#aaa', whiteSpace: 'nowrap' }}>
                            {displayBooks.length} / {sortedBooks.length} books
                        </div>
                    </div>

                    {/* Category Pills — with Open Access Hub */}
                    <div className="sbar-none" style={{ display: 'flex', gap: '8px', overflowX: 'auto', marginBottom: '48px', paddingBottom: '4px' }}>
                        {categories.map(c => (
                            c.isSpecial
                                ? (
                                    <button
                                        key={c.value}
                                        onClick={() => setSelectedCategory(c.value)}
                                        className={`open-access-pill${selectedCategory === c.value ? ' active' : ''}`}
                                    >
                                        <Unlock size={10} strokeWidth={2.5} />
                                        Open Access Hub
                                        <span style={{
                                            marginLeft: '2px',
                                            background: selectedCategory === c.value ? 'rgba(134,239,172,0.2)' : 'rgba(20,83,45,0.12)',
                                            color: selectedCategory === c.value ? '#86efac' : '#166534',
                                            fontSize: '9px', fontWeight: 700,
                                            padding: '1px 6px', borderRadius: '10px',
                                        }}>
                                            {freeBookCount}
                                        </span>
                                    </button>
                                )
                                : (
                                    <button key={c.value} onClick={() => setSelectedCategory(c.value)} className={`cat-pill${selectedCategory === c.value ? ' active' : ''}`}>{c.label}</button>
                                )
                        ))}
                    </div>

                    {/* Empty state */}
                    {sortedBooks.length === 0 ? (
                        <div style={{ background: '#fff', border: '0.5px solid #e5ddd0', padding: '80px 24px', textAlign: 'center' }}>
                            <div style={{ width: '52px', height: '52px', border: '0.5px solid #e5ddd0', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px', background: CREAM }}>
                                <FileText size={24} style={{ color: '#ccc' }} />
                            </div>
                            <h3 className="lan-serif" style={{ fontSize: '24px', color: NAVY, marginBottom: '8px' }}>No Documents Found</h3>
                            <p style={{ fontSize: '13px', color: '#aaa', marginBottom: '24px' }}>Try adjusting your filters or search term.</p>
                            <button onClick={() => { setSearchQuery(''); setSelectedCategory('all'); }}
                                style={{ padding: '12px 28px', background: NAVY, color: '#fff', border: 'none', fontSize: '13px', fontWeight: 700, fontFamily: "'Lato',sans-serif", cursor: 'pointer' }}>
                                Clear Filters
                            </button>
                        </div>
                    ) : (
                        <>
                            {bookRows.map((rowBooks, ri) => (
                                <React.Fragment key={ri}>
                                    <div style={{ marginBottom: "32px" }}>
                                        {ri === 0 && (
                                            <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: "24px" }}>
                                                <div>
                                                    <p style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", color: isOpenAccessView ? '#16a34a' : GOLD, marginBottom: "6px", fontFamily: "'Lato',sans-serif" }}>
                                                        {isOpenAccessView
                                                            ? '🔓 Open Access Hub'
                                                            : (selectedCategory === "all" ? "Full Collection" : categories.find(c => c.value === selectedCategory)?.label)
                                                        }
                                                    </p>
                                                    <h2 className="lan-serif" style={{ fontSize: "clamp(22px,3vw,32px)", fontWeight: 700, color: NAVY, margin: 0 }}>
                                                        {sortedBooks.length} Documents{isOpenAccessView ? ' — Free to Access' : ' Available'}
                                                    </h2>
                                                </div>
                                            </div>
                                        )}

                                        {/* Horizontal scroll row */}
                                        <div className="sbar-none" style={{ overflowX: "auto", margin: "0 -4px", padding: "0 4px 12px" }}>
                                            <div style={{ display: "flex", gap: "20px", paddingBottom: "4px" }}>
                                                {injectAds(rowBooks, ri === 0 ? goldAds : [], 1).reduce((acc, book, i) => {
                                                    acc.push(book.isAd
                                                        ? <AdCard key={book.id} book={book} />
                                                        : <BookCard key={book.id} book={book} isPurchased={isPurchased} bookSalesCount={bookSalesCount} getFeedbackCount={getFeedbackCount} />
                                                    );
                                                    if (i === 1 && silverAds[ri % silverAds.length]) {
                                                        const ad = silverAds[ri % silverAds.length];
                                                        acc.push(
                                                            <a key={`silver-${ri}`} href={ad.adLink || ad.link || "#"}
                                                                style={{ flexShrink: 0, width: "200px", textDecoration: "none", display: "block" }}>
                                                                <div style={{ position: "relative", background: "#ede8df" }}>
                                                                    <img src={ad.image || ad.imageUrl} alt={ad.title || "Sponsored"}
                                                                        style={{ width: "100%", aspectRatio: "3/4", objectFit: "cover", display: "block" }}
                                                                        onError={e => { e.target.src = "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400"; }} />
                                                                    <div style={{ position: "absolute", top: "8px", left: "8px", background: NAVY, color: "#fff", fontSize: "9px", fontWeight: 700, padding: "3px 8px", fontFamily: "'Lato',sans-serif", display: "flex", alignItems: "center", gap: 4 }}>
                                                                        <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#22c55e", display: "inline-block" }} />PDF
                                                                    </div>
                                                                    <div style={{ position: "absolute", top: "8px", right: "8px", background: GOLD, color: NAVY, fontSize: "9px", fontWeight: 700, padding: "3px 8px", fontFamily: "'Lato',sans-serif" }}>AD</div>
                                                                    <div style={{ position: "absolute", bottom: "8px", left: "8px", background: "rgba(13,34,68,0.82)", padding: "3px 8px", fontSize: "9px", fontWeight: 700, color: GOLD, fontFamily: "'Lato',sans-serif" }}>SILVER SPONSOR</div>
                                                                </div>
                                                                <div style={{ padding: "10px 10px 12px", borderTop: "0.5px solid #f0ebe0" }}>
                                                                    <h4 style={{ fontFamily: "'Playfair Display',serif", fontSize: "13px", fontWeight: 700, color: NAVY, margin: "0 0 3px", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", lineHeight: 1.35 }}>
                                                                        {ad.title || ad.bookTitle || "Sponsored"}
                                                                    </h4>
                                                                    <p style={{ fontSize: "11px", color: "#888", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontFamily: "'Lato',sans-serif" }}>
                                                                        {ad.author || ad.sellerName || "Sponsored Content"}
                                                                    </p>
                                                                </div>
                                                            </a>
                                                        );
                                                    }
                                                    return acc;
                                                }, [])}
                                            </div>
                                        </div>
                                    </div>

                                    {/* FeaturedAdsCarousel between every 2 rows — skip in Open Access view */}
                                    {!isOpenAccessView && (ri + 1) % 2 === 0 && ri < bookRows.length - 1 && (
                                        <div style={{ marginBottom: "40px" }}>
                                            <FeaturedAdsCarousel
                                                tier={CAROUSEL_TIERS[Math.floor(ri / 2) % CAROUSEL_TIERS.length]}
                                                maxAds={2} autoPlay={true} autoPlayMs={4000 + ri * 500}
                                            />
                                        </div>
                                    )}

                                    {(ri + 1) % 2 !== 0 && ri < bookRows.length - 1 && (
                                        <div style={{ borderBottom: "0.5px solid rgba(184,150,62,0.2)", marginBottom: "40px" }} />
                                    )}
                                </React.Fragment>
                            ))}

                            {/* Load More */}
                            {hasMoreRows && (
                                <div style={{ textAlign: 'center', marginTop: '24px' }}>
                                    <button onClick={handleLoadMore} className="load-btn">
                                        <Plus size={15} />
                                        Load {Math.min(rowsPerLoad * booksPerRow, sortedBooks.length - displayBooks.length)} more
                                    </button>
                                </div>
                            )}

                            {!hasMoreRows && sortedBooks.length > booksPerRow && (
                                <div style={{ textAlign: 'center', marginTop: '40px', padding: '32px', background: '#fff', border: '0.5px solid #e5ddd0' }}>
                                    <div style={{ width: '40px', height: '1px', background: GOLD, margin: '0 auto 14px' }} />
                                    <p className="lan-serif" style={{ fontSize: '18px', color: NAVY, fontStyle: 'italic' }}>You've seen all {sortedBooks.length} documents.</p>
                                    <div style={{ width: '40px', height: '1px', background: GOLD, margin: '14px auto 0' }} />
                                </div>
                            )}
                        </>
                    )}
                </main>

                <Footer />
            </div>
        </>
    );
}