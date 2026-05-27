"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import Link from "next/link";
import { subscribeToLatestOpenBounties } from "@/lib/bountyService";

const NAVY = "#0d2244";
const GOLD = "#b8963e";
const GOLDD = "#d4aa5a";
const CREAM = "#f5f0e8";
const AUTO_CLOSE_MS = 5 * 60 * 1000; // 5 minutes

/* tiny icons */
const XIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
  >
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);
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
    width="11"
    height="11"
    viewBox="0 0 24 24"
    fill={GOLD}
    stroke={GOLD}
    strokeWidth="1"
  >
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
  </svg>
);

/* progress bar that drains over AUTO_CLOSE_MS */
function TimerBar({ durationMs }) {
  const [pct, setPct] = useState(100);
  const start = useRef(Date.now());
  useEffect(() => {
    const id = setInterval(() => {
      const elapsed = Date.now() - start.current;
      setPct(Math.max(0, 100 - (elapsed / durationMs) * 100));
    }, 500);
    return () => clearInterval(id);
  }, [durationMs]);
  return (
    <div
      style={{ height: 2, background: "rgba(184,150,62,.2)", width: "100%" }}
    >
      <div
        style={{
          height: "100%",
          width: `${pct}%`,
          background: GOLD,
          transition: "width .5s linear",
        }}
      />
    </div>
  );
}

