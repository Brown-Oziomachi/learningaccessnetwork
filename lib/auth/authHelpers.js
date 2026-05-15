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
    increment,
    query,
    where,
    getDocs,        
} from 'firebase/firestore';
import { auth, db } from '@/lib/firebaseConfig';

// ── Generate Unique LAN Bank account number ───────────────────────────────
const generateUniqueAccountNumber = () => {
    const digits = Math.floor(1000000 + Math.random() * 9000000);
    return `LAN${digits}`;
};

// ── Generate short referral code from UID ────────────────────────────────
export const generateShortCode = (uid) => {
    if (!uid) return '';
    const letters = uid.replace(/[^a-zA-Z]/g, '').slice(0, 5).toLowerCase();
    const numbers = uid.replace(/[^0-9]/g, '').slice(0, 6).padEnd(6, '0');
    return `${letters}${numbers}`;
};

// ── Helper: read a field from formData, falling back to sessionStorage ───
// Used to recover Cloudinary URLs that the confirm page may have dropped
const getFieldWithFallback = (formData, formKey, storageKey) => {
    const fromForm = formData[formKey];
    if (fromForm && fromForm !== 'null' && fromForm !== 'undefined' && fromForm !== '') {
        return fromForm;
    }
    if (typeof window !== 'undefined') {
        const fromStorage = sessionStorage.getItem(storageKey || formKey);
        if (fromStorage && fromStorage !== 'null' && fromStorage !== 'undefined' && fromStorage !== '') {
            return fromStorage;
        }
    }
    return null;
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
            const lanAccountNumber = generateUniqueAccountNumber();
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
 * Resolve a shortCode back to the referrer's real UID.
 */
export const resolveReferralCode = async (shortCode) => {
    if (!shortCode) return null;
    try {
        const q = query(collection(db, 'users'), where('referralCode', '==', shortCode));
        const snap = await getDocs(q);
        if (snap.empty) return null;
        return snap.docs[0].data().uid;
    } catch (err) {
        console.error('resolveReferralCode error:', err);
        return null;
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
            role: rawRole = 'student',
            referredBy = null,
            country = '',
            studentSubRole = null,
            studyLevel = null,
            fieldOfStudy = null,
        } = formData;

        // ── Recover document URLs & lecturer fields from sessionStorage if the
        //    confirm page dropped them from the URL params ──────────────────────
        const staffIdUrl           = getFieldWithFallback(formData, 'staffIdUrl');
        const appointmentLetterUrl = getFieldWithFallback(formData, 'appointmentLetterUrl');
        const facultyProfileUrl    = getFieldWithFallback(formData, 'facultyProfileUrl');
        const lecturerTitle        = getFieldWithFallback(formData, 'lecturerTitle');
        const institution          = getFieldWithFallback(formData, 'institution');
        const department           = getFieldWithFallback(formData, 'department');
        const institutionSlug      = getFieldWithFallback(formData, 'institutionSlug');
        const selectedUniversity   = getFieldWithFallback(formData, 'selectedUniversity');

        // Debug — remove after confirming fix works
        console.log('[createUserAccount] document URLs resolved:', {
            staffIdUrl,
            appointmentLetterUrl,
            facultyProfileUrl,
        });

        // ✅ STEP 1: Create Firebase Auth user FIRST
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // ✅ STEP 2: Force token refresh
        await user.getIdToken(true);

        let resolvedReferrerId = null;
        if (referredBy && referredBy !== user.uid) {
            resolvedReferrerId = await resolveReferralCode(referredBy);
            if (!resolvedReferrerId && referredBy.length > 12) {
                resolvedReferrerId = referredBy; // fallback: was already a real UID
            }
        }

        // ✅ STEP 3: Generate account number
        const lanAccountNumber = generateUniqueAccountNumber();

        // ✅ STEP 4: Generate this user's own shortCode for their referral link
        const myReferralCode = generateShortCode(user.uid);
        const storedRole = rawRole === 'lecturer' ? 'seller' : rawRole;
        const isLecturerRole = rawRole === 'lecturer';

        const userProfile = {
            uid: user.uid,
            firstName,
            surname,
            fullName: `${firstName} ${surname}`,
            displayName: `${firstName} ${surname}`,
            dateOfBirth,
            email: email.toLowerCase(),
            role: storedRole,
            country,
            status: 'active',
            accountStatus: 'active',
            isDeactivated: false,
            lanAccountNumber,
            accountBalance: 0,
            referralCode: myReferralCode,
            createdAt: serverTimestamp(),
            lastLogin: serverTimestamp(),
            updatedAt: serverTimestamp(),
            referredBy: resolvedReferrerId ?? null,

            ...(rawRole === 'student' ? {
                library: [],
                orders: [],
                wishlist: [],
                studentSubRole,
                studyLevel,
                fieldOfStudy,
                institution,
            } : {}),

            ...(storedRole === 'seller' && !isLecturerRole ? {
                products: [],
                totalSales: 0,
                totalRevenue: 0,
                rating: 0,
                reviewCount: 0,
            } : {}),

            // ── Lecturer / Faculty fields ──────────────────────────────────────
            ...(isLecturerRole ? {
                isLecturer: false,             // blocked until admin approves
                isSeller: false,               // blocked until admin approves
                isVerifiedFaculty: false,
                lecturerVerificationStatus: 'pending',
                verificationStatus: 'pending',
                // These four are resolved above with sessionStorage fallback
                staffIdUrl:           staffIdUrl           || null,
                appointmentLetterUrl: appointmentLetterUrl || null,
                facultyProfileUrl:    facultyProfileUrl    || null,
                lecturerTitle:        lecturerTitle        || null,
                title:                lecturerTitle        || null,
                institution:          institution          || null,
                department:           department           || null,
                institutionSlug:      institutionSlug      || null,
                selectedUniversity:   selectedUniversity   || null,
                submittedForVerification: serverTimestamp(),
            } : {}),
        };

        // ✅ STEP 5: Send welcome / verification notification
        if (storedRole === 'seller' || isLecturerRole) {
            await addDoc(collection(db, 'notifications'), {
                userId: user.uid,
                type: isLecturerRole ? 'faculty_verification_submitted' : 'welcome_seller',
                title: isLecturerRole
                    ? '⏳ Verification Submitted'
                    : '🛒 Welcome to LAN Library, Seller!',
                message: isLecturerRole
                    ? `Hi ${firstName}! Your faculty credentials have been submitted for review. You'll be notified within 24–48 hours once approved.`
                    : `Hi ${firstName}! Your seller account is ready. Start uploading documents and earn 80% on every sale.`,
                link: '/my-account/seller-account',
                createdAt: serverTimestamp(),
                read: false,
            });
        }

        // ✅ STEP 6: Write user document (strip undefined values)
        const cleanProfile = Object.fromEntries(
            Object.entries(userProfile).filter(([_, v]) => v !== undefined)
        );
        await setDoc(doc(db, 'users', user.uid), cleanProfile);

        // ✅ STEP 7: Handle Referral
        if (resolvedReferrerId && resolvedReferrerId !== user.uid) {
            try {
                await addDoc(collection(db, 'referrals'), {
                    referrerId: resolvedReferrerId,
                    referredUserId: user.uid,
                    referredUserName: `${firstName} ${surname}`,
                    reward: 500,
                    status: 'pending',
                    claimed: false,
                    qualifiedAt: null,
                    createdAt: serverTimestamp()
                });
            } catch (refError) {
                console.error('Referral background process failed:', refError);
            }
        }

        // ✅ STEP 8: Clear sessionStorage doc-URL keys so they don't bleed into
        //            the next registration attempt on the same browser
        if (typeof window !== 'undefined') {
            [
                'staffIdUrl', 'appointmentLetterUrl', 'facultyProfileUrl',
                'lecturerTitle', 'institution', 'department',
                'institutionSlug', 'selectedUniversity',
            ].forEach(k => sessionStorage.removeItem(k));
        }

        return { success: true, user, uid: user.uid, role: storedRole };
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
            ...(studyLevel     !== undefined && { studyLevel }),
            ...(fieldOfStudy   !== undefined && { fieldOfStudy }),
            ...(institution    !== undefined && { institution }),
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
 * Qualify a referral when the referred user makes their first purchase.
 */
export const qualifyReferral = async (purchaserId, purchaseAmount) => {
    if (purchaseAmount < 1000) return;
    try {
        const snap = await getDocs(
            query(
                collection(db, 'referrals'),
                where('referredUserId', '==', purchaserId),
                where('status', '==', 'pending')
            )
        );
        if (snap.empty) return;

        const referralDoc = snap.docs[0];
        const referral = referralDoc.data();

        const createdAt = referral.createdAt?.toDate?.() || new Date();
        const daysSinceSignup = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24);
        if (daysSinceSignup > 30) {
            await updateDoc(referralDoc.ref, { status: 'expired' });
            return;
        }

        await updateDoc(referralDoc.ref, {
            status: 'completed',
            qualifiedAt: serverTimestamp(),
        });

        const referrerRef = doc(db, 'users', referral.referrerId);
        await updateDoc(referrerRef, {
            accountBalance: increment(referral.reward || 500),
            updatedAt: serverTimestamp(),
        });

        await addDoc(collection(db, 'notifications'), {
            userId: referral.referrerId,
            type: 'referral_bonus',
            title: 'Referral Bonus Unlocked! 🎉',
            message: `${referral.referredUserName} just made their first purchase. ₦${referral.reward || 500} added to your wallet!`,
            link: '/referral',
            createdAt: serverTimestamp(),
            read: false,
        });

    } catch (err) {
        console.error('qualifyReferral error:', err);
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
            ...(existing.library  ? {} : { library:  [] }),
            ...(existing.orders   ? {} : { orders:   [] }),
            ...(existing.wishlist ? {} : { wishlist: [] }),
            ...(academicProfile.studentSubRole && { studentSubRole: academicProfile.studentSubRole }),
            ...(academicProfile.studyLevel     && { studyLevel:     academicProfile.studyLevel }),
            ...(academicProfile.fieldOfStudy   && { fieldOfStudy:   academicProfile.fieldOfStudy }),
            ...(academicProfile.institution    && { institution:    academicProfile.institution }),
            updatedAt: serverTimestamp(),
        });

        return { success: true };
    } catch (error) {
        console.error('Error adding student role:', error);
        return { success: false, error };
    }
}