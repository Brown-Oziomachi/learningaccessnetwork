// lib/referralUtils.js
//
// ─────────────────────────────────────────────────────────────────────────────
// ⚠️  BACKEND-ONLY MODULE — DO NOT IMPORT ON THE CLIENT
//
// This module uses the Firebase Admin SDK and must only run inside:
//   • app/api/webhooks/flutterwave/route.js  ← primary call site
//   • Other trusted server-side Route Handlers or background jobs
//
// It must never be imported by any component, page, or client utility.
// The Admin SDK is not available in the browser bundle and doing so would
// expose your service account credentials.
//
// Call site pattern inside your webhook (after HMAC verification):
//
//   import { qualifyReferral } from '@/lib/referralUtils';
//
//   // Inside your verified webhook handler, after confirming the charge:
//   await qualifyReferral({
//       purchaserId : customer.uid,     // resolved from your users collection
//       purchaseAmount: charge.amount,  // from Flutterwave's verified payload
//       purchaseTxRef : charge.tx_ref,  // for idempotency logging
//   });
// ─────────────────────────────────────────────────────────────────────────────

import { FieldValue } from 'firebase-admin/firestore';
import { adminDb } from './firebase-admin';

// How long a referral stays valid after the referred user signs up.
const REFERRAL_EXPIRY_DAYS = 30;

// Minimum purchase amount (in NGN) that qualifies a referral.
const QUALIFYING_AMOUNT_NGN = 1000;

/**
 * qualifyReferral checks if a completed purchase qualifies for a referral reward, and if so,
 *
 * @param {object} params
 * @param {string} params.purchaserId    — UID of the user who just purchased
 * @param {number} params.purchaseAmount — Verified charge amount in NGN
 * @param {string} [params.purchaseTxRef] — Flutterwave tx_ref for log tracing
 * @returns {Promise<{ outcome: 'completed'|'expired'|'skipped', reason?: string }>}
 */
export const qualifyReferral = async ({
    purchaserId,
    purchaseAmount,
    purchaseTxRef = 'N/A',
}) => {
    // ── Guard: minimum qualifying amount ─────────────────────────────────────
    if (!purchaserId || purchaseAmount < QUALIFYING_AMOUNT_NGN) {
        console.log(
            `[Referral] Skipped — purchaserId: ${purchaserId}, ` +
            `amount: ${purchaseAmount} (min: ${QUALIFYING_AMOUNT_NGN})`
        );
        return { outcome: 'skipped', reason: 'below_minimum_amount' };
    }

    console.log(`[Referral] qualifyReferral called | purchaser: ${purchaserId} | tx: ${purchaseTxRef}`);

    try {
        const referralSnap = await adminDb
            .collection('referrals')
            .where('referredUserId', '==', purchaserId)
            .where('status', '==', 'pending')
            .limit(1)  // We only ever process one pending referral per user
            .get();

        if (referralSnap.empty) {
            console.log(`[Referral] No pending referral found for purchaser: ${purchaserId}`);
            return { outcome: 'skipped', reason: 'no_pending_referral' };
        }

        const referralDocSnap = referralSnap.docs[0];
        const referral = referralDocSnap.data();
        const referralRef = referralDocSnap.ref;

        // ── Check referral age against expiry threshold ─────────────────────
        const createdAt = referral.createdAt?.toDate?.() ?? new Date(0);
        const serverNow = new Date(); // Server clock — not client-supplied
        const ageInDays = (serverNow.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24);

        if (ageInDays > REFERRAL_EXPIRY_DAYS) {
            console.log(
                `[Referral] Expired — age: ${ageInDays.toFixed(1)} days ` +
                `(limit: ${REFERRAL_EXPIRY_DAYS}) | doc: ${referralDocSnap.id}`
            );

            // Mark expired and exit — no reward notification needed
            await referralRef.update({
                status: 'expired',
                expiredAt: FieldValue.serverTimestamp(),
            });

            return { outcome: 'expired', reason: `age_${Math.floor(ageInDays)}_days` };
        }

        // ── Mark referral as completed and notify referrer ─────────────────
        const batch = adminDb.batch();

        // 1. Mark referral as completed
        batch.update(referralRef, {
            status: 'completed',
            qualifiedAt: FieldValue.serverTimestamp(),
            qualifiedByTxRef: purchaseTxRef,  // Audit trail back to Flutterwave
        });

        // 2. Notify the referrer to claim their reward
        const notificationRef = adminDb.collection('notifications').doc(); // Auto-ID
        batch.set(notificationRef, {
            userId: referral.referrerId,
            type: 'referral_bonus',
            title: 'Referral Bonus Unlocked! 🎉',
            message:
                `${referral.referredUserName} just made their first qualifying purchase. ` +
                `You have ₦${referral.reward ?? 500} ready to claim in your referral dashboard!`,
            link: '/referrals',
            createdAt: FieldValue.serverTimestamp(),
            read: false,
        });

        await batch.commit();

        console.log(
            `[Referral] ✅ Completed — referral: ${referralDocSnap.id} | ` +
            `referrer: ${referral.referrerId} | notification: ${notificationRef.id}`
        );

        return { outcome: 'completed' };

    } catch (err) {
        console.error(`[Referral] ❌ qualifyReferral error | tx: ${purchaseTxRef}`, err);
        throw err;
    }
};