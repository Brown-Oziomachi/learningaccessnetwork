"use client";
import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X, Check, Clock } from "lucide-react";
import {
  ACTIVE,
  PLATFORM_SHARE,
  naira,
  negId,
  pctOff,
  floorPriceOf,
  timeLeft,
  wordsFor,
  effectiveStatus,
  reopenState,
  discountTiers,
  counterChoices,
  useNegotiation,
  useNow,
  touchPresence,
  markRead,
  submitOffer,
  sellerAccept,
  sellerCounter,
  sellerDecline,
  buyerAccept,
  buyerDecline,
  buyerWithdraw,
} from "@/lib/negotiation";

export const NAVY = "#0d2244";
export const GOLD = "#b8963e";
const CREAM = "#f5f0e8";
const GREEN = "#0d5c2e";

/** negotiate = gold/handshake · discount = green/ticket (lecturers) */
export const THEMES = {
  negotiate: {
    accent: GOLD,
    soft: "rgba(184,150,62,0.10)",
    border: "rgba(184,150,62,0.4)",
    label: "Price negotiation",
    icon: "🤝",
  },
  discount: {
    accent: GREEN,
    soft: "rgba(13,92,46,0.08)",
    border: "rgba(13,92,46,0.35)",
    label: "Student discount",
    icon: "🎓",
  },
};

const css = `
.neg-overlay{position:fixed;inset:0;background:rgba(7,19,31,.7);z-index:1500;display:flex;align-items:center;justify-content:center;padding:16px;backdrop-filter:blur(3px)}
.neg-panel{background:#fff;width:100%;max-width:520px;max-height:92vh;display:flex;flex-direction:column;font-family:'Lato',sans-serif;animation:negUp .28s cubic-bezier(.4,0,.2,1) both;overflow:hidden}
.neg-body{overflow-y:auto;padding:18px 20px 22px;background:#f5f1ea;flex:1}
.neg-chip{cursor:pointer;transition:border-color .15s,background .15s;font-family:'Lato',sans-serif}
.neg-chip:focus-visible,.neg-btn:focus-visible{outline:2px solid ${GOLD};outline-offset:2px}
.neg-btn{cursor:pointer;font-family:'Lato',sans-serif;font-weight:700;transition:opacity .15s}
.neg-btn:disabled{cursor:not-allowed;opacity:.45}
@keyframes negUp{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:none}}
@keyframes negPulse{0%,100%{opacity:1}50%{opacity:.35}}
@media(max-width:560px){.neg-overlay{align-items:flex-end;padding:0}.neg-panel{max-height:94vh;border-radius:16px 16px 0 0}}
@media(prefers-reduced-motion:reduce){.neg-panel{animation:none}}
`;

const label = {
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: "0.14em",
  textTransform: "uppercase",
  margin: "0 0 8px",
};
const solid = (bg, color = "#fff") => ({
  width: "100%",
  background: bg,
  color,
  border: "none",
  padding: "13px 16px",
  fontSize: 13,
  letterSpacing: "0.04em",
});
const ghost = {
  width: "100%",
  background: "transparent",
  color: "#8a8a8a",
  border: "none",
  padding: "10px",
  fontSize: 12,
  textDecoration: "underline",
};

