"use client";
import React, { useState, useEffect } from "react";
import {
    GraduationCap,
    BookOpen,
    School,
    FileQuestion,
    Building2,
    Book,
    Search,
    Filter,
    Star,
    Download,
    Eye,
    ChevronRight,
    Users,
    Award,
    TrendingUp,
    Upload,
    ArrowRight,
    Sparkles,
} from "lucide-react";
import Navbar from "@/components/NavBar";
import Footer from "@/components/FooterComp";

export default function InstitutionalLibraryPage() {
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedLevel, setSelectedLevel] = useState("all");
    const [showStats, setShowStats] = useState(true);

    // Comprehensive institutional categories with rich data
    const institutionalCategories = [
        {
            id: "universities",
            name: "Universities",
            slug: "university",
            icon: GraduationCap,
            totalDocuments: 12450,
            subcategories: 24,
            image:
                "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=800",
            description:
                "Comprehensive academic resources for undergraduate and postgraduate studies",
            institutions: 156,
            popularDepartments: [
                "Engineering",
                "Medicine",
                "Law",
                "Business",
                "Sciences",
            ],
            trending: true,
            gradient: "from-blue-600 to-indigo-700",
        },
        {
            id: "islamic",
            name: "Islamic Institutions",
            slug: "islamic-institutions",
            icon: Building2,
            totalDocuments: 5420,
            subcategories: 14,
            image:
                "https://images.unsplash.com/photo-1506157786151-b8491531f063?w=800",
            description:
                "Quranic studies, Islamic jurisprudence, and Islamic education resources",
            institutions: 78,
            popularDepartments: [
                "Quranic Studies",
                "Islamic Law",
                "Arabic Language",
                "Islamic History",
            ],
            trending: true,
            gradient: "from-emerald-600 to-teal-700",
        },
        {
            id: "christian",
            name: "Christian Institutions",
            slug: "christian-institutions",
            icon: Building2,
            totalDocuments: 4890,
            subcategories: 12,
            image: "https://images.unsplash.com/photo-1548877528-b34d3fb135cd?w=800",
            description:
                "Biblical studies, theology, and Christian education materials",
            institutions: 65,
            popularDepartments: [
                "Biblical Studies",
                "Theology",
                "Christian Ethics",
                "Church History",
            ],
            trending: true,
            gradient: "from-purple-600 to-violet-700",
        },
        {
            id: "jewish",
            name: "Jewish Institutions",
            slug: "jewish-institutions",
            icon: Building2,
            totalDocuments: 2340,
            subcategories: 8,
            image:
                "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800",
            description: "Torah studies, Jewish law, and Hebrew language resources",
            institutions: 34,
            popularDepartments: [
                "Torah Studies",
                "Jewish Law",
                "Hebrew",
                "Jewish History",
            ],
            trending: false,
            gradient: "from-amber-600 to-orange-700",
        },
        {
            id: "secondary",
            name: "Secondary School",
            slug: "secondary-school",
            icon: School,
            totalDocuments: 8920,
            subcategories: 18,
            image:
                "https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?w=800",
            description:
                "Complete curriculum materials for SS1, SS2, and SS3 students",
            institutions: 89,
            popularDepartments: ["Sciences", "Arts", "Commercial", "Technical"],
            trending: true,
            gradient: "from-rose-600 to-pink-700",
        },
        {
            id: "primary",
            name: "Primary School",
            slug: "primary-school",
            icon: BookOpen,
            totalDocuments: 6340,
            subcategories: 12,
            image:
                "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800",
            description:
                "Age-appropriate learning materials for primary 1 through primary 6",
            institutions: 124,
            popularDepartments: [
                "Mathematics",
                "English",
                "Science",
                "Social Studies",
            ],
            trending: false,
            gradient: "from-cyan-600 to-blue-700",
        },
        {
            id: "waec-neco",
            name: "WAEC/NECO/JAMB",
            slug: "exam-prep",
            icon: FileQuestion,
            totalDocuments: 15680,
            subcategories: 16,
            image:
                "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800",
            description:
                "Past questions, answers, and preparation materials for major examinations",
            institutions: 45,
            popularDepartments: [
                "Past Questions",
                "Study Guides",
                "Practice Tests",
                "Tips & Tricks",
            ],
            trending: true,
            gradient: "from-red-600 to-rose-700",
        },
        {
            id: "polytechnic",
            name: "Polytechnics",
            slug: "polytechnic",
            icon: Building2,
            totalDocuments: 9870,
            subcategories: 20,
            image: "https://images.unsplash.com/photo-1562774053-701939374585?w=800",
            description:
                "Technical and vocational education resources for ND and HND programs",
            institutions: 67,
            popularDepartments: [
                "Engineering",
                "Business",
                "Applied Sciences",
                "Technology",
            ],
            trending: false,
            gradient: "from-slate-600 to-gray-700",
        },
        {
            id: "colleges",
            name: "Colleges of Education",
            slug: "college-of-education",
            icon: Award,
            totalDocuments: 7230,
            subcategories: 15,
            image:
                "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=800",
            description: "Teacher training and NCE program materials",
            institutions: 52,
            popularDepartments: ["Education", "Arts", "Sciences", "Languages"],
            trending: false,
            gradient: "from-green-600 to-emerald-700",
        },
        {
            id: "professional",
            name: "Professional Certifications",
            slug: "professional-cert",
            icon: Book,
            totalDocuments: 11250,
            subcategories: 22,
            image:
                "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=800",
            description:
                "ICAN, ACCA, CFA, PMP, and other professional qualification materials",
            institutions: 38,
            popularDepartments: [
                "Accounting",
                "Finance",
                "Project Management",
                "IT Certifications",
            ],
            trending: true,
            gradient: "from-indigo-600 to-purple-700",
        },
        {
            id: "postgraduate",
            name: "Postgraduate Studies",
            slug: "postgraduate",
            icon: GraduationCap,
            totalDocuments: 8450,
            subcategories: 19,
            image:
                "https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=800",
            description:
                "Masters, PhD, and research materials across all disciplines",
            institutions: 94,
            popularDepartments: [
                "Research",
                "Thesis",
                "Dissertations",
                "Advanced Studies",
            ],
            trending: true,
            gradient: "from-violet-600 to-fuchsia-700",
        },
    ];

    // Platform statistics
    const platformStats = [
        { label: "Total Documents", value: "80,190+", icon: BookOpen },
        { label: "Institutions", value: "665+", icon: Building2 },
        { label: "Active Learners", value: "2.4M+", icon: Users },
        { label: "Success Rate", value: "94%", icon: TrendingUp },
    ];

    // Filter categories based on search
    const filteredCategories = institutionalCategories.filter(
        (cat) =>
            cat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            cat.description.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-white">
            {/* Hero Section */}
            <Navbar />             
            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 py-20">
                {/* Section Header */}
                <div className="mb-16 text-center">
                    <h2 className="text-5xl font-bold text-blue-950 mb-6">
                        Choose Your Academic Path
                    </h2>
                    <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                        Explore our comprehensive collection of institutional resources
                        tailored to your educational level
                    </p>
                </div>

                {/* Categories Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20">
                    {filteredCategories.map((category) => {
                        const IconComponent = category.icon;

                        return (
                            <a
                                key={category.id}
                                href={`/institutional/category/${category.slug}`}
                                className="group relative bg-white border border-gray-200 rounded-2xl overflow-hidden hover:border-blue-950 transition-all duration-300 hover:shadow-2xl hover:shadow-blue-950/10"
                            >
                                {/* Trending Badge */}
                                {category.trending && (
                                    <div className="absolute top-6 right-6 z-10 bg-blue-950 text-white px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1 shadow-lg">
                                        <TrendingUp className="w-3.5 h-3.5" />
                                        Trending
                                    </div>
                                )}

                                {/* Image Section with Gradient Overlay */}
                                <div className="relative h-64 overflow-hidden">
                                    <div
                                        className={`absolute inset-0 bg-gradient-to-br ${category.gradient} mix-blend-multiply opacity-80 group-hover:opacity-90 transition-opacity duration-500`}
                                    />
                                    <img
                                        src={category.image}
                                        alt={category.name}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                                    />

                                    {/* Icon Overlay */}
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="bg-white/95 p-5 rounded-2xl shadow-2xl group-hover:scale-110 group-hover:rotate-3 transition-all duration-500">
                                            <IconComponent
                                                className="w-12 h-12 text-blue-950"
                                                strokeWidth={2}
                                            />
                                        </div>
                                    </div>

                                    {/* Stats Badge */}
                                    <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                                        <div className="bg-white/95 backdrop-blur-sm px-3 py-2 rounded-lg shadow-lg">
                                            <div className="text-xs text-gray-600 font-medium">
                                                Documents
                                            </div>
                                            <div className="text-sm font-bold text-blue-950">
                                                {category.totalDocuments.toLocaleString()}
                                            </div>
                                        </div>
                                        <div className="bg-white/95 backdrop-blur-sm px-3 py-2 rounded-lg shadow-lg">
                                            <div className="text-xs text-gray-600 font-medium">
                                                Institutions
                                            </div>
                                            <div className="text-sm font-bold text-blue-950">
                                                {category.institutions}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Content Section */}
                                <div className="p-6">
                                    <h3 className="text-2xl font-bold text-blue-950 mb-3 group-hover:text-blue-700 transition-colors">
                                        {category.name}
                                    </h3>

                                    <p className="text-gray-600 mb-6 leading-relaxed line-clamp-2">
                                        {category.description}
                                    </p>

                                    {/* Popular Areas */}
                                    <div className="mb-6">
                                        <div className="text-xs text-gray-500 mb-3 font-semibold uppercase tracking-wide">
                                            Popular Areas
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {category.popularDepartments
                                                .slice(0, 3)
                                                .map((dept, idx) => (
                                                    <span
                                                        key={idx}
                                                        className="text-xs bg-gray-100 text-gray-700 px-3 py-1.5 rounded-lg font-medium hover:bg-blue-50 hover:text-blue-950 transition-colors"
                                                    >
                                                        {dept}
                                                    </span>
                                                ))}
                                        </div>
                                    </div>

                                    {/* CTA */}
                                    <div className="flex items-center justify-between pt-6 border-t border-gray-100">
                                        <span className="text-blue-950 font-semibold text-sm">
                                            Explore Collection
                                        </span>
                                        <div className="w-10 h-10 rounded-full bg-blue-950 flex items-center justify-center group-hover:bg-blue-900 transition-colors">
                                            <ArrowRight className="w-5 h-5 text-white group-hover:translate-x-1 transition-transform duration-300" />
                                        </div>
                                    </div>
                                </div>
                            </a>
                        );
                    })}
                </div>

                {/* No Results Message */}
                {filteredCategories.length === 0 && (
                    <div className="text-center py-20">
                        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <BookOpen className="w-10 h-10 text-gray-400" />
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-3">
                            No Results Found
                        </h3>
                        <p className="text-gray-600">Try adjusting your search terms</p>
                    </div>
                )}

                {/* CTA Section */}
                <div className="bg-blue-950 rounded-3xl p-12 md:p-16 text-center text-white relative overflow-hidden">
                    {/* Decorative elements */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl"></div>
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/5 rounded-full blur-3xl"></div>

                    <div className="relative z-10">
                        <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full mb-6 border border-white/20">
                            <Star className="w-4 h-4 text-yellow-300 fill-yellow-300" />
                            <span className="text-sm font-medium">Join 2.4M+ Learners</span>
                        </div>

                        <h2 className="text-4xl md:text-5xl font-bold mb-6">
                            Ready to Excel in Your Studies?
                        </h2>
                        <p className="text-xl text-blue-100 mb-10 max-w-3xl mx-auto leading-relaxed">
                            Access premium academic resources and join a community dedicated
                            to educational excellence
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <a
                                href="/documents"
                                className="inline-flex items-center justify-center gap-2 bg-white text-blue-950 px-8 py-4 rounded-xl font-bold hover:bg-blue-50 transition-all hover:shadow-2xl hover:shadow-white/20"
                            >
                                <Search className="w-5 h-5" />
                                Browse All Documents
                            </a>
                            <a
                                href="/become-seller"
                                className="inline-flex items-center justify-center gap-2 bg-blue-900 text-white px-8 py-4 rounded-xl font-bold border-2 border-white/20 hover:bg-blue-800 transition-all"
                            >
                                <Upload className="w-5 h-5" />
                                Contribute Resources
                            </a>
                        </div>
                    </div>
                </div>
            </div>

            <style jsx>{`
        @keyframes float {
          0%,
          100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-20px);
          }
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
      `}</style>
            <Footer />
        </div>
    );
}





