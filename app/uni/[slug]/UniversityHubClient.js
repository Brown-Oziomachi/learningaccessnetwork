"use client";
// app/uni/[slug]/UniversityHubClient.jsx

import { useState, useMemo } from "react";
import Link from "next/link";
import {
    BookOpen, Search, ChevronRight, MapPin,
    GraduationCap, BookMarked, Send, X, CheckCircle,
    ArrowLeft, Users, BadgeCheck,
} from "lucide-react";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db, auth } from "@/lib/firebaseConfig";
import Navbar from "@/components/NavBar";

const NAVY = "#0d2244";
const GOLD = "#b8963e";
const GOLDD = "#d4aa5a";
const BG = "#f5f1ea";

/* ─── thumbnail helper ────────────────────────────────────── */
const thumb = (book) => {
    if (book.driveFileId) return `https://drive.google.com/thumbnail?id=${book.driveFileId}&sz=w400`;
    if (book.embedUrl) {
        const m = book.embedUrl.match(/\/d\/(.*?)\/|\/file\/d\/(.*?)\/|id=(.*?)(&|$)/);
        if (m) { const id = m[1] || m[2] || m[3]; if (id) return `https://drive.google.com/thumbnail?id=${id}&sz=w400`; }
    }
    if (book.pdfUrl?.includes("drive.google.com")) {
        const m = book.pdfUrl.match(/[-\w]{25,}/);
        if (m) return `https://drive.google.com/thumbnail?id=${m[0]}&sz=w400`;
    }
    return "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400";
};

const RESOURCE_COLORS = {
    "Textbook": { bg: "rgba(13,34,68,0.08)", color: NAVY },
    "Past Questions": { bg: "rgba(184,150,62,0.15)", color: "#92400e" },
    "Lecture Notes": { bg: "rgba(22,163,74,0.12)", color: "#166534" },
    "Research": { bg: "rgba(139,92,246,0.12)", color: "#5b21b6" },
    "Project": { bg: "rgba(239,68,68,0.1)", color: "#991b1b" },
};
const resourceStyle = (t) => RESOURCE_COLORS[t] || { bg: "rgba(13,34,68,0.06)", color: NAVY };

