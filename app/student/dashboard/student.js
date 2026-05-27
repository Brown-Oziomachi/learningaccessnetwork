"use client";

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
    BookOpen, Heart, User, LogOut, Store, Search, Plus,
    Eye, Sparkles, GraduationCap, MessageSquare, 
    BookMarked, Zap, Users, ArrowRight, FileText,
    BookCopy, LayoutDashboard, LibraryBig,
    BarChart2, Activity, ChevronRight, Bell, X,
} from 'lucide-react';
import { auth, db } from '@/lib/firebaseConfig';
import {
    doc, getDoc, collection, query, where, getDocs,
    orderBy, limit, onSnapshot, updateDoc, collectionGroup,
} from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import Link from 'next/link';
import Navbar from '@/components/NavBar';
import NotificationBell from '@/components/NotificationBell';
import FeaturedAdsCarousel from '@/components/FeaturedAdsCarousel';
import { increment } from 'firebase/firestore';
import { useAds } from "@/lib/useAds";  
import BountyApprovalModal from '@/components/BountyApprovalModal';

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
    { bg: NAVY,      text: GOLDD },
    { bg: "#1a3a5c", text: CREAM },
    { bg: "#2c1810", text: GOLDD },
    { bg: "#1a2c1a", text: "#a8d5a2" },
    { bg: "#2c1a2c", text: GOLDD },
    { bg: "#0a2233", text: "#7eccd4" },
];
const getPalette  = (n = "?") => PALETTES[(n || '?').charCodeAt(0) % PALETTES.length];
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

/* ══════════════════════════════════════════
   AVATAR
══════════════════════════════════════════ */
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

