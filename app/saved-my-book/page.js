"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebaseConfig';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { Bookmark, Trash2, Lock, ArrowLeft, X, Download } from 'lucide-react';

export default function SavedBooksPage() {
    const router = useRouter();
    const [savedBooks, setSavedBooks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);
    const [selectedBook, setSelectedBook] = useState(null);
    const [showPurchaseModal, setShowPurchaseModal] = useState(false);
    const [showPopup, setShowPopup] = useState(false)

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (currentUser) {
                setUser(currentUser);
                await fetchSavedBooks(currentUser.uid);
            } else {
                router.push('/auth/signin');
            }
        });

        return () => unsubscribe();
    }, [router]);

    const fetchSavedBooks = async (userId) => {
        try {
            setLoading(true);
            const userDocRef = doc(db, 'users', userId);
            const userDoc = await getDoc(userDocRef);

            if (userDoc.exists()) {
                const userData = userDoc.data();
                const saved = userData.savedBooks || [];
                setSavedBooks(saved);
            }
        } catch (error) {
            console.error('Error fetching saved books:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleRemoveFromSaved = async (bookId) => {
        try {
            const userDocRef = doc(db, 'users', user.uid);
            const updatedBooks = savedBooks.filter(book => book.id !== bookId);

            await updateDoc(userDocRef, {
                savedBooks: updatedBooks
            });

            setSavedBooks(updatedBooks);
            setShowPopup(true);
            setTimeout(() => setShowPopup(false), 2000);        } catch (error) {
            console.error('Error removing book:', error);
            alert('Error removing book. Please try again.');
        }
    };

    const handlePurchase = (book) => {
        setSelectedBook(book);
        setShowPurchaseModal(true);
    };

    const handleProceedToPayment = () => {
        if (!selectedBook) return;
        setShowPurchaseModal(false);
        router.push(`/payment?bookId=${selectedBook.id}`);
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-950 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading saved books...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-blue-950 text-white shadow-lg">
                <div className="max-w-7xl mx-auto px-4 py-4">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => router.back()}
                            className="hover:bg-blue-900 p-2 rounded-lg transition-colors"
                        >
                            <ArrowLeft size={24} />
                        </button>
                        <div>
                            <h1 className="text-2xl font-bold">Saved Books</h1>
                            <p className="text-blue-200 text-sm">
                                {savedBooks.length} {savedBooks.length === 1 ? 'book' : 'books'} saved
                            </p>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto py-4">
                {savedBooks.length === 0 ? (
                    <div className="bg-white rounded-lg shadow-lg p-12 text-center">
                        <Bookmark className="w-20 h-20 mx-auto mb-4 text-gray-400" />
                        <h3 className="text-2xl font-bold text-gray-900 mb-2">No Saved Books</h3>
                        <p className="text-gray-600 mb-6">
                            Start saving books you're interested in to view them here later!
                        </p>
                        <button
                            onClick={() => router.push('/home')}
                            className="inline-block bg-blue-950 text-white px-6 py-3 rounded-lg hover:bg-blue-900 transition-colors"
                        >
                            Browse Books
                        </button>
                    </div>
                ) : (
                    <div className="bg-white rounded-lg shadow-lg p-2">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-gray-900">Your Saved Books</h2>
                          
                        </div>

                        {/* Horizontal Scrolling Container */}
                        <div className="overflow-x-auto scrollbar-hide">
                            <div className="flex gap-4 pb-4">
                                {savedBooks.map((book) => (
                                    <div
                                        key={book.id}
                                        className="flex-none w-[200px] sm:w-[220px] bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-xl transition-shadow"
                                    >
                                        <div className="relative">
                                            <img
                                                src={book.image}
                                                alt={book.title}
                                                className="w-full h-64 object-cover"
                                            />
                                            <span className="absolute top-3 right-3 bg-blue-950 text-white px-2 py-1 rounded-full">
                                                <Bookmark size={14} className="fill-white" />
                                            </span>
                                        </div>

                                        <div className="p-4">
                                            <h3 className="font-bold text-sm text-gray-900 mb-1 line-clamp-2">
                                                {book.title}
                                            </h3>
                                            <p className="text-xs text-gray-600 mb-2 line-clamp-1">{book.author}</p>
                                            
                                            <div className="mb-2">
                                                <p className="text-lg font-bold text-blue-950">
                                                    ₦{book.price?.toLocaleString()}
                                                </p>
                                            </div>

                                            <p className="text-xs text-gray-500 mb-3">
                                                Saved {formatDate(book.savedAt)}
                                            </p>

                                            <div className="space-y-2">
                                                <button
                                                    onClick={() => handlePurchase(book)}
                                                    className="w-full bg-blue-950 text-white py-2 rounded-lg hover:bg-blue-900 transition-colors flex items-center justify-center gap-2 text-xs font-semibold"
                                                >
                                                    <Lock size={14} />
                                                    Purchase
                                                </button>
                                                
                                                <button
                                                    onClick={() => handleRemoveFromSaved(book.id)}
                                                    className="w-full bg-white border border-red-500 text-red-500 py-2 rounded-lg hover:bg-red-50 transition-colors flex items-center justify-center gap-2 text-xs font-semibold"
                                                >
                                                    <Trash2 size={14} />
                                                    Remove
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* View All Button */}
                        {savedBooks.length > 5 && (
                            <div className="mt-6 text-center">
                                <p className="text-sm text-gray-600">
                                    💡 Tip: Scroll left or right to see all your saved books
                                </p>
                            </div>
                        )}
                    </div>
                )}
            </main>

 
{showPopup && (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-fadeIn">
        Removed from saved later
    </div>
 )}
            {/* Purchase Modal */}
            {showPurchaseModal && selectedBook && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg max-w-md w-full p-6">
                        <div className="flex justify-between items-start mb-4">
                            <h3 className="text-xl font-bold text-gray-900">Purchase PDF Book</h3>
                            <button onClick={() => setShowPurchaseModal(false)}>
                                <X size={24} className="text-gray-600 hover:text-gray-900" />
                            </button>
                        </div>

                        <div className="mb-4">
                            <img
                                src={selectedBook.image}
                                alt={selectedBook.title}
                                className="w-full h-48 object-cover rounded-lg mb-4"
                            />
                            <h4 className="font-bold text-lg text-blue-950">{selectedBook.title}</h4>
                            <p className="text-gray-600">{selectedBook.author}</p>
                            <p className="text-2xl font-bold text-blue-950 mt-2">
                                ₦ {selectedBook.price?.toLocaleString()}
                            </p>
                        </div>

                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                            <div className="flex items-start gap-3">
                                <Lock className="w-5 h-5 text-blue-950 mt-1" />
                                <div className="text-sm text-blue-950">
                                    <p className="font-semibold mb-1">Instant PDF Access</p>
                                    <p>After payment, the PDF will be sent to: <strong>{user?.email}</strong></p>
                                    <p className="mt-2">You can also download it from "My Books" section anytime.</p>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={handleProceedToPayment}
                            className="w-full bg-blue-950 text-white py-3 rounded-lg hover:bg-blue-900 transition-colors font-semibold"
                        >
                            Proceed to Payment
                        </button>
                    </div>
                </div>
            )}

            {/* Custom Scrollbar Styles */}
            <style jsx>{`
                .scrollbar-hide {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
                .scrollbar-hide::-webkit-scrollbar {
                    display: none;
                }
            `}</style>
        </div>
    );
}