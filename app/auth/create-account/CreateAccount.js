'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import AuthLayout from '@/components/auth/AuthLayout';
import { validateName } from '@/lib/auth/authValidation';

export default function CreateAccountNameClient() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const prefilledEmail = searchParams.get('email');
    const refFromUrl = searchParams.get('referral_code');

    if (refFromUrl) {
        sessionStorage.setItem('referredBy', refFromUrl);
    }

    const [formData, setFormData] = useState({ firstName: '', surname: '' });
    const [errors, setErrors] = useState({});
    const [selectedRole, setSelectedRole] = useState('');
    const [studentSubRole, setStudentSubRole] = useState('');

    useEffect(() => {
        const role = sessionStorage.getItem('userRole');
        if (role) setSelectedRole(role);

        const subRole = sessionStorage.getItem('studentSubRole');
        if (subRole) setStudentSubRole(subRole);

        if (refFromUrl) {
            sessionStorage.setItem('referredBy', refFromUrl);
        }
    }, [refFromUrl]);

    // Human-readable label for the sub-role badge
    const subRoleLabels = {
        undergraduate: 'Undergraduate',
        postgraduate: 'Postgraduate',
        researcher: 'PhD / Researcher',
        professional: 'Professional learner',
    };

    const handleNext = () => {
        const validation = validateName(formData.firstName, formData.surname);
        if (!validation.isValid) {
            setErrors(validation.errors);
            return;
        }

        const ref = sessionStorage.getItem('referredBy') || refFromUrl || '';

        const params = new URLSearchParams({
            firstName: formData.firstName,
            surname: formData.surname,
        });

        if (prefilledEmail) params.append('email', prefilledEmail);
        if (ref) params.append('referral_code', ref);
        if (selectedRole) params.append('role', selectedRole);

        // ✅ Carry student academic fields forward through the URL chain
        const studentSubRoleVal = sessionStorage.getItem('studentSubRole');
        const studyLevel = sessionStorage.getItem('studyLevel');
        const fieldOfStudy = sessionStorage.getItem('fieldOfStudy');
        const institution = sessionStorage.getItem('institution');

        if (studentSubRoleVal) params.append('studentSubRole', studentSubRoleVal);
        if (studyLevel) params.append('studyLevel', studyLevel);
        if (fieldOfStudy) params.append('fieldOfStudy', fieldOfStudy);
        if (institution) params.append('institution', institution);

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

            {/* Role badge */}
            <div className="flex items-center gap-2 mb-8">
                <p className="text-sm text-blue-950 font-semibold">
                    Creating {selectedRole} account
                </p>
                {selectedRole === 'student' && studentSubRole && (
                    <span className="text-xs bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-0.5 rounded-full font-medium">
                        {subRoleLabels[studentSubRole] || studentSubRole}
                    </span>
                )}
            </div>

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