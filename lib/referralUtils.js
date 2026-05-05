// lib/referralUtils.js
import {
    doc,
    updateDoc,
    serverTimestamp,
    collection,
    addDoc,
    query,
    where,
    getDocs,
} from 'firebase/firestore';
import { db } from '@/lib/firebaseConfig';

export const qualifyReferral = async (purchaserId, purchaseAmount) => {
    if (!purchaserId || purchaseAmount < 1000) return;

    try {
        console.log('🎯 qualifyReferral called:', purchaserId, purchaseAmount);

        const snap = await getDocs(
            query(
                collection(db, 'referrals'),
                where('referredUserId', '==', purchaserId),
                where('status', '==', 'pending')
            )
        );

        console.log('📦 Referral docs found:', snap.size);

        if (snap.empty) {
            console.log('ℹ️ No pending referral found for this user');
            return;
        }

        const referralDoc = snap.docs[0];
        const referral = referralDoc.data();

        const createdAt = referral.createdAt?.toDate?.() || new Date();
        const daysSinceSignup = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24);

        if (daysSinceSignup > 30) {
            console.log('⏰ Referral expired — marking as expired');
            await updateDoc(referralDoc.ref, { status: 'expired' });
            return;
        }

        // ✅ Mark referral as completed (wallet credit happens when referrer clicks "Claim")
        await updateDoc(referralDoc.ref, {
            status: 'completed',
            qualifiedAt: serverTimestamp(),
        });
        console.log('✅ Referral marked completed');

        // ✅ Notify referrer to go claim their reward
        await addDoc(collection(db, 'notifications'), {
            userId: referral.referrerId,
            type: 'referral_bonus',
            title: 'Referral Bonus Unlocked! 🎉',
            message: `${referral.referredUserName} just made their first qualifying purchase. You have ₦${referral.reward || 500} ready to claim in your referral dashboard!`,
            link: '/referrals',
            createdAt: serverTimestamp(),
            read: false,
        });
        console.log('🔔 Referrer notified');

    } catch (err) {
        console.error('qualifyReferral error:', err.code, err.message);
        throw err;
    }
};