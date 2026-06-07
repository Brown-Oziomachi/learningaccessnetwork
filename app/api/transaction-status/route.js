// app/api/transaction-status/route.js
import { getAdminDb } from '@/lib/firebase-admin';
import { NextResponse } from 'next/server';

export async function GET(request) {
    try {
        const adminDb = getAdminDb();

        // 1. Extract the tx_ref from the URL query parameters
        const { searchParams } = new URL(request.url);
        const txRef = searchParams.get('tx_ref');

        if (!txRef) {
            return NextResponse.json({ error: 'Missing transaction reference (tx_ref)' }, { status: 400 });
        }

        // 2. Look up the transaction ledger document in Firestore
        const txDocRef = adminDb.collection('transactions').doc(txRef);
        const txSnap = await txDocRef.get();

        // 3. If it doesn't exist yet, tell the frontend to keep polling
        if (!txSnap.exists) {
            return NextResponse.json({ status: 'pending', message: 'Webhook ledger record not found yet.' }, { status: 200 });
        }

        const txData = txSnap.data();

        // 4. Return the actual state of the transaction to the frontend
        return NextResponse.json({
            status: txData?.status || 'pending', // e.g., 'completed', 'failed', 'pending'
            txRef: txRef
        }, { status: 200 });

    } catch (error) {
        console.error('Transaction status check failure:', error);
        return NextResponse.json({ error: 'Internal status inquiry error' }, { status: 500 });
    }
}