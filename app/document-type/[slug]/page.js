"use client"
import React, { useState, useEffect, useMemo } from 'react';
import { ArrowLeft, ShoppingBag, ChevronRight, Sparkles, ArrowRight, Search } from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "@/lib/firebaseConfig";
import { booksData } from "@/lib/booksData";
import { doc, getDoc, collection, getDocs, query, where } from 'firebase/firestore';
import Navbar from '@/components/NavBar';
import Footer from '@/components/FooterComp';

/* ─── colour tokens ─────────────────────────────────────────── */
const NAVY = "#0d2244";
const GOLD = "#b8963e";
const GOLDD = "#d4aa5a";
const CREAM = "#f5f0e8";
const BG = "#f5f1ea";

export default function DocumentTypePage() {
    const params = useParams();
    const router = useRouter();
    const typeSlug = params.slug;

    const [purchasedBookIds, setPurchasedBookIds] = useState(new Set());
    const [user, setUser] = useState(null);
    const [sortBy, setSortBy] = useState('popularity');
    const [allBooks, setAllBooks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedLevel, setSelectedLevel] = useState('all');
    const [bookSalesCount, setBookSalesCount] = useState({});

    const universityLevels = [
        { name: 'All Levels', value: 'all' },
        { name: '100 Level', value: '100' },
        { name: '200 Level', value: '200' },
        { name: '300 Level', value: '300' },
        { name: '400 Level', value: '400' },
        { name: '500 Level', value: '500' },
        { name: 'Post-Graduate', value: 'pg' },
    ];

    const documentTypes = [
        { name: 'Textbook', slug: 'textbook', description: 'Standard educational books' },
        { name: 'Lecture Note', slug: 'lecture-note', description: 'Summarized class materials' },
        { name: 'Past Question', slug: 'past-question', description: 'Previous exam papers' },
        { name: 'Thesis', slug: 'thesis', description: 'Academic research papers' },
        { name: 'Summary', slug: 'summary', description: 'Quick study breakdowns' },
        { name: 'Syllabus', slug: 'syllabus', description: 'Course requirements' },
        { name: 'Course Outline', slug: 'course-outline', description: 'Topic distributions' },
        { name: 'Assignment', slug: 'assignment', description: 'Practice tasks and projects' },
        { name: 'Project', slug: 'project', description: 'Detailed student projects' },
        { name: 'Lab Manual', slug: 'lab-manual', description: 'Practical guides and lab reports' },
        { name: 'Handwritten Notes', slug: 'handwritten-notes', description: 'Authentic student class notes' },
        { name: 'Exam Revision', slug: 'exam-revision', description: 'Highly focused exam prep materials' },
        { name: 'Scholarship Guide', slug: 'scholarship-guide', description: 'Funding and application tips' },
        { name: 'Research Proposal', slug: 'research-proposal', description: 'Initial project outlines and methodology' },
        { name: 'Seminar Paper', slug: 'seminar-paper', description: 'Presentations for departmental seminars' },
        { name: 'Technical Drawing', slug: 'technical-drawing', description: 'Engineering and architectural designs' },
        { name: 'Case Study', slug: 'case-study', description: 'Analysis of real-world scenarios' },
        { name: 'Internship Report', slug: 'internship-report', description: 'SIWES or industrial training documentation' },
        { name: 'Clearance Guide', slug: 'clearance-guide', description: 'Step-by-step for graduation clearance' },
    ];

    const getThumbnailUrl = (book) => {
        if (!book) return 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400';
        if (book.driveFileId) return `https://drive.google.com/thumbnail?id=${book.driveFileId}&sz=w400`;
        if (book.embedUrl) {
            const m = book.embedUrl.match(/\/d\/([\w-]{25,})|\/file\/d\/([\w-]{25,})/);
            if (m) return `https://drive.google.com/thumbnail?id=${m[1] || m[2]}&sz=w400`;
        }
        const src = book.pdfUrl || book.pdfLink;
        if (src?.includes('drive.google.com')) {
            const m = src.match(/\/d\/([\w-]{25,})|\/file\/d\/([\w-]{25,})/);
            if (m) return `https://drive.google.com/thumbnail?id=${m[1] || m[2]}&sz=w400`;
        }
        return book.image || book.coverImage || 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400';
    };

    const currentDocType = documentTypes.find(t => t.slug === typeSlug);
    const documentTypeName = currentDocType?.name || 'Document Type';

    useEffect(() => {
        const unsub = onAuthStateChanged(auth, cu => { cu ? setUser(cu) : router.push('/auth/signin'); });
        return () => unsub();
    }, [router]);

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

    useEffect(() => {
        const fetch = async () => {
            try {
                const processed = booksData.map(b => ({ ...b, image: getThumbnailUrl(b) }));
                const q = query(collection(db, 'advertMyBook'), where('status', '==', 'approved'));
                const snap = await getDocs(q);
                const fb = [];
                snap.forEach(d => {
                    const data = d.data();
                    const b = {
                        id: `firestore-${d.id}`, firestoreId: d.id,
                        title: data.bookTitle, author: data.author,
                        category: data.category,
                        documentType: data.docType || data.documentType || data.type,
                        price: data.price, pages: data.pages,
                        format: data.format || 'PDF',
                        description: data.description,
                        rating: 4.5, reviews: 0,
                        driveFileId: data.driveFileId || data.fileId,
                        pdfUrl: data.pdfUrl || data.pdf,
                        embedUrl: data.embedUrl || data.embed,
                        level: data.level || 'all',
                        isFromFirestore: true,
                    };
                    b.image = getThumbnailUrl(b);
                    fb.push(b);
                });
                setAllBooks([...processed, ...fb]);
            } catch {
                setAllBooks(booksData.map(b => ({ ...b, image: getThumbnailUrl(b) })));
            } finally { setLoading(false); }
        };
        fetch();
    }, []);

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

    const documentTypeCounts = useMemo(() => {
        const counts = {};
        documentTypes.forEach(type => {
            counts[type.slug] = allBooks.filter(b => {
                const s = b.documentType?.toLowerCase().replace(/ /g, '-').trim();
                return s === type.slug;
            }).length;
        });
        return counts;
    }, [allBooks]);

    const typeBooks = useMemo(() => {
        return allBooks.filter(b => {
            if (!b.documentType) return false;
            const s = b.documentType.toLowerCase().trim().replace(/\s+/g, '-');
            const matchesLevel = selectedLevel === 'all' || String(b.level) === selectedLevel;
            return s === typeSlug && matchesLevel;
        });
    }, [allBooks, typeSlug, selectedLevel]);

    const sortBooks = (books) => {
        const s = [...books];
        switch (sortBy) {
            case 'price-low': return s.sort((a, b) => a.price - b.price);
            case 'price-high': return s.sort((a, b) => b.price - a.price);
            case 'rating': return s.sort((a, b) => b.rating - a.rating);
            case 'newest': return s.sort((a, b) => b.id - a.id);
            default: return s.sort((a, b) => b.reviews - a.reviews);
        }
    };

    const displayBooks = useMemo(() => sortBooks(typeBooks), [typeBooks, sortBy]);
    const isPurchased = id =>
        purchasedBookIds.has(id) ||
        purchasedBookIds.has(`firestore-${id}`) ||
        purchasedBookIds.has(String(id).replace('firestore-', ''));

    /* ── Loading ── */
    if (loading) return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: BG }}>
            <div style={{ textAlign: 'center' }}>
                <div style={{ width: '56px', height: '56px', border: `3px solid ${GOLD}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
                <p style={{ fontFamily: "'Playfair Display',serif", fontSize: '18px', color: NAVY }}>Loading…</p>
                <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
            </div>
        </div>
    );

    return (
        <>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400&family=Lato:wght@300;400;700&display=swap');
                .lan-root  { font-family:'Lato',sans-serif; background:${BG}; }
                .lan-serif { font-family:'Playfair Display',Georgia,serif; }

                /* ── Book card ── */
                .book-card { text-decoration:none; display:block; background:#fff; }
                .book-card:hover .book-cover { box-shadow:0 12px 32px rgba(13,34,68,0.18); transform:translateY(-3px); }
                .book-cover { transition:box-shadow 0.25s, transform 0.25s; }

                /* scrollbar hide */
                .sbar-none { scrollbar-width:none; -ms-overflow-style:none; }
                .sbar-none::-webkit-scrollbar { display:none; }

                /* level pills */
                .level-pill { border:0.5px solid #e5ddd0; background:#fff; color:${NAVY};
                    font-family:'Lato',sans-serif; font-size:11px; font-weight:700;
                    letter-spacing:0.07em; padding:8px 16px; cursor:pointer;
                    transition:background 0.18s,color 0.18s; }
                .level-pill.active { background:${NAVY}; color:#fff; border-color:${NAVY}; }
                .level-pill:hover  { background:rgba(13,34,68,0.08); }

                /* doc-type pills */
                .dt-pill { display:inline-block; border:0.5px solid #e5ddd0; background:#fff;
                    color:${NAVY}; font-family:'Lato',sans-serif; font-size:11px; font-weight:700;
                    letter-spacing:0.05em; padding:9px 16px; text-decoration:none;
                    transition:background 0.18s,color 0.18s,border-color 0.18s; }
                .dt-pill:hover { background:${NAVY}; color:#fff; border-color:${NAVY}; }

                .filter-select { border:0.5px solid #e5ddd0; background:#fff; color:${NAVY};
                    font-family:'Lato',sans-serif; font-size:12px; font-weight:700;
                    padding:9px 14px; outline:none; cursor:pointer; }

                @keyframes slideUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
                .anim-up { animation:slideUp 0.5s cubic-bezier(0.4,0,0.2,1) both; }
            `}</style>

            <div className="lan-root" style={{ minHeight: '100vh' }}>
                <Navbar />

                {/* ── Hero ── */}
                <section style={{
                    background: NAVY,
                    backgroundImage: 'radial-gradient(rgba(184,150,62,0.06) 1px,transparent 1px)',
                    backgroundSize: '28px 28px',
                    padding: '60px 24px 52px',
                }}>
                    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                        <div className="anim-up" style={{
                            display: 'inline-flex', alignItems: 'center', gap: '8px',
                            background: 'rgba(184,150,62,0.14)',
                            border: '1px solid rgba(184,150,62,0.3)',
                            borderRadius: '999px', padding: '6px 14px', marginBottom: '20px',
                        }}>
                            <Sparkles size={12} style={{ color: GOLD }} />
                            <span style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: GOLDD }}>Academic Resources</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '12px' }}>
                            <button onClick={() => router.back()} style={{ width: '38px', height: '38px', border: '0.5px solid rgba(255,255,255,0.2)', background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
                                <ArrowLeft size={18} style={{ color: 'rgba(255,255,255,0.7)' }} />
                            </button>
                            <h1 className="lan-serif anim-up" style={{ fontSize: 'clamp(32px,5.5vw,58px)', fontWeight: 900, color: '#fff', lineHeight: 1.05, letterSpacing: '-1px', margin: 0 }}>
                                {documentTypeName}
                            </h1>
                        </div>
                        <p style={{ fontSize: '15px', color: 'rgba(245,240,232,0.65)', maxWidth: '560px', lineHeight: 1.75, fontWeight: 300, margin: '0 0 8px 52px' }}>
                            {currentDocType?.description} — {displayBooks.length} document{displayBooks.length !== 1 ? 's' : ''} available.
                        </p>
                    </div>
                </section>

                {/* ── Breadcrumb ── */}
                <div style={{ background: CREAM, borderBottom: '0.5px solid #e5ddd0', padding: '10px 24px' }}>
                    <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontFamily: "'Lato',sans-serif" }}>
                        <Link href="/" style={{ color: NAVY, fontWeight: 700, textDecoration: 'none' }}>Home</Link>
                        <ChevronRight size={12} style={{ color: '#bbb' }} />
                        <Link href="/documents" style={{ color: NAVY, fontWeight: 700, textDecoration: 'none' }}>All Documents</Link>
                        <ChevronRight size={12} style={{ color: '#bbb' }} />
                        <span style={{ color: '#aaa' }}>{documentTypeName}</span>
                    </div>
                </div>

                {/* ── Main ── */}
                <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '56px 24px' }}>

                    {/* Controls bar */}
                    <div style={{ background: '#fff', border: '0.5px solid #e5ddd0', padding: '16px 20px', marginBottom: '32px', display: 'flex', flexWrap: 'wrap', gap: '14px', alignItems: 'center' }}>
                        <div style={{ flex: 1, minWidth: '180px' }}>
                            <p style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: GOLD, margin: '0 0 2px', fontFamily: "'Lato',sans-serif" }}>Showing</p>
                            <p className="lan-serif" style={{ fontSize: '16px', fontWeight: 700, color: NAVY, margin: 0 }}>{displayBooks.length} {documentTypeName}s</p>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#aaa', fontFamily: "'Lato',sans-serif" }}>Level</span>
                            <select value={selectedLevel} onChange={e => setSelectedLevel(e.target.value)} className="filter-select">
                                {universityLevels.map(l => <option key={l.value} value={l.value}>{l.name}</option>)}
                            </select>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#aaa', fontFamily: "'Lato',sans-serif" }}>Sort</span>
                            <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="filter-select">
                                <option value="popularity">Popularity</option>
                                <option value="price-low">Price: Low → High</option>
                                <option value="price-high">Price: High → Low</option>
                                <option value="newest">Newest First</option>
                                <option value="rating">Highest Rated</option>
                            </select>
                        </div>
                    </div>

                    {/* Level pills */}
                    <div className="sbar-none" style={{ display: 'flex', gap: '6px', overflowX: 'auto', marginBottom: '40px', paddingBottom: '4px' }}>
                        {universityLevels.map(l => (
                            <button key={l.value} onClick={() => setSelectedLevel(l.value)}
                                className={`level-pill${selectedLevel === l.value ? ' active' : ''}`}>
                                {l.name}
                            </button>
                        ))}
                    </div>

                    {/* Empty state */}
                    {displayBooks.length === 0 ? (
                        <div style={{ background: '#fff', border: '0.5px solid #e5ddd0', padding: '80px 24px', textAlign: 'center' }}>
                            <div style={{ width: '52px', height: '52px', border: `0.5px solid #e5ddd0`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
                                <Search size={24} style={{ color: '#ddd' }} />
                            </div>
                            <h3 className="lan-serif" style={{ fontSize: '24px', color: NAVY, marginBottom: '8px' }}>No {documentTypeName}s Found</h3>
                            <p style={{ fontSize: '13px', color: '#aaa', marginBottom: '20px' }}>There are currently no documents matching your filters.</p>
                            <Link href="/documents" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '12px 24px', background: NAVY, color: '#fff', fontSize: '13px', fontWeight: 700, textDecoration: 'none', fontFamily: "'Lato',sans-serif" }}>
                                Browse All Documents <ArrowRight size={13} />
                            </Link>
                        </div>
                    ) : (
                        <>
                            {/* Row 1 */}
                            <BookRow
                                label="Recommended For You"
                                books={displayBooks.slice(0, 10)}
                                total={displayBooks.length}
                                isPurchased={isPurchased}
                                bookSalesCount={bookSalesCount}
                            />

                            {/* Row 2 */}
                            {displayBooks.length > 20 && (
                                <BookRow
                                    label={`More ${documentTypeName}s`}
                                    books={displayBooks.slice(11, 30)}
                                    total={displayBooks.length + 50}
                                    isPurchased={isPurchased}
                                    bookSalesCount={bookSalesCount}
                                    />
                                    
                                    
                            )}

                            {/* Browse Other Types */}
                            <section style={{ background: CREAM, border: '0.5px solid #e5ddd0', padding: '40px 32px', marginTop: '24px' }}>
                                <p style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: GOLD, marginBottom: '8px', fontFamily: "'Lato',sans-serif" }}>Explore More</p>
                                <h3 className="lan-serif" style={{ fontSize: 'clamp(20px,3vw,28px)', fontWeight: 700, color: NAVY, margin: '0 0 24px' }}>Browse Other Document Types</h3>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                    {documentTypes.filter(t => t.slug !== typeSlug).map(type => {
                                        const count = documentTypeCounts[type.slug] || 0;
                                        return (
                                            <a key={type.slug} href={`/document-type/${type.slug}`} className="dt-pill">
                                                {type.name}
                                                <span style={{ marginLeft: '6px', fontSize: '10px', color: GOLD, fontWeight: 700 }}>({count})</span>
                                            </a>
                                        );
                                    })}
                                </div>
                            </section>
                        </>
                    )}
                </main>

                <Footer />
            </div>
        </>
    );
}

