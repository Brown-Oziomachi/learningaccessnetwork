"use client"
import React, { useState, useEffect } from 'react';
import { Calendar, TrendingUp, Star, Eye, Download, Filter, Search, Clock, ArrowLeft, Sparkles, BookOpen, Users, Flame } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { db, auth } from '@/lib/firebaseConfig';
import { collection, query, where, getDocs, orderBy, limit, Timestamp } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import Navbar from '@/components/NavBar';

export default function LatestDocsClient() {
    const router = useRouter();
    const [books, setBooks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);
    const [filterBy, setFilterBy] = useState('all'); // all, this-month, this-week, today
    const [sortBy, setSortBy] = useState('newest');
    const [searchQuery, setSearchQuery] = useState('');
    const [stats, setStats] = useState({
        totalBooks: 0,
        thisMonth: 0,
        thisWeek: 0,
        today: 0,
    });

    // Get thumbnail URL
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

        return book.image || book.coverImage || 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400';
    };

    // Auth state
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            if (currentUser) {
                setUser(currentUser);
            } else {
                router.push('/auth/signin');
            }
        });
        return () => unsubscribe();
    }, [router]);

    // Fetch 2026 books
    useEffect(() => {
        const fetch2026Books = async () => {
            try {
                setLoading(true);

                // Create date range for 2026
                const startOf2026 = Timestamp.fromDate(new Date('2026-01-01T00:00:00'));
                const endOf2026 = Timestamp.fromDate(new Date('2026-12-31T23:59:59'));

                console.log(' Fetching 2026 books between:', {
                    start: startOf2026.toDate(),
                    end: endOf2026.toDate()
                });

                // Query books from 2026
                const q = query(
                    collection(db, 'advertMyBook'),
                    where('status', '==', 'approved'),
                    where('createdAt', '>=', startOf2026),
                    where('createdAt', '<=', endOf2026),
                    orderBy('createdAt', 'desc'),
                    limit(100)
                );

                const querySnapshot = await getDocs(q);
                const fetchedBooks = [];

                // Calculate time-based stats
                const now = new Date();
                const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
                const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
                const startOfDay = new Date(now.setHours(0, 0, 0, 0));

                let monthCount = 0;
                let weekCount = 0;
                let dayCount = 0;

                querySnapshot.forEach((docSnap) => {
                    const data = docSnap.data();
                    const createdAt = data.createdAt?.toDate() || new Date();

                    // Count by time period
                    if (createdAt >= startOfMonth) monthCount++;
                    if (createdAt >= startOfWeek) weekCount++;
                    if (createdAt >= startOfDay) dayCount++;

                    const bookData = {
                        id: `firestore-${docSnap.id}`,
                        firestoreId: docSnap.id,
                        title: data.bookTitle,
                        author: data.author,
                        category: data.category,
                        institutionalCategory: data.institutionalCategory,
                        price: data.price,
                        pages: data.pages,
                        format: data.format || 'PDF',
                        description: data.description,
                        rating: 4.5,
                        views: data.views || 0,
                        purchases: data.purchases || 0,
                        driveFileId: data.driveFileId,
                        pdfUrl: data.pdfUrl,
                        embedUrl: data.embedUrl,
                        createdAt: createdAt,
                        uploadedAt: data.uploadedAt || data.createdAt,
                        isNew: (now - createdAt) < (7 * 24 * 60 * 60 * 1000) // Less than 7 days
                    };

                    bookData.image = getThumbnailUrl(bookData);
                    fetchedBooks.push(bookData);
                });

                setStats({
                    totalBooks: fetchedBooks.length,
                    thisMonth: monthCount,
                    thisWeek: weekCount,
                    today: dayCount
                });

                console.log('Found', fetchedBooks.length, '2026 books');
                setBooks(fetchedBooks);
            } catch (error) {
                console.error(' Error fetching 2026 books:', error);
            } finally {
                setLoading(false);
            }
        };

        fetch2026Books();
    }, []);

    // Filter books by time period
    const filterBooks = (booksArray) => {
        const now = new Date();

        switch (filterBy) {
            case 'today': {
                const startOfDay = new Date(now.setHours(0, 0, 0, 0));
                return booksArray.filter(book => book.createdAt >= startOfDay);
            }
            case 'this-week': {
                const startOfWeek = new Date(now);
                startOfWeek.setDate(now.getDate() - now.getDay());
                return booksArray.filter(book => book.createdAt >= startOfWeek);
            }
            case 'this-month': {
                const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
                return booksArray.filter(book => book.createdAt >= startOfMonth);
            }
            default:
                return booksArray;
        }
    };

    // Search books
    const searchBooks = (booksArray) => {
        if (!searchQuery) return booksArray;
        const query = searchQuery.toLowerCase();
        return booksArray.filter(book =>
            book.title.toLowerCase().includes(query) ||
            book.author.toLowerCase().includes(query) ||
            book.category?.toLowerCase().includes(query)
        );
    };

    // Sort books
    const sortBooks = (booksArray) => {
        const sorted = [...booksArray];
        switch (sortBy) {
            case 'popular':
                return sorted.sort((a, b) => (b.views + b.purchases * 10) - (a.views + a.purchases * 10));
            case 'price-low':
                return sorted.sort((a, b) => a.price - b.price);
            case 'price-high':
                return sorted.sort((a, b) => b.price - a.price);
            case 'title':
                return sorted.sort((a, b) => a.title.localeCompare(b.title));
            case 'newest':
            default:
                return sorted.sort((a, b) => b.createdAt - a.createdAt);
        }
    };

    const displayBooks = sortBooks(searchBooks(filterBooks(books)));

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600 font-medium">Loading Recently Published...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-neutral-50">
            {/* Hero Section */}
            <Navbar />
            <div className="relative text-blue-950 overflow-hidden">

                <div className="relative max-w-7xl mx-auto px-4 py-16">
                    {/* Back Button */}
                    <button
                        onClick={() => router.back()}
                        className="flex items-center gap-2 hover:text-white mb-6 transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        <span>Back</span>
                    </button>

                    {/* Header */}
                    <div className="text-center mb-12">
                        <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full mb-6">
                            <Sparkles className="w-5 h-5 text-yellow-300" />
                            <span className="font-semibold">Fresh & New</span>
                        </div>

                        <h1 className="text-5xl md:text-7xl font-black mb-4">
                            Recently Published...
                        </h1>
                        <p className="text-xl md:text-2xl max-w-3xl mx-auto">
                            Discover the newest additions to our library. Stay updated with fresh content!
                        </p>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
                        <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 text-center transform hover:scale-105 transition-all">
                            <Calendar className="w-8 h-8 mx-auto mb-2 text-yellow-300" />
                            <div className="text-3xl font-bold">{stats.totalBooks}</div>
                            <div className="text-sm ">All 2026</div>
                        </div>
                        <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 text-center transform hover:scale-105 transition-all">
                            <Flame className="w-8 h-8 mx-auto mb-2 text-orange-300" />
                            <div className="text-3xl font-bold">{stats.thisMonth}</div>
                            <div className="text-sm ">This Month</div>
                        </div>
                        <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 text-center transform hover:scale-105 transition-all">
                            <TrendingUp className="w-8 h-8 mx-auto mb-2 text-green-300" />
                            <div className="text-3xl font-bold">{stats.thisWeek}</div>
                            <div className="text-sm">This Week</div>
                        </div>
                        <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 text-center transform hover:scale-105 transition-all">
                            <Clock className="w-8 h-8 mx-auto mb-2 text-blue-300" />
                            <div className="text-3xl font-bold">{stats.today}</div>
                            <div className="text-sm">Today</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 py-12">
                {/* Search & Filters */}
                <div className="mb-8 space-y-4">
                    {/* Search Bar */}
                    <div className="relative max-w-2xl mx-auto">
                        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Search by title, author, or category..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-12 pr-4 py-4 rounded-xl border-2 border-gray-200 focus:border-purple-500 focus:outline-none shadow-lg"
                        />
                    </div>

                    {/* Filter Buttons & Sort */}
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        {/* Time Period Filters */}
                        <div className="flex flex-wrap gap-2">
                            {[
                                { value: 'all', label: 'All 2026', icon: Calendar },
                                { value: 'this-month', label: 'This Month', icon: Flame },
                                { value: 'this-week', label: 'This Week', icon: TrendingUp },
                                { value: 'today', label: 'Today', icon: Clock }
                            ].map(({ value, label, icon: Icon }) => (
                                <button
                                    key={value}
                                    onClick={() => setFilterBy(value)}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all ${filterBy === value
                                        ? 'bg-blue-950 text-white shadow-lg'
                                        : 'bg-white text-gray-700 hover:bg-gray-100'
                                        }`}
                                >
                                    <Icon className="w-4 h-4" />
                                    {label}
                                </button>
                            ))}
                        </div>

                        {/* Sort Dropdown */}
                        <div className="flex items-center gap-2">
                            <Filter className="w-4 h-4 text-gray-600" />
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                className="border-2 border-gray-200 rounded-lg px-4 py-2 focus:border-purple-500 focus:outline-none"
                            >
                                <option value="newest">Newest First</option>
                                <option value="popular">Most Popular</option>
                                <option value="price-low">Price: Low to High</option>
                                <option value="price-high">Price: High to Low</option>
                                <option value="title">Title (A-Z)</option>
                            </select>
                        </div>
                    </div>

                    {/* Results Count */}
                    <div className="text-center">
                        <p className="text-gray-600 font-medium">
                            Showing <span className="text-blue-950 font-bold">{displayBooks.length}</span> books
                        </p>
                    </div>
                </div>

                {/* Books Grid */}
                {displayBooks.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                        {displayBooks.map((book) => (
                            <a
                                key={book.id}
                                href={`/book/preview?id=${book.id}`}
                                className="group bg-white rounded-xl shadow-md hover:shadow-2xl transition-all duration-300 overflow-hidden transform hover:-translate-y-2"
                            >
                                <div className="relative">
                                    <img
                                        src={book.image}
                                        alt={book.title}
                                        className="w-full h-64 object-cover bg-gray-200 group-hover:scale-105 transition-transform duration-500"
                                        onError={(e) => {
                                            e.target.src = 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400';
                                        }}
                                        loading="lazy"
                                    />

                                    {/* Badges */}
                                    <div className="absolute top-2 left-2 right-2 flex flex-wrap gap-1">
                                        {book.isNew && (
                                            <span className="bg-gradient-to-r from-pink-500 to-purple-500 text-white px-2 py-1 rounded-md text-xs font-bold shadow-lg flex items-center gap-1">
                                                <Sparkles className="w-3 h-3" />
                                                NEW
                                            </span>
                                        )}
                                        {book.institutionalCategory && (
                                            <span className="bg-blue-600 text-white px-2 py-1 rounded-md text-xs font-bold shadow-lg">
                                                {book.institutionalCategory.toUpperCase()}
                                            </span>
                                        )}
                                    </div>

                                    {/* Hover Overlay */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/0 to-black/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                                        <div className="flex items-center gap-3 text-white text-xs w-full">
                                            <div className="flex items-center gap-1">
                                                <Eye className="w-3 h-3" />
                                                {book.views}
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Download className="w-3 h-3" />
                                                {book.purchases}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-4">
                                    <h3 className="font-bold text-sm text-gray-900 mb-2 line-clamp-2 group-hover:text-purple-600 transition-colors min-h-[40px]">
                                        {book.title}
                                    </h3>
                                    <p className="text-gray-600 text-xs mb-2">by {book.author}</p>

                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-purple-600 font-bold text-lg">
                                            ₦{book.price?.toLocaleString()}
                                        </span>
                                        <div className="flex items-center gap-1">
                                            <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                                            <span className="text-xs text-gray-600">{book.rating}</span>
                                        </div>
                                    </div>

                                    {book.category && (
                                        <span className="inline-block bg-purple-100 text-purple-700 text-xs px-2 py-1 rounded-full">
                                            {book.category}
                                        </span>
                                    )}
                                </div>
                            </a>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20 bg-white rounded-2xl shadow-lg">
                        <BookOpen className="w-20 h-20 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-2xl font-bold text-gray-900 mb-2">
                            No Books Found
                        </h3>
                        <p className="text-gray-600 mb-6">
                            {searchQuery
                                ? `No results for "${searchQuery}"`
                                : 'No books available for the selected time period'}
                        </p>
                        <button
                            onClick={() => {
                                setFilterBy('all');
                                setSearchQuery('');
                            }}
                            className="bg-blue-950 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-900 transition-colors"
                        >
                            Clear Filters
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}