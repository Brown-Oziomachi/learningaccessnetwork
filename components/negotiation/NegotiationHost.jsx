"use client";
import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebaseConfig";
import NegotiationModal, { NAVY, GOLD, THEMES } from "./NegotiationModal";
import {
  naira,
  effectiveStatus,
  needsReply,
  statusLabel,
  timeLeft,
  useMyNegotiations,
  useNow,
} from "@/lib/negotiation";

const EVENT = "lan:open-negotiation";

/** Call from anywhere (NotificationBell, a button, …) to open the modal. */
export function openNegotiation(negotiationId, draft = null) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent(EVENT, { detail: { negotiationId, draft } }),
  );
}

/**
 * Mount ONE of these per page (or once in a global client wrapper).
 * If two are mounted, only the first to mount responds, so it is safe either way.
 * `user` is optional: without it the host reads the signed-in user itself.
 */
export function NegotiationHost({ user: userProp, fmt = naira }) {
  const router = useRouter();
  const [authUser, setAuthUser] = useState(null);
  const [target, setTarget] = useState(null); // { negotiationId, draft }
  const me = useRef(Math.random().toString(36).slice(2));
  const user = userProp || authUser;

  useEffect(() => {
    if (userProp) return;
    return onAuthStateChanged(auth, (u) => setAuthUser(u));
  }, [userProp]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!window.__lanNegHost) window.__lanNegHost = me.current;
    const handler = (e) => {
      if (window.__lanNegHost !== me.current) return;
      setTarget({
        negotiationId: e.detail?.negotiationId || null,
        draft: e.detail?.draft || null,
      });
    };
    window.addEventListener(EVENT, handler);

    // deep link from a notification: ?negotiation=ID
    const params = new URLSearchParams(window.location.search);
    const fromUrl = params.get("negotiation");
    if (fromUrl && window.__lanNegHost === me.current) {
      setTarget({ negotiationId: fromUrl, draft: null });
      params.delete("negotiation");
      const qs = params.toString();
      window.history.replaceState(
        {},
        "",
        window.location.pathname + (qs ? `?${qs}` : ""),
      );
    }
    return () => {
      window.removeEventListener(EVENT, handler);
      if (window.__lanNegHost === me.current) window.__lanNegHost = null;
    };
  }, []);

  if (!target || !user) return null;
  return (
    <NegotiationModal
      open
      user={user}
      fmt={fmt}
      negotiationId={target.negotiationId}
      draft={target.draft}
      onClose={() => setTarget(null)}
      onPay={(n) => {
        setTarget(null);
        router.push(`/payment?bookId=${n.bookId}&negotiationId=${n.id}`);
      }}
    />
  );
}
export default NegotiationHost;

/* ─────────────────────  dashboard card (seller / faculty)  ─────────────────────
   Shows every negotiation the user is in, "needs your reply" first.            */
const TONES = {
  action: { bg: "#fef9c3", fg: "#a16207" },
  wait: { bg: "#eff6ff", fg: "#1d4ed8" },
  good: { bg: "#f0fdf4", fg: "#16a34a" },
  closed: { bg: "#f3f4f6", fg: "#6b7280" },
};

