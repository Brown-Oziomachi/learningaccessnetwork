'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    BookOpen,
    ShoppingBag,
    Heart,
    User,
    Settings,
    LogOut,
    Store,
    Bell,
    Search,
    TrendingUp,
    Clock,
    DollarSign,
    Plus,
    Filter,
    Download,
    PlayCircle,
    CheckCircle,
    Globe,
    Award,
    ChevronRight,
    Upload,
    BarChart3,
    Eye
} from 'lucide-react';
import { auth, db } from '@/lib/firebaseConfig';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import Link from 'next/link';
import Navbar from '@/components/NavBar';

export default function StudentDashboardClient() {
    const router = useRouter();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('home');
    const [library, setLibrary] = useState([]);
    const [wishlist, setWishlist] = useState([]);
    const [continueReading, setContinueReading] = useState([]);
    const [sellerStats, setSellerStats] = useState(null);
    const [recentSales, setRecentSales] = useState([]);
    const [trending, setTrending] = useState([]);
    const [showSuccessModal, setShowSuccessModal] = useState(false);

    // ✅ ADD THUMBNAIL HELPER FUNCTION (same as documents page)
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

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (currentUser) {
                await fetchUserData(currentUser.uid);
            } else {
                router.push('/auth/signin');
            }
        });
        return () => unsubscribe();
    }, [router]);

    const fetchUserData = async (uid) => {
        try {
            setLoading(true);
            const userDoc = await getDoc(doc(db, 'users', uid));

            if (userDoc.exists()) {
                const userData = userDoc.data();
                setUser({ uid, ...userData });

                // Fetch library (purchased books) with thumbnails
                if (userData.purchasedBooks) {
                    const libraryData = Object.values(userData.purchasedBooks).map(book => ({
                        ...book,
                        thumbnail: getThumbnailUrl(book)
                    }));
                    setLibrary(libraryData);

                    // Get continue reading (last 3 books)
                    setContinueReading(libraryData.slice(0, 3));
                }

                // Fetch wishlist with thumbnails
                if (userData.savedBooks) {
                    const wishlistData = userData.savedBooks.map(book => ({
                        ...book,
                        thumbnail: getThumbnailUrl(book)
                    }));
                    setWishlist(wishlistData);
                }

                // If user is also a seller, fetch seller stats
                if (userData.isSeller) {
                    await fetchSellerStats(uid);
                }

                // Fetch trending in university
                await fetchTrendingBooks(userData.university);
            }
        } catch (error) {
            console.error('Error fetching user data:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchSellerStats = async (uid) => {
        try {
            const sellerDoc = await getDoc(doc(db, 'sellers', uid));
            if (sellerDoc.exists()) {
                const sellerData = sellerDoc.data();
                setSellerStats(sellerData);

                // Fetch recent sales
                const salesQuery = query(
                    collection(db, 'transactions'),
                    where('sellerId', '==', uid)
                );
                const salesSnapshot = await getDocs(salesQuery);
                const sales = salesSnapshot.docs
                    .map(doc => ({ id: doc.id, ...doc.data() }))
                    .sort((a, b) => b.createdAt - a.createdAt)
                    .slice(0, 5);
                setRecentSales(sales);
            }
        } catch (error) {
            console.error('Error fetching seller stats:', error);
        }
    };

    const fetchTrendingBooks = async (university) => {
        try {
            // Fetch trending books (mock data for now)
            setTrending([
                { id: 1, title: 'Advanced Calculus Notes', downloads: 245, price: 2500 },
                { id: 2, title: 'Organic Chemistry Lab Manual', downloads: 189, price: 3000 },
                { id: 3, title: 'Computer Science Algorithms', downloads: 156, price: 2800 }
            ]);
        } catch (error) {
            console.error('Error fetching trending:', error);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin h-12 w-12 border-b-2 border-blue-950 rounded-full mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading your dashboard...</p>
                </div>
            </div>
        );
    }

    const renderHomeTab = () => (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Modern Hero Section */}
            <div className="relative overflow-hidden bg-blue-950 rounded-3xl p-8 text-white shadow-2xl">
                <div className="relative z-10">
                    <span className="bg-blue-500/20 text-blue-300 px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase">
                        {user?.university || 'Global Scholar'}
                    </span>
                    <h2 className="text-3xl md:text-4xl font-black mt-4 mb-2">
                        Hi, {user?.firstName}! ✨
                    </h2>
                    <p className="text-blue-200 text-lg max-w-md">
                        Ready to crush your goals today? You have {library.length} resources in your locker.
                    </p>
                </div>
                {/* Abstract Background Shape */}
                <div className="absolute top-[-20%] right-[-10%] w-64 h-64 bg-blue-500/10 rounded-full blur-3xl"></div>
            </div>

            {/* Continue Reading - Visual Grid with REAL THUMBNAILS */}
            {continueReading.length > 0 && (
                <section>
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                            <Clock className="text-blue-600" size={24} />
                            Jump Back In
                        </h3>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                        {continueReading.map((book) => (
                            <Link
                                key={book.bookId || book.id}
                                href={`/book/preview?id=${book.bookId || book.id}`}
                                className="group relative bg-white p-3 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100"
                            >
                                <div className="aspect-[3/4] bg-gray-100 rounded-xl mb-4 overflow-hidden relative">
                                    <img
                                        src={book.thumbnail || book.image}
                                        alt={book.title}
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                            e.target.src = 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400';
                                        }}
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                                        <button className="w-full bg-white text-blue-950 py-2 rounded-lg font-bold text-sm shadow-lg transform translate-y-2 group-hover:translate-y-0 transition-transform">
                                            Resume Reading
                                        </button>
                                    </div>
                                </div>
                                <h4 className="font-bold text-gray-900 text-sm line-clamp-1">{book.title}</h4>
                                <div className="mt-2 w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                                    <div className="bg-blue-600 h-full w-[62%]"></div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </section>
            )}

            {/* Gamification Row */}
            <div className="flex gap-4 overflow-x-auto pb-2 no-scrollbar">
                <div className="flex-shrink-0 bg-white p-4 rounded-2xl border border-orange-100 flex items-center gap-3 shadow-sm">
                    <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center text-orange-600">
                        <TrendingUp size={20} />
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase">Study Streak</p>
                        <p className="text-sm font-black text-gray-900">5 Days 🔥</p>
                    </div>
                </div>

                <div className="flex-shrink-0 bg-white p-4 rounded-2xl border border-blue-100 flex items-center gap-3 shadow-sm">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                        <Award size={20} />
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase">Scholar Level</p>
                        <p className="text-sm font-black text-gray-900">Silver Tier</p>
                    </div>
                </div>
            </div>

            {/* Two-Column Layout for Desktop: Pulse & Earnings */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                {/* University Pulse (Trending) */}
                <section className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-bold flex items-center gap-2">
                            <TrendingUp className="text-orange-500" size={20} />
                            Campus Pulse
                        </h3>
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Live Updates</span>
                    </div>
                    <div className="space-y-4">
                        {trending.map((book, index) => (
                            <div key={book.id} className="group flex items-center gap-4 p-4 rounded-2xl hover:bg-orange-50 transition-all cursor-pointer border border-transparent hover:border-orange-100">
                                <div className="text-2xl font-black text-gray-200 group-hover:text-orange-300 transition-colors">
                                    0{index + 1}
                                </div>
                                <div className="flex-1">
                                    <h4 className="font-bold text-gray-900 text-sm">{book.title}</h4>
                                    <p className="text-xs text-gray-500">{book.downloads} peers are reading this</p>
                                </div>
                                <ChevronRight className="text-gray-300 group-hover:text-orange-500" size={20} />
                            </div>
                        ))}
                    </div>
                </section>

                <section className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 mt-8">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-bold flex items-center gap-2">
                            <Award className="text-yellow-500" size={20} />
                            Top Contributors
                        </h3>
                    </div>
                    <div className="space-y-4">
                        {[
                            { name: 'Sarah A.', school: 'UNILAG', uploads: 42 },
                            { name: 'David O.', school: 'UNILAG', uploads: 38 },
                            { name: 'Emeka W.', school: 'UNILAG', uploads: 29 }
                        ].map((leader, i) => (
                            <div key={i} className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${i === 0 ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-600'
                                    }`}>
                                    {i + 1}
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-bold">{leader.name}</p>
                                    <p className="text-[10px] text-gray-400 uppercase">{leader.uploads} Documents Shared</p>
                                </div>
                                <div className="text-xs font-bold text-blue-600">View Profile</div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Seller Quick-Card */}
                {user?.isSeller ? (
                    <section className="bg-emerald-950 rounded-3xl p-6 text-white shadow-xl flex flex-col justify-between">
                        <div>
                            <div className="flex justify-between items-start">
                                <div className="p-3 bg-emerald-500/20 rounded-2xl">
                                    <DollarSign size={24} className="text-emerald-400" />
                                </div>
                                <span className="text-[10px] font-bold bg-emerald-500 text-white px-2 py-1 rounded-md uppercase">Author account</span>
                            </div>
                            <p className="text-emerald-200/60 text-sm mt-6 font-medium">Available Balance</p>
                            <h3 className="text-4xl font-black mt-1">₦{sellerStats?.accountBalance?.toLocaleString() || '0'}</h3>
                        </div>

                        <div className="mt-8 grid grid-cols-2 gap-3">
                            <Link href="/advertise" className="flex-1">
                                <button className="w-full bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-bold py-3 rounded-xl transition-colors text-sm flex items-center justify-center gap-2">
                                    <Plus size={18} /> Upload
                                </button>
                            </Link>
                            <Link href="/my-account/seller-account" className="flex-1">
                                <button className="w-full bg-white/10 hover:bg-white/20 text-white font-bold py-3 rounded-xl transition-colors text-sm">
                                    Studio
                                </button>
                            </Link>
                        </div>
                    </section>
                ) : (
                    <section className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-3xl p-8 text-white">
                        <h3 className="text-2xl font-black mb-2">Turn Notes into Cash 💸</h3>
                        <p className="text-indigo-100 text-sm mb-6">Your study guides could be worth thousands. Start your author journey today.</p>
                        <Link href="/become-seller">
                            <button className="w-full bg-white text-indigo-600 font-black py-4 rounded-2xl shadow-lg hover:scale-[1.02] transition-transform">
                                Start Selling Now
                            </button>
                        </Link>
                    </section>
                )}
            </div>
        </div>
    );

    const renderLibraryTab = () => (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">My Library</h2>
                <button className="flex items-center gap-2 px-4 py-2 border-2 border-gray-300 rounded-lg hover:bg-gray-50">
                    <Filter size={18} />
                    Filter by Course
                </button>
            </div>

            {library.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm p-12 text-center">
                    <BookOpen size={64} className="mx-auto text-gray-300 mb-4" />
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Your Library is Empty</h3>
                    <p className="text-gray-600 mb-6">Start building your collection by purchasing documents</p>
                    <Link href="/documents">
                        <button className="bg-blue-950 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-900">
                            Browse Documents
                        </button>
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {library.map((book) => (
                        <Link
                            key={book.bookId || book.id}
                            href={`/book/preview?id=${book.bookId || book.id}`}
                            className="group cursor-pointer"
                        >
                            <div className="aspect-[3/4] bg-gradient-to-br from-blue-100 to-blue-50 rounded-lg mb-2 group-hover:shadow-lg transition-shadow relative overflow-hidden">
                                <img
                                    src={book.thumbnail || book.image}
                                    alt={book.title}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                        e.target.src = 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400';
                                    }}
                                />
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                                    <Eye className="text-white opacity-0 group-hover:opacity-100 transition-opacity" size={32} />
                                </div>
                            </div>
                            <h4 className="font-semibold text-gray-900 text-sm mb-1 line-clamp-2">
                                {book.title}
                            </h4>
                            <p className="text-xs text-gray-500">{book.sellerName || book.author || 'Unknown Author'}</p>
                            <button className="mt-2 w-full text-xs bg-blue-950 text-white py-2 rounded-lg hover:bg-blue-900 transition-colors">
                                Open Document
                            </button>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );

    const renderWishlistTab = () => (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">My Wishlist</h2>
                <p className="text-gray-600">{wishlist.length} items</p>
            </div>

            {wishlist.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm p-12 text-center">
                    <Heart size={64} className="mx-auto text-gray-300 mb-4" />
                    <h3 className="text-xl font-bold text-gray-900 mb-2">No Saved Items</h3>
                    <p className="text-gray-600 mb-6">Save documents you're interested in to purchase later</p>
                    <Link href="/documents">
                        <button className="bg-blue-950 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-900">
                            Browse Documents
                        </button>
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {wishlist.map((item) => (
                        <div key={item.id} className="bg-white rounded-xl shadow-sm p-4 flex gap-4">
                            <div className="w-24 h-32 bg-gradient-to-br from-blue-100 to-blue-50 rounded-lg flex-shrink-0 overflow-hidden">
                                <img
                                    src={item.thumbnail || item.image}
                                    alt={item.title}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                        e.target.src = 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400';
                                    }}
                                />
                            </div>
                            <div className="flex-1">
                                <h4 className="font-semibold text-gray-900 mb-1">{item.title}</h4>
                                <p className="text-sm text-gray-600 mb-2">{item.author}</p>
                                <p className="text-lg font-bold text-blue-950 mb-3">₦{item.price?.toLocaleString()}</p>
                                <div className="flex gap-2">
                                    <Link href={`/payment?bookId=${item.id}`} className="flex-1">
                                        <button className="w-full bg-blue-950 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-900">
                                            Buy Now
                                        </button>
                                    </Link>
                                    <button className="px-4 py-2 border-2 border-gray-300 rounded-lg hover:bg-gray-50">
                                        <Heart size={18} className="text-red-500" fill="currentColor" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />

            {/* Mobile Search */}
            <div className="md:hidden bg-white border-b border-gray-200 px-4 py-3">
                <div className="flex items-center bg-gray-100 rounded-full px-4 py-2">
                    <Search className="w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search documents..."
                        className="bg-transparent border-none outline-none ml-2 w-full text-sm"
                    />
                </div>
            </div>

            <div className="flex max-w-7xl mx-auto">
                {/* Sidebar - Desktop */}
                <aside className="hidden lg:block w-64 bg-white border-r border-gray-200 min-h-[calc(100vh-64px)] sticky top-16">
                    <nav className="p-4 space-y-2">
                        <button
                            onClick={() => setActiveTab('home')}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium ${activeTab === 'home'
                                    ? 'text-blue-950 bg-blue-50'
                                    : 'text-gray-600 hover:bg-gray-50'
                                }`}
                        >
                            <Globe className="w-5 h-5" />
                            Home
                        </button>
                        <button
                            onClick={() => setActiveTab('library')}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium ${activeTab === 'library'
                                    ? 'text-blue-950 bg-blue-50'
                                    : 'text-gray-600 hover:bg-gray-50'
                                }`}
                        >
                            <BookOpen className="w-5 h-5" />
                            My Library
                        </button>
                        <button
                            onClick={() => setActiveTab('wishlist')}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium ${activeTab === 'wishlist'
                                    ? 'text-blue-950 bg-blue-50'
                                    : 'text-gray-600 hover:bg-gray-50'
                                }`}
                        >
                            <Heart className="w-5 h-5" />
                            Wishlist
                        </button>
                        <Link href="/documents">
                            <button className="w-full flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-lg">
                                <Search className="w-5 h-5" />
                                Browse All
                            </button>
                        </Link>
                        <Link href="/my-account">
                            <button className="w-full flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-lg">
                                <User className="w-5 h-5" />
                                Profile
                            </button>
                        </Link>

                        <div className="pt-4 border-t border-gray-200">
                            {user?.isSeller ? (
                                <Link href="/my-account/seller-account">
                                    <button className="w-full flex items-center gap-3 px-4 py-3 text-white bg-green-600 hover:bg-green-700 rounded-lg font-medium">
                                        <BarChart3 className="w-5 h-5" />
                                        Author Dashboard
                                    </button>
                                </Link>
                            ) : (
                                <Link href="/become-seller">
                                    <button className="w-full flex items-center gap-3 px-4 py-3 text-white bg-blue-950 hover:bg-blue-900 rounded-lg font-medium">
                                        <Store className="w-5 h-5" />
                                        Become a Seller
                                    </button>
                                </Link>
                            )}
                        </div>

                        <button
                            onClick={() => {
                                auth.signOut();
                                router.push('/auth/signin');
                            }}
                            className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg mt-auto"
                        >
                            <LogOut className="w-5 h-5" />
                            Logout
                        </button>
                    </nav>
                </aside>

                {/* Main Content */}
                <main className="flex-1 p-4 md:p-6 pb-24 lg:pb-6">
                    {activeTab === 'home' && renderHomeTab()}
                    {activeTab === 'library' && renderLibraryTab()}
                    {activeTab === 'wishlist' && renderWishlistTab()}
                </main>
            </div>

            {/* Bottom Navigation - Mobile */}
            <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-blue-950 border-t border-white/10 z-50 px-2 pb-safe">
                <div className="flex justify-around items-end py-3">
                    <button
                        onClick={() => setActiveTab('home')}
                        className={`flex flex-col items-center gap-1 transition-all duration-300 ${activeTab === 'home' ? 'text-white scale-110' : 'text-blue-300/50'
                            }`}
                    >
                        <Globe size={24} fill={activeTab === 'home' ? "currentColor" : "none"} />
                        <span className="text-[10px] font-bold">Home</span>
                        {activeTab === 'home' && <div className="w-1 h-1 bg-white rounded-full mt-1 animate-pulse"></div>}
                    </button>

                    <button
                        onClick={() => setActiveTab('library')}
                        className={`flex flex-col items-center gap-1 transition-all duration-300 ${activeTab === 'library' ? 'text-white scale-110' : 'text-blue-300/50'
                            }`}
                    >
                        <BookOpen size={24} fill={activeTab === 'library' ? "currentColor" : "none"} />
                        <span className="text-[10px] font-bold">Library</span>
                        {activeTab === 'library' && <div className="w-1 h-1 bg-white rounded-full mt-1 animate-pulse"></div>}
                    </button>

                    {/* Action Button (Upload) - The "Pop" Button */}
                    <Link href="/advertise" className="-translate-y-4">
                        <div className="bg-blue-500 p-4 rounded-2xl shadow-lg shadow-blue-500/40 active:scale-90 transition-transform border-4 border-blue-950">
                            <Plus size={24} className="text-white" strokeWidth={3} />
                        </div>
                    </Link>

                    {/* Earnings/Seller Button */}
                    {user?.isSeller ? (
                        <Link href="/my-account/seller-account">
                            <button className="flex flex-col items-center gap-1 text-blue-300/50">
                                <DollarSign size={24} />
                                <span className="text-[10px] font-bold">Earnings</span>
                            </button>
                        </Link>
                    ) : (
                        <button
                            onClick={() => setActiveTab('wishlist')}
                            className={`flex flex-col items-center gap-1 transition-all duration-300 ${activeTab === 'wishlist' ? 'text-white scale-110' : 'text-blue-300/50'
                                }`}
                        >
                            <Heart size={24} fill={activeTab === 'wishlist' ? "currentColor" : "none"} />
                            <span className="text-[10px] font-bold">Saved</span>
                            {activeTab === 'wishlist' && <div className="w-1 h-1 bg-white rounded-full mt-1 animate-pulse"></div>}
                        </button>
                    )}

                    {/* Profile Button */}
                    <Link href="/my-account">
                        <button className="flex flex-col items-center gap-1 text-blue-300/50 hover:text-white">
                            <User size={24} />
                            <span className="text-[10px] font-bold">Profile</span>
                        </button>
                    </Link>
                </div>
            </div>

            {/* Success Celebration Modal */}
            {showSuccessModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-blue-950/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl transform animate-in zoom-in-95 duration-300">
                        {/* Animated Icon Circle */}
                        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <CheckCircle size={48} className="text-green-600 animate-bounce" />
                        </div>

                        <h3 className="text-2xl font-black text-gray-900 mb-2">Upload Complete! 🚀</h3>
                        <p className="text-gray-600 mb-8">
                            Your document is being processed. You're now one step closer to earning from your hard work!
                        </p>

                        <div className="space-y-3">
                            <button
                                onClick={() => setShowSuccessModal(false)}
                                className="w-full bg-blue-950 text-white font-bold py-4 rounded-2xl hover:bg-blue-900 transition-all shadow-lg shadow-blue-900/20"
                            >
                                Back to Dashboard
                            </button>

                            <Link href="/advertise" onClick={() => setShowSuccessModal(false)}>
                                <button className="w-full bg-gray-50 text-gray-700 font-bold py-4 rounded-2xl hover:bg-gray-100 transition-all">
                                    Upload Another
                                </button>
                            </Link>
                        </div>

                        {/* Sharing is Caring */}
                        <div className="mt-6 pt-6 border-t border-gray-100">
                            <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-3">Share your link</p>
                            <div className="flex justify-center gap-4">
                                <div className="p-2 bg-blue-50 rounded-lg text-blue-600 cursor-pointer hover:bg-blue-100">
                                    <Globe size={20} />
                                </div>
                                <div className="p-2 bg-green-50 rounded-lg text-green-600 cursor-pointer hover:bg-green-100">
                                    <DollarSign size={20} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}