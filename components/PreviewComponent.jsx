"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  doc,
  getDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  addDoc,
  serverTimestamp,
  increment,
  setDoc,
  deleteDoc,
} from "firebase/firestore";
import { auth, db } from "@/lib/firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";
import { booksData } from "@/lib/booksData";
import {
  Download,
  Share2,
  Bookmark,
  MoreVertical,
  Menu,
  X,
  Eye,
  FileText,
  ChevronRight,
  Layers,
  ThumbsUp,
  Flag,
  CheckCircle,
  Upload,
  HelpCircle,
  ShoppingBag,
  Users,
  ExternalLink,
  Sparkles,
  ArrowLeft,
  TrendingUp,
  Package,
  MapPin,
  Star,
  Unlock,
  Printer, Lock, AlertCircle, Shield, Store,
} from "lucide-react";
import Link from "next/link";
import { fetchBookDetails } from "@/utils/bookUtils";
import AiAskButton from "./AiAskButton";
import FeaturedAdsCarousel from "./FeaturedAdsCarousel";
import StudyBuddyTracker from "./StudyBuddyTracker";
import OpenAccessModal from "./Openaccessmodal";
import GoogleAdComponent from "./GoogleAdComponent";
import { FrozenPdfGate, SellerProfileLink } from "./book-preview- patches";
import { useCurrency } from "@/app/context/CurrencyContext";
import BookNegotiationCard from "@/components/negotiation/BookNegotiationCard";
import { NegotiationHost } from "@/components/negotiation/NegotiationHost";
import { getNegotiationSettings } from "@/lib/negotiation";
import { VerifiedBadge, paidVerificationActive } from "@/components/seller/Verification";

/* ── palette ── */
const NAVY = "#0d2244";
const GOLD = "#b8963e";
const CREAM = "#f5f0e8";
const BG = "#f5f1ea";
const BORDER = "#e5ddd0";
const MUTED = "#aaa";
const TEXT = NAVY;
const CARD = "#fff";

/* ── helpers ── */
const isOpenAccess = (book) =>
  book?.isFree === true ||
  book?.accessType === "free" ||
  Number(book?.price) === 0;

const isSellerBook = (book) =>
  book?.isFromFirestore === true ||
  (book?.userId && book.userId !== "") ||
  (book?.sellerName && book.sellerName !== "" && book.sellerName !== "LAN Library");