export function NegotiationInboxCard({ user, isFaculty = false, fmt = naira }) {
  const { items } = useMyNegotiations(user?.uid);
  const now = useNow(30000);
  const [showAll, setShowAll] = useState(false);
  const uid = user?.uid;

  const live = items.filter((n) =>
    ["awaiting_seller", "awaiting_buyer", "agreed"].includes(
      effectiveStatus(n, now),
    ),
  );
  const sorted = [...items].sort(
    (a, b) => Number(needsReply(b, uid, now)) - Number(needsReply(a, uid, now)),
  );
  const waiting = items.filter((n) => needsReply(n, uid, now)).length;
  const rows = showAll ? sorted : sorted.slice(0, 5);
  const title = isFaculty ? "Discount requests" : "Price negotiations";

  return (
    <div
      style={{
        background: "#fff",
        border: "0.5px solid #e5ddd0",
        padding: 20,
        minWidth: 0,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
          marginBottom: 14,
          gap: 8,
        }}
      >
        <div>
          <p
            style={{
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              color: GOLD,
              margin: "0 0 4px",
              fontFamily: "'Lato',sans-serif",
            }}
          >
            {isFaculty ? "Student discounts" : "Offers"}
          </p>
          <h3
            style={{
              fontFamily: "'Playfair Display',serif",
              fontSize: 18,
              fontWeight: 700,
              color: NAVY,
              margin: 0,
            }}
          >
            {title}
          </h3>
        </div>
        {waiting > 0 && (
          <span
            style={{
              background: "#dc2626",
              color: "#fff",
              fontSize: 11,
              fontWeight: 700,
              padding: "3px 9px",
              borderRadius: 99,
              fontFamily: "'Lato',sans-serif",
            }}
          >
            {waiting} need{waiting === 1 ? "s" : ""} you
          </span>
        )}
      </div>

      {items.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "26px 0",
            borderTop: "0.5px solid #f0ebe0",
          }}
        >
          <p
            style={{
              fontSize: 13,
              color: "#aaa",
              margin: 0,
              fontFamily: "'Lato',sans-serif",
            }}
          >
            {isFaculty ? "No discount requests yet." : "No offers yet."} They'll
            appear here and in your notifications.
          </p>
        </div>
      ) : (
        <>
          {rows.map((n) => {
            const lbl = statusLabel(n, uid, now);
            const tone = TONES[lbl.tone];
            const asSeller = n.sellerId === uid;
            const price = n.agreedPrice ?? n.counterPrice ?? n.offeredPrice;
            const st = effectiveStatus(n, now);
            const th = THEMES[n.mode] || THEMES.negotiate;
            return (
              <button
                key={n.id}
                type="button"
                onClick={() => openNegotiation(n.id)}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  textAlign: "left",
                  padding: "11px 12px",
                  marginBottom: 6,
                  background: needsReply(n, uid, now) ? "#fffdf6" : "#fff",
                  border: `0.5px solid ${needsReply(n, uid, now) ? GOLD : "#f0ebe0"}`,
                  borderLeft: `3px solid ${th.accent}`,
                  cursor: "pointer",
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p
                    style={{
                      margin: "0 0 2px",
                      fontSize: 12,
                      fontWeight: 700,
                      color: NAVY,
                      fontFamily: "'Lato',sans-serif",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {n.bookTitle}
                  </p>
                  <p
                    style={{
                      margin: 0,
                      fontSize: 10,
                      color: "#aaa",
                      fontFamily: "'Lato',sans-serif",
                    }}
                  >
                    {asSeller ? n.buyerName : n.sellerName}
                    {["awaiting_seller", "awaiting_buyer", "agreed"].includes(
                      st,
                    )
                      ? ` · ${timeLeft(n.expiresAtMs - now)} left`
                      : ""}
                  </p>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <p
                    style={{
                      margin: "0 0 3px",
                      fontSize: 12,
                      fontWeight: 700,
                      color: NAVY,
                      fontFamily: "'Lato',sans-serif",
                    }}
                  >
                    {fmt(price)}
                  </p>
                  <span
                    style={{
                      fontSize: 9,
                      fontWeight: 700,
                      padding: "2px 6px",
                      background: tone.bg,
                      color: tone.fg,
                      fontFamily: "'Lato',sans-serif",
                    }}
                  >
                    {lbl.text}
                  </span>
                </div>
              </button>
            );
          })}
          {sorted.length > 5 && (
            <button
              type="button"
              onClick={() => setShowAll((s) => !s)}
              style={{
                width: "100%",
                background: "transparent",
                border: "none",
                color: NAVY,
                fontSize: 11,
                fontWeight: 700,
                cursor: "pointer",
                padding: "8px 0 0",
                fontFamily: "'Lato',sans-serif",
              }}
            >
              {showAll ? "Show fewer" : `Show all ${sorted.length}`}
            </button>
          )}
          {live.length === 0 && (
            <p
              style={{
                fontSize: 11,
                color: "#aaa",
                margin: "8px 0 0",
                fontFamily: "'Lato',sans-serif",
              }}
            >
              Nothing open right now.
            </p>
          )}
        </>
      )}
    </div>
  );
}
