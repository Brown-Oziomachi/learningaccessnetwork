"use client";

/**
 * BountyApprovalModal
 *
 * Drop-in modal for student-led bounty approval / rejection.
 *
 * Props
 * ─────
 * bountyId    string          Firestore doc ID in `bounties`
 * bountyData  object          The bounty document (already fetched)
 * currentUser object          Firebase Auth user (uid, email, displayName)
 * onClose     () => void      Called when the modal should unmount
 * onUpdateStatus (status, bountyId) => void   Optional callback after write
 *
 * Usage — StudentDashboard (approving)
 * ─────────────────────────────────────
 *   <BountyApprovalModal
 *     bountyId={bounty.id}
 *     bountyData={bounty}
 *     currentUser={user}
 *     onClose={() => setOpen(false)}
 *     onUpdateStatus={(status) => refetch()}
 *   />
 *
 * Usage — SellerDashboard (read-only status view)
 * ────────────────────────────────────────────────
 *   Pass bountyData with status "pending_approval" | "fulfilled" | "disputed"
 *   The modal renders an appropriate read-only state automatically.
 */

import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import {
  doc,
  updateDoc,
  addDoc,
  collection,
  runTransaction,
  serverTimestamp,
  increment,
  getDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebaseConfig";

/* ─── Brand tokens (mirror your existing palette) ─────────────── */
const T = {
  navy:   "#0d2244",
  gold:   "#b8963e",
  goldd:  "#d4aa5a",
  cream:  "#f5f0e8",
  bg:     "#f5f1ea",
  green:  "#16a34a",
  red:    "#dc2626",
  amber:  "#d97706",
};

/* ─── Thin design primitives ───────────────────────────────────── */
const pill = (color, bg) => ({
  display: "inline-flex", alignItems: "center", gap: 5,
  padding: "4px 12px", fontSize: 9, fontWeight: 700,
  letterSpacing: "0.14em", textTransform: "uppercase",
  fontFamily: "'Lato',sans-serif",
  background: bg, color: color, border: `0.5px solid ${color}33`,
});

const btn = (bg, color, disabled) => ({
  display: "inline-flex", alignItems: "center", justifyContent: "center",
  gap: 8, padding: "12px 24px", border: "none", cursor: disabled ? "not-allowed" : "pointer",
  fontSize: 12, fontWeight: 700, letterSpacing: "0.09em", textTransform: "uppercase",
  fontFamily: "'Lato',sans-serif", background: disabled ? "#e5ddd0" : bg,
  color: disabled ? "#aaa" : color, transition: "all .18s", opacity: disabled ? 0.6 : 1,
  minWidth: 140,
});

/* ─── File preview ─────────────────────────────────────────────── */
function FilePreview({ fileUrl, bookId }) {
  const [mode, setMode] = useState("embed"); // "embed" | "link" | "none"

  // Try to resolve a Google Drive embed URL
  const embedUrl = (() => {
    if (!fileUrl) return null;
    if (fileUrl.includes("drive.google.com")) {
      const m = fileUrl.match(/[-\w]{25,}/);
      if (m) return `https://drive.google.com/file/d/${m[0]}/preview`;
    }
    if (fileUrl.endsWith(".pdf")) return fileUrl;
    return null;
  })();

  if (!fileUrl && !bookId) return (
    <div style={{ background: T.cream, border: `0.5px dashed rgba(184,150,62,.4)`, height: 180, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10 }}>
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={T.gold} strokeWidth="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
      <p style={{ fontSize: 12, color: "#aaa", fontFamily: "'Lato',sans-serif", margin: 0 }}>No file attached yet</p>
    </div>
  );

  if (mode === "embed" && embedUrl) return (
    <div style={{ position: "relative", background: "#000" }}>
      <iframe
        src={embedUrl}
        title="Submitted document preview"
        style={{ width: "100%", height: 340, border: "none", display: "block" }}
        onError={() => setMode("link")}
        allow="autoplay"
      />
      <button
        onClick={() => setMode("link")}
        style={{ position: "absolute", top: 8, right: 8, background: "rgba(0,0,0,.55)", border: "none", color: "#fff", fontSize: 10, fontWeight: 700, padding: "5px 10px", cursor: "pointer", fontFamily: "'Lato',sans-serif", letterSpacing: "0.08em" }}
      >
        OPEN FULL ↗
      </button>
    </div>
  );

  return (
    <div style={{ background: T.cream, border: `0.5px solid rgba(184,150,62,.25)`, padding: "18px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ width: 40, height: 40, background: T.navy, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={T.gold} strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
        </div>
        <div>
          <p style={{ fontSize: 12, fontWeight: 700, color: T.navy, fontFamily: "'Lato',sans-serif", margin: "0 0 2px" }}>Submitted Document</p>
          <p style={{ fontSize: 10, color: "#888", fontFamily: "'Lato',sans-serif", margin: 0 }}>Click to open in a new tab for full review</p>
        </div>
      </div>
      <a
        href={fileUrl || `/book/preview?id=${bookId}`}
        target="_blank"
        rel="noopener noreferrer"
        style={{ ...btn(T.navy, "#fff", false), minWidth: "auto", padding: "9px 16px", textDecoration: "none", fontSize: 10 }}
      >
        Open File ↗
      </a>
    </div>
  );
}

/* ─── Status read-only banner (for sellers checking progress) ── */
function StatusBanner({ status, rejectionReason }) {
  const MAP = {
    fulfilled:        { icon: "✅", label: "Approved & Paid Out", color: T.green, bg: "rgba(22,163,74,.06)" },
    pending_approval: { icon: "⏳", label: "Awaiting Student Review", color: T.amber, bg: "rgba(217,119,6,.06)" },
    disputed:         { icon: "🚩", label: "Disputed — Under Admin Review", color: T.red, bg: "rgba(220,38,38,.06)" },
  };
  const s = MAP[status] || { icon: "ℹ️", label: status, color: "#888", bg: T.cream };

  return (
    <div style={{ background: s.bg, border: `0.5px solid ${s.color}33`, padding: "16px 20px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: rejectionReason ? 8 : 0 }}>
        <span style={{ fontSize: 20 }}>{s.icon}</span>
        <div>
          <p style={{ fontSize: 13, fontWeight: 700, color: s.color, fontFamily: "'Lato',sans-serif", margin: 0 }}>{s.label}</p>
          <p style={{ fontSize: 10, color: "#888", fontFamily: "'Lato',sans-serif", margin: "2px 0 0" }}>
            {status === "pending_approval" && "The student has been notified and will review within 48 hours."}
            {status === "fulfilled" && "Escrow has been released. Check your wallet balance."}
            {status === "disputed" && "An admin has been notified. You'll receive an update within 24–48 hours."}
          </p>
        </div>
      </div>
      {rejectionReason && (
        <div style={{ background: "rgba(220,38,38,.07)", border: "0.5px solid rgba(220,38,38,.2)", padding: "10px 14px", marginTop: 8 }}>
          <p style={{ fontSize: 10, fontWeight: 700, color: T.red, fontFamily: "'Lato',sans-serif", margin: "0 0 3px", textTransform: "uppercase", letterSpacing: "0.1em" }}>Student's reason</p>
          <p style={{ fontSize: 12, color: "#555", fontFamily: "'Lato',sans-serif", margin: 0, lineHeight: 1.7 }}>{rejectionReason}</p>
        </div>
      )}
    </div>
  );
}

/* ─── Spinner ──────────────────────────────────────────────────── */
function Spinner({ size = 16, color = "#fff" }) {
  return (
    <span style={{
      width: size, height: size,
      border: `2px solid ${color}44`,
      borderTopColor: color,
      borderRadius: "50%",
      display: "inline-block",
      animation: "bounty-spin .7s linear infinite",
      flexShrink: 0,
    }} />
  );
}

/* ═══════════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════════ */
export default function BountyApprovalModal({
  bountyId,
  bountyData,
  currentUser,
  onClose,
  onUpdateStatus,
}) {
  /* ── View mode ── */
  const isAuthor  = currentUser?.uid === bountyData?.claimedBy;
  const isStudent = currentUser?.uid === bountyData?.postedById;
  const readOnly  = !isStudent; // sellers / other visitors see status only

  /* ── Local state ── */
  const [view,           setView]           = useState("review");   // "review" | "reject_form" | "done"
  const [rejectReason,   setRejectReason]   = useState("");
  const [loading,        setLoading]        = useState(false);
  const [error,          setError]          = useState("");
  const [localStatus,    setLocalStatus]    = useState(bountyData?.status || "pending_approval");
  const [localReason,    setLocalReason]    = useState(bountyData?.disputeReason || "");

  const payout     = Math.round((bountyData?.reward || 0) * 0.8);
  const platformFee = (bountyData?.reward || 0) - payout;

  /* ── Lock body scroll ── */
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  /* ─────────────────────────────────────────────────────────────
     APPROVE — release escrow, credit author
  ───────────────────────────────────────────────────────────── */
  const handleApprove = useCallback(async () => {
    if (!bountyData?.claimedBy) {
      setError("No author has claimed this bounty yet.");
      return;
    }
    setLoading(true);
    setError("");

    try {
      await runTransaction(db, async (txn) => {
        /* ── reads first ── */
        const authorRef   = doc(db, "sellers", bountyData.claimedBy);
        const platformRef = doc(db, "sellers", "LAN_LIBRARY_PLATFORM");
        const bountyRef   = doc(db, "bounties", bountyId);

        const [authorSnap, platformSnap, bountySnap] = await Promise.all([
          txn.get(authorRef),
          txn.get(platformRef),
          txn.get(bountyRef),
        ]);

        /* ── guard: already fulfilled ── */
        if (bountySnap.data()?.status === "fulfilled") {
          throw new Error("ALREADY_FULFILLED");
        }

        /* ── writes ── */

        // 1 · mark bounty fulfilled
        txn.update(bountyRef, {
          status:              "fulfilled",
          escrowStatus:        "released",
          escrowReleasedAt:    serverTimestamp(),
          escrowReleasedBy:    currentUser?.email || currentUser?.uid || "student",
          approvedById:        currentUser?.uid,
          approvedByName:      currentUser?.displayName || currentUser?.email || "Student",
          authorPayout:        payout,
          platformFee,
        });

        // 2 · credit author (80 %)
        if (authorSnap.exists()) {
          txn.update(authorRef, {
            accountBalance: (authorSnap.data().accountBalance || 0) + payout,
            totalEarnings:  (authorSnap.data().totalEarnings  || 0) + payout,
            booksSold:      (authorSnap.data().booksSold      || 0) + 1,
            updatedAt:      serverTimestamp(),
          });
        } else {
          txn.set(authorRef, {
            accountBalance: payout,
            totalEarnings:  payout,
            booksSold:      1,
            sellerId:       bountyData.claimedBy,
            createdAt:      serverTimestamp(),
            updatedAt:      serverTimestamp(),
          });
        }

        // 3 · credit platform (20 %)
        if (platformSnap.exists()) {
          txn.update(platformRef, {
            accountBalance:     (platformSnap.data().accountBalance     || 0) + platformFee,
            totalFeesCollected: (platformSnap.data().totalFeesCollected || 0) + platformFee,
            updatedAt:          serverTimestamp(),
          });
        } else {
          txn.set(platformRef, {
            accountBalance:     platformFee,
            totalFeesCollected: platformFee,
            createdAt:          serverTimestamp(),
            updatedAt:          serverTimestamp(),
          });
        }

        // 4 · platform fee ledger
        txn.set(doc(collection(db, "platformFees")), {
          source:                "bounty_approval",
          bountyId,
          bountyTitle:           bountyData.title,
          sellerId:              bountyData.claimedBy,
          sellerName:            bountyData.claimedByName || "",
          postedBy:              bountyData.postedBy || "",
          salePrice:             bountyData.reward,
          fee:                   platformFee,
          sellerPayout:          payout,
          disbursedToFlutterwave: false,
          createdAt:             serverTimestamp(),
          approvedById:          currentUser?.uid,
        });

        // 5 · notify author
        txn.set(doc(collection(db, "notifications")), {
          userId:    bountyData.claimedBy,
          type:      "bounty_paid",
          title:     `Bounty approved — ${bountyData.title}`,
          message:   `Great news! The student accepted your submission. ₦${payout.toLocaleString()} has been credited to your wallet.`,
          amount:    payout,
          bountyId,
          createdAt: serverTimestamp(),
          read:      false,
        });

        // 6 · notify student (confirmation)
        txn.set(doc(collection(db, "notifications")), {
          userId:    currentUser?.uid,
          type:      "bounty_fulfilled",
          title:     `Bounty fulfilled — ${bountyData.title}`,
          message:   `You approved the submission and your document is now available in your library.`,
          bountyId,
          createdAt: serverTimestamp(),
          read:      false,
        });
      });

      setLocalStatus("fulfilled");
      setView("done");
      onUpdateStatus?.("fulfilled", bountyId);
    } catch (e) {
      if (e.message === "ALREADY_FULFILLED") {
        setError("This bounty was already approved.");
      } else {
        setError(`Approval failed: ${e.message}. Please try again or contact support.`);
      }
    } finally {
      setLoading(false);
    }
  }, [bountyId, bountyData, currentUser, payout, platformFee, onUpdateStatus]);

  /* ─────────────────────────────────────────────────────────────
     REJECT — flag as disputed, alert admin
  ───────────────────────────────────────────────────────────── */
  const handleReject = useCallback(async () => {
    if (!rejectReason.trim()) {
      setError("Please provide a reason so the author can improve their submission.");
      return;
    }
    setLoading(true);
    setError("");

    try {
      const bountyRef = doc(db, "bounties", bountyId);

      // 1 · update bounty
      await updateDoc(bountyRef, {
        status:          "disputed",
        escrowStatus:    "held",
        disputeReason:   rejectReason.trim(),
        disputedAt:      serverTimestamp(),
        disputedById:    currentUser?.uid,
        disputedByName:  currentUser?.displayName || currentUser?.email || "Student",
      });

      // 2 · admin alert in `adminNotifications`
      await addDoc(collection(db, "adminNotifications"), {
        type:    "bounty_dispute",
        title:   `⚠️ Bounty Disputed — ${bountyData.title}`,
        message: `Student rejected the submission. Reason: ${rejectReason.trim()}`,
        bountyId,
        bountyTitle:    bountyData.title,
        disputedById:   currentUser?.uid,
        disputedByName: currentUser?.displayName || currentUser?.email,
        authorId:       bountyData.claimedBy || null,
        authorName:     bountyData.claimedByName || null,
        reward:         bountyData.reward,
        read:           false,
        createdAt:      serverTimestamp(),
        notifyEmail:    "lanlibrarydocs@gmail.com",
      });

      // 3 · notify author
      await addDoc(collection(db, "notifications"), {
        userId:    bountyData.claimedBy,
        type:      "bounty_disputed",
        title:     `Submission disputed — ${bountyData.title}`,
        message:   `The student flagged your submission. Reason: "${rejectReason.trim()}". An admin will review and get back to you within 24–48 hours.`,
        bountyId,
        createdAt: serverTimestamp(),
        read:      false,
      });

      // 4 · notify student (confirmation)
      await addDoc(collection(db, "notifications"), {
        userId:    currentUser?.uid,
        type:      "bounty_dispute_filed",
        title:     "Dispute filed",
        message:   `Your dispute for "${bountyData.title}" has been lodged. An admin will review within 24–48 hours and reach out to both parties.`,
        bountyId,
        createdAt: serverTimestamp(),
        read:      false,
      });

      setLocalStatus("disputed");
      setLocalReason(rejectReason.trim());
      setView("done");
      onUpdateStatus?.("disputed", bountyId);
    } catch (e) {
      setError(`Failed to file dispute: ${e.message}`);
    } finally {
      setLoading(false);
    }
  }, [bountyId, bountyData, currentUser, rejectReason, onUpdateStatus]);

  /* ────────────────────── render ───────────────────────────── */
  const modal = (
    <>
      {/* keyframes */}
      <style>{`
        @keyframes bounty-spin  { to { transform: rotate(360deg); } }
        @keyframes bounty-in    { from { opacity: 0; transform: translateY(22px) scale(.98); } to { opacity: 1; transform: none; } }
        @keyframes bounty-fade  { from { opacity: 0; } to { opacity: 1; } }
        .bam-scroll::-webkit-scrollbar { width: 3px; }
        .bam-scroll::-webkit-scrollbar-thumb { background: #e5ddd0; border-radius: 4px; }
      `}</style>

      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "fixed", inset: 0, zIndex: 9000,
          background: "rgba(7,19,31,.72)",
          backdropFilter: "blur(5px)",
          animation: "bounty-fade .22s ease both",
        }}
      />

      {/* Panel */}
      <div
        style={{
          position: "fixed", inset: 0, zIndex: 9001,
          display: "flex", alignItems: "center", justifyContent: "center",
          padding: "16px", pointerEvents: "none",
        }}
      >
        <div
          onClick={e => e.stopPropagation()}
          style={{
            background: "#fff",
            border: "0.5px solid #e5ddd0",
            width: "100%", maxWidth: 560,
            maxHeight: "92vh",
            display: "flex", flexDirection: "column",
            animation: "bounty-in .32s cubic-bezier(.4,0,.2,1) both",
            pointerEvents: "all",
          }}
        >

          {/* ── Header ── */}
          <div style={{
            background: T.navy,
            backgroundImage: "radial-gradient(rgba(184,150,62,.07) 1px,transparent 1px)",
            backgroundSize: "20px 20px",
            padding: "20px 22px",
            display: "flex", alignItems: "flex-start", justifyContent: "space-between",
            flexShrink: 0,
          }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              {/* Status indicator */}
              <div style={{ marginBottom: 10 }}>
                {localStatus === "pending_approval" && (
                  <span style={pill(T.amber, "rgba(217,119,6,.14)")}>
                    <span style={{ width: 5, height: 5, borderRadius: "50%", background: T.amber, animation: "bounty-fade 1.5s ease-in-out infinite alternate" }} />
                    Awaiting Review
                  </span>
                )}
                {localStatus === "fulfilled" && (
                  <span style={pill(T.green, "rgba(22,163,74,.14)")}>
                    <span style={{ width: 5, height: 5, borderRadius: "50%", background: T.green }} />
                    Approved &amp; Paid
                  </span>
                )}
                {localStatus === "disputed" && (
                  <span style={pill(T.red, "rgba(220,38,38,.14)")}>
                    <span style={{ width: 5, height: 5, borderRadius: "50%", background: T.red }} />
                    Under Dispute
                  </span>
                )}
              </div>

              <h2 style={{
                fontFamily: "'Playfair Display',serif",
                fontSize: 18, fontWeight: 700,
                color: "#fff", lineHeight: 1.28, margin: "0 0 6px",
              }}>
                {bountyData?.title || "Bounty Submission"}
              </h2>

              <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
                {bountyData?.university && (
                  <span style={{ fontSize: 10, color: T.gold, fontFamily: "'Lato',sans-serif", fontWeight: 700 }}>
                    🏛 {bountyData.university}
                  </span>
                )}
                {bountyData?.department && (
                  <span style={{ fontSize: 10, color: "rgba(245,240,232,.45)", fontFamily: "'Lato',sans-serif" }}>
                    · {bountyData.department}
                  </span>
                )}
              </div>
            </div>

            <button
              onClick={onClose}
              style={{
                background: "rgba(255,255,255,.08)", border: "0.5px solid rgba(255,255,255,.12)",
                width: 30, height: 30, cursor: "pointer", color: "rgba(255,255,255,.55)",
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0, marginLeft: 12, fontSize: 16,
              }}
              aria-label="Close"
            >
              ×
            </button>
          </div>

          {/* ── Reward bar ── */}
          <div style={{
            background: T.cream,
            borderBottom: "0.5px solid #e5ddd0",
            padding: "10px 22px",
            display: "flex", alignItems: "center",
            justifyContent: "space-between", gap: 12, flexWrap: "wrap",
            flexShrink: 0,
          }}>
            <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
              <div>
                <p style={{ fontSize: 8, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: "#aaa", fontFamily: "'Lato',sans-serif", margin: "0 0 2px" }}>Total Escrow</p>
                <p style={{ fontFamily: "'Playfair Display',serif", fontSize: 20, fontWeight: 700, color: T.navy, margin: 0 }}>
                  ₦{Number(bountyData?.reward || 0).toLocaleString("en-NG")}
                </p>
              </div>
              <div>
                <p style={{ fontSize: 8, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: "#aaa", fontFamily: "'Lato',sans-serif", margin: "0 0 2px" }}>Author Payout (80 %)</p>
                <p style={{ fontFamily: "'Playfair Display',serif", fontSize: 20, fontWeight: 700, color: T.green, margin: 0 }}>
                  ₦{payout.toLocaleString("en-NG")}
                </p>
              </div>
            </div>
            {bountyData?.claimedByName && (
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 28, height: 28, borderRadius: "50%", background: T.navy, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: T.gold, fontFamily: "'Playfair Display',serif" }}>
                    {(bountyData.claimedByName || "?").slice(0, 2).toUpperCase()}
                  </span>
                </div>
                <div>
                  <p style={{ fontSize: 8, color: "#aaa", fontFamily: "'Lato',sans-serif", margin: "0 0 1px", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 700 }}>Submitted by</p>
                  <p style={{ fontSize: 11, fontWeight: 700, color: T.navy, fontFamily: "'Lato',sans-serif", margin: 0 }}>{bountyData.claimedByName}</p>
                </div>
              </div>
            )}
          </div>

          {/* ── Scrollable body ── */}
          <div
            className="bam-scroll"
            style={{ flex: 1, overflowY: "auto", padding: "20px 22px", display: "flex", flexDirection: "column", gap: 16 }}
          >

            {/* ════ READ-ONLY: status banner for non-students ════ */}
            {(readOnly || view === "done") && (
              <StatusBanner status={localStatus} rejectionReason={localReason} />
            )}

            {/* ════ FILE PREVIEW ════ */}
            <div>
              <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: T.gold, fontFamily: "'Lato',sans-serif", margin: "0 0 8px" }}>
                Submitted Document
              </p>
              <FilePreview
                fileUrl={bountyData?.submittedFileUrl || bountyData?.fileUrl || null}
                bookId={bountyData?.linkedBookId || null}
              />
            </div>

            {/* ════ AUTHOR NOTE ════ */}
            {bountyData?.submissionNote && (
              <div style={{ background: T.cream, border: `0.5px solid rgba(184,150,62,.25)`, borderLeft: `3px solid ${T.gold}`, padding: "12px 16px" }}>
                <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: T.gold, fontFamily: "'Lato',sans-serif", margin: "0 0 6px" }}>Author's note</p>
                <p style={{ fontSize: 12, color: "#555", fontFamily: "'Lato',sans-serif", lineHeight: 1.75, margin: 0 }}>{bountyData.submissionNote}</p>
              </div>
            )}

            {/* ════ REJECTION FORM ════ */}
            {!readOnly && view === "reject_form" && (
              <div>
                <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: T.red, fontFamily: "'Lato',sans-serif", margin: "0 0 10px" }}>
                  Reason for Rejection
                </p>
                <textarea
                  value={rejectReason}
                  onChange={e => setRejectReason(e.target.value)}
                  placeholder="e.g. The file is corrupted and cannot be opened. / These notes cover the wrong semester. / The content is incomplete — only 3 chapters out of 10 were included."
                  rows={4}
                  style={{
                    width: "100%", padding: "12px 14px",
                    border: `0.5px solid ${error ? T.red : "#e5ddd0"}`,
                    fontSize: 13, fontFamily: "'Lato',sans-serif",
                    color: T.navy, background: T.bg, resize: "vertical",
                    outline: "none", lineHeight: 1.65, boxSizing: "border-box",
                    transition: "border-color .18s",
                  }}
                  onFocus={e => e.target.style.borderColor = T.gold}
                  onBlur={e => e.target.style.borderColor = error ? T.red : "#e5ddd0"}
                />
                <p style={{ fontSize: 10, color: "#aaa", fontFamily: "'Lato',sans-serif", margin: "6px 0 0", lineHeight: 1.65 }}>
                  Be specific. Your reason is shared with the author and will be reviewed by an admin.
                  Funds remain in escrow until the dispute is resolved.
                </p>
              </div>
            )}

            {/* ════ INSTRUCTIONS (student, review view) ════ */}
            {!readOnly && view === "review" && localStatus === "pending_approval" && (
              <div style={{ display: "flex", gap: 10, padding: "12px 14px", background: "rgba(13,34,68,.04)", border: "0.5px solid rgba(13,34,68,.1)" }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={T.navy} strokeWidth="2" style={{ flexShrink: 0, marginTop: 1 }}>
                  <rect x="3" y="11" width="18" height="11" rx="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
                <p style={{ fontSize: 11, color: "#555", fontFamily: "'Lato',sans-serif", margin: 0, lineHeight: 1.7 }}>
                  Review the document carefully before approving. Once you click <strong style={{ color: T.navy }}>Approve</strong>, escrow releases automatically and the transaction is irreversible.
                  If the file is incorrect or incomplete, click <strong style={{ color: T.red }}>Dispute</strong>.
                </p>
              </div>
            )}

            {/* ════ ERROR ════ */}
            {error && (
              <div style={{ display: "flex", gap: 10, padding: "12px 14px", background: "rgba(220,38,38,.06)", border: "0.5px solid rgba(220,38,38,.22)" }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={T.red} strokeWidth="2" style={{ flexShrink: 0, marginTop: 1 }}>
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                <p style={{ fontSize: 11, color: T.red, fontFamily: "'Lato',sans-serif", margin: 0, lineHeight: 1.65 }}>{error}</p>
              </div>
            )}

          </div>

          {/* ── Footer actions ── */}
          {!readOnly && view !== "done" && (
            <div style={{
              padding: "16px 22px",
              borderTop: "0.5px solid #f0ebe0",
              display: "flex", gap: 10, flexWrap: "wrap",
              flexShrink: 0, background: "#fff",
            }}>
              {view === "review" && localStatus === "pending_approval" && (
                <>
                  {/* Dispute */}
                  <button
                    onClick={() => { setView("reject_form"); setError(""); }}
                    style={btn("rgba(220,38,38,.07)", T.red, loading)}
                    disabled={loading}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2"/>
                      <line x1="12" y1="8" x2="12" y2="12"/>
                      <line x1="12" y1="16" x2="12.01" y2="16"/>
                    </svg>
                    Dispute
                  </button>

                  {/* Approve */}
                  <button
                    onClick={handleApprove}
                    style={{ ...btn(T.gold, T.navy, loading), flex: 1 }}
                    disabled={loading}
                  >
                    {loading ? (
                      <><Spinner color={T.navy} /> Releasing Escrow…</>
                    ) : (
                      <>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                        Approve &amp; Release ₦{payout.toLocaleString("en-NG")}
                      </>
                    )}
                  </button>
                </>
              )}

              {view === "reject_form" && (
                <>
                  {/* Back */}
                  <button
                    onClick={() => { setView("review"); setError(""); }}
                    style={btn(T.cream, T.navy, loading)}
                    disabled={loading}
                  >
                    ← Back
                  </button>

                  {/* Confirm dispute */}
                  <button
                    onClick={handleReject}
                    style={{ ...btn(T.red, "#fff", loading || !rejectReason.trim()), flex: 1 }}
                    disabled={loading || !rejectReason.trim()}
                  >
                    {loading ? (
                      <><Spinner /> Filing Dispute…</>
                    ) : (
                      <>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2"/>
                        </svg>
                        Confirm Dispute &amp; Notify Admin
                      </>
                    )}
                  </button>
                </>
              )}
            </div>
          )}

          {/* ── Done footer ── */}
          {view === "done" && (
            <div style={{ padding: "16px 22px", borderTop: "0.5px solid #f0ebe0", flexShrink: 0 }}>
              <button
                onClick={onClose}
                style={{ ...btn(T.navy, "#fff", false), width: "100%" }}
              >
                Close
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );

  /* Portal to avoid stacking context issues */
  if (typeof document === "undefined") return null;
  return createPortal(modal, document.body);
}