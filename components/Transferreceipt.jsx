"use client";

import React, { useRef, useState, useEffect } from "react";
import {
  CheckCircle2,
  ArrowRight,
  Download,
  Copy,
  Share2,
  Check,
  X,
} from "lucide-react";

/* ─── Design tokens (mirrors seller page) ─────────────────────────────── */
const NAVY  = "#0d2244";
const GOLD  = "#b8963e";
const GOLDD = "#d4aa5a";
const CREAM = "#f5f0e8";

const formatAccountNumber = (acc) => {
  if (!acc) return "";
  const num = acc.replace("LAN", "");
  return `LAN-${num.slice(0, 3)}-${num.slice(3)}`;
};

/* ── Pure canvas receipt generator ───────────────────────────────────────
   Updated palette: NAVY header, GOLD accents, CREAM bands               */
const drawReceipt = (canvas, {
  senderName, senderAccount, recipientName, recipientAccount,
  amount, note, txnRef, dateStr, timeStr, newBalance,
}) => {
  const W = 800;
  const ctx = canvas.getContext("2d");

  const roundRect = (x, y, w, h, r) => {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  };

  let H = 820;
  if (note) H += 40;
  canvas.width  = W;
  canvas.height = H;

  /* background */
  ctx.fillStyle = "#f5f0e8"; /* CREAM bg */
  ctx.fillRect(0, 0, W, H);

  let y = 0;

  /* ── HEADER ── */
  const headerH = 130;
  ctx.fillStyle = NAVY;
  ctx.fillRect(0, y, W, headerH);

  /* dot-grid overlay */
  ctx.fillStyle = "rgba(184,150,62,0.06)";
  for (let gx = 24; gx < W; gx += 24)
    for (let gy = y; gy < y + headerH; gy += 24) {
      ctx.beginPath(); ctx.arc(gx, gy, 1, 0, Math.PI * 2); ctx.fill();
    }

  ctx.textAlign  = "center";
  ctx.fillStyle  = GOLD;
  ctx.font       = "bold 11px 'Lato', sans-serif";
  ctx.fillText("LAN LIBRARY", W / 2, y + 42);

  ctx.fillStyle  = "#ffffff";
  ctx.font       = "bold 28px 'Playfair Display', Georgia, serif";
  ctx.fillText("Transfer Receipt", W / 2, y + 82);

  ctx.fillStyle  = "rgba(184,150,62,0.75)";
  ctx.font       = "14px 'Lato', sans-serif";
  ctx.fillText(`${dateStr}  ·  ${timeStr}`, W / 2, y + 112);
  y += headerH;

  /* ── AMOUNT BAND ── */
  const amtH = 130;
  ctx.fillStyle  = "#fff";
  ctx.fillRect(0, y, W, amtH);

  ctx.strokeStyle = "#e5ddd0";
  ctx.lineWidth   = 0.5;
  ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(0, y + amtH); ctx.lineTo(W, y + amtH); ctx.stroke();

  ctx.textAlign  = "center";
  ctx.fillStyle  = GOLD;
  ctx.font       = "bold 10px 'Lato', sans-serif";
  ctx.fillText("AMOUNT TRANSFERRED", W / 2, y + 36);

  ctx.fillStyle  = NAVY;
  ctx.font       = `bold 54px 'Playfair Display', Georgia, serif`;
  ctx.fillText(`₦${(Number(amount) + 50).toLocaleString()}`, W / 2, y + 92);

  const badge = "  ✓  Completed  ";
  ctx.font       = "bold 12px 'Lato', sans-serif";
  const bw = ctx.measureText(badge).width + 28;
  const bx = W / 2 - bw / 2;
  ctx.fillStyle  = CREAM;
  roundRect(bx, y + 101, bw, 22, 11); ctx.fill();
  ctx.strokeStyle = "rgba(184,150,62,0.4)";
  ctx.lineWidth = 0.5;
  roundRect(bx, y + 101, bw, 22, 11); ctx.stroke();
  ctx.fillStyle  = NAVY;
  ctx.fillText(badge, W / 2, y + 116);
  y += amtH;

  /* ── FROM → TO ── */
  const pad  = 40;
  const boxW = (W - pad * 2 - 60) / 2;
  const boxY = y + 32;
  const boxH = 90;

  ctx.fillStyle   = CREAM;
  roundRect(pad, boxY, boxW, boxH, 0); ctx.fill();
  ctx.strokeStyle = "#e5ddd0"; ctx.lineWidth = 0.5;
  roundRect(pad, boxY, boxW, boxH, 0); ctx.stroke();

  ctx.textAlign = "center";
  ctx.fillStyle = "#aaa"; ctx.font = "12px 'Lato', sans-serif";
  ctx.fillText("From", pad + boxW / 2, boxY + 22);
  ctx.fillStyle = NAVY; ctx.font = "bold 14px 'Lato', sans-serif";
  ctx.fillText(senderName.length > 18 ? senderName.slice(0, 17) + "…" : senderName, pad + boxW / 2, boxY + 48);
  ctx.fillStyle = GOLD; ctx.font = "12px 'Courier New', monospace";
  ctx.fillText(formatAccountNumber(senderAccount), pad + boxW / 2, boxY + 70);

  /* arrow circle */
  const ax = W / 2, ay = boxY + boxH / 2;
  ctx.fillStyle = NAVY;
  ctx.beginPath(); ctx.arc(ax, ay, 18, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = GOLD; ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(ax - 7, ay); ctx.lineTo(ax + 7, ay);
  ctx.moveTo(ax + 2, ay - 5); ctx.lineTo(ax + 7, ay); ctx.lineTo(ax + 2, ay + 5);
  ctx.stroke();

  const toX = W - pad - boxW;
  ctx.fillStyle   = CREAM;
  roundRect(toX, boxY, boxW, boxH, 0); ctx.fill();
  ctx.strokeStyle = "#e5ddd0"; ctx.lineWidth = 0.5;
  roundRect(toX, boxY, boxW, boxH, 0); ctx.stroke();

  ctx.fillStyle = "#aaa"; ctx.font = "12px 'Lato', sans-serif";
  ctx.fillText("To", toX + boxW / 2, boxY + 22);
  ctx.fillStyle = NAVY; ctx.font = "bold 14px 'Lato', sans-serif";
  ctx.fillText(recipientName.length > 18 ? recipientName.slice(0, 17) + "…" : recipientName, toX + boxW / 2, boxY + 48);
  ctx.fillStyle = GOLD; ctx.font = "12px 'Courier New', monospace";
  ctx.fillText(formatAccountNumber(recipientAccount), toX + boxW / 2, boxY + 70);

  y += 32 + boxH + 28;

  /* ── DASHED DIVIDER ── */
  ctx.strokeStyle = "#e5ddd0"; ctx.lineWidth = 0.5;
  ctx.setLineDash([6, 6]);
  ctx.beginPath(); ctx.moveTo(pad, y); ctx.lineTo(W - pad, y); ctx.stroke();
  ctx.setLineDash([]);
  y += 28;

  /* ── DETAIL ROWS ── */
  const rowH = 38;
  const rows = [
    ["Transfer Fee", "₦50"],
    ["Reference", txnRef],
    ["Date", dateStr],
    ["Time", timeStr],
    ...(note ? [["Note", note]] : []),
    ...(newBalance > 0 ? [["New Balance", `₦${Number(newBalance).toLocaleString()}`]] : []),
  ];

  rows.forEach(([label, value], i) => {
    const ry = y + i * rowH;
    if (i % 2 === 0) {
      ctx.fillStyle = "#fff";
      ctx.fillRect(pad, ry - 6, W - pad * 2, rowH - 2);
    }
    ctx.textAlign  = "left";
    ctx.fillStyle  = "#aaa";
    ctx.font       = "13px 'Lato', sans-serif";
    ctx.fillText(label, pad + 8, ry + 18);

    ctx.textAlign  = "right";
    ctx.fillStyle  = label === "New Balance"  ? NAVY :
                     label === "Transfer Fee" ? GOLD : NAVY;
    ctx.font       = label === "Reference"
      ? "bold 12px 'Courier New', monospace"
      : label === "New Balance"
        ? "bold 15px 'Playfair Display', Georgia, serif"
        : "bold 13px 'Lato', sans-serif";
    ctx.fillText(value, W - pad - 8, ry + 18);
  });

  y += rows.length * rowH + 24;

  /* ── FOOTER ── */
  const footerH = H - y;
  ctx.fillStyle = NAVY;
  ctx.fillRect(0, y, W, footerH);

  ctx.textAlign = "center";
  ctx.fillStyle = "rgba(184,150,62,0.7)";
  ctx.font      = "11px 'Lato', sans-serif";
  ctx.fillText("Powered by  LAN Bank  ·  lan.com", W / 2, y + 34);

  ctx.fillStyle = "rgba(255,255,255,0.3)";
  ctx.font      = "11px 'Lato', sans-serif";
  ctx.fillText("This is an official transfer receipt", W / 2, y + 56);
};

/* ── Generate blob ────────────────────────────────────────────────────── */
const generateReceiptBlob = (params) =>
  new Promise((resolve) => {
    const canvas = document.createElement("canvas");
    drawReceipt(canvas, params);
    canvas.toBlob(resolve, "image/png");
  });

/* ── Action buttons ───────────────────────────────────────────────────── */
function ReceiptActions({ receiptParams, amount, recipientName, txnRef, dateStr, timeStr }) {
  const [downloading, setDownloading] = useState(false);
  const [copying,    setCopying]      = useState(false);
  const [sharing,    setSharing]      = useState(false);
  const [copied,     setCopied]       = useState(false);

  const handleDownload = async () => {
    if (downloading) return;
    setDownloading(true);
    try {
      const blob = await generateReceiptBlob(receiptParams);
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href = url; a.download = `LAN-Transfer-${txnRef}.png`; a.click();
      URL.revokeObjectURL(url);
    } catch (e) { alert("Download failed. Please try again."); }
    finally     { setDownloading(false); }
  };

  const handleCopyImage = async () => {
    if (copying) return;
    setCopying(true);
    try {
      const blob = await generateReceiptBlob(receiptParams);
      await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
      setCopied(true); setTimeout(() => setCopied(false), 2500);
    } catch { handleDownload(); }
    finally { setCopying(false); }
  };

  const handleShare = async () => {
    if (sharing) return;
    setSharing(true);
    try {
      const blob = await generateReceiptBlob(receiptParams);
      const file = new File([blob], `LAN-Transfer-${txnRef}.png`, { type: "image/png" });
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ title: "LAN Transfer Receipt", files: [file] });
      } else if (navigator.share) {
        await navigator.share({ title: "LAN Transfer Receipt", text: `₦${Number(amount).toLocaleString()} sent to ${recipientName}` });
      } else { handleDownload(); }
    } catch (e) { if (e.name !== "AbortError") handleDownload(); }
    finally { setSharing(false); }
  };

  const btnBase = {
    display: "flex", flexDirection: "column", alignItems: "center", gap: "6px",
    padding: "12px 8px", border: "0.5px solid #e5ddd0", cursor: "pointer",
    fontFamily: "'Lato', sans-serif", fontSize: "11px", fontWeight: 700,
    letterSpacing: "0.05em", textTransform: "uppercase", transition: "all 0.18s",
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px", marginTop: "4px" }}>
      {/* Download */}
      <button
        onClick={handleDownload} disabled={downloading}
        style={{ ...btnBase, background: NAVY, color: "#fff", border: `0.5px solid ${NAVY}` }}
        onMouseEnter={e => e.currentTarget.style.background = "#1a3a6e"}
        onMouseLeave={e => e.currentTarget.style.background = NAVY}
      >
        {downloading
          ? <div style={{ width: 16, height: 16, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "lanSpin 0.8s linear infinite" }} />
          : <Download size={16} />}
        <span>{downloading ? "Saving…" : "Download"}</span>
      </button>

      {/* Copy */}
      <button
        onClick={handleCopyImage} disabled={copying}
        style={{ ...btnBase, background: CREAM, color: NAVY }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = GOLD; }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = "#e5ddd0"; }}
      >
        {copying
          ? <div style={{ width: 16, height: 16, border: `2px solid rgba(13,34,68,0.2)`, borderTopColor: NAVY, borderRadius: "50%", animation: "lanSpin 0.8s linear infinite" }} />
          : copied
            ? <Check size={16} style={{ color: "#16a34a" }} />
            : <Copy size={16} />}
        <span style={{ color: copied ? "#16a34a" : NAVY }}>{copying ? "Copying…" : copied ? "Copied!" : "Copy"}</span>
      </button>

      {/* Share */}
      <button
        onClick={handleShare} disabled={sharing}
        style={{ ...btnBase, background: CREAM, color: NAVY }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = GOLD; }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = "#e5ddd0"; }}
      >
        {sharing
          ? <div style={{ width: 16, height: 16, border: `2px solid rgba(13,34,68,0.2)`, borderTopColor: NAVY, borderRadius: "50%", animation: "lanSpin 0.8s linear infinite" }} />
          : <Share2 size={16} />}
        <span>{sharing ? "Sharing…" : "Share"}</span>
      </button>
    </div>
  );
}

