'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Search, Globe, HelpCircle } from 'lucide-react';
import Link from 'next/link';

export default function FAQPage() {
    const [searchQuery, setSearchQuery] = useState('');
    const [openIndex, setOpenIndex] = useState(null);

    const faqs = [
        {
            category: "Getting Started",
            questions: [
                {
                    question: "How do I create an account?",
                    answer: "To create an account, click on the 'Sign In' button at the top right corner, then select 'Create new account'. You can sign up using your Google account or email address. Fill in your details including name, date of birth, and email, then create a password."
                },
                {
                    question: "Is Learning Access Network free to use?",
                    answer: "Creating an account and browsing our library is completely free. However, purchasing and downloading PDF books requires payment. Each book is priced individually, and you get lifetime access to any book you purchase."
                },
                {
                    question: "What payment methods do you accept?",
                    answer: "We accept various payment methods including credit/debit cards, bank transfers. All payments are processed securely through our payment partners."
                }
            ]
        },
        {
            category: "Purchasing & Downloads",
            questions: [
                {
                    question: "How do I purchase a book?",
                    answer: "Browse our library, select a book you're interested in, and click 'Purchase & Access'. Review the book details and price, then click 'Proceed to Payment'. After successful payment, the PDF will be sent to your registered email and will be available in your 'My Books' section."
                },
                {
                    question: "Where can I find my purchased books?",
                    answer: "All your purchased books are available in the 'My Books' section. Click on 'My Books' in the header menu to access your library. You can download your PDFs anytime from there."
                },
                {
                    question: "Can I download books multiple times?",
                    answer: "Yes! Once you purchase a book, you have lifetime access. You can download it as many times as you need from your 'My Books' section."
                },
                {
                    question: "What format are the books in?",
                    answer: "All our books are in PDF format, which can be read on any device including computers, tablets, and smartphones using a PDF reader."
                },
                {
                    question: "Can I get a refund if I'm not satisfied?",
                    answer: "Due to the digital nature of our products, we cannot offer refunds once a PDF has been downloaded. However, we encourage you to read the book description and preview (if available) before purchasing."
                }
            ]
        },
        {
            category: "Account Management",
            questions: [
                {
                    question: "How do I reset my password?",
                    answer: "Click on 'Sign In', then select 'Forgotten password?'. Enter your registered email address and we'll send you a password reset link. Follow the instructions in the email to create a new password."
                },
                {
                    question: "Can I change my email address?",
                    answer: "You can update your email in your account settings under 'Account' > 'Settings'. However, note that your purchased books are tied to the email used during purchase. To access your books after changing your email, you must log in with the original email used when buying them."
                },

                {
                    question: "How do I upload my own PDF books?",
                    answer: "To have your books added, please contact Learning Access Network through the 'Advertise with us' section and provide your book details. LAN will review your submission and upload the book to the category you provide."
                },

            ]
        },
        {
            category: "Technical Support",
            questions: [
                {
                    question: "I didn't receive my PDF after purchase. What should I do?",
                    answer: "First, check your spam/junk folder. If you still can't find it, go to 'My Books' section where all your purchases are stored. If the book is not there, contact our support team with your transaction details."
                },
                {
                    question: "The PDF won't open. How can I fix this?",
                    answer: "Make sure you have a PDF reader installed on your device. We recommend Adobe Acrobat Reader (free) or your device's built-in PDF viewer. If the problem persists, try downloading the file again from 'My Books'."
                },
                {
                    question: "Can I read books on multiple devices?",
                    answer: "Yes! Your purchased books are tied to your email account, not your device. You can sign in to your account on any device and access your books from 'My Books' section."
                }
            ]
        },
        {
            category: "Categories & Search",
            questions: [
                {
                    question: "What categories of books do you offer?",
                    answer: "We offer books in various categories including Education, Personal Development, Business, Technology, Science, Literature, Health & Wellness, History, and Arts & Culture. You can browse books by category using the menu bar."
                },
                {
                    question: "How do I search for a specific book?",
                    answer: "Use the search bar at the top of the page. You can search by book title, author name, or keywords. You can also filter results by category, price, and rating."
                }
            ]
        }
    ];

    const filteredFaqs = faqs.map(category => ({
        ...category,
        questions: category.questions.filter(faq =>
            faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
            faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
        )
    })).filter(category => category.questions.length > 0);

    const toggleQuestion = (categoryIndex, questionIndex) => {
        const index = `${categoryIndex}-${questionIndex}`;
        setOpenIndex(openIndex === index ? null : index);
    };

    return (
        <div className="min-h-screen bg-white">
            {/* Header */}
            <header className="bg-white text-white shadow-lg">
                <div className="max-w-7xl mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <Link href="/" className="flex items-center gap-2">
                            <Globe className="w-8 h-8 text-white" />
                            <h1 className="text-xl md:text-2xl font-bold">
                              <span className='bg-blue-950 text-white'>LEARNING</span> <span className="text-blue-950 bg-white">ACCESS NETWORK</span>
                            </h1>
                        </Link>
                      
                    </div>
                </div>
            </header>

            {/* Hero Section */}
            <div className="bg-gradient-to-br from-blue-950 to-blue-950 text-white py-16">
                <div className="max-w-4xl mx-auto px-4 text-center">
                    <HelpCircle className="w-16 h-16 mx-auto mb-4" />
                    <h1 className="text-4xl md:text-5xl font-bold mb-4">
                        Frequently Asked Questions
                    </h1>
                    <p className="text-xl text-blue-200 mb-8">
                        Find answers to common questions about Learning Access Network
                    </p>

                    {/* Search Bar */}
                    <div className="relative max-w-2xl mx-auto">
                        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder="Search for answers..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full text-white pl-12 pr-4 py-4 rounded-lg border focus:outline-none"
                        />
                    </div>
                </div>
            </div>

            {/* FAQ Content */}
            <main className="max-w-4xl mx-auto px-4 py-12">
                {filteredFaqs.length > 0 ? (
                    <div className="space-y-8">
                        {filteredFaqs.map((category, categoryIndex) => (
                            <div key={categoryIndex}>
                                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                                    {category.category}
                                </h2>
                                <div className="space-y-3">
                                    {category.questions.map((faq, questionIndex) => {
                                        const index = `${categoryIndex}-${questionIndex}`;
                                        const isOpen = openIndex === index;

                                        return (
                                            <motion.div
                                                key={questionIndex}
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: questionIndex * 0.1 }}
                                                className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow"
                                            >
                                                <button
                                                    onClick={() => toggleQuestion(categoryIndex, questionIndex)}
                                                    className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
                                                >
                                                    <span className="font-semibold text-gray-900 pr-4">
                                                        {faq.question}
                                                    </span>
                                                    <ChevronDown
                                                        className={`flex-shrink-0 text-blue-950 transition-transform ${isOpen ? 'transform rotate-180' : ''
                                                            }`}
                                                        size={20}
                                                    />
                                                </button>
                                                <AnimatePresence>
                                                    {isOpen && (
                                                        <motion.div
                                                            initial={{ height: 0, opacity: 0 }}
                                                            animate={{ height: 'auto', opacity: 1 }}
                                                            exit={{ height: 0, opacity: 0 }}
                                                            transition={{ duration: 0.3 }}
                                                        >
                                                            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                                                                <p className="text-gray-700 leading-relaxed">
                                                                    {faq.answer}
                                                                </p>
                                                            </div>
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </motion.div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-16">
                        <p className="text-gray-600 text-lg mb-4">
                            No results found for "{searchQuery}"
                        </p>
                        <button
                            onClick={() => setSearchQuery('')}
                            className="text-blue-950 hover:underline font-semibold"
                        >
                            Clear search
                        </button>
                    </div>
                )}

                {/* Still Need Help */}
                <div className="mt-16 bg-blue-50 border border-blue-200 rounded-lg p-8 text-center">
                    <h3 className="text-2xl font-bold text-gray-900 mb-4">
                        Still need help?
                    </h3>
                    <p className="text-gray-700 mb-6">
                        Can't find the answer you're looking for? Our support team is here to help.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link
                            href="/contact/lan/4/enquiry"
                            className="bg-blue-950 text-white px-6 py-3 rounded-lg hover:bg-blue-900 transition-colors font-semibold"
                        >
                            Contact Support
                        </Link>
                        <Link
                            href="/lan/net/help-center"
                            className="bg-white border-2 border-blue-950 text-blue-950 px-6 py-3 rounded-lg hover:bg-blue-50 transition-colors font-semibold"
                        >
                            Visit Help Center
                        </Link>
                    </div>
                </div>
            </main>
        </div>
    );
}