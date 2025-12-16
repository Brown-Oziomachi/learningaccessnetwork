// ===========================
// FILE: app/pdf/page.jsx
// ALL BOOKS LIBRARY PAGE
// ===========================

"use client"
import React, { useState, useEffect } from 'react';
import { Globe, Search, User, Menu, X, ChevronDown, Download, Lock, FileText, LogOut, Filter } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signOut } from "firebase/auth";
import { auth, db } from "@/lib/firebaseConfig";
import { booksData } from "@/lib/booksData";
import { doc, getDoc } from 'firebase/firestore';

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
    const booksPerPage = 12;

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
        switch(sortBy) {
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
        <div className="min-h-screen bg-white">
            {/* Header */}
            <header className="bg-blue-950 text-white sticky top-0 z-50 shadow-lg">
                <div className="max-w-7xl mx-auto px-4 py-4">
                    <div className="flex items-center justify-between gap-4">
                        <button
                            className="md:hidden"
                            onClick={() => setShowMobileMenu(!showMobileMenu)}
                        >
                            {showMobileMenu ? <X size={24} /> : <Menu size={24} />}
                        </button>

                        <Link href="/home" className="flex items-center gap-2">
                            <Globe className="w-8 h-8 text-white" />
                            <h1 className="text-xl md:text-2xl font-bold">
                                L <span className="text-blue-400">A N</span>
                            </h1>
                        </Link>

                        <div className="hidden md:flex flex-1 max-w-2xl">
                            <div className="relative w-full">
                                <input
                                    type="text"
                                    placeholder="Search for PDF books, authors, categories..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full px-4 py-2 rounded-l-lg text-gray-900 focus:outline-none"
                                />
                                <button className="absolute right-0 top-0 bottom-0 bg-blue-600 hover:bg-blue-700 px-6 rounded-r-lg transition-colors">
                                    <Search size={20} />
                                </button>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <Link href="/my-account" className="hidden md:flex items-center gap-2 hover:text-blue-400 transition-colors">
                                <User size={20} />
                                <span>Account</span>
                                <ChevronDown size={16} />
                            </Link>

                            <Link href="/my-books" className="hidden md:flex items-center gap-2 hover:text-blue-400 transition-colors">
                                <Download size={20} />
                                <span>My Books</span>
                            </Link>

                            <button onClick={handleLogout} className="hidden md:flex items-center gap-2 text-red-400 hover:text-red-300 transition-colors">
                                <LogOut size={20} />
                                <span>Logout</span>
                            </button>
                        </div>
                    </div>

                    <div className="md:hidden mt-4">
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Search PDF books..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full px-4 py-2 rounded-lg text-gray-900 focus:outline-none"
                            />
                            <button className="absolute right-2 top-2 text-blue-950">
                                <Search size={20} />
                            </button>
                        </div>
                    </div>
                </div>

                {showMobileMenu && (
                    <div className="md:hidden bg-blue-900 border-t border-blue-800">
                        <div className="px-4 py-3 space-y-2">
                            <Link href="/my-account" className="flex items-center justify-between gap-2 px-3 py-2 rounded hover:bg-blue-800 hover:text-blue-400 transition-colors">
                                <div className="flex items-center gap-2">
                                    <User size={20} />
                                    <span className="text-sm font-medium">Account</span>
                                </div>
                                <ChevronDown size={16} />
                            </Link>

                            <Link href="/my-books" className="flex items-center gap-2 px-3 py-2 rounded hover:bg-blue-800 hover:text-blue-400 transition-colors">
                                <Download size={20} />
                                <span className="text-sm font-medium">My Books</span>
                            </Link>

                            <button onClick={handleLogout} className="flex items-center gap-2 w-full px-3 py-2 rounded text-red-400 hover:bg-red-800 hover:text-red-300 transition-colors">
                                <LogOut size={20} />
                                <span className="text-sm font-medium">Logout</span>
                            </button>
                        </div>
                    </div>
                )}
            </header>

            {/* Breadcrumb */}
            <div className="bg-gray-50 border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 py-3">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Link href="/home" className="hover:text-blue-600">Home</Link>
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
                                <label className="text-sm font-semibold text-gray-700">Category:</label>
                                <select
                                    value={selectedCategory}
                                    onChange={(e) => setSelectedCategory(e.target.value)}
                                    className="border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-blue-950"
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
                        <div className="flex items-center gap-4">
                            <span className="text-sm text-gray-600">
                                Showing {startIndex + 1}-{Math.min(startIndex + booksPerPage, sortedBooks.length)} of {sortedBooks.length}
                            </span>
                            <div className="flex items-center gap-2">
                                <label className="text-sm font-semibold text-gray-700">Sort:</label>
                                <select
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value)}
                                    className="border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-blue-950"
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

                {/* Books Grid */}
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
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {displayBooks.map((book) => (
                                <div
                                    key={book.id}
                                    className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
                                >
                                    <div className="relative">
                                        <img
                                            src={book.image}
                                            alt={book.title}
                                            className="w-full h-64 object-cover"
                                        />
                                        <div className="absolute top-3 right-3 flex flex-col gap-2">
                                            <span className="bg-blue-600 text-white px-2 py-1 rounded text-xs font-bold flex items-center gap-1">
                                                <FileText size={14} />
                                                {book.format}
                                            </span>
                                            {isPurchased(book.id) && (
                                                <span className="bg-green-600 text-white px-2 py-1 rounded text-xs font-bold flex items-center gap-1">
                                                    <Download size={14} />
                                                    Owned
                                                </span>
                                            )}
                                        </div>
                                        {book.discount && (
                                            <span className="absolute top-3 left-3 bg-red-500 text-white px-2 py-1 rounded text-sm font-bold">
                                                {book.discount}
                                            </span>
                                        )}
                                    </div>
                                    <div className="p-4">
                                        <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2">
                                            {book.title}
                                        </h3>
                                        <p className="text-sm text-gray-600 mb-2">{book.author}</p>
                                        <p className="text-xs text-gray-500 mb-2">{book.pages} pages</p>
                                        <div className="flex items-center gap-2 mb-2">
                                            <div className="flex text-yellow-400 text-sm">
                                                {'★'.repeat(Math.floor(book.rating))}
                                                {'☆'.repeat(5 - Math.floor(book.rating))}
                                            </div>
                                            <span className="text-sm text-gray-600">({book.reviews})</span>
                                        </div>
                                        <div className="flex items-center gap-2 mb-3">
                                            <span className="text-xl font-bold text-gray-900">₦ {book.price.toLocaleString()}</span>
                                            {book.oldPrice && (
                                                <span className="text-sm text-gray-500 line-through">₦ {book.oldPrice.toLocaleString()}</span>
                                            )}
                                        </div>

                                        {isPurchased(book.id) ? (
                                            <button
                                                onClick={() => handleDownload(book)}
                                                className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                                            >
                                                <Download size={18} />
                                                Download PDF
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => handlePurchase(book)}
                                                className="w-full bg-blue-950 text-white py-2 rounded hover:bg-blue-900 transition-colors flex items-center justify-center gap-2"
                                            >
                                                <Lock size={18} />
                                                Purchase & Access
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="mt-12 flex items-center justify-center gap-2">
                                <button
                                    onClick={() => goToPage(currentPage - 1)}
                                    disabled={currentPage === 1}
                                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
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
                                                className={`px-4 py-2 rounded-lg ${
                                                    currentPage === page
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
                                        return <span key={page}>...</span>;
                                    }
                                    return null;
                                })}

                                <button
                                    onClick={() => goToPage(currentPage + 1)}
                                    disabled={currentPage === totalPages}
                                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Next
                                </button>
                            </div>
                        )}
                    </>
                )}
            </main>

            {/* Purchase Modal */}
            {showPurchaseModal && selectedBook && (
                <div className="fixed inset-0 bg-black/80 bg-opacity-50 flex items-center justify-center z-50 p-4">
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
                            <p className="text-2xl font-bold text-blue-950 mt-2">₦ {selectedBook.price.toLocaleString()}</p>
                        </div>

                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                            <div className="flex items-start gap-3">
                                <FileText className="w-5 h-5 text-blue-950 mt-1" />
                                <div className="text-sm text-blue-950">
                                    <p className="font-semibold mb-1">Instant PDF Access</p>
                                    <p>After payment, the PDF will be sent to: <strong>{auth.currentUser?.email || 'user@example.com'}</strong></p>
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
                                <li><Link href="/about" className="text-gray-300 hover:text-white">About Us</Link></li>
                                <li><Link href="/how-it-works" className="text-gray-300 hover:text-white">How It Works</Link></li>
                                <li><Link href="/faq" className="text-gray-300 hover:text-white">FAQs</Link></li>
                                <li><Link href="/contact" className="text-gray-300 hover:text-white">Contact</Link></li>
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
                                <li><Link href="/help" className="text-gray-300 hover:text-white">Help Center</Link></li>
                            </ul>
                        </div>
                    </div>
                    <div className="border-t border-blue-800 mt-8 pt-8 text-center text-sm text-gray-300">
                        <p>&copy; 2025 Learning Access Network. All rights reserved.</p>
                    </div>
                </div>
            </footer>
        </div>
    );
}