/* ── BookRow wrapper ── */
function BookRow({ label, books, total, isPurchased, bookSalesCount }) {
    return (
        <div style={{ marginBottom: '48px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                <p style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: GOLD, margin: 0, fontFamily: "'Lato',sans-serif" }}>
                    {label}
                </p>
                <div style={{ height: '1px', flex: 1, background: 'rgba(184,150,62,0.2)', margin: '0 16px' }} />
                <span style={{ fontSize: '11px', color: '#aaa', fontFamily: "'Lato',sans-serif", whiteSpace: 'nowrap' }}>
                    {books.length} of {total}
                </span>
            </div>
            <div className="sbar-none" style={{ overflowX: 'auto', margin: '0 -4px', padding: '0 4px 8px' }}>
                <div style={{ display: 'flex', gap: '16px', paddingBottom: '4px' }}>
                    {books.map(book => (
                        <BookCard
                            key={book.id}
                            book={book}
                            isPurchased={isPurchased}
                            bookSalesCount={bookSalesCount}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}

function BookCard({ book, isPurchased, bookSalesCount }) {
    const sold = bookSalesCount[book.id] || bookSalesCount[book.firestoreId] || 0;
    const purchased = isPurchased(book.id);

    return (
        <a
            href={`/book/preview?id=${String(book.id).replace('firestore-', '')}`}
            className="book-card"
            style={{ flexShrink: 0, width: '200px', textDecoration: 'none' }}
        >
            {/* ── Cover image ── */}
            <div style={{ position: 'relative', background: '#e8e3d8' }}>
                <img
                    src={book.image}
                    alt={book.title}
                    className="book-cover"
                    style={{
                        width: '100%',
                        aspectRatio: '3/4',
                        objectFit: 'cover',
                        display: 'block',
                    }}
                    onError={e => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                    }}
                />
                {/* Fallback placeholder (hidden until image errors) */}
                <div style={{
                    display: 'none',
                    width: '100%',
                    aspectRatio: '3/4',
                    background: '#ede8df',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}>
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="1.5">
                        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                    </svg>
                </div>

                {/* ● LIVE badge — top left (always shown, matches image) */}
                <div style={{
                    position: 'absolute', top: '8px', left: '8px',
                    display: 'inline-flex', alignItems: 'center', gap: '4px',
                    background: NAVY,
                    padding: '3px 8px',
                    fontFamily: "'Lato',sans-serif",
                    fontSize: '9px', fontWeight: 700,
                    letterSpacing: '0.06em',
                    color: '#fff',
                }}>
                    <span style={{
                        width: '5px', height: '5px', borderRadius: '50%',
                        background: '#22c55e',
                        display: 'inline-block', flexShrink: 0,
                    }} />
                    PDF
                </div>

                {/* Owned badge — top right */}
                {purchased && (
                    <span style={{
                        position: 'absolute', top: '8px', right: '8px',
                        background: '#16a34a', color: '#fff',
                        fontSize: '9px', fontWeight: 700,
                        padding: '3px 7px',
                        fontFamily: "'Lato',sans-serif",
                    }}>OWNED</span>
                )}
            </div>

            {/* ── Meta area (white bg) ── */}
            <div style={{ padding: '10px 10px 12px', background: '#fff', borderTop: '0.5px solid #f0ebe0' }}>

                {/* Title */}
                <h4 style={{
                    fontFamily: "'Playfair Display',serif",
                    fontSize: '13px', fontWeight: 700,
                    color: NAVY,
                    margin: '0 0 3px',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    lineHeight: 1.35,
                }}>
                    {book.title}
                </h4>

                {/* Author */}
                <p style={{
                    fontSize: '11px', color: '#999',
                    margin: '0 0 8px',
                    fontFamily: "'Lato',sans-serif",
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                }}>
                    {book.author}
                </p>

                {/* Price row */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px', flexWrap: 'wrap' }}>
                    <p style={{
                        fontSize: '14px', fontWeight: 700,
                        color: NAVY, margin: 0,
                        fontFamily: "'Lato',sans-serif",
                    }}>
                    </p>

                    {/* Category tag — shown when category exists (like "PUBLIC ADMINISTRATION" in image) */}
                    {book.category && !purchased && (
                        <span style={{
                            display: 'inline-block',
                            background: CREAM,
                            border: `0.5px solid rgba(184,150,62,0.3)`,
                            color: GOLD,
                            fontSize: '8px', fontWeight: 700,
                            letterSpacing: '0.08em',
                            textTransform: 'uppercase',
                            padding: '3px 7px',
                            fontFamily: "'Lato',sans-serif",
                            maxWidth: '110px',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                        }}>
                            {book.category}
                        </span>
                    )}
                </div>

                {/* Sold count — subtle, below price */}
                {sold > 0 && (
                    <p style={{
                        fontSize: '10px', color: '#bbb',
                        margin: '5px 0 0',
                        display: 'flex', alignItems: 'center', gap: '4px',
                        fontFamily: "'Lato',sans-serif",
                    }}>
                        <ShoppingBag size={9} /> {sold} sold
                    </p>
                )}
            </div>
        </a>
    );
}