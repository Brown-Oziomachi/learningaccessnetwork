import { NextResponse } from 'next/server';
import { calculatePaymentDistribution } from '@/utils/paymentProcessor';
import { sendServerNotification } from '@/lib/notificationEngine';
import { serverFetchBookDetails } from '@/lib/serverBookUtils';
import { adminDb, admin } from '@/lib/firebase-admin';

export async function POST(request) {
    try {
        const payload = await request.json();

        // ── 1. Verify Webhook Authenticity ────────────────────────────────────
        const signature = request.headers.get('verif-hash');
        const secretHash = process.env.FLUTTERWAVE_SECRET_HASH;

        if (!signature || signature !== secretHash) {
            console.error('🔒 Security Breach: Invalid webhook signature');
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

            // Validate required fields before processing
            if (!sellerId || !bookId) {
                console.error('❌ Missing promotion configuration references:', metadata);
                return NextResponse.json(
                    { error: 'Missing metadata parameters for promotion setup' },
                    { status: 400 }
                );
            }

            const revenueRef   = adminDb.collection('revenue').doc(`boost-${tx_ref}`);
            const promoDocRef  = adminDb.collection('promotions').doc(`promo-${tx_ref}`);
            const bookRef      = adminDb.collection('books').doc(bookId);
            const txDocRef     = adminDb.collection('transactions').doc(tx_ref);
            const durationDays = days || 7;

            await adminDb.runTransaction(async (tx) => {
                // Idempotency check
                const txSnap = await tx.get(txDocRef);
                if (txSnap.exists) return;

                const revSnap = await tx.get(revenueRef);
                if (revSnap.exists) return;

                // A. Immutable financial ledger row
                tx.set(txDocRef, {
                    transactionRef: tx_ref,
                    userId:         sellerId,
                    buyerEmail:     customer.email,
                    buyerName:      customer.name || 'Seller Account',
                    amount,
                    currency,
                    type:           'ad_boost_purchase',
                    bookId,
                    tier,
                    durationDays,
                    status:         'completed',
                    paymentMethod:  paymentData.payment_type || 'card',
                    createdAt:      admin.firestore.FieldValue.serverTimestamp(),
                });

                // B. Upsert or create the promotion document
                const promoQuery = await adminDb
                    .collection('promotions')
                    .where('paymentRef', '==', tx_ref)
                    .limit(1)
                    .get();

                if (!promoQuery.empty) {
                    tx.update(promoQuery.docs[0].ref, {
                        status:           'paid',
                        webhookConfirmed: true,
                        updatedAt:        admin.firestore.FieldValue.serverTimestamp(),
                    });
                } else {
                    tx.set(promoDocRef, {
                        promoId:          `promo-${tx_ref}`,
                        sellerId,
                        sellerEmail:      customer?.email || null,
                        bookId,
                        tier,
                        durationDays:     Number(durationDays),
                        totalPrice:       amount,
                        status:           'active',
                        paymentRef:       tx_ref,
                        paymentMethod:    'flutterwave',
                        webhookConfirmed: true,
                        clicks:           0,
                        impressions:      0,
                        expiryDate:       null,
                        startDate:        admin.firestore.FieldValue.serverTimestamp(),
                        createdAt:        admin.firestore.FieldValue.serverTimestamp(),
                    });
                }

                // C. Set boost visibility flags on the book document
                tx.update(bookRef, {
                    isBoosted:      true,
                    boostTier:      tier,
                    boostExpiresAt: new Date(
                        Date.now() + Number(durationDays) * 24 * 60 * 60 * 1000
                    ).toISOString(),
                    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                });

                // D. Revenue record
                tx.set(revenueRef, {
                    type:          'ad_boost',
                    amount,
                    currency,
                    sellerId,
                    sellerEmail:   customer?.email || null,
                    tier,
                    durationDays:  Number(durationDays),
                    bookId,
                    paymentMethod: 'flutterwave',
                    txRef:         tx_ref,
                    status:        'completed',
                    createdAt:     admin.firestore.FieldValue.serverTimestamp(),
                });
            });

            // Email confirmation
            if (customer.email) {
                sendServerNotification({
                    type:   'ad_boost',
                    to:     customer.email,
                    userId: sellerId,
                    data: {
                        sellerName:  customer.name || 'Seller',
                        tier,
                        durationDays,
                        amount,
                    },
                }).catch(e => console.error('📧 Ad Boost email notification failure:', e.message));
            }

            return NextResponse.json(
                { message: 'Ad visibility parameters activated successfully' },
                { status: 200 }
            );
        }

        /* ══════════════════════════════════════════════════════════
            ROUTE B: BOUNTY ESCROW PROCESSING
           ══════════════════════════════════════════════════════════ */
        if (tx_ref.startsWith('bounty_')) {
            const posterId    = metadata.userId || tx_ref.split('_')[1];
            const bountyTitle = metadata.bountyTitle || 'Academic Request Documentation';

            const txDocRef    = adminDb.collection('transactions').doc(tx_ref);
            const bountyDocRef = adminDb.collection('bounties').doc(`escrow-${tx_ref}`);

            const escrowResult = await adminDb.runTransaction(async (transaction) => {
                // Idempotency check
                const txSnap = await transaction.get(txDocRef);
                if (txSnap.exists) return { duplicate: true };

                // A. Immutable ledger row
                transaction.set(txDocRef, {
                    transactionRef: tx_ref,
                    userId:         posterId,
                    buyerEmail:     customer.email,
                    buyerName:      customer.name || 'Student',
                    amount,
                    currency,
                    type:          'bounty_escrow_deposit',
                    status:        'completed',
                    paymentMethod: paymentData.payment_type || 'card',
                    createdAt:     admin.firestore.FieldValue.serverTimestamp(),
                });

                // B. Instantiate / verify the escrow bounty document
                transaction.set(bountyDocRef, {
                    bountyId:         `escrow-${tx_ref}`,
                    posterId,
                    posterEmail:      customer.email,
                    posterName:       customer.name || 'Student',
                    title:            bountyTitle,
                    reward:           amount,
                    status:           'open',
                    paymentRef:       tx_ref,
                    paymentMethod:    'flutterwave',
                    university:       metadata.university || null,
                    department:       metadata.department || null,
                    webhookConfirmed: true,
                    createdAt:        admin.firestore.FieldValue.serverTimestamp(),
                    updatedAt:        admin.firestore.FieldValue.serverTimestamp(),
                }, { merge: true });

                return { duplicate: false };
            });

            if (escrowResult.duplicate) {
                return NextResponse.json(
                    { message: 'Bounty transaction already tracked' },
                    { status: 200 }
                );
            }

            // Email confirmation
            if (customer.email) {
                sendServerNotification({
                    type:   'new_bounty',
                    to:     customer.email,
                    userId: posterId,
                    data: {
                        posterName:   customer.name || 'Student',
                        bountyTitle,
                        reward:       amount,
                        university:   metadata.university || '',
                        department:   metadata.department || '',
                        ctaUrl:       `${process.env.NEXT_PUBLIC_BASE_URL}/academic/bounty/board`,
                    },
                }).catch(e => console.error('📧 Bounty confirmation dispatch error:', e.message));
            }

            return NextResponse.json(
                { message: 'Bounty escrow account captured cleanly' },
                { status: 200 }
            );
        }

        /* ══════════════════════════════════════════════════════════
            ROUTE C: PRINT LICENSE PROCESSING
           ══════════════════════════════════════════════════════════ */
        if (metadata.printLicense === true || metadata.printLicense === 'true') {
            const buyerId = metadata.userId || payload.data.customer?.id;
            const bookId  = metadata.bookId;

            if (!buyerId || !bookId) {
                console.error('❌ Missing print permission identification properties:', metadata);
                return NextResponse.json(
                    { error: 'Missing metadata for license configuration' },
                    { status: 400 }
                );
            }

            const verifiedBook   = await serverFetchBookDetails(bookId);
            const bookTitle      = verifiedBook ? verifiedBook.title : 'Academic Material Document';
            const txDocRef       = adminDb.collection('transactions').doc(tx_ref);
            const userLicenseRef = adminDb.collection('users').doc(buyerId);

            const licenseResult = await adminDb.runTransaction(async (transaction) => {
                // Idempotency check
                const txSnap = await transaction.get(txDocRef);
                if (txSnap.exists) return { duplicate: true };

                // A. Immutable financial ledger row
                transaction.set(txDocRef, {
                    transactionRef: tx_ref,
                    userId:         buyerId,
                    buyerEmail:     customer.email,
                    buyerName:      customer.name || 'Student',
                    amount,
                    currency,
                    type:          'print_license_purchase',
                    bookId,
                    bookTitle,
                    status:        'completed',
                    paymentMethod: paymentData.payment_type || 'card',
                    createdAt:     admin.firestore.FieldValue.serverTimestamp(),
                });

                // B. Grant print permission on the user's profile document
                const userSnap = await transaction.get(userLicenseRef);
                if (userSnap.exists) {
                    transaction.update(userLicenseRef, {
                        [`printPermissions.${bookId}`]: {
                            bookId,
                            bookTitle,
                            licensedAt:  new Date().toISOString(),
                            paymentRef:  tx_ref,
                            status:      'active',
                        },
                    });
                }

                return { duplicate: false };
            });

            if (licenseResult.duplicate) {
                return NextResponse.json(
                    { message: 'License transaction already tracked' },
                    { status: 200 }
                );
            }

            // Email confirmation
            if (customer.email) {
                sendServerNotification({
                    type:   'print_license_confirmed',
                    to:     customer.email,
                    userId: buyerId,
                    data: {
                        buyerName:  customer.name || 'Reader',
                        bookTitle,
                        orderId:    tx_ref,
                        ctaUrl:     `${process.env.NEXT_PUBLIC_BASE_URL}/document/${bookId}`,
                    },
                }).catch(e => console.error('📧 Print authorization confirmation dispatch error:', e.message));
            }

            return NextResponse.json(
                { message: 'Print license permissions issued successfully' },
                { status: 200 }
            );
        }

        /* ══════════════════════════════════════════════════════════
            ROUTE D: BOOK PURCHASE PROCESSING  (default / fallthrough)
           ══════════════════════════════════════════════════════════ */
        const { userId, bookId } = metadata;

        if (!userId || !bookId) {
            console.error('❌ Missing transaction properties inside meta payload:', metadata);
            return NextResponse.json({ error: 'Missing metadata fields' }, { status: 400 });
        }

        // Fetch authoritative book details from the server
        const verifiedBook = await serverFetchBookDetails(bookId);
        if (!verifiedBook) {
            console.error(`❌ Book not found for database lookup ID: ${bookId}`);
            return NextResponse.json({ error: 'Book verification failed' }, { status: 404 });
        }

        const distribution    = calculatePaymentDistribution(verifiedBook, amount);
        const netEarning      = distribution.sellerAmount;
        const platformFee     = distribution.platformFee;
        const activeSellerId  = verifiedBook.sellerId || 'PLATFORM_ADMIN';

        const txDocRef  = adminDb.collection('transactions').doc(tx_ref);
        const userRef   = adminDb.collection('users').doc(userId);
        const sellerRef = adminDb.collection('sellers').doc(activeSellerId);

        const referralResult = await adminDb.runTransaction(async (transaction) => {
            // Idempotency check
            const txSnap = await transaction.get(txDocRef);
            if (txSnap.exists) return { duplicate: true };

            // A. Referral qualification check
            let qualifiedReferralRef = null;
            let referralData         = null;

            if (amount >= 1000) {
                const refQuery = adminDb.collection('referrals')
                    .where('referredUserId', '==', userId)
                    .where('status', '==', 'pending')
                    .limit(1);

                const refDocs = await transaction.get(refQuery);

                if (!refDocs.empty) {
                    const potentialMatch = refDocs.docs[0];
                    const data           = potentialMatch.data();
                    const createdTime    = data.createdAt?.toDate() || new Date();
                    const daysActive     = (Date.now() - createdTime.getTime()) / (1000 * 60 * 60 * 24);

                    if (daysActive <= 30) {
                        qualifiedReferralRef = potentialMatch.ref;
                        referralData         = data;
                    } else {
                        transaction.update(potentialMatch.ref, { status: 'expired' });
                    }
                }
            }

            // B. Grant buyer access to the purchased book
            const userSnap = await transaction.get(userRef);
            if (userSnap.exists) {
                transaction.update(userRef, {
                    [`purchasedBooks.${bookId}`]: {
                        id:             bookId,
                        title:          verifiedBook.title,
                        purchasedAt:    new Date().toISOString(),
                        amount,
                        transactionRef: tx_ref,
                    },
                });
            }

            // C. Credit seller wallet
            let currentBalance = netEarning;
            const sellerSnap   = await transaction.get(sellerRef);

            if (sellerSnap.exists) {
                currentBalance = (sellerSnap.data().accountBalance || 0) + netEarning;
                transaction.update(sellerRef, {
                    accountBalance: admin.firestore.FieldValue.increment(netEarning),
                    totalEarnings:  admin.firestore.FieldValue.increment(netEarning),
                    booksSold:      admin.firestore.FieldValue.increment(1),
                    lastSaleAt:     admin.firestore.FieldValue.serverTimestamp(),
                });
            } else {
                transaction.set(sellerRef, {
                    sellerId:       activeSellerId,
                    sellerEmail:    verifiedBook.sellerEmail || null,
                    sellerName:     verifiedBook.sellerName || 'Marketplace Member',
                    accountBalance: netEarning,
                    totalEarnings:  netEarning,
                    booksSold:      1,
                    createdAt:      admin.firestore.FieldValue.serverTimestamp(),
                    lastSaleAt:     admin.firestore.FieldValue.serverTimestamp(),
                });
            }

            // D. Process referral payout atomically
            if (qualifiedReferralRef && referralData) {
                const referrerUserRef = adminDb.collection('users').doc(referralData.referrerId);
                const rewardPayout    = referralData.reward || 500;

                transaction.update(qualifiedReferralRef, {
                    status:      'completed',
                    qualifiedAt: admin.firestore.FieldValue.serverTimestamp(),
                });

                transaction.update(referrerUserRef, {
                    accountBalance: admin.firestore.FieldValue.increment(rewardPayout),
                    updatedAt:      admin.firestore.FieldValue.serverTimestamp(),
                });
            }

            // E. Immutable transaction record
            transaction.set(txDocRef, {
                transactionRef: tx_ref,
                userId,
                buyerEmail:    customer.email,
                buyerName:     customer.name || 'Student',
                sellerId:      activeSellerId,
                bookId,
                bookTitle:     verifiedBook.title,
                amount,
                netEarning,
                platformFee,
                currency,
                status:        'completed',
                paymentMethod: paymentData.payment_type || 'card',
                createdAt:     admin.firestore.FieldValue.serverTimestamp(),
            });

            return {
                duplicate:        false,
                referralUnlocked: !!qualifiedReferralRef,
                referralData,
                currentBalance,
            };
        });

        if (referralResult.duplicate) {
            console.log('Duplicate transaction skipped:', tx_ref);
            return NextResponse.json({ message: 'Transaction already tracked' }, { status: 200 });
        }

        // Post-transaction metrics (fire-and-forget)
        if (bookId.startsWith('firestore-')) {
            const cleanBookId = bookId.replace('firestore-', '');
            adminDb.collection('advertMyBook').doc(cleanBookId).update({
                purchases:       admin.firestore.FieldValue.increment(1),
                lastPurchaseAt:  admin.firestore.FieldValue.serverTimestamp(),
            }).catch(e => console.error('Metrics sync dropped:', e));
        }

        // Referral bonus in-app notification
        if (referralResult.referralUnlocked) {
            adminDb.collection('notifications').add({
                userId:    referralResult.referralData.referrerId,
                type:      'referral_bonus',
                title:     'Referral Bonus Unlocked! 🎉',
                message:   `${referralResult.referralData.referredUserName || 'Your friend'} made their first purchase! ₦${referralResult.referralData.reward || 500} added to your wallet.`,
                link:      '/referral',
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                read:      false,
            }).catch(e => console.error('Referral notification drop:', e));
        }

        // Seller sale alert email
        if (verifiedBook.sellerEmail) {
            sendServerNotification({
                type:   'sale_alert',
                to:     verifiedBook.sellerEmail,
                userId: activeSellerId,
                data: {
                    sellerName:     verifiedBook.sellerName || 'Seller',
                    bookTitle:      verifiedBook.title,
                    amount,
                    netEarning,
                    buyerEmail:     customer.email,
                    currentBalance: referralResult.currentBalance,
                },
            }).catch(e => console.error('📧 Seller Sale Alert delivery error:', e.message));
        }

        // Buyer receipt email
        if (customer.email) {
            sendServerNotification({
                type:   'order_receipt',
                to:     customer.email,
                userId,
                data: {
                    buyerName:  customer.name || 'Reader',
                    bookTitle:  verifiedBook.title,
                    amount,
                    sellerName: verifiedBook.sellerName || 'LAN Library',
                    orderId:    tx_ref,
                },
            }).catch(e => console.error('📧 Buyer Receipt delivery error:', e.message));
        }

        return NextResponse.json(
            { message: 'Webhook ledger transaction processed securely' },
            { status: 200 }
        );

    } catch (error) {
        console.error('🚨 Fatal Webhook processing failure:', error);
        return NextResponse.json(
            { error: 'Server loop operational failure', details: error.message },
            { status: 500 }
        );
    }
}
