"use client";
/**
 * PromotionsAdminSection.jsx
 * Drop into your ComprehensiveAdminPanel under activeSection === 'promotions'
 * Also add the nav item:  { id: 'promotions', icon: Zap, label: 'Ad Promotions', badgeKey: 'pendingPromotions', badgeType: 'warn' }
 * And add to stats:       pendingPromotions: promotions?.filter(p => p.status === 'pending').length || 0
 */

import { useState, useEffect } from "react";
import {
    collection, query, where, getDocs, orderBy,
    doc, updateDoc, serverTimestamp, increment, addDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebaseConfig";
import {
    Zap, Star, Award, Eye, Check, X, Clock,
    BarChart2, RefreshCw, ExternalLink, Calendar, User,
    DollarSign, Image as ImageIcon, ChevronRight,
} from "lucide-react";

/* ── colour tokens (match your admin dark theme) ──────────── */
const GOLD = "#b8963e";
const NAVY = "#0d2244";
const CREAM = "#f5f0e8";

const TIER_META = {
    Bronze: { color: "#cd7f32", icon: Award },
    Silver: { color: "#94a3b8", icon: Star },
    Gold: { color: GOLD, icon: Zap },
};

const ADMIN_EMAILS = process.env.NEXT_PUBLIC_ADMIN_EMAILS?.split(",") || [];

/* ── tiny helpers ─────────────────────────────────────────── */
const fmtDate = (ts) => {
    if (!ts) return "—";
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleDateString("en-NG", { day: "2-digit", month: "short", year: "numeric" });
};

const addDays = (days) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d;
};

