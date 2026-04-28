"use client";

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
    BookOpen, ShoppingBag, Heart, User, Settings, LogOut, Store,
    Bell, Search, TrendingUp, Clock, DollarSign, Plus, Filter,
    Download, CheckCircle, Globe, Award, ChevronRight,
    Upload, Eye, Sparkles, GraduationCap, MessageSquare,
    BookMarked, Zap, Star, Users, ArrowRight, Brain, FileText,
    Layers, BookCopy, Lock, LayoutDashboard, LibraryBig,
    Flame, BarChart2, UserPlus, UserCheck, ChevronDown,
    Activity, Wifi, Circle,
} from 'lucide-react';
import { auth, db } from '@/lib/firebaseConfig';
import {
    doc, getDoc, collection, query, where, getDocs,
    orderBy, limit, updateDoc, serverTimestamp,
} from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import Link from 'next/link';
import Navbar from '@/components/NavBar';
import NotificationBell from '@/components/NotificationBell';

/* ─── colour tokens (identical to home / seller pages) ─── */
const NAVY  = "#0d2244";
const GOLD  = "#b8963e";
const GOLDD = "#d4aa5a";
const CREAM = "#f5f0e8";
const BG    = "#f5f1ea";

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
    return book?.image || null;
};

const avatarPalettes = [
    { bg: NAVY, text: GOLDD },
    { bg: "#1a3a5c", text: CREAM },
    { bg: "#2c1810", text: GOLDD },
    { bg: "#1a2c1a", text: "#a8d5a2" },
    { bg: "#2c1a2c", text: GOLDD },
    { bg: "#0a2233", text: "#7eccd4" },
];
const getPalette = (name = "?") => avatarPalettes[name.charCodeAt(0) % avatarPalettes.length];
const getInitials = (name = "?") => {
    const p = name.trim().split(' ').filter(Boolean);
    if (!p.length) return '?';
    if (p.length === 1) return p[0][0].toUpperCase();
    return (p[0][0] + p[p.length - 1][0]).toUpperCase();
};
const formatTime = (ts) => {
    if (!ts) return '';
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    const diff = Date.now() - d;
    const m = Math.floor(diff / 60000);
    if (m < 1) return 'Just now';
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(diff / 3600000);
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(diff / 86400000)}d ago`;
};

/* ════════════════════════════════════════════════════════════
   SUB-COMPONENTS
════════════════════════════════════════════════════════════ */

/* Book cover card — navy/gold aesthetic */
function BookCard({ book, badge, owned }) {
    const thumb = getThumbnailUrl(book);
    const navId = book.firestoreId || book.bookId || String(book.id || '').replace('firestore-', '').replace('nb-', '').replace('lb-', '');
    if (!navId) return null;
    return (
        <Link href={`/book/preview?id=${navId}`} style={{ textDecoration: 'none', display: 'block' }}>
            <div className="book-thumb-card">
                <div style={{ position: 'relative', background: '#ede8df' }}>
                    {thumb ? (
                        <img src={thumb} alt={book.title || book.bookTitle || ''}
                            style={{ width: '100%', aspectRatio: '3/4', objectFit: 'cover', display: 'block' }}
                            onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }} />
                    ) : null}
                    <div style={{ display: thumb ? 'none' : 'flex', width: '100%', aspectRatio: '3/4', alignItems: 'center', justifyContent: 'center', background: '#ede8df', flexDirection: 'column', gap: '6px' }}>
                        <BookOpen size={28} style={{ color: '#ccc' }} />
                        <span style={{ fontSize: '10px', color: '#bbb', fontFamily: "'Lato',sans-serif", textAlign: 'center', padding: '0 8px' }}>
                            {(book.title || book.bookTitle || '').slice(0, 30)}
                        </span>
                    </div>
                    {/* PDF badge */}
                    <div style={{ position: 'absolute', top: '7px', left: '7px', background: NAVY, color: '#fff', fontSize: '8px', fontWeight: 700, padding: '2px 7px', fontFamily: "'Lato',sans-serif", letterSpacing: '0.06em', display: 'flex', alignItems: 'center', gap: '3px' }}>
                        <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#22c55e', display: 'inline-block' }} />PDF
                    </div>
                    {badge && (
                        <div style={{ position: 'absolute', bottom: '7px', left: '7px', background: GOLD, color: NAVY, fontSize: '8px', fontWeight: 700, padding: '2px 7px', fontFamily: "'Lato',sans-serif", letterSpacing: '0.06em' }}>{badge}</div>
                    )}
                    {owned && (
                        <div style={{ position: 'absolute', top: '7px', right: '7px', background: '#16a34a', color: '#fff', fontSize: '8px', fontWeight: 700, padding: '2px 7px', fontFamily: "'Lato',sans-serif" }}>OWNED</div>
                    )}
                </div>
                <div style={{ padding: '10px 10px 12px', borderTop: '0.5px solid #f0ebe0' }}>
                    <p style={{ fontFamily: "'Playfair Display',serif", fontSize: '12px', fontWeight: 700, color: NAVY, margin: '0 0 3px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: 1.35 }}>
                        {book.title || book.bookTitle || 'Untitled'}
                    </p>
                    <p style={{ fontSize: '10px', color: '#888', margin: '0 0 6px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: "'Lato',sans-serif" }}>
                        {book.lecturerTitle ? `${book.lecturerTitle} ` : ''}{book.author || book.sellerName || book.lecturerName || ''}
                    </p>
                    {book.price && !owned && (
                        <p style={{ fontSize: '11px', fontWeight: 700, color: NAVY, fontFamily: "'Lato',sans-serif" }}>₦{Number(book.price).toLocaleString()}</p>
                    )}
                </div>
            </div>
        </Link>
    );
}

/* Lecturer card — exactly matching the /lecturers page style */
function LecturerCard({ lecturer }) {
    const palette = getPalette(lecturer.sellerName || lecturer.name || '?');
    const initials = getInitials(lecturer.sellerName || lecturer.name || '?');
    const name = lecturer.sellerName || lecturer.name || 'Lecturer';
    const titleDisplay = lecturer.title?.toLowerCase().includes('lecturer') ? 'Lecturer' : lecturer.title;
    const profileHref = `/seller-profile?sellerId=${lecturer.sellerId || lecturer.id}`;
    const displayName = lecturer.title ? `${lecturer.title} ${name}` : name;
    const photo = lecturer.photo || lecturer.photoURL || null;

    return (
        <div className="lec-card">
            {/* Photo / avatar */}
            <div style={{ position: 'relative' }}>
                {photo ? (
                    <img src={photo} alt={name}
                        className="lec-img"
                        style={{ width: '100%', aspectRatio: '4/3', objectFit: 'cover', objectPosition: 'top', display: 'block' }} />
                ) : (
                    <div style={{ width: '100%', aspectRatio: '4/3', background: palette.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ color: palette.text, fontSize: '40px', fontFamily: "'Playfair Display',serif", fontWeight: 900 }}>{initials}</span>
                    </div>
                )}
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '56px', background: 'linear-gradient(to top,rgba(13,34,68,.6),transparent)', pointerEvents: 'none' }} />
                {lecturer.title && (
                    <div style={{ position: 'absolute', bottom: '8px', left: '8px', background: NAVY, color: GOLDD, fontSize: '9px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '3px 9px', fontFamily: "'Lato',sans-serif", display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <GraduationCap size={8} />{titleDisplay}
                    </div>
                )}
            </div>
            {/* Body */}
            <div style={{ padding: '13px 13px 15px' }}>
                <Link href={profileHref} style={{ textDecoration: 'none' }}>
                    <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: '13px', fontWeight: 700, color: NAVY, margin: '0 0 5px', lineHeight: 1.3, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{displayName}</h3>
                </Link>
                {lecturer.department && (
                    <p style={{ fontSize: '11px', color: '#888', margin: '0 0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: "'Lato',sans-serif", display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <BookMarked size={8} style={{ color: GOLD, flexShrink: 0 }} />{lecturer.department}
                    </p>
                )}
                {lecturer.university && (
                    <p style={{ fontSize: '10px', color: '#aaa', margin: '0 0 10px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: "'Lato',sans-serif", display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <GraduationCap size={8} style={{ color: GOLD, flexShrink: 0 }} />{lecturer.university}
                    </p>
                )}
                <div style={{ borderTop: '0.5px solid #f0ebe0', paddingTop: '10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '10px', color: '#888', display: 'flex', alignItems: 'center', gap: '3px', fontFamily: "'Lato',sans-serif" }}>
                        <BookOpen size={9} style={{ color: NAVY }} />
                        <strong style={{ color: NAVY }}>{lecturer.uploadedBooks || lecturer.bookCount || 0}</strong> files
                    </span>
                    <Link href={profileHref} style={{ fontSize: '9px', fontWeight: 700, color: NAVY, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '2px', letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: "'Lato',sans-serif" }}>
                        Profile <ChevronRight size={10} />
                    </Link>
                </div>
            </div>
        </div>
    );
}

/* Active student row */
function ActiveStudentRow({ student, rank }) {
    const palette = getPalette(student.name || '?');
    const initials = getInitials(student.name || '?');
    const rankColors = ['#b8963e', '#aaa', '#cd7f32'];
    const rankBg = rank < 3 ? `rgba(${rank === 0 ? '184,150,62' : rank === 1 ? '170,170,170' : '205,127,50'},.1)` : 'rgba(13,34,68,.04)';

    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 0', borderBottom: '0.5px solid #f0ebe0' }}>
            <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: rankBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ fontSize: '10px', fontWeight: 700, color: rankColors[rank] || '#888', fontFamily: "'Lato',sans-serif" }}>{rank + 1}</span>
            </div>
            {student.photoURL ? (
                <img src={student.photoURL} alt={student.name}
                    style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover', border: `1.5px solid ${GOLD}`, flexShrink: 0 }}
                    onError={e => e.target.style.display = 'none'} />
            ) : (
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: palette.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1.5px solid rgba(184,150,62,.3)`, flexShrink: 0 }}>
                    <span style={{ color: palette.text, fontSize: '11px', fontWeight: 700, fontFamily: "'Playfair Display',serif" }}>{initials}</span>
                </div>
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: '12px', fontWeight: 700, color: NAVY, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: "'Lato',sans-serif" }}>{student.name}</p>
                <p style={{ fontSize: '10px', color: '#aaa', margin: 0, fontFamily: "'Lato',sans-serif" }}>{student.university || 'Student'}</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#16a34a' }} />
                <span style={{ fontSize: '10px', color: '#16a34a', fontWeight: 700, fontFamily: "'Lato',sans-serif" }}>Active</span>
            </div>
        </div>
    );
}

