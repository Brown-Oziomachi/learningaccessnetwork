"use client";

/**
 * BountyBadge.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Exports:
 *   BountyBadge        — a compact inline badge (Requested / Fulfilled / Verified)
 *   BountyBanner       — a full-width contextual banner for a book detail page
 *   LibraryBookCard    — drop-in library card that shows all badges including
 *                        the bounty "Requested" and "Verified" marks.
 *
 * Usage — library grid:
 *   <LibraryBookCard book={bookDoc} />
 *
 * Usage — book detail page header:
 *   <BountyBanner bountyId={book.bountyId} reward={book.bountyReward} />
 */

import React, { useState, useEffect } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebaseConfig";

/* ─── Brand tokens ──────────────────────────────────────────── */
const NAVY = "#0d2244";
const GOLD = "#b8963e";
const GOLDD = "#d4aa5a";
const CREAM = "#f5f0e8";
const BG = "#f5f1ea";

/* ─── Icons ─────────────────────────────────────────────────── */
const VerifiedIcon = () => (
  <svg
    width="10"
    height="10"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
  >
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);
const RequestedIcon = () => (
  <svg
    width="10"
    height="10"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
  >
    <circle cx="12" cy="12" r="10" />
    <path d="M12 6v6l4 2" />
  </svg>
);
const StarIcon = () => (
  <svg
    width="10"
    height="10"
    viewBox="0 0 24 24"
    fill={GOLD}
    stroke={GOLD}
    strokeWidth="1"
  >
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);
const DownloadIcon = () => (
  <svg
    width="11"
    height="11"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
  >
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);
const ArrowUpRightIcon = () => (
  <svg
    width="11"
    height="11"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
  >
    <line x1="7" y1="17" x2="17" y2="7" />
    <polyline points="7 7 17 7 17 17" />
  </svg>
);
const EscrowIcon = () => (
  <svg
    width="12"
    height="12"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <rect x="3" y="11" width="18" height="11" rx="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

/* ═══════════════════════════════════════════════════════════════
   1.  BountyBadge — inline pill
   ═══════════════════════════════════════════════════════════════ */

const BADGE_VARIANTS = {
  requested: {
    bg: "rgba(13,34,68,.92)",
    color: GOLD,
    border: `1px solid ${GOLD}`,
    icon: <RequestedIcon />,
    label: "REQUESTED",
  },
  verified: {
    bg: GOLD,
    color: NAVY,
    border: `1px solid ${GOLD}`,
    icon: <VerifiedIcon />,
    label: "VERIFIED",
  },
  pending: {
    bg: "rgba(234,179,8,.12)",
    color: "#92400e",
    border: ".5px solid rgba(234,179,8,.4)",
    icon: <RequestedIcon />,
    label: "PENDING APPROVAL",
  },
  fulfilled: {
    bg: "rgba(22,163,74,.08)",
    color: "#15803d",
    border: ".5px solid rgba(22,163,74,.3)",
    icon: <VerifiedIcon />,
    label: "FULFILLED",
  },
};

export function BountyBadge({
  variant = "requested",
  size = "sm",
  style: extraStyle,
}) {
  const v = BADGE_VARIANTS[variant] || BADGE_VARIANTS.requested;
  const sm = size === "sm";
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: sm ? 4 : 5,
        background: v.bg,
        color: v.color,
        border: v.border,
        padding: sm ? "3px 8px" : "5px 12px",
        fontSize: sm ? 8 : 10,
        fontWeight: 900,
        letterSpacing: ".14em",
        fontFamily: "'Lato',sans-serif",
        whiteSpace: "nowrap",
        ...extraStyle,
      }}
    >
      {v.icon}
      {v.label}
    </span>
  );
}

/* ═══════════════════════════════════════════════════════════════
   2.  BountyBanner — book detail page header strip
   ═══════════════════════════════════════════════════════════════ */

