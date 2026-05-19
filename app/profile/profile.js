// app/profile/[slug]/client.jsx
// ─────────────────────────────────────────────────────────────
// Client component: All interactive features for public profile view
// Includes: Auth detection, follow/unfollow, book grid/list,
// search/filter, guest onboarding banner, responsive layout.
// ─────────────────────────────────────────────────────────────

"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
    collection,
    getDocs,
    doc,
    getDoc,
    query,
    where,
    setDoc,
    deleteDoc,
    updateDoc,
    increment,
    serverTimestamp,
} from "firebase/firestore";
import { auth, db } from "@/lib/firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";
import {
    ArrowLeft,
    Search,
    X,
    BookOpen,
    GraduationCap,
    UserPlus,
    UserCheck,
    Users,
    Building2,
    Grid3X3,
    LayoutList,
    BookMarked,
    Globe,
    ShoppingBag,
    Lock,
    TrendingUp,
    Sparkles,
    ChevronRight,
} from "lucide-react";

/* ─── Design Tokens ─────────────────────────────────────── */
const NAVY = "#0d2244";
const GOLD = "#b8963e";
const GOLDD = "#d4aa5a";
const CREAM = "#f5f0e8";
const BG = "#f5f1ea";

const FALLBACK_IMG =
    "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400";

/* ─── Helpers ───────────────────────────────────────────── */
const getThumbnailUrl = (book) => {
    if (!book) return FALLBACK_IMG;
    if (book.driveFileId)
        return `https://drive.google.com/thumbnail?id=${book.driveFileId}&sz=w400`;
    if (book.embedUrl) {
        const m = book.embedUrl.match(
            /\/d\/(.*?)\/|\/file\/d\/(.*?)\/|id=(.*?)(&|$)/
        );
        if (m) {
            const id = m[1] || m[2] || m[3];
            if (id)
                return `https://drive.google.com/thumbnail?id=${id}&sz=w400`;
        }
    }
    if (book.pdfUrl?.includes("drive.google.com")) {
        const m = book.pdfUrl.match(/[-\w]{25,}/);
        if (m)
            return `https://drive.google.com/thumbnail?id=${m[0]}&sz=w400`;
    }
    return book.image || FALLBACK_IMG;
};

const getCountryDisplay = (country) => {
    if (!country) return null;
    const COUNTRY_FLAGS = {
        nigeria: "🇳🇬",
        ghana: "🇬🇭",
        kenya: "🇰🇪",
        "south africa": "🇿🇦",
        ethiopia: "🇪🇹",
        uganda: "🇺🇬",
        tanzania: "🇹🇿",
        cameroon: "🇨🇲",
        senegal: "🇸🇳",
        "united kingdom": "🇬🇧",
        uk: "🇬🇧",
        usa: "🇺🇸",
        "united states": "🇺🇸",
        canada: "🇨🇦",
        india: "🇮🇳",
    };
    const key = country.toLowerCase().trim();
    const flag = COUNTRY_FLAGS[key] || "";
    return `${country}${flag ? " " + flag : ""}`;
};

