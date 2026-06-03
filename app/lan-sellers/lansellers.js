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
    startAfter 
} from "firebase/firestore";
import { db, auth } from "@/lib/firebaseConfig";
import Navbar from "@/components/NavBar";
import {
    User,
    MapPin,
    ExternalLink,
    Loader2,
    Search,
    Store,
    X,
    Flag,
    ChevronRight,
    BookOpen,
    Shield,
    AlertTriangle,
    CheckCircle,
    Users,
    GraduationCap,
    Star,
    TrendingUp,
    Globe,
    ArrowRight,
    Network,
    Sparkles,
} from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";

/* ─── Design tokens ─── */
const VOID = "#0b0b0f";
const DARK = "#11111a";
const DARK2 = "#18182a";
const DARK3 = "#1e1e30";
const PURPLE = "#7c3aed";
const PURPLEL = "#a855f7";
const PURPLED = "#5b21b6";
const LIME = "#a3e635";
const LIMEL = "#d9f99d";
const WHITE = "#f8f8ff";
const MUTED = "rgba(248,248,255,.4)";
const MUTED2 = "rgba(248,248,255,.12)";
const BORDER = "rgba(124,58,237,.25)";
const BORDER2 = "rgba(248,248,255,.07)";

/* ─── Palette generator ─── */
const PALETTES = [
    { bg: "#1a0a2e", accent: PURPLEL },
    { bg: "#0a1a2e", accent: "#7eccd4" },
    { bg: "#1a2e0a", accent: LIME },
    { bg: "#2e0a1a", accent: "#f87171" },
    { bg: "#1a1a0a", accent: "#d9f99d" },
    { bg: "#0a2e1a", accent: "#34d399" },
];
const getPalette = (n = "?") =>
    PALETTES[(n || "?").charCodeAt(0) % PALETTES.length];
