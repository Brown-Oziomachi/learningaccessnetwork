"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth, db, storage } from "@/lib/firebaseConfig";
import { addDoc, collection, serverTimestamp, doc, getDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { Upload, X, AlertCircle, Building2, BookOpen, GraduationCap } from "lucide-react";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";

export default function AdvertiseClient() {
    const router = useRouter();

    const [checkingAuth, setCheckingAuth] = useState(true);
    const [user, setUser] = useState(null);
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState("");
    const [showAccessWarning, setShowAccessWarning] = useState(false);
    const [isValidatingLink, setIsValidatingLink] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [selectedCoverImage, setSelectedCoverImage] = useState(null);
    const [uploadingFile, setUploadingFile] = useState(false);
    const [uploadPercentage, setUploadPercentage] = useState(0);
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        bookTitle: "",
        author: "",
        category: "",
        institutionalCategory: "",
        isbn: "",
        courseCode: "",
        semester: "",
        session: "",
        docType: "Textbook",
        price: "",
        format: "PDF",
        pages: "",
        description: "",
        message: "",
        driveLink: "",
    });

    const categories = [
        'Education', 'Law', 'Medicine', 'Engineering', 'Personal Development',
        'Business', 'Technology', 'Science', 'Literature', 'Health & Fitness',
        'History', 'Arts & Culture', 'Relationship', 'Self-Help', 'Finance',
        'Marketing', 'Programming', 'Psychology', 'Fiction', 'Non-Fiction',
        'Philosophy', 'Travel', 'Cooking', 'Religion & Spirituality',
        'Sex Education', 'Social Media'
    ];

    const docTypes = [
        'Textbook', 'Lecture Note', 'Past Question', 'Thesis',
        'Summary', 'Syllabus', 'Course Outline', 'Assignment', 'Project'
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

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (!currentUser) {
                setCheckingAuth(false);
                router.replace("/auth/signin?redirect=/advertise");
            } else {
                setUser(currentUser);
                try {
                    const userDocRef = doc(db, 'users', currentUser.uid);
                    const userDoc = await getDoc(userDocRef);
                    let displayName = currentUser.displayName || "";
                    let fullUserData = null;

                    if (userDoc.exists()) {
                        fullUserData = userDoc.data();
                        displayName = fullUserData.displayName || fullUserData.name || displayName;
                    }

                    setUserData(fullUserData);
                    setFormData((prev) => ({
                        ...prev,
                        name: displayName,
                        email: currentUser.email || "",
                    }));
                } catch (error) {
                    console.error("Error fetching user data:", error);
                    setFormData((prev) => ({
                        ...prev,
                        name: currentUser.displayName || "",
                        email: currentUser.email || "",
                    }));
                }
                setCheckingAuth(false);
            }
        });

        return () => unsubscribe();
    }, [router]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const extractDriveFileId = (url) => {
        if (!url) return '';
        const match = url.match(/\/d\/([\w-]{25,})|\/file\/d\/([\w-]{25,})|id=([\w-]{25,})/);
        if (match) {
            return match[1] || match[2] || match[3];
        }
        return '';
    };

    const handleDriveLinkChange = (e) => {
        const { value } = e.target;
        setFormData({ ...formData, driveLink: value });

        if (value.includes('drive.google.com')) {
            setIsValidatingLink(true);
            const hasViewParam = value.includes('/view') || value.includes('usp=sharing');
            const driveFileId = extractDriveFileId(value);

            if (driveFileId && !hasViewParam) {
                setShowAccessWarning(true);
            }
            setIsValidatingLink(false);
        }
    };

    const handleFileUpload = async (file) => {
    if (!file) return null;

    // Validate file type
    if (file.type !== 'application/pdf') {
        alert('Please upload a PDF file only');
        return null;
    }

    // Validate file size (max 50MB)
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
        alert('File size must be less than 50MB');
        return null;
    }

    try {
        setUploadingFile(true);
        setUploadProgress("Uploading PDF...");

        // Create unique filename
        const timestamp = Date.now();
        const fileName = `books/${user.uid}/${timestamp}_${file.name}`;
        const storageRef = ref(storage, fileName);

        // Upload file with progress tracking
        const uploadTask = uploadBytesResumable(storageRef, file);

        return new Promise((resolve, reject) => {
            uploadTask.on(
                'state_changed',
                (snapshot) => {
                    const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                    setUploadPercentage(Math.round(progress));
                    setUploadProgress(`Uploading: ${Math.round(progress)}%`);
                },
                (error) => {
                    console.error('Upload error:', error);
                    setUploadingFile(false);
                    reject(error);
                },
                async () => {
                    const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                    setUploadingFile(false);
                    setUploadProgress("");
                    resolve(downloadURL);
                }
            );
        });
    } catch (error) {
        console.error('Error uploading file:', error);
        setUploadingFile(false);
        setUploadProgress("");
        alert('Failed to upload file. Please try again.');
        return null;
    }
};

