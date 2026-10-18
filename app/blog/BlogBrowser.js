"use client";
// app/blog/BlogBrowser.js
// Search box + category chips + card grid. Runs in the browser so filtering is instant.
import { useMemo, useState } from "react";
import Link from "next/link";
import BlogCover from "./BlogCover";

const fmtDate = (d) =>
    new Date(d).toLocaleDateString("en-GB", { year: "numeric", month: "short", day: "numeric" });

export default function BlogBrowser({ posts, categories, skipSlug }) {
    const [q, setQ] = useState("");
    const [cat, setCat] = useState("All");

    const list = useMemo(() => {
        const term = q.trim().toLowerCase();
        return posts.filter((p) => {
            if (p.slug === skipSlug && cat === "All" && !term) return false;
            if (cat !== "All" && p.category !== cat) return false;
            if (!term) return true;
            return (p.title + " " + p.description).toLowerCase().includes(term);
        });
    }, [q, cat, posts, skipSlug]);

    return (
        <section className="lb-browser" id="articles">
            <div className="lb-search-row">
                <label className="lb-search">
                    <span className="lb-search-ico" aria-hidden="true">🔎</span>
                    <input
                        type="search"
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                        placeholder="Search exams, notes, past questions, e-books…"
                        aria-label="Search articles"
                    />
                </label>
            </div>

            <div className="lb-chips" role="tablist" aria-label="Filter by topic">
                <button className={`lb-chip-btn ${cat === "All" ? "on" : ""}`} onClick={() => setCat("All")}>
                    ✨ All topics <b>{posts.length}</b>
                </button>
                {categories.map((c) => (
                    <button
                        key={c.name}
                        className={`lb-chip-btn ${cat === c.name ? "on" : ""}`}
                        style={{ "--acc": c.accent }}
                        onClick={() => setCat(c.name)}
                    >
                        {c.icon} {c.name} <b>{posts.filter((p) => p.category === c.name).length}</b>
                    </button>
                ))}
            </div>

            {cat !== "All" && (
                <p className="lb-cat-blurb">{categories.find((c) => c.name === cat)?.blurb}</p>
            )}

            {list.length === 0 ? (
                <div className="lb-empty">
                    <p>No articles match “{q}”.</p>
                    <button className="lb-chip-btn on" onClick={() => { setQ(""); setCat("All"); }}>Clear search</button>
                </div>
            ) : (
                <div className="lb-grid">
                    {list.map((p) => (
                        <Link key={p.slug} href={`/blog/${p.slug}`} className="lb-card">
                            <BlogCover category={p.category} seed={p.slug} />
                            <div className="lb-card-body">
                                <p className="lb-card-meta">{fmtDate(p.date)} &middot; {p.readTime}</p>
                                <h3 className="lb-card-title">{p.title}</h3>
                                <p className="lb-card-desc">{p.description}</p>
                                <span className="lb-card-more">Read article <span aria-hidden="true">&rarr;</span></span>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </section>
    );
}