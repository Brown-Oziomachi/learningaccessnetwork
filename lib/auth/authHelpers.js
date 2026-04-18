"use client"
// lib/auth/authHelpers.js

import {
    signInWithPopup,
    GoogleAuthProvider,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    sendPasswordResetEmail
} from 'firebase/auth';
import {
    doc,
    setDoc,
    getDoc,
    updateDoc,
    serverTimestamp,
    collection,
    addDoc,
    increment
} from 'firebase/firestore';
import { auth, db } from '@/lib/firebaseConfig';

// ── Helper to check if account number exists ──────────────────────────────
const isAccountNumberUnique = async (accountNumber) => {
    const { query, collection, where, getDocs, limit } = await import('firebase/firestore');
    const q = query(
        collection(db, 'users'),
        where('lanAccountNumber', '==', accountNumber),
        limit(1)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.empty;
};

// ── Generate Unique LAN Bank account number ───────────────────────────────
const generateUniqueAccountNumber = async () => {
    let accountNumber;
    let isUnique = false;
    let attempts = 0;

    while (!isUnique && attempts < 5) {
        const digits = Math.floor(1000000 + Math.random() * 9000000);
        accountNumber = `LAN${digits}`;
        isUnique = await isAccountNumberUnique(accountNumber);
        attempts++;
    }
    return accountNumber;
};

/**
 * Handle Google Sign In
 */
export const handleGoogleSignIn = async () => {
    try {
        const provider = new GoogleAuthProvider();
        const result = await signInWithPopup(auth, provider);
        const user = result.user;

        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
            const userData = userDoc.data();
            const accountStatus = userData.status || userData.accountStatus || 'active';

            // ── Block deactivated accounts ──
            if (userData.isDeactivated === true) {
                await auth.signOut();
                return {
                    success: false,
                    error: {
                        code: 'auth/account-deactivated',
                        message: 'This account has been deactivated. Contact support to restore access.'
                    }
                };
            }

            if (accountStatus === 'suspended' || accountStatus === 'pending') {
                await auth.signOut();
                return {
                    success: false,
                    error: {
                        code: `auth/account-${accountStatus}`,
                        message: `Your account is ${accountStatus}. Please contact support.`
                    }
                };
            }

            await setDoc(userDocRef, {
                lastLogin: serverTimestamp(),
                updatedAt: serverTimestamp()
            }, { merge: true });

            return { success: true, user, userData };
        } else {
            // New Google user — generate unique LAN account
            const lanAccountNumber = await generateUniqueAccountNumber();
            const newUserData = {
                uid: user.uid,
                email: user.email,
                displayName: user.displayName,
                photoURL: user.photoURL,
                lanAccountNumber: lanAccountNumber,
                accountBalance: 0,
                status: 'active',
                role: 'student',
                createdAt: serverTimestamp(),
                lastLogin: serverTimestamp(),
                updatedAt: serverTimestamp(),
                library: [],
                orders: [],
                wishlist: []
            };

            await setDoc(userDocRef, newUserData);
            return { success: true, user, userData: newUserData };
        }
    } catch (error) {
        console.error('Google Sign In Error:', error);
        return { success: false, error };
    }
};

/**
 * Handle Email/Password Sign In
 */
export const handleEmailPasswordSignIn = async (email, password) => {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
            const userData = userDoc.data();
            const accountStatus = userData.status || userData.accountStatus || 'active';

            // ── Block deactivated accounts ──
            if (userData.isDeactivated === true) {
                await auth.signOut();
                return {
                    success: false,
                    error: {
                        code: 'auth/account-deactivated',
                        message: 'This account has been deactivated. Contact support to restore access.'
                    }
                };
            }

            if (accountStatus === 'suspended' || accountStatus === 'pending') {
                await auth.signOut();
                return {
                    success: false,
                    error: {
                        code: `auth/account-${accountStatus}`,
                        message: `Your account is ${accountStatus}.`
                    }
                };
            }

            await updateDoc(userDocRef, {
                lastLogin: serverTimestamp(),
                updatedAt: serverTimestamp()
            });

            return { success: true, user, role: userData.role, userData };
        }

        return { success: false, error: { message: 'User data not found.' } };
    } catch (error) {
        console.error('Login Error:', error);
        return { success: false, error };
    }
};

