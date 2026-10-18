"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import {
  collection, query, where, getDocs, getDoc, doc, setDoc, updateDoc,
  increment, orderBy, limit,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "@/lib/firebaseConfig";
import { booksData } from "@/lib/booksData";
import { X, Search, SlidersHorizontal, ShieldCheck, TrendingUp, FileText } from "lucide-react";
import Link from "next/link";
import Navbar from "@/components/NavBar";
import FeaturedAdsCarousel from "@/components/FeaturedAdsCarousel";
import { useAds } from "@/lib/useAds";
import { paidVerificationActive } from "@/components/seller/Verification";
import {
  norm, fromFirestore, fromPlatform, buildIndex, buildProfileIndex, parseQuery,
  queryHints, searchBooks, searchProfiles, orderByTrust, trustTier, uniShort,
  intentKey, INTENT_LABEL,
} from "@/lib/searchEngine";

/* ─── design tokens (same navy / gold / cream as the rest of LAN) ─── */
const NAVY = "#0d2244";
const GOLD = "#b8963e";
const CREAM = "#f5f0e8";
const BG = "#f5f1ea";
const LINE = "#e5ddd0";
const TTL = 10 * 60 * 1000;

const uniq = (a) => [...new Set(a)];

/* ═══════════════════════════════════════════════════════════
   DATA LOADERS (cached in memory for 10 minutes)
═══════════════════════════════════════════════════════════ */
let BOOKS = null;
let BOOKS_P = null;

/** Every approved document, plus the built-in platform books, indexed for search */
async function loadBooks() {
  if (BOOKS && Date.now() - BOOKS.at < TTL) return BOOKS;
  if (BOOKS_P) return BOOKS_P;
  BOOKS_P = (async () => {
    const live = [];
    try {
      const snap = await getDocs(
        query(collection(db, "advertMyBook"), where("status", "==", "approved"), limit(1500))
      );
      snap.forEach((d) => live.push(fromFirestore(d.id, d.data())));
    } catch (e) {
      console.warn("[search] could not load the library:", e);
    }
    const liveKeys = new Set(live.map((b) => `${norm(b.title)}|${norm(b.author)}`));
    const platform = (booksData || [])
      .map((b) => { try { return fromPlatform(b); } catch { return null; } })
      .filter((b) => b && !liveKeys.has(`${norm(b.title)}|${norm(b.author)}`));
    const list = [...live, ...platform];
    const bySeller = new Map();
    live.forEach((b) => b.sellerId && bySeller.set(b.sellerId, (bySeller.get(b.sellerId) || 0) + 1));
    BOOKS = { at: Date.now(), list, index: buildIndex(list), bySeller };
    return BOOKS;
  })().finally(() => { BOOKS_P = null; });
  return BOOKS_P;
}

let SELLERS = null;
let SELLERS_P = null;

/** Slim seller list (no photos, no balances) used for people search and trust flags */
async function loadSellers() {
  if (SELLERS && Date.now() - SELLERS.at < TTL) return SELLERS;
  if (SELLERS_P) return SELLERS_P;
  SELLERS_P = (async () => {
    const list = [];
    try {
      const snap = await getDocs(query(collection(db, "sellers"), limit(500)));
      snap.forEach((d) => {
        if (d.id === "LAN_LIBRARY_PLATFORM") return;
        const s = d.data();
        let verified = false;
        try { verified = !!paidVerificationActive({ id: d.id, ...s }); }
        catch { verified = s.isVerifiedSeller === true; }
        list.push({
          uid: d.id,
          name: s.sellerName || s.businessInfo?.businessName || "",
          title: s.sellerTitle || s.title || "",
          slug: s.slug || "",
          university: s.university || "",
          department: s.department || "",
          business: s.businessInfo?.businessName || "",
          state: s.businessInfo?.state || "",
          booksSold: s.booksSold || 0,
          photo: /^https?:/.test(s.photoURL || "") ? s.photoURL : "",
          verified,
          faculty: s.isLecturer === true || s.role === "lecturer" || s.role === "faculty",
        });
      });
    } catch (e) {
      console.warn("[search] could not load sellers:", e);
    }
    SELLERS = { at: Date.now(), list, index: buildProfileIndex(list) };
    return SELLERS;
  })().finally(() => { SELLERS_P = null; });
  return SELLERS_P;
}

const USERS = new Map();
async function loadUser(uid) {
  if (USERS.has(uid)) return USERS.get(uid);
  let data = null;
  try {
    const snap = await getDoc(doc(db, "users", uid));
    data = snap.exists() ? snap.data() : null;
  } catch { /* user doc not readable */ }
  USERS.set(uid, data);
  return data;
}

const facultyApproved = (u) =>
  !!u && (u.lecturerVerificationStatus === "approved" || u.isVerifiedFaculty === true);

/** uid -> { verified, faculty } for the sellers behind the best matches */
async function loadTrust(ids) {
  const { list } = await loadSellers();
  const byId = new Map(list.map((s) => [s.uid, s]));
  const out = new Map();
  await Promise.all(
    ids.map(async (id) => {
      const s = byId.get(id);
      const u = await loadUser(id);
      out.set(id, {
        verified: s ? s.verified : u?.isVerifiedSeller === true,
        faculty: !!(s?.faculty || facultyApproved(u)),
      });
    })
  );
  return out;
}

