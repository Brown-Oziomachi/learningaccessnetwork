
"use client";
/**
 * PrintLicenseLedger.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Admin-only panel. Add to your admin NAV_SECTIONS:
 *
 *   { id: 'print-license-ledger', icon: Receipt, label: 'Print License Ledger' }
 *
 * Then render inside the page content block:
 *   {activeSection === 'print-license-ledger' && (
 *     <PrintLicenseLedger user={user} db={db} />
 *   )}
 *
 * Firestore paths:
 *   print_licenses/{id}   — each issued license record
 *   advertMyBook/{bookId} — updated via Global Safety Freeze toggle
 *   admin_audit_logs/{id} — immutable audit trail
 *
 * Access: renders only for browncemmanuel@gmail.com | lanlibrarydocs@gmail.com
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { useState, useEffect, useCallback } from "react";
import {
    collection,
    query,
    orderBy,
    getDocs,
    doc,
    updateDoc,
    addDoc,
    serverTimestamp,
    where,
} from "firebase/firestore";
import {
    Receipt,
    RefreshCw,
    DollarSign,
    Users,
    BookOpen,
    ShieldOff,
    ShieldCheck,
    AlertTriangle,
    Search,
    Filter,
    Download,
    Snowflake,
    Flame,
    Eye,
    TrendingUp,
    Info,
    Lock,
    Unlock,
} from "lucide-react";

/* ── Authorised admin emails (mirrors your Firestore security rules) ─── */
const ADMIN_EMAILS = ["browncemmanuel@gmail.com", "lanlibrarydocs@gmail.com"];

const isAdmin = (email) => ADMIN_EMAILS.includes(email?.toLowerCase());

/* ── Card style helper ─────────────────────────────────────────────── */
const card = (extra = {}) => ({
    background: "var(--card-bg)",
    border: "1px solid var(--card-border)",
    borderRadius: "var(--radius)",
    padding: "18px 20px",
    ...extra,
});

/* ── Stat card ─────────────────────────────────────────────────────── */
function StatCard({ label, value, sub, icon, color }) {
    return (
        <div style={{ ...card(), display: "flex", alignItems: "center", gap: 14 }}>
            <div
                style={{
                    width: 44,
                    height: 44,
                    borderRadius: 10,
                    background: `${color}18`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color,
                    flexShrink: 0,
                }}
            >
                {icon}
            </div>
            <div>
                <div
                    style={{
                        fontSize: 10,
                        color: "var(--text-muted)",
                        fontWeight: 700,
                        textTransform: "uppercase",
                        letterSpacing: "0.06em",
                    }}
                >
                    {label}
                </div>
                <div
                    style={{
                        fontSize: 22,
                        fontWeight: 700,
                        color: "var(--text-primary)",
                        lineHeight: 1.2,
                        marginTop: 2,
                    }}
                >
                    {value}
                </div>
                {sub && (
                    <div
                        style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}
                    >
                        {sub}
                    </div>
                )}
            </div>
        </div>
    );
}

/* ── Freeze button ─────────────────────────────────────────────────── */
function FreezeButton({ bookId, bookTitle, frozen, adminEmail, onToggle }) {
    const [loading, setLoading] = useState(false);

    const handleClick = async () => {
        if (
            !confirm(
                `${frozen ? "Unfreeze" : "Freeze"} "${bookTitle}"?\n\n${frozen ? "Students will be able to access this book again." : "All student access and print rights will be immediately suspended."}`,
            )
        )
            return;
        setLoading(true);
        try {
            await onToggle(bookId, bookTitle, !frozen);
        } finally {
            setLoading(false);
        }
    };

    return (
        <button
            onClick={handleClick}
            disabled={loading}
            style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                padding: "5px 12px",
                borderRadius: "var(--radius-sm)",
                fontSize: 11,
                fontWeight: 700,
                cursor: loading ? "wait" : "pointer",
                border: frozen
                    ? "1px solid rgba(16,185,129,0.25)"
                    : "1px solid rgba(239,68,68,0.25)",
                background: frozen ? "rgba(16,185,129,0.10)" : "rgba(239,68,68,0.10)",
                color: frozen ? "#34d399" : "#f87171",
                transition: "all 0.18s",
                opacity: loading ? 0.6 : 1,
            }}
        >
            {loading ? (
                <span
                    style={{
                        width: 12,
                        height: 12,
                        border: "2px solid rgba(255,255,255,0.3)",
                        borderTopColor: "#fff",
                        borderRadius: "50%",
                        animation: "spin 0.7s linear infinite",
                        display: "inline-block",
                    }}
                />
            ) : frozen ? (
                <>
                    <Unlock size={11} /> Unfreeze
                </>
            ) : (
                <>
                    <Snowflake size={11} /> Freeze
                </>
            )}
        </button>
    );
}

