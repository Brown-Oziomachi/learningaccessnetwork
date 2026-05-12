"use client";
// ─────────────────────────────────────────────────────────────
//  TrafficAnalyticsSection.jsx
//  Drop into your admin panel exactly like other sections.
//
//  In your NAV_SECTIONS array add:
//    { id: 'traffic', icon: BarChart3, label: 'Page Traffic' }
//
//  In your page-content area add:
//    {activeSection === 'traffic' && <TrafficAnalyticsSection />}
// ─────────────────────────────────────────────────────────────

import { useState, useEffect, useCallback } from "react";
import {
  collection,
  query,
  orderBy,
  limit,
  getDocs,
  doc,
  getDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebaseConfig"; // adjust if needed
import {
  BarChart3,
  TrendingUp,
  Eye,
  Users,
  Zap,
  RefreshCw,
  Star,
  Award,
  Activity,
  ExternalLink,
  ArrowUp,
  ArrowDown,
  Minus,
  Globe,
} from "lucide-react";

// ── Ad recommendation engine ─────────────────────────────────
function getAdRecommendation(totalViews, rank) {
  if (totalViews >= 5000)
    return {
      tier: "Platinum",
      label: "🏆 Platinum Ad Zone",
      desc: `${totalViews.toLocaleString()} views — premium placement, ₦25,000/week`,
      color: "#e2c97e",
      bg: "rgba(226,201,126,0.08)",
      border: "rgba(226,201,126,0.3)",
    };
  if (totalViews >= 2000)
    return {
      tier: "Gold",
      label: "⭐ Gold Ad Suggested",
      desc: `${totalViews.toLocaleString()} views — high traffic, ₦15,000/week`,
      color: "#fbbf24",
      bg: "rgba(251,191,36,0.08)",
      border: "rgba(251,191,36,0.3)",
    };
  if (totalViews >= 500)
    return {
      tier: "Silver",
      label: "💿 Silver Ad Suggested",
      desc: `${totalViews.toLocaleString()} views — solid traffic, ₦5,000/week`,
      color: "#94a3b8",
      bg: "rgba(148,163,184,0.08)",
      border: "rgba(148,163,184,0.25)",
    };
  if (totalViews >= 100)
    return {
      tier: "Bronze",
      label: "🥉 Bronze Ad Suggested",
      desc: `${totalViews.toLocaleString()} views — growing, ₦2,000/week`,
      color: "#b87c4c",
      bg: "rgba(184,124,76,0.08)",
      border: "rgba(184,124,76,0.25)",
    };
  return {
    tier: "Emerging",
    label: "📈 Emerging Page",
    desc: `${totalViews.toLocaleString()} views — monitor for growth`,
    color: "#64748b",
    bg: "rgba(100,116,139,0.06)",
    border: "rgba(100,116,139,0.15)",
  };
}

/** Format a path doc-ID back to a readable label */
function docIdToLabel(docId) {
  return docId
    .replace(/_/g, " / ")
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    || "Home";
}

function formatPath(docId) {
  const raw = docId.replace(/_/g, "/");
  return "/" + raw;
}

// ── Bar component ─────────────────────────────────────────────
function MiniBar({ value, max, color }) {
  const pct = max > 0 ? Math.max(4, (value / max) * 100) : 4;
  return (
    <div
      style={{
        height: 6,
        background: "var(--surface2, #1f2f47)",
        borderRadius: 3,
        overflow: "hidden",
        flex: 1,
      }}
    >
      <div
        style={{
          height: "100%",
          width: `${pct}%`,
          background: color,
          borderRadius: 3,
          transition: "width 0.6s ease",
        }}
      />
    </div>
  );
}

// ── Sparkline (last 7 "synthetic" days — real daily breakdown
//    would need a separate sub-collection; here we render a
//    decorative bar for now) ────────────────────────────────
function Sparkline({ views }) {
  // generate plausible daily distribution from total
  const seed = views;
  const bars = Array.from({ length: 7 }, (_, i) => {
    const pseudo = Math.abs(Math.sin(seed * (i + 1) * 0.37)) * 0.9 + 0.1;
    return pseudo;
  });
  const max = Math.max(...bars);
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 2, height: 28 }}>
      {bars.map((h, i) => (
        <div
          key={i}
          style={{
            flex: 1,
            height: `${(h / max) * 100}%`,
            background:
              i === 6
                ? "var(--accent, #3b82f6)"
                : "rgba(59,130,246,0.25)",
            borderRadius: "1px 1px 0 0",
            minHeight: 3,
          }}
        />
      ))}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────
