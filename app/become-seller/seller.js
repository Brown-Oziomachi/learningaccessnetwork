"use client";
import React, { useState, useEffect } from "react";
import {
    Store,
    Building2,
    CreditCard,
    CheckCircle,
    ArrowLeft,
    Loader2,
    GraduationCap,
    Info,
    X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebaseConfig";
import { doc, getDoc, updateDoc, setDoc, writeBatch, serverTimestamp } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import Navbar from '@/components/NavBar';

export default function BecomeSellerClient() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const router = useRouter();
    const [showLecturerInfo, setShowLecturerInfo] = useState(false);
    const [formData, setFormData] = useState({
        firstName: "",
        surname: "",
        email: "",
        phoneNumber: "",
        title: "",
        bankName: "",
        bankCode: "",
        accountNumber: "",
        accountName: "",
        isCustomBank: false,
        businessName: "",
        businessDescription: "",
        agreeToTerms: false
    });

    const [errors, setErrors] = useState({});
    const [toast, setToast] = useState({ show: false, message: "", type: "error" });

    // Helper to show the toast and auto-hide it
    const showToast = (message, type = "error") => {
        setToast({ show: true, message, type });
        setTimeout(() => setToast({ show: false, message: "", type }), 5000); // Auto-hide after 5s
    };

    const nigerianBanks = [
        { name: "Access Bank", code: "044" },
        { name: "Citibank Nigeria", code: "023" },
        { name: "Ecobank Nigeria", code: "050" },
        { name: "Fidelity Bank", code: "070" },
        { name: "First Bank of Nigeria", code: "011" },
        { name: "First City Monument Bank (FCMB)", code: "214" },
        { name: "Guaranty Trust Bank (GTBank)", code: "058" },
        { name: "Heritage Bank", code: "030" },
        { name: "Keystone Bank", code: "082" },
        { name: "Polaris Bank", code: "076" },
        { name: "Providus Bank", code: "101" },
        { name: "Stanbic IBTC Bank", code: "221" },
        { name: "Standard Chartered Bank", code: "068" },
        { name: "Sterling Bank", code: "232" },
        { name: "Union Bank of Nigeria", code: "032" },
        { name: "United Bank for Africa (UBA)", code: "033" },
        { name: "Unity Bank", code: "215" },
        { name: "Wema Bank", code: "035" },
        { name: "Zenith Bank", code: "057" }
    ];

    // FIXED: Removed duplicate useEffect, kept only one
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (currentUser) {
                await fetchUserData(currentUser.uid);
            } else {
                router.push('/auth/signin');
            }
        });

        return () => unsubscribe();
    }, [router]);

    const fetchUserData = async (uid) => {
        try {
            setLoading(true);

            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Connection timeout')), 8000)
            );

            const fetchPromise = getDoc(doc(db, "users", uid));

            const userDoc = await Promise.race([fetchPromise, timeoutPromise]);

            if (userDoc.exists()) {
                const userData = userDoc.data();

                if (userData.isSeller) {
                    router.push('/my-account/seller-account');
                    return;
                }

                setUser({ uid, ...userData });

                setFormData(prev => ({
                    ...prev,
                    firstName: userData.firstName || "",
                    surname: userData.surname || "",
                    email: userData.email || auth.currentUser?.email || "",
                    phoneNumber: userData.phoneNumber || ""
                }));
            } else {
                setUser({
                    uid,
                    email: auth.currentUser?.email || "",
                    firstName: "",
                    surname: ""
                });
                setFormData(prev => ({
                    ...prev,
                    email: auth.currentUser?.email || ""
                }));
            }
        } catch (error) {
            console.error("Error fetching user data:", error);

            if (auth.currentUser) {
                setUser({
                    uid: auth.currentUser.uid,
                    email: auth.currentUser.email,
                    firstName: "",
                    surname: ""
                });
                setFormData(prev => ({
                    ...prev,
                    email: auth.currentUser.email
                }));

                showToast("Could not load user data. You can still proceed with the form.", "error");
            } else {
                showToast("Connection error. Please check your internet and try again.", "error");
                router.push('/my-account');
            }
        } finally {
            setLoading(false);
        }
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.phoneNumber) newErrors.phoneNumber = "Phone number is required";
        if (!formData.bankName) newErrors.bankName = "Please select a bank or enter bank name";

        // Validate bank code for custom banks
        if (formData.isCustomBank && !formData.bankCode) {
            newErrors.bankCode = "Bank code is required for custom banks";
        }

        if (!formData.accountNumber) newErrors.accountNumber = "Account number is required";
        if (formData.accountNumber && formData.accountNumber.length !== 10) {
            newErrors.accountNumber = "Account number must be 10 digits";
        }
        if (!formData.accountName) newErrors.accountName = "Account name is required";
        if (!formData.agreeToTerms) newErrors.agreeToTerms = "You must agree to the terms";

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };


