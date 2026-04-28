"use client";

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
    BookOpen, Heart, User, LogOut, Store, Search, Plus,
    Eye, Sparkles, GraduationCap, MessageSquare,
    BookMarked, Zap, Users, ArrowRight, FileText,
    BookCopy, LayoutDashboard, LibraryBig,
    BarChart2, Activity, ChevronRight,
} from 'lucide-react';
import { auth, db } from '@/lib/firebaseConfig';
import {
    doc, getDoc, collection, query, where, getDocs,
    orderBy, limit, serverTimestamp,
} from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import Link from 'next/link';
import Navbar from '@/components/NavBar';

/* ─── Design tokens ─── */
const NAVY  = "#0d2244";
const GOLD  = "#b8963e";
const GOLDD = "#d4aa5a";
const CREAM = "#f5f0e8";
const BG    = "#f5f1ea";

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
    { bg: NAVY, text: GOLDD }, { bg: "#1a3a5c", text: CREAM },
    { bg: "#2c1810", text: GOLDD }, { bg: "#1a2c1a", text: "#a8d5a2" },
    { bg: "#2c1a2c", text: GOLDD }, { bg: "#0a2233", text: "#7eccd4" },
];
const getPalette  = (n = "?") => PALETTES[n.charCodeAt(0) % PALETTES.length];
const getInitials = (n = "?") => {
    const p = n.trim().split(' ').filter(Boolean);
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

/* ─── Avatar ─── */
function Avatar({ name, src, size = 36 }) {
    const pal = getPalette(name || '?');
    const ini = getInitials(name || '?');
    const [err, setErr] = useState(false);
    if (src && !err) return (
        <img src={src} alt={name} onError={() => setErr(true)}
            style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover',
                border: `1.5px solid ${GOLD}`, flexShrink: 0 }} />
    );
    return (
        <div style={{ width: size, height: size, borderRadius: '50%', background: pal.bg, flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: `1.5px solid rgba(184,150,62,.3)` }}>
            <span style={{ color: pal.text, fontSize: size * 0.33, fontWeight: 700,
                fontFamily: "'Playfair Display',serif" }}>{ini}</span>
        </div>
    );
}

/* ─── BookCard ─── */
function BookCard({ book, badge, owned }) {
    const thumb = getThumbnailUrl(book);
    const navId = book.firestoreId || book.bookId ||
        String(book.id || '').replace('firestore-','').replace('nb-','').replace('lb-','');
    if (!navId) return null;
    return (
        <Link href={`/book/preview?id=${navId}`} style={{ textDecoration: 'none', display: 'block' }}>
            <div className="book-card">
                <div style={{ position: 'relative', background: '#ede8df', overflow: 'hidden' }}>
                    {thumb
                        ? <img src={thumb} alt={book.title || ''} style={{ width: '100%', aspectRatio: '3/4', objectFit: 'cover', display: 'block' }}
                            onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }} />
                        : null
                    }
                    <div style={{ display: thumb ? 'none' : 'flex', width: '100%', aspectRatio: '3/4',
                        alignItems: 'center', justifyContent: 'center', background: '#ede8df',
                        flexDirection: 'column', gap: 6 }}>
                        <BookOpen size={24} style={{ color: '#ccc' }} />
                        <span style={{ fontSize: 9, color: '#bbb', textAlign: 'center', padding: '0 8px',
                            fontFamily: "'Lato',sans-serif" }}>{(book.title || '').slice(0,28)}</span>
                    </div>
                    <div style={{ position: 'absolute', top: 6, left: 6, background: NAVY, color: '#fff',
                        fontSize: 7, fontWeight: 700, padding: '2px 6px', letterSpacing: '.06em',
                        display: 'flex', alignItems: 'center', gap: 3, fontFamily: "'Lato',sans-serif" }}>
                        <span style={{ width: 4, height: 4, borderRadius: '50%', background: '#22c55e', display: 'inline-block' }} />PDF
                    </div>
                    {badge && <div style={{ position: 'absolute', bottom: 6, left: 6, background: GOLD,
                        color: NAVY, fontSize: 7, fontWeight: 700, padding: '2px 6px',
                        fontFamily: "'Lato',sans-serif", letterSpacing: '.06em' }}>{badge}</div>}
                    {owned && <div style={{ position: 'absolute', top: 6, right: 6, background: '#16a34a',
                        color: '#fff', fontSize: 7, fontWeight: 700, padding: '2px 6px',
                        fontFamily: "'Lato',sans-serif" }}>OWNED</div>}
                </div>
                <div style={{ padding: '9px 9px 11px', borderTop: '0.5px solid #f0ebe0' }}>
                    <p style={{ fontFamily: "'Playfair Display',serif", fontSize: 11, fontWeight: 700,
                        color: NAVY, margin: '0 0 3px', display: '-webkit-box', WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: 1.3 }}>
                        {book.title || book.bookTitle || 'Untitled'}
                    </p>
                    <p style={{ fontSize: 9, color: '#888', margin: '0 0 5px', overflow: 'hidden',
                        textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: "'Lato',sans-serif" }}>
                        {book.lecturerTitle ? `${book.lecturerTitle} ` : ''}{book.author || book.sellerName || book.lecturerName || ''}
                    </p>
                    {book.price && !owned && (
                        <p style={{ fontSize: 10, fontWeight: 700, color: NAVY, margin: 0,
                            fontFamily: "'Lato',sans-serif" }}>₦{Number(book.price).toLocaleString()}</p>
                    )}
                </div>
            </div>
        </Link>
    );
}

