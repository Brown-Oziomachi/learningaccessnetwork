'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, AlertCircle, Search, User, Mail, Eye, EyeOff, Lock, Phone } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebaseConfig';
import { onAuthStateChanged } from "firebase/auth";

export default function FindAccountClient() {
    const router = useRouter();

    const [step, setStep] = useState('search'); // search | confirm | password
    const [searchInput, setSearchInput] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [checkingAuth, setCheckingAuth] = useState(true);
    const [showSuspendedModal, setShowSuspendedModal] = useState(false);
    const [showPendingModal, setShowPendingModal] = useState(false);

    // Only masked safe data from API
    const [maskedEmail, setMaskedEmail] = useState('');
    const [maskedPhone, setMaskedPhone] = useState('');
    const [actualEmail, setActualEmail] = useState('');

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                router.replace("/home");
            } else {
                setCheckingAuth(false);
            }
        });
        return () => unsubscribe();
    }, [router]);

    // STEP 1: Search via backend API
    const handleSearch = async () => {
        if (!searchInput.trim()) {
            setError('Please enter your email or mobile number');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const res = await fetch('/api/find-account', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ searchTerm: searchInput.trim() }),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error || 'Something went wrong. Please try again.');
                return;
            }

            if (!data.found) {
                setError('No account found. Please check and try again.');
                return;
            }

            if (data.accountStatus === 'suspended') {
                setShowSuspendedModal(true);
                return;
            }

            if (data.accountStatus === 'pending') {
                setShowPendingModal(true);
                return;
            }

            setMaskedEmail(data.maskedEmail);
            setMaskedPhone(data.maskedPhone);
            setActualEmail(data.email);
            setStep('confirm');

        } catch (err) {
            console.error('Search error:', err);
            setError('Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // STEP 3: Login
    const handleLogin = async () => {
        if (!password.trim()) {
            setError('Enter your password');
            return;
        }

        setLoading(true);
        setError('');

        try {
            await signInWithEmailAndPassword(auth, actualEmail, password);
            router.push('/home');
        } catch (err) {
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

    const resetFlow = () => {
        setStep('search');
        setSearchInput('');
        setPassword('');
        setError('');
        setMaskedEmail('');
        setMaskedPhone('');
        setActualEmail('');
    };

    if (checkingAuth) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-950" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white flex flex-col">
            <div className="p-4">
                <button
                    onClick={() => step === 'search' ? router.back() : resetFlow()}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                    <ArrowLeft size={24} className="text-gray-900" />
                </button>
            </div>

            <motion.div
                key={step}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex-1 px-6 pt-4"
            >
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    {step === 'search' && 'Find your account'}
                    {step === 'confirm' && 'Is this you?'}
                    {step === 'password' && 'Enter your password'}
                </h1>

                {/* ── STEP 1: SEARCH ── */}
                {step === 'search' && (
                    <>
                        <p className="text-gray-600 mb-8">
                            Enter your mobile number or email address.
                        </p>

                        <div className="relative mb-4">
                            <div className="relative">
                                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                                <input
                                    type="text"
                                    placeholder="Mobile number or email address"
                                    value={searchInput}
                                    onChange={e => {
                                        setSearchInput(e.target.value);
                                        setError('');
                                    }}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleSearch();
                                    }}
                                    className="w-full border border-gray-300 pl-12 pr-12 py-4 rounded-lg focus:outline-none focus:border-blue-950 text-gray-900"
                                />
                                {loading && (
                                    <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-950"></div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {error && (
                            <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                                <p className="text-red-800 text-sm">{error}</p>
                            </div>
                        )}

                        <button
                            onClick={handleSearch}
                            disabled={loading || !searchInput.trim()}
                            className="w-full lg:w-1/4 bg-blue-950 text-white py-3 rounded-full font-semibold hover:bg-blue-900 transition-colors disabled:opacity-50"
                        >
                            {loading ? 'Searching...' : 'Continue'}
                        </button>
                    </>
                )}

                {/* ── STEP 2: CONFIRM ── */}
                {step === 'confirm' && (
                    <>
                        <p className="text-gray-600 mb-8">
                            We found an account matching your details.
                        </p>

                        <div className="border border-gray-200 rounded-2xl p-5 mb-6 bg-gray-50">
                            {maskedEmail && (
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                                        <Mail className="w-5 h-5 text-blue-700" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 font-medium">Email</p>
                                        <p className="text-gray-900 font-semibold">{maskedEmail}</p>
                                    </div>
                                </div>
                            )}
                            {maskedPhone && (
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                                        <Phone className="w-5 h-5 text-blue-700" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 font-medium">Phone</p>
                                        <p className="text-gray-900 font-semibold">{maskedPhone}</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        <button
                            onClick={() => setStep('password')}
                            className="w-full lg:w-1/4 bg-blue-950 text-white py-3 rounded-full font-semibold hover:bg-blue-900 transition-colors mb-3"
                        >
                            Yes, continue
                        </button>

                        <button
                            onClick={resetFlow}
                            className="w-full lg:w-1/4 border-2 border-gray-200 text-gray-700 py-3 rounded-full font-semibold hover:bg-gray-50 transition-colors block"
                        >
                            No, try again
                        </button>
                    </>
                )}

                {/* ── STEP 3: PASSWORD ── */}
                {step === 'password' && (
                    <>
                        <p className="text-gray-600 mb-8">
                            Signing in with <span className="font-semibold text-gray-800">{maskedEmail}</span>
                        </p>

                        <div className="relative mb-4">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input
                                type={showPassword ? 'text' : 'password'}
                                placeholder="Enter your password"
                                value={password}
                                onChange={e => {
                                    setPassword(e.target.value);
                                    setError('');
                                }}
                                autoFocus
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleLogin();
                                }}
                                className="w-full border border-gray-300 pl-12 pr-12 py-4 rounded-lg focus:outline-none focus:border-blue-950 text-gray-900"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(v => !v)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>

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
                                onClick={resetFlow}
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

            {/* Suspended Modal */}
            {showSuspendedModal && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden"
                    >
                        <div className="bg-red-600 px-6 py-8 text-center">
                            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                <AlertCircle className="w-9 h-9 text-white" />
                            </div>
                            <h3 className="text-2xl font-black text-white mb-1">Account Suspended</h3>
                            <p className="text-red-100 text-sm">Your access has been restricted</p>
                        </div>
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
                                    onClick={() => { setShowSuspendedModal(false); resetFlow(); }}
                                    className="w-full border-2 border-gray-200 text-gray-700 font-semibold py-3 rounded-xl hover:bg-gray-50 transition-colors"
                                >
                                    Go Back
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}

            {/* Pending Modal */}
            {showPendingModal && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden"
                    >
                        <div className="bg-yellow-500 px-6 py-8 text-center">
                            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                <AlertCircle className="w-9 h-9 text-white" />
                            </div>
                            <h3 className="text-2xl font-black text-white mb-1">Account Under Review</h3>
                            <p className="text-yellow-100 text-sm">We're verifying your account</p>
                        </div>
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
                                    onClick={() => { setShowPendingModal(false); resetFlow(); }}
                                    className="w-full border-2 border-gray-200 text-gray-700 font-semibold py-3 rounded-xl hover:bg-gray-50 transition-colors"
                                >
                                    Go Back
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
}