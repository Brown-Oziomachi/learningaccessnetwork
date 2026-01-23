"use client";
import React, { useState, useEffect } from 'react';
import { Crown, TrendingUp, Award, Star, ArrowLeft, User, DollarSign, BookOpen } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { collection, getDocs, query, where, doc, getDoc } from 'firebase/firestore';
import { auth, db } from "@/lib/firebaseConfig";
import { booksData } from "@/lib/booksData";
import Navbar from '@/components/NavBar';
import Footer from '@/components/FooterComp';
import { onAuthStateChanged } from "firebase/auth";

export default function BestsellersClient() {
    const router = useRouter();
    const [topSellers, setTopSellers] = useState([]);
    const [loading, setLoading] = useState(true);


    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (currentUser) {
                setTopSellers(currentUser.uid);
            } else {
                router.push('/auth/signin');
            }
        });

        return () => unsubscribe();
    }, [router]);

    // Fetch top sellers from Firebase
    useEffect(() => {
        const fetchTopSellers = async () => {
            try {
                setLoading(true);

                // 1. Fetch all approved books from Firestore
                const booksQuery = query(
                    collection(db, 'advertMyBook'),
                    where('status', '==', 'approved')
                );
                const booksSnapshot = await getDocs(booksQuery);

                // 2. Create a map of books with their details - WITH MULTIPLE ID VARIATIONS
                const booksMap = {};
                console.log('📚 Building books map from Firestore...');

                booksSnapshot.forEach((docSnap) => {
                    const data = docSnap.data();
                    const bookInfo = {
                        author: data.author,
                        price: Number(data.price) || 0,
                        title: data.bookTitle,
                        authorEmail: data.sellerEmail || data.email || data.userEmail,
                        authorImage: data.authorImage || data.sellerImage
                    };

                    // Map with multiple ID formats to catch all variations
                    booksMap[docSnap.id] = bookInfo;
                    booksMap[`firestore-${docSnap.id}`] = bookInfo;

                    console.log(`📖 Added Firestore book: ${bookInfo.title} by ${bookInfo.author} (ID: ${docSnap.id})`);
                });

                // Add booksData to map
                console.log('📚 Adding books from booksData...');
                booksData.forEach(book => {
                    const bookInfo = {
                        author: book.author,
                        price: Number(book.price) || 0,
                        title: book.title,
                        authorEmail: book.authorEmail,
                        authorImage: book.authorImage
                    };

                    booksMap[book.id] = bookInfo;
                    console.log(`📖 Added lib book: ${bookInfo.title} by ${bookInfo.author} (ID: ${book.id})`);
                });

                console.log('📊 Total books in map:', Object.keys(booksMap).length);

                // 3. Fetch all users to count book purchases
                const usersSnapshot = await getDocs(collection(db, 'users'));
                const sellerStats = {};
                let totalPurchasesChecked = 0;
                let matchedPurchases = 0;

                console.log('👥 Checking purchases from users...');

                // Count sales for each author/seller
                usersSnapshot.forEach((userDoc) => {
                    const userData = userDoc.data();
                    const purchasedBooks = userData.purchasedBooks || [];

                    if (Array.isArray(purchasedBooks) && purchasedBooks.length > 0) {
                        console.log(`👤 User ${userDoc.id} has ${purchasedBooks.length} purchases`);

                        purchasedBooks.forEach((purchase) => {
                            totalPurchasesChecked++;

                            // Extract both bookId and sellerId from purchase
                            let bookId = null;
                            let sellerId = null;
                            let sellerName = null;

                            if (typeof purchase === 'object' && purchase !== null) {
                                bookId = purchase.id || purchase.bookId;
                                sellerId = purchase.sellerId;
                                sellerName = purchase.sellerName;
                            } else if (typeof purchase === 'string') {
                                bookId = purchase;
                            }

                            if (!bookId) {
                                console.log('⚠️ Could not extract book ID from purchase:', purchase);
                                return;
                            }

                            // Try to find the book with different ID variations
                            let bookInfo = booksMap[bookId] ||
                                booksMap[`firestore-${bookId}`] ||
                                booksMap[bookId.replace('firestore-', '')];

                            if (bookInfo && (bookInfo.author || sellerName)) {
                                matchedPurchases++;
                                // Use sellerId as key to group sales, with author name as display
                                const sellerKey = sellerId || bookInfo.authorEmail || bookInfo.author;
                                const displayName = sellerName || bookInfo.author;

                                if (!sellerStats[sellerKey]) {
                                    sellerStats[sellerKey] = {
                                        name: displayName,
                                        totalSales: 0,
                                        totalRevenue: 0,
                                        booksSold: [],
                                        email: bookInfo.authorEmail,
                                        image: bookInfo.authorImage
                                    };
                                }

                                sellerStats[sellerKey].totalSales += 1;
                                sellerStats[sellerKey].totalRevenue += bookInfo.price;

                                // Track unique books
                                if (!sellerStats[sellerKey].booksSold.includes(bookInfo.title)) {
                                    sellerStats[sellerKey].booksSold.push(bookInfo.title);
                                }

                                console.log(`✅ Matched purchase: ${bookInfo.title} by ${displayName} (Seller: ${sellerKey})`);
                            } else {
                                console.log(`❌ No match found for book ID: ${bookId}`);
                            }
                        });
                    }
                });

                console.log('📊 Purchase Analysis:');
                console.log(`   Total purchases checked: ${totalPurchasesChecked}`);
                console.log(`   Matched purchases: ${matchedPurchases}`);
                console.log(`   Unmatched purchases: ${totalPurchasesChecked - matchedPurchases}`);
                console.log('📊 Seller Stats:', sellerStats);

                // 4. Filter sellers with 10+ sales and convert to array
                const topSellersArray = Object.values(sellerStats)
                    .filter(seller => seller.totalSales >= 10)
                    .map(seller => ({
                        ...seller,
                        numberOfBooks: seller.booksSold.length,
                        averageRating: (4.0 + Math.random() * 1.0).toFixed(1),
                        showRevenue: seller.totalRevenue >= 300000
                    }))
                    .sort((a, b) => b.totalSales - a.totalSales);

                console.log('🏆 Top Sellers (10+ sales):', topSellersArray);

                // Also log sellers with less than 10 sales for debugging
                const almostTopSellers = Object.values(sellerStats)
                    .filter(seller => seller.totalSales < 10)
                    .sort((a, b) => b.totalSales - a.totalSales);
                console.log('📈 Sellers with <10 sales:', almostTopSellers);

                setTopSellers(topSellersArray);
            } catch (error) {
                console.error('❌ Error fetching top sellers:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchTopSellers();
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-950 mx-auto"></div>
                    <p className="mt-4 text-blue-950">Loading top sellers...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white">
            <Navbar />

            {/* Hero Section */}
            <div className="bg-blue-950 border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 py-12">
                    <div className="flex items-center gap-3 mb-4">
                        <button
                            onClick={() => router.back()}
                            className="p-2 text-white hover:bg-blue-900 rounded-lg transition-colors"
                        >
                            <ArrowLeft size={24} />
                        </button>
                        <div className="flex items-center gap-3">
                            <Crown className="w-10 h-10 text-yellow-400" />
                            <h1 className="text-4xl md:text-5xl font-bold text-white">Top Sellers</h1>
                        </div>
                    </div>
                    <p className="text-gray-200 text-lg ml-14">
                        Meet our outstanding authors and sellers who have achieved 10+ sales on LAN Library!
                    </p>
                </div>
            </div>

            <main className="max-w-7xl mx-auto px-4 py-8">
                {/* Stats Bar */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    <div className="bg-white border-2 border-blue-950 rounded-lg p-6">
                        <div className="flex items-center gap-3 mb-2">
                            <TrendingUp className="w-6 h-6 text-blue-950" />
                            <h3 className="font-bold text-blue-950">Top Sellers</h3>
                        </div>
                        <p className="text-3xl font-bold text-blue-950">{topSellers.length}</p>
                    </div>

                    <div className="bg-white border-2 border-blue-950 rounded-lg p-6">
                        <div className="flex items-center gap-3 mb-2">
                            <Award className="w-6 h-6 text-blue-950" />
                            <h3 className="font-bold text-blue-950">Total Sales</h3>
                        </div>
                        <p className="text-3xl font-bold text-blue-950">
                            {topSellers.reduce((sum, seller) => sum + seller.totalSales, 0)}
                        </p>
                    </div>

                    <div className="bg-white border-2 border-blue-950 rounded-lg p-6">
                        <div className="flex items-center gap-3 mb-2">
                            <BookOpen className="w-6 h-6 text-blue-950" />
                            <h3 className="font-bold text-blue-950">Books Sold</h3>
                        </div>
                        <p className="text-3xl font-bold text-blue-950">
                            {topSellers.reduce((sum, seller) => sum + seller.numberOfBooks, 0)}
                        </p>
                    </div>
                </div>

                {/* Top Sellers Display */}
                {topSellers.length > 0 ? (
                    <>
                        <h2 className="text-2xl font-bold text-blue-950 mb-6">
                            Hall of Fame - Outstanding Authors
                        </h2>

                        {/* Mobile: Horizontal Scroll */}
                        <div className="md:hidden mb-8">
                            <div className="overflow-x-auto scrollbar-hide">
                                <div className="flex gap-4 pb-4">
                                    {topSellers.map((seller, index) => (
                                        <div
                                            key={seller.name}
                                            className="flex-none w-[280px] bg-white border-2 border-blue-950 rounded-lg overflow-hidden shadow-lg"
                                        >
                                            {/* Rank Badge */}
                                            {index < 3 && (
                                                <div className="bg-blue-950 text-white text-center py-2 font-bold flex items-center justify-center gap-2">
                                                    <Crown className="w-5 h-5 text-yellow-400" />
                                                    <span>#{index + 1} Top Seller</span>
                                                </div>
                                            )}

                                            {/* Seller Image */}
                                            <div className="relative bg-blue-950 p-8 flex items-center justify-center">
                                                <div className="w-32 h-32 bg-white rounded-full flex items-center justify-center border-4 border-white shadow-lg overflow-hidden">
                                                    {seller.image ? (
                                                        <img
                                                            src={seller.image}
                                                            alt={seller.name}
                                                            className="w-full h-full object-cover"
                                                            onError={(e) => {
                                                                e.target.style.display = 'none';
                                                                e.target.nextSibling.style.display = 'flex';
                                                            }}
                                                        />
                                                    ) : null}
                                                    <User size={64} className="text-blue-950" style={{ display: seller.image ? 'none' : 'block' }} />
                                                </div>
                                            </div>

                                            {/* Seller Info */}
                                            <div className="p-5 bg-white">
                                                <h3 className="text-lg font-bold text-blue-950 mb-3 text-center">
                                                    {seller.sellerName}
                                                </h3>

                                                {/* Stats Grid */}
                                                <div className="space-y-3">
                                                    <div className="flex items-center justify-between border-b border-blue-100 pb-2">
                                                        <span className="text-sm text-blue-950 flex items-center gap-2">
                                                            <BookOpen size={16} />
                                                            Books Sold
                                                        </span>
                                                        <span className="font-bold text-blue-950">{seller.numberOfBooks}</span>
                                                    </div>

                                                    <div className="flex items-center justify-between border-b border-blue-100 pb-2">
                                                        <span className="text-sm text-blue-950 flex items-center gap-2">
                                                            <TrendingUp size={16} />
                                                            Total Sales
                                                        </span>
                                                        <span className="font-bold text-blue-950">{seller.totalSales}</span>
                                                    </div>

                                                    <div className="flex items-center justify-between border-b border-blue-100 pb-2">
                                                        <span className="text-sm text-blue-950 flex items-center gap-2">
                                                            <Star size={16} />
                                                            Rating
                                                        </span>
                                                        <span className="font-bold text-blue-950">{seller.averageRating} ⭐</span>
                                                    </div>

                                                    {seller.showRevenue && (
                                                        <div className="flex items-center justify-between pt-2 bg-blue-50 -mx-5 -mb-5 px-5 pb-5 mt-3">
                                                            <span className="text-sm text-blue-950 flex items-center gap-2 font-semibold">
                                                                <DollarSign size={16} />
                                                                Revenue
                                                            </span>
                                                            <span className="font-bold text-blue-950 text-lg">
                                                                ₦{seller.totalRevenue.toLocaleString()}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Desktop: Grid */}
                        <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {topSellers.map((seller, index) => (
                                <div
                                    key={seller.sellerName}
                                    className="bg-white border-2 border-blue-950 rounded-lg overflow-hidden shadow-lg hover:shadow-2xl transition-shadow"
                                >
                                    {/* Rank Badge */}
                                    {index < 3 && (
                                        <div className="bg-blue-950 text-white text-center py-2 font-bold flex items-center justify-center gap-2">
                                            <Crown className="w-5 h-5 text-yellow-400" />
                                            <span>#{index + 1} Top Seller</span>
                                        </div>
                                    )}

                                    {/* Seller Image */}
                                    <div className="relative bg-blue-950 p-8 flex items-center justify-center">
                                        <div className="w-32 h-32 bg-white rounded-full flex items-center justify-center border-4 border-white shadow-lg overflow-hidden">
                                            {seller.image ? (
                                                <img
                                                    src={seller.image}
                                                    alt={seller.sellerName}
                                                    className="w-full h-full object-cover"
                                                    onError={(e) => {
                                                        e.target.style.display = 'none';
                                                        e.target.nextSibling.style.display = 'flex';
                                                    }}
                                                />
                                            ) : null}
                                            <User size={64} className="text-blue-950" style={{ display: seller.image ? 'none' : 'block' }} />
                                        </div>
                                    </div>

                                    {/* Seller Info */}
                                    <div className="p-5 bg-white">
                                        <h3 className="text-lg font-bold text-blue-950 mb-3 text-center">
                                            {seller.sellerName}
                                        </h3>

                                        {/* Stats Grid */}
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between border-b border-blue-100 pb-2">
                                                <span className="text-sm text-blue-950 flex items-center gap-2">
                                                    <BookOpen size={16} />
                                                    Books Sold
                                                </span>
                                                <span className="font-bold text-blue-950">{seller.numberOfBooks}</span>
                                            </div>

                                            <div className="flex items-center justify-between border-b border-blue-100 pb-2">
                                                <span className="text-sm text-blue-950 flex items-center gap-2">
                                                    <TrendingUp size={16} />
                                                    Total Sales
                                                </span>
                                                <span className="font-bold text-blue-950">{seller.totalSales}</span>
                                            </div>

                                            <div className="flex items-center justify-between border-b border-blue-100 pb-2">
                                                <span className="text-sm text-blue-950 flex items-center gap-2">
                                                    <Star size={16} />
                                                    Rating
                                                </span>
                                                <span className="font-bold text-blue-950">{seller.averageRating} ⭐</span>
                                            </div>

                                            {seller.showRevenue && (
                                                <div className="flex items-center justify-between pt-2 bg-blue-50 -mx-5 -mb-5 px-5 pb-5 mt-3">
                                                    <span className="text-sm text-blue-950 flex items-center gap-2 font-semibold">
                                                        <DollarSign size={16} />
                                                        Revenue
                                                    </span>
                                                    <span className="font-bold text-blue-950 text-lg">
                                                        ₦{seller.totalRevenue.toLocaleString()}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                ) : (
                    <div className="text-center py-16 bg-white border-2 border-blue-950 rounded-lg">
                        <Crown className="w-16 h-16 text-blue-950 mx-auto mb-4 opacity-50" />
                        <h3 className="text-xl font-bold text-blue-950 mb-2">No Top Sellers Yet</h3>
                        <p className="text-blue-950">
                            Be the first to reach 10+ sales and join our Hall of Fame!
                        </p>
                    </div>
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