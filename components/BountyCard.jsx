"use client";

import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { db } from "@/lib/firebaseConfig";
import {
  incrementProposals,
  claimBountyWithNotification,
} from "@/lib/bountyService";

/* ─── Brand tokens ──────────────────────────────────────────── */
const NAVY  = "#0d2244";
const GOLD  = "#b8963e";
const GOLDD = "#d4aa5a";
const CREAM = "#f5f0e8";
const BG    = "#f5f1ea";

/* ─── Currency map (all African currencies LAN supports) ────── */
const CURRENCY_DISPLAY = {
  NGN: { symbol: "₦",    flag: "🇳🇬", name: "Nigerian Naira"        },
  GHS: { symbol: "GH₵",  flag: "🇬🇭", name: "Ghanaian Cedi"         },
  KES: { symbol: "KSh",  flag: "🇰🇪", name: "Kenyan Shilling"       },
  UGX: { symbol: "USh",  flag: "🇺🇬", name: "Ugandan Shilling"      },
  TZS: { symbol: "TSh",  flag: "🇹🇿", name: "Tanzanian Shilling"    },
  ZAR: { symbol: "R",    flag: "🇿🇦", name: "South African Rand"    },
  XOF: { symbol: "CFA",  flag: "🌍",  name: "West African CFA"      },
  XAF: { symbol: "CFA",  flag: "🌍",  name: "Central African CFA"   },
  EGP: { symbol: "E£",   flag: "🇪🇬", name: "Egyptian Pound"        },
  MAD: { symbol: "DH",   flag: "🇲🇦", name: "Moroccan Dirham"       },
  ETB: { symbol: "Br",   flag: "🇪🇹", name: "Ethiopian Birr"        },
  ZMW: { symbol: "ZK",   flag: "🇿🇲", name: "Zambian Kwacha"        },
  RWF: { symbol: "RF",   flag: "🇷🇼", name: "Rwandan Franc"         },
  MWK: { symbol: "MK",   flag: "🇲🇼", name: "Malawian Kwacha"       },
  BWP: { symbol: "P",    flag: "🇧🇼", name: "Botswana Pula"         },
  NAD: { symbol: "N$",   flag: "🇳🇦", name: "Namibian Dollar"       },
  CDF: { symbol: "FC",   flag: "🇨🇩", name: "Congolese Franc"       },
};

/* NGN-based rates: 1 NGN = X units of currency */
const NGN_RATES = {
  NGN: 1,
  GHS: 0.010,
  KES: 0.11,
  UGX: 2.85,
  TZS: 2.62,
  RWF: 1.38,
  ZMW: 0.028,
  MWK: 1.77,
  EGP: 0.051,
  MAD: 0.105,
  ZAR: 0.019,
  XOF: 0.656,
  XAF: 0.656,
  ETB: 0.057,
  BWP: 0.014,
  NAD: 0.019,
  CDF: 2.85,
};

function convertFromNGN(ngnAmt, toCurrency) {
  const rate = NGN_RATES[toCurrency] ?? 1;
  return ngnAmt * rate;
}

function fmtAmt(amount, currency) {
  const big = ["UGX","RWF","TZS","XOF","XAF","MWK","CDF","GNF"].includes(currency);
  return big
    ? Math.round(amount).toLocaleString()
    : Math.round(amount).toLocaleString();
}

/* ─── Helpers ───────────────────────────────────────────────── */
function getTier(r) {
  if (r >= 50000) return { name: "Platinum", color: "#e2e8f0", bg: "rgba(226,232,240,.12)", emoji: "💎" };
  if (r >= 20000) return { name: "Gold",     color: GOLD,      bg: "rgba(184,150,62,.12)",  emoji: "🥇" };
  if (r >= 5000)  return { name: "Silver",   color: "#94a3b8", bg: "rgba(148,163,184,.12)", emoji: "🥈" };
  return                  { name: "Bronze",  color: "#cd7f32", bg: "rgba(205,127,50,.12)",  emoji: "🥉" };
}

function getDeadlineInfo(deadline) {
  if (!deadline) return { label: "Open deadline", color: "#94a3b8" };
  const d    = deadline?.toDate ? deadline.toDate() : new Date(deadline);
  const diff = d - Date.now();
  if (diff <= 0) return { label: "Expired", color: "#ef4444" };
  const days  = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  if (days === 0 && hours < 6) return { label: `${hours}h left ⚡`, color: "#ef4444" };
  if (days === 0)              return { label: `${hours}h left`,    color: "#f59e0b" };
  if (days <= 2)               return { label: `${days}d ${hours}h left`, color: "#f59e0b" };
  return                              { label: `${days}d left`,     color: "#16a34a" };
}

function timeAgo(d) {
  const s = (Date.now() - (d instanceof Date ? d : new Date(d))) / 1000;
  if (s < 60)    return "just now";
  if (s < 3600)  return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

function Avatar({ name = "?", size = 24 }) {
  const initials = name.split(" ").map(n => n[0] || "").slice(0, 2).join("").toUpperCase() || "?";
  const hue = [...name].reduce((a, c) => a + c.charCodeAt(0), 0) % 360;
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      background: `hsl(${hue},42%,22%)`, border: `1.5px solid hsl(${hue},50%,38%)`,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size * 0.33, fontWeight: 900, color: `hsl(${hue},70%,80%)`,
      fontFamily: "'Lato',sans-serif", flexShrink: 0,
    }}>
      {initials}
    </div>
  );
}

function TierBadge({ reward }) {
  const t = getTier(reward || 0);
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      background: t.bg, border: `0.5px solid ${t.color}44`,
      padding: "3px 9px", fontSize: 9, fontWeight: 700, color: t.color,
      fontFamily: "'Lato',sans-serif", letterSpacing: "0.11em", textTransform: "uppercase",
    }}>
      {t.emoji} {t.name}
    </span>
  );
}

function ListIcon({ color = "#999" }) {
  return (
    <svg width="15" height="12" viewBox="0 0 18 12" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round">
      <line x1="0" y1="1"  x2="18" y2="1"  />
      <line x1="0" y1="6"  x2="18" y2="6"  />
      <line x1="0" y1="11" x2="18" y2="11" />
    </svg>
  );
}

