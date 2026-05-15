"use client";
/**
 * DivinityClient — updated to use centralised slug utilities
 * All category links, filter tabs, and Firestore queries now flow
 * through divinitySlugUtils so slug↔tag mapping is never duplicated.
 *
 * Changes from original:
 *  • Import THEO_CATEGORIES, getFirestoreTag, divinityPath from utils
 *  • Firestore query uses getFirestoreTag(activeCategory) instead of
 *    inline cat.firestoreTag lookup
 *  • Category card hrefs use divinityPath(cat.slug)
 *  • Hero slide hrefs use divinityPath(s.cat)
 */
import React, { useState, useEffect } from "react";
import {
    Search, Upload, ArrowRight, ChevronLeft, ChevronRight,
    BookOpen, Star, Globe, Feather, ScrollText, Cross,
    Moon, Flame, BookMarked, FileText, X,
} from "lucide-react";
import Navbar from "@/components/NavBar";
import Footer from "@/components/FooterComp";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
    collection, query, where, orderBy, limit, getDocs,
    addDoc, serverTimestamp,
} from "firebase/firestore";
import { db, auth } from "@/lib/firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";

// ─── Centralised slug utilities (single source of truth) ──────────────────
import {
    THEO_CATEGORIES,
    getFirestoreTag,
    divinityPath,
} from "@/lib/divinitySlugUtils";   // ← adjust path if needed

/* ─── Palette ── */
const NAVY = "#0d2244";
const GOLD = "#b38b59";
const GOLDD = "#c9a96e";
const CREAM = "#f5f0e6";
const PARCH = "#ede5d8";
const SMOKE = "#8a7f74";

/* ─── Hero slides ── */
const HERO_SLIDES = [
    {
        title: "LAN Divinity",
        subtitle: "The Global Archive for Sacred Texts, Theological Notes, and Faith Studies",
        tag: "Theological Hub",
        image: "https://images.unsplash.com/photo-1519791883288-dc8bd696e667?w=1400",
        accent: "#1a0a2e",
        cat: null,                    // null → /divinity/browse
    },
    {
        title: "Sacred Scriptures",
        subtitle: "Ancient manuscripts and canonical texts from every tradition",
        tag: "Sacred Texts",
        image: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=1400",
        accent: "#140d02",
        cat: "sacred-texts",          // slug
    },
    {
        title: "Islamic Sciences",
        subtitle: "Hadith, Sharia, Arabic grammar and Quranic exegesis",
        tag: "Islamic Studies",
        image: "https://images.unsplash.com/photo-1506157786151-b8491531f063?w=1400",
        accent: "#061a0f",
        cat: "islamic-studies",
    },
    {
        title: "Christian Theology",
        subtitle: "From the Church Fathers to contemporary systematic theology",
        tag: "Christian Theology",
        image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1400",
        accent: "#150a25",
        cat: "christian-theology",
    },
];

