"use client";
/**
 * PromotionAnalyticsDashboard.jsx
 * Route: /my-account/seller-account/promotion-analytics
 *
 * Shows a seller's active & past promotions with:
 *  - Real-time impressions (IntersectionObserver, fires once per session per ad)
 *  - Click tracking (fieldValue.increment)
 *  - CTR calculation
 *  - Days remaining countdown
 *  - 7-day clicks bar chart (recharts)
 *
 * Drop-in — just needs Firebase already initialised at @/lib/firebaseConfig
 */

import { useState, useEffect, useRef, useCallback } from "react";
import {
    collection, query, where, getDocs, doc,
    updateDoc, increment, Timestamp, orderBy,
    arrayUnion, getDoc,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "@/lib/firebaseConfig";
import {
    BarChart, Bar, XAxis, YAxis, Tooltip,
    ResponsiveContainer, CartesianGrid, Cell,
} from "recharts";
import {
    Zap, Star, Award, Eye, MousePointer,
    Clock, TrendingUp, ChevronRight, RefreshCw,
    AlertCircle, ArrowUpRight, BarChart2,
} from "lucide-react";
import Link from "next/link";
import { useCurrency } from "@/app/context/CurrencyContext";

/* ── brand tokens ──────────────────────────────────────────── */
const NAVY = "#0d2244";
const GOLD = "#b8963e";
const GOLDD = "#d4aa5a";
const CREAM = "#f5f0e8";
const BG = "#f5f1ea";

const TIER_COLOR = { Gold: GOLD, Silver: "#94a3b8", Bronze: "#cd7f32" };
const TIER_ICON = { Gold: Zap, Silver: Star, Bronze: Award };

/* ── tiny utils ────────────────────────────────────────────── */
const fmt = (n = 0) => n >= 1_000_000
    ? `${(n / 1_000_000).toFixed(1)}M`
    : n >= 1_000 ? `${(n / 1_000).toFixed(1)}k` : String(n);

const ctr = (clicks = 0, impressions = 0) =>
    impressions === 0 ? "0.00" : ((clicks / impressions) * 100).toFixed(2);

const daysRemaining = (expiryDate) => {
    if (!expiryDate) return null;
    const exp = expiryDate.toDate ? expiryDate.toDate() : new Date(expiryDate);
    const diff = Math.ceil((exp - Date.now()) / 86_400_000);
    return diff;
};

const fmtDate = (ts) => {
    if (!ts) return "—";
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleDateString("en-NG", { day: "2-digit", month: "short", year: "numeric" });
};

/* Build last-7-days chart data from clickLog array stored on the promo */
const buildChartData = (clickLog = []) => {
    const days = Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        return {
            label: d.toLocaleDateString("en-NG", { weekday: "short" }),
            dateStr: d.toISOString().slice(0, 10),
            clicks: 0,
        };
    });
    clickLog.forEach((entry) => {
        const ds = entry?.date || entry; // supports string "2025-01-15" or object
        const found = days.find((d) => d.dateStr === ds);
        if (found) found.clicks += 1;
    });
    return days;
};

/* ── impression-tracking hook (IntersectionObserver) ──────── */
function useImpressionTracker(promoId, enabled = true) {
    const ref = useRef(null);
    const tracked = useRef(false);          // only once per session per ad

    useEffect(() => {
        if (!enabled || !promoId || tracked.current) return;
        const el = ref.current;
        if (!el) return;

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && !tracked.current) {
                    tracked.current = true;
                    observer.disconnect();
                    /* fire-and-forget — never blocks the render */
                    updateDoc(doc(db, "promotions", promoId), {
                        impressions: increment(1),
                    }).catch(() => { });
                }
            },
            { threshold: 0.5 }   // at least 50 % visible before counting
        );
        observer.observe(el);
        return () => observer.disconnect();
    }, [promoId, enabled]);

    return ref;
}

/* ── click tracker ─────────────────────────────────────────── */
async function trackClick(promoId) {
    const today = new Date().toISOString().slice(0, 10);
    try {
        await updateDoc(doc(db, "promotions", promoId), {
            clicks: increment(1),
            clickLog: arrayUnion(today),        // for the 7-day chart
        });
    } catch (e) {
        console.error("click track error:", e);
    }
}

