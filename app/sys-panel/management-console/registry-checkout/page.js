"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import {
  Search, Package, CheckCircle, AlertCircle, X,
  ArrowLeft, Hash, User, DollarSign, Loader2,
  ScanLine, Shield, LayoutDashboard, BookOpen,
  ChevronRight, Clock, Layers, Lock, RefreshCw,
  AlertTriangle, Receipt, Zap
} from "lucide-react";
import {
  collection, query, where, getDocs, addDoc, getDoc,
  doc, serverTimestamp, runTransaction, limit, orderBy
} from "firebase/firestore";
import { db, auth } from "@/lib/firebaseConfig";

const ADMIN_EMAILS = process.env.NEXT_PUBLIC_ADMIN_EMAILS?.split(",") || [];
const PLATFORM_FEE = 0.20; // LAN takes 10%

/* ─── Debounce ───────────────────────────────────────────────── */
function useDebounce(value, delay) {
  const [d, setD] = useState(value);
  useEffect(() => { const t = setTimeout(() => setD(value), delay); return () => clearTimeout(t); }, [value, delay]);
  return d;
}

/* ─── Sale Success Receipt ───────────────────────────────────── */
function SaleReceipt({ data, onClose, onNewSale }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px", backdropFilter: "blur(6px)" }}>
      <div style={{ background: "#162033", border: "1px solid rgba(16,185,129,0.3)", width: "100%", maxWidth: "420px", borderRadius: "16px", overflow: "hidden", boxShadow: "0 40px 80px rgba(0,0,0,0.6)", animation: "rcSlideUp 0.3s ease both" }}>
        {/* Green success header */}
        <div style={{ background: "linear-gradient(135deg,#065f46,#047857)", padding: "28px 24px", textAlign: "center" }}>
          <div style={{ width: "60px", height: "60px", background: "rgba(255,255,255,0.15)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
            <CheckCircle size={28} style={{ color: "#fff" }} />
          </div>
          <p style={{ color: "#fff", fontSize: "18px", fontWeight: 700, fontFamily: "Georgia,serif", margin: "0 0 4px" }}>Sale Recorded!</p>
          <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "12px", margin: 0 }}>Abuja Registry · {new Date().toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit" })}</p>
        </div>
        {/* Details */}
        <div style={{ padding: "20px 24px" }}>
          {[
            ["Asset ID",        data.assetId],
            ["Book",            data.bookTitle],
            ["Student",         data.studentName],
            ["Student Email",   data.studentEmail],
            ["Sale Price",      `₦${Number(data.salePrice).toLocaleString()}`],
            ["Seller Payout",   `₦${Number(data.sellerPayout).toLocaleString()} (90%)`],
            ["LAN Fee",         `₦${Number(data.lanFee).toLocaleString()} (10%)`],
            ["Stock Remaining", `${data.stockAfter} copies`],
          ].map(([k, v]) => (
            <div key={k} style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", padding: "7px 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
              <span style={{ color: "#64748b" }}>{k}</span>
              <span style={{ fontWeight: 700, color: k === "Seller Payout" ? "#34d399" : k === "LAN Fee" ? "#f87171" : k === "Asset ID" ? "#d4aa5a" : "#e2e8f0", fontFamily: k === "Asset ID" ? "monospace" : "inherit", fontSize: k === "Asset ID" ? "11px" : "12px" }}>{v}</span>
            </div>
          ))}
          {data.stockAfter <= 5 && data.stockAfter > 0 && (
            <div style={{ background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.3)", borderRadius: "8px", padding: "10px 12px", marginTop: "12px", display: "flex", gap: "8px" }}>
              <AlertTriangle size={13} style={{ color: "#fbbf24", flexShrink: 0, marginTop: "1px" }} />
              <p style={{ fontSize: "11px", color: "#fbbf24", margin: 0 }}>Low stock — only {data.stockAfter} copies remain. Notify seller to restock.</p>
            </div>
          )}
          {data.stockAfter === 0 && (
            <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "8px", padding: "10px 12px", marginTop: "12px", display: "flex", gap: "8px" }}>
              <AlertCircle size={13} style={{ color: "#f87171", flexShrink: 0, marginTop: "1px" }} />
              <p style={{ fontSize: "11px", color: "#f87171", margin: 0 }}>Stock depleted — seller notified to bring more copies.</p>
            </div>
          )}
          <div style={{ display: "flex", gap: "10px", marginTop: "18px" }}>
            <button onClick={onClose} style={{ flex: 1, background: "var(--surface2,#1f2f47)", color: "#94a3b8", padding: "11px", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "8px", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}>Done</button>
            <button onClick={onNewSale} style={{ flex: 2, background: "#10b981", color: "#fff", padding: "11px", border: "none", borderRadius: "8px", fontSize: "12px", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
              <Zap size={13} /> Record Another Sale
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MAIN — Registry Checkout Page
═══════════════════════════════════════════════════════════════ */
export default function RegistryCheckout() {
  const router = useRouter();
  const [authState, setAuthState]     = useState("loading");
  const [adminUser, setAdminUser]     = useState(null);

  /* ── Form state ── */
  const [assetIdInput, setAssetIdInput]     = useState("");
  const [studentEmail, setStudentEmail]     = useState("");
  const [salePrice, setSalePrice]           = useState("");
  const [studentName, setStudentName]       = useState("");

  /* ── Lookup state ── */
  const [assetData, setAssetData]           = useState(null);
  const [assetLoading, setAssetLoading]     = useState(false);
  const [assetError, setAssetError]         = useState("");
  const [studentData, setStudentData]       = useState(null);
  const [studentLoading, setStudentLoading] = useState(false);

  /* ── Submit state ── */
  const [processing, setProcessing]         = useState(false);
  const [saleResult, setSaleResult]         = useState(null);
  const [recentSales, setRecentSales]       = useState([]);

  const debouncedAsset   = useDebounce(assetIdInput, 600);
  const debouncedEmail   = useDebounce(studentEmail, 600);

  /* ── Admin gate ── */
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) { setAuthState("denied"); return; }
      try {
        const uDoc = await getDoc(doc(db, "users", u.uid));
        const data = uDoc.exists() ? uDoc.data() : {};
        const isAdmin = data.role === "admin" || data.isAdmin === true || ADMIN_EMAILS.includes(u.email);
        if (isAdmin) { setAdminUser(u); setAuthState("admin"); loadRecentSales(); }
        else setAuthState("denied");
      } catch { setAuthState("denied"); }
    });
    return () => unsub();
  }, []);

  const loadRecentSales = async () => {
    try {
      const snap = await getDocs(query(collection(db, "physicalSales"), orderBy("soldAt", "desc"), limit(8)));
      setRecentSales(snap.docs.map(d => ({ id: d.id, ...d.data(), soldAt: d.data().soldAt?.toDate?.() || new Date() })));
    } catch {}
  };

  /* ── Asset ID lookup (debounced) ── */
  useEffect(() => {
    const raw = debouncedAsset.trim().toUpperCase();
    if (!raw || raw.length < 8) { setAssetData(null); setAssetError(""); return; }
    lookupAsset(raw);
  }, [debouncedAsset]);

  const lookupAsset = async (id) => {
    setAssetLoading(true); setAssetError(""); setAssetData(null);
    try {
      /* Try assetId field first */
      const snap = await getDocs(query(collection(db, "physicalInventory"), where("assetId", "==", id), limit(1)));
      if (!snap.empty) {
        const inv = { id: snap.docs[0].id, ...snap.docs[0].data() };
        if (inv.currentStock <= 0) { setAssetError("This asset is out of stock."); setAssetLoading(false); return; }
        setAssetData(inv);
        if (!salePrice && inv.pricePerCopy) setSalePrice(String(inv.pricePerCopy));
      } else {
        setAssetError("Asset ID not found. Check the format e.g. LAN-ABJ-2026-1234");
      }
    } catch (e) { setAssetError("Lookup failed: " + e.message); }
    finally { setAssetLoading(false); }
  };

  /* ── Student email lookup (debounced) ── */
  useEffect(() => {
    const email = debouncedEmail.trim().toLowerCase();
    if (!email || !email.includes("@")) { setStudentData(null); return; }
    lookupStudent(email);
  }, [debouncedEmail]);

  const lookupStudent = async (email) => {
    setStudentLoading(true); setStudentData(null);
    try {
      const snap = await getDocs(query(collection(db, "users"), where("email", "==", email), limit(1)));
      if (!snap.empty) {
        const u = snap.docs[0].data();
        setStudentData({ uid: snap.docs[0].id, ...u });
        if (!studentName) setStudentName(u.displayName || `${u.firstName || ""} ${u.surname || ""}`.trim());
      }
    } catch {}
    finally { setStudentLoading(false); }
  };

  /* ══════════════════════════════════════════════════════════════
     CORE: processRegistrySale — the engine
  ══════════════════════════════════════════════════════════════ */
  const processRegistrySale = async () => {
    if (!assetData || !salePrice || !studentEmail.trim()) return;
    setProcessing(true);

    try {
      const price    = parseFloat(salePrice);
      const payout   = price * (1 - PLATFORM_FEE);
      const fee      = price * PLATFORM_FEE;
      const name     = studentName.trim() || studentData?.displayName || studentEmail.split("@")[0];

      const inventoryRef = doc(db, "physicalInventory", assetData.id);
      const sellerRef    = doc(db, "sellers", assetData.sellerId);

      let stockAfter = 0;

      await runTransaction(db, async (txn) => {
        const invSnap    = await txn.get(inventoryRef);
        const sellerSnap = await txn.get(sellerRef);

        if (!invSnap.exists()) throw new Error("Inventory record not found.");
        const invData    = invSnap.data();
        if (invData.currentStock <= 0) throw new Error("Out of stock.");

        stockAfter = invData.currentStock - 1;

        /* 1. Subtract stock */
        txn.update(inventoryRef, {
          currentStock: stockAfter,
          soldCount:    (invData.soldCount || 0) + 1,
          updatedAt:    serverTimestamp(),
        });

        /* 2. Credit seller */
        const sellerBalance = sellerSnap.exists() ? (sellerSnap.data().accountBalance || 0) : 0;
        txn.update(sellerRef, {
          accountBalance: sellerBalance + payout,
          totalEarnings:  (sellerSnap.data()?.totalEarnings || 0) + payout,
          booksSold:      (sellerSnap.data()?.booksSold || 0) + 1,
          updatedAt:      serverTimestamp(),
        });

        /* 3. Physical sale record (the ledger entry) */
        const saleRef = doc(collection(db, "physicalSales"));
        txn.set(saleRef, {
          assetId:       assetData.assetId,
          inventoryId:   assetData.id,
          bookId:        assetData.bookId || null,
          bookTitle:     assetData.bookTitle,
          sellerId:      assetData.sellerId,
          sellerName:    assetData.sellerName,
          sellerEmail:   assetData.sellerEmail,
          studentEmail:  studentEmail.trim().toLowerCase(),
          studentName:   name,
          studentId:     studentData?.uid || null,
          salePrice:     price,
          sellerPayout:  payout,
          platformFee:   fee,
          stockAfter,
          soldAt:        serverTimestamp(),
          recordedBy:    adminUser?.email || "admin",
          shelfLocation: assetData.shelfLocation || "—",
        });

        /* 4. Seller dashboard notification */
        const notifRef = doc(collection(db, "notifications"));
        txn.set(notifRef, {
          userId:    assetData.sellerId,
          type:      "physical_sale",
          title:     `📦 Copy sold: ${assetData.bookTitle}`,
          message:   `${name} just picked up a copy at the Abuja Registry. ₦${payout.toLocaleString()} credited to your balance. ${stockAfter} copies remaining.`,
          assetId:   assetData.assetId,
          amount:    payout,
          currentStock:      stockAfter,
          totalConsignment:  assetData.totalConsignment,
          createdAt: serverTimestamp(),
          read:      false,
        });

        /* 5. Low-stock notification (≤ 20% threshold) */
        if (stockAfter > 0 && stockAfter / assetData.totalConsignment <= 0.2) {
          const lowRef = doc(collection(db, "notifications"));
          txn.set(lowRef, {
            userId:           assetData.sellerId,
            type:             "physical_low_stock",
            title:            `⚠️ Low stock: ${assetData.bookTitle}`,
            message:          `Only ${stockAfter} of ${assetData.totalConsignment} copies remain at the Abuja Registry. Consider restocking soon.`,
            assetId:          assetData.assetId,
            currentStock:     stockAfter,
            totalConsignment: assetData.totalConsignment,
            createdAt:        serverTimestamp(),
            read:             false,
          });
        }

        /* 6. Out-of-stock notification */
        if (stockAfter === 0) {
          const ooRef = doc(collection(db, "notifications"));
          txn.set(ooRef, {
            userId:   assetData.sellerId,
            type:     "physical_low_stock",
            title:    `🚨 Out of stock: ${assetData.bookTitle}`,
            message:  `All copies of "${assetData.bookTitle}" have been picked up. Please bring more copies to the Abuja Registry.`,
            assetId:  assetData.assetId,
            currentStock:     0,
            totalConsignment: assetData.totalConsignment,
            createdAt: serverTimestamp(),
            read:      false,
          });
        }
      });

      /* 7. Trigger email API (non-blocking) */
      try {
        await fetch("/api/physical-sale-email", {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sellerEmail:  assetData.sellerEmail,
            sellerName:   assetData.sellerName,
            bookTitle:    assetData.bookTitle,
            studentName:  name,
            assetId:      assetData.assetId,
            payout,
            stockAfter,
          }),
        });
      } catch { /* non-critical */ }

      setSaleResult({ assetId: assetData.assetId, bookTitle: assetData.bookTitle, studentName: name, studentEmail: studentEmail.trim(), salePrice: price, sellerPayout: payout, lanFee: fee, stockAfter });
      await loadRecentSales();
    } catch (err) {
      alert("Sale failed: " + err.message);
    } finally {
      setProcessing(false);
    }
  };

  const resetForm = () => {
    setAssetIdInput(""); setStudentEmail(""); setSalePrice("");
    setStudentName(""); setAssetData(null); setAssetError("");
    setStudentData(null); setSaleResult(null);
  };

  const canSubmit = assetData && studentEmail.trim().includes("@") && salePrice && parseFloat(salePrice) > 0 && !processing;

  /* ── Loading / Denied states ── */
  if (authState === "loading") return (
    <div style={{ minHeight: "100vh", background: "#0b1628", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ width: "44px", height: "44px", border: "2px solid rgba(59,130,246,0.3)", borderTopColor: "#3b82f6", borderRadius: "50%", animation: "rcSpin 0.8s linear infinite", margin: "0 auto 12px" }} />
        <p style={{ color: "#94a3b8", fontSize: "14px" }}>Verifying access…</p>
        <style>{`@keyframes rcSpin{to{transform:rotate(360deg)}}`}</style>
      </div>
    </div>
  );

  if (authState === "denied") return (
    <div style={{ minHeight: "100vh", background: "#0b1628", display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}>
      <div style={{ background: "#162033", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "16px", padding: "48px 36px", maxWidth: "360px", width: "100%", textAlign: "center" }}>
        <div style={{ width: "64px", height: "64px", background: "rgba(239,68,68,0.12)", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
          <Lock size={28} style={{ color: "#f87171" }} />
        </div>
        <h2 style={{ color: "#e2e8f0", fontSize: "20px", fontWeight: 700, margin: "0 0 8px" }}>Admin Access Only</h2>
        <p style={{ color: "#64748b", fontSize: "13px", lineHeight: 1.6, margin: "0 0 24px" }}>The Registry Checkout is restricted to LAN administrators.</p>
        <a href="/auth/signin" style={{ background: "#3b82f6", color: "#fff", padding: "12px 24px", borderRadius: "8px", textDecoration: "none", fontSize: "13px", fontWeight: 600, display: "block" }}>Sign In as Admin</a>
      </div>
    </div>
  );

  /* ══════════════════════════════════════════════════════════════
     MAIN RENDER
  ══════════════════════════════════════════════════════════════ */
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=Lato:wght@400;700&display=swap');
        :root {
          --nav-bg:#0d1b2e; --card-bg:#162033; --card-border:rgba(255,255,255,0.07);
          --surface:#1a2740; --surface2:#1f2f47; --accent:#3b82f6; --accent-light:#60a5fa;
          --accent-glow:rgba(59,130,246,0.15); --success:#10b981; --warning:#f59e0b;
          --danger:#ef4444; --gold:#b8963e; --goldd:#d4aa5a;
          --text-primary:#e2e8f0; --text-secondary:#94a3b8; --text-muted:#64748b;
        }
        * { box-sizing:border-box; }
        body { margin:0; }
        .rc-root { font-family:'Lato',sans-serif; background:#0b1628; min-height:100vh; }
        .rc-card { background:var(--card-bg); border:1px solid var(--card-border); border-radius:12px; }
        .rc-input { width:100%; background:var(--surface); border:1px solid var(--card-border); border-radius:8px; padding:11px 13px; font-size:13px; color:var(--text-primary); outline:none; font-family:'Lato',sans-serif; transition:border-color 0.18s; }
        .rc-input:focus { border-color:rgba(59,130,246,0.5); }
        .rc-input::placeholder { color:var(--text-muted); }
        .rc-label { font-size:10px; font-weight:700; letter-spacing:0.12em; text-transform:uppercase; color:var(--text-muted); display:block; margin-bottom:6px; }
        .rc-btn { display:inline-flex; align-items:center; gap:6px; padding:11px 20px; border-radius:8px; font-size:13px; font-weight:700; cursor:pointer; transition:all 0.18s; border:none; font-family:'Lato',sans-serif; }
        .rc-btn-primary { background:var(--accent); color:#fff; }
        .rc-btn-primary:hover { background:#2563eb; }
        .rc-btn-primary:disabled { background:var(--surface2); color:var(--text-muted); cursor:not-allowed; }
        .rc-btn-success { background:#10b981; color:#fff; }
        .rc-btn-success:hover { background:#059669; }
        .rc-btn-success:disabled { opacity:0.5; cursor:not-allowed; }
        .rc-btn-ghost { background:var(--surface); color:var(--text-secondary); border:1px solid var(--card-border); }
        .rc-btn-ghost:hover { background:var(--surface2); color:var(--text-primary); }
        @keyframes rcSpin { to { transform:rotate(360deg); } }
        @keyframes rcFadeUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        @keyframes rcSlideUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        @keyframes rcPulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        .rc-fade { animation:rcFadeUp 0.3s ease both; }
        .rc-pulse { animation:rcPulse 2s infinite; }
        .sale-row { display:flex; align-items:center; gap:12px; padding:11px 14px; border-bottom:1px solid rgba(255,255,255,0.04); transition:background 0.15s; }
        .sale-row:hover { background:var(--surface); }
        .sale-row:last-child { border-bottom:none; }
      `}</style>

      <div className="rc-root">

        {/* ── Top Bar ── */}
        <header style={{ background: "var(--nav-bg)", borderBottom: "1px solid var(--card-border)", padding: "0 24px", height: "60px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 50 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <a href="/sys-panel/management-console" style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--text-muted)", textDecoration: "none", fontSize: "12px", fontWeight: 600 }}>
              <LayoutDashboard size={14} /> Admin
            </a>
            <span style={{ color: "var(--card-border)" }}>›</span>
            <a href="/sys-panel/management-console/office-check-in" style={{ color: "var(--text-muted)", textDecoration: "none", fontSize: "12px" }}>Check-In</a>
            <span style={{ color: "var(--card-border)" }}>›</span>
            <span style={{ color: "var(--accent-light)", fontSize: "12px", fontWeight: 700 }}>Registry Checkout</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div className="rc-pulse" style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#4ade80" }} />
            <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>Abuja Registry · Live</span>
            <div style={{ width: "30px", height: "30px", borderRadius: "50%", background: "linear-gradient(135deg,var(--accent),#8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: 700, color: "#fff" }}>
              {adminUser?.email?.[0]?.toUpperCase() || "A"}
            </div>
          </div>
        </header>

        <div style={{ maxWidth: "900px", margin: "0 auto", padding: "28px 16px 80px" }}>

          {/* ── Page Title ── */}
          <div style={{ marginBottom: "28px" }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: "7px", background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.3)", borderRadius: "6px", padding: "4px 12px", marginBottom: "10px" }}>
              <Receipt size={11} style={{ color: "#34d399" }} />
              <span style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: "#34d399" }}>Student Pickup · Sale Recording</span>
            </div>
            <h1 style={{ fontFamily: "'Playfair Display',Georgia,serif", fontSize: "clamp(22px,4vw,34px)", fontWeight: 700, color: "var(--text-primary)", margin: "0 0 6px" }}>Registry Checkout</h1>
            <p style={{ fontSize: "13px", color: "var(--text-muted)", margin: 0, lineHeight: 1.7 }}>
              When a student walks in to collect their copy, enter the Asset ID and their details below. The system handles everything else — stock deduction, seller credit, and notifications.
            </p>
          </div>

          {/* ── 2-column layout ── */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "20px" }}>
            <style>{`@media(min-width:768px){.rc-grid{grid-template-columns:1.4fr 1fr !important;}}`}</style>
            <div className="rc-grid" style={{ display: "grid", gridTemplateColumns: "1fr", gap: "20px" }}>

              {/* LEFT — Main Form */}
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

                {/* STEP 1 — Asset ID */}
                <div className="rc-card rc-fade" style={{ padding: "22px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
                    <div style={{ width: "34px", height: "34px", background: "var(--accent-glow)", border: "1px solid rgba(59,130,246,0.3)", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Hash size={15} style={{ color: "var(--accent-light)" }} />
                    </div>
                    <div>
                      <p style={{ fontSize: "9px", fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--accent-light)", margin: 0 }}>Step 1</p>
                      <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: "16px", fontWeight: 700, color: "var(--text-primary)", margin: "2px 0 0" }}>Scan / Enter Asset ID</h3>
                    </div>
                  </div>
                  <label className="rc-label">Asset ID *</label>
                  <div style={{ position: "relative" }}>
                    {assetLoading
                      ? <Loader2 size={14} style={{ position: "absolute", left: "11px", top: "50%", transform: "translateY(-50%)", color: "var(--accent)", animation: "rcSpin 0.8s linear infinite" }} />
                      : <ScanLine size={14} style={{ position: "absolute", left: "11px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
                    }
                    <input className="rc-input" value={assetIdInput} onChange={e => setAssetIdInput(e.target.value.toUpperCase())} placeholder="LAN-ABJ-2026-XXXX" style={{ paddingLeft: "34px", fontFamily: "monospace", fontSize: "14px", letterSpacing: "0.05em" }} />
                  </div>
                  {assetError && (
                    <div style={{ display: "flex", gap: "7px", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: "6px", padding: "8px 12px", marginTop: "10px" }}>
                      <AlertCircle size={12} style={{ color: "#f87171", flexShrink: 0, marginTop: "1px" }} />
                      <p style={{ fontSize: "11px", color: "#f87171", margin: 0 }}>{assetError}</p>
                    </div>
                  )}
                  {/* Asset preview card */}
                  {assetData && (
                    <div style={{ background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.2)", borderRadius: "8px", padding: "14px", marginTop: "12px" }}>
                      <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
                        <div style={{ width: "38px", height: "38px", background: "rgba(16,185,129,0.15)", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          <BookOpen size={16} style={{ color: "#34d399" }} />
                        </div>
                        <div style={{ flex: 1 }}>
                          <p style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-primary)", margin: "0 0 2px" }}>{assetData.bookTitle}</p>
                          <p style={{ fontSize: "11px", color: "var(--text-muted)", margin: "0 0 8px" }}>{assetData.courseCode || "No course code"} · {assetData.shelfLocation || "No shelf"}</p>
                          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                            {[
                              { label: "Seller",   val: assetData.sellerName },
                              { label: "In Stock", val: `${assetData.currentStock} / ${assetData.totalConsignment}` },
                            ].map(({ label, val }) => (
                              <div key={label}>
                                <p style={{ fontSize: "9px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-muted)", margin: "0 0 1px" }}>{label}</p>
                                <p style={{ fontSize: "12px", fontWeight: 700, color: label === "In Stock" ? (assetData.currentStock <= 5 ? "#fbbf24" : "#34d399") : "var(--text-primary)", margin: 0 }}>{val}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                        <CheckCircle size={16} style={{ color: "#34d399", flexShrink: 0 }} />
                      </div>
                    </div>
                  )}
                </div>

                {/* STEP 2 — Student */}
                <div className="rc-card rc-fade" style={{ padding: "22px", animationDelay: "0.05s" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
                    <div style={{ width: "34px", height: "34px", background: "var(--accent-glow)", border: "1px solid rgba(59,130,246,0.3)", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <User size={15} style={{ color: "var(--accent-light)" }} />
                    </div>
                    <div>
                      <p style={{ fontSize: "9px", fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--accent-light)", margin: 0 }}>Step 2</p>
                      <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: "16px", fontWeight: 700, color: "var(--text-primary)", margin: "2px 0 0" }}>Student Details</h3>
                    </div>
                  </div>
                  <div style={{ display: "grid", gap: "12px" }}>
                    <div>
                      <label className="rc-label">Student Email *</label>
                      <div style={{ position: "relative" }}>
                        {studentLoading && <Loader2 size={13} style={{ position: "absolute", right: "11px", top: "50%", transform: "translateY(-50%)", color: "var(--accent)", animation: "rcSpin 0.8s linear infinite" }} />}
                        <input className="rc-input" type="email" value={studentEmail} onChange={e => setStudentEmail(e.target.value)} placeholder="student@university.edu.ng" />
                      </div>
                      {studentData && (
                        <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "6px" }}>
                          <CheckCircle size={11} style={{ color: "#34d399" }} />
                          <span style={{ fontSize: "11px", color: "#34d399" }}>Found: {studentData.displayName || studentData.firstName}</span>
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="rc-label">Student Name (optional — auto-fills if found)</label>
                      <input className="rc-input" value={studentName} onChange={e => setStudentName(e.target.value)} placeholder="e.g. Adebayo Okafor" />
                    </div>
                  </div>
                </div>

                {/* STEP 3 — Sale Price */}
                <div className="rc-card rc-fade" style={{ padding: "22px", animationDelay: "0.1s" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
                    <div style={{ width: "34px", height: "34px", background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.3)", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <DollarSign size={15} style={{ color: "#34d399" }} />
                    </div>
                    <div>
                      <p style={{ fontSize: "9px", fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: "#34d399", margin: 0 }}>Step 3</p>
                      <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: "16px", fontWeight: 700, color: "var(--text-primary)", margin: "2px 0 0" }}>Sale Price</h3>
                    </div>
                  </div>
                  <label className="rc-label">Amount Collected (₦) *</label>
                  <div style={{ position: "relative" }}>
                    <span style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", fontSize: "14px", fontWeight: 700 }}>₦</span>
                    <input className="rc-input" type="number" value={salePrice} onChange={e => setSalePrice(e.target.value)} placeholder="e.g. 5000" min="0" style={{ paddingLeft: "28px" }} />
                  </div>
                  {salePrice && parseFloat(salePrice) > 0 && (
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginTop: "10px" }}>
                      {[
                        { label: "Seller gets (90%)", val: `₦${(parseFloat(salePrice) * 0.9).toLocaleString()}`, color: "#34d399" },
                        { label: "LAN fee (10%)",     val: `₦${(parseFloat(salePrice) * 0.1).toLocaleString()}`, color: "#f87171" },
                      ].map(({ label, val, color }) => (
                        <div key={label} style={{ background: "var(--surface)", borderRadius: "6px", padding: "8px 10px" }}>
                          <p style={{ fontSize: "9px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-muted)", margin: "0 0 2px" }}>{label}</p>
                          <p style={{ fontSize: "14px", fontWeight: 700, color, margin: 0 }}>{val}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Submit */}
                <button className="rc-btn rc-btn-success rc-fade" onClick={processRegistrySale} disabled={!canSubmit} style={{ width: "100%", justifyContent: "center", padding: "14px", fontSize: "14px", animationDelay: "0.15s", opacity: canSubmit ? 1 : 0.5 }}>
                  {processing
                    ? <><Loader2 size={16} style={{ animation: "rcSpin 0.8s linear infinite" }} /> Processing Sale…</>
                    : <><Receipt size={16} /> Record Sale & Credit Seller</>
                  }
                </button>
              </div>

              {/* RIGHT — Recent Sales */}
              <div>
                <div className="rc-card" style={{ padding: "20px" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
                    <div>
                      <p style={{ fontSize: "9px", fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--accent-light)", margin: "0 0 2px" }}>Activity</p>
                      <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: "16px", fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>Today's Sales</h3>
                    </div>
                    <button onClick={loadRecentSales} style={{ background: "var(--surface)", border: "1px solid var(--card-border)", borderRadius: "6px", width: "30px", height: "30px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "var(--text-muted)" }}>
                      <RefreshCw size={12} />
                    </button>
                  </div>
                  {recentSales.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "32px 0", border: "1px dashed var(--card-border)", borderRadius: "8px" }}>
                      <Package size={28} style={{ color: "var(--text-muted)", margin: "0 auto 8px" }} />
                      <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: 0 }}>No sales recorded yet today</p>
                    </div>
                  ) : (
                    <div>
                      {recentSales.map((s, i) => (
                        <div key={s.id} className="sale-row" style={{ animationDelay: `${i * 0.04}s` }}>
                          <div style={{ width: "32px", height: "32px", background: "rgba(16,185,129,0.1)", borderRadius: "6px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                            <CheckCircle size={14} style={{ color: "#34d399" }} />
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-primary)", margin: "0 0 2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.bookTitle}</p>
                            <p style={{ fontSize: "10px", color: "var(--text-muted)", margin: 0 }}>{s.studentName} · {s.soldAt?.toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit" })}</p>
                          </div>
                          <div style={{ textAlign: "right", flexShrink: 0 }}>
                            <p style={{ fontSize: "12px", fontWeight: 700, color: "#34d399", margin: "0 0 2px" }}>+₦{Number(s.sellerPayout).toLocaleString()}</p>
                            <p style={{ fontSize: "9px", color: "var(--text-muted)", fontFamily: "monospace" }}>{s.assetId}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Info box */}
                <div style={{ background: "var(--surface)", border: "1px solid var(--card-border)", borderRadius: "10px", padding: "16px", marginTop: "14px" }}>
                  <p style={{ fontSize: "9px", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--text-muted)", margin: "0 0 10px" }}>What this does</p>
                  {[
                    ["📦", "Reduces physicalInventory.currentStock by 1"],
                    ["💰", "Credits seller balance (90% of sale price)"],
                    ["📋", "Adds row to Physical Sales Ledger"],
                    ["🔔", "Sends real-time bell notification to seller"],
                    ["📧", "Triggers sale email via /api/physical-sale-email"],
                    ["⚠️", "Auto-alerts if stock drops ≤ 20%"],
                  ].map(([emoji, text]) => (
                    <div key={text} style={{ display: "flex", gap: "8px", marginBottom: "7px" }}>
                      <span style={{ fontSize: "12px", flexShrink: 0 }}>{emoji}</span>
                      <p style={{ fontSize: "11px", color: "var(--text-secondary)", margin: 0, lineHeight: 1.5 }}>{text}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Receipt modal */}
      {saleResult && (
        <SaleReceipt
          data={saleResult}
          onClose={resetForm}
          onNewSale={resetForm}
        />
      )}
    </>
  );
}