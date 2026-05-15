"use client";
import { useState, useEffect, useRef } from "react";
import {
  Bell, X, CheckCircle, XCircle, Gift, DollarSign,
  AlertCircle, BookOpen, Trash2, ChevronRight, MessageSquare,
  Package, AlertTriangle, RefreshCw, ShoppingBag, Sparkles,
} from "lucide-react";
import {
  collection, query, where, orderBy, onSnapshot,
  updateDoc, doc, deleteDoc, writeBatch,
} from "firebase/firestore";
import { db } from "@/lib/firebaseConfig";

const NAVY  = "#0d2244";
const GOLD  = "#b8963e";
const GOLDD = "#d4aa5a";
const CREAM = "#f5f0e8";

/* ══════════════════════════════════════════════════════════════
   TYPE_CONFIG — all notification types, including the three
   new physical-inventory types:
     · physical_sale        (a student picked up a copy)
     · physical_low_stock   (stock at/below 30%)
     · physical_intake      (admin confirmed your consignment)
══════════════════════════════════════════════════════════════ */
const TYPE_CONFIG = {
  /* ── existing types (preserved) ── */
  withdrawal_approved: {
    icon: CheckCircle,
    iconColor: "#16a34a",
    barColor: "#16a34a",
    bg: "#f0fdf4",
    border: "rgba(22,163,74,0.25)",
    label: null,
  },
  referral_bonus: {
    icon: CheckCircle,
    iconColor: "#16a34a",
    barColor: "#16a34a",
    bg: "#f0fdf4",
    border: "rgba(22,163,74,0.25)",
    label: null,
  },
  withdrawal_rejected: {
    icon: XCircle,
    iconColor: "#dc2626",
    barColor: "#dc2626",
    bg: "#fef2f2",
    border: "rgba(220,38,38,0.25)",
    label: null,
  },
  referral_reward: {
    icon: Gift,
    iconColor: GOLD,
    barColor: GOLD,
    bg: "#fdf8ee",
    border: "rgba(184,150,62,0.3)",
    label: null,
  },
  sale: {
    icon: DollarSign,
    iconColor: NAVY,
    barColor: NAVY,
    bg: CREAM,
    border: "rgba(13,34,68,0.15)",
    label: null,
  },
  new_upload: {
    icon: BookOpen,
    iconColor: NAVY,
    barColor: NAVY,
    bg: CREAM,
    border: "rgba(13,34,68,0.15)",
    label: null,
  },
  admin_reply: {
    icon: MessageSquare,
    iconColor: "#7c3aed",
    barColor: "#7c3aed",
    bg: "#f5f3ff",
    border: "rgba(124,58,237,0.25)",
    label: "Admin Reply",
  },

  /* ── NEW: physical inventory types ── */
  physical_sale: {
    icon: ShoppingBag,
    iconColor: "#16a34a",
    barColor: "#16a34a",
    bg: "#f0fdf4",
    border: "rgba(22,163,74,0.25)",
    label: "Copy Sold",
  },
  physical_low_stock: {
    icon: AlertTriangle,
    iconColor: "#d97706",
    barColor: "#d97706",
    bg: "#fffbeb",
    border: "rgba(217,119,6,0.3)",
    label: "Low Stock",
  },
  physical_intake: {
    icon: Package,
    iconColor: NAVY,
    barColor: GOLD,
    bg: CREAM,
    border: "rgba(184,150,62,0.3)",
    label: "Intake Confirmed",
  },
  physical_order: {
    icon: ShoppingBag,
    iconColor: "#16a34a",
    barColor: "#16a34a",
    bg: "#f0fdf4",
    border: "rgba(22,163,74,0.25)",
    label: "New Order",
  },
  physical_reserved: {
    // ← ADD THIS
    icon: Package,
    iconColor: "#0d2244",
    barColor: "#b8963e",
    bg: "#f5f0e8",
    border: "rgba(184,150,62,0.3)",
    label: "Copy Reserved",
  },
  welcome_seller: {
    icon: Sparkles,
    iconColor: GOLD,
    barColor: GOLD,
    bg: "#fdf8ee",
    border: "rgba(184,150,62,0.3)",
    label: "Welcome",
  },
};

const getConfig = (type) =>
  TYPE_CONFIG[type] || {
    icon: AlertCircle, iconColor: "#aaa", barColor: "#aaa",
    bg: "#fff", border: "#e5ddd0", label: null,
  };