export default function BountyPopup() {
  const [bounties, setBounties] = useState([]);
  const [visible, setVisible] = useState(false);
  const [shown, setShown] = useState(false); // only pop up once per session
  const timerRef = useRef(null);

  /* subscribe to live open bounties */
  useEffect(() => {
const unsub = subscribeToLatestOpenBounties((list) => {
  const available = list.filter(
    (b) =>
      b.status !== "fulfilled" &&
      b.status !== "disputed" &&
      (b.proposals || 0) < (b.maxProposals || 10),
  );
  setBounties(available);
  if (available.length > 0 && !shown) {
    setVisible(true);
    setShown(true);
  }
}, 999); 
    return () => unsub();
  }, [shown]);

  /* auto-close */
  useEffect(() => {
    if (visible) {
      timerRef.current = setTimeout(() => setVisible(false), AUTO_CLOSE_MS);
    }
    return () => clearTimeout(timerRef.current);
  }, [visible]);

  const close = useCallback(() => setVisible(false), []);

  if (!visible || bounties.length === 0) return null;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=Lato:wght@400;700;900&display=swap');
        @keyframes slideInRight {
          from { transform: translateX(110%); opacity: 0; }
          to   { transform: translateX(0);   opacity: 1; }
        }
        @keyframes slideOutRight {
          from { transform: translateX(0);   opacity: 1; }
          to   { transform: translateX(110%); opacity: 0; }
        }
        .bounty-popup-card { transition: background .15s, border-color .15s; }
        .bounty-popup-card:hover { background: rgba(184,150,62,.06) !important; border-color: ${GOLD} !important; }
      `}</style>

      <div
        role="dialog"
        aria-label="New bounty requests"
        style={{
          position: "fixed",
          bottom: 24,
          right: 20,
          width: "min(340px, calc(100vw - 32px))",
          zIndex: 8888,
          animation: "slideInRight .4s cubic-bezier(0.22,1,0.36,1) both",
          fontFamily: "'Lato', sans-serif",
        }}
      >
        {/* Timer bar at very top */}
        <TimerBar durationMs={AUTO_CLOSE_MS} />

        {/* Panel */}
        <div
          style={{
            background: "#fff",
            border: `.5px solid #e5ddd0`,
            boxShadow: "0 24px 64px rgba(13,34,68,.18)",
          }}
        >
          {/* Header */}
          <div
            style={{
              background: NAVY,
              padding: "14px 16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <BoltIcon />
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 900,
                  letterSpacing: ".16em",
                  textTransform: "uppercase",
                  color: CREAM,
                  fontFamily: "'Lato',sans-serif",
                }}
              >
                Live Bounties
              </span>
              <span
                style={{
                  background: GOLD,
                  color: NAVY,
                  fontSize: 9,
                  fontWeight: 900,
                  padding: "2px 7px",
                  borderRadius: 99,
                  fontFamily: "'Lato',sans-serif",
                }}
              >
                {bounties.length} open
              </span>
            </div>
            <button
              onClick={close}
              aria-label="Close bounty panel"
              style={{
                background: "rgba(255,255,255,.08)",
                border: ".5px solid rgba(255,255,255,.14)",
                color: "rgba(245,240,232,.6)",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 26,
                height: 26,
                borderRadius: 4,
                transition: "background .15s",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "rgba(255,255,255,.15)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "rgba(255,255,255,.08)")
              }
            >
              <XIcon />
            </button>
          </div>

          {/* Sub-header */}
          <div
            style={{
              padding: "10px 16px 8px",
              borderBottom: ".5px solid #f0ebe0",
              background: CREAM,
            }}
          >
            <p
              style={{
                fontSize: 11,
                color: "#888",
                fontFamily: "'Lato',sans-serif",
                margin: 0,
              }}
            >
              Students are requesting materials — earn by fulfilling them
            </p>
          </div>

          {/* Bounty cards */}
          <div style={{ maxHeight: 420, overflowY: "auto" }}>
            {bounties.map((b, i) => (
              <Link
                key={b.id}
                href={`/academic/bounty/board?highlight=${b.id}`}
                style={{ textDecoration: "none", display: "block" }}
                onClick={close}
              >
                <div
                  className="bounty-popup-card"
                  style={{
                    padding: "12px 16px",
                    borderBottom:
                      i < bounties.length - 1 ? ".5px solid #f5f0e8" : "none",
                    cursor: "pointer",
                    background: "#fff",
                    border: ".5px solid transparent",
                    display: "flex",
                    gap: 12,
                    alignItems: "flex-start",
                  }}
                >
                  {/* Reward pill */}
                  <div
                    style={{
                      flexShrink: 0,
                      background: NAVY,
                      padding: "6px 10px",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      minWidth: 52,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 8,
                        fontWeight: 700,
                        color: GOLD,
                        letterSpacing: ".1em",
                        textTransform: "uppercase",
                        fontFamily: "'Lato',sans-serif",
                      }}
                    >
                      earn
                    </span>
                    <span
                      style={{
                        fontFamily: "'Playfair Display',serif",
                        fontSize: 13,
                        fontWeight: 700,
                        color: "#fff",
                        lineHeight: 1.2,
                      }}
                    >
                      {b.rewardFmt}
                    </span>
                  </div>

                  {/* Title + meta */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p
                      style={{
                        fontSize: 12,
                        fontWeight: 700,
                        color: NAVY,
                        fontFamily: "'Lato',sans-serif",
                        margin: "0 0 5px",
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                        lineHeight: 1.4,
                      }}
                    >
                      {b.title}
                    </p>
                    <div
                      style={{
                        display: "flex",
                        gap: 6,
                        alignItems: "center",
                        flexWrap: "wrap",
                      }}
                    >
                      <span
                        style={{
                          background: NAVY,
                          color: GOLD,
                          fontSize: 8,
                          fontWeight: 700,
                          letterSpacing: ".1em",
                          textTransform: "uppercase",
                          padding: "2px 7px",
                          fontFamily: "'Lato',sans-serif",
                        }}
                      >
                        {b.university}
                      </span>
                      <span
                        style={{
                          fontSize: 10,
                          color: "#aaa",
                          fontFamily: "'Lato',sans-serif",
                        }}
                      >
                        {b.deadlineLabel || b.deadline || ""}
                      </span>
                    </div>
                  </div>

                  {/* Arrow */}
                  <div style={{ flexShrink: 0, color: GOLD, marginTop: 2 }}>
                    <ArrowIcon />
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Footer CTA */}
          <div style={{ borderTop: ".5px solid #f0ebe0" }}>
            <Link
              href="/academic/bounty/board"
              onClick={close}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                padding: "13px 16px",
                background: GOLD,
                color: NAVY,
                fontSize: 10,
                fontWeight: 900,
                letterSpacing: ".12em",
                textTransform: "uppercase",
                textDecoration: "none",
                fontFamily: "'Lato',sans-serif",
                transition: "background .15s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = GOLDD)}
              onMouseLeave={(e) => (e.currentTarget.style.background = GOLD)}
            >
              View All Open Bounties <ArrowIcon />
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
