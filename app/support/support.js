"use client";
import React, { useState, useEffect, useRef } from "react";
import {
    MessageSquare, ChevronRight, Send, X, Clock, CheckCircle,
    AlertCircle, Plus, ChevronDown, Search, ArrowLeft,
    FileText, Zap, HelpCircle, Book, Shield, CreditCard,
    Package, User, Mail, Phone
} from "lucide-react";
import { auth, db } from "@/lib/firebaseConfig";
import {
    collection, addDoc, query, where,
    orderBy, serverTimestamp, onSnapshot, doc, getDoc
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import Navbar from "@/components/NavBar";
import NotificationBell from "@/components/NotificationBell";

/* ── colour tokens ─────────────────────────────────────── */
const NAVY = "#0d2244";
const GOLD = "#b8963e";
const GOLDD = "#d4aa5a";
const CREAM = "#f5f0e8";
const BG = "#f5f1ea";

/* ── FAQ data ──────────────────────────────────────────── */
const FAQ_CATEGORIES = [
    {
        id: "payments",
        icon: CreditCard,
        label: "Payments & Withdrawals",
        color: GOLD,
        bg: "rgba(184,150,62,0.1)",
        questions: [
            {
                q: "How long does a withdrawal take?",
                a: "Withdrawals are processed within 24–48 hours after admin approval. You'll receive a notification once your funds have been sent to your bank account.",
            },
            {
                q: "What is the minimum withdrawal amount?",
                a: "The minimum withdrawal is ₦1,000. Make sure you have added your bank details before requesting a withdrawal.",
            },
            {
                q: "Why was my withdrawal rejected?",
                a: "Withdrawals can be rejected if bank details are incorrect or incomplete. Check the admin note in your withdrawal history and re-submit with the correct details.",
            },
            {
                q: "How is the 80/20 split calculated?",
                a: "For every sale, 80% goes directly to you (the seller) and 20% is the platform fee retained by LAN Library. Your earnings tab always shows your net payout.",
            },
        ],
    },
    {
        id: "documents",
        icon: FileText,
        label: "Documents & Uploads",
        color: "#3b82f6",
        bg: "rgba(59,130,246,0.08)",
        questions: [
            {
                q: "How long does book approval take?",
                a: "Our admin team reviews submissions within 24–72 hours. You'll receive a notification as soon as your document is approved or rejected.",
            },
            {
                q: "Why was my document rejected?",
                a: "Documents may be rejected for duplicate content, inappropriate material, or incomplete information. Check your notification for the specific reason and re-upload after making corrections.",
            },
            {
                q: "Can I edit a document after uploading?",
                a: "Once a document is submitted for review it cannot be edited. If changes are needed, delete the pending submission and re-upload the corrected version.",
            },
            {
                q: "What file formats are accepted?",
                a: "We accept PDF files and Google Drive links. Ensure your Google Drive link is set to 'Anyone with the link can view' before submitting.",
            },
        ],
    },
    {
        id: "account",
        icon: User,
        label: "Account & Verification",
        color: "#8b5cf6",
        bg: "rgba(139,92,246,0.08)",
        questions: [
            {
                q: "How do I get faculty verified?",
                a: "Go to your profile and submit your staff ID card or appointment letter for review. Faculty verification typically takes 24–48 hours.",
            },
            {
                q: "How do I reset my transfer PIN?",
                a: "Open your profile, scroll to 'Reset Transfer PIN', and request an OTP to your registered email. Enter the 6-digit code and choose a new 4-digit PIN.",
            },
            {
                q: "Can I switch between student and seller accounts?",
                a: "Yes. Use the hamburger menu in your seller dashboard to switch accounts. You can enrol as a student at any time — both accounts share the same login.",
            },
        ],
    },
    {
        id: "physical",
        icon: Package,
        label: "Physical Orders & Registry",
        color: "#10b981",
        bg: "rgba(16,185,129,0.08)",
        questions: [
            {
                q: "Where is the Abuja Registry located?",
                a: "The LAN Head Office is in Abuja. Exact address is shared in your confirmation notification once your consignment is checked in.",
            },
            {
                q: "How do I collect my physical order?",
                a: "Bring your pickup code (visible under 'My Physical Orders' in your profile) to the Abuja Registry. Show it to staff to collect your copy.",
            },
            {
                q: "When will my seller credit appear after a physical sale?",
                a: "Seller credit is applied instantly when the admin marks a student order as 'Collected'. You'll receive a notification with the credited amount.",
            },
        ],
    },
];

/* ── Ticket status pill ─────────────────────────────────── */
function StatusPill({ status }) {
    const map = {
        open: { label: "Open", bg: "rgba(245,158,11,0.1)", color: "#b45309", dot: "#d97706" },
        resolved: { label: "Resolved", bg: "rgba(16,185,129,0.1)", color: "#065f46", dot: "#10b981" },
        closed: { label: "Closed", bg: "rgba(148,163,184,0.15)", color: "#475569", dot: "#94a3b8" },
    };
    const s = map[status] || map.open;
    return (
        <span style={{
            display: "inline-flex", alignItems: "center", gap: 5,
            background: s.bg, color: s.color,
            padding: "3px 10px", fontSize: 11, fontWeight: 700,
            fontFamily: "'Lato',sans-serif", letterSpacing: "0.06em",
        }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: s.dot, display: "inline-block" }} />
            {s.label}
        </span>
    );
}

