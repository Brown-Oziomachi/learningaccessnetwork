// app/api/recharge/route.js
import { NextResponse } from 'next/server';
import https from 'https';
import { getV3SecretKey } from '@/lib/flutterwaveToken';

// ── Verified from your actual Flutterwave account ─────────────────────────────
const BILLER_CODES = {
    MTN: 'BIL108',
    AIRTEL: 'BIL110',
    GLO: 'BIL109',
    '9MOBILE': 'BIL111',
};

const ELECTRICITY_BILLERS = {
    IKEDC: { code: 'BIL113', name: 'Ikeja Electric' },
    EKEDC: { code: 'BIL112', name: 'Eko Electric' },
    AEDC: { code: 'BIL204', name: 'Abuja Electric' },
    PHEDC: { code: 'BIL116', name: 'Port Harcourt Electric' },
    KEDCO: { code: 'BIL120', name: 'Kano Electric' },
    IBEDC: { code: 'BIL114', name: 'Ibadan Electric' },
    JEDC: { code: 'BIL215', name: 'Jos Electric' },
    BEDC: { code: 'BIL117', name: 'Benin Electric' },
    EEDC: { code: 'BIL115', name: 'Enugu Electric' },
    KADC: { code: 'BIL119', name: 'Kaduna Electric' },
    YEDC: { code: 'BIL118', name: 'Yola Electric' },
};

const TV_BILLERS = {
    DSTV: { code: 'BIL121', name: 'DStv' },
    GOTV: { code: 'BIL122', name: 'GOtv' },
    STARTIMES: { code: 'BIL123', name: 'StarTimes' },
};

const isTestMode = () =>
    process.env.FLUTTERWAVE_SECRET_KEY?.includes('FLWSECK_TEST') ?? false;

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
                try { resolve({ status: res.statusCode, data: JSON.parse(data) }); }
                catch { reject(new Error('Non-JSON response (' + res.statusCode + '): ' + data.slice(0, 300))); }
            });
        });
        req.on('error', reject);
        if (bodyStr) req.write(bodyStr);
        req.end();
    });
}

async function getFlutterwaveBalance(key) {
    try {
        const { status, data } = await flwRequest('GET', '/v3/balances/NGN', key);
        if (status === 200 && data.status === 'success') return data.data?.available_balance ?? null;
        return null;
    } catch { return null; }
}

async function triggerBalanceAlert(baseUrl) {
    try {
        await fetch(`${baseUrl}/api/flutterwave-balance-alert`, { method: 'POST' });
    } catch (e) {
        console.error('[recharge] Balance alert trigger failed:', e.message);
    }
}

