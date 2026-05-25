"use client";

/**
 * BountyCreateModal.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Replaces the inline CreateModal in AcademicBountyBoardClient.
 *
 * New behaviour:
 *  • Subscribes to the signed-in student's walletBalance in real-time.
 *  • Compares requested reward against live balance on every keystroke.
 *  • Disables "Confirm Bounty" and renders the insufficient-funds warning
 *    when balance < reward.
 *  • On confirm, calls createBountyWithEscrow() which uses runTransaction so
 *    wallet deduction + bounty creation + escrow credit are atomic.
 */

import React, { useState, useEffect, useCallback } from "react";
import {
  subscribeToWalletBalance,
  createBountyWithEscrow,
} from "@/lib/bountyEscrowService";

/* ─── Brand tokens (mirror the board's tokens) ──────────────── */
const NAVY = "#0d2244";
const GOLD = "#b8963e";
const GOLDD = "#d4aa5a";
const CREAM = "#f5f0e8";
const BG = "#f5f1ea";

/* ─── Tiny icons ─────────────────────────────────────────────── */
const LockIcon = () => (
  <svg
    width="13"
    height="13"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);
const PlusIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
  >
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="16" />
    <line x1="8" y1="12" x2="16" y2="12" />
  </svg>
);
const WalletIcon = () => (
  <svg
    width="13"
    height="13"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path d="M20 7H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z" />
    <path d="M16 3H8L4 7h16l-4-4z" />
    <circle cx="16" cy="14" r="1" fill="currentColor" />
  </svg>
);
const AlertIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);
const CheckCircleIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);

/* ─── Wallet balance pill ────────────────────────────────────── */
function WalletPill({ balance, loading }) {
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "6px 14px",
        background: "rgba(13,34,68,.06)",
        border: ".5px solid rgba(13,34,68,.14)",
        fontFamily: "'Lato',sans-serif",
      }}
    >
      <WalletIcon />
      <span
        style={{
          fontSize: 11,
          fontWeight: 700,
          color: "#888",
          letterSpacing: ".06em",
          textTransform: "uppercase",
        }}
      >
        Wallet:
      </span>
      {loading ? (
        <span
          style={{
            width: 60,
            height: 12,
            background: "#e5ddd0",
            display: "inline-block",
            animation: "pulse 1.4s ease infinite",
          }}
        />
      ) : (
        <span
          style={{
            fontSize: 13,
            fontWeight: 900,
            color: NAVY,
            fontFamily: "'Playfair Display',serif",
          }}
        >
          ₦{balance.toLocaleString("en-NG")}
        </span>
      )}
    </div>
  );
}

/* ─── Insufficient funds banner ──────────────────────────────── */
function InsufficientFundsBanner({ required, balance, topUpHref }) {
  const shortfall = required - balance;
  return (
    <div
      style={{
        padding: "14px 16px",
        background: "rgba(220,38,38,.06)",
        border: ".5px solid rgba(220,38,38,.3)",
        display: "flex",
        gap: 10,
        alignItems: "flex-start",
      }}
    >
      <span style={{ color: "#dc2626", flexShrink: 0, marginTop: 1 }}>
        <AlertIcon />
      </span>
      <div style={{ flex: 1 }}>
        <p
          style={{
            fontSize: 12,
            fontWeight: 700,
            color: "#dc2626",
            fontFamily: "'Lato',sans-serif",
            margin: "0 0 4px",
          }}
        >
          Insufficient wallet funds to post this bounty.
        </p>
        <p
          style={{
            fontSize: 11,
            color: "#888",
            fontFamily: "'Lato',sans-serif",
            margin: "0 0 8px",
            lineHeight: 1.5,
          }}
        >
          You need{" "}
          <strong style={{ color: NAVY }}>
            ₦{shortfall.toLocaleString("en-NG")}
          </strong>{" "}
          more to cover this reward. Top up your wallet to continue.
        </p>
        <a
          href={topUpHref || "/wallet/top-up"}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 5,
            fontSize: 11,
            fontWeight: 700,
            color: "#dc2626",
            textDecoration: "underline",
            fontFamily: "'Lato',sans-serif",
          }}
        >
          Top Up Wallet →
        </a>
      </div>
    </div>
  );
}

