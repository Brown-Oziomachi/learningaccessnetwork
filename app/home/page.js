"use client"
import React, { useState, useEffect } from 'react';
import { FileText, Monitor, Upload, Smartphone, Globe, ArrowRight, ChevronRight } from 'lucide-react';
import Navbar from '@/components/NavBar';
import { onAuthStateChanged } from 'firebase/auth';
import { useRouter } from "next/navigation";
import { auth} from "@/lib/firebaseConfig";
import HomeLoading from './loading';

export default function HomePage() {
    const [purchasedBookIds, setPurchasedBookIds] = useState(new Set());
    const [user, setUser] = useState({ uid: 'demo-user' });
    const [loading, setLoading] = useState(true);
    const [allBooks, setAllBooks] = useState([]);
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
            name: 'Health & Wellness',
            subcategories: 6,
            image: 'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?w=400',
            description: 'Medical, fitness, and mental health'
        },
        {
            name: 'Biography & Memoir',
            subcategories: 4,
            image: 'https://images.unsplash.com/photo-1524578271613-d550eacf6090?w=400',
            description: 'Life stories and personal narratives'
        },
        {
            name: 'Science',
            subcategories: 9,
            image: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=400',
            description: 'Research, discoveries, and exploration'
        },
        {
            name: 'Arts & Culture',
            subcategories: 5,
            image: 'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=400',
            description: 'Creative expression and cultural studies'
        },
        {
            name: 'History',
            subcategories: 6,
            image: 'https://images.unsplash.com/photo-1461360370896-922624d12aa1?w=400',
            description: 'Historical events and civilizations'
        },
        {
            name: 'Relationship',
            subcategories: 6,
            image: 'https://images.unsplash.com/photo-1529333166437-7750a6dd5a70?w=400',
            description: 'Love, marriage, dating, communication, and personal connections'
        }

    ];

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

    useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false)
    }, 2000)

    return () => clearTimeout(timer)
  }, [])

  if (loading) {
    return <HomeLoading />
  }
    return (
        <div className="min-h-screen bg-white">
            {/* Navbar */}
            <Navbar/>

            {/* Hero Section */}
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 py-16">
                <div className="max-w-7xl mx-auto px-4">
                    <h1 className="text-4xl md:text-6xl font-extrabold text-gray-900 mb-6">
                        You've seen it all, now understand it all.
                    </h1>
                    <p className="text-lg md:text-xl text-gray-700 max-w-4xl">
                        Make sense of anything with information on just about everything, shared by a global community of thinkers.
                    </p>
                </div>
            </div>

            {/* Categories Grid */}
            <main className="max-w-7xl mx-auto px-4 py-12">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 ">
                    {categories.map((category, index) => (
                        <a 
                            key={index}
                            href={`/category/${category.name.toLowerCase().replace(/ & /g, '-').replace(/ /g, '-')}`}
                            className="group bg-white border border-gray-200  overflow-hidden hover:shadow-xl transition-all duration-300"
                        >
                            <div className="p-6 bg-gray-100">
                                <h3 className="text-xl font-bold text-gray-900 mb-2">
                                    {category.name}
                                </h3>
                                <p className="text-sm text-gray-600 mb-4">
                                    {category.subcategories} categories
                                </p>
                                
                                <div className="flex items-center text-blue-950 font-medium group-hover:gap-3 transition-all">
                                    View all 
                                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                                </div>
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

                {/* Explore All Link */}
                <div className="text-center mt-12">
                    <a 
                        href="/pdf" 
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

                        <a 
                            href="/advertise" 
                            className="bg-blue-950 hover:bg-blue-800 transition-colors text-white font-semibold px-8 py-4 rounded-lg shadow-md text-lg"
                        >
                            Upload documents
                        </a>
                    </div>
                </div>
            </div>

           
            {/* Footer */}
            <footer className="bg-blue-950 text-white py-12">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                        <div>
                            <div className="flex items-center gap-2 mb-4">
                                <Globe className="w-8 h-8" />
                                <h3 className="text-xl font-bold">LEARNING ACCESS</h3>
                            </div>
                            <p className="text-gray-400 text-sm">
                                Digital PDF library making knowledge accessible to everyone.
                            </p>
                        </div>
                        <div>
                            <h4 className="font-bold mb-4">Quick Links</h4>
                            <ul className="space-y-2 text-sm">
                                <li><a href="/about/lan" className="text-gray-400 hover:text-white">About Us</a></li>
                                <li><a href="/lan/explains/how-it-works" className="text-gray-400 hover:text-white">How It Works</a></li>
                                <li><a href="/lan/faqs" className="text-gray-400 hover:text-white">FAQs</a></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-bold mb-4">Categories</h4>
                            <ul className="space-y-2 text-sm">
                                <li><a href="/category/education" className="text-gray-400 hover:text-white">Education</a></li>
                                <li><a href="/category/business" className="text-gray-400 hover:text-white">Business</a></li>
                                <li><a href="/pdf" className="text-gray-400 hover:text-white">All Books</a></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-bold mb-4">Customer Service</h4>
                            <ul className="space-y-2 text-sm">
                                <li><a href="/my-account" className="text-gray-400 hover:text-white">My Account</a></li>
                                <li><a href="/my-books" className="text-gray-400 hover:text-white">My Books</a></li>
                            </ul>
                        </div>
                    </div>
                    <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-400">
                        <p>&copy; 2025 Learning Access Network. All rights reserved.</p>
                    </div>
                </div>
            </footer>
        </div>
    );
}