'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import AuthLayout from '@/components/auth/AuthLayout';
import { validateDateOfBirth } from '@/lib/auth/authValidation';

export default function DOBClient() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const [dateOfBirth, setDateOfBirth] = useState('');
    const [errors, setErrors] = useState({});
    const [formData, setFormData] = useState({});

    useEffect(() => {
        setFormData({
            firstName: searchParams.get('firstName') || '',
            surname: searchParams.get('surname') || '',
            email: searchParams.get('email') || '',
            accountType: searchParams.get('accountType') || '',
        });
    }, [searchParams]);

    const handleNext = () => {
        const validation = validateDateOfBirth(dateOfBirth);

        if (!validation.isValid) {
            setErrors(validation.errors);
            return;
        }

        // ✅ Read ref from URL or sessionStorage
        const ref = searchParams.get('ref') || sessionStorage.getItem('referredBy') || '';

        const params = new URLSearchParams({
            ...formData,
            dateOfBirth,
        });

        if (ref) params.append('ref', ref); // ✅ pass ref forward

        router.push(`/auth/create-account/email?${params.toString()}`);
    };

    return (
        <AuthLayout
            backPath={`/auth/create-account?${new URLSearchParams(formData).toString()}`}
            showFindAccount={true}
        >
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
                What's your date of birth?
            </h1>
            <p className="text-gray-600 mb-2">
                Choose your date of birth. You can always make this private later.{' '}
                <button className="text-blue-950 font-medium hover:underline">
                    Why do I need to provide my date of birth?
                </button>
            </p>

            <div className="mb-2 mt-4">
                <input
                    type="date"
                    value={dateOfBirth}
                    required
                    onChange={(e) => {
                        setDateOfBirth(e.target.value);
                        setErrors({});
                    }}
                    className="w-full px-4 py-4 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-950 text-gray-700"
                />
            </div>

            {errors.dateOfBirth && (
                <p className="text-red-500 text-sm mb-4">{errors.dateOfBirth}</p>
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