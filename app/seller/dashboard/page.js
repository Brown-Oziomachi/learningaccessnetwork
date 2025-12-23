// app/seller/dashboard/page.js
"use client"
import { useState, useEffect } from 'react';
import { db, auth } from '@/lib/firebaseConfig';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { useRouter } from 'next/navigation';

export default function SellerDashboard() {
    const [sellerData, setSellerData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const router = useRouter();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (!user) {
                router.push('/login');
                return;
            }

            try {
                // Fetch seller data using user's UID
                const sellerRef = doc(db, 'sellers', user.uid);
                const sellerDoc = await getDoc(sellerRef);

                if (sellerDoc.exists()) {
                    setSellerData({ id: sellerDoc.id, ...sellerDoc.data() });
                } else {
                    setError('Seller account not found. Please contact support.');
                }
            } catch (err) {
                console.error('Error fetching seller data:', err);
                setError('Failed to load seller data: ' + err.message);
            } finally {
                setLoading(false);
            }
        });

        return () => unsubscribe();
    }, [router]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-xl">Loading...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="bg-red-50 border border-red-200 rounded p-6 max-w-md">
                    <p className="text-red-900">{error}</p>
                </div>
            </div>
        );
    }

    if (!sellerData) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-xl">No seller data available</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-6xl mx-auto">
                <h1 className="text-4xl font-bold mb-8">Seller Dashboard</h1>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white rounded-lg shadow p-6">
                        <h3 className="text-gray-600 text-sm font-semibold mb-2">Account Balance</h3>
                        <p className="text-3xl font-bold text-green-600">
                            ₦{sellerData.accountBalance?.toLocaleString() || 0}
                        </p>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6">
                        <h3 className="text-gray-600 text-sm font-semibold mb-2">Total Earnings</h3>
                        <p className="text-3xl font-bold text-blue-600">
                            ₦{sellerData.totalEarnings?.toLocaleString() || 0}
                        </p>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6">
                        <h3 className="text-gray-600 text-sm font-semibold mb-2">Books Sold</h3>
                        <p className="text-3xl font-bold text-purple-600">
                            {sellerData.booksSold || 0}
                        </p>
                    </div>
                </div>

                {/* Account Details */}
                <div className="bg-white rounded-lg shadow p-6 mb-8">
                    <h2 className="text-2xl font-bold mb-4">Account Details</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <p className="text-sm text-gray-600">Business Name</p>
                            <p className="font-semibold">{sellerData.businessInfo?.businessName || 'N/A'}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Seller Name</p>
                            <p className="font-semibold">{sellerData.sellerName}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Email</p>
                            <p className="font-semibold">{sellerData.sellerEmail}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Phone</p>
                            <p className="font-semibold">{sellerData.sellerPhone}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Account Type</p>
                            <p className="font-semibold uppercase">{sellerData.accountType}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Status</p>
                            <p className={`font-semibold ${sellerData.status === 'active' ? 'text-green-600' : 'text-red-600'}`}>
                                {sellerData.status?.toUpperCase() || 'ACTIVE'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Bank Details */}
                {sellerData.bankDetails && (
                    <div className="bg-white rounded-lg shadow p-6">
                        <h2 className="text-2xl font-bold mb-4">Bank Details</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <p className="text-sm text-gray-600">Bank Name</p>
                                <p className="font-semibold">{sellerData.bankDetails.bankName}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Account Number</p>
                                <p className="font-semibold">{sellerData.bankDetails.accountNumber}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Account Name</p>
                                <p className="font-semibold">{sellerData.bankDetails.accountName}</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}