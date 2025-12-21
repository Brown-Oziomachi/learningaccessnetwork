
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AuthLayout from '@/components/auth/AuthLayout';
import { resetPassword } from '@/lib/auth/authHelpers';
import { validateEmail } from '@/lib/auth/authValidation';

export default function ForgotPasswordPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [errors, setErrors] = useState({});

    const handleReset = async () => {
        const validation = validateEmail(email);

        if (!validation.isValid) {
            setErrors(validation.errors);
            return;
        }

        setLoading(true);
        const result = await resetPassword(email);

        if (result.success) {
            setSuccess(true);
            setTimeout(() => router.push('/auth/signin'), 3000);
        } else {
            alert('Failed to send reset email. Please check the email address and try again.');
        }

        setLoading(false);
    };

    if (success) {
        return (
            <AuthLayout showBack={false}>
                <div className="flex-1 flex flex-col items-center justify-center">
                    <div className="text-center max-w-md">
                        <div className="text-6xl mb-4">📧</div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">
                            Check your email
                        </h2>
                        <p className="text-gray-600 mb-6">
                            We've sent a password reset link to <strong>{email}</strong>
                        </p>
                        <p className="text-sm text-gray-500 mb-4">
                            Redirecting to sign in...
                        </p>
                        <Link href="/auth/signin">
                            <button className="text-blue-950 hover:underline font-medium">
                                Return to sign in
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
                        setErrors({});
                    }}
                    className="w-full px-4 py-4 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-950 text-gray-900"
                />
            </div>

            {errors.email && (
                <p className="text-red-500 text-sm mb-4">{errors.email}</p>
            )}

            <div className="mb-8"></div>

            <button
                onClick={handleReset}
                disabled={loading}
                className="max-md:w-full lg:w-1/4 mx-auto bg-blue-950 text-white py-3 rounded-full font-semibold hover:bg-blue-900 transition-colors mb-auto disabled:opacity-50"
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