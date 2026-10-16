import Link from "next/link";
import Navbar from "@/components/NavBar";
import { posts, CATEGORIES, SITE } from "./data/posts";

const NAVY = "#0d2244";
const GOLD = "#b8963e";

export const metadata = {
    title: "LAN Library Blog | Study Smarter, Earn From Knowledge",
    description: "Study tips, guides on selling academic materials, and resources for students, sellers and lecturers in Nigeria.",
    alternates: { canonical: `${SITE}/blog` },
    openGraph: {
        title: "LAN Library Blog",
        description: "Study tips, guides on selling academic materials, and resources for students, sellers and lecturers.",
        url: `${SITE}/blog`,
        type: "website",
    },
};

const fmtDate = (d) =>
    new Date(d).toLocaleDateString("en-NG", { year: "numeric", month: "long", day: "numeric" });

export default function BlogHome() {
    return (
        <div style={{ background: "#f5f1ea", minHeight: "100vh", fontFamily: "'Lato', sans-serif" }}>
            <Navbar />
            <main style={{ maxWidth: 1000, margin: "0 auto", padding: "40px 20px 64px" }}>
                <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: GOLD, margin: "0 0 6px" }}>
                    LAN Library Blog
                </p>
                <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(28px,5vw,42px)", color: NAVY, margin: "0 0 8px" }}>
                    Knowledge should create opportunities.
                </h1>
                <p style={{ fontSize: 15, color: "#666", maxWidth: 560, lineHeight: 1.7, margin: "0 0 36px" }}>
                    Learn how to study smarter, share what you know responsibly, and find resources for your courses.
                </p>

                {CATEGORIES.map((cat) => {
                    const list = posts.filter((p) => p.category === cat.name);
                    if (list.length === 0) return null;
                    return (
                        <section key={cat.name} style={{ marginBottom: 40 }}>
                            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, color: NAVY, margin: "0 0 4px" }}>{cat.name}</h2>
                            <p style={{ fontSize: 13, color: "#888", margin: "0 0 14px" }}>{cat.blurb}</p>
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(290px, 1fr))", gap: 16 }}>
                                {list.map((p) => (
                                    <Link
                                        key={p.slug}
                                        href={`/blog/${p.slug}`}
                                        style={{ display: "block", background: "#fff", border: "0.5px solid #e5ddd0", textDecoration: "none", overflow: "hidden" }}
                                    >
                                        <img
                                            src={p.image}
                                            alt={p.imageAlt}
                                            width={1200}
                                            height={630}
                                            loading="lazy"
                                            style={{ width: "100%", height: "auto", display: "block" }}
                                        />
                                        <div style={{ padding: 18 }}>
                                            <p style={{ fontSize: 10, color: GOLD, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", margin: "0 0 8px" }}>
                                                {fmtDate(p.date)} &middot; {p.readTime}
                                            </p>
                                            <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, color: NAVY, lineHeight: 1.3, margin: "0 0 8px" }}>
                                                {p.title}
                                            </h3>
                                            <p style={{ fontSize: 13, color: "#777", lineHeight: 1.6, margin: 0 }}>{p.description}</p>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </section>
                    );
                })}
            </main>
        </div>
    );
}
