// lib/server/grantSellerVerification.js  (server only)
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { adminDb } from "../firebase-admin";

export const VERIFY_PRICE_NGN = 2000;
export const VERIFY_DAYS = 30;

/** Extends from today, or from the current expiry if still active (renewals stack). */
export function verificationUpdate(currentUntil) {
    const cur = currentUntil?.toMillis?.() ?? 0;
    const base = Math.max(Date.now(), cur);
    return {
        isVerifiedSeller: true,
        verifiedUntil: Timestamp.fromMillis(base + VERIFY_DAYS * 864e5),
        updatedAt: FieldValue.serverTimestamp(),
    };
}

/**
 * Confirms a Flutterwave payment with Flutterwave itself, then grants the badge once.
 * Safe to call from both the redirect-verify route and the webhook (idempotent).
 */
export async function confirmFlutterwavePayment(txRef, expectedUid = null) {
    const payRef = adminDb.collection("verificationPayments").doc(txRef);
    const paySnap = await payRef.get();
    if (!paySnap.exists) return { ok: false, error: "Payment not found." };
    const pay = paySnap.data();
    if (expectedUid && pay.uid !== expectedUid) return { ok: false, error: "Payment not found." };

    const sellerRef = adminDb.collection("sellers").doc(pay.uid);

    if (pay.status !== "completed") {
        const res = await fetch(
            `https://api.flutterwave.com/v3/transactions/verify_by_reference?tx_ref=${encodeURIComponent(txRef)}`,
            { headers: { Authorization: `Bearer ${process.env.FLW_SECRET_KEY}` } }
        );
        const json = await res.json().catch(() => ({}));
        const d = json?.data;
        if (!res.ok || d?.status !== "successful" || d.currency !== pay.currency || Number(d.amount) < pay.amount) {
            return { ok: false, error: "Payment not confirmed yet." };
        }
        await adminDb.runTransaction(async (tx) => {
            const [p, s] = await Promise.all([tx.get(payRef), tx.get(sellerRef)]);
            if (p.data()?.status === "completed") return;
            tx.update(payRef, { status: "completed", flwTransactionId: d.id ?? null, completedAt: FieldValue.serverTimestamp() });
            tx.set(sellerRef, verificationUpdate(s.data()?.verifiedUntil), { merge: true });
        });
    }
    const s = await sellerRef.get();
    return { ok: true, verifiedUntil: s.data()?.verifiedUntil?.toMillis?.() ?? null };
}