const formatTime = (ts) => {
  if (!ts) return "";
  const date = ts.toDate ? ts.toDate() : new Date(ts);
  const diff  = Date.now() - date;
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins  <  1) return "Just now";
  if (mins  < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days  <  7) return `${days}d ago`;
  return date.toLocaleDateString("en-NG", { day: "2-digit", month: "short" });
};

/* ─── Mini stock-health pill (used inside low_stock notifications) ── */
function StockPill({ current, total }) {
  if (!total) return null;
  const pct   = Math.round((current / total) * 100);
  const color = pct === 0 ? "#dc2626" : pct <= 20 ? "#ea580c" : "#d97706";
  return (
    <div style={{
      display: "inline-flex", alignItems: "center", gap: "5px",
      background: "#fff7ed", border: `0.5px solid ${color}`,
      padding: "2px 8px", marginTop: "5px"
    }}>
      <div style={{ width: "32px", height: "4px", background: "#e5ddd0", overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", background: color }} />
      </div>
      <span style={{ fontSize: "9px", fontWeight: 700, color, fontFamily: "'Lato',sans-serif" }}>
        {current} / {total} left
      </span>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   MAIN COMPONENT
════════════════════════════════════════════════════════════════ */
export default function NotificationBell({ userId }) {
  const [notifications,   setNotifications]   = useState([]);
  const [repliedReports,  setRepliedReports]   = useState([]);
  const [readAdminReplies, setReadAdminReplies] = useState(() => {
    try { return new Set(JSON.parse(localStorage.getItem("readAdminReplies") || "[]")); }
    catch { return new Set(); }
  });
  const [open,     setOpen]     = useState(false);
  const [showAll,  setShowAll]  = useState(false);
  const dropdownRef = useRef(null);
const [dropPos, setDropPos] = useState({ top: 0, left: 0, width: 360, openLeft: false });

  /* ── 1. Main notifications — includes physical_* types ── */
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

  /* ── 2. bookReports with adminNotes ── */
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



  /* ── Close on outside click ── */
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target))
        setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  /* ── Merge all three sources ── */
  const allNotifications = [
    ...notifications,
    ...repliedReports.map((r) => ({
      id:        `report_reply__${r.id}`,
      _reportId: r.id,
      type:      "admin_reply",
      title:     `Re: ${r.reason || "Your report"}`,
      message:   r.adminResponse || "",
      createdAt: r.resolvedAt || r.createdAt || null,
      read:      readAdminReplies.has(r.id),
      link:      null,
    })),
  ].sort((a, b) => {
    const toMs = (ts) => {
      if (!ts)        return 0;
      if (ts.toDate)  return ts.toDate().getTime();
      return new Date(ts).getTime();
    };
    return toMs(b.createdAt) - toMs(a.createdAt);
  });

  const unreadCount = allNotifications.filter((n) => !n.read).length;

  /* ── Physical-inventory unread count (highlighted separately) ── */
    const physicalUnread = allNotifications.filter(
      (n) => !n.read && ["physical_sale", "physical_low_stock", "physical_intake", "physical_reserved"].includes(n.type)
    ).length;

  /* ── Mark helpers (unchanged logic) ── */
  const markAsRead = async (n) => {
    if (n._reportId) {
      setReadAdminReplies((prev) => {
        const next = new Set(prev);
        next.add(n._reportId);
        try { localStorage.setItem("readAdminReplies", JSON.stringify([...next])); } catch {}
        return next;
      });
    } else {
      try { await updateDoc(doc(db, "notifications", n.id), { read: true }); } catch (err) { console.error(err); }
    }
  };

  const markAllAsRead = async () => {
    try {
      const batch = writeBatch(db);
      notifications.filter((n) => !n.read)
        .forEach((n) => batch.update(doc(db, "notifications", n.id), { read: true }));
      await batch.commit();
      const allReportIds = repliedReports.map((r) => r.id);
      setReadAdminReplies((prev) => {
        const next = new Set([...prev, ...allReportIds]);
        try { localStorage.setItem("readAdminReplies", JSON.stringify([...next])); } catch {}
        return next;
      });
    } catch (err) { console.error(err); }
  };

  const deleteNotification = async (e, n) => {
    e.stopPropagation();
    if (n._reportId) {
      markAsRead(n);
      setRepliedReports((prev) => prev.filter((r) => r.id !== n._reportId));
    } else {
      try { await deleteDoc(doc(db, "notifications", n.id)); } catch (err) { console.error(err); }
    }
  };

  const clearAll = async () => {
    if (!window.confirm("Delete all notifications?")) return;
    try {
      const batch = writeBatch(db);
      notifications.forEach((n) => batch.delete(doc(db, "notifications", n.id)));
      await batch.commit();
      setRepliedReports([]);
      setReadAdminReplies(new Set());
      try { localStorage.removeItem("readAdminReplies"); } catch {}
    } catch (err) { console.error(err); }
  };

  const handleClick = (n) => {
    if (!n.read) markAsRead(n);
    setOpen(false);
    if (n.type === "new_upload") {
      const rawId = (n.bookId || n.docId || n.relatedId || "").replace("firestore-", "");
      if (rawId) { window.location.href = `/book/preview?id=${rawId}`; return; }
    }
    /* Physical types → deep-link to repository */
    if (["physical_sale", "physical_low_stock", "physical_intake"].includes(n.type)) {
      const assetId = n.assetId || "";
      window.location.href = `/my-account/seller-account/repository${assetId ? `?highlight=${assetId}` : ""}`;
      return;
    }
    if (n.link) window.location.href = n.link;
  };

  const displayed = showAll ? allNotifications : allNotifications.slice(0, 6);

  /* ── Group-header: show "Physical Updates" divider when needed ── */
const physicalTypes = new Set(["physical_sale", "physical_low_stock", "physical_intake", "physical_reserved"]); 
 let lastWasPhysical = false;

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
          from { opacity:0; transform:translateX(8px) scale(.98); }
          to   { opacity:1; transform:translateX(0) scale(1); }
        }
        .nb-dropdown { animation:nbSlide .22s cubic-bezier(.4,0,.2,1) both; }
        .nb-type-badge {
          font-size:9px; font-weight:700; letter-spacing:0.06em;
          padding:2px 7px; border-radius:2px; font-family:'Lato',sans-serif;
        }
        .nb-section-header {
          padding:6px 16px; background:rgba(184,150,62,0.08);
          border-bottom:0.5px solid rgba(184,150,62,0.2);
          font-size:9px; font-weight:700; letter-spacing:0.18em;
          text-transform:uppercase; color:${GOLD}; font-family:'Lato',sans-serif;
          display:flex; align-items:center; gap:6px;
        }
      `}</style>

      <div style={{ position: "relative" }} ref={dropdownRef}>
        {/* ── Bell Button ── */}
        <button
          className="nb-bell"
         onClick={() => {
  if (!open) {
    const rect = dropdownRef.current?.getBoundingClientRect();
    if (rect) {
      const viewportWidth  = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const dropWidth      = Math.min(360, viewportWidth - 32);

      // Try to open to the right of the bell first
      let left     = rect.right + 8;
      let openLeft = false;

      // If it overflows the right edge, flip to the left of the bell
      if (left + dropWidth > viewportWidth - 8) {
        left     = rect.left - dropWidth - 8;
        openLeft = true;
      }

      // Clamp left so it never goes off-screen
      left = Math.max(8, left);

      // Align top with the bell, but clamp so it doesn't overflow bottom
      const maxHeight = 520; // approx dropdown max height
      let top = rect.top;
      if (top + maxHeight > viewportHeight - 8) {
        top = Math.max(8, viewportHeight - maxHeight - 8);
      }

      setDropPos({ top, left, width: dropWidth, openLeft });
    }
  }
  setOpen((o) => !o);
}}
          title="Notifications"
        >
          <Bell size={18} style={{ color: NAVY }} />
          {unreadCount > 0 && (
            <span
              style={{
                position: "absolute",
                top: "-6px",
                right: "-6px",
                minWidth: "18px",
                height: "18px",
                background: physicalUnread > 0 ? "#d97706" : "#dc2626",
                color: "#fff",
                fontSize: "9px",
                fontWeight: 700,
                borderRadius: "999px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "0 4px",
                fontFamily: "'Lato',sans-serif",
                border: "1.5px solid #fff",
              }}
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>

        {/* ── Dropdown ── */}
        {open && (
          <div
            className="nb-dropdown"
          style={{
            position: "fixed",
            top: dropPos.top,
            left: dropPos.left,
            width: dropPos.width,
            maxHeight: "calc(100vh - 24px)",
            overflowY: "auto",
            background: "#fff",
            border: "0.5px solid #e5ddd0",
            boxShadow: "0 24px 64px rgba(13,34,68,0.2)",
            zIndex: 99999,
            overflow: "hidden",
          }}
          >
            {/* Header */}
            <div
              style={{
                background: NAVY,
                backgroundImage:
                  "radial-gradient(rgba(184,150,62,0.07) 1px,transparent 1px)",
                backgroundSize: "20px 20px",
                padding: "16px 18px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div
                style={{ display: "flex", alignItems: "center", gap: "8px" }}
              >
                <Bell size={14} style={{ color: GOLD }} />
                <p
                  style={{
                    fontFamily: "'Playfair Display',serif",
                    fontSize: "15px",
                    fontWeight: 700,
                    color: "#fff",
                    margin: 0,
                  }}
                >
                  Notifications
                </p>
                {unreadCount > 0 && (
                  <span
                    style={{
                      background: physicalUnread > 0 ? "#d97706" : "#dc2626",
                      color: "#fff",
                      fontSize: "9px",
                      fontWeight: 700,
                      padding: "2px 7px",
                      fontFamily: "'Lato',sans-serif",
                      letterSpacing: "0.04em",
                    }}
                  >
                    {unreadCount} new
                  </span>
                )}
              </div>
              <div
                style={{ display: "flex", alignItems: "center", gap: "10px" }}
              >
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    style={{
                      fontSize: "10px",
                      fontWeight: 700,
                      color: GOLDD,
                      background: "transparent",
                      border: "none",
                      cursor: "pointer",
                      fontFamily: "'Lato',sans-serif",
                      letterSpacing: "0.06em",
                      textTransform: "uppercase",
                    }}
                  >
                    Mark all read
                  </button>
                )}
                {allNotifications.length > 0 && (
                  <button
                    onClick={clearAll}
                    style={{
                      fontSize: "10px",
                      color: "rgba(255,255,255,0.35)",
                      background: "transparent",
                      border: "none",
                      cursor: "pointer",
                      fontFamily: "'Lato',sans-serif",
                    }}
                  >
                    Clear all
                  </button>
                )}
                <button
                  onClick={() => setOpen(false)}
                  style={{
                    width: "28px",
                    height: "28px",
                    border: "0.5px solid rgba(255,255,255,0.2)",
                    background: "transparent",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    color: "rgba(255,255,255,0.6)",
                  }}
                >
                  <X size={14} />
                </button>
              </div>
            </div>

            {/* Physical updates sub-header (if any physical unread) */}
            {physicalUnread > 0 && (
              <div
                style={{
                  background: "rgba(184,150,62,0.06)",
                  borderBottom: "0.5px solid rgba(184,150,62,0.2)",
                  padding: "9px 16px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <Package size={12} style={{ color: GOLD }} />
                <span
                  style={{
                    fontSize: "10px",
                    fontWeight: 700,
                    color: NAVY,
                    fontFamily: "'Lato',sans-serif",
                    flex: 1,
                  }}
                >
                  {physicalUnread} new physical update
                  {physicalUnread > 1 ? "s" : ""} from Abuja Registry
                </span>
                <a
                  href="/my-account/seller-account/repository"
                  onClick={() => setOpen(false)}
                  style={{
                    fontSize: "10px",
                    fontWeight: 700,
                    color: GOLD,
                    textDecoration: "none",
                    fontFamily: "'Lato',sans-serif",
                    display: "flex",
                    alignItems: "center",
                    gap: "3px",
                  }}
                >
                  View Repository <ChevronRight size={10} />
                </a>
              </div>
            )}

            {/* Body */}
            <div
            style={{
              maxHeight: "440px",
              overflowY: "auto",
              scrollbarWidth: "none",
            }}
            >
              {allNotifications.length === 0 ? (
                <div style={{ padding: "48px 24px", textAlign: "center" }}>
                  <div
                    style={{
                      width: "56px",
                      height: "56px",
                      border: "0.5px solid #e5ddd0",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      margin: "0 auto 14px",
                      background: CREAM,
                    }}
                  >
                    <Bell size={22} style={{ color: "#ccc" }} />
                  </div>
                  <p
                    style={{
                      fontFamily: "'Playfair Display',serif",
                      fontSize: "15px",
                      fontWeight: 700,
                      color: NAVY,
                      margin: "0 0 4px",
                    }}
                  >
                    All quiet here
                  </p>
                  <p
                    style={{
                      fontSize: "12px",
                      color: "#aaa",
                      fontFamily: "'Lato',sans-serif",
                      margin: 0,
                    }}
                  >
                    No notifications yet
                  </p>
                </div>
              ) : (
                displayed.map((n, idx) => {
                  const cfg = getConfig(n.type);
                  const Icon = cfg.icon;
                  const isPhysical = physicalTypes.has(n.type);

                  /* Section divider: show "Physical Updates" header before first physical notification */
                  let sectionHeader = null;
                  if (isPhysical && !lastWasPhysical) {
                    sectionHeader = (
                      <div
                        key={`phys-header-${idx}`}
                        className="nb-section-header"
                      >
                        <Package size={10} /> Abuja Registry Updates
                      </div>
                    );
                  }
                  lastWasPhysical = isPhysical;

                  const row = (
                    <div
                      key={n.id}
                      className="nb-row"
                      onClick={() => handleClick(n)}
                      style={{ background: n.read ? "#fff" : cfg.bg }}
                    >
                      {!n.read && (
                        <div
                          style={{
                            position: "absolute",
                            left: 0,
                            top: 0,
                            bottom: 0,
                            width: "3px",
                            background: cfg.barColor,
                          }}
                        />
                      )}
                      <div
                        style={{
                          width: "34px",
                          height: "34px",
                          flexShrink: 0,
                          border: `0.5px solid ${cfg.border}`,
                          background: n.read ? CREAM : cfg.bg,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Icon size={15} style={{ color: cfg.iconColor }} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "flex-start",
                            justifyContent: "space-between",
                            gap: "8px",
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              flexDirection: "column",
                              gap: "3px",
                              minWidth: 0,
                            }}
                          >
                            <p
                              style={{
                                fontSize: "12px",
                                fontWeight: 700,
                                color: n.read ? "#888" : NAVY,
                                margin: 0,
                                fontFamily: "'Lato',sans-serif",
                                lineHeight: 1.4,
                              }}
                            >
                              {n.title}
                            </p>
                            {cfg.label && (
                              <span
                                className="nb-type-badge"
                                style={{
                                  alignSelf: "flex-start",
                                  background: cfg.bg,
                                  color: cfg.iconColor,
                                  border: `0.5px solid ${cfg.border}`,
                                }}
                              >
                                {cfg.label}
                              </span>
                            )}
                          </div>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "4px",
                              flexShrink: 0,
                            }}
                          >
                            <span
                              style={{
                                fontSize: "10px",
                                color: "#bbb",
                                fontFamily: "'Lato',sans-serif",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {formatTime(n.createdAt)}
                            </span>
                            <button
                              className="nb-del"
                              onClick={(e) => deleteNotification(e, n)}
                              title="Dismiss"
                            >
                              <Trash2 size={11} />
                            </button>
                          </div>
                        </div>

                        {n.message && (
                          <p
                            style={{
                              fontSize: "11px",
                              color: n.read ? "#aaa" : "#666",
                              margin: "4px 0 0",
                              fontFamily: "'Lato',sans-serif",
                              lineHeight: 1.5,
                              display: "-webkit-box",
                              WebkitLineClamp: 3,
                              WebkitBoxOrient: "vertical",
                              overflow: "hidden",
                            }}
                          >
                            {n.message}
                          </p>
                        )}

                        {/* Stock pill for low-stock notifications */}
                        {n.type === "physical_low_stock" &&
                          n.currentStock !== undefined && (
                            <StockPill
                              current={n.currentStock}
                              total={n.totalConsignment}
                            />
                          )}

                        {/* Amount chip for physical_sale */}
                        {n.type === "physical_sale" && n.amount && (
                          <div
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px",
                              background: "#f0fdf4",
                              border: "0.5px solid rgba(22,163,74,0.3)",
                              padding: "2px 8px",
                              marginTop: "5px",
                            }}
                          >
                            <span
                              style={{
                                fontSize: "10px",
                                fontWeight: 700,
                                color: "#16a34a",
                                fontFamily: "'Lato',sans-serif",
                              }}
                            >
                              +₦{Number(n.amount).toLocaleString()} added to
                              balance
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  );

                  return sectionHeader ? [sectionHeader, row] : row;
                })
              )}
            </div>

            {/* Footer */}
            {allNotifications.length > 6 && (
              <div
                style={{
                  borderTop: "0.5px solid #f0ebe0",
                  padding: "10px 16px",
                  background: CREAM,
                }}
              >
                <button
                  onClick={() => setShowAll((p) => !p)}
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "4px",
                    fontSize: "10px",
                    fontWeight: 700,
                    color: NAVY,
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                    fontFamily: "'Lato',sans-serif",
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                  }}
                >
                  {showAll
                    ? "Show less"
                    : `View all ${allNotifications.length} notifications`}
                  <ChevronRight
                    size={11}
                    style={{
                      transform: showAll ? "rotate(90deg)" : "none",
                      transition: "transform 0.2s",
                    }}
                  />
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}