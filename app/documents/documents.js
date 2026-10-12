"use client"
import React, { useState, useEffect, useRef } from 'react';
import { Search, ChevronRight, ChevronLeft, FileText, Plus, Unlock, X } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "@/lib/firebaseConfig";
import { booksData } from "@/lib/booksData";
import { doc, getDoc, updateDoc, collection, query, where, getDocs, increment, orderBy, limit } from 'firebase/firestore';
import Navbar from '@/components/NavBar';
import Footer from '@/components/FooterComp';
import { useAds, injectAds } from "@/lib/useAds";
import FeaturedAdsCarousel from "@/components/FeaturedAdsCarousel";
import BookTile, { BOOK_GRID_CSS } from "@/components/BookTile";

/* ─── colour tokens ─────────────────────────────────────────── */
const NAVY = "#0d2244";
const GOLD = "#b8963e";
const CREAM = "#f5f0e8";
const BG = "#f5f1ea";
const GREEN = "#166534";

const CAROUSEL_TIERS = ["Gold", "Silver", "Bronze"];

/* ─── aisles: each one becomes a shelf with its own write-up ─── */
const AISLES = [
    { value: 'open-access', label: 'Open Access', title: 'The Open Access Hub', free: true,
      blurb: 'Every title on this shelf is free to read and download. No purchase, no catch. Contributed by authors and educators who want knowledge to travel further.' },
    { value: 'past questions', label: 'Past Questions', title: 'Past Questions Vault',
      blurb: 'Practise on real exam papers before the real day. These collections show you how questions are set and marked, so nothing in the hall feels new.' },
    { value: 'education', label: 'Education', title: 'Study and Learning Essentials',
      blurb: 'Textbooks, lecture notes and course guides from students and educators across Africa, built to help you understand your courses and not just memorise them.' },
    { value: 'personal development', label: 'Personal Development', title: 'Grow Yourself',
      blurb: 'Books on discipline, purpose, habits and confidence for readers who are building the person they want to become.' },
    { value: 'business', label: 'Business', title: 'Business and Money',
      blurb: 'Practical guides to starting, running and growing a venture, plus money lessons that apply from your first hustle to your first hire.' },
    { value: 'technology', label: 'Technology', title: 'Tech and Code',
      blurb: 'Programming, digital skills and the tools shaping the modern economy. Start from zero or sharpen what you already know.' },
    { value: 'science', label: 'Science', title: 'Science and Discovery',
      blurb: 'From the lab bench to the night sky: clear explanations of how the world works, for coursework and curiosity alike.' },
    { value: 'literature', label: 'Literature', title: 'Stories and Literature',
      blurb: 'Novels, plays, poetry and criticism. Settle in with a good story or find the set text you need for class.' },
    { value: 'health wellness', label: 'Health & Wellness', title: 'Health and Wellness',
      blurb: 'Guides to taking care of your body and mind, written for students, caregivers and anyone building healthier routines.' },
    { value: 'history', label: 'History', title: 'History and Heritage',
      blurb: 'Where we come from and how we got here. Africa and the wider world, told through documents worth keeping.' },
    { value: 'arts culture', label: 'Arts & Culture', title: 'Arts and Culture',
      blurb: 'Music, film, design, fashion and tradition. Creative work and the people behind it.' },
];

/* ─── helpers ─────────────────────────────────────────────────── */
const isFreeBook = (book) => book.isFree === true || Number(book.price) === 0;

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
        return book.image || null;
};

const createdSecs = (b) => b.createdAt?.seconds || 0;

/* ══════════════════════════════════════════════════════════════
   CARDS (both use the shared small BookTile)
══════════════════════════════════════════════════════════════ */
function BookCard({ book, isPurchased }) {
    const free = isFreeBook(book);
    return (
        <BookTile
            href={`/book/preview?id=${String(book.id).replace("firestore-", "")}`}
            image={book.image}
            title={book.title}
            free={free}
            owned={isPurchased(book.id)}
            priceText={!free && book.price ? `₦${Number(book.price).toLocaleString()}` : undefined}
        />
    );
}

function AdCard({ book }) {
    const handleClick = () => {
        if (book.adId) updateDoc(doc(db, "promotions", book.adId), { clicks: increment(1) }).catch(() => { });
    };
    return (
        <BookTile
            external
            href={book.adLink || "#"}
            onClick={handleClick}
            image={book.image}
            title={book.title}
            tag="Sponsored"
        />
    );
}

