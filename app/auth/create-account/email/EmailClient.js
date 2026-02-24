'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AlertCircle } from 'lucide-react';
import Link from 'next/link';
import AuthLayout from '@/components/auth/AuthLayout';
import { validateEmail } from '@/lib/auth/authValidation';

export default function EmailClient() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const [email, setEmail] = useState('');
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({});
    const [accountExists, setAccountExists] = useState(false);

    useEffect(() => {
        const prefilledEmail = searchParams.get('email');
        setFormData({
            firstName: searchParams.get('firstName') || '',
            surname: searchParams.get('surname') || '',
            dateOfBirth: searchParams.get('dateOfBirth') || '',
            accountType: searchParams.get('accountType') || '',
        });
        if (prefilledEmail) setEmail(prefilledEmail);
    }, [searchParams]);

    const handleNext = async () => {
        setLoading(true);
        setErrors({});
        setAccountExists(false);

        try {
            const validation = await validateEmail(email);

            if (!validation.isValid) {
                setErrors(validation.errors);
                if (validation.accountExists) setAccountExists(true);
                setLoading(false);
                return;
            }

            // ✅ Read ref from URL or sessionStorage
            const ref = searchParams.get('referral_code') || sessionStorage.getItem('referredBy') || '';
            const params = new URLSearchParams({
                ...formData,
                email,
            });

            if (ref) params.append('ref', ref); // ✅ pass ref forward

            router.push(`/auth/create-account/password?${params.toString()}`);
        } catch (error) {
            console.error('Error validating email:', error);
            setErrors({ email: 'Unable to validate email. Please try again.' });
        } finally {
            setLoading(false);
        }
    };

    const backParams = new URLSearchParams(formData);
    if (email) backParams.append('email', email);

    return (
        <AuthLayout
            backPath={`/auth/create-account/dob?${backParams.toString()}`}
            showFindAccount={true}
        >
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
                What's your email?
            </h1>
            <p className="text-gray-600 mb-8">
                Enter your Gmail address. We'll send your PDF books here.
            </p>

            <div className="mb-2">
                <input
                    type="email"
                    placeholder="yourname@gmail.com"
                    value={email}
                    required
                    onChange={(e) => {
                        setEmail(e.target.value.toLowerCase().trim());
                        setErrors({});
                        setAccountExists(false);
                    }}
                    className="w-full px-4 py-4 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-950 text-gray-900"
                    disabled={loading}
                />
            </div>

            {errors.email && (
                <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                        <p className="text-red-800 text-sm">{errors.email}</p>
                        {(errors.email.includes('suspended') || errors.email.includes('under review')) && (
                            <Link href="/lan/customer-care" className="text-red-600 hover:underline text-sm font-semibold mt-2 inline-block">
                                Contact Support →
                            </Link>
                        )}
                        {accountExists && (
                            <Link href={`/auth/signin?email=${encodeURIComponent(email)}`} className="text-blue-950 hover:underline text-sm font-semibold mt-2 inline-block">
                                Sign in instead →
                            </Link>
                        )}
                    </div>
                </div>
            )}

            <div className="mb-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-blue-800 text-xs">
                    ℹ️ Only Gmail addresses are accepted. Make sure you have access to this email.
                </p>
            </div>

            <button
                onClick={handleNext}
                disabled={loading || !email}
                className="max-md:w-full lg:w-1/4 mx-auto bg-blue-950 text-white py-3 rounded-full font-semibold hover:bg-blue-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
                {loading ? (
                    <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        Checking...
                    </>
                ) : 'Next'}
            </button>
        </AuthLayout>
    );
}