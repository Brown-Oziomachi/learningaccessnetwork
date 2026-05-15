// app/api/send-seller-notification/route.js
// ─────────────────────────────────────────────────────────────────
// Unified outbound email endpoint powered by Resend.
// Called by:
//   • Firebase Cloud Functions (all 5 triggers)
//   • /api/webhooks/flutterwave   (book purchase → seller alert)
//   • /api/resend-receipt         (manual buyer resend)
//
// Body shape:
// {
//   type: "sale_alert" | "book_approved" | "seller_welcome" |
//         "low_balance" | "payout_success" | "abandoned_cart" |
//         "order_receipt" | "ad_boost",
//
//   // recipient
//   to:          string,          // required
//   userId?:     string,          // for opt-out check
//
//   // per-type payload (see each builder below)
//   ...rest
// }
// ─────────────────────────────────────────────────────────────────

import { NextResponse } from "next/server";
import { Resend } from "resend";
import { db } from "@/lib/firebaseConfig";
import { doc, getDoc } from "firebase/firestore";
import {
    buildSellerWelcome,
    buildBookApproved,
    buildLowBalance,
    buildPayoutSuccess,
    buildAbandonedCart,
    buildOrderReceipt,
    buildSaleAlert,
    buildAdBoost,
} from "@/lib/emailTemplates";   // ← copy emailTemplates.js → lib/emailTemplates.js

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = "LAN Library <noreply@lanlibrary.com>";

/* ── email category used for opt-out checks ── */
const CATEGORY_MAP = {
    seller_welcome: "transactional",
    book_approved: "transactional",
    low_balance: "transactional",
    payout_success: "transactional",
    order_receipt: "transactional",
    sale_alert: "transactional",
    ad_boost: "transactional",
    abandoned_cart: "marketing",
};

/* ── subject lines ── */
const SUBJECTS = {
    seller_welcome: "Welcome to LAN Library — Your Seller Account is Active",
    book_approved: (d) => `🎉 "${d.bookTitle}" is now Live on LAN Library`,
    low_balance: "⚠️ Your LAN Library balance is running low",
    payout_success: (d) => `✅ Payout of ₦${Number(d.amount).toLocaleString()} Processed`,
    order_receipt: (d) => `Your Receipt — "${d.bookTitle}"`,
    sale_alert: (d) => `🎉 New Sale — "${d.bookTitle}" — ₦${Number(d.netEarning).toLocaleString()} earned`,
    ad_boost: (d) => `✅ Your Ad Boost is Active — ${d.tier} · ${d.durationDays} days`,
    abandoned_cart: "📚 You left something behind in your LAN Library cart",
};

/* ─────────────────────────────────────────────────────────────────
   Opt-out guard
   Transactional emails cannot be opted out of.
   Marketing / educational respect emailSettings.
───────────────────────────────────────────────────────────────── */
async function isOptedOut(userId, category) {
    if (!userId || category === "transactional") return false;
    try {
        const snap = await getDoc(doc(db, "users", userId));
        const settings = snap.data()?.emailSettings || {};
        return settings[category] === false;
    } catch {
        return false; // fail-open: send anyway if we can't check
    }
}

/* ─────────────────────────────────────────────────────────────────
   POST /api/send-seller-notification
───────────────────────────────────────────────────────────────── */
export async function POST(request) {
    try {
        const body = await request.json();
        const { type, to, userId, ...data } = body;

        /* ── Basic validation ── */
        if (!type || !to) {
            return NextResponse.json({ error: "Missing type or to" }, { status: 400 });
        }

        /* ── Opt-out check ── */
        const category = CATEGORY_MAP[type] ?? "transactional";
        if (await isOptedOut(userId, category)) {
            console.log(`[mail] Skipped ${type} to ${to} — opted out`);
            return NextResponse.json({ skipped: true, reason: "opted_out" });
        }

        /* ── Build HTML + subject ── */
        let html;
        let subject;

        switch (type) {
            /* ── 1. Sale alert → seller ── */
            case "sale_alert": {
                const { sellerName, bookTitle, amount, netEarning, buyerEmail, currentBalance } = data;
                subject = typeof SUBJECTS.sale_alert === "function"
                    ? SUBJECTS.sale_alert({ bookTitle, netEarning })
                    : SUBJECTS.sale_alert;
                html = buildSaleAlert({ sellerName, bookTitle, amount, netEarning, buyerEmail, currentBalance });
                break;
            }

            /* ── 2. Seller welcome ── */
            case "seller_welcome": {
                subject = SUBJECTS.seller_welcome;
                html = buildSellerWelcome({ name: data.name || data.sellerName || "Seller" });
                break;
            }

            /* ── 3. Book approved ── */
            case "book_approved": {
                const { bookTitle, sellerName } = data;
                subject = SUBJECTS.book_approved({ bookTitle });
                html = buildBookApproved({ name: sellerName || "Seller", bookTitle });
                break;
            }

            /* ── 4. Low balance ── */
            case "low_balance": {
                subject = SUBJECTS.low_balance;
                html = buildLowBalance({ name: data.name || data.sellerName || "Seller", balance: data.balance ?? data.accountBalance ?? 0 });
                break;
            }

            /* ── 5. Payout success ── */
            case "payout_success": {
                const { amount, bankName, accountName, withdrawalId, sellerName } = data;
                subject = SUBJECTS.payout_success({ amount });
                html = buildPayoutSuccess({ name: sellerName || "Seller", amount: Number(amount).toLocaleString(), bankName, accountName, withdrawalId: withdrawalId || "N/A" });
                break;
            }

            /* ── 6. Order receipt → buyer ── */
            case "order_receipt": {
                const { buyerName, bookTitle, amount, sellerName, orderId } = data;
                subject = SUBJECTS.order_receipt({ bookTitle });
                html = buildOrderReceipt({ name: buyerName || "Reader", bookTitle, amount: Number(amount).toLocaleString(), sellerName, orderId: orderId || "N/A" });
                break;
            }

            /* ── 7. Abandoned cart ── */
            case "abandoned_cart": {
                const { name, cartItems = [] } = data;
                subject = SUBJECTS.abandoned_cart;
                html = buildAbandonedCart({ name: name || "Reader", cartItems });
                break;
            }

            /* ── 8. Ad boost confirmation ── */
            case "ad_boost": {
                const { sellerName, tier, durationDays, amount } = data;
                subject = SUBJECTS.ad_boost({ tier, durationDays });
                html = buildAdBoost({ name: sellerName || "Seller", tier, durationDays, amount: Number(amount).toLocaleString() });
                break;
            }

            default:
                return NextResponse.json({ error: `Unknown email type: ${type}` }, { status: 400 });
        }

        /* ── Send via Resend ── */
        const { data: resendData, error: resendError } = await resend.emails.send({
            from: FROM,
            to: [to],
            subject,
            html,
        });

        if (resendError) {
            console.error("[mail] Resend error:", resendError);
            return NextResponse.json({ error: resendError.message }, { status: 500 });
        }

        console.log(`[mail] ✓ ${type} → ${to} (id: ${resendData?.id})`);
        return NextResponse.json({ success: true, id: resendData?.id });

    } catch (err) {
        console.error("[mail] Unexpected error:", err);
        return NextResponse.json({ error: err.message || "Server error" }, { status: 500 });
    }
}