"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import {
  TrendingUp, TrendingDown, DollarSign, ShoppingBag, Eye, EyeOff,
  Download, ChevronRight, BarChart2, Calendar, RefreshCw, AlertCircle,
  ArrowUpRight, ArrowDownLeft, Package
} from "lucide-react";
import { auth, db } from "@/lib/firebaseConfig";
import { collection, query, where, getDocs, getDoc, doc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";

/* ─── colour tokens ─────────────────────────────────────────── */
const NAVY  = "#0d2244";
const GOLD  = "#b8963e";
const GOLDD = "#d4aa5a";
const CREAM = "#f5f0e8";
const BG    = "#f5f1ea";
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

/* ══════════════════════════════════════════════════════════════
   CURRENCY SYSTEM  (ported 1:1 from BountyCard)
══════════════════════════════════════════════════════════════ */
const CURRENCY_DISPLAY = {
  NGN: { symbol: "₦",    flag: "🇳🇬", name: "Nigerian Naira"        },
  GHS: { symbol: "GH₵",  flag: "🇬🇭", name: "Ghanaian Cedi"         },
  KES: { symbol: "KSh",  flag: "🇰🇪", name: "Kenyan Shilling"       },
  UGX: { symbol: "USh",  flag: "🇺🇬", name: "Ugandan Shilling"      },
  TZS: { symbol: "TSh",  flag: "🇹🇿", name: "Tanzanian Shilling"    },
  ZAR: { symbol: "R",    flag: "🇿🇦", name: "South African Rand"    },
  XOF: { symbol: "CFA",  flag: "🌍",  name: "West African CFA"      },
  XAF: { symbol: "CFA",  flag: "🌍",  name: "Central African CFA"   },
  EGP: { symbol: "E£",   flag: "🇪🇬", name: "Egyptian Pound"        },
  MAD: { symbol: "DH",   flag: "🇲🇦", name: "Moroccan Dirham"       },
  ETB: { symbol: "Br",   flag: "🇪🇹", name: "Ethiopian Birr"        },
  ZMW: { symbol: "ZK",   flag: "🇿🇲", name: "Zambian Kwacha"        },
  RWF: { symbol: "RF",   flag: "🇷🇼", name: "Rwandan Franc"         },
  MWK: { symbol: "MK",   flag: "🇲🇼", name: "Malawian Kwacha"       },
  BWP: { symbol: "P",    flag: "🇧🇼", name: "Botswana Pula"         },
  NAD: { symbol: "N$",   flag: "🇳🇦", name: "Namibian Dollar"       },
  CDF: { symbol: "FC",   flag: "🇨🇩", name: "Congolese Franc"       },
};

/* 1 NGN = X units of target currency */
const NGN_RATES = {
  NGN: 1,
  GHS: 0.010,
  KES: 0.11,
  UGX: 2.85,
  TZS: 2.62,
  RWF: 1.38,
  ZMW: 0.028,
  MWK: 1.77,
  EGP: 0.051,
  MAD: 0.105,
  ZAR: 0.019,
  XOF: 0.656,
  XAF: 0.656,
  ETB: 0.057,
  BWP: 0.014,
  NAD: 0.019,
  CDF: 2.85,
};

function convertFromNGN(ngnAmt, toCurrency) {
  return ngnAmt * (NGN_RATES[toCurrency] ?? 1);
}

function fmtAmt(amount, currency) {
  return Math.round(amount).toLocaleString();
}

/* Formats an NGN amount into the chosen display currency */
function displayCurrency(ngnAmt, currency, currInfo) {
  if (currency === "NGN") return `₦${Math.round(ngnAmt).toLocaleString()}`;
  const converted = convertFromNGN(ngnAmt, currency);
  return `${currInfo.symbol}${fmtAmt(converted, currency)}`;
}

/* ══════════════════════════════════════════════════════════════
   CURRENCY PICKER MODAL  (same design as BountyCard)
══════════════════════════════════════════════════════════════ */
function CurrencyPickerModal({ currentCurrency, onSelect, onClose }) {
  const currencies = Object.entries(CURRENCY_DISPLAY);
  if (typeof document === "undefined") return null;
  return createPortal(
    <div onClick={onClose} style={{
      position: "fixed", inset: 0, background: "rgba(7,19,31,.7)",
      zIndex: 1400, display: "flex", alignItems: "center", justifyContent: "center",
      padding: 24, backdropFilter: "blur(4px)",
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: "#fff", maxWidth: 440, width: "100%",
        border: "0.5px solid #e5ddd0",
        maxHeight: "82vh", display: "flex", flexDirection: "column",
        animation: "fadeUp .25s cubic-bezier(.4,0,.2,1) both",
      }}>
        {/* Header */}
        <div style={{ background: NAVY, padding: "18px 22px", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
          <div>
            <p style={{ fontSize: 9, color: GOLD, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", fontFamily: "'Lato',sans-serif", margin: "0 0 4px" }}>
              Display Currency
            </p>
            <p style={{ fontFamily: "'Playfair Display',serif", fontSize: 17, fontWeight: 700, color: "#fff", margin: 0 }}>
              Choose Your Currency
            </p>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "rgba(255,255,255,.45)", fontSize: 24, cursor: "pointer", lineHeight: 1 }}>×</button>
        </div>

        {/* Info note */}
        <div style={{ padding: "10px 18px", background: "rgba(184,150,62,.07)", borderBottom: "0.5px solid rgba(184,150,62,.15)", flexShrink: 0 }}>
          <p style={{ fontSize: 11, color: "#a16207", fontFamily: "'Lato',sans-serif", margin: 0, lineHeight: 1.6 }}>
            All amounts are approximate conversions from NGN using estimated exchange rates. Your actual payouts are always processed in NGN.
          </p>
        </div>

        {/* Grid */}
        <div style={{ overflowY: "auto", padding: "12px 14px 18px", flex: 1 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {currencies.map(([code, info]) => {
              const isActive = code === currentCurrency;
              return (
                <button key={code} onClick={() => { onSelect(code); onClose(); }}
                  style={{
                    display: "flex", alignItems: "center", gap: 10,
                    padding: "11px 13px",
                    border: `1.5px solid ${isActive ? GOLD : "#e5ddd0"}`,
                    background: isActive ? CREAM : "#fff",
                    cursor: "pointer", textAlign: "left", transition: "all .15s",
                    fontFamily: "'Lato',sans-serif",
                  }}
                  onMouseEnter={e => { if (!isActive) { e.currentTarget.style.borderColor = GOLD; e.currentTarget.style.background = "#fdf9f0"; } }}
                  onMouseLeave={e => { if (!isActive) { e.currentTarget.style.borderColor = "#e5ddd0"; e.currentTarget.style.background = "#fff"; } }}>
                  <span style={{ fontSize: 20, lineHeight: 1, flexShrink: 0 }}>{info.flag}</span>
                  <div style={{ minWidth: 0 }}>
                    <p style={{ fontSize: 12, fontWeight: 700, color: isActive ? GOLD : NAVY, margin: 0 }}>
                      {info.symbol} {code}
                    </p>
                    <p style={{ fontSize: 9, color: "#aaa", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {info.name}
                    </p>
                  </div>
                  {isActive && (
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={GOLD} strokeWidth="2.5" style={{ marginLeft: "auto", flexShrink: 0 }}>
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

/* ─── Sparkline ─────────────────────────────────────────────── */
function Sparkline({ data = [], color = GOLD, height = 40, width = 120 }) {
  if (data.length < 2) return null;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const pts = data.map((v, i) => ({
    x: (i / (data.length - 1)) * width,
    y: height - ((v - min) / range) * (height - 6) - 3,
  }));
  const polyPts = pts.map(p => `${p.x},${p.y}`).join(" ");
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} fill="none">
      <polyline points={polyPts} stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <polyline points={`0,${height} ${polyPts} ${width},${height}`} fill={`${color}18`} stroke="none" />
    </svg>
  );
}

/* ─── Animated counter ──────────────────────────────────────── */
function AnimCounter({ value = 0, duration = 900 }) {
  const [display, setDisplay] = useState(0);
  const raf = useRef(null);
  useEffect(() => {
    const start = performance.now();
    const animate = (now) => {
      const t = Math.min((now - start) / duration, 1);
      const ease = 1 - Math.pow(1 - t, 3);
      setDisplay(Math.round(value * ease));
      if (t < 1) raf.current = requestAnimationFrame(animate);
    };
    cancelAnimationFrame(raf.current);
    raf.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf.current);
  }, [value]);
  return <>{display.toLocaleString()}</>;
}

/* ─── Status badge ──────────────────────────────────────────── */
function StatusBadge({ status }) {
  const map = {
    completed:    { bg: "#f0fdf4", color: "#16a34a", border: "#86efac", label: "Completed" },
    pending:      { bg: "#fef9c3", color: "#a16207", border: "#fde68a", label: "Pending"   },
    refunded:     { bg: "#fef2f2", color: "#dc2626", border: "#fecaca", label: "Refunded"  },
    free:         { bg: "#eff6ff", color: "#1d4ed8", border: "#bfdbfe", label: "Free"      },
    transfer_out: { bg: "#fff7ed", color: "#c2410c", border: "#fed7aa", label: "Sent"      },
    transfer_in:  { bg: "#f0fdf4", color: "#16a34a", border: "#86efac", label: "Received"  },
    physical_sale:{ bg: "#fdf4ff", color: "#7e22ce", border: "#e9d5ff", label: "Physical"  },
    bounty_payout:{ bg: "#f0fdf4", color: "#16a34a", border: "#86efac", label: "Bounty"    },
    bounty_posted:{ bg: "#fef9c3", color: "#a16207", border: "#fde68a", label: "Escrow"    },
  };
  const s = map[status] || map.completed;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      background: s.bg, border: `0.5px solid ${s.border}`,
      color: s.color, fontSize: 10, fontWeight: 700,
      padding: "3px 9px", fontFamily: "'Lato',sans-serif",
      letterSpacing: "0.04em", whiteSpace: "nowrap",
    }}>
      <span style={{ width: 5, height: 5, borderRadius: "50%", background: s.color, flexShrink: 0 }} />
      {s.label}
    </span>
  );
}

/* ─── Row icon ──────────────────────────────────────────────── */
function TxnIcon({ type }) {
  if (type === "transfer_out")  return <ArrowUpRight  size={15} style={{ color: "#ef4444" }} />;
  if (type === "transfer_in")   return <ArrowDownLeft size={15} style={{ color: "#16a34a" }} />;
  if (type === "physical_sale") return <Package       size={15} style={{ color: GOLD }} />;
  if (type === "bounty_payout") return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>;
  if (type === "bounty_posted") return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={GOLD} strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>;
  return <ShoppingBag size={15} style={{ color: NAVY }} />;
}

/* ─── Skeleton ──────────────────────────────────────────────── */
function Skeleton({ w = "100%", h = 16 }) {
  return (
    <div style={{
      width: w, height: h,
      background: "linear-gradient(90deg,#f0ebe0 25%,#e8e0d0 50%,#f0ebe0 75%)",
      backgroundSize: "200% 100%", animation: "shimmer 1.4s infinite",
    }} />
  );
}

/* ════════════════════════════════════════════════════════════════
   MAIN PAGE COMPONENT
════════════════════════════════════════════════════════════════ */
export default function EarningsOverview() {
  const router = useRouter();

  /* ── auth ── */
  const [uid,        setUid]        = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  /* ── firestore data ── */
  const [sellerDoc,    setSellerDoc]    = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [withdrawals,  setWithdrawals]  = useState([]);

  /* ── UI ── */
  const [balanceHidden,  setBalanceHidden]  = useState(false);
  const [selectedMonth,  setSelectedMonth]  = useState(new Date().getMonth());
  const [filter,         setFilter]         = useState("all");
  const [barHover,       setBarHover]       = useState(null);
  const [showCurrPicker, setShowCurrPicker] = useState(false);

  /* ── currency (persisted in localStorage — same key as BountyCard) ── */
  const [currency, setCurrency] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("lan_display_currency") || "NGN";
    }
    return "NGN";
  });

  const handleCurrencyChange = (code) => {
    setCurrency(code);
    if (typeof window !== "undefined") {
      localStorage.setItem("lan_display_currency", code);
    }
  };

  const currInfo = CURRENCY_DISPLAY[currency] || CURRENCY_DISPLAY.NGN;
  const isNGN    = currency === "NGN";

  /* helper: format any NGN value in the chosen display currency */
  const fmt = (ngnAmt) => displayCurrency(ngnAmt, currency, currInfo);

  /* secondary label shown when NOT in NGN */
  const secondary = (ngnAmt) =>
    isNGN ? null : `≈ ₦${Math.round(ngnAmt).toLocaleString()} NGN`;

  /* ── 1. Auth ── */
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (u) setUid(u.uid);
      else router.push("/auth/signin");
    });
    return unsub;
  }, [router]);

  /* ── 2. Fetch ── */
  const fetchAll = useCallback(async () => {
    if (!uid) return;
    setLoading(true);
    setError(null);
    try {
      const sSnap = await getDoc(doc(db, "sellers", uid));
      if (sSnap.exists()) setSellerDoc(sSnap.data());

      let all = [];

      /* standard sales */
      const txSnap = await getDocs(query(collection(db, "transactions"), where("sellerId", "==", uid)));
      const salesList = txSnap.docs.map(d => {
        const data = d.data();
        const isFree = !data.amount || Number(data.amount) === 0;
        return {
          id: d.id, ...data,
          title:  data.bookTitle || data.title || "Untitled Document",
          buyer:  data.buyerName || data.studentName || "Student",
          price:  Number(data.amount || data.salePrice || 0),
          isFree,
          payout: Number(data.sellerAmount || data.sellerPayout || (Number(data.amount || 0) * 0.8)),
          fee:    Number(data.platformFee  || data.fee          || (Number(data.amount || 0) * 0.2)),
          status: isFree ? "free" : (data.status || "completed"),
          type:   "sale",
          date:   data.createdAt?.toDate?.() || (data.purchaseDate ? new Date(data.purchaseDate) : new Date()),
        };
      });
      all = [...salesList];

      /* outgoing transfers */
      const outSnap = await getDocs(query(collection(db, "transfers"), where("senderId", "==", uid)));
      all = [...all, ...outSnap.docs.map(d => {
        const data = d.data();
        return { id: d.id, ...data, title: `Transfer → ${data.recipientName || "Unknown"}`, buyer: data.recipientName || "Unknown", price: Number(data.amount || 0), isFree: false, payout: -Number(data.amount || 0), fee: 0, status: "transfer_out", type: "transfer_out", date: data.createdAt?.toDate?.() || new Date() };
      })];

      /* incoming transfers */
      const inSnap = await getDocs(query(collection(db, "transfers"), where("recipientId", "==", uid)));
      all = [...all, ...inSnap.docs.map(d => {
        const data = d.data();
        return { id: `in-${d.id}`, ...data, title: `Transfer ← ${data.senderName || "Unknown"}`, buyer: data.senderName || "Unknown", price: Number(data.amount || 0), isFree: false, payout: Number(data.amount || 0), fee: 0, status: "transfer_in", type: "transfer_in", date: data.createdAt?.toDate?.() || new Date() };
      })];

      /* physical sales */
      const physSnap = await getDocs(query(collection(db, "physicalSales"), where("sellerId", "==", uid)));
      all = [...all, ...physSnap.docs.map(d => {
        const data = d.data();
        return { id: d.id, ...data, title: `📦 ${data.bookTitle || "Physical Book"} (Registry)`, buyer: data.studentName || data.buyerName || "Student", price: Number(data.salePrice || data.price || 0), isFree: false, payout: Number(data.sellerPayout || 0), fee: Number(data.platformFee || 0), status: "physical_sale", type: "physical_sale", date: data.soldAt?.toDate?.() || new Date() };
      })];

      /* bounty payouts */
      try {
        const bpSnap = await getDocs(query(collection(db, "bounties"), where("fulfilledByUid", "==", uid), where("status", "==", "fulfilled")));
        all = [...all, ...bpSnap.docs.map(d => {
          const data = d.data();
          const escrow = Number(data.escrowAmount || data.reward || 0);
          return { id: `bp-${d.id}`, ...data, title: `🎯 Bounty — ${data.title || "Bounty"}`, buyer: data.postedBy || "Student", price: escrow, isFree: false, payout: Number(data.authorPayout || Math.round(escrow * 0.8)), fee: Number(data.platformFee || Math.round(escrow * 0.2)), status: "bounty_payout", type: "bounty_payout", date: data.approvedAt?.toDate?.() || data.fulfilledAt?.toDate?.() || new Date() };
        })];
      } catch {}

      /* bounty postings */
      try {
        const bPostedSnap = await getDocs(query(collection(db, "bounties"), where("postedByUid", "==", uid)));
        all = [...all, ...bPostedSnap.docs.map(d => {
          const data = d.data();
          return { id: `bpost-${d.id}`, ...data, title: `📌 Bounty Request — ${data.title || "Bounty"}`, buyer: "Locked in Escrow", price: Number(data.reward || data.escrowAmount || 0), isFree: false, payout: -Number(data.reward || data.escrowAmount || 0), fee: 0, status: "bounty_posted", type: "bounty_posted", date: data.createdAt?.toDate?.() || new Date() };
        })];
      } catch {}

      /* withdrawals */
      const wSnap = await getDocs(query(collection(db, "withdrawals"), where("sellerId", "==", uid)));
      const wList = wSnap.docs.map(d => ({ id: d.id, ...d.data(), requestedAtDate: d.data().requestedAt?.toDate?.() || new Date() }))
        .sort((a, b) => b.requestedAtDate - a.requestedAtDate);
      setWithdrawals(wList);

      all.sort((a, b) => b.date - a.date);
      setTransactions(all);
    } catch (e) {
      console.error("EarningsOverview fetch error:", e);
      setError("Failed to load earnings data. Please refresh.");
    } finally {
      setLoading(false);
    }
  }, [uid, refreshKey]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  /* ── Derived metrics (all in NGN internally) ── */
  const totalEarningsNGN  = sellerDoc?.totalEarnings  || 0;
  const accountBalanceNGN = sellerDoc?.accountBalance || 0;
  const booksSold         = sellerDoc?.booksSold       || 0;

  const paidSales  = transactions.filter(t => t.type === "sale" && !t.isFree && t.payout > 0);
  const avgOrderNGN = paidSales.length
    ? Math.round(paidSales.reduce((s, t) => s + t.payout, 0) / paidSales.length)
    : 0;

  const pendingPayoutNGN = withdrawals
    .filter(w => w.status === "pending")
    .reduce((s, w) => s + Number(w.amount || 0), 0);

  const currentYear = new Date().getFullYear();
  const monthlyNGN  = Array(12).fill(0);
  transactions.forEach(t => {
    if (t.payout > 0 && t.date instanceof Date && t.date.getFullYear() === currentYear) {
      monthlyNGN[t.date.getMonth()] += t.payout;
    }
  });

  const thisMonthIdx = new Date().getMonth();
  const lastMonthIdx = thisMonthIdx === 0 ? 11 : thisMonthIdx - 1;
  const thisMonthNGN = monthlyNGN[thisMonthIdx];
  const lastMonthNGN = monthlyNGN[lastMonthIdx];
  const growth    = lastMonthNGN > 0 ? (((thisMonthNGN - lastMonthNGN) / lastMonthNGN) * 100).toFixed(1) : thisMonthNGN > 0 ? "100.0" : "0.0";
  const isPositive = parseFloat(growth) >= 0;

  /* convert monthly array to display currency for bar chart */
  const monthlyDisplay = monthlyNGN.map(v => isNGN ? v : convertFromNGN(v, currency));
  const barMax = Math.max(...monthlyDisplay, 1);

  const filteredTxns = filter === "all" ? transactions
    : transactions.filter(t =>
        filter === "free"  ? t.isFree
      : filter === "paid"  ? (!t.isFree && t.type === "sale" && t.payout > 0)
      : t.status === filter || t.type === filter
    );

  /* ── Skeleton ── */
  if (loading) return (
    <div style={{ minHeight: "100vh", background: BG, padding: "28px 16px 80px" }}>
      <style>{`@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>
      <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", flexDirection: "column", gap: 16 }}>
        <Skeleton h={36} w={280} />
        <Skeleton h={160} />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12 }}>
          {[0,1,2,3].map(i => <Skeleton key={i} h={110} />)}
        </div>
        <Skeleton h={260} />
      </div>
    </div>
  );

  if (error) return (
    <div style={{ minHeight: "100vh", background: BG, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center", padding: 40 }}>
        <AlertCircle size={40} style={{ color: "#ef4444", margin: "0 auto 12px" }} />
        <p style={{ fontSize: 14, color: NAVY, fontFamily: "'Lato',sans-serif", marginBottom: 16 }}>{error}</p>
        <button onClick={() => setRefreshKey(k => k + 1)} style={{ background: NAVY, color: "#fff", border: "none", padding: "10px 20px", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "'Lato',sans-serif" }}>Retry</button>
      </div>
    </div>
  );

  /* ── CSV export ── */
  const handleExportCSV = () => {
    const rows = [
      ["Title", "Buyer", "Price (NGN)", "Your Payout (NGN)", "Platform Fee (NGN)", "Status", "Date"],
      ...transactions.map(t => [`"${t.title}"`, `"${t.buyer}"`, t.price, t.payout, t.fee, t.status, t.date instanceof Date ? t.date.toLocaleDateString("en-GB") : ""]),
    ];
    const csv  = rows.map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url  = URL.createObjectURL(blob);
    Object.assign(document.createElement("a"), { href: url, download: "earnings.csv" }).click();
    URL.revokeObjectURL(url);
  };

  /* ════════════════════════════════════════════════════════ */
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700;900&family=Lato:wght@300;400;700&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        body{background:${BG};font-family:'Lato',sans-serif;}
        .lan-serif{font-family:'Playfair Display',Georgia,serif;}
        .row-hover:hover{background:${CREAM} !important;}
        .filter-btn{background:transparent;border:0.5px solid #e5ddd0;padding:7px 14px;font-size:11px;font-weight:700;cursor:pointer;font-family:'Lato',sans-serif;letter-spacing:0.06em;text-transform:uppercase;transition:all 0.15s;color:#888;}
        .filter-btn.active{background:${NAVY};color:#fff;border-color:${NAVY};}
        .filter-btn:hover:not(.active){border-color:${GOLD};color:${NAVY};}
        @keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
        @keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}
        .fade-up{animation:fadeUp 0.5s cubic-bezier(0.4,0,0.2,1) both;}
        .stat-card{background:#fff;border:0.5px solid #e5ddd0;padding:22px 20px;transition:border-color 0.18s;}
        .stat-card:hover{border-color:${GOLD};}
        ::-webkit-scrollbar{width:4px;} ::-webkit-scrollbar-track{background:transparent;} ::-webkit-scrollbar-thumb{background:#e5ddd0;}
        @media(max-width:640px){
          .stats-grid{grid-template-columns:1fr 1fr !important;}
          .bot-grid{grid-template-columns:1fr !important;}
          .table-head,.table-row{grid-template-columns:2fr 1fr 1fr !important;}
          .table-col-date{display:none !important;}
        }
      `}</style>

      <div style={{ minHeight: "100vh", background: BG, padding: "28px 16px 80px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>

          {/* ── Page header ── */}
          <div className="fade-up" style={{ marginBottom: 28, display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
            <div>
              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", color: GOLD, marginBottom: 4, fontFamily: "'Lato',sans-serif" }}>LAN Library</p>
              <h1 className="lan-serif" style={{ fontSize: "clamp(24px,4vw,36px)", fontWeight: 700, color: NAVY, lineHeight: 1.1 }}>Earnings Overview</h1>
            </div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              {/* ── CURRENCY SWITCHER BUTTON ── */}
              <button onClick={() => setShowCurrPicker(true)}
                style={{
                  display: "flex", alignItems: "center", gap: 8,
                  background: isNGN ? "#fff" : CREAM,
                  border: `1.5px solid ${isNGN ? "#e5ddd0" : GOLD}`,
                  padding: "9px 16px", fontSize: 11, fontWeight: 700,
                  color: isNGN ? "#888" : NAVY, cursor: "pointer",
                  fontFamily: "'Lato',sans-serif", letterSpacing: "0.05em",
                  transition: "all .18s",
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = GOLD; e.currentTarget.style.color = NAVY; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = isNGN ? "#e5ddd0" : GOLD; e.currentTarget.style.color = isNGN ? "#888" : NAVY; }}>
                <span style={{ fontSize: 16, lineHeight: 1 }}>{currInfo.flag}</span>
                {currInfo.symbol} {currency}
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M6 9l6 6 6-6"/>
                </svg>
              </button>

              <button onClick={handleExportCSV}
                style={{ display: "flex", alignItems: "center", gap: 7, background: "#fff", border: "0.5px solid #e5ddd0", padding: "9px 16px", fontSize: 11, fontWeight: 700, color: NAVY, cursor: "pointer", fontFamily: "'Lato',sans-serif", letterSpacing: "0.05em" }}>
                <Download size={13} /> Export CSV
              </button>
              <button onClick={() => setRefreshKey(k => k + 1)}
                style={{ display: "flex", alignItems: "center", gap: 7, background: NAVY, border: "none", padding: "9px 16px", fontSize: 11, fontWeight: 700, color: "#fff", cursor: "pointer", fontFamily: "'Lato',sans-serif", letterSpacing: "0.05em" }}>
                <RefreshCw size={12} /> Refresh
              </button>
            </div>
          </div>

          {/* non-NGN disclaimer banner */}
          {!isNGN && (
            <div className="fade-up" style={{ marginBottom: 16, background: "rgba(184,150,62,.07)", border: "0.5px solid rgba(184,150,62,.25)", borderLeft: `3px solid ${GOLD}`, padding: "10px 16px", display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 16 }}>{currInfo.flag}</span>
              <p style={{ fontSize: 11, color: "#a16207", fontFamily: "'Lato',sans-serif", margin: 0, lineHeight: 1.6 }}>
                Showing approximate values in <strong>{currInfo.name} ({currency})</strong>. Payouts are always processed in NGN. <button onClick={() => setShowCurrPicker(true)} style={{ background: "none", border: "none", color: GOLD, fontWeight: 700, cursor: "pointer", fontFamily: "'Lato',sans-serif", fontSize: 11, padding: 0, textDecoration: "underline" }}>Change currency</button>
              </p>
            </div>
          )}

          {/* ── Hero earnings card ── */}
          <div className="fade-up" style={{
            animationDelay: "0.05s", background: NAVY,
            backgroundImage: "radial-gradient(rgba(184,150,62,0.07) 1px,transparent 1px)",
            backgroundSize: "24px 24px", padding: "32px 28px", marginBottom: 20,
            position: "relative", overflow: "hidden",
          }}>
            <div style={{ position: "absolute", top: -40, right: -40, width: 160, height: 160, border: "0.5px solid rgba(184,150,62,0.12)", transform: "rotate(45deg)", pointerEvents: "none" }} />
            <div style={{ position: "absolute", bottom: -20, left: -20, width: 100, height: 100, border: "0.5px solid rgba(184,150,62,0.08)", transform: "rotate(45deg)", pointerEvents: "none" }} />

            <div style={{ display: "flex", flexWrap: "wrap", gap: 28, alignItems: "flex-end", justifyContent: "space-between" }}>
              <div>
                <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: GOLD, marginBottom: 6, fontFamily: "'Lato',sans-serif" }}>Total Earnings</p>

                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <p className="lan-serif" style={{ fontSize: "clamp(32px,6vw,54px)", fontWeight: 900, color: "#fff", lineHeight: 1 }}>
                    {balanceHidden ? `${currInfo.symbol}••••••`
                      : isNGN
                        ? <>₦<AnimCounter value={totalEarningsNGN} /></>
                        : <>{currInfo.symbol}<AnimCounter value={Math.round(convertFromNGN(totalEarningsNGN, currency))} /></>
                    }
                  </p>
                  <button onClick={() => setBalanceHidden(h => !h)}
                    style={{ background: "rgba(255,255,255,0.1)", border: "0.5px solid rgba(255,255,255,0.15)", width: 34, height: 34, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "rgba(255,255,255,0.6)", flexShrink: 0 }}>
                    {balanceHidden ? <EyeOff size={15}/> : <Eye size={15}/>}
                  </button>
                </div>

                {/* secondary NGN line when in non-NGN */}
                {!isNGN && !balanceHidden && (
                  <p style={{ fontSize: 12, color: "rgba(184,150,62,0.55)", marginTop: 4, fontFamily: "'Lato',sans-serif" }}>
                    ≈ ₦{totalEarningsNGN.toLocaleString()} NGN
                  </p>
                )}

                <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
                  <span style={{
                    display: "inline-flex", alignItems: "center", gap: 4,
                    background: isPositive ? "rgba(22,163,74,0.15)" : "rgba(220,38,38,0.15)",
                    border: `0.5px solid ${isPositive ? "rgba(22,163,74,0.3)" : "rgba(220,38,38,0.3)"}`,
                    padding: "3px 10px", fontSize: 11, fontWeight: 700,
                    color: isPositive ? "#4ade80" : "#f87171", fontFamily: "'Lato',sans-serif",
                  }}>
                    {isPositive ? <TrendingUp size={12}/> : <TrendingDown size={12}/>}
                    {isPositive ? "+" : ""}{growth}% vs last month
                  </span>
                  <span style={{ fontSize: 11, color: "rgba(184,150,62,0.6)", fontFamily: "'Lato',sans-serif" }}>
                    This month: {fmt(thisMonthNGN)}
                  </span>
                </div>

                <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginTop: 8, fontFamily: "'Lato',sans-serif" }}>
                  Available balance: <strong style={{ color: "rgba(255,255,255,0.75)" }}>{fmt(accountBalanceNGN)}</strong>
                  {!isNGN && <span style={{ color: "rgba(255,255,255,0.3)", marginLeft: 4 }}>(₦{accountBalanceNGN.toLocaleString()})</span>}
                </p>
              </div>

              {/* 12-month sparkline */}
              <div style={{ opacity: 0.85 }}>
                <Sparkline data={monthlyDisplay} color={GOLDD} height={56} width={180} />
                <p style={{ fontSize: 9, color: "rgba(184,150,62,0.5)", textAlign: "right", marginTop: 4, fontFamily: "'Lato',sans-serif", letterSpacing: "0.08em" }}>
                  {currentYear} — {currency}
                </p>
              </div>
            </div>
          </div>

          {/* ── 4 stat cards ── */}
          <div className="fade-up stats-grid" style={{
            animationDelay: "0.10s",
            display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(195px,1fr))", gap: 12, marginBottom: 20,
          }}>
            {[
              {
                icon: <ShoppingBag size={17} style={{ color: GOLD }}/>,
                label: "Documents Sold", val: booksSold.toLocaleString(),
                note: "All-time total",
                spark: monthlyNGN.map((_, i) => transactions.filter(t => t.type === "sale" && t.date?.getMonth?.() === i && t.date?.getFullYear?.() === currentYear).length),
                isCount: true,
              },
              {
                icon: <DollarSign size={17} style={{ color: GOLD }}/>,
                label: "Avg. Payout / Doc",
                val: fmt(avgOrderNGN),
                sub: !isNGN ? `₦${avgOrderNGN.toLocaleString()}` : null,
                note: "After 20% platform fee",
                spark: monthlyDisplay,
              },
              {
                icon: <BarChart2 size={17} style={{ color: GOLD }}/>,
                label: "Paid Transactions", val: paidSales.length.toLocaleString(),
                note: "Completed paid sales",
                spark: monthlyDisplay.map(v => v / 1000),
                isCount: true,
              },
              {
                icon: <Calendar size={17} style={{ color: GOLD }}/>,
                label: "Pending Payout",
                val: fmt(pendingPayoutNGN),
                sub: !isNGN ? `₦${pendingPayoutNGN.toLocaleString()}` : null,
                note: "Awaiting approval",
                spark: withdrawals.map(w => isNGN ? Number(w.amount||0) : convertFromNGN(Number(w.amount||0), currency)).slice(0,12).reverse(),
              },
            ].map(({ icon, label, val, sub, note, spark, isCount }, i) => (
              <div key={i} className="stat-card">
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                  <div style={{ width: 38, height: 38, border: "0.5px solid #e5ddd0", background: CREAM, display: "flex", alignItems: "center", justifyContent: "center" }}>{icon}</div>
                  <Sparkline data={spark.length ? spark : [0,0]} color={GOLD} height={28} width={70} />
                </div>
                <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: "#aaa", marginBottom: 4, fontFamily: "'Lato',sans-serif" }}>{label}</p>
                <p className="lan-serif" style={{ fontSize: 24, fontWeight: 700, color: NAVY, marginBottom: 2 }}>{val}</p>
                {sub && <p style={{ fontSize: 10, color: "#bbb", fontFamily: "'Lato',sans-serif", marginBottom: 2 }}>≈ {sub} NGN</p>}
                <p style={{ fontSize: 10, color: "#bbb", fontFamily: "'Lato',sans-serif" }}>{note}</p>
              </div>
            ))}
          </div>

          {/* ── Bar chart ── */}
          <div className="fade-up" style={{ animationDelay: "0.15s", background: "#fff", border: "0.5px solid #e5ddd0", padding: "24px", marginBottom: 20 }}>
            <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 20 }}>
              <div>
                <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: GOLD, marginBottom: 4, fontFamily: "'Lato',sans-serif" }}>Monthly</p>
                <h3 className="lan-serif" style={{ fontSize: 20, fontWeight: 700, color: NAVY }}>Earnings Chart</h3>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                {/* inline currency pill on chart */}
                <button onClick={() => setShowCurrPicker(true)} style={{
                  display: "inline-flex", alignItems: "center", gap: 5, fontSize: 9, fontWeight: 700,
                  background: isNGN ? "rgba(13,34,68,.06)" : "rgba(184,150,62,.15)",
                  border: `0.5px solid ${isNGN ? "rgba(13,34,68,.15)" : "rgba(184,150,62,.4)"}`,
                  color: isNGN ? "#888" : GOLD, padding: "3px 9px", cursor: "pointer",
                  fontFamily: "'Lato',sans-serif", letterSpacing: "0.06em",
                }}>
                  {currInfo.flag} {currency}
                </button>
                <span style={{ fontSize: 11, color: "#aaa", fontFamily: "'Lato',sans-serif" }}>{currentYear}</span>
              </div>
            </div>

            {/* bars */}
            <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 140, borderBottom: "0.5px solid #f0ebe0", paddingBottom: 8, position: "relative" }}>
              {monthlyDisplay.map((val, i) => {
                const pct       = (val / barMax) * 100;
                const isSelected = i === selectedMonth;
                return (
                  <div key={i} onClick={() => setSelectedMonth(i)}
                    onMouseEnter={() => setBarHover(i)} onMouseLeave={() => setBarHover(null)}
                    style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end", height: "100%", cursor: "pointer", position: "relative" }}>
                    {barHover === i && val > 0 && (
                      <div style={{ position: "absolute", bottom: `${Math.min(pct + 4, 85)}%`, background: NAVY, color: "#fff", fontSize: 9, fontWeight: 700, padding: "3px 6px", whiteSpace: "nowrap", fontFamily: "'Lato',sans-serif", zIndex: 10 }}>
                        {currInfo.symbol}{fmtAmt(val, currency)}
                        {!isNGN && <span style={{ opacity: .6 }}> ≈ ₦{Math.round(monthlyNGN[i]).toLocaleString()}</span>}
                      </div>
                    )}
                    <div style={{ width: "100%", minHeight: val > 0 ? 4 : 2, height: `${Math.max(pct, val > 0 ? 3 : 1)}%`, background: isSelected ? GOLD : `${NAVY}22`, transition: "all 0.3s", opacity: isSelected ? 1 : 0.65 }} />
                  </div>
                );
              })}
            </div>

            <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
              {MONTHS.map((m, i) => (
                <div key={i} onClick={() => setSelectedMonth(i)} style={{ flex: 1, textAlign: "center", fontSize: 9, cursor: "pointer", transition: "color 0.2s", color: i === selectedMonth ? GOLD : "#bbb", fontWeight: i === selectedMonth ? 700 : 400, fontFamily: "'Lato',sans-serif", letterSpacing: "0.05em" }}>{m}</div>
              ))}
            </div>

            {/* selected month callout */}
            <div style={{ marginTop: 16, background: CREAM, border: `0.5px solid rgba(184,150,62,0.2)`, borderLeft: `3px solid ${GOLD}`, padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
              <div>
                <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: GOLD, marginBottom: 2, fontFamily: "'Lato',sans-serif" }}>
                  {MONTHS[selectedMonth]} {currentYear}
                </p>
                <p style={{ fontSize: 11, color: "#888", fontFamily: "'Lato',sans-serif" }}>
                  {transactions.filter(t => t.date?.getMonth?.() === selectedMonth && t.date?.getFullYear?.() === currentYear && t.type === "sale").length} sales this month
                </p>
              </div>
              <div style={{ textAlign: "right" }}>
                <p className="lan-serif" style={{ fontSize: 24, fontWeight: 700, color: NAVY }}>
                  {fmt(monthlyNGN[selectedMonth])}
                </p>
                {!isNGN && (
                  <p style={{ fontSize: 10, color: "#aaa", fontFamily: "'Lato',sans-serif" }}>
                    ≈ ₦{Math.round(monthlyNGN[selectedMonth]).toLocaleString()} NGN
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* ── Recent Sales table ── */}
          <div className="fade-up" style={{ animationDelay: "0.2s", background: "#fff", border: "0.5px solid #e5ddd0" }}>
            <div style={{ padding: "20px 24px", borderBottom: "0.5px solid #f0ebe0", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
              <div>
                <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: GOLD, marginBottom: 4, fontFamily: "'Lato',sans-serif" }}>Activity</p>
                <h3 className="lan-serif" style={{ fontSize: 20, fontWeight: 700, color: NAVY }}>Recent Sales</h3>
              </div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {[
                  { key: "all",       label: "All"       },
                  { key: "completed", label: "Completed" },
                  { key: "pending",   label: "Pending"   },
                  { key: "free",      label: "Free"      },
                  { key: "refunded",  label: "Refunded"  },
                ].map(({ key, label }) => (
                  <button key={key} className={`filter-btn${filter === key ? " active" : ""}`} onClick={() => setFilter(key)}>
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* table header */}
            <div className="table-head" style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: 8, padding: "10px 24px", borderBottom: "0.5px solid #f5f0e8" }}>
              {["Product", `Price / Free (${currency})`, "Status", "Date"].map((h, i) => (
                <p key={h} className={i === 3 ? "table-col-date" : ""} style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "#bbb", fontFamily: "'Lato',sans-serif" }}>
                  {h}
                </p>
              ))}
            </div>

            {filteredTxns.length === 0 && (
              <div style={{ textAlign: "center", padding: "56px 0" }}>
                <ShoppingBag size={36} style={{ color: "#ddd", margin: "0 auto 12px" }} />
                <p style={{ fontSize: 13, color: "#aaa", fontFamily: "'Lato',sans-serif" }}>No transactions match this filter</p>
              </div>
            )}

            {filteredTxns.slice(0, 50).map((txn, i) => {
              const isOut    = txn.payout < 0;
              const amtColor = isOut ? "#ef4444" : "#16a34a";
              const payoutDisplay = fmt(Math.abs(txn.payout));
              const payoutSecondary = !isNGN && txn.payout !== 0
                ? `₦${Math.round(Math.abs(txn.payout)).toLocaleString()}`
                : null;

              return (
                <div key={txn.id} className="row-hover table-row"
                  style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: 8, padding: "14px 24px", alignItems: "center", borderBottom: i < filteredTxns.length - 1 ? "0.5px solid #f5f0e8" : "none", transition: "background 0.15s", background: "#fff" }}>

                  {/* Product */}
                  <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
                    <div style={{ width: 36, height: 36, background: CREAM, border: "0.5px solid #e5ddd0", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <TxnIcon type={txn.type} />
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <p style={{ fontSize: 12, fontWeight: 700, color: NAVY, fontFamily: "'Lato',sans-serif", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginBottom: 2 }}>
                        {txn.title}
                      </p>
                      <p style={{ fontSize: 10, color: "#bbb", fontFamily: "'Lato',sans-serif" }}>{txn.buyer}</p>
                    </div>
                  </div>

                  {/* Price */}
                  <div>
                    {txn.isFree
                      ? <span style={{ fontSize: 12, fontWeight: 700, color: "#1d4ed8", fontFamily: "'Lato',sans-serif" }}>Free</span>
                      : <>
                          <span className="lan-serif" style={{ fontSize: 14, fontWeight: 700, color: amtColor }}>
                            {isOut ? "-" : "+"}{payoutDisplay}
                          </span>
                          {payoutSecondary && (
                            <p style={{ fontSize: 9, color: "#bbb", fontFamily: "'Lato',sans-serif", marginTop: 1 }}>
                              ₦{Math.round(Math.abs(txn.payout)).toLocaleString()}
                            </p>
                          )}
                        </>
                    }
                  </div>

                  {/* Status */}
                  <div><StatusBadge status={txn.status} /></div>

                  {/* Date */}
                  <p className="table-col-date" style={{ fontSize: 11, color: "#aaa", fontFamily: "'Lato',sans-serif" }}>
                    {txn.date instanceof Date
                      ? txn.date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
                      : "—"}
                  </p>
                </div>
              );
            })}

            <div style={{ padding: "14px 24px", borderTop: "0.5px solid #f0ebe0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <p style={{ fontSize: 11, color: "#aaa", fontFamily: "'Lato',sans-serif" }}>
                {Math.min(filteredTxns.length, 50)} of {filteredTxns.length} transactions
              </p>
              {filteredTxns.length > 50 && (
                <button style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 700, color: NAVY, background: "transparent", border: "none", cursor: "pointer", fontFamily: "'Lato',sans-serif" }}>
                  View all <ChevronRight size={13}/>
                </button>
              )}
            </div>
          </div>

          {/* ── Bottom summary strip ── */}
          <div className="fade-up bot-grid" style={{
            animationDelay: "0.25s",
            display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))",
            gap: 12, marginTop: 20,
          }}>
            {[
              { label: "Total Earnings",    ngnAmt: totalEarningsNGN,   note: "All-time gross earnings" },
              { label: "Available Balance", ngnAmt: accountBalanceNGN,  note: "Ready to withdraw" },
              { label: "Avg. Payout / Doc", ngnAmt: avgOrderNGN,        note: "After 20% platform fee" },
            ].map(({ label, ngnAmt, note }) => (
              <div key={label} style={{ background: NAVY, backgroundImage: "radial-gradient(rgba(184,150,62,0.05) 1px,transparent 1px)", backgroundSize: "20px 20px", padding: "22px 20px", display: "flex", flexDirection: "column", gap: 4 }}>
                <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(184,150,62,0.7)", fontFamily: "'Lato',sans-serif" }}>{label}</p>
                <p className="lan-serif" style={{ fontSize: 28, fontWeight: 700, color: "#fff" }}>{fmt(ngnAmt)}</p>
                {!isNGN && (
                  <p style={{ fontSize: 10, color: "rgba(184,150,62,0.45)", fontFamily: "'Lato',sans-serif" }}>≈ ₦{Math.round(ngnAmt).toLocaleString()} NGN</p>
                )}
                <p style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", fontFamily: "'Lato',sans-serif" }}>{note}</p>
              </div>
            ))}
          </div>

        </div>
      </div>

      {/* ── Currency picker modal ── */}
      {showCurrPicker && typeof document !== "undefined" && (
        <CurrencyPickerModal
          currentCurrency={currency}
          onSelect={handleCurrencyChange}
          onClose={() => setShowCurrPicker(false)}
        />
      )}
    </>
  );
}