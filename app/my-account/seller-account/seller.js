"use client";
import React, { useState, useEffect } from "react";
import { DollarSign, TrendingUp, ShoppingBag, CreditCard, Download, Book, Globe, Settings, X, Camera, Save, Mail, CheckCircle, AlertCircle, ChevronRight, User, MapPin, Phone, Calendar, Building } from "lucide-react";
import Link from "next/link";
import { auth, db } from "@/lib/firebaseConfig";
import { doc, getDoc, updateDoc, collection, query, where, getDocs, addDoc, serverTimestamp, increment, setDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";
import Navbar from "@/components/NavBar";

const nigerianBanks = [
    { name: "Access Bank", code: "044" },
    { name: "Citibank", code: "023" },
    { name: "Ecobank Nigeria", code: "050" },
    { name: "Fidelity Bank", code: "070" },
    { name: "First Bank of Nigeria", code: "011" },
    { name: "First City Monument Bank (FCMB)", code: "214" },
    { name: "Globus Bank", code: "00103" },
    { name: "Guaranty Trust Bank (GTBank)", code: "058" },
    { name: "Heritage Bank", code: "030" },
    { name: "Keystone Bank", code: "082" },
    { name: "Kuda Bank", code: "50211" },
    { name: "Opay", code: "999992" },
    { name: "Palmpay", code: "999991" },
    { name: "Parallex Bank", code: "526" },
    { name: "Polaris Bank", code: "076" },
    { name: "Providus Bank", code: "101" },
    { name: "Stanbic IBTC Bank", code: "221" },
    { name: "Standard Chartered Bank", code: "068" },
    { name: "Sterling Bank", code: "232" },
    { name: "SunTrust Bank", code: "100" },
    { name: "Union Bank of Nigeria", code: "032" },
    { name: "United Bank for Africa (UBA)", code: "033" },
    { name: "Unity Bank", code: "215" },
    { name: "Wema Bank", code: "035" },
    { name: "Zenith Bank", code: "057" },
];

export default function SellerAccountClient() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [accountBalance, setAccountBalance] = useState(0);
    const [totalEarnings, setTotalEarnings] = useState(0);
    const [booksSold, setBooksSold] = useState(0);
    const [transactions, setTransactions] = useState([]);
    const [withdrawals, setWithdrawals] = useState([]);
    const [showWithdrawModal, setShowWithdrawModal] = useState(false);
    const [showProfileModal, setShowProfileModal] = useState(false);
    const [showTransactionHistory, setShowTransactionHistory] = useState(false);
    const [withdrawAmount, setWithdrawAmount] = useState("");
    const [withdrawing, setWithdrawing] = useState(false);
    const [withdrawalError, setWithdrawalError] = useState("");
    const router = useRouter();
    const [showBankModal, setShowBankModal] = useState(false);
    const [bankFormData, setBankFormData] = useState({
        accountName: "",
        accountNumber: "",
        bankName: "",
        bankCode: ""
    });
    const [savingBank, setSavingBank] = useState(false);
    const [formData, setFormData] = useState({
        firstName: "",
        surname: "",
        dateOfBirth: "",
        phone: "",
        address: ""
    });

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
            const userDoc = await getDoc(doc(db, "users", uid));

            if (userDoc.exists()) {
                const userData = userDoc.data();

                if (!userData.isSeller) {
                    router.push('/my-account');
                    return;
                }

                //  Redirect regular users trying to access seller account
                if (userData.isSeller && window.location.pathname === '/my-account') {
                    router.push('/my-account/seller-account');
                    return;
                }

                const sellerDoc = await getDoc(doc(db, "sellers", uid));
                let bankDetails = null;

                if (sellerDoc.exists()) {
                    const sellerData = sellerDoc.data();
                    bankDetails = sellerData.bankDetails || null;

                    setAccountBalance(sellerData.accountBalance || 0);
                    setTotalEarnings(sellerData.totalEarnings || 0);
                    setBooksSold(sellerData.booksSold || 0);
                } else {
                    const sellerDocRef = doc(db, "sellers", uid);
                    await setDoc(sellerDocRef, {
                        sellerId: uid,
                        sellerEmail: userData.email,
                        sellerName: userData.displayName || `${userData.firstName} ${userData.surname}`,
                        accountBalance: 0,
                        totalEarnings: 0,
                        booksSold: 0,
                        totalWithdrawn: 0,
                        createdAt: serverTimestamp(),
                        updatedAt: serverTimestamp()
                    });

                    setAccountBalance(0);
                    setTotalEarnings(0);
                    setBooksSold(0);
                }

                setUser({
                    uid,
                    ...userData,
                    bankDetails
                });

                setFormData({
                    firstName: userData.firstName || "",
                    surname: userData.surname || "",
                    dateOfBirth: userData.dateOfBirth || "",
                    phone: userData.phone || "",
                    address: userData.address || ""
                });

                await fetchSellerTransactions(uid);
            }
        } catch (error) {
            console.error("Error fetching user data:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchSellerTransactions = async (uid) => {
        try {
            let allTransactions = [];

            const transactionsQuery = query(
                collection(db, "transactions"),
                where("sellerId", "==", uid)
            );

            const transactionsSnapshot = await getDocs(transactionsQuery);
            const txnsFromCollection = transactionsSnapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    ...data,
                    bookTitle: data.bookTitle || data.title,
                    createdAtDate: data.createdAt?.toDate?.() || (data.purchaseDate ? new Date(data.purchaseDate) : new Date())
                };
            });

            allTransactions = [...txnsFromCollection];

            const usersSnapshot = await getDocs(collection(db, "users"));

            usersSnapshot.docs.forEach(userDoc => {
                const userData = userDoc.data();
                const purchasedBooks = userData.purchasedBooks || {};

                Object.values(purchasedBooks).forEach(purchase => {
                    if (purchase.sellerId === uid) {
                        const existingTxn = allTransactions.find(
                            t => t.id === purchase.transactionId ||
                                t.bookTitle === purchase.title && t.buyerEmail === userData.email
                        );

                        if (!existingTxn) {
                            allTransactions.push({
                                id: purchase.transactionId || `purchase-${purchase.bookId}-${userDoc.id}`,
                                bookTitle: purchase.title,
                                buyerName: userData.displayName || `${userData.firstName || ''} ${userData.surname || ''}`.trim() || 'Unknown Buyer',
                                buyerEmail: userData.email,
                                amount: purchase.amount,
                                sellerAmount: purchase.amount * 0.85,
                                sellerId: purchase.sellerId,
                                sellerName: purchase.sellerName,
                                createdAtDate: purchase.purchaseDate ? new Date(purchase.purchaseDate) : new Date(),
                                source: 'purchasedBooks'
                            });
                        }
                    }
                });
            });

            allTransactions.sort((a, b) => b.createdAtDate - a.createdAtDate);
            setTransactions(allTransactions);

            const withdrawalsQuery = query(
                collection(db, "withdrawals"),
                where("sellerId", "==", uid)
            );
            const withdrawalsSnapshot = await getDocs(withdrawalsQuery);
            const withdrawalsList = withdrawalsSnapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    ...data,
                    requestedAtDate: data.requestedAt?.toDate?.() || new Date()
                };
            });

            withdrawalsList.sort((a, b) => b.requestedAtDate - a.requestedAtDate);
            setWithdrawals(withdrawalsList);

            if (allTransactions.length > 0) {
                const calculatedEarnings = allTransactions.reduce((sum, txn) => {
                    const earning = txn.sellerAmount || (txn.amount * 0.85);
                    return sum + earning;
                }, 0);
                const calculatedBooksSold = allTransactions.length;

                const totalWithdrawn = withdrawalsList
                    .filter(w => w.status === 'completed')
                    .reduce((sum, w) => sum + (w.amount || 0), 0);

                const calculatedBalance = calculatedEarnings - totalWithdrawn;

                setTotalEarnings(calculatedEarnings);
                setBooksSold(calculatedBooksSold);
                setAccountBalance(calculatedBalance);

                const sellerDocRef = doc(db, "sellers", uid);
                const sellerDoc = await getDoc(sellerDocRef);

                if (sellerDoc.exists()) {
                    const currentData = sellerDoc.data();

                    const needsUpdate =
                        Math.abs(currentData.totalEarnings - calculatedEarnings) > 0.01 ||
                        currentData.booksSold !== calculatedBooksSold ||
                        Math.abs((currentData.accountBalance || 0) - calculatedBalance) > 0.01;

                    if (needsUpdate) {
                        await updateDoc(sellerDocRef, {
                            totalEarnings: calculatedEarnings,
                            booksSold: calculatedBooksSold,
                            accountBalance: calculatedBalance,
                            updatedAt: serverTimestamp()
                        });
                    }
                }
            }

        } catch (error) {
            console.error("Error fetching transactions:", error);
        }
    };

    const handleSaveBank = async () => {
        // Validate
        if (!bankFormData.accountName || !bankFormData.accountNumber || !bankFormData.bankName) {
            alert("Please fill in all required fields");
            return;
        }

        try {
            setSavingBank(true);

            // Update seller document
            await updateDoc(doc(db, "sellers", user.uid), {
                bankDetails: bankFormData,
                updatedAt: serverTimestamp()
            });

            // Also update user document for easy access
            await updateDoc(doc(db, "users", user.uid), {
                bankDetails: bankFormData
            });

            // Update local state
            setUser((prev) => ({
                ...prev,
                bankDetails: bankFormData
            }));

            setShowBankModal(false);
            alert("Bank details updated successfully!");

        } catch (error) {
            console.error("Error saving bank details:", error);
            alert("Failed to save bank details: " + error.message);
        } finally {
            setSavingBank(false);
        }
    };

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (!file || !file.type.startsWith("image/")) return;

        const reader = new FileReader();
        setUploading(true);

        reader.onloadend = async () => {
            try {
                await updateDoc(doc(db, "users", user.uid), {
                    photoBase64: reader.result
                });
                setUser((prev) => ({ ...prev, photoBase64: reader.result }));
            } catch (error) {
                alert("Failed to update image");
            } finally {
                setUploading(false);
            }
        };
        reader.readAsDataURL(file);
    };

    const handleSave = async () => {
        try {
            await updateDoc(doc(db, "users", user.uid), {
                ...formData,
                displayName: `${formData.firstName} ${formData.surname}`
            });
            setUser((prev) => ({ ...prev, ...formData, displayName: `${formData.firstName} ${formData.surname}` }));
            setIsEditing(false);
        } catch (error) {
            alert("Failed to save profile");
        }
    };

    const handleWithdraw = async () => {
        const amount = parseFloat(withdrawAmount);
        setWithdrawalError("");

        if (!amount || isNaN(amount)) {
            setWithdrawalError("Please enter a valid amount");
            return;
        }

        if (amount < 1000) {
            setWithdrawalError("Minimum withdrawal amount is ₦1,000");
            return;
        }

        if (amount > accountBalance) {
            setWithdrawalError(`Insufficient balance. Available: ₦${accountBalance.toLocaleString()}`);
            return;
        }

        if (!user?.bankDetails) {
            setWithdrawalError("Please add bank details first");
            return;
        }

        try {
            setWithdrawing(true);

            // ✅ IMPROVED: More unique reference with timestamp + random string
            const timestamp = Date.now();
            const randomStr = Math.random().toString(36).substring(2, 9);
            const userShort = user.uid.substring(0, 6);
            const withdrawalRef = `WD-${timestamp}-${randomStr}-${userShort}`;

            const withdrawalData = {
                sellerId: user.uid,
                sellerName: user.displayName || `${user.firstName} ${user.surname}`,
                sellerEmail: user.email,
                sellerPhone: user.phone || user.phoneNumber || null,
                amount: amount,
                status: "pending",
                requestedAt: serverTimestamp(),
                processedAt: null,
                reference: withdrawalRef,
                bankDetails: {
                    accountName: user.bankDetails.accountName,
                    accountNumber: user.bankDetails.accountNumber,
                    bankName: user.bankDetails.bankName,
                    bankCode: user.bankDetails.bankCode || null,
                },
                flutterwaveTransferId: null,
                processingMethod: "admin_approval_required",
                processingNote: "Awaiting admin approval",
            };

            await addDoc(collection(db, "withdrawals"), withdrawalData);

            await updateDoc(doc(db, "sellers", user.uid), {
                lastWithdrawalRequestDate: serverTimestamp(),
                updatedAt: serverTimestamp()
            });

            setWithdrawAmount("");
            setShowWithdrawModal(false);

            alert(`✅ Withdrawal request submitted!\n\nAmount: ₦${amount.toLocaleString()}\nReference: ${withdrawalRef}\n\nYour request is pending admin approval. You will be notified once processed.`);

            await fetchSellerTransactions(user.uid);

        } catch (error) {
            console.error("Withdrawal error:", error);
            setWithdrawalError("Failed to submit withdrawal request: " + error.message);
        } finally {
            setWithdrawing(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 text-blue-950 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin h-12 w-12 border-b-2 border-blue-950 rounded-full mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading...</p>
                </div>
            </div>
        );
    }

    const handleButton = () => {
        router.push("/lan/net/help-center")
    }
    const handleGo = () => {
        router.push("/advertise")
    }

    return (
        <div className="min-h-screen bg-gray-100">
            <Navbar />

            {/* Main Container - Responsive Layout */}
            <div className="max-w-7xl mx-auto px-4 py-6">
                {/* Header */}
                <div className="bg-white rounded-xl shadow-sm px-4 sm:px-6 py-4 mb-6">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setShowProfileModal(true)}
                                className="relative flex items-center gap-3 hover:opacity-80 transition-opacity"
                            >
                                <img
                                    src={user?.photoBase64 || "/lan-logo.png"}
                                    className="w-12 h-12 lg:w-14 lg:h-14 rounded-full object-cover border-2 border-blue-950"
                                    alt="Profile"
                                />
                                <div>
                                    <p className="text-sm lg:text-base font-semibold text-blue-950">Hi, {user?.firstName || 'Seller'}</p>
                                    <p className="text-xs text-gray-500">Verified Seller</p>
                                </div>
                            </button>
                        </div>
                        <div className="bg-blue-950 rounded-xl shadow-sm px-4 sm:px-6 py-3 sm:py-4 grid grid-cols-1 gap-2 lg:flex lg:gap-2 w-full sm:w-auto">
                            <button
                                onClick={handleButton}
                                className="bg-pink-500 hover:bg-pink-600 text-white text-xs lg:text-sm font-bold px-4 py-2 rounded-full transition-colors whitespace-nowrap"
                            >
                                HELP
                            </button>
                            {user?.role === 'student' && (
                                <Link href="/student/dashboard">
                                    <button className="bg-green-600 hover:bg-green-700 text-white text-xs lg:text-sm font-bold px-4 py-2 rounded-full transition-colors whitespace-nowrap w-full">
                                        Student Dashboard
                                    </button>
                                </Link>
                            )}
                        </div>
                    </div>
                </div>

                {/* Desktop Grid Layout - Mobile Stack */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column - Balance & Actions */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Balance Card */}
                        <div className="bg-gradient-to-br from-blue-950 to-blue-800 rounded-2xl p-6 shadow-lg text-white">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-2">
                                    <DollarSign size={20} />
                                    <span className="font-semibold">Available Balance</span>
                                </div>
                                <button
                                    onClick={() => setShowTransactionHistory(true)}
                                    className="text-sm font-medium flex items-center gap-1 hover:opacity-80"
                                >
                                    History <ChevronRight size={16} />
                                </button>
                            </div>

                            <div className="flex items-end justify-between">
                                <div>
                                    <p className="text-4xl lg:text-5xl font-bold mb-2">₦{accountBalance.toLocaleString()}</p>
                                    <p className="text-sm text-blue-200">Total earnings: ₦{totalEarnings.toLocaleString()}</p>
                                </div>
                                <button
                                    onClick={() => setShowWithdrawModal(true)}
                                    disabled={accountBalance < 1000}
                                    className="bg-white text-blue-950 px-6 py-3 rounded-xl font-bold hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Withdraw
                                </button>
                            </div>
                        </div>

                        {/* Stats Grid */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-white rounded-xl p-6  shadow-sm">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="bg-blue-100 p-3 rounded-lg">
                                        <TrendingUp size={24} className="text-blue-950 " />
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600">Total Earnings</p>
                                        <p className="text-2xl font-bold text-blue-950">₦{totalEarnings.toLocaleString()}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-white rounded-xl p-6 shadow-sm">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="bg-green-100 p-3 rounded-lg">
                                        <ShoppingBag size={24} className="text-green-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600">Documents Sold</p>
                                        <p className="text-2xl font-bold text-blue-950">{booksSold}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Recent Transactions */}
                        <div className="bg-white rounded-xl shadow-sm p-6">
                            <h3 className="font-bold text-lg text-blue-950 mb-4">Recent Transactions</h3>
                            <div className="space-y-3">
                                {transactions.slice(0, 5).map((txn) => (
                                    <div key={txn.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className="bg-blue-100 p-2 rounded-lg">
                                                <ShoppingBag size={20} className="text-blue-950" />
                                            </div>
                                            <div>
                                                <p className="font-semibold text-blue-950 text-sm lg:text-base">{txn.bookTitle}</p>
                                                <p className="text-xs text-gray-500">{txn.createdAtDate?.toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-green-600 font-bold">+₦{(txn.sellerAmount || (txn.amount * 0.85)).toLocaleString()}</p>
                                            <p className="text-xs text-gray-500">Success</p>
                                        </div>
                                    </div>
                                ))}
                                {transactions.length === 0 && (
                                    <div className="text-center py-8">
                                        <ShoppingBag size={48} className="mx-auto text-gray-300 mb-3" />
                                        <p className="text-gray-500">No transactions yet</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right Column - Quick Actions & Bonus */}
                    <div className="space-y-6">
                        {/* Quick Actions */}
                        <div className="bg-white rounded-xl shadow-sm p-6">
                            <h3 className="font-bold text-lg text-blue-950 mb-4">Quick Actions</h3>
                            <div className="space-y-3">
                                <Link href="/my-account/seller-account/my-books" className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
                                    <div className="bg-blue-950 p-3 rounded-lg">
                                        <Book className="text-white" size={20} />
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-semibold text-blue-950">My documents</p>
                                        <p className="text-xs text-gray-600">View uploaded documents</p>
                                    </div>
                                    <ChevronRight size={20} className="text-gray-400" />
                                </Link>

                                <Link href="/documents" className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
                                    <div className="bg-blue-950 p-3 rounded-lg">
                                        <Globe className="text-white" size={20} />
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-semibold text-blue-950">Browse documents</p>
                                        <p className="text-xs text-gray-600">Explore library</p>
                                    </div>
                                    <ChevronRight size={20} className="text-gray-400" />
                                </Link>

                                <Link href="/advertise" className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
                                    <div className="bg-blue-950 p-3 rounded-lg">
                                        <TrendingUp className="text-white" size={20} />
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-semibold text-blue-950">Upload documents</p>
                                        <p className="text-xs text-gray-600">Add new document</p>
                                    </div>
                                    <ChevronRight size={20} className="text-gray-400" />
                                </Link>
                            </div>
                        </div>

                        {/* Special Bonus */}
                        <div className="bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl p-6 text-white">
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="font-bold text-lg">Special Bonus</h3>
                                <span className="text-xs bg-white/20 px-3 py-1 rounded-full font-semibold">Up to 6%</span>
                            </div>
                            <div className="mb-4">
                                <div className="bg-white/20 p-3 rounded-lg inline-block mb-2">
                                    <TrendingUp size={24} />
                                </div>
                                <p className="text-2xl font-bold mb-1">Up to ₦5,000,000</p>
                                <p className="text-sm text-purple-100">Earn more by selling more books</p>
                            </div>
                            <button
                                onClick={handleGo}
                                className="w-full bg-white text-purple-600 font-bold py-3 rounded-xl hover:bg-gray-100 transition-colors"
                            >
                                Get Started
                            </button>
                        </div>

                        {/* Bank Details Card */}
                        {user?.bankDetails && (
                            <div className="bg-white rounded-xl shadow-sm p-6">
                                <h3 className="font-bold text-lg text-blue-950 mb-4">Bank Details</h3>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Account Name:</span>
                                        <span className="font-semibold text-blue-950">{user.bankDetails.accountName}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Account Number:</span>
                                        <span className="font-semibold text-blue-950">{user.bankDetails.accountNumber}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Bank:</span>
                                        <span className="font-semibold text-blue-950">{user.bankDetails.bankName}</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Profile Modal */}
            {showProfileModal && (
                <div className="fixed inset-0 bg-white z-50 flex flex-col">
                    <div className="bg-blue-950 p-6 text-center relative">
                        <button
                            onClick={() => setShowProfileModal(false)}
                            className="absolute top-4 right-4 text-gray-50 hover:text-gray-300"
                        >
                            <X size={24} />
                        </button>
                        <Link href="/my-account">
                            <div className="flex flex-col items-center">
                                <div className="relative mb-3">
                                    <img
                                        src={user?.photoBase64 || "/lan-logo.png"}
                                        className="w-20 h-20 rounded-full object-cover border-4 border-white"
                                        alt="Profile"
                                    />
                                </div>
                                <p className="text-2xl font-bold text-gray-50">{user?.displayName || `${user?.firstName} ${user?.surname}`}</p>
                                <p className="text-sm text-gray-300">+234{user?.phone || '0000000000'}</p>
                            </div>
                        </Link>
                    </div>

                    <div className="flex-1 bg-gray-100 overflow-y-auto">
                        <div className="p-4 space-y-2">
                            <button
                                onClick={() => {
                                    setShowProfileModal(false);
                                    setIsEditing(true);
                                }}
                                className="w-full bg-blue-950 rounded-xl p-4 flex items-center justify-between hover:bg-blue-900 transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="bg-white p-2 rounded-lg">
                                        <User size={20} className="text-blue-950" />
                                    </div>
                                    <span className="font-semibold text-white">My Profile</span>
                                </div>
                                <ChevronRight size={20} className="text-gray-300" />
                            </button>

                            <button
                                onClick={() => {
                                    setShowProfileModal(false);
                                    setShowBankModal(true);
                                    // Pre-fill form with existing bank details
                                    if (user?.bankDetails) {
                                        setBankFormData({
                                            accountName: user.bankDetails.accountName || "",
                                            accountNumber: user.bankDetails.accountNumber || "",
                                            bankName: user.bankDetails.bankName || "",
                                            bankCode: user.bankDetails.bankCode || ""
                                        });
                                    }
                                }}
                                className="w-full bg-blue-950 rounded-xl p-4 flex items-center justify-between hover:bg-blue-900 transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="bg-white p-2 rounded-lg">
                                        <Building size={20} className="text-blue-950" />
                                    </div>
                                    <span className="font-semibold text-white">Bank Details</span>
                                </div>
                                <ChevronRight size={20} className="text-gray-300" />
                            </button>

                            <div className="w-full bg-blue-950 rounded-xl p-4">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-white p-2 rounded-lg">
                                            <Settings size={20} className="text-blue-950" />
                                        </div>
                                        <span className="font-semibold text-white">Other Information</span>
                                    </div>
                                </div>
                                <div className="space-y-3 pl-11 text-sm text-white">
                                    <div className="flex justify-between py-2 border-b border-blue-800">
                                        <span className="text-gray-300">Email</span>
                                        <span className="text-right break-all">{user?.email}</span>
                                    </div>
                                    <div className="flex justify-between py-2 border-b border-blue-800">
                                        <span className="text-gray-300">Date of Birth</span>
                                        <span>{user?.dateOfBirth || 'Not set'}</span>
                                    </div>
                                    <div className="flex justify-between py-2 border-b border-blue-800">
                                        <span className="text-gray-300">Address</span>
                                        <span className="text-right">{user?.address || 'Not set'}</span>
                                    </div>
                                    <div className="flex justify-between py-2">
                                        <span className="text-gray-300">Account Type</span>
                                        <span className="bg-white text-blue-950 px-2 py-1 rounded font-semibold text-xs">Verified Seller</span>
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={handleButton}
                                className="w-full bg-blue-950 rounded-xl p-4 flex items-center justify-between hover:bg-blue-900 transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="bg-white p-2 rounded-lg">
                                        <AlertCircle size={20} className="text-blue-950" />
                                    </div>
                                    <span className="font-semibold text-white">Help</span>
                                </div>
                                <ChevronRight size={20} className="text-gray-300" />
                            </button>

                            <button
                                onClick={() => {
                                    setShowProfileModal(false);
                                    setShowTransactionHistory(true);
                                }}
                                className="w-full bg-blue-950 rounded-xl p-4 flex items-center justify-between hover:bg-blue-900 transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="bg-white p-2 rounded-lg">
                                        <TrendingUp size={20} className="text-blue-950" />
                                    </div>
                                    <span className="font-semibold text-white">History</span>
                                </div>
                                <ChevronRight size={20} className="text-gray-300" />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Transaction History Modal */}
            {showTransactionHistory && (
                <div className="fixed inset-0 bg-white z-50 flex flex-col">
                    <div className="bg-blue-950 p-4 flex items-center gap-4 text-white">
                        <button onClick={() => setShowTransactionHistory(false)}>
                            <X size={24} />
                        </button>
                        <h2 className="text-xl font-bold">Transaction History</h2>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 bg-gray-100">
                        {transactions.length === 0 ? (
                            <div className="text-center py-12">
                                <ShoppingBag size={48} className="mx-auto text-gray-400 mb-4" />
                                <p className="text-gray-600">No transactions yet</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {transactions.map((txn) => (
                                    <div key={txn.id} className="bg-white rounded-xl p-4 shadow-sm">
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="flex items-center gap-3">
                                                <div className="bg-blue-100 p-2 rounded-lg">
                                                    <ShoppingBag size={18} className="text-blue-950" />
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-blue-950">{txn.bookTitle}</p>
                                                    <p className="text-xs text-gray-500">
                                                        {txn.createdAtDate?.toLocaleDateString()} at {txn.createdAtDate?.toLocaleTimeString()}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-green-600 font-bold">
                                                    +₦{(txn.sellerAmount || (txn.amount * 0.85)).toLocaleString()}
                                                </p>
                                                <p className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded">Success</p>
                                            </div>
                                        </div>
                                        <div className="bg-gray-50 rounded-lg p-3 text-sm space-y-1">
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Buyer:</span>
                                                <span className="text-blue-950 font-medium">{txn.buyerName}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Price:</span>
                                                <span className="text-blue-950 font-medium">₦{txn.amount?.toLocaleString()}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Platform Fee (15%):</span>
                                                <span className="text-red-600 font-medium">-₦{((txn.amount || 0) * 0.15).toLocaleString()}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {withdrawals.length > 0 && (
                            <div className="mt-6">
                                <h3 className="font-bold text-lg mb-3 text-blue-950">Withdrawal History</h3>
                                <div className="space-y-3">
                                    {withdrawals.map((w) => (
                                        <div key={w.id} className="bg-white rounded-xl p-4 shadow-sm">
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center gap-3">
                                                    <div className={`p-2 rounded-lg ${w.status === 'pending' ? 'bg-yellow-100' :
                                                        w.status === 'completed' ? 'bg-red-100' :
                                                            w.status === 'rejected' ? 'bg-red-100' :
                                                                'bg-gray-100'
                                                        }`}>
                                                        <Download size={18} className={
                                                            w.status === 'pending' ? 'text-yellow-600' :
                                                                w.status === 'completed' ? 'text-red-600' :
                                                                    w.status === 'rejected' ? 'text-red-600' :
                                                                        'text-gray-600'
                                                        } />
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-blue-950">Withdrawal Request</p>
                                                        <p className="text-xs text-gray-500">
                                                            {w.requestedAtDate?.toLocaleDateString()} at {w.requestedAtDate?.toLocaleTimeString()}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-red-600 font-bold">₦{w.amount?.toLocaleString()}</p>
                                                    <p className={`text-xs px-2 py-1 rounded ${w.status === 'pending' ? 'text-yellow-600 bg-yellow-50' :
                                                        w.status === 'completed' ? 'text-green-600 bg-green-50' :
                                                            w.status === 'rejected' ? 'text-red-600 bg-red-50' :
                                                                'text-gray-600 bg-gray-50'
                                                        }`}>
                                                        {w.status === 'pending' ? '⏳ Pending Approval' :
                                                            w.status === 'completed' ? '✅ Completed' :
                                                                w.status === 'rejected' ? '❌ Rejected' : w.status}
                                                    </p>
                                                </div>
                                            </div>
                                            {w.reference && (
                                                <p className="text-xs text-gray-500 mt-2 bg-gray-50 p-2 rounded">
                                                    Ref: {w.reference}
                                                </p>
                                            )}
                                            {w.adminNote && (
                                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-2 mt-2">
                                                    <p className="text-xs font-semibold text-blue-900 mb-1">Admin Note:</p>
                                                    <p className="text-xs text-blue-700">{w.adminNote}</p>
                                                </div>
                                            )}
                                            {w.status === 'pending' && (
                                                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-2 mt-2">
                                                    <p className="text-xs text-yellow-700">
                                                        ⏳ Your withdrawal request is being reviewed by our team. You'll receive an email notification once it's processed.
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Withdraw Modal */}
            {showWithdrawModal && (
                <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center">
                    <div className="bg-white w-full h-full md:h-auto md:max-w-2xl overflow-y-auto">
                        <div className="sticky top-0 bg-blue-950 px-6 py-4 flex justify-between items-center text-white">
                            <h2 className="text-2xl font-bold">Withdraw Funds</h2>
                            <button onClick={() => {
                                setShowWithdrawModal(false);
                                setWithdrawalError("");
                                setWithdrawAmount("");
                            }}>
                                <X size={24} />
                            </button>
                        </div>

                        <div className="p-6 border-b border-gray-200">
                            <div className="flex items-center gap-2 text-yellow-600 mb-2">
                                <AlertCircle size={18} />
                                <p className="text-sm font-semibold">Admin Approval Required</p>
                            </div>
                            <p className="text-xs text-gray-600 mt-2">
                                Your withdrawal request will be reviewed and processed within 24-48 hours. You'll receive an email notification once approved.
                            </p>
                        </div>
                        {user?.bankDetails ? (
                            <div className="p-6 border-b border-gray-200 bg-blue-50">
                                <p className="text-sm font-semibold text-gray-700 mb-2">Withdrawal will be sent to:</p>
                                <div className="space-y-1 text-sm text-gray-600">
                                    <p><strong>Account Name:</strong> {user.bankDetails.accountName}</p>
                                    <p><strong>Account Number:</strong> {user.bankDetails.accountNumber}</p>
                                    <p><strong>Bank:</strong> {user.bankDetails.bankName}</p>
                                </div>
                            </div>
                        ) : (
                            <div className="p-6 border-b border-gray-200 bg-yellow-50">
                                <div className="flex items-start gap-2">
                                    <AlertCircle size={18} className="text-yellow-600 flex-shrink-0 mt-0.5" />
                                    <p className="text-sm text-yellow-600">Please add bank details to your profile first</p>
                                </div>
                            </div>
                        )}

                        <div className="p-6">
                            <div className="bg-blue-950 p-4 rounded-xl mb-4">
                                <p className="text-sm text-gray-300">Available Balance</p>
                                <p className="text-3xl font-bold text-white">₦{accountBalance.toLocaleString()}</p>
                            </div>

                            {withdrawalError && (
                                <div className="mb-4 bg-red-50 border border-red-200 rounded-xl p-3 flex items-start gap-2">
                                    <AlertCircle size={18} className="text-red-600 flex-shrink-0 mt-0.5" />
                                    <p className="text-sm text-red-600">{withdrawalError}</p>
                                </div>
                            )}

                            <label className="font-semibold block mb-2 text-gray-700">Amount</label>
                            <input
                                type="number"
                                value={withdrawAmount}
                                onChange={(e) => {
                                    setWithdrawAmount(e.target.value);
                                    setWithdrawalError("");
                                }}
                                placeholder="Enter amount"
                                className="w-full bg-white text-blue-950 border-2 border-gray-300 px-4 py-3 rounded-xl mb-2 focus:border-blue-950 focus:outline-none"
                                min="1000"
                                max={accountBalance}
                            />
                            <p className="text-sm text-gray-600 mb-4">Minimum: ₦1,000</p>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => {
                                        setShowWithdrawModal(false);
                                        setWithdrawalError("");
                                        setWithdrawAmount("");
                                    }}
                                    className="flex-1 bg-gray-200 text-gray-700 px-6 py-3 rounded-xl font-semibold hover:bg-gray-300 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleWithdraw}
                                    disabled={withdrawing || !user?.bankDetails}
                                    className="flex-1 bg-blue-950 text-white px-6 py-3 rounded-xl font-bold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 hover:bg-blue-900 transition-colors"
                                >
                                    {withdrawing ? (
                                        <>
                                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                            Processing...
                                        </>
                                    ) : (
                                        <>
                                            <Download size={18} />
                                            Withdraw Now
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Profile Modal */}
            {isEditing && (
                <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center">
                    <div className="bg-white w-full h-full md:h-auto md:max-w-2xl overflow-y-auto">
                        <div className="sticky top-0 bg-blue-950 px-6 py-4 flex justify-between items-center text-white">
                            <h2 className="text-2xl font-bold">Edit Profile</h2>
                            <button onClick={() => setIsEditing(false)}><X size={24} /></button>
                        </div>
                        <div className="p-6">
                            <div className="flex justify-center mb-6">
                                <div className="relative">
                                    <img src={user?.photoBase64 || "/api/placeholder/128/128"} className="w-32 h-32 rounded-full border-4 border-blue-950 object-cover" alt="profile" />
                                    <label className="absolute bottom-0 right-0 bg-blue-950 p-3 rounded-full cursor-pointer hover:bg-blue-900">
                                        <Camera size={18} className="text-white" />
                                        <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                                    </label>
                                </div>
                            </div>
                            <div className="grid sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="font-semibold block mb-2 text-gray-700">First Name</label>
                                    <input value={formData.firstName} onChange={(e) => setFormData({ ...formData, firstName: e.target.value })} className="w-full bg-white text-blue-950 border-2 border-gray-300 px-4 py-3 rounded-xl focus:border-blue-950 focus:outline-none" />
                                </div>
                                <div>
                                    <label className="font-semibold block mb-2 text-gray-700">Surname</label>
                                    <input value={formData.surname} onChange={(e) => setFormData({ ...formData, surname: e.target.value })} className="w-full bg-white text-blue-950 border-2 border-gray-300 px-4 py-3 rounded-xl focus:border-blue-950 focus:outline-none" />
                                </div>
                                <div>
                                    <label className="font-semibold block mb-2 text-gray-700">Phone</label>
                                    <input value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="w-full bg-white text-blue-950 border-2 border-gray-300 px-4 py-3 rounded-xl focus:border-blue-950 focus:outline-none" />
                                </div>
                                <div>
                                    <label className="font-semibold block mb-2 text-gray-700">Date of Birth</label>
                                    <input type="date" value={formData.dateOfBirth} onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })} className="w-full bg-white text-blue-950 border-2 border-gray-300 px-4 py-3 rounded-xl focus:border-blue-950 focus:outline-none" />
                                </div>
                                <div className="sm:col-span-2">
                                    <label className="font-semibold block mb-2 text-gray-700">Address</label>
                                    <input value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} className="w-full bg-white text-blue-950 border-2 border-gray-300 px-4 py-3 rounded-xl focus:border-blue-950 focus:outline-none" />
                                </div>
                            </div>
                            <div className="mt-6 flex gap-3">
                                <button onClick={() => setIsEditing(false)} className="flex-1 bg-gray-200 text-gray-700 px-6 py-3 rounded-xl font-semibold hover:bg-gray-300">Cancel</button>
                                <button onClick={handleSave} className="flex-1 bg-blue-950 text-white px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-blue-900">
                                    <Save size={18} />Save
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Bank Details Modal */}
            {showBankModal && (
                <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center">
                    <div className="bg-white w-full h-full md:h-auto md:max-w-2xl md:rounded-2xl overflow-y-auto">
                        <div className="sticky top-0 bg-blue-950 px-6 py-4 flex justify-between items-center md:rounded-t-2xl text-white">
                            <h2 className="text-2xl font-bold">Bank Details</h2>
                            <button
                                onClick={() => {
                                    setShowBankModal(false);
                                    setBankFormData({
                                        accountName: "",
                                        accountNumber: "",
                                        bankName: "",
                                        bankCode: ""
                                    });
                                }}
                            >
                                <X size={24} />
                            </button>
                        </div>

                        <div className="p-6">
                            {user?.bankDetails && (
                                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
                                    <p className="text-sm font-semibold text-blue-900 mb-3">Current Bank Details:</p>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Account Name:</span>
                                            <span className="font-semibold text-blue-950">{user.bankDetails.accountName}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Account Number:</span>
                                            <span className="font-semibold text-blue-950">{user.bankDetails.accountNumber}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Bank:</span>
                                            <span className="font-semibold text-blue-950">{user.bankDetails.bankName}</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="space-y-4">
                                <div>
                                    <label className="font-semibold block mb-2 text-gray-700">
                                        Account Name <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={bankFormData.accountName}
                                        onChange={(e) => setBankFormData({ ...bankFormData, accountName: e.target.value })}
                                        placeholder="Enter account holder name"
                                        className="w-full bg-white text-blue-950 border-2 border-gray-300 px-4 py-3 rounded-xl focus:border-blue-950 focus:outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="font-semibold block mb-2 text-gray-700">
                                        Account Number <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={bankFormData.accountNumber}
                                        onChange={(e) => setBankFormData({ ...bankFormData, accountNumber: e.target.value })}
                                        placeholder="Enter account number"
                                        className="w-full bg-white text-blue-950 border-2 border-gray-300 px-4 py-3 rounded-xl focus:border-blue-950 focus:outline-none"
                                        maxLength="10"
                                    />
                                </div>

                                <div>
                                    <label className="font-semibold block mb-2 text-gray-700">
                                        Bank Name <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        value={bankFormData.bankName}
                                        onChange={(e) => {
                                            const selectedBank = nigerianBanks.find(bank => bank.name === e.target.value);
                                            setBankFormData({
                                                ...bankFormData,
                                                bankName: e.target.value,
                                                bankCode: selectedBank ? selectedBank.code : ""
                                            });
                                        }}
                                        className="w-full bg-white text-blue-950 border-2 border-gray-300 px-4 py-3 rounded-xl focus:border-blue-950 focus:outline-none overflow-visible"
                                    >
                                        <option value="">Select your bank</option>
                                        {nigerianBanks.map((bank) => (
                                            <option
                                                key={bank.code}
                                                value={bank.name}
                                                className="py-2"
                                            >
                                                {bank.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="font-semibold block mb-2 text-gray-700">
                                        Bank Code
                                    </label>
                                    <input
                                        type="text"
                                        value={bankFormData.bankCode}
                                        readOnly
                                        placeholder="Auto-filled when you select bank"
                                        className="w-full bg-gray-100 text-blue-950 border-2 border-gray-300 px-4 py-3 rounded-xl cursor-not-allowed"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">✓ Bank code is automatically filled when you select a bank</p>
                                </div>
                            </div>

                            <div className="mt-6 flex gap-3">
                                <button
                                    onClick={() => {
                                        setShowBankModal(false);
                                        setBankFormData({
                                            accountName: "",
                                            accountNumber: "",
                                            bankName: "",
                                            bankCode: ""
                                        });
                                    }}
                                    className="flex-1 bg-gray-200 text-gray-700 px-6 py-3 rounded-xl font-semibold hover:bg-gray-300 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSaveBank}
                                    disabled={savingBank}
                                    className="flex-1 bg-blue-950 text-white px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-blue-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {savingBank ? (
                                        <>
                                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            <Save size={18} />
                                            Save Bank Details
                                        </>
                                    )}
                                </button>
                            </div>

                            <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-xl p-3">
                                <p className="text-xs text-yellow-700">
                                    <strong>Note:</strong> Ensure your bank details are correct. All withdrawals will be sent to this account.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Bottom Navigation - Mobile Only */}
            <div className="fixed bottom-0 left-0 right-0 bg-blue-950 border-t border-blue-800 lg:hidden">
                <div className="flex justify-around items-center py-3 px-2">
                    <Link href="/home">
                        <button className="flex flex-col items-center gap-1">
                            <DollarSign size={24} className="text-gray-300" />
                            <span className="text-xs text-gray-300 font-medium">Home</span>
                        </button>
                    </Link>
                    <Link href="/my-account/seller-account/my-books">
                        <button className="flex flex-col items-center gap-1" title="Check the books you bought on LAN">
                            <Book size={24} className="text-gray-300" />
                            <span className="text-xs text-gray-300">My Books</span>
                        </button>
                    </Link>
                    <Link href="/documents" title="Browse the latest book posted by other sellers">
                        <button className="flex flex-col items-center gap-1">
                            <Globe size={24} className="text-gray-300" />
                            <span className="text-xs text-gray-300">Browse</span>
                        </button>
                    </Link>
                    <Link href="/advertise">
                        <button className="flex flex-col items-center gap-1" title="Upload your books and make more sales">
                            <TrendingUp size={24} className="text-gray-300" />
                            <span className="text-xs text-gray-300">Upload</span>
                        </button>
                    </Link>
                    <button
                        onClick={() => setShowProfileModal(true)}
                        className="flex flex-col items-center gap-1"
                        title="My profile"
                    >
                        <User size={24} className="text-gray-300" />
                        <span className="text-xs text-gray-300">Me</span>
                    </button>
                </div>
            </div>

            {/* Bottom Padding for Mobile Nav */}
            <div className="h-20 lg:hidden"></div>
        </div>
    );
}