"use client";
import React, { useState } from "react";
import Link from "next/link";
import {
  Shield, Eye, Keyboard, Volume2, Monitor, Smartphone,
  FileText, BookOpen, ChevronRight, ArrowRight, Mail,
  CheckCircle, Star, ExternalLink, AlertCircle, Users,
  Award, Layers, Globe,
} from "lucide-react";
// import Navbar from "@/components/NavBar";
// import Footer from "@/components/FooterComp";

/* ─── colour tokens (matches HomeClient exactly) ─────────────── */
const NAVY  = "#0d2244";
const GOLD  = "#b8963e";
const GOLDD = "#d4aa5a";
const CREAM = "#f5f0e8";
const BG    = "#f5f1ea";

/* ─── data ───────────────────────────────────────────────────── */
const assistiveTech = [
  { name: "JAWS",       platform: "Windows",  type: "Screen Reader" },
  { name: "NVDA",       platform: "Windows",  type: "Screen Reader" },
  { name: "VoiceOver",  platform: "macOS / iOS", type: "Screen Reader" },
  { name: "TalkBack",   platform: "Android",  type: "Screen Reader" },
  { name: "Keyboard",   platform: "All Platforms", type: "Navigation" },
  { name: "High Contrast", platform: "All Platforms", type: "Visual Aid" },
  { name: "ZoomText",   platform: "Windows",  type: "Magnification" },
  { name: "Dragon",     platform: "Windows / Mac", type: "Voice Control" },
];

const conformanceDocs = [
  {
    icon: Shield,
    title: "Accessibility Policy for LAN Library Contributors",
    description:
      "Our internal policy governing how every contributor must embed accessibility at each stage of product and content development.",
    badge: "Policy",
    link: "#",
  },
  {
    icon: FileText,
    title: "WCAG & EN 301 549 Conformance Reports",
    description:
      "All conformance reports for individual library features are available through the LAN Library Accessibility Report Center.",
    badge: "Conformance",
    link: "#",
  },
  {
    icon: Award,
    title: "Voluntary Product Accessibility Template (VPAT)",
    description:
      "Available on request for institutional partners, procurement teams, and compliance auditors verifying our platform.",
    badge: "VPAT",
    link: "#",
  },
  {
    icon: Globe,
    title: "Screen Reader Support Articles",
    description:
      "Dedicated guidance for screen reader users, covering JAWS, NVDA, VoiceOver, and TalkBack workflows inside LAN Library.",
    badge: "Help Center",
    link: "/help/screen-readers",
  },
];

const principles = [
  {
    icon: Eye,
    title: "Perceivable",
    desc: "All information and UI components are presented in ways users can perceive — text alternatives, captions, and adaptable content.",
  },
  {
    icon: Keyboard,
    title: "Operable",
    desc: "Every function is accessible via keyboard. We avoid interactions that users cannot perform without a mouse or pointer device.",
  },
  {
    icon: Layers,
    title: "Understandable",
    desc: "Content and operation of our interface is predictable and readable, with input assistance to help users avoid and correct mistakes.",
  },
  {
    icon: Monitor,
    title: "Robust",
    desc: "Our platform is built to be compatible with assistive technologies, current and future, across every browser and device.",
  },
];

