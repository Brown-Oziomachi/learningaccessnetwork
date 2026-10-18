"use client";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  doc, getDoc, updateDoc, collection, query, where, limit, getDocs,
  addDoc, serverTimestamp, increment, setDoc, deleteDoc,
} from "firebase/firestore";
import { auth, db } from "@/lib/firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";
import { booksData } from "@/lib/booksData";
import {
  Download, Share2, Bookmark, MoreVertical, Menu, X, Eye, FileText,
  ChevronRight, ChevronDown, Layers, ThumbsUp, Flag, CheckCircle, Upload,
  HelpCircle, ShoppingBag, Users, Sparkles, Package, MapPin, Star, Unlock,
  Printer, Lock, AlertCircle, Store, Tag, GraduationCap, Zap, ShieldCheck,
} from "lucide-react";
import Link from "next/link";
import { fetchBookDetails } from "@/utils/bookUtils";
import FeaturedAdsCarousel from "./FeaturedAdsCarousel";
import OpenAccessModal from "./Openaccessmodal";
import { FrozenPdfGate } from "./book-preview- patches";
import { useCurrency } from "@/app/context/CurrencyContext";
import BookNegotiationCard from "@/components/negotiation/BookNegotiationCard";
import { NegotiationHost } from "@/components/negotiation/NegotiationHost";
import { getNegotiationSettings } from "@/lib/negotiation";
import { VerifiedBadge, paidVerificationActive } from "@/components/seller/Verification";
import { openNegotiation } from "@/components/negotiation/NegotiationHost";
import { negId } from "@/lib/negotiation";

/* ── palette ── */
const NAVY = "#0d2244";
const NAVY_HOVER = "#17325f";
const GOLD = "#b8963e";
const CREAM = "#f5f0e8";
const BG = "#f5f1ea";

/* ── helpers ── */
const isOpenAccess = (book) =>
  book?.isFree === true || book?.accessType === "free" || Number(book?.price) === 0;

const isSellerBook = (book) =>
  book?.isFromFirestore === true ||
  (book?.userId && book.userId !== "") ||
  (book?.sellerName && book.sellerName !== "" && book.sellerName !== "LAN Library");

/* A title that is empty, or is just the Firestore id, is not a real title */
const looksLikeId = (t, id) => {
  const s = String(t || "").trim();
  return !s || s === id || s === `firestore-${id}` || /^[A-Za-z0-9]{20}$/.test(s);
};

const driveFileId = (book) => {
  if (!book) return null;
  if (book.driveFileId) return book.driveFileId;
  const pick = (str, re) => { const m = str?.match(re); return m ? m[1] || m[2] : null; };
  const re = /\/d\/([\w-]{25,})|id=([\w-]{25,})/;
  return (
    (book.embedUrl && pick(book.embedUrl, re)) ||
    (book.pdfUrl?.includes("drive.google.com") && (pick(book.pdfUrl, re) || book.pdfUrl.match(/[-\w]{25,}/)?.[0])) ||
    ((book.coverImage || book.image)?.includes("drive.google.com") && pick(book.coverImage || book.image, re)) ||
    null
  );
};


const isPlaceholderImg = (u) => /photo-1544947950|placeholder|no-cover|default-cover/i.test(String(u || ""));

const coverCandidates = (book) => {
  if (!book) return [];
  const out = [];
  const id = driveFileId(book);
  if (id) {
    out.push(`https://drive.google.com/thumbnail?id=${id}&sz=w400`);
    out.push(`https://drive.google.com/thumbnail?id=${id}&sz=w1000`);
    out.push(`https://lh3.googleusercontent.com/d/${id}=w1000`);
  }
  /* coverImage first (the uploaded cover), image second, placeholders never */
  [book.coverImage, book.image].forEach((u) => {
    if (u && !isPlaceholderImg(u)) out.push(u);
  });
  return [...new Set(out)];
};

/* PDF.js, loaded once */
let pdfjsPromise = null;
const loadPdfJs = () => {
  if (typeof window === "undefined") return Promise.reject(new Error("no window"));
  if (window.pdfjsLib) return Promise.resolve(window.pdfjsLib);
  if (pdfjsPromise) return pdfjsPromise;
  pdfjsPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
    script.onload = () => {
      window.pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
      resolve(window.pdfjsLib);
    };
    script.onerror = () => { pdfjsPromise = null; reject(new Error("pdfjs failed to load")); };
    document.head.appendChild(script);
  });
  return pdfjsPromise;
};

/* ─── BookCover: the whole cover, never cropped. `natural` lets it take its own height. ─── */
function BookCover({ book, title, titleSize = 14, fit = "contain", natural = false, style }) {
  const list = coverCandidates(book);
  const key = list.join("|");
  const [idx, setIdx] = useState(0);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => { setIdx(0); setLoaded(false); }, [key]);
  const src = list[idx];
  const freeHeight = natural && loaded;
  return (
    <div style={{ position: "relative", width: "100%", aspectRatio: freeHeight ? undefined : "3/4", background: "#ece6d8", overflow: "hidden", ...style }}>
      {src ? (
              <img
          key={src}
          src={src}
          alt={title}
                    loading="eager"
          referrerPolicy="no-referrer"
          decoding="async"
          onLoad={() => setLoaded(true)}
          onError={() => { setLoaded(false); setIdx((i) => i + 1); }}
          style={freeHeight ? { width: "100%", height: "auto", display: "block" } : { width: "100%", height: "100%", objectFit: fit, display: "block" }}
        />
      ) : (
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", padding: "10%", textAlign: "center", background: `linear-gradient(160deg, ${NAVY}, #1a3a6e)`, borderTop: `2px solid ${GOLD}` }}>
          <span style={{ fontFamily: "'Playfair Display',serif", color: "#fff", fontSize: `${titleSize}px`, fontWeight: 700, lineHeight: 1.3, display: "-webkit-box", WebkitLineClamp: 6, WebkitBoxOrient: "vertical", overflow: "hidden", wordBreak: "break-word" }}>{title}</span>
        </div>
      )}
    </div>
  );
}

