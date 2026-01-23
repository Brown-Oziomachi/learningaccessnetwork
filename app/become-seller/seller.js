"use client";
import React, { useState, useEffect } from "react";
import {
    Store,
    Building2,
    CreditCard,
    CheckCircle,
    ArrowLeft,
    Loader2
} from "lucide-react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebaseConfig";
import { doc, getDoc, updateDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import Navbar from '@/components/NavBar';

export default function BecomeSellerClient() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const router = useRouter();

    const [formData, setFormData] = useState({
        firstName: "",
        surname: "",
        email: "",
        phoneNumber: "",
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
                    alert('You are already a seller!');
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

                alert("Could not load user data from database. You can still proceed with the form.");
            } else {
                alert("Connection error. Please check your internet and try again.");
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
        if (!validateForm()) {
            return;
        }

        try {
            setSubmitting(true);

            const timeout = (ms) => new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Operation timeout')), ms)
            );

            await Promise.race([
                updateDoc(doc(db, "users", user.uid), {
                    isSeller: true,
                    phoneNumber: formData.phoneNumber,
                    updatedAt: serverTimestamp()
                }),
                timeout(10000)
            ]);

            await Promise.race([
                setDoc(doc(db, "sellers", user.uid), {
                    accountBalance: 100,
                    totalEarnings: 100,
                    booksSold: 0,
                    bankDetails: {
                        bankName: formData.bankName,
                        bankCode: formData.bankCode, // ✅ ADDED
                        accountNumber: formData.accountNumber,
                        accountName: formData.accountName
                    },
                    businessInfo: {
                        businessName: formData.businessName || `${formData.firstName} ${formData.surname}`,
                        businessDescription: formData.businessDescription
                    },
                    createdAt: serverTimestamp(),
                    status: "active"
                }),
                timeout(10000)
            ]);

            alert("Seller account created successfully! 🎉");
            router.push('/my-account/seller-account');
        } catch (error) {
            console.error("Error creating seller account:", error);

            if (error.message === 'Operation timeout') {
                alert("Request timed out. Please check your internet connection and try again.");
            } else if (error.code === 'unavailable') {
                alert("Firestore is currently unavailable. Please check your internet connection.");
            } else {
                alert("Failed to create seller account: " + error.message);
            }
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

                    <div className="mb-8">
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
                                    I agree to the Terms and Conditions and understand that: I will receive 80% of each sale amount, 20% commission goes to platform maintenance, minimum withdrawal amount is ₦1,000, and withdrawals are processed within 3-5 business days.
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
            </main>
        </div>
    );
}