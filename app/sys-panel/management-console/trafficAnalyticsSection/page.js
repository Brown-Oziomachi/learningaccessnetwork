"use client";
// ─────────────────────────────────────────────────────────────
//  RecentActivityFeed.jsx
//  Drop-in addition to TrafficAnalyticsSection.
//  Usage: import RecentActivityFeed from "./RecentActivityFeed";
//  Then add <RecentActivityFeed /> inside TrafficAnalyticsSection's return.
// ─────────────────────────────────────────────────────────────

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Activity, BookOpen, Search, Star, Heart, Eye,
  MousePointer, Navigation, Smartphone, Monitor,
  Tablet, Globe, Clock, MapPin, ArrowUpRight,
  ChevronDown, Filter, RefreshCw, Wifi, WifiOff,
  Zap, BookMarked, MessageSquare, ShoppingCart,
  TrendingUp, AlertCircle, CheckCircle, Info,
  Download, Upload, User, Hash,
} from "lucide-react";

// ── Palettes & helpers ────────────────────────────────────────
const NAVY = "#0d2244";
const GOLD = "#b8963e";
const GOLDD = "#d4aa5a";
const CREAM = "#f5f0e8";
const BG = "#f5f1ea";

const ACTION_META = {
  page_visit: { label: "Page Visit", icon: Eye, color: "#3b82f6", bg: "rgba(59,130,246,0.10)" },
  book_added: { label: "Book Added", icon: BookMarked, color: "#10b981", bg: "rgba(16,185,129,0.10)" },
  search_query: { label: "Search", icon: Search, color: "#8b5cf6", bg: "rgba(139,92,246,0.10)" },
  rating_submit: { label: "Rating", icon: Star, color: "#f59e0b", bg: "rgba(245,158,11,0.10)" },
  wishlist_add: { label: "Wishlist", icon: Heart, color: "#ec4899", bg: "rgba(236,72,153,0.10)" },
  reading_session: { label: "Reading", icon: BookOpen, color: "#14b8a6", bg: "rgba(20,184,166,0.10)" },
  review_submit: { label: "Review", icon: MessageSquare, color: "#6366f1", bg: "rgba(99,102,241,0.10)" },
  purchase: { label: "Purchase", icon: ShoppingCart, color: "#b8963e", bg: "rgba(184,150,62,0.10)" },
  feature_use: { label: "Feature Used", icon: Zap, color: "#f97316", bg: "rgba(249,115,22,0.10)" },
  download: { label: "Download", icon: Download, color: "#22d3ee", bg: "rgba(34,211,238,0.10)" },
  nav_path: { label: "Navigation", icon: Navigation, color: "#a78bfa", bg: "rgba(167,139,250,0.10)" },
};

const DEVICE_META = {
  mobile: { icon: Smartphone, label: "Mobile" },
  desktop: { icon: Monitor, label: "Desktop" },
  tablet: { icon: Tablet, label: "Tablet" },
};

const PERF_FLAGS = {
  fast: { label: "Fast", color: "#10b981", bg: "rgba(16,185,129,0.10)" },
  normal: { label: "Normal", color: "#3b82f6", bg: "rgba(59,130,246,0.10)" },
  slow: { label: "Slow", color: "#f59e0b", bg: "rgba(245,158,11,0.10)" },
  error: { label: "Error", color: "#ef4444", bg: "rgba(239,68,68,0.10)" },
};

const BROWSERS = ["Chrome", "Safari", "Firefox", "Edge", "Opera"];
const REFERRERS = ["google.com", "twitter.com", "facebook.com", "instagram.com", "direct", "linkedin.com", "whatsapp"];
const LOCATIONS = [
  "Lagos, Nigeria", "Abuja, Nigeria", "Port Harcourt, Nigeria",
  "Accra, Ghana", "Nairobi, Kenya", "Johannesburg, SA",
  "London, UK", "New York, US",
];
const PAGES = [
  "/", "/books", "/books/preview", "/library", "/ai-chat",
  "/profile", "/search", "/payment", "/about", "/advertise",
];
const SEARCH_TERMS = [
  "MTH 101 past questions", "engineering textbook", "pharmacology notes",
  "WAEC prep", "computer science 200L", "law textbook Nigeria",
  "accounting principles", "biology practical",
];
const BOOK_TITLES = [
  "Fundamentals of Engineering Mathematics",
  "Introduction to Computer Science",
  "Nigerian Constitutional Law",
  "Organic Chemistry Essentials",
  "Business Administration Principles",
  "A Complete Web Development Guide",
];

