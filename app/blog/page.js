// app/blog/page.js
import Link from "next/link";
import Navbar from "@/components/NavBar";
import BlogCover from "./BlogCover";
import { posts, CATEGORIES, SITE } from "./data/posts";
import "./blog.css";

export const metadata = {
    title: "LAN Library Blog | Study Smarter, Earn From Knowledge",
    description:
        "Study tips, guides on selling academic materials, and resources for students, sellers and lecturers in Nigeria.",
    alternates: { canonical: `${SITE}/blog` },
    openGraph: {
        title: "LAN Library Blog",
        description:
            "Study tips, guides on selling academic materials, and resources for students, sellers and lecturers.",
        url: `${SITE}/blog`,
        type: "website",
    },
};

const fmtDate = (d) =>
    new Date(d).toLocaleDateString("en-NG", { year: "numeric", month: "long", day: "numeric" });

const catId = (name) =>
    "cat-" + name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

const AUDIENCES = [
    {
        tag: "For students",
        title: "Find study materials",
        text: "Browse notes, study guides and documents from sellers and lecturers across the library.",
        label: "Browse documents",
        href: "/documents",
    },
    {
        tag: "For sellers",
        title: "Share what you know",
        text: "Turn your original notes and guides into digital products on the LAN Library Seller Network.",
        label: "Join the Seller Network",
        href: "/seller/network",
    },
    {
        tag: "For lecturers",
        title: "Reach more learners",
        text: "Publish your course materials and build your academic profile through the Faculty Network.",
        label: "Explore the Faculty Network",
        href: "/faculty/network",
    },
];

function PostCard({ p }) {
    return (
        <Link href={`/blog/${p.slug}`} className="lb-card">
            <BlogCover category={p.category} seed={p.slug} />
            <div className="lb-card-body">
                <p className="lb-card-meta">
                    {fmtDate(p.date)} &middot; {p.readTime}
                </p>
                <h3 className="lb-card-title">{p.title}</h3>
                <p className="lb-card-desc">{p.description}</p>
                <span className="lb-card-more">
                    Read article <span aria-hidden="true">&rarr;</span>
                </span>
            </div>
        </Link>
    );
}

export default function BlogHome() {
    const featured = posts[0];
    const rest = posts.slice(1);
    const sections = CATEGORIES.map((c) => ({
        ...c,
        list: rest.filter((p) => p.category === c.name),
    })).filter((s) => s.list.length > 0);

    return (
        <div className="lb-root">
            <Navbar />

            <header className="lb-hero">
                <div className="lb-wrap">
                    <p className="lb-eyebrow">LAN Library Blog</p>
                    <h1 className="lb-h1">
                        Knowledge should create <em>opportunities.</em>
                    </h1>
                    <p className="lb-sub">
                        Learn how to study smarter, share what you know responsibly, and find resources for
                        your courses.
                    </p>
                    <div className="lb-pills">
                        <Link href="/documents" className="lb-pill">I am a student</Link>
                        <Link href="/seller/network" className="lb-pill lb-pill-gold">I want to sell</Link>
                        <Link href="/faculty/network" className="lb-pill">I am a lecturer</Link>
                    </div>
                </div>
            </header>

            <main className="lb-wrap">
                {featured && (
                    <Link href={`/blog/${featured.slug}`} className="lb-feature">
                        <BlogCover category={featured.category} seed={featured.slug} />
                        <div className="lb-feat-body">
                            <span className="lb-badge">Featured guide</span>
                            <h2 className="lb-feat-title">{featured.title}</h2>
                            <p className="lb-feat-desc">{featured.description}</p>
                            <p className="lb-card-meta">
                                {fmtDate(featured.date)} &middot; {featured.readTime}
                            </p>
                            <span className="lb-card-more">
                                Read the guide <span aria-hidden="true">&rarr;</span>
                            </span>
                        </div>
                    </Link>
                )}

                {sections.length > 1 && (
                    <nav className="lb-catnav" aria-label="Blog sections">
                        {sections.map((s) => (
                            <a key={s.name} href={`#${catId(s.name)}`}>{s.name}</a>
                        ))}
                    </nav>
                )}

                {sections.map((s) => (
                    <section key={s.name} id={catId(s.name)} className="lb-section">
                        <div className="lb-sec-head">
                            <h2 className="lb-sec-title">{s.name}</h2>
                            <p className="lb-sec-blurb">{s.blurb}</p>
                        </div>
                        <div className="lb-grid">
                            {s.list.map((p) => (
                                <PostCard key={p.slug} p={p} />
                            ))}
                        </div>
                    </section>
                ))}
            </main>

            <section className="lb-aud">
                <div className="lb-wrap">
                    <h2 className="lb-aud-title">Where do you want to start?</h2>
                    <p className="lb-aud-sub">One library, three ways to take part.</p>
                    <div className="lb-aud-grid">
                        {AUDIENCES.map((a) => (
                            <div key={a.tag} className="lb-aud-card">
                                <p className="lb-aud-tag">{a.tag}</p>
                                <h3>{a.title}</h3>
                                <p>{a.text}</p>
                                <Link href={a.href}>{a.label}</Link>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        </div>
    );
}