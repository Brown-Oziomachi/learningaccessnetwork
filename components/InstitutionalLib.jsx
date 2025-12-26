"use client"
import React, { useState, useEffect } from 'react';
import { GraduationCap, BookOpen, School, FileQuestion, Building2, Book, Search, Filter, Star, Download, Eye, ChevronRight, Users, Award, TrendingUp, Upload } from 'lucide-react';

export default function InstitutionalLibraryPage() {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedLevel, setSelectedLevel] = useState('all');
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
      },
      {
        id: "christian",
        name: "Christian Institutions",
        slug: "christian-institutions",
        icon: Building2,
        totalDocuments: 4890,
        subcategories: 12,
        image:
          "https://images.unsplash.com/photo-1548877528-b34d3fb135cd?w=800",
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
      },
      {
        id: "polytechnic",
        name: "Polytechnics",
        slug: "polytechnic",
        icon: Building2,
        totalDocuments: 9870,
        subcategories: 20,
        image:
          "https://images.unsplash.com/photo-1562774053-701939374585?w=800",
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
      },
    ];

    // Platform statistics
    const platformStats = [
        { label: 'Total Documents', value: '80,190+', icon: BookOpen },
        { label: 'Institutions', value: '665+', icon: Building2 },
        { label: 'Active Learners', value: '2.4M+', icon: Users },
        { label: 'Success Rate', value: '94%', icon: TrendingUp }
    ];

    // Filter categories based on search
    const filteredCategories = institutionalCategories.filter(cat =>
        cat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cat.description.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 mt-10">
        {/* Hero Section with Animated Background */}
        <div className="relative bg-blue-950 text-white overflow-hidden">
          {/* Animated background patterns */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-300 rounded-full blur-3xl animate-pulse delay-700"></div>
          </div>

          <div className="relative max-w-7xl mx-auto px-4 py-20">
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full mb-6">
                <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                <span className="text-sm font-medium">
                  LAN Lib's #1 Educational Resource Hub
                </span>
              </div>

              <h1 className="text-5xl md:text-7xl font-black mb-6 leading-tight">
                Institutional Library
                <span className="block text-blue-950 bg-white mt-2 mask-b-from-0%">
                  Excellence
                </span>
              </h1>

              <p className="text-xl md:text-2xl text-blue-100 max-w-4xl mx-auto mb-8 leading-relaxed">
                Access comprehensive academic resources from primary school to
                postgraduate studies. Your complete educational journey, all in
                one place.
              </p>
            </div>

            {/* Platform Statistics */}
            {/* {showStats && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-5xl mx-auto">
                {platformStats.map((stat, index) => (
                  <div
                    key={index}
                    className="bg-white/10 backdrop-blur-md rounded-xl p-6 text-center transform hover:scale-105 transition-all duration-300"
                  >
                    <stat.icon className="w-8 h-8 mx-auto mb-3 text-yellow-300" />
                    <div className="text-3xl font-bold mb-1">{stat.value}</div>
                    <div className="text-sm text-blue-200">{stat.label}</div>
                  </div>
                ))}
              </div>
            )} */}
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 py-16">
          {/* Section Header */}
          <div className="mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Choose Your Academic Level
            </h2>
            <p className="text-lg text-gray-600">
              Select from our comprehensive collection of institutional
              resources
            </p>
          </div>

          {/* Categories Grid */}
          <div
            className="
    flex gap-6 mb-16
    overflow-x-auto snap-x snap-mandatory
    md:grid md:grid-cols-2 lg:grid-cols-2
    md:overflow-visible
    scrollbar-hide
  "
          >
            {filteredCategories.map((category) => {
              const IconComponent = category.icon;

              return (
                <a
                  key={category.id}
                  href={`/institutional/category/${category.slug}`}
                  className="
          group relative bg-white shadow-lg
          hover:shadow-2xl transition-all duration-500
          overflow-hidden transform hover:-translate-y-2
          
          /* MOBILE CAROUSEL SIZE */
          min-w-[85%] sm:min-w-[70%]
          snap-center

          /* DESKTOP GRID RESET */
          md:min-w-0
        "
                >
                  {/* Trending Badge */}
                  {category.trending && (
                    <div className="absolute top-4 right-4 z-10 bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-lg">
                      <TrendingUp className="w-3 h-3" />
                      Trending
                    </div>
                  )}

                  {/* Image Section */}
                  <div className="relative h-56 overflow-hidden">
                    <div
                      className={`absolute inset-0 bg-gradient-to-br ${category.color} opacity-90 group-hover:opacity-100 transition-opacity duration-500`}
                    />
                    <img
                      src={category.image}
                      alt={category.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    />

                    {/* Icon Overlay */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="bg-white/20 backdrop-blur-sm p-6 rounded-full group-hover:scale-110 transition-transform duration-500">
                        <IconComponent
                          className="w-16 h-16 text-white"
                          strokeWidth={1.5}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Content Section */}
                  <div className="p-6">
                    <h3 className="text-2xl font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors">
                      {category.name}
                    </h3>

                    <p className="text-gray-600 mb-4 line-clamp-2">
                      {category.description}
                    </p>

                   

                    {/* Popular Areas */}
                    <div className="mb-4">
                      <div className="text-xs text-gray-500 mb-2 font-semibold">
                        Popular Areas:
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {category.popularDepartments
                          .slice(0, 3)
                          .map((dept, idx) => (
                            <span
                              key={idx}
                              className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full"
                            >
                              {dept}
                            </span>
                          ))}
                      </div>
                    </div>

                    {/* CTA */}
                    <div className="flex items-center justify-between pt-4 -mb-5 border-t border-gray-100">
                      <span className="text-blue-600 font-semibold">
                        Explore Collection
                      </span>
                      <ChevronRight className="w-5 h-5 text-blue-600 group-hover:translate-x-2 transition-transform duration-300" />
                    </div>
                  </div>
                </a>
              );
            })}
          </div>

          {/* No Results Message */}
          {filteredCategories.length === 0 && (
            <div className="text-center py-16">
              <BookOpen className="w-20 h-20 text-gray-300 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                No Results Found
              </h3>
              <p className="text-gray-600">Try adjusting your search terms</p>
            </div>
          )}

          <div className="bg-gradient-to-r from-blue-900 to-indigo-900 rounded-3xl p-12 text-center text-white">
            <h2 className="text-4xl font-bold mb-4">Ready to Excel?</h2>
            <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
              Join millions of students who have transformed their academic
              journey with our comprehensive resources
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="/documents"
                className="bg-white text-blue-900 px-8 py-4 rounded-xl font-bold hover:bg-blue-50 transition-colors inline-flex items-center justify-center gap-2"
              >
                <Search className="w-5 h-5" />
                Browse All Documents
              </a>
              <a
                href="/become-seller"
                className="bg-yellow-400 text-gray-900 px-8 py-4 rounded-xl font-bold hover:bg-yellow-300 transition-colors inline-flex items-center justify-center gap-2"
              >
                <Upload className="w-5 h-5" />
                Contribute Resources
              </a>
            </div>
          </div>
        </div>
      </div>
    );
}