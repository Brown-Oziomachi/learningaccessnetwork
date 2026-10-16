// app/api/recharge/status/route.js
import { NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebase-admin';
import { checkAndSettle } from '@/lib/rechargeStatus';

export async function GET(req) {
    try {
        const token = req.headers.get('authorization')?.replace('Bearer ', '');
        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        const { uid } = await adminAuth.verifyIdToken(token);

        const id = new URL(req.url).searchParams.get('id');
        if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

        const ref = adminDb.collection('recharges').doc(id);
        const snap = await ref.get();
        if (!snap.exists || snap.data().sellerId !== uid)
            return NextResponse.json({ error: 'Not found' }, { status: 404 });

        const status = await checkAndSettle(ref, snap.data());
        return NextResponse.json({ status });
    } catch (e) {
        console.error('[recharge/status]', e);
        return NextResponse.json({ error: 'Could not check status.' }, { status: 500 });
    }
}