"use client"
import React, { useState, useEffect, useRef } from "react";

/* ─── design tokens ────────────────────────────────────────── */
const NAVY = "#0d2244";
const GOLD = "#b8963e";
const GOLDD = "#d4aa5a";
const CREAM = "#f5f0e8";
const BG = "#f5f1ea";
const DARK = "#08111f";

/* ─── reading progress hook ─────────────────────────────────── */
function useReadingProgress() {
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    const update = () => {
      const el = document.documentElement;
      const top = el.scrollTop || document.body.scrollTop;
      const h = el.scrollHeight - el.clientHeight;
      setProgress(h > 0 ? Math.round((top / h) * 100) : 0);
    };
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);
  return progress;
}

/* ─── intersection observer hook ────────────────────────────── */
function useVisible(threshold = 0.15) {
  const ref = useRef(null);
  const [vis, setVis] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVis(true); }, { threshold });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return [ref, vis];
}

/* ─── animated section wrapper ──────────────────────────────── */
function FadeUp({ children, delay = 0 }) {
  const [ref, vis] = useVisible();
  return (
    <div ref={ref} style={{
      opacity: vis ? 1 : 0,
      transform: vis ? "translateY(0)" : "translateY(32px)",
      transition: `opacity 0.7s ${delay}s cubic-bezier(.4,0,.2,1), transform 0.7s ${delay}s cubic-bezier(.4,0,.2,1)`,
    }}>
      {children}
    </div>
  );
}

/* ─── pull quote ─────────────────────────────────────────────── */
function PullQuote({ text, source }) {
  return (
    <FadeUp>
      <div style={{
        margin: "48px 0",
        padding: "40px 48px",
        borderLeft: `5px solid ${GOLD}`,
        background: `linear-gradient(135deg, ${CREAM} 0%, #ede8df 100%)`,
        position: "relative",
        overflow: "hidden",
      }}>
        <div style={{
          position: "absolute", top: -20, right: 24,
          fontSize: 160, fontFamily: "'Playfair Display',serif",
          color: "rgba(184,150,62,0.1)", lineHeight: 1, userSelect: "none",
          pointerEvents: "none",
        }}>"</div>
        <p style={{
          fontFamily: "'Playfair Display',serif",
          fontSize: "clamp(18px,2.5vw,24px)", fontStyle: "italic",
          color: NAVY, lineHeight: 1.6, margin: "0 0 16px",
          position: "relative", zIndex: 1,
        }}>{text}</p>
        {source && (
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 32, height: 1, background: GOLD }} />
            <span style={{ fontSize: 12, fontWeight: 700, color: GOLD, letterSpacing: ".12em", textTransform: "uppercase", fontFamily: "'Lato',sans-serif" }}>{source}</span>
          </div>
        )}
      </div>
    </FadeUp>
  );
}

/* ─── section heading ────────────────────────────────────────── */
function SectionHeading({ num, title, subtitle }) {
  return (
    <FadeUp>
      <div style={{ marginBottom: 40 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 16 }}>
          <div style={{
            width: 56, height: 56, background: NAVY, flexShrink: 0,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <span style={{ fontFamily: "'Playfair Display',serif", fontSize: 22, fontWeight: 900, color: GOLD }}>{num}</span>
          </div>
          <div style={{ height: 1, flex: 1, background: `linear-gradient(90deg, ${GOLD}, transparent)` }} />
        </div>
        <h2 style={{
          fontFamily: "'Playfair Display',serif",
          fontSize: "clamp(26px,3.5vw,42px)", fontWeight: 700,
          color: NAVY, margin: "0 0 10px", lineHeight: 1.1, letterSpacing: "-0.5px",
        }}>{title}</h2>
        {subtitle && (
          <p style={{ fontSize: 15, color: "#888", fontFamily: "'Lato',sans-serif", fontWeight: 300, lineHeight: 1.6, margin: 0 }}>{subtitle}</p>
        )}
      </div>
    </FadeUp>
  );
}

/* ─── wisdom card ────────────────────────────────────────────── */
function WisdomCard({ quote, attribution }) {
  return (
    <FadeUp>
      <div style={{
        background: NAVY,
        backgroundImage: "radial-gradient(rgba(184,150,62,0.07) 1px, transparent 1px)",
        backgroundSize: "22px 22px",
        padding: "36px 40px", margin: "40px 0",
        position: "relative", overflow: "hidden",
      }}>
        <div style={{ position: "absolute", top: -30, right: -30, width: 100, height: 100, border: `0.5px solid rgba(184,150,62,0.2)`, transform: "rotate(45deg)" }} />
        <div style={{ position: "absolute", bottom: -20, left: 20, width: 60, height: 60, border: `0.5px solid rgba(184,150,62,0.15)`, transform: "rotate(45deg)" }} />
        <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".2em", textTransform: "uppercase", color: GOLD, display: "block", marginBottom: 16, fontFamily: "'Lato',sans-serif" }}>✦ Wisdom ✦</span>
        <p style={{
          fontFamily: "'Playfair Display',serif",
          fontSize: "clamp(16px,2vw,20px)", fontStyle: "italic",
          color: CREAM, lineHeight: 1.7, margin: "0 0 20px", position: "relative",
        }}>{quote}</p>
        {attribution && (
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 24, height: 1, background: GOLD }} />
            <span style={{ fontSize: 11, color: GOLDD, fontFamily: "'Lato',sans-serif", fontWeight: 700, letterSpacing: ".08em" }}>{attribution}</span>
          </div>
        )}
      </div>
    </FadeUp>
  );
}

/* ─── principle card grid ────────────────────────────────────── */
function PrincipleCard({ icon, title, body, accent = GOLD }) {
  return (
    <div style={{
      background: "#fff", border: "0.5px solid #e5ddd0",
      padding: "28px 24px",
      transition: "transform .22s, box-shadow .22s, border-color .22s",
      cursor: "default",
    }}
      onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = "0 12px 32px rgba(13,34,68,0.1)"; e.currentTarget.style.borderColor = GOLD; }}
      onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = ""; e.currentTarget.style.borderColor = "#e5ddd0"; }}
    >
      <div style={{
        width: 48, height: 48, background: CREAM, border: `0.5px solid rgba(184,150,62,0.3)`,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 22, marginBottom: 16,
      }}>{icon}</div>
      <h4 style={{ fontFamily: "'Playfair Display',serif", fontSize: 17, fontWeight: 700, color: NAVY, margin: "0 0 10px" }}>{title}</h4>
      <p style={{ fontSize: 13, color: "#666", lineHeight: 1.75, fontFamily: "'Lato',sans-serif", margin: 0 }}>{body}</p>
    </div>
  );
}

