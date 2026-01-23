
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebaseConfig';

export const useAuth = (redirectIfAuthenticated = false) => {
    const router = useRouter();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            setLoading(false);

            if (redirectIfAuthenticated && currentUser) {
                router.replace('/home');
            }
        });

        return () => unsubscribe();
    }, [router, redirectIfAuthenticated]);

    return { user, loading };
};