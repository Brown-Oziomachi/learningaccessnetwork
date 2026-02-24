'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Globe, AlertCircle, CheckCircle, BookOpen, Users, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import AuthLayout from '@/components/auth/AuthLayout';
import GoogleSignInButton from '@/components/auth/GoogleSignInButton';
import { handleEmailPasswordSignIn } from '@/lib/auth/authHelpers';
import { useAuth } from '@/hooks/useAuth';

export default function SignInClient() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { loading: authLoading } = useAuth(true);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);
    const [loginData, setLoginData] = useState({
        email: '',
        password: ''
    });

    // Check if redirected after password reset
    useEffect(() => {
        const passwordReset = searchParams.get('passwordReset');
        if (passwordReset === 'success') {
            setSuccessMessage('Password reset successful! Please sign in with your new password.');
            setTimeout(() => {
                router.replace('/auth/signin', { scroll: false });
            }, 100);
        }

        const prefilledEmail = searchParams.get('email');
        if (prefilledEmail) {
            setLoginData(prev => ({ ...prev, email: prefilledEmail }));
        }
    }, [searchParams, router]);

    const handleLogin = async () => {
        if (!loginData.email || !loginData.password) {
            setError('Please fill in all fields');
            return;
        }

        setLoading(true);
        setError(null);
        setSuccessMessage(null);

        try {
            // ✅ STEP 1: Check account status in Firestore BEFORE attempting login
            const { collection, query, where, getDocs } = await import('firebase/firestore');
            const { db } = await import('@/lib/firebaseConfig');

            const usersRef = collection(db, 'users');
            const q = query(usersRef, where('email', '==', loginData.email.toLowerCase().trim()));
            const snap = await getDocs(q);

            if (!snap.empty) {
                const userData = snap.docs[0].data();
                const accountStatus = userData.accountStatus || 'active';

                if (accountStatus === 'suspended') {
                    setError('suspended');
                    setLoading(false);
                    return;
                }

                if (accountStatus === 'pending') {
                    setError('pending');
                    setLoading(false);
                    return;
                }
            }

            // ✅ STEP 2: Only proceed with Firebase Auth if account is active
            const result = await handleEmailPasswordSignIn(
                loginData.email.toLowerCase().trim(),
                loginData.password
            );

            if (result.success) {
                // Successful login — auth hook handles redirect
            } else {
                const errorCode = result.error?.code || result.error?.errorCode || '';
                switch (errorCode) {
                    case 'auth/invalid-credential':
                    case 'auth/wrong-password':
                    case 'auth/user-not-found':
                        setError('Incorrect email or password. Please try again.');
                        break;
                    case 'auth/invalid-email':
                        setError('Invalid email address format.');
                        break;
                    case 'auth/too-many-requests':
                        setError('Too many failed login attempts. Please try again later or reset your password.');
                        break;
                    case 'auth/user-disabled':
                        setError('This account has been disabled. Please contact support.');
                        break;
                    default:
                        setError(result.error?.message || 'Failed to sign in. Please try again later.');
                }
                setLoading(false);
            }
        } catch (err) {
            console.error('Login error:', err);
            setError('Something went wrong. Please try again.');
            setLoading(false);
        }
    };

    if (authLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-950"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex">
            {/* Left Side - Decorative (Desktop Only) */}
            <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-950 via-blue-950 to-blue-950 relative overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center p-12">
                    <div className="max-w-lg">
                        {/* Main Image */}
                        <div className="relative mb-8">
                            <img
                                src="/lan.png"
                                alt="Student"
                                className=" shadow-2xl w-full mt-20"
                            />

                            {/* Floating Card - Books Sold */}
                            <div className="absolute top-8 -right-4 bg-white rounded-2xl shadow-xl p-4 animate-bounce">
                                <div className="flex items-center gap-3">
                                    <div className="bg-blue-950 p-3 rounded-xl">
                                        <BookOpen className="w-6 h-6 text-white" />
                                    </div>
                                    <div>
                                        <div className="text-2xl font-black text-gray-900">5,000+</div>
                                        <div className="text-xs text-gray-600">Books Sold</div>
                                        <div className="flex items-center gap-1 mt-1">
                                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                            <span className="text-xs text-green-600 font-semibold">Active</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Stats */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-white rounded-xl p-4 shadow-lg">
                                <TrendingUp className="w-8 h-8 text-blue-950 mb-2" />
                                <div className="text-2xl font-black text-gray-900">85%</div>
                                <div className="text-sm text-gray-600">Revenue Share</div>
                            </div>
                            <div className="bg-white rounded-xl p-4 shadow-lg">
                                <Users className="w-8 h-8 text-blue-950 mb-2" />
                                <div className="text-2xl font-black text-gray-900">500+</div>
                                <div className="text-sm text-gray-600">Active Sellers</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Logo */}
                <div className="absolute top-8 left-8">
                    <div className="flex items-center gap-2 text-blue-950 bg-white px-10 py-3 rounded-xl">
                        <div className=" rounded-lg font-black text-xl">
                            [LAN]
                        </div>
                        <div>
                            <div className="font-bold text-blue-950">Library</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Side - Sign In Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white">
                <div className="w-full max-w-md">
                    {/* Mobile Logo */}
                    <div className="lg:hidden mb-8 text-center bg-white">
                        <div className="inline-flex items-center gap-2">
                            <div className="bg-blue-950 text-white px-4 py-2 rounded-lg font-black text-xl">
                                [LAN]
                            </div>
                            <span className="font-bold text-gray-900">Library</span>
                        </div>
                    </div>

                    {/* Globe Icon */}
                    <div className="flex justify-center mb-10">
                        <div className="w-24 h-24 border-4 border-blue-950 rounded-full flex items-center justify-center">
                            <Globe className="w-12 h-12 text-blue-950" />
                        </div>
                    </div>

                    {/* Success Message */}
                    {successMessage && (
                        <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
                            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                            <p className="text-green-800 text-sm font-semibold">{successMessage}</p>
                        </div>
                    )}

                    {/* Error Message */}
                    {error === 'suspended' && (
                        <div className="mb-6 bg-red-600 rounded-2xl overflow-hidden shadow-lg">
                            <div className="px-5 py-4 text-center">
                                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
                                    <AlertCircle className="w-7 h-7 text-white" />
                                </div>
                                <p className="text-white font-black text-lg mb-1">Account Suspended</p>
                                <p className="text-red-100 text-sm mb-4">
                                    This account has been suspended due to a violation of our Terms of Service. You cannot log in.
                                </p>
                                <a
                                    href="mailto:support@lanlibrary.com"
                                    className="inline-block bg-white text-red-600 font-bold px-6 py-2 rounded-full text-sm hover:bg-red-50 transition-colors"
                                >
                                    Contact Support
                                </a>
                            </div>
                        </div>
                    )}

                    {error === 'pending' && (
                        <div className="mb-6 bg-yellow-500 rounded-2xl overflow-hidden shadow-lg">
                            <div className="px-5 py-4 text-center">
                                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
                                    <AlertCircle className="w-7 h-7 text-white" />
                                </div>
                                <p className="text-white font-black text-lg mb-1">Account Under Review</p>
                                <p className="text-yellow-100 text-sm mb-4">
                                    Your account is currently under review. You'll be notified once approved.
                                </p>
                                <a
                                    href="mailto:support@lanlibrary.com"
                                    className="inline-block bg-white text-yellow-600 font-bold px-6 py-2 rounded-full text-sm hover:bg-yellow-50 transition-colors"
                                >
                                    Contact Support
                                </a>
                            </div>
                        </div>
                    )}

                    {error && error !== 'suspended' && error !== 'pending' && (
                        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                            <p className="text-red-800 text-sm">{error}</p>
                        </div>
                    )}
                    {/* Google Sign In */}
                    <div className="mb-8">
                        <GoogleSignInButton />
                    </div>

                    {/* OR Divider */}
                    <div className="mb-8">
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-gray-300"></div>
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-4 bg-white text-gray-500">OR</span>
                            </div>
                        </div>
                    </div>

                    {/* Email Input */}
                    <div className="mb-5">
                        <input
                            type="email"
                            placeholder="Email address"
                            value={loginData.email}
                            onChange={(e) => {
                                setLoginData(prev => ({ ...prev, email: e.target.value }));
                                setError(null);
                                setSuccessMessage(null);
                            }}
                            className="w-full px-5 py-4 bg-white border border-gray-300 rounded-xl text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-blue-950 focus:ring-1 focus:ring-blue-950 transition-colors"
                            disabled={loading}
                        />
                    </div>

                    {/* Password Input */}
                    <div className="mb-6">
                        <input
                            type="password"
                            placeholder="Password"
                            value={loginData.password}
                            onChange={(e) => {
                                setLoginData(prev => ({ ...prev, password: e.target.value }));
                                setError(null);
                                setSuccessMessage(null);
                            }}
                            onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                            className="w-full px-5 py-4 bg-white border border-gray-300 rounded-xl text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-blue-950 focus:ring-1 focus:ring-blue-950 transition-colors"
                            disabled={loading}
                        />
                    </div>

                    {/* Sign In Button */}
                    <button
                        onClick={handleLogin}
                        disabled={loading}
                        className="w-full bg-blue-950 text-white py-4 rounded-full font-semibold text-lg hover:bg-blue-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mb-5"
                    >
                        {loading ? 'Logging in...' : 'Log in'}
                    </button>

                    {/* Forgot Password */}
                    <div className="text-center mb-32">
                        <Link href="/auth/forgot-password" className="text-blue-950 hover:underline text-base">
                            Forgotten password?
                        </Link>
                    </div>

                    {/* Create Account Button */}
                    <Link href="/auth/signup" className="block mb-6">
                        <button className="w-full bg-white border-2 border-gray-900 text-gray-900 py-4 rounded-full font-semibold text-lg hover:bg-gray-50 transition-colors">
                            Create new account
                        </button>
                    </Link>

                    {/* Footer */}
                    <div className="text-center text-base text-gray-500">
                        <span>Learning Access Network</span>
                    </div>
                </div>
            </div>
        </div>
    );
}