/** Profiles whose name matches the query. Only real sellers are returned. */
async function findProfiles(pq, bySeller) {
  const { index } = await loadSellers();
  const hits = searchProfiles(index, pq).slice(0, 12);
  const people = (
    await Promise.all(
      hits.map(async (h) => {
        const p = h.item.profile;
        const u = await loadUser(p.uid);
        if (!u || u.isSeller !== true) return null;
        const faculty = !!(p.faculty || facultyApproved(u));
        const verified = p.verified;
        return {
          ...p,
          name: p.name || u.displayName || [u.firstName, u.surname].filter(Boolean).join(" "),
          title: p.title || u.lecturerTitle || "",
          faculty,
          verified,
          tier: trustTier({ faculty, verified }),
          score: h.score,
          photo: u.photoURL || u.photoBase64 || p.photo || "",
          bio: u.bio || "",
          institution: u.institution || u.university || u.selectedUniversity || p.university || "",
          docs: bySeller.get(p.uid) || 0,
        };
      })
    )
  ).filter(Boolean);
  people.sort((a, b) => b.tier - a.tier || b.score - a.score);
  return people.slice(0, 6);
}

/** Most searched: top queries from searchAnalytics, resolved to their best document */
async function loadPopular() {
  const lib = await loadBooks();
  const out = [];
  const seen = new Set();
  try {
    const snap = await getDocs(query(collection(db, "searchAnalytics"), orderBy("count", "desc"), limit(12)));
    for (const d of snap.docs) {
      const x = d.data();
      const hit = x.query ? searchBooks(lib.index, parseQuery(x.query), false)[0] : null;
      if (hit && !seen.has(hit.item.book.id)) {
        seen.add(hit.item.book.id);
        out.push({ book: hit.item.book, tier: 0, trending: x.count });
      }
    }
  } catch { /* analytics not readable yet */ }
  if (!out.length) {
    lib.list
      .slice()
      .sort((a, b) => (b.salesCount * 5 + b.views + b.searchScore) - (a.salesCount * 5 + a.views + a.searchScore))
      .slice(0, 15)
      .forEach((b) => out.push({ book: b, tier: 0 }));
  }
  return out;
}

const track = async (n) => {
  try {
    const id = n.replace(/\s+/g, "-").slice(0, 60);
    if (id.length < 3) return;
    await setDoc(
      doc(db, "searchAnalytics", id),
      { query: n.slice(0, 80), count: increment(1), lastSearched: new Date().toISOString() },
      { merge: true }
    );
  } catch { /* analytics rules not published yet */ }
};

/* ═══════════════════════════════════════════════════════════
   SMALL HELPERS
═══════════════════════════════════════════════════════════ */

/** Cover image URL, or "" when there is none (the card then shows its own placeholder) */
function thumb(b) {
  if (b.image) return b.image;
  if (b.driveFileId) return `https://drive.google.com/thumbnail?id=${b.driveFileId}&sz=w400`;
  if (b.embedUrl) {
    const m = b.embedUrl.match(/\/d\/(.*?)\/|\/file\/d\/(.*?)\/|id=(.*?)(&|$)/);
    const id = m && (m[1] || m[2] || m[3]);
    if (id) return `https://drive.google.com/thumbnail?id=${id}&sz=w400`;
  }
  if (b.pdfUrl?.includes("drive.google.com")) {
    const m = b.pdfUrl.match(/[-\w]{25,}/);
    if (m) return `https://drive.google.com/thumbnail?id=${m[0]}&sz=w400`;
  }
  return "";
}

/** One useful detail line for every kind of document, so no card is ever empty */
function typeMeta(b) {
  const uni = uniShort(b.university);
  const yr = (String(b.session || "").match(/\d{4}/) || [""])[0];
  const lvl = /^\d{3}$/.test(norm(b.level)) ? `${norm(b.level)}L` : "";
  const t = norm(`${b.docType} ${b.category}`);

  let parts;
  if (/past question|exam|jamb|waec|neco|utme/.test(t)) {
    parts = [b.courseCode, b.examBody, uni, yr, lvl];
  } else if (b.intent === "divinity" || /divinity|theolog|religion|sermon/.test(t)) {
    parts = [b.theologicalCategory, b.doctrine, b.author];
  } else if (/novel|fiction|literature|poem|play/.test(t)) {
    parts = [b.genre, b.author];
  } else if (/note|handout|textbook|project|thesis|tutorial|lab|slide/.test(t)) {
    parts = [b.courseCode, uni, b.author, b.department];
  } else {
    parts = [b.courseCode, b.author, uni, b.subject, b.department];
  }
  parts.push(b.author, b.sellerName, b.category);

  const out = [];
  parts.forEach((p) => { if (p && !out.includes(p)) out.push(p); });
  return out.slice(0, 2).join(" · ") || "Document";
}

const makeSlug = (title, first, last) =>
  [title, first, last].filter(Boolean).join(" ").trim().toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-");

const profileHref = (p) => {
  if (p.slug) return `/profile/${p.slug}`;
  const parts = (p.name || "").trim().split(/\s+/);
  const slug = makeSlug(p.title, parts[0], parts.slice(1).join(" "));
  return slug ? `/profile/${slug}` : `/seller-profile?sellerId=${p.uid}`;
};

const EMPTY = {
  uni: "", type: "", dept: "", level: "", intent: "", session: "",
  freeOnly: false, trustedOnly: false, priceMin: "", priceMax: "",
};
const countActive = (f) => Object.values(f).filter((v) => v !== "" && v !== false).length;

