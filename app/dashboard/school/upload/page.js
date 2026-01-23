"use client";
import { useState, useEffect } from 'react';
import { Upload, FileText, ArrowLeft, ArrowRight, CheckCircle, Loader2, AlertCircle } from 'lucide-react';
import { db, auth } from "@/lib/firebaseConfig";
import { collection, query, where, getDocs, addDoc } from 'firebase/firestore';
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";

export default function DocumentUploadPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);
    const [schoolData, setSchoolData] = useState(null);
    const [currentStep, setCurrentStep] = useState(1);
    const [uploadLoading, setUploadLoading] = useState(false);

    const [uploadForm, setUploadForm] = useState({
        faculty: '',
        department: '',
        courseCode: '',
        courseTitle: '',
        semester: '',
        academicSession: new Date().getFullYear().toString(),
        level: '',
        documentType: '',
        tags: '',
        visibility: 'public',
        file: null
    });
    const [uploadErrors, setUploadErrors] = useState({});

    const documentTypes = ['Lecture Note', 'Past Question', 'Thesis', 'Syllabus', 'Course Outline', 'Assignment', 'Project'];
    const semesters = ['First Semester', 'Second Semester', 'Both Semesters'];
    const levels = ['100 Level', '200 Level', '300 Level', '400 Level', '500 Level', 'All Levels'];
    const visibilityOptions = ['public', 'students-only', 'premium'];

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

                if (school.status !== 'approved') {
                    router.push('/school/dashboard');
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

    const handleInputChange = (e) => {
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

    const validateStep = (step) => {
        const errors = {};

        if (step === 1) {
            if (!uploadForm.faculty.trim()) errors.faculty = 'Faculty/College is required';
            if (!uploadForm.department.trim()) errors.department = 'Department is required';
        }

        if (step === 2) {
            if (!uploadForm.courseCode.trim()) errors.courseCode = 'Course code is required';
            if (!uploadForm.courseTitle.trim()) errors.courseTitle = 'Course title is required';
            if (!uploadForm.semester) errors.semester = 'Semester is required';
            if (!uploadForm.level) errors.level = 'Level is required';
            if (!uploadForm.documentType) errors.documentType = 'Document type is required';
        }

        if (step === 3) {
            if (!uploadForm.file) errors.file = 'Document file is required';
        }

        setUploadErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleNext = () => {
        if (validateStep(currentStep)) {
            setCurrentStep(prev => prev + 1);
        }
    };

    const handleBack = () => {
        setCurrentStep(prev => prev - 1);
    };

    const handleSubmit = async () => {
        if (!validateStep(3)) return;

        setUploadLoading(true);
        try {
            const fileUrl = `https://storage.lanlibrary.com/docs/${Date.now()}.pdf`;
            const tagsArray = uploadForm.tags.split(',').map(tag => tag.trim()).filter(Boolean);

            const documentData = {
                documentId: `doc-${Date.now()}`,
                schoolId: schoolData.schoolId,
                schoolName: schoolData.schoolName,
                faculty: uploadForm.faculty,
                department: uploadForm.department,
                courseCode: uploadForm.courseCode,
                courseTitle: uploadForm.courseTitle,
                semester: uploadForm.semester,
                academicSession: uploadForm.academicSession,
                level: uploadForm.level,
                documentType: uploadForm.documentType,
                tags: tagsArray,
                visibility: uploadForm.visibility,
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

            alert('Document uploaded successfully! It will be reviewed within 1-2 business days.');
            router.push('/school/dashboard');
        } catch (error) {
            console.error('Upload error:', error);
            alert('Failed to upload document. Please try again.');
        } finally {
            setUploadLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
                    <p className="text-gray-600">Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12 px-4">
            <div className="max-w-4xl mx-auto">
                <div className="mb-8">
                    <button
                        onClick={() => router.push('/school/dashboard')}
                        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        Back to Dashboard
                    </button>
                    <h1 className="text-4xl font-bold text-gray-900 mb-2">Upload Document</h1>
                    <p className="text-gray-600">Share educational resources with students at {schoolData?.schoolName}</p>
                </div>

                <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
                    <div className="flex items-center justify-between mb-8">
                        {[1, 2, 3].map((step) => (
                            <div key={step} className="flex items-center flex-1">
                                <div className={`flex items-center justify-center w-12 h-12 rounded-full font-bold ${currentStep >= step
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-gray-200 text-gray-500'
                                    }`}>
                                    {currentStep > step ? <CheckCircle className="w-6 h-6" /> : step}
                                </div>
                                <div className="ml-4 flex-1">
                                    <p className={`font-semibold ${currentStep >= step ? 'text-blue-600' : 'text-gray-500'
                                        }`}>
                                        Step {step}
                                    </p>
                                    <p className="text-sm text-gray-600">
                                        {step === 1 && 'Identity'}
                                        {step === 2 && 'Content Details'}
                                        {step === 3 && 'File & Finish'}
                                    </p>
                                </div>
                                {step < 3 && (
                                    <div className={`h-1 w-full mx-4 ${currentStep > step ? 'bg-blue-600' : 'bg-gray-200'
                                        }`} />
                                )}
                            </div>
                        ))}
                    </div>

                    <div>
                        {currentStep === 1 && (
                            <div className="space-y-6">
                                <h2 className="text-2xl font-bold text-gray-900 mb-6">Faculty & Department Information</h2>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Faculty/College *
                                    </label>
                                    <input
                                        type="text"
                                        name="faculty"
                                        value={uploadForm.faculty}
                                        onChange={handleInputChange}
                                        placeholder="e.g., Faculty of Law, College of Engineering"
                                        className={`w-full px-4 py-3 text-blue-950 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${uploadErrors.faculty ? 'border-red-500' : 'border-gray-300'
                                            }`}
                                    />
                                    {uploadErrors.faculty && (
                                        <p className="text-red-600 text-sm mt-1">{uploadErrors.faculty}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Department *
                                    </label>
                                    <input
                                        type="text"
                                        name="department"
                                        value={uploadForm.department}
                                        onChange={handleInputChange}
                                        placeholder="e.g., Jurisprudence, Computer Science"
                                        className={`w-full px-4 py-3 text-blue-950 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${uploadErrors.department ? 'border-red-500' : 'border-gray-300'
                                            }`}
                                    />
                                    {uploadErrors.department && (
                                        <p className="text-red-600 text-sm mt-1">{uploadErrors.department}</p>
                                    )}
                                </div>
                            </div>
                        )}

                        {currentStep === 2 && (
                            <div className="space-y-6 text-blue-950">
                                <h2 className="text-2xl font-bold text-gray-900 mb-6">Course & Content Details</h2>

                                <div className="grid md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Course Code *
                                        </label>
                                        <input
                                            type="text"
                                            name="courseCode"
                                            value={uploadForm.courseCode}
                                            onChange={handleInputChange}
                                            placeholder="e.g., LAW 101, CSC 201"
                                            className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${uploadErrors.courseCode ? 'border-red-500' : 'border-gray-300'
                                                }`}
                                        />
                                        {uploadErrors.courseCode && (
                                            <p className="text-red-600 text-sm mt-1">{uploadErrors.courseCode}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Course Title *
                                        </label>
                                        <input
                                            type="text"
                                            name="courseTitle"
                                            value={uploadForm.courseTitle}
                                            onChange={handleInputChange}
                                            placeholder="e.g., Introduction to Law"
                                            className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${uploadErrors.courseTitle ? 'border-red-500' : 'border-gray-300'
                                                }`}
                                        />
                                        {uploadErrors.courseTitle && (
                                            <p className="text-red-600 text-sm mt-1">{uploadErrors.courseTitle}</p>
                                        )}
                                    </div>
                                </div>

                                <div className="grid md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Semester *
                                        </label>
                                        <select
                                            name="semester"
                                            value={uploadForm.semester}
                                            onChange={handleInputChange}
                                            className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${uploadErrors.semester ? 'border-red-500' : 'border-gray-300'
                                                }`}
                                        >
                                            <option value="">Select semester</option>
                                            {semesters.map(sem => (
                                                <option key={sem} value={sem}>{sem}</option>
                                            ))}
                                        </select>
                                        {uploadErrors.semester && (
                                            <p className="text-red-600 text-sm mt-1">{uploadErrors.semester}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Academic Session *
                                        </label>
                                        <input
                                            type="text"
                                            name="academicSession"
                                            value={uploadForm.academicSession}
                                            onChange={handleInputChange}
                                            placeholder="2024/2025"
                                            className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        />
                                    </div>
                                </div>

                                <div className="grid md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Level *
                                        </label>
                                        <select
                                            name="level"
                                            value={uploadForm.level}
                                            onChange={handleInputChange}
                                            className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${uploadErrors.level ? 'border-red-500' : 'border-gray-300'
                                                }`}
                                        >
                                            <option value="">Select level</option>
                                            {levels.map(level => (
                                                <option key={level} value={level}>{level}</option>
                                            ))}
                                        </select>
                                        {uploadErrors.level && (
                                            <p className="text-red-600 text-sm mt-1">{uploadErrors.level}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Document Type *
                                        </label>
                                        <select
                                            name="documentType"
                                            value={uploadForm.documentType}
                                            onChange={handleInputChange}
                                            className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${uploadErrors.documentType ? 'border-red-500' : 'border-gray-300'
                                                }`}
                                        >
                                            <option value="">Select type</option>
                                            {documentTypes.map(type => (
                                                <option key={type} value={type}>{type}</option>
                                            ))}
                                        </select>
                                        {uploadErrors.documentType && (
                                            <p className="text-red-600 text-sm mt-1">{uploadErrors.documentType}</p>
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Tags/Keywords (Optional)
                                    </label>
                                    <input
                                        type="text"
                                        name="tags"
                                        value={uploadForm.tags}
                                        onChange={handleInputChange}
                                        placeholder="Separate with commas: litigation, contracts, case law"
                                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                    <p className="text-sm text-gray-500 mt-1">Add keywords to help students find this document</p>
                                </div>
                            </div>
                        )}

                        {currentStep === 3 && (
                            <div className="space-y-6">
                                <h2 className="text-2xl font-bold text-gray-900 mb-6">Upload File & Visibility</h2>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Upload PDF Document *
                                    </label>
                                    <div className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${uploadErrors.file
                                            ? 'border-red-500 bg-red-50'
                                            : uploadForm.file
                                                ? 'border-green-500 bg-green-50'
                                                : 'border-gray-300 hover:border-blue-500 bg-gray-50'
                                        }`}>
                                        <input
                                            type="file"
                                            id="documentFile"
                                            accept=".pdf"
                                            onChange={handleFileChange}
                                            className="hidden"
                                        />
                                        <label htmlFor="documentFile" className="cursor-pointer">
                                            {uploadForm.file ? (
                                                <>
                                                    <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-3" />
                                                    <p className="text-green-600 font-semibold text-lg">{uploadForm.file.name}</p>
                                                    <p className="text-gray-600 text-sm mt-1">
                                                        {(uploadForm.file.size / (1024 * 1024)).toFixed(2)} MB
                                                    </p>
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            document.getElementById('documentFile').click();
                                                        }}
                                                        className="mt-3 text-blue-600 hover:text-blue-700 text-sm font-medium"
                                                    >
                                                        Change file
                                                    </button>
                                                </>
                                            ) : (
                                                <>
                                                    <Upload className="w-16 h-16 text-gray-400 mx-auto mb-3" />
                                                    <p className="text-gray-700 font-semibold mb-1">Click to upload PDF</p>
                                                    <p className="text-gray-500 text-sm">Maximum file size: 10MB</p>
                                                </>
                                            )}
                                        </label>
                                    </div>
                                    {uploadErrors.file && (
                                        <p className="text-red-600 text-sm mt-1">{uploadErrors.file}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                                        Visibility Settings
                                    </label>
                                    <div className="space-y-3">
                                        {[
                                            { value: 'public', label: 'Public', desc: 'Anyone can view and download' },
                                            { value: 'students-only', label: 'Students Only', desc: 'Only verified students can access' },
                                            { value: 'premium', label: 'Premium', desc: 'Requires subscription to access' }
                                        ].map(option => (
                                            <label
                                                key={option.value}
                                                className={`flex items-start gap-3 p-4 border-2 rounded-xl cursor-pointer transition-all ${uploadForm.visibility === option.value
                                                        ? 'border-blue-600 bg-blue-50'
                                                        : 'border-gray-200 hover:border-gray-300'
                                                    }`}
                                            >
                                                <input
                                                    type="radio"
                                                    name="visibility"
                                                    value={option.value}
                                                    checked={uploadForm.visibility === option.value}
                                                    onChange={handleInputChange}
                                                    className="mt-1"
                                                />
                                                <div>
                                                    <p className="font-semibold text-gray-900">{option.label}</p>
                                                    <p className="text-sm text-gray-600">{option.desc}</p>
                                                </div>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                                    <div className="flex gap-3">
                                        <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                                        <div>
                                            <p className="text-sm text-blue-900 font-semibold mb-1">Document Review Process</p>
                                            <p className="text-sm text-blue-800">
                                                All uploaded documents will be reviewed by our team to ensure quality and authenticity.
                                                This typically takes 1-2 business days. You'll be notified once your document is approved.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="flex gap-4 mt-8 pt-6 border-t border-gray-200">
                            {currentStep > 1 && (
                                <button
                                    type="button"
                                    onClick={handleBack}
                                    className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all font-semibold flex items-center justify-center gap-2"
                                >
                                    <ArrowLeft className="w-5 h-5" />
                                    Previous
                                </button>
                            )}

                            {currentStep < 3 ? (
                                <button
                                    type="button"
                                    onClick={handleNext}
                                    className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all font-semibold flex items-center justify-center gap-2 shadow-lg"
                                >
                                    Next
                                    <ArrowRight className="w-5 h-5" />
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    onClick={handleSubmit}
                                    disabled={uploadLoading}
                                    className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all font-semibold disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg"
                                >
                                    {uploadLoading ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            Uploading...
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle className="w-5 h-5" />
                                            Submit Document
                                        </>
                                    )}
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {currentStep === 3 && uploadForm.courseTitle && (
                    <div className="bg-white rounded-2xl shadow-lg p-6">
                        <h3 className="font-bold text-gray-900 mb-4">Document Summary</h3>
                        <div className="grid md:grid-cols-2 gap-4 text-sm">
                            <div>
                                <p className="text-gray-500">Faculty</p>
                                <p className="font-semibold text-gray-900">{uploadForm.faculty}</p>
                            </div>
                            <div>
                                <p className="text-gray-500">Department</p>
                                <p className="font-semibold text-gray-900">{uploadForm.department}</p>
                            </div>
                            <div>
                                <p className="text-gray-500">Course</p>
                                <p className="font-semibold text-gray-900">{uploadForm.courseCode} - {uploadForm.courseTitle}</p>
                            </div>
                            <div>
                                <p className="text-gray-500">Level & Semester</p>
                                <p className="font-semibold text-gray-900">{uploadForm.level} • {uploadForm.semester}</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}