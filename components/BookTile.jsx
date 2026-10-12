"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";

const NAVY = "#0d2244";

export const BOOK_GRID_CSS = `
  .book-grid {
    display: flex;
    gap: 14px;
    overflow-x: auto;
    scroll-snap-type: x proximity;
    -webkit-overflow-scrolling: touch;
    padding-bottom: 6px;
    scrollbar-width: none;
  }
  .book-grid::-webkit-scrollbar { display: none; }
  .book-grid > * { flex: 0 0 118px; min-width: 0; scroll-snap-align: start; }
  @media (min-width: 640px) { .book-grid > * { flex-basis: 140px; } }
  @media (min-width: 1100px) { .book-grid > * { flex-basis: 150px; } }

  .book-tile { display: block; text-decoration: none; min-width: 0; }
  .book-tile:hover .book-tile-title { text-decoration: underline; }
`;

export default function BookTile({
    href, image, title, badge = "PDF", tag, priceText, free, owned,
    external = false, onClick,
}) {
    const [failed, setFailed] = useState(false);
    useEffect(() => { setFailed(false); }, [image]);

    const body = (
        <>
            <div style={{
                position: "relative", width: "100%", aspectRatio: "3 / 4",
                background: "#f1f1f1", border: "1px solid #e4e4e4",
                borderRadius: 4, overflow: "hidden",
                boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
            }}>
                {image && !failed && (
    <img
        src={image}
        alt={title}
        loading="lazy"
        style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
        onError={() => setFailed(true)}
    />
)}
                <span style={{
                    position: "absolute", top: 0, left: 0,
                    background: "rgba(38,38,38,0.92)", color: "#fff",
                    fontSize: 10, fontWeight: 700, letterSpacing: "0.02em",
                    padding: "3px 8px", borderRadius: "4px 0 4px 0",
                    fontFamily: "'Lato',sans-serif",
                }}>{badge}</span>
                {tag && (
                    <span style={{
                        position: "absolute", top: 0, right: 0,
                        background: "#b8963e", color: NAVY,
                        fontSize: 9, fontWeight: 700, padding: "3px 6px",
                        borderRadius: "0 4px 0 4px",
                        fontFamily: "'Lato',sans-serif",
                    }}>{tag}</span>
                )}
            </div>

            <p className="book-tile-title" style={{
                margin: "8px 0 0", fontSize: 12, lineHeight: 1.4, color: "#2b2b2b",
                fontFamily: "'Lato',sans-serif", fontWeight: 400,
                display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden",
                wordBreak: "break-word",
            }}>{title}</p>

            {(owned || free || priceText) && (
                <p style={{
                    margin: "2px 0 0", fontSize: 11, fontWeight: 700, fontFamily: "'Lato',sans-serif",
                    color: owned ? "#16a34a" : free ? "#16a34a" : NAVY,
                }}>
                    {owned ? "Owned" : free ? "Free" : priceText}
                </p>
            )}
        </>
    );

    return external
        ? <a href={href} onClick={onClick} className="book-tile">{body}</a>
        : <Link href={href} onClick={onClick} className="book-tile">{body}</Link>;
}