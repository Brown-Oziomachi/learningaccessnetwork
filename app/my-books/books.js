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

export default function MyBooksClient() {
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

    // Helper function to get thumbnail URL
    const getThumbnailUrl = (book) => {
        if (!book) return 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400';

        if (book.driveFileId) {
            return `https://drive.google.com/thumbnail?id=${book.driveFileId}&sz=w400`;
        }

        if (book.embedUrl) {
            const match = book.embedUrl.match(/\/d\/([\w-]{25,})|\/file\/d\/([\w-]{25,})/);
            if (match) {
                const fileId = match[1] || match[2];
                return `https://drive.google.com/thumbnail?id=${fileId}&sz=w400`;
            }
        }

        const pdfSource = book.pdfUrl || book.pdfLink;
        if (pdfSource && pdfSource.includes('drive.google.com')) {
            const match = pdfSource.match(/\/d\/([\w-]{25,})|\/file\/d\/([\w-]{25,})/);
            if (match) {
                const fileId = match[1] || match[2];
                return `https://drive.google.com/thumbnail?id=${fileId}&sz=w400`;
            }
        }

        if (book.previewUrl) {
            const match = book.previewUrl.match(/\/d\/([\w-]{25,})|\/file\/d\/([\w-]{25,})/);
            if (match) {
                const fileId = match[1] || match[2];
                return `https://drive.google.com/thumbnail?id=${fileId}&sz=w400`;
            }
        }

        return book.image || book.coverImage || 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400';
    };

    const extractFileId = (url) => {
        if (!url) return null;
        const match = url.match(/\/d\/([\w-]{25,})|\/file\/d\/([\w-]{25,})|id=([^\&]+)/);
        return match ? (match[1] || match[2] || match[3]) : null;
    };

    // Handle opening a book
    const handleOpenBook = async (book) => {
        setLoadingPdf(true);
        setSelectedBook(book);

        let url = null;
        let fileId = null;

        console.log("Opening book:", book);

        if (book.embedUrl) {
            url = book.embedUrl;
            console.log("✅ Using embedUrl:", url);
        } else if (book.driveFileId) {
            url = `https://drive.google.com/file/d/${book.driveFileId}/preview`;
            console.log("✅ Using driveFileId:", url);
        } else if (book.pdfUrl) {
            fileId = extractFileId(book.pdfUrl);
            url = fileId ? `https://drive.google.com/file/d/${fileId}/preview` : book.pdfUrl;
            console.log("✅ Using pdfUrl:", url);
        } else if (book.pdfLink) {
            fileId = extractFileId(book.pdfLink);
            if (fileId) {
                url = `https://drive.google.com/file/d/${fileId}/preview`;
            }
        } else if (book.previewUrl) {
            fileId = extractFileId(book.previewUrl);
            if (fileId) {
                url = `https://drive.google.com/file/d/${fileId}/preview`;
            }
        }

        console.log("Final PDF URL:", url);
        setPdfUrl(url);
        setLoadingPdf(false);
        setShowOverview(false);
        setShowRelatedModal(false);
    };

    // Fetch purchased books
    const fetchPurchasedBooks = async (userId) => {
        try {
            setLoading(true);
            console.log("Fetching purchased books for user:", userId);

            const userDocRef = doc(db, 'users', userId);
            const userDoc = await getDoc(userDocRef);

            if (userDoc.exists()) {
                const userData = userDoc.data();
                const purchasedBooksMap = userData.purchasedBooks || {};
                const purchasedBooksArray = Object.values(purchasedBooksMap);

                // Deduplicate
                const seenTransactions = new Set();
                const purchasedBooksFromDB = purchasedBooksArray.filter(book => {
                    if (book.transactionId) {
                        if (seenTransactions.has(book.transactionId)) {
                            return false;
                        }
                        seenTransactions.add(book.transactionId);
                        return true;
                    }

                    const bookId = book.bookId || book.firestoreId || book.id;
                    const cleanId = bookId?.toString().replace('firestore-', '');

                    if (seenTransactions.has(cleanId)) {
                        return false;
                    }
                    seenTransactions.add(cleanId);
                    return true;
                });

                // Extract book IDs
                const bookIds = new Set();
                purchasedBooksFromDB.forEach(book => {
                    if (book.id) bookIds.add(book.id);
                    if (book.bookId) bookIds.add(book.bookId);
                    if (book.firestoreId) bookIds.add(book.firestoreId);
                });
                setPurchasedBookIds(bookIds);

                // Enrich books
                const enrichedBooks = await Promise.all(purchasedBooksFromDB.map(async (purchasedBook) => {
                    const bookId = purchasedBook.bookId || purchasedBook.firestoreId || purchasedBook.id;

                    let bookData = booksData.find(b =>
                        b.id === bookId ||
                        b.id === parseInt(bookId) ||
                        b.id === bookId?.toString().replace('firestore-', '')
                    );

                    if (!bookData && bookId) {
                        try {
                            const cleanId = bookId.toString().replace('firestore-', '');
                            const bookDocRef = doc(db, 'advertMyBook', cleanId);
                            const bookDoc = await getDoc(bookDocRef);

                            if (bookDoc.exists()) {
                                const fbBook = bookDoc.data();
                                bookData = {
                                    id: bookId,
                                    title: fbBook.bookTitle || fbBook.title,
                                    author: fbBook.author,
                                    pages: fbBook.pages,
                                    format: fbBook.format || 'PDF',
                                    category: fbBook.category,
                                    description: fbBook.description,
                                    pdfUrl: fbBook.pdfUrl || fbBook.pdfLink,
                                    driveFileId: fbBook.driveFileId,
                                    embedUrl: fbBook.embedUrl,
                                    previewUrl: fbBook.previewUrl,
                                    coverImage: fbBook.coverImage,
                                };
                            }
                        } catch (error) {
                            console.error('Error fetching book from Firebase:', error);
                        }
                    }

                    if (bookData) {
                        return {
                            ...bookData,
                            image: getThumbnailUrl(bookData),
                            purchaseDate: purchasedBook.purchaseDate,
                            transactionId: purchasedBook.transactionId,
                            amount: purchasedBook.amount || bookData.price,
                            sellerId: purchasedBook.sellerId,
                            sellerName: purchasedBook.sellerName
                        };
                    }

                    return {
                        id: bookId,
                        title: purchasedBook.title,
                        author: purchasedBook.author,
                        image: getThumbnailUrl(purchasedBook),
                        pdfUrl: purchasedBook.pdfUrl,
                        embedUrl: purchasedBook.embedUrl,
                        driveFileId: purchasedBook.driveFileId,
                        purchaseDate: purchasedBook.purchaseDate,
                        transactionId: purchasedBook.transactionId,
                        amount: purchasedBook.amount,
                        format: 'PDF',
                        sellerId: purchasedBook.sellerId,
                        sellerName: purchasedBook.sellerName
                    };
                }));

                setPurchasedBooks(enrichedBooks);
            } else {
                setPurchasedBooks([]);
            }
        } catch (error) {
            console.error('Error fetching purchased books:', error);
            setPurchasedBooks([]);
        } finally {
            setLoading(false);
        }
    };

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

    const getRelatedBooks = (book) => {
        return booksData.filter(b =>
            b.category === book.category &&
            b.id !== book.id
        ).slice(0, 10);
    };

    const isPurchased = (bookId) => {
        return purchasedBookIds.has(bookId) ||
            purchasedBookIds.has(bookId.toString()) ||
            purchasedBookIds.has(`firestore-${bookId}`);
    };

    const handlePurchaseRelatedBook = (book) => {
        router.push(`/payment?bookId=${book.id}`);
    };

    const handleDownload = (book) => {
        let fileId = null;

        if (book.driveFileId) {
            fileId = book.driveFileId;
        } else if (book.pdfUrl) {
            fileId = extractFileId(book.pdfUrl);
        } else if (book.pdfLink) {
            fileId = extractFileId(book.pdfLink);
        }

        if (fileId) {
            window.open(`https://drive.google.com/uc?export=download&id=${fileId}`, '_blank');
        } else if (book.pdfUrl) {
            window.open(book.pdfUrl, '_blank');
        } else {
            alert(`Download link for ${book.title} will be sent to ${user?.email}`);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
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

    if (selectedBook) {
        return (
            <div className="min-h-screen bg-gray-100 flex flex-col">
                <Navbar />

                <div className="bg-white border-b px-4 py-3 flex items-center justify-between">
                    <button
                        onClick={() => {
                            setSelectedBook(null);
                            setPdfUrl(null);
                        }}
                        className="flex items-center gap-2 text-gray-700 hover:text-gray-900"
                    >
                        <ArrowLeft size={20} />
                        <span className="font-medium">Back to Library</span>
                    </button>
                </div>

                <div className="flex-1 bg-white relative">
                    {loadingPdf ? (
                        <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
                            <div className="text-center">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-950 mx-auto mb-4"></div>
                                <p className="text-gray-600">Loading document...</p>
                            </div>
                        </div>
                    ) : pdfUrl ? (
                    <div className="w-full h-full relative overflow-hidden">
                        {/* 1. The Iframe */}
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

                        {/* 2. The Protective Mask (Desktop) */}
                        <div
                            className="absolute top-0 right-0 h-[56px] bg-[#323639] z-10 hidden md:flex items-center justify-end px-5 gap-3 select-none border-b border-white/5"
                            style={{ width: '220px' }}
                            onContextMenu={(e) => e.preventDefault()}
                        >
                            <div className="flex flex-col items-end leading-tight">
                                <span className="text-blue-400 text-[10px] font-bold uppercase tracking-wider">
                                    LAN Library
                                </span>
                                <span className="text-gray-400 text-[9px] font-mono">
                                    ID: {user?.uid?.substring(0, 8).toUpperCase() || 'USER-AUTH'}
                                </span>
                            </div>
                            <div className="h-6 w-[1px] bg-gray-600/50 mx-1" />
                            <Lock size={16} className="text-gray-400" />
                        </div>

                        {/* Mobile Mask (Smaller screens) */}
                        <div
                            className="absolute top-0 right-0 h-15 bg-[#323639] z-10 md:hidden flex items-center justify-end px-4 select-none"
                            style={{ width: '120px' }}
                            onContextMenu={(e) => e.preventDefault()}
                        >
                            <span className="text-gray-400 text-[9px] mr-2 font-bold uppercase">LAN Lib's</span>
                        </div>

                        {/* OPTIONAL: Bottom Mask (Hides the "Google" logo at the bottom bar) */}
                        <div className="absolute bottom-0 right-0 h-8 bg-[#323639] z-10 w-24 hidden md:block" />
                    </div>
                    ) : (
                        <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
                            <div className="text-center bg-white p-8 rounded-lg shadow-lg max-w-md">
                                <FileText className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                                <h3 className="text-xl font-bold mb-2 text-gray-900">{selectedBook.title}</h3>
                                <p className="text-gray-600 mb-4">Document preview not available</p>
                                <button
                                    onClick={() => handleDownload(selectedBook)}
                                    className="w-full bg-blue-950 text-white px-6 py-3 rounded-lg hover:bg-blue-900 flex items-center justify-center gap-2"
                                >
                                    <Download size={20} />
                                    Download PDF
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                <div className="bg-white border-t shadow-lg">
                    <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
                        <div className="flex items-center gap-6">
                            <button
                                onClick={() => setShowOverview(true)}
                                className="flex items-center gap-2 text-gray-700 hover:text-gray-900"
                            >
                                <FileText size={20} />
                                <span className="font-medium hidden md:inline">Overview</span>
                            </button>
                            <button
                                onClick={() => setShowRelatedModal(true)}
                                className="flex items-center gap-2 text-gray-700 hover:text-gray-900"
                            >
                                <FileText size={20} />
                                <span className="font-medium hidden md:inline">Related documents</span>
                            </button>
                        </div>

                        <div className="text-sm text-gray-600">
                            <span className="font-medium">{selectedBook.pages || 'N/A'}</span> pages • {selectedBook.format || 'PDF'}
                        </div>
                    </div>
                </div>

                {showOverview && (
                    <>
                        <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setShowOverview(false)} />
                        <div className="fixed inset-y-0 right-0 w-96 bg-white shadow-2xl z-50 overflow-y-auto">
                            <div className="p-6">
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-2xl font-bold text-gray-900">Overview</h2>
                                    <button onClick={() => setShowOverview(false)} className="text-gray-500 hover:text-gray-700">
                                        <X size={24} />
                                    </button>
                                </div>

                                <img
                                    src={selectedBook.image || selectedBook.coverImage}
                                    alt={selectedBook.title}
                                    className="w-full h-64 object-cover rounded-lg mb-4"
                                />

                                <h3 className="text-xl font-bold mb-2 text-gray-900">{selectedBook.title}</h3>
                                <p className="text-sm text-gray-600 mb-4">
                                    By <span className="underline">{selectedBook.author}</span>
                                </p>

                                {selectedBook.description && (
                                    <>
                                        <h3 className="font-bold mb-2 text-gray-900">Description</h3>
                                        <p className="text-sm text-gray-600 mb-6">{selectedBook.description}</p>
                                    </>
                                )}

                                <h3 className="font-bold mb-2 text-gray-900">Purchase Details</h3>
                                <div className="space-y-2 text-sm text-gray-600 mb-6">
                                    <p>Date: {formatDate(selectedBook.purchaseDate)}</p>
                                    <p>Amount: ₦ {selectedBook.amount?.toLocaleString() || 'N/A'}</p>
                                    <p>Transaction: {selectedBook.transactionId || 'N/A'}</p>
                                </div>

                                <h3 className="font-bold mb-2 text-gray-900">Category</h3>
                                <p className="text-sm text-gray-600 mb-6">{selectedBook.category || 'General'}</p>

                                <h3 className="font-bold mb-2 text-gray-900">Format</h3>
                                <p className="text-sm text-gray-600">{selectedBook.format || 'PDF'} • {selectedBook.pages || 'N/A'} pages</p>
                            </div>
                        </div>
                    </>
                )}

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
                                                    {isPurchased(relatedBook.id) && (
                                                        <span className="absolute bottom-1 left-1 bg-green-600 text-white text-xs px-1.5 py-0.5 rounded font-bold">
                                                            Owned
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex-1">
                                                    <h4 className="font-semibold text-base mb-2 text-gray-900">{relatedBook.title}</h4>
                                                    <p className="text-sm text-gray-600 mb-2">By {relatedBook.author}</p>

                                                    {isPurchased(relatedBook.id) ? (
                                                        <button
                                                            onClick={() => {
                                                                setShowRelatedModal(false);
                                                                handleOpenBook(relatedBook);
                                                            }}
                                                            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 text-sm font-semibold"
                                                        >
                                                            <ExternalLink size={16} className="inline mr-2" />
                                                            Open Book
                                                        </button>
                                                    ) : (
                                                        <button
                                                            onClick={() => handlePurchaseRelatedBook(relatedBook)}
                                                            className="bg-blue-950 text-white px-4 py-2 rounded-lg hover:bg-blue-900 text-sm font-semibold"
                                                        >
                                                            Purchase - ₦{relatedBook.price?.toLocaleString()}
                                                        </button>
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
                            href="/documents"
                            className="inline-block bg-blue-950 text-white px-6 py-3 rounded-lg hover:bg-blue-900 transition-colors"
                        >
                            Browse Books
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6">
                        {purchasedBooks.map((book, index) => (
                            <div
                                key={book.id || book.transactionId || index}
                                className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
                            >
                                <div className="relative">
                                    <img
                                        src={book.image || book.coverImage}
                                        alt={book.title}
                                        className="w-full h-40 md:h-64 object-cover"
                                        onError={(e) => {
                                            e.target.src = 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400';
                                        }}
                                    />
                                    <span className="absolute top-3 right-3 bg-blue-950 text-white px-3 py-1 rounded-full text-xs font-bold">
                                        Purchased
                                    </span>
                                </div>

                                <div className="p-3 md:p-6">
                                    <h3 className="font-bold text-sm md:text-lg text-gray-900 mb-2 line-clamp-2">
                                        {book.title}
                                    </h3>
                                    <p className="text-xs md:text-sm text-gray-600 mb-2 md:mb-4">{book.author}</p>

                                    <div className="hidden md:block space-y-2 mb-4 text-sm">
                                        <div className="flex items-center gap-2 text-gray-600">
                                            <Calendar size={16} />
                                            <span>Purchased: {formatDate(book.purchaseDate)}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-gray-600">
                                            <CreditCard size={16} />
                                            <span>₦ {book.amount?.toLocaleString() || book.price?.toLocaleString() || 'N/A'}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-gray-600">
                                            <FileText size={16} />
                                            <span>{book.pages || 'N/A'} pages • {book.format || 'PDF'}</span>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => handleOpenBook(book)}
                                        className="w-full bg-blue-950 text-white py-2 md:py-3 rounded-lg hover:bg-blue-900 transition-colors flex items-center justify-center gap-2 font-semibold text-xs md:text-base"
                                    >
                                        <ExternalLink className="w-4 h-4 md:w-5 md:h-5" />
                                        <span className="hidden md:inline">Open Book</span>
                                        <span className="md:hidden">Open</span>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}