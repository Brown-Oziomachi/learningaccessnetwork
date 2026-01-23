"use client"
import React, { useState, useEffect, useMemo } from 'react';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "@/lib/firebaseConfig";
import { booksData } from "@/lib/booksData";
import { doc, getDoc, collection, getDocs, query, where } from 'firebase/firestore';
import Navbar from '@/components/NavBar';
import Footer from '@/components/FooterComp';

export default function DocumentTypePage() {
    const params = useParams();
    const router = useRouter();
    const typeSlug = params.slug;
    const [purchasedBookIds, setPurchasedBookIds] = useState(new Set());
    const [user, setUser] = useState(null);
    const [sortBy, setSortBy] = useState('popularity');
    const [allBooks, setAllBooks] = useState([]);
    const [loading, setLoading] = useState(true);

    const documentTypes = [
        { name: 'Textbook', slug: 'textbook', image: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=400', description: 'Standard educational books' },
        { name: 'Lecture Note', slug: 'lecture-note', image: 'https://images.unsplash.com/photo-1517842645767-c639042777db?w=400', description: 'Summarized class materials' },
        { name: 'Past Question', slug: 'past-question', image: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=400', description: 'Previous exam papers' },
        { name: 'Thesis', slug: 'thesis', image: 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=400', description: 'Academic research papers' },
        { name: 'Summary', slug: 'summary', image: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?w=400', description: 'Quick study breakdowns' },
        { name: 'Syllabus', slug: 'syllabus', image: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=400', description: 'Course requirements' },
        { name: 'Course Outline', slug: 'course-outline', image: 'https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?w=400', description: 'Topic distributions' },
        { name: 'Assignment', slug: 'assignment', image: 'https://images.unsplash.com/photo-1488190211105-8b0e65b80b4e?w=400', description: 'Practice tasks and projects' },
        { name: 'Project', slug: 'project', image: 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=400', description: 'Detailed student projects' },
    ];

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

    const currentDocType = documentTypes.find(type => type.slug === typeSlug);
    const documentTypeName = currentDocType?.name || 'Document Type';

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

                    console.log('📄 Processing document:', {
                        id: docSnap.id,
                        title: data.bookTitle,
                        docType: data.docType,
                        category: data.category
                    });

                    const bookData = {
                        id: `firestore-${docSnap.id}`,
                        firestoreId: docSnap.id,
                        title: data.bookTitle,
                        author: data.author,
                        category: data.category,
                        documentType: data.docType || data.documentType || data.type,
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

                console.log(`✅ Fetched ${books.length} books from Firestore`);
                console.log('📦 Sample book documentTypes:', books.slice(0, 3).map(b => ({ title: b.title, docType: b.documentType })));

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

    const documentTypeCounts = useMemo(() => {
        const counts = {};
        documentTypes.forEach(type => {
            const count = allBooks.filter(book => {
                const bookType = book.documentType?.toLowerCase()
                    .replace(/ /g, '-')
                    .trim();
                return bookType === type.slug;
            }).length;
            counts[type.slug] = count;
        });
        return counts;
    }, [allBooks]);

    const typeBooks = useMemo(() => {
        console.log('🔍 Filtering books for typeSlug:', typeSlug);
        console.log('📚 Total books available:', allBooks.length);

        const filtered = allBooks.filter(book => {
            if (!book.documentType) {
                console.log('⚠️ Book missing documentType:', book.title);
                return false;
            }

            // Convert both to same format for comparison
            const bookTypeSlug = book.documentType.toLowerCase()
                .replace(/ /g, '-')
                .trim();

            console.log(`Comparing: "${bookTypeSlug}" === "${typeSlug}"`, bookTypeSlug === typeSlug);

            return bookTypeSlug === typeSlug;
        });

        console.log('✅ Filtered books:', filtered.length);
        return filtered;
    }, [allBooks, typeSlug]);

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

    const displayBooks = useMemo(() => sortBooks(typeBooks), [typeBooks, sortBy]);
    const isPurchased = (bookId) => purchasedBookIds.has(bookId);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-950 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading documents...</p>
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
                        <Link href="/documents" className="hover:text-blue-600">All Documents</Link>
                        <span>&gt;</span>
                        <span className="text-gray-900 font-semibold">{documentTypeName}</span>
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
                            {documentTypeName}
                        </h1>
                    </div>
                    <p className="text-gray-600 ml-14">
                        {currentDocType?.description} - Browse {displayBooks.length} document{displayBooks.length !== 1 ? 's' : ''}.
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

                {/* No documents message */}
                {displayBooks.length === 0 ? (
                    <div className="text-center py-16 bg-gray-50 rounded-lg">
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">No documents found</h3>
                        <p className="text-gray-600">There are currently no {documentTypeName} documents available.</p>
                        <Link
                            href="/documents"
                            className="inline-block mt-4 text-blue-950 hover:underline font-semibold"
                        >
                            Browse all documents →
                        </Link>
                    </div>
                ) : (
                    <>
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

                                            <div>
                                                <h4 className="font-bold text-sm text-gray-900 mb-1 line-clamp-2 group-hover:text-blue-600">
                                                    {book.title}
                                                </h4>
                                                <p className="text-gray-600 text-xs">{book.author}</p>
                                            </div>
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

                                                <div>
                                                    <h4 className="font-bold text-sm text-gray-900 mb-1 line-clamp-2 group-hover:text-blue-600">
                                                        {book.title}
                                                    </h4>
                                                    <p className="text-gray-600 text-xs">{book.author}</p>
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="mt-12 bg-blue-50 border border-blue-200 rounded-lg p-6">
                            <h3 className="text-xl font-bold text-gray-900 mb-4">Browse Other Document Types</h3>
                            <div className="flex flex-wrap gap-3">
                                {documentTypes
                                    .filter(type => type.slug !== typeSlug)
                                    .map((type) => {
                                        const docCount = documentTypeCounts[type.slug] || 0;
                                        return (
                                            <Link
                                                key={type.slug}
                                                href={`/document-type/${type.slug}`}
                                                className="bg-white border border-blue-300 text-blue-950 px-4 py-2 rounded-lg hover:bg-blue-950 hover:text-white transition-colors text-sm font-semibold"
                                            >
                                                {type.name} ({docCount})
                                            </Link>
                                        );
                                    })}
                            </div>
                        </div>
                    </>
                )}
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