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
import { fetchBookDetails, validateBookForPurchase } from '@/utils/bookUtils';

// Helper function to generate thumbnail from PDF
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

    return book.image || book.coverImage || 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400';
};

export default function PaymentClient() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const bookId = searchParams.get('bookId');

    const [book, setBook] = useState(null);
    const [sellerDetails, setSellerDetails] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [paymentMethod, setPaymentMethod] = useState('flutterwave');
    const [formData, setFormData] = useState({
        email: auth.currentUser?.email || '',
        phone: '',
        name: ''
    });

    const {
        processing,
        paymentSuccess,
        error: paymentError,
        processFlutterwavePayment,
        processPayPalPayment
    } = usePayment(book, formData, sellerDetails);

    // Fetch book data and seller details
    useEffect(() => {
        const loadBook = async () => {
            if (!bookId) {
                setError("No book ID provided");
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                console.log("=== PAYMENT PAGE DEBUG ===");
                console.log("Loading book for payment. BookId:", bookId, "Type:", typeof bookId);

                const bookData = await fetchBookDetails(bookId);
                console.log("fetchBookDetails returned:", bookData);

                if (!bookData) {
                    console.error("Book not found with ID:", bookId);
                    const localBook = booksData.find(b =>
                        b.id === bookId ||
                        b.id === parseInt(bookId) ||
                        b.id === String(bookId)
                    );
                    console.log("Direct booksData check:", localBook);
                    setError("Book not found");
                    setLoading(false);
                    return;
                }

                const validation = validateBookForPurchase(bookData);
                console.log("Validation result:", validation);

                if (!validation.valid) {
                    setError(validation.error);
                    setLoading(false);
                    return;
                }

                console.log("Book loaded successfully:", bookData.title);
                setBook(bookData);

                const sellerId = bookData.sellerId;
                if (sellerId) {
                    try {
                        console.log("Fetching seller details for:", sellerId);
                        const sellerDocRef = doc(db, 'users', sellerId);
                        const sellerDoc = await getDoc(sellerDocRef);

                        if (sellerDoc.exists()) {
                            const sellerData = sellerDoc.data();
                            setSellerDetails({
                                id: sellerId,
                                name: sellerData.displayName || sellerData.name || bookData.sellerName || 'Unknown Seller',
                                email: sellerData.email || bookData.sellerEmail,
                                phone: sellerData.phone || sellerData.phoneNumber || bookData.sellerPhone,
                                accountDetails: sellerData.accountDetails || null,
                                walletId: sellerData.walletId,
                                bankAccount: sellerData.bankAccount
                            });
                            console.log('Seller details fetched from Firestore');
                        } else {
                            console.warn('Seller not found in users collection, using book data');
                            setSellerDetails({
                                id: sellerId,
                                name: bookData.sellerName || 'Unknown Seller',
                                email: bookData.sellerEmail,
                                phone: bookData.sellerPhone
                            });
                        }
                    } catch (sellerError) {
                        console.error('Error fetching seller details:', sellerError);
                        setSellerDetails({
                            id: sellerId,
                            name: bookData.sellerName || 'Unknown Seller',
                            email: bookData.sellerEmail,
                            phone: bookData.sellerPhone
                        });
                    }
                } else {
                    console.warn('No seller ID found for book');
                }

            } catch (err) {
                console.error("Error loading book:", err);
                setError("Failed to load book details: " + err.message);
            } finally {
                setLoading(false);
            }
        };

        loadBook();
    }, [bookId]);

    // Key fix in PaymentClient - Update the redirect logic in useEffect

    useEffect(() => {
        if (paymentSuccess && book) {
            setTimeout(() => {
                // Use the ORIGINAL bookId from URL, not the modified one
                const redirectBookId = bookId; // Keep original format from URL
                router.push(`/book/preview?id=${redirectBookId}&purchased=true`);
            }, 3000);
        }
    }, [paymentSuccess, bookId, book, router]);

    // Also update the "View Your Book" link in the success message:
    <Link
        href={`/book/preview?id=${bookId}&purchased=true`}
        className="inline-block bg-blue-950 text-white px-6 py-3 rounded-lg hover:bg-blue-900 transition-colors"
    >
        View Your Book
    </Link>
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

        if (!sellerDetails) {
            alert('Seller information is missing. Cannot process payment.');
            return;
        }

        if (paymentMethod === 'flutterwave') {
            processFlutterwavePayment();
        } else if (paymentMethod === 'paypal') {
            processPayPalPayment();
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-950 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading book details...</p>
                    <p className="text-sm text-gray-500 mt-2">Book ID: {bookId}</p>
                </div>
            </div>
        );
    }

    if (error || !book) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4">
                <div className="text-center bg-white p-8 rounded-lg shadow-lg max-w-md">
                    <div className="text-red-600 mb-4">
                        <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold mb-2 text-gray-900">Book Not Found</h2>
                    <p className="text-gray-600 mb-4">{error || "The book you're looking for doesn't exist."}</p>
                    <div className="text-left bg-gray-50 p-4 rounded mb-4">
                        <p className="text-sm font-mono text-gray-700">
                            <strong>Debug Info:</strong><br />
                            Book ID: {bookId}<br />
                            Type: {typeof bookId}
                        </p>
                    </div>
                    <button
                        onClick={() => window.history.back()}
                        className="bg-blue-950 text-white px-6 py-3 rounded-lg hover:bg-blue-900"
                    >
                        Go Back
                    </button>
                </div>
            </div>
        );
    }

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
                        {sellerDetails && (
                            <p className="text-sm text-blue-950 mt-2">
                                <strong>Seller:</strong> {sellerDetails.name}
                            </p>
                        )}
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

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />

            <main className="max-w-6xl mx-auto px-4 py-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-8">Complete Your Purchase</h2>

                {paymentError && (
                    <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
                        <p className="text-red-900">
                            <strong>Error:</strong> {paymentError.message || 'An error occurred during payment'}
                        </p>
                    </div>
                )}

                {!sellerDetails && (
                    <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <p className="text-yellow-900">
                            <strong>Warning:</strong> Seller information is missing. Payment may not be processed correctly.
                        </p>
                    </div>
                )}

                {/* Book Details Preview - UPDATED */}
                <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
                    <div className="flex gap-6">
                        <img
                            src={getThumbnailUrl(book)}
                            alt={'Cover of ' + book.title}
                            className="w-32 h-48 object-cover rounded border border-gray-200 bg-gray-100"
                            onError={(e) => {
                                e.target.src = 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400';
                            }}
                            loading="lazy"
                        />

                        <div className="flex-1">
                            <h2 className="text-2xl font-bold mb-2 text-gray-900">{book.title}</h2>
                            <p className="text-gray-600 mb-2">by {book.author}</p>
                            <p className="text-3xl font-bold text-blue-950 mb-2">₦{book.price.toLocaleString()}</p>
                            <p className="text-sm text-gray-500">
                                Sold by: {book.sellerName || sellerDetails?.name || 'Unknown'}
                            </p>
                            {book.source === 'firestore' && (
                                <span className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded mt-2">
                                    User Book
                                </span>
                            )}
                            {book.source === 'platform' && (
                                <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded mt-2">
                                    Platform Book
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Debug Info (Remove in production) */}
                <div className="bg-gray-100 rounded-lg p-4 mb-6">
                    <details>
                        <summary className="cursor-pointer font-semibold mb-2">Debug Info (Check Console for more details)</summary>
                        <pre className="text-xs overflow-auto">
                            {JSON.stringify({
                                bookId: book.id,
                                originalBookId: bookId,
                                sellerId: book.sellerId,
                                sellerName: book.sellerName,
                                sellerEmail: book.sellerEmail,
                                sellerPhone: book.sellerPhone,
                                price: book.price,
                                source: book.source,
                                sellerDetailsLoaded: !!sellerDetails,
                                sellerDetailsData: sellerDetails
                            }, null, 2)}
                        </pre>
                    </details>
                </div>

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

                            {/* Payment Info Note */}
                            <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                                <p className="text-sm text-blue-950">
                                    When you complete payment, the seller ({book.sellerName || sellerDetails?.name})
                                    will receive 85% (₦{(book.price * 0.85).toLocaleString()})
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Order Summary */}
                    <div className="lg:col-span-1">
                        <OrderSummary book={book} sellerDetails={sellerDetails} />
                    </div>
                </div>
            </main>
        </div>
    );
}