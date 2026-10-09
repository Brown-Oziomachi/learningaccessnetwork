import { Resend } from "resend";
import {
    buildSellerWelcome,
    buildBookApproved,
    buildLowBalance,
    buildPayoutSuccess,
    buildAbandonedCart,
    buildOrderReceipt,
    buildSaleAlert,
    buildAdBoost,
    buildBountyEmail,
    buildWithdrawalOtp,
    buildNewFollower,
} from "@/lib/emailTemplates";

import { adminDb, admin } from "./firebase-admin";

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM = "LAN Library <noreply@learningaccessnetwork.com>";
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
    withdrawal_otp: "transactional",
    new_follower: "social",        
    bounty_posted: "transactional",
    print_license_confirmed: "transactional",
    pin_reset_otp: "transactional",
};

const esc = (s) => s.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const escapeDeep = (v) => {
    if (typeof v === "string") return esc(v);
    if (Array.isArray(v)) return v.map(escapeDeep);
    if (v && typeof v === "object") return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, escapeDeep(x)]));
    return v;
};
const unesc = (s) => String(s).replace(/&amp;|&lt;|&gt;|&quot;|&#39;/g,
    (m) => ({ "&amp;": "&", "&lt;": "<", "&gt;": ">", "&quot;": '"', "&#39;": "'" }[m]));


const SUBJECTS = {
    seller_welcome: "Welcome to LAN Library — Your Seller Account is Active",
    book_approved: (d) => `🎉 "${d.bookTitle}" is now Live on LAN Library`,
    low_balance: "⚠️ Your LAN Library balance is running low",
    payout_success: (d) => `✅ Payout of ₦${Number(d.amount).toLocaleString()} Processed`,
    order_receipt: (d) => `Your Receipt — "${d.bookTitle}"`,
    sale_alert: (d) => `🎉 New Sale — "${d.bookTitle}" — ₦${Number(d.netEarning).toLocaleString()} earned`,
    ad_boost: (d) => `✅ Your Ad Boost is Active — ${d.tier} · ${d.durationDays} days`,
    abandoned_cart: "📚 You left something behind in your LAN Library saved book",
    new_bounty: (d) => `💰 New Bounty: "${d.bountyTitle}" — ₦${Number(d.reward).toLocaleString("en-NG")}`,
    bounty_bid: "🎯 Someone claimed your bounty",
    bounty_posted: (d) => `✅ Your bounty is live — ₦${Number(d.reward).toLocaleString("en-NG")} in escrow`,
    withdrawal_otp: "🔐 Your LAN Library withdrawal code",
    new_follower: (d) => `🎉 ${d.followerName} started following you`,
    pin_reset_otp: "🔐 Your transfer PIN reset code",
};

/**
 * Validates dynamic user preference opt-out arrays directly inside Admin SDK
 */
async function isOptedOut(userId, category) {
    if (!userId || category === "transactional") return false;
    try {
        const snap = await adminDb.collection("users").doc(userId).get();
        if (!snap.exists) return false;
        const settings = snap.data()?.emailSettings || {};
        return settings[category] === false;
    } catch {
        return false; // Fail-open matrix strategy 
    }
}

/**
 * Global application utility function to fire notifications anywhere on the server
 */

