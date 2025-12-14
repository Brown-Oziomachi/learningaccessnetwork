"use client"
import React, { useState } from 'react';
import { Globe, Search, ShoppingCart, User, Menu, X, Heart, ChevronDown, Download, Lock, FileText } from 'lucide-react';
import Head from 'next/head';

<Head>
    <title>Learning Access Network - Digital Platform for Knowledge Access</title>
    <meta name="description" content="Learning Access Network is a digital platform designed to make knowledge easily accessible to everyone. Discover, read, and purchase books across various categories including education, personal development, business, technology, and more." />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
</Head>

export default function LearningAccessNetwork() {
    const [searchQuery, setSearchQuery] = useState('');
    const [showMobileMenu, setShowMobileMenu] = useState(false);
    const [selectedBook, setSelectedBook] = useState(null);
    const [showPurchaseModal, setShowPurchaseModal] = useState(false);

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

    const books = [
        {
            id: 1,
            title: 'The Art of Learning',
            author: 'Josh Waitzkin',
            price: '₦ 2,500',
            oldPrice: '₦ 5,000',
            discount: '-50%',
            rating: 4.5,
            reviews: 124,
            format: 'PDF',
            pages: 256,
            image: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400&h=500&fit=crop',
            isPurchased: false
        },
        {
            id: 2,
            title: 'Digital Marketing Mastery',
            author: 'Sarah Johnson',
            price: '₦ 3,200',
            oldPrice: '₦ 6,500',
            discount: '-51%',
            rating: 4.8,
            reviews: 89,
            format: 'PDF',
            pages: 342,
            image: 'https://images.unsplash.com/photo-1589998059171-988d887df646?w=400&h=500&fit=crop',
            isPurchased: false
        },
        {
            id: 3,
            title: 'Python Programming Guide',
            author: 'Michael Chen',
            price: '₦ 2,800',
            oldPrice: '₦ 5,500',
            discount: '-49%',
            rating: 4.7,
            reviews: 156,
            format: 'PDF',
            pages: 428,
            image: 'https://images.unsplash.com/photo-1516979187457-637abb4f9353?w=400&h=500&fit=crop',
            isPurchased: true
        },
        {
            id: 4,
            title: 'Business Strategy Essentials',
            author: 'David Miller',
            price: '₦ 3,500',
            oldPrice: '₦ 7,000',
            discount: '-50%',
            rating: 4.6,
            reviews: 92,
            format: 'PDF',
            pages: 385,
            image: 'https://images.unsplash.com/photo-1553729459-efe14ef6055d?w=400&h=500&fit=crop',
            isPurchased: false
        },
        {
            id: 5,
            title: 'Creative Writing Workshop',
            author: 'Emma Wilson',
            price: '₦ 2,200',
            oldPrice: '₦ 4,500',
            discount: '-51%',
            rating: 4.4,
            reviews: 78,
            format: 'PDF',
            pages: 298,
            image: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400&h=500&fit=crop',
            isPurchased: false
        },
        {
            id: 6,
            title: 'Data Science Fundamentals',
            author: 'Robert Lee',
            price: '₦ 4,000',
            oldPrice: '₦ 8,000',
            discount: '-50%',
            rating: 4.9,
            reviews: 203,
            format: 'PDF',
            pages: 512,
            image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=500&fit=crop',
            isPurchased: false
        }
    ];

    const handlePurchase = (book) => {
        setSelectedBook(book);
        setShowPurchaseModal(true);
    };

    const handleDownload = (book) => {
        // Simulate download - in real app, this would verify user email and download PDF
        alert(`Downloading ${book.title}...\nPDF will be sent to your registered email.`);
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

                        <div className="flex items-center gap-2">
                            <Globe className="w-8 h-8 text-white" />
                            <h1 className="text-xl md:text-2xl font-bold">
                                LEARNING <span className="text-blue-400">ACCESS</span>
                            </h1>
                        </div>

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
                            <button className="hidden md:flex items-center gap-2 hover:text-blue-400 transition-colors">
                                <User size={20} />
                                <span>Account</span>
                                <ChevronDown size={16} />
                            </button>
                            <button className="hidden md:flex items-center gap-2 hover:text-blue-400 transition-colors">
                                <Download size={20} />
                                <span>My Books</span>
                            </button>
                            <button className="relative hover:text-blue-400 transition-colors">
                                <ShoppingCart size={24} />
                                <span className="absolute -top-2 -right-2 bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                                    2
                                </span>
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
                        <div className="px-4 py-2 space-y-2">
                            <button className="flex items-center gap-2 py-2 w-full hover:text-blue-400">
                                <User size={20} />
                                <span>My Account</span>
                            </button>
                            <button className="flex items-center gap-2 py-2 w-full hover:text-blue-400">
                                <Download size={20} />
                                <span>My Books</span>
                            </button>
                        </div>
                    </div>
                )}
            </header>

            {/* Categories Bar */}
            <div className="bg-blue-900 text-white shadow-md">
                <div className="max-w-7xl mx-auto px-4 py-3">
                    <div className="flex gap-6 overflow-x-auto scrollbar-hide">
                        {categories.map((category, index) => (
                            <button
                                key={index}
                                className="whitespace-nowrap hover:text-blue-300 transition-colors text-sm"
                            >
                                {category}
                            </button>
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
                        <p className="text-gray-600 mt-1">(22,516 PDF books available)</p>
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

                <div className="mb-6 flex flex-wrap gap-2">
                    <span className="text-gray-700">Related results:</span>
                    <button className="text-blue-600 hover:text-blue-800 hover:underline">Education PDFs</button>
                    <span>|</span>
                    <button className="text-blue-600 hover:text-blue-800 hover:underline">Business PDFs</button>
                    <span>|</span>
                    <button className="text-blue-600 hover:text-blue-800 hover:underline">Technology PDFs</button>
                </div>

                {/* Filters and Products Grid */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {/* Filters Sidebar */}
                    <aside className="hidden md:block">
                        <div className="bg-white border border-gray-200 rounded-lg p-4">
                            <h3 className="font-bold text-lg mb-4 text-gray-900">CATEGORY</h3>
                            <div className="space-y-2">
                                {categories.map((category, index) => (
                                    <button
                                        key={index}
                                        className="block w-full text-left py-2 hover:text-blue-950 transition-colors text-gray-700"
                                    >
                                        {category}
                                    </button>
                                ))}
                            </div>

                            <div className="mt-6 pt-6 border-t border-gray-200">
                                <h3 className="font-bold text-lg mb-4 text-gray-900">PRICE (₦)</h3>
                                <div className="space-y-3">
                                    <input
                                        type="number"
                                        placeholder="Min"
                                        className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-blue-950"
                                    />
                                    <input
                                        type="number"
                                        placeholder="Max"
                                        className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-blue-950"
                                    />
                                    <button className="w-full bg-blue-950 text-white py-2 rounded hover:bg-blue-900 transition-colors">
                                        Apply
                                    </button>
                                </div>
                            </div>

                            <div className="mt-6 pt-6 border-t border-gray-200">
                                <h3 className="font-bold text-lg mb-4 text-gray-900">FORMAT</h3>
                                <label className="flex items-center gap-2">
                                    <input type="checkbox" checked readOnly className="w-4 h-4" />
                                    <span className="text-gray-700">PDF Only</span>
                                </label>
                            </div>
                        </div>
                    </aside>

                    {/* Products Grid */}
                    <div className="md:col-span-3">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {books.map((book) => (
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
                                            {book.isPurchased && (
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
                                            <span className="text-xl font-bold text-gray-900">{book.price}</span>
                                            {book.oldPrice && (
                                                <span className="text-sm text-gray-500 line-through">{book.oldPrice}</span>
                                            )}
                                        </div>

                                        {book.isPurchased ? (
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
                    </div>
                </div>
            </main>

            {/* Purchase Modal */}
            {showPurchaseModal && selectedBook && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
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
                            <p className="text-2xl font-bold text-blue-950 mt-2">{selectedBook.price}</p>
                        </div>

                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                            <div className="flex items-start gap-3">
                                <FileText className="w-5 h-5 text-blue-950 mt-1" />
                                <div className="text-sm text-blue-950">
                                    <p className="font-semibold mb-1">Instant PDF Access</p>
                                    <p>After payment, the PDF will be sent to your registered email: <strong>user@example.com</strong></p>
                                    <p className="mt-2">You can also download it from "My Books" section anytime.</p>
                                </div>
                            </div>
                        </div>

                        <button className="w-full bg-blue-950 text-white py-3 rounded-lg hover:bg-blue-900 transition-colors font-semibold">
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
                                <li><a href="#" className="text-gray-300 hover:text-white">About Us</a></li>
                                <li><a href="#" className="text-gray-300 hover:text-white">How It Works</a></li>
                                <li><a href="#" className="text-gray-300 hover:text-white">FAQs</a></li>
                                <li><a href="#" className="text-gray-300 hover:text-white">Contact</a></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-bold mb-4">Categories</h4>
                            <ul className="space-y-2 text-sm">
                                <li><a href="#" className="text-gray-300 hover:text-white">Education</a></li>
                                <li><a href="#" className="text-gray-300 hover:text-white">Business</a></li>
                                <li><a href="#" className="text-gray-300 hover:text-white">Technology</a></li>
                                <li><a href="#" className="text-gray-300 hover:text-white">Personal Development</a></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-bold mb-4">Customer Service</h4>
                            <ul className="space-y-2 text-sm">
                                <li><a href="#" className="text-gray-300 hover:text-white">My Account</a></li>
                                <li><a href="#" className="text-gray-300 hover:text-white">My Books</a></li>
                                <li><a href="#" className="text-gray-300 hover:text-white">Download Help</a></li>
                                <li><a href="#" className="text-gray-300 hover:text-white">Help Center</a></li>
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