/* ══════════════════════════════════════════════════════════ */
/* Single promotion performance card                          */
/* ══════════════════════════════════════════════════════════ */
function PromoCard({ promo, onClickLink }) {
    const TierIcon = TIER_ICON[promo.tier] || Zap;
    const tierColor = TIER_COLOR[promo.tier] || GOLD;
    const days = daysRemaining(promo.expiryDate);
    const ctrVal = ctr(promo.clicks, promo.impressions);
    const chartData = buildChartData(promo.clickLog || []);
    const impressionRef = useImpressionTracker(promo.id, promo.status === "active");

    const isExpired = days !== null && days <= 0;
    const isActive = promo.status === "active" && !isExpired;

    /* CTR quality colour */
    const ctrNum = parseFloat(ctrVal);
    const ctrColor = ctrNum >= 3 ? "#16a34a" : ctrNum >= 1 ? GOLD : "#ef4444";
    const ctrLabel = ctrNum >= 3 ? "Excellent" : ctrNum >= 1 ? "Good" : "Needs attention";

    return (
        <div
            ref={impressionRef}
            style={{
                background: "#fff",
                border: `0.5px solid #e5ddd0`,
                borderLeft: `4px solid ${tierColor}`,
                marginBottom: "20px",
                overflow: "hidden",
                fontFamily: "'Lato', sans-serif",
            }}
        >
            {/* ── Card Header ─────────────────────────────── */}
            <div style={{ background: NAVY, padding: "18px 22px", display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: "10px" }}>
                <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                        <div style={{ width: "28px", height: "28px", background: `${tierColor}22`, border: `1px solid ${tierColor}55`, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "4px" }}>
                            <TierIcon size={13} style={{ color: tierColor }} />
                        </div>
                        <span style={{ fontSize: "9px", fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: tierColor }}>{promo.tier} Tier</span>
                        <span style={{
                            fontSize: "9px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase",
                            padding: "2px 8px", borderRadius: "2px",
                            background: isActive ? "rgba(22,163,74,0.2)" : isExpired ? "rgba(239,68,68,0.2)" : "rgba(148,163,184,0.2)",
                            color: isActive ? "#4ade80" : isExpired ? "#f87171" : "#94a3b8",
                        }}>
                            {isActive ? "Live" : isExpired ? "Expired" : promo.status}
                        </span>
                    </div>
                    <p style={{ fontFamily: "'Playfair Display', serif", fontSize: "17px", fontWeight: 700, color: "#fff", margin: "0 0 3px", lineHeight: 1.2 }}>
                        {promo.headline || promo.bookTitle}
                    </p>
                    <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.45)", margin: 0 }}>
                        {promo.bookTitle} &mdash; {fmtDate(promo.createdAt)} → {fmtDate(promo.expiryDate)}
                    </p>
                </div>

                {/* Days remaining badge */}
                {days !== null && (
                    <div style={{ textAlign: "center", background: isExpired ? "rgba(239,68,68,0.12)" : "rgba(184,150,62,0.12)", border: `0.5px solid ${isExpired ? "rgba(239,68,68,0.3)" : "rgba(184,150,62,0.3)"}`, padding: "10px 14px", minWidth: "70px" }}>
                        <p style={{ fontSize: "22px", fontWeight: 900, color: isExpired ? "#f87171" : GOLDD, margin: 0, lineHeight: 1, fontFamily: "'Playfair Display', serif" }}>
                            {isExpired ? "0" : days}
                        </p>
                        <p style={{ fontSize: "9px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,0.5)", margin: "3px 0 0" }}>
                            {isExpired ? "Expired" : "Days left"}
                        </p>
                    </div>
                )}
            </div>

            {/* ── Stat Row ────────────────────────────────── */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", borderBottom: "0.5px solid #f0ebe0" }}>
                {[
                    { icon: Eye, label: "Impressions", value: fmt(promo.impressions || 0), color: "#3b82f6" },
                    { icon: MousePointer, label: "Clicks", value: fmt(promo.clicks || 0), color: "#10b981" },
                    { icon: TrendingUp, label: "CTR", value: `${ctrVal}%`, color: ctrColor },
                ].map(({ icon: Icon, label, value, color }, i) => (
                    <div key={label} style={{ padding: "18px 16px", borderRight: i < 2 ? "0.5px solid #f0ebe0" : "none", textAlign: "center" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "5px", marginBottom: "6px" }}>
                            <Icon size={12} style={{ color }} />
                            <span style={{ fontSize: "9px", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "#aaa" }}>{label}</span>
                        </div>
                        <p style={{ fontFamily: "'Playfair Display', serif", fontSize: "26px", fontWeight: 700, color: NAVY, margin: 0, lineHeight: 1 }}>{value}</p>
                        {label === "CTR" && (
                            <p style={{ fontSize: "9px", color: ctrColor, fontWeight: 700, marginTop: "4px" }}>{ctrLabel}</p>
                        )}
                    </div>
                ))}
            </div>

            {/* ── 7-Day Chart ─────────────────────────────── */}
            <div style={{ padding: "20px 22px" }}>
                <p style={{ fontSize: "9px", fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: GOLD, marginBottom: "14px" }}>
                    Clicks — last 7 days
                </p>
                <ResponsiveContainer width="100%" height={100}>
                    <BarChart data={chartData} margin={{ top: 0, right: 0, left: -28, bottom: 0 }} barSize={20}>
                        <CartesianGrid vertical={false} stroke="#f0ebe0" />
                        <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#aaa", fontFamily: "'Lato',sans-serif" }} axisLine={false} tickLine={false} />
                        <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: "#aaa", fontFamily: "'Lato',sans-serif" }} axisLine={false} tickLine={false} />
                        <Tooltip
                            contentStyle={{ background: NAVY, border: "none", borderRadius: "4px", padding: "6px 12px" }}
                            labelStyle={{ fontSize: "10px", color: GOLDD, fontFamily: "'Lato',sans-serif", fontWeight: 700 }}
                            itemStyle={{ fontSize: "12px", color: "#fff", fontFamily: "'Lato',sans-serif" }}
                            cursor={{ fill: "rgba(184,150,62,0.08)" }}
                        />
                        <Bar dataKey="clicks" radius={[3, 3, 0, 0]}>
                            {chartData.map((entry, index) => (
                                <Cell key={index} fill={entry.clicks > 0 ? GOLD : "#e5ddd0"} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>

            {/* ── CTA ─────────────────────────────────────── */}
            {isActive && (
                <div style={{ padding: "0 22px 18px", display: "flex", gap: "10px" }}>
                    <Link
                        href={promo.link || `/book/preview?id=${promo.bookId}`}
                        onClick={() => trackClick(promo.id)}
                        style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "11px", fontWeight: 700, color: NAVY, background: GOLD, padding: "8px 16px", textDecoration: "none", letterSpacing: "0.05em", textTransform: "uppercase" }}
                    >
                        {promo.ctaText || "View Ad"} <ArrowUpRight size={12} />
                    </Link>
                    <div style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "11px", color: "#aaa" }}>
                        <Clock size={11} />
                        <span>{fmt(Number(promo.totalPrice))} investment</span>
                    </div>
                </div>
            )}

            {/* ── CTR Insight tip ─────────────────────────── */}
            {(promo.impressions || 0) > 50 && ctrNum < 1 && (
                <div style={{ margin: "0 22px 18px", background: "#fef9c3", border: "0.5px solid #fde68a", padding: "10px 14px", display: "flex", gap: "8px" }}>
                    <AlertCircle size={14} style={{ color: "#d97706", flexShrink: 0, marginTop: "1px" }} />
                    <p style={{ fontSize: "11px", color: "#92400e", margin: 0, lineHeight: 1.6 }}>
                        <strong>Low CTR detected.</strong> Your ad is being seen but not clicked. Try a more compelling headline or a sharper banner image to increase engagement.
                    </p>
                </div>
            )}
        </div>
    );
}

