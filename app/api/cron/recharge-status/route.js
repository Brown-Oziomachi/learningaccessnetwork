// app/api/cron/recharge-status/route.js
import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { checkAndSettle } from '@/lib/rechargeStatus';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const MIN_AGE_MS = 2 * 60 * 1000;          // give the user's own poller a head start
const STALE_AFTER_MS = 24 * 60 * 60 * 1000; // after this, flag for a human. Never auto-refund.
const BATCH = 30;

export async function GET(request) {
    // Vercel Cron sends: Authorization: Bearer <CRON_SECRET>
    const secret = process.env.CRON_SECRET;
    if (!secret || request.headers.get('authorization') !== `Bearer ${secret}`)
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        // Single-field "in" query: no composite index needed.
        const snap = await adminDb
            .collection('recharges')
            .where('status', 'in', ['pending', 'needs_review'])
            .limit(200)
            .get();

        const now = Date.now();
        const due = snap.docs
            .filter((d) => {
                const created = d.data().createdAt?.toMillis?.() ?? 0;
                return now - created >= MIN_AGE_MS;
            })
            .slice(0, BATCH);

        const summary = { checked: 0, completed: 0, failed: 0, pending: 0, flagged: 0, errors: 0 };

        for (const d of due) {
            const rec = d.data();
            try {
                const outcome = await checkAndSettle(d.ref, rec);
                summary.checked++;
                summary[outcome]++;

                if (outcome === 'pending') {
                    const created = rec.createdAt?.toMillis?.() ?? now;
                    if (now - created > STALE_AFTER_MS && !rec.needsManualReview) {
                        await d.ref.update({
                            needsManualReview: true,
                            flaggedAt: FieldValue.serverTimestamp(),
                        });
                        summary.flagged++;
                    }
                }
            } catch (e) {
                summary.errors++;
                console.error('[cron/recharge-status]', d.id, e.message);
            }
        }

        return NextResponse.json({ ok: true, ...summary });
    } catch (e) {
        console.error('[cron/recharge-status]', e);
        return NextResponse.json({ error: 'Cron failed' }, { status: 500 });
    }
}