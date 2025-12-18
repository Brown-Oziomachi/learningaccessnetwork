"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebaseConfig";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { Upload, X, FileText } from "lucide-react";

export default function AdvertiseClient() {
    const router = useRouter();

    const [checkingAuth, setCheckingAuth] = useState(true);
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(false);
    const [pdfFile, setPdfFile] = useState(null);
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        bookTitle: "",
        author: "",
        category: "",
        price: "",
        format: "PDF",
        pages: "",
        description: "",
        message: "",
    });

    const categories = [
        'education',
        'personal development',
        'business',
        'technology',
        'science',
        'literature',
        'health wellness',
        'history',
        'arts culture'
    ];

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            if (!currentUser) {
                setCheckingAuth(false);
                router.replace("/auth/signin?redirect=/advertise");
            } else {
                setUser(currentUser);
                setFormData((prev) => ({
                    ...prev,
                    email: currentUser.email || "",
                }));
                setCheckingAuth(false);
            }
        });

        return () => unsubscribe();
    }, [router]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            // Validate file type
            if (file.type !== 'application/pdf') {
                alert('Please upload a PDF file only');
                return;
            }
            // Validate file size (max 10MB for base64 storage)
            if (file.size > 10 * 1024 * 1024) {
                alert('File size must be less than 10MB');
                return;
            }
            setPdfFile(file);
        }
    };

    const removePdfFile = () => {
        setPdfFile(null);
    };

    const handleSubmit = async () => {
        if (!formData.name || !formData.email || !formData.bookTitle ||
            !formData.author || !formData.category || !formData.price ||
            !formData.pages || !formData.description || !formData.message) {
            alert("Please fill all required fields");
            return;
        }

        if (!pdfFile) {
            alert("Please upload your PDF book");
            return;
        }

        try {
            setLoading(true);
            console.log("Starting submission process...");

            // Convert PDF to base64
            const reader = new FileReader();
            reader.readAsDataURL(pdfFile);
            
            reader.onload = async () => {
                try {
                    const base64PDF = reader.result;
                    
                    console.log("Saving to Firestore...");
                    const docRef = await addDoc(collection(db, "advertMyBook"), {
                        userId: user.uid,
                        name: formData.name,
                        email: formData.email,
                        bookTitle: formData.bookTitle,
                        author: formData.author,
                        category: formData.category,
                        price: Number(formData.price),
                        format: formData.format,
                        pages: Number(formData.pages),
                        description: formData.description,
                        message: formData.message,
                        pdfData: base64PDF, // Store as base64
                        pdfFileName: pdfFile.name,
                        pdfSize: pdfFile.size,
                        status: "pending",
                        createdAt: serverTimestamp(),
                    });
                    console.log("Document saved with ID:", docRef.id);

                    alert("Request sent successfully! We'll contact you shortly.");

                    // Reset form
                    setFormData({
                        name: "",
                        email: user.email || "",
                        bookTitle: "",
                        author: "",
                        category: "",
                        price: "",
                        format: "PDF",
                        pages: "",
                        description: "",
                        message: "",
                    });
                    setPdfFile(null);

                    router.replace("/advertise?success=1");
                } catch (error) {
                    console.error("Detailed error:", error);
                    console.error("Error code:", error.code);
                    console.error("Error message:", error.message);
                    
                    let errorMessage = "Something went wrong. Please try again.";
                    
                    if (error.code === 'permission-denied') {
                        errorMessage = "Permission denied. Please check Firestore rules.";
                    } else if (error.message) {
                        errorMessage = error.message;
                    }
                    
                    alert(errorMessage);
                } finally {
                    setLoading(false);
                }
            };

            reader.onerror = () => {
                console.error("Error reading file");
                alert("Error reading file. Please try again.");
                setLoading(false);
            };

        } catch (error) {
            console.error("Error:", error);
            alert("Something went wrong. Please try again.");
            setLoading(false);
        }
    };

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

            <div className="bg-white/95 backdrop-blur-sm rounded-2xl max-w-2xl w-full p-8 shadow-2xl relative z-10 my-8">
                <div className="text-center mb-6">
                    <h2 className="text-3xl font-bold text-blue-950 mb-2">
                        Advertise Your Book
                    </h2>
                    <p className="text-gray-600 text-sm">
                        Reach thousands of readers on our platform
                    </p>
                </div>

                <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
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
                                className="w-full text-blue-950 border border-gray-300 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-950 focus:border-transparent"
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
                                placeholder="your.email@example.com"
                                className="w-full text-blue-950 border border-gray-300 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-950 focus:border-transparent bg-gray-50"
                                readOnly
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Book Title *
                            </label>
                            <input
                                name="bookTitle"
                                placeholder="The title of your book"
                                value={formData.bookTitle}
                                onChange={handleChange}
                                className="w-full text-blue-950 border border-gray-300 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-950 focus:border-transparent"
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
                                className="w-full border text-blue-950 border-gray-300 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-950 focus:border-transparent"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Category *
                            </label>
                            <select
                                name="category"
                                value={formData.category}
                                onChange={handleChange}
                                className="w-full text-blue-950 border border-gray-300 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-950 focus:border-transparent"
                            >
                                <option value="">Select a category</option>
                                {categories.map((cat) => (
                                    <option key={cat} value={cat}>
                                        {cat.charAt(0).toUpperCase() + cat.slice(1)}
                                    </option>
                                ))}
                            </select>
                        </div>

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
                                className="w-full text-blue-950 border border-gray-300 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-950 focus:border-transparent"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Format *
                            </label>
                            <select
                                name="format"
                                value={formData.format}
                                onChange={handleChange}
                                className="w-full text-blue-950 border border-gray-300 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-950 focus:border-transparent"
                            >
                                <option value="PDF">PDF</option>
                                <option value="EPUB">EPUB</option>
                                <option value="MOBI">MOBI</option>
                            </select>
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
                                className="w-full text-blue-950 border border-gray-300 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-950 focus:border-transparent"
                            />
                        </div>
                    </div>

                    {/* PDF Upload Section */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Upload PDF Book * (Max 10MB)
                        </label>
                        
                        {!pdfFile ? (
                            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
                                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                    <Upload className="w-10 h-10 mb-2 text-gray-400" />
                                    <p className="mb-2 text-sm text-gray-500">
                                        <span className="font-semibold">Click to upload</span> or drag and drop
                                    </p>
                                    <p className="text-xs text-gray-500">PDF only (Max 10MB)</p>
                                </div>
                                <input
                                    type="file"
                                    accept=".pdf"
                                    onChange={handleFileChange}
                                    className="hidden"
                                />
                            </label>
                        ) : (
                            <div className="border-2 border-green-300 bg-green-50 rounded-lg p-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <FileText className="w-8 h-8 text-green-600" />
                                        <div>
                                            <p className="text-sm font-medium text-gray-900">{pdfFile.name}</p>
                                            <p className="text-xs text-gray-500">
                                                {(pdfFile.size / (1024 * 1024)).toFixed(2)} MB
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={removePdfFile}
                                        disabled={loading}
                                        className="p-2 hover:bg-red-100 rounded-full transition-colors"
                                    >
                                        <X className="w-5 h-5 text-red-600" />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

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
                            className="w-full text-blue-950 border border-gray-300 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-950 focus:border-transparent resize-none"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Promotion Message *
                        </label>
                        <textarea
                            name="message"
                            placeholder="Tell us about your promotion plan and marketing goals..."
                            rows={3}
                            value={formData.message}
                            onChange={handleChange}
                            className="w-full text-blue-950 border border-gray-300 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-950 focus:border-transparent resize-none"
                        />
                    </div>
                </div>

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
                        className="flex-1 bg-blue-950 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? "Sending..." : "Send Request"}
                    </button>
                </div>

                <p className="text-center text-xs text-gray-500 mt-4">
                    We typically respond within 24-48 hours
                </p>
            </div>
        </div>
    );
}