"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    BookOpen, Heart, User, LogOut, Store, Search, Plus, Eye, Sparkles,
    GraduationCap, MessageSquare, BookMarked, Zap, Users, ArrowRight,
    FileText, BookCopy, LayoutDashboard, LibraryBig, BarChart2, Activity,
    ChevronRight, X, Send,
} from 'lucide-react';
import { auth, db } from '@/lib/firebaseConfig';
import {
    doc, getDoc, collection, query, where, getDocs,
    orderBy, limit, updateDoc, increment,
} from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import Link from 'next/link';
import Navbar from '@/components/NavBar';
import NotificationBell from '@/components/NotificationBell';
import FeaturedAdsCarousel from '@/components/FeaturedAdsCarousel';
import { useAds } from "@/lib/useAds";
import BountyApprovalModal from '@/components/BountyApprovalModal';
import BountyDashboardCard from "./Bounty-dashboard-card/page";

/* ─── Design tokens (student dark system) ─── */
const VOID = "#0b0b0f";
const DARK = "#11111a";
const DARK2 = "#18182a";
const DARK3 = "#1e1e30";
const PURPLE = "#7c3aed";
const PURPLEL = "#a855f7";
const PURPLED = "#5b21b6";
const LIME = "#a3e635";
const LIMEL = "#d9f99d";
const WHITE = "#f8f8ff";
const MUTED = "rgba(248,248,255,.45)";
const BORDER = "rgba(124,58,237,.25)";
const BORDER2 = "rgba(248,248,255,.07)";

/* ─── Helpers ─── */
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

const PALETTES = [
    { bg: "#1a0a2e", text: PURPLEL },
    { bg: "#0a1a2e", text: "#7eccd4" },
    { bg: "#1a2e0a", text: LIME },
    { bg: "#2e0a1a", text: "#f87171" },
    { bg: "#1a1a0a", text: LIMEL },
    { bg: "#0a2e1a", text: "#34d399" },
];
const getPalette = (n = "?") => PALETTES[(n || '?').charCodeAt(0) % PALETTES.length];
const getInitials = (n = "?") => {
    const p = (n || '?').trim().split(' ').filter(Boolean);
    if (!p.length) return '?';
    if (p.length === 1) return p[0][0].toUpperCase();
    return (p[0][0] + p[p.length - 1][0]).toUpperCase();
};
const fmtTime = (ts) => {
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
const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
};
const profileHref = (lec) => `/profile/${lec.slug || lec.sellerId}`;

