// ===========================
// FILE: app/category/[slug]/page.jsx
// DYNAMIC CATEGORY PAGES
// ===========================

"use client"
import React, { useState, useEffect } from 'react';
import { Globe, Search, User, Menu, X, ChevronDown, Download, Lock, FileText, LogOut, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { signOut } from "firebase/auth";
import { auth, db } from "@/lib/firebaseConfig";
import { booksData } from "@/lib/booksData";
import { doc, getDoc } from 'firebase/firestore';

export default function CategoryPage() {
    const params = useParams();
    const router = useRouter();
    const categorySlug = params.slug;
    
    const [searchQuery, setSearchQuery] = useState('');
    const [showMobileMenu, setShowMobileMenu] = useState(false);
    const [selectedBook, setSelectedBook] = useState(null);
    const [showPurchaseModal, setShowPurchaseModal] = useState(false);
    const [purchasedBookIds, setPurchasedBookIds] = useState(new Set());
    const [sortBy, setSortBy] = useState('popularity');

    // Category mapping
    const categoryMap = {
        'education': 'Education',
        'personal-development': 'Personal Development',
        'business': 'Business',
        'technology': 'Technology',
        'science': 'Science',
        'literature': 'Literature',
        'health-wellness': 'Health & Wellness',
        'history': 'History',
        'arts-culture': 'Arts & Culture'
    };

    const categoryName = categoryMap[categorySlug] || 'Category';

    // Filter books by category
    const categoryBooks = booksData.filter(book => {
        const bookCategory = book.category?.toLowerCase().replace(/ & /g, '-').replace(/ /g, '-');
        return bookCategory === categorySlug;
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
            default: // popularity
                return sorted.sort((a, b) => b.reviews - a.reviews);
        }
    };

    const displayBooks = sortBooks(categoryBooks);

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

            {/* Categories Bar */}
            <div className="bg-blue-900 text-white shadow-md">
                <div className="max-w-7xl mx-auto px-4 py-3">
                    <div className="flex gap-6 overflow-x-auto scrollbar-hide">
                        {categories.map((category, index) => {
                            const slug = category.toLowerCase().replace(/ & /g, '-').replace(/ /g, '-');
                            const isActive = slug === categorySlug;
                            return (
                                <Link
                                    key={index}
                                    href={`/category/${slug}`}
                                    className={`whitespace-nowrap transition-colors text-sm ${
                                        isActive 
                                            ? 'text-blue-300 font-bold border-b-2 border-blue-300' 
                                            : 'hover:text-blue-300'
                                    }`}
                                >
                                    {category}
                                </Link>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Breadcrumb */}
            <div className="bg-gray-50 border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 py-3">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Link href="/home" className="hover:text-blue-600">Home</Link>
                        <span>&gt;</span>
                        <Link href="/pdf" className="hover:text-blue-600">All Books</Link>
                        <span>&gt;</span>
                        <span className="text-gray-900 font-semibold">{categoryName}</span>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 py-8">
                {/* Category Header */}
                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-3">
                        <button 
                            onClick={() => router.back()}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <ArrowLeft size={24} />
                        </button>
                        <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
                            {categoryName}
                        </h1>
                    </div>
                    <p className="text-gray-600 ml-14">
                        Explore {displayBooks.length} {displayBooks.length === 1 ? 'book' : 'books'} in {categoryName}
                    </p>
                </div>

                {/* Filters */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
                    <div className="flex items-center gap-2">
                        <span className="text-gray-700 text-sm">Showing {displayBooks.length} results</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-gray-700 text-sm">Sort by:</span>
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
                        </select>
                    </div>
                </div>

                {/* Books Grid */}
                {displayBooks.length === 0 ? (
                    <div className="bg-white rounded-lg shadow-lg p-12 text-center">
                        <FileText className="w-20 h-20 mx-auto mb-4 text-gray-400" />
                        <h3 className="text-2xl font-bold text-gray-900 mb-2">No Books Found</h3>
                        <p className="text-gray-600 mb-6">
                            We don't have any books in the {categoryName} category yet.
                        </p>
                        <Link
                            href="/pdf"
                            className="inline-block bg-blue-950 text-white px-6 py-3 rounded-lg hover:bg-blue-900 transition-colors"
                        >
                            Browse All Books
                        </Link>
                    </div>
                ) : (
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
                )}

                {/* Browse Other Categories */}
                <div className="mt-12 bg-blue-50 border border-blue-200 rounded-lg p-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-4">Browse Other Categories</h3>
                    <div className="flex flex-wrap gap-3">
                        {categories
                            .filter(cat => cat.toLowerCase().replace(/ & /g, '-').replace(/ /g, '-') !== categorySlug)
                            .map((category, index) => {
                                const slug = category.toLowerCase().replace(/ & /g, '-').replace(/ /g, '-');
                                return (
                                    <Link
                                        key={index}
                                        href={`/category/${slug}`}
                                        className="bg-white border border-blue-300 text-blue-950 px-4 py-2 rounded-lg hover:bg-blue-950 hover:text-white transition-colors text-sm font-semibold"
                                    >
                                        {category}
                                    </Link>
                                );
                            })}
                    </div>
                </div>
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
                            <h4 className="font-bold text-lg">{selectedBook.title}</h4>
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