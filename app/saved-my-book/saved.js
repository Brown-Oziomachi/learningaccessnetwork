"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebaseConfig';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { Bookmark, Trash2, Lock, ArrowLeft, BookOpen, ShoppingBag } from 'lucide-react';
import Link from 'next/link';

/* ─── colour tokens (matches HomeClient exactly) ─────────────── */
const NAVY  = "#0d2244";
const GOLD  = "#b8963e";
const GOLDD = "#d4aa5a";
const CREAM = "#f5f0e8";
const BG    = "#f5f1ea";

export default function SavedBooksClient() {
    const router = useRouter();
    const [savedBooks, setSavedBooks]   = useState([]);
    const [loading, setLoading]         = useState(true);
    const [user, setUser]               = useState(null);
    const [removingId, setRemovingId]   = useState(null);
    const [showPopup, setShowPopup]     = useState(false);

    /* ── thumbnail helper ── */
    const getThumbnailUrl = (book) => {
        if (book.driveFileId) return `https://drive.google.com/thumbnail?id=${book.driveFileId}&sz=w400`;
        if (book.embedUrl) {
            const m = book.embedUrl.match(/\/d\/(.*?)\/|\/file\/d\/(.*?)\/|id=(.*?)(&|$)/);
            if (m) { const id = m[1]||m[2]||m[3]; if (id) return `https://drive.google.com/thumbnail?id=${id}&sz=w400`; }
        }
        if (book.pdfUrl?.includes('drive.google.com')) {
            const m = book.pdfUrl.match(/[-\w]{25,}/);
            if (m) return `https://drive.google.com/thumbnail?id=${m[0]}&sz=w400`;
        }
        return book.image || 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400';
    };

    useEffect(() => {
        const unsub = onAuthStateChanged(auth, async (cu) => {
            if (cu) { setUser(cu); await fetchSavedBooks(cu.uid); }
            else router.push('/auth/signin');
        });
        return () => unsub();
    }, [router]);

    const fetchSavedBooks = async (uid) => {
        try {
            setLoading(true);
            const snap = await getDoc(doc(db, 'users', uid));
            if (snap.exists()) {
                const saved = snap.data().savedBooks || [];
                setSavedBooks(saved.map(b => ({ ...b, image: getThumbnailUrl(b) })));
            }
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const handleRemove = async (bookId) => {
        try {
            setRemovingId(bookId);
            const updated = savedBooks.filter(b => b.id !== bookId);
            await updateDoc(doc(db, 'users', user.uid), { savedBooks: updated });
            setSavedBooks(updated);
            setShowPopup(true);
            setTimeout(() => setShowPopup(false), 2500);
        } catch (e) { console.error(e); alert('Error removing book. Please try again.'); }
        finally { setRemovingId(null); }
    };

    const formatDate = (ds) => new Date(ds).toLocaleDateString('en-US', { year:'numeric', month:'short', day:'numeric' });

    /* ── loading ── */
    if (loading) return (
        <div style={{ minHeight:"100vh", background: BG, display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'Lato',sans-serif" }}>
            <div style={{ textAlign:"center" }}>
                <div style={{ width:"52px", height:"52px", border:`3px solid rgba(184,150,62,0.2)`, borderTopColor: GOLD, borderRadius:"50%", margin:"0 auto 20px", animation:"spin 0.8s linear infinite" }} />
                <p style={{ color: NAVY, fontSize:"13px", fontWeight:700, letterSpacing:"0.12em", textTransform:"uppercase" }}>Loading your library…</p>
            </div>
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
    );

    return (
        <>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400&family=Lato:wght@300;400;700&display=swap');

                .lan-root { font-family:'Lato',sans-serif; background:${BG}; }
                .lan-serif { font-family:'Playfair Display',Georgia,serif; }

                /* header */
                .saved-header {
                    background-color:${NAVY};
                    background-image:
                        radial-gradient(rgba(184,150,62,0.06) 1px,transparent 1px),
                        radial-gradient(rgba(255,255,255,0.03) 1px,transparent 1px);
                    background-size:28px 28px,14px 14px;
                    background-position:0 0,7px 7px;
                }

                /* book card */
                .book-card {
                    background:#fff;
                    border:0.5px solid #e5ddd0;
                    transition:transform 0.25s cubic-bezier(.4,0,.2,1), box-shadow 0.25s, border-color 0.25s;
                    flex-shrink:0;
                }
                .book-card:hover { transform:translateY(-6px); box-shadow:0 20px 48px rgba(13,34,68,0.13); border-color:${GOLD}; }
                .book-card:hover .cover-img { transform:scale(1.04); }
                .cover-img { transition:transform 0.5s cubic-bezier(.4,0,.2,1); }

                /* btn */
                .btn-primary {
                    display:flex; align-items:center; justify-content:center; gap:6px;
                    width:100%; padding:9px 0; background:${NAVY}; color:#fff;
                    font-family:'Lato',sans-serif; font-size:11px; font-weight:700;
                    letter-spacing:0.06em; text-transform:uppercase; border:none; cursor:pointer;
                    transition:background 0.18s; text-decoration:none;
                }
                .btn-primary:hover { background:#1a3a6e; }

                .btn-ghost {
                    display:flex; align-items:center; justify-content:center; gap:6px;
                    width:100%; padding:9px 0; background:#fff; color:#dc2626;
                    border:0.5px solid #dc2626; font-family:'Lato',sans-serif;
                    font-size:11px; font-weight:700; letter-spacing:0.06em;
                    text-transform:uppercase; cursor:pointer; transition:background 0.18s;
                }
                .btn-ghost:hover { background:#fef2f2; }
                .btn-ghost:disabled { opacity:0.5; cursor:not-allowed; }

                /* browse empty btn */
                .btn-browse {
                    display:inline-flex; align-items:center; gap:8px;
                    padding:13px 32px; background:${NAVY}; color:#fff;
                    font-family:'Lato',sans-serif; font-size:13px; font-weight:700;
                    letter-spacing:0.06em; text-transform:uppercase; text-decoration:none;
                    border:none; cursor:pointer; transition:background 0.18s;
                }
                .btn-browse:hover { background:#1a3a6e; }

                /* scrollbar hide */
                .sbar-none { scrollbar-width:none; -ms-overflow-style:none; }
                .sbar-none::-webkit-scrollbar { display:none; }

                /* popup */
                @keyframes popIn  { from{opacity:0;transform:translateX(-50%) translateY(12px)} to{opacity:1;transform:translateX(-50%) translateY(0)} }
                .popup-toast { animation:popIn 0.3s ease-out both; }

                /* gold line */
                .gold-line { display:flex; align-items:center; gap:14px; }
                .gold-line::before,.gold-line::after { content:""; flex:1; height:1px; background:rgba(184,150,62,0.3); }

                @keyframes spin { to{transform:rotate(360deg)} }
            `}</style>

            <div className="lan-root" style={{ minHeight:"100vh" }}>

                {/* ══ HEADER ══ */}
                <header className="saved-header" style={{ padding:"0 24px" }}>
                    <div style={{ maxWidth:"1200px", margin:"0 auto", padding:"20px 0", display:"flex", alignItems:"center", gap:"16px" }}>
                        <button
                            onClick={() => router.back()}
                            style={{ width:"40px", height:"40px", border:"0.5px solid rgba(184,150,62,0.3)", background:"transparent", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", flexShrink:0, transition:"background 0.18s" }}
                            onMouseEnter={e => e.currentTarget.style.background="rgba(184,150,62,0.12)"}
                            onMouseLeave={e => e.currentTarget.style.background="transparent"}
                        >
                            <ArrowLeft size={18} color="#fff" />
                        </button>

                        <div>
                            <p style={{ fontSize:"10px", fontWeight:700, letterSpacing:"0.22em", textTransform:"uppercase", color: GOLD, marginBottom:"4px" }}>Your Collection</p>
                            <h1 className="lan-serif" style={{ fontSize:"clamp(22px,4vw,34px)", fontWeight:700, color:"#fff", margin:0, lineHeight:1.1 }}>
                                Saved Books
                            </h1>
                        </div>

                        {savedBooks.length > 0 && (
                            <div style={{ marginLeft:"auto", textAlign:"right" }}>
                                <div className="lan-serif" style={{ fontSize:"28px", fontWeight:700, color:"#fff" }}>{savedBooks.length}</div>
                                <div style={{ fontSize:"10px", fontWeight:700, letterSpacing:"0.1em", textTransform:"uppercase", color:`rgba(184,150,62,0.8)` }}>
                                    {savedBooks.length === 1 ? "Book" : "Books"}
                                </div>
                            </div>
                        )}
                    </div>
                </header>

                {/* ══ MAIN ══ */}
                <main style={{ maxWidth:"1200px", margin:"0 auto", padding:"48px 24px" }}>

                    {savedBooks.length === 0 ? (
                        /* ── Empty state ── */
                        <div style={{ background:"#fff", border:"0.5px solid #e5ddd0", padding:"80px 24px", textAlign:"center" }}>
                            {/* diamond icon */}
                            <div style={{ width:"72px", height:"72px", margin:"0 auto 24px", border:`2px solid #e5ddd0`, transform:"rotate(45deg)", display:"flex", alignItems:"center", justifyContent:"center" }}>
                                <Bookmark size={26} style={{ color:"#ccc", transform:"rotate(-45deg)" }} />
                            </div>

                            <p style={{ fontSize:"10px", fontWeight:700, letterSpacing:"0.22em", textTransform:"uppercase", color: GOLD, marginBottom:"10px" }}>Empty Shelf</p>
                            <h3 className="lan-serif" style={{ fontSize:"clamp(24px,4vw,36px)", fontWeight:700, color: NAVY, margin:"0 0 12px" }}>
                                No Saved Books Yet
                            </h3>

                            {/* gold diamond divider */}
                            <div className="gold-line" style={{ maxWidth:"240px", margin:"0 auto 16px" }}>
                                <div style={{ width:"7px", height:"7px", background: GOLD, transform:"rotate(45deg)", flexShrink:0 }} />
                            </div>

                            <p style={{ fontSize:"14px", color:"#888", maxWidth:"400px", margin:"0 auto 32px", lineHeight:1.75, fontWeight:300 }}>
                                Start saving books you're interested in to build your personal library
                            </p>

                            <a href="/documents" className="btn-browse">
                                <BookOpen size={14} />
                                Browse the Library
                            </a>
                        </div>

                    ) : (
                        /* ── Books grid / scroll ── */
                        <div>
                            {/* section header */}
                            <div style={{ display:"flex", alignItems:"flex-end", justifyContent:"space-between", marginBottom:"32px" }}>
                                <div>
                                    <p style={{ fontSize:"10px", fontWeight:700, letterSpacing:"0.22em", textTransform:"uppercase", color: GOLD, marginBottom:"6px" }}>
                                        Your Collection
                                    </p>
                                    <h2 className="lan-serif" style={{ fontSize:"clamp(22px,3vw,32px)", fontWeight:700, color: NAVY, margin:0 }}>
                                        Saved Books
                                    </h2>
                                </div>
                                <a href="/documents" style={{ display:"inline-flex", alignItems:"center", gap:"5px", fontSize:"11px", fontWeight:700, letterSpacing:"0.06em", textTransform:"uppercase", color: NAVY, textDecoration:"none", border:`0.5px solid ${NAVY}`, padding:"8px 16px", transition:"background 0.18s" }}
                                    onMouseEnter={e => e.currentTarget.style.background="rgba(13,34,68,0.06)"}
                                    onMouseLeave={e => e.currentTarget.style.background="transparent"}>
                                    <BookOpen size={12} /> Browse More
                                </a>
                            </div>

                            {/* horizontal scroll container */}
                            <div className="sbar-none" style={{ overflowX:"auto", paddingBottom:"12px", margin:"0 -4px", padding:"0 4px 16px" }}>
                                <div style={{ display:"flex", gap:"20px", minWidth:"min-content" }}>
                                    {savedBooks.map(book => (
                                        <div key={book.id} className="book-card" style={{ width:"210px" }}>

                                            {/* cover */}
                                            <Link href={`/book/preview?id=${book.id}`} style={{ display:"block", textDecoration:"none", position:"relative", background:"#ede8df", overflow:"hidden" }}>
                                                <img
                                                    src={book.image}
                                                    alt={book.title}
                                                    className="cover-img"
                                                    style={{ width:"100%", aspectRatio:"3/4", objectFit:"cover", display:"block" }}
                                                    onError={e => { e.target.src='https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400'; }}
                                                />

                                                {/* PDF badge */}
                                                <div style={{ position:"absolute", top:"8px", left:"8px", display:"inline-flex", alignItems:"center", gap:"4px", background: NAVY, padding:"3px 8px", fontSize:"9px", fontWeight:700, letterSpacing:"0.06em", color:"#fff", fontFamily:"'Lato',sans-serif" }}>
                                                    <span style={{ width:"5px", height:"5px", borderRadius:"50%", background:"#22c55e", display:"inline-block" }} />
                                                    PDF
                                                </div>

                                                {/* bookmark icon */}
                                                <div style={{ position:"absolute", top:"8px", right:"8px", background: GOLD, width:"28px", height:"28px", display:"flex", alignItems:"center", justifyContent:"center" }}>
                                                    <Bookmark size={13} style={{ color:"#fff", fill:"#fff" }} />
                                                </div>

                                                {/* NEW badge */}
                                                {book.isFromFirestore && (
                                                    <span style={{ position:"absolute", bottom:"8px", left:"8px", background:"#2563eb", color:"#fff", fontSize:"9px", fontWeight:700, padding:"3px 7px", fontFamily:"'Lato',sans-serif" }}>NEW</span>
                                                )}
                                            </Link>

                                            {/* meta */}
                                            <div style={{ padding:"14px 14px 16px", borderTop:"0.5px solid #f0ebe0" }}>
                                                <Link href={`/book/preview?id=${book.id}`} style={{ textDecoration:"none" }}>
                                                    <h3 className="lan-serif" style={{ fontSize:"13px", fontWeight:700, color: NAVY, margin:"0 0 4px", display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical", overflow:"hidden", lineHeight:1.35, cursor:"pointer" }}>
                                                        {book.title}
                                                    </h3>
                                                </Link>

                                                <p style={{ fontSize:"11px", color:"#888", margin:"0 0 10px", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", fontFamily:"'Lato',sans-serif" }}>
                                                    {book.author}
                                                </p>

                                                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"10px" }}>
                                                    <span className="lan-serif" style={{ fontSize:"16px", fontWeight:700, color: NAVY }}>
                                                        ₦{book.price?.toLocaleString()}
                                                    </span>
                                                    {book.category && (
                                                        <span style={{ background: CREAM, border:`0.5px solid rgba(184,150,62,0.3)`, color: GOLD, fontSize:"8px", fontWeight:700, letterSpacing:"0.08em", textTransform:"uppercase", padding:"3px 7px", fontFamily:"'Lato',sans-serif", maxWidth:"80px", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                                                            {book.category}
                                                        </span>
                                                    )}
                                                </div>

                                                <p style={{ fontSize:"10px", color:"#bbb", margin:"0 0 12px", display:"flex", alignItems:"center", gap:"4px", fontFamily:"'Lato',sans-serif" }}>
                                                    <ShoppingBag size={9} /> Saved {formatDate(book.savedAt)}
                                                </p>

                                                <div style={{ display:"flex", flexDirection:"column", gap:"7px" }}>
                                                    <Link href={`/book/preview?id=${book.id}`} className="btn-primary">
                                                        <Lock size={12} />
                                                        View &amp; Purchase
                                                    </Link>
                                                    <button
                                                        className="btn-ghost"
                                                        onClick={() => handleRemove(book.id)}
                                                        disabled={removingId === book.id}
                                                    >
                                                        {removingId === book.id
                                                            ? <span style={{ width:"10px", height:"10px", border:"2px solid rgba(220,38,38,0.3)", borderTopColor:"#dc2626", borderRadius:"50%", display:"inline-block", animation:"spin 0.7s linear infinite" }} />
                                                            : <><Trash2 size={12} /> Remove</>
                                                        }
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {savedBooks.length > 4 && (
                                <p style={{ textAlign:"center", fontSize:"11px", color:"#bbb", marginTop:"12px", fontFamily:"'Lato',sans-serif" }}>
                                    ← Scroll left or right to see all saved books →
                                </p>
                            )}
                        </div>
                    )}
                </main>
            </div>

            {/* ── toast popup ── */}
            {showPopup && (
                <div className="popup-toast" style={{ position:"fixed", bottom:"28px", left:"50%", transform:"translateX(-50%)", background: NAVY, color:"#fff", padding:"12px 24px", fontSize:"12px", fontWeight:700, letterSpacing:"0.08em", fontFamily:"'Lato',sans-serif", zIndex:50, display:"flex", alignItems:"center", gap:"8px", border:`0.5px solid rgba(184,150,62,0.3)` }}>
                    <span style={{ width:"6px", height:"6px", background: GOLD, borderRadius:"50%", flexShrink:0 }} />
                    Removed from saved books
                </div>
            )}
        </>
    );
}