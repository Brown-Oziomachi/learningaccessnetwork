"use client";

import { useState, useEffect, useRef } from 'react';
import { BookOpen, Users, Globe, Target, Award, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { onAuthStateChanged} from 'firebase/auth';
import { auth } from "@/lib/firebaseConfig";
import { useRouter } from 'next/navigation';
import Navbar from '@/components/NavBar';
import Footer from '@/components/FooterComp';

export default function AboutPage() {
        const router = useRouter();
    const [user, setUser] = useState(null);
    const [counts, setCounts] = useState({
        books: 0,
        readers: 0,
        countries: 0,
        rating: 0
    });

    const [hasAnimated, setHasAnimated] = useState(false);
    const statsRef = useRef(null);

    const stats = [
        {
            icon: BookOpen,
            value: 1000,
            suffix: '+',
            label: 'Digital Books',
            key: 'books'
        },
        {
            icon: Users,
            value: 500,
            suffix: '+',
            label: 'Active Readers',
            key: 'readers'
        },
        {
            icon: Globe,
            value: 10,
            suffix: '+',
            label: 'Countries Reached',
            key: 'countries'
        },
        {
            icon: Award,
            value: 4.8,
            suffix: '/5',
            label: 'User Rating',
            key: 'rating',
            isDecimal: true
        }
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
    
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && !hasAnimated) {
                    setHasAnimated(true);
                    animateCounters();
                }
            },
            { threshold: 0.5 }
        );

        if (statsRef.current) {
            observer.observe(statsRef.current);
        }

        return () => observer.disconnect();
    }, [hasAnimated]);

    const animateCounters = () => {
        const duration = 2000; // 2 seconds
        const steps = 60;
        const interval = duration / steps;

        stats.forEach((stat) => {
            let currentCount = 0;
            const increment = stat.value / steps;

            const timer = setInterval(() => {
                currentCount += increment;

                if (currentCount >= stat.value) {
                    currentCount = stat.value;
                    clearInterval(timer);
                }

                setCounts(prev => ({
                    ...prev,
                    [stat.key]: stat.isDecimal
                        ? currentCount.toFixed(1)
                        : Math.floor(currentCount)
                }));
            }, interval);
        });
    };

    const formatStatValue = (stat) => {
        const value = counts[stat.key];
        if (stat.isDecimal) {
            return `${value}${stat.suffix}`;
        }
        return `${value.toLocaleString()}${stat.suffix}`;
    };

    const values = [
        {
            icon: BookOpen,
            title: 'Knowledge Accessibility',
            description: 'We believe that knowledge should be accessible to everyone, regardless of their location or economic status. Our platform bridges the gap between readers and quality educational content.'
        },
        {
            icon: Users,
            title: 'Community First',
            description: 'Our community of readers, authors, and educators drives everything we do. We foster meaningful connections and collaborative learning experiences that transcend traditional boundaries.'
        },
        {
            icon: Target,
            title: 'Quality Excellence',
            description: 'Every book in our library is carefully curated to ensure the highest standards of content quality, relevance, and educational value for our diverse global audience.'
        },
        {
            icon: TrendingUp,
            title: 'Continuous Innovation',
            description: 'We continuously evolve our platform with cutting-edge technology to provide the best reading experience, from instant downloads to personalized recommendations.'
        }
    ];

    const team = [
        {
            name: 'Dr. Amaka Okonkwo',
            role: 'Founder & CEO',
            bio: 'Ph.D. in Educational Technology with 15+ years experience in digital learning platforms.'
        },
        {
            name: 'Chukwuma Adebayo',
            role: 'Chief Technology Officer',
            bio: 'Former senior engineer at leading tech companies, passionate about educational innovation.'
        },
        {
            name: 'Ngozi Okoli',
            role: 'Head of Content',
            bio: 'Published author and literary expert with extensive background in academic publishing.'
        },
        {
            name: 'Oluwaseun Bello',
            role: 'Director of Operations',
            bio: 'Business strategist focused on scaling education platforms across emerging markets.'
        }
    ];

    return (
        <div className="min-h-screen">
            {/* Hero Section */}
            <Navbar />
            <div
                className="relative text-blue-950  py-24"
               
            >
                <div className="absolute inset-0 text-blue-950"></div>
                <div className="max-w-7xl mx-auto px-4 relative z-10">
                    <div className="max-w-3xl">
                        <h1 className="text-5xl md:text-6xl font-bold mb-6">
                            Empowering Minds Through Digital Learning
                        </h1>
                        <p className="text-xl text-blue-950 leading-relaxed">
                            Learning Access Network (LAN) is revolutionizing how people access knowledge by providing a comprehensive digital library of high-quality educational content to learners worldwide.
                        </p>
                    </div>
                </div>
            </div>

            {/* Stats Section with Animation */}
            <div ref={statsRef} className="bg-white py-16 shadow-sm">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                        {stats.map((stat, index) => (
                            <div key={index} className="text-center">
                                <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                                    <stat.icon className="w-8 h-8 text-blue-950" />
                                </div>
                                <div className="text-3xl font-bold text-blue-950 mb-2">
                                    {formatStatValue(stat)}
                                </div>
                                <div className="text-gray-600">{stat.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Our Story Section */}
            <div className="py-20 bg-gray-50">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="grid md:grid-cols-2 gap-12 items-center">
                        <div>
                            <h2 className="text-4xl font-bold text-gray-900 mb-6">
                                Our Story
                            </h2>
                            <div className="space-y-4 text-gray-700 leading-relaxed">
                                <p>
                                    Founded in 2025, Learning Access Network emerged from a simple yet powerful vision: to democratize access to quality educational content across Africa and beyond. Our founders, a team of educators and technologists, recognized the growing digital divide in education and set out to bridge this gap.
                                </p>
                                <p>
                                    What started as a small collection of 500 carefully selected educational PDFs has grown into a comprehensive digital library serving over 500 active readers across 10 countries. We've partnered with leading publishers, independent authors, and educational institutions to bring diverse, high-quality content to our platform.
                                </p>
                                <p>
                                    Today, LAN stands as a testament to the power of technology in education. We've facilitated millions of downloads, enabled countless learning journeys, and continue to expand our mission of making knowledge universally accessible and affordable.
                                </p>
                            </div>
                        </div>
                        <div className="relative h-96 rounded-2xl overflow-hidden shadow-2xl">
                            <img
                                src="https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=800&q=80"
                                alt="Students learning"
                                className="w-full h-full object-cover"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Core Values */}
            <div className="py-20 bg-white">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold text-gray-900 mb-4">
                            Our Core Values
                        </h2>
                        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                            These principles guide every decision we make and every feature we build
                        </p>
                    </div>
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {values.map((value, index) => (
                            <div key={index} className="bg-white p-6 rounded-xl shadow-sm hover:shadow-lg transition-shadow border border-gray-100">
                                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                                    <value.icon className="w-6 h-6 text-blue-950" />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-3">
                                    {value.title}
                                </h3>
                                <p className="text-gray-600 leading-relaxed">
                                    {value.description}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Leadership Team */}
            {/* <div className="py-20 bg-gray-50">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold text-gray-900 mb-4">
                            Leadership Team
                        </h2>
                        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                            Meet the dedicated professionals driving our mission forward
                        </p>
                    </div>
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {team.map((member, index) => (
                            <div key={index} className="text-center">
                                <div className="w-32 h-32 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full mx-auto mb-4"></div>
                                <h3 className="text-xl font-bold text-gray-900 mb-1">
                                    {member.name}
                                </h3>
                                <p className="text-blue-600 font-semibold mb-3">
                                    {member.role}
                                </p>
                                <p className="text-gray-600 text-sm leading-relaxed">
                                    {member.bio}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </div> */}

            {/* CTA Section */}
            <div className="py-20 bg-blue-950 text-white">
                <div className="max-w-4xl mx-auto px-4 text-center">
                    <h2 className="text-4xl font-bold mb-6">
                        Join Our Learning Community
                    </h2>
                    <p className="text-xl text-blue-100 mb-8 leading-relaxed">
                        Start your learning journey today with instant access to thousands of quality educational resources
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link
                            href="/pdf"
                            className="bg-white text-blue-950 px-8 py-4 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
                        >
                            Browse Library
                        </Link>
                        <Link
                            href="/auth/signin"
                            className="border-2 border-white text-white px-8 py-4 rounded-lg font-semibold hover:bg-white hover:text-blue-950 transition-colors"
                        >
                            Create Account
                        </Link>
                    </div>
                </div>
            </div>
            <Footer />
        </div>
    );
}