async function fetchBillCategories(billerCode) {
    const key = getV3SecretKey();
    try {
        const path = `/v3/bill-categories?biller_code=${billerCode}`;
        console.log('[recharge] GET', path);
        const { status, data } = await flwRequest('GET', path, key);

        if (status !== 200 || data.status !== 'success') {
            return NextResponse.json({ error: data?.message || 'Failed to fetch plans' }, { status: 400 });
        }

        const plans = (data.data || []).map((item) => ({
            id: String(item.id),
            name: item.biller_name || item.name,
            size: item.biller_name || item.name,
            duration: item.validity || 'Standard',
            price: Number(item.amount),
            item_code: item.item_code || String(item.id),
            biller_code: item.biller_code || billerCode,
        }));

        console.log('[recharge] plans count:', plans.length, '| first:', plans[0]?.name);
        return NextResponse.json({ plans });
    } catch (err) {
        console.error('[recharge] fetchBillCategories error:', err.message);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

// ── GET /api/recharge ─────────────────────────────────────────────────────────
export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const network = searchParams.get('network')?.toUpperCase();
    const billType = searchParams.get('type');
    const billerId = searchParams.get('biller')?.toUpperCase();

    if (billType === 'electricity') {
        return NextResponse.json({
            billers: Object.entries(ELECTRICITY_BILLERS).map(([id, v]) => ({ id, ...v })),
        });
    }

    if (billType === 'tv') {
        return NextResponse.json({
            billers: Object.entries(TV_BILLERS).map(([id, v]) => ({ id, ...v })),
        });
    }

    if (billType === 'electricity-plans') {
        if (!billerId) return NextResponse.json({ error: 'Missing biller param' }, { status: 400 });
        const biller = ELECTRICITY_BILLERS[billerId];
        if (!biller) return NextResponse.json({ error: 'Invalid electricity biller: ' + billerId }, { status: 400 });
        return fetchBillCategories(biller.code);
    }

    if (billType === 'tv-plans') {
        if (!billerId) return NextResponse.json({ error: 'Missing biller param' }, { status: 400 });
        const biller = TV_BILLERS[billerId];
        if (!biller) return NextResponse.json({ error: 'Invalid TV biller: ' + billerId }, { status: 400 });
        return fetchBillCategories(biller.code);
    }

    if (network) {
        const billerCode = BILLER_CODES[network];
        if (!billerCode) return NextResponse.json({ error: 'Invalid network' }, { status: 400 });
        if (isTestMode()) return NextResponse.json({ plans: [], mode: 'test' });
        return fetchBillCategories(billerCode);
    }

    return NextResponse.json({ error: 'Invalid request parameters' }, { status: 400 });
}

// ── POST /api/recharge ────────────────────────────────────────────────────────
export async function POST(request) {
    try {
        const body = await request.json();
        const { type, phone, amount, item_code, biller_code, meter_number, smartcard_number } = body;

        const ref = 'LAN_' + type.toUpperCase() + '_' + Date.now() + '_' +
            Math.random().toString(36).slice(2, 8).toUpperCase();

        if (isTestMode()) {
            return NextResponse.json(
                { error: 'Not supported in test mode. Switch to live keys.' },
                { status: 400 }
            );
        }

        const key = getV3SecretKey();
        const flwBalance = await getFlutterwaveBalance(key);

        if (flwBalance !== null && flwBalance < Number(amount)) {
            return NextResponse.json(
                { error: 'Service temporarily unavailable. Please try again shortly.' },
                { status: 503 }
            );
        }

        let payload;

        if (type === 'airtime') {
            const formattedPhone = phone.startsWith('0') ? '+234' + phone.slice(1) : phone;
            payload = {
                country: 'NG',
                customer: formattedPhone,
                amount: Number(amount),
                recurrence: 'ONCE',
                type: 'AIRTIME',
                reference: ref,
            };
        } else if (type === 'data') {
            const formattedPhone = phone.startsWith('0') ? '+234' + phone.slice(1) : phone;
            payload = {
                country: 'NG',
                customer: formattedPhone,
                amount: Number(amount),
                recurrence: 'ONCE',
                type: 'DATA_BUNDLE',
                reference: ref,
                biller_code,   // put biller_code back
                item_code,
            };
        } else if (type === 'electricity') {
            payload = {
                country: 'NG',
                customer: meter_number,
                amount: Number(amount),
                recurrence: 'ONCE',
                type: 'POWER',
                reference: ref,
                biller_code,
                item_code,
            };
        } else if (type === 'tv') {
            payload = {
                country: 'NG',
                customer: smartcard_number,
                amount: Number(amount),
                recurrence: 'ONCE',
                type: 'CABLETV',
                reference: ref,
                biller_code,
                item_code,
            };
        } else {
            return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
        }

        console.log('[recharge] POST payload:', JSON.stringify(payload));
        const { status, data } = await flwRequest('POST', '/v3/bills', key, payload);
        console.log('[recharge] POST response:', JSON.stringify(data).slice(0, 400));

        if (status !== 200 || data.status !== 'success') {
            return NextResponse.json({ error: data.message || 'Purchase failed', details: data }, { status: 400 });
        }

        const deliveryStatus = data.data?.data?.status || data.data?.status || '';
        if (deliveryStatus && deliveryStatus.toLowerCase() === 'failed') {
            return NextResponse.json({ error: 'Delivery failed. Your wallet has not been debited.' }, { status: 400 });
        }

        const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://yourdomain.com';
        triggerBalanceAlert(baseUrl);

        return NextResponse.json({ ref, data });

    } catch (err) {
        console.error('Recharge error:', err);
        return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
    }
}