/* ══════════════════════════════════════════
   MESSAGE BELL
   Listens to the `notifications` collection
   for type==='message' docs where userId===me
══════════════════════════════════════════ */
function MessageBell({ userId }) {
    const [msgs,    setMsgs]    = useState([]);
    const [unread,  setUnread]  = useState([]);
    const [open,    setOpen]    = useState(false);
    const dropRef = useRef(null);

    /* Close dropdown on outside click */
    useEffect(() => {
        const fn = (e) => { if (dropRef.current && !dropRef.current.contains(e.target)) setOpen(false); };
        document.addEventListener('mousedown', fn);
        return () => document.removeEventListener('mousedown', fn);
    }, []);

    /* Real-time listener on notifications where type == 'message' */
    useEffect(() => {
        if (!userId) return;
        const q = query(
        collectionGroup(db, 'messages'),
        where('recipientId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(25)
    );
        const unsub = onSnapshot(q, (snap) => {
            const all = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            setMsgs(all);
            setUnread(all.filter(m => !m.read));
        }, (err) => {
            /* If the collection doesn't exist yet, silently ignore */
            console.warn('MessageBell listener:', err.code);
        });
        return () => unsub();
    }, [userId]);

   const markRead = async (msg) => {
    try { 
        await updateDoc(
            doc(db, 'dm_messages', msg.chatId, 'messages', msg.id), 
            { read: true }
        ); 
    } catch {}
};
const markAll = () => unread.forEach(m => markRead(m));

    const count = unread.length;

    return (
        <div ref={dropRef} style={{ position: 'relative' }}>

            {/* ── Bell button ── */}
            <button onClick={() => setOpen(o => !o)}
                style={{ position: 'relative', background: 'none', border: 'none', cursor: 'pointer',
                    padding: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: open ? GOLD : NAVY, transition: 'color .15s', borderRadius: 4 }}>
                <Bell size={20} />
                {count > 0 && (
                    <span style={{ position: 'absolute', top: 0, right: 0,
                        minWidth: 17, height: 17, borderRadius: 999,
                        background: '#ef4444', color: '#fff',
                        fontSize: 8, fontWeight: 700, fontFamily: "'Lato',sans-serif",
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        padding: '0 3px', border: '1.5px solid #fff', lineHeight: 1 }}>
                        {count > 9 ? '9+' : count}
                    </span>
                )}
            </button>

            {/* ── Dropdown ── */}
            {open && (
                <div style={{ position: 'absolute', top: 'calc(100% + 10px)', right: 0,
                    width: 310, maxWidth: 'calc(100vw - 24px)',
                    background: '#fff', border: '0.5px solid #e5ddd0',
                    boxShadow: '0 16px 48px rgba(13,34,68,.18)',
                    zIndex: 99999, animation: 'dropIn .2s ease both' }}>

                    {/* Header */}
                    <div style={{ background: NAVY, padding: '11px 14px',
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                            <MessageSquare size={13} style={{ color: GOLD }} />
                            <span style={{ fontSize: 10, fontWeight: 700, color: '#fff',
                                fontFamily: "'Lato',sans-serif", letterSpacing: '.1em', textTransform: 'uppercase' }}>
                                Messages
                            </span>
                            {count > 0 && (
                                <span style={{ background: GOLD, color: NAVY, fontSize: 8, fontWeight: 700,
                                    padding: '2px 7px', fontFamily: "'Lato',sans-serif" }}>
                                    {count} NEW
                                </span>
                            )}
                        </div>
                        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                            {count > 0 && (
                                <button onClick={markAll}
                                    style={{ fontSize: 9, fontWeight: 700, color: GOLDD, background: 'none',
                                        border: 'none', cursor: 'pointer', fontFamily: "'Lato',sans-serif",
                                        letterSpacing: '.06em', textTransform: 'uppercase' }}>
                                    Mark all read
                                </button>
                            )}
                            <button onClick={() => setOpen(false)}
                                style={{ background: 'none', border: 'none', cursor: 'pointer',
                                    color: 'rgba(255,255,255,.5)', lineHeight: 1, padding: 0 }}>
                                <X size={14} />
                            </button>
                        </div>
                    </div>

                    {/* Message list */}
                    <div style={{ maxHeight: 340, overflowY: 'auto' }}>
                        {msgs.length === 0 ? (
                            <div style={{ padding: '36px 16px', textAlign: 'center' }}>
                                <div style={{ width: 48, height: 48, borderRadius: '50%', background: CREAM,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    margin: '0 auto 10px' }}>
                                    <MessageSquare size={22} style={{ color: '#e5ddd0' }} />
                                </div>
                                <p style={{ fontSize: 12, fontWeight: 700, color: NAVY,
                                    fontFamily: "'Playfair Display',serif", margin: '0 0 4px' }}>
                                    No messages yet
                                </p>
                                <p style={{ fontSize: 10, color: '#bbb', fontFamily: "'Lato',sans-serif", margin: 0 }}>
                                    When a student messages you,<br/>it will appear here.
                                </p>
                            </div>
                        ) : msgs.map((msg) => {
                            const isNew = !msg.read;
                            return (
                                <div key={msg.id}
                                    onClick={() => { markRead(msg); setOpen(false); }}
                                    style={{ padding: '10px 14px', borderBottom: '0.5px solid #f9f6f0',
                                        display: 'flex', gap: 10, alignItems: 'flex-start', cursor: 'pointer',
                                        background: isNew ? 'rgba(184,150,62,.07)' : '#fff',
                                        borderLeft: `3px solid ${isNew ? GOLD : 'transparent'}`,
                                        transition: 'background .15s' }}
                                    onMouseEnter={e => e.currentTarget.style.background = CREAM}
                                    onMouseLeave={e => e.currentTarget.style.background = isNew ? 'rgba(184,150,62,.07)' : '#fff'}>

                                    {/* Sender avatar */}
                                    <div style={{ width: 34, height: 34, borderRadius: '50%', background: NAVY,
                                        flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        border: `1.5px solid ${isNew ? GOLD : 'rgba(13,34,68,.1)'}` }}>
                                        <span style={{ color: GOLDD, fontSize: 11, fontWeight: 700,
                                            fontFamily: "'Playfair Display',serif" }}>
                                            {getInitials(msg.senderName || msg.title || '?')}
                                        </span>
                                    </div>

                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between',
                                            alignItems: 'flex-start', gap: 6, marginBottom: 3 }}>
                                            <p style={{ fontSize: 11, fontWeight: isNew ? 700 : 600,
                                                color: NAVY, margin: 0, fontFamily: "'Lato',sans-serif",
                                                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {msg.senderName || msg.title || 'A student'}
                                            </p>
                                            <span style={{ fontSize: 8, color: '#bbb', flexShrink: 0,
                                                fontFamily: "'Lato',sans-serif" }}>
                                                {fmtTime(msg.createdAt)}
                                            </span>
                                        </div>
                                        <p style={{ fontSize: 10, color: isNew ? '#444' : '#aaa', margin: 0,
                                            fontFamily: "'Lato',sans-serif", overflow: 'hidden',
                                            textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                            fontWeight: isNew ? 600 : 400 }}>
                                            {msg.body || msg.message || 'Sent you a message'}
                                        </p>
                                    </div>

                                    {isNew && (
                                        <div style={{ width: 7, height: 7, borderRadius: '50%',
                                            background: GOLD, flexShrink: 0, marginTop: 5 }} />
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {/* Footer */}
                    <Link href="/collaborate" onClick={() => setOpen(false)} style={{ textDecoration: 'none' }}>
                        <div style={{ padding: '10px 14px', borderTop: '0.5px solid #f0ebe0',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                            background: CREAM, cursor: 'pointer', transition: 'background .15s' }}
                            onMouseEnter={e => e.currentTarget.style.background = '#ede8df'}
                            onMouseLeave={e => e.currentTarget.style.background = CREAM}>
                            <MessageSquare size={11} style={{ color: NAVY }} />
                            <span style={{ fontSize: 10, fontWeight: 700, color: NAVY,
                                fontFamily: "'Lato',sans-serif", letterSpacing: '.06em', textTransform: 'uppercase' }}>
                                Open Study Groups
                            </span>
                            <ArrowRight size={10} style={{ color: NAVY }} />
                        </div>
                    </Link>
                </div>
            )}
        </div>
    );
}

/* ══════════════════════════════════════════
   BOOK CARD
══════════════════════════════════════════ */
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
                            onError={e => { e.target.style.display = 'none'; if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex'; }} />
                        : null}
                    <div style={{ display: thumb ? 'none' : 'flex', width: '100%', aspectRatio: '3/4',
                        alignItems: 'center', justifyContent: 'center', background: '#ede8df', flexDirection: 'column', gap: 6 }}>
                        <BookOpen size={24} style={{ color: '#ccc' }} />
                        <span style={{ fontSize: 9, color: '#bbb', textAlign: 'center', padding: '0 8px', fontFamily: "'Lato',sans-serif" }}>
                            {(book.title || '').slice(0, 28)}
                        </span>
                    </div>
                    <div style={{ position: 'absolute', top: 6, left: 6, background: NAVY, color: '#fff', fontSize: 7,
                        fontWeight: 700, padding: '2px 6px', letterSpacing: '.06em', display: 'flex', alignItems: 'center',
                        gap: 3, fontFamily: "'Lato',sans-serif" }}>
                        <span style={{ width: 4, height: 4, borderRadius: '50%', background: '#22c55e', display: 'inline-block' }} />PDF
                    </div>
                    {badge && <div style={{ position: 'absolute', bottom: 6, left: 6, background: GOLD, color: NAVY,
                        fontSize: 7, fontWeight: 700, padding: '2px 6px', fontFamily: "'Lato',sans-serif", letterSpacing: '.06em' }}>{badge}</div>}
                    {owned && <div style={{ position: 'absolute', top: 6, right: 6, background: '#16a34a', color: '#fff',
                        fontSize: 7, fontWeight: 700, padding: '2px 6px', fontFamily: "'Lato',sans-serif" }}>OWNED</div>}
                </div>
                <div style={{ padding: '9px 9px 11px', borderTop: '0.5px solid #f0ebe0' }}>
                    <p style={{ fontFamily: "'Playfair Display',serif", fontSize: 11, fontWeight: 700, color: NAVY,
                        margin: '0 0 3px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                        overflow: 'hidden', lineHeight: 1.3 }}>
                        {book.title || book.bookTitle || 'Untitled'}
                    </p>
                    <p style={{ fontSize: 9, color: '#888', margin: '0 0 5px', overflow: 'hidden',
                        textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: "'Lato',sans-serif" }}>
                        {book.lecturerTitle ? `${book.lecturerTitle} ` : ''}{book.author || book.sellerName || book.lecturerName || ''}
                    </p>
                    {book.price && !owned && (
                        <p style={{ fontSize: 10, fontWeight: 700, color: NAVY, margin: 0, fontFamily: "'Lato',sans-serif" }}>
                            ₦{Number(book.price).toLocaleString()}
                        </p>
                    )}
                </div>
            </div>
        </Link>
    );
}

/* ══════════════════════════════════════════
   LECTURER CARD
══════════════════════════════════════════ */
function LecturerCard({ lecturer }) {
    const pal   = getPalette(lecturer.sellerName || '?');
    const ini   = getInitials(lecturer.sellerName || '?');
    const name  = lecturer.sellerName || 'Lecturer';
    const title = lecturer.title?.toLowerCase().includes('lecturer') ? 'Lecturer' : lecturer.title;
    const href  = `/seller-profile?sellerId=${lecturer.sellerId}`;
    return (
        <div className="lec-card">
            <div style={{ position: 'relative', overflow: 'hidden' }}>
                {lecturer.photo
                    ? <img src={lecturer.photo} alt={name} className="lec-img"
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
                        padding: '2px 8px', fontFamily: "'Lato',sans-serif", display: 'flex', alignItems: 'center', gap: 3 }}>
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

/* ══════════════════════════════════════════
   ACTIVE STUDENT ROW
══════════════════════════════════════════ */
function ActiveStudentRow({ student, rank }) {
    const rankColors = ['#b8963e','#aaa','#cd7f32'];
    const rankBg = rank < 3
        ? `rgba(${rank===0?'184,150,62':rank===1?'170,170,170':'205,127,50'},.1)`
        : 'rgba(13,34,68,.04)';
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '9px 0', borderBottom: '0.5px solid #f0ebe0' }}>
            <div style={{ width: 22, height: 22, borderRadius: '50%', background: rankBg, flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: 9, fontWeight: 700, color: rankColors[rank] || '#888',
                    fontFamily: "'Lato',sans-serif" }}>{rank + 1}</span>
            </div>
            <Avatar name={student.name} src={student.photoURL} size={30} />
            <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: NAVY, margin: 0, overflow: 'hidden',
                    textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: "'Lato',sans-serif" }}>{student.name}</p>
                <p style={{ fontSize: 9, color: '#aaa', margin: 0, fontFamily: "'Lato',sans-serif",
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{student.university || 'Student'}</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#16a34a' }} />
                <span style={{ fontSize: 9, color: '#16a34a', fontWeight: 700, fontFamily: "'Lato',sans-serif" }}>Active</span>
            </div>
        </div>
    );
}

/* ══════════════════════════════════════════
   INLINE AD CARD — fits inside .bg grid
══════════════════════════════════════════ */
function InlineAdCard({ ad }) {
    const handleClick = async () => {
        const id = ad.adId || ad.id;
        if (id) {
            try { await updateDoc(doc(db, "promotions", id), { clicks: increment(1) }); } catch { }
        }
        const link = ad.adLink || ad.link;
        if (link) window.open(link, '_blank');
    };

    // Handle different field names useAds might return
    const imgSrc = ad.image || ad.imageUrl || ad.coverImage || ad.thumbnail || null;
    const title = ad.title || ad.bookTitle || ad.name || 'Sponsored';
    const author = ad.author || ad.sponsor || ad.sellerName || 'Sponsored Content';

    return (
        <div onClick={handleClick} className="book-card" style={{ cursor: 'pointer' }}>
            <div style={{ position: 'relative', background: '#ede8df', overflow: 'hidden' }}>
                {imgSrc
                    ? <img src={imgSrc} alt={title}
                        style={{ width: '100%', aspectRatio: '3/4', objectFit: 'cover', display: 'block' }}
                        onError={e => e.target.style.display = 'none'} />
                    : <div style={{
                        width: '100%', aspectRatio: '3/4', background: '#ede8df',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                        <BookOpen size={24} style={{ color: '#ccc' }} />
                    </div>
                }
                {/* "FEATURED · GOLD" label matching image 2 style */}
                <div style={{
                    position: 'absolute', top: 0, left: 0, right: 0,
                    background: 'rgba(13,34,68,.75)', padding: '4px 7px',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                }}>
                    <span style={{
                        fontSize: 7, fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase',
                        color: GOLDD, fontFamily: "'Lato',sans-serif"
                    }}>
                        Featured · {ad.tier || 'Gold'}
                    </span>
                    <span style={{
                        fontSize: 7, fontWeight: 700, background: GOLD, color: NAVY,
                        padding: '1px 5px', fontFamily: "'Lato',sans-serif"
                    }}>AD</span>
                </div>
                {/* PDF badge */}
                <div style={{
                    position: 'absolute', bottom: 6, left: 6, background: NAVY, color: '#fff', fontSize: 7,
                    fontWeight: 700, padding: '2px 6px', letterSpacing: '.06em', display: 'flex', alignItems: 'center',
                    gap: 3, fontFamily: "'Lato',sans-serif"
                }}>
                    <span style={{ width: 4, height: 4, borderRadius: '50%', background: '#22c55e', display: 'inline-block' }} />PDF
                </div>
            </div>
            <div style={{ padding: '9px 9px 11px', borderTop: '0.5px solid #f0ebe0' }}>
                <p style={{
                    fontFamily: "'Playfair Display',serif", fontSize: 11, fontWeight: 700, color: NAVY,
                    margin: '0 0 3px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                    overflow: 'hidden', lineHeight: 1.3
                }}>
                    {title}
                </p>
                <p style={{
                    fontSize: 9, color: '#888', margin: 0, overflow: 'hidden',
                    textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: "'Lato',sans-serif"
                }}>
                    {author}
                </p>
            </div>
        </div>
    );
}

/* ══════════════════════════════════════════
   MAIN DASHBOARD
══════════════════════════════════════════ */
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
    const [selectedLecturer, setSelectedLecturer] = useState(null);
    const [showAllLecturers, setShowAllLecturers] = useState(false);    
    const [pendingBounties, setPendingBounties]       = useState([]);
    const [approvalBounty,  setApprovalBounty]        = useState(null); 
    const goldAds   = useAds("Gold",   3);
    const silverAds = useAds("Silver", 2);
    const bronzeAds = useAds("Bronze", 2);  
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
                    ...b, title: b.title || b.bookTitle || '', firestoreId: b.bookId || b.firestoreId || '',
                }))
            );
            if (ud.savedBooks) setWishlist(Object.values(ud.savedBooks));

            if (ud.isSeller) {
                try { const sd = await getDoc(doc(db,'sellers',uid)); if (sd.exists()) setSellerStats(sd.data()); } catch {}
            }

            try {
                const sq = query(collection(db,'ai_chat_sessions'), where('userId','==',uid));
                const ss = await getDocs(sq);
                setAiSessions(ss.docs.map(d=>({id:d.id,...d.data()}))
                    .sort((a,b)=>(b.updatedAt?.toDate?.()?.getTime()||0)-(a.updatedAt?.toDate?.()?.getTime()||0))
                    .slice(0,6));
            } catch {}

            try {
                const sq = query(collection(db,'users'), where('isStudent','==',true), limit(40));
                const ss = await getDocs(sq);
                setActiveStudents(ss.docs.map(d => {
                    const data = d.data();
                    return {
                        id: d.id,
                        name: data.displayName || `${data.firstName||''} ${data.surname||''}`.trim() || 'Student',
                        photoURL: data.photoBase64 || data.photoURL || null,
                        university: data.university || data.institution || '',
                    };
                }).filter(s => s.name && s.name !== 'Student' && s.id !== uid).slice(0,10));
            } catch {}

            const TITLES = ['Lecturer', 'Dr.', 'Prof.', 'Professor', 'Engr.', 'Pharm.', 'Barr.'];
            const seenIds = new Set(); const rawLecs = [];
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
                        } catch {}
                        rawLecs.push({ sellerId:d.id, sellerName:data.sellerName||'Lecturer',
                            title:data.title||'', department:data.department||data.faculty||'',
                            university:data.university||data.institution||'', uploadedBooks:0, photo });
                    }
                } catch {}
            }
            await Promise.all(rawLecs.map(async l => {
                try { const bq=query(collection(db,'advertMyBook'),where('sellerId','==',l.sellerId),where('status','==','approved')); l.uploadedBooks=(await getDocs(bq)).size; } catch {}
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
                            const data=d.data(); const lec=rawLecs.find(l=>l.sellerId===data.sellerId);
                            lecBooks.push({...data,id:`lb-${d.id}`,firestoreId:d.id,
                                title:data.bookTitle||data.title||'',
                                lecturerName:lec?.sellerName||data.sellerName||'',lecturerTitle:lec?.title||''});
                        });
                    } catch {}
                }
                const seen2=new Set();
                setLecturerBooks(lecBooks.filter(b=>{if(seen2.has(b.firestoreId))return false;seen2.add(b.firestoreId);return true;})
                    .sort((a,b)=>(b.createdAt?.toDate?.()?.getTime()||0)-(a.createdAt?.toDate?.()?.getTime()||0)).slice(0,10));
            }

            try {
                const bq = query(
                    collection(db, 'bounties'),
                    where('postedById',  '==', uid),
                    where('status',      '==', 'pending_approval')
                );
                const bs = await getDocs(bq);
                setPendingBounties(bs.docs.map(d => ({ id: d.id, ...d.data() })));
                } catch {}

            try {
                const lecIds=new Set(seenIds);
                const bs=await getDocs(query(collection(db,'advertMyBook'),where('status','==','approved')));
                const seen3=new Set();
                setLatestBooks(bs.docs.filter(d=>!lecIds.has(d.data().sellerId))
                    .map(d=>({...d.data(),id:`nb-${d.id}`,firestoreId:d.id,title:d.data().bookTitle||d.data().title||''}))
                    .filter(b=>{if(seen3.has(b.firestoreId))return false;seen3.add(b.firestoreId);return true;})
                    .sort((a,b)=>(b.createdAt?.toDate?.()?.getTime()||0)-(a.createdAt?.toDate?.()?.getTime()||0)).slice(0,10));
            } catch {}

            try {
                const bq=query(collection(db,'advertMyBook'),where('status','==','approved'),orderBy('createdAt','desc'),limit(8));
                const bs=await getDocs(bq);
                setCampusBooks(bs.docs.map(d=>({...d.data(),firestoreId:d.id,title:d.data().bookTitle||d.data().title||''})));
            } catch {}

        } catch(e){console.error(e);}
        finally{setLoading(false);}
    };

    if (loading) return (
        <div style={{minHeight:'100vh',background:BG,display:'flex',alignItems:'center',justifyContent:'center'}}>
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
            <div style={{textAlign:'center'}}>
                <div style={{width:52,height:52,border:`3px solid ${GOLD}`,borderTopColor:'transparent',borderRadius:'50%',animation:'spin .8s linear infinite',margin:'0 auto 14px'}}/>
                <p style={{fontFamily:"'Playfair Display',serif",fontSize:16,color:NAVY}}>Loading dashboard…</p>
            </div>
        </div>
    );

    const displayName = user?.displayName || `${user?.firstName||''} ${user?.surname||''}`.trim() || 'Scholar';

    const SH = ({ label, title, action }) => (
        <div style={{display:'flex',alignItems:'flex-end',justifyContent:'space-between',marginBottom:16,gap:8,flexWrap:'wrap'}}>
            <div style={{minWidth:0}}>
                <p className="sl">{label}</p>
                <h3 className="st">{title}</h3>
            </div>
            {action && <div style={{flexShrink:0}}>{action}</div>}
        </div>
    );

    /* ── HOME ── */
    const renderHome = () => (
        <div style={{display:'flex',flexDirection:'column',gap:28}}>

            {/* Hero */}
            <div className="hero">
                <div style={{position:'absolute',top:-40,right:-40,width:160,height:160,border:'0.5px solid rgba(184,150,62,.15)',transform:'rotate(45deg)',pointerEvents:'none'}}/>
                <div style={{position:'absolute',bottom:-30,left:-20,width:90,height:90,border:'0.5px solid rgba(184,150,62,.1)',transform:'rotate(45deg)',pointerEvents:'none'}}/>
               <div style={{position:'relative',width:'100%'}}>

    {/* ── Top badge ── */}
    <div style={{display:'inline-flex',alignItems:'center',gap:5,background:'rgba(184,150,62,.14)',border:'1px solid rgba(184,150,62,.3)',borderRadius:999,padding:'4px 12px',marginBottom:12}}>
        <Sparkles size={9} style={{color:GOLD}}/>
        <span style={{fontSize:8,fontWeight:700,letterSpacing:'.14em',textTransform:'uppercase',color:GOLDD,fontFamily:"'Lato',sans-serif"}}>{user?.university||'LAN Library'}</span>
    </div>

    {/* ── Name + stats side by side on mobile, stacked on very small ── */}
    <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:12,marginBottom:14}}>

        {/* Left: name + meta */}
        <div style={{flex:1,minWidth:0}}>
            <h2 className="lan-serif" style={{fontSize:'clamp(22px,6vw,38px)',fontWeight:900,color:'#fff',margin:'0 0 6px',lineHeight:1.05,wordBreak:'break-word'}}>
                Welcome back,<br/>
                <span style={{color:GOLD,fontStyle:'italic'}}>{user?.firstName||'Scholar'} ✦</span>
            </h2>
            <p style={{fontSize:11,color:'rgba(245,240,232,.55)',fontFamily:"'Lato',sans-serif",margin:'0 0 4px'}}>
                {library.length} {library.length===1?'book':'books'} · {aiSessions.length} AI sessions
            </p>
            {(user?.department||user?.faculty||user?.institution||user?.university) && (
                <div style={{display:'flex',flexDirection:'column',gap:2,marginTop:4}}>
                    {(user?.department||user?.faculty) && (
                        <span style={{fontSize:10,color:'rgba(184,150,62,.8)',fontFamily:"'Lato',sans-serif",display:'flex',alignItems:'center',gap:3}}>
                            <BookMarked size={8} style={{color:GOLD,flexShrink:0}}/>{user.department||user.faculty}
                        </span>
                    )}
                    {(user?.institution||user?.university) && (
                        <span style={{fontSize:10,color:'rgba(184,150,62,.6)',fontFamily:"'Lato',sans-serif",display:'flex',alignItems:'center',gap:3}}>
                            <GraduationCap size={8} style={{color:GOLD,flexShrink:0}}/>{user.institution||user.university}
                        </span>
                    )}
                </div>
            )}
        </div>

        {/* Right: 2×2 stat grid — compact on mobile */}
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:6,flexShrink:0,width:'clamp(130px,36vw,180px)'}}>
            {[
                {icon:BookOpen,label:'Books',   val:library.length,       accent:GOLD},
                {icon:Sparkles,label:'AI Chats',val:aiSessions.length,    accent:'#a78bfa'},
                {icon:Heart,   label:'Saved',   val:wishlist.length,       accent:'#f87171'},
                {icon:Users,   label:'Online',  val:activeStudents.length, accent:'#34d399'},
            ].map(({icon:Icon,label,val,accent})=>(
                <div key={label} style={{background:'rgba(255,255,255,.07)',border:'0.5px solid rgba(255,255,255,.1)',padding:'8px 6px',textAlign:'center'}}>
                    <Icon size={12} style={{color:accent,margin:'0 auto 3px'}}/>
                    <p className="lan-serif" style={{fontSize:'clamp(14px,4vw,20px)',fontWeight:700,color:'#fff',margin:0,lineHeight:1}}>{val}</p>
                    <p style={{fontSize:7,fontWeight:700,letterSpacing:'.06em',textTransform:'uppercase',color:'rgba(245,240,232,.4)',fontFamily:"'Lato',sans-serif",margin:'2px 0 0'}}>{label}</p>
                </div>
            ))}
        </div>
    </div>

    {/* ── CTA button — full width on mobile ── */}
    <Link href="/ai-chat" style={{display:'block'}}>
        <button className="btn-gold" style={{width:'100%',justifyContent:'center',padding:'11px 18px'}}>
            <Sparkles size={12}/> Chat with AI Tutor
        </button>
    </Link>