/* ─── LecturerCard ─── */
function LecturerCard({ lecturer }) {
    const pal = getPalette(lecturer.sellerName || '?');
    const ini = getInitials(lecturer.sellerName || '?');
    const name = lecturer.sellerName || 'Lecturer';
    const title = lecturer.title?.toLowerCase().includes('lecturer') ? 'Lecturer' : lecturer.title;
    const href = `/seller-profile?sellerId=${lecturer.sellerId}`;
    const photo = lecturer.photo || null;
    return (
        <div className="lec-card">
            <div style={{ position: 'relative', overflow: 'hidden' }}>
                {photo
                    ? <img src={photo} alt={name} className="lec-img"
                        style={{ width: '100%', aspectRatio: '4/3', objectFit: 'cover', objectPosition: 'top', display: 'block' }} />
                    : <div style={{ width: '100%', aspectRatio: '4/3', background: pal.bg,
                        display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ color: pal.text, fontSize: 36, fontFamily: "'Playfair Display',serif", fontWeight: 900 }}>{ini}</span>
                      </div>
                }
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 48,
                    background: 'linear-gradient(to top,rgba(13,34,68,.6),transparent)', pointerEvents: 'none' }} />
                {lecturer.title && (
                    <div style={{ position: 'absolute', bottom: 7, left: 7, background: NAVY, color: GOLDD,
                        fontSize: 8, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase',
                        padding: '2px 8px', fontFamily: "'Lato',sans-serif",
                        display: 'flex', alignItems: 'center', gap: 3 }}>
                        <GraduationCap size={7} />{title}
                    </div>
                )}
            </div>
            <div style={{ padding: '11px 11px 13px' }}>
                <Link href={href} style={{ textDecoration: 'none' }}>
                    <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: 12, fontWeight: 700,
                        color: NAVY, margin: '0 0 4px', lineHeight: 1.3, display: '-webkit-box',
                        WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {lecturer.title ? `${lecturer.title} ${name}` : name}
                    </h3>
                </Link>
                {lecturer.department && (
                    <p style={{ fontSize: 10, color: '#888', margin: '0 0 2px', overflow: 'hidden',
                        textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: "'Lato',sans-serif",
                        display: 'flex', alignItems: 'center', gap: 3 }}>
                        <BookMarked size={7} style={{ color: GOLD, flexShrink: 0 }} />{lecturer.department}
                    </p>
                )}
                {lecturer.university && (
                    <p style={{ fontSize: 9, color: '#aaa', margin: '0 0 9px', overflow: 'hidden',
                        textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: "'Lato',sans-serif",
                        display: 'flex', alignItems: 'center', gap: 3 }}>
                        <GraduationCap size={7} style={{ color: GOLD, flexShrink: 0 }} />{lecturer.university}
                    </p>
                )}
                <div style={{ borderTop: '0.5px solid #f0ebe0', paddingTop: 8,
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 9, color: '#888', display: 'flex', alignItems: 'center',
                        gap: 3, fontFamily: "'Lato',sans-serif" }}>
                        <BookOpen size={8} style={{ color: NAVY }} />
                        <strong style={{ color: NAVY }}>{lecturer.uploadedBooks || 0}</strong> files
                    </span>
                    <Link href={href} style={{ fontSize: 8, fontWeight: 700, color: NAVY, textDecoration: 'none',
                        display: 'flex', alignItems: 'center', gap: 2, letterSpacing: '.08em',
                        textTransform: 'uppercase', fontFamily: "'Lato',sans-serif" }}>
                        Profile <ChevronRight size={9} />
                    </Link>
                </div>
            </div>
        </div>
    );
}

/* ─── ActiveStudentRow ─── */
function ActiveStudentRow({ student, rank }) {
    const rankColors = ['#b8963e','#aaa','#cd7f32'];
    const rankBg = rank < 3
        ? `rgba(${rank===0?'184,150,62':rank===1?'170,170,170':'205,127,50'},.1)`
        : 'rgba(13,34,68,.04)';
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '9px 0',
            borderBottom: '0.5px solid #f0ebe0' }}>
            <div style={{ width: 22, height: 22, borderRadius: '50%', background: rankBg, flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: 9, fontWeight: 700, color: rankColors[rank] || '#888',
                    fontFamily: "'Lato',sans-serif" }}>{rank + 1}</span>
            </div>
            <Avatar name={student.name} src={student.photoURL} size={30} />
            <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: NAVY, margin: 0, overflow: 'hidden',
                    textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: "'Lato',sans-serif" }}>
                    {student.name}
                </p>
                <p style={{ fontSize: 9, color: '#aaa', margin: 0, fontFamily: "'Lato',sans-serif",
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {student.university || 'Student'}
                </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#16a34a' }} />
                <span style={{ fontSize: 9, color: '#16a34a', fontWeight: 700,
                    fontFamily: "'Lato',sans-serif" }}>Active</span>
            </div>
        </div>
    );
}

