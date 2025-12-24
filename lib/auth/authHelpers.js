import {
    signInWithPopup,
    GoogleAuthProvider,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    sendPasswordResetEmail
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebaseConfig';

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
            const accountStatus = userData.accountStatus || 'active';

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
                lastLogin: new Date().toISOString()
            }, { merge: true });
        } else {
            // Create new user document with active status
            await setDoc(userDocRef, {
                email: user.email,
                displayName: user.displayName,
                photoURL: user.photoURL,
                accountStatus: 'active',
                role: 'user',
                createdAt: new Date().toISOString(),
                lastLogin: new Date().toISOString()
            });
        }

        return { success: true, user };
    } catch (error) {
        console.error('Google Sign In Error:', error);
        return { success: false, error };
    }
};

export const handleEmailPasswordSignIn = async (email, password) => {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Check user's account status in Firestore
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
            const userData = userDoc.data();
            const accountStatus = userData.accountStatus || 'active';

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
                lastLogin: new Date().toISOString()
            }, { merge: true });

            return {
                success: true,
                user: user,
                userData: userData
            };
        } else {
            // User document doesn't exist, allow login but create document
            await setDoc(userDocRef, {
                email: user.email,
                accountStatus: 'active',
                role: 'user',
                createdAt: new Date().toISOString(),
                lastLogin: new Date().toISOString()
            });

            return {
                success: true,
                user: user,
                userData: null
            };
        }
    } catch (error) {
        console.error('Login Error:', error);
        return { success: false, error };
    }
};

export const createUserAccount = async (formData) => {
    try {
        const userCredential = await createUserWithEmailAndPassword(
            auth,
            formData.email,
            formData.password
        );

        await setDoc(doc(db, 'users', userCredential.user.uid), {
            firstName: formData.firstName,
            surname: formData.surname,
            displayName: `${formData.firstName} ${formData.surname}`,
            email: formData.email,
            dateOfBirth: formData.dateOfBirth,
            accountStatus: 'active', // Set default status
            role: 'user', // Set default role
            createdAt: new Date().toISOString(),
            lastLogin: new Date().toISOString()
        });

        return { success: true, user: userCredential.user };
    } catch (error) {
        console.error('Account Creation Error:', error);
        return { success: false, error };
    }
};

export const resetPassword = async (email) => {
    try {
        await sendPasswordResetEmail(auth, email);
        return { success: true };
    } catch (error) {
        console.error('Password Reset Error:', error);
        return { success: false, error };
    }
};