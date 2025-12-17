'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Globe } from 'lucide-react';
import { signInWithPopup, GoogleAuthProvider, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { db, auth } from '@/lib/firebaseConfig';
import { sendPasswordResetEmail, fetchSignInMethodsForEmail } from 'firebase/auth';
import Link from 'next/link';

export default function AuthSystem() {
    const router = useRouter();
    const [currentPage, setCurrentPage] = useState('signin');
    const [loading, setLoading] = useState(false);
    const [showAccountNotFoundModal, setShowAccountNotFoundModal] = useState(false);
    const [notFoundEmail, setNotFoundEmail] = useState('');

    const [formData, setFormData] = useState({
        firstName: '',
        surname: '',
        dateOfBirth: '',
        email: '',
        password: ''
    });

    const [loginData, setLoginData] = useState({
        email: '',
        password: ''
    });

    const [findAccountEmail, setFindAccountEmail] = useState('');
    const [errors, setErrors] = useState({});

    // Validation functions
    const validateName = () => {
        if (!formData.firstName.trim()) {
            setErrors({ firstName: 'First name is required' });
            return false;
        }
        if (!formData.surname.trim()) {
            setErrors({ surname: 'Surname is required' });
            return false;
        }
        setErrors({});
        return true;
    };

    const validateDOB = () => {
        if (!formData.dateOfBirth) {
            setErrors({ dateOfBirth: 'Date of birth is required' });
            return false;
        }
        setErrors({});
        return true;
    };

    const validateEmail = () => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!formData.email.trim()) {
            setErrors({ email: 'Email is required' });
            return false;
        }
        if (!emailRegex.test(formData.email)) {
            setErrors({ email: 'Please enter a valid email' });
            return false;
        }
        setErrors({});
        return true;
    };

    const validatePassword = () => {
        if (!formData.password || formData.password.length < 6) {
            setErrors({ password: 'Password must be at least 6 characters' });
            return false;
        }
        setErrors({});
        return true;
    };

    const handleGoogleSignIn = async () => {
        setLoading(true);
        try {
            const provider = new GoogleAuthProvider();
            const result = await signInWithPopup(auth, provider);
            const user = result.user;

            // Save user data to Firestore
            await setDoc(doc(db, 'users', user.uid), {
                email: user.email,
                displayName: user.displayName,
                photoURL: user.photoURL,
                createdAt: new Date().toISOString()
            }, { merge: true });

            router.push('/home');
        } catch (error) {
            console.error('Google Sign In Error:', error);
            alert('Failed to sign in with Google. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleLogin = async () => {
        if (!loginData.email || !loginData.password) {
            alert('Please fill in all fields');
            return;
        }

        setLoading(true);
        try {
            // Attempt to sign in with email & password
            const userCredential = await signInWithEmailAndPassword(
                auth,
                loginData.email,
                loginData.password
            );

            // Fetch user data from Firestore by UID
            const userDocRef = doc(db, 'users', userCredential.user.uid);
            const userDoc = await getDoc(userDocRef);

            if (userDoc.exists()) {
                // Optional: store user info in state/context
                router.push('/home');
            } else {
                // Firestore profile missing, still allow login
                router.push('/home');
            }
        } catch (error) {
            console.error('Login Error:', error);

            switch (error.code) {
                case 'auth/user-not-found':
                    // Email not registered → show modal or redirect to signup
                    setFormData(prev => ({ ...prev, email: loginData.email }));
                    setCurrentPage('join'); // redirect to signup page
                    alert('No account found with this email. You can create a new account.');
                    break;

                case 'auth/wrong-password':
                    alert('Incorrect password. You can try again or reset your password.');
                    break;

                case 'auth/invalid-email':
                    alert('Invalid email address.');
                    break;

                default:
                    alert('Failed to sign in. Please create account to continue or try again later.');
            }
        } finally {
            setLoading(false);
        }
    };


    const handleInputChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        setErrors({});
    };

    const handleNext = (nextPage) => {
        // Validation before moving to next page
        if (currentPage === 'name' && !validateName()) return;
        if (currentPage === 'dob' && !validateDOB()) return;
        if (currentPage === 'email' && !validateEmail()) return;
        if (currentPage === 'password' && !validatePassword()) return;

        setCurrentPage(nextPage);
    };

    const handleSubmit = async () => {
        if (!validatePassword()) return;

        setLoading(true);
        try {
            // Create user with email and password
            const userCredential = await createUserWithEmailAndPassword(
                auth,
                formData.email,
                formData.password
            );

            // Save additional user data to Firestore
            await setDoc(doc(db, 'users', userCredential.user.uid), {
                firstName: formData.firstName,
                surname: formData.surname,
                displayName: `${formData.firstName} ${formData.surname}`,
                email: formData.email,
                dateOfBirth: formData.dateOfBirth,
                createdAt: new Date().toISOString()
            });

            alert('Account created successfully!');
            router.push('/home');

        } catch (error) {
            console.error('Account Creation Error:', error);

            // Handle specific Firebase Auth errors
            switch (error.code) {
                case 'auth/email-already-in-use':
                    alert('This email is already registered. Please sign in instead.');
                    setCurrentPage('signin');
                    setLoginData({ email: formData.email, password: '' });
                    break;

                case 'auth/weak-password':
                    alert('Password is too weak. Please use a stronger password (at least 6 characters).');
                    break;

                case 'auth/invalid-email':
                    alert('Invalid email address. Please check the format.');
                    break;

                default:
                    // Show the exact Firebase error message for easier debugging
                    alert(`Failed to create account: ${error.message}`);
            }
        } finally {
            setLoading(false);
        }
    };


    const pageVariants = {
        initial: { opacity: 0, x: 20 },
        animate: { opacity: 1, x: 0 },
        exit: { opacity: 0, x: -20 }
    };

    return (
        <div className="min-h-screen bg-white flex flex-col">
            <AnimatePresence mode="wait">
                {/* Sign In Page */}
                {currentPage === 'signin' && (
                    <motion.div
                        key="signin"
                        variants={pageVariants}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        className="flex-1 flex flex-col"
                    >
                        <div className="p-4">
                            <button
                                onClick={() => router.back()}
                                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                            >
                                <ArrowLeft size={24} className="text-gray-900" />
                            </button>
                        </div>

                        <div className="px-4 mb-8">
                            <select className="w-full text-center text-gray-600 py-2 focus:outline-none">
                                <option>English (UK)</option>
                                <option>English (US)</option>
                            </select>
                        </div>

                        <div className="flex-1 flex flex-col items-center justify-start px-6 pt-8">
                            <div className="mb-8">
                                <div className="w-24 h-24 bg-white border-4 border-blue-950 rounded-full flex items-center justify-center">
                                    <Globe className="w-12 h-12 text-blue-950" />
                                </div>
                            </div>

                            <div className="w-full max-w-md mb-8">
                                <button
                                    onClick={handleGoogleSignIn}
                                    disabled={loading}
                                    className="w-full bg-white border-2 border-gray-300 hover:border-gray-400 text-gray-700 font-semibold py-3 rounded-full transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                                >
                                    <span>Continue with Google</span>
                                </button>
                            </div>

                            <div className="w-full max-w-md mb-8">
                                <div className="relative">
                                    <div className="absolute inset-0 flex items-center">
                                        <div className="w-full border-t border-gray-300"></div>
                                    </div>
                                    <div className="relative flex justify-center text-sm">
                                        <span className="px-4 bg-white text-gray-500">OR</span>
                                    </div>
                                </div>
                            </div>

                            <div className="w-full max-w-md space-y-4 mb-6">
                                <input
                                    type="email"
                                    placeholder="Email address"
                                    value={loginData.email}
                                    onChange={(e) => setLoginData(prev => ({ ...prev, email: e.target.value }))}
                                    className="w-full px-4 py-4 border text-black border-gray-300 rounded-lg focus:outline-none focus:border-blue-950"
                                />
                                <input
                                    type="password"
                                    placeholder="Password"
                                    value={loginData.password}
                                    onChange={(e) => setLoginData(prev => ({ ...prev, password: e.target.value }))}
                                    className="w-full px-4 py-4 border text-black border-gray-300 rounded-lg focus:outline-none focus:border-blue-950"
                                />
                            </div>

                            <button
                                onClick={handleLogin}
                                disabled={loading}
                                className="w-full max-w-md bg-blue-950 text-white py-3 rounded-full font-semibold hover:bg-blue-900 transition-colors mb-4 disabled:opacity-50"
                            >
                                {loading ? 'Signing in...' : 'Log in'}
                            </button>

                            <Link href="/auth/find-my-account">
                            <button
                                className="text-blue-950 hover:underline mb-12"
                            >
                                Forgotten password?
                            </button>
                            </Link>

                            <div className="flex-1"></div>

                            <button
                                onClick={() => handleNext('join')}
                                className="w-full max-w-md bg-white border-2 border-blue-950 text-blue-950 py-3 rounded-full font-semibold hover:bg-blue-50 transition-colors mb-4"
                            >
                                Create new account
                            </button>

                            <div className="mb-8 text-gray-500 text-sm">
                                <span className="font-bold">Learning Access Network</span>
                            </div>
                        </div>
                    </motion.div>
                )}

                    
                {/* Join Page */}
                {currentPage === 'join' && (
                    <motion.div
                        key="join"
                        variants={pageVariants}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        className="flex-1 flex flex-col"
                    >
                        <div className="p-4">
                            <button
                                onClick={() => handleNext('signin')}
                                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                            >
                                <ArrowLeft size={24} className="text-gray-900" />
                            </button>
                        </div>

                        <div className="flex-1 px-6 pt-4">
                            <h1 className="text-3xl font-bold text-gray-900 mb-8">
                                Join Learning Access Network
                            </h1>

                            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-3xl p-8 mb-6">
                                <div className="flex items-center justify-center gap-4">
                                    <Globe className="w-16 h-16 text-blue-950" />
                                    <div className="text-6xl">📚</div>
                                    <div className="text-6xl">👍</div>
                                </div>
                            </div>

                            <p className="text-gray-700 mb-8 leading-relaxed">
                                Create an account to access thousands of PDF books, connect with learners, and build your digital library.
                            </p>

                                <div className="flex flex-col md:flex-row gap-5 max-md:w-full">
                            <button
                                onClick={() => handleNext('name')}
                                className="w-full md:w-auto bg-blue-950 text-white py-3 px-5 rounded-full font-semibold hover:bg-blue-900 transition-colors"
                            >
                                Create new account
                            </button>

                            <a
                                href="/auth/find-my-account"
                                className="w-full md:w-auto text-center bg-white text-blue-950 py-3 px-12 rounded-full border border-blue-950 font-semibold hover:bg-blue-950 hover:text-white transition-colors"
                            >
                                Find my account
                            </a>
                            </div>

                        </div>
                    </motion.div>
                )}

                {/* Name Page */}
                {currentPage === 'name' && (
                    <motion.div
                        key="name"
                        variants={pageVariants}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        className="flex-1 flex flex-col"
                    >
                        <div className="p-4">
                            <button
                                onClick={() => handleNext('join')}
                                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                            >
                                <ArrowLeft size={24} className="text-gray-900" />
                            </button>
                        </div>

                        <div className="flex-1 px-6 pt-4 flex flex-col">
                            <div id="/create-account"></div>
                            <h1 className="text-3xl font-bold text-gray-900 mb-2">
                                What's your name?
                            </h1>
                            <p className="text-gray-600 mb-8">
                                Enter the name you use in real life.
                            </p>

                            <div className="flex gap-4 mb-2">
                                <div className="flex-1">
                                    <input
                                        type="text"
                                        placeholder="First name"
                                        value={formData.firstName}
                                        onChange={(e) => handleInputChange('firstName', e.target.value)}
                                        className="w-full px-4 py-4 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-950 text-gray-900"
                                    />
                                </div>
                                <div className="flex-1">
                                    <input
                                        type="text"
                                        placeholder="Surname"
                                        value={formData.surname}
                                        onChange={(e) => handleInputChange('surname', e.target.value)}
                                        className="w-full px-4 py-4 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-950 text-gray-900"
                                    />
                                </div>
                            </div>
                            {errors.firstName && <p className="text-red-500 text-sm mb-2">{errors.firstName}</p>}
                            {errors.surname && <p className="text-red-500 text-sm mb-2">{errors.surname}</p>}

                            <div className="mb-8"></div>

                            <button
                                onClick={() => handleNext('dob')}
                                className="max-md:w-full lg:w-1/4 mx-auto bg-blue-950 text-white py-3 rounded-full font-semibold hover:bg-blue-900 transition-colors mb-auto"
                            >
                                Next
                            </button>

                            <div className="py-8">
                                <Link href="/auth/find-my-account">
                                <button
                                    className="text-blue-950 hover:underline font-medium"
                                >
                                    Find my account
                                </button>                              
                                </Link>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* Date of Birth Page */}
                {currentPage === 'dob' && (
                    <motion.div
                        key="dob"
                        variants={pageVariants}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        className="flex-1 flex flex-col"
                    >
                        <div className="p-4">
                            <button
                                onClick={() => handleNext('name')}
                                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                            >
                                <ArrowLeft size={24} className="text-gray-900" />
                            </button>
                        </div>

                        <div className="flex-1 px-6 pt-4 flex flex-col">
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
                                    value={formData.dateOfBirth}
                                    onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                                    className="w-full px-4 py-4 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-950 text-gray-700"
                                />
                            </div>
                            {errors.dateOfBirth && <p className="text-red-500 text-sm mb-4">{errors.dateOfBirth}</p>}

                            <div className="mb-4"></div>

                            <button
                                onClick={() => handleNext('email')}
                                className="max-md:w-full lg:w-1/4 mx-auto bg-blue-950 text-white py-3 rounded-full font-semibold hover:bg-blue-900 transition-colors mb-auto"
                            >
                                Next
                            </button>

                            <div className="py-8">
                                <Link href="/auth/find-my-account">
                                <button
                                    className="text-blue-950 hover:underline font-medium"
                                >
                                    Find my account
                                </button>                              
                                </Link>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* Email Page */}
                {currentPage === 'email' && (
                    <motion.div
                        key="email"
                        variants={pageVariants}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        className="flex-1 flex flex-col"
                    >
                        <div className="p-4">
                            <button
                                onClick={() => handleNext('dob')}
                                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                            >
                                <ArrowLeft size={24} className="text-gray-900" />
                            </button>
                        </div>

                        <div className="flex-1 px-6 pt-4 flex flex-col">
                            <h1 className="text-3xl font-bold text-gray-900 mb-2">
                                What's your email?
                            </h1>
                            <p className="text-gray-600 mb-8">
                                Enter your email address. We'll send your PDF books here.
                            </p>

                            <div className="mb-2">
                                <input
                                    type="email"
                                    placeholder="Email address"
                                    value={formData.email}
                                    onChange={(e) => handleInputChange('email', e.target.value)}
                                    className="w-full px-4 py-4 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-950 text-gray-900"
                                />
                            </div>
                            {errors.email && <p className="text-red-500 text-sm mb-4">{errors.email}</p>}

                            <div className="mb-4"></div>

                            <button
                                onClick={() => handleNext('password')}
                                className="max-md:w-full lg:w-1/4 mx-auto bg-blue-950 text-white py-3 rounded-full font-semibold hover:bg-blue-900 transition-colors mb-auto"
                            >
                                Next
                            </button>

                            <div className="py-8">
                                <Link href="/auth/find-my-account">
                                <button
                                    className="text-blue-950 hover:underline font-medium"
                                >
                                    Find my account
                                </button>                              
                                </Link>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* Password Page */}
                {currentPage === 'password' && (
                    <motion.div
                        key="password"
                        variants={pageVariants}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        className="flex-1 flex flex-col"
                    >
                        <div className="p-4">
                            <button
                                onClick={() => handleNext('email')}
                                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                            >
                                <ArrowLeft size={24} className="text-gray-900" />
                            </button>
                        </div>

                        <div className="flex-1 px-6 pt-4 flex flex-col">
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
                                    value={formData.password}
                                    onChange={(e) => handleInputChange('password', e.target.value)}
                                    className="w-full px-4 py-4 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-950 text-gray-900"
                                />
                            </div>
                            {errors.password && <p className="text-red-500 text-sm mb-4">{errors.password}</p>}

                            <div className="mb-4"></div>

                            <button
                                onClick={() => handleNext('confirm')}
                                className="max-md:w-full lg:w-1/4 mx-auto bg-blue-950  text-white py-3 rounded-full font-semibold hover:bg-blue-900 transition-colors mb-auto"
                            >
                                Next
                            </button>

                            <div className="py-8">
                                 <Link href="/auth/find-my-account">
                                <button
                                    className="text-blue-950 hover:underline font-medium"
                                >
                                    Find my account
                                </button>                              
                                </Link>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* Confirmation Page */}
                {currentPage === 'confirm' && (
                    <motion.div
                        key="confirm"
                        variants={pageVariants}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        className="flex-1 flex flex-col"
                    >
                        <div className="p-4">
                            <button
                                onClick={() => handleNext('password')}
                                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                            >
                                <ArrowLeft size={24} className="text-gray-900" />
                            </button>
                        </div>

                        <div className="flex-1 px-6 pt-4 flex flex-col">
                            <h1 className="text-3xl font-bold text-gray-900 mb-2">
                                Confirm your details
                            </h1>
                            <p className="text-gray-600 mb-8">
                                Please review your information before creating your account.
                            </p>

                            <div className="bg-blue-50 border-2 border-blue-950 rounded-2xl p-6 mb-8">
                                <div className="space-y-4">
                                     <button
                                    onClick={() => handleNext('name')}
                                    className="max-md:w-full lg:right-10 mt-6 bg-white lg:w-1/4 border-2 border-blue-950 text-blue-950 py-3 rounded-full font-semibold hover:bg-blue-50 transition-colors"
                                >
                                    Edit Information
                                </button>
                                    <div>
                                        <label className="text-sm text-gray-600 font-medium">Name</label>
                                        <p className="text-lg text-gray-900 font-semibold">
                                            {formData.firstName} {formData.surname}
                                        </p>
                                    </div>
                                    <div>
                                        <label className="text-sm text-gray-600 font-medium">Date of Birth</label>
                                        <p className="text-lg text-gray-900 font-semibold">
                                            {formData.dateOfBirth || 'Not provided'}
                                        </p>
                                    </div>
                                    <div>
                                        <label className="text-sm text-gray-600 font-medium">Email</label>
                                        <p className="text-lg text-gray-900 font-semibold">
                                            {formData.email}
                                        </p>
                                    </div>
                                </div>

                               
                            </div>

                            <p className="text-xs text-gray-600 mb-6 leading-relaxed">
                                By clicking Create Account, you agree to our{' '}
                                <button className="text-blue-950 font-medium hover:underline">Terms</button>,{' '}
                                <button className="text-blue-950 font-medium hover:underline">Privacy Policy</button> and{' '}
                                <button className="text-blue-950 font-medium hover:underline">Cookies Policy</button>.
                            </p>

                            <button
                                onClick={handleSubmit}
                                disabled={loading}
                                className="max-md:w-full lg:w-1/4 mx-auto bg-blue-950 text-white py-3 rounded-full font-semibold hover:bg-blue-900 transition-colors mb-auto disabled:opacity-50"
                            >
                                {loading ? 'Creating Account...' : 'Create Account'}
                            </button>

                            <div className="py-8">
                                <button
                                    onClick={() => handleNext('signin')}
                                    className="text-blue-950 hover:underline font-medium"
                                >
                                    Already have an account? Sign in
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Account Not Found Modal */}
            {showAccountNotFoundModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white rounded-2xl p-6 max-w-md w-full"
                    >
                        <h3 className="text-xl font-bold text-gray-900 mb-3" style={{ fontFamily: 'cursive' }}>
                            We couldn't find your account. Create a new account?
                        </h3>
                        <p className="text-gray-700 mb-6" style={{ fontFamily: 'cursive' }}>
                            It looks like <span className="font-semibold">{notFoundEmail}</span> isn't connected to an account.
                            You can create a new account with this email address or try again.
                        </p>
                        <div className="flex gap-4">
                            <button
                                onClick={() => {
                                    setShowAccountNotFoundModal(false);
                                    setFindAccountEmail('');
                                }}
                                className="flex-1 text-red-500 font-bold py-3 hover:bg-red-50 rounded-lg transition-colors"
                            >
                                TRY AGAIN
                            </button>
                            <button
                                onClick={() => {
                                    setShowAccountNotFoundModal(false);
                                    setFormData(prev => ({ ...prev, email: notFoundEmail }));
                                    handleNext('join');
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