'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AlertCircle, CheckCircle, Mail, ArrowRight, Shield, Clock } from 'lucide-react';
import AuthLayout from '@/components/auth/AuthLayout';
import { resetPassword } from '@/lib/auth/authHelpers';

export default function ForgotPasswordPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');

    const handleReset = async () => {
        // Basic email validation
        if (!email.trim()) {
            setError('Please enter your email address');
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            setError('Please enter a valid email address');
            return;
        }

        setLoading(true);
        setError('');

        try {
            console.log('🔐 Attempting password reset for:', email);
            console.log('🌍 Current origin:', window.location.origin);
            
            const result = await resetPassword(email.toLowerCase().trim());

            console.log('📧 Reset password result:', result);

            if (result.success) {
                console.log('✅ Password reset email sent successfully');
                setSuccess(true);
            } else {
                console.error('❌ Password reset failed:', result.error);
                
                // Handle specific Firebase errors
                if (result.error?.code === 'auth/user-not-found') {
                    setError('No account found with this email address. Please check and try again.');
                } else if (result.error?.code === 'auth/invalid-email') {
                    setError('Invalid email address format.');
                } else if (result.error?.code === 'auth/too-many-requests') {
                    setError('Too many attempts. Please try again later.');
                } else if (result.error?.code === 'auth/unauthorized-continue-uri') {
                    setError('Configuration error. Please contact support.');
                    console.error('⚠️ Unauthorized domain. Check Firebase Authorized Domains settings.');
                } else if (result.error?.code === 'auth/invalid-continue-uri') {
                    setError('Configuration error. Please contact support.');
                    console.error('⚠️ Invalid continue URL. Check Firebase settings.');
                } else {
                    setError(`Failed to send reset email: ${result.error?.message || 'Unknown error'}`);
                }
            }
        } catch (err) {
            console.error('💥 Unexpected error during password reset:', err);
            setError('An unexpected error occurred. Please try again or contact support.');
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <AuthLayout showBack={false}>
                <div className="flex-1 flex flex-col items-center justify-center px-4">
                    <div className="text-center max-w-lg">
                        {/* Success Icon */}
                        <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <CheckCircle className="w-14 h-14 text-green-600" />
                        </div>

                        {/* Title */}
                        <h2 className="text-3xl font-bold text-gray-900 mb-4">
                            Check your email
                        </h2>

                        {/* Email Display */}
                        <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-5 mb-6">
                            <div className="flex items-center gap-3 justify-center mb-3">
                                <Mail className="w-6 h-6 text-blue-600" />
                                <p className="text-gray-900 font-bold text-lg">{email}</p>
                            </div>
                            <p className="text-sm text-gray-700">
                                We've sent a password reset link to this email address
                            </p>
                        </div>

                        {/* Instructions */}
                        <div className="bg-white border-2 border-gray-200 rounded-xl p-6 mb-6 text-left">
                            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <Shield className="w-5 h-5 text-blue-950" />
                                Next Steps:
                            </h3>
                            <ol className="space-y-3 text-sm text-gray-700">
                                <li className="flex gap-3">
                                    <span className="flex-shrink-0 w-6 h-6 bg-blue-950 text-white rounded-full flex items-center justify-center text-xs font-bold">1</span>
                                    <span>Check your email inbox for a message from LAN Library</span>
                                </li>
                                <li className="flex gap-3">
                                    <span className="flex-shrink-0 w-6 h-6 bg-blue-950 text-white rounded-full flex items-center justify-center text-xs font-bold">2</span>
                                    <span>Click the <strong>"Reset Password"</strong> link in the email</span>
                                </li>
                                <li className="flex gap-3">
                                    <span className="flex-shrink-0 w-6 h-6 bg-blue-950 text-white rounded-full flex items-center justify-center text-xs font-bold">3</span>
                                    <span>Enter your new password on the secure page</span>
                                </li>
                                <li className="flex gap-3">
                                    <span className="flex-shrink-0 w-6 h-6 bg-blue-950 text-white rounded-full flex items-center justify-center text-xs font-bold">4</span>
                                    <span>Return here to sign in with your new password</span>
                                </li>
                            </ol>
                        </div>

                        {/* Important Notes */}
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 text-left">
                            <div className="flex items-start gap-3">
                                <Clock className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                                <div className="text-sm text-yellow-800">
                                    <p className="font-semibold mb-1">Important:</p>
                                    <ul className="list-disc list-inside space-y-1">
                                        <li>The reset link expires in <strong>1 hour</strong></li>
                                        <li>Check your spam/junk folder if you don't see it</li>
                                        <li>The link can only be used once</li>
                                    </ul>
                                </div>
                            </div>
                        </div>

                        {/* Didn't receive email */}
                        <p className="text-sm text-gray-600 mb-6">
                            Didn't receive the email?{' '}
                            <button
                                onClick={() => {
                                    setSuccess(false);
                                    setEmail('');
                                }}
                                className="text-blue-950 font-bold hover:underline"
                            >
                                Send again
                            </button>
                        </p>

                        {/* Return to Sign In */}
                        <Link href="/auth/signin">
                            <button className="w-full bg-blue-950 text-white px-8 py-4 rounded-full font-semibold hover:bg-blue-900 transition-colors flex items-center justify-center gap-2">
                                Return to Sign In
                                <ArrowRight className="w-5 h-5" />
                            </button>
                        </Link>
                    </div>
                </div>
            </AuthLayout>
        );
    }

    return (
        <AuthLayout backPath="/auth/signin">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Reset your password
            </h1>
            <p className="text-gray-600 mb-8">
                Enter your email address and we'll send you a link to reset your password.
            </p>

            <div className="mb-2">
                <input
                    type="email"
                    placeholder="Email address"
                    value={email}
                    onChange={(e) => {
                        setEmail(e.target.value);
                        setError('');
                    }}
                    onKeyPress={(e) => {
                        if (e.key === 'Enter') handleReset();
                    }}
                    className="w-full px-4 py-4 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-950 text-gray-900"
                />
            </div>

            {error && (
                <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <p className="text-red-800 text-sm">{error}</p>
                </div>
            )}

            <div className="mb-8"></div>

            <button
                onClick={handleReset}
                disabled={loading || !email.trim()}
                className="max-md:w-full lg:w-1/4 mx-auto bg-blue-950 text-white py-3 rounded-full font-semibold hover:bg-blue-900 transition-colors mb-auto disabled:opacity-70 disabled:cursor-not-allowed enabled:cursor-pointer"
            >
                {loading ? 'Sending...' : 'Send reset link'}
            </button>

            <div className="py-8">
                <Link href="/auth/signin">
                    <button className="text-blue-950 hover:underline font-medium">
                        Back to sign in
                    </button>
                </Link>
            </div>
        </AuthLayout>
    );
}
