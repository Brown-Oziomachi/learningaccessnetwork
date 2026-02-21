"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebaseConfig';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { Bookmark, Trash2, Lock, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function SavedBooksClient() {
    const router = useRouter();
    const [savedBooks, setSavedBooks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);
    const [showPopup, setShowPopup] = useState(false);

    // ✅ THUMBNAIL HELPER FUNCTION
    const getThumbnailUrl = (book) => {
        if (book.driveFileId) {
            return `https://drive.google.com/thumbnail?id=${book.driveFileId}&sz=w400`;
        }

        if (book.embedUrl) {
            const match = book.embedUrl.match(/\/d\/(.*?)\/|\/file\/d\/(.*?)\/|id=(.*?)(&|$)/);
            if (match) {
                const fileId = match[1] || match[2] || match[3];
                if (fileId) {
                    return `https://drive.google.com/thumbnail?id=${fileId}&sz=w400`;
                }
            }
        }

        if (book.pdfUrl && book.pdfUrl.includes('drive.google.com')) {
            const match = book.pdfUrl.match(/[-\w]{25,}/);
            if (match) {
                return `https://drive.google.com/thumbnail?id=${match[0]}&sz=w400`;
            }
        }

        return book.image || 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400';
    };

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

    // ✅ FETCH AND PROCESS SAVED BOOKS WITH THUMBNAILS
    const fetchSavedBooks = async (userId) => {
        try {
            setLoading(true);
            const userDocRef = doc(db, 'users', userId);
            const userDoc = await getDoc(userDocRef);

            if (userDoc.exists()) {
                const userData = userDoc.data();
                const saved = userData.savedBooks || [];

                // ✅ Process each saved book to ensure proper thumbnail
                const processedSavedBooks = saved.map(book => ({
                    ...book,
                    image: getThumbnailUrl(book) // Generate thumbnail from embedUrl/driveFileId
                }));

                setSavedBooks(processedSavedBooks);
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
            setTimeout(() => setShowPopup(false), 2000);
        } catch (error) {
            console.error('Error removing book:', error);
            alert('Error removing book. Please try again.');
        }
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
                            onClick={() => router.push('/documents')}
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
                                        {/* ✅ Make image clickable to preview */}
                                        <Link href={`/book/preview?id=${book.id}`}>
                                            <div className="relative cursor-pointer">
                                                <img
                                                    src={book.image}
                                                    alt={book.title}
                                                    className="w-full h-64 object-cover bg-gray-200"
                                                    onError={(e) => {
                                                        e.target.src = 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400';
                                                    }}
                                                />
                                                <span className="absolute top-3 right-3 bg-blue-950 text-white px-2 py-1 rounded-full">
                                                    <Bookmark size={14} className="fill-white" />
                                                </span>
                                                {/* ✅ Show "New" badge for Firestore books */}
                                                {book.isFromFirestore && (
                                                    <span className="absolute top-3 left-3 bg-blue-600 text-white px-2 py-1 rounded text-xs font-bold">
                                                        New
                                                    </span>
                                                )}
                                            </div>
                                        </Link>

                                        <div className="p-4">
                                            {/* ✅ Make title clickable to preview */}
                                            <Link href={`/book/preview?id=${book.id}`}>
                                                <h3 className="font-bold text-sm text-gray-900 mb-1 line-clamp-2 hover:text-blue-950 cursor-pointer">
                                                    {book.title}
                                                </h3>
                                            </Link>
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
                                                {/* ✅ Preview button instead of Purchase */}
                                                <Link
                                                    href={`/book/preview?id=${book.id}`}
                                                    className="w-full bg-blue-950 text-white py-2 rounded-lg hover:bg-blue-900 transition-colors flex items-center justify-center gap-2 text-xs font-semibold"
                                                >
                                                    <Lock size={14} />
                                                    View & Purchase
                                                </Link>

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

            {/* Popup Notification */}
            {showPopup && (
                <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-fadeIn">
                    Removed from saved books
                </div>
            )}

            {/* Custom Scrollbar Styles & Animations */}
            <style jsx>{`
                .scrollbar-hide {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
                .scrollbar-hide::-webkit-scrollbar {
                    display: none;
                }
                @keyframes fadeIn {
                    from {
                        opacity: 0;
                        transform: translateX(-50%) translateY(10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateX(-50%) translateY(0);
                    }
                }
                .animate-fadeIn {
                    animation: fadeIn 0.3s ease-out;
                }
            `}</style>
        </div>
    );
}