/* ─── avatar palettes ──────────────────────────────────────── */
const PALETTES = [
    { bg: "#0d2244", text: "#d4aa5a" },
    { bg: "#1a3a5c", text: "#f5f0e8" },
    { bg: "#2c1810", text: "#d4aa5a" },
    { bg: "#1a2c1a", text: "#a8d5a2" },
    { bg: "#2c1a2c", text: "#d4aa5a" },
    { bg: "#0a2233", text: "#7eccd4" },
];
const getPalette = (name) => PALETTES[(name || "?").charCodeAt(0) % PALETTES.length];
const getInitials = (name) => {
    const parts = (name || "?").trim().split(" ").filter(Boolean);
    if (parts.length === 0) return "?";
    if (parts.length === 1) return parts[0][0].toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

/* ════ AVATAR ══════════════════════════════════════════════ */
function Avatar({ person, size = 38, ring = false }) {
    const palette = getPalette(person.name);
    const initials = getInitials(person.name);
    const shadow = ring ? `0 0 0 2px #fff, 0 0 0 3.5px ${GOLD}` : "none";

    return (
        <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
            {person.photoUrl ? (
                <img
                    src={person.photoUrl}
                    alt={person.name}
                    style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover", objectPosition: "top", border: `2px solid ${GOLD}`, boxShadow: shadow, display: "block" }}
                    onError={e => { e.currentTarget.style.display = "none"; if (e.currentTarget.nextSibling) e.currentTarget.nextSibling.style.display = "flex"; }}
                />
            ) : null}
            <div style={{
                width: size, height: size, borderRadius: "50%",
                background: palette.bg, border: `2px solid ${GOLD}`,
                display: person.photoUrl ? "none" : "flex",
                alignItems: "center", justifyContent: "center",
                fontSize: size * 0.34, fontWeight: 700, color: palette.text,
                fontFamily: "'Playfair Display',serif",
                boxShadow: shadow,
                position: person.photoUrl ? "absolute" : "static",
                top: 0, left: 0,
            }}>
                {initials}
            </div>
            {person.verified && (
                <div style={{ position: "absolute", bottom: -2, right: -2, background: "#fff", borderRadius: "50%", lineHeight: 0 }}>
                    <BadgeCheck size={Math.round(size * 0.4)} style={{ color: "#2563eb" }} />
                </div>
            )}
        </div>
    );
}

/* ════ CONTRIBUTOR AVATAR STRIP (hero) ═════════════════════ */
function ContributorStrip({ contributors }) {
    if (!contributors.length) return null;
    const visible = contributors.slice(0, 9);
    const overflow = contributors.length - visible.length;
    const SIZE = 38;
    const OVERLAP = 11;

    return (
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", position: "relative" }}>
                {visible.map((c, i) => (
                    <Link
                        key={c.id}
                        href={`/seller-profile?sellerId=${c.profileId || c.id}`}
                        title={`${c.name}${c.department ? ` · ${c.department}` : ""}`}
                        style={{
                            display: "block",
                            marginLeft: i === 0 ? 0 : -OVERLAP,
                            zIndex: visible.length - i,
                            position: "relative",
                            transition: "transform 0.18s, z-index 0s",
                        }}
                        className="contributor-avatar-hover"
                    >
                        <Avatar person={c} size={SIZE} ring />
                    </Link>
                ))}
                {overflow > 0 && (
                    <div style={{
                        width: SIZE, height: SIZE, borderRadius: "50%",
                        background: "rgba(255,255,255,0.1)",
                        border: "2px solid rgba(255,255,255,0.25)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.75)",
                        fontFamily: "'Lato',sans-serif",
                        marginLeft: -OVERLAP, flexShrink: 0,
                    }}>
                        +{overflow}
                    </div>
                )}
            </div>
            <div>
                <p style={{ fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.9)", margin: "0 0 2px", fontFamily: "'Lato',sans-serif" }}>
                    {contributors.length} Lecturer{contributors.length !== 1 ? "s" : ""}
                </p>
                <p style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", margin: 0, fontFamily: "'Lato',sans-serif" }}>
                    contributing materials
                </p>
            </div>
        </div>
    );
}

/* ════ CONTRIBUTOR ROW CARD ════════════════════════════════ */
function ContributorCard({ person }) {
    const titleDisplay = person.title?.toLowerCase().includes("lecturer") ? "Lecturer" : person.title;
    const displayName = person.title ? `${person.title} ${person.name}` : person.name;

    return (
        <Link href={`/seller-profile?sellerId=${person.profileId || person.id}`} style={{ textDecoration: "none" }}>
            <div className="hub-contributor-card">
                <Avatar person={person} size={44} />
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                        <p style={{ fontFamily: "'Playfair Display',serif", fontSize: 13, fontWeight: 700, color: NAVY, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {displayName}
                        </p>
                        {person.title && (
                            <span style={{ fontSize: 8, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: GOLD, background: "rgba(184,150,62,0.12)", border: "0.5px solid rgba(184,150,62,0.3)", padding: "1px 6px", flexShrink: 0 }}>
                                {titleDisplay}
                            </span>
                        )}
                    </div>
                    {(person.department || person.faculty) && (
                        <p style={{ fontSize: 10, color: "#aaa", margin: "0 0 2px", fontFamily: "'Lato',sans-serif", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {[person.department, person.faculty].filter(Boolean).join(" · ")}
                        </p>
                    )}
                    {person.totalMaterials > 0 && (
                        <p style={{ fontSize: 10, color: GOLD, margin: 0, fontFamily: "'Lato',sans-serif", fontWeight: 700 }}>
                            {person.totalMaterials} material{person.totalMaterials !== 1 ? "s" : ""}
                        </p>
                    )}
                </div>
                <ChevronRight size={13} style={{ color: "#ccc", flexShrink: 0 }} />
            </div>
        </Link>
    );
}

/* ════ MINI LECTURER CHIP (used inside BookCard) ═══════════ */
function LecturerChip({ book }) {
    if (!book.contributorId) return null;

    const palette = getPalette(book.contributorName || "?");
    const initials = getInitials(book.contributorName || "?");
    const SIZE = 18;

    return (
        <Link
            href={`/seller-profile?sellerId=${book.contributorProfileId || book.contributorId}`}
            onClick={e => e.stopPropagation()}
            style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 5, padding: "4px 7px 4px 4px", background: "rgba(13,34,68,0.04)", border: "0.5px solid rgba(184,150,62,0.2)", maxWidth: "100%", overflow: "hidden" }}
            title={`${book.contributorTitle ? book.contributorTitle + " " : ""}${book.contributorName}`}
        >
            {/* Tiny avatar */}
            <div style={{ width: SIZE, height: SIZE, borderRadius: "50%", flexShrink: 0, overflow: "hidden", border: `1.5px solid ${GOLD}` }}>
                {book.contributorPhoto ? (
                    <img
                        src={book.contributorPhoto}
                        alt={book.contributorName}
                        style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top", display: "block" }}
                        onError={e => {
                            e.currentTarget.style.display = "none";
                            if (e.currentTarget.nextSibling) e.currentTarget.nextSibling.style.display = "flex";
                        }}
                    />
                ) : null}
                <div style={{
                    width: SIZE, height: SIZE, borderRadius: "50%",
                    background: palette.bg,
                    display: book.contributorPhoto ? "none" : "flex",
                    alignItems: "center", justifyContent: "center",
                    fontSize: SIZE * 0.38, fontWeight: 700, color: palette.text,
                    fontFamily: "'Playfair Display',serif",
                    position: book.contributorPhoto ? "absolute" : "static",
                    top: 0, left: 0,
                }}>
                    {initials}
                </div>
            </div>

            {/* Name */}
            <span style={{
                fontSize: 9, fontWeight: 700, color: NAVY,
                fontFamily: "'Lato',sans-serif",
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                letterSpacing: "0.02em",
            }}>
                {book.contributorTitle
                    ? `${book.contributorTitle} ${book.contributorName}`
                    : book.contributorName}
            </span>
        </Link>
    );
}

/* ════ BOOK CARD ════════════════════════════════════════════ */
function BookCard({ book }) {
    const rs = resourceStyle(book.resourceType);
    return (
        <Link href={`/book/preview?id=${book.firestoreId}`} style={{ textDecoration: "none", display: "block" }}>
            <div className="hub-book-card">
                <div style={{ position: "relative", background: "#ede8df", overflow: "hidden" }}>
                    <img src={thumb(book)} alt={book.title} className="hub-book-img"
                        style={{ width: "100%", aspectRatio: "3/4", objectFit: "cover", display: "block" }}
                        onError={e => { e.target.src = "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400"; }} />
                    <div style={{ position: "absolute", top: 7, left: 7, display: "inline-flex", alignItems: "center", gap: 4, background: NAVY, padding: "2px 7px", fontSize: 9, fontWeight: 700, color: "#fff", fontFamily: "'Lato',sans-serif" }}>
                        <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#22c55e", display: "inline-block" }} /> PDF
                    </div>
                    {book.resourceType && (
                        <div style={{ position: "absolute", bottom: 7, left: 7, background: rs.bg, padding: "2px 7px", fontSize: 9, fontWeight: 700, color: rs.color, fontFamily: "'Lato',sans-serif", backdropFilter: "blur(4px)" }}>
                            {book.resourceType}
                        </div>
                    )}
                    {book.courseCode && (
                        <div style={{ position: "absolute", top: 7, right: 7, background: GOLD, padding: "2px 7px", fontSize: 9, fontWeight: 700, color: NAVY, fontFamily: "monospace" }}>
                            {book.courseCode}
                        </div>
                    )}
                </div>

                <div style={{ padding: "10px 10px 12px", borderTop: "0.5px solid #f0ebe0", background: "#fff" }}>
                    {book.department && (
                        <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: GOLD, margin: "0 0 3px", fontFamily: "'Lato',sans-serif", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{book.department}</p>
                    )}
                    <h4 style={{ fontFamily: "'Playfair Display',serif", fontSize: 13, fontWeight: 700, color: NAVY, margin: "0 0 3px", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", lineHeight: 1.35 }}>{book.title}</h4>
                    <p style={{ fontSize: 11, color: "#888", margin: "0 0 7px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontFamily: "'Lato',sans-serif" }}>{book.author}</p>

                    {/* ── Lecturer attribution chip ── */}
                    {book.contributorId && (
                        <div style={{ marginBottom: 7 }}>
                            <LecturerChip book={book} />
                        </div>
                    )}

                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        {book.price ? <p style={{ fontSize: 12, fontWeight: 700, color: NAVY, margin: 0, fontFamily: "'Lato',sans-serif" }}>₦{Number(book.price).toLocaleString()}</p> : <span />}
                        {book.level && <span style={{ fontSize: 9, color: "#bbb", fontFamily: "'Lato',sans-serif" }}>{book.level}</span>}
                    </div>
                </div>
            </div>
        </Link>
    );
}

/* ════ REQUEST MODAL ════════════════════════════════════════ */
function RequestModal({ uni, onClose }) {
    const [form, setForm] = useState({ courseCode: "", materialType: "Textbook", notes: "" });
    const [done, setDone] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async () => {
        if (!form.courseCode.trim()) return;
        setSubmitting(true);
        try {
            await addDoc(collection(db, "materialRequests"), {
                institutionSlug: uni?.short || "unknown",
                institutionName: uni?.name || "Unknown University",
                courseCode: form.courseCode.trim().toUpperCase(),
                materialType: form.materialType,
                notes: form.notes.trim() || null,
                userId: auth.currentUser?.uid || null,
                userEmail: auth.currentUser?.email || null,
                status: "pending",
                createdAt: serverTimestamp(),
            });
            await addDoc(collection(db, "adminNotifications"), {
                type: "material_request",
                title: `Material Request — ${form.courseCode.trim().toUpperCase()} (${uni?.short})`,
                message: `A student requested ${form.materialType} for ${form.courseCode.trim().toUpperCase()} at ${uni?.name}.`,
                read: false,
                createdAt: serverTimestamp(),
            });
            setDone(true);
        } catch (e) { alert("Failed: " + e.message); }
        finally { setSubmitting(false); }
    };

    const inp = { width: "100%", border: "0.5px solid #e5ddd0", padding: "10px 13px", fontSize: 13, color: NAVY, outline: "none", fontFamily: "'Lato',sans-serif", background: "#fafaf8" };
    const lbl = { display: "block", fontSize: 9, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: GOLD, fontFamily: "'Lato',sans-serif", marginBottom: 7 };

    return (
        <div style={{ position: "fixed", inset: 0, zIndex: 80, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
            <div style={{ background: "#fff", width: "100%", maxWidth: 440, border: "0.5px solid #e5ddd0", animation: "fadeUp 0.25s ease both" }}>
                <div style={{ background: NAVY, padding: "20px 24px", backgroundImage: "radial-gradient(rgba(184,150,62,0.07) 1px,transparent 1px)", backgroundSize: "20px 20px", position: "relative", overflow: "hidden" }}>
                    <div style={{ position: "absolute", top: -20, right: -20, width: 80, height: 80, border: "0.5px solid rgba(184,150,62,0.2)", transform: "rotate(45deg)" }} />
                    <button onClick={onClose} style={{ position: "absolute", top: 14, right: 14, background: "rgba(255,255,255,0.08)", border: "0.5px solid rgba(255,255,255,0.18)", color: "rgba(255,255,255,0.6)", width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                        <X size={13} />
                    </button>
                    <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(184,150,62,0.15)", border: "0.5px solid rgba(184,150,62,0.35)", padding: "3px 10px", marginBottom: 10 }}>
                        <BookMarked size={9} style={{ color: GOLDD }} />
                        <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: GOLDD, fontFamily: "'Lato',sans-serif" }}>Request Material</span>
                    </div>
                    <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: 18, fontWeight: 700, color: "#fff", margin: "0 0 4px" }}>Can't Find Your Course?</h2>
                    <p style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", fontFamily: "'Lato',sans-serif", margin: 0 }}>{uni?.name}</p>
                </div>
                <div style={{ padding: "22px 24px" }}>
                    {done ? (
                        <div style={{ textAlign: "center", padding: "20px 0" }}>
                            <div style={{ width: 48, height: 48, background: "rgba(22,163,74,0.1)", border: "0.5px solid rgba(22,163,74,0.3)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
                                <CheckCircle size={20} style={{ color: "#16a34a" }} />
                            </div>
                            <p style={{ fontFamily: "'Playfair Display',serif", fontSize: 16, fontWeight: 700, color: NAVY, margin: "0 0 6px" }}>Request Logged!</p>
                            <p style={{ fontSize: 12, color: "#888", fontFamily: "'Lato',sans-serif", lineHeight: 1.6, margin: "0 0 18px" }}>We'll source this material and notify you when it's available.</p>
                            <button onClick={onClose} style={{ background: NAVY, color: "#fff", border: "none", padding: "10px 24px", fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", cursor: "pointer", fontFamily: "'Lato',sans-serif" }}>Done</button>
                        </div>
                    ) : (
                        <>
                            <div style={{ marginBottom: 16 }}><label style={lbl}>Course Code *</label><input type="text" value={form.courseCode} onChange={e => setForm(f => ({ ...f, courseCode: e.target.value }))} placeholder="e.g. ACC 101, GST 201" style={inp} /></div>
                            <div style={{ marginBottom: 16 }}><label style={lbl}>Material Type</label>
                                <select value={form.materialType} onChange={e => setForm(f => ({ ...f, materialType: e.target.value }))} style={inp}>
                                    {["Textbook", "Past Questions", "Lecture Notes", "Research", "Project"].map(t => <option key={t}>{t}</option>)}
                                </select>
                            </div>
                            <div style={{ marginBottom: 20 }}><label style={lbl}>Additional Notes (optional)</label><input type="text" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="e.g. 2023 edition preferred" style={inp} /></div>
                            <button onClick={handleSubmit} disabled={submitting || !form.courseCode.trim()} style={{ width: "100%", background: submitting ? "#888" : NAVY, color: "#fff", border: "none", padding: 13, fontSize: 12, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", cursor: submitting ? "not-allowed" : "pointer", fontFamily: "'Lato',sans-serif", display: "flex", alignItems: "center", justifyContent: "center", gap: 7 }}>
                                <Send size={12} /> {submitting ? "Submitting…" : "Submit Request"}
                            </button>
                        </>
                    )}
                </div>
            </div>
            <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}`}</style>
        </div>
    );
}

/* ════ MAIN CLIENT COMPONENT ══════════════════════════════ */
export default function UniversityHubClient({
    slug, uni, initialBooks,
    contributors = [],
    studentCount = null,
}) {
    const [search, setSearch] = useState("");
    const [activeType, setActiveType] = useState("All");
    const [activeDept, setActiveDept] = useState("All");
    const [showRequest, setShowRequest] = useState(false);
    const [showContributors, setShowContributors] = useState(false);

    const resourceTypes = useMemo(() => {
        const types = [...new Set(initialBooks.map(b => b.resourceType).filter(Boolean))];
        return ["All", ...types];
    }, [initialBooks]);

    const departments = useMemo(() => {
        const depts = [...new Set(initialBooks.map(b => b.department).filter(Boolean))];
        return ["All", ...depts.sort()];
    }, [initialBooks]);

    const filtered = useMemo(() => {
        let list = initialBooks;
        if (activeType !== "All") list = list.filter(b => b.resourceType === activeType);
        if (activeDept !== "All") list = list.filter(b => b.department === activeDept);
        if (search.trim()) {
            const q = search.toLowerCase();
            list = list.filter(b =>
                [b.title, b.author, b.courseCode, b.department, b.faculty, b.level, b.resourceType, b.contributorName]
                    .filter(Boolean).join(" ").toLowerCase().includes(q)
            );
        }
        return list;
    }, [initialBooks, activeType, activeDept, search]);

    const grouped = useMemo(() => {
        const g = {};
        filtered.forEach(b => { const k = b.resourceType || "Other"; if (!g[k]) g[k] = []; g[k].push(b); });
        return g;
    }, [filtered]);

    const isUnknown = !uni;

    const fmtCount = (n) => {
        if (n === null || n === undefined) return "—";
        if (n >= 10000) return `${Math.round(n / 1000)}k`;
        if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
        return `${n}`;
    };

    return (
        <>
            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400&family=Lato:wght@300;400;700&display=swap');
        *{box-sizing:border-box;} body{margin:0;}
        .hub-root{font-family:'Lato',sans-serif;background:${BG};min-height:100vh;}
        .hub-book-card{border:0.5px solid #e5ddd0;overflow:hidden;background:#fff;cursor:pointer;transition:transform 0.2s,box-shadow 0.2s,border-color 0.2s;}
        .hub-book-card:hover{transform:translateY(-4px);box-shadow:0 12px 32px rgba(13,34,68,0.14);border-color:${GOLD};}
        .hub-book-card:hover .hub-book-img{transform:scale(1.05);}
        .hub-book-img{transition:transform 0.5s cubic-bezier(0.4,0,0.2,1);}
        .hub-pill{padding:6px 14px;border:0.5px solid #e5ddd0;font-size:11px;font-weight:700;cursor:pointer;transition:all 0.18s;font-family:'Lato',sans-serif;letter-spacing:0.05em;background:#fff;color:${NAVY};display:inline-flex;align-items:center;gap:5px;}
        .hub-pill:hover{border-color:${GOLD};}
        .hub-pill.active{background:${NAVY};color:#fff;border-color:${NAVY};}
        .hub-search{width:100%;border:0.5px solid #e5ddd0;padding:11px 14px 11px 38px;font-size:13px;color:${NAVY};outline:none;font-family:'Lato',sans-serif;background:#fff;transition:border-color 0.18s;}
        .hub-search:focus{border-color:${GOLD};}
        .hub-search::placeholder{color:#bbb;}
        .hub-contributor-card{display:flex;align-items:center;gap:12px;padding:14px 16px;border:0.5px solid #e5ddd0;background:#fff;cursor:pointer;transition:border-color 0.18s,box-shadow 0.18s;}
        .hub-contributor-card:hover{border-color:${GOLD};box-shadow:0 4px 16px rgba(13,34,68,0.08);}
        .contributor-avatar-hover:hover{transform:translateY(-4px) scale(1.1);z-index:99!important;}
        @keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
        .fade-up{animation:fadeUp 0.4s ease both;}
        @media(max-width:640px){.hub-hero-title{font-size:28px!important;}}
        .hub-books-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:14px;}
        @media(max-width:640px){
          .hub-books-grid{grid-template-columns:repeat(2,1fr);gap:10px;}
        }
      `}</style>

            <div className="hub-root">
                <Navbar />

                {/* ══ HERO ══════════════════════════════════════════════ */}
                <div style={{ position: "relative", overflow: "hidden", minHeight: 420 }}>

                    {/* Campus background image */}
                    <div style={{
                        position: "absolute", inset: 0,
                        backgroundImage: `url(https://images.unsplash.com/photo-1607237138185-eedd9c632b0b?w=1400&q=80)`,
                        backgroundSize: "cover",
                        backgroundPosition: "center 30%",
                        filter: "brightness(0.98) saturate(0.0)",
                    }} />

                    {/* Navy gradient overlay */}
                    <div style={{
                        position: "absolute", inset: 0,
                        background: `linear-gradient(10deg, ${NAVY}f0 20%, ${NAVY}cc 10%, rgba(3,3,8,0.5) 100%)`,
                    }} />

                    {/* Dot pattern */}
                    <div style={{
                        position: "absolute", inset: 0,
                        backgroundImage: "radial-gradient(rgba(184,150,62,0.07) 1px, transparent 1px)",
                        backgroundSize: "28px 28px",
                    }} />

                    {/* Decorative corners */}
                    <div style={{ position: "absolute", top: -60, right: -60, width: 240, height: 240, border: "0.5px solid rgba(184,150,62,0.12)", transform: "rotate(45deg)" }} />
                    <div style={{ position: "absolute", bottom: -40, left: -40, width: 160, height: 160, border: "0.5px solid rgba(184,150,62,0.08)", transform: "rotate(45deg)" }} />

                    {/* Content */}
                    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "56px 24px 48px", position: "relative", zIndex: 1 }}>

                        {/* ── Top bar: LAN logo + breadcrumb ── */}
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28, flexWrap: "wrap", gap: 12 }}>

                            {/* Breadcrumb */}
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                <Link href="/home" style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, fontFamily: "'Lato',sans-serif", textDecoration: "none", display: "flex", alignItems: "center", gap: 5 }}>
                                    <ArrowLeft size={12} /> Home
                                </Link>
                                <ChevronRight size={12} style={{ color: "rgba(255,255,255,0.2)" }} />
                                <Link href="/uni" style={{ color: GOLDD, fontSize: 12, fontFamily: "'Lato',sans-serif", textDecoration: "none" }}>University Hubs</Link>
                                {uni && <>
                                    <ChevronRight size={12} style={{ color: "rgba(255,255,255,0.2)" }} />
                                    <span style={{ color: "rgba(255,255,255,0.6)", fontSize: 12, fontFamily: "'Lato',sans-serif" }}>{uni.short}</span>
                                </>}
                            </div>

                            {/* LAN Library logo */}
                            <div style={{ display: "flex", alignItems: "center", gap: 10, background: "rgba(255,255,255,0.06)", border: "0.5px solid rgba(184,150,62,0.25)", padding: "8px 14px" }}>
                                <div style={{
                                    width: 28, height: 28, background: GOLD,
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    flexShrink: 0,
                                }}>
                                    <BookOpen size={15} color={NAVY} strokeWidth={2.5} />
                                </div>
                                <div>
                                    <div style={{ fontSize: 11, fontWeight: 700, color: "#fff", fontFamily: "'Playfair Display',serif", letterSpacing: "0.04em", lineHeight: 1 }}>LAN Library</div>
                                    <div style={{ fontSize: 8, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: GOLD, fontFamily: "'Lato',sans-serif", marginTop: 2 }}>Academic Hub</div>
                                </div>
                            </div>
                        </div>

                        {/* Badge */}
                        <div className="fade-up" style={{ display: "inline-flex", alignItems: "center", gap: 7, background: "rgba(184,150,62,0.14)", border: "1px solid rgba(184,150,62,0.3)", padding: "4px 14px", marginBottom: 16 }}>
                            <GraduationCap size={11} style={{ color: GOLD }} />
                            <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: GOLDD, fontFamily: "'Lato',sans-serif" }}>
                                {isUnknown ? "University Hub" : uni.type}
                            </span>
                            <span style={{ width: 1, height: 10, background: "rgba(184,150,62,0.3)" }} />
                            <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(184,150,62,0.6)", fontFamily: "'Lato',sans-serif" }}>Verified Materials</span>
                        </div>

                        {/* Title */}
                        <h1 className="hub-hero-title" style={{ fontFamily: "'Playfair Display',serif", fontSize: "clamp(28px,5vw,52px)", fontWeight: 700, color: "#fff", margin: "0 0 10px", lineHeight: 1.08 }}>
                            {isUnknown ? `Hub: ${slug}` : uni.name}
                        </h1>

                        {/* Meta chips */}
                        {uni && (
                            <div style={{ display: "flex", flexWrap: "wrap", gap: 20, marginBottom: 24 }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "rgba(255,255,255,0.5)", fontFamily: "'Lato',sans-serif" }}>
                                    <MapPin size={12} style={{ color: GOLD }} /> {uni.state}
                                    {uni.country && <span style={{ color: "rgba(255,255,255,0.25)" }}>· {uni.country}</span>}
                                </div>
                                <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "rgba(255,255,255,0.5)", fontFamily: "'Lato',sans-serif" }}>
                                    <GraduationCap size={12} style={{ color: GOLD }} /> Est. {uni.founded}
                                </div>
                                <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontFamily: "'Lato',sans-serif" }}>
                                    <Users size={12} style={{ color: GOLD }} />
                                    <span style={{ color: studentCount !== null && studentCount > 0 ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.35)" }}>
                                        {fmtCount(studentCount)}
                                    </span>
                                    <span style={{ color: "rgba(255,255,255,0.4)" }}>registered student{studentCount !== 1 ? "s" : ""}</span>
                                </div>
                            </div>
                        )}

                        <p style={{ fontSize: 14, color: "rgba(255,255,255,0.5)", maxWidth: 560, lineHeight: 1.75, fontWeight: 300, margin: "0 0 28px", fontFamily: "'Lato',sans-serif" }}>
                            {initialBooks.length > 0
                                ? `${initialBooks.length} verified academic material${initialBooks.length !== 1 ? "s" : ""} — textbooks, past questions, lecture notes and more.`
                                : `Be the first to contribute materials for ${uni?.name || slug}.`}
                        </p>

                        {/* Contributor avatar strip */}
                        {contributors.length > 0 && (
                            <div style={{ marginBottom: 28 }}>
                                <ContributorStrip contributors={contributors} />
                            </div>
                        )}

                        {/* Stats bar */}
                        <div style={{ display: "flex", flexWrap: "wrap", borderTop: "0.5px solid rgba(184,150,62,0.15)", paddingTop: 24 }}>
                            {[
                                { val: initialBooks.length, label: "Materials" },
                                { val: [...new Set(initialBooks.map(b => b.department).filter(Boolean))].length, label: "Departments" },
                                { val: [...new Set(initialBooks.map(b => b.courseCode).filter(Boolean))].length, label: "Course Codes" },
                                { val: contributors.length, label: "Contributors" },
                            ].map(({ val, label }) => (
                                <div key={label} style={{ flex: "1 1 100px", padding: "0 20px 0 0", marginRight: 20, borderRight: "0.5px solid rgba(184,150,62,0.1)" }}>
                                    <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 28, fontWeight: 700, color: "#fff" }}>{val}</div>
                                    <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(184,150,62,0.6)", marginTop: 3, fontFamily: "'Lato',sans-serif" }}>{label}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* ══ STICKY FILTER BAR ════════════════════════════════ */}
                <div style={{ background: "#fff", borderBottom: "0.5px solid #e5ddd0", padding: "16px 24px", position: "sticky", top: 0, zIndex: 30 }}>
                    <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center" }}>
                        <div style={{ flex: "1 1 200px", position: "relative", minWidth: 180 }}>
                            <Search size={13} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#bbb" }} />
                            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by title, course code, lecturer…" className="hub-search" />
                        </div>
                        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                            {resourceTypes.map(t => (
                                <button key={t} className={`hub-pill${activeType === t ? " active" : ""}`} onClick={() => setActiveType(t)}>{t}</button>
                            ))}
                        </div>
                        {contributors.length > 0 && (
                            <button className={`hub-pill${showContributors ? " active" : ""}`} onClick={() => setShowContributors(s => !s)}>
                                <GraduationCap size={11} /> Contributors ({contributors.length})
                            </button>
                        )}
                    </div>
                    {departments.length > 1 && (
                        <div style={{ maxWidth: 1100, margin: "10px auto 0", display: "flex", gap: 6, flexWrap: "wrap" }}>
                            <span style={{ fontSize: 10, fontWeight: 700, color: "#bbb", fontFamily: "'Lato',sans-serif", letterSpacing: "0.1em", textTransform: "uppercase", alignSelf: "center", marginRight: 4 }}>Dept:</span>
                            {departments.map(d => (
                                <button key={d} className={`hub-pill${activeDept === d ? " active" : ""}`} style={{ fontSize: 10, padding: "4px 10px" }} onClick={() => setActiveDept(d)}>{d}</button>
                            ))}
                        </div>
                    )}
                </div>

                {/* ══ MAIN CONTENT ═════════════════════════════════════ */}
                <div style={{ maxWidth: 1100, margin: "0 auto", padding: "36px 24px 80px" }}>

                    {/* Lecturer panel (expandable) */}
                    {showContributors && contributors.length > 0 && (
                        <div style={{ marginBottom: 48, animation: "fadeUp 0.3s ease both" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                                <div style={{ width: 4, height: 28, background: GOLD }} />
                                <div>
                                    <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: GOLD, margin: "0 0 2px", fontFamily: "'Lato',sans-serif" }}>Faculty</p>
                                    <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: 20, fontWeight: 700, color: NAVY, margin: 0 }}>
                                        Lecturers at {uni?.short || slug}
                                        <span style={{ fontSize: 13, fontWeight: 400, color: "#bbb", marginLeft: 8, fontFamily: "'Lato',sans-serif" }}>({contributors.length})</span>
                                    </h3>
                                </div>
                            </div>
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))", gap: 10 }}>
                                {contributors.map(c => <ContributorCard key={c.id} person={c} />)}
                            </div>
                        </div>
                    )}

                    {/* Empty state */}
                    {initialBooks.length === 0 && (
                        <div style={{ textAlign: "center", padding: "72px 24px", border: "0.5px dashed #e5ddd0", background: "#fff" }}>
                            <div style={{ width: 64, height: 64, border: "0.5px solid #e5ddd0", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 18px" }}>
                                <BookOpen size={28} style={{ color: "#ccc" }} />
                            </div>
                            <p style={{ fontFamily: "'Playfair Display',serif", fontSize: 22, fontWeight: 700, color: NAVY, margin: "0 0 8px" }}>No Materials Yet</p>
                            <p style={{ fontSize: 13, color: "#aaa", fontFamily: "'Lato',sans-serif", lineHeight: 1.7, maxWidth: 400, margin: "0 auto 28px" }}>
                                Be the first to contribute academic materials for {uni?.name || slug}. Sellers earn on every sale.
                            </p>
                            <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
                                <button onClick={() => setShowRequest(true)} style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "12px 24px", background: NAVY, color: "#fff", border: "none", fontSize: 12, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", cursor: "pointer", fontFamily: "'Lato',sans-serif" }}>
                                    <BookMarked size={13} /> Request a Material
                                </button>
                                <Link href="/upload-document" style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "12px 24px", background: "transparent", color: NAVY, border: `0.5px solid ${NAVY}`, fontSize: 12, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", textDecoration: "none", fontFamily: "'Lato',sans-serif" }}>
                                    <BookOpen size={13} /> Upload a Book
                                </Link>
                            </div>
                        </div>
                    )}

                    {/* No filter results */}
                    {initialBooks.length > 0 && filtered.length === 0 && (
                        <div style={{ textAlign: "center", padding: "56px 24px" }}>
                            <p style={{ fontFamily: "'Playfair Display',serif", fontSize: 20, color: NAVY, margin: "0 0 6px" }}>No matches found</p>
                            <p style={{ fontSize: 13, color: "#aaa" }}>Try a different course code or filter.</p>
                            <button onClick={() => setShowRequest(true)} style={{ marginTop: 20, display: "inline-flex", alignItems: "center", gap: 7, padding: "10px 22px", background: NAVY, color: "#fff", border: "none", fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", cursor: "pointer", fontFamily: "'Lato',sans-serif" }}>
                                <Send size={12} /> Request This Material
                            </button>
                        </div>
                    )}

                    {/* Book groups */}
                    {filtered.length > 0 && Object.entries(grouped).map(([type, books]) => (
                        <div key={type} style={{ marginBottom: 48 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
                                <div style={{ width: 4, height: 28, background: GOLD }} />
                                <div>
                                    <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: GOLD, margin: "0 0 2px", fontFamily: "'Lato',sans-serif" }}>{uni?.short} Materials</p>
                                    <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: 22, fontWeight: 700, color: NAVY, margin: 0 }}>
                                        {type} <span style={{ fontSize: 13, fontWeight: 400, color: "#bbb", marginLeft: 8, fontFamily: "'Lato',sans-serif" }}>({books.length})</span>
                                    </h3>
                                </div>
                            </div>
                            <div className="hub-books-grid">
                                {books.map(book => <BookCard key={book.id} book={book} />)}
                            </div>
                        </div>
                    ))}

                    {/* Bottom CTA */}
                    {initialBooks.length > 0 && (
                        <div style={{ background: NAVY, backgroundImage: "radial-gradient(rgba(184,150,62,0.06) 1px,transparent 1px)", backgroundSize: "22px 22px", padding: "36px 32px", display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 20 }}>
                            <div>
                                <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: GOLD, margin: "0 0 6px", fontFamily: "'Lato',sans-serif" }}>Missing Something?</p>
                                <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: 20, fontWeight: 700, color: "#fff", margin: "0 0 6px" }}>Can't find your course material?</h3>
                                <p style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", fontFamily: "'Lato',sans-serif", margin: 0 }}>Tell us what you need — we'll source it from lecturers.</p>
                            </div>
                            <button onClick={() => setShowRequest(true)} style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "12px 24px", background: GOLD, color: NAVY, border: "none", fontSize: 12, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", cursor: "pointer", fontFamily: "'Lato',sans-serif", whiteSpace: "nowrap" }}>
                                <BookMarked size={13} /> Request a Material
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {showRequest && <RequestModal uni={uni} onClose={() => setShowRequest(false)} />}
        </>
    );
}