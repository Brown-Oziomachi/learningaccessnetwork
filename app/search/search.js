"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  doc, getDoc, collection, query, where,
  getDocs, setDoc, increment, orderBy, limit, updateDoc
} from "firebase/firestore";
import { auth, db } from "@/lib/firebaseConfig";
import { booksData } from "@/lib/booksData";
import { FileText, X, TrendingUp, Search, ArrowRight, SlidersHorizontal, Flag, ExternalLink, ShieldCheck, Star, BookOpen } from "lucide-react";
import Link from "next/link";
import Navbar from "@/components/NavBar";
import FeaturedAdsCarousel from "@/components/FeaturedAdsCarousel";
import { useAds } from "@/lib/useAds";
import { parseSearchQuery } from "@/lib/searchQueryParser";

/* ─── colour tokens ─────────────────────────────────────────── */
const NAVY = "#0d2244";
const GOLD = "#b8963e";
const CREAM = "#f5f0e8";
const BG = "#f5f1ea";

/* ─── helpers ─────────────────────────────────────────────────── */
const getThumbnailUrl = (book) => {
  if (!book) return "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400";
  if (book.driveFileId) return `https://drive.google.com/thumbnail?id=${book.driveFileId}&sz=w400`;
  if (book.embedUrl) {
    const m = book.embedUrl.match(/\/d\/(.*?)\/|\/file\/d\/(.*?)\/|id=(.*?)(&|$)/);
    if (m) { const id = m[1] || m[2] || m[3]; if (id) return `https://drive.google.com/thumbnail?id=${id}&sz=w400`; }
  }
  if (book.pdfUrl?.includes("drive.google.com")) {
    const m = book.pdfUrl.match(/[-\w]{25,}/);
    if (m) return `https://drive.google.com/thumbnail?id=${m[0]}&sz=w400`;
  }
  return book.image || "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400";
};

const chunkArray = (arr, size) => {
  const chunks = [];
  for (let i = 0; i < arr.length; i += size) chunks.push(arr.slice(i, i + size));
  return chunks;
};

/* ─── Client-side score calculator (mirrors Cloud Function) ── */
const REQUIRED_TAG_KEYS = ["institution", "courseCode", "department", "year", "resourceType"];

function computeClientScore(doc) {
  const salesCount = Number(doc.sales_count || doc.salesCount || 0);
  const avgRating = Number(doc.average_rating || doc.averageRating || 0);
  const totalReviews = Number(doc.total_review_count || doc.totalReviewCount || 0);
  const isFaculty = Boolean(doc.isFaculty || doc.isVerifiedFaculty);
  const isFullyTagged = REQUIRED_TAG_KEYS.every(k => {
    const v = doc[k] || (doc.tags && doc.tags[k]);
    return v && String(v).trim().length > 0;
  });

  let ratingBoost = 0;
  if (avgRating >= 5.0) ratingBoost = 80;
  else if (avgRating >= 4.5) ratingBoost = 60;
  else if (avgRating >= 4.0) ratingBoost = 40;
  else if (avgRating >= 3.5) ratingBoost = 15;

  return (salesCount * 5) + (avgRating * 15) + (totalReviews * 10) +
    (isFaculty ? 100 : 0) + (isFullyTagged ? 30 : 0) + ratingBoost;
}