/* ─── Global Styles ────────────────────────────────────── */
const GlobalStyles = () => (
    <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400&family=Lato:wght@300;400;700&display=swap');
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body, .lan-root { font-family: 'Lato', sans-serif; background: ${BG}; }
    .lan-serif { font-family: 'Playfair Display', Georgia, serif; }
    .sbar-none { scrollbar-width: none; -ms-overflow-style: none; }
    .sbar-none::-webkit-scrollbar { display: none; }

    /* Animations */
    @keyframes fadeUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
    @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:.45; } }
    .anim-1 { animation: fadeUp .5s cubic-bezier(.4,0,.2,1) both; }
    .anim-2 { animation: fadeUp .5s .08s cubic-bezier(.4,0,.2,1) both; }
    .anim-3 { animation: fadeUp .5s .16s cubic-bezier(.4,0,.2,1) both; }

    /* Book cards */
    .book-grid-card { transition: transform .22s, box-shadow .22s, border-color .22s; }
    .book-grid-card:hover { transform:translateY(-4px); box-shadow:0 12px 32px rgba(13,34,68,.12); border-color:${GOLD}!important; }
    .book-grid-card:hover .book-grid-img { transform:scale(1.05); }
    .book-grid-img { transition: transform .5s cubic-bezier(.4,0,.2,1); overflow:hidden; }
    
    .book-list-row { transition: border-color .18s, box-shadow .18s; }
    .book-list-row:hover { border-color:${GOLD}!important; box-shadow:0 4px 16px rgba(13,34,68,.08); }

    /* Tabs */
    .lan-tab { font-size:11px; font-weight:700; letter-spacing:.08em; text-transform:uppercase;
      padding:10px 18px; border:none; border-bottom:2px solid transparent;
      cursor:pointer; font-family:'Lato',sans-serif; background:transparent; transition:all .18s; white-space:nowrap; }
    .lan-tab-active { color:${GOLD}; border-bottom-color:${GOLD}; }
    .lan-tab-inactive { color:#888; }
    .lan-tab-inactive:hover { color:${NAVY}; }

    /* Search / filter */
    .search-input { font-family:'Lato',sans-serif; font-size:13px; outline:none;
      background:${BG}; border:0.5px solid #e5ddd0; color:${NAVY};
      width:100%; padding:9px 12px 9px 34px; }
    .search-input:focus { border-color:${GOLD}; }
    .search-input::placeholder { color:#aaa; }
    
    .cat-pill { font-size:10px; font-weight:700; letter-spacing:.08em; text-transform:uppercase;
      padding:5px 14px; border:0.5px solid #e5ddd0; cursor:pointer;
      font-family:'Lato',sans-serif; transition:all .15s; background:transparent;
      white-space:nowrap; flex-shrink:0; }
    .cat-pill.active { background:${NAVY}; color:#fff; border-color:${NAVY}; }
    .cat-pill:not(.active):hover { border-color:${NAVY}; color:${NAVY}; }

    /* View toggle */
    .view-btn { width:34px; height:34px; display:flex; align-items:center; justify-content:center;
      border:0.5px solid #e5ddd0; background:transparent; cursor:pointer; transition:all .15s; flex-shrink:0; }
    .view-btn.active { background:${NAVY}; border-color:${NAVY}; color:#fff; }
    .view-btn:not(.active):hover { border-color:${NAVY}; }

    /* Follow button */
    .follow-btn { display:flex; align-items:center; gap:6px; padding:10px 20px;
      font-size:11px; font-weight:700; letter-spacing:.08em; text-transform:uppercase;
      font-family:'Lato',sans-serif; border:none; cursor:pointer; transition:all .18s;
      white-space:nowrap; background:${GOLD}; color:${NAVY}; }
    .follow-btn:hover:not(:disabled) { background:${GOLDD}; }
    .follow-btn:disabled { opacity:.6; cursor:not-allowed; }

    /* Stat rows */
    .stat-row:not(:last-child) { border-bottom:0.5px solid #f0ebe0; }

    /* Grid layouts */
    .books-grid { display:grid; grid-template-columns:repeat(auto-fill, minmax(150px,1fr)); gap:14px; }
    .profile-content-grid {
      display: grid;
      grid-template-columns: 260px 1fr;
      gap: 24px;
      align-items: start;
    }

    /* Responsive */
    @media (max-width: 900px) {
      .profile-content-grid { grid-template-columns: 1fr; }
      .sidebar-desktop { display:none; }
      .sidebar-mobile { display:flex; flex-direction:column; gap:16px; }
    }
    @media (max-width: 768px) {
      .books-grid { grid-template-columns:repeat(auto-fill, minmax(130px,1fr)); gap:10px; }
      .lan-tab { padding:10px 14px; font-size:10px; }
      .hero-name { font-size:clamp(20px,6vw,30px)!important; }
      .hero-name { font-size:clamp(18px,5vw,30px)!important; }

      @media (max-width: 600px) {
  .hero-inner-pad { padding: 48px 16px 0 !important; }
}
    }
    @media (max-width: 480px) {
      .books-grid { grid-template-columns:repeat(2,1fr); gap:8px; }
    }
  `}</style>
);

/* ═══════════════════════════════════════════════════════════
   BOOK CARD COMPONENT
═══════════════════════════════════════════════════════════ */
function BookCard({ book, isPurchased, view, user, router }) {
    const bookId = String(book.id).replace("firestore-", "");
    const href = `/book/preview?id=${bookId}`;
    const owned = isPurchased(book.id);

    const handleClick = (e) => {
        if (!user) {
            e.preventDefault();
            router.push(
                `/auth/signup?redirect=${encodeURIComponent(window.location.pathname)}`
            );
        }
    };

    if (view === "list") {
        return (
            <Link
                href={href}
                onClick={handleClick}
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "14px",
                    background: "#fff",
                    border: "0.5px solid #e5ddd0",
                    padding: "12px 14px",
                    textDecoration: "none",
                    width: "100%",
                    boxSizing: "border-box",
                    minWidth: 0,
                    overflow: "hidden",
                    position: "relative",
                }}
                className="book-list-row"
            >
                <img
                    src={book.image}
                    alt={book.title}
                    style={{
                        width: "44px",
                        height: "60px",
                        objectFit: "cover",
                        flexShrink: 0,
                        display: "block",
                        borderRadius: "2px",
                    }}
                    onError={(e) => {
                        e.target.src = FALLBACK_IMG;
                    }}
                />
                <div style={{ flex: 1, minWidth: 0, overflow: "hidden" }}>
                    <h4
                        style={{
                            fontFamily: "'Playfair Display',serif",
                            fontSize: "13px",
                            fontWeight: 700,
                            color: NAVY,
                            margin: "0 0 3px",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                        }}
                    >
                        {book.title}
                    </h4>
                    <p
                        style={{
                            fontSize: "11px",
                            color: "#aaa",
                            margin: "0 0 5px",
                            textTransform: "capitalize",
                            fontFamily: "'Lato',sans-serif",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                        }}
                    >
                        {book.category}
                    </p>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                        {owned && (
                            <span
                                style={{
                                    fontSize: "9px",
                                    fontWeight: 700,
                                    background: "#dcfce7",
                                    color: "#15803d",
                                    padding: "2px 6px",
                                    fontFamily: "'Lato',sans-serif",
                                    letterSpacing: ".06em",
                                    textTransform: "uppercase",
                                }}
                            >
                                Owned
                            </span>
                        )}
                        {book.soldCount > 0 && (
                            <span
                                style={{
                                    fontSize: "10px",
                                    color: "#aaa",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "3px",
                                    fontFamily: "'Lato',sans-serif",
                                }}
                            >
                                <ShoppingBag size={9} />
                                {book.soldCount}
                            </span>
                        )}
                        {!user && (
                            <span
                                style={{
                                    fontSize: "9px",
                                    fontWeight: 700,
                                    background: "rgba(184,150,62,.12)",
                                    color: GOLD,
                                    padding: "2px 7px",
                                    fontFamily: "'Lato',sans-serif",
                                    letterSpacing: ".06em",
                                    textTransform: "uppercase",
                                    border: "0.5px solid rgba(184,150,62,.3)",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "4px",
                                }}
                            >
                                <Lock size={8} /> Sign in to view
                            </span>
                        )}
                    </div>
                </div>
                <p
                    style={{
                        fontFamily: "'Playfair Display',serif",
                        fontWeight: 700,
                        fontSize: "13px",
                        color: NAVY,
                        margin: 0,
                        flexShrink: 0,
                        whiteSpace: "nowrap",
                    }}
                >
                    ₦{book.price?.toLocaleString()}
                </p>
            </Link>
        );
    }

    /* Grid card */
    return (
        <Link
            href={href}
            onClick={handleClick}
            style={{
                textDecoration: "none",
                display: "block",
                background: "#fff",
                border: "0.5px solid #e5ddd0",
                position: "relative",
            }}
            className="book-grid-card"
        >
            <div style={{ position: "relative", overflow: "hidden" }}>
                <img
                    src={book.image}
                    alt={book.title}
                    style={{
                        width: "100%",
                        aspectRatio: "2/3",
                        objectFit: "cover",
                        display: "block",
                    }}
                    className="book-grid-img"
                    onError={(e) => {
                        e.target.src = FALLBACK_IMG;
                    }}
                />
                {/* PDF badge */}
                <div
                    style={{
                        position: "absolute",
                        top: "8px",
                        left: "8px",
                        background: NAVY,
                        color: "#fff",
                        fontSize: "9px",
                        fontWeight: 700,
                        padding: "3px 7px",
                        fontFamily: "'Lato',sans-serif",
                        letterSpacing: ".06em",
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
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
                {/* Owned badge */}
                {owned && (
                    <span
                        style={{
                            position: "absolute",
                            top: "8px",
                            right: "8px",
                            background: "#16a34a",
                            color: "#fff",
                            fontSize: "9px",
                            fontWeight: 700,
                            padding: "3px 7px",
                        }}
                    >
                        OWNED
                    </span>
                )}
                {/* Guest lock overlay */}
                {!user && (
                    <div
                        style={{
                            position: "absolute",
                            inset: 0,
                            background: "rgba(13,34,68,.22)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            backdropFilter: "blur(1.5px)",
                        }}
                    >
                        <span
                            style={{
                                background: NAVY,
                                color: GOLD,
                                fontSize: "9px",
                                fontWeight: 700,
                                padding: "5px 11px",
                                fontFamily: "'Lato',sans-serif",
                                letterSpacing: ".08em",
                                textTransform: "uppercase",
                                border: `0.5px solid ${GOLD}`,
                                display: "flex",
                                alignItems: "center",
                                gap: "5px",
                            }}
                        >
                            <Lock size={9} /> Sign in to view
                        </span>
                    </div>
                )}
                {/* Sold count */}
                {book.soldCount > 0 && (
                    <span
                        style={{
                            position: "absolute",
                            bottom: "8px",
                            right: "8px",
                            background: "rgba(13,34,68,.85)",
                            color: "#fff",
                            fontSize: "9px",
                            padding: "3px 7px",
                            display: "flex",
                            alignItems: "center",
                            gap: "3px",
                        }}
                    >
                        <ShoppingBag size={8} />
                        {book.soldCount}
                    </span>
                )}
            </div>
            <div style={{ padding: "10px 10px 12px", borderTop: "0.5px solid #f0ebe0" }}>
                <h4
                    style={{
                        fontFamily: "'Playfair Display',serif",
                        fontSize: "12px",
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
                    {book.title}
                </h4>
                <p
                    style={{
                        fontSize: "10px",
                        color: "#aaa",
                        margin: "0 0 6px",
                        textTransform: "capitalize",
                        fontFamily: "'Lato',sans-serif",
                    }}
                >
                    {book.category}
                </p>
                <p
                    style={{
                        fontFamily: "'Playfair Display',serif",
                        fontWeight: 700,
                        fontSize: "13px",
                        color: NAVY,
                        margin: 0,
                    }}
                >
                    ₦{book.price?.toLocaleString()}
                </p>
            </div>
        </Link>
    );
}

/* ═══════════════════════════════════════════════════════════
   MAIN CLIENT PROFILE COMPONENT
═══════════════════════════════════════════════════════════ */
export default function ClientProfileContent({ sellerSlug }) {
    const router = useRouter();

    const [seller, setSeller] = useState(null);
    const [sellerPhoto, setSellerPhoto] = useState(null);
    const [sellerBooks, setSellerBooks] = useState([]);
    const [filteredBooks, setFiltered] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearch] = useState("");
    const [selectedCategory, setCategory] = useState("all");
    const [purchasedBookIds, setPurchased] = useState(new Set());
    const [isFollowing, setFollowing] = useState(false);
    const [followerCount, setFollowers] = useState(0);
    const [activeTab, setActiveTab] = useState("materials");
    const [view, setView] = useState("grid");
    const [followLoading, setFollowLoad] = useState(false);
    const [authReady, setAuthReady] = useState(false);
    const [user, setUser] = useState(null);
    const [userData, setUserData] = useState(null);
const [resolvedUid, setResolvedUid] = useState(null);
    const [slugResolving, setSlugResolving] = useState(true);
    
    /* ── Auth listener ── */
    useEffect(() => {
        const unsub = onAuthStateChanged(auth, (u) => {
            setUser(u);
            setAuthReady(true);
        });
        return () => unsub();
    }, []);

    /* ── Resolve slug to UID ── */
    useEffect(() => {
        const resolveSlug = async () => {
            if (!sellerSlug) return;

            try {
                // First try: direct UID lookup (no query needed)
                try {
                    const directSnap = await getDoc(doc(db, "sellers", sellerSlug));
                    if (directSnap.exists()) {
                        setResolvedUid(sellerSlug);
                        return;
                    }
                } catch (err) {
                    // If direct lookup fails, try query (might fail due to permissions)
                    if (err?.code !== "permission-denied") {
                        console.debug("Direct lookup skipped, trying query", err?.message);
                    }
                }

                // Second try: query by slug (requires read permissions on sellers collection)
                try {
                    const q = query(
                        collection(db, "sellers"),
                        where("slug", "==", sellerSlug)
                    );
                    const snap = await getDocs(q);
                    if (!snap.empty) {
                        setResolvedUid(snap.docs[0].id);
                        return;
                    }
                } catch (err) {
                    if (err?.code === "permission-denied") {
                        console.debug("Slug query blocked by security rules - this is expected");
                    } else {
                        console.error("Slug query error:", err?.message);
                    }
                }

                // If both fail, treat slug as UID and let it fail gracefully below
                setResolvedUid(sellerSlug);
            } catch (err) {
                console.error("resolveSlug fallback error:", err);
                setResolvedUid(sellerSlug);
            } finally {
                setSlugResolving(false);
            }
        };
        resolveSlug();
    }, [sellerSlug]);

    /* ── Follow check ── */
    // FIND:
    /* ── Follow check ── */
    useEffect(() => {
        if (!resolvedUid) return; 
        const check = async () => {
            try {
                const q = query(
                    collection(db, "follows"),
                    where("lecturerId", "==", resolvedUid)
                );
                const snap = await getDocs(q);
                setFollowers(snap.size);
            } catch (err) {
                try {
                    const sd = await getDoc(doc(db, "sellers", resolvedUid));
                    if (sd.exists()) {
                        setFollowers(sd.data().followersCount || 0);
                    }
                } catch {
                    setFollowers(0);
                }
            }

            if (user) {
                try {
                    const fd = await getDoc(
                        doc(db, "follows", `${user.uid}_${resolvedUid}`)
                    );
                    setFollowing(fd.exists());
                } catch {
                    setFollowing(false);
                }
            }
        };

        check();
    }, [resolvedUid, user]); 

    /* ── Toggle follow ── */
    const toggleFollow = async () => {
        if (!user) {
            router.push(
                `/auth/signup?redirect=${encodeURIComponent(window.location.pathname)}`
            );
            return;
        }
        if (followLoading) return;
        setFollowLoad(true);
        const followRef = doc(db, "follows", `${user.uid}_${resolvedUid}`);
        const sellerRef = doc(db, "sellers", resolvedUid);
        try {
            if (isFollowing) {
                await deleteDoc(followRef);
                try {
                    await updateDoc(sellerRef, { followersCount: increment(-1) });
                } catch { }
                setFollowing(false);
                setFollowers((p) => Math.max(0, p - 1));
            } else {
                await setDoc(followRef, {
                    followerId: user.uid,
                    lecturerId: resolvedUid,
                    lecturerName: seller?.sellerName || "",
                    createdAt: serverTimestamp(),
                });
                try {
                    await updateDoc(sellerRef, { followersCount: increment(1) });
                } catch {
                    await setDoc(
                        sellerRef,
                        { followersCount: 1 },
                        { merge: true }
                    );
                }
                setFollowing(true);
                setFollowers((p) => p + 1);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setFollowLoad(false);
        }
    };

    /* ── Fetch profile data ── */
    useEffect(() => {
        if (!resolvedUid) {
            return;
        }
        setLoading(true);

        const timeoutId = setTimeout(() => {
            setSeller(null);
            setLoading(false);
        }, 12000);

        const fetchSellerData = async () => {
            try {
                let sellerName = "Unknown",
                    sellerTitle = "",
                    sellerDept = "",
                    sellerUni = "",
                    sellerCountry = "";

                const sd = await getDoc(doc(db, "sellers", resolvedUid));
                if (sd.exists()) {
                    const d = sd.data();
                    sellerName = d.sellerName || d.displayName || sellerName;
                    sellerTitle = d.title || "";
                    sellerDept = d.department || "";
                    sellerUni = d.university || "";
                    sellerCountry = d.country || "";
                }

                const ud = await getDoc(doc(db, "users", resolvedUid));
                if (ud.exists()) {
                    const u = ud.data();
                    setUserData(u);
                    if (!sellerName || sellerName === "Unknown")
                        sellerName =
                            u.displayName ||
                            `${u.firstName || ""} ${u.surname || ""}`.trim() ||
                            sellerName;
                    setSellerPhoto(
                        u.photoBase64 || u.photoURL || u.profilePicture || null
                    );
                    if (!sellerDept) sellerDept = u.department || "";
                    if (!sellerUni) sellerUni = u.university || "";
                    if (!sellerCountry) sellerCountry = u.country || "";
                    sellerTitle = sellerTitle || u.title || "";
                }

                /* Books */
                const snap1 = await getDocs(
                    query(
                        collection(db, "advertMyBook"),
                        where("userId", "==", resolvedUid)
                    )
                );
                const snap2 = await getDocs(
                    query(
                        collection(db, "advertMyBook"),
                        where("sellerId", "==", resolvedUid)
                    )
                );
                const seenIds = new Set();
                const books = [];
                const processSnap = (snap) => {
                    snap.forEach((ds) => {
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

                /* Purchased */
                const cu = auth.currentUser;
                if (cu) {
                    const md = await getDoc(doc(db, "users", cu.uid));
                    if (md.exists()) {
                        const ids = new Set();
                        Object.values(md.data().purchasedBooks || {}).forEach((p) => {
                            const id = p.bookId || p.id || p.firestoreId;
                            if (id) {
                                ids.add(id);
                                ids.add(`firestore-${id}`);
                            }
                        });
                        setPurchased(ids);
                    }
                }

                setSeller({
                    sellerId: resolvedUid,
                    sellerName,
                    sellerTitle,
                    sellerDept,
                    sellerUni,
                    sellerCountry,
                });
                setSellerBooks(books);
                setFiltered(books);
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
    }, [resolvedUid]);

    /* ── Filter ── */
    useEffect(() => {
        const q = searchQuery.toLowerCase();
        setFiltered(
            sellerBooks.filter((b) => {
                const ms =
                    !q ||
                    b.title?.toLowerCase().includes(q) ||
                    b.category?.toLowerCase().includes(q);
                const mc =
                    selectedCategory === "all" || b.category === selectedCategory;
                return ms && mc;
            })
        );
    }, [searchQuery, selectedCategory, sellerBooks]);

    /* ── Derived ── */
    const categories = [
        { value: "all", label: "All" },
        ...Array.from(new Set(sellerBooks.map((b) => b.category)))
            .filter(Boolean)
            .map((c) => ({
                value: c,
                label: c.charAt(0).toUpperCase() + c.slice(1),
            })),
    ];
    const isPurchased = (id) =>
        purchasedBookIds.has(id) || purchasedBookIds.has(String(id));

    const lecturerMode = seller
        ? userData?.isLecturer ||
        userData?.role === "lecturer" ||
        ["lecturer", "dr.", "prof.", "professor", "mrs", "mr"].includes(
            (seller.sellerTitle || "").toLowerCase()
        )
        : false;

    const displayTitle = seller
        ? lecturerMode
            ? `${seller.sellerTitle} ${seller.sellerName}`.trim()
            : seller.sellerName
        : "Profile";

    const countryDisplay = getCountryDisplay(seller?.sellerCountry);
    const sellerLastName = seller?.sellerName?.split(" ").slice(-1)[0] || "";
    const sellerFirstName = seller?.sellerName?.split(" ")[0] || "";

    /* ── Sidebar About Card ── */
    const AboutInfoCard = () => {
        const lecturerRows = [
            {
                label: "Title",
                value: seller?.sellerTitle,
                Icon: GraduationCap,
            },
            { label: "Department", value: seller?.sellerDept, Icon: BookMarked },
            { label: "University", value: seller?.sellerUni, Icon: Building2 },
            { label: "Country", value: countryDisplay, Icon: Globe },
        ];
        const sellerRows = [
            { label: "Department", value: seller?.sellerDept, Icon: BookMarked },
            { label: "University", value: seller?.sellerUni, Icon: Building2 },
            { label: "Country", value: countryDisplay, Icon: Globe },
        ];
        const rows = lecturerMode ? lecturerRows : sellerRows;
        const header = lecturerMode
            ? `About ${seller?.sellerTitle || ""} ${sellerLastName}`.trim()
            : `About ${sellerFirstName || "the Seller"}`;

        return (
            <div
                style={{
                    background: "#fff",
                    border: "0.5px solid #e5ddd0",
                    padding: "24px",
                }}
            >
                <p
                    style={{
                        fontSize: "10px",
                        fontWeight: 700,
                        letterSpacing: ".18em",
                        textTransform: "uppercase",
                        color: GOLD,
                        marginBottom: "14px",
                        fontFamily: "'Lato',sans-serif",
                    }}
                >
                    {header}
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    {rows
                        .filter((r) => r.value)
                        .map(({ label, value, Icon }) => (
                            <div
                                key={label}
                                style={{ display: "flex", alignItems: "center", gap: "10px" }}
                            >
                                <Icon size={14} style={{ color: GOLD, flexShrink: 0 }} />
                                <span
                                    style={{
                                        fontSize: "13px",
                                        color: "#666",
                                        fontFamily: "'Lato',sans-serif",
                                    }}
                                >
                                    {value}
                                </span>
                            </div>
                        ))}
                    {rows.every((r) => !r.value) && (
                        <p
                            style={{
                                fontSize: "12px",
                                color: "#bbb",
                                fontFamily: "'Lato',sans-serif",
                            }}
                        >
                            No additional info provided.
                        </p>
                    )}
                </div>
            </div>
        );
    };

    /* ── Stats Card ── */
    const StatsCard = () => (
        <div
            style={{
                background: "#fff",
                border: "0.5px solid #e5ddd0",
                padding: "24px",
            }}
        >
            <p
                style={{
                    fontSize: "10px",
                    fontWeight: 700,
                    letterSpacing: ".18em",
                    textTransform: "uppercase",
                    color: GOLD,
                    marginBottom: "14px",
                    fontFamily: "'Lato',sans-serif",
                }}
            >
                Stats
            </p>
            <div style={{ display: "flex", flexDirection: "column" }}>
                {[
                    { label: "Total Materials", value: sellerBooks.length, Icon: BookOpen },
                    { label: "Followers", value: followerCount, Icon: Users },
                ].map(({ label, value, Icon }) => (
                    <div
                        key={label}
                        className="stat-row"
                        style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            padding: "10px 0",
                            gap: "8px",
                        }}
                    >
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                                fontSize: "13px",
                                color: "#666",
                                fontFamily: "'Lato',sans-serif",
                                minWidth: 0,
                                overflow: "hidden",
                            }}
                        >
                            <Icon size={13} style={{ color: GOLD, flexShrink: 0 }} />
                            <span
                                style={{
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    whiteSpace: "nowrap",
                                }}
                            >
                                {label}
                            </span>
                        </div>
                        <span
                            style={{
                                fontFamily: "'Playfair Display',serif",
                                fontWeight: 700,
                                color: NAVY,
                                fontSize: "14px",
                                flexShrink: 0,
                            }}
                        >
                            {value}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );

    /* ── Guest CTA Banner ── */
    const GuestBanner = () => {
        if (!authReady || user) return null;
        const copy = lecturerMode
            ? "Are you a student at this institution? Create a free student account to follow your lecturers and get notified when new materials drop."
            : "Never miss an academic update. Create a free student account to follow this creator and instantly access their latest summaries, study guides, and resources.";

        return (
            <div
                style={{
                    background: NAVY,
                    border: "1px solid rgba(184,150,62,.25)",
                    padding: "24px",
                    marginTop: "8px",
                    backgroundImage:
                        "radial-gradient(rgba(184,150,62,.07) 1px,transparent 1px)",
                    backgroundSize: "22px 22px",
                }}
            >
                <div
                    style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: "14px",
                        flexWrap: "wrap",
                    }}
                >
                    <div style={{ flex: "1 1 220px" }}>
                        <div
                            style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "6px",
                                background: "rgba(184,150,62,.12)",
                                border: "1px solid rgba(184,150,62,.25)",
                                borderRadius: "999px",
                                padding: "3px 10px",
                                marginBottom: "10px",
                            }}
                        >
                            <Sparkles size={9} style={{ color: GOLD }} />
                            <span
                                style={{
                                    fontSize: "9px",
                                    fontWeight: 700,
                                    letterSpacing: ".14em",
                                    textTransform: "uppercase",
                                    color: GOLDD,
                                    fontFamily: "'Lato',sans-serif",
                                }}
                            >
                                {lecturerMode ? "For Students" : "Stay Updated"}
                            </span>
                        </div>
                        <p
                            style={{
                                fontSize: "13px",
                                color: "rgba(245,240,232,.85)",
                                fontFamily: "'Lato',sans-serif",
                                lineHeight: 1.7,
                            }}
                        >
                            {copy}
                        </p>
                    </div>
                    <div style={{ flexShrink: 0, alignSelf: "center" }}>
                        <Link
                            href="/auth/signup"
                            style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "7px",
                                padding: "11px 22px",
                                background: GOLD,
                                color: NAVY,
                                fontSize: "12px",
                                fontWeight: 700,
                                letterSpacing: ".06em",
                                textTransform: "uppercase",
                                fontFamily: "'Lato',sans-serif",
                                textDecoration: "none",
                                whiteSpace: "nowrap",
                            }}
                        >
                            <UserPlus size={13} /> Create Free Account
                        </Link>
                    </div>
                </div>
            </div>
        );
    };

    /* ════════════════════════════════════════════════════════
       LOADING STATE — show skeleton while anything is pending
    ════════════════════════════════════════════════════════ */
    if (slugResolving || loading) {
        return (
            <div className="lan-root" style={{ minHeight: "100vh" }}>
                <GlobalStyles />
                <div
                    style={{
                        background: NAVY,
                        height: "240px",
                        backgroundImage:
                            "radial-gradient(rgba(184,150,62,.07) 1px,transparent 1px)",
                        backgroundSize: "28px 28px",
                    }}
                />
                <div
                    style={{
                        maxWidth: "1100px",
                        margin: "0 auto",
                        padding: "24px 16px",
                    }}
                >
                    {[1, 2].map((i) => (
                        <div
                            key={i}
                            style={{
                                background: "#fff",
                                border: "0.5px solid #e5ddd0",
                                padding: "24px",
                                marginBottom: "16px",
                            }}
                        >
                            {[80, 60, 40].map((w) => (
                                <div
                                    key={w}
                                    style={{
                                        height: "12px",
                                        background: "#f0ebe0",
                                        marginBottom: "12px",
                                        width: `${w}%`,
                                        animation: "pulse 1.5s infinite",
                                    }}
                                />
                            ))}
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    /* ════════════════════════════════════════════════════════
       PROFILE NOT FOUND — only shown after everything resolves
    ════════════════════════════════════════════════════════ */
    if (!seller) {
        return (
            <div className="lan-root" style={{ minHeight: "100vh" }}>
                <GlobalStyles />
                <div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: "80px 24px",
                        textAlign: "center",
                    }}
                >
                    <div
                        style={{
                            width: "64px",
                            height: "64px",
                            border: "2px solid #e5ddd0",
                            transform: "rotate(45deg)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            margin: "0 auto 20px",
                        }}
                    >
                        <BookOpen
                            size={24}
                            style={{ color: "#e5ddd0", transform: "rotate(-45deg)" }}
                        />
                    </div>
                    <h2
                        className="lan-serif"
                        style={{ fontSize: "24px", color: NAVY, marginBottom: "8px" }}
                    >
                        Profile Not Found
                    </h2>
                    <p
                        style={{
                            fontSize: "13px",
                            color: "#aaa",
                            fontFamily: "'Lato',sans-serif",
                            marginBottom: "20px",
                            maxWidth: "320px",
                            lineHeight: 1.7,
                        }}
                    >
                        This profile doesn't exist or the link may be incorrect.
                    </p>
                    <div
                        style={{
                            display: "flex",
                            gap: "10px",
                            flexWrap: "wrap",
                            justifyContent: "center",
                        }}
                    >
                        <button
                            onClick={() => router.back()}
                            style={{
                                background: "transparent",
                                color: NAVY,
                                padding: "10px 20px",
                                border: `0.5px solid ${NAVY}`,
                                cursor: "pointer",
                                fontSize: "12px",
                                fontWeight: 700,
                                letterSpacing: ".06em",
                                textTransform: "uppercase",
                                fontFamily: "'Lato',sans-serif",
                                display: "flex",
                                alignItems: "center",
                                gap: "6px",
                            }}
                        >
                            <ArrowLeft size={12} /> Go Back
                        </button>
                        <button
                            onClick={() => router.push("/lecturers")}
                            style={{
                                background: NAVY,
                                color: "#fff",
                                padding: "10px 20px",
                                border: "none",
                                cursor: "pointer",
                                fontSize: "12px",
                                fontWeight: 700,
                                letterSpacing: ".06em",
                                textTransform: "uppercase",
                                fontFamily: "'Lato',sans-serif",
                                display: "flex",
                                alignItems: "center",
                                gap: "6px",
                            }}
                        >
                            <Users size={12} /> Browse Educators
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    /* ════════════════════════════════════════════════════════
       MAIN RENDER — seller is guaranteed non-null from here
    ════════════════════════════════════════════════════════ */
    return (
        <div className="lan-root" style={{ minHeight: "100vh" }}>
            <GlobalStyles />

            {/* ── STICKY BACK BAR ── */}
            <div
                style={{
                    background: "#fff",
                    borderBottom: "0.5px solid #e5ddd0",
                    position: "sticky",
                    top: 0,
                    zIndex: 40,
                }}
            >
                <div
                    style={{
                        maxWidth: "1100px",
                        margin: "0 auto",
                        padding: "0 16px",
                        height: "48px",
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                    }}
                >
                    <button
                        onClick={() => router.back()}
                        style={{
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            color: "#888",
                            display: "flex",
                            alignItems: "center",
                            flexShrink: 0,
                        }}
                    >
                        <ArrowLeft size={18} />
                    </button>
                    <div style={{ minWidth: 0, flex: 1 }}>
                        <p
                            style={{
                                fontSize: "13px",
                                fontWeight: 700,
                                color: NAVY,
                                margin: 0,
                                fontFamily: "'Playfair Display',serif",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                            }}
                        >
                            {displayTitle}
                        </p>
                        <p
                            style={{
                                fontSize: "10px",
                                color: "#aaa",
                                margin: 0,
                                fontFamily: "'Lato',sans-serif",
                            }}
                        >
                            {sellerBooks.length} materials · {followerCount} followers
                        </p>
                    </div>
                </div>
            </div>

            {/* ══ PROFILE HERO ══ */}
            <div
                style={{
                    backgroundColor: NAVY,
                    backgroundImage:
                        "radial-gradient(rgba(184,150,62,.07) 1px,transparent 1px)," +
                        "radial-gradient(rgba(255,255,255,.03) 1px,transparent 1px)",
                    backgroundSize: "28px 28px, 14px 14px",
                    backgroundPosition: "0 0, 7px 7px",
                    position: "relative",
                    overflow: "hidden",
                }}
            >
                {/* LAN watermark */}
                <div
                    style={{
                        position: "absolute",
                        bottom: "-10px",
                        right: "20px",
                        fontSize: "100px",
                        fontFamily: "'Playfair Display',serif",
                        fontWeight: 900,
                        color: "rgba(255,255,255,.04)",
                        pointerEvents: "none",
                        userSelect: "none",
                    }}
                >
                    LAN
                </div>

                {/* ── Role badge ── */}
                <div
                    style={{
                        position: "absolute",
                        top: "16px",
                        left: "16px",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "7px",
                        background: "rgba(184,150,62,.14)",
                        border: "1px solid rgba(184,150,62,.3)",
                        borderRadius: "999px",
                        padding: "6px 12px",
                    }}
                >
                    <GraduationCap size={11} style={{ color: GOLD }} />
                    <span
                        style={{
                            fontSize: "10px",
                            fontWeight: 700,
                            letterSpacing: ".14em",
                            textTransform: "uppercase",
                            color: GOLDD,
                            fontFamily: "'Lato',sans-serif",
                        }}
                    >
                        {lecturerMode ? "ACADEMIC EDUCATOR" : "INDEPENDENT CREATOR"}
                    </span>
                </div>

                <div
                    style={{
                        maxWidth: "1100px",
                        margin: "0 auto",
                        padding: "60px 24px 0",
                    }}
                >
                    {/* ── Avatar + name row ── */}
                    {/* ── Avatar + name row ── */}
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "20px",
                            flexWrap: "wrap",
                            paddingBottom: "28px",
                        }}
                    >
                        {/* Avatar */}
                        <div
                            style={{
                                width: lecturerMode ? "100px" : "88px",
                                height: lecturerMode ? "100px" : "88px",
                                flexShrink: 0,
                            }}
                        >
                            {sellerPhoto ? (
                                <img
                                    src={sellerPhoto}
                                    alt={seller.sellerName}
                                    style={{
                                        width: "100%",
                                        height: "100%",
                                        borderRadius: "50%",
                                        objectFit: "cover",
                                        border: `3px solid ${GOLD}`,
                                        display: "block",
                                    }}
                                />
                            ) : (
                                <div
                                    style={{
                                        width: "100%",
                                        height: "100%",
                                        borderRadius: "50%",
                                        border: `3px solid ${GOLD}`,
                                        background: "rgba(255,255,255,.08)",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                    }}
                                >
                                    {lecturerMode ? (
                                        <GraduationCap size={36} style={{ color: GOLD }} />
                                    ) : (
                                        <span
                                            style={{
                                                color: GOLD,
                                                fontSize: "30px",
                                                fontFamily: "'Playfair Display',serif",
                                                fontWeight: 900,
                                            }}
                                        >
                                            {seller.sellerName?.charAt(0)?.toUpperCase() || "?"}
                                        </span>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Name + follow */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                            {lecturerMode && seller.sellerTitle && (
                                <p
                                    style={{
                                        fontSize: "10px",
                                        fontWeight: 700,
                                        letterSpacing: ".18em",
                                        textTransform: "uppercase",
                                        color: GOLDD,
                                        fontFamily: "'Lato',sans-serif",
                                        margin: "0 0 4px",
                                    }}
                                >
                                    {seller.sellerTitle}
                                </p>
                            )}
                            <h1
                                className="lan-serif anim-2 hero-name"
                                style={{
                                    fontSize: "clamp(18px,5vw,36px)",
                                    fontWeight: 900,
                                    color: "#fff",
                                    margin: "0 0 4px",
                                    lineHeight: 1.1,
                                    wordBreak: "break-word",
                                }}
                            >
                                {seller.sellerName}
                            </h1>
                            <p
                                style={{
                                    fontSize: "12px",
                                    color: "rgba(245,240,232,.6)",
                                    fontFamily: "'Lato',sans-serif",
                                    fontWeight: 300,
                                    margin: "0 0 12px",
                                }}
                            >
                                {sellerBooks.length} materials · {followerCount} followers
                            </p>
                            {/* Follow button — sits under name for clean flow */}
                            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                <button
                                    onClick={toggleFollow}
                                    disabled={followLoading}
                                    className="follow-btn"
                                    style={{
                                        padding: "8px 18px",
                                        fontSize: "11px",
                                    }}
                                >
                                    {isFollowing ? (
                                        <UserCheck size={12} />
                                    ) : (
                                        <UserPlus size={12} />
                                    )}
                                    {isFollowing ? "Following" : "Follow"}
                                </button>
                                {!user && authReady && (
                                    <p
                                        style={{
                                            fontSize: "10px",
                                            color: "rgba(184,150,62,.7)",
                                            fontFamily: "'Lato',sans-serif",
                                            letterSpacing: ".04em",
                                            margin: 0,
                                        }}
                                    >
                                        Sign in required
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* ── Metrics counter strip ── */}
                    <div
                        style={{
                            borderTop: "0.5px solid rgba(184,150,62,.15)",
                            display: "grid",
                            gridTemplateColumns: "repeat(auto-fit, minmax(80px, 1fr))",
                            marginTop: "28px",
                        }}
                    >
                        {[
                            { val: sellerBooks.length, label: "Materials" },
                            { val: followerCount, label: "Followers" },
                        ].map(({ val, label }) => (
                            <div
                                key={label}
                                style={{
                                    padding: "16px 20px 0",
                                    borderRight: "0.5px solid rgba(184,150,62,.1)",
                                    textAlign: "left",
                                }}
                            >
                                <div
                                    className="lan-serif"
                                    style={{
                                        fontSize: "22px",
                                        fontWeight: 700,
                                        color: "#fff",
                                    }}
                                >
                                    {val}
                                </div>
                                <div
                                    style={{
                                        fontSize: "10px",
                                        fontWeight: 700,
                                        letterSpacing: ".1em",
                                        textTransform: "uppercase",
                                        color: "rgba(184,150,62,.7)",
                                        marginTop: "2px",
                                        fontFamily: "'Lato',sans-serif",
                                    }}
                                >
                                    {label}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Tabs */}
                    <div
                        className="sbar-none"
                        style={{
                            display: "flex",
                            marginTop: "20px",
                            borderTop: "0.5px solid rgba(184,150,62,.15)",
                            paddingTop: "4px",
                            overflowX: "auto",
                        }}
                    >
                        {[
                            { id: "materials", label: lecturerMode ? "Materials" : "Books" },
                            { id: "about", label: "About" },
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`lan-tab ${activeTab === tab.id
                                        ? "lan-tab-active"
                                        : "lan-tab-inactive"
                                    }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* ══ CONTENT AREA ══ */}
            <div
                style={{
                    maxWidth: "1100px",
                    margin: "0 auto",
                    padding: "32px 24px 80px",
                }}
            >
                {/* ── MATERIALS TAB ── */}
                {activeTab === "materials" && (
                    <div className="profile-content-grid">
                        {/* Sidebar — desktop */}
                        <div className="sidebar-desktop">
                            <AboutInfoCard />
                            <StatsCard />
                        </div>

                        {/* Main feed */}
                        <div style={{ display: "flex", flexDirection: "column", gap: "16px", minWidth: 0 }}>
                            {/* Sidebar — mobile */}
                            <div className="sidebar-mobile">
                                <AboutInfoCard />
                                <StatsCard />
                            </div>

                            {/* Search / filter bar */}
                            <div
                                style={{
                                    background: "#fff",
                                    border: "0.5px solid #e5ddd0",
                                    padding: "14px 16px",
                                }}
                            >
                                <div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
                                    <div style={{ flex: 1, position: "relative" }}>
                                        <Search
                                            size={13}
                                            style={{
                                                position: "absolute",
                                                left: "12px",
                                                top: "50%",
                                                transform: "translateY(-50%)",
                                                color: "#bbb",
                                            }}
                                        />
                                        <input
                                            type="text"
                                            placeholder="Search materials…"
                                            value={searchQuery}
                                            onChange={(e) => setSearch(e.target.value)}
                                            className="search-input"
                                        />
                                        {searchQuery && (
                                            <button
                                                onClick={() => setSearch("")}
                                                style={{
                                                    position: "absolute",
                                                    right: "10px",
                                                    top: "50%",
                                                    transform: "translateY(-50%)",
                                                    background: "none",
                                                    border: "none",
                                                    cursor: "pointer",
                                                    color: "#aaa",
                                                }}
                                            >
                                                <X size={13} />
                                            </button>
                                        )}
                                    </div>
                                    <div style={{ display: "flex" }}>
                                        <button
                                            onClick={() => setView("grid")}
                                            className={`view-btn ${view === "grid" ? "active" : ""}`}
                                        >
                                            <Grid3X3 size={14} />
                                        </button>
                                        <button
                                            onClick={() => setView("list")}
                                            className={`view-btn ${view === "list" ? "active" : ""}`}
                                        >
                                            <LayoutList size={14} />
                                        </button>
                                    </div>
                                </div>
                                <div
                                    className="sbar-none"
                                    style={{
                                        display: "flex",
                                        gap: "6px",
                                        overflowX: "auto",
                                        paddingBottom: "2px",
                                    }}
                                >
                                    {categories.map((cat) => (
                                        <button
                                            key={cat.value}
                                            onClick={() => setCategory(cat.value)}
                                            className={`cat-pill${selectedCategory === cat.value ? " active" : ""
                                                }`}
                                        >
                                            {cat.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Book results */}
                            <div
                                style={{
                                    background: "#fff",
                                    border: "0.5px solid #e5ddd0",
                                    padding: "16px",
                                    minWidth: 0,
                                    overflow: "hidden",
                                }}
                            >
                                <p
                                    style={{
                                        fontSize: "10px",
                                        color: "#aaa",
                                        marginBottom: "16px",
                                        fontFamily: "'Lato',sans-serif",
                                        fontWeight: 700,
                                        letterSpacing: ".08em",
                                        textTransform: "uppercase",
                                    }}
                                >
                                    {filteredBooks.length} result
                                    {filteredBooks.length !== 1 ? "s" : ""}
                                </p>

                                {filteredBooks.length === 0 ? (
                                    <div
                                        style={{
                                            textAlign: "center",
                                            padding: "48px 16px",
                                        }}
                                    >
                                        <div
                                            style={{
                                                width: "56px",
                                                height: "56px",
                                                border: "2px solid #e5ddd0",
                                                transform: "rotate(45deg)",
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                margin: "0 auto 16px",
                                            }}
                                        >
                                            <BookOpen
                                                size={20}
                                                style={{
                                                    color: "#e5ddd0",
                                                    transform: "rotate(-45deg)",
                                                }}
                                            />
                                        </div>
                                        <h3
                                            className="lan-serif"
                                            style={{
                                                fontSize: "18px",
                                                color: NAVY,
                                                marginBottom: "6px",
                                            }}
                                        >
                                            No results
                                        </h3>
                                        <p
                                            style={{
                                                fontSize: "12px",
                                                color: "#bbb",
                                                fontFamily: "'Lato',sans-serif",
                                            }}
                                        >
                                            {searchQuery || selectedCategory !== "all"
                                                ? "Clear your filters to see all materials."
                                                : "No materials uploaded yet."}
                                        </p>
                                        {(searchQuery || selectedCategory !== "all") && (
                                            <button
                                                onClick={() => {
                                                    setSearch("");
                                                    setCategory("all");
                                                }}
                                                style={{
                                                    marginTop: "12px",
                                                    background: "none",
                                                    border: `0.5px solid ${NAVY}`,
                                                    color: NAVY,
                                                    padding: "7px 18px",
                                                    cursor: "pointer",
                                                    fontSize: "11px",
                                                    fontWeight: 700,
                                                    letterSpacing: ".06em",
                                                    textTransform: "uppercase",
                                                    fontFamily: "'Lato',sans-serif",
                                                }}
                                            >
                                                Clear filters
                                            </button>
                                        )}
                                    </div>
                                ) : view === "list" ? (
                                    <div
                                        style={{
                                            display: "flex",
                                            flexDirection: "column",
                                            gap: "8px",
                                        }}
                                    >
                                        {filteredBooks.map((book) => (
                                            <BookCard
                                                key={book.id}
                                                book={book}
                                                isPurchased={isPurchased}
                                                view="list"
                                                user={user}
                                                router={router}
                                            />
                                        ))}
                                    </div>
                                ) : (
                                    <div className="books-grid">
                                        {filteredBooks.map((book) => (
                                            <BookCard
                                                key={book.id}
                                                book={book}
                                                isPurchased={isPurchased}
                                                view="grid"
                                                user={user}
                                                router={router}
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Guest banner */}
                            <GuestBanner />
                        </div>
                    </div>
                )}

                {/* ── ABOUT TAB ── */}
                {activeTab === "about" && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                        {/* Detailed about rows */}
                        <div
                            style={{
                                background: "#fff",
                                border: "0.5px solid #e5ddd0",
                                padding: "24px 20px",
                            }}
                        >
                            <p
                                style={{
                                    fontSize: "10px",
                                    fontWeight: 700,
                                    letterSpacing: ".18em",
                                    textTransform: "uppercase",
                                    color: GOLD,
                                    marginBottom: "20px",
                                    fontFamily: "'Lato',sans-serif",
                                }}
                            >
                                {lecturerMode
                                    ? `About ${seller.sellerTitle || ""} ${sellerLastName}`.trim()
                                    : `About ${sellerFirstName || "the Seller"}`}
                            </p>
                            <div style={{ display: "flex", flexDirection: "column" }}>
                                {(lecturerMode
                                    ? [
                                        {
                                            label: "Title",
                                            value: seller.sellerTitle,
                                            Icon: GraduationCap,
                                        },
                                        {
                                            label: "Department",
                                            value: seller.sellerDept,
                                            Icon: BookMarked,
                                        },
                                        {
                                            label: "University",
                                            value: seller.sellerUni,
                                            Icon: Building2,
                                        },
                                        { label: "Country", value: countryDisplay, Icon: Globe },
                                    ]
                                    : [
                                        {
                                            label: "Department",
                                            value: seller.sellerDept,
                                            Icon: BookMarked,
                                        },
                                        {
                                            label: "University",
                                            value: seller.sellerUni,
                                            Icon: Building2,
                                        },
                                        { label: "Country", value: countryDisplay, Icon: Globe },
                                    ]
                                )
                                    .filter((r) => r.value)
                                    .map(({ label, value, Icon }) => (
                                        <div
                                            key={label}
                                            style={{
                                                display: "flex",
                                                alignItems: "flex-start",
                                                gap: "14px",
                                                padding: "18px 0",
                                                borderBottom: "0.5px solid #f0ebe0",
                                            }}
                                        >
                                            <Icon
                                                size={16}
                                                style={{
                                                    color: GOLD,
                                                    flexShrink: 0,
                                                    marginTop: "2px",
                                                }}
                                            />
                                            <div>
                                                <p
                                                    style={{
                                                        fontSize: "9px",
                                                        fontWeight: 700,
                                                        letterSpacing: ".18em",
                                                        textTransform: "uppercase",
                                                        color: "#aaa",
                                                        margin: "0 0 4px",
                                                        fontFamily: "'Lato',sans-serif",
                                                    }}
                                                >
                                                    {label}
                                                </p>
                                                <p
                                                    style={{
                                                        fontFamily: "'Playfair Display',serif",
                                                        fontWeight: 700,
                                                        fontSize: "15px",
                                                        color: NAVY,
                                                        wordBreak: "break-word",
                                                    }}
                                                >
                                                    {value}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                {!seller.sellerDept &&
                                    !seller.sellerUni &&
                                    !seller.sellerTitle &&
                                    !countryDisplay && (
                                        <p
                                            style={{
                                                fontSize: "13px",
                                                color: "#bbb",
                                                fontFamily: "'Lato',sans-serif",
                                            }}
                                        >
                                            No profile information added yet.
                                        </p>
                                    )}
                            </div>
                        </div>

                        {/* Stats */}
                        <div
                            style={{
                                background: "#fff",
                                border: "0.5px solid #e5ddd0",
                                padding: "24px 20px",
                            }}
                        >
                            <p
                                style={{
                                    fontSize: "10px",
                                    fontWeight: 700,
                                    letterSpacing: ".18em",
                                    textTransform: "uppercase",
                                    color: GOLD,
                                    marginBottom: "14px",
                                    fontFamily: "'Lato',sans-serif",
                                }}
                            >
                                Stats
                            </p>
                            <div style={{ display: "flex", flexDirection: "column" }}>
                                {[
                                    {
                                        label: "Total Materials",
                                        value: sellerBooks.length,
                                        Icon: BookOpen,
                                    },
                                    { label: "Followers", value: followerCount, Icon: Users },
                                ].map(({ label, value, Icon }) => (
                                    <div
                                        key={label}
                                        className="stat-row"
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "space-between",
                                            padding: "10px 0",
                                            gap: "8px",
                                        }}
                                    >
                                        <div
                                            style={{
                                                display: "flex",
                                                alignItems: "center",
                                                gap: "8px",
                                                fontSize: "13px",
                                                color: "#666",
                                                fontFamily: "'Lato',sans-serif",
                                                minWidth: 0,
                                                overflow: "hidden",
                                            }}
                                        >
                                            <Icon size={13} style={{ color: GOLD, flexShrink: 0 }} />
                                            <span
                                                style={{
                                                    overflow: "hidden",
                                                    textOverflow: "ellipsis",
                                                    whiteSpace: "nowrap",
                                                }}
                                            >
                                                {label}
                                            </span>
                                        </div>
                                        <span
                                            style={{
                                                fontFamily: "'Playfair Display',serif",
                                                fontWeight: 700,
                                                color: NAVY,
                                                fontSize: "14px",
                                                flexShrink: 0,
                                            }}
                                        >
                                            {value}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Guest banner */}
                        <GuestBanner />
                    </div>
                )}
            </div>
        </div>
    );
}