/* ─── Escrow breakdown preview ───────────────────────────────── */
function EscrowBreakdown({ amount }) {
  if (!amount || amount <= 0) return null;
  const authorShare = Math.round(amount * 0.8);
  const platformShare = amount - authorShare;
  return (
    <div
      style={{
        background: NAVY,
        padding: "14px 16px",
        borderTop: ".5px solid rgba(184,150,62,.2)",
      }}
    >
      <p
        style={{
          fontSize: 9,
          fontWeight: 700,
          letterSpacing: ".18em",
          textTransform: "uppercase",
          color: GOLD,
          fontFamily: "'Lato',sans-serif",
          marginBottom: 10,
        }}
      >
        Escrow Breakdown
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {[
          {
            label: "Fulfilment reward (author 80%)",
            val: authorShare,
            color: GOLD,
          },
          {
            label: "Platform fee (LAN 20%)",
            val: platformShare,
            color: "rgba(184,150,62,.45)",
          },
          {
            label: "Total locked in escrow",
            val: amount,
            color: "#fff",
            bold: true,
          },
        ].map(({ label, val, color, bold }) => (
          <div
            key={label}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span
              style={{
                fontSize: 11,
                color: "rgba(245,240,232,.6)",
                fontFamily: "'Lato',sans-serif",
                fontWeight: bold ? 700 : 400,
              }}
            >
              {label}
            </span>
            <span
              style={{
                fontSize: bold ? 15 : 12,
                fontFamily: "'Playfair Display',serif",
                fontWeight: 700,
                color,
              }}
            >
              ₦{val.toLocaleString("en-NG")}
            </span>
          </div>
        ))}
      </div>
      {/* progress bar: author vs platform */}
      <div
        style={{
          height: 4,
          background: "rgba(255,255,255,.1)",
          marginTop: 10,
          display: "flex",
        }}
      >
        <div style={{ width: "80%", background: GOLD }} />
        <div style={{ width: "20%", background: "rgba(184,150,62,.3)" }} />
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginTop: 4,
        }}
      >
        <span
          style={{
            fontSize: 9,
            color: "rgba(184,150,62,.5)",
            fontFamily: "'Lato',sans-serif",
            fontWeight: 700,
            letterSpacing: ".06em",
          }}
        >
          AUTHOR 80%
        </span>
        <span
          style={{
            fontSize: 9,
            color: "rgba(184,150,62,.35)",
            fontFamily: "'Lato',sans-serif",
            fontWeight: 700,
            letterSpacing: ".06em",
          }}
        >
          PLATFORM 20%
        </span>
      </div>
    </div>
  );
}

