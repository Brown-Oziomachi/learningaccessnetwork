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
    Star,
    Upload,
    ArrowRight,
    TrendingUp,
    Users,
    ChevronLeft,
    ChevronRight,
} from "lucide-react";
import Navbar from "@/components/NavBar";
import Footer from "@/components/FooterComp";



export default function InstitutionalLibraryClient() {
    const [searchQuery, setSearchQuery] = useState("");
    const [currentSlide, setCurrentSlide] = useState(0);

    const featuredContent = [
        {
            title: "University Excellence: Your Gateway to Higher Education",
            description: "Discover comprehensive resources for undergraduate and postgraduate studies across all disciplines",
            timeAgo: "2 weeks ago",
            author: "Academic Team",
            image: "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=1200",
            link: "/institutional/category/university",
        },
        {
            title: "Islamic Education: Building Strong Foundations in Faith",
            description: "Explore Quranic studies, Islamic jurisprudence, and Arabic language resources",
            timeAgo: "3 weeks ago",
            author: "Islamic Studies Team",
            image: "https://images.unsplash.com/photo-1506157786151-b8491531f063?w=1200",
            link: "/institutional/category/islamic-institutions",
        },
        {
            title: "Christian Book Shop: Faith-Based Literature",
            description: "Access Biblical studies, Christian living, devotionals, and inspirational books for spiritual growth",
            timeAgo: "4 weeks ago",
            author: "Christian Book Shop Team",
            image: 'https://images.unsplash.com/photo-1519791883288-dc8bd696e667?w=1200&q=80',
            link: "/institutional/category/christian-institutions",
        },
        {
            title: "Jewish Scholarship: Ancient Wisdom for Modern Times",
            description: "Dive into Torah studies, Jewish law, and Hebrew language learning resources",
            timeAgo: "5 weeks ago",
            author: "Jewish Studies Team",
            image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1200",
            link: "/institutional/category/jewish-institutions",
        },
        {
            title: "Secondary School Success: Build Your Future Today",
            description: "Complete curriculum materials for SS1, SS2, and SS3 students across all subjects",
            timeAgo: "1 week ago",
            author: "Secondary Education Team",
            image: "https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?w=1200",
            link: "/institutional/category/secondary-school",
        },
        {
            title: "Primary Education: Foundation for Lifelong Learning",
            description: "Age-appropriate learning materials for primary 1 through primary 6 students",
            timeAgo: "2 weeks ago",
            author: "Primary Education Team",
            image: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=1200",
            link: "/institutional/category/primary-school",
        },
        {
            title: "WAEC/NECO/JAMB Success: Your Path to Excellence",
            description: "Access past questions, study guides, and preparation materials for exam success",
            timeAgo: "3 days ago",
            author: "Exam Prep Team",
            image: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=1200",
            link: "/institutional/category/exam-prep",
        },
        {
            title: "Polytechnic Education: Technical Skills for Tomorrow",
            description: "Technical and vocational education resources for ND and HND programs",
            timeAgo: "1 week ago",
            author: "Polytechnic Team",
            image: "https://images.unsplash.com/photo-1562774053-701939374585?w=1200",
            link: "/institutional/category/polytechnic",
        },
        {
            title: "Bible School: Theological Education for Spiritual Leaders",
            description: "Comprehensive theological training and biblical education resources for ministry preparation",
            timeAgo: "1 week ago",
            author: "Bible School Team",
            image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=1200&q=80",
            link: "/institutional/category/bible-college",
        },
    ];

    const institutionalCategories = [
        {
            id: "universities",
            name: "Universities",
            slug: "university",
            icon: GraduationCap,
            totalDocuments: 12450,
            subcategories: 24,
            image: "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=800",
            description: "Comprehensive academic resources for undergraduate and postgraduate studies",
            institutions: 156,
            popularDepartments: ["Engineering", "Medicine", "Law", "Business", "Sciences"],
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
            image: "https://images.unsplash.com/photo-1506157786151-b8491531f063?w=800",
            description: "Quranic studies, Islamic jurisprudence, and Islamic education resources",
            institutions: 78,
            popularDepartments: ["Quranic Studies", "Islamic Law", "Arabic Language", "Islamic History"],
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
            image: 'https://images.unsplash.com/photo-1519791883288-dc8bd696e667?w=1200&q=80',
            description: "Biblical studies, theology, and Christian education materials",
            institutions: 65,
            popularDepartments: ["Biblical Studies", "Theology", "Christian Ethics", "Church History"],
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
            image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800",
            description: "Torah studies, Jewish law, and Hebrew language resources",
            institutions: 34,
            popularDepartments: ["Torah Studies", "Jewish Law", "Hebrew", "Jewish History"],
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
            image: "https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?w=800",
            description: "Complete curriculum materials for SS1, SS2, and SS3 students",
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
            image: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800",
            description: "Age-appropriate learning materials for primary 1 through primary 6",
            institutions: 124,
            popularDepartments: ["Mathematics", "English", "Science", "Social Studies"],
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
            image: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800",
            description: "Past questions, answers, and preparation materials for major examinations",
            institutions: 45,
            popularDepartments: ["Past Questions", "Study Guides", "Practice Tests", "Tips & Tricks"],
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
            description: "Technical and vocational education resources for ND and HND programs",
            institutions: 67,
            popularDepartments: ["Engineering", "Business", "Applied Sciences", "Technology"],
            trending: false,
            gradient: "from-slate-600 to-gray-700",
        },
        {
            id: "bible-college",
            name: "Bible Colleges",
            slug: "bible-college",
            icon: Building2, // or Book
            totalDocuments: 0, // Update with actual count
            subcategories: 8,
            image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=800&q=80",
            description: "Comprehensive theological training and biblical education resources for ministry preparation",
            institutions: 45, // Estimate
            popularDepartments: ["Theology", "Biblical Studies", "Ministry", "Pastoral Care"],
            trending: true,
            gradient: "from-purple-600 to-indigo-700",
            link: "/institutional/category/bible-college",
        }
    ];

    const filteredCategories = institutionalCategories.filter(
        (cat) =>
            cat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            cat.description.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const nextSlide = () => {
        setCurrentSlide((prev) => (prev + 1) % featuredContent.length);
    };

    const prevSlide = () => {
        setCurrentSlide((prev) => (prev - 1 + featuredContent.length) % featuredContent.length);
    };

    // Auto-advance carousel
    useEffect(() => {
        const timer = setInterval(() => {
            nextSlide();
        }, 5000);
        return () => clearInterval(timer);
    }, [currentSlide]);

    return (
        <>
            <Navbar />
            <div className="min-h-screen bg-white">
                {/* Hero Carousel */}
                <div className="relative w-full h-[400px] md:h-[600px] overflow-hidden bg-gray-900">
                    {featuredContent.map((content, index) => (
                        <a
                            key={index}
                            href={content.link}
                            className={`absolute inset-0 transition-opacity duration-700 cursor-pointer group ${index === currentSlide ? "opacity-100" : "opacity-0 pointer-events-none"
                                }`}
                        >
                            {/* Background Image with Overlay */}
                            <div className="absolute inset-0">
                                <img
                                    src={content.image}
                                    alt={content.title}
                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-black/30 group-hover:from-black/85 group-hover:via-black/55 transition-all duration-300"></div>
                            </div>

                            {/* Content */}
                            <div className="relative h-full flex items-center justify-center">
                                <div className="max-w-4xl mx-auto px-4 text-center text-white">
                                    <h1 className="text-2xl md:text-5xl font-bold mb-4 md:mb-6 leading-tight group-hover:scale-105 transition-transform duration-300">
                                        {content.title}
                                    </h1>
                                    <p className="text-sm md:text-xl text-gray-200 mb-6 md:mb-8">
                                        {content.description}
                                    </p>
                                    <div className="flex items-center justify-center gap-3 text-xs md:text-sm text-gray-300 mb-6">
                                        <span>{content.timeAgo}</span>
                                        <span>•</span>
                                        <span>by {content.author}</span>
                                    </div>
                                    <div className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm px-6 py-3 rounded-full border border-white/30 transition-all duration-300 group-hover:border-white/50">
                                        <span className="font-semibold">Explore Category</span>
                                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                    </div>
                                </div>
                            </div>
                        </a>
                    ))}

                    {/* Navigation Arrows */}
                    <button
                        onClick={prevSlide}
                        className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 md:w-12 md:h-12 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full flex items-center justify-center transition-all"
                        aria-label="Previous slide"
                    >
                        <ChevronLeft className="w-6 h-6 md:w-8 md:h-8 text-white" />
                    </button>
                    <button
                        onClick={nextSlide}
                        className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 md:w-12 md:h-12 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full flex items-center justify-center transition-all"
                        aria-label="Next slide"
                    >
                        <ChevronRight className="w-6 h-6 md:w-8 md:h-8 text-white" />
                    </button>

                    {/* Dots Indicator */}
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
                        {featuredContent.map((_, index) => (
                            <button
                                key={index}
                                onClick={() => setCurrentSlide(index)}
                                className={`w-2 h-2 rounded-full transition-all ${index === currentSlide
                                    ? "bg-white w-8"
                                    : "bg-white/50 hover:bg-white/75"
                                    }`}
                                aria-label={`Go to slide ${index + 1}`}
                            />
                        ))}
                    </div>
                </div>

                <div className="max-w-7xl mx-auto px-4 py-12 md:py-20">
                    {/* Section Header */}
                    <div className="mb-12 md:mb-16 text-center">
                        <h2 className="text-3xl md:text-5xl font-bold text-blue-950 mb-4 md:mb-6">
                            Choose Your Academic Path
                        </h2>
                        <p className="text-base md:text-xl text-gray-600 max-w-3xl mx-auto px-4">
                            Explore our comprehensive collection of institutional resources tailored to your educational level
                        </p>
                    </div>

                    {/* Categories Grid - 2 columns on mobile, 2 on tablet, 3 on desktop */}
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-8 mb-12 md:mb-20">
                        {filteredCategories.map((category) => {
                            const IconComponent = category.icon;

                            return (
                                <a
                                    key={category.id}
                                    href={`/institutional/category/${category.slug}`}
                                    className="group relative bg-white border border-gray-200 overflow-hidden hover:border-blue-950 transition-all duration-300 hover:shadow-2xl hover:shadow-blue-950/10"
                                >
                                    {/* Trending Badge */}
                                    {category.trending && (
                                        <div className="absolute top-2 right-2 md:top-6 md:right-6 z-10 bg-blue-950 text-white px-2 py-1 md:px-3 md:py-1.5 rounded-full text-[10px] md:text-xs font-bold flex items-center gap-1 shadow-lg">
                                            <TrendingUp className="w-2.5 h-2.5 md:w-3.5 md:h-3.5" />
                                            <span className="hidden md:inline">Trending</span>
                                        </div>
                                    )}

                                    {/* Image Section with Gradient Overlay */}
                                    <div className="relative h-32 md:h-64 overflow-hidden">
                                        <img
                                            src={category.image}
                                            alt={category.name}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                                        />

                                        {/* Icon Overlay */}
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <div className="bg-white/95 p-2 md:p-5 rounded-lg md:rounded-2xl shadow-2xl group-hover:scale-110 group-hover:rotate-3 transition-all duration-500">
                                                <IconComponent
                                                    className="w-6 h-6 md:w-12 md:h-12 text-blue-950"
                                                    strokeWidth={2}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Content Section */}
                                    <div className="p-3 md:p-6">
                                        <h3 className="text-sm md:text-2xl font-bold text-blue-950 mb-1.5 md:mb-3 group-hover:text-blue-700 transition-colors line-clamp-1">
                                            {category.name}
                                        </h3>

                                        <p className="text-[11px] md:text-base text-gray-600 mb-3 md:mb-6 leading-snug md:leading-relaxed line-clamp-2">
                                            {category.description}
                                        </p>

                                        {/* Popular Areas - Hide on very small mobile */}
                                        <div className="hidden md:block mb-6">
                                            <div className="text-xs text-gray-500 mb-3 font-semibold uppercase tracking-wide">
                                                Popular Areas
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                {category.popularDepartments.slice(0, 3).map((dept, idx) => (
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
                                        <div className="flex items-center justify-between pt-3 md:pt-6 border-t border-gray-100">
                                            <span className="text-blue-950 font-semibold text-[11px] md:text-sm">
                                                Explore
                                            </span>
                                            <div className="w-7 h-7 md:w-10 md:h-10 rounded-full bg-blue-950 flex items-center justify-center group-hover:bg-blue-900 transition-colors">
                                                <ArrowRight className="w-3.5 h-3.5 md:w-5 md:h-5 text-white group-hover:translate-x-1 transition-transform duration-300" />
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
                            <h3 className="text-2xl font-bold text-gray-900 mb-3">No Results Found</h3>
                            <p className="text-gray-600">Try adjusting your search terms</p>
                        </div>
                    )}

                    {/* CTA Section */}
                    <div className="bg-blue-950 rounded-2xl brightness-70 md:rounded-3xl p-8 md:p-16 text-center text-white relative overflow-hidden">
                        <div className="absolute inset-0 opacity-5">
                            <div className="absolute inset-0" style={{
                                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                            }}></div>
                        </div>
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl"></div>
                        <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/5 rounded-full blur-3xl"></div>

                        <div className="relative z-10">
                            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-3 md:px-4 py-1.5 md:py-2 rounded-full mb-4 md:mb-6 border border-white/20">
                                <Star className="w-3.5 h-3.5 md:w-4 md:h-4 text-yellow-300 fill-yellow-300" />
                                <span className="text-xs md:text-sm font-medium">Join 2.4M+ Learners</span>
                            </div>

                            <h2 className="text-2xl md:text-5xl font-bold mb-4 md:mb-6">
                                Ready to Excel in Your Studies?
                            </h2>
                            <p className="text-sm md:text-xl text-blue-100 mb-6 md:mb-10 max-w-3xl mx-auto leading-relaxed">
                                Access premium academic resources and join a community dedicated to educational excellence
                            </p>

                            <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center">
                                <a
                                    href="/documents"
                                    className="inline-flex items-center justify-center gap-2 bg-white text-blue-950 px-6 md:px-8 py-3 md:py-4 rounded-xl font-bold hover:bg-blue-50 transition-all hover:shadow-2xl hover:shadow-white/20 text-sm md:text-base"
                                >
                                    <Search className="w-4 h-4 md:w-5 md:h-5" />
                                    Browse All Documents
                                </a>
                                <a
                                    href="/become-seller"
                                    className="inline-flex items-center justify-center gap-2 bg-blue-900 text-white px-6 md:px-8 py-3 md:py-4 rounded-xl font-bold border-2 border-white/20 hover:bg-blue-800 transition-all text-sm md:text-base"
                                >
                                    <Upload className="w-4 h-4 md:w-5 md:h-5" />
                                    Contribute Resources
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <Footer />
        </>
    );
}