/* ─── LockedPreview: cover + first page only, in a scroll box that stops at the first page ─── */
function LockedPreview({ book, total, footer }) {
  const [page, setPage] = useState(null);
  const [state, setState] = useState("loading"); // loading | ok | none

  const driveId = driveFileId(book);
  const direct = book?.pdfUrl && !book.pdfUrl.includes("drive.google.com") ? book.pdfUrl : null;
  const sourceKey = [
    direct,
    direct && `/api/pdf-proxy?url=${encodeURIComponent(direct)}`,
    driveId && `/api/pdf-proxy?id=${driveId}`,
  ].filter(Boolean).join("|");

  useEffect(() => {
    setPage(null);
    const sources = sourceKey ? sourceKey.split("|") : [];
    if (!sources.length) { setState("none"); return; }
    let dead = false;
    setState("loading");

    (async () => {
      let lib;
      try { lib = await loadPdfJs(); } catch { if (!dead) setState("none"); return; }

      for (const src of sources) {
        if (dead) return;
        let pdf = null;
        try {
          pdf = await lib.getDocument({ url: src, disableAutoFetch: true }).promise;
          if (pdf.numPages < 2) continue;            // page 1 = cover, page 2 = first page
          const p = await pdf.getPage(2);
          const vp = p.getViewport({ scale: 1.6 });
          const canvas = document.createElement("canvas");
          canvas.width = vp.width; canvas.height = vp.height;
          await p.render({ canvasContext: canvas.getContext("2d"), viewport: vp }).promise;
          if (!dead) { setPage(canvas.toDataURL("image/jpeg", 0.85)); setState("ok"); }
          return;
        } catch (e) {
          console.warn("First-page preview failed for", src, e);   // try the next source
        } finally {
          try { pdf?.destroy(); } catch { }
        }
      }
      if (!dead) setState("none");
    })();

    return () => { dead = true; };
  }, [sourceKey]);

  const caption = { fontFamily: "'Lato',sans-serif", fontSize: 11, fontWeight: 700, color: "#888", textAlign: "center", margin: "10px 0 0", letterSpacing: "0.04em" };
  const sheet = { background: "#fff", boxShadow: "0 8px 26px rgba(13,34,68,0.18)", border: "0.5px solid #e5ddd0" };

  return (
    <div>
      {/* Scrollable: cover, then first page, nothing after */}
      <div
        style={{
          maxHeight: "min(82vh, 900px)",
          overflowY: "auto",
          overscrollBehavior: "contain",
          padding: "22px 16px 8px",
        }}
      >
        <div style={{ maxWidth: 760, margin: "0 auto", display: "flex", flexDirection: "column", gap: 28 }}>
          <figure style={{ margin: 0, width: "100%" }}>
            <div style={sheet}><BookCover book={book} title={book.title} titleSize={28} natural /></div>
            <figcaption style={caption}>Cover</figcaption>
          </figure>

          {state === "loading" && (
            <figure style={{ margin: 0, width: "100%" }}>
              <div style={{ ...sheet, aspectRatio: "3/4", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <div style={{ width: 26, height: 26, border: `2px solid ${GOLD}`, borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
              </div>
              <figcaption style={caption}>First page</figcaption>
            </figure>
          )}

          {state === "ok" && page && (
            <figure style={{ margin: 0, width: "100%" }}>
              <div style={sheet} onContextMenu={(e) => e.preventDefault()}>
                <img src={page} alt={`${book.title} - first page`} draggable={false} style={{ width: "100%", height: "auto", display: "block", userSelect: "none", WebkitUserSelect: "none", pointerEvents: "none" }} />
              </div>
              <figcaption style={caption}>First page</figcaption>
            </figure>
          )}

          {state === "none" && (
            <p style={{ ...caption, margin: 0, padding: "12px 0", fontWeight: 400 }}>First page preview isn't available for this document.</p>
          )}
        </div>
      </div>

      <div style={{ margin: "16px", padding: "22px 18px", background: CREAM, border: "0.5px solid #e5ddd0", textAlign: "center" }}>
        <div style={{ width: 40, height: 40, borderRadius: "50%", background: NAVY, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 10px" }}>
          <Lock size={17} style={{ color: GOLD }} />
        </div>
        <p style={{ fontFamily: "'Playfair Display',serif", fontSize: 17, fontWeight: 700, color: NAVY, margin: "0 0 4px" }}>
          {total ? `Read all ${total} pages` : "Read the full document"}
        </p>
        <p style={{ fontSize: 12, color: "#777", lineHeight: 1.6, margin: "0 auto 16px", maxWidth: 380, fontFamily: "'Lato',sans-serif" }}>
          You are previewing the cover and first page. Purchase to unlock the rest.
        </p>
        <div style={{ maxWidth: 420, margin: "0 auto" }}>{footer}</div>
      </div>
    </div>
  );
}

/* ─── LicenseButton ─── */
function LicenseButton({ book, isGloballyFrozen, isPrintLicensingEnabled, router, cleanBookId, style = {} }) {
  const isDisabled = isGloballyFrozen || !isPrintLicensingEnabled;
  const disabledReason = isGloballyFrozen
    ? "This document is currently frozen."
    : !isPrintLicensingEnabled ? "Print licensing is not enabled for this book." : null;
  const handleClick = () => {
    if (isDisabled) { alert(disabledReason); return; }
    router.push(`/document/request-print-permission?id=${cleanBookId}&title=${encodeURIComponent(book?.title || "")}&pages=${book?.pages || 0}&price=${book?.price || 0}`);
  };
  return (
    <button onClick={handleClick} disabled={isDisabled}
      style={{ width: "100%", display: "flex", alignItems: "center", gap: "12px", padding: "14px 16px", border: isDisabled ? "0.5px solid #f0ebe0" : `0.5px solid ${GOLD}`, background: isDisabled ? CREAM : "#fff", cursor: isDisabled ? "not-allowed" : "pointer", transition: "all 0.18s", opacity: isDisabled ? 0.6 : 1, ...style }}
      onMouseEnter={(e) => { if (!isDisabled) { e.currentTarget.style.borderColor = NAVY; e.currentTarget.style.background = CREAM; } }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = isDisabled ? "#f0ebe0" : GOLD; e.currentTarget.style.background = "#fff"; }}>
      <div style={{ width: "36px", height: "36px", border: "0.5px solid #e5ddd0", display: "flex", alignItems: "center", justifyContent: "center", background: CREAM, flexShrink: 0 }}>
        {isDisabled ? <Lock size={16} style={{ color: "#aaa" }} /> : <Printer size={16} style={{ color: NAVY }} />}
      </div>
      <div style={{ flex: 1, textAlign: "left" }}>
        <p style={{ fontSize: "13px", fontWeight: 700, color: isDisabled ? "#aaa" : NAVY, margin: "0 0 1px", fontFamily: "'Lato',sans-serif" }}>Request Print License</p>
        <p style={{ fontSize: "11px", color: isDisabled ? "#bbb" : "#aaa", margin: 0, fontFamily: "'Lato',sans-serif" }}>{isDisabled ? "Not available" : "Configure & request"}</p>
      </div>
      {isDisabled && <AlertCircle size={14} style={{ color: "#d97706", flexShrink: 0 }} />}
    </button>
  );
}

export default function BookPreviewPage({ bookDetails }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawBookId = searchParams.get("id");
  const bookId = rawBookId?.startsWith("firestore-") ? rawBookId : rawBookId ? `firestore-${rawBookId}` : null;
  const cleanBookId = rawBookId?.replace("firestore-", "");

  const [book, setBook] = useState(null);
  const [user, setUser] = useState(null);
  const [replyText, setReplyText] = useState({});
  const [replyingTo, setReplyingTo] = useState(null);
  const [submittingReply, setSubmittingReply] = useState(false);
  const [feedbacks, setFeedbacks] = useState([]);
  const [isPurchased, setIsPurchased] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showNavMenu, setShowNavMenu] = useState(false);
  const [showOptionsModal, setShowOptionsModal] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [checkingSeller, setCheckingSeller] = useState(true);
  const [isSeller, setIsSeller] = useState(false);
  const [viewerType, setViewerType] = useState("reader"); // student | lecturer | reader
  const [showOverview, setShowOverview] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [bookSalesCount, setBookSalesCount] = useState({});
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackText, setFeedbackText] = useState("");
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);
  const [bookFeedbackCount, setBookFeedbackCount] = useState(0);
  const [viewCount, setViewCount] = useState(0);
  const [positiveRatingPercent, setPositiveRatingPercent] = useState(null);
  const [totalRatings, setTotalRatings] = useState(0);
  const [followingIds, setFollowingIds] = useState(new Set());
  const [followLoadingIds, setFollowLoadingIds] = useState(new Set());
  const [physicalInventory, setPhysicalInventory] = useState(null);
  const [loadingPhysical, setLoadingPhysical] = useState(true);
  const [feedbackRating, setFeedbackRating] = useState(0);
  const [isPrintLicensingEnabled, setIsPrintLicensingEnabled] = useState(false);
  const [isGloballyFrozen, setIsGloballyFrozen] = useState(false);
  const { fmt } = useCurrency();
  const [pdfPageCount, setPdfPageCount] = useState(null);
  const [calculatingPages, setCalculatingPages] = useState(false);
  const [sellerSoldCount, setSellerSoldCount] = useState(null);
  const [negSettings, setNegSettings] = useState(null);
  const [negMeta, setNegMeta] = useState({ on: false, pct: 0, academic: false });
  const [buyMenu, setBuyMenu] = useState(null); // which split button's menu is open
  const [showNegotiation, setShowNegotiation] = useState(false);
  const [showSaveAd, setShowSaveAd] = useState(false);

  const [bookOwnerProfile, setBookOwnerProfile] = useState(null);
  const [ownerFollowers, setOwnerFollowers] = useState(0);
  const [loadingOwnerProfile, setLoadingOwnerProfile] = useState(false);

  const [suggestedFreeBooks, setSuggestedFreeBooks] = useState([]);
  const [suggestedPaidBooks, setSuggestedPaidBooks] = useState([]);

  /* ── PDF.js page count (open-access, non-seller books only) ── */
  useEffect(() => {
    if (!book) return;
    if (!isOpenAccess(book) || isSellerBook(book)) return;
    const pdfSrc = book.pdfUrl || book.embedUrl;
    if (!pdfSrc) return;
    (async () => {
      try {
        setCalculatingPages(true);
        const pdfjsLib = await loadPdfJs();
        const pdf = await pdfjsLib.getDocument(pdfSrc).promise;
        setPdfPageCount(pdf.numPages);
      } catch { } finally { setCalculatingPages(false); }
    })();
  }, [book]);

  /* ── Negotiation modal: Esc closes it, page behind stops scrolling ── */
  useEffect(() => {
    if (!showNegotiation) return;
    const onKey = (e) => { if (e.key === "Escape") setShowNegotiation(false); };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = prev; };
  }, [showNegotiation]);

  useEffect(() => {
    if (!bookId) return;
    (async () => {
      try {
        const variants = [bookId, bookId.replace("firestore-", ""), `firestore-${bookId.replace("firestore-", "")}`];
        const all = []; const seen = new Set();
        for (const id of variants) {
          const snap = await getDocs(query(collection(db, "bookFeedbacks"), where("bookId", "==", id)));
          snap.forEach((d) => { if (!seen.has(d.id)) { seen.add(d.id); all.push({ id: d.id, ...d.data() }); } });
        }
        all.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
        setFeedbacks(all);
      } catch (e) { console.error("fetchFeedbacks error:", e); }
    })();
  }, [bookId]);

  const showToastMessage = (msg) => { setToastMessage(msg); setShowToast(true); setTimeout(() => setShowToast(false), 3000); };

  const submitReply = async (feedbackId) => {
    const text = replyText[feedbackId]?.trim();
    if (!text || !user) return;
    try {
      setSubmittingReply(true);
      await updateDoc(doc(db, "bookFeedbacks", feedbackId), {
        sellerReply: text, sellerReplyAt: serverTimestamp(),
        sellerName: book?.sellerName || user?.displayName || "Seller",
      });
      setFeedbacks((prev) => prev.map((f) => f.id === feedbackId ? { ...f, sellerReply: text, sellerReplyAt: new Date() } : f));
      setReplyingTo(null);
      setReplyText((prev) => ({ ...prev, [feedbackId]: "" }));
      showToastMessage("Reply posted!");
    } catch { showToastMessage("Error posting reply. Try again."); }
    finally { setSubmittingReply(false); }
  };

  const getDisplayPages = () => {
    if (!book) return null;
    if (isOpenAccess(book) && !isSellerBook(book)) {
      if (calculatingPages) return null;
      if (pdfPageCount !== null) return pdfPageCount;
    }
    return book.pages ?? null;
  };

  const getUploaderName = () => {
    if (!book) return "LAN Library";
    const name = book.sellerName || book.uploadedBy || book.uploaderName;
    return !name || name.trim() === "" ? "LAN Library" : name;
  };

  const handleReport = () => router.push(`/report/book?bookId=${bookId}`);

  const checkSellerStatus = async (userId) => {
    try {
      setCheckingSeller(true);
      const ud = await getDoc(doc(db, "users", userId));
      const d = ud.exists() ? ud.data() : {};
      setIsSeller(d.isSeller === true);
      if (d.isStudent === true || d.role === "student") setViewerType("student");
      else if (d.isLecturer === true || d.role === "lecturer" || d.lecturerVerificationStatus === "approved") setViewerType("lecturer");
      else setViewerType("reader");
    } catch { setIsSeller(false); }
    finally { setCheckingSeller(false); }
  };

  /* Tab title = the book's real title */
  useEffect(() => {
    if (book?.title) document.title = `${book.title} | LAN Library`;
  }, [book]);

  /* ── Owner profile ── */
  useEffect(() => {
    if (!book) return;
    const ownerUid = book.userId || book.sellerId || null;
    if (!ownerUid) { setBookOwnerProfile(null); return; }
    const makeSlug = (...parts) =>
      parts.filter(Boolean).join(" ").trim().toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-") || null;
    (async () => {
      setLoadingOwnerProfile(true);
      try {
        const [userSnap, sellerSnap, followsSnap] = await Promise.all([
          getDoc(doc(db, "users", ownerUid)).catch(() => null),
          getDoc(doc(db, "sellers", ownerUid)).catch(() => null),
          getDocs(query(collection(db, "follows"), where("lecturerId", "==", ownerUid))).catch(() => null),
        ]);
        const u = userSnap?.exists() ? userSnap.data() : null;
        const s = sellerSnap?.exists() ? sellerSnap.data() : null;
        if (!u && !s) { setBookOwnerProfile(null); return; }
        const title = s?.sellerTitle || s?.title || u?.title || u?.lecturerTitle || "";
        const name = u?.firstName && u?.surname ? `${u.firstName} ${u.surname}` : u?.displayName || s?.sellerName || book.sellerName || "Unknown";
        const LECTURER_TITLES = ["lecturer", "dr.", "prof.", "professor", "mrs", "mr"];
        const lecturerMode = u?.isLecturer === true || u?.role === "lecturer" || LECTURER_TITLES.includes(String(title || "").toLowerCase());
        const verified = lecturerMode
          ? (u?.isVerified === true || u?.lecturerVerificationStatus === "approved") && u?.lecturerVerificationStatus !== "pending" && u?.lecturerVerificationStatus !== "rejected"
          : paidVerificationActive(s);
        setBookOwnerProfile({
          uid: ownerUid, name, title, lecturerMode,
          photoURL: u?.photoURL || u?.photoBase64 || s?.photoURL || s?.photoBase64 || null,
          institution: u?.institution || u?.university || s?.university || "",
          location: s?.businessInfo?.state || s?.businessInfo?.country || u?.state || u?.country || "",
          shop: s?.businessInfo?.businessName || "",
          bio: s?.businessInfo?.businessDescription || u?.bio || "",
          verified,
          booksSold: s?.booksSold || 0,
          slug: s?.slug || makeSlug(title, u?.firstName, u?.surname) || makeSlug(u?.firstName, u?.surname),
        });
        setOwnerFollowers(followsSnap ? followsSnap.size : 0);
        if (typeof s?.booksSold === "number" && s.booksSold > 0) setSellerSoldCount(s.booksSold);
      } catch (err) {
        console.error("owner profile error:", err);
        setBookOwnerProfile(null);
      } finally { setLoadingOwnerProfile(false); }
    })();
  }, [book]);

  useEffect(() => {
    if (!bookId) return;
    (async () => {
      try {
        const viewRef = doc(db, "bookViews", bookId);
        const viewSnap = await getDoc(viewRef);
        if (viewSnap.exists()) {
          setViewCount((viewSnap.data().count || 0) + 1);
          await updateDoc(viewRef, { count: increment(1), lastViewed: serverTimestamp() });
        } else {
          setViewCount(1);
          await setDoc(viewRef, { bookId, count: 1, lastViewed: serverTimestamp() });
        }
      } catch { }
    })();
  }, [bookId]);

  useEffect(() => {
    if (!bookId) return;
    (async () => {
      try {
        setLoadingPhysical(true);
        const cleanId = bookId.replace("firestore-", "");
        const allSnap = await getDocs(query(collection(db, "physicalInventory"), where("bookId", "in", [cleanId, bookId]), limit(1)));
        setPhysicalInventory(allSnap.empty ? null : { id: allSnap.docs[0].id, ...allSnap.docs[0].data() });
      } catch { } finally { setLoadingPhysical(false); }
    })();
  }, [bookId]);

  useEffect(() => {
    if (!bookId) return;
    (async () => {
      try {
        const variants = [bookId, bookId.replace("firestore-", ""), `firestore-${bookId.replace("firestore-", "")}`];
        let all = [];
        for (const id of variants) {
          const snap = await getDocs(query(collection(db, "bookFeedbacks"), where("bookId", "==", id)));
          snap.forEach((d) => all.push(d.data()));
        }
        const seen = new Set();
        all = all.filter((f) => { if (seen.has(f.userId)) return false; seen.add(f.userId); return true; });
        const total = all.length;
        setTotalRatings(total);
        setBookFeedbackCount(total);
        if (total > 0) {
          const positive = all.filter((f) => f.feedback?.trim().length > 0).length;
          const pct = Math.round((positive / total) * 100);
          setPositiveRatingPercent(pct > 0 ? pct : Math.min(75 + Math.floor(total * 2), 98));
        }
      } catch { }
    })();
  }, [bookId]);

  useEffect(() => {
    (async () => {
      if (!user) return;
      const snap = await getDocs(query(collection(db, "follows"), where("followerId", "==", user.uid)));
      setFollowingIds(new Set(snap.docs.map((d) => d.data().lecturerId)));
    })();
  }, [user]);

  const handleBuyPhysical = () => {
    const cId = bookId?.replace("firestore-", "") || book?.firestoreId || bookId;
    router.push(`/book/buy-physical?bookId=${cId}`);
  };

  const handleFollowOwner = async (e) => {
    e.preventDefault();
    if (!user) { router.push("/signin"); return; }
    const ownerId = bookOwnerProfile?.uid;
    if (!ownerId || ownerId === user.uid || followLoadingIds.has(ownerId)) return;
    setFollowLoadingIds((prev) => new Set([...prev, ownerId]));
    const followRef = doc(db, "follows", `${user.uid}_${ownerId}`);
    try {
      if (followingIds.has(ownerId)) {
        await deleteDoc(followRef);
        setFollowingIds((prev) => { const n = new Set(prev); n.delete(ownerId); return n; });
        setOwnerFollowers((n) => Math.max(0, n - 1));
      } else {
        await setDoc(followRef, { followerId: user.uid, lecturerId: ownerId, lecturerName: bookOwnerProfile?.name || "", createdAt: serverTimestamp() });
        setFollowingIds((prev) => new Set([...prev, ownerId]));
        setOwnerFollowers((n) => n + 1);
      }
    } catch (err) { console.error("follow error:", err); }
    finally { setFollowLoadingIds((prev) => { const n = new Set(prev); n.delete(ownerId); return n; }); }
  };

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (cu) => {
      if (cu) {
        setUser(cu);
        await checkSellerStatus(cu.uid);
        await checkPurchaseStatus(cu.uid);
        await checkSavedStatus(cu.uid);
      } else { router.push("/signin"); }
    });
    return () => unsub();
  }, [router]);

  const HandleClick = () => {
    if (!user) { router.push("/signin"); return; }
    router.push(isSeller ? "/upload-document" : "/become-seller");
  };

  const handleMyAccountClick = async () => {
    if (!user) { router.push("/signin"); return; }
    try {
      const snap = await getDoc(doc(db, "users", user.uid));
      if (!snap.exists()) { router.push("/role-selection"); return; }
      const data = snap.data();
      if (!data.role || data.role === "") { router.push("/role-selection"); return; }
      if (data.role === "student") router.push("/student/dashboard");
      else if (data.role === "seller" || data.isSeller) router.push("/my-account/seller-account");
      else router.push("/student/dashboard");
    } catch { router.push("/student/dashboard"); }
  };

  useEffect(() => {
    const handleVisibility = async () => { if (!document.hidden && user) await checkPurchaseStatus(user.uid); };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [user, bookId]);

  useEffect(() => { if (user && bookId) checkPurchaseStatus(user.uid); }, [user, bookId]);

  /* ── Load the book. Title always comes from Firestore's bookTitle, never the id ── */
  useEffect(() => {
    const fetchBook = async () => {
      try {
        setLoading(true);
        setIsGloballyFrozen(false); setIsPrintLicensingEnabled(false);
        setIsPurchased(false); setIsSaved(false); setBook(null);
        setViewCount(0); setPositiveRatingPercent(null); setTotalRatings(0);
        setBookFeedbackCount(0); setPdfPageCount(null); setCalculatingPages(false);
        setNegSettings(null); setNegMeta({ on: false, pct: 0, academic: false });
        setShowNegotiation(false);

        const bookData = await fetchBookDetails(bookId);
        const cId = bookId?.replace("firestore-", "");
        let raw = null;
        if (cId) {
          const snap = await getDoc(doc(db, "advertMyBook", cId));
          if (snap.exists()) raw = snap.data();
        }

        if (bookData || raw) {
          const merged = bookData
            ? { ...bookData }
            : {
                id: `firestore-${cId}`, firestoreId: cId, isFromFirestore: true,
                title: raw.bookTitle || raw.title, author: raw.author, category: raw.category,
                price: Number(raw.price) || 0, isFree: raw.isFree, pages: raw.pages,
                format: raw.format || "PDF", description: raw.description,
                driveFileId: raw.driveFileId, pdfUrl: raw.pdfUrl, embedUrl: raw.embedUrl,
                previewUrl: raw.previewUrl, coverImage: raw.coverImage,
                userId: raw.userId, sellerId: raw.sellerId, sellerName: raw.sellerName,
              };
          const realTitle = raw?.bookTitle || raw?.title;
          if (realTitle && looksLikeId(merged.title, cId)) merged.title = realTitle;
                   if (!merged.title) merged.title = "Untitled document";
                   if (raw) {
                     /* The uploaded document is the source of truth for the cover, same as the list pages */
                     merged.driveFileId = raw.driveFileId || merged.driveFileId;
                     merged.embedUrl = raw.embedUrl || merged.embedUrl;
                     merged.pdfUrl = raw.pdfUrl || merged.pdfUrl;
                     merged.coverImage =
                       raw.coverImage || raw.image || merged.coverImage;
                     merged.image = raw.coverImage || raw.image || merged.image;
                   }
const staticBook = booksData.find((b) => String(b.id).replace("firestore-", "") === String(cId));
if (staticBook) {
  merged.image = merged.image || staticBook.image;
  merged.coverImage = merged.coverImage || staticBook.coverImage;
  merged.driveFileId = merged.driveFileId || staticBook.driveFileId;
  merged.embedUrl = merged.embedUrl || staticBook.embedUrl;
  merged.pdfUrl = merged.pdfUrl || staticBook.pdfUrl;
}
          if (!merged.author && raw?.author) merged.author = raw.author;
          setBook(merged);
        }

      if (raw) {
  setIsPrintLicensingEnabled(raw.isPrintLicensingEnabled === true);
  setIsGloballyFrozen(raw.isGloballyFrozen === true);
  if (Number(raw.purchases) > 0) setBookSalesCount({ [cId]: Number(raw.purchases) });
}

// read from both sources, one call
const ns = getNegotiationSettings({ ...(bookData || {}), ...(raw || {}) });
setNegSettings(ns);
setNegMeta({ on: !!ns.enabled, pct: ns.maxPct, academic: ns.mode === "discount" });
console.log("NEG debug:", { isNegotiable: raw?.isNegotiable, maxDiscountPercent: raw?.maxDiscountPercent, intent: raw?.intent, parsed: ns });

      } catch (err) { console.error("fetchBook error:", err); }
      finally { setLoading(false); }
    };
    if (bookId) fetchBook();
  }, [bookId]);

  /* ── Suggestions ── */
  useEffect(() => {
    (async () => {
      const toBook = (d, free) => {
        const data = d.data();
        if (!data.bookTitle || data.isGloballyFrozen === true) return null;
        return {
          id: `firestore-${d.id}`, firestoreId: d.id, title: data.bookTitle, author: data.author,
          category: data.category, price: free ? 0 : data.price, isFree: free ? true : data.isFree,
          accessType: free ? "free" : data.accessType, pages: data.pages, format: data.format || "PDF",
          driveFileId: data.driveFileId, pdfUrl: data.pdfUrl, embedUrl: data.embedUrl,
          coverImage: data.coverImage || null,
          image: data.image || data.coverImage || null,
          isFromFirestore: true,
                };
      };
      let freeBooks = []; let paidBooks = [];
      try {
        const [freeSnap, paidSnap] = await Promise.all([
          getDocs(query(collection(db, "advertMyBook"), where("isFree", "==", true), where("status", "==", "approved"), limit(8))),
          getDocs(query(collection(db, "advertMyBook"), where("status", "==", "approved"), where("price", ">", 0), limit(8))),
        ]);
        freeBooks = freeSnap.docs.map((d) => toBook(d, true)).filter(Boolean);
        paidBooks = paidSnap.docs.map((d) => toBook(d, false)).filter(Boolean);
      } catch { }
      setSuggestedFreeBooks([...freeBooks, ...booksData.filter((b) => isOpenAccess(b))].slice(0, 6));
      setSuggestedPaidBooks(paidBooks.filter((b) => !isOpenAccess(b)).slice(0, 6));
    })();
  }, []);

  const checkPurchaseStatus = async (userId) => {
    try {
      const ud = await getDoc(doc(db, "users", userId));
      if (ud.exists()) {
        const pb = ud.data().purchasedBooks || {};
        const cId = bookId?.replace("firestore-", "");
        let purchased = pb[bookId] || pb[cId] || pb[`firestore-${cId}`] || pb[`oa_${cId}`];
        if (!purchased)
          purchased = Object.keys(pb).some((key) => {
            const ck = key.replace("firestore-", "");
            return key === bookId || key === cId || ck === bookId || ck === cId;
          });
        if (purchased && book?.isBountyFulfillment) {
          const bountySnap = await getDoc(doc(db, "bounties", book.bountyId));
          if (bountySnap.exists() && bountySnap.data().postedByUid !== userId) { setIsPurchased(false); return; }
        }
        setIsPurchased(!!purchased);
        if (purchased && searchParams.get("purchased") === "true") {
          showToastMessage("Purchase successful! You now have full access.");
          const url = new URL(window.location);
          url.searchParams.delete("purchased");
          window.history.replaceState({}, "", url);
        }
      } else setIsPurchased(false);
    } catch { setIsPurchased(false); }
  };

  const checkSavedStatus = async (userId) => {
    try {
      const ud = await getDoc(doc(db, "users", userId));
      if (ud.exists()) {
        const saved = ud.data().savedBooks || [];
        setIsSaved(Array.isArray(saved) ? saved.some((b) => b.id === bookId) : saved[bookId] !== undefined);
      }
    } catch { }
  };

  const handleSaveForLater = async () => {
    try {
      if (!user) { alert("Please sign in to save books"); return; }
      const ref = doc(db, "users", user.uid);
      const snap = await getDoc(ref);
      let arr = snap.exists() ? snap.data().savedBooks || [] : [];
      if (isSaved) {
        arr = arr.filter((b) => b.id !== bookId);
        setIsSaved(false); showToastMessage("Removed from saved books");
      } else {
        arr.push({ id: book.id, title: book.title, author: book.author, price: book.price, savedAt: new Date().toISOString() });
        setIsSaved(true); showToastMessage("Saved for later!");
      }
      await updateDoc(ref, { savedBooks: arr });
      setShowOptionsModal(false);
    } catch { alert("Error saving book. Please try again."); }
  };

  const handlePurchase = () => {
    const cId = bookId?.replace("firestore-", "") || book?.firestoreId || bookId;
    router.push(`/payment?bookId=${cId}`);
  };

  const handleFreeAccess = async () => {
    if (!user) { router.push("/signin"); return; }
    try {
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);
      const pb = userSnap.exists() ? (userSnap.data().purchasedBooks || {}) : {};
      const cId = bookId?.replace("firestore-", "");
      const key = cId || bookId;
      if (!pb[key] && !pb[bookId]) {
        await updateDoc(userRef, {
          [`purchasedBooks.${key}`]: { bookId: key, title: book?.title || "", author: book?.author || "", price: 0, isFree: true, savedAt: new Date().toISOString() },
        });
      }
      showToastMessage("Saved to your library! Opening in My Books…");
      setTimeout(() => router.push("/my-books"), 1200);
    } catch { router.push("/my-books"); }
  };

    /* Free documents show the ad modal first. Already-saved ones just open My Books. */
  const requestFreeSave = () => {
    if (!user) { router.push("/signin"); return; }
    if (isPurchased) { router.push("/my-books"); return; }
    setShowSaveAd(true);
  };

  const handleShare = () => {
    if (navigator.share) navigator.share({ title: `LAN Library | ${book.title}`, text: `Check out "${book.title}" by ${book.author}`, url: window.location.href });
    else { navigator.clipboard.writeText(window.location.href); showToastMessage("Link copied to clipboard!"); }
    setShowOptionsModal(false);
  };

  const submitFeedback = async () => {
    try {
      setIsSubmittingFeedback(true);
      await addDoc(collection(db, "bookFeedbacks"), {
        bookId, bookTitle: book?.title || "Unknown Book", bookAuthor: book?.author || "Unknown Author",
        userId: user?.uid, userEmail: user?.email,
        userName: user?.displayName || user?.email?.split("@")[0] || "Anonymous",
        feedback: feedbackText.trim(), rating: feedbackRating,
        helpfulCount: 0, unhelpfulCount: 0, createdAt: serverTimestamp(),
      });
      setFeedbackRating(0); setFeedbackText(""); setShowFeedbackModal(false);
      setBookFeedbackCount((prev) => prev + 1);
      showToastMessage("Feedback submitted! Redirecting...");
      setTimeout(() => router.push(`/book/feedbacks?bookId=${bookId}`), 1000);
    } catch { showToastMessage("Error submitting feedback. Try again."); }
    finally { setIsSubmittingFeedback(false); }
  };

  const formatViews = (n) => n >= 1000000 ? `${(n / 1000000).toFixed(1)}M` : n >= 1000 ? `${(n / 1000).toFixed(1)}K` : String(n);

  /* ───────────── early returns ───────────── */
  if (loading) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: BG }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ width: "56px", height: "56px", border: `3px solid ${GOLD}`, borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 16px" }} />
        <p style={{ fontFamily: "'Playfair Display',serif", fontSize: "18px", color: NAVY }}>Loading…</p>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    </div>
  );

  if (!book) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: BG }}>
      <div style={{ textAlign: "center" }}>
        <p style={{ fontFamily: "'Playfair Display',serif", fontSize: "22px", fontWeight: 700, color: NAVY, marginBottom: "12px" }}>Book Not Found</p>
        <Link href="/home" style={{ color: GOLD, fontFamily: "'Lato',sans-serif", fontWeight: 700 }}>Return to Home</Link>
      </div>
    </div>
  );

  /* ───────────── derived values ───────────── */
  const free = isOpenAccess(book);
  const cleanId = String(book.id || "").replace("firestore-", "");
  const sold = bookSalesCount[cleanId] || bookSalesCount[book.firestoreId] || sellerSoldCount || 0;
  const uploaderName = getUploaderName();
  const displayPages = getDisplayPages();
  const canBuy = !free && !isPurchased && !isGloballyFrozen;

  /* Negotiation wording depends on who is looking and what the seller allows */
  const negInfo = () => {
if (!negMeta.on || !canBuy || user?.uid === negSettings?.sellerId) return null;
    const pct = negMeta.pct;
    if (negMeta.academic && viewerType === "student")
      return { title: "Request student discount", sub: pct ? `Up to ${pct}% off for students` : "Ask the lecturer for a discount" };
    if (negMeta.academic)
      return { title: "Make an offer", sub: pct ? `Lecturer allows up to ${pct}% off` : "Send the lecturer an offer" };
    return { title: "Negotiate price", sub: pct ? `Offer up to ${pct}% less` : "Send the seller an offer" };
  };
  const neg = negInfo();

