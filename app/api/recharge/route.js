// app/api/recharge/route.js
import { NextResponse } from 'next/server';
import https from 'https';
import { getV3SecretKey } from '@/lib/flutterwaveToken';

// ── Network biller codes ──────────────────────────────────────────────────────
const NETWORK_BILLER_CODES = {
    MTN: 'BIL108',
    AIRTEL: 'BIL110',
    GLO: 'BIL109',
    '9MOBILE': 'BIL111',
};

// ── Electricity billers ───────────────────────────────────────────────────────
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

// ── TV billers ────────────────────────────────────────────────────────────────
const TV_BILLERS = {
    DSTV: { code: 'BIL121', name: 'DStv' },
    GOTV: { code: 'BIL122', name: 'GOtv' },
    STARTIMES: { code: 'BIL123', name: 'StarTimes' },
};

const isTestMode = () =>
    process.env.FLUTTERWAVE_SECRET_KEY?.includes('FLWSECK_TEST') ?? false;

// ── Flutterwave request helper ────────────────────────────────────────────────
function flwRequest(method, path, bodyObj = null) {
    const secretKey = getV3SecretKey();
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
            let raw = '';
            res.on('data', (chunk) => (raw += chunk));
            res.on('end', () => {
                try {
                    resolve({ status: res.statusCode, data: raw.trim() ? JSON.parse(raw) : {} });
                } catch (err) {
                    reject(new Error(`JSON parse failed (${res.statusCode}): ${raw.slice(0, 200)}`));
                }
            });
        });
        req.on('error', reject);
        if (bodyStr) req.write(bodyStr);
        req.end();
    });
}

// ── Get NGN wallet balance ────────────────────────────────────────────────────
async function getFlutterwaveBalance() {
    try {
        const { status, data } = await flwRequest('GET', '/v3/balances/NGN');
        if (status === 200 && data.status === 'success') return data.data?.available_balance ?? null;
        return null;
    } catch { return null; }
}

// ── Fetch plans for a biller code ─────────────────────────────────────────────
async function fetchBillCategories(billerCode) {
    try {
        const path = `/v3/bill-categories?biller_code=${billerCode}`;
        console.log('[recharge] GET plans:', path);
        const { status, data } = await flwRequest('GET', path);

        if (status !== 200 || data.status !== 'success') {
            return NextResponse.json({ error: data?.message || 'Failed to fetch plans' }, { status: 400 });
        }

        const plans = (data.data || []).map((item) => ({
            id: String(item.id),
            name: item.biller_name || item.name,
            size: item.short_name || item.biller_name || item.name,
            duration: 'Standard',
            price: Number(item.amount),
            amount: Number(item.amount),
            item_code: item.item_code || String(item.id),
            biller_code: item.biller_code || billerCode,
        }));

        return NextResponse.json({ plans });
    } catch (err) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

// ── GET /api/recharge ─────────────────────────────────────────────────────────
export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const billType = searchParams.get('type');
    const billerCode = searchParams.get('biller_code');
    const customer = searchParams.get('customer');
    const itemCode = searchParams.get('item_code');
    const billerParam = searchParams.get('biller')?.toUpperCase();

    // 1. Fetch plans for a specific biller code (data, electricity, tv)
    // GET /api/recharge?type=plans&biller_code=BIL108
    if (billType === 'plans') {
        if (!billerCode) return NextResponse.json({ error: 'Missing biller_code' }, { status: 400 });
        if (isTestMode()) return NextResponse.json({ plans: [], mode: 'test' });
        return fetchBillCategories(billerCode);
    }

    // 2. Electricity biller list
    // GET /api/recharge?type=electricity
    if (billType === 'electricity') {
        return NextResponse.json({
            billers: Object.entries(ELECTRICITY_BILLERS).map(([id, v]) => ({ id, ...v })),
        });
    }

    // 3. TV biller list
    // GET /api/recharge?type=tv
    if (billType === 'tv') {
        return NextResponse.json({
            billers: Object.entries(TV_BILLERS).map(([id, v]) => ({ id, ...v })),
        });
    }

    // 4. Electricity meter type plans
    // GET /api/recharge?type=electricity-plans&biller=IKEDC
    if (billType === 'electricity-plans') {
        if (!billerParam) return NextResponse.json({ error: 'Missing biller param' }, { status: 400 });
        const biller = ELECTRICITY_BILLERS[billerParam];
        if (!biller) return NextResponse.json({ error: 'Invalid electricity biller' }, { status: 400 });
        return fetchBillCategories(biller.code);
    }

    // 5. TV subscription plans
    // GET /api/recharge?type=tv-plans&biller=DSTV
    if (billType === 'tv-plans') {
        if (!billerParam) return NextResponse.json({ error: 'Missing biller param' }, { status: 400 });
        const biller = TV_BILLERS[billerParam];
        if (!biller) return NextResponse.json({ error: 'Invalid TV biller' }, { status: 400 });
        return fetchBillCategories(biller.code);
    }

    // 6. Validate meter / smartcard number
    // GET /api/recharge?type=verify&item_code=XX&biller_code=BILxxx&customer=12345
    if (billType === 'verify') {
        if (!customer || !billerCode || !itemCode) {
            return NextResponse.json({ error: 'Missing required params: customer, biller_code, item_code' }, { status: 400 });
        }
        try {
            const path = `/v3/bills/validate?item_code=${itemCode}&biller_code=${billerCode}&customer=${customer}`;
            const { status, data } = await flwRequest('GET', path);
            if (status === 200 && data.status === 'success') {
                return NextResponse.json({
                    name: data.data?.name || null,
                    address: data.data?.address || null,
                    raw: data.data,
                });
            }
            return NextResponse.json({ name: null, error: data?.message || 'Could not verify' });
        } catch (err) {
            return NextResponse.json({ name: null, error: err.message });
        }
    }

    return NextResponse.json({ error: 'Invalid request parameters' }, { status: 400 });
}