/* ══════════════════════════════════════════════════════════ */
export default function PromotionsAdminSection({ adminUser }) {
    const [promotions, setPromotions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("pending");
    const [preview, setPreview] = useState(null);   // full-screen banner preview
    const [processing, setProcessing] = useState(null);   // id being processed

    const isAdmin = ADMIN_EMAILS.includes(adminUser?.email);

    /* ── resolve book thumbnail from advertMyBook ─────────── */
    const getBookThumb = async (bookId) => {
        if (!bookId) return null;
        try {
            const snap = await getDocs(query(
                collection(db, "advertMyBook"),
                where("__name__", "==", bookId)
            ));
            if (!snap.empty) {
                const data = snap.docs[0].data();
                if (data.driveFileId)
                    return `https://drive.google.com/thumbnail?id=${data.driveFileId}&sz=w400`;
                if (data.pdfUrl?.includes("drive.google.com")) {
                    const m = data.pdfUrl.match(/[-\w]{25,}/);
                    if (m) return `https://drive.google.com/thumbnail?id=${m[0]}&sz=w400`;
                }
                if (data.embedUrl) {
                    const m = data.embedUrl.match(/\/d\/(.*?)\/|\/file\/d\/(.*?)\/|id=(.*?)(&|$)/);
                    if (m) { const id = m[1] || m[2] || m[3]; if (id) return `https://drive.google.com/thumbnail?id=${id}&sz=w400`; }
                }
            }
        } catch { }
        return null;
    };

    
    /* ── fetch ─────────────────────────────────────────────── */
    const fetchPromotions = async () => {
        setLoading(true);
        try {
            const q = query(collection(db, "promotions"), orderBy("createdAt", "desc"));
            const snap = await getDocs(q);
            const promos = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            const enriched = await Promise.all(promos.map(async (p) => {
                if (p.bannerUrl) return p;
                const thumb = await getBookThumb(p.bookId);
                return { ...p, resolvedThumb: thumb };
            }));
            setPromotions(enriched);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchPromotions(); }, []);

    /* ── approve ───────────────────────────────────────────── */
    const approveAd = async (promo) => {
        if (!isAdmin) return;
        if (!confirm(`Approve ${promo.tier} ad for "${promo.bookTitle}"?`)) return;
        setProcessing(promo.id);
        try {
            const expiryDate = addDays(promo.durationDays);
            await updateDoc(doc(db, "promotions", promo.id), {
                status: "active",
                expiryDate,
                approvedAt: serverTimestamp(),
                approvedBy: adminUser.email,
            });
            /* notify seller */
            await addDoc(collection(db, "notifications"), {
                userId: promo.sellerId,
                type: "ad_approved",
                title: "🎉 Your Ad is Live!",
                message: `Your ${promo.tier} promotion for "${promo.bookTitle}" is now active and runs until ${expiryDate.toLocaleDateString("en-NG")}.`,
                createdAt: serverTimestamp(),
                read: false,
            });
            await fetchPromotions();
        } catch (e) { alert("Failed: " + e.message); }
        finally { setProcessing(null); }
    };

    /* ── reject ────────────────────────────────────────────── */
    const rejectAd = async (promo) => {
        if (!isAdmin) return;
        const reason = prompt("Rejection reason (shown to seller):");
        if (!reason?.trim()) return;
        setProcessing(promo.id);
        try {
            // 1. Update promotion status
            await updateDoc(doc(db, "promotions", promo.id), {
                status: "rejected",
                rejectedAt: serverTimestamp(),
                rejectedBy: adminUser.email,
                rejectReason: reason,
            });

            // 2. Refund wallet if paid via wallet
            if (promo.paymentMethod === "wallet" && promo.totalPrice > 0) {
                const sellerRef = doc(db, "sellers", promo.sellerId);
                await updateDoc(sellerRef, {
                    accountBalance: increment(promo.totalPrice),
                    updatedAt: serverTimestamp(),
                });
            }

            // 3. Notify seller
            await addDoc(collection(db, "notifications"), {
                userId: promo.sellerId,
                type: "ad_rejected",
                title: "Ad Not Approved",
                message: `Your ${promo.tier} promotion for "${promo.bookTitle}" was not approved. Reason: ${reason}${promo.paymentMethod === "wallet"
                        ? ` ₦${Number(promo.totalPrice).toLocaleString()} has been refunded to your wallet.`
                        : " Please contact support for a refund if you paid via card."
                    }`,
                createdAt: serverTimestamp(),
                read: false,
            });

            await fetchPromotions();
        } catch (e) { alert("Failed: " + e.message); }
        finally { setProcessing(null); }
    };
    
    /* ── expire manually ───────────────────────────────────── */
    const expireAd = async (promo) => {
        if (!confirm("Force-expire this ad?")) return;
        await updateDoc(doc(db, "promotions", promo.id), {
            status: "expired",
            expiredAt: serverTimestamp(),
        });
        await fetchPromotions();
    };

    /* ── filter ─────────────────────────────────────────────── */
    const visible = promotions.filter(p =>
        filter === "all" ? true : p.status === filter
    );

    const counts = {
        pending: promotions.filter(p => p.status === "pending").length,
        active: promotions.filter(p => p.status === "active").length,
        expired: promotions.filter(p => p.status === "expired").length,
        rejected: promotions.filter(p => p.status === "rejected").length,
    };

    /* ── render ─────────────────────────────────────────────── */
    return (
        <>
            <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .promo-spin { animation: spin 0.7s linear infinite; }
        .promo-card { transition: border-color 0.18s, transform 0.18s; }
        .promo-card:hover { transform: translateY(-1px); border-color: rgba(184,150,62,0.4) !important; }
        .promo-tab { transition: background 0.15s, color 0.15s; }
        .promo-tab:hover { background: rgba(255,255,255,0.06); }
      `}</style>

            {/* ── Header ──────────────────────────────────────── */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
                <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 16, fontWeight: 700, color: "var(--text-primary)" }}>
                        <Zap size={18} color={GOLD} /> Ad Promotions
                    </div>
                    <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
                        {counts.pending} pending · {counts.active} active · {promotions.length} total
                    </div>
                </div>
                <button onClick={fetchPromotions} className="btn btn-ghost"><RefreshCw size={13} />Refresh</button>
            </div>

            {/* ── Stat row ─────────────────────────────────── */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 20 }}>
                {[
                    { label: "Pending", count: counts.pending, color: "#f59e0b" },
                    { label: "Active", count: counts.active, color: "#10b981" },
                    { label: "Expired", count: counts.expired, color: "#94a3b8" },
                    { label: "Rejected", count: counts.rejected, color: "#ef4444" },
                ].map(({ label, count, color }) => (
                    <div key={label} className="card-sm" style={{ cursor: "pointer" }}
                        onClick={() => setFilter(label.toLowerCase())}>
                        <div style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>{label}</div>
                        <div style={{ fontSize: 22, fontWeight: 700, color }}>{count}</div>
                    </div>
                ))}
            </div>

            {/* ── Filter tabs ──────────────────────────────── */}
            <div style={{ display: "flex", gap: 6, marginBottom: 20, flexWrap: "wrap" }}>
                {["all", "pending", "active", "expired", "rejected"].map(f => (
                    <button key={f} className={`btn promo-tab ${filter === f ? "btn-primary" : "btn-ghost"}`}
                        onClick={() => setFilter(f)} style={{ textTransform: "capitalize" }}>
                        {f}
                        {f !== "all" && <span style={{ opacity: 0.6, marginLeft: 4 }}>({counts[f] || 0})</span>}
                    </button>
                ))}
            </div>

            {/* ── Cards ────────────────────────────────────── */}
            {loading ? (
                <div style={{ display: "flex", justifyContent: "center", padding: 64 }}>
                    <div className="promo-spin" style={{ width: 32, height: 32, border: "2px solid rgba(59,130,246,0.3)", borderTopColor: "#3b82f6", borderRadius: "50%" }} />
                </div>
            ) : visible.length === 0 ? (
                <div className="card" style={{ textAlign: "center", padding: 64 }}>
                    <Zap size={32} color="var(--text-muted)" style={{ margin: "0 auto 12px" }} />
                    <div style={{ color: "var(--text-muted)" }}>No {filter} promotions</div>
                </div>
            ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    {visible.map(promo => {
                        const TierIcon = TIER_META[promo.tier]?.icon || Zap;
                        const tierColor = TIER_META[promo.tier]?.color || GOLD;
                        const isExpired = promo.expiryDate && (promo.expiryDate.toDate?.() || new Date(promo.expiryDate)) < new Date();

                        return (
                            <div key={promo.id} className="card promo-card"
                                style={{ border: `1px solid var(--card-border)`, borderLeft: `3px solid ${tierColor}`, padding: 0, overflow: "hidden" }}>

                                {/* Banner strip */}
                                {/* Banner strip — falls back to book thumbnail */}
                                {(promo.bannerUrl || promo.resolvedThumb) && (() => {
                                    const imgSrc = promo.bannerUrl || promo.resolvedThumb;
                                    return (
                                        <div style={{ position: "relative", height: 120, background: "#0a1628", overflow: "hidden", cursor: "pointer" }}
                                            onClick={() => setPreview(imgSrc)}>
                                            <img src={imgSrc} alt="Banner"
                                                style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.85 }}
                                                onError={e => { e.target.parentElement.style.display = "none"; }} />
                                        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0)", opacity: 0, transition: "opacity 0.2s" }}
                                            onMouseEnter={e => e.currentTarget.style.opacity = 1}
                                            onMouseLeave={e => e.currentTarget.style.opacity = 0}>
                                            <div style={{ background: "rgba(0,0,0,0.6)", color: "#fff", padding: "6px 14px", borderRadius: 6, fontSize: 12, display: "flex", alignItems: "center", gap: 6 }}>
                                                <Eye size={13} /> Full Preview
                                            </div>
                                        </div>
                                        {/* Tier badge */}
                                        <div style={{ position: "absolute", top: 10, right: 10, background: tierColor, color: "#000", fontWeight: 800, fontSize: 10, letterSpacing: "0.1em", padding: "3px 10px", borderRadius: 4, display: "flex", alignItems: "center", gap: 5 }}>
                                            <TierIcon size={10} />{promo.tier.toUpperCase()}
                                        </div>
                                        </div>
                                    );
                                })()}

                                <div style={{ padding: "18px 20px" }}>
                                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 14 }}>
                                        <div style={{ flex: 1 }}>
                                            {/* Headline */}
                                            <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)", marginBottom: 3 }}>
                                                {promo.headline || promo.bookTitle}
                                            </div>
                                            <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                                                {promo.bookTitle} — ₦{Number(promo.bookPrice).toLocaleString()}
                                            </div>
                                        </div>
                                        {/* Status pill */}
                                        <span className={`pill ${promo.status === "active" ? "pill-success" :
                                                promo.status === "pending" ? "pill-warn" :
                                                    promo.status === "rejected" ? "pill-danger" : "pill-gray"
                                            }`}><span className="pill-dot" />{promo.status}</span>
                                    </div>

                                    {/* Meta grid */}
                                    <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 8, background: "var(--surface)", borderRadius: 8, padding: "12px 14px", marginBottom: 14 }}>
                                        {[
                                            { icon: User, label: "Seller", value: promo.sellerEmail },
                                            { icon: Calendar, label: "Duration", value: `${promo.durationDays} days` },
                                            { icon: DollarSign, label: "Total", value: `₦${Number(promo.totalPrice).toLocaleString()}` },
                                            { icon: Clock, label: "Submitted", value: fmtDate(promo.createdAt) },
                                            { icon: BarChart2, label: "Clicks", value: (promo.clicks || 0).toLocaleString() },
                                            { icon: Eye, label: "Impressions", value: (promo.impressions || 0).toLocaleString() },
                                        ].map(({ icon: Icon, label, value }) => value != null ? (
                                            <div key={label} style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 12 }}>
                                                <Icon size={11} color="var(--text-muted)" />
                                                <span style={{ color: "var(--text-muted)" }}>{label}:</span>
                                                <span style={{ color: "var(--text-primary)", fontWeight: 600 }}>{value}</span>
                                            </div>
                                        ) : null)}
                                    </div>

                                    {/* Expiry info for active */}
                                    {promo.status === "active" && promo.expiryDate && (
                                        <div style={{
                                            background: isExpired ? "rgba(239,68,68,0.08)" : "rgba(16,185,129,0.08)",
                                            border: `1px solid ${isExpired ? "rgba(239,68,68,0.2)" : "rgba(16,185,129,0.2)"}`,
                                            borderRadius: 8, padding: "8px 12px", fontSize: 12,
                                            color: isExpired ? "#f87171" : "#34d399", marginBottom: 12,
                                            display: "flex", alignItems: "center", gap: 6,
                                        }}>
                                            <Calendar size={12} />
                                            {isExpired ? "⚠ Expired " : "Runs until "}
                                            {fmtDate(promo.expiryDate)}
                                        </div>
                                    )}

                                    {/* CTA text */}
                                    {promo.ctaText && (
                                        <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 12 }}>
                                            Button label: <strong style={{ color: "var(--text-primary)" }}>"{promo.ctaText}"</strong>
                                        </div>
                                    )}

                                    {/* Rejection reason */}
                                    {promo.status === "rejected" && promo.rejectReason && (
                                        <div style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 8, padding: "8px 12px", fontSize: 12, color: "#f87171", marginBottom: 12 }}>
                                            ❌ {promo.rejectReason}
                                        </div>
                                    )}

                                    {/* Admin actions */}
                                    {isAdmin && (
                                        <div style={{ display: "flex", gap: 8 }}>
                                            {promo.status === "pending" && (
                                                <>
                                                    <button onClick={() => approveAd(promo)} disabled={processing === promo.id}
                                                        className="btn btn-success" style={{ flex: 1, justifyContent: "center" }}>
                                                        {processing === promo.id
                                                            ? <div className="promo-spin" style={{ width: 14, height: 14, border: "2px solid rgba(52,211,153,0.3)", borderTopColor: "#34d399", borderRadius: "50%" }} />
                                                            : <><Check size={13} />Approve & Activate</>}
                                                    </button>
                                                    <button onClick={() => rejectAd(promo)} disabled={processing === promo.id}
                                                        className="btn btn-danger" style={{ flex: 1, justifyContent: "center" }}>
                                                        <X size={13} />Reject
                                                    </button>
                                                </>
                                            )}
                                            {promo.status === "active" && !isExpired && (
                                                <button onClick={() => expireAd(promo)} className="btn btn-ghost" style={{ fontSize: 11 }}>
                                                    Force Expire
                                                </button>
                                            )}
                                            {(promo.bannerUrl || promo.resolvedThumb) && (
                                                <a href={promo.bannerUrl || promo.resolvedThumb} target="_blank" rel="noopener noreferrer"
                                                    className="btn btn-ghost" style={{ fontSize: 11 }}>
                                                    <ExternalLink size={11} />
                                                    {promo.bannerUrl ? "Banner URL" : "Book Cover"}
                                                </a>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* ── Banner full-screen preview ─────────────── */}
            {preview && (
                <div onClick={() => setPreview(null)}
                    style={{ position: "fixed", inset: 0, zIndex: 300, background: "rgba(0,0,0,0.92)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, cursor: "zoom-out" }}>
                    <img src={preview} alt="Banner Preview"
                        style={{ maxWidth: "100%", maxHeight: "90vh", objectFit: "contain", borderRadius: 8, boxShadow: "0 32px 80px rgba(0,0,0,0.7)" }} />
                    <button onClick={() => setPreview(null)} style={{ position: "absolute", top: 20, right: 20, background: "rgba(255,255,255,0.1)", border: "none", color: "#fff", width: 36, height: 36, borderRadius: "50%", cursor: "pointer", fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
                </div>
            )}
        </>
    );
}