/* ════════════════════════════════════════════════════════════
   MAIN COMPONENT
════════════════════════════════════════════════════════════ */
export default function StudentDashboardClient() {
    const router = useRouter();
    const [user,           setUser]           = useState(null);
    const [loading,        setLoading]        = useState(true);
    const [activeTab,      setActiveTab]      = useState('home');
    const [library,        setLibrary]        = useState([]);
    const [wishlist,       setWishlist]       = useState([]);
    const [sellerStats,    setSellerStats]    = useState(null);
    const [lecturerBooks,  setLecturerBooks]  = useState([]);
    const [lecturers,      setLecturers]      = useState([]);
    const [latestBooks,    setLatestBooks]    = useState([]);
    const [aiSessions,     setAiSessions]     = useState([]);
    const [activeStudents, setActiveStudents] = useState([]);
    const [campusBooks,    setCampusBooks]    = useState([]);

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
            const ud = userDoc.data();
            setUser({ uid, ...ud });

            if (ud.purchasedBooks) setLibrary(
                Object.values(ud.purchasedBooks).map(b => ({
                    ...b, title: b.title || b.bookTitle || '',
                    firestoreId: b.bookId || b.firestoreId || '',
                }))
            );
            if (ud.savedBooks) setWishlist(Object.values(ud.savedBooks));

            if (ud.isSeller) {
                try { const sd = await getDoc(doc(db,'sellers',uid)); if(sd.exists()) setSellerStats(sd.data()); } catch{}
            }

            try {
                const sq = query(collection(db,'ai_chat_sessions'), where('userId','==',uid));
                const ss = await getDocs(sq);
                setAiSessions(ss.docs.map(d=>({id:d.id,...d.data()}))
                    .sort((a,b)=>(b.updatedAt?.toDate?.()?.getTime()||0)-(a.updatedAt?.toDate?.()?.getTime()||0))
                    .slice(0,6));
            } catch{}

            try {
                const sq = query(collection(db,'users'), where('isStudent','==',true), limit(40));
                const ss = await getDocs(sq);
                setActiveStudents(ss.docs.map(d=>{
                    const data=d.data();
                    return { id:d.id,
                        name: data.displayName||`${data.firstName||''} ${data.surname||''}`.trim()||'Student',
                        photoURL: data.photoBase64||data.photoURL||null,
                        university: data.university||data.institution||'',
                    };
                }).filter(s=>s.name&&s.name!=='Student').slice(0,10));
            } catch{}

            const TITLES = ['Lecturer','Dr.','Prof.','Professor'];
            const seenIds = new Set();
            const rawLecs = [];
            for (const title of TITLES) {
                try {
                    const snap = await getDocs(query(collection(db,'sellers'), where('title','==',title)));
                    for (const d of snap.docs) {
                        if (seenIds.has(d.id)) continue;
                        seenIds.add(d.id);
                        const data = d.data();
                        let photo = null;
                        try {
                            const ud2 = await getDoc(doc(db,'users',d.id));
                            if (ud2.exists()) { const u2=ud2.data(); photo=u2.photoBase64||u2.photoURL||u2.profilePicture||null; }
                        } catch{}
                        rawLecs.push({ sellerId:d.id, sellerName:data.sellerName||'Lecturer',
                            title:data.title||'', department:data.department||data.faculty||'',
                            university:data.university||data.institution||'', uploadedBooks:0, photo });
                    }
                } catch{}
            }
            await Promise.all(rawLecs.map(async l=>{
                try { const bq=query(collection(db,'advertMyBook'),where('sellerId','==',l.sellerId),where('status','==','approved')); l.uploadedBooks=(await getDocs(bq)).size; } catch{}
            }));
            rawLecs.sort((a,b)=>b.uploadedBooks-a.uploadedBooks);
            setLecturers(rawLecs);

            if (seenIds.size > 0) {
                const idArr=[...seenIds]; let lecBooks=[];
                for (let i=0;i<idArr.length;i+=30) {
                    const batch=idArr.slice(i,i+30);
                    try {
                        const snap=await getDocs(query(collection(db,'advertMyBook'),where('status','==','approved'),where('sellerId','in',batch)));
                        snap.docs.forEach(d=>{
                            const data=d.data();
                            const lec=rawLecs.find(l=>l.sellerId===data.sellerId);
                            lecBooks.push({...data, id:`lb-${d.id}`, firestoreId:d.id,
                                title:data.bookTitle||data.title||'',
                                lecturerName:lec?.sellerName||data.sellerName||'',
                                lecturerTitle:lec?.title||''});
                        });
                    } catch{}
                }
                const seen2=new Set();
                setLecturerBooks(lecBooks.filter(b=>{ if(seen2.has(b.firestoreId))return false; seen2.add(b.firestoreId); return true; })
                    .sort((a,b)=>(b.createdAt?.toDate?.()?.getTime()||0)-(a.createdAt?.toDate?.()?.getTime()||0)).slice(0,10));
            }

            try {
                const lecIds=new Set(seenIds);
                const bs=await getDocs(query(collection(db,'advertMyBook'),where('status','==','approved')));
                const seen3=new Set();
                setLatestBooks(bs.docs.filter(d=>!lecIds.has(d.data().sellerId)).map(d=>({
                    ...d.data(), id:`nb-${d.id}`, firestoreId:d.id,
                    title:d.data().bookTitle||d.data().title||'',
                })).filter(b=>{ if(seen3.has(b.firestoreId))return false; seen3.add(b.firestoreId); return true; })
                    .sort((a,b)=>(b.createdAt?.toDate?.()?.getTime()||0)-(a.createdAt?.toDate?.()?.getTime()||0)).slice(0,10));
            } catch{}

            try {
                const bq=query(collection(db,'advertMyBook'),where('status','==','approved'),orderBy('createdAt','desc'),limit(8));
                const bs=await getDocs(bq);
                setCampusBooks(bs.docs.map(d=>({...d.data(),firestoreId:d.id,title:d.data().bookTitle||d.data().title||''})));
            } catch{}

        } catch(e){ console.error(e); } finally{ setLoading(false); }
    };

    if (loading) return (
        <div style={{ minHeight:'100vh', background:BG, display:'flex', alignItems:'center', justifyContent:'center' }}>
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
            <div style={{ textAlign:'center' }}>
                <div style={{ width:52, height:52, border:`3px solid ${GOLD}`, borderTopColor:'transparent',
                    borderRadius:'50%', animation:'spin .8s linear infinite', margin:'0 auto 14px' }} />
                <p style={{ fontFamily:"'Playfair Display',serif", fontSize:16, color:NAVY }}>Loading dashboard…</p>
            </div>
        </div>
    );

    const displayName = user?.displayName || `${user?.firstName||''} ${user?.surname||''}`.trim() || 'Scholar';
    const pal = getPalette(displayName);
    const ini = getInitials(displayName);

    /* ── Section header ── */
    const SectionHeader = ({ label, title, action }) => (
        <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between',
            marginBottom:16, gap:8, flexWrap:'wrap' }}>
            <div>
                <p className="sec-label">{label}</p>
                <h3 className="sec-title">{title}</h3>
            </div>
            {action}
        </div>
    );

    /* ════════ HOME ════════ */
    const renderHome = () => (
        <div style={{ display:'flex', flexDirection:'column', gap:28 }}>

            {/* Hero */}
            <div className="hero">
                {/* decorative diamonds — clipped by hero overflow:hidden */}
                <div style={{ position:'absolute', top:-40, right:-40, width:160, height:160,
                    border:'0.5px solid rgba(184,150,62,.15)', transform:'rotate(45deg)', pointerEvents:'none' }} />
                <div style={{ position:'absolute', bottom:-30, left:-20, width:90, height:90,
                    border:'0.5px solid rgba(184,150,62,.1)', transform:'rotate(45deg)', pointerEvents:'none' }} />

                <div className="hero-inner">
                    {/* left: greeting */}
                    <div style={{ minWidth:0 }}>
                        <div style={{ display:'inline-flex', alignItems:'center', gap:5,
                            background:'rgba(184,150,62,.14)', border:'1px solid rgba(184,150,62,.3)',
                            borderRadius:999, padding:'4px 12px', marginBottom:14 }}>
                            <Sparkles size={9} style={{ color:GOLD }} />
                            <span style={{ fontSize:8, fontWeight:700, letterSpacing:'.14em',
                                textTransform:'uppercase', color:GOLDD, fontFamily:"'Lato',sans-serif" }}>
                                {user?.university || 'LAN Library'}
                            </span>
                        </div>
                        <h2 className="lan-serif" style={{ fontSize:'clamp(22px,5vw,40px)', fontWeight:900,
                            color:'#fff', margin:'0 0 8px', lineHeight:1.08 }}>
                            Welcome back,<br />
                            <span style={{ color:GOLD, fontStyle:'italic' }}>{user?.firstName || 'Scholar'} ✦</span>
                        </h2>
                        <p style={{ fontSize:12, color:'rgba(245,240,232,.6)', fontFamily:"'Lato',sans-serif",
                            margin:'0 0 18px' }}>
                            {library.length} {library.length===1?'book':'books'} · {aiSessions.length} AI sessions
                        </p>
                        <Link href="/ai-chat">
                            <button className="btn-gold-sm">
                                <Sparkles size={12} /> Chat with AI Tutor
                            </button>
                        </Link>
                    </div>

                    {/* right: stats grid */}
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8,
                        flexShrink:0, width:'min(220px, 100%)' }}>
                        {[
                            { icon:BookOpen,  label:'Books',    val:library.length,        accent:GOLD },
                            { icon:Sparkles,  label:'AI Chats', val:aiSessions.length,     accent:'#a78bfa' },
                            { icon:Heart,     label:'Saved',    val:wishlist.length,        accent:'#f87171' },
                            { icon:Users,     label:'Online',   val:activeStudents.length,  accent:'#34d399' },
                        ].map(({ icon:Icon, label, val, accent }) => (
                            <div key={label} style={{ background:'rgba(255,255,255,.07)',
                                border:'0.5px solid rgba(255,255,255,.1)', padding:10, textAlign:'center' }}>
                                <Icon size={13} style={{ color:accent, margin:'0 auto 4px' }} />
                                <p className="lan-serif" style={{ fontSize:18, fontWeight:700, color:'#fff', margin:0 }}>{val}</p>
                                <p style={{ fontSize:8, fontWeight:700, letterSpacing:'.08em', textTransform:'uppercase',
                                    color:'rgba(245,240,232,.45)', fontFamily:"'Lato',sans-serif", margin:0 }}>{label}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Library preview */}
            {library.length > 0 && (
                <section>
                    <SectionHeader label="My Library" title="Jump Back In"
                        action={<button onClick={()=>setActiveTab('library')} className="sec-link">Full Library <ChevronRight size={11}/></button>} />
                    <div className="books-grid">
                        {library.slice(0,5).map((b,i) => <BookCard key={b.bookId||i} book={b} owned />)}
                    </div>
                </section>
            )}

            {/* Lecturers */}
            <section>
                <SectionHeader label="Faculty Directory" title={`Our Lecturers${lecturers.length>0?' · '+lecturers.length+' on LAN':''}`}
                    action={<Link href="/lecturers" className="sec-link">View All <ChevronRight size={11}/></Link>} />
                {lecturers.length === 0
                    ? <div className="empty-box"><GraduationCap size={28} style={{color:'#e5ddd0',margin:'0 auto 8px'}}/><p className="empty-txt">No lecturers yet</p></div>
                    : <div className="scroll-row">
                        {lecturers.map(l => (
                            <div key={l.sellerId} style={{ flexShrink:0, width:190 }}>
                                <LecturerCard lecturer={l} />
                            </div>
                        ))}
                      </div>
                }
            </section>

            {/* Lecturer books */}
            <section>
                <SectionHeader label="Faculty Uploads" title="New from Lecturers"
                    action={<Link href="/documents?filter=lecturer" className="sec-link">Browse All <ChevronRight size={11}/></Link>} />
                {lecturerBooks.length === 0
                    ? <div className="empty-box"><BookMarked size={28} style={{color:'#e5ddd0',margin:'0 auto 8px'}}/><p className="empty-txt">No lecturer books yet</p></div>
                    : <div className="books-grid">
                        {lecturerBooks.slice(0,5).map((b,i) => <BookCard key={b.firestoreId||i} book={b} badge="Lecturer" />)}
                      </div>
                }
            </section>

            {/* Campus Pulse */}
            <section>
                <SectionHeader label="What's Happening" title="Campus Pulse"
                    action={<Link href="/documents" className="sec-link">All Docs <ChevronRight size={11}/></Link>} />
                <div style={{ background:'#fff', border:'0.5px solid #e5ddd0', overflow:'hidden' }}>
                    {campusBooks.length === 0
                        ? <div className="empty-box" style={{border:'none'}}><Activity size={28} style={{color:'#e5ddd0',margin:'0 auto 8px'}}/><p className="empty-txt">No activity yet</p></div>
                        : campusBooks.map((b,i) => {
                            const thumb = getThumbnailUrl(b);
                            return (
                                <Link key={b.firestoreId||i} href={`/book/preview?id=${b.firestoreId}`} style={{textDecoration:'none'}}>
                                    <div className="campus-row">
                                        <div style={{ width:22, flexShrink:0, textAlign:'center' }}>
                                            <span style={{ fontSize:10, fontWeight:700, color:i<3?GOLD:'#ccc',
                                                fontFamily:"'Lato',sans-serif" }}>{i+1}</span>
                                        </div>
                                        <div style={{ width:36, height:48, background:'#ede8df', flexShrink:0, overflow:'hidden' }}>
                                            {thumb
                                                ? <img src={thumb} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}} onError={e=>e.target.style.display='none'} />
                                                : <div style={{width:'100%',height:'100%',display:'flex',alignItems:'center',justifyContent:'center'}}><BookOpen size={12} style={{color:'#ccc'}}/></div>
                                            }
                                        </div>
                                        <div style={{ flex:1, minWidth:0 }}>
                                            <p style={{ fontSize:11, fontWeight:700, color:NAVY, margin:'0 0 2px',
                                                overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap',
                                                fontFamily:"'Lato',sans-serif" }}>{b.title}</p>
                                            <p style={{ fontSize:9, color:'#888', margin:'0 0 3px',
                                                fontFamily:"'Lato',sans-serif", overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                                                {b.sellerName||b.author||''}
                                            </p>
                                            <div style={{display:'flex',alignItems:'center',gap:6,flexWrap:'wrap'}}>
                                                <span style={{fontSize:10,fontWeight:700,color:NAVY,fontFamily:"'Lato',sans-serif"}}>
                                                    ₦{Number(b.price||0).toLocaleString()}
                                                </span>
                                                {b.category && (
                                                    <span style={{fontSize:7,fontWeight:700,background:CREAM,
                                                        border:'0.5px solid rgba(184,150,62,.3)',color:GOLD,
                                                        padding:'1px 6px',fontFamily:"'Lato',sans-serif",
                                                        textTransform:'uppercase',letterSpacing:'.06em'}}>
                                                        {b.category}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <ChevronRight size={12} style={{color:'#ccc',flexShrink:0}} />
                                    </div>
                                </Link>
                            );
                        })
                    }
                </div>
            </section>

            {/* Just Added */}
            <section>
                <SectionHeader label="Fresh Uploads" title="Just Added"
                    action={<Link href="/documents" className="sec-link">All Books <ChevronRight size={11}/></Link>} />
                {latestBooks.length === 0
                    ? <div className="empty-box"><Zap size={28} style={{color:'#e5ddd0',margin:'0 auto 8px'}}/><p className="empty-txt">No books yet</p></div>
                    : <div className="books-grid">
                        {latestBooks.slice(0,5).map((b,i) => <BookCard key={b.firestoreId||i} book={b} />)}
                      </div>
                }
            </section>

            {/* Learning Tools */}
            <section>
                <p className="sec-label">Resources</p>
                <h3 className="sec-title" style={{marginBottom:14}}>Learning Tools</h3>
                <div className="tools-grid">
                    {[
                        { icon:Sparkles,  label:'AI Book Chat',    sub:'Ask anything about your books',  href:'/ai-chat',                      accent:true  },
                        { icon:FileText,  label:'Study Notes',      sub:'Summarise & save',               href:'/ai-chat',                      accent:false },
                        { icon:BookCopy,  label:'Past Questions',   sub:'Exam prep resources',            href:'/document-type/past-question',  accent:false },
                        { icon:Users,     label:'Study Groups',     sub:'Collaborate with peers',         href:'/collaborate',                  accent:false },
                    ].map(({ icon:Icon, label, sub, href, accent }) => (
                        <Link key={label} href={href} style={{textDecoration:'none'}}>
                            <div className={`tool-card${accent?' tool-card-accent':''}`}>
                                <Icon size={17} style={{color:accent?'#fff':GOLD, marginBottom:7}} />
                                <p style={{fontSize:11,fontWeight:700,color:accent?'#fff':NAVY,margin:'0 0 3px',fontFamily:"'Lato',sans-serif"}}>{label}</p>
                                <p style={{fontSize:9,color:accent?'rgba(245,240,232,.6)':'#aaa',margin:0,fontFamily:"'Lato',sans-serif"}}>{sub}</p>
                            </div>
                        </Link>
                    ))}
                </div>
            </section>

            {/* Seller / Earn panel */}
            <section>
                <div className="seller-panel">
                    <div style={{ position:'absolute', top:-20, right:-20, width:80, height:80,
                        border:'0.5px solid rgba(184,150,62,.15)', transform:'rotate(45deg)', pointerEvents:'none' }} />
                    {user?.isSeller ? (
                        <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:12,flexWrap:'wrap'}}>
                            <div>
                                <p style={{fontSize:9,fontWeight:700,letterSpacing:'.18em',textTransform:'uppercase',
                                    color:GOLD,margin:'0 0 4px',fontFamily:"'Lato',sans-serif"}}>Author Dashboard</p>
                                <p className="lan-serif" style={{fontSize:26,fontWeight:700,color:'#fff',margin:'0 0 3px'}}>
                                    ₦{(sellerStats?.accountBalance||0).toLocaleString()}
                                </p>
                                <p style={{fontSize:10,color:'rgba(245,240,232,.5)',fontFamily:"'Lato',sans-serif"}}>
                                    {sellerStats?.totalSales||sellerStats?.booksSold||0} total sales
                                </p>
                            </div>
                            <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
                                <Link href="/upload-document"><button className="btn-gold-sm">Upload</button></Link>
                                <Link href="/my-account/seller-account"><button className="btn-ghost-sm">Studio</button></Link>
                            </div>
                        </div>
                    ) : (
                        <>
                            <p style={{fontSize:9,fontWeight:700,letterSpacing:'.18em',textTransform:'uppercase',
                                color:GOLD,margin:'0 0 10px',fontFamily:"'Lato',sans-serif"}}>Earn on LAN</p>
                            <h3 className="lan-serif" style={{fontSize:20,fontWeight:700,color:'#fff',margin:'0 0 7px'}}>
                                Turn Notes<br/>into Cash 💸
                            </h3>
                            <p style={{fontSize:11,color:'rgba(245,240,232,.55)',fontFamily:"'Lato',sans-serif",
                                lineHeight:1.65,margin:'0 0 16px',maxWidth:300}}>
                                Your study guides could earn thousands. Join 500+ student authors — keep 80% of every sale.
                            </p>
                            <Link href="/become-seller"><button className="btn-gold-sm">Start Selling Now →</button></Link>
                        </>
                    )}
                </div>
            </section>

            {/* Active students */}
            <section>
                <div style={{display:'flex',alignItems:'flex-end',justifyContent:'space-between',marginBottom:14}}>
                    <div>
                        <p className="sec-label">Community</p>
                        <h3 className="sec-title">Active Students</h3>
                    </div>
                    <div style={{display:'flex',alignItems:'center',gap:5}}>
                        <div style={{width:6,height:6,borderRadius:'50%',background:'#16a34a'}} />
                        <span style={{fontSize:9,fontWeight:700,color:'#16a34a',fontFamily:"'Lato',sans-serif"}}>
                            {activeStudents.length} online
                        </span>
                    </div>
                </div>
                <div style={{background:'#fff',border:'0.5px solid #e5ddd0',padding:'4px 14px 0'}}>
                    {activeStudents.length === 0
                        ? <div style={{padding:'28px 0',textAlign:'center'}}>
                            <Users size={26} style={{color:'#e5ddd0',margin:'0 auto 6px'}}/>
                            <p className="empty-txt">No active students right now</p>
                          </div>
                        : activeStudents.map((s,i) => <ActiveStudentRow key={s.id} student={s} rank={i} />)
                    }
                </div>
            </section>
        </div>
    );

    /* ════════ LIBRARY ════════ */
    const renderLibrary = () => (
        <div>
            <div style={{marginBottom:22}}>
                <p className="sec-label">Your Collection</p>
                <h2 className="lan-serif" style={{fontSize:26,fontWeight:700,color:NAVY,margin:'3px 0 0'}}>My Library</h2>
            </div>
            {library.length === 0
                ? <div className="empty-box" style={{padding:'56px 24px'}}>
                    <BookOpen size={44} style={{color:'#e5ddd0',margin:'0 auto 14px'}}/>
                    <h3 className="lan-serif" style={{fontSize:20,color:NAVY,marginBottom:6}}>Library is Empty</h3>
                    <p className="empty-txt" style={{marginBottom:18}}>Start building your collection</p>
                    <Link href="/documents"><button className="btn-navy">Browse Documents</button></Link>
                  </div>
                : <>
                    <div className="books-grid">{library.map((b,i)=><BookCard key={b.bookId||i} book={b} owned />)}</div>
                    <div style={{marginTop:22,borderTop:'0.5px solid #f0ebe0',paddingTop:22}}>
                        <p className="sec-label" style={{marginBottom:10}}>AI Tutor</p>
                        <h3 className="lan-serif" style={{fontSize:17,color:NAVY,margin:'0 0 12px'}}>Chat About Your Books</h3>
                        <div style={{display:'flex',flexDirection:'column',gap:7}}>
                            {library.slice(0,4).map((b,i)=>(
                                <Link key={i} href={`/ai-chat?bookId=${b.bookId||b.firestoreId||b.id}&bookTitle=${encodeURIComponent(b.title||'')}`} style={{textDecoration:'none'}}>
                                    <div className="ai-banner">
                                        <div style={{width:32,height:32,background:'rgba(255,255,255,.15)',border:'0.5px solid rgba(255,255,255,.2)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                                            <Sparkles size={13} style={{color:'#fff'}} />
                                        </div>
                                        <div style={{flex:1,minWidth:0}}>
                                            <p style={{fontSize:8,fontWeight:700,letterSpacing:'.12em',textTransform:'uppercase',color:'rgba(255,255,255,.6)',margin:'0 0 2px',fontFamily:"'Lato',sans-serif"}}>AI Tutor</p>
                                            <p style={{fontSize:11,fontWeight:700,color:'#fff',margin:0,fontFamily:"'Lato',sans-serif",overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>Ask about "{b.title}"</p>
                                        </div>
                                        <ArrowRight size={12} style={{color:'rgba(255,255,255,.5)',flexShrink:0}} />
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                  </>
            }
        </div>
    );

    /* ════════ AI ════════ */
    const renderAI = () => (
        <div>
            <div style={{marginBottom:22,display:'flex',alignItems:'flex-end',justifyContent:'space-between',gap:8,flexWrap:'wrap'}}>
                <div>
                    <p className="sec-label">Powered by Claude</p>
                    <h2 className="lan-serif" style={{fontSize:26,fontWeight:700,color:NAVY,margin:'3px 0 0'}}>AI Tutor</h2>
                </div>
                <Link href="/ai-chat"><button className="btn-navy" style={{display:'flex',alignItems:'center',gap:5}}><Plus size={12}/> New Chat</button></Link>
            </div>
            <div className="seller-panel" style={{marginBottom:22}}>
                <div style={{position:'absolute',top:-20,right:-20,width:80,height:80,border:'0.5px solid rgba(184,150,62,.15)',transform:'rotate(45deg)',pointerEvents:'none'}}/>
                <Sparkles size={20} style={{color:GOLD,marginBottom:10}}/>
                <h3 className="lan-serif" style={{fontSize:20,fontWeight:700,color:'#fff',margin:'0 0 6px'}}>Ask anything about your books</h3>
                <p style={{fontSize:11,color:'rgba(245,240,232,.55)',fontFamily:"'Lato',sans-serif",margin:'0 0 16px'}}>Summaries, key concepts, exam tips, explanations.</p>
                <Link href="/ai-chat"><button className="btn-gold-sm">Start AI Chat →</button></Link>
            </div>
            {aiSessions.length > 0 && (
                <div style={{marginBottom:22}}>
                    <p className="sec-label" style={{marginBottom:10}}>Recent</p>
                    <h3 className="lan-serif" style={{fontSize:17,color:NAVY,margin:'0 0 12px'}}>Your Conversations</h3>
                    <div style={{display:'flex',flexDirection:'column',gap:6}}>
                        {aiSessions.map(s=>(
                            <Link key={s.id} href={`/ai-chat?sessionId=${s.id}&bookId=${s.bookId}&bookTitle=${encodeURIComponent(s.bookTitle||'')}`} style={{textDecoration:'none'}}>
                                <div className="ai-row">
                                    <div style={{width:34,height:34,border:'0.5px solid #e5ddd0',background:CREAM,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                                        <MessageSquare size={13} style={{color:NAVY}}/>
                                    </div>
                                    <div style={{flex:1,minWidth:0}}>
                                        <p style={{fontSize:11,fontWeight:700,color:NAVY,margin:'0 0 2px',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',fontFamily:"'Lato',sans-serif"}}>{s.title||'New conversation'}</p>
                                        <p style={{fontSize:9,color:GOLD,margin:0,fontFamily:"'Lato',sans-serif",overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{s.bookTitle||''}</p>
                                    </div>
                                    <div style={{textAlign:'right',flexShrink:0}}>
                                        <p style={{fontSize:9,color:'#aaa',margin:0,fontFamily:"'Lato',sans-serif"}}>{s.messages?.length||0} msgs</p>
                                        <p style={{fontSize:8,color:'#ccc',margin:'2px 0 0',fontFamily:"'Lato',sans-serif"}}>{formatTime(s.updatedAt)}</p>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            )}
            {library.length > 0 && (
                <div>
                    <p className="sec-label" style={{marginBottom:10}}>Quick Access</p>
                    <h3 className="lan-serif" style={{fontSize:17,color:NAVY,margin:'0 0 12px'}}>Chat About Your Books</h3>
                    <div style={{display:'flex',flexDirection:'column',gap:7}}>
                        {library.map((b,i)=>(
                            <Link key={i} href={`/ai-chat?bookId=${b.bookId||b.firestoreId||b.id}&bookTitle=${encodeURIComponent(b.title||'')}`} style={{textDecoration:'none'}}>
                                <div className="ai-banner">
                                    <div style={{width:32,height:32,background:'rgba(255,255,255,.15)',border:'0.5px solid rgba(255,255,255,.2)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                                        <Sparkles size={13} style={{color:'#fff'}}/>
                                    </div>
                                    <div style={{flex:1,minWidth:0}}>
                                        <p style={{fontSize:8,fontWeight:700,letterSpacing:'.12em',textTransform:'uppercase',color:'rgba(255,255,255,.6)',margin:'0 0 2px',fontFamily:"'Lato',sans-serif"}}>AI Tutor</p>
                                        <p style={{fontSize:11,fontWeight:700,color:'#fff',margin:0,fontFamily:"'Lato',sans-serif",overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>Ask about "{b.title}"</p>
                                    </div>
                                    <ArrowRight size={12} style={{color:'rgba(255,255,255,.5)',flexShrink:0}}/>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );

    /* ════════ WISHLIST ════════ */
    const renderWishlist = () => (
        <div>
            <div style={{marginBottom:22,display:'flex',alignItems:'flex-end',justifyContent:'space-between',gap:8,flexWrap:'wrap'}}>
                <div>
                    <p className="sec-label">Your Wishlist</p>
                    <h2 className="lan-serif" style={{fontSize:26,fontWeight:700,color:NAVY,margin:'3px 0 0'}}>Saved Books</h2>
                </div>
                <span style={{fontSize:11,color:'#aaa',fontFamily:"'Lato',sans-serif"}}>{wishlist.length} items</span>
            </div>
            {wishlist.length === 0
                ? <div className="empty-box" style={{padding:'56px 24px'}}>
                    <Heart size={44} style={{color:'#e5ddd0',margin:'0 auto 14px'}}/>
                    <h3 className="lan-serif" style={{fontSize:20,color:NAVY,marginBottom:6}}>Nothing Saved Yet</h3>
                    <p className="empty-txt" style={{marginBottom:18}}>Browse and save books for later</p>
                    <Link href="/documents"><button className="btn-navy">Browse Documents</button></Link>
                  </div>
                : <div style={{display:'flex',flexDirection:'column',gap:8}}>
                    {wishlist.map((item,i)=>{
                        const thumb=getThumbnailUrl(item);
                        const navId=item.bookId||item.firestoreId||item.id;
                        return (
                            <div key={item.id||i} className="wish-row"
                                onMouseEnter={e=>e.currentTarget.style.borderColor=GOLD}
                                onMouseLeave={e=>e.currentTarget.style.borderColor='#e5ddd0'}>
                                <div style={{width:42,height:54,background:'#ede8df',flexShrink:0,overflow:'hidden'}}>
                                    {thumb
                                        ? <img src={thumb} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}} onError={e=>e.target.style.display='none'}/>
                                        : <div style={{width:'100%',height:'100%',display:'flex',alignItems:'center',justifyContent:'center'}}><BookOpen size={14} style={{color:'#ccc'}}/></div>
                                    }
                                </div>
                                <div style={{flex:1,minWidth:0}}>
                                    <p style={{fontSize:12,fontWeight:700,color:NAVY,margin:'0 0 2px',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',fontFamily:"'Lato',sans-serif"}}>{item.title||item.bookTitle}</p>
                                    <p style={{fontSize:10,color:'#888',margin:'0 0 5px',fontFamily:"'Lato',sans-serif",overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{item.author||''}</p>
                                    <p style={{fontSize:12,fontWeight:700,color:NAVY,margin:0,fontFamily:"'Lato',sans-serif"}}>₦{Number(item.price||0).toLocaleString()}</p>
                                </div>
                                <div style={{display:'flex',gap:7,flexShrink:0}}>
                                    <Link href={`/payment?bookId=${navId}`}>
                                        <button style={{padding:'7px 14px',background:NAVY,color:'#fff',border:'none',fontSize:10,fontWeight:700,cursor:'pointer',fontFamily:"'Lato',sans-serif"}}>Buy</button>
                                    </Link>
                                    <Link href={`/book/preview?id=${navId}`}>
                                        <button style={{padding:'7px 10px',background:'transparent',color:NAVY,border:'0.5px solid #e5ddd0',fontSize:10,fontWeight:700,cursor:'pointer',fontFamily:"'Lato',sans-serif"}}>
                                            <Eye size={12}/>
                                        </button>
                                    </Link>
                                </div>
                            </div>
                        );
                    })}
                  </div>
            }
        </div>
    );

    const NAV = [
        { id:'home',    icon:LayoutDashboard, label:'Home'    },
        { id:'library', icon:LibraryBig,      label:'Library' },
        { id:'ai',      icon:Sparkles,        label:'AI Tutor'},
        { id:'wishlist',icon:Heart,           label:'Saved'   },
    ];

    /* ════════ RENDER ════════ */
    return (
        <>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400&family=Lato:wght@300;400;700&display=swap');

          *, *::before, *::after { box-sizing: border-box; min-width: 0; }

          body { overflow-x: hidden; }

          .lan-root { font-family: 'Lato', sans-serif; background: ${BG}; min-height: 100vh; }
          .lan-serif { font-family: 'Playfair Display', Georgia, serif; }

          /* ── Layout ── */
          .page-wrap {
            display: flex;
            max-width: 1280px;
            margin: 0 auto;
            width: 100%;
          }

          /* ── Sidebar ── */
          .sidebar {
            width: 220px;
            flex-shrink: 0;
            display: none;
            flex-direction: column;
            border-right: 0.5px solid #e5ddd0;
            min-height: calc(100vh - 64px);
            position: sticky;
            top: 64px;
            align-self: flex-start;
            background: #fff;
            padding: 22px 0;
          }
          @media (min-width: 1024px) { .sidebar { display: flex; } }

          /* ── Main ── */
          .main-content {
            flex: 1;
            min-width: 0;
            padding: 0 16px 90px;
          }
          @media (min-width: 768px)  { .main-content { padding: 0 24px 90px; } }
          @media (min-width: 1024px) { .main-content { padding: 28px 32px 40px; } }

          /* ── Hero ── */
          .hero {
            background-color: ${NAVY};
            background-image:
              radial-gradient(rgba(184,150,62,.06) 1px, transparent 1px),
              radial-gradient(rgba(255,255,255,.03) 1px, transparent 1px);
            background-size: 28px 28px, 14px 14px;
            background-position: 0 0, 7px 7px;
            padding: 28px 22px 24px;
            position: relative;
            overflow: hidden;
            margin-bottom: 0;
          }
          .hero-inner {
            display: flex;
            flex-wrap: wrap;
            align-items: center;
            justify-content: space-between;
            gap: 18px;
            position: relative;
            width: 100%;
          }

          /* ── Section labels ── */
          .sec-label {
            font-size: 9px; font-weight: 700; letter-spacing: .2em;
            text-transform: uppercase; color: ${GOLD};
            margin: 0 0 5px; font-family: 'Lato', sans-serif;
          }
          .sec-title {
            font-family: 'Playfair Display', serif;
            font-size: clamp(16px, 3vw, 22px);
            font-weight: 700; color: ${NAVY}; margin: 0;
          }
          .sec-link {
            font-size: 10px; font-weight: 700; color: ${NAVY};
            text-decoration: none; display: inline-flex;
            align-items: center; gap: 2px; letter-spacing: .04em;
            font-family: 'Lato', sans-serif; transition: color .15s;
            white-space: nowrap; flex-shrink: 0;
          }
          .sec-link:hover { color: ${GOLD}; }

          /* ── Grids ── */
          .books-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 12px;
          }
          @media (min-width: 480px) { .books-grid { grid-template-columns: repeat(3, 1fr); } }
          @media (min-width: 768px) { .books-grid { grid-template-columns: repeat(4, 1fr); gap: 14px; } }
          @media (min-width: 1024px){ .books-grid { grid-template-columns: repeat(5, 1fr); } }

          .tools-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 10px;
          }
          @media (min-width: 640px) { .tools-grid { grid-template-columns: repeat(4, 1fr); } }

          /* ── Horizontal scroll row (lecturers) ── */
          .scroll-row {
            display: flex;
            gap: 12px;
            overflow-x: auto;
            padding-bottom: 8px;
            scrollbar-width: none;
            -ms-overflow-style: none;
            width: 100%;
          }
          .scroll-row::-webkit-scrollbar { display: none; }

          /* ── Cards ── */
          .book-card {
            background: #fff; border: 0.5px solid #e5ddd0; overflow: hidden;
            transition: transform .22s, box-shadow .22s, border-color .22s;
          }
          .book-card:hover { transform: translateY(-4px); box-shadow: 0 12px 28px rgba(13,34,68,.12); border-color: ${GOLD}; }

          .lec-card {
            background: #fff; border: 0.5px solid #e5ddd0; overflow: hidden;
            transition: transform .25s cubic-bezier(.4,0,.2,1), box-shadow .25s, border-color .25s;
          }
          .lec-card:hover { transform: translateY(-5px); box-shadow: 0 16px 40px rgba(13,34,68,.12); border-color: ${GOLD}; }
          .lec-card:hover .lec-img { transform: scale(1.05); }
          .lec-img { transition: transform .6s cubic-bezier(.4,0,.2,1); }

          .tool-card {
            background: #fff; border: 0.5px solid #e5ddd0; padding: 16px 13px;
            transition: transform .2s, border-color .2s, box-shadow .2s;
            height: 100%; cursor: pointer;
          }
          .tool-card:hover { transform: translateY(-3px); border-color: ${GOLD}; box-shadow: 0 8px 20px rgba(13,34,68,.08); }
          .tool-card-accent { background: ${NAVY}; border-color: ${NAVY}; }
          .tool-card-accent:hover { border-color: ${GOLD}; }

          /* ── Campus row ── */
          .campus-row {
            display: flex; align-items: center; gap: 10px;
            padding: 10px 14px; border-bottom: 0.5px solid #f0ebe0;
            background: #fff; transition: background .15s; cursor: pointer;
          }
          .campus-row:hover { background: ${CREAM}; }
          .campus-row:last-child { border-bottom: none; }

          /* ── Seller panel ── */
          .seller-panel {
            background: ${NAVY};
            background-image: radial-gradient(rgba(184,150,62,.07) 1px, transparent 1px);
            background-size: 24px 24px;
            padding: 24px; position: relative; overflow: hidden;
          }

          /* ── AI banner ── */
          .ai-banner {
            display: flex; align-items: center; gap: 10px;
            background: ${NAVY}; padding: 10px 14px; transition: background .15s;
          }
          .ai-banner:hover { background: #1a3a6e; }

          .ai-row {
            display: flex; align-items: center; gap: 10px;
            padding: 10px 14px; border: 0.5px solid #e5ddd0;
            background: #fff; transition: border-color .15s, background .15s;
          }
          .ai-row:hover { border-color: ${GOLD}; background: ${CREAM}; }

          /* ── Wishlist row ── */
          .wish-row {
            background: #fff; border: 0.5px solid #e5ddd0;
            padding: 12px 14px; display: flex; gap: 12px;
            align-items: center; transition: border-color .18s;
          }

          /* ── Sidebar item ── */
          .sb-item {
            display: flex; align-items: center; gap: 10px;
            padding: 10px 16px; cursor: pointer; font-size: 12px;
            font-weight: 700; color: #888; transition: all .15s;
            background: none; border: none; width: 100%;
            text-align: left; font-family: 'Lato', sans-serif;
            letter-spacing: .02em; border-left: 2px solid transparent;
          }
          .sb-item:hover { background: ${CREAM}; color: ${NAVY}; }
          .sb-item.active { background: ${CREAM}; color: ${NAVY}; border-left-color: ${GOLD}; }

          /* ── Buttons ── */
          .btn-gold-sm {
            display: inline-flex; align-items: center; gap: 6px;
            padding: 9px 18px; background: ${GOLD}; color: ${NAVY};
            border: none; font-size: 11px; font-weight: 700;
            cursor: pointer; font-family: 'Lato', sans-serif;
            letter-spacing: .04em; transition: background .18s;
          }
          .btn-gold-sm:hover { background: ${GOLDD}; }

          .btn-ghost-sm {
            padding: 9px 18px; background: rgba(255,255,255,.1); color: #fff;
            border: 0.5px solid rgba(255,255,255,.2); font-size: 11px;
            font-weight: 700; cursor: pointer; font-family: 'Lato', sans-serif;
            letter-spacing: .04em; transition: background .18s;
          }
          .btn-ghost-sm:hover { background: rgba(255,255,255,.18); }

          .btn-navy {
            padding: 9px 20px; background: ${NAVY}; color: #fff;
            border: none; font-size: 11px; font-weight: 700;
            cursor: pointer; font-family: 'Lato', sans-serif;
            letter-spacing: .04em; transition: background .18s;
          }
          .btn-navy:hover { background: #1a3a6e; }

          /* ── Empty / util ── */
          .empty-box {
            background: #fff; border: 0.5px solid #e5ddd0;
            padding: 44px 20px; text-align: center;
          }
          .empty-txt { font-size: 12px; color: #aaa; font-family: 'Lato', sans-serif; margin: 0; }

          /* ── Mobile bottom nav ── */
          .mob-nav {
            position: fixed; bottom: 0; left: 0; right: 0;
            background: ${NAVY}; border-top: 0.5px solid rgba(184,150,62,.2);
            display: flex; justify-content: space-around; align-items: flex-end;
            padding: 8px 0 12px; z-index: 50;
          }
          @media (min-width: 1024px) { .mob-nav { display: none; } }

          .mob-nav-btn {
            display: flex; flex-direction: column; align-items: center;
            gap: 2px; background: none; border: none; cursor: pointer;
            font-family: 'Lato', sans-serif; padding: 5px 10px;
            transition: all .15s; color: rgba(245,240,232,.4);
          }
          .mob-nav-btn.active { color: ${GOLD}; }

          /* ── Animations ── */
          @keyframes spin { to { transform: rotate(360deg); } }
          @keyframes slideUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
          .anim-up { animation: slideUp .4s cubic-bezier(.4,0,.2,1) both; }
          @keyframes pulse2 { 0%,100%{opacity:1} 50%{opacity:.4} }
          .pulse-dot { animation: pulse2 2s infinite; }
        `}</style>

        <div className="lan-root">
            <Navbar />

            <div className="page-wrap">

                {/* ── Sidebar ── */}
                <aside className="sidebar">
                    {/* user pill */}
                    <div style={{padding:'0 16px 18px',borderBottom:'0.5px solid #f0ebe0',marginBottom:6}}>
                        <div style={{display:'flex',alignItems:'center',gap:9}}>
                            <Avatar name={displayName} src={user?.photoBase64||user?.photoURL} size={34} />
                            <div style={{minWidth:0}}>
                                <p style={{fontSize:11,fontWeight:700,color:NAVY,margin:0,overflow:'hidden',
                                    textOverflow:'ellipsis',whiteSpace:'nowrap',fontFamily:"'Lato',sans-serif"}}>
                                    {displayName}
                                </p>
                                <div style={{display:'inline-flex',alignItems:'center',gap:4,marginTop:2}}>
                                    <div className="pulse-dot" style={{width:5,height:5,borderRadius:'50%',background:'#16a34a'}}/>
                                    <span style={{fontSize:8,fontWeight:700,color:GOLD,letterSpacing:'.1em',
                                        textTransform:'uppercase',fontFamily:"'Lato',sans-serif"}}>Student</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {NAV.map(({id,icon:Icon,label})=>(
                        <button key={id} onClick={()=>setActiveTab(id)}
                            className={`sb-item${activeTab===id?' active':''}`}>
                            <Icon size={14} style={{color:activeTab===id?GOLD:'#bbb',flexShrink:0}}/>{label}
                        </button>
                    ))}

                    <div style={{borderTop:'0.5px solid #f0ebe0',margin:'10px 0',padding:'6px 0'}}>
                        <Link href="/documents" style={{textDecoration:'none'}}>
                            <button className="sb-item"><Search size={14} style={{color:'#bbb',flexShrink:0}}/>Browse All</button>
                        </Link>
                        <Link href="/my-account" style={{textDecoration:'none'}}>
                            <button className="sb-item"><User size={14} style={{color:'#bbb',flexShrink:0}}/>Profile</button>
                        </Link>
                        {user?.isSeller
                            ? <Link href="/my-account/seller-account" style={{textDecoration:'none'}}>
                                <button className="sb-item" style={{color:'#16a34a'}}>
                                    <BarChart2 size={14} style={{color:'#16a34a',flexShrink:0}}/>Author Studio
                                </button>
                              </Link>
                            : <Link href="/become-seller" style={{textDecoration:'none'}}>
                                <button className="sb-item" style={{color:GOLD}}>
                                    <Store size={14} style={{color:GOLD,flexShrink:0}}/>Become a Seller
                                </button>
                              </Link>
                        }
                    </div>

                    <button onClick={()=>{auth.signOut();router.push('/auth/signin');}}
                        style={{marginTop:'auto',display:'flex',alignItems:'center',gap:9,padding:'10px 16px',
                            background:'none',border:'none',cursor:'pointer',color:'#dc2626',
                            fontSize:12,fontWeight:700,fontFamily:"'Lato',sans-serif"}}>
                        <LogOut size={14}/> Sign Out
                    </button>
                </aside>

                {/* ── Main ── */}
                <main className="main-content anim-up">
                    {activeTab==='home'     && renderHome()}
                    {activeTab==='library'  && renderLibrary()}
                    {activeTab==='ai'       && renderAI()}
                    {activeTab==='wishlist' && renderWishlist()}
                </main>
            </div>

            {/* ── Mobile Bottom Nav ── */}
            <nav className="mob-nav">
                {NAV.map(({id,icon:Icon,label})=>(
                    <button key={id} onClick={()=>setActiveTab(id)}
                        className={`mob-nav-btn${activeTab===id?' active':''}`}>
                        <Icon size={19}/>
                        <span style={{fontSize:7,fontWeight:700,letterSpacing:'.06em',textTransform:'uppercase'}}>{label}</span>
                        {activeTab===id && <div style={{width:3,height:3,borderRadius:'50%',background:GOLD}}/>}
                    </button>
                ))}
                <Link href="/upload-document" style={{marginBottom:6}}>
                    <div style={{width:44,height:44,background:GOLD,display:'flex',alignItems:'center',
                        justifyContent:'center',border:`3px solid ${NAVY}`}}>
                        <Plus size={20} style={{color:NAVY}} strokeWidth={3}/>
                    </div>
                </Link>
                <Link href="/my-account" style={{textDecoration:'none'}}>
                    <button className="mob-nav-btn">
                        <User size={19}/>
                        <span style={{fontSize:7,fontWeight:700,letterSpacing:'.06em',textTransform:'uppercase'}}>Profile</span>
                    </button>
                </Link>
            </nav>
        </div>
        </>
    );
}