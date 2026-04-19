"use client";

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle } from 'lucide-react';
import AuthLayout from '@/components/auth/AuthLayout';
import { createUserAccount } from '@/lib/auth/authHelpers';

export default function ConfirmClient() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const [loading, setLoading] = useState(false);
    const [showToast, setShowToast] = useState(false);
    const [userRole, setUserRole] = useState('');
    const [accountType, setAccountType] = useState('');
    const [referredBy, setReferredBy] = useState('');
    const [formData, setFormData] = useState({
        firstName: '',
        surname: '',
        dateOfBirth: '',
        email: '',
        password: '',
        country: '',
        role: '',
        studentSubRole: '',
        studyLevel: '',
        fieldOfStudy: '',
        institution: '',
    });

    // Sub-role display labels
    const subRoleLabels = {
        undergraduate: 'Undergraduate',
        postgraduate: 'Postgraduate',
        researcher: 'PhD / Researcher',
        professional: 'Professional learner',
    };

    useEffect(() => {
        const role = searchParams.get('role') || sessionStorage.getItem('userRole') || 'student';
        setUserRole(role);

        const type = searchParams.get('accountType') || '';
        setAccountType(type);

        const refFromSession = sessionStorage.getItem('referredBy') || '';
        const refFromUrl = searchParams.get('referral_code') || '';
        setReferredBy(refFromSession || refFromUrl);

        setFormData({
            firstName: searchParams.get('firstName') || '',
            surname: searchParams.get('surname') || '',
            dateOfBirth: searchParams.get('dateOfBirth') || '',
            email: searchParams.get('email') || '',
            password: searchParams.get('password') || '',
            country: searchParams.get('country') || '',
            role,
            // ✅ Student academic fields — read from URL (carried all the way through)
            // Fallback to sessionStorage in case a step dropped them
            studentSubRole: searchParams.get('studentSubRole') || sessionStorage.getItem('studentSubRole') || '',
            studyLevel: searchParams.get('studyLevel') || sessionStorage.getItem('studyLevel') || '',
            fieldOfStudy: searchParams.get('fieldOfStudy') || sessionStorage.getItem('fieldOfStudy') || '',
            institution: searchParams.get('institution') || sessionStorage.getItem('institution') || '',
        });
    }, [searchParams]);

    const handleRedirect = (role, type) => {
        if (type === 'university' || role === 'university') {
            router.push('/register-school?type=university');
        } else if (role === 'seller') {
            router.push('/become-seller');
        } else {
            router.push('/student/dashboard');
        }
    };

    const handleSubmit = async () => {
        setLoading(true);
        try {
            const result = await createUserAccount({
                firstName: formData.firstName,
                surname: formData.surname,
                dateOfBirth: formData.dateOfBirth,
                email: formData.email,
                password: formData.password,
                country: formData.country,
                role: userRole,
                referredBy: referredBy || null,
                // ✅ These are now saved to Firestore under users/{uid}
                studentSubRole: formData.studentSubRole || null,
                studyLevel: formData.studyLevel || null,
                fieldOfStudy: formData.fieldOfStudy || null,
                institution: formData.institution || null,
            });

            if (result.success) {
                // ✅ Clear all session data after successful account creation
                sessionStorage.removeItem('userRole');
                sessionStorage.removeItem('referredBy');
                sessionStorage.removeItem('studentSubRole');
                sessionStorage.removeItem('studyLevel');
                sessionStorage.removeItem('fieldOfStudy');
                sessionStorage.removeItem('institution');

                setShowToast(true);
                setTimeout(() => {
                    setShowToast(false);
                    handleRedirect(userRole, accountType);
                }, 3000);
            } else {
                handleAuthError(result.error);
                setLoading(false);
            }
        } catch (err) {
            console.error('Submission Error:', err);
            alert('An unexpected error occurred. Please try again.');
            setLoading(false);
        }
    };

    const handleAuthError = (error) => {
        switch (error.code) {
            case 'auth/email-already-in-use':
                alert('Email already registered. Redirecting to sign in...');
                router.push('/auth/signin');
                break;
            case 'auth/weak-password':
                alert('Password is too weak.');
                break;
            default:
                alert(`Error: ${error.message}`);
        }
    };

    const editParams = new URLSearchParams({
        firstName: formData.firstName,
        surname: formData.surname,
        email: formData.email,
    });

    const displayRole = accountType === 'university' ? 'University' : userRole;
    const displaySubRole = formData.studentSubRole ? subRoleLabels[formData.studentSubRole] : null;

    return (
        <>
            <AuthLayout backPath={`/auth/create-account/password?${new URLSearchParams(formData).toString()}`}>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Confirm your details</h1>
                <p className="text-gray-600 mb-8">Review your information before creating your account.</p>

                {referredBy && (
                    <div className="mb-4 bg-green-50 border border-green-200 rounded-xl p-3 flex items-center gap-2">
                        <span className="text-lg">🎉</span>
                        <p className="text-sm text-green-800 font-medium">You were invited by a friend!</p>
                    </div>
                )}

                <div className="bg-blue-950 text-blue-50 rounded-2xl p-6 mb-8">
                    <div className="flex justify-between items-start mb-6">
                        <Link href={`/auth/create-account?${editParams.toString()}`}>
                            <button className="bg-white text-blue-950 px-4 py-2 rounded-full text-sm font-semibold hover:bg-blue-50 transition-colors">
                                Edit Information
                            </button>
                        </Link>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {[
                            {
                                label: 'Account Type',
                                value: displaySubRole
                                    ? `${displayRole} · ${displaySubRole}`
                                    : displayRole
                            },
                            { label: 'Name', value: `${formData.firstName} ${formData.surname}` },
                            { label: 'Email', value: formData.email },
                            { label: 'Country', value: formData.country || 'Not provided' },
                            ...(formData.studyLevel ? [{ label: 'Year of Study', value: formData.studyLevel }] : []),
                            ...(formData.fieldOfStudy ? [{ label: 'Field of Study', value: formData.fieldOfStudy }] : []),
                            ...(formData.institution ? [{ label: 'Institution', value: formData.institution }] : []),
                        ].map((item, i) => (
                            <div key={i}>
                                <label className="text-xs text-blue-200 uppercase font-bold tracking-wider">
                                    {item.label}
                                </label>
                                <p className="text-lg font-semibold capitalize">{item.value}</p>
                            </div>
                        ))}
                    </div>
                </div>

                <p className="text-xs text-gray-600 mb-6 leading-relaxed">
                    By clicking Create Account, you agree to our
                    <Link href="/lan/terms-of-service" className="text-blue-950 font-medium underline ml-1">Terms</Link> and
                    <Link href="/lan/privacy-policy" className="text-blue-950 font-medium underline ml-1">Privacy Policy</Link>.
                </p>

                <button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="w-full lg:w-1/2 mx-auto block bg-blue-950 text-white py-3 rounded-full font-semibold hover:bg-blue-900 transition-all disabled:opacity-50"
                >
                    {loading ? 'Creating Account...' : 'Create Account'}
                </button>

                <div className="text-center mt-8">
                    <Link href="/auth/signin" className="text-blue-950 hover:underline font-medium">
                        Already have an account? Sign in
                    </Link>
                </div>
            </AuthLayout>

            {showToast && (
                <div className="fixed top-6 right-6 z-[100] bg-green-600 text-white px-5 py-4 rounded-2xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-right duration-300">
                    <CheckCircle size={20} />
                    <div>
                        <p className="font-bold text-sm">Account Created! 🎉</p>
                        <p className="text-green-100 text-xs">Welcome aboard, {formData.firstName}!</p>
                    </div>
                </div>
            )}
        </>
    );
}