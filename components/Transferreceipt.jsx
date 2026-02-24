"use client";

import React, { useRef, useState, useEffect } from "react";
import {
  CheckCircle2,
  ArrowRight,
  Download,
  Copy,
  Share2,
  Check,
} from "lucide-react";

const formatAccountNumber = (acc) => {
  if (!acc) return "";
  const num = acc.replace("LAN", "");
  return `LAN-${num.slice(0, 3)}-${num.slice(3)}`;
};

// ── Pure canvas receipt generator ─────────────────────────────────────────
const drawReceipt = (
  canvas,
  {
    senderName,
    senderAccount,
    recipientName,
    recipientAccount,
    amount,
    note,
    txnRef,
    dateStr,
    timeStr,
    newBalance,
  },
) => {
  const W = 800;
  const ctx = canvas.getContext("2d");

  // ── Helpers ──────────────────────────────────────────────────────────
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

  const wrapText = (text, x, y, maxW, lineH) => {
    const words = text.split(" ");
    let line = "";
    let yy = y;
    for (let i = 0; i < words.length; i++) {
      const test = line + words[i] + " ";
      if (ctx.measureText(test).width > maxW && i > 0) {
        ctx.fillText(line.trim(), x, yy);
        line = words[i] + " ";
        yy += lineH;
      } else {
        line = test;
      }
    }
    ctx.fillText(line.trim(), x, yy);
    return yy;
  };

  // ── Calculate dynamic height ──────────────────────────────────────────
  let H = 820;
  if (note) H += 40;
  canvas.width = W;
  canvas.height = H;

  // White background
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, W, H);

  let y = 0;

  // ── HEADER ────────────────────────────────────────────────────────────
  const headerH = 130;
  ctx.fillStyle = "#0c1a3a"; // blue-950
  ctx.fillRect(0, y, W, headerH);

  // Decorative circles
  ctx.fillStyle = "rgba(255,255,255,0.04)";
  ctx.beginPath();
  ctx.arc(-30, -30, 90, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(W + 40, headerH + 30, 110, 0, Math.PI * 2);
  ctx.fill();

  ctx.textAlign = "center";
  ctx.fillStyle = "#93c5fd";
  ctx.font = "bold 18px Georgia, serif";
  ctx.fillText("LAN LIBRARY", W / 2, y + 44);

  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 30px Georgia, serif";
  ctx.fillText("Transfer Receipt", W / 2, y + 82);

  ctx.fillStyle = "#93c5fd";
  ctx.font = "16px Georgia, serif";
  ctx.fillText(`${dateStr}  ·  ${timeStr}`, W / 2, y + 112);

  y += headerH;

  // ── AMOUNT BAND ───────────────────────────────────────────────────────
  const amtH = 130;
  ctx.fillStyle = "#f0fdf4"; // green-50
  ctx.fillRect(0, y, W, amtH);

  // bottom border
  ctx.strokeStyle = "#bbf7d0";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, y + amtH);
  ctx.lineTo(W, y + amtH);
  ctx.stroke();

  ctx.textAlign = "center";
  ctx.fillStyle = "#16a34a";
  ctx.font = "bold 14px Georgia, serif";
  ctx.fillText("AMOUNT TRANSFERRED", W / 2, y + 38);

  ctx.font = "bold 56px Georgia, serif";
  ctx.fillText(`₦${(Number(amount) + 50).toLocaleString()}`, W / 2, y + 92);
  // Completed badge
  const badge = "  ✓  Completed  ";
  ctx.font = "bold 13px Georgia, serif";
  const bw = ctx.measureText(badge).width + 24;
  const bx = W / 2 - bw / 2;
  ctx.fillStyle = "#dcfce7";
  roundRect(bx, y + 103, bw, 22, 11);
  ctx.fill();
  ctx.fillStyle = "#15803d";
  ctx.fillText(badge, W / 2, y + 118);

  y += amtH;

  // ── FROM → TO ─────────────────────────────────────────────────────────
  const pad = 40;
  const boxW = (W - pad * 2 - 60) / 2;
  const boxY = y + 32;
  const boxH = 90;

  // From box
  ctx.fillStyle = "#f9fafb";
  roundRect(pad, boxY, boxW, boxH, 12);
  ctx.fill();
  ctx.strokeStyle = "#e5e7eb";
  ctx.lineWidth = 1;
  roundRect(pad, boxY, boxW, boxH, 12);
  ctx.stroke();

  ctx.textAlign = "center";
  ctx.fillStyle = "#9ca3af";
  ctx.font = "13px Georgia, serif";
  ctx.fillText("From", pad + boxW / 2, boxY + 24);
  ctx.fillStyle = "#111827";
  ctx.font = "bold 15px Georgia, serif";
  ctx.fillText(
    senderName.length > 18 ? senderName.slice(0, 17) + "…" : senderName,
    pad + boxW / 2,
    boxY + 50,
  );
  ctx.fillStyle = "#1e3a8a";
  ctx.font = "13px 'Courier New', monospace";
  ctx.fillText(formatAccountNumber(senderAccount), pad + boxW / 2, boxY + 74);

  // Arrow circle
  const ax = W / 2;
  const ay = boxY + boxH / 2;
  ctx.fillStyle = "#0c1a3a";
  ctx.beginPath();
  ctx.arc(ax, ay, 18, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(ax - 7, ay);
  ctx.lineTo(ax + 7, ay);
  ctx.moveTo(ax + 2, ay - 5);
  ctx.lineTo(ax + 7, ay);
  ctx.lineTo(ax + 2, ay + 5);
  ctx.stroke();

  // To box
  const toX = W - pad - boxW;
  ctx.fillStyle = "#f9fafb";
  roundRect(toX, boxY, boxW, boxH, 12);
  ctx.fill();
  ctx.strokeStyle = "#e5e7eb";
  roundRect(toX, boxY, boxW, boxH, 12);
  ctx.stroke();

  ctx.fillStyle = "#9ca3af";
  ctx.font = "13px Georgia, serif";
  ctx.fillText("To", toX + boxW / 2, boxY + 24);
  ctx.fillStyle = "#111827";
  ctx.font = "bold 15px Georgia, serif";
  ctx.fillText(
    recipientName.length > 18
      ? recipientName.slice(0, 17) + "…"
      : recipientName,
    toX + boxW / 2,
    boxY + 50,
  );
  ctx.fillStyle = "#1e3a8a";
  ctx.font = "13px 'Courier New', monospace";
  ctx.fillText(
    formatAccountNumber(recipientAccount),
    toX + boxW / 2,
    boxY + 74,
  );

  y += 32 + boxH + 28;

  // ── DASHED DIVIDER ────────────────────────────────────────────────────
  ctx.strokeStyle = "#e5e7eb";
  ctx.lineWidth = 1;
  ctx.setLineDash([6, 6]);
  ctx.beginPath();
  ctx.moveTo(pad, y);
  ctx.lineTo(W - pad, y);
  ctx.stroke();
  ctx.setLineDash([]);
  y += 28;

  // ── DETAIL ROWS ───────────────────────────────────────────────────────
  const rowH = 38;
  const rows = [
    ["Reference", txnRef],
    ["Date", dateStr],
    ["Time", timeStr],
    ...(note ? [["Note", note]] : []),
    ["New Balance", `₦${Number(newBalance).toLocaleString()}`],
  ];

  rows.forEach(([label, value], i) => {
    const ry = y + i * rowH;

    // Alternate row tint
    if (i % 2 === 0) {
      ctx.fillStyle = "#fafafa";
      ctx.fillRect(pad, ry - 6, W - pad * 2, rowH - 2);
    }

    ctx.textAlign = "left";
    ctx.fillStyle = "#9ca3af";
    ctx.font = "14px Georgia, serif";
    ctx.fillText(label, pad + 8, ry + 18);

    ctx.textAlign = "right";
    ctx.fillStyle = label === "New Balance" ? "#0c1a3a" : "#1f2937";
    ctx.font =
      label === "Reference"
        ? "bold 13px 'Courier New', monospace"
        : label === "New Balance"
          ? "bold 16px Georgia, serif"
          : "bold 14px Georgia, serif";
    ctx.fillText(value, W - pad - 8, ry + 18);
  });

  y += rows.length * rowH + 24;

  // ── FOOTER ────────────────────────────────────────────────────────────
  const footerH = H - y;
  ctx.fillStyle = "#f9fafb";
  ctx.fillRect(0, y, W, footerH);
  ctx.strokeStyle = "#f3f4f6";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, y);
  ctx.lineTo(W, y);
  ctx.stroke();

  // Draw footer text left-to-right with measured widths for correct spacing
  ctx.textAlign = "left";
  const footerY = y + 34;
  const part1 = "Powered by ";
  const part2 = "LAN Bank";
  const part3 = " · lan.com";

  ctx.font = "14px Georgia, serif";
  const w1 = ctx.measureText(part1).width;
  ctx.font = "bold 14px Georgia, serif";
  const w2 = ctx.measureText(part2).width;
  ctx.font = "14px Georgia, serif";
  const w3 = ctx.measureText(part3).width;

  const totalW = w1 + w2 + w3;
  let fx = W / 2 - totalW / 2;

  ctx.fillStyle = "#6b7280";
  ctx.font = "14px Georgia, serif";
  ctx.fillText(part1, fx, footerY);
  fx += w1;

  ctx.fillStyle = "#0c1a3a";
  ctx.font = "bold 14px Georgia, serif";
  ctx.fillText(part2, fx, footerY);
  fx += w2;

  ctx.fillStyle = "#6b7280";
  ctx.font = "14px Georgia, serif";
  ctx.fillText(part3, fx, footerY);

  ctx.textAlign = "center";
  ctx.fillStyle = "#d1d5db";
  ctx.font = "12px Georgia, serif";
  ctx.fillText("This is an official transfer receipt", W / 2, y + 58);
};

