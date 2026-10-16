// app/api/transfer/route.js
import { NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import { verifyPinWithLockout } from "@/lib/pinLockout"; // ← use your helper's real file name

const FEE = 50;
const PLATFORM = "LAN_LIBRARY_PLATFORM";

export async function POST(req) {
    try {
        const token = req.headers.get("authorization")?.replace("Bearer ", "");
        if (!token) throw new Error("Unauthorized");
        const { uid } = await adminAuth.verifyIdToken(token);
        const { recipientId, amount, note, pin } = await req.json();
        const amt = Number(amount);

        if (!recipientId) throw new Error("Recipient required.");
        if (!Number.isInteger(amt) || amt < 100) throw new Error("Minimum transfer is ₦100");
        if (recipientId === uid) throw new Error("You can't transfer to yourself.");

        // 1. PIN check: counts wrong attempts, locks after 5, supports bcrypt + HMAC hashes
        const pinCheck = await verifyPinWithLockout(uid, pin);
        if (!pinCheck.ok) throw new Error(pinCheck.error);

        const senderRef = adminDb.doc(`sellers/${uid}`);
        const recipRef = adminDb.doc(`sellers/${recipientId}`);
        const platRef = adminDb.doc(`sellers/${PLATFORM}`);
        const total = amt + FEE;

        // 2. Money movement
        await adminDb.runTransaction(async (tx) => {
            const [sender, recip] = await Promise.all([tx.get(senderRef), tx.get(recipRef)]);
            if (!sender.exists) throw new Error("Sender account not found.");
            if (!recip.exists) throw new Error("Recipient not found.");
            if ((sender.data().accountBalance || 0) < total) throw new Error("Insufficient balance.");

            tx.update(senderRef, { accountBalance: FieldValue.increment(-total), updatedAt: FieldValue.serverTimestamp() });
            tx.update(recipRef, { accountBalance: FieldValue.increment(amt), updatedAt: FieldValue.serverTimestamp() });
            tx.set(platRef, { accountBalance: FieldValue.increment(FEE), totalFeesCollected: FieldValue.increment(FEE) }, { merge: true });

            const s = sender.data(), r = recip.data();
            const tRef = adminDb.collection("transfers").doc();
            tx.set(tRef, {
                senderId: uid,
                senderName: s.businessInfo?.businessName || s.bankDetails?.accountName || "Unknown",
                senderAccountNumber: s.accountNumber || "",
                recipientId,
                recipientName: r.businessInfo?.businessName || r.bankDetails?.accountName || r.sellerName || "Unknown",
                recipientAccountNumber: r.accountNumber || "",
                amount: amt, fee: FEE, totalDeducted: total,
                note: note || "", status: "completed", createdAt: FieldValue.serverTimestamp(),
            });
            tx.set(adminDb.collection("platformFees").doc(), {
                transferId: tRef.id, senderId: uid, fee: FEE, transferAmount: amt,
                createdAt: FieldValue.serverTimestamp(), disbursedToFlutterwave: false,
            });
        });
        return NextResponse.json({ success: true });
    } catch (e) {
        return NextResponse.json({ success: false, error: e.message }, { status: 400 });
    }
}