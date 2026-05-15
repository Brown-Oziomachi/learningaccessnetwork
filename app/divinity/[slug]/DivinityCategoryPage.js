"use client";
/**
 * DivinityCategoryPage
 * ────────────────────
 * Mounted at:  /divinity/:subCategory
 * Examples  :  /divinity/christian-theology
 *              /divinity/islamic-studies
 *              /divinity/comparative-religion
 *              /divinity/sacred-texts
 *
 * Flow
 *  1. useParams() reads the URL slug  →  "christian-theology"
 *  2. getCategoryBySlug() resolves it  →  full category object
 *  3. getFirestoreTag() gives the DB value  →  "christian_theology"
 *  4. Firestore query fetches matching approved religious documents
 *  5. Page renders with category branding + document grid
 */

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";   // Next 13 app-router
import Link from "next/link";
import {
    ArrowLeft, ArrowRight, BookOpen, Search,
    ScrollText, Star, Upload,
} from "lucide-react";
import {
    collection, query, where, orderBy, limit, getDocs,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { db, auth } from "@/lib/firebaseConfig";

import Navbar from "@/components/NavBar";
import Footer from "@/components/FooterComp";

import {
    getCategoryBySlug,
    getFirestoreTag,
    THEO_CATEGORIES,
    divinityPath,
} from "@/lib/divinitySlugUtils";   // ← adjust import path to match your project

/* ─── Palette (keep in sync with DivinityClient) ── */
const NAVY = "#0d2244";
const GOLD = "#b38b59";
const GOLDD = "#c9a96e";
const CREAM = "#f5f0e6";
const PARCH = "#ede5d8";
const SMOKE = "#8a7f74";

/* ════════════════════════════════════════════════════════════════ */
export default function DivinityCategoryClient() {
    const params = useParams();
    const router = useRouter();
    const subCategory = params?.slug ?? "";

    /* ── Resolve slug → category data ── */
    const category = getCategoryBySlug(subCategory);      // null if slug not found
    const firestoreTag = getFirestoreTag(subCategory);       // e.g. "islamic_studies"

    /* ── State ── */
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [user, setUser] = useState(null);
    const [notFound, setNotFound] = useState(false);

    /* ── Auth listener ── */
    useEffect(() => {
        const unsub = onAuthStateChanged(auth, (u) => setUser(u));
        return unsub;
    }, []);

    /* ── Guard: redirect bad slugs to browse page ── */
    useEffect(() => {
        if (!subCategory) return;
        if (!category) {
            // Give it a tick so SSR hydration is stable, then redirect
            const t = setTimeout(() => router.replace("/divinity/religious-archive"), 0);
            return () => clearTimeout(t);
        }
    }, [category, subCategory, router]);

    /* ── Firestore fetch ── */
    useEffect(() => {
        if (!firestoreTag) return;

        const fetchDocs = async () => {
            setLoading(true);
            try {
                /*
                 * Query pattern:
                 *   status            == "approved"
                 *   isReligiousDocument == true           ← isolates from university docs
                 *   theologicalCategory == firestoreTag   ← e.g. "islamic_studies"
                 *   order by createdAt desc, cap at 48
                 */
                const q = query(
                    collection(db, "advertMyBook"),
                    where("status", "==", "approved"),
                    where("isReligiousDocument", "==", true),
                    where("theologicalCategory", "==", firestoreTag),
                    orderBy("createdAt", "desc"),
                    limit(48),
                );
                const snap = await getDocs(q);
                const docs = [];
                snap.forEach((d) => {
                    const data = d.data();
                    if (data.bookTitle) docs.push({ id: d.id, ...data });
                });
                setDocuments(docs);
            } catch (err) {
                console.error("Firestore error:", err);
                setDocuments([]);
            } finally {
                setLoading(false);
            }
        };

        fetchDocs();
    }, [firestoreTag]);

    /* ── Client-side search filter ── */
    const filtered = documents.filter((doc) => {
        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        return (
            (doc.bookTitle || "").toLowerCase().includes(q) ||
            (doc.author || "").toLowerCase().includes(q)
        );
    });

    /* ── Thumbnail helper ── */
    const getThumbnail = (doc) => {
        if (doc.driveFileId)
            return `https://drive.google.com/thumbnail?id=${doc.driveFileId}&sz=w400`;
        return doc.image ||
            "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400";
    };

    /* ── Loading skeleton while category resolves ── */
    if (!category) return null;   // redirect in-flight

    /* ════════════════════════════════════════════════════════════════
       RENDER
    ════════════════════════════════════════════════════════════════ */
    return (
        <>
            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,400;1,700&family=EB+Garamond:ital,wght@0,400;0,500;1,400&family=Lato:wght@300;400;700&display=swap');

        .dc-root  { font-family: 'EB Garamond', Georgia, serif; background: ${CREAM}; color: ${NAVY}; }
        .dc-serif { font-family: 'Playfair Display', Georgia, serif; }
        .dc-sans  { font-family: 'Lato', sans-serif; }

        /* hero */
        .dc-hero {
          position: relative; height: 380px; overflow: hidden;
          display: flex; align-items: flex-end;
        }
        .dc-hero-img {
          position: absolute; inset: 0; width: 100%; height: 100%;
          object-fit: cover; transform: scale(1.04);
          transition: transform 8s ease;
        }
        .dc-hero-img.loaded { transform: scale(1); }

        /* book cards */
        .dc-book {
          background: #fff; border: 0.5px solid #ddd5c8;
          text-decoration: none; display: block;
          transition: box-shadow 0.2s, border-color 0.2s;
        }
        .dc-book:hover { box-shadow: 0 10px 32px rgba(13,34,68,0.14); border-color: ${GOLD}; }
        .dc-book:hover .dc-cover-img { opacity: 0.88; transform: scale(1.03); }
        .dc-cover-img { transition: opacity 0.3s, transform 0.5s; }

        /* filter tabs */
        .dc-tab {
          font-family: 'Lato', sans-serif; font-size: 10px; font-weight: 700;
          letter-spacing: 0.12em; text-transform: uppercase;
          padding: 8px 16px; border: 0.5px solid #ddd5c8; cursor: pointer;
          background: transparent; color: ${SMOKE};
          transition: all 0.15s;
        }
        .dc-tab.active { background: ${NAVY}; color: #fff; border-color: ${NAVY}; }
        .dc-tab:not(.active):hover { border-color: ${NAVY}; color: ${NAVY}; }

        @keyframes shimmer { 0%,100% { opacity:.55; } 50% { opacity:1; } }
        .dc-shimmer { animation: shimmer 1.8s infinite; }

        @keyframes fadeUp { from { opacity:0; transform:translateY(18px); } to { opacity:1; transform:translateY(0); } }
        .dc-fade { animation: fadeUp 0.55s ease both; }
      `}</style>

            <Navbar />

            <div className="dc-root min-h-screen">

                {/* ── HERO BANNER ─────────────────────────────────────────── */}
                <div className="dc-hero">
                    <img
                        src={category.image}
                        alt={category.label}
                        className="dc-hero-img"
                        onLoad={(e) => e.currentTarget.classList.add("loaded")}
                    />
                    {/* gradient overlay */}
                    <div style={{
                        position: "absolute", inset: 0,
                        background: `linear-gradient(to top, ${category.color}f5 0%, ${category.color}99 45%, transparent 100%)`
                    }} />
                    {/* vignette */}
                    <div style={{
                        position: "absolute", inset: 0,
                        background: "radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.4) 100%)"
                    }} />

                    {/* breadcrumb */}
                    <div style={{
                        position: "absolute", top: 0, left: 0, right: 0,
                        padding: "16px 28px", display: "flex", alignItems: "center", gap: 10,
                        borderBottom: "0.5px solid rgba(179,139,89,0.2)"
                    }}>
                        <Link href="/divinity/religious-archive" style={{
                            display: "flex", alignItems: "center", gap: 6,
                            fontFamily: "'Lato',sans-serif", fontSize: 10, fontWeight: 700,
                            letterSpacing: "0.18em", textTransform: "uppercase",
                            color: "rgba(255,255,255,0.55)", textDecoration: "none"
                        }}>
                            <ArrowLeft size={12} /> LAN Divinity
                        </Link>
                        <span style={{ color: "rgba(179,139,89,0.5)", fontSize: 10 }}>›</span>
                        <span style={{
                            fontFamily: "'Lato',sans-serif", fontSize: 10, fontWeight: 700,
                            letterSpacing: "0.18em", textTransform: "uppercase", color: GOLD
                        }}>
                            {category.label}
                        </span>
                    </div>

                    {/* content */}
                    <div style={{ position: "relative", padding: "0 28px 40px", maxWidth: 800 }}>
                        {/* ornament */}
                        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
                            <div style={{ height: "0.5px", width: 32, background: "rgba(179,139,89,0.5)" }} />
                            <Star size={10} style={{ color: GOLD, fill: GOLD }} />
                            <div style={{ height: "0.5px", width: 32, background: "rgba(179,139,89,0.5)" }} />
                        </div>

                        <h1 className="dc-serif" style={{
                            fontSize: "clamp(32px,6vw,60px)", fontWeight: 900,
                            color: "#fff", margin: "0 0 10px", fontStyle: "italic", lineHeight: 1.05
                        }}>
                            {category.label}
                        </h1>
                        <p style={{
                            fontFamily: "'EB Garamond',serif", fontSize: "clamp(15px,2vw,18px)",
                            color: "rgba(245,240,230,0.72)", lineHeight: 1.7,
                            margin: "0 0 20px", maxWidth: 560, fontStyle: "italic"
                        }}>
                            {category.description}
                        </p>

                        {/* sub-discipline chips */}
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
                            {category.sub.map((s) => (
                                <span key={s} style={{
                                    fontFamily: "'Lato',sans-serif", fontSize: 9, fontWeight: 700,
                                    letterSpacing: "0.09em", textTransform: "uppercase",
                                    padding: "4px 10px", border: "0.5px solid rgba(179,139,89,0.45)",
                                    color: GOLD, background: "rgba(0,0,0,0.35)", backdropFilter: "blur(4px)"
                                }}>
                                    {s}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>

                {/* ── SIBLING CATEGORY NAV ──────────────────────────────── */}
                <div style={{
                    background: NAVY, overflowX: "auto",
                    borderBottom: "0.5px solid rgba(179,139,89,0.15)"
                }}>
                    <div style={{
                        display: "flex", minWidth: "max-content",
                        padding: "0 24px"
                    }}>
                        {THEO_CATEGORIES.map((cat) => (
                            <Link
                                key={cat.id}
                                href={divinityPath(cat.slug)}
                                style={{
                                    fontFamily: "'Lato',sans-serif", fontSize: 10, fontWeight: 700,
                                    letterSpacing: "0.14em", textTransform: "uppercase",
                                    padding: "15px 20px", textDecoration: "none", whiteSpace: "nowrap",
                                    color: cat.id === category.id
                                        ? GOLD
                                        : "rgba(255,255,255,0.45)",
                                    borderBottom: cat.id === category.id
                                        ? `1.5px solid ${GOLD}`
                                        : "1.5px solid transparent",
                                    transition: "all 0.15s",
                                }}
                            >
                                {cat.label.split(" ")[0]}
                            </Link>
                        ))}
                    </div>
                </div>

                {/* ── DOCUMENT ARCHIVE ──────────────────────────────────── */}
                <section style={{ padding: "56px 24px", background: "#fff" }}>
                    <div style={{ maxWidth: 1200, margin: "0 auto" }}>

                        {/* header row */}
                        <div style={{
                            display: "flex", alignItems: "flex-end",
                            justifyContent: "space-between",
                            flexWrap: "wrap", gap: 16, marginBottom: 32
                        }}>
                            <div>
                                <p style={{
                                    fontFamily: "'Lato',sans-serif", fontSize: 10, fontWeight: 700,
                                    letterSpacing: "0.24em", textTransform: "uppercase",
                                    color: GOLD, marginBottom: 6
                                }}>
                                    The Archive · {category.label}
                                </p>
                                <h2 className="dc-serif" style={{
                                    fontSize: "clamp(24px,4vw,38px)",
                                    fontWeight: 700, color: NAVY, margin: 0, fontStyle: "italic"
                                }}>
                                    Sacred Documents
                                    {!loading && (
                                        <span style={{
                                            fontFamily: "'Lato',sans-serif", fontSize: 13,
                                            fontWeight: 400, color: SMOKE,
                                            marginLeft: 12, fontStyle: "normal"
                                        }}>
                                            ({documents.length})
                                        </span>
                                    )}
                                </h2>
                            </div>

                            <a href={user ? "/upload-document" : "/auth/signin"} target="_blank" rel="noopener noreferrer"
                                style={{
                                    display: "inline-flex", alignItems: "center", gap: 8,
                                    padding: "11px 22px", background: NAVY, color: "#fff",
                                    fontFamily: "'Lato',sans-serif", fontSize: 11, fontWeight: 700,
                                    letterSpacing: "0.1em", textTransform: "uppercase",
                                    border: "none", cursor: "pointer"
                                }}
                            >
                                <Upload size={13} /> Contribute a Text
                            </a>
                        </div>

                        {/* search bar */}
                        <div style={{
                            position: "relative", maxWidth: 480, marginBottom: 36
                        }}>
                            <Search size={13} style={{
                                position: "absolute", left: 12,
                                top: "50%", transform: "translateY(-50%)", color: "#bbb"
                            }} />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder={`Search ${category.label} texts…`}
                                style={{
                                    width: "100%", padding: "10px 12px 10px 34px",
                                    border: "0.5px solid #e0d8ce",
                                    fontFamily: "'EB Garamond',serif", fontSize: 15,
                                    color: NAVY, background: CREAM, outline: "none",
                                    boxSizing: "border-box"
                                }}
                            />
                        </div>

                        {/* grid */}
                        {loading ? (
                            <div style={{
                                display: "grid",
                                gridTemplateColumns: "repeat(auto-fill,minmax(160px,1fr))",
                                gap: 16
                            }}>
                                {Array.from({ length: 12 }).map((_, i) => (
                                    <div key={i} className="dc-shimmer" style={{
                                        aspectRatio: "3/4", background: "#ede8df",
                                        border: "0.5px solid #e5ddd0"
                                    }} />
                                ))}
                            </div>
                        ) : filtered.length === 0 ? (
                            <div style={{
                                textAlign: "center", padding: "80px 24px",
                                background: CREAM, border: "0.5px solid #e5ddd0"
                            }}>
                                <ScrollText
                                    size={44}
                                    style={{ color: "#ddd", margin: "0 auto 16px", display: "block" }}
                                />
                                <h3 className="dc-serif" style={{
                                    fontSize: 22, color: NAVY, marginBottom: 8, fontStyle: "italic"
                                }}>
                                    {searchQuery ? "No matching texts" : "Archive awaiting contributions"}
                                </h3>
                                <p style={{
                                    fontFamily: "'EB Garamond',serif", fontSize: 15,
                                    color: SMOKE, lineHeight: 1.7, marginBottom: 24
                                }}>
                                    {searchQuery
                                        ? `No results for "${searchQuery}" in ${category.label}`
                                        : "Be the first to donate a text to this tradition's archive"}
                                </p>
                                {!searchQuery && (

                                    <a href={user ? "/upload-document" : "/auth/signin"} target="_blank" rel="noopener noreferrer"
                                        style={{
                                            padding: "10px 28px", background: NAVY, color: "#fff",
                                            fontFamily: "'Lato',sans-serif", fontSize: 11, fontWeight: 700,
                                            letterSpacing: "0.1em", border: "none", cursor: "pointer"
                                        }}
                                    >
                                        Upload a Sacred Text
                                    </a>
                                )}
                            </div>
                        ) : (
                            <div
                                className="dc-fade"
                                style={{
                                    display: "grid",
                                    gridTemplateColumns: "repeat(auto-fill,minmax(160px,1fr))",
                                    gap: 18
                                }}
                            >
                                {filtered.map((doc) => (
                                    <Link key={doc.id} href={`/book/preview?id=${doc.id}`} className="dc-book">
                                        {/* cover */}
                                        <div style={{
                                            position: "relative", background: "#ede8df",
                                            aspectRatio: "3/4", overflow: "hidden"
                                        }}>
                                            <img
                                                src={getThumbnail(doc)}
                                                alt={doc.bookTitle}
                                                className="dc-cover-img"
                                                style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                                onError={(e) => {
                                                    e.target.src =
                                                        "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400";
                                                }}
                                            />
                                            {doc.subDiscipline && (
                                                <div style={{
                                                    position: "absolute", bottom: 8, left: 8,
                                                    background: "rgba(13,34,68,0.85)", padding: "3px 8px",
                                                    fontFamily: "'Lato',sans-serif", fontSize: 8,
                                                    fontWeight: 700, color: GOLD,
                                                    letterSpacing: "0.08em", textTransform: "uppercase"
                                                }}>
                                                    {doc.subDiscipline}
                                                </div>
                                            )}
                                        </div>
                                        {/* info */}
                                        <div style={{ padding: "10px 10px 12px", borderTop: "0.5px solid #f0ebe0" }}>
                                            <h4 className="dc-serif" style={{
                                                fontSize: 13, fontWeight: 600, color: NAVY,
                                                margin: "0 0 3px",
                                                display: "-webkit-box",
                                                WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
                                                overflow: "hidden", lineHeight: 1.35
                                            }}>
                                                {doc.bookTitle}
                                            </h4>
                                            <p style={{
                                                fontSize: 11, color: SMOKE, margin: 0,
                                                fontFamily: "'Lato',sans-serif",
                                                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap"
                                            }}>
                                                {doc.author || "Unknown"}
                                            </p>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>
                </section>

                {/* ── RELATED TRADITIONS ───────────────────────────────── */}
                <section style={{
                    padding: "56px 24px", background: PARCH,
                    borderTop: "0.5px solid #ddd5c8"
                }}>
                    <div style={{ maxWidth: 1200, margin: "0 auto" }}>
                        <p style={{
                            fontFamily: "'Lato',sans-serif", fontSize: 10, fontWeight: 700,
                            letterSpacing: "0.24em", textTransform: "uppercase",
                            color: GOLD, marginBottom: 8
                        }}>
                            Explore Other Traditions
                        </p>
                        <h2 className="dc-serif" style={{
                            fontSize: "clamp(22px,3.5vw,36px)",
                            fontWeight: 700, color: NAVY, margin: "0 0 28px", fontStyle: "italic"
                        }}>
                            Continue Your Study
                        </h2>

                        <div style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))",
                            gap: 16
                        }}>
                            {THEO_CATEGORIES
                                .filter((c) => c.id !== category.id)
                                .map((cat) => (
                                    <Link
                                        key={cat.id}
                                        href={divinityPath(cat.slug)}
                                        style={{
                                            display: "block", background: "#fff",
                                            border: "0.5px solid #ddd5c8", textDecoration: "none",
                                            transition: "box-shadow 0.2s, border-color 0.2s",
                                            overflow: "hidden"
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.boxShadow = "0 12px 32px rgba(13,34,68,0.12)";
                                            e.currentTarget.style.borderColor = GOLD;
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.boxShadow = "none";
                                            e.currentTarget.style.borderColor = "#ddd5c8";
                                        }}
                                    >
                                        <div style={{ height: 100, position: "relative", overflow: "hidden" }}>
                                            <img
                                                src={cat.image}
                                                alt={cat.label}
                                                style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                            />
                                            <div style={{
                                                position: "absolute", inset: 0,
                                                background: `linear-gradient(to top, ${cat.color}e0 0%, transparent 100%)`
                                            }} />
                                        </div>
                                        <div style={{ padding: "14px 16px 16px" }}>
                                            <h3 className="dc-serif" style={{
                                                fontSize: 15, fontWeight: 700, color: NAVY,
                                                margin: "0 0 6px", fontStyle: "italic"
                                            }}>
                                                {cat.label}
                                            </h3>
                                            <div style={{
                                                display: "flex", alignItems: "center", gap: 6,
                                                fontFamily: "'Lato',sans-serif", fontSize: 10,
                                                fontWeight: 700, letterSpacing: "0.1em",
                                                textTransform: "uppercase", color: GOLD
                                            }}>
                                                Browse Texts <ArrowRight size={11} />
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                        </div>
                    </div>
                </section>

                <Footer />
            </div>
        </>
    );
}