/* ══════════════════════════════════════════════════════════
   CURRENCY PICKER PANEL
══════════════════════════════════════════════════════════ */
function CurrencyPickerPanel({ currentCurrency, onSelect, onClose }) {
  const currencies = Object.entries(CURRENCY_DISPLAY);
  return createPortal(
    <div onClick={onClose} style={{
      position: "fixed", inset: 0, background: "rgba(7,19,31,.7)",
      zIndex: 1400, display: "flex", alignItems: "center", justifyContent: "center",
      padding: 24, backdropFilter: "blur(4px)",
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: "#fff", maxWidth: 420, width: "100%",
        border: "0.5px solid #e5ddd0",
        animation: "fadeUp .25s cubic-bezier(.4,0,.2,1) both",
        maxHeight: "80vh", display: "flex", flexDirection: "column",
      }}>
        {/* Header */}
        <div style={{ background: NAVY, padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
          <div>
            <p style={{ fontSize: 9, color: GOLD, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", fontFamily: "'Lato',sans-serif", margin: "0 0 3px" }}>
              Display Currency
            </p>
            <p style={{ fontFamily: "'Playfair Display',serif", fontSize: 16, fontWeight: 700, color: "#fff", margin: 0 }}>
              Choose Your Currency
            </p>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "rgba(255,255,255,.4)", fontSize: 22, cursor: "pointer" }}>×</button>
        </div>

        {/* Info note */}
        <div style={{ padding: "10px 16px", background: "rgba(184,150,62,.07)", borderBottom: "0.5px solid rgba(184,150,62,.15)", flexShrink: 0 }}>
          <p style={{ fontSize: 11, color: "#a16207", fontFamily: "'Lato',sans-serif", margin: 0, lineHeight: 1.6 }}>
            Amounts are approximate conversions from NGN using estimated exchange rates.
          </p>
        </div>

        {/* Currency grid */}
        <div style={{ overflowY: "auto", padding: "10px 12px 16px", flex: 1 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {currencies.map(([code, info]) => {
              const isActive = code === currentCurrency;
              return (
                <button key={code} onClick={() => { onSelect(code); onClose(); }}
                  style={{
                    display: "flex", alignItems: "center", gap: 10,
                    padding: "11px 13px", border: `1.5px solid ${isActive ? GOLD : "#e5ddd0"}`,
                    background: isActive ? CREAM : "#fff",
                    cursor: "pointer", textAlign: "left", transition: "all .15s",
                    fontFamily: "'Lato',sans-serif",
                  }}
                  onMouseEnter={e => { if (!isActive) { e.currentTarget.style.borderColor = GOLD; e.currentTarget.style.background = "#fdf9f0"; } }}
                  onMouseLeave={e => { if (!isActive) { e.currentTarget.style.borderColor = "#e5ddd0"; e.currentTarget.style.background = "#fff"; } }}>
                  <span style={{ fontSize: 20, lineHeight: 1, flexShrink: 0 }}>{info.flag}</span>
                  <div style={{ minWidth: 0 }}>
                    <p style={{ fontSize: 12, fontWeight: 700, color: isActive ? GOLD : NAVY, margin: 0, fontFamily: "'Lato',sans-serif" }}>
                      {info.symbol} {code}
                    </p>
                    <p style={{ fontSize: 9, color: "#aaa", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {info.name}
                    </p>
                  </div>
                  {isActive && (
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={GOLD} strokeWidth="2.5" style={{ flexShrink: 0, marginLeft: "auto" }}>
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

/* ══════════════════════════════════════════════════════════
   BID MODAL
══════════════════════════════════════════════════════════ */
function BidModal({ bounty, user, onClose, viewCurrency }) {
  const [submitted, setSubmitted] = useState(false);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState("");

  /* Always show NGN in the bid modal — that's the real escrow amount */
  const payoutNGN = Math.round((bounty.reward || 0) * 0.8);

  /* Also show local currency if viewer has one set */
  const currInfo    = CURRENCY_DISPLAY[viewCurrency] || CURRENCY_DISPLAY.NGN;
  const isNGNView   = viewCurrency === "NGN";
  const localPayout = isNGNView ? null : convertFromNGN(payoutNGN, viewCurrency);
  const localReward = isNGNView ? null : convertFromNGN(bounty.reward || 0, viewCurrency);

  const slotsPct = Math.min(100, ((bounty.proposals || 0) / (bounty.maxProposals || 10)) * 100);
  const slotsLeft = Math.max(0, (bounty.maxProposals || 10) - (bounty.proposals || 0));
  const dlInfo = getDeadlineInfo(bounty.deadline);
  const isExpired = dlInfo.label === "Expired";


  const handleClaim = async () => {
    setLoading(true); setError("");
    try {
      await incrementProposals(bounty.id);
      await claimBountyWithNotification(bounty.id, user.uid, user);
      setSubmitted(true);
    } catch (e) {
      if (e.message === "ALREADY_BID")           setError("You already bid on this bounty.");
      else if (e.message === "BOUNTY_PENDING_APPROVAL") setError("Someone already submitted — under review.");
      else if (e.message === "BOUNTY_FULFILLED")  setError("This bounty has already been fulfilled.");
      else if (e.message === "BOUNTY_NOT_FOUND")  setError("This bounty no longer exists.");
      else setError(`Could not place bid: ${e.message}`);
    } finally { setLoading(false); }
  };

  return createPortal(
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(7,19,31,.78)",
        zIndex: 1300,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        backdropFilter: "blur(4px)",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#fff",
          maxWidth: 500,
          width: "100%",
          border: "0.5px solid #e5ddd0",
          animation: "fadeUp .32s cubic-bezier(.4,0,.2,1) both",
          maxHeight: "92vh",
          overflowY: "auto",
        }}
      >
        {submitted ? (
          <div style={{ padding: "48px 32px", textAlign: "center" }}>
            <div style={{ fontSize: 60, marginBottom: 16 }}>🎉</div>
            <h3
              style={{
                fontFamily: "'Playfair Display',serif",
                fontSize: 24,
                fontWeight: 700,
                color: NAVY,
                marginBottom: 10,
              }}
            >
              Bid Placed!
            </h3>
            <p
              style={{
                fontSize: 13,
                color: "#888",
                fontFamily: "'Lato',sans-serif",
                lineHeight: 1.75,
                marginBottom: 8,
              }}
            >
              Upload the material to fulfil it and unlock:
            </p>
            <p
              style={{
                fontFamily: "'Playfair Display',serif",
                fontSize: 28,
                fontWeight: 700,
                color: "#16a34a",
                marginBottom: 4,
              }}
            >
              ₦{payoutNGN.toLocaleString("en-NG")}
            </p>
            {!isNGNView && (
              <p
                style={{
                  fontSize: 13,
                  color: "#aaa",
                  fontFamily: "'Lato',sans-serif",
                  marginBottom: 20,
                }}
              >
                ≈ {currInfo.symbol}
                {fmtAmt(localPayout, viewCurrency)} {viewCurrency}
              </p>
            )}
            <div
              style={{
                padding: "12px 16px",
                background: "rgba(13,34,68,.04)",
                border: ".5px solid rgba(13,34,68,.12)",
                marginBottom: 24,
                textAlign: "left",
              }}
            >
              <p
                style={{
                  fontSize: 11,
                  color: "#555",
                  fontFamily: "'Lato',sans-serif",
                  margin: 0,
                  lineHeight: 1.7,
                }}
              >
                ⚡{" "}
                <strong>
                  First to submit a valid document wins the full reward.
                </strong>{" "}
                Upload your material now before someone else does.
              </p>
            </div>
            <a
              href="/library/publish"
              style={{
                display: "block",
                padding: "14px",
                background: GOLD,
                color: NAVY,
                textDecoration: "none",
                fontSize: 12,
                fontWeight: 700,
                fontFamily: "'Lato',sans-serif",
                textAlign: "center",
                letterSpacing: "0.09em",
                textTransform: "uppercase",
                marginBottom: 10,
              }}
            >
              📤 Upload Your Material Now →
            </a>
            <button
              onClick={onClose}
              style={{
                padding: "11px",
                background: "transparent",
                border: "0.5px solid #e5ddd0",
                fontSize: 12,
                color: "#888",
                cursor: "pointer",
                fontFamily: "'Lato',sans-serif",
                width: "100%",
              }}
            >
              Upload Later
            </button>
          </div>
        ) : (
          <>
            {/* Modal header */}
            <div
              style={{
                background: NAVY,
                backgroundImage:
                  "radial-gradient(rgba(184,150,62,.07) 1px,transparent 1px)",
                backgroundSize: "20px 20px",
                padding: "22px 24px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  justifyContent: "space-between",
                }}
              >
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      display: "flex",
                      gap: 7,
                      marginBottom: 10,
                      flexWrap: "wrap",
                    }}
                  >
                    <TierBadge reward={bounty.reward} />
                    {bounty.university && (
                      <span
                        style={{
                          background: "rgba(184,150,62,.14)",
                          border: "0.5px solid rgba(184,150,62,.3)",
                          color: GOLDD,
                          fontSize: 9,
                          fontWeight: 700,
                          padding: "3px 10px",
                          fontFamily: "'Lato',sans-serif",
                          letterSpacing: "0.1em",
                          textTransform: "uppercase",
                        }}
                      >
                        {bounty.university}
                      </span>
                    )}
                  </div>
                  <h3
                    style={{
                      fontFamily: "'Playfair Display',serif",
                      fontSize: 18,
                      fontWeight: 700,
                      color: "#fff",
                      lineHeight: 1.3,
                      margin: "0 0 4px",
                      maxWidth: 360,
                    }}
                  >
                    {bounty.title}
                  </h3>
                  {bounty.department && (
                    <p
                      style={{
                        fontSize: 11,
                        color: "rgba(184,150,62,.6)",
                        margin: 0,
                        fontFamily: "'Lato',sans-serif",
                      }}
                    >
                      {bounty.department}
                    </p>
                  )}
                </div>
                <button
                  onClick={onClose}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "rgba(255,255,255,.4)",
                    fontSize: 24,
                    lineHeight: 1,
                    marginLeft: 12,
                  }}
                >
                  ×
                </button>
              </div>
            </div>

            <div style={{ padding: 24 }}>
              {/* Payout boxes */}
              <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
                <div
                  style={{
                    flex: 1,
                    background: CREAM,
                    border: `1.5px solid ${GOLD}44`,
                    padding: "14px 16px",
                  }}
                >
                  <div
                    style={{
                      fontSize: 9,
                      fontWeight: 700,
                      letterSpacing: "0.14em",
                      textTransform: "uppercase",
                      color: "#aaa",
                      fontFamily: "'Lato',sans-serif",
                      marginBottom: 4,
                    }}
                  >
                    Your Payout (80%)
                  </div>
                  <div
                    style={{
                      fontFamily: "'Playfair Display',serif",
                      fontSize: 30,
                      fontWeight: 700,
                      color: NAVY,
                      lineHeight: 1,
                    }}
                  >
                    <span
                      style={{ fontSize: 13, color: GOLD, fontWeight: 700 }}
                    >
                      ₦
                    </span>
                    {fmtAmt(payoutNGN, "NGN")}
                  </div>
                  {!isNGNView && (
                    <div
                      style={{
                        fontSize: 10,
                        color: "#aaa",
                        fontFamily: "'Lato',sans-serif",
                        marginTop: 3,
                      }}
                    >
                      ≈ {currInfo.symbol}
                      {fmtAmt(localPayout, viewCurrency)} {viewCurrency}
                    </div>
                  )}
                </div>
                <div
                  style={{
                    flex: 1,
                    background: "rgba(13,34,68,.04)",
                    border: "0.5px solid #e5ddd0",
                    padding: "14px 16px",
                  }}
                >
                  <div
                    style={{
                      fontSize: 9,
                      fontWeight: 700,
                      letterSpacing: "0.14em",
                      textTransform: "uppercase",
                      color: "#aaa",
                      fontFamily: "'Lato',sans-serif",
                      marginBottom: 4,
                    }}
                  >
                    Full Bounty
                  </div>
                  <div
                    style={{
                      fontFamily: "'Playfair Display',serif",
                      fontSize: 30,
                      fontWeight: 700,
                      color: "#ccc",
                      lineHeight: 1,
                    }}
                  >
                    <span
                      style={{ fontSize: 13, color: "#ddd", fontWeight: 700 }}
                    >
                      ₦
                    </span>
                    {fmtAmt(Number(bounty.reward), "NGN")}
                  </div>
                  {!isNGNView && (
                    <div
                      style={{
                        fontSize: 10,
                        color: "#ccc",
                        fontFamily: "'Lato',sans-serif",
                        marginTop: 3,
                      }}
                    >
                      ≈ {currInfo.symbol}
                      {fmtAmt(localReward, viewCurrency)} {viewCurrency}
                    </div>
                  )}
                </div>
              </div>

              {/* Meta */}
              <div
                style={{
                  display: "flex",
                  gap: 14,
                  flexWrap: "wrap",
                  marginBottom: 14,
                  alignItems: "center",
                }}
              >
                {bounty.deadline && (
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      color: dlInfo.color,
                      fontFamily: "'Lato',sans-serif",
                    }}
                  >
                    ⏱ {dlInfo.label}
                  </span>
                )}
                {bounty.postedBy && (
                  <span
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 5,
                      fontSize: 10,
                      color: "#888",
                      fontFamily: "'Lato',sans-serif",
                    }}
                  >
                    <Avatar name={bounty.postedBy} size={16} /> Posted by{" "}
                    <strong style={{ color: NAVY, marginLeft: 2 }}>
                      {bounty.postedBy}
                    </strong>
                  </span>
                )}
              </div>

              {/* Slots */}
              <div style={{ marginBottom: 18 }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: 5,
                  }}
                >
                  <span
                    style={{
                      fontSize: 10,
                      color: "#aaa",
                      fontFamily: "'Lato',sans-serif",
                    }}
                  >
                    {bounty.proposals || 0}/{bounty.maxProposals || 10} slots
                    taken
                  </span>
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      color: slotsLeft <= 2 ? "#ef4444" : GOLD,
                      fontFamily: "'Lato',sans-serif",
                    }}
                  >
                    {slotsLeft} left
                  </span>
                </div>
                <div style={{ height: 4, background: "#e5ddd0" }}>
                  <div
                    style={{
                      height: "100%",
                      width: `${slotsPct}%`,
                      background: slotsPct > 80 ? "#ef4444" : GOLD,
                      transition: "width .5s",
                    }}
                  />
                </div>
              </div>

              {/* Escrow note */}
              <div
                style={{
                  background: "rgba(13,34,68,.04)",
                  border: "0.5px solid rgba(13,34,68,.1)",
                  padding: "11px 14px",
                  marginBottom: 16,
                  display: "flex",
                  gap: 8,
                }}
              >
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke={NAVY}
                  strokeWidth="2"
                  style={{ flexShrink: 0, marginTop: 1 }}
                >
                  <rect x="3" y="11" width="18" height="11" rx="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                <p
                  style={{
                    fontSize: 11,
                    color: "#555",
                    fontFamily: "'Lato',sans-serif",
                    margin: 0,
                    lineHeight: 1.65,
                  }}
                >
                  Reward held in escrow. Released when the student approves your
                  upload.{" "}
                  <strong>The requester will be notified of your bid.</strong>
                </p>
              </div>

              {error && (
                <div
                  style={{
                    padding: "11px 14px",
                    background: "rgba(220,38,38,.06)",
                    border: "0.5px solid rgba(220,38,38,.25)",
                    color: "#dc2626",
                    fontSize: 12,
                    fontFamily: "'Lato',sans-serif",
                    marginBottom: 14,
                  }}
                >
                  {error}
                </div>
              )}

              <button
                onClick={handleClaim}
                disabled={loading}
                style={{
                  width: "100%",
                  padding: "14px 20px",
                  background: loading ? "#ccc" : GOLD,
                  color: NAVY,
                  border: "none",
                  fontSize: 12,
                  fontWeight: 700,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  cursor: loading ? "not-allowed" : "pointer",
                  fontFamily: "'Lato',sans-serif",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  transition: "background .18s",
                }}
                onMouseEnter={(e) => {
                  if (!loading) e.currentTarget.style.background = GOLDD;
                }}
                onMouseLeave={(e) => {
                  if (!loading) e.currentTarget.style.background = GOLD;
                }}
              >
                {loading ? (
                  <>
                    <span
                      style={{
                        width: 14,
                        height: 14,
                        border: "2px solid rgba(13,34,68,.25)",
                        borderTopColor: NAVY,
                        borderRadius: "50%",
                        display: "inline-block",
                        animation: "spin .7s linear infinite",
                      }}
                    />
                    Claiming…
                  </>
                ) : (
                  <>
                    <svg
                      width="13"
                      height="13"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke={NAVY}
                      strokeWidth="2.5"
                    >
                      <path d="M22 2L11 13" />
                      <path d="M22 2L15 22 11 13 2 9l20-7z" />
                    </svg>
                    Claim &amp; Earn ₦{fmtAmt(payoutNGN, "NGN")}
                  </>
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>,
    document.body,
  );
}

/* ══════════════════════════════════════════════════════════
   BIDDERS PANEL
══════════════════════════════════════════════════════════ */
function BiddersPanel({ bounty, onClose }) {
  const claimedUids =
    Array.isArray(bounty.claimedBy) && bounty.claimedBy.length > 0
      ? bounty.claimedBy
      : Object.keys(bounty.bidderNames || {});
  const bidders = claimedUids.map(uid => ({ uid, name: bounty.bidderNames?.[uid] || "Unknown" }));

  return createPortal(
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(7,19,31,.6)", zIndex: 1300, display: "flex", alignItems: "center", justifyContent: "center", padding: 24, backdropFilter: "blur(4px)" }}>
      <div onClick={e => e.stopPropagation()} style={{ background: "#fff", maxWidth: 420, width: "100%", border: "0.5px solid #e5ddd0", animation: "fadeUp .28s both" }}>
        <div style={{ background: NAVY, padding: "18px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <p style={{ fontSize: 9, color: GOLD, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", fontFamily: "'Lato',sans-serif", margin: "0 0 3px" }}>Proposals</p>
            <p style={{ fontFamily: "'Playfair Display',serif", fontSize: 16, fontWeight: 700, color: "#fff", margin: 0 }}>Bidders ({bidders.length})</p>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "rgba(255,255,255,.4)", fontSize: 22, cursor: "pointer" }}>×</button>
        </div>
        <div style={{ maxHeight: 380, overflowY: "auto" }}>
          {bidders.length === 0 ? (
            <div style={{ padding: "40px 20px", textAlign: "center", color: "#aaa", fontFamily: "'Lato',sans-serif", fontSize: 13 }}>No bidders yet</div>
          ) : (
            [...bidders].sort((a, b) => {
              if (a.uid === bounty.fulfilledByUid) return -1;
              if (b.uid === bounty.fulfilledByUid) return 1;
              return 0;
            }).map((b, i) => {
              const isFulfiller = b.uid === bounty.fulfilledByUid && bounty.status === "fulfilled";
              const isDisputed  = bounty.disputes?.[b.uid];
              return (
                <div
                  key={b.uid || i}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "13px 18px",
                    borderBottom: "0.5px solid #f0ebe0",
                    background: isFulfiller ? "rgba(22,163,74,.03)" : "#fff",
                  }}
                >
                  <Avatar name={b.name || "?"} size={34} />
                  <div style={{ flex: 1 }}>
                    <p
                      style={{
                        fontSize: 13,
                        fontWeight: 700,
                        color: NAVY,
                        margin: "0 0 2px",
                        fontFamily: "'Lato',sans-serif",
                      }}
                    >
                      {b.name || "Unknown"}
                    </p>
                    <p
                      style={{
                        fontSize: 10,
                        color: "#aaa",
                        margin: 0,
                        fontFamily: "'Lato',sans-serif",
                      }}
                    >
                      {isFulfiller
                        ? `Won ₦${fmtAmt(Math.round((bounty.reward || 0) * 0.8), "NGN")}` : bounty.status === "fulfilled"
                          ? "Did not win"
                          : "Bid placed"}
                    </p>
                  </div>
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      padding: "4px 10px",
                      fontFamily: "'Lato',sans-serif",
                      letterSpacing: "0.06em",
                      background: isFulfiller
                        ? "rgba(22,163,74,.1)"
                        : isDisputed
                          ? "rgba(220,38,38,.08)"
                          : "rgba(184,150,62,.1)",
                      color: isFulfiller
                        ? "#16a34a"
                        : isDisputed
                          ? "#dc2626"
                          : "#b8963e",
                      border: `0.5px solid ${isFulfiller ? "rgba(22,163,74,.3)" : isDisputed ? "rgba(220,38,38,.25)" : "rgba(184,150,62,.3)"}`,
                    }}
                  >
                    {isFulfiller
                      ? "✅ Fulfilled"
                      : isDisputed
                        ? "🚩 Disputed"
                        : bounty.status === "fulfilled"
                          ? "Not selected"
                          : "🟡 Claimed"}
                  </span>
                </div>
              );
            })
          )}
        </div>
        <div style={{ padding: "12px 18px", borderTop: "0.5px solid #f0ebe0" }}>
          <button onClick={onClose} style={{ width: "100%", padding: "11px", background: NAVY, color: "#fff", border: "none", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "'Lato',sans-serif" }}>Close</button>
        </div>
      </div>
    </div>,
    document.body
  );
}

