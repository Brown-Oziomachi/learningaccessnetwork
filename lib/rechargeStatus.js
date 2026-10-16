// lib/rechargeStatus.js
import { adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { getV3SecretKey } from '@/lib/flutterwaveToken';

const DONE = new Set(['success', 'successful', 'completed', 'delivered']);
const FAILED = new Set(['fail', 'failed', 'error', 'reversed', 'refunded']);

// verbose=1 makes Flutterwave return the provider's own status
export async function billStatus(reference) {
    try {
        const r = await fetch(
            `https://api.flutterwave.com/v3/bills/${encodeURIComponent(reference)}?verbose=1`,
            { headers: { Authorization: `Bearer ${getV3SecretKey()}` } }
        );
        const body = await r.json().catch(() => ({}));
        return { http: r.status, body };
    } catch (e) {
        return { http: 0, body: { error: e.message } }; // unknown, treated as pending
    }
}

// Only the provider's own status field counts. Top-level body.status just
// means "lookup worked", so it is ignored.
export function readOutcome(body) {
    const d = body?.data;
    const item = Array.isArray(d) ? d[0] : d;
    const inner = String(item?.status ?? '').toLowerCase().trim();
    if (DONE.has(inner)) return 'completed';
    if (FAILED.has(inner)) return 'failed';
    return 'pending';
}

// Moves a recharge to completed/failed exactly once. Refunds on failure.
export async function settle(ref, outcome) {
    await adminDb.runTransaction(async (t) => {
        const cur = await t.get(ref);
        if (!cur.exists) return;
        const rec = cur.data();
        if (['completed', 'failed'].includes(rec.status)) return; // already settled

        if (outcome === 'completed') {
            t.update(ref, { status: 'completed', settledAt: FieldValue.serverTimestamp() });
            return;
        }

        // outcome === 'failed'
        if (rec.paymentMethod === 'wallet') {
            t.update(adminDb.collection('sellers').doc(rec.sellerId), {
                accountBalance: FieldValue.increment(rec.amount),
            });
        } else if (rec.paymentMethod === 'card' && rec.cardTxRef) {
            t.set(
                adminDb.collection('cardPayments').doc(rec.cardTxRef),
                { status: 'paid_not_delivered', error: 'Provider failed' },
                { merge: true }
            );
        }
        t.update(ref, { status: 'failed', refundedAt: FieldValue.serverTimestamp() });
    });
}

// Look up one recharge at Flutterwave and settle it if the result is final.
// `ref` is the Firestore doc ref, `rec` its data.
// Returns 'completed' | 'failed' | 'pending'.
export async function checkAndSettle(ref, rec) {
    if (rec.status === 'completed' && rec.settledAt) return 'completed';
    if (rec.status === 'failed') return 'failed';

    // try every reference we have until one gives a final answer
    const candidates = [rec.flwTxRef, rec.ourReference, rec.flwReference].filter(Boolean);
    let outcome = 'pending';
    for (const c of candidates) {
        const res = await billStatus(c);
        console.log('[recharge/status]', ref.id, c, res.http, JSON.stringify(res.body).slice(0, 600));
        if (res.http !== 200) continue;
        outcome = readOutcome(res.body);
        if (outcome !== 'pending') break;
    }

    if (outcome !== 'pending') {
        await settle(ref, outcome);
    } else {
        await ref.update({ lastCheckedAt: FieldValue.serverTimestamp() }).catch(() => { });
    }
    return outcome;
}