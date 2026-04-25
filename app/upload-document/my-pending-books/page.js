"use client";
import { useEffect, useState } from "react";
import { db, auth } from "@/lib/firebaseConfig";
import { collection, query, where, getDocs, orderBy, limit } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import {
    Clock, CheckCircle, BookOpen, X, Upload, TrendingUp,
    FileText, AlertCircle, Sparkles, ChevronRight, Library
} from "lucide-react";
import Link from "next/link";

// ─── Thumbnail helper (reused from your other pages) ─────────────────────────
const getThumbnail = (book) => {
    if (book?.driveFileId)
        return `https://drive.google.com/thumbnail?id=${book.driveFileId}&sz=w400`;
    if (book?.embedUrl) {
        const m = book.embedUrl.match(/\/d\/(.*?)\/|\/file\/d\/(.*?)\/|id=(.*?)(&|$)/);
        if (m) { const id = m[1] || m[2] || m[3]; if (id) return `https://drive.google.com/thumbnail?id=${id}&sz=w400`; }
    }
    if (book?.pdfUrl?.includes('drive.google.com')) {
        const m = book.pdfUrl.match(/[-\w]{25,}/);
        if (m) return `https://drive.google.com/thumbnail?id=${m[0]}&sz=w400`;
    }
    return null;
};

// ─── Status config ────────────────────────────────────────────────────────────
const STATUS = {
    approved: {
        label: 'Approved',
        icon: CheckCircle,
        pill: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
        dot: 'bg-emerald-400',
        bar: 'bg-emerald-500',
    },
    rejected: {
        label: 'Rejected',
        icon: AlertCircle,
        pill: 'bg-red-50 text-red-600 border border-red-200',
        dot: 'bg-red-400',
        bar: 'bg-red-500',
    },
    pending: {
        label: 'Under Review',
        icon: Clock,
        pill: 'bg-amber-50 text-amber-700 border border-amber-200',
        dot: 'bg-amber-400 animate-pulse',
        bar: 'bg-amber-400',
    },
};

const getStatus = (book) =>
    STATUS[book.status] || STATUS.pending;

// ─── Format date ──────────────────────────────────────────────────────────────
const fmtDate = (ts) => {
    if (!ts) return '—';
    const d = ts?.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
};

