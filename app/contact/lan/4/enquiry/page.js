'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Globe, Mail, Phone, MapPin, Send, MessageSquare } from 'lucide-react';
import Link from 'next/link';
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from 'next/navigation';
import { auth } from "@/lib/firebaseConfig";
import Navbar from '@/components/NavBar';
import Footer from '@/components/FooterComp';

export default function ContactPage() {
    const router = useRouter();
    const [user, setUser] = useState(null);
    const [checkingAuth, setCheckingAuth] = useState(true);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        subject: '',
        message: ''
    });
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const handleInputChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = () => {
        if (!formData.name || !formData.email || !formData.message) {
            alert('Please fill in all required fields');
            return;
        }

        setLoading(true);

        // Simulate form submission
        setTimeout(() => {
            setLoading(false);
            setSubmitted(true);
            setFormData({ name: '', email: '', subject: '', message: '' });

            setTimeout(() => {
                setSubmitted(false);
            }, 5000);
        }, 1500);
    };

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (currentUser) {
                setUser(currentUser);
            } else {
                router.push('/auth/signin');
            }
            setCheckingAuth(false); // ADD THIS LINE - Stop loading after auth check
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
            <Navbar />
            {/* Hero Section */}
            <div className=" text-blue-950 py-16">
                <div className="max-w-4xl mx-auto px-4 text-center">
                    <MessageSquare className="w-16 h-16 mx-auto mb-4" />
                    <h1 className="text-4xl md:text-5xl font-bold mb-4">
                        Get in Touch
                    </h1>
                    <p className="text-xl text-blue-950">
                        We'd love to hear from you. Send us a message and we'll respond as soon as possible.
                    </p>
                </div>
            </div>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 py-12">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                    {/* Contact Form */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        <h2 className="text-3xl font-bold text-gray-900 mb-6">Send us a Message</h2>

                        {submitted && (
                            <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
                                <p className="text-green-800 font-semibold">
                                    ✓ Thank you! Your message has been sent successfully.
                                </p>
                                <p className="text-green-700 text-sm mt-1">
                                    We'll get back to you within 24-48 hours.
                                </p>
                            </div>
                        )}

                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Your Name *
                                </label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => handleInputChange('name', e.target.value)}
                                    className="w-full px-4 py-3 text-black border border-gray-300 rounded-lg focus:outline-none focus:border-blue-950"
                                    placeholder="LAN Lib"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Email Address *
                                </label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => handleInputChange('email', e.target.value)}
                                    className="w-full px-4 py-3 border text-black border-gray-300 rounded-lg focus:outline-none focus:border-blue-950"
                                    placeholder="lan@example.com"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Subject
                                </label>
                                <input
                                    type="text"
                                    value={formData.subject}
                                    onChange={(e) => handleInputChange('subject', e.target.value)}
                                    className="w-full px-4 py-3 border text-black border-gray-300 rounded-lg focus:outline-none focus:border-blue-950"
                                    placeholder="How can we help?"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Message *
                                </label>
                                <textarea
                                    value={formData.message}
                                    onChange={(e) => handleInputChange('message', e.target.value)}
                                    className="w-full px-4 py-3 text-black border border-gray-300 rounded-lg focus:outline-none focus:border-blue-950"
                                    rows="6"
                                    placeholder="Tell us more about your inquiry..."
                                />
                            </div>

                            <button
                                onClick={handleSubmit}
                                disabled={loading}
                                className="w-full bg-blue-950 text-white py-3 rounded-lg hover:bg-blue-900 transition-colors font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {loading ? (
                                    'Sending...'
                                ) : (
                                    <>
                                        <Send size={20} />
                                        Send Message
                                    </>
                                )}
                            </button>
                        </div>
                    </motion.div>

                    {/* Contact Information */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                    >
                        <h2 className="text-3xl font-bold text-gray-900 mb-6">Contact Information</h2>
                        <p className="text-gray-600 mb-8">
                            Have a question? Reach out to us through any of the following channels.
                        </p>

                        <div className="space-y-6">
                            <div className="flex items-start gap-4">
                                <div className="bg-blue-950 text-white p-3 rounded-lg">
                                    <Mail size={24} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900 mb-1">Email</h3>
                                    <p className="text-gray-600">support@learningaccess.com</p>
                                    <p className="text-gray-600">sales@learningaccess.com</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-4">
                                <div className="bg-blue-950 text-white p-3 rounded-lg">
                                    <Phone size={24} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900 mb-1">Phone</h3>
                                    <p className="text-gray-600">+234 800 123 4567</p>
                                    <p className="text-gray-600 text-sm">Mon-Fri, 9am-6pm WAT</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-4">
                                <div className="bg-blue-950 text-white p-3 rounded-lg">
                                    <MapPin size={24} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900 mb-1">Office</h3>
                                    <p className="text-gray-600">
                                        123 Knowledge Street<br />
                                        Abuja, FCT 900001<br />
                                        Nigeria
                                    </p>
                                </div>
                            </div>
                        </div>
                   </motion.div>
                </div>
            </main>

            {/* Footer */}
          <Footer />
        </div>
    );
}