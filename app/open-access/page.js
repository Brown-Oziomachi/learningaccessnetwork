"use client";
import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { collection, query, where, orderBy, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebaseConfig";
import Navbar from "@/components/NavBar";
import Footer from "@/components/FooterComp";

/* ─── colour tokens ─────────────────────────────────────────── */
const NAVY  = "#0d2244";
const GOLD  = "#b8963e";
const CREAM = "#f5f0e8";
const BG    = "#f0faf4";   /* soft green tint background */
const GREEN      = "#16a34a";
const GREEN_DARK = "#14532d";
const GREEN_MID  = "#166534";
const GREEN_LIGHT = "#86efac";
const GREEN_PALE  = "#dcfce7";

/* ─── helpers ─────────────────────────────────────────────────── */
const getThumbnailUrl = (book) => {
    if (book.driveFileId) return `https://drive.google.com/thumbnail?id=${book.driveFileId}&sz=w400`;
    if (book.embedUrl) {
        const m = book.embedUrl.match(/\/d\/(.*?)\/|\/file\/d\/(.*?)\/|id=(.*?)(&|$)/);
        if (m) { const id = m[1] || m[2] || m[3]; if (id) return `https://drive.google.com/thumbnail?id=${id}&sz=w400`; }
    }
    if (book.pdfUrl?.includes("drive.google.com")) {
        const m = book.pdfUrl.match(/[-\w]{25,}/);
        if (m) return `https://drive.google.com/thumbnail?id=${m[0]}&sz=w400`;
    }
    return book.image || "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400";
};

/* ═══════════════════════════════════════════════
   CONTRIBUTOR AVATAR
═══════════════════════════════════════════════ */
function ContributorAvatar({ contributor, size = 52, showName = false, onClick }) {
    const initials = (contributor.name || "?").split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
    return (
        <button
            onClick={onClick}
            title={contributor.name}
            style={{
                display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
                background: "none", border: "none", cursor: "pointer", padding: 0,
            }}
        >
            <div style={{
                width: size, height: size, borderRadius: "50%",
                border: `2px solid rgba(134,239,172,0.5)`,
                overflow: "hidden", flexShrink: 0,
                background: GREEN_DARK,
                display: "flex", alignItems: "center", justifyContent: "center",
                transition: "border-color 0.18s, transform 0.18s",
            }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = GREEN_LIGHT; e.currentTarget.style.transform = "scale(1.08)"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(134,239,172,0.5)"; e.currentTarget.style.transform = "scale(1)"; }}
            >
                {contributor.photoURL
                    ? <img src={contributor.photoURL} alt={contributor.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={e => { e.target.style.display = "none"; }} />
                    : <span style={{ fontSize: size * 0.35, fontWeight: 700, color: GREEN_LIGHT, fontFamily: "'Lato',sans-serif" }}>{initials}</span>
                }
            </div>
            {showName && (
                <span style={{ fontSize: 10, fontWeight: 700, color: GREEN_LIGHT, fontFamily: "'Lato',sans-serif", letterSpacing: ".04em", maxWidth: 70, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", textAlign: "center" }}>
                    {contributor.name?.split(" ")[0]}
                </span>
            )}
        </button>
    );
}

/* ═══════════════════════════════════════════════
   CONTRIBUTORS MODAL
═══════════════════════════════════════════════ */
function ContributorsModal({ contributors, onClose }) {
    useEffect(() => {
        const handle = e => { if (e.key === "Escape") onClose(); };
        window.addEventListener("keydown", handle);
        return () => window.removeEventListener("keydown", handle);
    }, [onClose]);

    return (
        <div
            onClick={e => { if (e.target === e.currentTarget) onClose(); }}
            style={{
                position: "fixed", inset: 0, zIndex: 9999,
                background: "rgba(5,46,22,0.85)", backdropFilter: "blur(6px)",
                display: "flex", alignItems: "center", justifyContent: "center", padding: 24,
            }}
        >
            <div style={{
                background: "linear-gradient(160deg, #052e16 0%, #14532d 100%)",
                border: "0.5px solid rgba(134,239,172,0.2)",
                maxWidth: 680, width: "100%", maxHeight: "80vh",
                display: "flex", flexDirection: "column",
                boxShadow: "0 40px 80px rgba(0,0,0,0.5)",
            }}>
                {/* Modal header */}
                <div style={{ padding: "24px 28px 20px", borderBottom: "0.5px solid rgba(134,239,172,0.15)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div>
                        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".18em", textTransform: "uppercase", color: GREEN_LIGHT, fontFamily: "'Lato',sans-serif", marginBottom: 4 }}>
                            🌿 Open Access Contributors
                        </div>
                      <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: 22, fontWeight: 700, color: "#fff", margin: 0 }}>
                        {contributors.length} Contributor{contributors.length !== 1 ? "s" : ""}
                    </h2>
                    </div>
                    <button onClick={onClose} style={{ background: "rgba(134,239,172,0.1)", border: "0.5px solid rgba(134,239,172,0.2)", color: GREEN_LIGHT, width: 36, height: 36, borderRadius: "50%", cursor: "pointer", fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
                </div>

                {/* Scrollable list */}
                <div style={{ overflowY: "auto", padding: "20px 28px", scrollbarWidth: "thin", scrollbarColor: "rgba(134,239,172,0.3) transparent" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12 }}>
                        {contributors.map((c, i) => {
                            const hasProfile = c.hasLANAccount && c.slug;
                            const cardInner = (
                                <div style={{
                                    display: "flex", alignItems: "center", gap: 14,
                                    background: "rgba(134,239,172,0.05)", border: "0.5px solid rgba(134,239,172,0.12)",
                                    padding: "14px 16px",
                                    transition: "background 0.18s, border-color 0.18s",
                                    cursor: hasProfile ? "pointer" : "default",
                                }}
                                    onMouseEnter={e => { if (hasProfile) { e.currentTarget.style.background = "rgba(134,239,172,0.1)"; e.currentTarget.style.borderColor = "rgba(134,239,172,0.3)"; }}}
                                    onMouseLeave={e => { e.currentTarget.style.background = "rgba(134,239,172,0.05)"; e.currentTarget.style.borderColor = "rgba(134,239,172,0.12)"; }}
                                >
                                    <div style={{ width: 44, height: 44, borderRadius: "50%", overflow: "hidden", background: GREEN_DARK, flexShrink: 0, border: "1.5px solid rgba(134,239,172,0.35)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                        {c.photoURL
                                            ? <img src={c.photoURL} alt={c.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={e => { e.target.style.display = "none"; }} />
                                            : <span style={{ fontSize: 16, fontWeight: 700, color: GREEN_LIGHT, fontFamily: "'Lato',sans-serif" }}>{(c.name || "?")[0].toUpperCase()}</span>
                                        }
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", fontFamily: "'Lato',sans-serif", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.name || "Anonymous"}</div>
                                        <div style={{ fontSize: 11, color: "rgba(134,239,172,0.6)", fontFamily: "'Lato',sans-serif", marginTop: 2 }}>
                                            {c.bookCount} free document{c.bookCount !== 1 ? "s" : ""} contributed
                                        </div>
                                       {!hasProfile && (
    <div style={{ fontSize: 9, color: "rgba(134,239,172,0.35)", fontFamily: "'Lato',sans-serif", marginTop: 2, letterSpacing: ".06em", textTransform: "uppercase", fontWeight: 700 }}>
        {c.uid ? "External Contributor" : "Anonymous Contributor"}
    </div>
)}
                                    </div>
                                    {hasProfile && (
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={GREEN_LIGHT} strokeWidth="2" style={{ opacity: 0.5, flexShrink: 0 }}>
                                            <path d="M5 12h14M12 5l7 7-7 7" />
                                        </svg>
                                    )}
                                </div>
                            );

                            return hasProfile
                                ? (
                                    <Link key={c.uid || i} href={`/profile/${c.slug}`} style={{ textDecoration: "none" }}>
                                        {cardInner}
                                    </Link>
                                )
                                : (
                                    <div key={c.uid || i}>{cardInner}</div>
                                );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}

/* ═══════════════════════════════════════════════
   BOOK CARD
═══════════════════════════════════════════════ */
function BookCard({ book }) {
    return (
        <Link
            href={`/book/preview?id=${book.firestoreId}`}
            style={{ flexShrink: 0, width: 168, textDecoration: "none", display: "block" }}
            className="oa-book-card"
        >
            <div style={{ position: "relative", background: "#d1fae5", overflow: "hidden" }}>
                <img
                    src={book.image}
                    alt={book.title}
                    className="oa-book-img"
                    style={{ width: "100%", aspectRatio: "3/4", objectFit: "cover", display: "block" }}
                    onError={e => { e.target.src = "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400"; }}
                />
                {/* PDF badge */}
                <div style={{ position: "absolute", top: 8, left: 8, display: "flex", alignItems: "center", gap: 4, background: "rgba(5,46,22,0.85)", padding: "3px 8px" }}>
                    <span style={{ width: 5, height: 5, borderRadius: "50%", background: GREEN_LIGHT, display: "inline-block" }} />
                    <span style={{ fontSize: 9, fontWeight: 700, color: GREEN_LIGHT, fontFamily: "'Lato',sans-serif", letterSpacing: ".1em" }}>PDF</span>
                </div>
                {/* Free badge */}
                <div style={{ position: "absolute", top: 8, right: 8, background: GREEN, color: "#fff", fontSize: 9, fontWeight: 700, padding: "3px 7px", fontFamily: "'Lato',sans-serif", letterSpacing: ".06em", display: "flex", alignItems: "center", gap: 3 }}>
                    🔓 FREE
                </div>
            </div>
            <div style={{ padding: "10px 10px 14px", borderTop: `0.5px solid rgba(22,163,74,0.15)`, background: "#fff" }}>
                <h4 className="oa-book-title" style={{ fontFamily: "'Playfair Display',serif", fontSize: 12, fontWeight: 700, color: NAVY, margin: "0 0 3px", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", lineHeight: 1.35, transition: "color 0.18s" }}>
                    {book.title}
                </h4>
                <p style={{ fontSize: 11, color: "#888", margin: "0 0 8px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontFamily: "'Lato',sans-serif" }}>
                    {book.author}
                </p>
                {book.category && (
                    <span style={{ display: "inline-block", background: GREEN_PALE, border: "0.5px solid rgba(22,163,74,0.3)", color: GREEN_MID, fontSize: 8, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", padding: "3px 7px", fontFamily: "'Lato',sans-serif" }}>
                        {book.category}
                    </span>
                )}
                <div style={{ marginTop: 6, display: "flex", alignItems: "center", gap: 5 }}>
                    <span style={{ width: 5, height: 5, borderRadius: "50%", background: GREEN, display: "inline-block", flexShrink: 0 }} />
                    <span style={{ fontSize: 10, fontWeight: 700, color: GREEN, fontFamily: "'Lato',sans-serif", letterSpacing: ".05em" }}>Open Access</span>
                </div>
            </div>
        </Link>
    );
}

/* ═══════════════════════════════════════════════
   ROW CAROUSEL
═══════════════════════════════════════════════ */
function BookRow({ books, rowIndex, accentColor = GREEN_DARK }) {
    const scrollRef = useRef(null);

    const scroll = (dir) => {
        if (!scrollRef.current) return;
        scrollRef.current.scrollBy({ left: dir * 940, behavior: "smooth" });
    };

    const arrowStyle = {
        position: "absolute", top: "40%", transform: "translateY(-50%)", zIndex: 10,
        width: 34, height: 34, borderRadius: "50%",
        background: accentColor, border: "1px solid rgba(255,255,255,0.18)",
        color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
        boxShadow: `0 4px 14px ${accentColor}55`, transition: "opacity 0.18s, transform 0.18s",
    };

    return (
        <div style={{ position: "relative", marginBottom: 28 }}>
            <button
                onClick={() => scroll(-1)}
                style={{ ...arrowStyle, left: -17 }}
                onMouseEnter={e => { e.currentTarget.style.opacity = "0.82"; e.currentTarget.style.transform = "translateY(-50%) scale(1.07)"; }}
                onMouseLeave={e => { e.currentTarget.style.opacity = "1"; e.currentTarget.style.transform = "translateY(-50%) scale(1)"; }}
            >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M15 18l-6-6 6-6" /></svg>
            </button>
            <div
                ref={scrollRef}
                style={{ display: "flex", gap: 14, overflowX: "auto", paddingBottom: 8, scrollbarWidth: "none", msOverflowStyle: "none" }}
                className="oa-scroll-row"
            >
                {books.map(book => <BookCard key={book.id} book={book} />)}
            </div>
            <button
                onClick={() => scroll(1)}
                style={{ ...arrowStyle, right: -17 }}
                onMouseEnter={e => { e.currentTarget.style.opacity = "0.82"; e.currentTarget.style.transform = "translateY(-50%) scale(1.07)"; }}
                onMouseLeave={e => { e.currentTarget.style.opacity = "1"; e.currentTarget.style.transform = "translateY(-50%) scale(1)"; }}
            >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 18l6-6-6-6" /></svg>
            </button>
        </div>
    );
}

/* ═══════════════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════════════ */

/* ═══════════════════════════════════════════════
   CATEGORY META — icon, colour accent, description
═══════════════════════════════════════════════ */
const CATEGORY_META = {
    "business": {
        icon: "💼", accent: "#b45309",
        bg: "rgba(180,83,9,0.08)",
        description: "Master the language of commerce. These free business documents cover entrepreneurship, management principles, marketing strategy, finance, and organisational behaviour — essential reading for any student building a career in the corporate or startup world.",
    },
    "education": {
        icon: "🎓", accent: "#2563eb",
        bg: "rgba(37,99,235,0.08)",
        description: "Foundations of learning and teaching. Explore curriculum design, pedagogy, educational psychology, and classroom management resources contributed freely by lecturers and educators across Africa.",
    },
    "technology": {
        icon: "💻", accent: "#0891b2",
        bg: "rgba(8,145,178,0.08)",
        description: "Code, systems, and innovation. From programming guides and software engineering notes to networking fundamentals and cybersecurity — these tech documents help you stay ahead in the fastest-moving field on the continent.",
    },
    "science": {
        icon: "🔬", accent: "#059669",
        bg: "rgba(5,150,105,0.08)",
        description: "Explore the natural world through open scholarship. Biology, chemistry, physics, and mathematics resources shared freely by researchers and faculty to support science students at every level.",
    },
    "past questions": {
        icon: "📝", accent: "#7c3aed",
        bg: "rgba(124,58,237,0.08)",
        description: "Your fastest path to exam success. Past questions and model answers from WAEC, NECO, JAMB, Post-UTME, and university examinations — freely compiled so every student walks into the exam hall prepared.",
    },
    "literature": {
        icon: "📖", accent: "#be185d",
        bg: "rgba(190,24,93,0.08)",
        description: "Stories, poetry, and critical thought. African and world literature texts, literary criticism, and language arts resources to sharpen your reading, writing, and analytical skills.",
    },
    "health wellness": {
        icon: "🩺", accent: "#dc2626",
        bg: "rgba(220,38,38,0.08)",
        description: "Knowledge that saves lives and builds wellbeing. Medical notes, nursing guides, public health resources, and wellness education documents contributed by healthcare students and professionals.",
    },
    "history": {
        icon: "🏛️", accent: "#92400e",
        bg: "rgba(146,64,14,0.08)",
        description: "Understand where we come from to know where we are going. African history, colonial studies, world civilisations, and political history texts freely shared for scholars and curious minds alike.",
    },
    "arts culture": {
        icon: "🎨", accent: "#7c3aed",
        bg: "rgba(124,58,237,0.08)",
        description: "Creative expression and cultural heritage. Fine arts, music, theatre, film studies, and cultural theory resources that celebrate Africa's rich creative identity and prepare students for careers in the arts.",
    },
    "personal development": {
        icon: "🌱", accent: "#16a34a",
        bg: "rgba(22,163,74,0.08)",
        description: "Invest in yourself. Leadership guides, productivity frameworks, communication skills, and mindset resources freely shared to help students grow beyond the classroom and into their full potential.",
    },
    "mathematics": {
        icon: "📐", accent: "#0284c7",
        bg: "rgba(2,132,199,0.08)",
        description: "From algebra to calculus, statistics to discrete maths — these freely shared notes, workbooks, and solved problems make mathematics accessible to every student regardless of background.",
    },
    "law": {
        icon: "⚖️", accent: "#1e3a5f",
        bg: "rgba(30,58,95,0.08)",
        description: "Justice, rights, and legal reasoning. Case briefs, statutes, law notes, and legal research documents contributed by law students and faculty across African institutions.",
    },
    "engineering": {
        icon: "⚙️", accent: "#374151",
        bg: "rgba(55,65,81,0.08)",
        description: "Build the infrastructure of tomorrow. Civil, mechanical, electrical, and chemical engineering notes, project reports, and technical guides freely shared to support Africa's next generation of engineers.",
    },
    "economics": {
        icon: "📊", accent: "#0f766e",
        bg: "rgba(15,118,110,0.08)",
        description: "Understand how resources shape societies. Microeconomics, macroeconomics, development economics, and quantitative methods resources to help you analyse and influence the African economy.",
    },
    "religion & spirituality": {
        icon: "🕊️", accent: "#7c3aed",
        bg: "rgba(124,58,237,0.08)",
        description: "Theological manuscripts, sacred texts, sermon notes, and interfaith studies from the LAN Divinity Vault — freely accessible to students of faith traditions and comparative religion worldwide.",
    },
    "general": {
        icon: "📚", accent: "#16a34a",
        bg: "rgba(22,163,74,0.08)",
        description: "A diverse collection of freely shared academic documents spanning multiple disciplines. Browse through to discover resources that match your studies or broaden your intellectual horizons.",
    },
};

/* Category meta lookup — case-insensitive with fallback */
const getCategoryMeta = (cat) => {
    const key = (cat || "general").toLowerCase().trim();
    return CATEGORY_META[key] || CATEGORY_META["general"];
};

export default function OpenAccessPage() {
    const [books, setBooks]               = useState([]);
    const [loading, setLoading]           = useState(true);
    const [search, setSearch]             = useState("");
    const [contributors, setContributors] = useState([]);
    const [freeContributors, setFreeContributors] = useState([]);
    const [showContributorsModal, setShowContributorsModal] = useState(false);
    const [showModal, setShowModal]       = useState(false);

    /* ── Fetch all free books (no limit) ── */
    useEffect(() => {
        (async () => {
            try {
                const q = query(
                    collection(db, "advertMyBook"),
                    where("isFree", "==", true),
                    where("status", "==", "approved"),
                    orderBy("createdAt", "desc")
                    /* ← NO limit() — show everything */
                );
                const snap = await getDocs(q);
                const arr = [];
                const sellerMap = {}; /* uid → { name, photoURL, bookCount } */

                snap.forEach(d => {
                    const data = d.data();
                    if (!data.bookTitle) return;

                    const b = {
                        id: `firestore-${d.id}`, firestoreId: d.id,
                        title: data.bookTitle,
                        author: data.author || "Unknown",
                        category: data.category || "General",
                        department: data.department || "",
                        docType: data.docType || "",
                        driveFileId: data.driveFileId,
                        pdfUrl: data.pdfUrl,
                        embedUrl: data.embedUrl,
                        image: data.coverImage || data.image || null,
                        sellerUid: data.userId || data.sellerUid || null,
                        sellerName: data.author || data.sellerName || "Unknown",
                    };
                    b.image = getThumbnailUrl(b);
                    arr.push(b);

                    /* Aggregate contributor */
                    const uid = b.sellerUid || `anon-${b.sellerName}`;
                    if (!sellerMap[uid]) {
                        sellerMap[uid] = {
                            uid: b.sellerUid,
                            name: b.sellerName,
                            photoURL: data.sellerPhoto || data.uploaderPhoto || null,
                            bookCount: 0,
                        };
                    }
                    sellerMap[uid].bookCount += 1;
                });

                setBooks(arr);

                /* ── Enrich contributors ─────────────────────────────────────────
                   The upload page (AdvertiseClient) always writes:
                     userId   = auth.currentUser.uid
                     sellerName = userData.displayName (from users/{uid})
                   So:
                   • Has a real uid in the doc  → uploaded via LAN → check users/{uid}
                   • uid is null / "anon-*"     → came via external API import → skip
                   We only need ONE read (users/{uid}) per contributor.
                   No sellers collection fetch needed — slug is built from
                   firstName + surname stored in users, matching the SellersClient logic.
                ─────────────────────────────────────────────────────────────────── */
                const makeSlug = (firstName, surname) =>
                    [firstName, surname]
                        .filter(Boolean)
                        .join(" ")
                        .trim()
                        .toLowerCase()
                        .replace(/[^a-z0-9\s-]/g, "")
                        .replace(/\s+/g, "-")
                        .replace(/-+/g, "-") || null;

                const contributorList = Object.values(sellerMap).sort((a, b) => b.bookCount - a.bookCount);

                const enriched = await Promise.all(
                    contributorList.map(async (c) => {
                        /* No real uid = external/API book, never uploaded via LAN */
                       if (!c.uid || c.uid.startsWith("anon-")) {
    return {
        ...c,
        hasLANAccount: false,
        slug: null,
        name: c.name && !c.name.startsWith("anon-") ? c.name : "Anonymous Contributor",
    };
}

                        try {
                            const uSnap = await getDoc(doc(db, "users", c.uid));

                            /* users doc missing = uid was bogus or account deleted */
                            if (!uSnap.exists()) {
                                return { ...c, hasLANAccount: false, slug: null };
                            }

                            const ud = uSnap.data();
                            const firstName = ud.firstName || "";
                            const surname   = ud.surname   || "";
                            const fullName  = (firstName + " " + surname).trim()
                                || ud.displayName || c.name;

                            return {
                                ...c,
                                hasLANAccount: true,
                                slug:     makeSlug(firstName, surname),
                                name:     fullName,
                                photoURL: ud.photoURL || ud.profileImage || c.photoURL || null,
                            };
                        } catch {
                            /* Network / permission error — don't show profile link */
                            return { ...c, hasLANAccount: false, slug: null };
                        }
                    })
                );
                /* Only show contributors who:
                   1. Have a verified LAN account (users doc exists)
                   2. Provably uploaded at least one free book via the platform
                   External/API books (anon-* or missing users doc) are excluded entirely. */
            setContributors(enriched.filter(c => c.bookCount > 0));            
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    /* ── Filter ── */
    const filtered = books.filter(b =>
        b.title.toLowerCase().includes(search.toLowerCase()) ||
        b.author.toLowerCase().includes(search.toLowerCase()) ||
        b.category.toLowerCase().includes(search.toLowerCase())
    );

    const BOOKS_PER_ROW = 10;

    /* ── Visible contributors (first 5) ── */
 const visibleContributors = contributors.slice(0, 6);
const hasMoreContributors = contributors.length > 6;

    return (
        <>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,400&family=Lato:wght@300;400;700&display=swap');

                .oa-root { font-family:'Lato',sans-serif; background:${BG}; min-height:100vh; }
                .oa-serif { font-family:'Playfair Display',Georgia,serif; }

                .oa-book-card:hover .oa-book-title { color:${GREEN} !important; }
                .oa-book-card:hover .oa-book-img { transform:scale(1.05); }
                .oa-book-img { transition:transform 0.45s cubic-bezier(.4,0,.2,1); }

                .oa-scroll-row::-webkit-scrollbar { display:none; }

                @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
                .skeleton { background:#bbf7d0; border-radius:4px; animation:pulse 1.5s ease-in-out infinite; }

                @keyframes fadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
                .fade-up { animation:fadeUp 0.5s cubic-bezier(0.4,0,0.2,1) both; }
            `}</style>

            <div className="oa-root">
                <Navbar />

                {/* ══════════════════════════════════════
                    HERO BANNER
                ══════════════════════════════════════ */}
                <section style={{ position: "relative", overflow: "hidden", padding: "60px 24px 52px", minHeight: 420 }}>
                    {/* BG image */}
                    <img
                        src="/lanstu.png"
                        alt="Students on LAN Library"
                        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "center" }}
                        onError={e => { e.target.src = "/stud2.png"; }}
                    />
                    {/* Deep green overlay */}
                    <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(5,46,22,0.93) 0%, rgba(5,46,22,0.82) 55%, rgba(5,46,22,0.96) 100%)" }} />
                    {/* Dot grid */}
                    <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(rgba(134,239,172,0.07) 1px, transparent 1px)", backgroundSize: "28px 28px" }} />

                    <div style={{ position: "relative", zIndex: 2, maxWidth: 960, margin: "0 auto" }}>

                        {/* Eyebrow */}
                        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(134,239,172,0.1)", border: "1px solid rgba(134,239,172,0.25)", borderRadius: 999, padding: "6px 16px", marginBottom: 20 }}>
                            <span style={{ width: 7, height: 7, borderRadius: "50%", background: GREEN_LIGHT, display: "inline-block" }} />
                            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".14em", textTransform: "uppercase", color: GREEN_LIGHT, fontFamily: "'Lato',sans-serif" }}>Open Access Collection</span>
                        </div>

                        <h1 className="oa-serif" style={{ fontSize: "clamp(36px,6vw,64px)", fontWeight: 900, color: "#fff", lineHeight: 1.05, margin: "0 0 14px", letterSpacing: "-1px" }}>
                            Free for every<br />
                            <span style={{ color: GREEN_LIGHT, fontStyle: "italic" }}>student, always.</span>
                        </h1>

                        <p style={{ fontSize: 15, color: "rgba(220,252,231,0.65)", maxWidth: 540, lineHeight: 1.8, fontWeight: 300, margin: "0 0 28px", fontFamily: "'Lato',sans-serif" }}>
                            A curated collection published freely by LAN lecturers, researchers, and students
                            across Africa. No wallet balance needed — just read.
                        </p>

                        {/* Search */}
                        <div style={{ position: "relative", maxWidth: 480, marginBottom: 20 }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(134,239,172,0.5)" strokeWidth="2"
                                style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)" }}>
                                <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
                            </svg>
                            <input
                                type="text"
                                placeholder="Search by title, author, or category…"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                style={{
                                    width: "100%", padding: "13px 16px 13px 44px",
                                    background: "rgba(134,239,172,0.06)",
                                    border: "0.5px solid rgba(134,239,172,0.2)",
                                    borderRadius: 8, fontSize: 14, color: "#fff",
                                    fontFamily: "'Lato',sans-serif", outline: "none", boxSizing: "border-box",
                                }}
                            />
                        </div>

                        {/* ── CTA: Why contribute / learn more ── */}
                        <div style={{ marginBottom: 36 }}>
                            <Link
                                href="/students/open-access"
                                style={{
                                    display: "inline-flex", alignItems: "center", gap: 10,
                                    background: "rgba(134,239,172,0.12)",
                                    border: "0.5px solid rgba(134,239,172,0.3)",
                                    color: GREEN_LIGHT, padding: "11px 20px",
                                    fontSize: 12, fontWeight: 700, fontFamily: "'Lato',sans-serif",
                                    letterSpacing: ".08em", textTransform: "uppercase",
                                    textDecoration: "none",
                                    transition: "background 0.18s, border-color 0.18s",
                                }}
                                onMouseEnter={e => { e.currentTarget.style.background = "rgba(134,239,172,0.2)"; e.currentTarget.style.borderColor = "rgba(134,239,172,0.55)"; }}
                                onMouseLeave={e => { e.currentTarget.style.background = "rgba(134,239,172,0.12)"; e.currentTarget.style.borderColor = "rgba(134,239,172,0.3)"; }}
                            >
                                <span style={{ fontSize: 15 }}>🌿</span>
                                Why contribute a free book?
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                    <path d="M5 12h14M12 5l7 7-7 7" />
                                </svg>
                            </Link>
                        </div>

                        {/* ── CONTRIBUTORS STRIP ── */}
                        {contributors.length > 0 && (
                            <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 36, flexWrap: "wrap" }}>
                                <div>
                                    <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".14em", textTransform: "uppercase", color: "rgba(134,239,172,0.6)", fontFamily: "'Lato',sans-serif", marginBottom: 8 }}>
                                        Open Access Contributors
                                    </div>
                                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                        {/* Stacked avatars */}
                                        <div style={{ display: "flex" }}>
                                            {visibleContributors.map((c, i) => {
                                                const hasProfile = c.hasLANAccount && c.slug;
                                                const avatarEl = (
                                                    <div style={{
                                                        width: 42, height: 42, borderRadius: "50%",
                                                        border: "2px solid rgba(5,46,22,0.9)",
                                                        overflow: "hidden", background: GREEN_DARK,
                                                        display: "flex", alignItems: "center", justifyContent: "center",
                                                        transition: "transform 0.18s",
                                                        cursor: hasProfile ? "pointer" : "default",
                                                    }}
                                                        onMouseEnter={e => { if (hasProfile) e.currentTarget.style.transform = "scale(1.12) translateY(-3px)"; }}
                                                        onMouseLeave={e => e.currentTarget.style.transform = "scale(1) translateY(0)"}
                                                    >
                                                        {c.photoURL
                                                            ? <img src={c.photoURL} alt={c.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={e => { e.target.style.display = "none"; }} />
                                                            : <span style={{ fontSize: 14, fontWeight: 700, color: GREEN_LIGHT, fontFamily: "'Lato',sans-serif" }}>{(c.name || "?")[0].toUpperCase()}</span>
                                                        }
                                                    </div>
                                                );
                                                const wrapStyle = { marginLeft: i === 0 ? 0 : -12, zIndex: visibleContributors.length - i, display: "block", textDecoration: "none" };
                                                return hasProfile
                                                    ? <Link key={c.uid || i} href={`/profile/${c.slug}`} title={c.name} style={wrapStyle}>{avatarEl}</Link>
                                                    : <div key={c.uid || i} title={c.name} style={{ ...wrapStyle, cursor: "default" }}>{avatarEl}</div>;
                                            })}
                                        </div>

                                        {/* "View all" arrow button */}
                                        {hasMoreContributors && (
                                            <button
                                                onClick={() => setShowModal(true)}
                                                style={{
                                                    display: "flex", alignItems: "center", gap: 6,
                                                    background: "rgba(134,239,172,0.1)", border: "0.5px solid rgba(134,239,172,0.25)",
                                                    color: GREEN_LIGHT, padding: "8px 14px",
                                                    fontSize: 11, fontWeight: 700, fontFamily: "'Lato',sans-serif",
                                                    letterSpacing: ".08em", cursor: "pointer",
                                                    transition: "background 0.18s",
                                                }}
                                                onMouseEnter={e => e.currentTarget.style.background = "rgba(134,239,172,0.18)"}
                                                onMouseLeave={e => e.currentTarget.style.background = "rgba(134,239,172,0.1)"}
                                            >
                                                +{contributors.length - 5} more
                                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                                            </button>
                                        )}

                                      <span style={{ fontSize: 12, color: "rgba(220,252,231,0.4)", fontFamily: "'Lato',sans-serif", fontStyle: "italic" }}>
    {contributors.length} contributor{contributors.length !== 1 ? "s" : ""} —{" "}
    {contributors.filter(c => c.hasLANAccount).length} verified LAN accounts
</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Stats */}
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 32, borderTop: "0.5px solid rgba(134,239,172,0.15)", paddingTop: 24 }}>
                            {[
                                { val: loading ? "…" : books.length, label: "Free Documents" },
                                { val: "0₦",                          label: "Cost to Access" },
                                { val: contributors.length || "…",    label: "Contributors" },
                                { val: "Always",                      label: "Available" },
                            ].map(({ val, label }) => (
                                <div key={label}>
                                    <div className="oa-serif" style={{ fontSize: 26, fontWeight: 700, color: "#fff" }}>{val}</div>
                                    <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", color: "rgba(134,239,172,0.55)", marginTop: 3, fontFamily: "'Lato',sans-serif" }}>{label}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ══════════════════════════════════════
                    GRID / ROWS
                ══════════════════════════════════════ */}
                <section style={{ maxWidth: 1240, margin: "0 auto", padding: "56px 40px" }}>

                    {loading ? (
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px,1fr))", gap: 20 }}>
                            {Array.from({ length: 20 }).map((_, i) => (
                                <div key={i}>
                                    <div className="skeleton" style={{ width: "100%", aspectRatio: "3/4", marginBottom: 10 }} />
                                    <div className="skeleton" style={{ height: 13, width: "80%", marginBottom: 6 }} />
                                    <div className="skeleton" style={{ height: 10, width: "55%" }} />
                                </div>
                            ))}
                        </div>

                    ) : filtered.length === 0 ? (
                        <div style={{ textAlign: "center", padding: "80px 24px" }}>
                            <div className="oa-serif" style={{ fontSize: 22, color: GREEN_DARK, marginBottom: 8 }}>No documents found</div>
                            <p style={{ fontSize: 14, color: "#aaa" }}>Try a different search term, or check back soon.</p>
                        </div>

                    ) : (
                        <>
                            {/* ── Top summary bar ── */}
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 48, flexWrap: "wrap", gap: 12 }}>
                                <div>
                                    <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".22em", textTransform: "uppercase", color: GREEN, marginBottom: 4, fontFamily: "'Lato',sans-serif" }}>
                                        🔓 Free to Read
                                    </p>
                                    <h2 className="oa-serif" style={{ fontSize: "clamp(22px,3vw,32px)", fontWeight: 700, color: GREEN_DARK, margin: 0 }}>
                                        {search ? `Results for "${search}"` : "All Open Access Documents"}
                                    </h2>
                                </div>
                                <span style={{ fontSize: 13, color: "#aaa", fontFamily: "'Lato',sans-serif" }}>
                                    {filtered.length} document{filtered.length !== 1 ? "s" : ""}
                                </span>
                            </div>

                            {/* ── Category sections ── */}
                            {(() => {
                                /* Group books by normalised category */
                                const grouped = {};
                                filtered.forEach(b => {
                                    const cat = (b.category || "General").trim();
                                    if (!grouped[cat]) grouped[cat] = [];
                                    grouped[cat].push(b);
                                });

                                /* Sort categories: most books first */
                                const sortedCats = Object.entries(grouped)
                                    .sort((a, b) => b[1].length - a[1].length);

                                return sortedCats.map(([cat, catBooks], ci) => {
                                    const meta = getCategoryMeta(cat);
                                    /* Split into rows of 10 */
                                    const catRows = [];
                                    for (let i = 0; i < catBooks.length; i += BOOKS_PER_ROW) {
                                        catRows.push(catBooks.slice(i, i + BOOKS_PER_ROW));
                                    }

                                    return (
                                        <div
                                            key={cat}
                                            className="fade-up"
                                            style={{ marginBottom: 64, animationDelay: `${ci * 0.07}s` }}
                                        >
                                            {/* ── Category header ── */}
                                            <div style={{
                                                background: "#fff",
                                                border: "0.5px solid rgba(22,163,74,0.15)",
                                                borderLeft: `4px solid ${meta.accent}`,
                                                padding: "20px 24px",
                                                marginBottom: 24,
                                                display: "flex", flexWrap: "wrap", gap: 16, alignItems: "flex-start",
                                            }}>
                                                {/* Icon */}
                                                <div style={{
                                                    width: 52, height: 52, borderRadius: 12, flexShrink: 0,
                                                    background: meta.bg,
                                                    display: "flex", alignItems: "center", justifyContent: "center",
                                                    fontSize: 24,
                                                }}>
                                                    {meta.icon}
                                                </div>

                                                <div style={{ flex: 1, minWidth: 200 }}>
                                                    <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 4 }}>
                                                        <h3 className="oa-serif" style={{ fontSize: "clamp(16px,2.5vw,22px)", fontWeight: 700, color: GREEN_DARK, margin: 0 }}>
                                                            {cat}
                                                        </h3>
                                                        <span style={{
                                                            background: GREEN_PALE, border: `0.5px solid rgba(22,163,74,0.3)`,
                                                            color: GREEN_MID, fontSize: 10, fontWeight: 700,
                                                            padding: "3px 10px", fontFamily: "'Lato',sans-serif",
                                                            letterSpacing: ".08em", textTransform: "uppercase",
                                                        }}>
                                                            {catBooks.length} doc{catBooks.length !== 1 ? "s" : ""}
                                                        </span>
                                                    </div>
                                                    <p style={{
                                                        fontSize: 13, color: "#666", lineHeight: 1.7,
                                                        fontFamily: "'Lato',sans-serif", margin: 0, maxWidth: 680,
                                                    }}>
                                                        {meta.description}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* ── Rows of 10 ── */}
                                            {catRows.map((rowBooks, ri) => (
                                                <div key={ri}>
                                                    {catRows.length > 1 && (
                                                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                                                            <div style={{ width: 3, height: 14, background: meta.accent, flexShrink: 0 }} />
                                                            <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", color: "#aaa", fontFamily: "'Lato',sans-serif" }}>
                                                                Page {ri + 1}
                                                            </span>
                                                        </div>
                                                    )}
                                                    <BookRow books={rowBooks} rowIndex={ri} accentColor={meta.accent} />
                                                    {ri < catRows.length - 1 && (
                                                        <div style={{ height: 1, background: `linear-gradient(to right, transparent, ${meta.accent}40, transparent)`, margin: "16px 0 28px" }} />
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    );
                                });
                            })()}
                        </>
                    )}
                </section>

                {/* ══════════════════════════════════════
                    WHY CONTRIBUTE BANNER
                ══════════════════════════════════════ */}
                <section style={{ background: "linear-gradient(135deg, #052e16 0%, #14532d 60%, #166534 100%)", borderTop: "0.5px solid rgba(134,239,172,0.15)", padding: "64px 24px" }}>
                    <div style={{ maxWidth: 860, margin: "0 auto", position: "relative" }}>
                        {/* Dot grid */}
                        <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(rgba(134,239,172,0.06) 1px, transparent 1px)", backgroundSize: "22px 22px", pointerEvents: "none" }} />

                        <div style={{ position: "relative", display: "flex", flexWrap: "wrap", gap: 48, alignItems: "center" }}>
                            {/* Left: copy */}
                            <div style={{ flex: "1 1 320px" }}>
                                <div style={{ display: "inline-flex", alignItems: "center", gap: 7, background: "rgba(134,239,172,0.1)", border: "0.5px solid rgba(134,239,172,0.25)", padding: "5px 14px", marginBottom: 18 }}>
                                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: GREEN_LIGHT, display: "inline-block" }} />
                                    <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: ".18em", textTransform: "uppercase", color: GREEN_LIGHT, fontFamily: "'Lato',sans-serif" }}>Open Access Hub</span>
                                </div>

                                <h2 className="oa-serif" style={{ fontSize: "clamp(26px,4vw,40px)", fontWeight: 900, color: "#fff", margin: "0 0 14px", lineHeight: 1.1 }}>
                                    Want your work to<br />
                                    <span style={{ color: GREEN_LIGHT, fontStyle: "italic" }}>reach every student?</span>
                                </h2>

                                <p style={{ fontSize: 14, color: "rgba(220,252,231,0.6)", lineHeight: 1.85, fontWeight: 300, margin: "0 0 28px", fontFamily: "'Lato',sans-serif" }}>
                                    When you upload a free document on LAN Library, it becomes permanently
                                    available to thousands of students across Africa — at no cost to them, ever.
                                    Your lecture notes, past questions, and research can change someone's academic
                                    journey tonight.
                                </p>

                                <Link
                                    href="/students/open-access"
                                    style={{
                                        display: "inline-flex", alignItems: "center", gap: 10,
                                        background: GREEN_LIGHT, color: GREEN_DARK,
                                        padding: "14px 28px",
                                        fontSize: 12, fontWeight: 700, fontFamily: "'Lato',sans-serif",
                                        letterSpacing: ".1em", textTransform: "uppercase",
                                        textDecoration: "none",
                                        transition: "background 0.18s",
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.background = "#a7f3d0"}
                                    onMouseLeave={e => e.currentTarget.style.background = GREEN_LIGHT}
                                >
                                    Learn Why & How to Contribute
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                        <path d="M5 12h14M12 5l7 7-7 7" />
                                    </svg>
                                </Link>
                            </div>

                            {/* Right: 3 reason cards */}
                            <div style={{ flex: "1 1 260px", display: "flex", flexDirection: "column", gap: 14 }}>
                                {[
                                    { icon: "🌍", title: "Pan-African Reach", body: "Your document becomes searchable and downloadable by students at every LAN-affiliated institution across Africa." },
                                    { icon: "🏅", title: "Recognition as a Contributor", body: "Your name and profile appear in the Open Access Hub as a featured knowledge sharer — permanently." },
                                    { icon: "📈", title: "Build Your Academic Reputation", body: "Free uploads earn visibility, downloads, and feedback that strengthen your standing in the academic community." },
                                ].map(({ icon, title, body }) => (
                                    <div key={title} style={{ background: "rgba(134,239,172,0.05)", border: "0.5px solid rgba(134,239,172,0.12)", padding: "16px 18px", display: "flex", gap: 14, alignItems: "flex-start" }}>
                                        <span style={{ fontSize: 22, flexShrink: 0, lineHeight: 1 }}>{icon}</span>
                                        <div>
                                            <div style={{ fontSize: 12, fontWeight: 700, color: "#fff", fontFamily: "'Lato',sans-serif", marginBottom: 4 }}>{title}</div>
                                            <div style={{ fontSize: 11, color: "rgba(220,252,231,0.5)", fontFamily: "'Lato',sans-serif", lineHeight: 1.7 }}>{body}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                <Footer />
            </div>

            {/* ── CONTRIBUTORS MODAL ── */}
            {showModal && (
                <ContributorsModal
                    contributors={contributors}
                    onClose={() => setShowModal(false)}
                />
            )}
        </>
    );
}