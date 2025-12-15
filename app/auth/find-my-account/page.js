'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from '@/lib/firebaseConfig';

export default function FindAccountPage() {
    const router = useRouter();

    const [step, setStep] = useState('email'); // email | password
    const [searchInput, setSearchInput] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [userData, setUserData] = useState(null);
    const [showAccountNotFoundModal, setShowAccountNotFoundModal] = useState(false);

    // STEP 1: FIND ACCOUNT in Firestore by email or name
    const handleFindAccount = async () => {
        if (!searchInput.trim()) {
            setError('Please enter your email or name');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const usersRef = collection(db, 'users');

            // Search by email OR name
            const qEmail = query(usersRef, where('email', '==', searchInput.trim()));
            const qName = query(usersRef, where('firstName', '==', searchInput.trim()));

            const [emailSnap, nameSnap] = await Promise.all([getDocs(qEmail), getDocs(qName)]);

            let userDoc = null;

            if (!emailSnap.empty) {
                userDoc = emailSnap.docs[0].data();
            } else if (!nameSnap.empty) {
                userDoc = nameSnap.docs[0].data();
            }

            if (!userDoc) {
                // No user found
                setShowAccountNotFoundModal(true);
            } else {
                // User found → move to password step
                setUserData(userDoc);
                setEmail(userDoc.email);
                setStep('password');
            }
        } catch (err) {
            console.error('Find Account Error:', err);
            setError('Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // STEP 2: LOGIN
    const handleLogin = async () => {
        if (!password.trim()) {
            setError('Enter your password');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const cred = await signInWithEmailAndPassword(auth, email, password);

            console.log('Welcome:', userData.displayName);

            router.push('/home');
        } catch (err) {
            console.error('Login Error:', err);
            if (err.code === 'auth/wrong-password') {
                setError('Incorrect password');
            } else {
                setError('Failed to sign in. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-white flex flex-col">
            <div className="p-4">
                <button
                    onClick={() => router.back()}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                    <ArrowLeft size={24} className="text-gray-900" />
                </button>
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex-1 px-6 pt-4"
            >
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    {step === 'email' ? 'Find your account' : 'Enter your password'}
                </h1>

                {step === 'email' && (
                    <>
                        <p className="text-gray-600 mb-8">
                            Enter your email address or your first name.
                        </p>

                        <input
                            type="text"
                            placeholder="Email or first name"
                            value={searchInput}
                            onChange={e => {
                                setSearchInput(e.target.value);
                                setError('');
                            }}
                            className="w-full border border-gray-300 px-4 py-4 rounded-lg mb-4 focus:outline-none focus:border-blue-950 text-gray-900"
                        />

                        <button
                            onClick={handleFindAccount}
                            disabled={loading}
                            className="w-full lg:w-1/4 bg-blue-950 text-white py-3 rounded-full font-semibold hover:bg-blue-900 transition-colors disabled:opacity-50"
                        >
                            {loading ? 'Searching...' : 'Continue'}
                        </button>
                        
                        <div>
                        <button
                            onClick={() => {
                                alert('Please use your email address to find your account.');
                            }}
                            className="text-gray-700 hover:underline mt-4"
                        >
                            Search by name instead
                        </button>
                        </div>
                    </>
                )}

                {step === 'password' && userData && (
                    <>
                        <p className="text-gray-600 mb-8">
                            Account found: <strong>{userData.displayName}</strong> ({userData.email})
                        </p>

                        <input
                            type="password"
                            placeholder="Password"
                            value={password}
                            onChange={e => {
                                setPassword(e.target.value);
                                setError('');
                            }}
                            className="w-full border border-gray-300 px-4 py-4 rounded-lg mb-4 focus:outline-none focus:border-blue-950 text-gray-900"
                            onKeyPress={(e) => {
                                if (e.key === 'Enter') handleLogin();
                            }}
                        />

                        <button
                            onClick={handleLogin}
                            disabled={loading}
                            className="w-full lg:w-1/4 bg-blue-950 text-white py-3 rounded-full font-semibold hover:bg-blue-900 transition-colors disabled:opacity-50"
                        >
                            {loading ? 'Signing in...' : 'Sign in'}
                        </button>

                        <div>
                        <button
                            onClick={() => {
                                setStep('email');
                                setSearchInput('');
                                setPassword('');
                                setError('');
                                setUserData(null);
                            }}
                            className="text-blue-950 hover:underline mt-4 font-medium"
                        >
                            Use a different email
                        </button>
                        </div>
                    </>
                )}

                {error && (
                    <p className="text-red-600 mt-4 font-semibold">{error}</p>
                )}
            </motion.div>

            {/* Account Not Found Modal */}
            {showAccountNotFoundModal && (
                <div className="fixed inset-0 bg-black/70 bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white rounded-2xl p-6 max-w-md w-full"
                    >
                        <h3 className="text-xl font-bold text-gray-900 mb-3" style={{ fontFamily: 'cursive' }}>
                            We couldn't find your account. Create a new account?
                        </h3>
                        <p className="text-gray-700 mb-6" style={{ fontFamily: 'cursive' }}>
                            It looks like <span className="font-semibold">{searchInput}</span> isn't connected to an account.
                            You can create a new account with this email address or try again.
                        </p>
                        <div className="flex gap-4">
                            <button
                                onClick={() => {
                                    setShowAccountNotFoundModal(false);
                                    setSearchInput('');
                                    setError('');
                                }}
                                className="flex-1 text-red-500 font-bold py-3 hover:bg-red-50 rounded-lg transition-colors"
                            >
                                TRY AGAIN
                            </button>
                            <button 
                                onClick={() => {
                                    setShowAccountNotFoundModal(false);
                                    router.push('/auth/signin');
                                }}
                                className="flex-1 text-blue-600 font-bold py-3 hover:bg-blue-50 rounded-lg transition-colors"
                            >
                                CREATE NEW ACCOUNT
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
}
