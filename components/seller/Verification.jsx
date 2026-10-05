// components/seller/Verification.jsx
// Shared: blue check, verify modal (before/after + Flutterwave or Wallet), return-from-Flutterwave hook.
"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebaseConfig";
import { X, ChevronDown, Wallet, CreditCard, AlertCircle } from "lucide-react";

export const VERIFY_PRICE = 2000;
export const FREE_VERIFY_FOLLOWERS = 1000;
const NAVY = "#0d2244",
  GOLD = "#b8963e",
  BLUE = "#1d9bf0",
  CREAM = "#f5f0e8";

const toMs = (t) =>
  t?.toMillis
    ? t.toMillis()
    : t?.seconds
      ? t.seconds * 1000
      : t
        ? new Date(t).getTime()
        : 0;

/** Paid verification still running (no expiry = granted manually by admin). */
export function paidVerificationActive(s) {
  if (!s?.isVerifiedSeller) return false;
  const exp = toMs(s.verifiedUntil);
  return !exp || exp > Date.now();
}
/** Verified = paid and active, OR 1,000+ followers. Faculty never use this. */
export function isSellerVerified(s, followers) {
  return (
    paidVerificationActive(s) ||
    Number(followers ?? s?.followersCount ?? 0) >= FREE_VERIFY_FOLLOWERS
  );
}

export function VerifiedBadge({
  size = 18,
  ring,
  style,
  title = "Verified seller",
}) {
  return (
    <span
      title={title}
      aria-label={title}
      role="img"
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: size,
        height: size,
        borderRadius: "50%",
        background: BLUE,
        flexShrink: 0,
        verticalAlign: "middle",
        boxSizing: "content-box",
        border: ring
          ? `${Math.max(2, Math.round(size / 9))}px solid ${ring}`
          : "none",
        ...style,
      }}
    >
      <svg
        width={size * 0.58}
        height={size * 0.58}
        viewBox="0 0 10 10"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M2 5.2L4 7.2L8 3"
          stroke="#fff"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

