"use client"
import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { auth, db } from "@/lib/firebaseConfig";
import { doc, getDoc, collection, query, where, getDocs, updateDoc, serverTimestamp } from 'firebase/firestore';
import { CheckCircle, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { booksData } from "@/lib/booksData";
import { PaymentMethodSelector } from '@/components/PaymentMethodSelector';
import { PaymentForm } from '@/components/PaymentForm';
import { OrderSummary } from '@/components/OrderSummary';
import Navbar from '@/components/NavBar';
import { usePayment } from '../hooks/usePayment';
import { fetchBookDetails, validateBookForPurchase, fetchSellerDetails } from '@/utils/bookUtils';

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
            if (fileId) return `https://drive.google.com/thumbnail?id=${fileId}&sz=w400`;
        }
    }

    if (book.pdfUrl && book.pdfUrl.includes('drive.google.com')) {
        const match = book.pdfUrl.match(/[-\w]{25,}/);
        if (match) return `https://drive.google.com/thumbnail?id=${match[0]}&sz=w400`;
    }

    return book.image || book.coverImage || 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400';
};

// ✅ After successful purchase, mark the buyer's referral as completed
// so the person who referred them gets their ₦500 reward
const completeReferralOnPurchase = async (buyerUid) => {
    try {
        if (!buyerUid) return;

        // 1. Get buyer's user doc to find who referred them
        const userDoc = await getDoc(doc(db, 'users', buyerUid));
        if (!userDoc.exists()) return;

        const referredBy = userDoc.data()?.referredBy;
        if (!referredBy) return; // this user wasn't referred by anyone

        // 2. Find their pending referral doc
        const refQuery = query(
            collection(db, 'referrals'),
            where('referredUserId', '==', buyerUid),
            where('status', '==', 'pending')
        );
        const refSnap = await getDocs(refQuery);
        if (refSnap.empty) return;

        // 3. Mark referral as completed ✅
        const updates = refSnap.docs.map(refDoc =>
            updateDoc(refDoc.ref, {
                status: 'completed',
                completedAt: serverTimestamp(),
            })
        );
        await Promise.all(updates);

        console.log(`✅ Referral completed for buyer ${buyerUid} — referrer ${referredBy} earns ₦500`);
    } catch (err) {
        // Don't block the payment flow if this fails
        console.error('Error completing referral:', err);
    }
};

