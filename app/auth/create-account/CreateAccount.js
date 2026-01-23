'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import AuthLayout from '@/components/auth/AuthLayout';
import { validateName } from '@/lib/auth/authValidation';

export default function CreateAccountNameClient() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const prefilledEmail = searchParams.get('email');

    const [formData, setFormData] = useState({
        firstName: '',
        surname: ''
    });
    const [errors, setErrors] = useState({});
    const [selectedRole, setSelectedRole] = useState('student');

    // Get the role from sessionStorage when component mounts
    useEffect(() => {
        const role = sessionStorage.getItem('userRole');
        if (role) {
            setSelectedRole(role);
        }
    }, []);

    const handleNext = () => {
        const validation = validateName(formData.firstName, formData.surname);

        if (!validation.isValid) {
            setErrors(validation.errors);
            return;
        }

        const params = new URLSearchParams({
            firstName: formData.firstName,
            surname: formData.surname
        });

        if (prefilledEmail) {
            params.append('email', prefilledEmail);
        }

        router.push(`/auth/create-account/dob?${params.toString()}`);
    };

    return (
        <AuthLayout backPath="/auth/role-selection" showFindAccount={true}>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
                What's your name?
            </h1>
            <p className="text-gray-600 mb-2">
                Enter the name you use in real life.
            </p>
            
            {/* Show selected role */}
            <p className="text-sm text-blue-950 font-semibold mb-8">
                Creating {selectedRole} account
            </p>

            <div className="flex gap-4 mb-2">
                <div className="flex-1">
                    <input
                        type="text"
                        placeholder="First name"
                        required
                        value={formData.firstName}
                        onChange={(e) => {
                            setFormData(prev => ({ ...prev, firstName: e.target.value }));
                            setErrors({});
                        }}
                        className="w-full px-4 py-4 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-950 text-gray-900"
                    />
                </div>
                <div className="flex-1">
                    <input
                        type="text"
                        placeholder="Surname"
                        required
                        value={formData.surname}
                        onChange={(e) => {
                            setFormData(prev => ({ ...prev, surname: e.target.value }));
                            setErrors({});
                        }}
                        className="w-full px-4 py-4 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-950 text-gray-900"
                    />
                </div>
            </div>

            {errors.firstName && <p className="text-red-500 text-sm mb-2">{errors.firstName}</p>}
            {errors.surname && <p className="text-red-500 text-sm mb-2">{errors.surname}</p>}

            <div className="mb-8"></div>

            <button
                onClick={handleNext}
                disabled={!formData.firstName || !formData.surname}
                className="max-md:w-full lg:w-1/4 mx-auto bg-blue-950 text-white py-3 rounded-full font-semibold hover:bg-blue-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
                Next
            </button>
        </AuthLayout>
    );
}