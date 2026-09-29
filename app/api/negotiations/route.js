// Save as: app/api/negotiations/route.js
import { NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { getAdminDb } from '@/lib/firebase-admin';
import {
    ACTIVE, MAX_OFFERS_PER_BOOK, PENDING_HOURS,
    cleanBookId, clampDiscount, errorResponse, hoursFromNow, httpError,
    isExpired, notificationDoc, offerFloor, requireUser,
} from '@/lib/negotiationServer';

// POST { bookId, offer, message }  ->  buyer sends ONE offer
export async function POST(request) {
    try {
        const user = await requireUser(request);
        const { bookId: rawId, offer, message } = await request.json();
        const bookId = cleanBookId(rawId);
        if (!bookId) throw httpError(400, 'Missing book.');

        const db = getAdminDb();

        const result = await db.runTransaction(async (txn) => {
            // ---------- ALL READS FIRST ----------
            const bookSnap = await txn.get(db.collection('advertMyBook').doc(bookId));
            if (!bookSnap.exists) throw httpError(404, 'Book not found.');
            const book = bookSnap.data();

            const price = Number(book.price) || 0;
            const sellerId = book.sellerId || book.userId;
            if (book.status !== 'approved' || book.isFree || price <= 0) {
                throw httpError(400, 'This book is not open for negotiation.');
            }
            if (book.isNegotiable !== true) {
                throw httpError(400, 'The seller has not enabled negotiation for this book.');
            }
            if (!sellerId || sellerId === user.uid) {
                throw httpError(400, "You can't negotiate on your own book.");
            }

            const maxDiscount = clampDiscount(book.maxDiscountPercent);
            const floor = offerFloor(price, maxDiscount);
            const amount = Math.round(Number(offer));
            if (!Number.isFinite(amount)) throw httpError(400, 'Enter a valid offer.');
            if (amount >= price) {
                throw httpError(400, 'Your offer must be below the listed price. You can buy at the listed price instead.');
            }
            if (amount < floor) {
                throw httpError(400, `This seller only considers offers from ₦${floor.toLocaleString()} upward.`);
            }

            const prior = await txn.get(
                db.collection('negotiations')
                    .where('buyerId', '==', user.uid)
                    .where('bookId', '==', bookId)
            );
            const rows = prior.docs.map((d) => d.data());
            if (rows.some((n) => ACTIVE.includes(n.status) && !isExpired(n))) {
                throw httpError(409, 'You already have an open offer on this book.');
            }
            if (rows.length >= MAX_OFFERS_PER_BOOK) {
                throw httpError(429, 'You have used all your offers for this book.');
            }

            // ---------- WRITES ----------
            const buyerName = user.name || (user.email || '').split('@')[0] || 'A student';
            const ref = db.collection('negotiations').doc();
            txn.set(ref, {
                bookId,
                bookTitle: book.bookTitle || book.title || 'Untitled',
                bookIntent: book.intent || null,
                sellerId,
                buyerId: user.uid,
                buyerName,
                listPrice: price,
                requestedPrice: amount,
                message: String(message || '').trim().slice(0, 200),
                status: 'pending',
                finalPrice: null,
                isFinal: false,
                createdAt: FieldValue.serverTimestamp(),
                updatedAt: FieldValue.serverTimestamp(),
                expiresAt: hoursFromNow(PENDING_HOURS),
            });

            txn.set(
                db.collection('notifications').doc(),
                notificationDoc(
                    sellerId,
                    'New price offer',
                    `${buyerName} offered ₦${amount.toLocaleString()} for "${book.bookTitle || book.title}" (listed ₦${price.toLocaleString()}).`,
                    '/my-account/seller-account/negotiations'
                )
            );

            return { id: ref.id };
        });

        return NextResponse.json({ success: true, ...result });
    } catch (err) {
        return errorResponse(err);
    }
}