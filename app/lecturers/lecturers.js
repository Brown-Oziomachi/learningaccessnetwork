"use client";
import React, { useState, useEffect } from 'react';
import {
    ArrowLeft, BookOpen, ChevronRight, Search, GraduationCap,
    BookMarked, CheckCircle2, UserPlus, UserCheck, Users, X,
    SlidersHorizontal, TrendingUp, Star, Sparkles, ArrowRight,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    collection, getDocs, query, where, deleteDoc,
    setDoc, doc, getDoc, updateDoc, increment, serverTimestamp
} from 'firebase/firestore';
import { auth, db } from "@/lib/firebaseConfig";
import Navbar from '@/components/NavBar';
import Footer from '@/components/FooterComp';
import { onAuthStateChanged } from "firebase/auth";

/* ─── design tokens (match homepage) ─────────────────────── */
const NAVY  = "#0d2244";
const GOLD  = "#b8963e";
const GOLDD = "#d4aa5a";
const CREAM = "#f5f0e8";
const BG    = "#f5f1ea";

/* ─── avatar palettes ─────────────────────────────────────── */
const avatarPalettes = [
    { bg: "#0d2244", text: "#d4aa5a" },
    { bg: "#1a3a5c", text: "#f5f0e8" },
    { bg: "#2c1810", text: "#d4aa5a" },
    { bg: "#1a2c1a", text: "#a8d5a2" },
    { bg: "#2c1a2c", text: "#d4aa5a" },
    { bg: "#0a2233", text: "#7eccd4" },
];
const getPalette = (name) => avatarPalettes[name.charCodeAt(0) % avatarPalettes.length];
const getInitials = (name) => {
    const parts = name.trim().split(' ').filter(Boolean);
    if (parts.length === 0) return '?';
    if (parts.length === 1) return parts[0][0].toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

/* ═══════════════════════════════════════════════════════════
   LECTURER CARD — editorial book-cover style
═══════════════════════════════════════════════════════════ */
function LecturerCard({ lecturer, isFollowing, onFollow, user }) {
    const palette   = getPalette(lecturer.sellerName || "?");
    const initials  = getInitials(lecturer.sellerName || "?");
    const titleDisplay = lecturer.title?.toLowerCase().includes("lecturer")
        ? "Lecturer" : lecturer.title;
    const profileHref = `/profile/${lecturer.slug || lecturer.sellerId}`;
    const displayName  = lecturer.title
        ? `${lecturer.title} ${lecturer.sellerName}` : lecturer.sellerName;

    return (
        <>
            <style>{`
              .lec-card {
                background:#fff; border:0.5px solid #e5ddd0;
                overflow:hidden; text-decoration:none; display:block;
                transition:transform .25s cubic-bezier(.4,0,.2,1),
                           box-shadow .25s, border-color .25s;
              }
              .lec-card:hover {
                transform:translateY(-6px);
                box-shadow:0 20px 48px rgba(13,34,68,.12);
                border-color:${GOLD};
              }
              .lec-card:hover .lec-img { transform:scale(1.06); }
              .lec-img { transition:transform .6s cubic-bezier(.4,0,.2,1); }
              .follow-btn {
                width:32px; height:32px; border:0.5px solid rgba(255,255,255,.35);
                background:rgba(13,34,68,.55); backdrop-filter:blur(4px);
                border-radius:50%; display:flex; align-items:center;
                justify-content:center; cursor:pointer;
                transition:background .18s, border-color .18s;
              }
              .follow-btn:hover  { background:${GOLD}; border-color:${GOLD}; }
              .follow-btn.active { background:#16a34a; border-color:#16a34a; }
            `}</style>

            <div className="lec-card">
                {/* ── Photo / avatar ── */}
                <div style={{ position:"relative" }}>
                    {lecturer.photo ? (
                        <img src={lecturer.photo} alt={lecturer.sellerName}
                            className="lec-img"
                            style={{ width:"100%", aspectRatio:"4/3", objectFit:"cover", objectPosition:"top", display:"block" }} />
                    ) : (
                        <div style={{ width:"100%", aspectRatio:"4/3", background:palette.bg, display:"flex", alignItems:"center", justifyContent:"center" }}>
                            <span style={{ color:palette.text, fontSize:"40px", fontFamily:"'Playfair Display', serif", fontWeight:900 }}>{initials}</span>
                        </div>
                    )}

                    {/* scrim */}
                    <div style={{ position:"absolute", bottom:0, inset:"auto 0 0", height:"64px", background:"linear-gradient(to top,rgba(13,34,68,.6),transparent)", pointerEvents:"none" }} />

                    {/* Title badge */}
                    {lecturer.title && (
                        <div style={{ position:"absolute", bottom:"8px", left:"8px", background:NAVY, color:GOLDD, fontSize:"10px", fontWeight:700, letterSpacing:"0.1em", textTransform:"uppercase", padding:"4px 10px", fontFamily:"'Lato',sans-serif", display:"flex", alignItems:"center", gap:"4px" }}>
                            <GraduationCap size={9} />
                            {titleDisplay}
                        </div>
                    )}

                    {/* Verified badge */}
                    {lecturer.isVerified && (
                        <div style={{ position:"absolute", top:"8px", left:"8px", background:"#fff", color:NAVY, fontSize:"9px", fontWeight:700, padding:"3px 8px", fontFamily:"'Lato',sans-serif", display:"flex", alignItems:"center", gap:"4px", letterSpacing:"0.08em" }}>
                            <CheckCircle2 size={9} style={{ color:"#2563eb" }} /> VERIFIED
                        </div>
                    )}

                    {/* Follow button */}
                    <button
                        onClick={(e) => { e.preventDefault(); onFollow(e, lecturer.sellerId, lecturer.sellerName); }}
                        className={`follow-btn${isFollowing ? " active" : ""}`}
                        style={{ position:"absolute", top:"8px", right:"8px" }}
                        title={isFollowing ? "Unfollow" : "Follow"}
                    >
                        {isFollowing
                            ? <UserCheck size={13} color="#fff" />
                            : <UserPlus  size={13} color="#fff" />}
                    </button>
                </div>

                {/* ── Card body ── */}
                <div style={{ padding:"14px 14px 16px" }}>
                    <Link href={profileHref} style={{ textDecoration:"none" }}>
                        <h3 style={{ fontFamily:"'Playfair Display', serif", fontSize:"14px", fontWeight:700, color:NAVY, margin:"0 0 6px", lineHeight:1.3, display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical", overflow:"hidden" }}>
                            {displayName}
                        </h3>
                    </Link>

                    <div style={{ display:"flex", flexDirection:"column", gap:"4px", marginBottom:"12px" }}>
                        {lecturer.department && (
                            <p style={{ fontSize:"11px", color:"#888", display:"flex", alignItems:"center", gap:"5px", margin:0, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", fontFamily:"'Lato',sans-serif" }}>
                                <BookMarked size={9} style={{ color:GOLD, flexShrink:0 }} />
                                {lecturer.department}
                            </p>
                        )}
                        {lecturer.university && (
                            <p style={{ fontSize:"11px", color:"#888", display:"flex", alignItems:"center", gap:"5px", margin:0, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", fontFamily:"'Lato',sans-serif" }}>
                                <GraduationCap size={9} style={{ color:GOLD, flexShrink:0 }} />
                                {lecturer.university}
                            </p>
                        )}
                    </div>

                    <div style={{ borderTop:`0.5px solid #f0ebe0`, paddingTop:"12px", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                        <span style={{ fontSize:"11px", color:"#888", display:"flex", alignItems:"center", gap:"4px", fontFamily:"'Lato',sans-serif" }}>
                            <BookOpen size={10} style={{ color:NAVY }} />
                            <strong style={{ color:NAVY }}>{lecturer.uploadedBooks}</strong> files
                        </span>
                        <Link href={profileHref}
                            style={{ fontSize:"10px", fontWeight:700, color:NAVY, textDecoration:"none", display:"flex", alignItems:"center", gap:"3px", letterSpacing:"0.08em", textTransform:"uppercase", fontFamily:"'Lato',sans-serif" }}>
                            Profile <ChevronRight size={11} />
                        </Link>
                    </div>
                </div>
            </div>
        </>
    );
}

/* ═══════════════════════════════════════════════════════════
   MAIN
═══════════════════════════════════════════════════════════ */
export default function LecturersClient() {
    const router = useRouter();
    const [lecturers, setLecturers]           = useState([]);
    const [filteredLecturers, setFiltered]    = useState([]);
    const [loading, setLoading]               = useState(true);
    const [user, setUser]                     = useState(null);
    const [searchTerm, setSearchTerm]         = useState('');
    const [followingIds, setFollowingIds]     = useState(new Set());
    const [activeFilter, setActiveFilter]     = useState('All');
    const [showFilters, setShowFilters]       = useState(false);

    const filters = ['All', 'Dr.', 'Prof.', 'Engr.', 'Pharm.', 'Barr.', 'Lecturer'];
    
    useEffect(() => {
        const unsub = onAuthStateChanged(auth, (u) => {
            if (u) { setUser(u); fetchFollowing(u.uid); }
            else router.push('/auth/signin');
        });
        return () => unsub();
    }, [router]);

    const fetchFollowing = async (userId) => {
        const q = query(collection(db, "follows"), where("followerId", "==", userId));
        const snap = await getDocs(q);
        setFollowingIds(new Set(snap.docs.map(d => d.data().lecturerId)));
    };

    const handleFollow = async (e, lecturerId, lecturerName) => {
        e.preventDefault();
        if (!user) return;
        const followId  = `${user.uid}_${lecturerId}`;
        const followRef = doc(db, "follows", followId);
        const sellerRef = doc(db, "sellers", lecturerId);
        try {
            if (followingIds.has(lecturerId)) {
                await deleteDoc(followRef);
                try { await updateDoc(sellerRef, { followersCount: increment(-1) }); } catch {}
                followingIds.delete(lecturerId);
            } else {
                await setDoc(followRef, { followerId:user.uid, lecturerId, lecturerName:lecturerName||'', createdAt:serverTimestamp() });
                try { await updateDoc(sellerRef, { followersCount: increment(1) }); }
                catch { await setDoc(sellerRef, { followersCount:1 }, { merge:true }); }
                followingIds.add(lecturerId);
            }
            setFollowingIds(new Set(followingIds));
        } catch (err) { console.error(err); }
    };

   const makeSlug = (title, name) => {
    const full = `${title ? title + " " : ""}${name}`.trim();
    return full
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-");
};

useEffect(() => {
    const fetchLecturers = async () => {
        try {
            setLoading(true);
            const sellersSnap = await getDocs(collection(db, 'sellers'));
            const list = [];
            for (const ds of sellersSnap.docs) {
                const data  = ds.data();
                const title = (data.title || '').toLowerCase();
                if (!['dr.', 'prof.', 'engr.', 'pharm.', 'barr.', 'lecturer'].some(t => title.includes(t))) continue;

                let photo = null;
                try {
                    const ud = await getDoc(doc(db, 'users', ds.id));
                    if (ud.exists()) {
                        const udata = ud.data();
                        photo = udata.photoBase64 || udata.photoURL || udata.profilePicture || null;
                    }
                } catch {}

                const slug = data.slug || makeSlug(data.title, data.sellerName || data.displayName || '');

                // Save slug to Firestore if not already there
                if (!data.slug && slug) {
                    try { await updateDoc(doc(db, "sellers", ds.id), { slug }); } catch {}
                }

                list.push({
                    sellerId: ds.id,
                    sellerName: data.sellerName || data.displayName || 'Unknown',
                    title: data.title || 'Lecturer',
                    department: data.department || '',
                    university: data.university || '',
                    isVerified: data.verifiedSchool || false,
                    uploadedBooks: 0,
                    photo,
                    slug,
                });
            }
            await Promise.all(list.map(async (l) => {
                const bq = query(collection(db, 'advertMyBook'), where('userId','==',l.sellerId), where('status','==','approved'));
                l.uploadedBooks = (await getDocs(bq)).size;
            }));
            list.sort((a, b) => b.uploadedBooks - a.uploadedBooks);
            setLecturers(list);
            setFiltered(list);
        } catch (err) { console.error(err); } finally { setLoading(false); }
    };
    fetchLecturers();
}, []);

    useEffect(() => {
        const q = searchTerm.toLowerCase();
        let res = lecturers.filter(l =>
            l.sellerName?.toLowerCase().includes(q) ||
            l.department?.toLowerCase().includes(q) ||
            l.university?.toLowerCase().includes(q)
        );
        if (activeFilter !== 'All') res = res.filter(l => l.title?.toLowerCase().includes(activeFilter.toLowerCase()));
        setFiltered(res);
    }, [searchTerm, lecturers, activeFilter]);

    /* ── global styles ── */
    const GlobalStyles = () => (
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400&family=Lato:wght@300;400;700&display=swap');
          .lan-root  { font-family:'Lato', sans-serif; background:${BG}; }
          .lan-serif { font-family:'Playfair Display', Georgia, serif; }
          .sbar-none { scrollbar-width:none; -ms-overflow-style:none; }
          .sbar-none::-webkit-scrollbar { display:none; }
          @keyframes slideUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
          .anim-up   { animation:slideUp .5s cubic-bezier(.4,0,.2,1) both; }
          .anim-up-2 { animation:slideUp .5s .1s cubic-bezier(.4,0,.2,1) both; }
          .section-label { font-size:10px; font-weight:700; letter-spacing:.22em; text-transform:uppercase; color:${GOLD}; font-family:'Lato',sans-serif; }
          .filter-pill { font-size:10px; font-weight:700; letter-spacing:.1em; text-transform:uppercase; padding:6px 16px; border:0.5px solid #e5ddd0; cursor:pointer; font-family:'Lato',sans-serif; transition:background .15s, color .15s, border-color .15s; }
          .filter-pill.active { background:${NAVY}; color:#fff; border-color:${NAVY}; }
          .filter-pill:not(.active):hover { background:rgba(13,34,68,.06); border-color:${NAVY}; color:${NAVY}; }
          .search-input { font-family:'Lato',sans-serif; font-size:13px; outline:none; background:${BG}; border:0.5px solid #e5ddd0; color:${NAVY}; }
          .search-input::placeholder { color:#aaa; }
          .search-input:focus { border-color:${GOLD}; }
          .section-link { font-size:12px; font-weight:700; color:${NAVY}; text-decoration:none; display:inline-flex; align-items:center; gap:4px; letter-spacing:.04em; font-family:'Lato',sans-serif; }
          .section-link:hover { color:${GOLD}; }
          .back-btn { color:#888; transition:color .15s; background:none; border:none; cursor:pointer; }
          .back-btn:hover { color:${NAVY}; }
        `}</style>
    );

    /* ── LOADING ── */
    if (loading) return (
        <div className="lan-root" style={{ minHeight:"100vh" }}>
            <GlobalStyles />
            <Navbar />
            {/* hero skeleton */}
            <div style={{ background:NAVY, padding:"56px 24px", borderBottom:`1px solid rgba(184,150,62,.15)` }}>
                <div style={{ maxWidth:"1200px", margin:"0 auto" }}>
                    <div style={{ height:"12px", width:"180px", background:"rgba(255,255,255,.08)", marginBottom:"16px", borderRadius:"2px" }} />
                    <div style={{ height:"40px", width:"320px", background:"rgba(255,255,255,.08)", marginBottom:"12px", borderRadius:"2px" }} />
                    <div style={{ height:"16px", width:"220px", background:"rgba(255,255,255,.06)", borderRadius:"2px" }} />
                </div>
            </div>
            <div style={{ maxWidth:"1200px", margin:"0 auto", padding:"40px 24px" }}>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))", gap:"20px" }}>
                    {Array.from({ length: 8 }).map((_, i) => (
                        <div key={i} style={{ background:"#fff", border:"0.5px solid #e5ddd0" }}>
                            <div style={{ aspectRatio:"4/3", background:"#f0ebe0", animation:"pulse 1.5s infinite" }} />
                            <div style={{ padding:"14px" }}>
                                <div style={{ height:"14px", background:"#f0ebe0", marginBottom:"8px", width:"70%" }} />
                                <div style={{ height:"11px", background:"#f5f1ea", width:"50%" }} />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}`}</style>
        </div>
    );

    const totalFiles = lecturers.reduce((s, l) => s + l.uploadedBooks, 0);

    /* ── RENDER ── */
    return (
        <div className="lan-root" style={{ minHeight:"100vh" }}>
            <GlobalStyles />
            <Navbar />

            {/* ══════════════════════════════════════════════════
                PAGE HERO — navy dot-grid (matches homepage hero)
            ══════════════════════════════════════════════════ */}
            <section style={{
                backgroundColor: NAVY,
                backgroundImage: `radial-gradient(rgba(184,150,62,.07) 1px,transparent 1px), radial-gradient(rgba(255,255,255,.03) 1px,transparent 1px)`,
                backgroundSize: "28px 28px, 14px 14px",
                backgroundPosition: "0 0, 7px 7px",
                padding: "56px 24px 48px",
            }}>
                <div style={{ maxWidth:"1200px", margin:"0 auto" }}>
                    <div style={{ display:"flex", alignItems:"center", gap:"10px", marginBottom:"20px" }}>
                        <button onClick={() => router.back()} className="back-btn">
                            <ArrowLeft size={18} />
                        </button>
                        {/* eyebrow */}
                        <div className="anim-up" style={{ display:"inline-flex", alignItems:"center", gap:"7px", background:"rgba(184,150,62,.14)", border:`1px solid rgba(184,150,62,.3)`, borderRadius:"999px", padding:"6px 14px" }}>
                            <Sparkles size={11} style={{ color:GOLD }} />
                            <span style={{ fontSize:"10px", fontWeight:700, letterSpacing:".14em", textTransform:"uppercase", color:GOLDD, fontFamily:"'Lato',sans-serif" }}>
                                LAN Faculty Directory
                            </span>
                        </div>
                    </div>

                    <h1 className="lan-serif anim-up-2" style={{ fontSize:"clamp(32px,6vw,60px)", fontWeight:900, color:"#fff", lineHeight:1.04, letterSpacing:"-1px", margin:"0 0 16px" }}>
                        Our Faculty<br />
                        <span style={{ color:GOLD, fontStyle:"italic" }}>& Educators.</span>
                    </h1>

                    <p style={{ fontSize:"15px", color:"rgba(245,240,232,.65)", maxWidth:"520px", lineHeight:1.75, margin:"0 0 36px", fontWeight:300, fontFamily:"'Lato',sans-serif" }}>
                        Discover verified educators uploading course materials, past questions and lecture notes for students across Africa.
                    </p>

                    {/* Stats strip */}
                    <div style={{ borderTop:`0.5px solid rgba(184,150,62,.2)`, paddingTop:"0", display:"flex", flexWrap:"wrap" }}>
                        {[
                            { val: lecturers.length,        label: "Educators"   },
                            { val: followingIds.size,       label: "Following"   },
                            { val: totalFiles,              label: "Publications" },
                            { val: lecturers.filter(l => l.isVerified).length, label: "Verified" },
                        ].map(({ val, label }) => (
                            <div key={label} style={{ flex:"1 1 110px", padding:"20px 20px 0", borderRight:`0.5px solid rgba(184,150,62,.12)` }}>
                                <div className="lan-serif" style={{ fontSize:"26px", fontWeight:700, color:"#fff" }}>{val}</div>
                                <div style={{ fontSize:"10px", fontWeight:700, letterSpacing:".1em", textTransform:"uppercase", color:"rgba(184,150,62,.7)", marginTop:"3px", fontFamily:"'Lato',sans-serif" }}>{label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ══════════════════════════════════════════════════
                SEARCH + FILTER BAR
            ══════════════════════════════════════════════════ */}
            <div style={{ background:"#fff", borderBottom:`0.5px solid #e5ddd0`, position:"sticky", top:0, zIndex:40 }}>
                <div style={{ maxWidth:"1200px", margin:"0 auto", padding:"12px 24px", display:"flex", flexWrap:"wrap", gap:"10px", alignItems:"center" }}>
                    {/* search */}
                    <div style={{ flex:1, minWidth:"220px", position:"relative" }}>
                        <Search size={13} style={{ position:"absolute", left:"12px", top:"50%", transform:"translateY(-50%)", color:"#bbb" }} />
                        <input
                            type="text"
                            placeholder="Search by name, department, or university…"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="search-input"
                            style={{ width:"100%", padding:"9px 36px", boxSizing:"border-box" }}
                        />
                        {searchTerm && (
                            <button onClick={() => setSearchTerm('')} style={{ position:"absolute", right:"10px", top:"50%", transform:"translateY(-50%)", background:"none", border:"none", cursor:"pointer", color:"#aaa" }}>
                                <X size={13} />
                            </button>
                        )}
                    </div>

                    {/* filter toggle */}
                    <button
                        onClick={() => setShowFilters(p => !p)}
                        style={{ display:"flex", alignItems:"center", gap:"6px", padding:"9px 16px", border:`0.5px solid ${showFilters ? NAVY : "#e5ddd0"}`, background: showFilters ? NAVY : "transparent", color: showFilters ? "#fff" : "#666", fontSize:"12px", fontWeight:700, letterSpacing:".06em", textTransform:"uppercase", cursor:"pointer", fontFamily:"'Lato',sans-serif", transition:"all .15s" }}
                    >
                        <SlidersHorizontal size={13} />
                        Filter
                        {activeFilter !== 'All' && (
                            <span style={{ background:GOLD, color:NAVY, fontSize:"9px", fontWeight:700, padding:"1px 6px", borderRadius:"999px" }}>1</span>
                        )}
                    </button>

                    <span style={{ fontSize:"12px", color:"#aaa", fontFamily:"'Lato',sans-serif", flexShrink:0 }}>
                        {filteredLecturers.length} result{filteredLecturers.length !== 1 ? 's' : ''}
                    </span>
                </div>

                {/* Filter pills */}
                {showFilters && (
                    <div style={{ borderTop:`0.5px solid #f0ebe0`, padding:"12px 24px", display:"flex", flexWrap:"wrap", gap:"6px", alignItems:"center", maxWidth:"1200px", margin:"0 auto" }}>
                        <span style={{ fontSize:"9px", fontWeight:700, letterSpacing:".18em", textTransform:"uppercase", color:"#bbb", fontFamily:"'Lato',sans-serif", marginRight:"4px" }}>Title</span>
                        {filters.map(f => (
                            <button key={f} onClick={() => setActiveFilter(f)} className={`filter-pill${activeFilter === f ? ' active' : ''}`}>
                                {f}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* ══════════════════════════════════════════════════
                FOLLOWING SECTION
            ══════════════════════════════════════════════════ */}
            {followingIds.size > 0 && filteredLecturers.some(l => followingIds.has(l.sellerId)) && (
                <section style={{ background:"#fff", borderBottom:`0.5px solid #e5ddd0`, padding:"48px 24px" }}>
                    <div style={{ maxWidth:"1200px", margin:"0 auto" }}>
                        <div style={{ display:"flex", alignItems:"flex-end", justifyContent:"space-between", marginBottom:"28px" }}>
                            <div>
                                <p className="section-label" style={{ marginBottom:"6px" }}>Your Network</p>
                                <h2 className="lan-serif" style={{ fontSize:"clamp(22px,3.5vw,34px)", fontWeight:700, color:NAVY, margin:0 }}>
                                    Following
                                    <span style={{ color:GOLD, fontStyle:"italic" }}> ({followingIds.size})</span>
                                </h2>
                            </div>
                            <UserCheck size={20} style={{ color:"#16a34a" }} />
                        </div>

                        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))", gap:"20px" }}>
                            {filteredLecturers
                                .filter(l => followingIds.has(l.sellerId))
                                .map(lecturer => (
                                    <LecturerCard key={lecturer.sellerId} lecturer={lecturer}
                                        isFollowing={true} onFollow={handleFollow} user={user} />
                                ))}
                        </div>
                    </div>
                </section>
            )}

            {/* ══════════════════════════════════════════════════
                ALL FACULTY — cream bg (matches homepage Browse section)
            ══════════════════════════════════════════════════ */}
            <section style={{ background:BG, padding:"64px 24px 80px" }}>
                <div style={{ maxWidth:"1200px", margin:"0 auto" }}>
                    {/* section header */}
                    <div style={{ display:"flex", alignItems:"flex-end", justifyContent:"space-between", marginBottom:"36px", flexWrap:"wrap", gap:"12px" }}>
                        <div>
                            <p className="section-label" style={{ marginBottom:"6px" }}>
                                {followingIds.size > 0 ? "Explore More" : "Explore Faculty"}
                            </p>
                            <h2 className="lan-serif" style={{ fontSize:"clamp(24px,4vw,40px)", fontWeight:700, color:NAVY, margin:"0 0 4px" }}>
                                {followingIds.size > 0 ? "All Faculty" : "Meet Our Educators"}
                            </h2>
                            {/* gold line divider */}
                            <div style={{ display:"flex", alignItems:"center", gap:"10px", marginTop:"12px", maxWidth:"240px" }}>
                                <div style={{ height:"1px", flex:1, background:"rgba(184,150,62,.3)" }} />
                                <div style={{ width:"6px", height:"6px", background:GOLD, transform:"rotate(45deg)", flexShrink:0 }} />
                                <div style={{ height:"1px", flex:1, background:"rgba(184,150,62,.3)" }} />
                            </div>
                        </div>
                        <div style={{ display:"flex", alignItems:"center", gap:"6px" }}>
                            <TrendingUp size={13} style={{ color:GOLD }} />
                            <span style={{ fontSize:"10px", fontWeight:700, letterSpacing:".14em", textTransform:"uppercase", color:GOLD, fontFamily:"'Lato',sans-serif" }}>
                                Sorted by publications
                            </span>
                        </div>
                    </div>

                    {/* Empty state */}
                    {filteredLecturers.filter(l => followingIds.size === 0 || !followingIds.has(l.sellerId)).length === 0 ? (
                        <div style={{ background:"#fff", border:`0.5px solid #e5ddd0`, padding:"80px 24px", textAlign:"center" }}>
                            <div style={{ width:"64px", height:"64px", border:`2px solid #e5ddd0`, transform:"rotate(45deg)", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 20px" }}>
                                <GraduationCap size={24} style={{ color:"#e5ddd0", transform:"rotate(-45deg)" }} />
                            </div>
                            <h3 className="lan-serif" style={{ fontSize:"22px", color:NAVY, marginBottom:"8px" }}>No Faculty Found</h3>
                            <p style={{ fontSize:"13px", color:"#bbb", marginBottom:"16px", fontFamily:"'Lato',sans-serif" }}>
                                Try adjusting your search or filter
                            </p>
                            {searchTerm && (
                                <button onClick={() => setSearchTerm('')}
                                    style={{ fontSize:"12px", fontWeight:700, color:NAVY, background:"none", border:`0.5px solid ${NAVY}`, padding:"8px 20px", cursor:"pointer", fontFamily:"'Lato',sans-serif", letterSpacing:".06em", textTransform:"uppercase" }}>
                                    Clear Search
                                </button>
                            )}
                        </div>
                    ) : (
                        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))", gap:"20px" }}>
                            {filteredLecturers
                                .filter(l => followingIds.size === 0 || !followingIds.has(l.sellerId))
                                .map(lecturer => (
                                    <LecturerCard key={lecturer.sellerId} lecturer={lecturer}
                                        isFollowing={followingIds.has(lecturer.sellerId)}
                                        onFollow={handleFollow} user={user} />
                                ))}
                        </div>
                    )}
                </div>
            </section>

            {/* ══════════════════════════════════════════════════
                CTA BANNER (matches homepage crest-bg style)
            ══════════════════════════════════════════════════ */}
            <section style={{
                backgroundColor: NAVY,
                backgroundImage: `repeating-linear-gradient(45deg,transparent,transparent 12px,rgba(255,255,255,.018) 12px,rgba(255,255,255,.018) 13px),
                                   repeating-linear-gradient(-45deg,transparent,transparent 12px,rgba(255,255,255,.018) 12px,rgba(255,255,255,.018) 13px)`,
                padding:"72px 24px", textAlign:"center"
            }}>
                {/* gold star divider */}
                <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:"14px", marginBottom:"24px" }}>
                    <div style={{ height:"1px", width:"56px", background:"rgba(184,150,62,.4)" }} />
                    <Star size={13} style={{ color:GOLD, fill:GOLD }} />
                    <div style={{ height:"1px", width:"56px", background:"rgba(184,150,62,.4)" }} />
                </div>

                <h2 className="lan-serif" style={{ fontSize:"clamp(26px,5vw,46px)", fontWeight:700, color:"#fff", margin:"0 0 14px" }}>
                    Are you an Educator?
                </h2>
                <p style={{ fontSize:"15px", color:"rgba(255,255,255,.5)", maxWidth:"480px", margin:"0 auto 36px", lineHeight:1.75, fontWeight:300, fontFamily:"'Lato',sans-serif" }}>
                    Join our growing faculty directory. Upload your materials and reach over <strong style={{ color:CREAM }}>2.4 million</strong> students across Africa.
                </p>

                <div style={{ display:"flex", flexWrap:"wrap", gap:"12px", justifyContent:"center" }}>
                    <Link href="/become-seller"
                        style={{ display:"inline-flex", alignItems:"center", gap:"8px", padding:"13px 28px", background:GOLD, color:NAVY, fontSize:"13px", fontWeight:700, textDecoration:"none", fontFamily:"'Lato',sans-serif", letterSpacing:".04em" }}>
                        <GraduationCap size={14} /> Join the Faculty
                    </Link>
                    <Link href="/documents"
                        style={{ display:"inline-flex", alignItems:"center", gap:"8px", padding:"13px 28px", border:`0.5px solid rgba(255,255,255,.2)`, color:CREAM, fontSize:"13px", fontWeight:700, textDecoration:"none", fontFamily:"'Lato',sans-serif", letterSpacing:".04em" }}>
                        <BookOpen size={14} /> Browse Resources
                    </Link>
                </div>
            </section>

            <Footer />
        </div>
    );
}