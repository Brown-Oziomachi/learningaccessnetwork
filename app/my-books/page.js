"use client"
import React, { useState, useEffect } from 'react';
import { Globe, LogOut, User, ChevronDown, AlignEndVertical, Download,Menu, FileText, Calendar, CreditCard, X, ExternalLink, ThumbsUp, Search, Lock, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { auth, db } from "@/lib/firebaseConfig";
import { doc, getDoc } from 'firebase/firestore';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { booksData } from '@/lib/booksData';

export default function MyBooksPage() {
    const router = useRouter();
    const [purchasedBooks, setPurchasedBooks] = useState([]);
    const [selectedBook, setSelectedBook] = useState(null);
    const [showOverview, setShowOverview] = useState(false);
    const [showRelated, setShowRelated] = useState(false);
    const [showRelatedModal, setShowRelatedModal] = useState(false);
    const [showSearch, setShowSearch] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);
    const [purchasedBookIds, setPurchasedBookIds] = useState(new Set());
    const [showMobileSearch, setShowMobileSearch] = useState(false);
    const [showMobileMenu, setShowMobileMenu] = useState(false);
    const [showPurchaseModal, setShowPurchaseModal] = useState(false);

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

    const displayBooks = booksData.slice(0, 25);

    const categories = [
        'Education',
        'Personal Development',
        'Business',
        'Technology',
        'Science',
        'Literature',
        'Health & Wellness',
        'History',
        'Arts & Culture'
    ];

    
    const handleSearch = () => {
        if (searchQuery.trim()) {
            router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
            setShowMobileSearch(false); // hide mobile dropdown if open
        }
    };

     const handleLogout = async () => {
        try {
            await signOut(auth);
            router.push("/");
        } catch (error) {
            console.error("Logout error:", error);
        }
    };

    const fetchPurchasedBooks = async (userId) => {
        try {
            setLoading(true);

            // Fetch from Firebase users collection
            const userDocRef = doc(db, 'users', userId);
            const userDoc = await getDoc(userDocRef);

            if (userDoc.exists()) {
                const userData = userDoc.data();
                const purchasedBooksFromDB = userData.purchasedBooks || [];

                // Set purchased book IDs for checking
                const bookIds = new Set(purchasedBooksFromDB.map(book => book.id));
                setPurchasedBookIds(bookIds);

                // Match purchased books with booksData to get complete info including related docs
                const enrichedBooks = purchasedBooksFromDB.map(purchasedBook => {
                    const bookData = booksData.find(b => b.id === purchasedBook.id);

                    if (bookData) {
                        return {
                            ...bookData,
                            ...purchasedBook,
                            // Keep purchase-specific data
                            purchaseDate: purchasedBook.purchaseDate,
                            transactionId: purchasedBook.transactionId,
                            amount: purchasedBook.amount || purchasedBook.price
                        };
                    }

                    // If book not found in booksData, return original
                    return purchasedBook;
                });

                setPurchasedBooks(enrichedBooks);
            } else {
                // If no Firebase data, check localStorage as fallback
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
            // Fallback to localStorage
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

    const handleOpenBook = (book) => {
        setSelectedBook(book);
        setShowOverview(false);
        setShowRelated(false);
        setShowRelatedModal(false);
        setShowSearch(false);
    };

    const getRelatedBooks = (book) => {
        // Get books from same category, excluding current book
        return booksData.filter(b =>
            b.category === book.category &&
            b.id !== book.id
        ).slice(0, 10); // Limit to 10 related books
    };

    const isPurchased = (bookId) => {
        return purchasedBookIds.has(bookId);
    };

 const handlePurchase = (book) => {
        setSelectedBook(book);
        setShowPurchaseModal(true);
    };

    const handlePurchaseRelatedBook = (book) => {
        router.push(`/payment?bookId=${book.id}`);
    };

    const handleDownload = (book) => {
        alert(`Downloading ${book.title}...\n\nPDF download link has been sent to:\n${user?.email}\n\nTransaction ID: ${book.transactionId}`);
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
                    <p className="mt-4 text-gray-600">Loading My Books...</p>
                </div>
            </div>
        );
    }

    // Book Reader View
    if (selectedBook) {
        return (
            <div className="min-h-screen bg-white">  
                <header className="bg-blue-950 text-white shadow-lg sticky top-0 z-50">
                    <div className="max-w-7xl mx-auto px-4 py-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={() => setSelectedBook(null)}
                                    className="hover:text-gray-300"
                                >
                                    <ArrowLeft size={24} />
                                </button>
                                <div className="flex items-center gap-2">
                                    <span className="text-lg font-bold">LEARNING ACCESS NETWORK</span>
                                </div>
                            </div>
                            {showSearch && (
                                <div className="flex-1 max-w-md w-80 mx-4 max-md:absolute">
                                    <div className="relative">
                                        <input
                                            type="text"
                                            placeholder="Search in document..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="w-full bg-white text-gray-900 px-4 py-2 rounded-lg pl-10"
                                            autoFocus
                                        />
                                        <Search
                                            className="absolute left-3 top-2.5 text-gray-400"
                                            size={20}
                                        />
                                        <button
                                            onClick={() => {
                                                setShowSearch(false);
                                                setSearchQuery('');
                                            }}
                                            className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                                        >
                                            <X size={20} />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </header>
    
                {/* Categories Bar */}
                <div className="bg-blue-900 text-white shadow-md">
                    <div className="max-w-7xl mx-auto px-4 py-3">
                        <div className="flex gap-6 overflow-x-auto scrollbar-hide">
                            {categories.map((category, index) => (
                                <Link
                                    key={index}
                                    href={`/category/${category.toLowerCase().replace(/ & /g, '-').replace(/ /g, '-')}`}
                                    className="whitespace-nowrap hover:text-blue-300 transition-colors text-sm"
                                >
                                    {category}
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>
                {/* Book Info Bar */}
                <div className="bg-white border-b px-4 py-3">
                    <div className="lg:w-1/4 mx-auto">
                        <div className="flex gap-3">
                            <button
                                onClick={() => handleDownload(selectedBook)}
                                className="flex-1 bg-blue-950 hover:bg-blue-900 text-white py-2 rounded-lg font-semibold flex items-center justify-center gap-2"
                            >
                                <Download size={20} />
                                Download
                            </button>
                        </div>
                    </div>
                </div>

                {/* Document Content */}
                <div className="max-w-4xl mx-auto px-4 py-8">
                    <div className="bg-white rounded-lg shadow-sm border p-8">
                        <h2 className="text-2xl font-bold mb-4 text-blue-950">{selectedBook.title}</h2>
                        <p className="text-sm text-gray-600 mb-4">By <span className="underline">{selectedBook.author}</span></p>

                        {selectedBook.description && (
                            <p className="text-gray-700 mb-6 leading-relaxed">
                                {selectedBook.description}
                            </p>
                        )}

                        {selectedBook.summary && (
                            <p className="text-gray-700 mb-6 leading-relaxed italic">
                                {selectedBook.summary}
                            </p>
                        )}

                        <div className="prose max-w-none text-gray-700">
                            <p className="leading-relaxed mb-4">
                                This comprehensive guide explores key concepts and provides valuable insights for readers interested in {selectedBook.category?.toLowerCase() || 'this topic'}.
                            </p>
                            <p className="leading-relaxed">
                                With {selectedBook.pages} pages of in-depth analysis, this work has become an essential resource in its field, offering practical wisdom and theoretical frameworks that continue to influence readers worldwide.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Bottom Action Bar */}
                <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg">
                    <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
                        <div className="flex items-center gap-6">
                            <button
                                onClick={() => { setShowOverview(true); setShowRelated(false); }}
                                className="flex items-center gap-2 text-gray-700 hover:text-gray-900"
                            >
                                <FileText size={20} />
                                <span className="font-medium">Overview</span>
                            </button>
                            <button
                                onClick={() => { setShowSearch(!showSearch); setShowRelated(false); setShowOverview(false); }}
                                className="flex items-center gap-2 text-gray-700 hover:text-gray-900"
                            >
                                <Search size={20} />
                                <span className="font-medium">Find</span>
                            </button>
                            <button
                                onClick={() => { setShowRelatedModal(true); }}
                                className="flex items-center gap-2 text-gray-700 hover:text-gray-900"
                            >
                                <FileText size={20} />
                                <span className="font-medium">Related documents</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Overview Sidebar */}
                {showOverview && (
                    <div className="fixed inset-y-0 right-0 w-96 bg-white text-blue-950 shadow-2xl z-50 overflow-y-auto">
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-2xl font-bold">Overview</h2>
                                <button onClick={() => setShowOverview(false)} className="text-gray-500 hover:text-gray-700">
                                    <X size={24} />
                                </button>
                            </div>

                            <h3 className="text-xl font-bold mb-2">{selectedBook.title}</h3>
                            <p className="text-sm text-gray-600 mb-4">
                                Uploaded by <span className="underline">{selectedBook.author || 'LEARNING ACCESS NETWORK'}</span>
                            </p>
                            <div className="grid grid-cols-5 gap-4 mb-6">
                                <button onClick={() => handleDownload(selectedBook)} className="flex flex-col items-center gap-1 text-gray-700 hover:text-gray-900">
                                    <Download size={24} />
                                    <span className="text-xs">Download</span>
                                </button>
                            </div>
                            {selectedBook.relatedDocs && selectedBook.relatedDocs.length > 0 && (
                                <>
                                    <h3 className="font-bold mb-3">Related documents</h3>
                                    <div className="space-y-3 mb-6">
                                        {selectedBook.relatedDocs.slice(0, 3).map((doc, idx) => (
                                            <div key={idx} className="flex gap-3">
                                                <img src={doc.image || selectedBook.image} alt={doc.title} className="w-16 h-20 object-cover rounded" />
                                                <div className="flex-1">
                                                    <p className="text-sm font-medium line-clamp-2">{doc.title}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            )}

                            {/* Show related books for overview */}
{/*                             
                         <div className=" bg-gray-50 -mx-4 px-1 py-8">
                    <h3 className="text-2xl font-bold text-gray-900 mb-4">Related to Your Interests</h3>
                    <div className="overflow-x-auto scrollbar-hide p-1">
                        <div className="flex gap-2 pb-4">
                            {displayBooks.slice(8, 14).map((book) => (
                                <div
                                    key={book.id}
                                    className="flex-none w-[160px] sm:w-[180px] bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
                                >
                                    <div className="relative">
                                        <img
                                            src={book.image}
                                            alt={book.title}
                                            className="w-full h-48 object-cover"
                                        />
                                        {isPurchased(book.id) && (
                                            <span className="absolute top-2 right-2 bg-green-600 text-white px-1.5 py-0.5 rounded text-xs font-bold">
                                                Owned
                                            </span>
                                        )}
                                    </div>
                                    <div className="p-3">
                                        <h4 className="font-semibold text-sm text-gray-900 mb-1 line-clamp-2">
                                            {book.title}
                                        </h4>
                                        <div className="flex text-yellow-400 text-xs mb-2">
                                            {'★'.repeat(Math.floor(book.rating))}
                                        </div>
                                        <p className="text-lg font-bold text-gray-900 mb-2">₦{book.price.toLocaleString()}</p>

                                        {isPurchased(book.id) ? (
                                            <button
                                                onClick={() => handleDownload(book)}
                                                className="w-full bg-green-600 text-white py-1.5 rounded text-xs hover:bg-green-700 transition-colors flex items-center justify-center gap-1"
                                            >
                                                <Download size={14} />
                                                Download
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => handlePurchase(book)}
                                                className="w-full bg-blue-950 text-white py-1.5 rounded text-xs hover:bg-blue-900 transition-colors flex items-center justify-center gap-1"
                                            >
                                                <Lock size={14} />
                                                Purchase
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div> */}

                            <h3 className="font-bold mb-2">Available Formats</h3>
                            <p className="text-sm text-gray-600 mb-6">Download as PDF, TXT or read online</p>

                            <h3 className="font-bold mb-2">Original Title</h3>
                            <p className="text-sm text-gray-600 mb-6">{selectedBook.title}</p>

                            <h3 className="font-bold mb-2">Category</h3>
                            <p className="text-sm text-gray-600 mb-6">{selectedBook.category || 'General'}</p>
                        </div>
                    </div>
                )}

                {/* Related Documents Sidebar */}
                {showRelated && selectedBook.relatedDocs && selectedBook.relatedDocs.length > 0 && (
                    <div className="fixed inset-y-0 right-0 w-96 bg-white shadow-2xl z-50 overflow-y-auto text-blue-950">
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-2xl font-bold">Related documents</h2>
                                <button onClick={() => setShowRelated(false)} className="text-gray-500 hover:text-gray-700">
                                    <X size={24} />
                                </button>
                            </div>

                            <div className="space-y-4">
                                {selectedBook.relatedDocs.map((doc, idx) => (
                                    <div key={idx} className="flex gap-4 p-3 hover:bg-gray-50 rounded-lg cursor-pointer">
                                        <div className="relative flex-shrink-0">
                                            <img src={doc.image || selectedBook.image} alt={doc.title} className="w-20 h-28 object-cover rounded" />
                                            <span className="absolute top-1 left-1 bg-red-600 text-white text-xs px-1 py-0.5 rounded font-bold">
                                                PDF
                                            </span>
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-1 text-sm text-gray-600 mb-1">
                                                <ThumbsUp size={14} />
                                                <span className="font-semibold">{doc.rating || 90}% ({doc.reviews || 10})</span>
                                            </div>
                                            <h4 className="font-medium text-sm mb-2 line-clamp-3">{doc.title}</h4>
                                            <p className="text-xs text-gray-500">{doc.pages || selectedBook.pages} pages</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Related Documents Modal */}
                {showRelatedModal && (
                    <div className="fixed inset-0 bg-white flex items-center justify-center z-50 p-4">
                        <div className="bg-white w-full h-screen overflow-hidden">
                            <div className="p-6 border-b sticky top-0 bg-white">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-2xl font-bold text-blue-950">Related documents</h2>
                                    <button onClick={() => setShowRelatedModal(false)} className="text-gray-500 hover:text-gray-700">
                                        <X size={24} />
                                    </button>
                                </div>
                            </div>

                            <div className="p-6 overflow-y-auto max-h-[calc(100vh-100px)]">
                                {/* First show relatedDocs if they exist */}
                                {selectedBook.relatedDocs && selectedBook.relatedDocs.length > 0 ? (
                                    <div className="space-y-4">
                                        {selectedBook.relatedDocs.map((doc, idx) => (
                                            <div key={idx} className="flex gap-4 p-4 hover:bg-gray-50 rounded-lg border border-gray-200">
                                                <div className="relative flex-shrink-0">
                                                    <img src={doc.image || selectedBook.image} alt={doc.title} className="w-24 h-32 object-cover rounded shadow-md" />
                                                    <span className="absolute top-1 left-1 bg-red-600 text-white text-xs px-1.5 py-0.5 rounded font-bold">
                                                        PDF
                                                    </span>
                                                    {isPurchased(doc.id) && (
                                                        <span className="absolute bottom-1 left-1 bg-green-600 text-white text-xs px-1.5 py-0.5 rounded font-bold flex items-center gap-1">
                                                            <Download size={10} />
                                                            Owned
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex-1">
                                                    <h4 className="font-semibold text-base mb-2 text-gray-900">{doc.title}</h4>
                                                    <p className="text-sm text-gray-500 mb-1">{doc.pages || selectedBook.pages} pages</p>
                                                    {doc.author && <p className="text-sm text-gray-600 mb-2">By {doc.author}</p>}

                                                    {isPurchased(doc.id) ? (
                                                        <button
                                                            onClick={() => handleDownload(doc)}
                                                            className="mt-2 w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2 text-sm font-semibold"
                                                        >
                                                            <Download size={16} />
                                                            Download PDF
                                                        </button>
                                                    ) : (
                                                        <div>
                                                            <p className="text-lg font-bold text-blue-950 mb-2">₦ {doc.price?.toLocaleString() || '0'}</p>
                                                            <button
                                                                onClick={() => handlePurchaseRelatedBook(doc)}
                                                                className="max-md:px-5 bg-blue-950 lg:w-1/4 text-white py-2 rounded-lg hover:bg-blue-900 transition-colors flex items-center justify-center gap-2 text-sm font-semibold"
                                                            >
                                                                <Lock size={16} />
                                                                Purchase & Access
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    /* Show related books from booksData based on category */
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
                                                            <span className="absolute bottom-1 left-1 bg-green-600 text-white text-xs px-1.5 py-0.5 rounded font-bold flex items-center gap-1">
                                                                <Download size={10} />
                                                                Owned
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="flex-1">

                                                        <h4 className="font-semibold text-base mb-2 text-gray-900">{relatedBook.title}</h4>
                                                        <p className="text-sm text-gray-500 mb-1">{relatedBook.pages} pages</p>
                                                        <p className="text-sm text-gray-600 mb-2">By {relatedBook.author}</p>

                                                        {isPurchased(relatedBook.id) ? (
                                                            <button
                                                                onClick={() => handleDownload(relatedBook)}
                                                                className="mt-2 w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2 text-sm font-semibold"
                                                            >
                                                                <Download size={16} />
                                                                Download PDF
                                                            </button>
                                                        ) : (
                                                            <div>
                                                                <p className="text-lg font-bold text-blue-950 mb-2">₦ {relatedBook.price.toLocaleString()}</p>
                                                                <button
                                                                    onClick={() => handlePurchaseRelatedBook(relatedBook)}
                                                                    className=" max-md:px-5 bg-blue-950 lg:w-1/4 text-white py-2 rounded-lg hover:bg-blue-900 transition-colors flex items-center justify-center gap-2 text-sm font-semibold"
                                                                >
                                                                    <Lock size={16} />
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
                                )}
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
            <header className="bg-blue-950 text-white sticky top-0 z-50 shadow-lg ">
                <div className="max-w-7xl mx-auto px-4 py-3 sm:py-4">
                    {/* TOP BAR */}
                    <div className="flex items-center justify-between gap-2 sm:gap-4">
                        {/* MOBILE MENU BUTTON */}
                        <button
                            className="md:hidden p-2 hover:bg-blue-900 rounded-lg transition-colors"
                            onClick={() => {
                                setShowMobileMenu(!showMobileMenu);
                                setShowMobileSearch(false);
                            }}
                            aria-label="Toggle menu"
                        >
                            {showMobileMenu ? <X size={24} /> : <Menu size={24} />}
                        </button>

                        {/* LOGO */}
                        <a href="/" className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                            <img
                                src="/lan-logo.png"
                                alt="LAN logo"
                                className="w-8 h-8 sm:w-12 sm:h-12 lg:w-16 lg:h-16 object-contain"
                            />
                            <h1 className="text-xl sm:text-sm lg:text-base font-bold leading-tight">
                                LEARNING <span className="text-blue-400 block sm:inline">ACCESS NETWORK</span>
                            </h1>
                        </a>

                        {/* MOBILE SEARCH ICON */}
                        <button
                            onClick={() => {
                                setShowMobileSearch(!showMobileSearch);
                                setShowMobileMenu(false);
                            }}
                            className="md:hidden p-2 hover:bg-blue-900 rounded-lg transition-colors"
                            aria-label="Toggle search"
                        >
                            <Search size={22} />
                        </button>

                        {/* DESKTOP SEARCH */}
                        <div className="hidden md:flex flex-1 max-w-md mx-4 lg:mx-8">
                            <div className="relative w-full">
                                <input
                                    type="text"
                                    placeholder="Search PDF books..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                                    className="w-full text-white px-4 py-2 pr-10 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-400"
                                />
                                <button
                                    onClick={handleSearch}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 text-blue-950 hover:text-blue-700 transition-colors"
                                    aria-label="Search"
                                >
                                    <Search size={20} />
                                </button>
                            </div>
                        </div>

                        {/* DESKTOP ACTIONS */}
                        <nav className="hidden md:flex items-center gap-2 lg:gap-4 flex-shrink-0">
                            <a
                                href="/my-account"
                                className="flex items-center gap-1 lg:gap-2 px-2 lg:px-3 py-2 hover:bg-blue-900 rounded-lg transition-colors text-sm lg:text-base"
                            >
                                <User size={18} className="lg:w-5 lg:h-5" />
                                <span className="hidden lg:inline">Account</span>
                                <ChevronDown size={14} className="lg:w-4 lg:h-4" />
                            </a>

                            <a
                                href="/my-books"
                                className="flex items-center gap-1 lg:gap-2 px-2 lg:px-3 py-2 hover:bg-blue-900 rounded-lg transition-colors text-sm lg:text-base"
                            >
                                <Download size={18} className="lg:w-5 lg:h-5" />
                                <span className="hidden lg:inline">My Books</span>
                            </a>

                              <a
                                href="/saved-my-book"
                                className="flex items-center gap-1 lg:gap-2 px-2 lg:px-3 py-2 hover:bg-blue-900 rounded-lg transition-colors text-sm lg:text-base"
                            >
                                <User size={18} className="lg:w-5 lg:h-5" />
                                <span className=" lg:inline">Saved</span>
                            </a>
                            
                            <a
                                href="/advertise"
                                className="flex items-center gap-1 lg:gap-2 px-2 lg:px-3 py-2 hover:bg-blue-900 rounded-lg transition-colors text-sm lg:text-base whitespace-nowrap"
                            >
                                <AlignEndVertical size={18} className="lg:w-5 lg:h-5" />
                                <span className="hidden xl:inline">Advertise</span>
                            </a>

                            <button
                                onClick={handleLogout}
                                className="flex items-center gap-1 lg:gap-2 px-2 lg:px-3 py-2 text-red-400 hover:bg-red-900/30 rounded-lg transition-colors text-sm lg:text-base"
                            >
                                <LogOut size={18} className="lg:w-5 lg:h-5" />
                                <span className="hidden lg:inline">Logout</span>
                            </button>
                        </nav>
                    </div>

                    {/* MOBILE SEARCH DROPDOWN */}
                    {showMobileSearch && (
                        <div className="mt-3 md:hidden animate-slideDown">
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Search PDF books..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                                    className="w-full text-white px-4 py-2 pr-10 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-400"
                                    autoFocus
                                />
                                <button
                                    onClick={handleSearch}
                                    className="absolute right-2 t text-blue-950 hover:text-blue-700 transition-colors"
                                    aria-label="Search"
                                >
                                    <Search size={20} />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* MOBILE MENU */}
                    {showMobileMenu && (
                        <nav className="md:hidden mt-3 border-t border-blue-800 pt-3 animate-slideDown">
                            <div className="space-y-1">
                                <a
                                    href="/my-account"
                                    className="flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-blue-900 transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <User size={20} />
                                        <span className="text-sm font-medium">Account</span>
                                    </div>
                                    <ChevronDown size={16} />
                                </a>

                                <a
                                    href="/my-books"
                                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-blue-900 transition-colors"
                                >
                                    <Download size={20} />
                                    <span className="text-sm font-medium">My Books</span>
                                </a>

                                <a
                                    href="/advertise"
                                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-blue-900 transition-colors"
                                >
                                    <AlignEndVertical size={20} />
                                    <span className="text-sm font-medium">Advertise With Us</span>
                                </a>

                                <button
                                    onClick={handleLogout}
                                    className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-red-400 hover:bg-red-900/30 transition-colors"
                                >
                                    <LogOut size={20} />
                                    <span className="text-sm font-medium">Logout</span>
                                </button>
                            </div>
                        </nav>
                    )}
                </div>

                <style jsx>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-slideDown {
          animation: slideDown 0.2s ease-out;
        }
      `}</style>
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
                                            className="bg-white border-blue-950 border text-blue-950 px-4 py-3 rounded-lg hover:bg-blue-950 hover:text-white transition-colors"
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