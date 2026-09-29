"use client";
// Save as: components/negotiation/BookNegotiation.jsx
//
// Drop it on the book page, next to the Buy button:
//   <BookNegotiation book={book} onDealChange={setDeal} />
// `deal` is null, or { id, finalPrice, expiresAt }. Pass it to your payment flow.

import React, { useCallback, useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { collection, getDocs, limit, query, where } from "firebase/firestore";
import { Check, Lock, Tag, X } from "lucide-react";
import { auth, db } from "@/lib/firebaseConfig";
import { useCurrency } from "@/app/context/CurrencyContext";
import {
  CREAM,
  GOLD,
  NAVY,
  btn,
  isLive,
  ms,
  negotiationCall,
  pill,
  when,
} from "./shared";

const MAX_OFFERS = 3;

/* ─── bottom sheet ─────────────────────────────────────────────── */
function OfferSheet({ price, maxDiscount, bookId, label, onClose, onSent }) {
  const { fmt } = useCurrency();
  const floor = Math.ceil(price * (1 - maxDiscount / 100));
  const quick = [10, 20, 30, 40].filter((p) => p <= maxDiscount);
  if (quick.length === 0) quick.push(maxDiscount);

  const [offer, setOffer] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const n = Math.round(Number(offer));
  const valid = Number.isFinite(n) && n >= floor && n < price;

  const send = async () => {
    setBusy(true);
    setErr("");
    try {
      await negotiationCall("/api/negotiations", { bookId, offer: n, message });
      onSent();
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(7,19,31,.65)",
        zIndex: 1200,
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#fff",
          width: "100%",
          maxWidth: 480,
          padding: 20,
          borderRadius: "16px 16px 0 0",
          fontFamily: "'Lato',sans-serif",
          maxHeight: "92vh",
          overflowY: "auto",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: 14,
          }}
        >
          <div>
            <p
              style={{
                fontFamily: "'Playfair Display',serif",
                fontSize: 18,
                fontWeight: 700,
                color: NAVY,
                margin: "0 0 2px",
              }}
            >
              {label}
            </p>
            <p style={{ fontSize: 12, color: "#888", margin: 0 }}>
              Listed price:{" "}
              <strong style={{ color: NAVY }}>{fmt(price)}</strong>
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "#888",
            }}
          >
            <X size={20} />
          </button>
        </div>

        <p
          style={{
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: GOLD,
            margin: "0 0 8px",
          }}
        >
          Tap a quick offer
        </p>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(${Math.min(quick.length, 3)}, 1fr)`,
            gap: 8,
            marginBottom: 14,
          }}
        >
          {quick.map((p) => {
            const amount = Math.round(price * (1 - p / 100));
            const on = n === amount;
            return (
              <button
                key={p}
                onClick={() => setOffer(String(amount))}
                style={{
                  padding: "12px 6px",
                  border: `1.5px solid ${on ? NAVY : "#e5ddd0"}`,
                  background: on ? NAVY : CREAM,
                  color: on ? "#fff" : NAVY,
                  cursor: "pointer",
                  textAlign: "center",
                }}
              >
                <span
                  style={{ display: "block", fontSize: 14, fontWeight: 700 }}
                >
                  {fmt(amount)}
                </span>
                <span style={{ display: "block", fontSize: 10, opacity: 0.7 }}>
                  {p}% off
                </span>
              </button>
            );
          })}
        </div>

        <label
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: NAVY,
            display: "block",
            marginBottom: 6,
          }}
        >
          Or type your own price (₦)
        </label>
        <input
          type="number"
          inputMode="numeric"
          value={offer}
          onChange={(e) => setOffer(e.target.value)}
          placeholder={`From ${floor.toLocaleString()}`}
          style={{
            width: "100%",
            padding: "11px 12px",
            border: "1px solid #e5ddd0",
            fontSize: 14,
            marginBottom: 4,
            boxSizing: "border-box",
          }}
        />
        <p
          style={{
            fontSize: 11,
            color: offer && !valid ? "#dc2626" : "#aaa",
            margin: "0 0 12px",
          }}
        >
          {offer && !valid
            ? `Enter between ₦${floor.toLocaleString()} and ₦${(price - 1).toLocaleString()}`
            : `Lowest this seller considers: ₦${floor.toLocaleString()}`}
        </p>

        <label
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: NAVY,
            display: "block",
            marginBottom: 6,
          }}
        >
          Message (optional)
        </label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value.slice(0, 200))}
          rows={2}
          placeholder="I need it for exams tomorrow"
          style={{
            width: "100%",
            padding: "10px 12px",
            border: "1px solid #e5ddd0",
            fontSize: 13,
            marginBottom: 12,
            boxSizing: "border-box",
            resize: "none",
            fontFamily: "inherit",
          }}
        />

        {err && (
          <p style={{ fontSize: 12, color: "#dc2626", margin: "0 0 10px" }}>
            {err}
          </p>
        )}

        <button
          onClick={send}
          disabled={!valid || busy}
          style={{ ...btn(true, !valid || busy), width: "100%" }}
        >
          {busy ? "Sending…" : "Send Offer"}
        </button>
        <p
          style={{
            fontSize: 10.5,
            color: "#aaa",
            textAlign: "center",
            margin: "10px 0 0",
          }}
        >
          You get one offer per request. The seller can accept, decline, or send
          a final price.
        </p>
      </div>
    </div>
  );
}

/* ─── main widget ──────────────────────────────────────────────── */
export default function BookNegotiation({ book, onDealChange }) {
  const { fmt } = useCurrency();
  const bookId = String(book?.id || "").replace(/^firestore-/, "");
  const price = Number(book?.price) || 0;
  const maxDiscount = Math.min(
    50,
    Math.max(5, Number(book?.maxDiscountPercent) || 20),
  );
  const sellerId = book?.sellerId || book?.userId;
  const label =
    book?.intent === "academic" ? "Request Student Discount" : "Make an Offer";

  const [uid, setUid] = useState(null);
  const [rows, setRows] = useState([]);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  // One small query per visit. No live listener, to keep Firestore reads low.
  const load = useCallback(
    async (userId) => {
      if (!userId || !bookId) {
        setRows([]);
        return;
      }
      try {
        const snap = await getDocs(
          query(
            collection(db, "negotiations"),
            where("buyerId", "==", userId),
            where("bookId", "==", bookId),
            limit(10),
          ),
        );
        setRows(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      } catch (e) {
        console.error(e);
      }
    },
    [bookId],
  );

  useEffect(
    () =>
      onAuthStateChanged(auth, (u) => {
        setUid(u?.uid || null);
        load(u?.uid);
      }),
    [load],
  );

  const sorted = [...rows].sort((a, b) => ms(b.createdAt) - ms(a.createdAt));
  const current = sorted.find(isLive);
  const deal = current && current.status === "accepted" ? current : null;

  useEffect(() => {
    onDealChange?.(
      deal
        ? {
            id: deal.id,
            finalPrice: deal.finalPrice,
            expiresAt: deal.expiresAt,
          }
        : null,
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deal?.id]);

  const decide = async (action) => {
    setBusy(true);
    setErr("");
    try {
      await negotiationCall("/api/negotiations/respond", {
        id: current.id,
        action,
      });
      await load(uid);
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  };

  if (price <= 0 || book?.isFree) return null;

  if (book?.isNegotiable !== true) {
    return (
      <div style={{ margin: "10px 0" }}>
        <span style={pill("#f3f4f6", "#6b7280")}>
          <Lock size={11} /> Fixed price, not negotiable
        </span>
      </div>
    );
  }
  if (uid && uid === sellerId) return null;

  return (
    <div
      style={{
        margin: "12px 0",
        border: "1px solid rgba(184,150,62,0.35)",
        background: CREAM,
        padding: 14,
        fontFamily: "'Lato',sans-serif",
      }}
    >
      <span style={pill("rgba(184,150,62,0.15)", "#8a6d1e")}>
        <Tag size={11} /> Negotiable, up to {maxDiscount}% off
      </span>

      {!uid ? (
        <div style={{ marginTop: 10 }}>
          <a
            href={`/signin?redirect=${encodeURIComponent(typeof window !== "undefined" ? window.location.pathname + window.location.search : "/")}`}
            style={{
              ...btn(true),
              display: "inline-block",
              textDecoration: "none",
            }}
          >
            Sign in to make an offer
          </a>
        </div>
      ) : current?.status === "pending" ? (
        <p
          style={{
            fontSize: 13,
            color: NAVY,
            margin: "10px 0 0",
            lineHeight: 1.6,
          }}
        >
          Your offer of <strong>{fmt(current.requestedPrice)}</strong> is with
          the seller. They have until {when(current.expiresAt)} to reply.
        </p>
      ) : current?.status === "countered" ? (
        <div style={{ marginTop: 10 }}>
          <p style={{ fontSize: 13, color: NAVY, margin: "0 0 4px" }}>
            You offered {fmt(current.requestedPrice)}.
          </p>
          <p
            style={{
              fontFamily: "'Playfair Display',serif",
              fontSize: 20,
              fontWeight: 700,
              color: NAVY,
              margin: "0 0 2px",
            }}
          >
            Seller's last price: {fmt(current.finalPrice)}
          </p>
          <p style={{ fontSize: 11, color: "#8a6d1e", margin: "0 0 10px" }}>
            Final. Take it or leave it. Valid until {when(current.expiresAt)}.
          </p>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={() => decide("buyer_accept")}
              disabled={busy}
              style={btn(true, busy)}
            >
              <Check size={12} style={{ verticalAlign: "-2px" }} /> Accept last
              price
            </button>
            <button
              onClick={() => decide("buyer_decline")}
              disabled={busy}
              style={btn(false, busy)}
            >
              Decline
            </button>
          </div>
        </div>
      ) : current?.status === "accepted" ? (
        <div style={{ marginTop: 10 }}>
          <p
            style={{
              fontFamily: "'Playfair Display',serif",
              fontSize: 20,
              fontWeight: 700,
              color: "#16a34a",
              margin: "0 0 2px",
            }}
          >
            Your price: {fmt(current.finalPrice)}
          </p>
          <p style={{ fontSize: 11, color: "#666", margin: 0 }}>
            Locked for your account until {when(current.expiresAt)}. Use the Buy
            button to pay this price.
          </p>
        </div>
      ) : rows.length >= MAX_OFFERS ? (
        <p style={{ fontSize: 12, color: "#888", margin: "10px 0 0" }}>
          You've used all {MAX_OFFERS} offers for this book. You can still buy
          at the listed price.
        </p>
      ) : (
        <div style={{ marginTop: 10 }}>
          {sorted[0]?.status === "rejected" && (
            <p style={{ fontSize: 12, color: "#888", margin: "0 0 8px" }}>
              The seller passed on your last offer.
            </p>
          )}
          <button onClick={() => setOpen(true)} style={btn(true)}>
            {label}
          </button>
        </div>
      )}

      {err && (
        <p style={{ fontSize: 12, color: "#dc2626", margin: "8px 0 0" }}>
          {err}
        </p>
      )}

      {open && (
        <OfferSheet
          price={price}
          maxDiscount={maxDiscount}
          bookId={bookId}
          label={label}
          onClose={() => setOpen(false)}
          onSent={async () => {
            setOpen(false);
            await load(uid);
          }}
        />
      )}
    </div>
  );
}