/* ── Main component ─────────────────────────────────────────────────── */
export default function PrintLicenseLedger({ user, db }) {
    /* ── Access gate ── */
    if (!user || !isAdmin(user.email)) {
        return (
            <div
                style={{
                    ...card(),
                    maxWidth: 480,
                    margin: "60px auto",
                    textAlign: "center",
                }}
            >
                <Lock
                    size={40}
                    color="#ef4444"
                    style={{ margin: "0 auto 16px", display: "block" }}
                />
                <div
                    style={{
                        fontSize: 16,
                        fontWeight: 700,
                        color: "var(--text-primary)",
                        marginBottom: 8,
                    }}
                >
                    Access Restricted
                </div>
                <div style={{ fontSize: 13, color: "var(--text-muted)" }}>
                    This panel is restricted to authorised LAN administrators only.
                </div>
            </div>
        );
    }

    const [licenses, setLicenses] = useState([]);
    const [books, setBooks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [booksLoading, setBooksLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [toast, setToast] = useState(null);

    const flash = (msg, type = "success") => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3400);
    };

    /* fetch all print licenses */
    const fetchLicenses = useCallback(async () => {
        setLoading(true);
        try {
            const snap = await getDocs(
                query(collection(db, "print_licenses"), orderBy("createdAt", "desc")),
            );
            setLicenses(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        } catch (err) {
            flash("Could not load ledger: " + err.message, "danger");
        } finally {
            setLoading(false);
        }
    }, [db]);

    /* fetch books for freeze control */
    const fetchBooks = useCallback(async () => {
        setBooksLoading(true);
        try {
            const snap = await getDocs(
                query(
                    collection(db, "advertMyBook"),
                    where("status", "==", "approved"),
                ),
            );
            setBooks(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        } catch (err) {
            console.error(err);
        } finally {
            setBooksLoading(false);
        }
    }, [db]);

    useEffect(() => {
        fetchLicenses();
        fetchBooks();
    }, [fetchLicenses, fetchBooks]);

    /* global safety freeze toggle */
    const handleFreeze = async (bookId, bookTitle, newFrozen) => {
        try {
            // Force fresh token so email claim is present in Firestore rules
            const { auth } = await import('@/lib/firebaseConfig');
            await auth.currentUser?.getIdToken(true);

            const updatePayload = {
                isGloballyFrozen: newFrozen,
                frozenAt: newFrozen ? serverTimestamp() : null,
                frozenBy: newFrozen ? user.email : null,
            };

            if (newFrozen) {
                updatePayload.isPrintLicensingEnabled = false;
            }

            await updateDoc(doc(db, "advertMyBook", bookId), updatePayload);

            await addDoc(collection(db, "admin_audit_logs"), {
                actor: user.email,
                actorId: user.uid,
                action: newFrozen ? "global_safety_freeze" : "global_safety_unfreeze",
                target: bookId,
                targetTitle: bookTitle,
                source: "admin_print_license_ledger",
                ts: serverTimestamp(),
            });

            setBooks((prev) =>
                prev.map((b) =>
                    b.id === bookId
                        ? {
                            ...b,
                            isGloballyFrozen: newFrozen,
                            isPrintLicensingEnabled: newFrozen ? false : b.isPrintLicensingEnabled,
                        }
                        : b,
                ),
            );

            flash(
                newFrozen
                    ? `❄️ "${bookTitle}" frozen. All student access suspended.`
                    : `✅ "${bookTitle}" unfrozen. Access restored.`,
                newFrozen ? "warn" : "success",
            );
        } catch (err) {
            flash("Freeze action failed: " + err.message, "danger");
        }
    };

    /* ── Aggregate stats ── */
    const totalVolume = licenses.reduce((s, l) => s + (l.totalAmount || 0), 0);
    const totalCommission = licenses.reduce(
        (s, l) => s + (l.adminCommission || 0),
        0,
    );
    const totalRoyalties = licenses.reduce(
        (s, l) => s + (l.sellerRoyalty || 0),
        0,
    );
    const frozenBooks = books.filter((b) => b.isGloballyFrozen).length;

    /* ── Filter ── */
    const filteredLicenses = licenses.filter(
        (l) =>
            !search ||
            l.studentEmail?.toLowerCase().includes(search.toLowerCase()) ||
            l.bookTitle?.toLowerCase().includes(search.toLowerCase()) ||
            l.sellerName?.toLowerCase().includes(search.toLowerCase()),
    );

    const filteredBooks = books.filter(
        (b) =>
            !search ||
            b.bookTitle?.toLowerCase().includes(search.toLowerCase()) ||
            b.sellerName?.toLowerCase().includes(search.toLowerCase()),
    );

    const fmt = (ts) => {
        if (!ts) return "—";
        const d = ts.toDate ? ts.toDate() : new Date(ts);
        return d.toLocaleDateString("en-NG", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    /* ── Render ── */
    return (
        <>
            <style>{`
        @keyframes spin { to { transform:rotate(360deg); } }
        @keyframes fadeIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        .pll-tr:hover td { background:rgba(255,255,255,0.02) !important; }
        .pll-tr td { border-bottom:1px solid rgba(255,255,255,0.04); vertical-align:middle; }
      `}</style>

            {/* Section header */}
            <div
                style={{
                    display: "flex",
                    alignItems: "flex-start",
                    justifyContent: "space-between",
                    marginBottom: 24,
                }}
            >
                <div>
                    <div
                        style={{
                            fontSize: 16,
                            fontWeight: 700,
                            color: "var(--text-primary)",
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                        }}
                    >
                        <Receipt size={18} color="#b8963e" /> Print License Ledger
                    </div>
                    <div
                        style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 3 }}
                    >
                        Authenticated Admin Portal [legal@lanlibrary.com] — platform-wide
                        revenue splits &amp; freeze control
                    </div>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                    <button
                        onClick={() => {
                            fetchLicenses();
                            fetchBooks();
                        }}
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                            padding: "7px 14px",
                            borderRadius: "var(--radius-sm)",
                            fontSize: 12,
                            fontWeight: 600,
                            cursor: "pointer",
                            background: "var(--surface)",
                            border: "1px solid var(--card-border)",
                            color: "var(--text-secondary)",
                        }}
                    >
                        <RefreshCw size={13} /> Refresh
                    </button>
                </div>
            </div>

            {/* Stat cards */}
            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(4,1fr)",
                    gap: 14,
                    marginBottom: 24,
                }}
            >
                <StatCard
                    label="Total Volume"
                    value={`₦${totalVolume.toLocaleString()}`}
                    sub={`${licenses.length} licenses issued`}
                    icon={<DollarSign size={20} />}
                    color="#10b981"
                />
                <StatCard
                    label="Platform Commission (20%)"
                    value={`₦${totalCommission.toLocaleString()}`}
                    sub="Admin cut"
                    icon={<TrendingUp size={20} />}
                    color="#3b82f6"
                />
                <StatCard
                    label="Author Royalties (80%)"
                    value={`₦${totalRoyalties.toLocaleString()}`}
                    sub="Distributed to sellers"
                    icon={<Users size={20} />}
                    color="#8b5cf6"
                />
                <StatCard
                    label="Frozen Books"
                    value={frozenBooks}
                    sub={`of ${books.length} approved`}
                    icon={<Snowflake size={20} />}
                    color="#f59e0b"
                />
            </div>

            {/* Search bar */}
            <div style={{ marginBottom: 20, position: "relative" }}>
                <Search
                    size={14}
                    style={{
                        position: "absolute",
                        left: 12,
                        top: "50%",
                        transform: "translateY(-50%)",
                        color: "var(--text-muted)",
                        pointerEvents: "none",
                    }}
                />
                <input
                    className="input-dark"
                    placeholder="Search by student email, book title, or seller name…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    style={{ paddingLeft: 36 }}
                />
            </div>

            {/* ── Section 1: License Audit Stream ── */}
            <div style={{ marginBottom: 28 }}>
                <div
                    style={{
                        fontSize: 14,
                        fontWeight: 700,
                        color: "var(--text-primary)",
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        marginBottom: 14,
                    }}
                >
                    <Receipt size={15} color="#3b82f6" />
                    Historical License Audit Stream
                    <span
                        style={{
                            fontSize: 12,
                            fontWeight: 400,
                            color: "var(--text-muted)",
                        }}
                    >
                        ({filteredLicenses.length} records)
                    </span>
                </div>

                <div style={{ ...card({ padding: 0, overflow: "hidden" }) }}>
                    {loading ? (
                        <div
                            style={{ display: "flex", justifyContent: "center", padding: 48 }}
                        >
                            <div
                                style={{
                                    width: 32,
                                    height: 32,
                                    border: "2px solid rgba(59,130,246,0.3)",
                                    borderTopColor: "#3b82f6",
                                    borderRadius: "50%",
                                    animation: "spin 0.8s linear infinite",
                                }}
                            />
                        </div>
                    ) : filteredLicenses.length === 0 ? (
                        <div style={{ textAlign: "center", padding: 48 }}>
                            <Receipt
                                size={32}
                                color="var(--text-muted)"
                                style={{ margin: "0 auto 12px", display: "block" }}
                            />
                            <div style={{ color: "var(--text-muted)", fontSize: 14 }}>
                                No print license transactions found.
                            </div>
                        </div>
                    ) : (
                        <div style={{ overflowX: "auto" }}>
                            <table
                                style={{
                                    width: "100%",
                                    borderCollapse: "collapse",
                                    fontSize: 13,
                                }}
                            >
                                <thead>
                                    <tr style={{ borderBottom: "1px solid var(--card-border)" }}>
                                        {[
                                            "Timestamp",
                                            "Student Email",
                                            "Book Title",
                                            "Seller",
                                            "Total Paid",
                                            "Seller Royalty (80%)",
                                            "Platform Cut (20%)",
                                        ].map((h) => (
                                            <th
                                                key={h}
                                                style={{
                                                    padding: "10px 16px",
                                                    textAlign: "left",
                                                    fontSize: 10,
                                                    fontWeight: 700,
                                                    textTransform: "uppercase",
                                                    letterSpacing: "0.06em",
                                                    color: "var(--text-muted)",
                                                    whiteSpace: "nowrap",
                                                }}
                                            >
                                                {h}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredLicenses.map((lic) => (
                                        <tr
                                            key={lic.id}
                                            className="pll-tr"
                                            style={{ animation: "fadeIn 0.2s ease" }}
                                        >
                                            <td
                                                style={{
                                                    padding: "12px 16px",
                                                    fontSize: 11,
                                                    color: "var(--text-muted)",
                                                    whiteSpace: "nowrap",
                                                }}
                                            >
                                                {fmt(lic.createdAt)}
                                            </td>
                                            <td
                                                style={{
                                                    padding: "12px 16px",
                                                    color: "#60a5fa",
                                                    fontWeight: 500,
                                                }}
                                            >
                                                {lic.studentEmail || "—"}
                                            </td>
                                            <td
                                                style={{
                                                    padding: "12px 16px",
                                                    color: "var(--text-primary)",
                                                    fontWeight: 600,
                                                    maxWidth: 180,
                                                }}
                                            >
                                                <div
                                                    style={{
                                                        overflow: "hidden",
                                                        textOverflow: "ellipsis",
                                                        whiteSpace: "nowrap",
                                                    }}
                                                >
                                                    {lic.bookTitle || "—"}
                                                </div>
                                            </td>
                                            <td
                                                style={{
                                                    padding: "12px 16px",
                                                    color: "var(--text-secondary)",
                                                }}
                                            >
                                                {lic.sellerName || "—"}
                                            </td>
                                            <td
                                                style={{
                                                    padding: "12px 16px",
                                                    color: "#34d399",
                                                    fontWeight: 700,
                                                }}
                                            >
                                                ₦{Number(lic.totalAmount || 0).toLocaleString()}
                                            </td>
                                            <td
                                                style={{
                                                    padding: "12px 16px",
                                                    color: "#a78bfa",
                                                    fontWeight: 700,
                                                }}
                                            >
                                                ₦{Number(lic.sellerRoyalty || 0).toLocaleString()}
                                            </td>
                                            <td style={{ padding: "12px 16px" }}>
                                                <span
                                                    style={{
                                                        background: "rgba(245,158,11,0.12)",
                                                        color: "#fbbf24",
                                                        fontWeight: 700,
                                                        padding: "3px 9px",
                                                        borderRadius: 20,
                                                        fontSize: 12,
                                                    }}
                                                >
                                                    ₦{Number(lic.adminCommission || 0).toLocaleString()}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* ── Section 2: Global Safety Freeze Panel ── */}
            <div>
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        marginBottom: 8,
                    }}
                >
                    <Snowflake size={15} color="#f59e0b" />
                    <span
                        style={{
                            fontSize: 14,
                            fontWeight: 700,
                            color: "var(--text-primary)",
                        }}
                    >
                        Global Safety Freeze Control
                    </span>
                    <span
                        style={{
                            fontSize: 12,
                            fontWeight: 400,
                            color: "var(--text-muted)",
                        }}
                    >
                        ({filteredBooks.length} books)
                    </span>
                </div>
                <div
                    style={{
                        background: "rgba(245,158,11,0.07)",
                        border: "1px solid rgba(245,158,11,0.18)",
                        borderRadius: "var(--radius-sm)",
                        padding: "11px 14px",
                        marginBottom: 16,
                        display: "flex",
                        alignItems: "flex-start",
                        gap: 10,
                    }}
                >
                    <AlertTriangle
                        size={14}
                        color="#fbbf24"
                        style={{ flexShrink: 0, marginTop: 1 }}
                    />
                    <p
                        style={{
                            fontSize: 12,
                            color: "#fbbf24",
                            margin: 0,
                            lineHeight: 1.65,
                        }}
                    >
                        Freezing a book sets{" "}
                        <code
                            style={{
                                background: "rgba(255,255,255,0.08)",
                                padding: "1px 5px",
                                borderRadius: 4,
                            }}
                        >
                            isGloballyFrozen: true
                        </code>{" "}
                        and immediately disables <strong>all</strong> student access
                        (preview, purchase, and print licensing) regardless of seller
                        settings. Every action is logged to{" "}
                        <code
                            style={{
                                background: "rgba(255,255,255,0.08)",
                                padding: "1px 5px",
                                borderRadius: 4,
                            }}
                        >
                            admin_audit_logs
                        </code>
                        .
                    </p>
                </div>

                <div style={{ ...card({ padding: 0, overflow: "hidden" }) }}>
                    {booksLoading ? (
                        <div
                            style={{ display: "flex", justifyContent: "center", padding: 48 }}
                        >
                            <div
                                style={{
                                    width: 32,
                                    height: 32,
                                    border: "2px solid rgba(245,158,11,0.3)",
                                    borderTopColor: "#f59e0b",
                                    borderRadius: "50%",
                                    animation: "spin 0.8s linear infinite",
                                }}
                            />
                        </div>
                    ) : filteredBooks.length === 0 ? (
                        <div
                            style={{
                                textAlign: "center",
                                padding: 48,
                                color: "var(--text-muted)",
                                fontSize: 14,
                            }}
                        >
                            No approved books.
                        </div>
                    ) : (
                        <table
                            style={{
                                width: "100%",
                                borderCollapse: "collapse",
                                fontSize: 13,
                            }}
                        >
                            <thead>
                                <tr style={{ borderBottom: "1px solid var(--card-border)" }}>
                                    {[
                                        "Book Title",
                                        "Seller",
                                        "Price",
                                        "Print Licensing",
                                        "Freeze Status",
                                        "Action",
                                    ].map((h) => (
                                        <th
                                            key={h}
                                            style={{
                                                padding: "10px 16px",
                                                textAlign: "left",
                                                fontSize: 10,
                                                fontWeight: 700,
                                                textTransform: "uppercase",
                                                letterSpacing: "0.06em",
                                                color: "var(--text-muted)",
                                            }}
                                        >
                                            {h}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {filteredBooks.map((book) => (
                                    <tr
                                        key={book.id}
                                        className="pll-tr"
                                        style={{ animation: "fadeIn 0.2s ease" }}
                                    >
                                        <td style={{ padding: "13px 16px" }}>
                                            <div
                                                style={{
                                                    fontWeight: 600,
                                                    color: "var(--text-primary)",
                                                    maxWidth: 200,
                                                    overflow: "hidden",
                                                    textOverflow: "ellipsis",
                                                    whiteSpace: "nowrap",
                                                }}
                                            >
                                                {book.bookTitle || "Untitled"}
                                            </div>
                                            <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
                                                {book.category || "—"}
                                            </div>
                                        </td>
                                        <td
                                            style={{
                                                padding: "13px 16px",
                                                color: "var(--text-secondary)",
                                            }}
                                        >
                                            {book.sellerName || "—"}
                                        </td>
                                        <td
                                            style={{
                                                padding: "13px 16px",
                                                color: "#34d399",
                                                fontWeight: 700,
                                            }}
                                        >
                                            ₦{Number(book.price || 0).toLocaleString()}
                                        </td>
                                        <td style={{ padding: "13px 16px" }}>
                                            <span
                                                style={{
                                                    background: book.isPrintLicensingEnabled
                                                        ? "rgba(16,185,129,0.12)"
                                                        : "rgba(239,68,68,0.12)",
                                                    color: book.isPrintLicensingEnabled
                                                        ? "#34d399"
                                                        : "#f87171",
                                                    fontSize: 11,
                                                    fontWeight: 600,
                                                    padding: "3px 9px",
                                                    borderRadius: 20,
                                                }}
                                            >
                                                {book.isPrintLicensingEnabled ? "Enabled" : "Disabled"}
                                            </span>
                                        </td>
                                        <td style={{ padding: "13px 16px" }}>
                                            {book.isGloballyFrozen ? (
                                                <span
                                                    style={{
                                                        display: "inline-flex",
                                                        alignItems: "center",
                                                        gap: 5,
                                                        background: "rgba(59,130,246,0.12)",
                                                        color: "#60a5fa",
                                                        fontSize: 11,
                                                        fontWeight: 700,
                                                        padding: "3px 9px",
                                                        borderRadius: 20,
                                                    }}
                                                >
                                                    <Snowflake size={10} /> Frozen
                                                </span>
                                            ) : (
                                                <span
                                                    style={{
                                                        display: "inline-flex",
                                                        alignItems: "center",
                                                        gap: 5,
                                                        background: "rgba(16,185,129,0.10)",
                                                        color: "#34d399",
                                                        fontSize: 11,
                                                        fontWeight: 600,
                                                        padding: "3px 9px",
                                                        borderRadius: 20,
                                                    }}
                                                >
                                                    <Flame size={10} /> Active
                                                </span>
                                            )}
                                        </td>
                                        <td style={{ padding: "13px 16px" }}>
                                            <FreezeButton
                                                bookId={book.id}
                                                bookTitle={book.bookTitle}
                                                frozen={book.isGloballyFrozen}
                                                adminEmail={user.email}
                                                onToggle={handleFreeze}
                                            />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* Toast */}
            {toast && (
                <div
                    style={{
                        position: "fixed",
                        bottom: 24,
                        right: 24,
                        zIndex: 999,
                        background:
                            toast.type === "success"
                                ? "rgba(16,185,129,0.97)"
                                : toast.type === "warn"
                                    ? "rgba(245,158,11,0.97)"
                                    : "rgba(239,68,68,0.97)",
                        color: "#fff",
                        padding: "12px 20px",
                        borderRadius: "var(--radius-sm)",
                        fontSize: 13,
                        fontWeight: 600,
                        boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
                        maxWidth: 380,
                        animation: "fadeIn 0.25s ease",
                    }}
                >
                    {toast.msg}
                </div>
            )}
        </>
    );
}
