"use client"
import React, { useState, useEffect, useMemo } from 'react';
import { Globe, ArrowLeft, ShoppingBag, } from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "@/lib/firebaseConfig";
import { booksData } from "@/lib/booksData";
import { doc, getDoc, collection, getDocs, query, where } from 'firebase/firestore';
import Navbar from '@/components/NavBar';
import Footer from '@/components/FooterComp';

export default function CategoryPage() {
    const params = useParams();
    const router = useRouter();
    const categorySlug = params.slug;
    const [purchasedBookIds, setPurchasedBookIds] = useState(new Set());
    const [user, setUser] = useState(null);
    const [sortBy, setSortBy] = useState('popularity');
    const [firestoreBooks, setFirestoreBooks] = useState([]);
    const [allBooks, setAllBooks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [bookSalesCount, setBookSalesCount] = useState({});

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

    const categoriesData = [
        { name: 'Education', slug: 'education', image: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=400' },
        { name: 'Personal Development', slug: 'personal-development', image: 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=400' },
        { name: 'Business', slug: 'business', image: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=400' },
        { name: 'Technology', slug: 'technology', image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=400' },
        { name: 'Science', slug: 'science', image: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=400' },
        { name: 'Literature', slug: 'literature', image: 'https://images.unsplash.com/photo-1524578271613-d550eacf6090?w=400' },
        { name: 'Health & Fitness', slug: 'health-wellness', image: 'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?w=400' },
        { name: 'History', slug: 'history', image: 'https://images.unsplash.com/photo-1461360370896-922624d12aa1?w=400' },
        { name: 'Arts & Culture', slug: 'arts-culture', image: 'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=400' },
        { name: 'Relation & Marriage', slug: 'relationship', image: 'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=400' }
    ];

    const currentCategory = categoriesData.find(cat => cat.slug === categorySlug);
    const categoryName = currentCategory?.name || 'Category';

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
        const fetchFirestoreBooks = async () => {
            try {
                const processedBooksData = booksData.map(book => ({
                    ...book,
                    image: getThumbnailUrl(book)
                }));

                const q = query(collection(db, 'advertMyBook'), where('status', '==', 'approved'));
                const querySnapshot = await getDocs(q);

                const books = [];
                querySnapshot.forEach((docSnap) => {
                    const data = docSnap.data();

                    const bookData = {
                        id: `firestore-${docSnap.id}`,
                        firestoreId: docSnap.id,
                        title: data.bookTitle,
                        author: data.author,
                        category: data.category,
                        price: data.price,
                        pages: data.pages,
                        format: data.format || 'PDF',
                        description: data.description,
                        rating: 4.5,
                        reviews: 0,
                        driveFileId: data.driveFileId || data.fileId || data.driveId || data.googleDriveId,
                        pdfUrl: data.pdfUrl || data.pdf || data.documentUrl,
                        previewUrl: data.previewUrl,
                        embedUrl: data.embedUrl || data.embed,
                        isFromFirestore: true
                    };

                    const thumbnail = getThumbnailUrl(bookData);
                    bookData.image = thumbnail;
                    books.push(bookData);
                });

                const combinedBooks = [...processedBooksData, ...books];
                setAllBooks(combinedBooks);
            } catch (error) {
                console.error('❌ Error fetching Firestore books:', error);
                const processedBooksData = booksData.map(book => ({
                    ...book,
                    image: getThumbnailUrl(book)
                }));
                setAllBooks(processedBooksData);
            } finally {
                setLoading(false);
            }
        };

        fetchFirestoreBooks();
    }, []);

    useEffect(() => {
        const fetchPurchasedBooks = async () => {
            try {
                const user = auth.currentUser;
                if (user) {
                    const userDocRef = doc(db, 'users', user.uid);
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

    const categoryCounts = useMemo(() => {
        const counts = {};
        categoriesData.forEach(category => {
            const count = allBooks.filter(book => {
                const bookCategory = book.category?.toLowerCase()
                    .replace(/ & /g, '-')
                    .replace(/ /g, '-')
                    .trim();
                return bookCategory === category.slug;
            }).length;
            counts[category.slug] = count;
        });
        return counts;
    }, [allBooks]);

    const categoryBooks = useMemo(() => {
        return allBooks.filter(book => {
            const bookCategory = book.category?.toLowerCase()
                .replace(/ & /g, '-')
                .replace(/ /g, '-')
                .trim();
            return bookCategory === categorySlug;
        });
    }, [allBooks, categorySlug]);

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
            default:
                return sorted.sort((a, b) => b.reviews - a.reviews);
        }
    };

    const displayBooks = useMemo(() => sortBooks(categoryBooks), [categoryBooks, sortBy]);
    const isPurchased = (bookId) => purchasedBookIds.has(bookId);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white">
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
        <div className="min-h-screen bg-white overflow-x-hidden">
            <Navbar />

            <div className="bg-gray-50 border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 py-3">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Link href="/home" className="hover:text-blue-600">Home</Link>
                        <span>&gt;</span>
                        <Link href="/documents" className="hover:text-blue-600">All Books</Link>
                        <span>&gt;</span>
                        <span className="text-gray-900 font-semibold">{categoryName}</span>
                    </div>
                </div>
            </div>

            <main className="max-w-7xl mx-auto px-4 py-8">
                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-3">
                        <button onClick={() => router.back()} className="p-2 text-blue-950 rounded-lg transition-colors">
                            <ArrowLeft size={24} />
                        </button>
                        <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
                            {categoryName} Documents
                        </h1>
                    </div>
                    <p className="text-gray-600 ml-14">
                        Explore {displayBooks.length} document{displayBooks.length !== 1 ? 's' : ''} in {categoryName}.
                        Access on your web browser, Android, or iOS device.
                    </p>
                </div>

                <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
                    <div className="flex items-center gap-2">
                        <span className="text-gray-700 font-semibold">Documents recommended for you</span>
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

                {/* First Row */}
                <div className="mb-8">
                    <div className="overflow-x-auto scrollbar-hide">
                        <div className="flex gap-4 pb-4">
                            {displayBooks.slice(0, 5).map((book) => (
                                <Link
                                    key={book.id}
                                    href={`/book/preview?id=${book.id}`}
                                    className="flex-none w-[180px] sm:w-[200px] group"
                                >
                                    {/* Book Cover */}
                                    <div className="relative mb-3">
                                        <img
                                            src={book.image}
                                            alt={book.title}
                                            className="w-full h-[240px] sm:h-[280px] object-cover rounded shadow-md group-hover:shadow-xl transition-shadow"
                                            onError={(e) => {
                                                e.target.src = 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400';
                                            }}
                                        />
                                        {isPurchased(book.id) && (
                                            <span className="absolute top-2 right-2 bg-green-600 text-white px-2 py-1 rounded text-xs font-bold">Owned</span>
                                        )}
                                        {book.isFromFirestore && (
                                            <span className="absolute top-2 left-2 bg-blue-600 text-white px-2 py-1 rounded text-xs font-bold">New</span>
                                        )}
                                    </div>

                                    {/* Title and Author */}
                                    <div>
                                        <h4 className="font-bold text-sm text-gray-900 mb-1 line-clamp-2 group-hover:text-blue-600">
                                            {book.title}
                                        </h4>
                                        <p className="text-gray-600 text-xs">{book.author}</p>
                                    </div>
                                     <p className="text-gray-500 text-xs lg:text-sm flex items-center gap-1 mt-1">
                                            <ShoppingBag size={12} />
                                            {bookSalesCount[book.id] || bookSalesCount[book.firestoreId] || 0} sold
                                        </p>
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>


                {/* Second Row */}
                {displayBooks.length > 5 && (
                    <div className="mb-8">
                        <div className="overflow-x-auto scrollbar-hide">
                            <div className="flex gap-4 pb-4">
                                {displayBooks.slice(5, 10).map((book) => (
                                    <Link
                                        key={book.id}
                                        href={`/book/preview?id=${book.id}`}
                                        className="flex-none w-[180px] sm:w-[200px] group"
                                    >
                                        {/* Book Cover */}
                                        <div className="relative mb-3">
                                            <img
                                                src={book.image}
                                                alt={book.title}
                                                className="w-full h-[240px] sm:h-[280px] object-cover rounded shadow-md group-hover:shadow-xl transition-shadow"
                                                onError={(e) => {
                                                    e.target.src = 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400';
                                                }}
                                            />
                                            {isPurchased(book.id) && (
                                                <span className="absolute top-2 right-2 bg-green-600 text-white px-2 py-1 rounded text-xs font-bold">Owned</span>
                                            )}
                                            {book.isFromFirestore && (
                                                <span className="absolute top-2 left-2 bg-blue-600 text-white px-2 py-1 rounded text-xs font-bold">New</span>
                                            )}
                                        </div>

                                        {/* Title and Author */}
                                        <div>
                                            <h4 className="font-bold text-sm text-gray-900 mb-1 line-clamp-2 group-hover:text-blue-600">
                                                {book.title}
                                            </h4>
                                            <p className="text-gray-600 text-xs">{book.author}</p>
                                        </div>
                                         <p className="text-gray-500 text-xs lg:text-sm flex items-center gap-1 mt-1">
                                            <ShoppingBag size={12} />
                                            {bookSalesCount[book.id] || bookSalesCount[book.firestoreId] || 0} sold
                                        </p>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                <div className="mt-12 bg-blue-50 border border-blue-200 rounded-lg p-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-4">Browse Other Categories</h3>
                    <div className="flex flex-wrap gap-3">
                        {categoriesData
                            .filter(cat => cat.slug !== categorySlug)
                            .map((category) => {
                                const bookCount = categoryCounts[category.slug] || 0;
                                return (
                                    <Link
                                        key={category.slug}
                                        href={`/category/${category.slug}`}
                                        className="bg-white border border-blue-300 text-blue-950 px-4 py-2 rounded-lg hover:bg-blue-950 hover:text-white transition-colors text-sm font-semibold"
                                    >
                                        {category.name} ({bookCount})
                                    </Link>
                                );
                            })}
                    </div>
                </div>
            </main>

            <Footer />

            <style jsx>{`
                .scrollbar-hide { 
                    -ms-overflow-style: none; 
                    scrollbar-width: none; 
                }
                .scrollbar-hide::-webkit-scrollbar { 
                    display: none; 
                }
            `}</style>
        </div>
    );
}