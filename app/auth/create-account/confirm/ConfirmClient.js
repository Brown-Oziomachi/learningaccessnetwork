'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, ArrowRight, X } from 'lucide-react';
import AuthLayout from '@/components/auth/AuthLayout';
import { createUserAccount } from '@/lib/auth/authHelpers';
import { db } from '@/lib/firebaseConfig';
import { collection, addDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore';

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
        password: ''
    });

    useEffect(() => {
        const role = sessionStorage.getItem('userRole') || 'student';
        setUserRole(role);

        const type = searchParams.get('accountType') || '';
        setAccountType(type);

        const refFromSession = sessionStorage.getItem('referredBy') || '';
        const refFromUrl = searchParams.get('referral_code') || '';
        const ref = refFromSession || refFromUrl;
        setReferredBy(ref);

        setFormData({
            firstName: searchParams.get('firstName') || '',
            surname: searchParams.get('surname') || '',
            dateOfBirth: searchParams.get('dateOfBirth') || '',
            email: searchParams.get('email') || '',
            password: searchParams.get('password') || '',
            country: searchParams.get('country') || '', // ✅ add this
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

        const accountData = {
            ...formData,
            role: userRole,
            referredBy: referredBy || null,
        };

        const result = await createUserAccount(accountData);

        if (result.success) {
            const newUserUid = result.uid;

            // Resolve referral
            if (referredBy && referredBy !== newUserUid) {
                try {
                    const { query, collection, where, getDocs } = await import('firebase/firestore');
                    const q = query(
                        collection(db, 'users'),
                        where('referralCode', '==', referredBy)
                    );
                    const snap = await getDocs(q);

                    if (!snap.empty) {
                        const referrerId = snap.docs[0].id;
                        await addDoc(collection(db, 'referrals'), {
                            referrerId: referrerId,
                            referredUserId: newUserUid,
                            referredEmail: formData.email,
                            referredName: `${formData.firstName} ${formData.surname}`,
                            status: 'pending',
                            reward: 500,
                            claimed: false,
                            createdAt: serverTimestamp(),
                        });
                    }
                } catch (err) {
                    console.error('Error creating referral:', err);
                }
            }

            sessionStorage.removeItem('userRole');
            sessionStorage.removeItem('referredBy');

            // Show toast briefly then redirect
            setShowToast(true);
            setTimeout(() => {
                setShowToast(false);
                handleRedirect(userRole, accountType);
            }, 20000);

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
        <>
            <AuthLayout
                backPath={`/auth/create-account/password?${new URLSearchParams(formData).toString()}`}
            >
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    Confirm your details
                </h1>
                <p className="text-gray-600 mb-8">
                    Please review your information before creating your account.
                </p>

                {/* Referral badge */}
                {referredBy && (
                    <div className="mb-4 bg-green-50 border border-green-200 rounded-xl p-3 flex items-center gap-2 mx-auto">
                        <span className="text-green-600 text-lg">🎉</span>
                        <p className="text-sm text-green-800 font-medium">
                            You were invited by a friend!
                        </p>
                    </div>
                )}

                <div className="bg-blue-950 border-2 border-blue-950 text-blue-50 rounded-2xl p-6 mb-8">
                    <div className="space-y-4">
                        <Link href={`/auth/create-account?${editParams.toString()}`}>
                            <button className="max-md:w-full lg:right-10 mt-2 mb-4 bg-white lg:w-1/4 border-2 border-blue-950 text-blue-950 py-3 rounded-full font-semibold hover:bg-blue-50 transition-colors">
                                Edit Information
                            </button>
                        </Link>

                        <div>
                            <label className="text-sm text-gray-200 font-medium uppercase">Account Type</label>
                            <p className="text-lg font-semibold capitalize">
                                {accountType === 'university' ? 'University/School' : userRole}
                            </p>
                        </div>

                        <div>
                            <label className="text-sm font-medium uppercase">Name</label>
                            <p className="text-lg font-semibold">
                                {formData.firstName} {formData.surname}
                            </p>
                        </div>

                        <div>
                            <label className="text-sm font-medium uppercase">Date of Birth</label>
                            <p className="text-lg font-semibold">
                                {formData.dateOfBirth || 'Not provided'}
                            </p>
                        </div>

                        <div>
                            <label className="text-sm font-medium uppercase">Email</label>
                            <p className="text-lg font-semibold">
                                {formData.email}
                            </p>
                        </div>

                        <div>
                            <label className="text-sm font-medium uppercase">Country</label>
                            <p className="text-lg font-semibold">
                                {formData.country || 'Not provided'}
                            </p>
                        </div>
                    </div>
                </div>

                <p className="text-xs text-gray-600 mb-6 leading-relaxed">
                    By clicking Create Account, you agree to our{' '}
                    <Link href="/lan/terms-of-service">
                        <button className="text-blue-950 font-medium hover:underline">Terms</button>
                    </Link>,{' '}
                    <Link href="/lan/privacy-policy">
                        <button className="text-blue-950 font-medium hover:underline">Privacy Policy</button>
                    </Link>
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

            {/* Toast Notification */}
            {showToast && (
                <div className="fixed top-6 right-6 z-[100] bg-green-600 text-white px-5 py-4 rounded-2xl shadow-2xl flex items-center gap-3 max-w-sm"
                    style={{ animation: 'slideIn 0.3s ease-out' }}
                >
                    <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                        <CheckCircle size={18} />
                    </div>
                    <div>
                        <p className="font-bold text-sm">Account Created! 🎉</p>
                        <p className="text-green-100 text-xs">Welcome, {formData.firstName}!</p>
                    </div>
                </div>
            )}

            <style jsx>{`
                @keyframes slideIn {
                    from { opacity: 0; transform: translateX(100%); }
                    to { opacity: 1; transform: translateX(0); }
                }
            `}</style>
        </>
    );
}