import { NextResponse } from 'next/server';

const BILLER_CODES = {
    MTN: 'BIL108',
    AIRTEL: 'BIL110',
    GLO: 'BIL109',
    '9MOBILE': 'BIL111',
};

const MOCK_PLANS = [
    { id: '100MB', name: '100MB - 1 Day', size: '100MB', price: 100, item_code: 'TEST_100MB', },
    { id: '200MB', name: '200MB - 3 Days', size: '200MB', price: 200, item_code: 'TEST_200MB', },
    { id: '1GB', name: '1GB - 30 Days', size: '1GB', price: 500, item_code: 'TEST_1GB', },
    { id: '2GB', name: '2GB - 30 Days', size: '2GB', price: 1000, item_code: 'TEST_2GB', },
    { id: '5GB', name: '5GB - 30 Days', size: '5GB', price: 2000, item_code: 'TEST_5GB', },
    { id: '10GB', name: '10GB - 30 Days', size: '10GB', price: 3500, item_code: 'TEST_10GB', },
];

const isTestMode = () => process.env.FLW_SECRET_KEY?.includes('FLWSECK_TEST');

// ── GET /api/recharge?network=MTN → data plans ────────────────────────────
export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const network = searchParams.get('network')?.toUpperCase();

    if (!network || !BILLER_CODES[network]) {
        return NextResponse.json({ error: 'Invalid network' }, { status: 400 });
    }

    // Test mode → return mock plans instantly
    if (isTestMode()) {
        const plans = MOCK_PLANS.map(p => ({
            ...p,
            biller_code: BILLER_CODES[network],
        }));
        return NextResponse.json({ plans, mode: 'test' });
    }

    // Live mode → fetch real plans from Flutterwave
    try {
        const res = await fetch(
            `https://api.flutterwave.com/v3/bill-items?biller_code=${BILLER_CODES[network]}&type=data_bundle`,
            {
                headers: {
                    'Authorization': `Bearer ${process.env.FLW_SECRET_KEY}`,
                    'Content-Type': 'application/json',
                },
            }
        );
        const data = await res.json();

        if (!res.ok || data.status !== 'success') {
            return NextResponse.json(
                { error: data.message || 'Failed to fetch plans' },
                { status: 400 }
            );
        }

        const plans = (data.data?.bill_items || []).map(item => ({
            id: item.item_code,
            name: item.name,
            size: item.name,
            price: Number(item.amount),
            item_code: item.item_code,
            biller_code: BILLER_CODES[network],
        }));

        return NextResponse.json({ plans });

    } catch (err) {
        console.error('Fetch plans error:', err);
        return NextResponse.json({ error: 'Failed to fetch plans' }, { status: 500 });
    }
}

// ── POST /api/recharge → buy airtime or data ──────────────────────────────
export async function POST(request) {
    try {
        const body = await request.json();
        const { type, phone, amount, network, item_code, biller_code } = body;

        // Normalize to +234 format
        const formattedPhone = phone.startsWith('0')
            ? '+234' + phone.slice(1)
            : phone.startsWith('234')
                ? '+' + phone
                : phone;

        const ref = `LAN_${type.toUpperCase()}_${Date.now()}_${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

        // ── Test mode: simulate success without hitting Flutterwave ──
        if (isTestMode()) {
            console.log(`[TEST MODE] Simulating ${type} purchase: ${formattedPhone} ₦${amount}`);
            return NextResponse.json({
                ref,
                data: {
                    status: 'success',
                    message: `[TEST] ${type === 'airtime' ? 'Airtime' : 'Data'} purchase simulated successfully`,
                    data: {
                        phone_number: formattedPhone,
                        amount: Number(amount),
                        network,
                        reference: ref,
                        type: type === 'airtime' ? 'AIRTIME' : item_code,
                    },
                },
            });
        }

        // ── Live mode: real Flutterwave call ──
        const payload = type === 'airtime'
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

        console.log('Flutterwave payload:', JSON.stringify(payload));

        const res = await fetch('https://api.flutterwave.com/v3/bills', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.FLW_SECRET_KEY}`,
            },
            body: JSON.stringify(payload),
        });

        const data = await res.json();
        console.log('Flutterwave response:', JSON.stringify(data));

        if (!res.ok || data.status !== 'success') {
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