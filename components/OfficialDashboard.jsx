"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  BadgeCheck,
  Mail,
  Megaphone,
  Send,
  Trash2,
  ExternalLink,
  Lock,
  ChevronRight,
} from "lucide-react";
import {
  collection,
  query,
  orderBy,
  limit,
  onSnapshot,
  addDoc,
  deleteDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebaseConfig";
import Navbar from "@/components/NavBar";
import NotificationBell from "@/components/NotificationBell";
import { OFFICIAL_EMAIL } from "@/lib/reservedIdentity";

const NAVY = "#0d2244";
const GOLD = "#b8963e";
const CREAM = "#f5f0e8";
const BG = "#f5f1ea";
const YELLOW = "#facc15";
const LOGO = "/lan-logo.png"; // same logo path your seller dashboard uses

const fmtTime = (ts) => {
  if (!ts) return "";
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleString("en-NG", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

function OfficialPill() {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        background: "#fefce8",
        border: `0.5px solid ${YELLOW}`,
        color: NAVY,
        padding: "2px 8px",
        borderRadius: 999,
        fontSize: 10,
        fontWeight: 800,
        letterSpacing: "0.08em",
        fontFamily: "'Lato',sans-serif",
      }}
    >
      <ShieldCheck size={11} style={{ color: "#ca8a04" }} />
      OFFICIAL
      <BadgeCheck size={12} style={{ color: "#2563eb" }} />
    </span>
  );
}

function AnnouncementRow({ title, message, meta, onDelete }) {
  return (
    <div
      style={{
        position: "relative",
        display: "flex",
        gap: 12,
        padding: "13px 16px 13px 18px",
        background: "linear-gradient(to right, #fefce8, #ffffff)",
        border: "0.5px solid #f0ebe0",
        marginBottom: 8,
      }}
    >
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          bottom: 0,
          width: 3,
          background: YELLOW,
        }}
      />
      <img
        src={LOGO}
        alt="LAN Library official"
        style={{
          width: 34,
          height: 34,
          borderRadius: "50%",
          border: `1.5px solid ${YELLOW}`,
          objectFit: "cover",
          flexShrink: 0,
        }}
      />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            flexWrap: "wrap",
          }}
        >
          <p
            style={{
              margin: 0,
              fontSize: 12,
              fontWeight: 700,
              color: NAVY,
              fontFamily: "'Lato',sans-serif",
            }}
          >
            {title || "Your title appears here"}
          </p>
          <OfficialPill />
        </div>
        <p
          style={{
            margin: "4px 0 0",
            fontSize: 11,
            color: "#666",
            lineHeight: 1.5,
            fontFamily: "'Lato',sans-serif",
          }}
        >
          {message || "Your message appears here."}
        </p>
        <p
          style={{
            margin: "5px 0 0",
            fontSize: 9,
            fontWeight: 700,
            color: "#a16207",
            letterSpacing: "0.05em",
            fontFamily: "'Lato',sans-serif",
          }}
        >
          System • Announcements Only{meta ? ` • ${meta}` : ""}
        </p>
      </div>
      {onDelete && (
        <button
          onClick={onDelete}
          title="Delete announcement"
          style={{
            width: 26,
            height: 26,
            border: "0.5px solid #e5ddd0",
            background: "transparent",
            cursor: "pointer",
            color: "#ccc",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <Trash2 size={11} />
        </button>
      )}
    </div>
  );
}

const inputStyle = {
  width: "100%",
  border: "0.5px solid #e5ddd0",
  padding: "10px 12px",
  fontSize: 13,
  color: NAVY,
  outline: "none",
  fontFamily: "'Lato',sans-serif",
  boxSizing: "border-box",
  background: "#fff",
};
const labelStyle = {
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: "0.12em",
  textTransform: "uppercase",
  color: "#888",
  display: "block",
  marginBottom: 6,
  fontFamily: "'Lato',sans-serif",
};

