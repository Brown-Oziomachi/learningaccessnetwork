// Shared PayPal helper: lib/paypal.js
// ────────────────────────────────────
export async function getAccessToken() {
    const creds = Buffer.from(`${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`).toString("base64");
    const res = await fetch(`${process.env.PAYPAL_BASE_URL}/v1/oauth2/token`, {
        method: "POST",
        headers: { Authorization: `Basic ${creds}`, "Content-Type": "application/x-www-form-urlencoded" },
        body: "grant_type=client_credentials",
    });
    const data = await res.json();
    return data.access_token;
}