</div>
</div>

            {library.length > 0 && (
                <section>
                    <SH label="My Library" title="Jump Back In" action={<button onClick={()=>setActiveTab('library')} className="slink">Full Library <ChevronRight size={11}/></button>}/>
                    <div className="bg">
                          {[...library.slice(0,5)].reduce((acc, b, i) => {
                            acc.push(<BookCard key={b.bookId||i} book={b} owned/>);
                            if (i === 1 && goldAds[0]) acc.push(<InlineAdCard key="ad-lib-0" ad={goldAds[0]}/>);
                            if (i === 3 && silverAds[0]) acc.push(<InlineAdCard key="ad-lib-1" ad={silverAds[0]}/>);
                            return acc;
                          }, [])}
                        </div>
                        <div style={{ marginTop:"20px" }}>
                          <FeaturedAdsCarousel tier="Silver" maxAds={2} autoPlay={true} autoPlayMs={5000} />
                        </div>
                </section>
            )}

           {/* ── FACULTY DIRECTORY — one featured + slide-out panel ── */}
{lecturers.length > 0 && (() => {
    const featured = lecturers[0];
    const featuredBooks = lecturerBooks.filter(b =>
        b.sellerId === featured.sellerId || b.lecturerName === featured.sellerName
    );
    return (
        <section>
            <SH
                label="Faculty Directory"
                title={`Our Lecturers · ${lecturers.length} on LAN`}
                action={
                    <button onClick={() => setShowAllLecturers(true)} className="slink">
                        View All <ChevronRight size={11} />
                    </button>
                }
            />

            {/* ── Single featured lecturer card ── */}
            <div style={{ background: '#fff', border: '0.5px solid #e5ddd0', overflow: 'hidden' }}>

                {/* Header row */}
                <div
                    onClick={() => setSelectedLecturer(featured)}
                    style={{
                        display: 'flex', alignItems: 'center', gap: 14,
                        padding: '16px 18px',
                        borderBottom: featuredBooks.length > 0 ? '0.5px solid #f0ebe0' : 'none',
                        cursor: 'pointer', transition: 'background .15s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = CREAM}
                    onMouseLeave={e => e.currentTarget.style.background = '#fff'}
                >
                    {featured.photo ? (
                        <img src={featured.photo} alt={featured.sellerName}
                            style={{ width: 52, height: 52, borderRadius: '50%', objectFit: 'cover', objectPosition: 'top', border: `2px solid ${GOLD}`, flexShrink: 0 }}
                            onError={e => e.target.style.display = 'none'} />
                    ) : (
                        <div style={{ width: 52, height: 52, borderRadius: '50%', background: getPalette(featured.sellerName).bg, border: `2px solid ${GOLD}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <span style={{ color: getPalette(featured.sellerName).text, fontSize: 18, fontWeight: 700, fontFamily: "'Playfair Display',serif" }}>{getInitials(featured.sellerName)}</span>
                        </div>
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                            <p style={{ fontSize: 14, fontWeight: 700, color: NAVY, margin: 0, fontFamily: "'Playfair Display',serif", overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {featured.title ? `${featured.title} ${featured.sellerName}` : featured.sellerName}
                            </p>
                            {featured.title && (
                                <span style={{ fontSize: 7, fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', color: GOLD, background: 'rgba(184,150,62,.1)', border: '0.5px solid rgba(184,150,62,.3)', padding: '2px 8px', fontFamily: "'Lato',sans-serif", flexShrink: 0 }}>
                                    {featured.title}
                                </span>
                            )}
                        </div>
                        {featured.department && (
                            <p style={{ fontSize: 11, color: '#888', margin: '4px 0 0', fontFamily: "'Lato',sans-serif", display: 'flex', alignItems: 'center', gap: 4 }}>
                                <BookMarked size={9} style={{ color: GOLD, flexShrink: 0 }} />
                                {featured.department}
                                {featured.university && <span style={{ color: '#ccc' }}>· {featured.university}</span>}
                            </p>
                        )}
                        <p style={{ fontSize: 10, color: GOLD, margin: '4px 0 0', fontFamily: "'Lato',sans-serif", fontWeight: 700 }}>
                            {featured.uploadedBooks} material{featured.uploadedBooks !== 1 ? 's' : ''} uploaded
                        </p>
                    </div>
                    <ChevronRight size={13} style={{ color: '#ccc', flexShrink: 0 }} />
                </div>

                {/* Featured books */}
                {featuredBooks.length > 0 && (
                    <div style={{ padding: '14px 18px 18px' }}>
                        <p style={{ fontSize: 8, fontWeight: 700, letterSpacing: '.14em', textTransform: 'uppercase', color: '#bbb', fontFamily: "'Lato',sans-serif", margin: '0 0 12px' }}>
                            Materials by this lecturer
                        </p>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 10 }}>
                            {featuredBooks.slice(0, 4).map((book, bi) => (
                                <BookCard key={book.firestoreId || bi} book={book} badge="Lecturer" />
                            ))}
                            {featuredBooks.length > 4 && (
                                <div onClick={() => setSelectedLecturer(featured)}
                                    style={{ background: CREAM, border: '0.5px dashed rgba(184,150,62,.4)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', aspectRatio: '3/4', cursor: 'pointer', gap: 6 }}
                                    onMouseEnter={e => { e.currentTarget.style.background = '#ede8df'; e.currentTarget.style.borderColor = GOLD; }}
                                    onMouseLeave={e => { e.currentTarget.style.background = CREAM; e.currentTarget.style.borderColor = 'rgba(184,150,62,.4)'; }}>
                                    <span style={{ fontSize: 20, fontWeight: 700, color: NAVY, fontFamily: "'Playfair Display',serif" }}>+{featuredBooks.length - 4}</span>
                                    <span style={{ fontSize: 8, fontWeight: 700, color: GOLD, fontFamily: "'Lato',sans-serif", letterSpacing: '.1em', textTransform: 'uppercase' }}>More</span>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {featuredBooks.length === 0 && (
                    <div style={{ padding: '12px 18px', display: 'flex', alignItems: 'center', gap: 8 }}>
                        <BookOpen size={13} style={{ color: '#e5ddd0' }} />
                        <p style={{ fontSize: 10, color: '#ccc', margin: 0, fontFamily: "'Lato',sans-serif" }}>No materials uploaded yet</p>
                    </div>
                )}
            </div>

            {/* View all teaser */}
            {lecturers.length > 1 && (
                <button onClick={() => setShowAllLecturers(true)}
                    style={{ marginTop: 12, width: '100%', padding: '11px', background: 'transparent', border: '0.5px dashed rgba(13,34,68,.2)', color: NAVY, fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: "'Lato',sans-serif", letterSpacing: '.04em', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, transition: 'all .18s' }}
                    onMouseEnter={e => { e.currentTarget.style.background = CREAM; e.currentTarget.style.borderColor = GOLD; e.currentTarget.style.color = GOLD; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'rgba(13,34,68,.2)'; e.currentTarget.style.color = NAVY; }}>
                    <Users size={13} /> View All {lecturers.length} Lecturers
                </button>
            )}
        </section>
    );
})()}

            <section>
                <SH label="Faculty Uploads" title="New from Lecturers" action={<Link href="/documents?filter=lecturer" className="slink">Browse All <ChevronRight size={11}/></Link>}/>
                {lecturerBooks.length===0
                    ? <div className="eb"><BookMarked size={28} style={{color:'#e5ddd0',margin:'0 auto 8px'}}/><p className="et">No lecturer books yet</p></div>
                    : <div className="bg">
    {[...lecturerBooks.slice(0,5)].reduce((acc, b, i) => {
        acc.push(<BookCard key={b.firestoreId||i} book={b} badge="Lecturer"/>);
        if (i === 1 && silverAds[0]) acc.push(<InlineAdCard key="ad-lec-0" ad={silverAds[0]}/>);
        return acc;
    }, [])}
</div>
                }
            </section>

            <section>
                <SH label="What's Happening" title="Campus Pulse" action={<Link href="/documents" className="slink">All Docs <ChevronRight size={11}/></Link>}/>
                <div style={{background:'#fff',border:'0.5px solid #e5ddd0',overflow:'hidden'}}>
                    {campusBooks.length===0
                        ? <div className="eb" style={{border:'none'}}><Activity size={28} style={{color:'#e5ddd0',margin:'0 auto 8px'}}/><p className="et">No activity yet</p></div>
                        : campusBooks.map((b,i)=>{
                            const thumb=getThumbnailUrl(b);
                            return (
                                <Link key={b.firestoreId||i} href={`/book/preview?id=${b.firestoreId}`} style={{textDecoration:'none'}}>
                                    <div className="cr">
                                        <div style={{width:22,flexShrink:0,textAlign:'center'}}><span style={{fontSize:10,fontWeight:700,color:i<3?GOLD:'#ccc',fontFamily:"'Lato',sans-serif"}}>{i+1}</span></div>
                                        <div style={{width:36,height:48,background:'#ede8df',flexShrink:0,overflow:'hidden'}}>
                                            {thumb?<img src={thumb} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}} onError={e=>e.target.style.display='none'}/>:<div style={{width:'100%',height:'100%',display:'flex',alignItems:'center',justifyContent:'center'}}><BookOpen size={12} style={{color:'#ccc'}}/></div>}
                                        </div>
                                        <div style={{flex:1,minWidth:0}}>
                                            <p style={{fontSize:11,fontWeight:700,color:NAVY,margin:'0 0 2px',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',fontFamily:"'Lato',sans-serif"}}>{b.title}</p>
                                            <p style={{fontSize:9,color:'#888',margin:'0 0 3px',fontFamily:"'Lato',sans-serif",overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{b.sellerName||b.author||''}</p>
                                            <div style={{display:'flex',alignItems:'center',gap:6}}>
                                                <span style={{fontSize:10,fontWeight:700,color:NAVY,fontFamily:"'Lato',sans-serif"}}>₦{Number(b.price||0).toLocaleString()}</span>
                                                {b.category&&<span style={{fontSize:7,fontWeight:700,background:CREAM,border:'0.5px solid rgba(184,150,62,.3)',color:GOLD,padding:'1px 6px',fontFamily:"'Lato',sans-serif",textTransform:'uppercase',letterSpacing:'.06em'}}>{b.category}</span>}
                                            </div>
                                        </div>
                                        <ChevronRight size={12} style={{color:'#ccc',flexShrink:0}}/>
                                    </div>
                                </Link>
                            );
                        })
                    }
                </div>
            </section>

            <section>
                <SH label="Fresh Uploads" title="Just Added" action={<Link href="/documents" className="slink">All Books <ChevronRight size={11}/></Link>}/>
                {latestBooks.length===0
                    ? <div className="eb"><Zap size={28} style={{color:'#e5ddd0',margin:'0 auto 8px'}}/><p className="et">No books yet</p></div>
                    : <>
    <div className="bg">
      {[...latestBooks.slice(0,5)].reduce((acc, b, i) => {
        acc.push(<BookCard key={b.firestoreId||i} book={b}/>);
        if (i === 1 && goldAds[1]) acc.push(<InlineAdCard key="ad-new-0" ad={goldAds[1]}/>);
        if (i === 3 && bronzeAds[0]) acc.push(<InlineAdCard key="ad-new-1" ad={bronzeAds[0]}/>);
        return acc;
      }, [])}
    </div>
    <div style={{ marginTop:"20px" }}>
      <FeaturedAdsCarousel tier="Bronze" maxAds={2} autoPlay={true} autoPlayMs={4500} />
    </div>
  </>
                }
            </section>

            <section>
                <p className="sl">Resources</p><h3 className="st" style={{marginBottom:14}}>Learning Tools</h3>
                <div className="tg">
                    {[
                        {icon:Sparkles,label:'AI Book Chat', sub:'Ask anything about your books',href:'/ai-chat',               accent:true},
                        {icon:FileText,label:'Study Notes',  sub:'Summarise & save',           href:'/ai-chat',               accent:false},
                        {icon:BookCopy,label:'Past Questions',sub:'Exam prep resources',       href:'/document-type/past-question',accent:false},
                        {icon:Users,   label:'Study Groups', sub:'Collaborate with peers',     href:'/collaborate',           accent:false},
                    ].map(({icon:Icon,label,sub,href,accent})=>(
                        <Link key={label} href={href} style={{textDecoration:'none'}}>
                            <div className={`tc${accent?' tca':''}`}>
                                <Icon size={17} style={{color:accent?'#fff':GOLD,marginBottom:7}}/>
                                <p style={{fontSize:11,fontWeight:700,color:accent?'#fff':NAVY,margin:'0 0 3px',fontFamily:"'Lato',sans-serif"}}>{label}</p>
                                <p style={{fontSize:9,color:accent?'rgba(245,240,232,.6)':'#aaa',margin:0,fontFamily:"'Lato',sans-serif"}}>{sub}</p>
                            </div>
                        </Link>
                    ))}
                </div>
            </section>

            <section>
                <section style={{ padding: '0 0 32px' }}>
                <FeaturedAdsCarousel tier="Gold" maxAds={5} autoPlay={true} />
            </section>
                <div className="sp">
                    <div style={{position:'absolute',top:-20,right:-20,width:80,height:80,border:'0.5px solid rgba(184,150,62,.15)',transform:'rotate(45deg)',pointerEvents:'none'}}/>
                    {user?.isSeller?(
                        <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:12,flexWrap:'wrap'}}>
                            <div>
                                <p style={{fontSize:9,fontWeight:700,letterSpacing:'.18em',textTransform:'uppercase',color:GOLD,margin:'0 0 4px',fontFamily:"'Lato',sans-serif"}}>Author Dashboard</p>
                                <p className="lan-serif" style={{fontSize:26,fontWeight:700,color:'#fff',margin:'0 0 3px'}}>₦{(sellerStats?.accountBalance||0).toLocaleString()}</p>
                                <p style={{fontSize:10,color:'rgba(245,240,232,.5)',fontFamily:"'Lato',sans-serif"}}>{sellerStats?.totalSales||sellerStats?.booksSold||0} total sales</p>
                            </div>
                            <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
                                <Link href="/upload-document"><button className="btn-gold">Upload</button></Link>
                                <Link href="/my-account/seller-account"><button className="btn-ghost">Studio</button></Link>
                            </div>
                        </div>
                    ):(
                        <>
                            <p style={{fontSize:9,fontWeight:700,letterSpacing:'.18em',textTransform:'uppercase',color:GOLD,margin:'0 0 10px',fontFamily:"'Lato',sans-serif"}}>Earn on LAN</p>
                            <h3 className="lan-serif" style={{fontSize:20,fontWeight:700,color:'#fff',margin:'0 0 7px'}}>Turn Notes<br/>into Cash 💸</h3>
                            <p style={{fontSize:11,color:'rgba(245,240,232,.55)',fontFamily:"'Lato',sans-serif",lineHeight:1.65,margin:'0 0 16px',maxWidth:300}}>Keep 80% of every sale. Join 500+ student authors.</p>
                            <Link href="/become-seller"><button className="btn-gold">Start Selling Now →</button></Link>
                        </>
                    )}
                </div>
            </section>

            <section>
                <div style={{display:'flex',alignItems:'flex-end',justifyContent:'space-between',marginBottom:14}}>
                    <div><p className="sl">Community</p><h3 className="st">Active Students</h3></div>
                    <div style={{display:'flex',alignItems:'center',gap:5}}>
                        <div style={{width:6,height:6,borderRadius:'50%',background:'#16a34a'}}/>
                        <span style={{fontSize:9,fontWeight:700,color:'#16a34a',fontFamily:"'Lato',sans-serif"}}>{activeStudents.length} online</span>
                    </div>
                </div>
                <div style={{background:'#fff',border:'0.5px solid #e5ddd0',padding:'4px 14px 0'}}>
                    {activeStudents.length===0
                        ? <div style={{padding:'28px 0',textAlign:'center'}}><Users size={26} style={{color:'#e5ddd0',margin:'0 auto 6px'}}/><p className="et">No active students right now</p></div>
                        : activeStudents.map((s,i)=><ActiveStudentRow key={s.id} student={s} rank={i}/>)
                    }
                </div>
            </section>
        </div>
    );

    /* ── LIBRARY ── */
    const renderLibrary = () => (
        <div>
              <section style={{ padding: '0 0 32px' }}>
                <FeaturedAdsCarousel tier="Gold" maxAds={5} autoPlay={true} />
            </section>
            <div style={{marginBottom:22}}><p className="sl">Your Collection</p><h2 className="lan-serif" style={{fontSize:24,fontWeight:700,color:NAVY,margin:'3px 0 0'}}>My Library</h2></div>
            {library.length===0
                ? <div className="eb" style={{padding:'56px 24px'}}>
                    <BookOpen size={44} style={{color:'#e5ddd0',margin:'0 auto 14px'}}/>
                    <h3 className="lan-serif" style={{fontSize:20,color:NAVY,marginBottom:6}}>Library is Empty</h3>
                    <p className="et" style={{marginBottom:18}}>Start building your collection</p>
                    <Link href="/documents"><button className="btn-navy">Browse Documents</button></Link>
                  </div>
                : <>
<div className="bg">
    {[...library.slice(0,5)].reduce((acc, b, i) => {
        acc.push(<BookCard key={b.bookId||i} book={b} owned/>);
        if (i === 1 && goldAds[0]) acc.push(<InlineAdCard key="ad-lib-0" ad={goldAds[0]}/>);
        return acc;
    }, [])}
                    </div>
                    <div style={{ marginTop: 22, borderTop: '0.5px solid #f0ebe0', paddingTop: 22 }}>
                        <p className="sl" style={{marginBottom:10}}>AI Tutor</p>
                        <h3 className="lan-serif" style={{fontSize:17,color:NAVY,margin:'0 0 12px'}}>Chat About Your Books</h3>
                        <div style={{display:'flex',flexDirection:'column',gap:7}}>
                            {library.slice(0,4).map((b,i)=>(
                                <Link key={i} href={`/ai-chat?bookId=${b.bookId||b.firestoreId||b.id}&bookTitle=${encodeURIComponent(b.title||'')}`} style={{textDecoration:'none'}}>
                                    <div className="ab">
                                        <div style={{width:32,height:32,background:'rgba(255,255,255,.15)',border:'0.5px solid rgba(255,255,255,.2)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}><Sparkles size={13} style={{color:'#fff'}}/></div>
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
                  </>
            }
        </div>
    );

    {
        pendingBounties.length > 0 && (
            <div style={{ marginTop: 24, borderTop: '0.5px solid #f0ebe0', paddingTop: 22 }}>
                <p className="sl" style={{ marginBottom: 6 }}>Action Required</p>
                <h3 className="lan-serif" style={{ fontSize: 17, color: NAVY, margin: '0 0 12px' }}>
                    Bounties Awaiting Your Review
                </h3>
                {pendingBounties.map(b => (
                    <div key={b.id} style={{ background: '#fff', border: `0.5px solid ${GOLD}`, padding: '14px 16px', marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ fontSize: 13, fontWeight: 700, color: NAVY, margin: '0 0 2px', fontFamily: "'Lato',sans-serif", overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{b.title}</p>
                            <p style={{ fontSize: 10, color: '#aaa', margin: 0, fontFamily: "'Lato',sans-serif" }}>
                                Submitted by <strong style={{ color: NAVY }}>{b.claimedByName || 'Author'}</strong> · ₦{Number(b.reward).toLocaleString()} in escrow
                            </p>
                        </div>
                        <button
                            onClick={() => setApprovalBounty({ id: b.id, data: b })}
                            style={{ padding: '9px 18px', background: GOLD, color: NAVY, border: 'none', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: "'Lato',sans-serif", letterSpacing: '0.06em', flexShrink: 0 }}
                        >
                            Review →
                        </button>
                    </div>
                ))}
            </div>
        )
    }

    /* ── AI ── */
    const renderAI = () => (
        <div>
            <div style={{marginBottom:22,display:'flex',alignItems:'flex-end',justifyContent:'space-between',gap:8,flexWrap:'wrap'}}>
                <div><p className="sl">Powered by Claude</p><h2 className="lan-serif" style={{fontSize:24,fontWeight:700,color:NAVY,margin:'3px 0 0'}}>AI Tutor</h2></div>
                <Link href="/ai-chat"><button className="btn-navy" style={{display:'flex',alignItems:'center',gap:5}}><Plus size={12}/> New Chat</button></Link>
            </div>
            <div className="sp" style={{marginBottom:22}}>
                <div style={{position:'absolute',top:-20,right:-20,width:80,height:80,border:'0.5px solid rgba(184,150,62,.15)',transform:'rotate(45deg)',pointerEvents:'none'}}/>
                <Sparkles size={20} style={{color:GOLD,marginBottom:10}}/>
                <h3 className="lan-serif" style={{fontSize:20,fontWeight:700,color:'#fff',margin:'0 0 6px'}}>Ask anything about your books</h3>
                <p style={{fontSize:11,color:'rgba(245,240,232,.55)',fontFamily:"'Lato',sans-serif",margin:'0 0 16px'}}>Summaries, key concepts, exam tips, explanations.</p>
                <Link href="/ai-chat"><button className="btn-gold">Start AI Chat →</button></Link>
            </div>
            {aiSessions.length>0&&(
                <div style={{marginBottom:22}}>
                    <p className="sl" style={{marginBottom:10}}>Recent</p>
                    <h3 className="lan-serif" style={{fontSize:17,color:NAVY,margin:'0 0 12px'}}>Your Conversations</h3>
                    <div style={{display:'flex',flexDirection:'column',gap:6}}>
                        {aiSessions.map(s=>(
                            <Link key={s.id} href={`/ai-chat?sessionId=${s.id}&bookId=${s.bookId}&bookTitle=${encodeURIComponent(s.bookTitle||'')}`} style={{textDecoration:'none'}}>
                                <div className="ar">
                                    <div style={{width:34,height:34,border:'0.5px solid #e5ddd0',background:CREAM,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}><MessageSquare size={13} style={{color:NAVY}}/></div>
                                    <div style={{flex:1,minWidth:0}}>
                                        <p style={{fontSize:11,fontWeight:700,color:NAVY,margin:'0 0 2px',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',fontFamily:"'Lato',sans-serif"}}>{s.title||'New conversation'}</p>
                                        <p style={{fontSize:9,color:GOLD,margin:0,fontFamily:"'Lato',sans-serif",overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{s.bookTitle||''}</p>
                                    </div>
                                    <div style={{textAlign:'right',flexShrink:0}}>
                                        <p style={{fontSize:9,color:'#aaa',margin:0,fontFamily:"'Lato',sans-serif"}}>{s.messages?.length||0} msgs</p>
                                        <p style={{fontSize:8,color:'#ccc',margin:'2px 0 0',fontFamily:"'Lato',sans-serif"}}>{fmtTime(s.updatedAt)}</p>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            )}
            {library.length>0&&(
                <div>
                    <p className="sl" style={{marginBottom:10}}>Quick Access</p>
                    <h3 className="lan-serif" style={{fontSize:17,color:NAVY,margin:'0 0 12px'}}>Chat About Your Books</h3>
                    <div style={{display:'flex',flexDirection:'column',gap:7}}>
                        {library.map((b,i)=>(
                            <Link key={i} href={`/ai-chat?bookId=${b.bookId||b.firestoreId||b.id}&bookTitle=${encodeURIComponent(b.title||'')}`} style={{textDecoration:'none'}}>
                                <div className="ab">
                                    <div style={{width:32,height:32,background:'rgba(255,255,255,.15)',border:'0.5px solid rgba(255,255,255,.2)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}><Sparkles size={13} style={{color:'#fff'}}/></div>
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

    /* ── WISHLIST ── */
    const renderWishlist = () => (
        <div>
            <div style={{marginBottom:22,display:'flex',alignItems:'flex-end',justifyContent:'space-between',gap:8,flexWrap:'wrap'}}>
                <div><p className="sl">Your Wishlist</p><h2 className="lan-serif" style={{fontSize:24,fontWeight:700,color:NAVY,margin:'3px 0 0'}}>Saved Books</h2></div>
                <span style={{fontSize:11,color:'#aaa',fontFamily:"'Lato',sans-serif"}}>{wishlist.length} items</span>
            </div>
            {wishlist.length===0
                ? <div className="eb" style={{padding:'56px 24px'}}>
                    <Heart size={44} style={{color:'#e5ddd0',margin:'0 auto 14px'}}/>
                    <h3 className="lan-serif" style={{fontSize:20,color:NAVY,marginBottom:6}}>Nothing Saved Yet</h3>
                    <p className="et" style={{marginBottom:18}}>Browse and save books for later</p>
                    <Link href="/documents"><button className="btn-navy">Browse Documents</button></Link>
                  </div>
                : <div style={{display:'flex',flexDirection:'column',gap:8}}>
                    {wishlist.map((item,i)=>{
                        const thumb=getThumbnailUrl(item);
                        const navId=item.bookId||item.firestoreId||item.id;
                        return (
                            <div key={item.id||i} className="wr"
                                onMouseEnter={e=>e.currentTarget.style.borderColor=GOLD}
                                onMouseLeave={e=>e.currentTarget.style.borderColor='#e5ddd0'}>
                                <div style={{width:42,height:54,background:'#ede8df',flexShrink:0,overflow:'hidden'}}>
                                    {thumb?<img src={thumb} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}} onError={e=>e.target.style.display='none'}/>:<div style={{width:'100%',height:'100%',display:'flex',alignItems:'center',justifyContent:'center'}}><BookOpen size={14} style={{color:'#ccc'}}/></div>}
                                </div>
                                <div style={{flex:1,minWidth:0}}>
                                    <p style={{fontSize:12,fontWeight:700,color:NAVY,margin:'0 0 2px',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',fontFamily:"'Lato',sans-serif"}}>{item.title||item.bookTitle}</p>
                                    <p style={{fontSize:10,color:'#888',margin:'0 0 5px',fontFamily:"'Lato',sans-serif",overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{item.author||''}</p>
                                    <p style={{fontSize:12,fontWeight:700,color:NAVY,margin:0,fontFamily:"'Lato',sans-serif"}}>₦{Number(item.price||0).toLocaleString()}</p>
                                </div>
                                <div style={{display:'flex',gap:7,flexShrink:0}}>
                                    <Link href={`/payment?bookId=${navId}`}><button style={{padding:'7px 14px',background:NAVY,color:'#fff',border:'none',fontSize:10,fontWeight:700,cursor:'pointer',fontFamily:"'Lato',sans-serif"}}>Buy</button></Link>
                                    <Link href={`/book/preview?id=${navId}`}><button style={{padding:'7px 10px',background:'transparent',color:NAVY,border:'0.5px solid #e5ddd0',fontSize:10,fontWeight:700,cursor:'pointer',fontFamily:"'Lato',sans-serif"}}><Eye size={12}/></button></Link>
                                </div>
                            </div>
                        );
                    })}
                  </div>
            }
        </div>
    );

    /* ════════════════════════════════════
       RENDER
    ════════════════════════════════════ */
    return (
        <>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400&family=Lato:wght@300;400;700&display=swap');
          *, *::before, *::after { box-sizing: border-box; min-width: 0; }
          body { overflow-x: hidden; }

          .lan-root  { font-family: 'Lato', sans-serif; background: ${BG}; min-height: 100vh; }
          .lan-serif { font-family: 'Playfair Display', Georgia, serif; }

          /* ── Layout ── */
          .pw { display: flex; max-width: 1280px; margin: 0 auto; width: 100%; }

          /* ── Sidebar: hidden by default, visible only on ≥1024px ── */
          .sidebar {
            width: 220px; flex-shrink: 0;
            display: none;          /* << KEY: hidden on mobile */
            flex-direction: column;
            border-right: 0.5px solid #e5ddd0;
            min-height: calc(100vh - 64px);
            position: sticky; top: 64px; align-self: flex-start;
            background: #fff; padding: 22px 0;
          }
          @media (min-width: 1024px) { .sidebar { display: flex; } }

          /* ── Main ── */
          .mc {
            flex: 1; min-width: 0;
            padding: 0 16px 80px;   /* 80px bottom = nav height */
          }
          @media (min-width: 600px)  { .mc { padding: 0 24px 80px; } }
          @media (min-width: 1024px) { .mc { padding: 28px 32px 40px; } }

          /* ── Mobile top bar (hidden on desktop) ── */
          .mtb {
            display: flex; align-items: center; justify-content: space-between;
            padding: 12px 0 10px; margin-bottom: 4px;
            border-bottom: 0.5px solid #e5ddd0;
            position: sticky; top: 0; background: ${BG}; z-index: 50;
          }
          @media (min-width: 1024px) { .mtb { display: none; } }

          /* ── Hero ── */
          .hero {
            background-color: ${NAVY};
            background-image: radial-gradient(rgba(184,150,62,.06) 1px,transparent 1px), radial-gradient(rgba(255,255,255,.03) 1px,transparent 1px);
            background-size: 28px 28px, 14px 14px;
            background-position: 0 0, 7px 7px;
            padding: 26px 20px 22px; position: relative; overflow: hidden;
          }

          /* ── Labels / titles ── */
          .sl { font-size: 9px; font-weight: 700; letter-spacing: .2em; text-transform: uppercase; color: ${GOLD}; margin: 0 0 5px; font-family: 'Lato',sans-serif; display: block; }
          .st { font-family: 'Playfair Display',serif; font-size: clamp(16px,3vw,22px); font-weight: 700; color: ${NAVY}; margin: 0; }
          .slink { font-size: 10px; font-weight: 700; color: ${NAVY}; text-decoration: none; display: inline-flex; align-items: center; gap: 2px; letter-spacing: .04em; font-family: 'Lato',sans-serif; transition: color .15s; white-space: nowrap; cursor: pointer; background: none; border: none; padding: 0; }
          .slink:hover { color: ${GOLD}; }

          /* ── Grids ── */
          .bg { display: grid; grid-template-columns: repeat(2,1fr); gap: 12px; }
          @media (min-width: 480px)  { .bg { grid-template-columns: repeat(3,1fr); } }
          @media (min-width: 768px)  { .bg { grid-template-columns: repeat(4,1fr); gap: 14px; } }
          @media (min-width: 1024px) { .bg { grid-template-columns: repeat(5,1fr); } }

          .tg { display: grid; grid-template-columns: repeat(2,1fr); gap: 10px; }
          @media (min-width: 640px) { .tg { grid-template-columns: repeat(4,1fr); } }

          /* ── Horizontal scroll ── */
          .sr { display: flex; gap: 12px; overflow-x: auto; padding-bottom: 8px; width: 100%; scrollbar-width: none; -ms-overflow-style: none; }
          .sr::-webkit-scrollbar { display: none; }

          /* ── Cards ── */
          .book-card { background: #fff; border: 0.5px solid #e5ddd0; overflow: hidden; transition: transform .22s, box-shadow .22s, border-color .22s; cursor: pointer; }
          .book-card:hover { transform: translateY(-4px); box-shadow: 0 12px 28px rgba(13,34,68,.12); border-color: ${GOLD}; }
          .lec-card { background: #fff; border: 0.5px solid #e5ddd0; overflow: hidden; transition: transform .25s cubic-bezier(.4,0,.2,1), box-shadow .25s, border-color .25s; }
          .lec-card:hover { transform: translateY(-5px); box-shadow: 0 16px 40px rgba(13,34,68,.12); border-color: ${GOLD}; }
          .lec-card:hover .lec-img { transform: scale(1.05); }
          .lec-img { transition: transform .6s cubic-bezier(.4,0,.2,1); }
          .tc { background: #fff; border: 0.5px solid #e5ddd0; padding: 16px 13px; transition: transform .2s, border-color .2s, box-shadow .2s; height: 100%; cursor: pointer; }
          .tc:hover { transform: translateY(-3px); border-color: ${GOLD}; box-shadow: 0 8px 20px rgba(13,34,68,.08); }
          .tca { background: ${NAVY}; border-color: ${NAVY}; }
          .tca:hover { border-color: ${GOLD}; }
          .cr { display: flex; align-items: center; gap: 10px; padding: 10px 14px; border-bottom: 0.5px solid #f0ebe0; background: #fff; transition: background .15s; cursor: pointer; }
          .cr:hover { background: ${CREAM}; }
          .cr:last-child { border-bottom: none; }
          .sp { background: ${NAVY}; background-image: radial-gradient(rgba(184,150,62,.07) 1px,transparent 1px); background-size: 24px 24px; padding: 24px; position: relative; overflow: hidden; }
          .ab { display: flex; align-items: center; gap: 10px; background: ${NAVY}; padding: 10px 14px; transition: background .15s; }
          .ab:hover { background: #1a3a6e; }
          .ar { display: flex; align-items: center; gap: 10px; padding: 10px 14px; border: 0.5px solid #e5ddd0; background: #fff; transition: border-color .15s, background .15s; }
          .ar:hover { border-color: ${GOLD}; background: ${CREAM}; }
          .wr { background: #fff; border: 0.5px solid #e5ddd0; padding: 12px 14px; display: flex; gap: 12px; align-items: center; transition: border-color .18s; }

          /* ── Sidebar items ── */
          .sbi { display: flex; align-items: center; gap: 10px; padding: 10px 16px; cursor: pointer; font-size: 12px; font-weight: 700; color: #888; transition: all .15s; background: none; border: none; border-left: 2px solid transparent; width: 100%; text-align: left; font-family: 'Lato',sans-serif; }
          .sbi:hover { background: ${CREAM}; color: ${NAVY}; }
          .sbi.act { background: ${CREAM}; color: ${NAVY}; border-left-color: ${GOLD}; }

          /* ── Buttons ── */
          .btn-gold  { display: inline-flex; align-items: center; gap: 6px; padding: 9px 18px; background: ${GOLD}; color: ${NAVY}; border: none; font-size: 11px; font-weight: 700; cursor: pointer; font-family: 'Lato',sans-serif; letter-spacing: .04em; transition: background .18s; }
          .btn-gold:hover  { background: ${GOLDD}; }
          .btn-ghost { padding: 9px 18px; background: rgba(255,255,255,.1); color: #fff; border: 0.5px solid rgba(255,255,255,.2); font-size: 11px; font-weight: 700; cursor: pointer; font-family: 'Lato',sans-serif; letter-spacing: .04em; transition: background .18s; }
          .btn-ghost:hover { background: rgba(255,255,255,.18); }
          .btn-navy  { padding: 9px 20px; background: ${NAVY}; color: #fff; border: none; font-size: 11px; font-weight: 700; cursor: pointer; font-family: 'Lato',sans-serif; letter-spacing: .04em; transition: background .18s; display: inline-flex; align-items: center; gap: 5px; }
          .btn-navy:hover  { background: #1a3a6e; }

          /* ── Empty ── */
          .eb { background: #fff; border: 0.5px solid #e5ddd0; padding: 44px 20px; text-align: center; }
          .et { font-size: 12px; color: #aaa; font-family: 'Lato',sans-serif; margin: 0; }

          /* ══════════════════════════════════════════
             MOBILE BOTTOM NAV
             Explicitly: display:flex on mobile,
             display:none on ≥1024px
          ══════════════════════════════════════════ */
          .mnav {
            /* Show on mobile */
            display: flex !important;
            position: fixed;
            bottom: 0; left: 0; right: 0;
            height: 60px;
            background: ${NAVY};
            border-top: 1px solid rgba(184,150,62,.3);
            box-shadow: 0 -6px 30px rgba(13,34,68,.25);
            z-index: 99999;
            align-items: stretch;
            justify-content: space-around;
          }
          /* Hide on desktop */
          @media (min-width: 1024px) { .mnav { display: none !important; } }

          /* Each nav button */
          .mnb {
            flex: 1;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 3px;
            background: none;
            border: none;
            cursor: pointer;
            color: rgba(245,240,232,.38);
            transition: color .15s;
            padding: 0;
            font-family: 'Lato',sans-serif;
            -webkit-tap-highlight-color: transparent;
          }
          .mnb:active { opacity: .7; }
          .mnb.on { color: ${GOLD}; }
          .mnb span { font-size: 7px; font-weight: 700; letter-spacing: .07em; text-transform: uppercase; line-height: 1; white-space: nowrap; }

          /* FAB */
          .fab-wrap { display: flex; align-items: center; justify-content: center; flex-shrink: 0; padding: 0 4px; }
          .fab {
            width: 46px; height: 46px;
            background: ${GOLD};
            border: 3px solid ${NAVY};
            box-shadow: 0 0 0 2px ${GOLD};
            display: flex; align-items: center; justify-content: center;
            cursor: pointer; transition: background .18s;
            flex-shrink: 0;
          }
          .fab:active { background: ${GOLDD}; }

          /* ── Notification dropdown ── */
          @keyframes dropIn { from { opacity:0; transform:translateY(-6px); } to { opacity:1; transform:translateY(0); } }

          /* ── Animations ── */
          @keyframes spin { to { transform: rotate(360deg); } }
          @keyframes up   { from { opacity:0; transform:translateY(14px); } to { opacity:1; transform:translateY(0); } }
          .au  { animation: up .38s cubic-bezier(.4,0,.2,1) both; }
          @keyframes p2   { 0%,100%{opacity:1} 50%{opacity:.4} }
          .pd  { animation: p2 2s infinite; }

        @keyframes slideUp { from { transform: translateY(100%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        @keyframes slideInRight { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        `}</style>

            {/* ══ LECTURER DETAIL MODAL ══ */}
            {/* ══ ALL LECTURERS SLIDE-OUT PANEL ══ */}
            {showAllLecturers && (
                <div onClick={() => setShowAllLecturers(false)}
                    style={{ position: 'fixed', inset: 0, zIndex: 999998, background: 'rgba(13,34,68,.5)', backdropFilter: 'blur(3px)' }}>
                    <div onClick={e => e.stopPropagation()}
                        style={{
                            position: 'absolute', top: 0, right: 0, bottom: 0,
                            width: 'min(420px, 100vw)',
                            background: BG, overflowY: 'auto',
                            boxShadow: '-20px 0 60px rgba(13,34,68,.2)',
                            animation: 'slideInRight .28s cubic-bezier(.4,0,.2,1) both',
                            display: 'flex', flexDirection: 'column',
                        }}>

                        {/* Panel header */}
                        <div style={{ background: NAVY, padding: '20px 20px 16px', position: 'sticky', top: 0, zIndex: 2 }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                                <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: '.2em', textTransform: 'uppercase', color: GOLD, fontFamily: "'Lato',sans-serif", margin: 0 }}>Faculty Directory</p>
                                <button onClick={() => setShowAllLecturers(false)}
                                    style={{ background: 'rgba(255,255,255,.1)', border: 'none', borderRadius: '50%', width: 28, height: 28, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                                    <X size={14} />
                                </button>
                            </div>
                            <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: 20, fontWeight: 700, color: '#fff', margin: 0 }}>
                                All Lecturers · <span style={{ color: GOLD }}>{lecturers.length}</span>
                            </h2>
                        </div>

                        {/* Lecturer list */}
                        <div style={{ flex: 1, padding: '12px 16px 32px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {lecturers.map((lec, idx) => (
                                <div key={lec.sellerId}
                                    onClick={() => { setSelectedLecturer(lec); setShowAllLecturers(false); }}
                                    style={{ background: '#fff', border: '0.5px solid #e5ddd0', padding: '13px 14px', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', transition: 'all .18s' }}
                                    onMouseEnter={e => { e.currentTarget.style.borderColor = GOLD; e.currentTarget.style.background = CREAM; }}
                                    onMouseLeave={e => { e.currentTarget.style.borderColor = '#e5ddd0'; e.currentTarget.style.background = '#fff'; }}>
                                    <div style={{ fontSize: 11, fontWeight: 700, color: '#ccc', fontFamily: "'Playfair Display',serif", width: 20, flexShrink: 0, textAlign: 'center' }}>{idx + 1}</div>
                                    {lec.photo ? (
                                        <img src={lec.photo} alt={lec.sellerName}
                                            style={{ width: 42, height: 42, borderRadius: '50%', objectFit: 'cover', objectPosition: 'top', border: `1.5px solid ${GOLD}`, flexShrink: 0 }}
                                            onError={e => e.target.style.display = 'none'} />
                                    ) : (
                                        <div style={{ width: 42, height: 42, borderRadius: '50%', background: getPalette(lec.sellerName).bg, border: `1.5px solid rgba(184,150,62,.4)`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                            <span style={{ color: getPalette(lec.sellerName).text, fontSize: 14, fontWeight: 700, fontFamily: "'Playfair Display',serif" }}>{getInitials(lec.sellerName)}</span>
                                        </div>
                                    )}
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <p style={{ fontSize: 12, fontWeight: 700, color: NAVY, margin: '0 0 2px', fontFamily: "'Playfair Display',serif", overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {lec.title ? `${lec.title} ${lec.sellerName}` : lec.sellerName}
                                        </p>
                                        {lec.department && (
                                            <p style={{ fontSize: 10, color: '#888', margin: '0 0 2px', fontFamily: "'Lato',sans-serif", overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 3 }}>
                                                <BookMarked size={8} style={{ color: GOLD, flexShrink: 0 }} />{lec.department}
                                            </p>
                                        )}
                                        <p style={{ fontSize: 10, color: GOLD, margin: 0, fontFamily: "'Lato',sans-serif", fontWeight: 700 }}>
                                            {lec.uploadedBooks} material{lec.uploadedBooks !== 1 ? 's' : ''}
                                        </p>
                                    </div>
                                    <ChevronRight size={12} style={{ color: '#ccc', flexShrink: 0 }} />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* ══ LECTURER DETAIL MODAL ══ */}
            {selectedLecturer && (() => {
                const lec = selectedLecturer;
                const myBooks = lecturerBooks.filter(b =>
                    b.sellerId === lec.sellerId || b.lecturerName === lec.sellerName
                );
                return (
                    <div onClick={() => setSelectedLecturer(null)}
                        style={{ position: 'fixed', inset: 0, zIndex: 999999, background: 'rgba(13,34,68,.55)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
                        <div onClick={e => e.stopPropagation()}
                            style={{ background: '#fff', width: '100%', maxWidth: 560, maxHeight: '88vh', overflowY: 'auto', borderRadius: '16px 16px 0 0', animation: 'slideUp .28s cubic-bezier(.4,0,.2,1) both' }}>

                            {/* Header */}
                            <div style={{ background: NAVY, padding: '20px 20px 18px', position: 'sticky', top: 0, zIndex: 2, display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                                {lec.photo ? (
                                    <img src={lec.photo} alt={lec.sellerName}
                                        style={{ width: 60, height: 60, borderRadius: '50%', objectFit: 'cover', objectPosition: 'top', border: `2px solid ${GOLD}`, flexShrink: 0 }}
                                        onError={e => e.target.style.display = 'none'} />
                                ) : (
                                    <div style={{ width: 60, height: 60, borderRadius: '50%', background: getPalette(lec.sellerName).bg, border: `2px solid ${GOLD}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                        <span style={{ color: getPalette(lec.sellerName).text, fontSize: 22, fontWeight: 700, fontFamily: "'Playfair Display',serif" }}>{getInitials(lec.sellerName)}</span>
                                    </div>
                                )}
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: '.14em', textTransform: 'uppercase', color: GOLD, fontFamily: "'Lato',sans-serif", margin: '0 0 4px' }}>{lec.title || 'Faculty'}</p>
                                    <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: 18, fontWeight: 700, color: '#fff', margin: '0 0 6px', lineHeight: 1.2 }}>
                                        {lec.title ? `${lec.title} ${lec.sellerName}` : lec.sellerName}
                                    </h2>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                                        {lec.department && <span style={{ fontSize: 10, color: 'rgba(245,240,232,.65)', fontFamily: "'Lato',sans-serif", display: 'flex', alignItems: 'center', gap: 4 }}><BookMarked size={9} style={{ color: GOLD }} />{lec.department}</span>}
                                        {lec.university && <span style={{ fontSize: 10, color: 'rgba(245,240,232,.45)', fontFamily: "'Lato',sans-serif", display: 'flex', alignItems: 'center', gap: 4 }}><GraduationCap size={9} style={{ color: GOLD }} />{lec.university}</span>}
                                    </div>
                                    <p style={{ fontSize: 10, color: GOLD, margin: '8px 0 0', fontFamily: "'Lato',sans-serif", fontWeight: 700 }}>{lec.uploadedBooks} material{lec.uploadedBooks !== 1 ? 's' : ''} uploaded</p>
                                </div>
                                <button onClick={() => setSelectedLecturer(null)}
                                    style={{ background: 'rgba(255,255,255,.1)', border: 'none', borderRadius: '50%', width: 30, height: 30, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', flexShrink: 0 }}>
                                    <X size={15} />
                                </button>
                            </div>

                            {/* Body */}
                            <div style={{ padding: '18px 18px 32px' }}>
                                <Link href={`/seller-profile?sellerId=${lec.sellerId}`} onClick={() => setSelectedLecturer(null)} style={{ textDecoration: 'none' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: CREAM, border: `0.5px solid rgba(184,150,62,.3)`, marginBottom: 20, cursor: 'pointer' }}>
                                        <span style={{ fontSize: 11, fontWeight: 700, color: NAVY, fontFamily: "'Lato',sans-serif" }}>View Full Profile</span>
                                        <ChevronRight size={13} style={{ color: GOLD }} />
                                    </div>
                                </Link>
                                {myBooks.length > 0 ? (
                                    <>
                                        <p style={{ fontSize: 8, fontWeight: 700, letterSpacing: '.14em', textTransform: 'uppercase', color: '#bbb', fontFamily: "'Lato',sans-serif", margin: '0 0 12px' }}>Materials by this lecturer</p>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 12 }}>
                                            {myBooks.map((book, bi) => (
                                                <div key={book.firestoreId || bi} onClick={() => setSelectedLecturer(null)}>
                                                    <BookCard book={book} badge="Lecturer" />
                                                </div>
                                            ))}
                                        </div>
                                    </>
                                ) : (
                                    <div style={{ textAlign: 'center', padding: '32px 20px' }}>
                                        <BookOpen size={32} style={{ color: '#e5ddd0', margin: '0 auto 10px' }} />
                                        <p style={{ fontSize: 13, fontWeight: 700, color: NAVY, fontFamily: "'Playfair Display',serif", margin: '0 0 4px' }}>No materials yet</p>
                                        <p style={{ fontSize: 11, color: '#bbb', fontFamily: "'Lato',sans-serif", margin: 0 }}>This lecturer hasn't uploaded any books yet.</p>
                                    </div>
                                )}
                            </div>
                         <FeaturedAdsCarousel
                                        tier="Bronze"
                                        maxAds={2}
                                        autoPlay={true}
                                        autoPlayMs={4000}
                                        style={{ marginTop: "1px" }}
                                      />
                        </div>
                    </div>
                );
            })()}

        <div className="lan-root">
            <Navbar />

            <div className="pw">

                {/* ══ SIDEBAR — desktop only ══ */}
                <aside className="sidebar">
                    <div style={{padding:'0 16px 16px',borderBottom:'0.5px solid #f0ebe0',marginBottom:6}}>
                        <div style={{display:'flex',alignItems:'center',gap:9}}>
                            <Avatar name={displayName} src={user?.photoBase64||user?.photoURL} size={34}/>
                            <div style={{minWidth:0}}>
                                <p style={{fontSize:11,fontWeight:700,color:NAVY,margin:0,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',fontFamily:"'Lato',sans-serif"}}>{displayName}</p>
                                <div style={{display:'inline-flex',alignItems:'center',gap:4,marginTop:2}}>
                                    <div className="pd" style={{width:5,height:5,borderRadius:'50%',background:'#16a34a'}}/>
                                        <span style={{ fontSize: 8, fontWeight: 700, color: GOLD, letterSpacing: '.1em', textTransform: 'uppercase', fontFamily: "'Lato',sans-serif" }}>Student</span>
                                        {(user?.department || user?.faculty) && (
                                            <p style={{ fontSize: 9, color: '#aaa', margin: '2px 0 0', fontFamily: "'Lato',sans-serif", overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.department || user.faculty}</p>
                                        )}
                                        {(user?.institution || user?.university) && (
                                            <p style={{ fontSize: 9, color: '#ccc', margin: '1px 0 0', fontFamily: "'Lato',sans-serif", overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.institution || user.university}</p>
                                        )}                              
                                          </div>
                            </div>
                        </div>
                    </div>

                    {/* Bell in sidebar */}
                        {/* Notifications in sidebar */}
                        <div style={{ padding: '8px 16px', borderBottom: '0.5px solid #f0ebe0', marginBottom: 6, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span style={{ fontSize: 11, color: '#888', fontWeight: 700, fontFamily: "'Lato',sans-serif" }}>Notifications</span>
                            {user?.uid && <NotificationBell userId={user.uid} />}
                        </div>

                    {[
                        {id:'home',    icon:LayoutDashboard, label:'Home'},
                        {id:'library', icon:LibraryBig,      label:'Library'},
                        {id:'ai',      icon:Sparkles,        label:'AI Tutor'},
                        {id:'wishlist',icon:Heart,           label:'Saved'},
                    ].map(({id,icon:Icon,label})=>(
                        <button key={id} onClick={()=>setActiveTab(id)} className={`sbi${activeTab===id?' act':''}`}>
                            <Icon size={14} style={{color:activeTab===id?GOLD:'#bbb',flexShrink:0}}/>{label}
                        </button>
                    ))}

                    <div style={{borderTop:'0.5px solid #f0ebe0',margin:'10px 0',padding:'6px 0'}}>
                        <Link href="/documents" style={{textDecoration:'none'}}><button className="sbi"><Search size={14} style={{color:'#bbb',flexShrink:0}}/>Browse All</button></Link>
                        <Link href="/my-account" style={{textDecoration:'none'}}><button className="sbi"><User size={14} style={{color:'#bbb',flexShrink:0}}/>Profile</button></Link>
                        {user?.isSeller
                            ? <Link href="/my-account/seller-account" style={{textDecoration:'none'}}><button className="sbi" style={{color:'#16a34a'}}><BarChart2 size={14} style={{color:'#16a34a',flexShrink:0}}/>Author Studio</button></Link>
                            : <Link href="/become-seller" style={{textDecoration:'none'}}><button className="sbi" style={{color:GOLD}}><Store size={14} style={{color:GOLD,flexShrink:0}}/>Become a Seller</button></Link>
                        }
                    </div>

                    <button onClick={()=>{auth.signOut();router.push('/auth/signin');}}
                        style={{marginTop:'auto',display:'flex',alignItems:'center',gap:9,padding:'10px 16px',background:'none',border:'none',cursor:'pointer',color:'#dc2626',fontSize:12,fontWeight:700,fontFamily:"'Lato',sans-serif"}}>
                        <LogOut size={14}/> Sign Out
                    </button>
                </aside>

                {/* ══ MAIN CONTENT ══ */}
                <main className="mc au">
                    {/* Mobile top bar with bell */}
                    <div className="mtb">
                        <div style={{display:'flex',alignItems:'center',gap:10}}>
                            <Avatar name={displayName} src={user?.photoBase64||user?.photoURL} size={28}/>
                            <div>
                                <p style={{fontSize:9,color:GOLD,fontWeight:700,fontFamily:"'Lato',sans-serif",margin:0,letterSpacing:'.08em',textTransform:'uppercase'}}>Student</p>
                                <p style={{fontSize:12,fontWeight:700,color:NAVY,margin:0,fontFamily:"'Lato',sans-serif"}}>{user?.firstName||displayName}</p>
                            </div>
                        </div>
                        <div style={{display:'flex',alignItems:'center',gap:6}}>
                                {user?.uid && <NotificationBell userId={user.uid} />}
                                <Link href="/my-account">
                                <div style={{width:30,height:30,borderRadius:'50%',background:CREAM,border:'0.5px solid #e5ddd0',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer'}}>
                                    <User size={14} style={{color:NAVY}}/>
                                </div>
                            </Link>
                        </div>
                    </div>

                    {activeTab==='home'     && renderHome()}
                    {activeTab==='library'  && renderLibrary()}
                    {activeTab==='ai'       && renderAI()}
                    {activeTab==='wishlist' && renderWishlist()}
                </main>
            </div>

            {/* ══════════════════════════════════════════
                MOBILE BOTTOM NAV
                Lives OUTSIDE .pw so no parent can clip it.
                .mnav = display:flex on mobile, none on ≥1024px
            ══════════════════════════════════════════ */}
            <nav className="mnav" role="navigation" aria-label="Bottom navigation">

                {/* Home */}
                <button className={`mnb${activeTab==='home'?' on':''}`} onClick={()=>setActiveTab('home')}>
                    <LayoutDashboard size={20}/>
                    <span>Home</span>
                </button>

                {/* Library */}
                <button className={`mnb${activeTab==='library'?' on':''}`} onClick={()=>setActiveTab('library')}>
                    <LibraryBig size={20}/>
                    <span>Library</span>
                </button>

                {/* FAB */}
                <div className="fab-wrap">
                    <Link href="/advertise" style={{textDecoration:'none',lineHeight:0}}>
                        <div className="fab">
                            <Plus size={22} style={{color:NAVY}} strokeWidth={2.5}/>
                        </div>
                    </Link>
                </div>

                {/* AI */}
                <button className={`mnb${activeTab==='ai'?' on':''}`} onClick={()=>setActiveTab('ai')}>
                    <Sparkles size={20}/>
                    <span>AI</span>
                </button>

                {/* Saved */}
                <button className={`mnb${activeTab==='wishlist'?' on':''}`} onClick={()=>setActiveTab('wishlist')}>
                    <Heart size={20}/>
                    <span>Saved</span>
                </button>
            </nav>
        </div>

        {approvalBounty && (
            <BountyApprovalModal
                bountyId={approvalBounty.id}
                bountyData={approvalBounty.data}
                currentUser={{ uid: user.uid, email: user.email, displayName: user.displayName || `${user.firstName} ${user.surname}` }}
                onClose={() => setApprovalBounty(null)}
                onUpdateStatus={(status) => {
                setPendingBounties(prev => prev.filter(b => b.id !== approvalBounty.id));
                setApprovalBounty(null);
                }}
            />
            )}
        </>
    );
}