/* ── Receipt UI ───────────────────────────────────────────────────────── */
function ReceiptUI({
  senderName, senderAccount, recipientName, recipientAccount,
  amount, note, txnRef, dateStr, timeStr, newBalance,
}) {
  const row = (label, value, accent) => (
    <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "9px 0", borderBottom: "0.5px solid #f0ebe0", fontSize: "12px" }}>
      <span style={{ color: "#aaa", fontFamily: "'Lato', sans-serif" }}>{label}</span>
      <span style={{ fontWeight: 700, color: accent || NAVY, fontFamily: accent ? "'Lato', sans-serif" : "'Lato', sans-serif", textAlign: "right", maxWidth: "60%" }}>{value}</span>
    </div>
  );

  return (
    <div style={{ background: "#fff", border: "0.5px solid #e5ddd0", marginBottom: "16px" }}>

      {/* Header — NAVY with dot-grid pattern */}
      <div style={{
        background: NAVY,
        backgroundImage: "radial-gradient(rgba(184,150,62,0.07) 1px, transparent 1px)",
        backgroundSize: "24px 24px",
        padding: "24px", textAlign: "center", position: "relative", overflow: "hidden",
      }}>
        <div style={{ position: "absolute", top: -20, right: -20, width: 90, height: 90, border: "0.5px solid rgba(184,150,62,0.15)", transform: "rotate(45deg)" }} />
        <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: GOLD, marginBottom: 4, fontFamily: "'Lato', sans-serif" }}>LAN Library</p>
        <p style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 22, fontWeight: 700, color: "#fff", margin: "0 0 4px" }}>Transfer Receipt</p>
        <p style={{ fontSize: 11, color: "rgba(184,150,62,0.75)", fontFamily: "'Lato', sans-serif", margin: 0 }}>{dateStr} · {timeStr}</p>
      </div>

      {/* Amount band */}
      <div style={{ background: CREAM, borderBottom: "0.5px solid #e5ddd0", padding: "20px", textAlign: "center" }}>
        <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: GOLD, marginBottom: 4, fontFamily: "'Lato', sans-serif" }}>Amount Transferred</p>
        <p style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 38, fontWeight: 700, color: NAVY, margin: "0 0 8px" }}>
          ₦{(Number(amount) + 50).toLocaleString()}
        </p>
        <span style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          background: "#fff", border: "0.5px solid rgba(184,150,62,0.3)",
          padding: "4px 14px", fontSize: 11, fontWeight: 700,
          color: NAVY, fontFamily: "'Lato', sans-serif",
        }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#16a34a", animation: "lanPulse 2s infinite" }} />
          Completed
        </span>
      </div>

      {/* From → To */}
      <div style={{ padding: "20px", borderBottom: "0.5px solid #f0ebe0" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {/* From box */}
          <div style={{ flex: 1, background: CREAM, border: "0.5px solid #e5ddd0", padding: "12px", textAlign: "center" }}>
            <p style={{ fontSize: 10, color: "#aaa", margin: "0 0 4px", fontFamily: "'Lato', sans-serif", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em" }}>From</p>
            <p style={{ fontSize: 13, fontWeight: 700, color: NAVY, margin: "0 0 3px", fontFamily: "'Lato', sans-serif" }}>{senderName}</p>
            <p style={{ fontSize: 11, color: GOLD, margin: 0, fontFamily: "monospace" }}>{formatAccountNumber(senderAccount)}</p>
          </div>

          {/* Arrow */}
          <div style={{ flexShrink: 0, width: 34, height: 34, background: NAVY, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <ArrowRight size={14} color={GOLD} />
          </div>

          {/* To box */}
          <div style={{ flex: 1, background: CREAM, border: "0.5px solid #e5ddd0", padding: "12px", textAlign: "center" }}>
            <p style={{ fontSize: 10, color: "#aaa", margin: "0 0 4px", fontFamily: "'Lato', sans-serif", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em" }}>To</p>
            <p style={{ fontSize: 13, fontWeight: 700, color: NAVY, margin: "0 0 3px", fontFamily: "'Lato', sans-serif" }}>{recipientName}</p>
            <p style={{ fontSize: 11, color: GOLD, margin: 0, fontFamily: "monospace" }}>{formatAccountNumber(recipientAccount)}</p>
          </div>
        </div>
      </div>

      {/* Detail rows */}
      <div style={{ padding: "4px 20px 8px" }}>
        {row("Transfer Fee", "+ ₦50", GOLD)}
        {row("Reference", txnRef)}
        {row("Date", dateStr)}
        {row("Time", timeStr)}
        {note && row("Note", note)}
        {newBalance > 0 && (
          <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0 4px", borderTop: "0.5px solid #e5ddd0", marginTop: 4, fontSize: 13 }}>
            <span style={{ color: "#aaa", fontFamily: "'Lato', sans-serif" }}>New Balance</span>
            <span style={{ fontFamily: "'Playfair Display', Georgia, serif", fontWeight: 700, color: NAVY, fontSize: 15 }}>₦{Number(newBalance).toLocaleString()}</span>
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{ background: NAVY, padding: "14px 20px", textAlign: "center" }}>
        <p style={{ fontSize: 11, color: "rgba(184,150,62,0.8)", fontFamily: "'Lato', sans-serif", margin: "0 0 2px" }}>
          Powered by <strong style={{ color: GOLD }}>LAN Bank</strong> · lan.com
        </p>
        <p style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", fontFamily: "'Lato', sans-serif", margin: 0 }}>This is an official transfer receipt</p>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   DEFAULT EXPORT — Success screen after transfer
════════════════════════════════════════════════════════════════ */
export default function TransferReceipt({ seller, recipientInfo, amount, note, onReset }) {
  const previewRef = useRef(null);

  const recipientName =
    recipientInfo?.businessInfo?.businessName ||
    recipientInfo?.bankDetails?.accountName   ||
    recipientInfo?.sellerName || "Unknown";

  const senderName =
    seller?.businessInfo?.businessName ||
    seller?.bankDetails?.accountName   ||
    seller?.sellerName || "Unknown";

  const now     = new Date();
  const dateStr = now.toLocaleDateString("en-NG", { day: "2-digit", month: "short", year: "numeric" });
  const timeStr = now.toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit" });
  const txnRef  = useRef(`TXN-${Date.now().toString(36).toUpperCase()}`).current;

  const receiptParams = {
    senderName,
    senderAccount:    seller?.accountNumber      || "",
    recipientName,
    recipientAccount: recipientInfo?.accountNumber || "",
    amount, note: note || "", txnRef, dateStr, timeStr,
    newBalance: seller?.accountBalance || 0,
  };

  useEffect(() => {
    if (previewRef.current) drawReceipt(previewRef.current, receiptParams);
  }, []); // eslint-disable-line

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700;900&family=Lato:wght@300;400;700&display=swap');
        @keyframes lanSpin  { to { transform: rotate(360deg) } }
        @keyframes lanPulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes lanSlideUp { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
        .lan-receipt-root { font-family:'Lato',sans-serif; }
        .lan-receipt-root * { box-sizing: border-box; }
        .lan-reset-btn:hover { background: #e5ddd0 !important; }
      `}</style>

      <div className="lan-receipt-root" style={{ padding: "24px", background: "#f5f1ea", minHeight: "100%", animation: "lanSlideUp 0.45s cubic-bezier(0.4,0,0.2,1) both" }}>
        <canvas ref={previewRef} style={{ display: "none" }} />

        {/* Success header */}
        <div style={{ textAlign: "center", marginBottom: "24px" }}>
          {/* Animated check ring */}
          <div style={{ position: "relative", display: "inline-block", marginBottom: 12 }}>
            <div style={{ width: 64, height: 64, background: NAVY, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto" }}>
              <svg width={30} height={30} fill="none" stroke={GOLD} strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div style={{ position: "absolute", inset: -4, border: `0.5px solid rgba(184,150,62,0.3)` }} />
          </div>

          <p style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 22, fontWeight: 700, color: NAVY, margin: "0 0 4px" }}>
            Transfer Successful!
          </p>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: CREAM, border: "0.5px solid rgba(184,150,62,0.2)", padding: "4px 14px" }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#16a34a", animation: "lanPulse 2s infinite" }} />
            <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: GOLD, fontFamily: "'Lato', sans-serif" }}>
              Verified · Instant
            </span>
          </div>
        </div>

        {/* Receipt card */}
        <ReceiptUI
          senderName={senderName}
          senderAccount={seller?.accountNumber || ""}
          recipientName={recipientName}
          recipientAccount={recipientInfo?.accountNumber || ""}
          amount={amount}
          note={note}
          txnRef={txnRef}
          dateStr={dateStr}
          timeStr={timeStr}
          newBalance={seller?.accountBalance || 0}
        />

        {/* Action buttons */}
        <ReceiptActions
          receiptParams={receiptParams}
          amount={amount}
          recipientName={recipientName}
          txnRef={txnRef}
          dateStr={dateStr}
          timeStr={timeStr}
        />

        {/* Reset */}
        <button
          onClick={onReset}
          className="lan-reset-btn"
          style={{
            width: "100%", marginTop: 12, padding: "13px",
            background: CREAM, color: NAVY, border: "0.5px solid #e5ddd0",
            fontSize: 12, fontWeight: 700, cursor: "pointer",
            fontFamily: "'Lato', sans-serif", letterSpacing: "0.06em",
            textTransform: "uppercase", transition: "background 0.18s",
          }}
        >
          Make Another Transfer
        </button>
      </div>
    </>
  );
}

/* ════════════════════════════════════════════════════════════════
   NAMED EXPORT — Modal for viewing past transfer from history
════════════════════════════════════════════════════════════════ */
export function TransferReceiptModal({ transfer, onClose }) {
  if (!transfer) return null;

  const ts      = transfer.createdAt?.toDate?.() || new Date();
  const dateStr = ts.toLocaleDateString("en-NG", { day: "2-digit", month: "short", year: "numeric" });
  const timeStr = ts.toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit" });
  const txnRef  = transfer.txnRef || `TXN-${transfer.id?.slice(0, 8).toUpperCase() || "XXXXXXXX"}`;

  const receiptParams = {
    senderName:       transfer.senderName          || "Unknown",
    senderAccount:    transfer.senderAccountNumber  || "",
    recipientName:    transfer.recipientName        || "Unknown",
    recipientAccount: transfer.recipientAccountNumber || "",
    amount:           transfer.amount || 0,
    note:             transfer.note   || "",
    txnRef, dateStr, timeStr, newBalance: 0,
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700;900&family=Lato:wght@300;400;700&display=swap');
        @keyframes lanSpin  { to { transform: rotate(360deg) } }
        @keyframes lanPulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes lanSlideUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        .lan-modal-sheet { font-family:'Lato',sans-serif; }
        .lan-modal-sheet * { box-sizing:border-box; }
        .lan-close-btn:hover { background: rgba(255,255,255,0.1) !important; }
        .lan-done-btn:hover  { background: #1a3a6e !important; }
      `}</style>

      {/* Backdrop */}
      <div
        style={{ position: "fixed", inset: 0, zIndex: 50, background: "rgba(13,34,68,0.6)", backdropFilter: "blur(4px)", display: "flex", alignItems: "flex-end", justifyContent: "center" }}
        onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      >
        {/* Sheet */}
        <div
          className="lan-modal-sheet"
          style={{
            background: "#f5f1ea", width: "100%", maxWidth: 520,
            maxHeight: "92vh", overflowY: "auto", borderRadius: "0",
            boxShadow: "0 -16px 64px rgba(13,34,68,0.25)",
            animation: "lanSlideUp 0.35s cubic-bezier(0.4,0,0.2,1) both",
          }}
        >
          {/* Modal header bar */}
          <div style={{ background: NAVY, padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 10 }}>
            <div>
              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: GOLD, margin: "0 0 2px", fontFamily: "'Lato', sans-serif" }}>History</p>
              <p style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 17, fontWeight: 700, color: "#fff", margin: 0 }}>Transfer Receipt</p>
            </div>
            <button
              onClick={onClose}
              className="lan-close-btn"
              style={{ width: 34, height: 34, border: "0.5px solid rgba(255,255,255,0.2)", background: "transparent", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "rgba(255,255,255,0.65)", transition: "background 0.15s" }}
            >
              <X size={15} />
            </button>
          </div>

          <div style={{ padding: "16px" }}>
            <ReceiptUI
              senderName={transfer.senderName          || "Unknown"}
              senderAccount={transfer.senderAccountNumber  || ""}
              recipientName={transfer.recipientName        || "Unknown"}
              recipientAccount={transfer.recipientAccountNumber || ""}
              amount={transfer.amount || 0}
              note={transfer.note    || ""}
              txnRef={txnRef}
              dateStr={dateStr}
              timeStr={timeStr}
              newBalance={0}
            />

            <ReceiptActions
              receiptParams={receiptParams}
              amount={transfer.amount || 0}
              recipientName={transfer.recipientName || "Unknown"}
              txnRef={txnRef}
              dateStr={dateStr}
              timeStr={timeStr}
            />

            <button
              onClick={onClose}
              className="lan-done-btn"
              style={{
                width: "100%", marginTop: 12, padding: "13px",
                background: NAVY, color: "#fff", border: "none",
                fontSize: 12, fontWeight: 700, cursor: "pointer",
                fontFamily: "'Lato', sans-serif", letterSpacing: "0.06em",
                textTransform: "uppercase", transition: "background 0.18s",
              }}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </>
  );
}