/* ─── Star rating display helper ───────────────────────────── */
function StarRating({ rating = 0, count = 0 }) {
  const r = Math.round(rating * 2) / 2; // round to nearest 0.5
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "3px" }}>
      {[1, 2, 3, 4, 5].map(s => (
        <span key={s} style={{ fontSize: "9px", color: s <= r ? GOLD : "#ddd", lineHeight: 1 }}>★</span>
      ))}
      {count > 0 && (
        <span style={{ fontSize: "9px", color: "#aaa", fontFamily: "'Lato',sans-serif", marginLeft: "2px" }}>
          ({count})
        </span>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   USER PROFILE CARD
════════════════════════════════════════════════════════════════ */
function UserProfileCard({ user }) {
  const [reporting, setReporting] = useState(false);
  const [reported, setReported] = useState(false);

  const badgeConfig = {
    "Verified Faculty": { bg: "#fffbeb", border: GOLD, text: GOLD, icon: "🏛️" },
    "Platinum Seller": { bg: "#f5f3ff", border: "#7c3aed", text: "#7c3aed", icon: "💎" },
    "Gold Seller": { bg: "#fffbeb", border: GOLD, text: "#92400e", icon: "🥇" },
    "Silver Seller": { bg: "#f8fafc", border: "#94a3b8", text: "#475569", icon: "🥈" },
    "Bronze Seller": { bg: "#fdf6ee", border: "#cd7f32", text: "#92400e", icon: "🥉" },
  };

  const badge = user.badge || user.sellerTier || user.role || "Verified Seller";
  const bc = badgeConfig[badge] || { bg: "#f0f9ff", border: "#0ea5e9", text: "#0369a1", icon: "✓" };

  const handleReport = async () => {
    if (reported) return;
    setReporting(true);
    try {
      await setDoc(doc(db, "reports", `${user.uid || user.id}-${Date.now()}`), {
        reportedUserId: user.uid || user.id,
        reportedUserName: user.displayName || user.name,
        reportedBy: auth.currentUser?.uid || "anonymous",
        reason: "Flagged from search results",
        timestamp: new Date().toISOString(),
      });
      setReported(true);
    } catch { }
    setReporting(false);
  };

  return (
    <div style={{
      background: "#fff",
      border: "1px solid #e5ddd0",
      borderTop: `3px solid ${bc.border}`,
      padding: "20px",
      position: "relative",
      transition: "box-shadow .2s",
    }}
      onMouseEnter={e => e.currentTarget.style.boxShadow = "0 8px 32px rgba(13,34,68,.08)"}
      onMouseLeave={e => e.currentTarget.style.boxShadow = "none"}
    >
      {/* Entity type label */}
      <div style={{
        position: "absolute", top: "10px", right: "10px",
        fontSize: "8px", fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase",
        color: bc.text, background: bc.bg, border: `1px solid ${bc.border}`,
        padding: "3px 8px", fontFamily: "'Lato',sans-serif",
      }}>
        {bc.icon} {badge}
      </div>

      <div style={{ display: "flex", gap: "14px", alignItems: "flex-start", marginTop: "8px" }}>
        {/* Avatar */}
        <div style={{ flexShrink: 0 }}>
          {user.photoURL || user.avatar ? (
            <img
              src={user.photoURL || user.avatar}
              alt={user.displayName || user.name}
              style={{ width: "56px", height: "56px", borderRadius: "50%", objectFit: "cover", border: `2px solid ${bc.border}` }}
              onError={e => {
                e.target.style.display = "none";
                e.target.nextSibling.style.display = "flex";
              }}
            />
          ) : null}
          <div style={{
            width: "56px", height: "56px", borderRadius: "50%",
            background: bc.bg, border: `2px solid ${bc.border}`,
            display: (user.photoURL || user.avatar) ? "none" : "flex",
            alignItems: "center", justifyContent: "center",
            fontFamily: "'Playfair Display',serif", fontSize: "20px", fontWeight: 700, color: bc.text,
          }}>
            {(user.displayName || user.name || "?")[0].toUpperCase()}
          </div>
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3 style={{
            fontFamily: "'Playfair Display',serif", fontSize: "16px", fontWeight: 700,
            color: NAVY, margin: "0 0 3px", lineHeight: 1.2,
          }}>
            {user.displayName || user.name}
          </h3>

          {user.institution && (
            <p style={{ fontSize: "11px", color: "#888", margin: "0 0 6px", fontFamily: "'Lato',sans-serif", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              🎓 {user.institution}
            </p>
          )}

          {user.bio && (
            <p style={{
              fontSize: "11px", color: "#666", margin: "0 0 10px",
              fontFamily: "'Lato',sans-serif", lineHeight: 1.6,
              display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden",
            }}>
              {user.bio}
            </p>
          )}

          {/* Stats */}
          <div style={{ display: "flex", gap: "12px", marginBottom: "12px", flexWrap: "wrap" }}>
            {user.documentCount > 0 && (
              <span style={{ fontSize: "10px", color: "#888", fontFamily: "'Lato',sans-serif", display: "flex", alignItems: "center", gap: "3px" }}>
                <BookOpen size={10} style={{ color: GOLD }} />
                {user.documentCount} docs
              </span>
            )}
            {user.totalSales > 0 && (
              <span style={{ fontSize: "10px", color: "#888", fontFamily: "'Lato',sans-serif", display: "flex", alignItems: "center", gap: "3px" }}>
                <TrendingUp size={10} style={{ color: "#22c55e" }} />
                {user.totalSales} sales
              </span>
            )}
            {user.averageRating > 0 && (
              <StarRating rating={user.averageRating} count={user.reviewCount} />
            )}
          </div>

          {/* Action buttons */}
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <Link
              href={`/seller/profile/${user.uid || user.id}`}
              style={{
                display: "inline-flex", alignItems: "center", gap: "5px",
                padding: "8px 16px", background: NAVY, color: "#fff",
                fontSize: "10px", fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase",
                textDecoration: "none", fontFamily: "'Lato',sans-serif",
                transition: "background .15s",
              }}
              onMouseEnter={e => e.currentTarget.style.background = "#162f5a"}
              onMouseLeave={e => e.currentTarget.style.background = NAVY}
            >
              <ExternalLink size={10} /> View Profile
            </Link>

            <button
              onClick={handleReport}
              disabled={reported}
              style={{
                display: "inline-flex", alignItems: "center", gap: "4px",
                padding: "7px 12px",
                background: "transparent",
                color: reported ? "#aaa" : "#ef4444",
                border: `1px solid ${reported ? "#e5ddd0" : "#fca5a5"}`,
                fontSize: "10px", fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase",
                fontFamily: "'Lato',sans-serif", cursor: reported ? "default" : "pointer",
                transition: "all .15s",
              }}
              title={reported ? "Reported — thank you" : "Report this account"}
            >
              <Flag size={10} /> {reported ? "Reported" : "Report"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   FILTER PANEL
════════════════════════════════════════════════════════════════ */
const UNIVERSITIES = [
  "University of Lagos", "Obafemi Awolowo University", "Ahmadu Bello University",
  "University of Ibadan", "Federal University of Technology Akure", "University of Benin",
  "Lagos State University", "University of Ghana", "University of Nigeria Nsukka",
  "University of Port Harcourt", "Bayero University Kano", "University of Jos",
];

const RESOURCE_TYPES = [
  "Past Questions", "Lecture Notes", "Textbook", "Lab Manual",
  "Lab Report", "Assignment", "Project", "Thesis", "Summary", "Slides",
];

const YEARS = Array.from({ length: 8 }, (_, i) => String(2024 - i));

function FilterPanel({ filters, onChange, onClose, resultCount }) {
  const [local, setLocal] = useState(filters);

  const set = (key, val) => setLocal(prev => ({ ...prev, [key]: val }));

  const apply = () => { onChange(local); onClose(); };
  const reset = () => {
    const empty = { institution: "", year: "", documentType: "", priceMin: "", priceMax: "", facultyOnly: false, fullyTaggedOnly: false };
    setLocal(empty);
    onChange(empty);
    onClose();
  };

  const activeCount = Object.values(local).filter(v => v !== "" && v !== false).length;

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(13,34,68,.6)", zIndex: 60,
      display: "flex", alignItems: "flex-end",
    }} onClick={onClose}>
      <div
        style={{
          background: BG, width: "100%", maxWidth: "500px", margin: "0 auto",
          padding: "28px 24px 32px", borderTop: `3px solid ${GOLD}`,
          maxHeight: "90vh", overflowY: "auto",
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
          <div>
            <p style={{ fontSize: "8px", fontWeight: 700, letterSpacing: ".2em", textTransform: "uppercase", color: GOLD, margin: "0 0 2px", fontFamily: "'Lato',sans-serif" }}>Filter & Sort</p>
            <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: "20px", fontWeight: 700, color: NAVY, margin: 0 }}>
              Refine Results
              {activeCount > 0 && <span style={{ fontSize: "12px", color: GOLD, fontFamily: "'Lato',sans-serif", marginLeft: "8px" }}>({activeCount} active)</span>}
            </h2>
          </div>
          <button onClick={onClose} style={{ width: "32px", height: "32px", border: "0.5px solid #e5ddd0", background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#888" }}>
            <X size={14} />
          </button>
        </div>

        {/* Institution */}
        <div style={{ marginBottom: "20px" }}>
          <label style={{ fontSize: "10px", fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", color: NAVY, display: "block", marginBottom: "8px", fontFamily: "'Lato',sans-serif" }}>Institution</label>
          <select
            value={local.institution || ""}
            onChange={e => set("institution", e.target.value)}
            style={{ width: "100%", padding: "10px 12px", border: "0.5px solid #e5ddd0", background: "#fff", fontFamily: "'Lato',sans-serif", fontSize: "13px", color: NAVY, appearance: "none", cursor: "pointer" }}
          >
            <option value="">All Institutions</option>
            {UNIVERSITIES.map(u => <option key={u} value={u}>{u}</option>)}
          </select>
        </div>

        {/* Document Type */}
        <div style={{ marginBottom: "20px" }}>
          <label style={{ fontSize: "10px", fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", color: NAVY, display: "block", marginBottom: "8px", fontFamily: "'Lato',sans-serif" }}>Document Type</label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
            {RESOURCE_TYPES.map(rt => (
              <button
                key={rt}
                onClick={() => set("documentType", local.documentType === rt ? "" : rt)}
                style={{
                  padding: "6px 14px", fontSize: "11px", fontWeight: 700,
                  fontFamily: "'Lato',sans-serif", letterSpacing: ".06em", textTransform: "uppercase",
                  background: local.documentType === rt ? NAVY : "#fff",
                  color: local.documentType === rt ? "#fff" : "#666",
                  border: `1px solid ${local.documentType === rt ? NAVY : "#e5ddd0"}`,
                  cursor: "pointer", transition: "all .12s",
                }}
              >{rt}</button>
            ))}
          </div>
        </div>

        {/* Year */}
        <div style={{ marginBottom: "20px" }}>
          <label style={{ fontSize: "10px", fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", color: NAVY, display: "block", marginBottom: "8px", fontFamily: "'Lato',sans-serif" }}>Year</label>
          <select
            value={local.year || ""}
            onChange={e => set("year", e.target.value)}
            style={{ width: "100%", padding: "10px 12px", border: "0.5px solid #e5ddd0", background: "#fff", fontFamily: "'Lato',sans-serif", fontSize: "13px", color: NAVY, appearance: "none", cursor: "pointer" }}
          >
            <option value="">All Years</option>
            {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>

        {/* Price range */}
        <div style={{ marginBottom: "20px" }}>
          <label style={{ fontSize: "10px", fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", color: NAVY, display: "block", marginBottom: "8px", fontFamily: "'Lato',sans-serif" }}>Price Range (₦)</label>
          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <input
              type="number" placeholder="Min" value={local.priceMin || ""}
              onChange={e => set("priceMin", e.target.value)}
              style={{ flex: 1, padding: "10px 12px", border: "0.5px solid #e5ddd0", background: "#fff", fontFamily: "'Lato',sans-serif", fontSize: "13px", color: NAVY }}
            />
            <span style={{ color: "#ccc", fontFamily: "'Lato',sans-serif" }}>–</span>
            <input
              type="number" placeholder="Max" value={local.priceMax || ""}
              onChange={e => set("priceMax", e.target.value)}
              style={{ flex: 1, padding: "10px 12px", border: "0.5px solid #e5ddd0", background: "#fff", fontFamily: "'Lato',sans-serif", fontSize: "13px", color: NAVY }}
            />
          </div>
        </div>

        {/* Toggles */}
        <div style={{ marginBottom: "24px", display: "flex", flexDirection: "column", gap: "12px" }}>
          {[
            ["facultyOnly", "🏛️ Faculty uploads only", "Show documents uploaded by Verified Faculty members"],
            ["fullyTaggedOnly", "🏷️ Fully tagged documents only", "Only documents with complete metadata (institution, course code, dept, year, type)"],
          ].map(([key, label, desc]) => (
            <div
              key={key}
              style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px", background: "#fff", border: "0.5px solid #e5ddd0", cursor: "pointer" }}
              onClick={() => set(key, !local[key])}
            >
              <div>
                <div style={{ fontSize: "12px", fontWeight: 700, color: NAVY, fontFamily: "'Lato',sans-serif" }}>{label}</div>
                <div style={{ fontSize: "10px", color: "#888", fontFamily: "'Lato',sans-serif", marginTop: "2px" }}>{desc}</div>
              </div>
              <div style={{
                width: "40px", height: "22px", borderRadius: "99px",
                background: local[key] ? NAVY : "#e5ddd0",
                position: "relative", flexShrink: 0, marginLeft: "12px",
                transition: "background .15s",
              }}>
                <div style={{
                  position: "absolute", top: "3px",
                  left: local[key] ? "21px" : "3px",
                  width: "16px", height: "16px", borderRadius: "50%", background: "#fff",
                  transition: "left .15s",
                }} />
              </div>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: "10px" }}>
          <button onClick={apply} style={{ flex: 1, padding: "13px", background: NAVY, color: "#fff", fontFamily: "'Lato',sans-serif", fontSize: "12px", fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", border: "none", cursor: "pointer" }}>
            Apply Filters
          </button>
          <button onClick={reset} style={{ padding: "13px 20px", background: "transparent", color: "#888", fontFamily: "'Lato',sans-serif", fontSize: "12px", fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", border: "0.5px solid #e5ddd0", cursor: "pointer" }}>
            Reset
          </button>
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   MAIN COMPONENT
════════════════════════════════════════════════════════════════ */
export default function SearchClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const q = searchParams.get("q")?.toLowerCase() || "";

  /* ── state ── */
  const [searchResults, setSearchResults] = useState([]);
  const [userResults, setUserResults] = useState([]);
  const [mostSearchedBooks, setMostSearchedBooks] = useState([]);
  const [purchasedBookIds, setPurchasedBookIds] = useState(new Set());
  const [loading, setLoading] = useState(false);
  const [showMostSearched, setShowMostSearched] = useState(false);
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [parsedQuery, setParsedQuery] = useState(null);
  const [filters, setFilters] = useState({
    institution: "", year: "", documentType: "",
    priceMin: "", priceMax: "", facultyOnly: false, fullyTaggedOnly: false,
  });

  const goldAds = useAds("Gold", 5);
  const silverAds = useAds("Silver", 3);

  /* ── track search ── */
  const trackSearch = useCallback(async (sq) => {
    if (!sq || sq.length < 2) return;
    try {
      await setDoc(doc(db, "searchAnalytics", sq), {
        query: sq, count: increment(1), lastSearched: new Date().toISOString(),
      }, { merge: true });
    } catch { }
  }, []);

  /* ── most searched ── */
  const fetchMostSearchedBooks = useCallback(async () => {
    try {
      const snap = await getDocs(collection(db, "searchAnalytics"));
      const searches = [];
      snap.forEach(d => searches.push({ query: d.data().query, count: d.data().count }));
      searches.sort((a, b) => b.count - a.count);
      const top = searches.slice(0, 10);
      const matched = [];
      for (const s of top) {
        const book = booksData.find(b =>
          b.title?.toLowerCase().includes(s.query) || b.author?.toLowerCase().includes(s.query)
        );
        if (book && !matched.find(m => m.id === book.id)) {
          matched.push({ ...book, image: getThumbnailUrl(book), searchCount: s.count, source: "platform" });
        }
      }
      setMostSearchedBooks(matched);
    } catch { }
  }, []);

  /* ── purchased books ── */
  useEffect(() => {
    const fetch = async () => {
      try {
        const user = auth.currentUser;
        if (!user) return;
        const ud = await getDoc(doc(db, "users", user.uid));
        if (ud.exists()) {
          const pb = ud.data().purchasedBooks || [];
          setPurchasedBookIds(new Set(pb.map(b => b.id)));
        }
      } catch { }
    };
    fetch();
    fetchMostSearchedBooks();
  }, [fetchMostSearchedBooks]);

  /* ══════════════════════════════════════════════════════════════
     CORE SEARCH — weighted, ranked, dual-collection
  ══════════════════════════════════════════════════════════════ */
  useEffect(() => {
    const performSearch = async () => {
      if (!q) {
        setSearchResults([]);
        setUserResults([]);
        setShowMostSearched(true);
        return;
      }

      setShowMostSearched(false);
      setLoading(true);

      // Parse the query into tokens
      const parsed = parseSearchQuery(q);
      setParsedQuery(parsed);
      trackSearch(q);

      try {
        /* ── 1. Platform booksData (client-side, scored) ── */
        const platformResults = booksData
          .filter(b => {
            const searchable = [
              b.title, b.author, b.category, b.courseCode,
              b.university, b.department, b.faculty,
              b.resourceType, b.description, b.subject, b.level,
              ...(b.tags || []),
            ].filter(Boolean).join(" ").toLowerCase();

            // Text match
            const textMatch = searchable.includes(q);

            // Structured token match (higher relevance)
            const tokenMatch = (
              (parsed.tokens.courseCodes?.some(cc => searchable.includes(cc.toLowerCase()))) ||
              (parsed.tokens.institution && searchable.includes(parsed.tokens.institution.toLowerCase())) ||
              (parsed.tokens.documentType && searchable.includes(parsed.tokens.documentType.toLowerCase()))
            );

            return textMatch || tokenMatch;
          })
          .map(b => {
            const scoreFromDb = Number(b.searchScore || 0);
            const clientScore = computeClientScore(b);
            const tokenBoost = (
              (parsed.tokens.courseCodes?.some(cc => b.courseCode?.toLowerCase() === cc.toLowerCase()) ? 200 : 0) +
              (parsed.tokens.institution && b.university?.toLowerCase() === parsed.tokens.institution.toLowerCase() ? 150 : 0) +
              (parsed.tokens.documentType && b.resourceType?.toLowerCase() === parsed.tokens.documentType.toLowerCase() ? 100 : 0)
            );
            return {
              ...b,
              image: getThumbnailUrl(b),
              source: "platform",
              entity_type: "document",
              _finalScore: (scoreFromDb || clientScore) + tokenBoost,
            };
          });

        /* ── 2. Firestore advertMyBook (scored + filtered) ── */
        const firestoreResults = [];
        try {
          // Build query with active filters
          let constraints = [where("status", "==", "approved")];

          // Apply structured token filters
          if (filters.institution || parsed.tokens.institution) {
            constraints.push(where("university", "==", filters.institution || parsed.tokens.institution));
          }
          if (filters.documentType || parsed.tokens.documentType) {
            constraints.push(where("resourceType", "==", filters.documentType || parsed.tokens.documentType));
          }
          if (filters.year || parsed.tokens.year) {
            constraints.push(where("year", "==", filters.year || parsed.tokens.year));
          }
          if (filters.priceMin) constraints.push(where("price", ">=", Number(filters.priceMin)));
          if (filters.priceMax) constraints.push(where("price", "<=", Number(filters.priceMax)));
          if (filters.facultyOnly) constraints.push(where("isFaculty", "==", true));
          if (filters.fullyTaggedOnly) constraints.push(where("isFullyTagged", "==", true));

          // Use pre-calculated searchScore when available (needs composite index)
          const hasFieldFilters = constraints.length > 1;
          if (!hasFieldFilters) {
            // Simple case: orderBy searchScore directly
            constraints.push(orderBy("searchScore", "desc"), limit(80));
          } else {
            // Filtered case: fetch then client-sort (Firestore inequality limit)
            constraints.push(limit(80));
          }

          const snap = await getDocs(query(collection(db, "advertMyBook"), ...constraints));

          snap.forEach(d => {
            const data = d.data();
            const searchable = [
              data.bookTitle, data.author, data.category, data.courseCode,
              data.university, data.department, data.faculty, data.resourceType,
              data.description, data.tags?.join(" "), data.subject, data.level,
            ].filter(Boolean).join(" ").toLowerCase();

            const textMatch = searchable.includes(q);
            const tokenMatch = (
              (parsed.tokens.courseCodes?.some(cc => searchable.includes(cc.toLowerCase()))) ||
              (parsed.tokens.institution && searchable.includes(parsed.tokens.institution.toLowerCase())) ||
              (parsed.tokens.documentType && searchable.includes(parsed.tokens.documentType.toLowerCase()))
            );

            if (!textMatch && !tokenMatch) return;

            const scoreFromDb = Number(data.searchScore || 0);
            const clientScore = computeClientScore(data);
            const tokenBoost = (
              (parsed.tokens.courseCodes?.some(cc => data.courseCode?.toLowerCase() === cc.toLowerCase()) ? 200 : 0) +
              (parsed.tokens.institution && data.university?.toLowerCase() === parsed.tokens.institution.toLowerCase() ? 150 : 0) +
              (parsed.tokens.documentType && data.resourceType?.toLowerCase() === parsed.tokens.documentType.toLowerCase() ? 100 : 0)
            );

            const b = {
              id: `firestore-${d.id}`, firestoreId: d.id,
              title: data.bookTitle, author: data.author, category: data.category,
              price: data.price, pages: data.pages, format: data.format || "PDF",
              description: data.description, driveFileId: data.driveFileId,
              pdfUrl: data.pdfUrl, previewUrl: data.previewUrl, embedUrl: data.embedUrl,
              courseCode: data.courseCode || "", university: data.university || "",
              department: data.department || "", faculty: data.faculty || "",
              resourceType: data.resourceType || "", subject: data.subject || "",
              level: data.level || "", tags: data.tags || [],
              isFaculty: data.isFaculty || false, isFullyTagged: data.isFullyTagged || false,
              averageRating: data.averageRating || data.average_rating || 0,
              totalReviewCount: data.totalReviewCount || data.total_review_count || 0,
              salesCount: data.salesCount || data.sales_count || 0,
              isFromFirestore: true, source: "firestore", entity_type: "document",
              _finalScore: (scoreFromDb || clientScore) + tokenBoost,
            };
            b.image = getThumbnailUrl(b);
            firestoreResults.push(b);
          });
        } catch (err) {
          console.warn("Firestore advertMyBook query error:", err);
        }

        /* ── 3. User / Seller profile search ── */
        const userMatches = [];
        if (parsed.isPersonSearch || parsed.tokens.personSurname) {
          const searchName = (parsed.tokens.personSurname || q).toLowerCase();
          try {
            // Search sellers collection
            const sellersSnap = await getDocs(
              query(
                collection(db, "sellers"),
                where("status", "in", ["active", "verified"]),
                limit(5)
              )
            );
            sellersSnap.forEach(d => {
              const data = d.data();
              const nameMatch = (
                data.displayName?.toLowerCase().includes(searchName) ||
                data.name?.toLowerCase().includes(searchName) ||
                data.firstName?.toLowerCase().includes(searchName) ||
                data.lastName?.toLowerCase().includes(searchName)
              );
              if (nameMatch) {
                userMatches.push({
                  ...data,
                  uid: d.id,
                  entity_type: "user",
                  source: "sellers",
                });
              }
            });

            // Also search users collection
            const usersSnap = await getDocs(
              query(
                collection(db, "users"),
                where("role", "in", ["seller", "faculty", "Verified Faculty", "lecturer"]),
                limit(20)
              )
            );
            usersSnap.forEach(d => {
              const data = d.data();
              const nameMatch = (
                data.displayName?.toLowerCase().includes(searchName) ||
                data.name?.toLowerCase().includes(searchName)
              );
              if (nameMatch && !userMatches.find(u => u.uid === d.id)) {
                userMatches.push({
                  ...data,
                  uid: d.id,
                  entity_type: "user",
                  source: "users",
                });
              }
            });
          } catch (err) {
            console.warn("User search error:", err);
          }
        }

        /* ── 4. Merge + sort all document results ── */
        const allDocs = [...platformResults, ...firestoreResults];

        // Deduplicate by title+author similarity
        const seen = new Set();
        const deduped = allDocs.filter(b => {
          const key = `${b.title?.toLowerCase().replace(/\s+/g, "")}-${b.author?.toLowerCase().replace(/\s+/g, "")}`;
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });

        // Sort: purchased first, then by _finalScore desc
        deduped.sort((a, b) => {
          const aPurchased = purchasedBookIds.has(a.id) ? 1 : 0;
          const bPurchased = purchasedBookIds.has(b.id) ? 1 : 0;
          if (bPurchased !== aPurchased) return bPurchased - aPurchased;
          return (b._finalScore || 0) - (a._finalScore || 0);
        });

        setSearchResults(deduped);
        setUserResults(userMatches);
      } catch (err) {
        console.error("Search error:", err);
        setSearchResults(
          booksData
            .filter(b => b.title?.toLowerCase().includes(q) || b.author?.toLowerCase().includes(q))
            .map(b => ({ ...b, image: getThumbnailUrl(b), source: "platform", entity_type: "document" }))
        );
      } finally {
        setLoading(false);
      }
    };

    performSearch();
  }, [q, filters, trackSearch]);

  const isPurchased = id => purchasedBookIds.has(id);

  const activeFilterCount = Object.values(filters).filter(v => v !== "" && v !== false).length;

  /* ── Ad card ── */
  const SearchAdCard = ({ ad, tier }) => {
    const handleClick = async () => {
      const id = ad.adId || ad.id;
      if (id) {
        try { await updateDoc(doc(db, "promotions", id), { clicks: increment(1) }); } catch { }
      }
      if (ad.adLink) window.open(ad.adLink, "_blank");
    };
    const accentColor = tier === "Gold" ? GOLD : "#aaa";
    const imgSrc = ad.image || ad.imageUrl || ad.coverImage || null;
    return (
      <div onClick={handleClick} style={{ flexShrink: 0, width: 160, cursor: "pointer" }}>
        <div style={{ position: "relative", background: "#ede8df", overflow: "hidden", marginBottom: 8 }}>
          {imgSrc
            ? <img src={imgSrc} alt={ad.title || "Ad"}
              style={{ width: "100%", aspectRatio: "3/4", objectFit: "cover", display: "block" }}
              onError={e => e.target.style.display = "none"} />
            : <div style={{ width: "100%", aspectRatio: "3/4", background: "#ddd", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: "#aaa" }}>No image</div>
          }
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, background: "rgba(13,34,68,.8)", padding: "4px 8px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: 7, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: accentColor, fontFamily: "'Lato',sans-serif" }}>Featured · {tier}</span>
            <span style={{ fontSize: 7, fontWeight: 700, background: accentColor, color: NAVY, padding: "1px 5px", fontFamily: "'Lato',sans-serif" }}>AD</span>
          </div>
          <div style={{ position: "absolute", bottom: 6, left: 6, background: NAVY, padding: "2px 7px", fontSize: 7, fontWeight: 700, color: "#fff", fontFamily: "'Lato',sans-serif", letterSpacing: ".08em", display: "flex", alignItems: "center", gap: 3 }}>
            <span style={{ width: 4, height: 4, borderRadius: "50%", background: "#22c55e" }} />PDF
          </div>
        </div>
        <h4 style={{ fontFamily: "'Playfair Display',serif", fontSize: 12, fontWeight: 700, color: NAVY, margin: "0 0 3px", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", lineHeight: 1.3 }}>{ad.title || "Sponsored"}</h4>
        <p style={{ fontSize: 10, color: "#888", margin: 0, fontFamily: "'Lato',sans-serif", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ad.author || ad.sponsor || ""}</p>
      </div>
    );
  };

  /* ── Book Card ── */
  const BookCard = ({ book, showTrending = false }) => {
    const owned = isPurchased(book.id);
    return (
      <Link href={`/book/preview?id=${String(book.id).replace("firestore-", "")}`} style={{ textDecoration: "none", display: "block" }}>
        <div style={{ position: "relative", background: "#ede8df", overflow: "hidden" }}>
          <img
            src={getThumbnailUrl(book)}
            alt={book.title}
            style={{ width: "100%", aspectRatio: "3/4", objectFit: "cover", display: "block", transition: "transform 0.5s cubic-bezier(0.4,0,0.2,1)" }}
            className="book-thumb-img"
            onError={e => { e.target.style.display = "none"; }}
          />
          {/* Faculty badge */}
          {book.isFaculty && (
            <div style={{ position: "absolute", top: "8px", right: "8px", background: GOLD, color: NAVY, fontSize: "8px", fontWeight: 700, padding: "2px 6px", fontFamily: "'Lato',sans-serif", display: "flex", alignItems: "center", gap: "3px" }}>
              <ShieldCheck size={8} /> FACULTY
            </div>
          )}
          {/* PDF badge */}
          <div style={{ position: "absolute", top: book.isFaculty ? "28px" : "8px", left: "8px", display: "inline-flex", alignItems: "center", gap: "4px", background: NAVY, padding: "3px 8px", fontSize: "9px", fontWeight: 700, letterSpacing: "0.06em", color: "#fff", fontFamily: "'Lato', sans-serif" }}>
            <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: "#22c55e", display: "inline-block" }} /> PDF
          </div>
          {owned && (
            <span style={{ position: "absolute", bottom: "8px", right: "8px", background: "#15803d", color: "#fff", fontSize: "9px", fontWeight: 700, padding: "3px 8px", fontFamily: "'Lato', sans-serif" }}>OWNED</span>
          )}
          {showTrending && book.searchCount && (
            <div style={{ position: "absolute", bottom: "8px", left: "8px", display: "inline-flex", alignItems: "center", gap: "4px", background: "#ea580c", padding: "3px 8px", fontSize: "9px", fontWeight: 700, color: "#fff", fontFamily: "'Lato', sans-serif" }}>
              <TrendingUp size={10} /> {book.searchCount}
            </div>
          )}
        </div>
        <div style={{ padding: "10px 10px 12px", borderTop: "0.5px solid #f0ebe0", background: "#fff" }}>
          <h4 style={{ fontFamily: "'Playfair Display', serif", fontSize: "13px", fontWeight: 700, color: NAVY, margin: "0 0 3px", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", lineHeight: 1.35 }}>
            {book.title}
          </h4>
          <p style={{ fontSize: "11px", color: "#888", margin: "0 0 4px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontFamily: "'Lato', sans-serif" }}>
            {book.author}
          </p>
          {/* Rating */}
          {book.averageRating > 0 && (
            <div style={{ marginBottom: "4px" }}>
              <StarRating rating={book.averageRating} count={book.totalReviewCount} />
            </div>
          )}
          {/* Meta tags */}
          {(book.university || book.courseCode) && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", marginBottom: "5px" }}>
              {book.courseCode && (
                <span style={{ fontSize: "9px", fontWeight: 700, background: "rgba(13,34,68,0.08)", color: NAVY, padding: "2px 6px", letterSpacing: "0.06em", fontFamily: "'Lato',sans-serif" }}>
                  {book.courseCode}
                </span>
              )}
              {book.university && (
                <span style={{ fontSize: "9px", color: "#aaa", fontFamily: "'Lato',sans-serif", padding: "2px 0" }}>
                  {book.university}
                </span>
              )}
            </div>
          )}
          {book.resourceType && (
            <span style={{ fontSize: "9px", fontWeight: 700, color: GOLD, letterSpacing: "0.08em", textTransform: "uppercase", fontFamily: "'Lato',sans-serif", display: "block", marginBottom: "4px" }}>
              {book.resourceType}
            </span>
          )}
          {book.price && (
            <p style={{ fontSize: "12px", fontWeight: 700, color: NAVY, margin: 0, fontFamily: "'Lato', sans-serif" }}>
              ₦{Number(book.price).toLocaleString()}
            </p>
          )}
          {/* Fully-tagged indicator */}
          {book.isFullyTagged && (
            <div style={{ marginTop: "4px", fontSize: "8px", color: "#22c55e", fontFamily: "'Lato',sans-serif", fontWeight: 700, letterSpacing: ".06em" }}>
              ✓ COMPLETE METADATA
            </div>
          )}
        </div>
      </Link>
    );
  };

  /* ── Book section (grid + optional carousel on mobile) ── */
  const BookSection = ({ title, books, showTrending = false, count }) => (
    <div style={{ marginBottom: "48px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
        <div style={{ width: "4px", height: "28px", background: GOLD }} />
        <div>
          <p style={{ fontSize: "9px", fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: GOLD, margin: "0 0 2px", fontFamily: "'Lato', sans-serif" }}>
            {showTrending ? "Most Popular" : "Results"}
          </p>
          <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: "22px", fontWeight: 700, color: NAVY, margin: 0 }}>
            {title}
            {count !== undefined && (
              <span style={{ fontSize: "14px", fontWeight: 400, color: "#bbb", marginLeft: "8px", fontFamily: "'Lato', sans-serif" }}>({count})</span>
            )}
          </h3>
        </div>
      </div>

      {/* Mobile carousel */}
      <div className="lg:hidden">
        {chunkArray(books, 5).map((row, ri) => (
          <div key={ri} style={{ overflowX: "auto", paddingBottom: "12px", marginBottom: "8px" }} className="sbar-none">
            <div style={{ display: "flex", gap: "10px", minWidth: "max-content" }}>
              {row.map(book => (
                <div key={book.id} style={{ flexShrink: 0, width: "150px" }}>
                  <BookCard book={book} showTrending={showTrending} />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Desktop grid */}
      <div className="lg-grid-override" style={{ display: "none" }}>
        {books.map(book => <BookCard key={book.id} book={book} showTrending={showTrending} />)}
      </div>
    </div>
  );

  /* ─────────────────────── RENDER ─────────────────────────── */
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400&family=Lato:wght@300;400;700&display=swap');
        .search-root { font-family: 'Lato', sans-serif; background: ${BG}; min-height: 100vh; }
        .sbar-none { scrollbar-width: none; -ms-overflow-style: none; }
        .sbar-none::-webkit-scrollbar { display: none; }
        .book-thumb-img { transition: transform 0.5s cubic-bezier(0.4,0,0.2,1); }
        .book-thumb-wrapper:hover .book-thumb-img { transform: scale(1.06); }
        @media (min-width: 1024px) {
          .lg-grid-override { display: grid !important; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 16px; }
          .lg\\:hidden { display: none !important; }
        }
        .spinner { width: 36px; height: 36px; border: 2px solid rgba(13,34,68,0.1); border-top-color: ${GOLD}; border-radius: 50%; animation: spin 0.7s linear infinite; margin: 0 auto; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .search-book-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
        @media (min-width: 480px)  { .search-book-grid { grid-template-columns: repeat(3, 1fr); } }
        @media (min-width: 768px)  { .search-book-grid { grid-template-columns: repeat(4, 1fr); gap: 16px; } }
        @media (min-width: 1024px) { .search-book-grid { grid-template-columns: repeat(5, 1fr); } }
        .user-results-grid { display: grid; grid-template-columns: 1fr; gap: 12px; }
        @media (min-width: 640px)  { .user-results-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (min-width: 1024px) { .user-results-grid { grid-template-columns: repeat(3, 1fr); } }
      `}</style>

      <div className="search-root">
        <Navbar />

        {/* ── Search Hero ── */}
        <div style={{
          background: NAVY,
          backgroundImage: "radial-gradient(rgba(184,150,62,0.06) 1px, transparent 1px)",
          backgroundSize: "22px 22px",
          padding: "48px 24px 36px",
        }}>
          <div style={{ maxWidth: "900px", margin: "0 auto" }}>
            {q ? (
              <>
                <p style={{ fontSize: "9px", fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(184,150,62,0.7)", marginBottom: "10px", fontFamily: "'Lato', sans-serif" }}>
                  Search Results
                </p>
                <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(28px, 5vw, 46px)", fontWeight: 700, color: "#fff", margin: "0 0 12px", lineHeight: 1.08 }}>
                  Results for <span style={{ color: GOLD, fontStyle: "italic" }}>"{q}"</span>
                </h1>
                {!loading && (
                  <div style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
                    <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.5)", margin: 0, fontWeight: 300 }}>
                      {searchResults.length} document{searchResults.length !== 1 ? "s" : ""}
                      {userResults.length > 0 && ` · ${userResults.length} profile${userResults.length !== 1 ? "s" : ""}`}
                      {" "}found
                    </p>

                    {/* Parsed token chips */}
                    {parsedQuery?.hasStructuredTokens && (
                      <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                        {parsedQuery.tokens.courseCodes?.map(cc => (
                          <span key={cc} style={{ fontSize: "9px", fontWeight: 700, letterSpacing: ".1em", background: "rgba(184,150,62,.15)", color: GOLD, border: "1px solid rgba(184,150,62,.3)", padding: "3px 10px", fontFamily: "'Lato',sans-serif" }}>
                            {cc}
                          </span>
                        ))}
                        {parsedQuery.tokens.institution && (
                          <span style={{ fontSize: "9px", fontWeight: 700, letterSpacing: ".1em", background: "rgba(255,255,255,.08)", color: "rgba(255,255,255,.6)", border: "1px solid rgba(255,255,255,.12)", padding: "3px 10px", fontFamily: "'Lato',sans-serif" }}>
                            {parsedQuery.tokens.institutionAbbr || parsedQuery.tokens.institution}
                          </span>
                        )}
                        {parsedQuery.tokens.documentType && (
                          <span style={{ fontSize: "9px", fontWeight: 700, letterSpacing: ".1em", background: "rgba(255,255,255,.08)", color: "rgba(255,255,255,.6)", border: "1px solid rgba(255,255,255,.12)", padding: "3px 10px", fontFamily: "'Lato',sans-serif" }}>
                            {parsedQuery.tokens.documentType}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </>
            ) : (
              <>
                <p style={{ fontSize: "9px", fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(184,150,62,0.7)", marginBottom: "10px", fontFamily: "'Lato', sans-serif" }}>Trending</p>
                <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(28px, 5vw, 46px)", fontWeight: 700, color: "#fff", margin: "0 0 8px", lineHeight: 1.08 }}>
                  Most Searched <span style={{ color: GOLD, fontStyle: "italic" }}>Documents</span>
                </h1>
                <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.5)", margin: 0, fontWeight: 300 }}>
                  What students across Africa are looking for
                </p>
              </>
            )}
          </div>
        </div>

        {/* ── Filter bar ── */}
        {q && (
          <div style={{ background: CREAM, borderBottom: "0.5px solid #e5ddd0", padding: "12px 24px" }}>
            <div style={{ maxWidth: "1200px", margin: "0 auto", display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
              <button
                onClick={() => setShowFilterPanel(true)}
                style={{
                  display: "inline-flex", alignItems: "center", gap: "6px",
                  padding: "8px 16px", background: activeFilterCount > 0 ? NAVY : "#fff",
                  color: activeFilterCount > 0 ? "#fff" : "#666",
                  border: `1px solid ${activeFilterCount > 0 ? NAVY : "#e5ddd0"}`,
                  fontFamily: "'Lato',sans-serif", fontSize: "11px", fontWeight: 700,
                  letterSpacing: ".08em", textTransform: "uppercase", cursor: "pointer",
                  transition: "all .15s",
                }}
              >
                <SlidersHorizontal size={13} />
                Filters {activeFilterCount > 0 && `(${activeFilterCount})`}
              </button>

              {/* Active filter chips */}
              {activeFilterCount > 0 && (
                <>
                  {Object.entries(filters).filter(([, v]) => v !== "" && v !== false).map(([k, v]) => (
                    <span key={k} style={{
                      display: "inline-flex", alignItems: "center", gap: "6px",
                      padding: "5px 10px", background: "#fff", border: "0.5px solid #e5ddd0",
                      fontSize: "10px", fontWeight: 700, color: NAVY, fontFamily: "'Lato',sans-serif",
                    }}>
                      {String(v === true ? k : v)}
                      <X size={10} style={{ cursor: "pointer", color: "#aaa" }}
                        onClick={() => setFilters(prev => ({ ...prev, [k]: typeof prev[k] === "boolean" ? false : "" }))}
                      />
                    </span>
                  ))}
                  <button
                    onClick={() => setFilters({ institution: "", year: "", documentType: "", priceMin: "", priceMax: "", facultyOnly: false, fullyTaggedOnly: false })}
                    style={{ fontSize: "10px", fontWeight: 700, color: "#aaa", background: "none", border: "none", cursor: "pointer", fontFamily: "'Lato',sans-serif", textDecoration: "underline" }}
                  >
                    Clear all
                  </button>
                </>
              )}

              <span style={{ marginLeft: "auto", fontSize: "10px", color: "#aaa", fontFamily: "'Lato',sans-serif" }}>
                {!loading && `${searchResults.length + userResults.length} result${searchResults.length + userResults.length !== 1 ? "s" : ""}`}
              </span>
            </div>
          </div>
        )}

        {/* ── Ads ── */}
        <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "24px 24px 0" }}>
          {goldAds.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <p style={{ fontSize: 8, fontWeight: 700, letterSpacing: ".18em", textTransform: "uppercase", color: GOLD, fontFamily: "'Lato',sans-serif", margin: "0 0 6px" }}>Featured · Gold</p>
              <p style={{ fontSize: 20, fontWeight: 700, color: NAVY, fontFamily: "'Playfair Display', serif", margin: "0 0 10px" }}>Recommended for You</p>
              <div className="sbar-none" style={{ display: "flex", gap: 16, overflowX: "auto", paddingBottom: 8 }}>
                {goldAds.map(ad => <SearchAdCard key={ad.adId} ad={ad} tier="Gold" />)}
              </div>
            </div>
          )}
          {silverAds.length > 0 && (
            <div style={{ marginBottom: 8 }}>
              <p style={{ fontSize: 8, fontWeight: 700, letterSpacing: ".18em", textTransform: "uppercase", color: "#aaa", fontFamily: "'Lato',sans-serif", margin: "0 0 10px" }}>Featured · Silver</p>
              <div className="sbar-none" style={{ display: "flex", gap: 16, overflowX: "auto", paddingBottom: 8 }}>
                {silverAds.map(ad => <SearchAdCard key={ad.adId} ad={ad} tier="Silver" />)}
              </div>
            </div>
          )}
        </div>

        <hr style={{ color: "#ddd", margin: 0 }} />

        {/* ── Main content ── */}
        <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "48px 24px" }}>

          {/* Loading */}
          {loading && (
            <div style={{ textAlign: "center", padding: "80px 24px" }}>
              <div className="spinner" />
              <p style={{ fontSize: "12px", color: "#bbb", marginTop: "16px", fontWeight: 300 }}>Searching documents…</p>
            </div>
          )}

          {/* Most searched */}
          {!loading && showMostSearched && (
            mostSearchedBooks.length === 0 ? (
              <div style={{ textAlign: "center", padding: "80px 24px" }}>
                <div style={{ width: "64px", height: "64px", border: "0.5px solid #e5ddd0", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
                  <Search size={28} style={{ color: "#ccc" }} />
                </div>
                <p style={{ fontFamily: "'Playfair Display', serif", fontSize: "20px", color: NAVY, margin: "0 0 6px" }}>No search data yet</p>
                <p style={{ fontSize: "12px", color: "#bbb" }}>Be the first to search for something!</p>
              </div>
            ) : (
              <BookSection title="Most Searched Documents" books={mostSearchedBooks} showTrending count={mostSearchedBooks.length} />
            )
          )}

          {/* No results */}
          {!loading && !showMostSearched && searchResults.length === 0 && userResults.length === 0 && (
            <div style={{ textAlign: "center", padding: "80px 24px" }}>
              <div style={{ width: "64px", height: "64px", border: "0.5px solid #e5ddd0", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
                <FileText size={28} style={{ color: "#ccc" }} />
              </div>
              <p style={{ fontFamily: "'Playfair Display', serif", fontSize: "22px", color: NAVY, margin: "0 0 8px" }}>No results found</p>
              <p style={{ fontSize: "13px", color: "#bbb", marginBottom: "24px", fontWeight: 300 }}>
                No documents or profiles matched "{q}". Try a different search term or adjust your filters.
              </p>
              {activeFilterCount > 0 && (
                <button
                  onClick={() => setFilters({ institution: "", year: "", documentType: "", priceMin: "", priceMax: "", facultyOnly: false, fullyTaggedOnly: false })}
                  style={{ padding: "12px 24px", background: GOLD, color: NAVY, border: "none", cursor: "pointer", fontFamily: "'Lato',sans-serif", fontSize: "12px", fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", marginBottom: "12px" }}
                >
                  Clear Filters
                </button>
              )}
              <Link href="/home" style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "12px 24px", background: NAVY, color: "#fff", fontSize: "12px", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", textDecoration: "none", fontFamily: "'Lato', sans-serif", marginLeft: "8px" }}>
                ← Back to Home
              </Link>
            </div>
          )}

          {/* Results */}
          {!loading && !showMostSearched && (searchResults.length > 0 || userResults.length > 0) && (() => {
            const purchased = searchResults.filter(b => isPurchased(b.id));
            const unpurchased = searchResults.filter(b => !isPurchased(b.id));

            // Group unpurchased by resourceType
            const groups = {};
            unpurchased.forEach(b => {
              const key = b.resourceType || b.category || "Other Documents";
              if (!groups[key]) groups[key] = [];
              groups[key].push(b);
            });

            return (
              <>
                {/* ── User Profile Cards (person search) ── */}
                {userResults.length > 0 && (
                  <div style={{ marginBottom: "48px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
                      <div style={{ width: "4px", height: "28px", background: GOLD }} />
                      <div>
                        <p style={{ fontSize: "9px", fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: GOLD, margin: "0 0 2px", fontFamily: "'Lato', sans-serif" }}>Sellers & Faculty</p>
                        <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: "22px", fontWeight: 700, color: NAVY, margin: 0 }}>
                          Profiles Found
                          <span style={{ fontSize: "14px", fontWeight: 400, color: "#bbb", marginLeft: "8px", fontFamily: "'Lato', sans-serif" }}>({userResults.length})</span>
                        </h3>
                      </div>
                    </div>
                    <div className="user-results-grid">
                      {userResults.map(user => (
                        <UserProfileCard key={user.uid || user.id} user={user} />
                      ))}
                    </div>
                  </div>
                )}

                {/* ── Purchased docs ── */}
                {purchased.length > 0 && (
                  <BookSection title="Your Purchased Documents" books={purchased} count={purchased.length} />
                )}

                {/* ── Grouped unpurchased docs ── */}
                {Object.entries(groups).map(([type, books]) => (
                  <BookSection key={type} title={type} books={books} count={books.length} />
                ))}
              </>
            );
          })()}
        </div>

        {/* Ad carousel footer */}
        <section style={{ padding: "0 0 32px" }}>
          <FeaturedAdsCarousel tier="Gold" maxAds={5} autoPlay />
        </section>
      </div>

      {/* Filter panel */}
      {showFilterPanel && (
        <FilterPanel
          filters={filters}
          onChange={setFilters}
          onClose={() => setShowFilterPanel(false)}
          resultCount={searchResults.length}
        />
      )}
    </>
  );
}