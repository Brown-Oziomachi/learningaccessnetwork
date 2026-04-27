"use client";
import { useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { ArrowLeft, ScrollText, ChevronRight } from "lucide-react";

const NAVY = "#0d2244";
const GOLD = "#b8963e";
const GOLDD = "#d4aa5a";
const CREAM = "#f5f0e8";
const BG = "#f5f1ea";

const sections = [
  { id: "acceptance", label: "Acceptance of Terms" },
  { id: "service-description", label: "Service Description" },
  { id: "user-accounts", label: "User Accounts and Registration" },
  { id: "acceptable-use", label: "Acceptable Use Policy" },
  { id: "borrowing", label: "Library Materials and Borrowing" },
  { id: "intellectual-property", label: "Intellectual Property Rights" },
  { id: "user-content", label: "User-Generated Content" },
  { id: "fees", label: "Fees and Payment" },
  { id: "privacy", label: "Privacy and Data Protection" },
  { id: "disclaimers", label: "Disclaimers and Limitation of Liability" },
  { id: "indemnification", label: "Indemnification" },
  { id: "termination", label: "Termination" },
  { id: "governing-law", label: "Dispute Resolution and Governing Law" },
  { id: "changes", label: "Changes to Terms" },
  { id: "general", label: "General Provisions" },
  { id: "contact", label: "Contact Information" },
];

export default function TermsOfServiceClient() {
  const router = useRouter();
  const [activeSection, setActiveSection] = useState("acceptance");
  const contentRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => {
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
                  Terms of Service
                </h1>
              </div>
              <div style={{ flexShrink: 0 }}>
                <div style={{ width: "56px", height: "56px", border: `1.5px solid rgba(184,150,62,0.4)`, display: "flex", alignItems: "center", justifyContent: "center", transform: "rotate(45deg)" }}>
                  <ScrollText size={22} style={{ color: GOLD, transform: "rotate(-45deg)" }} strokeWidth={1.5} />
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

            <section id="acceptance" className="prose-section">
              <h2>1. Acceptance of Terms</h2>
              <hr className="gold-rule" />
              <p>Welcome to LAN Library. These Terms of Service constitute a legally binding agreement between you and LAN Library regarding your use of our learning access network library management system, including all associated software, applications, features, and services.</p>
              <p>By accessing or using LAN Library, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service and our Privacy Policy. If you do not agree to these terms, you must not access or use our service.</p>
              <p>These terms apply to all users of LAN Library, including individual users, librarians, administrators, and any other persons who access or use the service. Your organization or institution may have additional terms or policies that apply to your use of LAN Library.</p>
            </section>

            <section id="service-description" className="prose-section">
              <h2>2. Service Description</h2>
              <hr className="gold-rule" />
              <p>LAN Library is a comprehensive library management system designed to operate within local area networks. Our platform provides tools and features for catalog management, book borrowing and returns, user account management, search and discovery functionality, reading recommendations, digital resource access, and administrative reporting and analytics.</p>
              <p>We reserve the right to modify, suspend, or discontinue any aspect of the service at any time, with or without notice. We may also impose limits on certain features or restrict access to parts of the service without liability.</p>
              <p>The availability and functionality of LAN Library depend on your local network infrastructure and configuration. We are not responsible for network issues, connectivity problems, or limitations imposed by your organization's IT policies.</p>
            </section>

            <section id="user-accounts" className="prose-section">
              <h2>3. User Accounts and Registration</h2>
              <hr className="gold-rule" />
              <p>To use LAN Library, you must create an account by providing accurate and complete information. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You must immediately notify us of any unauthorized use of your account or any other security breach.</p>
              <p>You agree to provide accurate, current, and complete information during registration and to update such information to keep it accurate and current. Providing false information or impersonating another person or entity is prohibited and may result in account termination.</p>
              <p>You must be at least 13 years old to create an account, or have obtained parental or guardian consent if you are younger. Accounts for minors may be subject to additional restrictions or oversight as required by applicable law or institutional policy.</p>
            </section>

            <section id="acceptable-use" className="prose-section">
              <h2>4. Acceptable Use Policy</h2>
              <hr className="gold-rule" />
              <p>You agree to use LAN Library only for lawful purposes and in accordance with these Terms. You must not use the service to violate any applicable laws, regulations, or third-party rights; transmit any harmful, threatening, abusive, harassing, defamatory, or otherwise objectionable content; attempt to gain unauthorized access to any part of the service or related systems; interfere with or disrupt the service or servers or networks connected to the service; impersonate any person or entity or falsely state or misrepresent your affiliation with a person or entity; upload or transmit viruses, malware, or any other malicious code; collect or harvest information about other users without their consent; or use automated systems or software to extract data from the service without authorization.</p>
              <p>Violation of this Acceptable Use Policy may result in immediate suspension or termination of your account, removal of content, and potential legal action. We reserve the right to investigate violations and cooperate with law enforcement authorities as necessary.</p>
            </section>

            <section id="borrowing" className="prose-section">
              <h2>5. Library Materials and Borrowing</h2>
              <hr className="gold-rule" />
              <p>LAN Library facilitates the borrowing and management of library materials. When you borrow materials through our platform, you agree to comply with all borrowing policies, including due dates and renewal procedures; return borrowed materials in the condition received, subject to normal wear and tear; pay any applicable fines, fees, or replacement costs for late, lost, or damaged materials; and respect intellectual property rights and copyright laws regarding library materials.</p>
              <p>Specific borrowing limits, loan periods, and renewal policies are determined by your library or organization and may vary. You are responsible for knowing and complying with these policies.</p>
              <p>Digital materials accessed through LAN Library may be subject to additional terms, including digital rights management restrictions and licensing agreements. You agree to comply with all such terms when accessing digital content.</p>
            </section>

            <section id="intellectual-property" className="prose-section">
              <h2>6. Intellectual Property Rights</h2>
              <hr className="gold-rule" />
              <p>LAN Library and its original content, features, and functionality are owned by LAN Library and are protected by international copyright, trademark, patent, trade secret, and other intellectual property laws. The LAN Library name, logo, and all related names, logos, product and service names, designs, and slogans are trademarks of LAN Library or its licensors.</p>
              <p>We grant you a limited, non-exclusive, non-transferable, revocable license to access and use LAN Library for its intended purpose in accordance with these Terms. This license does not include any right to resale or commercial use of the service; collection and use of product listings or descriptions; derivative use of the service or its contents; downloading or copying of account information; or use of data mining, robots, or similar data gathering tools.</p>
              <p>You retain ownership of any content you submit to LAN Library, such as reviews, ratings, or comments. By submitting content, you grant us a worldwide, non-exclusive, royalty-free license to use, reproduce, modify, and display such content in connection with operating and promoting the service.</p>
            </section>

            <section id="user-content" className="prose-section">
              <h2>7. User-Generated Content</h2>
              <hr className="gold-rule" />
              <p>LAN Library may allow users to post reviews, ratings, comments, and other content. You are solely responsible for the content you post and the consequences of posting such content. We do not endorse any user-generated content and disclaim all liability related to such content.</p>
              <p>By posting content, you represent and warrant that you have the right to post such content; your content does not violate any third-party rights or applicable laws; your content is not defamatory, obscene, or otherwise objectionable; and you will indemnify us for all claims resulting from your content.</p>
              <p>We reserve the right, but have no obligation, to monitor, edit, or remove any user-generated content that we determine violates these Terms or is otherwise objectionable. We do not pre-screen content but may remove content after it has been posted.</p>
            </section>

            <section id="fees" className="prose-section">
              <h2>8. Fees and Payment</h2>
              <hr className="gold-rule" />
              <p>LAN Library may offer both free and paid services. If you purchase a paid subscription or service, you agree to pay all applicable fees as described at the time of purchase. All fees are non-refundable unless otherwise specified or required by law.</p>
              <p>Your library or organization may incur fines or fees for late returns, lost materials, or damaged items. These fees are separate from any subscription fees and are determined by your library's policies. You are responsible for paying all such fines and fees.</p>
              <p>We reserve the right to change our fees and pricing at any time. We will provide advance notice of any fee changes, and continued use of paid services after such changes constitutes acceptance of the new fees.</p>
            </section>

            <section id="privacy" className="prose-section">
              <h2>9. Privacy and Data Protection</h2>
              <hr className="gold-rule" />
              <p>Your use of LAN Library is subject to our Privacy Policy, which describes how we collect, use, and protect your personal information. By using our service, you consent to such processing and warrant that all data provided by you is accurate. Please review our Privacy Policy to understand our privacy practices.</p>
            </section>

            <section id="disclaimers" className="prose-section">
              <h2>10. Disclaimers and Limitation of Liability</h2>
              <hr className="gold-rule" />
              <p>LAN Library is provided on an "as is" and "as available" basis without warranties of any kind, either express or implied. We disclaim all warranties, including but not limited to implied warranties of merchantability, fitness for a particular purpose, and non-infringement. We do not warrant that the service will be uninterrupted, timely, secure, or error-free; that defects will be corrected; or that the service or servers are free of viruses or other harmful components.</p>
              <p>To the fullest extent permitted by law, LAN Library shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including but not limited to loss of profits, data, or use, even if we have been advised of the possibility of such damages. Our total liability to you for all claims arising from or relating to the service shall not exceed the amount you paid us in the twelve months preceding the claim, or one hundred dollars if no fees were paid.</p>
              <p>Some jurisdictions do not allow the exclusion of certain warranties or limitation of liability, so these limitations may not apply to you. In such cases, our liability will be limited to the maximum extent permitted by law.</p>
            </section>

            <section id="indemnification" className="prose-section">
              <h2>11. Indemnification</h2>
              <hr className="gold-rule" />
              <p>You agree to indemnify, defend, and hold harmless LAN Library and its officers, directors, employees, agents, and affiliates from and against any claims, liabilities, damages, losses, costs, expenses, or fees (including reasonable attorneys' fees) arising from your use of the service; your violation of these Terms; your violation of any rights of another party; or any content you post or transmit through the service.</p>
            </section>

            <section id="termination" className="prose-section">
              <h2>12. Termination</h2>
              <hr className="gold-rule" />
              <p>We may terminate or suspend your account and access to LAN Library immediately, without prior notice or liability, for any reason, including but not limited to breach of these Terms. Upon termination, your right to use the service will cease immediately.</p>
              <p>You may terminate your account at any time by contacting us or using the account closure feature. Upon termination by either party, you remain liable for all obligations incurred prior to termination. All provisions of these Terms that by their nature should survive termination shall survive, including ownership provisions, warranty disclaimers, and limitations of liability.</p>
            </section>

            <section id="governing-law" className="prose-section">
              <h2>13. Dispute Resolution and Governing Law</h2>
              <hr className="gold-rule" />
              <p>These Terms shall be governed by and construed in accordance with the laws of the jurisdiction in which LAN Library operates, without regard to its conflict of law provisions. Any disputes arising from these Terms or your use of the service shall be resolved through binding arbitration in accordance with the rules of the applicable arbitration association, except where prohibited by law.</p>
              <p>You agree that any dispute resolution proceedings will be conducted only on an individual basis and not in a class, consolidated, or representative action. If for any reason a claim proceeds in court rather than arbitration, you waive any right to a jury trial.</p>
            </section>

            <section id="changes" className="prose-section">
              <h2>14. Changes to Terms</h2>
              <hr className="gold-rule" />
              <p>We reserve the right to modify these Terms at any time. When we make changes, we will post the updated Terms and update the "Effective Date" at the top. For material changes, we will provide additional notice, such as through email or a prominent notice on our platform.</p>
              <p>Your continued use of LAN Library after changes are posted constitutes your acceptance of the updated Terms. If you do not agree to the modified Terms, you must stop using the service.</p>
            </section>

            <section id="general" className="prose-section">
              <h2>15. General Provisions</h2>
              <hr className="gold-rule" />
              <p>These Terms constitute the entire agreement between you and LAN Library regarding the service and supersede all prior agreements and understandings. If any provision of these Terms is found to be invalid or unenforceable, the remaining provisions will remain in full force and effect.</p>
              <p>Our failure to enforce any right or provision of these Terms will not be deemed a waiver of such right or provision. You may not assign or transfer these Terms or your rights hereunder without our prior written consent. We may assign these Terms without restriction.</p>
            </section>

            <section id="contact" className="prose-section">
              <h2>16. Contact Information</h2>
              <hr className="gold-rule" />
              <p>If you have any questions about these Terms of Service, please contact us at <strong style={{ color: NAVY }}>legal@lanlibrary.com</strong>. We will respond to your inquiries as promptly as possible.</p>
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