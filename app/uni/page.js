// app/uni/page.js
// ─────────────────────────────────────────────────────────────
// /uni  →  Directory of all University Hubs
// ─────────────────────────────────────────────────────────────
import Link from "next/link";
import { UNIVERSITY_REGISTRY } from "./[slug]/page";

export const metadata = {
    title: "Nigerian University Hubs — Textbooks & Study Materials | LAN Library",
    description: "Find verified textbooks, past questions, and lecture notes for all major Nigerian universities. Browse by institution — UNILAG, UniAbuja, OAU, UNIBEN, and more.",
    keywords: "Nigerian universities, university textbooks, past questions Nigeria, UNILAG books, UniAbuja materials, OAU textbooks, UNIBEN, LAN Library",
};

const NAVY = "#0d2244";
const GOLD = "#b8963e";
const GOLDD = "#d4aa5a";
const CREAM = "#f5f0e8";
const BG = "#f5f1ea";

export default function UniversityDirectoryPage() {
    const unis = Object.entries(UNIVERSITY_REGISTRY);

    return (
        <>
            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400&family=Lato:wght@300;400;700&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        body{background:${BG};}
        .udir-card{
          background:#fff;border:0.5px solid #e5ddd0;padding:22px 20px;
          display:flex;flex-direction:column;gap:10px;
          text-decoration:none;transition:transform 0.2s,box-shadow 0.2s,border-color 0.2s;
          color:${NAVY};
        }
        .udir-card:hover{transform:translateY(-4px);box-shadow:0 14px 36px rgba(13,34,68,0.12);border-color:${GOLD};}
        .udir-hero{
          background-color:${NAVY};
          background-image:radial-gradient(rgba(184,150,62,0.06) 1px,transparent 1px);
          background-size:26px 26px;
          padding:64px 24px 52px;
          position:relative;overflow:hidden;
        }
      `}</style>

            {/* Hero */}
            <div className="udir-hero">
                <div style={{ position: "absolute", top: -60, right: -60, width: 240, height: 240, border: "0.5px solid rgba(184,150,62,0.1)", transform: "rotate(45deg)" }} />
                <div style={{ maxWidth: 1100, margin: "0 auto", position: "relative", zIndex: 1 }}>
                    <div style={{ display: "inline-flex", alignItems: "center", gap: 7, background: "rgba(184,150,62,0.14)", border: "1px solid rgba(184,150,62,0.3)", padding: "4px 14px", marginBottom: 16 }}>
                        <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: GOLDD, fontFamily: "'Lato',sans-serif" }}>University Hubs</span>
                    </div>
                    <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: "clamp(28px,5vw,52px)", fontWeight: 700, color: "#fff", margin: "0 0 12px", lineHeight: 1.08 }}>
                        Browse by <span style={{ color: GOLD, fontStyle: "italic" }}>University</span>
                    </h1>
                    <p style={{ fontSize: 14, color: "rgba(255,255,255,0.5)", maxWidth: 520, lineHeight: 1.75, fontWeight: 300, fontFamily: "'Lato',sans-serif" }}>
                        Find course-specific textbooks, past questions, and lecture notes for your institution — verified and curated by fellow students.
                    </p>
                </div>
            </div>

            {/* Grid */}
            <div style={{ maxWidth: 1100, margin: "0 auto", padding: "48px 24px 80px" }}>
                <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", color: GOLD, marginBottom: 20, fontFamily: "'Lato',sans-serif" }}>
                    {unis.length} Institutions Available
                </p>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(240px,1fr))", gap: 14 }}>
                    {unis.map(([slug, uni]) => (
                        <Link key={slug} href={`/uni/${slug}`} className="udir-card">
                            {/* Type badge */}
                            <div style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "rgba(184,150,62,0.1)", border: "0.5px solid rgba(184,150,62,0.25)", padding: "2px 9px", width: "fit-content" }}>
                                <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: GOLD, fontFamily: "'Lato',sans-serif" }}>{uni.type}</span>
                            </div>

                            {/* Name */}
                            <div>
                                <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: 16, fontWeight: 700, color: NAVY, margin: "0 0 2px", lineHeight: 1.3 }}>{uni.name}</h2>
                                <p style={{ fontSize: 11, color: "#bbb", fontFamily: "'Lato',sans-serif", margin: 0 }}>{uni.state}</p>
                            </div>

                            {/* Meta */}
                            <div style={{ display: "flex", gap: 14, borderTop: "0.5px solid #f0ebe0", paddingTop: 10, marginTop: 2 }}>
                                {[
                                    { label: "Founded", val: uni.founded },
                                    { label: "Students", val: uni.students },
                                ].map(({ label, val }) => (
                                    <div key={label}>
                                        <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#ccc", fontFamily: "'Lato',sans-serif", marginBottom: 2 }}>{label}</div>
                                        <div style={{ fontSize: 12, fontWeight: 700, color: NAVY, fontFamily: "'Lato',sans-serif" }}>{val}</div>
                                    </div>
                                ))}
                            </div>

                            {/* CTA */}
                            <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 700, color: GOLD, fontFamily: "'Lato',sans-serif", letterSpacing: "0.04em" }}>
                                Browse Materials <span style={{ fontSize: 13 }}>→</span>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </>
    );
}