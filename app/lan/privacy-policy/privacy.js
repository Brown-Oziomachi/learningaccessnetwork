"use client";
import { useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { ArrowLeft, Shield, ChevronRight } from "lucide-react";

const NAVY = "#0d2244";
const GOLD = "#b8963e";
const GOLDD = "#d4aa5a";
const CREAM = "#f5f0e8";
const BG = "#f5f1ea";

const sections = [
  { id: "introduction", label: "Introduction" },
  { id: "who-we-are", label: "Who We Are And Our Company Information" },
  { id: "information-collected", label: "Information We Collect" },
  { id: "how-we-use", label: "How We Use Your Information" },
  { id: "sharing", label: "Information Sharing and Disclosure" },
  { id: "data-security", label: "Data Security" },
  { id: "data-retention", label: "Data Retention" },
  { id: "your-rights", label: "Your Privacy Rights" },
  { id: "childrens", label: "Children's Privacy" },
  { id: "changes", label: "Changes to This Privacy Policy" },
  { id: "contact", label: "Contact Us" },
];

export default function PrivacyPolicyClient() {
  const router = useRouter();
  const [activeSection, setActiveSection] = useState("introduction");
  const [scrolled, setScrolled] = useState(false);
  const contentRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 60);
      const sectionEls = sections.map(s => document.getElementById(s.id));
      let current = sections[0].id;
      sectionEls.forEach(el => {
        if (el && el.getBoundingClientRect().top < 180) current = el.id;
      });
      setActiveSection(current);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400&family=Lato:wght@300;400;700&display=swap');
        .lan-root { font-family: 'Lato', sans-serif; background: ${BG}; }
        .lan-serif { font-family: 'Playfair Display', Georgia, serif; }

        .hero-bg {
          background-color: ${NAVY};
          background-image:
            radial-gradient(rgba(184,150,62,0.06) 1px, transparent 1px),
            radial-gradient(rgba(255,255,255,0.03) 1px, transparent 1px);
          background-size: 28px 28px, 14px 14px;
          background-position: 0 0, 7px 7px;
        }

        .sidebar-link {
          display: block; padding: 10px 16px; font-size: 12px; font-family: 'Lato', sans-serif;
          color: #777; text-decoration: none; cursor: pointer; border-left: 2px solid transparent;
          transition: color 0.18s, border-color 0.18s, background 0.18s;
          line-height: 1.45; font-weight: 400;
        }
        .sidebar-link:hover { color: ${NAVY}; background: rgba(13,34,68,0.04); }
        .sidebar-link.active { color: ${GOLD}; border-left-color: ${GOLD}; font-weight: 700; background: rgba(184,150,62,0.06); }

        .prose-section { margin-bottom: 56px; scroll-margin-top: 100px; }
        .prose-section h2 {
          font-family: 'Playfair Display', serif; font-size: clamp(22px, 3vw, 30px);
          font-weight: 700; color: ${NAVY}; margin: 0 0 6px; line-height: 1.2;
        }
        .prose-section h3 {
          font-family: 'Playfair Display', serif; font-size: 17px;
          font-weight: 700; color: ${NAVY}; margin: 28px 0 10px;
        }
        .prose-section p {
          font-size: 15px; color: #555; line-height: 1.85;
          font-family: 'Lato', sans-serif; font-weight: 300; margin: 0 0 16px;
        }
        .gold-rule { height: 1px; background: rgba(184,150,62,0.25); border: none; margin: 0 0 28px; }

        .sticky-sidebar { position: sticky; top: 88px; max-height: calc(100vh - 108px); overflow-y: auto; scrollbar-width: none; }
        .sticky-sidebar::-webkit-scrollbar { display: none; }

        @keyframes slideUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
        .anim-up { animation: slideUp 0.55s cubic-bezier(0.4,0,0.2,1) both; }
        .anim-up-2 { animation: slideUp 0.55s 0.1s cubic-bezier(0.4,0,0.2,1) both; }

        .back-btn {
          display: inline-flex; align-items: center; gap: 8px; padding: 10px 20px;
          background: rgba(255,255,255,0.08); border: 0.5px solid rgba(184,150,62,0.3);
          color: rgba(245,240,232,0.8); font-size: 12px; font-weight: 700;
          font-family: 'Lato', sans-serif; letter-spacing: 0.08em; text-transform: uppercase;
          cursor: pointer; transition: background 0.18s, border-color 0.18s;
        }
        .back-btn:hover { background: rgba(255,255,255,0.13); border-color: ${GOLD}; color: ${GOLDD}; }
      `}</style>

      <div className="lan-root min-h-screen">
        {/* ── Hero Banner ── */}
        <section className="hero-bg" style={{ padding: "56px 24px 52px" }}>
          <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
            <button className="back-btn anim-up" onClick={() => router.push("/")}>
              <ArrowLeft size={13} /> Back to Library
            </button>

            <div style={{ marginTop: "32px", display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: "16px" }}>
              <div>
                <p className="anim-up" style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", color: GOLD, marginBottom: "10px", fontFamily: "'Lato', sans-serif" }}>
                  Legal Document
                </p>
                <h1 className="lan-serif anim-up-2" style={{ fontSize: "clamp(32px, 5vw, 58px)", fontWeight: 900, color: "#fff", margin: 0, lineHeight: 1.05, letterSpacing: "-1px" }}>
                  Privacy Policy
                </h1>
              </div>
              <div style={{ flexShrink: 0 }}>
                <div style={{ width: "56px", height: "56px", border: `1.5px solid rgba(184,150,62,0.4)`, display: "flex", alignItems: "center", justifyContent: "center", transform: "rotate(45deg)" }}>
                  <Shield size={22} style={{ color: GOLD, transform: "rotate(-45deg)" }} strokeWidth={1.5} />
                </div>
              </div>
            </div>

            {/* meta strip */}
            <div style={{ marginTop: "32px", borderTop: "0.5px solid rgba(184,150,62,0.2)", paddingTop: "20px", display: "flex", gap: "32px", flexWrap: "wrap" }}>
              {[
                { label: "Effective Date", val: "December 31, 2025" },
                { label: "Jurisdiction", val: "Federal Republic of Nigeria" },
                { label: "Contact", val: "legal@lanlibrary.com" },
              ].map(({ label, val }) => (
                <div key={label}>
                  <div style={{ fontSize: "9px", fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(184,150,62,0.65)", fontFamily: "'Lato',sans-serif", marginBottom: "4px" }}>{label}</div>
                  <div style={{ fontSize: "13px", color: "rgba(245,240,232,0.85)", fontFamily: "'Lato',sans-serif", fontWeight: 300 }}>{val}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Body: Sidebar + Content ── */}
        <div style={{ maxWidth: "1200px", margin: "0 auto", display: "flex", gap: "0", padding: "0 24px", alignItems: "flex-start" }}>

          {/* Sidebar */}
          <aside style={{ width: "260px", flexShrink: 0, paddingTop: "48px", paddingRight: "32px" }} className="max-md:hidden">
            <div className="sticky-sidebar">
              <p style={{ fontSize: "9px", fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: GOLD, fontFamily: "'Lato',sans-serif", padding: "0 16px", marginBottom: "12px" }}>
                Contents
              </p>
              <div style={{ borderLeft: `0.5px solid #e5ddd0` }}>
                {sections.map(s => (
                  <span
                    key={s.id}
                    className={`sidebar-link${activeSection === s.id ? " active" : ""}`}
                    onClick={() => scrollTo(s.id)}
                  >
                    {s.label}
                  </span>
                ))}
              </div>
            </div>
          </aside>

          {/* Content */}
          <main style={{ flex: 1, minWidth: 0, padding: "48px 0 80px", borderLeft: `0.5px solid #e5ddd0`, paddingLeft: "48px" }} ref={contentRef}>

            <section id="introduction" className="prose-section">
              <h2>Introduction</h2>
              <hr className="gold-rule" />
              <p>Welcome to LAN Library. We are committed to protecting your personal information and your right to privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our Learning Access Network library management system.</p>
              <p>By using LAN Library, you agree to the collection and use of information in accordance with this policy. If you do not agree with our policies and practices, please do not use our service.</p>
            </section>

            <section id="who-we-are" className="prose-section">
              <h2>Who We Are And Our Company Information</h2>
              <hr className="gold-rule" />
              <p>LAN Library is operated by Learning Access Network Ltd., a digital academic resource platform dedicated to connecting African students and educators with quality learning materials. We are headquartered in Nigeria and serve learners across the African continent.</p>
              <p>Our platform serves over 2.4 million learners across various academic institutions, from secondary schools to postgraduate programs, providing access to textbooks, lecture notes, past questions, theses, and a wide range of academic resources.</p>
            </section>

            <section id="information-collected" className="prose-section">
              <h2>Information We Collect</h2>
              <hr className="gold-rule" />
              <h3>2.1 Personal Information</h3>
              <p>When you register for LAN Library, we may collect personal information including but not limited to your name, email address, username, password, and profile information. We collect information you provide directly to us when creating an account, updating your profile, or communicating with us.</p>
              <h3>2.2 Library Usage Data</h3>
              <p>We collect information about your library activities, including books borrowed, reading history, search queries, book ratings and reviews, wishlist items, and reading preferences. This information helps us provide personalized recommendations and improve our service.</p>
              <h3>2.3 Payment Information</h3>
              <p>When you make purchases on LAN Library, we collect payment information necessary to process your transaction. We do not store complete payment card details on our servers; this information is processed securely through our payment partners.</p>
              <h3>2.4 Usage Analytics</h3>
              <p>We collect analytics data about how you interact with LAN Library, including pages visited, features used, time spent on different sections, click patterns and navigation paths, and system performance metrics. This information is used to improve user experience and system functionality.</p>
            </section>

            <section id="how-we-use" className="prose-section">
              <h2>How We Use Your Information</h2>
              <hr className="gold-rule" />
              <p>We use the information we collect for various purposes, including to provide, maintain, and improve our services; to process your transactions and manage your library account; to send you notifications about due dates, new arrivals, and system updates; to personalize your experience with book recommendations and customized content; to analyze usage patterns and optimize system performance; to detect, prevent, and address technical issues and security threats; to respond to your comments, questions, and customer service requests; to comply with legal obligations and enforce our terms; and to communicate with you about changes to our policies or services.</p>
            </section>

            <section id="sharing" className="prose-section">
              <h2>Information Sharing and Disclosure</h2>
              <hr className="gold-rule" />
              <p>We do not sell, trade, or rent your personal information to third parties. We may share your information only in the following circumstances:</p>
              <p>With your consent, when you explicitly authorize us to share specific information. With service providers who assist in operating our platform, such as hosting providers, analytics services, and email communication platforms, under strict confidentiality agreements. With network administrators in your organization, as LAN Library operates within local networks and certain administrative access may be necessary. When required by law, legal process, or government request, or when we believe disclosure is necessary to protect our rights, your safety, or the safety of others.</p>
              <p>In the event of a merger, acquisition, or sale of assets, your information may be transferred to the acquiring entity, and you will be notified via email and prominent notice on our platform of any change in ownership.</p>
            </section>

            <section id="data-security" className="prose-section">
              <h2>Data Security</h2>
              <hr className="gold-rule" />
              <p>We implement robust security measures to protect your information from unauthorized access, alteration, disclosure, or destruction. Our security practices include encryption of data in transit and at rest using industry-standard protocols, secure authentication mechanisms with password hashing, regular security audits and vulnerability assessments, access controls and permission management, secure backup procedures, and network security measures including firewalls and intrusion detection.</p>
              <p>While we strive to protect your personal information, no method of transmission over the internet or electronic storage is completely secure. We cannot guarantee absolute security but continuously work to improve our security measures.</p>
            </section>

            <section id="data-retention" className="prose-section">
              <h2>Data Retention</h2>
              <hr className="gold-rule" />
              <p>We retain your personal information for as long as necessary to fulfill the purposes outlined in this Privacy Policy, unless a longer retention period is required or permitted by law. Account information is retained while your account is active and for a reasonable period afterward. Reading history and borrowing records are retained for administrative purposes and to provide you with historical data. Analytics and usage data may be retained in aggregated, anonymized form indefinitely.</p>
              <p>When we no longer need your information, we will securely delete or anonymize it in accordance with our data retention policies.</p>
            </section>

            <section id="your-rights" className="prose-section">
              <h2>Your Privacy Rights</h2>
              <hr className="gold-rule" />
              <p>Depending on your location and applicable laws, you may have certain rights regarding your personal information. These rights may include the right to access your personal information and request a copy of the data we hold about you; the right to rectify inaccurate or incomplete personal information; the right to delete your personal information, subject to certain exceptions; the right to restrict or object to certain processing of your information; the right to data portability, allowing you to receive your data in a structured, machine-readable format; and the right to withdraw consent where processing is based on consent.</p>
              <p>To exercise these rights, please contact us using the information provided at the end of this policy. We will respond to your request within a reasonable timeframe and in accordance with applicable law.</p>
            </section>

            <section id="childrens" className="prose-section">
              <h2>Children's Privacy</h2>
              <hr className="gold-rule" />
              <p>LAN Library may be used by minors as part of educational or library programs. When our service is used by individuals under the age of 13 (or the applicable age of digital consent in your jurisdiction), we comply with applicable children's privacy laws. We do not knowingly collect personal information from children without appropriate parental or guardian consent.</p>
              <p>If you believe we have collected information from a child without proper consent, please contact us immediately, and we will take steps to remove such information.</p>
            </section>

            <section id="changes" className="prose-section">
              <h2>Changes to This Privacy Policy</h2>
              <hr className="gold-rule" />
              <p>We may update this Privacy Policy from time to time to reflect changes in our practices, technology, legal requirements, or other factors. When we make changes, we will update the "Effective Date" at the top of this policy and notify you through the platform or by email for significant changes.</p>
              <p>We encourage you to review this Privacy Policy periodically to stay informed about how we protect your information. Your continued use of LAN Library after changes are posted constitutes your acceptance of the updated policy.</p>
            </section>

            <section id="contact" className="prose-section">
              <h2>Contact Us</h2>
              <hr className="gold-rule" />
              <p>If you have questions, concerns, or requests regarding this Privacy Policy or our privacy practices, please contact us at <strong style={{ color: NAVY }}>legal@lanlibrary.com</strong>. We are committed to resolving any privacy concerns you may have.</p>
              {/* Contact card */}
              <div style={{ background: "#fff", border: `0.5px solid #e5ddd0`, padding: "28px 32px", marginTop: "16px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "16px" }}>
                <div>
                  <p style={{ fontSize: "9px", fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: GOLD, marginBottom: "6px" }}>Legal Team</p>
                  <p style={{ fontSize: "16px", fontFamily: "'Playfair Display', serif", fontWeight: 700, color: NAVY, margin: "0 0 4px" }}>LAN Library Legal</p>
                  <p style={{ fontSize: "13px", color: "#888", margin: 0, fontWeight: 300 }}>legal@lanlibrary.com</p>
                </div>
                <a href="mailto:legal@lanlibrary.com" style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "11px 22px", background: NAVY, color: "#fff", fontSize: "12px", fontWeight: 700, fontFamily: "'Lato',sans-serif", textDecoration: "none", letterSpacing: "0.06em" }}>
                  Send Message <ChevronRight size={13} />
                </a>
              </div>
            </section>
          </main>
        </div>
      </div>
    </>
  );
}