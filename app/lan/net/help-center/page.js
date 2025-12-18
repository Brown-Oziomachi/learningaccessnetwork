'use client';

import React, { useState } from 'react';
import { Globe, Search, Book, CreditCard, Download, User, Shield, HelpCircle, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function HelpCenterPage() {
    const [searchQuery, setSearchQuery] = useState('');

    const helpCategories = [
        {
            icon: <Book size={32} />,
            title: "Getting Started",
            description: "Learn how to create an account and start exploring our library",
            articles: [
                { 
                    title: "Creating Your Account", 
                    slug: "creating-your-account"  // 👈 Use slug instead of full link
                },
                { 
                    title: "Browsing the Library", 
                    slug: "browsing-the-library" 
                },
                { 
                    title: "Understanding Book Categories", 
                    slug: "understanding-book-categories" 
                },
                { 
                    title: "Using the Search Function", 
                    slug: "using-search-function" 
                }
            ]
        },
        {
            icon: <CreditCard size={32} />,
            title: "Payments & Pricing",
            description: "Everything about purchasing books and payment methods",
            articles: [
                { title: "How to Purchase a Book", slug: "how-to-purchase-book" },
                { title: "Accepted Payment Methods", slug: "payment-methods" },
                { title: "Understanding Pricing", slug: "understanding-pricing" },
                { title: "Refund Policy", slug: "refund-policy" }
            ]
        },
        {
            icon: <Download size={32} />,
            title: "Downloads & Access",
            description: "Learn how to download and access your purchased books",
            articles: [
                { title: "Downloading Your PDFs", slug: "downloading-pdfs" },
                { title: "Accessing My Books", slug: "accessing-my-books" },
                { title: "Multiple Device Access", slug: "multiple-device-access" },
                { title: "Troubleshooting Downloads", slug: "troubleshooting-downloads" }
            ]
        },
        {
            icon: <User size={32} />,
            title: "Account Management",
            description: "Manage your account settings and preferences",
            articles: [
                { title: "Updating Profile Information", slug: "updating-profile" },
                { title: "Changing Your Password", slug: "changing-password" },
                { title: "Email Preferences", slug: "email-preferences" },
                { title: "Deleting Your Account", slug: "deleting-account" }
            ]
        },
        {
            icon: <Shield size={32} />,
            title: "Security & Privacy",
            description: "Learn about our security measures and privacy policies",
            articles: [
                { title: "Data Protection", slug: "data-protection" },
                { title: "Privacy Policy", slug: "privacy-policy" },
                { title: "Terms of Service", slug: "terms-of-service" },
                { title: "Cookie Policy", slug: "cookie-policy" }
            ]
        },
        {
            icon: <HelpCircle size={32} />,
            title: "Technical Support",
            description: "Get help with technical issues and troubleshooting",
            articles: [
                { title: "PDF Won't Open", slug: "pdf-wont-open" },
                { title: "Payment Failed", slug: "payment-failed" },
                { title: "Can't Access My Books", slug: "cant-access-books" },
                { title: "Website Not Loading", slug: "website-not-loading" }
            ]
        }
    ];
    return (
        <div className="min-h-screen bg-white">
            {/* Header */}
            <header className="bg-blue-950 text-white shadow-lg">
                <div className="max-w-7xl mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <Link href="/" className="flex items-center gap-2">
                            <Globe className="w-8 h-8 text-white" />
                            <h1 className="text-xl md:text-2xl font-bold">
                                LEARNING <span className="text-blue-400">ACCESS NETWORK</span>
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

                    {/* Search Bar */}
                    <div className="relative max-w-2xl mx-auto border">
                        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={24} />
                        <input
                            type="text"
                            placeholder="Search for articles, topics, or questions..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full text-white pl-14 pr-4 py-5 rounded-xl text-gray-900 text-lg "
                        />
                    </div>
                </div>
            </div>

            {/* Popular Articles */}
          

            {/* Help Categories */}
           <section className="max-w-7xl mx-auto px-4 py-12">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {helpCategories.map((category, index) => (
                        <div key={index} className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow">
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
                                        <Link
                                            href={`/lan/net/help-center/article/${article.slug}`}
                                            className="text-blue-950 hover:underline text-sm flex items-center gap-2"
                                        >
                                            <ArrowRight size={14} />
                                            {article.title}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
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
                            href="/joins/lan-faqs"
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
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-blue-950 p-6 rounded-xl">
                        <div className="bg-blue-950 text-white w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                            💡
                        </div>
                        <h3 className="font-bold text-gray-400 mb-2">Pro Tip</h3>
                        <p className="text-gray-100 text-sm">
                            Download books to your device for offline reading anytime, anywhere.
                        </p>
                    </div>
                    <div className="bg-blue-950 p-6 rounded-xl">
                        <div className="bg-blue-950 text-white w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                            ⚡
                        </div>
                        <h3 className="font-bold text-gray-400 mb-2">Did You Know?</h3>
                        <p className="text-gray-200 text-sm">
                            You can access your purchased books on unlimited devices with one account.
                        </p>
                    </div>
                    <div className="bg-blue-950 p-6 rounded-xl">
                        <div className="bg-blue-950 text-white w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                            🎯
                        </div>
                        <h3 className="font-bold text-gray-400 mb-2">Best Practice</h3>
                        <p className="text-gray-200 text-sm">
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
                                <h3 className="text-xl font-bold">LEARNING ACCESS NETWORK</h3>
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
                                <li><Link href="/contact/lan/4/enquiry" className="text-gray-300 hover:text-white">Contact</Link></li>
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