import { NextResponse } from "next/server";
import { db } from "@/lib/firebaseConfig";
import {
    collection, query, where, getDocs,
    doc, getDoc, updateDoc, addDoc,
    serverTimestamp, runTransaction,
} from "firebase/firestore";

export async function GET(req) {
    // Protect with a secret so only cron can call it
    const secret = req.headers.get("x-cron-secret");
    if (secret !== process.env.CRON_SECRET) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const now = new Date();

        // Find all open/claimed bounties whose deadline has passed and haven't been refunded yet
        const q = query(
            collection(db, "bounties"),
            where("status", "in", ["open", "claimed"]),
            where("escrowStatus", "!=", "refunded"),
        );

        const snap = await getDocs(q);
        const expired = snap.docs
            .map(d => ({ id: d.id, ...d.data() }))
            .filter(b => {
                if (!b.deadline) return false;
                const deadline = b.deadline?.toDate
                    ? b.deadline.toDate()
                    : new Date(b.deadline);
                return deadline < now;
            });

        const results = [];

        for (const bounty of expired) {
            try {
                await runTransaction(db, async (txn) => {

                    // ── ALL READS FIRST (Firestore transaction requirement) ──────────

                    // Read poster's wallet (the student who posted the bounty)
                    const posterRef = bounty.postedById
                        ? doc(db, "sellers", bounty.postedById)
                        : null;
                    const posterSnap = posterRef ? await txn.get(posterRef) : null;

                    // Read seller's wallet (the author who claimed the bounty, if any)
                    const sellerRef = bounty.claimedBy
                        ? doc(db, "sellers", bounty.claimedBy)
                        : null;
                    const sellerSnap = sellerRef ? await txn.get(sellerRef) : null;

                    // ── ALL WRITES AFTER ────────────────────────────────────────────

                    // 1. Mark bounty as refunded
                    txn.update(doc(db, "bounties", bounty.id), {
                        status: "refunded",
                        escrowStatus: "refunded",
                        escrowRefundedAt: serverTimestamp(),
                        escrowRefundedBy: "system:auto",
                        refundReason: "Deadline passed with no approved fulfilment",
                        refundMethod: bounty.paymentMethod === "wallet"
                            ? "wallet_credit"
                            : "manual_flutterwave",
                    });

                    // 2. Refund poster's wallet (wallet payments only)
                    //    For Flutterwave payments, flag for manual review — real refund
                    //    requires a Flutterwave API call outside this transaction.
                    if (
                        bounty.paymentMethod === "wallet" &&
                        posterRef &&
                        posterSnap?.exists()
                    ) {
                        txn.update(posterRef, {
                            accountBalance:
                                (posterSnap.data().accountBalance || 0) + bounty.reward,
                            updatedAt: serverTimestamp(),
                        });
                    }

                    // 3. Credit seller back if someone had claimed the bounty
                    //    (they never got paid since it wasn't fulfilled, but return
                    //    any escrow-held amount that may have been reserved for them)
                    if (sellerRef && sellerSnap?.exists()) {
                        txn.update(sellerRef, {
                            accountBalance:
                                (sellerSnap.data().accountBalance || 0) + bounty.reward,
                            updatedAt: serverTimestamp(),
                        });
                    }

                    // 4. Notify poster (student who posted the bounty)
                    if (bounty.postedById) {
                        txn.set(doc(collection(db, "notifications")), {
                            userId: bounty.postedById,
                            type: "bounty_refunded",
                            title: "Bounty Expired — Refund Issued",
                            message: bounty.paymentMethod === "wallet"
                                ? `No one fulfilled "${bounty.title}" before the deadline. ₦${Number(bounty.reward).toLocaleString()} has been returned to your wallet.`
                                : `No one fulfilled "${bounty.title}" before the deadline. Your Flutterwave refund is being processed — allow 3–5 business days.`,
                            createdAt: serverTimestamp(),
                            read: false,
                        });
                    }

                    // 5. Notify seller (author who claimed but never uploaded)
                    if (bounty.claimedBy) {
                        txn.set(doc(collection(db, "notifications")), {
                            userId: bounty.claimedBy,
                            type: "refund_credited",
                            title: "Bounty Expired — Funds Returned",
                            message: `The bounty "${bounty.title}" expired before you uploaded a fulfilment. ₦${Number(bounty.reward).toLocaleString()} has been returned to your wallet. No payout was issued.`,
                            createdAt: serverTimestamp(),
                            read: false,
                        });
                    }
                });

                results.push({
                    id: bounty.id,
                    title: bounty.title,
                    status: "refunded",
                    posterCredited: bounty.paymentMethod === "wallet" && !!bounty.postedById,
                    sellerCredited: !!bounty.claimedBy,
                    refundMethod: bounty.paymentMethod === "wallet"
                        ? "wallet_credit"
                        : "manual_flutterwave",
                });

            } catch (e) {
                results.push({
                    id: bounty.id,
                    title: bounty.title,
                    status: "failed",
                    error: e.message,
                });
            }
        }

        return NextResponse.json({
            processed: results.length,
            refunded: results.filter(r => r.status === "refunded").length,
            failed: results.filter(r => r.status === "failed").length,
            results,
            timestamp: new Date().toISOString(),
        });

    } catch (e) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}