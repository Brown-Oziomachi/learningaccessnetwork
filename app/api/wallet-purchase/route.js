import { getAdminDb, admin } from '@/lib/firebase-admin';
import { NextResponse } from 'next/server';
import { resolveNegotiatedPrice } from '@/lib/negotiationPricing';

export async function POST(request) {
    try {
        const adminDb = getAdminDb();

        const idToken = request.headers.get('authorization')?.replace('Bearer ', '');
        if (!idToken) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        let userId;
        try {
            ({ uid: userId } = await admin.auth().verifyIdToken(idToken));
        } catch {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const {
            bookId,
            bookTitle,
            email,
            name,
            extraData,
            pin,
        } = await request.json();

        // ── 1. Validate required fields ───────────────────────────────────
        if (!userId || !bookId || !pin) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const cleanBookId = bookId.replace('firestore-', '').replace(/\s+/g, '').trim();
        const sanitizedBookId = bookId.replace(/\s+/g, '').trim();

        const buyerWalletRef = adminDb.collection('sellers').doc(userId);
        const buyerUserRef = adminDb.collection('users').doc(userId);

        const txRef = `WAL-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const txDocRef = adminDb.collection('transactions').doc(txRef);

        const result = await adminDb.runTransaction(async (transaction) => {

            // ── 2. Idempotency Check ──────────────────────────────────────
            const txSnap = await transaction.get(txDocRef);
            if (txSnap.exists) return { duplicate: true };

            // ── 3. Fetch book details safely from Firestore ────────────────
            let bookRef = adminDb.collection('advertMyBook').doc(cleanBookId);
            let bookSnap = await transaction.get(bookRef);

            if (!bookSnap.exists) {
                bookRef = adminDb.collection('advertMyBook').doc(sanitizedBookId);
                bookSnap = await transaction.get(bookRef);
            }

            if (!bookSnap.exists) {
                let booksQuery = await adminDb.collection('advertMyBook').where('id', '==', cleanBookId).limit(1).get();
                if (booksQuery.empty) {
                    booksQuery = await adminDb.collection('advertMyBook').where('firestoreId', '==', cleanBookId).limit(1).get();
                }
                if (booksQuery.empty) {
                    booksQuery = await adminDb.collection('advertMyBook').where('id', '==', bookId).limit(1).get();
                }

                if (!booksQuery.empty) {
                    bookSnap = booksQuery.docs[0];
                    bookRef = bookSnap.ref;
                }
            }

            if (!bookSnap.exists) {
                return { errorStatus: 'BOOK_NOT_FOUND', message: 'The requested book could not be found.' };
            }

           
            // 🔒 SECURITY FIX: Override client-passed price completely. Use verified database value.
            const bookRecord = bookSnap.data();

            const negIdIn = extraData?.negotiationId ? String(extraData.negotiationId) : null;
            const negRef = negIdIn ? adminDb.collection('negotiations').doc(negIdIn) : null;
            const negSnap = negRef ? await transaction.get(negRef) : null;   // must stay before any write

            let verifiedPrice = Math.floor(Number(bookRecord?.price || bookRecord?.amount));
            if (negRef) {
                try {
                    verifiedPrice = resolveNegotiatedPrice({
                        neg: negSnap.exists ? negSnap.data() : null,
                        book: bookRecord, userId, bookId: cleanBookId,
                    });
                } catch (e) {
                    return { errorStatus: 'NEGOTIATION_INVALID', message: e.message };
                }
            }
            if (isNaN(verifiedPrice) || verifiedPrice <= 0) {
                return { errorStatus: 'INVALID_PRICE', message: '...' };
            }

            const realSellerId = bookRecord?.sellerId || bookRecord?.userId;
            if (!realSellerId) {
                return { errorStatus: 'VENDOR_NOT_FOUND', message: 'This book does not have a registered vendor.' };
            }
            if (realSellerId === userId) {
                return { errorStatus: 'SELF_PURCHASE', message: 'You cannot purchase your own uploaded asset.' };
            }

            const sellerWalletRef = adminDb.collection('sellers').doc(realSellerId);

            // ── 4. Fetch buyer wallet to verify PIN & Balance ──────────────
            const buyerWalletSnap = await transaction.get(buyerWalletRef);
            if (!buyerWalletSnap.exists) {
                return { errorStatus: 'WALLET_NOT_FOUND', message: 'Your spending wallet profile is not set up.' };
            }

            const buyerWalletData = buyerWalletSnap.data();
            const storedPin = buyerWalletData.transactionPin || buyerWalletData.transferPin;

            // ── 5. Verify PIN ─────────────────────────────────────────────
            if (!storedPin) {
                return { errorStatus: 'PIN_NOT_SET', message: 'PIN_NOT_SET' };
            }
            if (pin.toString().trim() !== storedPin.toString().trim()) {
                return { errorStatus: 'INVALID_PIN', message: 'Incorrect PIN. Please try again.' };
            }

            // ── 6. Check spending capacity ────────────────────────────────
            const currentBuyerBalance = buyerWalletData.accountBalance || 0;
            if (currentBuyerBalance < verifiedPrice) {
                return { errorStatus: 'INSUFFICIENT_FUNDS', message: `Insufficient funds. Balance: ₦${currentBuyerBalance.toLocaleString()}` };
            }

            // ── 7. Check double-purchase ──────────────────────────────────
            const buyerUserSnap = await transaction.get(buyerUserRef);
            if (buyerUserSnap.exists) {
                const userData = buyerUserSnap.data();
                if (userData?.purchasedBooks && typeof userData.purchasedBooks === 'object') {
                    if (userData.purchasedBooks[bookId] || userData.purchasedBooks[cleanBookId]) {
                        return { errorStatus: 'ALREADY_OWNED', message: 'You already own this book.' };
                    }
                }
            }

            // ── 8. Calculate Split ────────────────────────────────────────
            const platformFee = Math.floor(verifiedPrice * 0.20);
            const sellerAmount = verifiedPrice - platformFee;

            // ── 9. Execute Wallet Balance Shifts Atomically ──────────────
            transaction.update(buyerWalletRef, {
                accountBalance: admin.firestore.FieldValue.increment(-verifiedPrice),
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            });

            transaction.set(sellerWalletRef, {
                accountBalance: admin.firestore.FieldValue.increment(sellerAmount),
                totalEarnings: admin.firestore.FieldValue.increment(sellerAmount),
                booksSold: admin.firestore.FieldValue.increment(1),
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            }, { merge: true });

            if (negRef) {
                transaction.update(negRef, {
                    status: 'purchased',
                    purchasedAtMs: Date.now(),
                    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                });
            }

            // ── 10. Grant access ──────────────────────────────────────────
            const purchasePayload = {
                id: bookId,
                title: bookTitle || bookRecord.title || 'Book',
                purchasedAt: new Date().toISOString(),
                amount: verifiedPrice,
                transactionRef: txRef,
            };

            if (buyerUserSnap.exists) {
                transaction.update(buyerUserRef, {
                    [`purchasedBooks.${cleanBookId}`]: purchasePayload,
                    [`purchasedBooks.${bookId}`]: purchasePayload
                });
            } else {
                transaction.set(buyerUserRef, {
                    purchasedBooks: { [cleanBookId]: purchasePayload }
                }, { merge: true });
            }

            // ── 11. Write Ledger Record ───────────────────────────────────
            transaction.set(txDocRef, {
                transactionId: txRef,
                transactionRef: txRef,
                buyerId: userId,
                userId,
                sellerId: realSellerId,
                buyerEmail: email || null,
                buyerName: name || null,
                buyerPhone: buyerWalletData.phone || null,
                bookId,
                bookTitle: bookTitle || bookRecord.title || null,
                amount: verifiedPrice,
                platformFee,
                sellerAmount,
                exchangeRateUsed: 1,
                currency: 'NGN',
                type: 'wallet_purchase',
                status: 'completed',
                paymentMethod: 'lan_wallet',
                studentRegNo: extraData?.studentRegNo || null,
                department: extraData?.department || null,
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
            });

            return { success: true, duplicate: false, txRef };
        });

        if (result.errorStatus) {
            return NextResponse.json({ error: result.message }, { status: 400 });
        }

        if (result.duplicate) {
            return NextResponse.json({ message: 'Transaction already processed', txRef: result.txRef }, { status: 200 });
        }

        return NextResponse.json({ success: true, txRef: result.txRef }, { status: 200 });

    } catch (error) {
        console.error("TRANSACTION EXCEPTION:", error);
        return NextResponse.json(
            { error: 'Wallet purchase failure encountered.' },
            { status: 500 }
        );
    }
}