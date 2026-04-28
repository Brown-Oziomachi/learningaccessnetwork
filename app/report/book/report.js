"use client"
import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { auth, db } from '@/lib/firebaseConfig';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { Flag, ArrowLeft, Send, CheckCircle, AlertTriangle, Star } from 'lucide-react';
import Link from 'next/link';
import { fetchBookDetails } from '@/utils/bookUtils';

/* ─── colour tokens ───────────────────────────────────────────── */
const NAVY  = "#0d2244";
const GOLD  = "#b8963e";
const GOLDD = "#d4aa5a";
const CREAM = "#f5f0e8";
const BG    = "#f5f1ea";

export default function ReportBookPage() {
    const router       = useRouter();
    const searchParams = useSearchParams();
    const bookId       = searchParams.get('bookId');

    const [book,       setBook]       = useState(null);
    const [loading,    setLoading]    = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [submitted,  setSubmitted]  = useState(false);
    const [user,       setUser]       = useState(null);

    const [formData, setFormData] = useState({
        reason:  '',
        details: '',
        email:   ''
    });

    const reportReasons = [
        { label: 'Inappropriate Content',   icon: '🚫' },
        { label: 'Copyright Infringement',  icon: '©️'  },
        { label: 'Misleading Information',  icon: '❗' },
        { label: 'Poor Quality/Unreadable', icon: '📄' },
        { label: 'Incorrect Price',          icon: '💰' },
        { label: 'Spam or Scam',             icon: '⚠️' },
        { label: 'Other',                    icon: '📝' },
    ];

    const getThumbnailUrl = (book) => {
        if (!book) return 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400';
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
        const cu = auth.currentUser;
        if (cu) {
            setUser(cu);
            setFormData(prev => ({ ...prev, email: cu.email || '' }));
        }
    }, []);

    useEffect(() => {
        const loadBook = async () => {
            if (!bookId) { setLoading(false); return; }
            try {
                const data = await fetchBookDetails(bookId);
                if (data) setBook({ ...data, image: getThumbnailUrl(data) });
            } catch (e) { console.error(e); }
            finally { setLoading(false); }
        };
        loadBook();
    }, [bookId]);

    const handleInputChange = e => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async () => {
        if (!formData.reason)         { alert('Please select a reason for reporting'); return; }
        if (!formData.details.trim()) { alert('Please provide details about your report'); return; }
        if (!formData.email)          { alert('No email found. Please sign in.'); return; }
        try {
            setSubmitting(true);
            await addDoc(collection(db, 'bookReports'), {
                bookId: book.id, bookTitle: book.title, bookAuthor: book.author,
                bookPrice: book.price, bookCategory: book.category, bookImage: book.image,
                bookEmbedUrl: book.embedUrl||null, bookPdfUrl: book.pdfUrl||null,
                bookDriveFileId: book.driveFileId||null,
                reason: formData.reason, details: formData.details,
                reporterEmail: formData.email, 
                reportedBy: user?.uid || null,               
                reporterName: user?.displayName||'Anonymous',
                status: 'pending', createdAt: serverTimestamp(),
                resolvedAt: null, adminNotes: '',
            });
            setSubmitted(true);
            setTimeout(() => router.push(`/book/preview?id=${bookId}`), 3000);
        } catch (e) {
            console.error(e);
            alert('Failed to submit report. Please try again.');
        } finally { setSubmitting(false); }
    };

    const canSubmit = !submitting && !!formData.reason && formData.details.trim().length >= 10 && !!formData.email;

    /* ── styles ── */
    const styles = `
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400&family=Lato:wght@300;400;700&display=swap');

        .rp-root  { font-family:'Lato',sans-serif; background:${BG}; min-height:100vh; }
        .rp-serif { font-family:'Playfair Display',Georgia,serif; }

        .rp-header {
            background-color:${NAVY};
            background-image:
                radial-gradient(rgba(184,150,62,0.06) 1px, transparent 1px),
                radial-gradient(rgba(255,255,255,0.03) 1px, transparent 1px);
            background-size:28px 28px,14px 14px;
            background-position:0 0,7px 7px;
        }

        .rp-card { background:#fff; border:0.5px solid #e5ddd0; }

        .rp-reason {
            display:flex; align-items:center; gap:12px;
            padding:14px 18px;
            border:0.5px solid #e5ddd0;
            cursor:pointer; background:#fff;
            transition:border-color .2s, background .2s, transform .15s;
        }
        .rp-reason:hover { border-color:${GOLD}; background:${CREAM}; transform:translateX(3px); }
        .rp-reason.active { border-color:${NAVY}; background:${CREAM}; border-left:3px solid ${NAVY}; }

        .rp-input:focus { outline:none; border-color:${NAVY}; box-shadow:0 0 0 2px rgba(13,34,68,0.08); }

        .gold-line { display:flex; align-items:center; gap:14px; }
        .gold-line::before,.gold-line::after { content:""; flex:1; height:1px; background:rgba(184,150,62,0.3); }

        .crest-bg {
            background-color:${NAVY};
            background-image:
                repeating-linear-gradient(45deg,transparent,transparent 12px,rgba(255,255,255,0.018) 12px,rgba(255,255,255,0.018) 13px),
                repeating-linear-gradient(-45deg,transparent,transparent 12px,rgba(255,255,255,0.018) 12px,rgba(255,255,255,0.018) 13px);
        }

        @keyframes slideUp { from{opacity:0;transform:translateY(22px)} to{opacity:1;transform:translateY(0)} }
        .anim-up   { animation:slideUp .55s cubic-bezier(.4,0,.2,1) both; }
        .anim-up-2 { animation:slideUp .55s .1s cubic-bezier(.4,0,.2,1) both; }
        .anim-up-3 { animation:slideUp .55s .2s cubic-bezier(.4,0,.2,1) both; }

        @keyframes checkPop { 0%{transform:scale(0) rotate(-20deg);opacity:0} 70%{transform:scale(1.1) rotate(3deg)} 100%{transform:scale(1) rotate(0);opacity:1} }
        .check-pop { animation:checkPop .6s cubic-bezier(.4,0,.2,1) both; }

        /* ── Submit button ── */
        .rp-submit {
            display:flex; align-items:center; justify-content:center; gap:8px;
            width:100%; padding:16px 24px;
            background:${NAVY}; color:#fff;
            font-family:'Lato',sans-serif; font-size:14px; font-weight:700; letter-spacing:.06em;
            border:none; cursor:pointer;
            transition:background .18s, transform .15s;
        }
        .rp-submit:hover:not(:disabled) { background:#1a3560; transform:translateY(-1px); }
        .rp-submit:disabled { opacity:.45; cursor:not-allowed; transform:none; }

        .rp-cancel {
            display:flex; align-items:center; justify-content:center; gap:8px;
            width:100%; padding:14px 24px;
            background:transparent; color:${NAVY};
            font-family:'Lato',sans-serif; font-size:13px; font-weight:700; letter-spacing:.06em;
            border:0.5px solid ${NAVY}; cursor:pointer;
            transition:background .18s;
        }
        .rp-cancel:hover { background:rgba(13,34,68,.06); }

        /* ── Two-column layout (desktop only) ── */
        .rp-grid {
            display:grid;
            grid-template-columns:1fr 2fr;
            gap:28px;
            align-items:start;
        }

        /* ── Sticky book card (desktop only) ── */
        .rp-book-sticky { position:sticky; top:88px; }

        /* ── Mobile book card: horizontal strip ── */
        .rp-book-mobile {
            display:none;
        }

        /* ── Mobile action bar: fixed to bottom ── */
        .rp-mobile-actions {
            display:none;
        }

        @media (max-width: 860px) {
            .rp-grid {
                grid-template-columns:1fr !important;
            }

            /* Hide the tall desktop book card */
            .rp-book-sticky {
                display:none !important;
            }

            /* Show slim horizontal book strip */
            .rp-book-mobile {
                display:flex !important;
                align-items:center;
                gap:14px;
                background:#fff;
                border:0.5px solid #e5ddd0;
                padding:14px 16px;
                margin-bottom:20px;
            }

            /* Hide inline desktop action buttons */
            .rp-desktop-actions {
                display:none !important;
            }

            /* Fixed bottom action bar */
            .rp-mobile-actions {
                display:block !important;
                position:fixed;
                bottom:0; left:0; right:0;
                background:#fff;
                border-top:0.5px solid #e5ddd0;
                padding:14px 20px calc(14px + env(safe-area-inset-bottom));
                z-index:100;
                box-shadow:0 -8px 32px rgba(13,34,68,0.10);
            }

            /* Add bottom padding to main so content isn't hidden behind fixed bar */
            .rp-main-mobile-pad {
                padding-bottom:120px !important;
            }
        }

        @keyframes spin { to{transform:rotate(360deg)} }
    `;

    /* ── LOADING ── */
    if (loading) return (
        <>
            <style>{styles}</style>
            <div className="rp-root" style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'100vh' }}>
                <div style={{ textAlign:'center' }}>
                    <div style={{ width:48,height:48,border:`3px solid ${GOLD}`,borderTopColor:'transparent',borderRadius:'50%',animation:'spin .8s linear infinite',margin:'0 auto 16px' }} />
                    <p style={{ fontFamily:"'Lato',sans-serif", color:'#888', fontSize:13 }}>Loading book details…</p>
                </div>
            </div>
        </>
    );

    /* ── BOOK NOT FOUND ── */
    if (!book) return (
        <>
            <style>{styles}</style>
            <div className="rp-root" style={{ display:'flex', alignItems:'center', justifyContent:'center', padding:24, minHeight:'100vh' }}>
                <div className="rp-card" style={{ maxWidth:440, width:'100%', padding:'56px 40px', textAlign:'center' }}>
                    <div style={{ width:72,height:72,border:`0.5px solid #e5ddd0`,display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 24px' }}>
                        <Flag size={28} style={{ color:'#ccc' }} />
                    </div>
                    <h2 className="rp-serif" style={{ fontSize:26,fontWeight:700,color:NAVY,marginBottom:10 }}>Book Not Found</h2>
                    <p style={{ fontSize:14,color:'#888',marginBottom:28,lineHeight:1.7 }}>Unable to load book details for reporting.</p>
                    <Link href="/home" style={{ display:'inline-block',padding:'12px 28px',background:NAVY,color:'#fff',fontSize:13,fontWeight:700,textDecoration:'none',fontFamily:"'Lato',sans-serif" }}>
                        Return to Home
                    </Link>
                </div>
            </div>
        </>
    );

    /* ── SUCCESS ── */
    if (submitted) return (
        <>
            <style>{styles}</style>
            <div className="rp-root" style={{ display:'flex', alignItems:'center', justifyContent:'center', padding:24, minHeight:'100vh' }}>
                <div className="rp-card" style={{ maxWidth:480, width:'100%', padding:'64px 40px', textAlign:'center' }}>
                    <div style={{ display:'flex',alignItems:'center',justifyContent:'center',gap:16,marginBottom:32 }}>
                        <div style={{ height:1,width:60,background:'rgba(184,150,62,0.4)' }} />
                        <Star size={14} style={{ color:GOLD,fill:GOLD }} />
                        <div style={{ height:1,width:60,background:'rgba(184,150,62,0.4)' }} />
                    </div>
                    <div className="check-pop" style={{ width:80,height:80,background:'rgba(22,163,74,0.1)',border:'0.5px solid rgba(22,163,74,0.3)',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 28px' }}>
                        <CheckCircle size={40} style={{ color:'#16a34a' }} />
                    </div>
                    <h2 className="rp-serif" style={{ fontSize:32,fontWeight:700,color:NAVY,marginBottom:10 }}>Report Submitted</h2>
                    <p style={{ fontSize:14,color:'#888',lineHeight:1.75,marginBottom:28 }}>
                        Thank you for reporting this issue. Our team will review it within 24–48 hours.
                    </p>
                    <div style={{ background:CREAM,border:`0.5px solid rgba(184,150,62,0.3)`,padding:'18px 24px',marginBottom:32,textAlign:'left' }}>
                        <p style={{ fontSize:12,color:NAVY,margin:'0 0 6px',fontFamily:"'Lato',sans-serif" }}>
                            <span style={{ fontWeight:700,textTransform:'uppercase',letterSpacing:'.08em',fontSize:10,color:GOLD }}>Book</span><br/>{book.title}
                        </p>
                        <p style={{ fontSize:12,color:NAVY,margin:0,fontFamily:"'Lato',sans-serif" }}>
                            <span style={{ fontWeight:700,textTransform:'uppercase',letterSpacing:'.08em',fontSize:10,color:GOLD }}>Reason</span><br/>{formData.reason}
                        </p>
                    </div>
                    <p style={{ fontSize:12,color:'#aaa',marginBottom:20 }}>Redirecting back to book preview…</p>
                    <Link href={`/book/preview?id=${bookId}`}
                        style={{ display:'inline-flex',alignItems:'center',gap:8,padding:'12px 28px',background:NAVY,color:'#fff',fontSize:13,fontWeight:700,textDecoration:'none',fontFamily:"'Lato',sans-serif" }}>
                        Return to Book
                    </Link>
                </div>
            </div>
        </>
    );

    /* ══════════════════════════════════════════════════════════
       MAIN FORM
    ══════════════════════════════════════════════════════════ */
    return (
        <>
            <style>{styles}</style>
            <div className="rp-root">

                {/* ── Sticky Header ── */}
                <header className="rp-header" style={{ padding:'0 24px', position:'sticky', top:0, zIndex:50 }}>
                    <div style={{ maxWidth:1200,margin:'0 auto',display:'flex',alignItems:'center',gap:16,padding:'18px 0',borderBottom:'0.5px solid rgba(184,150,62,0.15)' }}>
                        <button onClick={() => router.back()}
                            style={{ width:40,height:40,border:'0.5px solid rgba(184,150,62,0.3)',background:'transparent',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',flexShrink:0 }}>
                            <ArrowLeft size={18} style={{ color:GOLDD }} />
                        </button>
                        <div style={{ flex:1, minWidth:0 }}>
                            <p style={{ fontSize:10,fontWeight:700,letterSpacing:'.18em',textTransform:'uppercase',color:GOLD,margin:'0 0 3px',fontFamily:"'Lato',sans-serif" }}>
                                Community Standards
                            </p>
                            <h1 className="rp-serif" style={{ fontSize:20,fontWeight:700,color:'#fff',margin:0,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>
                                Report a Problem
                            </h1>
                        </div>
                        {/* Book title pill — desktop only */}
                        <div style={{ display:'flex',alignItems:'center',gap:10,background:'rgba(184,150,62,0.1)',border:'0.5px solid rgba(184,150,62,0.25)',padding:'8px 16px',maxWidth:280,flexShrink:0 }}
                             className="max-lg:hidden">
                            <Flag size={12} style={{ color:GOLD,flexShrink:0 }} />
                            <span style={{ fontSize:12,color:'rgba(245,240,232,0.8)',fontFamily:"'Lato',sans-serif",overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>
                                {book.title}
                            </span>
                        </div>
                    </div>
                </header>

                {/* ── Warning banner ── */}
                <div style={{ background:CREAM,borderBottom:'0.5px solid #e5ddd0',padding:'12px 24px',textAlign:'center' }}>
                    <p style={{ fontSize:12,color:'#888',margin:0,fontFamily:"'Lato',sans-serif",lineHeight:1.6 }}>
                        All reports are reviewed by our moderation team.&nbsp;
                        <span style={{ color:'#ea580c',fontWeight:700 }}>False or malicious reports may result in account suspension.</span>
                    </p>
                </div>

                <main style={{ maxWidth:1200, margin:'0 auto', padding:'40px 20px 80px' }} className="rp-main-mobile-pad">

                    {/* ── Mobile book strip (hidden on desktop) ── */}
                    <div className="rp-book-mobile">
                        <img
                            src={getThumbnailUrl(book)}
                            alt={book.title}
                            style={{ width:52,height:68,objectFit:'cover',flexShrink:0,border:`0.5px solid #e5ddd0` }}
                            onError={e => { e.target.src='https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400'; }}
                        />
                        <div style={{ minWidth:0 }}>
                            <p style={{ fontSize:9,fontWeight:700,letterSpacing:'.14em',textTransform:'uppercase',color:GOLD,margin:'0 0 3px',fontFamily:"'Lato',sans-serif" }}>
                                Reporting issue for
                            </p>
                            <p style={{ fontSize:14,fontFamily:"'Playfair Display',serif",fontWeight:700,color:NAVY,margin:'0 0 2px',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>
                                {book.title}
                            </p>
                            <p style={{ fontSize:12,color:'#888',margin:0,fontFamily:"'Lato',sans-serif" }}>
                                by {book.author} · ₦{book.price?.toLocaleString()}
                            </p>
                        </div>
                    </div>

                    {/* ── Two-column grid ── */}
                    <div className="rp-grid">

                        {/* LEFT: Full book card (desktop) */}
                        <div className="rp-book-sticky rp-card">
                            <div style={{ padding:'14px 20px',borderBottom:'0.5px solid #e5ddd0',display:'flex',alignItems:'center',gap:8 }}>
                                <div style={{ width:6,height:6,background:GOLD,transform:'rotate(45deg)',flexShrink:0 }} />
                                <span style={{ fontSize:10,fontWeight:700,letterSpacing:'.14em',textTransform:'uppercase',color:NAVY,fontFamily:"'Lato',sans-serif" }}>
                                    Reporting Issue For
                                </span>
                            </div>
                            <div style={{ padding:20 }}>
                                <div style={{ position:'relative',marginBottom:20,background:'#ede8df' }}>
                                    <img
                                        src={getThumbnailUrl(book)} alt={book.title}
                                        style={{ width:'100%',aspectRatio:'3/4',objectFit:'cover',display:'block' }}
                                        onError={e => { e.target.src='https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400'; }}
                                    />
                                    <div style={{ position:'absolute',top:10,left:10,display:'inline-flex',alignItems:'center',gap:4,background:NAVY,padding:'3px 9px',fontFamily:"'Lato',sans-serif",fontSize:9,fontWeight:700,color:'#fff' }}>
                                        <span style={{ width:5,height:5,borderRadius:'50%',background:'#22c55e',display:'inline-block' }} />
                                        PDF
                                    </div>
                                </div>
                                <h3 className="rp-serif" style={{ fontSize:17,fontWeight:700,color:NAVY,margin:'0 0 6px',lineHeight:1.3 }}>{book.title}</h3>
                                <p style={{ fontSize:12,color:'#888',margin:'0 0 4px',fontFamily:"'Lato',sans-serif" }}>by {book.author}</p>
                                <p style={{ fontSize:18,fontWeight:700,color:NAVY,margin:'0 0 18px',fontFamily:"'Playfair Display',serif" }}>₦{book.price?.toLocaleString()}</p>
                                <div style={{ borderTop:'0.5px solid #f0ebe0',paddingTop:16,display:'flex',flexDirection:'column',gap:8 }}>
                                    {[
                                        { label:'Category', val: book.category },
                                        { label:'Pages',    val: book.pages||'N/A' },
                                        { label:'Format',   val: book.format||'PDF' },
                                    ].map(({ label, val }) => (
                                        <div key={label} style={{ display:'flex',justifyContent:'space-between',alignItems:'center' }}>
                                            <span style={{ fontSize:11,color:'#aaa',fontFamily:"'Lato',sans-serif",textTransform:'uppercase',letterSpacing:'.08em',fontWeight:700 }}>{label}</span>
                                            <span style={{ fontSize:12,color:NAVY,fontFamily:"'Lato',sans-serif",fontWeight:700 }}>{val}</span>
                                        </div>
                                    ))}
                                </div>
                                {book.isFromFirestore && (
                                    <div style={{ marginTop:12,background:CREAM,border:`0.5px solid rgba(184,150,62,0.3)`,padding:'6px 12px',display:'inline-flex' }}>
                                        <span style={{ fontSize:10,fontWeight:700,color:GOLD,textTransform:'uppercase',letterSpacing:'.1em',fontFamily:"'Lato',sans-serif" }}>User-Uploaded</span>
                                    </div>
                                )}
                                <Link href={`/book/preview?id=${bookId}`}
                                    style={{ display:'flex',alignItems:'center',justifyContent:'center',gap:6,marginTop:18,padding:'10px',border:`0.5px solid ${NAVY}`,color:NAVY,fontSize:12,fontWeight:700,textDecoration:'none',fontFamily:"'Lato',sans-serif",letterSpacing:'.04em' }}
                                    onMouseEnter={e=>e.currentTarget.style.background='rgba(13,34,68,.05)'}
                                    onMouseLeave={e=>e.currentTarget.style.background='transparent'}
                                >
                                    View Book Details →
                                </Link>
                            </div>
                        </div>

                        {/* RIGHT: Form */}
                        <div style={{ display:'flex', flexDirection:'column', gap:24 }}>

                            {/* Section heading */}
                            <div className="anim-up">
                                <p style={{ fontSize:10,fontWeight:700,letterSpacing:'.2em',textTransform:'uppercase',color:GOLD,marginBottom:8,fontFamily:"'Lato',sans-serif" }}>
                                    Step 1 of 1
                                </p>
                                <h2 className="rp-serif" style={{ fontSize:'clamp(24px,4vw,38px)',fontWeight:700,color:NAVY,margin:'0 0 6px' }}>
                                    What's the issue?
                                </h2>
                                <div className="gold-line" style={{ maxWidth:240 }}>
                                    <div style={{ width:8,height:8,background:GOLD,transform:'rotate(45deg)',flexShrink:0 }} />
                                </div>
                            </div>

                            {/* Reason selection */}
                            <div className="rp-card anim-up-2">
                                <div style={{ padding:'16px 20px',borderBottom:'0.5px solid #e5ddd0' }}>
                                    <span style={{ fontSize:10,fontWeight:700,letterSpacing:'.14em',textTransform:'uppercase',color:NAVY,fontFamily:"'Lato',sans-serif" }}>
                                        Select a Reason <span style={{ color:'#ea580c' }}>*</span>
                                    </span>
                                </div>
                                <div style={{ padding:16,display:'flex',flexDirection:'column',gap:8 }}>
                                    {reportReasons.map(({ label, icon }) => (
                                        <label
                                            key={label}
                                            className={`rp-reason${formData.reason === label ? ' active' : ''}`}
                                        >
                                            <input
                                                type="radio" name="reason" value={label}
                                                checked={formData.reason === label}
                                                onChange={handleInputChange}
                                                style={{ display:'none' }}
                                            />
                                            <span style={{ fontSize:18,flexShrink:0 }}>{icon}</span>
                                            <span style={{ fontSize:13,color:NAVY,fontFamily:"'Lato',sans-serif",fontWeight:formData.reason===label?700:400 }}>{label}</span>
                                            {formData.reason === label && (
                                                <div style={{ marginLeft:'auto',width:18,height:18,background:NAVY,borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}>
                                                    <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                                                        <path d="M1 4l3 3 5-6" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                                                    </svg>
                                                </div>
                                            )}
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {/* Details textarea */}
                            <div className="rp-card anim-up-3">
                                <div style={{ padding:'16px 20px',borderBottom:'0.5px solid #e5ddd0' }}>
                                    <span style={{ fontSize:10,fontWeight:700,letterSpacing:'.14em',textTransform:'uppercase',color:NAVY,fontFamily:"'Lato',sans-serif" }}>
                                        Additional Details <span style={{ color:'#ea580c' }}>*</span>
                                    </span>
                                </div>
                                <div style={{ padding:20 }}>
                                    <textarea
                                        name="details" rows={5}
                                        value={formData.details}
                                        onChange={handleInputChange}
                                        placeholder="Describe the issue in detail. The more information you provide, the better we can help resolve this quickly."
                                        className="rp-input"
                                        style={{ width:'100%',boxSizing:'border-box',padding:'14px 16px',border:'0.5px solid #e5ddd0',fontSize:13,fontFamily:"'Lato',sans-serif",color:NAVY,lineHeight:1.7,resize:'vertical',background:BG,transition:'border-color .2s' }}
                                    />
                                    <div style={{ display:'flex',justifyContent:'space-between',marginTop:8 }}>
                                        <p style={{ fontSize:11,color:'#aaa',margin:0,fontFamily:"'Lato',sans-serif" }}>Minimum 10 characters</p>
                                        <p style={{ fontSize:11,color:formData.details.length>=10?'#16a34a':'#aaa',margin:0,fontFamily:"'Lato',sans-serif",fontWeight:700 }}>
                                            {formData.details.length} chars
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Email (read-only) */}
                            <div className="rp-card anim-up-3">
                                <div style={{ padding:'16px 20px',borderBottom:'0.5px solid #e5ddd0',display:'flex',alignItems:'center',justifyContent:'space-between' }}>
                                    <span style={{ fontSize:10,fontWeight:700,letterSpacing:'.14em',textTransform:'uppercase',color:NAVY,fontFamily:"'Lato',sans-serif" }}>
                                        Contact Email
                                    </span>
                                    <span style={{ fontSize:10,fontWeight:700,letterSpacing:'.1em',textTransform:'uppercase',color:'#16a34a',fontFamily:"'Lato',sans-serif",display:'flex',alignItems:'center',gap:4 }}>
                                        <span style={{ width:6,height:6,borderRadius:'50%',background:'#16a34a',display:'inline-block' }} />
                                        Verified
                                    </span>
                                </div>
                                <div style={{ padding:20 }}>
                                    <div style={{ position:'relative' }}>
                                        <input
                                            type="email" value={formData.email}
                                            readOnly
                                            style={{ width:'100%',boxSizing:'border-box',padding:'14px 16px 14px 44px',border:'0.5px solid #e5ddd0',fontSize:13,fontFamily:"'Lato',sans-serif",color:NAVY,background:CREAM,cursor:'not-allowed' }}
                                        />
                                        <svg style={{ position:'absolute',left:14,top:'50%',transform:'translateY(-50%)' }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={GOLD} strokeWidth="1.5">
                                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                                        </svg>
                                    </div>
                                    <p style={{ fontSize:11,color:'#aaa',margin:'8px 0 0',fontFamily:"'Lato',sans-serif" }}>
                                        Tied to your account — we'll reach out here if we need more info.
                                    </p>
                                </div>
                            </div>

                            {/* ── Desktop action buttons (hidden on mobile) ── */}
                            <div className="rp-desktop-actions" style={{ display:'flex', gap:12 }}>
                                <button className="rp-cancel" onClick={() => router.back()} style={{ flex:'0 0 auto', width:'auto', padding:'14px 28px' }}>
                                    Cancel
                                </button>
                                <button
                                    className="rp-submit"
                                    onClick={handleSubmit}
                                    disabled={!canSubmit}
                                    style={{ flex:1 }}
                                >
                                    {submitting ? (
                                        <>
                                            <div style={{ width:16,height:16,border:'2px solid rgba(255,255,255,.3)',borderTopColor:'#fff',borderRadius:'50%',animation:'spin .7s linear infinite' }} />
                                            Submitting…
                                        </>
                                    ) : (
                                        <><Send size={16} />Submit Report</>
                                    )}
                                </button>
                            </div>

                            {/* Help link */}
                            <div style={{ textAlign:'center', paddingTop:4 }}>
                                <p style={{ fontSize:12,color:'#aaa',fontFamily:"'Lato',sans-serif" }}>
                                    Need help with something else?{' '}
                                    <Link href="/lan/customer-care" style={{ color:NAVY,fontWeight:700,textDecoration:'none' }}>
                                        Contact Customer Care →
                                    </Link>
                                </p>
                            </div>
                        </div>
                    </div>
                </main>

                {/* ══ MOBILE FIXED BOTTOM ACTION BAR ══ */}
                <div className="rp-mobile-actions">
                    {/* Progress indicator */}
                    <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:12 }}>
                        <div style={{ flex:1, height:3, background:'#e5ddd0', borderRadius:2, overflow:'hidden' }}>
                            <div style={{
                                height:'100%',
                                width: !formData.reason ? '0%' : formData.details.trim().length < 10 ? '50%' : '100%',
                                background: canSubmit ? '#16a34a' : GOLD,
                                transition:'width .3s, background .3s',
                                borderRadius:2,
                            }} />
                        </div>
                        <span style={{ fontSize:10,fontWeight:700,color:'#aaa',fontFamily:"'Lato',sans-serif",whiteSpace:'nowrap' }}>
                            {!formData.reason ? 'Select a reason' : formData.details.trim().length < 10 ? 'Add details' : 'Ready to submit'}
                        </span>
                    </div>

                    <div style={{ display:'flex', gap:10 }}>
                        <button className="rp-cancel" onClick={() => router.back()} style={{ flex:'0 0 90px', padding:'14px 0' }}>
                            Cancel
                        </button>
                        <button
                            className="rp-submit"
                            onClick={handleSubmit}
                            disabled={!canSubmit}
                            style={{ flex:1 }}
                        >
                            {submitting ? (
                                <>
                                    <div style={{ width:16,height:16,border:'2px solid rgba(255,255,255,.3)',borderTopColor:'#fff',borderRadius:'50%',animation:'spin .7s linear infinite' }} />
                                    Submitting…
                                </>
                            ) : (
                                <><Send size={15} />Submit Report</>
                            )}
                        </button>
                    </div>
                </div>

                {/* ── Footer strip ── */}
                <section className="crest-bg" style={{ padding:'56px 24px',textAlign:'center' }} >
                    <div style={{ display:'flex',alignItems:'center',justifyContent:'center',gap:16,marginBottom:20 }}>
                        <div style={{ height:1,width:60,background:'rgba(184,150,62,0.4)' }} />
                        <AlertTriangle size={13} style={{ color:GOLD }} />
                        <div style={{ height:1,width:60,background:'rgba(184,150,62,0.4)' }} />
                    </div>
                    <h3 className="rp-serif" style={{ fontSize:22,fontWeight:700,color:'#fff',margin:'0 0 10px' }}>
                        Keeping LAN Library Safe
                    </h3>
                    <p style={{ fontSize:13,color:'rgba(255,255,255,0.45)',maxWidth:480,margin:'0 auto',lineHeight:1.75,fontWeight:300,fontFamily:"'Lato',sans-serif", marginbottom: "20px" }}>
                        Your reports help us maintain quality and integrity across 90M+ documents.
                        Thank you for being part of the community.
                    </p>
                </section>
            </div>
        </>
    );
}