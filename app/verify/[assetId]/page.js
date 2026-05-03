"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
    ShieldCheck, BookOpen, MapPin, Package,
    Hash, Calendar, RefreshCw, AlertTriangle,
    Loader2, ArrowLeft, Copy, ExternalLink, CheckCircle,
    ClipboardList, BookMarked, Barcode
} from "lucide-react";
import { collection, query, where, getDocs, limit, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebaseConfig";
import { QRCodeSVG } from "qrcode.react";

/* ─── helpers ─────────────────────────────────────────────────── */
const fmtDate = (ts) => {
    if (!ts) return "—";
    const d = ts?.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleDateString("en-NG", { day: "2-digit", month: "short", year: "numeric" });
};

const fmtDateTime = (ts) => {
    if (!ts) return "—";
    const d = ts?.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleString("en-NG", {
        day: "2-digit", month: "short", year: "numeric",
        hour: "2-digit", minute: "2-digit",
    });
};

const stockColor = (pct) =>
    pct > 50 ? "text-green-600" : pct > 20 ? "text-amber-500" : "text-red-500";

const stockBg = (pct) =>
    pct > 50 ? "bg-green-500" : pct > 20 ? "bg-amber-400" : "bg-red-500";

const statusMeta = (s) => ({
    in_stock: { label: "In Stock", cls: "text-green-600 bg-green-50 border-green-200" },
    low_stock: { label: "Low Stock", cls: "text-amber-600 bg-amber-50 border-amber-200" },
    out_of_stock: { label: "Out of Stock", cls: "text-red-600 bg-red-50 border-red-200" },
}[s] || { label: "Active Deposit", cls: "text-green-600 bg-green-50 border-green-200" });

const orderStatusMeta = (s) => ({
    collected: { label: "Collected", cls: "text-green-600 bg-green-50 border-green-200" },
    pending: { label: "Pending", cls: "text-amber-600 bg-amber-50 border-amber-200" },
    cancelled: { label: "Cancelled", cls: "text-red-500 bg-red-50 border-red-200" },
}[s] || { label: s, cls: "text-slate-500 bg-slate-50 border-slate-200" });

/* ═══════════════════════════════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════════════════════════════ */
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

    /* ── Fetch ── */
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
                        query(
                            collection(db, "physicalOrders"),
                            where("assetId", "==", assetId),
                            orderBy("createdAt", "desc"),
                            limit(5)
                        )
                    );
                    setOrders(ordSnap.docs.map(d => ({ id: d.id, ...d.data() })));
                } catch { /* orders optional */ }

                setState("found");
            } catch (e) {
                console.error(e);
                setState("error");
            }
        })();
    }, [assetId]);

    /* ── Copy URL ── */
    const handleCopy = () => {
        navigator.clipboard?.writeText(verifyUrl).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };

    /* ══════════ LOADING ══════════ */
    if (state === "loading") return (
        <div className="min-h-screen bg-blue-950 flex flex-col items-center justify-center p-4">
            <div className="flex flex-col items-center gap-4">
                <div className="bg-blue-900 p-5 rounded-full">
                    <Loader2 className="text-yellow-400 w-10 h-10 animate-spin" />
                </div>
                <p className="text-blue-300 text-sm font-medium tracking-widest uppercase">
                    Checking Registry…
                </p>
            </div>
        </div>
    );

    /* ══════════ NOT FOUND ══════════ */
    if (state === "notfound") return (
        <div className="min-h-screen bg-blue-950 flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-md bg-white rounded-3xl overflow-hidden shadow-2xl border-t-8 border-red-500">
                <div className="p-8 text-center">
                    <div className="flex justify-center mb-4">
                        <div className="bg-red-50 p-4 rounded-full">
                            <AlertTriangle className="text-red-500 w-12 h-12" />
                        </div>
                    </div>
                    <h1 className="text-2xl font-black text-blue-950 uppercase tracking-tight">Not Found</h1>
                    <p className="text-gray-500 text-sm mb-2">No registry record for:</p>
                    <p className="font-mono font-bold text-blue-900 bg-slate-100 rounded-lg px-4 py-2 mb-6 text-sm inline-block">
                        {assetId}
                    </p>
                    <p className="text-xs text-gray-400 mb-6 leading-relaxed">
                        This asset ID does not exist in the LAN Library Registry.
                        If you believe this is an error, please contact the Abuja office.
                    </p>
                    <button
                        onClick={() => router.back()}
                        className="w-full bg-blue-950 text-white font-bold py-4 rounded-xl hover:bg-blue-900 transition-colors flex items-center justify-center gap-2"
                    >
                        <ArrowLeft size={16} /> Go Back
                    </button>
                    <p className="mt-4 text-[10px] text-gray-400 italic uppercase tracking-widest">
                        Official LAN Library Secured Document
                    </p>
                </div>
            </div>
        </div>
    );

    /* ══════════ ERROR ══════════ */
    if (state === "error") return (
        <div className="min-h-screen bg-blue-950 flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-md bg-white rounded-3xl overflow-hidden shadow-2xl border-t-8 border-amber-400">
                <div className="p-8 text-center">
                    <div className="flex justify-center mb-4">
                        <div className="bg-amber-50 p-4 rounded-full">
                            <AlertTriangle className="text-amber-500 w-12 h-12" />
                        </div>
                    </div>
                    <h1 className="text-2xl font-black text-blue-950 uppercase tracking-tight">Registry Error</h1>
                    <p className="text-gray-500 text-sm mb-6">
                        Could not reach the LAN Library Registry. Please check your connection and try again.
                    </p>
                    <button
                        onClick={() => window.location.reload()}
                        className="w-full bg-blue-950 text-white font-bold py-4 rounded-xl hover:bg-blue-900 transition-colors flex items-center justify-center gap-2"
                    >
                        <RefreshCw size={16} /> Retry
                    </button>
                </div>
            </div>
        </div>
    );

    /* ══════════ FOUND ══════════ */
    const sm = statusMeta(inv.status);
    const pct = inv.totalConsignment > 0
        ? Math.round((inv.currentStock / inv.totalConsignment) * 100)
        : 0;
    const totalOrders = orders.length;
    const collectedCount = orders.filter(o => o.status === "collected").length;

    return (
        <div className="min-h-screen bg-blue-950 flex flex-col items-center justify-start p-4 py-10">

            {/* ── Back button ── */}
            <div className="w-full max-w-5xl mb-4">
                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-2 text-blue-300 hover:text-white text-sm font-medium transition-colors"
                >
                    <ArrowLeft size={14} /> Back
                </button>
            </div>

            {/* ══════════ LAYOUT WRAPPER ══════════
                Mobile  → single column  (max-w-md centred)
                Desktop → two columns    (card left | sidebar right)
            ════════════════════════════════════ */}
            <div className="w-full max-w-md lg:max-w-5xl flex flex-col lg:flex-row gap-6 items-start">

                {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                    LEFT — main card
                    (identical look to original mobile card)
                ━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
                <div className="w-full lg:flex-1 bg-white rounded-3xl overflow-hidden shadow-2xl border-t-8 border-yellow-500">
                    <div className="p-8">

                        {/* ── Verified Header ── */}
                        <div className="text-center mb-6">
                            <div className="flex justify-center mb-4">
                                <div className="bg-green-100 p-4 rounded-full">
                                    <ShieldCheck className="text-green-600 w-12 h-12" />
                                </div>
                            </div>
                            <h1 className="text-2xl font-black text-blue-950 uppercase tracking-tight">
                                Verified Original
                            </h1>
                            <p className="text-gray-400 text-xs mt-1 uppercase tracking-widest">
                                LAN Library Registry Certification
                            </p>
                        </div>

                        {/* ── Book Details ── */}
                        <div className="bg-slate-50 rounded-2xl p-5 text-left mb-5 border border-slate-200">
                            <div className="flex items-start gap-3 mb-4 text-blue-900 font-bold border-b border-slate-200 pb-3">
                                <BookOpen size={18} className="flex-shrink-0 mt-0.5" />
                                <span className="text-sm leading-snug">{inv.bookTitle}</span>
                            </div>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-400 flex items-center gap-1.5">
                                        <Hash size={11} /> Asset ID
                                    </span>
                                    <span className="font-mono font-bold text-blue-950 text-xs">{inv.assetId}</span>
                                </div>
                                {inv.courseCode && (
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-400">Course</span>
                                        <span className="font-bold text-blue-950">{inv.courseCode}</span>
                                    </div>
                                )}
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-400">Status</span>
                                    <span className={`text-xs font-bold uppercase px-2 py-0.5 rounded-full border ${sm.cls}`}>
                                        {sm.label}
                                    </span>
                                </div>
                                <div className="flex justify-between items-start">
                                    <span className="text-gray-400 flex items-center gap-1.5">
                                        <MapPin size={11} /> Location
                                    </span>
                                    <span className="text-blue-950 font-medium text-xs text-right max-w-[55%] leading-snug">
                                        {inv.shelfLocation || "Abuja Head Office"}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-400 flex items-center gap-1.5">
                                        <Calendar size={11} /> Checked In
                                    </span>
                                    <span className="text-blue-950 font-medium text-xs">{fmtDate(inv.checkedInAt)}</span>
                                </div>
                            </div>
                        </div>

                        {/* ── Stock Bar ── */}
                        <div className="bg-slate-50 rounded-2xl p-4 mb-5 border border-slate-200">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                                    <Package size={11} /> Stock Level
                                </span>
                                <span className={`text-sm font-black ${stockColor(pct)}`}>
                                    {inv.currentStock} / {inv.totalConsignment}
                                </span>
                            </div>
                            <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
                                <div
                                    className={`h-full rounded-full transition-all duration-700 ${stockBg(pct)}`}
                                    style={{ width: `${pct}%` }}
                                />
                            </div>
                            <p className="text-[10px] text-gray-400 mt-1.5 text-right">{pct}% remaining</p>
                        </div>

                        {/* ── Seller (email removed) ── */}
                        <div className="bg-slate-50 rounded-2xl p-4 mb-5 border border-slate-200">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Seller</p>
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-10 h-10 rounded-full bg-blue-950 flex items-center justify-center text-yellow-400 font-black text-sm flex-shrink-0">
                                    {(inv.sellerName || "?").split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold text-blue-950 truncate">{inv.sellerName || "—"}</p>
                                    <p className="text-[10px] text-gray-400 mt-0.5">Registered Seller</p>
                                </div>
                                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border text-blue-700 bg-blue-50 border-blue-200 flex-shrink-0">
                                    Seller
                                </span>
                            </div>
                            {/* Date registered row (replaces email) */}
                            <div className="border-t border-slate-200 pt-3 flex justify-between items-center text-sm">
                                <span className="text-gray-400 flex items-center gap-1.5">
                                    <Calendar size={11} /> Date Registered
                                </span>
                                <span className="text-blue-950 font-medium text-xs">
                                    {fmtDate(inv.registeredAt || inv.createdAt || inv.checkedInAt)}
                                </span>
                            </div>
                        </div>

                        {/* ── QR Code — mobile only ── */}
                        <div className="flex flex-col items-center bg-slate-50 rounded-2xl p-5 mb-5 border border-slate-200 gap-3 lg:hidden">
                            <div className="bg-white p-3 rounded-xl border border-slate-200">
                                <QRCodeSVG value={verifyUrl} size={110} fgColor="#172554" level="H" includeMargin={false} />
                            </div>
                            <p className="text-[10px] text-gray-400 text-center font-mono break-all px-2">{verifyUrl}</p>
                            <button
                                onClick={handleCopy}
                                className="flex items-center gap-2 text-xs font-bold text-blue-700 hover:text-blue-900 transition-colors"
                            >
                                {copied
                                    ? <><CheckCircle size={13} className="text-green-500" /> Copied!</>
                                    : <><Copy size={13} /> Copy Verify URL</>
                                }
                            </button>
                        </div>

                        {/* ── Recent Orders — mobile only ── */}
                        {orders.length > 0 && (
                            <div className="bg-slate-50 rounded-2xl p-4 mb-5 border border-slate-200 lg:hidden">
                                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
                                    Recent Orders ({orders.length})
                                </p>
                                <div className="space-y-2">
                                    {orders.map((o) => {
                                        const om = orderStatusMeta(o.status);
                                        return (
                                            <div key={o.id} className="flex items-center justify-between gap-2">
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-[10px] text-gray-400 font-mono">{o.pickupCode}</p>
                                                </div>
                                                <div className="text-right flex-shrink-0">
                                                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${om.cls}`}>
                                                        {om.label}
                                                    </span>
                                                    <p className="text-[10px] text-gray-400 mt-0.5">
                                                        {o.collectedAt ? fmtDateTime(o.collectedAt) : fmtDateTime(o.createdAt)}
                                                    </p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* ── CTAs ── */}
                        <button
                            onClick={() => window.open(`/book/preview?id=${String(inv.bookId).replace("firestore-", "")}`, "_blank")}
                            className="w-full bg-blue-950 text-yellow-400 font-black py-4 rounded-xl hover:bg-blue-900 transition-colors shadow-lg shadow-blue-900/20 flex items-center justify-center gap-2 text-sm uppercase tracking-wide"
                        >
                            <ExternalLink size={15} /> View Digital Version
                        </button>

                        <button
                            onClick={() => window.print()}
                            className="w-full mt-3 bg-white text-blue-950 font-bold py-3 rounded-xl border-2 border-blue-950 hover:bg-slate-50 transition-colors flex items-center justify-center gap-2 text-sm"
                        >
                            Print / Save Label
                        </button>

                        <p className="mt-5 text-[10px] text-gray-400 italic uppercase tracking-widest text-center">
                            Official LAN Library Secured Document
                        </p>
                    </div>
                </div>

                {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                    RIGHT COLUMN — desktop only
                ━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
                <div className="hidden lg:flex flex-col gap-5 w-80 flex-shrink-0">

                    {/* QR Code */}
                    <div className="bg-white rounded-3xl shadow-2xl border-t-8 border-yellow-500 p-6 flex flex-col items-center gap-4">
                        <p className="text-xs font-black text-blue-950 uppercase tracking-widest">Scan to Verify</p>
                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                            <QRCodeSVG value={verifyUrl} size={160} fgColor="#172554" level="H" includeMargin={false} />
                        </div>
                        <p className="text-[10px] text-gray-400 text-center font-mono break-all">{verifyUrl}</p>
                        <button
                            onClick={handleCopy}
                            className="flex items-center gap-2 text-xs font-bold text-blue-700 hover:text-blue-900 transition-colors"
                        >
                            {copied
                                ? <><CheckCircle size={13} className="text-green-500" /> Copied!</>
                                : <><Copy size={13} /> Copy Verify URL</>
                            }
                        </button>
                    </div>

                    {/* Publisher / ISBN / Date Registered */}
                    <div className="bg-white rounded-3xl shadow-xl p-6 border border-slate-100">
                        <p className="text-xs font-black text-blue-950 uppercase tracking-widest mb-4 flex items-center gap-2">
                            <BookMarked size={13} /> Publication Details
                        </p>
                        <div className="space-y-3 text-sm">
                            <div className="flex justify-between items-center">
                                <span className="text-gray-400 flex items-center gap-1.5">
                                    <Barcode size={11} /> ISBN
                                </span>
                                <span className="font-mono font-bold text-blue-950 text-xs">
                                    {inv.isbn || "—"}
                                </span>
                            </div>
                            <div className="flex justify-between items-start">
                                <span className="text-gray-400">Publisher</span>
                                <span className="font-bold text-blue-950 text-xs text-right max-w-[55%] leading-snug">
                                    {inv.publisher || "—"}
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-400">Edition</span>
                                <span className="font-bold text-blue-950 text-xs">{inv.edition || "—"}</span>
                            </div>
                            <div className="flex justify-between items-center border-t border-slate-100 pt-3">
                                <span className="text-gray-400 flex items-center gap-1.5">
                                    <Calendar size={11} /> Date Registered
                                </span>
                                <span className="font-bold text-blue-950 text-xs">
                                    {fmtDate(inv.registeredAt || inv.createdAt || inv.checkedInAt)}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Order Stats */}
                    <div className="bg-white rounded-3xl shadow-xl p-6 border border-slate-100">
                        <p className="text-xs font-black text-blue-950 uppercase tracking-widest mb-4 flex items-center gap-2">
                            <ClipboardList size={13} /> Order Summary
                        </p>
                        <div className="grid grid-cols-2 gap-3 mb-4">
                            <div className="bg-slate-50 rounded-2xl p-3 text-center border border-slate-100">
                                <p className="text-2xl font-black text-blue-950">{totalOrders}</p>
                                <p className="text-[10px] text-gray-400 uppercase tracking-wider mt-0.5">Total Orders</p>
                            </div>
                            <div className="bg-green-50 rounded-2xl p-3 text-center border border-green-100">
                                <p className="text-2xl font-black text-green-600">{collectedCount}</p>
                                <p className="text-[10px] text-gray-400 uppercase tracking-wider mt-0.5">Collected</p>
                            </div>
                        </div>

                        {orders.length > 0 ? (
                            <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Recent Activity</p>
                                <div className="space-y-2">
                                    {orders.map((o) => {
                                        const om = orderStatusMeta(o.status);
                                        return (
                                            <div key={o.id} className="flex items-center justify-between gap-2 py-1.5 border-b border-slate-50 last:border-0">
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-[10px] text-gray-600 font-mono font-bold truncate">{o.pickupCode || "—"}</p>
                                                    <p className="text-[10px] text-gray-400">
                                                        {o.collectedAt ? fmtDateTime(o.collectedAt) : fmtDateTime(o.createdAt)}
                                                    </p>
                                                </div>
                                                <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border flex-shrink-0 ${om.cls}`}>
                                                    {om.label}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ) : (
                            <p className="text-xs text-gray-400 text-center py-2">No orders recorded yet.</p>
                        )}
                    </div>

                    {/* Quick Actions */}
                    <div className="bg-white rounded-3xl shadow-xl p-6 border border-slate-100">
                        <p className="text-xs font-black text-blue-950 uppercase tracking-widest mb-4">Quick Actions</p>
                        <div className="flex flex-col gap-3">
                            <button
                                onClick={() => window.open(`/book/preview?id=${String(inv.bookId).replace("firestore-", "")}`, "_blank")}
                                className="w-full bg-blue-950 text-yellow-400 font-black py-3 rounded-xl hover:bg-blue-900 transition-colors shadow-lg shadow-blue-900/20 flex items-center justify-center gap-2 text-xs uppercase tracking-wide"
                            >
                                <ExternalLink size={13} /> View Digital Version
                            </button>
                            <button
                                onClick={() => window.print()}
                                className="w-full bg-white text-blue-950 font-bold py-3 rounded-xl border-2 border-blue-950 hover:bg-slate-50 transition-colors flex items-center justify-center gap-2 text-xs"
                            >
                                Print / Save Label
                            </button>
                        </div>
                        <p className="mt-4 text-[10px] text-gray-400 italic uppercase tracking-widest text-center">
                            Official LAN Library Secured Document
                        </p>
                    </div>
                </div>
            </div>

            {/* ── Footer ── */}
            <p className="mt-6 text-blue-700 text-xs text-center">
                LAN Library — Abuja Registry &nbsp;·&nbsp; lan.ng
            </p>

            {/* ── Print styles ── */}
            <style jsx global>{`
                @media print {
                    body { background: white !important; }
                    button, nav { display: none !important; }
                    .shadow-2xl { box-shadow: none !important; }
                }
            `}</style>
        </div>
    );
}