"use client"
import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { auth, db } from "@/lib/firebaseConfig";
import { doc, getDoc, collection, query, where, getDocs, updateDoc, serverTimestamp } from 'firebase/firestore';
import { CheckCircle, AlertCircle, X } from 'lucide-react';
import Link from 'next/link';
import { booksData } from "@/lib/booksData";
import Navbar from '@/components/NavBar';
import { usePayment } from '../hooks/usePayment';
import { fetchBookDetails, validateBookForPurchase, fetchSellerDetails } from '@/utils/bookUtils';
import { PaymentMethodSelector } from '@/components/PaymentMethodSelector';
import { PaymentForm } from '@/components/PaymentForm';
import OrderSummary from '@/components/OrderSummary';

const getThumbnailUrl = (book) => {
    if (!book) return 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400';
    if (book.driveFileId) return `https://drive.google.com/thumbnail?id=${book.driveFileId}&sz=w400`;
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

const completeReferralOnPurchase = async (buyerUid) => {
    try {
        if (!buyerUid) return;
        const userDoc = await getDoc(doc(db, 'users', buyerUid));
        if (!userDoc.exists()) return;
        const referredBy = userDoc.data()?.referredBy;
        if (!referredBy) return;
        const refQuery = query(
            collection(db, 'referrals'),
            where('referredUserId', '==', buyerUid),
            where('status', '==', 'pending')
        );
        const refSnap = await getDocs(refQuery);
        if (refSnap.empty) return;
        const updates = refSnap.docs.map(refDoc =>
            updateDoc(refDoc.ref, {
                status: 'completed',
                completedAt: serverTimestamp(),
            })
        );
        await Promise.all(updates);
    } catch (err) {
        console.error('Error completing referral:', err);
    }
};

export default function PaymentClient() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const rawBookId = searchParams.get('bookId');
    const bookId = rawBookId?.startsWith('firestore-') ? rawBookId : `firestore-${rawBookId}`;

    const [allBooks, setAllBooks] = useState([]);
    const [book, setBook] = useState(null);
    const [sellerDetails, setSellerDetails] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [paymentMethod, setPaymentMethod] = useState('flutterwave');
    const [referralCompleted, setReferralCompleted] = useState(false);

    // PIN modal state
    const [showPinModal, setShowPinModal] = useState(false);
    const [enteredPin, setEnteredPin] = useState('');
    const [pinView, setPinView] = useState('enter'); // 'enter' | 'setup' | 'forgot' | 'otp'
    const [setupPin, setSetupPin] = useState('');
    const [setupPinConfirm, setSetupPinConfirm] = useState('');
    const [otpInput, setOtpInput] = useState('');
    const [newResetPin, setNewResetPin] = useState('');
    const [pinLocalError, setPinLocalError] = useState('');

    const [formData, setFormData] = useState({
        email: auth.currentUser?.email || '',
        phone: '',
        name: ''
    });

    const {
        processing,
        paymentSuccess,
        setPaymentSuccess,
        error: paymentError,
        setError: setPaymentError,
        processFlutterwavePayment,
        processPayPalPayment,
        processWalletPayment,
        setupInitialPin,
        requestPinReset,
        verifyOtpAndSetPin,
    } = usePayment(book, formData, sellerDetails);

    const pinNotSet = paymentError?.message?.includes("haven't set");

    useEffect(() => {
        const loadBook = async () => {
            if (!bookId) { setError("No book ID provided"); setLoading(false); return; }
            try {
                setLoading(true);
                const bookData = await fetchBookDetails(bookId);
                if (!bookData) { setError("Book not found"); setLoading(false); return; }
                const validation = validateBookForPurchase(bookData);
                if (!validation.valid) { setError(validation.error); setLoading(false); return; }
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
                setError("Failed to load book details: " + err.message);
            } finally {
                setLoading(false);
            }
        };
        loadBook();
    }, [bookId]);

    useEffect(() => {
        if (paymentMethod === 'paypal' && book) {
            const timer = setTimeout(() => {
                if (typeof renderPayPalButtons === 'function') {
                    renderPayPalButtons(
                        'paypal-button-container',
                        book,
                        (details) => processPayPalPayment(details),
                        (err) => setPaymentError({ message: "PayPal checkout failed." }),
                        () => console.log('PayPal cancelled')
                    ).catch(err => setPaymentError(err));
                }
            }, 100);
            return () => clearTimeout(timer);
        }
    }, [paymentMethod, book]);

    useEffect(() => {
        if (paymentSuccess && !referralCompleted) {
            setReferralCompleted(true);
            const buyerUid = auth.currentUser?.uid;
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

        if (paymentMethod === 'flutterwave') {
            processFlutterwavePayment();
        } else if (paymentMethod === 'paypal') {
            // PayPal is handled by the rendered buttons, nothing to do here
        } else if (paymentMethod === 'wallet') {
            // Open PIN modal — do NOT call processWalletPayment here
            setEnteredPin('');
            setPinLocalError('');
            setPinView('enter');
            setPaymentError(null);
            setShowPinModal(true);
        }
    };

    const handlePinConfirm = () => {
        setPinLocalError('');
        if (!enteredPin || enteredPin.length < 4) {
            setPinLocalError('Please enter your 4-digit PIN.');
            return;
        }
        processWalletPayment(enteredPin);
        setShowPinModal(false);
        setEnteredPin('');
    };

    const handleSetupPin = async () => {
        setPinLocalError('');
        if (setupPin.length < 4) { setPinLocalError('PIN must be 4 digits.'); return; }
        if (setupPin !== setupPinConfirm) { setPinLocalError('PINs do not match.'); return; }
        const result = await setupInitialPin(setupPin);
        if (result.success) {
            setSetupPin('');
            setSetupPinConfirm('');
            setPinView('enter');
            setPaymentError(null);
        }
    };

    const handleRequestOtp = async () => {
        setPinLocalError('');
        const result = await requestPinReset();
        if (result.success) {
            setPinView('otp');
        } else {
            setPinLocalError('Failed to send code. Try again.');
        }
    };

    const handleVerifyOtp = async () => {
        setPinLocalError('');
        if (otpInput.length < 6) { setPinLocalError('Enter the 6-digit code.'); return; }
        if (newResetPin.length < 4) { setPinLocalError('New PIN must be 4 digits.'); return; }
        try {
            await verifyOtpAndSetPin(otpInput, newResetPin);
            setOtpInput('');
            setNewResetPin('');
            setPinView('enter');
            setPaymentError(null);
        } catch (err) {
            setPinLocalError(err.message);
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
                    <button onClick={() => window.history.back()} className="bg-blue-950 text-white px-6 py-3 rounded-lg hover:bg-blue-900">
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
                    <p className="text-gray-600 mb-4">Your payment has been processed successfully.</p>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                        <p className="text-sm text-blue-950"><strong>Email:</strong> {formData.email}</p>
                        <p className="text-sm text-blue-950 mt-2"><strong>Book:</strong> {book.title}</p>
                        <p className="text-sm text-blue-950 mt-2"><strong>Amount:</strong> ₦{book.price.toLocaleString()}</p>
                        {sellerDetails && <p className="text-sm text-blue-950 mt-2"><strong>Seller:</strong> {sellerDetails.name}</p>}
                    </div>
                    <p className="text-gray-600 mb-4">Redirecting to book preview...</p>
                    <Link href={`/book/preview?id=${bookId}&purchased=true`} className="inline-block bg-blue-950 text-white px-6 py-3 rounded-lg hover:bg-blue-900 transition-colors">
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

             

                {!sellerDetails && (
                    <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <p className="text-yellow-900"><strong>Warning:</strong> Seller information is missing.</p>
                    </div>
                )}

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
                            <p className="text-sm text-gray-500">Sold by: {book.sellerName || sellerDetails?.name || 'Unknown'}</p>
                            {book.source === 'platform' && (
                                <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded mt-2">Platform Book</span>
                            )}
                            <div className="mt-6 max-lg:hidden bg-green-50 border border-green-200 rounded-lg p-4">
                                <p className="text-sm text-green-950"><strong>Description:</strong></p>
                                <p className="text-xs text-green-800 mt-1">{book.description || 'No description provided.'}</p>
                            </div>
                        </div>
                    </div>
                    <div className="mt-6 lg:hidden bg-green-50 border border-green-200 rounded-lg p-4">
                        <p className="text-sm text-green-950"><strong>Description:</strong></p>
                        <p className="text-xs text-green-800 mt-1">{book.description || 'No description provided.'}</p>
                    </div>
                </div>

                <div className="bg-blue-950 text-white rounded-lg p-4 mb-6 text-center font-bold">
                    <h1>Save 80% by selling on LAN Library!</h1>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-lg shadow-lg p-6">
                            <h3 className="text-xl font-bold text-gray-900 mb-6">Payment Information</h3>
                            <PaymentMethodSelector paymentMethod={paymentMethod} setPaymentMethod={setPaymentMethod} />


                            <PaymentForm
                                formData={formData}
                                handleInputChange={handleInputChange}
                                processing={processing}
                                onSubmit={handlePayment}
                                paymentMethod={paymentMethod}
                                book={book}
                                paymentError={paymentError}
                            />
                            <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                                <p className="text-sm text-blue-950">
                                    <strong>Invite Your Friends & Earn ₦500: </strong>
                                    <Link href="/referrals" className="font-bold underline">Get your referral link →</Link>
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="lg:col-span-1">
                        <OrderSummary book={book} sellerDetails={sellerDetails} />
                    </div>
                </div>

                <div className="mt-12">
                    <h3 className="text-2xl font-bold text-gray-900 mb-6">You might also like</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {(allBooks.length > 0 ? allBooks : booksData)
                            .filter((relatedBook) => relatedBook.id !== bookId)
                            .slice(0, 8)
                            .map((relatedBook) => (
                                <Link key={relatedBook.id} href={`/book/preview?id=${relatedBook.id}`} className="group">
                                    <div className="relative mb-3">
                                        <img
                                            src={getThumbnailUrl(relatedBook)}
                                            alt={relatedBook.title}
                                            className="w-full h-[240px] object-cover rounded shadow-md group-hover:shadow-xl transition-shadow"
                                            onError={(e) => { e.target.src = "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400"; }}
                                            loading="lazy"
                                        />
                                    </div>
                                    <h4 className="font-bold text-sm text-gray-900 mb-1 line-clamp-2 group-hover:text-blue-600">{relatedBook.title}</h4>
                                    <p className="text-gray-600 text-xs">{relatedBook.author}</p>
                                </Link>
                            ))}
                    </div>
                </div>
            </main>

            {/* PIN Modal */}
            {showPinModal && (
                <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl">

                        {/* Header */}
                        <div className="bg-blue-950 px-6 py-5 flex items-center justify-between">
                            <div>
                                <p className="text-blue-300 text-xs mb-1">Confirm payment</p>
                                <p className="text-white text-lg font-semibold">Enter your PIN</p>
                            </div>
                            <button
                                onClick={() => { setShowPinModal(false); setEnteredPin(''); setPinLocalError(''); setPinView('enter'); }}
                                className="w-9 h-9 rounded-full border border-white/20 flex items-center justify-center text-blue-300 hover:text-white hover:border-white/40 transition-colors"
                            >
                                <X size={16} />
                            </button>
                        </div>

                        <div className="p-6">

                            {/* Error */}
                            {(pinLocalError || paymentError) && (
                                <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl p-3 mb-4">
                                    <AlertCircle size={16} className="text-red-500 flex-shrink-0" />
                                    <p className="text-sm text-red-600">{pinLocalError || paymentError?.message}</p>
                                </div>
                            )}

                            {/* ── ENTER PIN ── */}
                            {pinView === 'enter' && (
                                <>
                                    {/* Summary */}
                                    <p className="text-sm text-gray-500 text-center mb-5">
                                        Authorise payment of{" "}
                                        <strong className="text-blue-950">₦{book.price.toLocaleString()}</strong>{" "}
                                        for <strong className="text-blue-950">{book.title}</strong>
                                    </p>

                                    {/* PIN dots */}
                                    <div className="flex justify-center gap-3 mb-5">
                                        {Array.from({ length: 4 }, (_, i) => i < enteredPin.length).map((filled, i) => (
                                            <div
                                                key={i}
                                                className={`rounded-xl border-2 flex items-center justify-center text-2xl transition-all duration-150 ${filled ? "border-blue-950 text-blue-950" : "border-gray-200 text-gray-300"
                                                    }`}
                                                style={{ width: 52, height: 56 }}
                                            >
                                                {filled ? "●" : "○"}
                                            </div>
                                        ))}
                                    </div>

                                    {/* Forgot PIN link */}
                                    <div className="flex justify-between text-xs mb-4">
                                        <button
                                            onClick={() => { setPinView('forgot'); setPinLocalError(''); }}
                                            className="text-blue-600 hover:underline"
                                        >
                                            Forgot PIN?
                                        </button>
                                        {pinNotSet && (
                                            <button
                                                onClick={() => { setPinView('setup'); setPinLocalError(''); }}
                                                className="text-green-600 font-bold hover:underline"
                                            >
                                                Setup PIN Now
                                            </button>
                                        )}
                                    </div>

                                    {/* Numpad */}
                                    <div className="grid grid-cols-3 gap-2 mb-2">
                                        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
                                            <button
                                                key={n}
                                                onClick={() => {
                                                    if (enteredPin.length < 4) {
                                                        setEnteredPin(p => p + String(n));
                                                        setPinLocalError('');
                                                        setPaymentError(null);
                                                    }
                                                }}
                                                disabled={enteredPin.length >= 4}
                                                className="rounded-xl border border-gray-200 text-lg font-semibold text-blue-950 hover:bg-blue-50 active:scale-95 transition-all disabled:opacity-40"
                                                style={{ height: 52 }}
                                            >
                                                {n}
                                            </button>
                                        ))}
                                    </div>
                                    <div className="grid grid-cols-3 gap-2 mb-5">
                                        <div />
                                        <button
                                            onClick={() => {
                                                if (enteredPin.length < 4) {
                                                    setEnteredPin(p => p + '0');
                                                    setPinLocalError('');
                                                    setPaymentError(null);
                                                }
                                            }}
                                            disabled={enteredPin.length >= 4}
                                            className="rounded-xl border border-gray-200 text-lg font-semibold text-blue-950 hover:bg-blue-50 active:scale-95 transition-all disabled:opacity-40"
                                            style={{ height: 52 }}
                                        >
                                            0
                                        </button>
                                        <button
                                            onClick={() => setEnteredPin(p => p.slice(0, -1))}
                                            className="rounded-xl border border-gray-200 text-lg text-gray-400 hover:bg-gray-50 active:scale-95 transition-all"
                                            style={{ height: 52 }}
                                        >
                                            ⌫
                                        </button>
                                    </div>

                                    {/* Confirm */}
                                    <button
                                        onClick={handlePinConfirm}
                                        disabled={enteredPin.length < 4 || processing}
                                        className="w-full bg-blue-950 text-white py-3.5 rounded-xl font-semibold hover:bg-blue-900 active:scale-[0.99] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                                    >
                                        {processing ? (
                                            <span className="flex items-center justify-center gap-2">
                                                <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                                                Verifying...
                                            </span>
                                        ) : "Confirm Payment"}
                                    </button>
                                </>
                            )}

                            {/* ── SETUP PIN ── */}
                            {pinView === 'setup' && (
                                <>
                                    <p className="text-sm text-gray-500 text-center mb-5">Create a 4-digit wallet PIN</p>

                                    <input
                                        type="password"
                                        value={setupPin}
                                        onChange={(e) => setSetupPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                                        className="w-full p-3 border-2 border-gray-200 rounded-xl text-center text-2xl tracking-widest focus:border-blue-950 focus:outline-none mb-3"
                                        placeholder="New PIN"
                                        maxLength={4}
                                        inputMode="numeric"
                                    />
                                    <input
                                        type="password"
                                        value={setupPinConfirm}
                                        onChange={(e) => setSetupPinConfirm(e.target.value.replace(/\D/g, '').slice(0, 4))}
                                        className="w-full p-3 border-2 border-gray-200 rounded-xl text-center text-2xl tracking-widest focus:border-blue-950 focus:outline-none mb-5"
                                        placeholder="Confirm PIN"
                                        maxLength={4}
                                        inputMode="numeric"
                                    />
                                    <button
                                        onClick={handleSetupPin}
                                        disabled={processing || setupPin.length < 4 || setupPinConfirm.length < 4}
                                        className="w-full bg-green-600 text-white py-3.5 rounded-xl font-semibold hover:bg-green-700 transition-all disabled:opacity-40 disabled:cursor-not-allowed mb-3"
                                    >
                                        {processing ? 'Saving...' : 'Set PIN & Continue'}
                                    </button>
                                    <button
                                        onClick={() => { setPinView('enter'); setPinLocalError(''); }}
                                        className="w-full text-sm text-gray-400 hover:text-gray-600 py-2"
                                    >
                                        Back
                                    </button>
                                </>
                            )}

                            {/* ── FORGOT PIN ── */}
                            {pinView === 'forgot' && (
                                <>
                                    <p className="text-sm text-gray-500 text-center mb-6">
                                        We'll send a 6-digit reset code to verify your identity.
                                    </p>
                                    <button
                                        onClick={handleRequestOtp}
                                        disabled={processing}
                                        className="w-full bg-blue-950 text-white py-3.5 rounded-xl font-semibold hover:bg-blue-900 transition-all disabled:opacity-50 mb-3"
                                    >
                                        {processing ? 'Sending...' : 'Send Reset Code'}
                                    </button>
                                    <button
                                        onClick={() => { setPinView('enter'); setPinLocalError(''); }}
                                        className="w-full text-sm text-gray-400 hover:text-gray-600 py-2"
                                    >
                                        Back
                                    </button>
                                </>
                            )}

                            {/* ── OTP + NEW PIN ── */}
                            {pinView === 'otp' && (
                                <>
                                    <p className="text-sm text-gray-500 text-center mb-5">
                                        Enter the 6-digit code and your new PIN
                                    </p>
                                    <input
                                        type="text"
                                        value={otpInput}
                                        onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                        className="w-full p-3 border-2 text-blue-950 border-gray-200 rounded-xl text-center text-xl tracking-widest focus:border-blue-950 focus:outline-none mb-3"
                                        placeholder="6-digit code"
                                        maxLength={6}
                                        inputMode="numeric"
                                    />
                                    <input
                                        type="password"
                                        value={newResetPin}
                                        onChange={(e) => setNewResetPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                                        className="w-full p-3 border-2 text-blue-950 border-gray-200 rounded-xl text-center text-2xl tracking-widest focus:border-blue-950 focus:outline-none mb-5"
                                        placeholder="New 4-digit PIN"
                                        maxLength={4}
                                        inputMode="numeric"
                                    />
                                    <button
                                        onClick={handleVerifyOtp}
                                        disabled={processing || otpInput.length < 6 || newResetPin.length < 4}
                                        className="w-full bg-blue-950 text-white py-3.5 rounded-xl font-semibold hover:bg-blue-900 transition-all disabled:opacity-40 disabled:cursor-not-allowed mb-3"
                                    >
                                        {processing ? 'Verifying...' : 'Reset PIN & Continue'}
                                    </button>
                                    <button
                                        onClick={() => { setPinView('forgot'); setPinLocalError(''); }}
                                        className="w-full text-sm text-gray-400 hover:text-gray-600 py-2"
                                    >
                                        Back
                                    </button>
                                </>
                            )}

                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}