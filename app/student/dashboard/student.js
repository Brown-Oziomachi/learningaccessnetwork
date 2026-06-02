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
import BountyDashboardCard from "./Bounty-dashboard-card/page";

/* ─── Design tokens (Student Network aesthetic) ─── */
const VOID = "#0b0b0f";
const DARK = "#11111a";
const DARK2 = "#18182a";
const DARK3 = "#1e1e30";
const PURPLE = "#7c3aed";
const PURPLEL = "#a855f7";
const PURPLED = "#5b21b6";
const LIME = "#a3e635";
const LIMEL = "#d9f99d";
const LIMED = "#65a30d";
const WHITE = "#f8f8ff";
const MUTED = "rgba(248,248,255,.4)";
const MUTED2 = "rgba(248,248,255,.12)";
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

/* ══════════════════════════════════════════
   AVATAR
══════════════════════════════════════════ */
function Avatar({ name, src, size = 36 }) {
    const pal = getPalette(name || '?');
    const ini = getInitials(name || '?');
    const [err, setErr] = useState(false);
    if (src && !err) return (
        <img src={src} alt={name} onError={() => setErr(true)}
            style={{
                width: size, height: size, borderRadius: '50%', objectFit: 'cover',
                border: `1.5px solid ${PURPLE}`, flexShrink: 0
            }} />
    );
    return (
        <div style={{
            width: size, height: size, borderRadius: '50%', background: pal.bg, flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: `1.5px solid ${BORDER}`
        }}>
            <span style={{
                color: pal.text, fontSize: size * 0.33, fontWeight: 700,
                fontFamily: "'Syne',sans-serif"
            }}>{ini}</span>
        </div>
    );
}

