// /api/lan-bank/transfer/route.js
import { adminDb, admin } from "@/lib/firebase-admin";

const OWNER_EMAILS = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || "")
    .split(",").map(e => e.trim());

async function verifyAdmin(req) {
    const token = req.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) throw new Error("No token");
    const decoded = await admin.auth().verifyIdToken(token);
    if (!OWNER_EMAILS.includes(decoded.email)) throw new Error("Not admin");
    return decoded;
}

export async function POST(req) {
    try {
        const adminUser = await verifyAdmin(req);
        const { mode, sellerId, targetId, amount, reason } = await req.json();

        if (!sellerId || !reason) {
            return Response.json({ error: "Missing fields" }, { status: 400 });
        }

        const sellerRef = adminDb.collection("sellers").doc(sellerId);

        if (mode === "debit") {
            await adminDb.runTransaction(async (txn) => {
                const snap = await txn.get(sellerRef);
                if (!snap.exists) throw new Error("Seller not found");
                const bal = snap.data().accountBalance || 0;
                if (bal < amount) throw new Error("Insufficient balance");

                txn.update(sellerRef, {
                    accountBalance: admin.firestore.FieldValue.increment(-amount),
                    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                });
                txn.set(adminDb.collection("adminWithdrawals").doc(), {
                    sellerId,
                    sellerName: snap.data().sellerName || snap.data().bankDetails?.accountName || "",
                    amount, reason,
                    type: "admin_debit",
                    adminEmail: adminUser.email,
                    createdAt: admin.firestore.FieldValue.serverTimestamp(),
                    status: "completed",
                });
                txn.set(adminDb.collection("notifications").doc(), {
                    userId: sellerId,
                    type: "admin_debit",
                    title: "Account Adjustment",
                    message: `₦${Number(amount).toLocaleString()} was debited from your wallet by LAN admin. Reason: ${reason}`,
                    createdAt: admin.firestore.FieldValue.serverTimestamp(),
                    read: false,
                });
            });

        } else if (mode === "credit") {
            if (!targetId) throw new Error("No target seller specified");
            const targetRef = adminDb.collection("sellers").doc(targetId);

            await adminDb.runTransaction(async (txn) => {
                const sSnap = await txn.get(sellerRef);
                if (!sSnap.exists) throw new Error("Sender not found");
                if ((sSnap.data().accountBalance || 0) < amount) throw new Error("Insufficient balance");

                const tSnap = await txn.get(targetRef);
                if (!tSnap.exists) throw new Error("Recipient not found");

                txn.update(sellerRef, {
                    accountBalance: admin.firestore.FieldValue.increment(-amount),
                    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                });
                txn.update(targetRef, {
                    accountBalance: admin.firestore.FieldValue.increment(amount),
                    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                });
                txn.set(adminDb.collection("transfers").doc(), {
                    senderId: sellerId,
                    senderName: sSnap.data().sellerName || "",
                    senderAccountNumber: sSnap.data().accountNumber || "",
                    recipientId: targetId,
                    recipientName: tSnap.data().sellerName || "",
                    recipientAccountNumber: tSnap.data().accountNumber || "",
                    amount, fee: 0, totalDeducted: amount,
                    note: reason, type: "admin_credit",
                    adminEmail: adminUser.email,
                    createdAt: admin.firestore.FieldValue.serverTimestamp(),
                    status: "completed",
                });
                txn.set(adminDb.collection("notifications").doc(), {
                    userId: targetId,
                    type: "admin_credit",
                    title: "Wallet Credited",
                    message: `₦${Number(amount).toLocaleString()} was credited to your wallet by LAN admin. Reason: ${reason}`,
                    createdAt: admin.firestore.FieldValue.serverTimestamp(),
                    read: false,
                });
            });

        } else if (mode === "withdrawal_approve") {
            if (!targetId) throw new Error("No withdrawal ID");
            const wRef = adminDb.collection("withdrawals").doc(targetId);

            await adminDb.runTransaction(async (txn) => {
                const wSnap = await txn.get(wRef);
                if (!wSnap.exists) throw new Error("Withdrawal not found");
                const w = wSnap.data();
                if (w.status !== "pending") throw new Error("Already processed");

                const sSnap = await txn.get(sellerRef);
                if ((sSnap.data()?.accountBalance || 0) < w.amount) throw new Error("Insufficient balance");

                txn.update(wRef, {
                    status: "completed",
                    reviewedAt: admin.firestore.FieldValue.serverTimestamp(),
                    reviewedBy: adminUser.email,
                });
                txn.update(sellerRef, {
                    accountBalance: admin.firestore.FieldValue.increment(-w.amount),
                    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                });
                txn.set(adminDb.collection("notifications").doc(), {
                    userId: sellerId,
                    type: "withdrawal_approved",
                    title: "Withdrawal Approved",
                    message: `Your withdrawal of ₦${Number(w.amount).toLocaleString()} has been approved and is being processed.`,
                    createdAt: admin.firestore.FieldValue.serverTimestamp(),
                    read: false,
                });
            });

        } else if (mode === "withdrawal_reject") {
            if (!targetId) throw new Error("No withdrawal ID");
            const wRef = adminDb.collection("withdrawals").doc(targetId);

            await adminDb.runTransaction(async (txn) => {
                const wSnap = await txn.get(wRef);
                if (!wSnap.exists) throw new Error("Withdrawal not found");
                if (wSnap.data().status !== "pending") throw new Error("Already processed");

                txn.update(wRef, {
                    status: "rejected",
                    reviewedAt: admin.firestore.FieldValue.serverTimestamp(),
                    reviewedBy: adminUser.email,
                });
                txn.set(adminDb.collection("notifications").doc(), {
                    userId: sellerId,
                    type: "withdrawal_rejected",
                    title: "Withdrawal Rejected",
                    message: `Your withdrawal request was rejected. Contact support for details.`,
                    createdAt: admin.firestore.FieldValue.serverTimestamp(),
                    read: false,
                });
            });

        } else {
            return Response.json({ error: "Unknown mode" }, { status: 400 });
        }

        return Response.json({ success: true });

    } catch (e) {
        console.error("LAN Bank API error:", e.message);
        return Response.json({ error: e.message }, { status: 400 });
    }
}