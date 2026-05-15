"use client";
import React, { useState, useEffect, useRef } from "react";
import {
    Search, X, Filter, Upload, ArrowUpRight, ChevronRight,
    BookOpen, ArrowRight, Layers,
} from "lucide-react";
import Link from "next/link";
import Navbar from "@/components/NavBar";
import Footer from "@/components/FooterComp";

/* ── colour tokens (matches LAN Library) ──────────────────────── */
const NAVY = "#0d2244";
const GOLD = "#b8963e";
const GOLDD = "#d4aa5a";
const CREAM = "#f5f0e8";
const BG = "#f5f1ea";

/* ── All departments ────────────────────────────────────────────
   Each entry:  { name, slug, image, description, sub, faculty }
   faculty = filter tag shown in the pill bar
─────────────────────────────────────────────────────────────── */
const DEPARTMENTS = [
    /* ── Sciences ── */
    { name: "Medicine & Health Sciences", slug: "medicine-health-sciences", faculty: "Sciences", sub: 14, image: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=600", description: "Anatomy, physiology, clinical studies and medical education resources" },
    { name: "Pharmacy", slug: "pharmacy", faculty: "Sciences", sub: 9, image: "https://images.unsplash.com/photo-1585435557343-3b092031a831?w=600", description: "Drug classifications, pharmacology notes and pharmacy practice" },
    { name: "Nursing", slug: "nursing", faculty: "Sciences", sub: 7, image: "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=600", description: "Clinical procedures, care plans and nursing education materials" },
    { name: "Biochemistry", slug: "biochemistry", faculty: "Sciences", sub: 8, image: "https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=600", description: "Metabolic pathways, enzymes, molecular biology and cell chemistry" },
    { name: "Microbiology", slug: "microbiology", faculty: "Sciences", sub: 7, image: "https://images.unsplash.com/photo-1576319155264-99536e0be1ee?w=600", description: "Bacteria, viruses, fungi and applied microbiology research" },
    { name: "Biology", slug: "biology", faculty: "Sciences", sub: 9, image: "https://images.unsplash.com/photo-1530026405186-ed1f139313f8?w=600", description: "Ecology, genetics, zoology, botany and life sciences" },
    { name: "Chemistry", slug: "chemistry", faculty: "Sciences", sub: 10, image: "https://images.unsplash.com/photo-1603126857599-f6e157fa2fe6?w=600", description: "Organic, inorganic, physical chemistry and laboratory practice" },
    { name: "Physics", slug: "physics", faculty: "Sciences", sub: 8, image: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=600", description: "Mechanics, electromagnetism, quantum physics and modern science" },
    { name: "Mathematics", slug: "mathematics", faculty: "Sciences", sub: 11, image: "https://images.unsplash.com/photo-1509228468518-180dd4864904?w=600", description: "Calculus, algebra, statistics, and pure mathematics" },
    { name: "Statistics", slug: "statistics", faculty: "Sciences", sub: 7, image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600", description: "Data analysis, probability theory and applied statistics" },
    { name: "Veterinary Medicine", slug: "veterinary-medicine", faculty: "Sciences", sub: 6, image: "https://images.unsplash.com/photo-1596854407944-bf87f6fdd49e?w=600", description: "Animal health, veterinary surgery and clinical sciences" },
    { name: "Dentistry", slug: "dentistry", faculty: "Sciences", sub: 5, image: "https://images.unsplash.com/photo-1588776814546-1ffbb172f4ed?w=600", description: "Oral health, dental procedures and dentistry education" },
    { name: "Nutrition & Dietetics", slug: "nutrition-dietetics", faculty: "Sciences", sub: 6, image: "https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=600", description: "Food science, dietary guidelines and clinical nutrition" },
    { name: "Optometry", slug: "optometry", faculty: "Sciences", sub: 5, image: "https://images.unsplash.com/photo-1511174511562-5f7f18b874f8?w=600", description: "Eye care, visual science and ophthalmic practice" },

    /* ── Engineering & Technology ── */
    { name: "Computer Science", slug: "computer-science", faculty: "Engineering", sub: 12, image: "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=600", description: "Programming, algorithms, data structures and software development" },
    { name: "Electrical Engineering", slug: "electrical-engineering", faculty: "Engineering", sub: 10, image: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=600", description: "Circuit design, power systems, electronics and telecommunications" },
    { name: "Mechanical Engineering", slug: "mechanical-engineering", faculty: "Engineering", sub: 9, image: "https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=600", description: "Thermodynamics, mechanics, manufacturing and machine design" },
    { name: "Civil Engineering", slug: "civil-engineering", faculty: "Engineering", sub: 8, image: "https://images.unsplash.com/photo-1503387762-592dec58ef4e?w=600", description: "Structural design, geotechnics, transportation and construction" },
    { name: "Chemical Engineering", slug: "chemical-engineering", faculty: "Engineering", sub: 8, image: "https://images.unsplash.com/photo-1582719508461-905c673771fd?w=600", description: "Process engineering, thermodynamics and industrial chemistry" },
    { name: "Petroleum Engineering", slug: "petroleum-engineering", faculty: "Engineering", sub: 7, image: "https://images.unsplash.com/photo-1578575437130-527eed3abbec?w=600", description: "Reservoir engineering, drilling and petroleum production" },
    { name: "Architecture", slug: "architecture", faculty: "Engineering", sub: 9, image: "https://images.unsplash.com/photo-1487958449943-2429e8be8625?w=600", description: "Architectural design, urban planning and structural aesthetics" },
    { name: "Information Technology", slug: "information-technology", faculty: "Engineering", sub: 10, image: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=600", description: "Networking, cybersecurity, systems administration and IT management" },
    { name: "Agricultural Engineering", slug: "agricultural-engineering", faculty: "Engineering", sub: 6, image: "https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=600", description: "Mechanisation, irrigation, soil science and agro-processing" },
    { name: "Environmental Engineering", slug: "environmental-engineering", faculty: "Engineering", sub: 6, image: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=600", description: "Waste management, water treatment and pollution control" },
    { name: "Mining Engineering", slug: "mining-engineering", faculty: "Engineering", sub: 5, image: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=600", description: "Mineral exploration, extraction methods and mine safety" },

    /* ── Arts & Social Sciences ── */
    { name: "Law", slug: "law", faculty: "Arts & Social", sub: 12, image: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=600", description: "Constitutional law, criminal law, contracts and legal practice" },
    { name: "Economics", slug: "economics", faculty: "Arts & Social", sub: 10, image: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=600", description: "Macro & microeconomics, development economics and econometrics" },
    { name: "Accounting", slug: "accounting", faculty: "Arts & Social", sub: 9, image: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600", description: "Financial accounting, auditing, tax and management accounting" },
    { name: "Business Administration", slug: "business-administration", faculty: "Arts & Social", sub: 11, image: "https://images.unsplash.com/photo-1552664730-d307ca884978?w=600", description: "Management, marketing, entrepreneurship and corporate strategy" },
    { name: "Political Science", slug: "political-science", faculty: "Arts & Social", sub: 8, image: "https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=600", description: "Governance, international relations and political theory" },
    { name: "Sociology", slug: "sociology", faculty: "Arts & Social", sub: 8, image: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=600", description: "Social structures, culture, research methods and social policy" },
    { name: "Psychology", slug: "psychology", faculty: "Arts & Social", sub: 8, image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600", description: "Human behaviour, cognition, therapy and mental health" },
    { name: "Mass Communication", slug: "mass-communication", faculty: "Arts & Social", sub: 7, image: "https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=600", description: "Journalism, broadcasting, public relations and digital media" },
    { name: "History & International Studies", slug: "history-international-studies", faculty: "Arts & Social", sub: 7, image: "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=600", description: "World history, African history, diplomacy and global affairs" },
    { name: "Public Administration", slug: "public-administration", faculty: "Arts & Social", sub: 7, image: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=600", description: "Governance, public policy, local government and civil service" },
    { name: "Geography", slug: "geography", faculty: "Arts & Social", sub: 6, image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600", description: "Physical geography, GIS, cartography and environmental studies" },
    { name: "Philosophy", slug: "philosophy", faculty: "Arts & Social", sub: 6, image: "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=600", description: "Logic, ethics, metaphysics and existential inquiry" },
    { name: "Linguistics", slug: "linguistics", faculty: "Arts & Social", sub: 6, image: "https://images.unsplash.com/photo-1456324504439-367cee3b3c32?w=600", description: "Language structure, phonetics, semantics and applied linguistics" },

    /* ── Humanities & Creative Arts ── */
    { name: "Literature", slug: "literature", faculty: "Humanities", sub: 15, image: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=600", description: "African literature, world literature, poetry and literary criticism" },
    { name: "Fine & Applied Arts", slug: "fine-applied-arts", faculty: "Humanities", sub: 9, image: "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=600", description: "Painting, sculpture, graphic design and creative arts practice" },
    { name: "Music", slug: "music", faculty: "Humanities", sub: 7, image: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600", description: "Music theory, African music, performance and composition" },
    { name: "Theatre & Performing Arts", slug: "theatre-performing-arts", faculty: "Humanities", sub: 7, image: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=600", description: "Drama, stagecraft, film studies and performing arts education" },
    { name: "Languages & Linguistics", slug: "languages-linguistics", faculty: "Humanities", sub: 8, image: "https://images.unsplash.com/photo-1516979187457-637abb4f9353?w=600", description: "French, Arabic, Igbo, Yoruba, Hausa and foreign language studies" },
    { name: "Religious Studies", slug: "religious-studies", faculty: "Humanities", sub: 8, image: "https://images.unsplash.com/photo-1518173946687-a4c8892bbd9f?w=600", description: "Theology, comparative religion, Islamic and Christian studies" },

    /* ── Agriculture & Environment ── */
    { name: "Agriculture", slug: "agriculture", faculty: "Agriculture", sub: 10, image: "https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=600", description: "Crop science, animal husbandry, soil science and agribusiness" },
    { name: "Forestry & Wildlife", slug: "forestry-wildlife", faculty: "Agriculture", sub: 6, image: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=600", description: "Forest management, wildlife conservation and natural resources" },
    { name: "Fisheries & Aquaculture", slug: "fisheries-aquaculture", faculty: "Agriculture", sub: 5, image: "https://images.unsplash.com/photo-1504309092620-4d0ec726efa4?w=600", description: "Aquaculture, fishery management and marine science resources" },
    { name: "Environmental Sciences", slug: "environmental-sciences", faculty: "Agriculture", sub: 7, image: "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=600", description: "Climate change, ecology, conservation and environmental policy" },
    { name: "Food Science & Technology", slug: "food-science-technology", faculty: "Agriculture", sub: 7, image: "https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=600", description: "Food processing, quality control and food safety management" },

    /* ── Education ── */
    { name: "Education", slug: "education", faculty: "Education", sub: 12, image: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=600", description: "Pedagogy, curriculum development and educational administration" },
    { name: "Guidance & Counselling", slug: "guidance-counselling", faculty: "Education", sub: 5, image: "https://images.unsplash.com/photo-1573497620053-ea5300f94f21?w=600", description: "School counselling, career guidance and student welfare" },
    { name: "Early Childhood Education", slug: "early-childhood-education", faculty: "Education", sub: 5, image: "https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=600", description: "Child development, early learning and pre-primary education" },
    { name: "Special Education", slug: "special-education", faculty: "Education", sub: 5, image: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=600", description: "Inclusive education, learning disabilities and special needs resources" },
    { name: "Physical & Health Education", slug: "physical-health-education", faculty: "Education", sub: 6, image: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=600", description: "Sports science, physical fitness and health education curriculum" },

    /* ── Professional & Career ── */
    { name: "Finance & Banking", slug: "finance-banking", faculty: "Professional", sub: 9, image: "https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=600", description: "Investment, banking, financial markets and corporate finance" },
    { name: "Insurance", slug: "insurance", faculty: "Professional", sub: 5, image: "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=600", description: "Risk management, actuarial science and insurance practice" },
    { name: "Estate Management", slug: "estate-management", faculty: "Professional", sub: 6, image: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=600", description: "Property valuation, land administration and real estate law" },
    { name: "Hospitality & Tourism", slug: "hospitality-tourism", faculty: "Professional", sub: 6, image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600", description: "Hotel management, tourism studies and event management" },
    { name: "Library & Information Science", slug: "library-information-science", faculty: "Professional", sub: 5, image: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=600", description: "Information management, archiving, librarianship and knowledge organisation" },
    { name: "Quantity Surveying", slug: "quantity-surveying", faculty: "Professional", sub: 6, image: "https://images.unsplash.com/photo-1503387762-592dec58ef4e?w=600", description: "Cost estimation, construction economics and project management" },
    { name: "Urban & Regional Planning", slug: "urban-regional-planning", faculty: "Professional", sub: 6, image: "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=600", description: "Town planning, land use, infrastructure and community development" },
    { name: "Social Work", slug: "social-work", faculty: "Professional", sub: 5, image: "https://images.unsplash.com/photo-1521791136064-7986c2959d99?w=600", description: "Community development, welfare services and social policy" },
    { name: "Personal Development", slug: "personal-development", faculty: "Professional", sub: 12, image: "https://images.unsplash.com/photo-1516397281156-ca07cf9746fc?w=600", description: "Self-improvement, productivity, leadership and life skills" },
];

const FACULTIES = ["All", "Sciences", "Engineering", "Arts & Social", "Humanities", "Agriculture", "Education", "Professional"];

const FACULTY_COLORS = {
    "Sciences": { bg: "rgba(16,185,129,0.08)", color: "#065f46" },
    "Engineering": { bg: "rgba(59,130,246,0.08)", color: "#1e40af" },
    "Arts & Social": { bg: "rgba(139,92,246,0.08)", color: "#5b21b6" },
    "Humanities": { bg: "rgba(245,158,11,0.08)", color: "#92400e" },
    "Agriculture": { bg: "rgba(34,197,94,0.08)", color: "#14532d" },
    "Education": { bg: "rgba(239,68,68,0.08)", color: "#991b1b" },
    "Professional": { bg: "rgba(13,34,68,0.08)", color: NAVY },
};

/* ════════════════════════════════════════════════════════════════
   PAGE COMPONENT
════════════════════════════════════════════════════════════════ */
export default function DepartmentsPage() {
    const [search, setSearch] = useState("");
    const [activeTab, setActiveTab] = useState("All");
    const [hoveredCard, setHoveredCard] = useState(null);
    const [scrollY, setScrollY] = useState(0);
    const heroRef = useRef(null);

    useEffect(() => {
        const onScroll = () => setScrollY(window.scrollY);
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    const filtered = DEPARTMENTS.filter(d => {
        const matchSearch =
            d.name.toLowerCase().includes(search.toLowerCase()) ||
            d.description.toLowerCase().includes(search.toLowerCase()) ||
            d.faculty.toLowerCase().includes(search.toLowerCase());
        const matchTab = activeTab === "All" || d.faculty === activeTab;
        return matchSearch && matchTab;
    });

    return (
        <div style={{ minHeight: "100vh", background: BG, fontFamily: "'Lato', sans-serif" }}>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400&family=Lato:wght@300;400;700&display=swap');

                *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

                .lan-serif { font-family: 'Playfair Display', Georgia, serif; }

                .hero-bg {
                    background-color: ${NAVY};
                    background-image:
                        radial-gradient(rgba(184,150,62,0.06) 1px, transparent 1px),
                        radial-gradient(rgba(255,255,255,0.03) 1px, transparent 1px);
                    background-size: 28px 28px, 14px 14px;
                    background-position: 0 0, 7px 7px;
                }

                /* dept card */
                .dept-card {
                    background: #fff;
                    border: 0.5px solid #e5ddd0;
                    text-decoration: none;
                    display: block;
                    overflow: hidden;
                    transition: transform 0.25s cubic-bezier(.4,0,.2,1), box-shadow 0.25s, border-color 0.25s;
                }
                .dept-card:hover {
                    transform: translateY(-5px);
                    box-shadow: 0 20px 48px rgba(13,34,68,0.12);
                    border-color: ${GOLD};
                }
                .dept-card:hover .dept-img { transform: scale(1.07); }
                .dept-img { transition: transform 0.6s cubic-bezier(.4,0,.2,1); width: 100%; height: 100%; object-fit: cover; display: block; }

                /* pill tabs */
                .fac-pill {
                    padding: 7px 16px;
                    border: 0.5px solid #e5ddd0;
                    background: #fff;
                    font-size: 11px;
                    font-weight: 700;
                    letter-spacing: 0.07em;
                    text-transform: uppercase;
                    color: #888;
                    cursor: pointer;
                    transition: all 0.18s;
                    font-family: 'Lato', sans-serif;
                    white-space: nowrap;
                }
                .fac-pill:hover  { border-color: ${GOLD}; color: ${NAVY}; }
                .fac-pill.active { background: ${NAVY}; color: #fff; border-color: ${NAVY}; }

                /* search */
                .search-wrap input:focus { outline: none; border-color: ${GOLD}; box-shadow: 0 0 0 3px rgba(184,150,62,0.12); }

                /* sticky bar */
                .sticky-bar { position: sticky; top: 0; z-index: 40; background: #fff; border-bottom: 0.5px solid #e5ddd0; }

                /* scrollbar */
                .pill-scroll { scrollbar-width: none; }
                .pill-scroll::-webkit-scrollbar { display: none; }

                /* upload cta */
                .upload-cta-bg {
                    background-color: ${NAVY};
                    background-image:
                        repeating-linear-gradient(45deg, transparent, transparent 12px, rgba(255,255,255,0.018) 12px, rgba(255,255,255,0.018) 13px);
                }

                @keyframes fadeUp { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: translateY(0); } }
                .anim-up   { animation: fadeUp 0.6s cubic-bezier(.4,0,.2,1) both; }
                .anim-up-2 { animation: fadeUp 0.6s 0.1s cubic-bezier(.4,0,.2,1) both; }
                .anim-up-3 { animation: fadeUp 0.6s 0.2s cubic-bezier(.4,0,.2,1) both; }

                @keyframes spin { to { transform: rotate(360deg); } }

                @media (max-width: 640px) {
                    .dept-grid { grid-template-columns: 1fr 1fr !important; }
                    .hero-stats { flex-direction: column !important; gap: 8px !important; }
                }
            `}</style>

            <Navbar />

            {/* ══ HERO ══════════════════════════════════════════════════ */}
            <section ref={heroRef} className="hero-bg" style={{ padding: "72px 24px 60px", position: "relative", overflow: "hidden" }}>
                {/* decorative corner diamonds */}
                <div style={{ position: "absolute", top: -20, right: -20, width: 100, height: 100, border: `0.5px solid rgba(184,150,62,0.15)`, transform: "rotate(45deg)" }} />
                <div style={{ position: "absolute", bottom: -12, left: -12, width: 80, height: 80, border: `0.5px solid rgba(184,150,62,0.1)`, transform: "rotate(45deg)" }} />

                <div style={{ maxWidth: 960, margin: "0 auto" }}>
                    {/* breadcrumb */}
                    <div className="anim-up" style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 24 }}>
                        <Link href="/" style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", fontFamily: "'Lato',sans-serif", textDecoration: "none" }}>Home</Link>
                        <ChevronRight size={12} style={{ color: "rgba(255,255,255,0.3)" }} />
                        <span style={{ fontSize: 12, color: "rgba(255,255,255,0.65)", fontFamily: "'Lato',sans-serif" }}>Departments</span>
                    </div>

                    {/* eyebrow */}
                    <div className="anim-up" style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(184,150,62,0.14)", border: "1px solid rgba(184,150,62,0.3)", borderRadius: 999, padding: "6px 16px", marginBottom: 20 }}>
                        <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#22c55e", display: "inline-block" }} />
                        <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: GOLDD }}>Academic Departments</span>
                    </div>

                    <h1 className="lan-serif anim-up-2" style={{ fontSize: "clamp(38px,7vw,68px)", fontWeight: 900, color: "#fff", lineHeight: 1.03, letterSpacing: "-1px", margin: "0 0 18px" }}>
                        Browse by<br />
                        <span style={{ color: GOLD, fontStyle: "italic" }}>Department</span>
                    </h1>

                    <p className="anim-up-3" style={{ fontSize: 16, color: "rgba(245,240,232,0.6)", maxWidth: 560, lineHeight: 1.75, fontWeight: 300, margin: "0 0 40px" }}>
                        Every faculty. Every level. From first-year notes to postgraduate dissertations — find or upload resources for your exact department.
                    </p>

                    {/* stats strip */}
                    <div className="hero-stats" style={{ display: "flex", flexWrap: "wrap", gap: 0, borderTop: "0.5px solid rgba(184,150,62,0.2)", paddingTop: 0 }}>
                        {[
                            { val: `${DEPARTMENTS.length}+`, label: "Departments" },
                            { val: `${FACULTIES.length - 1}`, label: "Faculties" },
                            { val: "Free", label: "To Browse" },
                            { val: "80%", label: "Seller Share" },
                        ].map(({ val, label }) => (
                            <div key={label} style={{ flex: "1 1 120px", padding: "24px 20px 0", borderRight: "0.5px solid rgba(184,150,62,0.12)" }}>
                                <div className="lan-serif" style={{ fontSize: 26, fontWeight: 700, color: "#fff" }}>{val}</div>
                                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(184,150,62,0.7)", marginTop: 4 }}>{label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ══ STICKY SEARCH + FACULTY TABS ═══════════════════════════ */}
            <div className="sticky-bar" style={{ padding: "14px 24px" }}>
                <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center" }}>

                    {/* search */}
                    <div className="search-wrap" style={{ position: "relative", flex: 1, minWidth: 220 }}>
                        <Search size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#bbb" }} />
                        <input
                            type="text"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Search departments, faculties…"
                            style={{ width: "100%", padding: "9px 12px 9px 36px", border: "0.5px solid #e5ddd0", fontSize: 13, color: NAVY, outline: "none", fontFamily: "'Lato',sans-serif", transition: "border-color 0.18s, box-shadow 0.18s", background: "#fafaf8" }}
                        />
                        {search && (
                            <button onClick={() => setSearch("")} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#bbb", display: "flex" }}>
                                <X size={13} />
                            </button>
                        )}
                    </div>

                    {/* faculty pills */}
                    <div className="pill-scroll" style={{ display: "flex", gap: 6, overflowX: "auto", flexShrink: 0, maxWidth: "calc(100vw - 80px)" }}>
                        <Filter size={13} style={{ color: "#bbb", flexShrink: 0, alignSelf: "center" }} />
                        {FACULTIES.map(f => (
                            <button key={f} className={`fac-pill ${activeTab === f ? "active" : ""}`} onClick={() => setActiveTab(f)}>
                                {f}
                            </button>
                        ))}
                    </div>

                    {/* count */}
                    <span style={{ fontSize: 11, color: "#aaa", fontFamily: "'Lato',sans-serif", flexShrink: 0, fontWeight: 700 }}>
                        {filtered.length} department{filtered.length !== 1 ? "s" : ""}
                    </span>
                </div>
            </div>

            {/* ══ DEPARTMENTS GRID ══════════════════════════════════════ */}
            <section style={{ maxWidth: 1200, margin: "0 auto", padding: "40px 24px 80px" }}>
                {filtered.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "80px 24px", background: "#fff", border: "0.5px solid #e5ddd0" }}>
                        <BookOpen size={40} style={{ color: "#ddd", margin: "0 auto 14px", display: "block" }} />
                        <h3 className="lan-serif" style={{ fontSize: 22, color: NAVY, marginBottom: 6 }}>No Departments Found</h3>
                        <p style={{ fontSize: 13, color: "#bbb", marginBottom: 16 }}>Try a different search term or faculty filter</p>
                        <button onClick={() => { setSearch(""); setActiveTab("All"); }}
                            style={{ fontSize: 12, color: GOLD, background: "none", border: `0.5px solid ${GOLD}`, padding: "8px 18px", cursor: "pointer", fontFamily: "'Lato',sans-serif", fontWeight: 700, letterSpacing: "0.08em" }}>
                            Clear Filters
                        </button>
                    </div>
                ) : (
                    <div className="dept-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 18 }}>
                        {filtered.map((dept, i) => {
                            const fc = FACULTY_COLORS[dept.faculty] || { bg: CREAM, color: NAVY };
                            return (
                                <Link key={dept.slug}
                                    href={`/departments/${dept.slug}`}
                                    className="dept-card"
                                    onMouseEnter={() => setHoveredCard(dept.slug)}
                                    onMouseLeave={() => setHoveredCard(null)}
                                    style={{ animationDelay: `${i * 0.025}s`, animation: "fadeUp 0.5s ease forwards", opacity: 0 }}
                                >
                                    {/* image */}
                                    <div style={{ height: 176, overflow: "hidden", position: "relative" }}>
                                        <img src={dept.image} alt={dept.name} className="dept-img"
                                            onError={e => { e.target.src = "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=600"; }} />
                                        {/* gradient overlay */}
                                        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(13,34,68,0.88) 0%, rgba(13,34,68,0.35) 55%, transparent 100%)" }} />

                                        {/* faculty badge */}
                                        <div style={{ position: "absolute", top: 10, left: 10, background: "rgba(13,34,68,0.85)", padding: "3px 9px" }}>
                                            <span style={{ fontSize: 8, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: GOLD, fontFamily: "'Lato',sans-serif" }}>
                                                {dept.faculty}
                                            </span>
                                        </div>

                                        {/* sub-count badge */}
                                        <div style={{ position: "absolute", top: 10, right: 10, background: GOLD, color: NAVY, padding: "3px 8px" }}>
                                            <span style={{ fontSize: 9, fontWeight: 700, fontFamily: "'Lato',sans-serif" }}>{dept.sub} topics</span>
                                        </div>

                                        {/* title on image bottom */}
                                        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "12px 16px" }}>
                                            <h3 className="lan-serif" style={{ fontSize: 15, fontWeight: 700, color: "#fff", lineHeight: 1.25, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                                                {dept.name}
                                            </h3>
                                        </div>
                                    </div>

                                    {/* card body */}
                                    <div style={{ padding: "14px 16px 16px" }}>
                                        <p style={{ fontSize: 12, color: "#888", lineHeight: 1.65, margin: "0 0 14px" }}>
                                            {dept.description}
                                        </p>
                                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderTop: "0.5px solid #f0ebe0", paddingTop: 12 }}>
                                            <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: hoveredCard === dept.slug ? GOLD : NAVY, fontFamily: "'Lato',sans-serif", transition: "color 0.18s" }}>
                                                Browse Resources
                                            </span>
                                            <div style={{ width: 26, height: 26, border: `0.5px solid ${hoveredCard === dept.slug ? GOLD : "#e5ddd0"}`, display: "flex", alignItems: "center", justifyContent: "center", transition: "border-color 0.18s" }}>
                                                <ArrowRight size={11} style={{ color: hoveredCard === dept.slug ? GOLD : NAVY, transition: "color 0.18s" }} />
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            );
                        })}

                        {/* Upload card */}
                        <Link href="/upload-document" className="dept-card"
                            style={{ background: NAVY, backgroundImage: "radial-gradient(rgba(184,150,62,0.06) 1px,transparent 1px)", backgroundSize: "20px 20px", animation: "fadeUp 0.5s ease forwards", opacity: 0 }}>
                            <div style={{ height: 176, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 10, borderBottom: "0.5px solid rgba(184,150,62,0.2)" }}>
                                <div style={{ width: 56, height: 56, border: `1.5px solid ${GOLD}`, transform: "rotate(45deg)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                    <Upload size={22} style={{ color: GOLD, transform: "rotate(-45deg)" }} />
                                </div>
                            </div>
                            <div style={{ padding: "14px 16px 16px" }}>
                                <h3 className="lan-serif" style={{ fontSize: 15, fontWeight: 700, color: "#fff", marginBottom: 6 }}>Upload for Your Department</h3>
                                <p style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", lineHeight: 1.65, marginBottom: 14 }}>
                                    Share your notes, past questions, or research and earn 80% on every sale.
                                </p>
                                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderTop: "0.5px solid rgba(184,150,62,0.2)", paddingTop: 12 }}>
                                    <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: GOLD, fontFamily: "'Lato',sans-serif" }}>Get Started</span>
                                    <ArrowRight size={12} style={{ color: GOLD }} />
                                </div>
                            </div>
                        </Link>
                    </div>
                )}
            </section>

            {/* ══ FACULTY UPLOAD CTA ════════════════════════════════════ */}
            <section className="upload-cta-bg" style={{ padding: "64px 24px" }}>
                <div style={{ maxWidth: 900, margin: "0 auto", textAlign: "center" }}>
                    {/* gold star */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 14, marginBottom: 24 }}>
                        <div style={{ height: "0.5px", width: 48, background: "rgba(184,150,62,0.4)" }} />
                        <svg width="10" height="10" viewBox="0 0 10 10" fill={GOLD}><polygon points="5,0 6.2,3.8 10,3.8 6.9,6.2 8.1,10 5,7.6 1.9,10 3.1,6.2 0,3.8 3.8,3.8" /></svg>
                        <div style={{ height: "0.5px", width: 48, background: "rgba(184,150,62,0.4)" }} />
                    </div>

                    <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(184,150,62,0.6)", marginBottom: 12, fontFamily: "'Lato',sans-serif" }}>
                        For Educators & Students
                    </p>
                    <h2 className="lan-serif" style={{ fontSize: "clamp(28px,5vw,48px)", fontWeight: 700, color: "#fff", margin: "0 0 14px" }}>
                        Don't see your department?
                    </h2>
                    <p style={{ fontSize: 15, color: "rgba(255,255,255,0.45)", maxWidth: 520, margin: "0 auto 40px", lineHeight: 1.75, fontWeight: 300 }}>
                        Upload resources for any department. Our catalogue grows with every contribution — your materials help students across Africa.
                    </p>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 14, justifyContent: "center" }}>
                        <Link href="/upload-document"
                            style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "13px 28px", background: GOLD, color: NAVY, fontSize: 13, fontWeight: 700, textDecoration: "none", fontFamily: "'Lato',sans-serif", letterSpacing: "0.04em", transition: "background 0.18s" }}
                            onMouseEnter={e => e.currentTarget.style.background = GOLDD}
                            onMouseLeave={e => e.currentTarget.style.background = GOLD}>
                            <Upload size={14} /> Upload for Your Department <ArrowUpRight size={13} />
                        </Link>
                        <Link href="/resources"
                            style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "13px 28px", border: "0.5px solid rgba(255,255,255,0.2)", color: "rgba(255,255,255,0.75)", fontSize: 13, fontWeight: 700, textDecoration: "none", fontFamily: "'Lato',sans-serif", letterSpacing: "0.04em", transition: "background 0.18s" }}
                            onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.06)"}
                            onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                            <BookOpen size={14} /> Browse Resource Types
                        </Link>
                    </div>
                </div>
            </section>

            <Footer />
        </div>
    );
}