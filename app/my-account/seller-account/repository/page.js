"use client";
import { useState, useEffect, useRef } from "react";
import {
  Package, TrendingUp, BookOpen, MapPin, ArrowLeft,
  ChevronRight, X, AlertTriangle, CheckCircle, Clock,
  Layers, Hash, DollarSign, BarChart2, RefreshCw,
  ShoppingBag, Inbox, ArrowUpRight, Filter, Search,
  Download, Calendar, FileText, Bell, BellDot,
  Receipt, Zap, AlertCircle, User
} from "lucide-react";
import Link from "next/link";
import { auth, db } from "@/lib/firebaseConfig";
import {
  collection, query, where, onSnapshot,
  getDocs, orderBy, doc, getDoc, limit
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";
import Navbar from "@/components/NavBar";

/* ─── colour tokens ──────────────────────────────────────────── */
const NAVY  = "#0d2244";
const GOLD  = "#b8963e";
const GOLDD = "#d4aa5a";
const CREAM = "#f5f0e8";
const BG    = "#f5f1ea";

/* ─── Stock health thresholds ────────────────────────────────── */
const stockStatus = (current, total) => {
  if (total === 0) return { label: "No Stock",     color: "#aaa",     bg: "#f5f5f5" };
  const pct = current / total;
  if (pct === 0)   return { label: "Out of Stock", color: "#dc2626",  bg: "#fef2f2" };
  if (pct <= 0.2)  return { label: "Critical",     color: "#ea580c",  bg: "#fff7ed" };
  if (pct <= 0.5)  return { label: "Low",          color: "#d97706",  bg: "#fffbeb" };
  return               { label: "Good",         color: "#16a34a",  bg: "#f0fdf4" };
};

/* ─── Stock Health Bar ───────────────────────────────────────── */
function StockBar({ current, total }) {
  const pct = total > 0 ? Math.max(0, Math.min(1, current / total)) : 0;
  const st  = stockStatus(current, total);
  return (
    <div>
      <div style={{ height: "6px", background: "#e5ddd0", overflow: "hidden", marginBottom: "4px" }}>
        <div style={{
          height: "100%", width: `${pct * 100}%`,
          background: pct > 0.5 ? GOLD : pct > 0.2 ? "#f59e0b" : "#ef4444",
          transition: "width 0.6s ease"
        }} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: "9px", fontWeight: 700, color: st.color, fontFamily: "'Lato',sans-serif", letterSpacing: "0.08em", textTransform: "uppercase" }}>
          {st.label}
        </span>
        <span style={{ fontSize: "10px", color: "#aaa", fontFamily: "'Lato',sans-serif" }}>
          {current} / {total}
        </span>
      </div>
    </div>
  );
}

