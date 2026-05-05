"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
    ShieldCheck, AlertTriangle, Loader2, ArrowLeft,
    Copy, CheckCircle, ExternalLink, RefreshCw,
    MapPin, BookOpen, Calendar, Package, User, Hash,
    Printer, ChevronRight, Star
} from "lucide-react";
import { collection, query, where, getDocs, limit, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebaseConfig";
import { QRCodeSVG } from "qrcode.react";
import Link from "next/link";

/* ─── design tokens (matching home page) ─────────────────────── */
const NAVY = "#0d2244";
const GOLD = "#b8963e";
const GOLDD = "#d4aa5a";
const CREAM = "#f5f0e8";
const BG = "#f5f1ea";

/* ─── helpers ─────────────────────────────────────────────────── */
const fmtDate = (ts) => {
    if (!ts) return "—";
    const d = ts?.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleDateString("en-NG", { day: "2-digit", month: "short", year: "numeric" });
};
const fmtDateTime = (ts) => {
    if (!ts) return "—";
    const d = ts?.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleString("en-NG", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
};
const statusMeta = (s) => ({
    in_stock: { label: "In Stock", dot: "#22c55e", bg: "rgba(34,197,94,0.1)", text: "#16a34a" },
    low_stock: { label: "Low Stock", dot: "#f59e0b", bg: "rgba(245,158,11,0.1)", text: "#d97706" },
    out_of_stock: { label: "Out of Stock", dot: "#ef4444", bg: "rgba(239,68,68,0.1)", text: "#dc2626" },
}[s] || { label: "Active", dot: "#22c55e", bg: "rgba(34,197,94,0.1)", text: "#16a34a" });

const orderStatusMeta = (s) => ({
    collected: { label: "Collected", bg: "rgba(22,163,74,0.1)", text: "#16a34a" },
    pending: { label: "Pending", bg: "rgba(217,119,6,0.1)", text: "#d97706" },
    cancelled: { label: "Cancelled", bg: "rgba(220,38,38,0.1)", text: "#dc2626" },
}[s] || { label: s, bg: "rgba(13,34,68,0.06)", text: "#666" });

/* ══════════════════════════════════════════════════════════════ */
export default function VerifyAssetPage() {
    const params = useParams();
    const router = useRouter();
    const assetId = params?.assetId;

    const [state, setState] = useState("loading");
    const [inv, setInv] = useState(null);
    const [orders, setOrders] = useState([]);
    const [copied, setCopied] = useState(false);

    const verifyUrl = typeof window !== "undefined"
        ? `${window.location.origin}/verify/${assetId}`
        : `https://learningaccessnetwork.vercel.app/verify/${assetId}`;

    useEffect(() => {
        if (!assetId) return;
        (async () => {
            try {
                const invSnap = await getDocs(
                    query(collection(db, "physicalInventory"), where("assetId", "==", assetId), limit(1))
                );
                if (invSnap.empty) { setState("notfound"); return; }
                const invData = { id: invSnap.docs[0].id, ...invSnap.docs[0].data() };
                setInv(invData);
                try {
                    const ordSnap = await getDocs(
                        query(collection(db, "physicalOrders"), where("assetId", "==", assetId), orderBy("createdAt", "desc"), limit(5))
                    );
                    setOrders(ordSnap.docs.map(d => ({ id: d.id, ...d.data() })));
                } catch (e) {
                    if (e?.code === "permission-denied") {
                        console.warn("Orders not accessible — skipping.");
                    }
                }
                setState("found");
            } catch (e) {
                console.error(e);
                setState("error");
            }
        })();
    }, [assetId]);

    const handleCopy = () => {
        navigator.clipboard?.writeText(verifyUrl).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };

    /* shared styles injected once */
    const Styles = () => (
        <style>{`
            @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400&family=Lato:wght@300;400;700&display=swap');

            .lan-verify { font-family:'Lato',sans-serif; background:${BG}; min-height:100vh; }
            .lan-serif  { font-family:'Playfair Display',Georgia,serif; }

            .verify-hero-bg {
                background-color: ${NAVY};
                background-image:
                    radial-gradient(rgba(184,150,62,0.06) 1px, transparent 1px),
                    radial-gradient(rgba(255,255,255,0.03) 1px, transparent 1px);
                background-size: 28px 28px, 14px 14px;
                background-position: 0 0, 7px 7px;
            }

            .dot-grid-cream {
                background-color: ${CREAM};
                background-image: radial-gradient(rgba(13,34,68,0.05) 1px, transparent 1px);
                background-size: 22px 22px;
            }

            .verify-card {
                background:#fff;
                border:0.5px solid #e5ddd0;
                transition: box-shadow 0.25s;
            }

            .order-row {
                border-bottom: 0.5px solid #f0ebe0;
                padding-bottom: 14px;
                margin-bottom: 14px;
            }
            .order-row:last-child { border-bottom:none; padding-bottom:0; margin-bottom:0; }

            .gold-line { display:flex; align-items:center; gap:14px; }
            .gold-line::before,.gold-line::after { content:""; flex:1; height:1px; background:rgba(184,150,62,0.3); }

            .lan-btn-primary {
                display:inline-flex; align-items:center; justify-content:center; gap:8px;
                background:${NAVY}; color:#fff;
                font-size:13px; font-weight:700; font-family:'Lato',sans-serif;
                letter-spacing:0.04em; padding:13px 28px;
                border:none; cursor:pointer;
                transition:background 0.18s;
                text-decoration:none; width:100%;
            }
            .lan-btn-primary:hover { background:#162f5c; }

            .lan-btn-ghost {
                display:inline-flex; align-items:center; justify-content:center; gap:8px;
                background:transparent; color:${NAVY};
                font-size:13px; font-weight:700; font-family:'Lato',sans-serif;
                letter-spacing:0.04em; padding:13px 28px;
                border:0.5px solid ${NAVY}; cursor:pointer;
                transition:background 0.18s;
                text-decoration:none; width:100%;
            }
            .lan-btn-ghost:hover { background:rgba(13,34,68,0.05); }

            @keyframes fadeUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
            .anim-up   { animation:fadeUp 0.55s cubic-bezier(0.4,0,0.2,1) both; }
            .anim-up-2 { animation:fadeUp 0.55s 0.1s cubic-bezier(0.4,0,0.2,1) both; }
            .anim-up-3 { animation:fadeUp 0.55s 0.2s cubic-bezier(0.4,0,0.2,1) both; }
            .anim-up-4 { animation:fadeUp 0.55s 0.3s cubic-bezier(0.4,0,0.2,1) both; }

            @keyframes spin { to { transform:rotate(360deg); } }
            .spin { animation:spin 0.9s linear infinite; }

            @media print {
                .no-print { display:none !important; }
                .lan-verify { background:#fff !important; }
            }
        `}</style>
    );

    /* ── LOADING ── */
    if (state === "loading") return (
        <div className="lan-verify verify-hero-bg" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
            <Styles />
            <div style={{ textAlign: "center" }}>
                <div style={{ width: 48, height: 48, border: `2px solid rgba(184,150,62,0.3)`, borderTopColor: GOLD, borderRadius: "50%", margin: "0 auto 20px" }} className="spin" />
                <p className="lan-serif" style={{ color: "rgba(245,240,232,0.6)", fontSize: 15 }}>Checking registry…</p>
            </div>
        </div>
    );

    /* ── NOT FOUND ── */
    if (state === "notfound") return (
        <div className="lan-verify verify-hero-bg" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", padding: 24 }}>
            <Styles />
            <div className="anim-up" style={{ maxWidth: 420, width: "100%", background: "#fff", border: `0.5px solid #e5ddd0`, padding: "48px 40px", textAlign: "center" }}>
                <div style={{ width: 56, height: 56, background: "rgba(239,68,68,0.08)", border: `0.5px solid rgba(239,68,68,0.2)`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px", transform: "rotate(45deg)" }}>
                    <AlertTriangle size={22} style={{ color: "#dc2626", transform: "rotate(-45deg)" }} />
                </div>
                <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: GOLD, marginBottom: 10, fontFamily: "'Lato',sans-serif" }}>
                    Registry Notice
                </p>
                <h1 className="lan-serif" style={{ fontSize: 28, fontWeight: 700, color: NAVY, margin: "0 0 12px" }}>Asset Not Found</h1>
                <p style={{ fontSize: 13, color: "#888", lineHeight: 1.7, marginBottom: 20, fontWeight: 300 }}>
                    No record exists for this asset ID in the LAN Library Registry.
                </p>
                <div style={{ background: BG, border: `0.5px solid #e5ddd0`, padding: "10px 16px", marginBottom: 24, display: "inline-block" }}>
                    <span style={{ fontFamily: "monospace", fontSize: 12, color: NAVY, fontWeight: 700 }}>{assetId}</span>
                </div>
                <p style={{ fontSize: 12, color: "#aaa", lineHeight: 1.6, marginBottom: 28 }}>
                    If you believe this is an error, contact the LAN Abuja office with this ID.
                </p>
                <button onClick={() => router.back()} className="lan-btn-primary">
                    <ArrowLeft size={14} /> Go Back
                </button>
            </div>
        </div>
    );

    /* ── ERROR ── */
    if (state === "error") return (
        <div className="lan-verify verify-hero-bg" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", padding: 24 }}>
            <Styles />
            <div className="anim-up" style={{ maxWidth: 420, width: "100%", background: "#fff", border: `0.5px solid #e5ddd0`, padding: "48px 40px", textAlign: "center" }}>
                <div style={{ width: 56, height: 56, background: "rgba(245,158,11,0.08)", border: `0.5px solid rgba(245,158,11,0.2)`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px", transform: "rotate(45deg)" }}>
                    <AlertTriangle size={22} style={{ color: "#d97706", transform: "rotate(-45deg)" }} />
                </div>
                <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: GOLD, marginBottom: 10, fontFamily: "'Lato',sans-serif" }}>
                    Connection Issue
                </p>
                <h1 className="lan-serif" style={{ fontSize: 28, fontWeight: 700, color: NAVY, margin: "0 0 12px" }}>Registry Unreachable</h1>
                <p style={{ fontSize: 13, color: "#888", lineHeight: 1.7, marginBottom: 32, fontWeight: 300 }}>
                    Could not reach the LAN Library Registry. Please check your connection and try again.
                </p>
                <button onClick={() => window.location.reload()} className="lan-btn-primary">
                    <RefreshCw size={14} /> Retry
                </button>
            </div>
        </div>
    );

    /* ── FOUND ── */
    const sm = statusMeta(inv.status);
    const pct = inv.totalConsignment > 0 ? Math.round((inv.currentStock / inv.totalConsignment) * 100) : 0;
    const collectedCount = orders.filter(o => o.status === "collected").length;
    const initials = (inv.sellerName || "?").split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();

    const DetailRow = ({ icon: Icon, label, value }) => value ? (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "11px 0", borderBottom: "0.5px solid #f5f0e8" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Icon size={12} style={{ color: GOLD, flexShrink: 0 }} />
                <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "#aaa", fontFamily: "'Lato',sans-serif" }}>{label}</span>
            </div>
            <span style={{ fontSize: 13, color: NAVY, fontWeight: 700, fontFamily: "'Lato',sans-serif", textAlign: "right", maxWidth: "55%", lineHeight: 1.4 }}>{value}</span>
        </div>
    ) : null;

    return (
        <div className="lan-verify">
            <Styles />

            {/* ── Hero Banner ─────────────────────────────────── */}
            <div className="verify-hero-bg anim-up" style={{ padding: "52px 24px 0" }}>
                {/* Back */}
                <div style={{ maxWidth: 760, margin: "0 auto 36px" }} className="no-print">
                    <button onClick={() => router.back()} style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "none", border: "none", cursor: "pointer", color: "rgba(245,240,232,0.5)", fontSize: 12, fontWeight: 700, letterSpacing: "0.06em", fontFamily: "'Lato',sans-serif", textTransform: "uppercase", transition: "color 0.18s", padding: 0 }}
                        onMouseEnter={e => e.currentTarget.style.color = "rgba(245,240,232,0.9)"}
                        onMouseLeave={e => e.currentTarget.style.color = "rgba(245,240,232,0.5)"}
                    >
                        <ArrowLeft size={13} /> Back
                    </button>
                </div>

                <div style={{ maxWidth: 760, margin: "0 auto" }}>
                    {/* Eyebrow */}
                    <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(184,150,62,0.14)", border: `1px solid rgba(184,150,62,0.3)`, borderRadius: 999, padding: "7px 16px", marginBottom: 24 }}>
                        <ShieldCheck size={13} style={{ color: GOLD }} />
                        <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: GOLDD, fontFamily: "'Lato',sans-serif" }}>
                            LAN Library Registry · Verified
                        </span>
                    </div>

                    {/* Title */}
                    <h1 className="lan-serif anim-up-2" style={{ fontSize: "clamp(30px,5vw,52px)", fontWeight: 900, color: "#fff", lineHeight: 1.05, letterSpacing: "-1px", margin: "0 0 12px" }}>
                        {inv.bookTitle}
                    </h1>

                    <p className="anim-up-3" style={{ fontSize: 14, color: "rgba(245,240,232,0.55)", fontWeight: 300, marginBottom: 0 }}>
                        {inv.courseCode && <><span style={{ color: GOLD, fontWeight: 700 }}>{inv.courseCode}</span> · </>}
                        {inv.publisher} {inv.edition && `· ${inv.edition}`}
                    </p>

                    {/* Status + Asset ID strip */}
                    <div className="anim-up-4" style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 12, borderTop: "0.5px solid rgba(184,150,62,0.2)", marginTop: 32, paddingTop: 20, paddingBottom: 28 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <span style={{ width: 8, height: 8, borderRadius: "50%", background: sm.dot, display: "inline-block", boxShadow: `0 0 8px ${sm.dot}` }} />
                            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(245,240,232,0.7)", fontFamily: "'Lato',sans-serif" }}>{sm.label}</span>
                        </div>
                        <div style={{ fontFamily: "monospace", fontSize: 11, color: "rgba(184,150,62,0.7)", background: "rgba(184,150,62,0.08)", border: "0.5px solid rgba(184,150,62,0.2)", padding: "5px 12px", letterSpacing: "0.1em" }}>
                            {assetId}
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Main content ────────────────────────────────── */}
            <div style={{ maxWidth: 760, margin: "0 auto", padding: "28px 24px 64px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 16 }}>

                    {/* ── Book Details card ── */}
                    <div className="verify-card anim-up-2" style={{ padding: "28px 28px 20px" }}>
                        <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", color: GOLD, marginBottom: 20, fontFamily: "'Lato',sans-serif" }}>
                            Book Details
                        </p>
                        <DetailRow icon={Hash} label="ISBN" value={inv.isbn} />
                        <DetailRow icon={BookOpen} label="Publisher" value={inv.publisher} />
                        <DetailRow icon={BookOpen} label="Edition" value={inv.edition} />
                        <DetailRow icon={MapPin} label="Location" value={inv.shelfLocation || "Abuja Head Office"} />
                        <DetailRow icon={Calendar} label="Checked In" value={fmtDate(inv.checkedInAt)} />
                    </div>

                    {/* ── Stock + Seller side-by-side on wider screens ── */}
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>

                        {/* Stock */}
                        <div className="verify-card anim-up-3" style={{ padding: 28 }}>
                            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", color: GOLD, marginBottom: 20, fontFamily: "'Lato',sans-serif" }}>
                                Stock Level
                            </p>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 14 }}>
                                <span className="lan-serif" style={{ fontSize: 32, fontWeight: 700, color: NAVY }}>{inv.currentStock}</span>
                                <span style={{ fontSize: 12, color: "#bbb", fontFamily: "'Lato',sans-serif" }}>of {inv.totalConsignment} total</span>
                            </div>
                            <div style={{ width: "100%", height: 4, background: "#f0ebe0", borderRadius: 2, overflow: "hidden", marginBottom: 10 }}>
                                <div style={{
                                    height: "100%", borderRadius: 2,
                                    width: `${pct}%`,
                                    background: pct > 50 ? "#22c55e" : pct > 20 ? "#f59e0b" : "#ef4444",
                                    transition: "width 0.8s cubic-bezier(0.4,0,0.2,1)"
                                }} />
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.06em", color: "#aaa", fontFamily: "'Lato',sans-serif", textTransform: "uppercase" }}>Remaining</span>
                                <span style={{ fontSize: 12, fontWeight: 700, color: NAVY, fontFamily: "'Lato',sans-serif" }}>{pct}%</span>
                            </div>
                        </div>

                        {/* Seller */}
                        <div className="verify-card anim-up-3" style={{ padding: 28 }}>
                            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", color: GOLD, marginBottom: 20, fontFamily: "'Lato',sans-serif" }}>
                                Registered Seller
                            </p>
                            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                                <div style={{ width: 44, height: 44, background: NAVY, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                    <span style={{ fontSize: 14, fontWeight: 700, color: GOLD, fontFamily: "'Lato',sans-serif" }}>{initials}</span>
                                </div>
                                <div>
                                    <p style={{ fontSize: 15, fontWeight: 700, color: NAVY, margin: "0 0 3px", fontFamily: "'Playfair Display',serif" }}>{inv.sellerName || "—"}</p>
                                    <p style={{ fontSize: 11, color: "#aaa", margin: 0, fontFamily: "'Lato',sans-serif" }}>
                                        Since {fmtDate(inv.registeredAt || inv.createdAt || inv.checkedInAt)}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ── Orders ── */}
                    {orders.length > 0 && (
                        <div className="verify-card anim-up-3" style={{ padding: 28 }}>
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
                                <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", color: GOLD, margin: 0, fontFamily: "'Lato',sans-serif" }}>
                                    Order History
                                </p>
                                <div style={{ display: "flex", gap: 16, fontSize: 11, fontFamily: "'Lato',sans-serif" }}>
                                    <span style={{ color: "#aaa" }}>{orders.length} orders</span>
                                    <span style={{ color: "#16a34a", fontWeight: 700 }}>{collectedCount} collected</span>
                                </div>
                            </div>
                            {orders.map(o => {
                                const om = orderStatusMeta(o.status);
                                return (
                                    <div key={o.id} className="order-row" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                                        <div>
                                            <p style={{ fontFamily: "monospace", fontSize: 12, color: NAVY, fontWeight: 700, margin: "0 0 3px" }}>{o.pickupCode || "—"}</p>
                                            <p style={{ fontSize: 10, color: "#bbb", margin: 0, fontFamily: "'Lato',sans-serif" }}>
                                                <Package size={9} style={{ display: "inline", marginRight: 4, verticalAlign: "middle" }} />
                                                {o.collectedAt ? fmtDateTime(o.collectedAt) : fmtDateTime(o.createdAt)}
                                            </p>
                                        </div>
                                        <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", padding: "4px 10px", background: om.bg, color: om.text, fontFamily: "'Lato',sans-serif", whiteSpace: "nowrap" }}>
                                            {om.label}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* ── QR + Link card ── */}
                    <div className="anim-up-4" style={{ background: NAVY, backgroundImage: "radial-gradient(rgba(184,150,62,0.06) 1px,transparent 1px)", backgroundSize: "22px 22px", padding: "36px 28px", display: "flex", flexWrap: "wrap", gap: 32, alignItems: "center", justifyContent: "center" }}>
                        {/* QR */}
                        <div style={{ background: "#fff", padding: 14, display: "inline-block" }}>
                            <QRCodeSVG value={verifyUrl} size={120} fgColor={NAVY} level="H" includeMargin={false} />
                        </div>
                        {/* right side */}
                        <div style={{ flex: 1, minWidth: 200 }}>
                            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", color: GOLD, marginBottom: 12, fontFamily: "'Lato',sans-serif" }}>
                                Scan to Verify
                            </p>
                            <p className="lan-serif" style={{ fontSize: 18, fontWeight: 700, color: "#fff", margin: "0 0 16px", lineHeight: 1.3 }}>
                                Share this verification link
                            </p>
                            <div style={{ background: "rgba(255,255,255,0.06)", border: "0.5px solid rgba(184,150,62,0.2)", padding: "10px 14px", marginBottom: 14 }}>
                                <span style={{ fontFamily: "monospace", fontSize: 10, color: "rgba(245,240,232,0.5)", wordBreak: "break-all", lineHeight: 1.6 }}>{verifyUrl}</span>
                            </div>
                            <button
                                onClick={handleCopy}
                                style={{ display: "inline-flex", alignItems: "center", gap: 7, background: "rgba(184,150,62,0.15)", border: `0.5px solid rgba(184,150,62,0.3)`, padding: "8px 16px", cursor: "pointer", fontSize: 11, fontWeight: 700, color: GOLDD, fontFamily: "'Lato',sans-serif", letterSpacing: "0.08em", transition: "background 0.18s" }}
                                onMouseEnter={e => e.currentTarget.style.background = "rgba(184,150,62,0.25)"}
                                onMouseLeave={e => e.currentTarget.style.background = "rgba(184,150,62,0.15)"}
                            >
                                {copied
                                    ? <><CheckCircle size={12} style={{ color: "#22c55e" }} /> Copied!</>
                                    : <><Copy size={12} /> Copy Link</>
                                }
                            </button>
                        </div>
                    </div>

                    {/* ── Actions ── */}
                    <div className="anim-up-4 no-print" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))", gap: 10 }}>
                        <button
                            onClick={() => window.open(`/book/preview?id=${String(inv.bookId).replace("firestore-", "")}`, "_blank")}
                            className="lan-btn-primary"
                        >
                            <ExternalLink size={14} /> View Digital Version
                        </button>
                        <button onClick={() => window.print()} className="lan-btn-ghost">
                            <Printer size={14} /> Print / Save Label
                        </button>
                    </div>

                    {/* ── Footer stamp ── */}
                    <div style={{ borderTop: "0.5px solid #e5ddd0", paddingTop: 24, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <div style={{ width: 28, height: 28, border: `1.5px solid ${NAVY}`, display: "flex", alignItems: "center", justifyContent: "center", transform: "rotate(45deg)" }}>
                                <ShieldCheck size={12} style={{ color: NAVY, transform: "rotate(-45deg)" }} />
                            </div>
                            <div>
                                <p style={{ fontSize: 10, fontWeight: 700, color: NAVY, margin: "0 0 1px", fontFamily: "'Lato',sans-serif", letterSpacing: "0.08em", textTransform: "uppercase" }}>Official LAN Document</p>
                                <p style={{ fontSize: 9, color: "#bbb", margin: 0, fontFamily: "'Lato',sans-serif" }}>Learning Access Network · Abuja</p>
                            </div>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <Star size={10} style={{ color: GOLD, fill: GOLD }} />
                            <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: "#ccc", fontFamily: "'Lato',sans-serif" }}>Secured Registry</span>
                            <Star size={10} style={{ color: GOLD, fill: GOLD }} />
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}