/* ── FAQ accordion item ─────────────────────────────────── */
function FaqItem({ q, a, defaultOpen }) {
    const [open, setOpen] = useState(defaultOpen || false);
    return (
        <div style={{
            borderBottom: "0.5px solid #e5ddd0",
            overflow: "hidden",
        }}>
            <button
                onClick={() => setOpen(o => !o)}
                style={{
                    width: "100%", display: "flex", alignItems: "center",
                    justifyContent: "space-between", gap: 12,
                    padding: "16px 20px", background: "transparent",
                    border: "none", cursor: "pointer", textAlign: "left",
                }}
                onMouseEnter={e => e.currentTarget.style.background = CREAM}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
            >
                <span style={{ fontSize: 13, fontWeight: 700, color: NAVY, fontFamily: "'Lato',sans-serif", flex: 1, lineHeight: 1.5 }}>
                    {q}
                </span>
                <ChevronDown
                    size={16}
                    style={{
                        color: GOLD, flexShrink: 0,
                        transform: open ? "rotate(180deg)" : "rotate(0deg)",
                        transition: "transform 0.2s",
                    }}
                />
            </button>
            {open && (
                <div style={{
                    padding: "0 20px 16px 20px",
                    fontSize: 13, color: "#555",
                    lineHeight: 1.7, fontFamily: "'Lato',sans-serif",
                    borderLeft: `3px solid ${GOLD}`,
                    marginLeft: 20,
                    paddingLeft: 16,
                }}>
                    {a}
                </div>
            )}
        </div>
    );
}