export default function MySubmissions() {
    const [myBooks, setMyBooks] = useState([]);
    const [publicBooks, setPublicBooks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showBanner, setShowBanner] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        if (params.get('status') === 'submitted') {
            setShowBanner(true);
            window.history.replaceState({}, '', '/advertise/my-submissions');
        }
    }, []);

    useEffect(() => {
        const fetchData = async (user) => {
            setCurrentUser(user);
            try {
                const myQ = query(
                    collection(db, "advertMyBook"),
                    where("userId", "==", user.uid),
                    orderBy("createdAt", "desc")
                );
                const mySnap = await getDocs(myQ);
                setMyBooks(mySnap.docs.map(d => ({ id: d.id, ...d.data() })));

                const pubQ = query(
                    collection(db, "advertMyBook"),
                    where("status", "==", "approved"),
                    limit(6)
                );
                const pubSnap = await getDocs(pubQ);
                setPublicBooks(pubSnap.docs.map(d => ({ id: d.id, ...d.data() })));
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };

        const unsub = onAuthStateChanged(auth, u => { if (u) fetchData(u); });
        return () => unsub();
    }, []);

    const pending = myBooks.filter(b => !b.status || b.status === 'pending').length;
    const approved = myBooks.filter(b => b.status === 'approved').length;
    const rejected = myBooks.filter(b => b.status === 'rejected').length;

    if (loading) return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
            <div className="w-10 h-10 rounded-2xl bg-blue-950 flex items-center justify-center animate-pulse">
                <Library size={18} className="text-white" />
            </div>
            <p className="text-sm text-gray-400 font-medium tracking-wide">Loading submissions…</p>
        </div>
    );

    return (
        <div
            className="min-h-screen bg-[#f7f8fc]"
            style={{ fontFamily: "'DM Sans', 'Nunito', system-ui, sans-serif" }}
        >
            {/* ── Page header ────────────────────────────────────────────────── */}
            <div className="bg-blue-950 text-white relative overflow-hidden">
                {/* subtle grid texture */}
                <div className="absolute inset-0 opacity-[0.04]"
                    style={{
                        backgroundImage: `linear-gradient(rgba(255,255,255,.6) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.6) 1px,transparent 1px)`,
                        backgroundSize: '32px 32px'
                    }}
                />
                <div className="relative z-10 max-w-5xl mx-auto px-6 py-10">
                    <p className="text-blue-400 text-[10px] font-black uppercase tracking-[.2em] mb-2">
                        Author Studio
                    </p>
                    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-5">
                        <div>
                            <h1 className="text-3xl font-black tracking-tight">Pending Books</h1>
                            <p className="text-blue-300/70 text-sm mt-1.5">
                                Track every document you've published on LAN Library
                            </p>
                        </div>
                        <Link href="/upload-document">
                            <button className="flex items-center gap-2 bg-white text-blue-950 px-5 py-2.5 rounded-xl font-black text-sm hover:bg-blue-50 transition-colors shadow-lg shadow-blue-900/30 whitespace-nowrap">
                                <Upload size={15} /> Upload New
                            </button>
                        </Link>
                    </div>

                    {/* ── Stat pills ───────────────────────────────────────── */}
                    <div className="flex gap-3 mt-8 flex-wrap">
                        {[
                            { label: 'Total', value: myBooks.length, color: 'bg-white/10 text-white border-white/10' },
                            { label: 'Approved', value: approved, color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/20' },
                            { label: 'Under Review', value: pending, color: 'bg-amber-500/20 text-amber-300 border-amber-500/20' },
                            { label: 'Rejected', value: rejected, color: 'bg-red-500/20 text-red-300 border-red-500/20' },
                        ].map(({ label, value, color }) => (
                            <div key={label} className={`flex items-center gap-2.5 px-4 py-2 rounded-full border text-sm font-bold ${color}`}>
                                <span className="text-base font-black">{value}</span>
                                <span className="opacity-70">{label}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-4 md:px-6 py-8 space-y-10">

                {/* ── Success banner ───────────────────────────────────────── */}
                {showBanner && (
                    <div className="relative bg-white border border-emerald-200 rounded-2xl p-5 shadow-sm flex items-start gap-4 animate-[slideDown_.4s_ease-out]">
                        <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center flex-shrink-0">
                            <CheckCircle size={20} className="text-emerald-600" />
                        </div>
                        <div className="flex-1">
                            <h3 className="font-black text-gray-900 text-base">Submitted Successfully 🎉</h3>
                            <p className="text-sm text-gray-500 mt-1 leading-relaxed">
                                Your document is under review. We typically respond within <strong>24 days</strong> and will email you once a decision is made.
                            </p>
                            <div className="flex items-center gap-1.5 mt-2.5 text-xs text-emerald-600 font-semibold">
                                <Clock size={12} /> Average review time: 24–48 hours
                            </div>
                        </div>
                        <button onClick={() => setShowBanner(false)} className="text-gray-300 hover:text-gray-500 transition-colors flex-shrink-0">
                            <X size={18} />
                        </button>
                    </div>
                )}

                {/* ── My submissions ───────────────────────────────────────── */}
                <section>
                    <div className="flex items-center justify-between mb-5">
                        <h2 className="text-lg font-black text-gray-900 flex items-center gap-2">
                            <FileText size={17} className="text-blue-950" />
                            Your Documents
                        </h2>
                        {myBooks.length > 0 && (
                            <span className="text-xs font-bold text-gray-400">{myBooks.length} total</span>
                        )}
                    </div>

                    {myBooks.length === 0 ? (
                        <div className="bg-white border-2 border-dashed border-gray-200 rounded-2xl p-14 text-center">
                            <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                <Upload size={22} className="text-blue-950" />
                            </div>
                            <h3 className="font-black text-gray-800 text-base mb-1">No submissions yet</h3>
                            <p className="text-sm text-gray-400 mb-5">Upload your first document to start earning</p>
                            <Link href="/upload-document">
                                <button className="bg-blue-950 text-white px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-blue-900 transition-colors">
                                    Upload a Document
                                </button>
                            </Link>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {myBooks.map((book, idx) => {
                                const st = getStatus(book);
                                const StatusIcon = st.icon;
                                const thumb = getThumbnail(book);

                                return (
                                    <div
                                        key={book.id}
                                        className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-blue-100 transition-all duration-200 overflow-hidden"
                                        style={{ animationDelay: `${idx * 60}ms` }}
                                    >
                                        <div className="flex items-center gap-4 p-4 md:p-5">
                                            {/* Thumbnail or icon */}
                                            <div className="w-14 h-[72px] md:w-16 md:h-20 rounded-xl bg-gray-100 flex-shrink-0 overflow-hidden">
                                                {thumb ? (
                                                    <img
                                                        src={thumb}
                                                        alt={book.bookTitle}
                                                        className="w-full h-full object-cover"
                                                        onError={e => { e.target.style.display = 'none'; }}
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center">
                                                        <BookOpen size={22} className="text-gray-300" />
                                                    </div>
                                                )}
                                            </div>

                                            {/* Info */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                                                    <div className="min-w-0">
                                                        <h3 className="font-black text-gray-900 text-sm md:text-base leading-tight line-clamp-1">
                                                            {book.bookTitle}
                                                        </h3>
                                                        <p className="text-xs text-gray-400 mt-0.5 font-medium">
                                                            {book.author}
                                                            {book.courseCode && (
                                                                <span className="ml-2 text-blue-600">· {book.courseCode}</span>
                                                            )}
                                                        </p>
                                                    </div>

                                                    {/* Status pill */}
                                                    <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold flex-shrink-0 ${st.pill}`}>
                                                        <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
                                                        {st.label}
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-4 mt-3">
                                                    <span className="text-[11px] text-gray-400 flex items-center gap-1">
                                                        <Clock size={11} /> {fmtDate(book.createdAt)}
                                                    </span>
                                                    {book.price && (
                                                        <span className="text-[11px] font-black text-blue-950">
                                                            ₦{Number(book.price).toLocaleString()}
                                                        </span>
                                                    )}
                                                    {book.category && (
                                                        <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-semibold hidden sm:inline">
                                                            {book.category}
                                                        </span>
                                                    )}
                                                </div>

                                                {/* Rejected reason */}
                                                {book.status === 'rejected' && book.rejectionReason && (
                                                    <div className="mt-2.5 bg-red-50 border border-red-100 rounded-lg px-3 py-2 text-xs text-red-600 font-medium">
                                                        <strong>Reason:</strong> {book.rejectionReason}
                                                    </div>
                                                )}

                                                {/* Approved — link to preview */}
                                                {book.status === 'approved' && (
                                                    <Link
                                                        href={`/book/preview?id=${book.id}`}
                                                        className="inline-flex items-center gap-1 mt-2.5 text-[11px] font-bold text-blue-700 hover:text-blue-900 transition-colors"
                                                    >
                                                        View in Library <ChevronRight size={11} />
                                                    </Link>
                                                )}
                                            </div>
                                        </div>

                                        {/* Bottom progress bar for pending */}
                                        {(!book.status || book.status === 'pending') && (
                                            <div className="h-0.5 bg-gray-100">
                                                <div
                                                    className="h-full bg-amber-400 rounded-full"
                                                    style={{
                                                        width: '55%',
                                                        background: 'linear-gradient(90deg, #f59e0b, #fbbf24)',
                                                        animation: 'shimmer 2s infinite'
                                                    }}
                                                />
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </section>

                {/* ── Divider ──────────────────────────────────────────────── */}
                {publicBooks.filter(b => b.userId !== currentUser?.uid).length > 0 && (
                    <div className="flex items-center gap-4">
                        <div className="flex-1 h-px bg-gray-200" />
                        <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Community</span>
                        <div className="flex-1 h-px bg-gray-200" />
                    </div>
                )}

                {/* ── Approved community books ──────────────────────────────── */}
                {publicBooks.filter(b => b.userId !== currentUser?.uid).length > 0 && (
                    <section>
                        <div className="flex items-center justify-between mb-5">
                            <h2 className="text-lg font-black text-gray-900 flex items-center gap-2">
                                <Sparkles size={16} className="text-indigo-500" /> Recently Approved
                            </h2>
                            <Link href="/documents" className="text-xs font-bold text-indigo-600 hover:underline flex items-center gap-1">
                                Browse All <ChevronRight size={12} />
                            </Link>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-4">
                            {publicBooks
                                .filter(b => b.userId !== currentUser?.uid)
                                .map((book) => {
                                    const thumb = getThumbnail(book);
                                    return (
                                        <Link
                                            key={book.id}
                                            href={`/book/preview?id=${book.id}`}
                                            className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 overflow-hidden"
                                        >
                                            {/* Cover */}
                                            <div className="aspect-[3/4] bg-gray-100 relative overflow-hidden">
                                                {thumb ? (
                                                    <img
                                                        src={thumb}
                                                        alt={book.bookTitle}
                                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                                        onError={e => { e.target.style.display = 'none'; }}
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center">
                                                        <BookOpen size={36} className="text-gray-300 group-hover:scale-110 transition-transform" />
                                                    </div>
                                                )}
                                                <div className="absolute top-2 left-2">
                                                    <span className="text-[9px] font-black bg-emerald-500 text-white px-2 py-0.5 rounded-full uppercase tracking-wide">
                                                        Live
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Info */}
                                            <div className="p-3">
                                                <h4 className="font-black text-gray-900 text-xs line-clamp-2 leading-tight group-hover:text-blue-900 transition-colors">
                                                    {book.bookTitle}
                                                </h4>
                                                <p className="text-[10px] text-gray-400 mt-0.5 truncate">{book.author}</p>
                                                <div className="flex items-center justify-between mt-2">
                                                    <span className="text-xs font-black text-blue-950">
                                                        ₦{Number(book.price || 0).toLocaleString()}
                                                    </span>
                                                    {book.courseCode && (
                                                        <span className="text-[9px] bg-blue-50 text-blue-600 border border-blue-100 px-1.5 py-0.5 rounded-full font-bold">
                                                            {book.courseCode}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </Link>
                                    );
                                })}
                        </div>
                    </section>
                )}
            </div>

            <style jsx>{`
                @keyframes slideDown {
                    from { opacity: 0; transform: translateY(-16px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
                @keyframes shimmer {
                    0%   { opacity: 1; }
                    50%  { opacity: .5; }
                    100% { opacity: 1; }
                }
            `}</style>
        </div>
    );
}