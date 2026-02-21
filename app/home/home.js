"use client"
import React, { useState, useEffect } from 'react';
import { FileText, Monitor, Upload, ChevronLeft, ShoppingBag, Smartphone, Globe, ArrowRight, ChevronRight, BookOpen } from 'lucide-react';
import Link from 'next/link';
import Navbar from '@/components/NavBar';
import { onAuthStateChanged } from 'firebase/auth';
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebaseConfig";
import { doc, getDoc, collection, query, orderBy, limit, getDocs, where } from 'firebase/firestore';
import HomeLoading from './loading';
import MobileCategoriesCarousel from '@/components/MobileCategoriesCarousel';
import InstitutionalLibraryPage from '@/components/InstitutionalLib';
import Footer from '@/components/FooterComp';

const documentTypes = [
    { name: 'Textbook', image: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=400', description: 'Standard educational books' },
    { name: 'Lecture Note', image: 'https://images.unsplash.com/photo-1517842645767-c639042777db?w=400', description: 'Summarized class materials' },
    { name: 'Past Question', image: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=400', description: 'Previous exam papers' },
    { name: 'Thesis', image: 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=400', description: 'Academic research papers' },
    { name: 'Summary', image: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?w=400', description: 'Quick study breakdowns' },
    { name: 'Syllabus', image: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=400', description: 'Course requirements' },
    { name: 'Course Outline', image: 'https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?w=400', description: 'Topic distributions' },
    { name: 'Assignment', image: 'https://images.unsplash.com/photo-1488190211105-8b0e65b80b4e?w=400', description: 'Practice tasks and projects' },
    { name: 'Project', image: 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=400', description: 'Detailed student projects' },
];

// Category data
const categories = [
    {
        name: 'Education',
        subcategories: 8,
        image: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=400',
        description: 'Academic resources and learning materials'
    },
    {
        name: 'Personal Development',
        subcategories: 12,
        image: 'https://images.unsplash.com/photo-1516397281156-ca07cf9746fc?w=400',
        description: 'Self-improvement and personal growth'
    },
    {
        name: 'Business',
        subcategories: 10,
        image: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=400',
        description: 'Management, finance, and entrepreneurship'
    },
    {
        name: 'Technology',
        subcategories: 7,
        image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=400',
        description: 'Programming, IT, and digital innovation'
    },
    {
        name: 'Science',
        subcategories: 9,
        image: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=400',
        description: 'Research, discoveries, and exploration'
    },
    {
        name: 'Literature',
        subcategories: 15,
        image: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400',
        description: 'Classic and contemporary literary works'
    },
    {
        name: 'Health & Fitness',
        subcategories: 6,
        image: 'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?w=400',
        description: 'Medical, fitness, and mental health'
    },
    {
        name: 'History',
        subcategories: 6,
        image: 'https://images.unsplash.com/photo-1461360370896-922624d12aa1?w=400',
        description: 'Historical events and civilizations'
    },
    {
        name: 'Arts & Culture',
        subcategories: 5,
        image: 'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=400',
        description: 'Creative expression and cultural studies'
    },
    {
        name: 'Relationship',
        subcategories: 6,
        image: 'https://images.unsplash.com/photo-1529333166437-7750a6dd5a70?w=400',
        description: 'Love, marriage, dating, communication, and personal connections'
    },
    {
        name: 'Self-Help',
        subcategories: 8,
        image: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400',
        description: 'Personal empowerment and life guidance'
    },
    {
        name: 'Finance',
        subcategories: 7,
        image: 'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=400',
        description: 'Money management and investment strategies'
    },
    {
        name: 'Marketing',
        subcategories: 5,
        image: 'https://images.unsplash.com/photo-1533750349088-cd871a92f312?w=400',
        description: 'Branding, advertising, and promotion'
    },
    {
        name: 'Programming',
        subcategories: 10,
        image: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=400',
        description: 'Coding, software development, and algorithms'
    },
    {
        name: 'Psychology',
        subcategories: 8,
        image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
        description: 'Human behavior and mental processes'
    },
    {
        name: 'Fiction',
        subcategories: 20,
        image: 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=400',
        description: 'Novels, stories, and imaginative narratives'
    },
    {
        name: 'Non-Fiction',
        subcategories: 18,
        image: 'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=400',
        description: 'Real-world facts and true stories'
    },
    {
        name: 'Philosophy',
        subcategories: 6,
        image: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=400',
        description: 'Wisdom, ethics, and existential questions'
    },
    {
        name: 'Travel',
        subcategories: 7,
        image: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=400',
        description: 'Destinations, culture, and adventure'
    },
    {
        name: 'Cooking',
        subcategories: 9,
        image: 'https://images.unsplash.com/photo-1466637574441-749b8f19452f?w=400',
        description: 'Recipes, culinary techniques, and food culture'
    },
    {
        name: 'Religion & Spirituality',
        subcategories: 8,
        image: 'https://images.unsplash.com/photo-1518173946687-a4c8892bbd9f?w=400',
        description: 'Faith, beliefs, and spiritual practices'
    },
    {
        name: 'Sex Education',
        subcategories: 4,
        image: 'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=400',
        description: 'Sexual health, relationships, and wellness'
    },
    {
        name: 'Social Media',
        subcategories: 4,
        image: 'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=400',
        description: 'Growing Your media account, marketing on socia media'
    }
];


export default function HomeClient() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [allBooks, setAllBooks] = useState([]);
    const [loadingBooks, setLoadingBooks] = useState(true);
    const [isSeller, setIsSeller] = useState(false);
    const [checkingSeller, setCheckingSeller] = useState(true);
    const [purchasedBookIds, setPurchasedBookIds] = useState(new Set());
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState("");
    const [currentSlide, setCurrentSlide] = useState(0);
    const [activeTab, setActiveTab] = useState('subjects');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [bookSalesCount, setBookSalesCount] = useState({});

    // Now this will work because subjectCategories is already defined above
    const currentCategories = activeTab === 'subjects' ? categories : documentTypes;
   

    const featuredContent = [
        {
            title: "University Excellence: Your Gateway to Higher Education",
            description: "Discover comprehensive resources for undergraduate and postgraduate studies across all disciplines",
            timeAgo: "2 weeks ago",
            author: "Academic Team",
            image: 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=1200&q=80',
            link: "/institutional/category/university",
        },
       
        {
            title: "Secondary School Success: Build Your Future Today",
            description: "Complete curriculum materials for SS1, SS2, and SS3 students across all subjects",
            timeAgo: "1 week ago",
            author: "Secondary Education Team",
            image: "https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?w=1200&q=80",
            link: "/institutional/category/secondary-school",
        },
        {
            title: "Primary Education: Foundation for Lifelong Learning",
            description: "Age-appropriate learning materials for primary 1 through primary 6 students",
            timeAgo: "2 weeks ago",
            author: "Primary Education Team",
            image: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=1200&q=80",
            link: "/institutional/category/primary-school",
        },
        {
            title: "WAEC/NECO/JAMB Success: Your Path to Excellence",
            description: "Access past questions, study guides, and preparation materials for exam success",
            timeAgo: "3 days ago",
            author: "Exam Prep Team",
            image: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=1200&q=80",
            link: "/institutional/category/exam-prep",
        },
        {
            title: "Polytechnic Education: Technical Skills for Tomorrow",
            description: "Technical and vocational education resources for ND and HND programs",
            timeAgo: "1 week ago",
            author: "Polytechnic Team",
            image: "https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=1200&q=80",
            link: "/institutional/category/polytechnic",
        },
      
    ];

  
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

    // Add this at the very top of your HomeClient component
    useEffect(() => {
        const originalPush = router.push;
        const originalReplace = router.replace;

        router.push = (...args) => {
            console.log("🔴 ROUTER.PUSH CALLED:", args[0]);
            console.trace(); // Shows you WHERE the redirect is coming from
            return originalPush(...args);
        };

        router.replace = (...args) => {
            console.log("🟡 ROUTER.REPLACE CALLED:", args[0]);
            console.trace();
            return originalReplace(...args);
        };

        return () => {
            router.push = originalPush;
            router.replace = originalReplace;
        };
    }, [router]);

    // ✅ Fetch latest 4 books from Firebase
    useEffect(() => {
        const fetchLatestBooks = async () => {
            try {
                setLoadingBooks(true);

                const advertBooksRef = collection(db, 'advertMyBook');
                const q = query(
                    advertBooksRef,
                    where('status', '==', 'approved'),  // ✅ ADD THIS LINE
                    orderBy('createdAt', 'desc'),
                    limit(6)
                );

                const snapshot = await getDocs(q);

                if (!snapshot.empty) {
                    const latestBooks = [];

                    snapshot.forEach((doc) => {
                        const data = doc.data();

                        if (data.bookTitle && data.price) {
                            const bookData = {
                                id: `firestore-${doc.id}`,
                                firestoreId: doc.id,
                                title: data.bookTitle,
                                author: data.author || 'Unknown Author',
                                category: (data.category || 'education').toLowerCase(),
                                price: Number(data.price) || 0,
                                pages: data.pages || 100,
                                format: 'PDF',
                                description: data.description || `Discover ${data.bookTitle}`,
                                driveFileId: data.driveFileId,
                                pdfUrl: data.pdfUrl,
                                embedUrl: data.embedUrl,
                                isFromFirestore: true,
                                isNew: true,
                                createdAt: data.createdAt,
                                rating: data.rating || 4.5,
                                reviews: data.reviews || 0
                            };

                            bookData.image = getThumbnailUrl(bookData);
                            latestBooks.push(bookData);
                        }
                    });

                    console.log(`✅ Loaded ${latestBooks.length} latest books`);
                    setAllBooks(latestBooks);
                } else {
                    setAllBooks([]);
                }
            } catch (error) {
                console.error('Error fetching latest books:', error);
                setAllBooks([]);
            } finally {
                setLoadingBooks(false);
            }
        };

        fetchLatestBooks();
    }, []);

    // ✅ Thumbnail helper function
    const getThumbnailUrl = (book) => {
        if (book.driveFileId) {
            return `https://drive.google.com/thumbnail?id=${book.driveFileId}&sz=w400`;
        }

        if (book.embedUrl) {
            const match = book.embedUrl.match(/\/d\/(.*?)\/|\/file\/d\/(.*?)\/|id=(.*?)(&|$)/);
            if (match) {
                const fileId = match[1] || match[2] || match[3];
                if (fileId) {
                    return `https://drive.google.com/thumbnail?id=${fileId}&sz=w400`;
                }
            }
        }

        if (book.pdfUrl && book.pdfUrl.includes('drive.google.com')) {
            const match = book.pdfUrl.match(/[-\w]{25,}/);
            if (match) {
                return `https://drive.google.com/thumbnail?id=${match[0]}&sz=w400`;
            }
        }

        return book.image || 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400';
    };

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
                        const purchasedBooksData = userData.purchasedBooks || {};

                        let purchasedArray = [];
                        if (Array.isArray(purchasedBooksData)) {
                            purchasedArray = purchasedBooksData;
                        } else if (typeof purchasedBooksData === 'object') {
                            purchasedArray = Object.values(purchasedBooksData);
                        }

                        const bookIds = new Set(
                            purchasedArray
                                .map(book => book.id || book.bookId || book.firestoreId)
                                .filter(Boolean)
                        );

                        setPurchasedBookIds(bookIds);
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

    const isPurchased = (bookId) => {
        return (
            purchasedBookIds.has(bookId) ||
            purchasedBookIds.has(String(bookId)) ||
            purchasedBookIds.has(`firestore-${bookId}`) ||
            purchasedBookIds.has(bookId.toString().replace('firestore-', ''))
        );
    };

    const nextSlide = () => {
        setCurrentSlide((prev) => (prev + 1) % featuredContent.length);
    };

    const displayBooks = allBooks;

    const prevSlide = () => {
        setCurrentSlide((prev) => (prev - 1 + featuredContent.length) % featuredContent.length);
    };


    // Auto-advance carousel
    useEffect(() => {
        const timer = setInterval(() => {
            nextSlide();
        }, 5000);
        return () => clearInterval(timer);
    }, [currentSlide]);

    // Check seller status
    // Check seller status
    const checkSellerStatus = async (userId) => {
        try {
            setCheckingSeller(true);
            const userDocRef = doc(db, 'users', userId);
            const userDoc = await getDoc(userDocRef);

            if (userDoc.exists()) {
                const userData = userDoc.data();
                const isUserSeller = userData.isSeller === true;
                setIsSeller(isUserSeller);
            } else {
                setIsSeller(false);
            }
        } catch (error) {
            console.error("Error checking seller status:", error);
            setIsSeller(false);
        } finally {
            setCheckingSeller(false);
        }
    };
    
    // Auth state listener - NO REDIRECTS
   // Auth state listener - FORCE NO REDIRECTS
useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
        if (currentUser) {
            setUser(currentUser);
            await checkSellerStatus(currentUser.uid);
        } else {
            setUser(null);
            setIsSeller(false);
            setCheckingSeller(false);
        }
        setLoading(false);
    });

    return () => unsubscribe();
}, []);
  
    // Handle upload button click
    // Handle upload button click
    const HandleClick = () => {
        if (!user) {
            // ✅ Redirect to signin if not logged in
            router.push('/auth/signin');
            return;
        }

        if (isSeller) {
            router.push('/advertise');
        } else {
            router.push('/become-seller');
        }
    };

    // Loading timer
    useEffect(() => {
        const timer = setTimeout(() => {
            setLoading(false);
        }, 1000);

        return () => clearTimeout(timer);
    }, []);

    if (loading) {
        return <HomeLoading />;
    }

    return (
        <div className="min-h-screen bg-neutral-100">
            {/* Navbar */}
            <Navbar />

            {/* Featured Content Carousel */}
            <div className="relative w-full h-[400px] md:h-[600px] overflow-hidden bg-gray-900">
                {featuredContent.map((content, index) => (
                    <a
                        key={index}
                        // href={content.link}
                        className={`absolute inset-0 transition-opacity duration-700 cursor-pointer group ${index === currentSlide ? "opacity-100" : "opacity-0 pointer-events-none"
                            }`}
                    >
                        <div className="absolute inset-0">
                            <img
                                src={content.image}
                                alt={content.title}
                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-black/30 group-hover:from-black/85 group-hover:via-black/55 transition-all duration-300"></div>
                        </div>

                        <div className="relative h-full flex items-center justify-center">
                            <div className="max-w-4xl mx-auto px-4 text-center text-white">
                                <h1 className="text-2xl md:text-5xl font-bold mb-4 md:mb-6 leading-tight group-hover:scale-105 transition-transform duration-300">
                                    {content.title}
                                </h1>
                                <p className="text-sm md:text-xl text-gray-200 mb-6 md:mb-8">
                                    {content.description}
                                </p>
                                <div className="flex items-center justify-center gap-3 text-xs md:text-sm text-gray-300 mb-6">
                                    <span>{content.timeAgo}</span>
                                    <span>•</span>
                                    <span>by {content.author}</span>
                                </div>
                                <div className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm px-6 py-3 rounded-full border border-white/30 transition-all duration-300 group-hover:border-white/50">
                                    <span className="font-semibold">Explore Category</span>
                                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                </div>
                            </div>
                        </div>
                    </a>
                ))}

                <button
                    onClick={prevSlide}
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 md:w-12 md:h-12 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full flex items-center justify-center transition-all"
                    aria-label="Previous slide"
                >
                    <ChevronLeft className="w-6 h-6 md:w-8 md:h-8 text-white" />
                </button>
                <button
                    onClick={nextSlide}
                    className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 md:w-12 md:h-12 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full flex items-center justify-center transition-all"
                    aria-label="Next slide"
                >
                    <ChevronRight className="w-6 h-6 md:w-8 md:h-8 text-white" />
                </button>

                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
                    {featuredContent.map((_, index) => (
                        <button
                            key={index}
                            onClick={() => setCurrentSlide(index)}
                            className={`w-2 h-2 rounded-full transition-all ${index === currentSlide
                                ? "bg-white w-8"
                                : "bg-white/50 hover:bg-white/75"
                                }`}
                            aria-label={`Go to slide ${index + 1}`}
                        />
                    ))}
                </div>
            </div>

            {/* Hero Section */}
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 py-16 shadow-2xl">
                <div className="max-w-7xl mx-auto px-4">
                    <h1 className="text-4xl md:text-6xl font-extrabold text-gray-900 mb-6">
                        You've seen it all, now understand it all.
                    </h1>
                    <p className="text-lg md:text-xl text-gray-700 max-w-4xl">
                        Make sense of anything with information on just about everything, shared by a global community of thinkers.
                    </p>
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
                        className="bg-blue-950 cursor-pointer text-white px-6 py-3 rounded-lg hover:bg-blue-900 transition-colors"
                    >
                        Clear Filters
                    </button>
                </div>
            ) : (
                <>
                    {/* Featured Books Carousel */}
                    <div className="px-4 py-8 lg:px- mx-auto max-w-7xl">
                        <h1 className="text-4xl lg:text-5xl font-black mb-10 text-black">Documents</h1>
                        <h3 className="text-lg lg:text-xl font-bold text-gray-900 mb-8">Get started with the community's uploads</h3>

                        {/* Mobile: 2 per row (Grid) | Desktop: Horizontal scroll */}
                        <div className="relative">
                            {/* Mobile Grid (2 columns) */}
                            <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
                                {displayBooks.slice(0, 6).map((book) => (
                                    <Link
                                        key={book.id}
                                        href={`/book/preview?id=${book.id}`}
                                        className="group"
                                    >
                                        <div className="relative mb-3">
                                            <img
                                                src={book.image}
                                                alt={book.title}
                                                className="w-full  object-cover  group-hover:shadow-xl transition-shadow"
                                                onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400'; }}
                                            />
                                            {isPurchased(book.id) && (
                                                <span className="absolute top-2 right-2 bg-green-600 text-white px-2 py-1 text-xs font-bold">Owned</span>
                                            )}
                                            {book.isFromFirestore && (
                                                <span className="absolute top-2 left-2 bg-blue-600 text-white px-2 py-1 text-xs font-bold">New</span>
                                            )}
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-sm text-gray-900 mb-1 line-clamp-2 group-hover:text-blue-600 transition-colors">
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

                            {/* Desktop Horizontal Scroll */}
                            <div className=" relative -mx-4 lg:mx-0">
                                <div className="overflow-x-auto overflow-y-hidden scrollbar-hide px-4 lg:px-0" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                                    <style jsx>{`
                    div::-webkit-scrollbar {
                        display: none;
                    }
                `}</style>
                                        
                                        {/* Section Heading & Tabs */}
                                        <div className="flex flex-col md:flex-row justify-between items-end mb-8 gap-6 py-20">
                                            <div>
                                                <h2 className="text-3xl font-bold text-gray-900">Explore Library</h2>
                                                <p className="text-gray-600 mt-2">Find materials by Departments or resources</p>
                                            </div>

                                            {/* Modern Tab Switcher */}
                                            <div className="flex bg-gray-200 p-1 w-full md:w-auto">
                                                <button
                                                    onClick={() => setActiveTab('subjects')}
                                                    className={`flex-1 md:flex-none px-6 py-2  font-semibold transition-all ${activeTab === 'subjects' ? 'bg-white text-blue-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                                                        }`}
                                                >
                                                    Departments
                                                </button>
                                                <button
                                                    onClick={() => setActiveTab('documents')}
                                                    className={`flex-1 md:flex-none px-6 py-2 font-semibold transition-all ${activeTab === 'documents' ? 'bg-white text-blue-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                                                        }`}
                                                >
                                                    Resources
                                                </button>
                                            </div>
                                        </div>

                                        {/* The Grid */}
                                        {/* The Grid - Show Categories when Subjects tab, Document Types when Documents tab */}
                                        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                                            {activeTab === 'subjects' ? (
                                                // Show full categories array when Subjects tab is active
                                                categories.map((category, index) => (
                                                        <a
                                                            key={index}
                                                            href={`/category/${category.name.toLowerCase().replace(/ & /g, '-').replace(/ /g, '-')}`}
                                                            className="group bg-white border border-gray-200 overflow-hidden hover:shadow-xl transition-all duration-300"
                                                        >
                                                            <div className="p-6 bg-gray-100">
                                                                <h3 className="text-xl font-bold text-gray-900 mb-2">
                                                                    {category.name}
                                                                </h3>
                                                                {/* <p className="text-sm text-gray-600 mb-4">
                                            {category.subcategories} categories
                                        </p> */}


                                                            </div>

                                                            <div className="relative h-48 overflow-hidden">
                                                                <img
                                                                    src={category.image}
                                                                    alt={category.name}
                                                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                                                />
                                                            </div>
                                                        </a>
                                                ))
                                        ) : (
                                    // Show document types when Documents tab is active
                                    documentTypes.map((doc, index) => (
                                        <div
                                            key={index}
                                            onClick={() => {
                                                // Navigate to document type page
                                                const slug = doc.name.toLowerCase().replace(/ /g, '-');
                                                router.push(`/document-type/${slug}`);
                                            }}
                                            className={`group cursor-pointer bg-white overflow-hidden shadow-sm hover:shadow-xl transition-all border-2`}
                                        >
                                            <div className="h-32 md:h-40 overflow-hidden relative">
                                                <img
                                                    src={doc.image}
                                                    alt={doc.name}
                                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                                />
                                                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-colors" />
                                            </div>
                                            <div className="p-4">
                                                <h3 className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors">{doc.name}</h3>
                                                <p className="text-xs text-gray-500 line-clamp-1 mt-1">{doc.description}</p>
                                            </div>
                                        </div>
                                        ))
                                    )}
                                    </div>
                                        {/* Reset Filter Button (Visible only when filtering) */}
                                        {selectedCategory && (
                                            <div className="mt-8 flex justify-center">
                                                <main className="max-w-7xl mx-auto px-4 py-12">
                                                    {/* Desktop Categories Grid - Hidden on mobile */}

                                                    {/* Explore All Link */}
                                                    <div className="text-center mt-12">
                                                        <a
                                                            href="/documents"
                                                            className="inline-flex items-center text-blue-950 font-semibold text-lg hover:underline"
                                                        >
                                                            Explore all of our categories
                                                            <ChevronRight className="w-5 h-5 ml-1" />
                                                        </a>
                                                    </div>
                                                </main>

                                            </div>
                                        )}
                                </div>
                            </div>
                        </div>
                        </div>
                        
                    {/* Categories Section */}
                   
                    {/* Upload Section */}
                    <div className="bg-neutral-100 py-16">
                        <div className="max-w-5xl mx-auto px-4 text-center">
                            <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-6">
                                Share the wealth <span className="text-gray-700">[of knowledge]</span>.
                            </h2>

                            <p className="text-lg text-gray-600 max-w-3xl mx-auto mb-12">
                                Turn your books into income. Upload your work, reach a global audience{" "}
                                <span className="font-medium text-gray-900">[90M+]</span>, and earn whenever
                                readers discover and purchase your content.
                            </p>

                            <div className="bg-white rounded-xl shadow-lg py-16 flex flex-col items-center justify-center">
                                <div className="flex items-center gap-8 mb-8 text-gray-800">
                                    <Monitor size={64} strokeWidth={1.5} />
                                    <Upload size={48} strokeWidth={2} />
                                    <Smartphone size={56} strokeWidth={1.5} />
                                </div>

                                <button
                                    onClick={HandleClick}
                                    disabled={checkingSeller}
                                    className="bg-blue-950 hover:bg-blue-800 transition-colors text-white font-semibold px-8 py-4 rounded-lg shadow-md text-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                    {checkingSeller ? (
                                        <>
                                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                            Loading...
                                        </>
                                    ) : isSeller ? (
                                        <>
                                            <Upload size={20} />
                                            Upload Document
                                        </>
                                    ) : (
                                        <>
                                            Become a Seller
                                        </>
                                    )}
                                </button>

                                {!checkingSeller && isSeller && (
                                    <p className="text-sm text-green-600 mt-3 flex items-center gap-1">
                                        <span className="w-2 h-2 bg-green-600 rounded-full"></span>
                                        You're a verified seller
                                    </p>
                                )}
                            </div>
                        </div>
                        <div>
                            <InstitutionalLibraryPage />
                        </div>
                    </div>
                    {/* Footer */}
                    <Footer />
                </>
            )}
        </div>
    );
}