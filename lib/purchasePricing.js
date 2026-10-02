// lib/purchasePricing.js   (SERVER ONLY)
//
// The webhook uses these to decide what a book SHOULD cost and whether the buyer
// really paid it. Before this, the webhook trusted whatever amount the browser sent.

const FX_TOLERANCE = 0.04; // allow 4% drift between the rate at checkout and at webhook time

// List price in NGN, read from Firestore (never from the browser).
export async function resolveListPriceNGN(adminDb, bookId, verifiedBook) {
    const id = String(bookId);
    if (id.startsWith('firestore-')) {
        const snap = await adminDb.collection('advertMyBook').doc(id.replace('firestore-', '')).get();
        const p = snap.exists ? Number(snap.data().price) : NaN;
        return Number.isFinite(p) && p > 0 ? p : null;
    }
    const p = Number(verifiedBook?.price);
    return Number.isFinite(p) && p > 0 ? p : null;
}

// Units of `currency` per 1 NGN, or null if we can't get a trustworthy live rate.
export async function getNgnRate(currency) {
    if (currency === 'NGN') return 1;
    try {
        const ctl = new AbortController();
        const timer = setTimeout(() => ctl.abort(), 5000);
        const res = await fetch('https://open.er-api.com/v6/latest/NGN', { signal: ctl.signal });
        clearTimeout(timer);
        if (!res.ok) return null;
        const data = await res.json();
        const rate = Number(data?.rates?.[currency]);
        return Number.isFinite(rate) && rate > 0 ? rate : null;
    } catch {
        return null;
    }
}

// Did the buyer pay at least the expected NGN price (in whatever currency they paid)?
export async function checkPaidEnough({ expectedNGN, paidAmount, currency }) {
    const paid = Number(paidAmount);
    if (!Number.isFinite(paid) || paid <= 0) return { ok: false, reason: 'invalid_amount' };

    if (currency === 'NGN') {
        return paid + 1 >= expectedNGN ? { ok: true } : { ok: false, reason: 'underpaid' };
    }

    const rate = await getNgnRate(currency);
    if (!rate) return { ok: false, reason: 'no_fx_rate' }; // fail closed: park it for a human
    const expectedLocal = expectedNGN * rate;
    return paid >= expectedLocal * (1 - FX_TOLERANCE)
        ? { ok: true, expectedLocal }
        : { ok: false, reason: 'underpaid', expectedLocal };
}