function applyFilters(rows, f) {
  const min = f.priceMin !== "" ? Number(f.priceMin) : null;
  const max = f.priceMax !== "" ? Number(f.priceMax) : null;
  return rows.filter((r) => {
    const b = r.book;
    if (f.uni && r.uniKey !== f.uni) return false;
    if (f.type && b.docType !== f.type) return false;
    if (f.dept && b.department !== f.dept) return false;
    if (f.level && norm(b.level) !== f.level) return false;
    if (f.intent && intentKey(b.intent) !== f.intent) return false;
    if (f.session && !String(b.session || "").includes(f.session)) return false;
    if (f.freeOnly && !b.isFree) return false;
    if (f.trustedOnly && !r.tier) return false;
    if (min !== null && b.price < min) return false;
    if (max !== null && b.price > max) return false;
    return true;
  });
}

function sortRows(rows, sort) {
  if (sort === "relevance") return rows;
  const by = {
    newest: (a, b) => b.book.createdMs - a.book.createdMs,
    price_low: (a, b) => a.book.price - b.book.price,
    price_high: (a, b) => b.book.price - a.book.price,
    rating: (a, b) => b.book.averageRating - a.book.averageRating || b.book.totalReviewCount - a.book.totalReviewCount,
    popular: (a, b) => (b.book.salesCount * 5 + b.book.views) - (a.book.salesCount * 5 + a.book.views),
  }[sort];
  return by ? rows.slice().sort(by) : rows;
}

function buildFacets(rows) {
  const tally = (get) => {
    const m = new Map();
    rows.forEach((r) => { const v = get(r); if (v) m.set(v, (m.get(v) || 0) + 1); });
    return [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, 14);
  };
  return {
    uni: tally((r) => r.uniKey),
    type: tally((r) => r.book.docType),
    dept: tally((r) => r.book.department),
    level: tally((r) => norm(r.book.level)),
    intent: tally((r) => intentKey(r.book.intent)),
    session: tally((r) => (String(r.book.session || "").match(/\d{4}/) || [""])[0]),
  };
}

const levelLabel = (l) => (/^\d{3}$/.test(l) ? `${l} Level` : l === "pg" ? "Postgraduate" : l.toUpperCase());

const SORTS = [
  ["relevance", "Best match"],
  ["newest", "Newest"],
  ["popular", "Most purchased"],
  ["rating", "Top rated"],
  ["price_low", "Price: low to high"],
  ["price_high", "Price: high to low"],
];

/* ═══════════════════════════════════════════════════════════
   COMPONENTS
═══════════════════════════════════════════════════════════ */
function SearchAdCard({ ad, tier }) {
  const click = async () => {
    const id = ad.adId || ad.id;
    if (id) {
      try { await updateDoc(doc(db, "promotions", id), { clicks: increment(1) }); } catch { /* ignore */ }
    }
    if (ad.adLink) window.open(ad.adLink, "_blank");
  };
  const accent = tier === "Gold" ? GOLD : "#aaa";
  const src = ad.image || ad.imageUrl || ad.coverImage || null;
  return (
    <div onClick={click} className="sx-ad">
      <div className="sx-cover">
        {src ? (
          <img src={src} alt={ad.title || "Ad"} onError={(e) => { e.currentTarget.style.display = "none"; }} />
        ) : (
          <div className="sx-ph"><FileText size={24} strokeWidth={1.5} /><span>Sponsored</span></div>
        )}
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, background: "rgba(13,34,68,.82)", padding: "3px 6px", display: "flex", justifyContent: "space-between" }}>
          <span style={{ fontSize: 8, fontWeight: 700, color: accent }}>{tier}</span>
          <span style={{ fontSize: 8, fontWeight: 700, background: accent, color: NAVY, padding: "0 4px" }}>AD</span>
        </div>
      </div>
      <div className="sx-body">
        <h4 className="sx-title">{ad.title || "Sponsored"}</h4>
        <p className="sx-line">{ad.author || ad.sponsor || "Sponsored"}</p>
      </div>
    </div>
  );
}

function ProfileCard({ p }) {
  const label = p.faculty ? "Verified Faculty" : p.verified ? "Verified Seller" : "Seller";
  const accent = p.faculty ? GOLD : p.verified ? "#0369a1" : "#94a3b8";
  const initial = (p.name || "?").trim()[0]?.toUpperCase() || "?";
  const [bad, setBad] = useState(false);
  return (
    <Link href={profileHref(p)} className="sx-person" style={{ borderTopColor: accent }}>
      <div className="sx-avatar" style={{ borderColor: accent }}>
        {p.photo && !bad ? (
          <img src={p.photo} alt="" onError={() => setBad(true)} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top center" }} />
        ) : (
          <span style={{ fontFamily: "'Playfair Display',serif", fontSize: 24, fontWeight: 700, color: accent }}>{initial}</span>
        )}
      </div>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <h3 className="sx-person-name">{[p.title, p.name].filter(Boolean).join(" ")}</h3>
          {(p.faculty || p.verified) && <ShieldCheck size={13} style={{ color: accent, flexShrink: 0 }} />}
        </div>
        <p style={{ fontSize: 11, fontWeight: 700, color: accent, margin: "2px 0 0" }}>{label}</p>
        {p.institution && <p className="sx-person-sub">{p.institution}</p>}
        <p className="sx-person-sub">
          {p.docs > 0 ? `${p.docs} document${p.docs !== 1 ? "s" : ""}` : "View profile"}
          {p.booksSold > 0 ? ` · ${p.booksSold} sold` : ""}
        </p>
      </div>
    </Link>
  );
}

