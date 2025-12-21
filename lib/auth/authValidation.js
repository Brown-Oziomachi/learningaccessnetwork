export const validateName = (firstName, surname) => {
    const errors = {};
    
    if (!firstName?.trim()) {
        errors.firstName = 'First name is required';
    }
    if (!surname?.trim()) {
        errors.surname = 'Surname is required';
    }
    
    return { isValid: Object.keys(errors).length === 0, errors };
};

export const validateDOB = (dateOfBirth) => {
    if (!dateOfBirth) {
        return { isValid: false, errors: { dateOfBirth: 'Date of birth is required' } };
    }
    
    // Check if user is at least 13 years old
    const birthDate = new Date(dateOfBirth);
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    
    if (age < 13) {
        return { isValid: false, errors: { dateOfBirth: 'You must be at least 13 years old' } };
    }
    
    return { isValid: true, errors: {} };
};

export const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (!email?.trim()) {
        return { isValid: false, errors: { email: 'Email is required' } };
    }
    if (!emailRegex.test(email)) {
        return { isValid: false, errors: { email: 'Please enter a valid email' } };
    }
    
    return { isValid: true, errors: {} };
};

export const validatePassword = (password) => {
    if (!password || password.length < 6) {
        return { 
            isValid: false, 
            errors: { password: 'Password must be at least 6 characters' } 
        };
    }
    
    return { isValid: true, errors: {} };
};
