/**
 * FacultyTrustCard.jsx
 *
 * Drop this anywhere inside SellerProfileClient's About tab.
 * Props come from the `userData` object you fetch from Firestore `users/{uid}`.
 *
 * Usage:
 *   <FacultyTrustCard userData={userData} />
 *
 * Required additions to SellerProfileClient:
 *   1. Add `const [userData, setUserData] = useState(null);` to state
 *   2. Inside fetchSellerData, after `const ud = await getDoc(doc(db, "users", uid));`
 *      add: `if (ud.exists()) setUserData(ud.data());`
 *   3. In the About tab JSX, add: `<FacultyTrustCard userData={userData} />`
 */

"use client";

import { ExternalLink, ShieldCheck, Building2, BookMarked, CheckCircle2, Clock } from "lucide-react";

const NAVY  = "#0d2244";
const GOLD  = "#b8963e";
const GOLDD = "#d4aa5a";
const CREAM = "#f5f0e8";

/* ── tiny helpers ── */
const capitalize = (s = "") => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();

const formatVerifiedDate = (ts) => {
  if (!ts) return null;
  try {
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleDateString("en-NG", { day: "2-digit", month: "long", year: "numeric" });
  } catch { return null; }
};

/* ══════════════════════════════════════════════════════════
   FACULTY TRUST CARD
══════════════════════════════════════════════════════════ */
export default function FacultyTrustCard({ userData }) {
  if (!userData) return null;

  /* Only render for verified / pending faculty */
  const isFaculty =
    userData.isLecturer === true ||
    userData.role === "lecturer" ||
    userData.role === "seller" && userData.lecturerTitle;

  if (!isFaculty) return null;

  const isVerified      = userData.isVerifiedFaculty === true ||
                          userData.lecturerVerificationStatus === "approved";
  const isPending       = userData.lecturerVerificationStatus === "pending";
  const isActive        = (userData.status || userData.accountStatus || "active") === "active" &&
                          userData.isDeactivated !== true;

  const fullTitle       = `${userData.lecturerTitle || userData.title || ""} ${
    userData.displayName || userData.fullName || ""
  }`.trim();
  const institution     = userData.institution || userData.selectedUniversity || "";
  const department      = userData.department  || "";
  const facultyUrl      = userData.facultyProfileUrl || "";
  const verifiedDate    = formatVerifiedDate(userData.verifiedAt);
  const verifiedBy      = userData.verifiedBy || "LAN Library Compliance Team";

  return (
    <>
      <style>{`
        .ftc-root {
          background: #fff;
          border: 0.5px solid #e5ddd0;
          overflow: hidden;
          margin-bottom: 16px;
        }
        .ftc-verify-btn {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 11px 18px;
          background: ${NAVY}; color: #fff;
          font-size: 11px; font-weight: 700;
          letter-spacing: 0.08em; text-transform: uppercase;
          font-family: 'Lato', sans-serif;
          border: none; cursor: pointer; text-decoration: none;
          transition: background 0.18s;
          width: 100%; justify-content: center;
        }
        .ftc-verify-btn:hover { background: #1a3a6e; }
        @keyframes ftc-pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
      `}</style>

      <div className="ftc-root">

        {/* ── TOP ACCENT BAR ── */}
        <div style={{
          height: "3px",
          background: isVerified
            ? `linear-gradient(90deg, ${GOLD}, ${GOLDD}, ${GOLD})`
            : "repeating-linear-gradient(90deg, #e5ddd0 0, #e5ddd0 8px, transparent 8px, transparent 14px)",
        }} />

        <div style={{ padding: "20px 20px 0" }}>

          {/* ── SECTION LABEL ── */}
          <p style={{
            fontSize: "9px", fontWeight: 700, letterSpacing: "0.22em",
            textTransform: "uppercase", color: GOLD,
            fontFamily: "'Lato', sans-serif", marginBottom: "16px",
          }}>
            Faculty Trust Card
          </p>

          {/* ── HEADER: Name + badge ── */}
          <div style={{ display: "flex", alignItems: "flex-start", gap: "12px", marginBottom: "16px" }}>
            {/* Shield icon */}
            <div style={{
              width: "44px", height: "44px", flexShrink: 0,
              background: isVerified ? "rgba(184,150,62,0.1)" : "rgba(0,0,0,0.04)",
              border: `1px solid ${isVerified ? "rgba(184,150,62,0.3)" : "#e5ddd0"}`,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <ShieldCheck size={20} style={{ color: isVerified ? GOLD : "#ccc" }} />
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <h3 style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: "16px", fontWeight: 700, color: NAVY,
                margin: "0 0 6px", lineHeight: 1.2, wordBreak: "break-word",
              }}>
                {fullTitle || "Faculty Member"}
              </h3>

              {/* Status pills row */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>

                {/* Verified / Pending badge */}
                {isVerified ? (
                  <span style={{
                    display: "inline-flex", alignItems: "center", gap: "5px",
                    background: "rgba(22,163,74,0.1)", border: "0.5px solid rgba(22,163,74,0.3)",
                    padding: "3px 10px", borderRadius: "999px",
                    fontSize: "9px", fontWeight: 700, color: "#15803d",
                    fontFamily: "'Lato', sans-serif", letterSpacing: "0.08em", textTransform: "uppercase",
                  }}>
                    <CheckCircle2 size={9} style={{ color: "#16a34a" }} />
                    Verified Faculty
                  </span>
                ) : isPending ? (
                  <span style={{
                    display: "inline-flex", alignItems: "center", gap: "5px",
                    background: "rgba(245,158,11,0.1)", border: "0.5px solid rgba(245,158,11,0.3)",
                    padding: "3px 10px", borderRadius: "999px",
                    fontSize: "9px", fontWeight: 700, color: "#b45309",
                    fontFamily: "'Lato', sans-serif", letterSpacing: "0.08em", textTransform: "uppercase",
                  }}>
                    <Clock size={9} style={{ animation: "ftc-pulse 2s infinite" }} />
                    Pending Review
                  </span>
                ) : null}

                {/* Account status pill */}
                <span style={{
                  display: "inline-flex", alignItems: "center", gap: "5px",
                  background: isActive ? "rgba(22,163,74,0.08)" : "rgba(239,68,68,0.08)",
                  border: `0.5px solid ${isActive ? "rgba(22,163,74,0.25)" : "rgba(239,68,68,0.25)"}`,
                  padding: "3px 10px", borderRadius: "999px",
                  fontSize: "9px", fontWeight: 700,
                  color: isActive ? "#15803d" : "#dc2626",
                  fontFamily: "'Lato', sans-serif", letterSpacing: "0.08em", textTransform: "uppercase",
                }}>
                  <span style={{
                    width: "5px", height: "5px", borderRadius: "50%",
                    background: isActive ? "#16a34a" : "#dc2626",
                    animation: isActive ? "ftc-pulse 2s infinite" : "none",
                    display: "inline-block",
                  }} />
                  Account Status: {isActive ? "Active" : "Inactive"}
                </span>
              </div>
            </div>
          </div>

          {/* ── DIVIDER ── */}
          <div style={{ height: "0.5px", background: "#f0ebe0", marginBottom: "16px" }} />

          {/* ── AFFILIATION ROW ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "16px" }}>
            {institution && (
              <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
                <div style={{
                  width: "28px", height: "28px", flexShrink: 0,
                  background: CREAM, border: "0.5px solid #e5ddd0",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <Building2 size={13} style={{ color: GOLD }} />
                </div>
                <div>
                  <p style={{
                    fontSize: "9px", fontWeight: 700, letterSpacing: "0.16em",
                    textTransform: "uppercase", color: "#aaa",
                    fontFamily: "'Lato', sans-serif", margin: "0 0 2px",
                  }}>Institution</p>
                  <p style={{
                    fontFamily: "'Playfair Display', serif",
                    fontWeight: 700, fontSize: "13px", color: NAVY, margin: 0,
                  }}>{institution}</p>
                </div>
              </div>
            )}

            {department && (
              <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
                <div style={{
                  width: "28px", height: "28px", flexShrink: 0,
                  background: CREAM, border: "0.5px solid #e5ddd0",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <BookMarked size={13} style={{ color: GOLD }} />
                </div>
                <div>
                  <p style={{
                    fontSize: "9px", fontWeight: 700, letterSpacing: "0.16em",
                    textTransform: "uppercase", color: "#aaa",
                    fontFamily: "'Lato', sans-serif", margin: "0 0 2px",
                  }}>Department</p>
                  <p style={{
                    fontFamily: "'Playfair Display', serif",
                    fontWeight: 700, fontSize: "13px", color: NAVY, margin: 0,
                  }}>{department}</p>
                </div>
              </div>
            )}
          </div>

          {/* ── EXTERNAL PROOF BUTTON ── */}
          {facultyUrl && (
            <div style={{ marginBottom: "16px" }}>
              <a
                href={facultyUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="ftc-verify-btn"
              >
                <ShieldCheck size={13} />
                Verify on University Website
                <ExternalLink size={11} style={{ marginLeft: "auto", opacity: 0.7 }} />
              </a>
            </div>
          )}
        </div>

        {/* ── VERIFICATION FOOTER ── */}
        {isVerified && (
          <div style={{
            background: CREAM,
            borderTop: "0.5px solid rgba(184,150,62,0.2)",
            padding: "12px 20px",
            display: "flex", alignItems: "flex-start", gap: "8px",
          }}>
            <CheckCircle2 size={13} style={{ color: "#16a34a", flexShrink: 0, marginTop: "1px" }} />
            <p style={{
              fontSize: "10px", color: "#888", margin: 0,
              fontFamily: "'Lato', sans-serif", lineHeight: 1.6,
            }}>
              Identity and Faculty Status manually verified by{" "}
              <strong style={{ color: NAVY }}>LAN Library Compliance Team</strong>
              {verifiedDate ? (
                <> on <strong style={{ color: NAVY }}>{verifiedDate}</strong>.</>
              ) : "."}
            </p>
          </div>
        )}
      </div>
    </>
  );
}