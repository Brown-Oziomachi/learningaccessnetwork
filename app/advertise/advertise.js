"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebaseConfig";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

export default function AdvertiseClient() {
    const router = useRouter();

    const [checkingAuth, setCheckingAuth] = useState(true);
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(false);
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

    const handleSubmit = async () => {
        if (!formData.name || !formData.email || !formData.bookTitle ||
            !formData.author || !formData.category || !formData.price ||
            !formData.pages || !formData.description || !formData.message) {
            alert("Please fill all required fields");
            return;
        }

        try {
            setLoading(true);

            await addDoc(collection(db, "advert my book"), {
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
                status: "pending",
                createdAt: serverTimestamp(),
            });

            alert("Request sent successfully! We'll contact you shortly.");

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

            router.replace("/advertise?success=1");
        } catch (error) {
            console.error("Error sending request:", error);
            alert("Something went wrong. Please try again.");
        } finally {
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
                                className="w-full border border-gray-300 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-950 focus:border-transparent"
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
                                className="w-full border border-gray-300 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-950 focus:border-transparent bg-gray-50"
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
                                className="w-full border border-gray-300 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-950 focus:border-transparent"
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
                                className="w-full border border-gray-300 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-950 focus:border-transparent"
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
                                className="w-full border border-gray-300 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-950 focus:border-transparent"
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
                                className="w-full border border-gray-300 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-950 focus:border-transparent"
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
                                className="w-full border border-gray-300 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-950 focus:border-transparent"
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
                                className="w-full border border-gray-300 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-950 focus:border-transparent"
                            />
                        </div>
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
                            className="w-full border border-gray-300 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-950 focus:border-transparent resize-none"
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
                            className="w-full border border-gray-300 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-950 focus:border-transparent resize-none"
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