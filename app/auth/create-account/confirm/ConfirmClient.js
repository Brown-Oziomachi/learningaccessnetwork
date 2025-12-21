
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import AuthLayout from '@/components/auth/AuthLayout';
import { createUserAccount } from '@/lib/auth/authHelpers';

export default function ConfirmClient() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        firstName: '',
        surname: '',
        dateOfBirth: '',
        email: '',
        password: ''
    });

    useEffect(() => {
        setFormData({
            firstName: searchParams.get('firstName') || '',
            surname: searchParams.get('surname') || '',
            dateOfBirth: searchParams.get('dateOfBirth') || '',
            email: searchParams.get('email') || '',
            password: searchParams.get('password') || ''
        });
    }, [searchParams]);

    const handleSubmit = async () => {
        setLoading(true);

        const result = await createUserAccount(formData);

        if (result.success) {
            alert('Account created successfully!');
            router.push('/home');
        } else {
            const error = result.error;

            switch (error.code) {
                case 'auth/email-already-in-use':
                    alert('This email is already registered. Please sign in instead.');
                    router.push(`/auth/signin`);
                    break;
                case 'auth/weak-password':
                    alert('Password is too weak. Please use a stronger password.');
                    break;
                case 'auth/invalid-email':
                    alert('Invalid email address. Please check the format.');
                    break;
                default:
                    alert(`Failed to create account: ${error.message}`);
            }

            setLoading(false);
        }
    };

    const editParams = new URLSearchParams({
        firstName: formData.firstName,
        surname: formData.surname,
        email: formData.email
    });

    return (
        <AuthLayout
            backPath={`/auth/create-account/password?${new URLSearchParams(formData).toString()}`}
        >
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Confirm your details
            </h1>
            <p className="text-gray-600 mb-8">
                Please review your information before creating your account.
            </p>

            <div className="bg-blue-50 border-2 border-blue-950 rounded-2xl p-6 mb-8">
                <div className="space-y-4">
                    <Link href={`/auth/create-account?${editParams.toString()}`}>
                        <button className="max-md:w-full lg:right-10 mt-2 mb-4 bg-white lg:w-1/4 border-2 border-blue-950 text-blue-950 py-3 rounded-full font-semibold hover:bg-blue-50 transition-colors">
                            Edit Information
                        </button>
                    </Link>

                    <div>
                        <label className="text-sm text-gray-600 font-medium">Name</label>
                        <p className="text-lg text-gray-900 font-semibold">
                            {formData.firstName} {formData.surname}
                        </p>
                    </div>

                    <div>
                        <label className="text-sm text-gray-600 font-medium">Date of Birth</label>
                        <p className="text-lg text-gray-900 font-semibold">
                            {formData.dateOfBirth || 'Not provided'}
                        </p>
                    </div>

                    <div>
                        <label className="text-sm text-gray-600 font-medium">Email</label>
                        <p className="text-lg text-gray-900 font-semibold">
                            {formData.email}
                        </p>
                    </div>
                </div>
            </div>

            <p className="text-xs text-gray-600 mb-6 leading-relaxed">
                By clicking Create Account, you agree to our{' '}
                <button className="text-blue-950 font-medium hover:underline">Terms</button>,{' '}
                <button className="text-blue-950 font-medium hover:underline">Privacy Policy</button> and{' '}
                <button className="text-blue-950 font-medium hover:underline">Cookies Policy</button>.
            </p>

            <button
                onClick={handleSubmit}
                disabled={loading}
                className="max-md:w-full lg:w-1/4 mx-auto bg-blue-950 text-white py-3 rounded-full font-semibold hover:bg-blue-900 transition-colors mb-auto disabled:opacity-50"
            >
                {loading ? 'Creating Account...' : 'Create Account'}
            </button>

            <div className="py-8">
                <Link href="/auth/signin">
                    <button className="text-blue-950 hover:underline font-medium">
                        Already have an account? Sign in
                    </button>
                </Link>
            </div>
        </AuthLayout>
    );
}