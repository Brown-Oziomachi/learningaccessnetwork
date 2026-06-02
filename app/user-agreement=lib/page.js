"use client";
import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  FileText, Shield, Users, CreditCard, Bell, Share2,
  BookOpen, AlertTriangle, Scale, Phone, ChevronRight,
  Star, ArrowRight, CheckCircle, XCircle, Menu, X,
  ExternalLink, Gavel, Globe, Lock, Eye,
} from "lucide-react";
// import Navbar from "@/components/NavBar";
// import Footer from "@/components/FooterComp";

/* ─── colour tokens (exact match to HomeClient) ──────────────── */
const NAVY  = "#0d2244";
const GOLD  = "#b8963e";
const GOLDD = "#d4aa5a";
const CREAM = "#f5f0e8";
const BG    = "#f5f1ea";

/* ─── table of contents ──────────────────────────────────────── */
const TOC = [
  { id: "introduction",    label: "1. Introduction",               icon: FileText  },
  { id: "obligations",     label: "2. Obligations",                icon: Shield    },
  { id: "rights",          label: "3. Rights & Limits",            icon: BookOpen  },
  { id: "disclaimer",      label: "4. Disclaimer & Liability",     icon: AlertTriangle },
  { id: "termination",     label: "5. Termination",                icon: XCircle   },
  { id: "governing",       label: "6. Governing Law",              icon: Scale     },
  { id: "general",         label: "7. General Terms",              icon: Gavel     },
  { id: "dos-donts",       label: "8. Dos & Don'ts",               icon: CheckCircle },
  { id: "complaints",      label: "9. Complaints",                 icon: Bell      },
  { id: "contact",         label: "10. Contact Us",                icon: Phone     },
];

/* ════════════════════════════════════════════════════════════════
   SUB-COMPONENTS
════════════════════════════════════════════════════════════════ */

/* ── Section wrapper ── */
function Section({ id, icon: Icon, number, title, children }) {
  return (
    <section id={id} style={{ marginBottom: 56, scrollMarginTop: 100 }}>
      {/* section header */}
      <div style={{
        display: "flex", alignItems: "center", gap: 14,
        borderBottom: `0.5px solid #e5ddd0`, paddingBottom: 16, marginBottom: 28,
      }}>
        <div style={{
          width: 42, height: 42, border: `1.5px solid ${NAVY}`,
          transform: "rotate(45deg)", display: "flex",
          alignItems: "center", justifyContent: "center", flexShrink: 0,
        }}>
          <Icon size={17} style={{ color: NAVY, transform: "rotate(-45deg)" }} />
        </div>
        <div>
          <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: GOLD, margin: "0 0 2px", fontFamily: "'Lato',sans-serif" }}>
            Section {number}
          </p>
          <h2 style={{ fontFamily: "'Playfair Display',Georgia,serif", fontSize: "clamp(20px,3vw,28px)", fontWeight: 700, color: NAVY, margin: 0 }}>
            {title}
          </h2>
        </div>
      </div>
      {children}
    </section>
  );
}

/* ── Sub-section ── */
function Sub({ number, title, children }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 10 }}>
        <span style={{
          background: NAVY, color: GOLD, fontSize: 9, fontWeight: 700,
          letterSpacing: "0.1em", padding: "3px 9px", fontFamily: "'Lato',sans-serif",
          flexShrink: 0,
        }}>
          {number}
        </span>
        <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: 17, fontWeight: 700, color: NAVY, margin: 0 }}>
          {title}
        </h3>
      </div>
      {children}
    </div>
  );
}

/* ── Body paragraph ── */
function P({ children, style }) {
  return (
    <p style={{ fontSize: 14, color: "#555", lineHeight: 1.85, margin: "0 0 14px", fontWeight: 300, fontFamily: "'Lato',sans-serif", ...style }}>
      {children}
    </p>
  );
}

/* ── Highlight callout ── */
function Note({ children, type = "info" }) {
  const colours = {
    info:    { bg: "rgba(184,150,62,0.07)", border: GOLD,      text: "#7a6428" },
    warning: { bg: "rgba(220,80,40,0.06)",  border: "#c0392b", text: "#9b2d22" },
    law:     { bg: "rgba(13,34,68,0.06)",   border: NAVY,      text: NAVY      },
  };
  const c = colours[type];
  return (
    <div style={{
      background: c.bg, borderLeft: `3px solid ${c.border}`,
      padding: "14px 18px", marginBottom: 18,
    }}>
      <p style={{ fontSize: 13, color: c.text, margin: 0, lineHeight: 1.75, fontFamily: "'Lato',sans-serif", fontWeight: 400 }}>
        {children}
      </p>
    </div>
  );
}