// ── POST /api/recharge ────────────────────────────────────────────────────────
export async function POST(request) {
    try {
        const body = await request.json();
        const { type, phone, amount, item_code, biller_code, meter_number, smartcard_number } = body;

        if (isTestMode()) {
            return NextResponse.json({ error: 'Not supported in test mode. Switch to live keys.' }, { status: 400 });
        }

        const ref = `LAN_${type.toUpperCase()}_${Date.now()}_${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

        // Check wallet balance
        const flwBalance = await getFlutterwaveBalance();
        if (flwBalance !== null && flwBalance < Number(amount)) {
            return NextResponse.json({ error: 'Service temporarily unavailable. Please try again shortly.' }, { status: 503 });
        }

        let payload;

        if (type === 'airtime') {
            const formattedPhone = phone.startsWith('0') ? '+234' + phone.slice(1) : phone;
            payload = {
                country: 'NG',
                customer: formattedPhone,
                amount: Number(amount),
                type: 'AIRTIME',
                reference: ref,
                recurrence: 'ONCE',
                biller_code,
            };
        } else if (type === 'data') {
            const formattedPhone = phone.startsWith('0') ? '+234' + phone.slice(1) : phone;
            payload = {
                country: 'NG',
                customer: formattedPhone,
                amount: Number(amount),
                type: 'DATA_BUNDLE',
                reference: ref,
                recurrence: 'ONCE',
                biller_code,
                item_code,
            };
        } else if (type === 'electricity') {
            payload = {
                country: 'NG',
                customer: meter_number,
                amount: Number(amount),
                type: 'POWER',
                reference: ref,
                recurrence: 'ONCE',
                biller_code,
                item_code,
            };
        } else if (type === 'tv') {
            payload = {
                country: 'NG',
                customer: smartcard_number,
                amount: Number(amount),
                type: 'CABLETV',
                reference: ref,
                recurrence: 'ONCE',
                biller_code,
                item_code,
            };
        } else {
            return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
        }

        console.log('[recharge] POST payload:', JSON.stringify(payload));
        const { status, data } = await flwRequest('POST', '/v3/bills', payload);
        console.log('[recharge] POST response:', JSON.stringify(data).slice(0, 400));

        if (status !== 200 || data.status !== 'success') {
            return NextResponse.json({ error: data.message || 'Purchase failed', details: data }, { status: 400 });
        }

        const deliveryStatus = data.data?.data?.status || data.data?.status || '';
        if (deliveryStatus && deliveryStatus.toLowerCase() === 'failed') {
            return NextResponse.json({ error: 'Delivery failed. Your wallet has not been debited.' }, { status: 400 });
        }

        const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || '';
        if (baseUrl) fetch(`${baseUrl}/api/flutterwave-balance-alert`, { method: 'POST' }).catch(() => { });

        return NextResponse.json({ ref, data });

    } catch (err) {
        console.error('Recharge error:', err);
        return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
    }
}