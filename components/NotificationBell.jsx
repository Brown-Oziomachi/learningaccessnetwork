"use client";
import { useState, useEffect, useRef } from "react";
import {
  Bell, X, CheckCircle, XCircle, Gift, DollarSign,
  AlertCircle, BookOpen, Trash2, ChevronRight, MessageSquare,
} from "lucide-react";
import {
  collection, query, where, orderBy, onSnapshot,
  updateDoc, doc, deleteDoc, writeBatch,
} from "firebase/firestore";
import { db } from "@/lib/firebaseConfig";

const NAVY = "#0d2244";
const GOLD = "#b8963e";
const GOLDD = "#d4aa5a";
const CREAM = "#f5f0e8";

const TYPE_CONFIG = {
  withdrawal_approved: {
    icon: CheckCircle, iconColor: "#16a34a", barColor: "#16a34a",
    bg: "#f0fdf4", border: "rgba(22,163,74,0.25)",
  },
  referral_bonus: {
    icon: CheckCircle, iconColor: "#16a34a", barColor: "#16a34a",
    bg: "#f0fdf4", border: "rgba(22,163,74,0.25)",
  },
  withdrawal_rejected: {
    icon: XCircle, iconColor: "#dc2626", barColor: "#dc2626",
    bg: "#fef2f2", border: "rgba(220,38,38,0.25)",
  },
  referral_reward: {
    icon: Gift, iconColor: GOLD, barColor: GOLD,
    bg: "#fdf8ee", border: "rgba(184,150,62,0.3)",
  },
  sale: {
    icon: DollarSign, iconColor: NAVY, barColor: NAVY,
    bg: CREAM, border: "rgba(13,34,68,0.15)",
  },
  new_upload: {
    icon: BookOpen, iconColor: NAVY, barColor: NAVY,
    bg: CREAM, border: "rgba(13,34,68,0.15)",
  },
  admin_reply: {
    icon: MessageSquare, iconColor: "#7c3aed", barColor: "#7c3aed",
    bg: "#f5f3ff", border: "rgba(124,58,237,0.25)",
  },
};

const getConfig = (type) =>
  TYPE_CONFIG[type] || {
    icon: AlertCircle, iconColor: "#aaa", barColor: "#aaa",
    bg: "#fff", border: "#e5ddd0",
  };

const formatTime = (ts) => {
  if (!ts) return "";
  const date = ts.toDate ? ts.toDate() : new Date(ts);
  const diff = Date.now() - date;
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString("en-NG", { day: "2-digit", month: "short" });
};

