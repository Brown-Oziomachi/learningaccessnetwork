"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
    collection, query, where, getDocs, orderBy, limit, startAfter,
} from "firebase/firestore";
import { db } from "@/lib/firebaseConfig";
import {
    Search, X, ChevronRight, Upload, BookOpen,
    Filter, SlidersHorizontal, ArrowLeft, ShoppingBag,
    FileText, GraduationCap, ChevronDown, ArrowUpRight,
    Layers,
} from "lucide-react";
import Navbar from "@/components/NavBar";
import Footer from "@/components/FooterComp";

/* ── colour tokens ─────────────────────────────────────────────── */
const NAVY = "#0d2244";
const GOLD = "#b8963e";
const GOLDD = "#d4aa5a";
const CREAM = "#f5f0e8";
const BG = "#f5f1ea";

/* ── ALL DEPARTMENTS — slug → name + meta ───────────────────────
   Keep in sync with DepartmentsPage.jsx and AdvertiseClient.jsx
──────────────────────────────────────────────────────────────── */
const ALL_DEPARTMENTS = [
    /* Sciences */
    { slug: "medicine-health-sciences", name: "Medicine & Health Sciences", faculty: "Sciences", image: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=800" },
    { slug: "pharmacy", name: "Pharmacy", faculty: "Sciences", image: "https://images.unsplash.com/photo-1585435557343-3b092031a831?w=800" },
    { slug: "nursing", name: "Nursing", faculty: "Sciences", image: "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=800" },
    { slug: "biochemistry", name: "Biochemistry", faculty: "Sciences", image: "https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=800" },
    { slug: "microbiology", name: "Microbiology", faculty: "Sciences", image: "https://images.unsplash.com/photo-1576319155264-99536e0be1ee?w=800" },
    { slug: "biology", name: "Biology", faculty: "Sciences", image: "https://images.unsplash.com/photo-1530026405186-ed1f139313f8?w=800" },
    { slug: "chemistry", name: "Chemistry", faculty: "Sciences", image: "https://images.unsplash.com/photo-1603126857599-f6e157fa2fe6?w=800" },
    { slug: "physics", name: "Physics", faculty: "Sciences", image: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=800" },
    { slug: "mathematics", name: "Mathematics", faculty: "Sciences", image: "https://images.unsplash.com/photo-1509228468518-180dd4864904?w=800" },
    { slug: "statistics", name: "Statistics", faculty: "Sciences", image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800" },
    { slug: "veterinary-medicine", name: "Veterinary Medicine", faculty: "Sciences", image: "https://images.unsplash.com/photo-1596854407944-bf87f6fdd49e?w=800" },
    { slug: "dentistry", name: "Dentistry", faculty: "Sciences", image: "https://images.unsplash.com/photo-1588776814546-1ffbb172f4ed?w=800" },
    { slug: "nutrition-dietetics", name: "Nutrition & Dietetics", faculty: "Sciences", image: "https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=800" },
    { slug: "optometry", name: "Optometry", faculty: "Sciences", image: "https://images.unsplash.com/photo-1511174511562-5f7f18b874f8?w=800" },
    /* Engineering */
    { slug: "computer-science", name: "Computer Science", faculty: "Engineering", image: "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=800" },
    { slug: "electrical-engineering", name: "Electrical Engineering", faculty: "Engineering", image: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=800" },
    { slug: "mechanical-engineering", name: "Mechanical Engineering", faculty: "Engineering", image: "https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=800" },
    { slug: "civil-engineering", name: "Civil Engineering", faculty: "Engineering", image: "https://images.unsplash.com/photo-1503387762-592dec58ef4e?w=800" },
    { slug: "chemical-engineering", name: "Chemical Engineering", faculty: "Engineering", image: "https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800" },
    { slug: "petroleum-engineering", name: "Petroleum Engineering", faculty: "Engineering", image: "https://images.unsplash.com/photo-1578575437130-527eed3abbec?w=800" },
    { slug: "architecture", name: "Architecture", faculty: "Engineering", image: "https://images.unsplash.com/photo-1487958449943-2429e8be8625?w=800" },
    { slug: "information-technology", name: "Information Technology", faculty: "Engineering", image: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800" },
    { slug: "agricultural-engineering", name: "Agricultural Engineering", faculty: "Engineering", image: "https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=800" },
    { slug: "environmental-engineering", name: "Environmental Engineering", faculty: "Engineering", image: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800" },
    { slug: "mining-engineering", name: "Mining Engineering", faculty: "Engineering", image: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800" },
    /* Arts & Social */
    { slug: "law", name: "Law", faculty: "Arts & Social", image: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=800" },
    { slug: "economics", name: "Economics", faculty: "Arts & Social", image: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800" },
    { slug: "accounting", name: "Accounting", faculty: "Arts & Social", image: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=800" },
    { slug: "business-administration", name: "Business Administration", faculty: "Arts & Social", image: "https://images.unsplash.com/photo-1552664730-d307ca884978?w=800" },
    { slug: "political-science", name: "Political Science", faculty: "Arts & Social", image: "https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=800" },
    { slug: "sociology", name: "Sociology", faculty: "Arts & Social", image: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=800" },
    { slug: "psychology", name: "Psychology", faculty: "Arts & Social", image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800" },
    { slug: "mass-communication", name: "Mass Communication", faculty: "Arts & Social", image: "https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=800" },
    { slug: "history-international-studies", name: "History & International Studies", faculty: "Arts & Social", image: "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=800" },
    { slug: "public-administration", name: "Public Administration", faculty: "Arts & Social", image: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800" },
    { slug: "geography", name: "Geography", faculty: "Arts & Social", image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800" },
    { slug: "philosophy", name: "Philosophy", faculty: "Arts & Social", image: "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=800" },
    { slug: "linguistics", name: "Linguistics", faculty: "Arts & Social", image: "https://images.unsplash.com/photo-1456324504439-367cee3b3c32?w=800" },
    /* Humanities */
    { slug: "literature", name: "Literature", faculty: "Humanities", image: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=800" },
    { slug: "fine-applied-arts", name: "Fine & Applied Arts", faculty: "Humanities", image: "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800" },
    { slug: "music", name: "Music", faculty: "Humanities", image: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800" },
    { slug: "theatre-performing-arts", name: "Theatre & Performing Arts", faculty: "Humanities", image: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800" },
    { slug: "languages-linguistics", name: "Languages & Linguistics", faculty: "Humanities", image: "https://images.unsplash.com/photo-1516979187457-637abb4f9353?w=800" },
    { slug: "religious-studies", name: "Religious Studies", faculty: "Humanities", image: "https://images.unsplash.com/photo-1518173946687-a4c8892bbd9f?w=800" },
    /* Agriculture */
    { slug: "agriculture", name: "Agriculture", faculty: "Agriculture", image: "https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=800" },
    { slug: "forestry-wildlife", name: "Forestry & Wildlife", faculty: "Agriculture", image: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800" },
    { slug: "fisheries-aquaculture", name: "Fisheries & Aquaculture", faculty: "Agriculture", image: "https://images.unsplash.com/photo-1504309092620-4d0ec726efa4?w=800" },
    { slug: "environmental-sciences", name: "Environmental Sciences", faculty: "Agriculture", image: "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=800" },
    { slug: "food-science-technology", name: "Food Science & Technology", faculty: "Agriculture", image: "https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=800" },
    /* Education */
    { slug: "education", name: "Education", faculty: "Education", image: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800" },
    { slug: "guidance-counselling", name: "Guidance & Counselling", faculty: "Education", image: "https://images.unsplash.com/photo-1573497620053-ea5300f94f21?w=800" },
    { slug: "early-childhood-education", name: "Early Childhood Education", faculty: "Education", image: "https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=800" },
    { slug: "special-education", name: "Special Education", faculty: "Education", image: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800" },
    { slug: "physical-health-education", name: "Physical & Health Education", faculty: "Education", image: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800" },
    /* Professional */
    { slug: "finance-banking", name: "Finance & Banking", faculty: "Professional", image: "https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=800" },
    { slug: "insurance", name: "Insurance", faculty: "Professional", image: "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=800" },
    { slug: "estate-management", name: "Estate Management", faculty: "Professional", image: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800" },
    { slug: "hospitality-tourism", name: "Hospitality & Tourism", faculty: "Professional", image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800" },
    { slug: "library-information-science", name: "Library & Information Science", faculty: "Professional", image: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=800" },
    { slug: "quantity-surveying", name: "Quantity Surveying", faculty: "Professional", image: "https://images.unsplash.com/photo-1503387762-592dec58ef4e?w=800" },
    { slug: "urban-regional-planning", name: "Urban & Regional Planning", faculty: "Professional", image: "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=800" },
    { slug: "social-work", name: "Social Work", faculty: "Professional", image: "https://images.unsplash.com/photo-1521791136064-7986c2959d99?w=800" },
];

/* ── faculty accent colours ──────────────────────────────────── */
const FACULTY_COLORS = {
    "Sciences": GOLD,
    "Engineering": "#3b82f6",
    "Arts & Social": "#8b5cf6",
    "Humanities": "#f59e0b",
    "Agriculture": "#10b981",
    "Education": "#ef4444",
    "Professional": NAVY,
};

/* ── doc-type quick filters shown in the pill bar ────────────── */
const DOC_TYPE_FILTERS = [
    "All", "Lecture Note", "Textbook", "Past Question",
    "Summary", "Thesis", "Lab Manual", "Assignment", "Project", "Study Guide",
];

const LEVEL_FILTERS = ["All Levels", "100 Level", "200 Level", "300 Level", "400 Level", "500 Level", "Postgraduate"];

/* ── thumbnail helper (same as rest of app) ─────────────────── */
const getThumbnail = (book) => {
    if (book.driveFileId) return `https://drive.google.com/thumbnail?id=${book.driveFileId}&sz=w400`;
    if (book.embedUrl) {
        const m = book.embedUrl.match(/\/d\/(.*?)\/|\/file\/d\/(.*?)\/|id=(.*?)(&|$)/);
        if (m) { const id = m[1] || m[2] || m[3]; if (id) return `https://drive.google.com/thumbnail?id=${id}&sz=w400`; }
    }
    if (book.pdfUrl?.includes("drive.google.com")) {
        const m = book.pdfUrl.match(/[-\w]{25,}/);
        if (m) return `https://drive.google.com/thumbnail?id=${m[0]}&sz=w400`;
    }
    return book.coverImage || book.image || "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400";
};

/* ════════════════════════════════════════════════════════════════
   PAGE
════════════════════════════════════════════════════════════════ */
export default function DepartmentSlugPage() {
    const params = useParams();
    const router = useRouter();
    const slug = params?.slug || "";

    /* find department meta from slug */
    const dept = ALL_DEPARTMENTS.find(d => d.slug === slug);

    const [books, setBooks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [lastDoc, setLastDoc] = useState(null);
    const [hasMore, setHasMore] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);

    /* filters */
    const [search, setSearch] = useState("");
    const [docType, setDocType] = useState("All");
    const [level, setLevel] = useState("All Levels");
    const [showFilter, setShowFilter] = useState(false);

    const PAGE_SIZE = 24;

    /* ── fetch ── */
    const fetchBooks = useCallback(async (afterDoc = null) => {
        if (!dept) return;
        try {
            afterDoc ? setLoadingMore(true) : setLoading(true);

            /* base query — filter by department name + approved */
            let q = query(
                collection(db, "advertMyBook"),
                where("department", "==", dept.name),
                where("status", "==", "approved"),
                orderBy("createdAt", "desc"),
                limit(PAGE_SIZE)
            );
            if (afterDoc) q = query(
                collection(db, "advertMyBook"),
                where("department", "==", dept.name),
                where("status", "==", "approved"),
                orderBy("createdAt", "desc"),
                startAfter(afterDoc),
                limit(PAGE_SIZE)
            );

            const snap = await getDocs(q);
            const docs = snap.docs.map(d => ({
                id: `firestore-${d.id}`,
                firestoreId: d.id,
                ...d.data(),
                _snap: d,
            })).map(b => ({ ...b, thumbUrl: getThumbnail(b) }));

            if (afterDoc) setBooks(prev => [...prev, ...docs]);
            else setBooks(docs);

            setLastDoc(snap.docs[snap.docs.length - 1] || null);
            setHasMore(snap.docs.length === PAGE_SIZE);
        } catch (e) {
            console.error("Department fetch error:", e);
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    }, [dept]);

    useEffect(() => { fetchBooks(); }, [fetchBooks]);

    /* ── client-side filter (search + docType + level) ── */
    const filtered = books.filter(b => {
        const s = search.toLowerCase();
        const matchSearch = !s
            || b.bookTitle?.toLowerCase().includes(s)
            || b.author?.toLowerCase().includes(s)
            || b.courseCode?.toLowerCase().includes(s)
            || b.docType?.toLowerCase().includes(s);
        const matchType = docType === "All" || b.docType === docType;
        const matchLevel = level === "All Levels" || b.level === level.replace(" Level", "").toLowerCase().replace("postgraduate", "pg");
        return matchSearch && matchType && matchLevel;
    });

    /* ── 404 guard ── */
    if (!dept) return (
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: BG, fontFamily: "'Lato',sans-serif" }}>
            <div style={{ textAlign: "center" }}>
                <BookOpen size={48} style={{ color: "#ddd", margin: "0 auto 16px", display: "block" }} />
                <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: 24, color: NAVY, marginBottom: 8 }}>Department not found</h2>
                <p style={{ color: "#aaa", fontSize: 13, marginBottom: 20 }}>This department doesn't exist in our catalogue.</p>
                <Link href="/departments" style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "10px 20px", background: NAVY, color: "#fff", fontSize: 12, fontWeight: 700, textDecoration: "none", fontFamily: "'Lato',sans-serif" }}>
                    <ArrowLeft size={13} /> Back to Departments
                </Link>
            </div>
        </div>
    );

    const accentColor = FACULTY_COLORS[dept.faculty] || GOLD;

    return (
        <div style={{ minHeight: "100vh", background: BG, fontFamily: "'Lato',sans-serif" }}>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400&family=Lato:wght@300;400;700&display=swap');
                *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
                .lan-serif { font-family: 'Playfair Display', Georgia, serif; }

                .hero-bg {
                    background-color: ${NAVY};
                    background-image: radial-gradient(rgba(184,150,62,.06) 1px, transparent 1px),
                                      radial-gradient(rgba(255,255,255,.03) 1px, transparent 1px);
                    background-size: 28px 28px, 14px 14px;
                    background-position: 0 0, 7px 7px;
                    position: relative;
                    overflow: hidden;
                }
                .hero-cover {
                    position: absolute; inset: 0;
                    background-size: cover; background-position: center;
                    opacity: 0.12;
                    filter: grayscale(30%);
                }

                /* book card */
                .book-card {
                    background: #fff;
                    border: 0.5px solid #e5ddd0;
                    text-decoration: none;
                    display: block;
                    transition: transform 0.22s cubic-bezier(.4,0,.2,1), box-shadow 0.22s, border-color 0.22s;
                }
                .book-card:hover { transform: translateY(-4px); box-shadow: 0 14px 36px rgba(13,34,68,.12); border-color: ${GOLD}; }
                .book-card:hover .book-img { transform: scale(1.07); }
                .book-img { width: 100%; aspect-ratio: 3/4; object-fit: cover; display: block; transition: transform 0.5s cubic-bezier(.4,0,.2,1); }

                /* pill */
                .filter-pill {
                    padding: 6px 14px; border: 0.5px solid #e5ddd0; background: #fff;
                    font-size: 11px; font-weight: 700; letter-spacing: 0.06em;
                    text-transform: uppercase; color: #888; cursor: pointer;
                    font-family: 'Lato', sans-serif; white-space: nowrap;
                    transition: all 0.15s;
                }
                .filter-pill:hover  { border-color: ${GOLD}; color: ${NAVY}; }
                .filter-pill.active { background: ${NAVY}; color: #fff; border-color: ${NAVY}; }

                .sbar-none { scrollbar-width: none; }
                .sbar-none::-webkit-scrollbar { display: none; }

                .sticky-bar { position: sticky; top: 0; z-index: 40; background: #fff; border-bottom: 0.5px solid #e5ddd0; }

                .empty-box {
                    text-align: center; padding: 80px 24px;
                    background: #fff; border: 0.5px solid #e5ddd0;
                }

                @keyframes fadeUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
                .anim-up   { animation: fadeUp 0.55s cubic-bezier(.4,0,.2,1) both; }
                .anim-up-2 { animation: fadeUp 0.55s .1s cubic-bezier(.4,0,.2,1) both; }
                .anim-up-3 { animation: fadeUp 0.55s .2s cubic-bezier(.4,0,.2,1) both; }

                @keyframes spin { to { transform:rotate(360deg); } }

                @media (max-width: 600px) {
                    .book-grid { grid-template-columns: repeat(2, 1fr) !important; }
                }
            `}</style>

            <Navbar />

            {/* ══ HERO ════════════════════════════════════════════════ */}
            <section className="hero-bg" style={{ padding: "64px 24px 56px" }}>
                {/* faint dept image in background */}
                <div className="hero-cover" style={{ backgroundImage: `url(${dept.image})` }} />

                {/* decorative diamond */}
                <div style={{ position: "absolute", top: -20, right: 40, width: 90, height: 90, border: "0.5px solid rgba(184,150,62,0.15)", transform: "rotate(45deg)" }} />
                <div style={{ position: "absolute", bottom: -10, left: 60, width: 60, height: 60, border: "0.5px solid rgba(184,150,62,0.1)", transform: "rotate(45deg)" }} />

                <div style={{ maxWidth: 1100, margin: "0 auto", position: "relative" }}>
                    {/* breadcrumb */}
                    <div className="anim-up" style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 22, flexWrap: "wrap" }}>
                        <Link href="/" style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", textDecoration: "none", fontWeight: 700 }}>Home</Link>
                        <ChevronRight size={10} style={{ color: "rgba(255,255,255,0.25)" }} />
                        <Link href="/departments" style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", textDecoration: "none", fontWeight: 700 }}>Departments</Link>
                        <ChevronRight size={10} style={{ color: "rgba(255,255,255,0.25)" }} />
                        <span style={{ fontSize: 11, color: "rgba(255,255,255,0.65)", fontWeight: 700 }}>{dept.name}</span>
                    </div>

                    <div style={{ display: "flex", flexWrap: "wrap", gap: 32, alignItems: "flex-end", justifyContent: "space-between" }}>
                        <div>
                            {/* faculty badge */}
                            <div className="anim-up" style={{ display: "inline-flex", alignItems: "center", gap: 7, background: "rgba(184,150,62,0.14)", border: "1px solid rgba(184,150,62,0.3)", borderRadius: 999, padding: "5px 14px", marginBottom: 16 }}>
                                <GraduationCap size={11} style={{ color: GOLD }} />
                                <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: GOLDD }}>
                                    {dept.faculty}
                                </span>
                            </div>

                            <h1 className="lan-serif anim-up-2" style={{ fontSize: "clamp(32px,6vw,60px)", fontWeight: 900, color: "#fff", lineHeight: 1.04, letterSpacing: "-1px", margin: "0 0 14px" }}>
                                {dept.name}
                            </h1>

                            <p className="anim-up-3" style={{ fontSize: 14, color: "rgba(245,240,232,0.55)", maxWidth: 520, lineHeight: 1.75, fontWeight: 300 }}>
                                Browse textbooks, lecture notes, past questions, theses and more uploaded by students and lecturers in <strong style={{ color: "rgba(255,255,255,0.7)" }}>{dept.name}</strong>.
                            </p>
                        </div>

                        {/* upload CTA */}
                        <div className="anim-up-3" style={{ display: "flex", flexDirection: "column", gap: 10, flexShrink: 0 }}>
                            <Link href={`/upload-document?department=${encodeURIComponent(dept.name)}`}
                                style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "12px 22px", background: GOLD, color: NAVY, fontSize: 12, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", textDecoration: "none", fontFamily: "'Lato',sans-serif", transition: "background 0.18s" }}
                                onMouseEnter={e => e.currentTarget.style.background = GOLDD}
                                onMouseLeave={e => e.currentTarget.style.background = GOLD}>
                                <Upload size={13} /> Upload for this Dept <ArrowUpRight size={12} />
                            </Link>
                            <Link href="/departments"
                                style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "11px 22px", border: "0.5px solid rgba(255,255,255,0.2)", color: "rgba(255,255,255,0.65)", fontSize: 12, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", textDecoration: "none", fontFamily: "'Lato',sans-serif", transition: "background 0.18s" }}
                                onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.06)"}
                                onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                                <ArrowLeft size={12} /> All Departments
                            </Link>
                        </div>
                    </div>

                    {/* stats row */}
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 0, borderTop: "0.5px solid rgba(184,150,62,0.2)", marginTop: 40, paddingTop: 0 }}>
                        {[
                            { val: loading ? "…" : `${books.length}${hasMore ? "+" : ""}`, label: "Documents" },
                            { val: dept.faculty, label: "Faculty" },
                            { val: "80%", label: "Seller Share" },
                            { val: "Free", label: "To Browse" },
                        ].map(({ val, label }) => (
                            <div key={label} style={{ flex: "1 1 100px", padding: "20px 18px 0", borderRight: "0.5px solid rgba(184,150,62,0.12)" }}>
                                <div className="lan-serif" style={{ fontSize: 22, fontWeight: 700, color: "#fff" }}>{val}</div>
                                <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(184,150,62,0.65)", marginTop: 3 }}>{label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ══ STICKY SEARCH + FILTERS ════════════════════════════ */}
            <div className="sticky-bar" style={{ padding: "12px 24px" }}>
                <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center" }}>

                    {/* search */}
                    <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
                        <Search size={13} style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", color: "#bbb" }} />
                        <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                            placeholder={`Search ${dept.name} resources…`}
                            style={{ width: "100%", padding: "8px 10px 8px 32px", border: "0.5px solid #e5ddd0", fontSize: 13, color: NAVY, outline: "none", fontFamily: "'Lato',sans-serif", background: "#fafaf8", transition: "border-color 0.18s" }}
                            onFocus={e => e.target.style.borderColor = GOLD}
                            onBlur={e => e.target.style.borderColor = "#e5ddd0"}
                        />
                        {search && <button onClick={() => setSearch("")} style={{ position: "absolute", right: 9, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#bbb", display: "flex" }}><X size={12} /></button>}
                    </div>

                    {/* doc-type pills */}
                    <div className="sbar-none" style={{ display: "flex", gap: 5, overflowX: "auto", flexShrink: 0, maxWidth: "50vw" }}>
                        {DOC_TYPE_FILTERS.map(t => (
                            <button key={t} className={`filter-pill ${docType === t ? "active" : ""}`} onClick={() => setDocType(t)}>{t}</button>
                        ))}
                    </div>

                    {/* level dropdown */}
                    <div style={{ position: "relative", flexShrink: 0 }}>
                        <select value={level} onChange={e => setLevel(e.target.value)}
                            style={{ appearance: "none", padding: "7px 30px 7px 12px", border: "0.5px solid #e5ddd0", fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", color: NAVY, fontFamily: "'Lato',sans-serif", background: "#fff", cursor: "pointer", outline: "none" }}>
                            {LEVEL_FILTERS.map(l => <option key={l}>{l}</option>)}
                        </select>
                        <ChevronDown size={11} style={{ position: "absolute", right: 9, top: "50%", transform: "translateY(-50%)", color: "#aaa", pointerEvents: "none" }} />
                    </div>

                    {/* count */}
                    <span style={{ fontSize: 11, color: "#aaa", fontWeight: 700, flexShrink: 0, marginLeft: "auto" }}>
                        {loading ? "Loading…" : `${filtered.length} result${filtered.length !== 1 ? "s" : ""}`}
                    </span>
                </div>
            </div>

            {/* ══ BOOK GRID ══════════════════════════════════════════ */}
            <section style={{ maxWidth: 1100, margin: "0 auto", padding: "36px 24px 80px" }}>

                {loading ? (
                    /* skeleton */
                    <div className="book-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px,1fr))", gap: 18 }}>
                        {Array.from({ length: 12 }).map((_, i) => (
                            <div key={i} style={{ background: "#fff", border: "0.5px solid #e5ddd0" }}>
                                <div style={{ aspectRatio: "3/4", background: "#f0ebe0", animation: "pulse 1.5s ease-in-out infinite alternate" }} />
                                <div style={{ padding: "10px 10px 14px" }}>
                                    <div style={{ height: 12, background: "#f0ebe0", marginBottom: 6, borderRadius: 2 }} />
                                    <div style={{ height: 10, background: "#f0ebe0", width: "60%", borderRadius: 2 }} />
                                </div>
                            </div>
                        ))}
                        <style>{`@keyframes pulse{from{opacity:.6}to{opacity:1}}`}</style>
                    </div>
                ) : filtered.length === 0 ? (
                    /* empty state */
                    <div className="empty-box">
                        <FileText size={40} style={{ color: "#ddd", margin: "0 auto 14px", display: "block" }} />
                        <h3 className="lan-serif" style={{ fontSize: 22, color: NAVY, marginBottom: 6 }}>
                            {books.length === 0 ? "No documents yet" : "No results match your filters"}
                        </h3>
                        <p style={{ fontSize: 13, color: "#bbb", maxWidth: 380, margin: "0 auto 20px", lineHeight: 1.6 }}>
                            {books.length === 0
                                ? `Be the first to upload a document for ${dept.name}. Your notes could help hundreds of students!`
                                : "Try adjusting your search or clearing the filters."
                            }
                        </p>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "center" }}>
                            {(search || docType !== "All" || level !== "All Levels") && (
                                <button onClick={() => { setSearch(""); setDocType("All"); setLevel("All Levels"); }}
                                    style={{ padding: "9px 18px", border: `0.5px solid ${GOLD}`, background: "transparent", color: GOLD, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "'Lato',sans-serif" }}>
                                    Clear Filters
                                </button>
                            )}
                            <Link href={`/upload-document?department=${encodeURIComponent(dept.name)}`}
                                style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "9px 18px", background: NAVY, color: "#fff", fontSize: 12, fontWeight: 700, textDecoration: "none", fontFamily: "'Lato',sans-serif" }}>
                                <Upload size={12} /> Upload First Document
                            </Link>
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="book-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px,1fr))", gap: 18 }}>
                            {filtered.map((book, i) => (
                                <Link key={book.id}
                                    href={`/book/preview?id=${book.firestoreId}`}
                                    className="book-card"
                                    style={{ animationDelay: `${i * 0.025}s`, animation: "fadeUp 0.45s ease forwards", opacity: 0 }}>

                                    {/* cover */}
                                    <div style={{ position: "relative", background: "#ede8df", overflow: "hidden" }}>
                                        <img src={book.thumbUrl} alt={book.bookTitle}
                                            className="book-img"
                                            onError={e => { e.target.src = "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400"; }} />

                                        {/* PDF badge */}
                                        <div style={{ position: "absolute", top: 8, left: 8, background: NAVY, padding: "3px 8px", display: "inline-flex", alignItems: "center", gap: 4 }}>
                                            <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#22c55e", display: "inline-block" }} />
                                            <span style={{ fontSize: 8, fontWeight: 700, letterSpacing: "0.06em", color: "#fff", fontFamily: "'Lato',sans-serif" }}>PDF</span>
                                        </div>

                                        {/* doc-type badge */}
                                        {book.docType && (
                                            <div style={{ position: "absolute", bottom: 8, left: 8, background: "rgba(13,34,68,0.82)", padding: "2px 7px" }}>
                                                <span style={{ fontSize: 8, fontWeight: 700, letterSpacing: "0.06em", color: GOLD, fontFamily: "'Lato',sans-serif", textTransform: "uppercase" }}>
                                                    {book.docType}
                                                </span>
                                            </div>
                                        )}

                                        {/* level badge */}
                                        {book.level && (
                                            <div style={{ position: "absolute", top: 8, right: 8, background: "rgba(13,34,68,0.7)", padding: "2px 6px" }}>
                                                <span style={{ fontSize: 8, fontWeight: 700, color: "rgba(255,255,255,0.75)", fontFamily: "'Lato',sans-serif" }}>
                                                    {book.level === "pg" ? "PG" : `${book.level}L`}
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    {/* info */}
                                    <div style={{ padding: "10px 10px 12px", borderTop: "0.5px solid #f0ebe0" }}>
                                        <h4 className="lan-serif" style={{ fontSize: 13, fontWeight: 700, color: NAVY, margin: "0 0 3px", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", lineHeight: 1.35 }}>
                                            {book.bookTitle}
                                        </h4>
                                        <p style={{ fontSize: 10, color: "#888", margin: "0 0 6px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontFamily: "'Lato',sans-serif" }}>
                                            {book.author}
                                        </p>
                                        {book.courseCode && (
                                            <span style={{ fontSize: 8, fontWeight: 700, letterSpacing: "0.1em", color: GOLD, border: `0.5px solid rgba(184,150,62,0.35)`, background: CREAM, padding: "2px 6px", fontFamily: "'Lato',sans-serif" }}>
                                                {book.courseCode}
                                            </span>
                                        )}
                                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 8 }}>
                                            <span style={{ fontSize: 12, fontWeight: 700, color: NAVY, fontFamily: "'Lato',sans-serif" }}>
                                                ₦{Number(book.price || 0).toLocaleString()}
                                            </span>
                                            <ChevronRight size={12} style={{ color: "#ccc" }} />
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>

                        {/* load more */}
                        {hasMore && (
                            <div style={{ textAlign: "center", marginTop: 40 }}>
                                <button
                                    onClick={() => fetchBooks(lastDoc)}
                                    disabled={loadingMore}
                                    style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "12px 28px", background: NAVY, color: "#fff", fontSize: 13, fontWeight: 700, border: "none", cursor: loadingMore ? "not-allowed" : "pointer", fontFamily: "'Lato',sans-serif", opacity: loadingMore ? 0.65 : 1 }}>
                                    {loadingMore
                                        ? <><div style={{ width: 14, height: 14, border: "2px solid rgba(255,255,255,.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin .8s linear infinite" }} /> Loading more…</>
                                        : <>Load more <ChevronDown size={14} /></>
                                    }
                                </button>
                            </div>
                        )}
                    </>
                )}
            </section>

            {/* ══ RELATED DEPARTMENTS ════════════════════════════════ */}
            <section style={{ background: "#fff", borderTop: "0.5px solid #e5ddd0", padding: "56px 24px" }}>
                <div style={{ maxWidth: 1100, margin: "0 auto" }}>
                    <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: GOLD, marginBottom: 8, fontFamily: "'Lato',sans-serif" }}>
                        Same Faculty
                    </p>
                    <h2 className="lan-serif" style={{ fontSize: 26, fontWeight: 700, color: NAVY, marginBottom: 24 }}>
                        Related Departments
                    </h2>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px,1fr))", gap: 10 }}>
                        {ALL_DEPARTMENTS.filter(d => d.faculty === dept.faculty && d.slug !== slug).slice(0, 6).map(d => (
                            <Link key={d.slug} href={`/department/${d.slug}`}
                                style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "13px 16px", border: "0.5px solid #e5ddd0", background: BG, textDecoration: "none", transition: "border-color 0.18s, background 0.18s" }}
                                onMouseEnter={e => { e.currentTarget.style.borderColor = GOLD; e.currentTarget.style.background = CREAM; }}
                                onMouseLeave={e => { e.currentTarget.style.borderColor = "#e5ddd0"; e.currentTarget.style.background = BG; }}>
                                <span style={{ fontSize: 12, fontWeight: 700, color: NAVY, fontFamily: "'Lato',sans-serif", lineHeight: 1.3 }}>{d.name}</span>
                                <ChevronRight size={12} style={{ color: GOLD, flexShrink: 0 }} />
                            </Link>
                        ))}
                        <Link href="/departments"
                            style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "13px 16px", border: `0.5px solid ${GOLD}`, background: "transparent", textDecoration: "none" }}>
                            <span style={{ fontSize: 12, fontWeight: 700, color: GOLD, fontFamily: "'Lato',sans-serif" }}>All Departments</span>
                            <ChevronRight size={12} style={{ color: GOLD }} />
                        </Link>
                    </div>
                </div>
            </section>

            <Footer />
        </div>
    );
}