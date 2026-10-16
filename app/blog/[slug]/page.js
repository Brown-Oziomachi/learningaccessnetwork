import Link from "next/link";
import { notFound } from "next/navigation";
import Navbar from "@/components/NavBar";
import { posts, getPost, getRelated, SITE } from "../data/posts";

const NAVY = "#0d2244";
const GOLD = "#b8963e";
const CREAM = "#f5f0e8";

export async function generateStaticParams() {
  return posts.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) return {};
  const url = `${SITE}/blog/${post.slug}`;
  const image = `${SITE}${post.image}`;
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
      images: [{ url: image, width: 1200, height: 630, alt: post.imageAlt }],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.description,
      images: [image],
    },
  };
}

const fmtDate = (d) =>
  new Date(d).toLocaleDateString("en-NG", { year: "numeric", month: "long", day: "numeric" });

function Block({ b }) {
  if (b.type === "intro")
    return <p style={{ fontSize: 18, lineHeight: 1.8, color: "#444", margin: "0 0 28px" }}>{b.text}</p>;
  if (b.type === "heading")
    return <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 24, color: NAVY, margin: "32px 0 10px" }}>{b.text}</h2>;
  if (b.type === "paragraph")
    return <p style={{ fontSize: 16, lineHeight: 1.85, color: "#444", margin: "0 0 16px" }}>{b.text}</p>;
  if (b.type === "list")
    return (
      <ul style={{ margin: "0 0 16px", paddingLeft: 22, color: "#444", lineHeight: 1.85, fontSize: 16 }}>
        {b.items.map((it, i) => <li key={i}>{it}</li>)}
      </ul>
    );
  if (b.type === "steps")
    return (
      <ol style={{ margin: "0 0 16px", paddingLeft: 22, color: "#444", lineHeight: 1.85, fontSize: 16 }}>
        {b.items.map((it, i) => <li key={i} style={{ marginBottom: 6 }}>{it}</li>)}
      </ol>
    );
  return null;
}

export default async function BlogPost({ params }) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) notFound();

  const related = getRelated(post.slug, 3);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.description,
    image: `${SITE}${post.image}`,
    datePublished: post.date,
    mainEntityOfPage: `${SITE}/blog/${post.slug}`,
    publisher: { "@type": "Organization", name: "LAN Library" },
  };

  return (
    <div style={{ background: "#f5f1ea", minHeight: "100vh", fontFamily: "'Lato', sans-serif" }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Navbar />
      <main style={{ maxWidth: 720, margin: "0 auto", padding: "36px 20px 64px" }}>
        <Link href="/blog" style={{ fontSize: 12, color: "#888", textDecoration: "none" }}>&larr; All articles</Link>

        <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: GOLD, margin: "18px 0 8px" }}>
          {post.category}
        </p>
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(26px,4.5vw,38px)", color: NAVY, lineHeight: 1.2, margin: "0 0 10px" }}>
          {post.title}
        </h1>
        <p style={{ fontSize: 12, color: "#999", margin: "0 0 22px" }}>
          {fmtDate(post.date)} &middot; {post.readTime}
        </p>

        <img
          src={post.image}
          alt={post.imageAlt}
          width={1200}
          height={630}
          style={{ width: "100%", height: "auto", display: "block", marginBottom: 28, border: "0.5px solid #e5ddd0" }}
        />

        <article>
          {post.content.map((b, i) => <Block key={i} b={b} />)}
        </article>

        {post.cta && (
          <div style={{ background: NAVY, padding: 28, marginTop: 36, textAlign: "center" }}>
            <p style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, color: "#fff", margin: "0 0 14px" }}>
              Ready to share what you know?
            </p>
            <Link
              href={post.cta.href}
              style={{ display: "inline-block", background: GOLD, color: NAVY, fontWeight: 700, fontSize: 12, letterSpacing: "0.06em", padding: "12px 24px", textDecoration: "none" }}
            >
              {post.cta.label}
            </Link>
          </div>
        )}

        {related.length > 0 && (
          <section style={{ marginTop: 40 }}>
            <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, color: NAVY, margin: "0 0 12px" }}>More from the blog</h3>
            {related.map((p) => (
              <Link
                key={p.slug}
                href={`/blog/${p.slug}`}
                style={{ display: "block", background: CREAM, border: "0.5px solid #e5ddd0", padding: 14, marginBottom: 8, color: NAVY, fontSize: 14, fontWeight: 700, textDecoration: "none" }}
              >
                {p.title}
              </Link>
            ))}
          </section>
        )}
      </main>
    </div>
  );
}