function randomItem(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function randomInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function maskIp() {
  return `${randomInt(102, 220)}.${randomInt(10, 250)}.*.***`;
}
function randomSessionDuration() {
  const s = randomInt(30, 900);
  return s >= 60 ? `${Math.floor(s / 60)}m ${s % 60}s` : `${s}s`;
}

function generateActivity(id) {
  const actionKey = randomItem(Object.keys(ACTION_META));
  const deviceKey = randomItem(["mobile", "desktop", "tablet"]);
  const perfKey = randomItem(["fast", "fast", "normal", "normal", "normal", "slow", "error"]);
  const now = new Date(Date.now() - randomInt(0, 3600000));

  let detail = "";
  if (actionKey === "page_visit") detail = randomItem(PAGES);
  else if (actionKey === "search_query") detail = `"${randomItem(SEARCH_TERMS)}"`;
  else if (actionKey === "book_added" || actionKey === "reading_session" || actionKey === "purchase" || actionKey === "wishlist_add" || actionKey === "rating_submit" || actionKey === "review_submit") detail = randomItem(BOOK_TITLES);
  else if (actionKey === "feature_use") detail = randomItem(["AI Chat", "PDF Viewer", "Summary Tool", "Vocab Saver", "Quick Download"]);
  else if (actionKey === "nav_path") detail = `${randomItem(PAGES)} → ${randomItem(PAGES)}`;
  else if (actionKey === "download") detail = randomItem(BOOK_TITLES);

  return {
    id,
    actionKey,
    deviceKey,
    perfKey,
    detail,
    location: randomItem(LOCATIONS),
    browser: randomItem(BROWSERS),
    referrer: randomItem(REFERRERS),
    ip: maskIp(),
    userId: `U${randomInt(1000, 9999)}`,
    sessionDuration: randomSessionDuration(),
    timestamp: now,
    clicks: randomInt(1, 40),
    pageDepth: randomInt(1, 8),
    isNew: randomInt(0, 4) === 0,
  };
}

// Seed initial 40 records
let SEED_ID = 1000;
function seedActivities(n) {
  return Array.from({ length: n }, () => generateActivity(SEED_ID++));
}

// ── Time formatter ────────────────────────────────────────────
function timeAgo(date) {
  const diff = (Date.now() - date.getTime()) / 1000;
  if (diff < 60) return `${Math.floor(diff)}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}

// ── Stat card ─────────────────────────────────────────────────
function StatPill({ icon: Icon, label, value, color, bg }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 10,
      background: bg, border: `1px solid ${color}33`,
      borderRadius: 10, padding: "12px 16px", flex: "1 1 160px",
    }}>
      <div style={{ width: 36, height: 36, borderRadius: 8, background: `${color}20`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <Icon size={16} color={color} />
      </div>
      <div>
        <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#888", fontFamily: "'Lato', sans-serif" }}>{label}</div>
        <div style={{ fontSize: 20, fontWeight: 800, color: "#e2e8f0", fontFamily: "'Lato', sans-serif", lineHeight: 1.2 }}>{value}</div>
      </div>
    </div>
  );
}

// ── Action type distribution bar ──────────────────────────────
function ActionDistribution({ activities }) {
  const counts = {};
  activities.forEach(a => { counts[a.actionKey] = (counts[a.actionKey] || 0) + 1; });
  const total = activities.length || 1;
  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {sorted.map(([key, count]) => {
        const meta = ACTION_META[key];
        const pct = Math.round((count / total) * 100);
        return (
          <div key={key} style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 20, height: 20, borderRadius: 5, background: meta.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <meta.icon size={11} color={meta.color} />
            </div>
            <div style={{ fontSize: 11, color: "#94a3b8", fontFamily: "'Lato', sans-serif", width: 100, flexShrink: 0 }}>{meta.label}</div>
            <div style={{ flex: 1, height: 6, background: "rgba(255,255,255,0.06)", borderRadius: 3, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${pct}%`, background: meta.color, borderRadius: 3, transition: "width 0.5s ease" }} />
            </div>
            <div style={{ fontSize: 10, color: "#64748b", fontFamily: "'Lato', sans-serif", width: 32, textAlign: "right" }}>{pct}%</div>
          </div>
        );
      })}
    </div>
  );
}

