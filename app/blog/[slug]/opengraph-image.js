// app/blog/[slug]/opengraph-image.js
// Makes the share image (WhatsApp, Facebook, X, Google) for each article from its title.
import { ImageResponse } from "next/og";
import { getPost } from "../data/posts";

export const alt = "LAN Library Blog";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({ params }) {
    const { slug } = await params;
    const post = getPost(slug);
    const title = post ? post.title : "LAN Library Blog";
    const category = post ? post.category : "LAN Library";

    return new ImageResponse(
        (
            <div
                style={{
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    background: "#0d2244",
                    borderLeft: "16px solid #b8963e",
                    padding: "64px 70px",
                    color: "#ffffff",
                }}
            >
                <div style={{ display: "flex", color: "#d4aa5a", fontSize: 28, letterSpacing: 4, textTransform: "uppercase" }}>
                    {category}
                </div>
                <div style={{ display: "flex", fontSize: title.length > 70 ? 52 : 62, lineHeight: 1.18, fontWeight: 700 }}>
                    {title}
                </div>
                <div style={{ display: "flex", color: "#f5f0e8", fontSize: 28 }}>LAN Library Blog</div>
            </div>
        ),
        { ...size }
    );
}