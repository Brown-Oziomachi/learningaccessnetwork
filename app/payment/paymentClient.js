// ===========================
// FILE: app/payment/page.jsx
// WITH FIREBASE INTEGRATION
// ===========================

"use client"
import React, { useState, useEffect } from 'react';
import { Menu, User, ChevronDown, Download, AlignEndVertical, LogOut, X, CreditCard, Search, Lock, CheckCircle, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { auth } from "@/lib/firebaseConfig";
import { booksData } from "@/lib/booksData";
import { doc, setDoc, getDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from "@/lib/firebaseConfig"; // Make sure db is exported from firebaseConfig

export default function PaymentClient() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const bookId = searchParams.get('bookId');
    
    const [book, setBook] = useState(null);
    const [showMobileMenu, setShowMobileMenu] = useState(false);
    const [showMobileSearch, setShowMobileSearch] = useState(false);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [processing, setProcessing] = useState(false);
    const [paymentSuccess, setPaymentSuccess] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState('flutterwave');
    const [formData, setFormData] = useState({
        email: auth.currentUser?.email || '',
        phone: '',
        name: ''
    });

    useEffect(() => {
        const selectedBook = booksData.find(b => b.id === parseInt(bookId));
        
        if (selectedBook) {
            setBook(selectedBook);
        } else {
            router.push('/');
        }
        setLoading(false);
    }, [bookId, router]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleFlutterwavePayment = () => {
        setProcessing(true);

        // FLUTTERWAVE TEST CREDENTIALS
        // Sign up at: https://dashboard.flutterwave.com/signup
        // Test Public Key format: FLWPUBK_TEST-xxxxxxxxxxxxxx
        const flutterwaveConfig = {
            public_key: 'FLWPUBK_TEST-4bcf55a81b93a172d06a778a532937db-X', // Replace with YOUR test key
            tx_ref: `TXN${Date.now()}`,
            amount: book.price,
            currency: 'NGN',
            payment_options: 'card,ussd,bank_transfer',
            customer: {
                email: formData.email,
                phone_number: formData.phone,
                name: formData.name,
            },
            customizations: {
                title: 'Learning Access',
                description: `Payment for ${book.title}`,
                logo: 'https://yourwebsite.com/logo.png',
            },
        };

        // Load Flutterwave inline script
        const script = document.createElement('script');
        script.src = 'https://checkout.flutterwave.com/v3.js';
        script.async = true;
        script.onload = () => {
            if (window.FlutterwaveCheckout) {
                window.FlutterwaveCheckout({
                    ...flutterwaveConfig,
                    callback: (response) => {
                        console.log('Payment Response:', response);
                        if (response.status === 'successful') {
                            handlePaymentSuccess(response);
                        } else {
                            setProcessing(false);
                            alert('Payment failed. Please try again.');
                        }
                    },
                    onclose: () => {
                        setProcessing(false);
                    },
                });
            }
        };
        document.body.appendChild(script);
    };

     const handleSearch = () => {
            if (searchQuery.trim()) {
                router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
                setShowMobileSearch(false); // hide mobile dropdown if open
            }
        };
    
         const handleLogout = async () => {
            try {
                await signOut(auth);
                router.push("/");
            } catch (error) {
                console.error("Logout error:", error);
            }
        };
    
    const handlePayPalPayment = () => {
        setProcessing(true);

        if (window.paypal) {
            renderPayPalButtons();
            return;
        }

        const script = document.createElement('script');
        script.src = `https://www.paypal.com/sdk/js?client-id=YOUR-PAYPAL-CLIENT-ID&currency=USD`;
        script.async = true;
        
        script.onload = () => {
            renderPayPalButtons();
        };

        script.onerror = () => {
            setProcessing(false);
            alert('Failed to load PayPal. Please try again.');
        };

        document.body.appendChild(script);
    };

    const renderPayPalButtons = () => {
        const container = document.getElementById('paypal-button-container');
        if (!container) return;

        container.innerHTML = '';

        window.paypal.Buttons({
            createOrder: (data, actions) => {
                return actions.order.create({
                    purchase_units: [{
                        amount: {
                            value: (book.price / 1500).toFixed(2),
                            currency_code: 'USD'
                        },
                        description: `${book.title} - ${book.author}`
                    }]
                });
            },
            onApprove: (data, actions) => {
                return actions.order.capture().then((details) => {
                    console.log('PayPal Payment Successful:', details);
                    handlePaymentSuccess(details);
                });
            },
            onError: (err) => {
                console.error('PayPal Error:', err);
                setProcessing(false);
                alert('Payment failed. Please try again.');
            },
            onCancel: () => {
                setProcessing(false);
            }
        }).render('#paypal-button-container');
    };

    const savePurchaseToFirebase = async (purchaseRecord) => {
        try {
            const user = auth.currentUser;
            if (!user) {
                throw new Error('User not authenticated');
            }

            const userDocRef = doc(db, 'users', user.uid);
            const userDoc = await getDoc(userDocRef);

            if (userDoc.exists()) {
                // User document exists, update purchased books array
                await updateDoc(userDocRef, {
                    purchasedBooks: arrayUnion(purchaseRecord)
                });
            } else {
                // Create new user document with purchased book
                await setDoc(userDocRef, {
                    email: user.email,
                    purchasedBooks: [purchaseRecord],
                    createdAt: new Date().toISOString()
                });
            }

            console.log('Purchase saved to Firebase successfully');
            return true;
        } catch (error) {
            console.error('Error saving to Firebase:', error);
            // Still save to localStorage as backup
            return false;
        }
    };

    const handlePaymentSuccess = async (paymentDetails) => {
        const userEmail = formData.email || auth.currentUser?.email;
        
        const purchaseRecord = {
            id: book.id,
            title: book.title,
            author: book.author,
            image: book.image,
            price: book.price,
            format: book.format,
            pages: book.pages,
            category: book.category,
            purchaseDate: new Date().toISOString(),
            transactionId: paymentDetails.tx_ref || paymentDetails.id || `TXN${Date.now()}`,
            amount: book.price,
            paymentMethod: paymentMethod,
            status: 'completed'
        };

        // Save to Firebase
        await savePurchaseToFirebase(purchaseRecord);

        // Also save to localStorage as backup
        const purchased = JSON.parse(localStorage.getItem(`purchased_${userEmail}`) || '[]');
        const alreadyPurchased = purchased.some(p => p.id === book.id);
        
        if (!alreadyPurchased) {
            purchased.push(purchaseRecord);
            localStorage.setItem(`purchased_${userEmail}`, JSON.stringify(purchased));
        }
        
        setProcessing(false);
        setPaymentSuccess(true);
        
        // Redirect to My Books after 3 seconds
        setTimeout(() => {
            router.push('/my-books');
        }, 3000);
    };

    const handlePayment = (e) => {
        e.preventDefault();

        if (!formData.email || !formData.phone || !formData.name) {
            alert('Please fill in all required fields');
            return;
        }

        if (paymentMethod === 'flutterwave') {
            handleFlutterwavePayment();
        } else if (paymentMethod === 'paypal') {
            handlePayPalPayment();
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-blue-950 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-50 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading payment gateway...</p>
                </div>
            </div>
        );
    }

    if (!book) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <AlertCircle className="w-16 h-16 mx-auto mb-4 text-red-500" />
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Book Not Found</h2>
                    <p className="text-gray-600 mb-4">The selected book could not be found.</p>
                    <Link href="/" className="text-blue-600 hover:underline">Return to Home</Link>
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
                        Your payment has been processed successfully. The PDF has been sent to your email.
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
                    <p className="text-gray-600 mb-4">Redirecting to My Books...</p>
                    <Link
                        href="/my-books"
                        className="inline-block bg-blue-950 text-white px-6 py-3 rounded-lg hover:bg-blue-900 transition-colors"
                    >
                        Go to My Books
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-blue-950 text-white sticky top-0 z-50 shadow-lg ">
                <div className="max-w-7xl mx-auto px-4 py-3 sm:py-4">
                    {/* TOP BAR */}
                    <div className="flex items-center justify-between gap-2 sm:gap-4">
                        {/* MOBILE MENU BUTTON */}
                        <button
                            className="md:hidden p-2 hover:bg-blue-900 rounded-lg transition-colors"
                            onClick={() => {
                                setShowMobileMenu(!showMobileMenu);
                                setShowMobileSearch(false);
                            }}
                            aria-label="Toggle menu"
                        >
                            {showMobileMenu ? <X size={24} /> : <Menu size={24} />}
                        </button>

                        {/* LOGO */}
                        <a href="/" className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                            <img
                                src="/lan-logo.png"
                                alt="LAN logo"
                                className="w-8 h-8 sm:w-12 sm:h-12 lg:w-16 lg:h-16 object-contain"
                            />
                            <h1 className="text-xl sm:text-sm lg:text-base font-bold leading-tight">
                                LEARNING <span className="text-blue-400 block sm:inline">ACCESS NETWORK</span>
                            </h1>
                        </a>

                        {/* MOBILE SEARCH ICON */}
                        <button
                            onClick={() => {
                                setShowMobileSearch(!showMobileSearch);
                                setShowMobileMenu(false);
                            }}
                            className="md:hidden p-2 hover:bg-blue-900 rounded-lg transition-colors"
                            aria-label="Toggle search"
                        >
                            <Search size={22} />
                        </button>

                        {/* DESKTOP SEARCH */}
                        <div className="hidden md:flex flex-1 max-w-md mx-4 lg:mx-8">
                            <div className="relative w-full">
                                <input
                                    type="text"
                                    placeholder="Search PDF books..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                                    className="w-full text-white px-4 py-2 pr-10 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-400"
                                />
                                <button
                                    onClick={handleSearch}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 text-blue-950 hover:text-blue-700 transition-colors"
                                    aria-label="Search"
                                >
                                    <Search size={20} />
                                </button>
                            </div>
                        </div>

                        {/* DESKTOP ACTIONS */}
                        <nav className="hidden md:flex items-center gap-2 lg:gap-4 flex-shrink-0">
                            <a
                                href="/my-account"
                                className="flex items-center gap-1 lg:gap-2 px-2 lg:px-3 py-2 hover:bg-blue-900 rounded-lg transition-colors text-sm lg:text-base"
                            >
                                <User size={18} className="lg:w-5 lg:h-5" />
                                <span className="hidden lg:inline">Account</span>
                                <ChevronDown size={14} className="lg:w-4 lg:h-4" />
                            </a>

                            <a
                                href="/my-books"
                                className="flex items-center gap-1 lg:gap-2 px-2 lg:px-3 py-2 hover:bg-blue-900 rounded-lg transition-colors text-sm lg:text-base"
                            >
                                <Download size={18} className="lg:w-5 lg:h-5" />
                                <span className="hidden lg:inline">My Books</span>
                            </a>

                            <a
                                href="/advertise"
                                className="flex items-center gap-1 lg:gap-2 px-2 lg:px-3 py-2 hover:bg-blue-900 rounded-lg transition-colors text-sm lg:text-base whitespace-nowrap"
                            >
                                <AlignEndVertical size={18} className="lg:w-5 lg:h-5" />
                                <span className="hidden xl:inline">Advertise</span>
                            </a>

                            <button
                                onClick={handleLogout}
                                className="flex items-center gap-1 lg:gap-2 px-2 lg:px-3 py-2 text-red-400 hover:bg-red-900/30 rounded-lg transition-colors text-sm lg:text-base"
                            >
                                <LogOut size={18} className="lg:w-5 lg:h-5" />
                                <span className="hidden lg:inline">Logout</span>
                            </button>
                        </nav>
                    </div>

                    {/* MOBILE SEARCH DROPDOWN */}
                    {showMobileSearch && (
                        <div className="mt-3 md:hidden animate-slideDown">
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Search PDF books..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                                    className="w-full text-white px-4 py-2 pr-10 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-400"
                                    autoFocus
                                />
                                <button
                                    onClick={handleSearch}
                                    className="absolute right-2 t text-blue-950 hover:text-blue-700 transition-colors"
                                    aria-label="Search"
                                >
                                    <Search size={20} />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* MOBILE MENU */}
                    {showMobileMenu && (
                        <nav className="md:hidden mt-3 border-t border-blue-800 pt-3 animate-slideDown">
                            <div className="space-y-1">
                                <a
                                    href="/my-account"
                                    className="flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-blue-900 transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <User size={20} />
                                        <span className="text-sm font-medium">Account</span>
                                    </div>
                                    <ChevronDown size={16} />
                                </a>

                                <a
                                    href="/my-books"
                                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-blue-900 transition-colors"
                                >
                                    <Download size={20} />
                                    <span className="text-sm font-medium">My Books</span>
                                </a>

                                <a
                                    href="/advertise"
                                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-blue-900 transition-colors"
                                >
                                    <AlignEndVertical size={20} />
                                    <span className="text-sm font-medium">Advertise With Us</span>
                                </a>

                                <button
                                    onClick={handleLogout}
                                    className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-red-400 hover:bg-red-900/30 transition-colors"
                                >
                                    <LogOut size={20} />
                                    <span className="text-sm font-medium">Logout</span>
                                </button>
                            </div>
                        </nav>
                    )}
                </div>

                <style jsx>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-slideDown {
          animation: slideDown 0.2s ease-out;
        }
      `}</style>
            </header>

            <main className="max-w-6xl mx-auto px-4 py-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-8">Complete Your Purchase</h2>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Payment Form */}
                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-lg shadow-lg p-6">
                            <h3 className="text-xl font-bold text-gray-900 mb-6">Payment Information</h3>

                            {/* Payment Method Selection */}
                            <div className="mb-6">
                                <label className="block text-sm font-semibold text-gray-700 mb-3">
                                    Select Payment Method
                                </label>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <button
                                        onClick={() => setPaymentMethod('flutterwave')}
                                        className={`p-4 border-2 rounded-lg transition-colors ${
                                            paymentMethod === 'flutterwave'
                                                ? 'border-blue-950 bg-blue-50'
                                                : 'border-gray-300 hover:border-blue-950'
                                        }`}
                                    >
                                        <CreditCard className="w-8 h-8 mx-auto mb-2 text-blue-950" />
                                        <p className="font-semibold text-gray-900">Flutterwave</p>
                                        <p className="text-xs text-gray-600 mt-1">Card, Bank Transfer, USSD</p>
                                    </button>
                                    <button
                                        onClick={() => setPaymentMethod('paypal')}
                                        className={`p-4 border-2 rounded-lg transition-colors ${
                                            paymentMethod === 'paypal'
                                                ? 'border-blue-950 bg-blue-50'
                                                : 'border-gray-300 hover:border-blue-950'
                                        }`}
                                    >
                                        <Lock className="w-8 h-8 mx-auto mb-2 text-blue-950" />
                                        <p className="font-semibold text-gray-900">PayPal</p>
                                        <p className="text-xs text-gray-600 mt-1">International Payments</p>
                                    </button>
                                </div>
                            </div>

                            <div>
                                <div className="mb-4">
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Full Name *
                                    </label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleInputChange}
                                        placeholder="John Doe"
                                        required
                                        className="w-full text-blue-950 border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-950"
                                    />
                                </div>

                                <div className="mb-4">
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Email Address *
                                    </label>
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleInputChange}
                                        placeholder="your@email.com"
                                        required
                                        className="w-full text-blue-950 border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-950"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">PDF will be sent to this email</p>
                                </div>

                                <div className="mb-6">
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Phone Number *
                                    </label>
                                    <input
                                        type="tel"
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleInputChange}
                                        placeholder="+234 800 000 0000"
                                        required
                                        className="w-full text-blue-950 border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-950"
                                    />
                                </div>

                                {/* PayPal Button Container */}
                                {paymentMethod === 'paypal' && (
                                    <div id="paypal-button-container" className="mb-4"></div>
                                )}

                                <button
                                    onClick={handlePayment}
                                    disabled={processing}
                                    className="w-full bg-blue-950 text-white py-4 rounded-lg hover:bg-blue-900 transition-colors font-semibold text-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {processing ? (
                                        <>
                                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                            Processing Payment...
                                        </>
                                    ) : (
                                        <>
                                            <Lock size={20} />
                                            {paymentMethod === 'flutterwave' 
                                                ? `Pay ₦ ${book.price.toLocaleString()} with Flutterwave`
                                                : 'Continue to PayPal'}
                                        </>
                                    )}
                                </button>

                                <p className="text-xs text-gray-500 text-center mt-4">
                                    <Lock className="inline w-3 h-3 mr-1" />
                                    Your payment information is secure and encrypted
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Order Summary */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-lg shadow-lg p-6 sticky top-8">
                            <h3 className="text-xl font-bold text-gray-900 mb-4">Order Summary</h3>
                            
                            <div className="mb-4">
                                <img
                                    src={book.image}
                                    alt={book.title}
                                    className="w-full h-48 object-cover rounded-lg mb-3"
                                />
                                <h4 className="font-bold text-gray-900">{book.title}</h4>
                                <p className="text-sm text-gray-600">{book.author}</p>
                                <p className="text-xs text-gray-500 mt-1">{book.pages} pages • {book.format}</p>
                            </div>

                            <div className="border-t border-gray-200 pt-4 space-y-3">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Subtotal</span>
                                    <span className="font-semibold text-blue-950">₦ {book.price.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Processing Fee</span>
                                    <span className="font-semibold text-blue-950">₦ 0</span>
                                </div>
                                {book.discount && (
                                    <div className="flex justify-between text-sm text-green-600">
                                        <span>Discount {book.discount}</span>
                                        <span className="font-semibold">
                                            - ₦ {(book.oldPrice - book.price).toLocaleString()}
                                        </span>
                                    </div>
                                )}
                                <div className="border-t border-gray-200 pt-3 flex justify-between text-lg font-bold">
                                    <span>Total</span>
                                    <span className="text-blue-950">₦ {book.price.toLocaleString()}</span>
                                </div>
                            </div>

                            <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                                <p className="text-sm text-blue-950">
                                    <strong>✓ Instant Access</strong><br />
                                    Download your PDF immediately after payment
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}