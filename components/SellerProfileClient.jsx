"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  collection, getDocs, doc, getDoc, setDoc, deleteDoc,
  query, where, updateDoc, increment,
} from "firebase/firestore";
import { auth, db } from "@/lib/firebaseConfig";
import {
  ArrowLeft, Search, X, ShoppingBag, BookOpen, GraduationCap,
  UserPlus, UserCheck, Users, Building2, Grid3X3, LayoutList,
  Star, Sparkles, TrendingUp, ChevronRight, BookMarked,
} from "lucide-react";
import Link from "next/link";
import Navbar from "@/components/NavBar";
import { onAuthStateChanged } from "firebase/auth";

/* ─── design tokens ─────────────────────────────────────── */
const NAVY  = "#0d2244";
const GOLD  = "#b8963e";
const GOLDD = "#d4aa5a";
const CREAM = "#f5f0e8";
const BG    = "#f5f1ea";

/* ─── thumbnail ─────────────────────────────────────────── */
const getThumbnailUrl = (book) => {
  if (!book) return "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400";
  if (book.driveFileId) return `https://drive.google.com/thumbnail?id=${book.driveFileId}&sz=w400`;
  if (book.embedUrl) {
    const m = book.embedUrl.match(/\/d\/(.*?)\/|\/file\/d\/(.*?)\/|id=(.*?)(&|$)/);
    if (m) { const id = m[1]||m[2]||m[3]; if (id) return `https://drive.google.com/thumbnail?id=${id}&sz=w400`; }
  }
  if (book.pdfUrl?.includes("drive.google.com")) {
    const m = book.pdfUrl.match(/[-\w]{25,}/);
    if (m) return `https://drive.google.com/thumbnail?id=${m[0]}&sz=w400`;
  }
  return book.image || "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400";
};

const isLecturer = (title) => {
  const t = (title || "").toLowerCase();
  return ["lecturer","dr.","prof.","professor","mrs","mr"].includes(t);
};

/* ─── slug resolver ──────────────────────────────────────── */
/* ─── slug helper (must match the one in lecturers) ─── */
const makeSlug = (title, name) => {
  const full = `${title ? title + " " : ""}${name}`.trim();
  return full
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
};

/* ─── slug resolver ──────────────────────────────────────── */
const resolveSellerUid = async (param) => {
  if (!param) return null;

  // 1. Try direct UID lookup in sellers collection
  try {
    const direct = await getDoc(doc(db, "sellers", param));
    if (direct.exists()) return param;
  } catch {}

  // 2. Try direct UID lookup in users collection
  try {
    const directUser = await getDoc(doc(db, "users", param));
    if (directUser.exists()) return param;
  } catch {}

  // 3. Try slug field in users collection
  try {
    const q = query(collection(db, "users"), where("slug", "==", param));
    const snap = await getDocs(q);
    if (!snap.empty) return snap.docs[0].id;
  } catch {}

  // 4. Try slug field in sellers collection
  try {
    const q2 = query(collection(db, "sellers"), where("slug", "==", param));
    const snap2 = await getDocs(q2);
    if (!snap2.empty) return snap2.docs[0].id;
  } catch {}

  // 5. Fallback: compute slug from name and match against all sellers
  //    (handles sellers whose slug field hasn't been saved yet)
  try {
    const allSellers = await getDocs(collection(db, "sellers"));
    for (const ds of allSellers.docs) {
      const d = ds.data();
      const computed = makeSlug(d.title || "", d.sellerName || d.displayName || "");
      if (computed === param) {
        // Save it now so future lookups hit step 4 instead
        try { await updateDoc(doc(db, "sellers", ds.id), { slug: computed }); } catch {}
        return ds.id;
      }
    }
  } catch {}

  return null;
};