export function BountyBanner({ bountyId, reward, requestTitle }) {
  return (
    <div
      style={{
        background: NAVY,
        backgroundImage: `radial-gradient(rgba(184,150,62,.07) 1px,transparent 1px)`,
        backgroundSize: "22px 22px",
        padding: "18px 24px",
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 16,
        borderBottom: `1px solid ${GOLD}`,
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
        {/* escrow verified mark */}
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: "50%",
            background: "rgba(184,150,62,.15)",
            border: `1px solid ${GOLD}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            color: GOLD,
          }}
        >
          <EscrowIcon />
        </div>
        <div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 4,
            }}
          >
            <BountyBadge variant="requested" size="md" />
            <BountyBadge variant="verified" size="md" />
          </div>
          <p
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: "#fff",
              fontFamily: "'Lato',sans-serif",
              margin: "0 0 2px",
            }}
          >
            {requestTitle || "Student-Requested Document"}
          </p>
          <p
            style={{
              fontSize: 11,
              color: "rgba(245,240,232,.45)",
              fontFamily: "'Lato',sans-serif",
              margin: 0,
            }}
          >
            This document was created in direct response to a student bounty
            request and has been verified by LAN Library.
          </p>
        </div>
      </div>

      {reward && (
        <div style={{ textAlign: "right", flexShrink: 0 }}>
          <p
            style={{
              fontSize: 9,
              fontWeight: 700,
              letterSpacing: ".16em",
              textTransform: "uppercase",
              color: "rgba(184,150,62,.55)",
              fontFamily: "'Lato',sans-serif",
              marginBottom: 3,
            }}
          >
            Bounty Reward
          </p>
          <p
            style={{
              fontFamily: "'Playfair Display',serif",
              fontSize: 26,
              fontWeight: 700,
              color: GOLD,
              margin: 0,
            }}
          >
            ₦{Number(reward).toLocaleString("en-NG")}
          </p>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   3.  LibraryBookCard — drop-in card for the library grid
   ═══════════════════════════════════════════════════════════════ */

export function LibraryBookCard({ book, onView, onDownload }) {
  const [hovered, setHovered] = useState(false);

  const isBounty = book.bountyFulfillment === true;
  const isVerified = isBounty && book.bountyId;

  /* derive a badge variant from the book's bounty status */
  const bountyVariant =
    book.bountyStatus === "fulfilled"
      ? "fulfilled"
      : book.bountyStatus === "pending_approval"
        ? "pending"
        : isBounty
          ? "requested"
          : null;

  const coverColors = [
    ["#0d2244", "#b8963e"],
    ["#1a3a6e", "#d4aa5a"],
    ["#2d1b6e", "#b8963e"],
    ["#0d3b2e", "#b8963e"],
  ];
  const cc = coverColors[(book.title?.length ?? 0) % coverColors.length];

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: "#fff",
        border: `.5px solid ${hovered ? GOLD : "#e5ddd0"}`,
        transform: hovered ? "translateY(-4px)" : "none",
        boxShadow: hovered ? "0 16px 40px rgba(13,34,68,.12)" : "none",
        transition: "border-color .22s, transform .22s, box-shadow .22s",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        position: "relative",
      }}
    >
      {/* ── bounty ribbon (top-right corner) ── */}
      {isBounty && (
        <div
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            background: GOLD,
            color: NAVY,
            fontSize: 7,
            fontWeight: 900,
            letterSpacing: ".16em",
            textTransform: "uppercase",
            fontFamily: "'Lato',sans-serif",
            padding: "4px 10px 4px 14px",
            clipPath: "polygon(12px 0,100% 0,100% 100%,0 100%)",
            zIndex: 2,
          }}
        >
          BOUNTY
        </div>
      )}

      {/* ── cover art ── */}
      <div
        style={{
          height: 120,
          background: `linear-gradient(135deg, ${cc[0]} 0%, ${cc[0]}ee 100%)`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          overflow: "hidden",
          padding: "16px 20px",
        }}
      >
        {/* decorative dot grid */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: `radial-gradient(${cc[1]}20 1px, transparent 1px)`,
            backgroundSize: "16px 16px",
          }}
        />
        {/* title on cover */}
        <p
          style={{
            fontFamily: "'Playfair Display',serif",
            fontSize: 14,
            fontWeight: 700,
            color: "#fff",
            textAlign: "center",
            lineHeight: 1.3,
            position: "relative",
            display: "-webkit-box",
            WebkitLineClamp: 3,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {book.title}
        </p>
        {/* spine accent */}
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            bottom: 0,
            width: 4,
            background: cc[1],
          }}
        />
      </div>

      {/* ── body ── */}
      <div
        style={{
          padding: "14px 16px",
          flex: 1,
          display: "flex",
          flexDirection: "column",
          gap: 8,
        }}
      >
        {/* badges row */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
          {book.university && (
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
              {book.university}
            </span>
          )}
          {book.type && (
            <span
              style={{
                background: CREAM,
                color: "#888",
                fontSize: 8,
                fontWeight: 700,
                letterSpacing: ".08em",
                textTransform: "uppercase",
                padding: "2px 7px",
                fontFamily: "'Lato',sans-serif",
                border: ".5px solid #e5ddd0",
              }}
            >
              {book.type.replace(/_/g, " ")}
            </span>
          )}
          {bountyVariant && <BountyBadge variant={bountyVariant} />}
          {isVerified && <BountyBadge variant="verified" />}
        </div>

        {/* title */}
        <h3
          style={{
            fontFamily: "'Playfair Display',serif",
            fontSize: 14,
            fontWeight: 700,
            color: hovered ? GOLD : NAVY,
            lineHeight: 1.35,
            margin: 0,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            transition: "color .15s",
          }}
        >
          {book.title}
        </h3>

        {/* meta row */}
        <div
          style={{
            display: "flex",
            gap: 10,
            flexWrap: "wrap",
            fontSize: 10,
            color: "#aaa",
            fontFamily: "'Lato',sans-serif",
            fontWeight: 700,
          }}
        >
          {book.course && <span>{book.course}</span>}
          {book.department && (
            <>
              <span>·</span>
              <span>{book.department}</span>
            </>
          )}
          {book.year && (
            <>
              <span>·</span>
              <span>{book.year}</span>
            </>
          )}
        </div>

        {/* rating row */}
        {book.rating > 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            {Array.from({ length: 5 }, (_, i) => (
              <span
                key={i}
                style={{ opacity: i < Math.round(book.rating) ? 1 : 0.2 }}
              >
                <StarIcon />
              </span>
            ))}
            <span
              style={{
                fontSize: 10,
                color: "#bbb",
                fontFamily: "'Lato',sans-serif",
                marginLeft: 2,
              }}
            >
              ({book.ratingCount ?? 0})
            </span>
          </div>
        )}

        {/* bounty fulfilment detail strip */}
        {isBounty && (
          <div
            style={{
              background: "rgba(13,34,68,.04)",
              border: ".5px solid rgba(13,34,68,.1)",
              padding: "8px 10px",
              marginTop: 2,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span
                style={{
                  fontSize: 9,
                  fontWeight: 700,
                  letterSpacing: ".1em",
                  textTransform: "uppercase",
                  color: "#aaa",
                  fontFamily: "'Lato',sans-serif",
                }}
              >
                Bounty Reward
              </span>
              <span
                style={{
                  fontFamily: "'Playfair Display',serif",
                  fontSize: 15,
                  fontWeight: 700,
                  color: GOLD,
                }}
              >
                ₦{Number(book.bountyReward || 0).toLocaleString("en-NG")}
              </span>
            </div>
          </div>
        )}

        <div style={{ flex: 1 }} />

        {/* price + CTA row */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            paddingTop: 10,
            borderTop: ".5px solid #f0ebe0",
          }}
        >
          <div>
            {!isBounty &&
              (book.price > 0 ? (
                <span
                  style={{
                    fontFamily: "'Playfair Display',serif",
                    fontSize: 16,
                    fontWeight: 700,
                    color: NAVY,
                  }}
                >
                  ₦{Number(book.price).toLocaleString("en-NG")}
                </span>
              ) : (
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: "#16a34a",
                    fontFamily: "'Lato',sans-serif",
                    letterSpacing: ".06em",
                  }}
                >
                  FREE
                </span>
              ))}
            {isBounty && (
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: GOLD,
                  fontFamily: "'Lato',sans-serif",
                  letterSpacing: ".08em",
                }}
              >
                STUDENT ACCESS
              </span>
            )}
          </div>

          <div style={{ display: "flex", gap: 6 }}>
            {onDownload && (
              <button
                onClick={() => onDownload(book)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                  padding: "7px 12px",
                  background: "none",
                  border: ".5px solid #e5ddd0",
                  fontSize: 10,
                  fontWeight: 700,
                  color: "#888",
                  cursor: "pointer",
                  fontFamily: "'Lato',sans-serif",
                  letterSpacing: ".06em",
                  textTransform: "uppercase",
                  transition: "border-color .15s, color .15s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = GOLD;
                  e.currentTarget.style.color = GOLD;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "#e5ddd0";
                  e.currentTarget.style.color = "#888";
                }}
              >
                <DownloadIcon />
              </button>
            )}
            <button
              onClick={() => onView?.(book)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                padding: "7px 14px",
                background: hovered ? GOLD : NAVY,
                color: hovered ? NAVY : "#fff",
                border: "none",
                fontSize: 10,
                fontWeight: 700,
                cursor: "pointer",
                fontFamily: "'Lato',sans-serif",
                letterSpacing: ".08em",
                textTransform: "uppercase",
                transition: "background .18s, color .18s",
              }}
            >
              View <ArrowUpRightIcon />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   4.  BountyBookShelf — demo grid (use in your library page)
   ═══════════════════════════════════════════════════════════════ */

export function BountyBookShelf({ books, onView, onDownload }) {
  const bountyBooks = books.filter((b) => b.bountyFulfillment);
  const regular = books.filter((b) => !b.bountyFulfillment);

  if (bountyBooks.length === 0) return null;

  return (
    <section style={{ marginBottom: 48 }}>
      {/* shelf header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 14,
          marginBottom: 20,
          padding: "14px 20px",
          background: NAVY,
          backgroundImage: `radial-gradient(rgba(184,150,62,.07) 1px,transparent 1px)`,
          backgroundSize: "20px 20px",
        }}
      >
        <div>
          <p
            style={{
              fontSize: 9,
              fontWeight: 700,
              letterSpacing: ".2em",
              textTransform: "uppercase",
              color: "rgba(184,150,62,.55)",
              fontFamily: "'Lato',sans-serif",
              marginBottom: 3,
            }}
          >
            Platform Verified
          </p>
          <h3
            style={{
              fontFamily: "'Playfair Display',serif",
              fontSize: 18,
              fontWeight: 700,
              color: "#fff",
              margin: 0,
            }}
          >
            Bounty-Fulfilled Documents
          </h3>
        </div>
        <div style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
          <BountyBadge variant="requested" size="md" />
          <BountyBadge variant="verified" size="md" />
        </div>
      </div>

      <p
        style={{
          fontSize: 12,
          color: "#888",
          fontFamily: "'Lato',sans-serif",
          lineHeight: 1.7,
          marginBottom: 20,
        }}
      >
        These documents were created in direct response to student requests and
        have been reviewed by LAN Library.
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
          gap: 16,
        }}
      >
        {bountyBooks.map((book) => (
          <LibraryBookCard
            key={book.id}
            book={book}
            onView={onView}
            onDownload={onDownload}
          />
        ))}
      </div>
    </section>
  );
}

export default BountyBadge;
