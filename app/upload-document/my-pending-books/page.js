"use client";
import { useEffect, useState } from "react";
import { db, auth } from "@/lib/firebaseConfig";
import { collection, query, where, getDocs, orderBy, limit } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import {
    Clock, CheckCircle, BookOpen, X, Upload, TrendingUp,
    FileText, AlertCircle, Sparkles, ChevronRight, Library,
} from "lucide-react";
import Link from "next/link";
import { useCurrency } from '@/app/context/CurrencyContext';

/* ─── colour tokens ─────────────────────────────────────────── */
const NAVY = "#0d2244";
const GOLD = "#b8963e";
const GOLDD = "#d4aa5a";
const CREAM = "#f5f0e8";
const BG = "#f5f1ea";

/* ─── thumbnail helper ──────────────────────────────────────── */
const getThumbnail = (book) => {
    if (book?.driveFileId)
        return `https://drive.google.com/thumbnail?id=${book.driveFileId}&sz=w400`;
    if (book?.embedUrl) {
        const m = book.embedUrl.match(/\/d\/(.*?)\/|\/file\/d\/(.*?)\/|id=(.*?)(&|$)/);
        if (m) { const id = m[1] || m[2] || m[3]; if (id) return `https://drive.google.com/thumbnail?id=${id}&sz=w400`; }
    }
    if (book?.pdfUrl?.includes("drive.google.com")) {
        const m = book.pdfUrl.match(/[-\w]{25,}/);
        if (m) return `https://drive.google.com/thumbnail?id=${m[0]}&sz=w400`;
    }
    return null;
};

/* ─── status config ─────────────────────────────────────────── */
const STATUS_CFG = {
    approved: { label: "Approved", icon: CheckCircle, iconColor: "#16a34a", bg: "#f0fdf4", border: "rgba(22,163,74,0.3)", barColor: "#16a34a", dotAnim: false },
    rejected: { label: "Rejected", icon: AlertCircle, iconColor: "#dc2626", bg: "#fef2f2", border: "rgba(220,38,38,0.3)", barColor: "#dc2626", dotAnim: false },
    pending: { label: "Under Review", icon: Clock, iconColor: GOLD, bg: "#fdf8ee", border: "rgba(184,150,62,0.3)", barColor: GOLD, dotAnim: true },
};
const getStatus = (book) => STATUS_CFG[book.status] || STATUS_CFG.pending;

const fmtDate = (ts) => {
    if (!ts) return "—";
    const d = ts?.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
};