/* ══════════════════════════════════════════════════════════ */
/* Main page                                                  */
/* ══════════════════════════════════════════════════════════ */
export default function PromotionAnalyticsDashboard() {
    const [promos, setPromos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);
    const [filter, setFilter] = useState("all");
    const { fmt } = useCurrency();
    /* ── auth → fetch ───────────────────────────────────── */
    useEffect(() => {
        const unsub = onAuthStateChanged(auth, async (u) => {
            if (!u) return;
            setUser(u);
            await loadPromos(u.uid);
        });
        return () => unsub();
    }, []);

    const loadPromos = async (uid) => {
        setLoading(true);
        try {
            const q = query(
                collection(db, "promotions"),
                where("sellerId", "==", uid),
                orderBy("createdAt", "desc"),
            );
            const snap = await getDocs(q);
            setPromos(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    /* ── aggregate totals ───────────────────────────────── */
    const totals = promos.reduce(
        (acc, p) => ({
            impressions: acc.impressions + (p.impressions || 0),
            clicks: acc.clicks + (p.clicks || 0),
            spend: acc.spend + (p.totalPrice || 0),
        }),
        { impressions: 0, clicks: 0, spend: 0 }
    );
    const overallCtr = ctr(totals.clicks, totals.impressions);

    const filtered = promos.filter((p) => {
        if (filter === "all") return true;
        if (filter === "active") return p.status === "active";
        if (filter === "pending") return p.status === "pending";
        if (filter === "expired") return p.status === "expired" || p.status === "rejected";
        return true;
    });

    /* ── render ─────────────────────────────────────────── */
    return (
        <>
            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700;900&family=Lato:wght@300;400;700&display=swap');
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
        .pa-root { font-family:'Lato',sans-serif; background:${BG}; min-height:100vh; }
        .pa-anim { animation: fadeUp 0.4s cubic-bezier(0.4,0,0.2,1) both; }
        .pa-tab  { padding:7px 16px; font-size:11px; font-weight:700; letter-spacing:0.06em; text-transform:uppercase; border:0.5px solid #e5ddd0; background:#fff; cursor:pointer; transition:all 0.15s; font-family:'Lato',sans-serif; }
        .pa-tab:hover { border-color:${GOLD}; }
        .pa-tab.active { background:${NAVY}; color:#fff; border-color:${NAVY}; }
      `}</style>

            <div className="pa-root" style={{ padding: "32px 16px 80px" }}>
                <div style={{ maxWidth: "860px", margin: "0 auto" }}>

                    {/* ── Page header ───────────────────────────── */}
                    <div className="pa-anim" style={{ marginBottom: "32px" }}>
                        <div style={{ display: "inline-flex", alignItems: "center", gap: "7px", background: "rgba(184,150,62,0.1)", border: "0.5px solid rgba(184,150,62,0.3)", borderRadius: "999px", padding: "4px 14px", marginBottom: "14px" }}>
                            <BarChart2 size={10} style={{ color: GOLD }} />
                            <span style={{ fontSize: "9px", fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: GOLDD }}>Ad Intelligence</span>
                        </div>
                        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(26px,5vw,40px)", fontWeight: 900, color: NAVY, margin: "0 0 10px", lineHeight: 1.08 }}>
                            Promotion<br />
                            <span style={{ color: GOLD, fontStyle: "italic" }}>Performance.</span>
                        </h1>
                        <p style={{ fontSize: "13px", color: "#888", lineHeight: 1.75, maxWidth: "480px", fontWeight: 300 }}>
                            Real-time metrics for every sponsored ad you've run. Impressions tracked on-screen with Intersection Observer — no page-load penalty.
                        </p>
                    </div>

                    {/* ── Aggregate stat cards ──────────────────── */}
                    {!loading && promos.length > 0 && (
                        <div className="pa-anim" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: "12px", marginBottom: "28px" }}>
                            {[
                                { label: "Total Impressions", value: fmt(totals.impressions), icon: Eye, color: "#3b82f6" },
                                { label: "Total Clicks", value: fmt(totals.clicks), icon: MousePointer, color: "#10b981" },
                                { label: "Overall CTR", value: `${overallCtr}%`, icon: TrendingUp, color: GOLD },
                                { label: "Total Spend", value: fmt(totals.spend), icon: Zap, color: "#8b5cf6" },
                            ].map(({ label, value, icon: Icon, color }) => (
                                <div key={label} style={{ background: "#fff", border: "0.5px solid #e5ddd0", padding: "18px 16px" }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: "7px", marginBottom: "10px" }}>
                                        <Icon size={13} style={{ color }} />
                                        <span style={{ fontSize: "9px", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "#bbb" }}>{label}</span>
                                    </div>
                                    <p style={{ fontFamily: "'Playfair Display', serif", fontSize: "26px", fontWeight: 700, color: NAVY, margin: 0 }}>{value}</p>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* ── Filter tabs ───────────────────────────── */}
                    <div style={{ display: "flex", gap: "8px", marginBottom: "22px", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between" }}>
                        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                            {["all", "active", "pending", "expired"].map((f) => (
                                <button key={f} className={`pa-tab${filter === f ? " active" : ""}`}
                                    onClick={() => setFilter(f)} style={{ color: filter === f ? "#fff" : NAVY }}>
                                    {f}
                                    <span style={{ opacity: 0.55, marginLeft: "4px" }}>
                                        ({f === "all" ? promos.length : promos.filter((p) => f === "expired" ? (p.status === "expired" || p.status === "rejected") : p.status === f).length})
                                    </span>
                                </button>
                            ))}
                        </div>
                        <button onClick={() => user && loadPromos(user.uid)} style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "11px", fontWeight: 700, color: NAVY, background: "transparent", border: "0.5px solid #e5ddd0", padding: "7px 14px", cursor: "pointer", fontFamily: "'Lato',sans-serif", letterSpacing: "0.06em" }}>
                            <RefreshCw size={12} /> Refresh
                        </button>
                    </div>

                    {/* ── Main content ──────────────────────────── */}
                    {loading ? (
                        <div style={{ display: "flex", justifyContent: "center", padding: "80px 0" }}>
                            <div style={{ width: "40px", height: "40px", border: `3px solid ${GOLD}40`, borderTopColor: GOLD, borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
                        </div>
                    ) : filtered.length === 0 ? (
                        <div style={{ background: "#fff", border: "0.5px solid #e5ddd0", padding: "60px 24px", textAlign: "center" }}>
                            <BarChart2 size={36} style={{ color: "#e5ddd0", margin: "0 auto 14px" }} />
                            <p style={{ fontFamily: "'Playfair Display',serif", fontSize: "18px", color: NAVY, margin: "0 0 6px" }}>No promotions yet</p>
                            <p style={{ fontSize: "13px", color: "#aaa", margin: "0 0 20px" }}>Run your first sponsored ad to start seeing analytics here.</p>
                            <Link href="/my-account/seller-account/ads" style={{ display: "inline-flex", alignItems: "center", gap: "7px", background: NAVY, color: "#fff", padding: "11px 22px", textDecoration: "none", fontSize: "12px", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase" }}>
                                <Zap size={13} /> Boost Your Visibility
                            </Link>
                        </div>
                    ) : (
                        filtered.map((promo) => (
                            <div key={promo.id} className="pa-anim">
                                <PromoCard promo={promo} />
                            </div>
                        ))
                    )}

                    {/* ── Upsell footer ─────────────────────────── */}
                    {!loading && promos.length > 0 && (
                        <div style={{ background: NAVY, backgroundImage: "radial-gradient(rgba(184,150,62,0.06) 1px,transparent 1px)", backgroundSize: "22px 22px", padding: "24px 28px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "16px", marginTop: "8px" }}>
                            <div>
                                <p style={{ fontFamily: "'Playfair Display',serif", fontSize: "18px", fontWeight: 700, color: "#fff", margin: "0 0 4px" }}>
                                    Ready to run another campaign?
                                </p>
                                <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.45)", margin: 0 }}>
                                    Gold Tier — your banner on every student's homepage.
                                </p>
                            </div>
                            <Link href="/my-account/seller-account/ads" style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: GOLD, color: NAVY, padding: "12px 24px", textDecoration: "none", fontSize: "12px", fontWeight: 800, letterSpacing: "0.06em", textTransform: "uppercase" }}>
                                <Zap size={14} /> New Campaign <ChevronRight size={13} />
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}