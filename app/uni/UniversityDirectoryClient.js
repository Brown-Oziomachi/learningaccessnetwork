"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import Link from "next/link";
import Navbar from "@/components/NavBar";

const NAVY = "#0d2244";
const GOLD = "#b8963e";
const GOLDD = "#d4aa5a";
const BG = "#f5f1ea";

function highlight(text, query) {
    if (!query || !text) return text;
    const idx = text.toLowerCase().indexOf(query.toLowerCase());
    if (idx === -1) return text;
    return (
        <>
            {text.slice(0, idx)}
            <mark style={{ background: "rgba(184,150,62,0.28)", color: "inherit", borderRadius: 2, padding: "0 1px" }}>
                {text.slice(idx, idx + query.length)}
            </mark>
            {text.slice(idx + query.length)}
        </>
    );
}

// Which tab is active
const TABS = ["Universities", "Lecturers"];

export default function UniversityDirectoryClient({
    allUniversities,
    totalCount,
    countryCount,
    lecturers = [],
}) {
    const [query, setQuery] = useState("");
    const [activeCountry, setActiveCountry] = useState("All");
    const [activeTab, setActiveTab] = useState("Universities");
    const inputRef = useRef(null);

    // "/" shortcut
    useEffect(() => {
        const handler = (e) => {
            if (e.key === "/" && document.activeElement !== inputRef.current) {
                e.preventDefault();
                inputRef.current?.focus();
            }
            if (e.key === "Escape") { setQuery(""); inputRef.current?.blur(); }
        };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, []);

    const countries = useMemo(() => {
        const set = [...new Set(allUniversities.map(u => u.country))].sort();
        return ["All", ...set];
    }, [allUniversities]);

    // ── Filtered universities ──────────────────────────────────
    const filteredUnis = useMemo(() => {
        const q = query.trim().toLowerCase();
        return allUniversities.filter(u => {
            const matchesCountry = activeCountry === "All" || u.country === activeCountry;
            if (!matchesCountry) return false;
            if (!q) return true;
            return (
                u.name.toLowerCase().includes(q) ||
                u.short?.toLowerCase().includes(q) ||
                u.country.toLowerCase().includes(q) ||
                u.state?.toLowerCase().includes(q) ||
                u.type?.toLowerCase().includes(q)
            );
        });
    }, [query, activeCountry, allUniversities]);

    // ── Filtered lecturers ─────────────────────────────────────
    const filteredLecturers = useMemo(() => {
        const q = query.trim().toLowerCase();
        return lecturers.filter(l => {
            // Country filter — match via university name lookup
            if (activeCountry !== "All") {
                const uni = allUniversities.find(u => u.name === l.university);
                if (!uni || uni.country !== activeCountry) return false;
            }
            if (!q) return true;
            return (
                l.name.toLowerCase().includes(q) ||
                l.title.toLowerCase().includes(q) ||
                l.university.toLowerCase().includes(q) ||
                l.department.toLowerCase().includes(q)
            );
        });
    }, [query, activeCountry, lecturers, allUniversities]);

    // ── Grouped universities by country ───────────────────────
    const groupedUnis = useMemo(() => {
        const map = {};
        filteredUnis.forEach(u => {
            if (!map[u.country]) map[u.country] = [];
            map[u.country].push(u);
        });
        return Object.entries(map).sort(([a], [b]) => {
            if (a === "Nigeria") return -1;
            if (b === "Nigeria") return 1;
            return a.localeCompare(b);
        });
    }, [filteredUnis]);

    // ── Grouped lecturers by university ───────────────────────
    const groupedLecturers = useMemo(() => {
        const map = {};
        filteredLecturers.forEach(l => {
            if (!map[l.university]) map[l.university] = [];
            map[l.university].push(l);
        });
        return Object.entries(map).sort(([a], [b]) => a.localeCompare(b));
    }, [filteredLecturers]);

    const isFiltering = query.trim().length > 0 || activeCountry !== "All";
    const resultCount = activeTab === "Universities" ? filteredUnis.length : filteredLecturers.length;

    // When user types and results exist in the other tab, auto-switch
    useEffect(() => {
        if (!query.trim()) return;
        if (activeTab === "Universities" && filteredUnis.length === 0 && filteredLecturers.length > 0) {
            setActiveTab("Lecturers");
        } else if (activeTab === "Lecturers" && filteredLecturers.length === 0 && filteredUnis.length > 0) {
            setActiveTab("Universities");
        }
    }, [query, filteredUnis.length, filteredLecturers.length]);

    return (
        <>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400&family=Lato:wght@300;400;700&display=swap');
                *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
                body { background: ${BG}; }

                .udir-hero {
                    background-color: ${NAVY};
                    background-image: radial-gradient(rgba(184,150,62,0.06) 1px, transparent 1px);
                    background-size: 26px 26px;
                    padding: 56px 24px 0;
                    position: relative; overflow: hidden;
                }
                .search-wrap {
                    position: relative;
                    max-width: 680px;
                    margin: 32px auto 0;
                }
                .search-input {
                    width: 100%;
                    padding: 16px 52px 16px 52px;
                    font-size: 15px;
                    font-family: 'Lato', sans-serif;
                    border: 1.5px solid rgba(184,150,62,0.35);
                    background: rgba(255,255,255,0.06);
                    color: #fff;
                    outline: none;
                    transition: border-color 0.2s, background 0.2s;
                    letter-spacing: 0.01em;
                    border-radius: 0;
                }
                .search-input::placeholder { color: rgba(255,255,255,0.35); }
                .search-input:focus { border-color: ${GOLD}; background: rgba(255,255,255,0.1); }
                .search-icon { position: absolute; left: 17px; top: 50%; transform: translateY(-50%); opacity: 0.45; pointer-events: none; }
                .search-kbd { position: absolute; right: 14px; top: 50%; transform: translateY(-50%); font-size: 10px; color: rgba(255,255,255,0.3); border: 1px solid rgba(255,255,255,0.15); padding: 2px 6px; font-family: monospace; pointer-events: none; }
                .search-clear { position: absolute; right: 14px; top: 50%; transform: translateY(-50%); background: none; border: none; cursor: pointer; color: rgba(255,255,255,0.5); font-size: 20px; line-height: 1; padding: 4px; transition: color 0.15s; }
                .search-clear:hover { color: #fff; }

                /* Tabs */
                .tab-bar {
                    max-width: 1100px; margin: 28px auto 0;
                    display: flex; gap: 0; border-bottom: 1px solid rgba(184,150,62,0.2);
                    padding: 0 24px;
                }
                .tab-btn {
                    padding: 10px 20px;
                    font-size: 11px; font-weight: 700; letter-spacing: 0.12em;
                    text-transform: uppercase; font-family: 'Lato', sans-serif;
                    background: none; border: none; cursor: pointer;
                    color: rgba(255,255,255,0.4); border-bottom: 2px solid transparent;
                    margin-bottom: -1px; transition: all 0.18s;
                }
                .tab-btn:hover { color: rgba(255,255,255,0.75); }
                .tab-btn.active { color: ${GOLD}; border-bottom-color: ${GOLD}; }
                .tab-count {
                    display: inline-flex; align-items: center; justify-content: center;
                    min-width: 18px; height: 16px; border-radius: 8px;
                    font-size: 9px; font-weight: 700; padding: 0 5px;
                    margin-left: 6px;
                    background: rgba(255,255,255,0.08); color: rgba(255,255,255,0.4);
                }
                .tab-btn.active .tab-count { background: rgba(184,150,62,0.2); color: ${GOLD}; }

                /* Country pills */
                .country-tabs { display: flex; gap: 8px; flex-wrap: wrap; max-width: 1100px; margin: 0 auto; padding: 18px 24px 0; }
                .ctab { font-size: 10px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; font-family: 'Lato', sans-serif; padding: 5px 13px; border: 0.5px solid rgba(184,150,62,0.25); background: rgba(255,255,255,0.04); color: rgba(255,255,255,0.5); cursor: pointer; transition: all 0.15s; white-space: nowrap; border-radius: 0; }
                .ctab:hover { border-color: ${GOLD}; color: rgba(255,255,255,0.85); }
                .ctab.active { background: ${GOLD}; border-color: ${GOLD}; color: ${NAVY}; }

                .hero-bottom { height: 28px; background: ${BG}; margin-top: 20px; clip-path: ellipse(56% 100% at 50% 100%); }

                /* University cards */
                .udir-card { background: #fff; border: 0.5px solid #e5ddd0; padding: 22px 20px; display: flex; flex-direction: column; gap: 10px; text-decoration: none; color: ${NAVY}; transition: transform 0.2s, box-shadow 0.2s, border-color 0.2s; }
                .udir-card:hover { transform: translateY(-4px); box-shadow: 0 14px 36px rgba(13,34,68,0.12); border-color: ${GOLD}; }

                /* Lecturer cards */
                .lect-card { display: flex; align-items: center; gap: 14px; background: #fff; border: 0.5px solid #e5ddd0; padding: 16px 18px; text-decoration: none; color: ${NAVY}; transition: border-color 0.18s, box-shadow 0.18s; }
                .lect-card:hover { border-color: ${GOLD}; box-shadow: 0 4px 16px rgba(13,34,68,0.08); }
                .lect-avatar { width: 40px; height: 40px; border-radius: 50%; border: 1.5px solid ${GOLD}; display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: 700; font-family: 'Playfair Display', serif; flex-shrink: 0; }

                .country-section { margin-bottom: 52px; }
                .country-heading { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; padding-bottom: 10px; border-bottom: 0.5px solid #e5ddd0; }

                .empty-state { text-align: center; padding: 80px 24px; font-family: 'Lato', sans-serif; }

                @media (max-width: 600px) {
                    .search-kbd { display: none; }
                    .country-tabs { gap: 6px; }
                    .ctab { font-size: 9px; padding: 4px 10px; }
                    .tab-btn { padding: 10px 14px; font-size: 10px; }
                }
            `}</style>

            {/* ── Hero ── */}
<Navbar  />
            <div className="udir-hero">
                <div style={{ position: "absolute", top: -60, right: -60, width: 240, height: 240, border: "0.5px solid rgba(184,150,62,0.1)", transform: "rotate(45deg)" }} />
                <div style={{ maxWidth: 1100, margin: "0 auto", position: "relative", zIndex: 1 }}>
                    <div style={{ display: "inline-flex", alignItems: "center", gap: 7, background: "rgba(184,150,62,0.14)", border: "1px solid rgba(184,150,62,0.3)", padding: "4px 14px", marginBottom: 16 }}>
                        <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: GOLDD, fontFamily: "'Lato',sans-serif" }}>University Hubs</span>
                    </div>
                    <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: "clamp(26px,5vw,50px)", fontWeight: 700, color: "#fff", margin: "0 0 10px", lineHeight: 1.08 }}>
                        Browse by <span style={{ color: GOLD, fontStyle: "italic" }}>University</span>
                    </h1>
                    <p style={{ fontSize: 14, color: "rgba(255,255,255,0.5)", maxWidth: 500, lineHeight: 1.75, fontWeight: 300, fontFamily: "'Lato',sans-serif" }}>
                        Textbooks, past questions, and lecture notes — curated by students and lecturers across Africa.
                    </p>

                    {/* Stats */}
                    <div style={{ display: "flex", gap: 32, marginTop: 20 }}>
                        {[
                            { val: totalCount + "+", label: "Universities" },
                            { val: countryCount + "", label: "Countries" },
                            { val: lecturers.length + "", label: "Lecturers" },
                            { val: isFiltering ? resultCount + "" : "—", label: "Results" },
                        ].map(({ val, label }) => (
                            <div key={label}>
                                <div style={{ fontSize: 24, fontWeight: 700, color: GOLD, fontFamily: "'Playfair Display',serif", lineHeight: 1 }}>{val}</div>
                                <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", fontFamily: "'Lato',sans-serif", marginTop: 3, letterSpacing: "0.08em", textTransform: "uppercase" }}>{label}</div>
                            </div>
                        ))}
                    </div>

                    {/* Search */}
                    <div className="search-wrap">
                        <svg className="search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={GOLD} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                        </svg>
                        <input
                            ref={inputRef}
                            className="search-input"
                            type="text"
                            value={query}
                            onChange={e => setQuery(e.target.value)}
                            placeholder="Search university, country, lecturer name, department…"
                            autoComplete="off"
                            spellCheck={false}
                        />
                        {query ? (
                            <button className="search-clear" onClick={() => setQuery("")} aria-label="Clear">×</button>
                        ) : (
                            <span className="search-kbd">/</span>
                        )}
                    </div>
                </div>

                {/* Tabs */}
                <div className="tab-bar">
                    {TABS.map(tab => (
                        <button
                            key={tab}
                            className={`tab-btn${activeTab === tab ? " active" : ""}`}
                            onClick={() => setActiveTab(tab)}
                        >
                            {tab}
                            <span className="tab-count">
                                {tab === "Universities" ? filteredUnis.length : filteredLecturers.length}
                            </span>
                        </button>
                    ))}
                </div>

                {/* Country filter */}
                <div className="country-tabs">
                    {countries.map(c => (
                        <button
                            key={c}
                            className={`ctab${activeCountry === c ? " active" : ""}`}
                            onClick={() => setActiveCountry(c)}
                        >
                            {c}
                        </button>
                    ))}
                </div>

                <div className="hero-bottom" />
            </div>

            {/* ── Content ── */}
            <div style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 24px 80px" }}>

                {/* Result summary */}
                {isFiltering && (
                    <p style={{ fontSize: 12, fontFamily: "'Lato',sans-serif", color: "#999", marginBottom: 28, letterSpacing: "0.04em" }}>
                        {resultCount === 0
                            ? `No ${activeTab.toLowerCase()} found.`
                            : `${resultCount} ${activeTab === "Universities"
                                ? resultCount === 1 ? "university" : "universities"
                                : resultCount === 1 ? "lecturer" : "lecturers"} found${query ? ` for "${query}"` : ""}${activeCountry !== "All" ? ` in ${activeCountry}` : ""}`}
                    </p>
                )}

                {/* ── Universities tab ── */}
                {activeTab === "Universities" && (
                    groupedUnis.length === 0 ? (
                        <div className="empty-state">
                            <div style={{ fontSize: 36, marginBottom: 12 }}>🔍</div>
                            <p style={{ fontSize: 16, fontWeight: 700, color: NAVY, fontFamily: "'Playfair Display',serif", marginBottom: 8 }}>No universities found</p>
                            <p style={{ fontSize: 13, color: "#aaa", marginBottom: 20 }}>Try a different name, abbreviation, or country.</p>
                            <button onClick={() => { setQuery(""); setActiveCountry("All"); }}
                                style={{ padding: "8px 20px", background: NAVY, color: "#fff", border: "none", cursor: "pointer", fontSize: 12, fontFamily: "'Lato',sans-serif", letterSpacing: "0.08em", textTransform: "uppercase", fontWeight: 700 }}>
                                Clear Filters
                            </button>
                        </div>
                    ) : groupedUnis.map(([country, unis]) => (
                        <div key={country} className="country-section">
                            <div className="country-heading">
                                <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: 20, fontWeight: 700, color: NAVY }}>{country}</h2>
                                <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: GOLD, fontFamily: "'Lato',sans-serif", background: "rgba(184,150,62,0.1)", border: "0.5px solid rgba(184,150,62,0.25)", padding: "2px 8px" }}>
                                    {unis.length} {unis.length === 1 ? "institution" : "institutions"}
                                </span>
                            </div>
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(240px,1fr))", gap: 14 }}>
                                {unis.map(uni => (
                                    <Link key={uni.slug} href={`/uni/${uni.slug}`} className="udir-card">
                                        <div style={{ display: "inline-flex", alignItems: "center", background: "rgba(184,150,62,0.1)", border: "0.5px solid rgba(184,150,62,0.25)", padding: "2px 9px", width: "fit-content" }}>
                                            <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: GOLD, fontFamily: "'Lato',sans-serif" }}>{uni.type}</span>
                                        </div>
                                        <div>
                                            <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: 16, fontWeight: 700, color: NAVY, margin: "0 0 2px", lineHeight: 1.3 }}>
                                                {highlight(uni.name, query)}
                                            </h3>
                                            <p style={{ fontSize: 11, color: "#bbb", fontFamily: "'Lato',sans-serif", margin: 0 }}>
                                                {highlight(uni.state, query)}
                                            </p>
                                        </div>
                                        <div style={{ borderTop: "0.5px solid #f0ebe0", paddingTop: 10, marginTop: 2, display: "flex", gap: 20 }}>
                                            <div>
                                                <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#ccc", fontFamily: "'Lato',sans-serif", marginBottom: 2 }}>Founded</div>
                                                <div style={{ fontSize: 12, fontWeight: 700, color: NAVY, fontFamily: "'Lato',sans-serif" }}>{uni.founded}</div>
                                            </div>
                                            {uni.short && (
                                                <div>
                                                    <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#ccc", fontFamily: "'Lato',sans-serif", marginBottom: 2 }}>Abbrev.</div>
                                                    <div style={{ fontSize: 12, fontWeight: 700, color: NAVY, fontFamily: "'Lato',sans-serif" }}>{highlight(uni.short, query)}</div>
                                                </div>
                                            )}
                                        </div>
                                        <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 700, color: GOLD, fontFamily: "'Lato',sans-serif", letterSpacing: "0.04em" }}>
                                            Browse Materials <span style={{ fontSize: 13 }}>→</span>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    ))
                )}

                {/* ── Lecturers tab ── */}
                {activeTab === "Lecturers" && (
                    groupedLecturers.length === 0 ? (
                        <div className="empty-state">
                            <div style={{ fontSize: 36, marginBottom: 12 }}>👨‍🏫</div>
                            <p style={{ fontSize: 16, fontWeight: 700, color: NAVY, fontFamily: "'Playfair Display',serif", marginBottom: 8 }}>No lecturers found</p>
                            <p style={{ fontSize: 13, color: "#aaa", marginBottom: 20 }}>Try searching by name, university, or department.</p>
                            <button onClick={() => { setQuery(""); setActiveCountry("All"); }}
                                style={{ padding: "8px 20px", background: NAVY, color: "#fff", border: "none", cursor: "pointer", fontSize: 12, fontFamily: "'Lato',sans-serif", letterSpacing: "0.08em", textTransform: "uppercase", fontWeight: 700 }}>
                                Clear Filters
                            </button>
                        </div>
                    ) : groupedLecturers.map(([uniName, lects]) => {
                        // Find the slug for this university to link to its hub
                        const uniEntry = allUniversities.find(u => u.name === uniName);
                        return (
                            <div key={uniName} className="country-section">
                                <div className="country-heading">
                                    <div>
                                        <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: 18, fontWeight: 700, color: NAVY, marginBottom: 2 }}>
                                            {highlight(uniName, query)}
                                        </h2>
                                        {uniEntry && (
                                            <Link href={`/uni/${uniEntry.slug}`} style={{ fontSize: 10, color: GOLD, fontFamily: "'Lato',sans-serif", fontWeight: 700, textDecoration: "none", letterSpacing: "0.06em" }}>
                                                View Hub →
                                            </Link>
                                        )}
                                    </div>
                                    <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: GOLD, fontFamily: "'Lato',sans-serif", background: "rgba(184,150,62,0.1)", border: "0.5px solid rgba(184,150,62,0.25)", padding: "2px 8px", marginLeft: "auto" }}>
                                        {lects.length} {lects.length === 1 ? "lecturer" : "lecturers"}
                                    </span>
                                </div>
                                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 10 }}>
                                    {lects.map(l => {
                                        const initials = (l.name || "?").trim().split(" ").filter(Boolean).map(p => p[0]).slice(0, 2).join("").toUpperCase();
                                        const bgColors = ["#0d2244", "#1a3a5c", "#2c1810", "#1a2c1a"];
                                        const bg = bgColors[(l.name || "").charCodeAt(0) % bgColors.length];
                                        return (
                                            <Link key={l.id} href={`/seller-profile?sellerId=${l.id}`} className="lect-card">
                                                <div className="lect-avatar" style={{ background: bg, color: GOLD }}>
                                                    {initials}
                                                </div>
                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                    <p style={{ fontFamily: "'Playfair Display',serif", fontSize: 14, fontWeight: 700, color: NAVY, margin: "0 0 2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                                        {highlight(`${l.title} ${l.name}`.trim(), query)}
                                                    </p>
                                                    {l.department && (
                                                        <p style={{ fontSize: 10, color: "#aaa", fontFamily: "'Lato',sans-serif", margin: "0 0 2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                                            {highlight(l.department, query)}
                                                        </p>
                                                    )}
                                                    <p style={{ fontSize: 10, color: GOLD, fontFamily: "'Lato',sans-serif", margin: 0, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                                        {highlight(uniName, query)}
                                                    </p>
                                                </div>
                                                <span style={{ fontSize: 13, color: "#ccc", flexShrink: 0 }}>→</span>
                                            </Link>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </>
    );
}