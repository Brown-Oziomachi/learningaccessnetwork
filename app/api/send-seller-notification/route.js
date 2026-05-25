// app/api/send-seller-notification/route.js

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
const FROM = "LAN Library <noreply@learningaccessnetwork.com>";

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
    new_bounty: "transactional",
    bounty_bid: "transactional",
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
    abandoned_cart: "📚 You left something behind in your LAN Library saved book",
    new_bounty: (d) => `New Bounty: "${d.bountyTitle}" — ₦${Number(d.reward).toLocaleString()} up for grabs`,
    bounty_bid: `Someone bid on your bounty! 🎯`,
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

            /* ── 9. New bounty → all users ── */
            case "new_bounty": {
                const { posterName, bountyTitle, reward, university, department, ctaUrl } = data;
                subject = typeof SUBJECTS.new_bounty === "function"
                    ? SUBJECTS.new_bounty({ bountyTitle, reward })
                    : SUBJECTS.new_bounty;
                html = buildBountyEmail({
                    preheader: `${posterName || "A student"} posted a ₦${Number(reward).toLocaleString("en-NG")} bounty — be the first to claim it!`,
                    heading: `New Bounty: "${bountyTitle}"`,
                    body: `
      <p><strong style="color:#0d2244">${posterName || "A student"}</strong> just posted a paid academic request on the LAN Library Bounty Board.</p>
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f0e8;border:1px solid #e5ddd0;margin:18px 0">
        <tr><td style="padding:18px 20px">
          <p style="font-size:9px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:#b8963e;margin:0 0 5px">Bounty Reward</p>
          <p style="font-family:Georgia,serif;font-size:28px;font-weight:normal;color:#0d2244;margin:0">₦${Number(reward).toLocaleString("en-NG")}</p>
          <p style="font-size:11px;color:#888;margin:4px 0 0">Author earns ₦${Math.round(reward * 0.8).toLocaleString("en-NG")} (80%)</p>
        </td></tr>
      </table>
      ${university ? `<p><strong>University:</strong> ${university}</p>` : ""}
      ${department ? `<p><strong>Department:</strong> ${department}</p>` : ""}
      <p>Be the first to claim this bounty, upload the requested material, and earn your reward automatically.</p>
    `,
                    ctaText: "View & Claim Bounty",
                    ctaUrl,
                });
                break;
            }

            /* ── 10. Bounty bid → poster ── */
            case "bounty_bid": {
                const { posterName, bidderName, bountyTitle, reward, university, department, ctaUrl } = data;
                const payout = Math.round((reward || 0) * 0.8);
                subject = SUBJECTS.bounty_bid;
                html = buildBountyEmail({
                    preheader: `${bidderName || "An author"} has claimed your bounty and is working on your material.`,
                    heading: `Your bounty has been claimed, ${posterName || "Student"}!`,
                    body: `
      <p><strong style="color:#0d2244">${bidderName || "An author"}</strong> has claimed your bounty request and is now working on your material.</p>
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f0e8;border:1px solid #e5ddd0;margin:18px 0">
        <tr><td style="padding:18px 20px">
          <p style="font-size:9px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:#b8963e;margin:0 0 5px">Your Request</p>
          <p style="font-family:Georgia,serif;font-size:18px;font-weight:normal;color:#0d2244;margin:0">"${bountyTitle}"</p>
          ${university ? `<p style="font-size:11px;color:#888;margin:6px 0 0">${university}${department ? ` · ${department}` : ""}</p>` : ""}
        </td></tr>
      </table>
      <p>Once the author uploads the material, you will be notified to review and approve it. Your escrow of <strong style="color:#0d2244">₦${Number(reward).toLocaleString("en-NG")}</strong> remains safely locked until you approve.</p>
      <p style="font-size:12px;color:#888">The author earns <strong>₦${payout.toLocaleString("en-NG")}</strong> only after your approval. LAN Library retains 20% as a platform fee.</p>
    `,
                    ctaText: "View Your Bounty",
                    ctaUrl,
                });
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