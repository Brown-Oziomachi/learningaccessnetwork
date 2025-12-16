// ===========================
// FILE: app/my-books/page.jsx
// FETCHES PURCHASED BOOKS FROM FIREBASE
// ===========================

"use client"
import React, { useState, useEffect } from 'react';
import { Globe, Download, ArrowLeft, FileText, Calendar, CreditCard } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { auth, db } from "@/lib/firebaseConfig";
import { doc, getDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

export default function MyBooksPage() {
    const router = useRouter();
    const [purchasedBooks, setPurchasedBooks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);

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

    const fetchPurchasedBooks = async (userId) => {
        try {
            setLoading(true);
            
            // Fetch from Firebase
            const userDocRef = doc(db, 'users', userId);
            const userDoc = await getDoc(userDocRef);

            if (userDoc.exists()) {
                const userData = userDoc.data();
                const books = userData.purchasedBooks || [];
                setPurchasedBooks(books);
            } else {
                // If no Firebase data, check localStorage as fallback
                const userEmail = auth.currentUser?.email;
                const localBooks = JSON.parse(localStorage.getItem(`purchased_${userEmail}`) || '[]');
                setPurchasedBooks(localBooks);
            }
        } catch (error) {
            console.error('Error fetching books:', error);
            // Fallback to localStorage
            const userEmail = auth.currentUser?.email;
            const localBooks = JSON.parse(localStorage.getItem(`purchased_${userEmail}`) || '[]');
            setPurchasedBooks(localBooks);
        } finally {
            setLoading(false);
        }
    };

    const handleDownload = (book) => {
        alert(`Downloading ${book.title}...\n\nPDF download link has been sent to:\n${user?.email}\n\nTransaction ID: ${book.transactionId}`);
        // In production, this would trigger actual PDF download from your server
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-950 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading your books...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-blue-950 text-white shadow-lg">
                <div className="max-w-7xl mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <Link href="/home" className="flex items-center gap-2">
                            <Globe className="w-8 h-8" />
                            <h1 className="text-xl md:text-2xl font-bold">
                                L <span className="text-blue-400">A N</span>
                            </h1>
                        </Link>
                        <button onClick={() => router.back()} className="flex items-center gap-2 hover:text-blue-400 transition-colors">
                            <ArrowLeft size={20} />
                            <span>Back</span>
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 py-8">
                <div className="mb-8">
                    <h2 className="text-3xl font-bold text-gray-900 mb-2">My Books</h2>
                    <p className="text-gray-600">
                        {purchasedBooks.length} {purchasedBooks.length === 1 ? 'book' : 'books'} purchased
                    </p>
                </div>

                {purchasedBooks.length === 0 ? (
                    <div className="bg-white rounded-lg shadow-lg p-12 text-center">
                        <FileText className="w-20 h-20 mx-auto mb-4 text-gray-400" />
                        <h3 className="text-2xl font-bold text-gray-900 mb-2">No Books Yet</h3>
                        <p className="text-gray-600 mb-6">
                            You haven't purchased any books yet. Browse our library to get started!
                        </p>
                        <Link
                            href="/pdf"
                            className="inline-block bg-blue-950 text-white px-6 py-3 rounded-lg hover:bg-blue-900 transition-colors"
                        >
                            Browse Books
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {purchasedBooks.map((book) => (
                            <div
                                key={book.id || book.transactionId}
                                className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
                            >
                                <div className="relative">
                                    <img
                                        src={book.image}
                                        alt={book.title}
                                        className="w-full h-64 object-cover"
                                    />
                                    <span className="absolute top-3 right-3 bg-green-600 text-white px-3 py-1 rounded-full text-xs font-bold">
                                        Purchased
                                    </span>
                                </div>

                                <div className="p-6">
                                    <h3 className="font-bold text-lg text-gray-900 mb-2 line-clamp-2">
                                        {book.title}
                                    </h3>
                                    <p className="text-sm text-gray-600 mb-4">{book.author}</p>

                                    <div className="space-y-2 mb-4 text-sm">
                                        <div className="flex items-center gap-2 text-gray-600">
                                            <Calendar size={16} />
                                            <span>Purchased: {formatDate(book.purchaseDate)}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-gray-600">
                                            <CreditCard size={16} />
                                            <span>₦ {book.amount?.toLocaleString() || book.price?.toLocaleString()}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-gray-600">
                                            <FileText size={16} />
                                            <span>{book.pages} pages • {book.format}</span>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => handleDownload(book)}
                                        className="w-full bg-blue-950 text-white py-3 rounded-lg hover:bg-blue-900 transition-colors flex items-center justify-center gap-2 font-semibold"
                                    >
                                        <Download size={18} />
                                        Download PDF
                                    </button>

                                    <p className="text-xs text-gray-500 text-center mt-3">
                                        Transaction ID: {book.transactionId}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}