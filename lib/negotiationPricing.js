// lib/negotiationPricing.js
export function resolveNegotiatedPrice({ neg, book, userId, bookId, checkExpiry = true, now = Date.now() }) {
    const clean = (v) => String(v || '').replace('firestore-', '');
    const fail = (m) => { const e = new Error(m); e.code = 'NEGOTIATION_INVALID'; throw e; };

    if (!neg) fail('This offer no longer exists.');
    if (neg.status === 'purchased') fail('This offer has already been used.');
    if (neg.status !== 'agreed') fail("The seller hasn't accepted this offer.");
    if (neg.buyerId !== userId) fail('This offer belongs to another account.');
    if (clean(neg.bookId) !== clean(bookId)) fail('This offer is for a different document.');
    if (checkExpiry && (!neg.expiresAtMs || neg.expiresAtMs < now)) fail('This offer has expired.');

    const list = Math.floor(Number(book.price));
    if (book.isNegotiable !== true) fail('Negotiation is not enabled for this document.');
    if (neg.sellerId !== (book.sellerId || book.userId)) fail('Seller mismatch on this offer.');

    // Recompute the floor from the BOOK, never from the negotiation doc (the client wrote that)
    const maxPct = Math.min(Math.max(Number(book.maxDiscountPercent) || 0, 0), 100);
    const floor = Math.ceil(list * (1 - maxPct / 100));
    const agreed = Math.round(Number(neg.agreedPrice));
    if (!Number.isFinite(agreed) || agreed < floor) fail('The agreed price is not valid.');
    if (agreed !== Number(neg.offeredPrice) && agreed !== Number(neg.counterPrice)) fail('The agreed price is not valid.');

    return Math.min(agreed, list);
}