/* ─── Main Modal ─────────────────────────────────────────────── */
export default function BountyCreateModal({ onClose, user, topUpHref }) {
  const [form, setForm] = useState({
    title: "",
    university: "",
    department: "",
    reward: "",
    deadline: "",
    tags: "",
  });
  const [walletBalance, setWalletBalance] = useState(0);
  const [walletLoading, setWalletLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  /* live wallet subscription */
  useEffect(() => {
    if (!user?.uid) {
      setWalletLoading(false);
      return;
    }
    setWalletLoading(true);
    const unsub = subscribeToWalletBalance(user.uid, (bal) => {
      setWalletBalance(bal);
      setWalletLoading(false);
    });
    return () => unsub();
  }, [user?.uid]);

  const set = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));

  const rewardNum = Number(form.reward) || 0;
  const hasFunds = walletBalance >= rewardNum;
  const rewardValid = rewardNum > 0;
  const canSubmit =
    !loading &&
    !!user &&
    !!form.title &&
    rewardValid &&
    hasFunds &&
    !walletLoading;

  const handleSubmit = useCallback(async () => {
    if (!canSubmit) return;
    setError("");
    setLoading(true);
    try {
      await createBountyWithEscrow({
        formData: form,
        userId: user.uid,
        displayName: user.displayName || user.email?.split("@")[0] || "Student",
      });
      setSuccess(true);
      setTimeout(() => onClose(), 1800);
    } catch (e) {
      if (e.message === "INSUFFICIENT_FUNDS") {
        setError("Your wallet balance is too low. Please top up and retry.");
      } else if (e.message === "USER_NOT_FOUND") {
        setError(
          "Your account was not found. Please sign out and sign back in.",
        );
      } else {
        setError("Failed to post bounty. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }, [canSubmit, form, user, onClose]);

  const inputStyle = {
    padding: "10px 14px",
    border: ".5px solid #e5ddd0",
    fontSize: 13,
    fontFamily: "'Lato',sans-serif",
    outline: "none",
    width: "100%",
    background: BG,
    color: NAVY,
    boxSizing: "border-box",
    transition: "border-color .18s",
  };

  /* ── success state ── */
  if (success) {
    return (
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(13,34,68,.72)",
          zIndex: 999,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px",
        }}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            background: NAVY,
            border: `1px solid ${GOLD}`,
            maxWidth: 400,
            width: "100%",
            padding: "48px 32px",
            textAlign: "center",
            animation: "fadeUp .3s both",
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: "50%",
              background: "rgba(184,150,62,.15)",
              border: `1px solid ${GOLD}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 20px",
              color: GOLD,
            }}
          >
            <CheckCircleIcon />
          </div>
          <h3
            style={{
              fontFamily: "'Playfair Display',serif",
              fontSize: 22,
              fontWeight: 700,
              color: "#fff",
              marginBottom: 8,
            }}
          >
            Bounty Posted!
          </h3>
          <p
            style={{
              fontSize: 12,
              color: "rgba(245,240,232,.55)",
              fontFamily: "'Lato',sans-serif",
              lineHeight: 1.7,
            }}
          >
            Your reward has been locked in escrow. Authors can now submit
            proposals.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <style>{`
        @keyframes fadeUp  { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:translateY(0)} }
        @keyframes spin    { to{transform:rotate(360deg)} }
        @keyframes pulse   { 0%,100%{opacity:1} 50%{opacity:.5} }
        .bcm-input:focus { border-color:${GOLD} !important; }
      `}</style>

      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(13,34,68,.72)",
          zIndex: 999,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px",
        }}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            background: "#fff",
            border: ".5px solid #e5ddd0",
            maxWidth: 500,
            width: "100%",
            position: "relative",
            animation: "fadeUp .3s both",
            maxHeight: "92vh",
            overflowY: "auto",
          }}
        >
          {/* ── header ── */}
          <div
            style={{
              padding: "24px 28px 0",
              borderBottom: ".5px solid #f0ebe0",
              paddingBottom: 20,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
            }}
          >
            <div>
              <p
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: ".18em",
                  textTransform: "uppercase",
                  color: GOLD,
                  marginBottom: 5,
                  fontFamily: "'Lato',sans-serif",
                }}
              >
                New Request
              </p>
              <h3
                style={{
                  fontFamily: "'Playfair Display',serif",
                  fontSize: 22,
                  fontWeight: 700,
                  color: NAVY,
                }}
              >
                Post a Bounty
              </h3>
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-end",
                gap: 8,
              }}
            >
              <button
                onClick={onClose}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontSize: 22,
                  color: "#ccc",
                  lineHeight: 1,
                }}
                aria-label="Close"
              >
                ×
              </button>
              {user && (
                <WalletPill balance={walletBalance} loading={walletLoading} />
              )}
            </div>
          </div>

          {/* ── body ── */}
          <div style={{ padding: "22px 28px" }}>
            {!user && (
              <div
                style={{
                  padding: "12px 14px",
                  background: "rgba(220,38,38,.07)",
                  border: ".5px solid rgba(220,38,38,.25)",
                  color: "#dc2626",
                  fontSize: 12,
                  fontFamily: "'Lato',sans-serif",
                  marginBottom: 16,
                }}
              >
                Please sign in to post a bounty.
              </div>
            )}

            {error && (
              <div
                style={{
                  padding: "12px 14px",
                  background: "rgba(220,38,38,.07)",
                  border: ".5px solid rgba(220,38,38,.25)",
                  color: "#dc2626",
                  fontSize: 12,
                  fontFamily: "'Lato',sans-serif",
                  marginBottom: 16,
                }}
              >
                {error}
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <input
                className="bcm-input"
                placeholder="Document title or description (be specific)"
                style={inputStyle}
                value={form.title}
                onChange={set("title")}
              />

              <div style={{ display: "flex", gap: 10 }}>
                <input
                  className="bcm-input"
                  placeholder="University (e.g. UNILAG)"
                  style={{ ...inputStyle, flex: 1 }}
                  value={form.university}
                  onChange={set("university")}
                />
                <input
                  className="bcm-input"
                  placeholder="Department"
                  style={{ ...inputStyle, flex: 1 }}
                  value={form.department}
                  onChange={set("department")}
                />
              </div>

              {/* ── reward + deadline row ── */}
              <div style={{ display: "flex", gap: 10 }}>
                <div style={{ flex: 1, position: "relative" }}>
                  <span
                    style={{
                      position: "absolute",
                      left: 12,
                      top: "50%",
                      transform: "translateY(-50%)",
                      fontSize: 13,
                      fontWeight: 700,
                      color: GOLD,
                      fontFamily: "'Playfair Display',serif",
                      pointerEvents: "none",
                    }}
                  >
                    ₦
                  </span>
                  <input
                    className="bcm-input"
                    type="number"
                    min="100"
                    placeholder="Reward amount"
                    style={{ ...inputStyle, paddingLeft: 28 }}
                    value={form.reward}
                    onChange={set("reward")}
                  />
                </div>
                <input
                  className="bcm-input"
                  type="date"
                  style={{ ...inputStyle, flex: 1 }}
                  value={form.deadline}
                  onChange={set("deadline")}
                />
              </div>

              {/* ── balance summary bar (shown when a reward is entered) ── */}
              {rewardValid && !walletLoading && (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "8px 12px",
                    background: hasFunds
                      ? "rgba(22,163,74,.06)"
                      : "rgba(220,38,38,.05)",
                    border: `.5px solid ${hasFunds ? "rgba(22,163,74,.25)" : "rgba(220,38,38,.25)"}`,
                  }}
                >
                  <span
                    style={{
                      fontSize: 11,
                      color: "#777",
                      fontFamily: "'Lato',sans-serif",
                    }}
                  >
                    Wallet after posting
                  </span>
                  <span
                    style={{
                      fontSize: 14,
                      fontFamily: "'Playfair Display',serif",
                      fontWeight: 700,
                      color: hasFunds ? "#16a34a" : "#dc2626",
                    }}
                  >
                    {hasFunds
                      ? `₦${(walletBalance - rewardNum).toLocaleString("en-NG")}`
                      : `−₦${(rewardNum - walletBalance).toLocaleString("en-NG")} shortfall`}
                  </span>
                </div>
              )}

              {/* ── insufficient funds banner ── */}
              {rewardValid && !hasFunds && !walletLoading && (
                <InsufficientFundsBanner
                  required={rewardNum}
                  balance={walletBalance}
                  topUpHref={topUpHref}
                />
              )}

              <input
                className="bcm-input"
                placeholder="Tags (comma-separated, e.g. Past Questions, Maths)"
                style={inputStyle}
                value={form.tags}
                onChange={set("tags")}
              />

              {/* ── escrow protection note ── */}
              <div
                style={{
                  display: "flex",
                  gap: 10,
                  padding: "12px 14px",
                  background: "rgba(13,34,68,.04)",
                  border: ".5px solid rgba(13,34,68,.12)",
                }}
              >
                <span style={{ color: NAVY, flexShrink: 0, marginTop: 1 }}>
                  <LockIcon />
                </span>
                <p
                  style={{
                    fontSize: 11,
                    color: "#555",
                    fontFamily: "'Lato',sans-serif",
                    margin: 0,
                    lineHeight: 1.6,
                  }}
                >
                  Your reward is held safely in escrow. You are only charged
                  when a valid submission is accepted. Authors receive{" "}
                  <strong style={{ color: NAVY }}>80%</strong>, LAN Library
                  retains <strong style={{ color: NAVY }}>20%</strong>.
                </p>
              </div>
            </div>
          </div>

          {/* ── escrow breakdown (dark panel) ── */}
          {rewardValid && hasFunds && <EscrowBreakdown amount={rewardNum} />}

          {/* ── submit ── */}
          <div style={{ padding: "20px 28px" }}>
            <button
              onClick={handleSubmit}
              disabled={!canSubmit}
              style={{
                width: "100%",
                padding: "14px 28px",
                background: canSubmit ? GOLD : "#e5ddd0",
                color: canSubmit ? NAVY : "#aaa",
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: ".12em",
                textTransform: "uppercase",
                border: "none",
                cursor: canSubmit ? "pointer" : "not-allowed",
                fontFamily: "'Lato',sans-serif",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                transition: "background .18s",
              }}
              onMouseEnter={(e) => {
                if (canSubmit) e.currentTarget.style.background = GOLDD;
              }}
              onMouseLeave={(e) => {
                if (canSubmit) e.currentTarget.style.background = GOLD;
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
                  Locking in Escrow…
                </>
              ) : (
                <>
                  <PlusIcon /> Confirm &amp; Lock ₦
                  {rewardNum > 0 ? rewardNum.toLocaleString("en-NG") : "—"} in
                  Escrow
                </>
              )}
            </button>

            {!canSubmit && rewardValid && !hasFunds && (
              <p
                style={{
                  textAlign: "center",
                  fontSize: 11,
                  color: "#dc2626",
                  fontFamily: "'Lato',sans-serif",
                  marginTop: 10,
                }}
              >
                Top up your wallet to enable this button.{" "}
                <a
                  href={topUpHref || "/wallet/top-up"}
                  style={{ color: "#dc2626", fontWeight: 700 }}
                >
                  Top Up →
                </a>
              </p>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
