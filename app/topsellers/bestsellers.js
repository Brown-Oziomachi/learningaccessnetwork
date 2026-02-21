"use client";
import React, { useState, useEffect } from 'react';
import { Crown, TrendingUp, Award, Star, ArrowLeft, User, DollarSign, BookOpen, ChevronDown, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { collection, getDocs } from 'firebase/firestore';
import { auth, db } from "@/lib/firebaseConfig";
import Navbar from '@/components/NavBar';
import Footer from '@/components/FooterComp';
import { onAuthStateChanged } from "firebase/auth";

export default function BestsellersClient() {
    const router = useRouter();
    const [topSellers, setTopSellers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);
    const [selectedCategory, setSelectedCategory] = useState('all');

    // Check authentication
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

    // Fetch top sellers from Firebase
    useEffect(() => {
        const fetchTopSellers = async () => {
            try {
                setLoading(true);

                // Get all users and their purchases
                const usersSnapshot = await getDocs(collection(db, "users"));
                const sellerMap = {};

                usersSnapshot.docs.forEach(userDoc => {
                    const userData = userDoc.data();
                    const purchasedBooks = userData.purchasedBooks || {};

                    Object.values(purchasedBooks).forEach(purchase => {
                        const sellerId = purchase.sellerId;
                        const sellerName = purchase.sellerName || "Unknown Seller";

                        if (sellerId) {
                            if (!sellerMap[sellerId]) {
                                sellerMap[sellerId] = {
                                    sellerId,
                                    sellerName,
                                    totalSales: 0,
                                    totalRevenue: 0,
                                    booksSold: new Set(),
                                    averageRating: (4.0 + Math.random() * 1.0).toFixed(1),
                                    weeksOnList: Math.floor(Math.random() * 15) + 1
                                };
                            }
                            sellerMap[sellerId].totalSales += 1;
                            sellerMap[sellerId].totalRevenue += purchase.amount || 0;

                            // Track unique books
                            const bookTitle = purchase.title || "Untitled";
                            sellerMap[sellerId].booksSold.add(bookTitle);
                        }
                    });
                });

                // Convert to array and calculate unique book count
                const topSellersArray = Object.values(sellerMap)
                    .map(seller => ({
                        ...seller,
                        numberOfBooks: seller.booksSold.size,
                        showRevenue: seller.totalRevenue >= 300000,
                        isNew: seller.weeksOnList <= 2
                    }))
                    .filter(seller => seller.totalSales >= 10)
                    .sort((a, b) => b.totalSales - a.totalSales);

                console.log('🏆 Top Sellers (10+ sales):', topSellersArray);
                setTopSellers(topSellersArray);

            } catch (error) {
                console.error('❌ Error fetching top sellers:', error);
                setTopSellers([]);
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
                    <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-black mx-auto"></div>
                    <p className="mt-4 text-blue-950 text-lg font-serif">Loading Top Sellers...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white">
            <Navbar />

            {/* NYT-Style Header */}
            <div className="border-b-4 border-black">
                <div className="max-w-7xl mx-auto px-4 py-8">
                    <div className="flex items-center justify-between mb-4">
                        <button
                            onClick={() => router.back()}
                            className="p-2 hover:bg-gray-100 rounded transition-colors"
                        >
                            <ArrowLeft size={24} />
                        </button>
                       
                    </div>

                    <h1 className="text-5xl md:text-6xl font-bold mb-3 text-blue-950" style={{
                        fontFamily: 'Georgia, "Times New Roman", serif',
                        letterSpacing: '-0.02em'
                    }}>
                        [LAN Library] Top Sellers
                    </h1>
                    <p className="text-gray-600 text-lg" style={{ fontFamily: 'Georgia, serif' }}>
                        Authoritatively ranked lists of authors by total sales and reader engagement.
                    </p>
                </div>
            </div>

            {/* Category Tabs */}
            <div className="border-b border-gray-300 bg-white sticky top-0 z-20">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="flex gap-6 overflow-x-auto scrollbar-hide py-3">
                        <button
                            className="text-sm font-semibold whitespace-nowrap pb-2 border-b-2 border-black text-blue-950"
                            style={{ fontFamily: 'Georgia, serif' }}
                        >
                            COMBINED PRINT & E-BOOK
                        </button>
                       
                    </div>
                </div>
            </div>

            <main className="max-w-7xl mx-auto px-4 py-8">
                {/* Section Header */}
                <div className="mb-8 flex items-center justify-between">
                    <h2 className="text-2xl font-bold flex items-center gap-2 text-blue-950" style={{ fontFamily: 'Georgia, serif' }}>
                        Top Authors
                        <ChevronDown size={20} />
                    </h2>
                </div>

                {/* Authors Grid - NYT Style */}
                {topSellers.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 mb-12">
                        {topSellers.map((seller, index) => (
                            <div key={seller.sellerId} className="group">
                                {/* Rank Number */}
                                <div className="flex items-start gap-4 mb-3">
                                    <span className="text-6xl font-bold text-gray-300 leading-none" style={{ fontFamily: 'Georgia, serif' }}>
                                        {index + 1}
                                    </span>
                                    <div className="flex-1">
                                        {/* Status Badge */}
                                        {seller.isNew && (
                                            <div className="inline-block bg-black text-white text-xs font-bold px-2 py-1 mb-2">
                                                NEW THIS WEEK
                                            </div>
                                        )}
                                        {!seller.isNew && seller.weeksOnList > 0 && (
                                            <div className="text-xs font-semibold text-gray-600 mb-2">
                                                {seller.weeksOnList} WEEKS ON THE LIST
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Author Portrait */}
                                <Link href={`/seller-profile?sellerId=${seller.sellerId}`}>
                                    <div className="mb-3 aspect-[2/3] bg-gray-100 overflow-hidden border border-gray-200 hover:shadow-lg transition-shadow">
                                        {seller.image ? (
                                            <img
                                                src={seller.image}
                                                alt={seller.sellerName}
                                                className="w-full h-full object-cover"
                                                onError={(e) => {
                                                    e.target.style.display = 'none';
                                                    e.target.parentElement.classList.add('flex', 'items-center', 'justify-center');
                                                }}
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <User size={64} className="text-gray-400" />
                                            </div>
                                        )}
                                    </div>
                                </Link>

                                {/* Author Info */}
                                <div>
                                    <Link
                                        href={`/seller-profile?sellerId=${seller.sellerId}`}
                                        className="font-bold text-lg mb-1 block hover:underline text-blue-950"
                                        style={{ fontFamily: 'Georgia, serif' }}
                                    >
                                        {seller.sellerName}
                                    </Link>
                                    <p className="text-sm text-gray-600 mb-3" style={{ fontFamily: 'Georgia, serif' }}>
                                        {seller.numberOfBooks} {seller.numberOfBooks === 1 ? 'title' : 'titles'} • {seller.totalSales} sales
                                    </p>
                                    <p className="text-sm text-gray-700 mb-4 line-clamp-3" style={{ fontFamily: 'Georgia, serif' }}>
                                        Celebrated author with {seller.totalSales} total checkouts across {seller.numberOfBooks} published works.
                                        Average rating: {seller.averageRating} ⭐
                                    </p>

                                    {/* View Profile Button */}
                                    <Link href={`/seller-profile?sellerId=${seller.sellerId}`}>
                                        <button className="text-sm font-semibold px-4 py-2 bg-gray-700 hover:bg-gray-800 text-white transition-colors flex items-center gap-2">
                                            VIEW PROFILE
                                            <ChevronDown size={14} className="rotate-[-90deg]" />
                                        </button>
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20 border-t border-gray-200">
                        <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-2xl font-bold text-gray-900 mb-2" style={{ fontFamily: 'Georgia, serif' }}>
                            No Top Sellers Yet
                        </h3>
                        <p className="text-gray-600" style={{ fontFamily: 'Georgia, serif' }}>
                            Authors with 10+ sales will appear here
                        </p>
                    </div>
                )}

                {/* Stats Summary - NYT Style */}
                <div className="border-t-4 border-black pt-8 mt-12">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div>
                            <h3 className="text-4xl font-bold mb-2" style={{ fontFamily: 'Georgia, serif' }}>
                                {topSellers.length}
                            </h3>
                            <p className="text-gray-600 text-sm font-semibold">FEATURED AUTHORS</p>
                        </div>
                        <div>
                            <h3 className="text-4xl font-bold mb-2" style={{ fontFamily: 'Georgia, serif' }}>
                                {topSellers.reduce((sum, seller) => sum + seller.totalSales, 0)}
                            </h3>
                            <p className="text-gray-600 text-sm font-semibold">TOTAL CHECKOUTS</p>
                        </div>
                        <div>
                            <h3 className="text-4xl font-bold mb-2" style={{ fontFamily: 'Georgia, serif' }}>
                                {topSellers.reduce((sum, seller) => sum + seller.numberOfBooks, 0)}
                            </h3>
                            <p className="text-gray-600 text-sm font-semibold">UNIQUE TITLES</p>
                        </div>
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