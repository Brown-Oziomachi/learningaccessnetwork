"use client";
import React, { useState, useEffect } from "react";
import { DollarSign, TrendingUp, ShoppingBag, CreditCard, Download, Book, Globe, Settings, X, Camera, Save, Mail, CheckCircle, AlertCircle, ChevronRight, User, MapPin, Phone, Calendar, Building } from "lucide-react";
import Link from "next/link";
import { auth, db } from "@/lib/firebaseConfig";
import { doc, getDoc, updateDoc, collection, query, where, getDocs, addDoc, serverTimestamp, increment, setDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";
import Navbar from "@/components/NavBar";

export default function SellerAccount() {
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

            const withdrawalRef = `WD-${Date.now()}-${user.uid.substring(0, 8)}`;

            const withdrawalData = {
                sellerId: user.uid,
                sellerName: user.displayName || `${user.firstName} ${user.surname}`,
                sellerEmail: user.email,
                amount: amount,
                status: "completed",
                requestedAt: serverTimestamp(),
                processedAt: serverTimestamp(),
                reference: withdrawalRef,
                bankDetails: {
                    accountName: user.bankDetails.accountName,
                    accountNumber: user.bankDetails.accountNumber,
                    bankName: user.bankDetails.bankName,
                },
                processingMethod: "automatic",
                processingNote: "Automatic withdrawal - no approval required",
            };

            await addDoc(collection(db, "withdrawals"), withdrawalData);

            const newBalance = accountBalance - amount;
            await updateDoc(doc(db, "sellers", user.uid), {
                accountBalance: newBalance,
                totalWithdrawn: increment(amount),
                lastWithdrawalDate: serverTimestamp(),
                updatedAt: serverTimestamp()
            });

            setAccountBalance(newBalance);
            setWithdrawAmount("");
            setShowWithdrawModal(false);

            alert(`✅ Withdrawal successful!\n\nAmount: ₦${amount.toLocaleString()}\nReference: ${withdrawalRef}\n\nFunds will be sent to:\n${user.bankDetails.accountName}\n${user.bankDetails.accountNumber}\n${user.bankDetails.bankName}`);

            await fetchSellerTransactions(user.uid);

        } catch (error) {
            console.error("Withdrawal error:", error);
            setWithdrawalError("Failed to process withdrawal: " + error.message);
        } finally {
            setWithdrawing(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 text-blue-950 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
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
        <div className="min-h-screen bg-gray-200 text-white pb-20">
            <Navbar />
            
            {/* Header */}
            <div className="bg-gray-200 px-4 py-4 flex items-center justify-between shadow-2xl bg-white">
                <div className="flex items-center gap-3">
                    <button 
                        onClick={() => setShowProfileModal(true)}
                        className="relative flex items-center gap-3"
                    >
                        <img
                            src={user?.photoBase64 || "/api/placeholder/48/48"}
                            className="w-12 h-12 rounded-full object-cover border-2 border-blue-950"
                            alt="Profile"
                        />
                      
                    <div>
                        <p className="text-sm text-blue-950">Hi, {user?.firstName || 'Seller'}</p>
                    </div>
                    </button>
                </div>
                <div className="flex items-center gap-3">
                    <button 
                    onClick={handleButton}
                    className="relative">
                        <div className="bg-pink-500 text-xs font-bold px-2 py-1 rounded-full">HELP</div>
                    </button>
                  
                </div>
            </div>

            {/* Balance Card */}
            <div className="mx-4 mt-4  rounded-2xl p-6 shadow-lg bg-blue-950">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <span className="text-white font-semibold">₦ Available Balance</span>
                        <button>
                            <CheckCircle size={16} className="text-white" />
                        </button>
                    </div>
                    <button 
                        onClick={() => setShowTransactionHistory(true)}
                        className="text-white font-semibold flex items-center gap-1 text-sm"
                    >
                        Transaction History <ChevronRight size={16} />
                    </button>
                </div>
                
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-4xl font-bold text-gray-400">₦{accountBalance.toLocaleString()}</p>
                        <button className="text-green-900 text-sm mt-1 flex items-center gap-1">
                            <ChevronRight size={14} />
                        </button>
                    </div>
                    <button
                        onClick={() => setShowWithdrawModal(true)}
                        disabled={accountBalance < 1000}
                        className="bg-white text-blue-950 px-6 py-3 rounded-xl font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        + Withdraw
                    </button>
                </div>
            </div>

            {/* Recent Transactions */}
            <div className="mx-4 mt-4">
                {transactions.slice(0, 2).map((txn) => (
                    <div key={txn.id} className="bg-blue-950 rounded-xl p-4 mb-2 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="bg-white p-2 rounded-full">
                                <ShoppingBag size={20} className="text-blue-950" />
                            </div>
                            <div>
                                <p className="font-semibold">{txn.bookTitle}</p>
                                <p className="text-xs text-gray-400">{txn.createdAtDate?.toLocaleDateString()}</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-gray-300 font-bold">+₦{(txn.sellerAmount || (txn.amount * 0.85)).toLocaleString()}</p>
                            <p className="text-xs bg-white px-1 text-blue-950">Successful</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Action Buttons
            <div className="mx-4 mt-6 grid grid-cols-3 gap-4">
                <Link href="/my-books" className="bg-blue-950 rounded-xl p-4 flex flex-col items-center justify-center gap-2 hover:bg-gray-700">
                    <div className="bg-white p-3 rounded-full">
                        <Book className="text-blue-950" size={24} />
                    </div>
                    <span className="text-sm font-semibold text-center">My Books</span>
                </Link>
                
                <Link href="/pdf" className="bg-blue-950 rounded-xl p-4 flex flex-col items-center justify-center gap-2 hover:bg-gray-700">
                    <div className="bg-white p-3 rounded-full">
                        <Globe className="text-blue-950" size={24} />
                    </div>
                    <span className="text-sm font-semibold text-center">Browse Books</span>
                </Link>
                
                <Link href="/advertise" className="bg-blue-950 rounded-xl p-4 flex flex-col items-center justify-center gap-2 hover:bg-gray-700">
                    <div className="bg-white p-3 rounded-full">
                        <TrendingUp className="text-blue-950" size={24} />
                    </div>
                    <span className="text-sm font-semibold text-center">Advertise</span>
                </Link>
            </div> */}

            {/* Stats Section */}
            <div className="mx-4 mt-6 bg-blue-950 rounded-2xl p-4">
                <h3 className="font-bold text-lg mb-4">Quick Stats</h3>
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white rounded-xl p-4">
                        <p className="text-sm text-gray-900">Total Earnings</p>
                        <p className="text-2xl font-bold text-blue-950">₦{totalEarnings.toLocaleString()}</p>
                    </div>
                    <div className="bg-white rounded-xl p-4">
                        <p className="text-sm text-gray-900">Books Sold</p>
                        <p className="text-2xl font-bold text-blue-950">{booksSold}</p>
                    </div>
                </div>
            </div>

            {/* Special Bonus Section */}
            <div className="mx-4 mt-6 mb-6">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold text-lg text-blue-950">Special Bonus For You</h3>
                    <span className="text-xs bg-pink-500 px-2 py-1 rounded-full">Up to 6%</span>
                </div>
                <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="bg-white p-3 rounded-full">
                            <TrendingUp className="text-purple-600" size={24} />
                        </div>
                        <div>
                            <p className="font-bold">Up to ₦5,000,000.00</p>
                            <p className="text-xs text-purple-200">Earn more by selling</p>
                        </div>
                    </div>
                    <button 
                    onClick={handleGo}
                    className="bg-blue-950 text-white px-6 py-2 rounded-xl font-bold">
                        GO
                    </button>
                </div>
            </div>

            {/* Profile Modal */}
            {showProfileModal && (
                <div className="fixed inset-0 bg-white z-50 flex flex-col">
                    <div className="bg-blue-950 p-6 text-center relative">
                        <button 
                            onClick={() => setShowProfileModal(false)}
                            className="absolute top-4 right-4 text-gray-50"
                        >
                            <X size={24} />
                        </button>
                        <Link href="/my-account">
                        <div className="flex flex-col items-center">
                            <div className="relative mb-3">
                                <img
                                    src={user?.photoBase64 || "/api/placeholder/80/80"}
                                    className="w-20 h-20 rounded-full object-cover border-4 border-white"
                                    alt="Profile"
                                />
                            </div>
                            <p className="text-2xl font-bold text-gray-50">{user?.displayName || `${user?.firstName} ${user?.surname}`}</p>
                            <p className="text-sm text-gray-800">+234{user?.phone || '0000000000'}</p>
                        </div>
                        </Link>
                    </div>

                    <div className="flex-1 bg-gray-400 overflow-y-auto">
                        <div className="p-4 space-y-2">
                            {/* My Profile */}
                            <button 
                                onClick={() => {
                                    setShowProfileModal(false);
                                    setIsEditing(true);
                                }}
                                className="w-full bg-blue-950 rounded-xl p-4 flex items-center justify-between hover:bg-gray-700"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="bg-white p-2 rounded-lg">
                                        <User size={20}  className="text-blue-950"/>
                                    </div>
                                    <span className="font-semibold">My Profile</span>
                                </div>
                                <ChevronRight size={20} className="text-gray-400" />
                            </button>

                            {/* Bank Details */}
                            <button 
                                onClick={() => router.push('/my-account')}
                                className="w-full  bg-blue-950 rounded-xl p-4 flex items-center justify-between hover:bg-gray-700"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="bg-white p-2 rounded-lg">
                                        <Building size={20}  className="text-blue-950"/>
                                    </div>
                                    <span className="font-semibold">Bank Details</span>
                                </div>
                                <ChevronRight size={20} className="text-gray-400" />
                            </button>

                            {/* Other Information */}
                            <div className="w-full  bg-blue-950 rounded-xl p-4">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-white p-2 rounded-lg">
                                            <Settings size={20} className="text-blue-950"/>
                                        </div>
                                        <span className="font-semibold">Other Information</span>
                                    </div>
                                </div>
                                <div className="space-y-3 pl-11 text-sm">
                                    <div className="flex justify-between py-2 border-b border-gray-700">
                                        <span className="text-gray-400">Email</span>
                                        <span className="text-right break-all">{user?.email}</span>
                                    </div>
                                    <div className="flex justify-between py-2 border-b border-gray-700">
                                        <span className="text-gray-400">Date of Birth</span>
                                        <span>{user?.dateOfBirth || 'Not set'}</span>
                                    </div>
                                    <div className="flex justify-between py-2 border-b border-gray-700">
                                        <span className="text-gray-400">Address</span>
                                        <span className="text-right">{user?.address || 'Not set'}</span>
                                    </div>
                                    <div className="flex justify-between py-2">
                                        <span className="text-gray-400">Account Type</span>
                                        <span className="text-blue-950 px-2 rounded-md font-semibold bg-white">Verified Seller</span>
                                    </div>
                                </div>
                            </div>

                            {/* Message
                            <button className="w-full bg-gray-800 rounded-xl p-4 flex items-center justify-between hover:bg-gray-700">
                                <div className="flex items-center gap-3">
                                    <div className="bg-green-500 p-2 rounded-lg">
                                        <Mail size={20} />
                                    </div>
                                    <span className="font-semibold">Message</span>
                                </div>
                                <ChevronRight size={20} className="text-gray-400" />
                            </button> */}

                            {/* Help */}
                            <button className="w-full bg-blue-950 rounded-xl p-4 flex items-center justify-between hover:bg-gray-700">
                                <div className="flex items-center gap-3">
                                    <div className="bg-white p-2 rounded-lg">
                                        <AlertCircle size={20} className="text-blue-950"/>
                                    </div>
                                    <span className="font-semibold">Help</span>
                                </div>
                                <ChevronRight size={20} className="text-gray-400" />
                            </button>

                            {/* About */}
                            <button className="w-full  bg-blue-950 rounded-xl p-4 flex items-center justify-between hover:bg-gray-700">
                                <div className="flex items-center gap-3">
                                    <div className="bg-white p-2 rounded-lg">
                                        <Settings size={20} className="text-blue-950"/>
                                    </div>
                                    <span className="font-semibold">About</span>
                                </div>
                                <ChevronRight size={20} className="text-gray-400" />
                            </button>

                            {/* Contact Us */}
                            <button className="w-full  bg-blue-950 rounded-xl p-4 flex items-center justify-between hover:bg-gray-700">
                                <div className="flex items-center gap-3">
                                    <div className="bg-white p-2 rounded-lg">
                                        <Phone size={20} className="text-blue-950"/>
                                    </div>
                                    <span className="font-semibold">Contact Us</span>
                                </div>
                                <ChevronRight size={20} className="text-gray-400" />
                            </button>

                            {/* History */}
                            <button 
                                onClick={() => {
                                    setShowProfileModal(false);
                                    setShowTransactionHistory(true);
                                }}
                                className="w-full  bg-blue-950 rounded-xl p-4 flex items-center justify-between hover:bg-gray-700"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="bg-white p-2 rounded-lg">
                                        <TrendingUp size={20} className="text-blue-950"/>
                                    </div>
                                    <span className="font-semibold">History</span>
                                </div>
                                <ChevronRight size={20} className="text-gray-400" />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Transaction History Modal */}
            {showTransactionHistory && (
                <div className="fixed inset-0 bg-gray-400 z-50 flex flex-col">
                    <div className="bg-blue-950 p-4 flex items-center gap-4">
                        <button onClick={() => setShowTransactionHistory(false)}>
                            <X size={24} />
                        </button>
                        <h2 className="text-xl font-bold">Transaction History</h2>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4">
                        {transactions.length === 0 ? (
                            <div className="text-center py-12">
                                <ShoppingBag size={48} className="mx-auto text-gray-600 mb-4" />
                                <p className="text-gray-400">No transactions yet</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {transactions.map((txn) => (
                                    <div key={txn.id} className=" bg-blue-950 rounded-xl p-4">
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-3">
                                                <div className="bg-white p-2 rounded-full">
                                                    <ShoppingBag size={16} className="text-blue-950" />
                                                </div>
                                                <div>
                                                    <p className="font-semibold">{txn.bookTitle}</p>
                                                    <p className="text-xs text-gray-400">
                                                        {txn.createdAtDate?.toLocaleDateString()} at {txn.createdAtDate?.toLocaleTimeString()}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-white font-bold">
                                                    +₦{(txn.sellerAmount || (txn.amount * 0.85)).toLocaleString()}
                                                </p>
                                                <p className="text-xs text-blue-950 px-1 bg-white">Successful</p>
                                            </div>
                                        </div>
                                        <div className="bg-white text-blue-950 rounded-lg p-3 mt-2 text-sm space-y-1">
                                            <div className="flex justify-between">
                                                <span className="text-blue-950">Buyer:</span>
                                                <span>{txn.buyerName}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-blue-950">Price:</span>
                                                <span>₦{txn.amount?.toLocaleString()}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-blue-950">Platform Fee (15%):</span>
                                                <span>-₦{((txn.amount || 0) * 0.15).toLocaleString()}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Withdrawals Section */}
                        {withdrawals.length > 0 && (
                            <div className="mt-6">
                                <h3 className="font-bold text-lg mb-3">Withdrawal History</h3>
                                <div className="space-y-3">
                                    {withdrawals.map((w) => (
                                        <div key={w.id} className="bg-gray-800 rounded-xl p-4">
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center gap-3">
                                                    <div className="bg-red-500 p-2 rounded-full">
                                                        <Download size={16} className="text-white" />
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold">Withdrawal</p>
                                                        <p className="text-xs text-gray-400">
                                                            {w.requestedAtDate?.toLocaleDateString()} at {w.requestedAtDate?.toLocaleTimeString()}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-red-400 font-bold">-₦{w.amount?.toLocaleString()}</p>
                                                    <p className="text-xs text-green-500">Completed</p>
                                                </div>
                                            </div>
                                            {w.reference && (
                                                <p className="text-xs text-gray-500 mt-2">Ref: {w.reference}</p>
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
                <div className="fixed inset-0 bg-black/80 flex items-end justify-center z-50">
                    <div className="bg-gray-200 rounded-t-3xl w-full max-w-md pb-8">
                        <div className="bg-blue-950 p-6 flex justify-between items-center rounded-t-3xl">
                            <h2 className="text-2xl font-bold">Withdraw Funds</h2>
                            <button onClick={() => {
                                setShowWithdrawModal(false);
                                setWithdrawalError("");
                                setWithdrawAmount("");
                            }}>
                                <X size={24} />
                            </button>
                        </div>

                        <div className="p-6 border-b border-gray-800 bg-white">
                            <div className="flex items-center gap-2 text-blue-950 mb-2">
                                <CheckCircle size={18} />
                                <p className="text-sm font-semibold">Instant Withdrawal - No Approval Needed</p>
                            </div>
                        </div>

                        {user?.bankDetails ? (
                            <div className="p-6 border-b border-gray-800 bg-blue-950">
                                <p className="text-sm font-semibold text-gray-400 mb-2">Withdrawal will be sent to:</p>
                                <p className="text-sm"><strong>Account Name:</strong> {user.bankDetails.accountName}</p>
                                <p className="text-sm"><strong>Account Number:</strong> {user.bankDetails.accountNumber}</p>
                                <p className="text-sm"><strong>Bank:</strong> {user.bankDetails.bankName}</p>
                            </div>
                        ) : (
                            <div className="p-6 border-b border-gray-800 bg-yellow-500/10">
                                <div className="flex items-start gap-2">
                                    <AlertCircle size={18} className="text-yellow-500 flex-shrink-0 mt-0.5" />
                                    <p className="text-sm text-yellow-500">Please add bank details to your profile first</p>
                                </div>
                            </div>
                        )}

                        <div className="p-6">
                            <div className=" bg-blue-950 p-4 rounded-xl mb-4">
                                <p className="text-sm text-gray-400">Available Balance</p>
                                <p className="text-3xl font-bold text-white">₦{accountBalance.toLocaleString()}</p>
                            </div>

                            {withdrawalError && (
                                <div className="mb-4 bg-red-500/10 border border-red-500 rounded-xl p-3 flex items-start gap-2">
                                    <AlertCircle size={18} className="text-red-500 flex-shrink-0 mt-0.5" />
                                    <p className="text-sm text-red-500">{withdrawalError}</p>
                                </div>
                            )}

                            <label className="font-semibold block mb-2 text-blue-950">Amount</label>
                            <input
                                type="number"
                                value={withdrawAmount}
                                onChange={(e) => {
                                    setWithdrawAmount(e.target.value);
                                    setWithdrawalError("");
                                }}
                                placeholder="Enter amount"
                                className="w-full  bg-blue-950 text-white border-2 border-gray-700 px-4 py-3 rounded-xl mb-2 focus:border-green-500 focus:outline-none text-white"
                                min="1000"
                                max={accountBalance}
                            />
                            <p className="text-sm text-blue-950 mb-4">Minimum: ₦1,000</p>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => {
                                        setShowWithdrawModal(false);
                                        setWithdrawalError("");
                                        setWithdrawAmount("");
                                    }}
                                    className="flex-1 bg-gray-800 px-6 py-3 rounded-xl font-semibold hover:bg-gray-700"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleWithdraw}
                                    disabled={withdrawing || !user?.bankDetails}
                                    className="flex-1 bg-blue-950 text-white px-6 py-3 rounded-xl font-bold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 hover:bg-green-600"
                                >
                                    {withdrawing ? (
                                        <>
                                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-900"></div>
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
                <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0  bg-blue-950 border-b border-gray-700 px-6 py-4 flex justify-between items-center rounded-t-2xl">
                            <h2 className="text-2xl font-bold">Edit Profile</h2>
                            <button onClick={() => setIsEditing(false)}><X size={24} /></button>
                        </div>
                        <div className="p-6">
                            <div className="flex justify-center mb-6">
                                <div className="relative">
                                    <img src={user?.photoBase64 || "/api/placeholder/128/128"} className="w-32 h-32 rounded-full border-4 border-green-500 object-cover" alt="profile" />
                                    <label className="absolute bottom-0 right-0 bg-green-500 p-3 rounded-full cursor-pointer hover:bg-green-600">
                                        <Camera size={18} className="text-white" />
                                        <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                                    </label>
                                </div>
                            </div>
                            <div className="grid sm:grid-cols-2 gap-4 text-blue-950">
                                <div>
                                    <label className="font-semibold block mb-2">First Name</label>
                                    <input value={formData.firstName} onChange={(e) => setFormData({ ...formData, firstName: e.target.value })} className="w-full  bg-blue-950 border border-gray-50 px-4 py-3 rounded-xl text-white focus:border-green-500 focus:outline-none" />
                                </div>
                                <div>
                                    <label className="font-semibold block mb-2">Surname</label>
                                    <input value={formData.surname} onChange={(e) => setFormData({ ...formData, surname: e.target.value })} className="w-full  bg-blue-950 border border-gray-50 px-4 py-3 rounded-xl text-white focus:border-green-500 focus:outline-none" />
                                </div>
                                <div>
                                    <label className="font-semibold block mb-2">Phone</label>
                                    <input value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="w-full  bg-blue-950 border border-gray-50 px-4 py-3 rounded-xl text-white focus:border-green-500 focus:outline-none" />
                                </div>
                                <div>
                                    <label className="font-semibold block mb-2">Date of Birth</label>
                                    <input type="date" value={formData.dateOfBirth} onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })} className="w-full  bg-blue-950 border border-gray-50 px-4 py-3 rounded-xl text-white focus:border-green-500 focus:outline-none" />
                                </div>
                                <div className="sm:col-span-2">
                                    <label className="font-semibold block mb-2">Address</label>
                                    <input value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} className="w-full  bg-blue-950 border border-gray-50 px-4 py-3 rounded-xl text-white focus:border-green-500 focus:outline-none" />
                                </div>
                            </div>
                            <div className="mt-6 flex gap-3">
                                <button onClick={() => setIsEditing(false)} className="flex-1 bg-gray-800 px-6 py-3 rounded-xl font-semibold hover:bg-gray-700">Cancel</button>
                                <button onClick={handleSave} className="flex-1  bg-blue-950 text-gray-50 px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-green-600">
                                    <Save size={18} />Save
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Bottom Navigation */}
            <div className="fixed bottom-0 left-0 right-0 bg-blue-950 border-t border-gray-700 flex justify-around items-center py-3">
               <Link href="/home">
                <button className="flex flex-col items-center gap-1">
                    <DollarSign size={24} className="text-gray-400" />
                    <span className="text-xs text-gray-400 font-semibold">Home</span>
                </button>
               </Link>
               <Link href="/my-books">
                <button className="flex flex-col items-center gap-1" title="Check the books you bought on LAN">
                    <TrendingUp size={24} className="text-gray-400" />
                    <span className="text-xs text-gray-400">My Books</span>
                </button>
               </Link>
                <Link href="/documents" title="Browse the latest book posted by other sellers">
                <button className="flex flex-col items-center gap-1">
                    <CreditCard size={24} className="text-gray-400" />
                    <span className="text-xs text-gray-400">Browse Books</span>
                </button>
                </Link>
                 <Link href="/advertise">
                <button className="flex flex-col items-center gap-1" title="Upload your books and make more sales">
                    <CreditCard size={24} className="text-gray-400" />
                    <span className="text-xs text-gray-400">Upload Doc..</span>
                </button>
                 </Link>
                <button 
                    onClick={() => setShowProfileModal(true)}
                    className="flex flex-col items-center gap-1"
                    title="My profile"
                >
                    <User size={24} className="text-gray-400" />
                    <span className="text-xs text-gray-400">Me</span>
                </button>
            </div>
        </div>
    );
}