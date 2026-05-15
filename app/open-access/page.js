"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { collection, query, where, orderBy, limit, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebaseConfig";
import Navbar from "@/components/NavBar";
import Footer from "@/components/FooterComp";

const NAVY = "#0d2244";
const GOLD = "#b8963e";
const CREAM = "#f5f0e8";
const BG = "#f5f1ea";

const getThumbnailUrl = (book) => {
    if (book.driveFileId) return `https://drive.google.com/thumbnail?id=${book.driveFileId}&sz=w400`;
    if (book.embedUrl) {
        const m = book.embedUrl.match(/\/d\/(.*?)\/|\/file\/d\/(.*?)\/|id=(.*?)(&|$)/);
        if (m) { const id = m[1] || m[2] || m[3]; if (id) return `https://drive.google.com/thumbnail?id=${id}&sz=w400`; }
    }
    if (book.pdfUrl?.includes("drive.google.com")) {
        const m = book.pdfUrl.match(/[-\w]{25,}/);
        if (m) return `https://drive.google.com/thumbnail?id=${m[0]}&sz=w400`;
    }
    return book.image || "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400";
};

export default function OpenAccessPage() {
    const [books, setBooks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");

    useEffect(() => {
        (async () => {
            try {
                const q = query(
                    collection(db, "advertMyBook"),
                    where("isFree", "==", true),
                    where("status", "==", "approved"),
                    orderBy("createdAt", "desc"),
                    limit(60)
                );
                const snap = await getDocs(q);
                const arr = [];
                snap.forEach(d => {
                    const data = d.data();
                    if (!data.bookTitle) return;
                    const b = {
                        id: `firestore-${d.id}`, firestoreId: d.id,
                        title: data.bookTitle, author: data.author || "Unknown",
                        category: data.category || "General",
                        department: data.department || "",
                        docType: data.docType || "",
                        driveFileId: data.driveFileId, pdfUrl: data.pdfUrl, embedUrl: data.embedUrl,
                        image: data.coverImage || data.image || null,
                    };
                    b.image = getThumbnailUrl(b);
                    arr.push(b);
                });
                setBooks(arr);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const filtered = books.filter(b =>
        b.title.toLowerCase().includes(search.toLowerCase()) ||
        b.author.toLowerCase().includes(search.toLowerCase()) ||
        b.category.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,400&family=Lato:wght@300;400;700&display=swap');
                .oa-root { font-family:'Lato',sans-serif; background:${BG}; min-height:100vh; }
                .oa-serif { font-family:'Playfair Display',Georgia,serif; }
                .oa-card { background:#fff; border:0.5px solid #e5ddd0; text-decoration:none; display:block; transition:transform 0.22s,box-shadow 0.22s,border-color 0.22s; }
                .oa-card:hover { transform:translateY(-5px); box-shadow:0 16px 40px rgba(13,34,68,0.12); border-color:${GOLD}; }
                .oa-card:hover .oa-img { transform:scale(1.06); }
                .oa-img { transition:transform 0.5s cubic-bezier(.4,0,.2,1); }
                @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
                .skeleton { background:#e5e7eb; border-radius:4px; animation:pulse 1.5s ease-in-out infinite; }
            `}</style>

            <div className="oa-root">
                <Navbar />

                {/* ── Hero Banner ── */}
                <section style={{ background: NAVY, backgroundImage: "radial-gradient(rgba(184,150,62,0.07) 1px,transparent 1px)", backgroundSize: "28px 28px", padding: "64px 24px 56px" }}>
                    <div style={{ maxWidth: 900, margin: "0 auto" }}>
                        {/* eyebrow */}
                        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(22,163,74,0.15)", border: "1px solid rgba(22,163,74,0.35)", borderRadius: 999, padding: "6px 16px", marginBottom: 20 }}>
                            <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#22c55e", display: "inline-block" }} />
                            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".14em", textTransform: "uppercase", color: "#4ade80", fontFamily: "'Lato',sans-serif" }}>Open Access Collection</span>
                        </div>

                        <h1 className="oa-serif" style={{ fontSize: "clamp(36px,6vw,64px)", fontWeight: 900, color: "#fff", lineHeight: 1.05, margin: "0 0 16px", letterSpacing: "-1px" }}>
                            Free for every<br />
                            <span style={{ color: GOLD, fontStyle: "italic" }}>student, always.</span>
                        </h1>
                        <p style={{ fontSize: 16, color: "rgba(245,240,232,0.65)", maxWidth: 540, lineHeight: 1.8, fontWeight: 300, margin: "0 0 36px", fontFamily: "'Lato',sans-serif" }}>
                            A curated collection of documents published freely by lecturers, researchers, and
                            students across Africa. No wallet balance needed — just read.
                        </p>

                        {/* Search */}
                        <div style={{ position: "relative", maxWidth: 480 }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="2" style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)" }}>
                                <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
                            </svg>
                            <input
                                type="text"
                                placeholder="Search by title, author, or category…"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                style={{ width: "100%", padding: "13px 16px 13px 44px", background: "rgba(255,255,255,0.08)", border: "0.5px solid rgba(255,255,255,0.15)", borderRadius: 8, fontSize: 14, color: "#fff", fontFamily: "'Lato',sans-serif", outline: "none", boxSizing: "border-box" }}
                            />
                        </div>

                        {/* Stats */}
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 32, marginTop: 40, borderTop: "0.5px solid rgba(184,150,62,0.2)", paddingTop: 28 }}>
                            {[
                                { val: books.length || "…", label: "Free Documents" },
                                { val: "0₦", label: "Cost to Access" },
                                { val: "Always", label: "Available" },
                            ].map(({ val, label }) => (
                                <div key={label}>
                                    <div className="oa-serif" style={{ fontSize: 28, fontWeight: 700, color: "#fff" }}>{val}</div>
                                    <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", color: "rgba(184,150,62,0.7)", marginTop: 3, fontFamily: "'Lato',sans-serif" }}>{label}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ── Grid ── */}
                <section style={{ maxWidth: 1200, margin: "0 auto", padding: "56px 24px" }}>

                    {loading ? (
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(160px,1fr))", gap: 20 }}>
                            {Array.from({ length: 12 }).map((_, i) => (
                                <div key={i}>
                                    <div className="skeleton" style={{ width: "100%", aspectRatio: "3/4", marginBottom: 10 }} />
                                    <div className="skeleton" style={{ height: 14, width: "80%", marginBottom: 6 }} />
                                    <div className="skeleton" style={{ height: 11, width: "55%" }} />
                                </div>
                            ))}
                        </div>
                    ) : filtered.length === 0 ? (
                        <div style={{ textAlign: "center", padding: "80px 24px" }}>
                            <div className="oa-serif" style={{ fontSize: 22, color: NAVY, marginBottom: 8 }}>No documents found</div>
                            <p style={{ fontSize: 14, color: "#aaa" }}>Try a different search term, or check back soon.</p>
                        </div>
                    ) : (
                        <>
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28, flexWrap: "wrap", gap: 12 }}>
                                <div>
                                    <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".22em", textTransform: "uppercase", color: GOLD, marginBottom: 4, fontFamily: "'Lato',sans-serif" }}>
                                        Free to Read
                                    </p>
                                    <h2 className="oa-serif" style={{ fontSize: "clamp(22px,3vw,32px)", fontWeight: 700, color: NAVY, margin: 0 }}>
                                        {search ? `Results for "${search}"` : "All Open Access Documents"}
                                    </h2>
                                </div>
                                <span style={{ fontSize: 13, color: "#aaa", fontFamily: "'Lato',sans-serif" }}>
                                    {filtered.length} document{filtered.length !== 1 ? "s" : ""}
                                </span>
                            </div>

                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(160px,1fr))", gap: 20 }}>
                                {filtered.map(book => (
                                    <Link
                                        key={book.id}
                                        href={`/book/preview?id=${book.firestoreId}`}
                                        className="oa-card"
                                    >
                                        {/* Thumbnail */}
                                        <div style={{ position: "relative", background: "#ede8df", overflow: "hidden" }}>
                                            <img
                                                src={book.image}
                                                alt={book.title}
                                                className="oa-img"
                                                style={{ width: "100%", aspectRatio: "3/4", objectFit: "cover", display: "block" }}
                                                onError={e => { e.target.src = "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400"; }}
                                            />

                                            {/* PDF badge */}
                                            <div style={{ position: "absolute", top: 8, left: 8, display: "inline-flex", alignItems: "center", gap: 4, background: NAVY, padding: "3px 8px", fontSize: 9, fontWeight: 700, color: "#fff", fontFamily: "'Lato',sans-serif" }}>
                                                <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#22c55e", display: "inline-block" }} />PDF
                                            </div>

                                            {/* ── OPEN ACCESS BADGE ── */}
                                            <div style={{
                                                position: "absolute", top: 8, right: 8,
                                                background: "#16a34a", color: "#fff",
                                                fontSize: 9, fontWeight: 700, padding: "3px 8px",
                                                fontFamily: "'Lato',sans-serif", letterSpacing: ".06em",
                                                display: "flex", alignItems: "center", gap: 4,
                                            }}>
                                                🔓 FREE
                                            </div>
                                        </div>

                                        {/* Info */}
                                        <div style={{ padding: "10px 10px 14px", borderTop: "0.5px solid #f0ebe0" }}>
                                            <h4 className="oa-serif" style={{ fontSize: 13, fontWeight: 700, color: NAVY, margin: "0 0 3px", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", lineHeight: 1.35 }}>
                                                {book.title}
                                            </h4>
                                            <p style={{ fontSize: 11, color: "#888", margin: "0 0 8px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontFamily: "'Lato',sans-serif" }}>
                                                {book.author}
                                            </p>

                                            {/* Category chip */}
                                            {book.category && (
                                                <span style={{ display: "inline-block", background: CREAM, border: `0.5px solid rgba(184,150,62,0.3)`, color: GOLD, fontSize: 8, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", padding: "3px 7px", fontFamily: "'Lato',sans-serif", maxWidth: "100%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                                    {book.category}
                                                </span>
                                            )}

                                            {/* Open Access label at bottom */}
                                            <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 5 }}>
                                                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#16a34a", display: "inline-block", flexShrink: 0 }} />
                                                <span style={{ fontSize: 10, fontWeight: 700, color: "#16a34a", fontFamily: "'Lato',sans-serif", letterSpacing: ".06em" }}>Open Access</span>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </>
                    )}
                </section>

                <Footer />
            </div>
        </>
    );
}