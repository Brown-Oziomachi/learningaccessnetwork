"use client"
import React, { useState, useEffect } from 'react';
import { GraduationCap, BookOpen, School, FileQuestion, Building2, Book, Search, Star, Download, Eye, ChevronRight, Users, Award, TrendingUp, ArrowLeft, Globe } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { db, auth } from '@/lib/firebaseConfig';
import { collection, getDocs, query, where, doc, getDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import Navbar from '@/components/NavBar';
import Footer from '@/components/FooterComp';

export default function InstitutionalCategoryPage() {
    const params = useParams();
    const router = useRouter()
    const rawSlug = params?.slug;
    const slug = Array.isArray(rawSlug) ? rawSlug[0] : rawSlug;

    const [books, setBooks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);
    const [purchasedBookIds, setPurchasedBookIds] = useState(new Set());
    const [sortBy, setSortBy] = useState('newest');

    // Institutional categories mapping
    const institutionalCategories = {
        'university': {
            name: 'Universities',
            icon: GraduationCap,
            description: 'Comprehensive academic resources for undergraduate and postgraduate studies',
            image: 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=800'
        },
        'islamic-institutions': {
            name: 'Islamic Institutions',
            icon: Building2,
            description: 'Quranic studies, Islamic jurisprudence, and Islamic education resources',
            image: 'https://images.unsplash.com/photo-1506157786151-b8491531f063?w=800'
        },
        'christian-institutions': {
            name: 'Christian Institutions',
            icon: Building2,
            description: 'Biblical studies, theology, and Christian education materials',
            image: 'https://images.unsplash.com/photo-1548877528-b34d3fb135cd?w=800'
        },
        'jewish-institutions': {
            name: 'Jewish Institutions',
            icon: Building2,
            description: 'Torah studies, Jewish law, and Hebrew language resources',
            image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800'
        },
        'secondary-school': {
            name: 'Secondary School',
            icon: School,
            description: 'Complete curriculum materials for SS1, SS2, and SS3 students',
            image: 'https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?w=800'
        },
        'primary-school': {
            name: 'Primary School',
            icon: BookOpen,
            description: 'Age-appropriate learning materials for primary 1 through primary 6',
            image: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800'
        },
        'exam-prep': {
            name: 'WAEC/NECO/JAMB',
            icon: FileQuestion,
            description: 'Past questions, answers, and preparation materials for major examinations',
            image: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800'
        },
        'polytechnic': {
            name: 'Polytechnics',
            icon: Building2,
            description: 'Technical and vocational education resources for ND and HND programs',
            image: 'https://images.unsplash.com/photo-1562774053-701939374585?w=800'
        },
        'college-of-education': {
            name: 'Colleges of Education',
            icon: Award,
            description: 'Teacher training and NCE program materials',
            image: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=800'
        },
        'professional-cert': {
            name: 'Professional Certifications',
            icon: Book,
            description: 'ICAN, ACCA, CFA, PMP, and other professional qualification materials',
            image: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=800'
        },
        'postgraduate': {
            name: 'Postgraduate Studies',
            icon: GraduationCap,
            description: 'Masters, PhD, and research materials across all disciplines',
            image: 'https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=800'
        }
    };

    const currentCategory = institutionalCategories[slug] || institutionalCategories['university'];
    const IconComponent = currentCategory.icon;

    // Auth state listener
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

    // Fetch purchased books
    useEffect(() => {
        const fetchPurchasedBooks = async () => {
            try {
                const currentUser = auth.currentUser;
                if (currentUser) {
                    const userDocRef = doc(db, 'users', currentUser.uid);
                    const userDoc = await getDoc(userDocRef);

                    if (userDoc.exists()) {
                        const userData = userDoc.data();
                        const purchasedBooks = userData.purchasedBooks || {};

                        let bookIds = [];
                        if (Array.isArray(purchasedBooks)) {
                            bookIds = purchasedBooks.map(book => book.id || book);
                        } else if (typeof purchasedBooks === 'object') {
                            bookIds = Object.keys(purchasedBooks);
                        }

                        setPurchasedBookIds(new Set(bookIds));
                    }
                }
            } catch (error) {
                console.error('Error fetching purchased books:', error);
            }
        };

        if (user) {
            fetchPurchasedBooks();
        }
    }, [user]);

    // Fetch books from Firebase
    // In your InstitutionalCategoryPage component
    // Replace the fetchBooks useEffect with this:

    useEffect(() => {
        const fetchBooks = async () => {
            try {
                setLoading(true);

                // Query books where institutionalCategory matches the current slug
                const q = query(
                    collection(db, 'advertMyBook'),
                    where('status', '==', 'approved'),
                    where('institutionalCategory', '==', slug)
                );

                const querySnapshot = await getDocs(q);
                const fetchedBooks = [];

                querySnapshot.forEach((docSnap) => {
                    const data = docSnap.data();

                    console.log('🔥 Firestore book:', data.bookTitle, {
                        institutionalCategory: data.institutionalCategory,
                        driveFileId: data.driveFileId,
                        embedUrl: data.embedUrl,
                        pdfUrl: data.pdfUrl,
                        pdfLink: data.pdfLink
                    });

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
                        reviews: 0,
                        // ✅ EXTRACT ALL POSSIBLE FIELDS
                        driveFileId: data.driveFileId || null,
                        pdfUrl: data.pdfUrl || data.pdfLink || null,
                        embedUrl: data.embedUrl || null,
                        previewUrl: data.previewUrl || null,
                        isFromFirestore: true,
                        uploadedAt: data.uploadedAt || data.createdAt
                    };

                    // ✅ Get thumbnail from PDF
                    bookData.image = getThumbnailUrl(bookData);

                    console.log('✅ Final book data:', {
                        title: bookData.title,
                        driveFileId: bookData.driveFileId,
                        embedUrl: bookData.embedUrl,
                        thumbnail: bookData.image
                    });

                    fetchedBooks.push(bookData);
                });

                console.log(`✅ Found ${fetchedBooks.length} books for ${currentCategory.name}`);
                setBooks(fetchedBooks);
            } catch (error) {
                console.error('❌ Error fetching books:', error);
            } finally {
                setLoading(false);
            }
        };

        if (slug) {
            fetchBooks();
        }
    }, [slug]);

    // ✅ IMPROVED getThumbnailUrl function
    const getThumbnailUrl = (book) => {
        if (!book) return 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400';

        console.log('🔍 Getting thumbnail for:', book.title, {
            driveFileId: book.driveFileId,
            embedUrl: book.embedUrl,
            pdfUrl: book.pdfUrl
        });

        // PRIORITY 1: Direct driveFileId (from advertise form)
        if (book.driveFileId) {
            const thumbnail = `https://drive.google.com/thumbnail?id=${book.driveFileId}&sz=w400`;
            console.log('✅ Using driveFileId:', thumbnail);
            return thumbnail;
        }

        // PRIORITY 2: Extract from embedUrl
        if (book.embedUrl) {
            const match = book.embedUrl.match(/\/d\/([\w-]{25,})|\/file\/d\/([\w-]{25,})|\/preview\/([\w-]{25,})/);
            if (match) {
                const fileId = match[1] || match[2] || match[3];
                const thumbnail = `https://drive.google.com/thumbnail?id=${fileId}&sz=w400`;
                console.log('✅ Extracted from embedUrl:', thumbnail);
                return thumbnail;
            }
        }

        // PRIORITY 3: Extract from pdfUrl
        if (book.pdfUrl) {
            // Try multiple Google Drive URL patterns
            const patterns = [
                /\/d\/([\w-]{25,})/,
                /\/file\/d\/([\w-]{25,})/,
                /id=([\w-]{25,})/,
                /\/open\?id=([\w-]{25,})/,
                /\/view\?id=([\w-]{25,})/
            ];

            for (const pattern of patterns) {
                const match = book.pdfUrl.match(pattern);
                if (match && match[1]) {
                    const thumbnail = `https://drive.google.com/thumbnail?id=${match[1]}&sz=w400`;
                    console.log('✅ Extracted from pdfUrl:', thumbnail);
                    return thumbnail;
                }
            }
        }

        // FALLBACK
        console.log('⚠️ No PDF thumbnail found, using fallback');
        return book.image || book.coverImage || 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400';
    };

    // Sort books
    const sortBooks = (booksArray) => {
        const sorted = [...booksArray];
        switch (sortBy) {
            case 'price-low':
                return sorted.sort((a, b) => a.price - b.price);
            case 'price-high':
                return sorted.sort((a, b) => b.price - b.price);
            case 'rating':
                return sorted.sort((a, b) => b.rating - a.rating);
            case 'title':
                return sorted.sort((a, b) => a.title.localeCompare(b.title));
            case 'newest':
            default:
                return sorted.sort((a, b) => {
                    const timeA = a.uploadedAt?.seconds || 0;
                    const timeB = b.uploadedAt?.seconds || 0;
                    return timeB - timeA;
                });
        }
    };

    const displayBooks = sortBooks(books);
    const isPurchased = (bookId) => purchasedBookIds.has(bookId);

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
        <div className="min-h-screen ">
            {/* Hero Section */}
            <Navbar />
            <div className={`relative  text-blue-950 text-center overflow-hidden`}>
              
                <div className="relative max-w-7xl mx-auto px-4 py-16">
                    {/* Back Button */}
                    <button
                        onClick={() => router.back()}
                        className="flex items-center gap-2 text-blue-95 hover:text-white mb-6 transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        <span>Back to Institutional Library</span>
                    </button>

                    {/* Category Info */}
                    <div className="flex items-start gap-6 mb-8 text-950"> 
                        <div className="flex-1">
                            <h1 className="text-4xl md:text-6xl font-black mb-4">
                                {currentCategory.name}
                            </h1>
                            <p className="text-xl text-blue-950 text-center mb-6">
                                {currentCategory.description}
                            </p>
                            <div className="flex items-center gap-6 text-sm justify-center">
                                <div className="flex">
                                    <BookOpen className="w-5 h-5" />
                                    <span>{displayBooks.length} Documents Available</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Download className="w-5 h-5" />
                                    <span>Instant Access</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Search Bar */}
                    <div className="max-w-2xl relative mx-auto">
                        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder={`Search in ${currentCategory.name}...`}
                            className="w-full pl-12 pr-4 py-4 rounded-xl text-gray-900 focus:outline-none focus:ring-4 focus:ring-white/30 shadow-lg"
                        />
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 py-12">
                {/* Filters & Sort */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">
                            Browse Documents
                        </h2>
                        <p className="text-gray-600 mt-1">
                            {displayBooks.length} resource{displayBooks.length !== 1 ? 's' : ''} available
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="text-gray-700 text-sm font-medium">Sort by:</span>
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            className="border border-gray-300 text-blue-950 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                        >
                            <option value="newest">Newest First</option>
                            <option value="price-low">Price: Low to High</option>
                            <option value="price-high">Price: High to Low</option>
                            <option value="rating">Highest Rated</option>
                            <option value="title">Title (A-Z)</option>
                        </select>
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
                                    <div className="absolute top-2 left-2 right-2 flex justify-between items-start">
                                        {isPurchased(book.id) && (
                                            <span className="bg-green-600 text-white px-2 py-1 rounded-md text-xs font-bold shadow-lg">
                                                Owned
                                            </span>
                                        )}
                                        {book.isFromFirestore && (
                                            <span className="bg-blue-600 text-white px-2 py-1 rounded-md text-xs font-bold shadow-lg ml-auto">
                                                New
                                            </span>
                                        )}
                                    </div>

                                    {/* Hover Overlay */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                                        <div className="flex items-center gap-2 text-white text-sm">
                                            <Eye className="w-4 h-4" />
                                            <span>Preview</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-4">
                                    <h3 className="font-bold text-sm text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors min-h-[40px]">
                                        {book.title}
                                    </h3>
                                    <p className="text-gray-600 text-xs mb-2">by {book.author}</p>

                                    {book.pages && (
                                        <p className="text-xs text-gray-500 mt-2">
                                            {book.pages} pages • {book.format}
                                        </p>
                                    )}
                                </div>
                            </a>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20 bg-white rounded-2xl shadow-sm">
                        <IconComponent className="w-20 h-20 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-2xl font-bold text-gray-900 mb-2">
                            No Documents Yet
                        </h3>
                        <p className="text-gray-600 mb-6">
                            Be the first to contribute resources to {currentCategory.name}
                        </p>
                        <a
                            href="/advertise"
                            className="inline-flex items-center gap-2 bg-blue-950 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                        >
                            <Download className="w-5 h-5" />
                            Upload Document
                        </a>
                    </div>
                )}

                {/* Browse Other Categories */}
                {displayBooks.length > 0 && (
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
                                            href={`/institutional/${key}`}
                                            className="bg-white rounded-xl p-4 hover:shadow-lg transition-all duration-300 group"
                                        >
                                            <Icon className="w-8 h-8 text-gray-400 group-hover:text-blue-600 transition-colors mb-2" />
                                            <h4 className="font-bold text-sm text-gray-900 group-hover:text-blue-600 transition-colors">
                                                {cat.name}
                                            </h4>
                                        </a>
                                    );
                                })}
                        </div>
                    </div>
                )}
            </div>

            {/* Footer */}
           <Footer />
        </div>
    );
}