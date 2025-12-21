"use client"
import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { auth, db } from "@/lib/firebaseConfig";
import { doc, getDoc } from 'firebase/firestore';
import { CheckCircle, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { booksData } from "@/lib/booksData";
import { PaymentMethodSelector } from '@/components/PaymentMethodSelector';
import { PaymentForm } from '@/components/PaymentForm';
import { OrderSummary } from '@/components/OrderSummary';
import Navbar from '@/components/NavBar'; 
import { usePayment } from '../hooks/usePayment';

export default function PaymentClient() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const bookId = searchParams.get('bookId');

    const [book, setBook] = useState(null);
    const [loading, setLoading] = useState(true);
    const [paymentMethod, setPaymentMethod] = useState('flutterwave');
    const [formData, setFormData] = useState({
        email: auth.currentUser?.email || '',
        phone: '',
        name: ''
    });

    // Use the payment hook
    const {
        processing,
        paymentSuccess,
        error,
        processFlutterwavePayment,
        processPayPalPayment
    } = usePayment(book, formData);

    // Fetch book data
    useEffect(() => {
        const fetchBook = async () => {
            if (!bookId) {
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                console.log('Fetching book with ID:', bookId);

                // Check if it's a Firestore book ID
                if (bookId?.startsWith('firestore-')) {
                    const firestoreId = bookId.replace('firestore-', '');
                    const bookDocRef = doc(db, 'advertMyBook', firestoreId);
                    const bookDoc = await getDoc(bookDocRef);

                    if (bookDoc.exists()) {
                        const data = bookDoc.data();
                        setBook({
                            id: bookId,
                            firestoreId: firestoreId,
                            title: data.bookTitle,
                            author: data.author || data.name,
                            category: data.category,
                            price: data.price,
                            pages: data.pages,
                            format: data.format || 'PDF',
                            image: data.coverImage,
                            description: data.description,
                            message: data.message,
                            pdfUrl: data.pdfLink,
                            driveFileId: data.driveFileId,
                            sellerId: data.sellerId || data.userId,
                            oldPrice: data.oldPrice || null,
                            discount: data.discount || null
                        });
                        setLoading(false);
                        return;
                    }
                } else {
                    // Try local booksData
                    const localBook = booksData.find(b => b.id === parseInt(bookId) || b.id === bookId);
                    if (localBook) {
                        setBook(localBook);
                        setLoading(false);
                        return;
                    }

                    // Try Firestore without prefix
                    const bookDocRef = doc(db, 'advertMyBook', bookId);
                    const bookDoc = await getDoc(bookDocRef);

                    if (bookDoc.exists()) {
                        const data = bookDoc.data();
                        setBook({
                            id: `firestore-${bookId}`,
                            firestoreId: bookId,
                            title: data.bookTitle,
                            author: data.author || data.name,
                            category: data.category,
                            price: data.price,
                            pages: data.pages,
                            format: data.format || 'PDF',
                            image: data.coverImage,
                            description: data.description,
                            pdfUrl: data.pdfLink,
                            sellerId: data.sellerId || data.userId,
                            oldPrice: data.oldPrice || null,
                            discount: data.discount || null
                        });
                        setLoading(false);
                        return;
                    }
                }

                console.error('Book not found with ID:', bookId);
                setBook(null);
            } catch (error) {
                console.error('Error fetching book:', error);
                setBook(null);
            } finally {
                setLoading(false);
            }
        };

        fetchBook();
    }, [bookId]);

    // Redirect after successful payment
    useEffect(() => {
        if (paymentSuccess) {
            setTimeout(() => {
                router.push(`/book/preview?id=${bookId}&purchased=true`);
            }, 3000);
        }
    }, [paymentSuccess, bookId, router]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handlePayment = (e) => {
        e.preventDefault();

        if (!formData.email || !formData.phone || !formData.name) {
            alert('Please fill in all required fields');
            return;
        }

        if (paymentMethod === 'flutterwave') {
            processFlutterwavePayment();
        } else if (paymentMethod === 'paypal') {
            processPayPalPayment();
        }
    };

    // Loading state
    if (loading) {
        return (
            <div className="min-h-screen bg-blue-950 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-50 mx-auto"></div>
                    <p className="mt-4 text-white">Loading payment gateway...</p>
                </div>
            </div>
        );
    }

    // Book not found
    if (!book) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <AlertCircle className="w-16 h-16 mx-auto mb-4 text-red-500" />
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Book Not Found</h2>
                    <p className="text-gray-600 mb-4">The selected book could not be found.</p>
                    <p className="text-sm text-gray-500 mb-4">Book ID: {bookId}</p>
                    <Link href="/home" className="text-blue-600 hover:underline">Return to Home</Link>
                </div>
            </div>
        );
    }

    // Payment success
    if (paymentSuccess) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
                    <CheckCircle className="w-20 h-20 mx-auto mb-4 text-green-500" />
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful!</h2>
                    <p className="text-gray-600 mb-4">
                        Your payment has been processed successfully.
                    </p>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                        <p className="text-sm text-blue-950">
                            <strong>Email:</strong> {formData.email}
                        </p>
                        <p className="text-sm text-blue-950 mt-2">
                            <strong>Book:</strong> {book.title}
                        </p>
                        <p className="text-sm text-blue-950 mt-2">
                            <strong>Amount:</strong> ₦ {book.price.toLocaleString()}
                        </p>
                    </div>
                    <p className="text-gray-600 mb-4">Redirecting to book preview...</p>
                    <Link
                        href={`/book/preview?id=${bookId}&purchased=true`}
                        className="inline-block bg-blue-950 text-white px-6 py-3 rounded-lg hover:bg-blue-900 transition-colors"
                    >
                        View Your Book
                    </Link>
                </div>
            </div>
        );
    }

    // Main payment page
    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />

            <main className="max-w-6xl mx-auto px-4 py-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-8">Complete Your Purchase</h2>

                {error && (
                    <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
                        <p className="text-red-900">
                            <strong>Error:</strong> {error.message || 'An error occurred during payment'}
                        </p>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Payment Form */}
                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-lg shadow-lg p-6">
                            <h3 className="text-xl font-bold text-gray-900 mb-6">Payment Information</h3>

                            <PaymentMethodSelector
                                paymentMethod={paymentMethod}
                                setPaymentMethod={setPaymentMethod}
                            />

                            <PaymentForm
                                formData={formData}
                                handleInputChange={handleInputChange}
                                processing={processing}
                                onSubmit={handlePayment}
                                paymentMethod={paymentMethod}
                                book={book}
                            />
                        </div>
                    </div>

                    {/* Order Summary */}
                    <div className="lg:col-span-1">
                        <OrderSummary book={book} />
                    </div>
                </div>
            </main>
        </div>
    );
}