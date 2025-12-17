// ===========================
// FILE: app/page.jsx (HomePage)
// UPDATED WITH AMAZON-LIKE CAROUSEL LAYOUT
// ===========================

"use client"
import React, { useState, useEffect } from 'react';
import { Globe, Search, User, Menu, X, ChevronDown, Download, Lock, FileText, LogOut, AlignEndVertical } from 'lucide-react';
import Link from 'next/link';
import { signOut } from "firebase/auth";
import { auth, db } from "@/lib/firebaseConfig";
import { useRouter } from "next/navigation";
import { booksData } from "@/lib/booksData";
import { doc, getDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

export default function HomePage() {
    const [showMobileMenu, setShowMobileMenu] = useState(false);
    const [selectedBook, setSelectedBook] = useState(null);
    const [showPurchaseModal, setShowPurchaseModal] = useState(false);
    const [purchasedBookIds, setPurchasedBookIds] = useState(new Set());
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [showMobileSearch, setShowMobileSearch] = useState(false);
    const router = useRouter();

    // Get first 25 books for home page
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

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (currentUser) {
                setUser(currentUser);
            } else {
                router.push('/auth/signin');
            }
            setTimeout(() => {
                setLoading(false);
            }, 2000);
        });

        return () => unsubscribe();
    }, [router]);


    // inside your Header component

    const handleSearch = () => {
        if (searchQuery.trim()) {
            router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
            setShowMobileSearch(false); // hide mobile dropdown if open
        }
    };

    // Fetch purchased books from Firebase on mount
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
                    } else {
                        // Fallback to localStorage
                        const localPurchased = JSON.parse(localStorage.getItem(`purchased_${user.email}`) || '[]');
                        const bookIds = new Set(localPurchased.map(book => book.id));
                        setPurchasedBookIds(bookIds);
                    }
                }
            } catch (error) {
                console.error('Error fetching purchased books:', error);
                // Fallback to localStorage
                const userEmail = auth.currentUser?.email;
                if (userEmail) {
                    const localPurchased = JSON.parse(localStorage.getItem(`purchased_${userEmail}`) || '[]');
                    const bookIds = new Set(localPurchased.map(book => book.id));
                    setPurchasedBookIds(bookIds);
                }
            }
        };

        fetchPurchasedBooks();
    }, []);

    const handleLogout = async () => {
        try {
            await signOut(auth);
            router.push("/");
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


    if (loading || !user) {
        return (
            <div className="min-h-screen bg-blue-950 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-50 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading Learning Access Network...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white">
            {/* Header */}
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
                        <a href="/home" className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
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

            {/* Info Banner */}
            <div className="bg-blue-50 border-b border-blue-100">
                <div className="max-w-7xl mx-auto px-4 py-4">
                    <div className="flex items-center gap-3 text-blue-950">
                        <FileText className="w-6 h-6" />
                        <p className="text-sm md:text-base">
                            <strong>Access PDFs Instantly!</strong> Purchase books and get instant access to downloadable PDFs sent to your registered email.
                        </p>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 py-8">
                <div className="text-sm text-gray-600 mb-6">
                    Home &gt; All PDF Books
                </div>

                <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
                    <div>
                        <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
                            Digital PDF Library
                        </h2>
                        <p className="text-gray-600 mt-1">
                            (Showing {displayBooks.length} of {booksData.length} PDF books - <Link href="/pdf" className="text-blue-600 hover:underline">View All</Link>)
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-gray-700">Sort by:</span>
                        <select className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-950">
                            <option>Popularity</option>
                            <option>Price: Low to High</option>
                            <option>Price: High to Low</option>
                            <option>Newest First</option>
                            <option>Rating</option>
                        </select>
                    </div>
                </div>

                <div className="mb-6 flex flex-wrap gap-2 items-center">
                    <span className="text-gray-700">Quick links:</span>
                    <Link href="/category/education" className="text-blue-600 hover:text-blue-800 hover:underline">Education</Link>
                    <span>|</span>
                    <Link href="/category/business" className="text-blue-600 hover:text-blue-800 hover:underline">Business</Link>
                    <span>|</span>
                    <Link href="/category/technology" className="text-blue-600 hover:text-blue-800 hover:underline">Technology</Link>
                    <span>|</span>
                    <Link href="/pdf" className="text-blue-600 hover:text-blue-800 hover:underline font-semibold">
                        All Books →
                    </Link>
                </div>

                {/* Books Grid - First 8 books */}
           <div
            className="
                flex gap-1 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide
                sm:gap-6
                lg:grid lg:grid-cols-3 xl:grid-cols-4
                lg:overflow-x-visible lg:snap-none
                mb-12
            "
  style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
>
  {displayBooks.slice(0, 6).map((book) => (
    <div
      key={book.id}
      className="
        flex-none snap-start
        w-[160px] sm:w-[180px] lg:w-auto
        bg-white border border-gray-200 rounded-lg
        overflow-hidden hover:shadow-lg transition-shadow
      "
    >
      <div className="relative">
        <img
          src={book.image}
          alt={book.title}
          className="w-full h-50 object-cover"
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

        <div className="flex items-center gap-2 mb-2">
          <div className="flex text-yellow-400 text-sm">
            {"★".repeat(Math.floor(book.rating))}
            {"☆".repeat(5 - Math.floor(book.rating))}
          </div>
        </div>

        <div className="flex items-center gap-2 mb-3">
          <span className="text-xl font-bold text-gray-900">
            ₦ {book.price.toLocaleString()}
          </span>
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
            Purchase
          </button>
        )}
      </div>
    </div>
  ))}
 </div>

                {/* Carousel Section 1 - Featured Categories */}
                <div className="mb-12 bg-gray-50 -mx-4 px-1 py-8">
                    <h3 className="text-2xl font-bold text-gray-900 mb-4">Related to Your Interests</h3>
                    <div className="overflow-x-auto scrollbar-hide">
                        <div className="flex gap-4 pb-4">
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
                </div>

                {/* Books Grid - Middle section */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-12">
                    {displayBooks.slice(14, 20).map((book) => (
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

                {/* Carousel Section 2 - Popular Picks */}
                <div className="mb-12 bg-gray-50 -mx-4 px-4 py-8">
                    <h3 className="text-2xl font-bold text-gray-900 mb-4">Popular Right Now</h3>
                    <div className="overflow-x-auto scrollbar-hide">
                        <div className="flex gap-4 pb-4">
                            {displayBooks.slice(20, 27).map((book) => (
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

                {/* View All Books Button */}
                <div className="text-center mt-12">
                    <Link
                        href="/pdf"
                        className="inline-flex items-center gap-2 bg-blue-950 text-white px-8 py-4 rounded-lg hover:bg-blue-900 transition-colors text-lg font-semibold shadow-lg"
                    >
                        <FileText size={24} />
                        View All {booksData.length} Books in Library
                    </Link>
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
                            <h4 className="font-bold text-lg text-blue-950">{selectedBook.title}</h4>
                            <p className="text-gray-600">{selectedBook.author}</p>
                            <div className="flex gap-2 items-center">
                            <p className="text-2xl font-bold text-blue-950">₦ {selectedBook.price.toLocaleString()}</p>
                             {selectedBook.oldPrice && (
                                        <span className="text-sm text-gray-500 line-through">₦ {selectedBook.oldPrice.toLocaleString()}</span>
                                    )}
                            </div>
                                <p className="text-xs text-gray-500 mb-2">{selectedBook.pages} pages</p>
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