// ── Generate blob from canvas ──────────────────────────────────────────────
const generateReceiptBlob = (params) => {
  return new Promise((resolve) => {
    const canvas = document.createElement("canvas");
    drawReceipt(canvas, params);
    canvas.toBlob(resolve, "image/png");
  });
};

export default function TransferReceipt({
  seller,
  recipientInfo,
  amount,
  note,
  onReset,
}) {
  const previewRef = useRef(null);
  const [downloading, setDownloading] = useState(false);
  const [copying, setCopying] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [copied, setCopied] = useState(false);

  const recipientName =
    recipientInfo?.businessInfo?.businessName ||
    recipientInfo?.bankDetails?.accountName ||
    recipientInfo?.sellerName ||
    "Unknown";

  const senderName =
    seller?.businessInfo?.businessName ||
    seller?.bankDetails?.accountName ||
    seller?.sellerName ||
    "Unknown";

  const now = new Date();
  const dateStr = now.toLocaleDateString("en-NG", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  const timeStr = now.toLocaleTimeString("en-NG", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const txnRef = useRef(`TXN-${Date.now().toString(36).toUpperCase()}`).current;

  const receiptParams = {
    senderName,
    senderAccount: seller?.accountNumber || "",
    recipientName,
    recipientAccount: recipientInfo?.accountNumber || "",
    amount,
    note: note || "",
    txnRef,
    dateStr,
    timeStr,
    newBalance: seller?.accountBalance || 0,
  };

  // Pre-draw on hidden canvas so export is instant
  useEffect(() => {
    if (previewRef.current) {
      drawReceipt(previewRef.current, receiptParams);
    }
  }, []);

  // ── Download ───────────────────────────────────────────────────────────
  const handleDownload = async () => {
    if (downloading) return;
    setDownloading(true);
    try {
      const blob = await generateReceiptBlob(receiptParams);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `LAN-Transfer-${txnRef}.png`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
      alert("Download failed. Please try again.");
    } finally {
      setDownloading(false);
    }
  };

  // ── Copy as image ──────────────────────────────────────────────────────
  const handleCopyImage = async () => {
    if (copying) return;
    setCopying(true);
    try {
      const blob = await generateReceiptBlob(receiptParams);
      await navigator.clipboard.write([
        new ClipboardItem({ "image/png": blob }),
      ]);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (e) {
      console.error(e);
      // Fallback to download
      alert("Your browser doesn't support image copy. Downloading instead.");
      handleDownload();
    } finally {
      setCopying(false);
    }
  };

  // ── Share as image file (like PDF on social media) ─────────────────────
  const handleShare = async () => {
    if (sharing) return;
    setSharing(true);
    try {
      const blob = await generateReceiptBlob(receiptParams);
      const file = new File([blob], `LAN-Transfer-${txnRef}.png`, {
        type: "image/png",
      });

      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          title: "LAN Transfer Receipt",
          text: `₦${(Number(amount) + 50).toLocaleString()} sent to ${recipientName} | Ref: ${txnRef}`,
          files: [file],
        });
      } else if (navigator.share) {
        await navigator.share({
          title: "LAN Transfer Receipt",
          text: `₦${Number(amount).toLocaleString()} sent to ${recipientName} | Ref: ${txnRef} | ${dateStr} ${timeStr}`,
        });
      } else {
        // Desktop fallback: download
        handleDownload();
      }
    } catch (e) {
      if (e.name !== "AbortError") {
        console.error(e);
        handleDownload();
      }
    } finally {
      setSharing(false);
    }
  };

  return (
    <div className="p-6 md:p-8">
      {/* Hidden canvas used only for export — not visible */}
      <canvas ref={previewRef} style={{ display: "none" }} />

      {/* Success Header */}
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
          <CheckCircle2 size={36} className="text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">
          Transfer Successful!
        </h2>
        <p className="text-gray-500 text-sm mt-1">
          Download or share your receipt as an image
        </p>
      </div>

      {/* ── HTML RECEIPT (visual only) ── */}
      <div
        style={{ fontFamily: "'Georgia', 'Times New Roman', serif" }}
        className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm mb-5"
      >
        {/* Header */}
        <div className="bg-blue-950 px-6 py-5 text-white text-center relative overflow-hidden">
          <div className="absolute -top-4 -left-4 w-20 h-20 rounded-full bg-white/5" />
          <div className="absolute -bottom-6 -right-6 w-28 h-28 rounded-full bg-white/5" />
          <div className="relative z-10">
            <p className="text-blue-300 text-xs font-bold uppercase tracking-[0.2em] mb-1">
              LAN Library
            </p>
            <p className="text-white text-xl font-bold">Transfer Receipt</p>
            <p className="text-blue-300 text-xs mt-1">
              {dateStr} · {timeStr}
            </p>
          </div>
        </div>

        {/* Amount */}
        <div className="bg-green-50 border-b border-green-100 px-6 py-5 text-center">
          <p className="text-xs text-green-600 font-semibold uppercase tracking-widest mb-1">
            Amount Transferred
          </p>
          <p className="text-4xl font-bold text-green-700">
            ₦{(Number(amount) + 50).toLocaleString()}
          </p>
          <span className="inline-block mt-2 text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full font-semibold">
            ✓ Completed
          </span>
        </div>

        {/* From → To */}
        <div className="px-6 py-5">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div className="flex-1 bg-gray-50 rounded-xl p-3 text-center border border-gray-100">
              <p className="text-xs text-gray-400 mb-1">From</p>
              <p className="font-bold text-gray-900 text-sm leading-tight">
                {senderName}
              </p>
              <p className="text-xs text-blue-800 font-mono mt-1">
                {formatAccountNumber(seller?.accountNumber)}
              </p>
            </div>
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-950 rounded-full flex items-center justify-center">
                <ArrowRight size={14} className="text-white" />
              </div>
            </div>
            <div className="flex-1 bg-gray-50 rounded-xl p-3 text-center border border-gray-100">
              <p className="text-xs text-gray-400 mb-1">To</p>
              <p className="font-bold text-gray-900 text-sm leading-tight">
                {recipientName}
              </p>
              <p className="text-xs text-blue-800 font-mono mt-1">
                {formatAccountNumber(recipientInfo?.accountNumber)}
              </p>
            </div>
          </div>

          {/* Dashed divider */}
          <div className="border-t border-dashed border-gray-200 my-4" />

          {/* Details */}
          <div className="space-y-2.5 text-sm">
            {/* After the dashed divider, inside space-y-2.5, add fee row */}
            <div className="flex justify-between py-1">
              <span className="text-gray-400">Transfer Fee</span>
              <span className="font-semibold text-orange-600">+ ₦50</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-gray-400">Reference</span>
              <span className="font-mono font-bold text-gray-800 text-xs">
                {txnRef}
              </span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-gray-400">Date</span>
              <span className="font-semibold text-gray-800">{dateStr}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-gray-400">Time</span>
              <span className="font-semibold text-gray-800">{timeStr}</span>
            </div>
            {note && (
              <div className="flex justify-between py-1">
                <span className="text-gray-400">Note</span>
                <span className="font-semibold text-gray-800 text-right max-w-[60%]">
                  {note}
                </span>
              </div>
            )}
            <div className="flex justify-between py-1 border-t border-gray-100 pt-3">
              <span className="text-gray-400">New Balance</span>
              <span className="font-bold text-blue-950">
                ₦{(seller?.accountBalance || 0).toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 border-t border-gray-100 px-6 py-4 text-center">
          <p className="text-xs text-gray-500">
            Powered by <span className="font-bold text-blue-950">LAN Bank</span>{" "}
            · lan.com
          </p>
          <p className="text-xs text-gray-400 mt-0.5">
            This is an official transfer receipt
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        {/* Download */}
        <button
          onClick={handleDownload}
          disabled={downloading}
          className="flex flex-col items-center gap-1.5 bg-blue-950 text-white py-3 px-2 rounded-xl hover:bg-blue-900 transition-all disabled:opacity-60"
        >
          {downloading ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <Download size={18} />
          )}
          <span className="text-xs font-semibold">
            {downloading ? "Saving..." : "Download"}
          </span>
        </button>

        {/* Copy Image */}
        <button
          onClick={handleCopyImage}
          disabled={copying}
          className="flex flex-col items-center gap-1.5 bg-gray-100 text-gray-700 py-3 px-2 rounded-xl hover:bg-gray-200 transition-all disabled:opacity-60"
        >
          {copying ? (
            <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-700 rounded-full animate-spin" />
          ) : copied ? (
            <Check size={18} className="text-green-600" />
          ) : (
            <Copy size={18} />
          )}
          <span
            className={`text-xs font-semibold ${copied ? "text-green-600" : ""}`}
          >
            {copying ? "Copying..." : copied ? "Copied!" : "Copy Image"}
          </span>
        </button>

        {/* Share */}
        <button
          onClick={handleShare}
          disabled={sharing}
          className="flex flex-col items-center gap-1.5 bg-gray-100 text-gray-700 py-3 px-2 rounded-xl hover:bg-gray-200 transition-all disabled:opacity-60"
        >
          {sharing ? (
            <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-700 rounded-full animate-spin" />
          ) : (
            <Share2 size={18} />
          )}
          <span className="text-xs font-semibold">
            {sharing ? "Sharing..." : "Share"}
          </span>
        </button>
      </div>

      <button
        onClick={onReset}
        className="w-full py-4 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-all"
      >
        Make Another Transfer
      </button>
    </div>
  );
}
