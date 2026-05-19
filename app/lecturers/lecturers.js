"use client";
import React, { useState, useEffect } from 'react';
import {
    ArrowLeft, BookOpen, ChevronRight, Search, GraduationCap,
    BookMarked, CheckCircle2, UserPlus, UserCheck, X,
    SlidersHorizontal, TrendingUp, Star, Sparkles,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    collection, getDocs, query, where, deleteDoc,
    setDoc, doc, getDoc, updateDoc, increment, serverTimestamp,
} from 'firebase/firestore';
import { auth, db } from "@/lib/firebaseConfig";
import Navbar from '@/components/NavBar';
import { onAuthStateChanged } from "firebase/auth";

/* ─── design tokens ─────────────────────────────────────── */
const NAVY = "#0d2244";
const GOLD = "#b8963e";
const GOLDD = "#d4aa5a";
const CREAM = "#f5f0e8";
const BG = "#f5f1ea";

/* ─── avatar palette ─────────────────────────────────────── */
const PALETTES = [
    { bg: "#0d2244", text: "#d4aa5a" }, { bg: "#1a3a5c", text: "#f5f0e8" },
    { bg: "#2c1810", text: "#d4aa5a" }, { bg: "#1a2c1a", text: "#a8d5a2" },
    { bg: "#2c1a2c", text: "#d4aa5a" }, { bg: "#0a2233", text: "#7eccd4" },
];
const getPalette = (n) => PALETTES[(n || "?").charCodeAt(0) % PALETTES.length];
const getInitials = (n) => {
    const p = (n || "?").trim().split(" ").filter(Boolean);
    return p.length === 1 ? p[0][0].toUpperCase() : (p[0][0] + p[p.length - 1][0]).toUpperCase();
};

const makeSlug = (title, name) =>
    `${title ? title + " " : ""}${name}`.trim()
        .toLowerCase().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-");

