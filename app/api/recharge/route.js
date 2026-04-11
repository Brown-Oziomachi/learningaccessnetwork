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
// WARNING: BIL119 = KEDC (electricity) AND DSTV (cable). These are different
// upstream systems. Always route via type=electricity-plans or type=tv-plans —
// never pass BIL119/BIL120 to the generic type=plans route for these.
const ELECTRICITY_BILLERS = {
    EKEDC: { code: 'BIL112', name: 'Eko Electric', type: 'Prepaid & Postpaid' },
    IKEDC: { code: 'BIL113', name: 'Ikeja Electric', type: 'Prepaid & Postpaid' },
    IBEDC: { code: 'BIL114', name: 'Ibadan Electric', type: 'Prepaid & Postpaid' },
    EEDC: { code: 'BIL115', name: 'Enugu Electric', type: 'Prepaid & Postpaid' },
    PHED: { code: 'BIL116', name: 'Port Harcourt Electric', type: 'Postpaid only' },
    BEDC: { code: 'BIL117', name: 'Benin Electric', type: 'Prepaid & Postpaid' },
    YEDC: { code: 'BIL118', name: 'Yola Electric', type: 'Postpaid only' },
    KEDC: { code: 'BIL119', name: 'Kaduna Electric', type: 'Prepaid & Postpaid' }, // ⚠ BIL119 shared with DSTV
    KEDCO: { code: 'BIL120', name: 'Kano Electric', type: 'Prepaid & Postpaid' }, // ⚠ BIL120 shared with GOtv
    AEDC: { code: 'BIL204', name: 'Abuja Electric', type: 'Prepaid & Postpaid' },
};

// ── TV billers ────────────────────────────────────────────────────────────────
const TV_BILLERS = {
    DSTV: { code: 'BIL119', name: 'DStv' },           // ⚠ BIL119 shared with KEDC
    GOTV: { code: 'BIL120', name: 'GOtv' },           // ⚠ BIL120 shared with KEDCO
    STARTIMES: { code: 'BIL123', name: 'StarTimes' },
    DSTV_BOX: { code: 'BIL125', name: 'DStv Box Office' },
    MYTV: { code: 'BIL128', name: 'MyTV' },
    HITV: { code: 'BIL129', name: 'HiTV' },
};

// ── Biller codes where BIL119/BIL120 are AMBIGUOUS — block generic plans call ─
// These codes belong to both electricity AND cable. The typed routes resolve
// them correctly; the generic type=plans route must reject them.
const AMBIGUOUS_CODES = new Set(['BIL119', 'BIL120']);

// ── Billers that don't support customer lookup via validate endpoint ───────────
// Only BIL119 (DSTV) and BIL120 (GOtv) are confirmed to support validation.
const VALIDATION_SUPPORTED = new Set(['BIL119', 'BIL120']);

// ── Resolve biller by key OR biller_code ──────────────────────────────────────
function resolveBiller(map, param) {
    if (!param) return null;
    if (map[param]) return map[param];
    return Object.values(map).find((b) => b.code === param) || null;
}

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

