// app/advertise/AdvertiseClient.jsx
// UPDATED: Uses ImgBB free image hosting (no Firebase Storage needed)

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebaseConfig";
import { addDoc, collection, serverTimestamp, doc, getDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { Upload, X, FileText, Image, AlertCircle } from "lucide-react";

export default function AdvertiseClient() {
    const router = useRouter();

    const [checkingAuth, setCheckingAuth] = useState(true);
    const [user, setUser] = useState(null);
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState("");
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
        driveLink: "",
    });

    const categories = [
        'Education',
        'Personal Development',
        'Business',
        'Technology',
        'Science',
        'Literature',
        'Health & Wellness',
        'History',
        'Arts & Culture',
        'Relationship',
        'Self-Help',
        'Finance',
        'Marketing',
        'Programming',
        'Psychology',
        'Fiction',
        'Non-Fiction',
        'Philosophy',
        'Travel',
        'Cooking',
        'Religion & Spirituality',
        'Sex education',
    ];

    // ImgBB API Key (Get free from https://api.imgbb.com/)
    // This is just an example - GET YOUR OWN FREE API KEY from imgbb.com
    const IMGBB_API_KEY = "b1dca0e473db0c33831f460354763f20"; // Replace with your actual key

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

   
    const handleSubmit = async () => {
        // Validation
        if (!formData.name || !formData.email || !formData.bookTitle ||
            !formData.author || !formData.category || !formData.price ||
            !formData.pages || !formData.description || !formData.message) {
            alert("Please fill all required fields");
            return;
        }

        if (!formData.driveLink) {
            alert("Please provide a Google Drive or Dropbox link to your PDF");
            return;
        }

        // Validate URL
        try {
            new URL(formData.driveLink);
        } catch {
            alert("Please enter a valid Google Drive or Dropbox link");
            return;
        }

      
        try {
            setLoading(true);
            // Upload image to ImgBB
          
            setUploadProgress("Saving book details...");

            // Prepare seller information
            const displayName = userData?.displayName ||
                userData?.name ||
                formData.name ||
                `${userData?.firstName || ''} ${userData?.surname || ''}`.trim();

            const bookData = {
                // User & seller info
                userId: user.uid,
                sellerId: user.uid,
                sellerEmail: user.email,
                sellerName: displayName,
                sellerPhone: userData?.phoneNumber || null,

                // Book info
                bookTitle: formData.bookTitle,
                author: formData.author,
                category: formData.category,
                price: Number(formData.price),
                format: formData.format,
                pages: Number(formData.pages),
                description: formData.description,
                message: formData.message,

                // Files - Only store the URL (not base64)
                pdfLink: formData.driveLink,

                // Metadata
                status: "pending",
                views: 0,
                purchases: 0,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            };

            console.log("Submitting book with seller info:", {
                sellerId: bookData.sellerId,
                sellerEmail: bookData.sellerEmail,
                sellerName: bookData.sellerName,
            });

            const docRef = await addDoc(collection(db, "advertMyBook"), bookData);

            console.log("Document saved with ID:", docRef.id);
            alert("Request sent successfully! We'll review your submission and contact you shortly.");

            // Reset form
            setFormData({
                name: formData.name,
                email: formData.email,
                bookTitle: "",
                author: "",
                category: "",
                price: "",
                format: "PDF",
                pages: "",
                description: "",
                message: "",
                driveLink: "",
            });
            setUploadProgress("");

            router.replace("/home");
        } catch (error) {
            console.error("Error:", error);
            let errorMessage = "Something went wrong. Please try again.";

            if (error.message.includes('ImgBB') || error.message.includes('Upload')) {
                errorMessage = "Failed to upload cover image. Please try again or use a smaller image.";
            } else if (error.code === 'permission-denied') {
                errorMessage = "Permission denied. Please check your authentication.";
            } else if (error.message) {
                errorMessage = error.message;
            }

            alert(errorMessage);
        } finally {
            setLoading(false);
            setUploadProgress("");
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
                            </ol>
                            <p className="mt-2 text-green-700 font-semibold">
                                💰 You'll earn 80% on every sale (Platform takes 20%)
                            </p>
                        </div>
                    </div>
                </div>

                <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
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
                            <p className="text-xs text-green-600 mt-1">
                                You'll earn ₦{formData.price ? (Number(formData.price) * 0.8).toLocaleString() : '0'} per sale
                            </p>
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
                                className="w-full text-blue-950 border border-gray-300 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-950"
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
                                className="w-full text-blue-950 border border-gray-300 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-950"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            PDF Link (Google Drive / Dropbox) *
                        </label>
                        <input
                            name="driveLink"
                            type="url"
                            placeholder="https://drive.google.com/file/d/..."
                            value={formData.driveLink}
                            onChange={handleChange}
                            className="w-full text-blue-950 border border-gray-300 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-950"
                        />
                        <p className="mt-1 text-xs text-gray-500">
                            Make sure the link is set to "Anyone with the link can view"
                        </p>
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
                            className="w-full text-blue-950 border border-gray-300 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-950 resize-none"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Promotion Message *
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
                    Images hosted on free ImgBB service • We typically respond within 24-48 hours
                </p>
            </div>
        </div>
    );
}