import { doc, getDoc, query, collection, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebaseConfig';

export const validateEmail = async (email) => {
    const errors = {};

    // Basic email format validation
    if (!email) {
        errors.email = 'Email is required';
        return { isValid: false, errors };
    }

    // Email format regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        errors.email = 'Please enter a valid email address';
        return { isValid: false, errors };
    }

    // Check if it's a valid Gmail/Google email
    const validDomains = ['gmail.com', 'googlemail.com'];
    const emailDomain = email.toLowerCase().split('@')[1];
    
    if (!validDomains.includes(emailDomain)) {
        errors.email = 'Please use a Gmail address (e.g., yourname@gmail.com)';
        return { isValid: false, errors };
    }

    // Check if email already exists in Firestore
    try {
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('email', '==', email.toLowerCase()));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
            // Email exists - check account status
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

            // Account exists and is active
            errors.email = 'An account with this email already exists. Please sign in instead.';
            return { isValid: false, errors, accountExists: true };
        }
    } catch (error) {
        console.error('Error checking email:', error);
        // Don't block signup if we can't check - let Firebase Auth handle duplicates
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

    return {
        isValid: Object.keys(errors).length === 0,
        errors
    };
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

    return {
        isValid: Object.keys(errors).length === 0,
        errors
    };
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

    return {
        isValid: Object.keys(errors).length === 0,
        errors
    };
};