// lib/emailTemplates.js
// ─────────────────────────────────────────────────────────────────
// LAN Library — Premium Email Templates
// Navy (#0d2244) & Gold (#b38b59) theme.
// Compatible with Node.js (Cloud Functions) and Next.js API routes.
//
// All functions return a complete HTML string.
// Usage:
//   import { buildOrderReceipt } from "@/lib/emailTemplates";
//   const html = buildOrderReceipt({ name, bookTitle, amount, sellerName, orderId });
// ─────────────────────────────────────────────────────────────────

const NAVY = "#0d2244";
const GOLD = "#b38b59";
const CREAM = "#f8f4ed";
const LIGHT = "#f0ece4";
const WHITE = "#ffffff";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://learningaccessnetwork.com";
const PREFS_URL = `${BASE_URL}/profile/settings#notifications`;
const UNSUBSCRIBE_URL = `${BASE_URL}/unsubscribe`;

/* ─────────────────────────────────────────────────────────────────
   SHARED CHROME — header + footer wrapping every email
───────────────────────────────────────────────────────────────── */
function base({ preheader = "", accent = GOLD, body = "" }) {
  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <meta http-equiv="X-UA-Compatible" content="IE=edge"/>
  <!--[if mso]>
  <noscript><xml><o:OfficeDocumentSettings>
    <o:PixelsPerInch>96</o:PixelsPerInch>
  </o:OfficeDocumentSettings></xml></noscript>
  <![endif]-->
  <title>LAN Library</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=IM+Fell+English:ital@0;1&family=Lato:wght@300;400;700;900&display=swap');
    body,table,td,a{-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%}
    body{margin:0;padding:0;background:${CREAM};font-family:'Lato',Helvetica,Arial,sans-serif}
    table{border-collapse:collapse;mso-table-lspace:0pt;mso-table-rspace:0pt}
    img{-ms-interpolation-mode:bicubic;border:0;height:auto;line-height:100%;outline:none;text-decoration:none}
    .preheader{display:none!important;font-size:1px;color:#fefefe;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden}
    .serif{font-family:'IM Fell English',Georgia,'Times New Roman',serif!important}
    .wrapper{background:${CREAM};padding:32px 0}
    .email-body{background:${WHITE};max-width:600px;width:100%;margin:0 auto;border-left:1px solid #e8e0d4;border-right:1px solid #e8e0d4}
    a{color:${GOLD};text-decoration:underline}
    @media only screen and (max-width:620px){
      .wrapper{padding:0!important}
      .email-body{border-left:none!important;border-right:none!important}
      .content-cell{padding:28px 20px!important}
      .hide-sm{display:none!important}
      .amount-text{font-size:26px!important}
    }
  </style>
</head>
<body>
  <span class="preheader">${preheader}&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌</span>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" class="wrapper">
    <tr>
      <td align="center">
        <table role="presentation" class="email-body" cellpadding="0" cellspacing="0" width="600">

          <!-- ══ HEADER ══ -->
          <tr>
            <td style="background:${NAVY};padding:0;border-bottom:3px solid ${accent}">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:10px 40px 0">
                    <div style="border-top:1px solid rgba(179,139,89,0.35)"></div>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding:22px 40px">
                    <p class="serif" style="font-size:11px;letter-spacing:0.3em;text-transform:uppercase;color:${GOLD};margin:0 0 5px;font-style:normal">The</p>
                    <h1 class="serif" style="font-size:30px;font-weight:normal;color:${WHITE};margin:0;letter-spacing:0.04em">LAN Library</h1>
                    <p style="font-size:9px;letter-spacing:0.22em;text-transform:uppercase;color:rgba(255,255,255,0.35);margin:4px 0 0;font-family:'Lato',sans-serif">The Global Student Library</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:0 40px 14px">
                    <div style="border-top:1px solid rgba(179,139,89,0.35)"></div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- ══ BODY ══ -->
          ${body}

          <!-- ══ FOOTER ══ -->
          <tr>
            <td style="background:${NAVY};padding:28px 40px;border-top:3px solid ${accent}">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <p class="serif" style="color:${GOLD};font-size:13px;letter-spacing:0.28em;margin:0 0 14px;font-style:italic">✦ &nbsp; Scientia &nbsp; ✦</p>
                    <p style="margin:0 0 8px;font-size:12px;color:rgba(255,255,255,0.45);line-height:1.9;font-family:'Lato',sans-serif">
                      <a href="${PREFS_URL}" style="color:${GOLD};text-decoration:underline">Manage Email Preferences</a>
                      &nbsp;·&nbsp;
                      <a href="${UNSUBSCRIBE_URL}" style="color:rgba(255,255,255,0.35);text-decoration:underline">Unsubscribe from Marketing</a>
                    </p>
                    <p style="margin:0;font-size:10px;color:rgba(255,255,255,0.2);line-height:1.7;font-family:'Lato',sans-serif">
                    Learning Access Network Ltd &nbsp;·&nbsp; Lagos &amp; Abuja, Nigeria<br/>
                      You received this email because you have an account with LAN Library.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Bottom spacer -->
          <tr><td style="height:24px;background:${CREAM}"></td></tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/* ─── Helpers ─── */
function goldBar() {
  return `<tr><td style="height:4px;background:linear-gradient(to right,${GOLD},#d4a96a,${GOLD})"></td></tr>`;
}

function btn(text, url, bg = NAVY, color = WHITE) {
  return `<tr>
    <td align="center" style="padding:8px 40px">
      <a href="${url}" target="_blank"
        style="display:inline-block;background:${bg};color:${color};font-family:'Lato',Helvetica,Arial,sans-serif;
          font-size:11px;font-weight:900;letter-spacing:0.14em;text-transform:uppercase;
          text-decoration:none;padding:15px 40px;border-radius:2px;mso-padding-alt:15px 40px">
        ${text}
      </a>
    </td>
  </tr>`;
}

function infoTable(rows) {
  return rows.map(([label, value]) => `
    <tr>
      <td style="font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;
        color:#9ca3af;padding:8px 0;border-bottom:1px solid ${LIGHT};width:40%;vertical-align:top">${label}</td>
      <td style="font-size:13px;font-weight:600;color:${NAVY};padding:8px 0;border-bottom:1px solid ${LIGHT};
        text-align:right;vertical-align:top">${value}</td>
    </tr>`).join("");
}

function contentOpen(bg = WHITE) {
  return `<tr><td class="content-cell" style="padding:36px 40px;background:${bg}">`;
}
const contentClose = `</td></tr>`;

function label(text, color = GOLD) {
  return `<p style="font-size:9px;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;
    color:${color};margin:0 0 10px;font-family:'Lato',sans-serif">${text}</p>`;
}

function heading(text) {
  return `<h2 class="serif" style="font-size:26px;font-weight:normal;color:${NAVY};
    margin:0 0 14px;line-height:1.35">${text}</h2>`;
}

function para(text) {
  return `<p style="font-size:14px;color:#4b5563;line-height:1.8;margin:0 0 20px;
    font-family:'Lato',sans-serif">${text}</p>`;
}

/* ─────────────────────────────────────────────────────────────────
   1. SELLER WELCOME
───────────────────────────────────────────────────────────────── */
function buildSellerWelcome({ name }) {
  const body = `
    ${goldBar()}
    ${contentOpen()}
      ${label("✦  Seller Account Activated")}
      ${heading(`Welcome to LAN Library,<br/><em>${name}</em>`)}
      ${para(`Your seller account is now active. You can publish documents, lecture notes, past questions, and more — reaching thousands of students across Africa.`)}
      
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
        style="background:${CREAM};border:1px solid #e8e0d4;margin-bottom:28px">
        <tr>
          <td style="padding:20px 24px">
            ${label("Your Seller Privileges")}
            ${[
      ["Publish & Sell", "Upload PDFs, set your price, earn 80% per sale"],
      ["Live Analytics", "Track views, purchases and revenue in real-time"],
      ["Instant Payouts", "Withdraw earnings directly to your bank account"],
      ["Boost Documents", "Promote your materials to reach more students"],
    ].map(([t, d]) => `
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:10px">
                <tr>
                  <td width="18" valign="top" style="padding-top:4px">
                    <div style="width:5px;height:5px;border-radius:50%;background:${GOLD};margin-top:4px"></div>
                  </td>
                  <td>
                    <span style="font-size:13px;font-weight:700;color:${NAVY};font-family:'Lato',sans-serif">${t}</span>
                    <span style="font-size:13px;color:#6b7280;font-family:'Lato',sans-serif"> — ${d}</span>
                  </td>
                </tr>
              </table>`).join("")}
          </td>
        </tr>
      </table>
    ${contentClose}
    ${btn("Publish Your First Document", `${BASE_URL}/upload-document`, GOLD, WHITE)}
    <tr><td style="height:32px"></td></tr>`;

  return base({ preheader: `Welcome ${name} — your LAN Library seller account is now active.`, body });
}

/* ─────────────────────────────────────────────────────────────────
   2. SALE ALERT → Seller
───────────────────────────────────────────────────────────────── */
function buildSaleAlert({ sellerName, bookTitle, amount, netEarning, buyerEmail, currentBalance }) {
  const body = `
    ${goldBar()}
    ${contentOpen()}
      ${label("✦  New Sale")}
      ${heading(`Congratulations, <em>${sellerName}</em>!`)}
      ${para(`<strong style="color:${NAVY}">"${bookTitle}"</strong> was just purchased. Your earning has been added to your account balance.`)}

      <!-- Earnings highlight -->
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
        style="background:${NAVY};margin-bottom:24px">
        <tr>
          <td style="padding:24px 28px">
            ${label("Your Earning", "rgba(179,139,89,0.9)")}
            <p class="serif amount-text" style="font-size:34px;color:${GOLD};margin:0 0 4px;font-weight:normal">
              ₦${Number(netEarning).toLocaleString()}
            </p>
            <p style="font-size:12px;color:rgba(255,255,255,0.4);margin:0;font-family:'Lato',sans-serif">
              80% of ₦${Number(amount).toLocaleString()}
            </p>
          </td>
        </tr>
      </table>

      <!-- Sale breakdown -->
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
        style="background:${CREAM};border:1px solid #e8e0d4;margin-bottom:24px">
        <tr>
          <td style="padding:18px 22px">
            ${label("Sale Details")}
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
              ${infoTable([
    ["Book Title", bookTitle],
    ["Sale Amount", `₦${Number(amount).toLocaleString()}`],
    ["Platform Fee (20%)", `<span style="color:#ef4444">−₦${Math.round(amount * 0.2).toLocaleString()}</span>`],
    ["Your Earning (80%)", `<span style="color:#16a34a;font-weight:900">₦${Number(netEarning).toLocaleString()}</span>`],
    ["Buyer", buyerEmail || "—"],
  ])}
            </table>
          </td>
        </tr>
      </table>

      <!-- Balance -->
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
        style="background:#fffbeb;border:1px solid #fcd34d;margin-bottom:8px">
        <tr>
          <td style="padding:14px 18px">
            <p style="font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#92400e;margin:0 0 4px;font-family:'Lato',sans-serif">💰 Updated Account Balance</p>
            <p class="serif" style="font-size:22px;color:#92400e;margin:0">₦${Number(currentBalance || 0).toLocaleString()}</p>
            <p style="font-size:11px;color:#a16207;margin:4px 0 0;font-family:'Lato',sans-serif">Minimum withdrawal: ₦1,000</p>
          </td>
        </tr>
      </table>
    ${contentClose}
    ${btn("View Seller Dashboard", `${BASE_URL}/my-account/seller-account`, GOLD, WHITE)}
    <tr><td style="height:32px"></td></tr>`;

  return base({ preheader: `You earned ₦${Number(netEarning).toLocaleString()} from a sale of "${bookTitle}"`, body });
}

/* ─────────────────────────────────────────────────────────────────
   3. BOOK APPROVED
───────────────────────────────────────────────────────────────── */
function buildBookApproved({ name, bookTitle }) {
  const body = `
    ${goldBar()}
    ${contentOpen()}
      <table role="presentation" cellpadding="0" cellspacing="0" style="margin-bottom:18px">
        <tr>
          <td style="background:#dcfce7;border:1px solid #86efac;padding:4px 14px;border-radius:20px">
            <span style="font-size:11px;font-weight:700;color:#15803d;letter-spacing:0.06em;font-family:'Lato',sans-serif">● &nbsp; NOW LIVE</span>
          </td>
        </tr>
      </table>

      ${heading(`Your document is approved, <em>${name}</em>`)}

      <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
        style="background:${NAVY};margin:0 0 24px">
        <tr>
          <td style="padding:20px 24px">
            <p style="font-size:9px;letter-spacing:0.18em;text-transform:uppercase;color:rgba(255,255,255,0.35);margin:0 0 5px;font-family:'Lato',sans-serif">Document Title</p>
            <p class="serif" style="font-size:20px;color:${WHITE};margin:0;font-style:italic">"${bookTitle}"</p>
          </td>
        </tr>
      </table>

      ${para(`Your document has passed our quality review and is now visible to students across the LAN Library marketplace. Every purchase earns you <strong style="color:${NAVY}">80% of the sale price</strong>, paid directly to your LAN wallet.`)}
      ${para(`You can track views, purchases, and earnings from your seller dashboard at any time.`)}
    ${contentClose}
    ${btn("View Your Document", `${BASE_URL}/upload-document/my-pending-books`, GOLD, WHITE)}
    <tr><td style="height:32px"></td></tr>`;

  return base({ preheader: `"${bookTitle}" passed review and is now live on LAN Library!`, body });
}

/* ─────────────────────────────────────────────────────────────────
   4. LOW BALANCE ALERT
───────────────────────────────────────────────────────────────── */
function buildLowBalance({ name, balance }) {
  const body = `
    <tr><td style="height:4px;background:linear-gradient(to right,#d97706,#f59e0b,#d97706)"></td></tr>
    ${contentOpen()}
      ${label("⚠️  Balance Alert", "#d97706")}
      ${heading(`Your balance is running low, <em>${name}</em>`)}
      ${para(`Your LAN Library account balance has fallen below the ₦2,000 threshold. Some platform features — including document boosts and promotions — require a minimum balance to activate.`)}

      <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
        style="background:#fffbeb;border:1px solid #fcd34d;margin-bottom:24px">
        <tr>
          <td style="padding:20px 24px">
            <p style="font-size:10px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:#92400e;margin:0 0 5px;font-family:'Lato',sans-serif">Current Balance</p>
            <p class="serif amount-text" style="font-size:32px;color:#92400e;margin:0">₦${Number(balance).toLocaleString()}</p>
          </td>
        </tr>
      </table>

      ${para(`Your book sales will continue uninterrupted. Top up your balance to re-enable boost features whenever you're ready.`)}
    ${contentClose}
    ${btn("Top Up My Balance", `${BASE_URL}/my-account/seller-account`, "#d97706", WHITE)}
    <tr><td style="height:32px"></td></tr>`;

  return base({ preheader: `Your LAN Library balance is ₦${Number(balance).toLocaleString()} — below ₦2,000`, body });
}

/* ─────────────────────────────────────────────────────────────────
   5. PAYOUT SUCCESS
───────────────────────────────────────────────────────────────── */
function buildPayoutSuccess({ name, amount, bankName, accountName, accountNumber, withdrawalId }) {
  const now = new Date().toLocaleDateString("en-NG", { day: "numeric", month: "long", year: "numeric" });
  const body = `
    ${goldBar()}
    ${contentOpen()}
      ${label("✦  Payment Confirmation")}
      ${heading(`${name} Your payout has been processed`)}
      ${para(`The following withdrawal from your LAN Library earnings is on its way to your bank account.`)}

      <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
        style="background:${CREAM};border:1px solid #e8e0d4;margin-bottom:24px">
        <tr>
          <td style="padding:22px 26px">
            <p style="font-size:9px;font-weight:700;letter-spacing:0.16em;text-transform:uppercase;color:${GOLD};margin:0 0 14px;border-bottom:1px solid #e8e0d4;padding-bottom:12px;font-family:'Lato',sans-serif">Payout Summary</p>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
              ${infoTable([
    ["Amount Paid", `₦${amount}`],
    ["Bank", bankName || "—"],
    ["Account Name", accountName || "—"],
    ["Account Number", accountNumber || "—"],
    ["Reference", (withdrawalId || "N/A").toString().slice(0, 14).toUpperCase()],
    ["Date", now],
    ["Status", `<span style="color:#15803d;font-weight:900">✓ Completed</span>`],
  ])}
            </table>
          </td>
        </tr>
      </table>

      ${para(`Funds typically arrive within 1–3 business hours. If you have not received your transfer within 24 hours, please <a href="${BASE_URL}/support" style="color:${GOLD}">contact support</a>.`)}
    ${contentClose}
    ${btn("View Earnings Dashboard", `${BASE_URL}/my-account/seller-account`, GOLD, WHITE)}
    <tr><td style="height:32px"></td></tr>`;

  return base({ preheader: `Your payout of ₦${amount} has been processed successfully.`, body });
}

/* ─────────────────────────────────────────────────────────────────
   6. ORDER RECEIPT → Buyer
───────────────────────────────────────────────────────────────── */
function buildOrderReceipt({ name, bookTitle, amount, sellerName, orderId }) {
  const now = new Date().toLocaleDateString("en-NG", { day: "numeric", month: "long", year: "numeric" });
  const body = `
    ${goldBar()}
    ${contentOpen()}
      ${label("✦  Purchase Confirmation")}
      ${heading(`Thank you, <em>${name}</em>`)}
      ${para(`Your purchase is confirmed. You can access your document immediately from your LAN Library account.`)}

      <!-- Receipt card -->
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
        style="background:${NAVY};margin-bottom:24px">
        <tr>
          <td style="padding:28px 30px">
            <p style="font-size:9px;letter-spacing:0.18em;text-transform:uppercase;color:rgba(255,255,255,0.35);margin:0 0 5px;font-family:'Lato',sans-serif">Document Purchased</p>
            <p class="serif" style="font-size:19px;color:${WHITE};margin:0 0 20px;font-style:italic;border-bottom:1px solid rgba(255,255,255,0.1);padding-bottom:16px">"${bookTitle}"</p>

            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="font-size:10px;color:rgba(255,255,255,0.4);text-transform:uppercase;letter-spacing:0.1em;padding-bottom:5px;font-family:'Lato',sans-serif">Author / Publisher</td>
                <td align="right" style="font-size:12px;font-weight:700;color:${WHITE};padding-bottom:5px;font-family:'Lato',sans-serif">${sellerName || "LAN Library"}</td>
              </tr>
              <tr>
                <td style="font-size:10px;color:rgba(255,255,255,0.4);text-transform:uppercase;letter-spacing:0.1em;padding-bottom:5px;font-family:'Lato',sans-serif">Order Reference</td>
                <td align="right" style="font-size:12px;font-weight:700;color:${WHITE};padding-bottom:5px;font-family:'Lato',sans-serif">${(orderId || "N/A").toString().slice(0, 14).toUpperCase()}</td>
              </tr>
              <tr>
                <td style="font-size:10px;color:rgba(255,255,255,0.4);text-transform:uppercase;letter-spacing:0.1em;font-family:'Lato',sans-serif">Date</td>
                <td align="right" style="font-size:12px;font-weight:700;color:${WHITE};font-family:'Lato',sans-serif">${now}</td>
              </tr>
            </table>

            <div style="margin-top:20px;padding-top:16px;border-top:1px solid rgba(179,139,89,0.4)">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="font-size:10px;color:rgba(255,255,255,0.4);text-transform:uppercase;letter-spacing:0.1em;vertical-align:middle;font-family:'Lato',sans-serif">Amount Paid</td>
                  <td align="right">
                    <span class="serif amount-text" style="font-size:30px;color:${GOLD}">₦${amount}</span>
                  </td>
                </tr>
              </table>
            </div>
          </td>
        </tr>
      </table>

      ${para(`This is your official receipt. Keep this email for your records. For support, <a href="mailto:legal@lanlibrary.com" style="color:${GOLD}">contact legal@lanlibrary.com</a>.`)}
    ${contentClose}
    ${btn("Access My Document", `${BASE_URL}/my-books`, GOLD, WHITE)}
    <tr><td style="height:32px"></td></tr>`;

  return base({ preheader: `Receipt for "${bookTitle}" — ₦${amount} paid successfully.`, body });
}

/* ─────────────────────────────────────────────────────────────────
   7. ABANDONED CART
───────────────────────────────────────────────────────────────── */
function buildAbandonedCart({ name, cartItems = [] }) {
  const itemRows = cartItems.map(item => `
    <tr>
      <td style="padding:10px 0;border-bottom:1px solid ${LIGHT}">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="font-size:13px;font-weight:600;color:${NAVY};font-family:'Lato',sans-serif">${item.title}</td>
            <td align="right" style="font-size:13px;font-weight:700;color:${GOLD};white-space:nowrap;font-family:'Lato',sans-serif">₦${Number(item.price || 0).toLocaleString()}</td>
          </tr>
        </table>
      </td>
    </tr>`).join("");

  const body = `
    <tr><td style="height:4px;background:linear-gradient(to right,${NAVY},#1a3a5c,${NAVY})"></td></tr>
    ${contentOpen()}
      ${label("📚  Items Waiting for You")}
      ${heading(`You left some documents behind, <em>${name}</em>`)}
      ${para(`You have items in your LAN Library saved book. Complete your purchase and get instant access to your documents.`)}

      <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
        style="border:1px solid #e8e0d4;margin-bottom:24px">
        <tr>
          <td style="padding:16px 20px">
            ${label("Your Saved Book")}
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
              ${itemRows}
              ${cartItems.length >= 3 ? `<tr><td style="padding:10px 0"><p style="font-size:12px;color:#9ca3af;margin:0;font-style:italic;font-family:'Lato',sans-serif">+ more items in your saved book…</p></td></tr>` : ""}
            </table>
          </td>
        </tr>
      </table>
    ${contentClose}
    ${btn("Complete My Purchase", `${BASE_URL}/saved-my-book`, GOLD, WHITE)}
    <tr><td style="height:32px"></td></tr>`;

  return base({ preheader: `${name}, you left ${cartItems.length} item(s) in your LAN Library saved book.`, body });
}

/* ─────────────────────────────────────────────────────────────────
   8. AD BOOST CONFIRMATION → Seller
───────────────────────────────────────────────────────────────── */
function buildAdBoost({ name, tier, durationDays, amount }) {
  const body = `
    ${goldBar()}
    ${contentOpen()}
      ${label("✦  Ad Boost Activated")}
      ${heading(`Your promotion is live, <em>${name}</em>`)}
      ${para(`Your document boost has been activated. Your material will appear in premium positions across the LAN Library marketplace for the duration below.`)}

      <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
        style="background:${CREAM};border:1px solid #e8e0d4;margin-bottom:24px">
        <tr>
          <td style="padding:20px 24px">
            ${label("Boost Details")}
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
              ${infoTable([
    ["Tier", tier || "—"],
    ["Duration", `${durationDays} day${Number(durationDays) !== 1 ? "s" : ""}`],
    ["Amount", `₦${amount}`],
    ["Status", `<span style="color:#15803d;font-weight:900">✓ Active</span>`],
  ])}
            </table>
          </td>
        </tr>
      </table>

      ${para(`You can track impressions and clicks on your boost from the Seller Dashboard.`)}
    ${contentClose}
    ${btn("View Ad Performance", `${BASE_URL}/my-account/seller-account/promotion-analytics`, GOLD, WHITE)}
    <tr><td style="height:32px"></td></tr>`;

  return base({ preheader: `Your ${tier} ad boost (${durationDays} days) is now active on LAN Library.`, body });
}

/* ─────────────────────────────────────────────────────────────────
   EXPORTS
───────────────────────────────────────────────────────────────── */
export {
  buildSellerWelcome,
  buildSaleAlert,
  buildBookApproved,
  buildLowBalance,
  buildPayoutSuccess,
  buildOrderReceipt,
  buildAbandonedCart,
  buildAdBoost,
};