/* ═══════════════════════════════════════════════════════════
   BOOK CARD
═══════════════════════════════════════════════════════════ */
function BookCard({ book, isPurchased, view }) {
  const href = `/book/preview?id=${String(book.id).replace("firestore-", "")}`;
  const owned = isPurchased(book.id);

  if (view === "list") {
    return (
      <Link href={href} style={{ display:"flex", alignItems:"center", gap:"14px", background:"#fff", border:`0.5px solid #e5ddd0`, padding:"12px 14px", textDecoration:"none", transition:"border-color .18s, box-shadow .18s" }}
        className="book-list-row">
        <img src={book.image} alt={book.title}
          style={{ width:"44px", height:"60px", objectFit:"cover", flexShrink:0, display:"block" }}
          onError={e => { e.target.src="https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400"; }} />
        <div style={{ flex:1, minWidth:0 }}>
          <h4 style={{ fontFamily:"'Playfair Display',serif", fontSize:"13px", fontWeight:700, color:NAVY, margin:"0 0 3px", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{book.title}</h4>
          <p style={{ fontSize:"11px", color:"#aaa", margin:"0 0 5px", textTransform:"capitalize", fontFamily:"'Lato',sans-serif" }}>{book.category}</p>
          <div style={{ display:"flex", alignItems:"center", gap:"8px" }}>
            {owned && <span style={{ fontSize:"9px", fontWeight:700, background:"#dcfce7", color:"#15803d", padding:"2px 7px", fontFamily:"'Lato',sans-serif", letterSpacing:".06em", textTransform:"uppercase" }}>Owned</span>}
            {book.soldCount > 0 && <span style={{ fontSize:"10px", color:"#aaa", display:"flex", alignItems:"center", gap:"3px", fontFamily:"'Lato',sans-serif" }}><ShoppingBag size={9}/>{book.soldCount} sold</span>}
          </div>
        </div>
        <div style={{ flexShrink:0, textAlign:"right" }}>
          <p style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:"14px", color:NAVY, margin:0 }}>₦{book.price?.toLocaleString()}</p>
        </div>
      </Link>
    );
  }

  return (
    <Link href={href} style={{ textDecoration:"none", display:"block", background:"#fff", border:`0.5px solid #e5ddd0`, transition:"transform .22s, box-shadow .22s, border-color .22s" }} className="book-grid-card">
      <div style={{ position:"relative" }}>
        <img src={book.image} alt={book.title}
          style={{ width:"100%", aspectRatio:"2/3", objectFit:"cover", display:"block", transition:"transform .5s cubic-bezier(.4,0,.2,1)" }}
          className="book-grid-img"
          onError={e => { e.target.src="https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400"; }} />
        <div style={{ position:"absolute", top:"8px", left:"8px", background:NAVY, color:"#fff", fontSize:"9px", fontWeight:700, padding:"3px 7px", fontFamily:"'Lato',sans-serif", letterSpacing:".06em", display:"flex", alignItems:"center", gap:"4px" }}>
          <span style={{ width:"5px", height:"5px", borderRadius:"50%", background:"#22c55e", display:"inline-block" }}/>PDF
        </div>
        {owned && <span style={{ position:"absolute", top:"8px", right:"8px", background:"#16a34a", color:"#fff", fontSize:"9px", fontWeight:700, padding:"3px 7px", fontFamily:"'Lato',sans-serif" }}>OWNED</span>}
        {book.soldCount > 0 && (
          <span style={{ position:"absolute", bottom:"8px", right:"8px", background:"rgba(13,34,68,.85)", color:"#fff", fontSize:"9px", padding:"3px 7px", fontFamily:"'Lato',sans-serif", display:"flex", alignItems:"center", gap:"3px" }}>
            <ShoppingBag size={8}/>{book.soldCount}
          </span>
        )}
      </div>
      <div style={{ padding:"10px 10px 12px", borderTop:`0.5px solid #f0ebe0` }}>
        <h4 style={{ fontFamily:"'Playfair Display',serif", fontSize:"12px", fontWeight:700, color:NAVY, margin:"0 0 3px", display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical", overflow:"hidden", lineHeight:1.35 }}>{book.title}</h4>
        <p style={{ fontSize:"10px", color:"#aaa", margin:"0 0 6px", textTransform:"capitalize", fontFamily:"'Lato',sans-serif" }}>{book.category}</p>
        <p style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:"13px", color:NAVY, margin:0 }}>₦{book.price?.toLocaleString()}</p>
      </div>
    </Link>
  );
}