/* ══════════════ AVATAR ══════════════ */
function Avatar({ name, src, size = 36 }) {
    const pal = getPalette(name || '?');
    const [err, setErr] = useState(false);
    if (src && !err) return (
        <img src={src} alt={name} onError={() => setErr(true)}
            style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', objectPosition: 'top', border: `1.5px solid ${PURPLE}`, flexShrink: 0 }} />
    );
    return (
        <div style={{ width: size, height: size, borderRadius: '50%', background: pal.bg, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1.5px solid ${BORDER}` }}>
            <span style={{ color: pal.text, fontSize: size * 0.34, fontWeight: 700, fontFamily: "'Syne',sans-serif" }}>{getInitials(name || '?')}</span>
        </div>
    );
}

/* ══════════════ BOOK CARD ══════════════ */
function BookCard({ book, badge, owned }) {
    const thumb = getThumbnailUrl(book);
    const navId = book.firestoreId || book.bookId ||
        String(book.id || '').replace('firestore-', '').replace('nb-', '').replace('lb-', '');
    if (!navId) return null;
    return (
        <Link href={`/book/preview?id=${navId}`} style={{ textDecoration: 'none', display: 'block' }}>
            <div className="bk">
                <div style={{ position: 'relative', background: DARK2, overflow: 'hidden' }}>
                    {thumb && (
                        <img src={thumb} alt={book.title || ''} style={{ width: '100%', aspectRatio: '3/4', objectFit: 'cover', display: 'block' }}
                            onError={e => { e.target.style.display = 'none'; if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex'; }} />
                    )}
                    <div style={{ display: thumb ? 'none' : 'flex', width: '100%', aspectRatio: '3/4', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 6, background: DARK2 }}>
                        <BookOpen size={22} style={{ color: MUTED }} />
                        <span style={{ fontSize: 9, color: MUTED, textAlign: 'center', padding: '0 8px' }}>{(book.title || '').slice(0, 28)}</span>
                    </div>
                    <span className="chip" style={{ position: 'absolute', top: 7, left: 7, background: 'rgba(11,11,15,.78)', color: WHITE }}>
                        <i style={{ width: 5, height: 5, borderRadius: '50%', background: '#22c55e', display: 'inline-block' }} /> PDF
                    </span>
                    {badge && <span className="chip" style={{ position: 'absolute', bottom: 7, left: 7, background: PURPLE, color: WHITE }}>{badge}</span>}
                    {owned && <span className="chip" style={{ position: 'absolute', top: 7, right: 7, background: '#16a34a', color: '#fff' }}>Owned</span>}
                </div>
                <div style={{ padding: '10px 10px 12px' }}>
                    <p className="bk-title">{book.title || book.bookTitle || 'Untitled'}</p>
                    <p className="bk-sub">{book.lecturerTitle ? `${book.lecturerTitle} ` : ''}{book.author || book.sellerName || book.lecturerName || ''}</p>
                    {book.price && !owned && <p style={{ fontSize: 12, fontWeight: 700, color: LIME, margin: '6px 0 0' }}>₦{Number(book.price).toLocaleString()}</p>}
                </div>
            </div>
        </Link>
    );
}

/* ══════════════ AD CARD ══════════════ */
function InlineAdCard({ ad }) {
    const handleClick = async () => {
        const id = ad.adId || ad.id;
        if (id) { try { await updateDoc(doc(db, "promotions", id), { clicks: increment(1) }); } catch { } }
        const link = ad.adLink || ad.link;
        if (link) window.open(link, '_blank');
    };
    const imgSrc = ad.image || ad.imageUrl || ad.coverImage || ad.thumbnail || null;
    const title = ad.title || ad.bookTitle || ad.name || 'Sponsored';
    const author = ad.author || ad.sponsor || ad.sellerName || 'Sponsored content';
    return (
        <div onClick={handleClick} className="bk" style={{ cursor: 'pointer' }}>
            <div style={{ position: 'relative', background: DARK2, overflow: 'hidden' }}>
                {imgSrc
                    ? <img src={imgSrc} alt={title} style={{ width: '100%', aspectRatio: '3/4', objectFit: 'cover', display: 'block' }} onError={e => e.target.style.display = 'none'} />
                    : <div style={{ width: '100%', aspectRatio: '3/4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><BookOpen size={22} style={{ color: MUTED }} /></div>}
                <span className="chip" style={{ position: 'absolute', top: 7, left: 7, background: PURPLE, color: WHITE }}>Sponsored</span>
            </div>
            <div style={{ padding: '10px 10px 12px' }}>
                <p className="bk-title">{title}</p>
                <p className="bk-sub">{author}</p>
            </div>
        </div>
    );
}

/* ══════════════ ACTIVE STUDENT ROW ══════════════ */
function ActiveStudentRow({ student }) {
    return (
        <div className="row-item" style={{ cursor: 'default' }}>
            <div style={{ position: 'relative' }}>
                <Avatar name={student.name} src={student.photoURL} size={34} />
                <i style={{ position: 'absolute', bottom: 0, right: 0, width: 9, height: 9, borderRadius: '50%', background: '#22c55e', border: `2px solid ${DARK}` }} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
                <p className="row-title">{student.name}</p>
                <p className="row-sub">{student.university || 'Student'}</p>
            </div>
        </div>
    );
}

/* ══════════════ TILE ══════════════ */
function Tile({ cls = '', title, sub, action, children, pad = true }) {
    return (
        <section className={`tile ${cls}`} style={pad ? undefined : { padding: 0 }}>
            {(title || action) && (
                <div className="tile-head" style={pad ? undefined : { padding: '18px 18px 0' }}>
                    <div style={{ minWidth: 0 }}>
                        {title && <h3 className="tile-title">{title}</h3>}
                        {sub && <p className="tile-sub">{sub}</p>}
                    </div>
                    {action}
                </div>
            )}
            {children}
        </section>
    );
}

/* ══════════════ MAIN ══════════════ */
export default function StudentDashboardClient() {
    const router = useRouter();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('home');
    const [library, setLibrary] = useState([]);
    const [wishlist, setWishlist] = useState([]);
    const [sellerStats, setSellerStats] = useState(null);
    const [lecturerBooks, setLecturerBooks] = useState([]);
    const [lecturers, setLecturers] = useState([]);
    const [latestBooks, setLatestBooks] = useState([]);
    const [aiSessions, setAiSessions] = useState([]);
    const [weekActivity, setWeekActivity] = useState([]);
    const [activeStudents, setActiveStudents] = useState([]);
    const [campusBooks, setCampusBooks] = useState([]);
    const [selectedLecturer, setSelectedLecturer] = useState(null);
    const [showAllLecturers, setShowAllLecturers] = useState(false);
    const [pendingBounties, setPendingBounties] = useState([]);
    const [approvalBounty, setApprovalBounty] = useState(null);
    const [prompt, setPrompt] = useState('');
    const goldAds = useAds("Gold", 3);
    const silverAds = useAds("Silver", 2);
    const bronzeAds = useAds("Bronze", 2);

    useEffect(() => {
        const unsub = onAuthStateChanged(auth, async (u) => {
            if (u) await fetchAll(u.uid);
            else router.push('/signin');
        });
        return () => unsub();
    }, [router]);

    const fetchAll = async (uid) => {
        try {
            setLoading(true);
            const userDoc = await getDoc(doc(db, 'users', uid));
            if (!userDoc.exists()) { router.push('/signin'); return; }
            const ud = userDoc.data();
            setUser({ uid, ...ud });

            if (ud.purchasedBooks) setLibrary(
                Object.values(ud.purchasedBooks).map(b => ({
                    ...b, title: b.title || b.bookTitle || '', firestoreId: b.bookId || b.firestoreId || '',
                }))
            );
            if (ud.savedBooks) setWishlist(Object.values(ud.savedBooks));

            if (ud.isSeller) {
                try { const sd = await getDoc(doc(db, 'sellers', uid)); if (sd.exists()) setSellerStats(sd.data()); } catch { }
            }

            /* AI sessions + last-7-days activity */
            try {
                const ss = await getDocs(query(collection(db, 'ai_chat_sessions'), where('userId', '==', uid)));
                const all = ss.docs.map(d => ({ id: d.id, ...d.data() }))
                    .sort((a, b) => (b.updatedAt?.toDate?.()?.getTime() || 0) - (a.updatedAt?.toDate?.()?.getTime() || 0));
                setAiSessions(all.slice(0, 6));
                const days = Array.from({ length: 7 }, (_, i) => {
                    const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - (6 - i)); return d;
                });
                const counts = days.map(() => 0);
                all.forEach(s => {
                    const t = s.updatedAt?.toDate?.();
                    if (!t) return;
                    const idx = days.findIndex(d => t >= d && t < new Date(d.getTime() + 86400000));
                    if (idx > -1) counts[idx]++;
                });
                setWeekActivity(days.map((d, i) => ({
                    label: d.toLocaleDateString('en', { weekday: 'narrow' }), count: counts[i], today: i === 6,
                })));
            } catch { }

            /* Active students */
            try {
                const ss = await getDocs(query(collection(db, 'users'), where('isStudent', '==', true), limit(40)));
                setActiveStudents(ss.docs.map(d => {
                    const data = d.data();
                    return {
                        id: d.id,
                        name: data.displayName || `${data.firstName || ''} ${data.surname || ''}`.trim() || 'Student',
                        photoURL: data.photoBase64 || data.photoURL || null,
                        university: data.university || data.institution || '',
                    };
                }).filter(s => s.name && s.name !== 'Student' && s.id !== uid).slice(0, 10));
            } catch { }

            /* Lecturers */
            const TITLES = ['Lecturer', 'Dr.', 'Prof.', 'Professor', 'Engr.', 'Pharm.', 'Barr.'];
            const seenIds = new Set(); const rawLecs = [];
            for (const title of TITLES) {
                try {
                    const snap = await getDocs(query(collection(db, 'sellers'), where('title', '==', title)));
                    const fresh = snap.docs.filter(d => !seenIds.has(d.id));
                    fresh.forEach(d => seenIds.add(d.id));
                    const items = await Promise.all(fresh.map(async d => {
                        const data = d.data();
                        let photo = null;
                        try {
                            const u2 = await getDoc(doc(db, 'users', d.id));
                            if (u2.exists()) { const x = u2.data(); photo = x.photoBase64 || x.photoURL || x.profilePicture || null; }
                        } catch { }
                        return {
                            sellerId: d.id, slug: data.slug || null, sellerName: data.sellerName || 'Lecturer',
                            title: data.title || '', department: data.department || data.faculty || '',
                            university: data.university || data.institution || '', uploadedBooks: 0, photo,
                        };
                    }));
                    rawLecs.push(...items);
                } catch { }
            }
            await Promise.all(rawLecs.map(async l => {
                try {
                    const bq = query(collection(db, 'advertMyBook'), where('sellerId', '==', l.sellerId), where('status', '==', 'approved'));
                    l.uploadedBooks = (await getDocs(bq)).size;
                } catch { }
            }));
            rawLecs.sort((a, b) => b.uploadedBooks - a.uploadedBooks);
            setLecturers(rawLecs);

            if (seenIds.size > 0) {
                const idArr = [...seenIds]; const lecBooks = [];
                for (let i = 0; i < idArr.length; i += 30) {
                    const batch = idArr.slice(i, i + 30);
                    try {
                        const snap = await getDocs(query(collection(db, 'advertMyBook'), where('status', '==', 'approved'), where('sellerId', 'in', batch)));
                        snap.docs.forEach(d => {
                            const data = d.data(); const lec = rawLecs.find(l => l.sellerId === data.sellerId);
                            lecBooks.push({
                                ...data, id: `lb-${d.id}`, firestoreId: d.id,
                                title: data.bookTitle || data.title || '',
                                lecturerName: lec?.sellerName || data.sellerName || '',
                                lecturerTitle: lec?.title || '',
                            });
                        });
                    } catch { }
                }
                const seen2 = new Set();
                setLecturerBooks(lecBooks.filter(b => { if (seen2.has(b.firestoreId)) return false; seen2.add(b.firestoreId); return true; })
                    .sort((a, b) => (b.createdAt?.toDate?.()?.getTime() || 0) - (a.createdAt?.toDate?.()?.getTime() || 0)).slice(0, 10));
            }

            try {
                const bs = await getDocs(query(collection(db, 'bounties'), where('postedById', '==', uid), where('status', '==', 'pending_approval')));
                setPendingBounties(bs.docs.map(d => ({ id: d.id, ...d.data() })));
            } catch { }

            try {
                const bs = await getDocs(query(collection(db, 'advertMyBook'), where('status', '==', 'approved')));
                const seen3 = new Set();
                setLatestBooks(bs.docs.filter(d => !seenIds.has(d.data().sellerId))
                    .map(d => ({ ...d.data(), id: `nb-${d.id}`, firestoreId: d.id, title: d.data().bookTitle || d.data().title || '' }))
                    .filter(b => { if (seen3.has(b.firestoreId)) return false; seen3.add(b.firestoreId); return true; })
                    .sort((a, b) => (b.createdAt?.toDate?.()?.getTime() || 0) - (a.createdAt?.toDate?.()?.getTime() || 0)).slice(0, 10));
            } catch { }

            try {
                const bs = await getDocs(query(collection(db, 'advertMyBook'), where('status', '==', 'approved'), orderBy('createdAt', 'desc'), limit(8)));
                setCampusBooks(bs.docs.map(d => ({ ...d.data(), firestoreId: d.id, title: d.data().bookTitle || d.data().title || '' })));
            } catch { }
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const askAI = (e) => {
        e.preventDefault();
        const q = prompt.trim();
        router.push(q ? `/ai-chat?prompt=${encodeURIComponent(q)}` : '/ai-chat');
    };

    if (loading) return (
        <div style={{ minHeight: '100vh', background: VOID, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
            <div style={{ textAlign: 'center' }}>
                <div style={{ width: 48, height: 48, border: `3px solid ${PURPLE}`, borderTopColor: LIME, borderRadius: '50%', animation: 'spin .8s linear infinite', margin: '0 auto 14px' }} />
                <p style={{ fontFamily: "'Syne',sans-serif", fontSize: 15, color: WHITE, margin: 0 }}>Loading your dashboard…</p>
            </div>
        </div>
    );

    const displayName = user?.displayName || `${user?.firstName || ''} ${user?.surname || ''}`.trim() || 'Scholar';
    const weekMax = Math.max(1, ...weekActivity.map(d => d.count));
    const weekTotal = weekActivity.reduce((s, d) => s + d.count, 0);

    const chips = library.length > 0
        ? library.slice(0, 3).map(b => ({
            label: `Summarise ${(b.title || 'this book').slice(0, 26)}`,
            href: `/ai-chat?bookId=${b.bookId || b.firestoreId || b.id}&bookTitle=${encodeURIComponent(b.title || '')}`,
        }))
        : [
            { label: 'Explain a hard concept', href: `/ai-chat?prompt=${encodeURIComponent('Explain a hard concept to me simply')}` },
            { label: 'Build an exam study plan', href: `/ai-chat?prompt=${encodeURIComponent('Help me build an exam study plan')}` },
        ];

    const AllAdsRail = ({ tier, max }) => <FeaturedAdsCarousel tier={tier} maxAds={max} autoPlay={true} />;

    /* ── shared: pending bounty review list ── */
    const renderPending = () => pendingBounties.length > 0 && (
        <Tile cls="b-12" title="Bounties awaiting your review" sub="Action required">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {pendingBounties.map(b => (
                    <div key={b.id} className="row-item" style={{ border: `1px solid ${PURPLE}`, background: DARK2 }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <p className="row-title">{b.title}</p>
                            <p className="row-sub">Submitted by <strong style={{ color: WHITE }}>{b.claimedByName || 'Author'}</strong> · ₦{Number(b.reward).toLocaleString()} in escrow</p>
                        </div>
                        <button onClick={() => setApprovalBounty({ id: b.id, data: b })} className="btn-purple">Review</button>
                    </div>
                ))}
            </div>
        </Tile>
    );

    /* ════════ HOME ════════ */
    const renderHome = () => (
        <div className="bento">
            {/* AI command tile */}
            <Tile cls="b-8 ai-tile">
                <div className="glow" />
                <div style={{ position: 'relative' }}>
                    <p style={{ fontSize: 13, color: MUTED, margin: '0 0 6px' }}>
                        {greeting()}{user?.university ? ` · ${user.university}` : ''}
                    </p>
                    <h2 className="hero-h">
                        What are we studying,<br /><span style={{ color: LIME }}>{user?.firstName || 'Scholar'}?</span>
                    </h2>
                    <form onSubmit={askAI} className="cmd">
                        <Sparkles size={16} style={{ color: PURPLEL, flexShrink: 0 }} />
                        <input value={prompt} onChange={e => setPrompt(e.target.value)} placeholder="Ask your AI tutor anything…" aria-label="Ask your AI tutor" />
                        <button type="submit" aria-label="Send" className="cmd-send"><Send size={14} /></button>
                    </form>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
                        {chips.map(c => (
                            <Link key={c.label} href={c.href} className="pill">{c.label}</Link>
                        ))}
                    </div>
                </div>
            </Tile>

            {/* Week + numbers */}
            <Tile cls="b-4" title="This week" sub={weekTotal > 0 ? `${weekTotal} AI session${weekTotal !== 1 ? 's' : ''}` : 'No AI sessions yet'}>
                <div className="bars" aria-label="AI sessions in the last 7 days">
                    {weekActivity.map((d, i) => (
                        <div key={i} className="bar-col">
                            <div className="bar" style={{ height: `${Math.max(6, (d.count / weekMax) * 64)}px`, background: d.today ? LIME : d.count ? PURPLEL : 'rgba(248,248,255,.1)' }} />
                            <span style={{ color: d.today ? LIME : MUTED }}>{d.label}</span>
                        </div>
                    ))}
                </div>
                <div className="stat3">
                    {[
                        { icon: BookOpen, v: library.length, l: 'Books', c: LIME },
                        { icon: Heart, v: wishlist.length, l: 'Saved', c: '#f87171' },
                        { icon: Users, v: activeStudents.length, l: 'Online', c: '#34d399' },
                    ].map(({ icon: Icon, v, l, c }) => (
                        <div key={l}>
                            <Icon size={13} style={{ color: c }} />
                            <b>{v}</b>
                            <span>{l}</span>
                        </div>
                    ))}
                </div>
            </Tile>

            {/* Library rail */}
            {library.length > 0 && (
                <Tile cls="b-12" title="Pick up where you left off" sub="Your library"
                    action={<button onClick={() => setActiveTab('library')} className="slink">Full library <ChevronRight size={12} /></button>}>
                    <div className="rail">
                        {library.slice(0, 8).reduce((acc, b, i) => {
                            acc.push(<BookCard key={b.bookId || i} book={b} owned />);
                            if (i === 1 && goldAds[0]) acc.push(<InlineAdCard key="ad-l0" ad={goldAds[0]} />);
                            if (i === 3 && silverAds[0]) acc.push(<InlineAdCard key="ad-l1" ad={silverAds[0]} />);
                            return acc;
                        }, [])}
                    </div>
                </Tile>
            )}

            {/* Lecturers */}
            {lecturers.length > 0 && (
                <Tile cls="b-5" title="Your lecturers" sub={`${lecturers.length} on LAN`}
                    action={<button onClick={() => setShowAllLecturers(true)} className="slink">View all <ChevronRight size={12} /></button>}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {lecturers.slice(0, 5).map(lec => (
                            <div key={lec.sellerId} className="row-item" onClick={() => setSelectedLecturer(lec)}>
                                <Avatar name={lec.sellerName} src={lec.photo} size={38} />
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <p className="row-title">{lec.title ? `${lec.title} ${lec.sellerName}` : lec.sellerName}</p>
                                    <p className="row-sub">{lec.department || lec.university || 'Faculty'}</p>
                                </div>
                                <span className="count">{lec.uploadedBooks}</span>
                            </div>
                        ))}
                    </div>
                </Tile>
            )}

            {/* Campus pulse */}
            <Tile cls={lecturers.length > 0 ? 'b-7' : 'b-12'} title="Campus pulse" sub="What's new across LAN"
                action={<Link href="/documents" className="slink">All docs <ChevronRight size={12} /></Link>}>
                {campusBooks.length === 0
                    ? <p className="empty"><Activity size={18} /> No activity yet</p>
                    : <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {campusBooks.slice(0, 5).map((b, i) => {
                            const thumb = getThumbnailUrl(b);
                            return (
                                <Link key={b.firestoreId || i} href={`/book/preview?id=${b.firestoreId}`} style={{ textDecoration: 'none' }}>
                                    <div className="row-item">
                                        <div style={{ width: 34, height: 46, background: DARK2, flexShrink: 0, overflow: 'hidden', borderRadius: 6 }}>
                                            {thumb
                                                ? <img src={thumb} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => e.target.style.display = 'none'} />
                                                : <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><BookOpen size={12} style={{ color: MUTED }} /></div>}
                                        </div>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <p className="row-title">{b.title}</p>
                                            <p className="row-sub">{b.sellerName || b.author || ''}{b.category ? ` · ${b.category}` : ''}</p>
                                        </div>
                                        <span style={{ fontSize: 12, fontWeight: 700, color: LIME, flexShrink: 0 }}>₦{Number(b.price || 0).toLocaleString()}</span>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>}
            </Tile>

            {/* Faculty uploads rail */}
            {lecturerBooks.length > 0 && (
                <Tile cls="b-12" title="New from lecturers" sub="Faculty uploads"
                    action={<Link href="/documents?filter=lecturer" className="slink">Browse all <ChevronRight size={12} /></Link>}>
                    <div className="rail">
                        {lecturerBooks.slice(0, 8).reduce((acc, b, i) => {
                            acc.push(<BookCard key={b.firestoreId || i} book={b} badge="Lecturer" />);
                            if (i === 1 && silverAds[1]) acc.push(<InlineAdCard key="ad-f0" ad={silverAds[1]} />);
                            return acc;
                        }, [])}
                    </div>
                </Tile>
            )}

            {/* Just added rail */}
            {latestBooks.length > 0 && (
                <Tile cls="b-12" title="Just added" sub="Fresh uploads"
                    action={<Link href="/documents" className="slink">All books <ChevronRight size={12} /></Link>}>
                    <div className="rail">
                        {latestBooks.slice(0, 8).reduce((acc, b, i) => {
                            acc.push(<BookCard key={b.firestoreId || i} book={b} />);
                            if (i === 1 && goldAds[1]) acc.push(<InlineAdCard key="ad-n0" ad={goldAds[1]} />);
                            if (i === 3 && bronzeAds[0]) acc.push(<InlineAdCard key="ad-n1" ad={bronzeAds[0]} />);
                            return acc;
                        }, [])}
                    </div>
                </Tile>
            )}

            {/* Tools */}
            <div className="b-12 tools">
                {[
                    { icon: Sparkles, label: 'AI book chat', sub: 'Ask about your books', href: '/students/ai-tutor', hot: true },
                    { icon: FileText, label: 'My library', sub: 'Summarise and save', href: '/students/my-library' },
                    { icon: BookCopy, label: 'Past questions', sub: 'Exam prep', href: '/students/past-questions' },
                    { icon: Users, label: 'Study groups', sub: 'Learn with peers', href: '/students/study-groups' },
                ].map(({ icon: Icon, label, sub, href, hot }) => (
                    <Link key={label} href={href} style={{ textDecoration: 'none' }}>
                        <div className={`tool${hot ? ' hot' : ''}`}>
                            <Icon size={18} style={{ color: hot ? VOID : LIME }} />
                            <p style={{ color: hot ? VOID : WHITE }}>{label}</p>
                            <span style={{ color: hot ? 'rgba(11,11,15,.65)' : MUTED }}>{sub}</span>
                        </div>
                    </Link>
                ))}
            </div>

            {/* Network */}
            <Tile cls="b-12 net-tile">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
                    <div style={{ flex: '1 1 260px', minWidth: 0 }}>
                        <h3 className="tile-title" style={{ fontSize: 20 }}>Meet your <span style={{ color: LIME }}>network</span></h3>
                        <p className="tile-sub" style={{ maxWidth: 420, marginTop: 6 }}>
                            See who is studying what, find study groups and connect with peers{user?.university ? ` at ${user.university}` : ''} and beyond.
                        </p>
                        <Link href="/students/network" style={{ textDecoration: 'none', display: 'inline-block', marginTop: 14 }}>
                            <button className="btn-lime"><Users size={13} /> Explore the network <ArrowRight size={12} /></button>
                        </Link>
                    </div>
                    {activeStudents.length > 0 && (
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                            {activeStudents.slice(0, 5).map((s, i) => (
                                <div key={s.id} style={{ marginLeft: i ? -10 : 0 }}><Avatar name={s.name} src={s.photoURL} size={38} /></div>
                            ))}
                            {activeStudents.length > 5 && <span style={{ marginLeft: 10, fontSize: 12, fontWeight: 700, color: LIME }}>+{activeStudents.length - 5}</span>}
                        </div>
                    )}
                </div>
            </Tile>

            {/* Earn / Studio */}
            <Tile cls="b-6" title={user?.isSeller ? 'Author studio' : 'Earn on LAN'} sub={user?.isSeller ? 'Your earnings' : 'Keep 80% of every sale'}>
                {user?.isSeller ? (
                    <>
                        <p style={{ fontFamily: "'Syne',sans-serif", fontSize: 30, fontWeight: 800, color: WHITE, margin: '0 0 2px' }}>₦{(sellerStats?.accountBalance || 0).toLocaleString()}</p>
                        <p className="tile-sub">{sellerStats?.totalSales || sellerStats?.booksSold || 0} total sales</p>
                        <div style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
                            <Link href="/upload-document"><button className="btn-lime">Upload</button></Link>
                            <Link href="/my-account/seller-account"><button className="btn-ghost">Studio</button></Link>
                        </div>
                    </>
                ) : (
                    <>
                        <p className="tile-sub" style={{ maxWidth: 300 }}>Turn your notes into cash. Join 500+ student authors already selling.</p>
                        <Link href="/become-seller" style={{ display: 'inline-block', marginTop: 14 }}><button className="btn-lime">Start selling</button></Link>
                    </>
                )}
            </Tile>

            {/* Active students */}
            <Tile cls="b-6" title="Active students" sub={`${activeStudents.length} online`}>
                {activeStudents.length === 0
                    ? <p className="empty"><Users size={18} /> No active students right now</p>
                    : <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {activeStudents.slice(0, 4).map(s => <ActiveStudentRow key={s.id} student={s} />)}
                    </div>}
            </Tile>

            <div className="b-12"><AllAdsRail tier="Gold" max={5} /></div>
        </div>
    );

    /* ════════ LIBRARY ════════ */
    const renderLibrary = () => (
        <div className="bento">
            <div className="b-12"><AllAdsRail tier="Gold" max={5} /></div>
            <Tile cls="b-12" title="My library" sub={`${library.length} ${library.length === 1 ? 'book' : 'books'}`}>
                {library.length === 0 ? (
                    <div className="empty-block">
                        <BookOpen size={36} style={{ color: MUTED }} />
                        <h3>Your library is empty</h3>
                        <p>Start building your collection.</p>
                        <Link href="/documents"><button className="btn-purple">Browse documents</button></Link>
                    </div>
                ) : (
                    <div className="grid-books">
                        {library.map((b, i) => <BookCard key={b.bookId || i} book={b} owned />)}
                    </div>
                )}
            </Tile>
            {library.length > 0 && (
                <Tile cls="b-12" title="Chat about your books" sub="AI tutor">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {library.slice(0, 5).map((b, i) => (
                            <Link key={i} href={`/ai-chat?bookId=${b.bookId || b.firestoreId || b.id}&bookTitle=${encodeURIComponent(b.title || '')}`} style={{ textDecoration: 'none' }}>
                                <div className="row-item">
                                    <div className="ico"><Sparkles size={14} style={{ color: PURPLEL }} /></div>
                                    <p className="row-title" style={{ flex: 1 }}>Ask about "{b.title}"</p>
                                    <ArrowRight size={13} style={{ color: LIME }} />
                                </div>
                            </Link>
                        ))}
                    </div>
                </Tile>
            )}
            {user?.uid && (
                <Tile cls="b-12" title="My bounties" sub="Bounty board">
                    <BountyDashboardCard user={user} />
                </Tile>
            )}
            {renderPending()}
        </div>
    );

    /* ════════ AI ════════ */
    const renderAI = () => (
        <div className="bento">
            <Tile cls="b-12 ai-tile">
                <div className="glow" />
                <div style={{ position: 'relative' }}>
                    <h2 className="hero-h" style={{ fontSize: 'clamp(22px,4vw,32px)' }}>Ask anything about <span style={{ color: LIME }}>your books</span></h2>
                    <p className="tile-sub" style={{ margin: '6px 0 0' }}>Summaries, key concepts, exam tips and explanations.</p>
                    <form onSubmit={askAI} className="cmd">
                        <Sparkles size={16} style={{ color: PURPLEL, flexShrink: 0 }} />
                        <input value={prompt} onChange={e => setPrompt(e.target.value)} placeholder="Start a new chat…" aria-label="Start a new chat" />
                        <button type="submit" aria-label="Send" className="cmd-send"><Send size={14} /></button>
                    </form>
                </div>
            </Tile>
            {aiSessions.length > 0 && (
                <Tile cls="b-6" title="Recent conversations" sub="Pick up where you stopped">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {aiSessions.map(s => (
                            <Link key={s.id} href={`/ai-chat?sessionId=${s.id}&bookId=${s.bookId}&bookTitle=${encodeURIComponent(s.bookTitle || '')}`} style={{ textDecoration: 'none' }}>
                                <div className="row-item">
                                    <div className="ico"><MessageSquare size={14} style={{ color: PURPLEL }} /></div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <p className="row-title">{s.title || 'New conversation'}</p>
                                        <p className="row-sub" style={{ color: LIME }}>{s.bookTitle || ''}</p>
                                    </div>
                                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                        <p className="row-sub">{s.messages?.length || 0} msgs</p>
                                        <p className="row-sub" style={{ opacity: .6 }}>{fmtTime(s.updatedAt)}</p>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </Tile>
            )}
            {library.length > 0 && (
                <Tile cls={aiSessions.length > 0 ? 'b-6' : 'b-12'} title="Chat about a book" sub="Quick access">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {library.slice(0, 6).map((b, i) => (
                            <Link key={i} href={`/ai-chat?bookId=${b.bookId || b.firestoreId || b.id}&bookTitle=${encodeURIComponent(b.title || '')}`} style={{ textDecoration: 'none' }}>
                                <div className="row-item">
                                    <div className="ico"><Sparkles size={14} style={{ color: PURPLEL }} /></div>
                                    <p className="row-title" style={{ flex: 1 }}>Ask about "{b.title}"</p>
                                    <ArrowRight size={13} style={{ color: LIME }} />
                                </div>
                            </Link>
                        ))}
                    </div>
                </Tile>
            )}
        </div>
    );

    /* ════════ WISHLIST ════════ */
    const renderWishlist = () => (
        <div className="bento">
            <Tile cls="b-12" title="Saved books" sub={`${wishlist.length} item${wishlist.length !== 1 ? 's' : ''}`}>
                {wishlist.length === 0 ? (
                    <div className="empty-block">
                        <Heart size={36} style={{ color: MUTED }} />
                        <h3>Nothing saved yet</h3>
                        <p>Browse and save books for later.</p>
                        <Link href="/documents"><button className="btn-purple">Browse documents</button></Link>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {wishlist.map((item, i) => {
                            const thumb = getThumbnailUrl(item);
                            const navId = item.bookId || item.firestoreId || item.id;
                            return (
                                <div key={item.id || i} className="row-item" style={{ cursor: 'default', flexWrap: 'wrap' }}>
                                    <div style={{ width: 42, height: 56, background: DARK2, flexShrink: 0, overflow: 'hidden', borderRadius: 6 }}>
                                        {thumb
                                            ? <img src={thumb} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => e.target.style.display = 'none'} />
                                            : <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><BookOpen size={14} style={{ color: MUTED }} /></div>}
                                    </div>
                                    <div style={{ flex: 1, minWidth: 120 }}>
                                        <p className="row-title">{item.title || item.bookTitle}</p>
                                        <p className="row-sub">{item.author || ''}</p>
                                        <p style={{ fontSize: 13, fontWeight: 700, color: LIME, margin: '4px 0 0' }}>₦{Number(item.price || 0).toLocaleString()}</p>
                                    </div>
                                    <div style={{ display: 'flex', gap: 8 }}>
                                        <Link href={`/payment?bookId=${navId}`}><button className="btn-purple">Buy</button></Link>
                                        <Link href={`/book/preview?id=${navId}`}><button className="btn-ghost" aria-label="Preview"><Eye size={13} /></button></Link>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </Tile>
        </div>
    );

    /* ════════ BOUNTIES ════════ */
    const renderBounties = () => (
        <div className="bento">
            <Tile cls="b-12" title="My bounties" sub="Bounty board">
                {user?.uid && <BountyDashboardCard user={user} />}
            </Tile>
            {renderPending()}
        </div>
    );

    const NAV = [
        { id: 'home', icon: LayoutDashboard, label: 'Home' },
        { id: 'library', icon: LibraryBig, label: 'Library' },
        { id: 'ai', icon: Sparkles, label: 'AI' },
        { id: 'wishlist', icon: Heart, label: 'Saved' },
        { id: 'bounties', icon: Zap, label: 'Bounties' },
    ];

    return (
        <>
            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;700;800&family=Space+Grotesk:wght@300;400;500;600;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; min-width: 0; }
        body { overflow-x: hidden; background: ${VOID}; }
        .lan-root { font-family:'Space Grotesk',sans-serif; background:${VOID}; min-height:100vh; color:${WHITE}; }
        button { font-family:'Space Grotesk',sans-serif; }

        /* shell */
        .shell { display:flex; max-width:1360px; margin:0 auto; width:100%; }
        .rail-nav { width:84px; flex-shrink:0; display:none; flex-direction:column; align-items:center; gap:6px;
          position:sticky; top:64px; align-self:flex-start; height:calc(100vh - 64px); padding:20px 0;
          border-right:1px solid ${BORDER2}; }
        @media (min-width:1024px) { .rail-nav { display:flex; } }
        .rn-btn { width:60px; padding:9px 0 7px; display:flex; flex-direction:column; align-items:center; gap:4px; border:none;
          background:none; color:${MUTED}; cursor:pointer; border-radius:14px; font-size:10px; font-weight:600; transition:background .15s,color .15s; }
        .rn-btn:hover { background:rgba(124,58,237,.12); color:${WHITE}; }
        .rn-btn.on { background:rgba(163,230,53,.12); color:${LIME}; }
        .rn-btn:focus-visible, .dock-btn:focus-visible, .cmd input:focus-visible { outline:2px solid ${LIME}; outline-offset:2px; }

        .main { flex:1; min-width:0; padding:0 14px 110px; }
        @media (min-width:640px) { .main { padding:0 22px 110px; } }
        @media (min-width:1024px) { .main { padding:24px 28px 48px; } }

        .topbar { display:flex; align-items:center; justify-content:space-between; padding:12px 0; position:sticky; top:0; z-index:40; background:${VOID}; }
        @media (min-width:1024px) { .topbar { display:none; } }

        /* bento */
        .bento { display:grid; grid-template-columns:repeat(12,1fr); gap:14px; }
        .b-12,.b-8,.b-7,.b-6,.b-5,.b-4 { grid-column:span 12; }
        @media (min-width:1024px) {
          .b-8 { grid-column:span 8; } .b-7 { grid-column:span 7; } .b-6 { grid-column:span 6; }
          .b-5 { grid-column:span 5; } .b-4 { grid-column:span 4; }
        }

        .tile { background:${DARK}; border:1px solid ${BORDER2}; border-radius:20px; padding:18px; position:relative; overflow:hidden; }
        .tile-head { display:flex; align-items:flex-start; justify-content:space-between; gap:10px; margin-bottom:14px; }
        .tile-title { font-family:'Syne',sans-serif; font-size:17px; font-weight:800; letter-spacing:-.02em; margin:0; color:${WHITE}; }
        .tile-sub { font-size:12px; color:${MUTED}; margin:3px 0 0; line-height:1.55; }
        .slink { font-size:12px; font-weight:600; color:${MUTED}; text-decoration:none; display:inline-flex; align-items:center; gap:2px; background:none; border:none; cursor:pointer; padding:0; white-space:nowrap; }
        .slink:hover { color:${LIME}; }

        /* AI tile */
        .ai-tile { background:linear-gradient(135deg, ${DARK2} 0%, ${DARK} 70%); border-color:${BORDER}; padding:24px 22px; }
        .glow { position:absolute; top:-80px; right:-60px; width:320px; height:320px; border-radius:50%;
          background:radial-gradient(circle, rgba(124,58,237,.35) 0%, transparent 68%); pointer-events:none; }
        .hero-h { font-family:'Syne',sans-serif; font-size:clamp(26px,5vw,40px); font-weight:800; letter-spacing:-.03em; line-height:1.05; margin:0 0 18px; color:${WHITE}; }
        .cmd { display:flex; align-items:center; gap:10px; background:rgba(11,11,15,.7); border:1px solid ${BORDER}; border-radius:16px; padding:6px 6px 6px 16px;
          backdrop-filter:blur(8px); transition:border-color .15s; margin-top:18px; }
        .cmd:focus-within { border-color:${PURPLEL}; }
        .cmd input { flex:1; background:none; border:none; outline:none; color:${WHITE}; font-size:14px; font-family:'Space Grotesk',sans-serif; padding:10px 0; }
        .cmd input::placeholder { color:${MUTED}; }
        .cmd-send { width:40px; height:40px; border-radius:12px; border:none; background:${LIME}; color:${VOID}; cursor:pointer; display:flex; align-items:center; justify-content:center; flex-shrink:0; transition:background .15s; }
        .cmd-send:hover { background:${LIMEL}; }
        .pill { font-size:12px; font-weight:500; color:${WHITE}; text-decoration:none; padding:7px 13px; border-radius:999px; background:rgba(255,255,255,.06);
          border:1px solid ${BORDER2}; transition:background .15s,border-color .15s; max-width:100%; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
        .pill:hover { background:rgba(124,58,237,.18); border-color:${PURPLE}; }

        /* week bars */
        .bars { display:flex; align-items:flex-end; justify-content:space-between; gap:6px; height:84px; margin-bottom:16px; }
        .bar-col { flex:1; display:flex; flex-direction:column; align-items:center; justify-content:flex-end; gap:6px; height:100%; }
        .bar-col span { font-size:10px; font-weight:600; }
        .bar { width:100%; max-width:26px; border-radius:7px; transition:height .3s; }
        .stat3 { display:grid; grid-template-columns:repeat(3,1fr); gap:8px; border-top:1px solid ${BORDER2}; padding-top:14px; }
        .stat3 > div { display:flex; flex-direction:column; align-items:flex-start; gap:2px; }
        .stat3 b { font-family:'Syne',sans-serif; font-size:20px; font-weight:800; line-height:1.1; margin-top:4px; }
        .stat3 span { font-size:11px; color:${MUTED}; }

        /* rails + cards */
        .rail { display:flex; gap:12px; overflow-x:auto; scroll-snap-type:x proximity; padding-bottom:6px; scrollbar-width:thin; scrollbar-color:${BORDER} transparent; }
        .rail > * { flex:0 0 148px; scroll-snap-align:start; }
        @media (min-width:640px) { .rail > * { flex-basis:164px; } }
        .grid-books { display:grid; grid-template-columns:repeat(auto-fill,minmax(148px,1fr)); gap:14px; }
        .bk { background:${DARK2}; border:1px solid ${BORDER2}; border-radius:14px; overflow:hidden; transition:transform .2s, border-color .2s, box-shadow .2s; height:100%; }
        .bk:hover { transform:translateY(-3px); border-color:${PURPLE}; box-shadow:0 10px 26px rgba(124,58,237,.2); }
        .bk-title { font-family:'Syne',sans-serif; font-size:12px; font-weight:700; color:${WHITE}; margin:0 0 3px; line-height:1.3; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; }
        .bk-sub { font-size:11px; color:${MUTED}; margin:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
        .chip { font-size:9px; font-weight:700; padding:3px 8px; border-radius:999px; display:inline-flex; align-items:center; gap:4px; letter-spacing:.04em; }

        /* rows */
        .row-item { display:flex; align-items:center; gap:12px; padding:10px 12px; background:${DARK2}; border:1px solid ${BORDER2}; border-radius:14px; cursor:pointer; transition:border-color .15s, background .15s; }
        .row-item:hover { border-color:${PURPLE}; background:${DARK3}; }
        .row-title { font-size:13px; font-weight:600; color:${WHITE}; margin:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
        .row-sub { font-size:11px; color:${MUTED}; margin:2px 0 0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
        .count { font-size:12px; font-weight:700; color:${LIME}; background:rgba(163,230,53,.1); padding:3px 10px; border-radius:999px; flex-shrink:0; }
        .ico { width:34px; height:34px; border-radius:10px; background:rgba(124,58,237,.18); display:flex; align-items:center; justify-content:center; flex-shrink:0; }

        /* tools */
        .tools { display:grid; grid-template-columns:repeat(2,1fr); gap:14px; }
        @media (min-width:768px) { .tools { grid-template-columns:repeat(4,1fr); } }
        .tool { background:${DARK}; border:1px solid ${BORDER2}; border-radius:18px; padding:16px; height:100%; transition:transform .2s, border-color .2s; }
        .tool:hover { transform:translateY(-3px); border-color:${PURPLE}; }
        .tool p { font-size:13px; font-weight:700; margin:10px 0 3px; }
        .tool span { font-size:11px; }
        .tool.hot { background:${LIME}; border-color:${LIME}; }
        .tool.hot:hover { background:${LIMEL}; border-color:${LIMEL}; }
        .net-tile { background:linear-gradient(120deg, ${DARK2}, ${DARK}); border-color:${BORDER}; }

        .empty { display:flex; align-items:center; gap:8px; font-size:13px; color:${MUTED}; margin:0; padding:10px 0; }
        .empty-block { text-align:center; padding:36px 16px; display:flex; flex-direction:column; align-items:center; gap:8px; }
        .empty-block h3 { font-family:'Syne',sans-serif; font-size:19px; margin:6px 0 0; }
        .empty-block p { font-size:13px; color:${MUTED}; margin:0 0 10px; }

        /* buttons */
        .btn-lime, .btn-purple, .btn-ghost { display:inline-flex; align-items:center; justify-content:center; gap:6px; padding:10px 18px; border-radius:12px;
          border:none; font-size:12px; font-weight:700; cursor:pointer; transition:background .15s; white-space:nowrap; }
        .btn-lime { background:${LIME}; color:${VOID}; } .btn-lime:hover { background:${LIMEL}; }
        .btn-purple { background:${PURPLE}; color:${WHITE}; } .btn-purple:hover { background:${PURPLED}; }
        .btn-ghost { background:rgba(255,255,255,.07); color:${WHITE}; border:1px solid rgba(255,255,255,.12); } .btn-ghost:hover { background:rgba(255,255,255,.12); }

        /* floating dock (mobile) */
        .dock { position:fixed; left:12px; right:12px; bottom:12px; height:64px; z-index:99999; display:flex; align-items:center; justify-content:space-around;
          background:rgba(24,24,42,.82); backdrop-filter:blur(18px); -webkit-backdrop-filter:blur(18px); border:1px solid ${BORDER}; border-radius:24px; box-shadow:0 12px 40px rgba(0,0,0,.55); padding:0 6px; }
        @media (min-width:1024px) { .dock { display:none; } }
        .dock-btn { flex:1; height:100%; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:3px; background:none; border:none; color:${MUTED}; cursor:pointer; font-size:9px; font-weight:600; -webkit-tap-highlight-color:transparent; }
        .dock-btn.on { color:${LIME}; }
        .fab { width:48px; height:48px; border-radius:16px; background:${LIME}; color:${VOID}; display:flex; align-items:center; justify-content:center; box-shadow:0 6px 18px rgba(163,230,53,.35); }

        /* overlays */
        .overlay { position:fixed; inset:0; background:rgba(0,0,0,.72); backdrop-filter:blur(4px); z-index:999998; }
        .sheet { position:absolute; left:0; right:0; bottom:0; margin:0 auto; width:100%; max-width:560px; max-height:88vh; overflow-y:auto; background:${DARK}; border:1px solid ${BORDER}; border-radius:24px 24px 0 0; animation:slideUp .28s cubic-bezier(.4,0,.2,1) both; }
        .side { position:absolute; top:0; right:0; bottom:0; width:min(420px,100vw); background:${DARK}; overflow-y:auto; animation:slideInRight .28s cubic-bezier(.4,0,.2,1) both; border-left:1px solid ${BORDER}; }
        .x-btn { background:rgba(255,255,255,.07); border:1px solid ${BORDER2}; border-radius:50%; width:32px; height:32px; cursor:pointer; display:flex; align-items:center; justify-content:center; color:${WHITE}; flex-shrink:0; }

        @keyframes spin { to { transform:rotate(360deg); } }
        @keyframes slideUp { from { transform:translateY(100%); opacity:0; } to { transform:translateY(0); opacity:1; } }
        @keyframes slideInRight { from { transform:translateX(100%); opacity:0; } to { transform:translateX(0); opacity:1; } }
        @media (prefers-reduced-motion: reduce) { * { animation:none !important; transition:none !important; } }
      `}</style>

            {/* ══ ALL LECTURERS PANEL ══ */}
            {showAllLecturers && (
                <div className="overlay" onClick={() => setShowAllLecturers(false)}>
                    <div className="side" onClick={e => e.stopPropagation()}>
                        <div style={{ padding: '18px 18px 14px', position: 'sticky', top: 0, background: DARK2, borderBottom: `1px solid ${BORDER}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 2 }}>
                            <h2 style={{ fontFamily: "'Syne',sans-serif", fontSize: 19, fontWeight: 800, margin: 0 }}>All lecturers · <span style={{ color: LIME }}>{lecturers.length}</span></h2>
                            <button onClick={() => setShowAllLecturers(false)} className="x-btn" aria-label="Close"><X size={15} /></button>
                        </div>
                        <div style={{ padding: '12px 14px 32px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {lecturers.map(lec => (
                                <div key={lec.sellerId} className="row-item" onClick={() => { setSelectedLecturer(lec); setShowAllLecturers(false); }}>
                                    <Avatar name={lec.sellerName} src={lec.photo} size={42} />
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <p className="row-title">{lec.title ? `${lec.title} ${lec.sellerName}` : lec.sellerName}</p>
                                        <p className="row-sub">{lec.department || lec.university || 'Faculty'}</p>
                                    </div>
                                    <span className="count">{lec.uploadedBooks}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* ══ LECTURER DETAIL ══ */}
            {selectedLecturer && (() => {
                const lec = selectedLecturer;
                const myBooks = lecturerBooks.filter(b => b.sellerId === lec.sellerId || b.lecturerName === lec.sellerName);
                return (
                    <div className="overlay" style={{ zIndex: 999999 }} onClick={() => setSelectedLecturer(null)}>
                        <div className="sheet" onClick={e => e.stopPropagation()}>
                            <div style={{ background: DARK2, padding: '20px 18px', position: 'sticky', top: 0, zIndex: 2, display: 'flex', alignItems: 'flex-start', gap: 14, borderBottom: `1px solid ${BORDER}` }}>
                                <Avatar name={lec.sellerName} src={lec.photo} size={58} />
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <h2 style={{ fontFamily: "'Syne',sans-serif", fontSize: 18, fontWeight: 800, margin: '0 0 6px', lineHeight: 1.2 }}>
                                        {lec.title ? `${lec.title} ${lec.sellerName}` : lec.sellerName}
                                    </h2>
                                    {lec.department && <p className="row-sub" style={{ whiteSpace: 'normal' }}><BookMarked size={10} style={{ color: LIME, marginRight: 4 }} />{lec.department}</p>}
                                    {lec.university && <p className="row-sub" style={{ whiteSpace: 'normal' }}><GraduationCap size={10} style={{ color: LIME, marginRight: 4 }} />{lec.university}</p>}
                                    <p style={{ fontSize: 12, color: LIME, margin: '8px 0 0', fontWeight: 700 }}>{lec.uploadedBooks} material{lec.uploadedBooks !== 1 ? 's' : ''} uploaded</p>
                                </div>
                                <button onClick={() => setSelectedLecturer(null)} className="x-btn" aria-label="Close"><X size={15} /></button>
                            </div>
                            <div style={{ padding: '16px 16px 28px' }}>
                                <Link href={profileHref(lec)} onClick={() => setSelectedLecturer(null)} style={{ textDecoration: 'none' }}>
                                    <div className="row-item" style={{ justifyContent: 'space-between', marginBottom: 18, background: 'rgba(124,58,237,.15)', borderColor: BORDER }}>
                                        <span style={{ fontSize: 13, fontWeight: 700, color: PURPLEL }}>View full profile</span>
                                        <ChevronRight size={14} style={{ color: LIME }} />
                                    </div>
                                </Link>
                                {myBooks.length > 0 ? (
                                    <div className="grid-books" style={{ gridTemplateColumns: 'repeat(auto-fill,minmax(130px,1fr))' }}>
                                        {myBooks.map((book, bi) => (
                                            <div key={book.firestoreId || bi} onClick={() => setSelectedLecturer(null)}><BookCard book={book} badge="Lecturer" /></div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="empty-block">
                                        <BookOpen size={30} style={{ color: MUTED }} />
                                        <h3>No materials yet</h3>
                                        <p>This lecturer hasn't uploaded any books yet.</p>
                                    </div>
                                )}
                            </div>
                            <FeaturedAdsCarousel tier="Bronze" maxAds={2} autoPlay={true} autoPlayMs={4000} />
                        </div>
                    </div>
                );
            })()}

            <div className="lan-root">
                <Navbar />
                <div className="shell">

                    {/* Desktop rail */}
                    <aside className="rail-nav">
                        <Avatar name={displayName} src={user?.photoBase64 || user?.photoURL} size={40} />
                        <div style={{ margin: '8px 0 10px' }}>{user?.uid && <NotificationBell userId={user.uid} />}</div>
                        {NAV.map(({ id, icon: Icon, label }) => (
                            <button key={id} onClick={() => setActiveTab(id)} className={`rn-btn${activeTab === id ? ' on' : ''}`} aria-label={label}>
                                <Icon size={19} /><span>{label}</span>
                            </button>
                        ))}
                        <div style={{ width: 40, height: 1, background: BORDER2, margin: '8px 0' }} />
                        <Link href="/documents" style={{ textDecoration: 'none' }}><button className="rn-btn" aria-label="Browse all"><Search size={19} /><span>Browse</span></button></Link>
                        <Link href="/my-account" style={{ textDecoration: 'none' }}><button className="rn-btn" aria-label="Profile"><User size={19} /><span>Profile</span></button></Link>
                        {user?.isSeller
                            ? <Link href="/my-account/seller-account" style={{ textDecoration: 'none' }}><button className="rn-btn" style={{ color: LIME }} aria-label="Author studio"><BarChart2 size={19} /><span>Studio</span></button></Link>
                            : <Link href="/become-seller" style={{ textDecoration: 'none' }}><button className="rn-btn" style={{ color: PURPLEL }} aria-label="Become a seller"><Store size={19} /><span>Sell</span></button></Link>}
                        <button onClick={() => { auth.signOut(); router.push('/signin'); }} className="rn-btn" style={{ marginTop: 'auto', color: '#ef4444' }} aria-label="Sign out">
                            <LogOut size={19} /><span>Sign out</span>
                        </button>
                    </aside>

                    <main className="main">
                        {/* Mobile top bar */}
                        <div className="topbar">
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <Avatar name={displayName} src={user?.photoBase64 || user?.photoURL} size={32} />
                                <div>
                                    <p style={{ fontSize: 11, color: MUTED, margin: 0 }}>{greeting()}</p>
                                    <p style={{ fontSize: 14, fontWeight: 700, margin: 0, fontFamily: "'Syne',sans-serif" }}>{user?.firstName || displayName}</p>
                                </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                {user?.uid && <NotificationBell userId={user.uid} />}
                                <Link href="/my-account" aria-label="Profile">
                                    <div style={{ width: 34, height: 34, borderRadius: '50%', background: DARK2, border: `1px solid ${BORDER}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <User size={15} style={{ color: WHITE }} />
                                    </div>
                                </Link>
                            </div>
                        </div>

                        {activeTab === 'home' && renderHome()}
                        {activeTab === 'library' && renderLibrary()}
                        {activeTab === 'ai' && renderAI()}
                        {activeTab === 'wishlist' && renderWishlist()}
                        {activeTab === 'bounties' && renderBounties()}
                    </main>
                </div>

                {/* Floating dock (mobile) */}
                <nav className="dock" aria-label="Bottom navigation">
                    {NAV.slice(0, 2).map(({ id, icon: Icon, label }) => (
                        <button key={id} className={`dock-btn${activeTab === id ? ' on' : ''}`} onClick={() => setActiveTab(id)}><Icon size={20} /><span>{label}</span></button>
                    ))}
                    <Link href="/advertise" aria-label="Upload a document" style={{ textDecoration: 'none', lineHeight: 0, padding: '0 4px' }}>
                        <div className="fab"><Plus size={24} strokeWidth={2.5} /></div>
                    </Link>
                    {NAV.slice(2).map(({ id, icon: Icon, label }) => (
                        <button key={id} className={`dock-btn${activeTab === id ? ' on' : ''}`} onClick={() => setActiveTab(id)}><Icon size={20} /><span>{label}</span></button>
                    ))}
                </nav>
            </div>

            {approvalBounty && (
                <BountyApprovalModal
                    bountyId={approvalBounty.id}
                    bountyData={approvalBounty.data}
                    currentUser={{ uid: user.uid, email: user.email, displayName: user.displayName || `${user.firstName} ${user.surname}` }}
                    onClose={() => setApprovalBounty(null)}
                    onUpdateStatus={() => { setPendingBounties(prev => prev.filter(b => b.id !== approvalBounty.id)); setApprovalBounty(null); }}
                />
            )}
        </>
    );
}