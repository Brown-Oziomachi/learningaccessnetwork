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

        // Check if user document exists and get account status
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
            const userData = userDoc.data();
            const accountStatus = userData.status || userData.accountStatus || 'active';

            // Check if account is suspended
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

            // Check if account is pending
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

            // Update existing user document
            await setDoc(userDocRef, {
                email: user.email,
                displayName: user.displayName,
                photoURL: user.photoURL,
                lastLogin: serverTimestamp(),
                updatedAt: serverTimestamp()
            }, { merge: true });

            return { success: true, user, userData };
        } else {
            // Create new user document with active status
            await setDoc(userDocRef, {
                uid: user.uid,
                email: user.email,
                displayName: user.displayName,
                photoURL: user.photoURL,
                status: 'active',
                role: 'student', // Default role
                createdAt: serverTimestamp(),
                lastLogin: serverTimestamp(),
                updatedAt: serverTimestamp(),
                // Default student data
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

        // Check user's account status in Firestore
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
            const userData = userDoc.data();
            const accountStatus = userData.status || userData.accountStatus || 'active';

            // Check if account is suspended
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

            // Check if account is pending
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

            // Update last login
            await setDoc(userDocRef, {
                lastLogin: serverTimestamp(),
                updatedAt: serverTimestamp()
            }, { merge: true });

            return {
                success: true,
                user: user,
                role: userData.role,
                userData: userData
            };
        } else {
            // User document doesn't exist, create it
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
                user: user,
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
 */
export async function createUserAccount(formData) {
    try {
        const { firstName, surname, dateOfBirth, email, password, role = 'student' } = formData;

        // Create Firebase Auth user
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Create user document in Firestore with role
        await setDoc(doc(db, 'users', user.uid), {
            uid: user.uid,
            firstName,
            surname,
            fullName: `${firstName} ${surname}`,
            displayName: `${firstName} ${surname}`,
            dateOfBirth,
            email: email.toLowerCase(),
            role, // 'student' or 'seller'
            status: 'active', // active, suspended, pending
            accountStatus: 'active', // Backward compatibility
            createdAt: serverTimestamp(),
            lastLogin: serverTimestamp(),
            updatedAt: serverTimestamp(),
            
            // Role-specific data
            ...(role === 'student' && {
                library: [],
                orders: [],
                wishlist: []
            }),
            
            ...(role === 'seller' && {
                products: [],
                totalSales: 0,
                totalRevenue: 0,
                rating: 0,
                reviewCount: 0
            })
        });

        return { success: true, user, role };
    } catch (error) {
        console.error('Error creating account:', error);
        return { success: false, error };
    }
}

/**
 * Sign in user and get their role (alias for handleEmailPasswordSignIn)
 */
export async function signInUser(email, password) {
    return await handleEmailPasswordSignIn(email, password);
}

/**
 * Update user role (for switching between student and seller)
 */
export async function updateUserRole(userId, newRole) {
    try {
        const userRef = doc(db, 'users', userId);
        const userDoc = await getDoc(userRef);

        if (!userDoc.exists()) {
            throw new Error('User not found');
        }

        const userData = userDoc.data();
        const currentRole = userData.role;

        // Prepare role-specific data
        const roleData = {};
        
        if (newRole === 'seller' && currentRole === 'student') {
            // Initialize seller data
            roleData.products = [];
            roleData.totalSales = 0;
            roleData.totalRevenue = 0;
            roleData.rating = 0;
            roleData.reviewCount = 0;
        } else if (newRole === 'student' && currentRole === 'seller') {
            // Initialize student data if switching back
            roleData.library = roleData.library || [];
            roleData.orders = roleData.orders || [];
            roleData.wishlist = roleData.wishlist || [];
        }

        // Update role in Firestore
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
        
        if (!userDoc.exists()) {
            throw new Error('User not found');
        }

        return { 
            success: true, 
            userData: userDoc.data() 
        };
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
        // Get the current origin (works in browser only)
        const origin = typeof window !== 'undefined'
            ? window.location.origin
            : process.env.NEXT_PUBLIC_APP_URL || 'https://yourdomain.com';

        // Configure action code settings to redirect back to your app
        const actionCodeSettings = {
            // URL to redirect back to after password reset
            url: `${origin}/auth/signin?passwordReset=success`,
            handleCodeInApp: false, // Firebase handles the reset on their page, then redirects
        };

        await sendPasswordResetEmail(auth, email, actionCodeSettings);
        return { success: true };
    } catch (error) {
        console.error('Password Reset Error:', error);
        return { success: false, error };
    }
};