function BookCard({ r, isOwned }) {
  const b = r.book;
  const faculty = r.tier >= 2;
  const verified = r.tier === 1;
  const src = thumb(b);
  const [bad, setBad] = useState(false);
  const typeLabel = b.docType || INTENT_LABEL[intentKey(b.intent)] || "Document";

  return (
    <Link href={`/book/preview?id=${String(b.id).replace("firestore-", "")}`} className="sx-card">
      <div className="sx-cover">
        {src && !bad ? (
          <img src={src} alt={b.title} loading="lazy" onError={() => setBad(true)} />
        ) : (
          <div className="sx-ph">
            <FileText size={26} strokeWidth={1.5} />
            <span>{typeLabel}</span>
          </div>
        )}
        <span className="sx-pdf"><i />{b.format || "PDF"}</span>
        {(faculty || verified) && (
          <span className={`sx-trust ${faculty ? "fac" : "ver"}`}>
            <ShieldCheck size={8} />{faculty ? "Faculty" : "Verified"}
          </span>
        )}
        {isOwned && <span className="sx-owned">Owned</span>}
        {r.trending ? <span className="sx-trend"><TrendingUp size={9} />{r.trending}</span> : null}
      </div>

      <div className="sx-body">
        <h4 className="sx-title">{b.title}</h4>
        <p className="sx-line">{typeMeta(b)}</p>
        <span className="sx-type">{typeLabel}</span>
        <div className="sx-price">
          {b.isFree ? (
            <span style={{ color: "#15803d" }}>Free</span>
          ) : (
            <span style={{ color: NAVY }}>₦{Number(b.price).toLocaleString()}</span>
          )}
          {b.isNegotiable && !b.isFree && <em>Negotiable</em>}
        </div>
      </div>
    </Link>
  );
}

function BookGrid({ rows, owned }) {
  return (
    <div className="sx-grid">
      {rows.map((r) => (
        <BookCard key={r.book.id} r={r} isOwned={owned.has(r.book.id) || (r.book.firestoreId && owned.has(r.book.firestoreId))} />
      ))}
    </div>
  );
}

function SectionHead({ title, sub, count }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
      <div style={{ width: 4, height: 30, background: GOLD, flexShrink: 0 }} />
      <div style={{ minWidth: 0 }}>
        <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: 22, fontWeight: 700, color: NAVY, margin: 0 }}>
          {title}
          {count !== undefined && <span style={{ fontSize: 14, fontWeight: 400, color: "#bbb", marginLeft: 8, fontFamily: "'Lato',sans-serif" }}>({count})</span>}
        </h3>
        {sub && <p style={{ fontSize: 12, color: "#888", margin: "2px 0 0" }}>{sub}</p>}
      </div>
    </div>
  );
}

function Chip({ on, onClick, children }) {
  return (
    <button type="button" onClick={onClick} className={`sx-pill${on ? " on" : ""}`}>{children}</button>
  );
}