export default function PaymentClient() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const bookId = searchParams.get('bookId');
    const [allBooks, setAllBooks] = useState([]);
    const [book, setBook] = useState(null);
    const [sellerDetails, setSellerDetails] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [paymentMethod, setPaymentMethod] = useState('flutterwave');
    const [referralCompleted, setReferralCompleted] = useState(false);
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

    useEffect(() => {
        const loadBook = async () => {
            if (!bookId) {
                setError("No book ID provided");
                setLoading(false);
                return;
            }

            try {
                setLoading(true);

                const bookData = await fetchBookDetails(bookId);
                if (!bookData) {
                    setError("Book not found");
                    setLoading(false);
                    return;
                }

                const validation = validateBookForPurchase(bookData);
                if (!validation.valid) {
                    setError(validation.error);
                    setLoading(false);
                    return;
                }

                setBook(bookData);

                const sellerInfo = await fetchSellerDetails(bookData);
                if (sellerInfo) {
                    setSellerDetails(sellerInfo);
                } else {
                    setError("Seller information unavailable");
                    setLoading(false);
                    return;
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

    // ✅ When payment succeeds, complete the referral then redirect
    useEffect(() => {
        if (paymentSuccess && !referralCompleted) {
            setReferralCompleted(true);

            const buyerUid = auth.currentUser?.uid;

            // Complete the referral (won't block redirect if it fails)
            completeReferralOnPurchase(buyerUid).finally(() => {
                setTimeout(() => {
                    router.push(`/book/preview?id=${bookId}&purchased=true`);
                }, 3000);
            });
        }
    }, [paymentSuccess, bookId, router, referralCompleted]);

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
                        <p className="text-sm text-blue-950"><strong>Email:</strong> {formData.email}</p>
                        <p className="text-sm text-blue-950 mt-2"><strong>Book:</strong> {book.title}</p>
                        <p className="text-sm text-blue-950 mt-2"><strong>Amount:</strong> ₦ {book.price.toLocaleString()}</p>
                        {sellerDetails && (
                            <p className="text-sm text-blue-950 mt-2"><strong>Seller:</strong> {sellerDetails.name}</p>
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

                {/* Book Details */}
                <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
                    <div className="flex gap-6">
                        <img
                            src={getThumbnailUrl(book)}
                            alt={'Cover of ' + book.title}
                            className="w-32 h-48 lg:w-70 lg:h-100 object-cover rounded border border-gray-200 bg-gray-100"
                            onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400'; }}
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
                                    {book.author}
                                </span>
                            )}
                            {book.source === 'platform' && (
                                <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded mt-2">
                                    Platform Book
                                </span>
                            )}
                            <div className="mt-6 max-lg:hidden bg-green-50 border border-green-200 rounded-lg p-4">
                                <p className="text-sm text-green-950">
                                    <strong>Description:</strong>
                                    <p className="text-xs text-green-800 mt-1">
                                        {book.description || 'No description provided by the seller.'}
                                    </p>
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="mt-6 lg:hidden bg-green-50 border border-green-200 rounded-lg p-4">
                        <p className="text-sm text-green-950">
                            <strong>Description:</strong>
                            <p className="text-xs text-green-800 mt-1">
                                {book.description || 'No description provided by the seller.'}
                            </p>
                        </p>
                    </div>
                </div>

                <div className="bg-blue-950 text-white rounded-lg p-4 mb-6 text-center font-bold">
                    <h1>Save 80% by selling on LAN Library!</h1>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
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

                            <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                                <p className="text-sm text-blue-950">
                                    <strong>Invite Your Friends & Earn ₦500: </strong>
                                    <Link href="/referrals" className='font-bold underline'>Get your referral link →</Link>
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="lg:col-span-1">
                        <OrderSummary book={book} sellerDetails={sellerDetails} />
                    </div>
                </div>

                {/* You might also like */}
                <div className="mt-12">
                    <h3 className="text-2xl font-bold text-gray-900 mb-6">You might also like</h3>

                    <div className="md:hidden">
                        <div className="grid grid-cols-2 gap-4">
                            {(allBooks.length > 0 ? allBooks : booksData)
                                .filter((relatedBook) => relatedBook.id !== bookId)
                                .slice(0, 8)
                                .map((relatedBook) => (
                                    <Link key={relatedBook.id} href={`/book/preview?id=${relatedBook.id}`} className="group">
                                        <div className="relative mb-3">
                                            <img
                                                src={getThumbnailUrl(relatedBook)}
                                                alt={relatedBook.title}
                                                className="w-full h-[240px] sm:h-[280px] object-cover rounded shadow-md group-hover:shadow-xl transition-shadow"
                                                onError={(e) => { e.target.src = "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400"; }}
                                                loading="lazy"
                                            />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-sm text-gray-900 mb-1 line-clamp-2 group-hover:text-blue-600 transition-colors">
                                                {relatedBook.title}
                                            </h4>
                                            <p className="text-gray-600 text-xs">{relatedBook.author}</p>
                                        </div>
                                    </Link>
                                ))}
                        </div>
                    </div>

                    <div className="hidden md:grid md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {(allBooks.length > 0 ? allBooks : booksData)
                            .filter((relatedBook) => relatedBook.id !== bookId)
                            .slice(0, 8)
                            .map((relatedBook) => (
                                <Link key={relatedBook.id} href={`/book/preview?id=${relatedBook.id}`} className="group">
                                    <div className="relative mb-3">
                                        <img
                                            src={getThumbnailUrl(relatedBook)}
                                            alt={relatedBook.title}
                                            className="w-full h-[280px] object-cover rounded shadow-md group-hover:shadow-xl transition-shadow"
                                            onError={(e) => { e.target.src = "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400"; }}
                                            loading="lazy"
                                        />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-sm text-gray-900 mb-1 line-clamp-2 group-hover:text-blue-600 transition-colors">
                                            {relatedBook.title}
                                        </h4>
                                        <p className="text-gray-600 text-xs">{relatedBook.author}</p>
                                    </div>
                                </Link>
                            ))}
                    </div>
                </div>
            </main>
        </div>
    );
}