/* ═══════════════════════════════════════════════════════════
   GLOBAL STYLES
═══════════════════════════════════════════════════════════ */
const GlobalStyles = () => (
    <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400&family=Lato:wght@300;400;700&display=swap');
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body, .lan-root { font-family: 'Lato', sans-serif; background: ${BG}; }
    .lan-serif { font-family: 'Playfair Display', Georgia, serif; }
    .sbar-none { scrollbar-width: none; -ms-overflow-style: none; }
    .sbar-none::-webkit-scrollbar { display: none; }

    /* ── Animations ── */
    @keyframes fadeUp   { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
    @keyframes pulse    { 0%,100% { opacity:1; } 50% { opacity:.45; } }
    @keyframes shimmer  { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
    .anim-1 { animation: fadeUp .5s cubic-bezier(.4,0,.2,1) both; }
    .anim-2 { animation: fadeUp .5s .08s cubic-bezier(.4,0,.2,1) both; }
    .anim-3 { animation: fadeUp .5s .16s cubic-bezier(.4,0,.2,1) both; }

    /* ── Lecturer card ── */
    .lec-card {
      background: #fff;
      border: 0.5px solid #e5ddd0;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      transition: transform .28s cubic-bezier(.4,0,.2,1),
                  box-shadow .28s, border-color .28s;
    }
    .lec-card:hover {
      transform: translateY(-8px);
      box-shadow: 0 24px 56px rgba(13,34,68,.13);
      border-color: ${GOLD};
    }
    .lec-card:hover .lec-cover { transform: scale(1.07); }
    .lec-cover { transition: transform .65s cubic-bezier(.4,0,.2,1); }

    /* ── Follow btn ── */
    .fol-btn {
      width: 34px; height: 34px; border-radius: 50%;
      border: 1.5px solid rgba(255,255,255,.4);
      background: rgba(13,34,68,.5);
      backdrop-filter: blur(6px);
      display: flex; align-items: center; justify-content: center;
      cursor: pointer; transition: all .18s;
    }
    .fol-btn:hover     { background: ${GOLD};    border-color: ${GOLD};    }
    .fol-btn.following { background: #16a34a;    border-color: #16a34a;    }

    /* ── Search input ── */
    .srch { font-family:'Lato',sans-serif; font-size:13px; outline:none;
      background: ${BG}; border: 0.5px solid #e5ddd0; color:${NAVY};
      width:100%; padding:10px 36px; transition: border-color .15s; }
    .srch:focus { border-color: ${GOLD}; }
    .srch::placeholder { color:#bbb; }

    /* ── Filter pills ── */
    .fpill { font-size:10px; font-weight:700; letter-spacing:.1em;
      text-transform:uppercase; padding:6px 16px; border:0.5px solid #e5ddd0;
      cursor:pointer; font-family:'Lato',sans-serif;
      transition:all .15s; white-space:nowrap; }
    .fpill.on  { background:${NAVY}; color:#fff; border-color:${NAVY}; }
    .fpill:not(.on):hover { border-color:${NAVY}; color:${NAVY}; background:rgba(13,34,68,.04); }

    /* ── Skeleton loader ── */
    .skel {
      background: linear-gradient(90deg,#f0ebe0 25%,#e8e1d6 50%,#f0ebe0 75%);
      background-size: 200% 100%;
      animation: shimmer 1.4s infinite;
    }

    /* ── CTA section ── */
    .cta-btn-primary {
      display:inline-flex; align-items:center; gap:8px;
      padding:14px 30px; background:${GOLD}; color:${NAVY};
      font-size:13px; font-weight:700; font-family:'Lato',sans-serif;
      letter-spacing:.04em; text-decoration:none; transition:background .18s;
    }
    .cta-btn-primary:hover { background:${GOLDD}; }
    .cta-btn-ghost {
      display:inline-flex; align-items:center; gap:8px;
      padding:14px 30px; border:0.5px solid rgba(255,255,255,.25);
      color:${CREAM}; font-size:13px; font-weight:700;
      font-family:'Lato',sans-serif; letter-spacing:.04em; text-decoration:none;
      transition:border-color .18s, background .18s;
    }
    .cta-btn-ghost:hover { border-color:rgba(184,150,62,.5); background:rgba(184,150,62,.07); }

    /* ── Grid ── */
    .lec-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(230px,1fr)); gap:22px; }

    /* ── Responsive ── */
    @media (max-width: 768px) {
      .lec-grid { grid-template-columns:repeat(auto-fill,minmax(160px,1fr)); gap:12px; }
      .hero-text { font-size:clamp(28px,8vw,44px) !important; }
      .stat-strip { flex-wrap:wrap; }
      .stat-item  { flex:1 1 100px; }
    }
    @media (max-width: 480px) {
      .lec-grid { grid-template-columns:repeat(2,1fr); gap:10px; }
    }
  `}</style>
);

/* ═══════════════════════════════════════════════════════════
   SKELETON CARD
═══════════════════════════════════════════════════════════ */
const SkeletonCard = () => (
    <div style={{ background: "#fff", border: "0.5px solid #e5ddd0", overflow: "hidden" }}>
        <div className="skel" style={{ width: "100%", aspectRatio: "3/4" }} />
        <div style={{ padding: "16px" }}>
            <div className="skel" style={{ height: "13px", width: "75%", marginBottom: "8px", borderRadius: "2px" }} />
            <div className="skel" style={{ height: "10px", width: "55%", marginBottom: "6px", borderRadius: "2px" }} />
            <div className="skel" style={{ height: "10px", width: "40%", borderRadius: "2px" }} />
        </div>
    </div>
);

/* ═══════════════════════════════════════════════════════════
   LECTURER CARD
═══════════════════════════════════════════════════════════ */
function LecturerCard({ lecturer, isFollowing, onFollow, user }) {
    const palette = getPalette(lecturer.sellerName || "?");
    const initials = getInitials(lecturer.sellerName || "?");
    const profileHref = `/profile/${lecturer.slug || lecturer.sellerId}`;
    const displayName = lecturer.title
        ? `${lecturer.title} ${lecturer.sellerName}` : lecturer.sellerName;

    return (
        <div className="lec-card">

            {/* ── Cover image / avatar ── */}
            <div style={{ position: "relative", overflow: "hidden" }}>
                {lecturer.photo ? (
                    <img src={lecturer.photo} alt={lecturer.sellerName}
                        className="lec-cover"
                        style={{
                            width: "100%", aspectRatio: "3/4", objectFit: "cover",
                            objectPosition: "center top", display: "block"
                        }} />
                ) : (
                    <div className="lec-cover" style={{
                        width: "100%", aspectRatio: "3/4",
                        background: palette.bg, display: "flex", flexDirection: "column",
                        alignItems: "center", justifyContent: "center", gap: "8px"
                    }}>
                        {/* decorative dot pattern */}
                        <div style={{
                            position: "absolute", inset: 0, opacity: .06,
                            backgroundImage: `radial-gradient(${palette.text} 1px,transparent 1px)`,
                            backgroundSize: "18px 18px"
                        }} />
                        <span style={{
                            color: palette.text, fontSize: "48px",
                            fontFamily: "'Playfair Display',serif", fontWeight: 900,
                            position: "relative", zIndex: 1
                        }}>{initials}</span>
                    </div>
                )}

                {/* Bottom gradient */}
                <div style={{
                    position: "absolute", inset: "auto 0 0",
                    height: "96px", pointerEvents: "none",
                    background: `linear-gradient(to top, rgba(13,34,68,.78) 0%, transparent 100%)`
                }} />

                {/* Title badge — bottom left */}
                {lecturer.title && (
                    <div style={{
                        position: "absolute", bottom: "10px", left: "10px",
                        background: GOLD, color: NAVY, fontSize: "9px", fontWeight: 700,
                        letterSpacing: ".1em", textTransform: "uppercase",
                        padding: "4px 9px", fontFamily: "'Lato',sans-serif",
                        display: "flex", alignItems: "center", gap: "4px"
                    }}>
                        <GraduationCap size={8} />
                        {lecturer.title}
                    </div>
                )}

                {/* Verified badge — top left */}
                {lecturer.isVerified && (
                    <div style={{
                        position: "absolute", top: "10px", left: "10px",
                        background: "#fff", color: "#1d4ed8", fontSize: "9px", fontWeight: 700,
                        padding: "3px 8px", fontFamily: "'Lato',sans-serif",
                        display: "flex", alignItems: "center", gap: "4px", letterSpacing: ".06em"
                    }}>
                        <CheckCircle2 size={9} style={{ color: "#2563eb" }} /> VERIFIED
                    </div>
                )}

                {/* Follow btn — top right */}
                <button onClick={(e) => { e.preventDefault(); onFollow(e, lecturer.sellerId, lecturer.sellerName); }}
                    className={`fol-btn${isFollowing ? " following" : ""}`}
                    style={{ position: "absolute", top: "10px", right: "10px" }}
                    title={isFollowing ? "Unfollow" : "Follow"}>
                    {isFollowing ? <UserCheck size={14} color="#fff" /> : <UserPlus size={14} color="#fff" />}
                </button>

                {/* File count — bottom right */}
                {lecturer.uploadedBooks > 0 && (
                    <div style={{
                        position: "absolute", bottom: "10px", right: "10px",
                        display: "flex", alignItems: "center", gap: "4px",
                        background: "rgba(13,34,68,.75)", padding: "4px 8px"
                    }}>
                        <BookOpen size={9} style={{ color: GOLDD }} />
                        <span style={{
                            fontSize: "10px", fontWeight: 700, color: "#fff",
                            fontFamily: "'Lato',sans-serif"
                        }}>{lecturer.uploadedBooks}</span>
                    </div>
                )}
            </div>

            {/* ── Card body ── */}
            <div style={{
                padding: "14px 14px 16px", flex: 1, display: "flex",
                flexDirection: "column", justifyContent: "space-between"
            }}>
                <div>
                    <Link href={profileHref} style={{ textDecoration: "none" }}>
                        <h3 style={{
                            fontFamily: "'Playfair Display',serif", fontSize: "14px",
                            fontWeight: 700, color: NAVY, margin: "0 0 8px", lineHeight: 1.3,
                            display: "-webkit-box", WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical", overflow: "hidden"
                        }}>
                            {displayName}
                        </h3>
                    </Link>

                    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                        {lecturer.department && (
                            <p style={{
                                fontSize: "11px", color: "#999", margin: 0,
                                display: "flex", alignItems: "center", gap: "5px",
                                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                                fontFamily: "'Lato',sans-serif"
                            }}>
                                <BookMarked size={9} style={{ color: GOLD, flexShrink: 0 }} />
                                {lecturer.department}
                            </p>
                        )}
                        {lecturer.university && (
                            <p style={{
                                fontSize: "11px", color: "#999", margin: 0,
                                display: "flex", alignItems: "center", gap: "5px",
                                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                                fontFamily: "'Lato',sans-serif"
                            }}>
                                <GraduationCap size={9} style={{ color: GOLD, flexShrink: 0 }} />
                                {lecturer.university}
                            </p>
                        )}
                    </div>
                </div>

                {/* Footer row */}
                <div style={{
                    marginTop: "14px", paddingTop: "12px",
                    borderTop: "0.5px solid #f0ebe0",
                    display: "flex", alignItems: "center", justifyContent: "space-between"
                }}>
                    <span style={{
                        fontSize: "10px", color: "#aaa",
                        fontFamily: "'Lato',sans-serif", letterSpacing: ".04em"
                    }}>
                        {lecturer.uploadedBooks} file{lecturer.uploadedBooks !== 1 ? "s" : ""}
                    </span>
                    <Link href={profileHref}
                        style={{
                            fontSize: "10px", fontWeight: 700, color: NAVY,
                            textDecoration: "none", display: "flex", alignItems: "center", gap: "3px",
                            letterSpacing: ".08em", textTransform: "uppercase",
                            fontFamily: "'Lato',sans-serif", transition: "color .15s"
                        }}
                        onMouseEnter={e => e.currentTarget.style.color = GOLD}
                        onMouseLeave={e => e.currentTarget.style.color = NAVY}>
                        View Profile <ChevronRight size={10} />
                    </Link>
                </div>
            </div>
        </div>
    );
}

/* ═══════════════════════════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════════════════════════ */
export default function LecturersClient() {
    const router = useRouter();
    const [lecturers, setLecturers] = useState([]);
    const [filtered, setFiltered] = useState([]);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [followingIds, setFollowingIds] = useState(new Set());
    const [activeFilter, setActiveFilter] = useState('All');
    const [showFilters, setShowFilters] = useState(false);

    const FILTERS = ['All', 'Dr.', 'Prof.', 'Engr.', 'Pharm.', 'Barr.', 'Lecturer'];

    /* ── Auth ── */
    useEffect(() => {
        const unsub = onAuthStateChanged(auth, (u) => {
            if (u) { setUser(u); fetchFollowing(u.uid); }
            else router.push('/auth/signin');
        });
        return () => unsub();
    }, [router]);

    const fetchFollowing = async (uid) => {
        const q = query(collection(db, "follows"), where("followerId", "==", uid));
        const snap = await getDocs(q);
        setFollowingIds(new Set(snap.docs.map(d => d.data().lecturerId)));
    };

    const handleFollow = async (e, lecturerId, lecturerName) => {
        e.preventDefault();
        if (!user) return;
        const followRef = doc(db, "follows", `${user.uid}_${lecturerId}`);
        const sellerRef = doc(db, "sellers", lecturerId);
        const copy = new Set(followingIds);
        try {
            if (copy.has(lecturerId)) {
                await deleteDoc(followRef);
                try { await updateDoc(sellerRef, { followersCount: increment(-1) }); } catch { }
                copy.delete(lecturerId);
            } else {
                await setDoc(followRef, {
                    followerId: user.uid, lecturerId,
                    lecturerName: lecturerName || '', createdAt: serverTimestamp(),
                });
                try { await updateDoc(sellerRef, { followersCount: increment(1) }); }
                catch { await setDoc(sellerRef, { followersCount: 1 }, { merge: true }); }
                copy.add(lecturerId);
            }
            setFollowingIds(copy);
        } catch (err) { console.error(err); }
    };

    /* ── Fetch lecturers ── */
    useEffect(() => {
        const fetch = async () => {
            try {
                setLoading(true);
                const snap = await getDocs(collection(db, 'sellers'));
                const list = [];
                for (const ds of snap.docs) {
                    const data = ds.data();
                    const title = (data.title || '').toLowerCase();
                    if (!['dr.', 'prof.', 'engr.', 'pharm.', 'barr.', 'lecturer'].some(t => title.includes(t))) continue;

                    let photo = null;
                    try {
                        const ud = await getDoc(doc(db, 'users', ds.id));
                        if (ud.exists()) {
                            const u = ud.data();
                            photo = u.photoBase64 || u.photoURL || u.profilePicture || null;
                        }
                    } catch { }

                    const slug = data.slug || makeSlug(data.title || '', data.sellerName || data.displayName || '');
                    if (!data.slug && slug) {
                        try { await updateDoc(doc(db, "sellers", ds.id), { slug }); } catch { }
                    }

                    list.push({
                        sellerId: ds.id,
                        sellerName: data.sellerName || data.displayName || 'Unknown',
                        title: data.title || 'Lecturer',
                        department: data.department || '',
                        university: data.university || '',
                        isVerified: data.verifiedSchool || false,
                        uploadedBooks: 0,
                        photo, slug,
                    });
                }
                await Promise.all(list.map(async (l) => {
                    const bq = query(collection(db, 'advertMyBook'),
                        where('userId', '==', l.sellerId), where('status', '==', 'approved'));
                    l.uploadedBooks = (await getDocs(bq)).size;
                }));
                list.sort((a, b) => b.uploadedBooks - a.uploadedBooks);
                setLecturers(list);
                setFiltered(list);
            } catch (err) { console.error(err); }
            finally { setLoading(false); }
        };
        fetch();
    }, []);

    /* ── Filter ── */
    useEffect(() => {
        const q = searchTerm.toLowerCase();
        let res = lecturers.filter(l =>
            l.sellerName?.toLowerCase().includes(q) ||
            l.department?.toLowerCase().includes(q) ||
            l.university?.toLowerCase().includes(q)
        );
        if (activeFilter !== 'All')
            res = res.filter(l => l.title?.toLowerCase().includes(activeFilter.toLowerCase()));
        setFiltered(res);
    }, [searchTerm, lecturers, activeFilter]);

    const totalFiles = lecturers.reduce((s, l) => s + l.uploadedBooks, 0);
    const following = filtered.filter(l => followingIds.has(l.sellerId));
    const notFollowing = filtered.filter(l => !followingIds.has(l.sellerId));

    /* ════════════════════════════════════════════════════════
       LOADING STATE
    ════════════════════════════════════════════════════════ */
    if (loading) return (
        <div className="lan-root" style={{ minHeight: "100vh" }}>
            <GlobalStyles />
            <Navbar />
            <div style={{
                background: NAVY, padding: "72px 24px 56px",
                backgroundImage: "radial-gradient(rgba(184,150,62,.07) 1px,transparent 1px)",
                backgroundSize: "28px 28px"
            }}>
                <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
                    <div className="skel" style={{ height: "12px", width: "200px", marginBottom: "20px", borderRadius: "2px", background: "rgba(255,255,255,.08)" }} />
                    <div className="skel" style={{ height: "52px", width: "360px", marginBottom: "14px", borderRadius: "2px", background: "rgba(255,255,255,.08)" }} />
                    <div className="skel" style={{ height: "16px", width: "260px", borderRadius: "2px", background: "rgba(255,255,255,.06)" }} />
                </div>
            </div>
            <div style={{ maxWidth: "1200px", margin: "40px auto", padding: "0 24px" }}>
                <div className="lec-grid">
                    {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
                </div>
            </div>
            <style>{`@keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}`}</style>
        </div>
    );

    /* ════════════════════════════════════════════════════════
       MAIN RENDER
    ════════════════════════════════════════════════════════ */
    return (
        <div className="lan-root" style={{ minHeight: "100vh" }}>
            <GlobalStyles />
            <Navbar />

            {/* ══ HERO ══ */}
            <section style={{
                backgroundColor: NAVY,
                backgroundImage: `radial-gradient(rgba(184,150,62,.07) 1px,transparent 1px),
                          radial-gradient(rgba(255,255,255,.03) 1px,transparent 1px)`,
                backgroundSize: "28px 28px, 14px 14px",
                backgroundPosition: "0 0, 7px 7px",
                padding: "64px 24px 0",
                position: "relative", overflow: "hidden",
            }}>
                {/* Decorative watermark */}
                <div style={{
                    position: "absolute", right: "-20px", bottom: "-30px",
                    fontFamily: "'Playfair Display',serif", fontSize: "200px", fontWeight: 900,
                    color: "rgba(255,255,255,.025)", lineHeight: 1, pointerEvents: "none",
                    userSelect: "none", letterSpacing: "-4px"
                }}>LAN</div>

                <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "24px" }}>
                        <button onClick={() => router.back()}
                            style={{
                                background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,.4)",
                                display: "flex", alignItems: "center", flexShrink: 0, transition: "color .15s"
                            }}
                            onMouseEnter={e => e.currentTarget.style.color = "#fff"}
                            onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,.4)"}>
                            <ArrowLeft size={18} />
                        </button>
                        <div className="anim-1" style={{
                            display: "inline-flex", alignItems: "center", gap: "7px",
                            background: "rgba(184,150,62,.14)", border: "1px solid rgba(184,150,62,.3)",
                            borderRadius: "999px", padding: "5px 14px"
                        }}>
                            <Sparkles size={10} style={{ color: GOLD }} />
                            <span style={{
                                fontSize: "9px", fontWeight: 700, letterSpacing: ".18em",
                                textTransform: "uppercase", color: GOLDD, fontFamily: "'Lato',sans-serif"
                            }}>
                                LAN Faculty Directory
                            </span>
                        </div>
                    </div>

                    <h1 className="lan-serif anim-2 hero-text"
                        style={{
                            fontSize: "clamp(36px,6vw,68px)", fontWeight: 900, color: "#fff",
                            lineHeight: 1.0, letterSpacing: "-1px", margin: "0 0 18px"
                        }}>
                        Our Faculty<br />
                        <em style={{ color: GOLD }}>&amp; Educators.</em>
                    </h1>

                    <p className="anim-3" style={{
                        fontSize: "15px", color: "rgba(245,240,232,.6)",
                        maxWidth: "500px", lineHeight: 1.8, margin: "0 0 0",
                        fontWeight: 300, fontFamily: "'Lato',sans-serif"
                    }}>
                        Discover verified educators uploading course materials, past questions, and lecture
                        notes for students across Africa.
                    </p>

                    {/* Stat strip */}
                    <div className="stat-strip" style={{
                        marginTop: "40px",
                        borderTop: "0.5px solid rgba(184,150,62,.2)",
                        display: "flex", flexWrap: "wrap"
                    }}>
                        {[
                            { val: lecturers.length, label: "Educators" },
                            { val: followingIds.size, label: "Following" },
                            { val: totalFiles, label: "Publications" },
                            { val: lecturers.filter(l => l.isVerified).length, label: "Verified" },
                        ].map(({ val, label }) => (
                            <div key={label} className="stat-item"
                                style={{
                                    flex: "1 1 110px", padding: "20px 20px 24px",
                                    borderRight: "0.5px solid rgba(184,150,62,.1)"
                                }}>
                                <div className="lan-serif"
                                    style={{ fontSize: "28px", fontWeight: 700, color: "#fff", lineHeight: 1 }}>
                                    {val.toLocaleString()}
                                </div>
                                <div style={{
                                    fontSize: "9px", fontWeight: 700, letterSpacing: ".18em",
                                    textTransform: "uppercase", color: "rgba(184,150,62,.65)",
                                    marginTop: "5px", fontFamily: "'Lato',sans-serif"
                                }}>{label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ══ STICKY SEARCH + FILTER BAR ══ */}
            <div style={{
                background: "#fff", borderBottom: "0.5px solid #e5ddd0",
                position: "sticky", top: 0, zIndex: 40,
                boxShadow: "0 2px 12px rgba(13,34,68,.06)"
            }}>
                <div style={{
                    maxWidth: "1200px", margin: "0 auto",
                    padding: "12px 24px", display: "flex", flexWrap: "wrap",
                    gap: "10px", alignItems: "center"
                }}>

                    {/* Search */}
                    <div style={{ flex: 1, minWidth: "220px", position: "relative" }}>
                        <Search size={13} style={{
                            position: "absolute", left: "12px", top: "50%",
                            transform: "translateY(-50%)", color: "#bbb"
                        }} />
                        <input type="text" placeholder="Search by name, department, or university…"
                            value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                            className="srch" />
                        {searchTerm && (
                            <button onClick={() => setSearchTerm('')}
                                style={{
                                    position: "absolute", right: "10px", top: "50%",
                                    transform: "translateY(-50%)", background: "none",
                                    border: "none", cursor: "pointer", color: "#aaa"
                                }}>
                                <X size={13} />
                            </button>
                        )}
                    </div>

                    {/* Filter toggle */}
                    <button onClick={() => setShowFilters(p => !p)}
                        style={{
                            display: "flex", alignItems: "center", gap: "6px",
                            padding: "10px 16px",
                            border: `0.5px solid ${showFilters ? NAVY : "#e5ddd0"}`,
                            background: showFilters ? NAVY : "transparent",
                            color: showFilters ? "#fff" : "#666",
                            fontSize: "11px", fontWeight: 700, letterSpacing: ".08em",
                            textTransform: "uppercase", cursor: "pointer",
                            fontFamily: "'Lato',sans-serif", transition: "all .15s",
                            flexShrink: 0
                        }}>
                        <SlidersHorizontal size={12} />
                        Filter
                        {activeFilter !== 'All' && (
                            <span style={{
                                background: GOLD, color: NAVY, fontSize: "9px",
                                fontWeight: 700, padding: "1px 6px", borderRadius: "999px",
                                marginLeft: "2px"
                            }}>1</span>
                        )}
                    </button>

                    <span style={{
                        fontSize: "11px", color: "#bbb",
                        fontFamily: "'Lato',sans-serif", flexShrink: 0
                    }}>
                        {filtered.length} result{filtered.length !== 1 ? 's' : ''}
                    </span>
                </div>

                {/* Filter pills */}
                {showFilters && (
                    <div style={{
                        borderTop: "0.5px solid #f0ebe0", padding: "10px 24px",
                        maxWidth: "1200px", margin: "0 auto",
                        display: "flex", flexWrap: "wrap", gap: "6px", alignItems: "center"
                    }}>
                        <span style={{
                            fontSize: "9px", fontWeight: 700, letterSpacing: ".18em",
                            textTransform: "uppercase", color: "#ccc",
                            fontFamily: "'Lato',sans-serif", marginRight: "6px"
                        }}>Title</span>
                        {FILTERS.map(f => (
                            <button key={f} onClick={() => setActiveFilter(f)}
                                className={`fpill${activeFilter === f ? ' on' : ''}`}>{f}</button>
                        ))}
                    </div>
                )}
            </div>

            {/* ══ FOLLOWING SECTION ══ */}
            {following.length > 0 && (
                <section style={{
                    background: "#fff", borderBottom: "0.5px solid #e5ddd0",
                    padding: "56px 24px"
                }}>
                    <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
                        <div style={{
                            display: "flex", alignItems: "flex-end",
                            justifyContent: "space-between", marginBottom: "32px", flexWrap: "wrap", gap: "12px"
                        }}>
                            <div>
                                <p style={{
                                    fontSize: "9px", fontWeight: 700, letterSpacing: ".22em",
                                    textTransform: "uppercase", color: GOLD,
                                    fontFamily: "'Lato',sans-serif", marginBottom: "6px"
                                }}>Your Network</p>
                                <h2 className="lan-serif"
                                    style={{ fontSize: "clamp(22px,3.5vw,34px)", fontWeight: 700, color: NAVY }}>
                                    Following
                                    <em style={{ color: GOLD, fontStyle: "normal" }}> ({following.length})</em>
                                </h2>
                            </div>
                            <div style={{
                                display: "flex", alignItems: "center", gap: "6px",
                                background: "#f0fdf4", border: "0.5px solid #bbf7d0",
                                padding: "6px 12px"
                            }}>
                                <UserCheck size={13} style={{ color: "#16a34a" }} />
                                <span style={{
                                    fontSize: "11px", fontWeight: 700, color: "#15803d",
                                    fontFamily: "'Lato',sans-serif", letterSpacing: ".04em"
                                }}>
                                    {following.length} active
                                </span>
                            </div>
                        </div>
                        <div className="lec-grid">
                            {following.map(l => (
                                <LecturerCard key={l.sellerId} lecturer={l}
                                    isFollowing onFollow={handleFollow} user={user} />
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* ══ ALL FACULTY ══ */}
            <section style={{ background: BG, padding: "64px 24px 80px" }}>
                <div style={{ maxWidth: "1200px", margin: "0 auto" }}>

                    {/* Section header */}
                    <div style={{
                        display: "flex", alignItems: "flex-end",
                        justifyContent: "space-between", marginBottom: "40px",
                        flexWrap: "wrap", gap: "16px"
                    }}>
                        <div>
                            <p style={{
                                fontSize: "9px", fontWeight: 700, letterSpacing: ".22em",
                                textTransform: "uppercase", color: GOLD,
                                fontFamily: "'Lato',sans-serif", marginBottom: "6px"
                            }}>
                                {following.length > 0 ? "Discover More" : "Explore Faculty"}
                            </p>
                            <h2 className="lan-serif"
                                style={{ fontSize: "clamp(24px,4vw,42px)", fontWeight: 700, color: NAVY }}>
                                {following.length > 0 ? "All Educators" : "Meet Our Educators"}
                            </h2>
                            {/* gold ornament */}
                            <div style={{
                                display: "flex", alignItems: "center",
                                gap: "10px", marginTop: "14px", maxWidth: "200px"
                            }}>
                                <div style={{ height: "1px", flex: 1, background: "rgba(184,150,62,.35)" }} />
                                <div style={{
                                    width: "5px", height: "5px", background: GOLD,
                                    transform: "rotate(45deg)", flexShrink: 0
                                }} />
                                <div style={{ height: "1px", flex: 1, background: "rgba(184,150,62,.35)" }} />
                            </div>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            <TrendingUp size={12} style={{ color: GOLD }} />
                            <span style={{
                                fontSize: "10px", fontWeight: 700, letterSpacing: ".12em",
                                textTransform: "uppercase", color: GOLD, fontFamily: "'Lato',sans-serif"
                            }}>
                                Sorted by publications
                            </span>
                        </div>
                    </div>

                    {/* Empty state */}
                    {notFollowing.length === 0 ? (
                        <div style={{
                            background: "#fff", border: "0.5px solid #e5ddd0",
                            padding: "80px 24px", textAlign: "center"
                        }}>
                            <div style={{
                                width: "64px", height: "64px", border: "2px solid #e5ddd0",
                                transform: "rotate(45deg)", display: "flex", alignItems: "center",
                                justifyContent: "center", margin: "0 auto 20px"
                            }}>
                                <GraduationCap size={24} style={{ color: "#e5ddd0", transform: "rotate(-45deg)" }} />
                            </div>
                            <h3 className="lan-serif"
                                style={{ fontSize: "22px", color: NAVY, marginBottom: "8px" }}>
                                No Educators Found
                            </h3>
                            <p style={{
                                fontSize: "13px", color: "#bbb", marginBottom: "20px",
                                fontFamily: "'Lato',sans-serif"
                            }}>
                                Try adjusting your search or filter
                            </p>
                            {(searchTerm || activeFilter !== 'All') && (
                                <button onClick={() => { setSearchTerm(''); setActiveFilter('All'); }}
                                    style={{
                                        fontSize: "12px", fontWeight: 700, color: NAVY,
                                        background: "none", border: `0.5px solid ${NAVY}`,
                                        padding: "9px 22px", cursor: "pointer", fontFamily: "'Lato',sans-serif",
                                        letterSpacing: ".06em", textTransform: "uppercase"
                                    }}>
                                    Clear Filters
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="lec-grid">
                            {notFollowing.map(l => (
                                <LecturerCard key={l.sellerId} lecturer={l}
                                    isFollowing={followingIds.has(l.sellerId)}
                                    onFollow={handleFollow} user={user} />
                            ))}
                        </div>
                    )}
                </div>
            </section>

            {/* ══ CTA BANNER ══ */}
            <section style={{
                backgroundColor: NAVY, padding: "80px 24px", textAlign: "center",
                backgroundImage: `repeating-linear-gradient(45deg,transparent,transparent 14px,rgba(255,255,255,.015) 14px,rgba(255,255,255,.015) 15px),
                         repeating-linear-gradient(-45deg,transparent,transparent 14px,rgba(255,255,255,.015) 14px,rgba(255,255,255,.015) 15px)` }}>
                <div style={{
                    display: "flex", alignItems: "center", justifyContent: "center",
                    gap: "16px", marginBottom: "28px"
                }}>
                    <div style={{ height: "1px", width: "48px", background: "rgba(184,150,62,.4)" }} />
                    <Star size={12} style={{ color: GOLD, fill: GOLD }} />
                    <div style={{ height: "1px", width: "48px", background: "rgba(184,150,62,.4)" }} />
                </div>
                <h2 className="lan-serif"
                    style={{
                        fontSize: "clamp(28px,5vw,52px)", fontWeight: 700, color: "#fff",
                        margin: "0 0 16px", lineHeight: 1.08
                    }}>
                    Are you an Educator?
                </h2>
                <p style={{
                    fontSize: "15px", color: "rgba(255,255,255,.5)", maxWidth: "460px",
                    margin: "0 auto 40px", lineHeight: 1.8, fontWeight: 300, fontFamily: "'Lato',sans-serif"
                }}>
                    Join our growing faculty directory. Upload your materials and reach students across Africa.
                </p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", justifyContent: "center" }}>
                    <Link href="/become-seller" className="cta-btn-primary">
                        <GraduationCap size={14} /> Join the Faculty
                    </Link>
                    <Link href="/documents" className="cta-btn-ghost">
                        <BookOpen size={14} /> Browse Resources
                    </Link>
                </div>
            </section>

        </div>
    );
}