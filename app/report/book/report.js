"use client"
import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { auth, db } from '@/lib/firebaseConfig';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { Flag, ArrowLeft, Send, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { fetchBookDetails } from '@/utils/bookUtils';

export default function ReportBookPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const bookId = searchParams.get('bookId');

    const [book, setBook] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [user, setUser] = useState(null);

    const [formData, setFormData] = useState({
        reason: '',
        details: '',
        email: ''
    });

    const reportReasons = [
        'Inappropriate Content',
        'Copyright Infringement',
        'Misleading Information',
        'Poor Quality/Unreadable',
        'Incorrect Price',
        'Spam or Scam',
        'Other'
    ];

    // Helper function to get thumbnail from PDF (same as AllBooksPage)
    const getThumbnailUrl = (book) => {
        if (!book) return 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400';

        if (book.driveFileId) {
            return `https://drive.google.com/thumbnail?id=${book.driveFileId}&sz=w400`;
        }

        if (book.embedUrl) {
            const match = book.embedUrl.match(/\/d\/(.*?)\/|\/file\/d\/(.*?)\/|id=(.*?)(&|$)/);
            if (match) {
                const fileId = match[1] || match[2] || match[3];
                if (fileId) {
                    return `https://drive.google.com/thumbnail?id=${fileId}&sz=w400`;
                }
            }
        }

        if (book.pdfUrl && book.pdfUrl.includes('drive.google.com')) {
            const match = book.pdfUrl.match(/[-\w]{25,}/);
            if (match) {
                return `https://drive.google.com/thumbnail?id=${match[0]}&sz=w400`;
            }
        }

        return book.image || 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400';
    };

    useEffect(() => {
        const currentUser = auth.currentUser;
        if (currentUser) {
            setUser(currentUser);
            setFormData(prev => ({
                ...prev,
                email: currentUser.email || ''
            }));
        }
    }, []);

    useEffect(() => {
        const loadBook = async () => {
            if (!bookId) {
                setLoading(false);
                return;
            }

            try {
                const bookData = await fetchBookDetails(bookId);
                if (bookData) {
                    console.log('📚 Book loaded for report:', bookData);
                    console.log('📄 embedUrl:', bookData.embedUrl);
                    console.log('📄 pdfUrl:', bookData.pdfUrl);
                    console.log('📄 driveFileId:', bookData.driveFileId);

                    setBook({
                        ...bookData,
                        image: getThumbnailUrl(bookData)
                    });
                }
            } catch (error) {
                console.error('Error loading book:', error);
            } finally {
                setLoading(false);
            }
        };

        loadBook();
    }, [bookId]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.reason) {
            alert('Please select a reason for reporting');
            return;
        }

        if (!formData.details.trim()) {
            alert('Please provide details about your report');
            return;
        }

        if (!formData.email) {
            alert('Please provide your email');
            return;
        }

        try {
            setSubmitting(true);

            const reportData = {
                // Report details
                bookId: book.id,
                bookTitle: book.title,
                bookAuthor: book.author,
                bookPrice: book.price,
                bookCategory: book.category,
                bookImage: book.image,
                bookEmbedUrl: book.embedUrl || null,
                bookPdfUrl: book.pdfUrl || null,
                bookDriveFileId: book.driveFileId || null,
                reason: formData.reason,
                details: formData.details,

                // Reporter details
                reporterEmail: formData.email,
                reporterId: user?.uid || null,
                reporterName: user?.displayName || 'Anonymous',

                // Metadata
                status: 'pending',
                createdAt: serverTimestamp(),
                resolvedAt: null,
                adminNotes: '',
            };

            await addDoc(collection(db, 'bookReports'), reportData);

            console.log('Report submitted successfully');
            setSubmitted(true);

            // Redirect after 3 seconds
            setTimeout(() => {
                router.push(`/book/preview?id=${bookId}`);
            }, 3000);

        } catch (error) {
            console.error('Error submitting report:', error);
            alert('Failed to submit report. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-950 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading...</p>
                </div>
            </div>
        );
    }

    if (!book) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
                <div className="text-center bg-blue-950 text-white p-8 rounded-lg shadow-lg max-w-md">
                    <Flag className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                    <h2 className="text-2xl font-bold mb-2 text-gray-900">Book Not Found</h2>
                    <p className="text-gray-600 mb-4">Unable to load book details for reporting.</p>
                    <Link
                        href="/home"
                        className="inline-block bg-blue-950 text-white px-6 py-3 rounded-lg hover:bg-blue-900"
                    >
                        Return to Home
                    </Link>
                </div>
            </div>
        );
    }

    if (submitted) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
                <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
                    <CheckCircle className="w-20 h-20 mx-auto mb-4 text-green-500" />
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Report Submitted</h2>
                    <p className="text-gray-600 mb-4">
                        Thank you for reporting this issue. Our team will review it shortly.
                    </p>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                        <p className="text-sm text-blue-950">
                            <strong>Book:</strong> {book.title}
                        </p>
                        <p className="text-sm text-blue-950 mt-2">
                            <strong>Reason:</strong> {formData.reason}
                        </p>
                    </div>
                    <p className="text-gray-600 mb-4">Redirecting back to book preview...</p>
                    <Link
                        href={`/book/preview?id=${bookId}`}
                        className="inline-block bg-blue-950 text-white px-6 py-3 rounded-lg hover:bg-blue-900 transition-colors"
                    >
                        Return to Book
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-blue-950 text-white border-b border-gray-200 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 py-4">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => router.back()}
                            className="p-2 hover:bg-gray-500 rounded-lg transition-colors bg-white text-blue-950"
                        >
                            <ArrowLeft size={24} className="text-gray-700" />
                        </button>
                        <div>
                            <h1 className="text-xl font-bold ">Report a Problem</h1>
                            <p className="text-sm text-gray-300">Help us improve LAN Library</p>
                        </div>
                        <h3 className="font-bold text-gray-200 mb-2 text-lg ml-auto max-lg:hidden">{book.title}</h3>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 py-8">
                {/* RESPONSIVE LAYOUT: Single column on mobile, two columns on desktop */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* LEFT COLUMN - Book Preview (Desktop: sticky sidebar) */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-lg shadow-sm p-6 lg:sticky lg:top-24">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4">Reporting Issue For:</h2>

                            {/* Book Thumbnail */}
                            <div className="mb-4">
                                <img
                                    src={getThumbnailUrl(book)}
                                    alt={book.title}
                                    className="w-full h-auto rounded-lg border border-gray-200 object-cover"
                                    onError={(e) => {
                                        e.target.src = 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400';
                                    }}
                                />
                            </div>

                            {/* Book Details */}
                            <div>
                                <h3 className="font-bold text-gray-900 mb-2 text-lg">{book.title}</h3>
                                <p className="text-gray-600 text-sm mb-2">by {book.author}</p>
                                <p className="text-blue-950 font-semibold text-lg mb-3">₦{book.price?.toLocaleString()}</p>

                                {/* Additional Info */}
                                <div className="border-t border-gray-200 pt-3 space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500">Category:</span>
                                        <span className="text-gray-900 font-medium">{book.category}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500">Pages:</span>
                                        <span className="text-gray-900 font-medium">{book.pages || 'N/A'}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500">Format:</span>
                                        <span className="text-gray-900 font-medium">{book.format || 'PDF'}</span>
                                    </div>
                                    {book.isFromFirestore && (
                                        <div className="bg-blue-50 border border-blue-200 rounded p-2 mt-2">
                                            <span className="text-xs text-blue-950 font-medium">User-Uploaded Book</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* View Book Link */}
                            <Link
                                href={`/book/preview?id=${bookId}`}
                                className="mt-4 block text-center text-blue-950 hover:underline text-sm font-medium"
                            >
                                View Book Details →
                            </Link>
                        </div>
                    </div>

                    {/* RIGHT COLUMN - Report Form */}
                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-lg shadow-sm p-6">
                            <div className="space-y-6">
                                {/* Reason Selection */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-900 mb-3">
                                        What's the issue? <span className="text-red-500">*</span>
                                    </label>
                                    <div className="space-y-2">
                                        {reportReasons.map((reason) => (
                                            <label
                                                key={reason}
                                                className={`flex items-center p-4 border rounded-lg cursor-pointer transition-all ${formData.reason === reason
                                                        ? 'border-blue-950 bg-blue-50'
                                                        : 'border-gray-200 hover:border-gray-300'
                                                    }`}
                                            >
                                                <input
                                                    type="radio"
                                                    name="reason"
                                                    value={reason}
                                                    checked={formData.reason === reason}
                                                    onChange={handleInputChange}
                                                    className="w-4 h-4 text-blue-950 focus:ring-blue-950"
                                                />
                                                <span className="ml-3 text-gray-900">{reason}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                {/* Details Textarea */}
                                <div>
                                    <label htmlFor="details" className="block text-sm font-medium text-gray-900 mb-2">
                                        Please provide more details <span className="text-red-500">*</span>
                                    </label>
                                    <textarea
                                        id="details"
                                        name="details"
                                        rows="6"
                                        value={formData.details}
                                        onChange={handleInputChange}
                                        placeholder="Describe the issue in detail. The more information you provide, the better we can help."
                                        className="w-full text-black px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-950 focus:border-transparent resize-none"
                                        required
                                    />
                                    <p className="text-xs text-gray-500 mt-1">
                                        Minimum 10 characters
                                    </p>
                                </div>

                                {/* Email */}
                                <div>
                                    <label htmlFor="email" className="block text-sm font-medium text-gray-900 mb-2">
                                        Your Email <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="email"
                                        id="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleInputChange}
                                        placeholder="your.email@example.com"
                                        className="w-full text-black px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-950 focus:border-transparent"
                                        required
                                    />
                                    <p className="text-xs text-gray-500 mt-1">
                                        We'll contact you if we need more information
                                    </p>
                                </div>

                                {/* Info Box */}
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                    <p className="text-sm text-blue-950">
                                        <strong>Note:</strong> All reports are reviewed by our team.
                                        False or malicious reports may result in account suspension.
                                    </p>
                                </div>

                                {/* Submit Button */}
                                <div className="flex flex-col sm:flex-row gap-4">
                                    <button
                                        type="button"
                                        onClick={() => router.back()}
                                        className="flex-1 px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-semibold text-gray-700"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleSubmit}
                                        disabled={submitting || !formData.reason || !formData.details.trim() || !formData.email}
                                        className="flex-1 bg-blue-950 text-white px-6 py-3 rounded-lg hover:bg-blue-900 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                    >
                                        {submitting ? (
                                            <>
                                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                                Submitting...
                                            </>
                                        ) : (
                                            <>
                                                <Send size={20} />
                                                Submit Report
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Additional Info */}
                        <div className="mt-6 text-center text-sm text-gray-500">
                            <p>
                                Need help with something else?{' '}
                                <Link href="/lan/customer-care" className="text-blue-950 hover:underline font-medium">
                                    Contact Customer Care
                                </Link>
                            </p>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}