/* ─── numbered step ──────────────────────────────────────────── */
function Step({ num, title, body, isLast }) {
  return (
    <div style={{ display: "flex", gap: 24, paddingBottom: isLast ? 0 : 32 }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 }}>
        <div style={{ width: 44, height: 44, background: NAVY, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span style={{ fontFamily: "'Playfair Display',serif", fontSize: 16, fontWeight: 700, color: GOLD }}>{num}</span>
        </div>
        {!isLast && <div style={{ width: 1, flex: 1, background: "rgba(184,150,62,0.25)", marginTop: 8 }} />}
      </div>
      <div style={{ paddingTop: 10 }}>
        <h4 style={{ fontFamily: "'Playfair Display',serif", fontSize: 18, fontWeight: 700, color: NAVY, margin: "0 0 8px" }}>{title}</h4>
        <p style={{ fontSize: 14, color: "#666", lineHeight: 1.8, fontFamily: "'Lato',sans-serif", margin: 0 }}>{body}</p>
      </div>
    </div>
  );
}

/* ─── body paragraph ─────────────────────────────────────────── */
function P({ children, style = {} }) {
  return (
    <p style={{
      fontSize: "clamp(15px,1.6vw,17px)",
      color: "#444", lineHeight: 1.9,
      fontFamily: "'Lato',sans-serif", fontWeight: 300,
      marginBottom: 20, textAlign: "justify", ...style,
    }}>{children}</p>
  );
}

function H3({ children }) {
  return (
    <h3 style={{
      fontFamily: "'Playfair Display',serif",
      fontSize: "clamp(20px,2.2vw,26px)", fontWeight: 700,
      color: NAVY, margin: "40px 0 16px", lineHeight: 1.2,
    }}>{children}</h3>
  );
}

/* ═══════════════════════════════════════════════════════════════
   TABLE OF CONTENTS
═══════════════════════════════════════════════════════════════ */
const TOC = [
  { num: "I", title: "The Psychology of Creation" },
  { num: "II", title: "The Discipline of Daily Writing" },
  { num: "III", title: "The Armor of Feedback" },
  { num: "IV", title: "Battling the Inner Critic & Imposter Syndrome" },
  { num: "V", title: "Self-Care: Fueling the Creative Engine" },
  { num: "VI", title: "Ideation & Deep Alignment" },
  { num: "VII", title: "Mapping Your Target Reader" },
  { num: "VIII", "title": "The Architecture of a First Draft" },
  { num: "IX", title: "Revision: The Real Writing" },
  { num: "X", title: "The Business of Being a Writer" },
  { num: "XI", title: "Building a Writing Life" },
];

/* ═══════════════════════════════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════════════════════════════ */
export default function WritersMindsetPage() {
  const progress = useReadingProgress();
  const [tocOpen, setTocOpen] = useState(false);

  return (
    <div style={{ backgroundColor: BG, color: NAVY, minHeight: "100vh" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400;1,700;1,900&family=Lato:wght@300;400;700;900&family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { overflow-x: hidden; }

        .wm-root { font-family: 'Lato', sans-serif; }
        .wm-serif { font-family: 'Playfair Display', Georgia, serif; }
        .wm-cormorant { font-family: 'Cormorant Garamond', Georgia, serif; }

        .drop-cap::first-letter {
          float: left;
          font-family: 'Playfair Display', serif;
          font-size: clamp(56px, 8vw, 88px);
          font-weight: 900;
          line-height: 0.75;
          margin: 6px 14px 0 0;
          color: ${NAVY};
          padding: 8px 0;
        }

        .progress-bar {
          position: fixed; top: 0; left: 0; height: 3px;
          background: linear-gradient(90deg, ${GOLD}, ${GOLDD});
          z-index: 9999; transition: width 0.1s linear;
        }

        .toc-btn {
          position: fixed; bottom: 32px; right: 32px; z-index: 100;
          width: 52px; height: 52px; background: ${NAVY};
          border: 0.5px solid ${GOLD}; display: flex; align-items: center;
          justify-content: center; cursor: pointer; transition: background .18s;
          box-shadow: 0 8px 24px rgba(13,34,68,0.3);
        }
        .toc-btn:hover { background: #1a3560; }

        .toc-panel {
          position: fixed; bottom: 96px; right: 32px; z-index: 100;
          width: 280px; background: ${NAVY}; border: 0.5px solid rgba(184,150,62,0.3);
          box-shadow: 0 24px 64px rgba(0,0,0,0.4);
          animation: slideUpPanel .2s cubic-bezier(.4,0,.2,1) both;
        }
        @keyframes slideUpPanel { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }

        .stat-box {
          text-align: center; padding: 24px 16px;
          border-right: 0.5px solid rgba(184,150,62,0.15);
        }
        .stat-box:last-child { border-right: none; }

        .highlight-box {
          background: #fff;
          border: 0.5px solid #e5ddd0;
          border-left: 4px solid ${GOLD};
          padding: 24px 28px;
          margin: 32px 0;
        }

        .two-col { columns: 2; column-gap: 40px; }
        @media (max-width: 640px) { .two-col { columns: 1; } }

        .grid-2 { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 16px; }
        .grid-3 { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px; }
        .grid-4 { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 14px; }

        .section-divider {
          display: flex; align-items: center; gap: 16px;
          margin: 80px 0 64px;
        }
        .section-divider::before, .section-divider::after {
          content: ""; flex: 1; height: 0.5px;
          background: linear-gradient(90deg, transparent, rgba(184,150,62,0.4), transparent);
        }

        @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }
        .anim-in { animation: fadeIn 1s both; }

        .chapter-intro {
          font-family: 'Cormorant Garamond', serif;
          font-size: clamp(18px, 2.2vw, 22px);
          font-style: italic; color: #666; line-height: 1.8;
          margin-bottom: 32px;
        }
      `}</style>

      {/* Reading progress */}
      <div className="progress-bar" style={{ width: `${progress}%` }} />

      {/* TOC toggle */}
      <button className="toc-btn" onClick={() => setTocOpen(o => !o)} title="Table of Contents">
        <svg width="18" height="14" viewBox="0 0 18 14" fill="none">
          <rect y="0" width="18" height="2" fill={GOLD} />
          <rect y="6" width="12" height="2" fill={GOLD} />
          <rect y="12" width="15" height="2" fill={GOLD} />
        </svg>
      </button>
      {tocOpen && (
        <div className="toc-panel">
          <div style={{ padding: "16px 18px", borderBottom: `0.5px solid rgba(184,150,62,0.2)` }}>
            <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: ".18em", textTransform: "uppercase", color: GOLD, fontFamily: "'Lato',sans-serif" }}>Contents</span>
          </div>
          <div style={{ maxHeight: 400, overflowY: "auto", padding: "8px 0" }}>
            {TOC.map(item => (
              <a key={item.num} href={`#section-${item.num.toLowerCase()}`}
                onClick={() => setTocOpen(false)}
                style={{
                  display: "flex", gap: 12, padding: "10px 18px",
                  textDecoration: "none", borderBottom: "0.5px solid rgba(255,255,255,0.04)",
                  transition: "background .15s",
                }}
                onMouseEnter={e => e.currentTarget.style.background = "rgba(184,150,62,0.1)"}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                <span style={{ fontSize: 10, fontWeight: 700, color: GOLD, fontFamily: "'Playfair Display',serif", flexShrink: 0, marginTop: 2 }}>{item.num}.</span>
                <span style={{ fontSize: 12, color: "rgba(245,240,232,0.75)", fontFamily: "'Lato',sans-serif", lineHeight: 1.4 }}>{item.title}</span>
              </a>
            ))}
          </div>
        </div>
      )}

      <div className="wm-root">

        {/* ═══ HERO ═══ */}
        <header style={{
          background: NAVY,
          backgroundImage: "radial-gradient(rgba(184,150,62,0.06) 1px, transparent 1px), radial-gradient(rgba(255,255,255,0.015) 1px, transparent 1px)",
          backgroundSize: "28px 28px, 14px 14px",
          backgroundPosition: "0 0, 7px 7px",
          padding: "80px 24px 0",
          overflow: "hidden", position: "relative",
        }}>
          {/* decorative corner */}
          <div style={{ position: "absolute", top: 0, right: 0, width: 300, height: 300, border: "0.5px solid rgba(184,150,62,0.08)", transform: "translate(120px,-120px) rotate(45deg)" }} />
          <div style={{ position: "absolute", top: 0, right: 0, width: 200, height: 200, border: "0.5px solid rgba(184,150,62,0.12)", transform: "translate(80px,-80px) rotate(45deg)" }} />

          <div style={{ maxWidth: 900, margin: "0 auto" }}>
            <div className="anim-in" style={{ display: "inline-flex", alignItems: "center", gap: 10, background: "rgba(184,150,62,0.12)", border: "0.5px solid rgba(184,150,62,0.3)", padding: "7px 18px", marginBottom: 32 }}>
              <span style={{ width: 6, height: 6, background: GOLD, display: "inline-block", borderRadius: "50%" }} />
              <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".2em", textTransform: "uppercase", color: GOLDD, fontFamily: "'Lato',sans-serif" }}>LAN Library · Masterclass Edition · Author Development</span>
            </div>

            <div className="anim-in" style={{ animationDelay: ".1s" }}>
              <p style={{ fontSize: "clamp(11px,1.2vw,13px)", fontWeight: 700, letterSpacing: ".22em", textTransform: "uppercase", color: GOLD, marginBottom: 16, fontFamily: "'Lato',sans-serif" }}>
                The Blueprint of a Successful Author
              </p>
              <h1 className="wm-serif anim-in" style={{
                fontSize: "clamp(38px,7vw,82px)", fontWeight: 900,
                color: "#fff", lineHeight: 1.02, letterSpacing: "-2px",
                margin: "0 0 12px",
              }}>
                Cultivating the<br />
                <span style={{ color: GOLD, fontStyle: "italic" }}>Writer's Mindset</span>
              </h1>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 14, margin: "24px 0 40px" }}>
              <div style={{ width: 48, height: 1, background: GOLD }} />
              <span style={{ fontSize: 12, color: "rgba(245,240,232,0.5)", fontFamily: "'Lato',sans-serif", letterSpacing: ".08em" }}>A COMPLETE DEEP-DIVE INTO THE PSYCHOLOGY, CRAFT & BUSINESS OF WRITING</span>
              <div style={{ height: 1, flex: 1, background: "linear-gradient(90deg, rgba(184,150,62,0.4), transparent)" }} />
            </div>

            <p className="wm-cormorant anim-in" style={{
              fontSize: "clamp(18px,2.4vw,26px)", fontStyle: "italic",
              color: "rgba(245,240,232,0.7)", lineHeight: 1.7,
              maxWidth: 700, marginBottom: 48, animationDelay: ".2s",
            }}>
              Writing a book is one of the grandest acts of human creation — the transformation of invisible thought into a physical object that can alter the course of another person's life. But most aspiring authors never finish. Not because they lack talent. Because they lack the <em style={{ color: GOLDD }}>mindset</em>.
            </p>

            {/* Stats strip */}
            <div style={{
              display: "flex", flexWrap: "wrap",
              borderTop: "0.5px solid rgba(184,150,62,0.2)",
            }}>
              {[
                { val: "11", label: "Deep Chapters" },
                { val: "60+", label: "Frameworks & Tools" },
                { val: "~45", label: "Min Read" },
                { val: "∞", label: "Lifetime Value" },
              ].map(({ val, label }) => (
                <div key={label} className="stat-box" style={{ flex: "1 1 100px" }}>
                  <div className="wm-serif" style={{ fontSize: 28, fontWeight: 700, color: "#fff" }}>{val}</div>
                  <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", color: "rgba(184,150,62,0.7)", marginTop: 4, fontFamily: "'Lato',sans-serif" }}>{label}</div>
                </div>
              ))}
            </div>
          </div>
        </header>

        {/* ═══ VIDEO PLACEHOLDER ═══ */}
        <div style={{ background: DARK, padding: "0 24px 64px" }}>
          <div style={{ maxWidth: 900, margin: "0 auto" }}>
            <div style={{
              position: "relative", width: "100%", aspectRatio: "16/9",
              background: "#0a0f1c", border: `0.5px solid rgba(184,150,62,0.2)`,
              overflow: "hidden",
            }}>
              {/* ── REPLACE THIS COMMENT WITH YOUR YOUTUBE IFRAME ──
                  <iframe
                    style={{ position:"absolute", top:0, left:0, width:"100%", height:"100%", border:0 }}
                    src="https://www.youtube.com/embed/YOUR_VIDEO_ID"
                    title="Developing a Writer's Mindset"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
              */}
              {/* Placeholder UI */}
              <div style={{
                position: "absolute", inset: 0,
                backgroundImage: "radial-gradient(rgba(184,150,62,0.05) 1px, transparent 1px)",
                backgroundSize: "20px 20px",
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 20,
              }}>
                <div style={{
                  width: 80, height: 80, borderRadius: "50%",
                  background: "rgba(184,150,62,0.15)", border: `1px solid rgba(184,150,62,0.4)`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill={GOLD}>
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
                <div style={{ textAlign: "center" }}>
                  <p style={{ fontSize: 14, fontWeight: 700, color: GOLDD, fontFamily: "'Lato',sans-serif", marginBottom: 4 }}>Video Coming Soon</p>
                  <p style={{ fontSize: 11, color: "rgba(245,240,232,0.35)", fontFamily: "'Lato',sans-serif" }}>Developing a Writer's Mindset — Visual Guide</p>
                </div>
              </div>
            </div>
            <p style={{ fontSize: 11, color: "rgba(245,240,232,0.3)", fontFamily: "'Lato',sans-serif", marginTop: 10, textAlign: "right" }}>
              ⚡ Full video masterclass · Replace src with your YouTube embed ID
            </p>
          </div>
        </div>

        {/* ═══ MAIN CONTENT ═══ */}
        <main style={{ maxWidth: 860, margin: "0 auto", padding: "80px 24px 120px" }}>

          {/* ══ SECTION I ══ */}
          <section id="section-i" style={{ marginBottom: 80 }}>
            <SectionHeading
              num="I"
              title="The Psychology of Creation"
              subtitle="Why writing is not a skill problem — it is a psychology problem"
            />

            <P className="drop-cap">
              What separates those who finish their book from those who don't has almost nothing to do with grammar, vocabulary, or even natural talent. The separating factor is entirely psychological. The successful author has built an internal architecture — a set of beliefs, habits, and coping mechanisms — that allows them to continue producing even when the work feels terrible, the motivation has evaporated, and the inner voice insists they stop.
            </P>

            <P>
              This internal architecture is what we call the <strong style={{ color: NAVY }}>Writer's Mindset</strong>. It is not a personality trait you are born with. It is a deliberate construction. Like a building, it must be designed, laid brick by brick, and reinforced over time.
            </P>

            <H3>The Two Modes of Every Writer's Brain</H3>
            <P>
              Every writer operates in one of two neurological modes at any given time. Understanding the difference between them — and mastering when to activate each — is perhaps the single most transformative insight you can internalize.
            </P>

            <FadeUp>
              <div className="grid-2" style={{ margin: "32px 0" }}>
                {[
                  {
                    label: "The Generative Mode",
                    icon: "🔥",
                    color: "#16a34a",
                    bg: "#f0fdf4",
                    border: "#86efac",
                    body: "This is your Creative brain — the right-hemisphere, associative, dreamlike mode. It generates without judging. It connects unrelated ideas. It follows tangents. It is irrational, messy, and wildly productive when given permission to roam freely. During first drafts, this mode must dominate.",
                  },
                  {
                    label: "The Editorial Mode",
                    icon: "🔬",
                    color: "#dc2626",
                    bg: "#fef2f2",
                    border: "#fca5a5",
                    body: "This is your Critic brain — the left-hemisphere, logical, analytical mode. It judges, corrects, and tightens. It notices the grammar error, the plot hole, the weak verb. During revision, this mode is indispensable. During first drafts, it is lethal — it kills sentences before they can become ideas.",
                  },
                ].map(({ label, icon, color, bg, border, body }) => (
                  <div key={label} style={{ background: bg, border: `0.5px solid ${border}`, padding: "28px 24px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                      <span style={{ fontSize: 24 }}>{icon}</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color, fontFamily: "'Lato',sans-serif", letterSpacing: ".06em", textTransform: "uppercase" }}>{label}</span>
                    </div>
                    <p style={{ fontSize: 13, color: "#444", lineHeight: 1.75, fontFamily: "'Lato',sans-serif", margin: 0 }}>{body}</p>
                  </div>
                ))}
              </div>
            </FadeUp>

            <WisdomCard
              quote="The amateur waits for inspiration; the professional knows that inspiration is a creature of habit. It does not invite itself into your room — it only visits when it sees you already sitting at the desk, working."
              attribution="The Writer's Creed"
            />

            <H3>Identity vs. Behaviour: The Core Shift</H3>
            <P>
              Most people approach writing as something they do. The breakthrough happens when you begin to see it as something you <em>are</em>. The moment you shift your identity from "someone who wants to write a book" to "a writer working on their book," your decision-making transforms. Writers write even when they don't feel like it — not out of discipline alone, but because writing is simply what they do. It is what they are.
            </P>
            <P>
              This identity shift sounds philosophical, but it has immediate practical consequences. When you are a writer, you don't negotiate with yourself about whether to sit down at the desk. When you are someone who wants to write, every session requires a fresh negotiation — and the couch usually wins.
            </P>

            <FadeUp>
              <div className="highlight-box">
                <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".18em", textTransform: "uppercase", color: GOLD, marginBottom: 12, fontFamily: "'Lato',sans-serif" }}>The Identity Reframe</p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: 16, alignItems: "center" }}>
                  <div style={{ background: "#f5f1ea", padding: "16px", textAlign: "center" }}>
                    <p style={{ fontSize: 11, fontWeight: 700, color: "#aaa", margin: "0 0 6px", fontFamily: "'Lato',sans-serif", letterSpacing: ".08em", textTransform: "uppercase" }}>Old Identity</p>
                    <p style={{ fontFamily: "'Playfair Display',serif", fontSize: 15, color: "#888", fontStyle: "italic", margin: 0 }}>"I want to write a book someday."</p>
                  </div>
                  <div style={{ fontSize: 24, color: GOLD, textAlign: "center" }}>→</div>
                  <div style={{ background: NAVY, padding: "16px", textAlign: "center" }}>
                    <p style={{ fontSize: 11, fontWeight: 700, color: GOLD, margin: "0 0 6px", fontFamily: "'Lato',sans-serif", letterSpacing: ".08em", textTransform: "uppercase" }}>New Identity</p>
                    <p style={{ fontFamily: "'Playfair Display',serif", fontSize: 15, color: "#fff", fontStyle: "italic", margin: 0 }}>"I am a writer. I write."</p>
                  </div>
                </div>
              </div>
            </FadeUp>
          </section>

          <div className="section-divider"><span style={{ fontSize: 16, color: GOLD }}>✦</span></div>

          {/* ══ SECTION II ══ */}
          <section id="section-ii" style={{ marginBottom: 80 }}>
            <SectionHeading
              num="II"
              title="The Discipline of Daily Writing"
              subtitle="How to engineer a writing practice that outlasts motivation"
            />

            <P>
              Motivation is a weather system. Some days it arrives in brilliant sunlight and you write four thousand words before noon. Other days it doesn't show up at all. If you wait for motivation to arrive before you write, you are outsourcing your creative output to an unreliable variable. The solution is to build a system so robust that motivation becomes irrelevant.
            </P>

            <H3>The Science of the Writing Ritual</H3>
            <P>
              The brain is a pattern-recognition machine. When you perform the same sequence of actions before writing every day — brewing coffee, sitting in the same chair, opening the same document, placing your hands on the keyboard — your brain begins to associate that sequence with the act of writing. Over time, the ritual itself triggers the creative state. This is operant conditioning applied to art.
            </P>
            <P>
              Your ritual doesn't need to be elaborate. Charles Dickens walked exactly the same route every morning before writing. Maya Angelou rented a hotel room and arrived there every day by 6:30 AM, regardless of whether she felt inspired. Toni Morrison wrote before dawn because she wanted the first thoughts in her head each day to be her own. The ritual is a bridge from the ordinary world into the creative one.
            </P>

            <FadeUp>
              <div style={{ background: "#fff", border: "0.5px solid #e5ddd0", padding: "32px", margin: "40px 0" }}>
                <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".18em", textTransform: "uppercase", color: GOLD, marginBottom: 24, fontFamily: "'Lato',sans-serif" }}>Build Your Writing Ritual — 5 Components</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                  {[
                    { step: "01", label: "Fixed Time", desc: "Choose a time slot and protect it as non-negotiable. Morning is ideal because your willpower reserves are full and the world hasn't made demands yet." },
                    { step: "02", label: "Sacred Space", desc: "Designate a writing location — even if it's just one corner of a room. Your brain will learn to associate that space with creative output." },
                    { step: "03", label: "The Entry Ritual", desc: "A 5-minute pre-write: re-read your last 300 words, note one thing you want to accomplish today, and set a modest word count target." },
                    { step: "04", label: "The Distraction Barrier", desc: "Phone in another room. Notifications off. If using a computer, consider apps like Freedom or Cold Turkey for the duration of your session." },
                    { step: "05", label: "The Exit Ritual", desc: "Stop mid-sentence on purpose. Hemingway's secret: always stop when you know what comes next. This makes it far easier to re-enter the work tomorrow." },
                  ].map(({ step, label, desc }, i, arr) => (
                    <div key={step} style={{ display: "flex", gap: 20, padding: "18px 0", borderBottom: i < arr.length - 1 ? "0.5px solid #f0ebe0" : "none" }}>
                      <span style={{ fontFamily: "'Playfair Display',serif", fontSize: 13, fontWeight: 700, color: GOLD, flexShrink: 0, width: 28 }}>{step}</span>
                      <div>
                        <strong style={{ fontSize: 14, color: NAVY, fontFamily: "'Lato',sans-serif", display: "block", marginBottom: 4 }}>{label}</strong>
                        <p style={{ fontSize: 13, color: "#666", lineHeight: 1.7, fontFamily: "'Lato',sans-serif", margin: 0 }}>{desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </FadeUp>

            <H3>The Minimum Viable Word Count</H3>
            <P>
              One of the most powerful psychological tools available to a writer is what productivity researchers call the "minimum viable action." Instead of targeting 2,000 words a day — a number that can feel crushing before you begin — you commit to writing just 200 words. That's it. Two hundred words is less than one page. It takes roughly 10 minutes. It feels almost embarrassingly easy.
            </P>
            <P>
              The genius of this approach is that it removes the psychological resistance of starting. And once you're started, the momentum almost always carries you beyond 200. But even on the worst days, 200 words is still progress. At 200 words a day, you write a full novel-length manuscript in under a year.
            </P>

            <WisdomCard
              quote="Do not look at the mountain ahead and despair over its height. Look down at your feet, take one step, and make that step beautiful. A single page a day is a book by the end of the year."
              attribution="On Incremental Progress"
            />
          </section>

          <div className="section-divider"><span style={{ fontSize: 16, color: GOLD }}>✦</span></div>

          {/* ══ SECTION III ══ */}
          <section id="section-iii" style={{ marginBottom: 80 }}>
            <SectionHeading
              num="III"
              title="The Armor of Feedback"
              subtitle="How to receive criticism without being destroyed by it"
            />

            <P>
              Writing is an act of extreme vulnerability. When you hand someone your manuscript, you are handing them a piece of your interior life. When they criticise it, it can feel personal — even existential. The untrained writer collapses under critique. The masterful writer has developed a psychological structure that allows them to receive feedback without it threatening their identity.
            </P>

            <H3>The Zen of Non-Attachment</H3>
            <P>
              The critical breakthrough is learning to see your writing as a separate object from yourself. Your manuscript is something you created; it is not who you are. A sculptor does not take it personally when someone says a piece of marble should be shaped differently. The marble is not the sculptor.
            </P>

            <FadeUp>
              <div style={{ background: CREAM, border: "0.5px solid #e5ddd0", padding: "32px", margin: "32px 0" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: 16, alignItems: "center", textAlign: "center" }}>
                  <div style={{ background: NAVY, padding: 20 }}>
                    <p style={{ fontSize: 11, fontWeight: 700, color: GOLDD, letterSpacing: ".1em", textTransform: "uppercase", fontFamily: "'Lato',sans-serif", margin: "0 0 6px" }}>Your Identity</p>
                    <p style={{ fontSize: 13, color: "rgba(245,240,232,0.7)", fontFamily: "'Lato',sans-serif", margin: 0 }}>Your worth, your humanity, your soul</p>
                  </div>
                  <div>
                    <div style={{ width: 1, height: 60, background: "rgba(184,150,62,0.3)", margin: "0 auto 8px" }} />
                    <span style={{ fontSize: 10, color: "#aaa", fontFamily: "'Lato',sans-serif" }}>completely separate</span>
                    <div style={{ width: 1, height: 60, background: "rgba(184,150,62,0.3)", margin: "8px auto 0" }} />
                  </div>
                  <div style={{ background: "#fff", border: `0.5px solid ${GOLD}`, padding: 20 }}>
                    <p style={{ fontSize: 11, fontWeight: 700, color: GOLD, letterSpacing: ".1em", textTransform: "uppercase", fontFamily: "'Lato',sans-serif", margin: "0 0 6px" }}>The Manuscript</p>
                    <p style={{ fontSize: 13, color: "#666", fontFamily: "'Lato',sans-serif", margin: 0 }}>A crafted object that can be improved</p>
                  </div>
                </div>
                <p style={{ textAlign: "center", fontSize: 13, color: "#888", fontFamily: "'Lato',sans-serif", marginTop: 20, fontStyle: "italic" }}>
                  Feedback lands on the manuscript. It never touches you.
                </p>
              </div>
            </FadeUp>

            <H3>A Taxonomy of Feedback</H3>
            <P>Not all feedback deserves equal weight. Learning to categorise the critique you receive is a survival skill for the serious writer.</P>

            <FadeUp>
              <div className="grid-3" style={{ margin: "32px 0" }}>
                {[
                  { type: "Gold Feedback", icon: "🥇", color: GOLD, bg: "rgba(184,150,62,0.08)", border: "rgba(184,150,62,0.3)", desc: "Makes you say: 'I sensed this problem but couldn't name it.' These insights resonate because your own instincts already flagged the issue. Act on these immediately." },
                  { type: "Silver Feedback", icon: "🥈", color: "#94a3b8", bg: "rgba(148,163,184,0.08)", border: "rgba(148,163,184,0.3)", desc: "Technically accurate but misses your intent. The feedback is valid in isolation but doesn't serve your vision. Consider it, then consciously decide whether it aligns." },
                  { type: "Noise", icon: "🚫", color: "#ef4444", bg: "rgba(239,68,68,0.05)", border: "rgba(239,68,68,0.2)", desc: "Tries to turn your book into a different book. If you're writing a dark thriller and someone wants it to be lighter, that reader is not your audience. Discard politely." },
                ].map(({ type, icon, color, bg, border, desc }) => (
                  <div key={type} style={{ background: bg, border: `0.5px solid ${border}`, padding: "24px 20px" }}>
                    <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 12 }}>
                      <span style={{ fontSize: 18 }}>{icon}</span>
                      <span style={{ fontSize: 11, fontWeight: 700, color, fontFamily: "'Lato',sans-serif", letterSpacing: ".08em", textTransform: "uppercase" }}>{type}</span>
                    </div>
                    <p style={{ fontSize: 13, color: "#555", lineHeight: 1.7, fontFamily: "'Lato',sans-serif", margin: 0 }}>{desc}</p>
                  </div>
                ))}
              </div>
            </FadeUp>
          </section>

          <div className="section-divider"><span style={{ fontSize: 16, color: GOLD }}>✦</span></div>

          {/* ══ SECTION IV ══ */}
          <section id="section-iv" style={{ marginBottom: 80 }}>
            <SectionHeading
              num="IV"
              title="Battling the Inner Critic & Imposter Syndrome"
              subtitle="The voice that says you're not good enough — and how to silence it"
            />

            <P>
              Every serious writer — from the unpublished beginner to the Nobel laureate — has an inner critic. This voice is not an enemy to be destroyed. It is a part of your cognitive architecture that evolved to protect you from social embarrassment and failure. The problem is that it cannot distinguish between a genuine threat and the act of sitting down to write a novel.
            </P>

            <H3>Understanding the Inner Critic's Anatomy</H3>
            <P>
              The inner critic operates through three primary mechanisms. Understanding each one gives you the tools to neutralize them.
            </P>

            <FadeUp>
              <div style={{ display: "flex", flexDirection: "column", gap: 0, border: "0.5px solid #e5ddd0", background: "#fff", margin: "32px 0" }}>
                {[
                  { mechanism: "Comparison", description: "The critic holds your first draft up against a published masterwork — comparing your raw clay to someone else's finished sculpture. It is a dishonest comparison that ignores years of revision.", antidote: "Compare your work to your previous work only. The question is never 'Is this as good as Chimamanda's?' It is always 'Is this better than my last chapter?'" },
                  { mechanism: "Catastrophising", description: "The critic takes one weak sentence and extrapolates it to mean the entire book is worthless, that you have no talent, and that you should stop immediately.", antidote: "Apply the 'one chapter at a time' rule. You are not writing the whole book — you are writing the next sentence. Shrink the scope until the task is impossible to catastrophise." },
                  { mechanism: "Perfectionism", description: "The critic insists that nothing should be written until it can be written perfectly, leading to paralysis. The blank page becomes safer than the imperfect draft.", antidote: "Give yourself explicit permission to write badly. Tell yourself: 'This draft is allowed to be a disaster. I'm just getting the clay on the table.'" },
                ].map(({ mechanism, description, antidote }, i, arr) => (
                  <div key={mechanism} style={{ padding: "24px 28px", borderBottom: i < arr.length - 1 ? "0.5px solid #f0ebe0" : "none" }}>
                    <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
                      <div style={{ width: 36, height: 36, background: "#fef2f2", border: "0.5px solid #fca5a5", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <span style={{ fontSize: 14 }}>⚔️</span>
                      </div>
                      <div style={{ flex: 1 }}>
                        <strong style={{ fontSize: 14, color: NAVY, fontFamily: "'Lato',sans-serif", display: "block", marginBottom: 6 }}>{mechanism}</strong>
                        <p style={{ fontSize: 13, color: "#666", lineHeight: 1.7, fontFamily: "'Lato',sans-serif", margin: "0 0 12px" }}>{description}</p>
                        <div style={{ background: "#f0fdf4", border: "0.5px solid #86efac", padding: "10px 14px", display: "flex", gap: 10 }}>
                          <span style={{ fontSize: 12, color: "#16a34a", fontWeight: 700, flexShrink: 0, fontFamily: "'Lato',sans-serif" }}>Antidote:</span>
                          <p style={{ fontSize: 12, color: "#166534", lineHeight: 1.65, fontFamily: "'Lato',sans-serif", margin: 0 }}>{antidote}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </FadeUp>

            <WisdomCard
              quote="Perfectionism is the voice of the oppressor, the enemy of the people. It will keep you cramped and insane your whole life. I think perfectionism is based on the obsessive belief that if you run carefully enough, hitting each stepping-stone just right, you won't have to die."
              attribution="Anne Lamott, Bird by Bird"
            />
          </section>

          <div className="section-divider"><span style={{ fontSize: 16, color: GOLD }}>✦</span></div>

          {/* ══ SECTION V ══ */}
          <section id="section-v" style={{ marginBottom: 80 }}>
            <SectionHeading
              num="V"
              title="Self-Care: Fueling the Creative Engine"
              subtitle="Why your physical and mental health is a professional obligation"
            />

            <P>
              Writing is deceptive. Because it is done sitting quietly, society does not treat it as strenuous work. In reality, sustained creative effort is among the most metabolically and emotionally demanding activities a human can engage in. It draws continuously from your reserves of cognitive energy, emotional bandwidth, and psychological resilience. If you do not actively replenish these reserves, you will burn out — and creative burnout can last months or years.
            </P>

            <WisdomCard
              quote="You cannot pour clean water from a poisoned well. Your imagination is entirely dependent on the health of the vessel carrying it."
              attribution="On Creative Health"
            />

            <FadeUp>
              <div className="grid-2" style={{ margin: "40px 0" }}>
                {[
                  { icon: "😴", title: "Sleep as Laboratory", body: "During REM sleep, your brain consolidates emotional experiences, forms novel connections between disparate concepts, and literally rehearses creative problems. Writers who sacrifice sleep to write more invariably write worse. Guard 7–9 hours as sacred. The best ideas often arrive the morning after a well-rested night." },
                  { icon: "🚶", title: "Movement as Medicine", body: "Charles Dickens, Virginia Woolf, Friedrich Nietzsche — all were obsessive walkers who attributed much of their creative output to walking. Physical movement increases cerebral blood flow, releases neurochemicals that enhance creative thinking, and physically breaks the patterns of thought that lead to being 'stuck.'" },
                  { icon: "📚", title: "The Reading Diet", body: "Your writing can only be as rich as what you consume. Reading widely — particularly outside your genre — gives your brain the raw materials it needs. Reading a philosophy book while writing a thriller. Reading poetry while writing non-fiction. Cross-pollination produces the most original work." },
                  { icon: "🤲", title: "Solitude vs. Community", body: "Writing requires solitude to create, but connection to sustain. Prolonged isolation breeds dysfunction. Build deliberate community: a writing group, a trusted reader, a mentor. Protect your writing hours fiercely, and just as fiercely protect time for human connection that refills the emotional tank." },
                  { icon: "🧘", title: "Managing the Emotional Weight", body: "Writers process the world through their work, which means their writing often surfaces uncomfortable emotions. Build practices — journaling, therapy, meditation, physical exercise — that allow you to process these emotions without suppressing them. Suppressed emotion shows up as writer's block." },
                  { icon: "🌱", title: "The Art of Deliberate Rest", body: "Rest is not the absence of work. Active rest — walking, cooking, listening to music, staring out a window — allows your default mode network to work on your creative problems subconsciously. Many writers report that their best solutions arrive not at the desk, but in the shower." },
                ].map(props => <PrincipleCard key={props.title} {...props} />)}
              </div>
            </FadeUp>
          </section>

          <div className="section-divider"><span style={{ fontSize: 16, color: GOLD }}>✦</span></div>

          {/* ══ SECTION VI ══ */}
          <section id="section-vi" style={{ marginBottom: 80 }}>
            <SectionHeading
              num="VI"
              title="Ideation & Deep Alignment"
              subtitle="Finding the idea that has enough fuel to carry you through a full manuscript"
            />

            <P>
              A book requires months — sometimes years — of your life. If you choose an idea because it seems commercially viable, or because it's trending, or because someone suggested it, you will run out of gas somewhere in the middle. Books written purely for external reasons rarely get finished. And if they do, they often lack the soul that makes readers care.
            </P>

            <H3>The Soul Check: Four Questions to Find Your Real Book</H3>

            <FadeUp>
              <div style={{ display: "flex", flexDirection: "column", gap: 0, border: "0.5px solid #e5ddd0", background: "#fff", margin: "32px 0" }}>
                {[
                  { q: "What question have I been trying to answer my whole life?", note: "The books that change lives are books that grapple with a genuine, unresolved question. Your reader is likely asking the same question." },
                  { q: "What makes me righteously angry, deeply sorrowful, or ecstatically alive?", note: "Emotion is fuel. A book born from genuine feeling will sustain you through the dark middle chapters where motivation fails." },
                  { q: "What am I uniquely qualified to say — because of the scars I carry and the joys I have lived?", note: "Your specific combination of experience and perspective is irreplaceable. No one else can write exactly your book." },
                  { q: "Would I write this book even if no one ever read it?", note: "This is the ultimate litmus test. If the answer is no, keep searching. The right idea says yes without hesitation." },
                ].map(({ q, note }, i, arr) => (
                  <div key={i} style={{ padding: "24px 28px", borderBottom: i < arr.length - 1 ? "0.5px solid #f0ebe0" : "none", display: "flex", gap: 20 }}>
                    <div style={{ width: 32, height: 32, background: NAVY, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <span style={{ fontFamily: "'Playfair Display',serif", fontSize: 14, fontWeight: 700, color: GOLD }}>{i + 1}</span>
                    </div>
                    <div>
                      <p style={{ fontSize: 15, fontWeight: 700, color: NAVY, margin: "0 0 8px", fontFamily: "'Lato',sans-serif", lineHeight: 1.4 }}>{q}</p>
                      <p style={{ fontSize: 13, color: "#888", fontFamily: "'Lato',sans-serif", fontStyle: "italic", margin: 0, lineHeight: 1.6 }}>{note}</p>
                    </div>
                  </div>
                ))}
              </div>
            </FadeUp>

            <H3>The Idea Stress Test</H3>
            <P>
              Once you have a candidate idea, subject it to what I call the 30-day incubation test. Write the idea down in one paragraph. Put it away for 30 days. If, after a month, the idea still feels alive — if it keeps surfacing in your thoughts, generating new questions, demanding to be explored — it passes the test. If you've forgotten it entirely, it was a spark, not a fire.
            </P>
          </section>

          <div className="section-divider"><span style={{ fontSize: 16, color: GOLD }}>✦</span></div>

          {/* ══ SECTION VII ══ */}
          <section id="section-vii" style={{ marginBottom: 80 }}>
            <SectionHeading
              num="VII"
              title="Mapping Your Target Reader"
              subtitle="The counter-intuitive truth: narrowing your audience expands your reach"
            />

            <P>
              A book written for everyone is a book loved by no one. This is one of the hardest truths for new writers to accept, because the instinct is to cast the widest possible net. But specificity is the paradox of audience: the more precisely you understand who you are writing for, the more universally your writing resonates.
            </P>
            <P>
              When Toni Morrison wrote <em>Beloved</em>, she was writing specifically for Black American women — not for a general literary audience. The specificity of her vision is exactly what made it a universal masterpiece. When Chinua Achebe wrote <em>Things Fall Apart</em>, he was writing to correct a specific misrepresentation of African life. That focused intent is precisely what made the book travel across the entire world.
            </P>

            <H3>Building the Reader Profile</H3>

            <FadeUp>
              <div style={{ overflowX: "auto", margin: "32px 0" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "'Lato',sans-serif" }}>
                  <thead>
                    <tr style={{ background: NAVY }}>
                      {["Dimension", "The Question to Ask", "What It Changes in Your Writing"].map(h => (
                        <th key={h} style={{ padding: "14px 18px", fontSize: 10, fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", color: GOLDD, textAlign: "left" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ["Life Stage", "Are they navigating early adulthood, midlife transition, or late-life reflection?", "Vocabulary, cultural references, the emotional temperature of your prose, what you can assume they already know."],
                      ["Intellectual Appetite", "Do they want an accessible, breezy read or a dense, challenging deep-dive?", "Sentence complexity, how much you explain vs. assume, whether you cite research or speak from personal authority."],
                      ["Primary Pain", "What specific problem are they hoping this book will help them solve or escape?", "Your opening hook, the promises you make in the introduction, and the arc of your argument or story."],
                      ["Emotional Desire", "Do they want to feel inspired? Understood? Challenged? Comforted?", "The emotional tone you sustain throughout — hopeful, gritty, warm, confrontational."],
                      ["Reading Context", "Do they read on a commute, before bed, or in long focused sittings?", "Chapter length, cliffhanger structure, density of information per page."],
                    ].map(([dim, q, impact], i) => (
                      <tr key={dim} style={{ background: i % 2 === 0 ? "#fff" : BG }}>
                        <td style={{ padding: "14px 18px", fontSize: 13, fontWeight: 700, color: NAVY, verticalAlign: "top", borderBottom: "0.5px solid #f0ebe0" }}>{dim}</td>
                        <td style={{ padding: "14px 18px", fontSize: 13, color: "#555", verticalAlign: "top", borderBottom: "0.5px solid #f0ebe0", fontStyle: "italic" }}>{q}</td>
                        <td style={{ padding: "14px 18px", fontSize: 13, color: "#666", verticalAlign: "top", borderBottom: "0.5px solid #f0ebe0" }}>{impact}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </FadeUp>
          </section>

          <div className="section-divider"><span style={{ fontSize: 16, color: GOLD }}>✦</span></div>

          {/* ══ SECTION VIII ══ */}
          <section id="section-viii" style={{ marginBottom: 80 }}>
            <SectionHeading
              num="VIII"
              title="The Architecture of a First Draft"
              subtitle="How to build the imperfect structure that everything else depends on"
            />

            <P>
              The first draft is not a finished product. It is a discovery process disguised as writing. Professional writers do not sit down and produce polished prose on the first pass — they use the first draft to find out what they actually want to say. The act of writing is the act of thinking.
            </P>

            <PullQuote
              text="The first draft is just you telling yourself the story."
              source="Terry Pratchett"
            />

            <H3>Structural Approaches: Choose Your Architecture</H3>
            <P>
              There is a long-standing debate among writers between those who outline (Plotters) and those who write without a plan (Pantsers, from "flying by the seat of your pants"). Both approaches produce great books. The mistake is choosing one approach because you think you should, rather than because it fits the way your mind works.
            </P>

            <FadeUp>
              <div className="grid-2" style={{ margin: "32px 0" }}>
                {[
                  {
                    label: "The Plotter",
                    icon: "📐",
                    sub: "Structure first, then prose",
                    pros: ["Fewer dead ends and wasted chapters", "Easier to maintain pacing and structure", "Confidence from knowing where you're going", "Revision is more targeted"],
                    cons: ["Can feel mechanical or constrictive", "Plot outlines can become outdated as characters develop", "Risk of writing to the outline rather than the story"],
                  },
                  {
                    label: "The Pantser",
                    icon: "🌊",
                    sub: "Discovery through writing",
                    pros: ["Characters develop organically and feel more alive", "Surprises yourself, which surprises the reader", "Process feels more free and spontaneous", "Discovery drafts reveal the real story"],
                    cons: ["Higher revision burden — structural problems emerge late", "Risk of writing into dead ends", "Can feel chaotic and anxiety-inducing"],
                  },
                ].map(({ label, icon, sub, pros, cons }) => (
                  <div key={label} style={{ background: "#fff", border: "0.5px solid #e5ddd0", padding: "28px 24px" }}>
                    <div style={{ marginBottom: 18 }}>
                      <span style={{ fontSize: 24, marginRight: 8 }}>{icon}</span>
                      <strong style={{ fontFamily: "'Playfair Display',serif", fontSize: 18, color: NAVY }}>{label}</strong>
                      <p style={{ fontSize: 12, color: GOLD, fontFamily: "'Lato',sans-serif", marginTop: 4, fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase" }}>{sub}</p>
                    </div>
                    <div style={{ marginBottom: 14 }}>
                      <p style={{ fontSize: 10, fontWeight: 700, color: "#16a34a", letterSpacing: ".12em", textTransform: "uppercase", fontFamily: "'Lato',sans-serif", marginBottom: 8 }}>Advantages</p>
                      {pros.map(p => (
                        <div key={p} style={{ display: "flex", gap: 8, marginBottom: 6 }}>
                          <span style={{ color: "#16a34a", fontSize: 13, flexShrink: 0 }}>✓</span>
                          <span style={{ fontSize: 12, color: "#555", fontFamily: "'Lato',sans-serif" }}>{p}</span>
                        </div>
                      ))}
                    </div>
                    <div>
                      <p style={{ fontSize: 10, fontWeight: 700, color: "#dc2626", letterSpacing: ".12em", textTransform: "uppercase", fontFamily: "'Lato',sans-serif", marginBottom: 8 }}>Challenges</p>
                      {cons.map(c => (
                        <div key={c} style={{ display: "flex", gap: 8, marginBottom: 6 }}>
                          <span style={{ color: "#dc2626", fontSize: 13, flexShrink: 0 }}>−</span>
                          <span style={{ fontSize: 12, color: "#555", fontFamily: "'Lato',sans-serif" }}>{c}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </FadeUp>
          </section>

          <div className="section-divider"><span style={{ fontSize: 16, color: GOLD }}>✦</span></div>

          {/* ══ SECTION IX ══ */}
          <section id="section-ix" style={{ marginBottom: 80 }}>
            <SectionHeading
              num="IX"
              title="Revision: The Real Writing"
              subtitle="Why the first draft is only 30% of the work"
            />

            <P>
              Most amateur writers believe that writing a first draft is the hard part and that revision is just cleanup. Professional writers know the opposite is true. The first draft is where you discover what you want to say. Revision is where you actually say it — clearly, powerfully, and without a wasted word.
            </P>

            <WisdomCard
              quote="Books aren't written — they're rewritten. Including your own. It is one of the hardest things to accept, especially after the seventh rewrite hasn't quite done it."
              attribution="Michael Crichton"
            />

            <H3>The Five Passes of Revision</H3>
            <P>Attempting to fix everything in one pass is a recipe for missing things and exhaustion. Professional editors work in passes, each with a specific focus.</P>

            <FadeUp>
              <div style={{ display: "flex", flexDirection: "column", gap: 0, border: "0.5px solid #e5ddd0", background: "#fff", margin: "32px 0" }}>
                {[
                  { pass: "Pass 1", name: "The Structural Read", focus: "Big picture only", action: "Read through without editing anything. Note structural problems: missing scenes, chapters that drag, plot threads that go nowhere, character arcs that are incomplete. Do not fix sentences on this pass — you may delete entire chapters." },
                  { pass: "Pass 2", name: "The Scene-Level Pass", focus: "Each scene earns its place", action: "Every scene must do at least two jobs: advance the plot AND reveal character. If a scene only does one, combine it with another. If it does neither, cut it." },
                  { pass: "Pass 3", name: "The Paragraph Pass", focus: "Flow and rhythm", action: "Read each paragraph aloud. Does it flow? Does the last sentence of each paragraph make you want to read the next? Vary sentence length deliberately — short sentences create urgency, long sentences create immersion." },
                  { pass: "Pass 4", name: "The Word-Level Pass", focus: "Precision and power", action: "Eliminate every word that isn't doing work. Replace generic verbs with specific ones. Cut adverbs that are propping up weak verbs. Replace vague nouns with concrete ones." },
                  { pass: "Pass 5", name: "The Cold Read", focus: "Final perspective", action: "Print the manuscript. Read it as a reader, not a writer. Mark anything that breaks your concentration. These breaks are the final targets for revision." },
                ].map(({ pass, name, focus, action }, i, arr) => (
                  <div key={pass} style={{ display: "flex", gap: 0, borderBottom: i < arr.length - 1 ? "0.5px solid #f0ebe0" : "none" }}>
                    <div style={{ width: 8, background: i === 0 ? GOLD : i === 4 ? NAVY : `rgba(184,150,62,${0.3 + i * 0.1})`, flexShrink: 0 }} />
                    <div style={{ padding: "20px 24px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
                        <span style={{ fontSize: 10, fontWeight: 700, color: GOLD, letterSpacing: ".14em", textTransform: "uppercase", fontFamily: "'Lato',sans-serif" }}>{pass}</span>
                        <strong style={{ fontSize: 14, color: NAVY, fontFamily: "'Lato',sans-serif" }}>{name}</strong>
                        <span style={{ fontSize: 11, color: "#aaa", fontFamily: "'Lato',sans-serif", fontStyle: "italic" }}>— {focus}</span>
                      </div>
                      <p style={{ fontSize: 13, color: "#666", lineHeight: 1.7, fontFamily: "'Lato',sans-serif", margin: 0 }}>{action}</p>
                    </div>
                  </div>
                ))}
              </div>
            </FadeUp>
          </section>

          <div className="section-divider"><span style={{ fontSize: 16, color: GOLD }}>✦</span></div>

          {/* ══ SECTION X ══ */}
          <section id="section-x" style={{ marginBottom: 80 }}>
            <SectionHeading
              num="X"
              title="The Business of Being a Writer"
              subtitle="Building the financial scaffolding that allows you to write for life"
            />

            <P>
              Developing a writer's mindset includes developing a clear-eyed relationship with the business of writing. Romanticising the "suffering artist" who ignores commercial reality is a luxury that leads to burnout, resentment, and giving up. Understanding how writers generate income is not selling out — it is survival.
            </P>

            <FadeUp>
              <div className="grid-3" style={{ margin: "40px 0" }}>
                {[
                  { icon: "📖", title: "Direct Sales", body: "Selling your book directly to readers — through platforms like LAN Library — gives you the highest revenue share and direct relationship with your audience." },
                  { icon: "🏛️", title: "Traditional Publishing", body: "An advance plus royalties. The prestige is high; control is low. The advance is often small. Gatekeeping is significant. Best for writers who value distribution reach and institutional legitimacy." },
                  { icon: "🎤", title: "Speaking & Workshops", body: "A well-positioned book is a speaking credential. Many authors earn more from speaking fees than from royalties. Teaching workshops on your subject multiplies your income streams." },
                  { icon: "📧", title: "Email List", body: "Your most valuable asset as an author is an email list of people who want to hear from you. Start building it before the book is finished. Platforms change; your list is yours." },
                  { icon: "🎓", title: "Online Courses", body: "If your book teaches something, a course allows you to go deeper and earn significantly more per person served. Books open the door; courses are behind it." },
                  { icon: "🤝", title: "Consulting & Coaching", body: "Non-fiction authors especially can convert their expertise into consulting income. Your book becomes proof of concept for your authority on the subject." },
                ].map(props => <PrincipleCard key={props.title} {...props} />)}
              </div>
            </FadeUp>

            <WisdomCard
              quote="The goal of most writers is not to make a living from a single book. The goal is to build a body of work that creates a living — each book building on the last, each reader becoming part of a community."
              attribution="On the Long Game"
            />
          </section>

          <div className="section-divider"><span style={{ fontSize: 16, color: GOLD }}>✦</span></div>

          {/* ══ SECTION XI ══ */}
          <section id="section-xi" style={{ marginBottom: 80 }}>
            <SectionHeading
              num="XI"
              title="Building a Writing Life"
              subtitle="The long arc: how to write for decades, not just for one book"
            />

            <P>
              The writer's mindset, ultimately, is not about finishing one book. It is about building a life in which writing is possible — year after year, decade after decade, through success and rejection, through seasons of productivity and seasons of silence. This is the long game. And the long game requires a different set of tools than the short game.
            </P>

            <H3>The Principles of the Long Game</H3>

            <FadeUp>
              <div style={{ display: "flex", flexDirection: "column", gap: 24, margin: "32px 0" }}>
                {[
                  { icon: "🌳", title: "Write for the Body of Work, Not the Single Book", body: "No single book defines a writer's career. Write the book in front of you as well as you can — then begin the next one. The cumulative effect of a body of work is far greater than any individual title. The author whose fifth book succeeds often sells their first four along with it." },
                  { icon: "💌", title: "Build the Reader Relationship", body: "Your readers are not a market — they are a community. Communicate with them, respond to them, remember that they chose to spend hours of their finite life with your words. This relationship is the most valuable professional asset you will ever build." },
                  { icon: "🔄", title: "Embrace Seasons", body: "There will be seasons of extraordinary output and seasons of silence. Neither is permanent. The silence is not failure — it is often the quiet period of preparation that precedes the next wave. Trust the rhythm. Keep showing up." },
                  { icon: "📘", title: "Never Stop Being a Student", body: "The writers who sustain decades-long careers are uniformly voracious learners. They read in other genres. They study craft books. They attend workshops even when they are the best in the room. Expertise is not a destination; it is a direction of perpetual travel." },
                  { icon: "🎯", title: "Protect the Work Above All", body: "Not every request deserves your time. Not every meeting is worth attending. Not every opinion deserves a response. Learn, with kindness and firmness, to protect the hours in which you write. The work cannot advocate for itself — only you can." },
                ].map(({ icon, title, body }, i) => (
                  <FadeUp key={title} delay={i * 0.08}>
                    <div style={{ display: "flex", gap: 20, padding: "24px", background: "#fff", border: "0.5px solid #e5ddd0", borderLeft: `4px solid ${GOLD}` }}>
                      <span style={{ fontSize: 28, flexShrink: 0, marginTop: 2 }}>{icon}</span>
                      <div>
                        <strong style={{ fontFamily: "'Playfair Display',serif", fontSize: 18, color: NAVY, display: "block", marginBottom: 8 }}>{title}</strong>
                        <p style={{ fontSize: 14, color: "#555", lineHeight: 1.8, fontFamily: "'Lato',sans-serif", margin: 0 }}>{body}</p>
                      </div>
                    </div>
                  </FadeUp>
                ))}
              </div>
            </FadeUp>
          </section>

          {/* ══ CLOSING CTA ══ */}
          <FadeUp>
            <div style={{
              background: NAVY,
              backgroundImage: "radial-gradient(rgba(184,150,62,0.07) 1px, transparent 1px)",
              backgroundSize: "22px 22px",
              padding: "64px 48px", textAlign: "center",
              position: "relative", overflow: "hidden",
              marginTop: 80,
            }}>
              <div style={{ position: "absolute", top: -40, right: -40, width: 160, height: 160, border: "0.5px solid rgba(184,150,62,0.15)", transform: "rotate(45deg)" }} />
              <div style={{ position: "absolute", bottom: -30, left: -30, width: 120, height: 120, border: "0.5px solid rgba(184,150,62,0.1)", transform: "rotate(45deg)" }} />

              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".22em", textTransform: "uppercase", color: GOLD, marginBottom: 20, fontFamily: "'Lato',sans-serif" }}>The Ultimate Transformation</p>

              <h2 className="wm-serif" style={{ fontSize: "clamp(28px,4vw,48px)", fontWeight: 700, color: "#fff", margin: "0 0 24px", lineHeight: 1.1 }}>
                You are not someone who <em style={{ color: GOLDD }}>wants to write</em>.<br />
                You are a writer.
              </h2>

              <p style={{ fontSize: "clamp(14px,1.6vw,17px)", color: "rgba(245,240,232,0.65)", maxWidth: 600, margin: "0 auto 32px", lineHeight: 1.85, fontFamily: "'Lato',sans-serif", fontWeight: 300 }}>
                Every rejection letter, every deleted paragraph, every hour spent staring at a stubborn sentence — this is not evidence that you should quit. It is the necessary fire that burns away the dross, leaving behind the pure gold of a true author. Be constructive. Be gentle with your human limitations, but fierce with your creative ambitions.
              </p>

              <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 12, marginBottom: 40 }}>
                <a href="/upload-document" style={{
                  display: "inline-flex", alignItems: "center", gap: 8,
                  padding: "14px 32px", background: GOLD, color: NAVY,
                  fontFamily: "'Lato',sans-serif", fontSize: 13, fontWeight: 700,
                  letterSpacing: ".08em", textTransform: "uppercase", textDecoration: "none",
                  transition: "background .18s",
                }}
                  onMouseEnter={e => e.currentTarget.style.background = GOLDD}
                  onMouseLeave={e => e.currentTarget.style.background = GOLD}>
                  Upload Your First Document →
                </a>
                <a href="/documents" style={{
                  display: "inline-flex", alignItems: "center", gap: 8,
                  padding: "14px 32px", background: "transparent", color: "rgba(245,240,232,0.7)",
                  fontFamily: "'Lato',sans-serif", fontSize: 13, fontWeight: 700,
                  letterSpacing: ".08em", textTransform: "uppercase", textDecoration: "none",
                  border: "0.5px solid rgba(255,255,255,0.2)", transition: "all .18s",
                }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(184,150,62,0.5)"; e.currentTarget.style.color = GOLDD; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)"; e.currentTarget.style.color = "rgba(245,240,232,0.7)"; }}>
                  Browse the Library
                </a>
              </div>

              <p style={{ fontSize: 13, color: "rgba(245,240,232,0.35)", fontFamily: "'Lato',sans-serif", fontStyle: "italic" }}>
                Write today. Write tomorrow. Trust that every sentence you forge is a stepping stone.
              </p>
            </div>
          </FadeUp>
        </main>

        {/* Footer */}
        <footer style={{
          borderTop: "0.5px solid rgba(13,34,68,0.1)",
          padding: "40px 24px",
          textAlign: "center",
          background: CREAM,
        }}>
          <div style={{ width: 40, height: 1, background: GOLD, margin: "0 auto 16px" }} />
          <p style={{ fontSize: 12, color: "#aaa", fontFamily: "'Lato',sans-serif" }}>
            © {new Date().getFullYear()} LAN Library · Learning Access Network · Author Development Series
          </p>
        </footer>
      </div>
    </div>
  );
}