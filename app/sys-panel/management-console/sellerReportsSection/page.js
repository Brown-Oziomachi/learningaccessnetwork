"use client";

import React, { useState, useEffect } from "react";
import {
    collection, query, orderBy, getDocs, updateDoc,
    doc, addDoc, serverTimestamp, deleteDoc,
} from "firebase/firestore";
import {
    Flag, RefreshCw, Search, X, Check, Trash2,
    Eye, ChevronDown, ChevronUp, ExternalLink,
    AlertTriangle, Shield, Clock, CheckCircle, XCircle,
    User, Mail, Calendar,
} from "lucide-react";
import { db } from "@/lib/firebaseConfig";

/* ─── Status config ─── */
const STATUS_CFG = {
    pending: { cls: "pill-warn", label: "Pending", icon: Clock },
    reviewing: { cls: "pill-info", label: "Reviewing", icon: Eye },
    resolved: { cls: "pill-success", label: "Resolved", icon: CheckCircle },
    dismissed: { cls: "pill-gray", label: "Dismissed", icon: XCircle },
};

const REASON_COLORS = {
    "Fraudulent Behaviour": "#f87171",
    "Fake Documents": "#f87171",
    "Spam or Scam": "#f87171",
    "Impersonation": "#fbbf24",
    "Poor Customer Service": "#94a3b8",
    "Incorrect Pricing": "#94a3b8",
    "Other": "#94a3b8",
};

