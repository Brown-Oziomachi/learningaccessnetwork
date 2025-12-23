// ===========================
// FILE: app/pdf/page.jsx
// ALL BOOKS LIBRARY PAGE WITH CAROUSEL
// ===========================

"use client"
import React, { useState, useEffect } from 'react';
import { Globe, Search, User, Menu, X, ChevronDown,ChevronRight, Download, Lock, FileText, LogOut, Filter, AlignEndVertical,MoreVertical, Bookmark, Share2, Flag  } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth, db } from "@/lib/firebaseConfig";
import { booksData } from "@/lib/booksData";
import { doc, getDoc,updateDoc } from 'firebase/firestore';
import Navbar from '@/components/NavBar';

export default function AllBooksPage() {
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

    // Filter books by category and search
    const filteredBooks = booksData.filter(book => {
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
                return sorted.sort((a, b) => b.rating - a.rating);
            case 'newest':
                return sorted.sort((a, b) => b.id - a.id);
            case 'title':
                return sorted.sort((a, b) => a.title.localeCompare(b.title));
            default: // popularity
                return sorted.sort((a, b) => b.reviews - a.reviews);
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
                        const purchased = userData.purchasedBooks || [];
                        const bookIds = new Set(purchased.map(book => book.id));
                        setPurchasedBookIds(bookIds);
                    }
                }
            } catch (error) {
                console.error('Error fetching purchased books:', error);
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
                setShowMobileSearch(false); // hide mobile dropdown if open
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
        return purchasedBookIds.has(bookId);
    };

    const goToPage = (page) => {
        setCurrentPage(page);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <>
        <Navbar/>
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
                        Browse all {booksData.length} digital books available for instant download
                    </p>
                </div>

                {/* Filters & Sort */}
                <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
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
                         <div className="lg:-mx-60 px-1 py-8">
                    <h3 className="text-2xl font-bold text-gray-900 mb-4">Featured Books</h3>
                    <div className="overflow-x-auto scrollbar-hide p-1">
                        <div className="flex gap-2 pb-4">
                            {displayBooks.slice(0, 4).map((book) => (
                                <Link key={book.id} href={`/book/preview?id=${book.id}`} className="flex-none w-[200px] sm:w-[300px] bg-gray-50 px-3 py-5 border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow cursor-pointer">
                                    <div className="relative">
                                        <img src={book.image} alt={book.title} className="w-full max-lg:h-48 lg:h-90 lg:p-5" />
                                        {isPurchased(book.id) && <span className="absolute top-2 right-2 bg-green-600 text-white px-1.5 py-0.5 rounded text-xs font-bold">Owned</span>}
                                        {book.isFromFirestore && <span className="absolute top-2 left-2 bg-blue-600 text-white px-2 py-0.5 rounded text-xs font-bold">New</span>}
                                    </div>
                                    <div className="p-3 py-7">
                                        <h4 className="font-semibold text-sm text-gray-900 mb-1 line-clamp-2 hover:text-blue-950">{book.title}</h4>
                                        <p className="text-gray-600 mb-1 text-xs">by {book.author}</p>
                                        <p className="text-blue-950 font-bold mb-2">₦{book.price?.toLocaleString()}</p>
                                        <p className="text-xs text-gray-500 mt-2">Tap to preview →</p>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>
                 <div className="lg:-mx-60 px-1 py-8">
                    <h3 className="text-2xl font-bold text-gray-900 mb-4">Recents Books</h3>
                    <div className="overflow-x-auto scrollbar-hide p-1">
                        <div className="flex gap-2 pb-4">
                            {displayBooks.slice(5, 10).map((book) => (
                                <Link key={book.id} href={`/book/preview?id=${book.id}`} className="flex-none w-[200px] sm:w-[300px] bg-gray-50 px-3 py-5 border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow cursor-pointer">
                                    <div className="relative">
                                        <img src={book.image} alt={book.title} className="w-full max-lg:h-48 lg:h-90 lg:p-5" />
                                        {isPurchased(book.id) && <span className="absolute top-2 right-2 bg-green-600 text-white px-1.5 py-0.5 rounded text-xs font-bold">Owned</span>}
                                        {book.isFromFirestore && <span className="absolute top-2 left-2 bg-blue-600 text-white px-2 py-0.5 rounded text-xs font-bold">New</span>}
                                    </div>
                                    <div className="p-3 py-7">
                                        <h4 className="font-semibold text-sm text-gray-900 mb-1 line-clamp-2 hover:text-blue-950">{book.title}</h4>
                                        <p className="text-gray-600 mb-1 text-xs">by {book.author}</p>
                                        <p className="text-blue-950 font-bold mb-2">₦{book.price?.toLocaleString()}</p>
                                        <p className="text-xs text-gray-500 mt-2">Tap to preview →</p>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>
                        {/* Remaining Books - Grid (Desktop shows all, mobile shows after carousel) */}
                       <div className="mb-12 bg-gray-50 -mx-4 px-1 py-8">
                    <div className="overflow-x-auto scrollbar-hide">
                        <div className="flex gap-4 pb-4">
                            {displayBooks.slice(17, 24).map((book) => (
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
                </div>
                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="mt-12 flex flex-wrap items-center justify-center gap-2">
                                <button
                                    onClick={() => goToPage(currentPage - 1)}
                                    disabled={currentPage === 1}
                                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                                >
                                    Previous
                                </button>

                                {[...Array(totalPages)].map((_, index) => {
                                    const page = index + 1;
                                    // Show first, last, current, and adjacent pages
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
            <footer className="bg-blue-950 text-white mt-16">
                <div className="max-w-7xl mx-auto px-4 py-12">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                        <div>
                            <div className="flex items-center gap-2 mb-4">
                                <Globe className="w-8 h-8" />
                                <h3 className="text-xl font-bold">LEARNING ACCESS</h3>
                            </div>
                            <p className="text-gray-300 text-sm">
                                Digital PDF library making knowledge easily accessible to everyone.
                            </p>
                        </div>
                        <div>
                            <h4 className="font-bold mb-4">Quick Links</h4>
                            <ul className="space-y-2 text-sm">
                                <li><Link href="/about/lan" className="text-gray-300 hover:text-white">About Us</Link></li>
                                <li><Link href="lan/explains/how-it-works" className="text-gray-300 hover:text-white">How It Works</Link></li>
                                <li><Link href="/lan/faqs" className="text-gray-300 hover:text-white">FAQs</Link></li>
                                <li><Link href="/contact/lan/4/enquiry" className="text-gray-300 hover:text-white">Contact</Link></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-bold mb-4">Categories</h4>
                            <ul className="space-y-2 text-sm">
                                <li><Link href="/category/education" className="text-gray-300 hover:text-white">Education</Link></li>
                                <li><Link href="/category/business" className="text-gray-300 hover:text-white">Business</Link></li>
                                <li><Link href="/category/technology" className="text-gray-300 hover:text-white">Technology</Link></li>
                                <li><Link href="/pdf" className="text-gray-300 hover:text-white">All Books</Link></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-bold mb-4">Customer Service</h4>
                            <ul className="space-y-2 text-sm">
                                <li><Link href="/my-account" className="text-gray-300 hover:text-white">My Account</Link></li>
                                <li><Link href="/my-books" className="text-gray-300 hover:text-white">My Books</Link></li>
                                <li><Link href="lan/net/help-center" className="text-gray-300 hover:text-white">Help Center</Link></li>
                            </ul>
                        </div>
                    </div>
                    <div className="border-t border-blue-800 mt-8 pt-8 text-center text-sm text-gray-300">
                        <p>&copy; 2025 Learning Access Network. All rights reserved.</p>
                    </div>
                </div>
            </footer>
        </div>
        </>
    );
}