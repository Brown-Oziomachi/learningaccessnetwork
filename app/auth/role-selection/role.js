"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  GraduationCap,
  Store,
  UserSquare2,
  X,
  Loader2,
  CheckCircle,
  ArrowRight,
  Sparkles,
  BadgeCheck,
} from "lucide-react";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebaseConfig";
import { AFRICAN_UNIVERSITIES } from "@/lib/africanUniversities";

const NAVY = "#0d2244";
const GOLD = "#b8963e";
const GOLDD = "#d4aa5a";
const CREAM = "#f5f0e8";
const BG = "#f5f1ea";

const STUDENT_ROLES = [
  { id: "undergraduate", label: "Undergraduate", desc: "First degree student at a university or college", years: ["Year 1", "Year 2", "Year 3", "Year 4+"] },
  { id: "postgraduate", label: "Postgraduate", desc: "Master's, MBA, or coursework graduate student", years: ["Year 1", "Year 2", "Year 3+"] },
  { id: "researcher", label: "PhD / Researcher", desc: "Doctoral candidate or academic researcher", years: ["1st year", "2nd year", "3rd year", "4th year+"] },
  { id: "professional", label: "Professional Learner", desc: "Taking courses or certifications while working", years: ["Part-time", "Full-time"] },
];

const DEPARTMENTS = [
  "Accounting", "Agriculture", "Architecture", "Biochemistry",
  "Biological Sciences", "Business Administration", "Chemical Engineering",
  "Chemistry", "Civil Engineering", "Computer Science", "Criminology",
  "Economics", "Education", "Electrical Engineering", "English",
  "Environmental Science", "Fine Arts", "Food Science & Technology",
  "Geography", "History & International Studies", "Industrial Chemistry",
  "Information Technology", "Law", "Linguistics",
  "Marine Engineering", "Mass Communication", "Mathematics",
  "Mechanical Engineering", "Medicine & Surgery", "Microbiology",
  "Music", "Nursing", "Optometry", "Pharmacy", "Physics",
  "Political Science", "Psychology", "Public Administration",
  "Public Health", "Religious Studies", "Social Work", "Sociology",
  "Software Engineering", "Statistics", "Theatre Arts",
  "Urban & Regional Planning", "Veterinary Medicine", "Other",
];

/* ─────────────────────────── BADGE COMPONENT ─────────────────────────── */
/**
 * <VerifiedFacultyBadge /> — drop this next to a lecturer's name
 * anywhere in the app (book details page, University Hub, etc.)
 */
export function VerifiedFacultyBadge({ compact = false }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: compact ? "4px" : "5px",
        background: "linear-gradient(135deg, #0d2244 0%, #1a3560 100%)",
        color: "#d4aa5a",
        padding: compact ? "2px 8px" : "4px 10px",
        fontSize: compact ? "9px" : "10px",
        fontWeight: 700,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        fontFamily: "'Lato', sans-serif",
        border: "1px solid rgba(184,150,62,0.35)",
        whiteSpace: "nowrap",
      }}
    >
      <BadgeCheck size={compact ? 10 : 12} style={{ flexShrink: 0 }} />
      Verified Faculty
    </span>
  );
}

/* ─────────────────────────── MAIN COMPONENT ─────────────────────────── */

