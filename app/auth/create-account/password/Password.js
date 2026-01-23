'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import AuthLayout from '@/components/auth/AuthLayout';
import { validatePassword } from '@/lib/auth/authValidation';

export default function PasswordClient() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const [password, setPassword] = useState('');
    const [errors, setErrors] = useState({});
    const [formData, setFormData] = useState({});

    useEffect(() => {
        setFormData({
            firstName: searchParams.get('firstName') || '',
            surname: searchParams.get('surname') || '',
            dateOfBirth: searchParams.get('dateOfBirth') || '',
            email: searchParams.get('email') || '',
            accountType: searchParams.get('accountType') || '' // ADD THIS LINE
        });
    }, [searchParams]);

    const handleNext = () => {
        const validation = validatePassword(password);

        if (!validation.isValid) {
            setErrors(validation.errors);
            return;
        }

        const params = new URLSearchParams({
            ...formData,
            password
        });

        router.push(`/auth/create-account/confirm?${params.toString()}`);
    };

    return (
        <AuthLayout
            backPath={`/auth/create-account/email?${new URLSearchParams(formData).toString()}`}
            showFindAccount={true}
        >
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Create a password
            </h1>
            <p className="text-gray-600 mb-8">
                Create a password with at least 6 characters.
            </p>

            <div className="mb-2">
                <input
                    type="password"
                    placeholder="Password"
                    required
                    value={password}
                    onChange={(e) => {
                        setPassword(e.target.value);
                        setErrors({});
                    }}
                    className="w-full px-4 py-4 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-950 text-gray-900"
                />
            </div>

            {errors.password && (
                <p className="text-red-500 text-sm mb-4">{errors.password}</p>
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
