"use client";
import React, { useState, useEffect } from "react";
import {
    GraduationCap, BookOpen, School, FileQuestion,
    Building2, Book, Search, Star, Upload, ArrowRight,
    TrendingUp, Users, ChevronLeft, ChevronRight, Award,
    MapPin, Globe, BookMarked, Layers,
} from "lucide-react";
import Navbar from "@/components/NavBar";
import Footer from "@/components/FooterComp";

export default function InstitutionalLibraryClient() {
    const [searchQuery, setSearchQuery] = useState("");
    const [currentSlide, setCurrentSlide] = useState(0);
    const [activeTab, setActiveTab] = useState("all");

    const featuredContent = [
        {
            title: "University Excellence",
            subtitle: "Gateway to Higher Education",
            description: "Comprehensive resources for undergraduate and postgraduate studies across all disciplines",
            tag: "Academic",
            image: "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=1200",
            link: "/institutional/category/university",
            accent: "#1e3a5f",
        },
        {
            title: "Islamic Education",
            subtitle: "Building Strong Foundations in Faith",
            description: "Quranic studies, Islamic jurisprudence, and Arabic language resources",
            tag: "Religious",
            image: "https://images.unsplash.com/photo-1506157786151-b8491531f063?w=1200",
            link: "/institutional/category/islamic-institutions",
            accent: "#1a4731",
        },
        {
            title: "Christian Book Shop",
            subtitle: "Faith-Based Literature",
            description: "Biblical studies, Christian living, devotionals, and inspirational books",
            tag: "Religious",
            image: "https://images.unsplash.com/photo-1519791883288-dc8bd696e667?w=1200",
            link: "/institutional/category/christian-institutions",
            accent: "#3b1f5e",
        },
        {
            title: "WAEC / NECO / JAMB",
            subtitle: "Your Path to Excellence",
            description: "Past questions, study guides, and preparation materials for exam success",
            tag: "Exam Prep",
            image: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=1200",
            link: "/institutional/category/exam-prep",
            accent: "#5e1f1f",
        },
        {
            title: "Secondary School",
            subtitle: "Build Your Future Today",
            description: "Complete curriculum materials for SS1, SS2, and SS3 students",
            tag: "Secondary",
            image: "https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?w=1200",
            link: "/institutional/category/secondary-school",
            accent: "#1f3d5e",
        },
    ];

    const tabs = ["all", "universities", "religious", "schools", "exams"];

    const institutionalCategories = [
        {
            id: "universities", name: "Universities", slug: "university",
            icon: GraduationCap, tab: "universities",
            totalDocuments: 12450, institutions: 156,
            image: "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=800",
            description: "Undergraduate and postgraduate academic resources across all disciplines",
            departments: ["Engineering", "Medicine", "Law", "Business"],
            trending: true, color: "#0f2d52",
        },
        {
            id: "postgraduate", name: "Postgraduate Studies", slug: "postgraduate",
            icon: Award, tab: "universities",
            totalDocuments: 5800, institutions: 89,
            image: "https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=800",
            description: "Masters, PhD and research materials across all disciplines",
            departments: ["Research", "Thesis", "Dissertation", "Academia"],
            trending: false, color: "#1a3a5c",
        },
        {
            id: "polytechnic", name: "Polytechnics", slug: "polytechnic",
            icon: Building2, tab: "universities",
            totalDocuments: 9870, institutions: 67,
            image: "https://images.unsplash.com/photo-1562774053-701939374585?w=800",
            description: "Technical and vocational education for ND and HND programs",
            departments: ["Engineering", "Business", "Applied Sciences", "Technology"],
            trending: false, color: "#243447",
        },
        {
            id: "college-ed", name: "Colleges of Education", slug: "college-of-education",
            icon: BookMarked, tab: "universities",
            totalDocuments: 4200, institutions: 55,
            image: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=800",
            description: "Teacher training and NCE program materials for educators",
            departments: ["Education", "Pedagogy", "Curriculum", "Teaching"],
            trending: false, color: "#1e3a4a",
        },
        {
            id: "islamic", name: "Islamic Institutions", slug: "islamic-institutions",
            icon: Building2, tab: "religious",
            totalDocuments: 5420, institutions: 78,
            image: "https://images.unsplash.com/photo-1506157786151-b8491531f063?w=800",
            description: "Quranic studies, Islamic jurisprudence, and Islamic education",
            departments: ["Quranic Studies", "Islamic Law", "Arabic", "Islamic History"],
            trending: true, color: "#0d3320",
        },
        {
            id: "christian", name: "Christian Institutions", slug: "christian-institutions",
            icon: Building2, tab: "religious",
            totalDocuments: 4890, institutions: 65,
            image: "https://images.unsplash.com/photo-1519791883288-dc8bd696e667?w=800",
            description: "Biblical studies, theology, and Christian education materials",
            departments: ["Biblical Studies", "Theology", "Christian Ethics", "Church History"],
            trending: true, color: "#2d1f4a",
        },
        {
            id: "bible-college", name: "Bible Colleges", slug: "bible-college",
            icon: Book, tab: "religious",
            totalDocuments: 2100, institutions: 45,
            image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800",
            description: "Theological training and biblical education for ministry",
            departments: ["Theology", "Biblical Studies", "Ministry", "Pastoral Care"],
            trending: false, color: "#3a1f3a",
        },
        {
            id: "jewish", name: "Jewish Institutions", slug: "jewish-institutions",
            icon: Building2, tab: "religious",
            totalDocuments: 2340, institutions: 34,
            image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800",
            description: "Torah studies, Jewish law, and Hebrew language resources",
            departments: ["Torah Studies", "Jewish Law", "Hebrew", "Jewish History"],
            trending: false, color: "#2a2010",
        },
        {
            id: "secondary", name: "Secondary School", slug: "secondary-school",
            icon: School, tab: "schools",
            totalDocuments: 8920, institutions: 89,
            image: "https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?w=800",
            description: "Complete curriculum materials for SS1, SS2, and SS3 students",
            departments: ["Sciences", "Arts", "Commercial", "Technical"],
            trending: true, color: "#1f3048",
        },
        {
            id: "primary", name: "Primary School", slug: "primary-school",
            icon: BookOpen, tab: "schools",
            totalDocuments: 6340, institutions: 124,
            image: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800",
            description: "Age-appropriate learning materials for primary 1 through 6",
            departments: ["Mathematics", "English", "Science", "Social Studies"],
            trending: false, color: "#163042",
        },
        {
            id: "waec-neco", name: "WAEC / NECO / JAMB", slug: "exam-prep",
            icon: FileQuestion, tab: "exams",
            totalDocuments: 15680, institutions: 45,
            image: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800",
            description: "Past questions and preparation materials for major examinations",
            departments: ["Past Questions", "Study Guides", "Practice Tests", "Tips"],
            trending: true, color: "#3a1515",
        },
        {
            id: "professional-cert", name: "Professional Certifications", slug: "professional-cert",
            icon: Award, tab: "exams",
            totalDocuments: 7200, institutions: 60,
            image: "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=800",
            description: "ICAN, ACCA, CFA, PMP and other professional qualifications",
            departments: ["ICAN", "ACCA", "CFA", "PMP"],
            trending: true, color: "#2a1a40",
        },
    ];

    const filtered = institutionalCategories.filter(c =>
        (activeTab === "all" || c.tab === activeTab) &&
        (c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            c.description.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    const nextSlide = () => setCurrentSlide(p => (p + 1) % featuredContent.length);
    const prevSlide = () => setCurrentSlide(p => (p - 1 + featuredContent.length) % featuredContent.length);

    useEffect(() => {
        const t = setInterval(nextSlide, 6000);
        return () => clearInterval(t);
    }, [currentSlide]);

    const formatCount = n => n >= 1000 ? `${(n / 1000).toFixed(1)}K` : n;

    return (
        <>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700;900&family=Source+Sans+3:wght@300;400;500;600&display=swap');

                .inst-root { font-family: 'Source Sans 3', sans-serif; }
                .inst-serif { font-family: 'Playfair Display', Georgia, serif; }

                .hero-slide { transition: opacity 0.8s ease, transform 0.8s ease; }
                .hero-slide.active { opacity: 1; transform: scale(1); }
                .hero-slide.inactive { opacity: 0; transform: scale(1.02); pointer-events: none; }

                .cat-card { transition: all 0.3s cubic-bezier(0.4,0,0.2,1); }
                .cat-card:hover { transform: translateY(-4px); }
                .cat-card:hover .cat-img { transform: scale(1.06); }
                .cat-img { transition: transform 0.6s cubic-bezier(0.4,0,0.2,1); }

                .tab-btn { transition: all 0.2s ease; border-bottom: 2px solid transparent; }
                .tab-btn.active-tab { border-bottom-color: #0f2d52; color: #0f2d52; }

                .seal { 
                    width: 80px; height: 80px; border-radius: 50%;
                    border: 3px solid rgba(255,255,255,0.3);
                    display: flex; align-items: center; justify-content: center;
                    background: rgba(255,255,255,0.1);
                    backdrop-filter: blur(8px);
                }

                .dept-tag { 
                    font-size: 10px; font-weight: 600; letter-spacing: 0.05em;
                    text-transform: uppercase; padding: 2px 8px;
                    border: 1px solid rgba(0,0,0,0.12); border-radius: 2px;
                    color: #555; background: #f8f8f6;
                }

                .crest-pattern {
                    background-image: 
                        repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.03) 10px, rgba(255,255,255,0.03) 11px),
                        repeating-linear-gradient(-45deg, transparent, transparent 10px, rgba(255,255,255,0.03) 10px, rgba(255,255,255,0.03) 11px);
                }

                .stat-divider { border-left: 1px solid rgba(255,255,255,0.2); }

                .slide-dot { transition: all 0.3s ease; }
                .slide-dot.active { width: 24px; border-radius: 4px; background: white; }
                .slide-dot.inactive { width: 8px; border-radius: 50%; background: rgba(255,255,255,0.45); }

                .search-bar:focus { box-shadow: 0 0 0 3px rgba(15,45,82,0.15); }

                .ribbon {
                    position: absolute; top: 16px; right: -4px;
                    background: #c8a84b; color: white;
                    font-size: 9px; font-weight: 700; letter-spacing: 0.1em;
                    text-transform: uppercase; padding: 3px 10px 3px 8px;
                    clip-path: polygon(0 0, 100% 0, 100% 100%, 0 100%, 6% 50%);
                }

                .gold { color: #c8a84b; }
                .bg-navy { background: #0f2d52; }
                .border-navy { border-color: #0f2d52; }
            `}</style>

            <Navbar />

            <div className="inst-root min-h-screen bg-[#f5f3ee]">

                {/* ── HERO CAROUSEL ── */}
                <div className="relative w-full h-[480px] md:h-[620px] overflow-hidden bg-gray-900">
                    {featuredContent.map((item, i) => (
                        <a
                            key={i}
                            href={item.link}
                            className={`hero-slide absolute inset-0 ${i === currentSlide ? "active" : "inactive"}`}
                        >
                            <img src={item.image} alt={item.title}
                                className="w-full h-full object-cover cat-img" />
                            <div className="absolute inset-0"
                                style={{ background: `linear-gradient(to top, ${item.accent}f0 0%, ${item.accent}99 40%, ${item.accent}33 100%)` }} />

                            {/* Crest pattern overlay */}
                            <div className="absolute inset-0 crest-pattern" />

                            {/* Top bar — institution style */}
                            <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-6 py-4"
                                style={{ borderBottom: "1px solid rgba(255,255,255,0.12)" }}>
                                <div className="flex items-center gap-2">
                                    <Globe size={14} className="text-white/60" />
                                    <span className="text-white/60 text-xs tracking-widest uppercase font-light">
                                        LAN Institutional Library
                                    </span>
                                </div>
                                <span className="text-white/50 text-xs border border-white/20 px-3 py-1 rounded-full">
                                    {item.tag}
                                </span>
                            </div>

                            {/* Content */}
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="max-w-3xl mx-auto px-6 text-center text-white">
                                    {/* Decorative rule */}
                                    <div className="flex items-center justify-center gap-4 mb-6">
                                        <div className="h-px w-16 bg-white/30" />
                                        <span className="text-xs tracking-[0.3em] uppercase text-white/60 font-light">
                                            Academic Resource Centre
                                        </span>
                                        <div className="h-px w-16 bg-white/30" />
                                    </div>

                                    <h1 className="inst-serif text-4xl md:text-6xl font-bold mb-2 leading-tight">
                                        {item.title}
                                    </h1>
                                    <p className="inst-serif text-lg md:text-2xl text-white/70 italic mb-4">
                                        {item.subtitle}
                                    </p>
                                    <p className="text-sm md:text-base text-white/60 mb-8 max-w-xl mx-auto leading-relaxed font-light">
                                        {item.description}
                                    </p>

                                    <div className="inline-flex items-center gap-3 bg-white text-gray-900 px-7 py-3 text-sm font-semibold tracking-wide hover:bg-white/90 transition-colors">
                                        <span>Access Resources</span>
                                        <ArrowRight size={16} />
                                    </div>
                                </div>
                            </div>
                        </a>
                    ))}

                    {/* Arrows */}
                    <button onClick={prevSlide} aria-label="Previous"
                        className="absolute left-5 top-1/2 -translate-y-1/2 w-10 h-10 border border-white/30 flex items-center justify-center text-white hover:bg-white/10 transition-colors">
                        <ChevronLeft size={20} />
                    </button>
                    <button onClick={nextSlide} aria-label="Next"
                        className="absolute right-5 top-1/2 -translate-y-1/2 w-10 h-10 border border-white/30 flex items-center justify-center text-white hover:bg-white/10 transition-colors">
                        <ChevronRight size={20} />
                    </button>

                    {/* Dots */}
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2">
                        {featuredContent.map((_, i) => (
                            <button key={i} onClick={() => setCurrentSlide(i)}
                                className={`slide-dot h-2 ${i === currentSlide ? "active" : "inactive"}`} />
                        ))}
                    </div>

                    {/* Slide counter */}
                    <div className="absolute bottom-6 right-6 text-white/40 text-xs font-mono">
                        {String(currentSlide + 1).padStart(2, "0")} / {String(featuredContent.length).padStart(2, "0")}
                    </div>
                </div>

                {/* ── STATS STRIP ── */}
                <div className="bg-[#0f2d52]">
                    <div className="max-w-6xl mx-auto px-4">
                        <div className="grid grid-cols-3 md:grid-cols-3 divide-x divide-white/10">
                            {[
                                { label: "Institutional Categories", value: "12+", icon: Building2 },
                                { label: "Academic Documents", value: "80K+", icon: BookOpen },
                                { label: "Registered Learners", value: "2.4M+", icon: Users },
                            ].map(({ label, value, icon: Icon }) => (
                                <div key={label} className="flex flex-col md:flex-row items-center justify-center gap-3 py-5 px-4 text-white">
                                    <Icon size={18} className="opacity-40 flex-shrink-0" />
                                    <div className="text-center md:text-left">
                                        <div className="text-xl md:text-2xl font-bold">{value}</div>
                                        <div className="text-[10px] md:text-xs text-white/50 uppercase tracking-wider">{label}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* ── MAIN CONTENT ── */}
                <div className="max-w-6xl mx-auto px-4 py-14">

                    {/* Section heading */}
                    <div className="text-center mb-10">
                        <p className="text-xs tracking-[0.3em] uppercase text-[#c8a84b] font-semibold mb-3">
                            Browse by Institution Type
                        </p>
                        <h2 className="inst-serif text-3xl md:text-5xl font-bold text-[#0f2d52] mb-4">
                            Choose Your Academic Path
                        </h2>
                        <div className="flex items-center justify-center gap-4 mb-6">
                            <div className="h-px w-20 bg-[#c8a84b]/40" />
                            <div className="w-2 h-2 bg-[#c8a84b] rotate-45" />
                            <div className="h-px w-20 bg-[#c8a84b]/40" />
                        </div>
                        <p className="text-gray-500 max-w-xl mx-auto text-sm leading-relaxed">
                            Explore our comprehensive collection of institutional resources tailored to your educational level and learning goals
                        </p>
                    </div>

                    {/* Search + Tabs */}
                    <div className="bg-white border border-gray-200 p-4 mb-8 shadow-sm">
                        <div className="flex flex-col md:flex-row gap-4 items-center">
                            {/* Search */}
                            <div className="relative flex-1 w-full">
                                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    placeholder="Search institutions, departments, or subjects..."
                                    className="search-bar w-full pl-9 pr-4 py-2.5 border border-gray-200 text-sm text-gray-900 focus:outline-none focus:border-[#0f2d52] transition-all"
                                />
                            </div>

                            {/* Tab filters */}
                            <div className="flex gap-1 overflow-x-auto w-full md:w-auto"
                                style={{ scrollbarWidth: "none" }}>
                                {tabs.map(tab => (
                                    <button key={tab} onClick={() => setActiveTab(tab)}
                                        className={`tab-btn flex-none px-4 py-2.5 text-xs font-semibold uppercase tracking-wider whitespace-nowrap transition-all ${activeTab === tab ? "active-tab bg-[#0f2d52] text-white border-b-0" : "text-gray-500 hover:text-gray-800 bg-gray-50 border-b-gray-200"}`}>
                                        {tab}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Categories Grid */}
                    {filtered.length === 0 ? (
                        <div className="text-center py-24 bg-white border border-gray-200">
                            <BookOpen size={40} className="mx-auto text-gray-200 mb-4" />
                            <h3 className="inst-serif text-xl font-bold text-gray-800 mb-2">No Results Found</h3>
                            <p className="text-gray-500 text-sm">Try adjusting your search or filter</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                            {filtered.map(cat => {
                                const Icon = cat.icon;
                                return (
                                    <a key={cat.id}
                                        href={`/institutional/category/${cat.slug}`}
                                        className="cat-card group bg-white border border-gray-200 overflow-hidden shadow-sm hover:shadow-xl hover:border-[#0f2d52]/30 block">

                                        {/* Image with overlay */}
                                        <div className="relative h-44 overflow-hidden">
                                            <img src={cat.image} alt={cat.name}
                                                className="cat-img w-full h-full object-cover" />
                                            {/* Dark overlay */}
                                            <div className="absolute inset-0"
                                                style={{ background: `linear-gradient(to top, ${cat.color}ee 0%, ${cat.color}88 50%, transparent 100%)` }} />

                                            {/* Top badges */}
                                            <div className="absolute top-3 left-3 flex items-center gap-2">
                                                <div className="bg-white/95 p-2 shadow-lg">
                                                    <Icon size={18} style={{ color: cat.color }} />
                                                </div>
                                            </div>

                                            {/* Trending ribbon */}
                                            {cat.trending && (
                                                <div className="ribbon">Trending</div>
                                            )}

                                            {/* Bottom info on image */}
                                            <div className="absolute bottom-0 left-0 right-0 p-4">
                                                <h3 className="inst-serif text-lg font-bold text-white leading-tight mb-1">
                                                    {cat.name}
                                                </h3>
                                                <div className="flex items-center gap-3 text-white/60 text-xs">
                                                    <span className="flex items-center gap-1">
                                                        <BookOpen size={10} />
                                                        {formatCount(cat.totalDocuments)} docs
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <Building2 size={10} />
                                                        {cat.institutions} institutions
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Card body */}
                                        <div className="p-4">
                                            <p className="text-gray-500 text-xs leading-relaxed mb-4 line-clamp-2">
                                                {cat.description}
                                            </p>

                                            {/* Departments */}
                                            <div className="flex flex-wrap gap-1.5 mb-4">
                                                {cat.departments.slice(0, 3).map(d => (
                                                    <span key={d} className="dept-tag">{d}</span>
                                                ))}
                                                {cat.departments.length > 3 && (
                                                    <span className="dept-tag text-gray-400">+{cat.departments.length - 3}</span>
                                                )}
                                            </div>

                                            {/* CTA row */}
                                            <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                                                <span className="text-xs font-semibold text-[#0f2d52] uppercase tracking-wider">
                                                    Browse Resources
                                                </span>
                                                <div className="w-8 h-8 flex items-center justify-center border border-[#0f2d52]/20 group-hover:bg-[#0f2d52] group-hover:border-[#0f2d52] transition-all">
                                                    <ArrowRight size={14} className="text-[#0f2d52] group-hover:text-white transition-colors" />
                                                </div>
                                            </div>
                                        </div>
                                    </a>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* ── ACADEMIC NOTICE BOARD ── */}
                <div className="bg-white border-y border-gray-200 py-12">
                    <div className="max-w-6xl mx-auto px-4">
                        <div className="flex flex-col md:flex-row gap-8 items-center">
                            {/* Left: Decorative crest area */}
                            <div className="flex-shrink-0 text-center">
                                <div className="w-20 h-20 mx-auto border-2 border-[#0f2d52] flex items-center justify-center mb-3 rotate-45">
                                    <GraduationCap size={32} className="text-[#0f2d52] -rotate-45" />
                                </div>
                                <p className="inst-serif text-xs text-gray-400 italic">Est. LAN Library</p>
                            </div>

                            {/* Divider */}
                            <div className="hidden md:block w-px h-24 bg-gray-200 flex-shrink-0" />

                            {/* Centre: Notice */}
                            <div className="flex-1 text-center md:text-left">
                                <p className="text-xs tracking-[0.25em] uppercase text-[#c8a84b] font-semibold mb-2">
                                    Notice to All Scholars
                                </p>
                                <h3 className="inst-serif text-2xl md:text-3xl font-bold text-[#0f2d52] mb-3">
                                    Are you an Educator or Institution?
                                </h3>
                                <p className="text-gray-500 text-sm leading-relaxed max-w-xl">
                                    Join thousands of educators contributing to Africa's largest digital academic library.
                                    Upload your course materials, past questions, and research papers to reach millions of students.
                                </p>
                            </div>

                            {/* Right: Actions */}
                            <div className="flex-shrink-0 flex flex-col gap-3">
                                <a href="/upload-document"
                                    className="flex items-center gap-2 bg-[#0f2d52] text-white px-6 py-3 text-sm font-semibold hover:bg-[#1a3d6e] transition-colors">
                                    <Upload size={15} />
                                    Upload Materials
                                </a>
                                <a href="/documents"
                                    className="flex items-center gap-2 border border-[#0f2d52] text-[#0f2d52] px-6 py-3 text-sm font-semibold hover:bg-[#f0f4fa] transition-colors">
                                    <Search size={15} />
                                    Browse Library
                                </a>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── FEATURED PATHS (horizontal scroll) ── */}
                <div className="py-14 max-w-6xl mx-auto px-4">
                    <div className="flex items-end justify-between mb-8">
                        <div>
                            <p className="text-xs tracking-[0.3em] uppercase text-[#c8a84b] font-semibold mb-2">
                                Popular This Term
                            </p>
                            <h3 className="inst-serif text-2xl md:text-3xl font-bold text-[#0f2d52]">
                                Trending Academic Areas
                            </h3>
                        </div>
                        <a href="/documents"
                            className="hidden md:flex items-center gap-2 text-sm text-[#0f2d52] font-semibold hover:underline">
                            View All <ArrowRight size={14} />
                        </a>
                    </div>

                    <div className="flex gap-4 overflow-x-auto pb-4" style={{ scrollbarWidth: "none" }}>
                        {institutionalCategories.filter(c => c.trending).map(cat => {
                            const Icon = cat.icon;
                            return (
                                <a key={cat.id}
                                    href={`/institutional/category/${cat.slug}`}
                                    className="flex-none w-56 group bg-white border border-gray-200 p-5 hover:border-[#0f2d52]/30 hover:shadow-lg transition-all">
                                    <div className="w-10 h-10 border border-gray-200 flex items-center justify-center mb-4 group-hover:border-[#0f2d52]/30 transition-colors">
                                        <Icon size={20} style={{ color: cat.color }} />
                                    </div>
                                    <h4 className="inst-serif font-bold text-[#0f2d52] text-sm mb-1 line-clamp-2">{cat.name}</h4>
                                    <p className="text-[11px] text-gray-400 mb-3 line-clamp-2">{cat.description}</p>
                                    <div className="flex items-center gap-1 text-[#c8a84b]">
                                        <TrendingUp size={11} />
                                        <span className="text-[10px] font-bold uppercase tracking-wider">Trending</span>
                                    </div>
                                </a>
                            );
                        })}
                    </div>
                </div>

                {/* ── CTA BANNER ── */}
                <div className="bg-[#0f2d52] crest-pattern">
                    <div className="max-w-6xl mx-auto px-4 py-16 text-center text-white">
                        <div className="flex items-center justify-center gap-4 mb-6">
                            <div className="h-px w-16 bg-[#c8a84b]/50" />
                            <Star size={16} className="text-[#c8a84b] fill-[#c8a84b]" />
                            <div className="h-px w-16 bg-[#c8a84b]/50" />
                        </div>
                        <h2 className="inst-serif text-3xl md:text-5xl font-bold mb-4">
                            Ready to Excel in Your Studies?
                        </h2>
                        <p className="text-white/60 max-w-xl mx-auto text-sm leading-relaxed mb-10 font-light">
                            Access premium academic resources and join a community of over 2.4 million learners dedicated to educational excellence across Nigeria and beyond.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <a href="/documents"
                                className="inline-flex items-center justify-center gap-2 bg-[#c8a84b] text-white px-8 py-3.5 text-sm font-semibold hover:bg-[#b8982b] transition-colors">
                                <Search size={16} />
                                Browse All Documents
                            </a>
                            <a href="/become-seller"
                                className="inline-flex items-center justify-center gap-2 border border-white/30 text-white px-8 py-3.5 text-sm font-semibold hover:bg-white/10 transition-colors">
                                <Upload size={16} />
                                Contribute Resources
                            </a>
                        </div>
                    </div>
                </div>

            </div>
        </>
    );
}