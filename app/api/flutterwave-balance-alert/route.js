// app/api/flutterwave-balance-alert/route.js
import { NextResponse } from 'next/server';
import https from 'https';
import { getV3SecretKey } from '@/lib/flutterwaveToken';
import { db } from '@/lib/firebaseConfig';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

const ALERT_THRESHOLD = 50000; // ₦50,000
const ADMIN_EMAIL = process.env.ADMIN_EMAIL; // set in .env.local
const ALERT_COOLDOWN_HOURS = 6; // don't spam — max 1 alert per 6 hours

function flwRequest(method, path, secretKey) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'api.flutterwave.com',
            path,
            method,
            headers: {
                Authorization: 'Bearer ' + secretKey,
                'Content-Type': 'application/json',
                Accept: 'application/json',
            },
        };
        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', (c) => (data += c));
            res.on('end', () => {
                try { resolve({ status: res.statusCode, data: JSON.parse(data) }); }
                catch { reject(new Error('Non-JSON response')); }
            });
        });
        req.on('error', reject);
        req.end();
    });
}

async function sendAlertEmail(balance) {
    if (!ADMIN_EMAIL) return;

    // Using Flutterwave's built-in email won't work here,
    // so we use a simple fetch to your email provider.
    // If you use Resend, Sendgrid, or Nodemailer — swap this out.
    // For now this logs it and you can wire up your email provider.
    console.warn(`[FLW ALERT] Low balance alert should be emailed to ${ADMIN_EMAIL}. Balance: ₦${balance.toLocaleString()}`);

    // ── If you use Resend, uncomment and add RESEND_API_KEY to .env.local ──
    /*
    await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            from: 'noreply@lanlibrary.com',
            to: ADMIN_EMAIL,
            subject: '⚠️ LAN Library — Low Flutterwave Balance',
            html: `
                <div style="font-family:sans-serif;max-width:500px;margin:0 auto;padding:24px">
                    <h2 style="color:#1e3a5f">⚠️ Low Flutterwave Wallet Balance</h2>
                    <p>Your Flutterwave wallet balance has dropped below the ₦50,000 threshold.</p>
                    <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:12px;padding:16px;margin:16px 0">
                        <p style="margin:0;font-size:24px;font-weight:bold;color:#dc2626">
                            Current Balance: ₦${balance.toLocaleString()}
                        </p>
                    </div>
                    <p>Sellers may be unable to complete airtime and data purchases until you top up.</p>
                    <a href="https://dashboard.flutterwave.com" 
                       style="display:inline-block;background:#1e3a5f;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold">
                        Fund Flutterwave Wallet →
                    </a>
                    <p style="color:#9ca3af;font-size:12px;margin-top:24px">
                        LAN Library Admin Alert • This alert won't repeat for 6 hours
                    </p>
                </div>
            `,
        }),
    });
    */
}

export async function POST() {
    try {
        const key = getV3SecretKey();

        // 1. Fetch FLW balance
        const { status, data } = await flwRequest('GET', '/v3/balances/NGN', key);
        if (status !== 200 || data.status !== 'success') {
            return NextResponse.json({ error: 'Could not fetch balance' }, { status: 400 });
        }

        const balance = data.data?.available_balance || 0;
        const isLow = balance < ALERT_THRESHOLD;

        // 2. Save current balance to Firestore (admin panel reads this)
        const balanceRef = doc(db, 'system', 'flutterwaveBalance');
        await setDoc(balanceRef, {
            balance,
            isLow,
            threshold: ALERT_THRESHOLD,
            checkedAt: serverTimestamp(),
        }, { merge: true });

        // 3. If low, check cooldown before alerting again
        if (isLow) {
            const alertRef = doc(db, 'system', 'flutterwaveBalanceAlert');
            const alertSnap = await getDoc(alertRef);
            const lastAlertTime = alertSnap.data()?.lastAlertAt?.toMillis?.() || 0;
            const hoursSinceLast = (Date.now() - lastAlertTime) / (1000 * 60 * 60);

            if (hoursSinceLast >= ALERT_COOLDOWN_HOURS) {
                // Save alert to Firestore
                await setDoc(alertRef, {
                    balance,
                    threshold: ALERT_THRESHOLD,
                    lastAlertAt: serverTimestamp(),
                    resolved: false,
                }, { merge: true });

                // Send email
                await sendAlertEmail(balance);

                return NextResponse.json({
                    isLow: true,
                    balance,
                    alerted: true,
                    message: `Balance ₦${balance.toLocaleString()} is below ₦${ALERT_THRESHOLD.toLocaleString()} threshold. Alert sent.`,
                });
            }

            return NextResponse.json({
                isLow: true,
                balance,
                alerted: false,
                message: `Balance is low but alert already sent ${Math.floor(hoursSinceLast)}h ago.`,
            });
        }

        // 4. If balance recovered, mark alert as resolved
        const alertRef = doc(db, 'system', 'flutterwaveBalanceAlert');
        await setDoc(alertRef, { resolved: true }, { merge: true });

        return NextResponse.json({
            isLow: false,
            balance,
            message: `Balance ₦${balance.toLocaleString()} is healthy.`,
        });

    } catch (err) {
        console.error('[balance-alert] Error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}