
"use client";
import { useState, useEffect } from 'react';
import { Upload, FileText, Eye, Download, Trash2, CheckCircle, Clock, XCircle, Plus, Settings, BarChart3, Building2, Loader2, X, AlertCircle, Mail, Phone, User, Globe, MapPin, Target, Calendar, BookOpen, Users as UsersIcon } from 'lucide-react';
import { db, auth } from "@/lib/firebaseConfig";
import { collection, query, where, getDocs, addDoc, deleteDoc, doc } from 'firebase/firestore';
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";

export default function EnhancedSchoolDashboard() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);
    const [schoolData, setSchoolData] = useState(null);
    const [documents, setDocuments] = useState([]);
    const [activeTab, setActiveTab] = useState('overview');
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [uploadLoading, setUploadLoading] = useState(false);

    const [uploadForm, setUploadForm] = useState({
        title: '',
        type: '',
        department: '',
        level: '',
        year: new Date().getFullYear().toString(),
        file: null
    });
    const [uploadErrors, setUploadErrors] = useState({});

    const documentTypes = ['Course Outline', 'Past Questions', 'Lecture Notes', 'Academic Calendar', 'Student Handbook', 'Scheme of Work'];
    const levels = ['100 Level', '200 Level', '300 Level', '400 Level', '500 Level', 'All Levels'];

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (currentUser) {
                setUser(currentUser);
                await fetchSchoolData(currentUser.uid);
            } else {
                router.push('/auth/signin');
            }
        });
        return () => unsubscribe();
    }, [router]);

    const fetchSchoolData = async (userId) => {
        setLoading(true);
        try {
            const schoolQuery = query(
                collection(db, 'schoolApplications'),
                where('userId', '==', userId)
            );

            const schoolSnap = await getDocs(schoolQuery);

            if (!schoolSnap.empty) {
                const school = { id: schoolSnap.docs[0].id, ...schoolSnap.docs[0].data() };
                setSchoolData(school);

                if (school.status === 'approved' && school.verifiedSchool) {
                    await fetchDocuments(school.schoolId);
                }
            } else {
                router.push('/register-school');
            }
        } catch (error) {
            console.error('Error fetching school data:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchDocuments = async (schoolId) => {
        try {
            const docsQuery = query(
                collection(db, 'schoolDocuments'),
                where('schoolId', '==', schoolId)
            );
            const docsSnap = await getDocs(docsQuery);
            setDocuments(docsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        } catch (error) {
            console.error('Error fetching documents:', error);
        }
    };

    const handleUploadChange = (e) => {
        const { name, value } = e.target;
        setUploadForm(prev => ({ ...prev, [name]: value }));
        if (uploadErrors[name]) {
            setUploadErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 10 * 1024 * 1024) {
                setUploadErrors(prev => ({ ...prev, file: 'File size must be less than 10MB' }));
                return;
            }
            if (file.type !== 'application/pdf') {
                setUploadErrors(prev => ({ ...prev, file: 'Only PDF files are allowed' }));
                return;
            }
            setUploadForm(prev => ({ ...prev, file }));
            if (uploadErrors.file) {
                setUploadErrors(prev => ({ ...prev, file: '' }));
            }
        }
    };

    const validateUpload = () => {
        const errors = {};
        if (!uploadForm.title.trim()) errors.title = 'Title is required';
        if (!uploadForm.type) errors.type = 'Document type is required';
        if (!uploadForm.department.trim()) errors.department = 'Department is required';
        if (!uploadForm.level) errors.level = 'Level is required';
        if (!uploadForm.file) errors.file = 'Document file is required';
        setUploadErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleUploadSubmit = async (e) => {
        e.preventDefault();
        if (!validateUpload()) return;

        setUploadLoading(true);
        try {
            const fileUrl = `https://storage.lanlibrary.com/docs/${Date.now()}.pdf`;
            const documentData = {
                documentId: `doc-${Date.now()}`,
                schoolId: schoolData.schoolId,
                schoolName: schoolData.schoolName,
                title: uploadForm.title,
                type: uploadForm.type,
                department: uploadForm.department,
                level: uploadForm.level,
                year: uploadForm.year,
                fileUrl: fileUrl,
                fileSize: `${(uploadForm.file.size / (1024 * 1024)).toFixed(2)} MB`,
                status: 'pending',
                verified: false,
                downloads: 0,
                views: 0,
                uploadDate: new Date().toISOString(),
                uploadedBy: user.uid
            };

            await addDoc(collection(db, 'schoolDocuments'), documentData);
            await fetchDocuments(schoolData.schoolId);

            setUploadForm({
                title: '',
                type: '',
                department: '',
                level: '',
                year: new Date().getFullYear().toString(),
                file: null
            });
            setShowUploadModal(false);
            alert('Document uploaded successfully!');
        } catch (error) {
            console.error('Upload error:', error);
            alert('Failed to upload document.');
        } finally {
            setUploadLoading(false);
        }
    };

    const handleDoc = async (docId) => {
       router.push('/dashboard/school/upload');
    };

    const stats = {
        total: documents.length,
        approved: documents.filter(d => d.status === 'approved').length,
        pending: documents.filter(d => d.status === 'pending').length,
        rejected: documents.filter(d => d.status === 'rejected').length,
        totalDownloads: documents.reduce((sum, d) => sum + (d.downloads || 0), 0),
        totalViews: documents.reduce((sum, d) => sum + (d.views || 0), 0)
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
                    <p className="text-gray-600">Loading dashboard...</p>
                </div>
            </div>
        );
    }

    if (!schoolData) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center bg-white p-8 rounded-2xl shadow-lg max-w-md">
                    <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">No School Found</h2>
                    <p className="text-gray-600 mb-6">You haven't registered a school yet.</p>
                    <button
                        onClick={() => router.push('/register-school')}
                        className="bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 font-semibold"
                    >
                        Register Your School
                    </button>
                </div>
            </div>
        );
    }

    if (schoolData.status === 'pending') {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md text-center border-4 border-yellow-400">
                    <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Clock className="w-12 h-12 text-yellow-600 animate-pulse" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-3">Application Under Review</h2>
                    <p className="text-gray-600 mb-4">
                        Your application for <span className="font-semibold text-blue-600">{schoolData.schoolName}</span> is being reviewed.
                    </p>
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                        <p className="text-sm text-yellow-900">
                            <strong>Application ID:</strong> {schoolData.applicationId}
                        </p>
                    </div>
                    <button
                        onClick={() => router.push('/')}
                        className="w-full bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 font-semibold"
                    >
                        Return to Home
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 py-8">
                {/* Header with School Info */}
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-8 mb-8 text-white shadow-xl">
                    <div className="flex items-center justify-between flex-wrap gap-4">
                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                                <Building2 className="w-10 h-10" />
                                <h1 className="text-3xl font-bold">{schoolData.schoolName || 'School Name'}</h1>
                                {schoolData.verifiedSchool && (
                                    <CheckCircle className="w-6 h-6 text-green-400" title="Verified School" />
                                )}
                            </div>
                            <p className="text-blue-100 mb-3">
                                {schoolData.schoolType || 'School Type'} • Est. {schoolData.established || 'N/A'}
                            </p>
                            {schoolData.motto && (
                                <p className="text-blue-200 italic text-sm">"{schoolData.motto}"</p>
                            )}
                        </div>
                        <button
                            onClick={handleDoc}
                            className="bg-white text-blue-600 px-6 py-3 rounded-xl hover:bg-blue-50 font-semibold shadow-lg"
                        >
                            <Plus className="w-5 h-5 inline mr-2" />
                            Upload Document
                        </button>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white rounded-xl p-6 shadow-md">
                        <div className="flex items-center justify-between mb-4">
                            <FileText className="w-10 h-10 text-blue-600 bg-blue-50 p-2 rounded-lg" />
                            <span className="text-3xl font-bold">{stats.total}</span>
                        </div>
                        <p className="text-gray-600 font-medium">Total Documents</p>
                    </div>
                    <div className="bg-white rounded-xl p-6 shadow-md">
                        <div className="flex items-center justify-between mb-4">
                            <CheckCircle className="w-10 h-10 text-green-600 bg-green-50 p-2 rounded-lg" />
                            <span className="text-3xl font-bold">{stats.approved}</span>
                        </div>
                        <p className="text-gray-600 font-medium">Approved</p>
                    </div>
                    <div className="bg-white rounded-xl p-6 shadow-md">
                        <div className="flex items-center justify-between mb-4">
                            <Download className="w-10 h-10 text-purple-600 bg-purple-50 p-2 rounded-lg" />
                            <span className="text-3xl font-bold">{stats.totalDownloads}</span>
                        </div>
                        <p className="text-gray-600 font-medium">Downloads</p>
                    </div>
                    <div className="bg-white rounded-xl p-6 shadow-md">
                        <div className="flex items-center justify-between mb-4">
                            <Eye className="w-10 h-10 text-orange-600 bg-orange-50 p-2 rounded-lg" />
                            <span className="text-3xl font-bold">{stats.totalViews}</span>
                        </div>
                        <p className="text-gray-600 font-medium">Views</p>
                    </div>
                </div>

                {/* Main Content */}
                <div className="bg-white rounded-2xl shadow-lg">
                    {/* Tabs */}
                    <div className="border-b-2 border-gray-200">
                        <div className="flex overflow-x-auto">
                            {['overview', 'profile', 'documents'].map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`px-6 py-4 font-semibold whitespace-nowrap ${activeTab === tab
                                            ? 'text-blue-600 border-b-4 border-blue-600 bg-blue-50/50'
                                            : 'text-gray-500 hover:text-gray-700'
                                        }`}
                                >
                                    {tab === 'overview' && <BarChart3 className="w-5 h-5 inline mr-2" />}
                                    {tab === 'profile' && <Building2 className="w-5 h-5 inline mr-2" />}
                                    {tab === 'documents' && <FileText className="w-5 h-5 inline mr-2" />}
                                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Overview Tab */}
                    {activeTab === 'overview' && (
                        <div className="p-8 space-y-6">
                            <h2 className="text-2xl font-bold mb-6">Dashboard Overview</h2>

                            {/* About Section */}
                            {schoolData.description && (
                                <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
                                    <h3 className="font-bold text-blue-900 mb-3">About {schoolData.schoolName}</h3>
                                    <p className="text-gray-700">{schoolData.description}</p>
                                </div>
                            )}

                            {/* Mission & Vision */}
                            <div className="grid md:grid-cols-2 gap-6">
                                {schoolData.mission && (
                                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border-2 border-green-200">
                                        <div className="flex items-center gap-2 mb-3">
                                            <Target className="w-6 h-6 text-green-600" />
                                            <h3 className="font-bold text-gray-900">Our Mission</h3>
                                        </div>
                                        <p className="text-gray-700 text-sm">{schoolData.mission}</p>
                                    </div>
                                )}

                                {schoolData.vision && (
                                    <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 border-2 border-purple-200">
                                        <div className="flex items-center gap-2 mb-3">
                                            <Eye className="w-6 h-6 text-purple-600" />
                                            <h3 className="font-bold text-gray-900">Our Vision</h3>
                                        </div>
                                        <p className="text-gray-700 text-sm">{schoolData.vision}</p>
                                    </div>
                                )}
                            </div>

                            {/* Stats Cards */}
                            <div className="grid md:grid-cols-3 gap-6">
                                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border-2 border-green-200">
                                    <CheckCircle className="w-8 h-8 text-green-600 mb-3" />
                                    <p className="text-4xl font-bold text-green-600">{stats.approved}</p>
                                    <p className="text-sm text-gray-600 mt-2">Approved Documents</p>
                                </div>
                                <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl p-6 border-2 border-yellow-200">
                                    <Clock className="w-8 h-8 text-yellow-600 mb-3" />
                                    <p className="text-4xl font-bold text-yellow-600">{stats.pending}</p>
                                    <p className="text-sm text-gray-600 mt-2">Pending Review</p>
                                </div>
                                <div className="bg-gradient-to-br from-red-50 to-pink-50 rounded-xl p-6 border-2 border-red-200">
                                    <XCircle className="w-8 h-8 text-red-600 mb-3" />
                                    <p className="text-4xl font-bold text-red-600">{stats.rejected}</p>
                                    <p className="text-sm text-gray-600 mt-2">Rejected</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Profile Tab */}
                    {activeTab === 'profile' && (
                        <div className="p-8 space-y-6">
                            <h2 className="text-2xl font-bold mb-6">School Profile</h2>

                            {/* Contact Information */}
                            <div className="bg-white border border-gray-200 rounded-xl p-6">
                                <h3 className="font-bold text-gray-900 mb-4">Contact Information</h3>
                                <div className="grid md:grid-cols-2 gap-4">
                                    {schoolData.email && (
                                        <div className="flex items-center gap-3">
                                            <Mail className="w-5 h-5 text-gray-500" />
                                            <div>
                                                <p className="text-xs text-gray-500">Email</p>
                                                <p className="text-blue-600">{schoolData.email}</p>
                                            </div>
                                        </div>
                                    )}
                                    {schoolData.phone && (
                                        <div className="flex items-center gap-3">
                                            <Phone className="w-5 h-5 text-gray-500" />
                                            <div>
                                                <p className="text-xs text-gray-500">Phone</p>
                                                <p className="text-gray-900">{schoolData.phone}</p>
                                            </div>
                                        </div>
                                    )}
                                    {schoolData.website && (
                                        <div className="flex items-center gap-3">
                                            <Globe className="w-5 h-5 text-gray-500" />
                                            <div>
                                                <p className="text-xs text-gray-500">Website</p>
                                                <a href={schoolData.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                                    {schoolData.website}
                                                </a>
                                            </div>
                                        </div>
                                    )}
                                    {schoolData.principalName && (
                                        <div className="flex items-center gap-3">
                                            <User className="w-5 h-5 text-gray-500" />
                                            <div>
                                                <p className="text-xs text-gray-500">Principal/Registrar</p>
                                                <p className="text-gray-900">{schoolData.principalName}</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Location */}
                            {schoolData.address && (
                                <div className="bg-white border border-gray-200 rounded-xl p-6">
                                    <h3 className="font-bold text-gray-900 mb-4">Location</h3>
                                    <div className="flex items-start gap-3">
                                        <MapPin className="w-5 h-5 text-gray-500 mt-1" />
                                        <div>
                                            <p className="text-gray-900">{schoolData.address}</p>
                                            <p className="text-gray-600 text-sm mt-1">
                                                {schoolData.state}, {schoolData.country || 'Nigeria'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Departments */}
                            {schoolData.departments && schoolData.departments.length > 0 && (
                                <div className="bg-white border border-gray-200 rounded-xl p-6">
                                    <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                                        <BookOpen className="w-5 h-5" />
                                        Departments
                                    </h3>
                                    <div className="flex flex-wrap gap-2">
                                        {schoolData.departments.map((dept, idx) => (
                                            <span key={idx} className="bg-blue-100 text-blue-800 px-4 py-2 rounded-full text-sm font-medium">
                                                {dept}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Academic Programs */}
                            {schoolData.academicPrograms && schoolData.academicPrograms.length > 0 && (
                                <div className="bg-white border border-gray-200 rounded-xl p-6">
                                    <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                                        <UsersIcon className="w-5 h-5" />
                                        Academic Programs
                                    </h3>
                                    <div className="grid md:grid-cols-2 gap-2">
                                        {schoolData.academicPrograms.map((program, idx) => (
                                            <div key={idx} className="bg-purple-50 text-purple-800 px-4 py-2 rounded-lg text-sm">
                                                {program}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Approval Info */}
                            <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
                                <h3 className="font-bold text-gray-900 mb-4">Registration Details</h3>
                                <div className="grid md:grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <p className="text-gray-500">Approval Number</p>
                                        <p className="font-mono text-gray-900">{schoolData.approvalNumber || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-500">Application ID</p>
                                        <p className="font-mono text-gray-900">{schoolData.applicationId || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-500">Status</p>
                                        <span className="inline-block mt-1 px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">
                                            {schoolData.status === 'approved' ? '✓ VERIFIED' : schoolData.status}
                                        </span>
                                    </div>
                                    <div>
                                        <p className="text-gray-500">Joined Date</p>
                                        <p className="text-gray-900">
                                            {schoolData.createdAt?.toDate ?
                                                new Date(schoolData.createdAt.toDate()).toLocaleDateString() :
                                                'N/A'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Documents Tab */}
                    {activeTab === 'documents' && (
                        <div className="p-8">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-2xl font-bold">School Documents</h2>
                                <button
                                    onClick={handleDoc}
                                    className="bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 font-semibold shadow-lg"
                                >
                                    <Plus className="w-5 h-5 inline mr-2" />
                                    Upload Document
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Settings Tab */}
                    {activeTab === 'settings' && (
                        <div className="p-8">
                            <h2 className="text-2xl font-bold text-gray-900 mb-6">School Settings</h2>
                            <div className="bg-gray-50 rounded-xl p-6">
                                <p className="text-gray-600">Settings panel coming soon. You'll be able to update school information, manage departments, and configure preferences.</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}