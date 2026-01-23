'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Globe, AlertCircle, CheckCircle } from 'lucide-react';
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
            // Clear the URL parameter after 5 seconds
            setTimeout(() => {
                router.replace('/auth/signin', { scroll: false });
            }, 100);
        }

        // Pre-fill email if provided in URL
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

        const result = await handleEmailPasswordSignIn(
            loginData.email.toLowerCase().trim(),
            loginData.password
        );

        if (result.success) {
            // Successful login - redirect will be handled by auth helpers
            // Don't set loading to false, let the redirect happen
        } else {
            // Extract error code from the result
            const errorCode = result.error?.code || result.error?.errorCode || '';

            switch (errorCode) {
                case 'auth/account-suspended':
                    setError('Your account has been suspended. Please contact support at support@lanlibrary.com for assistance.');
                    break;
                case 'auth/account-pending':
                    setError('Your account is under review. Please contact support at support@lanlibrary.com for assistance.');
                    break;
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
                    if (result.error?.message?.includes('suspended')) {
                        setError('Your account has been suspended. Please contact support for assistance.');
                    } else if (result.error?.message?.includes('under review')) {
                        setError('Your account is under review. Please wait for approval or contact support.');
                    } else {
                        setError(result.error?.message || 'Failed to sign in. Please try again later.');
                    }
            }
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
        <AuthLayout showBack={false} showLanguageSelector={true}>
            <div className="flex-1 flex flex-col items-center justify-start pt-8">
                {/* Globe Icon */}
                <div className="mb-8">
                    <div className="w-24 h-24 bg-white border-4 border-blue-950 rounded-full flex items-center justify-center">
                        <Globe className="w-12 h-12 text-blue-950" />
                    </div>
                </div>

                {/* Success Message for Password Reset */}
                {successMessage && (
                    <div className="w-full max-w-md mb-6 bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <p className="text-green-800 text-sm font-semibold">{successMessage}</p>
                    </div>
                )}

                {/* Error Message */}
                {error && (
                    <div className="w-full max-w-md mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="text-red-800 text-sm">Failed to login. Please check your Network connection</p>
                            {(error.includes('suspended') || error.includes('pending') || error.includes('under review')) && (
                                <Link href="/lan/customer-care" className="text-red-600 hover:underline text-sm font-semibold mt-2 inline-block">
                                    Contact Support →
                                </Link>
                            )}
                        </div>
                    </div>
                )}

                {/* Google Sign In Button */}
                <div className="w-full max-w-md mb-8">
                    <GoogleSignInButton />
                </div>

                {/* OR Divider */}
                <div className="w-full max-w-md mb-8">
                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-300"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-4 bg-white text-gray-500">OR</span>
                        </div>
                    </div>
                </div>

                {/* Email and Password Inputs */}
                <div className="w-full max-w-md space-y-4 mb-6">
                    <input
                        type="email"
                        placeholder="Email address"
                        value={loginData.email}
                        onChange={(e) => {
                            setLoginData(prev => ({ ...prev, email: e.target.value }));
                            setError(null);
                            setSuccessMessage(null);
                        }}
                        className="w-full px-4 py-4 border text-black border-gray-300 rounded-lg focus:outline-none focus:border-blue-950"
                        disabled={loading}
                    />
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
                        className="w-full px-4 py-4 border text-black border-gray-300 rounded-lg focus:outline-none focus:border-blue-950"
                        disabled={loading}
                    />
                </div>

                {/* Log in Button */}
                <button
                    onClick={handleLogin}
                    disabled={loading}
                    className="w-full max-w-md bg-blue-950 text-white py-3 rounded-full font-semibold hover:bg-blue-900 transition-colors mb-4 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading ? 'Signing in...' : 'Log in'}
                </button>

                {/* Forgotten Password Link */}
                <Link href="/auth/forgot-password">
                    <button className="text-blue-950 hover:underline mb-12">
                        Forgotten password?
                    </button>
                </Link>

                {/* Spacer */}
                <div className="flex-1"></div>

                {/* Create New Account Button */}
                <Link href="/auth/signup" className="w-full max-w-md">
                    <button className="w-full bg-white border-2 border-blue-950 text-blue-950 py-3 rounded-full font-semibold hover:bg-blue-50 transition-colors mb-4">
                        Create new account
                    </button>
                </Link>

                {/* Footer Text */}
                <div className="mb-8 text-gray-500 text-sm">
                    <span className="font-bold">Learning Access Network</span>
                </div>
            </div>
        </AuthLayout>
    );
}