/* ════════════════════════════════════════════════════════════════════════ */
export default function DivinityClient() {
    const [slide, setSlide] = useState(0);
    const [activeCategory, setActiveCategory] = useState("all");  // "all" | category.id
    const [searchQuery, setSearchQuery] = useState("");
    const [documents, setDocuments] = useState([]);
    const [loadingDocs, setLoadingDocs] = useState(true);
    const [user, setUser] = useState(null);
    const [showUpload, setShowUpload] = useState(false);
    const router = useRouter();

    /* auth */
    useEffect(() => {
        const unsub = onAuthStateChanged(auth, (u) => setUser(u));
        return unsub;
    }, []);

    /* carousel auto-advance */
    useEffect(() => {
        const t = setInterval(() => setSlide((p) => (p + 1) % HERO_SLIDES.length), 6000);
        return () => clearInterval(t);
    }, [slide]);

    /* ── Firestore fetch ─────────────────────────────────────────────────── */
    useEffect(() => {
        const fetchDocs = async () => {
            try {
                setLoadingDocs(true);

                const constraints = [
                    where("status", "==", "approved"),
                    where("isReligiousDocument", "==", true),
                    orderBy("createdAt", "desc"),
                    limit(24),
                ];

                if (activeCategory !== "all") {
                    /*
                     * getFirestoreTag() maps category.id → the Firestore tag value.
                     * e.g. "islamic" → "islamic_studies"
                     * We insert the where() before the orderBy to satisfy Firestore's
                     * composite-index requirement.
                     */
                    const tag = getFirestoreTag(
                        THEO_CATEGORIES.find((c) => c.id === activeCategory)?.slug ?? ""
                    );
                    if (tag) constraints.splice(2, 0, where("theologicalCategory", "==", tag));
                }

                const q = query(collection(db, "advertMyBook"), ...constraints);
                const snap = await getDocs(q);
                const docs = [];
                snap.forEach((d) => {
                    const data = d.data();
                    if (data.bookTitle) docs.push({ id: d.id, ...data });
                });
                setDocuments(docs);
            } catch (e) {
                console.error(e);
                setDocuments([]);
            } finally {
                setLoadingDocs(false);
            }
        };
        fetchDocs();
    }, [activeCategory]);

    /* client-side search */
    const filtered = documents.filter((doc) =>
        !searchQuery ||
        (doc.bookTitle || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (doc.author || "").toLowerCase().includes(searchQuery.toLowerCase())
    );

    const prevSlide = () => setSlide((p) => (p - 1 + HERO_SLIDES.length) % HERO_SLIDES.length);
    const nextSlide = () => setSlide((p) => (p + 1) % HERO_SLIDES.length);
    const getThumbnail = (doc) => {
        if (doc.driveFileId)
            return `https://drive.google.com/thumbnail?id=${doc.driveFileId}&sz=w400`;
        return doc.image || "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400";
    };

    /* icon map (dynamic import isn't needed; just resolve at render time) */
    const ICON_MAP = { Cross, Moon, Globe, ScrollText };

    return (
        <>
            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;0,900;1,400;1,700&family=EB+Garamond:ital,wght@0,400;0,500;0,600;1,400&family=Lato:wght@300;400;700&display=swap');

        :root {
          --navy: ${NAVY}; --gold: ${GOLD}; --goldd: ${GOLDD};
          --cream: ${CREAM}; --parch: ${PARCH}; --smoke: ${SMOKE};
        }
        .div-root  { font-family: 'EB Garamond', Georgia, serif; background: ${CREAM}; color: ${NAVY}; }
        .div-serif { font-family: 'Playfair Display', Georgia, serif; }
        .div-sans  { font-family: 'Lato', sans-serif; }

        .hero-frame { position: relative; width: 100%; height: 580px; overflow: hidden; background: #050505; }
        @media (max-width: 640px) { .hero-frame { height: 480px; } }
        .hero-slide { position: absolute; inset: 0; opacity: 0; pointer-events: none; transition: opacity 1s ease; }
        .hero-slide.active { opacity: 1; pointer-events: auto; }
        .hero-img { width: 100%; height: 100%; object-fit: cover; transform: scale(1.04); transition: transform 8s ease; }
        .hero-slide.active .hero-img { transform: scale(1); }

        .illuminated { border: 1px solid rgba(179,139,89,0.3); position: relative; }
        .illuminated::before, .illuminated::after {
          content: ""; position: absolute; width: 12px; height: 12px; border: 1px solid ${GOLD};
        }
        .illuminated::before { top: -1px; left: -1px; border-right: none; border-bottom: none; }
        .illuminated::after  { bottom: -1px; right: -1px; border-left: none; border-top: none; }

        .theo-card {
          position: relative; overflow: hidden; cursor: pointer;
          border: 0.5px solid #ddd5c8;
          transition: transform 0.3s cubic-bezier(0.4,0,0.2,1), box-shadow 0.3s, border-color 0.3s;
          text-decoration: none; display: block; background: #fff;
        }
        .theo-card:hover { transform: translateY(-5px); box-shadow: 0 20px 48px rgba(13,34,68,0.14); border-color: ${GOLD}; }
        .theo-card:hover .theo-img { transform: scale(1.06); }
        .theo-img { transition: transform 0.7s cubic-bezier(0.4,0,0.2,1); }

        .book-card {
          background: #fff; border: 0.5px solid #ddd5c8;
          transition: box-shadow 0.2s, border-color 0.2s;
          text-decoration: none; display: block;
        }
        .book-card:hover { box-shadow: 0 10px 32px rgba(13,34,68,0.14); border-color: ${GOLD}; }
        .book-img { transition: opacity 0.3s; }

        .filter-tab {
          font-family: 'Lato', sans-serif; font-size: 10px; font-weight: 700;
          letter-spacing: 0.12em; text-transform: uppercase;
          padding: 9px 18px; border: 0.5px solid transparent; cursor: pointer;
          transition: all 0.18s; background: transparent;
        }
        .filter-tab.active { background: ${NAVY}; color: #fff; border-color: ${NAVY}; }
        .filter-tab:not(.active) { color: ${SMOKE}; border-color: #ddd5c8; }
        .filter-tab:not(.active):hover { border-color: ${NAVY}; color: ${NAVY}; }

        .orn { display: flex; align-items: center; gap: 14px; }
        .orn::before, .orn::after { content:""; flex:1; height:0.5px; background: rgba(179,139,89,0.35); }

        .crosshatch {
          background-color: ${NAVY};
          background-image:
            repeating-linear-gradient(45deg, transparent, transparent 12px, rgba(179,139,89,0.04) 12px, rgba(179,139,89,0.04) 13px),
            repeating-linear-gradient(-45deg, transparent, transparent 12px, rgba(179,139,89,0.04) 12px, rgba(179,139,89,0.04) 13px);
        }
        .modal-overlay {
          position: fixed; inset: 0; z-index: 50;
          background: rgba(5,5,15,0.75); backdrop-filter: blur(4px);
          display: flex; align-items: center; justify-content: center; padding: 24px;
        }
        .modal-box {
          background: ${CREAM}; border: 0.5px solid ${GOLD};
          max-width: 560px; width: 100%; max-height: 90vh; overflow-y: auto;
        }
        @keyframes fadeUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
        .fade-up { animation: fadeUp 0.6s ease both; }
        @keyframes shimmer { 0%,100% { opacity:.6; } 50% { opacity:1; } }
        .shimmer { animation: shimmer 2s infinite; }
      `}</style>

            <Navbar />

            <div className="div-root min-h-screen">

                {/* ══ HERO CAROUSEL ════════════════════════════════════════════ */}
                <div className="hero-frame">
                    {HERO_SLIDES.map((s, i) => (
                        <div key={i} className={`hero-slide ${i === slide ? "active" : ""}`}>
                            <img src={s.image} alt={s.title} className="hero-img" />
                            <div style={{
                                position: "absolute", inset: 0,
                                background: `linear-gradient(to top, ${s.accent}f8 0%, ${s.accent}cc 35%, ${s.accent}55 70%, transparent 100%)`
                            }} />
                            <div style={{
                                position: "absolute", inset: 0,
                                background: "radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.5) 100%)"
                            }} />

                            {/* top ribbon */}
                            <div style={{
                                position: "absolute", top: 0, left: 0, right: 0,
                                borderBottom: "0.5px solid rgba(179,139,89,0.25)",
                                display: "flex", alignItems: "center", justifyContent: "space-between",
                                padding: "14px 28px"
                            }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                    <Flame size={13} style={{ color: GOLD }} />
                                    <span style={{
                                        color: "rgba(255,255,255,0.5)", fontSize: 10, letterSpacing: "0.28em",
                                        textTransform: "uppercase", fontFamily: "'Lato',sans-serif", fontWeight: 700
                                    }}>
                                        LAN Divinity · Theological Archive
                                    </span>
                                </div>
                                <span style={{
                                    color: GOLD, fontSize: 9, letterSpacing: "0.18em",
                                    textTransform: "uppercase", fontFamily: "'Lato',sans-serif", fontWeight: 700,
                                    border: "0.5px solid rgba(179,139,89,0.4)", padding: "3px 10px"
                                }}>
                                    {s.tag}
                                </span>
                            </div>

                            {/* centre content */}
                            <div style={{
                                position: "absolute", inset: 0, display: "flex",
                                alignItems: "center", justifyContent: "center", padding: "0 24px"
                            }}>
                                <div style={{ maxWidth: 760, textAlign: "center" }}>
                                    <div style={{
                                        display: "flex", alignItems: "center", justifyContent: "center",
                                        gap: 12, marginBottom: 20
                                    }}>
                                        <div style={{ height: "0.5px", width: 48, background: "rgba(179,139,89,0.5)" }} />
                                        <Star size={11} style={{ color: GOLD, fill: GOLD }} />
                                        <div style={{ height: "0.5px", width: 48, background: "rgba(179,139,89,0.5)" }} />
                                    </div>
                                    <h1 className="div-serif" style={{
                                        fontSize: "clamp(42px,7vw,80px)", fontWeight: 900,
                                        color: "#fff", lineHeight: 1.0, letterSpacing: "-1px",
                                        margin: "0 0 14px", fontStyle: "italic"
                                    }}>
                                        {s.title}
                                    </h1>
                                    <p style={{
                                        fontFamily: "'EB Garamond',serif", fontSize: "clamp(16px,2vw,20px)",
                                        color: "rgba(245,240,230,0.72)", lineHeight: 1.7,
                                        margin: "0 auto 32px", maxWidth: 580, fontStyle: "italic"
                                    }}>
                                        {s.subtitle}
                                    </p>

                                    <a
                                        href={divinityPath(s.cat)}
                                        style={{
                                            display: "inline-flex", alignItems: "center", gap: 8,
                                            padding: "13px 32px", background: GOLD, color: "#fff",
                                            fontFamily: "'Lato',sans-serif", fontSize: 12, fontWeight: 700,
                                            letterSpacing: "0.1em", textTransform: "uppercase",
                                            textDecoration: "none", transition: "background 0.18s"
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.background = GOLDD}
                                        onMouseLeave={(e) => e.currentTarget.style.background = GOLD}
                                    >
                                        Enter the Archive <ArrowRight size={14} />
                                    </a>
                                </div>
                            </div>
                        </div>
                    ))}

                    {/* arrows */}
                    {["prev", "next"].map((id) => {
                        const Icon = id === "prev" ? ChevronLeft : ChevronRight;
                        const fn = id === "prev" ? prevSlide : nextSlide;
                        return (
                            <button key={id} onClick={fn} style={{
                                position: "absolute", top: "50%", transform: "translateY(-50%)",
                                [id === "prev" ? "left" : "right"]: 20,
                                width: 40, height: 40, border: "0.5px solid rgba(179,139,89,0.4)",
                                background: "rgba(0,0,0,0.35)", color: "#fff",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                cursor: "pointer", transition: "background 0.18s", backdropFilter: "blur(4px)"
                            }}
                                onMouseEnter={(e) => e.currentTarget.style.background = "rgba(179,139,89,0.3)"}
                                onMouseLeave={(e) => e.currentTarget.style.background = "rgba(0,0,0,0.35)"}>
                                <Icon size={18} />
                            </button>
                        );
                    })}

                    {/* dots */}
                    <div style={{
                        position: "absolute", bottom: 20, left: "50%", transform: "translateX(-50%)",
                        display: "flex", gap: 8, alignItems: "center"
                    }}>
                        {HERO_SLIDES.map((_, i) => (
                            <button key={i} onClick={() => setSlide(i)} style={{
                                height: 6, width: i === slide ? 24 : 6,
                                borderRadius: i === slide ? 3 : "50%",
                                background: i === slide ? GOLD : "rgba(255,255,255,0.35)",
                                border: "none", cursor: "pointer", transition: "all 0.3s ease"
                            }} />
                        ))}
                    </div>
                    <div style={{
                        position: "absolute", bottom: 20, right: 24,
                        color: "rgba(255,255,255,0.35)", fontSize: 10,
                        fontFamily: "'Lato',sans-serif", letterSpacing: "0.12em"
                    }}>
                        {String(slide + 1).padStart(2, "0")} / {String(HERO_SLIDES.length).padStart(2, "0")}
                    </div>
                </div>

                {/* ══ IDENTITY STRIP ═══════════════════════════════════════════ */}
                <div style={{ background: NAVY, borderBottom: "0.5px solid rgba(179,139,89,0.2)" }}>
                    <div style={{
                        maxWidth: 1200, margin: "0 auto",
                        display: "grid", gridTemplateColumns: "repeat(3,1fr)",
                        borderLeft: "0.5px solid rgba(179,139,89,0.1)"
                    }}>
                        {[
                            { val: "4 Traditions", label: "Theological Branches", icon: BookMarked },
                            { val: "Sacred Archive", label: "Curated Faith Documents", icon: ScrollText },
                            { val: "Global Access", label: "Open to All Seekers", icon: Globe },
                        ].map(({ val, label, icon: Icon }) => (
                            <div key={label} style={{
                                padding: "22px 24px",
                                borderRight: "0.5px solid rgba(179,139,89,0.1)",
                                display: "flex", alignItems: "center", gap: 14
                            }}>
                                <Icon size={18} style={{ color: GOLD, flexShrink: 0 }} strokeWidth={1.5} />
                                <div>
                                    <div className="div-serif" style={{ fontSize: 16, fontWeight: 700, color: "#fff", lineHeight: 1.2 }}>
                                        {val}
                                    </div>
                                    <div style={{
                                        fontSize: 10, fontFamily: "'Lato',sans-serif", fontWeight: 700,
                                        letterSpacing: "0.1em", textTransform: "uppercase",
                                        color: "rgba(179,139,89,0.6)", marginTop: 2
                                    }}>
                                        {label}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* ══ THEOLOGICAL CATEGORIES ═══════════════════════════════════ */}
                <section style={{ padding: "72px 24px", background: PARCH }}>
                    <div style={{ maxWidth: 1200, margin: "0 auto" }}>
                        <div style={{ textAlign: "center", marginBottom: 52 }}>
                            <p style={{
                                fontFamily: "'Lato',sans-serif", fontSize: 10, fontWeight: 700,
                                letterSpacing: "0.26em", textTransform: "uppercase",
                                color: GOLD, marginBottom: 12
                            }}>
                                Choose Your Path of Study
                            </p>
                            <h2 className="div-serif" style={{
                                fontSize: "clamp(30px,5vw,52px)", fontWeight: 700,
                                color: NAVY, margin: "0 0 16px", fontStyle: "italic"
                            }}>
                                Four Great Traditions
                            </h2>
                            <div className="orn" style={{ maxWidth: 280, margin: "0 auto 16px" }}>
                                <div style={{ width: 8, height: 8, background: GOLD, transform: "rotate(45deg)", flexShrink: 0 }} />
                            </div>
                            <p style={{
                                fontFamily: "'EB Garamond',serif", fontSize: 17,
                                color: SMOKE, maxWidth: 520, margin: "0 auto", lineHeight: 1.75
                            }}>
                                Navigate the great rivers of human faith — from ancient manuscripts to living theology
                            </p>
                        </div>

                        <div style={{
                            display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 20
                        }}>
                            {THEO_CATEGORIES.map((cat) => {
                                const Icon = ICON_MAP[cat.icon] ?? BookOpen;
                                return (
                                    // divinityPath(cat.slug) → "/divinity/christian-theology" etc.
                                    <a key={cat.id} href={divinityPath(cat.slug)} className="theo-card">
                                        <div style={{ height: 200, overflow: "hidden", position: "relative" }}>
                                            <img src={cat.image} alt={cat.label}
                                                className="theo-img"
                                                style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                            <div style={{
                                                position: "absolute", inset: 0,
                                                background: `linear-gradient(to top, ${cat.color}f0 0%, ${cat.color}88 50%, transparent 100%)`
                                            }} />
                                            <div style={{
                                                position: "absolute", top: 14, left: 14,
                                                width: 38, height: 38, background: "rgba(5,5,15,0.6)",
                                                backdropFilter: "blur(8px)",
                                                border: "0.5px solid rgba(179,139,89,0.4)",
                                                display: "flex", alignItems: "center", justifyContent: "center"
                                            }}>
                                                <Icon size={16} style={{ color: GOLD }} strokeWidth={1.5} />
                                            </div>
                                        </div>

                                        <div style={{ padding: "18px 20px 20px" }}>
                                            <h3 className="div-serif" style={{
                                                fontSize: 18, fontWeight: 700, color: NAVY,
                                                margin: "0 0 8px", lineHeight: 1.25, fontStyle: "italic"
                                            }}>
                                                {cat.label}
                                            </h3>
                                            <p style={{
                                                fontSize: 13, color: SMOKE, lineHeight: 1.65,
                                                margin: "0 0 14px", fontFamily: "'EB Garamond',serif"
                                            }}>
                                                {cat.description}
                                            </p>
                                            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 16 }}>
                                                {cat.sub.slice(0, 3).map((s) => (
                                                    <span key={s} style={{
                                                        fontFamily: "'Lato',sans-serif", fontSize: 9, fontWeight: 700,
                                                        letterSpacing: "0.08em", textTransform: "uppercase",
                                                        padding: "3px 8px", border: "0.5px solid rgba(179,139,89,0.35)",
                                                        color: GOLD, background: "rgba(179,139,89,0.06)"
                                                    }}>
                                                        {s}
                                                    </span>
                                                ))}
                                                {cat.sub.length > 3 && (
                                                    <span style={{
                                                        fontFamily: "'Lato',sans-serif", fontSize: 9, color: "#bbb",
                                                        padding: "3px 8px", border: "0.5px solid #e5ddd0"
                                                    }}>
                                                        +{cat.sub.length - 3}
                                                    </span>
                                                )}
                                            </div>
                                            <div style={{
                                                display: "flex", alignItems: "center", justifyContent: "space-between",
                                                borderTop: "0.5px solid rgba(179,139,89,0.2)", paddingTop: 14
                                            }}>
                                                <span style={{
                                                    fontFamily: "'Lato',sans-serif", fontSize: 10, fontWeight: 700,
                                                    letterSpacing: "0.1em", textTransform: "uppercase", color: NAVY
                                                }}>
                                                    Browse Texts
                                                </span>
                                                <div style={{
                                                    width: 28, height: 28,
                                                    border: "0.5px solid rgba(13,34,68,0.2)",
                                                    display: "flex", alignItems: "center", justifyContent: "center"
                                                }}>
                                                    <ArrowRight size={12} style={{ color: NAVY }} />
                                                </div>
                                            </div>
                                        </div>
                                    </a>
                                );
                            })}
                        </div>
                    </div>
                </section>

                {/* ══ DOCUMENT ARCHIVE ════════════════════════════════════════ */}
                <section style={{
                    background: "#fff", padding: "72px 24px",
                    borderTop: "0.5px solid #e5ddd0"
                }}>
                    <div style={{ maxWidth: 1200, margin: "0 auto" }}>
                        <div style={{
                            display: "flex", alignItems: "flex-end",
                            justifyContent: "space-between", marginBottom: 36,
                            flexWrap: "wrap", gap: 16
                        }}>
                            <div>
                                <p style={{
                                    fontFamily: "'Lato',sans-serif", fontSize: 10, fontWeight: 700,
                                    letterSpacing: "0.26em", textTransform: "uppercase",
                                    color: GOLD, marginBottom: 8
                                }}>The Archive</p>
                                <h2 className="div-serif" style={{
                                    fontSize: "clamp(26px,4vw,42px)", fontWeight: 700,
                                    color: NAVY, margin: 0, fontStyle: "italic"
                                }}>
                                    Sacred Documents
                                </h2>
                            </div>
                            <button
                                onClick={() => user ? setShowUpload(true) : router.push("/auth/signin")}
                                style={{
                                    display: "inline-flex", alignItems: "center", gap: 8,
                                    padding: "11px 22px", background: NAVY, color: "#fff",
                                    fontFamily: "'Lato',sans-serif", fontSize: 11, fontWeight: 700,
                                    letterSpacing: "0.1em", textTransform: "uppercase",
                                    border: "none", cursor: "pointer"
                                }}>
                                <Upload size={13} /> Contribute a Text
                            </button>
                        </div>

                        {/* search + filter */}
                        <div style={{
                            display: "flex", flexWrap: "wrap", gap: 12,
                            alignItems: "center", marginBottom: 32,
                            padding: "16px 20px", background: CREAM,
                            border: "0.5px solid #e5ddd0"
                        }}>
                            <div style={{ flex: 1, minWidth: 200, position: "relative" }}>
                                <Search size={13} style={{
                                    position: "absolute", left: 12,
                                    top: "50%", transform: "translateY(-50%)", color: "#bbb"
                                }} />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search sacred texts, authors, traditions…"
                                    style={{
                                        width: "100%", padding: "9px 12px 9px 34px",
                                        border: "0.5px solid #e0d8ce",
                                        fontFamily: "'EB Garamond',serif", fontSize: 15,
                                        outline: "none", color: NAVY, background: "#fff",
                                        boxSizing: "border-box"
                                    }}
                                />
                            </div>
                            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                                <button
                                    className={`filter-tab ${activeCategory === "all" ? "active" : ""}`}
                                    onClick={() => setActiveCategory("all")}>
                                    All Traditions
                                </button>
                                {THEO_CATEGORIES.map((cat) => (
                                    <button key={cat.id}
                                        className={`filter-tab ${activeCategory === cat.id ? "active" : ""}`}
                                        onClick={() => setActiveCategory(cat.id)}>
                                        {cat.label.split(" ")[0]}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* document grid */}
                        {loadingDocs ? (
                            <div style={{
                                display: "grid",
                                gridTemplateColumns: "repeat(auto-fill,minmax(160px,1fr))", gap: 16
                            }}>
                                {Array.from({ length: 12 }).map((_, i) => (
                                    <div key={i} className="shimmer" style={{
                                        aspectRatio: "3/4", background: "#ede8df", border: "0.5px solid #e5ddd0"
                                    }} />
                                ))}
                            </div>
                        ) : filtered.length === 0 ? (
                            <div style={{
                                textAlign: "center", padding: "80px 24px",
                                background: CREAM, border: "0.5px solid #e5ddd0"
                            }}>
                                <ScrollText size={44} style={{ color: "#ddd", margin: "0 auto 16px", display: "block" }} />
                                <h3 className="div-serif" style={{
                                    fontSize: 24, color: NAVY, marginBottom: 8, fontStyle: "italic"
                                }}>
                                    No Texts Found
                                </h3>
                                <p style={{
                                    fontSize: 15, color: SMOKE, marginBottom: 24,
                                    fontFamily: "'EB Garamond',serif"
                                }}>
                                    Be the first to contribute to this tradition's archive
                                </p>
                                <button
                                    onClick={() => user ? setShowUpload(true) : router.push("/auth/signin")}
                                    style={{
                                        padding: "10px 28px", background: NAVY, color: "#fff",
                                        fontFamily: "'Lato',sans-serif", fontSize: 11, fontWeight: 700,
                                        letterSpacing: "0.1em", border: "none", cursor: "pointer"
                                    }}>
                                    Upload a Sacred Text
                                </button>
                            </div>
                        ) : (
                            <div style={{
                                display: "grid",
                                gridTemplateColumns: "repeat(auto-fill,minmax(160px,1fr))", gap: 18
                            }}>
                                {filtered.map((doc) => (
                                    <Link key={doc.id} href={`/book/preview?id=${doc.id}`} className="book-card">
                                        <div style={{
                                            position: "relative", background: "#ede8df",
                                            aspectRatio: "3/4", overflow: "hidden"
                                        }}>
                                            <img src={getThumbnail(doc)} alt={doc.bookTitle}
                                                className="book-img"
                                                style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                                onError={(e) => {
                                                    e.target.src = "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400";
                                                }}
                                            />
                                            {doc.theologicalCategory && (
                                                <div style={{
                                                    position: "absolute", bottom: 8, left: 8,
                                                    background: "rgba(13,34,68,0.85)", padding: "3px 8px",
                                                    fontFamily: "'Lato',sans-serif", fontSize: 8,
                                                    fontWeight: 700, color: GOLD,
                                                    letterSpacing: "0.08em", textTransform: "uppercase"
                                                }}>
                                                    {doc.theologicalCategory.replace(/_/g, " ")}
                                                </div>
                                            )}
                                        </div>
                                        <div style={{ padding: "10px 10px 12px", borderTop: "0.5px solid #f0ebe0" }}>
                                            <h4 className="div-serif" style={{
                                                fontSize: 13, fontWeight: 600, color: NAVY, margin: "0 0 3px",
                                                display: "-webkit-box", WebkitLineClamp: 2,
                                                WebkitBoxOrient: "vertical", overflow: "hidden", lineHeight: 1.35
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

                {/* ══ SCHOLARS NOTICE ══════════════════════════════════════════ */}
                <section style={{
                    background: PARCH, borderTop: "0.5px solid #ddd5c8",
                    borderBottom: "0.5px solid #ddd5c8", padding: "64px 24px"
                }}>
                    <div style={{
                        maxWidth: 1100, margin: "0 auto",
                        display: "flex", flexWrap: "wrap", gap: 40, alignItems: "center"
                    }}>
                        <div style={{ textAlign: "center", flexShrink: 0 }}>
                            <div style={{
                                width: 72, height: 72, margin: "0 auto 12px",
                                border: `1.5px solid ${NAVY}`, transform: "rotate(45deg)",
                                display: "flex", alignItems: "center", justifyContent: "center"
                            }}>
                                <Feather size={28} style={{ color: NAVY, transform: "rotate(-45deg)" }} strokeWidth={1.5} />
                            </div>
                            <p className="div-serif" style={{ fontSize: 11, color: "#bbb", fontStyle: "italic" }}>
                                LAN Divinity
                            </p>
                        </div>

                        <div style={{ width: 1, height: 80, background: "#ddd5c8", flexShrink: 0 }} />

                        <div style={{ flex: 1, minWidth: 240 }}>
                            <p style={{
                                fontFamily: "'Lato',sans-serif", fontSize: 10, fontWeight: 700,
                                letterSpacing: "0.2em", textTransform: "uppercase", color: GOLD, marginBottom: 10
                            }}>
                                A Call to Scholars
                            </p>
                            <h3 className="div-serif" style={{
                                fontSize: "clamp(20px,3vw,30px)", fontWeight: 700,
                                color: NAVY, margin: "0 0 12px", fontStyle: "italic"
                            }}>
                                Are you a Theologian or Faith Educator?
                            </h3>
                            <p style={{
                                fontFamily: "'EB Garamond',serif", fontSize: 16,
                                color: SMOKE, lineHeight: 1.75, maxWidth: 520
                            }}>
                                Contribute your theological works, sermon notes, and sacred commentaries
                                to Africa's most comprehensive digital divinity archive.
                                Your scholarship will reach seekers across the continent.
                            </p>
                        </div>

                        <div style={{ display: "flex", flexDirection: "column", gap: 10, flexShrink: 0 }}>
                            <button
                                onClick={() => user ? setShowUpload(true) : router.push("/auth/signin")}
                                style={{
                                    display: "flex", alignItems: "center", gap: 8,
                                    padding: "12px 24px", background: NAVY, color: "#fff",
                                    fontFamily: "'Lato',sans-serif", fontSize: 12, fontWeight: 700,
                                    letterSpacing: "0.06em", border: "none", cursor: "pointer"
                                }}>
                                <Upload size={14} /> Submit a Text
                            </button>
                            <Link href="/divinity/browse" style={{
                                display: "flex", alignItems: "center", gap: 8,
                                padding: "12px 24px", border: `0.5px solid ${NAVY}`,
                                color: NAVY, fontFamily: "'Lato',sans-serif",
                                fontSize: 12, fontWeight: 700, letterSpacing: "0.06em",
                                textDecoration: "none"
                            }}>
                                <Search size={14} /> Browse the Archive
                            </Link>
                        </div>
                    </div>
                </section>

                {/* ══ CTA ══════════════════════════════════════════════════════ */}
                <section className="crosshatch" style={{ padding: "80px 24px", textAlign: "center" }}>
                    <div style={{
                        display: "flex", alignItems: "center", justifyContent: "center",
                        gap: 16, marginBottom: 28
                    }}>
                        <div style={{ height: "0.5px", width: 60, background: "rgba(179,139,89,0.4)" }} />
                        <Star size={13} style={{ color: GOLD, fill: GOLD }} />
                        <div style={{ height: "0.5px", width: 60, background: "rgba(179,139,89,0.4)" }} />
                    </div>
                    <h2 className="div-serif" style={{
                        fontSize: "clamp(28px,5vw,52px)", fontWeight: 700,
                        color: "#fff", margin: "0 0 16px", fontStyle: "italic"
                    }}>
                        Seek. Study. Understand.
                    </h2>
                    <p style={{
                        fontFamily: "'EB Garamond',serif", fontSize: 18,
                        color: "rgba(255,255,255,0.5)", maxWidth: 500,
                        margin: "0 auto 40px", lineHeight: 1.75, fontStyle: "italic"
                    }}>
                        The LAN Divinity archive unites scholars and seekers across
                        every tradition — open to all who pursue sacred knowledge.
                    </p>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 14, justifyContent: "center" }}>
                        <Link href="/divinity/browse" style={{
                            display: "inline-flex", alignItems: "center", gap: 8,
                            padding: "14px 28px", background: GOLD, color: "#fff",
                            fontFamily: "'Lato',sans-serif", fontSize: 12, fontWeight: 700,
                            letterSpacing: "0.08em", textTransform: "uppercase", textDecoration: "none"
                        }}>
                            <BookOpen size={14} /> Browse Sacred Texts
                        </Link>
                        <button
                            onClick={() => user ? setShowUpload(true) : router.push("/auth/signin")}
                            style={{
                                display: "inline-flex", alignItems: "center", gap: 8,
                                padding: "14px 28px", border: "0.5px solid rgba(255,255,255,0.25)",
                                color: "rgba(245,240,230,0.85)", background: "transparent",
                                fontFamily: "'Lato',sans-serif", fontSize: 12, fontWeight: 700,
                                letterSpacing: "0.08em", textTransform: "uppercase", cursor: "pointer"
                            }}>
                            <Upload size={14} /> Donate a Text
                        </button>
                    </div>
                </section>

                <Footer />
            </div>

            {/* ══ UPLOAD MODAL ════════════════════════════════════════════ */}
            {showUpload && <UploadModal user={user} onClose={() => setShowUpload(false)} />}
        </>
    );
}

/* ─── Upload Modal (unchanged logic, same as original) ─────────────────── */
function UploadModal({ user, onClose }) {
    const [form, setForm] = useState({
        bookTitle: "",
        author: "",
        theologicalCategory: "christian_theology",
        subDiscipline: "",
        language: "English",
        description: "",
        pdfUrl: "",
        price: "0",
    });
    const [submitting, setSubmitting] = useState(false);
    const [done, setDone] = useState(false);

    const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

    const handleSubmit = async () => {
        if (!form.bookTitle || !form.pdfUrl) return;
        setSubmitting(true);
        try {
            await addDoc(collection(db, "advertMyBook"), {
                ...form,
                price: Number(form.price) || 0,
                isReligiousDocument: true,
                status: "pending",
                uploadedBy: user.uid,
                uploaderEmail: user.email,
                createdAt: serverTimestamp(),
            });
            setDone(true);
        } catch (e) {
            console.error(e);
        } finally {
            setSubmitting(false);
        }
    };

    const inputStyle = {
        width: "100%", padding: "10px 14px",
        border: "0.5px solid #ddd5c8",
        fontFamily: "'EB Garamond',serif", fontSize: 15,
        color: NAVY, background: "#fff", outline: "none",
        boxSizing: "border-box",
    };
    const labelStyle = {
        fontFamily: "'Lato',sans-serif", fontSize: 10, fontWeight: 700,
        letterSpacing: "0.12em", textTransform: "uppercase", color: SMOKE,
        display: "block", marginBottom: 6,
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-box illuminated" onClick={(e) => e.stopPropagation()}>
                <div style={{
                    padding: "20px 24px",
                    borderBottom: "0.5px solid rgba(179,139,89,0.25)",
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    background: NAVY
                }}>
                    <div>
                        <p style={{
                            fontFamily: "'Lato',sans-serif", fontSize: 9, fontWeight: 700,
                            letterSpacing: "0.2em", textTransform: "uppercase",
                            color: "rgba(179,139,89,0.7)", marginBottom: 3
                        }}>
                            LAN Divinity · Sacred Archive
                        </p>
                        <h3 className="div-serif" style={{
                            fontSize: 20, fontWeight: 700, color: "#fff", margin: 0, fontStyle: "italic"
                        }}>
                            Submit a Theological Text
                        </h3>
                    </div>
                    <button onClick={onClose} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.5)", cursor: "pointer" }}>
                        <X size={18} />
                    </button>
                </div>

                {done ? (
                    <div style={{ padding: "48px 24px", textAlign: "center" }}>
                        <Star size={36} style={{ color: GOLD, fill: GOLD, margin: "0 auto 16px", display: "block" }} />
                        <h3 className="div-serif" style={{ fontSize: 22, color: NAVY, marginBottom: 8, fontStyle: "italic" }}>
                            Text Submitted
                        </h3>
                        <p style={{ fontFamily: "'EB Garamond',serif", fontSize: 15, color: SMOKE, lineHeight: 1.7, marginBottom: 24 }}>
                            Your contribution is under review and will appear in the archive once approved.
                        </p>
                        <button onClick={onClose} style={{
                            padding: "10px 28px", background: NAVY, color: "#fff",
                            fontFamily: "'Lato',sans-serif", fontSize: 11, fontWeight: 700,
                            letterSpacing: "0.1em", border: "none", cursor: "pointer"
                        }}>
                            Close
                        </button>
                    </div>
                ) : (
                    <div style={{ padding: "24px" }}>
                        <div style={{ marginBottom: 20 }}>
                            <label style={labelStyle}>Theological Tradition *</label>
                            <select value={form.theologicalCategory} onChange={(e) => set("theologicalCategory", e.target.value)} style={inputStyle}>
                                <option value="christian_theology">Christian Theology</option>
                                <option value="islamic_studies">Islamic Studies</option>
                                <option value="comparative_religion">Comparative Religion & Philosophy</option>
                                <option value="sacred_texts">Sacred Texts & Manuscripts</option>
                            </select>
                        </div>
                        <div style={{ marginBottom: 20 }}>
                            <label style={labelStyle}>Title of Text *</label>
                            <input value={form.bookTitle} onChange={(e) => set("bookTitle", e.target.value)}
                                placeholder="e.g. Institutes of the Christian Religion" style={inputStyle} />
                        </div>
                        <div style={{ marginBottom: 20 }}>
                            <label style={labelStyle}>Author / Scholar</label>
                            <input value={form.author} onChange={(e) => set("author", e.target.value)}
                                placeholder="e.g. John Calvin" style={inputStyle} />
                        </div>
                        <div style={{ marginBottom: 20 }}>
                            <label style={labelStyle}>Sub-discipline</label>
                            <input value={form.subDiscipline} onChange={(e) => set("subDiscipline", e.target.value)}
                                placeholder="e.g. Systematic Theology, Hadith Sciences…" style={inputStyle} />
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 20 }}>
                            <div>
                                <label style={labelStyle}>Language</label>
                                <select value={form.language} onChange={(e) => set("language", e.target.value)} style={inputStyle}>
                                    {["English", "Arabic", "French", "Yoruba", "Hausa", "Igbo", "Swahili"].map((l) => (
                                        <option key={l}>{l}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label style={labelStyle}>Price (₦, 0 = free)</label>
                                <input type="number" value={form.price} onChange={(e) => set("price", e.target.value)}
                                    min="0" style={inputStyle} />
                            </div>
                        </div>
                        <div style={{ marginBottom: 20 }}>
                            <label style={labelStyle}>Google Drive PDF Link *</label>
                            <input value={form.pdfUrl} onChange={(e) => set("pdfUrl", e.target.value)}
                                placeholder="https://drive.google.com/file/d/…" style={inputStyle} />
                        </div>
                        <div style={{ marginBottom: 24 }}>
                            <label style={labelStyle}>Brief Description</label>
                            <textarea value={form.description} onChange={(e) => set("description", e.target.value)}
                                rows={3}
                                placeholder="Describe the content, tradition, and scholarly value of this text…"
                                style={{ ...inputStyle, resize: "vertical", lineHeight: 1.6 }} />
                        </div>
                        <div style={{
                            padding: "10px 14px", background: "rgba(179,139,89,0.08)",
                            border: "0.5px solid rgba(179,139,89,0.3)", marginBottom: 20
                        }}>
                            <p style={{ fontFamily: "'Lato',sans-serif", fontSize: 10, color: SMOKE, margin: 0, lineHeight: 1.6 }}>
                                ✦ This document will be tagged as a <strong>Religious Document</strong> and
                                stored separately from standard university course materials.
                            </p>
                        </div>
                        <button
                            onClick={handleSubmit}
                            disabled={submitting || !form.bookTitle || !form.pdfUrl}
                            style={{
                                width: "100%", padding: "13px",
                                background: (!form.bookTitle || !form.pdfUrl) ? "#ccc" : NAVY,
                                color: "#fff", fontFamily: "'Lato',sans-serif",
                                fontSize: 12, fontWeight: 700, letterSpacing: "0.1em",
                                textTransform: "uppercase", border: "none",
                                cursor: (!form.bookTitle || !form.pdfUrl) ? "not-allowed" : "pointer"
                            }}>
                            {submitting ? "Submitting…" : "Submit for Review"}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}