// app/api/recharge/route.js
import { NextResponse } from 'next/server';
import https from 'https';
import { getV3SecretKey } from '@/lib/flutterwaveToken';

const BILLER_CODES = {
    MTN: 'BIL108',
    AIRTEL: 'BIL110',
    GLO: 'BIL109',
    '9MOBILE': 'BIL111',
};

const MOCK_PLANS = [
    { id: '100MB', name: '100MB - 1 Day', size: '100MB', price: 100, item_code: 'TEST_100MB' },
    { id: '200MB', name: '200MB - 3 Days', size: '200MB', price: 200, item_code: 'TEST_200MB' },
    { id: '1GB', name: '1GB - 30 Days', size: '1GB', price: 500, item_code: 'TEST_1GB' },
    { id: '2GB', name: '2GB - 30 Days', size: '2GB', price: 1000, item_code: 'TEST_2GB' },
    { id: '5GB', name: '5GB - 30 Days', size: '5GB', price: 2000, item_code: 'TEST_5GB' },
    { id: '10GB', name: '10GB - 30 Days', size: '10GB', price: 3500, item_code: 'TEST_10GB' },
];

const isTestMode = () =>
    process.env.FLUTTERWAVE_SECRET_KEY?.includes('FLWSECK_TEST') ?? false;

// Node https helper — avoids Windows fetch DNS issues
function flwRequest(method, path, secretKey, bodyObj = null) {
    return new Promise((resolve, reject) => {
        const bodyStr = bodyObj ? JSON.stringify(bodyObj) : null;
        const options = {
            hostname: 'api.flutterwave.com',
            path,
            method,
            headers: {
                Authorization: 'Bearer ' + secretKey,
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
                    reject(new Error('Non-JSON response (' + res.statusCode + '): ' + data.slice(0, 300)));
                }
            });
        });
        req.on('error', reject);
        if (bodyStr) req.write(bodyStr);
        req.end();
    });
}

// ── GET /api/recharge?network=MTN → fetch data plans ─────────────────────────
export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const network = searchParams.get('network')?.toUpperCase();

    if (!network || !BILLER_CODES[network]) {
        return NextResponse.json({ error: 'Invalid network' }, { status: 400 });
    }

    // Test mode → return mock plans
    if (isTestMode()) {
        return NextResponse.json({
            plans: MOCK_PLANS.map((p) => ({ ...p, biller_code: BILLER_CODES[network] })),
            mode: 'test',
        });
    }

    // Live mode — correct endpoint: /v3/bill-categories?biller_code=BIL108
    try {
        const key = getV3SecretKey();
        const billerCode = BILLER_CODES[network];
        const path = '/v3/bill-categories?biller_code=' + billerCode;

        console.log('[recharge] Fetching from:', path);

        const { status, data } = await flwRequest('GET', path, key);

        console.log('[recharge] Status:', status, '| FLW status:', data?.status);

        if (status !== 200 || data.status !== 'success') {
            return NextResponse.json(
                { error: data.message || 'Failed to fetch plans' },
                { status: 400 }
            );
        }

        const items = Array.isArray(data.data) ? data.data : [];

        const plans = items.map((item) => ({
            id: String(item.id),
            name: item.name,
            size: item.name,
            price: Number(item.amount),
            item_code: item.item_code || String(item.id),
            biller_code: item.biller_code || billerCode,
        }));

        return NextResponse.json({ plans });
    } catch (err) {
        console.error('Fetch plans error:', err);
        return NextResponse.json({ error: err.message || 'Failed to fetch plans' }, { status: 500 });
    }
}

// ── POST /api/recharge → buy airtime or data ──────────────────────────────────
export async function POST(request) {
    try {
        const body = await request.json();
        const { type, phone, amount, network, item_code, biller_code } = body;

        const formattedPhone = phone.startsWith('0')
            ? '+234' + phone.slice(1)
            : phone.startsWith('234')
                ? '+' + phone
                : phone;

        const ref = 'LAN_' + type.toUpperCase() + '_' + Date.now() + '_' +
            Math.random().toString(36).slice(2, 8).toUpperCase();

        // Test mode → simulate
        if (isTestMode()) {
            return NextResponse.json({
                ref,
                data: {
                    status: 'success',
                    message: '[TEST] ' + (type === 'airtime' ? 'Airtime' : 'Data') + ' purchase simulated',
                    data: { phone_number: formattedPhone, amount: Number(amount), network, reference: ref },
                },
            });
        }

        // Live mode
        const key = getV3SecretKey();
        const payload =
            type === 'airtime'
                ? {
                    country: 'NG',
                    customer: formattedPhone,
                    amount: Number(amount),
                    recurrence: 'ONCE',
                    type: 'AIRTIME',
                    reference: ref,
                }
                : {
                    country: 'NG',
                    customer: formattedPhone,
                    amount: Number(amount),
                    recurrence: 'ONCE',
                    type: item_code,
                    reference: ref,
                    biller_code,
                };

        console.log('[recharge] POST payload:', JSON.stringify(payload));

        const { status, data } = await flwRequest('POST', '/v3/bills', key, payload);

        console.log('[recharge] POST response:', JSON.stringify(data).slice(0, 300));

        if (status !== 200 || data.status !== 'success') {
            return NextResponse.json(
                { error: data.message || 'Purchase failed', details: data },
                { status: 400 }
            );
        }

        return NextResponse.json({ ref, data });
    } catch (err) {
        console.error('Recharge error:', err);
        return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
    }
}