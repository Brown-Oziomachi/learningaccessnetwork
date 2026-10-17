"use client";
import React, { useEffect, useState } from "react";
import {
    collection,
    getDocs,
    deleteDoc,
    doc,
    orderBy,
    query,
} from "firebase/firestore";
import { db } from "@/lib/firebaseConfig";
import { Send, Download, RefreshCw, Search, Trash2, Users } from "lucide-react";

const csvCell = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;

const downloadCsv = (filename, rows, withBom = false) => {
    const text = (withBom ? "\uFEFF" : "") + rows.map((r) => r.map(csvCell).join(",")).join("\n");
    const blob = new Blob([text], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
};

export default function NewsletterSubscribersSection() {
    const [subs, setSubs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");

    const load = async () => {
        setLoading(true);
        setError("");
        try {
            const snap = await getDocs(
                query(collection(db, "newsletter_subscribers"), orderBy("createdAt", "desc"))
            );
            setSubs(
                snap.docs.map((d) => ({
                    id: d.id,
                    ...d.data(),
                    createdAtDate: d.data().createdAt?.toDate?.() || null,
                }))
            );
        } catch (e) {
            console.error(e);
            setError(e.message || "Failed to load subscribers");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
    }, []);

    const filtered = subs.filter(
        (s) => !search || s.email?.toLowerCase().includes(search.toLowerCase())
    );

    const today = new Date().toDateString();
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const stats = [
        { label: "Total Subscribers", value: subs.length, color: "#60a5fa" },
        {
            label: "Today",
            value: subs.filter((s) => s.createdAtDate?.toDateString() === today).length,
            color: "#34d399",
        },
        {
            label: "Last 7 Days",
            value: subs.filter((s) => s.createdAtDate && s.createdAtDate.getTime() >= weekAgo).length,
            color: "#fbbf24",
        },
    ];

    const stamp = new Date().toISOString().slice(0, 10);

    // Substack import: one column called "email", nothing else
    const exportSubstack = () => {
        if (!filtered.length) return alert("No subscribers to export.");
        downloadCsv(`substack-subscribers-${stamp}.csv`, [
            ["email"],
            ...filtered.map((s) => [s.email]),
        ]);
    };

    // Full list for Excel (BOM so Excel reads it correctly)
    const exportFull = () => {
        if (!filtered.length) return alert("No subscribers to export.");
        downloadCsv(
            `newsletter-subscribers-full-${stamp}.csv`,
            [
                ["Email", "Source", "Subscribed At"],
                ...filtered.map((s) => [
                    s.email,
                    s.source || "",
                    s.createdAtDate ? s.createdAtDate.toISOString() : "",
                ]),
            ],
            true
        );
    };

    const remove = async (s) => {
        if (!confirm(`Remove ${s.email} from the list?`)) return;
        try {
            await deleteDoc(doc(db, "newsletter_subscribers", s.id));
            setSubs((prev) => prev.filter((x) => x.id !== s.id));
        } catch (e) {
            alert("Failed: " + e.message);
        }
    };

    return (
        <div>
            {/* Stats */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginBottom: 20 }}>
                {stats.map(({ label, value, color }) => (
                    <div key={label} className="card-sm">
                        <div style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>
                            {label}
                        </div>
                        <div style={{ fontSize: 22, fontWeight: 700, color }}>{value}</div>
                    </div>
                ))}
            </div>

            {/* Toolbar */}
            <div style={{ display: "flex", gap: 10, marginBottom: 14, flexWrap: "wrap" }}>
                <div style={{ position: "relative", flex: 1, minWidth: 220 }}>
                    <Search
                        size={14}
                        style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }}
                    />
                    <input
                        className="input-dark"
                        placeholder="Search by email…"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        style={{ paddingLeft: 36 }}
                    />
                </div>
                <button onClick={load} className="btn btn-ghost">
                    <RefreshCw size={13} />Refresh
                </button>
                <button onClick={exportFull} className="btn btn-ghost">
                    <Download size={13} />Export Full (Excel)
                </button>
                <button onClick={exportSubstack} className="btn btn-primary">
                    <Send size={13} />Export for Substack
                </button>
            </div>

            {error && (
                <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 8, padding: "10px 14px", marginBottom: 14, fontSize: 12, color: "#f87171" }}>
                    {error}
                </div>
            )}

            <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 10 }}>
                Showing {filtered.length} of {subs.length} subscribers
            </div>

            {/* Table */}
            {loading ? (
                <div style={{ display: "flex", justifyContent: "center", padding: 48 }}>
                    <div style={{ width: 32, height: 32, border: "2px solid rgba(59,130,246,0.3)", borderTopColor: "#3b82f6", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                </div>
            ) : (
                <div className="card" style={{ padding: 0, overflow: "hidden" }}>
                    <table className="data-table">
                        <thead>
                            <tr>
                                {["#", "Email", "Source", "Subscribed", ""].map((h) => (
                                    <th key={h}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={5} style={{ textAlign: "center", padding: 40, color: "var(--text-muted)" }}>
                                        <Users size={28} style={{ margin: "0 auto 8px", display: "block" }} />
                                        No subscribers yet
                                    </td>
                                </tr>
                            ) : (
                                filtered.map((s, i) => (
                                    <tr key={s.id}>
                                        <td style={{ color: "var(--text-muted)", fontSize: 12 }}>{i + 1}</td>
                                        <td style={{ color: "var(--text-primary)", fontWeight: 600 }}>{s.email}</td>
                                        <td>
                                            <span className="pill pill-gray">{s.source || "—"}</span>
                                        </td>
                                        <td style={{ fontSize: 12 }}>
                                            {s.createdAtDate
                                                ? s.createdAtDate.toLocaleString("en-NG", { dateStyle: "medium", timeStyle: "short" })
                                                : "—"}
                                        </td>
                                        <td>
                                            <button onClick={() => remove(s)} className="icon-btn" style={{ width: 28, height: 28 }} title="Remove">
                                                <Trash2 size={12} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}