// lib/flutterwaveToken.js
// Flutterwave dual-auth helper:
// - v3 secret key  → used for bills, transfers (recharge, airtime, data)
// - v4 OAuth token → only if you specifically need v4 endpoints in future

import https from 'https';

// ── v3: simple secret key auth (for bills, transfers) ─────────────────────────
export function getV3SecretKey() {
    const key = process.env.FLUTTERWAVE_SECRET_KEY;
    if (!key) throw new Error('Missing FLUTTERWAVE_SECRET_KEY in .env.local');
    return key;
}

// ── v4: OAuth token (only needed for v4-specific endpoints) ───────────────────
let cachedToken = null;
let tokenExpiry = 0;

export async function getV4Token() {
    if (cachedToken && Date.now() < tokenExpiry) return cachedToken;

    const clientId = process.env.FLUTTERWAVE_CLIENT_ID;
    const clientSecret = process.env.FLUTTERWAVE_CLIENT_SECRET;
    if (!clientId || !clientSecret)
        throw new Error('Missing FLUTTERWAVE_CLIENT_ID or FLUTTERWAVE_CLIENT_SECRET in .env.local');

    const body = new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: 'client_credentials',
    }).toString();

    const raw = await new Promise((resolve, reject) => {
        const req = https.request(
            {
                hostname: 'idp.flutterwave.com',
                path: '/realms/flutterwave/protocol/openid-connect/token',
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Content-Length': Buffer.byteLength(body),
                },
            },
            (res) => {
                let d = '';
                res.on('data', (c) => (d += c));
                res.on('end', () => resolve(d));
            }
        );
        req.on('error', reject);
        req.write(body);
        req.end();
    });

    const data = JSON.parse(raw);
    if (!data.access_token) throw new Error(data.error_description || 'Failed to get v4 token');

    cachedToken = data.access_token;
    tokenExpiry = Date.now() + ((data.expires_in ?? 600) - 30) * 1000;
    return cachedToken;
}