/* ── List ── */
function Ul({ items }) {
  return (
    <ul style={{ margin: "0 0 18px 0", paddingLeft: 0, listStyle: "none" }}>
      {items.map((item, i) => (
        <li key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 10 }}>
          <span style={{ width: 6, height: 6, background: GOLD, transform: "rotate(45deg)", flexShrink: 0, marginTop: 7 }} />
          <span style={{ fontSize: 14, color: "#555", lineHeight: 1.75, fontWeight: 300, fontFamily: "'Lato',sans-serif" }}>{item}</span>
        </li>
      ))}
    </ul>
  );
}

/* ── Caps block (legal disclaimer boxes) ── */
function LegalBlock({ children }) {
  return (
    <div style={{
      background: "rgba(13,34,68,0.04)", border: `0.5px solid rgba(13,34,68,0.15)`,
      padding: "20px 22px", marginBottom: 18,
    }}>
      <p style={{ fontSize: 12, color: "#444", lineHeight: 1.9, margin: 0, fontFamily: "'Lato',sans-serif", fontWeight: 500, letterSpacing: "0.01em" }}>
        {children}
      </p>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   PAGE COMPONENT
════════════════════════════════════════════════════════════════ */
export default function UserAgreementPage() {
  const [activeSection, setActiveSection] = useState("introduction");
  const [tocOpen, setTocOpen] = useState(false);
  const mainRef = useRef(null);

  /* track active section on scroll */
  useEffect(() => {
    const handler = () => {
      for (let i = TOC.length - 1; i >= 0; i--) {
        const el = document.getElementById(TOC[i].id);
        if (el && el.getBoundingClientRect().top <= 120) {
          setActiveSection(TOC[i].id);
          return;
        }
      }
      setActiveSection("introduction");
    };
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    setTocOpen(false);
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400&family=Lato:wght@300;400;700&display=swap');
        .lan-root  { font-family: 'Lato', sans-serif; background: ${BG}; }
        .lan-serif { font-family: 'Playfair Display', Georgia, serif; }

        .ua-hero {
          background-color: ${NAVY};
          background-image:
            radial-gradient(rgba(184,150,62,0.06) 1px, transparent 1px),
            radial-gradient(rgba(255,255,255,0.03) 1px, transparent 1px);
          background-size: 28px 28px, 14px 14px;
          background-position: 0 0, 7px 7px;
        }

        .hatch-bg {
          background-color: ${NAVY};
          background-image:
            repeating-linear-gradient(45deg,  transparent, transparent 12px, rgba(255,255,255,0.018) 12px, rgba(255,255,255,0.018) 13px),
            repeating-linear-gradient(-45deg, transparent, transparent 12px, rgba(255,255,255,0.018) 12px, rgba(255,255,255,0.018) 13px);
        }

        .toc-item {
          display: flex; align-items: center; gap: 10px;
          padding: 9px 14px; cursor: pointer; border: none;
          background: transparent; text-align: left; width: 100%;
          font-family: 'Lato', sans-serif; font-size: 12px; font-weight: 700;
          color: #777; letter-spacing: 0.03em;
          border-left: 2px solid transparent;
          transition: color 0.18s, border-color 0.18s, background 0.18s;
        }
        .toc-item:hover { color: ${NAVY}; background: rgba(13,34,68,0.04); }
        .toc-item.active { color: ${NAVY}; border-left-color: ${GOLD}; background: rgba(184,150,62,0.07); }

        .trend-card {
          background: #fff; border: 0.5px solid #e5ddd0;
          transition: transform 0.25s cubic-bezier(0.4,0,0.2,1), box-shadow 0.25s, border-color 0.25s;
        }
        .trend-card:hover { transform: translateY(-4px); box-shadow: 0 16px 40px rgba(13,34,68,0.1); border-color: ${GOLD}; }

        .gold-line { display: flex; align-items: center; gap: 14px; }
        .gold-line::before, .gold-line::after { content: ""; flex: 1; height: 1px; background: rgba(184,150,62,0.3); }

        @keyframes slideUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
        .anim-up   { animation: slideUp 0.6s cubic-bezier(0.4,0,0.2,1) both; }
        .anim-up-2 { animation: slideUp 0.6s 0.12s cubic-bezier(0.4,0,0.2,1) both; }
        .anim-up-3 { animation: slideUp 0.6s 0.24s cubic-bezier(0.4,0,0.2,1) both; }

        /* sticky sidebar */
        .ua-sidebar {
          position: sticky; top: 80px; align-self: flex-start;
          width: 260px; flex-shrink: 0;
        }
        @media (max-width: 900px) { .ua-sidebar { display: none; } }
        .ua-mob-toc { display: none; }
        @media (max-width: 900px) { .ua-mob-toc { display: block; } }
      `}</style>

      <div className="lan-root min-h-screen">
        {/* <Navbar /> */}

        {/* ════════════════════════════════════════════════
            HERO
        ════════════════════════════════════════════════ */}
        <section className="ua-hero" style={{ padding: "80px 24px 64px", position: "relative", overflow: "hidden" }}>
          {/* corner accents */}
          <div style={{ position: "absolute", top: 0, left: 0, width: 48, height: 48, borderTop: `2px solid rgba(184,150,62,0.35)`, borderLeft: `2px solid rgba(184,150,62,0.35)` }} />
          <div style={{ position: "absolute", bottom: 0, right: 0, width: 48, height: 48, borderBottom: `2px solid rgba(184,150,62,0.35)`, borderRight: `2px solid rgba(184,150,62,0.35)` }} />

          <div style={{ maxWidth: 1100, margin: "0 auto" }}>
            {/* breadcrumb */}
            <div className="anim-up" style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 28 }}>
              <Link href="/" style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(184,150,62,0.6)", textDecoration: "none" }}>LAN Library</Link>
              <ChevronRight size={11} style={{ color: "rgba(184,150,62,0.4)" }} />
              <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(184,150,62,0.9)" }}>User Agreement</span>
            </div>

            <div style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-start", gap: 48 }}>
              {/* LEFT */}
              <div style={{ flex: "1 1 460px" }}>
                <div className="anim-up" style={{
                  display: "inline-flex", alignItems: "center", gap: 8,
                  background: "rgba(184,150,62,0.14)", border: "1px solid rgba(184,150,62,0.3)",
                  borderRadius: "999px", padding: "7px 16px", marginBottom: 28,
                }}>
                  <Scale size={13} style={{ color: GOLD }} />
                  <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: GOLDD }}>Legal Agreement</span>
                </div>

                <h1 className="lan-serif anim-up-2" style={{ fontSize: "clamp(36px,6vw,68px)", fontWeight: 900, color: "#fff", lineHeight: 1.05, letterSpacing: "-1px", margin: "0 0 20px" }}>
                  User{" "}
                  <span style={{ color: GOLD, fontStyle: "italic" }}>Agreement</span>
                </h1>
                <p className="anim-up-3" style={{ fontSize: 16, color: "rgba(245,240,232,0.65)", maxWidth: 560, lineHeight: 1.85, margin: "0 0 32px", fontWeight: 300 }}>
                  Our mission is to connect students and educators across Africa's continent,
                  enabling academic opportunity, knowledge exchange, and educational success for every member of our community.
                </p>

                <div className="anim-up-3" style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {["Effective: November 3, 2025", "v2.1", "Applies to All Members"].map(b => (
                    <span key={b} style={{
                      background: "rgba(184,150,62,0.14)", border: "0.5px solid rgba(184,150,62,0.35)",
                      color: GOLDD, fontSize: 9, fontWeight: 700, letterSpacing: "0.1em",
                      textTransform: "uppercase", padding: "5px 11px", fontFamily: "'Lato',sans-serif",
                    }}>{b}</span>
                  ))}
                </div>
              </div>

              {/* RIGHT — framed TOC preview panel */}
              <div className="anim-up-3" style={{ flex: "0 0 auto" }}>
                <div style={{ border: `1px solid rgba(184,150,62,0.3)`, boxShadow: "0 24px 64px rgba(0,0,0,0.4)", overflow: "hidden", minWidth: 230 }}>
                  <div style={{ background: GOLD, padding: "8px 20px" }}>
                    <p style={{ margin: 0, fontSize: 9, fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", color: NAVY, fontFamily: "'Lato',sans-serif" }}>
                      Table of Contents
                    </p>
                  </div>
                  {TOC.map(({ id, label, icon: Icon }) => (
                    <button key={id} onClick={() => scrollTo(id)} style={{
                      display: "flex", alignItems: "center", gap: 10,
                      width: "100%", background: "none", border: "none",
                      borderBottom: "0.5px solid rgba(184,150,62,0.1)",
                      padding: "10px 16px", cursor: "pointer", textAlign: "left",
                      transition: "background 0.15s",
                    }}
                      onMouseEnter={e => e.currentTarget.style.background = "rgba(184,150,62,0.1)"}
                      onMouseLeave={e => e.currentTarget.style.background = "none"}
                    >
                      <Icon size={11} style={{ color: GOLD, flexShrink: 0 }} />
                      <span style={{ fontSize: 11, fontWeight: 700, color: "rgba(245,240,232,0.75)", fontFamily: "'Lato',sans-serif", letterSpacing: "0.02em" }}>{label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════════════
            MOBILE TOC TOGGLE
        ════════════════════════════════════════════════ */}
        <div className="ua-mob-toc" style={{ background: "#fff", borderBottom: "0.5px solid #e5ddd0", padding: "12px 24px", position: "sticky", top: 0, zIndex: 50 }}>
          <button
            onClick={() => setTocOpen(o => !o)}
            style={{ display: "flex", alignItems: "center", gap: 8, background: "none", border: `0.5px solid #e5ddd0`, padding: "9px 16px", cursor: "pointer", fontFamily: "'Lato',sans-serif", fontSize: 12, fontWeight: 700, color: NAVY }}
          >
            {tocOpen ? <X size={14} /> : <Menu size={14} />}
            Table of Contents
          </button>
          {tocOpen && (
            <div style={{ background: "#fff", border: "0.5px solid #e5ddd0", marginTop: 8 }}>
              {TOC.map(({ id, label, icon: Icon }) => (
                <button key={id} className={`toc-item${activeSection === id ? " active" : ""}`} onClick={() => scrollTo(id)}>
                  <Icon size={12} />
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ════════════════════════════════════════════════
            BODY — sidebar + content
        ════════════════════════════════════════════════ */}
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "56px 24px 80px", display: "flex", gap: 48, alignItems: "flex-start" }}>

          {/* ── STICKY SIDEBAR ── */}
          <aside className="ua-sidebar">
            <div style={{ background: "#fff", border: "0.5px solid #e5ddd0" }}>
              <div style={{ background: NAVY, backgroundImage: "radial-gradient(rgba(184,150,62,0.06) 1px,transparent 1px)", backgroundSize: "18px 18px", padding: "14px 16px" }}>
                <p style={{ margin: 0, fontSize: 9, fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", color: GOLD, fontFamily: "'Lato',sans-serif" }}>
                  Jump to Section
                </p>
              </div>
              {TOC.map(({ id, label, icon: Icon }) => (
                <button key={id} className={`toc-item${activeSection === id ? " active" : ""}`} onClick={() => scrollTo(id)}>
                  <Icon size={12} style={{ flexShrink: 0 }} />
                  {label}
                </button>
              ))}
            </div>

            {/* last reviewed box */}
            <div style={{ background: CREAM, border: "0.5px solid #e5ddd0", borderLeft: `3px solid ${GOLD}`, padding: "14px 16px", marginTop: 12 }}>
              <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: GOLD, margin: "0 0 5px", fontFamily: "'Lato',sans-serif" }}>Last Reviewed</p>
              <p style={{ fontSize: 12, color: NAVY, margin: 0, fontFamily: "'Lato',sans-serif", fontWeight: 700 }}>November 3, 2025</p>
              <p style={{ fontSize: 11, color: "#aaa", margin: "4px 0 0", fontFamily: "'Lato',sans-serif" }}>LAN Library Legal Team</p>
            </div>
          </aside>

          {/* ── MAIN CONTENT ── */}
          <main ref={mainRef} style={{ flex: 1, minWidth: 0 }}>

            {/* ─── 1. INTRODUCTION ─── */}
            <Section id="introduction" icon={FileText} number="1" title="Introduction">
              <Sub number="1.1" title="Contract">
                <P>When you use our Services you agree to all of these terms. Your use of our Services is also subject to our <strong>Cookie Policy</strong> and our <a href="/lan/privacy-policy" className="underline">Privacy Policy,</a> which covers how we collect, use, share, and store your personal information.</P>
                <P>By creating a LAN Library account or accessing or using our Services (described below), you are agreeing to enter into a legally binding contract with LAN Library — even if you are using third-party credentials or accessing the platform on behalf of an institution. If you do not agree to this contract ("Contract" or "User Agreement"), do not create an account or access or otherwise use any of our Services.</P>
                <Note type="info">If you wish to terminate this Contract at any time, you can do so by closing your account and no longer accessing or using our Services.</Note>
                <P>As a Visitor or Member of our Services, the collection, use, and sharing of your personal data is subject to our <a href="/lan/privacy-policy" className="underline">Privacy Policy,</a> our Cookie Policy and other documents referenced therein. You acknowledge that you have read our Privacy Policy.</P>
              </Sub>

              <Sub number="1.2" title="Services">
                <P>This Contract applies to the LAN Library platform, LAN Library-branded apps, and all related sites, apps, communications, and other services that state they are offered under this Contract ("Services"), including the offline collection of data for those Services, such as through our promotional tools and the "Access with LAN" integrations.</P>
              </Sub>

              <Sub number="1.3" title="LAN Library and Key Terms">
                <P>You are entering into this Contract with <strong>LAN Library</strong> (also referred to as "we" and "us").</P>
                <Ul items={[
                  "Affiliates: Companies controlling, controlled by or under common control with LAN Library, including partner institutions and technology providers.",
                  "Social Action: Actions that Members take on our services such as likes, comments, follows, and sharing of academic content.",
                  "Content: Feed posts, feedback, comments, profiles, articles, group posts, document listings, messages, photos, and PDFs.",
                  "Members: Registered students, educators, and sellers who have created an account on LAN Library.",
                  "Visitors: Users who access portions of the platform without a registered account.",
                ]} />
              </Sub>

              <Sub number="1.4" title="Members and Visitors">
                <P>When you register and join LAN Library, you become a <strong>"Member"</strong>. If you have chosen not to register, you may access certain features as a <strong>"Visitor."</strong> This Contract applies to both Members and Visitors.</P>
              </Sub>

              <Sub number="1.5" title="Changes">
                <P>We may modify this Contract, our Privacy Policy, and our Cookie Policy from time to time. If we materially change these terms, we will provide notice through our Services or by other means, giving you the opportunity to review the changes before they take effect.</P>
                <Note type="warning">We agree that changes cannot be retroactive. If you object to any changes, you may close your account. Your continued use of our Services after notice of changes constitutes consent to the updated terms.</Note>
              </Sub>
            </Section>

            {/* ─── 2. OBLIGATIONS ─── */}
            <Section id="obligations" icon={Shield} number="2" title="Obligations">
              <Sub number="2.1" title="Service Eligibility">
                <P>The Services are not for use by anyone under the age of 16. To use our Services, you agree that:</P>
                <Ul items={[
                  "You must be at least 16 years old (the \"Minimum Age\"), or older if local law requires;",
                  "You will maintain only one LAN Library account, registered under your real name;",
                  "You are not already restricted by LAN Library from using the Services.",
                ]} />
                <Note type="info">Creating an account with false information — including accounts registered on behalf of others or persons under the minimum age — is a violation of this Agreement.</Note>
              </Sub>

              <Sub number="2.2" title="Your Account">
                <P>Members are account holders. You agree to:</P>
                <Ul items={[
                  "Protect against unauthorised access to your account (e.g., use a strong password and keep it confidential);",
                  "Not share or transfer your account or any part of it to another person;",
                  "Follow the law, our Dos and Don'ts (Section 8), and our Community Content Policies.",
                ]} />
                <P>You are responsible for anything that happens through your account unless you close it or report misuse. If Services were purchased by an institution for your academic use, that institution has the right to access usage reports, but does not have rights over your personal account.</P>
              </Sub>

              <Sub number="2.3" title="Payment">
                <P>If you purchase any paid Services (e.g., premium documents, seller subscriptions, or promoted listings), you agree to pay the applicable fees and taxes. You also agree that:</P>
                <Ul items={[
                  "Your purchase may be subject to exchange rate differences based on your location;",
                  "We may store and continue billing your payment method to avoid service interruptions;",
                  "If you purchase a subscription, your payment method will be charged automatically at the start of each period;",
                  "To avoid future charges, cancel before the renewal date;",
                  "All paid Services are subject to LAN Library's refund policy;",
                  "We may modify our prices with reasonable advance notice.",
                ]} />
              </Sub>

              <Sub number="2.4" title="Notices and Messages">
                <P>You agree that we will provide notices and messages to you:</P>
                <Ul items={[
                  "Within the Services (e.g., in-app notifications, banners); or",
                  "Sent to the contact information you provided (e.g., email, mobile number).",
                ]} />
                <Note type="info">Please keep your contact information up to date. If your details are outdated, you may miss important notices about your account, purchases, or policy changes.</Note>
              </Sub>

              <Sub number="2.5" title="Sharing">
                <P>Our Services allow sharing of information and content in many ways — through your profile, document listings, posts, group discussions, messages, and reviews. Depending on the feature and choices you make, information you share may be seen by other Members, Visitors, or others on or off the Services.</P>
                <P>Where we have made privacy settings available, we will honour the choices you make about who can see your content. To the extent permitted by law, we are not obligated to publish any content and can remove it with or without notice.</P>
              </Sub>
            </Section>

            {/* ─── 3. RIGHTS & LIMITS ─── */}
            <Section id="rights" icon={BookOpen} number="3" title="Rights and Limits">
              <Sub number="3.1" title="Your License to LAN Library">
                <P>As between you and LAN Library, you own your original content that you submit or post to the Services. You grant LAN Library and our Affiliates a <strong>non-exclusive, worldwide, transferable, and sublicensable</strong> license to use, copy, modify, distribute, publicly perform and display, host, and process your content without further consent, notice, or compensation, subject to the following:</P>
                <Ul items={[
                  "You can end this license for specific content by deleting such content from the Services, or generally by closing your account;",
                  "We will not include your content in third-party advertisements without your separate consent;",
                  "We will honour the audience choices you make for shared content (e.g., \"Connections Only\");",
                  "While we may make format changes (e.g., compressing files, translating metadata), we will not materially modify the meaning of your content.",
                ]} />
                <Note type="info">You promise to only provide content and other information that you have the right to share, and that does not violate the law or anyone's intellectual property rights.</Note>
              </Sub>

              <Sub number="3.2" title="Service Availability">
                <P>We may change, suspend, or discontinue any of our Services at any time. We may also limit the availability of features, content, and documents so that they are not available to all Visitors or Members (e.g., by region or by subscription level).</P>
                <Note type="warning">LAN Library is not a storage service. We have no obligation to store, maintain, or provide you a copy of any content you or others have shared, except as required by applicable law.</Note>
              </Sub>

              <Sub number="3.3" title="Other Content, Sites and Apps">
                <P>By using the Services, you may encounter content that might be inaccurate, incomplete, delayed, misleading, or otherwise harmful. You agree that we are not responsible for content made available through our Services by other Members.</P>
                <P>LAN Library may connect you with other Members who offer academic services (e.g., tutoring, custom study guides, freelance academic assistance). You acknowledge that LAN Library does not supervise, direct, control, or monitor Members in the making of such offers, and that LAN Library is not responsible for the performance of those services.</P>
              </Sub>

              <Sub number="3.4" title="Limits">
                <P>LAN Library reserves the right to limit your use of the Services, including the number of your connections and your ability to contact other Members. LAN Library reserves the right to restrict, suspend, or terminate your account if you breach this Contract or applicable law, or are misusing the Services.</P>
              </Sub>

              <Sub number="3.5" title="Intellectual Property Rights">
                <P>LAN Library reserves all of its intellectual property rights in the Services. Trademarks and logos used in connection with the Services are the trademarks of their respective owners. The "LAN Library" name, logos, and platform design are trademarks or registered trademarks of LAN Library.</P>
              </Sub>

              <Sub number="3.6" title="Recommendations and Automated Processing">
                <P>We use data and other information about you to make relevant document, seller, and content recommendations. We use that data to present information in an order that may be more relevant to your academic profile and purchase history.</P>
                <P>Our platform may include features that assist with generating content (e.g., document summaries, study suggestions). Such generated content might be inaccurate or incomplete. Please review and verify any AI-assisted content before relying on it for your studies.</P>
              </Sub>
            </Section>

            {/* ─── 4. DISCLAIMER ─── */}
            <Section id="disclaimer" icon={AlertTriangle} number="4" title="Disclaimer and Limit of Liability">
              <Sub number="4.1" title="No Warranty">
                <LegalBlock>
                  LAN LIBRARY AND ITS AFFILIATES MAKE NO REPRESENTATION OR WARRANTY ABOUT THE SERVICES, INCLUDING ANY REPRESENTATION THAT THE SERVICES WILL BE UNINTERRUPTED OR ERROR-FREE, AND PROVIDE THE SERVICES (INCLUDING CONTENT AND DOCUMENTS) ON AN "AS IS" AND "AS AVAILABLE" BASIS. TO THE FULLEST EXTENT PERMITTED UNDER APPLICABLE LAW, LAN LIBRARY AND ITS AFFILIATES DISCLAIM ANY IMPLIED OR STATUTORY WARRANTY, INCLUDING ANY IMPLIED WARRANTY OF TITLE, ACCURACY, NON-INFRINGEMENT, MERCHANTABILITY, OR FITNESS FOR A PARTICULAR PURPOSE.
                </LegalBlock>
                <P>If you use documents, summaries, or other content from the platform for academic submissions, examination preparation, or professional work, it is your responsibility to verify the accuracy and fitness of such material.</P>
              </Sub>

              <Sub number="4.2" title="Exclusion of Liability">
                <LegalBlock>
                  TO THE FULLEST EXTENT PERMITTED BY LAW, LAN LIBRARY AND ITS AFFILIATES WILL NOT BE LIABLE IN CONNECTION WITH THIS CONTRACT FOR LOST ACADEMIC PROGRESS, LOST BUSINESS OPPORTUNITIES, LOSS OF DATA (E.G., DOWNTIME OR LOSS OF YOUR UPLOADED DOCUMENTS OR CONTENT), REPUTATION DAMAGE, OR ANY INDIRECT, INCIDENTAL, CONSEQUENTIAL, SPECIAL, OR PUNITIVE DAMAGES.

                  LAN LIBRARY AND ITS AFFILIATES WILL NOT BE LIABLE TO YOU FOR ANY AMOUNT THAT EXCEEDS (A) THE TOTAL FEES PAID OR PAYABLE BY YOU TO LAN LIBRARY FOR THE SERVICES DURING THE TERM OF THIS CONTRACT, OR (B) ₦50,000 (FIFTY THOUSAND NAIRA), WHICHEVER IS LOWER.
                </LegalBlock>
              </Sub>
            </Section>

            {/* ─── 5. TERMINATION ─── */}
            <Section id="termination" icon={XCircle} number="5" title="Termination">
              <P>Both you and LAN Library may terminate this Contract at any time with notice to the other. On termination, you lose the right to access or use the Services. The following obligations survive termination:</P>
              <Ul items={[
                "Our rights to use and disclose your feedback submitted to us;",
                "Section 3 (Rights and Limits), subject to Section 3.1;",
                "Sections 4, 6, 7, and 8.2 of this Contract;",
                "Any amounts owed by either party prior to termination remain owed after termination.",
              ]} />
              <Note type="info">To close your account, visit your LAN Library Account Settings and follow the account closure process. You may download your uploaded documents before closing your account.</Note>
            </Section>

            {/* ─── 6. GOVERNING LAW ─── */}
            <Section id="governing" icon={Scale} number="6" title="Governing Law and Dispute Resolution">
              <P>In the unlikely event we end up in a legal dispute, you and LAN Library agree to resolve it as follows:</P>
              <Ul items={[
                "For users residing in Nigeria: the laws of the Federal Republic of Nigeria govern all claims related to LAN Library's provision of the Services. You and LAN Library agree to submit to the jurisdiction of the courts in Nigeria.",
                "For users residing outside Nigeria: the laws of Nigeria shall govern any dispute relating to this Contract and/or the Services.",
              ]} />
              <Note type="law">Nothing in this section deprives you of mandatory consumer protections available under the law of the country in which you reside.</Note>
              <P>If a formal complaint cannot be resolved through our support channels, LAN Library offers an internal alternative dispute resolution mechanism. Details are available in our Help Center.</P>
            </Section>

            {/* ─── 7. GENERAL TERMS ─── */}
            <Section id="general" icon={Gavel} number="7" title="General Terms">
              <P>If a court with authority over this Contract finds any part of it unenforceable, you and we agree that the court should modify the terms to make that part enforceable while still achieving its intent.</P>
              <Ul items={[
                "This Contract is the only agreement between us regarding the Services and supersedes all prior agreements.",
                "If we don't act to enforce a breach, that does not mean we have waived our right to enforce this Contract.",
                "You may not assign or transfer this Contract (or your membership or use of Services) to anyone without our consent.",
                "LAN Library may assign this Contract to its affiliates or a party that acquires it without your consent.",
                "There are no third-party beneficiaries to this Contract.",
                "The only way to provide us legal notice is at the addresses provided in Section 10.",
              ]} />
            </Section>

            {/* ─── 8. DOS & DON'TS ─── */}
            <Section id="dos-donts" icon={CheckCircle} number="8" title="LAN Library Dos and Don'ts">
              <P>LAN Library is a community of students, educators, and knowledge sellers. The following rules — along with our Community Content Policies — define what you can and cannot do on our Services.</P>

              <Sub number="8.1" title="Dos — You agree that you will:">
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12, marginBottom: 20 }}>
                  {[
                    "Comply with all applicable laws, including privacy laws, intellectual property laws, and anti-spam laws;",
                    "Provide accurate identity and contact information and keep it updated;",
                    "Use your real name on your profile;",
                    "Use the Services in a respectful and professional academic manner;",
                    "Ensure that all documents you upload or sell are materials you have the right to distribute;",
                    "Accurately describe the content, subject, and course level of documents you list for sale.",
                  ].map((item, i) => (
                    <div key={i} className="trend-card" style={{ padding: "14px 16px", display: "flex", alignItems: "flex-start", gap: 10 }}>
                      <CheckCircle size={14} style={{ color: "#16a34a", flexShrink: 0, marginTop: 2 }} />
                      <span style={{ fontSize: 13, color: "#444", lineHeight: 1.65, fontWeight: 300, fontFamily: "'Lato',sans-serif" }}>{item}</span>
                    </div>
                  ))}
                </div>
              </Sub>

              <Sub number="8.2" title="Don'ts — You agree that you will not:">
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {[
                    "Create a false identity, misrepresent your academic credentials, or register on behalf of another person;",
                    "Develop or use software, bots, scrapers, or automated scripts to extract data, profiles, or documents from the platform;",
                    "Bypass any security features, access controls, download limits, or subscription paywalls;",
                    "Copy, redistribute, or re-sell documents obtained from the Services without the consent of the original seller;",
                    "Upload documents that contain malware, viruses, harmful code, or deceptive content;",
                    "Violate the intellectual property rights of publishers, authors, institutions, or other Members;",
                    "Use the LAN Library name, logo, or branding in any business name, email, or URL without our express written consent;",
                    "Reverse-engineer, decompile, or attempt to extract the source code of the LAN Library platform;",
                    "Rent, lease, resell, or otherwise monetise your LAN Library account or access credentials without our consent;",
                    "Engage in fraudulent academic activity — including uploading plagiarised, falsified, or fabricated documents;",
                    "Harass, threaten, or engage in discriminatory behaviour toward other Members or staff;",
                    "Use bots or automated methods to post reviews, simulate purchases, or drive inauthentic engagement;",
                    "Interfere with the operation of the Services including through denial-of-service attacks, spam, or algorithm manipulation;",
                    "Misuse our reporting or appeals process, including submitting duplicative, fraudulent, or unfounded reports.",
                  ].map((item, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10, background: "#fff", border: "0.5px solid #e5ddd0", padding: "12px 16px" }}>
                      <XCircle size={14} style={{ color: "#dc2626", flexShrink: 0, marginTop: 2 }} />
                      <span style={{ fontSize: 13, color: "#444", lineHeight: 1.65, fontWeight: 300, fontFamily: "'Lato',sans-serif" }}>{item}</span>
                    </div>
                  ))}
                </div>
              </Sub>
            </Section>

            {/* ─── 9. COMPLAINTS ─── */}
            <Section id="complaints" icon={Bell} number="9" title="Complaints Regarding Content">
              <P>We ask that you report content and other information that you believe violates your rights (including intellectual property rights), our Community Content Policies, or otherwise violates this Contract or the law.</P>
              <P>To the extent permitted by law, we may remove or restrict access to content, features, services, or information, including where we believe it is reasonably necessary to prevent harm to LAN Library or others, or to prevent misuse of our Services.</P>
              <Note type="info">We respect the intellectual property rights of authors, publishers, and institutions. We require that all documents shared on LAN Library are materials that the uploader has the legal right to distribute. We provide a policy and process for reporting infringing or improperly listed content.</Note>
              <P>To submit a copyright complaint or content report, visit our <strong>Help Center</strong> or use the in-platform reporting tools available on every document listing page.</P>
            </Section>

            {/* ─── 10. CONTACT ─── */}
            <Section id="contact" icon={Phone} number="10" title="How to Contact Us">
              <P>Our contact information is listed below. Our Help Center also provides detailed information about our Services, policies, and dispute resolution options.</P>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 14 }}>
                {[
                  { icon: Globe, label: "General Enquiries", value: "support@lanlibrary.com", sub: "Online contact form available in the Help Center" },
                  { icon: Scale, label: "Legal Notices", value: "legal@lanlibrary.com", sub: "For formal legal notices and service of process" },
                  { icon: Shield, label: "Accessibility Team", value: "accessibility@lanlibrary.com", sub: "Accessibility bugs, complaints, and VPAT requests" },
                  { icon: Lock, label: "Privacy & Data", value: "privacy@lanlibrary.com", sub: "Data subject requests and privacy concerns" },
                ].map(({ icon: Icon, label, value, sub }, i) => (
                  <div key={i} className="trend-card" style={{ padding: "20px" }}>
                    <div style={{ width: 36, height: 36, background: NAVY, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
                      <Icon size={16} style={{ color: GOLD }} />
                    </div>
                    <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: GOLD, margin: "0 0 5px", fontFamily: "'Lato',sans-serif" }}>{label}</p>
                    <p style={{ fontFamily: "'Playfair Display',serif", fontSize: 13, fontWeight: 700, color: NAVY, margin: "0 0 6px" }}>{value}</p>
                    <p style={{ fontSize: 11, color: "#999", margin: 0, fontFamily: "'Lato',sans-serif", lineHeight: 1.55, fontWeight: 300 }}>{sub}</p>
                  </div>
                ))}
              </div>
            </Section>

          </main>
        </div>

        {/* ════════════════════════════════════════════════
            CTA BANNER — matches HomeClient "Ready to Excel"
        ════════════════════════════════════════════════ */}
        <section className="hatch-bg" style={{ padding: "80px 24px", textAlign: "center" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 16, marginBottom: 28 }}>
            <div style={{ height: 1, width: 60, background: "rgba(184,150,62,0.4)" }} />
            <Star size={14} style={{ color: GOLD, fill: GOLD }} />
            <div style={{ height: 1, width: 60, background: "rgba(184,150,62,0.4)" }} />
          </div>

          <h2 className="lan-serif" style={{ fontSize: "clamp(28px,5vw,52px)", fontWeight: 700, color: "#fff", margin: "0 0 16px" }}>
            Questions about this{" "}
            <span style={{ color: GOLD, fontStyle: "italic" }}>Agreement?</span>
          </h2>
          <p style={{ fontSize: 15, color: "rgba(255,255,255,0.5)", maxWidth: 500, margin: "0 auto 40px", lineHeight: 1.75, fontWeight: 300 }}>
            Our support team is here to help you understand your rights, obligations, and how LAN Library
            protects your academic work and personal data.
          </p>

          <div style={{ display: "flex", flexWrap: "wrap", gap: 14, justifyContent: "center" }}>
            <a href="mailto:support@lanlibrary.local" style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              padding: "14px 28px", background: GOLD, color: NAVY,
              fontSize: 13, fontWeight: 700, textDecoration: "none",
              fontFamily: "'Lato',sans-serif", letterSpacing: "0.04em",
            }}>
              <Phone size={14} /> Contact Support
            </a>
            <Link href="/lan/net/help-center" style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              padding: "14px 28px", border: "0.5px solid rgba(255,255,255,0.2)",
              color: CREAM, fontSize: 13, fontWeight: 700, textDecoration: "none",
              fontFamily: "'Lato',sans-serif", letterSpacing: "0.04em",
            }}>
              <BookOpen size={14} /> Visit Help Center
            </Link>
          </div>

          <p style={{ fontSize: 10, color: "rgba(184,150,62,0.45)", margin: "36px 0 0", letterSpacing: "0.14em", textTransform: "uppercase", fontFamily: "'Lato',sans-serif" }}>
            Effective November 3, 2025 · LAN Library Legal Team
          </p>
        </section>

        {/* <Footer /> */}
      </div>
    </>
  );
}