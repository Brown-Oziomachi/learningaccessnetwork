import { NextResponse } from "next/server";
import { admin, adminDb } from "@/lib/firebase-admin";
import { requireAdmin } from "@/lib/requireAdmin";
import { createInAppNotification } from "@/lib/notificationEngine";

const AUTHOR_PCT = 0.8;
const FV = admin.firestore.FieldValue;
const KNOWN = [
    "BOUNTY_NOT_FOUND", "NOT_PENDING_APPROVAL", "NO_FULFILLER_FOUND", "ALREADY_PAID",
    "NO_ESCROW", "ESCROW_ALREADY_RELEASED", "BOUNTY_NOT_REFUNDABLE", "ALREADY_REFUNDED",
];

/* ── APPROVE: pays the author from escrow ───────────────────────────── */
async function approve({ bountyId, adminUid }) {
    const bountyRef = adminDb.collection("bounties").doc(bountyId);
    const escrowRef = adminDb.collection("platform_escrow").doc("main");
    const payoutTxRef = adminDb.collection("transactions").doc(`bounty-payout-${bountyId}`);

    const r = await adminDb.runTransaction(async (tx) => {
        const bSnap = await tx.get(bountyRef);
        if (!bSnap.exists) throw new Error("BOUNTY_NOT_FOUND");
        const b = bSnap.data();
        if (b.status !== "pending_approval") throw new Error("NOT_PENDING_APPROVAL");

        const sellerUid = b.fulfilledByUid;
        if (!sellerUid) throw new Error("NO_FULFILLER_FOUND");
        const bookId = b.bidderBooks?.[sellerUid] || b.linkedBookId || null;
        const bookRef = bookId ? adminDb.collection("advertMyBook").doc(bookId) : null;

        const [payoutSnap, bookSnap] = await Promise.all([
            tx.get(payoutTxRef),
            bookRef ? tx.get(bookRef) : Promise.resolve(null),
        ]);
        if (payoutSnap.exists) throw new Error("ALREADY_PAID");
        if (b.escrowLocked === false) throw new Error("ESCROW_ALREADY_RELEASED");

        const escrowAmount = Number(b.escrowAmount ?? b.reward ?? 0);
        if (!(escrowAmount > 0)) throw new Error("NO_ESCROW");
        const authorPayout = Math.round(escrowAmount * AUTHOR_PCT);
        const platformFee = escrowAmount - authorPayout;
        const ts = FV.serverTimestamp();

        if (bookSnap?.exists) tx.update(bookRef, { status: "approved", updatedAt: ts });

        // ONE balance: sellers.accountBalance (what the dashboard shows and withdraws)
        tx.set(adminDb.collection("sellers").doc(sellerUid), {
            sellerId: sellerUid,
            accountBalance: FV.increment(authorPayout),
            totalEarnings: FV.increment(authorPayout),
            updatedAt: ts,
        }, { merge: true });

        tx.update(bountyRef, {
            status: "fulfilled", escrowLocked: false, escrowStatus: "released",
            escrowReleasedAt: ts, authorPayout, platformFee,
            linkedBookId: bookId, approvedAt: ts, approvedBy: adminUid, updatedAt: ts,
        });

        tx.set(escrowRef, {
            totalHeld: FV.increment(-escrowAmount),
            totalReleased: FV.increment(authorPayout),
            totalFees: FV.increment(platformFee),
            updatedAt: ts,
        }, { merge: true });

        tx.set(payoutTxRef, {
            sellerId: sellerUid, type: "bounty_payout", bountyId,
            bookTitle: `🎯 Bounty Reward — ${b.title || "Bounty"}`,
            buyerName: b.postedBy || "Student",
            amount: escrowAmount, amountNGN: escrowAmount,
            sellerAmount: authorPayout, sellerPayout: authorPayout, platformFee,
            status: "completed", source: "bounty_escrow", createdAt: ts,
        });

        return { sellerUid, posterUid: b.postedByUid, title: b.title, authorPayout, reward: b.reward };
    });

    await Promise.allSettled([
        createInAppNotification({
            userId: r.sellerUid, type: "bounty_approved",
            title: "Your bounty fulfilment was approved 🎉",
            message: `₦${r.authorPayout.toLocaleString("en-NG")} was added to your balance for "${r.title}".`,
            link: "/my-account/seller-account", extra: { bountyId },
        }),
        r.posterUid && createInAppNotification({
            userId: r.posterUid, type: "bounty_fulfilled",
            title: "Your bounty has been fulfilled 📚",
            message: `"${r.title}" is ready.`,
            link: `/academic/bounty/board?highlight=${bountyId}`, extra: { bountyId },
        }),
    ]);
    return {};
}

