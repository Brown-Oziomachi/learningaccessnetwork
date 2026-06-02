"use client";
import React, { useState, useEffect } from "react";
import {
    FileText, Monitor, Upload, ShoppingBag, Smartphone,
    ArrowRight, ChevronRight, BookOpen, GraduationCap,
    Building2, Book, Search, Star, TrendingUp, Users,
    Award, BookMarked, Layers, FileQuestion, Sparkles,
} from "lucide-react";
import Link from "next/link";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";
import {
    doc, getDoc, collection, query, orderBy,
    limit, getDocs, where,
} from "firebase/firestore";
import HomeLoading from "./loading";
import Footer from "@/components/FooterComp";
import Navbar from "@/components/NavBar";
import { auth, db } from "@/lib/firebaseConfig";
import { useAds, injectAds } from "@/lib/useAds";
import FeaturedAdsCarousel from "@/components/FeaturedAdsCarousel";
import HomeBountyStrip from "@/components/HomeBountyStrip";
import { useCurrency } from "../context/CurrencyContext";

/* ─── colour tokens ─────────────────────────────────────────── */
const NAVY = "#0d2244";
const GOLD = "#b8963e";
const GOLDD = "#d4aa5a";
const CREAM = "#f5f0e8";
const BG = "#f5f1ea";        // warm parchment page bg

