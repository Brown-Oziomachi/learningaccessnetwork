// app/blog/[slug]/page.js
import Link from "next/link";
import { notFound } from "next/navigation";
import Navbar from "@/components/NavBar";
import BlogCover from "../BlogCover";
import { posts, getPost, getRelated, catMeta, SITE } from "../data/posts";
import "../blog.css";
import "../blog-extra.css";

const toId = (t) => t.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
const catId = (name) => "cat-" + toId(name);

export async function generateStaticParams() {
    return posts.map((p) => ({ slug: p.slug }));
}

// The share image (og:image) is created by opengraph-image.js in this same folder.
export async function generateMetadata({ params }) {
    const { slug } = await params;
    const post = getPost(slug);
    if (!post) return {};
    const url = `${SITE}/blog/${post.slug}`;
    return {
        title: `${post.title} | LAN Library`,
        description: post.description,
        alternates: { canonical: url },
        openGraph: {
            title: post.title,
            description: post.description,
            url,
            type: "article",
            publishedTime: post.date,
        },
        twitter: { card: "summary_large_image", title: post.title, description: post.description },
    };
}

const fmtDate = (d) =>
    new Date(d).toLocaleDateString("en-GB", { year: "numeric", month: "long", day: "numeric" });

// One call-to-action per audience. The cta href decides which audience the article is for.
function audienceOf(post) {
    const href = post.cta?.href || "";
    if (href.includes("faculty")) return "faculty";
    if (href.includes("documents")) return "student";
    return "seller";
}

const CTA_COPY = {
    student: {
        side: "Looking for study materials?",
        sideText: "Browse notes, study guides and practice material from sellers and lecturers.",
        end: "Put this into practice today",
        endText: "Find notes, guides and practice questions for your course in the LAN Library.",
        icon: "📚",
    },
    seller: {
        side: "Ready to share what you know?",
        sideText: "See the requirements and how uploads work on the Seller Network.",
        end: "Your notes could help another student",
        endText: "Turn your original notes and guides into a digital product on the Seller Network.",
        icon: "💡",
    },
    faculty: {
        side: "Ready to publish your course materials?",
        sideText: "See how the Faculty Network and its verification process work.",
        end: "Reach learners beyond your own classroom",
        endText: "Publish your course materials and build your academic profile on the Faculty Network.",
        icon: "🎓",
    },
};

function Block({ b }) {
    if (b.type === "intro") return <p className="lb-lead">{b.text}</p>;
    if (b.type === "heading")
        return (
            <h2 id={toId(b.text)} className="lb-h2">
                {b.text}
            </h2>
        );
    if (b.type === "paragraph") return <p className="lb-p">{b.text}</p>;
    if (b.type === "list")
        return (
            <ul className="lb-ul">
                {b.items.map((it, i) => (
                    <li key={i}>{it}</li>
                ))}
            </ul>
        );
    if (b.type === "steps")
        return (
            <ol className="lb-ol">
                {b.items.map((it, i) => (
                    <li key={i}>{it}</li>
                ))}
            </ol>
        );
    return null;
}