/* ─── LicenseButton ─────────────────────────────────────────────── */
function LicenseButton({ book, isGloballyFrozen, isPrintLicensingEnabled, router, cleanBookId, style = {} }) {
  const isDisabled = isGloballyFrozen || !isPrintLicensingEnabled;
  const disabledReason = isGloballyFrozen
    ? "This document is currently frozen."
    : !isPrintLicensingEnabled
    ? "Print licensing is not enabled for this book."
    : null;

  const handleClick = () => {
    if (isDisabled) { alert(disabledReason); return; }
    router.push(`/document/request-print-permission?id=${cleanBookId}&title=${encodeURIComponent(book?.title || "")}&pages=${book?.pages || 0}&price=${book?.price || 0}`);
  };

  return (
    <button
      onClick={handleClick}
      disabled={isDisabled}
      style={{
        width: "100%", display: "flex", alignItems: "center", gap: "12px",
        padding: "14px 16px",
        border: isDisabled ? "0.5px solid #f0ebe0" : `0.5px solid ${GOLD}`,
        background: isDisabled ? CREAM : "#fff",
        cursor: isDisabled ? "not-allowed" : "pointer",
        transition: "all 0.18s", opacity: isDisabled ? 0.6 : 1, ...style,
      }}
      onMouseEnter={(e) => { if (!isDisabled) { e.currentTarget.style.borderColor = NAVY; e.currentTarget.style.background = CREAM; } }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = isDisabled ? "#f0ebe0" : GOLD; e.currentTarget.style.background = "#fff"; }}
    >
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
  const [expandedCategory, setExpandedCategory] = useState(null);
  const [previewContent, setPreviewContent] = useState("");
  const [checkingSeller, setCheckingSeller] = useState(true);
  const [isSeller, setIsSeller] = useState(false);
  const [allBooks, setAllBooks] = useState([]);
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
  const [userBountyRole, setUserBountyRole] = useState(null);
  const { fmt } = useCurrency();
  const [showOAModal, setShowOAModal] = useState(false);
  const [pdfPageCount, setPdfPageCount] = useState(null);
  const [calculatingPages, setCalculatingPages] = useState(false);
const [sellerSoldCount, setSellerSoldCount] = useState(null);
  const [negSettings, setNegSettings] = useState(null);   
  
  /* ── CHANGE 1: Book owner profile state ── */
  const [bookOwnerProfile, setBookOwnerProfile] = useState(null);
  const [ownerFollowers, setOwnerFollowers] = useState(0);
  const [loadingOwnerProfile, setLoadingOwnerProfile] = useState(false);

  /* ── Suggested books split: free + paid ── */
  const [suggestedFreeBooks, setSuggestedFreeBooks] = useState([]);
  const [suggestedPaidBooks, setSuggestedPaidBooks] = useState([]);

  const getThumbnailUrl = (book) => {
    const direct = book.coverImage || book.image;
    if (direct && (direct.includes("lh3.googleusercontent.com") || direct.includes("unsplash.com"))) return direct;
    if (direct && !direct.includes("drive.google.com")) return direct;
    let fileId = book.driveFileId;
    if (!fileId && book.embedUrl) {
      const m = book.embedUrl.match(/\/d\/([\w-]{25,})|id=([\w-]{25,})/);
      if (m) fileId = m[1] || m[2];
    }
    if (!fileId && book.pdfUrl?.includes("drive.google.com")) {
      const m = book.pdfUrl.match(/\/d\/([\w-]{25,})|id=([\w-]{25,})/);
      if (m) fileId = m[1] || m[2];
    }
    if (!fileId && direct?.includes("drive.google.com")) {
      const m = direct.match(/\/d\/([\w-]{25,})|id=([\w-]{25,})/);
      if (m) fileId = m[1] || m[2];
    }
    if (fileId) return `https://lh3.googleusercontent.com/d/${fileId}=w400`;
    return "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400";
  };

  /* ── PDF.js page count ── */
  useEffect(() => {
    if (!book) return;
    const free = isOpenAccess(book);
    const sellerUploaded = isSellerBook(book);
    if (!free || sellerUploaded) return;
    const pdfSrc = book.pdfUrl || book.embedUrl;
    if (!pdfSrc) return;
    const loadPdfJs = () => new Promise((resolve, reject) => {
      if (window.pdfjsLib) { resolve(window.pdfjsLib); return; }
      const script = document.createElement("script");
      script.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
      script.onload = () => { window.pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js"; resolve(window.pdfjsLib); };
      script.onerror = reject;
      document.head.appendChild(script);
    });
    const fetchPageCount = async () => {
      try {
        setCalculatingPages(true);
        const pdfjsLib = await loadPdfJs();
        const pdf = await pdfjsLib.getDocument(pdfSrc).promise;
        setPdfPageCount(pdf.numPages);
      } catch { } finally { setCalculatingPages(false); }
    };
    fetchPageCount();
  }, [book]);

  useEffect(() => {
    if (!bookId) return;
    const fetchFeedbacks = async () => {
      try {
        const variants = [bookId, bookId.replace("firestore-", ""), `firestore-${bookId.replace("firestore-", "")}`];
        let all = [];
        const seen = new Set();
        for (const id of variants) {
          const snap = await getDocs(query(collection(db, "bookFeedbacks"), where("bookId", "==", id)));
          snap.forEach((d) => { if (!seen.has(d.id)) { seen.add(d.id); all.push({ id: d.id, ...d.data() }); } });
        }
        all.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
        setFeedbacks(all);
      } catch (e) { console.error("fetchFeedbacks error:", e); }
    };
    fetchFeedbacks();
  }, [bookId]);

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
    const free = isOpenAccess(book);
    const sellerUploaded = isSellerBook(book);
    if (free && !sellerUploaded) {
      if (calculatingPages) return null;
      if (pdfPageCount !== null) return pdfPageCount;
    }
    return book.pages ?? null;
  };

  const getUploaderName = () => {
    if (!book) return "LAN Library";
    const name = book.sellerName || book.uploadedBy || book.uploaderName;
    if (!name || name.trim() === "") return "LAN Library";
    return name;
  };

  const categories = [
    { name: "Education", books: booksData.filter((b) => b.category?.toLowerCase().includes("education")).slice(0, 5) },
    { name: "Business", books: booksData.filter((b) => b.category?.toLowerCase().includes("business")).slice(0, 5) },
    { name: "Technology", books: booksData.filter((b) => b.category?.toLowerCase().includes("technology")).slice(0, 5) },
    { name: "Science", books: booksData.filter((b) => b.category?.toLowerCase().includes("science")).slice(0, 5) },
    { name: "Personal Development", books: booksData.filter((b) => b.category?.toLowerCase().includes("personal")).slice(0, 5) },
    { name: "Arts & Culture", books: booksData.filter((b) => b.category?.toLowerCase().includes("arts")).slice(0, 5) },
  ];

  const handleReport = () => router.push(`/report/book?bookId=${bookId}`);

  const checkSellerStatus = async (userId) => {
    try {
      setCheckingSeller(true);
      const ud = await getDoc(doc(db, "users", userId));
      setIsSeller(ud.exists() ? ud.data().isSeller === true : false);
    } catch { setIsSeller(false); }
    finally { setCheckingSeller(false); }
  };

  useEffect(() => {
    if (book) {
      setPreviewContent([book.description, book.introduction, book.tableOfContents].filter(Boolean).join("\n\n").slice(0, 1500));
    }
  }, [book]);

  /* ── CHANGE 2: Fetch book owner profile when book loads ── */
 useEffect(() => {
  if (!book) return;
  const ownerUid = book.userId || book.sellerId || null;
  if (!ownerUid) { setBookOwnerProfile(null); return; }

  const makeSlug = (...parts) =>
    parts.filter(Boolean).join(" ").trim().toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-") || null;

  const fetchOwnerProfile = async () => {
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
      const name =
        u?.firstName && u?.surname ? `${u.firstName} ${u.surname}`
        : u?.displayName || s?.sellerName || book.sellerName || "Unknown";

      setBookOwnerProfile({
        uid: ownerUid,
        name,
        title,
        photoURL: u?.photoURL || u?.photoBase64 || s?.photoURL || s?.photoBase64 || null,
        institution: u?.institution || u?.university || s?.university || "",
        location: s?.businessInfo?.state || s?.businessInfo?.country || u?.state || u?.country || "",
        shop: s?.businessInfo?.businessName || "",
        bio: s?.businessInfo?.businessDescription || u?.bio || "",
          verified: (() => {
            const LECTURER_TITLES = ["lecturer", "dr.", "prof.", "professor", "mrs", "mr"];
            const lecturerMode =
              u?.isLecturer === true ||
              u?.role === "lecturer" ||
              LECTURER_TITLES.includes(String(title || "").toLowerCase());
            if (lecturerMode) {
              return (
                (u?.isVerified === true || u?.lecturerVerificationStatus === "approved") &&
                u?.lecturerVerificationStatus !== "pending" &&
                u?.lecturerVerificationStatus !== "rejected"
              );
            }
            return paidVerificationActive(s);
      })(),
      
        booksSold: s?.booksSold || 0,
        slug: s?.slug || makeSlug(title, u?.firstName, u?.surname) || makeSlug(u?.firstName, u?.surname),
      });
      setOwnerFollowers(followsSnap ? followsSnap.size : 0);
      if (typeof s?.booksSold === "number" && s.booksSold > 0) setSellerSoldCount(s.booksSold);
    } catch (err) {
      console.error("owner profile error:", err);
      setBookOwnerProfile(null);
    } finally {
      setLoadingOwnerProfile(false);
    }
  };

  fetchOwnerProfile();
 }, [book]);
  
  useEffect(() => {
    if (!book?.bountyId || !user?.uid) { setUserBountyRole(null); return; }
    const checkBountyRole = async () => {
      try {
        const bountySnap = await getDoc(doc(db, "bounties", book.bountyId));
        if (bountySnap.exists()) {
          const bd = bountySnap.data();
          if (bd.postedByUid === user.uid) setUserBountyRole("requester");
          else if (bd.fulfilledByUid === user.uid) setUserBountyRole("fulfiller");
          else setUserBountyRole(null);
        }
      } catch { }
    };
    checkBountyRole();
  }, [book?.bountyId, user?.uid]);

  useEffect(() => {
    if (!bookId) return;
    const trackView = async () => {
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
    };
    trackView();
  }, [bookId]);

  useEffect(() => {
    if (!bookId) return;
    const fetchPhysicalInventory = async () => {
      try {
        setLoadingPhysical(true);
        const cleanId = bookId.replace("firestore-", "");
        const allSnap = await getDocs(collection(db, "physicalInventory"));
        let found = null;
        allSnap.forEach((d) => {
          const data = d.data();
          if (data.bookId === cleanId || data.bookId === bookId || data.bookId === `firestore-${cleanId}`) found = { id: d.id, ...data };
        });
        setPhysicalInventory(found);
      } catch { } finally { setLoadingPhysical(false); }
    };
    fetchPhysicalInventory();
  }, [bookId]);

  useEffect(() => {
    if (!bookId) return;
    const fetchRatings = async () => {
      try {
        const variants = [bookId, bookId.replace("firestore-", ""), `firestore-${bookId.replace("firestore-", "")}`];
        let allFeedbacks = [];
        for (const id of variants) {
          const snap = await getDocs(query(collection(db, "bookFeedbacks"), where("bookId", "==", id)));
          snap.forEach((d) => allFeedbacks.push(d.data()));
        }
        const seen = new Set();
        allFeedbacks = allFeedbacks.filter((f) => { if (seen.has(f.userId)) return false; seen.add(f.userId); return true; });
        const total = allFeedbacks.length;
        setTotalRatings(total);
        setBookFeedbackCount(total);
        if (total > 0) {
          const positive = allFeedbacks.filter((f) => f.feedback?.trim().length > 0).length;
          const pct = Math.round((positive / total) * 100);
          setPositiveRatingPercent(pct > 0 ? pct : Math.min(75 + Math.floor(total * 2), 98));
        }
      } catch { }
    };
    fetchRatings();
  }, [bookId]);

  useEffect(() => {
    const fetchFollowing = async () => {
      if (!user) return;
      const snap = await getDocs(query(collection(db, "follows"), where("followerId", "==", user.uid)));
      setFollowingIds(new Set(snap.docs.map((d) => d.data().lecturerId)));
    };
    fetchFollowing();
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
  } catch (err) {
    console.error("follow error:", err);
  } finally {
    setFollowLoadingIds((prev) => { const n = new Set(prev); n.delete(ownerId); return n; });
  }
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
    const fetchSales = async () => {
      try {
        const map = {};
const addSale = (rawId) => {
  if (!rawId) return;
  const clean = String(rawId).replace("firestore-", "");
  map[clean] = (map[clean] || 0) + 1;
};
        const usersSnap = await getDocs(collection(db, "users"));
        usersSnap.docs.forEach((u) => { Object.values(u.data().purchasedBooks || {}).forEach((p) => { addSale(p.bookId || p.id || p.firestoreId); }); });
        try {
          const physSalesSnap = await getDocs(collection(db, "physicalSales"));
          physSalesSnap.docs.forEach((d) => { const data = d.data(); addSale(data.bookId || data.inventoryId); });
        } catch { }
        setBookSalesCount(map);
      } catch { }
    };
    fetchSales();
  }, []);

  useEffect(() => {
    const handleVisibility = async () => { if (!document.hidden && user) await checkPurchaseStatus(user.uid); };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [user, bookId]);

  useEffect(() => {
    if (user && bookId) checkPurchaseStatus(user.uid);
  }, [user, bookId]);

  useEffect(() => {
    const fetchBook = async () => {
      try {
        setLoading(true);
        setIsGloballyFrozen(false);
        setIsPrintLicensingEnabled(false);
        setIsPurchased(false);
        setIsSaved(false);
        setBook(null);
        setViewCount(0);
        setPositiveRatingPercent(null);
        setTotalRatings(0);
        setBookFeedbackCount(0);
        setPdfPageCount(null);
        setCalculatingPages(false);
        setNegSettings(null);

        const bookData = await fetchBookDetails(bookId);
        if (bookData) {
          setBook({ ...bookData, image: getThumbnailUrl(bookData) });
          setPreviewContent(bookData.previewText || bookData.introduction || bookData.tableOfContents || bookData.description);
        }
        const cId = bookId?.replace("firestore-", "");
        if (cId) {
          const snap = await getDoc(doc(db, "advertMyBook", cId));
          if (snap.exists()) {
            const raw = snap.data();
            setIsPrintLicensingEnabled(raw.isPrintLicensingEnabled === true);
            setIsGloballyFrozen(raw.isGloballyFrozen === true);
            setNegSettings(getNegotiationSettings(raw));
          }
        }
            } catch (err) { console.error("fetchBook error:", err); } finally { setLoading(false); }
    };
    if (bookId) fetchBook();
  }, [bookId]);

  useEffect(() => {
    const fetchAllBooks = async () => {
      try {
        const processed = booksData.map((b) => ({ ...b, image: getThumbnailUrl(b) }));
        setAllBooks(processed);
        try {
          /* Fetch all approved non-frozen books */
const snap = await getDocs(
  query(collection(db, "advertMyBook"), where("status", "==", "approved")),
);          /* Also fetch free books directly (same query as OpenAccessPage) */
          const freeSnap = await getDocs(query(collection(db, "advertMyBook"), where("isFree", "==", true), where("status", "==", "approved")));
          const freeIdsSeen = new Set();
          const freeFirestoreBooks = [];
          freeSnap.forEach((d) => {
            freeIdsSeen.add(d.id);
            const data = d.data();
            if (!data.bookTitle) return;
            const b = {
              id: `firestore-${d.id}`, firestoreId: d.id,
              title: data.bookTitle, author: data.author, category: data.category,
              price: 0, isFree: true, accessType: "free",
              pages: data.pages, format: data.format || "PDF",
              description: data.description, driveFileId: data.driveFileId,
              pdfUrl: data.pdfUrl, previewUrl: data.previewUrl, embedUrl: data.embedUrl,
              isFromFirestore: true,
              tableOfContents: data.tableOfContents || data.tableOfContent || null,
            };
            b.image = getThumbnailUrl(b);
            freeFirestoreBooks.push(b);
          });
          const fb = [];
                   snap.forEach((d) => {
                     if (freeIdsSeen.has(d.id))
                       return; /* skip — already in freeFirestoreBooks */
                     const data = d.data();
                     if (!data.bookTitle) return;
                     if (data.isGloballyFrozen === true)
                       return; /* skip frozen books in JS instead of the query */
                     const b = {
                       id: `firestore-${d.id}`,
                       firestoreId: d.id,
                       title: data.bookTitle,
                       author: data.author,
                       category: data.category,
                       price: data.price,
                       isFree: data.isFree,
                       accessType: data.accessType,
                       pages: data.pages,
                       format: data.format || "PDF",
                       description: data.description,
                       driveFileId: data.driveFileId,
                       pdfUrl: data.pdfUrl,
                       previewUrl: data.previewUrl,
                       embedUrl: data.embedUrl,
                       isFromFirestore: true,
                       tableOfContents:
                         data.tableOfContents || data.tableOfContent || null,
                     };
                     b.image = getThumbnailUrl(b);
                     fb.push(b);
                   });
          /* ── All three arrays are now fully built — combine and split ── */
          const combined = [...processed, ...fb, ...freeFirestoreBooks].sort(() => Math.random() - 0.5);
          setAllBooks(combined);
          const freeSuggestions = [...freeFirestoreBooks, ...processed.filter(b => isOpenAccess(b))].slice(0, 6);
          setSuggestedFreeBooks(freeSuggestions);
          setSuggestedPaidBooks(fb.filter(b => !isOpenAccess(b)).slice(0, 6));
        } catch { }
      } catch {
        const fallback = booksData.map((b) => ({ ...b, image: getThumbnailUrl(b) }));
        setAllBooks(fallback);
        setSuggestedFreeBooks(fallback.filter(b => isOpenAccess(b)).slice(0, 6));
        setSuggestedPaidBooks(fallback.filter(b => !isOpenAccess(b)).slice(0, 6));
      }
    };
    fetchAllBooks();
  }, []);

  const checkPurchaseStatus = async (userId) => {
    try {
      const ud = await getDoc(doc(db, "users", userId));
      if (ud.exists()) {
        const pb = ud.data().purchasedBooks || {};
        const cId = bookId?.replace("firestore-", "");
        let purchased = pb[bookId] || pb[cId] || pb[`firestore-${cId}`];
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
        setIsSaved(false);
        showToastMessage("Removed from saved books");
      } else {
        arr.push({ id: book.id, title: book.title, author: book.author, price: book.price, savedAt: new Date().toISOString() });
        setIsSaved(true);
        showToastMessage("Saved for later!");
      }
      await updateDoc(ref, { savedBooks: arr });
      setShowOptionsModal(false);
    } catch { alert("Error saving book. Please try again."); }
  };

  const showToastMessage = (msg) => { setToastMessage(msg); setShowToast(true); setTimeout(() => setShowToast(false), 3000); };

  const handlePurchase = () => {
    const cId = bookId?.replace("firestore-", "") || book?.firestoreId || bookId;
    router.push(`/payment?bookId=${cId}`);
  };

  /* ── CHANGE 1: Free access → save to my-books, never expose Drive link ── */
  const handleFreeAccess = async () => {
    if (!user) { router.push("/signin"); return; }
    try {
      /* Add to purchasedBooks in Firestore so it appears in /my-books */
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);
      const pb = userSnap.exists() ? (userSnap.data().purchasedBooks || {}) : {};
      const cId = bookId?.replace("firestore-", "");
      const key = cId || bookId;

      if (!pb[key] && !pb[bookId]) {
        await updateDoc(userRef, {
          [`purchasedBooks.${key}`]: {
            bookId: key,
            title: book?.title || "",
            author: book?.author || "",
            price: 0,
            isFree: true,
            savedAt: new Date().toISOString(),
          },
        });
      }
      showToastMessage("Saved to your library! Opening in My Books…");
      setTimeout(() => router.push("/my-books"), 1200);
    } catch {
      /* Fallback: just redirect */
      router.push("/my-books");
    }
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
      setFeedbackRating(0);
      setFeedbackText("");
      setShowFeedbackModal(false);
      setBookFeedbackCount((prev) => prev + 1);
      showToastMessage("Feedback submitted! Redirecting...");
      setTimeout(() => router.push(`/book/feedbacks?bookId=${bookId}`), 1000);
    } catch { showToastMessage("Error submitting feedback. Try again."); }
    finally { setIsSubmittingFeedback(false); }
  };

  const formatViews = (n) => n >= 1000000 ? `${(n / 1000000).toFixed(1)}M` : n >= 1000 ? `${(n / 1000).toFixed(1)}K` : n.toString();

  const PageCountDisplay = ({ style = {}, fontSize = "10px" }) => {
    const displayPages = getDisplayPages();
    const free = book && isOpenAccess(book);
    const sellerUploaded = book && isSellerBook(book);
    const showCalculating = free && !sellerUploaded && calculatingPages;
    if (showCalculating) return <span className="calculating-pages" style={{ fontSize, fontFamily: "'Lato',sans-serif", color: GOLD, fontWeight: 700, letterSpacing: "0.04em", ...style }}>Calculating…</span>;
    if (displayPages == null) return null;
    return <span style={{ fontSize, fontFamily: "'Lato',sans-serif", ...style }}>{displayPages}p</span>;
  };

  /* ── CHANGE 2: Book Owner Profile Panel (replaces LAN Lecturers) ── */