// ── Single activity row ───────────────────────────────────────
function ActivityRow({ activity, isNew }) {
  const action = ACTION_META[activity.actionKey];
  const device = DEVICE_META[activity.deviceKey];
  const perf = PERF_FLAGS[activity.perfKey];
  const DevIcon = device.icon;
  const ActionIcon = action.icon;

  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "36px 140px 1fr 110px 110px 90px 80px 80px",
      gap: 0,
      padding: "12px 20px",
      borderBottom: "1px solid rgba(255,255,255,0.04)",
      alignItems: "center",
      background: isNew ? "rgba(184,150,62,0.04)" : "transparent",
      transition: "background 0.2s",
      animation: isNew ? "fadeIn 0.4s ease" : "none",
    }}
      onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.025)"}
      onMouseLeave={e => e.currentTarget.style.background = isNew ? "rgba(184,150,62,0.04)" : "transparent"}
    >
      {/* Action icon */}
      <div style={{ width: 28, height: 28, borderRadius: 7, background: action.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <ActionIcon size={13} color={action.color} />
      </div>

      {/* Action + detail */}
      <div style={{ minWidth: 0, paddingRight: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: action.color, fontFamily: "'Lato', sans-serif" }}>{action.label}</span>
          {activity.isNew && (
            <span style={{ fontSize: 8, fontWeight: 800, background: `${GOLD}22`, color: GOLD, border: `1px solid ${GOLD}44`, borderRadius: 3, padding: "1px 5px", letterSpacing: "0.06em", textTransform: "uppercase" }}>NEW</span>
          )}
        </div>
        <div style={{ fontSize: 10, color: "#64748b", marginTop: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontFamily: "'Lato', sans-serif" }}>
          {activity.detail || "—"}
        </div>
      </div>

      {/* User + location */}
      <div style={{ minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 2 }}>
          <div style={{ width: 18, height: 18, borderRadius: "50%", background: "rgba(184,150,62,0.15)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <User size={9} color={GOLD} />
          </div>
          <span style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", fontFamily: "'Lato', monospace" }}>{activity.userId}</span>
          <span style={{ fontSize: 9, color: "#3b82f6", fontFamily: "'Lato', monospace" }}>· {activity.ip}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <MapPin size={9} color="#64748b" />
          <span style={{ fontSize: 10, color: "#64748b", fontFamily: "'Lato', sans-serif", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{activity.location}</span>
        </div>
      </div>

      {/* Device + Browser */}
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 3 }}>
          <DevIcon size={11} color="#64748b" />
          <span style={{ fontSize: 10, color: "#94a3b8", fontFamily: "'Lato', sans-serif" }}>{device.label}</span>
        </div>
        <div style={{ fontSize: 10, color: "#64748b", fontFamily: "'Lato', sans-serif" }}>{activity.browser}</div>
      </div>

      {/* Referrer */}
      <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
        <Globe size={10} color="#64748b" />
        <span style={{ fontSize: 10, color: "#64748b", fontFamily: "'Lato', sans-serif", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{activity.referrer}</span>
      </div>

      {/* Session + clicks */}
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 2 }}>
          <Clock size={9} color="#64748b" />
          <span style={{ fontSize: 10, color: "#94a3b8", fontFamily: "'Lato', sans-serif" }}>{activity.sessionDuration}</span>
        </div>
        <div style={{ fontSize: 9, color: "#64748b", fontFamily: "'Lato', sans-serif" }}>{activity.clicks} clicks · p{activity.pageDepth}</div>
      </div>

      {/* Perf flag */}
      <div style={{ display: "flex", justifyContent: "center" }}>
        <span style={{ fontSize: 9, fontWeight: 800, background: perf.bg, color: perf.color, border: `1px solid ${perf.color}33`, borderRadius: 4, padding: "3px 7px", textTransform: "uppercase", letterSpacing: "0.07em", fontFamily: "'Lato', sans-serif" }}>
          {perf.label}
        </span>
      </div>

      {/* Time */}
      <div style={{ fontSize: 10, color: "#64748b", fontFamily: "'Lato', sans-serif", textAlign: "right" }}>
        {timeAgo(activity.timestamp)}
      </div>
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────
export default function RecentActivityFeed() {
  const [activities, setActivities] = useState(() => seedActivities(40));
  const [filterAction, setFilterAction] = useState("All");
  const [filterDevice, setFilterDevice] = useState("All");
  const [filterPerf, setFilterPerf] = useState("All");
  const [liveMode, setLiveMode] = useState(true);
  const [newCount, setNewCount] = useState(0);
  const [isExpanded, setIsExpanded] = useState(true);
  const newIdsRef = useRef(new Set());
  const timerRef = useRef(null);

  // Live mode: inject a new event every 3-7s
  useEffect(() => {
    if (!liveMode) { clearInterval(timerRef.current); return; }
    timerRef.current = setInterval(() => {
      const newActivity = generateActivity(SEED_ID++);
      newActivity.isNew = true;
      newIdsRef.current.add(newActivity.id);
      setActivities(prev => [newActivity, ...prev].slice(0, 200));
      setNewCount(n => n + 1);
      // clear "new" highlight after 8s
      setTimeout(() => {
        newIdsRef.current.delete(newActivity.id);
        setActivities(prev => prev.map(a => a.id === newActivity.id ? { ...a, isNew: false } : a));
      }, 8000);
    }, randomInt(3000, 7000));
    return () => clearInterval(timerRef.current);
  }, [liveMode]);

  const filtered = activities.filter(a => {
    if (filterAction !== "All" && a.actionKey !== filterAction) return false;
    if (filterDevice !== "All" && a.deviceKey !== filterDevice) return false;
    if (filterPerf !== "All" && a.perfKey !== filterPerf) return false;
    return true;
  }).slice(0, 60);

  const deviceCounts = { mobile: 0, desktop: 0, tablet: 0 };
  activities.slice(0, 100).forEach(a => { deviceCounts[a.deviceKey]++; });

  const totalToday = activities.length;
  const uniqueUsers = new Set(activities.map(a => a.userId)).size;
  const errCount = activities.filter(a => a.perfKey === "error").length;
  const avgClicks = Math.round(activities.slice(0, 50).reduce((s, a) => s + a.clicks, 0) / Math.min(50, activities.length));

  return (
    <div style={{ fontFamily: "'Lato', sans-serif", marginTop: 8 }}>
      <style>{`
        @keyframes fadeIn { from { opacity:0; transform:translateY(-4px); } to { opacity:1; transform:translateY(0); } }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        .live-dot { animation: pulse 1.5s ease-in-out infinite; }
        .act-row:hover { background: rgba(255,255,255,0.025) !important; }
      `}</style>

      {/* ── Section header ── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 10 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(184,150,62,0.12)", border: "1px solid rgba(184,150,62,0.25)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Activity size={16} color={GOLD} />
            </div>
            <span style={{ fontSize: 18, fontWeight: 800, color: "#e2e8f0" }}>Real-Time Activity Feed</span>
            {liveMode && (
              <div style={{ display: "flex", alignItems: "center", gap: 5, background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.25)", borderRadius: 20, padding: "3px 10px" }}>
                <div className="live-dot" style={{ width: 6, height: 6, borderRadius: "50%", background: "#10b981" }} />
                <span style={{ fontSize: 10, fontWeight: 800, color: "#10b981", letterSpacing: "0.08em", textTransform: "uppercase" }}>Live</span>
              </div>
            )}
          </div>
          <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>
            User interactions, system metrics & library activity — auto-refreshing
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {newCount > 0 && (
            <div style={{ fontSize: 11, fontWeight: 700, color: GOLD, background: "rgba(184,150,62,0.1)", border: "1px solid rgba(184,150,62,0.25)", borderRadius: 6, padding: "5px 10px" }}>
              +{newCount} new
            </div>
          )}
          <button onClick={() => { setLiveMode(v => !v); }}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", background: liveMode ? "rgba(16,185,129,0.12)" : "rgba(239,68,68,0.1)", border: `1px solid ${liveMode ? "rgba(16,185,129,0.3)" : "rgba(239,68,68,0.3)"}`, borderRadius: 8, color: liveMode ? "#10b981" : "#ef4444", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
            {liveMode ? <Wifi size={12} /> : <WifiOff size={12} />}
            {liveMode ? "Live On" : "Paused"}
          </button>
          <button onClick={() => setIsExpanded(v => !v)}
            style={{ display: "flex", alignItems: "center", gap: 5, padding: "7px 12px", background: "var(--surface, #1a2740)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 8, color: "#94a3b8", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
            <ChevronDown size={13} style={{ transform: isExpanded ? "rotate(0deg)" : "rotate(-90deg)", transition: "0.2s" }} />
            {isExpanded ? "Collapse" : "Expand"}
          </button>
        </div>
      </div>

      {isExpanded && (<>

        {/* ── Stats row ── */}
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 20 }}>
          <StatPill icon={Activity} label="Events Today" value={totalToday.toLocaleString()} color="#3b82f6" bg="rgba(59,130,246,0.08)" />
          <StatPill icon={User} label="Unique Users" value={uniqueUsers.toLocaleString()} color="#10b981" bg="rgba(16,185,129,0.08)" />
          <StatPill icon={MousePointer} label="Avg Clicks" value={avgClicks} color="#b8963e" bg="rgba(184,150,62,0.08)" />
          <StatPill icon={AlertCircle} label="Errors" value={errCount} color="#ef4444" bg="rgba(239,68,68,0.08)" />
          <StatPill icon={Smartphone} label="Mobile" value={deviceCounts.mobile} color="#8b5cf6" bg="rgba(139,92,246,0.08)" />
          <StatPill icon={Monitor} label="Desktop" value={deviceCounts.desktop} color="#06b6d4" bg="rgba(6,182,212,0.08)" />
        </div>

        {/* ── Two-panel: Distribution + Filters ── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>

          {/* Action distribution */}
          <div style={{ background: "var(--card-bg, #162033)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: "18px 20px" }}>
            <div style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", color: "#64748b", marginBottom: 14, display: "flex", alignItems: "center", gap: 6 }}>
              <TrendingUp size={12} color="#64748b" /> Action Breakdown
            </div>
            <ActionDistribution activities={activities.slice(0, 100)} />
          </div>

          {/* Quick filters */}
          <div style={{ background: "var(--card-bg, #162033)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: "18px 20px" }}>
            <div style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", color: "#64748b", marginBottom: 14, display: "flex", alignItems: "center", gap: 6 }}>
              <Filter size={12} color="#64748b" /> Filters
            </div>

            {/* Action filter */}
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 10, color: "#64748b", fontWeight: 700, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>Action Type</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                {["All", ...Object.keys(ACTION_META).slice(0, 6)].map(k => {
                  const meta = k === "All" ? null : ACTION_META[k];
                  const active = filterAction === k;
                  return (
                    <button key={k} onClick={() => setFilterAction(k)}
                      style={{
                        padding: "3px 9px", borderRadius: 5, fontSize: 10, fontWeight: 700, cursor: "pointer", border: "1px solid", fontFamily: "'Lato', sans-serif",
                        background: active ? (meta?.bg || "rgba(184,150,62,0.12)") : "rgba(255,255,255,0.04)",
                        borderColor: active ? (meta?.color || GOLD) + "55" : "rgba(255,255,255,0.07)",
                        color: active ? (meta?.color || GOLD) : "#64748b",
                      }}>
                      {meta ? meta.label : "All"}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Device filter */}
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 10, color: "#64748b", fontWeight: 700, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>Device</div>
              <div style={{ display: "flex", gap: 5 }}>
                {["All", "mobile", "desktop", "tablet"].map(k => {
                  const active = filterDevice === k;
                  return (
                    <button key={k} onClick={() => setFilterDevice(k)}
                      style={{
                        padding: "3px 10px", borderRadius: 5, fontSize: 10, fontWeight: 700, cursor: "pointer", border: "1px solid", fontFamily: "'Lato', sans-serif",
                        background: active ? "rgba(59,130,246,0.12)" : "rgba(255,255,255,0.04)",
                        borderColor: active ? "rgba(59,130,246,0.35)" : "rgba(255,255,255,0.07)",
                        color: active ? "#60a5fa" : "#64748b",
                      }}>
                      {k === "All" ? "All" : k.charAt(0).toUpperCase() + k.slice(1)}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Performance filter */}
            <div>
              <div style={{ fontSize: 10, color: "#64748b", fontWeight: 700, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>Performance</div>
              <div style={{ display: "flex", gap: 5 }}>
                {["All", "fast", "normal", "slow", "error"].map(k => {
                  const meta = k === "All" ? null : PERF_FLAGS[k];
                  const active = filterPerf === k;
                  return (
                    <button key={k} onClick={() => setFilterPerf(k)}
                      style={{
                        padding: "3px 9px", borderRadius: 5, fontSize: 10, fontWeight: 700, cursor: "pointer", border: "1px solid", fontFamily: "'Lato', sans-serif",
                        background: active ? (meta?.bg || "rgba(184,150,62,0.12)") : "rgba(255,255,255,0.04)",
                        borderColor: active ? (meta?.color || GOLD) + "55" : "rgba(255,255,255,0.07)",
                        color: active ? (meta?.color || GOLD) : "#64748b",
                      }}>
                      {k === "All" ? "All" : k.charAt(0).toUpperCase() + k.slice(1)}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* ── Activity table ── */}
        <div style={{ background: "var(--card-bg, #162033)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, overflow: "hidden" }}>

          {/* Table head */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "36px 140px 1fr 110px 110px 90px 80px 80px",
            gap: 0,
            padding: "10px 20px",
            borderBottom: "1px solid rgba(255,255,255,0.07)",
            background: "rgba(255,255,255,0.02)",
          }}>
            {["", "Event", "User / IP / Location", "Device", "Referrer", "Session", "Perf", "Time"].map(h => (
              <div key={h} style={{ fontSize: 9, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.09em", color: "#64748b", fontFamily: "'Lato', sans-serif" }}>{h}</div>
            ))}
          </div>

          {/* Scrollable body */}
          <div style={{ maxHeight: 520, overflowY: "auto", scrollbarWidth: "thin", scrollbarColor: "rgba(184,150,62,0.3) transparent" }}>
            {filtered.length === 0 ? (
              <div style={{ textAlign: "center", padding: "48px 24px", color: "#64748b", fontSize: 13 }}>
                No activity matching current filters.
              </div>
            ) : (
              filtered.map(activity => (
                <ActivityRow key={activity.id} activity={activity} isNew={newIdsRef.current.has(activity.id)} />
              ))
            )}
          </div>

          {/* Footer */}
          <div style={{ padding: "10px 20px", borderTop: "1px solid rgba(255,255,255,0.05)", background: "rgba(255,255,255,0.01)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: 10, color: "#64748b", fontFamily: "'Lato', sans-serif" }}>
              Showing {filtered.length} of {activities.length} events · Retaining last 200
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div className="live-dot" style={{ width: 6, height: 6, borderRadius: "50%", background: liveMode ? "#10b981" : "#ef4444" }} />
              <span style={{ fontSize: 10, color: "#64748b", fontFamily: "'Lato', sans-serif" }}>{liveMode ? "Auto-updating" : "Feed paused"}</span>
            </div>
          </div>
        </div>

      </>)}
    </div>
  );
}