/* ══════════════════════════════════════════════════════════════
   SHELF: titled section with write-up and left/right arrows
══════════════════════════════════════════════════════════════ */
function Shelf({ title, blurb, count, onSeeAll, free, children }) {
    const ref = useRef(null);
    const [canL, setCanL] = useState(false);
    const [canR, setCanR] = useState(false);

    const update = () => {
        const el = ref.current;
        if (!el) return;
        setCanL(el.scrollLeft > 4);
        setCanR(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
    };

    useEffect(() => {
        update();
        const el = ref.current;
        if (!el) return;
        el.addEventListener('scroll', update, { passive: true });
        window.addEventListener('resize', update);
        return () => {
            el.removeEventListener('scroll', update);
            window.removeEventListener('resize', update);
        };
    }, [count]);

    const go = (dir) => {
        const el = ref.current;
        if (el) el.scrollBy({ left: dir * el.clientWidth * 0.85, behavior: 'smooth' });
    };

    return (
        <section style={{ marginBottom: 44 }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, marginBottom: 16 }}>
                <div style={{ minWidth: 0 }}>
                    <h2 className="lan-serif" style={{ fontSize: 'clamp(20px,3vw,28px)', fontWeight: 700, color: free ? GREEN : NAVY, margin: '0 0 6px', display: 'flex', alignItems: 'center', gap: 8 }}>
                        {free && <Unlock size={18} strokeWidth={2.2} />}{title}
                    </h2>
                    <p style={{ fontSize: 13, color: '#777', lineHeight: 1.65, margin: 0, maxWidth: 640, fontWeight: 300 }}>{blurb}</p>
                </div>
                {onSeeAll && (
                    <button onClick={onSeeAll} className="see-all">
                        See all {count} <ChevronRight size={13} />
                    </button>
                )}
            </div>

            <div style={{ position: 'relative' }}>
                {canL && (
                    <button className="shelf-arrow left" onClick={() => go(-1)} aria-label={`Scroll ${title} left`}>
                        <ChevronLeft size={18} />
                    </button>
                )}
                <div ref={ref} className="shelf-track">{children}</div>
                {canR && (
                    <button className="shelf-arrow right" onClick={() => go(1)} aria-label={`Scroll ${title} right`}>
                        <ChevronRight size={18} />
                    </button>
                )}
            </div>
        </section>
    );
}

