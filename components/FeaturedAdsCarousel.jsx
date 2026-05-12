"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { doc, updateDoc, increment } from "firebase/firestore";
import { db } from "@/lib/firebaseConfig";
import { fetchActiveAds } from "@/lib/adsCache";
import { Zap, Star, Award } from "lucide-react";
import Link from "next/link";

/* ── colour tokens (match site) ─────────────────────── */
const NAVY = "#0d2244";
const GOLD = "#b8963e";

/* ── tier meta ───────────────────────────────────────── */
const TIER_META = {
  Gold: { Icon: Zap, color: GOLD, badge: "AD" },
  Silver: { Icon: Star, color: "#94a3b8", badge: "AD" },
  Bronze: { Icon: Award, color: "#cd7f32", badge: "AD" },
};

/* ── Fisher-Yates shuffle ────────────────────────────── */
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/* ── resolve Google Images viewer URLs ──────────────── */
function resolveImageUrl(raw) {
  if (!raw) return "";
  try {
    const parsed = new URL(raw);
    if (parsed.hostname.includes("google.") && parsed.pathname === "/imgres") {
      const direct = parsed.searchParams.get("imgurl");
      if (direct) return decodeURIComponent(direct);
    }
  } catch {}
  return raw;
}

/* ── get thumbnail from driveFileId / embedUrl / pdfUrl ── */
function getThumbnailUrl(ad) {
  if (!ad)
    return "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400";
  if (ad.bannerUrl) return resolveImageUrl(ad.bannerUrl);
  if (ad.driveFileId)
    return `https://drive.google.com/thumbnail?id=${ad.driveFileId}&sz=w400`;
  if (ad.embedUrl) {
    const m = ad.embedUrl.match(
      /\/d\/(.*?)\/|\/file\/d\/(.*?)\/|id=(.*?)(&|$)/,
    );
    if (m) {
      const id = m[1] || m[2] || m[3];
      if (id) return `https://drive.google.com/thumbnail?id=${id}&sz=w400`;
    }
  }
  return "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400";
}

const BATCH_SIZE = 20;

