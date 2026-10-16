// app/api/recharge/route.js
import { NextResponse } from 'next/server';
import https from 'https';
import { getV3SecretKey } from '@/lib/flutterwaveToken';
import { adminDb, adminAuth } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

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

const NETWORK_MATCH = {
    MTN: /mtn/i,
    AIRTEL: /airtel/i,
    GLO: /\bglo\b/i,
    '9MOBILE': /9mobile|etisalat/i,
};
let airtimeCache = { at: 0, items: [] };

// Nigerian airtime billers (from your own account's list)
const NG_AIRTIME_BILLERS = new Set(['BIL099', 'BIL100', 'BIL102', 'BIL103']);

async function getAirtimeItem(network) {
    const re = NETWORK_MATCH[network];
    if (!re) return null;

    if (!airtimeCache.items.length || Date.now() - airtimeCache.at > 60 * 60 * 1000) {
        const { status, data } = await flwRequest('GET', '/v3/bill-categories?airtime=1');
        if (status === 200 && data.status === 'success') {
            airtimeCache = {
                at: Date.now(),
                items: (data.data || []).filter((i) => i.is_airtime === true && NG_AIRTIME_BILLERS.has(i.biller_code)),
            };
        }
    }
    const matches = airtimeCache.items.filter((i) => re.test(`${i.short_name} ${i.name} ${i.biller_name}`));
    const pick = matches.find((i) => i.biller_code !== 'BIL099') || matches.find((i) => i.biller_code === 'BIL099') || null;
    console.log('[recharge] airtime pick:', network, pick && `${pick.biller_code}/${pick.item_code}/${pick.short_name}`);
    return pick;
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
    // 1. Auth
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    let uid;
    try { ({ uid } = await adminAuth.verifyIdToken(token)); }
    catch { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }); }

    const sellerRef = adminDb.collection('sellers').doc(uid);
    const privRef = adminDb.collection('sellerPrivate').doc(uid);
    let reserved = 0;       // wallet amount to refund if delivery fails
    let cardTxRef = null;   // card payment to flag if delivery fails

    const fail = async (message, status = 400, details) => {
        if (reserved) await sellerRef.update({ accountBalance: FieldValue.increment(reserved) }).catch(console.error);
        if (cardTxRef) {
            await adminDb.collection('cardPayments').doc(cardTxRef)
                .set({ status: 'paid_not_delivered', error: message }, { merge: true }).catch(console.error);
            message += ` Your card payment (${cardTxRef}) was received. Contact support to retry or refund.`;
        }
        return NextResponse.json({ error: message, ...(details ? { details } : {}) }, { status });
    };

    try {
        const body = await request.json();
        const {
            type, phone, amount, item_code, biller_code, bundle_name,
            meter_number, smartcard_number, paymentMethod, txRef, transactionId, network, plan,
        } = body;

        if (isTestMode())
            return NextResponse.json({ error: 'Bill payments are not supported in test mode. Switch to live keys.' }, { status: 400 });

        const amt = Number(amount);
        if (!type || !biller_code || !Number.isFinite(amt) || amt <= 0)
            return NextResponse.json({ error: 'Missing required fields: type, amount, biller_code' }, { status: 400 });
        if (type === 'airtime' && amt < 50)
            return NextResponse.json({ error: 'Minimum airtime is ₦50' }, { status: 400 });
        if (type === 'electricity' && amt < 500)
            return NextResponse.json({ error: 'Minimum electricity purchase is ₦500' }, { status: 400 });

        // 2. Validate input and build the Flutterwave payload BEFORE taking any money
             const ref = `LAN_${type.toUpperCase()}_${Date.now()}_${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
        const fmtPhone = (p) => (p?.startsWith('0') ? '+234' + p.slice(1) : p);

        if (!['airtime', 'data', 'electricity', 'tv'].includes(type))
            return NextResponse.json({ error: `Invalid type: ${type}` }, { status: 400 });
        if ((type === 'airtime' || type === 'data') && !phone)
            return NextResponse.json({ error: 'Missing phone' }, { status: 400 });
        if (type === 'data' && !item_code)
            return NextResponse.json({ error: 'Missing item_code' }, { status: 400 });
        if (type === 'electricity' && (!meter_number || !item_code))
            return NextResponse.json({ error: 'Missing meter_number or item_code' }, { status: 400 });
        if (type === 'tv' && (!smartcard_number || !item_code))
            return NextResponse.json({ error: 'Missing smartcard_number or item_code' }, { status: 400 });

        let itemCode = item_code;
let payBiller = biller_code;
if (type === 'airtime') {
    const it = await getAirtimeItem(network);
    if (!it)
        return NextResponse.json({ error: 'Airtime is unavailable for this network right now.' }, { status: 503 });
    itemCode = it.item_code;
    payBiller = it.biller_code;   // the AIRTIME biller, not the data biller
}

        const customerId =
            type === 'airtime' || type === 'data' ? fmtPhone(phone)
            : type === 'electricity' ? meter_number
            : smartcard_number;

        const payload = { country: 'NG', customer_id: customerId, amount: amt, reference: ref };
const billPath = `/v3/billers/${encodeURIComponent(payBiller)}/items/${encodeURIComponent(itemCode)}/payment`;
        // 3. Take payment
        if (paymentMethod === 'card') {
            if (!txRef || !transactionId)
                return NextResponse.json({ error: 'Missing card payment reference' }, { status: 400 });

            const v = await flwRequest('GET', `/v3/transactions/${encodeURIComponent(transactionId)}/verify`);
            const d = v.data?.data;
            if (v.status !== 200 || v.data?.status !== 'success' || d?.status !== 'successful' ||
                d.tx_ref !== txRef || d.currency !== 'NGN' || Number(d.amount) < amt)
                return NextResponse.json({ error: 'Card payment could not be verified.' }, { status: 400 });

            // a payment reference can only be used once
            const payRef = adminDb.collection('cardPayments').doc(String(txRef));
            try {
                await adminDb.runTransaction(async (t) => {
    const snap = await t.get(payRef);
    if (snap.exists) {
        const prev = snap.data();
        // only the same user may retry, and only if delivery had failed
        if (prev.uid !== uid || prev.status !== 'paid_not_delivered') throw new Error('DUPLICATE');
        t.set(payRef, { status: 'processing', retriedAt: FieldValue.serverTimestamp() }, { merge: true });
    } else {
        t.set(payRef, { uid, amount: Number(d.amount), transactionId: String(transactionId), status: 'processing', createdAt: FieldValue.serverTimestamp() });
    }
});
            } catch (e) {
                if (e.message === 'DUPLICATE') return NextResponse.json({ error: 'This payment has already been used.' }, { status: 409 });
                throw e;
            }
            cardTxRef = String(txRef);
        } else {
            // wallet: needs a PIN verified in the last 2 minutes, then debit atomically
            try {
                await adminDb.runTransaction(async (t) => {
                    const [s, p] = await Promise.all([t.get(sellerRef), t.get(privRef)]);
                    if (Date.now() - (p.data()?.pinVerifiedAt || 0) > 120000) throw new Error('PIN_REQUIRED');
                    if ((s.data()?.accountBalance || 0) < amt) throw new Error('INSUFFICIENT');
                    t.update(sellerRef, { accountBalance: FieldValue.increment(-amt), updatedAt: FieldValue.serverTimestamp() });
                    t.set(privRef, { pinVerifiedAt: 0 }, { merge: true }); // one PIN = one purchase
                });
            } catch (e) {
                if (e.message === 'PIN_REQUIRED') return NextResponse.json({ error: 'PIN confirmation expired. Please enter your PIN again.' }, { status: 403 });
                if (e.message === 'INSUFFICIENT') return NextResponse.json({ error: 'Insufficient wallet balance.' }, { status: 400 });
                throw e;
            }
            reserved = amt;
        }

        // 4. Deliver (refund / flag on any failure)
             // 4. Deliver
        const flwBalance = await getFlutterwaveBalance();
        if (flwBalance !== null && flwBalance < amt)
            return fail('Service temporarily unavailable. Please try again shortly.', 503);

        const rechargeRef = adminDb.collection('recharges').doc();
        let status, data;
        try {
            ({ status, data } = await flwRequest('POST', billPath, payload));
        } catch (e) {
            // network error or timeout: the outcome is UNKNOWN. Do not refund automatically.
            console.error('[recharge] FLW call threw:', e.message);
            await rechargeRef.set({
                sellerId: uid, type, amount: amt, ourReference: ref,
                paymentMethod: cardTxRef ? 'card' : 'wallet', ...(cardTxRef ? { cardTxRef } : {}),
                status: 'needs_review', createdAt: FieldValue.serverTimestamp(),
            });
            reserved = 0; cardTxRef = null; // keep the money held; do not refund or flag
            return NextResponse.json({ ref, status: 'pending', rechargeId: rechargeRef.id, message: 'Your request is being confirmed.' });
        }
        console.error('[recharge] FLW bills ->', status, JSON.stringify(data).slice(0, 800));

        const flwStatus = String(data?.status || '').toLowerCase();
        if (!(status === 200 && (flwStatus === 'success' || flwStatus === 'pending'))) {
            if (status >= 400 && status < 500)   // definite rejection: safe to refund
                return fail(data?.message || `Provider error (${status}). Please try again.`, 400, data);
            // 5xx: unknown outcome, same as a timeout
            await rechargeRef.set({
                sellerId: uid, type, amount: amt, ourReference: ref,
                paymentMethod: cardTxRef ? 'card' : 'wallet', ...(cardTxRef ? { cardTxRef } : {}),
                status: 'needs_review', flwResponse: data, createdAt: FieldValue.serverTimestamp(),
            });
            reserved = 0; cardTxRef = null;
            return NextResponse.json({ ref, status: 'pending', rechargeId: rechargeRef.id, message: 'Your request is being confirmed.' });
        }

        // Flutterwave accepted the request. From here a later error must never refund or flag.
        const paidByCard = cardTxRef;
        reserved = 0;
        cardTxRef = null;

// top-level "success" only means "request accepted". Treat as delivered
// only if the provider explicitly says so.
const inner = String(data?.data?.status || '').toLowerCase();
const delivered = flwStatus === 'success' && /^(success|successful|completed|delivered)$/.test(inner);
const finalStatus = delivered ? 'completed' : 'pending';

        try {
            const seller = (await sellerRef.get()).data() || {};
            await rechargeRef.set({
                sellerId: uid,
                sellerName: seller.businessInfo?.businessName || seller.bankDetails?.accountName || 'Unknown',
                type, network: network || null,
                phone: phone ? String(phone).replace(/\D/g, '') : null,
                amount: amt,
                plan: plan ? { name: plan.name || null, size: plan.size || null } : null,
                ourReference: ref,
                flwReference: data?.data?.reference || null,
                flwTxRef: data?.data?.tx_ref || null,
                flwResponse: data, status: finalStatus,
                paymentMethod: paidByCard ? 'card' : 'wallet',
                ...(paidByCard ? { cardTxRef: paidByCard } : {}),
                createdAt: FieldValue.serverTimestamp(),
            });
            if (paidByCard)
                await adminDb.collection('cardPayments').doc(paidByCard).set({ status: finalStatus, flwReference: ref }, { merge: true });
        } catch (e) {
            console.error('[recharge] ACCEPTED BUT NOT RECORDED', ref, JSON.stringify(data).slice(0, 800), e.message);
            return NextResponse.json({ ref, status: 'pending', message: 'Your request is being confirmed.' });
        }

        const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || '';
        if (baseUrl) fetch(`${baseUrl}/api/flutterwave-balance-alert`, { method: 'POST' }).catch(() => {});

        return NextResponse.json({ ref, status: finalStatus, rechargeId: rechargeRef.id });
    } catch (err) {
        console.error('[recharge] POST error:', err);
        return fail(err.message || 'Server error', 500);
    }
}
