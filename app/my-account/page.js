"use client";
import React, { useState, useEffect, useRef } from "react";
import {
    Globe,
    User,
    Mail,
    Calendar,
    Camera,
    Save,
    ArrowLeft,
    Settings,
    Shield,
    MoreVertical,
    Book
} from "lucide-react";
import Link from "next/link";
import { auth, db } from "@/lib/firebaseConfig";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";

export default function MyAccount() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [showMenu, setShowMenu] = useState(false);
    const menuRef = useRef(null);
    const router = useRouter()
    const [formData, setFormData] = useState({
        firstName: "",
        surname: "",
        displayName: "",
        dateOfBirth: ""
    });

      useEffect(() => {
            const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
                if (currentUser) {
                    setUser(currentUser);
                } else {
                    router.push('/auth/signin');
                }
            });
    
            return () => unsubscribe();
      }, [router]);
    
    /* Close dropdown on outside click */
    useEffect(() => {
        const handler = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                setShowMenu(false);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    /* Image Upload */
    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (!file || !file.type.startsWith("image/")) return;

        const reader = new FileReader();
        setUploading(true);

        reader.onloadend = async () => {
            try {
                const base64Image = reader.result;
                await updateDoc(doc(db, "users", user.uid), {
                    photoBase64: base64Image
                });

                setUser((prev) => ({ ...prev, photoBase64: base64Image }));
            } catch (err) {
                alert("Failed to update image");
            } finally {
                setUploading(false);
            }
        };

        reader.readAsDataURL(file);
    };

    /* Fetch user */
    useEffect(() => {
        const unsub = onAuthStateChanged(auth, async (authUser) => {
            if (!authUser) return setLoading(false);

            const snap = await getDoc(doc(db, "users", authUser.uid));
            if (!snap.exists()) return setLoading(false);

            const data = snap.data();
            setUser({ uid: authUser.uid, ...data });
            setFormData({
                firstName: data.firstName || "",
                surname: data.surname || "",
                displayName: data.displayName || "",
                dateOfBirth: data.dateOfBirth || ""
            });

            setLoading(false);
        });

        return () => unsub();
    }, []);

    /* Save */
    const handleSave = async () => {
        await updateDoc(doc(db, "users", user.uid), {
            ...formData,
            displayName: `${formData.firstName} ${formData.surname}`
        });

        setUser((prev) => ({
            ...prev,
            ...formData,
            displayName: `${formData.firstName} ${formData.surname}`
        }));

        setIsEditing(false);
    };

    if (loading || !user) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white">
                <div className="animate-spin h-10 w-10 border-b-2 border-blue-950 rounded-full"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 text-blue-950">
            {/* Header */}
            <header className="bg-blue-950 text-white">
                <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between">
                   <Link href="/home" className="flex items-center gap-2">
                            <img src="/lan-logo.png" alt="lan logo" className="w-20 h-20" />
                            <h1 className="text-xl md:text-2xl font-bold">
                                L <span className="text-blue-400">A N</span>
                            </h1>
                    </Link>
                    <Link href="/home" className="flex items-center gap-2">
                        <ArrowLeft size={18} /> Home
                    </Link>
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-4 py-8">
                <div className="bg-white rounded-lg shadow-lg overflow-hidden">

                    {/* Profile Header */}
                            <div
                                className="relative p-8 text-white bg-repeat-x bg-center"
                                style={{
                                    backgroundImage: `
                                        url('/lan-logo.png')
                                    `
                                }}
                            >
                        <div className="flex justify-center">
                            <div className="relative">
                                <img
                                    src={user.photoBase64 || "/avatar.png"}
                                    className="w-32 h-32 rounded-full border-4 border-white object-cover"
                                    alt="profile"
                                />

                                {/* Camera ONLY when editing */}
                                {isEditing && (
                                    <label className="absolute bottom-0 right-0 bg-blue-600 p-2 rounded-full cursor-pointer">
                                        <Camera size={18} />
                                        <input
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            onChange={handleImageUpload}
                                        />
                                    </label>
                                )}

                                {uploading && (
                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center rounded-full text-sm">
                                        Uploading...
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Account Info */}
                    <div className="p-8">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-2xl font-bold">Account Information</h3>

                            {/* ⋯ MENU */}
                            <div className="relative" ref={menuRef}>
                                <button
                                    onClick={() => setShowMenu(!showMenu)}
                                    className="p-2 rounded-full hover:bg-gray-100"
                                >
                                    <MoreVertical />
                                </button>

                                {showMenu && (
                                    <div className="absolute right-0 mt-2 w-48 bg-white border rounded-lg shadow-lg z-10">
                                        <button
                                            onClick={() => {
                                                setIsEditing(true);
                                                setShowMenu(false);
                                            }}
                                            className="w-full px-4 py-3 hover:bg-gray-100 flex gap-2"
                                        >
                                            <Settings size={16} /> Edit Profile
                                        </button>

                                        <Link
                                            href="/pdf"
                                            className="block px-4 py-3 hover:bg-gray-100 flex gap-2"
                                        >
                                            <Globe size={16} /> Browse Books
                                        </Link>

                                        <Link
                                            href="/advertise"
                                            className="block px-4 py-3 hover:bg-gray-100 flex gap-2"
                                        >
                                            <Book size={16} /> Advertise with Us
                                        </Link>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-6">
                            {["firstName", "surname"].map((field) => (
                                <div key={field}>
                                    <label className="font-semibold capitalize">{field}</label>
                                    {isEditing ? (
                                        <input
                                            value={formData[field]}
                                            onChange={(e) =>
                                                setFormData({ ...formData, [field]: e.target.value })
                                            }
                                            className="w-full border px-4 py-2 rounded-lg"
                                        />
                                    ) : (
                                        <p className="bg-gray-50 px-4 py-2 rounded-lg">
                                            {user[field]}
                                        </p>
                                    )}
                                </div>
                            ))}

                            <div>
                                <label>Email</label>
                                <p className="bg-gray-50 px-4 py-2 rounded-lg">{user.email}</p>
                            </div>

                            <div>
                                <label>Date of Birth</label>
                                {isEditing ? (
                                    <input
                                        type="date"
                                        value={formData.dateOfBirth}
                                        onChange={(e) =>
                                            setFormData({ ...formData, dateOfBirth: e.target.value })
                                        }
                                        className="w-full border px-4 py-2 rounded-lg"
                                    />
                                ) : (
                                    <p className="bg-gray-50 px-4 py-2 rounded-lg">
                                        {user.dateOfBirth}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Save / Cancel */}
                        {isEditing && (
                            <div className="mt-6 flex gap-4">
                                <button
                                    onClick={() => setIsEditing(false)}
                                    className="border px-6 py-2 rounded-lg"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSave}
                                    className="bg-green-600 text-white px-6 py-2 rounded-lg flex gap-2"
                                >
                                    <Save size={16} /> Save
                                </button>
                            </div>
                        )}
                    </div>
                    {/* Quick Actions */} 
                    <div className="mt-8 grid md:grid-cols-3 gap-4 mb-10 p-8"> 
                        <Link href="/my-books" className="p-4 border rounded-lg">
                             <User />
                              My Books 
                         </Link> 
                         <Link href="/pdf" className="p-4 border rounded-lg"> 
                             <Globe /> 
                             Browse Books 
                         </Link>
                    </div>
                </div>
            </main>
        </div>
    );
}