export async function createInAppNotification({ userId, type, title, message, link = null, extra = {} }) {
    if (!userId) return null;
    const ref = await adminDb.collection("notifications").add({
        userId, type, title, message, link, ...extra,
        read: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    return ref.id;
}

/** Email + in-app together. One failing never blocks the other. */
export async function notifyUser({ userId, to, type, data = {}, inApp }) {
    const jobs = [];
    if (inApp) jobs.push(createInAppNotification({ userId, ...inApp, type: inApp.type || type }));
    if (to) jobs.push(sendServerNotification({ type, to, userId, data }));
    const results = await Promise.allSettled(jobs);
    results.forEach((r) => r.status === "rejected" && console.error("[notifyUser]", type, r.reason?.message));
    return results;
}

export async function sendServerNotification({ type, to, userId, data: rawData = {} }) {
    if (!type || !to) throw new Error("Email type execution parameters are malformed");
    const data = escapeDeep(rawData);

    const category = CATEGORY_MAP[type] ?? "transactional";
    if (await isOptedOut(userId, category)) {
        console.log(`[Notification Engine]: Skipped muted block type ${type} targeting ${to}`);
        return { skipped: true, reason: "opted_out" };
    }

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
            
        /* ── 11. Print License Confirmed → Buyer ── */
        case "print_license_confirmed": {
            const { buyerName, bookTitle, orderId, ctaUrl } = data;

            // Set up standard fallback subject line
            subject = `Print Permission Granted: "${bookTitle}"`;

            // Build the structural HTML using your premium template wrapper
            html = buildBountyEmail({ // Using your library's standard structural layout function
                preheader: `Your print license for "${bookTitle}" has been verified and activated successfully.`,
                heading: `Print Permission Active! 🖨️`,
                body: `
            <p>Hello ${buyerName || "Reader"},</p>
            <p>We are happy to inform you that your payment for official print permissions has been securely verified by our ledger engine.</p>
            
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f0e8;border:1px solid #e5ddd0;margin:18px 0">
            <tr><td style="padding:18px 20px">
                <p style="font-size:9px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:#b8963e;margin:0 0 5px">Document Title</p>
                <p style="font-family:Georgia,serif;font-size:16px;font-weight:normal;color:#0d2244;margin:0">"${bookTitle}"</p>
                <p style="font-size:11px;color:#888;margin:6px 0 0">Order ID: <code style="background:#fff; padding:2px 4px; border:0.5px solid #e5ddd0">${orderId}</code></p>
            </td></tr>
            </table>
            
            <p>Your institutional print profile has been permanently upgraded. You can now unlock high-fidelity layout rendering, download verified modules, or send the layout parameters straight to your local printer configuration dashboard.</p>
            <p style="font-size:12px;color:#888">Thank you for supporting authors and maintaining academic integrity through LAN Library parameters.</p>
        `,
                ctaText: "Open Document & Print",
                ctaUrl,
            });
            break;
        }
        case "withdrawal_otp": {
            subject = SUBJECTS.withdrawal_otp;
            html = buildWithdrawalOtp({ name: data.name || "Seller", otp: data.otp, amount: data.amount });
            break;
        }
        case "new_follower": {
            subject = SUBJECTS.new_follower({ followerName: data.followerName || "A student" });
            html = buildNewFollower({
                name: data.name || "there",
                followerName: data.followerName || "A student",
                followerCount: data.followerCount || 1,
            });
            break;
        }
        case "bounty_posted": {
            subject = SUBJECTS.bounty_posted({ reward: data.reward });
            html = buildBountyEmail({
                preheader: `Your bounty is live with ₦${Number(data.reward).toLocaleString("en-NG")} held in escrow.`,
                heading: "Your bounty is live",
                body: `<p>Your request <strong style="color:#0d2244">"${data.bountyTitle}"</strong> is now on the Bounty Board. <strong>₦${Number(data.reward).toLocaleString("en-NG")}</strong> is held safely in escrow until you approve a submission.</p>`,
                ctaText: "View Your Bounty",
                ctaUrl: data.ctaUrl,
            });
            break;
        }
        case "pin_reset_otp": {
            subject = SUBJECTS.pin_reset_otp;
            html = buildWithdrawalOtp({ name: data.name || "Seller", otp: data.otp });
            break;
        }
        default:
            throw new Error(`Execution mismatch pattern. Key: ${type}`);
    }

    if (data.inApp && userId) {
        await adminDb.collection("notifications").add({
            userId,
            type,
            title: data.inApp.title,
            message: data.inApp.message,
            link: data.inApp.link || null,
            read: false,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
    }
    
    const result = await resend.emails.send({ from: FROM, to: [to], subject: unesc(subject), html });
    if (result.error) throw new Error(result.error.message);

    console.log(`📧 [Engine Dispatch] Success: ${type} delivered to ${to}`);
    return { success: true, id: result.data?.id };
}