/* ═══════════════════════════════════════════════════════════════
   COMPONENT
═══════════════════════════════════════════════════════════════ */
export default function MySubmissions() {
    const [myBooks, setMyBooks] = useState([]);
    const [publicBooks, setPublicBooks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showBanner, setShowBanner] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);
    const { fmt } = useCurrency();
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        if (params.get("status") === "submitted") {
            setShowBanner(true);
            window.history.replaceState({}, "", "/advertise/my-submissions");
        }
    }, []);

    useEffect(() => {
        const fetchData = async (user) => {
            setCurrentUser(user);
            try {
                const myQ = query(collection(db, "advertMyBook"), where("userId", "==", user.uid), orderBy("createdAt", "desc"));
                const mySnap = await getDocs(myQ);
                setMyBooks(mySnap.docs.map((d) => ({ id: d.id, ...d.data() })));

                const pubQ = query(collection(db, "advertMyBook"), where("status", "==", "approved"), limit(6));
                const pubSnap = await getDocs(pubQ);
                setPublicBooks(pubSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
            } catch (e) { console.error(e); }
            finally { setLoading(false); }
        };
        const unsub = onAuthStateChanged(auth, (u) => { if (u) fetchData(u); });
        return () => unsub();
    }, []);

    const pending = myBooks.filter((b) => !b.status || b.status === "pending").length;
    const approved = myBooks.filter((b) => b.status === "approved").length;
    const rejected = myBooks.filter((b) => b.status === "rejected").length;
    const communityBooks = publicBooks.filter((b) => b.userId !== currentUser?.uid);

    /* ── Loading ── */
    if (loading) return (
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: BG }}>
            <div style={{ textAlign: "center" }}>
                <div style={{ width: "56px", height: "56px", border: `3px solid ${GOLD}`, borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 16px" }} />
                <p style={{ fontFamily: "'Playfair Display',serif", fontSize: "18px", color: NAVY }}>Loading submissions…</p>
                <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
            </div>
        </div>
    );

    return (
        <>
            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400&family=Lato:wght@300;400;700&display=swap');
        .sub-root { font-family:'Lato',sans-serif; background:${BG}; }
        .sub-serif { font-family:'Playfair Display',Georgia,serif; }
        .sub-book-row {
          background:#fff; border:0.5px solid #e5ddd0; overflow:hidden;
          transition:border-color .18s,box-shadow .18s; margin-bottom:8px;
        }
        .sub-book-row:hover { border-color:${GOLD}; box-shadow:0 4px 20px rgba(13,34,68,0.08); }
        .sub-comm-card {
          background:#fff; border:0.5px solid #e5ddd0; overflow:hidden;
          transition:all .2s; display:block; text-decoration:none;
        }
        .sub-comm-card:hover { border-color:${GOLD}; box-shadow:0 8px 24px rgba(13,34,68,0.1); transform:translateY(-2px); }
        .sub-comm-card:hover img { transform:scale(1.05); }
        .sub-comm-img { transition:transform .5s; }
        @keyframes shimmer { 0%,100%{opacity:1} 50%{opacity:.45} }
        .shimmer-bar { animation:shimmer 2s infinite; }
        @keyframes slideDown {
          from { opacity:0; transform:translateY(-14px); }
          to   { opacity:1; transform:translateY(0); }
        }
        .slide-down { animation:slideDown .35s ease-out both; }
        @keyframes pulse2 { 0%,100%{opacity:1} 50%{opacity:0.4} }
        .pulse-dot { animation:pulse2 1.5s infinite; }
      `}</style>

            <div className="sub-root" style={{ minHeight: "100vh" }}>

                {/* ── Page Header ── */}
                <div style={{
                    background: NAVY,
                    backgroundImage: "radial-gradient(rgba(184,150,62,0.07) 1px,transparent 1px)",
                    backgroundSize: "28px 28px",
                    position: "relative", overflow: "hidden",
                }}>
                    {/* decorative corner */}
                    <div style={{ position: "absolute", top: "-40px", right: "-40px", width: "160px", height: "160px", border: "0.5px solid rgba(184,150,62,0.15)", transform: "rotate(45deg)" }} />
                    <div style={{ position: "absolute", bottom: "-30px", left: "60px", width: "100px", height: "100px", border: "0.5px solid rgba(184,150,62,0.1)", transform: "rotate(45deg)" }} />

                    <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "36px 20px", position: "relative", zIndex: 1 }}>
                        <p style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: GOLD, marginBottom: "6px", fontFamily: "'Lato',sans-serif" }}>
                            Author Studio
                        </p>
                        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-end", justifyContent: "space-between", gap: "16px", marginBottom: "28px" }}>
                            <div>
                                <h1 className="sub-serif" style={{ fontSize: "clamp(26px,5vw,38px)", fontWeight: 700, color: "#fff", margin: "0 0 6px" }}>
                                    My Submissions
                                </h1>
                                <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.45)", fontFamily: "'Lato',sans-serif", margin: 0 }}>
                                    Track every document you've published on LAN Library
                                </p>
                            </div>
                            <Link href="/upload-document">
                                <button style={{
                                    display: "flex", alignItems: "center", gap: "8px",
                                    background: GOLD, color: NAVY, padding: "11px 20px",
                                    border: "none", fontSize: "12px", fontWeight: 700,
                                    cursor: "pointer", fontFamily: "'Lato',sans-serif",
                                    letterSpacing: "0.05em", transition: "background .18s",
                                }}
                                    onMouseEnter={e => e.currentTarget.style.background = GOLDD}
                                    onMouseLeave={e => e.currentTarget.style.background = GOLD}
                                >
                                    <Upload size={14} /> Upload New
                                </button>
                            </Link>
                        </div>

                        {/* ── Stat Pills ── */}
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                            {[
                                { label: "Total", value: myBooks.length, bg: "rgba(255,255,255,0.1)", border: "rgba(255,255,255,0.15)", color: "#fff" },
                                { label: "Approved", value: approved, bg: "rgba(22,163,74,0.15)", border: "rgba(22,163,74,0.25)", color: "#6ee7b7" },
                                { label: "Under Review", value: pending, bg: "rgba(184,150,62,0.15)", border: "rgba(184,150,62,0.3)", color: GOLDD },
                                { label: "Rejected", value: rejected, bg: "rgba(220,38,38,0.12)", border: "rgba(220,38,38,0.25)", color: "#fca5a5" },
                            ].map(({ label, value, bg, border, color }) => (
                                <div key={label} style={{
                                    display: "flex", alignItems: "center", gap: "8px",
                                    background: bg, border: `0.5px solid ${border}`,
                                    padding: "7px 14px", fontFamily: "'Lato',sans-serif",
                                }}>
                                    <span style={{ fontSize: "16px", fontWeight: 700, color }}>{value}</span>
                                    <span style={{ fontSize: "10px", fontWeight: 700, color: "rgba(255,255,255,0.5)", letterSpacing: "0.08em", textTransform: "uppercase" }}>{label}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "28px 16px" }}>

                    {/* ── Success Banner ── */}
                    {showBanner && (
                        <div className="slide-down" style={{
                            background: "#fff", border: "0.5px solid rgba(22,163,74,0.3)",
                            borderLeft: "3px solid #16a34a",
                            padding: "16px 20px", marginBottom: "24px",
                            display: "flex", alignItems: "flex-start", gap: "14px",
                        }}>
                            <div style={{ width: "36px", height: "36px", border: "0.5px solid rgba(22,163,74,0.3)", background: "#f0fdf4", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                <CheckCircle size={18} style={{ color: "#16a34a" }} />
                            </div>
                            <div style={{ flex: 1 }}>
                                <p style={{ fontFamily: "'Playfair Display',serif", fontSize: "15px", fontWeight: 700, color: NAVY, margin: "0 0 4px" }}>
                                    Submitted Successfully!
                                </p>
                                <p style={{ fontSize: "12px", color: "#555", fontFamily: "'Lato',sans-serif", margin: "0 0 8px", lineHeight: 1.6 }}>
                                    Your document is under review. We typically respond within <strong>24–48 hours</strong> and will notify you once a decision is made.
                                </p>
                                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                    <Clock size={11} style={{ color: GOLD }} />
                                    <span style={{ fontSize: "11px", fontWeight: 700, color: GOLD, fontFamily: "'Lato',sans-serif" }}>
                                        Average review time: 24–48 hours
                                    </span>
                                </div>
                            </div>
                            <button onClick={() => setShowBanner(false)} style={{ background: "transparent", border: "none", cursor: "pointer", color: "#ccc", flexShrink: 0 }}>
                                <X size={16} />
                            </button>
                        </div>
                    )}

                    {/* ── My Documents ── */}
                    <div style={{ marginBottom: "36px" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
                            <div>
                                <p style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: GOLD, marginBottom: "4px", fontFamily: "'Lato',sans-serif" }}>
                                    Your Uploads
                                </p>
                                <h2 className="sub-serif" style={{ fontSize: "20px", fontWeight: 700, color: NAVY, margin: 0 }}>
                                    My Documents
                                </h2>
                            </div>
                            {myBooks.length > 0 && (
                                <span style={{ fontSize: "11px", fontWeight: 700, color: "#aaa", fontFamily: "'Lato',sans-serif" }}>
                                    {myBooks.length} total
                                </span>
                            )}
                        </div>

                        {myBooks.length === 0 ? (
                            <div style={{ background: "#fff", border: "0.5px dashed #e5ddd0", padding: "64px 24px", textAlign: "center" }}>
                                <div style={{ width: "64px", height: "64px", border: "0.5px solid #e5ddd0", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", background: CREAM }}>
                                    <Upload size={24} style={{ color: NAVY }} />
                                </div>
                                <p className="sub-serif" style={{ fontSize: "20px", fontWeight: 700, color: NAVY, margin: "0 0 6px" }}>No submissions yet</p>
                                <p style={{ fontSize: "13px", color: "#aaa", marginBottom: "20px", fontFamily: "'Lato',sans-serif" }}>
                                    Upload your first document to start earning
                                </p>
                                <Link href="/upload-document">
                                    <button style={{
                                        display: "inline-flex", alignItems: "center", gap: "8px",
                                        background: NAVY, color: "#fff", padding: "12px 24px",
                                        border: "none", fontSize: "13px", fontWeight: 700,
                                        cursor: "pointer", fontFamily: "'Lato',sans-serif",
                                    }}>
                                        <Upload size={15} /> Upload a Document
                                    </button>
                                </Link>
                            </div>
                        ) : (
                            <div>
                                {myBooks.map((book, idx) => {
                                    const st = getStatus(book);
                                    const Icon = st.icon;
                                    const thumb = getThumbnail(book);
                                    return (
                                        <div key={book.id} className="sub-book-row" style={{ animationDelay: `${idx * 50}ms` }}>
                                            <div style={{ display: "flex", alignItems: "center", gap: "14px", padding: "16px" }}>

                                                {/* Thumbnail */}
                                                <div style={{ width: "56px", height: "74px", background: CREAM, border: "0.5px solid #e5ddd0", flexShrink: 0, overflow: "hidden" }}>
                                                    {thumb ? (
                                                        <img src={thumb} alt={book.bookTitle} style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                                            onError={e => { e.target.style.display = "none"; }} />
                                                    ) : (
                                                        <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                                            <BookOpen size={20} style={{ color: "#ccc" }} />
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Info */}
                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "10px", flexWrap: "wrap" }}>
                                                        <div style={{ minWidth: 0 }}>
                                                            <p style={{ fontFamily: "'Playfair Display',serif", fontSize: "15px", fontWeight: 700, color: NAVY, margin: "0 0 2px", lineHeight: 1.3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "340px" }}>
                                                                {book.bookTitle}
                                                            </p>
                                                            <p style={{ fontSize: "12px", color: "#aaa", margin: 0, fontFamily: "'Lato',sans-serif" }}>
                                                                {book.author}
                                                                {book.courseCode && <span style={{ color: GOLD, marginLeft: "8px" }}>· {book.courseCode}</span>}
                                                            </p>
                                                        </div>

                                                        {/* Status pill */}
                                                        <div style={{
                                                            display: "inline-flex", alignItems: "center", gap: "6px",
                                                            padding: "4px 12px",
                                                            background: st.bg, border: `0.5px solid ${st.border}`,
                                                            flexShrink: 0,
                                                        }}>
                                                            <span style={{
                                                                width: "6px", height: "6px", borderRadius: "50%",
                                                                background: st.barColor,
                                                                ...(st.dotAnim ? { animation: "pulse2 1.5s infinite" } : {}),
                                                            }} />
                                                            <span style={{ fontSize: "10px", fontWeight: 700, color: st.iconColor, fontFamily: "'Lato',sans-serif", letterSpacing: "0.06em" }}>
                                                                {st.label}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    {/* Meta row */}
                                                    <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "12px", marginTop: "10px" }}>
                                                        <span style={{ fontSize: "11px", color: "#aaa", fontFamily: "'Lato',sans-serif", display: "flex", alignItems: "center", gap: "4px" }}>
                                                            <Clock size={11} /> {fmtDate(book.createdAt)}
                                                        </span>
                                                        {book.price && (
                                                            <span style={{ fontSize: "12px", fontWeight: 700, color: NAVY, fontFamily: "'Lato',sans-serif" }}>
                                                                {fmt(Number(book.price))}
                                                            </span>
                                                        )}
                                                        {book.category && (
                                                            <span style={{ fontSize: "10px", fontWeight: 700, background: CREAM, border: "0.5px solid #e5ddd0", color: "#888", padding: "2px 8px", fontFamily: "'Lato',sans-serif" }}>
                                                                {book.category}
                                                            </span>
                                                        )}
                                                    </div>

                                                    {/* Rejection reason */}
                                                    {book.status === "rejected" && book.rejectionReason && (
                                                        <div style={{ marginTop: "10px", background: "#fef2f2", border: "0.5px solid rgba(220,38,38,0.25)", padding: "8px 12px" }}>
                                                            <p style={{ fontSize: "11px", color: "#dc2626", fontFamily: "'Lato',sans-serif", margin: 0, lineHeight: 1.5 }}>
                                                                <strong>Reason:</strong> {book.rejectionReason}
                                                            </p>
                                                        </div>
                                                    )}

                                                    {/* Approved link */}
                                                    {book.status === "approved" && (
                                                        <Link href={`/book/preview?id=${book.id}`} style={{
                                                            display: "inline-flex", alignItems: "center", gap: "4px",
                                                            marginTop: "10px", fontSize: "11px", fontWeight: 700,
                                                            color: GOLD, textDecoration: "none", fontFamily: "'Lato',sans-serif",
                                                        }}>
                                                            View in Library <ChevronRight size={11} />
                                                        </Link>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Pending progress bar */}
                                            {(!book.status || book.status === "pending") && (
                                                <div style={{ height: "2px", background: "#f0ebe0" }}>
                                                    <div className="shimmer-bar" style={{ height: "100%", width: "55%", background: `linear-gradient(90deg,${GOLD},${GOLDD})` }} />
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* ── Community Divider ── */}
                    {communityBooks.length > 0 && (
                        <>
                            <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "28px" }}>
                                <div style={{ flex: 1, height: "0.5px", background: "#e5ddd0" }} />
                                <span style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: GOLD, fontFamily: "'Lato',sans-serif" }}>Community</span>
                                <div style={{ flex: 1, height: "0.5px", background: "#e5ddd0" }} />
                            </div>

                            {/* ── Recently Approved ── */}
                            <div>
                                <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: "16px" }}>
                                    <div>
                                        <p style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: GOLD, marginBottom: "4px", fontFamily: "'Lato',sans-serif" }}>
                                            Live on Library
                                        </p>
                                        <h2 className="sub-serif" style={{ fontSize: "20px", fontWeight: 700, color: NAVY, margin: 0 }}>
                                            Recently Approved
                                        </h2>
                                    </div>
                                    <Link href="/documents" style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "11px", fontWeight: 700, color: NAVY, textDecoration: "none", fontFamily: "'Lato',sans-serif", letterSpacing: "0.05em" }}>
                                        Browse All <ChevronRight size={12} />
                                    </Link>
                                </div>

                                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(160px,1fr))", gap: "12px" }}>
                                    {communityBooks.map((book) => {
                                        const thumb = getThumbnail(book);
                                        return (
                                            <Link key={book.id} href={`/book/preview?id=${book.id}`} className="sub-comm-card">
                                                {/* Cover */}
                                                <div style={{ aspectRatio: "3/4", background: CREAM, position: "relative", overflow: "hidden" }}>
                                                    {thumb ? (
                                                        <img className="sub-comm-img" src={thumb} alt={book.bookTitle}
                                                            style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                                            onError={e => { e.target.style.display = "none"; }} />
                                                    ) : (
                                                        <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                                            <BookOpen size={32} style={{ color: "#ccc" }} />
                                                        </div>
                                                    )}
                                                    {/* Live badge */}
                                                    <div style={{ position: "absolute", top: "8px", left: "8px", display: "flex", alignItems: "center", gap: "4px", background: NAVY, padding: "3px 8px" }}>
                                                        <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: "#16a34a" }} />
                                                        <span style={{ fontSize: "8px", fontWeight: 700, color: GOLD, fontFamily: "'Lato',sans-serif", letterSpacing: "0.08em", textTransform: "uppercase" }}>Live</span>
                                                    </div>
                                                </div>

                                                {/* Info */}
                                                <div style={{ padding: "12px" }}>
                                                    <p className="sub-serif" style={{ fontSize: "13px", fontWeight: 700, color: NAVY, margin: "0 0 2px", lineHeight: 1.3, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                                                        {book.bookTitle}
                                                    </p>
                                                    <p style={{ fontSize: "10px", color: "#aaa", margin: "0 0 8px", fontFamily: "'Lato',sans-serif", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                                        {book.author}
                                                    </p>
                                                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                                        <span style={{ fontSize: "12px", fontWeight: 700, color: NAVY, fontFamily: "'Lato',sans-serif" }}>
                                                            {fmt(Number(book.price || 0))}
                                                        </span>
                                                        {book.courseCode && (
                                                            <span style={{ fontSize: "9px", fontWeight: 700, background: CREAM, border: "0.5px solid #e5ddd0", color: GOLD, padding: "2px 6px", fontFamily: "'Lato',sans-serif" }}>
                                                                {book.courseCode}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </Link>
                                        );
                                    })}
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {/* bottom padding for mobile nav */}
                <div style={{ height: "32px" }} />
            </div>
        </>
    );
}