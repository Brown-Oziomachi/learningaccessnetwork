"use client";

/**
 * StudyBuddyTracker
 * ─────────────────
 * Drop this anywhere inside your BookPreviewPage.
 *
 * Props:
 *   bookId  – the current book's ID (required)
 *   userId  – the current user's UID (required)
 *   userName – display name of the current user
 *   userPhoto – optional photo URL
 *
 * Firebase collections used:
 *   /study_presence/{bookId}_{userId}  – live presence docs
 *
 * Security rules needed (paste into Firebase Console):
 *   match /study_presence/{presenceId} {
 *     allow read, write: if request.auth != null;
 *   }
 */

import { useState, useEffect, useRef } from "react";
import { db } from "@/lib/firebaseConfig";
import {
  doc,
  setDoc,
  deleteDoc,
  collection,
  query,
  where,
  onSnapshot,
  serverTimestamp,
  addDoc,
} from "firebase/firestore";
import { Users, Send, X, MessageCircle, BookOpen, Zap } from "lucide-react";

const NAVY = "#0d2244";
const GOLD = "#b8963e";
const GOLDD = "#d4aa5a";
const CREAM = "#f5f0e8";
const BG = "#ede8df";

/* ─── Avatar helper ─── */
const PALETTES = [
  { bg: NAVY, text: GOLDD },
  { bg: "#1a3a5c", text: CREAM },
  { bg: "#2c1810", text: GOLDD },
  { bg: "#1a2c1a", text: "#a8d5a2" },
  { bg: "#5c1a3a", text: GOLDD },
];
const getPalette = (name = "?") =>
  PALETTES[name.charCodeAt(0) % PALETTES.length];
const getInitials = (name = "?") => {
  const p = name.trim().split(" ").filter(Boolean);
  return p.length > 1
    ? (p[0][0] + p[p.length - 1][0]).toUpperCase()
    : (p[0]?.[0] || "?").toUpperCase();
};

function MiniAvatar({ name = "?", photo, size = 28, online = false }) {
  const pal = getPalette(name);
  return (
    <div style={{ position: "relative", flexShrink: 0 }}>
      {photo ? (
        <img
          src={photo}
          alt={name}
          style={{
            width: size,
            height: size,
            borderRadius: "50%",
            objectFit: "cover",
            border: "1.5px solid #fff",
          }}
          onError={(e) => (e.target.style.display = "none")}
        />
      ) : (
        <div
          style={{
            width: size,
            height: size,
            borderRadius: "50%",
            background: pal.bg,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: "1.5px solid #fff",
          }}
        >
          <span
            style={{
              color: pal.text,
              fontSize: size * 0.34,
              fontWeight: 700,
              fontFamily: "'Playfair Display',serif",
            }}
          >
            {getInitials(name)}
          </span>
        </div>
      )}
      {online && (
        <div
          style={{
            position: "absolute",
            bottom: 0,
            right: 0,
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: "#16a34a",
            border: "1.5px solid #fff",
          }}
        />
      )}
    </div>
  );
}