/* ─────────────────────────────  timeline  ───────────────────────────── */
function Timeline({ neg, role, fmt }) {
  const w = wordsFor(neg.mode);
  const who = (by) =>
    by === role ? "You" : by === "seller" ? w.sellerThe : w.buyerThe;
  const text = (ev) => {
    const pct = ev.price ? pctOff(neg.listPrice, ev.price) : 0;
    switch (ev.type) {
      case "offer":
        return neg.mode === "discount"
          ? `${who(ev.by)} requested ${pct}% off`
          : `${who(ev.by)} offered ${fmt(ev.price)}`;
      case "counter":
        return neg.mode === "discount"
          ? `${who(ev.by)} offered ${pct}% off instead`
          : `${who(ev.by)} sent a final price of ${fmt(ev.price)}`;
      case "accepted":
        return `${who(ev.by)} ${neg.mode === "discount" && ev.by === "seller" ? "approved" : "accepted"} ${fmt(ev.price)}`;
      case "declined":
        return `${who(ev.by)} declined`;
      case "withdrawn":
        return `${who(ev.by)} withdrew the request`;
      default:
        return "";
    }
  };
  const tone = (t) =>
    t === "accepted"
      ? "#16a34a"
      : t === "declined"
        ? "#dc2626"
        : t === "withdrawn"
          ? "#9ca3af"
          : NAVY;
  return (
    <div style={{ marginBottom: 16 }}>
      <p style={{ ...label, color: "#aaa" }}>So far</p>
      {(neg.events || []).map((ev, i) => (
        <div
          key={i}
          style={{
            display: "flex",
            gap: 10,
            padding: "9px 0",
            borderBottom: "0.5px solid #e5ddd0",
          }}
        >
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: tone(ev.type),
              marginTop: 5,
              flexShrink: 0,
            }}
          />
          <div style={{ flex: 1, minWidth: 0 }}>
            <p
              style={{ margin: 0, fontSize: 13, color: NAVY, fontWeight: 700 }}
            >
              {text(ev)}
            </p>
            <p style={{ margin: "2px 0 0", fontSize: 10, color: "#aaa" }}>
              {new Date(ev.at).toLocaleString("en-GB", {
                day: "2-digit",
                month: "short",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>
          {ev.price ? (
            <span
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: NAVY,
                whiteSpace: "nowrap",
              }}
            >
              {fmt(ev.price)}
            </span>
          ) : null}
        </div>
      ))}
    </div>
  );
}

/* ─────────────────────  buyer: choose a request  ─────────────────────── */
function ComposePanel({ draft, th, busy, fmt, onSubmit }) {
  const mode = draft.mode;
  const w = wordsFor(mode);
  const list = Number(draft.listPrice);
  const max = Number(draft.maxPct);
  const floor = floorPriceOf(list, max);
  const tiers = discountTiers(list, max);
  const [sel, setSel] = useState(null);
  const [custom, setCustom] = useState("");
  const customNum = Math.round(Number(custom));
  const customBad = custom !== "" && !(customNum >= floor && customNum < list);
  const price =
    custom !== "" ? (customBad ? null : customNum) : (sel?.price ?? null);
  const pct = price ? pctOff(list, price) : 0;

  return (
    <div>
      <p style={{ ...label, color: th.accent }}>
        {mode === "discount" ? "Choose your discount" : "Choose your offer"}
      </p>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill,minmax(104px,1fr))",
          gap: 8,
          marginBottom: 12,
        }}
      >
        {tiers.map((t) => {
          const on = custom === "" && sel?.pct === t.pct;
          return (
            <button
              key={t.pct}
              type="button"
              className="neg-chip"
              onClick={() => {
                setSel(t);
                setCustom("");
              }}
              style={{
                textAlign: "center",
                padding: "12px 6px",
                border: `${mode === "discount" ? "1.5px dashed" : "1.5px solid"} ${on ? th.accent : "#d9d1c3"}`,
                background: on ? th.soft : "#fff",
              }}
            >
              <span
                style={{
                  display: "block",
                  fontFamily: "'Playfair Display',serif",
                  fontSize: 20,
                  fontWeight: 800,
                  color: on ? th.accent : NAVY,
                }}
              >
                {mode === "discount" ? `${t.pct}% off` : fmt(t.price)}
              </span>
              <span
                style={{
                  display: "block",
                  fontSize: 11,
                  color: "#888",
                  marginTop: 2,
                }}
              >
                {mode === "discount" ? fmt(t.price) : `${t.pct}% less`}
              </span>
            </button>
          );
        })}
      </div>

      {mode !== "discount" && (
        <div style={{ marginBottom: 12 }}>
          <p style={{ ...label, color: "#aaa", marginBottom: 6 }}>
            Or type your own amount (₦)
          </p>
          <input
            type="number"
            inputMode="numeric"
            value={custom}
            onChange={(e) => {
              setCustom(e.target.value);
              setSel(null);
            }}
            placeholder={`${floor} – ${list - 1}`}
            style={{
              width: "100%",
              border: `0.5px solid ${customBad ? "#ef4444" : "#d9d1c3"}`,
              padding: "11px 12px",
              fontSize: 14,
              fontWeight: 700,
              color: NAVY,
              outline: "none",
              boxSizing: "border-box",
            }}
          />
          {customBad && (
            <p style={{ margin: "4px 0 0", fontSize: 11, color: "#dc2626" }}>
              Enter between {fmt(floor)} and {fmt(list - 1)}.
            </p>
          )}
        </div>
      )}

      <button
        type="button"
        className="neg-btn"
        disabled={!price || busy}
        onClick={() => onSubmit(price)}
        style={solid(th.accent)}
      >
        {busy
          ? "Sending…"
          : price
            ? mode === "discount"
              ? `Request ${pct}% discount · ${fmt(price)}`
              : `Send offer of ${fmt(price)}`
            : mode === "discount"
              ? "Pick a discount"
              : "Pick or enter an offer"}
      </button>
      <p
        style={{
          fontSize: 11,
          color: "#888",
          lineHeight: 1.6,
          margin: "10px 0 0",
        }}
      >
        {mode === "discount"
          ? `${w.sellerThe} reviews every request. You'll be notified here and on your dashboard — nothing changes without their approval.`
          : `You get one offer. ${w.sellerThe} can accept, decline, or reply with a final price. Nothing changes without their approval.`}
      </p>
    </div>
  );
}

