// app/api/admin/reconcile-recharges/route.js  (one-off: delete after use)
import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { checkAndSettle } from '@/lib/rechargeStatus';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET(request) {
    const secret = process.env.CRON_SECRET;
    if (!secret)
        return NextResponse.json({ error: 'CRON_SECRET not set on this deployment' }, { status: 500 });
    if (request.headers.get('authorization') !== `Bearer ${secret}`)
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const since = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
    const snap = await adminDb.collection('recharges').where('createdAt', '>=', since).get();

    const out = [];
    for (const d of snap.docs) {
        let rec = d.data();

        // old code marked accepted requests "completed" without confirming delivery
        if (rec.status === 'completed' && !rec.settledAt) {
            await d.ref.update({ status: 'pending', reopenedAt: FieldValue.serverTimestamp() });
            rec = { ...rec, status: 'pending' };
        }

        if (!['pending', 'needs_review'].includes(rec.status)) continue;

        try {
            const outcome = await checkAndSettle(d.ref, rec);
            out.push({ id: d.id, type: rec.type, amount: rec.amount, outcome });
        } catch (e) {
            out.push({ id: d.id, type: rec.type, amount: rec.amount, outcome: 'error', error: e.message });
        }
    }

    return NextResponse.json({ count: out.length, results: out });
}