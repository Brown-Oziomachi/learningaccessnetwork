"use client";
import React from "react";
import { THEMES, NAVY } from "./NegotiationModal";
import { openNegotiation } from "./NegotiationHost";
import {
  naira,
  negId,
  pctOff,
  timeLeft,
  wordsFor,
  effectiveStatus,
  reopenState,
  useNegotiation,
  useNow,
} from "@/lib/negotiation";

/**
 * Shown on the book preview page.
 *  - lecturer / faculty listing  → green "student discount" ticket (never looks like haggling)
 *  - any other seller            → gold "negotiable" strip
 * Renders nothing for: free docs, owner's own doc, buyers who already own it, frozen docs.
 */
export default function BookNegotiationCard({
  book,
  bookId,
  settings,
  user,
  sellerName,
  fmt = naira,
  isPurchased = false,
  isFrozen = false,
  onPay,
  style = {},
}) {
  const uid = user?.uid;
  const id = uid && bookId ? negId(bookId, uid) : null;
  const { neg } = useNegotiation(id);
  const now = useNow(30000);

  if (
    !settings?.enabled ||
    !uid ||
    isPurchased ||
    isFrozen ||
    uid === settings.sellerId
  )
    return null;

  const mode = settings.mode;
  const th = THEMES[mode];
  const w = wordsFor(mode);
  const isDisc = mode === "discount";
  const st = effectiveStatus(neg, now);
  const reopen = reopenState(neg, now);

  const draft = {
    bookId,
    bookTitle: book?.title,
    listPrice: settings.listPrice,
    maxPct: settings.maxPct,
    mode,
    sellerId: settings.sellerId,
    sellerName: sellerName || book?.sellerName || "Seller",
    cover: book?.image || null,
  };
  const open = () => openNegotiation(id, draft);

  /* what to say and which button to show */
  let heading,
    sub,
    cta,
    onCta = open,
    highlight = false,
    primary = false;
  if (st === "agreed") {
    heading = `Your price is locked: ${fmt(neg.agreedPrice)}`;
    sub = `${pctOff(neg.listPrice, neg.agreedPrice)}% off · ${timeLeft(neg.expiresAtMs - now)} left to pay`;
    cta = `Pay ${fmt(neg.agreedPrice)}`;
    onCta = () => onPay && onPay(neg);
    primary = true;
    highlight = true;
  } else if (st === "awaiting_buyer") {
    heading = isDisc
      ? `${w.sellerThe} replied: ${pctOff(neg.listPrice, neg.counterPrice)}% off`
      : "The seller sent a final price";
    sub = `${fmt(neg.counterPrice)} · reply within ${timeLeft(neg.expiresAtMs - now)}`;
    cta = "Review reply";
    primary = true;
    highlight = true;
  } else if (st === "awaiting_seller") {
    heading = isDisc ? "Discount request sent" : "Offer sent";
    sub = `Waiting for ${w.sellerLc}. We'll notify you when they reply.`;
    cta = "View";
  } else if (!reopen.ok && reopen.reason === "cooldown") {
    heading = isDisc ? "Discount not available right now" : "Offer declined";
    sub = `You can ask again in ${timeLeft(reopen.waitMs)}.`;
    cta = "View";
  } else if (isDisc) {
    heading = "Student discount available";
    sub = `${w.sellerThe} offers students up to ${settings.maxPct}% off this document.`;
    cta = "Request discount";
    primary = true;
  } else {
    heading = "Price is negotiable";
    sub = `Make one offer, up to ${settings.maxPct}% below the listed price. ${w.sellerThe} can accept, decline or reply with a final price.`;
    cta = "Make an offer";
    primary = true;
  }

  return (
    <div
      style={{
        display: "flex",
        background: "#fff",
        margin: "12px 16px 0",
        border: `${isDisc ? "1.5px dashed" : "1.5px solid"} ${highlight ? th.accent : th.border}`,
        boxShadow: highlight ? `0 0 0 3px ${th.soft}` : "none",
        ...style,
      }}
    >
      {/* stub */}
      <div
        style={{
          background: th.accent,
          color: "#fff",
          minWidth: 78,
          padding: "10px 8px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        {isDisc ? (
          <>
            <span
              style={{
                fontFamily: "'Playfair Display',serif",
                fontSize: 24,
                fontWeight: 800,
                lineHeight: 1,
              }}
            >
              {settings.maxPct}%
            </span>
            <span
              style={{
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: "0.12em",
                marginTop: 3,
              }}
            >
              OFF
            </span>
          </>
        ) : (
          <>
            <span style={{ fontSize: 22, lineHeight: 1 }}>{th.icon}</span>
            <span
              style={{
                fontSize: 9,
                fontWeight: 700,
                marginTop: 4,
                textAlign: "center",
              }}
            >
              Negotiable
            </span>
          </>
        )}
      </div>
      {/* copy */}
      <div
        style={{
          flex: 1,
          minWidth: 0,
          padding: "12px 14px",
          display: "flex",
          alignItems: "center",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <div style={{ flex: "1 1 180px", minWidth: 0 }}>
          <p
            style={{
              margin: "0 0 2px",
              fontSize: 13,
              fontWeight: 700,
              color: NAVY,
              fontFamily: "'Lato',sans-serif",
            }}
          >
            {heading}
          </p>
          <p
            style={{
              margin: 0,
              fontSize: 11,
              color: "#888",
              lineHeight: 1.55,
              fontFamily: "'Lato',sans-serif",
            }}
          >
            {sub}
          </p>
        </div>
        <button
          type="button"
          onClick={onCta}
          style={{
            background: primary ? th.accent : "#fff",
            color: primary ? "#fff" : th.accent,
            border: `1px solid ${th.accent}`,
            padding: "9px 16px",
            fontSize: 11,
            fontWeight: 700,
            cursor: "pointer",
            fontFamily: "'Lato',sans-serif",
            letterSpacing: "0.04em",
            whiteSpace: "nowrap",
          }}
        >
          {cta}
        </button>
      </div>
    </div>
  );
}