/* ─────────────────────  seller / lecturer: decide  ───────────────────── */
function SellerPanel({ neg, th, busy, fmt, onAccept, onCounter, onDecline }) {
  const mode = neg.mode;
  const w = wordsFor(mode);
  const choices = counterChoices({
    mode,
    list: neg.listPrice,
    offered: neg.offeredPrice,
  });
  const [pick, setPick] = useState(null);
  const [custom, setCustom] = useState("");
  const customNum = Math.round(Number(custom));
  const customOk =
    custom !== "" && customNum > neg.offeredPrice && customNum <= neg.listPrice;
  const counter = custom !== "" ? (customOk ? customNum : null) : pick;
  const reqPct = pctOff(neg.listPrice, neg.offeredPrice);
  const earn = (p) => fmt(p * PLATFORM_SHARE);

  return (
    <div>
      <div
        style={{
          background: "#fff",
          border: `1.5px solid ${th.accent}`,
          padding: 16,
          marginBottom: 14,
        }}
      >
        <p style={{ ...label, color: th.accent, marginBottom: 4 }}>
          {mode === "discount" ? "Discount requested" : "Offer received"}
        </p>
        <p
          style={{
            fontFamily: "'Playfair Display',serif",
            fontSize: 28,
            fontWeight: 800,
            color: NAVY,
            margin: "0 0 2px",
          }}
        >
          {mode === "discount" ? `${reqPct}% off` : fmt(neg.offeredPrice)}
        </p>
        <p style={{ fontSize: 12, color: "#888", margin: "0 0 12px" }}>
          {mode === "discount"
            ? `${fmt(neg.offeredPrice)} instead of ${fmt(neg.listPrice)}`
            : `${reqPct}% below your ${fmt(neg.listPrice)} price`}
          {" · "}you earn {earn(neg.offeredPrice)}
        </p>
        <button
          type="button"
          className="neg-btn"
          disabled={busy}
          onClick={onAccept}
          style={solid("#16a34a")}
        >
          {busy
            ? "Please wait…"
            : mode === "discount"
              ? `Approve ${reqPct}% discount`
              : `Accept ${fmt(neg.offeredPrice)}`}
        </button>
      </div>

      {choices.length > 0 && (
        <div
          style={{
            background: "#fff",
            border: "0.5px solid #e5ddd0",
            padding: 16,
            marginBottom: 14,
          }}
        >
          <p style={{ ...label, color: "#aaa", marginBottom: 10 }}>
            {mode === "discount"
              ? "Or offer a smaller discount"
              : "Or send one final price"}
          </p>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill,minmax(104px,1fr))",
              gap: 8,
              marginBottom: 10,
            }}
          >
            {choices.map((c) => {
              const on = custom === "" && pick === c.price;
              return (
                <button
                  key={c.price}
                  type="button"
                  className="neg-chip"
                  onClick={() => {
                    setPick(c.price);
                    setCustom("");
                  }}
                  style={{
                    textAlign: "center",
                    padding: "10px 6px",
                    border: `1.5px ${mode === "discount" ? "dashed" : "solid"} ${on ? th.accent : "#d9d1c3"}`,
                    background: on ? th.soft : "#fff",
                  }}
                >
                  <span
                    style={{
                      display: "block",
                      fontFamily: "'Playfair Display',serif",
                      fontSize: 17,
                      fontWeight: 800,
                      color: on ? th.accent : NAVY,
                    }}
                  >
                    {mode === "discount" ? `${c.pct}% off` : fmt(c.price)}
                  </span>
                  <span
                    style={{
                      display: "block",
                      fontSize: 10,
                      color: "#888",
                      marginTop: 2,
                    }}
                  >
                    {mode === "discount" ? fmt(c.price) : `${c.pct}% off`} ·
                    earn {earn(c.price)}
                  </span>
                </button>
              );
            })}
          </div>
          {mode !== "discount" && (
            <>
              <input
                type="number"
                inputMode="numeric"
                value={custom}
                onChange={(e) => {
                  setCustom(e.target.value);
                  setPick(null);
                }}
                placeholder={`Your own price (₦${neg.offeredPrice + 1} – ${neg.listPrice})`}
                style={{
                  width: "100%",
                  border: `0.5px solid ${custom !== "" && !customOk ? "#ef4444" : "#d9d1c3"}`,
                  padding: "10px 12px",
                  fontSize: 13,
                  color: NAVY,
                  outline: "none",
                  boxSizing: "border-box",
                  marginBottom: 10,
                }}
              />
            </>
          )}
          <button
            type="button"
            className="neg-btn"
            disabled={!counter || busy}
            onClick={() => onCounter(counter)}
            style={solid(NAVY)}
          >
            {counter
              ? mode === "discount"
                ? `Offer ${pctOff(neg.listPrice, counter)}% off · ${fmt(counter)}`
                : `Send final price ${fmt(counter)}`
              : mode === "discount"
                ? "Pick a smaller discount"
                : "Pick a final price"}
          </button>
          <p
            style={{
              fontSize: 11,
              color: "#888",
              margin: "8px 0 0",
              lineHeight: 1.6,
            }}
          >
            {w.buyerThe} can accept or decline. If accepted, the price stays
            locked for them for 24 hours.
          </p>
        </div>
      )}

      <button
        type="button"
        className="neg-btn"
        disabled={busy}
        onClick={onDecline}
        style={{ ...solid("#fff", "#dc2626"), border: "0.5px solid #fecaca" }}
      >
        {mode === "discount" ? "Not available for this document" : "Decline"}
      </button>
    </div>
  );
}