const handleCoverImageUpload = async (file) => {
    if (!file) return null;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
        alert('Please upload JPG, PNG, or WEBP image only');
        return null;
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
        alert('Image size must be less than 5MB');
        return null;
    }

    try {
        setUploadProgress("Uploading cover image...");

        // Create unique filename
        const timestamp = Date.now();
        const fileName = `covers/${user.uid}/${timestamp}_${file.name}`;
        const storageRef = ref(storage, fileName);

        // Upload file
        const uploadTask = uploadBytesResumable(storageRef, file);

        return new Promise((resolve, reject) => {
            uploadTask.on(
                'state_changed',
                (snapshot) => {
                    const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                    setUploadProgress(`Uploading cover: ${Math.round(progress)}%`);
                },
                (error) => {
                    console.error('Cover upload error:', error);
                    reject(error);
                },
                async () => {
                    const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                    setUploadProgress("");
                    resolve(downloadURL);
                }
            );
        });
    } catch (error) {
        console.error('Error uploading cover image:', error);
        setUploadProgress("");
        alert('Failed to upload cover image. Please try again.');
        return null;
    }
};

const handleCoverImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
        setSelectedCoverImage(file);
        // Create preview URL
        const previewUrl = URL.createObjectURL(file);
        setFormData({ ...formData, coverImagePreview: previewUrl });
    }
};

const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
        setSelectedFile(file);
        // Clear drive link when file is selected
        setFormData({ ...formData, driveLink: "" });
    }
};


   const handleSubmit = async () => {
    // Validate required fields
    if (!formData.name || !formData.email || !formData.bookTitle ||
        !formData.author || !formData.category || !formData.price ||
        !formData.pages || !formData.description) {
        alert("Please fill all required fields");
        return;
    }

    // Check if either file is uploaded OR drive link is provided
    if (!selectedFile && !formData.driveLink) {
        alert("Please either upload a PDF file or provide a Google Drive link");
        return;
    }

     try {
        setLoading(true);

        // Upload PDF file if selected
        let pdfUrl = formData.driveLink;
        if (selectedFile) {
            pdfUrl = await handleFileUpload(selectedFile);
            if (!pdfUrl) {
                setLoading(false);
                return;
            }
        }

        // ✅ Upload cover image if selected
        let coverImageUrl = null;
        if (selectedCoverImage) {
            coverImageUrl = await handleCoverImageUpload(selectedCoverImage);
            if (!coverImageUrl) {
                // Continue even if cover upload fails - it's optional
                console.warn('Cover image upload failed, continuing without it');
            }
        }

        // Validate URL if using Drive link
        if (!selectedFile && formData.driveLink) {
            try {
                new URL(formData.driveLink);
            } catch {
                alert("Please enter a valid Google Drive link");
                setLoading(false);
                return;
            }
        }

        setUploadProgress("Processing your submission...");

        const driveFileId = extractDriveFileId(pdfUrl);
        let embedUrl = pdfUrl;
        if (pdfUrl.includes('drive.google.com') && driveFileId) {
            embedUrl = `https://drive.google.com/file/d/${driveFileId}/preview`;
        }

        const displayName = userData?.displayName ||
            userData?.name ||
            formData.name ||
            `${userData?.firstName || ''} ${userData?.surname || ''}`.trim();

        const bookData = {
            userId: user.uid,
            sellerId: user.uid,
            sellerEmail: user.email,
            sellerName: displayName,
            sellerPhone: userData?.phoneNumber || null,
            bookTitle: formData.bookTitle,
            coverImage: coverImageUrl,
            image: coverImageUrl, 
            author: formData.author,
            category: formData.category,
            institutionalCategory: formData.institutionalCategory || null,
            isbn: formData.isbn || "N/A",
            courseCode: formData.courseCode.toUpperCase() || null,
            semester: formData.semester || null,
            session: formData.session || null,
            docType: formData.docType,
            price: Number(formData.price),
            format: formData.format,
            pages: Number(formData.pages),
            description: formData.description,
            message: formData.message,
            pdfLink: pdfUrl,
            pdfUrl: pdfUrl,
            embedUrl: embedUrl,
            driveFileId: driveFileId || null,
            uploadMethod: selectedFile ? 'direct_upload' : 'drive_link', // Track upload method
            status: "pending",
            views: 0,
            purchases: 0,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        };

        setUploadProgress("Saving book details...");
        await addDoc(collection(db, "advertMyBook"), bookData);

        alert("Request sent successfully! We'll review your submission and contact you shortly.");

        // Reset form
        setFormData({
            name: formData.name,
            email: formData.email,
            bookTitle: "",
            author: "",
            category: "",
            institutionalCategory: "",
            isbn: "",
            courseCode: "",
            semester: "",
            session: "",
            docType: "Textbook",
            price: "",
            format: "PDF",
            pages: "",
            description: "",
            message: "",
            driveLink: "",
        });
        setSelectedFile(null);
        setUploadPercentage(0);
        setUploadProgress("");

        router.replace("/advertise/my-submissions");
    } catch (error) {
        console.error("Error:", error);
        alert(error.message || "Something went wrong. Please try again.");
    } finally {
        setLoading(false);
        setUploadProgress("");
        setUploadingFile(false);
    }
};

