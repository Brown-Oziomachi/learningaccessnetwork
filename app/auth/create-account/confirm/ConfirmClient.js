'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, Sparkles, ArrowRight, X } from 'lucide-react';
import AuthLayout from '@/components/auth/AuthLayout';
import { createUserAccount } from '@/lib/auth/authHelpers';
import { db } from '@/lib/firebaseConfig';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export default function ConfirmClient() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const [loading, setLoading] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [userRole, setUserRole] = useState('');
    const [accountType, setAccountType] = useState('');
    const [referredBy, setReferredBy] = useState(''); // ✅ referral code
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

        // ✅ Get referredBy from sessionStorage (saved in role-selection)
        // Also check URL as backup
        const refFromSession = sessionStorage.getItem('referredBy') || '';
        const refFromUrl = searchParams.get('referral_code') || '';
        const ref = refFromSession || refFromUrl;
        setReferredBy(ref);

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

        // ✅ Pass referredBy into account creation so it gets saved to the user doc
        const accountData = {
            ...formData,
            role: userRole,
            referredBy: referredBy || null, // ✅ saved to users/{uid}.referredBy in Firestore
        };

        const result = await createUserAccount(accountData);

        if (result.success) {
            const newUserUid = result.uid; // ✅ make sure createUserAccount returns uid

            // ✅ Create the referral doc in Firestore so referrer earns ₦500
            if (referredBy && referredBy !== newUserUid) {
                try {
                    await addDoc(collection(db, 'referrals'), {
                        referrerId: referredBy,        // person who shared the link
                        referredUserId: newUserUid,    // new user just created
                        referredEmail: formData.email,
                        referredName: `${formData.firstName} ${formData.surname}`,
                        status: 'pending',             // becomes 'completed' after first purchase
                        reward: 500,                   // ₦500 reward
                        claimed: false,
                        createdAt: serverTimestamp(),
                    });
                    console.log('✅ Referral record created for referrer:', referredBy);
                } catch (err) {
                    // Don't block signup if referral fails
                    console.error('Error creating referral:', err);
                }
            }

            // ✅ Clean up sessionStorage
            sessionStorage.removeItem('userRole');
            sessionStorage.removeItem('referredBy');

            setShowSuccessModal(true);

            setTimeout(() => {
                handleModalContinue();
            }, 3000);

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

    const handleModalContinue = () => {
        setShowSuccessModal(false);

        if (accountType === 'university' || userRole === 'university') {
            router.push('/register-school?type=university');
        } else if (userRole === 'seller') {
            router.push('/become-seller');
        } else {
            router.push('/student/dashboard');
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

                {/* ✅ Show referral badge if user was referred */}
                {referredBy && (
                    <div className="mb-4 bg-green-50 border border-green-200 rounded-xl p-3 flex items-center gap-2 mx-auto">
                        <span className="text-green-600 text-lg">🎉</span>
                        <p className="text-sm text-green-800 font-medium ">
                            You were invited by a friend!.
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
                    {/* and{' '}
                    <Link href="/lan/cookies-policy">
                        <button className="text-blue-950 font-medium hover:underline">Cookies Policy</button>
                    </Link>. */}
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

            {/* Success Modal */}
            {showSuccessModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden transform animate-in zoom-in-95 duration-300">
                        <button
                            onClick={handleModalContinue}
                            className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors z-10"
                        >
                            <X size={20} className="text-gray-500" />
                        </button>

                        <div className="relative bg-gradient-to-br from-blue-950 via-blue-800 to-blue-900 p-8 text-center overflow-hidden">

                            {/* <div className="relative mb-4">
                                <div className="w-20 h-20 bg-white rounded-full mx-auto flex items-center justify-center shadow-lg animate-bounce">
                                    <CheckCircle size={48} className="text-green-600" strokeWidth={2.5} />
                                </div>
                                <Sparkles className="absolute top-0 right-1/3 text-yellow-300 animate-pulse" size={24} />
                                <Sparkles className="absolute bottom-0 left-1/3 text-yellow-300 animate-pulse delay-150" size={20} />
                            </div> */}
                            <p className="text-blue-100 text-sm">
                                Your account has been created successfully
                            </p>
                        </div>

                        <div className="p-8">
                            <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
                                <p className="text-green-800 text-sm font-medium text-center">
                                    ✓ Account verified and activated
                                </p>
                            </div>

                            <div className="space-y-3 mb-6">
                                <div className="flex items-start gap-3 text-sm text-gray-600">
                                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                        <span className="text-blue-600 font-bold text-xs">1</span>
                                    </div>
                                    <p>
                                        <span className="font-semibold text-gray-900">Welcome, {formData.firstName}!</span> Your journey to academic excellence starts now.
                                    </p>
                                </div>

                                {accountType === 'university' && (
                                    <div className="flex items-start gap-3 text-sm text-gray-600">
                                        <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                            <span className="text-purple-600 font-bold text-xs">🎓</span>
                                        </div>
                                        <p>
                                            <span className="font-semibold text-gray-900">Next: Register Your Institution</span> Complete your school registration to get verified.
                                        </p>
                                    </div>
                                )}

                                <div className="flex items-start gap-3 text-sm text-gray-600">
                                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                        <span className="text-blue-600 font-bold text-xs">2</span>
                                    </div>
                                    <p>Access thousands of study materials and connect with learners worldwide.</p>
                                </div>

                                {userRole === 'seller' && (
                                    <div className="flex items-start gap-3 text-sm text-gray-600">
                                        <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                            <span className="text-green-600 font-bold text-xs">💰</span>
                                        </div>
                                        <p>
                                            <span className="font-semibold text-gray-900">Author Account Ready!</span> Start uploading and earning from your knowledge.
                                        </p>
                                    </div>
                                )}
                            </div>

                            <button
                                onClick={handleModalContinue}
                                className="w-full bg-blue-950 text-white py-4 rounded-2xl font-bold text-lg hover:bg-blue-900 transition-all shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 group"
                            >
                                {accountType === 'university'
                                    ? 'Register Your School'
                                    : userRole === 'seller'
                                        ? 'Go to Author Dashboard'
                                        : 'Explore Your Dashboard'}
                                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                            </button>

                            <p className="text-center text-xs text-gray-500 mt-4">
                                Redirecting automatically in 3 seconds...
                            </p>
                        </div>

                        <div className="h-2 bg-gradient-to-r from-blue-600 via-green-500 to-blue-600"></div>
                    </div>
                </div>
            )}
        </>
    );
}