// ── Fetch plans for a biller code ────────────────────────────────────────────
async function fetchBillCategories(billerCode) {
    try {
        const path = `/v3/bill-categories?biller_code=${encodeURIComponent(billerCode)}`;
        console.log('[recharge] GET plans:', path);
        const { status, data } = await flwRequest('GET', path);

        if (status !== 200 || data.status !== 'success') {
            return NextResponse.json(
                { error: data?.message || 'Failed to fetch plans' },
                { status: 400 }
            );
        }

        const plans = (data.data || []).map((item) => ({
            id: String(item.id),
            name: item.biller_name || item.name,
            size: item.short_name || item.biller_name || item.name,
            label_name: item.label_name || null,
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

    // 1. Generic plans by biller_code — BLOCKED for ambiguous codes BIL119/BIL120
    //    Use type=tv-plans&biller=DSTV or type=electricity-plans&biller=KEDC instead.
    if (billType === 'plans') {
        if (!billerCode)
            return NextResponse.json({ error: 'Missing biller_code' }, { status: 400 });
        if (AMBIGUOUS_CODES.has(billerCode))
            return NextResponse.json(
                {
                    error: `biller_code ${billerCode} is shared between electricity and cable TV. ` +
                        `Use type=tv-plans&biller=DSTV (or GOTV) for cable, ` +
                        `or type=electricity-plans&biller=KEDC (or KEDCO) for electricity.`,
                },
                { status: 400 }
            );
        if (isTestMode())
            return NextResponse.json({ plans: [], mode: 'test' });
        return fetchBillCategories(billerCode);
    }

    // 2. Electricity biller list
    if (billType === 'electricity') {
        return NextResponse.json({
            billers: Object.entries(ELECTRICITY_BILLERS).map(([id, v]) => ({ id, ...v })),
        });
    }

    // 3. TV biller list
    if (billType === 'tv') {
        return NextResponse.json({
            billers: Object.entries(TV_BILLERS).map(([id, v]) => ({ id, ...v })),
        });
    }

    // 4. Electricity plans — resolves key OR code, always from ELECTRICITY_BILLERS
    //    GET /api/recharge?type=electricity-plans&biller=KEDC   ← use this for Kaduna
    //    GET /api/recharge?type=electricity-plans&biller=KEDCO  ← use this for Kano
    //    Never use type=plans&biller_code=BIL119 for electricity — it's ambiguous.
    if (billType === 'electricity-plans') {
        if (!billerParam)
            return NextResponse.json({ error: 'Missing biller param' }, { status: 400 });
        const biller = resolveBiller(ELECTRICITY_BILLERS, billerParam);
        if (!biller)
            return NextResponse.json(
                { error: `Unsupported electricity biller: ${billerParam}` },
                { status: 400 }
            );
        if (isTestMode())
            return NextResponse.json({ plans: [], mode: 'test' });
        return fetchBillCategories(biller.code);
    }

    // 5. TV plans — resolves key OR code, always from TV_BILLERS
    //    GET /api/recharge?type=tv-plans&biller=DSTV   ← use this for DStv
    //    GET /api/recharge?type=tv-plans&biller=GOTV   ← use this for GOtv
    //    Never use type=plans&biller_code=BIL119 for TV — it's ambiguous.
    if (billType === 'tv-plans') {
        if (!billerParam)
            return NextResponse.json({ error: 'Missing biller param' }, { status: 400 });
        const biller = resolveBiller(TV_BILLERS, billerParam);
        if (!biller)
            return NextResponse.json(
                { error: `Unsupported TV biller: ${billerParam}` },
                { status: 400 }
            );
        if (isTestMode())
            return NextResponse.json({ plans: [], mode: 'test' });
        return fetchBillCategories(biller.code);
    }

    // 6. Validate smartcard / meter number
    //    Only DSTV (BIL119) and GOtv (BIL120) reliably support customer lookup.
    //    All electricity billers skip validation gracefully.
    if (billType === 'verify') {
        if (!customer || !billerCode || !itemCode) {
            return NextResponse.json(
                { error: 'Missing required params: customer, biller_code, item_code' },
                { status: 400 }
            );
        }

        if (isTestMode()) {
            // Official test credential: DSTV smartcard 0025401100, item_code CB141
            return NextResponse.json({
                name: 'Test Account (test mode)',
                address: null,
                raw: null,
                mode: 'test',
            });
        }

        // Skip validation for billers that don't support customer lookup
        if (!VALIDATION_SUPPORTED.has(billerCode)) {
            return NextResponse.json({
                name: null,
                address: null,
                skipped: true,
                reason: 'Customer verification is not available for this provider. Your details will be confirmed at payment.',
            });
        }

        try {
            const path = `/v3/bills/validate?item_code=${encodeURIComponent(itemCode)}&biller_code=${encodeURIComponent(billerCode)}&customer=${encodeURIComponent(customer)}`;
            console.log('[recharge] GET verify:', path);
            const { status, data } = await flwRequest('GET', path);
            console.log('[verify response]', JSON.stringify(data));

            if (status === 200 && data.status === 'success') {
                return NextResponse.json({
                    name: data.data?.name || null,
                    address: data.data?.address || null,
                    raw: data.data,
                });
            }

            if (data?.message === 'Transaction not found') {
                return NextResponse.json({
                    name: null,
                    address: null,
                    skipped: true,
                    reason: 'Customer verification not available for this provider. Your details will be confirmed at payment.',
                });
            }

            return NextResponse.json(
                { name: null, error: data?.message || 'Could not verify customer' },
                { status: 400 }
            );
        } catch (err) {
            return NextResponse.json({ name: null, error: err.message }, { status: 500 });
        }
    }

    return NextResponse.json({ error: 'Invalid request parameters' }, { status: 400 });
}

// ── POST /api/recharge ────────────────────────────────────────────────────────
export async function POST(request) {
    try {
        const body = await request.json();

        const {
            type,
            phone,
            amount,
            item_code,
            biller_code,
            bundle_name,
            meter_number,
            smartcard_number,
        } = body;

        if (isTestMode()) {
            return NextResponse.json(
                { error: 'Bill payments are not supported in test mode. Switch to live keys.' },
                { status: 400 }
            );
        }

        if (!type || !amount || !biller_code) {
            return NextResponse.json(
                { error: 'Missing required fields: type, amount, biller_code' },
                { status: 400 }
            );
        }

        const ref = `LAN_${type.toUpperCase()}_${Date.now()}_${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

        const flwBalance = await getFlutterwaveBalance();
        if (flwBalance !== null && flwBalance < Number(amount)) {
            return NextResponse.json(
                { error: 'Service temporarily unavailable. Please try again shortly.' },
                { status: 503 }
            );
        }

        let payload;

        if (type === 'airtime') {
            if (!phone)
                return NextResponse.json({ error: 'Missing phone' }, { status: 400 });
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
            if (!phone)
                return NextResponse.json({ error: 'Missing phone' }, { status: 400 });
            if (!bundle_name)
                return NextResponse.json(
                    { error: 'Missing bundle_name. Pass the exact plan name from the bill categories API.' },
                    { status: 400 }
                );
            const formattedPhone = phone.startsWith('0') ? '+234' + phone.slice(1) : phone;
            payload = {
                country: 'NG',
                customer: formattedPhone,
                amount: Number(amount),
                type: bundle_name,
                reference: ref,
                recurrence: 'ONCE',
                biller_code,
                item_code,
            };

        } else if (type === 'electricity') {
            if (!meter_number)
                return NextResponse.json({ error: 'Missing meter_number' }, { status: 400 });
            if (!item_code)
                return NextResponse.json(
                    { error: 'Missing item_code. Fetch electricity plans first and pass the item_code from the chosen plan.' },
                    { status: 400 }
                );
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
            if (!smartcard_number)
                return NextResponse.json({ error: 'Missing smartcard_number' }, { status: 400 });
            if (!item_code)
                return NextResponse.json(
                    { error: 'Missing item_code. Fetch TV plans first and pass the item_code from the chosen package.' },
                    { status: 400 }
                );
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
            return NextResponse.json({ error: `Invalid type: ${type}` }, { status: 400 });
        }

        console.log('[recharge] POST payload:', JSON.stringify(payload));
        const { status, data } = await flwRequest('POST', '/v3/bills', payload);
        console.log('[recharge] POST response:', JSON.stringify(data).slice(0, 500));

        if (status !== 200 || data.status !== 'success') {
            return NextResponse.json(
                { error: data.message || 'Purchase failed', details: data },
                { status: 400 }
            );
        }

        const deliveryStatus = (
            data.data?.data?.status ||
            data.data?.status ||
            ''
        ).toLowerCase();

        if (deliveryStatus === 'failed') {
            return NextResponse.json(
                { error: 'Delivery failed. Your wallet has not been debited.' },
                { status: 400 }
            );
        }

        const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || '';
        if (baseUrl) {
            fetch(`${baseUrl}/api/flutterwave-balance-alert`, { method: 'POST' }).catch(() => { });
        }

        return NextResponse.json({
            ref,
            data,
            tx_ref: data.data?.tx_ref || null,
        });

    } catch (err) {
        console.error('[recharge] POST error:', err);
        return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
    }
}