/* ─────────────────────  buyer: answer a final price  ─────────────────── */
function BuyerReplyPanel({ neg, th, busy, fmt, now, onAccept, onDecline }) {
  const pct = pctOff(neg.listPrice, neg.counterPrice);
  return (
    <div
      style={{
        background: "#fff",
        border: `1.5px solid ${th.accent}`,
        padding: 16,
      }}
    >
      <p style={{ ...label, color: th.accent, marginBottom: 4 }}>
        {neg.mode === "discount"
          ? "Lecturer's discount"
          : "Final price from the seller"}
      </p>
      <p
        style={{
          fontFamily: "'Playfair Display',serif",
          fontSize: 30,
          fontWeight: 800,
          color: NAVY,
          margin: "0 0 2px",
        }}
      >
        {neg.mode === "discount" ? `${pct}% off` : fmt(neg.counterPrice)}
      </p>
      <p style={{ fontSize: 12, color: "#888", margin: "0 0 4px" }}>
        {neg.mode === "discount"
          ? `${fmt(neg.counterPrice)} instead of ${fmt(neg.listPrice)}`
          : `${pct}% below the listed ${fmt(neg.listPrice)}`}
      </p>
      <p
        style={{
          fontSize: 11,
          color: "#a16207",
          margin: "0 0 14px",
          display: "flex",
          alignItems: "center",
          gap: 5,
        }}
      >
        <Clock size={11} /> Reply within {timeLeft(neg.expiresAtMs - now)}
      </p>
      <button
        type="button"
        className="neg-btn"
        disabled={busy}
        onClick={onAccept}
        style={{ ...solid("#16a34a"), marginBottom: 6 }}
      >
        {busy ? "Please wait…" : `Accept & pay ${fmt(neg.counterPrice)}`}
      </button>
      <button
        type="button"
        className="neg-btn"
        disabled={busy}
        onClick={onDecline}
        style={ghost}
      >
        No thanks — you can ask again in 24 hours
      </button>
    </div>
  );
}

