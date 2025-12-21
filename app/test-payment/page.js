'use client'
import { useState } from 'react';
import { DollarSign, CheckCircle, AlertCircle, Database } from 'lucide-react';

export default function DirectSellerCredit() {
    const [sellerId, setSellerId] = useState('');
    const [amount, setAmount] = useState('5000');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);

    const creditSellerDirectly = async () => {
        setLoading(true);
        setError(null);
        setResult(null);

        try {
            // Import Firebase functions
            const { db } = await import('@/lib/firebaseConfig');
            const { doc, getDoc, updateDoc, increment, serverTimestamp } = await import('firebase/firestore');

            if (!sellerId.trim()) {
                throw new Error('Please enter a seller ID');
            }

            const netEarning = Math.floor(parseInt(amount) * 0.80);
            const sellerRef = doc(db, 'sellers', sellerId.trim());

            // Check if seller exists
            const sellerDoc = await getDoc(sellerRef);

            if (!sellerDoc.exists()) {
                throw new Error('Seller account not found. Check the seller ID.');
            }

            const beforeData = sellerDoc.data();

            // Update seller account
            await updateDoc(sellerRef, {
                accountBalance: increment(netEarning),
                totalEarnings: increment(netEarning),
                booksSold: increment(1),
                lastSaleAt: serverTimestamp()
            });

            // Get updated data
            const updatedDoc = await getDoc(sellerRef);
            const updatedData = updatedDoc.data();

            setResult({
                success: true,
                message: 'Payment credited successfully!',
                data: {
                    previousBalance: beforeData.accountBalance || 0,
                    amountAdded: netEarning,
                    newBalance: updatedData.accountBalance,
                    totalEarnings: updatedData.totalEarnings,
                    booksSold: updatedData.booksSold
                }
            });

        } catch (err) {
            console.error('Credit error:', err);
            setError(err.message || 'Failed to credit seller');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 sm:p-8">
            <div className="max-w-2xl mx-auto">
                {/* Main Card */}
                <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-blue-950 to-blue-800 p-6 sm:p-8 text-white">
                        <div className="flex items-center gap-3 mb-2">
                            <Database size={32} />
                            <h1 className="text-2xl sm:text-3xl font-bold">
                                Direct Seller Credit
                            </h1>
                        </div>
                        <p className="text-blue-200">
                            Credit seller directly via Firestore
                        </p>
                    </div>

                    {/* Form */}
                    <div className="p-6 sm:p-8">
                        {/* Instructions */}
                        <div className="mb-6 p-4 bg-blue-50 border-2 border-blue-200 rounded-lg">
                            <p className="text-sm text-blue-900 font-semibold mb-2">
                                📋 Before you start:
                            </p>
                            <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                                <li>Go to Firebase Console → Firestore</li>
                                <li>Open <code className="bg-blue-100 px-1 rounded">advertMyBook</code> collection</li>
                                <li>Find: "The Teen Survival Guide to Dating & Relating"</li>
                                <li>Copy the <code className="bg-blue-100 px-1 rounded">userId</code> field value</li>
                                <li>Paste it below and click "Credit Seller"</li>
                            </ol>
                        </div>

                        {/* Seller ID Input */}
                        <div className="mb-6">
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Seller User ID <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={sellerId}
                                onChange={(e) => setSellerId(e.target.value)}
                                placeholder="Paste seller's Firebase UID here"
                                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all font-mono text-sm"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                This is the <code className="bg-gray-100 px-1">userId</code> field from the book document
                            </p>
                        </div>

                        {/* Amount Input */}
                        <div className="mb-6">
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Purchase Amount
                            </label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-semibold">
                                    ₦
                                </span>
                                <input
                                    type="number"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                                />
                            </div>
                            <div className="mt-2 p-3 bg-green-50 rounded-lg border border-green-200">
                                <p className="text-sm text-green-900">
                                    <span className="font-semibold">Seller receives:</span>{' '}
                                    ₦{Math.floor(parseInt(amount || 0) * 0.8).toLocaleString()} (80%)
                                </p>
                                <p className="text-xs text-green-700 mt-1">
                                    Platform fee: ₦{(parseInt(amount || 0) - Math.floor(parseInt(amount || 0) * 0.8)).toLocaleString()} (20%)
                                </p>
                            </div>
                        </div>

                        {/* Error Display */}
                        {error && (
                            <div className="mb-6 p-4 bg-red-50 border-2 border-red-200 rounded-lg flex items-start gap-3">
                                <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
                                <div className="flex-1">
                                    <p className="font-semibold text-red-900">Error</p>
                                    <p className="text-sm text-red-700">{error}</p>
                                </div>
                            </div>
                        )}

                        {/* Success Display */}
                        {result && result.success && (
                            <div className="mb-6 p-4 bg-green-50 border-2 border-green-200 rounded-lg animate-in fade-in">
                                <div className="flex items-start gap-3 mb-4">
                                    <CheckCircle className="text-green-600 flex-shrink-0 mt-0.5" size={24} />
                                    <div>
                                        <p className="font-bold text-green-900 text-lg">
                                            ✅ {result.message}
                                        </p>
                                        <p className="text-sm text-green-700 mt-1">
                                            The seller's account has been updated in Firestore
                                        </p>
                                    </div>
                                </div>
                                <div className="bg-white p-4 rounded-lg space-y-3 border border-green-200">
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-600">Previous Balance:</span>
                                        <span className="font-semibold text-lg">
                                            ₦{result.data.previousBalance?.toLocaleString()}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-600">Amount Added:</span>
                                        <span className="font-semibold text-green-600 text-lg">
                                            +₦{result.data.amountAdded?.toLocaleString()}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center pt-3 border-t-2 border-green-200">
                                        <span className="text-gray-900 font-bold">New Balance:</span>
                                        <span className="font-bold text-2xl text-green-600">
                                            ₦{result.data.newBalance?.toLocaleString()}
                                        </span>
                                    </div>
                                    <div className="pt-3 border-t grid grid-cols-2 gap-4 text-sm">
                                        <div>
                                            <span className="text-gray-600 block">Total Earnings:</span>
                                            <span className="font-semibold text-blue-600">
                                                ₦{result.data.totalEarnings?.toLocaleString()}
                                            </span>
                                        </div>
                                        <div>
                                            <span className="text-gray-600 block">Books Sold:</span>
                                            <span className="font-semibold text-purple-600">
                                                {result.data.booksSold}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-4 text-center">
                                    <a
                                        href="/my-account/seller-account"
                                        className="inline-flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors"
                                    >
                                        View Seller Dashboard →
                                    </a>
                                </div>
                            </div>
                        )}

                        {/* Submit Button */}
                        <button
                            onClick={creditSellerDirectly}
                            disabled={loading || !sellerId.trim()}
                            className="w-full bg-gradient-to-r from-blue-950 to-blue-800 text-white py-4 rounded-lg font-semibold hover:from-blue-900 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                    Processing...
                                </>
                            ) : (
                                <>
                                    <DollarSign size={20} />
                                    Credit Seller Account
                                </>
                            )}
                        </button>

                        <p className="text-xs text-center text-gray-500 mt-3">
                            This directly updates Firestore without using an API route
                        </p>
                    </div>
                </div>

                {/* Why This Works */}
                <div className="mt-6 bg-white rounded-xl shadow-lg p-6">
                    <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                        <CheckCircle className="text-green-600" size={20} />
                        Why This Works
                    </h3>
                    <div className="text-sm text-gray-700 space-y-2">
                        <p>
                            This tool updates Firestore <strong>directly from the browser</strong> using the
                            Firebase SDK, bypassing the need for an API route.
                        </p>
                        <p className="font-semibold text-gray-900 mt-3">What happens:</p>
                        <ol className="list-decimal list-inside space-y-1 ml-2">
                            <li>Finds the seller's document in the <code className="bg-gray-100 px-1">sellers</code> collection</li>
                            <li>Adds ₦4,000 (80% of ₦5,000) to their balance</li>
                            <li>Increments their books sold count</li>
                            <li>Updates last sale timestamp</li>
                        </ol>
                        <p className="text-xs text-gray-500 mt-3">
                            ⚠️ Make sure your Firestore security rules allow authenticated users to update seller documents
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}