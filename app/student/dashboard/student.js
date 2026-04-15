"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    BookOpen, ShoppingBag, Heart, User, Settings, LogOut, Store,
    Bell, Search, TrendingUp, Clock, DollarSign, Plus, Filter,
    Download, PlayCircle, CheckCircle, Globe, Award, ChevronRight,
    Upload, BarChart3, Eye, Sparkles, GraduationCap, MessageSquare,
    BookMarked, Zap, Star, Users, ArrowRight, Brain, FileText,
    Layers, ChevronDown, Mic, Video, BookCopy, Lock, Unlock,
    LayoutDashboard, LibraryBig, Flame, BarChart2, LucideShield
} from 'lucide-react';
import { auth, db } from '@/lib/firebaseConfig';
import { doc, getDoc, collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import Link from 'next/link';
import Navbar from '@/components/NavBar';
import CampusPulse from '@/components/Campus';

/* ─── helpers ─── */
const getThumbnailUrl = (book) => {
    if (book?.driveFileId) return `https://drive.google.com/thumbnail?id=${book.driveFileId}&sz=w400`;
    if (book?.embedUrl) {
        const m = book.embedUrl.match(/\/d\/(.*?)\/|\/file\/d\/(.*?)\/|id=(.*?)(&|$)/);
        if (m) { const id = m[1] || m[2] || m[3]; if (id) return `https://drive.google.com/thumbnail?id=${id}&sz=w400`; }
    }
    if (book?.pdfUrl?.includes('drive.google.com')) {
        const m = book.pdfUrl.match(/[-\w]{25,}/);
        if (m) return `https://drive.google.com/thumbnail?id=${m[0]}&sz=w400`;
    }
    return book?.image || 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400';
};

/* ─── stat card ─── */
function StatCard({ icon: Icon, label, value, color, sub }) {
    return (
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${color}`}>
                <Icon size={18} className="text-white" />
            </div>
            <p className="text-2xl font-black text-slate-800">{value}</p>
            <p className="text-xs font-semibold text-slate-500 mt-0.5">{label}</p>
            {sub && <p className="text-[10px] text-slate-400 mt-1">{sub}</p>}
        </div>
    );
}

/* ─── book card ─── */
function BookCard({ book, badge }) {
    const thumb = getThumbnailUrl(book);
    // firestoreId is the real Firestore doc ID; id may be prefixed (e.g. 'nb-xxx')
    const navId = book.firestoreId || book.bookId || book.id;
    return (
        <Link href={`/book/preview?id=${navId}`}>
            <div className="group relative bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer">
                {badge && (
                    <span className="absolute top-2 left-2 z-10 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-600 text-white">
                        {badge}
                    </span>
                )}
                <div className="aspect-[3/4] overflow-hidden bg-slate-100">
                    <img src={thumb} alt={book.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        onError={e => { e.target.src = 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400'; }} />
                </div>
                <div className="p-3">
                    <p className="text-xs font-black text-slate-800 line-clamp-2 leading-tight">{book.title}</p>
                    <p className="text-[10px] text-slate-400 mt-1 truncate">
                        {book.lecturerTitle
                            ? `${book.lecturerTitle} ${book.lecturerName || book.author || book.sellerName || ''}`
                            : (book.author || book.sellerName || book.lecturerName || 'Unknown')}
                    </p>
                    {book.price && (
                        <p className="text-xs font-black text-indigo-600 mt-1.5">₦{Number(book.price).toLocaleString()}</p>
                    )}
                </div>
            </div>
        </Link>
    );
}

/* ─── lecturer card ─── */
function LecturerCard({ lecturer }) {
    const [imgErr, setImgErr] = useState(false);
    const initial = lecturer.name?.charAt(0)?.toUpperCase() || 'L';
    const gradients = [
        'from-indigo-500 to-blue-600', 'from-violet-500 to-purple-600',
        'from-emerald-500 to-teal-600', 'from-rose-500 to-pink-600',
        'from-amber-500 to-orange-600', 'from-sky-500 to-cyan-600',
    ];
    const grad = gradients[initial.charCodeAt(0) % gradients.length];

    // Display name with title prefix e.g. "Dr. John Doe"
    const displayName = lecturer.title
        ? `${lecturer.title} ${lecturer.name}`.trim()
        : lecturer.name;

    return (
        <Link href={`/lecturers/${lecturer.id}`}>
            <div className="flex-shrink-0 w-40 bg-white rounded-2xl p-4 border border-slate-100 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer text-center group">
                {/* Avatar */}
                <div className="relative w-14 h-14 mx-auto mb-2">
                    {lecturer.photoURL && !imgErr ? (
                        <img
                            src={lecturer.photoURL}
                            alt={displayName}
                            onError={() => setImgErr(true)}
                            className="w-14 h-14 rounded-full object-cover shadow-md ring-2 ring-white group-hover:ring-indigo-200 transition-all"
                        />
                    ) : (
                        <div className={`w-14 h-14 rounded-full bg-gradient-to-br ${grad} flex items-center justify-center text-white font-black text-xl shadow-md group-hover:scale-105 transition-transform`}>
                            {initial}
                        </div>
                    )}
                    <div className="absolute bottom-0 right-0 w-4 h-4 bg-emerald-400 rounded-full border-2 border-white" />
                </div>

                {/* Title badge */}
                {lecturer.title && (
                    <span className="inline-block text-[8px] font-black uppercase tracking-wider bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full mb-1">
                        {lecturer.title}
                    </span>
                )}

                <p className="text-[11px] font-black text-slate-800 line-clamp-1 group-hover:text-indigo-600 transition-colors leading-tight">
                    {lecturer.name}
                </p>
                {lecturer.department && (
                    <p className="text-[9px] text-slate-400 mt-0.5 line-clamp-1">{lecturer.department}</p>
                )}
                {lecturer.university && (
                    <p className="text-[9px] text-slate-300 mt-0.5 line-clamp-1 italic">{lecturer.university}</p>
                )}
                <div className="mt-2 inline-flex items-center gap-1 bg-indigo-50 rounded-full px-2 py-0.5">
                    <BookCopy size={9} className="text-indigo-500" />
                    <span className="text-[9px] font-bold text-indigo-500">
                        {lecturer.bookCount > 0 ? `${lecturer.bookCount} book${lecturer.bookCount !== 1 ? 's' : ''}` : 'No books yet'}
                    </span>
                </div>
            </div>
        </Link>
    );
}

/* ─── ai chat pill ─── */
function AIChatBanner({ bookTitle, bookId }) {
    return (
        <Link href={`/ai-chat?bookId=${bookId}&bookTitle=${encodeURIComponent(bookTitle)}`}>
            <div className="flex items-center gap-3 bg-gradient-to-r from-indigo-600 to-violet-600 rounded-2xl px-4 py-3 cursor-pointer hover:opacity-95 transition-opacity shadow-lg shadow-indigo-200">
                <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                    <Sparkles size={14} className="text-white" />
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-black text-white/70 uppercase tracking-wider">AI Tutor</p>
                    <p className="text-xs font-bold text-white truncate">Ask about "{bookTitle}"</p>
                </div>
                <ArrowRight size={14} className="text-white/70 shrink-0" />
            </div>
        </Link>
    );
}

export default function StudentDashboardClient() {
    const router = useRouter();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('home');
    const [library, setLibrary] = useState([]);
    const [wishlist, setWishlist] = useState([]);
    const [sellerStats, setSellerStats] = useState(null);
    const [trending, setTrending] = useState([]);
    const [lecturerBooks, setLecturerBooks] = useState([]);
    const [lecturers, setLecturers] = useState([]);
    const [latestBooks, setLatestBooks] = useState([]);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [aiSessions, setAiSessions] = useState([]);

    useEffect(() => {
        const unsub = onAuthStateChanged(auth, async (u) => {
            if (u) await fetchAll(u.uid);
            else router.push('/auth/signin');
        });
        return () => unsub();
    }, [router]);

    const fetchAll = async (uid) => {
        try {
            setLoading(true);
            const userDoc = await getDoc(doc(db, 'users', uid));
            if (!userDoc.exists()) return;
            const userData = userDoc.data();
            setUser({ uid, ...userData });

            if (userData.purchasedBooks) {
                setLibrary(Object.values(userData.purchasedBooks).map(b => ({ ...b, thumbnail: getThumbnailUrl(b) })));
            }
            if (userData.savedBooks) {
                setWishlist(userData.savedBooks.map(b => ({ ...b, thumbnail: getThumbnailUrl(b) })));
            }
            if (userData.isSeller) {
                const sd = await getDoc(doc(db, 'sellers', uid));
                if (sd.exists()) setSellerStats(sd.data());
            }

            // Fetch AI sessions
            try {
                const sq = query(collection(db, 'ai_chat_sessions'), where('userId', '==', uid));
                const ss = await getDocs(sq);
                const sessions = ss.docs.map(d => ({ id: d.id, ...d.data() }))
                    .sort((a, b) => (b.updatedAt?.toDate?.()?.getTime() || 0) - (a.updatedAt?.toDate?.()?.getTime() || 0))
                    .slice(0, 6);
                setAiSessions(sessions);
            } catch { }

            // ── Fetch lecturers & their books ──────────────────────────────────
            // From BecomeSellerClient we know lecturers are stored in the 'sellers'
            // collection with title = "Lecturer" | "Dr." | "Prof." | "Professor"
            // Fields: sellerName, title, businessInfo.businessName, businessInfo.businessDescription
            // Their books are in 'advertMyBook' with sellerId = sellers doc ID
            try {
                const ACADEMIC_TITLES = ['Lecturer', 'Dr.', 'Prof.', 'Professor'];
                const seenLecturerIds = new Set();
                const rawLecturers = [];

                // Query sellers collection for each academic title value
                for (const title of ACADEMIC_TITLES) {
                    try {
                        const snap = await getDocs(
                            query(collection(db, 'sellers'), where('title', '==', title))
                        );
                        snap.docs.forEach(d => {
                            if (!seenLecturerIds.has(d.id)) {
                                seenLecturerIds.add(d.id);
                                const data = d.data();
                                rawLecturers.push({
                                    id: d.id,
                                    // sellerName is stored at top level in sellers doc
                                    name: data.sellerName ||
                                        data.businessInfo?.businessName ||
                                        'Lecturer',
                                    title: data.title || '',
                                    department: data.department || data.faculty || '',
                                    photoURL: data.photoURL || data.avatar || null,
                                    university: data.university || data.institution || '',
                                    description: data.businessInfo?.businessDescription || '',
                                    bookCount: 0,
                                });
                            }
                        });
                    } catch { /* title value not indexed — skip silently */ }
                }

                console.log(`🎓 Found ${rawLecturers.length} lecturers in sellers collection`);

                // Attach real book count per lecturer from advertMyBook
                const lecturersWithCounts = await Promise.all(
                    rawLecturers.map(async (lec) => {
                        try {
                            const bsnap = await getDocs(query(
                                collection(db, 'advertMyBook'),
                                where('sellerId', '==', lec.id),
                                where('status', '==', 'approved')
                            ));
                            return { ...lec, bookCount: bsnap.size };
                        } catch {
                            return lec;
                        }
                    })
                );

                // Sort: most books first
                lecturersWithCounts.sort((a, b) => b.bookCount - a.bookCount);
                setLecturers(lecturersWithCounts);
                console.log(`✅ Loaded ${lecturersWithCounts.length} lecturers`);

                // ── Now fetch their books from advertMyBook ──────────────────
                if (seenLecturerIds.size > 0) {
                    const idArr = [...seenLecturerIds];
                    let lecBooks = [];

                    // Batch into groups of 30 (Firestore 'in' limit)
                    for (let i = 0; i < idArr.length; i += 30) {
                        const batch = idArr.slice(i, i + 30);
                        try {
                            const snap = await getDocs(query(
                                collection(db, 'advertMyBook'),
                                where('status', '==', 'approved'),
                                where('sellerId', 'in', batch)
                            ));
                            snap.docs.forEach(d => {
                                lecBooks.push({
                                    ...d.data(),
                                    id: `lb-${d.id}`,
                                    firestoreId: d.id,
                                    thumbnail: getThumbnailUrl(d.data()),
                                    // Attach lecturer name to show on card
                                    lecturerName: lecturersWithCounts.find(l => l.id === d.data().sellerId)?.name || d.data().sellerName || '',
                                    lecturerTitle: lecturersWithCounts.find(l => l.id === d.data().sellerId)?.title || '',
                                });
                            });
                        } catch { }
                    }

                    // Deduplicate & sort newest first
                    const seenBookIds = new Set();
                    const dedupedBooks = lecBooks
                        .filter(b => {
                            if (seenBookIds.has(b.firestoreId)) return false;
                            seenBookIds.add(b.firestoreId);
                            return true;
                        })
                        .sort((a, b) =>
                            (b.createdAt?.toDate?.()?.getTime() || 0) -
                            (a.createdAt?.toDate?.()?.getTime() || 0)
                        )
                        .slice(0, 10);

                    setLecturerBooks(dedupedBooks);
                    console.log(`✅ Loaded ${dedupedBooks.length} lecturer books`);
                }
            } catch (e) {
                console.warn('Lecturers/books fetch error:', e.message);
            }

            // Fetch latest books overall — deduplicate by firestoreId
            try {
                const bq = query(collection(db, 'advertMyBook'), where('status', '==', 'approved'));
                const bs = await getDocs(bq);
                const seenIds = new Set();
                const all = bs.docs
                    .map(d => ({
                        ...d.data(),
                        id: `nb-${d.id}`,
                        firestoreId: d.id,
                        thumbnail: getThumbnailUrl(d.data()),
                    }))
                    .filter(b => {
                        if (seenIds.has(b.firestoreId)) return false;
                        seenIds.add(b.firestoreId);
                        return true;
                    })
                    .sort((a, b) =>
                        (b.createdAt?.toDate?.()?.getTime() || 0) -
                        (a.createdAt?.toDate?.()?.getTime() || 0)
                    )
                    .slice(0, 10);
                setLatestBooks(all);
            } catch { }

            setTrending([
                { id: 1, title: 'Advanced Calculus Notes', downloads: 245, price: 2500, category: 'Mathematics' },
                { id: 2, title: 'Organic Chemistry Lab Manual', downloads: 189, price: 3000, category: 'Chemistry' },
                { id: 3, title: 'CS Algorithms & Data Structures', downloads: 156, price: 2800, category: 'CS' },
                { id: 4, title: 'Anatomy & Physiology Vol. II', downloads: 134, price: 3200, category: 'Medicine' },
            ]);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return (
        <div className="min-h-screen bg-[#f4f6fb] flex items-center justify-center">
            <div className="text-center">
                <div className="w-14 h-14 rounded-2xl bg-indigo-600 flex items-center justify-center mx-auto mb-4 animate-pulse">
                    <BookOpen size={26} className="text-white" />
                </div>
                <p className="text-slate-500 text-sm font-semibold">Loading your dashboard…</p>
            </div>
        </div>
    );

    /* ════════════════ HOME TAB ════════════════ */
    const renderHome = () => (
        <div className="space-y-8">

            {/* ── Hero ── */}
            <div className="relative overflow-hidden rounded-3xl bg-[#0f1b4c] text-white p-7 shadow-2xl">
                <div className="absolute inset-0 opacity-10"
                    style={{ backgroundImage: 'radial-gradient(circle at 70% 50%, #6366f1 0%, transparent 60%), radial-gradient(circle at 20% 80%, #3b82f6 0%, transparent 50%)' }} />
                <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                    <div>
                        <span className="inline-flex items-center gap-1.5 bg-white/10 backdrop-blur-sm border border-white/20 text-blue-200 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-4">
                            <GraduationCap size={11} /> {user?.university || 'LAN Library'}
                        </span>
                        <h2 className="text-3xl md:text-4xl font-black leading-tight">
                            Welcome back,<br />
                            <span className="text-blue-300">{user?.firstName || 'Scholar'} ✦</span>
                        </h2>
                        <p className="text-blue-200/70 text-sm mt-2 max-w-sm">
                            {library.length} books in your library · {aiSessions.length} AI conversations
                        </p>
                        <Link href="/ai-chat">
                            <button className="mt-5 flex items-center gap-2 bg-indigo-500 hover:bg-indigo-400 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-colors shadow-lg shadow-indigo-500/30">
                                <Sparkles size={15} /> Chat with AI Tutor
                            </button>
                        </Link>
                    </div>
                    <div className="grid grid-cols-2 gap-3 shrink-0">
                        {[
                            { icon: BookOpen, label: 'Books', val: library.length, bg: 'bg-blue-500/20' },
                            { icon: Sparkles, label: 'AI Chats', val: aiSessions.length, bg: 'bg-violet-500/20' },
                            { icon: Heart, label: 'Saved', val: wishlist.length, bg: 'bg-pink-500/20' },
                            { icon: Flame, label: 'Day Streak', val: '5 🔥', bg: 'bg-orange-500/20' },
                        ].map(({ icon: Icon, label, val, bg }) => (
                            <div key={label} className={`${bg} backdrop-blur-sm rounded-2xl p-3 text-center border border-white/10`}>
                                <Icon size={16} className="text-white/80 mx-auto mb-1" />
                                <p className="text-lg font-black text-white">{val}</p>
                                <p className="text-[9px] text-white/50 font-bold uppercase">{label}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── AI Tutor Sessions ── */}
            {aiSessions.length > 0 && (
                <section>
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-base font-black text-slate-800 flex items-center gap-2">
                            <Sparkles size={16} className="text-indigo-500" /> Recent AI Conversations
                        </h3>
                        <Link href="/ai-chat" className="text-[11px] font-bold text-indigo-600 hover:underline flex items-center gap-1">
                            View All <ArrowRight size={11} />
                        </Link>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {aiSessions.map(s => (
                            <Link key={s.id} href={`/ai-chat?sessionId=${s.id}&bookId=${s.bookId}&bookTitle=${encodeURIComponent(s.bookTitle || '')}`}>
                                <div className="group bg-white rounded-2xl p-4 border border-slate-100 shadow-sm hover:border-indigo-200 hover:shadow-md transition-all cursor-pointer">
                                    <div className="flex items-start gap-3">
                                        <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0">
                                            <MessageSquare size={14} className="text-indigo-500" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[12px] font-black text-slate-800 line-clamp-1 group-hover:text-indigo-600 transition-colors">
                                                {s.title || 'New conversation'}
                                            </p>
                                            <p className="text-[10px] text-indigo-500 font-semibold mt-0.5 line-clamp-1">{s.bookTitle || ''}</p>
                                            <p className="text-[9px] text-slate-400 mt-1">
                                                {s.messages?.length || 0} messages · {s.updatedAt?.toDate?.()?.toLocaleDateString?.() || ''}
                                            </p>
                                        </div>
                                        <ChevronRight size={13} className="text-slate-300 group-hover:text-indigo-400 shrink-0 mt-1" />
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                    {/* AI prompt for library books */}
                    {library.length > 0 && (
                        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {library.slice(0, 2).map((b, idx) => (
                                <AIChatBanner
                                    key={b.bookId || b.id || `ai-home-${idx}`}
                                    bookTitle={b.title}
                                    bookId={b.bookId || b.firestoreId || b.id}
                                />
                            ))}
                        </div>
                    )}
                </section>
            )}

            {/* ── Continue Reading ── */}
            {library.length > 0 && (
                <section>
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-base font-black text-slate-800 flex items-center gap-2">
                            <Clock size={16} className="text-blue-500" /> Jump Back In
                        </h3>
                        <button onClick={() => setActiveTab('library')} className="text-[11px] font-bold text-indigo-600 hover:underline flex items-center gap-1">
                            My Library <ArrowRight size={11} />
                        </button>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                        {library.slice(0, 5).map(b => <BookCard key={b.bookId || b.id} book={b} />)}
                    </div>
                </section>
            )}

            {/* ── Lecturer Spotlight ── */}
            <section>
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-base font-black text-slate-800 flex items-center gap-2">
                        <GraduationCap size={16} className="text-emerald-600" /> Our Lecturers
                        {lecturers.length > 0 && (
                            <span className="text-[10px] font-bold bg-emerald-100 text-emerald-600 px-2 py-0.5 rounded-full">
                                {lecturers.length} on LAN
                            </span>
                        )}
                    </h3>
                    <Link href="/lecturers" className="text-[11px] font-bold text-indigo-600 hover:underline flex items-center gap-1">
                        View All <ArrowRight size={11} />
                    </Link>
                </div>
                {lecturers.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-8 text-center">
                        <GraduationCap size={32} className="text-slate-200 mx-auto mb-2" />
                        <p className="text-sm font-bold text-slate-400">No lecturers found yet</p>
                        <p className="text-[11px] text-slate-300 mt-1">Lecturers who join LAN Library will appear here</p>
                    </div>
                ) : (
                    <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
                        {lecturers.map(l => <LecturerCard key={l.id} lecturer={l} />)}
                    </div>
                )}
            </section>

            {/* ── Latest from Lecturers ── */}
            <section>
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-base font-black text-slate-800 flex items-center gap-2">
                        <BookMarked size={16} className="text-indigo-600" /> New from Lecturers
                    </h3>
                    <Link href="/documents?filter=lecturer" className="text-[11px] font-bold text-indigo-600 hover:underline flex items-center gap-1">
                        Browse All <ArrowRight size={11} />
                    </Link>
                </div>
                {lecturerBooks.length === 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                        {[
                            { id: 'l1', title: 'Engineering Mathematics IV', author: 'Dr. Adeyemi', price: 2500, image: 'https://images.unsplash.com/photo-1509228468518-180dd4864904?w=400' },
                            { id: 'l2', title: 'Organic Chemistry Practicals', author: 'Prof. Okafor', price: 3000, image: 'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=400' },
                            { id: 'l3', title: 'Data Structures & Algorithms', author: 'Dr. Balogun', price: 2800, image: 'https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?w=400' },
                            { id: 'l4', title: 'Human Anatomy Vol. II', author: 'Dr. Eze', price: 3200, image: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=400' },
                            { id: 'l5', title: 'Quantum Physics Notes', author: 'Prof. Suleiman', price: 2600, image: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=400' },
                        ].map(b => <BookCard key={b.id} book={b} badge="Lecturer" />)}
                    </div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                        {lecturerBooks.slice(0, 5).map(b => <BookCard key={b.id} book={b} badge="Lecturer" />)}
                    </div>
                )}
            </section>

            {/* ── Latest Uploads ── */}
            <section>
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-base font-black text-slate-800 flex items-center gap-2">
                        <Zap size={16} className="text-yellow-500" /> Just Added
                    </h3>
                    <Link href="/documents" className="text-[11px] font-bold text-indigo-600 hover:underline flex items-center gap-1">
                        All Books <ArrowRight size={11} />
                    </Link>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {(latestBooks.length > 0 ? latestBooks : [
                        { id: 'n1', title: 'Advanced Accounting Principles', author: 'Sarah A.', price: 1800, image: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=400' },
                        { id: 'n2', title: 'Nigerian Constitutional Law', author: 'David O.', price: 2200, image: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=400' },
                        { id: 'n3', title: 'Microbiology Practical Guide', author: 'Emeka W.', price: 2000, image: 'https://images.unsplash.com/photo-1576086213369-97a306d36557?w=400' },
                        { id: 'n4', title: 'Financial Mathematics', author: 'Amaka I.', price: 1600, image: 'https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=400' },
                        { id: 'n5', title: 'Civil Engineering Drawing', author: 'Tunde B.', price: 2400, image: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=400' },
                    ]).slice(0, 5).map(b => <BookCard key={b.id} book={b} />)}
                </div>
            </section>

            {/* ── Learning Tools ── */}
            <section>
                <h3 className="text-base font-black text-slate-800 mb-4 flex items-center gap-2">
                    <Brain size={16} className="text-pink-500" /> Learning Tools
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                        { icon: Sparkles, label: 'AI Book Chat', desc: 'Ask anything about your books', href: '/ai-chat', bg: 'from-indigo-600 to-violet-600', text: 'text-white' },
                        { icon: FileText, label: 'Study Notes', desc: 'Summarise & save notes', href: '/ai-chat', bg: 'from-blue-50 to-indigo-50', text: 'text-slate-800', border: 'border border-indigo-100' },
                        { icon: BookCopy, label: 'Past Questions', desc: 'Exam prep resources', href: '/documents', bg: 'from-emerald-50 to-teal-50', text: 'text-slate-800', border: 'border border-emerald-100' },
                        { icon: Users, label: 'Study Groups', desc: 'Collaborate with peers', href: '/documents', bg: 'from-orange-50 to-amber-50', text: 'text-slate-800', border: 'border border-orange-100' },
                    ].map(({ icon: Icon, label, desc, href, bg, text, border }) => (
                        <Link href={href} key={label}>
                            <div className={`bg-gradient-to-br ${bg} ${border || ''} rounded-2xl p-4 hover:shadow-md transition-all cursor-pointer h-full`}>
                                <Icon size={20} className={label === 'AI Book Chat' ? 'text-white mb-2' : 'text-indigo-500 mb-2'} />
                                <p className={`text-xs font-black ${text}`}>{label}</p>
                                <p className={`text-[10px] mt-0.5 ${label === 'AI Book Chat' ? 'text-white/70' : 'text-slate-400'}`}>{desc}</p>
                            </div>
                        </Link>
                    ))}
                </div>
            </section>

          <CampusPulse />

            {/* ── Seller/Author Card ── */}
            {user?.isSeller ? (
                    <div className="bg-[#0d2b1e] rounded-3xl p-6 text-white shadow-xl flex flex-col justify-between">
                        <div>
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-2.5 bg-emerald-500/20 rounded-xl">
                                    <DollarSign size={20} className="text-emerald-400" />
                                </div>
                                <span className="text-[9px] font-black bg-emerald-500 text-white px-2 py-0.5 rounded-md uppercase tracking-wider">Author</span>
                            </div>
                            <p className="text-emerald-300/60 text-xs font-semibold">Available Balance</p>
                            <h3 className="text-4xl font-black mt-0.5">₦{sellerStats?.accountBalance?.toLocaleString() || '0'}</h3>
                            <p className="text-emerald-400/50 text-[10px] mt-1">{sellerStats?.totalSales || 0} total sales</p>
                        </div>
                        <div className="mt-6 grid grid-cols-2 gap-3">
                            <Link href="/advertise">
                                <button className="w-full bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-black py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors">
                                    <Plus size={14} /> Upload
                                </button>
                            </Link>
                            <Link href="/my-account/seller-account">
                                <button className="w-full bg-white/10 hover:bg-white/20 text-white font-black py-2.5 rounded-xl text-xs transition-colors">
                                    Studio
                                </button>
                            </Link>
                        </div>
                    </div>
                ) : (
                    <div className="bg-gradient-to-br from-indigo-700 to-violet-800 rounded-3xl p-6 text-white shadow-xl flex flex-col justify-between">
                        <div>
                            <div className="p-2.5 bg-white/10 rounded-xl w-fit mb-4">
                                <Store size={20} className="text-white" />
                            </div>
                            <h3 className="text-xl font-black leading-tight">Turn Notes<br />into Cash 💸</h3>
                            <p className="text-indigo-200 text-xs mt-2 leading-relaxed">
                                Your study guides could earn thousands. Join 500+ student authors on LAN Library.
                            </p>
                        </div>
                        <Link href="/become-seller" className="mt-5">
                            <button className="w-full bg-white text-indigo-700 font-black py-3 rounded-2xl shadow-lg hover:bg-indigo-50 transition-colors text-sm">
                                Start Selling Now →
                            </button>
                        </Link>
                    </div>
                )}

            {/* ── Top Contributors ── */}
            <section className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
                <h3 className="text-sm font-black text-slate-800 flex items-center gap-2 mb-5">
                    <Award size={15} className="text-yellow-500" /> Top Contributors
                </h3>
                <div className="space-y-3">
                    {[
                        { name: 'Sarah A.', school: 'UNILAG', uploads: 42, earnings: '₦128k' },
                        { name: 'David O.', school: 'UNILAG', uploads: 38, earnings: '₦96k' },
                        { name: 'Emeka W.', school: 'UNILAG', uploads: 29, earnings: '₦74k' },
                    ].map((c, i) => (
                        <div key={i} className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs ${i === 0 ? 'bg-yellow-100 text-yellow-700' : i === 1 ? 'bg-slate-100 text-slate-600' : 'bg-orange-100 text-orange-600'}`}>
                                {i + 1}
                            </div>
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-blue-500 flex items-center justify-center text-white font-black text-xs">
                                {c.name.charAt(0)}
                            </div>
                            <div className="flex-1">
                                <p className="text-xs font-black text-slate-800">{c.name}</p>
                                <p className="text-[10px] text-slate-400">{c.uploads} docs · {c.school}</p>
                            </div>
                            <span className="text-xs font-black text-emerald-600">{c.earnings}</span>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );

    /* ════════════════ LIBRARY TAB ════════════════ */
    const renderLibrary = () => (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-black text-slate-800">My Library</h2>
                <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2 shadow-sm">
                    <Filter size={14} className="text-slate-400" />
                    <span className="text-xs font-semibold text-slate-500">Filter</span>
                </div>
            </div>
            {library.length === 0 ? (
                <div className="bg-white rounded-3xl p-14 text-center border border-slate-100 shadow-sm">
                    <BookOpen size={48} className="mx-auto text-slate-200 mb-4" />
                    <h3 className="text-lg font-black text-slate-800 mb-1">Your Library is Empty</h3>
                    <p className="text-slate-500 text-sm mb-6">Start building your collection</p>
                    <Link href="/documents">
                        <button className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-indigo-500 transition-colors">
                            Browse Documents
                        </button>
                    </Link>
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                        {library.map((b, idx) => {
                            const stableKey = b.bookId || b.id || `lib-${idx}`;
                            const chatId = b.bookId || b.firestoreId || b.id;
                            return (
                                <div key={stableKey} className="flex flex-col gap-2">
                                    <BookCard book={b} />
                                    <AIChatBanner bookTitle={b.title} bookId={chatId} />
                                </div>
                            );
                        })}
                    </div>
                </>
            )}
        </div>
    );

    /* ════════════════ AI TAB ════════════════ */
    const renderAI = () => (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
                    <Sparkles size={18} className="text-indigo-500" /> AI Tutor
                </h2>
                <Link href="/ai-chat">
                    <button className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-indigo-500 transition-colors">
                        <Plus size={13} /> New Chat
                    </button>
                </Link>
            </div>

            {/* Quick start */}
            <div className="bg-gradient-to-br from-indigo-600 to-violet-700 rounded-3xl p-6 text-white">
                <Sparkles size={24} className="mb-3 text-white/80" />
                <h3 className="text-lg font-black mb-1">Ask anything about your books</h3>
                <p className="text-indigo-200 text-xs mb-4">Summaries, key concepts, exam tips, explanations — powered by AI.</p>
                <Link href="/ai-chat">
                    <button className="bg-white text-indigo-700 font-black px-5 py-2.5 rounded-xl text-sm hover:bg-indigo-50 transition-colors shadow-lg">
                        Start AI Chat →
                    </button>
                </Link>
            </div>

            {/* Chat sessions grouped by book */}
            {aiSessions.length > 0 && (
                <div className="space-y-3">
                    <h3 className="text-sm font-black text-slate-700">Recent Conversations</h3>
                    {aiSessions.map(s => (
                        <Link key={s.id} href={`/ai-chat?sessionId=${s.id}&bookId=${s.bookId}&bookTitle=${encodeURIComponent(s.bookTitle || '')}`}>
                            <div className="group bg-white rounded-2xl p-4 border border-slate-100 shadow-sm hover:border-indigo-200 hover:shadow-md transition-all cursor-pointer flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0">
                                    <BookMarked size={16} className="text-indigo-500" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-black text-slate-800 line-clamp-1 group-hover:text-indigo-600 transition-colors">{s.title || 'Conversation'}</p>
                                    <p className="text-[10px] text-indigo-500 font-semibold mt-0.5">{s.bookTitle}</p>
                                    <p className="text-[9px] text-slate-400 mt-0.5">{s.messages?.length || 0} messages · {s.updatedAt?.toDate?.()?.toLocaleDateString?.() || ''}</p>
                                </div>
                                <ChevronRight size={14} className="text-slate-300 group-hover:text-indigo-400 shrink-0" />
                            </div>
                        </Link>
                    ))}
                </div>
            )}

            {/* Library books with AI prompt */}
            {library.length > 0 && (
                <div className="space-y-3">
                    <h3 className="text-sm font-black text-slate-700">Chat About Your Books</h3>
                    <div className="space-y-2">
                        {library.map(b => <AIChatBanner key={b.bookId || b.id} bookTitle={b.title} bookId={b.bookId || b.id} />)}
                    </div>
                </div>
            )}
        </div>
    );

    /* ════════════════ WISHLIST TAB ════════════════ */
    const renderWishlist = () => (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-black text-slate-800">Saved Books</h2>
                <p className="text-xs font-semibold text-slate-400">{wishlist.length} items</p>
            </div>
            {wishlist.length === 0 ? (
                <div className="bg-white rounded-3xl p-14 text-center border border-slate-100 shadow-sm">
                    <Heart size={48} className="mx-auto text-slate-200 mb-4" />
                    <h3 className="text-lg font-black text-slate-800 mb-1">Nothing Saved Yet</h3>
                    <p className="text-slate-500 text-sm mb-6">Browse and save books for later</p>
                    <Link href="/documents">
                        <button className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-indigo-500 transition-colors">Browse Documents</button>
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {wishlist.map(item => (
                        <div key={item.id} className="bg-white rounded-2xl shadow-sm p-4 flex gap-4 border border-slate-100 hover:border-indigo-100 hover:shadow-md transition-all">
                            <div className="w-20 h-28 bg-slate-100 rounded-xl flex-shrink-0 overflow-hidden">
                                <img src={item.thumbnail || item.image} alt={item.title} className="w-full h-full object-cover"
                                    onError={e => { e.target.src = 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400'; }} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h4 className="font-black text-slate-800 text-sm line-clamp-2 leading-tight">{item.title}</h4>
                                <p className="text-xs text-slate-400 mt-1">{item.author}</p>
                                <p className="text-base font-black text-indigo-600 mt-2">₦{item.price?.toLocaleString()}</p>
                                <div className="flex gap-2 mt-3">
                                    <Link href={`/payment?bookId=${item.id}`} className="flex-1">
                                        <button className="w-full bg-indigo-600 text-white px-3 py-2 rounded-xl text-xs font-bold hover:bg-indigo-500 transition-colors">Buy Now</button>
                                    </Link>
                                    <button className="px-3 py-2 border-2 border-slate-100 rounded-xl hover:bg-red-50 hover:border-red-100 transition-colors">
                                        <Heart size={14} className="text-red-400" fill="currentColor" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );

    const NAV = [
        { id: 'home', icon: LayoutDashboard, label: 'Home' },
        { id: 'library', icon: LibraryBig, label: 'Library' },
        { id: 'ai', icon: Sparkles, label: 'AI Tutor' },
        { id: 'wishlist', icon: Heart, label: 'Saved' },
    ];

    return (
        <div className="min-h-screen bg-[#f4f6fb]" style={{ fontFamily: "'DM Sans', 'Nunito', system-ui, sans-serif" }}>
            <Navbar />

            <div className="flex max-w-7xl mx-auto">
                {/* ── Desktop Sidebar ── */}
                <aside className="hidden lg:flex flex-col w-60 bg-white border-r border-slate-100 min-h-[calc(100vh-64px)] sticky top-16 p-4 gap-1">
                    {NAV.map(({ id, icon: Icon, label }) => (
                        <button key={id} onClick={() => setActiveTab(id)}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-sm transition-all ${activeTab === id ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200' : 'text-slate-500 hover:bg-slate-50'}`}>
                            <Icon size={16} /> {label}
                        </button>
                    ))}
                    <div className="mt-2 pt-2 border-t border-slate-100 space-y-1">
                        <Link href="/documents">
                            <button className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-500 hover:bg-slate-50 text-sm font-semibold w-full">
                                <Search size={16} /> Browse All
                            </button>
                        </Link>
                        <Link href="/my-account/seller-account">
                            <button className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-500 hover:bg-slate-50 text-sm font-semibold w-full">
                                <User size={16} /> Profile
                            </button>
                        </Link>
                        {user?.isSeller ? (
                            <Link href="/my-account/seller-account">
                                <button className="flex items-center gap-3 px-4 py-3 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-sm font-bold w-full">
                                    <BarChart3 size={16} /> Author Studio
                                </button>
                            </Link>
                        ) : (
                            <Link href="/become-seller">
                                <button className="flex items-center gap-3 px-4 py-3 rounded-xl bg-indigo-50 text-indigo-700 hover:bg-indigo-100 text-sm font-bold w-full">
                                    <Store size={16} /> Become a Seller
                                </button>
                            </Link>
                        )}
                    </div>
                    <button onClick={() => { auth.signOut(); router.push('/auth/signin'); }}
                        className="mt-auto flex items-center gap-3 px-4 py-3 rounded-xl text-red-500 hover:bg-red-50 text-sm font-semibold">
                        <LogOut size={16} /> Logout
                    </button>
                </aside>

                {/* ── Main ── */}
                <main className="flex-1 p-4 md:p-6 pb-28 lg:pb-8 min-w-0">
                    {activeTab === 'home' && renderHome()}
                    {activeTab === 'library' && renderLibrary()}
                    {activeTab === 'ai' && renderAI()}
                    {activeTab === 'wishlist' && renderWishlist()}
                </main>
            </div>

            {/* ── Mobile Bottom Nav ── */}
            <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-[#0f1b4c] z-50 px-2 pb-safe">
                <div className="flex justify-around items-end py-3">
                    {NAV.map(({ id, icon: Icon, label }) => (
                        <button key={id} onClick={() => setActiveTab(id)}
                            className={`flex flex-col items-center gap-1 transition-all duration-300 px-3 ${activeTab === id ? 'text-white scale-110' : 'text-blue-300/40'}`}>
                            <Icon size={22} />
                            <span className="text-[9px] font-black uppercase tracking-wider">{label}</span>
                            {activeTab === id && <div className="w-1 h-1 bg-indigo-400 rounded-full animate-pulse" />}
                        </button>
                    ))}
                    <Link href="/advertise" className="-translate-y-4">
                        <div className="bg-indigo-500 p-3.5 rounded-2xl shadow-lg shadow-indigo-500/40 border-4 border-[#0f1b4c] active:scale-90 transition-transform">
                            <Plus size={22} className="text-white" strokeWidth={3} />
                        </div>
                    </Link>
                    <Link href="/my-account/seller-account">
                        <button className="flex flex-col items-center gap-1 text-blue-300/40 hover:text-white transition-colors px-3">
                            <User size={22} />
                            <span className="text-[9px] font-black uppercase tracking-wider">Profile</span>
                        </button>
                    </Link>
                </div>
            </div>
        </div>
    );
}