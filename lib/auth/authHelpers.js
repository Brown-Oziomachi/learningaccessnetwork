// lib/auth/authHelpers.js

import {
    signInWithPopup,
    GoogleAuthProvider,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    sendPasswordResetEmail
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebaseConfig';

/**
 * Handle Google Sign In with account status checks
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

            if (accountStatus === 'suspended') {
                await auth.signOut();
                return {
                    success: false,
                    error: {
                        code: 'auth/account-suspended',
                        message: 'Your account has been suspended. Please contact support for assistance.'
                    }
                };
            }

            if (accountStatus === 'pending') {
                await auth.signOut();
                return {
                    success: false,
                    error: {
                        code: 'auth/account-pending',
                        message: 'Your account is under review. Please contact support for assistance.'
                    }
                };
            }

            await setDoc(userDocRef, {
                email: user.email,
                displayName: user.displayName,
                photoURL: user.photoURL,
                lastLogin: serverTimestamp(),
                updatedAt: serverTimestamp()
            }, { merge: true });

            return { success: true, user, userData };
        } else {
            await setDoc(userDocRef, {
                uid: user.uid,
                email: user.email,
                displayName: user.displayName,
                photoURL: user.photoURL,
                status: 'active',
                role: 'student',
                createdAt: serverTimestamp(),
                lastLogin: serverTimestamp(),
                updatedAt: serverTimestamp(),
                library: [],
                orders: [],
                wishlist: []
            });

            const newUserDoc = await getDoc(userDocRef);
            return { success: true, user, userData: newUserDoc.data() };
        }
    } catch (error) {
        console.error('Google Sign In Error:', error);
        return { success: false, error };
    }
};

/**
 * Handle Email/Password Sign In with account status checks
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

            if (accountStatus === 'suspended') {
                await auth.signOut();
                return {
                    success: false,
                    error: {
                        code: 'auth/account-suspended',
                        message: 'Your account has been suspended. Please contact support for assistance.'
                    }
                };
            }

            if (accountStatus === 'pending') {
                await auth.signOut();
                return {
                    success: false,
                    error: {
                        code: 'auth/account-pending',
                        message: 'Your account is under review. Please contact support for assistance.'
                    }
                };
            }

            await setDoc(userDocRef, {
                lastLogin: serverTimestamp(),
                updatedAt: serverTimestamp()
            }, { merge: true });

            return {
                success: true,
                user,
                role: userData.role,
                userData
            };
        } else {
            await setDoc(userDocRef, {
                uid: user.uid,
                email: user.email,
                status: 'active',
                role: 'student',
                createdAt: serverTimestamp(),
                lastLogin: serverTimestamp(),
                updatedAt: serverTimestamp(),
                library: [],
                orders: [],
                wishlist: []
            });

            const newUserDoc = await getDoc(userDocRef);
            return {
                success: true,
                user,
                role: 'student',
                userData: newUserDoc.data()
            };
        }
    } catch (error) {
        console.error('Login Error:', error);
        return { success: false, error };
    }
};

/**
 * Create a new user account with role-based functionality
 * ✅ FIXED: Now saves referredBy to Firestore and returns uid
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
            referredBy = null, // ✅ NEW: who referred this user
        } = formData;

        // Create Firebase Auth user
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // ✅ Build user doc — include referredBy only if it exists and is not the same user
        const userDocData = {
            uid: user.uid,
            firstName,
            surname,
            fullName: `${firstName} ${surname}`,
            displayName: `${firstName} ${surname}`,
            dateOfBirth,
            email: email.toLowerCase(),
            role,
            status: 'active',
            accountStatus: 'active',
            createdAt: serverTimestamp(),
            lastLogin: serverTimestamp(),
            updatedAt: serverTimestamp(),

            // ✅ Save referredBy so payment page can look it up later
            referredBy: (referredBy && referredBy !== user.uid) ? referredBy : null,

            // Role-specific data
            ...(role === 'student' && {
                library: [],
                orders: [],
                wishlist: []
            }),

            ...(role === 'seller' && {
                isSeller: true,
                products: [],
                totalSales: 0,
                totalRevenue: 0,
                rating: 0,
                reviewCount: 0
            })
        };

        await setDoc(doc(db, 'users', user.uid), userDocData);

        // ✅ FIXED: Return uid so ConfirmClient can create the referral doc
        return { success: true, user, uid: user.uid, role };

    } catch (error) {
        console.error('Error creating account:', error);
        return { success: false, error };
    }
}

/**
 * Sign in user and get their role
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
        const userDoc = await getDoc(userRef);

        if (!userDoc.exists()) throw new Error('User not found');

        const userData = userDoc.data();
        const currentRole = userData.role;
        const roleData = {};

        if (newRole === 'seller' && currentRole === 'student') {
            roleData.products = [];
            roleData.totalSales = 0;
            roleData.totalRevenue = 0;
            roleData.rating = 0;
            roleData.reviewCount = 0;
        } else if (newRole === 'student' && currentRole === 'seller') {
            roleData.library = roleData.library || [];
            roleData.orders = roleData.orders || [];
            roleData.wishlist = roleData.wishlist || [];
        }

        await setDoc(userRef, {
            role: newRole,
            ...roleData,
            updatedAt: serverTimestamp()
        }, { merge: true });

        return { success: true, newRole };
    } catch (error) {
        console.error('Error updating role:', error);
        return { success: false, error };
    }
}

/**
 * Get user data including role
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
        const origin = typeof window !== 'undefined'
            ? window.location.origin
            : process.env.NEXT_PUBLIC_APP_URL || 'https://yourdomain.com';

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