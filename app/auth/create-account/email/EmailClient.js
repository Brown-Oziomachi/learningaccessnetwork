
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import AuthLayout from '@/components/auth/AuthLayout';
import { validateEmail } from '@/lib/auth/authValidation';

export default function EmailClient() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const [email, setEmail] = useState('');
    const [errors, setErrors] = useState({});
    const [formData, setFormData] = useState({});

    useEffect(() => {
        const prefilledEmail = searchParams.get('email');
        setFormData({
            firstName: searchParams.get('firstName') || '',
            surname: searchParams.get('surname') || '',
            dateOfBirth: searchParams.get('dateOfBirth') || ''
        });

        if (prefilledEmail) {
            setEmail(prefilledEmail);
        }
    }, [searchParams]);

    const handleNext = () => {
        const validation = validateEmail(email);

        if (!validation.isValid) {
            setErrors(validation.errors);
            return;
        }

        const params = new URLSearchParams({
            ...formData,
            email
        });

        router.push(`/auth/create-account/password?${params.toString()}`);
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
                Enter your email address. We'll send your PDF books here.
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

            <div className="mb-4"></div>

            <button
                onClick={handleNext}
                className="max-md:w-full lg:w-1/4 mx-auto bg-blue-950 text-white py-3 rounded-full font-semibold hover:bg-blue-900 transition-colors mb-auto"
            >
                Next
            </button>
        </AuthLayout>
    );
}