/* ═══════════════════════════════════════════════════════════
   MAIN
═══════════════════════════════════════════════════════════ */
// AFTER
export default function SellerProfileClient({ sellerIdProp }) {
  const sellerId = sellerIdProp;
  const router = useRouter();

  const [seller, setSeller]             = useState(null);
  const [sellerPhoto, setSellerPhoto]   = useState(null);
  const [sellerBooks, setSellerBooks]   = useState([]);
  const [filteredBooks, setFiltered]    = useState([]);
  const [loading, setLoading]           = useState(true);
  const [searchQuery, setSearch]        = useState("");
  const [selectedCategory, setCategory]= useState("all");
  const [purchasedBookIds, setPurchased]= useState(new Set());
  const [isFollowing, setFollowing]     = useState(false);
  const [followerCount, setFollowers]   = useState(0);
  const [activeTab, setActiveTab]       = useState("materials");
  const [view, setView]                 = useState("grid");
  const [followLoading, setFollowLoad]  = useState(false);
  const [stats, setStats]               = useState({ totalSold:0, totalEarnings:0, totalBooks:0 });
  const [resolvedUid, setResolvedUid]   = useState(null);
  const [authReady, setAuthReady] = useState(!!auth.currentUser);
  const [user, setUser] = useState(auth.currentUser);


  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthReady(true);
    });
    return () => unsub();
  }, []);

  /* ── follow check — uses resolvedUid ── */
  useEffect(() => {
    const check = async () => {
      if (!user || !resolvedUid) return;
      const fd = await getDoc(doc(db, "follows", `${user.uid}_${resolvedUid}`));
      setFollowing(fd.exists());
      const q = query(collection(db, "follows"), where("lecturerId", "==", resolvedUid));
      setFollowers((await getDocs(q)).size);
    };
    check();
  }, [user, resolvedUid]);

  /* ── toggle follow — uses resolvedUid ── */
  const toggleFollow = async () => {
    if (!user) { alert("Please sign in to follow"); return; }
    if (followLoading) return;
    setFollowLoad(true);
    const followRef = doc(db, "follows", `${user.uid}_${resolvedUid}`);
    const sellerRef = doc(db, "sellers", resolvedUid);
    try {
      if (isFollowing) {
        await deleteDoc(followRef);
        try { await updateDoc(sellerRef, { followersCount: increment(-1) }); } catch {}
        setFollowing(false); setFollowers(p => Math.max(0, p - 1));
      } else {
        await setDoc(followRef, {
          followerId: user.uid,
          lecturerId: resolvedUid,
          lecturerName: seller?.sellerName || "",
          createdAt: new Date(),
        });
        try { await updateDoc(sellerRef, { followersCount: increment(1) }); }
        catch { await setDoc(sellerRef, { followersCount: 1 }, { merge: true }); }
        setFollowing(true); setFollowers(p => p + 1);
      }
    } catch (err) { console.error(err); } finally { setFollowLoad(false); }
  };

 useEffect(() => {
  if (!sellerId) {
    setLoading(false);
    router.push("/");
    return;
  }

  setLoading(true);

  // Hard timeout — loading will ALWAYS stop after 12s
  const timeoutId = setTimeout(() => {
    console.warn("fetchSellerData timed out");
    setSeller(null);
    setLoading(false);
  }, 12000);

  const fetchSellerData = async () => {
    try {
      // Wrap resolveSellerUid in its own 8s timeout
      const uid = await Promise.race([
        resolveSellerUid(sellerId),
        new Promise((resolve) => setTimeout(() => resolve(null), 8000)),
      ]);

      console.log("Resolved UID:", uid, "from sellerId:", sellerId);

      if (!uid) {
        setSeller(null);
        return;
      }
      setResolvedUid(uid);

      let sellerName = "Unknown", sellerTitle = "", sellerDept = "", sellerUni = "";

      const sd = await getDoc(doc(db, "sellers", uid));
      if (sd.exists()) {
        const d = sd.data();
        sellerName  = d.sellerName || d.displayName || sellerName;
        sellerTitle = d.title || "";
        sellerDept  = d.department || "";
        sellerUni   = d.university || "";
      }

      const ud = await getDoc(doc(db, "users", uid));
      if (ud.exists()) {
        const u = ud.data();
        if (!sellerName || sellerName === "Unknown")
          sellerName = u.displayName || `${u.firstName || ""} ${u.surname || ""}`.trim() || sellerName;
        setSellerPhoto(u.photoBase64 || u.photoURL || u.profilePicture || null);
        if (!sellerDept) sellerDept = u.department || "";
        if (!sellerUni)  sellerUni  = u.university || "";
      }

      const snap1 = await getDocs(
        query(collection(db, "advertMyBook"), where("userId", "==", uid))
      );
      const snap2 = await getDocs(
        query(collection(db, "advertMyBook"), where("sellerId", "==", uid))
      );

      const seenIds = new Set();
      const books = [];
      const processSnap = (snap) => {
        snap.forEach(ds => {
          if (seenIds.has(ds.id)) return;
          const data = ds.data();
          if (data.status !== "approved") return;
          seenIds.add(ds.id);
          const b = {
            id: `firestore-${ds.id}`,
            firestoreId: ds.id,
            title: data.bookTitle || data.title || "Untitled",
            author: data.author || "Unknown",
            category: (data.category || "general").toLowerCase(),
            price: Number(data.price) || 0,
            format: data.format || "PDF",
            description: data.description || "",
            driveFileId: data.driveFileId,
            pdfUrl: data.pdfUrl || data.pdfLink,
            embedUrl: data.embedUrl,
            soldCount: 0,
            isFromFirestore: true,
          };
          b.image = getThumbnailUrl(b);
          books.push(b);
        });
      };
      processSnap(snap1);
      processSnap(snap2);

      const cu = auth.currentUser;
      if (cu) {
        const md = await getDoc(doc(db, "users", cu.uid));
        if (md.exists()) {
          const ids = new Set();
          Object.values(md.data().purchasedBooks || {}).forEach(p => {
            const id = p.bookId || p.id || p.firestoreId;
            if (id) { ids.add(id); ids.add(`firestore-${id}`); }
          });
          setPurchased(ids);
        }
      }

      setSeller({ sellerId: uid, sellerName, sellerTitle, sellerDept, sellerUni });
      setSellerBooks(books);
      setFiltered(books);
      setStats({ totalSold: 0, totalEarnings: 0, totalBooks: books.length });

    } catch (err) {
      console.error("fetchSellerData error:", err);
      setSeller(null);
    } finally {
      clearTimeout(timeoutId);
      setLoading(false);
    }
  };

  fetchSellerData();

  return () => clearTimeout(timeoutId);
}, [sellerId]);

  /* ── filter ── */
  useEffect(() => {
    const q = searchQuery.toLowerCase();
    setFiltered(sellerBooks.filter(b => {
      const ms = !q || b.title?.toLowerCase().includes(q) || b.category?.toLowerCase().includes(q);
      const mc = selectedCategory === "all" || b.category === selectedCategory;
      return ms && mc;
    }));
  }, [searchQuery, selectedCategory, sellerBooks]);

  const categories = [
    { value:"all", label:"All" },
    ...Array.from(new Set(sellerBooks.map(b => b.category))).filter(Boolean)
      .map(c => ({ value:c, label:c.charAt(0).toUpperCase()+c.slice(1) })),
  ];
  const isPurchased = id => purchasedBookIds.has(id) || purchasedBookIds.has(String(id));
  const lecturerMode = isLecturer(seller?.sellerTitle);
  const displayTitle = seller
    ? (lecturerMode ? `${seller.sellerTitle} ${seller.sellerName}` : seller.sellerName)
    : "Profile";

  /* ── global styles ── */
  const S = () => (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400&family=Lato:wght@300;400;700&display=swap');
      *, *::before, *::after { box-sizing: border-box; }
      .lan-root  { font-family:'Lato',sans-serif; background:${BG}; }
      .lan-serif { font-family:'Playfair Display',Georgia,serif; }
      .sbar-none { scrollbar-width:none; -ms-overflow-style:none; }
      .sbar-none::-webkit-scrollbar { display:none; }
      .book-list-row:hover  { border-color:${GOLD}!important; box-shadow:0 4px 16px rgba(13,34,68,.08); }
      .book-grid-card:hover { transform:translateY(-4px); box-shadow:0 12px 32px rgba(13,34,68,.12); border-color:${GOLD}!important; }
      .book-grid-card:hover .book-grid-img { transform:scale(1.05); }
      .lan-tab { font-size:11px; font-weight:700; letter-spacing:.08em; text-transform:uppercase; padding:10px 18px; border:none; border-bottom:2px solid transparent; cursor:pointer; font-family:'Lato',sans-serif; background:transparent; transition:all .18s; white-space:nowrap; }
      .lan-tab-active  { color:${GOLD}; border-bottom-color:${GOLD}; }
      .lan-tab-inactive{ color:#888; }
      .lan-tab-inactive:hover { color:${NAVY}; }
      .search-input { font-family:'Lato',sans-serif; font-size:13px; outline:none; background:${BG}; border:0.5px solid #e5ddd0; color:${NAVY}; width:100%; padding:9px 12px 9px 34px; }
      .search-input:focus  { border-color:${GOLD}; }
      .search-input::placeholder { color:#aaa; }
      .cat-pill { font-size:10px; font-weight:700; letter-spacing:.08em; text-transform:uppercase; padding:5px 14px; border:0.5px solid #e5ddd0; cursor:pointer; font-family:'Lato',sans-serif; transition:all .15s; background:transparent; white-space:nowrap; flex-shrink:0; }
      .cat-pill.active { background:${NAVY}; color:#fff; border-color:${NAVY}; }
      .cat-pill:not(.active):hover { border-color:${NAVY}; color:${NAVY}; }
      .view-btn { width:34px; height:34px; display:flex; align-items:center; justify-content:center; border:0.5px solid #e5ddd0; background:transparent; cursor:pointer; transition:all .15s; flex-shrink:0; }
      .view-btn.active { background:${NAVY}; border-color:${NAVY}; color:#fff; }
      .view-btn:not(.active):hover { border-color:${NAVY}; }
      .follow-btn { display:flex; align-items:center; gap:6px; padding:10px 20px; font-size:11px; font-weight:700; letter-spacing:.08em; text-transform:uppercase; font-family:'Lato',sans-serif; border:none; cursor:pointer; transition:all .18s; white-space:nowrap; }
      .follow-btn.following { background:${GOLD}; color:${NAVY}; }
      .follow-btn.following:hover  { background:${GOLDD}; }
      .follow-btn.not-following { background:${GOLD}; color:${NAVY}; }
      .follow-btn.not-following:hover { background:${GOLDD}; }
      .stat-row:not(:last-child) { border-bottom:0.5px solid #f0ebe0; }
      @keyframes slideUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
      .anim-up { animation:slideUp .5s cubic-bezier(.4,0,.2,1) both; }

      .profile-content-grid {
        display: grid;
        grid-template-columns: 260px 1fr;
        gap: 24px;
        align-items: start;
      }
      .sidebar-mobile-hidden { display: flex; flex-direction: column; gap: 16px; }
      .hero-inner { max-width: 1100px; margin: 0 auto; padding: 60px 24px 0; }
      .page-inner  { max-width: 1100px; margin: 0 auto; padding: 32px 24px 80px; }
      .books-grid  { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 14px; }

      @media (max-width: 768px) {
        .profile-content-grid { grid-template-columns: 1fr; }
        .sidebar-mobile-hidden { display: none; }
        .hero-inner { padding: 48px 16px 0; }
        .page-inner { padding: 16px 12px 80px; }
        .books-grid { grid-template-columns: repeat(auto-fill, minmax(130px, 1fr)); gap: 10px; }
        .lan-tab { padding: 10px 14px; font-size: 10px; }
        .hero-avatar { width: 80px !important; height: 80px !important; bottom: -20px !important; }
        .hero-name { font-size: clamp(18px, 5vw, 28px) !important; }
        .hero-stat-strip { flex-wrap: wrap; }
        .hero-stat-item { flex: 1 1 80px; padding: 12px 14px 0 !important; }
        .hero-stat-val { font-size: 18px !important; }
        .hero-meta-row { padding-bottom: 24px !important; }
        .follow-btn { padding: 9px 14px; font-size: 10px; }
        .sticky-bar-title { font-size: 12px !important; }
      }

      @media (max-width: 480px) {
        .books-grid { grid-template-columns: repeat(2, 1fr); gap: 8px; }
        .hero-inner { padding: 40px 12px 0; }
        .page-inner { padding: 12px 10px 80px; }
      }

      @keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}
    `}</style>
  );

  /* ── loading ── */
  if (loading) return (
    <div className="lan-root" style={{ minHeight:"100vh" }}>
      <S/>
      <Navbar/>
      <div style={{ background:NAVY, height:"240px", position:"relative", overflow:"hidden",
        backgroundImage:`radial-gradient(rgba(184,150,62,.07) 1px,transparent 1px)`, backgroundSize:"28px 28px" }}/>
      <div style={{ maxWidth:"1100px", margin:"0 auto", padding:"24px 16px" }}>
        {[1,2].map(i=>(
          <div key={i} style={{ background:"#fff", border:`0.5px solid #e5ddd0`, padding:"24px", marginBottom:"16px" }}>
            {[80,60,40].map(w=>(
              <div key={w} style={{ height:"12px", background:"#f0ebe0", marginBottom:"12px", width:`${w}%`, animation:"pulse 1.5s infinite" }}/>
            ))}
          </div>
        ))}
      </div>
    </div>
  );

  /* ── not found ── */
 /* ── not authenticated ── */
if (!user) return (
  <div className="lan-root" style={{ minHeight: "100vh" }}>
    <S /><Navbar />
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "80px 24px", textAlign: "center" }}>
      {/* lock icon diamond */}
      <div style={{ width: "64px", height: "64px", border: `2px solid rgba(184,150,62,.4)`, transform: "rotate(45deg)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px", background: NAVY }}>
        <GraduationCap size={24} style={{ color: GOLD, transform: "rotate(-45deg)" }} />
      </div>

      {/* eyebrow */}
      <div style={{ display: "inline-flex", alignItems: "center", gap: "7px", background: "rgba(184,150,62,.1)", border: `1px solid rgba(184,150,62,.3)`, borderRadius: "999px", padding: "5px 14px", marginBottom: "16px" }}>
        <Sparkles size={10} style={{ color: GOLD }} />
        <span style={{ fontSize: "9px", fontWeight: 700, letterSpacing: ".16em", textTransform: "uppercase", color: GOLDD, fontFamily: "'Lato',sans-serif" }}>
          Sign in Required
        </span>
      </div>

      <h2 className="lan-serif" style={{ fontSize: "clamp(22px,4vw,34px)", fontWeight: 700, color: NAVY, margin: "0 0 10px" }}>
        This profile is<br />
        <span style={{ color: GOLD, fontStyle: "italic" }}>members only.</span>
      </h2>

      <p style={{ fontSize: "13px", color: "#888", fontFamily: "'Lato',sans-serif", lineHeight: 1.75, maxWidth: "360px", margin: "0 0 28px" }}>
        Create a free account or sign in to view this profile, browse their materials, and follow your favourite educators.
      </p>

      <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", justifyContent: "center" }}>
        <button
          onClick={() => router.push(`/auth/signin?redirect=${encodeURIComponent(window.location.pathname)}`)}
          style={{ display: "inline-flex", alignItems: "center", gap: "7px", padding: "11px 24px", background: NAVY, color: "#fff", border: "none", fontSize: "12px", fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase", cursor: "pointer", fontFamily: "'Lato',sans-serif" }}
        >
          <UserPlus size={13} /> Sign In
        </button>
        <button
          onClick={() => router.push("/auth/signup")}
          style={{ display: "inline-flex", alignItems: "center", gap: "7px", padding: "11px 24px", background: "transparent", color: NAVY, border: `0.5px solid ${NAVY}`, fontSize: "12px", fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase", cursor: "pointer", fontFamily: "'Lato',sans-serif" }}
        >
          Create Account
        </button>
      </div>

      <button onClick={() => router.back()} style={{ marginTop: "16px", background: "none", border: "none", fontSize: "11px", color: "#bbb", cursor: "pointer", fontFamily: "'Lato',sans-serif", display: "flex", alignItems: "center", gap: "4px" }}>
        <ArrowLeft size={11} /> Go back
      </button>
    </div>
  </div>
);

/* ── authenticated but profile genuinely not found ── */
if (!seller) return (
  <div className="lan-root" style={{ minHeight: "100vh" }}>
    <S /><Navbar />
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "80px 24px", textAlign: "center" }}>
      <div style={{ width: "64px", height: "64px", border: `2px solid #e5ddd0`, transform: "rotate(45deg)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
        <BookOpen size={24} style={{ color: "#e5ddd0", transform: "rotate(-45deg)" }} />
      </div>
      <h2 className="lan-serif" style={{ fontSize: "24px", color: NAVY, marginBottom: "8px" }}>Profile Not Found</h2>
      <p style={{ fontSize: "13px", color: "#aaa", fontFamily: "'Lato',sans-serif", marginBottom: "20px", maxWidth: "320px", lineHeight: 1.7 }}>
        This profile doesn't exist or the link may be incorrect.
      </p>
      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", justifyContent: "center" }}>
        <button onClick={() => router.back()}
          style={{ background: "transparent", color: NAVY, padding: "10px 20px", border: `0.5px solid ${NAVY}`, cursor: "pointer", fontSize: "12px", fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase", fontFamily: "'Lato',sans-serif", display: "flex", alignItems: "center", gap: "6px" }}>
          <ArrowLeft size={12} /> Go Back
        </button>
        <button onClick={() => router.push("/lecturers")}
          style={{ background: NAVY, color: "#fff", padding: "10px 20px", border: "none", cursor: "pointer", fontSize: "12px", fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase", fontFamily: "'Lato',sans-serif", display: "flex", alignItems: "center", gap: "6px" }}>
          <Users size={12} /> Browse Educators
        </button>
      </div>
    </div>
  </div>
  );
  
  /* ── About card (mobile) ── */
  const AboutCard = () => (
    <div style={{ background:"#fff", border:`0.5px solid #e5ddd0`, padding:"24px", marginBottom:"16px" }}>
      <p style={{ fontSize:"10px", fontWeight:700, letterSpacing:".18em", textTransform:"uppercase", color:GOLD, marginBottom:"14px", fontFamily:"'Lato',sans-serif" }}>About</p>
      <div style={{ display:"flex", flexDirection:"column", gap:"12px" }}>
        {seller.sellerTitle && (
          <div style={{ display:"flex", alignItems:"center", gap:"10px" }}>
            <GraduationCap size={14} style={{ color:GOLD, flexShrink:0 }}/>
            <span style={{ fontSize:"13px", color:NAVY, fontFamily:"'Lato',sans-serif", fontWeight:700 }}>{seller.sellerTitle}</span>
          </div>
        )}
        {seller.sellerDept && (
          <div style={{ display:"flex", alignItems:"center", gap:"10px" }}>
            <BookMarked size={14} style={{ color:GOLD, flexShrink:0 }}/>
            <span style={{ fontSize:"13px", color:"#666", fontFamily:"'Lato',sans-serif" }}>{seller.sellerDept}</span>
          </div>
        )}
        {seller.sellerUni && (
          <div style={{ display:"flex", alignItems:"center", gap:"10px" }}>
            <Building2 size={14} style={{ color:GOLD, flexShrink:0 }}/>
            <span style={{ fontSize:"13px", color:"#666", fontFamily:"'Lato',sans-serif" }}>{seller.sellerUni}</span>
          </div>
        )}
        {!seller.sellerDept && !seller.sellerUni && !seller.sellerTitle && (
          <p style={{ fontSize:"12px", color:"#bbb", fontFamily:"'Lato',sans-serif" }}>No additional info provided.</p>
        )}
      </div>
    </div>
  );

  const StatsCard = () => (
    <div style={{ background:"#fff", border:`0.5px solid #e5ddd0`, padding:"24px" }}>
      <p style={{ fontSize:"10px", fontWeight:700, letterSpacing:".18em", textTransform:"uppercase", color:GOLD, marginBottom:"14px", fontFamily:"'Lato',sans-serif" }}>Stats</p>
      <div style={{ display:"flex", flexDirection:"column" }}>
        {[
          { label:"Total Materials", value:stats.totalBooks,  Icon:BookOpen   },
          { label:"Total Sold",      value:stats.totalSold,   Icon:ShoppingBag },
          { label:"Followers",       value:followerCount,     Icon:Users      },
        ].map(({label,value,Icon})=>(
          <div key={label} className="stat-row" style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"10px 0" }}>
            <div style={{ display:"flex", alignItems:"center", gap:"8px", fontSize:"13px", color:"#666", fontFamily:"'Lato',sans-serif" }}>
              <Icon size={13} style={{ color:GOLD }}/>{label}
            </div>
            <span style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, color:NAVY, fontSize:"14px" }}>{value}</span>
          </div>
        ))}
      </div>
    </div>
  );

  /* ══════════════════════════════════════════════════════════
     RENDER
  ══════════════════════════════════════════════════════════ */
  return (
    <div className="lan-root" style={{ minHeight:"100vh" }}>
      <S/>
      <Navbar/>

      {/* ── STICKY BACK BAR ── */}
      <div style={{ background:"#fff", borderBottom:`0.5px solid #e5ddd0`, position:"sticky", top:0, zIndex:40 }}>
        <div style={{ maxWidth:"1100px", margin:"0 auto", padding:"0 16px", height:"48px", display:"flex", alignItems:"center", gap:"12px" }}>
          <button onClick={()=>router.back()} style={{ background:"none", border:"none", cursor:"pointer", color:"#888", display:"flex", alignItems:"center", flexShrink:0 }}>
            <ArrowLeft size={18}/>
          </button>
          <div style={{ minWidth:0, flex:1 }}>
            <p className="sticky-bar-title" style={{ fontSize:"13px", fontWeight:700, color:NAVY, margin:0, fontFamily:"'Playfair Display',serif", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{displayTitle}</p>
            <p style={{ fontSize:"10px", color:"#aaa", margin:0, fontFamily:"'Lato',sans-serif" }}>{stats.totalBooks} materials · {followerCount} followers</p>
          </div>
        </div>
      </div>

      {/* ══ PROFILE HERO ══ */}
      <div style={{
        backgroundColor:NAVY,
        backgroundImage:`radial-gradient(rgba(184,150,62,.07) 1px,transparent 1px),radial-gradient(rgba(255,255,255,.03) 1px,transparent 1px)`,
        backgroundSize:"28px 28px, 14px 14px",
        backgroundPosition:"0 0, 7px 7px",
        position:"relative", overflow:"hidden",
      }}>
        {/* LAN watermark */}
        <div style={{ position:"absolute", bottom:"-10px", right:"20px", fontSize:"100px", fontFamily:"'Playfair Display',serif", fontWeight:900, color:"rgba(255,255,255,.04)", pointerEvents:"none", userSelect:"none" }}>LAN</div>

        {/* Title badge */}
        {lecturerMode && (
          <div style={{ position:"absolute", top:"16px", left:"16px", display:"inline-flex", alignItems:"center", gap:"7px", background:"rgba(184,150,62,.14)", border:`1px solid rgba(184,150,62,.3)`, borderRadius:"999px", padding:"6px 12px" }}>
            <GraduationCap size={11} style={{ color:GOLD }}/>
            <span style={{ fontSize:"10px", fontWeight:700, letterSpacing:".14em", textTransform:"uppercase", color:GOLDD, fontFamily:"'Lato',sans-serif" }}>{seller.sellerTitle}</span>
          </div>
        )}

        <div className="hero-inner">
          {/* Avatar row */}
          <div style={{ display:"flex", alignItems:"flex-end", gap:"16px", flexWrap:"wrap" }}>

            {/* Avatar */}
            <div className="hero-avatar" style={{ width:"110px", height:"110px", flexShrink:0, position:"relative", bottom:"-28px" }}>
              {sellerPhoto ? (
                <img src={sellerPhoto} alt={seller.sellerName}
                  style={{ width:"100%", height:"100%", borderRadius:"50%", objectFit:"cover", border:`3px solid ${GOLD}`, display:"block" }}/>
              ) : (
                <div style={{ width:"100%", height:"100%", borderRadius:"50%", border:`3px solid ${GOLD}`, background:"rgba(255,255,255,.08)", display:"flex", alignItems:"center", justifyContent:"center" }}>
                  {lecturerMode
                    ? <GraduationCap size={40} style={{ color:GOLD }}/>
                    : <span style={{ color:GOLD, fontSize:"36px", fontFamily:"'Playfair Display',serif", fontWeight:900 }}>{seller.sellerName?.charAt(0)?.toUpperCase()||"?"}</span>}
                </div>
              )}
            </div>

            {/* Name + meta */}
            <div className="hero-meta-row" style={{ paddingBottom:"32px", flex:1, minWidth:0 }}>
              <h1 className="lan-serif anim-up hero-name" style={{ fontSize:"clamp(20px,4vw,38px)", fontWeight:900, color:"#fff", margin:"0 0 6px", lineHeight:1.05, wordBreak:"break-word" }}>
                {displayTitle}
              </h1>
              <p style={{ fontSize:"12px", color:"rgba(245,240,232,.6)", margin:0, fontFamily:"'Lato',sans-serif", fontWeight:300 }}>
                {stats.totalBooks} materials &nbsp;·&nbsp; {followerCount} followers
              </p>
            </div>

            {/* Follow button */}
            <div style={{ paddingBottom:"32px", flexShrink:0 }}>
              <button onClick={toggleFollow} disabled={followLoading}
                className={`follow-btn ${isFollowing?"following":"not-following"}`}>
                {isFollowing ? <UserCheck size={13}/> : <UserPlus size={13}/>}
                {isFollowing ? "Following" : "Follow"}
              </button>
            </div>
          </div>

          {/* stat strip */}
          <div className="hero-stat-strip" style={{ borderTop:`0.5px solid rgba(184,150,62,.15)`, display:"flex", flexWrap:"wrap", marginTop:"28px" }}>
            {[
              { val:stats.totalBooks,  label:"Materials" },
              { val:stats.totalSold,   label:"Sold"      },
              { val:followerCount,     label:"Followers" },
            ].map(({val,label})=>(
              <div key={label} className="hero-stat-item" style={{ flex:"1 1 80px", padding:"16px 20px 0", borderRight:`0.5px solid rgba(184,150,62,.1)` }}>
                <div className="lan-serif hero-stat-val" style={{ fontSize:"22px", fontWeight:700, color:"#fff" }}>{val}</div>
                <div style={{ fontSize:"10px", fontWeight:700, letterSpacing:".1em", textTransform:"uppercase", color:"rgba(184,150,62,.7)", marginTop:"2px", fontFamily:"'Lato',sans-serif" }}>{label}</div>
              </div>
            ))}
          </div>

          {/* Tabs */}
          <div className="sbar-none" style={{ display:"flex", marginTop:"20px", gap:"0", borderTop:`0.5px solid rgba(184,150,62,.15)`, paddingTop:"4px", overflowX:"auto" }}>
            {[{id:"materials",label:lecturerMode?"Materials":"Books"},{id:"about",label:"About"}].map(tab=>(
              <button key={tab.id} onClick={()=>setActiveTab(tab.id)}
                className={`lan-tab ${activeTab===tab.id?"lan-tab-active":"lan-tab-inactive"}`}>
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ══ CONTENT ══ */}
      <div className="page-inner">
        <div className="profile-content-grid">

          {/* ── LEFT SIDEBAR (desktop only) ── */}
          <div className="sidebar-mobile-hidden">
            {/* About card */}
            <div style={{ background:"#fff", border:`0.5px solid #e5ddd0`, padding:"24px" }}>
              <p style={{ fontSize:"10px", fontWeight:700, letterSpacing:".18em", textTransform:"uppercase", color:GOLD, marginBottom:"14px", fontFamily:"'Lato',sans-serif" }}>About</p>
              <div style={{ display:"flex", flexDirection:"column", gap:"12px" }}>
                {seller.sellerTitle && (
                  <div style={{ display:"flex", alignItems:"center", gap:"10px" }}>
                    <GraduationCap size={14} style={{ color:GOLD, flexShrink:0 }}/>
                    <span style={{ fontSize:"13px", color:NAVY, fontFamily:"'Lato',sans-serif", fontWeight:700 }}>{seller.sellerTitle}</span>
                  </div>
                )}
                {seller.sellerDept && (
                  <div style={{ display:"flex", alignItems:"center", gap:"10px" }}>
                    <BookMarked size={14} style={{ color:GOLD, flexShrink:0 }}/>
                    <span style={{ fontSize:"13px", color:"#666", fontFamily:"'Lato',sans-serif" }}>{seller.sellerDept}</span>
                  </div>
                )}
                {seller.sellerUni && (
                  <div style={{ display:"flex", alignItems:"center", gap:"10px" }}>
                    <Building2 size={14} style={{ color:GOLD, flexShrink:0 }}/>
                    <span style={{ fontSize:"13px", color:"#666", fontFamily:"'Lato',sans-serif" }}>{seller.sellerUni}</span>
                  </div>
                )}
                {!seller.sellerDept && !seller.sellerUni && !seller.sellerTitle && (
                  <p style={{ fontSize:"12px", color:"#bbb", fontFamily:"'Lato',sans-serif" }}>No additional info provided.</p>
                )}
              </div>
            </div>

            {/* Stats card */}
            <div style={{ background:"#fff", border:`0.5px solid #e5ddd0`, padding:"24px" }}>
              <p style={{ fontSize:"10px", fontWeight:700, letterSpacing:".18em", textTransform:"uppercase", color:GOLD, marginBottom:"14px", fontFamily:"'Lato',sans-serif" }}>Stats</p>
              <div style={{ display:"flex", flexDirection:"column" }}>
                {[
                  { label:"Total Materials", value:stats.totalBooks,  Icon:BookOpen   },
                  { label:"Total Sold",      value:stats.totalSold,   Icon:ShoppingBag },
                  { label:"Followers",       value:followerCount,     Icon:Users      },
                ].map(({label,value,Icon})=>(
                  <div key={label} className="stat-row" style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"10px 0" }}>
                    <div style={{ display:"flex", alignItems:"center", gap:"8px", fontSize:"13px", color:"#666", fontFamily:"'Lato',sans-serif" }}>
                      <Icon size={13} style={{ color:GOLD }}/>{label}
                    </div>
                    <span style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, color:NAVY, fontSize:"14px" }}>{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── MAIN FEED ── */}
          {activeTab==="materials" && (
            <div style={{ display:"flex", flexDirection:"column", gap:"16px" }}>
              {/* Search + filter */}
              <div style={{ background:"#fff", border:`0.5px solid #e5ddd0`, padding:"14px 16px" }}>
                <div style={{ display:"flex", gap:"8px", marginBottom:"12px" }}>
                  <div style={{ flex:1, position:"relative" }}>
                    <Search size={13} style={{ position:"absolute", left:"12px", top:"50%", transform:"translateY(-50%)", color:"#bbb" }}/>
                    <input type="text" placeholder="Search materials…" value={searchQuery} onChange={e=>setSearch(e.target.value)} className="search-input"/>
                    {searchQuery && (
                      <button onClick={()=>setSearch("")} style={{ position:"absolute", right:"10px", top:"50%", transform:"translateY(-50%)", background:"none", border:"none", cursor:"pointer", color:"#aaa" }}>
                        <X size={13}/>
                      </button>
                    )}
                  </div>
                  <div style={{ display:"flex", gap:"0" }}>
                    <button onClick={()=>setView("grid")} className={`view-btn ${view==="grid"?"active":""}`}><Grid3X3 size={14}/></button>
                    <button onClick={()=>setView("list")} className={`view-btn ${view==="list"?"active":""}`}><LayoutList size={14}/></button>
                  </div>
                </div>
                <div className="sbar-none" style={{ display:"flex", gap:"6px", overflowX:"auto", paddingBottom:"2px" }}>
                  {categories.map(cat=>(
                    <button key={cat.value} onClick={()=>setCategory(cat.value)} className={`cat-pill${selectedCategory===cat.value?" active":""}`}>
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Results */}
              <div style={{ background:"#fff", border:`0.5px solid #e5ddd0`, padding:"16px" }}>
                <p style={{ fontSize:"10px", color:"#aaa", marginBottom:"16px", fontFamily:"'Lato',sans-serif", fontWeight:700, letterSpacing:".08em", textTransform:"uppercase" }}>
                  {filteredBooks.length} result{filteredBooks.length!==1?"s":""}
                </p>

                {filteredBooks.length===0 ? (
                  <div style={{ textAlign:"center", padding:"48px 16px" }}>
                    <div style={{ width:"56px", height:"56px", border:`2px solid #e5ddd0`, transform:"rotate(45deg)", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 16px" }}>
                      <BookOpen size={20} style={{ color:"#e5ddd0", transform:"rotate(-45deg)" }}/>
                    </div>
                    <h3 className="lan-serif" style={{ fontSize:"18px", color:NAVY, marginBottom:"6px" }}>No results</h3>
                    <p style={{ fontSize:"12px", color:"#bbb", fontFamily:"'Lato',sans-serif" }}>
                      {searchQuery||selectedCategory!=="all"?"Clear your filters to see all materials.":"No materials uploaded yet."}
                    </p>
                    {(searchQuery||selectedCategory!=="all")&&(
                      <button onClick={()=>{setSearch("");setCategory("all");}}
                        style={{ marginTop:"12px", background:"none", border:`0.5px solid ${NAVY}`, color:NAVY, padding:"7px 18px", cursor:"pointer", fontSize:"11px", fontWeight:700, letterSpacing:".06em", textTransform:"uppercase", fontFamily:"'Lato',sans-serif" }}>
                        Clear filters
                      </button>
                    )}
                  </div>
                ) : view==="list" ? (
                  <div style={{ display:"flex", flexDirection:"column", gap:"8px" }}>
                    {filteredBooks.map(book=><BookCard key={book.id} book={book} isPurchased={isPurchased} view="list"/>)}
                  </div>
                ) : (
                  <div className="books-grid">
                    {filteredBooks.map(book=><BookCard key={book.id} book={book} isPurchased={isPurchased} view="grid"/>)}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── ABOUT TAB ── */}
          {activeTab==="about" && (
            <div style={{ display:"flex", flexDirection:"column", gap:"16px" }}>
              <div style={{ display:"none" }} className="mobile-about-cards">
                <AboutCard/>
                <StatsCard/>
              </div>

              <div style={{ background:"#fff", border:`0.5px solid #e5ddd0`, padding:"24px 20px" }}>
                <p style={{ fontSize:"10px", fontWeight:700, letterSpacing:".18em", textTransform:"uppercase", color:GOLD, marginBottom:"20px", fontFamily:"'Lato',sans-serif" }}>
                  About {displayTitle}
                </p>
                <div style={{ display:"flex", flexDirection:"column", gap:"0" }}>
                  {[
                    {label:"Title",      value:seller.sellerTitle, Icon:GraduationCap},
                    {label:"Department", value:seller.sellerDept,  Icon:BookMarked},
                    {label:"University", value:seller.sellerUni,   Icon:Building2},
                  ].filter(r=>r.value).map(({label,value,Icon})=>(
                    <div key={label} style={{ display:"flex", alignItems:"flex-start", gap:"14px", padding:"18px 0", borderBottom:`0.5px solid #f0ebe0` }}>
                      <Icon size={16} style={{ color:GOLD, flexShrink:0, marginTop:"2px" }}/>
                      <div>
                        <p style={{ fontSize:"9px", fontWeight:700, letterSpacing:".18em", textTransform:"uppercase", color:"#aaa", margin:"0 0 4px", fontFamily:"'Lato',sans-serif" }}>{label}</p>
                        <p style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:"15px", color:NAVY, margin:0, wordBreak:"break-word" }}>{value}</p>
                      </div>
                    </div>
                  ))}
                  {!seller.sellerDept&&!seller.sellerUni&&!seller.sellerTitle&&(
                    <p style={{ fontSize:"13px", color:"#bbb", fontFamily:"'Lato',sans-serif" }}>No profile information added yet.</p>
                  )}
                </div>
              </div>

              {/* Stats in About tab (visible on all screens) */}
              <div style={{ background:"#fff", border:`0.5px solid #e5ddd0`, padding:"24px 20px" }}>
                <p style={{ fontSize:"10px", fontWeight:700, letterSpacing:".18em", textTransform:"uppercase", color:GOLD, marginBottom:"14px", fontFamily:"'Lato',sans-serif" }}>Stats</p>
                <div style={{ display:"flex", flexDirection:"column" }}>
                  {[
                    { label:"Total Materials", value:stats.totalBooks,  Icon:BookOpen   },
                    { label:"Total Sold",      value:stats.totalSold,   Icon:ShoppingBag },
                    { label:"Followers",       value:followerCount,     Icon:Users      },
                  ].map(({label,value,Icon})=>(
                    <div key={label} className="stat-row" style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"10px 0" }}>
                      <div style={{ display:"flex", alignItems:"center", gap:"8px", fontSize:"13px", color:"#666", fontFamily:"'Lato',sans-serif" }}>
                        <Icon size={13} style={{ color:GOLD }}/>{label}
                      </div>
                      <span style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, color:NAVY, fontSize:"14px" }}>{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}