// lib/server/grantSellerVerification.js  (server only)
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { adminDb } from "../firebase-admin";
import { canPay } from "./verificationGate";

export const VERIFY_PRICE_NGN = 2000;
export const VERIFY_DAYS = 30;

/** Extends from today, or from the current expiry if still active (renewals stack). */
export function verificationUpdate(currentUntil) {
    const cur = currentUntil?.toMillis?.() ?? 0;
    const base = Math.max(Date.now(), cur);
    return {
        isVerifiedSeller: true,
        verifiedRoute: "paid",
        verificationStatus: "verified",
        verifiedUntil: Timestamp.fromMillis(base + VERIFY_DAYS * 864e5),
        verifiedAt: FieldValue.serverTimestamp(),
        verificationRejectedReason: FieldValue.delete(),
        updatedAt: FieldValue.serverTimestamp(),
    };
}

/**
 * Confirms a Flutterwave payment with Flutterwave itself, then grants the badge once.
 * Safe to call from both the redirect-verify route and the webhook (idempotent).
 *
 * NEW: the badge is granted only if the seller is still approved (or a paid renewal).
 * If the money arrived but the seller is no longer eligible (e.g. a strike revoked them
 * while they were on the Flutterwave page), the payment is parked as "paid_not_granted"
 * for a manual refund and NO badge is given.
 */
export async function confirmFlutterwavePayment(txRef, expectedUid = null) {
    const payRef = adminDb.collection("verificationPayments").doc(txRef);
    const paySnap = await payRef.get();
    if (!paySnap.exists) return { ok: false, error: "Payment not found." };
    const pay = paySnap.data();
    if (expectedUid && pay.uid !== expectedUid) return { ok: false, error: "Payment not found." };
    if (pay.status === "paid_not_granted") {
        return { ok: false, error: "Your payment was received but you are not currently eligible. Support will refund it." };
    }

    const sellerRef = adminDb.collection("sellers").doc(pay.uid);

    if (pay.status !== "completed") {
        const res = await fetch(
            `https://api.flutterwave.com/v3/transactions/verify_by_reference?tx_ref=${encodeURIComponent(txRef)}`,
            { headers: { Authorization: `Bearer ${process.env.FLW_SECRET_KEY}` } }
        );
        const json = await res.json().catch(() => ({}));
        const d = json?.data;
        if (
            !res.ok || d?.status !== "successful" || d.tx_ref !== txRef ||
            d.currency !== pay.currency || Number(d.amount) < pay.amount
        ) {
            return { ok: false, error: "Payment not confirmed yet." };
        }

        let granted = true;
        await adminDb.runTransaction(async (tx) => {
            const [p, s] = await Promise.all([tx.get(payRef), tx.get(sellerRef)]);
            if (p.data()?.status === "completed" || p.data()?.status === "paid_not_granted") return; // replay / webhook race
            const gate = canPay(s.data());
            if (!gate.ok) {
                granted = false;
                tx.update(payRef, {
                    status: "paid_not_granted", reason: gate.error,
                    flwTransactionId: d.id ?? null, paidAt: FieldValue.serverTimestamp(),
                });
                return;
            }
            tx.update(payRef, { status: "completed", flwTransactionId: d.id ?? null, completedAt: FieldValue.serverTimestamp() });
            tx.set(sellerRef, verificationUpdate(s.data()?.verifiedUntil), { merge: true });
        });
        if (!granted) {
            return { ok: false, error: "Your payment was received but you are not currently eligible. Support will refund it." };
        }
    }
    const s = await sellerRef.get();
    return { ok: true, verifiedUntil: s.data()?.verifiedUntil?.toMillis?.() ?? null };
}