const handleSubmit = async () => {
    if (!validateForm()) return;

    setSubmitting(true);

    try {
        // 1. Create Flutterwave Subaccount
        // We do this first because if it fails, we shouldn't update the Database.
        const flwRes = await fetch('/api/flutterwave/create-subaccount', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                uid: user.uid,
                email: formData.email,
                firstName: formData.firstName,
                surname: formData.surname,
                phoneNumber: formData.phoneNumber,
                bankCode: formData.bankCode,
                accountNumber: formData.accountNumber,
                businessName: formData.businessName || `${formData.firstName} ${formData.surname}`,
            }),
        });

        const flwData = await flwRes.json();

        if (!flwData.success) {
            throw new Error(flwData.error || "Failed to create Flutterwave subaccount.");
        }

        const flutterwaveSubaccountId = flwData.subaccount_id;

        // 2. Initialize Firestore Batch
        // A batch ensures that EITHER both documents save, OR neither does.
        const batch = writeBatch(db);
        const userRef = doc(db, "users", user.uid);
        const sellerRef = doc(db, "sellers", user.uid);

        // Prepare User Document Update
        batch.update(userRef, {
            isSeller: true,
            phoneNumber: formData.phoneNumber,
            flutterwaveSubaccountId: flutterwaveSubaccountId,
            updatedAt: serverTimestamp()
        });

        // Prepare Seller Document Creation
        // ... inside handleSubmit
        batch.set(sellerRef, {
            accountBalance: 0,
            totalEarnings: 0,
            booksSold: 0,
            bankDetails: {
                bankName: formData.bankName,
                bankCode: formData.bankCode,
                accountNumber: formData.accountNumber,
                accountName: formData.accountName,
                // Ensure this matches the object structure your rules expect
            },
            businessInfo: {
                businessName: formData.businessName || `${formData.firstName} ${formData.surname}`,
                businessDescription: formData.businessDescription
            },
            sellerName: `${formData.firstName} ${formData.surname}`.trim(),
            title: formData.title || "",
            createdAt: serverTimestamp(),
            status: "active",
            flutterwaveSubaccountId: flutterwaveSubaccountId // Move to top level if rules struggle with nested objects
        });

        // 3. Commit the Batch
        await batch.commit();

        // Replace alert with showToast
        showToast("Seller account created successfully! 🎉", "success");

        // Delay the redirect slightly so the user can actually see the success message
        setTimeout(() => {
            router.push('/my-account/seller-account');
        }, 10000);
        router.push('/my-account/seller-account');

    } catch (error) {
        console.error("Onboarding Error:", error);

        let userFriendlyMessage = "An unexpected error occurred.";

        if (error.message.includes("permission")) {
            userFriendlyMessage = "Setup failed: Permissions denied. Please contact support.";
        } else if (error.message.includes("account")) {
            userFriendlyMessage = "Setup failed: Sorry, we couldn't verify your account number. Kindly pass a valid account number.";
        } else if (error.message.includes("timeout")) {
            userFriendlyMessage = "Request timed out. Please check your internet connection.";
        } else {
            userFriendlyMessage = `Setup failed: ${error.message}`;
        }

        showToast(userFriendlyMessage, "error");
    } finally {
        setSubmitting(false);
    }
};

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-950 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <header className="bg-blue-950 text-white shadow-lg">
                <div className="max-w-4xl mx-auto px-4 py-6">
                    <button
                        onClick={() => router.back()}
                        className="flex items-center gap-2 text-blue-200 hover:text-white mb-4 transition-colors"
                    >
                        <ArrowLeft size={20} />
                        Back
                    </button>
                    <div className="text-center">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-white text-blue-950 rounded-full mb-4">
                            <Store size={32} />
                        </div>
                        <h1 className="text-3xl sm:text-4xl font-bold mb-2">Become a Seller</h1>
                        <p className="text-blue-200 text-lg">Start selling your books and earn money</p>
                    </div>
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-4 py-8">
                <div className="bg-white text-blue-950 rounded-lg shadow-lg p-6 mb-8">
                    <h2 className="text-2xl font-bold mb-4">Seller Benefits</h2>
                    <div className="grid sm:grid-cols-3 gap-4">
                        <div className="text-center p-4">
                            <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3">
                                <CreditCard className="text-green-600" size={28} />
                            </div>
                            <h3 className="font-semibold mb-2">Earn 80%</h3>
                            <p className="text-sm text-gray-600">You keep 80% of every sale</p>
                        </div>
                        <div className="text-center p-4">
                            <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3">
                                <Building2 className="text-blue-600" size={28} />
                            </div>
                            <h3 className="font-semibold mb-2">Easy Withdrawals</h3>
                            <p className="text-sm text-gray-600">Withdraw anytime to your bank</p>
                        </div>
                        <div className="text-center p-4">
                            <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3">
                                <CheckCircle className="text-purple-600" size={28} />
                            </div>
                            <h3 className="font-semibold mb-2">No Setup Fees</h3>
                            <p className="text-sm text-gray-600">Free to join and start selling</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white text-blue-950 rounded-lg shadow-lg p-6 sm:p-8">
                    <h2 className="text-2xl font-bold mb-6">Seller Application</h2>

                    <div className="mb-8">
                        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            <CheckCircle className="text-green-600" size={20} />
                            Personal Information
                        </h3>
                        <div className="grid sm:grid-cols-2 gap-4">
                            <div>
                                <label className="font-semibold text-gray-700 block mb-2">First Name</label>
                                <input
                                    value={formData.firstName}
                                    disabled
                                    className="w-full border border-gray-300 px-4 py-3 rounded-lg bg-gray-100 cursor-not-allowed"
                                />
                            </div>
                            <div>
                                <label className="font-semibold text-gray-700 block mb-2">Surname</label>
                                <input
                                    value={formData.surname}
                                    disabled
                                    className="w-full border border-gray-300 px-4 py-3 rounded-lg bg-gray-100 cursor-not-allowed"
                                />
                            </div>
                            <div className="sm:col-span-2">
                                <label className="font-semibold text-gray-700 block mb-2">Email</label>
                                <input
                                    value={formData.email}
                                    disabled
                                    className="w-full border border-gray-300 px-4 py-3 rounded-lg bg-gray-100 cursor-not-allowed"
                                />
                            </div>
                            <div className="sm:col-span-2">
                                <label className="font-semibold text-gray-700 block mb-2">
                                    Phone Number <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="tel"
                                    value={formData.phoneNumber}
                                    onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                                    placeholder="08012345678"
                                    className={`w-full border px-4 py-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.phoneNumber ? 'border-red-500' : 'border-gray-300'}`}
                                />
                                {errors.phoneNumber && (
                                    <p className="text-red-500 text-sm mt-1">{errors.phoneNumber}</p>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="sm:col-span-2">
                        <div className="flex items-center gap-2 mb-2">
                            <label className="font-semibold text-gray-700">
                                Title / Profession
                            </label>
                            <button
                                type="button"
                                onClick={() => setShowLecturerInfo(true)}
                                className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center hover:bg-blue-200 transition-colors shrink-0 "
                                title="Why select Lecturer?"
                            >
                                <Info size={12} />
                            </button>
                        </div>
                        <select
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            className="w-full border border-gray-300 px-4 py-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            <option value="">Select title (optional)</option>
                            <option value="Lecturer">Lecturer</option>
                            <option value="Dr.">Dr.</option>
                            <option value="Prof.">Prof.</option>
                            <option value="Professor">Professor</option>
                        </select>
                        {(formData.title === 'Lecturer' || formData.title === 'Dr.' || formData.title === 'Prof.' || formData.title === 'Professor') && (
                            <div className="mt-3 bg-gradient-to-br from-blue-950 to-indigo-900 text-white rounded-2xl p-5 shadow-lg border border-blue-800">
                                <div className="flex items-start gap-3">
                                    <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
                                        <GraduationCap className="w-5 h-5 text-blue-200" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-base mb-1">You're registering as an Academic! 🎓</p>
                                        <p className="text-blue-200 text-sm leading-relaxed mb-3">
                                            As a <span className="text-white font-semibold">{formData.title}</span>, your profile will be featured in our exclusive <span className="text-white font-semibold">University Lecturers</span> directory, giving students direct access to your academic materials.
                                        </p>
                                        <div className="space-y-2">
                                            {[
                                                "Your profile appears in the Lecturers section",
                                                "Students can find your materials by department & university",
                                                "Builds your academic brand on LAN Library",
                                                "Earn from every download of your course materials"
                                            ].map((benefit, i) => (
                                                <div key={i} className="flex items-center gap-2 text-sm text-blue-100">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-blue-300 flex-shrink-0" />
                                                    {benefit}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="mb-8 mt-5">
                        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            <Building2 className="text-blue-600" size={20} />
                            Bank Account Details
                        </h3>
                        <div className="grid sm:grid-cols-2 gap-4">
                            <div className="sm:col-span-2">
                                <label className="font-semibold text-gray-700 block mb-2">
                                    Bank Name <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={formData.isCustomBank ? "other" : formData.bankName}
                                    onChange={(e) => {
                                        const selectedValue = e.target.value;

                                        if (selectedValue === "other") {
                                            // User selected "Other Bank"
                                            setFormData({
                                                ...formData,
                                                bankName: "",
                                                bankCode: "",
                                                isCustomBank: true
                                            });
                                        } else {
                                            // User selected a bank from the list
                                            const selectedBank = nigerianBanks.find(bank => bank.name === selectedValue);
                                            setFormData({
                                                ...formData,
                                                bankName: selectedValue,
                                                bankCode: selectedBank ? selectedBank.code : "",
                                                isCustomBank: false
                                            });
                                        }
                                    }}
                                    className={`w-full border px-4 py-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.bankName ? 'border-red-500' : 'border-gray-300'}`}
                                >
                                    <option value="">Select your bank</option>
                                    {nigerianBanks.map(bank => (
                                        <option key={bank.code} value={bank.name}>{bank.name}</option>
                                    ))}
                                    <option value="other">🏦 Other Bank (Not Listed)</option>
                                </select>
                                {errors.bankName && (
                                    <p className="text-red-500 text-sm mt-1">{errors.bankName}</p>
                                )}
                            </div>

                            {/* Show these fields only if "Other Bank" is selected */}
                            {formData.isCustomBank && (
                                <>
                                    <div>
                                        <label className="font-semibold text-gray-700 block mb-2">
                                            Bank Name <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.bankName}
                                            onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                                            placeholder="Enter your bank name"
                                            className={`w-full border px-4 py-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.bankName ? 'border-red-500' : 'border-gray-300'}`}
                                        />
                                    </div>
                                    <div>
                                        <label className="font-semibold text-gray-700 block mb-2">
                                            Bank Code <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.bankCode}
                                            onChange={(e) => setFormData({ ...formData, bankCode: e.target.value.replace(/\D/g, '') })}
                                            placeholder="Enter bank code (e.g., 044)"
                                            maxLength={3}
                                            className={`w-full border px-4 py-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.bankCode ? 'border-red-500' : 'border-gray-300'}`}
                                        />
                                        {errors.bankCode && (
                                            <p className="text-red-500 text-sm mt-1">{errors.bankCode}</p>
                                        )}
                                        <p className="text-sm text-gray-500 mt-1">
                                            💡 You can find your bank code on your bank's website or app
                                        </p>
                                    </div>
                                </>
                            )}

                            {/* Show bank code as read-only if a bank from list is selected */}
                            {!formData.isCustomBank && formData.bankCode && (
                                <div className="sm:col-span-2">
                                    <label className="font-semibold text-gray-700 block mb-2">
                                        Bank Code
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.bankCode}
                                        disabled
                                        className="w-full border border-gray-300 px-4 py-3 rounded-lg bg-gray-100 cursor-not-allowed"
                                    />
                                </div>
                            )}

                            <div>
                                <label className="font-semibold text-gray-700 block mb-2">
                                    Account Number <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    maxLength={10}
                                    value={formData.accountNumber}
                                    onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value.replace(/\D/g, '') })}
                                    placeholder="0123456789"
                                    className={`w-full border px-4 py-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.accountNumber ? 'border-red-500' : 'border-gray-300'}`}
                                />
                                {errors.accountNumber && (
                                    <p className="text-red-500 text-sm mt-1">{errors.accountNumber}</p>
                                )}
                            </div>
                            <div>
                                <label className="font-semibold text-gray-700 block mb-2">
                                    Account Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={formData.accountName}
                                    onChange={(e) => setFormData({ ...formData, accountName: e.target.value })}
                                    placeholder="Account holder name"
                                    className={`w-full border px-4 py-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.accountName ? 'border-red-500' : 'border-gray-300'}`}
                                />
                                {errors.accountName && (
                                    <p className="text-red-500 text-sm mt-1">{errors.accountName}</p>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="mb-8">
                        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            <Store className="text-purple-600" size={20} />
                            Business Information <span className="text-sm text-gray-500 font-normal">(Optional)</span>
                        </h3>
                        <div className="grid gap-4">
                            <div>
                                <label className="font-semibold text-gray-700 block mb-2">Business Name</label>
                                <input
                                    type="text"
                                    value={formData.businessName}
                                    onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                                    placeholder="Your business or store name"
                                    className="w-full border border-gray-300 px-4 py-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                            <div>
                                <label className="font-semibold text-gray-700 block mb-2">Business Description</label>
                                <textarea
                                    value={formData.businessDescription}
                                    onChange={(e) => setFormData({ ...formData, businessDescription: e.target.value })}
                                    placeholder="Tell us about your books and what you specialize in"
                                    rows={4}
                                    className="w-full border border-gray-300 px-4 py-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="mb-8">
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <div className="flex items-start gap-3">
                                <input
                                    type="checkbox"
                                    id="agreeToTerms"
                                    checked={formData.agreeToTerms}
                                    onChange={(e) => setFormData({ ...formData, agreeToTerms: e.target.checked })}
                                    className="mt-1"
                                />
                                <label htmlFor="agreeToTerms" className="text-sm text-gray-700 cursor-pointer">
                                    I agree to the Terms and Conditions and understand that: I will receive 80% of each sale amount, 20% commission goes to platform maintenance, minimum withdrawal amount is ₦1,000, and withdrawals are processed before 24 hours.
                                </label>
                            </div>
                            {errors.agreeToTerms && (
                                <p className="text-red-500 text-sm mt-2 ml-8">{errors.agreeToTerms}</p>
                            )}
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4">
                        <button
                            onClick={() => router.back()}
                            disabled={submitting}
                            className="flex-1 border-2 border-gray-300 px-6 py-4 rounded-lg hover:bg-gray-50 font-semibold transition-colors disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={submitting}
                            className="flex-1 bg-green-600 text-white px-6 py-4 rounded-lg hover:bg-green-700 font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {submitting ? (
                                <>
                                    <Loader2 className="animate-spin" size={20} />
                                    Creating Account...
                                </>
                            ) : (
                                <>
                                    <CheckCircle size={20} />
                                    Complete Setup
                                </>
                            )}
                        </button>
                    </div>
                </div>
                {/* Lecturer Info Popup */}
                {showLecturerInfo && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center pt-10 bg-black/50 backdrop-blur-sm overflow-y-auto">
                        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
                            {/* Header */}
                            <div className="bg-gradient-to-br from-blue-950 to-indigo-900 px-6 py-6 text-white text-center">
                                <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-3 mt-15 border border-white/20">
                                    <GraduationCap className="w-7 h-7 text-blue-200" />
                                </div>
                                <h3 className="text-xl font-bold">Why Select an Academic Title?</h3>
                                <p className="text-blue-300 text-sm mt-1">Unlock exclusive features for educators</p>
                            </div>

                            {/* Body */}
                            <div className="p-6 space-y-4">
                                {[
                                    {
                                        icon: "🎓",
                                        title: "Featured in Lecturers Directory",
                                        desc: "Your profile appears in the dedicated University Lecturers section where students actively search for academic materials."
                                    },
                                    {
                                        icon: "🔍",
                                        title: "Searchable by Department & University",
                                        desc: "Students can find you by your department and university once you add those details to your profile."
                                    },
                                    {
                                        icon: "📚",
                                        title: "Academic Brand Building",
                                        desc: "Build your reputation as a trusted academic source on LAN Library across Nigeria."
                                    },
                                    {
                                        icon: "💰",
                                        title: "Earn from Course Materials",
                                        desc: "Monetize your lecture notes, past questions, and academic resources with every download."
                                    }
                                ].map((item, i) => (
                                    <div key={i} className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                                        <span className="text-2xl flex-shrink-0">{item.icon}</span>
                                        <div>
                                            <p className="font-semibold text-gray-900 text-sm">{item.title}</p>
                                            <p className="text-gray-500 text-xs mt-0.5 leading-relaxed">{item.desc}</p>
                                        </div>
                                    </div>
                                ))}

                                <p className="text-xs text-center text-gray-400 pt-2">
                                    Applies to: Lecturer, Dr., Prof., Professor
                                </p>

                                <button
                                    onClick={() => setShowLecturerInfo(false)}
                                    className="w-full bg-blue-950 text-white py-3 rounded-2xl font-bold hover:bg-blue-900 transition-colors"
                                >
                                    Got it!
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </main>
            {/* Sided Pop-out Toast */}
            {toast.show && (
                <div className="fixed top-20 right-4 z-50 transition-all duration-500 ease-in-out transform translate-x-0 animate-in slide-in-from-right-full">
                    <div className={`flex items-center gap-3 p-4 rounded-xl shadow-2xl border-l-4 min-w-[320px] max-w-md ${toast.type === "error"
                            ? "bg-white border-red-500 text-gray-800"
                            : "bg-white border-green-500 text-gray-800"
                        }`}>
                        {/* Status Icon */}
                        <div className={`shrink-0 ${toast.type === "error" ? "text-red-500" : "text-green-500"}`}>
                            {toast.type === "error" ? <Info size={22} /> : <CheckCircle size={22} />}
                        </div>

                        {/* Message Content */}
                        <div className="flex-1">
                            <p className="text-sm font-semibold leading-tight">
                                {toast.type === "error" ? "Action Failed" : "Success!"}
                            </p>
                            <p className="text-xs text-gray-500 mt-0.5">
                                {toast.message}
                            </p>
                        </div>

                        {/* Manual Close Button */}
                        <button
                            onClick={() => setToast({ ...toast, show: false })}
                            className="p-1.5 hover:bg-gray-100 rounded-full transition-colors text-gray-400"
                        >
                            <X size={16} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}