/* ─── data ───────────────────────────────────────────────────── */
const documentTypes = [
    { name: "Textbook", slug: "textbook", image: "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=400", description: "Standard educational books" },
    { name: "Lecture Note", slug: "lecture-note", image: "https://images.unsplash.com/photo-1517842645767-c639042777db?w=400", description: "Summarized class materials" },
    { name: "Past Question", slug: "past-question", image: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=400", description: "Previous exam papers" },
    { name: "Thesis", slug: "thesis", image: "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=400", description: "Academic research papers" },
    { name: "Summary", slug: "summary", image: "https://images.unsplash.com/photo-1455390582262-044cdead277a?w=400", description: "Quick study breakdowns" },
    { name: "Syllabus", slug: "syllabus", image: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=400", description: "Course requirements" },
    { name: "Course Outline", slug: "course-outline", image: "https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?w=400", description: "Topic distributions" },
    { name: "signment", slug: "assignment", image: "https://images.unsplash.com/photo-1488190211105-8b0e65b80b4e?w=400", description: "Practice tasks and projects" },
    { name: "Project", slug: "project", image: "https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=400", description: "Detailed student projects" },
    { name: "Lab Manual", slug: "lab-manual", image: "https://images.unsplash.com/photo-1582719508461-905c673771fd?w=400", description: "Practical guides and lab reports" },
    { name: "Handwritten Notes", slug: "handwritten-notes", image: "https://images.unsplash.com/photo-1503467913725-8484b65b0715?w=400", description: "Authentic student class notes" },
    { name: "Exam Revision", slug: "exam-revision", image: "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=400", description: "Highly focused exam prep materials" },


];

const categories = [
    { name: "Mathematics", slug: "mathematics", faculty: "Sciences", sub: 11, image: "https://images.unsplash.com/photo-1509228468518-180dd4864904?w=600", description: "Calculus, algebra, statistics, and pure mathematics" },
    { name: "Mass Communication", slug: "mass-communication", faculty: "Arts & Social", sub: 7, image: "https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=600", description: "Journalism, broadcasting, public relations and digital media" },
    { name: "Public Administration", slug: "public-administration", faculty: "Arts & Social", sub: 7, image: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=600", description: "Governance, public policy, local government and civil service" },
    { name: "Medicine & Health Sciences", slug: "medicine-health-sciences", faculty: "Sciences", sub: 14, image: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=600", description: "Anatomy, physiology, clinical studies and medical education resources" },
    { name: "Pharmacy", slug: "pharmacy", faculty: "Sciences", sub: 9, image: "https://images.unsplash.com/photo-1585435557343-3b092031a831?w=600", description: "Drug classifications, pharmacology notes and pharmacy practice" },
    { name: "Nursing", slug: "nursing", faculty: "Sciences", sub: 7, image: "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=600", description: "Clinical procedures, care plans and nursing education materials" },
    { name: "Biochemistry", slug: "biochemistry", faculty: "Sciences", sub: 8, image: "https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=600", description: "Metabolic pathways, enzymes, molecular biology and cell chemistry" },
    { name: "Microbiology", slug: "microbiology", faculty: "Sciences", sub: 7, image: "https://images.unsplash.com/photo-1576319155264-99536e0be1ee?w=600", description: "Bacteria, viruses, fungi and applied microbiology research" },
    { name: "Biology", slug: "biology", faculty: "Sciences", sub: 9, image: "https://images.unsplash.com/photo-1530026405186-ed1f139313f8?w=600", description: "Ecology, genetics, zoology, botany and life sciences" },
    { name: "Chemistry", slug: "chemistry", faculty: "Sciences", sub: 10, image: "https://images.unsplash.com/photo-1603126857599-f6e157fa2fe6?w=600", description: "Organic, inorganic, physical chemistry and laboratory practice" },
    { name: "Physics", slug: "physics", faculty: "Sciences", sub: 8, image: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=600", description: "Mechanics, electromagnetism, quantum physics and modern science" },
    { name: "Statistics", slug: "statistics", faculty: "Sciences", sub: 7, image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600", description: "Data analysis, probability theory and applied statistics" },
    { name: "Veterinary Medicine", slug: "veterinary-medicine", faculty: "Sciences", sub: 6, image: "https://images.unsplash.com/photo-1596854407944-bf87f6fdd49e?w=600", description: "Animal health, veterinary surgery and clinical sciences" },
    { name: "Law", slug: "law", faculty: "Arts & Social", sub: 12, image: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=600", description: "Constitutional law, criminal law, contracts and legal practice" },
    { name: "Nutrition & Dietetics", slug: "nutrition-dietetics", faculty: "Sciences", sub: 6, image: "https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=600", description: "Food science, dietary guidelines and clinical nutrition" },
    { name: "Optometry", slug: "optometry", faculty: "Sciences", sub: 5, image: "https://images.unsplash.com/photo-1511174511562-5f7f18b874f8?w=600", description: "Eye care, visual science and ophthalmic practice" },
];

const trendingAcademicAreas = [
    { id: "universities", name: "Universities", slug: "university", icon: GraduationCap, description: "Undergraduate and postgraduate academic resources across all disciplines" },
    { id: "islamic", name: "Islamic Institutions", slug: "islamic-institutions", icon: Building2, description: "Quranic studies, Islamic jurisprudence, and Islamic education" },
    { id: "christian", name: "Christian Institutions", slug: "christian-institutions", icon: Book, description: "Biblical studies, theology, and Christian education materials" },
    { id: "secondary", name: "Secondary School", slug: "secondary-school", icon: BookOpen, description: "Complete curriculum materials for SS1, SS2, and SS3 students" },
    { id: "waec", name: "WAEC / NECO / JAMB", slug: "exam-prep", icon: FileQuestion, description: "Past questions and preparation materials for major examinations" },
    { id: "polytechnic", name: "Polytechnics", slug: "polytechnic", icon: Award, description: "ND and HND technical and vocational education resources" },
    { id: "postgraduate", name: "Postgraduate Studies", slug: "postgraduate", icon: BookMarked, description: "Masters, PhD and research materials across all disciplines" },
    { id: "professional", name: "Professional Certs", slug: "professional-cert", icon: Star, description: "ICAN, ACCA, CFA, PMP and other professional qualifications" },
];

/* ─── helper ─────────────────────────────────────────────────── */
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
    return book.image || null; };

/* ════════════════════════════════════════════════════════════════
   COMPONENT
════════════════════════════════════════════════════════════════ */
export default function HomeClient() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [allBooks, setAllBooks] = useState([]);
    const [loadingBooks, setLoadingBooks] = useState(true);
    const [isSeller, setIsSeller] = useState(false);
    const [checkingSeller, setCheckingSeller] = useState(true);
    const [purchasedBookIds, setPurchasedBookIds] = useState(new Set());
    const [activeTab, setActiveTab] = useState("subjects");
    const [bookSalesCount, setBookSalesCount] = useState({});
    const [browseSearch, setBrowseSearch] = useState("");
    const [selectedAds, setSelectedAds] = useState([]);
  const { fmt } = useCurrency();

    const router = useRouter();
    const goldAds = useAds("Gold", 10);
    const silverAds = useAds("Silver", 10);
    const topAd = useAds("Gold", 10);   // ← ADD THIS


    const topAdIds = new Set(topAd.map(a => a.adId));
    const gridGoldAds = goldAds.filter(a => !topAdIds.has(a.adId));
    const gridSilverAds = silverAds.filter(a => !topAdIds.has(a.adId));

    const filteredCategories = categories.filter(c =>
        c.name.toLowerCase().includes(browseSearch.toLowerCase()) ||
        c.description.toLowerCase().includes(browseSearch.toLowerCase())
    );
    const filteredDocTypes = documentTypes.filter(d =>
        d.name.toLowerCase().includes(browseSearch.toLowerCase()) ||
        d.description.toLowerCase().includes(browseSearch.toLowerCase())
    );


    useEffect(() => {
        const combined = [...(goldAds || []), ...(silverAds || [])];
        if (combined.length === 0) return;

        const shuffled = [...combined];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        setSelectedAds(shuffled.slice(0, 5));
    }, [goldAds, silverAds]);

    /* sales */
    useEffect(() => {
        const fetchSales = async () => {
            try {
                const snap = await getDocs(collection(db, "users"));
                const map = {};
                snap.docs.forEach(u => {
                    Object.values(u.data().purchasedBooks || {}).forEach(p => {
                        const id = p.bookId || p.id || p.firestoreId;
                        if (id) { map[id] = (map[id] || 0) + 1; map[`firestore-${id}`] = (map[`firestore-${id}`] || 0) + 1; }
                    });
                });
                setBookSalesCount(map);
            } catch { }
        };
        fetchSales();
    }, []);

    /* books */

    useEffect(() => {
        const fetchBooks = async () => {
            try {
                setLoadingBooks(true);
                const q = query(
                    collection(db, "advertMyBook"),
                    where("status", "==", "approved"),
                    limit(40)
                );
                const snap = await getDocs(q);
                if (!snap.empty) {
                    const books = [];
                    snap.forEach(d => {
                        console.log("Doc ID:", d.id, "| Data:", d.data()); // ← ADD THIS
                        const data = d.data();
                        if (data.bookTitle && data.price !== undefined) {
                            const b = {
                                id: `firestore-${d.id}`,
                                firestoreId: d.id,
                                title: data.bookTitle,
                                author: data.author || "Unknown",
                                category: (data.category || "education").toLowerCase(),
                                price: Number(data.price) || 0,
                                driveFileId: data.driveFileId,
                                pdfUrl: data.pdfUrl,
                                embedUrl: data.embedUrl,
                                isFromFirestore: true,
                                createdAt: data.createdAt,
                            };
                            b.image = getThumbnailUrl(b);
                            books.push(b);
                        }
                    });
                    setAllBooks(books); // set books first without sorting by sales
                } else {
                    setAllBooks([]);
                }
            } catch (e) {
                console.error("Books fetch error:", e); // ADD THIS
                setAllBooks([]);
            } finally {
                setLoadingBooks(false);
            }
        };
        fetchBooks();
    }, []); // ← Empty dependency, runs once on mount

    /* purchased */
    useEffect(() => {
        const fetchPurchased = async () => {
            try {
                const cu = auth.currentUser;
                if (!cu) return;
                const ud = await getDoc(doc(db, "users", cu.uid));
                if (ud.exists()) {
                    const pb = ud.data().purchasedBooks || {};
                    const arr = Array.isArray(pb) ? pb : Object.values(pb);
                    setPurchasedBookIds(new Set(arr.map(b => b.id || b.bookId || b.firestoreId).filter(Boolean)));
                }
            } catch { }
        };
        if (user) fetchPurchased();
    }, [user]);

    const isPurchased = id =>
        purchasedBookIds.has(id) || purchasedBookIds.has(`firestore-${id}`) ||
        purchasedBookIds.has(String(id).replace("firestore-", ""));

    /* auth */
    useEffect(() => {
        const unsub = onAuthStateChanged(auth, async cu => {
            if (cu) {
                setUser(cu);
                try {
                    setCheckingSeller(true);
                    const ud = await getDoc(doc(db, "users", cu.uid));
                    setIsSeller(ud.exists() ? ud.data().isSeller === true : false);
                } catch { setIsSeller(false); }
                finally { setCheckingSeller(false); }
            } else {
                setUser(null); setIsSeller(false); setCheckingSeller(false);
            }
            setLoading(false);
        });
        const t = setTimeout(() => setLoading(false), 1200);
        return () => { unsub(); clearTimeout(t); };
    }, []);

    const HandleClick = () => {
        if (!user) { router.push("/auth/signin"); return; }
        router.push(isSeller ? "/upload-document" : "/become-seller");
    };

    if (loading) return <HomeLoading />;

    return (
        <>
            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400&family=Lato:wght@300;400;700&display=swap');

        .lan-root { font-family: 'Lato', sans-serif; background: ${BG}; }
        .lan-serif { font-family: 'Playfair Display', Georgia, serif; }

        /* hero */
        .hero-bg {
          background-color: ${NAVY};
          background-image:
            radial-gradient(rgba(184,150,62,0.06) 1px, transparent 1px),
            radial-gradient(rgba(255,255,255,0.03) 1px, transparent 1px);
          background-size: 28px 28px, 14px 14px;
          background-position: 0 0, 7px 7px;
        }

        /* trending section */
        .trending-bg {
          background-color: ${CREAM};
          background-image: radial-gradient(rgba(13,34,68,0.05) 1px, transparent 1px);
          background-size: 22px 22px;
        }

        /* trend card */
        .trend-card {
          background: #fff;
          border: 0.5px solid #e5ddd0;
          transition: transform 0.25s cubic-bezier(0.4,0,0.2,1), box-shadow 0.25s, border-color 0.25s;
          text-decoration: none; display: block;
        }
        .trend-card:hover { transform: translateY(-6px); box-shadow: 0 20px 48px rgba(13,34,68,0.12); border-color: ${GOLD}; }

        /* browse card */
        .browse-card {
          border: 0.5px solid #e5ddd0; overflow: hidden;
          background: #fff; text-decoration: none; display: block;
          transition: transform 0.25s, box-shadow 0.25s, border-color 0.25s;
        }
        .browse-card:hover { transform: translateY(-5px); box-shadow: 0 16px 40px rgba(13,34,68,0.12); border-color: ${GOLD}; }
        .browse-card:hover .browse-img { transform: scale(1.07); }
        .browse-img { transition: transform 0.6s cubic-bezier(0.4,0,0.2,1); }

        /* doc card */
        .doc-card {
          border: 0.5px solid #e5ddd0; overflow: hidden; background: ${CREAM}; cursor: pointer;
          transition: transform 0.22s, box-shadow 0.22s, border-color 0.22s;
        }
        .doc-card:hover { transform: translateY(-4px); box-shadow: 0 12px 32px rgba(13,34,68,0.12); border-color: ${GOLD}; }
        .doc-card:hover .doc-img { transform: scale(1.08); }
        .doc-img { transition: transform 0.5s cubic-bezier(0.4,0,0.2,1); }

        /* tabs */
        .lan-tab {
          font-size: 11px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase;
          padding: 10px 22px; border: none; cursor: pointer;
          transition: background 0.18s, color 0.18s; font-family: 'Lato', sans-serif;
        }
        .lan-tab-active  { background: ${NAVY}; color: #fff; }
        .lan-tab-inactive { background: rgba(13,34,68,0.06); color: #777; }
        .lan-tab-inactive:hover { background: rgba(13,34,68,0.1); color: ${NAVY}; }

        /* sbar hide */
        .sbar-none { scrollbar-width: none; -ms-overflow-style: none; }
        .sbar-none::-webkit-scrollbar { display: none; }

        /* book grid hover */
        .book-thumb { transition: box-shadow 0.2s; }
        .book-thumb:hover { box-shadow: 0 8px 28px rgba(13,34,68,0.18); }

        /* gold line divider */
        .gold-line { display: flex; align-items: center; gap: 14px; }
        .gold-line::before, .gold-line::after { content:""; flex:1; height:1px; background: rgba(184,150,62,0.3); }

        /* crest cta bg */
        .crest-bg {
          background-color: ${NAVY};
          background-image:
            repeating-linear-gradient(45deg, transparent, transparent 12px, rgba(255,255,255,0.018) 12px, rgba(255,255,255,0.018) 13px),
            repeating-linear-gradient(-45deg, transparent, transparent 12px, rgba(255,255,255,0.018) 12px, rgba(255,255,255,0.018) 13px);
        }

        @keyframes slideUp { from { opacity:0; transform:translateY(24px); } to { opacity:1; transform:translateY(0); } }
        .anim-up { animation: slideUp 0.6s cubic-bezier(0.4,0,0.2,1) both; }
        .anim-up-2 { animation: slideUp 0.6s 0.12s cubic-bezier(0.4,0,0.2,1) both; }
        .anim-up-3 { animation: slideUp 0.6s 0.24s cubic-bezier(0.4,0,0.2,1) both; }

        @media(max-width:640px){
        .browse-card-grid { grid-template-columns: 1fr 1fr !important; }
        .doc-card-grid { grid-template-columns: 1fr 1fr !important; }
        }
      `}</style>

            <div className="lan-root min-h-screen">
                <Navbar />

                {/* ══════════════════════════════════════════════════════════
            HERO — navy dot-grid
        ══════════════════════════════════════════════════════════ */}
                <section style={{ position: "relative", padding: "80px 24px 0", overflow: "hidden" }}>

                    {/* ── IMAGE 1: Full-width background (text sits on top) ── */}
                    <img
                        src="/lanstu.png"
                        alt="LAN Library hero background"
                        style={{
                            position: "absolute", inset: 0,
                            width: "100%", height: "100%",
                            objectFit: "cover", objectPosition: "center",
                            display: "block",
                        }}
                    />

                    {/* ── Dark overlay ── */}
                    <div style={{
                        position: "absolute", inset: 0,
                        background: "linear-gradient(to bottom, rgba(11,30,65,0.80) 0%, rgba(10,24,58,0.55) 60%, rgba(10,34,48,0.75) 100%)",
                    }} />

                    {/* ── dot-grid pattern ── */}
                    <div style={{
                        position: "absolute", inset: 0,
                        backgroundImage: `radial-gradient(rgba(184,150,62,0.06) 1px, transparent 1px), radial-gradient(rgba(255,255,255,0.03) 1px, transparent 1px)`,
                        backgroundSize: "28px 28px, 14px 14px",
                        backgroundPosition: "0 0, 7px 7px",
                    }} />

                    {/* ── Content row: text LEFT + IMAGE 2 framed RIGHT ── */}
                    <div style={{
                        position: "relative", zIndex: 2,
                        maxWidth: "1200px", margin: "0 auto",
                        display: "flex", alignItems: "center",
                        gap: "48px", flexWrap: "wrap",
                    }}>

                        {/* LEFT: all text */}
                        <div style={{ flex: "1 1 460px" }}>

                            {/* eyebrow */}
                            <div className="anim-up" style={{
                                display: "inline-flex", alignItems: "center", gap: "8px",
                                background: "rgba(184,150,62,0.14)",
                                border: `1px solid rgba(184,150,62,0.3)`,
                                borderRadius: "999px", padding: "7px 16px", marginBottom: "28px"
                            }}>
                                <Sparkles size={13} style={{ color: GOLD }} />
                                <span style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: GOLDD }}>
                                    Africa's #1 Student Library
                                </span>
                            </div>

                            <h1 className="lan-serif anim-up-2" style={{
                                fontSize: "clamp(42px, 7vw, 78px)", fontWeight: 900,
                                color: "#fff", lineHeight: 1.02, letterSpacing: "-1.10px", margin: "0 0 24px"
                            }}>
                                [LAN LIBRARY]<br />
                                <span style={{ color: GOLD, fontStyle: "italic", fontSize: "30px" }}>
                                    | Africa's Academic EdTech Marketplace.
                                </span>
                            </h1>

                            <p className="anim-up-3" style={{
                                fontSize: "17px", color: "rgba(245,240,232,0.72)",
                                maxWidth: "580px", lineHeight: 1.75, margin: "0 0 40px", fontWeight: 300
                            }}>
                                Join Africa's largest digital academic repository, bridging the gap between educators
                                and learners. We securely preserve and distribute vital university textbooks, lecturer
                                handouts, and research materials, giving you instant, borderless access to complete
                                academic knowledge from institutions across your country and beyond.
                            </p>
                        </div>

                        {/* RIGHT: IMAGE 2 — framed portrait beside the text */}
                        <div className="anim-up-3" style={{
                            flex: "1 1 300px",
                            display: "flex", justifyContent: "center", alignItems: "center",
                        }}>
                            <div style={{
                                position: "relative",
                                width: "100%",
                                maxWidth: "360px",
                                aspectRatio: "4/5",
                                border: `1px solid rgba(184,150,62,0.35)`,
                                boxShadow: "0 32px 80px rgba(0,0,0,0.5)",
                                overflow: "hidden",
                            }}>
                                <img
                                    src="/stud.png"
                                    alt="LAN Library students"
                                    style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                                    onError={e => {
                                        e.target.src = "/stud2.png";
                                    }}
                                    />

                                {/* gold corner accents */}
                                <div style={{ position: "absolute", top: 0, left: 0, width: "28px", height: "28px", borderTop: `2px solid ${GOLD}`, borderLeft: `2px solid ${GOLD}` }} />
                                <div style={{ position: "absolute", top: 0, right: 0, width: "28px", height: "28px", borderTop: `2px solid ${GOLD}`, borderRight: `2px solid ${GOLD}` }} />
                                <div style={{ position: "absolute", bottom: 0, left: 0, width: "28px", height: "28px", borderBottom: `2px solid ${GOLD}`, borderLeft: `2px solid ${GOLD}` }} />
                                <div style={{ position: "absolute", bottom: 0, right: 0, width: "28px", height: "28px", borderBottom: `2px solid ${GOLD}`, borderRight: `2px solid ${GOLD}` }} />

                                {/* bottom label */}
                                <div style={{
                                    position: "absolute", bottom: 0, left: 0, right: 0,
                                    background: "rgba(13,34,68,0.78)", padding: "10px 16px",
                                    backdropFilter: "blur(4px)"
                                }}>
                                    <p style={{
                                        fontFamily: "'Lato',sans-serif", fontSize: "9px", fontWeight: 700,
                                        letterSpacing: "0.18em", textTransform: "uppercase", color: GOLD, margin: 0
                                    }}>
                                        Africa's Academic EdTech Marketplace
                                    </p>
                                </div>
                            </div>
                        </div>

                    </div>

                    {/* ── Stats strip ── */}
                    <div style={{
                        position: "relative", zIndex: 2,
                        borderTop: "0.5px solid rgba(184,150,62,0.2)",
                        marginTop: "48px", display: "flex", flexWrap: "wrap"
                    }}>
                        {[
                            { val: "90M+", label: "Documents" },
                            { val: "2.4M+", label: "Learners" },
                            { val: "200+", label: "Institutions" },
                            { val: "Free", label: "Basic Access" },
                        ].map(({ val, label }) => (
                            <div key={label} style={{
                                flex: "1 1 120px", padding: "24px 20px",
                                borderRight: "0.5px solid rgba(184,150,62,0.12)"
                            }}>
                                <div className="lan-serif" style={{ fontSize: "28px", fontWeight: 700, color: "#fff" }}>{val}</div>
                                <div style={{
                                    fontSize: "11px", fontWeight: 700, letterSpacing: "0.1em",
                                    textTransform: "uppercase", color: "rgba(184,150,62,0.7)", marginTop: "4px"
                                }}>{label}</div>
                            </div>
                        ))}
                    </div>

                </section>

                {/* ── TOP FEATURED AD ── */}
                {topAd.length > 0 && (
                    <div style={{ background: CREAM, borderBottom: "0.5px solid #e5ddd0", padding: "24px" }}>
                        <style>{`
            .top-ads-grid {
                display: grid;
                grid-template-columns: repeat(4, 1fr);
                gap: 12px;
                max-width: 1200px;
                margin: 0 auto;
            }
            @media (max-width: 640px) {
                .top-ads-grid {
                    grid-template-columns: repeat(2, 1fr);
                }
            }
            .top-ad-card {
                background: #fff;
                border: 0.5px solid #e5ddd0;
                display: flex;
                align-items: center;
                gap: 10px;
                padding: 12px;
                text-decoration: none;
                transition: border-color 0.18s;
                overflow: hidden;
            }
            .top-ad-card:hover { border-color: ${GOLD}; }
        `}</style>

                        <p style={{
                            fontSize: 20, fontWeight: 700, letterSpacing: '.18em', textTransform: 'uppercase',
                            color: NAVY, fontFamily: "'Playfair Display', serif", margin: '0 0 10px', textAlign: 'center'
                        }}>
                            RECOMMENDED FOR YOU
                        </p>

                        <div className="top-ads-grid">
                            {topAd.slice(0, 4).map((ad, idx) => (
                                <a
                                    key={ad.adId || idx}
                                    href={ad.adLink || "#"}
                                    className="top-ad-card"
                                    onClick={() => {
                                        import("firebase/firestore").then(({ doc: fDoc, updateDoc, increment }) => {
                                            import("@/lib/firebaseConfig").then(({ db: fDb }) => {
                                                updateDoc(fDoc(fDb, "promotions", ad.adId), { clicks: increment(1) }).catch(() => { });
                                            });
                                        });
                                    }}
                                >
                                    {/* Thumbnail */}
                                    {ad.image && (
                                        <img
                                            src={ad.image}
                                            alt={ad.title}
                                            style={{
                                                width: "44px",
                                                aspectRatio: "3/4",
                                                objectFit: "cover",
                                                flexShrink: 0,
                                                border: "0.5px solid #e5ddd0",
                                            }}
                                            onError={e => { e.target.style.display = "LAN Documents"; }}
                                        />
                                    )}

                                    {/* Text */}
                                    <div style={{ minWidth: 0, flex: 1 }}>
                                        <p style={{ fontFamily: "'Playfair Display',serif", fontSize: "12px", fontWeight: 700, color: NAVY, margin: "0 0 2px", overflow: "hidden", }}>
                                            {ad.title}
                                        </p>
                                        {ad.author && (
                                            <p style={{ fontSize: "10px", color: "#888", margin: "0 0 4px", fontFamily: "'Lato',sans-serif", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                                {ad.author}
                                            </p>
                                        )}
                                        {ad.price && (
                                            <p style={{ fontSize: "11px", fontWeight: 700, color: NAVY, margin: 0, fontFamily: "'Lato',sans-serif" }}>
                                                {fmt(Number(ad.price))}
                                            
                                            </p>
                                        )}
                                    </div>

                                    {/* AD badge */}
                                    <span style={{ flexShrink: 0, alignSelf: "flex-start", fontSize: "8px", fontWeight: 700, letterSpacing: "0.1em", color: GOLD, border: `0.5px solid ${GOLD}`, padding: "2px 5px", fontFamily: "'Lato',sans-serif" }} className="max-lg:hidden">
                                        SPONSORED
                                    </span>
                                    <span style={{ flexShrink: 0, alignSelf: "flex-start", fontSize: "8px", fontWeight: 700, letterSpacing: "0.1em", color: GOLD, border: `0.5px solid ${GOLD}`, padding: "2px 5px", fontFamily: "'Lato',sans-serif" }} className="lg:hidden">
                                        AD
                                    </span>
                                </a>
                            ))}
                        </div>
                    </div>
                )}

            <HomeBountyStrip />

                {/* ══════════════════════════════════════════════════════════
    UNIVERSITY HUBS
══════════════════════════════════════════════════════════ */}
                <section style={{ background: "#fff", padding: "72px 24px", borderTop: "0.5px solid #e5ddd0" }}>
                    <div style={{ maxWidth: "1200px", margin: "0 auto" }}>

                        {/* Header */}
                        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: "36px", flexWrap: "wrap", gap: 12 }}>
                            <div>
                                <p style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", color: GOLD, marginBottom: "8px", fontFamily: "'Lato', sans-serif" }}>
                                    Find Your Institution
                                </p>
                                <h2 className="lan-serif" style={{ fontSize: "clamp(26px, 4vw, 40px)", fontWeight: 700, color: NAVY, margin: 0 }}>
                                    African University Hubs
                                </h2>
                                <p style={{ fontSize: "13px", color: "#888", margin: "8px 0 0", fontWeight: 300, fontFamily: "'Lato',sans-serif" }}>
                                    Course materials organized by your specific campus and uploaded directly by verified university faculties.
                                </p>
                            </div>
                            <Link href="/uni"
                                style={{ display: "inline-flex", alignItems: "center", gap: "5px", fontSize: "12px", fontWeight: 700, color: NAVY, textDecoration: "none", letterSpacing: "0.04em", border: "0.5px solid #e5ddd0", padding: "9px 16px", whiteSpace: "nowrap" }}>
                                All Universities <ArrowRight size={13} />
                            </Link>
                        </div>

                        {/* University Picker Grid */}
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "12px" }}>
                            {[
                                { slug: "unn", name: "University of Nigeria, Nsukka", short: "UNN", state: "Enugu" },
                                { slug: "ubuea", name: "University of Buea", short: "UB", state: "Buea" },
                                { slug: "ug", name: "University of Ghana", short: "UG", state: "Accra" },
                                { slug: "uon_ke", name: "University of Nairobi", short: "UoN", state: "Nairobi" },
                                { slug: "unisa", name: "University of South Africa", short: "unisa", state: "Pretoria" },
                                { slug: "aau", name: "Addis Ababa University", short: "AAU", state: "Addis Ababa" },
                                { slug: "uam", name: "Abdou Moumouni University", short: "UAM", state: "Niamey" },
                                { slug: "usthb", name: "University of Science and Technology Houari Boumediene", short: "USTHB", state: "Algiers" },
                                { slug: "utripoli", name: "University of Tripoli", short: "UoT", state: "Tripoli" },
                                { slug: "ulo", name: "University of Lomé", short: "UL", state: "Lomé" },
                            ].map(uni => (
                                <Link key={uni.slug} href={`/uni/${uni.slug}`}
                                    style={{ textDecoration: "none", display: "block" }}>
                                    <div className="trend-card" style={{ padding: "18px 16px", cursor: "pointer" }}>
                                        {/* Short name badge */}
                                        <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", background: NAVY, padding: "4px 10px", marginBottom: "12px" }}>
                                            <span style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.1em", color: GOLD, fontFamily: "'Lato',sans-serif" }}>{uni.short}</span>
                                        </div>
                                        {/* Full name */}
                                        <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: "13px", fontWeight: 700, color: NAVY, margin: "0 0 5px", lineHeight: 1.35, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                                            {uni.name}
                                        </h3>
                                        {/* State */}
                                        <p style={{ fontSize: "10px", color: "#bbb", fontFamily: "'Lato',sans-serif", margin: "0 0 14px", display: "flex", alignItems: "center", gap: 4 }}>
                                            <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
                                            {uni.state}
                                        </p>
                                        {/* CTA */}
                                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderTop: "0.5px solid #f0ebe0", paddingTop: "12px" }}>
                                            <span style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: GOLD, fontFamily: "'Lato',sans-serif" }}>Browse Hub</span>
                                            <ChevronRight size={13} style={{ color: GOLD }} />
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>

                        {/* Bottom CTA strip */}
                        <div style={{ marginTop: "24px", background: NAVY, backgroundImage: "radial-gradient(rgba(184,150,62,0.06) 1px,transparent 1px)", backgroundSize: "22px 22px", padding: "20px 28px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 14 }}>
                            <div>
                                <p style={{ fontSize: "12px", fontWeight: 700, color: "#fff", fontFamily: "'Lato',sans-serif", margin: "0 0 3px" }}>
                                    Don't see your university?
                                </p>
                                <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)", fontFamily: "'Lato',sans-serif", margin: 0 }}>
                                    We're adding more institutions every week.
                                </p>
                            </div>
                            <Link href="/uni"
                                style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "10px 20px", background: GOLD, color: NAVY, fontSize: "11px", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", textDecoration: "none", fontFamily: "'Lato',sans-serif", whiteSpace: "nowrap" }}>
                                View All Hubs <ArrowRight size={12} />
                            </Link>
                        </div>

                    </div>
                </section>


                <section style={{ background: CREAM, padding: "72px 24px" }}>
                    <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
                        <p style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", color: GOLD, marginBottom: "8px", fontFamily: "'Lato', sans-serif" }}>
                            Community Uploads
                        </p>
                        <h2 className="lan-serif" style={{ fontSize: "clamp(28px, 4vw, 42px)", fontWeight: 700, color: NAVY, margin: "0 0 6px" }}>
                            Newest Documents
                        </h2>
                        <p style={{ fontSize: "14px", color: "#888", marginBottom: "36px", fontWeight: 300 }}>
                            Fresh uploads from students and educators across Africa
                        </p>

                        {allBooks.length === 0 ? (
                            <div style={{ background: NAVY, border: `0.5px solid #e5ddd0`, padding: "64px 24px", textAlign: "center" }}>
                                <FileText style={{ width: "48px", height: "48px", color: "#ddd", margin: "0 auto 12px" }} />
                                <h3 className="lan-serif" style={{ fontSize: "22px", color: GOLD, marginBottom: "8px" }}>Looks like you're offline.</h3>
                                <p style={{ fontSize: "13px", color: "#aaa", marginBottom: "20px" }}>This document is not ready for offline use.</p>
                                <Link href="/docs" style={{ display: "inline-block", padding: "10px 24px", background: GOLD, color: NAVY, fontSize: "13px", fontWeight: 700, textDecoration: "none" }}>
                                    LAN Docs
                                </Link>
                            </div>
                        ) : (
                            <>
                                {/* ── Row 1: books 0-5 ── */}
                                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: "20px", marginBottom: "24px" }}>
                                    {allBooks.slice(0, 6).map(book => {
                                        const soldCount = bookSalesCount[book.id] || bookSalesCount[book.firestoreId] || 0;
                                        const topSold = allBooks.slice(0, 12).reduce((m, b) => Math.max(m, bookSalesCount[b.id] || 0), 0);
                                        const isTrending = soldCount > 0 && soldCount === topSold;
                                        const owned = isPurchased(book.id);

                                        if (book.isAd) {
                                            return (
                                                <a key={book.id} href={book.adLink} style={{ textDecoration: "none", display: "block", background: "#fff" }}
                                                    onClick={() => {
                                                        import("firebase/firestore").then(({ doc: fDoc, updateDoc, increment }) => {
                                                            import("@/lib/firebaseConfig").then(({ db: fDb }) => {
                                                                updateDoc(fDoc(fDb, "promotions", book.adId), { clicks: increment(1) }).catch(() => { });
                                                            });
                                                        });
                                                    }}
                                                >
                                                    <div style={{ position: "relative", background: "#ede8df" }}>
                                                        <img src={book.image} alt={book.title}
                                                            style={{ width: "100%", aspectRatio: "3/4", objectFit: "cover", display: "block" }}
                                                            onError={e => { e.target.src = "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400"; }}
                                                        />
                                                        <div style={{ position: "absolute", top: "8px", left: "8px", display: "inline-flex", alignItems: "center", gap: "4px", background: NAVY, padding: "3px 8px", fontSize: "9px", fontWeight: 700, letterSpacing: "0.06em", color: "#fff", fontFamily: "'Lato',sans-serif" }}>
                                                            <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: "#22c55e", display: "inline-block" }} />PDF
                                                        </div>
                                                        <div style={{ position: "absolute", top: "8px", right: "8px", background: GOLD, color: NAVY, fontSize: "9px", fontWeight: 700, padding: "3px 8px", fontFamily: "'Lato',sans-serif" }}>AD</div>
                                                        <div style={{ position: "absolute", bottom: "8px", left: "8px", background: "rgba(13,34,68,0.82)", padding: "3px 8px", fontSize: "9px", fontWeight: 700, color: GOLD, fontFamily: "'Lato',sans-serif" }}>
                                                            {book.adTier.toUpperCase()} SPONSOR
                                                        </div>
                                                    </div>
                                                    <div style={{ padding: "10px 10px 12px", borderTop: "0.5px solid #f0ebe0" }}>
                                                        <h4 style={{ fontFamily: "'Playfair Display',serif", fontSize: "13px", fontWeight: 700, color: NAVY, margin: "0 0 3px", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", lineHeight: 1.35 }}>{book.title}</h4>
                                                        <p style={{ fontSize: "11px", color: "#888", margin: "0 0 8px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontFamily: "'Lato',sans-serif" }}>{book.author}</p>
                                                    </div>
                                                </a>
                                            );
                                        }

                                        return (
                                            <Link key={book.id} href={`/book/preview?id=${String(book.id).replace("firestore-", "")}`} style={{ textDecoration: "none", display: "block", background: "#fff" }}>
                                                <div style={{ position: "relative" }}>
                                                    <div style={{ position: "relative", width: "100%", aspectRatio: "3/4", background: NAVY, overflow: "hidden" }}>
                                                        {/* Title fallback underneath */}
                                                        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "12px", background: `linear-gradient(135deg, ${NAVY} 0%, #1a3a6e 100%)` }}>
                                                            <div style={{ width: "36px", height: "36px", border: `1px solid rgba(184,150,62,0.4)`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "10px", flexShrink: 0 }}>
                                                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={GOLD} strokeWidth="1.5"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /></svg>
                                                            </div>
                                                            <p style={{ fontFamily: "'Playfair Display',serif", fontSize: "11px", fontWeight: 700, color: "#fff", textAlign: "center", lineHeight: 1.35, margin: "0 0 6px", display: "-webkit-box", WebkitLineClamp: 4, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                                                                {book.title}
                                                            </p>
                                                            <p style={{ fontSize: "9px", color: "rgba(184,150,62,0.7)", fontFamily: "'Lato',sans-serif", textAlign: "center", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "100%" }}>
                                                                {book.author}
                                                            </p>
                                                        </div>
                                                        {/* Actual thumbnail floats on top */}
                                                        {book.image && (
                                                            <img src={book.image} alt={book.title}
                                                                style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                                                                onError={e => { e.target.style.display = "none"; }}
                                                                className="book-thumb"
                                                            />
                                                        )}
                                                    </div>
                                                    <div style={{ position: "absolute", top: "8px", left: "8px", display: "inline-flex", alignItems: "center", gap: "4px", background: NAVY, padding: "3px 8px", fontFamily: "'Lato',sans-serif", fontSize: "9px", fontWeight: 700, letterSpacing: "0.06em", color: "#fff" }}>
                                                        <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: "#22c55e", display: "inline-block", flexShrink: 0 }} />PDF
                                                    </div>
                                                    {owned && <span style={{ position: "absolute", top: "8px", right: "8px", background: "#16a34a", color: "#fff", fontSize: "9px", fontWeight: 700, padding: "3px 7px", fontFamily: "'Lato',sans-serif" }}>OWNED</span>}
                                                    {!owned && isTrending && <span style={{ position: "absolute", bottom: "8px", left: "8px", background: "#ea580c", color: "#fff", fontSize: "9px", fontWeight: 700, padding: "3px 7px", fontFamily: "'Lato',sans-serif" }}>🔥 Trending</span>}
                                                </div>
                                                <div style={{ padding: "10px 10px 12px", borderTop: "0.5px solid #f0ebe0" }}>
                                                    <h4 style={{ fontFamily: "'Playfair Display',serif", fontSize: "13px", fontWeight: 700, color: NAVY, margin: "0 0 3px", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", lineHeight: 1.35 }}>{book.title}</h4>
                                                    <p style={{ fontSize: "11px", color: NAVY, margin: "0 0 8px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontFamily: "'Lato',sans-serif" }}>{book.author}</p>
                                                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "6px", flexWrap: "wrap" }}>
                                                        {book.category && !owned && (
                                                            <span style={{ display: "inline-block", background: CREAM, border: `0.5px solid rgba(184,150,62,0.3)`, color: GOLD, fontSize: "8px", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", padding: "3px 7px", fontFamily: "'Lato',sans-serif", maxWidth: "100px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{book.category}</span>
                                                        )}
                                                    </div>
                                                    {soldCount > 0 && <p style={{ fontSize: "10px", color: NAVY, margin: "5px 0 0", display: "flex", alignItems: "center", gap: "4px", fontFamily: "'Lato',sans-serif" }}><ShoppingBag size={9} /> {soldCount} sold</p>}
                                                </div>
                                            </Link>
                                        );
                                    })}
                                </div>

                                {/* ── Gold Carousel after row 1 ── */}
                                <FeaturedAdsCarousel tier="Gold" maxAds={2} autoPlay={true} autoPlayMs={4000} style={{ marginBottom: "24px" }} />

                                {/* ── Row 2: books 6-11 ── */}
                                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: "20px", marginBottom: "24px" }}>
                                    {allBooks.slice(6, 12).map(book => {
                                        const soldCount = bookSalesCount[book.id] || bookSalesCount[book.firestoreId] || 0;
                                        const owned = isPurchased(book.id);
                                        return (
                                            <Link key={book.id} href={`/book/preview?id=${String(book.id).replace("firestore-", "")}`} style={{ textDecoration: "none", display: "block", background: "#fff" }}>
                                                <div style={{ position: "relative", background: "#ede8df" }}>
                                                    <div style={{ position: "relative", width: "100%", aspectRatio: "3/4", background: NAVY, overflow: "hidden" }}>
                                                        {/* Title fallback always visible underneath */}
                                                        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "12px", background: `linear-gradient(135deg, ${NAVY} 0%, #1a3a6e 100%)` }}>
                                                            <div style={{ width: "36px", height: "36px", border: `1px solid rgba(184,150,62,0.4)`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "10px", flexShrink: 0 }}>
                                                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={GOLD} strokeWidth="1.5"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /></svg>
                                                            </div>
                                                            <p style={{ fontFamily: "'Playfair Display',serif", fontSize: "11px", fontWeight: 700, color: "#fff", textAlign: "center", lineHeight: 1.35, margin: "0 0 6px", display: "-webkit-box", WebkitLineClamp: 4, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                                                                {book.title}
                                                            </p>
                                                            <p style={{ fontSize: "9px", color: "rgba(184,150,62,0.7)", fontFamily: "'Lato',sans-serif", textAlign: "center", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "100%" }}>
                                                                {book.author}
                                                            </p>
                                                        </div>
                                                        {/* Actual thumbnail on top — hides automatically if it fails */}
                                                        <img src={book.image} alt={book.title}
                                                            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                                                            onError={e => { e.target.style.display = "none"; }}
                                                            className="book-thumb"
                                                        />
                                                    </div>
                                                    {owned && <span style={{ position: "absolute", top: "8px", right: "8px", background: "#16a34a", color: "#fff", fontSize: "9px", fontWeight: 700, padding: "3px 7px", fontFamily: "'Lato',sans-serif" }}>OWNED</span>}
                                                </div>
                                                <div style={{ padding: "10px 10px 12px", borderTop: "0.5px solid #f0ebe0" }}>
                                                    <h4 style={{ fontFamily: "'Playfair Display',serif", fontSize: "13px", fontWeight: 700, color: NAVY, margin: "0 0 3px", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", lineHeight: 1.35 }}>{book.title}</h4>
                                                    <p style={{ fontSize: "11px", color: NAVY, margin: "0 0 8px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontFamily: "'Lato',sans-serif" }}>{book.author}</p>
                                                    {book.category && !owned && (
                                                        <span style={{ display: "inline-block", background: CREAM, border: `0.5px solid rgba(184,150,62,0.3)`, color: GOLD, fontSize: "8px", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", padding: "3px 7px", fontFamily: "'Lato',sans-serif", maxWidth: "100px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{book.category}</span>
                                                    )}
                                                    {soldCount > 0 && <p style={{ fontSize: "10px", color: NAVY, margin: "5px 0 0", display: "flex", alignItems: "center", gap: "4px", fontFamily: "'Lato',sans-serif" }}><ShoppingBag size={9} /> {soldCount} sold</p>}
                                                </div>
                                            </Link>
                                        );
                                    })}
                                </div>

                                {/* ── Silver Carousel after row 2 ── */}
                                <FeaturedAdsCarousel tier="Silver" maxAds={2} autoPlay={true} autoPlayMs={5000} style={{ marginBottom: "24px" }} />

                                {/* ── Row 3: books 12-17 ── */}
                                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: "20px", marginBottom: "24px" }}>
                                    {allBooks.slice(12, 18).map(book => {
                                        const soldCount = bookSalesCount[book.id] || bookSalesCount[book.firestoreId] || 0;
                                        const owned = isPurchased(book.id);
                                        return (
                                            <Link key={book.id} href={`/book/preview?id=${String(book.id).replace("firestore-", "")}`} style={{ textDecoration: "none", display: "block", background: "#fff" }}>
                                                <div style={{ position: "relative", background: "#ede8df" }}>
                                                    <img src={book.image} alt={book.title}
                                                        style={{ width: "100%", aspectRatio: "3/4", objectFit: "cover", display: "block", transition: "box-shadow 0.2s" }}
                                                        onError={e => { e.target.display = "none"; }}
                                                        className="book-thumb"
                                                    />
                                                    <div style={{ position: "absolute", top: "8px", left: "8px", display: "inline-flex", alignItems: "center", gap: "4px", background: NAVY, padding: "3px 8px", fontFamily: "'Lato',sans-serif", fontSize: "9px", fontWeight: 700, letterSpacing: "0.06em", color: "#fff" }}>
                                                        <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: "#22c55e", display: "inline-block", flexShrink: 0 }} />PDF
                                                    </div>
                                                    {owned && <span style={{ position: "absolute", top: "8px", right: "8px", background: "#16a34a", color: "#fff", fontSize: "9px", fontWeight: 700, padding: "3px 7px", fontFamily: "'Lato',sans-serif" }}>OWNED</span>}
                                                </div>
                                                <div style={{ padding: "10px 10px 12px", borderTop: "0.5px solid #f0ebe0" }}>
                                                    <h4 style={{ fontFamily: "'Playfair Display',serif", fontSize: "13px", fontWeight: 700, color: NAVY, margin: "0 0 3px", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", lineHeight: 1.35 }}>{book.title}</h4>
                                                    <p style={{ fontSize: "11px", color: NAVY, margin: "0 0 8px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontFamily: "'Lato',sans-serif" }}>{book.author}</p>
                                                    {book.category && !owned && (
                                                        <span style={{ display: "inline-block", background: CREAM, border: `0.5px solid rgba(184,150,62,0.3)`, color: GOLD, fontSize: "8px", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", padding: "3px 7px", fontFamily: "'Lato',sans-serif", maxWidth: "100px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{book.category}</span>
                                                    )}
                                                    {soldCount > 0 && <p style={{ fontSize: "10px", color: NAVY, margin: "5px 0 0", display: "flex", alignItems: "center", gap: "4px", fontFamily: "'Lato',sans-serif" }}><ShoppingBag size={9} /> {soldCount} sold</p>}
                                                </div>
                                            </Link>
                                        );
                                    })}
                                </div>

                            </>
                        )}
                    </div>
                </section>

                {/* ══════════════════════════════════════════════════════════
            BROWSE THE LIBRARY
        ══════════════════════════════════════════════════════════ */}
                <section style={{ background: "#fff", padding: "80px 24px" }}>
                    <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
                        {/* header */}
                        <div style={{ textAlign: "center", marginBottom: "48px" }}>
                            <p style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", color: GOLD, marginBottom: "10px", fontFamily: "'Lato', sans-serif" }}>
                                Explore the Full Collection
                            </p>
                            <h2 className="lan-serif" style={{ fontSize: "clamp(32px, 5vw, 52px)", fontWeight: 700, color: NAVY, margin: "0 0 16px" }}>
                                Browse the Library
                            </h2>
                            {/* gold diamond divider */}
                            <div className="gold-line" style={{ maxWidth: "300px", margin: "0 auto 16px" }}>
                                <div style={{ width: "8px", height: "8px", background: GOLD, transform: "rotate(45deg)", flexShrink: 0 }} />
                            </div>
                            <p style={{ fontSize: "14px", color: "#888", maxWidth: "520px", margin: "0 auto", lineHeight: 1.7, fontWeight: 300 }}>
                                Explore our comprehensive collection tailored to every academic level and discipline
                            </p>
                        </div>

                        {/* search + tabs */}
                        <div style={{ background: "#fff", border: `0.5px solid #e5ddd0`, padding: "16px 20px", marginBottom: "32px", display: "flex", flexWrap: "wrap", gap: "12px", alignItems: "center" }}>
                            <div style={{ flex: 1, minWidth: "220px", position: "relative" }}>
                                <Search size={14} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#bbb" }} />
                                <input
                                    type="text"
                                    value={browseSearch}
                                    onChange={e => setBrowseSearch(e.target.value)}
                                    placeholder={activeTab === "subjects" ? "Search departments…" : "Search resource types…"}
                                    style={{ width: "100%", padding: "9px 12px 9px 34px", border: `0.5px solid #e5ddd0`, borderRadius: "6px", fontSize: "13px", fontFamily: "'Lato', sans-serif", outline: "none", color: NAVY, boxSizing: "border-box" }}
                                />
                            </div>
                            <div style={{ display: "flex", gap: "4px" }}>
                                {[{ key: "subjects", label: "Departments" }, { key: "documents", label: "Resources" }].map(({ key, label }) => (
                                    <button key={key} className={`lan-tab ${activeTab === key ? "lan-tab-active" : "lan-tab-inactive"}`}
                                        onClick={() => { setActiveTab(key); setBrowseSearch(""); }}
                                    >{label}</button>
                                ))}
                            </div>
                        </div>

                        {/* departments grid */}
                        {/* departments grid */}
                        {activeTab === "subjects" && (
                            <>
                                {filteredCategories.length === 0 ? (
                                    <div style={{ textAlign: "center", padding: "64px 24px", background: "#fff", border: `0.5px solid #e5ddd0` }}>
                                        <BookOpen size={36} style={{ color: "#e5ddd0", margin: "0 auto 12px" }} />
                                        <h3 className="lan-serif" style={{ fontSize: "20px", color: NAVY, marginBottom: "6px" }}>No Departments Found</h3>
                                        <p style={{ fontSize: "13px", color: "#bbb" }}>Try a different search term</p>
                                    </div>
                                ) : (
                                        <div className="browse-card-grid"
                                            style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "18px" }}>
                                        {filteredCategories.map((cat, i) => (

                                            <a key={i}
                                                href={`/category/${cat.name.toLowerCase().replace(/ & /g, "-").replace(/ /g, "-")}`}
                                                className="browse-card"
                                                style={{ textDecoration: "none", display: "block", background: CREAM, border: "0.5px solid #e5ddd0", overflow: "hidden" }}
                                            >
                                                {/* image with overlays */}
                                                <div style={{ height: 176, overflow: "hidden", position: "relative" }}>
                                                    <img
                                                        src={cat.image}
                                                        alt={cat.name}
                                                        onError ={e => {e.target.src = "/studs.png"}}
                                                        className="browse-img"
                                                        style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                                                    />
                                                    {/* gradient overlay */}
                                                    <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(13,34,68,0.88) 0%, rgba(13,34,68,0.35) 55%, transparent 100%)" }} />

                                                    {/* top-left: "Category" badge */}
                                                    <div style={{ position: "absolute", top: 10, left: 10, background: "rgba(13,34,68,0.85)", padding: "3px 9px" }}>
                                                        <span style={{ fontSize: "8px", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: GOLD, fontFamily: "'Lato',sans-serif" }}>
                                                            Category
                                                        </span>
                                                    </div>

                                                    {/* top-right: sub count badge */}
                                                    <div style={{ position: "absolute", top: 10, right: 10, background: GOLD, color: NAVY, padding: "3px 8px" }}>
                                                        <span style={{ fontSize: "9px", fontWeight: 700, fontFamily: "'Lato',sans-serif" }}>{cat.sub} subcategories</span>
                                                    </div>

                                                    {/* title on image bottom */}
                                                    <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "12px 16px" }}>
                                                        <h3 className="lan-serif" style={{ fontSize: "15px", fontWeight: 700, color: "#fff", lineHeight: 1.25, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                                                            {cat.name}
                                                        </h3>
                                                    </div>
                                                </div>

                                                {/* card body */}
                                                <div style={{ padding: "14px 16px 16px" }}>
                                                    <p style={{ fontSize: "12px", color: "#555", lineHeight: 1.65, margin: "0 0 14px" }}>
                                                        {cat.description}
                                                    </p>
                                                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderTop: "0.5px solid #f0ebe0", paddingTop: "12px" }}>
                                                        <span style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: NAVY, fontFamily: "'Lato',sans-serif" }}>
                                                            Browse Resources
                                                        </span>
                                                        <div style={{ width: "26px", height: "26px", border: `0.5px solid #e5ddd0`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                                            <ArrowRight size={11} style={{ color: NAVY }} />
                                                        </div>
                                                    </div>
                                                </div>
                                            </a>
                                        ))}
                                    </div>
                                )}
                                <div style={{ textAlign: "center", marginTop: "32px" }}>
                                    <Link href="/departments" style={{ fontSize: "13px", fontWeight: 700, color: NAVY, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                                        Explore all Departments <ChevronRight size={14} />
                                    </Link>
                                </div>
                            </>
                        )}

                        {/* resources grid */}
                        {activeTab === "documents" && (
                            <>
                                {filteredDocTypes.length === 0 ? (
                                    <div style={{ textAlign: "center", padding: "64px 24px", background: "#fff", border: `0.5px solid #e5ddd0` }}>
                                        <BookOpen size={36} style={{ color: "#e5ddd0", margin: "0 auto 12px" }} />
                                        <h3 className="lan-serif" style={{ fontSize: "20px", color: NAVY, marginBottom: "6px" }}>No Resource Types Found</h3>
                                        <p style={{ fontSize: "13px", color: "#bbb" }}>Try a different search term</p>
                                    </div>
                                ) : (
                                        <div className="doc-card-grid"
                                            style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "14px" }}>
                                        {filteredDocTypes.map((dt, i) => (
                                            <div key={i} className="doc-card" onClick={() => router.push(`/document-type/${dt.slug}`)}>
                                                <div style={{ height: "120px", overflow: "hidden", position: "relative" }}>
                                                    <img src={dt.image} alt={dt.name} className="doc-img" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                                    <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(13,34,68,0.6), transparent 55%)" }} />
                                                </div>
                                                <div style={{ padding: "14px" }}>
                                                    <h3 className="lan-serif" style={{ fontSize: "13px", fontWeight: 700, color: NAVY, margin: "0 0 5px" }}>{dt.name}</h3>
                                                    <p style={{ fontSize: "11px", color: "#555", margin: "0 0 12px", lineHeight: 1.5 }}>{dt.description}</p>
                                                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderTop: `0.5px solid #f0ebe0`, paddingTop: "10px" }}>
                                                        <span style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: GOLD }}>View All</span>
                                                        <ArrowRight size={12} style={{ color: NAVY }} />
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                <div style={{ textAlign: "center", marginTop: "32px" }}>
                                    <Link href="/resources" style={{ fontSize: "13px", fontWeight: 700, color: NAVY, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                                        Explore all student resources <ChevronRight size={14} />
                                    </Link>
                                </div>
                            </>
                        )}
                    </div>
                </section>


                {/* ══ DIVINITY VAULT BANNER ══════════════════════════════════ */}
                <section style={{
                    background: GOLD,
                    borderTop: "0.5px solid rgba(179,139,89,0.3)",
                    borderBottom: "0.5px solid rgba(179,139,89,0.3)",
                    padding: "48px 24px",
                    position: "relative",
                    overflow: "hidden",
                }}>
                    {/* background cross-hatch */}
                    <div style={{
                        position: "absolute", inset: 0, opacity: 0.06,
                        backgroundImage: `repeating-linear-gradient(45deg, ${GOLD} 0, ${GOLD} 1px, transparent 0, transparent 50%)`,
                        backgroundSize: "18px 18px"
                    }} />

                    <div style={{
                        maxWidth: 1200, margin: "0 auto",
                        display: "flex", flexWrap: "wrap",
                        alignItems: "center", justifyContent: "space-between", gap: 32,
                        position: "relative",
                    }}>
                        {/* left: text */}
                        <div style={{ flex: 1, minWidth: 260 }}>
                            {/* ornament */}
                            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                                <div style={{ height: "0.5px", width: 28, background: `rgba(179,139,89,0.6)` }} />
                                <svg width="10" height="10" viewBox="0 0 10 10" fill={GOLD}>
                                    <polygon points="5,0 6.2,3.8 10,3.8 6.9,6.2 8.1,10 5,7.6 1.9,10 3.1,6.2 0,3.8 3.8,3.8" />
                                </svg>
                                <div style={{ height: "0.5px", width: 28, background: `rgba(179,139,89,0.6)` }} />
                            </div>

                            <h2 style={{
                                fontFamily: "'Playfair Display', Georgia, serif",
                                fontSize: "clamp(28px,4vw,44px)", fontWeight: 900,
                                color: NAVY, margin: "0 0 12px", fontStyle: "italic", lineHeight: 1.1,
                            }}>
                                The Divinity Vault
                            </h2>
                            <p style={{
                                fontFamily: "'EB Garamond', Georgia, serif",
                                fontSize: "clamp(15px,2vw,18px)",
                                color: "rgba(245,240,230,0.65)",
                                lineHeight: 1.75, margin: "0 0 8px",
                                maxWidth: 480, fontStyle: "italic",
                            }}>
                                Contribute your theological works, sermon notes, and sacred commentaries to Africa's most comprehensive digital divinity archive. Your scholarship will reach seekers across the continent                            </p>
                            <p style={{
                                fontFamily: "'Lato', sans-serif", fontSize: 10, fontWeight: 700,
                                letterSpacing: "0.22em", textTransform: "uppercase",
                                color: "rgba(179,139,89,0.55)", margin: 0,
                            }}>
                                Christian · Islamic · Comparative · Sacred Texts
                            </p>
                        </div>

                        {/* right: CTA */}
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 14 }}>
                            <Link
                                href="/divinity/religious-studies"
                                style={{
                                    display: "inline-flex", alignItems: "center", gap: 10,
                                    padding: "14px 32px",
                                    background: NAVY,
                                    color: GOLD,
                                    fontFamily: "'Lato',sans-serif", fontSize: 12, fontWeight: 700,
                                    letterSpacing: "0.12em", textTransform: "uppercase",
                                    textDecoration: "none",
                                    border: `1px solid ${GOLD}`,
                                    // ── sacred gold glow ──
                                    boxShadow: `0 0 12px rgba(179,139,89,0.35), 0 0 32px rgba(179,139,89,0.15), inset 0 0 12px rgba(179,139,89,0.06)`,
                                    transition: "box-shadow 0.3s, background 0.3s",
                                    position: "relative",
                                }}
                                onMouseEnter={e => {
                                    e.currentTarget.style.background = NAVY;
                                    e.currentTarget.style.boxShadow = `0 0 20px rgba(179,139,89,0.55), 0 0 48px rgba(179,139,89,0.25), inset 0 0 16px rgba(179,139,89,0.1)`;
                                }}
                                onMouseLeave={e => {
                                    e.currentTarget.style.background = NAVY;
                                    e.currentTarget.style.boxShadow = `0 0 12px rgba(179,139,89,0.35), 0 0 32px rgba(179,139,89,0.15), inset 0 0 12px rgba(179,139,89,0.06)`;
                                }}
                            >
                                Enter the Vault
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={GOLD} strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                            </Link>
                            <Link
                                href="/upload-document"
                                style={{
                                    display: "inline-flex", alignItems: "center", gap: 10,
                                    padding: "14px 32px",
                                    background: NAVY,
                                    color: GOLD,
                                    fontFamily: "'Lato',sans-serif", fontSize: 12, fontWeight: 700,
                                    letterSpacing: "0.12em", textTransform: "uppercase",
                                    textDecoration: "none",
                                    border: `1px solid ${GOLD}`,
                                    // ── sacred gold glow ──
                                    boxShadow: `0 0 12px rgba(179,139,89,0.35), 0 0 32px rgba(179,139,89,0.15), inset 0 0 12px rgba(179,139,89,0.06)`,
                                    transition: "box-shadow 0.3s, background 0.3s",
                                    position: "relative",
                                }}
                                onMouseEnter={e => {
                                    e.currentTarget.style.background = NAVY;
                                    e.currentTarget.style.boxShadow = `0 0 20px rgba(179,139,89,0.55), 0 0 48px rgba(179,139,89,0.25), inset 0 0 16px rgba(179,139,89,0.1)`;
                                }}
                                onMouseLeave={e => {
                                    e.currentTarget.style.background = NAVY;
                                    e.currentTarget.style.boxShadow = `0 0 12px rgba(179,139,89,0.35), 0 0 32px rgba(179,139,89,0.15), inset 0 0 12px rgba(179,139,89,0.06)`;
                                }}
                            >
                                Contribute
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={GOLD} strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                            </Link>
                            <p style={{
                                fontFamily: "'Lato',sans-serif", fontSize: 9, fontWeight: 700,
                                letterSpacing: "0.16em", textTransform: "uppercase",
                                color: "rgba(179,139,89,0.4)", margin: 0
                            }}>
                                4 Traditions · Sacred Archive · Open Access
                            </p>
                        </div>
                    </div>
                </section>


                {/* ══════════════════════════════════════════════════════════
            EDUCATOR NOTICE BOARD
        ══════════════════════════════════════════════════════════ */}
                <section style={{ background: "#fff", borderTop: `1px solid #e5ddd0`, borderBottom: `1px solid #e5ddd0`, padding: "64px 24px" }}>
                    <div style={{ maxWidth: "1100px", margin: "0 auto", display: "flex", flexWrap: "wrap", gap: "40px", alignItems: "center" }}>
                        {/* crest icon */}
                        <div style={{ textAlign: "center", flexShrink: 0 }}>
                            <div style={{ width: "72px", height: "72px", margin: "0 auto 12px", border: `2px solid ${NAVY}`, transform: "rotate(45deg)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                <GraduationCap size={28} style={{ color: NAVY, transform: "rotate(-45deg)" }} />
                            </div>
                            <p className="lan-serif" style={{ fontSize: "11px", color: "#bbb", fontStyle: "italic" }}>Est. LAN Library</p>
                        </div>

                        <div style={{ width: "1px", height: "80px", background: "#e5ddd0", flexShrink: 0 }} />

                        <div style={{ flex: 1, minWidth: "240px" }}>
                            <p style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: GOLD, marginBottom: "10px", fontFamily: "'Lato', sans-serif" }}>
                                Notice to All Scholars
                            </p>
                            <h3 className="lan-serif" style={{ fontSize: "clamp(20px, 3vw, 30px)", fontWeight: 700, color: NAVY, margin: "0 0 12px" }}>
                                Are you an Educator or Institution?
                            </h3>
                            <p style={{ fontSize: "14px", color: "#777", lineHeight: 1.75, maxWidth: "520px", fontWeight: 300 }}>
                                Join thousands of educators contributing to Africa's largest digital academic library.
                                Upload course materials, past questions, and research papers to reach millions of students.
                            </p>
                        </div>

                        <div style={{ display: "flex", flexDirection: "column", gap: "10px", flexShrink: 0 }}>
                            <button onClick={HandleClick} disabled={checkingSeller}
                                style={{ display: "flex", alignItems: "center", gap: "8px", padding: "12px 24px", background: NAVY, color: "#fff", fontSize: "13px", fontWeight: 700, fontFamily: "'Lato', sans-serif", border: "none", cursor: "pointer", letterSpacing: "0.04em" }}
                            >
                                {checkingSeller
                                    ? <><span style={{ width: "12px", height: "12px", border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", display: "inline-block", animation: "spin 0.7s linear infinite" }} />Loading…</>
                                    : isSeller ? <><Upload size={14} />Upload Materials</> : "Become a Seller"
                                }
                            </button>
                            <Link href="/documents"
                                style={{ display: "flex", alignItems: "center", gap: "8px", padding: "12px 24px", border: `0.5px solid ${NAVY}`, color: NAVY, fontSize: "13px", fontWeight: 700, fontFamily: "'Lato', sans-serif", textDecoration: "none", letterSpacing: "0.04em", transition: "background 0.15s" }}
                                onMouseEnter={e => e.currentTarget.style.background = "rgba(13,34,68,0.05)"}
                                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                            >
                                <Search size={14} /> Browse Library
                            </Link>
                        </div>
                    </div>
                </section>

                {/* ══════════════════════════════════════════════════════════
            SHARE THE WEALTH
        ══════════════════════════════════════════════════════════ */}
                <section style={{ background: BG, padding: "72px 24px" }}>
                    <div style={{ maxWidth: "900px", margin: "0 auto", textAlign: "center" }}>
                        <h2 className="lan-serif" style={{ fontSize: "clamp(30px, 5vw, 52px)", fontWeight: 900, color: NAVY, margin: "0 0 16px", lineHeight: 1.08 }}>
                            Share the wealth{" "}
                            <span style={{ color: GOLD, fontWeight: 400, fontStyle: "italic" }}>[of knowledge].</span>
                        </h2>
                        <p style={{ fontSize: "16px", color: "#777", maxWidth: "600px", margin: "0 auto 48px", lineHeight: 1.75, fontWeight: 300 }}>
                            Turn your books into income. Upload your work, reach a global audience{" "}
                            <strong style={{ color: NAVY }}>[90M+]</strong>, and earn whenever readers discover your content.
                        </p>

                        <div style={{ background: "#fff", border: `0.5px solid #e5ddd0`, padding: "60px 24px", display: "flex", flexDirection: "column", alignItems: "center" }}>
                            {/* device icons */}
                            <div style={{ display: "flex", alignItems: "center", gap: "28px", marginBottom: "36px", color: "#ccc" }}>
                                <Monitor size={56} strokeWidth={1.2} />
                                <Upload size={36} strokeWidth={2} style={{ color: GOLD }} />
                                <Smartphone size={48} strokeWidth={1.2} />
                            </div>

                            <button
                                onClick={HandleClick}
                                disabled={checkingSeller}
                                style={{ display: "flex", alignItems: "center", gap: "8px", padding: "15px 36px", background: GOLD, color: NAVY, fontSize: "15px", fontWeight: 700, fontFamily: "'Lato', sans-serif", border: "none", cursor: "pointer", letterSpacing: "0.04em", transition: "background 0.18s" }}
                                onMouseEnter={e => e.currentTarget.style.background = GOLDD}
                                onMouseLeave={e => e.currentTarget.style.background = GOLD}
                            >
                                {checkingSeller
                                    ? "Loading…"
                                    : isSeller ? <><Upload size={16} />Upload Document</> : "Become a Seller"
                                }
                            </button>

                            {!checkingSeller && isSeller && (
                                <p style={{ fontSize: "12px", color: "#16a34a", marginTop: "14px", display: "flex", alignItems: "center", gap: "5px" }}>
                                    <span style={{ width: "7px", height: "7px", background: "#16a34a", borderRadius: "50%", display: "inline-block" }} />
                                    You're a verified seller
                                </p>
                            )}
                        </div>
                    </div>
                </section>

                {/* ══════════════════════════════════════════════════════════
            CTA BANNER
        ══════════════════════════════════════════════════════════ */}
                <section className="crest-bg" style={{ padding: "80px 24px", textAlign: "center" }}>
                    {/* gold star divider */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "16px", marginBottom: "28px" }}>
                        <div style={{ height: "1px", width: "60px", background: "rgba(184,150,62,0.4)" }} />
                        <Star size={14} style={{ color: GOLD, fill: GOLD }} />
                        <div style={{ height: "1px", width: "60px", background: "rgba(184,150,62,0.4)" }} />
                    </div>

                    <h2 className="lan-serif" style={{ fontSize: "clamp(28px, 5vw, 52px)", fontWeight: 700, color: "#fff", margin: "0 0 16px" }}>
                        Ready to Excel in Your Studies?
                    </h2>
                    <p style={{ fontSize: "15px", color: "rgba(255,255,255,0.5)", maxWidth: "500px", margin: "0 auto 40px", lineHeight: 1.75, fontWeight: 300 }}>
                        Access premium academic resources and join a community of over 2.4 million learners
                        dedicated to educational excellence across Nigeria and beyond.
                    </p>

                    <div style={{ display: "flex", flexWrap: "wrap", gap: "14px", justifyContent: "center" }}>
                        <Link href="/documents"
                            style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "14px 28px", background: GOLD, color: NAVY, fontSize: "13px", fontWeight: 700, textDecoration: "none", fontFamily: "'Lato', sans-serif", letterSpacing: "0.04em", transition: "background 0.18s" }}
                            onMouseEnter={e => e.currentTarget.style.background = GOLDD}
                            onMouseLeave={e => e.currentTarget.style.background = GOLD}
                        >
                            <Search size={14} /> Browse All Documents
                        </Link>
                        <Link href="/upload-document"
                            style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "14px 28px", border: "0.5px solid rgba(255,255,255,0.2)", color: CREAM, fontSize: "13px", fontWeight: 700, textDecoration: "none", fontFamily: "'Lato', sans-serif", letterSpacing: "0.04em", transition: "background 0.18s" }}
                            onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.07)"}
                            onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                        >
                            <Upload size={14} /> Contribute Resources
                        </Link>
                    </div>
                </section>

                <Footer />

                <style>{`
          @keyframes spin { to { transform: rotate(360deg); } }
        `}</style>
            </div >
        </>
    );
}