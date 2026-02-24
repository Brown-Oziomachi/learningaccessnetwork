'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, AlertCircle, Search, User, Mail } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from '@/lib/firebaseConfig';
import { onAuthStateChanged } from "firebase/auth";

export default function FindAccountClient() {
    const router = useRouter();

    const [step, setStep] = useState('email'); // email | password
    const [searchInput, setSearchInput] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [userData, setUserData] = useState(null);
    const [showAccountNotFoundModal, setShowAccountNotFoundModal] = useState(false);
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [searchingLive, setSearchingLive] = useState(false);
    const [showSuspendedModal, setShowSuspendedModal] = useState(false);
    const [showPendingModal, setShowPendingModal] = useState(false);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                router.replace("/home");
            } else {
                setLoading(false);
            }
        });

        return () => unsubscribe();
    }, [router]);

    // Live search as user types
    useEffect(() => {
        const searchLive = async () => {
            if (!searchInput.trim() || searchInput.trim().length < 2) {
                setSuggestions([]);
                setShowSuggestions(false);
                return;
            }

            setSearchingLive(true);

            try {
                const usersRef = collection(db, 'users');
                const searchTerm = searchInput.trim().toLowerCase();

                console.log('🔍 Live searching for:', searchTerm);

                // Search by email
                const qEmail = query(usersRef, where('email', '>=', searchTerm), where('email', '<=', searchTerm + '\uf8ff'));
                const emailSnap = await getDocs(qEmail);

                const results = [];
                const seenEmails = new Set();

                // Add email matches
                emailSnap.forEach(doc => {
                    const data = doc.data();
                    if (!seenEmails.has(data.email)) {
                        results.push(data);
                        seenEmails.add(data.email);
                    }
                });

                // Search by name (get all and filter client-side)
                const allUsersSnap = await getDocs(usersRef);

                allUsersSnap.forEach(doc => {
                    const data = doc.data();
                    if (seenEmails.has(data.email)) return; // Skip if already added

                    const firstName = (data.firstName || '').toLowerCase();
                    const surname = (data.surname || '').toLowerCase();
                    const displayName = (data.displayName || '').toLowerCase();

                    if (
                        firstName.includes(searchTerm) ||
                        surname.includes(searchTerm) ||
                        displayName.includes(searchTerm)
                    ) {
                        results.push(data);
                        seenEmails.add(data.email);
                    }
                });

                console.log('✅ Found', results.length, 'matching accounts');

                // Limit to top 8 suggestions
                setSuggestions(results.slice(0, 8));
                setShowSuggestions(results.length > 0);
            } catch (err) {
                console.error('❌ Live search error:', err);
            } finally {
                setSearchingLive(false);
            }
        };

        // Debounce the search
        const timeoutId = setTimeout(searchLive, 400);
        return () => clearTimeout(timeoutId);
    }, [searchInput]);

    // Select suggestion and go to password
    const handleSelectSuggestion = (user) => {
        console.log('👤 Selected user:', user.email);

        const accountStatus = user.accountStatus || 'active';

        if (accountStatus === 'suspended') {
            setShowSuggestions(false);
            setShowSuspendedModal(true);
            return;
        }

        if (accountStatus === 'pending') {
            setShowSuggestions(false);
            setShowPendingModal(true);
            return;
        }

        // Set user data and move to password step
        setUserData(user);
        setEmail(user.email);
        setSearchInput('');
        setShowSuggestions(false);
        setStep('password');
    };

    // STEP 2: LOGIN
    const handleLogin = async () => {
        if (!password.trim()) {
            setError('Enter your password');
            return;
        }

        setLoading(true);
        setError('');

        try {
            console.log('🔐 Attempting login for:', email);
            await signInWithEmailAndPassword(auth, email, password);
            console.log('✅ Login successful');
            router.push('/home');
        } catch (err) {
            console.error('❌ Login Error:', err);

            // Handle all possible Firebase auth errors
            switch (err.code) {
                case 'auth/invalid-credential':
                case 'auth/wrong-password':
                case 'auth/user-not-found':
                    setError('Incorrect email or password. Please try again.');
                    break;
                case 'auth/too-many-requests':
                    setError('Too many failed login attempts. Please try again later or reset your password.');
                    break;
                case 'auth/user-disabled':
                    setError('This account has been disabled. Please contact support.');
                    break;
                case 'auth/invalid-email':
                    setError('Invalid email address format.');
                    break;
                default:
                    setError('Failed to sign in. Please try again later.');
            }
        } finally {
            setLoading(false);
        }
    };
    // Handle manual search (pressing Continue button)
    const handleManualSearch = async () => {
        if (!searchInput.trim()) {
            setError('Please enter your email or name');
            return;
        }

        setLoading(true);
        setError('');
        setShowSuggestions(false);

        try {
            const usersRef = collection(db, 'users');
            const searchTerm = searchInput.trim().toLowerCase();

            console.log('🔍 Manual search for:', searchTerm);

            // Try exact email match first
            const qEmail = query(usersRef, where('email', '==', searchTerm));
            const emailSnap = await getDocs(qEmail);

            const results = [];

            emailSnap.forEach(doc => {
                const data = doc.data();
                results.push(data);
            });

            // If no exact email match, search by name
            if (results.length === 0) {
                const allUsersSnap = await getDocs(usersRef);

                allUsersSnap.forEach(doc => {
                    const data = doc.data();
                    const firstName = (data.firstName || '').toLowerCase();
                    const surname = (data.surname || '').toLowerCase();
                    const displayName = (data.displayName || '').toLowerCase();

                    if (
                        firstName.includes(searchTerm) ||
                        surname.includes(searchTerm) ||
                        displayName.includes(searchTerm)
                    ) {
                        results.push(data);
                    }
                });
            }

            if (results.length === 1) {
                const user = results[0];
                const accountStatus = user.accountStatus || 'active';

                if (accountStatus === 'suspended') {
                    setShowSuspendedModal(true);
                    setLoading(false);
                    return;
                }

                if (accountStatus === 'pending') {
                    setShowPendingModal(true);
                    setLoading(false);
                    return;
                }

                setUserData(user);
                setEmail(user.email);
                setStep('password');
            } else {
                // Show multiple results as suggestions
                setSuggestions(results);
                setShowSuggestions(true);
            }
        } catch (err) {
            console.error('❌ Search error:', err);
            setError('Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (loading && !searchInput && !userData) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p>Loading...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white flex flex-col">
            <div className="p-4">
                <button
                    onClick={() => router.back()}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                    <ArrowLeft size={24} className="text-gray-900" />
                </button>
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex-1 px-6 pt-4"
            >
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    {step === 'email' ? 'Find your account' : 'Enter your password'}
                </h1>

                {step === 'email' && (
                    <>
                        <p className="text-gray-600 mb-8">
                            Enter your email address or your name to find your account.
                        </p>

                        <div className="relative mb-4">
                            <div className="relative">
                                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                                <input
                                    type="text"
                                    placeholder="Email or first name"
                                    value={searchInput}
                                    onChange={e => {
                                        setSearchInput(e.target.value);
                                        setError('');
                                    }}
                                    onKeyPress={(e) => {
                                        if (e.key === 'Enter') handleManualSearch();
                                    }}
                                    onFocus={() => {
                                        if (suggestions.length > 0) setShowSuggestions(true);
                                    }}
                                    className="w-full border border-gray-300 pl-12 pr-12 py-4 rounded-lg focus:outline-none focus:border-blue-950 text-gray-900"
                                />
                                {searchingLive && (
                                    <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-950"></div>
                                    </div>
                                )}
                            </div>

                            {/* Suggestions Dropdown */}
                            <AnimatePresence>
                                {showSuggestions && suggestions.length > 0 && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        className="absolute z-10 w-full bg-white border border-gray-300 rounded-lg shadow-xl mt-2 max-h-96 overflow-y-auto"
                                    >
                                        <div className="p-2 bg-gray-50 border-b sticky top-0">
                                            <p className="text-xs text-gray-600 font-semibold px-2">
                                                {suggestions.length} account{suggestions.length > 1 ? 's' : ''} found - Click to continue
                                            </p>
                                        </div>
                                        {suggestions.map((user, index) => {
                                            const accountStatus = user.accountStatus || 'active';
                                            const isBlocked = accountStatus === 'suspended' || accountStatus === 'pending';

                                            return (
                                                <button
                                                    key={index}
                                                    onClick={() => handleSelectSuggestion(user)}
                                                    className={`w-full flex items-center gap-4 p-4 transition border-b last:border-b-0 text-left ${isBlocked
                                                        ? 'bg-red-50 hover:bg-red-100'
                                                        : 'hover:bg-blue-50'
                                                        }`}
                                                >
                                                    {/* Profile Image */}
                                                    <div className="flex-shrink-0">
                                                        {user.photoURL ? (
                                                            <img
                                                                src={user.photoURL}
                                                                alt={user.displayName}
                                                                className="w-14 h-14 rounded-full object-cover border-2 border-gray-200"
                                                            />
                                                        ) : (
                                                            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
                                                                <User className="w-7 h-7 text-white" />
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* User Info */}
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-bold text-gray-900 truncate text-base">
                                                            {user.displayName || `${user.firstName} ${user.surname || ''}`}
                                                        </p>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <Mail className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
                                                            <p className="text-sm text-gray-600 truncate">{user.email}</p>
                                                        </div>
                                                        {isBlocked && (
                                                            <div className="mt-2 inline-flex items-center gap-1 bg-red-100 text-red-700 text-xs font-semibold px-2 py-1 rounded">
                                                                <AlertCircle className="w-3 h-3" />
                                                                Account {accountStatus}
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Arrow */}
                                                    {!isBlocked && (
                                                        <div className="flex-shrink-0">
                                                            <div className="w-8 h-8 rounded-full bg-blue-950 flex items-center justify-center">
                                                                <span className="text-white font-bold">→</span>
                                                            </div>
                                                        </div>
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {error && (
                            <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                                <p className="text-red-800 text-sm">{error}</p>
                            </div>
                        )}

                        <button
                            onClick={handleManualSearch}
                            disabled={loading || !searchInput.trim()}
                            className="w-full lg:w-1/4 bg-blue-950 text-white py-3 rounded-full font-semibold hover:bg-blue-900 transition-colors disabled:opacity-50"
                        >
                            {loading ? 'Searching...' : 'Continue'}
                        </button>

                        <p className="text-xs text-gray-500 mt-4 text-center">
                             Tip: Start typing and select your account from the suggestions
                        </p>
                    </>
                )}

                {step === 'password' && userData && (
                    <>
                        {/* User Profile Card */}
                        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 mb-8 border border-blue-200">
                            <div className="flex items-center gap-4">
                                {userData.photoURL ? (
                                    <img
                                        src={userData.photoURL}
                                        alt={userData.displayName}
                                        className="w-16 h-16 rounded-full object-cover border-4 border-white shadow-md"
                                    />
                                ) : (
                                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-md">
                                        <User className="w-8 h-8 text-white" />
                                    </div>
                                )}
                                <div className="flex-1">
                                    <p className="text-sm text-gray-600 mb-1">Signing in as</p>
                                    <p className="font-bold text-gray-900 text-lg">
                                        {userData.displayName || userData.firstName}
                                    </p>
                                    <div className="flex items-center gap-2 mt-1">
                                        <Mail className="w-4 h-4 text-gray-600" />
                                        <p className="text-sm text-gray-700">{userData.email}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <input
                            type="password"
                            placeholder="Enter your password"
                            value={password}
                            onChange={e => {
                                setPassword(e.target.value);
                                setError('');
                            }}
                            autoFocus
                            className="w-full border border-gray-300 px-4 py-4 rounded-lg mb-4 focus:outline-none focus:border-blue-950 text-gray-900"
                            onKeyPress={(e) => {
                                if (e.key === 'Enter') handleLogin();
                            }}
                        />

                        {error && (
                            <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                                <p className="text-red-800 text-sm">{error}</p>
                            </div>
                        )}

                        <button
                            onClick={handleLogin}
                            disabled={loading || !password.trim()}
                            className="w-full lg:w-1/4 bg-blue-950 text-white py-3 rounded-full font-semibold hover:bg-blue-900 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                    Signing in...
                                </>
                            ) : (
                                'Sign in'
                            )}
                        </button>

                        <div className="mt-6 space-y-3">
                            <button
                                onClick={() => {
                                    setStep('email');
                                    setSearchInput('');
                                    setPassword('');
                                    setError('');
                                    setUserData(null);
                                }}
                                className="text-blue-950 hover:underline font-medium block"
                            >
                                ← Not you? Use a different account
                            </button>

                            <button
                                onClick={() => router.push('/auth/forgot-password')}
                                className="text-gray-600 hover:underline text-sm block"
                            >
                                Forgot password?
                            </button>
                        </div>
                    </>
                )}
            </motion.div>

            {/* Account Not Found Modal */}
            {showAccountNotFoundModal && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl"
                    >
                        <div className="text-center mb-4">
                            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <AlertCircle className="w-8 h-8 text-red-600" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-3">
                                We couldn't find your account
                            </h3>
                            <p className="text-gray-700 mb-6">
                                No account found with <span className="font-semibold">"{searchInput}"</span>.
                                <br />
                                You can create a new account with <span className="font-semibold underline ">"{searchInput}"</span> or try searching again.
                            </p>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => {
                                    setShowAccountNotFoundModal(false);
                                    setSearchInput('');
                                    setError('');
                                }}
                                className="flex-1 text-gray-700 font-semibold py-3 hover:bg-gray-100 rounded-lg transition-colors border-2 border-gray-300"
                            >
                                Try Again
                            </button>
                            <button
                                onClick={() => {
                                    setShowAccountNotFoundModal(false);
                                    router.push('/auth/signup');
                                }}
                                className="flex-1 bg-blue-950 text-white font-semibold py-3 hover:bg-blue-900 rounded-lg transition-colors"
                            >
                                Create Account
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
            {/* Suspended Account Modal */}
            {showSuspendedModal && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden"
                    >
                        {/* Red Header */}
                        <div className="bg-red-600 px-6 py-8 text-center">
                            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                <AlertCircle className="w-9 h-9 text-white" />
                            </div>
                            <h3 className="text-2xl font-black text-white mb-1">Account Suspended</h3>
                            <p className="text-red-100 text-sm">Your access has been restricted</p>
                        </div>

                        {/* Body */}
                        <div className="p-6">
                            <p className="text-gray-700 text-center mb-4 leading-relaxed">
                                This account has been <span className="font-bold text-red-600">suspended</span> due to a violation of our Terms of Service or Community Guidelines.
                            </p>
                            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
                                <p className="text-sm text-red-800 font-semibold mb-1">What this means:</p>
                                <ul className="text-sm text-red-700 space-y-1 list-disc list-inside">
                                    <li>You cannot log in to this account</li>
                                    <li>Your listings are not visible to others</li>
                                    <li>Pending transactions may be on hold</li>
                                </ul>
                            </div>
                            <p className="text-sm text-gray-600 text-center mb-6">
                                If you believe this is a mistake, please contact our support team.
                            </p>
                    <div className="flex flex-col gap-3">
                        <a
                            href="mailto:support@lanlibrary.com"
                            className="w-full bg-red-600 text-white font-bold py-3 rounded-xl text-center hover:bg-red-700 transition-colors"
                        >
                            Contact Support
                        </a>
                        <button
                            onClick={() => setShowSuspendedModal(false)}
                            className="w-full border-2 border-gray-200 text-gray-700 font-semibold py-3 rounded-xl hover:bg-gray-50 transition-colors"
                        >
                            Go Back
                        </button>
                    </div>
                </div>
        </motion.div>
    </div >
)
}

{/* Pending Account Modal */ }
{
    showPendingModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden"
            >
                {/* Yellow Header */}
                <div className="bg-yellow-500 px-6 py-8 text-center">
                    <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <AlertCircle className="w-9 h-9 text-white" />
                    </div>
                    <h3 className="text-2xl font-black text-white mb-1">Account Under Review</h3>
                    <p className="text-yellow-100 text-sm">We're verifying your account</p>
                </div>

                {/* Body */}
                <div className="p-6">
                    <p className="text-gray-700 text-center mb-4 leading-relaxed">
                        Your account is currently <span className="font-bold text-yellow-600">under review</span>. This usually takes 24–48 hours.
                    </p>
                    <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
                        <p className="text-sm text-yellow-800 font-semibold mb-1">While under review:</p>
                        <ul className="text-sm text-yellow-700 space-y-1 list-disc list-inside">
                            <li>You cannot log in yet</li>
                            <li>We may contact you for more information</li>
                            <li>You'll be notified once approved</li>
                        </ul>
                    </div>
                    <p className="text-sm text-gray-600 text-center mb-6">
                        Need help? Reach out to our support team.
                    </p>
                <div className="flex flex-col gap-3">
                    <a
                        href="mailto:support@lanlibrary.com"
                        className="w-full bg-yellow-500 text-white font-bold py-3 rounded-xl text-center hover:bg-yellow-600 transition-colors"
                    >
                        Contact Support
                    </a>
                    <button
                        onClick={() => setShowPendingModal(false)}
                        className="w-full border-2 border-gray-200 text-gray-700 font-semibold py-3 rounded-xl hover:bg-gray-50 transition-colors"
                    >
                        Go Back
                    </button>
                </div>
        </div>
        </motion.div >
    </div >
)
}
        </div>
    );
}