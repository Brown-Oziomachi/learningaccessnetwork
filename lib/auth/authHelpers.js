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

        await setDoc(doc(db, 'users', user.uid), {
            email: user.email,
            displayName: user.displayName,
            photoURL: user.photoURL,
            createdAt: new Date().toISOString()
        }, { merge: true });

        return { success: true, user };
    } catch (error) {
        console.error('Google Sign In Error:', error);
        return { success: false, error };
    }
};

export const handleEmailPasswordSignIn = async (email, password) => {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const userDocRef = doc(db, 'users', userCredential.user.uid);
        const userDoc = await getDoc(userDocRef);

        return {
            success: true,
            user: userCredential.user,
            userData: userDoc.exists() ? userDoc.data() : null
        };
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
            createdAt: new Date().toISOString()
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