// app/admin/fix-seller-id/page.js
"use client"
import { useState, useEffect } from 'react';
import { db, auth } from '@/lib/firebaseConfig';
import { doc, setDoc, getDoc, deleteDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

export default function FixSellerIdPage() {
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [currentUser, setCurrentUser] = useState(null);
    const [oldSellerData, setOldSellerData] = useState(null);

    const OLD_SELLER_ID = "Z9kGq0DehgdWCn6ucgXbHhH4xCe2";

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                setCurrentUser(user);
                // Check if old seller exists
                const oldSellerRef = doc(db, 'sellers', OLD_SELLER_ID);
                const oldSellerDoc = await getDoc(oldSellerRef);
                if (oldSellerDoc.exists()) {
                    setOldSellerData(oldSellerDoc.data());
                }
            }
        });
        return () => unsubscribe();
    }, []);

    const migrateSellerAccount = async () => {
        if (!currentUser) {
            setError('❌ You must be logged in');
            return;
        }

        setLoading(true);
        setMessage('');
        setError('');

        try {
            const newSellerId = currentUser.uid; // yrylYEHv18PVghDWl8IoWzmlhpS2

            // Step 1: Get data from old seller document
            const oldSellerRef = doc(db, 'sellers', OLD_SELLER_ID);
            const oldSellerDoc = await getDoc(oldSellerRef);

            if (!oldSellerDoc.exists()) {
                setError('❌ Old seller document not found!');
                setLoading(false);
                return;
            }

            const oldData = oldSellerDoc.data();

            // Step 2: Create new seller document with correct ID
            const newSellerRef = doc(db, 'sellers', newSellerId);
            await setDoc(newSellerRef, {
                ...oldData,
                sellerId: newSellerId, // Update the sellerId field
                sellerEmail: currentUser.email, // Update email to match auth
                updatedAt: new Date()
            });

            // Step 3: Delete old document (optional - comment out if you want to keep it)
            // await deleteDoc(oldSellerRef);

            setMessage(`✅ SUCCESS! Seller account migrated!

OLD ID: ${OLD_SELLER_ID}
NEW ID: ${newSellerId}

Account Balance: ₦${oldData.accountBalance?.toLocaleString() || 0}
Total Earnings: ₦${oldData.totalEarnings?.toLocaleString() || 0}
Books Sold: ${oldData.booksSold || 0}

✅ Your seller account is now linked to your authentication!
✅ Now update PLATFORM_OWNER.sellerId in booksData.js to: "${newSellerId}"`);

            console.log('Migration complete!');

        } catch (err) {
            console.error('Error migrating seller account:', err);
            setError('❌ Failed to migrate: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const checkBothAccounts = async () => {
        if (!currentUser) return;

        setLoading(true);
        setMessage('');
        setError('');

        try {
            const messages = [];

            // Check old account
            const oldSellerRef = doc(db, 'sellers', OLD_SELLER_ID);
            const oldSellerDoc = await getDoc(oldSellerRef);

            if (oldSellerDoc.exists()) {
                const data = oldSellerDoc.data();
                messages.push(`📦 OLD SELLER (${OLD_SELLER_ID}):
Balance: ₦${data.accountBalance?.toLocaleString() || 0}
Email: ${data.sellerEmail}
Status: ${data.status}`);
            } else {
                messages.push(`❌ OLD SELLER (${OLD_SELLER_ID}): Not found`);
            }

            // Check new account
            const newSellerRef = doc(db, 'sellers', currentUser.uid);
            const newSellerDoc = await getDoc(newSellerRef);

            if (newSellerDoc.exists()) {
                const data = newSellerDoc.data();
                messages.push(`✅ NEW SELLER (${currentUser.uid}):
Balance: ₦${data.accountBalance?.toLocaleString() || 0}
Email: ${data.sellerEmail}
Status: ${data.status}`);
            } else {
                messages.push(`⚠️ NEW SELLER (${currentUser.uid}): Not found (will be created during migration)`);
            }

            setMessage(messages.join('\n\n'));

        } catch (err) {
            setError('❌ Error: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-lg p-8">
                <h1 className="text-3xl font-bold mb-6">Fix Seller ID Mismatch</h1>

                <div className="space-y-4">
                    {/* Current Status */}
                    <div className="bg-yellow-50 border border-yellow-200 rounded p-4">
                        <h3 className="font-bold text-yellow-900 mb-2">🔍 Problem Detected:</h3>
                        <p className="text-sm text-yellow-900 mb-2">
                            Your Authentication UID doesn't match your Seller Document ID
                        </p>
                        <div className="text-sm space-y-1">
                            <p><strong>Your Auth UID:</strong> {currentUser?.uid || 'Loading...'}</p>
                            <p><strong>Old Seller ID:</strong> {OLD_SELLER_ID}</p>
                        </div>
                    </div>

                    {/* Old Seller Data Preview */}
                    {oldSellerData && (
                        <div className="bg-blue-50 border border-blue-200 rounded p-4">
                            <h3 className="font-bold text-blue-900 mb-2">📊 Current Seller Data:</h3>
                            <div className="text-sm space-y-1">
                                <p><strong>Balance:</strong> ₦{oldSellerData.accountBalance?.toLocaleString() || 0}</p>
                                <p><strong>Total Earnings:</strong> ₦{oldSellerData.totalEarnings?.toLocaleString() || 0}</p>
                                <p><strong>Books Sold:</strong> {oldSellerData.booksSold || 0}</p>
                                <p><strong>Business:</strong> {oldSellerData.businessInfo?.businessName || 'N/A'}</p>
                            </div>
                        </div>
                    )}

                    {/* Action Buttons */}
                    <button
                        onClick={checkBothAccounts}
                        disabled={loading}
                        className="w-full bg-purple-600 text-white py-3 rounded-lg font-semibold
                                 hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Checking...' : '🔍 Check Both Accounts'}
                    </button>

                    <button
                        onClick={migrateSellerAccount}
                        disabled={loading || !currentUser}
                        className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold
                                 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Migrating...' : '✅ Migrate Seller Account to Correct ID'}
                    </button>

                    {/* Instructions */}
                    <div className="bg-gray-50 border border-gray-200 rounded p-4">
                        <h3 className="font-bold mb-2">📝 What This Does:</h3>
                        <ol className="text-sm space-y-2 list-decimal list-inside">
                            <li>Copies all your seller data to a new document with your correct Auth UID</li>
                            <li>Updates the sellerId field to match your authentication</li>
                            <li>Preserves your balance, earnings, and all other data</li>
                        </ol>
                        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-300 rounded">
                            <p className="text-sm font-semibold text-yellow-900">⚠️ IMPORTANT: After migration, update your booksData.js:</p>
                            <code className="text-xs bg-white px-2 py-1 rounded block mt-2">
                                sellerId: "{currentUser?.uid || 'yrylYEHv18PVghDWl8IoWzmlhpS2'}"
                            </code>
                        </div>
                    </div>

                    {/* Messages */}
                    {message && (
                        <div className="bg-green-50 border border-green-200 rounded p-4">
                            <pre className="text-sm text-green-900 whitespace-pre-wrap">
                                {message}
                            </pre>
                        </div>
                    )}

                    {error && (
                        <div className="bg-red-50 border border-red-200 rounded p-4">
                            <p className="text-red-900">{error}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}