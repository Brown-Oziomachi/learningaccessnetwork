// lib/flutterwaveToken.js
import https from 'https';

/**
 * v3: simple secret key auth (used for bills, recharges, transfers)
 */
export function getV3SecretKey() {
    const key = process.env.FLUTTERWAVE_SECRET_KEY;
    if (!key) throw new Error('Missing FLUTTERWAVE_SECRET_KEY in environment variables');
    return key;
}

/**
 * Standardized Request Helper 
 * Fixes "ECONNRESET" by explicitly setting Content-Length and keeping the socket alive.
 */
export async function flwRequest(method, path, bodyObj = null) {
    const key = getV3SecretKey();
    const bodyStr = bodyObj ? JSON.stringify(bodyObj) : '';

    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'api.flutterwave.com',
            path: path,
            method: method,
            timeout: 15000, // 15 seconds timeout
            headers: {
                'Authorization': `Bearer ${key}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Content-Length': Buffer.byteLength(bodyStr), // Prevents socket hang-up
            },
            timeout: 25000 // Extended to 25s for slow biller responses
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(data || '{}');
                    resolve({ status: res.statusCode, data: parsed });
                } catch (e) {
                    resolve({ status: res.statusCode, data: { message: "Invalid JSON response" } });
                }
            });
        });

        req.on('timeout', () => {
            req.destroy();
            reject(new Error('Flutterwave API timed out. Please try again.'));
        });

        req.on('error', (e) => reject(e));

        if (bodyStr) req.write(bodyStr);
        req.end();
    });
}

/**
 * v4: OAuth token (Only needed for specific v4 endpoints)
 */
let cachedToken = null;
let tokenExpiry = 0;

export async function getV4Token() {
    if (cachedToken && Date.now() < tokenExpiry) return cachedToken;

    const clientId = process.env.FLUTTERWAVE_CLIENT_ID;
    const clientSecret = process.env.FLUTTERWAVE_CLIENT_SECRET;

    if (!clientId || !clientSecret)
        throw new Error('Missing FLUTTERWAVE_CLIENT_ID or FLUTTERWAVE_CLIENT_SECRET');

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
    // Set expiry 30 seconds early for safety
    tokenExpiry = Date.now() + ((data.expires_in ?? 600) - 30) * 1000;
    return cachedToken;
}