/* ─── Study Request Modal ─── */
function StudyRequestModal({
  target,
  currentUser,
  bookId,
  bookTitle,
  onClose,
  onSent,
}) {
  const [msg, setMsg] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSend = async () => {
    if (!msg.trim() || sending) return;
    setSending(true);
    try {
      const dmPath = `dm_messages/${[currentUser.uid, target.userId].sort().join("_")}/messages`;
      await addDoc(collection(db, dmPath), {
        text: `📚 Study Request for "${bookTitle}": ${msg.trim()}`,
        senderId: currentUser.uid,
        senderName: currentUser.name,
        senderPhoto: currentUser.photo || null,
        createdAt: serverTimestamp(),
        type: "study_request",
        bookId,
        bookTitle,
      });
      setSent(true);
      setTimeout(() => {
        onSent?.();
        onClose();
      }, 1800);
    } catch (e) {
      console.error("study request send:", e);
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <style>{`
        @keyframes modalSlideIn{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
        .srm-overlay{position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:9000;
          display:flex;align-items:center;justify-content:center;padding:16px;}
        .srm-card{background:${NAVY};width:100%;max-width:400px;overflow:hidden;
          animation:modalSlideIn .28s cubic-bezier(.4,0,.2,1) both;}
        .srm-input{width:100%;background:rgba(255,255,255,.07);border:0.5px solid rgba(255,255,255,.15);
          padding:11px 13px;color:#fff;font-size:13px;resize:none;outline:none;
          font-family:'Lato',sans-serif;line-height:1.55;box-sizing:border-box;}
        .srm-input::placeholder{color:rgba(255,255,255,.3);}
        .srm-input:focus{border-color:${GOLD};}
        .srm-send{flex:1;padding:12px;background:${GOLD};border:none;color:${NAVY};
          font-size:12px;font-weight:700;cursor:pointer;font-family:'Lato',sans-serif;
          letter-spacing:.04em;transition:opacity .15s;}
        .srm-send:disabled{opacity:.45;cursor:not-allowed;}
        .srm-cancel{flex:1;padding:12px;border:0.5px solid rgba(255,255,255,.2);
          background:transparent;color:rgba(255,255,255,.6);font-size:12px;font-weight:700;
          cursor:pointer;font-family:'Lato',sans-serif;}
      `}</style>
      <div className="srm-overlay" onClick={onClose}>
        <div className="srm-card" onClick={(e) => e.stopPropagation()}>
          {/* Header */}
          <div
            style={{
              padding: "18px 20px 14px",
              borderBottom: "0.5px solid rgba(255,255,255,.1)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 10,
              }}
            >
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: GOLD,
                  letterSpacing: ".14em",
                  textTransform: "uppercase",
                  fontFamily: "'Lato',sans-serif",
                }}
              >
                Study Request
              </span>
              <button
                onClick={onClose}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "rgba(255,255,255,.5)",
                  padding: 2,
                }}
              >
                <X size={16} />
              </button>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <MiniAvatar
                name={target.userName}
                photo={target.userPhoto}
                size={36}
                online
              />
              <div>
                <p
                  style={{
                    fontSize: 14,
                    fontWeight: 700,
                    color: "#fff",
                    margin: 0,
                    fontFamily: "'Playfair Display',serif",
                  }}
                >
                  {target.userName}
                </p>
                <p
                  style={{
                    fontSize: 11,
                    color: "rgba(255,255,255,.4)",
                    margin: 0,
                    fontFamily: "'Lato',sans-serif",
                  }}
                >
                  Studying this book right now
                </p>
              </div>
            </div>
          </div>

          {/* Body */}
          <div style={{ padding: "16px 20px 20px" }}>
            {sent ? (
              <div style={{ textAlign: "center", padding: "20px 0" }}>
                <div
                  style={{
                    width: 44,
                    height: 44,
                    background: "rgba(22,163,74,.15)",
                    border: "0.5px solid rgba(22,163,74,.4)",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto 12px",
                  }}
                >
                  <Send size={18} style={{ color: "#22c55e" }} />
                </div>
                <p
                  style={{
                    fontSize: 14,
                    fontWeight: 700,
                    color: "#86efac",
                    fontFamily: "'Playfair Display',serif",
                    marginBottom: 4,
                  }}
                >
                  Request Sent!
                </p>
                <p
                  style={{
                    fontSize: 12,
                    color: "rgba(255,255,255,.4)",
                    fontFamily: "'Lato',sans-serif",
                  }}
                >
                  {target.userName} will see your message in their DMs.
                </p>
              </div>
            ) : (
              <>
                <div
                  style={{
                    background: "rgba(184,150,62,.08)",
                    border: "0.5px solid rgba(184,150,62,.2)",
                    padding: "8px 12px",
                    marginBottom: 14,
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <BookOpen size={12} style={{ color: GOLD, flexShrink: 0 }} />
                  <span
                    style={{
                      fontSize: 11,
                      color: "rgba(255,255,255,.5)",
                      fontFamily: "'Lato',sans-serif",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    Re: studying together
                  </span>
                </div>
                <textarea
                  autoFocus
                  className="srm-input"
                  rows={3}
                  placeholder={`Hey ${target.userName.split(" ")[0]}, want to study together?`}
                  value={msg}
                  onChange={(e) => setMsg(e.target.value.slice(0, 300))}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                />
                <p
                  style={{
                    fontSize: 9,
                    color: "rgba(255,255,255,.25)",
                    fontFamily: "'Lato',sans-serif",
                    marginTop: 4,
                    marginBottom: 14,
                    textAlign: "right",
                  }}
                >
                  {msg.length}/300
                </p>
                <div style={{ display: "flex", gap: 10 }}>
                  <button className="srm-cancel" onClick={onClose}>
                    Cancel
                  </button>
                  <button
                    className="srm-send"
                    onClick={handleSend}
                    disabled={!msg.trim() || sending}
                  >
                    {sending ? "Sending…" : "Send Request →"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

/* ════════════════════════════════════════════
   MAIN EXPORT: StudyBuddyTracker
════════════════════════════════════════════ */
export default function StudyBuddyTracker({
  bookId,
  userId,
  userName = "Student",
  userPhoto = null,
  bookTitle = "",
}) {
  const [peers, setPeers] = useState([]); // other students present
  const [expanded, setExpanded] = useState(false);
  const [connectTarget, setConnectTarget] = useState(null); // student to send DM
  const [toastMsg, setToastMsg] = useState("");
  const presenceDocRef = useRef(null);

  /* ── Register presence + listen ── */
  useEffect(() => {
    if (!bookId || !userId) return;

    const pId = `${bookId}_${userId}`;
    const pRef = doc(db, "study_presence", pId);
    presenceDocRef.current = pRef;

    // Write presence
    setDoc(pRef, {
      bookId,
      userId,
      userName,
      userPhoto: userPhoto || null,
      joinedAt: serverTimestamp(),
    }).catch((e) => console.warn("presence write:", e));

    // Listen to all presence for this book
    const q = query(
      collection(db, "study_presence"),
      where("bookId", "==", bookId),
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        const others = snap.docs
          .map((d) => d.data())
          .filter((d) => d.userId !== userId);
        setPeers(others);
      },
      (err) => console.warn("study_presence listener:", err.code),
    );

    // Cleanup on unmount → remove presence
    return () => {
      unsub();
      if (presenceDocRef.current) {
        deleteDoc(presenceDocRef.current).catch(() => {});
      }
    };
  }, [bookId, userId, userName, userPhoto]);

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 3000);
  };

  if (peers.length === 0) {
    // Still show a subtle "you're here" badge
    return (
      <>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=Lato:wght@400;700&display=swap');
          @keyframes soloPulse{0%,100%{box-shadow:0 0 0 0 rgba(13,34,68,.2)}50%{box-shadow:0 0 0 6px rgba(13,34,68,0)}}
        `}</style>
        <div
          style={{
            margin: "0 16px 0",
            background: "#fff",
            border: "0.5px solid #e5ddd0",
            padding: "12px 14px",
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <div
            style={{
              width: 32,
              height: 32,
              background: CREAM,
              border: "0.5px solid #e5ddd0",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <BookOpen size={14} style={{ color: "#ccc" }} />
          </div>
          <div>
            <p
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: "#aaa",
                margin: 0,
                fontFamily: "'Lato',sans-serif",
                letterSpacing: ".04em",
              }}
            >
              You're studying this alone right now
            </p>
            <p
              style={{
                fontSize: 10,
                color: "#ccc",
                margin: 0,
                fontFamily: "'Lato',sans-serif",
              }}
            >
              Others who open this page will appear here
            </p>
          </div>
        </div>
      </>
    );
  }

  const count = peers.length;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=Lato:wght@400;700&display=swap');
        @keyframes buddyPulse{
          0%{box-shadow:0 0 0 0 rgba(22,163,74,.5);}
          70%{box-shadow:0 0 0 10px rgba(22,163,74,0);}
          100%{box-shadow:0 0 0 0 rgba(22,163,74,0);}
        }
        @keyframes dotPulse{0%,100%{opacity:1}50%{opacity:.3}}
        @keyframes slideDown{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)}}
        .sbt-banner{
          margin:0 16px;
          border:1.5px solid rgba(22,163,74,.35);
          background:#fff;
          overflow:hidden;
          transition:border-color .2s;
        }
        .sbt-banner:hover{border-color:rgba(22,163,74,.6);}
        .sbt-peer{
          display:flex;align-items:center;gap:10px;
          padding:10px 14px;
          border-top:0.5px solid #f0ebe0;
          transition:background .15s;
        }
        .sbt-peer:hover{background:${BG};}
        .connect-btn{
          font-size:9px;font-weight:700;padding:4px 10px;
          border:0.5px solid ${GOLD};background:#fff;color:${NAVY};
          cursor:pointer;font-family:'Lato',sans-serif;letter-spacing:.06em;
          text-transform:uppercase;transition:all .15s;
          display:flex;align-items:center;gap:4px;
        }
        .connect-btn:hover{background:${GOLD};color:${NAVY};}
        .sbt-expanded{animation:slideDown .2s cubic-bezier(.4,0,.2,1) both;}
      `}</style>

      <div className="sbt-banner">
        {/* ── Banner header ── */}
        <button
          onClick={() => setExpanded((e) => !e)}
          style={{
            width: "100%",
            border: "none",
            background: "transparent",
            padding: "12px 14px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 12,
            textAlign: "left",
          }}
        >
          {/* Pulse dot */}
          <div
            style={{
              width: 10,
              height: 10,
              borderRadius: "50%",
              background: "#16a34a",
              animation: "buddyPulse 2s ease-out infinite",
              flexShrink: 0,
            }}
          />

          {/* Stacked avatars */}
          <div style={{ display: "flex", alignItems: "center", flexShrink: 0 }}>
            {peers.slice(0, 4).map((p, i) => (
              <div
                key={p.userId}
                style={{ marginLeft: i === 0 ? 0 : -8, zIndex: 4 - i }}
              >
                <MiniAvatar
                  name={p.userName}
                  photo={p.userPhoto}
                  size={26}
                  online
                />
              </div>
            ))}
          </div>

          {/* Text */}
          <div style={{ flex: 1 }}>
            <p
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: NAVY,
                margin: "0 0 1px",
                fontFamily: "'Lato',sans-serif",
              }}
            >
              {count === 1
                ? `1 other student is studying this right now`
                : `${count} other students are studying this right now`}
            </p>
            <p
              style={{
                fontSize: 10,
                color: "#aaa",
                margin: 0,
                fontFamily: "'Lato',sans-serif",
              }}
            >
              {expanded ? "Tap to collapse" : "Tap to see who & connect"}
            </p>
          </div>

          {/* Chevron */}
          <div
            style={{
              transform: expanded ? "rotate(180deg)" : "none",
              transition: "transform .2s",
              color: "#ccc",
            }}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path
                d="M2 4l4 4 4-4"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </button>

        {/* ── Expanded peer list ── */}
        {expanded && (
          <div className="sbt-expanded">
            {peers.map((peer) => (
              <div key={peer.userId} className="sbt-peer">
                <MiniAvatar
                  name={peer.userName}
                  photo={peer.userPhoto}
                  size={32}
                  online
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: NAVY,
                      margin: "0 0 1px",
                      fontFamily: "'Lato',sans-serif",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {peer.userName}
                  </p>
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 4 }}
                  >
                    <div
                      style={{
                        width: 5,
                        height: 5,
                        borderRadius: "50%",
                        background: "#16a34a",
                        animation: "dotPulse 2s infinite",
                      }}
                    />
                    <span
                      style={{
                        fontSize: 10,
                        color: "#16a34a",
                        fontWeight: 700,
                        fontFamily: "'Lato',sans-serif",
                      }}
                    >
                      Studying now
                    </span>
                  </div>
                </div>
                <button
                  className="connect-btn"
                  onClick={() => setConnectTarget(peer)}
                >
                  <MessageCircle size={9} />
                  Connect
                </button>
              </div>
            ))}

            {/* Footer CTA */}
            <div
              style={{
                padding: "10px 14px",
                background: `linear-gradient(135deg, ${NAVY} 0%, #1a3a6b 100%)`,
                display: "flex",
                alignItems: "center",
                gap: 10,
              }}
            >
              <Zap size={12} style={{ color: GOLD, flexShrink: 0 }} />
              <p
                style={{
                  fontSize: 11,
                  color: "rgba(245,240,232,.65)",
                  fontFamily: "'Lato',sans-serif",
                  margin: 0,
                  flex: 1,
                }}
              >
                Study requests are sent as direct messages — check your messages
                to reply.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ── Study Request Modal ── */}
      {connectTarget && (
        <StudyRequestModal
          target={connectTarget}
          currentUser={{ uid: userId, name: userName, photo: userPhoto }}
          bookId={bookId}
          bookTitle={bookTitle}
          onClose={() => setConnectTarget(null)}
          onSent={() =>
            showToast(`Study request sent to ${connectTarget.userName}!`)
          }
        />
      )}

      {/* Toast */}
      {toastMsg && (
        <div
          style={{
            position: "fixed",
            bottom: 24,
            left: "50%",
            transform: "translateX(-50%)",
            background: NAVY,
            color: "#fff",
            padding: "11px 20px",
            fontSize: 12,
            fontWeight: 700,
            fontFamily: "'Lato',sans-serif",
            border: "0.5px solid rgba(184,150,62,.3)",
            zIndex: 9999,
            whiteSpace: "nowrap",
          }}
        >
          {toastMsg}
        </div>
      )}
    </>
  );
}