/* ══════════════════════════════════════════════════════════
   TRACK PANEL  (owner only)
══════════════════════════════════════════════════════════ */
function TrackPanel({ bounty, onClose, viewCurrency }) {
  const currInfo = CURRENCY_DISPLAY[viewCurrency] || CURRENCY_DISPLAY.NGN;
  const isNGN = viewCurrency === "NGN";
  const fmt = (n) => isNGN ? `₦${Math.round(n).toLocaleString()}` : `${currInfo.symbol}${fmtAmt(convertFromNGN(n, viewCurrency), viewCurrency)}`;
  const dlInfo = getDeadlineInfo(bounty.deadline);
  return createPortal(
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(7,19,31,.6)", zIndex: 1300, display: "flex", alignItems: "center", justifyContent: "center", padding: 24, backdropFilter: "blur(4px)" }}>
      <div onClick={e => e.stopPropagation()} style={{ background: "#fff", maxWidth: 360, width: "100%", border: "0.5px solid #e5ddd0", animation: "fadeUp .28s both" }}>
        <div style={{ background: NAVY, padding: "18px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <p style={{ fontSize: 9, color: GOLD, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", fontFamily: "'Lato',sans-serif", margin: "0 0 3px" }}>Your Bounty</p>
            <p style={{ fontFamily: "'Playfair Display',serif", fontSize: 16, fontWeight: 700, color: "#fff", margin: 0 }}>Track Status</p>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "rgba(255,255,255,.4)", fontSize: 22, cursor: "pointer" }}>×</button>
        </div>
        <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 0 }}>
          {[
            ["Status",          bounty.status === "fulfilled" ? "✅ Fulfilled" : bounty.status === "pending_approval" ? "⏳ Under Review" : "🟢 Open"],
            ["Time left",       dlInfo.label],
            ["Escrowed",        fmt(bounty.reward)],
            ["Proposals",       String(bounty.proposals || 0)],
            ["Author earns (80%)", fmt((bounty.reward || 0) * 0.8)],
          ].map(([k, v]) => (
            <div key={k} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "12px 0", borderBottom: "0.5px solid #f0ebe0" }}>
              <span style={{ color: "#888", fontFamily: "'Lato',sans-serif" }}>{k}</span>
              <span style={{ fontWeight: 700, color: NAVY, fontFamily: "'Lato',sans-serif" }}>{v}</span>
            </div>
          ))}
          <button onClick={onClose} style={{ width: "100%", marginTop: 16, padding: "12px", background: NAVY, color: "#fff", border: "none", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "'Lato',sans-serif" }}>Close</button>
        </div>
      </div>
    </div>,
    document.body
  );
}

