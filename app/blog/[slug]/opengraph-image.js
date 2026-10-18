// app/blog/[slug]/opengraph-image.js
// Makes the share image (WhatsApp, Facebook, X, Google) for each article from its title.
import { ImageResponse } from "next/og";
import { getPost, catMeta } from "../data/posts";

export const alt = "LAN Library Blog";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({ params }) {
    const { slug } = await params;
    const post = getPost(slug);
    const title = post ? post.title : "LAN Library Blog";
    const category = post ? post.category : "LAN Library";
    const accent = post ? catMeta(post.category).accent : "#b8963e";

    return new ImageResponse(
        (
            <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", background: "#0d2244", borderLeft: `20px solid ${accent}`, padding: "64px 70px", color: "#ffffff" }}>
                <div style={{ display: "flex", color: accent, fontSize: 28, letterSpacing: 4, textTransform: "uppercase" }}>{category}</div>
                <div style={{ display: "flex", fontSize: title.length > 70 ? 52 : 62, lineHeight: 1.18, fontWeight: 700 }}>{title}</div>
                <div style={{ display: "flex", justifyContent: "space-between", color: "#f5f0e8", fontSize: 28 }}>
                    <span>LAN Library Blog</span>
                    <span style={{ color: accent }}>Study smarter. Share what you know.</span>
                </div>
            </div>
        ),
        { ...size }
    );
}