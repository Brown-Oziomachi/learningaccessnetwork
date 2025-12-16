"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "@/lib/firebaseConfig";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";

export default function AdvertiseClient() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const [checkingAuth, setCheckingAuth] = useState(true);
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        name: "",
        email: "",
        bookTitle: "",
        message: "",
    });

    // 🔐 AUTH GUARD WITH REDIRECT BACK
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            if (!currentUser) {
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

    // 🔄 FORM HANDLER
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    // 📩 SUBMIT TO FIREBASE
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.name || !formData.email || !formData.message) {
            alert("Please fill all required fields");
            return;
        }

        try {
            setLoading(true);

            await addDoc(collection(db, "advertiseRequests"), {
                userId: user.uid,
                name: formData.name,
                email: formData.email,
                bookTitle: formData.bookTitle,
                message: formData.message,
                createdAt: serverTimestamp(),
            });

            alert("Request sent successfully! We’ll contact you shortly.");
            router.push("/");
        } catch (error) {
            console.error("Error sending request:", error);
            alert("Something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    // ⏳ LOADING WHILE CHECKING AUTH
    if (checkingAuth) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin h-8 w-8 border-b-2 border-blue-950 rounded-full"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-lg">
                <h2 className="text-2xl font-bold mb-4 text-blue-950">
                    Advertise Your Book
                </h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <input
                        name="name"
                        required
                        placeholder="Full Name"
                        value={formData.name}
                        onChange={handleChange}
                        className="w-full border px-4 py-3 rounded-lg"
                    />

                    <input
                        type="email"
                        name="email"
                        required
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="Email Address"
                        className="w-full border px-4 py-3 rounded-lg"
                    />

                    <input
                        name="bookTitle"
                        placeholder="Book Title"
                        value={formData.bookTitle}
                        onChange={handleChange}
                        className="w-full border px-4 py-3 rounded-lg"
                    />

                    <textarea
                        name="message"
                        placeholder="Tell us about your book & promotion plan"
                        rows={4}
                        value={formData.message}
                        onChange={handleChange}
                        className="w-full border px-4 py-3 rounded-lg"
                    />

                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={() => router.back()}
                            className="flex-1 border py-3 rounded-lg"
                        >
                            Cancel
                        </button>

                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 bg-blue-950 text-white py-3 rounded-lg disabled:opacity-50"
                        >
                            {loading ? "Sending..." : "Send Request"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}