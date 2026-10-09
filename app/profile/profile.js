// app/profile/[slug]/client.jsx
// Public seller / lecturer profile.
// Verified seller = blue check by the photo + "Verified seller" label. Unverified = plain "Seller".
// Faculty are verified through the account process and are untouched here.
// Materials are split into Premium (paid) and Free shelves.

"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
    collection, getDocs, doc, getDoc, query, where,
    setDoc, deleteDoc, updateDoc, increment, serverTimestamp,
} from "firebase/firestore";
import { auth, db } from "@/lib/firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";
import {
    ArrowLeft, Search, X, BookOpen, GraduationCap, UserPlus, UserCheck, Users,
    Building2, Grid3X3, LayoutList, BookMarked, Globe, ShoppingBag, Lock,
    Quote, LayoutDashboard, Gift, Tag,
} from "lucide-react";
import FollowingModal from "./[slug]/FollowingModal";

import { paidVerificationActive, useVerificationReturn, VerifiedBadge } from "@/components/seller/Verification";

const NAVY = "#0d2244", INK = "#081530", GOLD = "#b8963e", GOLDD = "#d4aa5a", BG = "#f5f1ea", BLUE = "#1d9bf0";
const FALLBACK_IMG = "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400";
// const DASHBOARD_HREF = "/dashboard";
/* ─── Helpers ─── */
const getThumbnailUrl = (book) => {
    if (!book) return FALLBACK_IMG;
    if (book.driveFileId) return `https://drive.google.com/thumbnail?id=${book.driveFileId}&sz=w400`;
    if (book.embedUrl) {
        const m = book.embedUrl.match(/\/d\/(.*?)\/|\/file\/d\/(.*?)\/|id=(.*?)(&|$)/);
        const id = m && (m[1] || m[2] || m[3]);
        if (id) return `https://drive.google.com/thumbnail?id=${id}&sz=w400`;
    }
    if (book.pdfUrl?.includes("drive.google.com")) {
        const m = book.pdfUrl.match(/[-\w]{25,}/);
        if (m) return `https://drive.google.com/thumbnail?id=${m[0]}&sz=w400`;
    }
    return book.image || FALLBACK_IMG;
};
const FLAGS = { nigeria: "🇳🇬", ghana: "🇬🇭", kenya: "🇰🇪", "south africa": "🇿🇦", ethiopia: "🇪🇹", uganda: "🇺🇬", tanzania: "🇹🇿", cameroon: "🇨🇲", senegal: "🇸🇳", "united kingdom": "🇬🇧", uk: "🇬🇧", usa: "🇺🇸", "united states": "🇺🇸", canada: "🇨🇦", india: "🇮🇳" };
const getCountryDisplay = (c) => { if (!c) return null; const f = FLAGS[c.toLowerCase().trim()]; return f ? `${c} ${f}` : c; };
const formatCount = (n) => {
    const num = Number(n) || 0;
    if (num < 1000) return String(num);
    if (num < 1e6) { const k = Math.floor(num / 100) / 10; return `${k % 1 === 0 ? k.toFixed(0) : k.toFixed(1)}k`; }
    const m = Math.floor(num / 1e5) / 10;
    return `${m % 1 === 0 ? m.toFixed(0) : m.toFixed(1)}M`;
};
const naira = (n) => `₦${Number(n || 0).toLocaleString()}`;

