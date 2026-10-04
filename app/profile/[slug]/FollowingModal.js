// app/profile/[slug]/FollowingModal.jsx
// ─────────────────────────────────────────────────────────────
// Full-page "Following" list. Styled like the Facebook friends list:
// big rounded avatar, name, role label, two buttons per row.
// Rows link to the person's own profile.
// ─────────────────────────────────────────────────────────────

"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
    collection,
    getDocs,
    getDoc,
    doc,
    query,
    where,
    deleteDoc,
    updateDoc,
    increment,
} from "firebase/firestore";
import { db } from "@/lib/firebaseConfig";
import {
    ArrowLeft,
    Search,
    X,
    GraduationCap,
    Sparkles,
    Users,
    UserCheck,
} from "lucide-react";

const NAVY = "#0d2244";
const GOLD = "#b8963e";
const GOLDD = "#d4aa5a";
const BG = "#f5f1ea";
const LINE = "#e5ddd0";

const TITLES = ["lecturer", "dr.", "prof.", "professor", "mrs", "mr"];

const isAcademic = (s, u) =>
    u?.isLecturer === true ||
    u?.role === "lecturer" ||
    s?.isLecturer === true ||
    TITLES.includes(
        String(s?.title || s?.sellerTitle || u?.title || u?.lecturerTitle || "").toLowerCase()
    );

