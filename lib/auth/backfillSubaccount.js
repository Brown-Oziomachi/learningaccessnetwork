// lib/auth/backfillSubaccount.js

import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebaseConfig';

export async function backfillFlutterwaveSubaccount(uid) {
    console.log('🔍 Backfill running for:', uid);

    const userDoc = await getDoc(doc(db, 'users', uid));
    const userData = userDoc.data();
    console.log('👤 User role:', userData.role, '| isSeller:', userData.isSeller, '| hasSubaccount:', !!userData.flutterwaveSubaccountId);
    try {
        const userDoc = await getDoc(doc(db, 'users', uid));
        if (!userDoc.exists()) return;

        const userData = userDoc.data();

        // Only run for sellers who are missing a subaccount ID
        if (
            (!userData.isSeller && userData.role !== 'seller') ||
            userData.role === 'admin' ||
            userData.flutterwaveSubaccountId
        ) return;        
        // Get bank details from sellers collection
        const sellerDoc = await getDoc(doc(db, 'sellers', uid));
        if (!sellerDoc.exists()) return;

        const sellerData = sellerDoc.data();
        const bank = sellerData.bankDetails;

        if (!bank?.bankCode || !bank?.accountNumber) return;

        const res = await fetch('/api/flutterwave/create-subaccount', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                uid,
                email: userData.email,
                firstName: userData.firstName,
                surname: userData.surname,
                phoneNumber: userData.phoneNumber || '00000000000',
                bankCode: bank.bankCode,
                accountNumber: bank.accountNumber,
                businessName: sellerData.businessInfo?.businessName || `${userData.firstName} ${userData.surname}`,
            }),
        });

        const data = await res.json();

        if (data.success) {
            // Save to both collections
            await updateDoc(doc(db, 'users', uid), {
                flutterwaveSubaccountId: data.subaccount_id,
                updatedAt: serverTimestamp(),
            });
            await updateDoc(doc(db, 'sellers', uid), {
                flutterwaveSubaccountId: data.subaccount_id,
                updatedAt: serverTimestamp(),
            });
            console.log('✅ Subaccount backfilled:', data.subaccount_id);
        }
    } catch (err) {
        console.error('Backfill failed silently:', err);
    }
}