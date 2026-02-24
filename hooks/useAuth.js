import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebaseConfig';

const generateAccountNumber = () => {
    const digits = Math.floor(1000000 + Math.random() * 9000000);
    return `LAN${digits}`;
};

const backfillAccountNumber = async (uid) => {
    try {
        const userRef = doc(db, 'users', uid);
        const userDoc = await getDoc(userRef);
        if (userDoc.exists() && !userDoc.data()?.lanAccountNumber) {
            await updateDoc(userRef, {
                lanAccountNumber: generateAccountNumber(),
            });
            console.log('✅ LAN account number assigned');
        }
    } catch (err) {
        console.error('Error backfilling account number:', err);
    }
};

export const useAuth = (redirectIfAuthenticated = false) => {
    const router = useRouter();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            setUser(currentUser);
            setLoading(false);

            if (currentUser) {
                await backfillAccountNumber(currentUser.uid); // ✅ silently backfills
            }

            if (redirectIfAuthenticated && currentUser) {
                router.replace('/home');
            }
        });

        return () => unsubscribe();
    }, [router, redirectIfAuthenticated]);

    return { user, loading };
};