/**
 * Create a new user account with role-based functionality & Referral logic
 */
export async function createUserAccount(formData) {
    try {
        const {
            firstName,
            surname,
            dateOfBirth,
            email,
            password,
            role = 'student',
            referredBy = null,
            country = '',
        } = formData;

        const lanAccountNumber = await generateUniqueAccountNumber();
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        const userProfile = {
            uid: user.uid,
            firstName,
            surname,
            fullName: `${firstName} ${surname}`,
            displayName: `${firstName} ${surname}`,
            dateOfBirth,
            email: email.toLowerCase(),
            role,
            country,
            status: 'active',
            accountStatus: 'active',
            isDeactivated: false,
            lanAccountNumber: lanAccountNumber,
            accountBalance: 0,
            referralCode: user.uid.slice(0, 8).toUpperCase(),
            createdAt: serverTimestamp(),
            lastLogin: serverTimestamp(),
            updatedAt: serverTimestamp(),
            referredBy: (referredBy && referredBy !== user.uid) ? referredBy : null,
            ...(role === 'student' ? { library: [], orders: [], wishlist: [] } : {}),
            ...(role === 'seller' ? { products: [], totalSales: 0, totalRevenue: 0, rating: 0, reviewCount: 0 } : {}),
        };

        // 1. Create the New User Document
        await setDoc(doc(db, 'users', user.uid), userProfile);

        // 2. Handle Referral Rewards (₦500)
        if (referredBy && referredBy !== user.uid) {
            try {
                await addDoc(collection(db, 'referrals'), {
                    referrerId: referredBy,
                    referredUserId: user.uid,
                    referredUserName: `${firstName} ${surname}`,
                    reward: 500,
                    status: 'completed',
                    createdAt: serverTimestamp()
                });

                const referrerRef = doc(db, 'users', referredBy);
                await updateDoc(referrerRef, {
                    accountBalance: increment(500),
                    updatedAt: serverTimestamp()
                });

                await addDoc(collection(db, 'notifications'), {
                    userId: referredBy,
                    type: 'referral_bonus',
                    title: 'Referral Bonus! 🎉',
                    message: `${firstName} joined via your link. ₦500 added to your wallet!`,
                    link: '/dashboard/wallet',
                    createdAt: serverTimestamp(),
                    read: false,
                });

            } catch (refError) {
                console.error('Referral background process failed:', refError);
            }
        }

        return { success: true, user, uid: user.uid, role };
    } catch (error) {
        console.error('Error creating account:', error);
        return { success: false, error };
    }
}

/**
 * Sign in user alias
 */
export async function signInUser(email, password) {
    return await handleEmailPasswordSignIn(email, password);
}

/**
 * Update user role
 */
export async function updateUserRole(userId, newRole) {
    try {
        const userRef = doc(db, 'users', userId);
        const roleData = newRole === 'seller'
            ? { products: [], totalSales: 0, totalRevenue: 0, rating: 0, reviewCount: 0 }
            : { library: [], orders: [], wishlist: [] };

        await updateDoc(userRef, {
            role: newRole,
            ...roleData,
            updatedAt: serverTimestamp()
        });

        return { success: true, newRole };
    } catch (error) {
        console.error('Error updating role:', error);
        return { success: false, error };
    }
}

/**
 * Get user data
 */
export async function getUserData(userId) {
    try {
        const userDoc = await getDoc(doc(db, 'users', userId));
        if (!userDoc.exists()) throw new Error('User not found');
        return { success: true, userData: userDoc.data() };
    } catch (error) {
        console.error('Error getting user data:', error);
        return { success: false, error };
    }
}

/**
 * Send password reset email
 */
export const resetPassword = async (email) => {
    try {
        const origin = typeof window !== 'undefined' ? window.location.origin : 'https://yourdomain.com';
        const actionCodeSettings = {
            url: `${origin}/auth/signin?passwordReset=success`,
            handleCodeInApp: false,
        };
        await sendPasswordResetEmail(auth, email, actionCodeSettings);
        return { success: true };
    } catch (error) {
        console.error('Password Reset Error:', error);
        return { success: false, error };
    }
};