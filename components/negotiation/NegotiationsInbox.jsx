"use client";
// Save as: components/negotiation/NegotiationsInbox.jsx
// Used by two pages: role="seller" (offers to answer) and role="buyer" (my offers).

import React, { useCallback, useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { collection, getDocs, limit, query, where } from "firebase/firestore";
import { auth, db } from "@/lib/firebaseConfig";
import { useCurrency } from "@/app/context/CurrencyContext";
import {
  ACTIVE,
  CREAM,
  GOLD,
  NAVY,
  btn,
  ms,
  negotiationCall,
  when,
} from "./shared";

const statusOf = (n) => {
  if (ACTIVE.includes(n.status) && ms(n.expiresAt) < Date.now())
    return ["Expired", "#6b7280"];
  return (
    {
      pending: ["Waiting for seller", "#a16207"],
      countered: ["Last price sent", NAVY],
      accepted: ["Agreed, ready to buy", "#16a34a"],
      rejected: ["Declined by seller", "#dc2626"],
      declined: ["Last price declined", "#6b7280"],
      used: ["Purchased", "#16a34a"],
    }[n.status] || [n.status, "#6b7280"]
  );
};

function LastPrice({ n, busy, onSend }) {
  const { fmt } = useCurrency();
  const [val, setVal] = useState("");
  const chips = [5, 10]
    .map((p) => Math.round(n.listPrice * (1 - p / 100)))
    .filter((v) => v > n.requestedPrice && v <= n.listPrice);
  const price = Math.round(Number(val));
  const ok =
    Number.isFinite(price) && price > n.requestedPrice && price <= n.listPrice;

  return (
    <div
      style={{ marginTop: 12, paddingTop: 12, borderTop: "1px dashed #e5ddd0" }}
    >
      <p
        style={{
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          color: GOLD,
          margin: "0 0 8px",
        }}
      >
        Your last price (final offer)
      </p>
      <div
        style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 }}
      >
        {chips.map((v) => (
          <button
            key={v}
            onClick={() => setVal(String(v))}
            style={{
              padding: "7px 12px",
              border: `1px solid ${Number(val) === v ? NAVY : "#e5ddd0"}`,
              background: Number(val) === v ? NAVY : CREAM,
              color: Number(val) === v ? "#fff" : NAVY,
              fontSize: 12,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            {fmt(v)}
          </button>
        ))}
        <input
          type="number"
          inputMode="numeric"
          value={val}
          onChange={(e) => setVal(e.target.value)}
          placeholder={`${(n.requestedPrice + 1).toLocaleString()} to ${n.listPrice.toLocaleString()}`}
          style={{
            flex: 1,
            minWidth: 130,
            padding: "7px 10px",
            border: "1px solid #e5ddd0",
            fontSize: 13,
          }}
        />
      </div>
      <button
        disabled={!ok || busy}
        onClick={() => onSend(price)}
        style={btn(true, !ok || busy)}
      >
        Send last price
      </button>
      <p style={{ fontSize: 10.5, color: "#aaa", margin: "6px 0 0" }}>
        After this the buyer can only accept or decline. It stays valid for 24
        hours.
      </p>
    </div>
  );
}

export default function NegotiationsInbox({ role }) {
  const isSeller = role === "seller";
  const { fmt } = useCurrency();
  const [uid, setUid] = useState(null);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("action");
  const [busyId, setBusyId] = useState(null);
  const [err, setErr] = useState("");

  const load = useCallback(
    async (userId) => {
      if (!userId) {
        setLoading(false);
        return;
      }
      try {
        const snap = await getDocs(
          query(
            collection(db, "negotiations"),
            where(isSeller ? "sellerId" : "buyerId", "==", userId),
            limit(60),
          ),
        );
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        list.sort((a, b) => ms(b.createdAt) - ms(a.createdAt));
        setRows(list);
      } catch (e) {
        console.error(e);
        setErr("Could not load offers.");
      } finally {
        setLoading(false);
      }
    },
    [isSeller],
  );

  useEffect(
    () =>
      onAuthStateChanged(auth, (u) => {
        setUid(u?.uid || null);
        load(u?.uid);
      }),
    [load],
  );

  const act = async (id, action, price) => {
    setBusyId(id);
    setErr("");
    try {
      await negotiationCall("/api/negotiations/respond", { id, action, price });
      await load(uid);
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusyId(null);
    }
  };

  const alive = (n) => ms(n.expiresAt) > Date.now();
  const needsAction = (n) =>
    isSeller
      ? n.status === "pending" && alive(n)
      : (n.status === "countered" || n.status === "accepted") && alive(n);

  const shown = rows.filter((n) =>
    tab === "action" ? needsAction(n) : !needsAction(n),
  );
  const actionCount = rows.filter(needsAction).length;

  return (
    <div
      style={{
        maxWidth: 760,
        margin: "0 auto",
        padding: "24px 16px 80px",
        fontFamily: "'Lato',sans-serif",
      }}
    >
      <p
        style={{
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: "0.2em",
          textTransform: "uppercase",
          color: GOLD,
          margin: "0 0 4px",
        }}
      >
        {isSeller ? "Seller tools" : "Your offers"}
      </p>
      <h1
        style={{
          fontFamily: "'Playfair Display',serif",
          fontSize: 26,
          fontWeight: 700,
          color: NAVY,
          margin: "0 0 16px",
        }}
      >
        {isSeller ? "Price Negotiations" : "My Offers"}
      </h1>

      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        {[
          ["action", `Needs action (${actionCount})`],
          ["history", "History"],
        ].map(([k, l]) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            style={btn(tab === k, false)}
          >
            {l}
          </button>
        ))}
      </div>

      {err && (
        <p style={{ fontSize: 12, color: "#dc2626", margin: "0 0 12px" }}>
          {err}
        </p>
      )}
      {loading && <p style={{ color: "#aaa", fontSize: 13 }}>Loading…</p>}
      {!loading && shown.length === 0 && (
        <div
          style={{
            background: "#fff",
            border: "0.5px solid #e5ddd0",
            padding: "40px 16px",
            textAlign: "center",
            color: "#aaa",
            fontSize: 13,
          }}
        >
          {tab === "action"
            ? "Nothing waiting for you right now."
            : "No past offers yet."}
        </div>
      )}

      {shown.map((n) => {
        const [label, color] = statusOf(n);
        const off = Math.round((1 - n.requestedPrice / n.listPrice) * 100);
        const busy = busyId === n.id;
        return (
          <div
            key={n.id}
            style={{
              background: "#fff",
              border: "0.5px solid #e5ddd0",
              padding: 16,
              marginBottom: 12,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 10,
                alignItems: "flex-start",
              }}
            >
              <div style={{ minWidth: 0 }}>
                <p
                  style={{
                    fontFamily: "'Playfair Display',serif",
                    fontSize: 15,
                    fontWeight: 700,
                    color: NAVY,
                    margin: "0 0 3px",
                  }}
                >
                  {n.bookTitle}
                </p>
                <p style={{ fontSize: 12, color: "#888", margin: 0 }}>
                  {isSeller ? (
                    <>
                      <strong style={{ color: NAVY }}>{n.buyerName}</strong>{" "}
                      offered{" "}
                    </>
                  ) : (
                    "You offered "
                  )}
                  <strong style={{ color: NAVY }}>
                    {fmt(n.requestedPrice)}
                  </strong>{" "}
                  ({off}% off {fmt(n.listPrice)})
                </p>
              </div>
              <span
                style={{
                  fontSize: 10.5,
                  fontWeight: 700,
                  color,
                  border: `1px solid ${color}`,
                  padding: "3px 8px",
                  whiteSpace: "nowrap",
                }}
              >
                {label}
              </span>
            </div>

            {n.message && (
              <p
                style={{
                  fontSize: 12.5,
                  color: "#555",
                  background: CREAM,
                  padding: "8px 10px",
                  margin: "10px 0 0",
                }}
              >
                "{n.message}"
              </p>
            )}

            {n.finalPrice && (
              <p style={{ fontSize: 13, color: NAVY, margin: "10px 0 0" }}>
                {n.isFinal ? "Seller's last price" : "Agreed price"}:{" "}
                <strong>{fmt(n.finalPrice)}</strong>
                {alive(n) && ACTIVE.includes(n.status)
                  ? ` · valid until ${when(n.expiresAt)}`
                  : ""}
              </p>
            )}

            {/* seller actions */}
            {isSeller && needsAction(n) && (
              <>
                <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                  <button
                    disabled={busy}
                    onClick={() => act(n.id, "accept")}
                    style={btn(true, busy)}
                  >
                    Accept {fmt(n.requestedPrice)}
                  </button>
                  <button
                    disabled={busy}
                    onClick={() => act(n.id, "reject")}
                    style={btn(false, busy)}
                  >
                    Reject
                  </button>
                </div>
                <LastPrice
                  n={n}
                  busy={busy}
                  onSend={(p) => act(n.id, "counter", p)}
                />
              </>
            )}

            {/* buyer actions */}
            {!isSeller && n.status === "countered" && alive(n) && (
              <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                <button
                  disabled={busy}
                  onClick={() => act(n.id, "buyer_accept")}
                  style={btn(true, busy)}
                >
                  Accept {fmt(n.finalPrice)}
                </button>
                <button
                  disabled={busy}
                  onClick={() => act(n.id, "buyer_decline")}
                  style={btn(false, busy)}
                >
                  Decline
                </button>
              </div>
            )}
            {!isSeller && n.status === "accepted" && alive(n) && (
              <a
                href={`/book/preview?id=${n.bookId}`}
                style={{
                  ...btn(true),
                  display: "inline-block",
                  textDecoration: "none",
                  marginTop: 12,
                }}
              >
                Buy now at {fmt(n.finalPrice)}
              </a>
            )}
          </div>
        );
      })}
    </div>
  );
}
