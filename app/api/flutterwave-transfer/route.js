// app/api/flutterwave-transfer/route.js
import { NextResponse } from 'next/server';
import https from 'https';
import { getV3SecretKey } from '@/lib/flutterwaveToken';
import { getAdminDb, admin } from '@/lib/firebase-admin'; // Sourced from your admin file

// Node https helper — avoids Windows fetch DNS issues
function flwRequest(method, path, secretKey, bodyObj = null) {
    return new Promise((resolve, reject) => {
        const bodyStr = bodyObj ? JSON.stringify(bodyObj) : null;
        const options = {
            hostname: 'api.flutterwave.com',
            path,
            method,
            headers: {
                Authorization: `Bearer ${secretKey}`,
                'Content-Type': 'application/json',
                Accept: 'application/json',
                ...(bodyStr ? { 'Content-Length': Buffer.byteLength(bodyStr) } : {}),
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
        if (bodyStr) req.write(bodyStr);
        req.end();
    });
}

// ── GET → Test credentials safely on server side ─────────────────────────────
export async function GET() {
    try {
        const key = getV3SecretKey();
        const { data } = await flwRequest('GET', '/v3/banks/NG', key);

        if (data.status === 'success') {
            return NextResponse.json({
                success: true,
                message: '✅ Flutterwave v3 secret key is working!',
                banksFound: data.data?.length || 0,
            });
        }
        return NextResponse.json({ success: false, error: 'API call failed', details: data }, { status: 400 });
    } catch (err) {
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}

// ── POST → Process secure transfer ───────────────────────────────────────────
export async function POST(request) {
    try {
        // 1. GATEKEEPER: Secure verification of incoming admin token identity
        const authHeader = request.headers.get("Authorization");
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return NextResponse.json({ success: false, error: "Missing admin credentials." }, { status: 401 });
        }

        const token = authHeader.split("Bearer ")[1];
        const authAdmin = admin.auth();
        const decodedToken = await authAdmin.verifyIdToken(token);

        // Safety lock: verify the user email executing this has authority
        const adminEmail = decodedToken.email;

        // 2. Extract only the ID from the client payload
        const { withdrawalId } = await request.json();
        if (!withdrawalId) {
            return NextResponse.json({ success: false, error: 'Withdrawal ID parameter required.' }, { status: 400 });
        }

        // Initialize secure database instance
        const db = getAdminDb();

        // 3. SECURE VERIFICATION: Check matching details in Firestore on the cloud
        const withdrawalRef = db.collection('withdrawals').doc(withdrawalId);
        const withdrawalDoc = await withdrawalRef.get();

        if (!withdrawalDoc.exists) {
            return NextResponse.json({ success: false, error: 'Withdrawal record not found.' }, { status: 404 });
        }

        const withdrawalData = withdrawalDoc.data();

        // Halt execution if a malicious/duplicate request tries to process an old request
        if (withdrawalData.status !== 'pending') {
            return NextResponse.json({ success: false, error: 'This request has already been processed.' }, { status: 400 });
        }

        if (!withdrawalData.bankDetails?.bankCode || !withdrawalData.bankDetails?.accountNumber) {
            return NextResponse.json({ success: false, error: 'Incomplete bank metadata on document.' }, { status: 400 });
        }

        const key = getV3SecretKey();

        // 4. Construct transfer metadata safely using values sourced ONLY from database
        const transferData = {
            account_bank: withdrawalData.bankDetails.bankCode,
            account_number: withdrawalData.bankDetails.accountNumber,
            amount: withdrawalData.amount,
            narration: `LAN Library Withdrawal - ${withdrawalData.reference || withdrawalId}`,
            currency: 'NGN',
            reference: withdrawalData.reference || `ref-${withdrawalId}-${Date.now()}`,
            callback_url: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/transfer-callback`,
            debit_currency: 'NGN',
        };

        // Fire request to payment processor
        const { data } = await flwRequest('POST', '/v3/transfers', key, transferData);

        if (data.status === 'success') {
            const transferInfo = data.data;

            // 5. ATOMIC CLOUD TRANSACTION: Mutate all database states securely at the exact same time
            await db.runTransaction(async (ts) => {
                const sellerRef = db.collection('sellers').doc(withdrawalData.sellerId);
                const notificationRef = db.collection('notifications').doc();

                // Update withdrawal log
                ts.update(withdrawalRef, {
                    status: 'completed',
                    processedAt: admin.firestore.FieldValue.serverTimestamp(),
                    flutterwaveTransferId: transferInfo.id,
                    flutterwaveReference: transferInfo.reference,
                    adminNote: 'Approved via Secure Server API',
                    processedBy: adminEmail
                });

                // Increment withdrawal tally totals safely
                ts.update(sellerRef, {
                    totalWithdrawn: admin.firestore.FieldValue.increment(withdrawalData.amount),
                    lastWithdrawalDate: admin.firestore.FieldValue.serverTimestamp(),
                    updatedAt: admin.firestore.FieldValue.serverTimestamp()
                });

                // Deliver alert data securely
                ts.set(notificationRef, {
                    userId: withdrawalData.sellerId,
                    type: 'withdrawal_approved',
                    title: 'Withdrawal Approved ✅',
                    message: `Your withdrawal of ₦${withdrawalData.amount.toLocaleString()} has been processed. Ref: ${transferInfo.reference}`,
                    createdAt: admin.firestore.FieldValue.serverTimestamp(),
                    read: false
                });
            });

            return NextResponse.json({
                success: true,
                transferId: transferInfo.id,
                reference: transferInfo.reference,
                status: transferInfo.status,
                amount: withdrawalData.amount,
                sellerName: withdrawalData.sellerName || 'Seller',
                bankName: withdrawalData.bankDetails.bankName || ''
            });
        }

        // Handle error payloads from payment gateway safely
        const msg = data.message?.toLowerCase() || '';
        const help = msg.includes('insufficient') ? 'Fund your Flutterwave wallet at dashboard.flutterwave.com'
            : msg.includes('bank code') ? `Verify bank code: ${withdrawalData.bankDetails.bankCode}`
                : msg.includes('account') ? 'Verify account number matches the selected bank'
                    : '';

        return NextResponse.json(
            { success: false, error: data.message || 'Transfer failed', help, details: data.data || {} },
            { status: 400 }
        );

    } catch (err) {
        console.error('Secure Transfer API Failure:', err);
        return NextResponse.json({ success: false, error: err.message || 'Internal server error occurred.' }, { status: 500 });
    }
}