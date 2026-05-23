"use client";
/**
 * HomeBountyStrip.jsx
 *
 * A compact horizontal strip shown on the home page that surfaces the latest
 * open bounties. Each card is clickable and routes to /bounty-board?highlight=<id>
 *
 * Usage (in your home page JSX):
 *   import HomeBountyStrip from "@/components/HomeBountyStrip";
 *   <HomeBountyStrip />
 */

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { subscribeToLatestOpenBounties } from "@/lib/bountyService";

const NAVY = "#0d2244";
const GOLD = "#b8963e";
const GOLDD = "#d4aa5a";
const CREAM = "#f5f0e8";

const ArrowIcon = () => (
  <svg
    width="10"
    height="10"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
  >
    <line x1="7" y1="17" x2="17" y2="7" />
    <polyline points="7 7 17 7 17 17" />
  </svg>
);
const BoltIcon = () => (
  <svg
    width="13"
    height="13"
    viewBox="0 0 24 24"
    fill={GOLD}
    stroke={GOLD}
    strokeWidth="1"
  >
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
  </svg>
);

export default function HomeBountyStrip() {
  const [bounties, setBounties] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = subscribeToLatestOpenBounties((list) => {
      setBounties(list);
      setLoading(false);
    }, 6);
    return () => unsub();
  }, []);

  if (loading || bounties.length === 0) return null;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=Lato:wght@400;700;900&display=swap');
        .hbs-card { transition: border-color .2s, transform .2s, box-shadow .2s; }
        .hbs-card:hover { border-color: ${GOLD} !important; transform: translateY(-4px); box-shadow: 0 12px 32px rgba(13,34,68,.12); }
        .hbs-see-all { transition: color .15s; }
        .hbs-see-all:hover { color: ${GOLDD} !important; }
      `}</style>

      <section
        style={{
          padding: "48px 24px",
          background: CREAM,
          fontFamily: "'Lato',sans-serif",
        }}
      >
        <div style={{ maxWidth: 1280, margin: "0 auto" }}>
          {/* Section header */}
          <div
            style={{
              display: "flex",
              alignItems: "flex-end",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 12,
              marginBottom: 24,
            }}
          >
            <div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 8,
                }}
              >
                <BoltIcon />
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: ".2em",
                    textTransform: "uppercase",
                    color: GOLD,
                    fontFamily: "'Lato',sans-serif",
                  }}
                >
                  Live Requests · Bounty Board
                </span>
              </div>
              <h2
                style={{
                  fontFamily: "'Playfair Display',serif",
                  fontSize: "clamp(22px,3vw,32px)",
                  fontWeight: 700,
                  color: NAVY,
                  margin: 0,
                  lineHeight: 1.15,
                }}
              >
                Students Need These Materials
              </h2>
              <p
                style={{
                  fontSize: 13,
                  color: "#888",
                  marginTop: 6,
                  fontWeight: 400,
                }}
              >
                Fulfil a request and earn — funds are held in escrow until
                delivery
              </p>
            </div>
            <Link
              href="/bounty-board"
              className="hbs-see-all"
              style={{
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: ".1em",
                textTransform: "uppercase",
                color: GOLD,
                textDecoration: "none",
                display: "flex",
                alignItems: "center",
                gap: 6,
                fontFamily: "'Lato',sans-serif",
              }}
            >
              View All Bounties <ArrowIcon />
            </Link>
          </div>

          {/* Cards grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
              gap: 16,
            }}
          >
            {bounties.map((b) => (
              <Link
                key={b.id}
                href={`/academic/bounty/board?highlight=${b.id}`}
                style={{ textDecoration: "none" }}
              >
                <div
                  className="hbs-card"
                  style={{
                    background: "#fff",
                    border: ".5px solid #e5ddd0",
                    padding: "20px",
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    gap: 14,
                    cursor: "pointer",
                  }}
                >
                  {/* Top row: university badge + reward */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                    }}
                  >
                    <div style={{ background: NAVY, padding: "3px 10px" }}>
                      <span
                        style={{
                          fontSize: 9,
                          fontWeight: 700,
                          letterSpacing: ".12em",
                          textTransform: "uppercase",
                          color: GOLD,
                          fontFamily: "'Lato',sans-serif",
                        }}
                      >
                        {b.university}
                      </span>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div
                        style={{
                          fontSize: 8,
                          fontWeight: 700,
                          letterSpacing: ".12em",
                          textTransform: "uppercase",
                          color: "#bbb",
                          fontFamily: "'Lato',sans-serif",
                        }}
                      >
                        Reward
                      </div>
                      <div
                        style={{
                          fontFamily: "'Playfair Display',serif",
                          fontSize: 20,
                          fontWeight: 700,
                          color: NAVY,
                          lineHeight: 1.1,
                        }}
                      >
                        {b.rewardFmt}
                      </div>
                    </div>
                  </div>

                  {/* Title */}
                  <h3
                    style={{
                      fontFamily: "'Playfair Display',serif",
                      fontSize: 14,
                      fontWeight: 700,
                      color: NAVY,
                      lineHeight: 1.4,
                      margin: 0,
                      flex: 1,
                      display: "-webkit-box",
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                    }}
                  >
                    {b.title}
                  </h3>

                  {/* Footer */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <span
                      style={{
                        fontSize: 10,
                        color: "#888",
                        fontFamily: "'Lato',sans-serif",
                      }}
                    >
                      {b.department}
                    </span>
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 4,
                        fontSize: 9,
                        fontWeight: 700,
                        color: "#dc2626",
                        background: "rgba(220,38,38,.07)",
                        border: ".5px solid rgba(220,38,38,.2)",
                        padding: "3px 9px",
                        letterSpacing: ".06em",
                        fontFamily: "'Lato',sans-serif",
                      }}
                    >
                      <span
                        style={{
                          width: 5,
                          height: 5,
                          borderRadius: "50%",
                          background: "#dc2626",
                        }}
                      />
                      {b.deadlineLabel || "Open"}
                    </span>
                  </div>

                  {/* CTA row */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "flex-end",
                      gap: 4,
                      color: GOLD,
                      fontSize: 10,
                      fontWeight: 700,
                      letterSpacing: ".08em",
                      textTransform: "uppercase",
                      fontFamily: "'Lato',sans-serif",
                    }}
                  >
                    Fulfil this request <ArrowIcon />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
