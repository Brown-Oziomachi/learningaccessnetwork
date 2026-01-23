// ===========================
// FILE: app/pdf/page.jsx
// ALL BOOKS LIBRARY PAGE WITH CAROUSEL - FIXED THUMBNAILS
// ===========================

"use client"
import React, { useState, useEffect } from 'react';
import { Globe, Search, User, Menu, X, ChevronDown, ChevronRight, Download, Lock, FileText, LogOut, Filter, AlignEndVertical, MoreVertical, Bookmark, Share2, Flag } from 'lucide-react';
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
    const [currentPage, setCurrentPage] = useState(1);
    const [showFilters, setShowFilters] = useState(false);
    const [user, setUser] = useState(null);
    const [showBookMenu, setShowBookMenu] = useState(false);
    const [savedBooks, setSavedBooks] = useState(new Set());
    const booksPerPage = 12;
    const [showMobileSearch, setShowMobileSearch] = useState(false);
    const [allBooks, setAllBooks] = useState([]);
    const [loadingBooks, setLoadingBooks] = useState(true);

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

    // Pagination
    const totalPages = Math.ceil(sortedBooks.length / booksPerPage);
    const startIndex = (currentPage - 1) * booksPerPage;
    const displayBooks = sortedBooks.slice(startIndex, startIndex + booksPerPage);

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

    // Add this function to handle save/unsave
    const handleSaveBook = async (book) => {
        try {
            const user = auth.currentUser;
            if (!user) {
                alert('Please sign in to save books');
                return;
            }

            const userDocRef = doc(db, 'users', user.uid);
            const userDoc = await getDoc(userDocRef);

            let savedBooksArray = [];
            if (userDoc.exists()) {
                const userData = userDoc.data();
                savedBooksArray = userData.savedBooks || [];
            }

            const isCurrentlySaved = savedBooks.has(book.id);

            if (isCurrentlySaved) {
                // Remove from saved
                savedBooksArray = savedBooksArray.filter(b => b.id !== book.id);
                setSavedBooks(prev => {
                    const newSet = new Set(prev);
                    newSet.delete(book.id);
                    return newSet;
                });
                alert('Removed from Saved');
            } else {
                // Add to saved
                const bookToSave = {
                    id: book.id,
                    title: book.title,
                    author: book.author,
                    image: book.image,
                    price: book.price,
                    category: book.category,
                    savedAt: new Date().toISOString()
                };
                savedBooksArray.push(bookToSave);
                setSavedBooks(prev => new Set(prev).add(book.id));
                alert('Saved for later!');
            }

            await updateDoc(userDocRef, {
                savedBooks: savedBooksArray
            });

            setShowBookMenu(false);
        } catch (error) {
            console.error('Error saving book:', error);
            alert('Error saving book. Please try again.');
        }
    };

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

    // Reset to page 1 when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [selectedCategory, searchQuery, sortBy]);

    const handleLogout = async () => {
        try {
            await signOut(auth);
            router.push("/auth/signin");
        } catch (error) {
            console.error("Logout error:", error);
        }
    };

    const handleSearch = () => {
        if (searchQuery.trim()) {
            router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
            setShowMobileSearch(false);
        }
    };

    const handlePurchase = (book) => {
        setSelectedBook(book);
        setShowPurchaseModal(true);
    };

    const handleProceedToPayment = () => {
        setShowPurchaseModal(false);
        router.push(`/payment?bookId=${selectedBook.id}`);
    };

    const handleDownload = (book) => {
        alert(`Downloading ${book.title}...\nPDF will be sent to your registered email.`);
    };

    const isPurchased = (bookId) => {
        return (
            purchasedBookIds.has(bookId) ||
            purchasedBookIds.has(String(bookId)) ||
            purchasedBookIds.has(`firestore-${bookId}`) ||
            purchasedBookIds.has(bookId.toString().replace('firestore-', ''))
        );
    };

    const goToPage = (page) => {
        setCurrentPage(page);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    if (loadingBooks) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin h-12 w-12 border-b-2 border-blue-950 rounded-full mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading books...</p>
                </div>
            </div>
        );
    }

    return (
        <>
            <Navbar />
            <div className="min-h-screen bg-neutral-100">

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
                                    Showing {startIndex + 1}-{Math.min(startIndex + booksPerPage, sortedBooks.length)} of {sortedBooks.length}
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

                    {/* Books Grid or No Results */}
                    {displayBooks.length === 0 ? (
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
                            {/* Featured Books Carousel */}
                            <div className="px-4 py-8 lg:px-0">
                                <h1 className="text-4xl lg:text-5xl font-black mb-10 text-black">Documents</h1>
                                <h3 className="text-lg lg:text-xl font-bold text-gray-900 mb-8">Get started with the community's uploads</h3>

                                <div className="relative -mx-4 lg:mx-0">
                                    <div className="overflow-x-auto overflow-y-hidden scrollbar-hide px-4 lg:px-0" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                                        <style jsx>{`
                div::-webkit-scrollbar {
                    display: none;
                }
            `}</style>
                                        <div className="flex gap-5 lg:gap-5 pb-2">
                                            {displayBooks.slice(1, 20).map((book, index) => (
                                                <Link
                                                    key={book.id}
                                                    href={`/book/preview?id=${book.id}`}
                                                    className="flex-none w-[180px] sm:w-[200px] lg:w-[220px] group"
                                                >
                                                    <div className="relative mb-3">
                                                        <img
                                                            src={book.image}
                                                            alt={book.title}
                                                            className="w-full h-[240px] sm:h-[280px] lg:h-[320px] object-cover rounded shadow-md group-hover:shadow-xl transition-shadow"
                                                            onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400'; }}
                                                        />
                                                        {isPurchased(book.id) && (
                                                            <span className="absolute top-2 right-2 bg-green-600 text-white px-2 py-1 rounded text-xs font-bold">Owned</span>
                                                        )}
                                                        {book.isFromFirestore && (
                                                            <span className="absolute top-2 left-2 bg-blue-600 text-white px-2 py-1 rounded text-xs font-bold">New</span>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <h4 className="font-bold text-sm lg:text-base text-gray-900 mb-1 line-clamp-2 group-hover:text-blue-600 transition-colors">
                                                            {book.title}
                                                        </h4>
                                                        <p className="text-gray-600 text-xs lg:text-sm">{book.author}</p>
                                                    </div>
                                                </Link>
                                            ))}
                                        </div>
                                    </div>
                                    {displayBooks.length > 4 && (
                                        <button className="hidden lg:flex absolute right-0 top-1/2 -translate-y-1/2 translate-x-6 w-11 h-11 bg-white rounded-full shadow-lg items-center justify-center hover:bg-gray-50 transition-colors z-10 border border-gray-200">
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Documents recommended for you */}
                            <div className="px-4 py-8 lg:px-0">
                                <h3 className="text-lg lg:text-xl font-bold text-gray-900 mb-8">Documents recommended for you</h3>

                                <div className="relative -mx-4 lg:mx-0">
                                    <div className="overflow-x-auto overflow-y-hidden scrollbar-hide px-4 lg:px-0" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                                        <style jsx>{`
                div::-webkit-scrollbar {
                    display: none;
                }
            `}</style>
                                        <div className="flex gap-5 lg:gap-5 pb-2">
                                            {displayBooks.slice(7, 17).map((book, index) => (
                                                <Link
                                                    key={book.id}
                                                    href={`/book/preview?id=${book.id}`}
                                                    className="flex-none w-[180px] sm:w-[200px] lg:w-[220px] group"
                                                >
                                                    <div className="relative mb-3">
                                                        <img
                                                            src={book.image}
                                                            alt={book.title}
                                                            className="w-full h-[240px] sm:h-[280px] lg:h-[320px] object-cover rounded shadow-md group-hover:shadow-xl transition-shadow"
                                                            onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400'; }}
                                                        />
                                                        {isPurchased(book.id) && (
                                                            <span className="absolute top-2 right-2 bg-green-600 text-white px-2 py-1 rounded text-xs font-bold">Owned</span>
                                                        )}
                                                        {book.isFromFirestore && (
                                                            <span className="absolute top-2 left-2 bg-blue-600 text-white px-2 py-1 rounded text-xs font-bold">New</span>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <h4 className="font-bold text-sm lg:text-base text-gray-900 mb-1 line-clamp-2 group-hover:text-blue-600 transition-colors">
                                                            {book.title}
                                                        </h4>
                                                        <p className="text-gray-600 text-xs lg:text-sm">{book.author}</p>
                                                    </div>
                                                </Link>
                                            ))}
                                        </div>
                                    </div>
                                    {displayBooks.length > 9 && (
                                        <button className="hidden lg:flex absolute right-0 top-1/2 -translate-y-1/2 translate-x-6 w-11 h-11 bg-white rounded-full shadow-lg items-center justify-center hover:bg-gray-50 transition-colors z-10 border border-gray-200">
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Recently Added */}
                            <div className="px-4 py-8 lg:px-0">
                                <h3 className="text-lg lg:text-xl font-bold text-gray-900 mb-8">Recently Publshed</h3>

                                <div className="relative -mx-4 lg:mx-0">
                                    <div className="overflow-x-auto overflow-y-hidden scrollbar-hide px-4 lg:px-0" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                                        <style jsx>{`
                div::-webkit-scrollbar {
                    display: none;
                }
            `}</style>
                                        <div className="flex gap-5 lg:gap-5 pb-2">
                                            {displayBooks.slice(0, 7).map((book, _index) => (
                                                <Link
                                                    key={book.id}
                                                    href={`/book/preview?id=${book.id}`}
                                                    className="flex-none w-[180px] sm:w-[200px] lg:w-[220px] group"
                                                >
                                                    <div className="relative mb-3">
                                                        <img
                                                            src={book.image}
                                                            alt={book.title}
                                                            className="w-full h-[240px] sm:h-[280px] lg:h-[320px] object-cover rounded shadow-md group-hover:shadow-xl transition-shadow"
                                                            onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400'; }}
                                                        />
                                                        {isPurchased(book.id) && (
                                                            <span className="absolute top-2 right-2 bg-green-600 text-white px-2 py-1 rounded text-xs font-bold">Owned</span>
                                                        )}
                                                        {book.isFromFirestore && (
                                                            <span className="absolute top-2 left-2 bg-blue-600 text-white px-2 py-1 rounded text-xs font-bold">New</span>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <h4 className="font-bold text-sm lg:text-base text-gray-900 mb-1 line-clamp-2 group-hover:text-blue-600 transition-colors">
                                                            {book.title}
                                                        </h4>
                                                        <p className="text-gray-600 text-xs lg:text-sm">{book.author}</p>
                                                    </div>
                                                </Link>
                                            ))}
                                        </div>
                                    </div>
                                    {displayBooks.length > 19 && (
                                        <button className="hidden lg:flex absolute right-0 top-1/2 -translate-y-1/2 translate-x-6 w-11 h-11 bg-white rounded-full shadow-lg items-center justify-center hover:bg-gray-50 transition-colors z-10 border border-gray-200">
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <div className="mt-12 flex flex-wrap text-blue-950 items-center justify-center gap-2">
                                    <button
                                        onClick={() => goToPage(currentPage - 1)}
                                        disabled={currentPage === 1}
                                        className="px-4 py-2 border border-gray-300 text-blue-950 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                                    >
                                        Previous
                                    </button>

                                    {[...Array(totalPages)].map((_, index) => {
                                        const page = index + 1;
                                        if (
                                            page === 1 ||
                                            page === totalPages ||
                                            (page >= currentPage - 1 && page <= currentPage + 1)
                                        ) {
                                            return (
                                                <button
                                                    key={page}
                                                    onClick={() => goToPage(page)}
                                                    className={`px-4 py-2 rounded-lg text-sm ${currentPage === page
                                                        ? 'bg-blue-950 text-white'
                                                        : 'border border-gray-300 hover:bg-gray-50'
                                                        }`}
                                                >
                                                    {page}
                                                </button>
                                            );
                                        } else if (
                                            page === currentPage - 2 ||
                                            page === currentPage + 2
                                        ) {
                                            return <span key={page} className="text-gray-500">...</span>;
                                        }
                                        return null;
                                    })}

                                    <button
                                        onClick={() => goToPage(currentPage + 1)}
                                        disabled={currentPage === totalPages}
                                        className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                                    >
                                        Next
                                    </button>
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