/* ══════════════════════════════════════════════════════════
   EDIT PANEL  (owner only)
══════════════════════════════════════════════════════════ */
function EditPanel({ bounty, onClose }) {
  const [form,   setForm]   = useState({ title: bounty.title || "", tags: (bounty.tags || []).join(", ") });
  const [saving, setSaving] = useState(false);
  const inp = { padding: "10px 12px", border: "0.5px solid #e5ddd0", fontSize: 13, fontFamily: "'Lato',sans-serif", outline: "none", width: "100%", background: BG, color: NAVY, boxSizing: "border-box" };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { updateDoc, doc: fd } = await import("firebase/firestore");
      const tags = form.tags ? form.tags.split(",").map(t => t.trim()).filter(Boolean) : [];
      await updateDoc(fd(db, "bounties", bounty.id), { title: form.title, tags });
      onClose();
    } catch (e) { alert("Failed to save: " + e.message); }
    finally { setSaving(false); }
  };

  return createPortal(
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(7,19,31,.6)", zIndex: 1300, display: "flex", alignItems: "center", justifyContent: "center", padding: 24, backdropFilter: "blur(4px)" }}>
      <div onClick={e => e.stopPropagation()} style={{ background: "#fff", maxWidth: 440, width: "100%", border: "0.5px solid #e5ddd0", animation: "fadeUp .28s both" }}>
        <div style={{ background: NAVY, padding: "18px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <p style={{ fontSize: 9, color: GOLD, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", fontFamily: "'Lato',sans-serif", margin: "0 0 3px" }}>Edit</p>
            <p style={{ fontFamily: "'Playfair Display',serif", fontSize: 16, fontWeight: 700, color: "#fff", margin: 0 }}>Update Bounty</p>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "rgba(255,255,255,.4)", fontSize: 22, cursor: "pointer" }}>×</button>
        </div>
        <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ padding: "10px 14px", background: "rgba(184,150,62,.07)", border: "0.5px solid rgba(184,150,62,.25)", fontSize: 12, color: "#a16207", fontFamily: "'Lato',sans-serif", lineHeight: 1.65 }}>
            Only description and tags can be edited after posting.
          </div>
          <div>
            <label style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#aaa", fontFamily: "'Lato',sans-serif", display: "block", marginBottom: 6 }}>Description</label>
            <textarea value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} rows={3} style={{ ...inp, resize: "vertical", lineHeight: 1.6 }} />
          </div>
          <div>
            <label style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#aaa", fontFamily: "'Lato',sans-serif", display: "block", marginBottom: 6 }}>Tags (comma-separated)</label>
            <input value={form.tags} onChange={e => setForm(p => ({ ...p, tags: e.target.value }))} style={inp} placeholder="e.g. Past Questions, Maths" />
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={onClose} style={{ flex: 1, padding: "12px", background: "#f5f5f5", color: "#666", border: "0.5px solid #e5ddd0", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "'Lato',sans-serif" }}>Cancel</button>
            <button onClick={handleSave} disabled={saving} style={{ flex: 1, padding: "12px", background: saving ? "#ccc" : GOLD, color: NAVY, border: "none", fontSize: 12, fontWeight: 700, cursor: saving ? "not-allowed" : "pointer", fontFamily: "'Lato',sans-serif" }}>
              {saving ? "Saving…" : "Save Changes"}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

