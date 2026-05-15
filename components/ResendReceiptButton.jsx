"use client";
// components/ResendReceiptButton.jsx
// ─────────────────────────────────────────────────────────────────
// Drop-in "Resend Receipt" button for the Transaction History page.
//
// Usage:
//   <ResendReceiptButton orderId={tx.transactionId} />
//
// It calls /api/resend-receipt with the user's Firebase ID token.
// Shows a compact inline toast — no external toast library needed.
// ─────────────────────────────────────────────────────────────────

import { useState, useCallback, useEffect } from "react";
import { auth } from "@/lib/firebaseConfig";
import { Mail, RefreshCw, CheckCircle, AlertCircle } from "lucide-react";

/* ─── colour tokens (matches LAN Library Navy/Gold theme) ─── */
const NAVY = "#0d2244";
const GOLD = "#b38b59";
const CREAM = "#f8f4ed";

/* ─────────────────────────────────────────────────────────────────
   INLINE TOAST
───────────────────────────────────────────────────────────────── */
function InlineToast({ type = "success", message, onDismiss }) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 4000);
    return () => clearTimeout(t);
  }, [onDismiss]);

  const isSuccess = type === "success";
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "8px",
        padding: "9px 13px",
        background: isSuccess ? "#f0fdf4" : "#fff1f2",
        border: `0.5px solid ${isSuccess ? "#86efac" : "#fca5a5"}`,
        borderRadius: "4px",
        marginTop: "6px",
        animation: "fadeIn 0.2s ease",
      }}
    >
      {isSuccess ? (
        <CheckCircle size={13} style={{ color: "#16a34a", flexShrink: 0 }} />
      ) : (
        <AlertCircle size={13} style={{ color: "#ef4444", flexShrink: 0 }} />
      )}
      <span
        style={{
          fontSize: "12px",
          color: isSuccess ? "#15803d" : "#dc2626",
          fontFamily: "'Lato',sans-serif",
          fontWeight: 600,
        }}
      >
        {message}
      </span>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────────────────────────── */