const getInitials = (n = "?") => {
    const parts = (n || "?").trim().split(" ").filter(Boolean);
    if (!parts.length) return "?";
    if (parts.length === 1) return parts[0][0].toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

/* ─── Slug generator (matches the one in lecturers page) ─── */
const makeSlug = (title, firstName, surname) =>
    [title, firstName, surname]
        .filter(Boolean)
        .join(" ")
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-");

/* ─── Report reasons ─── */
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
   SELLER CARD
════════════════════════════════════════════════════════ */
function SellerCard({ seller, onReport, onView }) {
    const displayName =
        seller.sellerName ||
        seller.businessInfo?.businessName ||
        seller.bankDetails?.accountName ||
        "Unknown Seller";

    const location =
        seller.businessInfo?.state ||
        seller.businessInfo?.country ||
        "Nigeria";

    const category = seller.businessInfo?.category || "Document Seller";

    const photo =
        seller.photoBase64 ||
        seller.photoURL ||
        seller.profilePicture ||
        null;

    const pal = getPalette(displayName);
    const ini = getInitials(displayName);
    const verified = seller.isVerifiedSeller === true;
    const booksSold = seller.booksSold || 0;

    const [coverErr, setCoverErr] = useState(false);
    const [avatarErr, setAvatarErr] = useState(false);

    useEffect(() => {
        setCoverErr(false);
        setAvatarErr(false);
    }, [seller.uid]);

    const showCoverPhoto = !!photo && !coverErr;
    const showAvatarPhoto = !!photo && !avatarErr;

    return (
        <div className="seller-card">
            {/* ── Cover ── */}
            <div style={{
                position: "relative",
                height: 120,
                overflow: "hidden",
                background: pal.bg,
                flexShrink: 0,
            }}>
                {showCoverPhoto ? (
                    <img
                        src={photo}
                        alt=""
                        aria-hidden="true"
                        onError={() => setCoverErr(true)}
                        style={{
                            position: "absolute", inset: 0,
                            width: "100%", height: "100%",
                            objectFit: "cover", objectPosition: "top center",
                            display: "block",
                            filter: "brightness(0.42) saturate(0.75)",
                        }}
                    />
                ) : (
                    <div style={{
                        position: "absolute", inset: 0,
                        background: `radial-gradient(ellipse at 30% 50%, ${pal.accent}22 0%, transparent 65%),
                         radial-gradient(ellipse at 80% 20%, ${PURPLE}18 0%, transparent 55%),
                         ${pal.bg}`,
                    }} />
                )}

                <div style={{
                    position: "absolute", inset: 0,
                    backgroundImage: `radial-gradient(rgba(248,248,255,.05) 1px, transparent 1px)`,
                    backgroundSize: "18px 18px",
                    pointerEvents: "none",
                }} />

                <div style={{
                    position: "absolute", bottom: 0, left: 0, right: 0, height: 56,
                    background: `linear-gradient(to top, ${DARK} 0%, transparent 100%)`,
                    pointerEvents: "none",
                }} />

                {verified && (
                    <div style={{
                        position: "absolute", top: 8, right: 8,
                        display: "flex", alignItems: "center", gap: 4,
                        background: "rgba(163,230,53,.15)",
                        border: "1px solid rgba(163,230,53,.35)",
                        padding: "3px 8px",
                    }}>
                        <Shield size={9} style={{ color: LIME }} />
                        <span style={{
                            fontSize: 7, fontWeight: 700, letterSpacing: ".12em",
                            textTransform: "uppercase", color: LIME,
                            fontFamily: "'Space Grotesk', sans-serif",
                        }}>Verified</span>
                    </div>
                )}

                <div style={{
                    position: "absolute", bottom: -22, left: 16,
                    width: 50, height: 50, borderRadius: "50%",
                    border: `2.5px solid ${PURPLE}`,
                    overflow: "hidden",
                    boxShadow: `0 0 0 3px ${DARK}`,
                    background: pal.bg,
                    zIndex: 2,
                }}>
                    {showAvatarPhoto ? (
                        <img
                            src={photo}
                            alt={displayName}
                            onError={() => setAvatarErr(true)}
                            style={{
                                width: "100%", height: "100%",
                                objectFit: "cover", objectPosition: "top center",
                                display: "block",
                            }}
                        />
                    ) : (
                        <div style={{
                            width: "100%", height: "100%",
                            display: "flex", alignItems: "center", justifyContent: "center",
                        }}>
                            <span style={{
                                color: pal.accent, fontSize: 17, fontWeight: 900,
                                fontFamily: "'Syne', sans-serif",
                            }}>{ini}</span>
                        </div>
                    )}
                </div>
            </div>

            {/* ── Body ── */}
            <div style={{ padding: "34px 16px 16px", display: "flex", flexDirection: "column", flex: 1 }}>
                <h3 style={{
                    fontFamily: "'Syne', sans-serif",
                    fontSize: 14, fontWeight: 800, color: WHITE,
                    margin: "0 0 4px", lineHeight: 1.3,
                    wordBreak: "break-word",
                    overflowWrap: "break-word",
                    letterSpacing: "-.01em",
                }}>
                    {displayName}
                </h3>

                <p style={{
                    fontSize: 10, color: MUTED, margin: "0 0 10px",
                    fontFamily: "'Space Grotesk', sans-serif",
                    display: "flex", alignItems: "center", gap: 4,
                }}>
                    <MapPin size={9} style={{ color: LIME, flexShrink: 0 }} />
                    {location}
                </p>

                <div style={{
                    display: "inline-flex", alignItems: "center", gap: 5,
                    background: "rgba(124,58,237,.18)", border: `1px solid ${BORDER}`,
                    padding: "3px 10px", marginBottom: 12, width: "fit-content",
                }}>
                    <Store size={8} style={{ color: PURPLEL }} />
                    <span style={{
                        fontSize: 8, fontWeight: 700, letterSpacing: ".12em",
                        textTransform: "uppercase", color: PURPLEL,
                        fontFamily: "'Space Grotesk', sans-serif",
                    }}>{category}</span>
                </div>

                <div style={{
                    display: "grid", gridTemplateColumns: "1fr 1fr",
                    gap: 8, marginBottom: 12,
                    borderTop: `1px solid ${BORDER2}`, paddingTop: 10,
                }}>
                    {[
                        { label: "Sold", val: booksSold },
                        { label: "Status", val: booksSold > 0 ? "Active" : "New" },
                    ].map(({ label, val }) => (
                        <div key={label} style={{ textAlign: "center" }}>
                            <p style={{
                                fontFamily: "'Syne', sans-serif",
                                fontSize: 15, fontWeight: 800, color: WHITE, margin: "0 0 2px",
                            }}>{val}</p>
                            <p style={{
                                fontSize: 8, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase",
                                color: MUTED, fontFamily: "'Space Grotesk', sans-serif", margin: 0,
                            }}>{label}</p>
                        </div>
                    ))}
                </div>

                <div style={{ display: "flex", gap: 8, marginTop: "auto" }}>
                    <button onClick={onView} className="btn-view">
                        View Profile <ChevronRight size={11} />
                    </button>
                    <button onClick={onReport} className="btn-report" title="Report Seller">
                        <Flag size={13} />
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
        seller.businessInfo?.businessName ||
        seller.bankDetails?.accountName ||
        seller.sellerName ||
        "Unknown Seller";

    const [reason, setReason] = useState("");
    const [details, setDetails] = useState("");
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const user = auth.currentUser;

    const handleSubmit = async () => {
        if (!reason || details.trim().length < 10) return;
        setLoading(true);
        try {
            await addDoc(collection(db, "sellerReports"), {
                sellerId: seller.uid,
                sellerName: displayName,
                sellerSlug: seller.slug || null,        // ← ADD THIS
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

    const canSubmit = !!reason && details.trim().length >= 10 && !loading;

    return (
        <div
            onClick={onClose}
            style={{
                position: "fixed", inset: 0, zIndex: 9999,
                background: "rgba(0,0,0,.75)", backdropFilter: "blur(6px)",
                display: "flex", alignItems: "flex-end", justifyContent: "center",
            }}
        >
            <div
                onClick={e => e.stopPropagation()}
                style={{
                    background: DARK, width: "100%", maxWidth: 500,
                    border: `1px solid ${BORDER}`,
                    borderRadius: "16px 16px 0 0",
                    overflow: "hidden",
                    animation: "slideUp .28s cubic-bezier(.4,0,.2,1) both",
                }}
            >
                <div style={{
                    background: DARK2, padding: "18px 20px",
                    borderBottom: `1px solid ${BORDER}`,
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{
                            width: 32, height: 32,
                            background: "rgba(239,68,68,.15)", border: "1px solid rgba(239,68,68,.3)",
                            display: "flex", alignItems: "center", justifyContent: "center",
                        }}>
                            <Flag size={14} style={{ color: "#f87171" }} />
                        </div>
                        <div>
                            <p style={{
                                fontSize: 9, fontWeight: 700, letterSpacing: ".16em",
                                textTransform: "uppercase", color: "#f87171", margin: 0,
                                fontFamily: "'Space Grotesk', sans-serif",
                            }}>Report</p>
                            <p style={{
                                fontFamily: "'Syne', sans-serif", fontSize: 15,
                                fontWeight: 800, color: WHITE, margin: 0,
                            }}>File a Complaint</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        style={{
                            background: "rgba(255,255,255,.06)", border: `1px solid ${BORDER2}`,
                            borderRadius: "50%", width: 30, height: 30, cursor: "pointer",
                            display: "flex", alignItems: "center", justifyContent: "center", color: WHITE,
                        }}
                    >
                        <X size={14} />
                    </button>
                </div>

                <div style={{ padding: "20px", maxHeight: "70vh", overflowY: "auto" }}>
                    {success ? (
                        <div style={{ textAlign: "center", padding: "32px 0" }}>
                            <div style={{
                                width: 64, height: 64,
                                background: "rgba(22,163,74,.12)", border: "1px solid rgba(22,163,74,.3)",
                                borderRadius: "50%", display: "flex", alignItems: "center",
                                justifyContent: "center", margin: "0 auto 16px",
                            }}>
                                <CheckCircle size={28} style={{ color: "#16a34a" }} />
                            </div>
                            <h3 style={{
                                fontFamily: "'Syne', sans-serif", fontSize: 18,
                                fontWeight: 800, color: WHITE, margin: "0 0 8px",
                            }}>Report Submitted</h3>
                            <p style={{
                                fontSize: 11, color: MUTED, fontFamily: "'Space Grotesk', sans-serif",
                                lineHeight: 1.7, margin: "0 0 20px",
                            }}>
                                Our compliance team will review{" "}
                                <strong style={{ color: WHITE }}>{displayName}</strong> within 24 hours.
                            </p>
                            <button onClick={onClose} className="btn-lime-full">Close</button>
                        </div>
                    ) : (
                        <>
                            <p style={{
                                fontSize: 11, color: MUTED, fontFamily: "'Space Grotesk', sans-serif",
                                lineHeight: 1.7, margin: "0 0 16px",
                            }}>
                                Filing a report against{" "}
                                <strong style={{ color: WHITE }}>{displayName}</strong>.
                                Provide accurate details — false reports may result in account suspension.
                            </p>

                            <p style={{
                                fontSize: 9, fontWeight: 700, letterSpacing: ".16em",
                                textTransform: "uppercase", color: MUTED,
                                fontFamily: "'Space Grotesk', sans-serif", margin: "0 0 10px",
                            }}>
                                Select Reason <span style={{ color: "#f87171" }}>*</span>
                            </p>
                            <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 16 }}>
                                {REPORT_REASONS.map(({ label, icon }) => (
                                    <button
                                        key={label}
                                        onClick={() => setReason(label)}
                                        style={{
                                            display: "flex", alignItems: "center", gap: 10,
                                            padding: "10px 14px",
                                            background: reason === label ? "rgba(124,58,237,.2)" : "rgba(255,255,255,.03)",
                                            border: `1px solid ${reason === label ? PURPLE : BORDER2}`,
                                            borderLeft: `3px solid ${reason === label ? PURPLEL : "transparent"}`,
                                            cursor: "pointer", textAlign: "left", transition: "all .15s",
                                        }}
                                    >
                                        <span style={{ fontSize: 14, flexShrink: 0 }}>{icon}</span>
                                        <span style={{
                                            fontSize: 12, fontWeight: reason === label ? 700 : 400,
                                            color: reason === label ? WHITE : MUTED,
                                            fontFamily: "'Space Grotesk', sans-serif", flex: 1,
                                        }}>{label}</span>
                                        {reason === label && (
                                            <div style={{
                                                width: 16, height: 16, borderRadius: "50%",
                                                background: PURPLE,
                                                display: "flex", alignItems: "center", justifyContent: "center",
                                                flexShrink: 0,
                                            }}>
                                                <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
                                                    <path d="M1 3l2 2 4-4" stroke="#fff" strokeWidth="1.6"
                                                        strokeLinecap="round" strokeLinejoin="round" />
                                                </svg>
                                            </div>
                                        )}
                                    </button>
                                ))}
                            </div>

                            <p style={{
                                fontSize: 9, fontWeight: 700, letterSpacing: ".16em",
                                textTransform: "uppercase", color: MUTED,
                                fontFamily: "'Space Grotesk', sans-serif", margin: "0 0 8px",
                            }}>
                                Details <span style={{ color: "#f87171" }}>*</span>
                            </p>
                            <textarea
                                rows={4}
                                value={details}
                                onChange={e => setDetails(e.target.value)}
                                placeholder="Describe the issue…"
                                style={{
                                    width: "100%", boxSizing: "border-box",
                                    background: DARK2, border: `1px solid ${BORDER2}`,
                                    color: WHITE, fontSize: 12, fontFamily: "'Space Grotesk', sans-serif",
                                    padding: "12px 14px", resize: "vertical", lineHeight: 1.7,
                                    outline: "none", marginBottom: 6, transition: "border-color .15s",
                                }}
                                onFocus={e => (e.target.style.borderColor = PURPLE)}
                                onBlur={e => (e.target.style.borderColor = BORDER2)}
                            />
                            <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 18 }}>
                                <span style={{
                                    fontSize: 9, color: details.trim().length >= 10 ? LIME : MUTED,
                                    fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700,
                                    transition: "color .2s",
                                }}>
                                    {details.length} chars {details.trim().length < 10 ? "(min 10)" : "✓"}
                                </span>
                            </div>

                            <div style={{ display: "flex", gap: 8 }}>
                                <button onClick={onClose} style={{
                                    flex: "0 0 90px", padding: "11px 0",
                                    background: "transparent", border: `1px solid ${BORDER2}`,
                                    color: MUTED, fontSize: 11, fontWeight: 700, cursor: "pointer",
                                    fontFamily: "'Space Grotesk', sans-serif",
                                    letterSpacing: ".06em", textTransform: "uppercase",
                                }}>Cancel</button>

                                <button
                                    onClick={handleSubmit}
                                    disabled={!canSubmit}
                                    style={{
                                        flex: 1, padding: "11px 0",
                                        background: canSubmit ? "#ef4444" : "rgba(239,68,68,.15)",
                                        border: `1px solid ${canSubmit ? "#ef4444" : "rgba(239,68,68,.3)"}`,
                                        color: canSubmit ? "#fff" : "rgba(239,68,68,.4)",
                                        fontSize: 11, fontWeight: 700,
                                        cursor: canSubmit ? "pointer" : "not-allowed",
                                        fontFamily: "'Space Grotesk', sans-serif",
                                        letterSpacing: ".06em", textTransform: "uppercase",
                                        display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                                        transition: "all .15s",
                                    }}
                                >
                                    {loading ? (
                                        <>
                                            <div style={{
                                                width: 13, height: 13,
                                                border: "2px solid rgba(255,255,255,.3)",
                                                borderTopColor: "#fff", borderRadius: "50%",
                                                animation: "spin .7s linear infinite",
                                            }} />
                                            Submitting…
                                        </>
                                    ) : (
                                        <><Flag size={12} />Submit Report</>
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
    
    const fetchCounts = async () => {
    try {
        // Get total count from sellers collection (no enrichment needed)
        const countSnap = await getDocs(
            query(
                collection(db, "sellers"),
                where("isLecturer", "!=", true)
            )
        );
        // Filter out faculty the same way fetchPage does
        const nonFaculty = countSnap.docs.filter(d => {
            const s = d.data();
            return !(
                s.isLecturer === true ||
                s.role === "lecturer" ||
                s.role === "faculty" ||
                ["Dr.", "Prof.", "Engr.", "Pharm.", "Barr.", "Lecturer"].includes(s.title)
            );
        });
        setTotalCount(nonFaculty.length);
        setVerifiedCount(nonFaculty.length); // all sellers are verified on LAN
    } catch (e) {
        console.error("Count fetch failed:", e);
    }
};

    
    // NEW — sellerName is already title-free, use firstName/surname from the data
    const navigateToProfile = (seller) => {
        if (seller.slug) {
            router.push(`/profile/${seller.slug}`);
            return;
        }
        // Reconstruct from parts stored during enrichment
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

    const PAGE_SIZE = 12;

    const enrichSellers = async (sellerDocs) => {
        const enriched = await Promise.all(
            sellerDocs.map(async (seller) => {
                try {
                    const userSnap = await getDoc(doc(db, "users", seller.uid));
                    if (!userSnap.exists()) return null;
                    const u = userSnap.data();

                    const photo = u.photoURL || u.photoBase64 || seller.photoBase64 || seller.photoURL || null;
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
                        isVerifiedSeller: seller.isVerifiedSeller || u.isVerifiedSeller || u.isVerified || false,
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
            let q = query(
                collection(db, "sellers"),
                orderBy("createdAt", "desc"),
                limit(PAGE_SIZE)
            );
            if (cursor) q = query(q, startAfter(cursor));

            const snapshot = await getDocs(q);
            const sellerDocs = snapshot.docs
                .map(d => ({ uid: d.id, ...d.data() }))
                .filter(s => {
                    const isFaculty =
                        s.isLecturer === true ||
                        s.role === "lecturer" ||
                        s.role === "faculty" ||
                        ["Dr.", "Prof.", "Engr.", "Pharm.", "Barr.", "Lecturer"].includes(s.title);
                    return !isFaculty;
                });

            if (snapshot.docs.length < PAGE_SIZE) setHasMore(false);

            const enriched = await enrichSellers(sellerDocs);
            setSellers(prev => cursor ? [...prev, ...enriched] : enriched);
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
    }, []);

    // Infinite scroll observer
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
    }, [lastDoc, hasMore, loadingMore, loading]);

    /* ── Search filter ── */
    const filtered = sellers.filter(s => {
        const name = s.businessInfo?.businessName || s.bankDetails?.accountName || s.sellerName || "";
        const loc = s.businessInfo?.state || s.businessInfo?.country || "";
        const cat = s.businessInfo?.category || "";
        const q = searchTerm.toLowerCase();
        return (
            name.toLowerCase().includes(q) ||
            loc.toLowerCase().includes(q) ||
            cat.toLowerCase().includes(q)
        );
    });

    /* ── Loading screen ── */
    if (loading) return (
        <>
            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;700;800&family=Space+Grotesk:wght@300;400;600;700&display=swap');
        @keyframes spin { to { transform: rotate(360deg); } }
        body { background: #0b0b0f; margin: 0; }
      `}</style>
            <div style={{ minHeight: "100vh", background: VOID, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <div style={{ textAlign: "center" }}>
                    <div style={{
                        width: 52, height: 52,
                        border: `3px solid ${PURPLE}`, borderTopColor: LIME,
                        borderRadius: "50%", animation: "spin .8s linear infinite",
                        margin: "0 auto 14px",
                    }} />
                    <p style={{ fontFamily: "'Syne', sans-serif", fontSize: 16, color: WHITE, margin: 0 }}>
                        Loading LAN sellers…
                    </p>
                </div>
            </div>
        </>
    );

    /* ── Full render ── */
    return (
        <>
            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;700;800&family=Space+Grotesk:wght@300;400;600;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; min-width: 0; }
        body { background: ${VOID}; margin: 0; }

        .seller-card {
          background: ${DARK};
          border: 1px solid ${BORDER2};
          overflow: hidden;
          display: flex;
          flex-direction: column;
          transition: transform .25s cubic-bezier(.4,0,.2,1), box-shadow .25s, border-color .25s;
        }
        .seller-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 16px 40px rgba(124,58,237,.2);
          border-color: ${PURPLE};
        }

        .btn-view {
          flex: 1;
          display: inline-flex; align-items: center; justify-content: center; gap: 5px;
          padding: 9px 12px;
          background: ${PURPLE}; color: ${WHITE};
          border: none; font-size: 11px; font-weight: 700; cursor: pointer;
          font-family: 'Space Grotesk', sans-serif; letter-spacing: .06em; text-transform: uppercase;
          transition: background .18s;
        }
        .btn-view:hover { background: ${PURPLED}; }

        .btn-report {
          width: 38px; height: 38px; flex-shrink: 0;
          background: rgba(239,68,68,.12); border: 1px solid rgba(239,68,68,.25);
          color: #f87171; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          transition: background .15s, border-color .15s;
        }
        .btn-report:hover { background: rgba(239,68,68,.22); border-color: rgba(239,68,68,.5); }

        .btn-lime-full {
          width: 100%; padding: 11px 0;
          background: ${LIME}; color: ${VOID};
          border: none; font-size: 11px; font-weight: 700; cursor: pointer;
          font-family: 'Space Grotesk', sans-serif; letter-spacing: .06em; text-transform: uppercase;
          transition: background .18s;
        }
        .btn-lime-full:hover { background: ${LIMEL}; }

        .search-input {
          width: 100%;
          background: ${DARK2}; border: 1px solid ${BORDER2};
          color: ${WHITE}; font-size: 13px;
          font-family: 'Space Grotesk', sans-serif;
          padding: 10px 14px 10px 38px;
          outline: none; transition: border-color .15s;
        }
        .search-input:focus  { border-color: ${PURPLE}; }
        .search-input::placeholder { color: ${MUTED}; }

        .sellers-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
          gap: 16px;
        }

        /* ── Network banner link ── */
        .network-banner {
          background: ${DARK2};
          border: 1px solid ${BORDER};
          border-left: 3px solid ${LIME};
          padding: 20px 22px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          flex-wrap: wrap;
          text-decoration: none;
          transition: background .18s, border-color .18s;
          position: relative;
          overflow: hidden;
        }
        .network-banner:hover {
          background: ${DARK3};
          border-color: ${PURPLE};
        }

        @keyframes slideUp { from { transform: translateY(100%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        @keyframes spin    { to   { transform: rotate(360deg); } }
        @keyframes fadeUp  { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulse   { 0%,100%{opacity:1} 50%{opacity:.4} }
        .au { animation: fadeUp .45s cubic-bezier(.4,0,.2,1) both; }

        @media(max-width:480px){
          .sellers-grid { grid-template-columns: 1fr 1fr; gap: 10px; }
        }

        @media(min-width:600px){ .banner-label { display: inline !important; } }
.network-banner { align-items: center; }
      `}</style>

            <div style={{ fontFamily: "'Space Grotesk', sans-serif", background: VOID, minHeight: "100vh" }}>
                <Navbar />

                {/* ══ HERO HEADER ══ */}
                <section style={{
                    background: DARK,
                    backgroundImage: `radial-gradient(rgba(124,58,237,.08) 1px, transparent 1px),
                            radial-gradient(rgba(163,230,53,.04) 1px, transparent 1px)`,
                    backgroundSize: "28px 28px, 14px 14px",
                    backgroundPosition: "0 0, 7px 7px",
                    borderBottom: `1px solid ${BORDER}`,
                    padding: "48px 24px 0",
                    position: "relative", overflow: "hidden",
                }}>
                    <div style={{
                        position: "absolute", top: -40, right: -40,
                        width: 220, height: 220, borderRadius: "50%",
                        background: "radial-gradient(circle, rgba(124,58,237,.15) 0%, transparent 65%)",
                        pointerEvents: "none",
                    }} />

                    <div style={{ maxWidth: 1280, margin: "0 auto", position: "relative", zIndex: 2 }}>

                        {/* ── Breadcrumb / explore network row ── */}
                        <div style={{
                            display: "flex", alignItems: "center", gap: 8, marginBottom: 20, flexWrap: "wrap",
                        }}>
                            <Link href="/seller/network" style={{
                                display: "inline-flex", alignItems: "center", gap: 6,
                                fontSize: 10, fontWeight: 700, letterSpacing: ".12em",
                                textTransform: "uppercase", color: MUTED,
                                fontFamily: "'Space Grotesk', sans-serif",
                                textDecoration: "none", transition: "color .15s",
                            }}
                                onMouseEnter={e => e.currentTarget.style.color = LIME}
                                onMouseLeave={e => e.currentTarget.style.color = MUTED}>
                                <Globe size={10} />
                                Explore your Network
                            </Link>
                            <ChevronRight size={10} style={{ color: MUTED2 }} />
                            <span style={{
                                fontSize: 10, fontWeight: 700, letterSpacing: ".12em",
                                textTransform: "uppercase", color: LIME,
                                fontFamily: "'Space Grotesk', sans-serif",
                                display: "flex", alignItems: "center", gap: 5,
                            }}>
                                <Store size={10} />
                                Sellers / Network
                            </span>
                        </div>

                        {/* Eyebrow */}
                        <div style={{
                            display: "inline-flex", alignItems: "center", gap: 6,
                            background: "rgba(124,58,237,.2)", border: `1px solid ${BORDER}`,
                            padding: "4px 12px", marginBottom: 16,
                        }}>
                            <span style={{
                                width: 6, height: 6, borderRadius: "50%", background: LIME,
                                display: "inline-block", animation: "pulse 1.5s ease-in-out infinite",
                            }} />
                            <span style={{
                                fontSize: 8, fontWeight: 700, letterSpacing: ".16em",
                                textTransform: "uppercase", color: PURPLEL,
                                fontFamily: "'Space Grotesk', sans-serif",
                            }}>LAN Marketplace</span>
                        </div>

                        <div style={{
                            display: "flex", alignItems: "flex-end",
                            justifyContent: "space-between", flexWrap: "wrap", gap: 20,
                        }}>
                            <div>
                                <h1 style={{
                                    fontFamily: "'Syne', sans-serif",
                                    fontSize: "clamp(28px, 6vw, 52px)",
                                    fontWeight: 800, color: WHITE,
                                    margin: "0 0 8px", letterSpacing: "-.03em", lineHeight: 1.05,
                                }}>
                                    All Sellers<br />
                                    <span style={{ color: LIME }}>on LAN</span>
                                    <span style={{ color: PURPLEL }}> ✦</span>
                                </h1>
                                <p style={{ fontSize: 13, color: MUTED, fontFamily: "'Space Grotesk', sans-serif", margin: 0, lineHeight: 1.7 }}>
                                    {totalCount || sellers.length} document sellers · Browse, connect &amp; report
                                </p>
                            </div>

                            {/* Search */}
                            <div style={{ position: "relative", width: "clamp(240px, 40vw, 360px)", flexShrink: 0 }}>
                                <Search size={14} style={{
                                    position: "absolute", left: 12, top: "50%",
                                    transform: "translateY(-50%)", color: MUTED, pointerEvents: "none",
                                }} />
                                <input
                                    type="text"
                                    placeholder="Search sellers, location, category…"
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                    className="search-input"
                                />
                                {searchTerm && (
                                    <button
                                        onClick={() => setSearchTerm("")}
                                        style={{
                                            position: "absolute", right: 10, top: "50%",
                                            transform: "translateY(-50%)",
                                            background: "none", border: "none", cursor: "pointer", color: MUTED,
                                            display: "flex", alignItems: "center",
                                        }}
                                    >
                                        <X size={13} />
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Stats strip */}
                        {/* Stats strip */}
                        <div style={{
                            display: "flex", flexWrap: "wrap", gap: 0,
                            borderTop: `1px solid ${BORDER2}`, marginTop: 32,
                        }}>
                            {[
                                { val: totalCount || sellers.length, label: "Total Sellers" },
                                { val: verifiedCount || sellers.length, label: "Verified" },
                                { val: sellers.filter(s => (s.booksSold || 0) > 0).length, label: "Active" },
                                { val: "Open", label: "Marketplace" },
                            ].map(({ val, label }) => (
                                <div key={label} style={{
                                    flex: "1 1 100px", padding: "16px 18px",
                                    borderRight: `1px solid ${BORDER2}`,
                                }}>
                                    <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 22, fontWeight: 800, color: WHITE }}>
                                        {val}
                                    </div>
                                    <div style={{
                                        fontSize: 8, fontWeight: 700, letterSpacing: ".1em",
                                        textTransform: "uppercase", color: MUTED, marginTop: 3,
                                        fontFamily: "'Space Grotesk', sans-serif",
                                    }}>{label}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ── Main content ── */}
                <main style={{ maxWidth: 1280, margin: "0 auto", padding: "36px 20px 80px" }}>

                    {/* ── Explore Your Network banner ── */}
                    <Link href="/seller/network" className="network-banner au" style={{ marginBottom: 28, display: "flex" }}>
                        <div style={{
                            position: "absolute", top: -20, right: -20, width: 100, height: 100,
                            borderRadius: "50%", background: "radial-gradient(circle, rgba(163,230,53,.08) 0%, transparent 70%)",
                            pointerEvents: "none",
                        }} />

                        <div style={{ display: "flex", alignItems: "center", gap: 12, flex: 1, minWidth: 0 }}>
                            <div style={{
                                width: 40, height: 40, flexShrink: 0,
                                background: "rgba(163,230,53,.12)",
                                border: `1px solid rgba(163,230,53,.25)`,
                                display: "flex", alignItems: "center", justifyContent: "center",
                            }}>
                                <Network size={18} style={{ color: LIME }} />
                            </div>
                            <div style={{ minWidth: 0, flex: 1 }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                                    <span style={{
                                        fontSize: 8, fontWeight: 700, letterSpacing: ".16em",
                                        textTransform: "uppercase", color: LIME,
                                        fontFamily: "'Space Grotesk', sans-serif",
                                        whiteSpace: "nowrap",
                                    }}>Seller Network</span>
                                    <span style={{
                                        width: 5, height: 5, borderRadius: "50%", background: LIME,
                                        display: "inline-block", flexShrink: 0,
                                        animation: "pulse 1.5s ease-in-out infinite",
                                    }} />
                                </div>
                                <p style={{
                                    fontFamily: "'Syne', sans-serif",
                                    fontSize: 16,
                                    fontWeight: 800, color: WHITE, margin: 0, lineHeight: 1.2,
                                    letterSpacing: "-.02em",
                                    whiteSpace: "nowrap",
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                }}>
                                    Explore Your Network
                                    <span style={{ color: PURPLEL }}> ✦</span>
                                </p>
                                <p style={{
                                    fontSize: 11, color: MUTED, margin: "3px 0 0",
                                    fontFamily: "'Space Grotesk', sans-serif",
                                    lineHeight: 1.5,
                                    display: "-webkit-box",
                                    WebkitLineClamp: 2,
                                    WebkitBoxOrient: "vertical",
                                    overflow: "hidden",
                                }}>
                                    Connect with sellers, follow lecturers &amp; discover study groups across LAN
                                </p>
                            </div>
                        </div>

                        <div style={{
                            display: "flex", alignItems: "center", gap: 6,
                            flexShrink: 0, marginLeft: 12,
                        }}>
                            <span style={{
                                fontSize: 9, fontWeight: 700, letterSpacing: ".12em",
                                textTransform: "uppercase", color: MUTED,
                                fontFamily: "'Space Grotesk', sans-serif",
                                whiteSpace: "nowrap",
                                display: "none",
                            }} className="banner-label">sellers/network</span>
                            <div style={{
                                width: 32, height: 32,
                                background: "rgba(163,230,53,.15)",
                                border: `1px solid rgba(163,230,53,.3)`,
                                display: "flex", alignItems: "center", justifyContent: "center",
                                flexShrink: 0,
                            }}>
                                <ArrowRight size={13} style={{ color: LIME }} />
                            </div>
                        </div>
                    </Link>

                    {filtered.length === 0 ? (
                        <div style={{
                            background: DARK, border: `1px solid ${BORDER2}`,
                            padding: "64px 24px", textAlign: "center",
                            maxWidth: 440, margin: "0 auto",
                        }} className="au">
                            <Users size={40} style={{ color: MUTED, margin: "0 auto 14px" }} />
                            <h3 style={{
                                fontFamily: "'Syne', sans-serif", fontSize: 20,
                                color: WHITE, marginBottom: 6,
                            }}>No Sellers Found</h3>
                            <p style={{ fontSize: 12, color: MUTED, fontFamily: "'Space Grotesk', sans-serif", margin: 0 }}>
                                {searchTerm
                                    ? `No results for "${searchTerm}"`
                                    : "No sellers available yet."}
                            </p>
                        </div>
                    ) : (
                        <>
                            <div className="sellers-grid au">
                                {filtered.map(seller => (
                                    <SellerCard
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
                                        <Loader2
                                            size={22}
                                            style={{
                                                color: PURPLEL,
                                                animation: "spin .8s linear infinite",
                                            }}
                                        />
                                    )}
                                </div>
                            )}
                            {!hasMore && sellers.length > 0 && (
                                <p style={{
                                    textAlign: "center",
                                    color: MUTED,
                                    fontFamily: "'Space Grotesk', sans-serif",
                                    fontSize: 12,
                                    padding: "32px 0",
                                    letterSpacing: ".06em",
                                }}>
                                    All {sellers.length} sellers loaded ✦
                                </p>
                            )}
                        </>
                    )}
                </main>

                {reportTarget && (
                    <ReportModal
                        seller={reportTarget}
                        onClose={() => setReportTarget(null)}
                    />
                )}
            </div>
        </>
    );
}