/* ─── Notification Bell ──────────────────────────────────────── */
function NotificationBell({ userId }) {
  const [unread, setUnread] = useState(0);
  const [open,   setOpen]   = useState(false);
  const [notifs, setNotifs] = useState([]);
  const ref = useRef(null);

  useEffect(() => {
    if (!userId) return;
    const q = query(
      collection(db, "notifications"),
      where("userId", "==", userId),
      orderBy("createdAt", "desc"),
      limit(20)
    );
    const unsub = onSnapshot(q, snap => {
      const docs = snap.docs.map(d => ({ id: d.id, ...d.data(), createdAt: d.data().createdAt?.toDate?.() || new Date() }));
      setNotifs(docs);
      setUnread(docs.filter(n => !n.read).length);
    });
    return () => unsub();
  }, [userId]);

  /* close on outside click */
  useEffect(() => {
    const handler = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const typeIcon = (type) => {
    if (type === "physical_sale")       return "📦";
    if (type === "physical_low_stock")  return "⚠️";
    return "🔔";
  };

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{ background: "rgba(255,255,255,0.08)", border: "0.5px solid rgba(255,255,255,0.15)", borderRadius: "8px", width: "36px", height: "36px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", position: "relative", color: "#fff" }}
      >
        <Bell size={15} />
        {unread > 0 && (
          <span style={{ position: "absolute", top: "5px", right: "5px", width: "8px", height: "8px", background: "#ef4444", borderRadius: "50%", border: "1.5px solid #0d2244" }} />
        )}
      </button>

      {open && (
        <div style={{ position: "absolute", top: "44px", right: 0, width: "340px", background: "#fff", border: "0.5px solid #e5ddd0", boxShadow: "0 20px 60px rgba(13,34,68,0.18)", zIndex: 200, animation: "fadeUp 0.2s ease both" }}>
          {/* header */}
          <div style={{ padding: "14px 16px", borderBottom: "0.5px solid #f0ebe0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <p style={{ fontSize: "11px", fontWeight: 700, color: NAVY, margin: 0, fontFamily: "'Lato',sans-serif", letterSpacing: "0.06em" }}>NOTIFICATIONS</p>
              {unread > 0 && <p style={{ fontSize: "10px", color: GOLD, margin: "2px 0 0", fontFamily: "'Lato',sans-serif" }}>{unread} unread</p>}
            </div>
            <button onClick={() => setOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#aaa" }}><X size={13} /></button>
          </div>

          {/* list */}
          <div style={{ maxHeight: "360px", overflowY: "auto" }}>
            {notifs.length === 0 ? (
              <div style={{ padding: "32px 16px", textAlign: "center" }}>
                <Bell size={24} style={{ color: "#ddd", margin: "0 auto 8px" }} />
                <p style={{ fontSize: "12px", color: "#aaa", fontFamily: "'Lato',sans-serif", margin: 0 }}>No notifications yet</p>
              </div>
            ) : notifs.map(n => (
              <div key={n.id} style={{ padding: "12px 16px", borderBottom: "0.5px solid #f8f5ef", background: n.read ? "#fff" : "#fffbeb", display: "flex", gap: "10px", alignItems: "flex-start" }}>
                <span style={{ fontSize: "14px", flexShrink: 0, marginTop: "1px" }}>{typeIcon(n.type)}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: "12px", fontWeight: 700, color: NAVY, margin: "0 0 2px", fontFamily: "'Lato',sans-serif" }}>{n.title}</p>
                  <p style={{ fontSize: "11px", color: "#666", margin: "0 0 4px", fontFamily: "'Lato',sans-serif", lineHeight: 1.5 }}>{n.message}</p>
                  <p style={{ fontSize: "10px", color: "#bbb", margin: 0, fontFamily: "'Lato',sans-serif" }}>
                    {n.createdAt?.toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit" })} · {n.createdAt?.toLocaleDateString("en-NG", { day: "2-digit", month: "short" })}
                  </p>
                </div>
                {!n.read && <div style={{ width: "7px", height: "7px", background: GOLD, borderRadius: "50%", flexShrink: 0, marginTop: "4px" }} />}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Banking Ledger Table ───────────────────────────────────── */
function LedgerTable({ sales, loading }) {
  if (loading) return (
    <div style={{ textAlign: "center", padding: "32px 0" }}>
      <div style={{ width: "28px", height: "28px", border: `2px solid ${GOLD}`, borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto" }} />
    </div>
  );

  if (sales.length === 0) return (
    <div style={{ textAlign: "center", padding: "40px 24px", border: "0.5px dashed #e5ddd0", background: "#fafaf8" }}>
      <Inbox size={32} style={{ color: "#ddd", margin: "0 auto 12px" }} />
      <p style={{ fontFamily: "'Playfair Display',serif", fontSize: "16px", fontWeight: 700, color: NAVY, margin: "0 0 4px" }}>No sales recorded yet</p>
      <p style={{ fontSize: "12px", color: "#aaa", fontFamily: "'Lato',sans-serif", margin: 0 }}>Sales will appear here in real-time once a pickup is recorded at the registry.</p>
    </div>
  );

  return (
    <div style={{ overflowX: "auto" }}>
      {/* Table header */}
      <div style={{ display: "grid", gridTemplateColumns: "140px 1fr 130px 110px 100px", gap: 0, background: NAVY, padding: "10px 16px" }}>
        {["Date / Time", "Student", "Asset ID", "Amount Credited", "Stock Left"].map(h => (
          <span key={h} style={{ fontSize: "9px", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: GOLDD, fontFamily: "'Lato',sans-serif" }}>{h}</span>
        ))}
      </div>

      {/* Rows */}
      {sales.map((s, i) => (
        <div
          key={s.id}
          className="ledger-row"
          style={{
            display: "grid", gridTemplateColumns: "140px 1fr 130px 110px 100px",
            gap: 0, padding: "13px 16px",
            borderBottom: "0.5px solid #f0ebe0",
            background: i % 2 === 0 ? "#fff" : "#fafaf8",
            animation: "fadeUp 0.3s ease both",
            animationDelay: `${i * 0.04}s`
          }}
        >
          {/* Date / Time */}
          <div>
            <p style={{ fontSize: "12px", fontWeight: 700, color: NAVY, margin: "0 0 1px", fontFamily: "'Lato',sans-serif" }}>
              {s.soldAt?.toLocaleDateString("en-NG", { day: "2-digit", month: "short" })}
            </p>
            <p style={{ fontSize: "10px", color: "#aaa", margin: 0, fontFamily: "'Lato',sans-serif" }}>
              {s.soldAt?.toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit" })}
            </p>
          </div>

          {/* Student */}
          <div>
            <p style={{ fontSize: "12px", fontWeight: 700, color: NAVY, margin: "0 0 1px", fontFamily: "'Lato',sans-serif", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {s.studentName || "Unknown Student"}
            </p>
            <p style={{ fontSize: "10px", color: "#aaa", margin: 0, fontFamily: "'Lato',sans-serif", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {s.studentEmail || "—"}
            </p>
          </div>

          {/* Asset ID */}
          <div style={{ display: "flex", alignItems: "center" }}>
            <span style={{
              fontFamily: "monospace", fontSize: "11px", fontWeight: 700,
              color: GOLD, background: "rgba(184,150,62,0.1)",
              border: "0.5px solid rgba(184,150,62,0.25)",
              padding: "2px 7px", letterSpacing: "0.04em"
            }}>{s.assetId}</span>
          </div>

          {/* Amount Credited */}
          <div style={{ display: "flex", alignItems: "center" }}>
            <div>
              <p style={{ fontSize: "13px", fontWeight: 700, color: "#16a34a", margin: "0 0 1px", fontFamily: "'Lato',sans-serif" }}>
                +₦{Number(s.sellerPayout || 0).toLocaleString()}
              </p>
              <span style={{ fontSize: "9px", fontWeight: 700, color: "#16a34a", background: "#f0fdf4", padding: "1px 6px", fontFamily: "'Lato',sans-serif", letterSpacing: "0.06em", textTransform: "uppercase" }}>
                Cleared
              </span>
            </div>
          </div>

          {/* Stock left */}
          <div style={{ display: "flex", alignItems: "center" }}>
            <span style={{
              fontSize: "12px", fontWeight: 700,
              color: s.stockAfter === 0 ? "#dc2626" : s.stockAfter <= 5 ? "#d97706" : NAVY,
              fontFamily: "'Lato',sans-serif"
            }}>
              {s.stockAfter ?? "—"} copies
            </span>
          </div>
        </div>
      ))}

      {/* Footer total */}
      <div style={{ display: "grid", gridTemplateColumns: "140px 1fr 130px 110px 100px", gap: 0, padding: "12px 16px", background: CREAM, borderTop: `1px solid ${GOLD}` }}>
        <span style={{ fontSize: "10px", fontWeight: 700, color: NAVY, fontFamily: "'Lato',sans-serif", letterSpacing: "0.08em", gridColumn: "1/4", textTransform: "uppercase" }}>
          {sales.length} transaction{sales.length !== 1 ? "s" : ""}
        </span>
        <div>
          <p style={{ fontSize: "13px", fontWeight: 700, color: "#16a34a", margin: 0, fontFamily: "'Lato',sans-serif" }}>
            +₦{sales.reduce((s, r) => s + (r.sellerPayout || 0), 0).toLocaleString()}
          </p>
          <p style={{ fontSize: "9px", color: "#aaa", margin: 0, fontFamily: "'Lato',sans-serif", textTransform: "uppercase", letterSpacing: "0.06em" }}>Total Credited</p>
        </div>
      </div>
    </div>
  );
}

/* ─── Asset Ledger Drawer ────────────────────────────────────── */
function LedgerDrawer({ asset, userId, onClose }) {
  const [sales,   setSales]   = useState([]);
  const [loading, setLoading] = useState(true);

  /* ── Real-time listener on physicalSales for this asset ── */
  useEffect(() => {
    if (!asset) return;
    setLoading(true);
    const q = query(
      collection(db, "physicalSales"),
      where("assetId",  "==", asset.assetId),
      where("sellerId", "==", asset.sellerId),
      orderBy("soldAt", "desc")
    );
    const unsub = onSnapshot(q, snap => {
      setSales(snap.docs.map(d => ({
        id: d.id, ...d.data(),
        soldAt: d.data().soldAt?.toDate?.() || new Date()
      })));
      setLoading(false);
    }, () => setLoading(false));
    return () => unsub();
  }, [asset]);

  if (!asset) return null;
  const st      = stockStatus(asset.currentStock, asset.totalConsignment);
  const revenue = sales.reduce((s, r) => s + (r.sellerPayout || 0), 0);

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 60, background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)", display: "flex", justifyContent: "flex-end" }}>
      <div style={{ background: "#fff", width: "100%", maxWidth: "560px", height: "100%", overflowY: "auto", boxShadow: "-24px 0 64px rgba(13,34,68,0.25)", animation: "slideIn 0.28s cubic-bezier(0.4,0,0.2,1) both" }}>

        {/* Header */}
        <div style={{ background: NAVY, padding: "24px", backgroundImage: "radial-gradient(rgba(184,150,62,0.07) 1px,transparent 1px)", backgroundSize: "20px 20px", position: "relative", overflow: "hidden" }} className="mt-25">
          <div style={{ position: "absolute", top: "-24px", right: "-24px", width: "96px", height: "96px", border: "0.5px solid rgba(184,150,62,0.18)", transform: "rotate(45deg)" }} />
          <button onClick={onClose} style={{ background: "transparent", border: "none", color: "rgba(255,255,255,0.5)", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px", fontSize: "11px", fontFamily: "'Lato',sans-serif", fontWeight: 700, letterSpacing: "0.06em", marginBottom: "16px" }}>
            <X size={14} /> Close
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px" }}>
            <div style={{ background: GOLD, padding: "4px 10px", fontSize: "9px", fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: NAVY, fontFamily: "'Lato',sans-serif" }}>
              {asset.assetId}
            </div>
            <div style={{ padding: "4px 10px", border: `0.5px solid ${st.color}`, fontSize: "9px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: st.color, fontFamily: "'Lato',sans-serif" }}>
              {st.label}
            </div>
          </div>
          <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: "20px", fontWeight: 700, color: "#fff", margin: "0 0 4px", lineHeight: 1.3 }}>
            {asset.bookTitle}
          </h2>
          {asset.courseCode && (
            <p style={{ fontSize: "11px", color: GOLDD, fontFamily: "'Lato',sans-serif", margin: 0 }}>{asset.courseCode}</p>
          )}
        </div>

        {/* Stats grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1px", background: "#e5ddd0", borderBottom: "1px solid #e5ddd0" }}>
          {[
            { label: "Copies Consigned", val: asset.totalConsignment,       icon: <Package    size={14} style={{ color: GOLD }} /> },
            { label: "On Shelf",         val: asset.currentStock,           icon: <Layers     size={14} style={{ color: GOLD }} /> },
            { label: "Copies Sold",      val: asset.soldCount || 0,         icon: <ShoppingBag size={14} style={{ color: GOLD }} /> },
            { label: "Your Earnings",    val: `₦${revenue.toLocaleString()}`, icon: <DollarSign size={14} style={{ color: GOLD }} /> },
          ].map(({ label, val, icon }) => (
            <div key={label} style={{ background: "#fff", padding: "16px 18px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "6px" }}>
                {icon}
                <span style={{ fontSize: "9px", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#aaa", fontFamily: "'Lato',sans-serif" }}>{label}</span>
              </div>
              <p style={{ fontSize: "20px", fontWeight: 700, color: NAVY, margin: 0, fontFamily: "'Playfair Display',serif" }}>{val}</p>
            </div>
          ))}
        </div>

        {/* Stock bar */}
        <div style={{ padding: "18px 24px", borderBottom: "0.5px solid #f0ebe0", background: CREAM }}>
          <p style={{ fontSize: "9px", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: GOLD, fontFamily: "'Lato',sans-serif", margin: "0 0 10px" }}>Stock Health</p>
          <StockBar current={asset.currentStock} total={asset.totalConsignment} />
        </div>

        {/* Shelf + date info */}
        <div style={{ padding: "18px 24px", borderBottom: "0.5px solid #f0ebe0" }}>
          {[
            { icon: <MapPin    size={13} style={{ color: GOLD }} />, label: "Shelf Location", val: asset.shelfLocation || "Unassigned" },
            { icon: <Calendar  size={13} style={{ color: GOLD }} />, label: "Checked In",     val: asset.checkedInAt ? new Date(asset.checkedInAt.seconds ? asset.checkedInAt.seconds * 1000 : asset.checkedInAt).toLocaleDateString("en-NG", { day: "2-digit", month: "long", year: "numeric" }) : "—" },
            { icon: <RefreshCw size={13} style={{ color: GOLD }} />, label: "Last Restock",   val: asset.lastRestockDate ? new Date(asset.lastRestockDate.seconds ? asset.lastRestockDate.seconds * 1000 : asset.lastRestockDate).toLocaleDateString("en-NG", { day: "2-digit", month: "short", year: "numeric" }) : "—" },
          ].map(({ icon, label, val }) => (
            <div key={label} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "8px 0", borderBottom: "0.5px solid #f8f5ef" }}>
              {icon}
              <span style={{ fontSize: "11px", color: "#aaa", fontFamily: "'Lato',sans-serif", flex: 1 }}>{label}</span>
              <span style={{ fontSize: "12px", fontWeight: 700, color: NAVY, fontFamily: "'Lato',sans-serif" }}>{val}</span>
            </div>
          ))}
          {asset.adminNotes && (
            <div style={{ background: "#fffbeb", border: "0.5px solid #fde68a", padding: "10px 12px", marginTop: "12px" }}>
              <p style={{ fontSize: "10px", fontWeight: 700, color: "#92400e", margin: "0 0 4px", fontFamily: "'Lato',sans-serif", letterSpacing: "0.1em", textTransform: "uppercase" }}>Admin Notes</p>
              <p style={{ fontSize: "11px", color: "#78350f", margin: 0, fontFamily: "'Lato',sans-serif", lineHeight: 1.6 }}>{asset.adminNotes}</p>
            </div>
          )}
        </div>

        {/* ── Physical Sales Ledger (banking style) ── */}
        <div style={{ padding: "20px 0" }}>
          <div style={{ padding: "0 24px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <p style={{ fontSize: "9px", fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: GOLD, fontFamily: "'Lato',sans-serif", margin: "0 0 2px" }}>Physical Sales Ledger</p>
              <p style={{ fontSize: "11px", color: "#aaa", fontFamily: "'Lato',sans-serif", margin: 0 }}>Updated in real-time · Abuja Registry</p>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
              <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#4ade80", animation: "pulse2 2s infinite" }} />
              <span style={{ fontSize: "10px", color: "#4ade80", fontFamily: "'Lato',sans-serif", fontWeight: 700 }}>Live</span>
            </div>
          </div>

          {/* Compact ledger for drawer */}
          {loading ? (
            <div style={{ textAlign: "center", padding: "32px 0" }}>
              <div style={{ width: "28px", height: "28px", border: `2px solid ${GOLD}`, borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto" }} />
            </div>
          ) : sales.length === 0 ? (
            <div style={{ margin: "0 24px", textAlign: "center", padding: "32px 0", border: "0.5px dashed #e5ddd0" }}>
              <Inbox size={28} style={{ color: "#ddd", margin: "0 auto 8px" }} />
              <p style={{ fontSize: "12px", color: "#aaa", fontFamily: "'Lato',sans-serif", margin: 0 }}>No physical sales recorded yet</p>
            </div>
          ) : (
            <>
              {/* Ledger header */}
              <div style={{ display: "grid", gridTemplateColumns: "120px 1fr 105px 80px", gap: 0, background: NAVY, padding: "9px 24px" }}>
                {["Date / Time", "Student", "Credited (90%)", "Stock"].map(h => (
                  <span key={h} style={{ fontSize: "9px", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: GOLDD, fontFamily: "'Lato',sans-serif" }}>{h}</span>
                ))}
              </div>
              {sales.map((s, i) => (
                <div key={s.id} style={{ display: "grid", gridTemplateColumns: "120px 1fr 105px 80px", gap: 0, padding: "12px 24px", borderBottom: "0.5px solid #f0ebe0", background: i % 2 === 0 ? "#fff" : "#fafaf8", animation: "fadeUp 0.25s ease both", animationDelay: `${i * 0.04}s` }}>
                  {/* Date */}
                  <div>
                    <p style={{ fontSize: "11px", fontWeight: 700, color: NAVY, margin: "0 0 1px", fontFamily: "'Lato',sans-serif" }}>
                      {s.soldAt?.toLocaleDateString("en-NG", { day: "2-digit", month: "short" })}
                    </p>
                    <p style={{ fontSize: "10px", color: "#bbb", margin: 0, fontFamily: "'Lato',sans-serif" }}>
                      {s.soldAt?.toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                  {/* Student */}
                  <div>
                    <p style={{ fontSize: "11px", fontWeight: 700, color: NAVY, margin: "0 0 1px", fontFamily: "'Lato',sans-serif", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", paddingRight: "8px" }}>
                      {s.studentName || "Unknown"}
                    </p>
                    <p style={{ fontSize: "10px", color: "#bbb", margin: 0, fontFamily: "'Lato',sans-serif", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", paddingRight: "8px" }}>
                      {s.studentEmail || "—"}
                    </p>
                  </div>
                  {/* Payout */}
                  <div style={{ display: "flex", alignItems: "center" }}>
                    <div>
                      <p style={{ fontSize: "12px", fontWeight: 700, color: "#16a34a", margin: "0 0 2px", fontFamily: "'Lato',sans-serif" }}>
                        +₦{Number(s.sellerPayout || 0).toLocaleString()}
                      </p>
                      <span style={{ fontSize: "9px", fontWeight: 700, color: "#16a34a", background: "#f0fdf4", padding: "1px 5px", fontFamily: "'Lato',sans-serif", letterSpacing: "0.04em" }}>CLEARED</span>
                    </div>
                  </div>
                  {/* Stock after */}
                  <div style={{ display: "flex", alignItems: "center" }}>
                    <span style={{ fontSize: "12px", fontWeight: 700, color: s.stockAfter === 0 ? "#dc2626" : s.stockAfter <= 5 ? "#d97706" : NAVY, fontFamily: "'Lato',sans-serif" }}>
                      {s.stockAfter ?? "—"}
                    </span>
                  </div>
                </div>
              ))}
              {/* Running total */}
              <div style={{ display: "grid", gridTemplateColumns: "120px 1fr 105px 80px", gap: 0, padding: "12px 24px", background: CREAM, borderTop: `1px solid ${GOLD}` }}>
                <span style={{ fontSize: "10px", fontWeight: 700, color: NAVY, fontFamily: "'Lato',sans-serif", gridColumn: "1/3", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  {sales.length} sale{sales.length !== 1 ? "s" : ""}
                </span>
                <div>
                  <p style={{ fontSize: "13px", fontWeight: 700, color: "#16a34a", margin: 0, fontFamily: "'Lato',sans-serif" }}>
                    +₦{revenue.toLocaleString()}
                  </p>
                  <p style={{ fontSize: "9px", color: "#aaa", margin: 0, fontFamily: "'Lato',sans-serif", textTransform: "uppercase", letterSpacing: "0.06em" }}>Total Earned</p>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   MAIN PAGE — Seller Repository
════════════════════════════════════════════════════════════════ */
export default function SellerRepository() {
  const [user,          setUser]          = useState(null);
  const [assets,        setAssets]        = useState([]);
  const [allSales,      setAllSales]      = useState([]); // all sales for this seller
  const [loading,       setLoading]       = useState(true);
  const [salesLoading,  setSalesLoading]  = useState(true);
  const [search,        setSearch]        = useState("");
  const [filter,        setFilter]        = useState("all");
  const [view,          setView]          = useState("inventory"); // "inventory" | "ledger"
  const [selectedAsset, setSelectedAsset] = useState(null);
  const router = useRouter();

  /* ── Auth ── */
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) { router.push("/auth/signin"); return; }
      const uDoc = await getDoc(doc(db, "users", u.uid));
      if (uDoc.exists()) setUser({ uid: u.uid, ...uDoc.data() });
    });
    return () => unsub();
  }, [router]);

  /* ── Real-time physicalInventory listener ── */
  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, "physicalInventory"),
      where("sellerId", "==", user.uid),
      orderBy("checkedInAt", "desc")
    );
    const unsub = onSnapshot(q, snap => {
      setAssets(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return () => unsub();
  }, [user]);

  /* ── Real-time physicalSales listener (all sales for this seller) ── */
  useEffect(() => {
    if (!user) return;
    setSalesLoading(true);
    const q = query(
      collection(db, "physicalSales"),
      where("sellerId", "==", user.uid),
      orderBy("soldAt", "desc")
    );
    const unsub = onSnapshot(q, snap => {
      setAllSales(snap.docs.map(d => ({
        id: d.id, ...d.data(),
        soldAt: d.data().soldAt?.toDate?.() || new Date()
      })));
      setSalesLoading(false);
    }, () => setSalesLoading(false));
    return () => unsub();
  }, [user]);

  /* ── Derived stats ── */
  const totalOnShelf  = assets.reduce((s, a) => s + (a.currentStock    || 0), 0);
  const totalSold     = assets.reduce((s, a) => s + (a.soldCount        || 0), 0);
  const totalRevenue  = allSales.reduce((s, r) => s + (r.sellerPayout   || 0), 0);

  /* ── Filtered + searched assets ── */
  const displayed = assets.filter(a => {
    const matchSearch = !search || a.bookTitle?.toLowerCase().includes(search.toLowerCase()) || a.courseCode?.toLowerCase().includes(search.toLowerCase());
    if (!matchSearch) return false;
    if (filter === "low") {
      const pct = a.totalConsignment > 0 ? a.currentStock / a.totalConsignment : 0;
      return pct <= 0.3 && pct > 0;
    }
    if (filter === "out") return a.currentStock === 0;
    return true;
  });

  const lowStockCount   = assets.filter(a => { const pct = a.totalConsignment > 0 ? a.currentStock / a.totalConsignment : 0; return pct <= 0.3 && pct > 0; }).length;
  const outOfStockCount = assets.filter(a => a.currentStock === 0 && a.totalConsignment > 0).length;

  /* ── Ledger search (all-sales view) ── */
  const ledgerSearch   = search.toLowerCase();
  const displayedSales = view === "ledger"
    ? allSales.filter(s => !ledgerSearch || s.studentName?.toLowerCase().includes(ledgerSearch) || s.assetId?.toLowerCase().includes(ledgerSearch) || s.bookTitle?.toLowerCase().includes(ledgerSearch))
    : [];

  if (loading) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: BG }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ width: "56px", height: "56px", border: `3px solid ${GOLD}`, borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 16px" }} />
        <p style={{ fontFamily: "'Playfair Display',serif", fontSize: "18px", color: NAVY }}>Loading your repository…</p>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    </div>
  );

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400&family=Lato:wght@300;400;700&display=swap');
        * { box-sizing: border-box; }
        body { margin: 0; }
        .repo-root { font-family: 'Lato', sans-serif; background: ${BG}; min-height: 100vh; }
        .repo-serif { font-family: 'Playfair Display', Georgia, serif; }
        .asset-card { background: #fff; border: 0.5px solid #e5ddd0; transition: border-color 0.2s, box-shadow 0.2s; cursor: pointer; }
        .asset-card:hover { border-color: ${GOLD}; box-shadow: 0 8px 32px rgba(13,34,68,0.08); }
        .ledger-row:hover { background: #f5f1ea !important; }
        .filter-pill { padding: 6px 14px; border: 0.5px solid #e5ddd0; font-size: 11px; font-weight: 700; cursor: pointer; transition: all 0.18s; font-family: 'Lato',sans-serif; letter-spacing: 0.06em; background: #fff; }
        .filter-pill.active { background: ${NAVY}; color: #fff; border-color: ${NAVY}; }
        .filter-pill:not(.active):hover { border-color: ${GOLD}; color: ${NAVY}; }
        .view-tab { padding: 8px 20px; font-size: 12px; font-weight: 700; cursor: pointer; border: none; font-family: 'Lato',sans-serif; letter-spacing: 0.06em; text-transform: uppercase; transition: all 0.18s; }
        .view-tab.active { background: ${NAVY}; color: #fff; }
        .view-tab:not(.active) { background: #fff; color: #aaa; border-bottom: 2px solid transparent; }
        .view-tab:not(.active):hover { color: ${NAVY}; }
        @keyframes spin    { to { transform: rotate(360deg); } }
        @keyframes fadeUp  { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
        @keyframes slideIn { from { opacity:0; transform:translateX(24px); } to { opacity:1; transform:translateX(0); } }
        @keyframes pulse2  { 0%,100%{opacity:1} 50%{opacity:0.4} }
        .fade-up { animation: fadeUp 0.4s ease both; }
        .pulse { animation: pulse2 2s infinite; }
      `}</style>

      <div className="repo-root">
        <Navbar />

        {/* ── Top Bar ── */}
        <div style={{ background: NAVY, borderBottom: `1px solid rgba(184,150,62,0.2)`, padding: "0 24px", backgroundImage: "radial-gradient(rgba(184,150,62,0.05) 1px,transparent 1px)", backgroundSize: "20px 20px" }}>
          <div style={{ maxWidth: "1100px", margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", height: "60px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              <Link href="/my-account/seller-account" style={{ display: "flex", alignItems: "center", gap: "6px", color: "rgba(255,255,255,0.5)", textDecoration: "none", fontSize: "12px", fontFamily: "'Lato',sans-serif" }}>
                <ArrowLeft size={14} /> Dashboard
              </Link>
              <span style={{ color: "rgba(255,255,255,0.2)" }}>›</span>
              <span style={{ color: GOLDD, fontSize: "12px", fontFamily: "'Lato',sans-serif", fontWeight: 700 }}>Physical Repository</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <div className="pulse" style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#4ade80" }} />
                <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.5)", fontFamily: "'Lato',sans-serif" }}>Live · Abuja Registry</span>
              </div>
              {user && <NotificationBell userId={user.uid} />}
            </div>
          </div>
        </div>

        <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "28px 16px 80px" }}>

          {/* ── Page Title ── */}
          <div className="fade-up" style={{ marginBottom: "28px" }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "rgba(184,150,62,0.12)", border: "0.5px solid rgba(184,150,62,0.3)", padding: "5px 14px", marginBottom: "10px" }}>
              <BookOpen size={11} style={{ color: GOLD }} />
              <span style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: GOLD, fontFamily: "'Lato',sans-serif" }}>Physical Inventory</span>
            </div>
            <h1 className="repo-serif" style={{ fontSize: "clamp(24px,4vw,38px)", fontWeight: 700, color: NAVY, margin: "0 0 6px" }}>Your Repository</h1>
            <p style={{ fontSize: "13px", color: "#888", fontFamily: "'Lato',sans-serif", margin: 0, lineHeight: 1.7 }}>
              Real-time view of every physical asset consigned at the Abuja Registry. Sales update instantly when a student collects a copy.
            </p>
          </div>

          {/* ── Summary Stats ── */}
          <div className="fade-up" style={{ marginBottom: "24px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: "12px" }}>
              <style>{`@media(min-width:640px){.stats-grid-4{grid-template-columns:repeat(4,1fr) !important;}}`}</style>
              <div className="stats-grid-4" style={{ display: "contents" }}>
                {[
                  { label: "Titles Consigned",  val: assets.length,                       icon: <FileText    size={16} style={{ color: GOLD }} />, dark: false },
                  { label: "Total On Shelf",    val: totalOnShelf,                         icon: <Layers      size={16} style={{ color: GOLD }} />, dark: false },
                  { label: "Copies Sold",       val: totalSold,                            icon: <ShoppingBag size={16} style={{ color: GOLD }} />, dark: false },
                  { label: "Your Earnings",     val: `₦${totalRevenue.toLocaleString()}`,  icon: <TrendingUp  size={16} style={{ color: GOLD }} />, dark: true  },
                ].map(({ label, val, icon, dark }) => (
                  <div key={label} style={{ background: dark ? NAVY : "#fff", border: `0.5px solid ${dark ? "transparent" : "#e5ddd0"}`, padding: "18px 20px", backgroundImage: dark ? "radial-gradient(rgba(184,150,62,0.06) 1px,transparent 1px)" : "none", backgroundSize: "16px 16px" }}>
                    <div style={{ width: "34px", height: "34px", background: dark ? "rgba(184,150,62,0.15)" : CREAM, border: `0.5px solid ${dark ? "rgba(184,150,62,0.3)" : "#e5ddd0"}`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "10px" }}>
                      {icon}
                    </div>
                    <p style={{ fontSize: "9px", fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: dark ? GOLDD : "#aaa", margin: "0 0 4px", fontFamily: "'Lato',sans-serif" }}>{label}</p>
                    <p className="repo-serif" style={{ fontSize: "26px", fontWeight: 700, color: dark ? "#fff" : NAVY, margin: 0 }}>{val}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Alert Banner ── */}
          {(lowStockCount > 0 || outOfStockCount > 0) && (
            <div className="fade-up" style={{ background: "#fffbeb", border: "0.5px solid #fde68a", padding: "14px 18px", marginBottom: "20px", display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
              <AlertTriangle size={16} style={{ color: "#d97706", flexShrink: 0 }} />
              <p style={{ fontSize: "12px", color: "#78350f", fontFamily: "'Lato',sans-serif", margin: 0, flex: 1, lineHeight: 1.6 }}>
                {outOfStockCount > 0 && <><strong>{outOfStockCount} title{outOfStockCount > 1 ? "s" : ""} out of stock</strong> — contact the Abuja Registry to arrange a restock. </>}
                {lowStockCount   > 0 && <><strong>{lowStockCount} title{lowStockCount > 1 ? "s" : ""}</strong> at ≤30% stock.</>}
              </p>
              <button onClick={() => { setFilter("out"); setView("inventory"); }} style={{ background: "#d97706", color: "#fff", border: "none", padding: "6px 14px", fontSize: "11px", fontWeight: 700, cursor: "pointer", fontFamily: "'Lato',sans-serif", whiteSpace: "nowrap" }}>
                View Critical
              </button>
            </div>
          )}

          {/* ── View Tabs ── */}
          <div className="fade-up" style={{ display: "flex", marginBottom: "20px", borderBottom: `2px solid ${NAVY}` }}>
            {[
              { key: "inventory", label: `Inventory (${assets.length})` },
              { key: "ledger",    label: `Sales Ledger (${allSales.length})` },
            ].map(({ key, label }) => (
              <button key={key} className={`view-tab${view === key ? " active" : ""}`} onClick={() => setView(key)}>
                {label}
              </button>
            ))}
          </div>

          {/* ── Search / Filters ── */}
          <div className="fade-up" style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px", flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: "180px", position: "relative" }}>
              <Search size={13} style={{ position: "absolute", left: "11px", top: "50%", transform: "translateY(-50%)", color: "#bbb" }} />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder={view === "ledger" ? "Search by student, title or asset ID…" : "Search by title or course code…"}
                style={{ width: "100%", border: "0.5px solid #e5ddd0", padding: "9px 12px 9px 32px", fontSize: "13px", color: NAVY, outline: "none", fontFamily: "'Lato',sans-serif", background: "#fff" }}
              />
            </div>
            {view === "inventory" && [
              { key: "all", label: `All (${assets.length})` },
              { key: "low", label: `Low Stock${lowStockCount > 0 ? ` (${lowStockCount})` : ""}` },
              { key: "out", label: `Out of Stock${outOfStockCount > 0 ? ` (${outOfStockCount})` : ""}` },
            ].map(({ key, label }) => (
              <button key={key} className={`filter-pill${filter === key ? " active" : ""}`} onClick={() => setFilter(key)}>
                {label}
              </button>
            ))}
          </div>

          {/* ══════════════════════════════════════════
              VIEW: INVENTORY
          ══════════════════════════════════════════ */}
          {view === "inventory" && (
            displayed.length === 0 ? (
              <div style={{ textAlign: "center", padding: "64px 0", border: "0.5px dashed #e5ddd0", background: "#fff" }}>
                <Package size={40} style={{ color: "#ddd", margin: "0 auto 14px" }} />
                <p className="repo-serif" style={{ fontSize: "20px", fontWeight: 700, color: NAVY, margin: "0 0 6px" }}>
                  {assets.length === 0 ? "No physical assets yet" : "No results found"}
                </p>
                <p style={{ fontSize: "13px", color: "#aaa", fontFamily: "'Lato',sans-serif", margin: "0 0 20px" }}>
                  {assets.length === 0 ? "Visit the Abuja Registry to consign your physical copies." : "Try a different search or filter."}
                </p>
                {assets.length === 0 && (
                  <Link href="/admin/office-check-in" style={{ background: NAVY, color: "#fff", padding: "12px 24px", textDecoration: "none", fontSize: "12px", fontWeight: 700, fontFamily: "'Lato',sans-serif", letterSpacing: "0.06em" }}>
                    Contact Registry
                  </Link>
                )}
              </div>
            ) : (
              <div style={{ display: "grid", gap: "12px" }}>
                {displayed.map((asset, i) => {
                  const st = stockStatus(asset.currentStock, asset.totalConsignment);
                  return (
                    <div key={asset.id} className="asset-card fade-up" style={{ animationDelay: `${i * 0.05}s` }} onClick={() => setSelectedAsset(asset)}>
                      <div style={{ padding: "18px 20px", display: "flex", alignItems: "flex-start", gap: "14px" }}>
                        <div style={{ width: "4px", alignSelf: "stretch", background: st.color, flexShrink: 0, borderRadius: "2px" }} />
                        <div style={{ width: "44px", height: "44px", background: CREAM, border: "0.5px solid #e5ddd0", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          <BookOpen size={18} style={{ color: NAVY }} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "10px", marginBottom: "4px" }}>
                            <h3 style={{ fontSize: "14px", fontWeight: 700, color: NAVY, fontFamily: "'Lato',sans-serif", margin: 0, lineHeight: 1.4, overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                              {asset.bookTitle}
                            </h3>
                            <div style={{ padding: "3px 9px", background: st.bg, border: `0.5px solid ${st.color}`, fontSize: "9px", fontWeight: 700, color: st.color, fontFamily: "'Lato',sans-serif", letterSpacing: "0.1em", textTransform: "uppercase", whiteSpace: "nowrap", flexShrink: 0 }}>
                              {st.label}
                            </div>
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: "14px", flexWrap: "wrap" }}>
                            {asset.courseCode && <span style={{ fontSize: "10px", color: GOLD, fontFamily: "'Lato',sans-serif", fontWeight: 700 }}>{asset.courseCode}</span>}
                            <span style={{ fontSize: "10px", color: "#aaa", fontFamily: "'Lato',sans-serif", display: "flex", alignItems: "center", gap: "4px" }}><MapPin size={10} /> {asset.shelfLocation || "No shelf assigned"}</span>
                            <span style={{ fontSize: "10px", color: "#aaa", fontFamily: "'Lato',sans-serif", display: "flex", alignItems: "center", gap: "4px" }}><Hash size={10} style={{ color: GOLD }} /> {asset.assetId}</span>
                          </div>
                        </div>
                      </div>
                      <div style={{ borderTop: "0.5px solid #f0ebe0", padding: "14px 20px", background: "#fafafa" }}>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "16px", marginBottom: "14px" }}>
                          {[
                            { label: "Consigned", val: asset.totalConsignment || 0 },
                            { label: "On Shelf",  val: asset.currentStock || 0 },
                            { label: "Sold",      val: asset.soldCount || 0 },
                          ].map(({ label, val }) => (
                            <div key={label}>
                              <p style={{ fontSize: "9px", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#bbb", margin: "0 0 2px", fontFamily: "'Lato',sans-serif" }}>{label}</p>
                              <p style={{ fontSize: "18px", fontWeight: 700, color: NAVY, margin: 0, fontFamily: "'Playfair Display',serif" }}>{val}</p>
                            </div>
                          ))}
                        </div>
                        <StockBar current={asset.currentStock} total={asset.totalConsignment} />
                      </div>
                      <div style={{ borderTop: "0.5px solid #f0ebe0", padding: "10px 20px", display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "6px" }}>
                        <span style={{ fontSize: "10px", fontWeight: 700, color: NAVY, fontFamily: "'Lato',sans-serif", letterSpacing: "0.06em" }}>View Ledger</span>
                        <ChevronRight size={13} style={{ color: GOLD }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          )}

          {/* ══════════════════════════════════════════
              VIEW: FULL SALES LEDGER
          ══════════════════════════════════════════ */}
          {view === "ledger" && (
            <div className="fade-up" style={{ background: "#fff", border: "0.5px solid #e5ddd0", overflow: "hidden" }}>
              {/* Ledger header bar */}
              <div style={{ padding: "16px 20px", borderBottom: "0.5px solid #f0ebe0", background: CREAM, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "10px" }}>
                <div>
                  <p style={{ fontSize: "9px", fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: GOLD, fontFamily: "'Lato',sans-serif", margin: "0 0 2px" }}>Physical Sales Ledger</p>
                  <p style={{ fontSize: "11px", color: "#888", fontFamily: "'Lato',sans-serif", margin: 0 }}>
                    All copies picked up at the Abuja Registry · Real-time
                  </p>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#4ade80", animation: "pulse2 2s infinite" }} />
                  <span style={{ fontSize: "10px", color: "#4ade80", fontFamily: "'Lato',sans-serif", fontWeight: 700 }}>Live</span>
                </div>
              </div>
              <LedgerTable sales={displayedSales} loading={salesLoading} />
            </div>
          )}

        </div>
      </div>

      {/* ── Asset Ledger Drawer ── */}
      {selectedAsset && (
        <LedgerDrawer
          asset={selectedAsset}
          userId={user?.uid}
          onClose={() => setSelectedAsset(null)}
        />
      )}
    </>
  );
}