export default function TrafficAnalyticsSection() {
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalSiteViews, setTotalSiteViews] = useState(0);
  const [totalUniqueVisitors, setTotalUniqueVisitors] = useState(0);
  const [filterTier, setFilterTier] = useState("All");
  const [sortBy, setSortBy] = useState("totalViews"); // totalViews | uniqueVisitors

  const fetchTrafficData = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch top 50 pages; we'll show top 10 in main table
      const q = query(
        collection(db, "page_stats"),
        orderBy(sortBy, "desc"),
        limit(50)
      );
      const snap = await getDocs(q);
      const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setPages(docs);
      setTotalSiteViews(docs.reduce((s, p) => s + (p.totalViews || 0), 0));
      setTotalUniqueVisitors(docs.reduce((s, p) => s + (p.uniqueVisitors || 0), 0));
    } catch (err) {
      console.error("Traffic fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [sortBy]);

  useEffect(() => {
    fetchTrafficData();
  }, [fetchTrafficData]);

  const tiers = ["All", "Platinum", "Gold", "Silver", "Bronze", "Emerging"];

  const filtered = pages
    .filter((p) => {
      if (filterTier === "All") return true;
      return (
        getAdRecommendation(p.totalViews || 0, 0).tier === filterTier
      );
    })
    .slice(0, 20);

  const maxViews = filtered[0]?.totalViews || 1;

  const tierCounts = {};
  pages.forEach((p) => {
    const t = getAdRecommendation(p.totalViews || 0, 0).tier;
    tierCounts[t] = (tierCounts[t] || 0) + 1;
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* ── Header ── */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div>
          <div
            style={{
              fontSize: 22,
              fontWeight: 800,
              color: "var(--text-primary, #e2e8f0)",
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <BarChart3 size={22} color="var(--accent, #3b82f6)" />
            Page Traffic Analytics
          </div>
          <div
            style={{
              fontSize: 13,
              color: "var(--text-muted, #64748b)",
              marginTop: 4,
            }}
          >
            Top pages by views · Ad slot recommendations included
          </div>
        </div>
        <button
          onClick={fetchTrafficData}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "8px 14px",
            background: "var(--surface, #1a2740)",
            border: "1px solid var(--card-border, rgba(255,255,255,0.07))",
            borderRadius: 8,
            color: "var(--text-secondary, #94a3b8)",
            fontSize: 12,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          <RefreshCw size={13} />
          Refresh
        </button>
      </div>

      {/* ── Summary stats ── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 14,
        }}
      >
        {[
          {
            label: "Total Site Views",
            value: totalSiteViews.toLocaleString(),
            icon: Eye,
            color: "#3b82f6",
            bg: "rgba(59,130,246,0.12)",
          },
          {
            label: "Unique Visitors",
            value: totalUniqueVisitors.toLocaleString(),
            icon: Users,
            color: "#10b981",
            bg: "rgba(16,185,129,0.12)",
          },
          {
            label: "Pages Tracked",
            value: pages.length.toString(),
            icon: Globe,
            color: "#8b5cf6",
            bg: "rgba(139,92,246,0.12)",
          },
          {
            label: "Ad Opportunities",
            value: (
              (tierCounts["Platinum"] || 0) +
              (tierCounts["Gold"] || 0) +
              (tierCounts["Silver"] || 0)
            ).toString(),
            icon: Zap,
            color: "#fbbf24",
            bg: "rgba(251,191,36,0.12)",
          },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div
            key={label}
            style={{
              background: "var(--card-bg, #162033)",
              border: "1px solid var(--card-border, rgba(255,255,255,0.07))",
              borderRadius: 12,
              padding: "18px 20px",
              display: "flex",
              alignItems: "center",
              gap: 14,
            }}
          >
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 10,
                background: bg,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <Icon size={20} color={color} />
            </div>
            <div>
              <div
                style={{
                  fontSize: 10,
                  color: "var(--text-muted, #64748b)",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                }}
              >
                {label}
              </div>
              <div
                style={{
                  fontSize: 22,
                  fontWeight: 700,
                  color: "var(--text-primary, #e2e8f0)",
                  lineHeight: 1.2,
                  marginTop: 2,
                }}
              >
                {loading ? "—" : value}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Tier filter + sort ── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          flexWrap: "wrap",
        }}
      >
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: "var(--text-muted, #64748b)",
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            marginRight: 4,
          }}
        >
          Filter:
        </div>
        {tiers.map((tier) => (
          <button
            key={tier}
            onClick={() => setFilterTier(tier)}
            style={{
              padding: "5px 12px",
              borderRadius: 6,
              fontSize: 11,
              fontWeight: 700,
              cursor: "pointer",
              border: "1px solid",
              background:
                filterTier === tier
                  ? "var(--accent, #3b82f6)"
                  : "var(--surface, #1a2740)",
              borderColor:
                filterTier === tier
                  ? "var(--accent, #3b82f6)"
                  : "var(--card-border, rgba(255,255,255,0.07))",
              color: filterTier === tier ? "#fff" : "var(--text-secondary, #94a3b8)",
              transition: "0.15s",
            }}
          >
            {tier}
            {tier !== "All" && tierCounts[tier]
              ? ` (${tierCounts[tier]})`
              : ""}
          </button>
        ))}

        <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
          <span
            style={{
              fontSize: 11,
              color: "var(--text-muted, #64748b)",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              display: "flex",
              alignItems: "center",
            }}
          >
            Sort:
          </span>
          {[
            { key: "totalViews", label: "Views" },
            { key: "uniqueVisitors", label: "Uniques" },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setSortBy(key)}
              style={{
                padding: "5px 12px",
                borderRadius: 6,
                fontSize: 11,
                fontWeight: 700,
                cursor: "pointer",
                border: "1px solid",
                background:
                  sortBy === key
                    ? "rgba(59,130,246,0.15)"
                    : "var(--surface, #1a2740)",
                borderColor:
                  sortBy === key
                    ? "rgba(59,130,246,0.4)"
                    : "var(--card-border, rgba(255,255,255,0.07))",
                color:
                  sortBy === key
                    ? "var(--accent-light, #60a5fa)"
                    : "var(--text-secondary, #94a3b8)",
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Traffic table ── */}
      <div
        style={{
          background: "var(--card-bg, #162033)",
          border: "1px solid var(--card-border, rgba(255,255,255,0.07))",
          borderRadius: 12,
          overflow: "hidden",
        }}
      >
        {loading ? (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              padding: 64,
              flexDirection: "column",
              gap: 12,
            }}
          >
            <div
              style={{
                width: 36,
                height: 36,
                border: "2px solid rgba(59,130,246,0.3)",
                borderTopColor: "#3b82f6",
                borderRadius: "50%",
                animation: "spin 0.8s linear infinite",
              }}
            />
            <div
              style={{
                fontSize: 12,
                color: "var(--text-muted, #64748b)",
              }}
            >
              Fetching traffic data…
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: 64,
              color: "var(--text-muted, #64748b)",
            }}
          >
            <Activity
              size={32}
              style={{ margin: "0 auto 12px", display: "block" }}
            />
            No traffic data yet. Make sure{" "}
            <code
              style={{
                background: "var(--surface, #1a2740)",
                padding: "2px 6px",
                borderRadius: 4,
                fontSize: 11,
              }}
            >
              {"<PageTracker />"}
            </code>{" "}
            is mounted in your layout.
          </div>
        ) : (
          <>
            {/* Table head */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "36px 1fr 90px 90px 200px 180px",
                gap: 0,
                padding: "10px 20px",
                borderBottom:
                  "1px solid var(--card-border, rgba(255,255,255,0.07))",
                background: "var(--surface, #1a2740)",
              }}
            >
              {["#", "Page", "Views", "Uniques", "Traffic", "Ad Recommendation"].map(
                (h) => (
                  <div
                    key={h}
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: "0.07em",
                      color: "var(--text-muted, #64748b)",
                    }}
                  >
                    {h}
                  </div>
                )
              )}
            </div>

            {/* Rows */}
            {filtered.map((page, idx) => {
              const views = page.totalViews || 0;
              const uniques = page.uniqueVisitors || 0;
              const rec = getAdRecommendation(views, idx);
              const isTop3 = idx < 3;

              return (
                <div
                  key={page.id}
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "36px 1fr 90px 90px 200px 180px",
                    gap: 0,
                    padding: "14px 20px",
                    borderBottom:
                      "1px solid rgba(255,255,255,0.04)",
                    alignItems: "center",
                    background: isTop3
                      ? "rgba(59,130,246,0.02)"
                      : "transparent",
                    transition: "background 0.15s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background =
                      "rgba(255,255,255,0.02)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = isTop3
                      ? "rgba(59,130,246,0.02)"
                      : "transparent";
                  }}
                >
                  {/* Rank */}
                  <div
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: 6,
                      background:
                        idx === 0
                          ? "rgba(226,201,126,0.15)"
                          : idx === 1
                          ? "rgba(148,163,184,0.1)"
                          : idx === 2
                          ? "rgba(184,124,76,0.1)"
                          : "var(--surface, #1a2740)",
                      border: `1px solid ${
                        idx === 0
                          ? "rgba(226,201,126,0.3)"
                          : idx === 1
                          ? "rgba(148,163,184,0.2)"
                          : idx === 2
                          ? "rgba(184,124,76,0.2)"
                          : "var(--card-border, rgba(255,255,255,0.07))"
                      }`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 11,
                      fontWeight: 800,
                      color:
                        idx === 0
                          ? "#e2c97e"
                          : idx === 1
                          ? "#94a3b8"
                          : idx === 2
                          ? "#b87c4c"
                          : "var(--text-muted, #64748b)",
                    }}
                  >
                    {idx + 1}
                  </div>

                  {/* Page info */}
                  <div style={{ minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: "var(--text-primary, #e2e8f0)",
                        marginBottom: 2,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {docIdToLabel(page.id)}
                    </div>
                    <div
                      style={{
                        fontSize: 10,
                        color: "var(--text-muted, #64748b)",
                        fontFamily: "monospace",
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                      }}
                    >
                      {formatPath(page.id)}
                      <a
                        href={formatPath(page.id)}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: "inherit", opacity: 0.5 }}
                      >
                        <ExternalLink size={9} />
                      </a>
                    </div>
                  </div>

                  {/* Views */}
                  <div>
                    <div
                      style={{
                        fontSize: 14,
                        fontWeight: 700,
                        color: "var(--text-primary, #e2e8f0)",
                      }}
                    >
                      {views.toLocaleString()}
                    </div>
                    <Sparkline views={views} />
                  </div>

                  {/* Uniques */}
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: "#10b981",
                    }}
                  >
                    {uniques.toLocaleString()}
                  </div>

                  {/* Bar */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <MiniBar
                      value={views}
                      max={maxViews}
                      color={rec.color}
                    />
                    <span
                      style={{
                        fontSize: 10,
                        color: "var(--text-muted, #64748b)",
                        whiteSpace: "nowrap",
                        minWidth: 32,
                        textAlign: "right",
                      }}
                    >
                      {maxViews > 0
                        ? Math.round((views / maxViews) * 100)
                        : 0}
                      %
                    </span>
                  </div>

                  {/* Recommendation pill */}
                  <div
                    style={{
                      background: rec.bg,
                      border: `1px solid ${rec.border}`,
                      borderRadius: 6,
                      padding: "5px 10px",
                    }}
                  >
                    <div
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        color: rec.color,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {rec.label}
                    </div>
                    <div
                      style={{
                        fontSize: 9,
                        color: rec.color,
                        opacity: 0.75,
                        marginTop: 1,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {rec.desc}
                    </div>
                  </div>
                </div>
              );
            })}
          </>
        )}
      </div>

      {/* ── Ad pitch helper ── */}
      <div
        style={{
          background: "var(--card-bg, #162033)",
          border: "1px solid var(--card-border, rgba(255,255,255,0.07))",
          borderRadius: 12,
          padding: "20px 24px",
        }}
      >
        <div
          style={{
            fontSize: 13,
            fontWeight: 700,
            color: "var(--text-primary, #e2e8f0)",
            marginBottom: 16,
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <Zap size={15} color="#fbbf24" />
          Ad Pitch Templates
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gap: 12,
          }}
        >
          {[
            {
              tier: "🏆 Platinum",
              price: "₦25,000/week",
              threshold: "5,000+ views",
              pitch:
                '"Our top pages see 5,000+ views weekly. Platinum placement puts your material front and centre."',
              color: "#e2c97e",
            },
            {
              tier: "⭐ Gold",
              price: "₦15,000/week",
              threshold: "2,000–4,999 views",
              pitch:
                '"This category page gets 2,000+ views. A Gold Ad guarantees your book is the first thing students see."',
              color: "#fbbf24",
            },
            {
              tier: "💿 Silver",
              price: "₦5,000/week",
              threshold: "500–1,999 views",
              pitch:
                '"Solid traffic, growing audience. A Silver Ad is a cost-effective way to reach your target students."',
              color: "#94a3b8",
            },
            {
              tier: "🥉 Bronze",
              price: "₦2,000/week",
              threshold: "100–499 views",
              pitch:
                '"Early-mover advantage — lock in a Bronze spot now before this page scales up."',
              color: "#b87c4c",
            },
          ].map(({ tier, price, threshold, pitch, color }) => (
            <div
              key={tier}
              style={{
                background: "var(--surface, #1a2740)",
                borderRadius: 8,
                padding: "12px 14px",
                border: `1px solid ${color}22`,
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 6,
                }}
              >
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color,
                  }}
                >
                  {tier}
                </span>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: "var(--text-muted, #64748b)",
                  }}
                >
                  {price}
                </span>
              </div>
              <div
                style={{
                  fontSize: 10,
                  color: "var(--text-muted, #64748b)",
                  marginBottom: 6,
                }}
              >
                {threshold}
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: "var(--text-secondary, #94a3b8)",
                  lineHeight: 1.6,
                  fontStyle: "italic",
                }}
              >
                {pitch}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}