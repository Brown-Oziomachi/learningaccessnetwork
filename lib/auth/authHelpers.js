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
            // New Google user creation
            const lanAccountNumber = generateUniqueAccountNumber();
            const newUserData = {
                uid: user.uid,
                email: user.email,
                displayName: user.displayName,
                photoURL: user.photoURL,
                lanAccountNumber,
                accountBalance: 0,
                status: 'active',
                accountStatus: 'active',
                isDeactivated: false,
                role: 'student', // Force baseline client tier
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
 * Create a new user account with role-based functionality & Referral logging
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

        const staffIdUrl = getFieldWithFallback(formData, 'staffIdUrl');
        const appointmentLetterUrl = getFieldWithFallback(formData, 'appointmentLetterUrl');
        const facultyProfileUrl = getFieldWithFallback(formData, 'facultyProfileUrl');
        const lecturerTitle = getFieldWithFallback(formData, 'lecturerTitle');
        const institution = getFieldWithFallback(formData, 'institution');
        const department = getFieldWithFallback(formData, 'department');
        const institutionSlug = getFieldWithFallback(formData, 'institutionSlug');
        const selectedUniversity = getFieldWithFallback(formData, 'selectedUniversity');

        // ✅ STEP 1: Create Firebase Auth user
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        await user.getIdToken(true);

        let resolvedReferrerId = null;
        if (referredBy && referredBy !== user.uid) {
            resolvedReferrerId = await resolveReferralCode(referredBy);
            if (!resolvedReferrerId && referredBy.length > 12) {
                resolvedReferrerId = referredBy;
            }
        }

        const lanAccountNumber = generateUniqueAccountNumber();
        const myReferralCode = generateShortCode(user.uid);

        // Safety Override: Block frontend inputs from declaring 'admin' tier accounts
        const allowedRoles = ['student', 'seller', 'lecturer'];
        const validatedRole = allowedRoles.includes(rawRole) ? rawRole : 'student';
        const storedRole = validatedRole === 'lecturer' ? 'seller' : validatedRole;
        const isLecturerRole = validatedRole === 'lecturer';

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
            accountStatus: 'active', // Strictly enforced default
            isDeactivated: false,
            lanAccountNumber,
            accountBalance: 0,
            referralCode: myReferralCode,
            createdAt: serverTimestamp(),
            lastLogin: serverTimestamp(),
            updatedAt: serverTimestamp(),
            referredBy: resolvedReferrerId ?? null,

            ...(storedRole === 'student' ? {
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

            ...(isLecturerRole ? {
                isLecturer: false,             // Strictly false until admin manual verification
                isSeller: false,
                isVerifiedFaculty: false,
                lecturerVerificationStatus: 'pending',
                verificationStatus: 'pending',
                staffIdUrl: staffIdUrl || null,
                appointmentLetterUrl: appointmentLetterUrl || null,
                facultyProfileUrl: facultyProfileUrl || null,
                lecturerTitle: lecturerTitle || null,
                title: lecturerTitle || null,
                institution: institution || null,
                department: department || null,
                institutionSlug: institutionSlug || null,
                selectedUniversity: selectedUniversity || null,
                submittedForVerification: serverTimestamp(),
            } : {}),
        };

        // ✅ STEP 2: Write user document
        const cleanProfile = Object.fromEntries(
            Object.entries(userProfile).filter(([_, v]) => v !== undefined)
        );
        await setDoc(doc(db, 'users', user.uid), cleanProfile);

        // ✅ STEP 3: Write slug to sellers collection if vendor type account
        if (storedRole === 'seller' || isLecturerRole) {
            const slug = [
                isLecturerRole ? (lecturerTitle || '') : '',
                firstName,
                surname,
            ]
                .filter(Boolean)
                .join(' ')
                .trim()
                .toLowerCase()
                .replace(/[^a-z0-9\s-]/g, '')
                .replace(/\s+/g, '-')
                .replace(/-+/g, '-');

            if (slug) {
                await setDoc(
                    doc(db, 'sellers', user.uid),
                    {
                        slug,
                        sellerName: `${firstName} ${surname}`.trim(),
                        uid: user.uid,
                        createdAt: serverTimestamp(),
                    },
                    { merge: true }
                );
            }
        }

        // ✅ STEP 4: Initialize Referral relationship document safely as 'pending'
        if (resolvedReferrerId && resolvedReferrerId !== user.uid) {
            try {
                await setDoc(doc(db, 'referrals', user.uid), {
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
                console.error('Referral document generation failed:', refError);
            }
        }

        // ✅ STEP 5: Send welcome notification inside client environment
        if (storedRole === 'seller' || isLecturerRole) {
            await addDoc(collection(db, 'notifications'), {
                userId: user.uid,
                type: isLecturerRole ? 'faculty_verification_submitted' : 'welcome_seller',
                title: isLecturerRole ? '⏳ Verification Submitted' : '🛒 Welcome to LAN Library!',
                message: isLecturerRole
                    ? `Hi ${firstName}! Your faculty credentials have been submitted for review.`
                    : `Hi ${firstName}! Your seller account is ready.`,
                link: '/my-account/seller-account',
                createdAt: serverTimestamp(),
                read: false,
                buyerEmail: ""
            });
        }

        // ✅ STEP 6: Clear local browser sessionStorage
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

export async function signInUser(email, password) {
    return await handleEmailPasswordSignIn(email, password);
}

export async function updateUserRole(userId, newRole) {
    try {
        const userRef = doc(db, 'users', userId);
        const allowedRoles = ['student', 'seller'];
        const validatedRole = allowedRoles.includes(newRole) ? newRole : 'student';

        const roleData = validatedRole === 'seller'
            ? { products: [], totalSales: 0, totalRevenue: 0, rating: 0, reviewCount: 0 }
            : { library: [], orders: [], wishlist: [] };

        await updateDoc(userRef, {
            role: validatedRole,
            ...roleData,
            updatedAt: serverTimestamp()
        });

        return { success: true, newRole: validatedRole };
    } catch (error) {
        console.error('Error updating role:', error);
        return { success: false, error };
    }
}

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

export const resetPassword = async (email) => {
    try {
        const origin = typeof window !== 'undefined' ? window.location.origin : 'https://learningaccessnetwork.com';
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

// ── Validation Utility Implementations ────────────────────────────────────
export const validateEmail = async (email) => {
    const errors = {};
    if (!email) {
        errors.email = 'Email is required';
        return { isValid: false, errors };
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        errors.email = 'Please enter a valid email address';
        return { isValid: false, errors };
    }

    const emailDomain = email.toLowerCase().split('@')[1] || '';
    const GMAIL_DOMAINS = ['gmail.com', 'googlemail.com'];
    const ACADEMIC_PATTERNS = [
        /\.edu$/,
        /\.edu\.[a-z]{2}$/,
        /\.ac\.[a-z]{2}$/,
        /\.ac\.ng$/,
    ];

    const isGmail = GMAIL_DOMAINS.includes(emailDomain);
    const isAcademic = ACADEMIC_PATTERNS.some(pattern => pattern.test(emailDomain));

    if (!isGmail && !isAcademic) {
        errors.email = 'Please use a Gmail address or a valid university email (e.g. name@unilag.edu.ng)';
        return { isValid: false, errors };
    }

    try {
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('email', '==', email.toLowerCase()));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
            const userDoc = querySnapshot.docs[0];
            const userData = userDoc.data();
            const accountStatus = userData.accountStatus || 'active';

            if (accountStatus === 'suspended') {
                errors.email = 'This account has been suspended. Please contact support at support@lanlibrary.com';
                return { isValid: false, errors, accountStatus: 'suspended' };
            }

            if (accountStatus === 'pending') {
                errors.email = 'This account is under review. Please contact support at support@lanlibrary.com';
                return { isValid: false, errors, accountStatus: 'pending' };
            }

            errors.email = 'An account with this email already exists. Please sign in instead.';
            return { isValid: false, errors, accountExists: true };
        }
    } catch (error) {
        console.error('Error checking email:', error);
    }

    return { isValid: true, errors: {} };
};

export const validatePassword = (password, confirmPassword) => {
    const errors = {};
    if (!password) {
        errors.password = 'Password is required';
    } else if (password.length < 6) {
        errors.password = 'Password must be at least 6 characters';
    }
    if (confirmPassword !== undefined && password !== confirmPassword) {
        errors.confirmPassword = 'Passwords do not match';
    }
    return { isValid: Object.keys(errors).length === 0, errors };
};

export const validateName = (name, fieldName = 'Name') => {
    const errors = {};
    if (!name || name.trim().length === 0) {
        errors[fieldName.toLowerCase()] = `${fieldName} is required`;
    } else if (name.trim().length < 2) {
        errors[fieldName.toLowerCase()] = `${fieldName} must be at least 2 characters`;
    } else if (!/^[a-zA-Z\s'-]+$/.test(name)) {
        errors[fieldName.toLowerCase()] = `${fieldName} can only contain letters, spaces, hyphens, and apostrophes`;
    }
    return { isValid: Object.keys(errors).length === 0, errors };
};

export const validateDateOfBirth = (dateOfBirth) => {
    const errors = {};
    if (!dateOfBirth) {
        errors.dateOfBirth = 'Date of birth is required';
        return { isValid: false, errors };
    }

    const birthDate = new Date(dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    if (age < 13) {
        errors.dateOfBirth = 'You must be at least 13 years old to create an account';
    }
    if (age > 120) {
        errors.dateOfBirth = 'Please enter a valid date of birth';
    }
    return { isValid: Object.keys(errors).length === 0, errors };
};