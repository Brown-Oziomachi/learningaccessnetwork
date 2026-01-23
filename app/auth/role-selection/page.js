'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import AuthLayout from '@/components/auth/AuthLayout';
import { GraduationCap, Store, Building2, X, Loader2 } from 'lucide-react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebaseConfig';

export default function RoleSelectionClient() {
    const router = useRouter();
    const [selectedRole, setSelectedRole] = useState('');
    const [showWaitlist, setShowWaitlist] = useState(false);
    const [email, setEmail] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const handleRoleClick = (role) => {
        if (role === 'student' || role === 'university') {
            setSelectedRole(role);
            setShowWaitlist(true); // Open the email capture
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
        sessionStorage.setItem('userRole', selectedRole);
        router.push('/auth/create-account');
    };

    return (
        <AuthLayout>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Join LAN Library</h1>
            <p className="text-gray-600 mb-8">Choose how you want to use the platform</p>

            <div className="space-y-4 mb-8">
                {/* Student Option */}
                <button
                    onClick={() => handleRoleClick('student')}
                    className={`w-full p-6 rounded-xl border-2 transition-all text-left ${selectedRole === 'student' ? 'border-blue-950 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}`}
                >
                    <div className="flex items-start gap-4">
                        <div className={`p-3 rounded-lg ${selectedRole === 'student' ? 'bg-blue-950' : 'bg-gray-100'}`}>
                            <GraduationCap className={`w-6 h-6 ${selectedRole === 'student' ? 'text-white' : 'text-gray-600'}`} />
                        </div>
                        <div className="flex-1">
                            <h3 className="text-lg font-semibold text-gray-900">I'm a Student</h3>
                            <p className="text-sm text-gray-600">Access premium academic materials. <span className="text-blue-900 font-bold">(Coming Soon)</span></p>
                        </div>
                    </div>
                </button>

                {/* Seller Option */}
                <button
                    onClick={() => handleRoleClick('seller')}
                    className={`w-full p-6 rounded-xl border-2 transition-all text-left ${selectedRole === 'seller' ? 'border-blue-950 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}`}
                >
                    <div className="flex items-start gap-4">
                        <div className={`p-3 rounded-lg ${selectedRole === 'seller' ? 'bg-blue-950' : 'bg-gray-100'}`}>
                            <Store className={`w-6 h-6 ${selectedRole === 'seller' ? 'text-white' : 'text-gray-600'}`} />
                        </div>
                        <div className="flex-1">
                            <h3 className="text-lg font-semibold text-gray-900">I'm a Seller</h3>
                            <p className="text-sm text-gray-600 text-green-600 font-bold underline">Live Now: Monetize your books & research</p>
                        </div>
                    </div>
                </button>

                {/* University Option */}
                <button
                    onClick={() => handleRoleClick('university')}
                    className={`w-full p-6 rounded-xl border-2 transition-all text-left ${selectedRole === 'university' ? 'border-blue-950 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}`}
                >
                    <div className="flex items-start gap-4">
                        <div className={`p-3 rounded-lg ${selectedRole === 'university' ? 'bg-blue-950' : 'bg-gray-100'}`}>
                            <Building2 className={`w-6 h-6 ${selectedRole === 'university' ? 'text-white' : 'text-gray-600'}`} />
                        </div>
                        <div className="flex-1">
                            <h3 className="text-lg font-semibold text-gray-900">Register Institution</h3>
                            <p className="text-sm text-gray-600">Digital library management. <span className="text-blue-900 font-bold">(Coming Soon)</span></p>
                        </div>
                    </div>
                </button>
            </div>

            {selectedRole === 'seller' && (
                <button
                    onClick={handleContinue}
                    className="w-full bg-blue-950 text-white py-3 rounded-full font-semibold hover:bg-blue-900 transition-colors"
                >
                    Continue to Registration
                </button>
            )}

            {/* WAITLIST MODAL */}
            {showWaitlist && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl p-8 max-w-md w-full relative shadow-2xl">
                        <button onClick={() => setShowWaitlist(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
                            <X className="w-6 h-6" />
                        </button>
                        
                        {!submitted ? (
                            <>
                                <h2 className="text-2xl font-bold mb-2 text-blue-950">Join the Waitlist</h2>
                                <p className="text-gray-600 mb-6">We're stocking the library! Leave your email and be the first to know when we open for {selectedRole}s.</p>
                                <form onSubmit={handleWaitlistSubmit} className="space-y-4">
                                    <input 
                                        type="email" required placeholder="Enter your email" value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full text-black p-4 border rounded-xl outline-blue-950"
                                    />
                                    <button disabled={isSubmitting} className="w-full bg-blue-950 text-white py-3 rounded-xl flex justify-center items-center">
                                        {isSubmitting ? <Loader2 className="animate-spin" /> : 'Notify Me'}
                                    </button>
                                </form>
                            </>
                        ) : (
                            <div className="text-center py-8">
                                <div className="text-green-600 text-5xl mb-4">✓</div>
                                <h2 className="text-2xl font-bold text-blue-950">You're on the list!</h2>
                                <p className="text-gray-600">We'll reach out to you at {email} soon.</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </AuthLayout>
    );
}