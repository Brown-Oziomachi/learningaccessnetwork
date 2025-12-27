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

    // Define fetchPurchasedBooks BEFORE useEffect
    const fetchPurchasedBooks = async (userId) => {
        try {
            setLoading(true);
            console.log("Fetching purchased books for user:", userId);

            const userDocRef = doc(db, 'users', userId);
            const userDoc = await getDoc(userDocRef);

            if (userDoc.exists()) {
                const userData = userDoc.data();

                // FIX: purchasedBooks is a MAP/OBJECT, not an array
                const purchasedBooksMap = userData.purchasedBooks || {};
                console.log("Purchased books MAP from DB:", purchasedBooksMap);

                // Convert the map to an array of books
                const purchasedBooksArray = Object.values(purchasedBooksMap);
                console.log("Purchased books ARRAY (before deduplication):", purchasedBooksArray);

                // DEDUPLICATE: Remove duplicate books based on transactionId or bookId
                const seenTransactions = new Set();
                const purchasedBooksFromDB = purchasedBooksArray.filter(book => {
                    // Use transactionId as primary unique identifier
                    if (book.transactionId) {
                        if (seenTransactions.has(book.transactionId)) {
                            console.log("Skipping duplicate transaction:", book.transactionId);
                            return false;
                        }
                        seenTransactions.add(book.transactionId);
                        return true;
                    }

                    // Fallback to bookId if no transactionId
                    const bookId = book.bookId || book.firestoreId || book.id;
                    const cleanId = bookId?.toString().replace('firestore-', '');

                    if (seenTransactions.has(cleanId)) {
                        console.log("Skipping duplicate bookId:", cleanId);
                        return false;
                    }
                    seenTransactions.add(cleanId);
                    return true;
                });

                console.log("Purchased books ARRAY (after deduplication):", purchasedBooksFromDB);

                // Extract book IDs for checking
                const bookIds = new Set();
                purchasedBooksFromDB.forEach(book => {
                    if (book.id) bookIds.add(book.id);
                    if (book.bookId) bookIds.add(book.bookId);
                    if (book.firestoreId) bookIds.add(book.firestoreId);
                });
                setPurchasedBookIds(bookIds);

                // Enrich with data from both booksData and Firebase advertMyBook
                const enrichedBooks = await Promise.all(purchasedBooksFromDB.map(async (purchasedBook) => {
                    console.log("Processing purchased book:", purchasedBook);

                    // Use the correct ID field
                    const bookId = purchasedBook.bookId || purchasedBook.firestoreId || purchasedBook.id;

                    // First check booksData
                    let bookData = booksData.find(b =>
                        b.id === bookId ||
                        b.id === parseInt(bookId) ||
                        b.id === bookId?.toString().replace('firestore-', '')
                    );

                    // If not in booksData, check Firebase advertMyBook
                    if (!bookData && bookId) {
                        try {
                            // Remove 'firestore-' prefix if present
                            const cleanId = bookId.toString().replace('firestore-', '');
                            console.log("Fetching from advertMyBook with ID:", cleanId);

                            const bookDocRef = doc(db, 'advertMyBook', cleanId);
                            const bookDoc = await getDoc(bookDocRef);

                            if (bookDoc.exists()) {
                                const fbBook = bookDoc.data();
                                console.log("Found book in advertMyBook:", fbBook);

                                bookData = {
                                    id: bookId,
                                    title: fbBook.bookTitle || fbBook.title || purchasedBook.title,
                                    author: fbBook.author || purchasedBook.author,
                                    image: fbBook.coverImage || fbBook.image,
                                    pages: fbBook.pages,
                                    format: fbBook.format || 'PDF',
                                    category: fbBook.category,
                                    description: fbBook.description,
                                    pdfUrl: fbBook.pdfUrl || fbBook.pdfLink || purchasedBook.pdfUrl,
                                    driveFileId: fbBook.driveFileId,
                                    embedUrl: fbBook.embedUrl,
                                    previewUrl: fbBook.previewUrl
                                };
                            } else {
                                console.log("Book not found in advertMyBook:", cleanId);
                            }
                        } catch (error) {
                            console.error('Error fetching book from Firebase:', error);
                        }
                    }

                    // Return enriched data or use what we have from purchasedBook
                    if (bookData) {
                        return {
                            ...bookData,
                            purchaseDate: purchasedBook.purchaseDate,
                            transactionId: purchasedBook.transactionId,
                            amount: purchasedBook.amount || bookData.price,
                            // Preserve original fields
                            sellerId: purchasedBook.sellerId,
                            sellerName: purchasedBook.sellerName
                        };
                    }

                    // If no bookData found, return the purchased book as-is
                    console.warn("No enriched data found, using raw purchase data:", purchasedBook);
                    return {
                        id: bookId,
                        title: purchasedBook.title,
                        author: purchasedBook.author,
                        image: purchasedBook.image,
                        pdfUrl: purchasedBook.pdfUrl,
                        purchaseDate: purchasedBook.purchaseDate,
                        transactionId: purchasedBook.transactionId,
                        amount: purchasedBook.amount,
                        format: 'PDF',
                        sellerId: purchasedBook.sellerId,
                        sellerName: purchasedBook.sellerName
                    };
                }));

                console.log("Final enriched books:", enrichedBooks);
                setPurchasedBooks(enrichedBooks);
            } else {
                console.log("User doc not found");
                setPurchasedBooks([]);
            }
        } catch (error) {
            console.error('Error fetching books:', error);
            setPurchasedBooks([]);
        } finally {
            setLoading(false);
        }
    };

    // NOW use fetchPurchasedBooks in useEffect
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

    console.log("Opening book:", book);
    console.log("Book image:", book.image);
    console.log("Book coverImage:", book.coverImage);

    // Try embedUrl first (best for viewing)
    if (book.embedUrl) {
        url = book.embedUrl;
        console.log("Using embedUrl:", url);
    }
    // Try to get file ID from various sources
    else if (book.driveFileId) {
        fileId = book.driveFileId;
        console.log("Using driveFileId:", fileId);
    } else if (book.pdfUrl) {
        fileId = extractFileId(book.pdfUrl);
        console.log("Extracted from pdfUrl:", fileId);
    } else if (book.pdfLink) {
        fileId = extractFileId(book.pdfLink);
        console.log("Extracted from pdfLink:", fileId);
    } else if (book.previewUrl) {
        fileId = extractFileId(book.previewUrl);
        console.log("Extracted from previewUrl:", fileId);
    }

    // Build the embed URL if we have a file ID
    if (!url && fileId) {
        url = `https://drive.google.com/file/d/${fileId}/preview`;
        console.log("Built embed URL:", url);
    }

    // If still no URL, try direct pdfUrl
    if (!url && book.pdfUrl) {
        url = book.pdfUrl;
        console.log("Using direct pdfUrl:", url);
    }

    console.log("Final PDF URL:", url);
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
        return purchasedBookIds.has(bookId) ||
            purchasedBookIds.has(bookId.toString()) ||
            purchasedBookIds.has(`firestore-${bookId}`);
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
        } else if (book.pdfUrl) {
            // Try direct download
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

    // PDF Viewer
    if (selectedBook) {
        return (
            <div className="min-h-screen bg-gray-100 flex flex-col">
                <Navbar />

                {/* Top Action Bar */}
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
                    <h1 className='text-blue-950 font-bold text-xl md:text-2xl truncate max-w-md'>{selectedBook.title}</h1>
                    <div className="flex gap-2">
                        <button
                            onClick={() => handleDownload(selectedBook)}
                            className="bg-blue-950 hover:bg-blue-900 text-white px-4 py-2 rounded-lg font-semibold flex items-center gap-2"
                        >
                            <Download size={18} />
                            <span className="hidden md:inline">Download</span>
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
                        </div>
                    ) : (
                        <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
                            <div className="text-center bg-white p-8 rounded-lg shadow-lg max-w-md">
                                <FileText className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                                <h3 className="text-xl font-bold mb-2 text-gray-900">{selectedBook.title}</h3>
                                <p className="text-gray-600 mb-4">Document preview not available</p>
                                <p className="text-sm text-gray-500 mb-4">
                                    The PDF file may not be properly configured for viewing
                                </p>
                                <div className="space-y-2">
                                    <button
                                        onClick={() => handleDownload(selectedBook)}
                                        className="w-full bg-blue-950 text-white px-6 py-3 rounded-lg hover:bg-blue-900 flex items-center justify-center gap-2"
                                    >
                                        <Download size={20} />
                                        Download PDF
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

                {/* Overview Sidebar */}
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
                                                        <div className="flex items-center gap-4">
                                                            <p className="text-lg font-bold text-blue-950">₦ {relatedBook.price?.toLocaleString()}</p>
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
                            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6">                        
                            {purchasedBooks.map((book, index) => (
                            <div
                                key={book.id || book.transactionId || index}
                                className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
                            >
                                <div className="relative">
                                        <img
                                        src={book.image || book.coverImage || '/api/placeholder/400/320'}
                                        alt={book.title}
                                        className="w-full h-40 md:h-64 object-cover"
                                        onError={(e) => {
                                            e.target.src = '/lan-logo.png';
                                        }}
                                    />
                                    <span className="absolute top-3 right-3 bg-blue-950 text-white px-3 py-1 rounded-full text-xs font-bold">
                                        Purchased
                                    </span>
                                </div>

                                        <div className="p-3 md:p-6">                                        
                                            <h3 className="font-bold text-sm md:text-lg text-gray-900 mb-2 line-clamp-2">  
                                        <p className="text-xs md:text-sm text-gray-600  md:mb-4">{book.title}</p>
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

                                    <div className="flex gap-2">
                                       <button
                                        onClick={() => handleOpenBook(book)}
                                        className="flex-1 bg-blue-950 text-white py-2 md:py-3 rounded-lg hover:bg-blue-900 transition-colors flex items-center justify-center gap-2 font-semibold text-xs md:text-base"
                                    >
                                        <ExternalLink className="w-4 h-4 md:w-5 md:h-5" />
                                        <span className="hidden md:inline">Open Book</span>
                                        <span className="md:hidden">Open</span>
                                    </button>
                                     <button
                                        onClick={() => handleDownload(book)}
                                        className="bg-white border-2 border-blue-950 text-blue-950 px-3 md:px-4 py-2 md:py-3 rounded-lg hover:bg-blue-950 hover:text-white transition-colors"
                                    >
                                        <Download className="w-4 h-4 md:w-5 md:h-5" />
                                    </button>
                                    </div>

                                   {book.transactionId && (
                                    <p className="hidden md:block text-xs text-gray-500 text-center mt-3">
                                        Transaction ID: {book.transactionId}
                                    </p>
                                )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}