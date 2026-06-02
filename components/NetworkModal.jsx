"use client";

import { useState } from "react";
import { createPortal } from "react-dom";

const NAVY = "#0d2244";
const GOLD = "#b8963e";
const GOLDD = "#d4aa5a";
const CREAM = "#f5f0e8";

function NetworkModal({ onClose }) {
  const [activeTab, setActiveTab] = useState("overview");

  const tabs = [
    { key: "overview", label: "How it fits", icon: "🔗" },
    { key: "student", label: "Student", icon: "🎓" },
    { key: "seller", label: "Seller", icon: "📚" },
    { key: "faculty", label: "Faculty", icon: "🏛️" },
  ];

  return createPortal(
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(7,19,31,.78)",
        zIndex: 1300,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        backdropFilter: "blur(4px)",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#fff",
          maxWidth: 600,
          width: "100%",
          border: "0.5px solid #e5ddd0",
          animation: "fadeUp .32s cubic-bezier(.4,0,.2,1) both",
          maxHeight: "90vh",
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <style>{`
          @keyframes fadeUp { from { opacity:0; transform:translateY(16px) } to { opacity:1; transform:translateY(0) } }
        `}</style>

        {/* ── Header ── */}
        <div
          style={{
            background: NAVY,
            backgroundImage:
              "radial-gradient(rgba(184,150,62,.07) 1px,transparent 1px)",
            backgroundSize: "22px 22px",
            padding: "24px 24px 20px",
            flexShrink: 0,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
            }}
          >
            <div>
              <p
                style={{
                  fontSize: 9,
                  color: GOLD,
                  fontWeight: 700,
                  letterSpacing: ".2em",
                  textTransform: "uppercase",
                  fontFamily: "'Lato',sans-serif",
                  margin: "0 0 8px",
                }}
              >
                The LAN Ecosystem
              </p>
              <h2
                style={{
                  fontFamily: "'Playfair Display',serif",
                  fontSize: 22,
                  fontWeight: 700,
                  color: "#fff",
                  margin: "0 0 8px",
                  lineHeight: 1.2,
                }}
              >
                Three Networks. One Mission.
              </h2>
              <p
                style={{
                  fontSize: 12,
                  color: "rgba(245,240,232,.55)",
                  fontFamily: "'Lato',sans-serif",
                  margin: 0,
                  lineHeight: 1.7,
                  maxWidth: 460,
                }}
              >
                Africa's largest academic library is powered by three
                interconnected communities — each with a distinct role, each
                essential to the whole.
              </p>
            </div>
            <button
              onClick={onClose}
              style={{
                background: "none",
                border: "none",
                color: "rgba(255,255,255,.4)",
                fontSize: 24,
                cursor: "pointer",
                lineHeight: 1,
                marginLeft: 16,
                flexShrink: 0,
              }}
            >
              ×
            </button>
          </div>
        </div>

        {/* ── Tabs ── */}
        <div
          style={{
            display: "flex",
            borderBottom: "0.5px solid #e5ddd0",
            background: "#fafafa",
            flexShrink: 0,
          }}
        >
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              style={{
                flex: 1,
                padding: "13px 8px",
                background: activeTab === t.key ? "#fff" : "none",
                border: "none",
                borderBottom: `2px solid ${activeTab === t.key ? GOLD : "transparent"}`,
                cursor: "pointer",
                fontSize: 11,
                fontWeight: 700,
                color: activeTab === t.key ? GOLD : "#aaa",
                fontFamily: "'Lato',sans-serif",
                letterSpacing: ".06em",
                textTransform: "uppercase",
                transition: "all .15s",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 4,
              }}
            >
              <span style={{ fontSize: 16 }}>{t.icon}</span>
              {t.label}
            </button>
          ))}
        </div>

        {/* ── Panels ── */}
        <div style={{ flex: 1, overflowY: "auto" }}>
          {/* OVERVIEW */}
          {activeTab === "overview" && (
            <div style={{ padding: "24px 28px 28px" }}>
              <p
                style={{
                  fontSize: 13,
                  color: "#666",
                  lineHeight: 1.75,
                  fontFamily: "'Lato',sans-serif",
                  marginBottom: 20,
                }}
              >
                Think of LAN as a large{" "}
                <strong style={{ color: NAVY }}>academic airport</strong>. Three
                distinct groups of people make it run — and every transaction
                flows between them.
              </p>

              {/* Flow diagram */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 24,
                  flexWrap: "wrap",
                }}
              >
                {[
                  {
                    label: "Student buys",
                    color: "#7c3aed",
                    bg: "rgba(124,58,237,.1)",
                  },
                  { label: "→", color: "#ccc", bg: "transparent", plain: true },
                  {
                    label: "Seller earns",
                    color: "#b8963e",
                    bg: "rgba(184,150,62,.1)",
                  },
                  { label: "→", color: "#ccc", bg: "transparent", plain: true },
                  {
                    label: "Faculty vetted it",
                    color: "#0f7173",
                    bg: "rgba(15,113,115,.1)",
                  },
                ].map((item, i) =>
                  item.plain ? (
                    <span key={i} style={{ fontSize: 18, color: "#ccc" }}>
                      →
                    </span>
                  ) : (
                    <span
                      key={i}
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        padding: "6px 12px",
                        background: item.bg,
                        color: item.color,
                        fontFamily: "'Lato',sans-serif",
                        border: `0.5px solid ${item.color}44`,
                      }}
                    >
                      {item.label}
                    </span>
                  ),
                )}
              </div>

              {/* Three cards */}
              {[
                {
                  color: "#7c3aed",
                  icon: "🎓",
                  title: "Student Network",
                  body: "128,000+ learners discover, buy, and request academic materials. They post Bounty requests that incentivise sellers to fill gaps in the library.",
                },
                {
                  color: GOLD,
                  icon: "📚",
                  title: "Seller Network",
                  body: "2,400+ verified sellers upload once and earn forever. They fulfil Bounty requests, earn 80% revenue share, and withdraw directly to their bank accounts.",
                },
                {
                  color: "#0f7173",
                  icon: "🏛️",
                  title: "Faculty Network",
                  body: "Verified lecturers and professors publish course materials, lend academic credibility to the library, and earn from their existing intellectual work.",
                },
              ].map((n) => (
                <div
                  key={n.title}
                  style={{
                    display: "flex",
                    gap: 14,
                    alignItems: "flex-start",
                    padding: "16px 18px",
                    marginBottom: 10,
                    border: "0.5px solid #e5ddd0",
                    borderLeft: `3px solid ${n.color}`,
                  }}
                >
                  <span style={{ fontSize: 22, flexShrink: 0 }}>{n.icon}</span>
                  <div>
                    <p
                      style={{
                        fontSize: 13,
                        fontWeight: 700,
                        color: NAVY,
                        fontFamily: "'Lato',sans-serif",
                        margin: "0 0 4px",
                      }}
                    >
                      {n.title}
                    </p>
                    <p
                      style={{
                        fontSize: 12,
                        color: "#777",
                        fontFamily: "'Lato',sans-serif",
                        lineHeight: 1.65,
                        margin: 0,
                      }}
                    >
                      {n.body}
                    </p>
                  </div>
                </div>
              ))}

              <div
                style={{
                  background: CREAM,
                  border: "0.5px solid rgba(184,150,62,.25)",
                  padding: "14px 16px",
                  marginTop: 16,
                }}
              >
                <p
                  style={{
                    fontSize: 12,
                    color: "#666",
                    fontFamily: "'Lato',sans-serif",
                    lineHeight: 1.7,
                    margin: 0,
                  }}
                >
                  <strong style={{ color: NAVY }}>Why this matters:</strong> No
                  single network works alone. Students drive demand. Sellers
                  supply materials. Faculty validate quality. Together they
                  create a self-sustaining knowledge economy — the largest of
                  its kind in Africa.
                </p>
              </div>
            </div>
          )}

          {/* STUDENT */}
          {activeTab === "student" && (
            <div style={{ padding: "24px 28px 28px" }}>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  background: "rgba(124,58,237,.1)",
                  border: "0.5px solid rgba(124,58,237,.3)",
                  padding: "4px 12px",
                  marginBottom: 14,
                }}
              >
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    color: "#7c3aed",
                    letterSpacing: ".12em",
                    textTransform: "uppercase",
                    fontFamily: "'Lato',sans-serif",
                  }}
                >
                  🎓 Student Network
                </span>
              </div>
              <h3
                style={{
                  fontFamily: "'Playfair Display',serif",
                  fontSize: 20,
                  fontWeight: 700,
                  color: NAVY,
                  margin: "0 0 8px",
                }}
              >
                Learn smarter. Connect deeper.
              </h3>
              <p
                style={{
                  fontSize: 13,
                  color: "#777",
                  lineHeight: 1.75,
                  fontFamily: "'Lato',sans-serif",
                  marginBottom: 20,
                }}
              >
                The student network is where academic discovery begins. Every
                document purchase, every bounty request, and every study group
                interaction feeds the broader ecosystem.
              </p>

              {/* Stats */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3,1fr)",
                  gap: 10,
                  marginBottom: 20,
                }}
              >
                {[
                  { val: "128K+", label: "Active learners" },
                  { val: "90M+", label: "Documents" },
                  { val: "200+", label: "Institutions" },
                ].map((s) => (
                  <div
                    key={s.label}
                    style={{
                      background: CREAM,
                      padding: "12px 14px",
                      textAlign: "center",
                      border: "0.5px solid #e5ddd0",
                    }}
                  >
                    <div
                      style={{
                        fontFamily: "'Playfair Display',serif",
                        fontSize: 20,
                        fontWeight: 700,
                        color: NAVY,
                      }}
                    >
                      {s.val}
                    </div>
                    <div
                      style={{
                        fontSize: 10,
                        color: "#aaa",
                        fontFamily: "'Lato',sans-serif",
                        marginTop: 2,
                      }}
                    >
                      {s.label}
                    </div>
                  </div>
                ))}
              </div>

              {[
                {
                  title: "Discover specialised content",
                  body: "Course-specific books, lecture notes, and past questions organised by university, department, course code, and level.",
                },
                {
                  title: "Post Bounty requests",
                  body: "If a document doesn't exist yet, students escrow a reward. Sellers race to fulfil it. Student approves, seller gets paid instantly.",
                },
                {
                  title: "Join study groups",
                  body: "Connect with peers studying the same course across different institutions. Share notes, strategies, and exam tips in real time.",
                },
                {
                  title: "AI tutor access",
                  body: "Get explanations, summaries, and study assistance directly within your purchased materials without leaving the platform.",
                },
              ].map((f) => (
                <div
                  key={f.title}
                  style={{
                    display: "flex",
                    gap: 12,
                    alignItems: "flex-start",
                    padding: "14px 0",
                    borderBottom: "0.5px solid #f5f0e8",
                  }}
                >
                  <div
                    style={{
                      width: 20,
                      height: 20,
                      background: "rgba(124,58,237,.12)",
                      border: "0.5px solid rgba(124,58,237,.25)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      marginTop: 2,
                    }}
                  >
                    <svg
                      width="10"
                      height="10"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#7c3aed"
                      strokeWidth="3"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                  <div>
                    <p
                      style={{
                        fontSize: 13,
                        fontWeight: 700,
                        color: NAVY,
                        fontFamily: "'Lato',sans-serif",
                        margin: "0 0 3px",
                      }}
                    >
                      {f.title}
                    </p>
                    <p
                      style={{
                        fontSize: 12,
                        color: "#777",
                        fontFamily: "'Lato',sans-serif",
                        lineHeight: 1.65,
                        margin: 0,
                      }}
                    >
                      {f.body}
                    </p>
                  </div>
                </div>
              ))}

              <a
                href="/students/network"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  marginTop: 20,
                  padding: "13px 24px",
                  background: "#7c3aed",
                  color: "#fff",
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: ".1em",
                  textTransform: "uppercase",
                  fontFamily: "'Lato',sans-serif",
                  textDecoration: "none",
                }}
              >
                Explore Student Network →
              </a>
            </div>
          )}

          {/* SELLER */}
          {activeTab === "seller" && (
            <div style={{ padding: "24px 28px 28px" }}>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  background: "rgba(184,150,62,.1)",
                  border: "0.5px solid rgba(184,150,62,.3)",
                  padding: "4px 12px",
                  marginBottom: 14,
                }}
              >
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    color: GOLD,
                    letterSpacing: ".12em",
                    textTransform: "uppercase",
                    fontFamily: "'Lato',sans-serif",
                  }}
                >
                  📚 Seller Network
                </span>
              </div>
              <h3
                style={{
                  fontFamily: "'Playfair Display',serif",
                  fontSize: 20,
                  fontWeight: 700,
                  color: NAVY,
                  margin: "0 0 8px",
                }}
              >
                Turn knowledge into income.
              </h3>
              <p
                style={{
                  fontSize: 13,
                  color: "#777",
                  lineHeight: 1.75,
                  fontFamily: "'Lato',sans-serif",
                  marginBottom: 20,
                }}
              >
                The seller network is the engine of the LAN economy. Graduates,
                students, and authors upload materials once and earn passively
                every time someone buys them.
              </p>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3,1fr)",
                  gap: 10,
                  marginBottom: 20,
                }}
              >
                {[
                  { val: "2,400+", label: "Verified sellers" },
                  { val: "85%", label: "Revenue share" },
                  { val: "₦500K", label: "Top monthly earn" },
                ].map((s) => (
                  <div
                    key={s.label}
                    style={{
                      background: CREAM,
                      padding: "12px 14px",
                      textAlign: "center",
                      border: "0.5px solid #e5ddd0",
                    }}
                  >
                    <div
                      style={{
                        fontFamily: "'Playfair Display',serif",
                        fontSize: 20,
                        fontWeight: 700,
                        color: NAVY,
                      }}
                    >
                      {s.val}
                    </div>
                    <div
                      style={{
                        fontSize: 10,
                        color: "#aaa",
                        fontFamily: "'Lato',sans-serif",
                        marginTop: 2,
                      }}
                    >
                      {s.label}
                    </div>
                  </div>
                ))}
              </div>

              {[
                {
                  title: "Upload once, earn forever",
                  body: "Set your price, publish your document, and earn every time a student purchases it. No active selling required after upload.",
                },
                {
                  title: "Fulfil Bounty requests",
                  body: "Browse open student requests with escrowed rewards. First seller to deliver a valid document claims the full payout.",
                },
                {
                  title: "Instant LAN wallet payouts",
                  body: "Earnings hit your wallet the moment a buyer purchases. Withdraw to any Nigerian bank account at any time with no hidden charges.",
                },
                {
                  title: "Seller dashboard",
                  body: "Track views, purchases, and earnings in real time. See which materials perform best and grow your catalogue strategically.",
                },
              ].map((f) => (
                <div
                  key={f.title}
                  style={{
                    display: "flex",
                    gap: 12,
                    alignItems: "flex-start",
                    padding: "14px 0",
                    borderBottom: "0.5px solid #f5f0e8",
                  }}
                >
                  <div
                    style={{
                      width: 20,
                      height: 20,
                      background: "rgba(184,150,62,.12)",
                      border: `0.5px solid ${GOLD}44`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      marginTop: 2,
                    }}
                  >
                    <svg
                      width="10"
                      height="10"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke={GOLD}
                      strokeWidth="3"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                  <div>
                    <p
                      style={{
                        fontSize: 13,
                        fontWeight: 700,
                        color: NAVY,
                        fontFamily: "'Lato',sans-serif",
                        margin: "0 0 3px",
                      }}
                    >
                      {f.title}
                    </p>
                    <p
                      style={{
                        fontSize: 12,
                        color: "#777",
                        fontFamily: "'Lato',sans-serif",
                        lineHeight: 1.65,
                        margin: 0,
                      }}
                    >
                      {f.body}
                    </p>
                  </div>
                </div>
              ))}

              <a
                href="/seller/network"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  marginTop: 20,
                  padding: "13px 24px",
                  background: GOLD,
                  color: NAVY,
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: ".1em",
                  textTransform: "uppercase",
                  fontFamily: "'Lato',sans-serif",
                  textDecoration: "none",
                }}
              >
                Explore Seller Network →
              </a>
            </div>
          )}

          {/* FACULTY */}
          {activeTab === "faculty" && (
            <div style={{ padding: "24px 28px 28px" }}>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  background: "rgba(15,113,115,.1)",
                  border: "0.5px solid rgba(15,113,115,.3)",
                  padding: "4px 12px",
                  marginBottom: 14,
                }}
              >
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    color: "#0f7173",
                    letterSpacing: ".12em",
                    textTransform: "uppercase",
                    fontFamily: "'Lato',sans-serif",
                  }}
                >
                  🏛️ Faculty Network
                </span>
              </div>
              <h3
                style={{
                  fontFamily: "'Playfair Display',serif",
                  fontSize: 20,
                  fontWeight: 700,
                  color: NAVY,
                  margin: "0 0 8px",
                }}
              >
                Publish beyond your classroom.
              </h3>
              <p
                style={{
                  fontSize: 13,
                  color: "#777",
                  lineHeight: 1.75,
                  fontFamily: "'Lato',sans-serif",
                  marginBottom: 20,
                }}
              >
                The faculty network brings academic authority to LAN Library.
                Verified lecturers and professors earn from the course materials
                they've already created — while lending credibility to
                everything around them.
              </p>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3,1fr)",
                  gap: 10,
                  marginBottom: 20,
                }}
              >
                {[
                  { val: "Verified", label: "Institution badge" },
                  { val: "Pan-Africa", label: "Student reach" },
                  { val: "Monthly", label: "Earnings paid" },
                ].map((s) => (
                  <div
                    key={s.label}
                    style={{
                      background: CREAM,
                      padding: "12px 14px",
                      textAlign: "center",
                      border: "0.5px solid #e5ddd0",
                    }}
                  >
                    <div
                      style={{
                        fontFamily: "'Playfair Display',serif",
                        fontSize: 16,
                        fontWeight: 700,
                        color: NAVY,
                      }}
                    >
                      {s.val}
                    </div>
                    <div
                      style={{
                        fontSize: 10,
                        color: "#aaa",
                        fontFamily: "'Lato',sans-serif",
                        marginTop: 2,
                      }}
                    >
                      {s.label}
                    </div>
                  </div>
                ))}
              </div>

              {[
                {
                  title: "Faculty verified badge",
                  body: "Your profile displays your institution, department, and rank. Students trust verified faculty materials above all others on the platform.",
                },
                {
                  title: "Publish course packs",
                  body: "Lecture notes, syllabi, past questions, and full course packs organised by course code, semester, and academic level.",
                },
                {
                  title: "Reach beyond your class",
                  body: "Your materials reach students at universities, polytechnics, and secondary schools across the continent — not just your own students.",
                },
                {
                  title: "Passive income from existing work",
                  body: "The intellectual effort is done. LAN connects it to the students who need it most, and pays you monthly with full earnings transparency.",
                },
              ].map((f) => (
                <div
                  key={f.title}
                  style={{
                    display: "flex",
                    gap: 12,
                    alignItems: "flex-start",
                    padding: "14px 0",
                    borderBottom: "0.5px solid #f5f0e8",
                  }}
                >
                  <div
                    style={{
                      width: 20,
                      height: 20,
                      background: "rgba(15,113,115,.12)",
                      border: "0.5px solid rgba(15,113,115,.3)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      marginTop: 2,
                    }}
                  >
                    <svg
                      width="10"
                      height="10"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#0f7173"
                      strokeWidth="3"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                  <div>
                    <p
                      style={{
                        fontSize: 13,
                        fontWeight: 700,
                        color: NAVY,
                        fontFamily: "'Lato',sans-serif",
                        margin: "0 0 3px",
                      }}
                    >
                      {f.title}
                    </p>
                    <p
                      style={{
                        fontSize: 12,
                        color: "#777",
                        fontFamily: "'Lato',sans-serif",
                        lineHeight: 1.65,
                        margin: 0,
                      }}
                    >
                      {f.body}
                    </p>
                  </div>
                </div>
              ))}

              <a
                href="/faculty/network"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  marginTop: 20,
                  padding: "13px 24px",
                  background: "#0f7173",
                  color: "#fff",
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: ".1em",
                  textTransform: "uppercase",
                  fontFamily: "'Lato',sans-serif",
                  textDecoration: "none",
                }}
              >
                Explore Faculty Network →
              </a>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}

export default NetworkModal;
