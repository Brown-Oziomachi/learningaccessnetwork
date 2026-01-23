"use client"
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebaseConfig';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import {
    MessageSquare,
    Mail,
    Phone,
    Clock,
    Send,
    CheckCircle,
    HelpCircle,
    FileText,
    CreditCard,
    Users,
    AlertCircle,
    ArrowLeft,
    MapPin
} from 'lucide-react';
import Link from 'next/link';

export default function CustomerCareClient() {
    const router = useRouter();
    const [user, setUser] = useState(null);
    const [activeTab, setActiveTab] = useState('contact'); // 'contact' or 'faq'
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        subject: '',
        category: '',
        message: ''
    });

    const categories = [
        { value: 'order', label: 'Order Issue', icon: FileText },
        { value: 'payment', label: 'Payment Problem', icon: CreditCard },
        { value: 'account', label: 'Account Help', icon: Users },
        { value: 'technical', label: 'Technical Issue', icon: AlertCircle },
        { value: 'general', label: 'General Inquiry', icon: MessageSquare },
    ];

    const faqs = [
        {
            category: 'Purchasing',
            questions: [
                {
                    q: 'How do I purchase a book?',
                    a: 'Browse our library, click on any book to preview it, then click the "Purchase" button. You\'ll be directed to our secure payment page where you can complete your transaction using Flutterwave or PayPal.'
                },
                {
                    q: 'What payment methods do you accept?',
                    a: 'We accept payments via Flutterwave (cards, bank transfers, USSD) and PayPal for international transactions.'
                },
                {
                    q: 'Is my payment information secure?',
                    a: 'Yes! All payments are processed through secure, PCI-compliant payment gateways. We never store your card details on our servers.'
                }
            ]
        },
        {
            category: 'Downloads & Access',
            questions: [
                {
                    q: 'How do I download my purchased books?',
                    a: 'After purchase, go to "My Books" in your account menu. Click the "Download" button next to any purchased book to save the PDF to your device.'
                },
                {
                    q: 'Can I read books online without downloading?',
                    a: 'Yes! All purchased books can be read online directly in your browser. Just click "View" in your My Books section.'
                },
                {
                    q: 'How long do I have access to purchased books?',
                    a: 'Forever! Once you purchase a book, it\'s yours to keep. You can download and read it as many times as you want.'
                }
            ]
        },
        {
            category: 'Account & Technical',
            questions: [
                {
                    q: 'I forgot my password. What should I do?',
                    a: 'Click "Forgot Password" on the login page. Enter your email address and we\'ll send you a reset link.'
                },
                {
                    q: 'The book preview isn\'t loading. What should I do?',
                    a: 'Try refreshing the page or clearing your browser cache. If the issue persists, make sure your browser supports PDF viewing or try a different browser.'
                },
                {
                    q: 'Can I change my registered email address?',
                    a: 'Yes! Go to "My Account" settings and update your email address. You\'ll need to verify the new email.'
                }
            ]
        },
        {
            category: 'Selling Books',
            questions: [
                {
                    q: 'How do I become a seller?',
                    a: 'Click "Become a Seller" in the menu, fill out the registration form with your bank details, and wait for approval. Once approved, you can upload books.'
                },
                {
                    q: 'What percentage do sellers receive?',
                    a: 'Sellers receive 85% of each sale. LAN Library retains 15% as a platform fee to maintain and improve our services.'
                },
                {
                    q: 'When will I receive my earnings?',
                    a: 'You can request withdrawal once your balance reaches ₦5,000. Payments are processed within 3-5 business days.'
                }
            ]
        }
    ];

    useEffect(() => {
        const currentUser = auth.currentUser;
        if (currentUser) {
            setUser(currentUser);
            setFormData(prev => ({
                ...prev,
                name: currentUser.displayName || '',
                email: currentUser.email || ''
            }));
        }
    }, []);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.name || !formData.email || !formData.category || !formData.message) {
            alert('Please fill in all required fields');
            return;
        }

        try {
            setSubmitting(true);

            const supportData = {
                name: formData.name,
                email: formData.email,
                phone: formData.phone || null,
                subject: formData.subject,
                category: formData.category,
                message: formData.message,
                userId: user?.uid || null,
                status: 'open',
                createdAt: serverTimestamp(),
                resolvedAt: null,
                adminResponse: null
            };

            await addDoc(collection(db, 'supportTickets'), supportData);

            console.log('Support ticket submitted successfully');
            setSubmitted(true);

            // Reset form after 5 seconds
            setTimeout(() => {
                setSubmitted(false);
                setFormData({
                    name: user?.displayName || '',
                    email: user?.email || '',
                    phone: '',
                    subject: '',
                    category: '',
                    message: ''
                });
            }, 5000);

        } catch (error) {
            console.error('Error submitting support ticket:', error);
            alert('Failed to submit your message. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-blue-950 text-white">
                <div className="max-w-7xl mx-auto px-4 py-6">
                    <button
                        onClick={() => router.back()}
                        className="flex items-center gap-2 text-white hover:text-gray-200 mb-4"
                    >
                        <ArrowLeft size={20} />
                        <span>Back</span>
                    </button>
                    <h1 className="text-3xl md:text-4xl font-bold mb-2">Customer Care</h1>
                    <p className="text-gray-200">We're here to help you with any questions or concerns</p>
                </div>
            </header>

            {/* Quick Contact Cards */}
            <div className="max-w-7xl mx-auto px-4 -mt-8 mb-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white rounded-lg shadow-md p-6 border-t-4 border-blue-950">
                        <Mail className="w-8 h-8 text-blue-950 mb-3" />
                        <h3 className="font-bold text-gray-900 mb-2">Email Us</h3>
                        <p className="text-sm text-gray-600 mb-2">support@lanlibrary.com</p>
                        <p className="text-xs text-gray-500">Response within 24 hours</p>
                    </div>

                    <div className="bg-white rounded-lg shadow-md p-6 border-t-4 border-green-600">
                        <Phone className="w-8 h-8 text-green-600 mb-3" />
                        <h3 className="font-bold text-gray-900 mb-2">Call Us</h3>
                        <p className="text-sm text-gray-600 mb-2">+234 XXX XXX XXXX</p>
                        <p className="text-xs text-gray-500">Mon-Fri, 9AM-5PM WAT</p>
                    </div>

                    <div className="bg-white rounded-lg shadow-md p-6 border-t-4 border-purple-600">
                        <Clock className="w-8 h-8 text-purple-600 mb-3" />
                        <h3 className="font-bold text-gray-900 mb-2">Business Hours</h3>
                        <p className="text-sm text-gray-600 mb-2">Monday - Friday</p>
                        <p className="text-xs text-gray-500">9:00 AM - 5:00 PM WAT</p>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="max-w-7xl mx-auto px-4 mb-8">
                <div className="bg-white rounded-lg shadow-sm p-2 inline-flex gap-2">
                    <button
                        onClick={() => setActiveTab('contact')}
                        className={`px-6 py-3 rounded-lg font-semibold transition-colors ${activeTab === 'contact'
                                ? 'bg-blue-950 text-white'
                                : 'text-gray-700 hover:bg-gray-100'
                            }`}
                    >
                        Contact Us
                    </button>
                    <button
                        onClick={() => setActiveTab('faq')}
                        className={`px-6 py-3 rounded-lg font-semibold transition-colors ${activeTab === 'faq'
                                ? 'bg-blue-950 text-white'
                                : 'text-gray-700 hover:bg-gray-100'
                            }`}
                    >
                        FAQs
                    </button>
                </div>
            </div>

            <main className="max-w-7xl mx-auto px-4 pb-12">
                {activeTab === 'contact' ? (
                    /* CONTACT FORM */
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Form Section */}
                        <div className="lg:col-span-2">
                            <div className="bg-white rounded-lg shadow-md p-6">
                                {submitted ? (
                                    <div className="text-center py-8">
                                        <CheckCircle className="w-20 h-20 mx-auto mb-4 text-green-500" />
                                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Message Sent!</h2>
                                        <p className="text-gray-600 mb-4">
                                            Thank you for contacting us. We'll get back to you within 24 hours.
                                        </p>
                                        <button
                                            onClick={() => setSubmitted(false)}
                                            className="bg-blue-950 text-white px-6 py-3 rounded-lg hover:bg-blue-900"
                                        >
                                            Send Another Message
                                        </button>
                                    </div>
                                ) : (
                                    <div>
                                        <h2 className="text-2xl font-bold text-gray-900 mb-6">Send us a message</h2>

                                        <div className="space-y-6 text-blue-950">
                                            {/* Name & Email */}
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-900 mb-2">
                                                        Your Name <span className="text-red-500">*</span>
                                                    </label>
                                                    <input
                                                        type="text"
                                                        name="name"
                                                        value={formData.name}
                                                        onChange={handleInputChange}
                                                        placeholder="John Doe"
                                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-950 focus:border-transparent"
                                                        required
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-900 mb-2">
                                                        Email Address <span className="text-red-500">*</span>
                                                    </label>
                                                    <input
                                                        type="email"
                                                        name="email"
                                                        value={formData.email}
                                                        onChange={handleInputChange}
                                                        placeholder="you@example.com"
                                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-950 focus:border-transparent"
                                                        required
                                                    />
                                                </div>
                                            </div>

                                            {/* Phone & Subject */}
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-900 mb-2">
                                                        Phone Number (Optional)
                                                    </label>
                                                    <input
                                                        type="tel"
                                                        name="phone"
                                                        value={formData.phone}
                                                        onChange={handleInputChange}
                                                        placeholder="+234 XXX XXX XXXX"
                                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-950 focus:border-transparent"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-900 mb-2">
                                                        Subject
                                                    </label>
                                                    <input
                                                        type="text"
                                                        name="subject"
                                                        value={formData.subject}
                                                        onChange={handleInputChange}
                                                        placeholder="Brief description"
                                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-950 focus:border-transparent"
                                                    />
                                                </div>
                                            </div>

                                            {/* Category */}
                                            <div>
                                                <label className="block text-sm font-medium text-gray-900 mb-3">
                                                    Category <span className="text-red-500">*</span>
                                                </label>
                                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                                    {categories.map((cat) => {
                                                        const Icon = cat.icon;
                                                        return (
                                                            <label
                                                                key={cat.value}
                                                                className={`flex flex-col items-center p-4 border rounded-lg cursor-pointer transition-all ${formData.category === cat.value
                                                                        ? 'border-blue-950 bg-blue-50'
                                                                        : 'border-gray-200 hover:border-gray-300'
                                                                    }`}
                                                            >
                                                                <input
                                                                    type="radio"
                                                                    name="category"
                                                                    value={cat.value}
                                                                    checked={formData.category === cat.value}
                                                                    onChange={handleInputChange}
                                                                    className="sr-only"
                                                                />
                                                                <Icon className="w-6 h-6 mb-2 text-gray-700" />
                                                                <span className="text-sm text-center">{cat.label}</span>
                                                            </label>
                                                        );
                                                    })}
                                                </div>
                                            </div>

                                            {/* Message */}
                                            <div>
                                                <label className="block text-sm font-medium text-gray-900 mb-2">
                                                    Your Message <span className="text-red-500">*</span>
                                                </label>
                                                <textarea
                                                    name="message"
                                                    value={formData.message}
                                                    onChange={handleInputChange}
                                                    rows="6"
                                                    placeholder="Tell us how we can help you..."
                                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-950 focus:border-transparent resize-none"
                                                    required
                                                />
                                            </div>

                                            {/* Submit Button */}
                                            <button
                                                onClick={handleSubmit}
                                                disabled={submitting}
                                                className="w-full bg-blue-950 text-white px-6 py-4 rounded-lg hover:bg-blue-900 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                            >
                                                {submitting ? (
                                                    <>
                                                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                                        Sending...
                                                    </>
                                                ) : (
                                                    <>
                                                        <Send size={20} />
                                                        Send Message
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Sidebar */}
                        <div className="lg:col-span-1">
                            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                                <h3 className="font-bold text-gray-900 mb-4">Need Quick Help?</h3>
                                <div className="space-y-3">
                                    <Link
                                        href="/lan/net/help-center"
                                        className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors"
                                    >
                                        <HelpCircle className="w-5 h-5 text-blue-950" />
                                        <span className="text-sm">Visit Help Center</span>
                                    </Link>
                                    <Link
                                        href="/lan/faqs"
                                        className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors"
                                    >
                                        <MessageSquare className="w-5 h-5 text-blue-950" />
                                        <span className="text-sm">Browse FAQs</span>
                                    </Link>
                                </div>
                            </div>

                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                                <MapPin className="w-8 h-8 text-blue-950 mb-3" />
                                <h3 className="font-bold text-gray-900 mb-2">Our Office</h3>
                                <p className="text-sm text-gray-700">
                                    LAN Library Headquarters<br />
                                    Abuja, FCT, Nigeria
                                </p>
                            </div>
                        </div>
                    </div>
                ) : (
                    /* FAQs SECTION */
                    <div className="max-w-4xl mx-auto">
                        <div className="bg-white rounded-lg shadow-md p-6">
                            <h2 className="text-2xl font-bold text-gray-900 mb-6">Frequently Asked Questions</h2>

                            <div className="space-y-8">
                                {faqs.map((section, idx) => (
                                    <div key={idx}>
                                        <h3 className="text-xl font-bold text-blue-950 mb-4 pb-2 border-b border-gray-200">
                                            {section.category}
                                        </h3>
                                        <div className="space-y-4">
                                            {section.questions.map((item, qIdx) => (
                                                <details key={qIdx} className="group">
                                                    <summary className="flex items-start gap-3 cursor-pointer list-none p-4 hover:bg-gray-50 rounded-lg transition-colors">
                                                        <HelpCircle className="w-5 h-5 text-blue-950 mt-0.5 flex-shrink-0" />
                                                        <span className="font-semibold text-gray-900 flex-1">{item.q}</span>
                                                        <span className="text-gray-400 group-open:rotate-180 transition-transform">▼</span>
                                                    </summary>
                                                    <div className="pl-12 pr-4 pb-4 text-gray-700 leading-relaxed">
                                                        {item.a}
                                                    </div>
                                                </details>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="mt-8 bg-gray-50 rounded-lg p-6 text-center">
                                <p className="text-gray-700 mb-4">Still have questions?</p>
                                <button
                                    onClick={() => setActiveTab('contact')}
                                    className="bg-blue-950 text-white px-6 py-3 rounded-lg hover:bg-blue-900 transition-colors font-semibold"
                                >
                                    Contact Support
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}