export default function SellerReportsSection({ adminUser }) {
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("all");
    const [search, setSearch] = useState("");
    const [expanded, setExpanded] = useState(null);
    const [actionNote, setActionNote] = useState("");
    const [acting, setActing] = useState(null);

    useEffect(() => { loadReports(); }, []);

    const loadReports = async () => {
        setLoading(true);
        try {
            const q = query(
                collection(db, "sellerReports"),
                orderBy("createdAt", "desc")
            );
            const snap = await getDocs(q);
            setReports(snap.docs.map(d => ({
                id: d.id, ...d.data(),
                createdAt: d.data().createdAt?.toDate?.() || new Date(),
            })));
        } catch (e) {
            console.error("Error loading seller reports:", e);
        } finally {
            setLoading(false);
        }
    };

    /* ── Stats ── */
    const counts = {
        all: reports.length,
        pending: reports.filter(r => r.status === "pending").length,
        reviewing: reports.filter(r => r.status === "reviewing").length,
        resolved: reports.filter(r => r.status === "resolved").length,
        dismissed: reports.filter(r => r.status === "dismissed").length,
    };

    /* ── Filtered list ── */
    const filtered = reports.filter(r => {
        const matchStatus = filter === "all" || r.status === filter;
        const q = search.toLowerCase();
        const matchSearch = !q ||
            r.sellerName?.toLowerCase().includes(q) ||
            r.reporterEmail?.toLowerCase().includes(q) ||
            r.reason?.toLowerCase().includes(q) ||
            r.details?.toLowerCase().includes(q);
        return matchStatus && matchSearch;
    });

    /* ── Actions ── */
    const updateStatus = async (reportId, newStatus, note = "") => {
        setActing(reportId);
        try {
            await updateDoc(doc(db, "sellerReports", reportId), {
                status: newStatus,
                adminNote: note || null,
                reviewedBy: adminUser?.email || "admin",
                reviewedAt: serverTimestamp(),
            });

            /* Notify reporter if resolved or dismissed */
            const report = reports.find(r => r.id === reportId);
            if (report?.reportedBy && (newStatus === "resolved" || newStatus === "dismissed")) {
                await addDoc(collection(db, "notifications"), {
                    userId: report.reportedBy,
                    type: "report_update",
                    title: newStatus === "resolved"
                        ? "Your report has been resolved ✅"
                        : "Your report has been reviewed",
                    message: newStatus === "resolved"
                        ? `Action has been taken on your report against ${report.sellerName}.${note ? ` Note: ${note}` : ""}`
                        : `Your report against ${report.sellerName} was reviewed and dismissed.${note ? ` Reason: ${note}` : ""}`,
                    createdAt: serverTimestamp(),
                    read: false,
                });
            }

            await loadReports();
            setActionNote("");
            setExpanded(null);
        } catch (e) {
            alert("Failed: " + e.message);
        } finally {
            setActing(null);
        }
    };

    const deleteReport = async (reportId) => {
        if (!confirm("Permanently delete this report? This cannot be undone.")) return;
        try {
            await deleteDoc(doc(db, "sellerReports", reportId));
            setReports(prev => prev.filter(r => r.id !== reportId));
        } catch (e) {
            alert("Failed: " + e.message);
        }
    };

    const fmtDate = (d) => {
        if (!d) return "—";
        return d.toLocaleDateString("en-NG", {
            day: "2-digit", month: "short", year: "numeric",
            hour: "2-digit", minute: "2-digit",
        });
    };

    /* ── Loading ── */
    if (loading) return (
        <div style={{ display: "flex", justifyContent: "center", padding: 64 }}>
            <div style={{
                width: 32, height: 32,
                border: "2px solid rgba(59,130,246,0.3)",
                borderTopColor: "#3b82f6", borderRadius: "50%",
                animation: "spin 0.8s linear infinite",
            }} />
        </div>
    );

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

            {/* ── Stats ── */}
            <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
                gap: 12,
            }}>
                {[
                    { key: "all", label: "Total", color: "#60a5fa" },
                    { key: "pending", label: "Pending", color: "#fbbf24" },
                    { key: "reviewing", label: "Reviewing", color: "#60a5fa" },
                    { key: "resolved", label: "Resolved", color: "#34d399" },
                    { key: "dismissed", label: "Dismissed", color: "#94a3b8" },
                ].map(({ key, label, color }) => (
                    <div
                        key={key}
                        onClick={() => setFilter(key)}
                        style={{
                            background: filter === key ? "var(--surface2)" : "var(--card-bg)",
                            border: `1px solid ${filter === key ? "rgba(59,130,246,0.4)" : "var(--card-border)"}`,
                            borderRadius: "var(--radius)",
                            padding: "14px 16px",
                            cursor: "pointer",
                            transition: "all 0.15s",
                        }}
                    >
                        <div style={{
                            fontSize: 10, color: "var(--text-muted)",
                            textTransform: "uppercase", letterSpacing: "0.06em",
                            fontWeight: 700, marginBottom: 6,
                        }}>{label}</div>
                        <div style={{ fontSize: 22, fontWeight: 700, color }}>{counts[key]}</div>
                    </div>
                ))}
            </div>

            {/* ── Search + Refresh ── */}
            <div style={{ display: "flex", gap: 10 }}>
                <div style={{ position: "relative", flex: 1 }}>
                    <Search size={14} style={{
                        position: "absolute", left: 12, top: "50%",
                        transform: "translateY(-50%)", color: "var(--text-muted)",
                    }} />
                    <input
                        className="input-dark"
                        placeholder="Search by seller name, reporter email or reason…"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        style={{ paddingLeft: 36 }}
                    />
                </div>
                {search && (
                    <button className="btn btn-ghost" onClick={() => setSearch("")}>
                        <X size={13} />Clear
                    </button>
                )}
                <button className="btn btn-ghost" onClick={loadReports}>
                    <RefreshCw size={13} />Refresh
                </button>
            </div>

            <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                Showing {filtered.length} of {reports.length} reports
            </div>

            {/* ── Report cards ── */}
            {filtered.length === 0 ? (
                <div className="card" style={{ textAlign: "center", padding: 56 }}>
                    <Flag size={32} style={{ color: "var(--text-muted)", margin: "0 auto 12px", display: "block" }} />
                    <div style={{ color: "var(--text-muted)", fontSize: 14 }}>No reports found</div>
                </div>
            ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {filtered.map(report => {
                        const { cls, label: statusLabel } = STATUS_CFG[report.status] || STATUS_CFG.pending;
                        const isOpen = expanded === report.id;
                        const reasonColor = REASON_COLORS[report.reason] || "#94a3b8";

                        return (
                            <div
                                key={report.id}
                                className="card"
                                style={{
                                    padding: 0, overflow: "hidden",
                                    borderLeft: `3px solid ${report.status === "pending" ? "#f59e0b" : report.status === "resolved" ? "#10b981" : "var(--card-border)"}`,
                                }}
                            >
                                {/* ── Row ── */}
                                <div
                                    style={{
                                        display: "grid",
                                        gridTemplateColumns: "1fr 1fr 1fr auto auto",
                                        alignItems: "center",
                                        gap: 16,
                                        padding: "16px 20px",
                                        cursor: "pointer",
                                    }}
                                    onClick={() => setExpanded(isOpen ? null : report.id)}
                                >
                                    {/* Seller */}
                                    <div style={{ minWidth: 0 }}>
                                        <div style={{
                                            fontSize: 10, fontWeight: 700, letterSpacing: "0.1em",
                                            textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 3,
                                        }}>Reported Seller</div>
                                        <div style={{
                                            fontSize: 14, fontWeight: 700, color: "var(--text-primary)",
                                            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                                        }}>
                                            {report.sellerName || report.sellerId?.slice(0, 16) + "…" || "Unknown"}
                                        </div>
                                        <div style={{
                                            fontSize: 11, color: "var(--text-muted)", marginTop: 2,
                                            fontFamily: "monospace", overflow: "hidden", textOverflow: "ellipsis",
                                        }}>
                                            ID: {report.sellerId?.slice(0, 20)}…
                                        </div>
                                    </div>

                                    {/* Reporter */}
                                    <div style={{ minWidth: 0 }}>
                                        <div style={{
                                            fontSize: 10, fontWeight: 700, letterSpacing: "0.1em",
                                            textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 3,
                                        }}>Reporter</div>
                                        <div style={{
                                            fontSize: 12, color: "var(--text-secondary)",
                                            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                                        }}>
                                            {report.reporterEmail || "Anonymous"}
                                        </div>
                                        <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
                                            {fmtDate(report.createdAt)}
                                        </div>
                                    </div>

                                    {/* Reason */}
                                    <div>
                                        <div style={{
                                            display: "inline-flex", alignItems: "center", gap: 5,
                                            background: `${reasonColor}18`,
                                            border: `1px solid ${reasonColor}40`,
                                            padding: "4px 10px", borderRadius: 4,
                                            fontSize: 11, fontWeight: 700, color: reasonColor,
                                            whiteSpace: "nowrap",
                                        }}>
                                            <AlertTriangle size={9} />
                                            {report.reason}
                                        </div>
                                    </div>

                                    {/* Status pill */}
                                    <span className={`pill ${cls}`}>
                                        <span className="pill-dot" />{statusLabel}
                                    </span>

                                    {/* Expand chevron */}
                                    <div style={{ color: "var(--text-muted)", flexShrink: 0 }}>
                                        {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                    </div>
                                </div>

                                {/* ── Expanded detail panel ── */}
                                {isOpen && (
                                    <div style={{
                                        borderTop: "1px solid var(--card-border)",
                                        background: "var(--surface)",
                                        padding: "20px 24px",
                                        display: "flex",
                                        flexDirection: "column",
                                        gap: 16,
                                    }}>

                                        {/* Report details */}
                                        <div style={{
                                            background: "var(--card-bg)",
                                            border: "1px solid var(--card-border)",
                                            borderRadius: 8, padding: "12px 16px",
                                        }}>
                                            <div style={{
                                                fontSize: 10, fontWeight: 700, letterSpacing: "0.1em",
                                                textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 10,
                                            }}>Report Details</div>
                                            <p style={{
                                                fontSize: 13, color: "var(--text-secondary)",
                                                lineHeight: 1.7, margin: 0,
                                            }}>
                                                {report.details || "(No additional details provided)"}
                                            </p>
                                        </div>

                                        {/* IDs */}
                                        <div style={{
                                            display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10,
                                            fontSize: 12,
                                        }}>
                                            {[
                                                ["Seller ID", report.sellerId],
                                                ["Reporter UID", report.reportedBy || "—"],
                                                ["Report ID", report.id],
                                                ["Submitted", fmtDate(report.createdAt)],
                                            ].map(([k, v]) => (
                                                <div key={k} style={{
                                                    background: "var(--card-bg)", borderRadius: 6,
                                                    border: "1px solid var(--card-border)",
                                                    padding: "8px 12px",
                                                }}>
                                                    <div style={{ fontSize: 10, color: "var(--text-muted)", marginBottom: 3 }}>{k}</div>
                                                    <div style={{
                                                        fontFamily: "monospace", color: "var(--text-primary)",
                                                        fontWeight: 600, fontSize: 11,
                                                        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                                                    }}>{v}</div>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Admin note (only if exists) */}
                                        {report.adminNote && (
                                            <div style={{
                                                background: "rgba(59,130,246,0.06)",
                                                border: "1px solid rgba(59,130,246,0.2)",
                                                borderRadius: 8, padding: "10px 14px",
                                                fontSize: 12, color: "#60a5fa",
                                            }}>
                                                <span style={{ fontWeight: 700 }}>Admin note: </span>
                                                {report.adminNote}
                                                {report.reviewedBy && (
                                                    <span style={{ color: "var(--text-muted)", marginLeft: 8 }}>
                                                        — {report.reviewedBy}
                                                    </span>
                                                )}
                                            </div>
                                        )}

                                        {/* Action note textarea */}
                                        {(report.status === "pending" || report.status === "reviewing") && (
                                            <div>
                                                <div style={{
                                                    fontSize: 10, fontWeight: 700, letterSpacing: "0.1em",
                                                    textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 6,
                                                }}>Admin Note (optional, sent to reporter)</div>
                                                <textarea
                                                    rows={2}
                                                    className="input-dark"
                                                    placeholder="E.g. Account reviewed and suspended, seller warned, no action needed…"
                                                    value={expanded === report.id ? actionNote : ""}
                                                    onChange={e => setActionNote(e.target.value)}
                                                    style={{ resize: "vertical", lineHeight: 1.6 }}
                                                />
                                            </div>
                                        )}

                                        {/* Action buttons */}
                                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>

                                            {/* View seller profile */}
                                            <a
                                                href={`/profile/${report.sellerId}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="btn btn-ghost"
                                                style={{ textDecoration: "none" }}
                                            >
                                                <ExternalLink size={12} />View Seller
                                            </a>

                                            {/* Status transitions */}
                                            {report.status === "pending" && (
                                                <button
                                                    onClick={() => updateStatus(report.id, "reviewing", actionNote)}
                                                    disabled={acting === report.id}
                                                    className="btn btn-ghost"
                                                    style={{ borderColor: "rgba(59,130,246,0.3)", color: "#60a5fa" }}
                                                >
                                                    <Eye size={12} />
                                                    {acting === report.id ? "…" : "Mark Reviewing"}
                                                </button>
                                            )}

                                            {(report.status === "pending" || report.status === "reviewing") && (
                                                <>
                                                    <button
                                                        onClick={() => updateStatus(report.id, "resolved", actionNote)}
                                                        disabled={acting === report.id}
                                                        className="btn btn-success"
                                                    >
                                                        <Check size={12} />
                                                        {acting === report.id ? "…" : "Mark Resolved"}
                                                    </button>

                                                    <button
                                                        onClick={() => updateStatus(report.id, "dismissed", actionNote)}
                                                        disabled={acting === report.id}
                                                        className="btn btn-ghost"
                                                    >
                                                        <XCircle size={12} />
                                                        {acting === report.id ? "…" : "Dismiss"}
                                                    </button>
                                                </>
                                            )}

                                            {(report.status === "resolved" || report.status === "dismissed") && (
                                                <button
                                                    onClick={() => updateStatus(report.id, "pending")}
                                                    disabled={acting === report.id}
                                                    className="btn btn-ghost"
                                                >
                                                    <RefreshCw size={12} />Reopen
                                                </button>
                                            )}

                                            {/* Delete — always available */}
                                            <button
                                                onClick={() => deleteReport(report.id)}
                                                className="btn btn-danger"
                                                style={{ marginLeft: "auto" }}
                                            >
                                                <Trash2 size={12} />Delete
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}