export default function RoleSelectionClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const emailParam = searchParams.get("email");
  const refParam = searchParams.get("referral_code");

  /* ── nav state ── */
  const [step, setStep] = useState("landing"); // landing | student | lecturer
  const [manualRef, setManualRef] = useState(refParam || "");
  /* ── student state ── */
  const [selectedRole, setSelectedRole] = useState("");
  const [studentSubRole, setStudentSubRole] = useState("");
  const [studyLevel, setStudyLevel] = useState("");
  const [fieldOfStudy, setFieldOfStudy] = useState("");
  const [institution, setInstitution] = useState("");
  const [uniSearch, setUniSearch] = useState("");
  const [studentUniSearch, setStudentUniSearch] = useState("");
  const [lecturerUniSlug, setLecturerUniSlug] = useState("");
  const [lecturerDepartment, setLecturerDepartment] = useState("");
  const [lecturerTitle, setLecturerTitle] = useState("");
  const [selectedUniversity, setSelectedUniversity] = useState("");
  /* ── misc ── */
  const [isSubmitting, setIsSubmitting] = useState(false);

  /* ─── helpers ─── */
  const buildQuery = (extra = {}) => {
    const params = new URLSearchParams();
    if (emailParam) params.append("email", emailParam);
    if (manualRef) params.append("referral_code", manualRef);  // ← use manualRef not refParam
    Object.entries(extra).forEach(([k, v]) => v && params.append(k, v));
    const str = params.toString();
    return str ? `?${str}` : "";
  };

  /* ─── landing handlers ─── */
  const handleLandingCardClick = (role) => {
    setSelectedRole(prev => prev === role ? "" : role);
  };

  const handleLandingContinue = () => {
    if (selectedRole === "student") { setStep("student"); return; }
    if (selectedRole === "lecturer") { setStep("lecturer"); return; }
    if (manualRef) sessionStorage.setItem("referredBy", manualRef);
    if (selectedRole === "seller") {
      sessionStorage.setItem("userRole", "seller");
      if (refParam) sessionStorage.setItem("referredBy", refParam);
router.push(`/auth/create-account${buildQuery({ role: "seller" })}`);
    }
  };

  /* ─── student handlers ─── */
  const handleStudentSubRoleClick = (id) => { setStudentSubRole(id); setStudyLevel(""); };

  const handleStudentContinue = () => {
    if (!studentSubRole || !studyLevel) return;
    sessionStorage.setItem("userRole", "student");
    sessionStorage.setItem("studentSubRole", studentSubRole);
    sessionStorage.setItem("studyLevel", studyLevel);
    if (fieldOfStudy) sessionStorage.setItem("fieldOfStudy", fieldOfStudy);
    if (institution) sessionStorage.setItem("institution", institution);
    if (refParam) sessionStorage.setItem("referredBy", refParam);
    router.push(`/auth/create-account${buildQuery({ role: "student", sub_role: studentSubRole, level: studyLevel })}`);
  };

  /* ─── lecturer handlers ─── */
  const handleLecturerContinue = () => {
    if (!selectedUniversity || !lecturerDepartment) return;

    sessionStorage.setItem("userRole", "lecturer");
    sessionStorage.setItem("isLecturer", "true");
    sessionStorage.setItem("institutionSlug", lecturerUniSlug);
    sessionStorage.setItem("department", lecturerDepartment);
    sessionStorage.setItem("selectedUniversity", selectedUniversity);
    sessionStorage.setItem("institution", selectedUniversity); // ✅ ADD THIS
    if (lecturerTitle) sessionStorage.setItem("lecturerTitle", lecturerTitle);
    if (refParam) sessionStorage.setItem("referredBy", refParam);

    router.push(
      `/auth/create-account${buildQuery({
        role: "lecturer",
        institution: selectedUniversity, // ✅ ADD THIS
        institutionSlug: lecturerUniSlug,
        department: lecturerDepartment,
        lecturerTitle: lecturerTitle,
        selectedUniversity: selectedUniversity,
      })}`
    );
  };

  /* derived */
  const activeStudentRole = STUDENT_ROLES.find(r => r.id === studentSubRole);
  const activeUniversityName = selectedUniversity;
  /* ═══════════════════════ RENDER ═══════════════════════ */
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400&family=Lato:wght@300;400;700&display=swap');

        .rs-root { font-family:'Lato',sans-serif; background:${BG}; min-height:100vh; }
        .rs-serif { font-family:'Playfair Display',Georgia,serif; }

        /* ── cards ── */
        .rs-card {
          background:#fff; border:1px solid #e5ddd0; padding:28px 24px;
          cursor:pointer; position:relative; text-align:left;
          transition:transform .22s cubic-bezier(.4,0,.2,1),box-shadow .22s,border-color .22s;
        }
        .rs-card:hover         { transform:translateY(-5px); box-shadow:0 16px 40px rgba(13,34,68,.1); border-color:${GOLD}; }
        .rs-card.selected      { border:2px solid ${NAVY}; box-shadow:0 12px 32px rgba(13,34,68,.14); }
        .rs-card.selected-gold { border:2px solid ${GOLD}; }
        .rs-card.selected-purple{ border:2px solid #7c3aed; box-shadow:0 12px 32px rgba(124,58,237,.14); }
        .rs-card.disabled      { opacity:.65; cursor:default; }
        .rs-card.disabled:hover{ transform:none; box-shadow:none; border-color:#e5ddd0; }

        .rs-sub-card {
          background:#fff; border:1px solid #e5ddd0; padding:20px 18px;
          cursor:pointer; position:relative; text-align:left;
          transition:transform .2s,border-color .2s;
        }
        .rs-sub-card:hover    { transform:translateY(-2px); border-color:rgba(13,34,68,.3); }
        .rs-sub-card.selected { border:2px solid ${NAVY}; }

        /* ── pills ── */
        .rs-year-pill {
          padding:7px 16px; border:1px solid #e5ddd0; background:#fff;
          font-family:'Lato',sans-serif; font-size:11px; font-weight:700;
          color:#999; cursor:pointer; letter-spacing:.04em; transition:all .18s;
        }
        .rs-year-pill:hover  { border-color:${NAVY}; color:${NAVY}; }
        .rs-year-pill.active { background:${NAVY}; color:#fff; border-color:${NAVY}; }

        /* ── inputs ── */
        .rs-input,.rs-select {
          width:100%; padding:11px 14px; border:1px solid #e5ddd0;
          font-family:'Lato',sans-serif; font-size:13px; color:${NAVY};
          background:#fff; outline:none; transition:border-color .18s;
          box-sizing:border-box;
        }
        .rs-input:focus,.rs-select:focus { border-color:${NAVY}; }

        /* ── buttons ── */
        .rs-btn-primary {
          display:inline-flex; align-items:center; gap:8px;
          padding:13px 32px; background:${NAVY}; color:#fff;
          font-family:'Lato',sans-serif; font-size:12px; font-weight:700;
          letter-spacing:.06em; text-transform:uppercase; border:none; cursor:pointer;
          transition:background .18s;
        }
        .rs-btn-primary:hover    { background:#1a3560; }
        .rs-btn-primary:disabled { opacity:.35; cursor:not-allowed; }
        .rs-btn-primary.purple   { background:#7c3aed; }
        .rs-btn-primary.purple:hover { background:#6d28d9; }

        .rs-btn-outline {
          display:inline-flex; align-items:center; gap:8px;
          padding:13px 28px; border:1px solid ${NAVY}; color:${NAVY};
          font-family:'Lato',sans-serif; font-size:12px; font-weight:700;
          letter-spacing:.06em; text-transform:uppercase; background:#fff; cursor:pointer;
          transition:background .18s;
        }
        .rs-btn-outline:hover { background:rgba(13,34,68,.05); }

        /* ── divider ── */
        .rs-divider { display:flex; align-items:center; gap:14px; margin:32px 0; }
        .rs-divider::before,.rs-divider::after { content:''; flex:1; height:1px; background:rgba(184,150,62,.25); }
        .rs-diamond { width:8px; height:8px; background:${GOLD}; transform:rotate(45deg); flex-shrink:0; }

        .rs-check {
          position:absolute; top:12px; left:12px; width:22px; height:22px;
          background:${NAVY}; display:flex; align-items:center; justify-content:center;
        }

        /* ── animations ── */
        @keyframes rs-slide-up { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        .rs-anim { animation:rs-slide-up .3s cubic-bezier(.4,0,.2,1) both; }

        @keyframes dot-pulse { 0%,100%{opacity:1} 50%{opacity:.4} }
        .live-dot { width:6px; height:6px; border-radius:50%; background:#22c55e; display:inline-block; animation:dot-pulse 1.8s infinite; }

        /* ── lecturer banner ── */
        .lec-banner {
          background:linear-gradient(135deg,#4c1d95 0%,#7c3aed 100%);
          border:1px solid rgba(124,58,237,.4); padding:16px 20px;
          display:flex; align-items:center; gap:14px; margin-bottom:28px;
        }

        @keyframes spin { to { transform:rotate(360deg); } }

        /* ── role cards grid ── */
        .rs-role-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 12px;
        }
        @media (min-width: 1024px) {
          .rs-role-grid {
            grid-template-columns: repeat(3, 1fr);
            gap: 24px;
          }
        }

        /* ── ensure cards stretch full width on mobile ── */
        .rs-role-grid .rs-card {
          min-width: 0;
          flex: none;
        }
      `}</style>

      <div className="rs-root">

        {/* ══════════════════ STEP: LANDING ══════════════════ */}
        {step === "landing" && (
          <div style={{ padding: "72px 24px" }}>
            <div style={{ maxWidth: "820px", margin: "0 auto" }}>

              {/* Eyebrow */}
              <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "rgba(184,150,62,.12)", border: "1px solid rgba(184,150,62,.28)", padding: "7px 16px", marginBottom: "24px" }}>
                <Sparkles size={12} style={{ color: GOLD }} />
                <span style={{ fontSize: "10px", fontWeight: 700, letterSpacing: ".18em", textTransform: "uppercase", color: GOLDD }}>Join Africa's #1 Student Library</span>
              </div>

              <h1 className="rs-serif" style={{ fontSize: "clamp(32px,5vw,52px)", fontWeight: 900, color: NAVY, margin: "0 0 12px", lineHeight: 1.05 }}>
                How would you like to<br />
                <em style={{ color: GOLD }}>use LAN Library?</em>
              </h1>
              <p style={{ fontSize: "15px", color: "#888", fontWeight: 300, marginBottom: "8px", lineHeight: 1.7 }}>
                Select an option below to get started on your academic journey
              </p>

              {refParam && (
                <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "rgba(22,163,74,.08)", border: "1px solid rgba(22,163,74,.2)", padding: "7px 16px", marginTop: "12px" }}>
                  <span style={{ fontSize: "11px", fontWeight: 700, color: "#16a34a", letterSpacing: ".06em" }}>You were invited by a friend</span>
                </div>
              )}

              <div className="rs-divider"><div className="rs-diamond" /></div>

              {/* ── Role Cards ── */}
              <div className="flex flex-col gap-3 lg:flex-row lg:gap-6">
                {/* STUDENT */}
                <div
                  className={`rs-card flex-1${selectedRole === "student" ? " selected" : ""}`}                 
                  onClick={() => handleLandingCardClick("student")}
                >
                  <div style={{ position: "absolute", top: "12px", right: "12px", display: "flex", alignItems: "center", gap: "5px" }}>
                    <span className="live-dot" />
                    <span style={{ fontSize: "9px", fontWeight: 700, color: "#16a34a", letterSpacing: ".12em" }}>LIVE</span>
                  </div>
                  <div style={{ width: "48px", height: "48px", background: "rgba(13,34,68,.05)", border: "1px solid #e5ddd0", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "16px" }}>
                    <GraduationCap size={22} style={{ color: NAVY }} />
                  </div>
                  <h3 className="rs-serif" style={{ fontSize: "16px", fontWeight: 700, color: "#000", margin: "0 0 8px" }}>Student</h3>
                  <p style={{ fontSize: "12px", color: "#888", lineHeight: 1.6 }}>Access premium academic materials, past questions, and lecture notes for your studies</p>
                </div>

                {/* SELLER */}
                <div
              className={`rs-card flex-1${selectedRole === "seller" ? " selected-gold" : ""}`}                  
              onClick={() => handleLandingCardClick("seller")}
                >
                  <div style={{ position: "absolute", top: "12px", right: "12px", display: "flex", alignItems: "center", gap: "5px" }}>
                    <span className="live-dot" />
                    <span style={{ fontSize: "9px", fontWeight: 700, color: "#16a34a", letterSpacing: ".12em" }}>LIVE</span>
                  </div>
                  <div style={{ width: "48px", height: "48px", background: "rgba(184,150,62,.1)", border: "1px solid #e5ddd0", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "16px" }}>
                    <Store size={22} style={{ color: GOLD }} />
                  </div>
                  <h3 className="rs-serif" style={{ fontSize: "16px", fontWeight: 700, color: "#000", margin: "0 0 8px" }}>Seller</h3>
                  <p style={{ fontSize: "12px", color: "#888", lineHeight: 1.6 }}>Monetise your books and research. Earn 80% revenue on every sale</p>
                </div>

                {/* LECTURER / FACULTY ← repurposed "Institution" card */}
                <div
                className={`rs-card flex-1${selectedRole === "lecturer" ? " selected-purple" : ""}`}                  
                onClick={() => handleLandingCardClick("lecturer")}
                >
                  <div style={{ position: "absolute", top: "12px", right: "12px", display: "flex", alignItems: "center", gap: "5px" }}>
                    <span className="live-dot" />
                    <span style={{ fontSize: "9px", fontWeight: 700, color: "#16a34a", letterSpacing: ".12em" }}>LIVE</span>
                  </div>
                  <div style={{ width: "48px", height: "48px", background: "rgba(124,58,237,.08)", border: "1px solid #ede9fe", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "16px" }}>
                    <UserSquare2 size={22} style={{ color: "#7c3aed" }} />
                  </div>
                  <h3 className="rs-serif" style={{ fontSize: "16px", fontWeight: 700, color: "#000", margin: "0 0 8px" }}>Lecturer / Faculty</h3>
                  <p style={{ fontSize: "12px", color: "#888", lineHeight: 1.6 }}>
                    Share your course materials &amp; earn revenue. Get a&nbsp;
                    <strong style={{ color: "#7c3aed" }}>Verified Faculty</strong> badge on your profile
                  </p>
                </div>
              </div>

              {/* Referral Code Input */}
              <div style={{ marginTop: "28px", maxWidth: "320px" }}>
                <label style={{
                  display: "block", fontSize: "10px", fontWeight: 700,
                  letterSpacing: ".14em", textTransform: "uppercase",
                  color: "#bbb", marginBottom: "8px"
                }}>
                  Referral Code <span style={{ fontWeight: 400, color: "#ccc" }}>(optional)</span>
                </label>
                <div style={{ position: "relative" }}>
                  <input
                    className="rs-input"
                    type="text"
                    placeholder="e.g. abcde123456"
                    value={manualRef}
                    onChange={e => setManualRef(e.target.value.trim())}
                    style={{ paddingRight: manualRef ? "36px" : "14px" }}
                  />
                  {manualRef && (
                    <button
                      onClick={() => setManualRef("")}
                      style={{
                        position: "absolute", right: "10px", top: "50%",
                        transform: "translateY(-50%)", background: "none",
                        border: "none", cursor: "pointer", color: "#aaa", padding: "4px"
                      }}
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>
                {manualRef && (
                  <div style={{
                    marginTop: "6px", display: "inline-flex", alignItems: "center", gap: "6px",
                    background: "rgba(22,163,74,.07)", border: "1px solid rgba(22,163,74,.2)",
                    padding: "4px 10px"
                  }}>
                    <span style={{ fontSize: "10px", fontWeight: 700, color: "#16a34a" }}>
                      ✓ Referral code applied
                    </span>
                  </div>
                )}
              </div>

              {/* CTA */}
              {(selectedRole === "student" || selectedRole === "seller" || selectedRole === "lecturer") && (
                <div className="rs-anim" style={{ marginTop: "32px" }}>
                  <button
                    className={`rs-btn-primary${selectedRole === "lecturer" ? " purple" : ""}`}
                    onClick={handleLandingContinue}
                  >
                    Continue to Registration
                    <ArrowRight size={14} />
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ══════════════════ STEP: STUDENT ══════════════════ */}
        {step === "student" && (
          <div style={{ padding: "72px 24px" }}>
            <div style={{ maxWidth: "820px", margin: "0 auto" }}>

              <button className="rs-btn-outline" style={{ marginBottom: "36px", fontSize: "11px", padding: "9px 20px" }}
                onClick={() => { setStep("landing"); setStudentSubRole(""); setStudyLevel(""); }}>
                ← Back
              </button>

              <h1 className="rs-serif" style={{ fontSize: "clamp(28px,4vw,42px)", fontWeight: 900, color: NAVY, margin: "0 0 8px", lineHeight: 1.05 }}>
                What kind of student<br /><em style={{ color: GOLD }}>are you?</em>
              </h1>
              <p style={{ fontSize: "14px", color: "#888", fontWeight: 300, marginBottom: "8px" }}>Select the option that best matches your academic situation</p>

              <div className="rs-divider"><div className="rs-diamond" /></div>

              <p style={{ fontSize: "10px", fontWeight: 700, letterSpacing: ".18em", textTransform: "uppercase", color: GOLD, marginBottom: "14px" }}>Academic Level</p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "28px" }}>
                {STUDENT_ROLES.map(role => (
                  <div key={role.id} className={`rs-sub-card${studentSubRole === role.id ? " selected" : ""}`} onClick={() => handleStudentSubRoleClick(role.id)}>
                    {studentSubRole === role.id && (
                      <div className="rs-check" style={{ top: "10px", left: "10px", width: "20px", height: "20px" }}>
                        <svg width="10" height="10" viewBox="0 0 12 12" fill="none"><polyline points="2,6 5,9 10,3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                      </div>
                    )}
                    <h4 className="rs-serif" style={{ fontSize: "14px", fontWeight: 700, color: NAVY, margin: "0 0 5px" }}>{role.label}</h4>
                    <p style={{ fontSize: "12px", color: "#888", lineHeight: 1.6 }}>{role.desc}</p>
                  </div>
                ))}
              </div>

              {activeStudentRole && (
                <div className="rs-anim" style={{ marginBottom: "28px" }}>
                  <p style={{ fontSize: "10px", fontWeight: 700, letterSpacing: ".18em", textTransform: "uppercase", color: GOLD, marginBottom: "12px" }}>Year of Study</p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                    {activeStudentRole.years.map(yr => (
                      <button key={yr} className={`rs-year-pill${studyLevel === yr ? " active" : ""}`} onClick={() => setStudyLevel(yr)}>{yr}</button>
                    ))}
                  </div>
                </div>
              )}

              {studentSubRole && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "10px", fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", color: "#aaa", marginBottom: "6px" }}>Department / Field</label>
                    <select className="rs-select" value={fieldOfStudy} onChange={e => setFieldOfStudy(e.target.value)}>
                      <option value="">Select department…</option>
                      {DEPARTMENTS.map(d => <option key={d}>{d}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "10px", fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", color: "#aaa", marginBottom: "6px" }}>Institution</label>

                    {/* Search input */}
                    <div style={{ position: "relative", marginBottom: "8px" }}>
                      <input
                        className="rs-input"
                        type="text"
                        placeholder="Type to search universities…"
                        value={studentUniSearch}
                        required
                        onChange={e => setStudentUniSearch(e.target.value)}
                        style={{ paddingLeft: "38px" }}
                      />
                      <svg
                        style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", opacity: 0.35 }}
                        width="15" height="15" viewBox="0 0 24 24" fill="none"
                        stroke={NAVY} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                      >
                        <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                      </svg>
                      {studentUniSearch && (
                        <button
                          onClick={() => { setStudentUniSearch(""); setInstitution(""); }}
                          style={{
                            position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)",
                            background: "none", border: "none", cursor: "pointer", color: "#aaa", padding: "4px"
                          }}
                        >
                          <X size={13} />
                        </button>
                      )}
                    </div>

                    {/* Filtered list */}
                    {(() => {
                      const allUniversities = Object.entries(AFRICAN_UNIVERSITIES).map(([slug, u]) => ({ ...u, slug }));
                      const filtered = allUniversities.filter(u =>
                        u.name.toLowerCase().includes(studentUniSearch.toLowerCase()) ||
                        u.country.toLowerCase().includes(studentUniSearch.toLowerCase())
                      );
                      return studentUniSearch.length > 0 ? (
                        <div style={{
                          border: "1px solid #e5ddd0",
                          maxHeight: "200px",
                          overflowY: "auto",
                          background: "#fff",
                        }}>
                          {filtered.length === 0 ? (
                            <p style={{ padding: "14px", fontSize: "12px", color: "#aaa", textAlign: "center" }}>
                              No universities found for "<strong>{studentUniSearch}</strong>"
                            </p>
                          ) : filtered.map((uni, index) => {
                            const isSelected = institution === uni.name;
                            return (
                              <div
                                key={index}
                                onClick={() => {
                                  setInstitution(uni.name);
                                  setStudentUniSearch(uni.name);
                                }}
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "space-between",
                                  padding: "10px 14px",
                                  cursor: "pointer",
                                  borderBottom: "1px solid #f0ebe2",
                                  background: isSelected ? "rgba(13,34,68,.04)" : "#fff",
                                  borderLeft: isSelected ? `3px solid ${NAVY}` : "3px solid transparent",
                                  transition: "background .15s",
                                }}
                                onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = "#faf8f4"; }}
                                onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = "#fff"; }}
                              >
                                <div>
                                  <p style={{ fontSize: "13px", fontWeight: isSelected ? 700 : 400, color: NAVY, margin: 0 }}>
                                    {uni.name}
                                  </p>
                                  <p style={{ fontSize: "11px", color: "#999", margin: "2px 0 0" }}>
                                    {uni.country}
                                  </p>
                                </div>
                                {isSelected && (
                                  <div style={{
                                    width: "18px", height: "18px", background: NAVY,
                                    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0
                                  }}>
                                    <svg width="9" height="9" viewBox="0 0 12 12" fill="none">
                                      <polyline points="2,6 5,9 10,3" stroke="white" strokeWidth="1.8"
                                        strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      ) : null;
                    })()}

                    {/* Selected summary pill */}
                    {institution && (
                      <div style={{
                        marginTop: "8px", display: "inline-flex", alignItems: "center", gap: "8px",
                        background: "rgba(13,34,68,.05)", border: `1px solid ${NAVY}`,
                        padding: "5px 12px",
                      }}>
                        <CheckCircle size={12} style={{ color: NAVY }} />
                        <span style={{ fontSize: "11px", fontWeight: 700, color: NAVY }}>{institution}</span>
                        <button
                          onClick={() => { setInstitution(""); setStudentUniSearch(""); }}
                          style={{ background: "none", border: "none", cursor: "pointer", color: "#aaa", padding: "0 0 0 4px", lineHeight: 1 }}
                        >
                          <X size={11} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderTop: "1px solid #e5ddd0", paddingTop: "24px", flexWrap: "wrap", gap: "16px" }}>
                <p style={{ fontSize: "13px", color: "#999" }}>
                  {studentSubRole && studyLevel
                    ? <><strong style={{ color: NAVY }}>{activeStudentRole?.label}</strong> · {studyLevel}</>
                    : studentSubRole ? "Pick your year of study to continue" : ""}
                </p>
                <button className="rs-btn-primary" onClick={handleStudentContinue} disabled={!studentSubRole || !institution || !fieldOfStudy || !studyLevel}>
                  Continue to Registration <ArrowRight size={14} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════ STEP: LECTURER ══════════════════ */}
        {step === "lecturer" && (
          <div style={{ padding: "72px 24px" }}>
            <div style={{ maxWidth: "820px", margin: "0 auto" }}>

              <button className="rs-btn-outline" style={{ marginBottom: "36px", fontSize: "11px", padding: "9px 20px" }}
                onClick={() => { setStep("landing"); setLecturerUniSlug(""); setLecturerDepartment(""); setLecturerTitle(""); }}>
                ← Back
              </button>

              {/* Header */}
              <div style={{ marginBottom: "6px" }}>
                <VerifiedFacultyBadge />
              </div>
              <h1 className="rs-serif" style={{ fontSize: "clamp(28px,4vw,42px)", fontWeight: 900, color: NAVY, margin: "12px 0 8px", lineHeight: 1.05 }}>
                Lecturer &amp; Faculty<br /><em style={{ color: "#7c3aed" }}>Registration</em>
              </h1>
              <p style={{ fontSize: "14px", color: "#888", fontWeight: 300, marginBottom: "8px", lineHeight: 1.7 }}>
                Join LAN Library as a verified faculty member. Your uploaded materials will carry a&nbsp;
                <strong style={{ color: "#7c3aed" }}>Verified Faculty</strong> badge — building trust with students instantly.
              </p>

              <div className="rs-divider"><div className="rs-diamond" /></div>

              {/* Lecturer benefits banner */}
              <div className="lec-banner rs-anim">
                <BadgeCheck size={28} style={{ color: "#d4aa5a", flexShrink: 0 }} />
                <div>
                  <p style={{ fontSize: "11px", fontWeight: 700, color: "rgba(255,255,255,.6)", letterSpacing: ".12em", textTransform: "uppercase", marginBottom: "4px" }}>Why register as Faculty?</p>
                  <p style={{ fontSize: "12px", color: "rgba(255,255,255,.85)", lineHeight: 1.65, margin: 0 }}>
                    Earn 80% revenue · Get a Verified Faculty badge · Feature in your University Hub · Rank on Google for your name + course
                  </p>
                </div>
              </div>

              {/* University selector */}
              <div style={{ marginBottom: "22px" }}>
                <p style={{
                  fontSize: "10px", fontWeight: 700, letterSpacing: ".18em",
                  textTransform: "uppercase", color: GOLD, marginBottom: "12px"
                }}>
                  Select Your University <span style={{ color: "#e5372a" }}>*</span>
                </p>

                {/* Search input */}
                <div style={{ position: "relative", marginBottom: "10px" }}>
                  <input
                    className="rs-input"
                    type="text"
                    placeholder="Type to search universities…"
                    value={uniSearch}
                    onChange={e => setUniSearch(e.target.value)}
                    style={{ paddingLeft: "38px" }}
                  />
                  <svg
                    style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", opacity: 0.35 }}
                    width="15" height="15" viewBox="0 0 24 24" fill="none"
                    stroke={NAVY} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                  >
                    <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                  {uniSearch && (
                    <button
                      onClick={() => setUniSearch("")}
                      style={{
                        position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)",
                        background: "none", border: "none", cursor: "pointer", color: "#aaa", padding: "4px"
                      }}
                    >
                      <X size={13} />
                    </button>
                  )}
                </div>

                {/* Filtered list */}
                {(() => {
                  const allUniversities = Object.entries(AFRICAN_UNIVERSITIES).map(([slug, u]) => ({ ...u, slug }));
                  const filtered = allUniversities.filter(u =>
                    u.name.toLowerCase().includes(uniSearch.toLowerCase()) ||
                    u.country.toLowerCase().includes(uniSearch.toLowerCase())
                  );
                  return (
                    <div style={{
                      border: "1px solid #e5ddd0",
                      maxHeight: "260px",
                      overflowY: "auto",
                      background: "#fff",
                    }}>
                      {filtered.length === 0 ? (
                        <p style={{ padding: "16px", fontSize: "12px", color: "#aaa", textAlign: "center" }}>
                          No universities found for "<strong>{uniSearch}</strong>"
                        </p>
                      ) : filtered.map((uni, index) => {
                        const isSelected = selectedUniversity === uni.name;
                        return (
                          <div
                            key={index}
                            onClick={() => {
                              setSelectedUniversity(uni.name);
                              setLecturerUniSlug(uni.slug ?? uni.name.toLowerCase().replace(/\s+/g, "-"));
                              setUniSearch(uni.name); // fill search box with selection
                            }}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              padding: "11px 14px",
                              cursor: "pointer",
                              borderBottom: "1px solid #f0ebe2",
                              background: isSelected ? "rgba(13,34,68,.04)" : "#fff",
                              borderLeft: isSelected ? `3px solid ${NAVY}` : "3px solid transparent",
                              transition: "background .15s",
                            }}
                            onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = "#faf8f4"; }}
                            onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = "#fff"; }}
                          >
                            <div>
                              <p style={{ fontSize: "13px", fontWeight: isSelected ? 700 : 400, color: NAVY, margin: 0 }}>
                                {uni.name}
                              </p>
                              <p style={{ fontSize: "11px", color: "#999", margin: "2px 0 0" }}>
                                {uni.country}
                              </p>
                            </div>
                            {isSelected && (
                              <div style={{
                                width: "18px", height: "18px", background: NAVY,
                                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0
                              }}>
                                <svg width="9" height="9" viewBox="0 0 12 12" fill="none">
                                  <polyline points="2,6 5,9 10,3" stroke="white" strokeWidth="1.8"
                                    strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}

                {/* Selected summary pill */}
                {selectedUniversity && (
                  <div style={{
                    marginTop: "8px", display: "inline-flex", alignItems: "center", gap: "8px",
                    background: "rgba(13,34,68,.05)", border: `1px solid ${NAVY}`,
                    padding: "5px 12px",
                  }}>
                    <CheckCircle size={12} style={{ color: NAVY }} />
                    <span style={{ fontSize: "11px", fontWeight: 700, color: NAVY }}>{selectedUniversity}</span>
                    <button
                      onClick={() => { setSelectedUniversity(""); setLecturerUniSlug(""); setUniSearch(""); }}
                      style={{ background: "none", border: "none", cursor: "pointer", color: "#aaa", padding: "0 0 0 4px", lineHeight: 1 }}
                    >
                      <X size={11} />
                    </button>
                  </div>
                )}
              </div>

              {/* Department + Title */}
              {lecturerUniSlug && (
                <div className="rs-anim" style={{ marginBottom: "28px" }}>
                  <p style={{ fontSize: "10px", fontWeight: 700, letterSpacing: ".18em", textTransform: "uppercase", color: GOLD, marginBottom: "12px" }}>
                    Your Details <span style={{ color: "#e5372a" }}>*</span>
                  </p>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                    <div>
                      <label style={{ display: "block", fontSize: "10px", fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", color: "#aaa", marginBottom: "6px" }}>
                        Department <span style={{ color: "#e5372a" }}>*</span>
                      </label>
                      <select className="rs-select" value={lecturerDepartment} onChange={e => setLecturerDepartment(e.target.value)}>
                        <option value="">Select department…</option>
                        {DEPARTMENTS.map(d => <option key={d}>{d}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "10px", fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", color: "#aaa", marginBottom: "6px" }}>
                        Title <span style={{ color: "#ccc", fontWeight: 400 }}>(optional)</span>
                      </label>
                      <select className="rs-select" value={lecturerTitle} onChange={e => setLecturerTitle(e.target.value)}>
                        <option value="">Select…</option>
                        {["Dr.", "Prof.", "Engr.", "Pharm.", "Barr.", "Lecturer"].map(t => (
                          <option key={t}>{t}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Preview badge */}
              {lecturerUniSlug && lecturerDepartment && (
                <div className="rs-anim" style={{ background: "#fff", border: "1px solid #e5ddd0", padding: "18px 22px", marginBottom: "28px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
                  <div>
                    <p style={{ fontSize: "10px", fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", color: "#bbb", marginBottom: "6px" }}>Your profile preview</p>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                      <span className="rs-serif" style={{ fontSize: "15px", fontWeight: 700, color: NAVY }}>{lecturerTitle} Faculty Member</span>
                      <VerifiedFacultyBadge compact />
                    </div>
                    <p style={{ fontSize: "12px", color: "#888", marginTop: "4px" }}>
                      {lecturerDepartment} · {activeUniversityName}
                    </p>
                  </div>
                </div>
              )}

              {/* Footer CTA */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderTop: "1px solid #e5ddd0", paddingTop: "24px", flexWrap: "wrap", gap: "16px" }}>
                <p style={{ fontSize: "13px", color: "#999" }}>
                  {lecturerUniSlug && lecturerDepartment
                    ? <><strong style={{ color: NAVY }}>{lecturerDepartment}</strong> · {activeUniversityName}</>
                    : lecturerUniSlug ? "Select your department to continue" : "Choose your university to continue"}
                </p>
                <button
                  className="rs-btn-primary purple"
                  onClick={handleLecturerContinue}
                  disabled={!lecturerUniSlug || !lecturerDepartment || !lecturerTitle}
                >
                  Continue to Registration <ArrowRight size={14} />
                </button>
              </div>

            </div>
          </div>
        )}
      </div>
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════
   FIRESTORE HELPERS
   ═══════════════════════════════════════════════════════════════

   Call `saveLecturerProfile` from your create-account page after
   Firebase Auth sign-up, passing the new user's uid.

   The `institutionSlug` is also written to every book the lecturer
   uploads via `addInstitutionSlugToBook`.
   ═══════════════════════════════════════════════════════════════ */

/**
 * Write lecturer fields to the `users/{uid}` document.
 *
 * @param {string} uid             - Firebase Auth UID
 * @param {{ institutionSlug: string, department: string, lecturerTitle?: string }} data
 */
export async function saveLecturerProfile(uid, { institutionSlug, department, lecturerTitle = "" }) {
  const { doc, setDoc, serverTimestamp } = await import("firebase/firestore");
  const { db } = await import("@/lib/firebaseConfig");

  await setDoc(
    doc(db, "users", uid),
    {
      isLecturer: true,
      institutionSlug,
      department,
      lecturerTitle,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}

/**
 * When a lecturer uploads a book, call this to stamp the book
 * document with the lecturer's institutionSlug so it shows up
 * in the University Hub automatically.
 *
 * @param {string} bookId
 * @param {string} institutionSlug
 */
export async function addInstitutionSlugToBook(bookId, institutionSlug) {
  const { doc, updateDoc } = await import("firebase/firestore");
  const { db } = await import("@/lib/firebaseConfig");

  await updateDoc(doc(db, "books", bookId), { institutionSlug });
}