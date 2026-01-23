"use client";
import React, { useState, useEffect } from "react";
import { Globe, Camera, Save, Settings, X, Mail, Store } from "lucide-react";
import Link from "next/link";
import { auth, db } from "@/lib/firebaseConfig";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useRouter } from "next/navigation";
import Navbar from "@/components/NavBar";

export default function MyAccountClient() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState(null);
    const [isRedirecting, setIsRedirecting] = useState(false);
    const router = useRouter();
    const [sellerData, setSellerData] = useState(null);
    const [showSellerRedirectModal, setShowSellerRedirectModal] = useState(false);
    const isRedirectingRef = React.useRef(false);
    const [formData, setFormData] = useState({
        firstName: "",
        surname: "",
        displayName: "",
        dateOfBirth: ""
    });

    useEffect(() => {
        console.log("Setting up auth listener...");

        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            console.log("Auth state changed:", currentUser ? "User logged in" : "No user");

            if (currentUser) {
                console.log("User UID:", currentUser.uid);
                await fetchUserData(currentUser.uid);
            } else {
                console.log("No user, redirecting to signin...");
                router.push('/auth/signin');
            }
        });

        return () => {
            console.log("Cleaning up auth listener");
            unsubscribe();
        };
    }, [router]);

    const fetchUserData = async (uid) => {
        try {
            console.log("Fetching user data for UID:", uid);
            setLoading(true);
            setError(null);

            const userDocRef = doc(db, "users", uid);
            console.log("Document reference created");

            const userDoc = await getDoc(userDocRef);
            console.log("Document fetched, exists:", userDoc.exists());

            if (userDoc.exists()) {
                const userData = userDoc.data();
                console.log("User data:", userData);
                console.log("User role:", userData.role);

                // For other roles, set user data
                console.log("Setting user data for other roles");
                setUser({
                    uid: uid,
                    ...userData
                });

                setFormData({
                    firstName: userData.firstName || "",
                    surname: userData.surname || "",
                    displayName: userData.displayName || "",
                    dateOfBirth: userData.dateOfBirth || ""
                });

            } else {
                console.error("User document does not exist!");
                setError("User profile not found. Please complete your registration.");

                // Create a basic user document if it doesn't exist
                const basicUserData = {
                    email: auth.currentUser?.email,
                    createdAt: new Date().toISOString(),
                    firstName: "",
                    surname: "",
                    displayName: auth.currentUser?.displayName || "",
                    role: "" // Empty role means they need to select one
                };

                await updateDoc(userDocRef, basicUserData);

                // Redirect to role selection
                router.push('/role-selection');
                return;
            }
        } catch (error) {
            console.error("Error fetching user data:", error);
            console.error("Error code:", error.code);
            console.error("Error message:", error.message);
            setError(`Failed to load profile: ${error.message}`);
        } finally {
            // Only set loading to false if we're not redirecting
            if (!isRedirectingRef.current) {
                console.log("Setting loading to false");
                setLoading(false);
            } else {
                console.log("Skipping loading false - redirecting in progress");
            }
        }
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (!file.type.startsWith("image/")) {
            alert("Please upload an image file");
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            alert("Image size should be less than 5MB");
            return;
        }

        try {
            setUploading(true);
            console.log("Starting image upload...");

            const storage = getStorage();
            const timestamp = Date.now();
            const imageRef = ref(storage, `profile-images/${user.uid}_${timestamp}.jpg`);

            await uploadBytes(imageRef, file);
            const downloadURL = await getDownloadURL(imageRef);

            await updateDoc(doc(db, "users", user.uid), {
                photoURL: downloadURL
            });

            setUser(prev => ({
                ...prev,
                photoURL: downloadURL
            }));

            alert("Profile picture updated successfully!");

        } catch (error) {
            console.error("Image upload failed:", error);
            let errorMessage = "Failed to upload image";
            if (error.code === 'storage/unauthorized') {
                errorMessage = "Storage permission denied. Please check Firebase Storage rules.";
            } else if (error.code === 'storage/canceled') {
                errorMessage = "Upload was canceled";
            } else if (error.code === 'storage/unknown') {
                errorMessage = "Unknown storage error occurred";
            } else {
                errorMessage = `Upload failed: ${error.message}`;
            }
            alert(errorMessage);
        } finally {
            setUploading(false);
        }
    };

    const handleLogout = async () => {
        try {
            await signOut(auth);
            router.push('/');
        } catch (error) {
            console.error("Logout error:", error);
            alert("Failed to logout. Please try again.");
        }
    };

    const handleSave = async () => {
        try {
            console.log("Saving profile changes...");

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
            alert("Profile updated successfully!");
            console.log("Profile saved successfully");
        } catch (error) {
            console.error("Error saving profile:", error);
            alert(`Failed to save profile: ${error.message}`);
        }
    };

    const handleBecomeSeller = () => {
        router.push('/become-seller');
    };

    // Show redirecting screen for students
    if (isRedirecting) {
        return (
            <div className="min-h-screen bg-blue-950 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-50 mx-auto"></div>
                    <p className="mt-4 text-gray-300">Redirecting to Student Dashboard...</p>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-blue-950 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-50 mx-auto"></div>
                    <p className="mt-4 text-gray-300">Loading...</p>
                </div>
            </div>
        );
    }

    if (error && !user) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-lg shadow-lg p-8 max-w-md text-center">
                    <div className="text-red-500 text-6xl mb-4">⚠️</div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Error Loading Profile</h2>
                    <p className="text-gray-600 mb-6">{error}. It is not your fault, nor our fault. We guess it is network. Please try again later.</p>
                    <div className="flex gap-4 justify-center">
                        <button
                            onClick={() => window.location.reload()}
                            className="bg-blue-950 text-white px-6 py-2 rounded-lg hover:bg-blue-900"
                        >
                            Retry
                        </button>
                        <button
                            onClick={() => router.push('/auth/signin')}
                            className="border border-gray-300 px-6 py-2 rounded-lg hover:bg-gray-50"
                        >
                            Sign Out
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (!user && !showSellerRedirectModal) {
        return (
            <div className="min-h-screen bg-blue-950 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-50 mx-auto"></div>
                    <p className="mt-4 text-gray-300">Loading...</p>
                </div>
            </div>
        );
    }

    if (showSellerRedirectModal) {
        return (
            <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-300">
                    <div className="p-6">
                        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
                            <p className="text-sm text-blue-900 leading-relaxed">
                                <strong>Good news!</strong> As a verified seller, you have access to our
                                powerful seller dashboard where you can:
                            </p>
                            <ul className="mt-3 space-y-2 text-sm text-blue-800">
                                <li className="flex items-start gap-2">
                                    <span className="text-green-600 mt-0.5">✓</span>
                                    <span>Manage your book listings</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-green-600 mt-0.5">✓</span>
                                    <span>Track your sales and earnings</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-green-600 mt-0.5">✓</span>
                                    <span>Withdraw your funds</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-green-600 mt-0.5">✓</span>
                                    <span>View purchase history</span>
                                </li>
                            </ul>
                        </div>

                        <p className="text-gray-600 text-sm text-center mb-6">
                            We'll redirect you to your seller dashboard now
                        </p>

                        <div className="flex flex-col gap-3">
                            <button
                                onClick={() => router.push('/my-account/seller-account')}
                                className="w-full bg-blue-950 text-white py-3 rounded-xl font-bold hover:bg-blue-900 transition-colors flex items-center justify-center gap-2"
                            >
                                <Store size={20} />
                                Go to Seller Dashboard
                            </button>
                            <button
                                onClick={() => {
                                    setShowSellerRedirectModal(false);
                                    router.push('/documents');
                                }}
                                className="w-full border-2 border-gray-300 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
                            >
                                Browse Books Instead
                            </button>
                        </div>

                        <p className="text-xs text-gray-500 text-center mt-4">
                            This happens automatically because you're a verified seller
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />
            <header className="bg-blue-950 text-white shadow-lg">
                <div className="max-w-7xl mx-auto px-4 py-4">
                    <div className="flex justify-between items-center">
                        <h1 className="text-2xl font-bold">My Account</h1>
                        <div className="flex items-center gap-3">
                            {user?.isSeller && (
                                <button
                                    onClick={() => router.push('/my-account/seller-account')}
                                    className="bg-blue-800 hover:bg-blue-700 px-4 py-2 rounded-lg font-semibold transition-colors text-sm"
                                >
                                    Seller Dashboard
                                </button>
                            )}
                            {!user?.isSeller && (
                                <button
                                    onClick={handleBecomeSeller}
                                    className="bg-green-600 hover:bg-green-700 px-4 sm:px-6 py-2 rounded-lg font-semibold transition-colors flex items-center gap-2"
                                >
                                    <Store size={20} />
                                    <span className="hidden sm:inline">Become a Seller</span>
                                    <span className="sm:hidden">Sell</span>
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-4 py-6 sm:py-8">
                <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                    <div className="relative bg-gradient-to-r from-blue-950 to-blue-800 p-6 sm:p-8 text-white">
                        <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
                            <div className="relative">
                                <img
                                    src={user.photoURL || "https://ui-avatars.com/api/?name=" + encodeURIComponent(user.displayName || user.email)}
                                    className="w-24 h-24 sm:w-32 sm:h-32 rounded-full border-4 border-white object-cover"
                                    alt="profile"
                                    onError={(e) => {
                                        e.target.src = "https://ui-avatars.com/api/?name=" + encodeURIComponent(user.displayName || user.email);
                                    }}
                                />
                            </div>
                            <div className="text-center sm:text-left flex-1">
                                <h2 className="text-2xl sm:text-3xl font-bold">
                                    {user.displayName || user.email?.split('@')[0] || 'User'}
                                </h2>
                                <p className="text-blue-200 flex items-center gap-2 justify-center sm:justify-start mt-1">
                                    <Mail size={16} />
                                    {user.email}
                                </p>
                            </div>
                            <button
                                onClick={() => setIsEditing(true)}
                                className="bg-white text-blue-950 px-4 sm:px-6 py-2 rounded-lg font-semibold hover:bg-blue-50 transition-colors flex items-center gap-2"
                            >
                                <Settings size={18} />
                                Edit Profile
                            </button>
                        </div>
                    </div>

                    <div className="p-4 sm:p-8 text-blue-950">
                        <h3 className="text-xl font-bold mb-4">Account Information</h3>
                        <div className="grid sm:grid-cols-2 gap-4 sm:gap-6">
                            <div>
                                <label className="font-semibold text-gray-700">First Name</label>
                                <p className="bg-gray-50 px-4 py-3 rounded-lg mt-1">
                                    {user.firstName || 'Not set'}
                                </p>
                            </div>
                            <div>
                                <label className="font-semibold text-gray-700">Surname</label>
                                <p className="bg-gray-50 px-4 py-3 rounded-lg mt-1">
                                    {user.surname || 'Not set'}
                                </p>
                            </div>
                            <div>
                                <label className="font-semibold text-gray-700">Email</label>
                                <p className="bg-gray-50 px-4 py-3 rounded-lg mt-1">{user.email}</p>
                            </div>
                            <div>
                                <label className="font-semibold text-gray-700">Date of Birth</label>
                                <p className="bg-gray-50 px-4 py-3 rounded-lg mt-1">
                                    {user.dateOfBirth || 'Not set'}
                                </p>
                            </div>
                        </div>

                        <div className="mt-8">
                            <h3 className="text-xl font-bold mb-4">Quick Actions</h3>
                            <div className="grid sm:grid-cols-2 gap-4">
                                <Link href="/documents" className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-600 hover:bg-blue-50 transition-all flex items-center gap-3">
                                    <Globe className="text-blue-600" size={24} />
                                    <span className="font-semibold">Browse Books</span>
                                </Link>
                                {user?.isSeller ? (
                                    <button
                                        onClick={() => router.push('/my-account/seller-account')}
                                        className="p-4 border-2 border-blue-500 bg-blue-50 rounded-lg hover:border-blue-600 hover:bg-blue-100 transition-all flex items-center gap-3"
                                    >
                                        <Store className="text-blue-600" size={24} />
                                        <span className="font-semibold text-blue-700">Go to Seller Dashboard</span>
                                    </button>
                                ) : (
                                    <button
                                        onClick={handleBecomeSeller}
                                        className="p-4 border-2 border-green-500 bg-green-50 rounded-lg hover:border-green-600 hover:bg-green-100 transition-all flex items-center gap-3"
                                    >
                                        <Store className="text-green-600" size={24} />
                                        <span className="font-semibold text-green-700">Start Selling Books</span>
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Edit Profile Modal */}
            {isEditing && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white text-blue-950 rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-white text-blue-950 border-b px-6 py-4 flex justify-between items-center">
                            <h2 className="text-2xl font-bold text-blue-950">Edit Profile</h2>
                            <button
                                onClick={() => setIsEditing(false)}
                                className="p-2 hover:bg-gray-100 rounded-full"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        <div className="p-6">
                            <div className="flex justify-center mb-6">
                                <div className="relative">
                                    <img
                                        src={user.photoURL || "https://ui-avatars.com/api/?name=" + encodeURIComponent(user.displayName || user.email)}
                                        className="w-32 h-32 rounded-full border-4 border-gray-200 object-cover"
                                        alt="profile"
                                        onError={(e) => {
                                            e.target.src = "https://ui-avatars.com/api/?name=" + encodeURIComponent(user.displayName || user.email);
                                        }}
                                    />
                                    <label className="absolute bottom-0 right-0 bg-blue-600 p-3 rounded-full cursor-pointer hover:bg-blue-700 transition-colors">
                                        <Camera size={18} className="text-white" />
                                        <input
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            onChange={handleImageUpload}
                                            disabled={uploading}
                                        />
                                    </label>
                                    {uploading && (
                                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center rounded-full">
                                            <div className="text-center">
                                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-1"></div>
                                                <p className="text-xs text-white">Uploading...</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="grid sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="font-semibold text-gray-700 block mb-2">First Name</label>
                                    <input
                                        value={formData.firstName}
                                        onChange={(e) =>
                                            setFormData({ ...formData, firstName: e.target.value })
                                        }
                                        className="w-full border border-gray-300 px-4 py-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>
                                <div>
                                    <label className="font-semibold text-gray-700 block mb-2">Surname</label>
                                    <input
                                        value={formData.surname}
                                        onChange={(e) =>
                                            setFormData({ ...formData, surname: e.target.value })
                                        }
                                        className="w-full border border-gray-300 px-4 py-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>
                                <div className="sm:col-span-2">
                                    <label className="font-semibold text-gray-700 block mb-2">Email</label>
                                    <input
                                        value={user.email}
                                        disabled
                                        className="w-full border border-gray-300 px-4 py-3 rounded-lg bg-gray-100 cursor-not-allowed"
                                    />
                                </div>
                                <div className="sm:col-span-2">
                                    <label className="font-semibold text-gray-700 block mb-2">Date of Birth</label>
                                    <input
                                        type="date"
                                        value={formData.dateOfBirth}
                                        onChange={(e) =>
                                            setFormData({ ...formData, dateOfBirth: e.target.value })
                                        }
                                        className="w-full border border-gray-300 px-4 py-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>
                            </div>

                            <div className="mt-6 flex flex-col sm:flex-row gap-3 sm:justify-end">
                                <button
                                    onClick={() => setIsEditing(false)}
                                    className="border border-blue-950 px-6 py-3 rounded-lg hover:bg-gray-50 font-semibold transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSave}
                                    className="bg-blue-950 text-white px-6 py-3 rounded-lg hover:bg-green-700 font-semibold flex items-center justify-center gap-2 transition-colors"
                                >
                                    <Save size={18} />
                                    Save Changes
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}