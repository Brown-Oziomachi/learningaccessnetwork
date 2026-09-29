// Save as: app/api/negotiations/respond/route.js
import { NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { getAdminDb } from '@/lib/firebase-admin';
import {
  DEAL_HOURS, errorResponse, hoursFromNow, httpError, isExpired,
  notificationDoc, requireUser,
} from '@/lib/negotiationServer';

const SELLER_LINK = '/my-account/seller-account/negotiations';
const BUYER_LINK = '/my-offers';

// POST { id, action, price? }
//   seller: 'accept' | 'reject' | 'counter' (price = final "last price")
//   buyer : 'buyer_accept' | 'buyer_decline'
export async function POST(request) {
  try {
    const user = await requireUser(request);
    const { id, action, price } = await request.json();
    if (!id || !action) throw httpError(400, 'Missing offer or action.');

    const db = getAdminDb();
    const ref = db.collection('negotiations').doc(String(id));

    const result = await db.runTransaction(async (txn) => {
      const snap = await txn.get(ref);
      if (!snap.exists) throw httpError(404, 'Offer not found.');
      const neg = snap.data();
      const now = FieldValue.serverTimestamp();
      const money = (n) => `₦${Number(n).toLocaleString()}`;
      const notify = (userId, title, msg, link) =>
        txn.set(db.collection('notifications').doc(), notificationDoc(userId, title, msg, link));

      /* ───── seller actions ───── */
      if (['accept', 'reject', 'counter'].includes(action)) {
        if (neg.sellerId !== user.uid) throw httpError(403, 'Only the seller can respond to this offer.');
        if (neg.status !== 'pending') throw httpError(409, 'This offer has already been answered.');
        if (isExpired(neg)) throw httpError(410, 'This offer has expired.');

        if (action === 'reject') {
          txn.update(ref, { status: 'rejected', respondedAt: now, updatedAt: now });
          notify(neg.buyerId, 'Offer declined', `The seller passed on your offer for "${neg.bookTitle}".`, BUYER_LINK);
          return { status: 'rejected' };
        }

        if (action === 'accept') {
          txn.update(ref, {
            status: 'accepted',
            finalPrice: neg.requestedPrice,
            isFinal: false,
            respondedAt: now,
            updatedAt: now,
            expiresAt: hoursFromNow(DEAL_HOURS),
          });
          notify(
            neg.buyerId,
            'Offer accepted 🎉',
            `Buy "${neg.bookTitle}" for ${money(neg.requestedPrice)}. Your price is locked for ${DEAL_HOURS} hours.`,
            `/book/preview?id=${neg.bookId}`
          );
          return { status: 'accepted', finalPrice: neg.requestedPrice };
        }

        // counter = the seller's one and only "last price"
        const last = Math.round(Number(price));
        if (!Number.isFinite(last) || last <= neg.requestedPrice || last > neg.listPrice) {
          throw httpError(
            400,
            `Your last price must be above ${money(neg.requestedPrice)} and at most ${money(neg.listPrice)}.`
          );
        }
        txn.update(ref, {
          status: 'countered',
          finalPrice: last,
          isFinal: true,
          respondedAt: now,
          updatedAt: now,
          expiresAt: hoursFromNow(DEAL_HOURS),
        });
        notify(
          neg.buyerId,
          'Seller sent a last price',
          `"${neg.bookTitle}": the seller's last price is ${money(last)}. Take it or leave it within ${DEAL_HOURS} hours.`,
          BUYER_LINK
        );
        return { status: 'countered', finalPrice: last };
      }

      /* ───── buyer actions ───── */
      if (['buyer_accept', 'buyer_decline'].includes(action)) {
        if (neg.buyerId !== user.uid) throw httpError(403, 'This is not your offer.');
        if (neg.status !== 'countered') throw httpError(409, 'There is no last price to answer.');
        if (isExpired(neg)) throw httpError(410, 'This last price has expired.');

        if (action === 'buyer_decline') {
          txn.update(ref, { status: 'declined', updatedAt: now });
          notify(neg.sellerId, 'Last price declined', `${neg.buyerName} declined your last price for "${neg.bookTitle}".`, SELLER_LINK);
          return { status: 'declined' };
        }

        // keep the original 24h window: accepting does not extend it
        txn.update(ref, { status: 'accepted', updatedAt: now });
        notify(neg.sellerId, 'Last price accepted', `${neg.buyerName} accepted ${money(neg.finalPrice)} for "${neg.bookTitle}".`, SELLER_LINK);
        return { status: 'accepted', finalPrice: neg.finalPrice };
      }

      throw httpError(400, 'Unknown action.');
    });

    return NextResponse.json({ success: true, ...result });
  } catch (err) {
    return errorResponse(err);
  }
}