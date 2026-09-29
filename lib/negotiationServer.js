// Save as: lib/negotiationServer.js   (SERVER ONLY, never import in a "use client" file)
import { NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { getAdminDb } from '@/lib/firebase-admin'; // adjust path if yours differs

export const PENDING_HOURS = 48;       // seller has 48h to answer an offer
export const DEAL_HOURS = 24;          // an accepted / last price stays valid for 24h
export const MAX_OFFERS_PER_BOOK = 3;  // per buyer, per book, ever
export const DEFAULT_MAX_DISCOUNT = 20;
export const ACTIVE = ['pending', 'countered', 'accepted'];

export function httpError(status, message) {
    const e = new Error(message);
    e.status = status;
    return e;
}

export function errorResponse(err) {
    if (!err.status) console.error('[negotiation]', err);
    return NextResponse.json(
        { error: err.status ? err.message : 'Something went wrong. Please try again.' },
        { status: err.status || 500 }
    );
}

export async function requireUser(request) {
    const header = request.headers.get('authorization') || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) throw httpError(401, 'Please sign in first.');
    getAdminDb(); // makes sure the admin app is initialised
    try {
        return await getAuth().verifyIdToken(token);
    } catch {
        throw httpError(401, 'Your session expired. Please sign in again.');
    }
}

export const cleanBookId = (id = '') => String(id).replace(/^firestore-/, '');
export const hoursFromNow = (h) => Timestamp.fromMillis(Date.now() + h * 3600 * 1000);
export const isExpired = (neg) => !!neg.expiresAt && neg.expiresAt.toMillis() < Date.now();
export const offerFloor = (price, maxDiscount) => Math.ceil(price * (1 - maxDiscount / 100));

export function clampDiscount(v) {
    const n = Number(v);
    if (!Number.isFinite(n)) return DEFAULT_MAX_DISCOUNT;
    return Math.min(50, Math.max(5, Math.round(n)));
}

export function notificationDoc(userId, title, message, link) {
    return {
        userId,
        type: 'negotiation',
        title,
        message,
        link,
        createdAt: FieldValue.serverTimestamp(),
        read: false,
    };
}

/* ───────────────────────────────────────────────────────────────────────────
   CHECKOUT HELPERS: call these from your payment webhook / wallet-purchase route.
   The price a buyer must pay is decided HERE, on the server, never by the browser.
   ─────────────────────────────────────────────────────────────────────────── */

// Read-only. Returns null unless the buyer holds a valid, unexpired, agreed price.
export async function getPayableNegotiation(db, { negotiationId, buyerId, bookId }) {
    if (!negotiationId) return null;
    const snap = await db.collection('negotiations').doc(String(negotiationId)).get();
    if (!snap.exists) return null;
    const neg = snap.data();
    if (neg.buyerId !== buyerId) return null;
    if (neg.bookId !== cleanBookId(bookId)) return null;
    if (neg.status !== 'accepted' || isExpired(neg)) return null;
    return { ref: snap.ref, id: snap.id, finalPrice: Number(neg.finalPrice) };
}

// listPrice = the price stored on the book doc RIGHT NOW (never trust the client).
export const expectedPrice = (listPrice, deal) =>
    deal ? Math.min(deal.finalPrice, listPrice) : listPrice;

// writer = a Firestore transaction or write batch.
export function consumeNegotiation(writer, deal, extra = {}) {
    writer.update(deal.ref, {
        status: 'used',
        usedAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
        ...extra,
    });
}