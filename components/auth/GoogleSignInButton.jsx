'use client';

import { handleGoogleSignIn } from '@/lib/auth/authHelpers';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function GoogleSignInButton() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    const handleClick = async () => {
        setLoading(true);
        const result = await handleGoogleSignIn();
        
        if (result.success) {
            router.push('/home');
        } else {
            alert('Failed to sign in with Google. Please try again.');
            setLoading(false);
        }
    };

    return (
        <button
            onClick={handleClick}
            disabled={loading}
            className="w-full bg-white border-2 border-gray-300 hover:border-gray-400 text-gray-700 font-semibold py-3 rounded-full transition-all flex items-center justify-center gap-3 disabled:opacity-50"
        >
            {loading ? 'Signing in...' : 'Continue with Google'}
        </button>
    );
}