/* ── New ticket form ───────────────────────────────────── */
function NewTicketForm({ user, onSuccess, onCancel }) {
    const [subject, setSubject] = useState("");
    const [category, setCategory] = useState("general");
    const [message, setMessage] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");

    const CATEGORIES = [
        { value: "general", label: "General Enquiry" },
        { value: "payment", label: "Payment / Withdrawal" },
        { value: "document", label: "Document / Upload" },
        { value: "account", label: "Account / Verification" },
        { value: "physical_order", label: "Physical Order / Registry" },
        { value: "technical", label: "Technical Issue" },
        { value: "other", label: "Other" },
    ];

    const handleSubmit = async () => {
        if (!subject.trim()) { setError("Please enter a subject"); return; }
        if (!message.trim()) { setError("Please describe your issue"); return; }
        setSubmitting(true);
        setError("");
        try {
            await addDoc(collection(db, "supportTickets"), {
                userId: user.uid,
                name: user.displayName || `${user.firstName || ""} ${user.surname || ""}`.trim() || "User",
                email: user.email,
                subject: subject.trim(),
                category,
                message: message.trim(),
                status: "open",
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            });
            onSuccess();
        } catch (e) {
            setError("Failed to submit ticket. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div style={{ padding: "0 0 32px" }}>
            {/* Header */}
            <div style={{
                background: NAVY, padding: "20px 24px",
                display: "flex", alignItems: "center", gap: 14, marginBottom: 24,
            }}>
                <button
                    onClick={onCancel}
                    style={{ background: "transparent", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.6)", display: "flex" }}
                >
                    <ArrowLeft size={20} />
                </button>
                <div>
                    <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: GOLD, margin: "0 0 3px", fontFamily: "'Lato',sans-serif" }}>
                        Support
                    </p>
                    <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: 20, fontWeight: 700, color: "#fff", margin: 0 }}>
                        Open a Ticket
                    </h2>
                </div>
            </div>

            <div style={{ padding: "0 24px" }}>
                {error && (
                    <div style={{ display: "flex", gap: 8, background: "#fef2f2", border: "0.5px solid #fecaca", padding: "10px 14px", marginBottom: 16 }}>
                        <AlertCircle size={14} style={{ color: "#ef4444", flexShrink: 0, marginTop: 1 }} />
                        <p style={{ fontSize: 12, color: "#dc2626", margin: 0, fontFamily: "'Lato',sans-serif" }}>{error}</p>
                    </div>
                )}

                {/* Subject */}
                <div style={{ marginBottom: 14 }}>
                    <label style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#888", display: "block", marginBottom: 6, fontFamily: "'Lato',sans-serif" }}>
                        Subject <span style={{ color: "#ef4444" }}>*</span>
                    </label>
                    <input
                        value={subject}
                        onChange={e => setSubject(e.target.value)}
                        placeholder="Brief description of your issue"
                        style={{
                            width: "100%", border: "0.5px solid #e5ddd0", padding: "11px 12px",
                            fontSize: 13, color: NAVY, outline: "none",
                            fontFamily: "'Lato',sans-serif", boxSizing: "border-box",
                        }}
                    />
                </div>

                {/* Category */}
                <div style={{ marginBottom: 14 }}>
                    <label style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#888", display: "block", marginBottom: 6, fontFamily: "'Lato',sans-serif" }}>
                        Category
                    </label>
                    <select
                        value={category}
                        onChange={e => setCategory(e.target.value)}
                        style={{
                            width: "100%", border: "0.5px solid #e5ddd0", padding: "11px 12px",
                            fontSize: 13, color: NAVY, outline: "none",
                            fontFamily: "'Lato',sans-serif", boxSizing: "border-box", background: "#fff",
                        }}
                    >
                        {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                    </select>
                </div>

                {/* Message */}
                <div style={{ marginBottom: 20 }}>
                    <label style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#888", display: "block", marginBottom: 6, fontFamily: "'Lato',sans-serif" }}>
                        Message <span style={{ color: "#ef4444" }}>*</span>
                    </label>
                    <textarea
                        value={message}
                        onChange={e => setMessage(e.target.value)}
                        placeholder="Describe your issue in detail. Include any relevant order IDs, book titles, or error messages."
                        rows={5}
                        style={{
                            width: "100%", border: "0.5px solid #e5ddd0", padding: "11px 12px",
                            fontSize: 13, color: NAVY, outline: "none", resize: "vertical",
                            fontFamily: "'Lato',sans-serif", boxSizing: "border-box", lineHeight: 1.6,
                        }}
                    />
                    <p style={{ fontSize: 11, color: "#aaa", marginTop: 4, fontFamily: "'Lato',sans-serif" }}>
                        {message.length}/1000 characters
                    </p>
                </div>

                {/* Info banner */}
                <div style={{
                    display: "flex", gap: 10, background: CREAM,
                    border: "0.5px solid rgba(184,150,62,0.25)", padding: "12px 14px", marginBottom: 20,
                    borderLeft: `3px solid ${GOLD}`,
                }}>
                    <Clock size={14} style={{ color: GOLD, flexShrink: 0, marginTop: 1 }} />
                    <p style={{ fontSize: 12, color: "#888", margin: 0, fontFamily: "'Lato',sans-serif", lineHeight: 1.6 }}>
                        Our team responds within <strong style={{ color: NAVY }}>24–48 hours</strong>. You'll receive a notification once we reply.
                    </p>
                </div>

                <div style={{ display: "flex", gap: 10 }}>
                    <button
                        onClick={onCancel}
                        style={{
                            flex: 1, background: "#f5f5f5", color: "#666",
                            padding: 13, border: "0.5px solid #e5ddd0",
                            fontSize: 13, fontWeight: 700, cursor: "pointer",
                            fontFamily: "'Lato',sans-serif",
                        }}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={submitting}
                        style={{
                            flex: 1, background: submitting ? "#ccc" : NAVY,
                            color: "#fff", padding: 13, border: "none",
                            fontSize: 13, fontWeight: 700,
                            cursor: submitting ? "not-allowed" : "pointer",
                            fontFamily: "'Lato',sans-serif",
                            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                        }}
                    >
                        {submitting
                            ? <><div style={{ width: 14, height: 14, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />Submitting…</>
                            : <><Send size={14} />Submit Ticket</>
                        }
                    </button>
                </div>
            </div>
        </div>
    );
}

/* ── Ticket detail view ─────────────────────────────────── */
function TicketDetail({ ticket: initialTicket, onBack }) {
    // Live-listen to this specific ticket so admin replies appear instantly
    const [ticket, setTicket] = useState(initialTicket);

    useEffect(() => {
        if (!initialTicket?.id) return;
        const unsub = onSnapshot(doc(db, "supportTickets", initialTicket.id), (snap) => {
            if (snap.exists()) setTicket({ id: snap.id, ...snap.data() });
        });
        return () => unsub();
    }, [initialTicket?.id]);

    // Derive the reply text — admin uses adminResponse OR adminNotes
    const adminReply = ticket.adminResponse || ticket.adminNotes || null;

    return (
        <div>
            <div style={{
                background: NAVY, padding: "20px 24px",
                display: "flex", alignItems: "center", gap: 14, marginBottom: 24,
            }}>
                <button
                    onClick={onBack}
                    style={{ background: "transparent", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.6)", display: "flex" }}
                >
                    <ArrowLeft size={20} />
                </button>
                <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: GOLD, margin: "0 0 3px", fontFamily: "'Lato',sans-serif" }}>
                        Ticket #{ticket.id?.slice(0, 8).toUpperCase()}
                    </p>
                    <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: 18, fontWeight: 700, color: "#fff", margin: 0, lineHeight: 1.3 }}>
                        {ticket.subject}
                    </h2>
                </div>
                <StatusPill status={ticket.status} />
            </div>

            <div style={{ padding: "0 24px 32px" }}>
                {/* Your message */}
                <div style={{ marginBottom: 20 }}>
                    <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "#aaa", marginBottom: 10, fontFamily: "'Lato',sans-serif" }}>
                        Your message
                    </p>
                    <div style={{
                        background: CREAM, border: "0.5px solid rgba(184,150,62,0.2)",
                        padding: "16px 18px", borderLeft: `3px solid ${GOLD}`,
                    }}>
                        <p style={{ fontSize: 13, color: NAVY, lineHeight: 1.7, margin: "0 0 10px", fontFamily: "'Lato',sans-serif" }}>
                            {ticket.message}
                        </p>
                        <p style={{ fontSize: 11, color: "#aaa", margin: 0, fontFamily: "'Lato',sans-serif" }}>
                            {ticket.createdAt?.toDate?.()?.toLocaleString("en-NG", { dateStyle: "medium", timeStyle: "short" }) || "—"}
                        </p>
                    </div>
                </div>

                {/* Admin reply — shows adminResponse OR adminNotes, whichever is set */}
                {adminReply ? (
                    <div style={{ marginBottom: 20 }}>
                        <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "#aaa", marginBottom: 10, fontFamily: "'Lato',sans-serif" }}>
                            LAN Support reply
                        </p>
                        <div style={{
                            background: "#fff", border: "0.5px solid #e5ddd0",
                            padding: "16px 18px", borderLeft: `3px solid #10b981`,
                        }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                                <div style={{
                                    width: 28, height: 28, background: NAVY, borderRadius: "50%",
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                }}>
                                    <Shield size={12} color={GOLD} />
                                </div>
                                <span style={{ fontSize: 12, fontWeight: 700, color: NAVY, fontFamily: "'Lato',sans-serif" }}>LAN Support Team</span>
                                <span style={{ fontSize: 10, color: "#aaa", fontFamily: "'Lato',sans-serif", marginLeft: "auto" }}>
                                    {ticket.resolvedAt?.toDate?.()?.toLocaleString("en-NG", { dateStyle: "medium", timeStyle: "short" }) || "—"}
                                </span>
                            </div>
                            <p style={{ fontSize: 13, color: "#333", lineHeight: 1.7, margin: 0, fontFamily: "'Lato',sans-serif" }}>
                                {adminReply}
                            </p>
                        </div>
                    </div>
                ) : null}

                {/* Awaiting banner — only when truly no reply yet */}
                {!adminReply && ticket.status === "open" && (
                    <div style={{
                        display: "flex", gap: 10, background: "#fffbeb",
                        border: "0.5px solid #fde68a", padding: "12px 16px",
                    }}>
                        <Clock size={14} style={{ color: "#d97706", flexShrink: 0, marginTop: 1 }} />
                        <p style={{ fontSize: 12, color: "#92400e", margin: 0, fontFamily: "'Lato',sans-serif", lineHeight: 1.6 }}>
                            Your ticket is open. Our team will respond within 24–48 hours.
                        </p>
                    </div>
                )}

                {/* Resolved but no explicit reply stored — shouldn't happen but just in case */}
                {!adminReply && ticket.status === "resolved" && (
                    <div style={{
                        display: "flex", gap: 10, background: "#f0fdf4",
                        border: "0.5px solid #86efac", padding: "12px 16px",
                    }}>
                        <CheckCircle size={14} style={{ color: "#10b981", flexShrink: 0, marginTop: 1 }} />
                        <p style={{ fontSize: 12, color: "#065f46", margin: 0, fontFamily: "'Lato',sans-serif", lineHeight: 1.6 }}>
                            This ticket has been resolved by our team.
                        </p>
                    </div>
                )}

                {/* Details */}
                <div style={{ background: CREAM, padding: "14px 18px", marginTop: 20 }}>
                    <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: GOLD, margin: "0 0 10px", fontFamily: "'Lato',sans-serif" }}>
                        Ticket details
                    </p>
                    {[
                        ["Category", ticket.category?.replace("_", " ") || "General"],
                        ["Submitted", ticket.createdAt?.toDate?.()?.toLocaleDateString("en-NG", { dateStyle: "medium" }) || "—"],
                        ["Status", ticket.status],
                    ].map(([k, v]) => (
                        <div key={k} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, padding: "5px 0", borderBottom: "0.5px solid rgba(184,150,62,0.15)" }}>
                            <span style={{ color: "#888", fontFamily: "'Lato',sans-serif" }}>{k}</span>
                            <span style={{ fontWeight: 700, color: NAVY, fontFamily: "'Lato',sans-serif", textTransform: "capitalize" }}>{v}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

/* ════════════════════════════════════════════════════════
   MAIN PAGE COMPONENT
════════════════════════════════════════════════════════ */
export default function SupportPage() {
    const [user, setUser] = useState(null);
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [tickets, setTickets] = useState([]);
    const [ticketsLoading, setTicketsLoading] = useState(false);

    /* view: "home" | "faq" | "new" | "ticket" */
    const [view, setView] = useState("home");
    const [activeTicket, setActiveTicket] = useState(null);
    const [activeFaqCat, setActiveFaqCat] = useState(null);
    const [search, setSearch] = useState("");
    const [showSuccess, setShowSuccess] = useState(false);

    const ticketsUnsubRef = useRef(null);

    // Live ticket listener — updates the list and any open detail view in real time
    const subscribeToTickets = (uid) => {
        if (ticketsUnsubRef.current) ticketsUnsubRef.current();
        setTicketsLoading(true);
        const q = query(
            collection(db, "supportTickets"),
            where("userId", "==", uid),
            orderBy("createdAt", "desc")
        );
        ticketsUnsubRef.current = onSnapshot(q, (snap) => {
            const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            setTickets(docs);
            setTicketsLoading(false);
            setActiveTicket(prev => {
                if (!prev) return prev;
                const fresh = docs.find(d => d.id === prev.id);
                return fresh || prev;
            });
        }, (error) => {
            console.error("Tickets listener error:", error); // ← log it
            setTicketsLoading(false);
        });
        ;
    };

    // Manual refresh — just reuse the live listener (restarts it)
    const fetchTickets = (uid) => subscribeToTickets(uid || user?.uid);

    useEffect(() => {
        const unsub = onAuthStateChanged(auth, async (u) => {
            if (u) {
                setUser(u);
                const snap = await getDoc(doc(db, "users", u.uid));
                if (snap.exists()) setUserData(snap.data());
                subscribeToTickets(u.uid);
            }
            setLoading(false);
        });
        return () => {
            unsub();
            if (ticketsUnsubRef.current) ticketsUnsubRef.current();
        };
    }, []);

    const mergedUser = user ? { ...user, ...userData } : null;

    const filteredFaq = search.trim()
        ? FAQ_CATEGORIES.flatMap(cat =>
            cat.questions
                .filter(q => q.q.toLowerCase().includes(search.toLowerCase()) || q.a.toLowerCase().includes(search.toLowerCase()))
                .map(q => ({ ...q, catLabel: cat.label }))
        )
        : [];

    /* ── Loading ── */
    if (loading) return (
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: BG }}>
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
            <div style={{ textAlign: "center" }}>
                <div style={{ width: 48, height: 48, border: `3px solid ${GOLD}`, borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 14px" }} />
                <p style={{ fontFamily: "'Playfair Display',serif", fontSize: 16, color: NAVY }}>Loading support…</p>
            </div>
        </div>
    );

    /* ── Inner: new ticket ── */
    if (view === "new") return (
        <>
            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=Lato:wght@400;700&display=swap');
        @keyframes spin{to{transform:rotate(360deg)}}
        body{background:${BG};margin:0;}
        *{box-sizing:border-box;}
      `}</style>
            <Navbar />
            <div style={{ maxWidth: 640, margin: "32px auto", background: "#fff", border: "0.5px solid #e5ddd0" }}>
                <NewTicketForm
                    user={mergedUser}
                    onSuccess={() => {
                        setShowSuccess(true);
                        setTimeout(() => { setShowSuccess(false); setView("home"); }, 2800);
                    }}
                    onCancel={() => setView("home")}
                />
            </div>
        </>
    );

    /* ── Inner: ticket detail ── */
    if (view === "ticket" && activeTicket) return (
        <>
            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=Lato:wght@400;700&display=swap');
        body{background:${BG};margin:0;}
        *{box-sizing:border-box;}
      `}</style>
            <Navbar />
            <div style={{ maxWidth: 640, margin: "32px auto", background: "#fff", border: "0.5px solid #e5ddd0" }}>
                <TicketDetail ticket={activeTicket} onBack={() => { setView("home"); setActiveTicket(null); }} />
            </div>
        </>
    );

    /* ── Inner: FAQ category ── */
    if (view === "faq" && activeFaqCat) return (
        <>
            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=Lato:wght@400;700&display=swap');
        body{background:${BG};margin:0;}
        *{box-sizing:border-box;}
      `}</style>
            <Navbar />
            <div style={{ maxWidth: 640, margin: "32px auto", background: "#fff", border: "0.5px solid #e5ddd0" }}>
                <div style={{ background: NAVY, padding: "20px 24px", display: "flex", alignItems: "center", gap: 14 }}>
                    <button onClick={() => { setView("home"); setActiveFaqCat(null); }}
                        style={{ background: "transparent", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.6)", display: "flex" }}>
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: GOLD, margin: "0 0 3px", fontFamily: "'Lato',sans-serif" }}>FAQ</p>
                        <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: 18, fontWeight: 700, color: "#fff", margin: 0 }}>{activeFaqCat.label}</h2>
                    </div>
                </div>
                <div>
                    {activeFaqCat.questions.map((item, i) => (
                        <FaqItem key={i} q={item.q} a={item.a} defaultOpen={i === 0} />
                    ))}
                </div>
                <div style={{ padding: "20px 24px 32px" }}>
                    <p style={{ fontSize: 13, color: "#888", textAlign: "center", marginBottom: 14, fontFamily: "'Lato',sans-serif" }}>
                        Didn't find your answer?
                    </p>
                    <button
                        onClick={() => { setActiveFaqCat(null); setView("new"); }}
                        style={{
                            width: "100%", background: NAVY, color: "#fff",
                            padding: 13, border: "none", fontSize: 13, fontWeight: 700,
                            cursor: "pointer", fontFamily: "'Lato',sans-serif",
                            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                        }}
                    >
                        <MessageSquare size={15} /> Open a Support Ticket
                    </button>
                </div>
            </div>
        </>
    );

    /* ══════════════ HOME VIEW ══════════════ */
    return (
        <>
            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700;900&family=Lato:wght@400;700&display=swap');
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
        .lan-root{font-family:'Lato',sans-serif;background:${BG};min-height:100vh;}
        .lan-serif{font-family:'Playfair Display',serif;}
        .category-btn{transition:all 0.18s;cursor:pointer;}
        .category-btn:hover{transform:translateY(-2px);}
        .ticket-row{transition:background 0.15s;cursor:pointer;}
        .ticket-row:hover{background:${CREAM} !important;}
        *{box-sizing:border-box;margin:0;padding:0;}
      `}</style>

            <div className="lan-root">
                <Navbar />

                {/* ── Hero ── */}
                <div style={{
                    background: NAVY,
                    backgroundImage: "radial-gradient(rgba(184,150,62,0.06) 1px, transparent 1px)",
                    backgroundSize: "24px 24px",
                    padding: "48px 24px 40px",
                    textAlign: "center",
                    position: "relative",
                    overflow: "hidden",
                }}>
                    {/* decorative corner */}
                    <div style={{ position: "absolute", top: -24, right: -24, width: 100, height: 100, border: "0.5px solid rgba(184,150,62,0.15)", transform: "rotate(45deg)" }} />
                    <div style={{ position: "absolute", bottom: -16, left: -16, width: 80, height: 80, border: "0.5px solid rgba(184,150,62,0.1)", transform: "rotate(45deg)" }} />

                    <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(184,150,62,0.12)", border: "0.5px solid rgba(184,150,62,0.3)", padding: "5px 14px", marginBottom: 16 }}>
                        <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#10b981", display: "inline-block", animation: "spin 0s" }} />
                        <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: GOLD, fontFamily: "'Lato',sans-serif" }}>Support Centre</span>
                    </div>

                    <h1 className="lan-serif" style={{ fontSize: "clamp(26px,5vw,40px)", fontWeight: 700, color: "#fff", marginBottom: 10 }}>
                        How can we help?
                    </h1>
                    <p style={{ fontSize: 14, color: "rgba(255,255,255,0.55)", maxWidth: 400, margin: "0 auto 28px", fontFamily: "'Lato',sans-serif", lineHeight: 1.7 }}>
                        Search our FAQ, browse topics, or open a support ticket. We respond within 24–48 hours.
                    </p>

                    {/* Search bar */}
                    <div style={{
                        maxWidth: 500, margin: "0 auto",
                        display: "flex", alignItems: "center", gap: 12,
                        background: "#fff", border: `1.5px solid ${GOLD}`, padding: "11px 16px",
                    }}>
                        <Search size={16} color="#aaa" style={{ flexShrink: 0 }} />
                        <input
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Search FAQ… e.g. withdrawal, upload, PIN"
                            style={{
                                flex: 1, border: "none", outline: "none",
                                fontSize: 13, color: NAVY, background: "transparent",
                                fontFamily: "'Lato',sans-serif",
                            }}
                        />
                        {search && (
                            <button onClick={() => setSearch("")} style={{ background: "none", border: "none", cursor: "pointer", display: "flex" }}>
                                <X size={14} color="#aaa" />
                            </button>
                        )}
                    </div>

                    {/* Live search results */}
                    {search.trim() && (
                        <div style={{
                            maxWidth: 500, margin: "8px auto 0", background: "#fff",
                            border: "0.5px solid #e5ddd0", textAlign: "left",
                        }}>
                            {filteredFaq.length === 0 ? (
                                <div style={{ padding: "16px 18px", fontSize: 13, color: "#aaa", fontFamily: "'Lato',sans-serif" }}>
                                    No results for "{search}" — try opening a ticket below.
                                </div>
                            ) : filteredFaq.slice(0, 5).map((item, i) => (
                                <div
                                    key={i}
                                    style={{
                                        padding: "12px 18px", borderBottom: "0.5px solid #f0ebe0",
                                        cursor: "pointer",
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.background = CREAM}
                                    onMouseLeave={e => e.currentTarget.style.background = "#fff"}
                                    onClick={() => {
                                        const cat = FAQ_CATEGORIES.find(c => c.label === item.catLabel);
                                        if (cat) { setActiveFaqCat(cat); setView("faq"); setSearch(""); }
                                    }}
                                >
                                    <p style={{ fontSize: 12, fontWeight: 700, color: NAVY, margin: "0 0 3px", fontFamily: "'Lato',sans-serif" }}>{item.q}</p>
                                    <p style={{ fontSize: 11, color: "#aaa", margin: 0, fontFamily: "'Lato',sans-serif" }}>{item.catLabel}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* ── Content ── */}
                <div style={{ maxWidth: 900, margin: "0 auto", padding: "32px 16px 80px" }}>

                    {/* Success toast */}
                    {showSuccess && (
                        <div style={{
                            display: "flex", alignItems: "center", gap: 12,
                            background: "#f0fdf4", border: "0.5px solid #86efac",
                            padding: "14px 18px", marginBottom: 20,
                            animation: "fadeUp 0.3s ease",
                        }}>
                            <CheckCircle size={18} color="#16a34a" style={{ flexShrink: 0 }} />
                            <div>
                                <p style={{ fontSize: 13, fontWeight: 700, color: "#065f46", margin: "0 0 2px", fontFamily: "'Lato',sans-serif" }}>Ticket submitted!</p>
                                <p style={{ fontSize: 12, color: "#16a34a", margin: 0, fontFamily: "'Lato',sans-serif" }}>We'll reply within 24–48 hours. Check back here for updates.</p>
                            </div>
                        </div>
                    )}

                    {/* FAQ categories */}
                    <div style={{ marginBottom: 32 }}>
                        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 18 }}>
                            <div>
                                <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: GOLD, marginBottom: 4, fontFamily: "'Lato',sans-serif" }}>
                                    Help Topics
                                </p>
                                <h2 className="lan-serif" style={{ fontSize: 22, fontWeight: 700, color: NAVY }}>
                                    Browse FAQ
                                </h2>
                            </div>
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 12 }}>
                            {FAQ_CATEGORIES.map(cat => {
                                const Icon = cat.icon;
                                return (
                                    <button
                                        key={cat.id}
                                        className="category-btn"
                                        onClick={() => { setActiveFaqCat(cat); setView("faq"); }}
                                        style={{
                                            background: "#fff", border: "0.5px solid #e5ddd0",
                                            padding: "20px 18px", textAlign: "left",
                                            display: "flex", flexDirection: "column", gap: 12,
                                        }}
                                        onMouseEnter={e => { e.currentTarget.style.borderColor = GOLD; e.currentTarget.style.background = CREAM; }}
                                        onMouseLeave={e => { e.currentTarget.style.borderColor = "#e5ddd0"; e.currentTarget.style.background = "#fff"; }}
                                    >
                                        <div style={{
                                            width: 42, height: 42, background: cat.bg,
                                            display: "flex", alignItems: "center", justifyContent: "center",
                                        }}>
                                            <Icon size={20} color={cat.color} />
                                        </div>
                                        <div>
                                            <p style={{ fontSize: 13, fontWeight: 700, color: NAVY, margin: "0 0 3px", fontFamily: "'Lato',sans-serif", lineHeight: 1.3 }}>
                                                {cat.label}
                                            </p>
                                            <p style={{ fontSize: 11, color: "#aaa", margin: 0, fontFamily: "'Lato',sans-serif" }}>
                                                {cat.questions.length} articles
                                            </p>
                                        </div>
                                        <ChevronRight size={14} color={GOLD} style={{ marginTop: "auto", alignSelf: "flex-end" }} />
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* 2-col: tickets + open ticket CTA */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 20 }} className="sup-grid">
                        <style>{`@media(min-width:720px){.sup-grid{grid-template-columns:1fr 340px !important;}}`}</style>

                        {/* My tickets */}
                        <div style={{ background: "#fff", border: "0.5px solid #e5ddd0" }}>
                            <div style={{ padding: "20px 24px", borderBottom: "0.5px solid #f0ebe0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                <div>
                                    <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: GOLD, marginBottom: 3, fontFamily: "'Lato',sans-serif" }}>
                                        My Tickets
                                    </p>
                                    <h3 className="lan-serif" style={{ fontSize: 18, fontWeight: 700, color: NAVY }}>
                                        Support History
                                    </h3>
                                </div>
                                {user && (
                                    <button
                                        onClick={() => fetchTickets(user?.uid)}
                                        style={{ background: "transparent", border: "none", cursor: "pointer", color: "#aaa", display: "flex" }}
                                        title="Refresh"
                                    >
                                        <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                                            <polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" />
                                            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                                        </svg>
                                    </button>
                                )}
                            </div>

                            {ticketsLoading ? (
                                <div style={{ padding: 40, textAlign: "center" }}>
                                    <div style={{ width: 28, height: 28, border: `2px solid ${GOLD}`, borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto" }} />
                                </div>
                            ) : tickets.length === 0 ? (
                                <div style={{ padding: "40px 24px", textAlign: "center" }}>
                                    <MessageSquare size={36} color="#ddd" style={{ margin: "0 auto 12px", display: "block" }} />
                                    <p style={{ fontSize: 13, fontWeight: 700, color: NAVY, marginBottom: 4, fontFamily: "'Playfair Display',serif" }}>No tickets yet</p>
                                    <p style={{ fontSize: 12, color: "#aaa", fontFamily: "'Lato',sans-serif" }}>
                                        Open a ticket below if you need help.
                                    </p>
                                </div>
                            ) : (
                                tickets.map(ticket => (
                                    <div
                                        key={ticket.id}
                                        className="ticket-row"
                                        onClick={() => { setActiveTicket(ticket); setView("ticket"); }}
                                        style={{
                                            padding: "14px 24px", borderBottom: "0.5px solid #f0ebe0",
                                            display: "flex", alignItems: "center", gap: 14,
                                            background: "#fff",
                                        }}
                                    >
                                        <div style={{
                                            width: 36, height: 36, background: ticket.status === "resolved" ? "rgba(16,185,129,0.08)" : "rgba(245,158,11,0.08)",
                                            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                                        }}>
                                            {ticket.status === "resolved"
                                                ? <CheckCircle size={16} color="#10b981" />
                                                : <Clock size={16} color={GOLD} />
                                            }
                                        </div>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <p style={{ fontSize: 13, fontWeight: 700, color: NAVY, margin: "0 0 3px", fontFamily: "'Lato',sans-serif", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                                {ticket.subject}
                                            </p>
                                            <p style={{ fontSize: 11, color: "#aaa", margin: 0, fontFamily: "'Lato',sans-serif" }}>
                                                {ticket.createdAt?.toDate?.()?.toLocaleDateString("en-NG", { dateStyle: "medium" }) || "—"}
                                                {ticket.category && ` · ${ticket.category.replace("_", " ")}`}
                                            </p>
                                        </div>
                                        <StatusPill status={ticket.status} />
                                        <ChevronRight size={14} color="#ccc" style={{ flexShrink: 0 }} />
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Right column */}
                        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

                            {/* Open ticket CTA */}
                            <div style={{
                                background: NAVY,
                                backgroundImage: "radial-gradient(rgba(184,150,62,0.06) 1px, transparent 1px)",
                                backgroundSize: "20px 20px",
                                padding: 24, position: "relative", overflow: "hidden",
                            }}>
                                <div style={{ position: "absolute", bottom: -14, right: -14, width: 72, height: 72, border: "0.5px solid rgba(184,150,62,0.15)", transform: "rotate(45deg)" }} />
                                <div style={{
                                    width: 44, height: 44, background: "rgba(184,150,62,0.15)",
                                    border: "0.5px solid rgba(184,150,62,0.3)",
                                    display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16,
                                }}>
                                    <MessageSquare size={20} color={GOLD} />
                                </div>
                                <p className="lan-serif" style={{ fontSize: 20, fontWeight: 700, color: "#fff", marginBottom: 8 }}>
                                    Open a Ticket
                                </p>
                                <p style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", lineHeight: 1.7, marginBottom: 20, fontFamily: "'Lato',sans-serif" }}>
                                    Can't find an answer in the FAQ? Our support team will get back to you within 24–48 hours.
                                </p>
                                <button
                                    onClick={() => setView("new")}
                                    style={{
                                        width: "100%", background: GOLD, color: NAVY,
                                        padding: "12px 16px", border: "none", fontSize: 13, fontWeight: 700,
                                        cursor: "pointer", fontFamily: "'Lato',sans-serif",
                                        display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                                        transition: "background 0.18s",
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.background = GOLDD}
                                    onMouseLeave={e => e.currentTarget.style.background = GOLD}
                                >
                                    <Plus size={15} /> New Support Ticket
                                </button>
                            </div>

                            {/* Response time card */}
                            <div style={{ background: "#fff", border: "0.5px solid #e5ddd0", padding: "20px 20px" }}>
                                <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: GOLD, marginBottom: 12, fontFamily: "'Lato',sans-serif" }}>
                                    Response Times
                                </p>
                                {[
                                    { label: "Support tickets", time: "24–48 hrs", color: "#3b82f6" },
                                    { label: "Book approvals", time: "24–72 hrs", color: "#8b5cf6" },
                                    { label: "Withdrawals", time: "24–48 hrs", color: "#10b981" },
                                    { label: "Verifications", time: "48–72 hrs", color: GOLD },
                                ].map(({ label, time, color }) => (
                                    <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "0.5px solid #f5f0e8" }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                            <div style={{ width: 3, height: 24, background: color, borderRadius: 2 }} />
                                            <span style={{ fontSize: 12, color: "#555", fontFamily: "'Lato',sans-serif" }}>{label}</span>
                                        </div>
                                        <span style={{ fontSize: 11, fontWeight: 700, color: NAVY, fontFamily: "'Lato',sans-serif" }}>{time}</span>
                                    </div>
                                ))}
                            </div>

                            {/* Contact alt */}
                            <div style={{ background: CREAM, border: "0.5px solid rgba(184,150,62,0.2)", padding: "18px 20px", borderLeft: `3px solid ${GOLD}` }}>
                                <p style={{ fontSize: 12, fontWeight: 700, color: NAVY, marginBottom: 8, fontFamily: "'Lato',sans-serif" }}>
                                    Other ways to reach us
                                </p>
                                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                                    <Mail size={13} color={GOLD} />
                                    <span style={{ fontSize: 12, color: "#555", fontFamily: "'Lato',sans-serif" }}>support@lanlibrary.com</span>
                                </div>
                                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                    <Book size={13} color={GOLD} />
                                    <a href="/docs" style={{ fontSize: 12, color: NAVY, fontFamily: "'Lato',sans-serif", fontWeight: 700 }}>Help Centre Docs</a>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}