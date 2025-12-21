// app/my-account/seller-account/page.js

"use client";
import React, { useState, useEffect } from "react";
import { DollarSign, TrendingUp, ShoppingBag, CreditCard, Download, Book, Globe, Settings, X, Camera, Save, Mail, CheckCircle } from "lucide-react";
import Link from "next/link";
import { auth, db } from "@/lib/firebaseConfig";
import { doc, getDoc, updateDoc, collection, query, where, getDocs, addDoc, serverTimestamp } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";
import Navbar from "@/components/NavBar";

export default function SellerAccount() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [accountBalance, setAccountBalance] = useState(100);
    const [totalEarnings, setTotalEarnings] = useState(100);
    const [booksSold, setBooksSold] = useState(0);
    const [transactions, setTransactions] = useState([]);
    const [withdrawals, setWithdrawals] = useState([]);
    const [showWithdrawModal, setShowWithdrawModal] = useState(false);
    const [withdrawAmount, setWithdrawAmount] = useState("");
    const [withdrawing, setWithdrawing] = useState(false);
    const [activeTab, setActiveTab] = useState("overview");
    const router = useRouter();

    const [formData, setFormData] = useState({
        firstName: "",
        surname: "",
        dateOfBirth: ""
    });

      useEffect(() => {
                    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
                        if (currentUser) {
                            setUser(currentUser);
                            await fetchPurchasedBooks(currentUser.uid);
                        } else {
                            router.push('/auth/signin');
                        }
                    });
            
                    return () => unsubscribe();
      }, [router]);
    
    useEffect(() => {
        if (!user?.uid) return;

        // fetch seller bank details
        const fetchSellerBankDetails = async () => {
            try {
                const sellerRef = doc(db, "sellers", user.uid);
                const sellerSnap = await getDoc(sellerRef);

                if (sellerSnap.exists()) {
                    const { bankDetails } = sellerSnap.data();

                    if (bankDetails) {
                        setUser({
                            uid: user.uid,
                            bankDetails
                        });
                    } else {
                        console.warn("No bank details found for seller");
                    }
                }
            } catch (error) {
                console.error("Error fetching bank details:", error);
            }
        };

        fetchSellerBankDetails();
    }, [user?.uid]);


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

                // Redirect to regular account if not a seller
                if (!userData.isSeller) {
                    router.push('/my-account');
                    return;
                }

                setUser({ uid, ...userData });
                setFormData({
                    firstName: userData.firstName || "",
                    surname: userData.surname || "",
                    dateOfBirth: userData.dateOfBirth || ""
                });
                await fetchSellerData(uid);
            }
        } catch (error) {
            console.error("Error:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchSellerData = async (uid) => {
        try {
            const sellerDoc = await getDoc(doc(db, "sellers", uid));
            if (sellerDoc.exists()) {
                const data = sellerDoc.data();
                setAccountBalance(data.accountBalance || 100);
                setTotalEarnings(data.totalEarnings || 100);
                setBooksSold(data.booksSold || 0);
            }

            // Fetch transactions
            const transactionsQuery = query(
                collection(db, "transactions"),
                where("sellerId", "==", uid)
            );
            const transactionsSnapshot = await getDocs(transactionsQuery);
            setTransactions(transactionsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));

            // Fetch withdrawals
            const withdrawalsQuery = query(
                collection(db, "withdrawals"),
                where("sellerId", "==", uid)
            );
            const withdrawalsSnapshot = await getDocs(withdrawalsQuery);
            setWithdrawals(withdrawalsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        } catch (error) {
            console.error("Error fetching seller data:", error);
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
            setUser((prev) => ({ ...prev, ...formData }));
            setIsEditing(false);
        } catch (error) {
            alert("Failed to save profile");
        }
    };

    const handleWithdraw = async () => {
        const amount = parseFloat(withdrawAmount);
        if (!amount || amount <= 0 || amount > accountBalance || amount < 1000) {
            alert("Invalid amount. Minimum ₦1,000 and cannot exceed balance.");
            return;
        }

        try {
            setWithdrawing(true);
            await addDoc(collection(db, "withdrawals"), {
                sellerId: user.uid,
                amount,
                status: "pending",
                requestedAt: serverTimestamp(),
                sellerEmail: user.email,
                sellerName: user.displayName
            });
            const newBalance = accountBalance - amount;
            await updateDoc(doc(db, "sellers", user.uid), { accountBalance: newBalance });
            setAccountBalance(newBalance);
            setWithdrawAmount("");
            setShowWithdrawModal(false);
            alert("Withdrawal request submitted!");
            await fetchSellerData(user.uid);
        } catch (error) {
            alert("Error: " + error.message);
        } finally {
            setWithdrawing(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-950"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <Navbar />
            <header className="bg-blue-950 text-white shadow-lg">
                <div className="max-w-7xl mx-auto px-4 py-4">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                        <div className="flex items-center gap-4">
                            <div>
                                <h1 className="text-2xl font-bold">Seller Dashboard</h1>
                                <p className="text-blue-200 text-sm">Manage your sales</p>
                            </div>
                            <button
                                onClick={() => router.push('/my-account')}
                                className="bg-blue-800 hover:bg-blue-700 px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
                                title="Switch to regular account view"
                            >
                                Regular View
                            </button>
                        </div>
                        <div className="flex items-center gap-4 w-full sm:w-auto">
                            <div className="text-right flex-1 sm:flex-initial">
                                <p className="text-sm text-blue-200">Balance</p>
                                <p className="text-xl sm:text-2xl font-bold">₦{accountBalance.toLocaleString()}</p>
                            </div>
                            <button
                                onClick={() => setShowWithdrawModal(true)}
                                className="bg-green-600 hover:bg-green-700 px-4 sm:px-6 py-2 rounded-lg font-semibold whitespace-nowrap"
                            >
                                Withdraw
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 py-6 sm:py-8">
                {/* Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <div className="bg-white rounded-lg shadow p-4 sm:p-6">
                        <div className="flex justify-between items-center">
                            <div>
                                <p className="text-sm text-gray-600">Balance</p>
                                <p className="text-xl sm:text-2xl font-bold text-green-600">₦{accountBalance.toLocaleString()}</p>
                            </div>
                            <div className="bg-green-100 p-3 rounded-full">
                                <DollarSign className="text-green-600" size={24} />
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-lg shadow p-4 sm:p-6">
                        <div className="flex justify-between items-center">
                            <div>
                                <p className="text-sm text-gray-600">Total Earnings</p>
                                <p className="text-xl sm:text-2xl font-bold text-blue-600">₦{totalEarnings.toLocaleString()}</p>
                            </div>
                            <div className="bg-blue-100 p-3 rounded-full">
                                <TrendingUp className="text-blue-600" size={24} />
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-lg shadow p-4 sm:p-6">
                        <div className="flex justify-between items-center">
                            <div>
                                <p className="text-sm text-gray-600">Books Sold</p>
                                <p className="text-xl sm:text-2xl font-bold text-purple-600">{booksSold}</p>
                            </div>
                            <div className="bg-purple-100 p-3 rounded-full">
                                <ShoppingBag className="text-purple-600" size={24} />
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-lg shadow p-4 sm:p-6">
                        <div className="flex justify-between items-center">
                            <div>
                                <p className="text-sm text-gray-600">Commission</p>
                                <p className="text-xl sm:text-2xl font-bold text-orange-600">20%</p>
                            </div>
                            <div className="bg-orange-100 p-3 rounded-full">
                                <CreditCard className="text-orange-600" size={24} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Profile Card */}
                <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                    <div className="bg-gradient-to-r from-blue-950 to-blue-800 p-6 sm:p-8 text-white">
                        <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
                            <img
                                src={user?.photoBase64 || "/api/placeholder/100/100"}
                                className="w-24 h-24 sm:w-32 sm:h-32 rounded-full border-4 border-white object-cover"
                                alt="Profile"
                            />
                            <div className="text-center sm:text-left flex-1">
                                <h2 className="text-2xl sm:text-3xl font-bold">{user?.displayName}</h2>
                                <p className="text-blue-200 flex items-center gap-2 justify-center sm:justify-start mt-1">
                                    <Mail size={16} />
                                    {user?.email}
                                </p>
                                <span className="inline-flex items-center gap-1 bg-green-600 px-3 py-1 rounded-full text-sm mt-2">
                                    <CheckCircle size={14} /> Verified Seller
                                </span>
                            </div>
                            <button
                                onClick={() => setIsEditing(true)}
                                className="bg-white text-blue-950 px-4 sm:px-6 py-2 rounded-lg font-semibold hover:bg-blue-50 flex items-center gap-2"
                            >
                                <Settings size={18} />
                                Edit Profile
                            </button>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="border-b">
                        <div className="flex overflow-x-auto">
                            {["overview", "transactions", "withdrawals"].map(tab => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`px-4 sm:px-6 py-3 font-semibold whitespace-nowrap ${activeTab === tab ? "border-b-2 border-blue-600 text-blue-600" : "text-gray-600 hover:text-blue-600"
                                        }`}
                                >
                                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Tab Content */}
                    <div className="p-4 sm:p-8 text-blue-950">
                        {activeTab === "overview" && (
                            <div>
                                <h3 className="text-xl font-bold mb-4">Account Information</h3>
                                <div className="grid sm:grid-cols-2 gap-4 mb-8">
                                    <div>
                                        <label className="font-semibold text-gray-700">First Name</label>
                                        <p className="bg-gray-50 px-4 py-3 rounded-lg mt-1">{user?.firstName}</p>
                                    </div>
                                    <div>
                                        <label className="font-semibold text-gray-700">Surname</label>
                                        <p className="bg-gray-50 px-4 py-3 rounded-lg mt-1">{user?.surname}</p>
                                    </div>
                                    <div>
                                        <label className="font-semibold text-gray-700">Email</label>
                                        <p className="bg-gray-50 px-4 py-3 rounded-lg mt-1">{user?.email}</p>
                                    </div>
                                    <div>
                                        <label className="font-semibold text-gray-700">Date of Birth</label>
                                        <p className="bg-gray-50 px-4 py-3 rounded-lg mt-1">{user?.dateOfBirth || 'Not set'}</p>
                                    </div>
                                </div>

                                <h3 className="text-xl font-bold mb-4">Quick Actions</h3>
                                <div className="grid sm:grid-cols-3 gap-4">
                                    <Link href="/my-books" className="p-4 border-2 rounded-lg hover:border-blue-600 hover:bg-blue-50 flex items-center gap-3">
                                        <Book className="text-blue-600" size={24} />
                                        <span className="font-semibold">My Books</span>
                                    </Link>
                                    <Link href="/pdf" className="p-4 border-2 rounded-lg hover:border-blue-600 hover:bg-blue-50 flex items-center gap-3">
                                        <Globe className="text-blue-600" size={24} />
                                        <span className="font-semibold">Browse Books</span>
                                    </Link>
                                    <Link href="/advertise" className="p-4 border-2 rounded-lg hover:border-blue-600 hover:bg-blue-50 flex items-center gap-3">
                                        <TrendingUp className="text-blue-600" size={24} />
                                        <span className="font-semibold">Advertise</span>
                                    </Link>
                                </div>
                            </div>
                        )}

                        {activeTab === "transactions" && (
                            <div>
                                <h3 className="text-xl font-bold mb-4">Recent Transactions</h3>
                                {transactions.length === 0 ? (
                                    <div className="text-center py-12">
                                        <ShoppingBag size={48} className="mx-auto text-gray-400 mb-4" />
                                        <p className="text-gray-600">No transactions yet</p>
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    <th className="px-4 py-3 text-left text-sm font-semibold">Date</th>
                                                    <th className="px-4 py-3 text-left text-sm font-semibold">Book</th>
                                                    <th className="px-4 py-3 text-right text-sm font-semibold">Amount</th>
                                                    <th className="px-4 py-3 text-right text-sm font-semibold">Net</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y">
                                                {transactions.map((txn) => (
                                                    <tr key={txn.id} className="hover:bg-gray-50">
                                                        <td className="px-4 py-3 text-sm">{txn.date?.toDate?.().toLocaleDateString()}</td>
                                                        <td className="px-4 py-3 text-sm font-medium">{txn.bookTitle}</td>
                                                        <td className="px-4 py-3 text-sm text-right">₦{txn.amount?.toLocaleString()}</td>
                                                        <td className="px-4 py-3 text-sm text-right font-semibold text-green-600">₦{txn.netEarning?.toLocaleString()}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === "withdrawals" && (
                            <div>
                                <h3 className="text-xl font-bold mb-4">Withdrawal History</h3>
                                {withdrawals.length === 0 ? (
                                    <div className="text-center py-12">
                                        <DollarSign size={48} className="mx-auto text-gray-400 mb-4" />
                                        <p className="text-gray-600">No withdrawals yet</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {withdrawals.map((w) => (
                                            <div key={w.id} className="border rounded-lg p-4 flex justify-between items-center">
                                                <div>
                                                    <p className="font-semibold text-lg">₦{w.amount?.toLocaleString()}</p>
                                                    <p className="text-sm text-gray-600">{w.requestedAt?.toDate?.().toLocaleDateString()}</p>
                                                </div>
                                                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${w.status === 'completed' ? 'bg-green-100 text-green-700' :
                                                        w.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                                                    }`}>
                                                    {w.status?.charAt(0).toUpperCase() + w.status?.slice(1)}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </main>

            {/* Withdraw Modal */}
            {showWithdrawModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white text-blue-950 rounded-lg w-full max-w-md">
                        <div className="p-6 border-b">
                            {user?.bankDetails && (
                                <div className="space-y-2">
                                    <p><strong>Account Name:</strong> {user.bankDetails.accountName}</p>
                                    <p><strong>Account Number:</strong> {user.bankDetails.accountNumber}</p>
                                    <p><strong>Bank:</strong> {user.bankDetails.bankName}</p>
                                </div>
                            )}
                        </div>
                        <div className="bg-blue-950 text-white p-6  flex justify-between items-center">
                            <h2 className="text-2xl font-bold">Withdraw Funds</h2>
                            <button onClick={() => setShowWithdrawModal(false)}><X size={24} /></button>
                        </div>
                        <div className="p-6">
                            <div className="bg-blue-50 p-4 rounded-lg mb-4">
                                <p className="text-sm text-gray-600">Available Balance</p>
                                <p className="text-3xl font-bold text-blue-950">₦{accountBalance.toLocaleString()}</p>
                            </div>
                            <label className="font-semibold block mb-2">Amount</label>
                            <input
                                type="number"
                                value={withdrawAmount}
                                onChange={(e) => setWithdrawAmount(e.target.value)}
                                placeholder="Enter amount"
                                className="w-full border-2 px-4 py-3 rounded-lg mb-2"
                            />
                            <p className="text-sm text-gray-500 mb-4">Minimum: ₦1,000</p>
                            <div className="flex gap-3">
                                <button onClick={() => setShowWithdrawModal(false)} className="flex-1 border-2 px-6 py-3 rounded-lg font-semibold">
                                    Cancel
                                </button>
                                <button
                                    onClick={handleWithdraw}
                                    disabled={withdrawing}
                                    className="flex-1 bg-green-600 text-white px-6 py-3 rounded-lg font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {withdrawing ? "Processing..." : <><Download size={18} />Withdraw</>}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Modal */}
            {isEditing && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white text-blue-950 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-white text-blue-950 border-b px-6 py-4 flex justify-between items-center">
                            <h2 className="text-2xl font-bold">Edit Profile</h2>
                            <button onClick={() => setIsEditing(false)}><X size={24} /></button>
                        </div>
                        <div className="p-6">
                            <div className="flex justify-center mb-6">
                                <div className="relative">
                                    <img src={user?.photoBase64 || "/api/placeholder/128/128"} className="w-32 h-32 rounded-full border-4 border-gray-200 object-cover" alt="profile" />
                                    <label className="absolute bottom-0 right-0 bg-blue-600 p-3 rounded-full cursor-pointer hover:bg-blue-700">
                                        <Camera size={18} className="text-white" />
                                        <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                                    </label>
                                </div>
                            </div>
                            <div className="grid sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="font-semibold block mb-2">First Name</label>
                                    <input value={formData.firstName} onChange={(e) => setFormData({ ...formData, firstName: e.target.value })} className="w-full border px-4 py-3 rounded-lg" />
                                </div>
                                <div>
                                    <label className="font-semibold block mb-2">Surname</label>
                                    <input value={formData.surname} onChange={(e) => setFormData({ ...formData, surname: e.target.value })} className="w-full border px-4 py-3 rounded-lg" />
                                </div>
                                <div className="sm:col-span-2">
                                    <label className="font-semibold block mb-2">Date of Birth</label>
                                    <input type="date" value={formData.dateOfBirth} onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })} className="w-full border px-4 py-3 rounded-lg" />
                                </div>
                            </div>
                            <div className="mt-6 flex gap-3">
                                <button onClick={() => setIsEditing(false)} className="flex-1 border px-6 py-3 rounded-lg font-semibold">Cancel</button>
                                <button onClick={handleSave} className="flex-1 bg-green-600 text-white px-6 py-3 rounded-lg font-semibold flex items-center justify-center gap-2">
                                    <Save size={18} />Save
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}