export default function FollowingModal({
    open,
    onClose,
    profileUid,
    profileName,
    isOwner,
    router,
    onUnfollowed,
}) {
    const [people, setPeople] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(false);
    const [search, setSearch] = useState("");
    const [busyId, setBusyId] = useState(null);

    /* Lock page scroll + close on Escape */
    useEffect(() => {
        if (!open) return;
        const prev = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        const onKey = (e) => e.key === "Escape" && onClose();
        window.addEventListener("keydown", onKey);
        return () => {
            document.body.style.overflow = prev;
            window.removeEventListener("keydown", onKey);
        };
    }, [open, onClose]);

    /* Load who this profile follows */
    useEffect(() => {
        if (!open || !profileUid) return;
        let cancelled = false;
        setSearch("");
        setLoading(true);
        setError(false);

        (async () => {
            try {
                const snap = await getDocs(
                    query(collection(db, "follows"), where("followerId", "==", profileUid))
                );
                const rows = snap.docs
                    .map((d) => ({
                        id: d.data().lecturerId,
                        at: d.data().createdAt?.toMillis?.() || 0,
                    }))
                    .filter((r) => r.id && r.id !== profileUid);

                // de-dupe
                const seen = new Set();
                const unique = rows.filter((r) => !seen.has(r.id) && seen.add(r.id));

                const list = await Promise.all(
                    unique.map(async (r) => {
                        try {
                            const [sd, ud] = await Promise.all([
                                getDoc(doc(db, "sellers", r.id)),
                                getDoc(doc(db, "users", r.id)),
                            ]);
                            const s = sd.exists() ? sd.data() : {};
                            const u = ud.exists() ? ud.data() : {};

                            const usersName =
                                ((u.firstName || "") + " " + (u.surname || "")).trim() ||
                                u.displayName ||
                                "";
                            const rawSellerName = s.sellerName || s.displayName || "";
                            const name =
                                usersName || (rawSellerName === "Unknown" ? "" : rawSellerName);
                            if (!name) return null;

                            const academic = isAcademic(s, u);
                            const title = s.title || s.sellerTitle || u.title || u.lecturerTitle || "";

                            return {
                                uid: r.id,
                                at: r.at,
                                slug: s.slug || r.id,
                                name: academic && title ? `${title} ${name}`.trim() : name,
                                photo: u.photoBase64 || u.photoURL || u.profilePicture || null,
                                academic,
                                sub: [s.university || u.university, s.department || u.department]
                                    .filter(Boolean)
                                    .join(" · "),
                            };
                        } catch {
                            return null;
                        }
                    })
                );

                if (cancelled) return;
                setPeople(list.filter(Boolean).sort((a, b) => b.at - a.at));
            } catch (err) {
                console.error("Following list error:", err);
                if (!cancelled) setError(true);
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [open, profileUid]);

    const shown = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return people;
        return people.filter((p) => p.name.toLowerCase().includes(q));
    }, [people, search]);

    const goTo = (p) => {
        onClose();
        router.push(`/profile/${p.slug}`);
    };

    const unfollow = async (p) => {
        if (busyId) return;
        setBusyId(p.uid);
        try {
            await deleteDoc(doc(db, "follows", `${profileUid}_${p.uid}`));
            try {
                await updateDoc(doc(db, "sellers", p.uid), { followersCount: increment(-1) });
            } catch { }
            setPeople((prev) => prev.filter((x) => x.uid !== p.uid));
            onUnfollowed?.();
        } catch (err) {
            console.error("Unfollow failed:", err);
        } finally {
            setBusyId(null);
        }
    };

    if (!open) return null;

    return (
        <div
            role="dialog"
            aria-modal="true"
            aria-label="Following"
            style={{
                position: "fixed",
                inset: 0,
                zIndex: 100,
                background: BG,
                display: "flex",
                flexDirection: "column",
                fontFamily: "'Lato',sans-serif",
                animation: "fmSlide .26s cubic-bezier(.4,0,.2,1) both",
            }}
        >
            <style>{`
        @keyframes fmSlide { from { transform: translateY(24px); opacity:0 } to { transform: translateY(0); opacity:1 } }
        .fm-row { display:flex; gap:16px; align-items:center; padding:14px 16px; background:#fff; border:0.5px solid ${LINE}; }
        .fm-avatar { width:88px; height:88px; flex-shrink:0; border-radius:26px; overflow:hidden; border:1px solid ${LINE};
          background:${NAVY}; display:flex; align-items:center; justify-content:center; cursor:pointer; padding:0; }
        .fm-btn { flex:0 0 auto; padding:7px 18px; border:none; cursor:pointer; font-family:'Lato',sans-serif; font-size:11px;
        font-weight:700; letter-spacing:.04em; border-radius:8px; transition:background .15s; white-space:nowrap; }
        .fm-btn-gold { background:${GOLD}; color:${NAVY}; }
        .fm-btn-gold:hover { background:${GOLDD}; }
        .fm-btn-grey { background:#ece6da; color:${NAVY}; }
        .fm-btn-grey:hover:not(:disabled) { background:#e0d8c8; }
        .fm-btn-grey:disabled { opacity:.55; cursor:not-allowed; }
        .fm-btn:focus-visible, .fm-avatar:focus-visible { outline:2px solid ${GOLD}; outline-offset:2px; }
        @media (prefers-reduced-motion: reduce) { [role=dialog] { animation:none !important; } }
        @media (max-width:420px) { .fm-avatar { width:76px; height:76px; border-radius:22px; } .fm-row { gap:12px; padding:12px; } }
      `}</style>

            {/* Header */}
            <div style={{ background: NAVY, borderBottom: `1px solid rgba(184,150,62,.3)`, flexShrink: 0 }}>
                <div
                    style={{
                        maxWidth: 760,
                        margin: "0 auto",
                        padding: "0 16px",
                        height: 56,
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                    }}
                >
                    <button
                        onClick={onClose}
                        aria-label="Close"
                        style={{ background: "none", border: "none", cursor: "pointer", color: "#fff", display: "flex" }}
                    >
                        <ArrowLeft size={22} />
                    </button>
                    <div style={{ minWidth: 0, flex: 1 }}>
                        <p
                            className="lan-serif"
                            style={{
                                fontFamily: "'Playfair Display',serif",
                                fontSize: 20,
                                fontWeight: 700,
                                color: "#fff",
                                margin: 0,
                                lineHeight: 1.1,
                            }}
                        >
                            Following
                        </p>
                        <p
                            style={{
                                fontSize: 11,
                                color: "rgba(245,240,232,.6)",
                                margin: "2px 0 0",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                            }}
                        >
                            {isOwner ? "People you follow" : `People ${profileName || "this profile"} follows`}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        aria-label="Close following list"
                        style={{
                            background: "rgba(255,255,255,.08)",
                            border: "none",
                            borderRadius: "50%",
                            width: 34,
                            height: 34,
                            cursor: "pointer",
                            color: "#fff",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                        }}
                    >
                        <X size={16} />
                    </button>
                </div>
            </div>

            {/* Scroll area */}
            <div style={{ flex: 1, overflowY: "auto", WebkitOverflowScrolling: "touch" }}>
                <div style={{ maxWidth: 760, margin: "0 auto", padding: "16px 16px 80px" }}>
                    {/* Search */}
                    <div style={{ position: "relative", marginBottom: 14 }}>
                        <Search
                            size={14}
                            style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "#aaa" }}
                        />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search who you follow…"
                            style={{
                                width: "100%",
                                padding: "11px 14px 11px 38px",
                                fontSize: 13,
                                fontFamily: "'Lato',sans-serif",
                                color: NAVY,
                                background: "#fff",
                                border: `0.5px solid ${LINE}`,
                                outline: "none",
                                borderRadius: 999,
                            }}
                            onFocus={(e) => (e.target.style.borderColor = GOLD)}
                            onBlur={(e) => (e.target.style.borderColor = LINE)}
                        />
                    </div>

                    {!loading && !error && people.length > 0 && (
                        <p
                            style={{
                                fontSize: 11,
                                fontWeight: 700,
                                letterSpacing: ".08em",
                                color: "#888",
                                margin: "0 0 12px",
                                textTransform: "uppercase",
                            }}
                        >
                            {shown.length} {shown.length === 1 ? "person" : "people"}
                        </p>
                    )}

                    {/* Loading */}
                    {loading && (
                        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                            {[1, 2, 3, 4].map((i) => (
                                <div key={i} className="fm-row" style={{ animation: "pulse 1.5s infinite" }}>
                                    <div className="fm-avatar" style={{ background: "#f0ebe0", cursor: "default" }} />
                                    <div style={{ flex: 1 }}>
                                        <div style={{ height: 14, width: "55%", background: "#f0ebe0", marginBottom: 10 }} />
                                        <div style={{ height: 36, background: "#f0ebe0", borderRadius: 8 }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Error */}
                    {!loading && error && (
                        <p style={{ textAlign: "center", padding: "48px 0", fontSize: 13, color: "#888" }}>
                            Couldn't load this list. Close it and try again.
                        </p>
                    )}

                    {/* Empty */}
                    {!loading && !error && people.length === 0 && (
                        <div style={{ textAlign: "center", padding: "56px 16px" }}>
                            <Users size={34} style={{ color: LINE, margin: "0 auto 12px" }} />
                            <h3
                                style={{ fontFamily: "'Playfair Display',serif", fontSize: 20, color: NAVY, margin: "0 0 6px" }}
                            >
                                Not following anyone yet
                            </h3>
                            <p style={{ fontSize: 12, color: "#aaa", margin: 0 }}>
                                {isOwner
                                    ? "Follow educators and creators to see them here."
                                    : "When they follow someone, it will show up here."}
                            </p>
                        </div>
                    )}

                    {/* No search match */}
                    {!loading && !error && people.length > 0 && shown.length === 0 && (
                        <p style={{ textAlign: "center", padding: "40px 0", fontSize: 13, color: "#aaa" }}>
                            No one matches "{search}".
                        </p>
                    )}

                    {/* List */}
                    {!loading && !error && shown.length > 0 && (
                        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                            {shown.map((p) => (
                                <div key={p.uid} className="fm-row">
                                    <button
                                        className="fm-avatar"
                                        onClick={() => goTo(p)}
                                        aria-label={`Open ${p.name}'s profile`}
                                    >
                                        {p.photo ? (
                                            <img
                                                src={p.photo}
                                                alt=""
                                                style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                                            />
                                        ) : p.academic ? (
                                            <GraduationCap size={30} style={{ color: GOLD }} />
                                        ) : (
                                            <span
                                                style={{
                                                    color: GOLD,
                                                    fontSize: 28,
                                                    fontFamily: "'Playfair Display',serif",
                                                    fontWeight: 900,
                                                }}
                                            >
                                                {p.name.charAt(0).toUpperCase()}
                                            </span>
                                        )}
                                    </button>

                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <button
                                            onClick={() => goTo(p)}
                                            style={{
                                                background: "none",
                                                border: "none",
                                                padding: 0,
                                                cursor: "pointer",
                                                textAlign: "left",
                                                fontFamily: "'Playfair Display',serif",
                                                fontSize: 17,
                                                fontWeight: 700,
                                                color: NAVY,
                                                lineHeight: 1.25,
                                                display: "block",
                                                maxWidth: "100%",
                                                overflow: "hidden",
                                                textOverflow: "ellipsis",
                                                whiteSpace: "nowrap",
                                            }}
                                        >
                                            {p.name}
                                        </button>

                                        <div
                                            style={{
                                                display: "inline-flex",
                                                alignItems: "center",
                                                gap: 5,
                                                margin: "4px 0 10px",
                                                fontSize: 10,
                                                fontWeight: 700,
                                                letterSpacing: ".1em",
                                                textTransform: "uppercase",
                                                color: GOLD,
                                            }}
                                        >
                                            {p.academic ? <GraduationCap size={11} /> : <Sparkles size={11} />}
                                            {p.academic ? "Academic Educator" : "Independent Creator"}
                                        </div>

                                        <div style={{ display: "flex", gap: 8 }}>
                                            <button className="fm-btn fm-btn-gold" onClick={() => goTo(p)}>
                                                View profile
                                            </button>
                                            {isOwner && (
                                                <button
                                                    className="fm-btn fm-btn-grey"
                                                    onClick={() => unfollow(p)}
                                                    disabled={busyId === p.uid}
                                                >
                                                    {busyId === p.uid ? "Removing…" : "Unfollow"}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}