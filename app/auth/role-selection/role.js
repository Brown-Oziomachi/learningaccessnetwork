'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import AuthLayout from '@/components/auth/AuthLayout';
import { GraduationCap, Store, Building2, X, Loader2 } from 'lucide-react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebaseConfig';

export default function RoleSelectionClient() {
    const router = useRouter();
    const searchParams = useSearchParams();

    // ✅ Capture ref and email from URL
    const emailParam = searchParams.get('email');
    const refParam = searchParams.get('ref'); // referral code (UID of referrer)

    const [selectedRole, setSelectedRole] = useState('');
    const [showWaitlist, setShowWaitlist] = useState(false);
    const [email, setEmail] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const handleRoleClick = (role) => {
        if (role === 'student' || role === 'university') {
            setSelectedRole(role);
            setShowWaitlist(true);
        } else {
            setSelectedRole(role);
            setShowWaitlist(false);
        }
    };

    const handleWaitlistSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await addDoc(collection(db, "waitlist"), {
                email: email,
                roleRequested: selectedRole,
                timestamp: serverTimestamp()
            });
            setSubmitted(true);
            setTimeout(() => {
                setShowWaitlist(false);
                setSubmitted(false);
                setEmail('');
            }, 3000);
        } catch (error) {
            console.error("Error adding to waitlist:", error);
            alert("Something went wrong. Please try again.");
        }
        setIsSubmitting(false);
    };

    const handleContinue = () => {
        if (!selectedRole || selectedRole !== 'seller') return;

        // ✅ Save role AND ref to sessionStorage so it survives multi-step flow
        sessionStorage.setItem('userRole', selectedRole);
        if (refParam) {
            sessionStorage.setItem('referredBy', refParam);
        }

        // ✅ Also pass ref in URL as backup
        const params = new URLSearchParams();
        if (emailParam) params.append('email', emailParam);
        if (refParam) params.append('ref', refParam);

        const query = params.toString();
        router.push(`/auth/create-account${query ? `?${query}` : ''}`);
    };

    return (
        <div className="min-h-screen relative overflow-hidden">
            {/* Background Images */}
            <div className="absolute inset-0 grid grid-cols-1 md:grid-cols-3">
                <div className="relative bg-cover bg-center"
                    style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=1200&q=80)' }}>
                    <div className="absolute inset-0 bg-blue-900/60"></div>
                </div>
                <div className="relative bg-cover bg-center"
                    style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1551135049-8a33b5883817?w=1200&q=80)' }}>
                    <div className="absolute inset-0 bg-green-800/60"></div>
                </div>
                <div className="relative bg-cover bg-center"
                    style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1562774053-701939374585?w=1200&q=80)' }}>
                    <div className="absolute inset-0 bg-purple-900/60"></div>
                </div>
            </div>

            {/* Content */}
            <div className="relative z-10 min-h-screen flex flex-col">
                <div className="flex-1 flex items-center justify-center px-4 py-8">
                    <div className="max-w-7xl w-full">
                        <div className="text-center mb-8 md:mb-12">
                            <h1 className="text-2xl md:text-4xl lg:text-5xl font-bold text-white mb-3 drop-shadow-lg">
                                How would you like to use LAN Library?
                            </h1>
                            <p className="text-white/90 text-base md:text-lg drop-shadow">Please select an option below</p>
                            {/* ✅ Show referral badge if user came from a referral link */}
                            {refParam && (
                                <div className="mt-3 inline-block bg-green-500 text-white px-4 py-2 rounded-full text-sm font-semibold">
                                    🎉 You were invited by a friend!
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-8">
                            {/* Student Card */}
                            <button
                                onClick={() => handleRoleClick('student')}
                                className={`group relative bg-white/95 backdrop-blur-sm p-6 md:p-8 rounded-2xl md:rounded-3xl transition-all duration-300 text-center ${selectedRole === 'student'
                                        ? 'ring-4 ring-white ring-offset-4 ring-offset-blue-900 shadow-2xl scale-105'
                                        : 'hover:bg-white hover:shadow-xl hover:scale-[1.02]'
                                    }`}
                            >
                                <div className="mb-6 flex justify-center">
                                    <div className={`p-5 md:p-6 rounded-2xl transition-all duration-300 ${selectedRole === 'student' ? 'bg-blue-950 shadow-lg' : 'bg-blue-100 group-hover:bg-blue-950 shadow-md'
                                        }`}>
                                        <GraduationCap className={`w-12 h-12 md:w-16 md:h-16 transition-colors ${selectedRole === 'student' ? 'text-white' : 'text-blue-950 group-hover:text-white'
                                            }`} />
                                    </div>
                                </div>
                                <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-3">Student Account</h3>
                                <p className="text-gray-600 text-sm md:text-base leading-relaxed mb-4">
                                    Access premium academic materials and resources for your studies
                                </p>
                                <div className="inline-block bg-yellow-100 text-yellow-800 px-4 py-2 rounded-full text-xs md:text-sm font-semibold">
                                    Coming Soon
                                </div>
                            </button>

                            {/* Seller Card */}
                            <button
                                onClick={() => handleRoleClick('seller')}
                                className={`group relative bg-white/95 backdrop-blur-sm p-6 md:p-8 rounded-2xl md:rounded-3xl transition-all duration-300 text-center ${selectedRole === 'seller'
                                        ? 'ring-4 ring-white ring-offset-4 ring-offset-green-700 shadow-2xl scale-105'
                                        : 'hover:bg-white hover:shadow-xl hover:scale-[1.02]'
                                    }`}
                            >
                                <div className="absolute top-4 right-4">
                                    <div className="bg-green-500 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 animate-pulse-slow">
                                        <span className="w-2 h-2 bg-white rounded-full animate-ping"></span>
                                        LIVE
                                    </div>
                                </div>
                                <div className="mb-6 flex justify-center">
                                    <div className={`p-5 md:p-6 rounded-2xl transition-all duration-300 ${selectedRole === 'seller' ? 'bg-green-600 shadow-lg' : 'bg-green-100 group-hover:bg-green-600 shadow-md'
                                        }`}>
                                        <Store className={`w-12 h-12 md:w-16 md:h-16 transition-colors ${selectedRole === 'seller' ? 'text-white' : 'text-green-600 group-hover:text-white'
                                            }`} />
                                    </div>
                                </div>
                                <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-3">Seller Account</h3>
                                <p className="text-gray-600 text-sm md:text-base leading-relaxed mb-4">
                                    Monetize your books and research. Earn 80% on every sale globally
                                </p>
                                <div className="inline-block bg-green-100 text-green-700 px-4 py-2 rounded-full text-xs md:text-sm font-bold">
                                    ✓ Live Now
                                </div>
                            </button>

                            {/* Institution Card */}
                            <button
                                onClick={() => handleRoleClick('university')}
                                className={`group relative bg-white/95 backdrop-blur-sm p-6 md:p-8 rounded-2xl md:rounded-3xl transition-all duration-300 text-center md:col-span-3 lg:col-span-1 ${selectedRole === 'university'
                                        ? 'ring-4 ring-white ring-offset-4 ring-offset-purple-800 shadow-2xl scale-105'
                                        : 'hover:bg-white hover:shadow-xl hover:scale-[1.02]'
                                    }`}
                            >
                                <div className="mb-6 flex justify-center">
                                    <div className={`p-5 md:p-6 rounded-2xl transition-all duration-300 ${selectedRole === 'university' ? 'bg-purple-600 shadow-lg' : 'bg-purple-100 group-hover:bg-purple-600 shadow-md'
                                        }`}>
                                        <Building2 className={`w-12 h-12 md:w-16 md:h-16 transition-colors ${selectedRole === 'university' ? 'text-white' : 'text-purple-600 group-hover:text-white'
                                            }`} />
                                    </div>
                                </div>
                                <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-3">Institution Account</h3>
                                <p className="text-gray-600 text-sm md:text-base leading-relaxed mb-4">
                                    Digital library management for universities and educational institutions
                                </p>
                                <div className="inline-block bg-yellow-100 text-yellow-800 px-4 py-2 rounded-full text-xs md:text-sm font-semibold">
                                    Coming Soon
                                </div>
                            </button>
                        </div>

                        {selectedRole === 'seller' && (
                            <div className="text-center pb-8">
                                <button
                                    onClick={handleContinue}
                                    className="w-full md:w-auto bg-white text-blue-950 px-8 md:px-12 py-3 md:py-4 rounded-full font-semibold text-base md:text-lg hover:bg-gray-100 transition-all shadow-lg hover:shadow-xl transform hover:scale-105 duration-200"
                                >
                                    Continue to Registration →
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Waitlist Modal */}
            {showWaitlist && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl md:rounded-3xl p-6 md:p-12 max-w-2xl w-full relative shadow-2xl animate-slideUp max-h-[90vh] overflow-y-auto">
                        <button
                            onClick={() => setShowWaitlist(false)}
                            className="absolute top-4 md:top-6 right-4 md:right-6 text-gray-400 hover:text-gray-600 transition-colors z-10"
                        >
                            <X className="w-6 h-6 md:w-7 md:h-7" />
                        </button>

                        {!submitted ? (
                            <>
                                <h2 className="text-2xl md:text-4xl font-bold mb-4 text-blue-950 pr-8">Join the Waitlist 🎉</h2>
                                <div className="py-4 md:py-6 mb-4 md:mb-6">
                                    <img src="/Log.png" alt="LAN Library" className="w-full max-w-md mx-auto rounded-xl shadow-md" />
                                </div>
                                <p className="text-gray-600 text-base md:text-lg mb-6 md:mb-8 leading-relaxed">
                                    We're stocking the library! Leave your email and be the first to know
                                    when we open for <span className="font-bold text-blue-950">{selectedRole}s</span>.
                                </p>
                                <form onSubmit={handleWaitlistSubmit} className="space-y-4 md:space-y-5">
                                    <input
                                        type="email"
                                        required
                                        placeholder="Enter your email address"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full text-gray-900 p-4 md:p-5 border-2 border-gray-300 rounded-xl md:rounded-2xl outline-none focus:border-blue-950 focus:ring-4 focus:ring-blue-100 transition-all text-base md:text-lg"
                                    />
                                    <button
                                        disabled={isSubmitting}
                                        className="w-full bg-blue-950 text-white py-4 md:py-5 rounded-xl md:rounded-2xl flex justify-center items-center font-semibold text-base md:text-lg hover:bg-blue-900 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
                                    >
                                        {isSubmitting ? (
                                            <><Loader2 className="animate-spin mr-2" size={24} />Joining...</>
                                        ) : (
                                            'Notify Me When Ready'
                                        )}
                                    </button>
                                </form>
                            </>
                        ) : (
                            <div className="text-center py-8 md:py-12">
                                <div className="text-green-600 text-5xl md:text-7xl mb-4 md:mb-6 animate-bounce">✓</div>
                                <h2 className="text-2xl md:text-3xl font-bold text-blue-950 mb-2 md:mb-3">You're on the list!</h2>
                                <p className="text-gray-600 text-base md:text-lg">
                                    We'll reach out to you at <span className="font-semibold text-blue-950 break-all">{email}</span> soon.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            <style jsx>{`
                @keyframes slideUp {
                    from { opacity: 0; transform: translateY(30px) scale(0.95); }
                    to { opacity: 1; transform: translateY(0) scale(1); }
                }
                .animate-slideUp { animation: slideUp 0.3s ease-out; }
                @keyframes bounce {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-10px); }
                }
                .animate-bounce { animation: bounce 0.6s ease-in-out 2; }
                @keyframes pulse-slow {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.7; }
                }
                .animate-pulse-slow { animation: pulse-slow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
            `}</style>
        </div>
    );
}