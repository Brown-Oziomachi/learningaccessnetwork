"use client"
import React, { useState, useEffect } from 'react';
import { Globe, LogOut, User, ChevronDown, AlignEndVertical, Download, Menu, FileText, Calendar, CreditCard, X, ExternalLink, ThumbsUp, Search, Lock, ArrowLeft, ZoomIn, ZoomOut, Maximize } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { auth, db } from "@/lib/firebaseConfig";
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { booksData } from '@/lib/booksData';
import Navbar from '@/components/NavBar';

export default function MyBooksPage() {
    const router = useRouter();
    const [purchasedBooks, setPurchasedBooks] = useState([]);
    const [selectedBook, setSelectedBook] = useState(null);
    const [showOverview, setShowOverview] = useState(false);
    const [showRelatedModal, setShowRelatedModal] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);
    const [purchasedBookIds, setPurchasedBookIds] = useState(new Set());
    const [pdfUrl, setPdfUrl] = useState(null);
    const [loadingPdf, setLoadingPdf] = useState(false);

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

            const userDocRef = doc(db, 'users', userId);
            const userDoc = await getDoc(userDocRef);

            if (userDoc.exists()) {
                const userData = userDoc.data();
                const purchasedBooksFromDB = userData.purchasedBooks || [];

                const bookIds = new Set(purchasedBooksFromDB.map(book => book.id));
                setPurchasedBookIds(bookIds);

                // Enrich with data from both booksData and Firebase advertMyBook
                const enrichedBooks = await Promise.all(purchasedBooksFromDB.map(async (purchasedBook) => {
                    // First check booksData
                    let bookData = booksData.find(b => b.id === purchasedBook.id);

                    // If not in booksData, check Firebase advertMyBook
                    if (!bookData) {
                        try {
                            const bookDocRef = doc(db, 'advertMyBook', purchasedBook.id);
                            const bookDoc = await getDoc(bookDocRef);
                            
                            if (bookDoc.exists()) {
                                const fbBook = bookDoc.data();
                                bookData = {
                                    id: bookDoc.id,
                                    title: fbBook.bookTitle,
                                    author: fbBook.author,
                                    image: fbBook.coverImage,
                                    pages: fbBook.pages,
                                    format: fbBook.format,
                                    category: fbBook.category,
                                    description: fbBook.description,
                                    pdfUrl: fbBook.pdfUrl || fbBook.driveFileId ? `https://drive.google.com/file/d/${fbBook.driveFileId}/preview` : null,
                                    driveFileId: fbBook.driveFileId,
                                    pdfLink: fbBook.pdfLink
                                };
                            }
                        } catch (error) {
                            console.error('Error fetching book from Firebase:', error);
                        }
                    }

                    if (bookData) {
                        return {
                            ...bookData,
                            ...purchasedBook,
                            purchaseDate: purchasedBook.purchaseDate,
                            transactionId: purchasedBook.transactionId,
                            amount: purchasedBook.amount || purchasedBook.price
                        };
                    }

                    return purchasedBook;
                }));

                setPurchasedBooks(enrichedBooks);
            } else {
                const userEmail = auth.currentUser?.email;
                const localBooks = JSON.parse(localStorage.getItem(`purchased_${userEmail}`) || '[]');

                const enrichedBooks = localBooks.map(purchasedBook => {
                    const bookData = booksData.find(b => b.id === purchasedBook.id);
                    return bookData ? { ...bookData, ...purchasedBook } : purchasedBook;
                });

                setPurchasedBooks(enrichedBooks);
            }
        } catch (error) {
            console.error('Error fetching books:', error);
            const userEmail = auth.currentUser?.email;
            const localBooks = JSON.parse(localStorage.getItem(`purchased_${userEmail}`) || '[]');

            const enrichedBooks = localBooks.map(purchasedBook => {
                const bookData = booksData.find(b => b.id === purchasedBook.id);
                return bookData ? { ...bookData, ...purchasedBook } : purchasedBook;
            });

            setPurchasedBooks(enrichedBooks);
        } finally {
            setLoading(false);
        }
    };

    const extractFileId = (url) => {
        if (!url) return null;
        
        // Pattern 1: /d/FILE_ID/view or /d/FILE_ID/preview
        const pattern1 = url.match(/\/d\/([^\/\?]+)/);
        if (pattern1) return pattern1[1];
        
        // Pattern 2: ?id=FILE_ID
        const pattern2 = url.match(/[?&]id=([^&]+)/);
        if (pattern2) return pattern2[1];
        
        // Pattern 3: /open?id=FILE_ID
        const pattern3 = url.match(/\/open\?id=([^&]+)/);
        if (pattern3) return pattern3[1];
        
        return null;
    };

    const handleOpenBook = async (book) => {
        setLoadingPdf(true);
        setSelectedBook(book);
        
        let url = null;
        let fileId = null;
        
        // Try to get file ID from various sources
        if (book.driveFileId) {
            fileId = book.driveFileId;
        } else if (book.pdfUrl) {
            fileId = extractFileId(book.pdfUrl);
        } else if (book.pdfLink) {
            fileId = extractFileId(book.pdfLink);
        } else if (book.previewUrl) {
            fileId = extractFileId(book.previewUrl);
        }
        
        // Build the embed URL - using direct preview endpoint
        if (fileId) {
            // This URL works best for embedded viewing
            url = `https://drive.google.com/file/d/${fileId}/preview`;
        }
        
        setPdfUrl(url);
        setLoadingPdf(false);
        setShowOverview(false);
        setShowRelatedModal(false);
    };

    const getRelatedBooks = (book) => {
        return booksData.filter(b =>
            b.category === book.category &&
            b.id !== book.id
        ).slice(0, 10);
    };

    const isPurchased = (bookId) => {
        return purchasedBookIds.has(bookId);
    };

    const handlePurchaseRelatedBook = (book) => {
        router.push(`/payment?bookId=${book.id}`);
    };

    const handleDownload = (book) => {
        let fileId = null;
        
        // Extract file ID for download
        if (book.driveFileId) {
            fileId = book.driveFileId;
        } else if (book.pdfUrl) {
            fileId = extractFileId(book.pdfUrl);
        } else if (book.pdfLink) {
            fileId = extractFileId(book.pdfLink);
        }
        
        if (fileId) {
            // Open Google Drive download link in new tab
            window.open(`https://drive.google.com/uc?export=download&id=${fileId}`, '_blank');
        } else {
            alert(`Download link for ${book.title} will be sent to ${user?.email}`);
        }
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
            <div className="min-h-screen bg-blue-950 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-50 mx-auto"></div>
                    <p className="mt-4 text-white">Loading My Books...</p>
                </div>
            </div>
        );
    }

    // PDF Viewer
    if (selectedBook) {
        return (
            <div className="min-h-screen bg-gray-100 flex flex-col">
                <Navbar />
                
                {/* Categories Bar */}
                

                {/* Top Action Bar */}
                <div className="bg-white border-b px-4 py-3 flex items-center justify-between">
                    <button
                        onClick={() => setSelectedBook(null)}
                        className="flex items-center gap-2 text-gray-700 hover:text-gray-900"
                    >
                        <ArrowLeft size={20} />
                        <span className="font-medium">Back to Library</span>
                    </button>
                    <h1 className='text-blue-950 font-bold text-2xl'>{selectedBook.title}</h1>
                    <div className="flex gap-2">
                        <button
                            onClick={() => handleDownload(selectedBook)}
                            className="bg-blue-950 hover:bg-blue-900 text-white px-4 py-2 rounded-lg font-semibold flex items-center gap-2"
                        >
                            <Download size={18} />
                            Download
                        </button>
                    </div>
                </div>

                {/* PDF Viewer */}
                <div className="flex-1 bg-white relative">
                    {loadingPdf ? (
                        <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
                            <div className="text-center">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-950 mx-auto mb-4"></div>
                                <p className="text-gray-600">Loading document...</p>
                            </div>
                        </div>
                    ) : pdfUrl ? (
                        <div className="w-full h-full relative">
                            <iframe
                                src={pdfUrl}
                                className="w-full h-full border-0"
                                title={selectedBook.title}
                                style={{ 
                                    minHeight: 'calc(100vh - 200px)',
                                    backgroundColor: 'white'
                                }}
                                allow="autoplay"
                            />
                            
                            {/* Fallback button if PDF doesn't load */}
                            <div className="absolute bottom-4 right-4">
                                <button
                                    onClick={() => {
                                        const fileId = extractFileId(selectedBook.pdfUrl || selectedBook.pdfLink);
                                        if (fileId) {
                                            window.open(`https://drive.google.com/file/d/${fileId}/view`, '_blank');
                                        }
                                    }}
                                    className="bg-blue-950 text-white px-4 py-2 rounded-lg hover:bg-blue-900 shadow-lg flex items-center gap-2 text-sm"
                                >
                                    <ExternalLink size={16} />
                                    Open in Full Screen
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
                            <div className="text-center bg-white p-8 rounded-lg shadow-lg max-w-md">
                                <FileText className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                                <h3 className="text-xl font-bold mb-2 text-gray-900">{selectedBook.title}</h3>
                                <p className="text-gray-600 mb-4">Document preview not available</p>
                                <p className="text-sm text-gray-500 mb-4">
                                    Please check that the Google Drive file is shared publicly
                                </p>
                                <div className="space-y-2">
                                    <button
                                        onClick={() => handleDownload(selectedBook)}
                                        className="w-full bg-blue-950 text-white px-6 py-3 rounded-lg hover:bg-blue-900 flex items-center justify-center gap-2"
                                    >
                                        <Download size={20} />
                                        Download PDF
                                    </button>
                                    <button
                                        onClick={() => {
                                            const fileId = extractFileId(selectedBook.pdfUrl || selectedBook.pdfLink);
                                            if (fileId) {
                                                window.open(`https://drive.google.com/file/d/${fileId}/view`, '_blank');
                                            }
                                        }}
                                        className="w-full bg-white border-2 border-blue-950 text-blue-950 px-6 py-3 rounded-lg hover:bg-blue-50 flex items-center justify-center gap-2"
                                    >
                                        <ExternalLink size={20} />
                                        Open in Browser
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Bottom Action Bar */}
                <div className="bg-white border-t shadow-lg">
                    <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
                        <div className="flex items-center gap-6">
                            <button
                                onClick={() => setShowOverview(true)}
                                className="flex items-center gap-2 text-gray-700 hover:text-gray-900"
                            >
                                <FileText size={20} />
                                <span className="font-medium">Overview</span>
                            </button>
                            <button
                                onClick={() => setShowRelatedModal(true)}
                                className="flex items-center gap-2 text-gray-700 hover:text-gray-900"
                            >
                                <FileText size={20} />
                                <span className="font-medium">Related documents</span>
                            </button>
                        </div>
                        
                        <div className="text-sm text-gray-600">
                            <span className="font-medium">{selectedBook.pages}</span> pages • {selectedBook.format || 'PDF'}
                        </div>
                    </div>
                </div>

                {/* Overview Sidebar */}
                {showOverview && (
                    <div className="fixed inset-y-0 right-0 w-96 bg-white shadow-2xl z-50 overflow-y-auto">
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-2xl font-bold text-gray-900">Overview</h2>
                                <button onClick={() => setShowOverview(false)} className="text-gray-500 hover:text-gray-700">
                                    <X size={24} />
                                </button>
                            </div>

                            <img src={selectedBook.image || selectedBook.coverImage} alt={selectedBook.title} className="w-full h-64 object-cover rounded-lg mb-4" />
                            
                            <h3 className="text-xl font-bold mb-2 text-gray-900">{selectedBook.title}</h3>
                            <p className="text-sm text-gray-600 mb-4">
                                By <span className="underline">{selectedBook.author}</span>
                            </p>

                            <div className="grid grid-cols-4 gap-4 mb-6">
                                <button onClick={() => handleDownload(selectedBook)} className="flex flex-col items-center gap-1 text-gray-700 hover:text-gray-900">
                                    <Download size={24} />
                                    <span className="text-xs">Download</span>
                                </button>
                            </div>

                            {selectedBook.description && (
                                <>
                                    <h3 className="font-bold mb-2 text-gray-900">Description</h3>
                                    <p className="text-sm text-gray-600 mb-6">{selectedBook.description}</p>
                                </>
                            )}

                            <h3 className="font-bold mb-2 text-gray-900">Purchase Details</h3>
                            <div className="space-y-2 text-sm text-gray-600 mb-6">
                                <p>Date: {formatDate(selectedBook.purchaseDate)}</p>
                                <p>Amount: ₦ {selectedBook.amount?.toLocaleString()}</p>
                                <p>Transaction: {selectedBook.transactionId}</p>
                            </div>

                            <h3 className="font-bold mb-2 text-gray-900">Category</h3>
                            <p className="text-sm text-gray-600 mb-6">{selectedBook.category || 'General'}</p>

                            <h3 className="font-bold mb-2 text-gray-900">Format</h3>
                            <p className="text-sm text-gray-600">{selectedBook.format || 'PDF'} • {selectedBook.pages} pages</p>
                        </div>
                    </div>
                )}

                {/* Related Documents Modal */}
                {showRelatedModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden">
                            <div className="p-6 border-b flex items-center justify-between">
                                <h2 className="text-2xl font-bold text-gray-900">Related Documents</h2>
                                <button onClick={() => setShowRelatedModal(false)} className="text-gray-500 hover:text-gray-700">
                                    <X size={24} />
                                </button>
                            </div>

                            <div className="p-6 overflow-y-auto max-h-[calc(90vh-100px)]">
                                <div className="space-y-4">
                                    {getRelatedBooks(selectedBook).length > 0 ? (
                                        getRelatedBooks(selectedBook).map((relatedBook) => (
                                            <div key={relatedBook.id} className="flex gap-4 p-4 hover:bg-gray-50 rounded-lg border border-gray-200">
                                                <div className="relative flex-shrink-0">
                                                    <img src={relatedBook.image} alt={relatedBook.title} className="w-24 h-32 object-cover rounded shadow-md" />
                                                    <span className="absolute top-1 left-1 bg-red-600 text-white text-xs px-1.5 py-0.5 rounded font-bold">
                                                        PDF
                                                    </span>
                                                    {isPurchased(relatedBook.id) && (
                                                        <span className="absolute bottom-1 left-1 bg-green-600 text-white text-xs px-1.5 py-0.5 rounded font-bold">
                                                            Owned
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex-1">
                                                    <h4 className="font-semibold text-base mb-2 text-gray-900">{relatedBook.title}</h4>
                                                    <p className="text-sm text-gray-600 mb-2">By {relatedBook.author}</p>
                                                    <p className="text-sm text-gray-500 mb-2">{relatedBook.pages} pages</p>

                                                    {isPurchased(relatedBook.id) ? (
                                                        <button
                                                            onClick={() => handleOpenBook(relatedBook)}
                                                            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 text-sm font-semibold"
                                                        >
                                                            <ExternalLink size={16} className="inline mr-2" />
                                                            Open Book
                                                        </button>
                                                    ) : (
                                                        <div className="flex items-center gap-4">
                                                            <p className="text-lg font-bold text-blue-950">₦ {relatedBook.price.toLocaleString()}</p>
                                                            <button
                                                                onClick={() => handlePurchaseRelatedBook(relatedBook)}
                                                                className="bg-blue-950 text-white px-4 py-2 rounded-lg hover:bg-blue-900 text-sm font-semibold"
                                                            >
                                                                <Lock size={16} className="inline mr-2" />
                                                                Purchase
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center py-8 text-gray-500">
                                            <FileText className="w-16 h-16 mx-auto mb-3 text-gray-400" />
                                            <p>No related documents found</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    // Main Library View
    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />

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
                            href="/home"
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
                                        src={book.image || book.coverImage}
                                        alt={book.title}
                                        className="w-full h-64 object-cover"
                                    />
                                    <span className="absolute top-3 right-3 bg-blue-950 text-white px-3 py-1 rounded-full text-xs font-bold">
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
                                            <span>{book.pages} pages • {book.format || 'PDF'}</span>
                                        </div>
                                    </div>

                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleOpenBook(book)}
                                            className="flex-1 bg-blue-950 text-white py-3 rounded-lg hover:bg-blue-900 transition-colors flex items-center justify-center gap-2 font-semibold"
                                        >
                                            <ExternalLink size={18} />
                                            Open Book
                                        </button>
                                        <button
                                            onClick={() => handleDownload(book)}
                                            className="bg-white border-2 border-blue-950 text-blue-950 px-4 py-3 rounded-lg hover:bg-blue-950 hover:text-white transition-colors"
                                        >
                                            <Download size={18} />
                                        </button>
                                    </div>

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