/* ════════════════════════════════════════════════════════════
   MAIN COMPONENT
════════════════════════════════════════════════════════════ */
export default function StudentDashboardClient() {
    const router = useRouter();
    const [user,          setUser]          = useState(null);
    const [loading,       setLoading]       = useState(true);
    const [activeTab,     setActiveTab]     = useState('home');
    const [library,       setLibrary]       = useState([]);
    const [wishlist,      setWishlist]      = useState([]);
    const [sellerStats,   setSellerStats]   = useState(null);
    const [lecturerBooks, setLecturerBooks] = useState([]);
    const [lecturers,     setLecturers]     = useState([]);
    const [latestBooks,   setLatestBooks]   = useState([]);
    const [aiSessions,    setAiSessions]    = useState([]);
    const [activeStudents,setActiveStudents]= useState([]);
    const [campusBooks,   setCampusBooks]   = useState([]);

    /* ── auth + data ── */
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
            if (!userDoc.exists()) { router.push('/auth/signin'); return; }
            const userData = userDoc.data();
            setUser({ uid, ...userData });

            /* library */
            if (userData.purchasedBooks) {
                const lib = Object.values(userData.purchasedBooks).map(b => ({
                    ...b,
                    title: b.title || b.bookTitle || '',
                    firestoreId: b.bookId || b.firestoreId || '',
                }));
                setLibrary(lib);
            }

            /* wishlist */
            if (userData.savedBooks) {
                setWishlist(Object.values(userData.savedBooks).map(b => ({ ...b })));
            }

            /* seller stats */
            if (userData.isSeller) {
                try {
                    const sd = await getDoc(doc(db, 'sellers', uid));
                    if (sd.exists()) setSellerStats(sd.data());
                } catch {}
            }

            /* AI sessions */
            try {
                const sq = query(collection(db, 'ai_chat_sessions'), where('userId', '==', uid));
                const ss = await getDocs(sq);
                setAiSessions(ss.docs.map(d => ({ id: d.id, ...d.data() }))
                    .sort((a, b) => (b.updatedAt?.toDate?.()?.getTime() || 0) - (a.updatedAt?.toDate?.()?.getTime() || 0))
                    .slice(0, 6));
            } catch {}

            /* Active students — users where isStudent:true, recently active */
            try {
                const sq = query(
                    collection(db, 'users'),
                    where('isStudent', '==', true),
                    limit(40)
                );
                const ss = await getDocs(sq);
                const list = ss.docs
                    .map(d => {
                        const data = d.data();
                        return {
                            id: d.id,
                            name: data.displayName || `${data.firstName || ''} ${data.surname || ''}`.trim() || 'Student',
                            photoURL: data.photoBase64 || data.photoURL || null,
                            university: data.university || data.institution || '',
                            lastActive: data.lastActive || data.updatedAt || null,
                        };
                    })
                    .filter(s => s.name && s.name !== 'Student')
                    .slice(0, 10);
                setActiveStudents(list);
            } catch {}

            /* Lecturers — same logic as /lecturers page */
            const TITLES = ['Lecturer', 'Dr.', 'Prof.', 'Professor'];
            const seenIds = new Set();
            const rawLecs = [];

            for (const title of TITLES) {
                try {
                    const snap = await getDocs(query(collection(db, 'sellers'), where('title', '==', title)));
                    for (const d of snap.docs) {
                        if (seenIds.has(d.id)) continue;
                        seenIds.add(d.id);
                        const data = d.data();
                        /* fetch user doc for photo — same as lecturers page */
                        let photo = null;
                        try {
                            const ud = await getDoc(doc(db, 'users', d.id));
                            if (ud.exists()) {
                                const udata = ud.data();
                                photo = udata.photoBase64 || udata.photoURL || udata.profilePicture || null;
                            }
                        } catch {}
                        rawLecs.push({
                            sellerId: d.id,
                            sellerName: data.sellerName || data.displayName || 'Lecturer',
                            title: data.title || '',
                            department: data.department || data.faculty || '',
                            university: data.university || data.institution || '',
                            uploadedBooks: 0,
                            photo,
                        });
                    }
                } catch {}
            }

            /* book counts per lecturer */
            await Promise.all(rawLecs.map(async l => {
                try {
                    const bq = query(collection(db, 'advertMyBook'), where('sellerId', '==', l.sellerId), where('status', '==', 'approved'));
                    l.uploadedBooks = (await getDocs(bq)).size;
                } catch {}
            }));
            rawLecs.sort((a, b) => b.uploadedBooks - a.uploadedBooks);
            setLecturers(rawLecs);

            /* Lecturer books */
            if (seenIds.size > 0) {
                const idArr = [...seenIds];
                let lecBooks = [];
                for (let i = 0; i < idArr.length; i += 30) {
                    const batch = idArr.slice(i, i + 30);
                    try {
                        const snap = await getDocs(query(
                            collection(db, 'advertMyBook'),
                            where('status', '==', 'approved'),
                            where('sellerId', 'in', batch)
                        ));
                        snap.docs.forEach(d => {
                            const data = d.data();
                            const lec = rawLecs.find(l => l.sellerId === data.sellerId);
                            lecBooks.push({
                                ...data,
                                id: `lb-${d.id}`, firestoreId: d.id,
                                title: data.bookTitle || data.title || '',
                                lecturerName: lec?.sellerName || data.sellerName || '',
                                lecturerTitle: lec?.title || '',
                            });
                        });
                    } catch {}
                }
                const seenBook = new Set();
                setLecturerBooks(lecBooks.filter(b => {
                    if (seenBook.has(b.firestoreId)) return false;
                    seenBook.add(b.firestoreId); return true;
                }).sort((a, b) =>
                    (b.createdAt?.toDate?.()?.getTime() || 0) - (a.createdAt?.toDate?.()?.getTime() || 0)
                ).slice(0, 10));
            }

            /* Latest books (non-lecturer) */
            try {
                const lecturerSellerIds = new Set(seenIds);
                const bq = query(collection(db, 'advertMyBook'), where('status', '==', 'approved'));
                const bs = await getDocs(bq);
                const seenB = new Set();
                const all = bs.docs
                    .filter(d => !lecturerSellerIds.has(d.data().sellerId))
                    .map(d => ({
                        ...d.data(),
                        id: `nb-${d.id}`, firestoreId: d.id,
                        title: d.data().bookTitle || d.data().title || '',
                    }))
                    .filter(b => {
                        if (seenB.has(b.firestoreId)) return false;
                        seenB.add(b.firestoreId); return true;
                    })
                    .sort((a, b) =>
                        (b.createdAt?.toDate?.()?.getTime() || 0) - (a.createdAt?.toDate?.()?.getTime() || 0)
                    ).slice(0, 10);
                setLatestBooks(all);
            } catch {}

            /* Campus books — for campus pulse */
            try {
                const bq = query(collection(db, 'advertMyBook'), where('status', '==', 'approved'), orderBy('createdAt', 'desc'), limit(8));
                const bs = await getDocs(bq);
                setCampusBooks(bs.docs.map(d => ({
                    ...d.data(), firestoreId: d.id,
                    title: d.data().bookTitle || d.data().title || '',
                })));
            } catch {}

        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    /* ── Loading ── */
    if (loading) return (
        <div style={{ minHeight: '100vh', background: BG, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
            <div style={{ textAlign: 'center' }}>
                <div style={{ width: '56px', height: '56px', border: `3px solid ${GOLD}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin .8s linear infinite', margin: '0 auto 16px' }} />
                <p style={{ fontFamily: "'Playfair Display',serif", fontSize: '17px', color: NAVY }}>Loading your dashboard…</p>
            </div>
        </div>
    );

    const displayName = user?.displayName || `${user?.firstName || ''} ${user?.surname || ''}`.trim() || 'Scholar';
    const initials = getInitials(displayName);
    const palette = getPalette(displayName);

    /* ════════ HOME TAB ════════ */
    const renderHome = () => (
        <div>
            {/* ── HERO ── */}
            <div className="student-hero">
                <div style={{ position: 'absolute', top: '-30px', right: '-30px', width: '160px', height: '160px', border: '0.5px solid rgba(184,150,62,.15)', transform: 'rotate(45deg)' }} />
                <div style={{ position: 'absolute', bottom: '20px', left: '-20px', width: '80px', height: '80px', border: '0.5px solid rgba(184,150,62,.1)', transform: 'rotate(45deg)' }} />

                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '20px', position: 'relative' }}>
                    <div>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(184,150,62,.14)', border: '1px solid rgba(184,150,62,.3)', borderRadius: '999px', padding: '5px 13px', marginBottom: '16px' }}>
                            <Sparkles size={10} style={{ color: GOLD }} />
                            <span style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '.14em', textTransform: 'uppercase', color: GOLDD, fontFamily: "'Lato',sans-serif" }}>
                                {user?.university || 'LAN Library'}
                            </span>
                        </div>
                        <h2 className="lan-serif" style={{ fontSize: 'clamp(26px,5vw,44px)', fontWeight: 900, color: '#fff', margin: '0 0 10px', lineHeight: 1.05 }}>
                            Welcome back,<br />
                            <span style={{ color: GOLD, fontStyle: 'italic' }}>{user?.firstName || 'Scholar'} ✦</span>
                        </h2>
                        <p style={{ fontSize: '13px', color: 'rgba(245,240,232,.6)', fontFamily: "'Lato',sans-serif", margin: '0 0 22px' }}>
                            {library.length} {library.length === 1 ? 'book' : 'books'} in your library · {aiSessions.length} AI sessions
                        </p>
                        <Link href="/ai-chat">
                            <button className="hero-cta-btn">
                                <Sparkles size={13} /> Chat with AI Tutor
                            </button>
                        </Link>
                    </div>

                    {/* Quick stats */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', flexShrink: 0 }}>
                        {[
                            { icon: BookOpen, label: 'Books', val: library.length, accent: GOLD },
                            { icon: Sparkles, label: 'AI Chats', val: aiSessions.length, accent: '#a78bfa' },
                            { icon: Heart, label: 'Saved', val: wishlist.length, accent: '#f87171' },
                            { icon: Users, label: 'Online', val: activeStudents.length, accent: '#34d399' },
                        ].map(({ icon: Icon, label, val, accent }) => (
                            <div key={label} style={{ background: 'rgba(255,255,255,.07)', border: '0.5px solid rgba(255,255,255,.1)', padding: '12px', textAlign: 'center', backdropFilter: 'blur(4px)' }}>
                                <Icon size={14} style={{ color: accent, margin: '0 auto 5px' }} />
                                <p className="lan-serif" style={{ fontSize: '20px', fontWeight: 700, color: '#fff', margin: 0 }}>{val}</p>
                                <p style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: 'rgba(245,240,232,.45)', fontFamily: "'Lato',sans-serif" }}>{label}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>

                {/* ── CONTINUE READING ── */}
                {library.length > 0 && (
                    <section>
                        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '18px' }}>
                            <div>
                                <p className="section-label">My Library</p>
                                <h3 className="lan-serif section-title">Jump Back In</h3>
                            </div>
                            <button onClick={() => setActiveTab('library')} className="section-link">
                                Full Library <ChevronRight size={12} />
                            </button>
                        </div>
                        <div className="books-grid">
                            {library.slice(0, 5).map((b, i) => (
                                <BookCard key={b.bookId || b.id || i} book={b} owned />
                            ))}
                        </div>
                    </section>
                )}

                {/* ── OUR LECTURERS ── */}
                <section>
                    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '18px' }}>
                        <div>
                            <p className="section-label">Faculty Directory</p>
                            <h3 className="lan-serif section-title">
                                Our Lecturers
                                {lecturers.length > 0 && (
                                    <span style={{ fontSize: '11px', fontWeight: 400, color: GOLD, fontFamily: "'Lato',sans-serif", marginLeft: '10px', fontStyle: 'normal' }}>
                                        {lecturers.length} on LAN
                                    </span>
                                )}
                            </h3>
                        </div>
                        <Link href="/lecturers" className="section-link">View All <ChevronRight size={12} /></Link>
                    </div>

                    {lecturers.length === 0 ? (
                        <div className="empty-state">
                            <GraduationCap size={32} style={{ color: '#e5ddd0', margin: '0 auto 10px' }} />
                            <p style={{ fontSize: '13px', color: '#aaa', fontFamily: "'Lato',sans-serif" }}>No lecturers found yet</p>
                        </div>
                    ) : (
                        <div className="sbar-none" style={{ display: 'flex', gap: '14px', overflowX: 'auto', paddingBottom: '8px' }}>
                            {lecturers.map(l => <div key={l.sellerId} style={{ flexShrink: 0, width: '200px' }}><LecturerCard lecturer={l} /></div>)}
                        </div>
                    )}
                </section>

                {/* ── NEW FROM LECTURERS ── */}
                <section>
                    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '18px' }}>
                        <div>
                            <p className="section-label">Faculty Uploads</p>
                            <h3 className="lan-serif section-title">New from Lecturers</h3>
                        </div>
                        <Link href="/documents?filter=lecturer" className="section-link">Browse All <ChevronRight size={12} /></Link>
                    </div>

                    {lecturerBooks.length === 0 ? (
                        <div className="empty-state">
                            <BookMarked size={32} style={{ color: '#e5ddd0', margin: '0 auto 10px' }} />
                            <p style={{ fontSize: '13px', color: '#aaa', fontFamily: "'Lato',sans-serif" }}>No lecturer books yet</p>
                        </div>
                    ) : (
                        <div className="books-grid">
                            {lecturerBooks.slice(0, 5).map((b, i) => (
                                <BookCard key={b.firestoreId || i} book={b} badge="Lecturer" />
                            ))}
                        </div>
                    )}
                </section>

                {/* ── CAMPUS PULSE ── */}
                <section>
                    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '18px' }}>
                        <div>
                            <p className="section-label">What's Happening</p>
                            <h3 className="lan-serif section-title">Campus Pulse</h3>
                        </div>
                        <Link href="/documents" className="section-link">All Docs <ChevronRight size={12} /></Link>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0' }}>
                        {campusBooks.length === 0 ? (
                            <div className="empty-state">
                                <Activity size={32} style={{ color: '#e5ddd0', margin: '0 auto 10px' }} />
                                <p style={{ fontSize: '13px', color: '#aaa', fontFamily: "'Lato',sans-serif" }}>No activity yet</p>
                            </div>
                        ) : campusBooks.map((b, i) => {
                            const navId = b.firestoreId;
                            const thumb = getThumbnailUrl(b);
                            return (
                                <Link key={b.firestoreId || i} href={`/book/preview?id=${navId}`} style={{ textDecoration: 'none' }}>
                                    <div className="campus-row">
                                        {/* rank */}
                                        <div style={{ width: '24px', flexShrink: 0, textAlign: 'center' }}>
                                            <span style={{ fontSize: '11px', fontWeight: 700, color: i < 3 ? GOLD : '#ccc', fontFamily: "'Lato',sans-serif" }}>{i + 1}</span>
                                        </div>
                                        {/* thumb */}
                                        <div style={{ width: '38px', height: '52px', background: '#ede8df', flexShrink: 0, overflow: 'hidden' }}>
                                            {thumb ? (
                                                <img src={thumb} alt={b.title || ''} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => e.target.style.display = 'none'} />
                                            ) : (
                                                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                    <BookOpen size={14} style={{ color: '#ccc' }} />
                                                </div>
                                            )}
                                        </div>
                                        {/* meta */}
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <p style={{ fontSize: '12px', fontWeight: 700, color: NAVY, margin: '0 0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: "'Lato',sans-serif" }}>
                                                {b.title}
                                            </p>
                                            <p style={{ fontSize: '10px', color: '#888', margin: '0 0 4px', fontFamily: "'Lato',sans-serif" }}>
                                                {b.sellerName || b.author || ''}
                                            </p>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <span style={{ fontSize: '10px', fontWeight: 700, color: NAVY, fontFamily: "'Lato',sans-serif" }}>
                                                    ₦{Number(b.price || 0).toLocaleString()}
                                                </span>
                                                {b.category && (
                                                    <span style={{ fontSize: '8px', fontWeight: 700, background: CREAM, border: '0.5px solid rgba(184,150,62,.3)', color: GOLD, padding: '1px 7px', fontFamily: "'Lato',sans-serif", textTransform: 'uppercase', letterSpacing: '.06em' }}>
                                                        {b.category}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <ChevronRight size={13} style={{ color: '#ccc', flexShrink: 0 }} />
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                </section>

                {/* ── JUST ADDED ── */}
                <section>
                    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '18px' }}>
                        <div>
                            <p className="section-label">Fresh Uploads</p>
                            <h3 className="lan-serif section-title">Just Added</h3>
                        </div>
                        <Link href="/documents" className="section-link">All Books <ChevronRight size={12} /></Link>
                    </div>

                    {latestBooks.length === 0 ? (
                        <div className="empty-state">
                            <Zap size={32} style={{ color: '#e5ddd0', margin: '0 auto 10px' }} />
                            <p style={{ fontSize: '13px', color: '#aaa', fontFamily: "'Lato',sans-serif" }}>No books uploaded yet</p>
                        </div>
                    ) : (
                        <div className="books-grid">
                            {latestBooks.slice(0, 5).map((b, i) => (
                                <BookCard key={b.firestoreId || i} book={b} />
                            ))}
                        </div>
                    )}
                </section>

                {/* ── LEARNING TOOLS ── */}
                <section>
                    <p className="section-label" style={{ marginBottom: '8px' }}>Resources</p>
                    <h3 className="lan-serif section-title" style={{ marginBottom: '18px' }}>Learning Tools</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(180px,1fr))', gap: '12px' }}>
                        {[
                            { icon: Sparkles, label: 'AI Book Chat', sub: 'Ask anything about your books', href: '/ai-chat', accent: true },
                            { icon: FileText, label: 'Study Notes', sub: 'Summarise & save', href: '/ai-chat', accent: false },
                            { icon: BookCopy, label: 'Past Questions', sub: 'Exam prep resources', href: '/document-type/past-question', accent: false },
                            { icon: Users, label: 'Study Groups', sub: 'Collaborate with peers', href: '/documents', accent: false },
                        ].map(({ icon: Icon, label, sub, href, accent }) => (
                            <Link key={label} href={href} style={{ textDecoration: 'none' }}>
                                <div className={`tool-card${accent ? ' tool-card-accent' : ''}`}>
                                    <Icon size={18} style={{ color: accent ? '#fff' : GOLD, marginBottom: '8px' }} />
                                    <p style={{ fontSize: '12px', fontWeight: 700, color: accent ? '#fff' : NAVY, margin: '0 0 3px', fontFamily: "'Lato',sans-serif" }}>{label}</p>
                                    <p style={{ fontSize: '10px', color: accent ? 'rgba(245,240,232,.6)' : '#aaa', margin: 0, fontFamily: "'Lato',sans-serif" }}>{sub}</p>
                                </div>
                            </Link>
                        ))}
                    </div>
                </section>

                {/* ── SELL PANEL ── */}
                <section>
                    {user?.isSeller ? (
                        <div className="seller-panel">
                            <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '80px', height: '80px', border: '0.5px solid rgba(184,150,62,.15)', transform: 'rotate(45deg)' }} />
                            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
                                <div>
                                    <p style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '.18em', textTransform: 'uppercase', color: GOLD, margin: '0 0 4px', fontFamily: "'Lato',sans-serif" }}>Author Dashboard</p>
                                    <p className="lan-serif" style={{ fontSize: '28px', fontWeight: 700, color: '#fff', margin: '0 0 4px' }}>
                                        ₦{(sellerStats?.accountBalance || 0).toLocaleString()}
                                    </p>
                                    <p style={{ fontSize: '11px', color: 'rgba(245,240,232,.5)', fontFamily: "'Lato',sans-serif" }}>{sellerStats?.totalSales || sellerStats?.booksSold || 0} total sales</p>
                                </div>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <Link href="/upload-document"><button className="panel-btn-gold">Upload</button></Link>
                                    <Link href="/my-account/seller-account"><button className="panel-btn-ghost">Studio</button></Link>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="seller-panel">
                            <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '80px', height: '80px', border: '0.5px solid rgba(184,150,62,.15)', transform: 'rotate(45deg)' }} />
                            <p style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '.18em', textTransform: 'uppercase', color: GOLD, margin: '0 0 10px', fontFamily: "'Lato',sans-serif" }}>Earn on LAN</p>
                            <h3 className="lan-serif" style={{ fontSize: '22px', fontWeight: 700, color: '#fff', margin: '0 0 8px' }}>
                                Turn Notes<br />into Cash 💸
                            </h3>
                            <p style={{ fontSize: '12px', color: 'rgba(245,240,232,.55)', fontFamily: "'Lato',sans-serif", lineHeight: 1.65, margin: '0 0 18px', maxWidth: '340px' }}>
                                Your study guides could earn thousands. Join 500+ student authors — keep 80% of every sale.
                            </p>
                            <Link href="/become-seller"><button className="panel-btn-gold">Start Selling Now →</button></Link>
                        </div>
                    )}
                </section>

                {/* ── ACTIVE STUDENTS ── */}
                <section>
                    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '18px' }}>
                        <div>
                            <p className="section-label">Community</p>
                            <h3 className="lan-serif section-title">Active Students</h3>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#16a34a' }} />
                            <span style={{ fontSize: '10px', fontWeight: 700, color: '#16a34a', fontFamily: "'Lato',sans-serif" }}>{activeStudents.length} online</span>
                        </div>
                    </div>

                    <div style={{ background: '#fff', border: '0.5px solid #e5ddd0', padding: '4px 16px 0' }}>
                        {activeStudents.length === 0 ? (
                            <div style={{ padding: '32px 0', textAlign: 'center' }}>
                                <Users size={28} style={{ color: '#e5ddd0', margin: '0 auto 8px' }} />
                                <p style={{ fontSize: '12px', color: '#aaa', fontFamily: "'Lato',sans-serif" }}>No active students right now</p>
                            </div>
                        ) : activeStudents.map((s, i) => (
                            <ActiveStudentRow key={s.id} student={s} rank={i} />
                        ))}
                    </div>
                </section>

            </div>
        </div>
    );

    /* ════════ LIBRARY TAB ════════ */
    const renderLibrary = () => (
        <div>
            <div style={{ marginBottom: '24px' }}>
                <p className="section-label">Your Collection</p>
                <h2 className="lan-serif" style={{ fontSize: '28px', fontWeight: 700, color: NAVY, margin: '4px 0 0' }}>My Library</h2>
            </div>

            {library.length === 0 ? (
                <div className="empty-state" style={{ padding: '64px 24px' }}>
                    <BookOpen size={48} style={{ color: '#e5ddd0', margin: '0 auto 16px' }} />
                    <h3 className="lan-serif" style={{ fontSize: '22px', color: NAVY, marginBottom: '8px' }}>Your Library is Empty</h3>
                    <p style={{ fontSize: '13px', color: '#aaa', marginBottom: '20px', fontFamily: "'Lato',sans-serif" }}>Start building your collection</p>
                    <Link href="/documents"><button className="cta-btn">Browse Documents</button></Link>
                </div>
            ) : (
                <div>
                    <div className="books-grid-wide">
                        {library.map((b, i) => (
                            <BookCard key={b.bookId || b.id || i} book={b} owned />
                        ))}
                    </div>
                    {/* AI prompts under each book */}
                    <div style={{ marginTop: '24px', borderTop: '0.5px solid #f0ebe0', paddingTop: '24px' }}>
                        <p className="section-label" style={{ marginBottom: '12px' }}>AI Tutor</p>
                        <h3 className="lan-serif" style={{ fontSize: '18px', color: NAVY, margin: '0 0 14px' }}>Chat About Your Books</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {library.slice(0, 4).map((b, i) => {
                                const chatId = b.bookId || b.firestoreId || b.id || '';
                                return (
                                    <Link key={i} href={`/ai-chat?bookId=${chatId}&bookTitle=${encodeURIComponent(b.title || '')}`} style={{ textDecoration: 'none' }}>
                                        <div className="ai-banner">
                                            <div style={{ width: '34px', height: '34px', background: 'rgba(255,255,255,.15)', border: '0.5px solid rgba(255,255,255,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                <Sparkles size={14} style={{ color: '#fff' }} />
                                            </div>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <p style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,.6)', margin: '0 0 2px', fontFamily: "'Lato',sans-serif" }}>AI Tutor</p>
                                                <p style={{ fontSize: '12px', fontWeight: 700, color: '#fff', margin: 0, fontFamily: "'Lato',sans-serif", overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Ask about "{b.title}"</p>
                                            </div>
                                            <ArrowRight size={13} style={{ color: 'rgba(255,255,255,.5)', flexShrink: 0 }} />
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );

    /* ════════ AI TAB ════════ */
    const renderAI = () => (
        <div>
            <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
                <div>
                    <p className="section-label">Powered by Claude</p>
                    <h2 className="lan-serif" style={{ fontSize: '28px', fontWeight: 700, color: NAVY, margin: '4px 0 0' }}>AI Tutor</h2>
                </div>
                <Link href="/ai-chat">
                    <button className="cta-btn" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Plus size={13} /> New Chat
                    </button>
                </Link>
            </div>

            {/* Quick start */}
            <div className="seller-panel" style={{ marginBottom: '24px' }}>
                <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '80px', height: '80px', border: '0.5px solid rgba(184,150,62,.15)', transform: 'rotate(45deg)' }} />
                <Sparkles size={22} style={{ color: GOLD, marginBottom: '12px' }} />
                <h3 className="lan-serif" style={{ fontSize: '22px', fontWeight: 700, color: '#fff', margin: '0 0 8px' }}>Ask anything about your books</h3>
                <p style={{ fontSize: '12px', color: 'rgba(245,240,232,.55)', fontFamily: "'Lato',sans-serif", margin: '0 0 18px' }}>Summaries, key concepts, exam tips, explanations.</p>
                <Link href="/ai-chat"><button className="panel-btn-gold">Start AI Chat →</button></Link>
            </div>

            {/* sessions */}
            {aiSessions.length > 0 && (
                <div style={{ marginBottom: '24px' }}>
                    <p className="section-label" style={{ marginBottom: '12px' }}>Recent</p>
                    <h3 className="lan-serif" style={{ fontSize: '18px', color: NAVY, margin: '0 0 14px' }}>Your Conversations</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {aiSessions.map(s => (
                            <Link key={s.id} href={`/ai-chat?sessionId=${s.id}&bookId=${s.bookId}&bookTitle=${encodeURIComponent(s.bookTitle || '')}`} style={{ textDecoration: 'none' }}>
                                <div className="ai-session-row">
                                    <div style={{ width: '36px', height: '36px', border: '0.5px solid #e5ddd0', background: CREAM, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                        <MessageSquare size={14} style={{ color: NAVY }} />
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <p style={{ fontSize: '12px', fontWeight: 700, color: NAVY, margin: '0 0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: "'Lato',sans-serif" }}>
                                            {s.title || 'New conversation'}
                                        </p>
                                        <p style={{ fontSize: '10px', color: GOLD, margin: 0, fontFamily: "'Lato',sans-serif" }}>{s.bookTitle || ''}</p>
                                    </div>
                                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                        <p style={{ fontSize: '10px', color: '#aaa', margin: 0, fontFamily: "'Lato',sans-serif" }}>{s.messages?.length || 0} msgs</p>
                                        <p style={{ fontSize: '9px', color: '#ccc', margin: '2px 0 0', fontFamily: "'Lato',sans-serif" }}>{formatTime(s.updatedAt)}</p>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            )}

            {library.length > 0 && (
                <div>
                    <p className="section-label" style={{ marginBottom: '12px' }}>Quick Access</p>
                    <h3 className="lan-serif" style={{ fontSize: '18px', color: NAVY, margin: '0 0 14px' }}>Chat About Your Books</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {library.map((b, i) => {
                            const chatId = b.bookId || b.firestoreId || b.id || '';
                            return (
                                <Link key={i} href={`/ai-chat?bookId=${chatId}&bookTitle=${encodeURIComponent(b.title || '')}`} style={{ textDecoration: 'none' }}>
                                    <div className="ai-banner">
                                        <div style={{ width: '34px', height: '34px', background: 'rgba(255,255,255,.15)', border: '0.5px solid rgba(255,255,255,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                            <Sparkles size={14} style={{ color: '#fff' }} />
                                        </div>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <p style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,.6)', margin: '0 0 2px', fontFamily: "'Lato',sans-serif" }}>AI Tutor</p>
                                            <p style={{ fontSize: '12px', fontWeight: 700, color: '#fff', margin: 0, fontFamily: "'Lato',sans-serif", overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Ask about "{b.title}"</p>
                                        </div>
                                        <ArrowRight size={13} style={{ color: 'rgba(255,255,255,.5)', flexShrink: 0 }} />
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );

    /* ════════ WISHLIST TAB ════════ */
    const renderWishlist = () => (
        <div>
            <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
                <div>
                    <p className="section-label">Your Wishlist</p>
                    <h2 className="lan-serif" style={{ fontSize: '28px', fontWeight: 700, color: NAVY, margin: '4px 0 0' }}>Saved Books</h2>
                </div>
                <span style={{ fontSize: '12px', color: '#aaa', fontFamily: "'Lato',sans-serif" }}>{wishlist.length} items</span>
            </div>

            {wishlist.length === 0 ? (
                <div className="empty-state" style={{ padding: '64px 24px' }}>
                    <Heart size={48} style={{ color: '#e5ddd0', margin: '0 auto 16px' }} />
                    <h3 className="lan-serif" style={{ fontSize: '22px', color: NAVY, marginBottom: '8px' }}>Nothing Saved Yet</h3>
                    <p style={{ fontSize: '13px', color: '#aaa', marginBottom: '20px', fontFamily: "'Lato',sans-serif" }}>Browse and save books for later</p>
                    <Link href="/documents"><button className="cta-btn">Browse Documents</button></Link>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {wishlist.map((item, i) => {
                        const thumb = getThumbnailUrl(item);
                        const navId = item.bookId || item.firestoreId || item.id;
                        return (
                            <div key={item.id || i} style={{ background: '#fff', border: '0.5px solid #e5ddd0', padding: '14px 16px', display: 'flex', gap: '14px', alignItems: 'center', transition: 'border-color .18s' }}
                                onMouseEnter={e => e.currentTarget.style.borderColor = GOLD}
                                onMouseLeave={e => e.currentTarget.style.borderColor = '#e5ddd0'}>
                                <div style={{ width: '44px', height: '58px', background: '#ede8df', flexShrink: 0, overflow: 'hidden' }}>
                                    {thumb ? <img src={thumb} alt={item.title || ''} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => e.target.style.display = 'none'} /> : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><BookOpen size={16} style={{ color: '#ccc' }} /></div>}
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <p style={{ fontSize: '13px', fontWeight: 700, color: NAVY, margin: '0 0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: "'Lato',sans-serif" }}>{item.title || item.bookTitle}</p>
                                    <p style={{ fontSize: '11px', color: '#888', margin: '0 0 6px', fontFamily: "'Lato',sans-serif" }}>{item.author || ''}</p>
                                    <p style={{ fontSize: '13px', fontWeight: 700, color: NAVY, margin: 0, fontFamily: "'Lato',sans-serif" }}>₦{Number(item.price || 0).toLocaleString()}</p>
                                </div>
                                <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                                    <Link href={`/payment?bookId=${navId}`}>
                                        <button style={{ padding: '8px 16px', background: NAVY, color: '#fff', border: 'none', fontSize: '11px', fontWeight: 700, cursor: 'pointer', fontFamily: "'Lato',sans-serif" }}>Buy</button>
                                    </Link>
                                    <Link href={`/book/preview?id=${navId}`}>
                                        <button style={{ padding: '8px 12px', background: 'transparent', color: NAVY, border: '0.5px solid #e5ddd0', fontSize: '11px', fontWeight: 700, cursor: 'pointer', fontFamily: "'Lato',sans-serif" }}>
                                            <Eye size={13} />
                                        </button>
                                    </Link>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );

    const NAV = [
        { id: 'home',     icon: LayoutDashboard, label: 'Home'    },
        { id: 'library',  icon: LibraryBig,       label: 'Library' },
        { id: 'ai',       icon: Sparkles,          label: 'AI Tutor'},
        { id: 'wishlist', icon: Heart,             label: 'Saved'  },
    ];

    /* ════════ RENDER ════════ */
    return (
        <>
            <style>{`
              @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400&family=Lato:wght@300;400;700&display=swap');

              * { box-sizing: border-box; }
              .lan-root  { font-family: 'Lato', sans-serif; background: ${BG}; }
              .lan-serif { font-family: 'Playfair Display', Georgia, serif; }
              .sbar-none { scrollbar-width: none; -ms-overflow-style: none; }
              .sbar-none::-webkit-scrollbar { display: none; }

              /* hero */
              .student-hero {
                background-color: ${NAVY};
                background-image: radial-gradient(rgba(184,150,62,.06) 1px,transparent 1px),
                                  radial-gradient(rgba(255,255,255,.03) 1px,transparent 1px);
                background-size: 28px 28px, 14px 14px;
                background-position: 0 0, 7px 7px;
                padding: 32px 28px 28px;
                position: relative; overflow: hidden;
                margin-bottom: 28px;
              }

              /* section labels */
              .section-label { font-size: 10px; font-weight: 700; letter-spacing: .2em; text-transform: uppercase; color: ${GOLD}; margin: 0 0 6px; font-family: 'Lato', sans-serif; }
              .section-title { font-family: 'Playfair Display', serif; font-size: clamp(18px,3vw,26px); font-weight: 700; color: ${NAVY}; margin: 0; }
              .section-link  { font-size: 11px; font-weight: 700; color: ${NAVY}; text-decoration: none; display: inline-flex; align-items: center; gap: 3px; letter-spacing: .04em; font-family: 'Lato', sans-serif; transition: color .15s; }
              .section-link:hover { color: ${GOLD}; }

              /* books grid */
              .books-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 16px; }
              .books-grid-wide { display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 16px; }

              /* book card */
              .book-thumb-card { background: #fff; border: 0.5px solid #e5ddd0; overflow: hidden; transition: transform .22s, box-shadow .22s, border-color .22s; }
              .book-thumb-card:hover { transform: translateY(-4px); box-shadow: 0 12px 32px rgba(13,34,68,.12); border-color: ${GOLD}; }

              /* lecturer card */
              .lec-card { background: #fff; border: 0.5px solid #e5ddd0; overflow: hidden; transition: transform .25s cubic-bezier(.4,0,.2,1), box-shadow .25s, border-color .25s; }
              .lec-card:hover { transform: translateY(-5px); box-shadow: 0 18px 44px rgba(13,34,68,.12); border-color: ${GOLD}; }
              .lec-card:hover .lec-img { transform: scale(1.05); }
              .lec-img { transition: transform .6s cubic-bezier(.4,0,.2,1); }

              /* campus row */
              .campus-row { display: flex; align-items: center; gap: 12px; padding: 12px 16px; border-bottom: 0.5px solid #f0ebe0; background: #fff; text-decoration: none; transition: background .15s; cursor: pointer; }
              .campus-row:hover { background: ${CREAM}; }
              .campus-row:last-child { border-bottom: none; }

              /* tool card */
              .tool-card { background: #fff; border: 0.5px solid #e5ddd0; padding: 18px 16px; transition: transform .2s, border-color .2s, box-shadow .2s; height: 100%; }
              .tool-card:hover { transform: translateY(-3px); border-color: ${GOLD}; box-shadow: 0 8px 24px rgba(13,34,68,.08); }
              .tool-card-accent { background: ${NAVY}; border-color: ${NAVY}; }
              .tool-card-accent:hover { border-color: ${GOLD}; }

              /* seller panel */
              .seller-panel { background: ${NAVY}; background-image: radial-gradient(rgba(184,150,62,.07) 1px,transparent 1px); background-size: 24px 24px; padding: 28px; position: relative; overflow: hidden; }

              /* panel buttons */
              .panel-btn-gold { padding: 10px 20px; background: ${GOLD}; color: ${NAVY}; border: none; fontSize: 12px; font-size: 12px; font-weight: 700; cursor: pointer; font-family: 'Lato', sans-serif; letter-spacing: .04em; transition: background .18s; }
              .panel-btn-gold:hover { background: ${GOLDD}; }
              .panel-btn-ghost { padding: 10px 20px; background: rgba(255,255,255,.1); color: #fff; border: 0.5px solid rgba(255,255,255,.2); font-size: 12px; font-weight: 700; cursor: pointer; font-family: 'Lato', sans-serif; letter-spacing: .04em; transition: background .18s; }
              .panel-btn-ghost:hover { background: rgba(255,255,255,.18); }

              /* hero cta */
              .hero-cta-btn { display: inline-flex; align-items: center; gap: 7px; padding: 11px 22px; background: ${GOLD}; color: ${NAVY}; border: none; font-size: 12px; font-weight: 700; cursor: pointer; font-family: 'Lato', sans-serif; letter-spacing: .04em; transition: background .18s; }
              .hero-cta-btn:hover { background: ${GOLDD}; }

              /* cta button */
              .cta-btn { padding: 10px 22px; background: ${NAVY}; color: #fff; border: none; font-size: 12px; font-weight: 700; cursor: pointer; font-family: 'Lato', sans-serif; letter-spacing: .04em; transition: background .18s; }
              .cta-btn:hover { background: #1a3a6e; }

              /* empty state */
              .empty-state { background: #fff; border: 0.5px solid #e5ddd0; padding: 48px 24px; text-align: center; }

              /* ai banner */
              .ai-banner { display: flex; align-items: center; gap: 12px; background: ${NAVY}; padding: 12px 16px; transition: background .15s; }
              .ai-banner:hover { background: #1a3a6e; }

              /* ai session row */
              .ai-session-row { display: flex; align-items: center; gap: 12px; padding: 12px 16px; border: 0.5px solid #e5ddd0; background: #fff; transition: border-color .15s, background .15s; }
              .ai-session-row:hover { border-color: ${GOLD}; background: ${CREAM}; }

              /* sidebar */
              .sidebar-item { display: flex; align-items: center; gap: 10px; padding: 10px 16px; cursor: pointer; font-size: 13px; font-weight: 700; color: #888; transition: all .15s; background: none; border: none; width: 100%; text-align: left; font-family: 'Lato', sans-serif; letter-spacing: .02em; }
              .sidebar-item:hover { background: ${CREAM}; color: ${NAVY}; border-left: 2px solid transparent; }
              .sidebar-item.active { background: ${CREAM}; color: ${NAVY}; border-left: 2px solid ${GOLD}; }

              /* mobile nav */
              .mob-nav-item { display: flex; flex-direction: column; align-items: center; gap: 3px; background: none; border: none; cursor: pointer; font-family: 'Lato', sans-serif; padding: 6px 12px; transition: all .15s; color: rgba(245,240,232,.4); }
              .mob-nav-item.active { color: ${GOLD}; }

              @keyframes spin { to { transform: rotate(360deg); } }
              @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
              .anim-up { animation: slideUp .45s cubic-bezier(.4,0,.2,1) both; }
              @keyframes pulse2 { 0%,100% { opacity: 1; } 50% { opacity: .4; } }
              .pulse-dot { animation: pulse2 2s infinite; }
            `}</style>

            <div className="lan-root" style={{ minHeight: '100vh' }}>
                <Navbar />

                <div style={{ display: 'flex', maxWidth: '1280px', margin: '0 auto' }}>

                    {/* ── Desktop Sidebar ── */}
                    <aside style={{ width: '220px', flexShrink: 0, display: 'none', flexDirection: 'column', borderRight: '0.5px solid #e5ddd0', minHeight: 'calc(100vh - 64px)', position: 'sticky', top: '64px', background: '#fff', padding: '24px 0' }} className="desk-sidebar">
                        <style>{`@media(min-width:1024px){.desk-sidebar{display:flex !important;}}`}</style>

                        {/* user pill */}
                        <div style={{ padding: '0 16px 20px', borderBottom: '0.5px solid #f0ebe0', marginBottom: '8px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                {user?.photoBase64 || user?.photoURL ? (
                                    <img src={user.photoBase64 || user.photoURL} alt="" style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover', border: `1.5px solid ${GOLD}` }} />
                                ) : (
                                    <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: palette.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1.5px solid rgba(184,150,62,.3)` }}>
                                        <span style={{ color: palette.text, fontSize: '13px', fontWeight: 700, fontFamily: "'Playfair Display',serif" }}>{initials}</span>
                                    </div>
                                )}
                                <div style={{ minWidth: 0 }}>
                                    <p style={{ fontSize: '12px', fontWeight: 700, color: NAVY, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: "'Lato',sans-serif" }}>{displayName}</p>
                                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                                        <div className="pulse-dot" style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#16a34a' }} />
                                        <span style={{ fontSize: '9px', fontWeight: 700, color: GOLD, letterSpacing: '.1em', textTransform: 'uppercase', fontFamily: "'Lato',sans-serif" }}>Student</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {NAV.map(({ id, icon: Icon, label }) => (
                            <button key={id} onClick={() => setActiveTab(id)} className={`sidebar-item${activeTab === id ? ' active' : ''}`}>
                                <Icon size={15} style={{ color: activeTab === id ? GOLD : '#bbb' }} />{label}
                            </button>
                        ))}

                        <div style={{ borderTop: '0.5px solid #f0ebe0', margin: '12px 0', padding: '8px 0' }}>
                            <Link href="/documents" style={{ textDecoration: 'none' }}>
                                <button className="sidebar-item"><Search size={15} style={{ color: '#bbb' }} />Browse All</button>
                            </Link>
                            <Link href="/my-account" style={{ textDecoration: 'none' }}>
                                <button className="sidebar-item"><User size={15} style={{ color: '#bbb' }} />Profile</button>
                            </Link>
                            {user?.isSeller ? (
                                <Link href="/my-account/seller-account" style={{ textDecoration: 'none' }}>
                                    <button className="sidebar-item" style={{ color: '#16a34a' }}>
                                        <BarChart2 size={15} style={{ color: '#16a34a' }} />Author Studio
                                    </button>
                                </Link>
                            ) : (
                                <Link href="/become-seller" style={{ textDecoration: 'none' }}>
                                    <button className="sidebar-item" style={{ color: GOLD }}>
                                        <Store size={15} style={{ color: GOLD }} />Become a Seller
                                    </button>
                                </Link>
                            )}
                        </div>

                        <button onClick={() => { auth.signOut(); router.push('/auth/signin'); }}
                            style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 16px', background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626', fontSize: '13px', fontWeight: 700, fontFamily: "'Lato',sans-serif" }}>
                            <LogOut size={15} /> Sign Out
                        </button>
                    </aside>

                    {/* ── Main Content ── */}
                    <main style={{ flex: 1, minWidth: 0, padding: '0 0 80px' }} className="main-pad">
                        <style>{`@media(min-width:1024px){.main-pad{padding:32px 32px 32px !important;}}`}</style>
                        {activeTab === 'home'     && renderHome()}
                        {activeTab === 'library'  && renderLibrary()}
                        {activeTab === 'ai'       && renderAI()}
                        {activeTab === 'wishlist' && renderWishlist()}
                    </main>
                </div>

                {/* ── Mobile Bottom Nav ── */}
                <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: NAVY, borderTop: '0.5px solid rgba(184,150,62,.2)', display: 'flex', justifyContent: 'space-around', alignItems: 'flex-end', padding: '10px 0 14px', zIndex: 50 }} className="mob-nav">
                    <style>{`@media(min-width:1024px){.mob-nav{display:none !important;}}`}</style>

                    {NAV.map(({ id, icon: Icon, label }) => (
                        <button key={id} onClick={() => setActiveTab(id)} className={`mob-nav-item${activeTab === id ? ' active' : ''}`}>
                            <Icon size={20} />
                            <span style={{ fontSize: '8px', fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase' }}>{label}</span>
                            {activeTab === id && <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: GOLD }} />}
                        </button>
                    ))}

                    {/* Upload FAB */}
                    <Link href="/advertise" style={{ marginBottom: '8px' }}>
                        <div style={{ width: '48px', height: '48px', background: GOLD, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `3px solid ${NAVY}` }}>
                            <Plus size={22} style={{ color: NAVY }} strokeWidth={3} />
                        </div>
                    </Link>

                    <Link href="/my-account" style={{ textDecoration: 'none' }}>
                        <button className="mob-nav-item">
                            <User size={20} />
                            <span style={{ fontSize: '8px', fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase' }}>Profile</span>
                        </button>
                    </Link>
                </div>
            </div>
        </>
    );
}