export default async function BlogPost({ params }) {
    const { slug } = await params;
    const post = getPost(slug);
    if (!post) notFound();

    const meta = catMeta(post.category);
    const aud = audienceOf(post);
    const copy = CTA_COPY[aud];
    const related = getRelated(post.slug, 3);
    const url = `${SITE}/blog/${post.slug}`;
    const headings = post.content.filter((b) => b.type === "heading");
    const enc = encodeURIComponent;

    // previous / next article inside the same category
    const sameCat = posts.filter((p) => p.category === post.category);
    const idx = sameCat.findIndex((p) => p.slug === post.slug);
    const prev = idx > 0 ? sameCat[idx - 1] : null;
    const next = idx < sameCat.length - 1 ? sameCat[idx + 1] : null;

    const jsonLd = [
        {
            "@context": "https://schema.org",
            "@type": "Article",
            headline: post.title,
            description: post.description,
            datePublished: post.date,
            mainEntityOfPage: url,
            author: { "@type": "Organization", name: "LAN Library" },
            publisher: { "@type": "Organization", name: "LAN Library" },
        },
        {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
                { "@type": "ListItem", position: 1, name: "Blog", item: `${SITE}/blog` },
                { "@type": "ListItem", position: 2, name: post.category, item: `${SITE}/blog#${catId(post.category)}` },
                { "@type": "ListItem", position: 3, name: post.title, item: url },
            ],
        },
    ];

    return (
        <div className="lb-root" style={{ "--acc": meta.accent }}>
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
            <div className="lb-progress" aria-hidden="true" />
            <Navbar />

            <header className="lb-art-hero">
                <div className="lb-wrap">
                    <p className="lb-crumbs">
                        <Link href="/blog">Blog</Link>
                        <span>/</span>
                        <Link href={`/blog#${catId(post.category)}`}>{post.category}</Link>
                    </p>
                    <Link href="/blog#articles" className="lb-chip lb-chip-acc">
                        {meta.icon} {post.category}
                    </Link>
                    <h1 className="lb-art-h1">{post.title}</h1>
                    <p className="lb-art-deck">{post.description}</p>
                    <div className="lb-art-meta">
                        <span className="lb-avatar" aria-hidden="true">L</span>
                        <span>By <strong>LAN Library Editorial</strong></span>
                        <span className="lb-dot" />
                        <span>{fmtDate(post.date)}</span>
                        <span className="lb-dot" />
                        <span>⏱ {post.readTime}</span>
                    </div>
                </div>
            </header>

            <div className="lb-art-grid">
                <article className="lb-article">
                    {headings.length > 2 && (
                        <nav className="lb-toc" aria-label="In this article">
                            <p className="lb-toc-title">In this article</p>
                            <ol>
                                {headings.map((h) => (
                                    <li key={h.text}>
                                        <a href={`#${toId(h.text)}`}>{h.text}</a>
                                    </li>
                                ))}
                            </ol>
                        </nav>
                    )}

                    {post.content.map((b, i) => (
                        <Block key={i} b={b} />
                    ))}

                    {post.cta && (
                        <aside className="lb-endcta">
                            <span className="lb-endcta-ico" aria-hidden="true">{copy.icon}</span>
                            <div>
                                <h3>{copy.end}</h3>
                                <p>{copy.endText}</p>
                            </div>
                            <Link href={post.cta.href}>{post.cta.label}</Link>
                        </aside>
                    )}

                    <div className="lb-sharebar">
                        <strong>Found this useful? Send it to a coursemate.</strong>
                        <div className="lb-share">
                            <a className="lb-wa" href={`https://wa.me/?text=${enc(post.title + " " + url)}`} target="_blank" rel="noopener noreferrer">WhatsApp</a>
                            <a href={`https://www.facebook.com/sharer/sharer.php?u=${enc(url)}`} target="_blank" rel="noopener noreferrer">Facebook</a>
                            <a href={`https://twitter.com/intent/tweet?text=${enc(post.title)}&url=${enc(url)}`} target="_blank" rel="noopener noreferrer">X</a>
                        </div>
                    </div>

                    {(prev || next) && (
                        <nav className="lb-pn" aria-label="More in this section">
                            {prev ? (
                                <Link href={`/blog/${prev.slug}`} className="lb-pn-prev">
                                    <small>&larr; Previous</small>
                                    <span>{prev.title}</span>
                                </Link>
                            ) : <span />}
                            {next ? (
                                <Link href={`/blog/${next.slug}`} className="lb-pn-next">
                                    <small>Next &rarr;</small>
                                    <span>{next.title}</span>
                                </Link>
                            ) : <span />}
                        </nav>
                    )}
                </article>

                <aside className="lb-side">
                    {post.cta && (
                        <div className="lb-side-card lb-side-cta">
                            <h3>{copy.side}</h3>
                            <p>{copy.sideText}</p>
                            <Link href={post.cta.href}>{post.cta.label}</Link>
                        </div>
                    )}
                    <div className="lb-side-card">
                        <p className="lb-side-title">Share this article</p>
                        <div className="lb-share">
                            <a className="lb-wa" href={`https://wa.me/?text=${enc(post.title + " " + url)}`} target="_blank" rel="noopener noreferrer">WhatsApp</a>
                            <a href={`https://www.facebook.com/sharer/sharer.php?u=${enc(url)}`} target="_blank" rel="noopener noreferrer">Facebook</a>
                            <a href={`https://twitter.com/intent/tweet?text=${enc(post.title)}&url=${enc(url)}`} target="_blank" rel="noopener noreferrer">X</a>
                        </div>
                    </div>
                </aside>
            </div>

            {related.length > 0 && (
                <section className="lb-related">
                    <h2 className="lb-related-title">Keep reading</h2>
                    <div className="lb-rgrid">
                        {related.map((p) => (
                            <Link key={p.slug} href={`/blog/${p.slug}`} className="lb-card">
                                <BlogCover category={p.category} seed={p.slug} />
                                <div className="lb-card-body">
                                    <p className="lb-card-meta">{p.readTime}</p>
                                    <h3 className="lb-card-title">{p.title}</h3>
                                    <span className="lb-card-more">
                                        Read article <span aria-hidden="true">&rarr;</span>
                                    </span>
                                </div>
                            </Link>
                        ))}
                    </div>
                </section>
            )}
        </div>
    );
}