export default function OfficialDashboard({ user }) {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [link, setLink] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    const q = query(
      collection(db, "globalNotifications"),
      orderBy("createdAt", "desc"),
      limit(30),
    );
    return onSnapshot(q, (snap) =>
      setHistory(
        snap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .filter((n) => n.fromOfficial === true),
      ),
    );
  }, []);

  const handleSend = async () => {
    setError("");
    setSent(false);
    const t = title.trim(),
      m = message.trim(),
      l = link.trim();
    if (!t) {
      setError("Title is required.");
      return;
    }
    if (!m) {
      setError("Message is required.");
      return;
    }
    if (l && !/^(\/(?!\/)|https:\/\/)/.test(l)) {
      setError("Link must start with / (inside the site) or https://");
      return;
    }
    if (
      !window.confirm(
        "Send this announcement to ALL users? It cannot be edited after sending.",
      )
    )
      return;

    setSending(true);
    try {
      await addDoc(collection(db, "globalNotifications"), {
        fromOfficial: true,
        type: "official_announcement",
        title: t,
        message: m,
        link: l || "/official",
        createdAt: serverTimestamp(),
      });
      setTitle("");
      setMessage("");
      setLink("");
      setSent(true);
      setTimeout(() => setSent(false), 4000);
    } catch (e) {
      console.error(e);
      setError(
        "Could not send. Check that this account is marked official and the Firestore rules are published.",
      );
    } finally {
      setSending(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this announcement for all users?")) return;
    try {
      await deleteDoc(doc(db, "globalNotifications", id));
    } catch (e) {
      alert("Could not delete: " + e.message);
    }
  };

  const checklist = [
    "Turn on 2-step verification on the official Gmail",
    "Set a personal recovery email and phone on it",
    "Never use the official login on shared devices",
    "Never sell, withdraw or DM from this account",
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400&family=Lato:wght@300;400;700&display=swap');
        * { box-sizing: border-box; }
        .off-root { font-family:'Lato',sans-serif; background:${BG}; min-height:100vh; }
        .off-grid { display:grid; grid-template-columns:1fr; gap:20px; }
        @media(min-width:1024px){ .off-grid { grid-template-columns:2fr 1fr; } }
        .off-link { display:flex; align-items:center; gap:12px; padding:12px 14px; border:0.5px solid #e5ddd0; background:#fff; text-decoration:none; margin-bottom:6px; transition:border-color .18s, background .18s; }
        .off-link:hover { border-color:${GOLD}; background:${CREAM}; }
      `}</style>

      <div className="off-root">
        <Navbar />
        <div
          style={{
            maxWidth: 1200,
            margin: "0 auto",
            padding: "24px 16px 80px",
          }}
        >
          {/* Header bar */}
          <div
            style={{
              background: "#fff",
              border: "0.5px solid #e5ddd0",
              padding: "10px 14px",
              marginBottom: 20,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 8,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                minWidth: 0,
              }}
            >
              <img
                src={user?.photoURL || user?.photoBase64 || LOGO}
                alt="Official account"
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: "50%",
                  objectFit: "cover",
                  border: `2px solid ${YELLOW}`,
                }}
              />
              <div style={{ minWidth: 0 }}>
                <p
                  style={{
                    margin: 0,
                    fontFamily: "'Playfair Display',serif",
                    fontSize: 14,
                    fontWeight: 700,
                    color: NAVY,
                  }}
                >
                  {user?.displayName || "LAN Library"}
                </p>
                <div style={{ marginTop: 3 }}>
                  <OfficialPill />
                </div>
              </div>
            </div>
            <NotificationBell userId={user?.uid} />
          </div>

          <div className="off-grid">
            {/* LEFT */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 20,
                minWidth: 0,
              }}
            >
              {/* Hero */}
              <div
                style={{
                  background: NAVY,
                  backgroundImage:
                    "radial-gradient(rgba(184,150,62,0.07) 1px,transparent 1px)",
                  backgroundSize: "24px 24px",
                  padding: 24,
                }}
              >
                <p
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: "0.2em",
                    textTransform: "uppercase",
                    color: GOLD,
                    margin: "0 0 6px",
                  }}
                >
                  Official Account
                </p>
                <p
                  style={{
                    fontFamily: "'Playfair Display',serif",
                    fontSize: "clamp(22px,4vw,32px)",
                    fontWeight: 700,
                    color: "#fff",
                    margin: "0 0 8px",
                  }}
                >
                  System • Announcements Only
                </p>
                <p
                  style={{
                    fontSize: 12,
                    color: "rgba(255,255,255,0.6)",
                    lineHeight: 1.7,
                    margin: "0 0 14px",
                  }}
                >
                  This account speaks for LAN Library. It does not sell,
                  withdraw, or message users directly.
                </p>
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    background: "rgba(184,150,62,0.15)",
                    border: "0.5px solid rgba(184,150,62,0.4)",
                    padding: "8px 12px",
                  }}
                >
                  <Mail size={13} style={{ color: GOLD }} />
                  <span
                    style={{ fontSize: 12, fontWeight: 700, color: "#fff" }}
                  >
                    {OFFICIAL_EMAIL}
                  </span>
                </div>
              </div>

              {/* Composer */}
              <div
                style={{
                  background: "#fff",
                  border: "0.5px solid #e5ddd0",
                  padding: 20,
                }}
              >
                <p
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: "0.2em",
                    textTransform: "uppercase",
                    color: GOLD,
                    margin: "0 0 4px",
                  }}
                >
                  Broadcast
                </p>
                <h3
                  style={{
                    fontFamily: "'Playfair Display',serif",
                    fontSize: 18,
                    fontWeight: 700,
                    color: NAVY,
                    margin: "0 0 16px",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <Megaphone size={16} style={{ color: GOLD }} /> New
                  Announcement
                </h3>

                <div style={{ marginBottom: 12 }}>
                  <label style={labelStyle}>
                    Title <span style={{ color: "#ef4444" }}>*</span>
                  </label>
                  <input
                    value={title}
                    maxLength={80}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Scheduled maintenance tonight"
                    style={inputStyle}
                  />
                </div>
                <div style={{ marginBottom: 12 }}>
                  <label style={labelStyle}>
                    Message <span style={{ color: "#ef4444" }}>*</span>
                  </label>
                  <textarea
                    value={message}
                    maxLength={500}
                    rows={4}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Keep it short and clear."
                    style={{ ...inputStyle, resize: "vertical" }}
                  />
                  <p
                    style={{
                      margin: "4px 0 0",
                      fontSize: 10,
                      color: "#aaa",
                      textAlign: "right",
                    }}
                  >
                    {message.length}/500
                  </p>
                </div>
                <div style={{ marginBottom: 16 }}>
                  <label style={labelStyle}>Link (optional)</label>
                  <input
                    value={link}
                    onChange={(e) => setLink(e.target.value)}
                    placeholder="/official  or  https://..."
                    style={inputStyle}
                  />
                </div>

                <p style={{ ...labelStyle, marginBottom: 8 }}>Preview</p>
                <AnnouncementRow
                  title={title.trim()}
                  message={message.trim()}
                />

                {error && (
                  <div
                    style={{
                      background: "#fef2f2",
                      border: "0.5px solid #fecaca",
                      padding: "10px 12px",
                      margin: "10px 0",
                      fontSize: 12,
                      color: "#dc2626",
                    }}
                  >
                    {error}
                  </div>
                )}
                {sent && (
                  <div
                    style={{
                      background: "#f0fdf4",
                      border: "0.5px solid #86efac",
                      padding: "10px 12px",
                      margin: "10px 0",
                      fontSize: 12,
                      color: "#16a34a",
                      fontWeight: 700,
                    }}
                  >
                    Announcement sent to all users.
                  </div>
                )}

                <button
                  onClick={handleSend}
                  disabled={sending}
                  style={{
                    width: "100%",
                    marginTop: 12,
                    background: NAVY,
                    color: "#fff",
                    padding: 13,
                    border: "none",
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: sending ? "not-allowed" : "pointer",
                    opacity: sending ? 0.6 : 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    letterSpacing: "0.05em",
                  }}
                >
                  <Send size={14} />{" "}
                  {sending ? "Sending…" : "Send to all users"}
                </button>
              </div>

              {/* History */}
              <div
                style={{
                  background: "#fff",
                  border: "0.5px solid #e5ddd0",
                  padding: 20,
                }}
              >
                <p
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: "0.2em",
                    textTransform: "uppercase",
                    color: GOLD,
                    margin: "0 0 4px",
                  }}
                >
                  Sent
                </p>
                <h3
                  style={{
                    fontFamily: "'Playfair Display',serif",
                    fontSize: 18,
                    fontWeight: 700,
                    color: NAVY,
                    margin: "0 0 14px",
                  }}
                >
                  Recent Announcements
                </h3>
                {history.length === 0 ? (
                  <p
                    style={{
                      fontSize: 13,
                      color: "#aaa",
                      textAlign: "center",
                      padding: "24px 0",
                      margin: 0,
                    }}
                  >
                    Nothing sent yet.
                  </p>
                ) : (
                  history.map((n) => (
                    <AnnouncementRow
                      key={n.id}
                      title={n.title}
                      message={n.message}
                      meta={fmtTime(n.createdAt)}
                      onDelete={() => handleDelete(n.id)}
                    />
                  ))
                )}
              </div>
            </div>

            {/* RIGHT */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 20,
                minWidth: 0,
              }}
            >
              <div
                style={{
                  background: "#fff",
                  border: "0.5px solid #e5ddd0",
                  padding: 20,
                }}
              >
                <p
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: "0.2em",
                    textTransform: "uppercase",
                    color: GOLD,
                    margin: "0 0 6px",
                  }}
                >
                  Navigate
                </p>
                <h3
                  style={{
                    fontFamily: "'Playfair Display',serif",
                    fontSize: 18,
                    fontWeight: 700,
                    color: NAVY,
                    margin: "0 0 14px",
                  }}
                >
                  Quick Links
                </h3>
                {[
                  {
                    href: "/official",
                    icon: <ExternalLink size={16} style={{ color: NAVY }} />,
                    t: "Public official page",
                    s: "What users see when they verify you",
                  },
                  {
                    href: "/lan/net/help-center",
                    icon: <ShieldCheck size={16} style={{ color: NAVY }} />,
                    t: "Help Center",
                    s: "Support and reports",
                  },
                ].map(({ href, icon, t, s }) => (
                  <Link key={href} href={href} className="off-link">
                    <div
                      style={{
                        width: 34,
                        height: 34,
                        border: "0.5px solid #e5ddd0",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        background: CREAM,
                        flexShrink: 0,
                      }}
                    >
                      {icon}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p
                        style={{
                          margin: "0 0 1px",
                          fontSize: 13,
                          fontWeight: 700,
                          color: NAVY,
                        }}
                      >
                        {t}
                      </p>
                      <p style={{ margin: 0, fontSize: 11, color: "#aaa" }}>
                        {s}
                      </p>
                    </div>
                    <ChevronRight size={14} style={{ color: "#ccc" }} />
                  </Link>
                ))}
              </div>

              <div
                style={{
                  background: CREAM,
                  border: "0.5px solid rgba(184,150,62,0.25)",
                  borderLeft: `3px solid ${GOLD}`,
                  padding: "14px 16px",
                }}
              >
                <p
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    margin: "0 0 8px",
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                    color: NAVY,
                  }}
                >
                  <Lock size={12} style={{ color: GOLD }} /> Protect this
                  account
                </p>
                {checklist.map((c) => (
                  <p
                    key={c}
                    style={{
                      margin: "0 0 6px",
                      fontSize: 11,
                      color: "#666",
                      lineHeight: 1.6,
                    }}
                  >
                    • {c}
                  </p>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
