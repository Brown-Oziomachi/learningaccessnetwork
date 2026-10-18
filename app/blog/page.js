// app/blog/page.js
import Link from "next/link";
import Navbar from "@/components/NavBar";
import BlogCover from "./BlogCover";
import BlogBrowser from "./BlogBrowser";
import { posts, CATEGORIES, SITE } from "./data/posts";
import "./blog.css";
import "./blog-extra.css";

export const metadata = {
    title: "LAN Library Blog | Study Smarter, Earn From Knowledge",
    description:
        "Study tips, exam guides, past question advice and ways to earn from your knowledge. Made for students, sellers and lecturers across Africa.",
    alternates: { canonical: `${SITE}/blog` },
    openGraph: {
        title: "LAN Library Blog",
        description: "Study tips, exam guides and ways to earn from your knowledge, for learners across Africa.",
        url: `${SITE}/blog`,
        type: "website",
    },
};

const fmtDate = (d) =>
    new Date(d).toLocaleDateString("en-GB", { year: "numeric", month: "long", day: "numeric" });

const START = [
    { icon: "📝", title: "Exams coming?", text: "Build a plan that beats cramming.", href: "/blog/pass-university-exams-without-last-minute-reading" },
    { icon: "🗂️", title: "Need past questions?", text: "Find real ones and use them well.", href: "/blog/find-university-past-questions-for-your-department" },
    { icon: "💰", title: "Want to earn?", text: "Turn your notes into a product.", href: "/blog/make-money-from-lecture-notes-nigeria" },
    { icon: "🎓", title: "A lecturer?", text: "Publish your course materials.", href: "/blog/lecturers-publish-and-monetize-course-materials-online" },
];

export default function BlogHome() {
    const featured = posts[0];

    return (
        <div className="lb-root">
            <Navbar />

            <header className="lb-hero">
                <div className="lb-wrap">
                    <p className="lb-eyebrow">LAN Library Blog &middot; Made for African learners</p>
                    <h1 className="lb-h1">
                        Study smarter. Share what you know. Grow <em>wherever you are.</em>
                    </h1>
                    <p className="lb-sub">
                        Exam tips, study guides and honest advice for students, sellers and lecturers from Lagos to Nairobi, Accra to Cape Town.
                    </p>
                    <div className="lb-pills">
                        <Link href="/documents" className="lb-pill">I am a student</Link>
                        <Link href="/seller/network" className="lb-pill lb-pill-gold">I want to sell</Link>
                        <Link href="/faculty/network" className="lb-pill">I am a lecturer</Link>
                    </div>
                    <ul className="lb-stats">
                        <li><b>{posts.length}</b> free guides</li>
                        <li><b>{CATEGORIES.length}</b> topic areas</li>
                        <li><b>Africa-wide</b> examples</li>
                    </ul>
                </div>
            </header>

            <main className="lb-wrap">
                {featured && (
                    <Link href={`/blog/${featured.slug}`} className="lb-feature">
                        <BlogCover category={featured.category} seed={featured.slug} />
                        <div className="lb-feat-body">
                            <span className="lb-badge">Start here</span>
                            <h2 className="lb-feat-title">{featured.title}</h2>
                            <p className="lb-feat-desc">{featured.description}</p>
                            <p className="lb-card-meta">{fmtDate(featured.date)} &middot; {featured.readTime}</p>
                            <span className="lb-card-more">Read the guide <span aria-hidden="true">&rarr;</span></span>
                        </div>
                    </Link>
                )}

                <section className="lb-quick" aria-label="Quick starts">
                    {START.map((s) => (
                        <Link key={s.href} href={s.href} className="lb-quick-card">
                            <span className="lb-quick-ico" aria-hidden="true">{s.icon}</span>
                            <span>
                                <strong>{s.title}</strong>
                                <small>{s.text}</small>
                            </span>
                        </Link>
                    ))}
                </section>

                <BlogBrowser posts={posts} categories={CATEGORIES} skipSlug={featured?.slug} />
            </main>

            <section className="lb-aud">
                <div className="lb-wrap">
                    <h2 className="lb-aud-title">Where do you want to start?</h2>
                    <p className="lb-aud-sub">One library, three ways to take part.</p>
                    <div className="lb-aud-grid">
                        <div className="lb-aud-card">
                            <p className="lb-aud-tag">For students</p>
                            <h3>Find study materials</h3>
                            <p>Browse notes, study guides and documents from sellers and lecturers across the library.</p>
                            <Link href="/documents">Browse documents</Link>
                        </div>
                        <div className="lb-aud-card">
                            <p className="lb-aud-tag">For sellers</p>
                            <h3>Share what you know</h3>
                            <p>Turn your original notes and guides into digital products on the LAN Library Seller Network.</p>
                            <Link href="/seller/network">Join the Seller Network</Link>
                        </div>
                        <div className="lb-aud-card">
                            <p className="lb-aud-tag">For lecturers</p>
                            <h3>Reach more learners</h3>
                            <p>Publish your course materials and build your academic profile through the Faculty Network.</p>
                            <Link href="/faculty/network">Explore the Faculty Network</Link>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}