/* ══════════════════════════════════════════════════════════
   SHARE PANEL
══════════════════════════════════════════════════════════ */
function SharePanel({ bounty, onClose }) {
  const url  = typeof window !== "undefined" ? `${window.location.origin}/academic/bounty/board?highlight=${bounty.id}` : "";
  const text = `💰 Bounty: ${bounty.title} — ₦${Number(bounty.reward).toLocaleString("en-NG")} reward on LAN Library`;
  return createPortal(
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(7,19,31,.6)", zIndex: 1300, display: "flex", alignItems: "center", justifyContent: "center", padding: 24, backdropFilter: "blur(4px)" }}>
      <div onClick={e => e.stopPropagation()} style={{ background: "#fff", maxWidth: 360, width: "100%", border: "0.5px solid #e5ddd0", animation: "fadeUp .28s both" }}>
        <div style={{ background: NAVY, padding: "18px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <p style={{ fontSize: 9, color: GOLD, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", fontFamily: "'Lato',sans-serif", margin: "0 0 3px" }}>Spread the word</p>
            <p style={{ fontFamily: "'Playfair Display',serif", fontSize: 16, fontWeight: 700, color: "#fff", margin: 0 }}>Share Bounty</p>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "rgba(255,255,255,.4)", fontSize: 22, cursor: "pointer" }}>×</button>
        </div>
        <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: 10 }}>
          {[
            { label: "📱 WhatsApp",  href: `https://wa.me/?text=${encodeURIComponent(text + "\n" + url)}` },
            { label: "🐦 Twitter / X", href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}` },
            { label: "📘 Facebook",  href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}` },
            { label: "💼 LinkedIn",  href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}` },
          ].map(({ label, href }) => (
            <a key={label} href={href} target="_blank" rel="noreferrer"
              style={{ display: "block", padding: "12px 16px", background: CREAM, border: "0.5px solid rgba(184,150,62,.25)", color: NAVY, fontSize: 13, fontWeight: 700, textDecoration: "none", fontFamily: "'Lato',sans-serif", textAlign: "center" }}
              onMouseEnter={e => (e.currentTarget.style.background = "#ede8df")}
              onMouseLeave={e => (e.currentTarget.style.background = CREAM)}>
              {label}
            </a>
          ))}
          <button onClick={() => { navigator.clipboard.writeText(url); alert("Link copied!"); }}
            style={{ padding: "12px 16px", background: NAVY, color: "#fff", border: "none", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'Lato',sans-serif" }}>
            🔗 Copy Link
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

/* ══════════════════════════════════════════════════════════════
   BOUNTY CARD  — main export
══════════════════════════════════════════════════════════════ */
export default function BountyCard({ bounty, user, highlighted }) {
  const [menuOpen,  setMenuOpen]  = useState(false);
  const [panel,     setPanel]     = useState(null);
  const [deleting,  setDeleting]  = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const menuRef = useRef(null);
const [descExpanded, setDescExpanded] = useState(false);

  /* ── Viewer's display currency — persisted in localStorage ── */
  const [viewCurrency, setViewCurrency] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("lan_display_currency") || "NGN";
    }
    return "NGN";
  });

  const handleCurrencyChange = (code) => {
    setViewCurrency(code);
    if (typeof window !== "undefined") {
      localStorage.setItem("lan_display_currency", code);
    }
  };

  /* ── Derived display values ── */
  const currInfo  = CURRENCY_DISPLAY[viewCurrency] || CURRENCY_DISPLAY.NGN;
  const isNGN     = viewCurrency === "NGN";
  const rewardNGN = bounty.reward || 0;

  /* Primary display */
  const displayAmt    = isNGN ? rewardNGN : convertFromNGN(rewardNGN, viewCurrency);
  const displayPayout = displayAmt * 0.8;
  const displaySymbol = currInfo.symbol;

  /* Secondary: always show NGN equivalent when not in NGN */
  const showSecondary = !isNGN;

  /* ── Existing derived values ── */
  const isOwner   = user && bounty.postedByUid === user.uid;
  const alreadyBid = user && Array.isArray(bounty.claimedBy) && bounty.claimedBy.includes(user.uid);
  const dlInfo    = getDeadlineInfo(bounty.deadline);
  const slotsPct  = Math.min(100, ((bounty.proposals || 0) / (bounty.maxProposals || 10)) * 100);
  const slotsLeft = Math.max(0, (bounty.maxProposals || 10) - (bounty.proposals || 0));
  const payoutNGN = Math.round(rewardNGN * 0.8); // always NGN for bid button label
  const allSlotsFilled = slotsLeft === 0;

  /* Close menu on outside click */
  useEffect(() => {
    const h = e => { if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const closePanel = () => setPanel(null);

  const handleDelete = async () => {
    if (!confirm("Delete this bounty? Funds in escrow will be refunded.")) return;
    setDeleting(true);
    try {
      const { deleteDoc, doc: fd } = await import("firebase/firestore");
      await deleteDoc(fd(db, "bounties", bounty.id));
    } catch (e) { alert("Failed to delete: " + e.message); }
    finally { setDeleting(false); }
  };

  /* ─── Currency toggle menu item (shown to everyone) ──────── */
  const currencyMenuItem = {
    emoji: currInfo.flag,
    label: `View in ${viewCurrency === "NGN" ? "my currency" : "NGN (₦)"}`,
    sub: viewCurrency === "NGN"
      ? "Switch display currency"
      : `Currently: ${currInfo.symbol} ${viewCurrency} · tap to change`,
    action: () => { setShowPicker(true); setMenuOpen(false); },
  };

  /* ─── Dropdown menu items ─────────────────────────────────── */
  const ownerItems = [
    { emoji: "📊", label: "Track Bounty",  sub: `${dlInfo.label} · ₦${fmtAmt(rewardNGN, "NGN")} escrowed`, action: () => { setPanel("track"); setMenuOpen(false); } },
    { emoji: "✏️", label: "Edit Bounty",   sub: "Description & tags only",                                          action: () => { setPanel("edit");    setMenuOpen(false); } },
    { emoji: "👥", label: "Show Bidders",  sub: `${bounty.proposals || 0} proposal${(bounty.proposals || 0) !== 1 ? "s" : ""}`, action: () => { setPanel("bidders"); setMenuOpen(false); } },
    currencyMenuItem,
    { divider: true },
    { emoji: "🗑️", label: deleting ? "Deleting…" : "Delete Bounty", danger: true, action: handleDelete },
  ];

  const guestItems = [
    { emoji: "👥", label: "Show Bidders", sub: `${bounty.proposals || 0} proposal${(bounty.proposals || 0) !== 1 ? "s" : ""}`, action: () => { setPanel("bidders"); setMenuOpen(false); } },
    { emoji: "🔗", label: "Share Bounty", sub: "WhatsApp, Twitter & more",                                                      action: () => { setPanel("share");   setMenuOpen(false); } },
    currencyMenuItem,
  ];

  const menuItems = isOwner ? ownerItems : guestItems;

  /* ─── Status pill ─────────────────────────────────────────── */
  const StatusPill = () => {
    if (bounty.status === "fulfilled")
      return <span style={{ fontSize: 9, fontWeight: 700, color: "#16a34a", background: "rgba(22,163,74,.1)", border: "0.5px solid rgba(22,163,74,.3)", padding: "3px 8px", fontFamily: "'Lato',sans-serif", letterSpacing: "0.08em", whiteSpace: "nowrap" }}>✅ FULFILLED</span>;
    if (bounty.status === "pending_approval" && (isOwner || alreadyBid))
      return <span style={{ fontSize: 9, fontWeight: 700, color: "#b45309", background: "rgba(245,158,11,.08)", border: "0.5px solid rgba(245,158,11,.3)", padding: "3px 8px", fontFamily: "'Lato',sans-serif", letterSpacing: "0.08em", whiteSpace: "nowrap" }}>⏳ UNDER REVIEW</span>;
    return null;
  };

  /* ─── Card footer CTA ─────────────────────────────────────── */
  const renderFooter = () => {
    if (bounty.status === "fulfilled" && bounty.linkedBookId) {
      return (
        <a href={`/book/preview?id=${bounty.linkedBookId}`}
          style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "12px 16px", background: GOLD, color: NAVY, fontSize: 11, fontWeight: 700, letterSpacing: "0.09em", textTransform: "uppercase", fontFamily: "'Lato',sans-serif", textDecoration: "none", transition: "background .18s" }}
          onMouseEnter={e => (e.currentTarget.style.background = GOLDD)}
          onMouseLeave={e => (e.currentTarget.style.background = GOLD)}>
          📖 View &amp; Purchase
        </a>
      );
    }
    if (isOwner) {
      return (
        <div
          style={{
            padding: "11px 16px",
            background: "rgba(13,34,68,.03)",
            borderTop: "0.5px solid #f0ebe0",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke={GOLD}
            strokeWidth="2"
          >
            <rect x="3" y="11" width="18" height="11" rx="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          <span
            style={{
              fontSize: 11,
              color: "#888",
              fontFamily: "'Lato',sans-serif",
            }}
          >
            Your bounty ·{" "}
            <strong style={{ color: NAVY }}>
              `${displaySymbol}${fmtAmt(displayAmt, viewCurrency)}
            </strong>{" "}
            in escrow`
          </span>
        </div>
      );
    }
    if (allSlotsFilled) {
      return (
        <div style={{ padding: "12px 16px", background: "rgba(13,34,68,.04)", borderTop: "0.5px solid rgba(13,34,68,.1)", display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: "#888", fontFamily: "'Lato',sans-serif" }}>✓ All slots filled — No more bids</span>
        </div>
      );
    }
    if (alreadyBid && bounty.status === "pending_approval") {
      return (
        <div style={{ padding: "12px 16px", background: "rgba(245,158,11,.05)", borderTop: "0.5px solid rgba(245,158,11,.2)", display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: "#b45309", fontFamily: "'Lato',sans-serif" }}>⏳ Under Review — bidding paused</span>
        </div>
      );
    }
    if (alreadyBid) {
      return (
        <a href="/library/publish"
          style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "12px 16px", background: "#16a34a", color: "#fff", fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", fontFamily: "'Lato',sans-serif", textDecoration: "none", transition: "background .18s" }}
          onMouseEnter={e => (e.currentTarget.style.background = "#15803d")}
          onMouseLeave={e => (e.currentTarget.style.background = "#16a34a")}>
          📤 Upload Your Fulfillment
        </a>
      );
    }
   const isExpired = bounty.deadline && getDeadlineInfo(bounty.deadline).label === "Expired";

if (isExpired) {
  return (
    <div style={{ padding: "12px 16px", background: "rgba(13,34,68,.04)", borderTop: "0.5px solid rgba(13,34,68,.1)", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, opacity: 0.5 }}>
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
      <span style={{ fontSize: 11, fontWeight: 700, color: "#888", fontFamily: "'Lato',sans-serif", letterSpacing: "0.06em" }}>BOUNTY EXPIRED</span>
    </div>
  );
}

return (
  <button onClick={() => setPanel("bid")}
    style={{ width: "100%", padding: "13px 16px", background: NAVY, color: "#fff", border: "none", fontSize: 11, fontWeight: 700, letterSpacing: "0.09em", textTransform: "uppercase", fontFamily: "'Lato',sans-serif", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, transition: "background .18s" }}
    onMouseEnter={e => (e.currentTarget.style.background = "#1a3a6e")}
    onMouseLeave={e => (e.currentTarget.style.background = NAVY)}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5"><path d="M22 2L11 13" /><path d="M22 2L15 22 11 13 2 9l20-7z" /></svg>
        Bid on Bounty
        <span style={{ marginLeft: 2, background: GOLD, color: NAVY, fontSize: 9, fontWeight: 900, padding: "2px 7px", borderRadius: 99 }}>
        {displaySymbol}{fmtAmt(displayPayout, viewCurrency)}
        </span>
      </button>
    );
  };

  /* ════════════════════════════════════════════════════════════
     RENDER
  ════════════════════════════════════════════════════════════ */
  return (
    <>
      {/* ── KEYFRAMES (injected once per card, deduplicated by browser) ── */}
      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(16px) } to { opacity:1; transform:translateY(0) } }
        @keyframes spin    { to { transform:rotate(360deg) } }
      `}</style>

      {/* ══ CARD ══════════════════════════════════════════════ */}
      <div
        style={{
          background: "#fff",
          border: highlighted ? `1.5px solid ${GOLD}` : "0.5px solid #e5ddd0",
          boxShadow: highlighted ? `0 0 0 3px ${GOLD}22` : "none",
          display: "flex",
          flexDirection: "column",
          transition: "box-shadow .2s,transform .2s",
          position: "relative",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.boxShadow = "0 6px 24px rgba(13,34,68,.09)";
          e.currentTarget.style.transform = "translateY(-2px)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.boxShadow = highlighted
            ? `0 0 0 3px ${GOLD}22`
            : "none";
          e.currentTarget.style.transform = "none";
        }}
      >
        {/* Gold accent bar */}
        <div
          style={{
            height: 3,
            background: `linear-gradient(90deg,${GOLD},transparent)`,
          }}
        />

        {/* ── HEADER ── */}
        <div
          style={{
            padding: "14px 14px 0",
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 8,
          }}
        >
          <div
            style={{
              display: "flex",
              gap: 6,
              flexWrap: "wrap",
              flex: 1,
              alignItems: "center",
            }}
          >
            <TierBadge reward={bounty.reward} />
            {bounty.university && (
              <span
                style={{
                  background: NAVY,
                  color: GOLDD,
                  fontSize: 9,
                  fontWeight: 700,
                  padding: "3px 9px",
                  fontFamily: "'Lato',sans-serif",
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                }}
              >
                {bounty.university}
              </span>
            )}
            <StatusPill />
          </div>

          {/* ☰ Menu */}
          <div ref={menuRef} style={{ position: "relative", flexShrink: 0 }}>
            <button
              onClick={() => setMenuOpen((o) => !o)}
              aria-label="Bounty options"
              style={{
                width: 34,
                height: 34,
                border: `0.5px solid ${menuOpen ? GOLD : "#e5ddd0"}`,
                background: menuOpen ? CREAM : "#fafafa",
                borderRadius: 4,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                transition: "all .15s",
                flexShrink: 0,
              }}
            >
              <ListIcon color={menuOpen ? NAVY : "#999"} />
            </button>

            {menuOpen && (
              <div
                style={{
                  position: "absolute",
                  top: 38,
                  right: 0,
                  background: "#fff",
                  border: "0.5px solid #e5ddd0",
                  minWidth: 230,
                  zIndex: 300,
                  boxShadow: "0 8px 28px rgba(13,34,68,.14)",
                  animation: "fadeUp .18s both",
                }}
              >
                <div
                  style={{
                    padding: "8px 14px 6px",
                    borderBottom: "0.5px solid #f5f0e8",
                  }}
                >
                  <span
                    style={{
                      fontSize: 9,
                      fontWeight: 700,
                      letterSpacing: "0.14em",
                      textTransform: "uppercase",
                      color: "#bbb",
                      fontFamily: "'Lato',sans-serif",
                    }}
                  >
                    {isOwner ? "Owner options" : "Actions"}
                  </span>
                </div>
                <div style={{ padding: "4px 0" }}>
                  {menuItems.map((item, i) =>
                    item.divider ? (
                      <div
                        key={i}
                        style={{
                          height: "0.5px",
                          background: "#f0ebe0",
                          margin: "4px 0",
                        }}
                      />
                    ) : (
                      <button
                        key={i}
                        onClick={item.action}
                        disabled={deleting}
                        style={{
                          width: "100%",
                          display: "flex",
                          alignItems: "flex-start",
                          gap: 10,
                          padding: "10px 14px",
                          border: "none",
                          background: "none",
                          cursor: "pointer",
                          textAlign: "left",
                          transition: "background .12s",
                        }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.background = item.danger
                            ? "rgba(220,38,38,.06)"
                            : CREAM)
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.background = "none")
                        }
                      >
                        <span
                          style={{
                            fontSize: 15,
                            flexShrink: 0,
                            lineHeight: 1.2,
                          }}
                        >
                          {item.emoji}
                        </span>
                        <div>
                          <div
                            style={{
                              fontSize: 13,
                              fontWeight: 700,
                              color: item.danger ? "#dc2626" : NAVY,
                              fontFamily: "'Lato',sans-serif",
                            }}
                          >
                            {item.label}
                          </div>
                          {item.sub && (
                            <div
                              style={{
                                fontSize: 10,
                                color: item.danger
                                  ? "rgba(220,38,38,.6)"
                                  : "#aaa",
                                fontFamily: "'Lato',sans-serif",
                                marginTop: 1,
                              }}
                            >
                              {item.sub}
                            </div>
                          )}
                        </div>
                      </button>
                    ),
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── BODY ── */}
        <div
          style={{
            padding: "10px 14px 14px",
            flex: 1,
            display: "flex",
            flexDirection: "column",
            gap: 9,
          }}
        >
          <h3
            style={{
              fontFamily: "'Playfair Display',serif",
              fontSize: 16,
              fontWeight: 700,
              color: NAVY,
              lineHeight: 1.35,
              margin: 0,
            }}
          >
            {bounty.title}
          </h3>

          {bounty.department && (
            <p
              style={{
                fontSize: 11,
                color: "#999",
                fontFamily: "'Lato',sans-serif",
                margin: 0,
              }}
            >
              {bounty.department}
            </p>
          )}

          {/* ── ADD THIS ── */}
          {bounty.description && (
            <div
              style={{
                background: CREAM,
                border: "0.5px solid rgba(184,150,62,.2)",
              }}
            >
              <p
                style={{
                  fontSize: 11,
                  color: "#666",
                  fontFamily: "'Lato',sans-serif",
                  lineHeight: 1.65,
                  margin: 0,
                  padding: "8px 10px",
                  display: descExpanded ? "block" : "-webkit-box",
                  WebkitLineClamp: descExpanded ? "unset" : 2,
                  WebkitBoxOrient: "vertical",
                  overflow: descExpanded ? "visible" : "hidden",
                  whiteSpace: descExpanded ? "pre-line" : "normal",
                }}
              >
                {bounty.description}
              </p>
              {/* Only show toggle if description is long enough to be clamped */}
              {bounty.description.length > 120 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setDescExpanded((p) => !p);
                  }}
                  style={{
                    width: "100%",
                    padding: "5px 10px",
                    background: "none",
                    border: "none",
                    borderTop: "0.5px solid rgba(184,150,62,.15)",
                    fontSize: 10,
                    fontWeight: 700,
                    color: GOLD,
                    cursor: "pointer",
                    fontFamily: "'Lato',sans-serif",
                    letterSpacing: "0.06em",
                    textAlign: "left",
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = "rgba(184,150,62,.06)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = "none")
                  }
                >
                  {descExpanded ? (
                    <>
                      <svg
                        width="10"
                        height="10"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                      >
                        <polyline points="18 15 12 9 6 15" />
                      </svg>
                      Show less
                    </>
                  ) : (
                    <>
                      <svg
                        width="10"
                        height="10"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                      >
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                      Show full requirements
                    </>
                  )}
                </button>
              )}
            </div>
          )}

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 7,
              flexWrap: "wrap",
            }}
          >
            {bounty.postedBy && (
              <>
                <Avatar name={bounty.postedBy} size={20} />
                <strong
                  style={{
                    fontSize: 11,
                    color: NAVY,
                    fontFamily: "'Lato',sans-serif",
                  }}
                >
                  {bounty.postedBy}
                </strong>
              </>
            )}
            {bounty.proposals > 0 && (
              <span
                style={{
                  fontSize: 11,
                  color: GOLD,
                  fontWeight: 700,
                  fontFamily: "'Lato',sans-serif",
                }}
              >
                · {bounty.proposals} proposal{bounty.proposals !== 1 ? "s" : ""}
              </span>
            )}
            {bounty.createdAt && (
              <span
                style={{
                  fontSize: 11,
                  color: "#bbb",
                  fontFamily: "'Lato',sans-serif",
                }}
              >
                ·{" "}
                {timeAgo(
                  bounty.createdAt?.toDate?.() || new Date(bounty.createdAt),
                )}
              </span>
            )}
          </div>

          {/* Slots bar */}
          <div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: 4,
              }}
            >
              <span
                style={{
                  fontSize: 9,
                  fontWeight: 700,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  color: "#ccc",
                  fontFamily: "'Lato',sans-serif",
                }}
              >
                Proposal Slots
              </span>
              <span
                style={{
                  fontSize: 9,
                  fontWeight: 700,
                  color: slotsLeft <= 2 ? "#ef4444" : GOLD,
                  fontFamily: "'Lato',sans-serif",
                }}
              >
                {slotsLeft} left
              </span>
            </div>
            <div style={{ height: 3, background: "#f0ebe0" }}>
              <div
                style={{
                  height: "100%",
                  width: `${slotsPct}%`,
                  background: slotsPct > 80 ? "#ef4444" : GOLD,
                  transition: "width .5s",
                }}
              />
            </div>
          </div>

          {/* ── REWARD ROW ── */}
          <div
            style={{
              display: "flex",
              alignItems: "flex-end",
              justifyContent: "space-between",
            }}
          >
            <div>
              {/* Label row with currency pill */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  marginBottom: 3,
                }}
              >
                <span
                  style={{
                    fontSize: 9,
                    fontWeight: 700,
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                    color: "#ccc",
                    fontFamily: "'Lato',sans-serif",
                  }}
                >
                  Bounty Reward
                </span>
                {/* Currency pill — always visible */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowPicker(true);
                  }}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 3,
                    fontSize: 8,
                    fontWeight: 700,
                    letterSpacing: "0.06em",
                    background: isNGN
                      ? "rgba(13,34,68,.07)"
                      : "rgba(184,150,62,.15)",
                    border: `0.5px solid ${isNGN ? "rgba(13,34,68,.15)" : "rgba(184,150,62,.4)"}`,
                    color: isNGN ? "#888" : GOLD,
                    padding: "2px 7px",
                    cursor: "pointer",
                    fontFamily: "'Lato',sans-serif",
                    transition: "all .15s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = GOLD;
                    e.currentTarget.style.color = GOLD;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = isNGN
                      ? "rgba(13,34,68,.15)"
                      : "rgba(184,150,62,.4)";
                    e.currentTarget.style.color = isNGN ? "#888" : GOLD;
                  }}
                >
                  {currInfo.flag} {viewCurrency}
                </button>
              </div>

              {/* Big amount */}
              <div
                style={{
                  fontFamily: "'Playfair Display',serif",
                  fontSize: 26,
                  fontWeight: 700,
                  color: NAVY,
                  lineHeight: 1,
                }}
              >
                {displaySymbol}
                {fmtAmt(displayAmt, viewCurrency)}
              </div>

              {/* ≈ NGN secondary line */}
              {showSecondary && (
                <div
                  style={{
                    fontSize: 10,
                    color: "#bbb",
                    fontFamily: "'Lato',sans-serif",
                    marginTop: 2,
                  }}
                >
                  ≈ ₦{rewardNGN.toLocaleString("en-NG")} NGN
                </div>
              )}

              {/* Earns line */}
              <div
                style={{
                  fontSize: 11,
                  color: "#aaa",
                  fontFamily: "'Lato',sans-serif",
                  marginTop: 2,
                }}
              >
                earns {displaySymbol}
                {fmtAmt(displayPayout, viewCurrency)}
                {showSecondary && (
                  <span style={{ color: "#ccc" }}>
                    {" "}
                    (≈ ₦{payoutNGN.toLocaleString("en-NG")})
                  </span>
                )}
              </div>
            </div>

            {bounty.deadline && (
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: dlInfo.color,
                  fontFamily: "'Lato',sans-serif",
                }}
              >
                ⏱ {dlInfo.label}
              </span>
            )}
          </div>

          {/* Tags */}
          {bounty.tags?.length > 0 && (
            <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
              {bounty.tags.map((tag) => (
                <span
                  key={tag}
                  style={{
                    fontSize: 9,
                    fontWeight: 700,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    color: "#888",
                    background: "#f5f0e8",
                    border: "0.5px solid #e8e0d0",
                    padding: "3px 8px",
                    fontFamily: "'Lato',sans-serif",
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* ── FOOTER CTA ── */}
        <div style={{ borderTop: "0.5px solid #f0ebe0" }}>{renderFooter()}</div>
      </div>

      {/* ── PANELS / MODALS ── */}
      {panel === "track" && <TrackPanel bounty={bounty} onClose={closePanel} />}
      {panel === "edit" && <EditPanel bounty={bounty} onClose={closePanel} />}
      {panel === "bidders" && (
        <BiddersPanel bounty={bounty} onClose={closePanel} />
      )}
      {panel === "share" && <SharePanel bounty={bounty} onClose={closePanel} />}
      {panel === "bid" && user && typeof document !== "undefined" && (
        <BidModal
          bounty={bounty}
          user={user}
          onClose={closePanel}
          viewCurrency={viewCurrency}
        />
      )}
      {showPicker && typeof document !== "undefined" && (
        <CurrencyPickerPanel
          currentCurrency={viewCurrency}
          onSelect={handleCurrencyChange}
          onClose={() => setShowPicker(false)}
        />
      )}
    </>
  );
}