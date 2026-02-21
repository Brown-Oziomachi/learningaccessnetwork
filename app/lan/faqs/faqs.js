'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Share2, BookOpen, Users, Download, Library } from 'lucide-react';
import Link from 'next/link';
import Navbar from '@/components/NavBar';
import Footer from '@/components/FooterComp';

export default function FAQClient() {
    const [openIndex, setOpenIndex] = useState('0-0');

    const toggleQuestion = (categoryIndex, questionIndex) => {
        const index = `${categoryIndex}-${questionIndex}`;
        setOpenIndex(openIndex === index ? null : index);
    };

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
                }
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

    return (
        <div className="min-h-screen bg-white">
            <Navbar />

            {/* Hero Section */}
            <section className="bg-gradient-to-br from-gray-50 to-white py-16 md:py-24 px-4">
                <div className="max-w-7xl mx-auto">
                    <div className="grid md:grid-cols-2 gap-12 items-center">
                        <div className="order-2 md:order-1">
                            <p className="text-gray-400 text-sm font-semibold mb-3 uppercase tracking-widest">
                                Share & Earn
                            </p>
                            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 mb-6 leading-tight">
                                Share LAN Library,<br />
                                and earn ₦500
                            </h1>
                            <p className="text-gray-600 text-lg md:text-xl mb-8 leading-relaxed max-w-lg">
                                Good knowledge is meant to be shared. Invite friends to LAN Library and they'll unlock the privilege to sell their own books. Help your friends earn while sharing educational resources with the community.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4">
                                <Link href="/referrals">
                                    <button className="bg-blue-950 text-white px-8 py-4 rounded-xl font-semibold hover:bg-blue-900 transition-all hover:shadow-lg transform hover:-translate-y-0.5">
                                        Get your link
                                    </button>
                                </Link>
                                <Link href="/documents">
                                    <button className="bg-blue-50 text-blue-950 px-8 py-4 rounded-xl font-semibold hover:bg-blue-100 transition-all flex items-center justify-center gap-2">
                                        <Library size={20} />
                                        Browse Library
                                    </button>
                                </Link>
                            </div>
                        </div>
                        <div className="order-1 md:order-2 relative">
                            <div className="relative overflow-hidden">
                                <img
                                    src="/earn.png"
                                    alt="Students sharing knowledge"
                                    className="w-full h-[400px] md:h-[550px] "
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-blue-950/20 to-transparent"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* FAQ Section */}
            <section className="py-20 md:py-28 px-4 bg-white">
                <div className="max-w-7xl mx-auto">
                    <div className="grid lg:grid-cols-12 gap-12 lg:gap-16">
                        {/* Left Side - Sticky Title */}
                        <div className="lg:col-span-4">
                            <div className="lg:sticky lg:top-45">
                                <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
                                    Frequently asked questions
                                </h2>
                            </div>
                        </div>

                        {/* Right Side - FAQ Items */}
                        <div className="lg:col-span-8">
                            <div className="space-y-1">
                                {faqs.map((category, categoryIndex) => (
                                    <div key={categoryIndex}>
                                        {category.questions.map((faq, questionIndex) => {
                                            const index = `${categoryIndex}-${questionIndex}`;
                                            const isOpen = openIndex === index;

                                            return (
                                                <motion.div
                                                    key={index}
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    transition={{ delay: questionIndex * 0.03 }}
                                                    className="border-b border-gray-200 last:border-b-0"
                                                >
                                                    <button
                                                        onClick={() => toggleQuestion(categoryIndex, questionIndex)}
                                                        className="w-full flex items-center justify-between py-6 text-left group hover:bg-gray-50 px-2 -mx-2 rounded-lg transition-all"
                                                    >
                                                        <span className="font-semibold text-gray-900 pr-8 text-base md:text-lg group-hover:text-blue-950 transition-colors">
                                                            {faq.question}
                                                        </span>
                                                        <div
                                                            className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center transition-all duration-300 ${isOpen
                                                                ? 'bg-blue-950 rotate-180'
                                                                : 'bg-blue-100 rotate-0 group-hover:bg-blue-200'
                                                                }`}
                                                        >
                                                            <ChevronDown
                                                                className={`transition-colors ${isOpen ? 'text-white' : 'text-blue-950'
                                                                    }`}
                                                                size={18}
                                                            />
                                                        </div>
                                                    </button>
                                                    <AnimatePresence>
                                                        {isOpen && (
                                                            <motion.div
                                                                initial={{ height: 0, opacity: 0 }}
                                                                animate={{ height: 'auto', opacity: 1 }}
                                                                exit={{ height: 0, opacity: 0 }}
                                                                transition={{ duration: 0.3, ease: 'easeInOut' }}
                                                                className="overflow-hidden"
                                                            >
                                                                <div className="pb-6 px-2">
                                                                    <p className="text-gray-600 leading-relaxed text-base pr-12">
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
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Still Need Help Section */}
            <section className="py-20 px-4 bg-gray-50">
                <div className="max-w-4xl mx-auto text-center">
                    <h3 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                        Still need help?
                    </h3>
                    <p className="text-gray-600 text-lg mb-10 max-w-2xl mx-auto">
                        Can't find the answer you're looking for? Our support team is here to help you.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link href="/contact/lan/4/enquiry">
                            <button className="bg-blue-950 text-white px-8 py-4 rounded-xl hover:bg-blue-900 transition-all font-semibold hover:shadow-lg transform hover:-translate-y-0.5">
                                Contact Support
                            </button>
                        </Link>
                        <Link href="/lan/net/help-center">
                            <button className="bg-white border-2 border-blue-950 text-blue-950 px-8 py-4 rounded-xl hover:bg-blue-50 transition-all font-semibold">
                                Visit Help Center
                            </button>
                        </Link>
                    </div>
                </div>
            </section>

            <Footer />
        </div>
    );
}