/* ─────────────────────────  main modal  ────────────────────────────── */
export default function NegotiationModal({
  open = true,
  onClose,
  user,
  negotiationId,
  draft,
  fmt = naira,
  onPay,
}) {
  const id =
    negotiationId || (draft && user ? negId(draft.bookId, user.uid) : null);
  const { neg, loading } = useNegotiation(id);
  const now = useNow(15000);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const role = neg
    ? user?.uid === neg.sellerId
      ? "seller"
      : user?.uid === neg.buyerId
        ? "buyer"
        : null
    : draft && user && user.uid !== draft.sellerId
      ? "buyer"
      : null;
  const status = effectiveStatus(neg, now);
  const mode = neg?.mode || draft?.mode || "negotiate";
  const th = THEMES[mode];
  const w = wordsFor(mode);
  const active = ACTIVE.includes(status);
  const reopen = reopenState(neg, now);
  const canCompose = role === "buyer" && !!draft && (!neg || reopen.ok);
  const other = role === "seller" ? "buyer" : "seller";
  const otherOnline =
    neg && role && now - (neg.presence?.[other] || 0) < 45000 && active;

  /* tell the other side we are looking at this right now */
  useEffect(() => {
    if (!open || !neg?.id || !role || !active) return;
    touchPresence(neg.id, role);
    const t = setInterval(() => touchPresence(neg.id, role), 20000);
    return () => clearInterval(t);
  }, [open, neg?.id, role, active]);

  /* opening the modal clears this person's unread flag */
  const unread = neg?.unread?.[role];
  useEffect(() => {
    if (open && neg?.id && role && unread) markRead(neg.id, role);
  }, [open, neg?.id, role, unread]);

  if (!open || typeof document === "undefined") return null;

  const run = async (fn) => {
    setBusy(true);
    setError("");
    try {
      return await fn();
    } catch (e) {
      setError(e?.message || "Something went wrong. Try again.");
    } finally {
      setBusy(false);
    }
  };
  const uid = user?.uid;
  const buyerName =
    user?.displayName ||
    [user?.firstName, user?.surname].filter(Boolean).join(" ") ||
    user?.email?.split("@")[0] ||
    "Student";
  const pay = () => onPay && onPay({ ...neg, id: neg.id });

  /* ── body ── */
  let body;
  if (loading) {
    body = (
      <p
        style={{
          textAlign: "center",
          color: "#aaa",
          fontSize: 13,
          padding: "30px 0",
        }}
      >
        Loading…
      </p>
    );
  } else if (!role) {
    body = (
      <p
        style={{
          textAlign: "center",
          color: "#888",
          fontSize: 13,
          padding: "30px 0",
        }}
      >
        This negotiation isn't available to your account.
      </p>
    );
  } else if (canCompose) {
    body = (
      <>
        {neg && <Timeline neg={neg} role={role} fmt={fmt} />}
        <ComposePanel
          draft={draft}
          th={th}
          fmt={fmt}
          busy={busy}
          onSubmit={(price) =>
            run(() =>
              submitOffer({ draft, buyer: { uid, name: buyerName }, price }),
            )
          }
        />
      </>
    );
  } else if (!neg) {
    body = (
      <p
        style={{
          textAlign: "center",
          color: "#888",
          fontSize: 13,
          padding: "30px 0",
        }}
      >
        This negotiation no longer exists.
      </p>
    );
  } else {
    let panel;
    if (status === "awaiting_seller" && role === "seller") {
      panel = (
        <SellerPanel
          neg={neg}
          th={th}
          fmt={fmt}
          busy={busy}
          onAccept={() => run(() => sellerAccept({ id: neg.id, uid }))}
          onCounter={(price) =>
            run(() => sellerCounter({ id: neg.id, uid, price }))
          }
          onDecline={() => run(() => sellerDecline({ id: neg.id, uid }))}
        />
      );
    } else if (status === "awaiting_buyer" && role === "buyer") {
      panel = (
        <BuyerReplyPanel
          neg={neg}
          th={th}
          fmt={fmt}
          busy={busy}
          now={now}
          onAccept={() =>
            run(async () => {
              await buyerAccept({ id: neg.id, uid });
              pay();
            })
          }
          onDecline={() => run(() => buyerDecline({ id: neg.id, uid }))}
        />
      );
    } else if (status === "agreed") {
      panel =
        role === "buyer" ? (
          <div
            style={{
              background: "#fff",
              border: "1.5px solid #16a34a",
              padding: 16,
            }}
          >
            <p style={{ ...label, color: "#16a34a", marginBottom: 4 }}>
              Your price is locked
            </p>
            <p
              style={{
                fontFamily: "'Playfair Display',serif",
                fontSize: 30,
                fontWeight: 800,
                color: NAVY,
                margin: "0 0 2px",
              }}
            >
              {fmt(neg.agreedPrice)}
            </p>
            <p style={{ fontSize: 12, color: "#888", margin: "0 0 14px" }}>
              {pctOff(neg.listPrice, neg.agreedPrice)}% off ·{" "}
              {timeLeft(neg.expiresAtMs - now)} left to pay
            </p>
            <button
              type="button"
              className="neg-btn"
              onClick={pay}
              style={solid("#16a34a")}
            >
              Pay {fmt(neg.agreedPrice)} now
            </button>
          </div>
        ) : (
          <div
            style={{
              background: "#fff",
              border: "1.5px solid #16a34a",
              padding: 16,
            }}
          >
            <p style={{ ...label, color: "#16a34a", marginBottom: 4 }}>
              Agreed — waiting for payment
            </p>
            <p
              style={{
                fontFamily: "'Playfair Display',serif",
                fontSize: 26,
                fontWeight: 800,
                color: NAVY,
                margin: "0 0 2px",
              }}
            >
              {fmt(neg.agreedPrice)}
            </p>
            <p style={{ fontSize: 12, color: "#888", margin: 0 }}>
              Locked for {neg.buyerName} for {timeLeft(neg.expiresAtMs - now)} ·
              you earn {fmt(neg.agreedPrice * PLATFORM_SHARE)}
            </p>
          </div>
        );
    } else if (active) {
      /* waiting on the other person */
      panel = (
        <div
          style={{
            background: "#fff",
            border: "0.5px solid #e5ddd0",
            padding: 16,
            textAlign: "center",
          }}
        >
          <Clock
            size={22}
            style={{ color: th.accent, margin: "0 auto 8px", display: "block" }}
          />
          <p
            style={{
              fontSize: 14,
              fontWeight: 700,
              color: NAVY,
              margin: "0 0 4px",
            }}
          >
            {role === "buyer"
              ? `Waiting for ${w.sellerLc}`
              : `Waiting for ${w.buyerLc}`}
          </p>
          <p
            style={{
              fontSize: 12,
              color: "#888",
              margin: "0 0 10px",
              lineHeight: 1.6,
            }}
          >
            {otherOnline
              ? "They're looking at this right now — this screen updates live."
              : "You'll get a notification the moment they reply. You can close this and come back."}
          </p>
          <p style={{ fontSize: 11, color: "#a16207", margin: 0 }}>
            Expires in {timeLeft(neg.expiresAtMs - now)}
          </p>
          {role === "buyer" && status === "awaiting_seller" && (
            <button
              type="button"
              className="neg-btn"
              disabled={busy}
              onClick={() => run(() => buyerWithdraw({ id: neg.id, uid }))}
              style={{ ...ghost, marginTop: 8 }}
            >
              Withdraw my request
            </button>
          )}
        </div>
      );
    } else {
      const msg =
        status === "purchased"
          ? "This document was purchased at the agreed price."
          : status === "expired"
            ? "This request expired. Nothing was charged."
            : status === "withdrawn"
              ? "This request was withdrawn."
              : "This request was declined.";
      panel = (
        <div
          style={{
            background: "#fff",
            border: "0.5px solid #e5ddd0",
            padding: 16,
            textAlign: "center",
          }}
        >
          <p
            style={{
              fontSize: 14,
              fontWeight: 700,
              color: NAVY,
              margin: "0 0 4px",
            }}
          >
            Closed
          </p>
          <p style={{ fontSize: 12, color: "#888", margin: 0 }}>{msg}</p>
          {role === "buyer" && reopen.reason === "cooldown" && (
            <p style={{ fontSize: 11, color: "#a16207", margin: "8px 0 0" }}>
              You can ask again in {timeLeft(reopen.waitMs)}.
            </p>
          )}
        </div>
      );
    }
    body = (
      <>
        <Timeline neg={neg} role={role} fmt={fmt} />
        {panel}
      </>
    );
  }

  const title = neg?.bookTitle || draft?.bookTitle || "Document";
  const list = neg?.listPrice ?? draft?.listPrice;
  const max = neg?.maxDiscountPercent ?? draft?.maxPct;

  return createPortal(
    <div className="neg-overlay" onClick={onClose}>
      <style>{css}</style>
      <div
        className="neg-panel"
        role="dialog"
        aria-modal="true"
        aria-label={th.label}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ background: NAVY, padding: "16px 20px", flexShrink: 0 }}>
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              gap: 12,
            }}
          >
            <div style={{ minWidth: 0 }}>
              <p style={{ ...label, color: GOLD, margin: "0 0 4px" }}>
                {th.icon} {th.label}
              </p>
              <p
                style={{
                  fontFamily: "'Playfair Display',serif",
                  fontSize: 17,
                  fontWeight: 700,
                  color: "#fff",
                  margin: 0,
                  lineHeight: 1.3,
                }}
              >
                {title}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              style={{
                width: 32,
                height: 32,
                border: "0.5px solid rgba(255,255,255,0.25)",
                background: "transparent",
                color: "rgba(255,255,255,0.7)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                flexShrink: 0,
              }}
            >
              <X size={16} />
            </button>
          </div>
          <div
            style={{
              display: "flex",
              gap: 18,
              marginTop: 12,
              fontSize: 11,
              color: "rgba(255,255,255,0.65)",
              flexWrap: "wrap",
              alignItems: "center",
            }}
          >
            {list ? (
              <span>
                Listed <strong style={{ color: "#fff" }}>{fmt(list)}</strong>
              </span>
            ) : null}
            {max ? (
              <span>
                Up to <strong style={{ color: "#fff" }}>{max}% off</strong>
              </span>
            ) : null}
            {otherOnline && (
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 5,
                  color: "#86efac",
                }}
              >
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: "#22c55e",
                    animation: "negPulse 1.8s infinite",
                  }}
                />
                {role === "seller" ? w.buyerThe : w.sellerThe} is online
              </span>
            )}
          </div>
        </div>

        <div className="neg-body">
          {error && (
            <div
              style={{
                background: "#fef2f2",
                border: "0.5px solid #fecaca",
                padding: "10px 12px",
                marginBottom: 12,
                fontSize: 12,
                color: "#dc2626",
              }}
            >
              {error}
            </div>
          )}
          {body}
        </div>
      </div>
    </div>,
    document.body,
  );
}
