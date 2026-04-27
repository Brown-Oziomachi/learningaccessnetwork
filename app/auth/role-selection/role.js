"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { GraduationCap, Store, Building2, X, Loader2, CheckCircle, ArrowRight, Sparkles } from "lucide-react";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebaseConfig";

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

const FIELDS_OF_STUDY = [
  "Arts & Humanities", "Business & Economics", "Engineering & Technology",
  "Health & Medicine", "Law", "Natural Sciences", "Social Sciences", "Education", "Other",
];

export default function RoleSelectionClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const emailParam = searchParams.get("email");
  const refParam = searchParams.get("referral_code");

  const [step, setStep] = useState("landing");
  const [selectedRole, setSelectedRole] = useState("");
  const [studentSubRole, setStudentSubRole] = useState("");
  const [studyLevel, setStudyLevel] = useState("");
  const [fieldOfStudy, setFieldOfStudy] = useState("");
  const [institution, setInstitution] = useState("");
  const [showWaitlist, setShowWaitlist] = useState(false);
  const [waitlistEmail, setWaitlistEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [waitlistSubmitted, setWaitlistSubmitted] = useState(false);

  const buildQuery = (extra = {}) => {
    const params = new URLSearchParams();
    if (emailParam) params.append("email", emailParam);
    if (refParam) params.append("referral_code", refParam);
    Object.entries(extra).forEach(([k, v]) => v && params.append(k, v));
    const str = params.toString();
    return str ? `?${str}` : "";
  };

  const handleLandingCardClick = (role) => {
    if (role === "university") { setShowWaitlist(true); return; }
    setSelectedRole(prev => prev === role ? "" : role);
  };

  const handleLandingContinue = () => {
    if (selectedRole === "student") { setStep("student"); return; }
    if (selectedRole === "seller") {
      sessionStorage.setItem("userRole", "seller");
      if (refParam) sessionStorage.setItem("referredBy", refParam);
      router.push(`/auth/create-account${buildQuery({ role: "seller" })}`);
    }
  };

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

  const handleWaitlistSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, "waitlist"), { email: waitlistEmail, roleRequested: "university", timestamp: serverTimestamp() });
      setWaitlistSubmitted(true);
      setTimeout(() => { setShowWaitlist(false); setWaitlistSubmitted(false); setWaitlistEmail(""); }, 3000);
    } catch { alert("Something went wrong. Please try again."); }
    setIsSubmitting(false);
  };

  const activeStudentRole = STUDENT_ROLES.find(r => r.id === studentSubRole);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400&family=Lato:wght@300;400;700&display=swap');
        .rs-root { font-family: 'Lato', sans-serif; background: ${BG}; min-height: 100vh; }
        .rs-serif { font-family: 'Playfair Display', Georgia, serif; }
        .rs-card {
          background: #fff; border: 1px solid #e5ddd0; padding: 28px 24px;
          cursor: pointer; position: relative; text-align: left;
          transition: transform 0.22s cubic-bezier(0.4,0,0.2,1), box-shadow 0.22s, border-color 0.22s;
        }
        .rs-card:hover { transform: translateY(-5px); box-shadow: 0 16px 40px rgba(13,34,68,0.1); border-color: ${GOLD}; }
        .rs-card.selected { border: 2px solid ${NAVY}; box-shadow: 0 12px 32px rgba(13,34,68,0.14); }
        .rs-card.selected-gold { border: 2px solid ${GOLD}; }
        .rs-card.disabled { opacity: 0.65; cursor: default; }
        .rs-card.disabled:hover { transform: none; box-shadow: none; border-color: #e5ddd0; }
        .rs-sub-card {
          background: #fff; border: 1px solid #e5ddd0; padding: 20px 18px;
          cursor: pointer; position: relative; text-align: left;
          transition: transform 0.2s, border-color 0.2s;
        }
        .rs-sub-card:hover { transform: translateY(-2px); border-color: rgba(13,34,68,0.3); }
        .rs-sub-card.selected { border: 2px solid ${NAVY}; }
        .rs-year-pill {
          padding: 7px 16px; border: 1px solid #e5ddd0; background: #fff;
          font-family: 'Lato', sans-serif; font-size: 11px; font-weight: 700;
          color: #999; cursor: pointer; letter-spacing: 0.04em;
          transition: all 0.18s;
        }
        .rs-year-pill:hover { border-color: ${NAVY}; color: ${NAVY}; }
        .rs-year-pill.active { background: ${NAVY}; color: #fff; border-color: ${NAVY}; }
        .rs-input, .rs-select {
          width: 100%; padding: 11px 14px; border: 1px solid #e5ddd0;
          font-family: 'Lato', sans-serif; font-size: 13px; color: ${NAVY};
          background: #fff; outline: none; transition: border-color 0.18s;
        }
        .rs-input:focus, .rs-select:focus { border-color: ${NAVY}; }
        .rs-btn-primary {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 13px 32px; background: ${NAVY}; color: #fff;
          font-family: 'Lato', sans-serif; font-size: 12px; font-weight: 700;
          letter-spacing: 0.06em; text-transform: uppercase; border: none; cursor: pointer;
          transition: background 0.18s;
        }
        .rs-btn-primary:hover { background: #1a3560; }
        .rs-btn-primary:disabled { opacity: 0.35; cursor: not-allowed; }
        .rs-btn-outline {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 13px 28px; border: 1px solid ${NAVY}; color: ${NAVY};
          font-family: 'Lato', sans-serif; font-size: 12px; font-weight: 700;
          letter-spacing: 0.06em; text-transform: uppercase; background: #fff; cursor: pointer;
          transition: background 0.18s;
        }
        .rs-btn-outline:hover { background: rgba(13,34,68,0.05); }
        .rs-divider { display: flex; align-items: center; gap: 14px; margin: 32px 0; }
        .rs-divider::before, .rs-divider::after { content: ''; flex: 1; height: 1px; background: rgba(184,150,62,0.25); }
        .rs-diamond { width: 8px; height: 8px; background: ${GOLD}; transform: rotate(45deg); flex-shrink: 0; }
        .rs-check { position: absolute; top: 12px; left: 12px; width: 22px; height: 22px; background: ${NAVY}; display: flex; align-items: center; justify-content: center; }
        @keyframes rs-slide-up { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        .rs-anim { animation: rs-slide-up 0.3s cubic-bezier(0.4,0,0.2,1) both; }
        @keyframes dot-pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        .live-dot { width: 6px; height: 6px; border-radius: 50%; background: #22c55e; display: inline-block; animation: dot-pulse 1.8s infinite; }
      `}</style>

      <div className="rs-root">
        {/* ── STEP: LANDING ── */}
        {step === "landing" && (
          <div style={{ padding: "72px 24px" }}>
            <div style={{ maxWidth: "820px", margin: "0 auto" }}>

              {/* Eyebrow */}
              <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "rgba(184,150,62,0.12)", border: "1px solid rgba(184,150,62,0.28)", padding: "7px 16px", marginBottom: "24px" }}>
                <Sparkles size={12} style={{ color: GOLD }} />
                <span style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: GOLDD }}>Join Africa's #1 Student Library</span>
              </div>

              <h1 className="rs-serif" style={{ fontSize: "clamp(32px,5vw,52px)", fontWeight: 900, color: NAVY, margin: "0 0 12px", lineHeight: 1.05 }}>
                How would you like to<br />
                <em style={{ color: GOLD }}>use LAN Library?</em>
              </h1>
              <p style={{ fontSize: "15px", color: "#888", fontWeight: 300, marginBottom: "8px", lineHeight: 1.7 }}>
                Select an option below to get started on your academic journey
              </p>

              {refParam && (
                <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "rgba(22,163,74,0.08)", border: "1px solid rgba(22,163,74,0.2)", padding: "7px 16px", marginTop: "12px" }}>
                  <span style={{ fontSize: "11px", fontWeight: 700, color: "#16a34a", letterSpacing: "0.06em" }}>You were invited by a friend</span>
                </div>
              )}

              <div className="rs-divider"><div className="rs-diamond" /></div>

              {/* Cards */}
             {/* Cards */}
<div
  className="flex lg:grid lg:grid-cols-3 gap-4 lg:gap-5 overflow-x-auto lg:overflow-visible pb-2"
  style={{
    scrollSnapType: "x mandatory",
  }}
>
  {/* STUDENT */}
  <div
    className={`rs-card min-w-[85%] sm:min-w-[70%] lg:min-w-0 scroll-snap-align-start ${
      selectedRole === "student" ? "selected" : ""
    }`}
    onClick={() => handleLandingCardClick("student")}
  >
    {/* LIVE */}
    <div className="absolute top-3 right-3 flex items-center gap-1">
      <span className="live-dot" />
      <span className="text-[9px] font-bold text-green-600 tracking-widest">
        LIVE
      </span>
    </div>

    <div className="w-12 h-12 bg-[#0d2244]/5 border border-[#e5ddd0] flex items-center justify-center mb-4">
      <GraduationCap size={22} style={{ color: NAVY }} />
    </div>

    <h3 className="rs-serif text-[16px] font-bold  mb-2 text-black">
      Student
    </h3>

    <p className="text-[12px] text-gray-500 leading-relaxed">
      Access premium academic materials, past questions, and lecture notes for your studies
    </p>
  </div>

  {/* SELLER */}
  <div
    className={`rs-card min-w-[85%] sm:min-w-[70%] lg:min-w-0 scroll-snap-align-start ${
      selectedRole === "seller" ? "selected-gold" : ""
    }`}
    onClick={() => handleLandingCardClick("seller")}
  >
    <div className="absolute top-3 right-3 flex items-center gap-1">
      <span className="live-dot" />
      <span className="text-[9px] font-bold text-green-600 tracking-widest">
        LIVE
      </span>
    </div>

    <div className="w-12 h-12 bg-[#b8963e]/10 border border-[#e5ddd0] flex items-center justify-center mb-4">
      <Store size={22} style={{ color: GOLD }} />
    </div>

    <h3 className="rs-serif text-[16px] font-bold mb-2 text-black">
      Seller
    </h3>

    <p className="text-[12px] text-gray-500 leading-relaxed">
      Monetise your books and research. Earn 80% revenue on every sale
    </p>
  </div>

  {/* INSTITUTION */}
  <div className="rs-card disabled min-w-[85%] sm:min-w-[70%] lg:min-w-0 scroll-snap-align-start">
    <div className="absolute top-3 right-3 bg-yellow-100 border border-yellow-200 px-2 py-1">
      <span className="text-[9px] font-bold text-yellow-700">
        COMING SOON
      </span>
    </div>

    <div className="w-12 h-12 bg-purple-50 border border-purple-100 flex items-center justify-center mb-4">
      <Building2 size={22} style={{ color: "#7c3aed" }} />
    </div>

    <h3 className="rs-serif text-[16px] font-bold text-black mb-2">
      Institution
    </h3>

    <p className="text-[12px] text-gray-500 leading-relaxed">
      Digital library management for universities and institutions
    </p>
  </div>
</div>

              {/* CTA */}
              {(selectedRole === "student" || selectedRole === "seller") && (
                <div className="rs-anim">
                  <button className="rs-btn-primary" onClick={handleLandingContinue}>
                    Continue to Registration
                    <ArrowRight size={14} />
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── STEP: STUDENT ── */}
        {step === "student" && (
          <div style={{ padding: "72px 24px" }}>
            <div style={{ maxWidth: "820px", margin: "0 auto" }}>

              <button
                className="rs-btn-outline"
                style={{ marginBottom: "36px", fontSize: "11px", padding: "9px 20px" }}
                onClick={() => { setStep("landing"); setStudentSubRole(""); setStudyLevel(""); }}
              >
                ← Back
              </button>

              <h1 className="rs-serif" style={{ fontSize: "clamp(28px,4vw,42px)", fontWeight: 900, color: NAVY, margin: "0 0 8px", lineHeight: 1.05 }}>
                What kind of student<br />
                <em style={{ color: GOLD }}>are you?</em>
              </h1>
              <p style={{ fontSize: "14px", color: "#888", fontWeight: 300, marginBottom: "8px" }}>Select the option that best matches your academic situation</p>

              <div className="rs-divider"><div className="rs-diamond" /></div>

              {/* Sub-role cards */}
              <p style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: GOLD, marginBottom: "14px" }}>Academic Level</p>
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

              {/* Year of study */}
              {activeStudentRole && (
                <div className="rs-anim" style={{ marginBottom: "28px" }}>
                  <p style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: GOLD, marginBottom: "12px" }}>Year of Study</p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                    {activeStudentRole.years.map(yr => (
                      <button key={yr} className={`rs-year-pill${studyLevel === yr ? " active" : ""}`} onClick={() => setStudyLevel(yr)}>{yr}</button>
                    ))}
                  </div>
                </div>
              )}

              {/* Optional fields */}
              {studentSubRole && (
                <div className="rs-anim" style={{ marginBottom: "32px" }}>
                  <p style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: "#bbb", marginBottom: "14px" }}>Optional Details</p>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                    <div>
                      <label style={{ display: "block", fontSize: "10px", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#aaa", marginBottom: "6px" }}>Field of Study</label>
                      <select className="rs-select" value={fieldOfStudy} onChange={e => setFieldOfStudy(e.target.value)}>
                        <option value="">Select a field…</option>
                        {FIELDS_OF_STUDY.map(f => <option key={f}>{f}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "10px", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#aaa", marginBottom: "6px" }}>Institution <span style={{ color: "#ddd" }}>(optional)</span></label>
                      <input className="rs-input" type="text" value={institution} onChange={e => setInstitution(e.target.value)} placeholder="University name…" />
                    </div>
                  </div>
                </div>
              )}

              {/* Footer */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderTop: "1px solid #e5ddd0", paddingTop: "24px", flexWrap: "wrap", gap: "16px" }}>
                <p style={{ fontSize: "13px", color: "#999" }}>
                  {studentSubRole && studyLevel ? (
                    <><strong style={{ color: NAVY }}>{activeStudentRole?.label}</strong> · {studyLevel}</>
                  ) : studentSubRole ? "Pick your year of study to continue" : ""}
                </p>
                <button className="rs-btn-primary" onClick={handleStudentContinue} disabled={!studentSubRole || !studyLevel}>
                  Continue to Registration
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── WAITLIST MODAL ── */}
        {showWaitlist && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(13,34,68,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50, padding: "24px" }}>
            <div style={{ background: "#fff", width: "100%", maxWidth: "460px", border: "1px solid #e5ddd0", overflow: "hidden" }}>
              {/* Header */}
              <div style={{ background: NAVY, padding: "24px 28px", display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                <div>
                  <p style={{ fontSize: "9px", fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(184,150,62,0.7)", marginBottom: "6px" }}>Institution Access</p>
                  <p className="rs-serif" style={{ fontSize: "20px", fontWeight: 700, color: "#fff" }}>Join the Waitlist</p>
                </div>
                <button onClick={() => setShowWaitlist(false)} style={{ background: "rgba(255,255,255,0.1)", border: "none", width: "32px", height: "32px", cursor: "pointer", color: "rgba(255,255,255,0.6)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <X size={15} />
                </button>
              </div>

              <div style={{ padding: "28px" }}>
                {!waitlistSubmitted ? (
                  <>
                    <div style={{ width: "48px", height: "48px", border: "1px solid #e5ddd0", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "18px" }}>
                      <Building2 size={22} style={{ color: "#7c3aed" }} strokeWidth={1.5} />
                    </div>
                    <p style={{ fontSize: "13px", color: "#888", lineHeight: 1.75, marginBottom: "24px", fontWeight: 300 }}>
                      Institution accounts are coming soon. Leave your email and we'll notify you the moment we're ready for universities.
                    </p>
                    <form onSubmit={handleWaitlistSubmit}>
                      <input
                        type="email" required placeholder="your@institution.edu"
                        value={waitlistEmail} onChange={e => setWaitlistEmail(e.target.value)}
                        className="rs-input" style={{ marginBottom: "12px" }}
                      />
                      <button type="submit" disabled={isSubmitting} className="rs-btn-primary" style={{ width: "100%", justifyContent: "center" }}>
                        {isSubmitting ? <><Loader2 size={14} style={{ animation: "spin 0.7s linear infinite" }} />Joining…</> : "Notify Me When Ready"}
                      </button>
                    </form>
                  </>
                ) : (
                  <div style={{ textAlign: "center", padding: "16px 0" }}>
                    <div style={{ width: "56px", height: "56px", border: "2px solid #16a34a", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
                      <CheckCircle size={28} style={{ color: "#16a34a" }} />
                    </div>
                    <h3 className="rs-serif" style={{ fontSize: "20px", color: NAVY, marginBottom: "8px" }}>You're on the list!</h3>
                    <p style={{ fontSize: "13px", color: "#888" }}>We'll reach out to <strong style={{ color: NAVY }}>{waitlistEmail}</strong> soon.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </>
  );
}