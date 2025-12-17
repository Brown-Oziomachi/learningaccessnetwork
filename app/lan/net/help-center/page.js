'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Globe, Search, Book, CreditCard, Download, User, Shield, HelpCircle, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { auth } from "@/lib/firebaseConfig";
import { onAuthStateChanged } from 'firebase/auth';

export default function HelpCenterPage() {
     const router = useRouter();
    const [user, setUser] = useState(null);
    const [checkingAuth, setCheckingAuth] = useState(true);

    const helpCategories = [
        {
            icon: <Book size={32} />,
            title: "Getting Started",
            description: "Learn how to create an account and start exploring our library",
            articles: [
                { title: "Creating Your Account", link: "#" },
                { title: "Browsing the Library", link: "#" },
                { title: "Understanding Book Categories", link: "#" },
                { title: "Using the Search Function", link: "#" }
            ]
        },
        {
            icon: <CreditCard size={32} />,
            title: "Payments & Pricing",
            description: "Everything about purchasing books and payment methods",
            articles: [
                { title: "How to Purchase a Book", link: "#" },
                { title: "Accepted Payment Methods", link: "#" },
                { title: "Understanding Pricing", link: "#" },
                { title: "Refund Policy", link: "#" }
            ]
        },
        {
            icon: <Download size={32} />,
            title: "Downloads & Access",
            description: "Learn how to download and access your purchased books",
            articles: [
                { title: "Downloading Your PDFs", link: "#" },
                { title: "Accessing My Books", link: "#" },
                { title: "Multiple Device Access", link: "#" },
                { title: "Troubleshooting Downloads", link: "#" }
            ]
        },
        {
            icon: <User size={32} />,
            title: "Account Management",
            description: "Manage your account settings and preferences",
            articles: [
                { title: "Updating Profile Information", link: "#" },
                { title: "Changing Your Password", link: "#" },
                { title: "Email Preferences", link: "#" },
                { title: "Deleting Your Account", link: "#" }
            ]
        },
        {
            icon: <Shield size={32} />,
            title: "Security & Privacy",
            description: "Learn about our security measures and privacy policies",
            articles: [
                { title: "Data Protection", link: "#" },
                { title: "Privacy Policy", link: "#" },
                { title: "Terms of Service", link: "#" },
                { title: "Cookie Policy", link: "#" }
            ]
        },
        {
            icon: <HelpCircle size={32} />,
            title: "Technical Support",
            description: "Get help with technical issues and troubleshooting",
            articles: [
                { title: "PDF Won't Open", link: "#" },
                { title: "Payment Failed", link: "#" },
                { title: "Can't Access My Books", link: "#" },
                { title: "Website Not Loading", link: "#" }
            ]
        }
    ];

    const popularArticles = [
        { title: "How do I purchase a book?", category: "Payments", link: "#" },
        { title: "Where can I find my downloaded books?", category: "Downloads", link: "#" },
        { title: "How do I reset my password?", category: "Account", link: "#" },
        { title: "What payment methods do you accept?", category: "Payments", link: "#" },
        { title: "Can I access books on multiple devices?", category: "Access", link: "#" }
    ];

     useEffect(() => {
                const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
                    if (currentUser) {
                        setUser(currentUser);
                        await fetchPurchasedBooks(currentUser.uid);
                    } else {
                        router.push('/auth/signin');
                    }
                });
        
                return () => unsubscribe();
     }, [router]);
    
    if (checkingAuth) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="animate-spin h-12 w-12 border-b-2 border-blue-950 rounded-full mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white">
            {/* Header */}
            <header className="bg-blue-950 text-white shadow-lg">
                <div className="max-w-7xl mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <Link href="/" className="flex items-center gap-2">
                            <Globe className="w-8 h-8 text-white" />
                            <h1 className="text-xl md:text-2xl font-bold">
                                LEARNING <span className="text-blue-400">ACCESS</span>
                            </h1>
                        </Link>
                        <Link href="/" className="text-blue-400 hover:text-white transition-colors">
                            Back to Home
                        </Link>
                    </div>
                </div>
            </header>

            {/* Hero Section */}
            <div className="bg-gradient-to-br from-blue-950 to-blue-950 text-white py-20">
                <div className="max-w-4xl mx-auto px-4 text-center">
                    <HelpCircle className="w-20 h-20 mx-auto mb-6" />
                    <h1 className="text-5xl md:text-6xl font-bold mb-6">
                        How can we help you?
                    </h1>
                    <p className="text-xl text-blue-200 mb-10">
                        Search our knowledge base or browse categories below
                    </p>
                </div>
            </div>

            {/* Popular Articles */}
            <section className="max-w-7xl mx-auto px-4 py-12 -mt-12">
                <div className="bg-white rounded-xl shadow-xl p-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">Popular Articles</h2>
                    <div className="space-y-3">
                        {popularArticles.map((article, index) => (
                            <motion.a
                                key={index}
                                href={article.link}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className="flex items-center justify-between p-4 rounded-lg hover:bg-blue-50 transition-colors group"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-2 h-2 rounded-full bg-blue-950"></div>
                                    <div>
                                        <p className="font-semibold text-gray-900 group-hover:text-blue-950">
                                            {article.title}
                                        </p>
                                        <p className="text-sm text-gray-600">{article.category}</p>
                                    </div>
                                </div>
                                <ArrowRight className="text-gray-400 group-hover:text-blue-950" size={20} />
                            </motion.a>
                        ))}
                    </div>
                </div>
            </section>

            {/* Help Categories */}
            <section className="max-w-7xl mx-auto px-4 py-12">
                <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Get Help Center</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {helpCategories.map((category, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow"
                        >
                            <div className="bg-blue-950 text-white w-16 h-16 rounded-lg flex items-center justify-center mb-4">
                                {category.icon}
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">
                                {category.title}
                            </h3>
                            <p className="text-gray-600 mb-4 text-sm">
                                {category.description}
                            </p>
                            <ul className="space-y-2">
                                {category.articles.map((article, articleIndex) => (
                                    <li key={articleIndex}>
                                        <a
                                            href={article.link}
                                            className="text-blue-950 hover:underline text-sm flex items-center gap-2"
                                        >
                                            <ArrowRight size={14} />
                                            {article.title}
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* Contact Support */}
            <section className="bg-blue-50 py-16">
                <div className="max-w-4xl mx-auto px-4 text-center">
                    <h2 className="text-3xl font-bold text-gray-900 mb-4">
                        Still need help?
                    </h2>
                    <p className="text-gray-700 mb-8 text-lg">
                        Can't find what you're looking for? Our support team is here to assist you.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link
                            href="/contact/lan/4/enquiry"
                            className="bg-blue-950 text-white px-8 py-4 rounded-lg hover:bg-blue-900 transition-colors font-semibold inline-flex items-center justify-center gap-2"
                        >
                            Contact Support
                            <ArrowRight size={20} />
                        </Link>
                        <Link
                            href="/lan/faqs"
                            className="bg-white border-2 border-blue-950 text-blue-950 px-8 py-4 rounded-lg hover:bg-blue-50 transition-colors font-semibold inline-flex items-center justify-center gap-2"
                        >
                            View FAQs
                            <ArrowRight size={20} />
                        </Link>
                    </div>
                </div>
            </section>

            {/* Quick Tips */}
            <section className="max-w-7xl mx-auto px-4 py-12">
                <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Quick Tips</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 ">
                    <div className="bg-gradient-to-br from-blue-950 to-blue-950 p-6 rounded-xl">
                        <div className="bg-blue-900/50 text-white w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                            💡
                        </div>
                        <h3 className="font-bold text-gray-50 mb-2">Pro Tip</h3>
                        <p className="text-gray-400 text-sm">
                            Download books to your device for offline reading anytime, anywhere.
                        </p>
                    </div>
                    <div className="bg-gradient-to-br from-blue-950 to-blue-950 p-6 rounded-xl">
                        <div className="bg-blue-900/50 text-white w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                            ⚡
                        </div>
                        <h3 className="font-bold text-gray-50 mb-2">Did You Know?</h3>
                        <p className="text-gray-400 text-sm">
                            You can access your purchased books on unlimited devices with one account.
                        </p>
                    </div>
                    <div className="bg-gradient-to-br from-blue-950 to-blue-950 p-6 rounded-xl">
                        <div className="bg-blue-900/50 text-white w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                            🎯
                        </div>
                        <h3 className="font-bold text-gray-50 mb-2">Best Practice</h3>
                        <p className="text-gray-400 text-sm">
                            Use the search function to quickly find books by title, author, or category.
                        </p>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-blue-950 text-white mt-16">
                <div className="max-w-7xl mx-auto px-4 py-12">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                        <div>
                            <div className="flex items-center gap-2 mb-4">
                                <Globe className="w-8 h-8" />
                                <h3 className="text-xl font-bold">LEARNING ACCESS</h3>
                            </div>
                            <p className="text-gray-300 text-sm">
                                Digital PDF library making knowledge easily accessible to everyone.
                            </p>
                        </div>
                        <div>
                            <h4 className="font-bold mb-4">Quick Links</h4>
                            <ul className="space-y-2 text-sm">
                                <li><Link href="/about/lan" className="text-gray-300 hover:text-white">About Us</Link></li>
                                <li><Link href="/lan/explains/how-it-works" className="text-gray-300 hover:text-white">How It Works</Link></li>
                                <li><Link href="/lan/faqs" className="text-gray-300 hover:text-white">FAQs</Link></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-bold mb-4">Categories</h4>
                            <ul className="space-y-2 text-sm">
                                <li><Link href="/category/education" className="text-gray-300 hover:text-white">Education</Link></li>
                                <li><Link href="/category/business" className="text-gray-300 hover:text-white">Business</Link></li>
                                <li><Link href="/category/technology" className="text-gray-300 hover:text-white">Technology</Link></li>
                                <li><Link href="/category/personal-development" className="text-gray-300 hover:text-white">Personal Development</Link></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-bold mb-4">Support</h4>
                            <ul className="space-y-2 text-sm">
                                <li><Link href="/lan/net/help-center" className="text-gray-300 hover:text-white">Help Center</Link></li>
                                <li><Link href="/contact/lan/4/enquiry" className="text-gray-300 hover:text-white">Contact Us</Link></li>
                                <li><Link href="/lan/faqs" className="text-gray-300 hover:text-white">FAQs</Link></li>
                            </ul>
                        </div>
                    </div>
                    <div className="border-t border-blue-800 mt-8 pt-8 text-center text-sm text-gray-300">
                        <p>&copy; 2025 Learning Access Network. All rights reserved.</p>
                    </div>
                </div>
            </footer>
        </div>
    );
}