useEffect(() => {
    // Cleanup preview URL when component unmounts
    return () => {
        if (formData.coverImagePreview) {
            URL.revokeObjectURL(formData.coverImagePreview);
        }
    };
}, [formData.coverImagePreview]);

    if (checkingAuth) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="animate-spin h-12 w-12 border-b-2 border-blue-950 rounded-full mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <div
            className="min-h-screen flex items-center justify-center px-4 py-8 relative"
            style={{
                backgroundImage: 'url(https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=1920&q=80)',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat'
            }}
        >
            <div className="absolute inset-0 bg-black/60"></div>

            <div className="bg-white/95 backdrop-blur-sm rounded-2xl max-w-4xl w-full p-8 shadow-2xl relative z-10 my-8">
                <div className="text-center mb-6">
                    <h2 className="text-3xl font-bold text-blue-950 mb-2">
                        Advertise Your Book
                    </h2>
                    <p className="text-gray-600 text-sm">
                        Reach thousands of readers and earn 80% per sale
                    </p>
                </div>

                {/* Instructions Alert */}
                <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex gap-3">
                        <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                        <div className="text-sm text-blue-900">
                            <p className="font-semibold mb-1">How to submit your PDF:</p>
                            <ol className="list-decimal ml-4 space-y-1">
                                <li>Upload your PDF to <strong>Google Drive</strong> or <strong>Dropbox</strong></li>
                                <li>Set the file sharing to "Anyone with the link can view"</li>
                                <li>Copy the sharing link and paste it below</li>
                                <li>Fill in academic details if this is course material</li>
                            </ol>
                            <p className="mt-2 text-green-700 font-semibold">
                                💰 You'll earn 80% on every sale (Platform takes 20%)
                            </p>
                        </div>
                    </div>
                </div>

                <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-2">
                    {/* SECTION 1: SELLER INFO */}
                    <div>
                        <h3 className="flex items-center gap-2 text-lg font-semibold text-blue-950 mb-4 pb-2 border-b">
                            <BookOpen className="w-5 h-5" /> Seller Information
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Full Name *
                                </label>
                                <input
                                    name="name"
                                    placeholder="Enter your full name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    className="w-full text-blue-950 border border-gray-300 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-950"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Email Address *
                                </label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    className="w-full text-blue-950 border border-gray-300 px-4 py-3 rounded-lg bg-gray-50"
                                    readOnly
                                />
                            </div>
                        </div>
                    </div>

                    {/* SECTION 2: BOOK/DOCUMENT INFO */}
                    <div>
                        <h3 className="flex items-center gap-2 text-lg font-semibold text-blue-950 mb-4 pb-2 border-b">
                            <BookOpen className="w-5 h-5" /> Book/Document Information
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Book/Document Title *
                                </label>
                                <input
                                    name="bookTitle"
                                    placeholder="The title of your book or document"
                                    value={formData.bookTitle}
                                    onChange={handleChange}
                                    className="w-full text-blue-950 border border-gray-300 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-950"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Author Name *
                                </label>
                                <input
                                    name="author"
                                    placeholder="Author's name"
                                    value={formData.author}
                                    onChange={handleChange}
                                    className="w-full text-blue-950 border border-gray-300 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-950"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    ISBN (Optional)
                                </label>
                                <input
                                    name="isbn"
                                    placeholder="978-1234567890"
                                    value={formData.isbn}
                                    onChange={handleChange}
                                    className="w-full text-blue-950 border border-gray-300 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-950"
                                />
                                <p className="text-xs text-gray-500 mt-1">Leave blank if self-published or student notes</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Document Type *
                                </label>
                                <select
                                    name="docType"
                                    value={formData.docType}
                                    onChange={handleChange}
                                    className="w-full text-blue-950 border border-gray-300 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-950"
                                >
                                    {docTypes.map(type => (
                                        <option key={type} value={type}>{type}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* SECTION 3: ACADEMIC METADATA */}
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-xl border-2 border-blue-200">
                        <h3 className="flex items-center gap-2 text-lg font-semibold text-blue-900 mb-4">
                            <GraduationCap className="w-5 h-5" /> Academic Metadata (Recommended for Course Materials)
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-blue-900 mb-1">
                                    Course Code
                                </label>
                                <input
                                    name="courseCode"
                                    placeholder="e.g., LAW 101, CSC 201"
                                    value={formData.courseCode}
                                    onChange={handleChange}
                                    className="w-full text-blue-950 border border-blue-300 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-blue-900 mb-1">
                                    Semester
                                </label>
                                <select
                                    name="semester"
                                    value={formData.semester}
                                    onChange={handleChange}
                                    className="w-full text-blue-950 border border-blue-300 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                                >
                                    <option value="">Select semester</option>
                                    {semesters.map(sem => (
                                        <option key={sem} value={sem}>{sem}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-blue-900 mb-1">
                                    Academic Session
                                </label>
                                <input
                                    name="session"
                                    placeholder="e.g., 2024/2025"
                                    value={formData.session}
                                    onChange={handleChange}
                                    className="w-full text-blue-950 border border-blue-300 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                                />
                            </div>
                        </div>
                        <p className="text-xs text-blue-700 mt-3">
                            💡 Adding academic details helps students find your materials more easily!
                        </p>
                    </div>

                    {/* SECTION 4: CATEGORIES */}
                    <div>
                        <h3 className="flex items-center gap-2 text-lg font-semibold text-blue-950 mb-4 pb-2 border-b">
                            <Building2 className="w-5 h-5" /> Categories
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    General Category *
                                </label>
                                <select
                                    name="category"
                                    value={formData.category}
                                    onChange={handleChange}
                                    className="w-full text-blue-950 border border-gray-300 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-950"
                                >
                                    <option value="">Select a category</option>
                                    {categories.map((cat) => (
                                        <option key={cat} value={cat}>
                                            {cat}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                                    <Building2 className="w-4 h-4" />
                                    Institutional Category
                                </label>
                                <select
                                    name="institutionalCategory"
                                    value={formData.institutionalCategory}
                                    onChange={handleChange}
                                    className="w-full text-blue-950 border border-gray-300 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-950"
                                >
                                    {institutionalCategories.map((cat) => (
                                        <option key={cat.value} value={cat.value}>
                                            {cat.label}
                                        </option>
                                    ))}
                                </select>
                                <p className="text-xs text-gray-500 mt-1">
                                    Optional: Target specific institutions
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* SECTION 5: PRICING & FILE DETAILS */}
                    <div>
                        <h3 className="flex items-center gap-2 text-lg font-semibold text-blue-950 mb-4 pb-2 border-b">
                            💰 Pricing & File Details
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Price (₦) *
                                </label>
                                <input
                                    type="number"
                                    name="price"
                                    placeholder="e.g., 2400"
                                    value={formData.price}
                                    onChange={handleChange}
                                    className="w-full text-blue-950 border border-gray-300 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-950"
                                />
                                <p className="text-xs text-green-600 mt-1 font-semibold">
                                    You'll earn ₦{formData.price ? (Number(formData.price) * 0.8).toLocaleString() : '0'} per sale (80%)
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Number of Pages *
                                </label>
                                <input
                                    type="number"
                                    name="pages"
                                    placeholder="e.g., 224"
                                    value={formData.pages}
                                    onChange={handleChange}
                                    className="w-full text-blue-950 border border-gray-300 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-950"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Format *
                                </label>
                                <select
                                    name="format"
                                    value={formData.format}
                                    onChange={handleChange}
                                    className="w-full text-blue-950 border border-gray-300 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-950"
                                >
                                    <option value="PDF">PDF</option>
                                    <option value="EPUB">EPUB</option>
                                    <option value="MOBI">MOBI</option>
                                </select>
                            </div>

                            {formData.driveLink && extractDriveFileId(formData.driveLink) && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Extracted File ID
                                    </label>
                                    <input
                                        type="text"
                                        value={extractDriveFileId(formData.driveLink)}
                                        readOnly
                                        className="w-full text-blue-950 border border-gray-300 px-4 py-3 rounded-lg bg-gray-50 text-sm"
                                    />
                                    <p className="text-xs text-green-600 mt-1">
                                        ✓ File ID extracted for thumbnails
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* SECTION 6: FILE LINK */}
                  {/* SECTION 6: FILE UPLOAD OR LINK */}
<div className="bg-gradient-to-br from-purple-50 to-pink-50 p-6 rounded-xl border-2 border-purple-200">
    <h3 className="text-lg font-semibold text-purple-900 mb-4 flex items-center gap-2">
        <Upload className="w-5 h-5" />
        Upload Your PDF
    </h3>

    {/* File Upload Button */}
    <div className="mb-4">
        <label className="block text-sm font-medium text-purple-900 mb-2">
            Option 1: Upload PDF Directly (Recommended)
        </label>
        <div className="flex items-center gap-3">
            <label className="flex-1 cursor-pointer">
                <div className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                    selectedFile 
                        ? 'border-green-500 bg-green-50' 
                        : 'border-purple-300 bg-white hover:border-purple-500'
                }`}>
                    <input
                        type="file"
                        accept="application/pdf"
                        onChange={handleFileSelect}
                        className="hidden"
                        disabled={uploadingFile || loading}
                    />
                    <Upload className={`w-8 h-8 mx-auto mb-2 ${
                        selectedFile ? 'text-green-600' : 'text-purple-600'
                    }`} />
                    {selectedFile ? (
                        <>
                            <p className="font-semibold text-green-700">
                                ✓ {selectedFile.name}
                            </p>
                            <p className="text-sm text-green-600 mt-1">
                                {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                            </p>
                        </>
                    ) : (
                        <>
                            <p className="font-semibold text-purple-900">
                                Click to upload PDF
                            </p>
                            <p className="text-sm text-purple-700 mt-1">
                                Max size: 50MB
                            </p>
                        </>
                    )}
                </div>
            </label>
            {selectedFile && (
                <button
                    onClick={() => setSelectedFile(null)}
                    className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>
            )}
        </div>
        {uploadPercentage > 0 && uploadPercentage < 100 && (
            <div className="mt-3">
                <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                        className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${uploadPercentage}%` }}
                    ></div>
                </div>
                <p className="text-sm text-purple-700 mt-1 text-center">
                    {uploadPercentage}% uploaded
                </p>
            </div>
        )}
    </div>

{/* SECTION 6.5: COVER IMAGE UPLOAD */}
<div className="bg-gradient-to-br from-indigo-50 to-blue-50 p-6 rounded-xl border-2 border-indigo-200">
    <h3 className="text-lg font-semibold text-indigo-900 mb-4 flex items-center gap-2">
        <BookOpen className="w-5 h-5" />
        Book Cover Image (Optional)
    </h3>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Upload Section */}
        <div>
            <label className="block text-sm font-medium text-indigo-900 mb-2">
                Upload Cover Image
            </label>
            <label className="cursor-pointer">
                <div className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                    selectedCoverImage 
                        ? 'border-green-500 bg-green-50' 
                        : 'border-indigo-300 bg-white hover:border-indigo-500'
                }`}>
                    <input
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/webp"
                        onChange={handleCoverImageSelect}
                        className="hidden"
                        disabled={loading || uploadingFile}
                    />
                    <Upload className={`w-8 h-8 mx-auto mb-2 ${
                        selectedCoverImage ? 'text-green-600' : 'text-indigo-600'
                    }`} />
                    {selectedCoverImage ? (
                        <>
                            <p className="font-semibold text-green-700">
                                ✓ {selectedCoverImage.name}
                            </p>
                            <p className="text-sm text-green-600 mt-1">
                                {(selectedCoverImage.size / (1024 * 1024)).toFixed(2)} MB
                            </p>
                        </>
                    ) : (
                        <>
                            <p className="font-semibold text-indigo-900">
                                Click to upload cover
                            </p>
                            <p className="text-sm text-indigo-700 mt-1">
                                JPG, PNG, WEBP (Max 5MB)
                            </p>
                        </>
                    )}
                </div>
            </label>
            {selectedCoverImage && (
                <button
                    onClick={() => {
                        setSelectedCoverImage(null);
                        setFormData({ ...formData, coverImagePreview: null });
                    }}
                    className="mt-2 w-full px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors flex items-center justify-center gap-2"
                >
                    <X className="w-4 h-4" />
                    Remove Image
                </button>
            )}
        </div>

        {/* Preview Section */}
        <div>
            <label className="block text-sm font-medium text-indigo-900 mb-2">
                Preview
            </label>
            <div className="border-2 border-indigo-200 rounded-lg p-4 bg-white">
                {formData.coverImagePreview ? (
                    <img
                        src={formData.coverImagePreview}
                        alt="Cover preview"
                        className="w-full h-48 object-cover rounded-lg shadow-md"
                    />
                ) : (
                    <div className="w-full h-48 bg-gray-100 rounded-lg flex items-center justify-center">
                        <div className="text-center text-gray-400">
                            <BookOpen className="w-12 h-12 mx-auto mb-2" />
                            <p className="text-sm">No image selected</p>
                        </div>
                    </div>
                )}
            </div>
            <p className="text-xs text-indigo-700 mt-2">
                💡 A custom cover makes your book more attractive to buyers!
            </p>
        </div>
    </div>

    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mt-4">
        <p className="text-xs text-yellow-800">
            <strong>Note:</strong> If you don't upload a cover image, we'll automatically generate a thumbnail from your PDF.
        </p>
    </div>
</div>

    {/* Divider */}
    <div className="flex items-center gap-3 my-4">
        <div className="flex-1 border-t border-purple-300"></div>
        <span className="text-sm text-purple-700 font-medium">OR</span>
        <div className="flex-1 border-t border-purple-300"></div>
    </div>

    {/* Drive Link Option */}
    <div>
        <label className="block text-sm font-medium text-purple-900 mb-2">
            Option 2: Google Drive / Dropbox Link
        </label>
        <div className="relative">
            <input
                name="driveLink"
                type="url"
                placeholder="https://drive.google.com/file/d/..."
                value={formData.driveLink}
                onChange={handleDriveLinkChange}
                disabled={selectedFile || uploadingFile || loading}
                className={`w-full text-blue-950 border px-4 py-3 rounded-lg focus:outline-none focus:ring-2 ${
                    selectedFile 
                        ? 'bg-gray-100 border-gray-300 cursor-not-allowed' 
                        : 'border-purple-300 focus:ring-purple-500'
                }`}
            />
            {isValidatingLink && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <div className="animate-spin h-5 w-5 border-b-2 border-purple-600 rounded-full"></div>
                </div>
            )}
        </div>
        <p className="mt-1 text-xs text-purple-700">
            {selectedFile 
                ? '✓ File upload selected - Drive link disabled' 
                : '⚠️ Make sure the link is set to "Anyone with the link can view"'
            }
        </p>
    </div>
</div>

                    {/* SECTION 7: DESCRIPTIONS */}
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Book Description *
                            </label>
                            <textarea
                                name="description"
                                placeholder="Brief description of your book..."
                                rows={3}
                                value={formData.description}
                                onChange={handleChange}
                                className="w-full text-blue-950 border border-gray-300 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-950 resize-none"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Book Summarization *
                            </label>
                            <textarea
                                name="message"
                                placeholder="Tell us about your promotion plan..."
                                rows={3}
                                value={formData.message}
                                onChange={handleChange}
                                className="w-full text-blue-950 border border-gray-300 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-950 resize-none"
                            />
                        </div>
                    </div>
                </div>

                {uploadProgress && (
                    <div className="mt-4 text-center text-sm text-blue-950 font-medium">
                        {uploadProgress}
                    </div>
                )}

                <div className="flex gap-3 pt-6 mt-4 border-t border-gray-200">
                    <button
                        type="button"
                        onClick={() => router.back()}
                        disabled={loading}
                        className="flex-1 border-2 border-gray-300 text-gray-700 py-3 px-6 rounded-lg font-semibold hover:bg-gray-50 transition-colors disabled:opacity-50"
                    >
                        Cancel
                    </button>

                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="flex-1 bg-blue-950 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-900 transition-colors disabled:opacity-50"
                    >
                        {loading ? "Uploading..." : "Send Request"}
                    </button>
                </div>

                <p className="text-center text-xs text-gray-500 mt-4">
                    We typically respond within 24-48 hours • Thumbnails auto-generated from PDFs
                </p>
            </div>

            {showAccessWarning && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 animate-fadeIn">
                    <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl animate-slideIn max-h-[90vh] overflow-y-auto">
                        <div className="flex items-start gap-4 mb-4">
                            <div className="flex-shrink-0 w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                                <AlertCircle className="w-6 h-6 text-yellow-600" />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-xl font-bold text-gray-900 mb-2">⚠️ File Access Warning</h3>
                                <p className="text-gray-600">
                                    Your Google Drive link might not be publicly accessible. Buyers won't be able to view or download your PDF!
                                </p>
                            </div>
                            <button onClick={() => setShowAccessWarning(false)} className="text-gray-400 hover:text-gray-600">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                            <h4 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                                <AlertCircle className="w-5 h-5" />
                                          How to Fix This (Easy Steps):
                                      </h4>
                                      <ol className="space-y-2 text-sm text-blue-900">
                                          <li className="flex gap-3"><span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">1</span><span>Go to your file in <strong>Google Drive</strong></span></li>
                                          <li className="flex gap-3"><span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">2</span><span><strong>Right-click</strong> on the PDF file</span></li>
                                          <li className="flex gap-3"><span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">3</span><span>Click <strong>"Share"</strong> or <strong>"Get link"</strong></span></li>
                                          <li className="flex gap-3"><span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">4</span><span>Change to <strong className="text-green-700">"Anyone with the link"</strong></span></li>
                                          <li className="flex gap-3"><span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">5</span><span>Make sure it says <strong className="text-green-700">"Viewer"</strong> permission</span></li>
                                          <li className="flex gap-3"><span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">6</span><span><strong>Copy</strong> the new link and paste it here</span></li>
                                      </ol>
                                  </div>
          
                                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                                      <h4 className="font-semibold text-red-900 mb-2 flex items-center gap-2">
                                          <AlertCircle className="w-5 h-5" />
                                          If You Don't Fix This:
                                      </h4>
                                      <ul className="space-y-1 text-sm text-red-900">
                                          <li>❌ Buyers will see "Access Denied" error</li>
                                          <li>❌ No thumbnail will be generated</li>
                                          <li>❌ PDF preview won't work</li>
                                          <li>❌ Downloads will fail completely</li>
                                          <li>❌ You'll get refund requests and complaints</li>
                                      </ul>
                                  </div>
          
                                  <div className="flex gap-3">
                                      <button onClick={() => setShowAccessWarning(false)} className="flex-1 bg-gray-200 text-gray-700 py-3 px-4 rounded-lg font-semibold hover:bg-gray-300 transition-colors">
                                          I'll Fix It Later
                                      </button>
                                      <button onClick={() => { setShowAccessWarning(false); window.open('https://drive.google.com', '_blank'); }} className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2">
                                          <Upload className="w-5 h-5" />
                                          Open Google Drive
                                      </button>
                                  </div>
                              </div>
                          </div>
                      )}
          
                      <style jsx>{`
                          @keyframes fadeIn {
                              from { opacity: 0; }
                              to { opacity: 1; }
                          }
                          @keyframes slideIn {
                              from { opacity: 0; transform: scale(0.95) translateY(20px); }
                              to { opacity: 1; transform: scale(1) translateY(0); }
                          }
                          .animate-fadeIn { animation: fadeIn 0.2s ease-out; }
                          .animate-slideIn { animation: slideIn 0.3s ease-out; }
                      `}</style>

        </div>
        
    );
}