/* ════════════════════════════════════════════════════════════════
   PAGE COMPONENT
════════════════════════════════════════════════════════════════ */
export default function AccessibilityPage() {
  const [hoveredCard, setHoveredCard] = useState(null);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400&family=Lato:wght@300;400;700&display=swap');

        .lan-root  { font-family: 'Lato', sans-serif; background: ${BG}; }
        .lan-serif { font-family: 'Playfair Display', Georgia, serif; }

        /* hero bg — matches HomeClient hero dot-grid */
        .a11y-hero {
          background-color: ${NAVY};
          background-image:
            radial-gradient(rgba(184,150,62,0.06) 1px, transparent 1px),
            radial-gradient(rgba(255,255,255,0.03) 1px, transparent 1px);
          background-size: 28px 28px, 14px 14px;
          background-position: 0 0, 7px 7px;
        }

        /* cross-hatch used in CTA sections */
        .hatch-bg {
          background-color: ${NAVY};
          background-image:
            repeating-linear-gradient(45deg,  transparent, transparent 12px, rgba(255,255,255,0.018) 12px, rgba(255,255,255,0.018) 13px),
            repeating-linear-gradient(-45deg, transparent, transparent 12px, rgba(255,255,255,0.018) 12px, rgba(255,255,255,0.018) 13px);
        }

        /* card hover pattern from HomeClient */
        .trend-card {
          background: #fff;
          border: 0.5px solid #e5ddd0;
          transition: transform 0.25s cubic-bezier(0.4,0,0.2,1), box-shadow 0.25s, border-color 0.25s;
        }
        .trend-card:hover {
          transform: translateY(-6px);
          box-shadow: 0 20px 48px rgba(13,34,68,0.12);
          border-color: ${GOLD};
        }

        .doc-card {
          border: 0.5px solid #e5ddd0;
          background: ${CREAM};
          transition: transform 0.22s, box-shadow 0.22s, border-color 0.22s;
        }
        .doc-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 32px rgba(13,34,68,0.12);
          border-color: ${GOLD};
        }

        /* gold divider — reused from HomeClient */
        .gold-line { display: flex; align-items: center; gap: 14px; }
        .gold-line::before, .gold-line::after {
          content: ""; flex: 1; height: 1px; background: rgba(184,150,62,0.3);
        }

        /* tech badge */
        .tech-badge {
          display: inline-flex; align-items: center; gap: 6px;
          background: #fff; border: 0.5px solid #e5ddd0;
          padding: 10px 14px;
          transition: border-color 0.2s, transform 0.2s;
        }
        .tech-badge:hover { border-color: ${GOLD}; transform: translateY(-2px); }

        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0);    }
        }
        .anim-up   { animation: slideUp 0.6s cubic-bezier(0.4,0,0.2,1) both; }
        .anim-up-2 { animation: slideUp 0.6s 0.12s cubic-bezier(0.4,0,0.2,1) both; }
        .anim-up-3 { animation: slideUp 0.6s 0.24s cubic-bezier(0.4,0,0.2,1) both; }
        .anim-up-4 { animation: slideUp 0.6s 0.36s cubic-bezier(0.4,0,0.2,1) both; }
      `}</style>

      <div className="lan-root min-h-screen">
        {/* <Navbar /> */}

        {/* ══════════════════════════════════════════════════
            HERO — navy dot-grid (same as HomeClient)
        ══════════════════════════════════════════════════ */}
        <section className="a11y-hero" style={{ padding: "80px 24px 72px", position: "relative", overflow: "hidden" }}>
          {/* gold corner accent — top-left */}
          <div style={{ position: "absolute", top: 0, left: 0, width: 48, height: 48, borderTop: `2px solid rgba(184,150,62,0.35)`, borderLeft: `2px solid rgba(184,150,62,0.35)` }} />
          {/* gold corner accent — bottom-right */}
          <div style={{ position: "absolute", bottom: 0, right: 0, width: 48, height: 48, borderBottom: `2px solid rgba(184,150,62,0.35)`, borderRight: `2px solid rgba(184,150,62,0.35)` }} />

          <div style={{ maxWidth: 1100, margin: "0 auto" }}>
            {/* breadcrumb */}
            <div className="anim-up" style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 28 }}>
              <Link href="/" style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(184,150,62,0.6)", textDecoration: "none" }}>
                LAN Library
              </Link>
              <ChevronRight size={11} style={{ color: "rgba(184,150,62,0.4)" }} />
              <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(184,150,62,0.9)" }}>
                Accessibility
              </span>
            </div>

            <div style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-start", gap: 48 }}>
              {/* LEFT — headline */}
              <div style={{ flex: "1 1 460px" }}>
                {/* eyebrow badge — matches HomeClient "Africa's #1" badge */}
                <div className="anim-up" style={{
                  display: "inline-flex", alignItems: "center", gap: 8,
                  background: "rgba(184,150,62,0.14)", border: "1px solid rgba(184,150,62,0.3)",
                  borderRadius: "999px", padding: "7px 16px", marginBottom: 28,
                }}>
                  <Shield size={13} style={{ color: GOLD }} />
                  <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: GOLDD }}>
                    Accessibility Statement
                  </span>
                </div>

                <h1 className="lan-serif anim-up-2" style={{
                  fontSize: "clamp(36px,6vw,68px)", fontWeight: 900,
                  color: "#fff", lineHeight: 1.05, letterSpacing: "-1px", margin: "0 0 20px",
                }}>
                  Built for{" "}
                  <span style={{ color: GOLD, fontStyle: "italic" }}>every</span>
                  <br />student on the network.
                </h1>

                <p className="anim-up-3" style={{
                  fontSize: 17, color: "rgba(245,240,232,0.72)",
                  maxWidth: 560, lineHeight: 1.8, margin: "0 0 32px", fontWeight: 300,
                }}>
                  LAN Library is a place where every student and seller within the local network
                  can find academic opportunity. Whatever your goals, research ideas, or study
                  abilities — we're here to help you succeed.
                </p>

                {/* WCAG badge strip */}
                <div className="anim-up-4" style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {["WCAG 2.2 Level AA", "EN 301 549", "W3C Compliant", "Screen Reader Tested"].map(b => (
                    <span key={b} style={{
                      background: "rgba(184,150,62,0.14)", border: "0.5px solid rgba(184,150,62,0.35)",
                      color: GOLDD, fontSize: 9, fontWeight: 700, letterSpacing: "0.1em",
                      textTransform: "uppercase", padding: "5px 11px", fontFamily: "'Lato',sans-serif",
                    }}>
                      {b}
                    </span>
                  ))}
                </div>
              </div>

              {/* RIGHT — framed stat panel (mirrors HomeClient's framed portrait) */}
              <div className="anim-up-3" style={{ flex: "0 0 auto", display: "flex", flexDirection: "column", gap: 2 }}>
                <div style={{
                  border: `1px solid rgba(184,150,62,0.3)`,
                  boxShadow: "0 24px 64px rgba(0,0,0,0.4)",
                  overflow: "hidden", minWidth: 240,
                }}>
                  {/* top gold label */}
                  <div style={{ background: GOLD, padding: "8px 20px" }}>
                    <p style={{ margin: 0, fontSize: 9, fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", color: NAVY, fontFamily: "'Lato',sans-serif" }}>
                      Our Commitment
                    </p>
                  </div>

                  {[
                    { val: "WCAG 2.2", sub: "Standard Adopted" },
                    { val: "Level AA",  sub: "Conformance Target" },
                    { val: "8 Tools",   sub: "Assistive Tech Tested" },
                    { val: "Ongoing",   sub: "3rd-Party Audits" },
                  ].map(({ val, sub }, i) => (
                    <div key={i} style={{
                      padding: "18px 20px",
                      borderBottom: i < 3 ? "0.5px solid rgba(184,150,62,0.12)" : "none",
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                    }}>
                      <span className="lan-serif" style={{ fontSize: 20, fontWeight: 700, color: "#fff" }}>{val}</span>
                      <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(184,150,62,0.6)", fontFamily: "'Lato',sans-serif", textAlign: "right", maxWidth: 110 }}>{sub}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════
            FOUR WCAG PRINCIPLES
        ══════════════════════════════════════════════════ */}
        <section style={{ background: "#fff", borderTop: "0.5px solid #e5ddd0", padding: "72px 24px" }}>
          <div style={{ maxWidth: 1100, margin: "0 auto" }}>
            <div style={{ textAlign: "center", marginBottom: 48 }}>
              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", color: GOLD, marginBottom: 8, fontFamily: "'Lato',sans-serif" }}>
                Our Design Foundation
              </p>
              <h2 className="lan-serif" style={{ fontSize: "clamp(28px,4vw,44px)", fontWeight: 700, color: NAVY, margin: "0 0 14px" }}>
                The Four Pillars of Accessibility
              </h2>
              <div className="gold-line" style={{ maxWidth: 280, margin: "0 auto 14px" }}>
                <div style={{ width: 8, height: 8, background: GOLD, transform: "rotate(45deg)", flexShrink: 0 }} />
              </div>
              <p style={{ fontSize: 14, color: "#888", maxWidth: 500, margin: "0 auto", lineHeight: 1.75, fontWeight: 300 }}>
                Guided by the W3C's POUR framework — every product decision we make runs through these four principles.
              </p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 16 }}>
              {principles.map((p, i) => {
                const Icon = p.icon;
                return (
                  <div key={i} className="trend-card" style={{ padding: "28px 24px" }}>
                    {/* icon in diamond — matches HomeClient's diamond GraduationCap */}
                    <div style={{
                      width: 52, height: 52, border: `1.5px solid ${NAVY}`,
                      transform: "rotate(45deg)", display: "flex",
                      alignItems: "center", justifyContent: "center", marginBottom: 20,
                    }}>
                      <Icon size={20} style={{ color: NAVY, transform: "rotate(-45deg)" }} />
                    </div>

                    <h3 className="lan-serif" style={{ fontSize: 18, fontWeight: 700, color: NAVY, margin: "0 0 10px" }}>{p.title}</h3>
                    <p style={{ fontSize: 13, color: "#666", lineHeight: 1.7, margin: "0 0 20px", fontWeight: 300 }}>{p.desc}</p>

                    <div style={{ borderTop: "0.5px solid #f0ebe0", paddingTop: 14, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: GOLD, fontFamily: "'Lato',sans-serif" }}>
                        WCAG Principle {i + 1}
                      </span>
                      <span style={{ fontSize: 9, fontWeight: 700, color: "#ccc", fontFamily: "'Lato',sans-serif" }}>
                        {["1.x", "2.x", "3.x", "4.x"][i]}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════
            OUR SUPPORT HUB — cream bg like HomeClient browse
        ══════════════════════════════════════════════════ */}
        <section style={{ background: CREAM, padding: "72px 24px", borderTop: "0.5px solid #e5ddd0" }}>
          <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", flexWrap: "wrap", gap: 48, alignItems: "flex-start" }}>
            {/* LEFT — text */}
            <div style={{ flex: "1 1 380px" }}>
              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", color: GOLD, marginBottom: 8, fontFamily: "'Lato',sans-serif" }}>
                We're Here to Help
              </p>
              <h2 className="lan-serif" style={{ fontSize: "clamp(28px,4vw,42px)", fontWeight: 700, color: NAVY, margin: "0 0 16px" }}>
                Our Support Hub
              </h2>
              <p style={{ fontSize: 15, color: "#666", lineHeight: 1.8, marginBottom: 16, fontWeight: 300 }}>
                Our team is constantly working to improve the experience across all LAN Library products —
                adding new features and making changes to better serve all our students and sellers.
                We're always open to feedback.
              </p>
              <p style={{ fontSize: 15, color: "#666", lineHeight: 1.8, marginBottom: 28, fontWeight: 300 }}>
                If you find an accessibility bug, want to submit a complaint, or have trouble using
                LAN Library products with assistive technology, contact our support team and we'll
                reach out personally to help you through it.
              </p>

              {/* contact card */}
              <div style={{
                background: "#fff", border: `0.5px solid #e5ddd0`,
                borderLeft: `3px solid ${GOLD}`,
                padding: "20px 22px",
              }}>
                <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: GOLD, margin: "0 0 8px", fontFamily: "'Lato',sans-serif" }}>
                  Contact the Team
                </p>
                <p style={{ fontSize: 13, color: "#777", margin: "0 0 14px", lineHeight: 1.65 }}>
                  Reach us directly for any accessibility-related concern, complaint, or feedback.
                </p>
                <a
                  href="mailto:accessibility@lanlibrary.local"
                  style={{
                    display: "inline-flex", alignItems: "center", gap: 8,
                    padding: "11px 22px", background: NAVY, color: "#fff",
                    fontSize: 12, fontWeight: 700, letterSpacing: "0.06em",
                    textDecoration: "none", fontFamily: "'Lato',sans-serif",
                    transition: "background 0.18s",
                  }}
                >
                  <Mail size={13} /> Email Support
                </a>
              </div>
            </div>

            {/* RIGHT — quick links */}
            <div style={{ flex: "1 1 320px", display: "flex", flexDirection: "column", gap: 12 }}>
              {[
                {
                  icon: BookOpen, title: "Screen Reader Help Center",
                  desc: "Step-by-step articles for JAWS, NVDA, VoiceOver, and TalkBack users navigating LAN Library.",
                  link: "/help/screen-readers", cta: "Visit Help Center",
                },
                {
                  icon: AlertCircle, title: "Report an Accessibility Bug",
                  desc: "Found something that doesn't work with your assistive technology? Let us know and we'll prioritise a fix.",
                  link: "/support/bug-report", cta: "Submit a Report",
                },
                {
                  icon: Users, title: "Institutional Accessibility",
                  desc: "Universities and institutions requiring VPAT documentation or formal compliance review can request materials here.",
                  link: "/support/institutional", cta: "Learn More",
                },
              ].map((item, i) => {
                const Icon = item.icon;
                return (
                  <a
                    key={i} href={item.link}
                    className="doc-card"
                    style={{ textDecoration: "none", display: "block", padding: "20px 22px" }}
                  >
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
                      {/* icon badge */}
                      <div style={{
                        width: 36, height: 36, background: NAVY,
                        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                      }}>
                        <Icon size={16} style={{ color: GOLD }} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <h4 className="lan-serif" style={{ fontSize: 14, fontWeight: 700, color: NAVY, margin: "0 0 6px" }}>{item.title}</h4>
                        <p style={{ fontSize: 12, color: "#777", margin: "0 0 12px", lineHeight: 1.65, fontWeight: 300 }}>{item.desc}</p>
                        <div style={{ display: "flex", alignItems: "center", gap: 4, borderTop: "0.5px solid #f0ebe0", paddingTop: 10 }}>
                          <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: GOLD, fontFamily: "'Lato',sans-serif" }}>{item.cta}</span>
                          <ArrowRight size={10} style={{ color: GOLD }} />
                        </div>
                      </div>
                    </div>
                  </a>
                );
              })}
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════
            ASSISTIVE TECHNOLOGY — white section
        ══════════════════════════════════════════════════ */}
        <section style={{ background: "#fff", padding: "72px 24px", borderTop: "0.5px solid #e5ddd0" }}>
          <div style={{ maxWidth: 1100, margin: "0 auto" }}>
            <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 36, flexWrap: "wrap", gap: 12 }}>
              <div>
                <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", color: GOLD, marginBottom: 8, fontFamily: "'Lato',sans-serif" }}>
                  Tested Technologies
                </p>
                <h2 className="lan-serif" style={{ fontSize: "clamp(26px,4vw,40px)", fontWeight: 700, color: NAVY, margin: 0 }}>
                  Assistive Technology Support
                </h2>
                <p style={{ fontSize: 13, color: "#888", margin: "8px 0 0", fontWeight: 300, fontFamily: "'Lato',sans-serif" }}>
                  We continually audit our products using the following assistive technologies — internally and via third-party review.
                </p>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 12 }}>
              {assistiveTech.map((t, i) => (
                <div key={i} className="tech-badge">
                  {/* green dot — mirrors the PDF green dot in HomeClient book cards */}
                  <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#22c55e", display: "inline-block", flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 13, fontWeight: 700, color: NAVY, margin: 0, fontFamily: "'Lato',sans-serif" }}>{t.name}</p>
                    <p style={{ fontSize: 10, color: "#bbb", margin: 0, fontFamily: "'Lato',sans-serif" }}>{t.platform}</p>
                  </div>
                  <span style={{
                    background: CREAM, border: `0.5px solid rgba(184,150,62,0.3)`,
                    color: GOLD, fontSize: 8, fontWeight: 700, letterSpacing: "0.08em",
                    textTransform: "uppercase", padding: "3px 7px", fontFamily: "'Lato',sans-serif",
                    flexShrink: 0,
                  }}>
                    {t.type}
                  </span>
                </div>
              ))}
            </div>

            {/* bottom note */}
            <div style={{ marginTop: 24, background: NAVY, backgroundImage: "radial-gradient(rgba(184,150,62,0.06) 1px,transparent 1px)", backgroundSize: "22px 22px", padding: "20px 28px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 14 }}>
              <div>
                <p style={{ fontSize: 12, fontWeight: 700, color: "#fff", fontFamily: "'Lato',sans-serif", margin: "0 0 3px" }}>
                  Don't see your assistive technology listed?
                </p>
                <p style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", fontFamily: "'Lato',sans-serif", margin: 0 }}>
                  Contact us — we're expanding our testing coverage every quarter.
                </p>
              </div>
              <a
                href="mailto:accessibility@lanlibrary.local"
                style={{
                  display: "inline-flex", alignItems: "center", gap: 7,
                  padding: "10px 20px", background: GOLD, color: NAVY,
                  fontSize: 11, fontWeight: 700, letterSpacing: "0.08em",
                  textTransform: "uppercase", textDecoration: "none",
                  fontFamily: "'Lato',sans-serif", whiteSpace: "nowrap",
                }}
              >
                Contact Us <ArrowRight size={12} />
              </a>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════
            POLICIES & CONFORMANCE — cream
        ══════════════════════════════════════════════════ */}
        <section style={{ background: CREAM, padding: "72px 24px", borderTop: "0.5px solid #e5ddd0" }}>
          <div style={{ maxWidth: 1100, margin: "0 auto" }}>
            <div style={{ textAlign: "center", marginBottom: 48 }}>
              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", color: GOLD, marginBottom: 8, fontFamily: "'Lato',sans-serif" }}>
                Want Even More Info?
              </p>
              <h2 className="lan-serif" style={{ fontSize: "clamp(28px,4vw,44px)", fontWeight: 700, color: NAVY, margin: "0 0 14px" }}>
                Policies & Conformance Documentation
              </h2>
              <div className="gold-line" style={{ maxWidth: 260, margin: "0 auto 14px" }}>
                <div style={{ width: 8, height: 8, background: GOLD, transform: "rotate(45deg)", flexShrink: 0 }} />
              </div>
              <p style={{ fontSize: 14, color: "#888", maxWidth: 500, margin: "0 auto", lineHeight: 1.75, fontWeight: 300 }}>
                Formal documentation explaining our commitment and the current accessibility state of every LAN Library product.
              </p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 16 }}>
              {conformanceDocs.map((d, i) => {
                const Icon = d.icon;
                return (
                  <a
                    key={i} href={d.link}
                    className="trend-card"
                    style={{ textDecoration: "none", display: "flex", flexDirection: "column", padding: "24px" }}
                  >
                    {/* top row */}
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 16 }}>
                      <div style={{ width: 44, height: 44, border: `1.5px solid ${NAVY}`, transform: "rotate(45deg)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Icon size={18} style={{ color: NAVY, transform: "rotate(-45deg)" }} />
                      </div>
                      <span style={{
                        background: NAVY, color: GOLD, fontSize: 8, fontWeight: 700,
                        letterSpacing: "0.12em", textTransform: "uppercase",
                        padding: "4px 10px", fontFamily: "'Lato',sans-serif",
                      }}>
                        {d.badge}
                      </span>
                    </div>

                    <h3 className="lan-serif" style={{ fontSize: 15, fontWeight: 700, color: NAVY, margin: "0 0 10px", lineHeight: 1.35 }}>{d.title}</h3>
                    <p style={{ fontSize: 13, color: "#666", lineHeight: 1.7, margin: "0 0 20px", fontWeight: 300, flex: 1 }}>{d.description}</p>

                    <div style={{ borderTop: "0.5px solid #f0ebe0", paddingTop: 14, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: GOLD, fontFamily: "'Lato',sans-serif" }}>
                        View Document
                      </span>
                      <div style={{ width: 26, height: 26, border: "0.5px solid #e5ddd0", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <ExternalLink size={11} style={{ color: NAVY }} />
                      </div>
                    </div>
                  </a>
                );
              })}
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════
            CTA BANNER — matches HomeClient "Ready to Excel"
        ══════════════════════════════════════════════════ */}
        <section className="hatch-bg" style={{ padding: "80px 24px", textAlign: "center" }}>
          {/* gold star divider — exact HomeClient pattern */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 16, marginBottom: 28 }}>
            <div style={{ height: 1, width: 60, background: "rgba(184,150,62,0.4)" }} />
            <Star size={14} style={{ color: GOLD, fill: GOLD }} />
            <div style={{ height: 1, width: 60, background: "rgba(184,150,62,0.4)" }} />
          </div>

          <h2 className="lan-serif" style={{ fontSize: "clamp(28px,5vw,52px)", fontWeight: 700, color: "#fff", margin: "0 0 16px" }}>
            Accessibility is everyone's{" "}
            <span style={{ color: GOLD, fontStyle: "italic" }}>responsibility.</span>
          </h2>
          <p style={{ fontSize: 15, color: "rgba(255,255,255,0.5)", maxWidth: 520, margin: "0 auto 40px", lineHeight: 1.75, fontWeight: 300 }}>
            We are committed to building a platform where every student, regardless of ability or
            device, can fully participate in academic life across Africa.
          </p>

          <div style={{ display: "flex", flexWrap: "wrap", gap: 14, justifyContent: "center" }}>
            <a
              href="mailto:accessibility@lanlibrary.local"
              style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                padding: "14px 28px", background: GOLD, color: NAVY,
                fontSize: 13, fontWeight: 700, textDecoration: "none",
                fontFamily: "'Lato',sans-serif", letterSpacing: "0.04em",
              }}
            >
              <Mail size={14} /> Contact Support
            </a>
            <Link
              href="/help/screen-readers"
              style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                padding: "14px 28px", border: "0.5px solid rgba(255,255,255,0.2)",
                color: CREAM, fontSize: 13, fontWeight: 700, textDecoration: "none",
                fontFamily: "'Lato',sans-serif", letterSpacing: "0.04em",
              }}
            >
              <BookOpen size={14} /> Screen Reader Guide
            </Link>
          </div>

          {/* bottom update note */}
          <p style={{ fontSize: 10, color: "rgba(184,150,62,0.45)", margin: "36px 0 0", letterSpacing: "0.14em", textTransform: "uppercase", fontFamily: "'Lato',sans-serif" }}>
            Last reviewed: January 2025 · LAN Library Accessibility Team
          </p>
        </section>

        {/* <Footer /> */}
      </div>
    </>
  );
}