/* ══════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════ */
export default function FeaturedAdsCarousel({
  tier = "Gold",
  maxAds = 5,
  autoPlay = true,
  autoPlayMs = 5000,
  className = "",
  style = {},
}) {
  const [ads, setAds] = useState([]);
  const [startIdx, setStartIdx] = useState(0);
  const [fading, setFading] = useState(false);
  const [ready, setReady] = useState(false);
  const [visibleCount, setVisibleCount] = useState(2);

  const wrapRef = useRef(null);
  const impressedIds = useRef(new Set());
  const meta = TIER_META[tier] ?? TIER_META.Gold;

  /* ── how many cards fit in the viewport ── */
  useEffect(() => {
    const calc = () => {
      const w = window.innerWidth;
      if (w >= 1280) setVisibleCount(6);
      else if (w >= 1024) setVisibleCount(5);
      else if (w >= 768) setVisibleCount(4);
      else if (w >= 540) setVisibleCount(3);
      else setVisibleCount(2);
    };
    calc();
    window.addEventListener("resize", calc);
    return () => window.removeEventListener("resize", calc);
  }, []);

  /* ── 1. FETCH → SHUFFLE → SLICE ── */
  useEffect(() => {
    let cancelled = false;
    fetchActiveAds()
      .then((allAds) => {
        if (cancelled) return;
        const filtered = allAds.filter((ad) => ad.tier === tier);
        const batched = shuffle(filtered).slice(0, BATCH_SIZE);
        setAds(batched);
        setStartIdx(0);
        setReady(true);
      })
      .catch((err) => {
        console.error("FeaturedAdsCarousel:", err.message);
        setReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, [tier, maxAds]);

  /* ── 2. IMPRESSION TRACKER ── */
  useEffect(() => {
    if (!ads.length || !wrapRef.current) return;
    const visibleIds = ads
      .slice(startIdx, startIdx + visibleCount)
      .map((a) => a.id)
      .filter(Boolean);

    const observers = visibleIds
      .filter((id) => !impressedIds.current.has(id))
      .map((id) => {
        const obs = new IntersectionObserver(
          ([entry]) => {
            if (entry.isIntersecting) {
              impressedIds.current.add(id);
              updateDoc(doc(db, "promotions", id), {
                impressions: increment(1),
              }).catch(() => {});
              obs.disconnect();
            }
          },
          { threshold: 0.5 },
        );
        obs.observe(wrapRef.current);
        return obs;
      });
    return () => observers.forEach((o) => o.disconnect());
  }, [ads, startIdx, visibleCount]);

  /* ── 3. NAVIGATION ── */
  const fadeTo = useCallback((nextIdx) => {
    setFading(true);
    setTimeout(() => {
      setStartIdx(nextIdx);
      setFading(false);
    }, 200);
  }, []);

  const next = useCallback(() => {
    fadeTo((startIdx + 1) % ads.length);
  }, [fadeTo, startIdx, ads.length]);

  const prev = useCallback(() => {
    fadeTo((startIdx - 1 + ads.length) % ads.length);
  }, [fadeTo, startIdx, ads.length]);

  /* ── 4. AUTO-PLAY ── */
  useEffect(() => {
    if (!autoPlay || ads.length <= visibleCount) return;
    const t = setInterval(next, autoPlayMs);
    return () => clearInterval(t);
  }, [autoPlay, autoPlayMs, next, ads.length, visibleCount]);

  /* ── 5. CLICK TRACKER ── */
  const handleClick = (ad) => {
    if (!ad?.id) return;
    updateDoc(doc(db, "promotions", ad.id), { clicks: increment(1) }).catch(
      () => {},
    );
  };

  if (!ready || !ads.length) return null;

  /* ── visible window — never repeat cards ── */
  const count = Math.min(visibleCount, ads.length);
  const visibleAds = Array.from(
    { length: count },
    (_, i) => ads[(startIdx + i) % ads.length],
  );

  /* ══════════════════════════════════════════════════════
     AD BOOK CARD
  ══════════════════════════════════════════════════════ */
  const AdBookCard = ({ ad }) => {
    const tierColor = meta.color;

    return (
      <Link
        href={ad.link || `/book/preview?id=${ad.bookId || ""}`}
        style={{ textDecoration: "none", display: "block" }}
        onClick={() => handleClick(ad)}
      >
        {/* ── Outer wrapper: tier-coloured border signals "this is an ad" ── */}
        <div
          style={{
            border: `1.5px solid ${tierColor}`,
            background: "#fff",
            display: "flex",
            flexDirection: "column",
            height: "100%",
            position: "relative",
          }}
        >
          {/* ── Top ribbon ── */}
          <div
            style={{
              background: tierColor,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "4px 10px",
              flexShrink: 0,
            }}
          >
            <span
              style={{
                fontSize: "8px",
                fontWeight: 700,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: "#fff",
                fontFamily: "'Lato', sans-serif",
              }}
            >
              ★ {tier.toUpperCase()} SPONSORED
            </span>
            <span
              style={{
                fontSize: "8px",
                fontWeight: 700,
                color: "rgba(255,255,255,0.75)",
                fontFamily: "'Lato', sans-serif",
                letterSpacing: "0.08em",
              }}
            >
              AD
            </span>
          </div>

          {/* ── Cover image area ── */}
          <div
            style={{
              position: "relative",
              background: "#ede8df",
              overflow: "hidden",
              flexShrink: 0,
            }}
          >
            <img
              src={getThumbnailUrl(ad)}
              alt={ad.bookTitle}
              style={{
                width: "100%",
                aspectRatio: "3/4",
                objectFit: "cover",
                display: "block",
                transition: "transform 0.5s cubic-bezier(0.4,0,0.2,1)",
              }}
              className="adbook-thumb"
              onError={(e) => {
                e.target.src =
                  "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400";
              }}
            />

            {/* PDF badge — top left */}
            <div
              style={{
                position: "absolute",
                top: "8px",
                left: "8px",
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
                background: NAVY,
                padding: "3px 8px",
                fontSize: "9px",
                fontWeight: 700,
                letterSpacing: "0.06em",
                color: "#fff",
                fontFamily: "'Lato', sans-serif",
              }}
            >
              <span
                style={{
                  width: "5px",
                  height: "5px",
                  borderRadius: "50%",
                  background: "#22c55e",
                  display: "inline-block",
                }}
              />
              PDF
            </div>

            {/* Headline overlay — bottom of image */}
            {ad.headline && (
              <div
                style={{
                  position: "absolute",
                  bottom: 0,
                  left: 0,
                  right: 0,
                  background:
                    "linear-gradient(to top, rgba(13,34,68,0.92) 0%, rgba(13,34,68,0.3) 60%, transparent 100%)",
                  padding: "32px 10px 10px",
                }}
              >
                <p
                  style={{
                    fontFamily: "'Playfair Display', serif",
                    fontSize: "11px",
                    fontWeight: 700,
                    color: "#fff",
                    margin: 0,
                    lineHeight: 1.3,
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                  }}
                >
                  {ad.headline}
                </p>
              </div>
            )}
          </div>

          {/* ── Info area ── */}
          <div
            style={{
              padding: "10px 10px 0",
              borderTop: "0.5px solid #f0ebe0",
              background: "#fff",
              display: "flex",
              flexDirection: "column",
              flex: 1,
            }}
          >
            {/* Title */}
            <h4
              style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: "13px",
                fontWeight: 700,
                color: NAVY,
                margin: "0 0 3px",
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
                lineHeight: 1.35,
              }}
            >
              {ad.bookTitle}
            </h4>

            {/* Author */}
            <p
              style={{
                fontSize: "11px",
                color: "#888",
                margin: "0 0 6px",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                fontFamily: "'Lato', sans-serif",
              }}
            >
              {ad.bookAuthor}
            </p>

            {/* Category / resource type */}
            {(ad.category || ad.resourceType) && (
              <span
                style={{
                  fontSize: "9px",
                  fontWeight: 700,
                  color: GOLD,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  fontFamily: "'Lato', sans-serif",
                  display: "block",
                  marginBottom: "4px",
                }}
              >
                {ad.resourceType || ad.category}
              </span>
            )}

            {/* Price */}
            {ad.bookPrice && (
              <p
                style={{
                  fontSize: "12px",
                  fontWeight: 700,
                  color: NAVY,
                  margin: "0 0 8px",
                  fontFamily: "'Lato', sans-serif",
                }}
              >
                ₦{Number(ad.bookPrice).toLocaleString()}
              </p>
            )}

            {/* Spacer — pushes CTA to bottom */}
            <div style={{ flex: 1 }} />

            {/* ── CTA button ── */}
            <div
              style={{
                borderTop: "0.5px solid #f0ebe0",
                paddingTop: "8px",
                paddingBottom: "10px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "5px",
                  padding: "8px 10px",
                  background: tierColor,
                  fontSize: "9px",
                  fontWeight: 700,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  color: tier === "Gold" ? NAVY : "#fff",
                  fontFamily: "'Lato', sans-serif",
                }}
              >
                {ad.ctaText || "Learn More"}
                {/* arrow icon */}
                <svg
                  width="9"
                  height="9"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </div>

              {/* Disclosure */}
              <p
                style={{
                  fontSize: "8px",
                  color: "#bbb",
                  textAlign: "center",
                  margin: "5px 0 0",
                  fontFamily: "'Lato', sans-serif",
                  letterSpacing: "0.05em",
                }}
              >
                Sponsored · Paid Advertisement
              </p>
            </div>
          </div>
        </div>
      </Link>
    );
  };

  /* ══════════════════════════════════════════════════════
     RENDER
  ══════════════════════════════════════════════════════ */
  return (
    <>
      <style>{`
        .adbook-thumb { transition: transform 0.5s cubic-bezier(0.4,0,0.2,1); }
        a:hover .adbook-thumb { transform: scale(1.06); }
        .adbook-fade    { opacity: 0; transition: opacity 0.2s ease; }
        .adbook-visible { opacity: 1; transition: opacity 0.2s ease; }

        /* mobile scroll strip */
        .adbook-strip { display: flex; gap: 10px; overflow-x: auto; padding-bottom: 12px; scrollbar-width: none; -ms-overflow-style: none; }
        .adbook-strip::-webkit-scrollbar { display: none; }
        .adbook-strip-item { flex-shrink: 0; width: 150px; }

        /* desktop grid */
        @media (min-width: 1024px) {
          .adbook-desktop { display: grid !important; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 16px; }
        }
      `}</style>

      <div ref={wrapRef} className={`w-full ${className}`} style={style}>
        {/* ── Mobile: horizontal scroll strip ── */}
        <div className="block lg:hidden">
          <div className="adbook-strip">
            {visibleAds.map((ad, i) => (
              <div key={`${ad.id}-${i}`} className="adbook-strip-item">
                <AdBookCard ad={ad} />
              </div>
            ))}
          </div>
        </div>

        {/* ── Desktop: grid ── */}
        <div
          className="hidden lg:grid adbook-desktop"
          style={{ opacity: fading ? 0 : 1, transition: "opacity 0.2s ease" }}
        >
          {visibleAds.map((ad, i) => (
            <AdBookCard key={`${ad.id}-${i}`} ad={ad} />
          ))}
        </div>
      </div>
    </>
  );
}
