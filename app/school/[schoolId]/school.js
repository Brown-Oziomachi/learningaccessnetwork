"use client";
import { useState, useEffect } from 'react';
import { Building2, MapPin, Mail, Phone, Globe, CheckCircle, Download, Eye, Calendar, BookOpen, Users, FileText, Search, Filter, ExternalLink, Award, TrendingUp, Star, Loader2 } from 'lucide-react';
import { db } from "@/lib/firebaseConfig";
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { useParams } from 'next/navigation';
import Navbar from '@/components/NavBar';

export default function SchoolProfileClient() {
    const params = useParams();
    const schoolId = params?.schoolId;

    const [loading, setLoading] = useState(true);
    const [schoolData, setSchoolData] = useState(null);
    const [documents, setDocuments] = useState([]);
    const [activeTab, setActiveTab] = useState('documents');
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState('all');
    const [filterDepartment, setFilterDepartment] = useState('all');

    // Fetch school data from Firestore
    useEffect(() => {
        const fetchSchoolData = async () => {
            if (!schoolId) return;

            setLoading(true);
            try {
                // Fetch school details from schoolApplications (only approved ones)
                const schoolRef = doc(db, 'schoolApplications', schoolId);
                const schoolSnap = await getDoc(schoolRef);

                if (schoolSnap.exists()) {
                    const schoolData = { id: schoolSnap.id, ...schoolSnap.data() };

                    // Only show approved schools
                    if (schoolData.status === 'approved' && schoolData.verifiedSchool) {
                        setSchoolData(schoolData);

                        // Fetch school documents
                        const docsQuery = query(
                            collection(db, 'schoolDocuments'),
                            where('schoolId', '==', schoolId),
                            where('status', '==', 'approved')
                        );
                        const docsSnap = await getDocs(docsQuery);
                        const docsList = docsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                        setDocuments(docsList);
                    } else {
                        // School not approved yet
                        setSchoolData(null);
                    }
                }
            } catch (error) {
                console.error('Error fetching school data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchSchoolData();
    }, [schoolId]);

    // Mock data for demonstration - Remove when Firebase is fully integrated
    const mockSchoolData = {
        id: 'unilag-123',
        schoolName: 'University of Lagos',
        schoolType: 'University',
        state: 'Lagos',
        address: 'Akoka, Yaba, Lagos State, Nigeria',
        email: 'info@unilag.edu.ng',
        phone: '+234 1 493 4270',
        website: 'https://unilag.edu.ng',
        verified: true,
        joinedDate: '2024-01-15',
        totalDocuments: 156,
        totalDownloads: 12450,
        totalViews: 45230,
        totalStudents: 40000,
        departments: ['Engineering', 'Medicine', 'Law', 'Sciences', 'Arts', 'Social Sciences', 'Education', 'Management Sciences'],
        description: 'The University of Lagos, popularly known as UNILAG, is a premier institution of learning committed to academic excellence and innovation in teaching, research and service to humanity. Established in 1962, we have consistently produced world-class graduates who excel in various fields.',
        motto: 'In Deed and Truth',
        established: '1962'
    };

    const mockDocuments = [
        {
            id: 'doc1', title: 'Computer Science Course Outline 2024', type: 'Course Outline',
            department: 'Engineering', level: '200 Level', year: '2024', uploadDate: '2024-12-15',
            downloads: 245, views: 890, fileSize: '2.3 MB', verified: true
        },
        {
            id: 'doc2', title: 'Past Questions - CSC 201 (Data Structures)', type: 'Past Questions',
            department: 'Engineering', level: '200 Level', year: '2023', uploadDate: '2024-11-20',
            downloads: 567, views: 1240, fileSize: '1.8 MB', verified: true
        }
    ];

    const displaySchool = schoolData || mockSchoolData;
    const displayDocs = documents.length > 0 ? documents : mockDocuments;

    // Calculate stats from schoolApplications data
    const schoolStats = {
        totalDocuments: schoolData?.totalDocuments || displayDocs.length || 156,
        totalDownloads: schoolData?.totalDownloads || 12450,
        totalViews: schoolData?.totalViews || 45230,
        totalStudents: schoolData?.totalStudents || 40000
    };

    const filteredDocuments = displayDocs.filter(doc => {
        const matchesSearch = doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            doc.department.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesType = filterType === 'all' || doc.type === filterType;
        const matchesDept = filterDepartment === 'all' || doc.department === filterDepartment;
        return matchesSearch && matchesType && matchesDept;
    });

    const documentTypes = ['all', 'Course Outline', 'Past Questions', 'Lecture Notes', 'Academic Calendar', 'Student Handbook'];

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
                    <p className="text-gray-600">Loading school profile...</p>
                </div>
            </div>
        );
    }

    if (!displaySchool) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">School Not Found</h2>
                    <p className="text-gray-600">The school you're looking for doesn't exist.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />

            {/* Hero Section with Gradient */}
            <div className="relative bg-gradient-to-br from-blue-600 via-indigo-700 to-purple-800 text-white overflow-hidden">
                <div className="absolute inset-0 bg-black/10"></div>
                <div className="absolute inset-0" style={{
                    backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.05\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")'
                }}></div>

                <div className="relative max-w-7xl mx-auto px-4 py-16">
                    <div className="flex flex-col lg:flex-row items-center gap-8">
                        {/* School Logo/Icon */}
                        <div className="w-40 h-40 bg-white rounded-3xl shadow-2xl p-6 flex items-center justify-center transform hover:scale-105 transition-transform">
                            <Building2 className="w-28 h-28 text-blue-600" />
                        </div>

                        {/* School Info */}
                        <div className="flex-1 text-center lg:text-left">
                            <div className="flex flex-wrap items-center gap-3 justify-center lg:justify-start mb-3">
                                <h1 className="text-5xl font-bold">{displaySchool.schoolName}</h1>
                                {displaySchool.verified && (
                                    <div className="flex items-center gap-2 bg-green-500 px-4 py-2 rounded-full shadow-lg">
                                        <CheckCircle className="w-5 h-5" />
                                        <span className="font-semibold">Verified School</span>
                                    </div>
                                )}
                            </div>

                            <div className="flex flex-wrap items-center gap-4 justify-center lg:justify-start mb-4">
                                <span className="text-blue-100 text-xl font-semibold">{displaySchool.schoolType}</span>
                                <span className="text-blue-200">•</span>
                                <span className="text-blue-100 flex items-center gap-2">
                                    <Award className="w-5 h-5" />
                                    Est. {displaySchool.established || '1962'}
                                </span>
                                {displaySchool.motto && (
                                    <>
                                        <span className="text-blue-200">•</span>
                                        <span className="text-blue-100 italic">"{displaySchool.motto}"</span>
                                    </>
                                )}
                            </div>

                            <p className="text-blue-50 text-lg max-w-3xl mb-6">{displaySchool.description}</p>

                            {/* Quick Stats */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl">
                                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                                    <FileText className="w-6 h-6 mb-2 mx-auto lg:mx-0" />
                                    <p className="text-3xl font-bold">{schoolStats.totalDocuments}</p>
                                    <p className="text-blue-100 text-sm">Documents</p>
                                </div>
                                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                                    <Download className="w-6 h-6 mb-2 mx-auto lg:mx-0" />
                                    <p className="text-3xl font-bold">{(schoolStats.totalDownloads / 1000).toFixed(1)}K</p>
                                    <p className="text-blue-100 text-sm">Downloads</p>
                                </div>
                                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                                    <Eye className="w-6 h-6 mb-2 mx-auto lg:mx-0" />
                                    <p className="text-3xl font-bold">{(schoolStats.totalViews / 1000).toFixed(1)}K</p>
                                    <p className="text-blue-100 text-sm">Views</p>
                                </div>
                                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                                    <Users className="w-6 h-6 mb-2 mx-auto lg:mx-0" />
                                    <p className="text-3xl font-bold">{(schoolStats.totalStudents / 1000).toFixed(0)}K+</p>
                                    <p className="text-blue-100 text-sm">Students</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Contact Bar */}
            <div className="bg-white border-b-2 border-gray-200 shadow-sm sticky top-0 z-40">
                <div className="max-w-7xl mx-auto px-4 py-4">
                    <div className="flex flex-wrap gap-6 text-sm">
                        <a href={`mailto:${displaySchool.email}`} className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors">
                            <Mail className="w-4 h-4" />
                            <span className="font-medium">{displaySchool.email}</span>
                        </a>
                        <a href={`tel:${displaySchool.phone}`} className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors">
                            <Phone className="w-4 h-4" />
                            <span className="font-medium">{displaySchool.phone}</span>
                        </a>
                        <div className="flex items-center gap-2 text-gray-600">
                            <MapPin className="w-4 h-4" />
                            <span className="font-medium">{displaySchool.state}, Nigeria</span>
                        </div>
                        {displaySchool.website && (
                            <a href={displaySchool.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-blue-600 hover:text-blue-700 transition-colors font-medium">
                                <Globe className="w-4 h-4" />
                                Visit Website
                                <ExternalLink className="w-3 h-3" />
                            </a>
                        )}
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    {/* Sidebar */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 sticky top-24">
                            <h3 className="font-bold text-gray-900 text-lg mb-4 flex items-center gap-2">
                                <Building2 className="w-5 h-5 text-blue-600" />
                                School Info
                            </h3>

                            <div className="space-y-4 text-sm">
                                <div className="pb-4 border-b border-gray-200">
                                    <p className="text-gray-500 mb-1">Institution Type</p>
                                    <p className="font-semibold text-gray-900">{displaySchool.schoolType}</p>
                                </div>
                                <div className="pb-4 border-b border-gray-200">
                                    <p className="text-gray-500 mb-1">Location</p>
                                    <p className="font-semibold text-gray-900">{displaySchool.state} State</p>
                                </div>
                                <div className="pb-4 border-b border-gray-200">
                                    <p className="text-gray-500 mb-1">Joined LAN Library</p>
                                    <p className="font-semibold text-gray-900">{new Date(displaySchool.joinedDate).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
                                </div>
                                <div>
                                    <p className="text-gray-500 mb-1">Full Address</p>
                                    <p className="font-medium text-gray-700 text-xs leading-relaxed">{displaySchool.address}</p>
                                </div>
                            </div>

                            <div className="mt-6 pt-6 border-t border-gray-200">
                                <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                                    <BookOpen className="w-5 h-5 text-blue-600" />
                                    Departments
                                </h4>
                                <div className="flex flex-wrap gap-2">
                                    {displaySchool.departments.map(dept => (
                                        <span key={dept} className="bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 px-3 py-1.5 rounded-full text-xs font-semibold border border-blue-200">
                                            {dept}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            <div className="mt-6 pt-6 border-t border-gray-200">
                                <button className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg flex items-center justify-center gap-2">
                                    <Star className="w-5 h-5" />
                                    Follow School
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Main Content Area */}
                    <div className="lg:col-span-3">
                        {/* Tabs */}
                        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 mb-6">
                            <div className="border-b-2 border-gray-200">
                                <div className="flex">
                                    <button
                                        onClick={() => setActiveTab('documents')}
                                        className={`flex-1 px-6 py-4 font-semibold text-sm md:text-base transition-all ${activeTab === 'documents'
                                            ? 'text-blue-600 border-b-4 border-blue-600 bg-blue-50/50'
                                            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                                            }`}
                                    >
                                        <FileText className="w-5 h-5 inline mr-2" />
                                        Documents ({schoolStats.totalDocuments})
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('about')}
                                        className={`flex-1 px-6 py-4 font-semibold text-sm md:text-base transition-all ${activeTab === 'about'
                                            ? 'text-blue-600 border-b-4 border-blue-600 bg-blue-50/50'
                                            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                                            }`}
                                    >
                                        <Building2 className="w-5 h-5 inline mr-2" />
                                        About
                                    </button>
                                </div>
                            </div>

                            {/* Documents Tab */}
                            {activeTab === 'documents' && (
                                <div className="p-6">
                                    {/* Search and Filters */}
                                    <div className="mb-6 space-y-4">
                                        <div className="relative">
                                            <Search className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 transform -translate-y-1/2" />
                                            <input
                                                type="text"
                                                placeholder="Search documents by title or department..."
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                                className="w-full pl-12 pr-4 py-4 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                                            />
                                        </div>

                                        <div className="flex flex-col md:flex-row gap-3">
                                            <select
                                                value={filterType}
                                                onChange={(e) => setFilterType(e.target.value)}
                                                className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-medium text-gray-900"
                                            >
                                                {documentTypes.map(type => (
                                                    <option key={type} value={type}>
                                                        {type === 'all' ? 'All Document Types' : type}
                                                    </option>
                                                ))}
                                            </select>

                                            <select
                                                value={filterDepartment}
                                                onChange={(e) => setFilterDepartment(e.target.value)}
                                                className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-medium text-gray-900"
                                            >
                                                <option value="all">All Departments</option>
                                                {displaySchool.departments.map(dept => (
                                                    <option key={dept} value={dept}>{dept}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    {/* Documents List */}
                                    <div className="space-y-4">
                                        {filteredDocuments.length > 0 ? (
                                            filteredDocuments.map(doc => (
                                                <div key={doc.id} className="border-2 border-gray-200 rounded-xl p-6 hover:border-blue-500 hover:shadow-xl transition-all bg-gradient-to-r from-white to-blue-50/30">
                                                    <div className="flex items-start justify-between gap-4">
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-3 mb-3">
                                                                <h4 className="font-bold text-gray-900 text-lg">{doc.title}</h4>
                                                                {doc.verified && (
                                                                    <div className="flex items-center gap-1 bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-semibold">
                                                                        <CheckCircle className="w-3 h-3" />
                                                                        Verified
                                                                    </div>
                                                                )}
                                                            </div>

                                                            <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-4">
                                                                <span className="flex items-center gap-1 bg-blue-50 px-3 py-1 rounded-full font-medium">
                                                                    <BookOpen className="w-4 h-4" />
                                                                    {doc.type}
                                                                </span>
                                                                <span className="flex items-center gap-1 bg-purple-50 px-3 py-1 rounded-full font-medium">
                                                                    <Building2 className="w-4 h-4" />
                                                                    {doc.department}
                                                                </span>
                                                                <span className="flex items-center gap-1 bg-orange-50 px-3 py-1 rounded-full font-medium">
                                                                    <Users className="w-4 h-4" />
                                                                    {doc.level}
                                                                </span>
                                                                <span className="flex items-center gap-1 bg-green-50 px-3 py-1 rounded-full font-medium">
                                                                    <Calendar className="w-4 h-4" />
                                                                    {doc.year}
                                                                </span>
                                                            </div>

                                                            <div className="flex items-center gap-6 text-xs text-gray-500">
                                                                <span className="font-semibold">{doc.fileSize}</span>
                                                                <span className="flex items-center gap-1">
                                                                    <Download className="w-3 h-3" />
                                                                    {doc.downloads} downloads
                                                                </span>
                                                                <span className="flex items-center gap-1">
                                                                    <Eye className="w-3 h-3" />
                                                                    {doc.views} views
                                                                </span>
                                                                <span>• {new Date(doc.uploadDate).toLocaleDateString()}</span>
                                                            </div>
                                                        </div>

                                                        <div className="flex flex-col gap-2">
                                                            <button className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all font-semibold flex items-center gap-2 whitespace-nowrap shadow-lg">
                                                                <Download className="w-4 h-4" />
                                                                Download
                                                            </button>
                                                            <button className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all font-semibold flex items-center gap-2 whitespace-nowrap">
                                                                <Eye className="w-4 h-4" />
                                                                Preview
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="text-center py-16">
                                                <FileText className="w-20 h-20 text-gray-300 mx-auto mb-4" />
                                                <h3 className="text-xl font-bold text-gray-900 mb-2">No documents found</h3>
                                                <p className="text-gray-500">Try adjusting your search or filters</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* About Tab */}
                            {activeTab === 'about' && (
                                <div className="p-8">
                                    <div className="prose max-w-none">
                                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-8 mb-8 border border-blue-200">
                                            <h3 className="text-3xl font-bold text-gray-900 mb-4">About {displaySchool.schoolName}</h3>
                                            <p className="text-gray-700 leading-relaxed text-lg">
                                                {displaySchool.description}
                                            </p>
                                        </div>

                                        <div className="grid md:grid-cols-2 gap-6 mb-8">
                                            <div className="bg-white rounded-xl p-6 border-2 border-gray-200">
                                                <h4 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                                                    <TrendingUp className="w-6 h-6 text-blue-600" />
                                                    Our Mission
                                                </h4>
                                                <p className="text-gray-700 leading-relaxed">
                                                    To provide world-class education and foster innovation through cutting-edge research, producing graduates who are well-equipped to contribute meaningfully to national development and global competitiveness.
                                                </p>
                                            </div>

                                            <div className="bg-white rounded-xl p-6 border-2 border-gray-200">
                                                <h4 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                                                    <Award className="w-6 h-6 text-blue-600" />
                                                    Our Vision
                                                </h4>
                                                <p className="text-gray-700 leading-relaxed">
                                                    To be a leading institution of learning in Africa and beyond, recognized for academic excellence, groundbreaking research, and producing leaders who drive positive change in society.
                                                </p>
                                            </div>
                                        </div>

                                        <h4 className="text-2xl font-bold text-gray-900 mb-4">Academic Programs</h4>
                                        <p className="text-gray-700 leading-relaxed mb-6">
                                            We offer comprehensive undergraduate and postgraduate programs across multiple faculties:
                                        </p>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
                                            {displaySchool.departments.map(dept => (
                                                <div key={dept} className="bg-gradient-to-br from-blue-50 to-indigo-100 border-2 border-blue-200 rounded-xl p-4 text-center hover:scale-105 transition-transform">
                                                    <p className="font-bold text-blue-900">{dept}</p>
                                                </div>
                                            ))}
                                        </div>

                                        <h4 className="text-2xl font-bold text-gray-900 mb-4">Contact Information</h4>
                                        <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-2xl p-6 space-y-3 border-2 border-gray-200">
                                            <p className="flex items-center gap-3 text-gray-700">
                                                <MapPin className="w-5 h-5 text-blue-600" />
                                                <span className="font-medium">{displaySchool.address}</span>
                                            </p>
                                            <p className="flex items-center gap-3 text-gray-700">
                                                <Mail className="w-5 h-5 text-blue-600" />
                                                <a href={`mailto:${displaySchool.email}`} className="text-blue-600 hover:underline font-medium">{displaySchool.email}</a>
                                            </p>
                                            <p className="flex items-center gap-3 text-gray-700">
                                                <Phone className="w-5 h-5 text-blue-600" />
                                                <a href={`tel:${displaySchool.phone}`} className="text-blue-600 hover:underline font-medium">{displaySchool.phone}</a>
                                            </p>
                                            {displaySchool.website && (
                                                <p className="flex items-center gap-3 text-gray-700">
                                                    <Globe className="w-5 h-5 text-blue-600" />
                                                    <a href={displaySchool.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline font-medium flex items-center gap-1">
                                                        {displaySchool.website}
                                                        <ExternalLink className="w-4 h-4" />
                                                    </a>
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}