const BookOwnerPanel = () => {
  if (loadingOwnerProfile) {
    return (
      <div
        style={{
          background: "#fff",
          border: "0.5px solid #e5ddd0",
          padding: "20px",
        }}
      >
        <div
          style={{
            display: "flex",
            gap: 14,
            animation: "pulse2 1.5s infinite",
          }}
        >
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: 22,
              background: "#f0ebe0",
              flexShrink: 0,
            }}
          />
          <div style={{ flex: 1 }}>
            <div
              style={{
                height: 12,
                background: "#f0ebe0",
                marginBottom: 8,
                width: "60%",
              }}
            />
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
  const initials = (p.name || "?").trim().split(/\s+/).filter(Boolean)
    .map((w, i, a) => (i === 0 || i === a.length - 1 ? w[0] : "")).join("").toUpperCase();

  const subRow = { display: "flex", alignItems: "center", gap: 5, margin: "3px 0 0", fontSize: 12, color: "#888", fontFamily: "'Lato',sans-serif", minWidth: 0 };
  const ell = { overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", minWidth: 0 };

  return (
    <div
      style={{
        background: "#fff",
        border: "0.5px solid #e5ddd0",
        padding: "20px",
      }}
    >
      <p
        style={{
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: "0.16em",
          textTransform: "uppercase",
          color: GOLD,
          margin: "0 0 12px",
          fontFamily: "'Lato',sans-serif",
        }}
      >
        Uploaded By
      </p>

      <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
        {/* Avatar: initials sit behind the photo, so a broken image falls back cleanly */}
        <div
          style={{ position: "relative", width: 72, height: 72, flexShrink: 0 }}
        >
          <Link
            href={profileHref}
            aria-label={`Open ${displayName}'s profile`}
            style={{
              position: "relative",
              width: "100%",
              height: "100%",
              borderRadius: 22,
              overflow: "hidden",
              border: `${p.verified ? 2 : 1}px solid ${p.verified ? "#1d9bf0" : "#e5ddd0"}`,
              background: NAVY,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              textDecoration: "none",
            }}
          >
            <span
              style={{
                color: GOLD,
                fontSize: 24,
                fontWeight: 900,
                fontFamily: "'Playfair Display',serif",
              }}
            >
              {initials}
            </span>
            {p.photoURL && (
              <img
                src={p.photoURL}
                alt=""
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
                style={{
                  position: "absolute",
                  inset: 0,
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  objectPosition: "top center",
                }}
              />
            )}
          </Link>
          {p.verified && (
            <VerifiedBadge
              size={20}
              ring="#fff"
              style={{ position: "absolute", right: -4, bottom: -4 }}
            />
          )}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              minWidth: 0,
            }}
          >
            <Link
              href={profileHref}
              style={{ textDecoration: "none", minWidth: 0 }}
            >
              <span
                style={{
                  ...ell,
                  display: "block",
                  fontFamily: "'Playfair Display',serif",
                  fontSize: 16,
                  fontWeight: 700,
                  color: NAVY,
                  lineHeight: 1.25,
                }}
              >
                {displayName}
              </span>
            </Link>
          </div>

          {p.institution && (
            <p style={{ ...subRow, marginTop: 2 }}>
              <span style={ell}>{p.institution}</span>
            </p>
          )}
          {p.location && (
            <p style={subRow}>
              <MapPin size={11} style={{ color: GOLD, flexShrink: 0 }} />
              <span style={ell}>{p.location}</span>
            </p>
          )}
          {p.shop && (
            <p style={subRow}>
              <Store size={11} style={{ color: GOLD, flexShrink: 0 }} />
              <span style={ell}>{p.shop}</span>
            </p>
          )}
          {p.verified && (
            <p style={{ ...subRow, color: "#1d9bf0", fontWeight: 700 }}>
              <VerifiedBadge size={12} />{" "}
              {p.title ? "Verified faculty" : "Verified seller"}
            </p>
          )}
        </div>
      </div>

      {/* Short bio */}
      {p.bio && (
        <p
          style={{
            fontSize: 12,
            color: "#666",
            lineHeight: 1.65,
            margin: "14px 0 0",
            fontFamily: "'Lato',sans-serif",
            display: "-webkit-box",
            WebkitLineClamp: 3,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            wordBreak: "break-word",
          }}
        >
          {p.bio}
        </p>
      )}

      {/* Stats */}
      <div style={{ display: "flex", gap: 8, margin: "14px 0 0" }}>
        {[
          {
            icon: <Users size={12} style={{ color: GOLD }} />,
            label: `${ownerFollowers} follower${ownerFollowers === 1 ? "" : "s"}`,
          },
          {
            icon: <ShoppingBag size={12} style={{ color: GOLD }} />,
            label: `${p.booksSold} sold`,
          },
        ].map(({ icon, label }) => (
          <div
            key={label}
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              background: CREAM,
              border: "0.5px solid #f0ebe0",
              padding: "8px 6px",
              fontSize: 11,
              fontWeight: 700,
              color: NAVY,
              fontFamily: "'Lato',sans-serif",
            }}
          >
            {icon}
            {label}
          </div>
        ))}
      </div>

      {/* Actions */}
      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
        <Link
          href={profileHref}
          style={{
            flex: 1,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            background: GOLD,
            color: NAVY,
            padding: "11px 8px",
            borderRadius: 8,
            fontSize: 12,
            fontWeight: 700,
            textDecoration: "none",
            fontFamily: "'Lato',sans-serif",
            letterSpacing: "0.04em",
          }}
        >
          View profile
        </Link>
        {!isOwnBook && (
          <button
            onClick={handleFollowOwner}
            disabled={isFollowLoading}
            style={{
              flex: 1,
              padding: "11px 8px",
              borderRadius: 8,
              border: isFollowing ? "0.5px solid #86efac" : "none",
              background: isFollowing ? "rgba(22,163,74,0.08)" : "#ece6da",
              color: isFollowing ? "#16a34a" : NAVY,
              fontSize: 12,
              fontWeight: 700,
              cursor: isFollowLoading ? "wait" : "pointer",
              fontFamily: "'Lato',sans-serif",
              letterSpacing: "0.04em",
              transition: "background .15s",
            }}
          >
            {isFollowLoading ? "…" : isFollowing ? "✓ Following" : "+ Follow"}
          </button>
        )}
      </div>
    </div>
  );
};

  const PhysicalStockBadge = () => {
    if (loadingPhysical) return (
      <div style={{ margin: "0 16px 0", padding: "14px 16px", background: "#fff", border: "0.5px solid #e5ddd0", display: "flex", alignItems: "center", gap: "10px" }}>
        <div style={{ width: "16px", height: "16px", border: `2px solid ${GOLD}`, borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite", flexShrink: 0 }} />
        <span style={{ fontSize: "11px", color: "#aaa", fontFamily: "'Lato',sans-serif" }}>Checking physical availability…</span>
      </div>
    );
    if (!physicalInventory) return (
      <div style={{ margin: "0 16px 0", padding: "14px 16px", background: "#fff", border: "0.5px solid #e5ddd0", display: "flex", alignItems: "center", gap: "12px" }}>
        <div style={{ width: "36px", height: "36px", background: "#f5f1ea", border: "0.5px solid #e5ddd0", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <HelpCircle size={16} style={{ color: "#ccc" }} />
        </div>
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
          <div style={{ width: "36px", height: "36px", background: "#fff5f5", border: "0.5px solid #fecaca", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <AlertCircle size={16} style={{ color: "#f87171" }} />
          </div>
          <div>
            <p style={{ fontSize: "11px", fontWeight: 700, color: "#f87171", margin: "0 0 2px", fontFamily: "'Lato',sans-serif", textTransform: "uppercase", letterSpacing: "0.06em" }}>Out of Stock</p>
            <p style={{ fontSize: "12px", color: "#aaa", margin: 0, fontFamily: "'Lato',sans-serif" }}>Physical copies currently out of stock at LAN Head Office Abuja</p>
          </div>
        </div>
      </div>
    );
    return (
      <>
        <style>{`@keyframes goldPulse { 0%, 100% { box-shadow: 0 0 0 0 rgba(184,150,62,0.4); } 50% { box-shadow: 0 0 0 6px rgba(184,150,62,0); } } .physical-available { animation: goldPulse 2.4s ease-in-out infinite; }`}</style>
        <div className="physical-available" style={{ margin: "0 16px 0", padding: "16px", background: "#fff", border: `1.5px solid ${GOLD}` }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
            <div style={{ width: "38px", height: "38px", background: NAVY, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Package size={17} style={{ color: GOLD }} />
            </div>
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
              <button onClick={handleBuyPhysical} style={{ display: "flex", alignItems: "center", gap: "6px", background: NAVY, color: "#fff", padding: "9px 16px", border: "none", fontSize: "11px", fontWeight: 700, cursor: "pointer", fontFamily: "'Lato',sans-serif", letterSpacing: "0.06em" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#1a3a6e")} onMouseLeave={(e) => (e.currentTarget.style.background = NAVY)}>
                <ShoppingBag size={13} /> Get Physical Copy — {fmt(book.price)}
              </button>
            </div>
          </div>
        </div>
      </>
    );
  };

  const PdfViewer = ({ heightClass = "600px", fullHeight = "900px" }) => {
    const free = book && isOpenAccess(book);
    const hasAccess = isPurchased || free;
    return (
      <div style={{ background: BG }}>
        {hasAccess ? (
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
                <button onClick={handleFreeAccess} style={{ display: "flex", alignItems: "center", gap: "8px", background: NAVY, color: GOLD, padding: "11px 22px", border: `0.5px solid ${GOLD}`, fontSize: "12px", fontWeight: 700, cursor: "pointer", fontFamily: "'Lato',sans-serif", letterSpacing: "0.06em" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "#1a3a6e")} onMouseLeave={(e) => (e.currentTarget.style.background = NAVY)}>
                  <Download size={14} /> Save to My Books
                </button>
              </div>
            )}
          </div>
        ) : (
          <div>
            <div style={{ position: "relative", overflow: "hidden", height: !book.embedUrl && !book.pdfUrl ? "0px" : heightClass }}>
              {book.embedUrl ? <iframe src={book.embedUrl} style={{ width: "100%", height: "100%", border: "none", pointerEvents: "none" }} title={`${book.title} - Preview`} scrolling="no" />
                : book.pdfUrl ? <iframe src={`${book.pdfUrl}#view=FitH&page=1&toolbar=0`} style={{ width: "100%", height: "100%", border: "none", pointerEvents: "none" }} title={`${book.title} - Preview`} scrolling="no" /> : null}
            </div>
            <div style={{ background: "#fff", border: "0.5px solid #e5ddd0", margin: "16px", padding: "32px 24px", textAlign: "center" }}>
              <div style={{ width: "56px", height: "56px", border: "0.5px solid #e5ddd0", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", background: CREAM }}>
                <Lock size={22} style={{ color: NAVY }} />
              </div>
              <p style={{ fontFamily: "'Playfair Display',serif", fontSize: "18px", fontWeight: 700, color: NAVY, margin: "0 0 6px" }}>Purchase to unlock full access</p>
              <p style={{ fontSize: "12px", color: "#888", marginBottom: "20px", fontFamily: "'Lato',sans-serif" }}>Get instant access to all {book.pages} pages</p>
              <button onClick={handlePurchase} style={{ width: "100%", background: NAVY, color: "#fff", padding: "14px 24px", border: "none", fontSize: "14px", fontWeight: 700, cursor: "pointer", fontFamily: "'Lato',sans-serif", letterSpacing: "0.04em" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#1a3a6e")} onMouseLeave={(e) => (e.currentTarget.style.background = NAVY)}>
                Purchase for {fmt(book.price)}
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

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

  const free = isOpenAccess(book);
  const sellerUploaded = isSellerBook(book);
  const cleanId = String(book.id || "").replace("firestore-", "");
const sold =
  bookSalesCount[cleanId] ||
  bookSalesCount[book.firestoreId] ||
  bookSalesCount[String(book.id || "").replace("firestore-", "")] ||
  sellerSoldCount ||
  0;
  const displayPages = getDisplayPages();
  const uploaderName = getUploaderName();

  /* ── CHANGE 3: Sidebar suggested books sub-components ── */
  const SuggestedBookLink = ({ rb }) => (
    <Link href={`/book/preview?id=${String(rb.id).replace("firestore-", "")}`} style={{ textDecoration: "none", display: "flex", gap: "10px" }}>
      <div style={{ position: "relative", flexShrink: 0 }}>
        <img src={getThumbnailUrl(rb)} alt={rb.title} style={{ width: "52px", aspectRatio: "3/4", objectFit: "cover", display: "block" }} onError={(e) => { e.target.src = "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400"; }} loading="lazy" />
        <span style={{ position: "absolute", top: "4px", left: "4px", background: NAVY, color: GOLD, fontSize: "7px", fontWeight: 700, padding: "2px 5px", fontFamily: "'Lato',sans-serif" }}>PDF</span>
        {isOpenAccess(rb) && <span style={{ position: "absolute", bottom: "4px", left: "4px", background: "#16a34a", color: "#fff", fontSize: "7px", fontWeight: 700, padding: "2px 5px", fontFamily: "'Lato',sans-serif" }}>FREE</span>}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <h4 style={{ fontFamily: "'Playfair Display',serif", fontSize: "11px", fontWeight: 700, color: NAVY, margin: 0, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", lineHeight: 1.35 }}>{rb.title}</h4>
        {rb.pages && <p style={{ fontSize: "10px", color: "#aaa", margin: "2px 0 0", fontFamily: "'Lato',sans-serif" }}>{rb.pages}p</p>}
      </div>
    </Link>
  );

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400&family=Lato:wght@300;400;700&display=swap');
        .lan-root { font-family:'Lato',sans-serif; background:${BG}; overflow-x:hidden; max-width:100vw; box-sizing:border-box; }
        .lan-serif { font-family:'Playfair Display',Georgia,serif; }
        .action-btn { display:flex; flex-direction:column; align-items:center; gap:5px; background:transparent; border:none; cursor:pointer; color:${NAVY}; font-family:'Lato',sans-serif; transition:opacity 0.18s; }
        .action-btn:hover { opacity:0.7; }
        .action-btn span { font-size:10px; font-weight:700; letter-spacing:0.06em; text-transform:uppercase; }
        .stat-pill { display:flex; align-items:center; gap:6px; background:${NAVY}; color:#fff; padding:8px 12px; font-family:'Lato',sans-serif; font-size:11px; font-weight:700; }
        .txn-row { display:flex; align-items:center; justify-content:space-between; padding:12px 14px; border:0.5px solid #f0ebe0; background:#fff; margin-bottom:6px; transition:background 0.15s; cursor:pointer; }
        .txn-row:hover { background:${CREAM}; }
        .sbar-none { scrollbar-width:none; -ms-overflow-style:none; }
        .sbar-none::-webkit-scrollbar { display:none; }
        .gold-pill { display:inline-flex; align-items:center; gap:6px; background:rgba(184,150,62,0.12); border:0.5px solid rgba(184,150,62,0.3); padding:5px 12px; border-radius:999px; }
        .modal-overlay { position:fixed; inset:0; background:rgba(0,0,0,0.65); z-index:50; display:flex; align-items:flex-start; justify-content:center; overflow-y:auto; }
        .modal-inner { background:#fff; width:100%; min-height:100vh; max-width:640px; }
        @media(min-width:640px){ .modal-inner { min-height:auto; margin:40px auto; } }
        @keyframes slideUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        .anim-up { animation:slideUp 0.5s cubic-bezier(0.4,0,0.2,1) both; }
        @keyframes spin { to{transform:rotate(360deg)} }
        .pulse-dot { animation:pulse2 2s infinite; }
        @keyframes pulse2 { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @media(min-width:1024px){ .lg-grid { grid-template-columns:280px 1fr 240px !important; } .lg-hide { display:none !important; } .lg-show { display:block !important; } }
        .lg-show { display:none; }
        *, *::before, *::after { box-sizing:border-box; }
        body { overflow-x:hidden; }
        @keyframes oa-shimmer { 0% { background-position:-200% center; } 100% { background-position:200% center; } }
        .oa-header-badge { background:linear-gradient(90deg,#16a34a 0%,#22c55e 40%,#16a34a 80%); background-size:200% auto; animation:oa-shimmer 2.4s linear infinite; color:#fff; font-size:10px; font-weight:700; letter-spacing:0.08em; text-transform:uppercase; padding:6px 14px; font-family:'Lato',sans-serif; display:inline-flex; align-items:center; gap:5px; }
        @keyframes calc-shimmer { 0%{opacity:1} 50%{opacity:0.35} 100%{opacity:1} }
        .calculating-pages { animation:calc-shimmer 1.4s ease-in-out infinite; }
        .lan-header-actions { display:flex; align-items:center; gap:6px; flex-shrink:0; min-width:0; overflow:hidden; }
        @media(max-width:480px){ .oa-header-badge { display:none !important; } .lan-header-cta { font-size:10px !important; padding:7px 10px !important; } }
      `}</style>

      {/* Open Access is now handled inline — no external modal needed for free docs */}
      <OpenAccessModal isOpen={false} onClose={() => {}} book={book} countdownSec={10} />

      <div className="lan-root" style={{ minHeight: "100vh" }}>
        {/* ══ HEADER ══ */}
        <header style={{ background: NAVY, backgroundImage: "radial-gradient(rgba(184,150,62,0.06) 1px,transparent 1px)", backgroundSize: "24px 24px", position: "sticky", top: 0, zIndex: 40, borderBottom: `0.5px solid rgba(184,150,62,0.2)` }}>
          <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "0 12px", height: "56px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px", overflow: "hidden" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", flexShrink: 0, minWidth: 0 }}>
              <button onClick={() => setShowNavMenu(!showNavMenu)} style={{ width: "34px", height: "34px", flexShrink: 0, border: "0.5px solid rgba(255,255,255,0.2)", background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(255,255,255,0.7)" }}>
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
                <button className="lan-header-cta" onClick={handleFreeAccess} style={{ display: "flex", alignItems: "center", gap: "5px", background: "rgba(22,163,74,0.15)", color: "#86efac", padding: "7px 12px", border: "0.5px solid rgba(22,163,74,0.4)", fontSize: "11px", fontWeight: 700, cursor: "pointer", fontFamily: "'Lato',sans-serif", letterSpacing: "0.05em", whiteSpace: "nowrap", flexShrink: 0 }}>
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
              <button onClick={() => setShowOptionsModal(true)} style={{ width: "34px", height: "34px", flexShrink: 0, border: "0.5px solid rgba(255,255,255,0.2)", background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(255,255,255,0.7)" }}>
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
                  <button onClick={() => setShowNavMenu(false)} style={{ background: "transparent", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.6)" }}><X size={20} /></button>
                </div>
                {isGloballyFrozen ? (
                  <div style={{ width: "100%", background: "rgba(99,102,241,0.15)", border: "0.5px solid rgba(99,102,241,0.3)", padding: "11px", textAlign: "center", fontSize: "12px", fontWeight: 700, color: "#a5b4fc", fontFamily: "'Lato',sans-serif" }}>❄ Resource Frozen by Admin</div>
                ) : free ? (
                  <button onClick={() => { setShowNavMenu(false); handleFreeAccess(); }} style={{ width: "100%", background: "#16a34a", color: "#fff", padding: "11px", border: "none", fontSize: "12px", fontWeight: 700, cursor: "pointer", fontFamily: "'Lato',sans-serif", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
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

            {/* ── LEFT SIDEBAR ── */}
            <div className="lg-show" style={{ display: "none" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {/* Book cover */}
                <div style={{ background: "#fff", border: "0.5px solid #e5ddd0", overflow: "hidden" }}>
                  <div style={{ position: "relative" }}>
                    <img src={book.image || getThumbnailUrl(book)} alt={book.title} style={{ width: "100%", aspectRatio: "3/4", objectFit: "cover", display: "block" }} onError={(e) => { e.target.src = "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400"; }} />
                    <div style={{ position: "absolute", top: "10px", left: "10px", display: "inline-flex", alignItems: "center", gap: "4px", background: NAVY, padding: "3px 8px", fontSize: "9px", fontWeight: 700, color: "#fff", fontFamily: "'Lato',sans-serif" }}>
                      <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: "#22c55e", display: "inline-block" }} />PDF
                    </div>
                    {free ? (
                      <span style={{ position: "absolute", top: "10px", right: "10px", background: "#16a34a", color: "#fff", fontSize: "9px", fontWeight: 700, padding: "3px 8px", fontFamily: "'Lato',sans-serif", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                        <Unlock size={9} /> FREE
                      </span>
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

                {/* Action buttons */}
                <div style={{ background: "#fff", border: "0.5px solid #e5ddd0", padding: "16px", display: "flex", justifyContent: "space-around" }}>
                  {[
                    { icon: isGloballyFrozen ? <Lock size={18} style={{ color: "#aaa" }} /> : free ? <Unlock size={18} style={{ color: "#16a34a" }} /> : <Download size={18} />, label: isGloballyFrozen ? "Frozen" : free ? "Save Free" : isPurchased ? "Open" : "Purchase", onClick: isGloballyFrozen ? () => alert("This document is currently frozen.") : free ? handleFreeAccess : isPurchased ? () => router.push("/my-books") : handlePurchase },
                    { icon: <Bookmark size={18} style={isSaved ? { fill: NAVY, color: NAVY } : {}} />, label: isSaved ? "Saved" : "Save", onClick: handleSaveForLater },
                    { icon: <Share2 size={18} />, label: "Share", onClick: handleShare },
                    { icon: <ThumbsUp size={18} />, label: positiveRatingPercent !== null ? `${positiveRatingPercent}%` : "Rate", onClick: () => setShowFeedbackModal(true) },
                    { icon: <Sparkles size={18} style={{ color: "#a78bfa" }} />, label: "Ask Educo", onClick: () => router.push(`/ai-chat?bookId=${bookId}&bookTitle=${encodeURIComponent(book?.title || "")}`) },
                  ].map(({ icon, label, onClick }) => <button key={label} className="action-btn" onClick={onClick}>{icon}<span>{label}</span></button>)}
                </div>

                {/* Stats */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                  <div className="stat-pill"><Layers size={13} style={{ color: GOLD }} />{free ? <span style={{ color: "#86efac" }}>FREE</span> : <span>{fmt(book.price)}</span>}</div>
                  <div className="stat-pill"><ShoppingBag size={13} style={{ color: GOLD }} /><span>{sold} {free ? "downloads" : "sold"}</span></div>
                  <button className="stat-pill" onClick={() => router.push(`/book/feedbacks?bookId=${bookId}`)} style={{ cursor: "pointer", border: "none" }} onMouseEnter={(e) => (e.currentTarget.style.background = "#1a3a6e")} onMouseLeave={(e) => (e.currentTarget.style.background = NAVY)}>
                    <ThumbsUp size={13} style={{ color: GOLD }} /><span>{positiveRatingPercent !== null ? `${positiveRatingPercent}% (${totalRatings})` : `Reviews: ${bookFeedbackCount}`}</span>
                  </button>
                  <div className="stat-pill"><FileText size={13} style={{ color: GOLD }} /><PageCountDisplay fontSize="11px" /></div>
                </div>

                {/* Meta */}
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

                {/* ── CHANGE 2: Book Owner Profile (replaces LAN Lecturers) ── */}
                <BookOwnerPanel />
              </div>
            </div>

            {/* ── CENTER ── */}
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {/* Mobile book info */}
              <div className="lg-hide" style={{ background: "#fff", border: "0.5px solid #e5ddd0" }}>
                <div style={{ display: "flex", gap: "14px", padding: "16px" }}>
                  <div style={{ position: "relative", flexShrink: 0, width: "90px" }}>
                    <img src={getThumbnailUrl(book)} alt={book.title} style={{ width: "90px", aspectRatio: "3/4", objectFit: "cover", display: "block" }} onError={(e) => { e.target.src = "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400"; }} />
                    {free && <span style={{ position: "absolute", bottom: "6px", left: "6px", background: "#16a34a", color: "#fff", fontSize: "8px", fontWeight: 700, padding: "2px 6px", fontFamily: "'Lato',sans-serif", display: "inline-flex", alignItems: "center", gap: "3px" }}><Unlock size={8} /> FREE</span>}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: "14px", fontWeight: 700, color: NAVY, margin: "0 0 3px", lineHeight: 1.3 }}>{book.title}</h1>
                    <p style={{ fontSize: "11px", color: "#888", margin: "0 0 4px", fontFamily: "'Lato',sans-serif" }}>by {book.author}</p>
                    <p style={{ fontSize: "11px", color: "#aaa", margin: "0 0 4px", fontFamily: "'Lato',sans-serif" }}>Uploaded by <span style={{ color: "#555", fontWeight: 700 }}>{uploaderName}</span></p>
                    <p style={{ fontSize: "11px", color: "#666", lineHeight: 1.6, margin: "0 0 6px", display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{book.description}</p>
                    <button onClick={() => setShowOverview(true)} style={{ fontSize: "11px", color: GOLD, background: "transparent", border: "none", cursor: "pointer", padding: 0, fontWeight: 700, fontFamily: "'Lato',sans-serif" }}>Full description →</button>
                  </div>
                </div>
                {/* Mobile actions */}
                <div style={{ borderTop: "0.5px solid #e5ddd0", padding: "12px 16px", display: "flex", justifyContent: "space-around" }}>
                  {[
                    { icon: isGloballyFrozen ? <Lock size={18} style={{ color: "#aaa" }} /> : free ? <Unlock size={18} style={{ color: "#16a34a" }} /> : <Download size={18} />, label: isGloballyFrozen ? "Frozen" : free ? "Save Free" : isPurchased ? "Open" : "Purchase", onClick: isGloballyFrozen ? () => alert("This document is currently frozen.") : free ? handleFreeAccess : isPurchased ? () => router.push("/my-books") : handlePurchase },
                    { icon: <Bookmark size={18} style={isSaved ? { fill: NAVY, color: NAVY } : {}} />, label: isSaved ? "Saved" : "Save", onClick: handleSaveForLater },
                    { icon: <Share2 size={18} />, label: "Share", onClick: handleShare },
                    { icon: <ThumbsUp size={18} />, label: positiveRatingPercent !== null ? `${positiveRatingPercent}%` : "Rate", onClick: () => setShowFeedbackModal(true) },
                    { icon: <Sparkles size={18} style={{ color: "#a78bfa" }} />, label: "Ask AI", onClick: () => router.push(`/ai-chat?bookId=${bookId}&bookTitle=${encodeURIComponent(book?.title || "")}`) },
                  ].map(({ icon, label, onClick }) => <button key={label} className="action-btn" onClick={onClick}>{icon}<span>{label}</span></button>)}
                </div>
              </div>

              {/* PDF Viewer */}
              <div style={{ background: "#fff", border: "0.5px solid #e5ddd0", overflow: "hidden" }}>
                <div style={{ background: NAVY, padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <div className="gold-pill">
                      <Eye size={10} style={{ color: GOLD }} />
                      <span style={{ fontSize: "9px", fontWeight: 700, color: GOLD, letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: "'Lato',sans-serif" }}>{free ? "Open Access" : isPurchased ? "Full Access" : "Preview"}</span>
                    </div>
                    {free && <div style={{ display: "flex", alignItems: "center", gap: "5px" }}><div style={{ width: "5px", height: "5px", borderRadius: "50%", background: "#22c55e" }} /><span style={{ fontSize: "9px", color: "#86efac", fontWeight: 700, fontFamily: "'Lato',sans-serif" }}>FREE DOCUMENT</span></div>}
                    {!free && isPurchased && <div style={{ display: "flex", alignItems: "center", gap: "5px" }}><div style={{ width: "5px", height: "5px", borderRadius: "50%", background: "#22c55e" }} /><span style={{ fontSize: "9px", color: "#86efac", fontWeight: 700, fontFamily: "'Lato',sans-serif" }}>PURCHASED</span></div>}
                  </div>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button onClick={() => setShowOverview(true)} style={{ display: "flex", alignItems: "center", gap: "5px", padding: "5px 10px", border: "0.5px solid rgba(255,255,255,0.2)", background: "transparent", color: "rgba(255,255,255,0.7)", fontSize: "10px", fontWeight: 700, cursor: "pointer", fontFamily: "'Lato',sans-serif" }}><Layers size={12} /> Overview</button>
                    <button onClick={() => setShowSummary(true)} style={{ display: "flex", alignItems: "center", gap: "5px", padding: "5px 10px", border: "0.5px solid rgba(255,255,255,0.2)", background: "transparent", color: "rgba(255,255,255,0.7)", fontSize: "10px", fontWeight: 700, cursor: "pointer", fontFamily: "'Lato',sans-serif" }}><FileText size={12} /> Summary</button>
                  </div>
                </div>
                {/* {user && <StudyBuddyTracker bookId={bookId} userId={user.uid} userName={user.displayName || "Student"} userPhoto={user.photoURL || null} bookTitle={book?.title || ""} />} */}
                <PhysicalStockBadge />
                <BookNegotiationCard
                book={book}
                bookId={cleanBookId}
                settings={negSettings}
                user={user}
                sellerName={bookOwnerProfile?.name || book?.sellerName}
                fmt={fmt}
                isPurchased={isPurchased}
                isFrozen={isGloballyFrozen}
                onPay={(n) => router.push(`/payment?bookId=${cleanBookId}&negotiationId=${n.id}`)}
              />
                {isGloballyFrozen ? <FrozenPdfGate /> : <PdfViewer heightClass="400px" fullHeight="900px" />}
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
                                {stars > 0 && <div style={{ display: "flex", gap: "2px", marginBottom: "6px" }}>{[1,2,3,4,5].map(n => <svg key={n} width={12} height={12} viewBox="0 0 24 24" fill={n<=stars?GOLD:"none"} stroke={n<=stars?GOLD:"#ddd"} strokeWidth={1.8}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>)}</div>}
                                <p style={{ fontSize: "13px", color: "#444", fontFamily: "'Lato',sans-serif", lineHeight: 1.65, margin: "0 0 8px", fontStyle: "italic" }}>"{fb.feedback || "(No details provided)"}"</p>
                                {isOwner && !fb.sellerReply && <button onClick={() => setReplyingTo(isReplying ? null : fb.id)} style={{ fontSize: "11px", fontWeight: 700, color: isReplying ? "#aaa" : GOLD, background: "transparent", border: `0.5px solid ${isReplying ? "#e5ddd0" : "rgba(184,150,62,0.3)"}`, padding: "4px 12px", cursor: "pointer", fontFamily: "'Lato',sans-serif" }}>{isReplying ? "✕ Cancel" : "↩ Reply"}</button>}
                              </div>
                            </div>
                          </div>
                          {fb.sellerReply && (
                            <div style={{ background: "rgba(13,34,68,0.04)", borderTop: "0.5px solid #e8e0d4", borderLeft: `3px solid ${GOLD}`, padding: "12px 16px 12px 20px" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                                <div style={{ width: "24px", height: "24px", borderRadius: "50%", background: NAVY, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                  <span style={{ fontSize: "9px", fontWeight: 700, color: GOLD, fontFamily: "'Lato',sans-serif" }}>S</span>
                                </div>
                                <p style={{ fontSize: "11px", fontWeight: 700, color: NAVY, margin: 0, fontFamily: "'Lato',sans-serif" }}>{fb.sellerName || book?.sellerName || "Seller"}</p>
                                <span style={{ fontSize: "9px", fontWeight: 700, background: "rgba(184,150,62,0.12)", border: "0.5px solid rgba(184,150,62,0.25)", color: GOLD, padding: "2px 7px", fontFamily: "'Lato',sans-serif", textTransform: "uppercase" }}>Seller</span>
                              </div>
                              <p style={{ fontSize: "12px", color: "#555", fontFamily: "'Lato',sans-serif", lineHeight: 1.65, margin: 0 }}>{fb.sellerReply}</p>
                            </div>
                          )}
                          {isReplying && isOwner && (
                            <div style={{ background: CREAM, borderTop: "0.5px solid #e8e0d4", borderLeft: `3px solid ${GOLD}`, padding: "14px 16px" }}>
                              <textarea autoFocus value={replyText[fb.id] || ""} onChange={(e) => setReplyText((prev) => ({ ...prev, [fb.id]: e.target.value }))} placeholder="Write a professional, helpful response…" maxLength={500} rows={3}
                                style={{ width: "100%", padding: "10px 12px", border: "0.5px solid #e5ddd0", background: "#fff", fontSize: "12px", color: NAVY, resize: "none", outline: "none", fontFamily: "'Lato',sans-serif", lineHeight: 1.6, boxSizing: "border-box" }}
                                onFocus={(e) => (e.currentTarget.style.borderColor = GOLD)} onBlur={(e) => (e.currentTarget.style.borderColor = "#e5ddd0")} />
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

              {/* Mobile: You Might Also Like */}
              <div className="lg-hide">
                <BookOwnerPanel />
              </div>

              {/* Mobile: You Might Also Like */}
              <div className="lg-hide" style={{ background: "#fff", border: "0.5px solid #e5ddd0", padding: "20px" }}>                <p style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: GOLD, margin: "0 0 4px", fontFamily: "'Lato',sans-serif" }}>Discover</p>
                <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: "16px", fontWeight: 700, color: NAVY, margin: "0 0 16px" }}>You Might Also Like</h3>
                {/* Free section */}
                {suggestedFreeBooks.length > 0 && (
                  <>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
                      <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#16a34a", display: "inline-block" }} />
                      <span style={{ fontSize: "9px", fontWeight: 700, color: "#16a34a", fontFamily: "'Lato',sans-serif", letterSpacing: "0.1em", textTransform: "uppercase" }}>Open Access — Free</span>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "14px" }}>
                      {suggestedFreeBooks.slice(0, 4).map(rb => <SuggestedBookLink key={rb.id} rb={rb} />)}
                    </div>
                    <Link href="/open-access" style={{ display: "block", textAlign: "center", fontSize: "11px", fontWeight: 700, color: "#16a34a", textDecoration: "none", fontFamily: "'Lato',sans-serif", background: "rgba(22,163,74,0.06)", border: "0.5px solid rgba(22,163,74,0.25)", padding: "8px", marginBottom: "16px" }}>
                      View all free documents →
                    </Link>
                  </>
                )}
                {/* Paid section */}
                {suggestedPaidBooks.length > 0 && (
                  <>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
                      <span style={{ width: 8, height: 8, borderRadius: "50%", background: GOLD, display: "inline-block" }} />
                      <span style={{ fontSize: "9px", fontWeight: 700, color: GOLD, fontFamily: "'Lato',sans-serif", letterSpacing: "0.1em", textTransform: "uppercase" }}>Premium Documents</span>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                      {suggestedPaidBooks.slice(0, 4).map(rb => <SuggestedBookLink key={rb.id} rb={rb} />)}
                    </div>
                    <Link href="/documents" style={{ display: "block", textAlign: "center", marginTop: "12px", fontSize: "11px", fontWeight: 700, color: GOLD, textDecoration: "none", fontFamily: "'Lato',sans-serif", borderTop: "0.5px solid #f0ebe0", paddingTop: "12px" }}>
                      Browse all documents →
                    </Link>
                  </>
                )}
              </div>
            </div>

            {/* ── RIGHT SIDEBAR ── */}
            <div className="lg-show" style={{ display: "none" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div style={{ background: "#fff", border: "0.5px solid #e5ddd0", padding: "20px" }}>
                  <p style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: GOLD, margin: "0 0 4px", fontFamily: "'Lato',sans-serif" }}>Discover</p>
                  <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: "16px", fontWeight: 700, color: NAVY, margin: "0 0 16px" }}>You Might Also Like</h3>

                  {/* Free subsection */}
                  {suggestedFreeBooks.length > 0 && (
                    <>
                      <div style={{ display: "flex", alignItems: "center", gap: "7px", marginBottom: "10px", paddingBottom: "6px", borderBottom: "0.5px solid rgba(22,163,74,0.15)" }}>
                        <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#16a34a", display: "inline-block", flexShrink: 0 }} />
                        <span style={{ fontSize: "9px", fontWeight: 700, color: "#16a34a", fontFamily: "'Lato',sans-serif", letterSpacing: "0.1em", textTransform: "uppercase" }}>Open Access</span>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "12px" }}>
                        {suggestedFreeBooks.map(rb => <SuggestedBookLink key={rb.id} rb={rb} />)}
                      </div>
                      <Link href="/open-access" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "5px", fontSize: "10px", fontWeight: 700, color: "#16a34a", textDecoration: "none", fontFamily: "'Lato',sans-serif", background: "rgba(22,163,74,0.06)", border: "0.5px solid rgba(22,163,74,0.2)", padding: "8px", marginBottom: "16px" }}>
                        View all free docs <ChevronRight size={11} />
                      </Link>
                    </>
                  )}

                  {/* Paid subsection */}
                  {suggestedPaidBooks.length > 0 && (
                    <>
                      <div style={{ display: "flex", alignItems: "center", gap: "7px", marginBottom: "10px", paddingBottom: "6px", borderBottom: `0.5px solid rgba(184,150,62,0.15)` }}>
                        <span style={{ width: 7, height: 7, borderRadius: "50%", background: GOLD, display: "inline-block", flexShrink: 0 }} />
                        <span style={{ fontSize: "9px", fontWeight: 700, color: GOLD, fontFamily: "'Lato',sans-serif", letterSpacing: "0.1em", textTransform: "uppercase" }}>Premium</span>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                        {suggestedPaidBooks.map(rb => <SuggestedBookLink key={rb.id} rb={rb} />)}
                      </div>
                      <Link href="/documents" style={{ display: "block", textAlign: "center", marginTop: "12px", fontSize: "11px", fontWeight: 700, color: GOLD, textDecoration: "none", fontFamily: "'Lato',sans-serif", borderTop: "0.5px solid #f0ebe0", paddingTop: "12px" }}>
                        Browse all documents →
                      </Link>
                    </>
                  )}
                </div>
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
                <button onClick={() => setShowOverview(false)} style={{ background: "transparent", border: "none", cursor: "pointer", color: "#fff" }}><X size={22} /></button>
              </div>
              <div style={{ padding: "24px", paddingBottom: "80px" }}>
                <img src={getThumbnailUrl(book)} alt={book.title} style={{ width: "100%", objectFit: "cover", marginBottom: "20px", border: "0.5px solid #e5ddd0" }} />
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
                <button onClick={() => setShowSummary(false)} style={{ background: "transparent", border: "none", cursor: "pointer", color: "#fff" }}><X size={22} /></button>
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

        {showOptionsModal && (
          <>
            <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 50 }} onClick={() => setShowOptionsModal(false)} />
            <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: "#fff", zIndex: 51 }}>
              <div style={{ padding: "20px 20px 32px" }}>
                <div style={{ width: "36px", height: "3px", background: "#e5ddd0", margin: "0 auto 20px", borderRadius: "2px" }} />
                {[
                  { icon: <Bookmark size={22} style={isSaved ? { fill: NAVY, color: NAVY } : { color: NAVY }} />, label: isSaved ? "Saved for later" : "Save for later", onClick: handleSaveForLater },
                  { icon: <Share2 size={22} style={{ color: NAVY }} />, label: "Share", onClick: handleShare },
                  { icon: <ThumbsUp size={22} style={{ color: NAVY }} />, label: "Rate this book", onClick: () => { setShowOptionsModal(false); setShowFeedbackModal(true); } },
                  { icon: <Flag size={22} style={{ color: NAVY }} />, label: "Report legal issue", onClick: handleReport },
                ].map(({ icon, label, onClick }) => (
                  <button key={label} onClick={onClick} style={{ width: "100%", display: "flex", alignItems: "center", gap: "14px", padding: "14px 0", border: "none", background: "transparent", cursor: "pointer", borderBottom: "0.5px solid #f0ebe0", color: NAVY, fontFamily: "'Lato',sans-serif", fontSize: "14px", fontWeight: 700 }}>
                    {icon}{label}
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
            <div style={{ position: "fixed", inset: 0, zIndex: 101, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}>
              <div style={{ background: NAVY, width: "100%", maxWidth: "440px", overflow: "hidden" }}>
                <div style={{ padding: "20px 24px", borderBottom: "0.5px solid rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div>
                    <p style={{ fontSize: "10px", color: GOLD, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", margin: "0 0 2px", fontFamily: "'Lato',sans-serif" }}>Your Review</p>
                    <p style={{ fontFamily: "'Playfair Display',serif", fontSize: "18px", fontWeight: 700, color: "#fff", margin: 0 }}>Write a Review</p>
                  </div>
                  <button onClick={() => { setShowFeedbackModal(false); setFeedbackText(""); setFeedbackRating(0); }} style={{ background: "transparent", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.6)", padding: "4px" }}><X size={20} /></button>
                </div>
                <div style={{ padding: "20px 24px" }}>
                  <div style={{ display: "flex", gap: "6px", marginBottom: "20px" }}>
                    {[1,2,3,4,5].map(n => <Star key={n} size={30} fill={n<=feedbackRating?GOLD:"none"} stroke={n<=feedbackRating?GOLD:"rgba(255,255,255,0.3)"} style={{ cursor: "pointer", transition: "transform 0.1s" }} onClick={() => setFeedbackRating(n)} onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.2)")} onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")} />)}
                  </div>
                  <textarea autoFocus value={feedbackText} onChange={(e) => setFeedbackText(e.target.value)} placeholder="Share your thoughts about this book…" rows={4}
                    style={{ width: "100%", background: "rgba(255,255,255,0.06)", border: "0.5px solid rgba(255,255,255,0.15)", padding: "12px", color: "#fff", fontSize: "13px", resize: "none", outline: "none", fontFamily: "'Lato',sans-serif", boxSizing: "border-box" }}
                    onFocus={(e) => (e.currentTarget.style.borderColor = GOLD)} onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)")} />
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
          <div style={{ position: "fixed", bottom: "24px", left: "50%", transform: "translateX(-50%)", background: NAVY, color: "#fff", padding: "12px 20px", zIndex: 9999, fontSize: "13px", fontWeight: 700, fontFamily: "'Lato',sans-serif", border: `0.5px solid rgba(184,150,62,0.3)`, whiteSpace: "nowrap" }}>
            {toastMessage}
          </div>
        )}
      </div>
    </>
  );  
}