// app/api/flutterwave-balance/route.js
import { NextResponse } from 'next/server';
import https from 'https';
import { getV3SecretKey } from '@/lib/flutterwaveToken';
import { admin } from '@/lib/firebase-admin';

// Reuse the same Node https helper pattern from flutterwave-transfer
function flwRequest(method, path, secretKey) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'api.flutterwave.com',
            path,
            method,
            headers: {
                Authorization: `Bearer ${secretKey}`,
                'Content-Type': 'application/json',
                Accept: 'application/json',
            },
        };
        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', (c) => (data += c));
            res.on('end', () => {
                try {
                    resolve({ status: res.statusCode, data: JSON.parse(data) });
                } catch {
                    reject(new Error(`Non-JSON response (${res.statusCode}): ${data.slice(0, 300)}`));
                }
            });
        });
        req.on('error', reject);
        req.end();
    });
}

// ── GET → Return Flutterwave account balance ──────────────────────────────────
export async function GET(request) {
    try {
        // 1. GATEKEEPER: Verify incoming admin token — same pattern as transfer route
        const authHeader = request.headers.get('Authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json(
                { success: false, error: 'Missing admin credentials.' },
                { status: 401 }
            );
        }

        const token = authHeader.split('Bearer ')[1];
        const decodedToken = await admin.auth().verifyIdToken(token);
        const adminEmail = decodedToken.email;

        // 2. Confirm caller is an authorised admin in Firestore — never trust client alone
        const db = admin.firestore();
        const userSnap = await db.collection('users').doc(decodedToken.uid).get();

        if (!userSnap.exists) {
            return NextResponse.json(
                { success: false, error: 'User record not found.' },
                { status: 403 }
            );
        }

        const userData = userSnap.data();
        const isAdmin =
            userData.role === 'admin' ||
            userData.isAdmin === true ||
            (process.env.NEXT_PUBLIC_ADMIN_EMAILS || '')
                .split(',')
                .map(e => e.trim())
                .includes(adminEmail);

        if (!isAdmin) {
            return NextResponse.json(
                { success: false, error: 'Access denied. Admin privileges required.' },
                { status: 403 }
            );
        }

        // 3. Fetch NGN balance from Flutterwave
        const key = getV3SecretKey();
        const { status, data } = await flwRequest('GET', '/v3/balances/NGN', key);

        if (data.status === 'success') {
            const balanceData = data.data;
            return NextResponse.json({
                success: true,
                balance: balanceData.available_balance ?? balanceData.ledger_balance ?? 0,
                available_balance: balanceData.available_balance ?? 0,
                ledger_balance: balanceData.ledger_balance ?? 0,
                currency: balanceData.currency || 'NGN',
            });
        }

        // Flutterwave returned an error payload
        return NextResponse.json(
            {
                success: false,
                error: data.message || 'Failed to fetch balance from Flutterwave.',
                details: data,
            },
            { status: status || 400 }
        );

    } catch (err) {
        console.error('Flutterwave Balance API Error:', err);
        return NextResponse.json(
            { success: false, error: err.message || 'Internal server error.' },
            { status: 500 }
        );
    }
}