/* ══════════════════════════════════════════
   MESSAGE BELL
══════════════════════════════════════════ */
function MessageBell({ userId }) {
    const [msgs, setMsgs] = useState([]);
    const [unread, setUnread] = useState([]);
    const [open, setOpen] = useState(false);
    const dropRef = useRef(null);
    const btnRef = useRef(null);
    const [dropdownPos, setDropdownPos] = useState({ top: 0, right: 0 });

    useEffect(() => {
        const fn = (e) => {
            if (dropRef.current && !dropRef.current.contains(e.target) &&
                btnRef.current && !btnRef.current.contains(e.target)) setOpen(false);
        };
        document.addEventListener('mousedown', fn);
        return () => document.removeEventListener('mousedown', fn);
    }, []);

    useEffect(() => {
        if (open && btnRef.current) {
            const rect = btnRef.current.getBoundingClientRect();
            setDropdownPos({ top: rect.bottom + 10, right: window.innerWidth - rect.right });
        }
    }, [open]);

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
        }, (err) => console.warn('MessageBell listener:', err.code));
        return () => unsub();
    }, [userId]);

    const markRead = async (msg) => {
        try { await updateDoc(doc(db, 'dm_messages', msg.chatId, 'messages', msg.id), { read: true }); } catch { }
    };
    const markAll = () => unread.forEach(m => markRead(m));
    const count = unread.length;

    return (
        <div>
            <button ref={btnRef} onClick={() => setOpen(o => !o)}
                style={{
                    position: 'relative', background: 'none', border: 'none', cursor: 'pointer',
                    padding: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: open ? LIME : MUTED, transition: 'color .15s', borderRadius: 4
                }}>
                <Bell size={20} />
                {count > 0 && (
                    <span style={{
                        position: 'absolute', top: 0, right: 0, minWidth: 17, height: 17,
                        borderRadius: 999, background: '#ef4444', color: '#fff', fontSize: 8, fontWeight: 700,
                        fontFamily: "'Space Grotesk',sans-serif", display: 'flex', alignItems: 'center',
                        justifyContent: 'center', padding: '0 3px', border: `1.5px solid ${VOID}`, lineHeight: 1
                    }}>
                        {count > 9 ? '9+' : count}
                    </span>
                )}
            </button>

            {open && (
                <div ref={dropRef} style={{
                    position: 'fixed', top: dropdownPos.top, right: dropdownPos.right,
                    width: 310, maxWidth: 'calc(100vw - 24px)', background: DARK,
                    border: `1px solid ${BORDER}`, boxShadow: '0 16px 48px rgba(0,0,0,.6)',
                    zIndex: 999999, animation: 'dropIn .2s ease both'
                }}>
                    <div style={{
                        background: DARK2, padding: '11px 14px', display: 'flex',
                        alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${BORDER}`
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                            <MessageSquare size={13} style={{ color: LIME }} />
                            <span style={{
                                fontSize: 10, fontWeight: 700, color: WHITE,
                                fontFamily: "'Space Grotesk',sans-serif", letterSpacing: '.1em', textTransform: 'uppercase'
                            }}>Messages</span>
                            {count > 0 && (
                                <span style={{
                                    background: PURPLE, color: WHITE, fontSize: 8, fontWeight: 700,
                                    padding: '2px 7px', fontFamily: "'Space Grotesk',sans-serif"
                                }}>{count} NEW</span>
                            )}
                        </div>
                        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                            {count > 0 && (
                                <button onClick={markAll} style={{
                                    fontSize: 9, fontWeight: 700, color: LIME,
                                    background: 'none', border: 'none', cursor: 'pointer',
                                    fontFamily: "'Space Grotesk',sans-serif", letterSpacing: '.06em', textTransform: 'uppercase'
                                }}>
                                    Mark all read
                                </button>
                            )}
                            <button onClick={() => setOpen(false)} style={{
                                background: 'none', border: 'none',
                                cursor: 'pointer', color: MUTED, lineHeight: 1, padding: 0
                            }}>
                                <X size={14} />
                            </button>
                        </div>
                    </div>
                    <div style={{ maxHeight: 340, overflowY: 'auto' }}>
                        {msgs.length === 0 ? (
                            <div style={{ padding: '36px 16px', textAlign: 'center' }}>
                                <MessageSquare size={28} style={{ color: BORDER, margin: '0 auto 10px' }} />
                                <p style={{
                                    fontSize: 12, fontWeight: 700, color: WHITE,
                                    fontFamily: "'Syne',sans-serif", margin: '0 0 4px'
                                }}>No messages yet</p>
                                <p style={{ fontSize: 10, color: MUTED, fontFamily: "'Space Grotesk',sans-serif", margin: 0 }}>
                                    When a student messages you, it will appear here.
                                </p>
                            </div>
                        ) : msgs.map((msg) => {
                            const isNew = !msg.read;
                            return (
                                <div key={msg.id} onClick={() => { markRead(msg); setOpen(false); }}
                                    style={{
                                        padding: '10px 14px', borderBottom: `1px solid ${BORDER2}`,
                                        display: 'flex', gap: 10, alignItems: 'flex-start', cursor: 'pointer',
                                        background: isNew ? 'rgba(124,58,237,.12)' : 'transparent',
                                        borderLeft: `3px solid ${isNew ? PURPLE : 'transparent'}`,
                                        transition: 'background .15s'
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(124,58,237,.1)'}
                                    onMouseLeave={e => e.currentTarget.style.background = isNew ? 'rgba(124,58,237,.12)' : 'transparent'}>
                                    <div style={{
                                        width: 34, height: 34, borderRadius: '50%', background: DARK2,
                                        flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        border: `1.5px solid ${isNew ? PURPLE : BORDER2}`
                                    }}>
                                        <span style={{
                                            color: PURPLEL, fontSize: 11, fontWeight: 700,
                                            fontFamily: "'Syne',sans-serif"
                                        }}>
                                            {getInitials(msg.senderName || msg.title || '?')}
                                        </span>
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{
                                            display: 'flex', justifyContent: 'space-between',
                                            alignItems: 'flex-start', gap: 6, marginBottom: 3
                                        }}>
                                            <p style={{
                                                fontSize: 11, fontWeight: isNew ? 700 : 600, color: WHITE,
                                                margin: 0, fontFamily: "'Space Grotesk',sans-serif",
                                                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                                            }}>
                                                {msg.senderName || msg.title || 'A student'}
                                            </p>
                                            <span style={{
                                                fontSize: 8, color: MUTED, flexShrink: 0,
                                                fontFamily: "'Space Grotesk',sans-serif"
                                            }}>
                                                {fmtTime(msg.createdAt)}
                                            </span>
                                        </div>
                                        <p style={{
                                            fontSize: 10, color: isNew ? MUTED : 'rgba(248,248,255,.25)',
                                            margin: 0, fontFamily: "'Space Grotesk',sans-serif",
                                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                            fontWeight: isNew ? 600 : 400
                                        }}>
                                            {msg.body || msg.message || 'Sent you a message'}
                                        </p>
                                    </div>
                                    {isNew && <div style={{
                                        width: 7, height: 7, borderRadius: '50%',
                                        background: LIME, flexShrink: 0, marginTop: 5
                                    }} />}
                                </div>
                            );
                        })}
                    </div>
                    <Link href="/collaborate" onClick={() => setOpen(false)} style={{ textDecoration: 'none' }}>
                        <div style={{
                            padding: '10px 14px', borderTop: `1px solid ${BORDER2}`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                            background: 'rgba(124,58,237,.1)', cursor: 'pointer', transition: 'background .15s'
                        }}
                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(124,58,237,.2)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'rgba(124,58,237,.1)'}>
                            <MessageSquare size={11} style={{ color: LIME }} />
                            <span style={{
                                fontSize: 10, fontWeight: 700, color: LIME,
                                fontFamily: "'Space Grotesk',sans-serif", letterSpacing: '.06em', textTransform: 'uppercase'
                            }}>
                                Open Study Groups
                            </span>
                            <ArrowRight size={10} style={{ color: LIME }} />
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
        String(book.id || '').replace('firestore-', '').replace('nb-', '').replace('lb-', '');
    if (!navId) return null;
    return (
        <Link href={`/book/preview?id=${navId}`} style={{ textDecoration: 'none', display: 'block' }}>
            <div className="book-card">
                <div style={{ position: 'relative', background: DARK2, overflow: 'hidden' }}>
                    {thumb
                        ? <img src={thumb} alt={book.title || ''} style={{ width: '100%', aspectRatio: '3/4', objectFit: 'cover', display: 'block' }}
                            onError={e => { e.target.style.display = 'none'; if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex'; }} />
                        : null}
                    <div style={{
                        display: thumb ? 'none' : 'flex', width: '100%', aspectRatio: '3/4',
                        alignItems: 'center', justifyContent: 'center', background: DARK2,
                        flexDirection: 'column', gap: 6
                    }}>
                        <BookOpen size={24} style={{ color: MUTED }} />
                        <span style={{
                            fontSize: 9, color: MUTED, textAlign: 'center', padding: '0 8px',
                            fontFamily: "'Space Grotesk',sans-serif"
                        }}>{(book.title || '').slice(0, 28)}</span>
                    </div>
                    <div style={{
                        position: 'absolute', top: 6, left: 6, background: DARK, color: WHITE,
                        fontSize: 7, fontWeight: 700, padding: '2px 6px', letterSpacing: '.06em',
                        display: 'flex', alignItems: 'center', gap: 3, fontFamily: "'Space Grotesk',sans-serif"
                    }}>
                        <span style={{ width: 4, height: 4, borderRadius: '50%', background: '#22c55e', display: 'inline-block' }} />PDF
                    </div>
                    {badge && <div style={{
                        position: 'absolute', bottom: 6, left: 6, background: PURPLE,
                        color: WHITE, fontSize: 7, fontWeight: 700, padding: '2px 6px',
                        fontFamily: "'Space Grotesk',sans-serif", letterSpacing: '.06em'
                    }}>{badge}</div>}
                    {owned && <div style={{
                        position: 'absolute', top: 6, right: 6, background: '#16a34a',
                        color: '#fff', fontSize: 7, fontWeight: 700, padding: '2px 6px',
                        fontFamily: "'Space Grotesk',sans-serif"
                    }}>OWNED</div>}
                </div>
                <div style={{ padding: '9px 9px 11px', borderTop: `1px solid ${BORDER2}` }}>
                    <p style={{
                        fontFamily: "'Syne',sans-serif", fontSize: 11, fontWeight: 700, color: WHITE,
                        margin: '0 0 3px', display: '-webkit-box', WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: 1.3
                    }}>
                        {book.title || book.bookTitle || 'Untitled'}
                    </p>
                    <p style={{
                        fontSize: 9, color: MUTED, margin: '0 0 5px', overflow: 'hidden',
                        textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: "'Space Grotesk',sans-serif"
                    }}>
                        {book.lecturerTitle ? `${book.lecturerTitle} ` : ''}{book.author || book.sellerName || book.lecturerName || ''}
                    </p>
                    {book.price && !owned && (
                        <p style={{
                            fontSize: 10, fontWeight: 700, color: LIME, margin: 0,
                            fontFamily: "'Space Grotesk',sans-serif"
                        }}>
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
    const pal = getPalette(lecturer.sellerName || '?');
    const ini = getInitials(lecturer.sellerName || '?');
    const name = lecturer.sellerName || 'Lecturer';
    const title = lecturer.title?.toLowerCase().includes('lecturer') ? 'Lecturer' : lecturer.title;
    const href = `/seller-profile?sellerId=${lecturer.sellerId}`;
    return (
        <div className="lec-card">
            <div style={{ position: 'relative', overflow: 'hidden' }}>
                {lecturer.photo
                    ? <img src={lecturer.photo} alt={name} className="lec-img"
                        style={{ width: '100%', aspectRatio: '4/3', objectFit: 'cover', objectPosition: 'top', display: 'block' }} />
                    : <div style={{
                        width: '100%', aspectRatio: '4/3', background: pal.bg,
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                        <span style={{ color: pal.text, fontSize: 36, fontFamily: "'Syne',sans-serif", fontWeight: 900 }}>{ini}</span>
                    </div>
                }
                <div style={{
                    position: 'absolute', bottom: 0, left: 0, right: 0, height: 48,
                    background: 'linear-gradient(to top,rgba(11,11,15,.8),transparent)', pointerEvents: 'none'
                }} />
                {lecturer.title && (
                    <div style={{
                        position: 'absolute', bottom: 7, left: 7, background: PURPLE, color: WHITE,
                        fontSize: 8, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase',
                        padding: '2px 8px', fontFamily: "'Space Grotesk',sans-serif", display: 'flex', alignItems: 'center', gap: 3
                    }}>
                        <GraduationCap size={7} />{title}
                    </div>
                )}
            </div>
            <div style={{ padding: '11px 11px 13px' }}>
                <Link href={href} style={{ textDecoration: 'none' }}>
                    <h3 style={{
                        fontFamily: "'Syne',sans-serif", fontSize: 12, fontWeight: 700, color: WHITE,
                        margin: '0 0 4px', lineHeight: 1.3, display: '-webkit-box',
                        WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden'
                    }}>
                        {lecturer.title ? `${lecturer.title} ${name}` : name}
                    </h3>
                </Link>
                {lecturer.department && (
                    <p style={{
                        fontSize: 10, color: MUTED, margin: '0 0 2px', overflow: 'hidden',
                        textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: "'Space Grotesk',sans-serif",
                        display: 'flex', alignItems: 'center', gap: 3
                    }}>
                        <BookMarked size={7} style={{ color: LIME, flexShrink: 0 }} />{lecturer.department}
                    </p>
                )}
                {lecturer.university && (
                    <p style={{
                        fontSize: 9, color: 'rgba(248,248,255,.25)', margin: '0 0 9px', overflow: 'hidden',
                        textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: "'Space Grotesk',sans-serif",
                        display: 'flex', alignItems: 'center', gap: 3
                    }}>
                        <GraduationCap size={7} style={{ color: LIME, flexShrink: 0 }} />{lecturer.university}
                    </p>
                )}
                <div style={{
                    borderTop: `1px solid ${BORDER2}`, paddingTop: 8,
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                }}>
                    <span style={{
                        fontSize: 9, color: MUTED, display: 'flex', alignItems: 'center',
                        gap: 3, fontFamily: "'Space Grotesk',sans-serif"
                    }}>
                        <BookOpen size={8} style={{ color: PURPLEL }} />
                        <strong style={{ color: WHITE }}>{lecturer.uploadedBooks || 0}</strong> files
                    </span>
                    <Link href={href} style={{
                        fontSize: 8, fontWeight: 700, color: LIME, textDecoration: 'none',
                        display: 'flex', alignItems: 'center', gap: 2, letterSpacing: '.08em',
                        textTransform: 'uppercase', fontFamily: "'Space Grotesk',sans-serif"
                    }}>
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
    const rankColors = [LIME, PURPLEL, '#f59e0b'];
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '9px 0', borderBottom: `1px solid ${BORDER2}` }}>
            <div style={{
                width: 22, height: 22, borderRadius: '50%', background: 'rgba(124,58,237,.15)',
                flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: `1px solid ${rank < 3 ? rankColors[rank] + '44' : BORDER2}`
            }}>
                <span style={{
                    fontSize: 9, fontWeight: 700, color: rankColors[rank] || MUTED,
                    fontFamily: "'Space Grotesk',sans-serif"
                }}>{rank + 1}</span>
            </div>
            <Avatar name={student.name} src={student.photoURL} size={30} />
            <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{
                    fontSize: 11, fontWeight: 700, color: WHITE, margin: 0, overflow: 'hidden',
                    textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: "'Space Grotesk',sans-serif"
                }}>{student.name}</p>
                <p style={{
                    fontSize: 9, color: MUTED, margin: 0, fontFamily: "'Space Grotesk',sans-serif",
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                }}>{student.university || 'Student'}</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#22c55e' }} />
                <span style={{ fontSize: 9, color: '#22c55e', fontWeight: 700, fontFamily: "'Space Grotesk',sans-serif" }}>Active</span>
            </div>
        </div>
    );
}

/* ══════════════════════════════════════════
   INLINE AD CARD
══════════════════════════════════════════ */
function InlineAdCard({ ad }) {
    const handleClick = async () => {
        const id = ad.adId || ad.id;
        if (id) { try { await updateDoc(doc(db, "promotions", id), { clicks: increment(1) }); } catch { } }
        const link = ad.adLink || ad.link;
        if (link) window.open(link, '_blank');
    };
    const imgSrc = ad.image || ad.imageUrl || ad.coverImage || ad.thumbnail || null;
    const title = ad.title || ad.bookTitle || ad.name || 'Sponsored';
    const author = ad.author || ad.sponsor || ad.sellerName || 'Sponsored Content';

    return (
        <div onClick={handleClick} className="book-card" style={{ cursor: 'pointer' }}>
            <div style={{ position: 'relative', background: DARK2, overflow: 'hidden' }}>
                {imgSrc
                    ? <img src={imgSrc} alt={title} style={{ width: '100%', aspectRatio: '3/4', objectFit: 'cover', display: 'block' }}
                        onError={e => e.target.style.display = 'none'} />
                    : <div style={{
                        width: '100%', aspectRatio: '3/4', background: DARK2,
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                        <BookOpen size={24} style={{ color: MUTED }} />
                    </div>
                }
                <div style={{
                    position: 'absolute', top: 0, left: 0, right: 0, background: 'rgba(11,11,15,.8)',
                    padding: '4px 7px', display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                }}>
                    <span style={{
                        fontSize: 7, fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase',
                        color: LIME, fontFamily: "'Space Grotesk',sans-serif"
                    }}>
                        Featured · {ad.tier || 'Gold'}
                    </span>
                    <span style={{
                        fontSize: 7, fontWeight: 700, background: PURPLE, color: WHITE,
                        padding: '1px 5px', fontFamily: "'Space Grotesk',sans-serif"
                    }}>AD</span>
                </div>
                <div style={{
                    position: 'absolute', bottom: 6, left: 6, background: DARK, color: WHITE,
                    fontSize: 7, fontWeight: 700, padding: '2px 6px', letterSpacing: '.06em',
                    display: 'flex', alignItems: 'center', gap: 3, fontFamily: "'Space Grotesk',sans-serif"
                }}>
                    <span style={{ width: 4, height: 4, borderRadius: '50%', background: '#22c55e', display: 'inline-block' }} />PDF
                </div>
            </div>
            <div style={{ padding: '9px 9px 11px', borderTop: `1px solid ${BORDER2}` }}>
                <p style={{
                    fontFamily: "'Syne',sans-serif", fontSize: 11, fontWeight: 700, color: WHITE,
                    margin: '0 0 3px', display: '-webkit-box', WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: 1.3
                }}>{title}</p>
                <p style={{
                    fontSize: 9, color: MUTED, margin: 0, overflow: 'hidden',
                    textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: "'Space Grotesk',sans-serif"
                }}>{author}</p>
            </div>
        </div>
    );
}

/* ══════════════════════════════════════════
   MAIN DASHBOARD
══════════════════════════════════════════ */
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
    const [activeStudents, setActiveStudents] = useState([]);
    const [campusBooks, setCampusBooks] = useState([]);
    const [selectedLecturer, setSelectedLecturer] = useState(null);
    const [showAllLecturers, setShowAllLecturers] = useState(false);
    const [pendingBounties, setPendingBounties] = useState([]);
    const [approvalBounty, setApprovalBounty] = useState(null);
    const goldAds = useAds("Gold", 3);
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
                try { const sd = await getDoc(doc(db, 'sellers', uid)); if (sd.exists()) setSellerStats(sd.data()); } catch { }
            }

            try {
                const sq = query(collection(db, 'ai_chat_sessions'), where('userId', '==', uid));
                const ss = await getDocs(sq);
                setAiSessions(ss.docs.map(d => ({ id: d.id, ...d.data() }))
                    .sort((a, b) => (b.updatedAt?.toDate?.()?.getTime() || 0) - (a.updatedAt?.toDate?.()?.getTime() || 0))
                    .slice(0, 6));
            } catch { }

            try {
                const sq = query(collection(db, 'users'), where('isStudent', '==', true), limit(40));
                const ss = await getDocs(sq);
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

            const TITLES = ['Lecturer', 'Dr.', 'Prof.', 'Professor', 'Engr.', 'Pharm.', 'Barr.'];
            const seenIds = new Set(); const rawLecs = [];
            for (const title of TITLES) {
                try {
                    const snap = await getDocs(query(collection(db, 'sellers'), where('title', '==', title)));
                    for (const d of snap.docs) {
                        if (seenIds.has(d.id)) continue;
                        seenIds.add(d.id);
                        const data = d.data();
                        let photo = null;
                        try {
                            const ud2 = await getDoc(doc(db, 'users', d.id));
                            if (ud2.exists()) { const u2 = ud2.data(); photo = u2.photoBase64 || u2.photoURL || u2.profilePicture || null; }
                        } catch { }
                        rawLecs.push({
                            sellerId: d.id, sellerName: data.sellerName || 'Lecturer',
                            title: data.title || '', department: data.department || data.faculty || '',
                            university: data.university || data.institution || '', uploadedBooks: 0, photo
                        });
                    }
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
                const idArr = [...seenIds]; let lecBooks = [];
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
                                lecturerTitle: lec?.title || ''
                            });
                        });
                    } catch { }
                }
                const seen2 = new Set();
                setLecturerBooks(lecBooks.filter(b => { if (seen2.has(b.firestoreId)) return false; seen2.add(b.firestoreId); return true; })
                    .sort((a, b) => (b.createdAt?.toDate?.()?.getTime() || 0) - (a.createdAt?.toDate?.()?.getTime() || 0)).slice(0, 10));
            }

            try {
                const bq = query(collection(db, 'bounties'), where('postedById', '==', uid), where('status', '==', 'pending_approval'));
                const bs = await getDocs(bq);
                setPendingBounties(bs.docs.map(d => ({ id: d.id, ...d.data() })));
            } catch { }

            try {
                const lecIds = new Set(seenIds);
                const bs = await getDocs(query(collection(db, 'advertMyBook'), where('status', '==', 'approved')));
                const seen3 = new Set();
                setLatestBooks(bs.docs.filter(d => !lecIds.has(d.data().sellerId))
                    .map(d => ({ ...d.data(), id: `nb-${d.id}`, firestoreId: d.id, title: d.data().bookTitle || d.data().title || '' }))
                    .filter(b => { if (seen3.has(b.firestoreId)) return false; seen3.add(b.firestoreId); return true; })
                    .sort((a, b) => (b.createdAt?.toDate?.()?.getTime() || 0) - (a.createdAt?.toDate?.()?.getTime() || 0)).slice(0, 10));
            } catch { }

            try {
                const bq = query(collection(db, 'advertMyBook'), where('status', '==', 'approved'), orderBy('createdAt', 'desc'), limit(8));
                const bs = await getDocs(bq);
                setCampusBooks(bs.docs.map(d => ({ ...d.data(), firestoreId: d.id, title: d.data().bookTitle || d.data().title || '' })));
            } catch { }

        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    if (loading) return (
        <div style={{ minHeight: '100vh', background: VOID, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
            <div style={{ textAlign: 'center' }}>
                <div style={{
                    width: 52, height: 52, border: `3px solid ${PURPLE}`, borderTopColor: LIME,
                    borderRadius: '50%', animation: 'spin .8s linear infinite', margin: '0 auto 14px'
                }} />
                <p style={{ fontFamily: "'Syne',sans-serif", fontSize: 16, color: WHITE }}>Loading dashboard…</p>
            </div>
        </div>
    );

    const displayName = user?.displayName || `${user?.firstName || ''} ${user?.surname || ''}`.trim() || 'Scholar';

    const SH = ({ label, title, action }) => (
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 16, gap: 8, flexWrap: 'wrap' }}>
            <div style={{ minWidth: 0 }}>
                <p className="sl">{label}</p>
                <h3 className="st">{title}</h3>
            </div>
            {action && <div style={{ flexShrink: 0 }}>{action}</div>}
        </div>
    );

    /* ── HOME ── */
    const renderHome = () => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>

            {/* Hero */}
            <div className="hero">
                <div style={{
                    position: 'absolute', top: -40, right: -40, width: 200, height: 200,
                    borderRadius: '50%', background: 'radial-gradient(circle, rgba(124,58,237,.2) 0%, transparent 70%)', pointerEvents: 'none'
                }} />
                <div style={{
                    position: 'absolute', bottom: -30, left: -20, width: 150, height: 150,
                    borderRadius: '50%', background: 'radial-gradient(circle, rgba(163,230,53,.1) 0%, transparent 70%)', pointerEvents: 'none'
                }} />
                <div style={{ position: 'relative', width: '100%' }}>
                    <div style={{
                        display: 'inline-flex', alignItems: 'center', gap: 5,
                        background: 'rgba(124,58,237,.2)', border: `1px solid ${BORDER}`,
                        borderRadius: 999, padding: '4px 12px', marginBottom: 12
                    }}>
                        <span style={{
                            width: 6, height: 6, borderRadius: '50%', background: LIME,
                            display: 'inline-block', animation: 'pulse 1.5s ease-in-out infinite'
                        }} />
                        <span style={{
                            fontSize: 8, fontWeight: 700, letterSpacing: '.14em', textTransform: 'uppercase',
                            color: PURPLEL, fontFamily: "'Space Grotesk',sans-serif"
                        }}>{user?.university || 'LAN Library'}</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 14 }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <h2 style={{
                                fontFamily: "'Syne',sans-serif", fontSize: 'clamp(22px,6vw,38px)',
                                fontWeight: 800, color: WHITE, margin: '0 0 6px', lineHeight: 1.05, wordBreak: 'break-word',
                                letterSpacing: '-.02em'
                            }}>
                                Welcome back,<br />
                                <span style={{ color: LIME }}>{user?.firstName || 'Scholar'}<span style={{ color: PURPLEL }}> ✦</span></span>
                            </h2>
                            <p style={{ fontSize: 11, color: MUTED, fontFamily: "'Space Grotesk',sans-serif", margin: '0 0 4px' }}>
                                {library.length} {library.length === 1 ? 'book' : 'books'} · {aiSessions.length} AI sessions
                            </p>
                            {(user?.department || user?.faculty || user?.institution || user?.university) && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginTop: 4 }}>
                                    {(user?.department || user?.faculty) && (
                                        <span style={{
                                            fontSize: 10, color: 'rgba(163,230,53,.7)',
                                            fontFamily: "'Space Grotesk',sans-serif", display: 'flex', alignItems: 'center', gap: 3
                                        }}>
                                            <BookMarked size={8} style={{ color: LIME, flexShrink: 0 }} />
                                            {user.department || user.faculty}
                                        </span>
                                    )}
                                    {(user?.institution || user?.university) && (
                                        <span style={{
                                            fontSize: 10, color: MUTED,
                                            fontFamily: "'Space Grotesk',sans-serif", display: 'flex', alignItems: 'center', gap: 3
                                        }}>
                                            <GraduationCap size={8} style={{ color: LIME, flexShrink: 0 }} />
                                            {user.institution || user.university}
                                        </span>
                                    )}
                                </div>
                            )}
                        </div>

                        <div style={{
                            display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6,
                            flexShrink: 0, width: 'clamp(130px,36vw,180px)'
                        }}>
                            {[
                                { icon: BookOpen, label: 'Books', val: library.length, accent: LIME },
                                { icon: Sparkles, label: 'AI Chats', val: aiSessions.length, accent: PURPLEL },
                                { icon: Heart, label: 'Saved', val: wishlist.length, accent: '#f87171' },
                                { icon: Users, label: 'Online', val: activeStudents.length, accent: '#34d399' },
                            ].map(({ icon: Icon, label, val, accent }) => (
                                <div key={label} style={{
                                    background: 'rgba(255,255,255,.05)',
                                    border: `1px solid rgba(255,255,255,.08)`, padding: '8px 6px', textAlign: 'center'
                                }}>
                                    <Icon size={12} style={{ color: accent, margin: '0 auto 3px' }} />
                                    <p style={{
                                        fontFamily: "'Syne',sans-serif",
                                        fontSize: 'clamp(14px,4vw,20px)', fontWeight: 800, color: WHITE, margin: 0, lineHeight: 1
                                    }}>{val}</p>
                                    <p style={{
                                        fontSize: 7, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase',
                                        color: MUTED, fontFamily: "'Space Grotesk',sans-serif", margin: '2px 0 0'
                                    }}>{label}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    <Link href="/ai-chat" style={{ display: 'block' }}>
                        <button className="btn-lime" style={{ width: '100%', justifyContent: 'center', padding: '11px 18px' }}>
                            <Sparkles size={12} /> Chat with AI Tutor
                        </button>
                    </Link>
                </div>
                {/* Network Discovery Banner */}
                <section>
                    <div
                        style={{
                            background: DARK2,
                            border: `1px solid ${BORDER}`,
                            borderLeft: `3px solid ${LIME}`,
                            padding: '20px 20px 22px',
                            position: 'relative',
                            overflow: 'hidden',
                            cursor: 'pointer',
                            transition: 'border-color .18s, background .18s',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = DARK3; e.currentTarget.style.borderColor = PURPLE; }}
                        onMouseLeave={e => { e.currentTarget.style.background = DARK2; e.currentTarget.style.borderColor = BORDER; }}
                    >
                        {/* decorative blobs */}
                        <div style={{
                            position: 'absolute', top: -30, right: -30, width: 120, height: 120,
                            borderRadius: '50%', background: 'radial-gradient(circle, rgba(163,230,53,.08) 0%, transparent 70%)', pointerEvents: 'none'
                        }} />
                        <div style={{
                            position: 'absolute', bottom: -20, left: 60, width: 80, height: 80,
                            borderRadius: '50%', background: 'radial-gradient(circle, rgba(124,58,237,.1) 0%, transparent 70%)', pointerEvents: 'none'
                        }} />

                        <div style={{ position: 'relative', zIndex: 2 }}>
                            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{
                                        display: 'inline-flex', alignItems: 'center', gap: 6,
                                        background: 'rgba(163,230,53,.1)', border: '1px solid rgba(163,230,53,.25)',
                                        padding: '3px 10px', marginBottom: 10
                                    }}>
                                        <span style={{ width: 5, height: 5, borderRadius: '50%', background: LIME, display: 'inline-block', animation: 'pulse 1.5s ease-in-out infinite' }} />
                                        <span style={{ fontSize: 8, fontWeight: 700, letterSpacing: '.16em', textTransform: 'uppercase', color: LIME, fontFamily: "'Space Grotesk',sans-serif" }}>
                                            Student Network
                                        </span>
                                    </div>
                                    <h3 style={{
                                        fontFamily: "'Syne',sans-serif", fontSize: 'clamp(17px,4vw,22px)',
                                        fontWeight: 800, color: WHITE, margin: '0 0 6px', letterSpacing: '-.02em', lineHeight: 1.1
                                    }}>
                                        Understand Your<br /><span style={{ color: LIME }}>Network.</span>
                                    </h3>
                                    <p style={{
                                        fontSize: 11, color: MUTED, fontFamily: "'Space Grotesk',sans-serif",
                                        margin: '0 0 16px', lineHeight: 1.7, maxWidth: 380
                                    }}>
                                        See who's studying what, discover study groups, connect with peers across
                                        {user?.university ? ` ${user.university}` : ' your university'} and beyond.
                                    </p>

                                    {/* Quick stats row */}
                                    <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 18 }}>
                                        {[
                                            { val: activeStudents.length || '40k+', label: 'Students Online', accent: LIME },
                                            { val: lecturers.length || '200+', label: 'Lecturers', accent: PURPLEL },
                                            { val: '200+', label: 'Universities', accent: '#34d399' },
                                        ].map(({ val, label, accent }) => (
                                            <div key={label} style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                                <span style={{ fontFamily: "'Syne',sans-serif", fontSize: 18, fontWeight: 800, color: accent, lineHeight: 1 }}>{val}</span>
                                                <span style={{ fontSize: 8, fontWeight: 700, color: MUTED, letterSpacing: '.1em', textTransform: 'uppercase', fontFamily: "'Space Grotesk',sans-serif" }}>{label}</span>
                                            </div>
                                        ))}
                                    </div>

                                    <Link href="/students/network" style={{ textDecoration: 'none' }}>
                                        <button className="btn-lime" style={{ gap: 7 }}>
                                            <Users size={13} /> Explore the Network <ArrowRight size={12} />
                                        </button>
                                    </Link>
                                </div>

                                {/* Right: mini student previews */}
                                {activeStudents.length > 0 && (
                                    <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 6, minWidth: 160, maxWidth: 190 }} className="lan-network-preview">
                                        <p style={{
                                            fontSize: 8, fontWeight: 700, letterSpacing: '.14em', textTransform: 'uppercase', color: MUTED, fontFamily: "'Space Grotesk',sans-serif", margin: 0, marginBottom: 4
                                        }}>
                                            Active now
                                        </p>
                                        {activeStudents.slice(0, 4).map((s, i) => (
                                            <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 8, opacity: 1 - i * 0.15 }}>
                                                <div style={{ position: 'relative', flexShrink: 0 }}>
                                                    <Avatar name={s.name} src={s.photoURL} size={26} />
                                                    <div style={{ position: 'absolute', bottom: 0, right: 0, width: 7, height: 7, borderRadius: '50%', background: '#22c55e', border: `1.5px solid ${DARK2}` }} />
                                                </div>
                                                <div style={{ minWidth: 0 }}>
                                                    <p style={{ fontSize: 10, fontWeight: 700, color: WHITE, margin: 0, fontFamily: "'Space Grotesk',sans-serif", overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.name.split(' ')[0]}</p>
                                                    <p style={{ fontSize: 8, color: MUTED, margin: 0, fontFamily: "'Space Grotesk',sans-serif", overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.university || 'Student'}</p>
                                                </div>
                                            </div>
                                        ))}
                                        {activeStudents.length > 4 && (
                                            <p style={{ fontSize: 9, color: LIME, fontWeight: 700, fontFamily: "'Space Grotesk',sans-serif", margin: '2px 0 0' }}>
                                                +{activeStudents.length - 4} more online
                                            </p>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </section>
            </div>

            {library.length > 0 && (
                <section>
                    <SH label="My Library" title="Jump Back In"
                        action={<button onClick={() => setActiveTab('library')} className="slink">Full Library <ChevronRight size={11} /></button>} />
                    <div className="bg">
                        {[...library.slice(0, 5)].reduce((acc, b, i) => {
                            acc.push(<BookCard key={b.bookId || i} book={b} owned />);
                            if (i === 1 && goldAds[0]) acc.push(<InlineAdCard key="ad-lib-0" ad={goldAds[0]} />);
                            if (i === 3 && silverAds[0]) acc.push(<InlineAdCard key="ad-lib-1" ad={silverAds[0]} />);
                            return acc;
                        }, [])}
                    </div>
                    <div style={{ marginTop: '20px' }}>
                        <FeaturedAdsCarousel tier="Silver" maxAds={2} autoPlay={true} autoPlayMs={5000} />
                    </div>
                </section>
            )}

            {/* Faculty Directory */}
            {lecturers.length > 0 && (() => {
                const featured = lecturers[0];
                const featuredBooks = lecturerBooks.filter(b =>
                    b.sellerId === featured.sellerId || b.lecturerName === featured.sellerName
                );
                return (
                    <section>
                        <SH label="Faculty Directory" title={`Our Lecturers · ${lecturers.length} on LAN`}
                            action={<button onClick={() => setShowAllLecturers(true)} className="slink">View All <ChevronRight size={11} /></button>} />
                        <div style={{ background: DARK, border: `1px solid ${BORDER}`, overflow: 'hidden' }}>
                            <div onClick={() => setSelectedLecturer(featured)}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: 14, padding: '16px 18px',
                                    borderBottom: featuredBooks.length > 0 ? `1px solid ${BORDER2}` : 'none',
                                    cursor: 'pointer', transition: 'background .15s'
                                }}
                                onMouseEnter={e => e.currentTarget.style.background = DARK2}
                                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                {featured.photo ? (
                                    <img src={featured.photo} alt={featured.sellerName}
                                        style={{
                                            width: 52, height: 52, borderRadius: '50%', objectFit: 'cover',
                                            objectPosition: 'top', border: `2px solid ${PURPLE}`, flexShrink: 0
                                        }}
                                        onError={e => e.target.style.display = 'none'} />
                                ) : (
                                    <div style={{
                                        width: 52, height: 52, borderRadius: '50%',
                                        background: getPalette(featured.sellerName).bg,
                                        border: `2px solid ${PURPLE}`, display: 'flex', alignItems: 'center',
                                        justifyContent: 'center', flexShrink: 0
                                    }}>
                                        <span style={{
                                            color: getPalette(featured.sellerName).text, fontSize: 18,
                                            fontWeight: 700, fontFamily: "'Syne',sans-serif"
                                        }}>{getInitials(featured.sellerName)}</span>
                                    </div>
                                )}
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                                        <p style={{
                                            fontSize: 14, fontWeight: 700, color: WHITE, margin: 0,
                                            fontFamily: "'Syne',sans-serif", overflow: 'hidden',
                                            textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                                        }}>
                                            {featured.title ? `${featured.title} ${featured.sellerName}` : featured.sellerName}
                                        </p>
                                        {featured.title && (
                                            <span style={{
                                                fontSize: 7, fontWeight: 700, letterSpacing: '.12em',
                                                textTransform: 'uppercase', color: PURPLEL,
                                                background: 'rgba(124,58,237,.2)', border: `1px solid ${BORDER}`,
                                                padding: '2px 8px', fontFamily: "'Space Grotesk',sans-serif", flexShrink: 0
                                            }}>
                                                {featured.title}
                                            </span>
                                        )}
                                    </div>
                                    {featured.department && (
                                        <p style={{
                                            fontSize: 11, color: MUTED, margin: '4px 0 0',
                                            fontFamily: "'Space Grotesk',sans-serif", display: 'flex', alignItems: 'center', gap: 4
                                        }}>
                                            <BookMarked size={9} style={{ color: LIME, flexShrink: 0 }} />
                                            {featured.department}
                                            {featured.university && <span style={{ color: 'rgba(248,248,255,.2)' }}>· {featured.university}</span>}
                                        </p>
                                    )}
                                    <p style={{
                                        fontSize: 10, color: LIME, margin: '4px 0 0',
                                        fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700
                                    }}>
                                        {featured.uploadedBooks} material{featured.uploadedBooks !== 1 ? 's' : ''} uploaded
                                    </p>
                                </div>
                                <ChevronRight size={13} style={{ color: MUTED, flexShrink: 0 }} />
                            </div>

                            {featuredBooks.length > 0 && (
                                <div style={{ padding: '14px 18px 18px' }}>
                                    <p style={{
                                        fontSize: 8, fontWeight: 700, letterSpacing: '.14em', textTransform: 'uppercase',
                                        color: MUTED, fontFamily: "'Space Grotesk',sans-serif", margin: '0 0 12px'
                                    }}>
                                        Materials by this lecturer
                                    </p>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 10 }}>
                                        {featuredBooks.slice(0, 4).map((book, bi) => (
                                            <BookCard key={book.firestoreId || bi} book={book} badge="Lecturer" />
                                        ))}
                                        {featuredBooks.length > 4 && (
                                            <div onClick={() => setSelectedLecturer(featured)}
                                                style={{
                                                    background: DARK2, border: `1px dashed ${BORDER}`,
                                                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                                                    justifyContent: 'center', aspectRatio: '3/4', cursor: 'pointer', gap: 6
                                                }}
                                                onMouseEnter={e => { e.currentTarget.style.background = DARK3; e.currentTarget.style.borderColor = PURPLE; }}
                                                onMouseLeave={e => { e.currentTarget.style.background = DARK2; e.currentTarget.style.borderColor = BORDER; }}>
                                                <span style={{ fontSize: 20, fontWeight: 800, color: WHITE, fontFamily: "'Syne',sans-serif" }}>+{featuredBooks.length - 4}</span>
                                                <span style={{ fontSize: 8, fontWeight: 700, color: LIME, fontFamily: "'Space Grotesk',sans-serif", letterSpacing: '.1em', textTransform: 'uppercase' }}>More</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                            {featuredBooks.length === 0 && (
                                <div style={{ padding: '12px 18px', display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <BookOpen size={13} style={{ color: MUTED }} />
                                    <p style={{ fontSize: 10, color: MUTED, margin: 0, fontFamily: "'Space Grotesk',sans-serif" }}>No materials uploaded yet</p>
                                </div>
                            )}
                        </div>

                        {lecturers.length > 1 && (
                            <button onClick={() => setShowAllLecturers(true)}
                                style={{
                                    marginTop: 12, width: '100%', padding: '11px', background: 'transparent',
                                    border: `1px dashed ${BORDER}`, color: WHITE, fontSize: 11, fontWeight: 700,
                                    cursor: 'pointer', fontFamily: "'Space Grotesk',sans-serif", letterSpacing: '.04em',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, transition: 'all .18s'
                                }}
                                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(124,58,237,.1)'; e.currentTarget.style.borderColor = PURPLE; e.currentTarget.style.color = LIME; }}
                                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = BORDER; e.currentTarget.style.color = WHITE; }}>
                                <Users size={13} /> View All {lecturers.length} Lecturers
                            </button>
                        )}
                    </section>
                );
            })()}

            <section>
                <SH label="Faculty Uploads" title="New from Lecturers"
                    action={<Link href="/documents?filter=lecturer" className="slink">Browse All <ChevronRight size={11} /></Link>} />
                {lecturerBooks.length === 0
                    ? <div className="eb"><BookMarked size={28} style={{ color: MUTED, margin: '0 auto 8px' }} /><p className="et">No lecturer books yet</p></div>
                    : <div className="bg">
                        {[...lecturerBooks.slice(0, 5)].reduce((acc, b, i) => {
                            acc.push(<BookCard key={b.firestoreId || i} book={b} badge="Lecturer" />);
                            if (i === 1 && silverAds[0]) acc.push(<InlineAdCard key="ad-lec-0" ad={silverAds[0]} />);
                            return acc;
                        }, [])}
                    </div>
                }
            </section>

            <section>
                <SH label="What's Happening" title="Campus Pulse"
                    action={<Link href="/documents" className="slink">All Docs <ChevronRight size={11} /></Link>} />
                <div style={{ background: DARK, border: `1px solid ${BORDER}`, overflow: 'hidden' }}>
                    {campusBooks.length === 0
                        ? <div className="eb" style={{ border: 'none' }}><Activity size={28} style={{ color: MUTED, margin: '0 auto 8px' }} /><p className="et">No activity yet</p></div>
                        : campusBooks.map((b, i) => {
                            const thumb = getThumbnailUrl(b);
                            return (
                                <Link key={b.firestoreId || i} href={`/book/preview?id=${b.firestoreId}`} style={{ textDecoration: 'none' }}>
                                    <div className="cr">
                                        <div style={{ width: 22, flexShrink: 0, textAlign: 'center' }}>
                                            <span style={{
                                                fontSize: 10, fontWeight: 700,
                                                color: i < 3 ? LIME : MUTED, fontFamily: "'Syne',sans-serif"
                                            }}>{i + 1}</span>
                                        </div>
                                        <div style={{ width: 36, height: 48, background: DARK2, flexShrink: 0, overflow: 'hidden' }}>
                                            {thumb
                                                ? <img src={thumb} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => e.target.style.display = 'none'} />
                                                : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><BookOpen size={12} style={{ color: MUTED }} /></div>
                                            }
                                        </div>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <p style={{
                                                fontSize: 11, fontWeight: 700, color: WHITE, margin: '0 0 2px',
                                                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                                fontFamily: "'Space Grotesk',sans-serif"
                                            }}>{b.title}</p>
                                            <p style={{
                                                fontSize: 9, color: MUTED, margin: '0 0 3px',
                                                fontFamily: "'Space Grotesk',sans-serif", overflow: 'hidden',
                                                textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                                            }}>{b.sellerName || b.author || ''}</p>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                <span style={{ fontSize: 10, fontWeight: 700, color: LIME, fontFamily: "'Space Grotesk',sans-serif" }}>
                                                    ₦{Number(b.price || 0).toLocaleString()}
                                                </span>
                                                {b.category && (
                                                    <span style={{
                                                        fontSize: 7, fontWeight: 700, background: 'rgba(124,58,237,.2)',
                                                        border: `1px solid ${BORDER}`, color: PURPLEL, padding: '1px 6px',
                                                        fontFamily: "'Space Grotesk',sans-serif", textTransform: 'uppercase', letterSpacing: '.06em'
                                                    }}>
                                                        {b.category}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <ChevronRight size={12} style={{ color: MUTED, flexShrink: 0 }} />
                                    </div>
                                </Link>
                            );
                        })
                    }
                </div>
            </section>

            <section>
                <SH label="Fresh Uploads" title="Just Added"
                    action={<Link href="/documents" className="slink">All Books <ChevronRight size={11} /></Link>} />
                {latestBooks.length === 0
                    ? <div className="eb"><Zap size={28} style={{ color: MUTED, margin: '0 auto 8px' }} /><p className="et">No books yet</p></div>
                    : <>
                        <div className="bg">
                            {[...latestBooks.slice(0, 5)].reduce((acc, b, i) => {
                                acc.push(<BookCard key={b.firestoreId || i} book={b} />);
                                if (i === 1 && goldAds[1]) acc.push(<InlineAdCard key="ad-new-0" ad={goldAds[1]} />);
                                if (i === 3 && bronzeAds[0]) acc.push(<InlineAdCard key="ad-new-1" ad={bronzeAds[0]} />);
                                return acc;
                            }, [])}
                        </div>
                        <div style={{ marginTop: '20px' }}>
                            <FeaturedAdsCarousel tier="Bronze" maxAds={2} autoPlay={true} autoPlayMs={4500} />
                        </div>
                    </>
                }
            </section>

            <section>
                <p className="sl">Resources</p><h3 className="st" style={{ marginBottom: 14 }}>Learning Tools</h3>
                <div className="tg">
                    {[
                        { icon: Sparkles, label: 'AI Book Chat', sub: 'Ask anything about your books', href: '/students/ai-tutor', accent: true },
                        { icon: FileText, label: 'My Library', sub: 'Summarise & save', href: '/students/my-library', accent: false },
                        { icon: BookCopy, label: 'Past Questions', sub: 'Exam prep resources', href: '/students/past-questions  ', accent: false },
                        { icon: Users, label: 'Study Groups', sub: 'Collaborate with peers', href: '/students/study-groups', accent: false },
                    ].map(({ icon: Icon, label, sub, href, accent }) => (
                        <Link key={label} href={href} style={{ textDecoration: 'none' }}>
                            <div className={`tc${accent ? ' tca' : ''}`}>
                                <Icon size={17} style={{ color: accent ? VOID : LIME, marginBottom: 7 }} />
                                <p style={{ fontSize: 11, fontWeight: 700, color: accent ? VOID : WHITE, margin: '0 0 3px', fontFamily: "'Space Grotesk',sans-serif" }}>{label}</p>
                                <p style={{ fontSize: 9, color: accent ? 'rgba(11,11,15,.6)' : MUTED, margin: 0, fontFamily: "'Space Grotesk',sans-serif" }}>{sub}</p>
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
                    <div style={{
                        position: 'absolute', top: -20, right: -20, width: 100, height: 100,
                        borderRadius: '50%', background: 'radial-gradient(circle, rgba(163,230,53,.1) 0%, transparent 70%)', pointerEvents: 'none'
                    }} />
                    {user?.isSeller ? (
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                            <div>
                                <p style={{
                                    fontSize: 9, fontWeight: 700, letterSpacing: '.18em', textTransform: 'uppercase',
                                    color: LIME, margin: '0 0 4px', fontFamily: "'Space Grotesk',sans-serif"
                                }}>Author Dashboard</p>
                                <p style={{ fontFamily: "'Syne',sans-serif", fontSize: 26, fontWeight: 800, color: WHITE, margin: '0 0 3px' }}>
                                    ₦{(sellerStats?.accountBalance || 0).toLocaleString()}
                                </p>
                                <p style={{ fontSize: 10, color: MUTED, fontFamily: "'Space Grotesk',sans-serif" }}>
                                    {sellerStats?.totalSales || sellerStats?.booksSold || 0} total sales
                                </p>
                            </div>
                            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                <Link href="/upload-document"><button className="btn-lime">Upload</button></Link>
                                <Link href="/my-account/seller-account"><button className="btn-ghost">Studio</button></Link>
                            </div>
                        </div>
                    ) : (
                        <>
                            <p style={{
                                fontSize: 9, fontWeight: 700, letterSpacing: '.18em', textTransform: 'uppercase',
                                color: LIME, margin: '0 0 10px', fontFamily: "'Space Grotesk',sans-serif"
                            }}>Earn on LAN</p>
                            <h3 style={{ fontFamily: "'Syne',sans-serif", fontSize: 20, fontWeight: 800, color: WHITE, margin: '0 0 7px', letterSpacing: '-.02em' }}>
                                Turn Notes<br />into Cash 💸
                            </h3>
                            <p style={{ fontSize: 11, color: MUTED, fontFamily: "'Space Grotesk',sans-serif", lineHeight: 1.65, margin: '0 0 16px', maxWidth: 300 }}>
                                Keep 80% of every sale. Join 500+ student authors.
                            </p>
                            <Link href="/become-seller"><button className="btn-lime">Start Selling Now →</button></Link>
                        </>
                    )}
                </div>
            </section>

            <section>
                <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 14 }}>
                    <div><p className="sl">Community</p><h3 className="st">Active Students</h3></div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', animation: 'pulse 1.5s ease-in-out infinite' }} />
                        <span style={{ fontSize: 9, fontWeight: 700, color: '#22c55e', fontFamily: "'Space Grotesk',sans-serif" }}>{activeStudents.length} online</span>
                    </div>
                </div>
                <div style={{ background: DARK, border: `1px solid ${BORDER}`, padding: '4px 14px 0' }}>
                    {activeStudents.length === 0
                        ? <div style={{ padding: '28px 0', textAlign: 'center' }}>
                            <Users size={26} style={{ color: MUTED, margin: '0 auto 6px' }} />
                            <p className="et">No active students right now</p>
                        </div>
                        : activeStudents.map((s, i) => <ActiveStudentRow key={s.id} student={s} rank={i} />)
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
            <div style={{ marginBottom: 22 }}>
                <p className="sl">Your Collection</p>
                <h2 style={{ fontFamily: "'Syne',sans-serif", fontSize: 24, fontWeight: 800, color: WHITE, margin: '3px 0 0', letterSpacing: '-.02em' }}>My Library</h2>
            </div>
            {library.length === 0
                ? <div className="eb" style={{ padding: '56px 24px' }}>
                    <BookOpen size={44} style={{ color: MUTED, margin: '0 auto 14px' }} />
                    <h3 style={{ fontFamily: "'Syne',sans-serif", fontSize: 20, color: WHITE, marginBottom: 6 }}>Library is Empty</h3>
                    <p className="et" style={{ marginBottom: 18 }}>Start building your collection</p>
                    <Link href="/documents"><button className="btn-purple">Browse Documents</button></Link>
                </div>
                : <>
                    <div className="bg">
                        {[...library.slice(0, 5)].reduce((acc, b, i) => {
                            acc.push(<BookCard key={b.bookId || i} book={b} owned />);
                            if (i === 1 && goldAds[0]) acc.push(<InlineAdCard key="ad-lib-0" ad={goldAds[0]} />);
                            return acc;
                        }, [])}
                    </div>
                    <div style={{ marginTop: 22, borderTop: `1px solid ${BORDER2}`, paddingTop: 22 }}>
                        <p className="sl" style={{ marginBottom: 10 }}>AI Tutor</p>
                        <h3 style={{ fontFamily: "'Syne',sans-serif", fontSize: 17, color: WHITE, margin: '0 0 12px', letterSpacing: '-.01em' }}>Chat About Your Books</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                            {library.slice(0, 4).map((b, i) => (
                                <Link key={i} href={`/ai-chat?bookId=${b.bookId || b.firestoreId || b.id}&bookTitle=${encodeURIComponent(b.title || '')}`} style={{ textDecoration: 'none' }}>
                                    <div className="ab">
                                        <div style={{ width: 32, height: 32, background: 'rgba(124,58,237,.2)', border: `1px solid ${BORDER}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                            <Sparkles size={13} style={{ color: PURPLEL }} />
                                        </div>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <p style={{ fontSize: 8, fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', color: MUTED, margin: '0 0 2px', fontFamily: "'Space Grotesk',sans-serif" }}>AI Tutor</p>
                                            <p style={{ fontSize: 11, fontWeight: 700, color: WHITE, margin: 0, fontFamily: "'Space Grotesk',sans-serif", overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Ask about "{b.title}"</p>
                                        </div>
                                        <ArrowRight size={12} style={{ color: LIME, flexShrink: 0 }} />
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>

                    {user?.uid && (
                        <div style={{ marginTop: 22, borderTop: `1px solid ${BORDER2}`, paddingTop: 22 }}>
                            <p className="sl" style={{ marginBottom: 6 }}>Bounty Board</p>
                            <h3 style={{ fontFamily: "'Syne',sans-serif", fontSize: 17, color: WHITE, margin: '0 0 12px', letterSpacing: '-.01em' }}>My Bounties</h3>
                            <BountyDashboardCard user={user} />
                        </div>
                    )}

                    {pendingBounties.length > 0 && (
                        <div style={{ marginTop: 24, borderTop: `1px solid ${BORDER2}`, paddingTop: 22 }}>
                            <p className="sl" style={{ marginBottom: 6 }}>Action Required</p>
                            <h3 style={{ fontFamily: "'Syne',sans-serif", fontSize: 17, color: WHITE, margin: '0 0 12px', letterSpacing: '-.01em' }}>Bounties Awaiting Your Review</h3>
                            {pendingBounties.map(b => (
                                <div key={b.id} style={{ background: DARK, border: `1px solid ${PURPLE}`, padding: '14px 16px', marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <p style={{ fontSize: 13, fontWeight: 700, color: WHITE, margin: '0 0 2px', fontFamily: "'Space Grotesk',sans-serif", overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{b.title}</p>
                                        <p style={{ fontSize: 10, color: MUTED, margin: 0, fontFamily: "'Space Grotesk',sans-serif" }}>
                                            Submitted by <strong style={{ color: WHITE }}>{b.claimedByName || 'Author'}</strong> · ₦{Number(b.reward).toLocaleString()} in escrow
                                        </p>
                                    </div>
                                    <button onClick={() => setApprovalBounty({ id: b.id, data: b })}
                                        style={{ padding: '9px 18px', background: PURPLE, color: WHITE, border: 'none', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: "'Space Grotesk',sans-serif", letterSpacing: '0.06em', flexShrink: 0 }}>
                                        Review →
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </>
            }
        </div>
    );

    /* ── AI ── */
    const renderAI = () => (
        <div>
            <div style={{ marginBottom: 22, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
                <div>
                    <p className="sl">Powered by Claude</p>
                    <h2 style={{ fontFamily: "'Syne',sans-serif", fontSize: 24, fontWeight: 800, color: WHITE, margin: '3px 0 0', letterSpacing: '-.02em' }}>AI Tutor</h2>
                </div>
                <Link href="/ai-chat"><button className="btn-purple" style={{ display: 'flex', alignItems: 'center', gap: 5 }}><Plus size={12} /> New Chat</button></Link>
            </div>
            <div className="sp" style={{ marginBottom: 22 }}>
                <div style={{ position: 'absolute', top: -20, right: -20, width: 100, height: 100, borderRadius: '50%', background: 'radial-gradient(circle, rgba(163,230,53,.08) 0%, transparent 70%)', pointerEvents: 'none' }} />
                <Sparkles size={20} style={{ color: LIME, marginBottom: 10 }} />
                <h3 style={{ fontFamily: "'Syne',sans-serif", fontSize: 20, fontWeight: 800, color: WHITE, margin: '0 0 6px', letterSpacing: '-.02em' }}>Ask anything about your books</h3>
                <p style={{ fontSize: 11, color: MUTED, fontFamily: "'Space Grotesk',sans-serif", margin: '0 0 16px' }}>Summaries, key concepts, exam tips, explanations.</p>
                <Link href="/ai-chat"><button className="btn-lime">Start AI Chat →</button></Link>
            </div>
            {aiSessions.length > 0 && (
                <div style={{ marginBottom: 22 }}>
                    <p className="sl" style={{ marginBottom: 10 }}>Recent</p>
                    <h3 style={{ fontFamily: "'Syne',sans-serif", fontSize: 17, color: WHITE, margin: '0 0 12px', letterSpacing: '-.01em' }}>Your Conversations</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {aiSessions.map(s => (
                            <Link key={s.id} href={`/ai-chat?sessionId=${s.id}&bookId=${s.bookId}&bookTitle=${encodeURIComponent(s.bookTitle || '')}`} style={{ textDecoration: 'none' }}>
                                <div className="ar">
                                    <div style={{ width: 34, height: 34, border: `1px solid ${BORDER}`, background: DARK2, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                        <MessageSquare size={13} style={{ color: PURPLEL }} />
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <p style={{ fontSize: 11, fontWeight: 700, color: WHITE, margin: '0 0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: "'Space Grotesk',sans-serif" }}>{s.title || 'New conversation'}</p>
                                        <p style={{ fontSize: 9, color: LIME, margin: 0, fontFamily: "'Space Grotesk',sans-serif", overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.bookTitle || ''}</p>
                                    </div>
                                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                        <p style={{ fontSize: 9, color: MUTED, margin: 0, fontFamily: "'Space Grotesk',sans-serif" }}>{s.messages?.length || 0} msgs</p>
                                        <p style={{ fontSize: 8, color: 'rgba(248,248,255,.2)', margin: '2px 0 0', fontFamily: "'Space Grotesk',sans-serif" }}>{fmtTime(s.updatedAt)}</p>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            )}
            {library.length > 0 && (
                <div>
                    <p className="sl" style={{ marginBottom: 10 }}>Quick Access</p>
                    <h3 style={{ fontFamily: "'Syne',sans-serif", fontSize: 17, color: WHITE, margin: '0 0 12px', letterSpacing: '-.01em' }}>Chat About Your Books</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                        {library.map((b, i) => (
                            <Link key={i} href={`/ai-chat?bookId=${b.bookId || b.firestoreId || b.id}&bookTitle=${encodeURIComponent(b.title || '')}`} style={{ textDecoration: 'none' }}>
                                <div className="ab">
                                    <div style={{ width: 32, height: 32, background: 'rgba(124,58,237,.2)', border: `1px solid ${BORDER}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                        <Sparkles size={13} style={{ color: PURPLEL }} />
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <p style={{ fontSize: 8, fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', color: MUTED, margin: '0 0 2px', fontFamily: "'Space Grotesk',sans-serif" }}>AI Tutor</p>
                                        <p style={{ fontSize: 11, fontWeight: 700, color: WHITE, margin: 0, fontFamily: "'Space Grotesk',sans-serif", overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Ask about "{b.title}"</p>
                                    </div>
                                    <ArrowRight size={12} style={{ color: LIME, flexShrink: 0 }} />
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
            <div style={{ marginBottom: 22, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
                <div>
                    <p className="sl">Your Wishlist</p>
                    <h2 style={{ fontFamily: "'Syne',sans-serif", fontSize: 24, fontWeight: 800, color: WHITE, margin: '3px 0 0', letterSpacing: '-.02em' }}>Saved Books</h2>
                </div>
                <span style={{ fontSize: 11, color: MUTED, fontFamily: "'Space Grotesk',sans-serif" }}>{wishlist.length} items</span>
            </div>
            {wishlist.length === 0
                ? <div className="eb" style={{ padding: '56px 24px' }}>
                    <Heart size={44} style={{ color: MUTED, margin: '0 auto 14px' }} />
                    <h3 style={{ fontFamily: "'Syne',sans-serif", fontSize: 20, color: WHITE, marginBottom: 6 }}>Nothing Saved Yet</h3>
                    <p className="et" style={{ marginBottom: 18 }}>Browse and save books for later</p>
                    <Link href="/documents"><button className="btn-purple">Browse Documents</button></Link>
                </div>
                : <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {wishlist.map((item, i) => {
                        const thumb = getThumbnailUrl(item);
                        const navId = item.bookId || item.firestoreId || item.id;
                        return (
                            <div key={item.id || i} className="wr"
                                onMouseEnter={e => e.currentTarget.style.borderColor = PURPLE}
                                onMouseLeave={e => e.currentTarget.style.borderColor = BORDER}>
                                <div style={{ width: 42, height: 54, background: DARK2, flexShrink: 0, overflow: 'hidden' }}>
                                    {thumb
                                        ? <img src={thumb} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => e.target.style.display = 'none'} />
                                        : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><BookOpen size={14} style={{ color: MUTED }} /></div>
                                    }
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <p style={{ fontSize: 12, fontWeight: 700, color: WHITE, margin: '0 0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: "'Space Grotesk',sans-serif" }}>{item.title || item.bookTitle}</p>
                                    <p style={{ fontSize: 10, color: MUTED, margin: '0 0 5px', fontFamily: "'Space Grotesk',sans-serif", overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.author || ''}</p>
                                    <p style={{ fontSize: 12, fontWeight: 700, color: LIME, margin: 0, fontFamily: "'Space Grotesk',sans-serif" }}>₦{Number(item.price || 0).toLocaleString()}</p>
                                </div>
                                <div style={{ display: 'flex', gap: 7, flexShrink: 0 }}>
                                    <Link href={`/payment?bookId=${navId}`}>
                                        <button style={{ padding: '7px 14px', background: PURPLE, color: WHITE, border: 'none', fontSize: 10, fontWeight: 700, cursor: 'pointer', fontFamily: "'Space Grotesk',sans-serif" }}>Buy</button>
                                    </Link>
                                    <Link href={`/book/preview?id=${navId}`}>
                                        <button style={{ padding: '7px 10px', background: 'transparent', color: WHITE, border: `1px solid ${BORDER}`, fontSize: 10, fontWeight: 700, cursor: 'pointer', fontFamily: "'Space Grotesk',sans-serif" }}><Eye size={12} /></button>
                                    </Link>
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
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;700;800&family=Space+Grotesk:wght@300;400;600;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; min-width: 0; }
        body { overflow-x: hidden; background: ${VOID}; }

        .lan-root  { font-family: 'Space Grotesk', sans-serif; background: ${VOID}; min-height: 100vh; }

        /* ── Layout ── */
        .pw { display: flex; max-width: 1280px; margin: 0 auto; width: 100%; }

        /* ── Sidebar ── */
        .sidebar {
          width: 220px; flex-shrink: 0;
          display: none;
          flex-direction: column;
          border-right: 1px solid ${BORDER};
          min-height: calc(100vh - 64px);
          position: sticky; top: 64px; align-self: flex-start;
          background: ${DARK}; padding: 22px 0;
        }
        @media (min-width: 1024px) { .sidebar { display: flex; } }

        /* ── Main ── */
        .mc { flex: 1; min-width: 0; padding: 0 16px 80px; }
        @media (min-width: 600px)  { .mc { padding: 0 24px 80px; } }
        @media (min-width: 1024px) { .mc { padding: 28px 32px 40px; } }

        /* ── Mobile top bar ── */
        .mtb {
          display: flex; align-items: center; justify-content: space-between;
          padding: 12px 0 10px; margin-bottom: 4px;
          border-bottom: 1px solid ${BORDER2};
          position: sticky; top: 0; background: ${VOID}; z-index: 50;
        }
        @media (min-width: 1024px) { .mtb { display: none; } }

        /* ── Hero ── */
        .hero {
          background: ${DARK};
          background-image:
            radial-gradient(rgba(124,58,237,.08) 1px, transparent 1px),
            radial-gradient(rgba(163,230,53,.04) 1px, transparent 1px);
          background-size: 28px 28px, 14px 14px;
          background-position: 0 0, 7px 7px;
          border: 1px solid ${BORDER};
          padding: 26px 20px 22px; position: relative; overflow: hidden;
        }

        /* ── Labels / titles ── */
        .sl { font-size: 9px; font-weight: 700; letter-spacing: .2em; text-transform: uppercase; color: ${LIME}; margin: 0 0 5px; font-family: 'Space Grotesk',sans-serif; display: block; }
        .st { font-family: 'Syne', sans-serif; font-size: clamp(16px,3vw,22px); font-weight: 800; color: ${WHITE}; margin: 0; letter-spacing: -.02em; }
        .slink { font-size: 10px; font-weight: 700; color: ${MUTED}; text-decoration: none; display: inline-flex; align-items: center; gap: 2px; letter-spacing: .04em; font-family: 'Space Grotesk',sans-serif; transition: color .15s; white-space: nowrap; cursor: pointer; background: none; border: none; padding: 0; }
        .slink:hover { color: ${LIME}; }

        /* ── Grids ── */
        .bg { display: grid; grid-template-columns: repeat(2,1fr); gap: 12px; }
        @media (min-width: 480px)  { .bg { grid-template-columns: repeat(3,1fr); } }
        @media (min-width: 768px)  { .bg { grid-template-columns: repeat(4,1fr); gap: 14px; } }
        @media (min-width: 1024px) { .bg { grid-template-columns: repeat(5,1fr); } }
        .tg { display: grid; grid-template-columns: repeat(2,1fr); gap: 10px; }
        @media (min-width: 640px) { .tg { grid-template-columns: repeat(4,1fr); } }

        /* ── Cards ── */
        .book-card { background: ${DARK}; border: 1px solid ${BORDER2}; overflow: hidden; transition: transform .22s, box-shadow .22s, border-color .22s; cursor: pointer; }
        .book-card:hover { transform: translateY(-4px); box-shadow: 0 12px 32px rgba(124,58,237,.2); border-color: ${PURPLE}; }
        .lec-card { background: ${DARK}; border: 1px solid ${BORDER2}; overflow: hidden; transition: transform .25s cubic-bezier(.4,0,.2,1), box-shadow .25s, border-color .25s; }
        .lec-card:hover { transform: translateY(-5px); box-shadow: 0 16px 40px rgba(124,58,237,.2); border-color: ${PURPLE}; }
        .lec-card:hover .lec-img { transform: scale(1.05); }
        .lec-img { transition: transform .6s cubic-bezier(.4,0,.2,1); }
        .tc { background: ${DARK}; border: 1px solid ${BORDER2}; padding: 16px 13px; transition: transform .2s, border-color .2s, box-shadow .2s; height: 100%; cursor: pointer; }
        .tc:hover { transform: translateY(-3px); border-color: ${PURPLE}; box-shadow: 0 8px 20px rgba(124,58,237,.15); }
        .tca { background: ${LIME}; border-color: ${LIME}; }
        .tca:hover { border-color: ${LIMEL}; background: ${LIMEL}; }
        .cr { display: flex; align-items: center; gap: 10px; padding: 10px 14px; border-bottom: 1px solid ${BORDER2}; background: transparent; transition: background .15s; cursor: pointer; }
        .cr:hover { background: rgba(124,58,237,.08); }
        .cr:last-child { border-bottom: none; }
        .sp {
          background: ${DARK2};
          background-image: radial-gradient(rgba(124,58,237,.08) 1px, transparent 1px);
          background-size: 24px 24px;
          border: 1px solid ${BORDER};
          padding: 24px; position: relative; overflow: hidden;
        }
        .ab { display: flex; align-items: center; gap: 10px; background: ${DARK2}; border: 1px solid ${BORDER2}; padding: 10px 14px; transition: background .15s, border-color .15s; margin-bottom: 6px; }
        .ab:hover { background: ${DARK3}; border-color: ${PURPLE}; }
        .ar { display: flex; align-items: center; gap: 10px; padding: 10px 14px; border: 1px solid ${BORDER2}; background: ${DARK}; transition: border-color .15s, background .15s; }
        .ar:hover { border-color: ${PURPLE}; background: ${DARK2}; }
        .wr { background: ${DARK}; border: 1px solid ${BORDER2}; padding: 12px 14px; display: flex; gap: 12px; align-items: center; transition: border-color .18s; }

        /* ── Sidebar items ── */
        .sbi { display: flex; align-items: center; gap: 10px; padding: 10px 16px; cursor: pointer; font-size: 12px; font-weight: 600; color: ${MUTED}; transition: all .15s; background: none; border: none; border-left: 2px solid transparent; width: 100%; text-align: left; font-family: 'Space Grotesk',sans-serif; }
        .sbi:hover { background: rgba(124,58,237,.1); color: ${WHITE}; }
        .sbi.act { background: rgba(124,58,237,.15); color: ${LIME}; border-left-color: ${LIME}; }

        /* ── Buttons ── */
        .btn-lime  { display: inline-flex; align-items: center; gap: 6px; padding: 9px 18px; background: ${LIME}; color: ${VOID}; border: none; font-size: 11px; font-weight: 700; cursor: pointer; font-family: 'Space Grotesk',sans-serif; letter-spacing: .06em; text-transform: uppercase; transition: background .18s; }
        .btn-lime:hover  { background: ${LIMEL}; }
        .btn-purple { display: inline-flex; align-items: center; gap: 6px; padding: 9px 18px; background: ${PURPLE}; color: ${WHITE}; border: none; font-size: 11px; font-weight: 700; cursor: pointer; font-family: 'Space Grotesk',sans-serif; letter-spacing: .06em; text-transform: uppercase; transition: background .18s; }
        .btn-purple:hover { background: ${PURPLED}; }
        .btn-ghost { padding: 9px 18px; background: rgba(255,255,255,.06); color: ${WHITE}; border: 1px solid rgba(255,255,255,.12); font-size: 11px; font-weight: 700; cursor: pointer; font-family: 'Space Grotesk',sans-serif; letter-spacing: .06em; text-transform: uppercase; transition: background .18s; display: inline-flex; align-items: center; gap: 6px; }
        .btn-ghost:hover { background: rgba(255,255,255,.1); }

        /* ── Empty ── */
        .eb { background: ${DARK}; border: 1px solid ${BORDER2}; padding: 44px 20px; text-align: center; }
        .et { font-size: 12px; color: ${MUTED}; font-family: 'Space Grotesk',sans-serif; margin: 0; }

        /* ── Mobile bottom nav ── */
        .mnav {
          display: flex !important;
          position: fixed; bottom: 0; left: 0; right: 0; height: 60px;
          background: ${DARK}; border-top: 1px solid ${BORDER};
          box-shadow: 0 -6px 30px rgba(0,0,0,.5); z-index: 99999;
          align-items: stretch; justify-content: space-around;
        }
        @media (min-width: 1024px) { .mnav { display: none !important; } }

        .mnb {
          flex: 1; display: flex; flex-direction: column; align-items: center;
          justify-content: center; gap: 3px; background: none; border: none;
          cursor: pointer; color: ${MUTED}; transition: color .15s; padding: 0;
          font-family: 'Space Grotesk',sans-serif; -webkit-tap-highlight-color: transparent;
        }
        .mnb:active { opacity: .7; }
        .mnb.on { color: ${LIME}; }
        .mnb span { font-size: 7px; font-weight: 700; letter-spacing: .07em; text-transform: uppercase; line-height: 1; white-space: nowrap; }

        .fab-wrap { display: flex; align-items: center; justify-content: center; flex-shrink: 0; padding: 0 4px; }
        .fab {
          width: 46px; height: 46px; background: ${LIME};
          border: 3px solid ${DARK}; box-shadow: 0 0 0 2px ${PURPLE};
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; transition: background .18s; flex-shrink: 0; border-radius: 50%;
        }
        .fab:active { background: ${LIMEL}; }

        @keyframes dropIn  { from { opacity:0; transform:translateY(-6px); } to { opacity:1; transform:translateY(0); } }
        @keyframes spin    { to { transform: rotate(360deg); } }
        @keyframes up      { from { opacity:0; transform:translateY(14px); } to { opacity:1; transform:translateY(0); } }
        @keyframes pulse   { 0%,100%{opacity:1} 50%{opacity:.4} }
        @keyframes slideUp { from { transform: translateY(100%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        @keyframes slideInRight { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        .au  { animation: up .38s cubic-bezier(.4,0,.2,1) both; }
        .pd  { animation: pulse 2s infinite; }

        @media(max-width:480px){ .lan-network-preview{ display:none !important; } }
      `}</style>

            {/* ══ ALL LECTURERS PANEL ══ */}
            {showAllLecturers && (
                <div onClick={() => setShowAllLecturers(false)}
                    style={{ position: 'fixed', inset: 0, zIndex: 999998, background: 'rgba(0,0,0,.7)', backdropFilter: 'blur(4px)' }}>
                    <div onClick={e => e.stopPropagation()}
                        style={{
                            position: 'absolute', top: 0, right: 0, bottom: 0, width: 'min(420px, 100vw)',
                            background: DARK, overflowY: 'auto', boxShadow: `-20px 0 60px rgba(0,0,0,.5)`,
                            animation: 'slideInRight .28s cubic-bezier(.4,0,.2,1) both', display: 'flex', flexDirection: 'column'
                        }}>
                        <div style={{ background: DARK2, padding: '20px 20px 16px', position: 'sticky', top: 0, zIndex: 2, borderBottom: `1px solid ${BORDER}` }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                                <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: '.2em', textTransform: 'uppercase', color: LIME, fontFamily: "'Space Grotesk',sans-serif", margin: 0 }}>Faculty Directory</p>
                                <button onClick={() => setShowAllLecturers(false)}
                                    style={{ background: 'rgba(255,255,255,.06)', border: `1px solid ${BORDER2}`, borderRadius: '50%', width: 28, height: 28, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: WHITE }}>
                                    <X size={14} />
                                </button>
                            </div>
                            <h2 style={{ fontFamily: "'Syne',sans-serif", fontSize: 20, fontWeight: 800, color: WHITE, margin: 0, letterSpacing: '-.02em' }}>
                                All Lecturers · <span style={{ color: LIME }}>{lecturers.length}</span>
                            </h2>
                        </div>
                        <div style={{ flex: 1, padding: '12px 16px 32px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {lecturers.map((lec, idx) => (
                                <div key={lec.sellerId}
                                    onClick={() => { setSelectedLecturer(lec); setShowAllLecturers(false); }}
                                    style={{ background: DARK2, border: `1px solid ${BORDER2}`, padding: '13px 14px', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', transition: 'all .18s' }}
                                    onMouseEnter={e => { e.currentTarget.style.borderColor = PURPLE; e.currentTarget.style.background = DARK3; }}
                                    onMouseLeave={e => { e.currentTarget.style.borderColor = BORDER2; e.currentTarget.style.background = DARK2; }}>
                                    <div style={{ fontSize: 11, fontWeight: 700, color: MUTED, fontFamily: "'Syne',sans-serif", width: 20, flexShrink: 0, textAlign: 'center' }}>{idx + 1}</div>
                                    {lec.photo ? (
                                        <img src={lec.photo} alt={lec.sellerName}
                                            style={{ width: 42, height: 42, borderRadius: '50%', objectFit: 'cover', objectPosition: 'top', border: `1.5px solid ${PURPLE}`, flexShrink: 0 }}
                                            onError={e => e.target.style.display = 'none'} />
                                    ) : (
                                        <div style={{ width: 42, height: 42, borderRadius: '50%', background: getPalette(lec.sellerName).bg, border: `1.5px solid ${BORDER}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                            <span style={{ color: getPalette(lec.sellerName).text, fontSize: 14, fontWeight: 700, fontFamily: "'Syne',sans-serif" }}>{getInitials(lec.sellerName)}</span>
                                        </div>
                                    )}
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <p style={{ fontSize: 12, fontWeight: 700, color: WHITE, margin: '0 0 2px', fontFamily: "'Syne',sans-serif", overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {lec.title ? `${lec.title} ${lec.sellerName}` : lec.sellerName}
                                        </p>
                                        {lec.department && (
                                            <p style={{ fontSize: 10, color: MUTED, margin: '0 0 2px', fontFamily: "'Space Grotesk',sans-serif", overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 3 }}>
                                                <BookMarked size={8} style={{ color: LIME, flexShrink: 0 }} />{lec.department}
                                            </p>
                                        )}
                                        <p style={{ fontSize: 10, color: LIME, margin: 0, fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700 }}>
                                            {lec.uploadedBooks} material{lec.uploadedBooks !== 1 ? 's' : ''}
                                        </p>
                                    </div>
                                    <ChevronRight size={12} style={{ color: MUTED, flexShrink: 0 }} />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* ══ LECTURER DETAIL MODAL ══ */}
            {selectedLecturer && (() => {
                const lec = selectedLecturer;
                const myBooks = lecturerBooks.filter(b => b.sellerId === lec.sellerId || b.lecturerName === lec.sellerName);
                return (
                    <div onClick={() => setSelectedLecturer(null)}
                        style={{ position: 'fixed', inset: 0, zIndex: 999999, background: 'rgba(0,0,0,.75)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
                        <div onClick={e => e.stopPropagation()}
                            style={{ background: DARK, width: '100%', maxWidth: 560, maxHeight: '88vh', overflowY: 'auto', borderRadius: '16px 16px 0 0', animation: 'slideUp .28s cubic-bezier(.4,0,.2,1) both', border: `1px solid ${BORDER}` }}>
                            <div style={{ background: DARK2, padding: '20px 20px 18px', position: 'sticky', top: 0, zIndex: 2, display: 'flex', alignItems: 'flex-start', gap: 14, borderBottom: `1px solid ${BORDER}` }}>
                                {lec.photo ? (
                                    <img src={lec.photo} alt={lec.sellerName}
                                        style={{ width: 60, height: 60, borderRadius: '50%', objectFit: 'cover', objectPosition: 'top', border: `2px solid ${PURPLE}`, flexShrink: 0 }}
                                        onError={e => e.target.style.display = 'none'} />
                                ) : (
                                    <div style={{ width: 60, height: 60, borderRadius: '50%', background: getPalette(lec.sellerName).bg, border: `2px solid ${PURPLE}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                        <span style={{ color: getPalette(lec.sellerName).text, fontSize: 22, fontWeight: 700, fontFamily: "'Syne',sans-serif" }}>{getInitials(lec.sellerName)}</span>
                                    </div>
                                )}
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: '.14em', textTransform: 'uppercase', color: PURPLEL, fontFamily: "'Space Grotesk',sans-serif", margin: '0 0 4px' }}>{lec.title || 'Faculty'}</p>
                                    <h2 style={{ fontFamily: "'Syne',sans-serif", fontSize: 18, fontWeight: 800, color: WHITE, margin: '0 0 6px', lineHeight: 1.2, letterSpacing: '-.02em' }}>
                                        {lec.title ? `${lec.title} ${lec.sellerName}` : lec.sellerName}
                                    </h2>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                                        {lec.department && <span style={{ fontSize: 10, color: MUTED, fontFamily: "'Space Grotesk',sans-serif", display: 'flex', alignItems: 'center', gap: 4 }}><BookMarked size={9} style={{ color: LIME }} />{lec.department}</span>}
                                        {lec.university && <span style={{ fontSize: 10, color: 'rgba(248,248,255,.3)', fontFamily: "'Space Grotesk',sans-serif", display: 'flex', alignItems: 'center', gap: 4 }}><GraduationCap size={9} style={{ color: LIME }} />{lec.university}</span>}
                                    </div>
                                    <p style={{ fontSize: 10, color: LIME, margin: '8px 0 0', fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700 }}>{lec.uploadedBooks} material{lec.uploadedBooks !== 1 ? 's' : ''} uploaded</p>
                                </div>
                                <button onClick={() => setSelectedLecturer(null)}
                                    style={{ background: 'rgba(255,255,255,.06)', border: `1px solid ${BORDER2}`, borderRadius: '50%', width: 30, height: 30, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: WHITE, flexShrink: 0 }}>
                                    <X size={15} />
                                </button>
                            </div>
                            <div style={{ padding: '18px 18px 32px' }}>
                                <Link href={`/seller-profile?sellerId=${lec.sellerId}`} onClick={() => setSelectedLecturer(null)} style={{ textDecoration: 'none' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'rgba(124,58,237,.15)', border: `1px solid ${BORDER}`, marginBottom: 20, cursor: 'pointer', transition: 'background .15s' }}
                                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(124,58,237,.25)'}
                                        onMouseLeave={e => e.currentTarget.style.background = 'rgba(124,58,237,.15)'}>
                                        <span style={{ fontSize: 11, fontWeight: 700, color: PURPLEL, fontFamily: "'Space Grotesk',sans-serif" }}>View Full Profile</span>
                                        <ChevronRight size={13} style={{ color: LIME }} />
                                    </div>
                                </Link>
                                {myBooks.length > 0 ? (
                                    <>
                                        <p style={{ fontSize: 8, fontWeight: 700, letterSpacing: '.14em', textTransform: 'uppercase', color: MUTED, fontFamily: "'Space Grotesk',sans-serif", margin: '0 0 12px' }}>Materials by this lecturer</p>
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
                                        <BookOpen size={32} style={{ color: MUTED, margin: '0 auto 10px' }} />
                                        <p style={{ fontSize: 13, fontWeight: 700, color: WHITE, fontFamily: "'Syne',sans-serif", margin: '0 0 4px' }}>No materials yet</p>
                                        <p style={{ fontSize: 11, color: MUTED, fontFamily: "'Space Grotesk',sans-serif", margin: 0 }}>This lecturer hasn't uploaded any books yet.</p>
                                    </div>
                                )}
                            </div>
                            <FeaturedAdsCarousel tier="Bronze" maxAds={2} autoPlay={true} autoPlayMs={4000} style={{ marginTop: '1px' }} />
                        </div>
                    </div>
                );
            })()}

            <div className="lan-root">
                <Navbar />
                <div className="pw">

                    {/* ══ SIDEBAR ══ */}
                    <aside className="sidebar">
                        <div style={{ padding: '0 16px 16px', borderBottom: `1px solid ${BORDER2}`, marginBottom: 6 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                                <Avatar name={displayName} src={user?.photoBase64 || user?.photoURL} size={34} />
                                <div style={{ minWidth: 0 }}>
                                    <p style={{ fontSize: 11, fontWeight: 700, color: WHITE, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: "'Space Grotesk',sans-serif" }}>{displayName}</p>
                                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                                        <div className="pd" style={{ width: 5, height: 5, borderRadius: '50%', background: LIME }} />
                                        <span style={{ fontSize: 8, fontWeight: 700, color: LIME, letterSpacing: '.1em', textTransform: 'uppercase', fontFamily: "'Space Grotesk',sans-serif" }}>Student</span>
                                    </div>
                                    {(user?.department || user?.faculty) && (
                                        <p style={{ fontSize: 9, color: MUTED, margin: '2px 0 0', fontFamily: "'Space Grotesk',sans-serif", overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.department || user.faculty}</p>
                                    )}
                                    {(user?.institution || user?.university) && (
                                        <p style={{ fontSize: 9, color: 'rgba(248,248,255,.2)', margin: '1px 0 0', fontFamily: "'Space Grotesk',sans-serif", overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.institution || user.university}</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div style={{ padding: '8px 16px', borderBottom: `1px solid ${BORDER2}`, marginBottom: 6, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span style={{ fontSize: 11, color: MUTED, fontWeight: 700, fontFamily: "'Space Grotesk',sans-serif" }}>Notifications</span>
                            {user?.uid && <NotificationBell userId={user.uid} />}
                        </div>

                        {[
                            { id: 'home', icon: LayoutDashboard, label: 'Home' },
                            { id: 'library', icon: LibraryBig, label: 'Library' },
                            { id: 'ai', icon: Sparkles, label: 'AI Tutor' },
                            { id: 'wishlist', icon: Heart, label: 'Saved' },
                            { id: 'bounties', icon: Zap, label: 'My Bounties' },
                        ].map(({ id, icon: Icon, label }) => (
                            <button key={id} onClick={() => setActiveTab(id)} className={`sbi${activeTab === id ? ' act' : ''}`}>
                                <Icon size={14} style={{ color: activeTab === id ? LIME : MUTED, flexShrink: 0 }} />{label}
                            </button>
                        ))}

                        <div style={{ borderTop: `1px solid ${BORDER2}`, margin: '10px 0', padding: '6px 0' }}>
                            <Link href="/documents" style={{ textDecoration: 'none' }}><button className="sbi"><Search size={14} style={{ color: MUTED, flexShrink: 0 }} />Browse All</button></Link>
                            <Link href="/my-account" style={{ textDecoration: 'none' }}><button className="sbi"><User size={14} style={{ color: MUTED, flexShrink: 0 }} />Profile</button></Link>
                            {user?.isSeller
                                ? <Link href="/my-account/seller-account" style={{ textDecoration: 'none' }}><button className="sbi" style={{ color: LIME }}><BarChart2 size={14} style={{ color: LIME, flexShrink: 0 }} />Author Studio</button></Link>
                                : <Link href="/become-seller" style={{ textDecoration: 'none' }}><button className="sbi" style={{ color: PURPLEL }}><Store size={14} style={{ color: PURPLEL, flexShrink: 0 }} />Become a Seller</button></Link>
                            }
                        </div>

                        <button onClick={() => { auth.signOut(); router.push('/auth/signin'); }}
                            style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', gap: 9, padding: '10px 16px', background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', fontSize: 12, fontWeight: 700, fontFamily: "'Space Grotesk',sans-serif" }}>
                            <LogOut size={14} /> Sign Out
                        </button>
                    </aside>

                    {/* ══ MAIN CONTENT ══ */}
                    <main className="mc au">
                        {/* Mobile top bar */}
                        <div className="mtb">
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <Avatar name={displayName} src={user?.photoBase64 || user?.photoURL} size={28} />
                                <div>
                                    <p style={{ fontSize: 9, color: LIME, fontWeight: 700, fontFamily: "'Space Grotesk',sans-serif", margin: 0, letterSpacing: '.08em', textTransform: 'uppercase' }}>Student</p>
                                    <p style={{ fontSize: 12, fontWeight: 700, color: WHITE, margin: 0, fontFamily: "'Syne',sans-serif" }}>{user?.firstName || displayName}</p>
                                </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                {user?.uid && <NotificationBell userId={user.uid} />}
                                <Link href="/my-account">
                                    <div style={{ width: 30, height: 30, borderRadius: '50%', background: DARK2, border: `1px solid ${BORDER}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                                        <User size={14} style={{ color: WHITE }} />
                                    </div>
                                </Link>
                            </div>
                        </div>

                        {activeTab === 'home' && renderHome()}
                        {activeTab === 'library' && renderLibrary()}
                        {activeTab === 'ai' && renderAI()}
                        {activeTab === 'wishlist' && renderWishlist()}
                        {activeTab === 'bounties' && (
                            <div>
                                <div style={{ marginBottom: 22 }}>
                                    <p className="sl">Bounty Board</p>
                                    <h2 style={{ fontFamily: "'Syne',sans-serif", fontSize: 24, fontWeight: 800, color: WHITE, margin: '3px 0 0', letterSpacing: '-.02em' }}>My Bounties</h2>
                                </div>
                                {user?.uid && <BountyDashboardCard user={user} />}
                                {pendingBounties.length > 0 && (
                                    <div style={{ marginTop: 24, borderTop: `1px solid ${BORDER2}`, paddingTop: 22 }}>
                                        <p className="sl" style={{ marginBottom: 6 }}>Action Required</p>
                                        <h3 style={{ fontFamily: "'Syne',sans-serif", fontSize: 17, color: WHITE, margin: '0 0 12px', letterSpacing: '-.01em' }}>Bounties Awaiting Your Review</h3>
                                        {pendingBounties.map(b => (
                                            <div key={b.id} style={{ background: DARK, border: `1px solid ${PURPLE}`, padding: '14px 16px', marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                    <p style={{ fontSize: 13, fontWeight: 700, color: WHITE, margin: '0 0 2px', fontFamily: "'Space Grotesk',sans-serif", overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{b.title}</p>
                                                    <p style={{ fontSize: 10, color: MUTED, margin: 0, fontFamily: "'Space Grotesk',sans-serif" }}>
                                                        Submitted by <strong style={{ color: WHITE }}>{b.claimedByName || 'Author'}</strong> · ₦{Number(b.reward).toLocaleString()} in escrow
                                                    </p>
                                                </div>
                                                <button onClick={() => setApprovalBounty({ id: b.id, data: b })}
                                                    style={{ padding: '9px 18px', background: PURPLE, color: WHITE, border: 'none', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: "'Space Grotesk',sans-serif", letterSpacing: '0.06em', flexShrink: 0 }}>
                                                    Review →
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </main>
                </div>

                {/* ══ MOBILE BOTTOM NAV ══ */}
                <nav className="mnav" role="navigation" aria-label="Bottom navigation">
                    <button className={`mnb${activeTab === 'home' ? ' on' : ''}`} onClick={() => setActiveTab('home')}>
                        <LayoutDashboard size={20} /><span>Home</span>
                    </button>
                    <button className={`mnb${activeTab === 'library' ? ' on' : ''}`} onClick={() => setActiveTab('library')}>
                        <LibraryBig size={20} /><span>Library</span>
                    </button>
                    <div className="fab-wrap">
                        <Link href="/advertise" style={{ textDecoration: 'none', lineHeight: 0 }}>
                            <div className="fab"><Plus size={22} style={{ color: VOID }} strokeWidth={2.5} /></div>
                        </Link>
                    </div>
                    <button className={`mnb${activeTab === 'ai' ? ' on' : ''}`} onClick={() => setActiveTab('ai')}>
                        <Sparkles size={20} /><span>AI</span>
                    </button>
                    <button className={`mnb${activeTab === 'wishlist' ? ' on' : ''}`} onClick={() => setActiveTab('wishlist')}>
                        <Heart size={20} /><span>Saved</span>
                    </button>
                    <button className={`mnb${activeTab === 'bounties' ? ' on' : ''}`} onClick={() => setActiveTab('bounties')}>
                        <Zap size={20} /><span>Bounties</span>
                    </button>
                </nav>
            </div>

            {approvalBounty && (
                <BountyApprovalModal
                    bountyId={approvalBounty.id}
                    bountyData={approvalBounty.data}
                    currentUser={{ uid: user.uid, email: user.email, displayName: user.displayName || `${user.firstName} ${user.surname}` }}
                    onClose={() => setApprovalBounty(null)}
                    onUpdateStatus={(status) => { setPendingBounties(prev => prev.filter(b => b.id !== approvalBounty.id)); setApprovalBounty(null); }}
                />
            )}
        </>
    );
}