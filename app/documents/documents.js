// ===========================
// FILE: app/pdf/page.jsx
// ALL BOOKS LIBRARY PAGE WITH MULTIPLE CAROUSEL ROWS
// ===========================

"use client"
import React, { useState, useEffect } from 'react';
import { Globe, Search, User, Menu, X, ChevronDown, ShoppingBag, ChevronRight, Download, Lock, FileText, LogOut, Filter, AlignEndVertical, MoreVertical, Bookmark, Share2, Flag, Plus } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth, db } from "@/lib/firebaseConfig";
import { booksData } from "@/lib/booksData";
import { doc, getDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import Navbar from '@/components/NavBar';
import Footer from '@/components/FooterComp';

export default function AllBooksClient() {
    const router = useRouter();

    const [searchQuery, setSearchQuery] = useState('');
    const [showMobileMenu, setShowMobileMenu] = useState(false);
    const [selectedBook, setSelectedBook] = useState(null);
    const [showPurchaseModal, setShowPurchaseModal] = useState(false);
    const [purchasedBookIds, setPurchasedBookIds] = useState(new Set());
    const [sortBy, setSortBy] = useState('popularity');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [showFilters, setShowFilters] = useState(false);
    const [user, setUser] = useState(null);
    const [showBookMenu, setShowBookMenu] = useState(false);
    const [savedBooks, setSavedBooks] = useState(new Set());
    const [showMobileSearch, setShowMobileSearch] = useState(false);
    const [allBooks, setAllBooks] = useState([]);
    const [loadingBooks, setLoadingBooks] = useState(true);
    const [bookSalesCount, setBookSalesCount] = useState({});
    const [visibleRows, setVisibleRows] = useState(5); // Start with 5 rows

    const booksPerRow = 10;
    const rowsPerLoad = 2; // Load 2 more rows when "Load More" is clicked

    const categories = [
        { value: 'all', label: 'All Categories' },
        { value: 'education', label: 'Education' },
        { value: 'personal development', label: 'Personal Development' },
        { value: 'business', label: 'Business' },
        { value: 'technology', label: 'Technology' },
        { value: 'science', label: 'Science' },
        { value: 'literature', label: 'Literature' },
        { value: 'health wellness', label: 'Health & Wellness' },
        { value: 'history', label: 'History' },
        { value: 'arts culture', label: 'Arts & Culture' },
    ];

    // ✅ ADD THUMBNAIL HELPER FUNCTION (same as BookPreviewPage)
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

    // ✅ FETCH ALL BOOKS (Platform + Firestore) - SIMPLIFIED VERSION
    useEffect(() => {
        const fetchAllBooks = async () => {
            try {
                setLoadingBooks(true);

                // Process booksData with thumbnails FIRST
                const processedBooksData = booksData.map(book => ({
                    ...book,
                    image: getThumbnailUrl(book)
                }));

                // Set immediately so books show right away
                setAllBooks(processedBooksData);

                // Try to fetch Firestore books (without status filter)
                try {
                    const advertBooksRef = collection(db, 'advertMyBook');
                    const snapshot = await getDocs(advertBooksRef);

                    if (!snapshot.empty) {
                        const firestoreBooks = [];

                        snapshot.forEach((doc) => {
                            const data = doc.data();

                            // Only add if it has basic required fields
                            if (data.bookTitle && data.price) {
                                const bookData = {
                                    id: `firestore-${doc.id}`,
                                    firestoreId: doc.id,
                                    title: data.bookTitle,
                                    author: data.author || 'Unknown',
                                    category: (data.category || 'education').toLowerCase(),
                                    price: Number(data.price) || 0,
                                    pages: data.pages || 100,
                                    format: 'PDF',
                                    description: data.description || 'No description',
                                    driveFileId: data.driveFileId,
                                    pdfUrl: data.pdfUrl,
                                    embedUrl: data.embedUrl,
                                    isFromFirestore: true,
                                    rating: 4.5,
                                    reviews: 0
                                };

                                // Generate thumbnail
                                bookData.image = getThumbnailUrl(bookData);
                                firestoreBooks.push(bookData);
                            }
                        });

                        // Combine platform books + Firestore books
                        const combined = [...processedBooksData, ...firestoreBooks];
                        setAllBooks(combined);

                        console.log(`✅ Loaded ${processedBooksData.length} platform books + ${firestoreBooks.length} Firestore books`);
                    }
                } catch (err) {
                    console.error('Firestore error:', err);
                    // Keep platform books only
                }
            } catch (error) {
                console.error('Error loading books:', error);
                // Emergency fallback
                setAllBooks(booksData.map(book => ({
                    ...book,
                    image: getThumbnailUrl(book)
                })));
            } finally {
                setLoadingBooks(false);
            }
        };

        fetchAllBooks();
    }, []);

    // Filter books by category and search (use allBooks instead of booksData)
    const filteredBooks = allBooks.filter(book => {
        const matchesCategory = selectedCategory === 'all' || book.category === selectedCategory;
        const matchesSearch = searchQuery === '' ||
            book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            book.author.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    // Sort books
    const sortBooks = (books) => {
        const sorted = [...books];
        switch (sortBy) {
            case 'price-low':
                return sorted.sort((a, b) => a.price - b.price);
            case 'price-high':
                return sorted.sort((a, b) => b.price - a.price);
            case 'rating':
                return sorted.sort((a, b) => (b.rating || 0) - (a.rating || 0));
            case 'newest':
                return sorted.sort((a, b) => {
                    // Prioritize Firestore books (they're newer)
                    if (a.isFromFirestore && !b.isFromFirestore) return -1;
                    if (!a.isFromFirestore && b.isFromFirestore) return 1;
                    return 0;
                });
            case 'title':
                return sorted.sort((a, b) => a.title.localeCompare(b.title));
            default: // popularity
                return sorted.sort((a, b) => (b.reviews || 0) - (a.reviews || 0));
        }
    };

    const sortedBooks = sortBooks(filteredBooks);

    // Calculate total rows needed
    const totalRows = Math.ceil(sortedBooks.length / booksPerRow);
    const hasMoreRows = visibleRows < totalRows;

    // Get books to display based on visible rows
    const displayBooks = sortedBooks.slice(0, visibleRows * booksPerRow);

    // Split books into rows
    const bookRows = [];
    for (let i = 0; i < visibleRows; i++) {
        const startIdx = i * booksPerRow;
        const endIdx = Math.min(startIdx + booksPerRow, displayBooks.length);
        if (startIdx < displayBooks.length) {
            bookRows.push(displayBooks.slice(startIdx, endIdx));
        }
    }

    // Load more rows
    const handleLoadMore = () => {
        setVisibleRows(prev => Math.min(prev + rowsPerLoad, totalRows));
        // Smooth scroll to the newly loaded content
        setTimeout(() => {
            window.scrollBy({ top: 400, behavior: 'smooth' });
        }, 100);
    };

    // Reset visible rows when filters change
    useEffect(() => {
        setVisibleRows(5);
    }, [selectedCategory, searchQuery, sortBy]);

    // Fetch sales count for all books
    useEffect(() => {
        const fetchBookSales = async () => {
            try {
                const usersSnapshot = await getDocs(collection(db, "users"));
                const salesMap = {};

                usersSnapshot.docs.forEach(userDoc => {
                    const userData = userDoc.data();
                    const purchasedBooks = userData.purchasedBooks || {};

                    Object.values(purchasedBooks).forEach(purchase => {
                        const bookId = purchase.bookId || purchase.id || purchase.firestoreId;
                        if (bookId) {
                            salesMap[bookId] = (salesMap[bookId] || 0) + 1;
                            // Also track firestore- prefixed version
                            salesMap[`firestore-${bookId}`] = (salesMap[`firestore-${bookId}`] || 0) + 1;
                        }
                    });
                });

                setBookSalesCount(salesMap);
            } catch (error) {
                console.error("Error fetching sales count:", error);
            }
        };

        fetchBookSales();
    }, []);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (currentUser) {
                setUser(currentUser);
            } else {
                router.push('/auth/signin');
            }
        });

        return () => unsubscribe();
    }, [router]);

    // SAVED BOOK FUNCTION
    useEffect(() => {
        const loadSavedBooks = async () => {
            try {
                const user = auth.currentUser;
                if (user) {
                    const userDocRef = doc(db, 'users', user.uid);
                    const userDoc = await getDoc(userDocRef);

                    if (userDoc.exists()) {
                        const userData = userDoc.data();
                        const saved = userData.savedBooks || [];
                        setSavedBooks(new Set(saved.map(book => book.id)));
                    }
                }
            } catch (error) {
                console.error('Error loading saved books:', error);
            }
        };

        if (user) {
            loadSavedBooks();
        }
    }, [user]);

    // Fetch purchased books from Firebase
    useEffect(() => {
        const fetchPurchasedBooks = async () => {
            try {
                const user = auth.currentUser;
                if (user) {
                    const userDocRef = doc(db, 'users', user.uid);
                    const userDoc = await getDoc(userDocRef);

                    if (userDoc.exists()) {
                        const userData = userDoc.data();

                        const purchasedBooksData = userData.purchasedBooks || {};

                        let purchasedArray = [];
                        if (Array.isArray(purchasedBooksData)) {
                            purchasedArray = purchasedBooksData;
                        } else if (typeof purchasedBooksData === 'object') {
                            purchasedArray = Object.values(purchasedBooksData);
                        }

                        const bookIds = new Set(
                            purchasedArray
                                .map(book => book.id || book.bookId || book.firestoreId)
                                .filter(Boolean)
                        );

                        setPurchasedBookIds(bookIds);
                    }
                }
            } catch (error) {
                console.error('Error fetching purchased books:', error);
                setPurchasedBookIds(new Set());
            }
        };

        fetchPurchasedBooks();
    }, []);

    const isPurchased = (bookId) => {
        return (
            purchasedBookIds.has(bookId) ||
            purchasedBookIds.has(String(bookId)) ||
            purchasedBookIds.has(`firestore-${bookId}`) ||
            purchasedBookIds.has(bookId.toString().replace('firestore-', ''))
        );
    };

    if (loadingBooks) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="relative w-20 h-24 perspective-1000">
                    {/* Book Container */}
                    <div className="book-flip-container">
                        {/* Front Cover - Book */}
                        <div className="book-face book-front">
                            <div className="w-full h-full bg-gradient-to-br from-blue-950 via-blue-800 to-blue-700 rounded-r-lg shadow-2xl relative overflow-hidden">
                                {/* Book spine shadow */}
                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-black/30"></div>

                                {/* Book pages effect */}
                                <div className="absolute right-0 top-1 bottom-1 w-0.5 bg-white/20"></div>
                                <div className="absolute right-1 top-2 bottom-2 w-0.5 bg-white/15"></div>
                                <div className="absolute right-2 top-3 bottom-3 w-0.5 bg-white/10"></div>

                                {/* Book icon */}
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <svg className="w-10 h-10 text-white/90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                    </svg>
                                </div>

                                {/* Shine effect */}
                                <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent"></div>
                            </div>
                        </div>

                        {/* Back Cover - LAN */}
                        <div className="book-face book-back">
                            <div className="w-full h-full bg-gradient-to-br from-blue-950 via-blue-800 to-blue-700 rounded-lg shadow-2xl flex items-center justify-center relative overflow-hidden">
                                {/* LAN Text */}
                                <div className="flex gap-0.5 text-white font-black text-2xl">
                                    <span className="inline-block lan-letter" style={{ animationDelay: '0s' }}>L</span>
                                    <span className="inline-block lan-letter" style={{ animationDelay: '0.15s' }}>A</span>
                                    <span className="inline-block lan-letter" style={{ animationDelay: '0.3s' }}>N</span>
                                </div>

                                {/* Glow effect */}
                                <div className="absolute inset-0 bg-gradient-to-t from-blue-600/20 via-transparent to-transparent"></div>
                            </div>
                        </div>
                    </div>

                    {/* Loading dots */}
                    <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 flex gap-1">
                        <div className="w-1.5 h-1.5 bg-blue-950 rounded-full animate-pulse" style={{ animationDelay: '0s' }}></div>
                        <div className="w-1.5 h-1.5 bg-blue-800 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                        <div className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                    </div>

                    <style jsx>{`
    .perspective-1000 {
      perspective: 1000px;
    }
    
    .book-flip-container {
      position: relative;
      width: 100%;
      height: 100%;
      transform-style: preserve-3d;
      animation: bookFlip 3s ease-in-out infinite;
    }
    
    .book-face {
      position: absolute;
      width: 100%;
      height: 100%;
      backface-visibility: hidden;
      -webkit-backface-visibility: hidden;
    }
    
    .book-front {
      z-index: 2;
    }
    
    .book-back {
      transform: rotateY(180deg);
    }
    
    @keyframes bookFlip {
      0%, 100% {
        transform: rotateY(0deg);
      }
      25%, 75% {
        transform: rotateY(180deg);
      }
    }
    
    @keyframes lan-letter {
      0%, 100% {
        transform: translateY(0) scale(1);
      }
      50% {
        transform: translateY(-4px) scale(1.1);
      }
    }
    
    .lan-letter {
      animation: lan-letter 0.6s ease-in-out infinite;
    }
  `}</style>
                </div>
            </div>
        );
    }

    return (
        <>
            <Navbar />
            <div className="min-h-screen bg-white">

                {/* Breadcrumb */}
                <div className="bg-gray-50 border-b border-gray-200">
                    <div className="max-w-7xl mx-auto px-4 py-3">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Link href="/" className="hover:text-blue-600">Home</Link>
                            <span>&gt;</span>
                            <span className="text-gray-900 font-semibold">All PDF Books</span>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <main className="max-w-7xl mx-auto px-4 py-8">
                    {/* Page Header */}
                    <div className="mb-8">
                        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                            Complete PDF Library
                        </h1>
                        <p className="text-gray-600">
                            Browse all {allBooks.length} digital books available for instant download
                        </p>
                    </div>

                    {/* Filters & Sort */}
                    <div className="bg-neutral-50 border border-gray-200 rounded-lg p-4 mb-6">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                            {/* Left Side - Category Filter */}
                            <div className="flex items-center gap-3 flex-wrap">
                                <button
                                    onClick={() => setShowFilters(!showFilters)}
                                    className="md:hidden flex items-center gap-2 bg-blue-950 text-white px-4 py-2 rounded-lg"
                                >
                                    <Filter size={18} />
                                    Filters
                                </button>

                                <div className={`${showFilters ? 'block' : 'hidden'} md:flex items-center gap-3 w-full md:w-auto`}>
                                    <label className="text-sm font-semibold text-blue-950">Category:</label>
                                    <select
                                        value={selectedCategory}
                                        onChange={(e) => setSelectedCategory(e.target.value)}
                                        className="border text-blue-950 border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-blue-950"
                                    >
                                        {categories.map(cat => (
                                            <option key={cat.value} value={cat.value}>
                                                {cat.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Right Side - Sort & Results */}
                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                                <span className="text-sm text-gray-600">
                                    Showing {displayBooks.length} of {sortedBooks.length} books
                                </span>
                                <div className="flex items-center gap-2">
                                    <label className="text-sm font-semibold text-gray-700">Sort:</label>
                                    <select
                                        value={sortBy}
                                        onChange={(e) => setSortBy(e.target.value)}
                                        className="border text-blue-950 border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-blue-950"
                                    >
                                        <option value="popularity">Popularity</option>
                                        <option value="price-low">Price: Low to High</option>
                                        <option value="price-high">Price: High to Low</option>
                                        <option value="newest">Newest First</option>
                                        <option value="rating">Highest Rated</option>
                                        <option value="title">Title (A-Z)</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Books Display or No Results */}
                    {sortedBooks.length === 0 ? (
                        <div className="bg-white rounded-lg shadow-lg p-12 text-center">
                            <FileText className="w-20 h-20 mx-auto mb-4 text-gray-400" />
                            <h3 className="text-2xl font-bold text-gray-900 mb-2">No Books Found</h3>
                            <p className="text-gray-600 mb-6">
                                Try adjusting your search or filters.
                            </p>
                            <button
                                onClick={() => {
                                    setSearchQuery('');
                                    setSelectedCategory('all');
                                }}
                                className="bg-blue-950 text-white px-6 py-3 rounded-lg hover:bg-blue-900 transition-colors"
                            >
                                Clear Filters
                            </button>
                        </div>
                    ) : (
                        <>
                            {/* Multiple Carousel Rows */}
                            <div className="space-y-8">
                                {bookRows.map((rowBooks, rowIndex) => (
                                    <div key={rowIndex} className="px-4 lg:px-0">
                                        <h3 className="text-lg lg:text-xl font-bold text-gray-900 mb-4">
                                        </h3>

                                        {/* Horizontal Scrolling Carousel */}
                                        <div className="relative -mx-4 lg:mx-0">
                                            <div
                                                className="overflow-x-auto overflow-y-hidden scrollbar-hide px-4 lg:px-0"
                                                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                                            >
                                                <style jsx>{`
                                                    div::-webkit-scrollbar {
                                                        display: none;
                                                    }
                                                `}</style>

                                                <div className="flex gap-4 lg:gap-5 pb-4">
                                                    {rowBooks.map((book) => (
                                                        <Link
                                                            key={book.id}
                                                            href={`/book/preview?id=${book.id}`}
                                                            className="flex-none w-[160px] sm:w-[180px] lg:w-[200px] group"
                                                        >
                                                            <div className="relative mb-3">
                                                                <img
                                                                    src={book.image}
                                                                    alt={book.title}
                                                                    className="w-full h-[220px] sm:h-[260px] lg:h-[300px] group-hover:shadow-xl transition-shadow"
                                                                    onError={(e) => {
                                                                        e.target.src = 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400';
                                                                    }}
                                                                />
                                                                {isPurchased(book.id) && (
                                                                    <span className="absolute top-2 right-2 bg-green-600 text-white px-2 py-1 rounded text-xs font-bold">
                                                                        Owned
                                                                    </span>
                                                                )}
                                                                {book.isFromFirestore && (
                                                                    <span className="absolute top-2 left-2 bg-blue-600 text-white px-2 py-1 rounded text-xs font-bold">
                                                                        New
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <div>
                                                                <h4 className="font-bold text-sm lg:text-base text-gray-900 mb-1 line-clamp-2 group-hover:text-blue-600 transition-colors">
                                                                    {book.title}
                                                                </h4>
                                                                <p className="text-gray-600 text-xs lg:text-sm mb-1">{book.author}</p>
                                                                <p className="text-gray-500 text-xs lg:text-sm flex items-center gap-1">
                                                                    <ShoppingBag size={12} />
                                                                    {bookSalesCount[book.id] || bookSalesCount[book.firestoreId] || 0} sold
                                                                </p>
                                                            </div>
                                                        </Link>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Load More Button */}
                            {hasMoreRows && (
                                <div className="mt-12 flex justify-center">
                                    <button
                                        onClick={handleLoadMore}
                                        className="bg-blue-950 cursor-pointer text-white px-8 py-4 rounded-lg hover:bg-blue-900 transition-colors flex items-center gap-2 font-semibold text-lg shadow-lg hover:shadow-xl"
                                    >
                                        <Plus size={20} />
                                         {Math.min(rowsPerLoad * booksPerRow, sortedBooks.length - displayBooks.length)} more
                                    </button>
                                </div>
                            )}

                            {/* All Books Loaded Message */}
                            {!hasMoreRows && sortedBooks.length > booksPerRow && (
                                <div className="mt-12 text-center">
                                    <p className="text-gray-600 text-lg">
                                        You've reached the end! All {sortedBooks.length} books displayed.
                                    </p>
                                </div>
                            )}
                        </>
                    )}
                </main>

                {/* Footer */}
                <Footer />
            </div>
        </>
    );
}