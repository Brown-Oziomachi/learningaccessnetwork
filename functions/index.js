/**
 * LAN Library — Firebase Cloud Functions v2
 * All 5 email triggers call the Next.js /api/send-seller-notification
 * route (powered by Resend) — no Firebase mail extension needed.
 *
 * Deploy:  firebase deploy --only functions
 * Config:  firebase functions:config:set app.site_url="https://lanlibrary.com"
 */

const functions = require("firebase-functions");
const admin = require("firebase-admin");
const fetch = require("node-fetch"); // npm i node-fetch@2

admin.initializeApp();
const db = admin.firestore();

/* ─────────────────────────────────────────────────────────────────
   HELPER — POST to the Next.js /api/send-seller-notification route
───────────────────────────────────────────────────────────────── */
const SITE_URL = () =>
    functions.config().app?.site_url ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    "https://lanlibrary.com";

async function callMailAPI(payload) {
    const url = `${SITE_URL()}/api/send-seller-notification`;
    try {
        const res = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });
        const json = await res.json();
        if (!res.ok) { functions.logger.error("[mail] API error:", json); return null; }
        functions.logger.info(`[mail] ✓ ${payload.type} → ${payload.to}`);
        return json;
    } catch (err) {
        functions.logger.error("[mail] Network error:", err.message);
        return null;
    }
}

/* ═══════════════════════════════════════════════════════════════
   1. SELLER WELCOME
═══════════════════════════════════════════════════════════════ */
exports.onSellerCreated = functions.firestore
    .document("users/{userId}")
    .onCreate(async (snap, context) => {
        const data = snap.data();
        if (!data?.isSeller || !data?.email) return null;
        return callMailAPI({
            type: "seller_welcome",
            to: data.email,
            userId: context.params.userId,
            name: data.displayName || data.name || "Seller",
        });
    });

/* ═══════════════════════════════════════════════════════════════
   2. BOOK APPROVAL
   Watches schoolDocuments + advertMyBook (the 4-intent upload).
═══════════════════════════════════════════════════════════════ */
async function handleBookApproval(change) {
    const before = change.before.data();
    const after = change.after.data();
    if (before.status === "verified" || after.status !== "verified") return null;
    const { sellerEmail, sellerName, bookTitle, sellerId } = after;
    if (!sellerEmail) return null;
    return callMailAPI({
        type: "book_approved",
        to: sellerEmail,
        userId: sellerId || null,
        bookTitle: bookTitle || "Your Document",
        sellerName: sellerName || "Seller",
    });
}

exports.onSchoolDocApproved = functions.firestore.document("schoolDocuments/{docId}").onUpdate(handleBookApproval);
exports.onAdvertBookApproved = functions.firestore.document("advertMyBook/{docId}").onUpdate(handleBookApproval);

/* ═══════════════════════════════════════════════════════════════
   3. LOW BALANCE ALERT — fires once per dip below ₦2,000
═══════════════════════════════════════════════════════════════ */
exports.onLowBalance = functions.firestore
    .document("users/{userId}")
    .onUpdate(async (change, context) => {
        const before = change.before.data();
        const after = change.after.data();
        const wasFine = (before.accountBalance ?? Infinity) >= 2000;
        const nowLow = (after.accountBalance ?? 0) < 2000;
        const alreadySent = after.lowBalanceAlertSent === true;
        if (!wasFine || !nowLow || alreadySent) return null;
        if (!after.isSeller && !after.isLecturer) return null;
        if (!after.email) return null;
        await change.after.ref.update({ lowBalanceAlertSent: true });
        return callMailAPI({
            type: "low_balance",
            to: after.email,
            userId: context.params.userId,
            name: after.displayName || after.name || "Seller",
            balance: after.accountBalance,
        });
    });

exports.onBalanceRecovered = functions.firestore
    .document("users/{userId}")
    .onUpdate(async (change) => {
        const before = change.before.data();
        const after = change.after.data();
        if ((before.accountBalance ?? 0) >= 2000) return null;
        if ((after.accountBalance ?? 0) < 2000) return null;
        if (after.lowBalanceAlertSent !== true) return null;
        return change.after.ref.update({ lowBalanceAlertSent: false });
    });

/* ═══════════════════════════════════════════════════════════════
   4. PAYOUT SUCCESS
═══════════════════════════════════════════════════════════════ */
exports.onPayoutCompleted = functions.firestore
    .document("withdrawals/{withdrawalId}")
    .onUpdate(async (change, context) => {
        const before = change.before.data();
        const after = change.after.data();
        if (before.status === "completed" || after.status !== "completed") return null;
        const { userId, amount, bankName, accountName } = after;
        if (!userId) return null;
        const userSnap = await db.doc(`users/${userId}`).get();
        const user = userSnap.data();
        if (!user?.email) return null;
        return callMailAPI({
            type: "payout_success",
            to: user.email,
            userId,
            sellerName: user.displayName || user.name || "Seller",
            amount,
            bankName: bankName || null,
            accountName: accountName || null,
            withdrawalId: context.params.withdrawalId,
        });
    });

/* ═══════════════════════════════════════════════════════════════
   5. ABANDONED CART — daily at 10:00 AM WAT
═══════════════════════════════════════════════════════════════ */
exports.abandonedCartReminder = functions.pubsub
    .schedule("0 9 * * *")
    .timeZone("Africa/Lagos")
    .onRun(async () => {
        const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const snapshot = await db.collection("users").where("cartCount", ">", 0).get();
        const jobs = [];

        for (const userDoc of snapshot.docs) {
            const user = userDoc.data();
            const userId = userDoc.id;
            if (!user.email) continue;
            if (user.lastPurchaseAt?.toDate() > cutoff) continue;

            const cartSnap = await db.collection(`users/${userId}/cart`).limit(3).get();
            if (cartSnap.empty) continue;

            const cartItems = cartSnap.docs.map(d => ({
                title: d.data().bookTitle || d.data().title || "Document",
                price: d.data().price || 0,
            }));

            jobs.push(callMailAPI({
                type: "abandoned_cart",
                to: user.email,
                userId,
                name: user.displayName || user.name || "Reader",
                cartItems,
            }));
        }

        await Promise.allSettled(jobs);
        functions.logger.info(`[abandonedCart] Processed ${jobs.length} reminders`);
        return null;
    });

/* ═══════════════════════════════════════════════════════════════
   6. ORDER RECEIPT — new purchase doc fires a buyer receipt
═══════════════════════════════════════════════════════════════ */
exports.onPurchaseCreated = functions.firestore
    .document("purchases/{purchaseId}")
    .onCreate(async (snap, context) => {
        const data = snap.data();
        if (!data.buyerEmail) return null;
        return callMailAPI({
            type: "order_receipt",
            to: data.buyerEmail,
            userId: data.buyerId || null,
            buyerName: data.buyerName || "Reader",
            bookTitle: data.bookTitle || "Document",
            amount: data.amount || 0,
            sellerName: data.sellerName || "LAN Library",
            orderId: context.params.purchaseId,
        });
    });