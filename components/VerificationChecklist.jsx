"use client";
// components/seller/VerificationChecklist.jsx
// Replaces the old "Verify" modal flow. Money is the LAST step and only appears after admin approval.

import React, { useEffect, useState, useCallback } from "react";
import { auth } from "@/lib/firebaseConfig";
import { Check, X as XIcon, ShieldCheck, Clock } from "lucide-react";

const NAVY = "#0d2244", GOLD = "#b8963e", CREAM = "#f5f0e8", BLUE = "#1d9bf0";

export default function VerificationChecklist({ onPay /* () => start Flutterwave checkout */ }) {
    const [route, setRoute] = useState("paid");
    const [data, setData] = useState(null);
    const [busy, setBusy] = useState(false);
    const [err, setErr] = useState("");

    const call = useCallback(async (method, body) => {
        const token = await auth.currentUser.getIdToken();
        const url = "/api/seller/verification/apply" + (method === "GET" ? `?route=${route}` : "");
        const res = await fetch(url, {
            method, headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
            body: body ? JSON.stringify(body) : undefined,
        });
        return res.json();
    }, [route]);

useEffect(() => {
    setData(null); setErr("");
    call("GET")
        .then((r) => (r?.success === false ? setErr(r.error || "Could not load your progress.") : setData(r)))
        .catch(() => setErr("Could not load your progress."));
}, [call]);
  
    const apply = async () => {
        setBusy(true); setErr("");
        const r = await call("POST", { route });
        if (!r.success) setErr(r.error || "Failed");
        setData(await call("GET"));
        setBusy(false);
    };

    const Row = ({ c }) => (
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: "0.5px solid #f0ebe0" }}>
            <span style={{ width: 18, height: 18, borderRadius: "50%", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: c.ok ? "#16a34a" : "#e5ddd0" }}>
                {c.ok ? <Check size={11} color="#fff" /> : <XIcon size={11} color="#999" />}
            </span>
            <span style={{ flex: 1, fontSize: 13, color: NAVY }}>{c.label}</span>
            {c.need != null && c.have != null && !c.ok && (
                <span style={{ fontSize: 11, color: "#888" }}>{Number(c.have).toLocaleString()} / {Number(c.need).toLocaleString()}</span>
            )}
        </div>
    );

    const status = data?.status;
    const group = (g) => data?.checks?.filter((c) => c.group === g) || [];

    return (
      <div style={{ background: "#fff", padding: 4 }}>
        <p
          style={{
            fontSize: 12,
            color: "#666",
            lineHeight: 1.6,
            margin: "0 0 14px",
          }}
        >
          The badge tells students you are a real, accountable seller. You can't
          buy it on its own: we check who you are and the quality of your work
          first.
        </p>

        <div
          style={{
            display: "flex",
            border: `1px solid ${NAVY}`,
            width: "fit-content",
            marginBottom: 14,
          }}
        >
          {[
            ["paid", "Paid monthly"],
            ["free", "Free"],
          ].map(([k, l]) => (
            <button
              key={k}
              onClick={() => setRoute(k)}
              style={{
                padding: "7px 14px",
                border: "none",
                cursor: "pointer",
                fontWeight: 700,
                fontSize: 12,
                background: route === k ? NAVY : "transparent",
                color: route === k ? "#fff" : NAVY,
              }}
            >
              {l}
            </button>
          ))}
        </div>

        {!data && !err && (
          <p style={{ fontSize: 12, color: "#aaa" }}>Checking your account…</p>
        )}
        {err && <p style={{ fontSize: 12, color: "#dc2626" }}>{err}</p>}

        {data?.checks && (
          <>
            <p
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: NAVY,
                margin: "6px 0 0",
              }}
            >
              1. Identity
            </p>
            {group("identity").map((c) => (
              <Row key={c.id} c={c} />
            ))}
            <p
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: NAVY,
                margin: "14px 0 0",
              }}
            >
              2. Quality
            </p>
            {group("quality").map((c) => (
              <Row key={c.id} c={c} />
            ))}
            <p
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: NAVY,
                margin: "14px 0 6px",
              }}
            >
              3.{" "}
              {route === "paid"
                ? `Pay ₦${data.priceNGN?.toLocaleString()}/month`
                : "Free. Nothing to pay"}
            </p>
            <p style={{ fontSize: 11, color: "#888", margin: "0 0 14px" }}>
              {route === "paid"
                ? "Unlocks after our team approves your identity and work."
                : "Granted once our team approves your application."}
            </p>

            {status === "pending_review" && (
              <div
                style={{
                  background: CREAM,
                  borderLeft: `3px solid ${GOLD}`,
                  padding: 12,
                  display: "flex",
                  gap: 8,
                  fontSize: 12,
                  color: NAVY,
                }}
              >
                <Clock size={14} /> Under review. This usually takes 24–72
                hours.
              </div>
            )}
            {status === "approved_awaiting_payment" && route === "paid" && (
              <button
                onClick={onPay}
                style={{
                  width: "100%",
                  background: BLUE,
                  color: "#fff",
                  border: "none",
                  padding: 12,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                <ShieldCheck size={14} style={{ verticalAlign: "-2px" }} />{" "}
                Approved. Pay ₦{data.priceNGN?.toLocaleString()} to get your
                badge
              </button>
            )}
            {status === "rejected" && (
              <p style={{ fontSize: 12, color: "#dc2626" }}>
                Not approved: {data.rejectedReason || "please contact support."}
              </p>
            )}
            {(!status || status === "none" || status === "rejected") && (
              <button
                onClick={apply}
                disabled={!data.eligible || busy}
                style={{
                  width: "100%",
                  background: data.eligible ? NAVY : "#e5ddd0",
                  color: data.eligible ? "#fff" : "#aaa",
                  border: "none",
                  padding: 12,
                  fontWeight: 700,
                  cursor: data.eligible ? "pointer" : "not-allowed",
                }}
              >
                {busy
                  ? "Submitting…"
                  : data.eligible
                    ? "Submit for review"
                    : "Complete the checklist to apply"}
              </button>
            )}
          </>
        )}
      </div>
    );
}