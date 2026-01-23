"use client";

import { UserPlus, Search, CreditCard, Download, BookOpen, Shield, Clock, Smartphone } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

export default function HowItWorksPage() {
    const steps = [
        {
            icon: UserPlus,
            title: 'Create Your Account',
            description: 'Sign up in seconds with just your email address. No lengthy forms or complicated verification processes. Your account is instantly ready to use.',
            features: ['Free registration', 'Secure authentication', 'Instant access'],
            imgSrc: '/step1.png',
        },
        {
            icon: Search,
            title: 'Browse Our Library',
            description: 'Explore over 10,000 carefully curated digital books across multiple categories. Use our powerful search and filter tools to find exactly what you need.',
            features: ['Advanced search', 'Category filters', 'Personalized recommendations'],
            imgSrc: '/image1.png',

        },
        {
            icon: CreditCard,
            title: 'Make Secure Payment',
            description: 'Purchase books instantly with our secure payment system. We support multiple payment methods including cards, bank transfers, and mobile money.',
            features: ['Secure transactions', 'Multiple payment options', 'Instant confirmation'],
            imgSrc: '/image1.png',

        },
        {
            icon: Download,
            title: 'Download & Read',
            description: 'Access your purchased books immediately. Download PDFs to any device and read offline anytime, anywhere. Your books are yours forever.',
            features: ['Instant download', 'Lifetime access', 'Multiple device support'],
            imgSrc: '/image1.png',
        }
    ];

    const features = [
        {
            icon: BookOpen,
            title: 'Extensive Library',
            description: 'Access thousands of books across education, business, technology, personal development, and more.'
        },
        {
            icon: Shield,
            title: 'Secure & Safe',
            description: 'Industry-standard encryption protects your personal information and payment details at all times.'
        },
        {
            icon: Clock,
            title: '24/7 Availability',
            description: 'Browse, purchase, and download books anytime, anywhere. Our platform never sleeps.'
        },
        {
            icon: Smartphone,
            title: 'Multi-Device Access',
            description: 'Read on any device - desktop, tablet, or smartphone. Your library syncs across all platforms.'
        }
    ];

    const faqs = [
        {
            q: 'How long does it take to access a book after purchase?',
            a: 'Instantly! As soon as your payment is confirmed, you can download your book immediately from your "My Books" section.'
        },
        {
            q: 'Can I download the same book multiple times?',
            a: 'Absolutely! Once purchased, you have lifetime access to download your books as many times as you need.'
        },
        {
            q: 'What payment methods do you accept?',
            a: 'We accept credit/debit cards, bank transfers, and mobile money payments for your convenience.'
        },
        {
            q: 'Are the books available in different formats?',
            a: 'Most books are available in PDF format, which works on all devices. Some books may also be available in EPUB or MOBI formats.'
        }
    ];

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Hero Section */}
            <div className="bg-blue-950 text-white py-20">
                <div className="max-w-7xl mx-auto px-4 text-center">
                    <h1 className="text-5xl md:text-6xl font-bold mb-6">
                        How It Works
                    </h1>
                    <p className="text-xl md:text-2xl text-blue-100 max-w-3xl mx-auto leading-relaxed">
                        Getting started with Learning Access Network is simple and straightforward. Follow these easy steps to begin your learning journey.
                    </p>
                </div>
            </div>

            {/* Steps Section */}
            <div className="py-20">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="grid gap-16">
                        {steps.map((step, index) => (
                            <div key={index} className="grid md:grid-cols-2 gap-8 items-center">
                                <div className={`${index % 2 === 1 ? 'md:order-2' : ''}`}>
                                    <div className="flex items-center gap-4 mb-6">
                                        <div className="w-16 h-16 bg-blue-950 rounded-full flex items-center justify-center flex-shrink-0">
                                            <step.icon className="w-8 h-8 text-white" />
                                        </div>
                                        <div>
                                            <div className="text-sm font-bold text-blue-600 mb-1">
                                                STEP {index + 1}
                                            </div>
                                            <h2 className="text-3xl font-bold text-gray-900">
                                                {step.title}
                                            </h2>
                                        </div>
                                    </div>
                                    <p className="text-lg text-gray-700 mb-6 leading-relaxed">
                                        {step.description}
                                    </p>
                                    <ul className="space-y-3">
                                        {step.features.map((feature, fIndex) => (
                                            <li key={fIndex} className="flex items-center gap-3">
                                                <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                                                    <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                    </svg>
                                                </div>
                                                <span className="text-gray-700">{feature}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                <div className={`relative ${index % 2 === 1 ? 'md:order-1' : ''}`}>
                                    <div className=" rounded-2xl p-8 h-80 flex items-center justify-center">
                                        <step.icon className="w-32 h-32 text-blue-950 opacity-20" />
                                        <Image
                                            src={step.imgSrc}
                                            alt="Step Illustration"
                                            width={160}
                                            height={160}
                                            className="absolute  h-80 w-150 opacity-100 object-contain"
                                            priority
                                        />
                                    </div>
                                   </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Features Grid */}
            <div className="py-20 bg-white">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold text-gray-900 mb-4">
                            Why Choose Our Platform?
                        </h2>
                        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                            We've built the ultimate digital library experience with features that matter most to our users
                        </p>
                    </div>
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {features.map((feature, index) => (
                            <div key={index} className="text-center">
                                <div className="w-20 h-20 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                                    <feature.icon className="w-10 h-10 text-blue-950" />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-3">
                                    {feature.title}
                                </h3>
                                <p className="text-gray-600 leading-relaxed">
                                    {feature.description}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Video/Demo Section */}
            <div className="py-20 bg-gray-50">
                <div className="max-w-5xl mx-auto px-4">
                    <div className="text-center mb-12">
                        <h2 className="text-4xl font-bold text-gray-900 mb-4">
                            See It In Action
                        </h2>
                        <p className="text-xl text-gray-600">
                            Watch how easy it is to find and purchase your next book
                        </p>
                    </div>
                    <div className="bg-gradient-to-br from-blue-950 to-blue-950 rounded-2xl aspect-video flex items-center justify-center shadow-2xl">
                        <div className="text-center text-white">
                            <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M8 5v14l11-7z" />
                                </svg>
                            </div>
                            <p className="text-xl font-semibold">Demo Video Coming Soon</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick FAQs */}
            <div className="py-20 bg-white">
                <div className="max-w-4xl mx-auto px-4">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold text-gray-900 mb-4">
                            Quick Answers
                        </h2>
                        <p className="text-xl text-gray-600">
                            Common questions about how our platform works
                        </p>
                    </div>
                    <div className="space-y-6">
                        {faqs.map((faq, index) => (
                            <div key={index} className="bg-gray-50 rounded-xl p-6">
                                <h3 className="text-lg font-bold text-gray-900 mb-3">
                                    {faq.q}
                                </h3>
                                <p className="text-gray-700 leading-relaxed">
                                    {faq.a}
                                </p>
                            </div>
                        ))}
                    </div>
                    <div className="text-center mt-12">
                        <Link
                            href="/joins/lan-faqs"
                            className="text-blue-600 font-semibold hover:text-blue-700 inline-flex items-center gap-2"
                        >
                            View All FAQs
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </Link>
                    </div>
                </div>
            </div>

            {/* CTA Section */}
            <div className="py-20 bg-blue-950 text-white">
                <div className="max-w-4xl mx-auto px-4 text-center">
                    <h2 className="text-4xl font-bold mb-6">
                        Ready to Get Started?
                    </h2>
                    <p className="text-xl text-blue-100 mb-8 leading-relaxed">
                        Join thousands of learners who are already transforming their knowledge with our platform
                    </p>
                    <Link
                        href="/auth/signin"
                        className="inline-block bg-white text-blue-950 px-8 py-4 rounded-lg font-semibold hover:bg-blue-50 transition-colors text-lg"
                    >
                        Create Your Free Account
                    </Link>
                    <p className="mt-4 text-blue-200 text-sm">
                        Already have an account?{' '}
                        <Link href="/auth/signin" className="underline hover:text-white">
                            Sign in here
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}