export default function ResendReceiptButton({
  orderId,
  /** visual variant: "button" (default) | "link" | "icon" */
  variant = "button",
  /** custom className for the outermost wrapper div */
  className = "",
}) {
  const [state, setState] = useState("idle"); // idle | loading | success | error
  const [message, setMessage] = useState("");

  const handleResend = useCallback(async () => {
    if (state === "loading") return;

    setState("loading");
    setMessage("");

    try {
      /* ── 1. Get Firebase ID token ── */
      const currentUser = auth.currentUser;
      if (!currentUser) {
        setState("error");
        setMessage("Please sign in to resend your receipt.");
        return;
      }
      const idToken = await currentUser.getIdToken();

      /* ── 2. Call the API ── */
      const res = await fetch("/api/resend-receipt", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ orderId }),
      });

      const json = await res.json();

      if (!res.ok) {
        // 429 = hit resend limit; surface the exact message from the API
        setState("error");
        setMessage(json.error || "Failed to resend. Please try again.");
        return;
      }

      setState("success");
      setMessage("Receipt sent to your email!");
    } catch (err) {
      setState("error");
      setMessage("Network error — please try again.");
    }
  }, [orderId, state]);

  const reset = useCallback(() => {
    setState("idle");
    setMessage("");
  }, []);

  /* ─── Loading spinner ─── */
  const spinner = (
    <span
      style={{
        display: "inline-block",
        width: "12px",
        height: "12px",
        border: "2px solid currentColor",
        borderTopColor: "transparent",
        borderRadius: "50%",
        animation: "spin 0.65s linear infinite",
        flexShrink: 0,
      }}
    />
  );

  /* ─── Icon variant ─── */
  if (variant === "icon") {
    return (
      <div
        className={className}
        style={{ display: "inline-flex", flexDirection: "column" }}
      >
        <button
          onClick={handleResend}
          disabled={state === "loading"}
          title="Resend receipt"
          style={{
            background: "transparent",
            border: `0.5px solid ${state === "success" ? "#86efac" : "#e5ddd0"}`,
            borderRadius: "4px",
            cursor: state === "loading" ? "wait" : "pointer",
            width: "32px",
            height: "32px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color:
              state === "success"
                ? "#16a34a"
                : state === "error"
                  ? "#ef4444"
                  : "#9ca3af",
            transition: "all 0.15s",
          }}
        >
          {state === "loading" ? (
            spinner
          ) : state === "success" ? (
            <CheckCircle size={14} />
          ) : (
            <RefreshCw size={14} />
          )}
        </button>
        {message && (
          <InlineToast
            type={state === "success" ? "success" : "error"}
            message={message}
            onDismiss={reset}
          />
        )}
        <style>{`@keyframes spin{to{transform:rotate(360deg)}} @keyframes fadeIn{from{opacity:0;transform:translateY(-4px)}to{opacity:1;transform:translateY(0)}}`}</style>
      </div>
    );
  }

  /* ─── Link variant ─── */
  if (variant === "link") {
    return (
      <div
        className={className}
        style={{ display: "inline-flex", flexDirection: "column" }}
      >
        <button
          onClick={handleResend}
          disabled={state === "loading"}
          style={{
            background: "none",
            border: "none",
            cursor: state === "loading" ? "wait" : "pointer",
            color:
              state === "success"
                ? "#16a34a"
                : state === "error"
                  ? "#ef4444"
                  : GOLD,
            fontSize: "12px",
            fontWeight: 700,
            fontFamily: "'Lato',sans-serif",
            letterSpacing: "0.06em",
            padding: 0,
            display: "flex",
            alignItems: "center",
            gap: "5px",
            textDecoration: "underline",
            textUnderlineOffset: "3px",
          }}
        >
          {state === "loading" ? (
            <>{spinner} Sending…</>
          ) : state === "success" ? (
            "✓ Sent"
          ) : (
            "Resend receipt"
          )}
        </button>
        {message && (
          <InlineToast
            type={state === "success" ? "success" : "error"}
            message={message}
            onDismiss={reset}
          />
        )}
        <style>{`@keyframes spin{to{transform:rotate(360deg)}} @keyframes fadeIn{from{opacity:0}to{opacity:1}}`}</style>
      </div>
    );
  }

  /* ─── Default: full button ─── */
  return (
    <div
      className={className}
      style={{ display: "flex", flexDirection: "column" }}
    >
      <button
        onClick={handleResend}
        disabled={state === "loading"}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "7px",
          padding: "9px 16px",
          background:
            state === "success"
              ? "#f0fdf4"
              : state === "error"
                ? "#fff1f2"
                : CREAM,
          border: `0.5px solid ${
            state === "success"
              ? "#86efac"
              : state === "error"
                ? "#fca5a5"
                : "rgba(179,139,89,0.35)"
          }`,
          color:
            state === "success"
              ? "#15803d"
              : state === "error"
                ? "#dc2626"
                : NAVY,
          fontSize: "11px",
          fontWeight: 700,
          fontFamily: "'Lato',sans-serif",
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          cursor: state === "loading" ? "wait" : "pointer",
          transition: "all 0.15s",
          borderRadius: "2px",
          minWidth: "148px",
          opacity: state === "loading" ? 0.7 : 1,
        }}
        onMouseEnter={(e) => {
          if (state === "idle") e.currentTarget.style.background = "#ede8df";
        }}
        onMouseLeave={(e) => {
          if (state === "idle") e.currentTarget.style.background = CREAM;
        }}
      >
        {state === "loading" ? (
          <>{spinner} Sending…</>
        ) : state === "success" ? (
          <>
            <CheckCircle size={13} /> Receipt Sent!
          </>
        ) : state === "error" ? (
          <>
            <AlertCircle size={13} /> Try Again
          </>
        ) : (
          <>
            <Mail size={13} /> Resend Receipt
          </>
        )}
      </button>

      {message && (
        <InlineToast
          type={state === "success" ? "success" : "error"}
          message={message}
          onDismiss={reset}
        />
      )}

      <style>{`
        @keyframes spin    { to { transform: rotate(360deg); } }
        @keyframes fadeIn  { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}
