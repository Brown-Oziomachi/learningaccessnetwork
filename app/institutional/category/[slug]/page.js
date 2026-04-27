"use client"
import React, { useState, useEffect } from 'react';
import {
    GraduationCap, BookOpen, School, FileQuestion, Building2, Book,
    Search, Star, Download, Eye, ChevronRight, Users, Award,
    TrendingUp, ArrowLeft, Globe, ShoppingBag
} from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { db, auth } from '@/lib/firebaseConfig';
import { collection, getDocs, query, where, doc, getDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import Navbar from '@/components/NavBar';
import Footer from '@/components/FooterComp';

export default function InstitutionalCategoryPage() {
    const params = useParams();
    const router = useRouter();
    const rawSlug = params?.slug;
    const slug = Array.isArray(rawSlug) ? rawSlug[0] : rawSlug;

    const [books, setBooks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);
    const [purchasedBookIds, setPurchasedBookIds] = useState(new Set());
    const [sortBy, setSortBy] = useState('newest');
    const [searchQuery, setSearchQuery] = useState('');
    const [visibleRows, setVisibleRows] = useState(5);
    const booksPerRow = 10;
    const rowsPerLoad = 2;

    // Institutional categories mapping
    const institutionalCategories = {
        'university': {
            name: 'Universities',
            icon: GraduationCap,
            description: 'Comprehensive academic resources for undergraduate and postgraduate studies',
        },
        'islamic-institutions': {
            name: 'Islamic Institutions',
            icon: Building2,
            description: 'Quranic studies, Islamic jurisprudence, and Islamic education resources',
        },
        'christian-institutions': {
            name: 'Christian Institutions',
            icon: Building2,
            description: 'Biblical studies, theology, and Christian education materials',
        },
        'jewish-institutions': {
            name: 'Jewish Institutions',
            icon: Building2,
            description: 'Torah studies, Jewish law, and Hebrew language resources',
        },
        'secondary-school': {
            name: 'Secondary School',
            icon: School,
            description: 'Complete curriculum materials for SS1, SS2, and SS3 students',
        },
        'primary-school': {
            name: 'Primary School',
            icon: BookOpen,
            description: 'Age-appropriate learning materials for primary 1 through primary 6',
        },
        'exam-prep': {
            name: 'WAEC/NECO/JAMB',
            icon: FileQuestion,
            description: 'Past questions, answers, and preparation materials for major examinations',
        },
        'polytechnic': {
            name: 'Polytechnics',
            icon: Building2,
            description: 'Technical and vocational education resources for ND and HND programs',
        },
        'college-of-education': {
            name: 'Colleges of Education',
            icon: Award,
            description: 'Teacher training and NCE program materials',
        },
        'professional-cert': {
            name: 'Professional Certifications',
            icon: Book,
            description: 'ICAN, ACCA, CFA, PMP, and other professional qualification materials',
        },
        'postgraduate': {
            name: 'Postgraduate Studies',
            icon: GraduationCap,
            description: 'Masters, PhD, and research materials across all disciplines',
        },
        'bible-college': {
            name: 'Bible Colleges',
            icon: Building2,
            description: 'Biblical theology, pastoral studies, and Christian ministry training resources',
        }
    };

    const currentCategory = institutionalCategories[slug] || institutionalCategories['university'];
    const IconComponent = currentCategory.icon;

    // Auth
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            if (currentUser) setUser(currentUser);
            else router.push('/auth/signin');
        });
        return () => unsubscribe();
    }, [router]);

    // Purchased books
    useEffect(() => {
        const fetchPurchasedBooks = async () => {
            try {
                const currentUser = auth.currentUser;
                if (!currentUser) return;
                const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
                if (userDoc.exists()) {
                    const purchasedBooks = userDoc.data().purchasedBooks || {};
                    let bookIds = [];
                    if (Array.isArray(purchasedBooks)) {
                        bookIds = purchasedBooks.map(b => b.id || b);
                    } else if (typeof purchasedBooks === 'object') {
                        bookIds = Object.keys(purchasedBooks);
                    }
                    setPurchasedBookIds(new Set(bookIds));
                }
            } catch (err) {
                console.error('Error fetching purchased books:', err);
            }
        };
        if (user) fetchPurchasedBooks();
    }, [user]);

    // Fetch books
    useEffect(() => {
        const fetchBooks = async () => {
            try {
                setLoading(true);
                const q = query(
                    collection(db, 'advertMyBook'),
                    where('status', '==', 'approved'),
                    where('institutionalCategory', '==', slug)
                );
                const snapshot = await getDocs(q);
                const fetched = [];
                snapshot.forEach((docSnap) => {
                    const data = docSnap.data();
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
                        driveFileId: data.driveFileId || null,
                        pdfUrl: data.pdfUrl || data.pdfLink || null,
                        embedUrl: data.embedUrl || null,
                        previewUrl: data.previewUrl || null,
                        isFromFirestore: true,
                        uploadedAt: data.uploadedAt || data.createdAt,
                    };
                    bookData.image = getThumbnailUrl(bookData);
                    bookData.timeAgo = getTimeAgo(bookData.uploadedAt);
                    fetched.push(bookData);
                });
                // Fetch sales counts — same pattern as BookPreviewPage
                const usersSnap = await getDocs(collection(db, 'users'));
                const salesMap = {};
                usersSnap.forEach((ud) => {
                    const purchased = ud.data().purchasedBooks || {};
                    Object.values(purchased).forEach((p) => {
                        const id = p.bookId || p.id || p.firestoreId;
                        if (id) {
                            salesMap[id] = (salesMap[id] || 0) + 1;
                            salesMap[`firestore-${id}`] = (salesMap[`firestore-${id}`] || 0) + 1;
                        }
                    });
                });
                fetched.forEach((b) => {
                    b.soldCount =
                        salesMap[b.id] ||
                        salesMap[b.firestoreId] ||
                        salesMap[b.id?.replace('firestore-', '')] ||
                        0;
                });
                setBooks(fetched);
            } catch (err) {
                console.error('Error fetching books:', err);
            } finally {
                setLoading(false);
            }
        };
        if (slug) fetchBooks();
    }, [slug]);

    // Thumbnail
    const getThumbnailUrl = (book) => {
        if (!book) return 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400';
        if (book.driveFileId)
            return `https://drive.google.com/thumbnail?id=${book.driveFileId}&sz=w400`;
        if (book.embedUrl) {
            const match = book.embedUrl.match(/\/d\/([\w-]{25,})|\/file\/d\/([\w-]{25,})|\/preview\/([\w-]{25,})/);
            if (match) {
                const fileId = match[1] || match[2] || match[3];
                return `https://drive.google.com/thumbnail?id=${fileId}&sz=w400`;
            }
        }
        if (book.pdfUrl) {
            const patterns = [
                /\/d\/([\w-]{25,})/,
                /\/file\/d\/([\w-]{25,})/,
                /id=([\w-]{25,})/,
                /\/open\?id=([\w-]{25,})/,
                /\/view\?id=([\w-]{25,})/,
            ];
            for (const pattern of patterns) {
                const match = book.pdfUrl.match(pattern);
                if (match && match[1])
                    return `https://drive.google.com/thumbnail?id=${match[1]}&sz=w400`;
            }
        }
        return book.image || book.coverImage || 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400';
    };

    // Time ago
    const getTimeAgo = (timestamp) => {
        if (!timestamp) return 'Recently';
        const now = new Date();
        const uploadDate = timestamp.seconds ? new Date(timestamp.seconds * 1000) : new Date(timestamp);
        const diff = Math.floor((now - uploadDate) / 1000);
        if (diff < 60) return 'Just now';
        if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
        if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
        if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
        if (diff < 2592000) return `${Math.floor(diff / 604800)}w ago`;
        return `${Math.floor(diff / 2592000)}mo ago`;
    };

    // Sort
    const sortBooks = (arr) => {
        const sorted = [...arr];
        switch (sortBy) {
            case 'price-low': return sorted.sort((a, b) => a.price - b.price);
            case 'price-high': return sorted.sort((a, b) => b.price - a.price);
            case 'rating': return sorted.sort((a, b) => b.rating - a.rating);
            case 'title': return sorted.sort((a, b) => a.title.localeCompare(b.title));
            case 'newest':
            default:
                return sorted.sort((a, b) => (b.uploadedAt?.seconds || 0) - (a.uploadedAt?.seconds || 0));
        }
    };

    // Filter + sort
    const filteredBooks = books.filter(book =>
        book.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        book.author?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        book.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );
    const displayBooks = sortBooks(filteredBooks);

    // Rows
    const totalRows = Math.ceil(displayBooks.length / booksPerRow);
    const hasMoreRows = visibleRows < totalRows;
    const bookRows = [];
    for (let i = 0; i < visibleRows; i++) {
        const start = i * booksPerRow;
        const end = Math.min(start + booksPerRow, displayBooks.length);
        if (start < displayBooks.length) bookRows.push(displayBooks.slice(start, end));
    }

    const handleLoadMore = () => {
        setVisibleRows(prev => Math.min(prev + rowsPerLoad, totalRows));
        setTimeout(() => window.scrollBy({ top: 400, behavior: 'smooth' }), 100);
    };

    // Reset rows on search/sort change
    useEffect(() => { setVisibleRows(5); }, [searchQuery, sortBy]);

    const isPurchased = (bookId) => purchasedBookIds.has(bookId);

    // Loading
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-950 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading {currentCategory.name} resources...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white">
            <Navbar />

            {/* Breadcrumb */}
            <div className="bg-gray-50 border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 py-3">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                        <button onClick={() => router.back()} className="hover:text-blue-600 transition-colors">
                            Institutional Library
                        </button>
                        <span>&gt;</span>
                        <span className="text-gray-900 font-semibold">{currentCategory.name}</span>
                    </div>
                </div>
            </div>

            <main className="max-w-7xl mx-auto px-4 py-8">
                {/* Page Header */}
                <div className="mb-6">
                    <div className="flex items-center gap-3 mb-2">
                        <IconComponent className="w-7 h-7 text-blue-950" />
                        <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
                            {currentCategory.name}
                        </h1>
                    </div>
                    <p className="text-gray-600 mb-1">{currentCategory.description}</p>
                    <p className="text-sm text-gray-500">
                        Browse {displayBooks.length} digital resource{displayBooks.length !== 1 ? 's' : ''} available for instant access
                    </p>
                </div>

                {/* Filters & Sort */}
                <div className="bg-neutral-50 border border-gray-200 rounded-lg p-4 mb-6">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        {/* Search */}
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder={`Search ${currentCategory.name}...`}
                                className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:border-blue-950 w-full md:w-72"
                            />
                        </div>

                        {/* Sort + count */}
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                            <span className="text-sm text-gray-600">
                                Showing {Math.min(visibleRows * booksPerRow, displayBooks.length)} of {displayBooks.length} result{displayBooks.length !== 1 ? 's' : ''}
                            </span>
                            <div className="flex items-center gap-2">
                                <label className="text-sm font-semibold text-gray-700">Sort:</label>
                                <select
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value)}
                                    className="border text-blue-950 border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-blue-950"
                                >
                                    <option value="newest">Newest First</option>
                                    <option value="price-low">Price: Low to High</option>
                                    <option value="price-high">Price: High to Low</option>
                                    <option value="rating">Highest Rated</option>
                                    <option value="title">Title (A-Z)</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Books or Empty State */}
                {displayBooks.length === 0 ? (
                    <div className="bg-white rounded-lg shadow-lg p-12 text-center">
                        <IconComponent className="w-20 h-20 mx-auto mb-4 text-gray-300" />
                        <h3 className="text-2xl font-bold text-gray-900 mb-2">
                            {searchQuery ? 'No Documents Found' : 'No Documents Yet'}
                        </h3>
                        <p className="text-gray-600 mb-6">
                            {searchQuery
                                ? 'Try adjusting your search terms'
                                : `Be the first to contribute to ${currentCategory.name}`}
                        </p>
                        {searchQuery ? (
                            <button
                                onClick={() => setSearchQuery('')}
                                className="bg-blue-950 text-white px-6 py-3 rounded-lg hover:bg-blue-900 transition-colors"
                            >
                                Clear Search
                            </button>
                        ) : (
                            <a
                                href="/upload-document"
                                className="inline-flex items-center gap-2 bg-blue-950 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                            >
                                <Download className="w-5 h-5" />
                                Upload Document
                            </a>
                        )}
                    </div>
                ) : (
                    <>
                        {/* Carousel Rows */}
                        <div className="space-y-8">
                            {bookRows.map((rowBooks, rowIndex) => (
                                <div key={rowIndex} className="px-4 lg:px-0">
                                    <div className="relative -mx-4 lg:mx-0">
                                        <div
                                            className="overflow-x-auto overflow-y-hidden px-4 lg:px-0"
                                            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                                        >
                                            <style jsx>{`
                                                div::-webkit-scrollbar { display: none; }
                                            `}</style>
                                            <div className="flex gap-4 lg:gap-5 pb-4">
                                                {rowBooks.map((book) => (
                                                    <a
                                                        key={book.id}
                                                        href={`/book/preview?id=${String(book.id).replace('firestore-', '')}`}
                                                        className="flex-none w-[160px] sm:w-[180px] lg:w-[200px] group"
                                                    >
                                                        {/* Cover */}
                                                        <div className="relative mb-3">
                                                            <img
                                                                src={book.image}
                                                                alt={book.title}
                                                                className="w-full h-[220px] sm:h-[260px] lg:h-[300px] object-cover group-hover:shadow-xl transition-shadow"
                                                                onError={(e) => {
                                                                    e.target.src = 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400';
                                                                }}
                                                                loading="lazy"
                                                            />
                                                            {/* Owned badge */}
                                                            {isPurchased(book.id) && (
                                                                <span className="absolute top-2 right-2 bg-green-600 text-white px-2 py-1 rounded text-xs font-bold">
                                                                    Owned
                                                                </span>
                                                            )}
                                                            {/* Format badge */}
                                                            <span className="absolute top-2 left-2 bg-gray-800 text-white px-2 py-1 rounded text-[10px] font-bold">
                                                                {book.format || 'PDF'}
                                                            </span>
                                                        </div>

                                                        {/* Info */}
                                                        <div>
                                                            <h4 className="font-bold text-sm lg:text-base text-gray-900 mb-1 line-clamp-2 group-hover:text-blue-600 transition-colors leading-snug">
                                                                {book.title}
                                                            </h4>
                                                            <p className="text-gray-600 text-xs lg:text-sm mb-1 truncate">
                                                                {book.author}
                                                            </p>
                                                            <div className="flex items-center justify-between mt-1">
                                                               
                                                            <p className="text-gray-500 text-xs flex items-center gap-1 mt-0.5">
                                                                <ShoppingBag size={11} />
                                                                {book.soldCount || 0} sold
                                                            </p>                                                        </div>
                                                            </div>
                                                    </a>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Load More */}
                        {hasMoreRows && (
                            <div className="mt-12 flex justify-center">
                                <button
                                    onClick={handleLoadMore}
                                    className="bg-blue-950 text-white px-8 py-4 rounded-lg hover:bg-blue-900 transition-colors flex items-center gap-2 font-semibold text-lg shadow-lg hover:shadow-xl"
                                >
                                    Load {Math.min(rowsPerLoad * booksPerRow, displayBooks.length - visibleRows * booksPerRow)} more
                                </button>
                            </div>
                        )}

                        {!hasMoreRows && displayBooks.length > booksPerRow && (
                            <div className="mt-12 text-center">
                                <p className="text-gray-600 text-lg">
                                    All {displayBooks.length} resources displayed.
                                </p>
                            </div>
                        )}

                        {/* Browse Other Categories */}
                        <div className="mt-16 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-8">
                            <h3 className="text-2xl font-bold text-gray-900 mb-6">
                                Explore Other Institutions
                            </h3>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {Object.entries(institutionalCategories)
                                    .filter(([key]) => key !== slug)
                                    .map(([key, cat]) => {
                                        const Icon = cat.icon;
                                        return (
                                            <a
                                                key={key}
                                                href={`/institutional/category/${key}`}
                                                className="bg-white rounded-xl p-4 hover:shadow-lg transition-all duration-300 group"
                                            >
                                                <Icon className="w-8 h-8 text-gray-400 group-hover:text-blue-950 transition-colors mb-2" />
                                                <h4 className="font-bold text-sm text-gray-900 group-hover:text-blue-950 transition-colors">
                                                    {cat.name}
                                                </h4>
                                            </a>
                                        );
                                    })}
                            </div>
                        </div>
                    </>
                )}
            </main>

            <Footer />
        </div>
    );
}