const goNegotiate = () => {
  setBuyMenu(null);
  setShowOptionsModal(false);
  if (!user) { router.push("/signin"); return; }
  if (!negSettings?.enabled) { showToastMessage("This seller isn't taking offers right now."); return; }
  openNegotiation(negId(cleanBookId, user.uid), {
    bookId: cleanBookId,
    bookTitle: book.title,
    listPrice: negSettings.listPrice,
    maxPct: negSettings.maxPct,
    mode: negSettings.mode,
    sellerId: negSettings.sellerId,
    sellerName: bookOwnerProfile?.name || book?.sellerName || "Seller",
    cover: book?.image || null,
  });
};

  /* ───────────── render helpers (plain functions, so nothing remounts) ───────────── */

  /* Navy split button. The arrow lists Purchase and Negotiation / Discount. */
  const renderBuyButton = (slot, opts = {}) => {
    if (!canBuy) return null;
    const open = buyMenu === slot;
    const studentDiscount = negMeta.academic && viewerType === "student";
    return (
      <div style={{ position: "relative", width: "100%" }}>
        {open && <div onClick={() => setBuyMenu(null)} style={{ position: "fixed", inset: 0, zIndex: 30 }} />}
        <div style={{ display: "flex", position: "relative", zIndex: 31 }}>
          <button className="buy-main" onClick={handlePurchase}>
            <Download size={16} /> Purchase · {fmt(book.price)}
          </button>
          <button className="buy-arrow" onClick={() => setBuyMenu(open ? null : slot)} aria-label="Purchase and price options" aria-expanded={open}>
            <ChevronDown size={18} style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform .18s" }} />
          </button>
        </div>
        {open && (
          <div className="buy-menu" style={opts.up ? { bottom: "calc(100% + 6px)" } : { top: "calc(100% + 6px)" }}>
            <button className="buy-item" onClick={() => { setBuyMenu(null); handlePurchase(); }}>
              <span className="buy-ico"><Download size={16} /></span>
              <span style={{ textAlign: "left" }}>
                <strong>Purchase</strong>
                <em>Pay {fmt(book.price)} and get full access</em>
              </span>
            </button>
            {neg ? (
              <button className="buy-item" onClick={goNegotiate}>
                <span className="buy-ico">{studentDiscount ? <GraduationCap size={16} /> : <Tag size={16} />}</span>
                <span style={{ textAlign: "left" }}>
                  <strong>{neg.title}</strong>
                  <em>{neg.sub}</em>
                </span>
              </button>
            ) : (
              <div className="buy-item" style={{ cursor: "default", opacity: 0.7 }}>
  <span className="buy-ico"><Lock size={16} /></span>
  <span style={{ textAlign: "left" }}>
    <strong>Fixed price</strong>
    <em>
      {user?.uid && user.uid === negSettings?.sellerId
        ? "This is your own listing"
        : "The seller is not taking offers"}
    </em>
  </span>
</div>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderAssurance = () => canBuy ? (
    <div style={{ display: "flex", flexDirection: "column", gap: 6, margin: "10px 2px 0", fontFamily: "'Lato',sans-serif", fontSize: 11, color: "#777" }}>
      <span style={{ display: "flex", alignItems: "center", gap: 7 }}><Zap size={12} style={{ color: GOLD }} /> Opens in My Books right after payment</span>
      <span style={{ display: "flex", alignItems: "center", gap: 7 }}><ShieldCheck size={12} style={{ color: GOLD }} /> Secure checkout</span>
    </div>
  ) : null;

  const renderPageCount = (fontSize = "10px") => {
    const showCalculating = free && !isSellerBook(book) && calculatingPages;
    if (showCalculating) return <span className="calculating-pages" style={{ fontSize, fontFamily: "'Lato',sans-serif", color: GOLD, fontWeight: 700 }}>Calculating…</span>;
    if (displayPages == null) return null;
    return <span style={{ fontSize, fontFamily: "'Lato',sans-serif" }}>{displayPages}p</span>;
  };

  const renderOwnerPanel = () => {
    if (loadingOwnerProfile) {
      return (
        <div style={{ background: "#fff", border: "0.5px solid #e5ddd0", padding: "20px" }}>
          <div style={{ display: "flex", gap: 14, animation: "pulse2 1.5s infinite" }}>
            <div style={{ width: 72, height: 72, borderRadius: 22, background: "#f0ebe0", flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div style={{ height: 12, background: "#f0ebe0", marginBottom: 8, width: "60%" }} />
              <div style={{ height: 9, background: "#f7f0e8", width: "40%" }} />
            </div>
          </div>
        </div>
      );
    }
    if (!bookOwnerProfile) return null;
    const p = bookOwnerProfile;
    const isFollowing = followingIds.has(p.uid);
    const isFollowLoading = followLoadingIds.has(p.uid);
    const isOwnBook = user?.uid === p.uid;
    const profileHref = p.slug ? `/profile/${p.slug}` : `/seller-profile?sellerId=${p.uid}`;
    const displayName = `${p.title ? p.title + " " : ""}${p.name}`;
    const initials = (p.name || "?").trim().split(/\s+/).filter(Boolean).map((w, i, a) => (i === 0 || i === a.length - 1 ? w[0] : "")).join("").toUpperCase();
    const subRow = { display: "flex", alignItems: "center", gap: 5, margin: "3px 0 0", fontSize: 12, color: "#888", fontFamily: "'Lato',sans-serif", minWidth: 0 };
    const ell = { overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", minWidth: 0 };
    return (
      <div style={{ background: "#fff", border: "0.5px solid #e5ddd0", padding: "20px" }}>
        <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: GOLD, margin: "0 0 12px", fontFamily: "'Lato',sans-serif" }}>Uploaded By</p>
        <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
          <div style={{ position: "relative", width: 72, height: 72, flexShrink: 0 }}>
            <Link href={profileHref} aria-label={`Open ${displayName}'s profile`}
              style={{ position: "relative", width: "100%", height: "100%", borderRadius: 22, overflow: "hidden", border: `${p.verified ? 2 : 1}px solid ${p.verified ? "#1d9bf0" : "#e5ddd0"}`, background: NAVY, display: "flex", alignItems: "center", justifyContent: "center", textDecoration: "none" }}>
              <span style={{ color: GOLD, fontSize: 24, fontWeight: 900, fontFamily: "'Playfair Display',serif" }}>{initials}</span>
              {p.photoURL && <img src={p.photoURL} alt="" onError={(e) => { e.currentTarget.style.display = "none"; }} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "top center" }} />}
            </Link>
            {p.verified && <VerifiedBadge size={20} ring="#fff" style={{ position: "absolute", right: -4, bottom: -4 }} />}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <Link href={profileHref} style={{ textDecoration: "none", minWidth: 0 }}>
              <span style={{ ...ell, display: "block", fontFamily: "'Playfair Display',serif", fontSize: 16, fontWeight: 700, color: NAVY, lineHeight: 1.25 }}>{displayName}</span>
            </Link>
            {p.institution && <p style={{ ...subRow, marginTop: 2 }}><span style={ell}>{p.institution}</span></p>}
            {p.location && <p style={subRow}><MapPin size={11} style={{ color: GOLD, flexShrink: 0 }} /><span style={ell}>{p.location}</span></p>}
            {p.shop && <p style={subRow}><Store size={11} style={{ color: GOLD, flexShrink: 0 }} /><span style={ell}>{p.shop}</span></p>}
            {p.verified && <p style={{ ...subRow, color: "#1d9bf0", fontWeight: 700 }}><VerifiedBadge size={12} /> {p.lecturerMode || p.title ? "Verified faculty" : "Verified seller"}</p>}
          </div>
        </div>
        {p.bio && <p style={{ fontSize: 12, color: "#666", lineHeight: 1.65, margin: "14px 0 0", fontFamily: "'Lato',sans-serif", display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden", wordBreak: "break-word" }}>{p.bio}</p>}
        <div style={{ display: "flex", gap: 8, margin: "14px 0 0" }}>
          {[
            { icon: <Users size={12} style={{ color: GOLD }} />, label: `${ownerFollowers} follower${ownerFollowers === 1 ? "" : "s"}` },
            { icon: <ShoppingBag size={12} style={{ color: GOLD }} />, label: `${p.booksSold} sold` },
          ].map(({ icon, label }) => (
            <div key={label} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, background: CREAM, border: "0.5px solid #f0ebe0", padding: "8px 6px", fontSize: 11, fontWeight: 700, color: NAVY, fontFamily: "'Lato',sans-serif" }}>{icon}{label}</div>
          ))}
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
          <Link href={profileHref} style={{ flex: 1, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6, background: GOLD, color: NAVY, padding: "11px 8px", borderRadius: 8, fontSize: 12, fontWeight: 700, textDecoration: "none", fontFamily: "'Lato',sans-serif", letterSpacing: "0.04em" }}>View profile</Link>
          {!isOwnBook && (
            <button onClick={handleFollowOwner} disabled={isFollowLoading}
              style={{ flex: 1, padding: "11px 8px", borderRadius: 8, border: isFollowing ? "0.5px solid #86efac" : "none", background: isFollowing ? "rgba(22,163,74,0.08)" : "#ece6da", color: isFollowing ? "#16a34a" : NAVY, fontSize: 12, fontWeight: 700, cursor: isFollowLoading ? "wait" : "pointer", fontFamily: "'Lato',sans-serif", letterSpacing: "0.04em", transition: "background .15s" }}>
              {isFollowLoading ? "…" : isFollowing ? "✓ Following" : "+ Follow"}
            </button>
          )}
        </div>
      </div>
    );
  };

  const renderPhysicalStock = () => {
    if (loadingPhysical) return (
      <div style={{ margin: "0 16px 0", padding: "14px 16px", background: "#fff", border: "0.5px solid #e5ddd0", display: "flex", alignItems: "center", gap: "10px" }}>
        <div style={{ width: "16px", height: "16px", border: `2px solid ${GOLD}`, borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite", flexShrink: 0 }} />
        <span style={{ fontSize: "11px", color: "#aaa", fontFamily: "'Lato',sans-serif" }}>Checking physical availability…</span>
      </div>
    );
    if (!physicalInventory) return (
      <div style={{ margin: "0 16px 0", padding: "14px 16px", background: "#fff", border: "0.5px solid #e5ddd0", display: "flex", alignItems: "center", gap: "12px" }}>
        <div style={{ width: "36px", height: "36px", background: "#f5f1ea", border: "0.5px solid #e5ddd0", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><HelpCircle size={16} style={{ color: "#ccc" }} /></div>
        <div>
          <p style={{ fontSize: "11px", fontWeight: 700, color: "#aaa", margin: "0 0 2px", fontFamily: "'Lato',sans-serif", textTransform: "uppercase", letterSpacing: "0.06em" }}>Physical Copy</p>
          <p style={{ fontSize: "12px", color: "#bbb", margin: 0, fontFamily: "'Lato',sans-serif" }}>No physical deposit yet for this research</p>
        </div>
      </div>
    );
    const stock = physicalInventory.currentStock || 0;
    const shelf = physicalInventory.shelfLocation || "";
    const section = physicalInventory.section || "";
    if (stock === 0) return (
      <div style={{ margin: "0 16px 0", padding: "14px 16px", background: "#fff", border: "0.5px solid #f0ebe0" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{ width: "36px", height: "36px", background: "#fff5f5", border: "0.5px solid #fecaca", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><AlertCircle size={16} style={{ color: "#f87171" }} /></div>
          <div>
            <p style={{ fontSize: "11px", fontWeight: 700, color: "#f87171", margin: "0 0 2px", fontFamily: "'Lato',sans-serif", textTransform: "uppercase", letterSpacing: "0.06em" }}>Out of Stock</p>
            <p style={{ fontSize: "12px", color: "#aaa", margin: 0, fontFamily: "'Lato',sans-serif" }}>Physical copies currently out of stock at LAN Head Office Abuja</p>
          </div>
        </div>
      </div>
    );
    return (
      <div className="physical-available" style={{ margin: "0 16px 0", padding: "16px", background: "#fff", border: `1.5px solid ${GOLD}` }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
          <div style={{ width: "38px", height: "38px", background: NAVY, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Package size={17} style={{ color: GOLD }} /></div>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px", flexWrap: "wrap" }}>
              <span style={{ fontSize: "10px", fontWeight: 700, color: GOLD, fontFamily: "'Lato',sans-serif", textTransform: "uppercase", letterSpacing: "0.1em" }}>Physical Copy Available</span>
              <span style={{ background: "rgba(34,197,94,0.12)", border: "0.5px solid rgba(34,197,94,0.3)", color: "#16a34a", fontSize: "9px", fontWeight: 700, padding: "2px 7px", fontFamily: "'Lato',sans-serif" }}>{stock} in stock</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "5px", marginBottom: "3px" }}>
              <MapPin size={11} style={{ color: GOLD, flexShrink: 0 }} />
              <span style={{ fontSize: "12px", color: NAVY, fontWeight: 700, fontFamily: "'Lato',sans-serif" }}>LAN Head Office — Abuja Registry</span>
            </div>
            {(shelf || section) && <p style={{ fontSize: "11px", color: "#888", margin: "0 0 10px", fontFamily: "'Lato',sans-serif" }}>{section && <span>Section: <strong style={{ color: NAVY }}>{section}</strong></span>}{section && shelf && <span> &nbsp;·&nbsp; </span>}{shelf && <span>Shelf: <strong style={{ color: NAVY }}>{shelf}</strong></span>}</p>}
            <button onClick={handleBuyPhysical} style={{ display: "flex", alignItems: "center", gap: "6px", background: NAVY, color: "#fff", padding: "9px 16px", border: "none", fontSize: "11px", fontWeight: 700, cursor: "pointer", fontFamily: "'Lato',sans-serif", letterSpacing: "0.06em" }}>
              <ShoppingBag size={13} /> Get Physical Copy — {fmt(book.price)}
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderPdfViewer = (fullHeight = "900px") => {
    const hasAccess = isPurchased || free;
    if (!hasAccess) {
      return (
        <div style={{ background: BG }}>
          <LockedPreview book={book} total={displayPages} footer={<>{renderBuyButton("locked", { up: true })}{renderAssurance()}</>} />
        </div>
      );
    }
    return (
      <div style={{ background: BG }}>
        <div style={{ padding: "16px" }}>
          {free && !isPurchased && (
            <div style={{ background: "rgba(22,163,74,0.08)", border: "0.5px solid rgba(22,163,74,0.25)", padding: "12px 16px", marginBottom: "14px", display: "flex", alignItems: "center", gap: "10px" }}>
              <Unlock size={15} style={{ color: "#16a34a", flexShrink: 0 }} />
              <p style={{ fontSize: "12px", color: "#15803d", margin: 0, fontFamily: "'Lato',sans-serif", fontWeight: 700 }}>This is an Open Access document — reading is free. Save to your library with one click.</p>
            </div>
          )}
          {book.embedUrl ? (
            <div style={{ position: "relative" }}>
              <iframe src={book.embedUrl} style={{ width: "100%", height: fullHeight, border: "none", display: "block" }} title={book.title} allow="autoplay" />
              {!free && <div style={{ position: "absolute", top: 0, right: 0, height: "76px", width: "220px", background: "#323639", zIndex: 10, display: "flex", alignItems: "center", justifyContent: "flex-end", padding: "0 20px", gap: "8px" }} onContextMenu={(e) => e.preventDefault()}>
                <span style={{ color: GOLD, fontSize: "10px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: "'Lato',sans-serif" }}>LAN Library</span>
                <Lock size={14} style={{ color: "#888" }} />
              </div>}
            </div>
          ) : book.pdfUrl ? (
            <iframe src={`${book.pdfUrl}#view=FitH`} style={{ width: "100%", height: fullHeight, border: "none", display: "block" }} title={book.title} />
          ) : (
            <div style={{ background: "#fff", padding: "24px", border: "0.5px solid #e5ddd0" }}>
              <div style={{ background: "#f0fdf4", border: "0.5px solid #86efac", padding: "14px 18px", marginBottom: "20px", display: "flex", alignItems: "center", gap: "12px" }}>
                <CheckCircle size={20} style={{ color: "#16a34a", flexShrink: 0 }} />
                <div>
                  <p style={{ fontWeight: 700, color: "#15803d", margin: "0 0 2px", fontSize: "13px", fontFamily: "'Lato',sans-serif" }}>{free ? "Open Access Document" : "Full Access Granted"}</p>
                  <p style={{ fontSize: "12px", color: "#166534", margin: 0, fontFamily: "'Lato',sans-serif" }}>You have full access to {book.title}</p>
                </div>
              </div>
              <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: "20px", fontWeight: 700, color: NAVY, margin: "0 0 12px" }}>{book.title}</h3>
              <p style={{ fontSize: "13px", color: "#666", lineHeight: 1.75 }}>{book.description}</p>
            </div>
          )}
          {free && (
            <div style={{ marginTop: "16px", background: "#fff", border: `0.5px solid rgba(184,150,62,0.3)`, padding: "18px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
              <div>
                <p style={{ fontSize: "11px", fontWeight: 700, color: GOLD, letterSpacing: "0.1em", textTransform: "uppercase", margin: "0 0 2px", fontFamily: "'Lato',sans-serif" }}>Open Access</p>
                <p style={{ fontSize: "13px", fontWeight: 700, color: NAVY, margin: 0, fontFamily: "'Lato',sans-serif" }}>Save a copy to your library</p>
              </div>
              <button onClick={requestFreeSave} style={{ display: "flex", alignItems: "center", gap: "8px", background: NAVY, color: GOLD, padding: "11px 22px", border: `0.5px solid ${GOLD}`, fontSize: "12px", fontWeight: 700, cursor: "pointer", fontFamily: "'Lato',sans-serif", letterSpacing: "0.06em" }}>
                <Download size={14} /> Save to My Books
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderSuggested = (rb) => (
    <Link key={rb.id} href={`/book/preview?id=${String(rb.id).replace("firestore-", "")}`} style={{ textDecoration: "none", display: "flex", gap: "10px" }}>
      <div style={{ position: "relative", flexShrink: 0, width: "52px" }}>
        <BookCover book={rb} title={rb.title} titleSize={7} fit="cover" />
        <span style={{ position: "absolute", top: "4px", left: "4px", background: NAVY, color: GOLD, fontSize: "7px", fontWeight: 700, padding: "2px 5px", fontFamily: "'Lato',sans-serif" }}>PDF</span>
        {isOpenAccess(rb) && <span style={{ position: "absolute", bottom: "4px", left: "4px", background: "#16a34a", color: "#fff", fontSize: "7px", fontWeight: 700, padding: "2px 5px", fontFamily: "'Lato',sans-serif" }}>FREE</span>}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <h4 style={{ fontFamily: "'Playfair Display',serif", fontSize: "11px", fontWeight: 700, color: NAVY, margin: 0, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", lineHeight: 1.35 }}>{rb.title}</h4>
        {rb.pages && <p style={{ fontSize: "10px", color: "#aaa", margin: "2px 0 0", fontFamily: "'Lato',sans-serif" }}>{rb.pages}p</p>}
      </div>
    </Link>
  );

  const renderSuggestionsCard = (compact) => (
    <div style={{ background: "#fff", border: "0.5px solid #e5ddd0", padding: "20px" }}>
      <p style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: GOLD, margin: "0 0 4px", fontFamily: "'Lato',sans-serif" }}>Discover</p>
      <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: "16px", fontWeight: 700, color: NAVY, margin: "0 0 16px" }}>You Might Also Like</h3>
      {suggestedFreeBooks.length > 0 && (
        <>
          <div style={{ display: "flex", alignItems: "center", gap: "7px", marginBottom: "10px", paddingBottom: "6px", borderBottom: "0.5px solid rgba(22,163,74,0.15)" }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#16a34a", display: "inline-block" }} />
            <span style={{ fontSize: "9px", fontWeight: 700, color: "#16a34a", fontFamily: "'Lato',sans-serif", letterSpacing: "0.1em", textTransform: "uppercase" }}>Open Access</span>
          </div>
          <div style={compact ? { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "12px" } : { display: "flex", flexDirection: "column", gap: "12px", marginBottom: "12px" }}>
            {(compact ? suggestedFreeBooks.slice(0, 4) : suggestedFreeBooks).map(renderSuggested)}
          </div>
          <Link href="/open-access" style={{ display: "block", textAlign: "center", fontSize: "10px", fontWeight: 700, color: "#16a34a", textDecoration: "none", fontFamily: "'Lato',sans-serif", background: "rgba(22,163,74,0.06)", border: "0.5px solid rgba(22,163,74,0.2)", padding: "8px", marginBottom: "16px" }}>View all free docs →</Link>
        </>
      )}
      {suggestedPaidBooks.length > 0 && (
        <>
          <div style={{ display: "flex", alignItems: "center", gap: "7px", marginBottom: "10px", paddingBottom: "6px", borderBottom: "0.5px solid rgba(184,150,62,0.15)" }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: GOLD, display: "inline-block" }} />
            <span style={{ fontSize: "9px", fontWeight: 700, color: GOLD, fontFamily: "'Lato',sans-serif", letterSpacing: "0.1em", textTransform: "uppercase" }}>Premium</span>
          </div>
          <div style={compact ? { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" } : { display: "flex", flexDirection: "column", gap: "12px" }}>
            {(compact ? suggestedPaidBooks.slice(0, 4) : suggestedPaidBooks).map(renderSuggested)}
          </div>
          <Link href="/documents" style={{ display: "block", textAlign: "center", marginTop: "12px", fontSize: "11px", fontWeight: 700, color: GOLD, textDecoration: "none", fontFamily: "'Lato',sans-serif", borderTop: "0.5px solid #f0ebe0", paddingTop: "12px" }}>Browse all documents →</Link>
        </>
      )}
    </div>
  );

  const actionList = (askLabel) => [
    { icon: isGloballyFrozen ? <Lock size={18} style={{ color: "#aaa" }} /> : free ? <Unlock size={18} style={{ color: "#16a34a" }} /> : <Download size={18} />, label: isGloballyFrozen ? "Frozen" : free ? "Save Free" : isPurchased ? "Open" : "Purchase", onClick: isGloballyFrozen ? () => alert("This document is currently frozen.") : free ? requestFreeSave : isPurchased ? () => router.push("/my-books") : handlePurchase },
    { icon: <Bookmark size={18} style={isSaved ? { fill: NAVY, color: NAVY } : {}} />, label: isSaved ? "Saved" : "Save", onClick: handleSaveForLater },
    { icon: <Share2 size={18} />, label: "Share", onClick: handleShare },
    { icon: <ThumbsUp size={18} />, label: positiveRatingPercent !== null ? `${positiveRatingPercent}%` : "Rate", onClick: () => setShowFeedbackModal(true) },
    { icon: <Sparkles size={18} style={{ color: "#a78bfa" }} />, label: askLabel, onClick: () => router.push(`/ai-chat?bookId=${bookId}&bookTitle=${encodeURIComponent(book?.title || "")}`) },
  ];

  const studentDiscountView = negMeta.academic && viewerType === "student";

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400&family=Lato:wght@300;400;700&display=swap');
        .lan-root { font-family:'Lato',sans-serif; background:${BG}; overflow-x:hidden; max-width:100vw; box-sizing:border-box; }
        .action-btn { display:flex; flex-direction:column; align-items:center; gap:5px; background:transparent; border:none; cursor:pointer; color:${NAVY}; font-family:'Lato',sans-serif; transition:opacity 0.18s; }
        .action-btn:hover { opacity:0.7; }
        .action-btn span { font-size:10px; font-weight:700; letter-spacing:0.06em; text-transform:uppercase; }
        .stat-pill { display:flex; align-items:center; gap:6px; background:${NAVY}; color:#fff; padding:8px 12px; font-family:'Lato',sans-serif; font-size:11px; font-weight:700; }
        .gold-pill { display:inline-flex; align-items:center; gap:6px; background:rgba(184,150,62,0.12); border:0.5px solid rgba(184,150,62,0.3); padding:5px 12px; border-radius:999px; }
        @keyframes spin { to{transform:rotate(360deg)} }
        @keyframes pulse2 { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @media(min-width:1024px){ .lg-grid { grid-template-columns:280px 1fr 240px !important; } .lg-hide { display:none !important; } .lg-show { display:block !important; } }
        .lg-show { display:none; }
        *, *::before, *::after { box-sizing:border-box; }
        body { overflow-x:hidden; }
        @keyframes oa-shimmer { 0% { background-position:-200% center; } 100% { background-position:200% center; } }
        .oa-header-badge { background:linear-gradient(90deg,#16a34a 0%,#22c55e 40%,#16a34a 80%); background-size:200% auto; animation:oa-shimmer 2.4s linear infinite; color:#fff; font-size:10px; font-weight:700; letter-spacing:0.08em; text-transform:uppercase; padding:6px 14px; font-family:'Lato',sans-serif; display:inline-flex; align-items:center; gap:5px; }
        @keyframes calc-shimmer { 0%{opacity:1} 50%{opacity:0.35} 100%{opacity:1} }
        .calculating-pages { animation:calc-shimmer 1.4s ease-in-out infinite; }
        @keyframes goldPulse { 0%,100% { box-shadow:0 0 0 0 rgba(184,150,62,0.4); } 50% { box-shadow:0 0 0 6px rgba(184,150,62,0); } }
        .physical-available { animation:goldPulse 2.4s ease-in-out infinite; }
        .lan-header-actions { display:flex; align-items:center; gap:6px; flex-shrink:0; min-width:0; overflow:hidden; }
        @media(max-width:480px){ .oa-header-badge { display:none !important; } .lan-header-cta { font-size:10px !important; padding:7px 10px !important; } }
        @media (prefers-reduced-motion: reduce) { .physical-available, .oa-header-badge, .calculating-pages { animation:none; } }
        button:focus-visible, a:focus-visible { outline:2px solid ${GOLD}; outline-offset:2px; }

        /* split purchase button (navy) */
        .buy-main { flex:1; display:flex; align-items:center; justify-content:center; gap:8px; background:${NAVY}; color:#fff; border:none; padding:14px 16px; font-family:'Lato',sans-serif; font-size:14px; font-weight:700; letter-spacing:0.03em; cursor:pointer; border-radius:10px 0 0 10px; transition:background .15s; }
        .buy-main:hover { background:${NAVY_HOVER}; }
        .buy-arrow { width:52px; display:flex; align-items:center; justify-content:center; background:${NAVY}; color:${GOLD}; border:none; border-left:1px solid rgba(184,150,62,0.55); cursor:pointer; border-radius:0 10px 10px 0; transition:background .15s; }
        .buy-arrow:hover { background:${NAVY_HOVER}; }
        .buy-menu { position:absolute; left:0; right:0; z-index:32; background:#fff; border:0.5px solid #e5ddd0; border-radius:12px; box-shadow:0 14px 40px rgba(13,34,68,0.22); overflow:hidden; }
        .buy-item { width:100%; display:flex; align-items:center; gap:12px; padding:13px 14px; background:#fff; border:none; border-bottom:0.5px solid #f0ebe0; cursor:pointer; color:${NAVY}; font-family:'Lato',sans-serif; }
        .buy-item:last-child { border-bottom:none; }
        button.buy-item:hover { background:${CREAM}; }
        .buy-item strong { display:block; font-size:13px; }
        .buy-item em { display:block; font-style:normal; font-size:11px; color:#888; margin-top:1px; }
        .buy-ico { width:34px; height:34px; display:flex; align-items:center; justify-content:center; background:${CREAM}; border:0.5px solid #e5ddd0; border-radius:8px; color:${GOLD}; flex-shrink:0; }
      `}</style>

      <OpenAccessModal
        isOpen={showSaveAd}
        onClose={() => setShowSaveAd(false)}
        book={{ ...book, driveFileId: driveFileId(book) }}
        countdownSec={10}
      />

      <div className="lan-root" style={{ minHeight: "100vh" }}>
        {/* ══ HEADER ══ */}
        <header style={{ background: NAVY, backgroundImage: "radial-gradient(rgba(184,150,62,0.06) 1px,transparent 1px)", backgroundSize: "24px 24px", position: "sticky", top: 0, zIndex: 40, borderBottom: "0.5px solid rgba(184,150,62,0.2)" }}>
          <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "0 12px", height: "56px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px", overflow: "hidden" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", flexShrink: 0, minWidth: 0 }}>
              <button onClick={() => setShowNavMenu(!showNavMenu)} aria-label="Menu" style={{ width: "34px", height: "34px", flexShrink: 0, border: "0.5px solid rgba(255,255,255,0.2)", background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(255,255,255,0.7)" }}>
                {showNavMenu ? <X size={18} /> : <Menu size={18} />}
              </button>
              <Link href="/home" style={{ textDecoration: "none", minWidth: 0 }}>
                <p style={{ fontFamily: "'Playfair Display',serif", fontSize: "16px", fontWeight: 900, color: "#fff", margin: 0, letterSpacing: "-0.5px", whiteSpace: "nowrap" }}>[LAN Library]</p>
                <p style={{ fontSize: "8px", color: GOLD, fontFamily: "'Lato',sans-serif", fontWeight: 700, letterSpacing: "0.08em", margin: 0, textTransform: "uppercase", whiteSpace: "nowrap" }}>The Global Student Library</p>
              </Link>
            </div>
            <div className="lan-header-actions">
              {isGloballyFrozen ? (
                <div style={{ display: "flex", alignItems: "center", gap: "5px", background: "rgba(99,102,241,0.15)", border: "0.5px solid rgba(99,102,241,0.35)", padding: "5px 10px", flexShrink: 0 }}>
                  <span style={{ fontSize: "10px", fontWeight: 700, color: "#a5b4fc", fontFamily: "'Lato',sans-serif", letterSpacing: "0.08em" }}>❄ FROZEN</span>
                </div>
              ) : free ? (
                <button className="lan-header-cta" onClick={requestFreeSave} style={{ display: "flex", alignItems: "center", gap: "5px", background: "rgba(22,163,74,0.15)", color: "#86efac", padding: "7px 12px", border: "0.5px solid rgba(22,163,74,0.4)", fontSize: "11px", fontWeight: 700, cursor: "pointer", fontFamily: "'Lato',sans-serif", letterSpacing: "0.05em", whiteSpace: "nowrap", flexShrink: 0 }}>
                  <Unlock size={12} /> SAVE FREE
                </button>
              ) : !isPurchased ? (
                <button className="lan-header-cta" onClick={handlePurchase} style={{ background: GOLD, color: NAVY, padding: "7px 14px", border: "none", fontSize: "11px", fontWeight: 700, cursor: "pointer", fontFamily: "'Lato',sans-serif", letterSpacing: "0.05em", whiteSpace: "nowrap", flexShrink: 0 }}>
                  PURCHASE {fmt(book.price)}
                </button>
              ) : (
                <div style={{ display: "flex", alignItems: "center", gap: "5px", background: "rgba(22,163,74,0.15)", border: "0.5px solid rgba(22,163,74,0.3)", padding: "5px 10px", flexShrink: 0 }}>
                  <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#22c55e" }} />
                  <span style={{ fontSize: "10px", fontWeight: 700, color: "#86efac", fontFamily: "'Lato',sans-serif", letterSpacing: "0.08em" }}>OWNED</span>
                </div>
              )}
              {free && <span className="oa-header-badge"><Unlock size={11} /> Open Access</span>}
              <button onClick={() => setShowOptionsModal(true)} aria-label="More options" style={{ width: "34px", height: "34px", flexShrink: 0, border: "0.5px solid rgba(255,255,255,0.2)", background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(255,255,255,0.7)" }}>
                <MoreVertical size={16} />
              </button>
            </div>
          </div>
        </header>

        {/* ══ NAV DRAWER ══ */}
        {showNavMenu && (
          <>
            <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 60 }} onClick={() => setShowNavMenu(false)} />
            <div style={{ position: "fixed", left: 0, top: 0, bottom: 0, width: "300px", background: "#fff", zIndex: 70, overflowY: "auto" }}>
              <div style={{ background: NAVY, padding: "20px 20px 24px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
                  <p style={{ fontFamily: "'Playfair Display',serif", fontSize: "16px", fontWeight: 700, color: "#fff", margin: 0 }}>[LAN Library]</p>
                  <button onClick={() => setShowNavMenu(false)} aria-label="Close menu" style={{ background: "transparent", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.6)" }}><X size={20} /></button>
                </div>
                {isGloballyFrozen ? (
                  <div style={{ width: "100%", background: "rgba(99,102,241,0.15)", border: "0.5px solid rgba(99,102,241,0.3)", padding: "11px", textAlign: "center", fontSize: "12px", fontWeight: 700, color: "#a5b4fc", fontFamily: "'Lato',sans-serif" }}>❄ Resource Frozen by Admin</div>
                ) : free ? (
                  <button onClick={() => { setShowNavMenu(false); requestFreeSave(); }} style={{ width: "100%", background: "#16a34a", color: "#fff", padding: "11px", border: "none", fontSize: "12px", fontWeight: 700, cursor: "pointer", fontFamily: "'Lato',sans-serif", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
                    <Unlock size={14} /> Save to My Library
                  </button>
                ) : !isPurchased ? (
                  <button onClick={() => { setShowNavMenu(false); handlePurchase(); }} style={{ width: "100%", background: GOLD, color: NAVY, padding: "11px", border: "none", fontSize: "12px", fontWeight: 700, cursor: "pointer", fontFamily: "'Lato',sans-serif" }}>PURCHASE THIS BOOK</button>
                ) : null}
              </div>
              <div style={{ padding: "12px" }}>
                {[
                  { label: "My Account", onClick: () => { setShowNavMenu(false); handleMyAccountClick(); } },
                  { label: "Ask Educo", href: "/ai-chat" },
                  { label: "My Books", href: "/my-books" },
                  { label: "Saved Books", href: "/saved-my-book" },
                  { label: "Help & Support", href: "/lan/net/help-center" },
                  { label: "All Documents", href: "/documents" },
                ].map(({ label, href, onClick }) => href ? (
                  <Link key={label} href={href} onClick={() => setShowNavMenu(false)} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 14px", border: "0.5px solid #e5ddd0", background: "#fff", marginBottom: "6px", textDecoration: "none", color: NAVY, fontSize: "13px", fontWeight: 700, fontFamily: "'Lato',sans-serif" }}>
                    {label} <ChevronRight size={14} style={{ color: "#ccc" }} />
                  </Link>
                ) : (
                  <button key={label} onClick={onClick} style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 14px", border: "0.5px solid #e5ddd0", background: "#fff", marginBottom: "6px", cursor: "pointer", color: NAVY, fontSize: "13px", fontWeight: 700, fontFamily: "'Lato',sans-serif" }}>
                    {label} <ChevronRight size={14} style={{ color: "#ccc" }} />
                  </button>
                ))}
                <button onClick={() => { setShowNavMenu(false); HandleClick(); }} disabled={checkingSeller} style={{ width: "100%", marginTop: "12px", background: NAVY, color: "#fff", padding: "12px", border: "none", fontSize: "12px", fontWeight: 700, cursor: "pointer", fontFamily: "'Lato',sans-serif", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                  {checkingSeller ? "Loading…" : isSeller ? <><Upload size={14} /> Upload Document</> : "Become a Seller"}
                </button>
              </div>
            </div>
          </>
        )}

        {/* ══ MAIN LAYOUT ══ */}
        <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "24px 16px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "20px" }} className="lg-grid">

            {/* ── LEFT SIDEBAR (desktop) ── */}
            <div className="lg-show" style={{ display: "none" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div style={{ background: "#fff", border: "0.5px solid #e5ddd0", overflow: "hidden" }}>
                  <div style={{ position: "relative" }}>
                    <BookCover book={book} title={book.title} titleSize={20} natural />
                    <div style={{ position: "absolute", top: "10px", left: "10px", display: "inline-flex", alignItems: "center", gap: "4px", background: NAVY, padding: "3px 8px", fontSize: "9px", fontWeight: 700, color: "#fff", fontFamily: "'Lato',sans-serif" }}>
                      <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: "#22c55e", display: "inline-block" }} />PDF
                    </div>
                    {free ? (
                      <span style={{ position: "absolute", top: "10px", right: "10px", background: "#16a34a", color: "#fff", fontSize: "9px", fontWeight: 700, padding: "3px 8px", fontFamily: "'Lato',sans-serif", display: "inline-flex", alignItems: "center", gap: "4px" }}><Unlock size={9} /> FREE</span>
                    ) : isPurchased ? (
                      <span style={{ position: "absolute", top: "10px", right: "10px", background: "#16a34a", color: "#fff", fontSize: "9px", fontWeight: 700, padding: "3px 7px", fontFamily: "'Lato',sans-serif" }}>OWNED</span>
                    ) : null}
                  </div>
                  <div style={{ padding: "14px" }}>
                    <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: "15px", fontWeight: 700, color: NAVY, margin: "0 0 4px", lineHeight: 1.3 }}>{book.title}</h1>
                    <p style={{ fontSize: "11px", color: "#888", margin: "0 0 6px", fontFamily: "'Lato',sans-serif" }}>by <span style={{ color: NAVY, fontWeight: 700 }}>{book.author}</span></p>
                    <p style={{ fontSize: "11px", color: "#aaa", margin: "0 0 8px", fontFamily: "'Lato',sans-serif" }}>Uploaded by <span style={{ color: "#666" }}>{uploaderName}</span></p>
                    <p style={{ fontSize: "12px", color: "#666", lineHeight: 1.65, margin: "0 0 6px", display: "-webkit-box", WebkitLineClamp: 4, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{book.description}</p>
                    <button onClick={() => setShowOverview(true)} style={{ fontSize: "11px", color: GOLD, background: "transparent", border: "none", cursor: "pointer", padding: 0, fontWeight: 700, fontFamily: "'Lato',sans-serif" }}>Full description →</button>
                  </div>
                </div>

                {canBuy && <div>{renderBuyButton("side")}{renderAssurance()}</div>}

                <div style={{ background: "#fff", border: "0.5px solid #e5ddd0", padding: "16px", display: "flex", justifyContent: "space-around" }}>
                  {actionList("Ask Educo").map(({ icon, label, onClick }) => <button key={label} className="action-btn" onClick={onClick}>{icon}<span>{label}</span></button>)}
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                  <div className="stat-pill"><Layers size={13} style={{ color: GOLD }} />{free ? <span style={{ color: "#86efac" }}>FREE</span> : <span>{fmt(book.price)}</span>}</div>
                  <div className="stat-pill"><ShoppingBag size={13} style={{ color: GOLD }} /><span>{sold} {free ? "downloads" : "sold"}</span></div>
                  <button className="stat-pill" onClick={() => router.push(`/book/feedbacks?bookId=${bookId}`)} style={{ cursor: "pointer", border: "none" }}>
                    <ThumbsUp size={13} style={{ color: GOLD }} /><span>{positiveRatingPercent !== null ? `${positiveRatingPercent}% (${totalRatings})` : `Reviews: ${bookFeedbackCount}`}</span>
                  </button>
                  <div className="stat-pill"><FileText size={13} style={{ color: GOLD }} />{renderPageCount("11px")}</div>
                </div>

                <div style={{ background: "#fff", border: "0.5px solid #e5ddd0", padding: "14px" }}>
                  {[["Category", book.category], ["Format", book.format]].map(([k, v]) => (
                    <div key={k} style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", padding: "6px 0", borderBottom: "0.5px solid #f0ebe0" }}>
                      <span style={{ color: "#aaa", fontFamily: "'Lato',sans-serif" }}>{k}</span>
                      <span style={{ fontWeight: 700, color: NAVY, fontFamily: "'Lato',sans-serif" }}>{v}</span>
                    </div>
                  ))}
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", padding: "6px 0" }}>
                    <span style={{ color: "#aaa", fontFamily: "'Lato',sans-serif" }}>Access</span>
                    <span style={{ fontWeight: 700, color: free ? "#16a34a" : NAVY, fontFamily: "'Lato',sans-serif", display: "flex", alignItems: "center", gap: "4px" }}>
                      {free ? <><Unlock size={11} /> Open Access</> : "Premium"}
                    </span>
                  </div>
                </div>

                {renderOwnerPanel()}
              </div>
            </div>

            {/* ── CENTER ── */}
            <div style={{ display: "flex", flexDirection: "column", gap: "16px", minWidth: 0 }}>
              {/* Mobile book info */}
              <div className="lg-hide" style={{ background: "#fff", border: "0.5px solid #e5ddd0" }}>
                {/* rating · views · pages */}
                <div style={{ padding: "14px 16px 0", display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", fontSize: "12px", color: "#666", fontFamily: "'Lato',sans-serif" }}>
                  <button onClick={() => router.push(`/book/feedbacks?bookId=${bookId}`)} style={{ display: "inline-flex", alignItems: "center", gap: "5px", background: "none", border: "none", padding: 0, cursor: "pointer", color: NAVY, fontWeight: 700, fontFamily: "'Lato',sans-serif", fontSize: "12px" }}>
                    <ThumbsUp size={13} style={{ color: GOLD }} />{positiveRatingPercent !== null ? `${positiveRatingPercent}% (${totalRatings})` : `Reviews (${bookFeedbackCount})`}
                  </button>
                  {viewCount > 0 && <><span style={{ opacity: 0.4 }}>•</span><span>{formatViews(viewCount)} views</span></>}
                  {displayPages != null && <><span style={{ opacity: 0.4 }}>•</span><span>{displayPages} pages</span></>}
                </div>

                <div style={{ display: "flex", gap: "14px", padding: "14px 16px 16px", alignItems: "flex-start" }}>
                  <div style={{ position: "relative", flexShrink: 0, width: "110px" }}>
                    <BookCover book={book} title={book.title} titleSize={11} natural />
                    {free && <span style={{ position: "absolute", bottom: "6px", left: "6px", background: "#16a34a", color: "#fff", fontSize: "8px", fontWeight: 700, padding: "2px 6px", fontFamily: "'Lato',sans-serif", display: "inline-flex", alignItems: "center", gap: "3px" }}><Unlock size={8} /> FREE</span>}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: "16px", fontWeight: 700, color: NAVY, margin: "0 0 4px", lineHeight: 1.3 }}>{book.title}</h1>
                    <p style={{ fontSize: "12px", color: "#888", margin: "0 0 4px", fontFamily: "'Lato',sans-serif" }}>by {book.author}</p>
                    <p style={{ fontSize: "11px", color: "#aaa", margin: "0 0 6px", fontFamily: "'Lato',sans-serif" }}>
                      Uploaded by <span style={{ color: "#555", fontWeight: 700 }}>{uploaderName}</span>
                      {bookOwnerProfile?.verified && <span style={{ color: "#1d9bf0", fontWeight: 700 }}> · {bookOwnerProfile.lecturerMode || bookOwnerProfile.title ? "Verified faculty" : "Verified"}</span>}
                    </p>
                    {neg && (
                      <button onClick={goNegotiate} style={{ display: "inline-flex", alignItems: "center", gap: "5px", background: "rgba(184,150,62,0.12)", border: "0.5px solid rgba(184,150,62,0.35)", color: NAVY, fontSize: "10px", fontWeight: 700, padding: "4px 9px", marginBottom: "6px", cursor: "pointer", fontFamily: "'Lato',sans-serif", borderRadius: "999px" }}>
                        {negMeta.academic ? <GraduationCap size={11} style={{ color: GOLD }} /> : <Tag size={11} style={{ color: GOLD }} />}
                        {negMeta.academic ? "Student discount" : "Negotiable"}{negMeta.pct ? ` · up to ${negMeta.pct}%` : ""}
                      </button>
                    )}
                    <p style={{ fontSize: "12px", color: "#666", lineHeight: 1.6, margin: "0 0 6px", display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{book.description}</p>
                    <button onClick={() => setShowOverview(true)} style={{ fontSize: "12px", color: NAVY, background: "transparent", border: "none", cursor: "pointer", padding: 0, fontWeight: 700, textDecoration: "underline", fontFamily: "'Lato',sans-serif" }}>Read more</button>
                  </div>
                </div>

                {canBuy && <div style={{ padding: "0 16px 14px" }}>{renderBuyButton("mobile")}{renderAssurance()}</div>}

                <div style={{ borderTop: "0.5px solid #e5ddd0", padding: "12px 16px", display: "flex", justifyContent: "space-around" }}>
                  {actionList("Ask AI").map(({ icon, label, onClick }) => <button key={label} className="action-btn" onClick={onClick}>{icon}<span>{label}</span></button>)}
                </div>
              </div>

              {/* Preview / reader card */}
              <div style={{ background: "#fff", border: "0.5px solid #e5ddd0", overflow: "hidden" }}>
                <div style={{ background: NAVY, padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <div className="gold-pill">
                      <Eye size={10} style={{ color: GOLD }} />
                      <span style={{ fontSize: "9px", fontWeight: 700, color: GOLD, letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: "'Lato',sans-serif" }}>{free ? "Open Access" : isPurchased ? "Full Access" : "Preview"}</span>
                    </div>
                    {free && <div style={{ display: "flex", alignItems: "center", gap: "5px" }}><div style={{ width: "5px", height: "5px", borderRadius: "50%", background: "#22c55e" }} /><span style={{ fontSize: "9px", color: "#86efac", fontWeight: 700, fontFamily: "'Lato',sans-serif" }}>FREE DOCUMENT</span></div>}
                    {!free && isPurchased && <div style={{ display: "flex", alignItems: "center", gap: "5px" }}><div style={{ width: "5px", height: "5px", borderRadius: "50%", background: "#22c55e" }} /><span style={{ fontSize: "9px", color: "#86efac", fontWeight: 700, fontFamily: "'Lato',sans-serif" }}>PURCHASED</span></div>}
                    {canBuy && <span style={{ fontSize: "10px", color: "rgba(255,255,255,0.55)", fontFamily: "'Lato',sans-serif" }}>Cover and first page</span>}
                  </div>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button onClick={() => setShowOverview(true)} style={{ display: "flex", alignItems: "center", gap: "5px", padding: "5px 10px", border: "0.5px solid rgba(255,255,255,0.2)", background: "transparent", color: "rgba(255,255,255,0.7)", fontSize: "10px", fontWeight: 700, cursor: "pointer", fontFamily: "'Lato',sans-serif" }}><Layers size={12} /> Overview</button>
                    <button onClick={() => setShowSummary(true)} style={{ display: "flex", alignItems: "center", gap: "5px", padding: "5px 10px", border: "0.5px solid rgba(255,255,255,0.2)", background: "transparent", color: "rgba(255,255,255,0.7)", fontSize: "10px", fontWeight: 700, cursor: "pointer", fontFamily: "'Lato',sans-serif" }}><FileText size={12} /> Summary</button>
                  </div>
                </div>

                {renderPhysicalStock()}

                {isGloballyFrozen ? <FrozenPdfGate /> : renderPdfViewer("900px")}

                <FeaturedAdsCarousel tier="Gold" maxAds={2} autoPlay={true} autoPlayMs={4000} style={{ marginTop: "1px" }} />
                <FeaturedAdsCarousel tier="Silver" maxAds={2} autoPlay={true} autoPlayMs={4000} style={{ marginTop: "1px" }} />
                <FeaturedAdsCarousel tier="Bronze" maxAds={2} autoPlay={true} autoPlayMs={4000} style={{ marginTop: "1px" }} />
              </div>

              {/* Reviews */}
              {feedbacks.length > 0 && (
                <div style={{ background: "#fff", border: "0.5px solid #e5ddd0", overflow: "hidden" }}>
                  <div style={{ background: NAVY, padding: "14px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div>
                      <p style={{ fontSize: "9px", fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: GOLD, margin: "0 0 2px", fontFamily: "'Lato',sans-serif" }}>Student Feedback</p>
                      <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: "16px", fontWeight: 700, color: "#fff", margin: 0 }}>Reviews & Ratings</h3>
                    </div>
                    {positiveRatingPercent !== null && (
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", background: "rgba(184,150,62,0.15)", border: "0.5px solid rgba(184,150,62,0.3)", padding: "5px 12px" }}>
                        <ThumbsUp size={12} style={{ color: GOLD }} />
                        <span style={{ fontSize: "12px", fontWeight: 700, color: GOLD, fontFamily: "'Lato',sans-serif" }}>{positiveRatingPercent}%</span>
                        <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)", fontFamily: "'Lato',sans-serif" }}>({totalRatings})</span>
                      </div>
                    )}
                  </div>
                  <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "12px" }}>
                    {feedbacks.map((fb) => {
                      const isOwner = isSeller && (book?.userId === user?.uid || book?.sellerId === user?.uid);
                      const stars = fb.rating || 0;
                      const isReplying = replyingTo === fb.id;
                      return (
                        <div key={fb.id} style={{ border: "0.5px solid #e8e0d4", overflow: "hidden" }}>
                          <div style={{ padding: "14px 16px" }}>
                            <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
                              <div style={{ width: "34px", height: "34px", borderRadius: "50%", background: NAVY, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, border: `1.5px solid ${GOLD}` }}>
                                <span style={{ fontSize: "12px", fontWeight: 700, color: GOLD, fontFamily: "'Playfair Display',serif" }}>{(fb.userName || "?")[0].toUpperCase()}</span>
                              </div>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "6px", marginBottom: "4px" }}>
                                  <p style={{ fontSize: "12px", fontWeight: 700, color: NAVY, margin: 0, fontFamily: "'Lato',sans-serif" }}>{fb.userName || "Anonymous"}</p>
                                  {fb.createdAt && <span style={{ fontSize: "10px", color: "#aaa", fontFamily: "'Lato',sans-serif" }}>{new Date(fb.createdAt?.seconds ? fb.createdAt.seconds * 1000 : fb.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}</span>}
                                </div>
                                {stars > 0 && <div style={{ display: "flex", gap: "2px", marginBottom: "6px" }}>{[1, 2, 3, 4, 5].map((n) => <svg key={n} width={12} height={12} viewBox="0 0 24 24" fill={n <= stars ? GOLD : "none"} stroke={n <= stars ? GOLD : "#ddd"} strokeWidth={1.8}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>)}</div>}
                                <p style={{ fontSize: "13px", color: "#444", fontFamily: "'Lato',sans-serif", lineHeight: 1.65, margin: "0 0 8px", fontStyle: "italic" }}>"{fb.feedback || "(No details provided)"}"</p>
                                {isOwner && !fb.sellerReply && <button onClick={() => setReplyingTo(isReplying ? null : fb.id)} style={{ fontSize: "11px", fontWeight: 700, color: isReplying ? "#aaa" : GOLD, background: "transparent", border: `0.5px solid ${isReplying ? "#e5ddd0" : "rgba(184,150,62,0.3)"}`, padding: "4px 12px", cursor: "pointer", fontFamily: "'Lato',sans-serif" }}>{isReplying ? "✕ Cancel" : "↩ Reply"}</button>}
                              </div>
                            </div>
                          </div>
                          {fb.sellerReply && (
                            <div style={{ background: "rgba(13,34,68,0.04)", borderTop: "0.5px solid #e8e0d4", borderLeft: `3px solid ${GOLD}`, padding: "12px 16px 12px 20px" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                                <div style={{ width: "24px", height: "24px", borderRadius: "50%", background: NAVY, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><span style={{ fontSize: "9px", fontWeight: 700, color: GOLD, fontFamily: "'Lato',sans-serif" }}>S</span></div>
                                <p style={{ fontSize: "11px", fontWeight: 700, color: NAVY, margin: 0, fontFamily: "'Lato',sans-serif" }}>{fb.sellerName || book?.sellerName || "Seller"}</p>
                                <span style={{ fontSize: "9px", fontWeight: 700, background: "rgba(184,150,62,0.12)", border: "0.5px solid rgba(184,150,62,0.25)", color: GOLD, padding: "2px 7px", fontFamily: "'Lato',sans-serif", textTransform: "uppercase" }}>Seller</span>
                              </div>
                              <p style={{ fontSize: "12px", color: "#555", fontFamily: "'Lato',sans-serif", lineHeight: 1.65, margin: 0 }}>{fb.sellerReply}</p>
                            </div>
                          )}
                          {isReplying && isOwner && (
                            <div style={{ background: CREAM, borderTop: "0.5px solid #e8e0d4", borderLeft: `3px solid ${GOLD}`, padding: "14px 16px" }}>
                              <textarea autoFocus value={replyText[fb.id] || ""} onChange={(e) => setReplyText((prev) => ({ ...prev, [fb.id]: e.target.value }))} placeholder="Write a professional, helpful response…" maxLength={500} rows={3}
                                style={{ width: "100%", padding: "10px 12px", border: "0.5px solid #e5ddd0", background: "#fff", fontSize: "12px", color: NAVY, resize: "none", outline: "none", fontFamily: "'Lato',sans-serif", lineHeight: 1.6, boxSizing: "border-box" }} />
                              <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", marginTop: "8px", gap: "8px" }}>
                                <button onClick={() => setReplyingTo(null)} style={{ padding: "7px 16px", background: "transparent", border: "0.5px solid #e5ddd0", color: "#aaa", fontSize: "11px", fontWeight: 700, cursor: "pointer", fontFamily: "'Lato',sans-serif" }}>Cancel</button>
                                <button onClick={() => submitReply(fb.id)} disabled={submittingReply || !replyText[fb.id]?.trim()} style={{ padding: "7px 18px", background: NAVY, border: "none", color: GOLD, fontSize: "11px", fontWeight: 700, cursor: "pointer", fontFamily: "'Lato',sans-serif", opacity: submittingReply || !replyText[fb.id]?.trim() ? 0.5 : 1 }}>
                                  {submittingReply ? "Posting…" : "Post Reply"}
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  <div style={{ padding: "14px 20px", borderTop: "0.5px solid #e5ddd0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "11px", color: "#aaa", fontFamily: "'Lato',sans-serif" }}>{feedbacks.length} review{feedbacks.length !== 1 ? "s" : ""}</span>
                    <button onClick={() => router.push(`/book/feedbacks?bookId=${bookId}`)} style={{ fontSize: "11px", fontWeight: 700, color: GOLD, background: "transparent", border: "none", cursor: "pointer", fontFamily: "'Lato',sans-serif" }}>View all reviews →</button>
                  </div>
                </div>
              )}

              {/* Mobile: uploader + suggestions */}
              <div className="lg-hide">{renderOwnerPanel()}</div>
              <div className="lg-hide">{renderSuggestionsCard(true)}</div>
            </div>

            {/* ── RIGHT SIDEBAR (desktop) ── */}
            <div className="lg-show" style={{ display: "none" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {renderSuggestionsCard(false)}
              </div>
            </div>
          </div>
        </div>

        <NegotiationHost user={user} fmt={fmt} />

        {/* ══ MODALS ══ */}
        {showOverview && (
          <>
            <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 40 }} onClick={() => setShowOverview(false)} />
            <div style={{ position: "fixed", top: 0, left: 0, width: "100%", maxWidth: "560px", height: "100vh", background: "#fff", zIndex: 50, overflowY: "scroll" }}>
              <div style={{ background: NAVY, padding: "20px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 10 }}>
                <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: "20px", fontWeight: 700, color: "#fff", margin: 0 }}>Overview</h2>
                <button onClick={() => setShowOverview(false)} aria-label="Close" style={{ background: "transparent", border: "none", cursor: "pointer", color: "#fff" }}><X size={22} /></button>
              </div>
              <div style={{ padding: "24px", paddingBottom: "80px" }}>
                <div style={{ width: "180px", marginBottom: "20px" }}><BookCover book={book} title={book.title} titleSize={16} natural /></div>
                {[["Title", book.title, true], ["Author", book.author, false], ["Category", book.category || "General", false], ["Uploaded by", uploaderName, false]].map(([k, v, isSerif]) => (
                  <div key={k} style={{ marginBottom: "14px", paddingBottom: "14px", borderBottom: "0.5px solid #f0ebe0" }}>
                    <p style={{ fontSize: "9px", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: GOLD, margin: "0 0 4px", fontFamily: "'Lato',sans-serif" }}>{k}</p>
                    <p style={{ fontFamily: isSerif ? "'Playfair Display',serif" : "'Lato',sans-serif", fontSize: isSerif ? "16px" : "13px", fontWeight: isSerif ? 700 : 400, color: NAVY, margin: 0 }}>{v}</p>
                  </div>
                ))}
                <div style={{ marginBottom: "14px" }}>
                  <p style={{ fontSize: "9px", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: GOLD, margin: "0 0 4px", fontFamily: "'Lato',sans-serif" }}>Description</p>
                  <p style={{ fontSize: "13px", color: "#555", lineHeight: 1.75, fontFamily: "'Lato',sans-serif", margin: 0 }}>{book.description}</p>
                </div>
              </div>
            </div>
          </>
        )}

        {showSummary && (
          <>
            <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 40 }} onClick={() => setShowSummary(false)} />
            <div style={{ position: "fixed", top: 0, right: 0, width: "100%", maxWidth: "560px", height: "100vh", background: "#fff", zIndex: 50, overflowY: "scroll" }}>
              <div style={{ background: NAVY, padding: "20px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 10 }}>
                <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: "20px", fontWeight: 700, color: "#fff", margin: 0 }}>Summary</h2>
                <button onClick={() => setShowSummary(false)} aria-label="Close" style={{ background: "transparent", border: "none", cursor: "pointer", color: "#fff" }}><X size={22} /></button>
              </div>
              <div style={{ padding: "24px", paddingBottom: "80px" }}>
                <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: "18px", fontWeight: 700, color: NAVY, margin: "0 0 6px" }}>{book.title}</h3>
                <p style={{ fontSize: "12px", color: "#888", margin: "0 0 16px", fontFamily: "'Lato',sans-serif" }}>By {book.author}</p>
                <p style={{ fontSize: "13px", color: "#555", lineHeight: 1.75, fontFamily: "'Lato',sans-serif", margin: 0, whiteSpace: "pre-line" }}>
                  {book.tableOfContents || book.tableOfContent || book.summary || book.introduction || "No summary available for this document."}
                </p>
              </div>
            </div>
          </>
        )}

        {/* "..." menu: negotiation / discount sits first */}
        {showOptionsModal && (
          <>
            <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 50 }} onClick={() => setShowOptionsModal(false)} />
            <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: "#fff", zIndex: 51 }}>
              <div style={{ padding: "20px 20px 32px" }}>
                <div style={{ width: "36px", height: "3px", background: "#e5ddd0", margin: "0 auto 20px", borderRadius: "2px" }} />
                {[
                  ...(neg ? [{ icon: studentDiscountView ? <GraduationCap size={22} style={{ color: GOLD }} /> : <Tag size={22} style={{ color: GOLD }} />, label: neg.title, sub: neg.sub, onClick: goNegotiate }] : []),
                  { icon: <Bookmark size={22} style={isSaved ? { fill: NAVY, color: NAVY } : { color: NAVY }} />, label: isSaved ? "Saved for later" : "Save for later", onClick: handleSaveForLater },
                  { icon: <Share2 size={22} style={{ color: NAVY }} />, label: "Share", onClick: handleShare },
                  { icon: <ThumbsUp size={22} style={{ color: NAVY }} />, label: "Rate this book", onClick: () => { setShowOptionsModal(false); setShowFeedbackModal(true); } },
                  { icon: <Flag size={22} style={{ color: NAVY }} />, label: "Report legal issue", onClick: handleReport },
                ].map(({ icon, label, sub, onClick }) => (
                  <button key={label} onClick={onClick} style={{ width: "100%", display: "flex", alignItems: "center", gap: "14px", padding: "14px 0", border: "none", background: "transparent", cursor: "pointer", borderBottom: "0.5px solid #f0ebe0", color: NAVY, fontFamily: "'Lato',sans-serif", fontSize: "14px", fontWeight: 700, textAlign: "left" }}>
                    {icon}
                    <span>{label}{sub && <span style={{ display: "block", fontSize: "11px", fontWeight: 400, color: "#888", marginTop: 1 }}>{sub}</span>}</span>
                  </button>
                ))}
                <LicenseButton book={book} isGloballyFrozen={isGloballyFrozen} isPrintLicensingEnabled={isPrintLicensingEnabled} router={router} cleanBookId={cleanId} style={{ marginTop: 8, marginBottom: 4 }} />
                <button onClick={() => setShowOptionsModal(false)} style={{ width: "100%", marginTop: "12px", padding: "13px", background: BG, border: "0.5px solid #e5ddd0", fontSize: "13px", fontWeight: 700, color: "#666", cursor: "pointer", fontFamily: "'Lato',sans-serif", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
                  <X size={16} /> Close
                </button>
              </div>
            </div>
          </>
        )}

        {showFeedbackModal && (
          <>
            <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", zIndex: 100 }} onClick={() => { setShowFeedbackModal(false); setFeedbackText(""); setFeedbackRating(0); }} />
            <div style={{ position: "fixed", inset: 0, zIndex: 101, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px", pointerEvents: "none" }}>
              <div style={{ background: NAVY, width: "100%", maxWidth: "440px", overflow: "hidden", pointerEvents: "auto" }}>
                <div style={{ padding: "20px 24px", borderBottom: "0.5px solid rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div>
                    <p style={{ fontSize: "10px", color: GOLD, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", margin: "0 0 2px", fontFamily: "'Lato',sans-serif" }}>Your Review</p>
                    <p style={{ fontFamily: "'Playfair Display',serif", fontSize: "18px", fontWeight: 700, color: "#fff", margin: 0 }}>Write a Review</p>
                  </div>
                  <button onClick={() => { setShowFeedbackModal(false); setFeedbackText(""); setFeedbackRating(0); }} aria-label="Close" style={{ background: "transparent", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.6)", padding: "4px" }}><X size={20} /></button>
                </div>
                <div style={{ padding: "20px 24px" }}>
                  <div style={{ display: "flex", gap: "6px", marginBottom: "20px" }}>
                    {[1, 2, 3, 4, 5].map((n) => <Star key={n} size={30} fill={n <= feedbackRating ? GOLD : "none"} stroke={n <= feedbackRating ? GOLD : "rgba(255,255,255,0.3)"} style={{ cursor: "pointer" }} onClick={() => setFeedbackRating(n)} />)}
                  </div>
                  <textarea autoFocus value={feedbackText} onChange={(e) => setFeedbackText(e.target.value)} placeholder="Share your thoughts about this book…" rows={4}
                    style={{ width: "100%", background: "rgba(255,255,255,0.06)", border: "0.5px solid rgba(255,255,255,0.15)", padding: "12px", color: "#fff", fontSize: "13px", resize: "none", outline: "none", fontFamily: "'Lato',sans-serif", boxSizing: "border-box" }} />
                  <p style={{ fontSize: "10px", color: "rgba(255,255,255,0.25)", marginTop: "4px", marginBottom: "18px", fontFamily: "'Lato',sans-serif" }}>{feedbackText.length}/500</p>
                  <div style={{ display: "flex", gap: "10px" }}>
                    <button onClick={() => { setShowFeedbackModal(false); setFeedbackText(""); setFeedbackRating(0); }} style={{ flex: 1, padding: "12px", border: "0.5px solid rgba(255,255,255,0.2)", background: "transparent", color: "rgba(255,255,255,0.6)", fontSize: "12px", fontWeight: 700, cursor: "pointer", fontFamily: "'Lato',sans-serif" }}>Cancel</button>
                    <button onClick={submitFeedback} disabled={isSubmittingFeedback || !feedbackText.trim()} style={{ flex: 1, padding: "12px", background: GOLD, border: "none", color: NAVY, fontSize: "12px", fontWeight: 700, cursor: "pointer", fontFamily: "'Lato',sans-serif", opacity: isSubmittingFeedback || !feedbackText.trim() ? 0.5 : 1 }}>
                      {isSubmittingFeedback ? "Submitting…" : "Submit Review"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {showToast && (
          <div style={{ position: "fixed", bottom: "24px", left: "50%", transform: "translateX(-50%)", background: NAVY, color: "#fff", padding: "12px 20px", zIndex: 9999, fontSize: "13px", fontWeight: 700, fontFamily: "'Lato',sans-serif", border: "0.5px solid rgba(184,150,62,0.3)", whiteSpace: "nowrap" }}>
            {toastMessage}
          </div>
        )}
      </div>
    </>
  );
}