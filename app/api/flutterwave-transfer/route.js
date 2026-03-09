// app/api/flutterwave-transfer/route.js
import { NextResponse } from 'next/server';
import https from 'https';
import { getV3SecretKey } from '@/lib/flutterwaveToken';

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

// ── GET → test credentials ────────────────────────────────────────────────────
export async function GET() {
    try {
        const key = getV3SecretKey();
        const { status, data } = await flwRequest('GET', '/v3/banks/NG', key);

        if (data.status === 'success') {
            return NextResponse.json({
                success: true,
                message: '✅ Flutterwave v3 secret key is working!',
                banksFound: data.data?.length || 0,
            });
        }

        return NextResponse.json(
            { success: false, error: 'API call failed', details: data },
            { status: 400 }
        );
    } catch (err) {
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}

// ── POST → process transfer ───────────────────────────────────────────────────
export async function POST(request) {
    try {
        const { withdrawal } = await request.json();

        if (!withdrawal?.bankDetails?.bankCode || !withdrawal?.bankDetails?.accountNumber) {
            return NextResponse.json(
                { success: false, error: 'Invalid bank details. Bank code and account number required.' },
                { status: 400 }
            );
        }

        const key = getV3SecretKey();

        const transferData = {
            account_bank: withdrawal.bankDetails.bankCode,
            account_number: withdrawal.bankDetails.accountNumber,
            amount: withdrawal.amount,
            narration: `LAN Library Withdrawal - ${withdrawal.reference}`,
            currency: 'NGN',
            reference: withdrawal.reference,
            callback_url: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/transfer-callback`,
            debit_currency: 'NGN',
        };

        const { status, data } = await flwRequest('POST', '/v3/transfers', key, transferData);

        if (data.status === 'success') {
            return NextResponse.json({
                success: true,
                transferId: data.data.id,
                reference: data.data.reference,
                status: data.data.status,
                message: data.message,
            });
        }

        const msg = data.message?.toLowerCase() || '';
        const help = msg.includes('insufficient') ? 'Fund your Flutterwave wallet at dashboard.flutterwave.com'
            : msg.includes('bank code') ? `Verify bank code: ${withdrawal.bankDetails.bankCode}`
                : msg.includes('account') ? 'Verify account number matches the selected bank'
                    : '';

        return NextResponse.json(
            { success: false, error: data.message || 'Transfer failed', help, details: data.data || {} },
            { status: 400 }
        );
    } catch (err) {
        console.error('Transfer error:', err);
        return NextResponse.json({ success: false, error: err.message || 'Server error' }, { status: 500 });
    }
}