/* ══════════════════════════════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════════════════════════════ */
export default function AllBooksClient() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const filter = searchParams.get('filter');

    const [searchQuery, setSearchQuery] = useState('');
    const [purchasedBookIds, setPurchasedBookIds] = useState(new Set());
    const [sortBy, setSortBy] = useState('popularity');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [user, setUser] = useState(null);
    const [allBooks, setAllBooks] = useState([]);
    const [loadingBooks, setLoadingBooks] = useState(true);
    const [visibleCount, setVisibleCount] = useState(30);

    const goldAds = useAds("Gold", 4);

    useEffect(() => {
        if (filter === 'past-questions') setSelectedCategory('past questions');
        if (filter === 'open-access') setSelectedCategory('open-access');
    }, [filter]);

    /* ── fetch: static list first, then every approved Firestore book ── */
    useEffect(() => {
        const fetchAllBooks = async () => {
            try {
                setLoadingBooks(true);
                const processed = booksData.map(b => ({ ...b, image: getThumbnailUrl(b) }));
                setAllBooks(processed);
                try {
                    const snap = await getDocs(query(
                        collection(db, 'advertMyBook'),
                        where('status', '==', 'approved'),
                        orderBy('createdAt', 'desc'),
                        limit(60)
                    ));
                    if (!snap.empty) {
                        const fb = [];
                        snap.forEach(d => {
                            const data = d.data();
                            if (data.isGloballyFrozen === true || !data.bookTitle) return;
                            const b = {
                                id: `firestore-${d.id}`,
                                firestoreId: d.id,
                                title: data.bookTitle,
                                author: data.author || 'Unknown',
                                category: (data.category || 'education').toLowerCase(),
                                price: Number(data.price) || 0,
                                purchases: Number(data.purchases) || 0,
                                                              isFree: data.isFree === true || Number(data.price) === 0,
                                description: data.description || '',
                                image: data.coverImage || data.image || null,
                                driveFileId: data.driveFileId,
                                pdfUrl: data.pdfUrl,
                                embedUrl: data.embedUrl,
                                isFromFirestore: true,
                                createdAt: data.createdAt,
                            };
                            b.image = getThumbnailUrl(b);
                            fb.push(b);
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

    /* ── auth + purchases ── */
    useEffect(() => {
        const unsub = onAuthStateChanged(auth, cu => { cu ? setUser(cu) : router.push('/signin'); });
        return () => unsub();
    }, [router]);

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

    useEffect(() => { setVisibleCount(30); }, [selectedCategory, searchQuery, sortBy]);

    const isPurchased = id =>
        purchasedBookIds.has(id) || purchasedBookIds.has(String(id)) ||
        purchasedBookIds.has(`firestore-${id}`) || purchasedBookIds.has(String(id).replace('firestore-', ''));

    if (loadingBooks) return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: BG }}>
            <div style={{ textAlign: 'center' }}>
                <div style={{ width: 52, height: 52, border: `3px solid ${GOLD}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
                <p style={{ fontFamily: "'Playfair Display',serif", fontSize: 18, color: NAVY }}>Opening the shelves…</p>
                <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
            </div>
        </div>
    );

    /* ── derived data ── */
    const q = searchQuery.trim().toLowerCase();
    const matchesSearch = b => !q || (b.title || '').toLowerCase().includes(q) || (b.author || '').toLowerCase().includes(q);
    const inCategory = (b, cat) =>
        cat === 'all' ? true : cat === 'open-access' ? isFreeBook(b) : b.category === cat;

    const sortBooks = (books) => {
        const s = [...books];
        switch (sortBy) {
            case 'price-low': return s.sort((a, b) => (a.price || 0) - (b.price || 0));
            case 'price-high': return s.sort((a, b) => (b.price || 0) - (a.price || 0));
            case 'newest': return s.sort((a, b) => createdSecs(b) - createdSecs(a));
            case 'title': return s.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
            case 'free-first': return s.sort((a, b) => (isFreeBook(b) ? 1 : 0) - (isFreeBook(a) ? 1 : 0));
            default: return s.sort((a, b) => (b.purchases || 0) - (a.purchases || 0));
        }
    };

    const freeCount = allBooks.filter(isFreeBook).length;
    const countFor = (val) => allBooks.filter(b => inCategory(b, val)).length;
    const activeAisle = AISLES.find(a => a.value === selectedCategory);
    const browsing = selectedCategory === 'all' && !q;

    const results = sortBooks(allBooks.filter(b => matchesSearch(b) && inCategory(b, selectedCategory)));
    const shownResults = results.slice(0, visibleCount);

    const renderBook = (book) => book.isAd
        ? <AdCard key={book.id} book={book} />
        : <BookCard key={book.id} book={book} isPurchased={isPurchased} />;

    /* ── editorial shelves for browse mode ── */
    const fresh = allBooks.filter(b => b.isFromFirestore).sort((a, b) => createdSecs(b) - createdSecs(a)).slice(0, 14);
    const favourites = allBooks.filter(b => (b.purchases || 0) > 0).sort((a, b) => (b.purchases || 0) - (a.purchases || 0)).slice(0, 14);
    const known = new Set(AISLES.map(a => a.value));
    const otherBooks = allBooks.filter(b => !known.has(b.category) && !isFreeBook(b));

    const shelves = [
        fresh.length > 0 && { key: 'fresh', title: 'Fresh off the press', blurb: 'The newest documents uploaded by our community of students and educators. Be the first to read them.', books: fresh },
        favourites.length > 0 && { key: 'fav', title: 'Reader favourites', blurb: 'The titles other students keep buying. A good place to start if you are not sure what you need.', books: favourites },
        ...AISLES.map(a => {
            const books = sortBooks(allBooks.filter(b => inCategory(b, a.value))).slice(0, 16);
            return books.length > 0 && { key: a.value, title: a.title, blurb: a.blurb, books, free: a.free, count: countFor(a.value), seeAll: () => { setSelectedCategory(a.value); window.scrollTo({ top: 0, behavior: 'smooth' }); } };
        }),
        otherBooks.length > 0 && { key: 'other', title: 'More to explore', blurb: 'Documents that do not fit neatly on one shelf, but are well worth a look.', books: sortBooks(otherBooks).slice(0, 16) },
    ].filter(Boolean);

    const spotlight = favourites[0] || fresh.find(b => b.description) || null;

    return (
        <>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400&family=Lato:wght@300;400;700&display=swap');
                ${BOOK_GRID_CSS}
                .lan-root { font-family:'Lato',sans-serif; background:${BG}; min-height:100vh; }
                .lan-serif { font-family:'Playfair Display',Georgia,serif; }
                .sbar-none { scrollbar-width:none; -ms-overflow-style:none; }
                .sbar-none::-webkit-scrollbar { display:none; }

                .shelf-track { display:flex; gap:14px; overflow-x:auto; scroll-snap-type:x proximity; padding:4px 2px 12px; scrollbar-width:none; -ms-overflow-style:none; }
                .shelf-track::-webkit-scrollbar { display:none; }
                .shelf-track > * { flex:0 0 128px; min-width:0; scroll-snap-align:start; }
                @media (min-width:640px) { .shelf-track > * { flex-basis:144px; } .shelf-track { gap:18px; } }

                .shelf-grid { display:grid; grid-template-columns:repeat(auto-fill, minmax(112px, 1fr)); gap:22px 14px; }
                @media (min-width:640px) { .shelf-grid { grid-template-columns:repeat(auto-fill, minmax(140px, 1fr)); gap:26px 18px; } }

                .shelf-arrow { position:absolute; top:62px; z-index:3; width:38px; height:38px; border-radius:50%; background:#fff; border:1px solid #e0d8c8; color:${NAVY}; display:flex; align-items:center; justify-content:center; cursor:pointer; box-shadow:0 2px 10px rgba(13,34,68,0.18); transition:background .15s, border-color .15s; }
                .shelf-arrow:hover { background:${CREAM}; border-color:${GOLD}; }
                .shelf-arrow:focus-visible, .chip:focus-visible, .see-all:focus-visible, .load-btn:focus-visible { outline:2px solid ${GOLD}; outline-offset:2px; }
                .shelf-arrow.left { left:-12px; }
                .shelf-arrow.right { right:-12px; }
                @media (max-width:640px) { .shelf-arrow.left { left:-6px; } .shelf-arrow.right { right:-6px; } }

                .see-all { display:inline-flex; align-items:center; gap:4px; flex-shrink:0; background:transparent; border:0.5px solid #e0d8c8; color:${NAVY}; font-family:'Lato',sans-serif; font-size:12px; font-weight:700; padding:8px 14px; cursor:pointer; white-space:nowrap; }
                .see-all:hover { border-color:${GOLD}; background:#fff; }

                .chip { border:0.5px solid #e0d8c8; background:#fff; color:${NAVY}; font-family:'Lato',sans-serif; font-size:12px; font-weight:700; padding:8px 14px; cursor:pointer; white-space:nowrap; display:inline-flex; align-items:center; gap:6px; transition:background .15s,color .15s,border-color .15s; }
                .chip:hover { border-color:${GOLD}; }
                .chip.active { background:${NAVY}; color:#fff; border-color:${NAVY}; }
                .chip.free { color:${GREEN}; border-color:rgba(22,101,52,0.35); background:rgba(22,101,52,0.06); }
                .chip.free.active { background:${GREEN}; color:#fff; border-color:${GREEN}; }
                .chip .n { font-size:10px; opacity:.65; font-weight:400; }

                .filter-select { border:0.5px solid #e0d8c8; background:#fff; color:${NAVY}; font-family:'Lato',sans-serif; font-size:12px; font-weight:700; padding:10px 12px; outline:none; cursor:pointer; }
                .load-btn { display:inline-flex; align-items:center; gap:8px; padding:13px 32px; background:${NAVY}; color:#fff; font-family:'Lato',sans-serif; font-size:13px; font-weight:700; border:none; cursor:pointer; transition:background .18s; }
                .load-btn:hover { background:#1a3a6e; }
                @media (prefers-reduced-motion: reduce) { .shelf-track { scroll-behavior:auto; } }
            `}</style>

            <div className="lan-root">
                <Navbar />

                {/* ── Hero: search first, like walking into a bookshop ── */}
                <section style={{ background: NAVY, backgroundImage: 'radial-gradient(rgba(184,150,62,0.07) 1px,transparent 1px)', backgroundSize: '26px 26px', padding: '56px 24px 44px' }}>
                    <div style={{ maxWidth: 900, margin: '0 auto', textAlign: 'center' }}>
                        <h1 className="lan-serif" style={{ fontSize: 'clamp(30px,5.5vw,52px)', fontWeight: 900, color: '#fff', margin: '0 0 12px', lineHeight: 1.08 }}>
                            Find your next <span style={{ color: GOLD, fontStyle: 'italic' }}>great read.</span>
                        </h1>
                        <p style={{ fontSize: 15, color: 'rgba(245,240,232,0.65)', fontWeight: 300, lineHeight: 1.7, margin: '0 auto 26px', maxWidth: 560 }}>
                            {allBooks.length} documents across {AISLES.length - 1} subjects, with {freeCount} free to read. Pick up a textbook, a past question or a good story.
                        </p>
                        <div style={{ position: 'relative', maxWidth: 560, margin: '0 auto' }}>
                            <Search size={16} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: '#aaa' }} />
                            <input
                                type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                                placeholder="Search by title or author"
                                style={{ width: '100%', padding: '15px 44px 15px 44px', border: 'none', fontSize: 15, fontFamily: "'Lato',sans-serif", outline: 'none', color: NAVY, boxSizing: 'border-box' }}
                            />
                            {searchQuery && (
                                <button onClick={() => setSearchQuery('')} aria-label="Clear search" style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', cursor: 'pointer', color: '#999', display: 'flex' }}>
                                    <X size={16} />
                                </button>
                            )}
                        </div>
                    </div>
                </section>

                {/* ── Aisle chips + sort ── */}
                <div style={{ background: CREAM, borderBottom: '0.5px solid #e5ddd0' }}>
                    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '14px 24px', display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div className="sbar-none" style={{ display: 'flex', gap: 8, overflowX: 'auto', flex: 1 }}>
                            <button className={`chip${selectedCategory === 'all' ? ' active' : ''}`} onClick={() => setSelectedCategory('all')}>All shelves</button>
                            {AISLES.map(a => (
                                <button key={a.value} onClick={() => setSelectedCategory(a.value)}
                                    className={`chip${a.free ? ' free' : ''}${selectedCategory === a.value ? ' active' : ''}`}>
                                    {a.free && <Unlock size={11} strokeWidth={2.4} />}
                                    {a.label}
                                    <span className="n">{countFor(a.value)}</span>
                                </button>
                            ))}
                        </div>
                        <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="filter-select" aria-label="Sort books">
                            <option value="popularity">Most bought</option>
                            <option value="newest">Newest</option>
                            <option value="price-low">Price: low to high</option>
                            <option value="price-high">Price: high to low</option>
                            <option value="free-first">Free first</option>
                            <option value="title">Title A to Z</option>
                        </select>
                    </div>
                </div>

                <main style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 24px 64px' }}>

                    {/* ══ BROWSE MODE: themed shelves ══ */}
                    {browsing && (
                        <>
                            {spotlight && (
                                <section style={{ display: 'flex', flexWrap: 'wrap', gap: 24, alignItems: 'center', background: '#fff', border: '0.5px solid #e5ddd0', padding: 20, marginBottom: 48 }}>
                                   <div style={{ width: 132, flexShrink: 0, aspectRatio: '3/4', background: '#ece6d8', overflow: 'hidden', boxShadow: '0 6px 18px rgba(13,34,68,0.2)' }}>
    {spotlight.image && (
        <img src={spotlight.image} alt={spotlight.title} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            onError={e => { e.currentTarget.style.display = 'none'; }} />
    )}
</div>
                                    <div style={{ flex: '1 1 260px', minWidth: 0 }}>
                                        <p style={{ fontSize: 12, fontWeight: 700, color: GOLD, margin: '0 0 6px' }}>
                                            {(spotlight.purchases || 0) > 0 ? `Bought ${spotlight.purchases} times` : 'New on the shelf'}
                                        </p>
                                        <h2 className="lan-serif" style={{ fontSize: 'clamp(20px,3vw,28px)', fontWeight: 700, color: NAVY, margin: '0 0 6px', lineHeight: 1.2 }}>{spotlight.title}</h2>
                                        <p style={{ fontSize: 13, color: '#888', margin: '0 0 10px' }}>by {spotlight.author}</p>
                                        {spotlight.description && spotlight.description !== 'No description' && (
                                            <p style={{ fontSize: 14, color: '#555', lineHeight: 1.7, margin: '0 0 16px', maxWidth: 560, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{spotlight.description}</p>
                                        )}
                                        <button className="load-btn" onClick={() => router.push(`/book/preview?id=${String(spotlight.id).replace('firestore-', '')}`)}>
                                            {isFreeBook(spotlight) ? 'Read for free' : `View book · ₦${Number(spotlight.price).toLocaleString()}`}
                                        </button>
                                    </div>
                                </section>
                            )}

                            {shelves.map((s, i) => (
                                <React.Fragment key={s.key}>
                                    <Shelf title={s.title} blurb={s.blurb} count={s.count ?? s.books.length} onSeeAll={s.seeAll} free={s.free}>
                                        {(i === 0 ? injectAds(s.books, goldAds, 1) : s.books).map(renderBook)}
                                    </Shelf>
                                    {(i + 1) % 2 === 0 && i < shelves.length - 1 && (
                                        <div style={{ marginBottom: 44 }}>
                                            <FeaturedAdsCarousel
                                                tier={CAROUSEL_TIERS[Math.floor(i / 2) % CAROUSEL_TIERS.length]}
                                                maxAds={2} autoPlay={true} autoPlayMs={4000 + i * 400}
                                            />
                                        </div>
                                    )}
                                </React.Fragment>
                            ))}

                            {shelves.length === 0 && (
                                <p style={{ textAlign: 'center', color: '#aaa', padding: '60px 0' }}>The shelves are empty right now. Check back soon.</p>
                            )}
                        </>
                    )}

                    {/* ══ FILTER MODE: one aisle or a search ══ */}
                    {!browsing && (
                        <>
                            <div style={{ marginBottom: 28, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
                                <div style={{ minWidth: 0 }}>
                                    <h2 className="lan-serif" style={{ fontSize: 'clamp(22px,3.5vw,34px)', fontWeight: 700, color: activeAisle?.free ? GREEN : NAVY, margin: '0 0 8px' }}>
                                        {q && !activeAisle ? `Results for “${searchQuery.trim()}”` : activeAisle?.title || 'Results'}
                                    </h2>
                                    {activeAisle && <p style={{ fontSize: 14, color: '#777', lineHeight: 1.7, margin: '0 0 8px', maxWidth: 680, fontWeight: 300 }}>{activeAisle.blurb}</p>}
                                    <p style={{ fontSize: 12, color: '#aaa', margin: 0 }}>{results.length} {results.length === 1 ? 'document' : 'documents'}{q && activeAisle ? ` matching “${searchQuery.trim()}”` : ''}</p>
                                </div>
                                <button className="see-all" onClick={() => { setSelectedCategory('all'); setSearchQuery(''); }}>
                                    <ChevronLeft size={13} /> Back to all shelves
                                </button>
                            </div>

                            {results.length === 0 ? (
                                <div style={{ background: '#fff', border: '0.5px solid #e5ddd0', padding: '72px 24px', textAlign: 'center' }}>
                                    <FileText size={30} style={{ color: '#ccc', margin: '0 auto 12px' }} />
                                    <h3 className="lan-serif" style={{ fontSize: 22, color: NAVY, margin: '0 0 6px' }}>Nothing matches that search</h3>
                                    <p style={{ fontSize: 13, color: '#aaa', margin: '0 0 22px' }}>Check the spelling, try an author's name, or browse another shelf.</p>
                                    <button className="load-btn" onClick={() => { setSelectedCategory('all'); setSearchQuery(''); }}>Clear search</button>
                                </div>
                            ) : (
                                <>
                                    <div className="shelf-grid">
                                        {(visibleCount <= 30 ? injectAds(shownResults, goldAds, 1) : shownResults).map(renderBook)}
                                    </div>
                                    {results.length > visibleCount && (
                                        <div style={{ textAlign: 'center', marginTop: 36 }}>
                                            <button className="load-btn" onClick={() => setVisibleCount(c => c + 30)}>
                                                <Plus size={15} /> Show {Math.min(30, results.length - visibleCount)} more
                                            </button>
                                        </div>
                                    )}
                                </>
                            )}
                        </>
                    )}
                </main>

                <Footer />
            </div>
        </>
    );
}