export default function NotificationBell({ userId }) {
  const [notifications, setNotifications] = useState([]);       // ← main notifications collection
  const [adminReplies, setAdminReplies] = useState([]);          // ← adminReplies collection
  const [repliedReports, setRepliedReports] = useState([]);      // ← bookReports with adminNotes
  const [readAdminReplies, setReadAdminReplies] = useState(() => {
    try {
      return new Set(JSON.parse(localStorage.getItem("readAdminReplies") || "[]"));
    } catch {
      return new Set();
    }
  });
  const [open, setOpen] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const dropdownRef = useRef(null);

  // ── 1. Main notifications listener (new_upload, withdrawal, sale, etc.) ──
  useEffect(() => {
    if (!userId) return;
    const q = query(
      collection(db, "notifications"),
      where("userId", "==", userId),
      orderBy("createdAt", "desc"),
    );
    return onSnapshot(q, (snap) =>
      setNotifications(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    );
  }, [userId]);

  // ── 2. bookReports with adminNotes (admin replied to a report) ──
  useEffect(() => {
    if (!userId) return;
    const q = query(
      collection(db, "bookReports"),
      where("reportedBy", "==", userId),
      where("status", "==", "resolved"),
      orderBy("resolvedAt", "desc"),
    );
    return onSnapshot(q, (snap) =>
      setRepliedReports(
        snap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .filter((r) => r.adminResponse && r.adminResponse.trim() !== "")
      )
    );
  }, [userId]);

  // ── 3. adminReplies collection listener ──
  useEffect(() => {
    if (!userId) return;
    const q = query(
      collection(db, "adminReplies"),
      where("userId", "==", userId),
      orderBy("repliedAt", "desc"),
    );
    return onSnapshot(q, (snap) =>
      setAdminReplies(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    );
  }, [userId]);

  // ── Close on outside click ──
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target))
        setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ── Merge all three streams ──
  const allNotifications = [
    ...notifications,
    // bookReports with adminNotes → shown as admin_reply type
    ...repliedReports.map((r) => ({
      id: `report_reply__${r.id}`,
      _reportId: r.id,
      type: "admin_reply",
      title: `Re: ${r.reason || "Your report"}`,
      message: r.adminResponse || "",      
      createdAt: r.resolvedAt || r.createdAt || null,
      read: readAdminReplies.has(r.id),
      link: null,
    })),
  ].sort((a, b) => {
    const toMs = (ts) => {
      if (!ts) return 0;
      if (ts.toDate) return ts.toDate().getTime();
      return new Date(ts).getTime();
    };
    return toMs(b.createdAt) - toMs(a.createdAt);
  });

  const unreadCount = allNotifications.filter((n) => !n.read).length;

  // ── Mark helpers ──
  const markAsRead = async (n) => {
    if (n._reportId) {
      // bookReport reply — mark locally in localStorage
      setReadAdminReplies((prev) => {
        const next = new Set(prev);
        next.add(n._reportId);
        try { localStorage.setItem("readAdminReplies", JSON.stringify([...next])); } catch {}
        return next;
      });
    } else {
      // regular notification — update Firestore
      try {
        await updateDoc(doc(db, "notifications", n.id), { read: true });
      } catch (err) {
        console.error(err);
      }
    }
  };

  const markAllAsRead = async () => {
    try {
      const batch = writeBatch(db);
      notifications
        .filter((n) => !n.read)
        .forEach((n) => batch.update(doc(db, "notifications", n.id), { read: true }));
      await batch.commit();

      // also mark all bookReport replies as read
      const allReportIds = repliedReports.map((r) => r.id);
      setReadAdminReplies((prev) => {
        const next = new Set([...prev, ...allReportIds]);
        try { localStorage.setItem("readAdminReplies", JSON.stringify([...next])); } catch {}
        return next;
      });
    } catch (err) {
      console.error(err);
    }
  };

  const deleteNotification = async (e, n) => {
    e.stopPropagation();
    if (n._reportId) {
      // just hide it locally — don't delete the bookReport from Firestore
      markAsRead(n);
      setRepliedReports((prev) => prev.filter((r) => r.id !== n._reportId));
    } else {
      try {
        await deleteDoc(doc(db, "notifications", n.id));
      } catch (err) {
        console.error(err);
      }
    }
  };

  const clearAll = async () => {
    if (!window.confirm("Delete all notifications?")) return;
    try {
      const batch = writeBatch(db);
      notifications.forEach((n) => batch.delete(doc(db, "notifications", n.id)));
      await batch.commit();
      // clear bookReport replies locally
      setRepliedReports([]);
      setReadAdminReplies(new Set());
      try { localStorage.removeItem("readAdminReplies"); } catch {}
    } catch (err) {
      console.error(err);
    }
  };

  const handleClick = (n) => {
    if (!n.read) markAsRead(n);
    setOpen(false);
    if (n.type === "new_upload") {
      const rawId = (n.bookId || n.docId || n.relatedId || "").replace("firestore-", "");
      if (rawId) { window.location.href = `/book/preview?id=${rawId}`; return; }
    }
    if (n.link) window.location.href = n.link;
  };

  const displayed = showAll ? allNotifications : allNotifications.slice(0, 5);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=Lato:wght@400;700&display=swap');
        .nb-bell {
          width:40px; height:40px; position:relative;
          border:0.5px solid #e5ddd0; background:#fff;
          display:flex; align-items:center; justify-content:center;
          cursor:pointer; transition:border-color .18s,background .18s; flex-shrink:0;
        }
        .nb-bell:hover { border-color:${GOLD}; background:${CREAM}; }
        .nb-row {
          display:flex; align-items:flex-start; gap:12px;
          padding:13px 16px; border-bottom:0.5px solid #f0ebe0;
          cursor:pointer; transition:background .15s; position:relative; overflow:hidden;
        }
        .nb-row:hover { background:${CREAM}; }
        .nb-del {
          width:26px; height:26px; border:0.5px solid #e5ddd0;
          background:transparent; display:flex; align-items:center;
          justify-content:center; cursor:pointer; flex-shrink:0;
          transition:all .15s; color:#ccc;
        }
        .nb-del:hover { border-color:#fecaca; background:#fef2f2; color:#dc2626; }
        @keyframes nbSlide {
          from { opacity:0; transform:translateY(-8px) scale(.98); }
          to   { opacity:1; transform:translateY(0) scale(1); }
        }
        .nb-dropdown { animation:nbSlide .22s cubic-bezier(.4,0,.2,1) both; }
        .nb-reply-badge {
          font-size:9px; font-weight:700; letter-spacing:0.06em;
          padding:2px 7px; background:#f5f3ff; color:#7c3aed;
          border:0.5px solid rgba(124,58,237,0.25); border-radius:2px;
          font-family:'Lato',sans-serif;
        }
      `}</style>

      <div style={{ position: "relative" }} ref={dropdownRef}>

        {/* Bell Button */}
        <button className="nb-bell" onClick={() => setOpen((p) => !p)} title="Notifications">
          <Bell size={18} style={{ color: NAVY }} />
          {unreadCount > 0 && (
            <span style={{
              position: "absolute", top: "-6px", right: "-6px",
              minWidth: "18px", height: "18px", background: "#dc2626",
              color: "#fff", fontSize: "9px", fontWeight: 700,
              borderRadius: "999px", display: "flex", alignItems: "center",
              justifyContent: "center", padding: "0 4px",
              fontFamily: "'Lato',sans-serif", border: "1.5px solid #fff",
            }}>
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>

        {/* Dropdown */}
        {open && (
          <div className="nb-dropdown" style={{
            position: "fixed", right: "16px", top: "70px",
            width: "min(calc(100vw - 32px), 380px)",
            background: "#fff", border: "0.5px solid #e5ddd0",
            boxShadow: "0 24px 64px rgba(13,34,68,0.2)", zIndex: 999, overflow: "hidden",
          }}>
            {/* Header */}
            <div style={{
              background: NAVY,
              backgroundImage: "radial-gradient(rgba(184,150,62,0.07) 1px,transparent 1px)",
              backgroundSize: "20px 20px", padding: "16px 18px",
              display: "flex", alignItems: "center", justifyContent: "space-between",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Bell size={14} style={{ color: GOLD }} />
                <p style={{
                  fontFamily: "'Playfair Display',serif", fontSize: "15px",
                  fontWeight: 700, color: "#fff", margin: 0,
                }}>Notifications</p>
                {unreadCount > 0 && (
                  <span style={{
                    background: "#dc2626", color: "#fff", fontSize: "9px",
                    fontWeight: 700, padding: "2px 7px",
                    fontFamily: "'Lato',sans-serif", letterSpacing: "0.04em",
                  }}>{unreadCount} new</span>
                )}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                {unreadCount > 0 && (
                  <button onClick={markAllAsRead} style={{
                    fontSize: "10px", fontWeight: 700, color: GOLDD,
                    background: "transparent", border: "none", cursor: "pointer",
                    fontFamily: "'Lato',sans-serif", letterSpacing: "0.06em",
                    textTransform: "uppercase",
                  }}>Mark all read</button>
                )}
                {allNotifications.length > 0 && (
                  <button onClick={clearAll} style={{
                    fontSize: "10px", color: "rgba(255,255,255,0.35)",
                    background: "transparent", border: "none", cursor: "pointer",
                    fontFamily: "'Lato',sans-serif",
                  }}>Clear all</button>
                )}
                <button onClick={() => setOpen(false)} style={{
                  width: "28px", height: "28px",
                  border: "0.5px solid rgba(255,255,255,0.2)",
                  background: "transparent", display: "flex",
                  alignItems: "center", justifyContent: "center",
                  cursor: "pointer", color: "rgba(255,255,255,0.6)",
                }}><X size={14} /></button>
              </div>
            </div>

            {/* Body */}
            <div style={{ maxHeight: "420px", overflowY: "auto", scrollbarWidth: "none" }}>
              {allNotifications.length === 0 ? (
                <div style={{ padding: "48px 24px", textAlign: "center" }}>
                  <div style={{
                    width: "56px", height: "56px", border: "0.5px solid #e5ddd0",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    margin: "0 auto 14px", background: CREAM,
                  }}>
                    <Bell size={22} style={{ color: "#ccc" }} />
                  </div>
                  <p style={{
                    fontFamily: "'Playfair Display',serif", fontSize: "15px",
                    fontWeight: 700, color: NAVY, margin: "0 0 4px",
                  }}>All quiet here</p>
                  <p style={{ fontSize: "12px", color: "#aaa", fontFamily: "'Lato',sans-serif", margin: 0 }}>
                    No notifications yet
                  </p>
                </div>
              ) : (
                displayed.map((n) => {
                  const cfg = getConfig(n.type);
                  const Icon = cfg.icon;
                  return (
                    <div
                      key={n.id}
                      className="nb-row"
                      onClick={() => handleClick(n)}
                      style={{ background: n.read ? "#fff" : cfg.bg }}
                    >
                      {!n.read && (
                        <div style={{
                          position: "absolute", left: 0, top: 0, bottom: 0,
                          width: "3px", background: cfg.barColor,
                        }} />
                      )}
                      <div style={{
                        width: "34px", height: "34px", flexShrink: 0,
                        border: `0.5px solid ${cfg.border}`,
                        background: n.read ? CREAM : cfg.bg,
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}>
                        <Icon size={15} style={{ color: cfg.iconColor }} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          display: "flex", alignItems: "flex-start",
                          justifyContent: "space-between", gap: "8px",
                        }}>
                          <div style={{ display: "flex", flexDirection: "column", gap: "3px", minWidth: 0 }}>
                            <p style={{
                              fontSize: "12px", fontWeight: 700,
                              color: n.read ? "#888" : NAVY, margin: 0,
                              fontFamily: "'Lato',sans-serif", lineHeight: 1.4,
                            }}>{n.title}</p>
                            {n.type === "admin_reply" && (
                              <span className="nb-reply-badge" style={{ alignSelf: "flex-start" }}>
                                Admin Reply
                              </span>
                            )}
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: "4px", flexShrink: 0 }}>
                            <span style={{
                              fontSize: "10px", color: "#bbb",
                              fontFamily: "'Lato',sans-serif", whiteSpace: "nowrap",
                            }}>{formatTime(n.createdAt)}</span>
                            <button className="nb-del" onClick={(e) => deleteNotification(e, n)} title="Dismiss">
                              <Trash2 size={11} />
                            </button>
                          </div>
                        </div>
                        {n.message && (
                          <p style={{
                            fontSize: "11px", color: n.read ? "#aaa" : "#666",
                            margin: "4px 0 0", fontFamily: "'Lato',sans-serif",
                            lineHeight: 1.5,
                            display: "-webkit-box",
                            WebkitLineClamp: 3,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                          }}>{n.message}</p>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer */}
            {allNotifications.length > 5 && (
              <div style={{ borderTop: "0.5px solid #f0ebe0", padding: "10px 16px", background: CREAM }}>
                <button
                  onClick={() => setShowAll((p) => !p)}
                  style={{
                    width: "100%", display: "flex", alignItems: "center",
                    justifyContent: "center", gap: "4px", fontSize: "10px",
                    fontWeight: 700, color: NAVY, background: "transparent",
                    border: "none", cursor: "pointer",
                    fontFamily: "'Lato',sans-serif",
                    letterSpacing: "0.08em", textTransform: "uppercase",
                  }}
                >
                  {showAll ? "Show less" : `View all ${allNotifications.length} notifications`}
                  <ChevronRight size={11} style={{
                    transform: showAll ? "rotate(90deg)" : "none",
                    transition: "transform 0.2s",
                  }} />
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}