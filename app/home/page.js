"use client"
import React, { useState, useEffect } from 'react';
import { FileText, Monitor, Upload, Smartphone, Globe, ArrowRight, ChevronRight } from 'lucide-react';
import Navbar from '@/components/NavBar';
import { onAuthStateChanged } from 'firebase/auth';
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebaseConfig";
import { doc, getDoc } from 'firebase/firestore';
import HomeLoading from './loading';
import MobileCategoriesCarousel from '@/components/MobileCategoriesCarousel';
import InstitutionalLibraryPage from '@/components/InstitutionalLib';
import Footer from '@/components/FooterComp';

export default function HomePage() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [allBooks, setAllBooks] = useState([]);
    const [isSeller, setIsSeller] = useState(false);
    const [checkingSeller, setCheckingSeller] = useState(true);
    const router = useRouter();

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

    const Institutionalcategories = [
        {
            name: 'Universities',
            subcategories: 8,
            image: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=400',
            description: 'Academic resources and learning materials'
        },
        {
            name: 'Secondary School',
            subcategories: 12,
            image: 'https://images.unsplash.com/photo-1516397281156-ca07cf9746fc?w=400',
            description: 'Self-improvement and personal growth'
        },
        {
            name: 'Primary School',
            subcategories: 12,
            image: 'https://images.unsplash.com/photo-1516397281156-ca07cf9746fc?w=400',
            description: 'Self-improvement and personal growth'
        },
        {
            name: 'Weac/Neco Past Questions ',
            subcategories: 12,
            image: 'https://images.unsplash.com/photo-1516397281156-ca07cf9746fc?w=400',
            description: 'Self-improvement and personal growth'
        },
    ]

    // Check seller status
    const checkSellerStatus = async (userId) => {
        try {
            setCheckingSeller(true);
            console.log("Checking seller status for user:", userId);

            const userDocRef = doc(db, 'users', userId);
            const userDoc = await getDoc(userDocRef);

            if (userDoc.exists()) {
                const userData = userDoc.data();
                const isUserSeller = userData.isSeller === true;
                console.log("User is seller:", isUserSeller);
                setIsSeller(isUserSeller);
            } else {
                console.log("User document not found");
                setIsSeller(false);
            }
        } catch (error) {
            console.error("Error checking seller status:", error);
            setIsSeller(false);
        } finally {
            setCheckingSeller(false);
        }
    };

    // Auth state listener
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (currentUser) {
                setUser(currentUser);
                await checkSellerStatus(currentUser.uid);
            } else {
                router.push('/auth/signin');
            }
        });

        return () => unsubscribe();
    }, [router]);

    // Handle upload button click
    const HandleClick = () => {
        console.log("Button clicked, isSeller:", isSeller);

        if (!user) {
            router.push('/auth/signin');
            return;
        }

        if (isSeller) {
            router.push('/advertise');
        } else {
            router.push('/become-seller');
        }
    };

    // Mock books data
    useEffect(() => {
        const mockBooks = [
            {
                id: '1',
                title: 'Introduction to Machine Learning',
                author: 'Dr. Sarah Johnson',
                category: 'Technology',
                price: 5000,
                image: 'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?w=400',
                rating: 4.8,
                reviews: 245
            },
            {
                id: '2',
                title: 'The Digital Marketing Handbook',
                author: 'Michael Chen',
                category: 'Business',
                price: 4500,
                image: 'https://images.unsplash.com/photo-1533750349088-cd871a92f312?w=400',
                rating: 4.6,
                reviews: 189
            },
            {
                id: '3',
                title: 'Modern Educational Psychology',
                author: 'Dr. Emily Roberts',
                category: 'Education',
                price: 3500,
                image: 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=400',
                rating: 4.7,
                reviews: 312
            }
        ];
        setAllBooks(mockBooks);
    }, []);

    // Loading timer
    useEffect(() => {
        const timer = setTimeout(() => {
            setLoading(false);
        }, 2000);

        return () => clearTimeout(timer);
    }, []);

    if (loading) {
        return <HomeLoading />;
    }

    return (
        <div className="min-h-screen bg-white">
            {/* Navbar */}
            <Navbar />

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

            {/* Categories Section */}
            <main className="max-w-7xl mx-auto px-4 py-12">
                {/* Desktop Categories Grid - Hidden on mobile */}
                <div className="hidden lg:grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {categories.map((category, index) => (
                        <a
                            key={index}
                            href={`/category/${category.name.toLowerCase().replace(/ & /g, '-').replace(/ /g, '-')}`}
                            className="group bg-white border border-gray-200 overflow-hidden hover:shadow-xl transition-all duration-300"
                        >
                            <div className="p-6 bg-gray-100">
                                <h3 className="text-xl font-bold text-gray-900 mb-2">
                                    {category.name}
                                </h3>
                                <p className="text-sm text-gray-600 mb-4">
                                    {category.subcategories} categories
                                </p>

                              
                            </div>

                            <div className="relative h-48 overflow-hidden">
                                <img
                                    src={category.image}
                                    alt={category.name}
                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                />
                            </div>
                        </a>
                    ))}
                </div>

                {/* Mobile Categories Carousel - Only visible on mobile */}
                <MobileCategoriesCarousel />

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

            {/* Upload Section */}
            <div className="bg-gray-50 py-16">
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
        </div>
    );
}