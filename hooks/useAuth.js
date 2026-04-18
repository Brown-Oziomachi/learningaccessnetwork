"use client";
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
            if (!currentUser) {
                setUser(null);
                setLoading(false);
                return;
            }

            // ── Fetch Firestore profile before doing anything ──────────────
            try {
                const userRef = doc(db, 'users', currentUser.uid);
                const userDoc = await getDoc(userRef);

                if (userDoc.exists()) {
                    const userData = userDoc.data();
                    const accountStatus = userData.status || userData.accountStatus || 'active';
                    const isDeactivated = userData.isDeactivated === true;
                    const isSuspended = accountStatus === 'suspended';
                    const isPending = accountStatus === 'pending';

                    // ── Block bad accounts — sign out silently ─────────────
                    if (isDeactivated || isSuspended || isPending) {
                        await auth.signOut();
                        setUser(null);
                        setLoading(false);

                        // Only redirect with reason if we were going to redirect anyway
                        if (redirectIfAuthenticated) {
                            const reason = isDeactivated ? 'deactivated'
                                : isSuspended ? 'suspended'
                                    : 'pending';
                            router.replace(`/auth/signin?reason=${reason}`);
                        }
                        return;
                    }

                    // ── Backfill account number if missing ─────────────────
                    if (!userData.lanAccountNumber) {
                        await updateDoc(userRef, {
                            lanAccountNumber: generateAccountNumber(),
                        });
                    }
                }
            } catch (err) {
                console.error('useAuth: error reading user doc:', err);
            }

            // ── Account is healthy — set user and optionally redirect ──────
            setUser(currentUser);
            setLoading(false);

            if (redirectIfAuthenticated) {
                router.replace('/home');
            }
        });

        return () => unsubscribe();
    }, [router, redirectIfAuthenticated]);

    return { user, loading };
};