/** Runs once on the page Flutterwave returns to (?vf=1&tx_ref=...). */
export function useVerificationReturn(onDone) {
  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const txRef = p.get("tx_ref");
    if (p.get("vf") !== "1" || !txRef) return;
    const clean = () => {
      ["vf", "tx_ref", "status", "transaction_id"].forEach((k) => p.delete(k));
      const q = p.toString();
      window.history.replaceState(
        {},
        "",
        window.location.pathname + (q ? `?${q}` : ""),
      );
    };
    if (p.get("status") === "cancelled") {
      clean();
      onDone?.({ ok: false, cancelled: true });
      return;
    }
    let fired = false;
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u || fired) return;
      fired = true;
      try {
        const res = await fetch("/api/verification/verify", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${await u.getIdToken()}`,
          },
          body: JSON.stringify({ tx_ref: txRef }),
        });
        const d = await res.json().catch(() => ({}));
        clean();
        onDone?.({ ok: res.ok && d.success, ...d });
      } catch {
        clean();
        onDone?.({
          ok: false,
          error: "Network error while confirming payment.",
        });
      }
    });
    return () => unsub();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}

const label = {
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: ".14em",
  textTransform: "uppercase",
  margin: "0 0 10px",
  fontFamily: "'Lato',sans-serif",
};

export function VerifySellerModal({
  open,
  onClose,
  name = "Your name",
  photo,
  followers = 0,
  walletBalance,
  onVerified,
}) {
  const [method, setMethod] = useState("flutterwave");
  const [view, setView] = useState("main"); // main | pin | done
  const [pin, setPin] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [why, setWhy] = useState(false);
  const [until, setUntil] = useState(null);

  useEffect(() => {
    if (open) {
      setView("main");
      setPin("");
      setError("");
      setBusy(false);
      setWhy(false);
    }
  }, [open]);
  if (!open || typeof document === "undefined") return null;

  const pct = Math.min(
    100,
    Math.round((followers / FREE_VERIFY_FOLLOWERS) * 100),
  );
  const walletShort =
    typeof walletBalance === "number" && walletBalance < VERIFY_PRICE;

  const call = async (body) => {
    const res = await fetch("/api/verification/initialize", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${await auth.currentUser.getIdToken()}`,
      },
      body: JSON.stringify(body),
    });
    const d = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(d.error || "Something went wrong. Try again.");
    return d;
  };

  const start = async () => {
    setError("");
    if (!auth.currentUser) {
      setError("Sign in again to continue.");
      return;
    }
    if (method === "wallet") {
      setPin("");
      setView("pin");
      return;
    }
    setBusy(true);
    try {
      const d = await call({
        method: "flutterwave",
        returnPath: window.location.pathname,
      });
      window.location.href = d.link;
    } catch (e) {
      setError(e.message);
      setBusy(false);
    }
  };

  const confirmPin = async () => {
    if (pin.length < 4 || busy) return;
    setBusy(true);
    setError("");
    try {
      const d = await call({ method: "wallet", pin });
      setUntil(d.verifiedUntil);
      setView("done");
      onVerified?.(d);
    } catch (e) {
      setError(e.message);
      setPin("");
    } finally {
      setBusy(false);
    }
  };

  const preview = (title, verified) => (
    <div
      style={{
        flex: "1 1 150px",
        minWidth: 0,
        textAlign: "center",
        padding: "16px 10px 18px",
        border: `1.5px solid ${verified ? BLUE : "#e5ddd0"}`,
        background: verified ? "#f4faff" : "#fff",
      }}
    >
      <p
        style={{
          ...label,
          color: verified ? BLUE : "#999",
          margin: "0 0 12px",
        }}
      >
        {title}
      </p>
      <div
        style={{
          position: "relative",
          width: 68,
          height: 68,
          margin: "0 auto 10px",
        }}
      >
        {photo ? (
          <img
            src={photo}
            alt=""
            style={{
              width: "100%",
              height: "100%",
              borderRadius: "50%",
              objectFit: "cover",
              border: `2px solid ${verified ? BLUE : "#e5ddd0"}`,
            }}
          />
        ) : (
          <div
            style={{
              width: "100%",
              height: "100%",
              borderRadius: "50%",
              background: CREAM,
              border: "2px solid #e5ddd0",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 26,
              fontWeight: 900,
              color: GOLD,
              fontFamily: "'Playfair Display',serif",
            }}
          >
            {name.charAt(0).toUpperCase()}
          </div>
        )}
        {verified && (
          <VerifiedBadge
            size={22}
            ring="#f4faff"
            style={{ position: "absolute", right: -4, bottom: -2 }}
          />
        )}
      </div>
      <p
        style={{
          fontFamily: "'Playfair Display',serif",
          fontWeight: 700,
          fontSize: 14,
          color: NAVY,
          margin: "0 0 6px",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {name}
      </p>
      <span
        style={{
          display: "inline-block",
          fontSize: 10,
          fontWeight: 700,
          padding: "3px 10px",
          borderRadius: 99,
          background: verified ? "rgba(29,155,240,.12)" : "#f1efe9",
          color: verified ? BLUE : "#888",
        }}
      >
        {verified ? "Verified seller" : "Seller"}
      </span>
    </div>
  );

  const pinKey = (d) => (
    <button
      key={d}
      onClick={() => pin.length < 4 && setPin((p) => p + d)}
      disabled={busy}
      style={{
        height: 50,
        border: "0.5px solid #e5ddd0",
        background: "#fff",
        fontSize: 18,
        fontWeight: 700,
        color: NAVY,
        cursor: "pointer",
      }}
    >
      {d}
    </button>
  );

  return createPortal(
    <div
      onClick={(e) => e.target === e.currentTarget && onClose()}
      role="dialog"
      aria-modal="true"
      aria-label="Get verified"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1500,
        background: "rgba(7,19,31,.7)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 12,
      }}
    >
      <div
        style={{
          background: "#fff",
          width: "100%",
          maxWidth: 460,
          maxHeight: "94vh",
          overflowY: "auto",
          fontFamily: "'Lato',sans-serif",
        }}
      >
        <div
          style={{
            background: NAVY,
            padding: "16px 20px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <p style={{ ...label, color: GOLD, margin: "0 0 3px" }}>
              Seller verification
            </p>
            <p
              style={{
                fontFamily: "'Playfair Display',serif",
                fontSize: 19,
                fontWeight: 700,
                color: "#fff",
              }}
            >
              {view === "pin"
                ? "Enter your PIN"
                : view === "done"
                  ? "You're verified"
                  : "Get your blue check"}
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{
              width: 32,
              height: 32,
              border: "0.5px solid rgba(255,255,255,.25)",
              background: "transparent",
              color: "#fff",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <X size={16} />
          </button>
        </div>

        <div style={{ padding: 20 }}>
          {view === "main" && (
            <>
              <div
                style={{
                  display: "flex",
                  gap: 10,
                  flexWrap: "wrap",
                  marginBottom: 18,
                }}
              >
                {preview("Now", false)}
                {preview("After verifying", true)}
              </div>

              <p
                style={{
                  fontFamily: "'Playfair Display',serif",
                  fontSize: 24,
                  fontWeight: 900,
                  color: NAVY,
                  margin: "0 0 2px",
                }}
              >
                ₦{VERIFY_PRICE.toLocaleString()}
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 400,
                    color: "#888",
                    fontFamily: "'Lato',sans-serif",
                  }}
                >
                  {" "}
                  / month
                </span>
              </p>
              <p style={{ fontSize: 12, color: "#888", marginBottom: 14 }}>
                Lasts 30 days. Renew whenever you like.
              </p>

              <p style={{ ...label, color: "#aaa" }}>Pay with</p>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 8,
                  marginBottom: 14,
                }}
              >
                {[
                  [
                    "flutterwave",
                    "Flutterwave",
                    "Card, bank, USSD",
                    CreditCard,
                  ],
                  [
                    "wallet",
                    "LAN Wallet",
                    typeof walletBalance === "number"
                      ? `Balance ₦${walletBalance.toLocaleString()}`
                      : "Pay with PIN",
                    Wallet,
                  ],
                ].map(([id, t, sub, Ic]) => (
                  <button
                    key={id}
                    onClick={() => setMethod(id)}
                    aria-pressed={method === id}
                    style={{
                      textAlign: "left",
                      padding: "12px",
                      cursor: "pointer",
                      border: `1.5px solid ${method === id ? GOLD : "#e5ddd0"}`,
                      background: method === id ? CREAM : "#fff",
                    }}
                  >
                    <Ic
                      size={16}
                      style={{
                        color: method === id ? GOLD : "#999",
                        marginBottom: 6,
                      }}
                    />
                    <p style={{ fontSize: 13, fontWeight: 700, color: NAVY }}>
                      {t}
                    </p>
                    <p
                      style={{
                        fontSize: 11,
                        color:
                          id === "wallet" && walletShort ? "#dc2626" : "#999",
                      }}
                    >
                      {id === "wallet" && walletShort
                        ? `${sub} (too low)`
                        : sub}
                    </p>
                  </button>
                ))}
              </div>

              {error && (
                <div
                  style={{
                    display: "flex",
                    gap: 8,
                    background: "#fef2f2",
                    border: "0.5px solid #fecaca",
                    padding: "10px 12px",
                    marginBottom: 12,
                  }}
                >
                  <AlertCircle
                    size={14}
                    style={{ color: "#ef4444", flexShrink: 0, marginTop: 1 }}
                  />
                  <p style={{ fontSize: 12, color: "#dc2626" }}>{error}</p>
                </div>
              )}

              <button
                onClick={start}
                disabled={busy || (method === "wallet" && walletShort)}
                style={{
                  width: "100%",
                  background: BLUE,
                  color: "#fff",
                  border: "none",
                  padding: 14,
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: "pointer",
                  opacity:
                    busy || (method === "wallet" && walletShort) ? 0.55 : 1,
                }}
              >
                {busy ? "Opening payment…" : "Verify my account"}
              </button>

              <button
                onClick={() => setWhy((w) => !w)}
                aria-expanded={why}
                style={{
                  width: "100%",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  marginTop: 12,
                  color: NAVY,
                  fontSize: 12,
                  fontWeight: 700,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 5,
                  textDecoration: "underline",
                }}
              >
                Read why and what you gain{" "}
                <ChevronDown
                  size={13}
                  style={{
                    transform: why ? "rotate(180deg)" : "none",
                    transition: "transform .2s",
                  }}
                />
              </button>
              {why && (
                <ul
                  style={{
                    listStyle: "none",
                    margin: "10px 0 0",
                    padding: "12px 14px",
                    background: CREAM,
                    border: "0.5px solid rgba(184,150,62,.25)",
                    display: "flex",
                    flexDirection: "column",
                    gap: 9,
                  }}
                >
                  {[
                    "A blue check beside your photo on your profile.",
                    "“Verified seller” in place of “Seller”, so buyers know you are real.",
                    "Students and buyers trust you faster, so they are more willing to buy your materials.",
                    "Active while your 30 days run. If it lapses, the badge goes until you renew.",
                  ].map((t) => (
                    <li
                      key={t}
                      style={{
                        display: "flex",
                        gap: 9,
                        fontSize: 12.5,
                        color: "#555",
                        lineHeight: 1.5,
                      }}
                    >
                      <VerifiedBadge size={14} style={{ marginTop: 2 }} />
                      {t}
                    </li>
                  ))}
                </ul>
              )}

              <div
                style={{
                  marginTop: 16,
                  padding: "14px",
                  border: "0.5px solid #e5ddd0",
                  background: "#fafaf8",
                }}
              >
                <p style={{ fontSize: 13, color: "#444", lineHeight: 1.6 }}>
                  Not verified yet?{" "}
                  <strong style={{ color: NAVY }}>1,000 followers</strong>{" "}
                  verifies you for free. Don't have 1,000? Pay{" "}
                  <strong style={{ color: NAVY }}>
                    ₦{VERIFY_PRICE.toLocaleString()}/month
                  </strong>{" "}
                  so buyers and students can trust you.
                </p>
                <div
                  style={{ height: 6, background: "#ece6d8", marginTop: 10 }}
                >
                  <div
                    style={{
                      height: "100%",
                      width: `${pct}%`,
                      background: GOLD,
                    }}
                  />
                </div>
                <p style={{ fontSize: 11, color: "#888", marginTop: 5 }}>
                  {followers.toLocaleString()} /{" "}
                  {FREE_VERIFY_FOLLOWERS.toLocaleString()} followers
                </p>
              </div>
            </>
          )}

          {view === "pin" && (
            <>
              <p
                style={{
                  fontSize: 13,
                  color: "#777",
                  textAlign: "center",
                  marginBottom: 16,
                }}
              >
                Pay{" "}
                <strong style={{ color: NAVY }}>
                  ₦{VERIFY_PRICE.toLocaleString()}
                </strong>{" "}
                from your LAN wallet to verify.
              </p>
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  gap: 10,
                  marginBottom: 14,
                }}
              >
                {[0, 1, 2, 3].map((i) => (
                  <div
                    key={i}
                    style={{
                      width: 50,
                      height: 54,
                      border: `1.5px solid ${i < pin.length ? NAVY : "#e5ddd0"}`,
                      background: i < pin.length ? CREAM : "#fff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 20,
                      color: NAVY,
                    }}
                  >
                    {i < pin.length ? "●" : "○"}
                  </div>
                ))}
              </div>
              {error && (
                <p
                  style={{
                    fontSize: 12,
                    color: "#dc2626",
                    textAlign: "center",
                    marginBottom: 10,
                  }}
                >
                  {error}
                </p>
              )}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3,1fr)",
                  gap: 6,
                  marginBottom: 6,
                }}
              >
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(pinKey)}
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3,1fr)",
                  gap: 6,
                  marginBottom: 14,
                }}
              >
                <div />
                {pinKey(0)}
                <button
                  onClick={() => setPin((p) => p.slice(0, -1))}
                  aria-label="Delete"
                  style={{
                    height: 50,
                    border: "0.5px solid #e5ddd0",
                    background: "#fff",
                    fontSize: 18,
                    color: "#999",
                    cursor: "pointer",
                  }}
                >
                  ⌫
                </button>
              </div>
              <button
                onClick={confirmPin}
                disabled={pin.length < 4 || busy}
                style={{
                  width: "100%",
                  background: NAVY,
                  color: "#fff",
                  border: "none",
                  padding: 14,
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: "pointer",
                  opacity: pin.length < 4 || busy ? 0.45 : 1,
                }}
              >
                {busy ? "Verifying…" : "Confirm and verify"}
              </button>
              <button
                onClick={() => {
                  setView("main");
                  setError("");
                }}
                style={{
                  width: "100%",
                  background: "none",
                  border: "none",
                  color: "#999",
                  fontSize: 12,
                  padding: 10,
                  cursor: "pointer",
                }}
              >
                Back
              </button>
            </>
          )}

          {view === "done" && (
            <div style={{ textAlign: "center", padding: "10px 0 4px" }}>
              <VerifiedBadge size={56} />
              <p
                style={{
                  fontFamily: "'Playfair Display',serif",
                  fontSize: 20,
                  fontWeight: 700,
                  color: NAVY,
                  margin: "14px 0 6px",
                }}
              >
                Your blue check is live
              </p>
              <p style={{ fontSize: 13, color: "#777", marginBottom: 18 }}>
                {until
                  ? `Verified until ${new Date(until).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}.`
                  : "You are now a verified seller."}
              </p>
              <button
                onClick={onClose}
                style={{
                  width: "100%",
                  background: NAVY,
                  color: "#fff",
                  border: "none",
                  padding: 14,
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Done
              </button>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
