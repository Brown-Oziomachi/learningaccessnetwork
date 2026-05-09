"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { app, auth, db } from "@/lib/firebaseConfig";
import { storage } from "@/lib/firebaseStorage";
import { addDoc, collection, serverTimestamp, doc, getDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import {
    Upload, X, AlertCircle, Building2, BookOpen, GraduationCap,
    ChevronRight, ChevronDown, Check, FileText, FlaskConical,
    PenLine, ClipboardList, Layers, ScrollText, Briefcase, Star,
    Image as ImageIcon, DollarSign, Info, Search,
    ArrowLeft,
    ArrowRight
} from "lucide-react";
import { UNIVERSITIES_BY_COUNTRY, UNIVERSITY_COUNTRIES } from "@/lib/africanUniversities";
// ─── ALL DOCUMENT TYPES ───────────────────────────────────────────────────────
const documentTypes = [
    // Core Academic
    { name: 'Textbook', group: 'Core Academic' },
    { name: 'Lecture Note', group: 'Core Academic' },
    { name: 'Handwritten Notes', group: 'Core Academic' },
    { name: 'Summary', group: 'Core Academic' },
    { name: 'Syllabus', group: 'Core Academic' },
    { name: 'Course Outline', group: 'Core Academic' },
    { name: 'Study Guide', group: 'Core Academic' },
    { name: 'Reading List', group: 'Core Academic' },
    { name: 'Mind Map', group: 'Core Academic' },
    { name: 'Flashcards', group: 'Core Academic' },
    { name: 'Cheat Sheet', group: 'Core Academic' },
    { name: 'Annotated Bibliography', group: 'Core Academic' },
    // Exam & Assessment
    { name: 'Past Question', group: 'Exam & Assessment' },
    { name: 'Exam Revision', group: 'Exam & Assessment' },
    { name: 'Assignment', group: 'Exam & Assessment' },
    { name: 'Mock Exam', group: 'Exam & Assessment' },
    { name: 'Quiz Bank', group: 'Exam & Assessment' },
    { name: 'WAEC Past Questions', group: 'Exam & Assessment' },
    { name: 'JAMB CBT Practice', group: 'Exam & Assessment' },
    { name: 'NECO Past Questions', group: 'Exam & Assessment' },
    { name: 'GCE Past Questions', group: 'Exam & Assessment' },
    { name: 'Post-UTME Past Questions', group: 'Exam & Assessment' },
    // Research & Writing
    { name: 'Thesis', group: 'Research & Writing' },
    { name: 'Research Proposal', group: 'Research & Writing' },
    { name: 'Seminar Paper', group: 'Research & Writing' },
    { name: 'Case Study', group: 'Research & Writing' },
    { name: 'Journal Article', group: 'Research & Writing' },
    { name: 'Literature Review', group: 'Research & Writing' },
    { name: 'Conference Paper', group: 'Research & Writing' },
    { name: 'Essay', group: 'Research & Writing' },
    { name: 'Dissertation Chapter', group: 'Research & Writing' },
    { name: 'Group Project Report', group: 'Research & Writing' },
    // Practical & Technical
    { name: 'Lab Manual', group: 'Practical & Technical' },
    { name: 'Project', group: 'Practical & Technical' },
    { name: 'Technical Drawing', group: 'Practical & Technical' },
    { name: 'Lab Report', group: 'Practical & Technical' },
    { name: 'Field Report', group: 'Practical & Technical' },
    { name: 'Software Documentation', group: 'Practical & Technical' },
    { name: 'Circuit Diagram', group: 'Practical & Technical' },
    { name: 'Code Sample', group: 'Practical & Technical' },
    { name: 'Algorithm Sheet', group: 'Practical & Technical' },
    // Administrative
    { name: 'Internship Report', group: 'Administrative' },
    { name: 'Clearance Guide', group: 'Administrative' },
    { name: 'Scholarship Guide', group: 'Administrative' },
    { name: 'CV Template', group: 'Administrative' },
    { name: 'Cover Letter Template', group: 'Administrative' },
    { name: 'Student Handbook', group: 'Administrative' },
    { name: 'Hostel Guide', group: 'Administrative' },
    { name: 'Admission Letter', group: 'Administrative' },
    { name: 'Academic Transcript', group: 'Administrative' },
    { name: 'Fellowship Application', group: 'Administrative' },
    // Career & Professional
    { name: 'Portfolio', group: 'Career & Professional' },
    { name: 'Career Guide', group: 'Career & Professional' },
    { name: 'Interview Prep', group: 'Career & Professional' },
    { name: 'Networking Guide', group: 'Career & Professional' },
    // Digital & Multimedia
    { name: 'Presentation Slides', group: 'Digital & Multimedia' },
    { name: 'Infographic', group: 'Digital & Multimedia' },
    { name: 'Video Lecture Notes', group: 'Digital & Multimedia' },
    { name: 'Podcast Transcript', group: 'Digital & Multimedia' },
    { name: 'E-Book', group: 'Digital & Multimedia' },
    // Professional Schools
    { name: 'Medical Notes', group: 'Professional Schools' },
    { name: 'Law Case Brief', group: 'Professional Schools' },
    { name: 'Nursing Guide', group: 'Professional Schools' },
    { name: 'Accounting Workbook', group: 'Professional Schools' },
    { name: 'Engineering Formula Sheet', group: 'Professional Schools' },
    { name: 'Pharmacy Notes', group: 'Professional Schools' },
    { name: 'Architecture Portfolio', group: 'Professional Schools' },
    // General
    { name: 'Workshop Material', group: 'General' },
    { name: 'Tutorial Sheet', group: 'General' },
    { name: 'Translation Resource', group: 'General' },
    { name: 'Motivational Resource', group: 'General' },
    { name: 'Community Timetable', group: 'General' },
    // Cooking & Culinary
    { name: 'Recipe Book', group: 'Cooking & Culinary' },
    { name: 'Culinary Notes', group: 'Cooking & Culinary' },
    { name: 'Food Science Notes', group: 'Cooking & Culinary' },
    { name: 'Nutrition Guide', group: 'Cooking & Culinary' },
    { name: 'Meal Plan', group: 'Cooking & Culinary' },
];

const docTypeGroups = [...new Set(documentTypes.map(d => d.group))];

const categories = [
    'Education', 'Law', 'Medicine', 'Engineering', 'Personal Development',
    'Business', 'Technology', 'Science', 'Literature', 'Health & Fitness',
    'History', 'Arts & Culture', 'Relationship', 'Self-Help', 'Finance',
    'Marketing', 'Programming', 'Psychology', 'Fiction', 'Non-Fiction',
    'Philosophy', 'Travel', 'Cooking', 'Religion & Spirituality',
    'Sex Education', 'Social Media',
];

const institutionalCategories = [
    { value: '', label: 'None (General Library)' },
    { value: 'university', label: 'Universities' },
    { value: 'islamic-institutions', label: 'Islamic Institutions' },
    { value: 'christian-institutions', label: 'Christian Institutions' },
    { value: 'jewish-institutions', label: 'Jewish Institutions' },
    { value: 'secondary-school', label: 'Secondary School' },
    { value: 'primary-school', label: 'Primary School' },
    { value: 'exam-prep', label: 'WAEC/NECO/JAMB' },
    { value: 'polytechnic', label: 'Polytechnics' },
    { value: 'college-of-education', label: 'Colleges of Education' },
    { value: 'professional-cert', label: 'Professional Certifications' },
    { value: 'postgraduate', label: 'Postgraduate Studies' }
];

const semesters = ['First Semester', 'Second Semester', 'Both Semesters'];
const levels = [
    { value: '100', label: '100 Level' },
    { value: '200', label: '200 Level' },
    { value: '300', label: '300 Level' },
    { value: '400', label: '400 Level' },
    { value: '500', label: '500 Level' },
    { value: 'pg', label: 'Postgraduate' },
];

// ─── STEPS ───────────────────────────────────────────────────────────────────
const STEPS = [
    { id: 1, label: 'Document Details', icon: FileText },
    { id: 2, label: 'Academic Info', icon: GraduationCap },
    { id: 3, label: 'Pricing & Format', icon: DollarSign },
    { id: 4, label: 'Upload Files', icon: Upload },
    { id: 5, label: 'Review & Submit', icon: Check },
];

// ─── SEARCHABLE SELECT ────────────────────────────────────────────────────────
function SearchableSelect({ label, required, value, onChange, placeholder, options, grouped }) {
    const [open, setOpen] = useState(false);
    const [q, setQ] = useState('');
    const ref = useRef(null);

    useEffect(() => {
        const fn = (e) => { if (!ref.current?.contains(e.target)) setOpen(false); };
        document.addEventListener('mousedown', fn);
        return () => document.removeEventListener('mousedown', fn);
    }, []);

    let filtered;
    if (grouped) {
        filtered = {};
        docTypeGroups.forEach(g => {
            const items = documentTypes.filter(d => d.group === g && d.name.toLowerCase().includes(q.toLowerCase()));
            if (items.length) filtered[g] = items;
        });
    } else {
        filtered = (options || []).filter(o => o.toLowerCase().includes(q.toLowerCase()));
    }

    const display = value || placeholder || `Select ${label}`;

    return (
        <div ref={ref} className="relative">
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                {label} {required && <span className="text-orange-500">*</span>}
            </label>
            <button
                type="button"
                onClick={() => setOpen(!open)}
                className={`w-full flex items-center justify-between px-4 py-3 border text-left transition-all text-sm ${open ? 'border-[#1a3a5c] ring-2 ring-[#1a3a5c]/10' : 'border-gray-200 hover:border-gray-400'
                    } bg-white rounded-lg`}
            >
                <span className={value ? 'text-gray-900 font-medium' : 'text-gray-400'}>{display}</span>
                <ChevronDown size={15} className={`text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
            </button>
            {open && (
                <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-2xl overflow-hidden max-h-72 flex flex-col">
                    <div className="p-2 border-b border-gray-100">
                        <div className="relative">
                            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                autoFocus
                                value={q}
                                onChange={e => setQ(e.target.value)}
                                placeholder="Search..."
                                className="w-full pl-8 pr-3 py-1.5 text-black text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#1a3a5c]"
                            />
                        </div>
                    </div>
                    <div className="overflow-y-auto flex-1">
                        {grouped ? (
                            Object.keys(filtered).length === 0 ? (
                                <p className="text-center text-sm text-gray-400 py-4">No results</p>
                            ) : Object.entries(filtered).map(([group, items]) => (
                                <div key={group}>
                                    <p className="px-3 py-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-widest bg-gray-50">{group}</p>
                                    {items.map(item => (
                                        <button
                                            key={item.name}
                                            type="button"
                                            onClick={() => { onChange(item.name); setOpen(false); setQ(''); }}
                                            className={`w-full text-left px-4 py-2.5 text-sm hover:bg-[#1a3a5c]/5 transition-colors flex items-center justify-between ${value === item.name ? 'text-[#1a3a5c] font-semibold bg-[#1a3a5c]/5' : 'text-gray-700'
                                                }`}
                                        >
                                            {item.name}
                                            {value === item.name && <Check size={13} />}
                                        </button>
                                    ))}
                                </div>
                            ))
                        ) : (
                            filtered.length === 0 ? (
                                <p className="text-center text-sm text-gray-400 py-4">No results</p>
                            ) : filtered.map(opt => (
                                <button
                                    key={opt}
                                    type="button"
                                    onClick={() => { onChange(opt); setOpen(false); setQ(''); }}
                                    className={`w-full text-left px-4 py-2.5 text-sm hover:bg-[#1a3a5c]/5 transition-colors flex items-center justify-between ${value === opt ? 'text-[#1a3a5c] font-semibold bg-[#1a3a5c]/5' : 'text-gray-700'
                                        }`}
                                >
                                    {opt}
                                    {value === opt && <Check size={13} />}
                                </button>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

// ─── FIELD WRAPPER ────────────────────────────────────────────────────────────
function Field({ label, required, hint, children }) {
    return (
        <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                {label} {required && <span className="text-orange-500">*</span>}
            </label>
            {children}
            {hint && <p className="mt-1 text-xs text-gray-400">{hint}</p>}
        </div>
    );
}

function Input({ className = '', ...props }) {
    return (
        <input
            className={`w-full px-4 py-3 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:border-[#1a3a5c] focus:ring-2 focus:ring-[#1a3a5c]/10 transition-all placeholder:text-gray-400 ${className}`}
            {...props}
        />
    );
}

function Select({ children, className = '', ...props }) {
    return (
        <select
            className={`w-full px-4 py-3 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:border-[#1a3a5c] focus:ring-2 focus:ring-[#1a3a5c]/10 transition-all bg-white ${className}`}
            {...props}
        >
            {children}
        </select>
    );
}

function Textarea({ className = '', ...props }) {
    return (
        <textarea
            className={`w-full px-4 py-3 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:border-[#1a3a5c] focus:ring-2 focus:ring-[#1a3a5c]/10 transition-all resize-none placeholder:text-gray-400 ${className}`}
            {...props}
        />
    );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function AdvertiseClient() {
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [checkingAuth, setCheckingAuth] = useState(true);
    const [user, setUser] = useState(null);
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState('');
    const [uploadPercentage, setUploadPercentage] = useState(0);
    const [uploadingFile, setUploadingFile] = useState(false);
    const [showAccessWarning, setShowAccessWarning] = useState(false);
    const [isValidatingLink, setIsValidatingLink] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [selectedCoverImage, setSelectedCoverImage] = useState(null);

    const [formData, setFormData] = useState({
        name: '', email: '',
        bookTitle: '', author: '', category: '', institutionalCategory: '',
        isbn: '', courseCode: '', semester: '', session: '',
        docType: '', price: '', format: 'PDF', level: '100',
        pages: '', description: '', message: '', driveLink: '',
        coverImagePreview: null, university: '',
        universityCountry: '',
    });

    // Auth
    useEffect(() => {
        const unsub = onAuthStateChanged(auth, async (cu) => {
            if (!cu) { setCheckingAuth(false); router.replace('/auth/signin?redirect=/advertise'); return; }
            setUser(cu);
            try {
                const snap = await getDoc(doc(db, 'users', cu.uid));
                const fd = snap.exists() ? snap.data() : null;
                setUserData(fd);
                setFormData(p => ({
                    ...p,
                    name: fd?.displayName || fd?.name || cu.displayName || '',
                    email: cu.email || '',
                }));
            } catch { setFormData(p => ({ ...p, name: cu.displayName || '', email: cu.email || '' })); }
            setCheckingAuth(false);
        });
        return () => unsub();
    }, [router]);

    useEffect(() => {
        return () => { if (formData.coverImagePreview) URL.revokeObjectURL(formData.coverImagePreview); };
    }, [formData.coverImagePreview]);

    const set = (k, v) => setFormData(p => ({ ...p, [k]: v }));
    const handle = (e) => set(e.target.name, e.target.value);

    const extractDriveFileId = (url) => {
        if (!url) return '';
        const m = url.match(/\/d\/([\w-]{25,})|\/file\/d\/([\w-]{25,})|id=([\w-]{25,})/);
        return m ? (m[1] || m[2] || m[3]) : '';
    };

    const handleDriveLinkChange = (e) => {
        set('driveLink', e.target.value);
        if (e.target.value.includes('drive.google.com')) {
            setIsValidatingLink(true);
            const hasView = e.target.value.includes('/view') || e.target.value.includes('usp=sharing');
            if (extractDriveFileId(e.target.value) && !hasView) setShowAccessWarning(true);
            setIsValidatingLink(false);
        }
    };

    const handleFileUpload = async (file) => {
        if (!file) return null;
        if (file.type !== 'application/pdf') { alert('PDF only'); return null; }
        if (file.size > 50 * 1024 * 1024) { alert('Max 50MB'); return null; }

        try {
            setUploadingFile(true);
            setUploadProgress('Uploading PDF…');

            const timestamp = Date.now();
            const fileName = `${timestamp}_${file.name.replace(/\s+/g, '_')}`;
            const storageRef = ref(storage, `books/${user.uid}/${fileName}`);
            const uploadTask = uploadBytesResumable(storageRef, file);

            return await new Promise((resolve, reject) => {
                uploadTask.on(
                    'state_changed',
                    (snapshot) => {
                        const pct = Math.round(
                            (snapshot.bytesTransferred / snapshot.totalBytes) * 100
                        );
                        setUploadPercentage(pct);
                        setUploadProgress(`Uploading PDF: ${pct}%`);
                    },
                    (error) => reject(error),
                    async () => {
                        const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
                        resolve(downloadUrl);
                    }
                );
            });

        } catch (e) {
            alert(e.message || 'Upload failed');
            return null;
        } finally {
            setUploadingFile(false);
            setUploadProgress('');
        }
    };

    const handleCoverImageUpload = async (file) => {
        if (!file) return null;
        if (!['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.type)) {
            alert('JPG/PNG/WEBP only'); return null;
        }
        if (file.size > 5 * 1024 * 1024) { alert('Max 5MB'); return null; }

        try {
            setUploadProgress('Uploading cover…');
            const timestamp = Date.now();
            const fileName = `${timestamp}_${file.name.replace(/\s+/g, '_')}`;
            const storageRef = ref(storage, `covers/${user.uid}/${fileName}`);
            const uploadTask = uploadBytesResumable(storageRef, file);

            return await new Promise((resolve, reject) => {
                uploadTask.on(
                    'state_changed',
                    (snapshot) => {
                        const pct = Math.round(
                            (snapshot.bytesTransferred / snapshot.totalBytes) * 100
                        );
                        setUploadProgress(`Uploading cover: ${pct}%`);
                    },
                    (error) => reject(error),
                    async () => {
                        const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
                        resolve(downloadUrl);
                    }
                );
            });
        } catch (e) {
            alert(e.message || 'Cover upload failed');
            return null;
        } finally {
            setUploadProgress('');
        }
    };

    const handleFileSelect = (e) => {
        const f = e.target.files[0];
        if (f) { setSelectedFile(f); set('driveLink', ''); }
    };

    const handleCoverImageSelect = (e) => {
        const f = e.target.files[0];
        if (f) {
            setSelectedCoverImage(f);
            set('coverImagePreview', URL.createObjectURL(f));
        }
    };

    // Step validation
    const canProceed = () => {
        if (step === 1) return formData.bookTitle && formData.author && formData.docType && formData.category;
        if (step === 2) return true; // academic info is optional
        if (step === 3) return formData.price && formData.pages;
        if (step === 4) return selectedFile || formData.driveLink;
        return true;
    };

    const handleSubmit = async () => {
        if (!formData.name || !formData.email || !formData.bookTitle ||
            !formData.author || !formData.category || !formData.price ||
            !formData.pages || !formData.description) { alert('Please fill all required fields'); return; }
        if (!selectedFile && !formData.driveLink) { alert('Please upload a PDF or provide a Drive link'); return; }

        try {
            setLoading(true);
            let pdfUrl = formData.driveLink;
            if (selectedFile) { pdfUrl = await handleFileUpload(selectedFile); if (!pdfUrl) { setLoading(false); return; } }
            let coverImageUrl = null;
            if (selectedCoverImage) { coverImageUrl = await handleCoverImageUpload(selectedCoverImage); }
            if (!selectedFile && formData.driveLink) { try { new URL(formData.driveLink); } catch { alert('Invalid Drive link'); setLoading(false); return; } }

            setUploadProgress('Saving document details...');
            const driveFileId = extractDriveFileId(pdfUrl);
            let embedUrl = pdfUrl;
            if (pdfUrl?.includes('drive.google.com') && driveFileId) embedUrl = `https://drive.google.com/file/d/${driveFileId}/preview`;

            const displayName = userData?.displayName || userData?.name || formData.name || `${userData?.firstName || ''} ${userData?.surname || ''}`.trim();

            await addDoc(collection(db, 'advertMyBook'), {
                userId: user.uid, sellerId: user.uid, sellerEmail: user.email, sellerName: displayName,
                sellerPhone: userData?.phoneNumber || null,
                bookTitle: formData.bookTitle, coverImage: coverImageUrl, image: coverImageUrl,
                author: formData.author, category: formData.category,
                institutionalCategory: formData.institutionalCategory || null,
                isbn: formData.isbn || 'N/A', courseCode: formData.courseCode?.toUpperCase() || null,
                semester: formData.semester || null, session: formData.session || null,
                docType: formData.docType, level: formData.level,
                price: Number(formData.price), format: formData.format, pages: Number(formData.pages),
                description: formData.description, message: formData.message,
                pdfLink: pdfUrl, pdfUrl, embedUrl, driveFileId: driveFileId || null, university: formData.university || null, universityCountry: formData.universityCountry || null,
                uploadMethod: selectedFile ? 'direct_upload' : 'drive_link',
                status: 'pending', views: 0, purchases: 0,
                createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
            });

            alert('Submitted successfully! We\'ll review and contact you within 24–48 hours.');
            router.replace('/upload-document/my-pending-books');
        } catch (e) {
            console.error(e);
            alert(e.message || 'Something went wrong.');
        } finally { setLoading(false); setUploadProgress(''); setUploadingFile(false); }
    };

    if (checkingAuth) return (
        <div className="min-h-screen flex items-center justify-center bg-[#f8f6f2]">
            <div className="text-center">
                <div className="w-10 h-10 border-2 border-[#1a3a5c] border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="mt-3 text-sm text-gray-500" style={{ fontFamily: 'Georgia, serif' }}>Loading…</p>
            </div>
        </div>
    );

    const earnings = formData.price ? (Number(formData.price) * 0.8).toLocaleString() : '0';

    return (
        <div className="min-h-screen bg-[#f8f6f2]" style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=Playfair+Display:wght@600;700;800&display=swap');
                .playfair { font-family: 'Playfair Display', Georgia, serif; }
                .step-line { transition: width 0.5s cubic-bezier(0.4,0,0.2,1); }
                .upload-zone { transition: all 0.2s ease; }
                .upload-zone:hover { border-color: #1a3a5c; background: rgba(26,58,92,0.03); }
                .upload-zone.active { border-color: #16a34a; background: rgba(22,163,74,0.04); }
                input[type=number]::-webkit-inner-spin-button { opacity: 0.4; }
            `}</style>

            {/* TOP HEADER */}
            <header className="bg-[#1a3a5c] px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-white/20 rounded flex items-center justify-center">
                        <BookOpen size={16} color="white" />
                    </div>
                    <span className="text-white/40 text-sm mx-2">›</span>
                    <a href="/uploader-agreement" className="text-white/70 text-sm underline">Uploader Agreement
                        <ArrowRight size={12} className="inline-block -rotate-90 ml-1" />
                    </a>
                </div>
                <button onClick={() => router.back()} className="text-white/60 hover:text-white text-sm flex items-center gap-1 transition-colors">
                    <X size={14} /> Exit
                </button>
            </header>

            <div className="max-w-5xl mx-auto px-4 py-8">

                {/* PAGE TITLE */}
                <div className="mb-8">
                    <h1 className="playfair text-3xl font-bold text-gray-900 mb-1">Publish Your Document</h1>
                    <p className="text-gray-500 text-sm">Reach thousands of students and earn 80% per sale. Takes less than 5 minutes.</p>
                </div>

                {/* STEP INDICATOR */}
                <div className="mb-10">
                    <div className="flex items-center gap-0">
                        {STEPS.map((s, i) => {
                            const Icon = s.icon;
                            const done = step > s.id;
                            const active = step === s.id;
                            return (
                                <div key={s.id} className="flex items-center flex-1">
                                    <div
                                        className={`flex items-center gap-2 cursor-pointer group ${done ? 'opacity-100' : active ? 'opacity-100' : 'opacity-50'}`}
                                        onClick={() => done && setStep(s.id)}
                                    >
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all flex-shrink-0
                                            ${done ? 'bg-green-500 text-white' : active ? 'bg-[#1a3a5c] text-white' : 'bg-gray-200 text-gray-500'}`}>
                                            {done ? <Check size={14} /> : <Icon size={14} />}
                                        </div>
                                        <span className={`text-xs font-semibold hidden sm:block whitespace-nowrap ${active ? 'text-[#1a3a5c]' : done ? 'text-green-600' : 'text-gray-400'}`}>
                                            {s.label}
                                        </span>
                                    </div>
                                    {i < STEPS.length - 1 && (
                                        <div className="flex-1 h-px mx-3 bg-gray-200 relative overflow-hidden">
                                            <div className={`step-line absolute inset-y-0 left-0 bg-green-500 ${done ? 'w-full' : 'w-0'}`} />
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* MAIN FORM */}
                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">

                            {/* STEP 1: Document Details */}
                            {step === 1 && (
                                <div>
                                    <div className="px-8 py-6 border-b border-gray-100 bg-gradient-to-r from-[#1a3a5c]/5 to-transparent">
                                        <h2 className="playfair text-xl font-bold text-gray-900">Document Details</h2>
                                        <p className="text-gray-500 text-sm mt-0.5">Basic information about what you're selling</p>
                                    </div>
                                    <div className="p-8 space-y-6">

                                        {/* Seller Info */}
                                        <div className="grid grid-cols-2 gap-4">
                                            <Field label="Your Name" required>
                                                <Input name="name" value={formData.name} onChange={handle} placeholder="Full name" />
                                            </Field>
                                            <Field label="Email">
                                                <Input value={formData.email} readOnly className="bg-gray-50 text-gray-500 cursor-not-allowed" />
                                            </Field>
                                        </div>

                                        <div className="h-px bg-gray-100" />

                                        {/* Document title & author */}
                                        <Field label="Title" required hint="Use the exact title as it appears on the document">
                                            <Input name="bookTitle" value={formData.bookTitle} onChange={handle} placeholder="e.g. Introduction to Organic Chemistry" />
                                        </Field>

                                        <Field label="Author / Creator" required>
                                            <Input name="author" value={formData.author} onChange={handle} placeholder="e.g. Dr. Adeyemi Okafor" />
                                        </Field>

                                        {/* Doc type — searchable */}
                                        <SearchableSelect
                                            label="Document Type"
                                            required
                                            value={formData.docType}
                                            onChange={v => set('docType', v)}
                                            placeholder="Select document type"
                                            grouped
                                        />

                                        {/* Category */}
                                        <SearchableSelect
                                            label="Subject Category"
                                            required
                                            value={formData.category}
                                            onChange={v => set('category', v)}
                                            placeholder="Select category"
                                            options={categories}
                                        />

                                        {/* Institutional */}
                                        <Field label="Target Institution" hint="Optional — helps students from specific schools find your material">
                                            <Select name="institutionalCategory" value={formData.institutionalCategory} onChange={handle}>
                                                {institutionalCategories.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                                            </Select>
                                        </Field>

                                        {/* University selector */}
                                        <div className="grid grid-cols-2 gap-4">
                                            <Field label="Country">
                                                <Select
                                                    name="universityCountry"
                                                    value={formData.universityCountry}
                                                    onChange={e => { set('universityCountry', e.target.value); set('university', ''); }}
                                                >
                                                    <option value="">— All Countries —</option>
                                                    {UNIVERSITY_COUNTRIES.map(c => (
                                                        <option key={c} value={c}>{c}</option>
                                                    ))}
                                                </Select>
                                            </Field>

                                            <Field label="University" hint="The school this material is for">
                                                <Select
                                                    name="university"
                                                    value={formData.university}
                                                    onChange={handle}
                                                    disabled={!formData.universityCountry}
                                                >
                                                    <option value="">— Select University —</option>
                                                    {(formData.universityCountry
                                                        ? (UNIVERSITIES_BY_COUNTRY[formData.universityCountry] || [])
                                                        : []
                                                    ).map(u => (
                                                        <option key={u.name} value={u.name}>{u.name}</option>
                                                    ))}
                                                </Select>
                                            </Field>
                                        </div>
                                        {/* ISBN */}
                                        <Field label="ISBN" hint="Leave blank for lecture notes, past questions, or student-authored materials">
                                            <Input name="isbn" value={formData.isbn} onChange={handle} placeholder="978-1234567890" />
                                        </Field>

                                    </div>
                                </div>
                            )}

                            {/* STEP 2: Academic Info */}
                            {step === 2 && (
                                <div>
                                    <div className="px-8 py-6 border-b border-gray-100 bg-gradient-to-r from-indigo-50 to-transparent">
                                        <h2 className="playfair text-xl font-bold text-gray-900">Academic Information</h2>
                                        <p className="text-gray-500 text-sm mt-0.5">Help students find your material faster — all optional</p>
                                    </div>
                                    <div className="p-8 space-y-6">

                                        <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                                            <Info size={16} className="text-amber-600 mt-0.5 flex-shrink-0" />
                                            <p className="text-sm text-amber-800">Filling in academic details boosts discoverability by up to 3× for course-specific materials.</p>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <Field label="Level">
                                                <Select name="level" value={formData.level} onChange={handle}>
                                                    {levels.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
                                                </Select>
                                            </Field>
                                            <Field label="Semester">
                                                <Select name="semester" value={formData.semester} onChange={handle}>
                                                    <option value="">— Select —</option>
                                                    {semesters.map(s => <option key={s} value={s}>{s}</option>)}
                                                </Select>
                                            </Field>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <Field label="Course Code" hint="e.g. CSC 201, LAW 301">
                                                <Input name="courseCode" value={formData.courseCode} onChange={handle} placeholder="e.g. BIO 101" />
                                            </Field>
                                            <Field label="Academic Session" hint="e.g. 2024/2025">
                                                <Input name="session" value={formData.session} onChange={handle} placeholder="2024/2025" />
                                            </Field>
                                        </div>

                                        <div className="h-px bg-gray-100" />

                                        <Field label="Description" required hint="Give buyers a clear idea of what's inside (2–5 sentences)">
                                            <Textarea name="description" value={formData.description} onChange={handle}
                                                placeholder="Briefly describe the content, target readers, and what makes this material valuable…"
                                                rows={4} />
                                        </Field>

                                        <Field label="Table of Contents / Key Topics" hint="Summarise the main topics or chapters covered">
                                            <Textarea name="message" value={formData.message} onChange={handle}
                                                placeholder="Chapter 1: Introduction…&#10;Chapter 2: …"
                                                rows={4} />
                                        </Field>

                                    </div>
                                </div>
                            )}

                            {/* STEP 3: Pricing & Format */}
                            {step === 3 && (
                                <div>
                                    <div className="px-8 py-6 border-b border-gray-100 bg-gradient-to-r from-green-50 to-transparent">
                                        <h2 className="playfair text-xl font-bold text-gray-900">Pricing & Format</h2>
                                        <p className="text-gray-500 text-sm mt-0.5">Set your price — you keep 80% of every sale</p>
                                    </div>
                                    <div className="p-8 space-y-6">

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <Field label="Price (₦)" required>
                                                    <div className="relative">
                                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">₦</span>
                                                        <Input type="number" name="price" value={formData.price} onChange={handle}
                                                            placeholder="0" className="pl-9" />
                                                    </div>
                                                </Field>
                                                {formData.price && (
                                                    <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                                                        <p className="text-xs text-green-700 font-medium">Your earnings per sale</p>
                                                        <p className="text-2xl font-bold text-green-700 playfair">₦{earnings}</p>
                                                        <p className="text-xs text-green-600">Platform keeps ₦{formData.price ? (Number(formData.price) * 0.2).toLocaleString() : '0'} (20%)</p>
                                                    </div>
                                                )}
                                            </div>

                                            <Field label="Number of Pages" required>
                                                <Input type="number" name="pages" value={formData.pages} onChange={handle} placeholder="e.g. 224" />
                                            </Field>
                                        </div>

                                        <Field label="File Format">
                                            <div className="grid grid-cols-3 gap-3">
                                                {['PDF', 'EPUB', 'MOBI'].map(f => (
                                                    <button
                                                        key={f}
                                                        type="button"
                                                        onClick={() => set('format', f)}
                                                        className={`py-3 rounded-lg border-2 text-sm font-semibold transition-all ${formData.format === f
                                                                ? 'border-[#1a3a5c] bg-[#1a3a5c] text-white'
                                                                : 'border-gray-200 text-gray-600 hover:border-gray-400'
                                                            }`}
                                                    >
                                                        {f}
                                                    </button>
                                                ))}
                                            </div>
                                        </Field>

                                        {/* Pricing tips */}
                                        <div className="border border-gray-100 rounded-xl p-5 space-y-3">
                                            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">💡 Pricing Tips</p>
                                            {[
                                                ['Past Questions / Notes', '₦500 – ₦1,500'],
                                                ['Lecture Notes / Summaries', '₦1,000 – ₦3,000'],
                                                ['Textbooks / Full Projects', '₦2,500 – ₦8,000'],
                                                ['Premium Thesis / Dissertation', '₦5,000 – ₦15,000'],
                                            ].map(([t, r]) => (
                                                <div key={t} className="flex items-center justify-between text-sm">
                                                    <span className="text-gray-600">{t}</span>
                                                    <span className="font-semibold text-gray-900">{r}</span>
                                                </div>
                                            ))}
                                        </div>

                                    </div>
                                </div>
                            )}

                            {/* STEP 4: Upload Files */}
                            {step === 4 && (
                                <div>
                                    <div className="px-8 py-6 border-b border-gray-100 bg-gradient-to-r from-purple-50 to-transparent">
                                        <h2 className="playfair text-xl font-bold text-gray-900">Upload Files</h2>
                                        <p className="text-gray-500 text-sm mt-0.5">Your PDF and an optional cover image</p>
                                    </div>
                                    <div className="p-8 space-y-8">

                                        {/* PDF Upload */}
                                        <div>
                                            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">PDF Document <span className="text-orange-500">*</span></p>

                                            {/* Option A: Direct */}
                                            <label className={`upload-zone block border-2 border-dashed rounded-xl p-8 text-center cursor-pointer ${selectedFile ? 'active' : 'border-gray-200'}`}>
                                                <input type="file" accept="application/pdf" onChange={handleFileSelect}
                                                    className="hidden" disabled={uploadingFile || loading} />
                                                {selectedFile ? (
                                                    <div>
                                                        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                                            <Check size={22} className="text-green-600" />
                                                        </div>
                                                        <p className="font-semibold text-green-700 text-sm">{selectedFile.name}</p>
                                                        <p className="text-xs text-green-600 mt-1">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB • PDF</p>
                                                        <button type="button" onClick={e => { e.preventDefault(); setSelectedFile(null); }}
                                                            className="mt-3 text-xs text-red-500 underline">Remove</button>
                                                    </div>
                                                ) : (
                                                    <div>
                                                        <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                                            <Upload size={20} className="text-gray-500" />
                                                        </div>
                                                        <p className="font-semibold text-gray-700 text-sm">Click to upload PDF</p>
                                                        <p className="text-xs text-gray-400 mt-1">Maximum file size: 50MB</p>
                                                    </div>
                                                )}
                                            </label>

                                            {/* Progress */}
                                            {uploadPercentage > 0 && uploadPercentage < 100 && (
                                                <div className="mt-3">
                                                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                                                        <span>Uploading…</span><span>{uploadPercentage}%</span>
                                                    </div>
                                                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                                        <div className="h-full bg-[#1a3a5c] rounded-full transition-all" style={{ width: `${uploadPercentage}%` }} />
                                                    </div>
                                                </div>
                                            )}

                                            {/* OR divider */}
                                            <div className="flex items-center gap-3 my-5">
                                                <div className="flex-1 h-px bg-gray-200" />
                                                <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">or paste a link</span>
                                                <div className="flex-1 h-px bg-gray-200" />
                                            </div>

                                            {/* Option B: Link */}
                                            <div className="relative">
                                                <Input
                                                    name="driveLink" type="url"
                                                    placeholder="https://drive.google.com/file/d/…"
                                                    value={formData.driveLink}
                                                    onChange={handleDriveLinkChange}
                                                    disabled={!!selectedFile || uploadingFile || loading}
                                                    className={selectedFile ? 'bg-gray-50 text-gray-400 cursor-not-allowed' : ''}
                                                />
                                                {isValidatingLink && (
                                                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                                        <div className="w-4 h-4 border-2 border-[#1a3a5c] border-t-transparent rounded-full animate-spin" />
                                                    </div>
                                                )}
                                            </div>
                                            {formData.driveLink && (
                                                <p className="text-xs text-amber-600 mt-1.5 flex items-center gap-1">
                                                    <AlertCircle size={11} /> Ensure sharing is set to "Anyone with the link can view"
                                                </p>
                                            )}
                                        </div>

                                        <div className="h-px bg-gray-100" />

                                        {/* Cover Image */}
                                        <div>
                                            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Cover Image</p>
                                            <p className="text-xs text-gray-400 mb-4">Optional — documents with covers sell 2× more. JPG/PNG/WEBP, max 5MB.</p>

                                            <div className="grid grid-cols-2 gap-5">
                                                <label className={`upload-zone block border-2 border-dashed rounded-xl p-6 text-center cursor-pointer ${selectedCoverImage ? 'active' : 'border-gray-200'}`}>
                                                    <input type="file" accept="image/jpeg,image/jpg,image/png,image/webp"
                                                        onChange={handleCoverImageSelect} className="hidden" disabled={loading || uploadingFile} />
                                                    {selectedCoverImage ? (
                                                        <div>
                                                            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                                                                <Check size={18} className="text-green-600" />
                                                            </div>
                                                            <p className="text-xs font-semibold text-green-700 truncate">{selectedCoverImage.name}</p>
                                                            <p className="text-xs text-green-600 mt-0.5">{(selectedCoverImage.size / 1024 / 1024).toFixed(2)} MB</p>
                                                            <button type="button" onClick={e => { e.preventDefault(); setSelectedCoverImage(null); set('coverImagePreview', null); }}
                                                                className="mt-2 text-xs text-red-500 underline">Remove</button>
                                                        </div>
                                                    ) : (
                                                        <div>
                                                            <ImageIcon size={28} className="mx-auto mb-2 text-gray-400" />
                                                            <p className="text-xs font-semibold text-gray-600">Upload Cover</p>
                                                        </div>
                                                    )}
                                                </label>

                                                <div className="border-2 border-gray-100 rounded-xl overflow-hidden bg-gray-50 flex items-center justify-center aspect-[3/4] max-h-48">
                                                    {formData.coverImagePreview ? (
                                                        <img src={formData.coverImagePreview} alt="Cover" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="text-center text-gray-300 p-4">
                                                            <ImageIcon size={32} className="mx-auto mb-2" />
                                                            <p className="text-xs">Preview</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                    </div>
                                </div>
                            )}

                            {/* STEP 5: Review */}
                            {step === 5 && (
                                <div>
                                    <div className="px-8 py-6 border-b border-gray-100 bg-gradient-to-r from-green-50 to-transparent">
                                        <h2 className="playfair text-xl font-bold text-gray-900">Review & Submit</h2>
                                        <p className="text-gray-500 text-sm mt-0.5">Confirm everything looks right before publishing</p>
                                    </div>
                                    <div className="p-8 space-y-6">

                                        {/* Summary card */}
                                        <div className="flex gap-5 p-5 bg-gray-50 rounded-xl border border-gray-100">
                                            {formData.coverImagePreview ? (
                                                <img src={formData.coverImagePreview} alt="" className="w-20 h-28 object-cover rounded-lg shadow-md flex-shrink-0" />
                                            ) : (
                                                <div className="w-20 h-28 bg-[#1a3a5c]/10 rounded-lg flex items-center justify-center flex-shrink-0">
                                                    <BookOpen size={24} className="text-[#1a3a5c]/40" />
                                                </div>
                                            )}
                                            <div className="flex-1 min-w-0">
                                                <p className="font-bold text-gray-900 text-base leading-tight playfair">{formData.bookTitle || '—'}</p>
                                                <p className="text-gray-500 text-sm mt-1">by {formData.author || '—'}</p>
                                                <div className="flex flex-wrap gap-2 mt-2">
                                                    {formData.docType && <span className="text-xs px-2 py-0.5 bg-[#1a3a5c]/10 text-[#1a3a5c] rounded-full font-medium">{formData.docType}</span>}
                                                    {formData.category && <span className="text-xs px-2 py-0.5 bg-gray-200 text-gray-700 rounded-full">{formData.category}</span>}
                                                    {formData.format && <span className="text-xs px-2 py-0.5 bg-gray-200 text-gray-700 rounded-full">{formData.format}</span>}
                                                </div>
                                                <p className="text-2xl font-bold text-gray-900 playfair mt-2">₦{formData.price ? Number(formData.price).toLocaleString() : '—'}</p>
                                            </div>
                                        </div>

                                        {/* Detail grid */}
                                        {[
                                            ['Level', levels.find(l => l.value === formData.level)?.label],
                                            ['Pages', formData.pages ? `${formData.pages} pages` : null],
                                            ['Course Code', formData.courseCode?.toUpperCase() || null],
                                            ['Semester', formData.semester || null],
                                            ['Session', formData.session || null],
                                            ['Institution', institutionalCategories.find(c => c.value === formData.institutionalCategory)?.label || null],
                                            ['File', selectedFile ? selectedFile.name : formData.driveLink ? 'Drive link provided' : null],
                                            ['Cover Image', selectedCoverImage ? selectedCoverImage.name : 'None (auto-generated)'],
                                            ['Your Earnings', formData.price ? `₦${earnings} per sale (80%)` : null],
                                        ].filter(([, v]) => v).map(([k, v]) => (
                                            <div key={k} className="flex justify-between items-start py-2 border-b border-gray-50 text-sm">
                                                <span className="text-gray-500 font-medium">{k}</span>
                                                <span className="text-gray-900 text-right max-w-xs">{v}</span>
                                            </div>
                                        ))}

                                        {/* TCs */}
                                        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 space-y-1">
                                            <p className="font-bold">By submitting you confirm:</p>
                                            <p>• You own or have rights to distribute this material</p>
                                            <p>• The content is accurate and suitable for the claimed level</p>
                                            <p>• You accept our seller agreement (80/20 revenue split)</p>
                                        </div>

                                        {uploadProgress && (
                                            <div className="text-center text-sm font-medium text-[#1a3a5c] animate-pulse">{uploadProgress}</div>
                                        )}

                                    </div>
                                </div>
                            )}

                            {/* NAV BUTTONS */}
                            <div className="px-8 pb-8 flex gap-3">
                                {step > 1 && (
                                    <button
                                        type="button"
                                        onClick={() => setStep(s => s - 1)}
                                        disabled={loading}
                                        className="flex-1 py-3 border-2 border-gray-200 text-gray-700 rounded-xl font-semibold text-sm hover:border-gray-400 transition-colors disabled:opacity-40"
                                    >
                                        ← Back
                                    </button>
                                )}
                                {step < 5 ? (
                                    <button
                                        type="button"
                                        onClick={() => { if (canProceed()) setStep(s => s + 1); else alert('Please fill all required fields before continuing.'); }}
                                        className="flex-1 py-3 bg-[#1a3a5c] text-white rounded-xl font-semibold text-sm hover:bg-[#0f2440] transition-colors flex items-center justify-center gap-2"
                                    >
                                        Continue <ChevronRight size={16} />
                                    </button>
                                ) : (
                                    (() => {
                                    const FACULTY_TITLES = ["Dr.", "Prof.", "Engr.", "Pharm.", "Barr.", "Lecturer"];
                                    const isFaculty = FACULTY_TITLES.some(t =>
                                        userData?.lecturerTitle?.includes(t) ||
                                        userData?.title?.includes(t) ||
                                        userData?.role === 'lecturer' ||
                                        userData?.isLecturer === true
                                    );
                                    const isPending = userData?.lecturerVerificationStatus === 'pending';

                                    if (isFaculty && isPending) return (
                                        <div style={{
                                            flex: 1, padding: '12px 16px',
                                            background: 'rgba(245,158,11,0.08)',
                                            border: '1px solid rgba(245,158,11,0.3)',
                                            borderRadius: '12px',
                                            display: 'flex', alignItems: 'flex-start', gap: '10px',
                                        }}>
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 1 }}><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                                            <div>
                                                <p style={{ fontSize: '13px', fontWeight: 700, color: '#92400e', margin: '0 0 3px' }}>
                                                    Publishing locked
                                                </p>
                                                <p style={{ fontSize: '12px', color: '#b45309', margin: 0, lineHeight: 1.6 }}>
                                                    Your faculty credentials are under review. Publishing will be unlocked once verified by the Abuja Registry (24–48 hrs).
                                                </p>
                                            </div>
                                        </div>
                                    );

                                    return (
                                        <button
                                            type="button"
                                            onClick={handleSubmit}
                                            disabled={loading}
                                            className="flex-1 py-3 bg-green-600 text-white rounded-xl font-semibold text-sm hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                                        >
                                            {loading ? (
                                                <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Submitting…</>
                                            ) : (
                                                <><Check size={16} /> Submit for Review</>
                                            )}
                                        </button>
                                    );
                                    })()
                                )}
                                
                            </div>
                        </div>
                    </div>

                    {/* SIDEBAR */}
                    <div className="space-y-5">

                        {/* Earnings card */}
                        <div className="bg-[#1a3a5c] rounded-2xl p-6 text-white">
                            <p className="text-xs font-bold uppercase tracking-wider text-white/60 mb-1">Your Potential Earnings</p>
                            <p className="playfair text-4xl font-bold">₦{earnings}</p>
                            <p className="text-white/60 text-xs mt-1">per sale at ₦{formData.price ? Number(formData.price).toLocaleString() : '0'}</p>
                            <div className="mt-4 pt-4 border-t border-white/20 space-y-2 text-xs">
                                <div className="flex justify-between"><span className="text-white/60">Your share</span><span className="font-semibold">80%</span></div>
                                <div className="flex justify-between"><span className="text-white/60">Platform</span><span>20%</span></div>
                            </div>
                        </div>

                        {/* What happens next */}
                        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                            <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-4">What Happens Next</p>
                            <div className="space-y-3">
                                {[
                                    { n: '1', t: 'Submit', d: 'We receive your document for review' },
                                    { n: '2', t: 'Review', d: 'Quality check within 24–48 hours' },
                                    { n: '3', t: 'Live', d: 'Listed in the library for students' },
                                    { n: '4', t: 'Earn', d: 'Get paid for every purchase' },
                                ].map(s => (
                                    <div key={s.n} className="flex items-start gap-3">
                                        <div className="w-6 h-6 rounded-full bg-[#1a3a5c]/10 text-[#1a3a5c] text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{s.n}</div>
                                        <div>
                                            <p className="text-sm font-semibold text-gray-900">{s.t}</p>
                                            <p className="text-xs text-gray-400">{s.d}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Tips */}
                        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                            <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-4">Tips for Faster Approval</p>
                            <ul className="space-y-2 text-xs text-gray-600">
                                {[
                                    'Upload a clear, readable PDF (not scanned blurry images)',
                                    'Add a cover image — it increases sales significantly',
                                    'Write a detailed description for better search ranking',
                                    'Set a fair price — compare similar documents',
                                    'Ensure Drive link sharing is set to "Anyone with link"',
                                ].map((t, i) => (
                                    <li key={i} className="flex items-start gap-2">
                                        <Check size={12} className="text-green-500 mt-0.5 flex-shrink-0" />
                                        {t}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Progress bar mobile */}
                        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                            <div className="flex justify-between items-center mb-2">
                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Progress</p>
                                <p className="text-xs font-bold text-[#1a3a5c]">{step} of {STEPS.length}</p>
                            </div>
                            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                <div className="h-full bg-[#1a3a5c] rounded-full transition-all duration-500" style={{ width: `${(step / STEPS.length) * 100}%` }} />
                            </div>
                            <p className="text-xs text-gray-400 mt-2">{STEPS[step - 1].label}</p>
                        </div>

                    </div>
                </div>
            </div>

            {/* Access Warning Modal */}
            {showAccessWarning && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl max-w-lg w-full p-7 shadow-2xl">
                        <div className="flex items-start gap-4 mb-5">
                            <div className="w-11 h-11 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
                                <AlertCircle size={20} className="text-amber-600" />
                            </div>
                            <div>
                                <h3 className="playfair text-lg font-bold text-gray-900">Check Your Drive Permissions</h3>
                                <p className="text-sm text-gray-500 mt-1">Your link may not be publicly accessible. Buyers will see "Access Denied".</p>
                            </div>
                            <button onClick={() => setShowAccessWarning(false)} className="text-gray-300 hover:text-gray-600 ml-auto">
                                <X size={18} />
                            </button>
                        </div>
                        <div className="bg-blue-50 rounded-xl p-4 mb-4 text-sm text-blue-900 space-y-2">
                            {['Open Google Drive', 'Right-click your PDF → Share', 'Set to "Anyone with the link"', 'Set permission to "Viewer"', 'Copy the new link and paste it here'].map((s, i) => (
                                <div key={i} className="flex gap-3 items-start">
                                    <span className="w-5 h-5 bg-blue-600 text-white rounded-full text-xs flex items-center justify-center font-bold flex-shrink-0">{i + 1}</span>
                                    <span>{s}</span>
                                </div>
                            ))}
                        </div>
                        <div className="flex gap-3">
                            <button onClick={() => setShowAccessWarning(false)}
                                className="flex-1 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-50">
                                I'll Fix It Later
                            </button>
                            <button onClick={() => { setShowAccessWarning(false); window.open('https://drive.google.com', '_blank'); }}
                                className="flex-1 py-2.5 bg-[#1a3a5c] text-white rounded-xl text-sm font-semibold hover:bg-[#0f2440]">
                                Open Google Drive →
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}