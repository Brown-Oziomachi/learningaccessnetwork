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

// ── Generate Unique LAN Bank account number ───────────────────────────────
// ✅ No longer queries Firestore — just generates a random number
// Collision chance is negligible (1 in 9 million), acceptable for account numbers
const generateUniqueAccountNumber = () => {
    const digits = Math.floor(1000000 + Math.random() * 9000000);
    return `LAN${digits}`;
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
            // New Google user
            const lanAccountNumber = generateUniqueAccountNumber(); // ✅ no Firestore query
            const newUserData = {
                uid: user.uid,
                email: user.email,
                displayName: user.displayName,
                photoURL: user.photoURL,
                lanAccountNumber,
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
            studentSubRole = null,
            studyLevel = null,
            fieldOfStudy = null,
            institution = null,
        } = formData;

        // ✅ STEP 1: Create Firebase Auth user FIRST
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // ✅ STEP 2: Force token refresh so auth is fully ready for Firestore writes
        await user.getIdToken(true);

        // ✅ STEP 3: Generate account number — no Firestore query needed
        const lanAccountNumber = generateUniqueAccountNumber();

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
            lanAccountNumber,
            accountBalance: 0,
            referralCode: user.uid.slice(0, 8).toUpperCase(),
            createdAt: serverTimestamp(),
            lastLogin: serverTimestamp(),
            updatedAt: serverTimestamp(),
            referredBy: (referredBy && referredBy !== user.uid) ? referredBy : null,

            ...(role === 'student' ? {
                library: [],
                orders: [],
                wishlist: [],
                studentSubRole,
                studyLevel,
                fieldOfStudy,
                institution,
            } : {}),

            ...(role === 'seller' ? {
                products: [],
                totalSales: 0,
                totalRevenue: 0,
                rating: 0,
                reviewCount: 0,
            } : {}),
        };

        // ✅ STEP 4: Create user document — auth token is now ready
        await setDoc(doc(db, 'users', user.uid), userProfile);

        // ✅ STEP 5: Handle Referral Rewards (₦500)
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
                // Non-critical — account is already created, don't fail the signup
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
 * Update student academic profile fields on an existing user.
 */
export async function updateStudentProfile(userId, { studentSubRole, studyLevel, fieldOfStudy, institution }) {
    try {
        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, {
            ...(studentSubRole !== undefined && { studentSubRole }),
            ...(studyLevel !== undefined && { studyLevel }),
            ...(fieldOfStudy !== undefined && { fieldOfStudy }),
            ...(institution !== undefined && { institution }),
            updatedAt: serverTimestamp(),
        });
        return { success: true };
    } catch (error) {
        console.error('Error updating student profile:', error);
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

/**
 * Add student role to an existing seller account.
 */
export async function addStudentRoleToExistingUser(uid, academicProfile = {}) {
    try {
        const userRef = doc(db, 'users', uid);
        const userDoc = await getDoc(userRef);

        if (!userDoc.exists()) {
            return { success: false, error: { message: 'User not found' } };
        }

        const existing = userDoc.data();

        await updateDoc(userRef, {
            isSeller: existing.isSeller ?? true,
            isStudent: true,
            role: 'student',
            ...(existing.library ? {} : { library: [] }),
            ...(existing.orders ? {} : { orders: [] }),
            ...(existing.wishlist ? {} : { wishlist: [] }),
            ...(academicProfile.studentSubRole && { studentSubRole: academicProfile.studentSubRole }),
            ...(academicProfile.studyLevel && { studyLevel: academicProfile.studyLevel }),
            ...(academicProfile.fieldOfStudy && { fieldOfStudy: academicProfile.fieldOfStudy }),
            ...(academicProfile.institution && { institution: academicProfile.institution }),
            updatedAt: serverTimestamp(),
        });

        return { success: true };
    } catch (error) {
        console.error('Error adding student role:', error);
        return { success: false, error };
    }
}