function FilterPanel({ filters, facets, onApply, onClose }) {
  const [f, setF] = useState(filters);
  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));
  const toggle = (k, v) => set(k, f[k] === v ? "" : v);
  const label = { fontSize: 10, fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", color: NAVY, display: "block", marginBottom: 8 };
  const field = { width: "100%", padding: "10px 12px", border: `0.5px solid ${LINE}`, background: "#fff", fontSize: 13, color: NAVY };

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(13,34,68,.6)", zIndex: 60, display: "flex", alignItems: "flex-end" }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: BG, width: "100%", maxWidth: 520, margin: "0 auto", padding: "26px 24px 30px", borderTop: `3px solid ${GOLD}`, maxHeight: "90vh", overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22 }}>
          <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: 22, fontWeight: 700, color: NAVY, margin: 0 }}>Refine results</h2>
          <button onClick={onClose} aria-label="Close" style={{ width: 32, height: 32, border: `0.5px solid ${LINE}`, background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#888" }}>
            <X size={14} />
          </button>
        </div>

        {facets.uni.length > 0 && (
          <div style={{ marginBottom: 18 }}>
            <label style={label}>University</label>
            <select style={field} value={f.uni} onChange={(e) => set("uni", e.target.value)}>
              <option value="">All universities</option>
              {facets.uni.map(([v, n]) => <option key={v} value={v}>{v} ({n})</option>)}
            </select>
          </div>
        )}

        {facets.type.length > 0 && (
          <div style={{ marginBottom: 18 }}>
            <label style={label}>Document type</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {facets.type.map(([v, n]) => <Chip key={v} on={f.type === v} onClick={() => toggle("type", v)}>{v} ({n})</Chip>)}
            </div>
          </div>
        )}

        {facets.intent.length > 0 && (
          <div style={{ marginBottom: 18 }}>
            <label style={label}>Category</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {facets.intent.map(([v, n]) => <Chip key={v} on={f.intent === v} onClick={() => toggle("intent", v)}>{INTENT_LABEL[v] || v} ({n})</Chip>)}
            </div>
          </div>
        )}

        {facets.level.length > 0 && (
          <div style={{ marginBottom: 18 }}>
            <label style={label}>Level</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {facets.level.map(([v, n]) => <Chip key={v} on={f.level === v} onClick={() => toggle("level", v)}>{levelLabel(v)} ({n})</Chip>)}
            </div>
          </div>
        )}

        {facets.dept.length > 0 && (
          <div style={{ marginBottom: 18 }}>
            <label style={label}>Department</label>
            <select style={field} value={f.dept} onChange={(e) => set("dept", e.target.value)}>
              <option value="">All departments</option>
              {facets.dept.map(([v, n]) => <option key={v} value={v}>{v} ({n})</option>)}
            </select>
          </div>
        )}

        {facets.session.length > 0 && (
          <div style={{ marginBottom: 18 }}>
            <label style={label}>Session / year</label>
            <select style={field} value={f.session} onChange={(e) => set("session", e.target.value)}>
              <option value="">Any year</option>
              {facets.session.map(([v, n]) => <option key={v} value={v}>{v} ({n})</option>)}
            </select>
          </div>
        )}

        <div style={{ marginBottom: 18 }}>
          <label style={label}>Price (₦)</label>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <input type="number" placeholder="Min" value={f.priceMin} onChange={(e) => set("priceMin", e.target.value)} style={{ ...field, flex: 1 }} />
            <span style={{ color: "#ccc" }}>–</span>
            <input type="number" placeholder="Max" value={f.priceMax} onChange={(e) => set("priceMax", e.target.value)} style={{ ...field, flex: 1 }} />
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 22 }}>
          {[
            ["trustedOnly", "Verified faculty and sellers only", "Hide documents from sellers without a verified badge"],
            ["freeOnly", "Free documents only", "Open access documents with no price"],
          ].map(([k, title, desc]) => (
            <div key={k} onClick={() => set(k, !f[k])} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: 12, background: "#fff", border: `0.5px solid ${LINE}`, cursor: "pointer" }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: NAVY }}>{title}</div>
                <div style={{ fontSize: 11, color: "#888", marginTop: 2 }}>{desc}</div>
              </div>
              <div style={{ width: 40, height: 22, borderRadius: 99, background: f[k] ? NAVY : LINE, position: "relative", flexShrink: 0, marginLeft: 12 }}>
                <div style={{ position: "absolute", top: 3, left: f[k] ? 21 : 3, width: 16, height: 16, borderRadius: "50%", background: "#fff", transition: "left .15s" }} />
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={() => { onApply(f); onClose(); }} style={{ flex: 1, padding: 13, background: NAVY, color: "#fff", fontSize: 12, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", border: "none", cursor: "pointer" }}>
            Show results
          </button>
          <button onClick={() => { onApply(EMPTY); onClose(); }} style={{ padding: "13px 20px", background: "transparent", color: "#888", fontSize: 12, fontWeight: 700, border: `0.5px solid ${LINE}`, cursor: "pointer" }}>
            Reset
          </button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   PAGE
═══════════════════════════════════════════════════════════ */
export default function SearchClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const q = (searchParams.get("q") || "").trim();

  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState([]);
  const [people, setPeople] = useState([]);
  const [relaxed, setRelaxed] = useState(false);
  const [hints, setHints] = useState([]);
  const [popular, setPopular] = useState([]);
  const [owned, setOwned] = useState(() => new Set());
  const [filters, setFilters] = useState(EMPTY);
  const [sort, setSort] = useState("relevance");
  const [showFilters, setShowFilters] = useState(false);
  const [draft, setDraft] = useState(q);
  const [shown, setShown] = useState(40);
  const runRef = useRef(0);

  const goldAds = useAds("Gold", 5);
  const silverAds = useAds("Silver", 3);

  useEffect(() => { setDraft(q); }, [q]);

  /* build the index once */
  useEffect(() => {
    let alive = true;
    loadBooks().then(() => { if (alive) setReady(true); });
    loadSellers().catch(() => { });
    return () => { alive = false; };
  }, []);

  /* books this visitor already owns */
  useEffect(() => {
    const off = onAuthStateChanged(auth, async (u) => {
      if (!u) { setOwned(new Set()); return; }
      try {
        const snap = await getDoc(doc(db, "users", u.uid));
        const pb = snap.exists() ? snap.data().purchasedBooks : null;
        const ids = Array.isArray(pb)
          ? pb.map((b) => String(b?.id ?? b))
          : pb && typeof pb === "object" ? Object.keys(pb) : [];
        setOwned(new Set(ids));
      } catch { /* ignore */ }
    });
    return () => off();
  }, []);

  /* the search itself */
  useEffect(() => {
    if (!ready) return;
    const run = ++runRef.current;
    setShown(40);
    setFilters(EMPTY);

    if (!q) {
      setRows([]); setPeople([]); setHints([]); setRelaxed(false); setLoading(false);
      loadPopular().then((p) => { if (run === runRef.current) setPopular(p); });
      return;
    }

    (async () => {
      setLoading(true);
      try {
        const lib = await loadBooks();
        const pq = parseQuery(q);
        setHints(queryHints(pq));

        let found = searchBooks(lib.index, pq, false);
        let soft = false;
        if (!found.length) {
          found = searchBooks(lib.index, pq, true);
          soft = found.length > 0;
        }
        found = found.slice(0, 400);

        const ids = uniq(found.slice(0, 150).map((r) => r.item.book.sellerId).filter(Boolean)).slice(0, 80);
        const trust = await loadTrust(ids);
        const ranked = orderByTrust(found, (b) => trust.get(b.sellerId));
        const folks = await findProfiles(pq, lib.bySeller);

        if (run !== runRef.current) return;
        setRows(ranked);
        setRelaxed(soft);
        setPeople(folks);
        if (ranked.length) track(pq.n);
      } catch (e) {
        console.error("[search]", e);
        if (run === runRef.current) { setRows([]); setPeople([]); }
      } finally {
        if (run === runRef.current) setLoading(false);
      }
    })();
  }, [q, ready]);

  const facets = useMemo(() => buildFacets(rows), [rows]);
  const visible = useMemo(() => sortRows(applyFilters(rows, filters), sort), [rows, filters, sort]);
  const trustedRows = sort === "relevance" ? visible.filter((r) => r.trusted) : [];
  const otherRows = sort === "relevance" ? visible.filter((r) => !r.trusted) : visible;
  const active = countActive(filters);

  const submit = (e) => {
    e.preventDefault();
    const v = draft.trim();
    router.push(v ? `${pathname}?q=${encodeURIComponent(v)}` : pathname);
  };

  const filterChips = Object.entries(filters)
    .filter(([, v]) => v !== "" && v !== false)
    .map(([k, v]) => {
      const text = {
        uni: v, type: v, dept: v, session: v,
        level: levelLabel(String(v)), intent: INTENT_LABEL[v] || v,
        freeOnly: "Free only", trustedOnly: "Verified only",
        priceMin: `From ₦${v}`, priceMax: `Up to ₦${v}`,
      }[k];
      return { k, text };
    });

  const hasAnything = visible.length > 0 || people.length > 0;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900&family=Lato:wght@300;400;700&display=swap');
        .sx { font-family:'Lato',sans-serif; background:${BG}; min-height:100vh; overflow-x:hidden; }
        .sx *, .sx *::before, .sx *::after { box-sizing:border-box; }
        .sx-wrap { max-width:1200px; margin:0 auto; padding:0 24px; }
        .sx-hero { background:${NAVY}; background-image:radial-gradient(rgba(184,150,62,.06) 1px,transparent 1px); background-size:22px 22px; padding:44px 0 32px; }
        .sx-hero h1 { font-family:'Playfair Display',serif; font-size:clamp(26px,5vw,42px); font-weight:700; color:#fff; margin:0 0 6px; line-height:1.1; }
        .sx-form { display:flex; margin-top:20px; max-width:720px; }
        .sx-form input { flex:1; min-width:0; padding:14px 16px; border:none; font-size:15px; color:${NAVY}; outline:none; font-family:'Lato',sans-serif; }
        .sx-form button { padding:0 24px; background:${GOLD}; color:${NAVY}; border:none; font-weight:700; font-size:13px; cursor:pointer; display:flex; align-items:center; gap:7px; }
        .sx-form button:hover { background:#d4aa5a; }
        .sx-hint { font-size:11px; font-weight:700; background:rgba(184,150,62,.15); color:#d4aa5a; border:1px solid rgba(184,150,62,.3); padding:3px 10px; }
        .sx-bar { background:${CREAM}; border-bottom:.5px solid ${LINE}; padding:12px 0; }
        .sx-btn { display:inline-flex; align-items:center; gap:6px; padding:8px 16px; font-size:11px; font-weight:700; letter-spacing:.08em; text-transform:uppercase; cursor:pointer; background:#fff; color:#666; border:1px solid ${LINE}; }
        .sx-btn.on { background:${NAVY}; color:#fff; border-color:${NAVY}; }
        .sx-sel { padding:8px 10px; font-size:12px; border:1px solid ${LINE}; background:#fff; color:${NAVY}; }
        .sx-tag { display:inline-flex; align-items:center; gap:6px; padding:5px 10px; background:#fff; border:.5px solid ${LINE}; font-size:11px; font-weight:700; color:${NAVY}; }
        .sx-tag button { background:none; border:none; padding:0; cursor:pointer; color:#aaa; display:flex; }

        /* ── small document tiles (same size as the All Books page) ── */
        .sx-grid { display:grid; grid-template-columns:repeat(auto-fill, minmax(112px, 1fr)); gap:22px 14px; }
        @media (min-width:640px) { .sx-grid { grid-template-columns:repeat(auto-fill, minmax(140px, 1fr)); gap:26px 18px; } }
        .sx-card, .sx-ad { display:block; min-width:0; text-decoration:none; cursor:pointer; }
        .sx-card:focus-visible, .sx-person:focus-visible { outline:2px solid ${GOLD}; outline-offset:2px; }
        .sx-cover { position:relative; aspect-ratio:3/4; background:#ece6d8; overflow:hidden; box-shadow:0 4px 12px rgba(13,34,68,.14); }
        .sx-cover img { width:100%; height:100%; object-fit:cover; display:block; transition:transform .4s; }
        .sx-card:hover .sx-cover img { transform:scale(1.05); }
        .sx-ph { position:absolute; inset:0; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:6px; padding:10px; text-align:center; color:${NAVY}; background:linear-gradient(160deg, #f3ede0 0%, #e4dbc6 100%); }
        .sx-ph svg { opacity:.45; }
        .sx-ph span { font-size:9px; font-weight:700; letter-spacing:.08em; text-transform:uppercase; line-height:1.3; opacity:.7; max-width:100%; overflow:hidden; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; }
        .sx-pdf { position:absolute; top:6px; left:6px; display:inline-flex; align-items:center; gap:3px; background:${NAVY}; padding:2px 6px; font-size:8px; font-weight:700; color:#fff; }
        .sx-pdf i { width:4px; height:4px; border-radius:50%; background:#22c55e; display:inline-block; }
        .sx-trust { position:absolute; top:6px; right:6px; display:inline-flex; align-items:center; gap:2px; padding:2px 5px; font-size:8px; font-weight:700; }
        .sx-trust.fac { background:${GOLD}; color:${NAVY}; }
        .sx-trust.ver { background:#e0f2fe; color:#0369a1; }
        .sx-owned { position:absolute; bottom:6px; right:6px; background:#15803d; color:#fff; font-size:8px; font-weight:700; padding:2px 6px; }
        .sx-trend { position:absolute; bottom:6px; left:6px; display:inline-flex; align-items:center; gap:3px; background:#ea580c; color:#fff; font-size:8px; font-weight:700; padding:2px 6px; }
        .sx-body { padding:8px 2px 0; min-width:0; }
        .sx-title { font-family:'Playfair Display',serif; font-size:12px; font-weight:700; color:${NAVY}; margin:0 0 3px; line-height:1.35; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; word-break:break-word; }
        .sx-line { font-size:10.5px; color:#888; margin:0 0 3px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
        .sx-type { display:block; font-size:9px; font-weight:700; color:${GOLD}; letter-spacing:.08em; text-transform:uppercase; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
        .sx-price { display:flex; align-items:center; gap:6px; margin-top:3px; font-size:12px; font-weight:700; }
        .sx-price em { font-style:normal; font-size:9px; font-weight:700; color:${GOLD}; }

        .sx-ads { display:flex; gap:14px; overflow-x:auto; padding-bottom:8px; scrollbar-width:none; }
        .sx-ads::-webkit-scrollbar { display:none; }
        .sx-ads > * { flex:0 0 120px; }
        @media (min-width:640px) { .sx-ads > * { flex-basis:140px; } }

        .sx-people { display:grid; grid-template-columns:1fr; gap:12px; }
        @media (min-width:640px) { .sx-people { grid-template-columns:repeat(2,1fr); } }
        @media (min-width:1024px) { .sx-people { grid-template-columns:repeat(3,1fr); } }
        .sx-person { display:flex; gap:14px; align-items:center; min-width:0; padding:16px; background:#fff; border:.5px solid ${LINE}; border-top:3px solid ${GOLD}; text-decoration:none; transition:box-shadow .15s; }
        .sx-person:hover { box-shadow:0 6px 20px rgba(13,34,68,.08); }
        .sx-avatar { width:64px; height:64px; border-radius:20px; overflow:hidden; border:1.5px solid ${GOLD}; background:${CREAM}; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
        .sx-person-name { font-family:'Playfair Display',serif; font-size:16px; font-weight:700; color:${NAVY}; margin:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
        .sx-person-sub { font-size:11px; color:#888; margin:2px 0 0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
        .sx-pill { padding:6px 14px; font-size:11px; font-weight:700; background:#fff; color:#666; border:1px solid ${LINE}; cursor:pointer; }
        .sx-pill.on { background:${NAVY}; color:#fff; border-color:${NAVY}; }
        .sx-spin { width:36px; height:36px; border:2px solid rgba(13,34,68,.1); border-top-color:${GOLD}; border-radius:50%; animation:sxspin .7s linear infinite; margin:0 auto; }
        @keyframes sxspin { to { transform:rotate(360deg); } }
        @media (prefers-reduced-motion: reduce) { .sx *, .sx-spin { animation:none !important; transition:none !important; } }
      `}</style>

      <div className="sx">
        <Navbar />

        {/* ── Hero with its own search box ── */}
        <section className="sx-hero">
          <div className="sx-wrap">
            <h1>{q ? `Results for “${q}”` : "Search the library"}</h1>
            <p style={{ fontSize: 14, color: "rgba(255,255,255,.55)", margin: 0, fontWeight: 300 }}>
              {q
                ? loading ? "Searching…" : `${visible.length} document${visible.length !== 1 ? "s" : ""}${people.length ? ` and ${people.length} profile${people.length !== 1 ? "s" : ""}` : ""} found`
                : "Search by title, course code, university, author or lecturer"}
            </p>

            <form onSubmit={submit} className="sx-form">
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="e.g. CHE 301 UNILAG past questions"
                aria-label="Search documents"
              />
              <button type="submit"><Search size={15} />Search</button>
            </form>

            {hints.length > 0 && !loading && (
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 14 }}>
                {hints.map((h) => <span key={h.kind + h.label} className="sx-hint">{h.label}</span>)}
              </div>
            )}
          </div>
        </section>

        {/* ── Filter bar ── */}
        {q && !loading && rows.length > 0 && (
          <div className="sx-bar">
            <div className="sx-wrap" style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <button className={`sx-btn${active ? " on" : ""}`} onClick={() => setShowFilters(true)}>
                <SlidersHorizontal size={13} />Filters{active ? ` (${active})` : ""}
              </button>
              {filterChips.map(({ k, text }) => (
                <span key={k} className="sx-tag">
                  {text}
                  <button aria-label={`Remove ${text}`} onClick={() => setFilters((p) => ({ ...p, [k]: typeof p[k] === "boolean" ? false : "" }))}>
                    <X size={11} />
                  </button>
                </span>
              ))}
              {active > 0 && (
                <button onClick={() => setFilters(EMPTY)} style={{ fontSize: 11, fontWeight: 700, color: "#aaa", background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}>
                  Clear all
                </button>
              )}
              <select className="sx-sel" value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort results" style={{ marginLeft: "auto" }}>
                {SORTS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
          </div>
        )}

        {/* ── Ads ── */}
        {(goldAds.length > 0 || silverAds.length > 0) && (
          <div className="sx-wrap" style={{ paddingTop: 24 }}>
            {goldAds.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: ".16em", textTransform: "uppercase", color: GOLD, margin: "0 0 4px" }}>Featured · Gold</p>
                <p style={{ fontFamily: "'Playfair Display',serif", fontSize: 20, fontWeight: 700, color: NAVY, margin: "0 0 10px" }}>Recommended for you</p>
                <div className="sx-ads">
                  {goldAds.map((ad) => <SearchAdCard key={ad.adId || ad.id} ad={ad} tier="Gold" />)}
                </div>
              </div>
            )}
            {silverAds.length > 0 && (
              <div style={{ marginBottom: 8 }}>
                <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: ".16em", textTransform: "uppercase", color: "#aaa", margin: "0 0 10px" }}>Featured · Silver</p>
                <div className="sx-ads">
                  {silverAds.map((ad) => <SearchAdCard key={ad.adId || ad.id} ad={ad} tier="Silver" />)}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Results ── */}
        <main className="sx-wrap" style={{ padding: "40px 24px 48px" }}>
          {(!ready || loading) && (
            <div style={{ textAlign: "center", padding: "70px 0" }}>
              <div className="sx-spin" />
              <p style={{ fontSize: 12, color: "#bbb", marginTop: 14 }}>{ready ? "Searching documents…" : "Preparing the library…"}</p>
            </div>
          )}

          {/* No query: most searched */}
          {ready && !q && popular.length > 0 && (
            <>
              <SectionHead title="Most searched documents" sub="What students across Africa are looking for" count={popular.length} />
              <BookGrid rows={popular} owned={owned} />
            </>
          )}

          {/* Nothing found */}
          {ready && q && !loading && !hasAnything && (
            <div style={{ textAlign: "center", padding: "70px 24px" }}>
              <div style={{ width: 64, height: 64, border: `.5px solid ${LINE}`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
                <FileText size={28} style={{ color: "#ccc" }} />
              </div>
              <p style={{ fontFamily: "'Playfair Display',serif", fontSize: 22, color: NAVY, margin: "0 0 8px" }}>No results for “{q}”</p>
              <p style={{ fontSize: 13, color: "#999", maxWidth: 420, margin: "0 auto 22px", lineHeight: 1.6 }}>
                Try fewer words, a course code like CHE 301, or a university name or abbreviation like UNILAG.
                {active > 0 ? " You also have filters turned on." : ""}
              </p>
              {active > 0 && (
                <button onClick={() => setFilters(EMPTY)} style={{ padding: "12px 24px", background: GOLD, color: NAVY, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 700, marginRight: 8 }}>
                  Clear filters
                </button>
              )}
              <Link href="/home" style={{ display: "inline-block", padding: "12px 24px", background: NAVY, color: "#fff", fontSize: 12, fontWeight: 700, textDecoration: "none" }}>
                Back to home
              </Link>
            </div>
          )}

          {ready && q && !loading && hasAnything && (
            <>
              {relaxed && (
                <div style={{ background: "#fffbeb", border: "1px solid #fde68a", padding: "12px 16px", marginBottom: 28, fontSize: 13, color: "#92400e" }}>
                  No document matched every word, so these are the closest matches.
                </div>
              )}

              {people.length > 0 && (
                <section style={{ marginBottom: 44 }}>
                  <SectionHead title="Faculty and sellers" sub="Profiles that match your search" count={people.length} />
                  <div className="sx-people">{people.map((p) => <ProfileCard key={p.uid} p={p} />)}</div>
                </section>
              )}

              {trustedRows.length > 0 && (
                <section style={{ marginBottom: 44 }}>
                  <SectionHead title="From verified faculty and sellers" sub="Matches uploaded by verified accounts come first" count={trustedRows.length} />
                  <BookGrid rows={trustedRows.slice(0, 40)} owned={owned} />
                </section>
              )}

              {visible.length === 0 && rows.length > 0 && (
                <p style={{ textAlign: "center", color: "#999", fontSize: 14, padding: "30px 0" }}>
                  No documents match these filters.{" "}
                  <button onClick={() => setFilters(EMPTY)} style={{ background: "none", border: "none", color: NAVY, fontWeight: 700, textDecoration: "underline", cursor: "pointer" }}>Clear filters</button>
                </p>
              )}

              {otherRows.length > 0 && (
                <section>
                  <SectionHead
                    title={trustedRows.length > 0 ? "More results" : "Documents"}
                    count={otherRows.length}
                  />
                  <BookGrid rows={otherRows.slice(0, shown)} owned={owned} />
                  {otherRows.length > shown && (
                    <div style={{ textAlign: "center", marginTop: 28 }}>
                      <button onClick={() => setShown((n) => n + 40)} style={{ padding: "12px 32px", background: NAVY, color: "#fff", border: "none", fontSize: 12, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", cursor: "pointer" }}>
                        Show more ({otherRows.length - shown} left)
                      </button>
                    </div>
                  )}
                </section>
              )}
            </>
          )}
        </main>

        <section style={{ padding: "0 0 32px" }}>
          <FeaturedAdsCarousel tier="Gold" maxAds={5} autoPlay />
        </section>
      </div>

      {showFilters && (
        <FilterPanel filters={filters} facets={facets} onApply={setFilters} onClose={() => setShowFilters(false)} />
      )}
    </>
  );
}