/* ─── Styles ─── */
const GlobalStyles = () => (
    <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400&family=Lato:wght@300;400;700;900&display=swap');
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body, .lan-root { font-family: 'Lato', sans-serif; background: ${BG}; }
    .lan-serif { font-family: 'Playfair Display', Georgia, serif; }
    .sbar-none { scrollbar-width: none; -ms-overflow-style: none; }
    .sbar-none::-webkit-scrollbar { display: none; }
    button:focus-visible, a:focus-visible, input:focus-visible { outline: 2px solid ${GOLD}; outline-offset: 2px; }
    @keyframes pulse { 0%,100% { opacity:1 } 50% { opacity:.45 } }
    @media (prefers-reduced-motion: reduce) { * { animation: none !important; transition: none !important; } }

    .card { background:#fff; border:0.5px solid #e5ddd0; padding:22px; }
    .label { font-size:10px; font-weight:700; letter-spacing:.16em; text-transform:uppercase; color:${GOLD}; margin-bottom:14px; }
    .muted { color:#8a8a8a; font-size:12px; }

    .hero { background:${INK}; position:relative; overflow:hidden;
      background-image: radial-gradient(900px 340px at 85% -10%, rgba(184,150,62,.22), transparent 60%), radial-gradient(rgba(184,150,62,.07) 1px, transparent 1px);
      background-size: auto, 26px 26px; }
    .hero-name { font-size: clamp(24px, 5vw, 40px); font-weight:900; color:#fff; line-height:1.08; word-break:break-word; }
    .pill { display:inline-flex; align-items:center; gap:6px; border-radius:999px; padding:5px 12px; background:rgba(184,150,62,.14); border:1px solid rgba(184,150,62,.35); color:${GOLDD}; font-size:10px; font-weight:700; letter-spacing:.12em; text-transform:uppercase; }
    .pill-blue { background:rgba(29,155,240,.16); border-color:rgba(29,155,240,.5); color:#8fd0ff; }
    .ring { border-radius:50%; border:3px solid ${GOLD}; box-shadow:0 0 0 6px rgba(184,150,62,.15); object-fit:cover; display:block; width:100%; height:100%; }
    .ring-blue { border-color:${BLUE}; box-shadow:0 0 0 6px rgba(29,155,240,.18); }

    .btn { display:inline-flex; align-items:center; justify-content:center; gap:7px; padding:11px 20px; border:none; cursor:pointer; font:700 11px 'Lato',sans-serif; letter-spacing:.08em; text-transform:uppercase; text-decoration:none; white-space:nowrap; transition:background .18s; }
    .btn:disabled { opacity:.6; cursor:not-allowed; }
    .btn-gold { background:${GOLD}; color:${NAVY}; } .btn-gold:hover:not(:disabled) { background:${GOLDD}; }
    .btn-ghost { background:transparent; color:#8fd0ff; border:1px solid rgba(29,155,240,.6); } .btn-ghost:hover { background:rgba(29,155,240,.14); }

    .metrics { display:grid; grid-template-columns:repeat(auto-fit, minmax(90px,1fr)); border-top:0.5px solid rgba(184,150,62,.2); margin-top:28px; }
    .metric { padding:16px 20px 0 0; background:none; border:none; text-align:left; font:inherit; }
    button.metric { cursor:pointer; }

    .lan-tab { font:700 11px 'Lato',sans-serif; letter-spacing:.08em; text-transform:uppercase; padding:12px 18px; border:none; border-bottom:2px solid transparent; cursor:pointer; background:transparent; white-space:nowrap; transition:all .18s; }
    .lan-tab-active { color:${GOLD}; border-bottom-color:${GOLD}; }
    .lan-tab-inactive { color:#9aa4b5; } .lan-tab-inactive:hover { color:#fff; }

    .search-input { font:13px 'Lato',sans-serif; outline:none; background:${BG}; border:0.5px solid #e5ddd0; color:${NAVY}; width:100%; padding:10px 12px 10px 34px; }
    .search-input:focus { border-color:${GOLD}; }
    .cat-pill { font:700 10px 'Lato',sans-serif; letter-spacing:.08em; text-transform:uppercase; padding:6px 14px; border:0.5px solid #e5ddd0; cursor:pointer; background:transparent; white-space:nowrap; flex-shrink:0; color:#555; }
    .cat-pill.active { background:${NAVY}; color:#fff; border-color:${NAVY}; }
    .view-btn { width:36px; height:36px; display:flex; align-items:center; justify-content:center; border:0.5px solid #e5ddd0; background:transparent; cursor:pointer; flex-shrink:0; color:${NAVY}; }
    .view-btn.active { background:${NAVY}; color:#fff; border-color:${NAVY}; }
    .seg { display:flex; border:1px solid ${NAVY}; width:fit-content; max-width:100%; }
    .seg button { padding:8px 16px; border:none; background:transparent; cursor:pointer; font:700 12px 'Lato',sans-serif; color:${NAVY}; display:flex; gap:7px; align-items:center; }
    .seg button.on { background:${NAVY}; color:#fff; }
    .seg b { font-size:10px; padding:1px 7px; border-radius:99px; background:rgba(184,150,62,.25); }

    .shelf-head { display:flex; align-items:center; justify-content:space-between; gap:12px; margin-bottom:14px; flex-wrap:wrap; }
    .shelf-title { font-size:20px; font-weight:700; color:${NAVY}; display:flex; align-items:center; gap:10px; }
    .shelf-paid { border-left:4px solid ${GOLD}; background:linear-gradient(180deg,#fffdf8,#fff); }
    .shelf-free { border-left:4px solid #16a34a; }

    .books-grid { display:grid; grid-template-columns:repeat(auto-fill, minmax(150px,1fr)); gap:14px; }
    .bk { background:#fff; border:0.5px solid #e5ddd0; text-decoration:none; display:block; position:relative; transition:transform .2s, box-shadow .2s, border-color .2s; }
    .bk:hover { transform:translateY(-3px); box-shadow:0 12px 30px rgba(13,34,68,.12); border-color:${GOLD}; }
    .bk-img { width:100%; aspect-ratio:2/3; object-fit:cover; display:block; }
    .bk-title { font:700 12px 'Playfair Display',serif; color:${NAVY}; line-height:1.35; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; }
    .bk-cat { font-size:10px; color:#aaa; text-transform:capitalize; margin:3px 0 6px; }
    .bk-price { font:700 13px 'Playfair Display',serif; color:${NAVY}; }
    .tag { position:absolute; font-size:9px; font-weight:700; padding:3px 7px; letter-spacing:.06em; display:flex; align-items:center; gap:4px; }
    .tag-free { top:8px; right:8px; background:#16a34a; color:#fff; }
    .tag-owned { top:8px; right:8px; background:${NAVY}; color:${GOLDD}; }
    .tag-pdf { top:8px; left:8px; background:${NAVY}; color:#fff; }
    .lock { position:absolute; inset:0; background:rgba(13,34,68,.25); display:flex; align-items:center; justify-content:center; backdrop-filter:blur(1.5px); }
    .row { display:flex; align-items:center; gap:14px; background:#fff; border:0.5px solid #e5ddd0; padding:12px 14px; text-decoration:none; min-width:0; overflow:hidden; transition:border-color .18s; }
    .row:hover { border-color:${GOLD}; }

    .cta-card { background:${INK}; color:#fff; padding:22px; border:1px solid rgba(184,150,62,.4); background-image: radial-gradient(400px 200px at 100% 0, rgba(184,150,62,.25), transparent 65%); }
    .stat-row:not(:last-child) { border-bottom:0.5px solid #f0ebe0; }
    .profile-content-grid { display:grid; grid-template-columns:290px 1fr; gap:24px; align-items:start; }
    .side { display:flex; flex-direction:column; gap:16px; }
    .side-mobile { display:none; }
    @media (max-width:900px) { .profile-content-grid { grid-template-columns:1fr; } .side-desktop { display:none; } .side-mobile { display:flex; flex-direction:column; gap:16px; } }
    @media (max-width:600px) { .hero-pad { padding:64px 16px 0 !important; } .books-grid { grid-template-columns:repeat(2,1fr); gap:10px; } }
  `}</style>
);

/* ═══ BOOK CARD ═══ */
function BookCard({ book, isPurchased, view, user, router }) {
    const href = `/book/preview?id=${String(book.id).replace("firestore-", "")}`;
    const owned = isPurchased(book.id);
    const free = book.price === 0;
    const go = (e) => { if (!user) { e.preventDefault(); router.push(`/signup?redirect=${encodeURIComponent(window.location.pathname)}`); } };
    const priceEl = <span className="bk-price" style={free ? { color: "#16a34a" } : undefined}>{free ? "Free" : naira(book.price)}</span>;

    if (view === "list") {
        return (
            <Link href={href} onClick={go} className="row">
                <img src={book.image} alt={book.title} style={{ width: 44, height: 60, objectFit: "cover", borderRadius: 2, flexShrink: 0 }} onError={(e) => { e.target.src = FALLBACK_IMG; }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                    <h4 className="bk-title" style={{ WebkitLineClamp: 1, fontSize: 13 }}>{book.title}</h4>
                    <p className="bk-cat" style={{ margin: "3px 0 0" }}>{book.category}</p>
                    <div style={{ display: "flex", gap: 8, marginTop: 5, flexWrap: "wrap", alignItems: "center" }}>
                        {owned && <span style={{ color: "#15803d", fontWeight: 700, fontSize: 10 }}>Owned</span>}
                        {book.soldCount > 0 && <span className="muted" style={{ fontSize: 10, display: "flex", gap: 3, alignItems: "center" }}><ShoppingBag size={9} />{book.soldCount}</span>}
                        {!user && <span style={{ fontSize: 10, display: "flex", gap: 3, alignItems: "center", color: GOLD }}><Lock size={9} /> Sign in to view</span>}
                    </div>
                </div>
                {priceEl}
            </Link>
        );
    }
    return (
        <Link href={href} onClick={go} className="bk">
            <div style={{ position: "relative", overflow: "hidden" }}>
                <img src={book.image} alt={book.title} className="bk-img" onError={(e) => { e.target.src = FALLBACK_IMG; }} />
                <span className="tag tag-pdf">PDF</span>
                {owned ? <span className="tag tag-owned">Owned</span> : free && <span className="tag tag-free"><Gift size={9} /> Free</span>}
                {!user && (
                    <div className="lock">
                        <span className="tag" style={{ position: "static", background: NAVY, color: GOLD, border: `0.5px solid ${GOLD}`, padding: "5px 11px" }}><Lock size={9} /> Sign in to view</span>
                    </div>
                )}
            </div>
            <div style={{ padding: "10px 10px 12px", borderTop: "0.5px solid #f0ebe0" }}>
                <h4 className="bk-title">{book.title}</h4>
                <p className="bk-cat">{book.category}</p>
                {priceEl}
            </div>
        </Link>
    );
}

/* ═══ MAIN ═══ */
export default function ClientProfileContent({ sellerSlug }) {
    const router = useRouter();

    const [seller, setSeller] = useState(null);
    const [sellerPhoto, setSellerPhoto] = useState(null);
    const [sellerBooks, setSellerBooks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearch] = useState("");
    const [selectedCategory, setCategory] = useState("all");
    const [priceFilter, setPriceFilter] = useState("all"); // all | paid | free
    const [purchasedBookIds, setPurchased] = useState(new Set());
    const [isFollowing, setFollowing] = useState(false);
    const [followerCount, setFollowers] = useState(0);
    const [followingCount, setFollowingCount] = useState(0);
    const [showFollowing, setShowFollowing] = useState(false);
    const [activeTab, setActiveTab] = useState("materials");
    const [view, setView] = useState("grid");
    const [followLoading, setFollowLoad] = useState(false);
    const [authReady, setAuthReady] = useState(false);
    const [user, setUser] = useState(null);
    const [userData, setUserData] = useState(null);
    const [resolvedUid, setResolvedUid] = useState(null);
    const [slugResolving, setSlugResolving] = useState(true);

    const isOwner = !!user && !!resolvedUid && user.uid === resolvedUid;
    const DASHBOARDHREF = "/my-account/seller-account/";

    // Back from Flutterwave on the owner's own profile
    useVerificationReturn((r) => { if (r.ok) setSeller((s) => (s ? { ...s, paidVerified: true } : s)); });

    useEffect(() => {
        const unsub = onAuthStateChanged(auth, (u) => { setUser(u); setAuthReady(true); });
        return () => unsub();
    }, []);

    /* Slug -> UID */
    useEffect(() => {
        const resolve = async () => {
            if (!sellerSlug) return;
            setSlugResolving(true); setShowFollowing(false); setActiveTab("materials");
            try {
                try {
                    const snap = await getDocs(query(collection(db, "sellers"), where("slug", "==", sellerSlug)));
                    if (!snap.empty) { setResolvedUid(snap.docs[0].id); return; }
                } catch (err) { if (err?.code !== "permission-denied") console.debug("Slug query error:", err?.message); }
                try {
                    const d = await getDoc(doc(db, "sellers", sellerSlug));
                    if (d.exists()) { setResolvedUid(sellerSlug); return; }
                } catch (err) { console.debug("Direct UID lookup failed:", err?.message); }
                setResolvedUid(null); setSeller(null);
            } catch (err) { console.error("resolveSlug error:", err); setResolvedUid(null); }
            finally { setSlugResolving(false); }
        };
        resolve();
    }, [sellerSlug]);

    /* Follow status */
    useEffect(() => {
        if (!resolvedUid) return;
        const check = async () => {
            try {
                setFollowers((await getDocs(query(collection(db, "follows"), where("lecturerId", "==", resolvedUid)))).size);
            } catch {
                try { const sd = await getDoc(doc(db, "sellers", resolvedUid)); setFollowers(sd.exists() ? sd.data().followersCount || 0 : 0); }
                catch { setFollowers(0); }
            }
            try {
                const fq = await getDocs(query(collection(db, "follows"), where("followerId", "==", resolvedUid)));
                setFollowingCount(fq.docs.filter((d) => d.data().lecturerId !== resolvedUid).length);
            } catch { setFollowingCount(0); }
            if (user) {
                try { setFollowing((await getDoc(doc(db, "follows", `${user.uid}_${resolvedUid}`))).exists()); }
                catch { setFollowing(false); }
            } else setFollowing(false);
        };
        check();
    }, [resolvedUid, user]);

    const toggleFollow = async () => {
        if (!user) { router.push(`/signup?redirect=${encodeURIComponent(window.location.pathname)}`); return; }
        if (followLoading) return;
        setFollowLoad(true);
       const followRef = doc(db, "follows", `${user.uid}_${resolvedUid}`);
try {
    if (isFollowing) {
        await deleteDoc(followRef);
        setFollowing(false);
        setFollowers((p) => Math.max(0, p - 1));
    } else {
        await setDoc(followRef, {
            followerId: user.uid,
            lecturerId: resolvedUid,
            lecturerName: seller?.sellerName || "",
            createdAt: serverTimestamp(),
        });
        setFollowing(true);
        setFollowers((p) => p + 1);
    }
} catch (err) { console.error("follow error:", err); }
finally { setFollowLoad(false); }
    };

    /* Profile data */
    useEffect(() => {
        if (!resolvedUid) return;
        setLoading(true);
        const timeoutId = setTimeout(() => { setSeller(null); setLoading(false); }, 12000);

        const fetchSellerData = async () => {
            try {
                let sellerName = "", sellerTitle = "", sellerDept = "", sellerUni = "", sellerCountry = "", sellerBio = "", paidVerified = false;

                const sd = await getDoc(doc(db, "sellers", resolvedUid));
                if (sd.exists()) {
                    const d = sd.data();
                    sellerBio = (d.businessInfo?.businessDescription || "").trim();
                    const raw = d.sellerName || d.displayName || "";
                    sellerName = raw === "Unknown" ? "" : raw;
                    sellerTitle = d.title || d.sellerTitle || "";
                    sellerDept = d.department || ""; sellerUni = d.university || ""; sellerCountry = d.country || "";
                    paidVerified = paidVerificationActive(d);
                }

                const ud = await getDoc(doc(db, "users", resolvedUid));
                if (ud.exists()) {
                    const u = ud.data();
                    setUserData(u);
                    const usersName = ((u.firstName || "") + " " + (u.surname || "")).trim() || u.displayName || "";
                    if (usersName) sellerName = usersName;
                    setSellerPhoto(u.photoBase64 || u.photoURL || u.profilePicture || null);
                    sellerDept = sellerDept || u.department || "";
                    sellerUni = sellerUni || u.university || "";
                    sellerCountry = sellerCountry || u.country || "";
                    sellerTitle = sellerTitle || u.title || u.lecturerTitle || "";
                }

                if (!sellerName) { setSeller(null); setLoading(false); return; }

                const [snap1, snap2] = await Promise.all([
                    getDocs(query(collection(db, "advertMyBook"), where("userId", "==", resolvedUid))),
                    getDocs(query(collection(db, "advertMyBook"), where("sellerId", "==", resolvedUid))),
                ]);
                const seen = new Set(), books = [];
                [snap1, snap2].forEach((snap) => snap.forEach((ds) => {
                    if (seen.has(ds.id)) return;
                    const data = ds.data();
                    if (data.status !== "approved") return;
                    seen.add(ds.id);
                    const b = {
                        id: `firestore-${ds.id}`, firestoreId: ds.id,
                        title: data.bookTitle || data.title || "Untitled",
                        category: (data.category || "general").toLowerCase(),
                        price: Number(data.price) || 0,
                        driveFileId: data.driveFileId, pdfUrl: data.pdfUrl || data.pdfLink, embedUrl: data.embedUrl,
                        soldCount: Number(data.soldCount) || 0,
                    };
                    b.image = getThumbnailUrl(b);
                    books.push(b);
                }));

                const cu = auth.currentUser;
                if (cu) {
                    const md = await getDoc(doc(db, "users", cu.uid));
                    if (md.exists()) {
                        const ids = new Set();
                        Object.values(md.data().purchasedBooks || {}).forEach((p) => {
                            const id = p.bookId || p.id || p.firestoreId;
                            if (id) { ids.add(id); ids.add(`firestore-${id}`); }
                        });
                        setPurchased(ids);
                    }
                }

                setSeller({ sellerId: resolvedUid, sellerName, sellerTitle, sellerDept, sellerUni, sellerCountry, sellerBio, paidVerified });
                setSellerBooks(books);
            } catch (err) { console.error("fetchSellerData error:", err); setSeller(null); }
            finally { clearTimeout(timeoutId); setLoading(false); }
        };
        fetchSellerData();
        return () => clearTimeout(timeoutId);
    }, [resolvedUid]);

    auth.currentUser?.getIdToken().then((t) =>
        fetch("/api/follow/notify", {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${t}` },
            body: JSON.stringify({ lecturerId }),
        })
    ).catch(() => { });
    

    /* Derived */
    const q = searchQuery.toLowerCase();
    const visible = sellerBooks.filter((b) =>
        (!q || b.title?.toLowerCase().includes(q) || b.category?.toLowerCase().includes(q)) &&
        (selectedCategory === "all" || b.category === selectedCategory));
    const paidBooks = visible.filter((b) => b.price > 0);
    const freeBooks = visible.filter((b) => b.price === 0);
    const totalPaid = sellerBooks.filter((b) => b.price > 0).length;
    const totalFree = sellerBooks.length - totalPaid;
    const categories = [{ value: "all", label: "All" }, ...Array.from(new Set(sellerBooks.map((b) => b.category))).filter(Boolean).map((c) => ({ value: c, label: c.charAt(0).toUpperCase() + c.slice(1) }))];
    const isPurchased = (id) => purchasedBookIds.has(id) || purchasedBookIds.has(String(id));

    const lecturerMode = seller
        ? userData?.isLecturer || userData?.role === "lecturer" ||
        ["lecturer", "dr.", "prof.", "professor", "mrs", "mr"].includes((seller.sellerTitle || "").toLowerCase())
        : false;
   const verified = !!seller && !lecturerMode && seller.paidVerified;
const facultyVerified =
    lecturerMode && !!userData &&
    (userData.isVerified === true || userData.lecturerVerificationStatus === "approved") &&
    userData.lecturerVerificationStatus !== "pending" &&
    userData.lecturerVerificationStatus !== "rejected";
const showBlue = verified || facultyVerified;

    const displayTitle = seller ? (lecturerMode ? `${seller.sellerTitle} ${seller.sellerName}`.trim() : seller.sellerName) : "Profile";
    const countryDisplay = getCountryDisplay(seller?.sellerCountry);
    const sellerLastName = seller?.sellerName?.split(" ").slice(-1)[0] || "";
    const sellerFirstName = seller?.sellerName?.split(" ")[0] || "";
    const aboutHeader = lecturerMode ? `About ${seller?.sellerTitle || ""} ${sellerLastName}`.trim() : `About ${sellerFirstName || "the seller"}`;

    const renderAbout = () => {
        const rows = [
            lecturerMode && { label: "Title", value: seller?.sellerTitle, Icon: GraduationCap },
            { label: "Department", value: seller?.sellerDept, Icon: BookMarked },
            { label: "University", value: seller?.sellerUni, Icon: Building2 },
            { label: "Country", value: countryDisplay, Icon: Globe },
        ].filter((r) => r && r.value);
        return (
            <div className="card">
                <p className="label">{aboutHeader}</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {rows.map(({ label, value, Icon }) => (
                        <div key={label} style={{ display: "flex", gap: 10, alignItems: "center" }}>
                            <Icon size={14} style={{ color: GOLD, flexShrink: 0 }} />
                            <span style={{ fontSize: 13, color: "#555" }}>{value}</span>
                        </div>
                    ))}
                    {!rows.length && <p className="muted">No additional info provided.</p>}
                </div>
            </div>
        );
    };

    const renderStats = () => (
        <div className="card">
            <p className="label">Stats</p>
            {[
                { label: "Paid materials", value: totalPaid, Icon: Tag },
                { label: "Free materials", value: totalFree, Icon: Gift },
                { label: "Followers", value: formatCount(followerCount), Icon: Users },
                { label: "Following", value: formatCount(followingCount), Icon: UserCheck, onClick: () => setShowFollowing(true) },
            ].map(({ label, value, Icon, onClick }) => (
                <div key={label} className="stat-row" onClick={onClick} role={onClick ? "button" : undefined}
                    style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", gap: 8, cursor: onClick ? "pointer" : "default" }}>
                    <span style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 13, color: "#666" }}><Icon size={13} style={{ color: GOLD }} /> {label}</span>
                    <span className="lan-serif" style={{ fontWeight: 700, color: NAVY, fontSize: 14 }}>{value}</span>
                </div>
            ))}
        </div>
    );

    const renderGuestBanner = () => {
        if (!authReady || user) return null;
        return (
            <div className="cta-card" style={{ display: "flex", gap: 16, flexWrap: "wrap", alignItems: "center" }}>
                <p style={{ flex: "1 1 220px", fontSize: 13, lineHeight: 1.7, color: "rgba(245,240,232,.88)" }}>
                    {lecturerMode
                        ? "Are you a student here? Create a free account to follow your lecturers and get notified when new materials drop."
                        : "Never miss an update. Create a free account to follow this creator and get their latest summaries, study guides and resources."}
                </p>
                <Link href="/signup" className="btn btn-gold"><UserPlus size={13} /> Create free account</Link>
            </div>
        );
    };

    const renderBooks = (list) => view === "list"
        ? <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>{list.map((b) => <BookCard key={b.id} book={b} isPurchased={isPurchased} view="list" user={user} router={router} />)}</div>
        : <div className="books-grid">{list.map((b) => <BookCard key={b.id} book={b} isPurchased={isPurchased} view="grid" user={user} router={router} />)}</div>;

    const renderShelf = (kind, list) => {
        if (!list.length) return null;
        const paid = kind === "paid";
        return (
            <section className={`card ${paid ? "shelf-paid" : "shelf-free"}`}>
                <div className="shelf-head">
                    <h3 className="lan-serif shelf-title">
                        {paid ? <Tag size={18} style={{ color: GOLD }} /> : <Gift size={18} style={{ color: "#16a34a" }} />}
                        {paid ? "Premium materials" : "Free materials"}
                        <span className="muted" style={{ fontFamily: "Lato", fontWeight: 700 }}>{list.length}</span>
                    </h3>
                    <p className="muted">{paid ? "Buy once, keep forever" : "Open to every student, no payment needed"}</p>
                </div>
                {renderBooks(list)}
            </section>
        );
    };

    /* Loading */
    if (slugResolving || loading) {
        return (
            <div className="lan-root" style={{ minHeight: "100vh" }}>
                <GlobalStyles />
                <div className="hero" style={{ height: 260 }} />
                <div style={{ maxWidth: 1100, margin: "0 auto", padding: "24px 16px" }}>
                    {[1, 2].map((i) => (
                        <div key={i} className="card" style={{ marginBottom: 16 }}>
                            {[80, 60, 40].map((w) => <div key={w} style={{ height: 12, background: "#f0ebe0", marginBottom: 12, width: `${w}%`, animation: "pulse 1.5s infinite" }} />)}
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    /* Not found */
    if (!seller) {
        return (
            <div className="lan-root" style={{ minHeight: "100vh" }}>
                <GlobalStyles />
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "80px 24px", textAlign: "center" }}>
                    <BookOpen size={40} style={{ color: "#d9cfbd", marginBottom: 18 }} />
                    <h2 className="lan-serif" style={{ fontSize: 24, color: NAVY, marginBottom: 8 }}>Profile not found</h2>
                    <p className="muted" style={{ marginBottom: 20, maxWidth: 320, lineHeight: 1.7 }}>This profile doesn't exist, or the link may be incorrect.</p>
                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center" }}>
                        <button className="btn" style={{ border: `0.5px solid ${NAVY}`, color: NAVY, background: "transparent" }} onClick={() => router.back()}><ArrowLeft size={12} /> Go back</button>
                        <button className="btn" style={{ background: NAVY, color: "#fff" }} onClick={() => router.push("/lecturers")}><Users size={12} /> Browse educators</button>
                    </div>
                </div>
            </div>
        );
    }

    const showPaid = priceFilter !== "free";
    const showFree = priceFilter !== "paid";
    const nothing = !(showPaid && paidBooks.length) && !(showFree && freeBooks.length);
    const filtered = searchQuery || selectedCategory !== "all" || priceFilter !== "all";

    return (
        <div className="lan-root" style={{ minHeight: "100vh" }}>
            <GlobalStyles />

            {/* Sticky bar */}
            <div style={{ background: "#fff", borderBottom: "0.5px solid #e5ddd0", position: "sticky", top: 0, zIndex: 40 }}>
                <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 16px", height: 48, display: "flex", alignItems: "center", gap: 12 }}>
                    <button onClick={() => router.back()} aria-label="Go back" style={{ background: "none", border: "none", cursor: "pointer", color: "#888", display: "flex" }}><ArrowLeft size={18} /></button>
                    <div style={{ minWidth: 0, flex: 1 }}>
                        <p className="lan-serif" style={{ fontSize: 13, fontWeight: 700, color: NAVY, display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
                            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{displayTitle}</span>
                        </p>
                        <p className="muted" style={{ fontSize: 10 }}>{totalPaid} paid, {totalFree} free, {formatCount(followerCount)} followers</p>
                    </div>
                </div>
            </div>

            {/* Hero */}
            <div className="hero">
                <div className="lan-serif" style={{ position: "absolute", bottom: -14, right: 20, fontSize: 120, fontWeight: 900, color: "rgba(255,255,255,.04)", pointerEvents: "none", userSelect: "none" }}>LAN</div>
                <div style={{ position: "absolute", top: 16, left: 16 }}>
                   {lecturerMode
    ? facultyVerified
        ? <span className="pill pill-blue"><VerifiedBadge size={12} title="Verified faculty" /> Verified faculty</span>
        : <span className="pill"><GraduationCap size={11} /> Academic educator</span>
    : verified
        ? <span className="pill pill-blue"><VerifiedBadge size={12} /> Verified seller</span>
        : <span className="pill">Seller</span>}
                </div>

                <div className="hero-pad" style={{ maxWidth: 1100, margin: "0 auto", padding: "64px 24px 0" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 24, flexWrap: "wrap", paddingBottom: 8 }}>
                        <div style={{ width: lecturerMode ? 112 : 100, height: lecturerMode ? 112 : 100, flexShrink: 0, position: "relative" }}>
                            {sellerPhoto
                                ?  <img src={sellerPhoto} alt={seller.sellerName} className={`ring ${showBlue ? "ring-blue" : ""}`} />
                                : (
                                    <div className={`ring ${showBlue ? "ring-blue" :  ""}`} style={{ background: "rgba(255,255,255,.08)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                        {lecturerMode ? <GraduationCap size={38} style={{ color: GOLD }} /> :
                                            <span className="lan-serif" style={{ color: GOLD, fontSize: 34, fontWeight: 900 }}>{seller.sellerName?.charAt(0)?.toUpperCase() || "?"}</span>}
                                    </div>
                                )}
                            {showBlue && <VerifiedBadge size={26} ring={INK} title={lecturerMode ? "Verified faculty" : "Verified seller"} style={{ position: "absolute", right: -4, bottom: 0 }} />}
                        </div>

                        <div style={{ flex: 1, minWidth: 0 }}>
                            {lecturerMode && seller.sellerTitle && <p style={{ fontSize: 11, fontWeight: 700, color: GOLDD, marginBottom: 4 }}>{seller.sellerTitle}</p>}
                            <h1 className="lan-serif hero-name" style={{ marginBottom: 6 }}>{seller.sellerName}</h1>
                            <p style={{ fontSize: 13, color: "rgba(245,240,232,.65)", marginBottom: 12 }}>
                                {[seller.sellerDept, seller.sellerUni, countryDisplay].filter(Boolean).join(", ") || "LAN Library creator"}
                            </p>

                            {seller.sellerBio && (
                                <div style={{ maxWidth: 540, marginBottom: 16, display: "flex", gap: 10 }}>
                                    <div style={{ width: 2, background: GOLD, opacity: 0.7, flexShrink: 0 }} />
                                    <div style={{ minWidth: 0 }}>
                                        <p style={{ fontSize: 13, lineHeight: 1.65, color: "rgba(245,240,232,.85)", fontWeight: 300, fontStyle: "italic", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", wordBreak: "break-word" }}>{seller.sellerBio}</p>
                                        {seller.sellerBio.length > 120 && <button onClick={() => setActiveTab("about")} style={{ background: "none", border: "none", marginTop: 4, cursor: "pointer", fontSize: 11, fontWeight: 700, color: GOLDD }}>Read more</button>}
                                    </div>
                                </div>
                            )}

                            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                                {isOwner ? (
                                    <>
                                        <Link href={DASHBOARDHREF} className="btn btn-gold"><LayoutDashboard size={13} /> Owner dashboard</Link>
                                    </>
                                ) : (
                                    <>
                                        <button onClick={toggleFollow} disabled={followLoading} className="btn btn-gold">
                                            {isFollowing ? <UserCheck size={13} /> : <UserPlus size={13} />} {isFollowing ? "Following" : "Follow"}
                                        </button>
                                        {!user && authReady && <span style={{ fontSize: 10, color: "rgba(184,150,62,.8)" }}>Sign in required</span>}
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="metrics">
                        {[
                            { val: totalPaid, label: "Paid" },
                            { val: totalFree, label: "Free" },
                            { val: formatCount(followerCount), label: "Followers" },
                            { val: formatCount(followingCount), label: "Following", onClick: () => setShowFollowing(true) },
                        ].map(({ val, label, onClick }) => {
                            const T = onClick ? "button" : "div";
                            return (
                                <T key={label} onClick={onClick} className="metric">
                                    <div className="lan-serif" style={{ fontSize: 24, fontWeight: 700, color: "#fff" }}>{val}</div>
                                    <div style={{ fontSize: 11, fontWeight: 700, color: onClick ? GOLDD : "rgba(184,150,62,.8)", marginTop: 2 }}>{label}{onClick ? " ›" : ""}</div>
                                </T>
                            );
                        })}
                    </div>

                    <div className="sbar-none" style={{ display: "flex", marginTop: 18, overflowX: "auto", borderTop: "0.5px solid rgba(184,150,62,.2)" }}>
                        {[{ id: "materials", label: lecturerMode ? "Materials" : "Books" }, { id: "about", label: "About" }].map((t) => (
                            <button key={t.id} onClick={() => setActiveTab(t.id)} className={`lan-tab ${activeTab === t.id ? "lan-tab-active" : "lan-tab-inactive"}`}>{t.label}</button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Content */}
            <div style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 24px 80px" }}>
                {activeTab === "materials" && (
                    <div className="profile-content-grid">
                        <div className="side side-desktop">{renderAbout()}{renderStats()}</div>

                        <div style={{ display: "flex", flexDirection: "column", gap: 16, minWidth: 0 }}>
                            <div className="card" style={{ padding: "14px 16px" }}>
                                <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                                    <div style={{ flex: 1, position: "relative" }}>
                                        <Search size={13} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#bbb" }} />
                                        <input type="text" placeholder="Search materials…" value={searchQuery} onChange={(e) => setSearch(e.target.value)} className="search-input" />
                                        {searchQuery && <button onClick={() => setSearch("")} aria-label="Clear search" style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#aaa" }}><X size={13} /></button>}
                                    </div>
                                    <button onClick={() => setView("grid")} aria-label="Grid view" className={`view-btn ${view === "grid" ? "active" : ""}`}><Grid3X3 size={14} /></button>
                                    <button onClick={() => setView("list")} aria-label="List view" className={`view-btn ${view === "list" ? "active" : ""}`}><LayoutList size={14} /></button>
                                </div>
                                <div className="seg" style={{ marginBottom: 12 }}>
                                    {[["all", "All", sellerBooks.length], ["paid", "Paid", totalPaid], ["free", "Free", totalFree]].map(([k, l, n]) => (
                                        <button key={k} className={priceFilter === k ? "on" : ""} onClick={() => setPriceFilter(k)}>{l} <b>{n}</b></button>
                                    ))}
                                </div>
                                {categories.length > 2 && (
                                    <div className="sbar-none" style={{ display: "flex", gap: 6, overflowX: "auto" }}>
                                        {categories.map((c) => <button key={c.value} onClick={() => setCategory(c.value)} className={`cat-pill${selectedCategory === c.value ? " active" : ""}`}>{c.label}</button>)}
                                    </div>
                                )}
                            </div>

                            {nothing ? (
                                <div className="card" style={{ textAlign: "center", padding: "48px 16px" }}>
                                    <BookOpen size={30} style={{ color: "#d9cfbd", marginBottom: 12 }} />
                                    <h3 className="lan-serif" style={{ fontSize: 18, color: NAVY, marginBottom: 6 }}>No results</h3>
                                    <p className="muted">{filtered ? "Clear your filters to see all materials." : "No materials uploaded yet."}</p>
                                    {filtered && <button className="btn" style={{ marginTop: 12, background: "none", border: `0.5px solid ${NAVY}`, color: NAVY }} onClick={() => { setSearch(""); setCategory("all"); setPriceFilter("all"); }}>Clear filters</button>}
                                </div>
                            ) : (<>{showPaid && renderShelf("paid", paidBooks)}{showFree && renderShelf("free", freeBooks)}</>)}

                            {renderGuestBanner()}
                            <div className="side-mobile">{renderAbout()}{renderStats()}</div>
                        </div>
                    </div>
                )}

                {activeTab === "about" && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 760 }}>
                        {seller.sellerBio && (
                            <div className="card" style={{ borderLeft: `3px solid ${GOLD}`, position: "relative", overflow: "hidden" }}>
                                <Quote size={64} style={{ position: "absolute", top: 8, right: 12, color: "rgba(184,150,62,.08)" }} />
                                <p className="label">Bio</p>
                                <p className="lan-serif" style={{ fontSize: 15, lineHeight: 1.8, color: NAVY, whiteSpace: "pre-line", wordBreak: "break-word", position: "relative" }}>{seller.sellerBio}</p>
                            </div>
                        )}
                        {renderAbout()}{renderStats()}{renderGuestBanner()}
                    </div>
                )}
            </div>

            <FollowingModal open={showFollowing} onClose={() => setShowFollowing(false)} profileUid={resolvedUid} profileName={seller.sellerName} isOwner={isOwner} router={router} onUnfollowed={() => setFollowingCount((c) => Math.max(0, c - 1))} />
        </div>
    );
}