/* ── REJECT: back to the bidders, author may resubmit ───────────────── */
async function reject({ bountyId, reason }) {
    const why = String(reason || "Does not meet requirements").slice(0, 300);
    const bountyRef = adminDb.collection("bounties").doc(bountyId);

    const r = await adminDb.runTransaction(async (tx) => {
        const bSnap = await tx.get(bountyRef);
        if (!bSnap.exists) throw new Error("BOUNTY_NOT_FOUND");
        const b = bSnap.data();
        if (b.status !== "pending_approval") throw new Error("NOT_PENDING_APPROVAL");

        const uid = b.fulfilledByUid;
        const bookId = (uid && b.bidderBooks?.[uid]) || b.linkedBookId || null;
        const bookRef = bookId ? adminDb.collection("advertMyBook").doc(bookId) : null;
        const bookSnap = bookRef ? await tx.get(bookRef) : null;
        const ts = FV.serverTimestamp();

        if (bookSnap?.exists) tx.update(bookRef, { status: "rejected", rejectionReason: why, updatedAt: ts });
        tx.update(bountyRef, {
            status: "claimed", linkedBookId: null,
            fulfilledByUid: null, fulfilledByName: null, fulfilledAt: null,
            ...(uid ? { [`bidderBooks.${uid}`]: FV.delete() } : {}),
            rejectedAt: ts, rejectionReason: why, updatedAt: ts,
        });
        return { uid, title: b.title };
    });

    if (r.uid) {
        await createInAppNotification({
            userId: r.uid, type: "bounty_rejected",
            title: "Bounty submission rejected",
            message: `Your submission for "${r.title}" was rejected. Reason: ${why}. You may resubmit.`,
            link: `/academic/bounty/board?highlight=${bountyId}`, extra: { bountyId },
        });
    }
    return {};
}

/* ── REFUND: escrow back to the poster ──────────────────────────────── */
async function refund({ bountyId, reason, adminUid }) {
    const why = String(reason || "Refunded by admin").slice(0, 300);
    const bountyRef = adminDb.collection("bounties").doc(bountyId);
    const escrowRef = adminDb.collection("platform_escrow").doc("main");
    const refundTxRef = adminDb.collection("transactions").doc(`bounty-refund-${bountyId}`);

    const r = await adminDb.runTransaction(async (tx) => {
        const bSnap = await tx.get(bountyRef);
        if (!bSnap.exists) throw new Error("BOUNTY_NOT_FOUND");
        const b = bSnap.data();
        if (!["open", "claimed", "pending_approval"].includes(b.status)) throw new Error("BOUNTY_NOT_REFUNDABLE");
        if (b.escrowLocked === false) throw new Error("ESCROW_ALREADY_RELEASED");

        const posterUid = b.postedByUid;
        const sellerRef = posterUid ? adminDb.collection("sellers").doc(posterUid) : null;
        const [refundSnap, sellerSnap] = await Promise.all([
            tx.get(refundTxRef), sellerRef ? tx.get(sellerRef) : Promise.resolve(null),
        ]);
        if (refundSnap.exists) throw new Error("ALREADY_REFUNDED");

        const amount = Number(b.escrowAmount ?? b.reward ?? 0);
        if (!(amount > 0)) throw new Error("NO_ESCROW");
        const ts = FV.serverTimestamp();

        if (posterUid) {
            // sellers.accountBalance if they have a seller account; otherwise users.walletBalance
            if (sellerSnap?.exists) {
                tx.update(sellerRef, { accountBalance: FV.increment(amount), updatedAt: ts });
            } else {
                tx.set(adminDb.collection("users").doc(posterUid), {
                    walletBalance: FV.increment(amount), updatedAt: ts,
                }, { merge: true });
            }
            tx.set(refundTxRef, {
                sellerId: posterUid, userId: posterUid, type: "bounty_refund", bountyId,
                bookTitle: `↩️ Bounty refund — ${b.title || "Bounty"}`,
                buyerName: "LAN Library", amount, amountNGN: amount, sellerAmount: amount,
                status: "completed", createdAt: ts,
            });
        }

        tx.update(bountyRef, {
            status: "refunded", escrowLocked: false, escrowStatus: "refunded",
            escrowRefundedAt: ts, escrowRefundedBy: adminUid, refundReason: why, updatedAt: ts,
        });
        tx.set(escrowRef, {
            totalHeld: FV.increment(-amount), totalRefunded: FV.increment(amount), updatedAt: ts,
        }, { merge: true });

        return { posterUid, bidders: b.claimedBy || [], title: b.title, amount };
    });

    await Promise.allSettled([
        r.posterUid && createInAppNotification({
            userId: r.posterUid, type: "bounty_refunded", title: "Bounty refunded",
            message: `₦${r.amount.toLocaleString("en-NG")} was returned to your balance. Reason: ${why}`,
            link: "/my-account/seller-account", extra: { bountyId },
        }),
        ...r.bidders.map((uid) => createInAppNotification({
            userId: uid, type: "bounty_closed", title: "Bounty closed",
            message: `"${r.title}" was closed and refunded. Reason: ${why}`, extra: { bountyId },
        })),
    ]);
    return {};
}

const ACTIONS = { approve, reject, refund };

export async function POST(req) {
    const adminUid = await requireAdmin(req);
    if (!adminUid) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { action, bountyId, reason } = await req.json().catch(() => ({}));
    if (!bountyId || !ACTIONS[action]) return NextResponse.json({ error: "Bad request" }, { status: 400 });

    try {
        const out = await ACTIONS[action]({ bountyId, reason, adminUid });
        return NextResponse.json({ success: true, ...out });
    } catch (e) {
        if (KNOWN.includes(e.message)) return NextResponse.json({ error: e.message }, { status: 400 });
        console.error("Bounty admin action failed:", action, e);
        return NextResponse.json({ error: "Action failed." }, { status: 500 });
    }
}