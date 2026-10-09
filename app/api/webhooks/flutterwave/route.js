import { NextResponse, after } from 'next/server';
import { calculatePaymentDistribution } from '@/utils/paymentProcessor';
import { sendServerNotification, notifyUser } from '@/lib/notificationEngine';
import { serverFetchBookDetails } from '@/lib/serverBookUtils';
import { adminDb, admin } from '@/lib/firebase-admin';
import { resolveNegotiatedPrice } from '@/lib/negotiationPricing';

const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'https://lanlibrary.com';
const maskEmail = (e = '') => e.replace(/^(.).*(@.*)$/, '$1***$2');
// units of `currency` per 1 NGN
async function getNgnRate(currency) {
    const res = await fetch('https://open.er-api.com/v6/latest/NGN');
    if (!res.ok) throw new Error('rate fetch failed');
    const r = (await res.json())?.rates?.[currency];
    if (!r) throw new Error(`no rate for ${currency}`);
    return r;
}

export async function POST(request) {
    try {
        const payload = await request.json();

        // ── 1. Verify Webhook Authenticity ────────────────────────────────────
        const signature = request.headers.get('verif-hash');
        const secretHash = process.env.FLUTTERWAVE_SECRET_HASH;

        if (!signature || signature !== secretHash) {
            console.error(' Security Breach: Invalid webhook signature');
            return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
        }

        // ── 2. Filter Operational Event Types ────────────────────────────────
        if (payload.event !== 'charge.completed' || payload.data.status !== 'successful') {
            return NextResponse.json({ message: 'Event ignored' }, { status: 200 });
        }

        const paymentData = payload.data;
        const { tx_ref, customer, amount, currency } = paymentData;
        const metadata = paymentData.meta || paymentData.metadata || {};

        /* ══════════════════════════════════════════════════════════
            ROUTE A: AD BOOST PROCESSING
           ══════════════════════════════════════════════════════════ */
        if (metadata.type === 'ad_boost' || tx_ref.startsWith('AD-FLW-')) {
            const { tier, days, bookId, sellerId } = metadata;

            if (!sellerId || !bookId) {
                console.error(' Missing promotion configuration references:', metadata);
                return NextResponse.json(
                    { error: 'Missing metadata parameters for promotion setup' },
                    { status: 400 }
                );
            }

            const revenueRef = adminDb.collection('revenue').doc(`boost-${tx_ref}`);
            const promoDocRef = adminDb.collection('promotions').doc(`promo-${tx_ref}`);
            const bookRef = adminDb.collection('advertMyBook').doc(String(bookId).replace('firestore-', ''));
            const txDocRef = adminDb.collection('transactions').doc(tx_ref);
            const durationDays = days || 7;

            await adminDb.runTransaction(async (tx) => {
                const txSnap = await tx.get(txDocRef);
                if (txSnap.exists) return;

                const revSnap = await tx.get(revenueRef);
                if (revSnap.exists) return;

                tx.set(txDocRef, {
                    transactionRef: tx_ref,
                    userId: sellerId,
                    buyerEmail: customer.email,
                    buyerName: customer.name || 'Seller Account',
                    amount,
                    currency,
                    type: 'ad_boost_purchase',
                    bookId,
                    tier,
                    durationDays,
                    status: 'completed',
                    paymentMethod: paymentData.payment_type || 'card',
                    createdAt: admin.firestore.FieldValue.serverTimestamp(),
                });

                const promoQuery = await adminDb
                    .collection('promotions')
                    .where('paymentRef', '==', tx_ref)
                    .limit(1)
                    .get();

                if (!promoQuery.empty) {
                    tx.update(promoQuery.docs[0].ref, {
                        status: 'paid',
                        webhookConfirmed: true,
                        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                    });
                } else {
                    tx.set(promoDocRef, {
                        promoId: `promo-${tx_ref}`,
                        sellerId,
                        sellerEmail: customer?.email || null,
                        bookId,
                        tier,
                        durationDays: Number(durationDays),
                        totalPrice: amount,
                        status: 'active',
                        paymentRef: tx_ref,
                        paymentMethod: 'flutterwave',
                        webhookConfirmed: true,
                        clicks: 0,
                        impressions: 0,
                        expiryDate: admin.firestore.Timestamp.fromMillis(Date.now() + Number(durationDays) * 86400000),
                        startDate: admin.firestore.FieldValue.serverTimestamp(),
                        createdAt: admin.firestore.FieldValue.serverTimestamp(),
                    });
                }

                tx.update(bookRef, {
                    isBoosted: true,
                    boostTier: tier,
                    boostExpiresAt: new Date(
                        Date.now() + Number(durationDays) * 24 * 60 * 60 * 1000
                    ).toISOString(),
                    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                });

                tx.set(revenueRef, {
                    type: 'ad_boost',
                    amount,
                    currency,
                    sellerId,
                    sellerEmail: customer?.email || null,
                    tier,
                    durationDays: Number(durationDays),
                    bookId,
                    paymentMethod: 'flutterwave',
                    txRef: tx_ref,
                    status: 'completed',
                    createdAt: admin.firestore.FieldValue.serverTimestamp(),
                });
            });

            if (customer.email) {
                sendServerNotification({
                    type: 'ad_boost',
                    to: customer.email,
                    userId: sellerId,
                    data: {
                        sellerName: customer.name || 'Seller',
                        tier,
                        durationDays,
                        amount,
                    },
                }).catch(e => console.error(' Ad Boost email notification failure:', e.message));
            }

            return NextResponse.json({ message: 'Ad visibility parameters activated successfully' }, { status: 200 });
        }

        /* ══════════════════════════════════════════════════════════
            ROUTE B: BOUNTY ESCROW PROCESSING
           ══════════════════════════════════════════════════════════ */
        if (tx_ref.startsWith('bounty_')) {
            const posterId = tx_ref.split('_')[1];
            if (!posterId) {
                return NextResponse.json({ error: 'Bad bounty reference' }, { status: 400 });
            }

            let rate;
            try {
                rate = currency === 'NGN' ? 1 : await getNgnRate(currency);
            } catch (e) {
                console.error('Rate lookup failed:', e.message);
                return NextResponse.json({ error: 'Rate unavailable, retry' }, { status: 500 });
            }
            const rewardNGN = Math.round(amount / rate);

            const posterSnap = await adminDb.collection('users').doc(posterId).get();
            const poster = posterSnap.exists ? posterSnap.data() : {};
            const postedBy =
                poster.displayName ||
                `${poster.firstName || ''} ${poster.surname || ''}`.trim() ||
                customer.name || 'Student';

            const bountyId = `escrow-${tx_ref}`;
            const txDocRef = adminDb.collection('transactions').doc(tx_ref);
            const bountyRef = adminDb.collection('bounties').doc(bountyId);
            const privateRef = adminDb.collection('bountyPrivate').doc(bountyId);

            const title = String(metadata.title || 'Academic request').slice(0, 200);
            const description = String(metadata.description || '').slice(0, 500);
            const university = String(metadata.university || '').slice(0, 120);
            const department = String(metadata.department || '').slice(0, 120);
            const deadline = metadata.deadline || null;
            const tags = String(metadata.tags || '').split(',').map(t => t.trim()).filter(Boolean).slice(0, 8);

            if (rewardNGN < 100) {
                await adminDb.collection('flaggedTransactions').doc(tx_ref).set({
                    tx_ref, posterId, amount, currency, reason: 'bounty_below_minimum',
                    createdAt: admin.firestore.FieldValue.serverTimestamp(),
                });
                return NextResponse.json({ message: 'Flagged: below minimum' }, { status: 200 });
            }

            const escrowResult = await adminDb.runTransaction(async (transaction) => {
                const txSnap = await transaction.get(txDocRef);
                if (txSnap.exists) return { duplicate: true };

                const ts = admin.firestore.FieldValue.serverTimestamp();

                transaction.set(txDocRef, {
                    transactionId: tx_ref,
                    transactionRef: tx_ref,
                    buyerId: posterId,
                    userId: posterId,
                    sellerId: 'ESCROW_PLATFORM',
                    buyerEmail: customer.email || null,
                    buyerName: customer.name || 'Student',
                    bookId: 'bounty_escrow',
                    bookTitle: title,
                    amount,
                    amountNGN: rewardNGN,
                    platformFee: 0,
                    sellerAmount: rewardNGN,
                    currency: currency || 'NGN',
                    type: 'bounty_escrow_funding',
                    status: 'completed',
                    paymentMethod: paymentData.payment_type || 'card',
                    createdAt: ts,
                });

                transaction.set(bountyRef, {
                    title, description, university, department,
                    reward: rewardNGN,
                    rewardLocal: amount,
                    rewardCurrency: currency || 'NGN',
                    deadline, tags,
                    postedBy,
                    postedByUid: posterId,
                    paymentRef: tx_ref,
                    paymentMethod: 'flutterwave',
                    escrowAmount: rewardNGN,
                    escrowLocked: true,
                    escrowStatus: 'locked',
                    status: 'open',
                    proposals: 0,
                    maxProposals: 10,
                    claimedBy: [],
                    claimedByUid: null,
                    claimedByName: null,
                    linkedBookId: null,
                    webhookConfirmed: true,
                    createdAt: ts,
                    updatedAt: ts,
                });

                // email/phone live in an Admin-only doc, not on the public bounty
                transaction.set(privateRef, {
                    posterId,
                    posterEmail: customer.email || null,
                    posterPhone: customer.phone_number || customer.phone || null,
                    createdAt: ts,
                });

                return { duplicate: false };
            });

            if (escrowResult.duplicate) {
                return NextResponse.json({ message: 'Bounty transaction already tracked' }, { status: 200 });
            }

            return NextResponse.json({ message: 'Bounty escrow captured' }, { status: 200 });
        }

        /* ══════════════════════════════════════════════════════════
            ROUTE C: PRINT LICENSE PROCESSING
           ══════════════════════════════════════════════════════════ */
        if (metadata.printLicense === true || metadata.printLicense === 'true') {
            const buyerId = metadata.userId || payload.data.customer?.id;
            const printBookId = metadata.bookId;

            if (!buyerId || !printBookId) {
                console.error(' Missing print permission identification properties:', metadata);
                return NextResponse.json({ error: 'Missing metadata for license configuration' }, { status: 400 });
            }

            const verifiedPrintBook = await serverFetchBookDetails(printBookId);
            const bookTitle = verifiedPrintBook ? verifiedPrintBook.title : 'Academic Material Document';
            const txDocRefPrint = adminDb.collection('transactions').doc(tx_ref);
            const userLicenseRef = adminDb.collection('users').doc(buyerId);

            const licenseResult = await adminDb.runTransaction(async (transaction) => {
                const txSnap = await transaction.get(txDocRefPrint);
                if (txSnap.exists) return { duplicate: true };

                transaction.set(txDocRefPrint, {
                    transactionRef: tx_ref,
                    userId: buyerId,
                    buyerEmail: customer.email,
                    buyerName: customer.name || 'Student',
                    amount,
                    currency,
                    type: 'print_license_purchase',
                    bookId: printBookId,
                    bookTitle,
                    status: 'completed',
                    paymentMethod: paymentData.payment_type || 'card',
                    createdAt: admin.firestore.FieldValue.serverTimestamp(),
                });

                const userSnap = await transaction.get(userLicenseRef);
                const licensePayload = {
                    bookId: printBookId,
                    bookTitle,
                    licensedAt: new Date().toISOString(),
                    paymentRef: tx_ref,
                    status: 'active',
                };

                if (userSnap.exists) {
                    transaction.update(userLicenseRef, {
                        [`printPermissions.${printBookId}`]: licensePayload,
                    });
                } else {
                    transaction.set(userLicenseRef, {
                        printPermissions: { [printBookId]: licensePayload }
                    }, { merge: true });
                }

                return { duplicate: false };
            });

            if (licenseResult.duplicate) {
                return NextResponse.json({ message: 'License transaction already tracked' }, { status: 200 });
            }

            if (customer.email) {
                after(async () => {
                    const jobs = [];
                    if (activeSellerId !== 'PLATFORM_ADMIN') {
                        jobs.push(notifyUser({
                            userId: activeSellerId,
                            to: verifiedPrintBook?.sellerEmail,
                            type: 'sale_alert',
                            data: {
                                sellerName: verifiedPrintBook?.sellerName || 'Seller',
                                bookTitle: verifiedPrintBook?.title,
                                amount: expectedNGN,
                                netEarning,
                                buyerEmail: maskEmail(customer.email),
                                currentBalance: referralResult.currentBalance,
                            },
                            inApp: {
                                type: 'sale',
                                title: 'New sale 🎉',
                                message: `"${verifiedPrintBook?.title}" sold. ₦${Number(netEarning).toLocaleString('en-NG')} added to your balance.`,
                                link: '/my-account/seller-account',
                            },
                        }));
                    }
                    if (customer.email) {
                        jobs.push(sendServerNotification({
                            type: 'order_receipt',
                            to: customer.email,
                            userId,
                            data: {
                                buyerName: customer.name || 'Reader',
                                bookTitle: verifiedPrintBook?.title,
                                amount: expectedNGN,        // the receipt prints ₦, so pass the naira value
                                sellerName: verifiedBook.sellerName || 'LAN Library',
                                orderId: tx_ref,
                            },
                        }));
                    }
                    await Promise.allSettled(jobs);
                });
            }

            return NextResponse.json({ message: 'Print license permissions issued successfully' }, { status: 200 });
        }

        /* ══════════════════════════════════════════════════════════
            ROUTE D: BOOK PURCHASE PROCESSING (default / fallthrough)
           ══════════════════════════════════════════════════════════ */
        const { userId, bookId } = metadata;

        if (!userId || !bookId) {
            console.error(' Missing transaction properties inside meta payload:', metadata);
            return NextResponse.json({ error: 'Missing metadata fields' }, { status: 400 });
        }

        const verifiedBook = await serverFetchBookDetails(bookId);
        if (!verifiedBook) {
            console.error(` Book not found for database lookup ID: ${bookId}`);
            return NextResponse.json({ error: 'Book verification failed' }, { status: 404 });
        }

        const activeSellerId = verifiedBook.sellerId || 'PLATFORM_ADMIN';

        const txDocRef = adminDb.collection('transactions').doc(tx_ref);
        const userRef = adminDb.collection('users').doc(userId);
        const sellerRef = adminDb.collection('sellers').doc(activeSellerId);
        const negRef = metadata.negotiationId
            ? adminDb.collection('negotiations').doc(String(metadata.negotiationId))
            : null;

        // Outside the transaction. A failure returns 500 so Flutterwave retries.
        let rate;
        try {
            rate = currency === 'NGN' ? 1 : await getNgnRate(currency);
        } catch (e) {
            console.error('Rate lookup failed:', e.message);
            return NextResponse.json({ error: 'Rate unavailable, retry' }, { status: 500 });
        }

        const referralResult = await adminDb.runTransaction(async (transaction) => {
            /* ═══ READS (all reads before any write) ═══ */
            const txSnap = await transaction.get(txDocRef);
            if (txSnap.exists) return { duplicate: true };

            const negSnap = negRef ? await transaction.get(negRef) : null;

            // What this buyer SHOULD have paid, in NGN
            let expectedNGN = Math.floor(Number(verifiedBook.price));
            if (negSnap?.exists) {
                try {
                    expectedNGN = resolveNegotiatedPrice({
                        neg: negSnap.data(), book: verifiedBook, userId, bookId, checkExpiry: false,
                    });
                } catch { /* invalid or used offer: stay at list price */ }
            }

            // 3% tolerance for exchange-rate drift
            if (amount / rate < expectedNGN * 0.97) {
                return { underpaid: true, expectedNGN };
            }

            const distribution = calculatePaymentDistribution(verifiedBook, expectedNGN);
            const netEarning = distribution.sellerAmount;
            const platformFee = distribution.platformFee;

            let qualifiedReferralRef = null;
            let referralData = null;
            let expiredReferralRef = null;

            if (expectedNGN >= 1000) {
                const refQuery = adminDb.collection('referrals')
                    .where('referredUserId', '==', userId)
                    .where('status', '==', 'pending')
                    .limit(1);

                const refDocs = await transaction.get(refQuery);

                if (!refDocs.empty) {
                    const potentialMatch = refDocs.docs[0];
                    const data = potentialMatch.data();
                    const createdTime = data.createdAt?.toDate() || new Date();
                    const daysActive = (Date.now() - createdTime.getTime()) / (1000 * 60 * 60 * 24);
                    if (daysActive <= 30) {
                        qualifiedReferralRef = potentialMatch.ref;
                        referralData = data;
                    } else {
                        expiredReferralRef = potentialMatch.ref;   // written later
                    }
                }
            }

            const userSnap = await transaction.get(userRef);
            const sellerSnap = await transaction.get(sellerRef);   // last read

            /* ═══ WRITES ═══ */
            if (expiredReferralRef) {
                transaction.update(expiredReferralRef, { status: 'expired' });
            }

            if (negSnap?.exists && negSnap.data().status === 'agreed' && negSnap.data().buyerId === userId) {
                transaction.update(negRef, { status: 'purchased', purchasedAtMs: Date.now() });
            }

            const accessPayload = {
                id: bookId,
                title: verifiedBook.title,
                purchasedAt: new Date().toISOString(),
                amount: expectedNGN,
                transactionRef: tx_ref,
            };

            if (userSnap.exists) {
                transaction.update(userRef, {
                    [`purchasedBooks.${bookId}`]: accessPayload,
                });
            } else {
                transaction.set(userRef, {
                    purchasedBooks: { [bookId]: accessPayload }
                }, { merge: true });
            }

            let currentBalance = netEarning;
            if (sellerSnap.exists) {
                currentBalance = (sellerSnap.data().accountBalance || 0) + netEarning;
                transaction.update(sellerRef, {
                    accountBalance: admin.firestore.FieldValue.increment(netEarning),
                    totalEarnings: admin.firestore.FieldValue.increment(netEarning),
                    booksSold: admin.firestore.FieldValue.increment(1),
                    lastSaleAt: admin.firestore.FieldValue.serverTimestamp(),
                });
            } else {
                transaction.set(sellerRef, {
                    sellerId: activeSellerId,
                    sellerEmail: verifiedBook.sellerEmail || null,
                    sellerName: verifiedBook.sellerName || 'Marketplace Member',
                    accountBalance: netEarning,
                    totalEarnings: netEarning,
                    booksSold: 1,
                    createdAt: admin.firestore.FieldValue.serverTimestamp(),
                    lastSaleAt: admin.firestore.FieldValue.serverTimestamp(),
                });
            }

            if (qualifiedReferralRef && referralData) {
                const referrerUserRef = adminDb.collection('users').doc(referralData.referrerId);
                const rewardPayout = 500;

                transaction.update(qualifiedReferralRef, {
                    status: 'completed',
                    qualifiedAt: admin.firestore.FieldValue.serverTimestamp(),
                });

                transaction.update(referrerUserRef, {
                    accountBalance: admin.firestore.FieldValue.increment(rewardPayout),
                    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                });
            }

            transaction.set(txDocRef, {
                transactionRef: tx_ref,
                userId,
                buyerEmail: customer.email,
                buyerName: customer.name || 'Student',
                sellerId: activeSellerId,
                bookId,
                bookTitle: verifiedBook.title,
                amount,                       // what Flutterwave charged, in `currency`
                amountNGN: expectedNGN,       // what the sale is worth in naira
                netEarning, sellerAmount: netEarning, buyerCountry: userSnap.exists ? (userSnap.data().country || null) : null,
                platformFee,
                currency,
                negotiationId: negSnap?.exists ? negRef.id : null,
                status: 'completed',
                paymentMethod: paymentData.payment_type || 'card',
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
            });

            return {
                duplicate: false,
                referralUnlocked: !!qualifiedReferralRef,
                referralData,
                currentBalance,
                netEarning,
                expectedNGN,
            };
        });

        if (referralResult.duplicate) {
            console.log('Duplicate transaction skipped:', tx_ref);
            return NextResponse.json({ message: 'Transaction already tracked' }, { status: 200 });
        }

        if (referralResult.underpaid) {
            await adminDb.collection('flaggedTransactions').doc(tx_ref).set({
                tx_ref, userId, bookId, amount, currency,
                expectedNGN: referralResult.expectedNGN,
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
            });
            return NextResponse.json({ message: 'Flagged: underpaid' }, { status: 200 });
        }

        const { netEarning, expectedNGN } = referralResult;

        // Post-transaction tasks (fire-and-forget metrics)
        if (bookId.startsWith('firestore-')) {
            const cleanBookId = bookId.replace('firestore-', '');
            adminDb.collection('advertMyBook').doc(cleanBookId).update({
                purchases: admin.firestore.FieldValue.increment(1),
                lastPurchaseAt: admin.firestore.FieldValue.serverTimestamp(),
            }).catch(e => console.error('Metrics sync dropped:', e));
        }

        if (referralResult.referralUnlocked) {
            adminDb.collection('notifications').add({
                userId: referralResult.referralData.referrerId,
                type: 'referral_bonus',
                title: 'Referral Bonus Unlocked! 🎉',
                message: `${referralResult.referralData.referredUserName || 'Your friend'} made their first purchase! ₦${referralResult.referralData.reward || 500} added to your wallet.`,
                link: '/referral',
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                read: false,
            }).catch(e => console.error('Referral notification drop:', e));
        }

         after(async () => {
                const link = `/academic/bounty/board?highlight=${bountyId}`;
                const rewardFmt = `₦${rewardNGN.toLocaleString('en-NG')}`;
                await Promise.allSettled([
                    adminDb.collection('globalNotifications').add({
                        type: 'new_bounty',
                        title: 'New Bounty Posted on the Board 💰',
                        message: `${postedBy} posted a ${rewardFmt} bounty: "${title}". Be the first to claim it!`,
                        link,
                        bountyId,
                        reward: rewardNGN,
                        posterName: postedBy,
                        university,
                        department,
                        createdAt: admin.firestore.FieldValue.serverTimestamp(),
                    }),
                    notifyUser({
                        userId: posterId,
                        to: customer.email,
                        type: 'bounty_posted',
                        data: { bountyTitle: title, reward: rewardNGN, ctaUrl: `${SITE}${link}` },
                        inApp: {
                            type: 'new_bounty',
                            title: 'Your bounty is live 🎯',
                            message: `${rewardFmt} is held in escrow for "${title}".`,
                            link,
                        },
                    }),
                ]);
         });
        
        return NextResponse.json({ message: 'Webhook ledger transaction processed securely' }, { status: 200 });

    } catch (error) {
        console.error(' Fatal Webhook processing failure:', error);
        return NextResponse.json(
            { error: 'Server loop operational failure', details: error.message },
            { status: 500 }
        );
    }
}

export async function GET() {
    return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}