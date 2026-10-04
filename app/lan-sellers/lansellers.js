"use client";

import React, { useState, useEffect, useRef } from "react";
import {
    collection,
    getDocs,
    query,
    addDoc,
    serverTimestamp,
    doc,
    getDoc,
    where,
    orderBy,
    limit,
    startAfter,
} from "firebase/firestore";
import { db, auth } from "@/lib/firebaseConfig";
import Navbar from "@/components/NavBar";
import {
    MapPin,
    Loader2,
    Search,
    Store,
    X,
    Flag,
    ChevronRight,
    Shield,
    CheckCircle,
    Users,
    Globe,
    ArrowRight,
    Network,
    ShoppingBag,
} from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { onAuthStateChanged } from "firebase/auth";

/* ─── Design tokens (same as profile page) ─── */
const NAVY = "#0d2244";
const GOLD = "#b8963e";
const GOLDD = "#d4aa5a";
const CREAM = "#f5f0e8";
const BG = "#f5f1ea";
const LINE = "#e5ddd0";

/* ─── Helpers ─── */
const getInitials = (n = "?") => {
    const parts = (n || "?").trim().split(" ").filter(Boolean);
    if (!parts.length) return "?";
    if (parts.length === 1) return parts[0][0].toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const makeSlug = (title, firstName, surname) =>
    [title, firstName, surname]
        .filter(Boolean)
        .join(" ")
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-");

const REPORT_REASONS = [
    { label: "Fraudulent Behaviour", icon: "🚨" },
    { label: "Poor Customer Service", icon: "😤" },
    { label: "Fake Documents", icon: "📄" },
    { label: "Incorrect Pricing", icon: "💸" },
    { label: "Spam or Scam", icon: "⚠️" },
    { label: "Impersonation", icon: "🎭" },
    { label: "Other", icon: "📝" },
];

/* ════════════════════════════════════════════════════════
   SELLER ROW — modelled on the Facebook friends list
════════════════════════════════════════════════════════ */
function SellerRow({ seller, onReport, onView }) {
    const displayName =
        seller.sellerName ||
        seller.businessInfo?.businessName ||
        seller.bankDetails?.accountName ||
        "Unknown Seller";

    const location =
        seller.businessInfo?.state || seller.businessInfo?.country || "Nigeria";

    const shop = seller.businessInfo?.businessName;
    const photo = seller.photoBase64 || seller.photoURL || seller.profilePicture || null;
    const verified = seller.isVerifiedSeller === true;
    const booksSold = seller.booksSold || 0;

    const [imgErr, setImgErr] = useState(false);
    useEffect(() => setImgErr(false), [seller.uid]);
    const showPhoto = !!photo && !imgErr;

    return (
        <div className="seller-row">
            <button
                className="seller-avatar"
                onClick={onView}
                aria-label={`Open ${displayName}'s profile`}
            >
                {showPhoto ? (
                    <img
                        src={photo}
                        alt=""
                        onError={() => setImgErr(true)}
                        style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top center", display: "block" }}
                    />
                ) : (
                    <span
                        style={{
                            color: GOLD,
                            fontSize: 28,
                            fontWeight: 900,
                            fontFamily: "'Playfair Display',serif",
                        }}
                    >
                        {getInitials(displayName)}
                    </span>
                )}
            </button>

            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
                    <button onClick={onView} className="seller-name">
                        {displayName}
                    </button>
                    {verified && (
                        <Shield size={13} style={{ color: GOLD, flexShrink: 0 }} aria-label="Verified" />
                    )}
                </div>

                <p className="seller-sub">
                    <MapPin size={11} style={{ color: GOLD, flexShrink: 0 }} />
                    <span className="ellipsis">{location}</span>
                    {booksSold > 0 && (
                        <>
                            <span style={{ opacity: 0.4 }}>·</span>
                            <ShoppingBag size={10} style={{ flexShrink: 0 }} />
                            <span>{booksSold} sold</span>
                        </>
                    )}
                </p>

                {shop && (
                    <p className="seller-sub" style={{ marginTop: 1 }}>
                        <Store size={11} style={{ color: GOLD, flexShrink: 0 }} />
                        <span className="ellipsis">{shop}</span>
                    </p>
                )}

                <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                    <button onClick={onView} className="btn-gold">
                        View profile
                    </button>
                    <button onClick={onReport} className="btn-grey" aria-label={`Report ${displayName}`}>
                        <Flag size={12} /> Report
                    </button>
                </div>
            </div>
        </div>
    );
}

/* ════════════════════════════════════════════════════════
   REPORT MODAL
════════════════════════════════════════════════════════ */
function ReportModal({ seller, onClose }) {
    const displayName =
        seller.sellerName ||
        seller.businessInfo?.businessName ||
        seller.bankDetails?.accountName ||
        "Unknown Seller";

    const [reason, setReason] = useState("");
    const [details, setDetails] = useState("");
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const [user, setUser] = useState(auth.currentUser);
    const [authReady, setAuthReady] = useState(!!auth.currentUser);
    useEffect(
        () => onAuthStateChanged(auth, (u) => { setUser(u); setAuthReady(true); }),
        []
    );
    const handleSubmit = async () => {
        if (!user || !reason || details.trim().length < 10) return;
        setLoading(true);
        try {
            await addDoc(collection(db, "sellerReports"), {
                sellerId: seller.uid,
                sellerName: displayName,
                sellerSlug: seller.slug || null,
                reason,
                details,
                reportedBy: user?.uid || null,
                reporterEmail: user?.email || null,
                status: "pending",
                createdAt: serverTimestamp(),
            });
            setSuccess(true);
        } catch (e) {
            console.error(e);
            alert("Failed to submit report. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const canSubmit = !!user && !!reason && details.trim().length >= 10 && !loading;
    const label = {
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: ".16em",
        textTransform: "uppercase",
        color: GOLD,
        fontFamily: "'Lato',sans-serif",
    };

    return (
        <div
            onClick={onClose}
            style={{
                position: "fixed",
                inset: 0,
                zIndex: 9999,
                background: "rgba(13,34,68,.6)",
                backdropFilter: "blur(4px)",
                display: "flex",
                alignItems: "flex-end",
                justifyContent: "center",
            }}
        >
            <div
                onClick={(e) => e.stopPropagation()}
                style={{
                    background: "#fff",
                    width: "100%",
                    maxWidth: 500,
                    borderTop: `3px solid ${GOLD}`,
                    borderRadius: "16px 16px 0 0",
                    overflow: "hidden",
                    animation: "slideUp .28s cubic-bezier(.4,0,.2,1) both",
                }}
            >
                <div
                    style={{
                        background: NAVY,
                        padding: "16px 20px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                    }}
                >
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div
                            style={{
                                width: 32,
                                height: 32,
                                background: "rgba(184,150,62,.14)",
                                border: "1px solid rgba(184,150,62,.3)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                            }}
                        >
                            <Flag size={14} style={{ color: GOLDD }} />
                        </div>
                        <p
                            style={{
                                fontFamily: "'Playfair Display',serif",
                                fontSize: 17,
                                fontWeight: 700,
                                color: "#fff",
                                margin: 0,
                            }}
                        >
                            File a complaint
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        aria-label="Close"
                        style={{
                            background: "rgba(255,255,255,.08)",
                            border: "none",
                            borderRadius: "50%",
                            width: 30,
                            height: 30,
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "#fff",
                        }}
                    >
                        <X size={14} />
                    </button>
                </div>

                <div style={{ padding: 20, maxHeight: "70vh", overflowY: "auto" }}>
                    {success ? (
                        <div style={{ textAlign: "center", padding: "28px 0" }}>
                            <div
                                style={{
                                    width: 60,
                                    height: 60,
                                    background: "#dcfce7",
                                    borderRadius: "50%",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    margin: "0 auto 14px",
                                }}
                            >
                                <CheckCircle size={28} style={{ color: "#16a34a" }} />
                            </div>
                            <h3
                                style={{
                                    fontFamily: "'Playfair Display',serif",
                                    fontSize: 20,
                                    fontWeight: 700,
                                    color: NAVY,
                                    margin: "0 0 8px",
                                }}
                            >
                                Report submitted
                            </h3>
                            <p
                                style={{
                                    fontSize: 12,
                                    color: "#777",
                                    fontFamily: "'Lato',sans-serif",
                                    lineHeight: 1.7,
                                    margin: "0 0 20px",
                                }}
                            >
                                Our compliance team will review <strong style={{ color: NAVY }}>{displayName}</strong>{" "}
                                within 24 hours.
                            </p>
                            <button onClick={onClose} className="btn-gold" style={{ width: "100%", flex: "none" }}>
                                Close
                            </button>
                        </div>
                    ) : authReady && !user ? (
                    <div style={{ textAlign: "center", padding: "28px 0" }}>
                        <p style={{ fontSize: 13, color: "#777", fontFamily: "'Lato',sans-serif", margin: "0 0 16px" }}>
                            Sign in to report a seller. Reports are tied to your account so we can follow up.
                        </p>
                        <Link
                            href={`/signin?redirect=${encodeURIComponent(window.location.pathname)}`}
                            className="btn-gold"
                            style={{ textDecoration: "none", width: "100%", flex: "none" }}
                        >
                            Sign in
                        </Link>
                    </div>
                ) : (
                        <>
                            <p
                                style={{
                                    fontSize: 12,
                                    color: "#777",
                                    fontFamily: "'Lato',sans-serif",
                                    lineHeight: 1.7,
                                    margin: "0 0 16px",
                                }}
                            >
                                Reporting <strong style={{ color: NAVY }}>{displayName}</strong>. Give accurate
                                details — false reports may lead to account suspension.
                            </p>

                            <p style={{ ...label, margin: "0 0 10px" }}>
                                Reason <span style={{ color: "#dc2626" }}>*</span>
                            </p>
                            <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 16 }}>
                                {REPORT_REASONS.map(({ label: l, icon }) => {
                                    const on = reason === l;
                                    return (
                                        <button
                                            key={l}
                                            onClick={() => setReason(l)}
                                            style={{
                                                display: "flex",
                                                alignItems: "center",
                                                gap: 10,
                                                padding: "10px 14px",
                                                background: on ? "rgba(184,150,62,.1)" : BG,
                                                border: `0.5px solid ${on ? GOLD : LINE}`,
                                                borderLeft: `3px solid ${on ? GOLD : "transparent"}`,
                                                cursor: "pointer",
                                                textAlign: "left",
                                                transition: "all .15s",
                                            }}
                                        >
                                            <span style={{ fontSize: 14 }}>{icon}</span>
                                            <span
                                                style={{
                                                    fontSize: 13,
                                                    fontWeight: on ? 700 : 400,
                                                    color: NAVY,
                                                    fontFamily: "'Lato',sans-serif",
                                                    flex: 1,
                                                }}
                                            >
                                                {l}
                                            </span>
                                            {on && (
                                                <div
                                                    style={{
                                                        width: 16,
                                                        height: 16,
                                                        borderRadius: "50%",
                                                        background: GOLD,
                                                        display: "flex",
                                                        alignItems: "center",
                                                        justifyContent: "center",
                                                    }}
                                                >
                                                    <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
                                                        <path
                                                            d="M1 3l2 2 4-4"
                                                            stroke="#fff"
                                                            strokeWidth="1.6"
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                        />
                                                    </svg>
                                                </div>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>

                            <p style={{ ...label, margin: "0 0 8px" }}>
                                Details <span style={{ color: "#dc2626" }}>*</span>
                            </p>
                            <textarea
                                rows={4}
                                value={details}
                                onChange={(e) => setDetails(e.target.value)}
                                placeholder="Describe the issue…"
                                style={{
                                    width: "100%",
                                    background: BG,
                                    border: `0.5px solid ${LINE}`,
                                    color: NAVY,
                                    fontSize: 13,
                                    fontFamily: "'Lato',sans-serif",
                                    padding: "12px 14px",
                                    resize: "vertical",
                                    lineHeight: 1.7,
                                    outline: "none",
                                    marginBottom: 6,
                                }}
                                onFocus={(e) => (e.target.style.borderColor = GOLD)}
                                onBlur={(e) => (e.target.style.borderColor = LINE)}
                            />
                            <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 18 }}>
                                <span
                                    style={{
                                        fontSize: 10,
                                        color: details.trim().length >= 10 ? "#15803d" : "#aaa",
                                        fontFamily: "'Lato',sans-serif",
                                        fontWeight: 700,
                                    }}
                                >
                                    {details.length} chars {details.trim().length < 10 ? "(min 10)" : "✓"}
                                </span>
                            </div>

                            <div style={{ display: "flex", gap: 8 }}>
                                <button onClick={onClose} className="btn-grey" style={{ flex: "0 0 90px" }}>
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSubmit}
                                    disabled={!canSubmit}
                                    className="btn-gold"
                                    style={{ opacity: canSubmit ? 1 : 0.5, cursor: canSubmit ? "pointer" : "not-allowed" }}
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 size={13} style={{ animation: "spin .8s linear infinite" }} />
                                            Submitting…
                                        </>
                                    ) : (
                                        <>
                                            <Flag size={12} /> Submit report
                                        </>
                                    )}
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

/* ════════════════════════════════════════════════════════
   MAIN PAGE
════════════════════════════════════════════════════════ */
export default function SellersClient() {
    const router = useRouter();
    const [sellers, setSellers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [lastDoc, setLastDoc] = useState(null);
    const [hasMore, setHasMore] = useState(true);
    const sentinelRef = useRef(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [reportTarget, setReportTarget] = useState(null);
    const [totalCount, setTotalCount] = useState(0);
    const [verifiedCount, setVerifiedCount] = useState(0);

    const PAGE_SIZE = 12;

    const isFacultyDoc = (s) =>
        s.isLecturer === true ||
        s.role === "lecturer" ||
        s.role === "faculty" ||
        ["Dr.", "Prof.", "Engr.", "Pharm.", "Barr.", "Lecturer"].includes(s.title);

    const fetchCounts = async () => {
        try {
            const countSnap = await getDocs(
                query(collection(db, "sellers"), where("isLecturer", "!=", true))
            );
            const nonFaculty = countSnap.docs.filter((d) => !isFacultyDoc(d.data()));
            setTotalCount(nonFaculty.length);
            setVerifiedCount(nonFaculty.length);
        } catch (e) {
            console.error("Count fetch failed:", e);
        }
    };

    const navigateToProfile = (seller) => {
        if (seller.slug) {
            router.push(`/profile/${seller.slug}`);
            return;
        }
        const title = seller.sellerTitle || "";
        const nameParts = (seller.sellerName || "").trim().split(/\s+/);
        const firstName = nameParts[0] || "";
        const surname = nameParts.slice(1).join(" ") || "";
        const slug = makeSlug(title, firstName, surname) || makeSlug("", firstName, surname);
        if (slug) {
            router.push(`/profile/${slug}`);
            return;
        }
        router.push(`/seller-profile?sellerId=${seller.uid}`);
    };

    const enrichSellers = async (sellerDocs) => {
        const enriched = await Promise.all(
            sellerDocs.map(async (seller) => {
                try {
                    const userSnap = await getDoc(doc(db, "users", seller.uid));
                    if (!userSnap.exists()) return null;
                    const u = userSnap.data();

                    const photo =
                        u.photoURL || u.photoBase64 || seller.photoBase64 || seller.photoURL || null;
                    const firstName = u.firstName || "";
                    const surname = u.surname || "";
                    const title = seller.sellerTitle || seller.title || u.lecturerTitle || "";
                    const fullName = (firstName + " " + surname).trim() || u.displayName || "";
                    if (!fullName) return null;

                    const generatedSlug =
                        seller.slug ||
                        makeSlug(title, firstName, surname) ||
                        makeSlug("", firstName, surname) ||
                        null;

                    return {
                        ...seller,
                        photoURL: photo,
                        photoBase64: photo,
                        sellerName: fullName,
                        sellerTitle: title,
                        slug: generatedSlug,
                        isVerifiedSeller:
                            seller.isVerifiedSeller || u.isVerifiedSeller || u.isVerified || false,
                        businessInfo: {
                            ...seller.businessInfo,
                            ...(!seller.businessInfo?.state && u.state ? { state: u.state } : {}),
                            ...(!seller.businessInfo?.country && u.country ? { country: u.country } : {}),
                        },
                    };
                } catch {
                    return null;
                }
            })
        );
        return enriched.filter(Boolean);
    };

    const fetchPage = async (cursor = null) => {
        if (loadingMore) return;
        cursor ? setLoadingMore(true) : setLoading(true);
        try {
            let q = query(collection(db, "sellers"), orderBy("createdAt", "desc"), limit(PAGE_SIZE));
            if (cursor) q = query(q, startAfter(cursor));

            const snapshot = await getDocs(q);
            const sellerDocs = snapshot.docs
                .map((d) => ({ uid: d.id, ...d.data() }))
                .filter((s) => !isFacultyDoc(s));

            if (snapshot.docs.length < PAGE_SIZE) setHasMore(false);

            const enriched = await enrichSellers(sellerDocs);
            setSellers((prev) => (cursor ? [...prev, ...enriched] : enriched));
            setLastDoc(snapshot.docs[snapshot.docs.length - 1] || null);
        } catch (e) {
            console.error("Error loading sellers:", e);
        } finally {
            cursor ? setLoadingMore(false) : setLoading(false);
        }
    };

    useEffect(() => {
        fetchCounts();
        fetchPage();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && hasMore && !loadingMore && !loading) {
                    fetchPage(lastDoc);
                }
            },
            { threshold: 0.1 }
        );
        if (sentinelRef.current) observer.observe(sentinelRef.current);
        return () => observer.disconnect();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [lastDoc, hasMore, loadingMore, loading]);

    const filtered = sellers.filter((s) => {
        const name =
            s.sellerName || s.businessInfo?.businessName || s.bankDetails?.accountName || "";
        const shop = s.businessInfo?.businessName || "";
        const loc = s.businessInfo?.state || s.businessInfo?.country || "";
        const q = searchTerm.toLowerCase();
        return (
            name.toLowerCase().includes(q) ||
            shop.toLowerCase().includes(q) ||
            loc.toLowerCase().includes(q)
        );
    });

    const fonts = `@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400&family=Lato:wght@300;400;700&display=swap');`;

    /* ── Loading screen ── */
    if (loading)
        return (
            <>
                <style>{`
          ${fonts}
          @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.45} }
          body { background: ${BG}; margin: 0; }
        `}</style>
                <div style={{ minHeight: "100vh", background: BG, fontFamily: "'Lato',sans-serif" }}>
                    <div
                        style={{
                            background: NAVY,
                            height: 240,
                            backgroundImage: "radial-gradient(rgba(184,150,62,.07) 1px,transparent 1px)",
                            backgroundSize: "28px 28px",
                        }}
                    />
                    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "24px 16px" }}>
                        {[1, 2, 3].map((i) => (
                            <div
                                key={i}
                                style={{
                                    background: "#fff",
                                    border: `0.5px solid ${LINE}`,
                                    padding: 16,
                                    marginBottom: 10,
                                    display: "flex",
                                    gap: 16,
                                    animation: "pulse 1.5s infinite",
                                }}
                            >
                                <div style={{ width: 88, height: 88, borderRadius: 26, background: "#f0ebe0" }} />
                                <div style={{ flex: 1 }}>
                                    <div style={{ height: 14, width: "50%", background: "#f0ebe0", marginBottom: 12 }} />
                                    <div style={{ height: 36, background: "#f0ebe0", borderRadius: 8 }} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </>
        );

    return (
        <>
            <style>{`
        ${fonts}
        *, *::before, *::after { box-sizing: border-box; }
        body { background: ${BG}; margin: 0; }

        .ellipsis { overflow:hidden; text-overflow:ellipsis; white-space:nowrap; min-width:0; }

        /* Row (Facebook-friends style) */
        .sellers-list { display:grid; grid-template-columns:repeat(auto-fill, minmax(340px, 1fr)); gap:10px; }
        .seller-row { display:flex; gap:16px; align-items:center; padding:14px 16px; background:#fff;
          border:0.5px solid ${LINE}; min-width:0; transition:border-color .18s, box-shadow .18s; }
        .seller-row:hover { border-color:${GOLD}; box-shadow:0 4px 16px rgba(13,34,68,.08); }
        .seller-avatar { width:92px; height:92px; flex-shrink:0; border-radius:28px; overflow:hidden;
          border:1px solid ${LINE}; background:${NAVY}; display:flex; align-items:center; justify-content:center;
          cursor:pointer; padding:0; }
        .seller-name { background:none; border:none; padding:0; cursor:pointer; text-align:left;
          font-family:'Playfair Display',serif; font-size:17px; font-weight:700; color:${NAVY}; line-height:1.25;
          overflow:hidden; text-overflow:ellipsis; white-space:nowrap; max-width:100%; }
        .seller-sub { display:flex; align-items:center; gap:5px; margin:3px 0 0; font-size:12px; color:#888;
          font-family:'Lato',sans-serif; min-width:0; }

        .btn-gold, .btn-grey { flex:1; padding:11px 8px; border:none; cursor:pointer; border-radius:8px;
          font-family:'Lato',sans-serif; font-size:12px; font-weight:700; letter-spacing:.04em;
          display:inline-flex; align-items:center; justify-content:center; gap:6px; transition:background .15s;
          white-space:nowrap; }
        .btn-gold { background:${GOLD}; color:${NAVY}; }
        .btn-gold:hover:not(:disabled) { background:${GOLDD}; }
        .btn-grey { background:#ece6da; color:${NAVY}; }
        .btn-grey:hover { background:#e0d8c8; }
        .btn-gold:focus-visible, .btn-grey:focus-visible, .seller-avatar:focus-visible, .seller-name:focus-visible {
          outline:2px solid ${GOLD}; outline-offset:2px; }

        .search-input { width:100%; background:#fff; border:0.5px solid ${LINE}; color:${NAVY}; font-size:13px;
          font-family:'Lato',sans-serif; padding:11px 14px 11px 38px; outline:none; }
        .search-input:focus { border-color:${GOLD}; }
        .search-input::placeholder { color:#aaa; }

        .network-banner { background:${NAVY}; border:1px solid rgba(184,150,62,.25); border-left:3px solid ${GOLD};
          padding:20px 22px; display:flex; align-items:center; justify-content:space-between; gap:16px;
          text-decoration:none; transition:border-color .18s, background .18s; position:relative; overflow:hidden;
          background-image: radial-gradient(rgba(184,150,62,.07) 1px,transparent 1px); background-size:22px 22px; }
        .network-banner:hover { border-color:${GOLD}; }

        @keyframes slideUp { from { transform:translateY(100%); opacity:0 } to { transform:translateY(0); opacity:1 } }
        @keyframes spin { to { transform:rotate(360deg) } }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.45} }

        @media (max-width:480px) {
          .sellers-list { grid-template-columns:1fr; }
          .seller-avatar { width:78px; height:78px; border-radius:24px; }
          .seller-row { gap:12px; padding:12px; }
        }
        @media (prefers-reduced-motion: reduce) { * { animation:none !important; transition:none !important; } }
      `}</style>

            <div style={{ fontFamily: "'Lato',sans-serif", background: BG, minHeight: "100vh" }}>
                <Navbar />

                {/* ══ HERO ══ */}
                <section
                    style={{
                        backgroundColor: NAVY,
                        backgroundImage:
                            "radial-gradient(rgba(184,150,62,.07) 1px,transparent 1px)," +
                            "radial-gradient(rgba(255,255,255,.03) 1px,transparent 1px)",
                        backgroundSize: "28px 28px, 14px 14px",
                        backgroundPosition: "0 0, 7px 7px",
                        padding: "40px 24px 0",
                        position: "relative",
                        overflow: "hidden",
                    }}
                >
                    <div
                        style={{
                            position: "absolute",
                            bottom: -10,
                            right: 20,
                            fontSize: 100,
                            fontFamily: "'Playfair Display',serif",
                            fontWeight: 900,
                            color: "rgba(255,255,255,.04)",
                            pointerEvents: "none",
                            userSelect: "none",
                        }}
                    >
                        LAN
                    </div>

                    <div style={{ maxWidth: 1100, margin: "0 auto", position: "relative" }}>
                        <Link
                            href="/seller/network"
                            style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 7,
                                background: "rgba(184,150,62,.14)",
                                border: "1px solid rgba(184,150,62,.3)",
                                borderRadius: 999,
                                padding: "6px 12px",
                                marginBottom: 18,
                                textDecoration: "none",
                                fontSize: 10,
                                fontWeight: 700,
                                letterSpacing: ".14em",
                                textTransform: "uppercase",
                                color: GOLDD,
                            }}
                        >
                            <Globe size={11} style={{ color: GOLD }} />
                            Explore your network
                            <ChevronRight size={10} />
                        </Link>

                        <div
                            style={{
                                display: "flex",
                                alignItems: "flex-end",
                                justifyContent: "space-between",
                                flexWrap: "wrap",
                                gap: 20,
                            }}
                        >
                            <div>
                                <h1
                                    style={{
                                        fontFamily: "'Playfair Display',serif",
                                        fontSize: "clamp(28px, 6vw, 46px)",
                                        fontWeight: 900,
                                        color: "#fff",
                                        margin: "0 0 8px",
                                        lineHeight: 1.1,
                                    }}
                                >
                                    Sellers on LAN
                                </h1>
                                <p
                                    style={{
                                        fontSize: 13,
                                        color: "rgba(245,240,232,.6)",
                                        fontWeight: 300,
                                        margin: 0,
                                        lineHeight: 1.7,
                                    }}
                                >
                                    {totalCount || sellers.length} document sellers. Browse, connect and report.
                                </p>
                            </div>

                            <div style={{ position: "relative", width: "clamp(240px, 40vw, 360px)", flexShrink: 0 }}>
                                <Search
                                    size={14}
                                    style={{
                                        position: "absolute",
                                        left: 12,
                                        top: "50%",
                                        transform: "translateY(-50%)",
                                        color: "#aaa",
                                        pointerEvents: "none",
                                    }}
                                />
                                <input
                                    type="text"
                                    placeholder="Search sellers or location…"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="search-input"
                                />
                                {searchTerm && (
                                    <button
                                        onClick={() => setSearchTerm("")}
                                        aria-label="Clear search"
                                        style={{
                                            position: "absolute",
                                            right: 10,
                                            top: "50%",
                                            transform: "translateY(-50%)",
                                            background: "none",
                                            border: "none",
                                            cursor: "pointer",
                                            color: "#aaa",
                                            display: "flex",
                                        }}
                                    >
                                        <X size={13} />
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Metrics strip */}
                        <div
                            style={{
                                borderTop: "0.5px solid rgba(184,150,62,.15)",
                                display: "grid",
                                gridTemplateColumns: "repeat(auto-fit, minmax(90px, 1fr))",
                                marginTop: 28,
                            }}
                        >
                            {[
                                { val: totalCount || sellers.length, label: "Sellers" },
                                { val: verifiedCount || sellers.length, label: "Verified" },
                                { val: sellers.filter((s) => (s.booksSold || 0) > 0).length, label: "Active" },
                            ].map(({ val, label }) => (
                                <div
                                    key={label}
                                    style={{
                                        padding: "16px 20px",
                                        borderRight: "0.5px solid rgba(184,150,62,.1)",
                                    }}
                                >
                                    <div
                                        style={{
                                            fontFamily: "'Playfair Display',serif",
                                            fontSize: 22,
                                            fontWeight: 700,
                                            color: "#fff",
                                        }}
                                    >
                                        {val}
                                    </div>
                                    <div
                                        style={{
                                            fontSize: 10,
                                            fontWeight: 700,
                                            letterSpacing: ".1em",
                                            textTransform: "uppercase",
                                            color: "rgba(184,150,62,.7)",
                                            marginTop: 2,
                                        }}
                                    >
                                        {label}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ══ CONTENT ══ */}
                <main style={{ maxWidth: 1100, margin: "0 auto", padding: "28px 16px 80px" }}>
                    <Link href="/seller/network" className="network-banner" style={{ marginBottom: 24 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 14, flex: 1, minWidth: 0 }}>
                            <div
                                style={{
                                    width: 42,
                                    height: 42,
                                    flexShrink: 0,
                                    background: "rgba(184,150,62,.14)",
                                    border: "1px solid rgba(184,150,62,.3)",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                }}
                            >
                                <Network size={18} style={{ color: GOLD }} />
                            </div>
                            <div style={{ minWidth: 0 }}>
                                <p
                                    style={{
                                        fontFamily: "'Playfair Display',serif",
                                        fontSize: 17,
                                        fontWeight: 700,
                                        color: "#fff",
                                        margin: 0,
                                        lineHeight: 1.2,
                                    }}
                                >
                                    Explore your network
                                </p>
                                <p
                                    style={{
                                        fontSize: 12,
                                        color: "rgba(245,240,232,.65)",
                                        margin: "3px 0 0",
                                        lineHeight: 1.5,
                                    }}
                                >
                                    Connect with sellers, follow lecturers and find study groups on LAN.
                                </p>
                            </div>
                        </div>
                        <div
                            style={{
                                width: 32,
                                height: 32,
                                flexShrink: 0,
                                background: GOLD,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                            }}
                        >
                            <ArrowRight size={14} style={{ color: NAVY }} />
                        </div>
                    </Link>

                    {filtered.length === 0 ? (
                        <div
                            style={{
                                background: "#fff",
                                border: `0.5px solid ${LINE}`,
                                padding: "56px 24px",
                                textAlign: "center",
                                maxWidth: 440,
                                margin: "0 auto",
                            }}
                        >
                            <Users size={36} style={{ color: LINE, margin: "0 auto 14px" }} />
                            <h3
                                style={{
                                    fontFamily: "'Playfair Display',serif",
                                    fontSize: 20,
                                    color: NAVY,
                                    margin: "0 0 6px",
                                }}
                            >
                                No sellers found
                            </h3>
                            <p style={{ fontSize: 12, color: "#aaa", margin: 0 }}>
                                {searchTerm ? `Nothing matches "${searchTerm}".` : "No sellers available yet."}
                            </p>
                        </div>
                    ) : (
                        <>
                            <div className="sellers-list">
                                {filtered.map((seller) => (
                                    <SellerRow
                                        key={seller.uid}
                                        seller={seller}
                                        onView={() => navigateToProfile(seller)}
                                        onReport={() => setReportTarget(seller)}
                                    />
                                ))}
                            </div>

                            {hasMore && (
                                <div
                                    ref={sentinelRef}
                                    style={{
                                        height: 60,
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        marginTop: 16,
                                    }}
                                >
                                    {loadingMore && (
                                        <Loader2 size={22} style={{ color: GOLD, animation: "spin .8s linear infinite" }} />
                                    )}
                                </div>
                            )}
                            {!hasMore && sellers.length > 0 && (
                                <p
                                    style={{
                                        textAlign: "center",
                                        color: "#aaa",
                                        fontSize: 12,
                                        padding: "32px 0",
                                    }}
                                >
                                    All {sellers.length} sellers loaded
                                </p>
                            )}
                        </>
                    )}
                </main>

                {reportTarget && <ReportModal seller={reportTarget} onClose={() => setReportTarget(null)} />}
            </div>
        </>
    );
}