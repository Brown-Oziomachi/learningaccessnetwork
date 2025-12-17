"use client";
import React, { useState, useEffect, useRef } from "react";
import {
    Globe,
    User,
    Camera,
    Save,
    ArrowLeft,
    Settings,
    MoreVertical,
    Book
} from "lucide-react";
import Link from "next/link";
import {  Search, Menu, X, ChevronDown, Download, Lock, FileText, LogOut, AlignEndVertical } from 'lucide-react';

import { auth, db } from "@/lib/firebaseConfig";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";

export default function MyAccount() {
    const [user, setUser] = useState(null);
        const [showMobileMenu, setShowMobileMenu] = useState(false);
    const [loading, setLoading] = useState(true);
        const [searchQuery, setSearchQuery] = useState("");
    const [isEditing, setIsEditing] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [showMenu, setShowMenu] = useState(false);
    const menuRef = useRef(null);
        const [showMobileSearch, setShowMobileSearch] = useState(false);

    const router = useRouter()
    const [formData, setFormData] = useState({
        firstName: "",
        surname: "",
        displayName: "",
        dateOfBirth: ""
    });

     const handleSearch = () => {
        if (searchQuery.trim()) {
            router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
            setShowMobileSearch(false); // hide mobile dropdown if open
        }
    };

     const handleLogout = async () => {
        try {
            await signOut(auth);
            router.push("/");
        } catch (error) {
            console.error("Logout error:", error);
        }
    };

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
            <div className="min-h-screen bg-blue-950 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-50 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading My Account...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 text-blue-950">
            {/* Header */}
          <header className="bg-blue-950 text-white sticky top-0 z-50 shadow-lg ">
                <div className="max-w-7xl mx-auto px-4 py-3 sm:py-4">
                    {/* TOP BAR */}
                    <div className="flex items-center justify-between gap-2 sm:gap-4">
                        {/* MOBILE MENU BUTTON */}
                        <button
                            className="md:hidden p-2 hover:bg-blue-900 rounded-lg transition-colors"
                            onClick={() => {
                                setShowMobileMenu(!showMobileMenu);
                                setShowMobileSearch(false);
                            }}
                            aria-label="Toggle menu"
                        >
                            {showMobileMenu ? <X size={24} /> : <Menu size={24} />}
                        </button>

                        {/* LOGO */}
                        <a href="/home" className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                            <img
                                src="/lan-logo.png"
                                alt="LAN logo"
                                className="w-8 h-8 sm:w-12 sm:h-12 lg:w-16 lg:h-16 object-contain"
                            />
                            <h1 className="text-xl sm:text-sm lg:text-base font-bold leading-tight">
                                LEARNING <span className="text-blue-400 block sm:inline">ACCESS NETWORK</span>
                            </h1>
                        </a>

                        {/* MOBILE SEARCH ICON */}
                        <button
                            onClick={() => {
                                setShowMobileSearch(!showMobileSearch);
                                setShowMobileMenu(false);
                            }}
                            className="md:hidden p-2 hover:bg-blue-900 rounded-lg transition-colors"
                            aria-label="Toggle search"
                        >
                            <Search size={22} />
                        </button>

                        {/* DESKTOP SEARCH */}
                        <div className="hidden md:flex flex-1 max-w-md mx-4 lg:mx-8">
                            <div className="relative w-full">
                                <input
                                    type="text"
                                    placeholder="Search PDF books..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                                    className="w-full text-white px-4 py-2 pr-10 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-400"
                                />
                                <button
                                    onClick={handleSearch}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 text-blue-950 hover:text-blue-700 transition-colors"
                                    aria-label="Search"
                                >
                                    <Search size={20} />
                                </button>
                            </div>
                        </div>

                        {/* DESKTOP ACTIONS */}
                        <nav className="hidden md:flex items-center gap-2 lg:gap-4 flex-shrink-0">
                            <a
                                href="/my-account"
                                className="flex items-center gap-1 lg:gap-2 px-2 lg:px-3 py-2 hover:bg-blue-900 rounded-lg transition-colors text-sm lg:text-base"
                            >
                                <User size={18} className="lg:w-5 lg:h-5" />
                                <span className="hidden lg:inline">Account</span>
                                <ChevronDown size={14} className="lg:w-4 lg:h-4" />
                            </a>

                            <a
                                href="/my-books"
                                className="flex items-center gap-1 lg:gap-2 px-2 lg:px-3 py-2 hover:bg-blue-900 rounded-lg transition-colors text-sm lg:text-base"
                            >
                                <Download size={18} className="lg:w-5 lg:h-5" />
                                <span className="hidden lg:inline">My Books</span>
                            </a>

                            <a
                                href="/advertise"
                                className="flex items-center gap-1 lg:gap-2 px-2 lg:px-3 py-2 hover:bg-blue-900 rounded-lg transition-colors text-sm lg:text-base whitespace-nowrap"
                            >
                                <AlignEndVertical size={18} className="lg:w-5 lg:h-5" />
                                <span className="hidden xl:inline">Advertise</span>
                            </a>

                            <button
                                onClick={handleLogout}
                                className="flex items-center gap-1 lg:gap-2 px-2 lg:px-3 py-2 text-red-400 hover:bg-red-900/30 rounded-lg transition-colors text-sm lg:text-base"
                            >
                                <LogOut size={18} className="lg:w-5 lg:h-5" />
                                <span className="hidden lg:inline">Logout</span>
                            </button>
                        </nav>
                    </div>

                    {/* MOBILE SEARCH DROPDOWN */}
                    {showMobileSearch && (
                        <div className="mt-3 md:hidden animate-slideDown">
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Search PDF books..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                                    className="w-full text-white px-4 py-2 pr-10 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-400"
                                    autoFocus
                                />
                                <button
                                    onClick={handleSearch}
                                    className="absolute right-2 t text-blue-950 hover:text-blue-700 transition-colors"
                                    aria-label="Search"
                                >
                                    <Search size={20} />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* MOBILE MENU */}
                    {showMobileMenu && (
                        <nav className="md:hidden mt-3 border-t border-blue-800 pt-3 animate-slideDown">
                            <div className="space-y-1">
                                <a
                                    href="/my-account"
                                    className="flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-blue-900 transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <User size={20} />
                                        <span className="text-sm font-medium">Account</span>
                                    </div>
                                    <ChevronDown size={16} />
                                </a>

                                <a
                                    href="/my-books"
                                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-blue-900 transition-colors"
                                >
                                    <Download size={20} />
                                    <span className="text-sm font-medium">My Books</span>
                                </a>

                                <a
                                    href="/advertise"
                                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-blue-900 transition-colors"
                                >
                                    <AlignEndVertical size={20} />
                                    <span className="text-sm font-medium">Advertise With Us</span>
                                </a>

                                <button
                                    onClick={handleLogout}
                                    className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-red-400 hover:bg-red-900/30 transition-colors"
                                >
                                    <LogOut size={20} />
                                    <span className="text-sm font-medium">Logout</span>
                                </button>
                            </div>
                        </nav>
                    )}
                </div>

                <style jsx>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-slideDown {
          animation: slideDown 0.2s ease-out;
        }
      `}</style>
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
