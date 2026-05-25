"use client";

import React, { useState, useEffect, useCallback } from "react";
import { auth, db } from "@/lib/firebaseConfig";
import { storage } from "@/lib/firebaseStorage";
import { doc, getDoc } from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { getClaimedBounties } from "@/lib/bountyService";
import { linkBookToBounty } from "@/components/bountyEscrowService";
import { UNIVERSITIES_BY_COUNTRY, UNIVERSITY_COUNTRIES } from "@/lib/africanUniversities";

/* ─── Brand tokens ──────────────────────────────────────────── */
const NAVY = "#0d2244";
const GOLD = "#b8963e";
const GOLDD = "#d4aa5a";
const CREAM = "#f5f0e8";
const BG = "#f5f1ea";
const DARK = "#080f1e";

/* ─── Constants (mirrors AdvertiseClient) ───────────────────── */
const DOC_TYPES = [
  "Textbook", "Lecture Note", "Handwritten Notes", "Syllabus", "Course Outline",
  "Summary", "Study Guide", "Past Question", "WAEC Past Questions", "JAMB CBT Practice",
  "NECO Past Questions", "Post-UTME Past Questions", "Exam Revision", "Mock Exam",
  "Quiz Bank", "Assignment", "Reading List", "Mind Map", "Flashcards", "Cheat Sheet",
  "Annotated Bibliography", "Tutorial Sheet", "Thesis", "Research Proposal",
  "Seminar Paper", "Case Study", "Journal Article", "Literature Review",
  "Conference Paper", "Essay", "Dissertation Chapter", "Group Project Report",
  "Lab Manual", "Lab Report", "Technical Drawing", "Project", "Field Report",
  "Software Documentation", "Circuit Diagram", "Code Sample", "Algorithm Sheet",
  "Internship Report", "Medical Notes", "Law Case Brief", "Nursing Guide",
  "Accounting Workbook", "Engineering Formula Sheet", "Pharmacy Notes",
  "Presentation Slides", "Infographic", "Novel", "E-Book", "Biography",
  "Self-Help", "Children's Book", "Poetry Collection", "Memoir", "Short Stories",
  "Non-Fiction", "Recipe Book", "Culinary Notes", "Nutrition Guide", "Meal Plan",
  "Sacred Text", "Sermon Notes", "Theological Manuscript", "Religious Journal",
  "Prayer Book", "Bounty Fulfillment",
];

const SEMESTERS = ["First Semester", "Second Semester", "Both Semesters"];
const LEVELS = [
  { value: "100", label: "100 Level" }, { value: "200", label: "200 Level" },
  { value: "300", label: "300 Level" }, { value: "400", label: "400 Level" },
  { value: "500", label: "500 Level" }, { value: "pg", label: "Postgraduate" },
  { value: "ss1", label: "SS1" }, { value: "ss2", label: "SS2" }, { value: "ss3", label: "SS3" },
];
const DEPARTMENTS_BY_FACULTY = {
  "Sciences": ["Medicine & Health Sciences", "Pharmacy", "Nursing", "Biochemistry", "Microbiology", "Biology", "Chemistry", "Physics", "Mathematics", "Statistics", "Veterinary Medicine", "Dentistry", "Nutrition & Dietetics", "Optometry"],
  "Engineering & Technology": ["Computer Science", "Electrical Engineering", "Mechanical Engineering", "Civil Engineering", "Chemical Engineering", "Petroleum Engineering", "Architecture", "Information Technology", "Agricultural Engineering", "Environmental Engineering", "Mining Engineering"],
  "Arts & Social Sciences": ["Law", "Economics", "Accounting", "Business Administration", "Political Science", "Sociology", "Psychology", "Mass Communication", "History & International Studies", "Public Administration", "Geography", "Philosophy", "Linguistics"],
  "Humanities & Creative Arts": ["Literature", "Fine & Applied Arts", "Music", "Theatre & Performing Arts", "Languages & Linguistics", "Religious Studies"],
  "Agriculture & Environment": ["Agriculture", "Forestry & Wildlife", "Fisheries & Aquaculture", "Environmental Sciences", "Food Science & Technology"],
  "Education": ["Education", "Guidance & Counselling", "Early Childhood Education", "Special Education", "Physical & Health Education"],
  "Professional": ["Finance & Banking", "Insurance", "Estate Management", "Hospitality & Tourism", "Library & Information Science", "Quantity Surveying", "Urban & Regional Planning", "Social Work"],
};
const GENRES = ["Fiction", "Non-Fiction", "Biography", "Self-Help", "Academic", "Science", "History", "Philosophy", "Religion", "Technology", "Business", "Health"];

/* ─── Publish type options ──────────────────────────────────── */
const PUBLISH_TYPES = [
  { key: "textbook", label: "Textbook / Study Guide", description: "Upload a full textbook, summary guide, or comprehensive course material.", icon: "📘" },
  { key: "past_questions", label: "Past Exam Questions", description: "Share past examination questions with or without model answers.", icon: "📝" },
  { key: "lecture_notes", label: "Lecture Notes", description: "Upload typed or scanned lecture notes for a specific course.", icon: "📋" },
  { key: "bounty_fulfillment", label: "Fulfill a Bounty Request", description: "Deliver a paid student request. Your reward will be released upon admin approval.", icon: "🎯", badge: "PAID REQUEST", highlight: true },
];

/* ─── Icons ─────────────────────────────────────────────────── */
const ChevronRight = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6" /></svg>;
const ChevronLeft = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6" /></svg>;
const CheckIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>;
const AlertIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>;
const UploadIcon = () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>;
const BountyIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>;
const LockIcon = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>;

/* ─── Step indicator ─────────────────────────────────────────── */
function StepIndicator({ current, total }) {
  const labels = ["Type", "Details", "Upload", "Review"];
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 0, marginBottom: 32 }}>
      {Array.from({ length: total }, (_, i) => {
        const active = i + 1 === current;
        const completed = i + 1 < current;
        return (
          <React.Fragment key={i}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
              <div style={{ width: 32, height: 32, borderRadius: "50%", background: completed ? GOLD : active ? NAVY : "transparent", border: `1.5px solid ${completed || active ? (completed ? GOLD : NAVY) : "#e5ddd0"}`, display: "flex", alignItems: "center", justifyContent: "center", transition: "all .25s" }}>
                {completed ? <span style={{ color: NAVY }}><CheckIcon /></span> : <span style={{ fontSize: 11, fontWeight: 700, color: active ? "#fff" : "#ccc", fontFamily: "'Lato',sans-serif" }}>{i + 1}</span>}
              </div>
              <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", fontFamily: "'Lato',sans-serif", color: active ? NAVY : completed ? GOLD : "#bbb" }}>{labels[i]}</span>
            </div>
            {i < total - 1 && <div style={{ flex: 1, height: 1.5, marginBottom: 18, background: i + 1 < current ? GOLD : "#e5ddd0", transition: "background .3s" }} />}
          </React.Fragment>
        );
      })}
    </div>
  );
}

/* ─── Field wrapper ──────────────────────────────────────────── */
function Field({ label, hint, required, children }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <label style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", color: "#888", fontFamily: "'Lato',sans-serif" }}>
          {label} {required && <span style={{ color: "#ea580c" }}>*</span>}
        </label>
        {hint && <span style={{ fontSize: 10, color: "#bbb", fontFamily: "'Lato',sans-serif" }}>{hint}</span>}
      </div>
      {children}
    </div>
  );
}

/* ─── Bounty Selector ────────────────────────────────────────── */
function BountySelector({ userId, selectedBountyId, onSelect }) {
  const [bounties, setBounties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!userId) { setLoading(false); return; }
    getClaimedBounties(userId)
      .then(setBounties)
      .catch((e) => { console.error(e); setError("Failed to load claimed bounties."); })
      .finally(() => setLoading(false));
  }, [userId]);

  if (loading) return <div style={{ padding: "12px 14px", background: BG, border: ".5px solid #e5ddd0" }}><div style={{ height: 12, background: "#e5ddd0", width: "50%", animation: "pulse 1.4s infinite" }} /></div>;
  if (error) return <div style={{ padding: "14px", background: "rgba(220,38,38,.07)", border: ".5px solid rgba(220,38,38,.3)", display: "flex", gap: 8, alignItems: "center" }}><AlertIcon /><p style={{ fontSize: 12, color: "#dc2626", fontFamily: "'Lato',sans-serif", margin: 0 }}>{error}</p></div>;
  if (bounties.length === 0) return (
    <div style={{ padding: "14px", background: "rgba(184,150,62,.06)", border: ".5px solid rgba(184,150,62,.25)", textAlign: "center" }}>
      <p style={{ fontSize: 12, color: "#888", fontFamily: "'Lato',sans-serif", margin: 0 }}>
        No claimed bounties found. Browse the <a href="/academic/bounty/board" style={{ color: GOLD, fontWeight: 700 }}>Bounty Board</a> to claim a request first.
      </p>
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".14em", textTransform: "uppercase", color: "#888", fontFamily: "'Lato',sans-serif", margin: 0 }}>Your Claimed Requests ({bounties.length})</p>
      {bounties.map((b) => {
        const selected = b.id === selectedBountyId;
        return (
          <button key={b.id} onClick={() => onSelect(b)}
            style={{ width: "100%", textAlign: "left", padding: "14px 16px", background: selected ? "rgba(184,150,62,.08)" : "#fff", border: `1px solid ${selected ? GOLD : "#e5ddd0"}`, cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "flex-start", transition: "border-color .18s, background .18s" }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
                {b.university && <span style={{ background: NAVY, padding: "2px 8px", fontSize: 9, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: GOLD, fontFamily: "'Lato',sans-serif" }}>{b.university}</span>}
                {b.department && <span style={{ fontSize: 10, color: "#aaa", fontFamily: "'Lato',sans-serif", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em" }}>{b.department}</span>}
              </div>
              <p style={{ fontSize: 13, fontWeight: 700, color: NAVY, fontFamily: "'Playfair Display',serif", margin: "0 0 4px", lineHeight: 1.3 }}>{b.title}</p>
              <p style={{ fontSize: 11, color: "#999", fontFamily: "'Lato',sans-serif", margin: 0 }}>
                {b.status === "pending_approval" ? "⏳ Awaiting approval" : "Claimed"} · {b.tags?.join(", ")}
              </p>
            </div>
            <div style={{ textAlign: "right", flexShrink: 0, marginLeft: 12 }}>
              <div style={{ fontSize: 9, color: "#aaa", fontFamily: "'Lato',sans-serif", fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", marginBottom: 3 }}>Your Payout (80%)</div>
              <div style={{ fontSize: 18, fontFamily: "'Playfair Display',serif", fontWeight: 700, color: GOLD }}>₦{Math.round((b.reward || 0) * 0.8).toLocaleString("en-NG")}</div>
              {selected && <div style={{ marginTop: 5, display: "flex", alignItems: "center", gap: 4, color: GOLD, justifyContent: "flex-end" }}><CheckIcon /><span style={{ fontSize: 9, fontWeight: 700, fontFamily: "'Lato',sans-serif", letterSpacing: ".1em" }}>SELECTED</span></div>}
            </div>
          </button>
        );
      })}
    </div>
  );
}

/* ─── Shared input style ─────────────────────────────────────── */
const inp = {
  padding: "10px 14px", border: ".5px solid #e5ddd0", fontSize: 13,
  fontFamily: "'Lato',sans-serif", outline: "none", width: "100%",
  background: BG, color: NAVY, boxSizing: "border-box", transition: "border-color .18s",
};

/* ═══════════════════════════════════════════════════════════════
   MAIN COMPONENT — uses auth.currentUser instead of user prop
═══════════════════════════════════════════════════════════════ */
export default function PublishFlowWithBountyClient({ onPublishSuccess }) {
  const [step, setStep] = useState(1);
  const [type, setType] = useState(null);
  const [selectedBounty, setSelectedBounty] = useState(null);
  const [userData, setUserData] = useState(null);

  /* ── Form state — mirrors AdvertiseClient exactly ── */
  const [form, setForm] = useState({
    bookTitle: "", author: "", docType: "Bounty Fulfillment",
    description: "", tableOfContents: "",
    price: "", format: "PDF", pages: "",
    accessType: "paid",
    // academic
    universityCountry: "", institution: "", department: "",
    courseCode: "", semester: "", session: "", level: "100",
    // genre / commercial
    genre: "", isbn: "", edition: "",
    // cover
    coverImagePreview: null,
  });

  /* ── Upload state ── */
  const [file, setFile] = useState(null);
  const [selectedCoverImage, setSelectedCoverImage] = useState(null);
  const [driveLink, setDriveLink] = useState("");
  const [uploadPct, setUploadPct] = useState(0);
  const [uploadMsg, setUploadMsg] = useState("");
  const [dragging, setDragging] = useState(false);

  /* ── Submission state ── */
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [publishedBookId, setPublishedBookId] = useState(null);

  const isBounty = type === "bounty_fulfillment";
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const handle = e => set(e.target.name, e.target.value);

  /* ── Load user profile for auto-fill (use auth.currentUser) ── */
  useEffect(() => {
    const loadUserProfile = async () => {
      const currentUser = auth.currentUser;
      if (!currentUser?.uid) return;

      try {
        const snap = await getDoc(doc(db, "users", currentUser.uid));
        if (!snap.exists()) return;
        const d = snap.data();
        setUserData(d);
        setForm(p => ({
          ...p,
          author: d.displayName || d.firstName || currentUser.displayName || "",
          universityCountry: d.country || "",
          institution: d.selectedUniversity || d.university || "",
          department: d.department || "",
        }));
      } catch (err) {
        console.error("Failed to load user profile:", err);
      }
    };

    loadUserProfile();
  }, []);

  /* ── Pre-fill from selected bounty ── */
  const handleBountySelect = useCallback((bounty) => {
    setSelectedBounty(bounty);
    setForm(p => ({
      ...p,
      bookTitle: bounty.title || "",
      department: bounty.department || p.department,
      institution: bounty.university || p.institution,
      description: `Fulfilment of bounty request: "${bounty.title}"`,
      price: String(bounty.reward || 0),
      docType: "Bounty Fulfillment",
    }));
  }, []);

  /* ── Upload helpers ── */
  const extractDriveId = (url) => {
    if (!url) return "";
    const m = url.match(/\/d\/([\w-]{25,})|\/file\/d\/([\w-]{25,})|id=([\w-]{25,})/);
    return m ? (m[1] || m[2] || m[3]) : "";
  };

  const uploadPDF = async (f) => {
    const currentUser = auth.currentUser;
    if (!f || !currentUser?.uid) return null;
    const storageRef = ref(storage, `books/${currentUser.uid}/${Date.now()}_${f.name.replace(/\s+/g, "_")}`);
    const task = uploadBytesResumable(storageRef, f);
    return new Promise((resolve, reject) => {
      task.on("state_changed",
        (snap) => { const p = Math.round((snap.bytesTransferred / snap.totalBytes) * 100); setUploadPct(p); setUploadMsg(`Uploading PDF: ${p}%`); },
        reject,
        async () => resolve(await getDownloadURL(task.snapshot.ref))
      );
    });
  };

  const uploadCover = async (f) => {
    const currentUser = auth.currentUser;
    if (!f || !currentUser?.uid) return null;
    const storageRef = ref(storage, `covers/${currentUser.uid}/${Date.now()}_${f.name.replace(/\s+/g, "_")}`);
    const task = uploadBytesResumable(storageRef, f);
    return new Promise((resolve, reject) => {
      task.on("state_changed", null, reject,
        async () => resolve(await getDownloadURL(task.snapshot.ref))
      );
    });
  };

  /* ── Submit ── */
  const handleSubmit = async () => {
    const currentUser = auth.currentUser;

    if (submitting) return;
    if (!currentUser || !currentUser.uid) {
      setError("Session expired. Please refresh and sign in again.");
      return;
    }

    if (!file && !driveLink.trim()) {
      setError("Please upload a file or paste a Drive link.");
      return;
    }
    if (!form.bookTitle) {
      setError("Please enter a document title.");
      return;
    }
    if (!form.pages) {
      setError("Please enter the number of pages.");
      return;
    }

    // Bounty-specific validation
    if (isBounty) {
      if (!selectedBounty) {
        setError("Please select a bounty to fulfil.");
        return;
      }
      if (!selectedBounty.id) {
        setError("Invalid bounty selected. Please try again.");
        return;
      }
    }

    if (form.accessType === "paid" && (!form.price || Number(form.price) <= 0)) {
      setError("Please enter a valid price.");
      return;
    }

    setError("");
    setSubmitting(true);
    try {
      let pdfUrl = driveLink.trim() || null;
      let driveFileId = null;
      let embedUrl = null;
      let coverImageUrl = null;

      if (file) {
        setUploadMsg("Uploading PDF…");
        pdfUrl = await uploadPDF(file);
        setUploadMsg("");
      } else if (driveLink) {
        driveFileId = extractDriveId(driveLink);
        if (driveFileId) { embedUrl = `https://drive.google.com/file/d/${driveFileId}/preview`; pdfUrl = driveLink; }
      }

      if (selectedCoverImage) {
        setUploadMsg("Uploading cover…");
        coverImageUrl = await uploadCover(selectedCoverImage);
        setUploadMsg("");
      }

      const displayName = userData?.displayName || userData?.firstName || currentUser.displayName || currentUser.email?.split("@")[0] || "Author";

      const bookData = {
        bookTitle: form.bookTitle,
        title: form.bookTitle,
        author: form.author || displayName,
        docType: form.docType || "Bounty Fulfillment",
        description: form.description,
        tableOfContents: form.tableOfContents || null,
        format: form.format || "PDF",
        pages: Number(form.pages) || 0,
        pdfUrl,
        pdfLink: pdfUrl,
        embedUrl: embedUrl || (driveFileId ? `https://drive.google.com/file/d/${driveFileId}/preview` : null),
        driveFileId: driveFileId || null,
        coverImage: coverImageUrl,
        image: coverImageUrl,
        uploadMethod: file ? "direct_upload" : "drive_link",
        // academic
        university: form.institution || null,
        universityCountry: form.universityCountry || null,
        department: form.department || null,
        courseCode: form.courseCode?.toUpperCase() || null,
        semester: form.semester || null,
        session: form.session || null,
        level: form.level || null,
        // pricing
        isFree: form.accessType === "free",
        price: form.accessType === "free" ? 0 : Number(form.price),
        accessType: form.accessType,
        // genre
        genre: form.genre || null,
        isbn: form.isbn || null,
        edition: form.edition || null,
        category: form.department || form.genre || "General",
        // meta
        uploadedByUid: currentUser.uid,
        uploadedBy: displayName,
        sellerName: displayName,
        sellerEmail: currentUser.email,
        intent: "bounty_fulfillment",
        isBountyFulfillment: true,
      };

      setUploadMsg("Saving document…");

      // For bounty fulfillment, bountyId is required
      if (isBounty && !selectedBounty?.id) {
        throw new Error("Bounty ID is required for fulfillment");
      }

      const bountyId = isBounty ? selectedBounty.id : null;
      const bookId = await linkBookToBounty(bookData, bountyId, currentUser);
      setPublishedBookId(bookId);
      setDone(true);
      onPublishSuccess?.({ bookId, bountyId });
    } catch (e) {
      console.error(e);
      setError(e.message || "Submission failed. Please try again.");
    } finally {
      setSubmitting(false);
      setUploadMsg("");
      setUploadPct(0);
    }
  };

  /* ─── DONE screen ── */
  if (done) {
    return (
      <div style={{ maxWidth: 560, margin: "0 auto", textAlign: "center", padding: "60px 24px" }}>
        <div style={{ width: 64, height: 64, borderRadius: "50%", background: "rgba(184,150,62,.12)", border: `1px solid ${GOLD}`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px", color: GOLD }}>
          <CheckIcon />
        </div>
        <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: 28, fontWeight: 700, color: NAVY, marginBottom: 8 }}>Submission Sent!</h2>
        <p style={{ fontSize: 14, color: "#777", fontFamily: "'Lato',sans-serif", lineHeight: 1.8, maxWidth: 400, margin: "0 auto 8px" }}>
          Your fulfilment is under admin review (24–48 hrs). Once approved, the bounty poster will be notified and the book goes live.
        </p>
        <p style={{ fontSize: 13, color: GOLD, fontFamily: "'Lato',sans-serif", fontWeight: 700, marginBottom: 24 }}>
          You earn ₦{Math.round((selectedBounty?.reward || 0) * 0.8).toLocaleString("en-NG")} after approval & purchase.
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <a href="/upload-document/my-pending-books"
            style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 7, padding: "12px 28px", background: GOLD, color: NAVY, fontSize: 11, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", textDecoration: "none", fontFamily: "'Lato',sans-serif" }}>
            View My Pending Books →
          </a>
          <a href="/academic/bounty/board"
            style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 7, padding: "11px 24px", background: "transparent", color: NAVY, fontSize: 11, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", textDecoration: "none", fontFamily: "'Lato',sans-serif", border: ".5px solid #e5ddd0" }}>
            Back to Bounty Board
          </a>
        </div>
      </div>
    );
  }

  const bountyReward = selectedBounty?.reward || Number(form.price) || 0;
  const payout = Math.round(bountyReward * 0.8);

  return (
    <>
      <style>{`
                @keyframes fadeUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
                @keyframes pulse  { 0%,100%{opacity:1} 50%{opacity:.5} }
                @keyframes spin   { to{transform:rotate(360deg)} }
                .pf-input:focus { border-color:${GOLD} !important; }
                .pf-type-card:hover { border-color:${GOLD} !important; }
            `}</style>

      <div style={{ maxWidth: 680, margin: "0 auto", padding: "40px 24px", animation: "fadeUp .35s both" }}>
        <StepIndicator current={step} total={4} />

        {/* ══ STEP 1 — TYPE ══ */}
        {step === 1 && (
          <div>
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".22em", textTransform: "uppercase", color: GOLD, marginBottom: 8, fontFamily: "'Lato',sans-serif" }}>Step 1</p>
            <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: 28, fontWeight: 700, color: NAVY, marginBottom: 6 }}>What are you publishing?</h2>
            <p style={{ fontSize: 13, color: "#888", fontFamily: "'Lato',sans-serif", lineHeight: 1.7, marginBottom: 28 }}>Select the content type that best describes your upload.</p>

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {PUBLISH_TYPES.map((t) => {
                const selected = type === t.key;
                return (
                  <button key={t.key} className="pf-type-card" onClick={() => setType(t.key)}
                    style={{ width: "100%", textAlign: "left", padding: "18px 20px", background: selected ? (t.highlight ? "rgba(13,34,68,.97)" : "rgba(184,150,62,.07)") : (t.highlight ? "rgba(13,34,68,.04)" : "#fff"), border: `1px solid ${selected ? GOLD : (t.highlight ? "rgba(13,34,68,.18)" : "#e5ddd0")}`, cursor: "pointer", display: "flex", alignItems: "center", gap: 16, transition: "all .2s", position: "relative", overflow: "hidden" }}>
                    {t.highlight && <div style={{ position: "absolute", top: 0, right: 0, bottom: 0, width: 4, background: selected ? GOLD : "rgba(184,150,62,.3)" }} />}
                    <div style={{ width: 18, height: 18, borderRadius: "50%", border: `1.5px solid ${selected ? GOLD : "#ddd"}`, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      {selected && <div style={{ width: 9, height: 9, borderRadius: "50%", background: GOLD }} />}
                    </div>
                    <span style={{ fontSize: 22, flexShrink: 0 }}>{t.icon}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                        <span style={{ fontSize: 14, fontWeight: 700, color: selected && t.highlight ? "#fff" : NAVY, fontFamily: "'Lato',sans-serif" }}>{t.label}</span>
                        {t.badge && <span style={{ background: selected ? GOLD : "rgba(184,150,62,.15)", color: selected ? NAVY : GOLD, fontSize: 8, fontWeight: 900, letterSpacing: ".14em", textTransform: "uppercase", padding: "2px 7px", fontFamily: "'Lato',sans-serif" }}>{t.badge}</span>}
                      </div>
                      <p style={{ fontSize: 12, color: selected && t.highlight ? "rgba(245,240,232,.6)" : "#999", fontFamily: "'Lato',sans-serif", margin: 0, lineHeight: 1.5 }}>{t.description}</p>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Bounty selector */}
            {isBounty && (
              <div style={{ marginTop: 20, animation: "fadeUp .25s both" }}>
                <div style={{ padding: "14px 16px", background: DARK, marginBottom: 14, display: "flex", gap: 10, alignItems: "center" }}>
                  <span style={{ color: GOLD }}><BountyIcon /></span>
                  <p style={{ fontSize: 11, color: "rgba(245,240,232,.7)", fontFamily: "'Lato',sans-serif", margin: 0, lineHeight: 1.6 }}>
                    Choose the bounty you claimed. Fields will be pre-filled from the student's request.
                  </p>
                </div>
                <BountySelector userId={auth.currentUser?.uid} selectedBountyId={selectedBounty?.id} onSelect={handleBountySelect} />
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 28 }}>
              <button
                onClick={() => { if (type && (!isBounty || selectedBounty)) setStep(2); }}
                disabled={!type || (isBounty && !selectedBounty)}
                style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "12px 28px", background: (type && (!isBounty || selectedBounty)) ? GOLD : "#e5ddd0", color: (type && (!isBounty || selectedBounty)) ? NAVY : "#aaa", border: "none", fontSize: 11, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", cursor: (type && (!isBounty || selectedBounty)) ? "pointer" : "not-allowed", fontFamily: "'Lato',sans-serif", transition: "background .18s" }}>
                Continue <ChevronRight />
              </button>
            </div>
          </div>
        )}

        {/* ══ STEP 2 — DETAILS ══ */}
        {step === 2 && (
          <div style={{ animation: "fadeUp .25s both" }}>
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".22em", textTransform: "uppercase", color: GOLD, marginBottom: 8, fontFamily: "'Lato',sans-serif" }}>Step 2</p>
            <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: 28, fontWeight: 700, color: NAVY, marginBottom: 6 }}>Document Details</h2>

            {isBounty && selectedBounty && (
              <div style={{ display: "flex", gap: 10, padding: "11px 14px", background: "rgba(184,150,62,.08)", border: ".5px solid rgba(184,150,62,.3)", marginBottom: 20 }}>
                <span style={{ color: GOLD, fontSize: 14 }}>✦</span>
                <p style={{ fontSize: 11, color: "#666", fontFamily: "'Lato',sans-serif", margin: 0 }}>
                  Auto-filled from bounty <strong style={{ color: NAVY }}>"{selectedBounty.title}"</strong> — edit any field as needed.
                </p>
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <Field label="Document Title" required>
                <input className="pf-input" style={inp} name="bookTitle" value={form.bookTitle} onChange={handle} placeholder="e.g. MTH201 Past Questions 2022–2024" />
              </Field>

              <Field label="Author / Creator" hint="Auto-filled from your profile">
                <input className="pf-input" style={inp} name="author" value={form.author} onChange={handle} placeholder="Full author name" />
              </Field>

              <Field label="Document Type" required>
                <select className="pf-input" style={inp} name="docType" value={form.docType} onChange={handle}>
                  <option value="">— Select Type —</option>
                  {DOC_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </Field>

              <Field label="Description" required hint="2–5 sentences about the content and what makes it valuable">
                <textarea className="pf-input" style={{ ...inp, resize: "vertical", minHeight: 90, lineHeight: 1.6 }} name="description" value={form.description} onChange={handle} placeholder="Describe the content, target readers, and what makes this valuable…" rows={4} />
              </Field>

              <Field label="Table of Contents / Key Topics" hint="Optional — helps with discovery">
                <textarea className="pf-input" style={{ ...inp, resize: "vertical", minHeight: 70, lineHeight: 1.6 }} name="tableOfContents" value={form.tableOfContents} onChange={handle} placeholder={"Chapter 1: Introduction…\nChapter 2: …"} rows={3} />
              </Field>

              {/* ── Institution ── */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <Field label="Country">
                  <select className="pf-input" style={inp} name="universityCountry" value={form.universityCountry}
                    onChange={e => { set("universityCountry", e.target.value); set("institution", ""); }}>
                    <option value="">— Country —</option>
                    {UNIVERSITY_COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </Field>
                <Field label="University" hint="Pre-filled from profile">
                  <select className="pf-input" style={inp} name="institution" value={form.institution} onChange={handle} disabled={!form.universityCountry}>
                    <option value="">— University —</option>
                    {(form.universityCountry ? (UNIVERSITIES_BY_COUNTRY[form.universityCountry] || []) : []).map(u => <option key={u.name} value={u.name}>{u.name}</option>)}
                  </select>
                </Field>
              </div>

              {/* ── Department + Course ── */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <Field label="Department" hint="Pre-filled from profile">
                  <select className="pf-input" style={inp} name="department" value={form.department} onChange={handle}>
                    <option value="">— Select Department —</option>
                    {Object.entries(DEPARTMENTS_BY_FACULTY).map(([faculty, depts]) => (
                      <optgroup key={faculty} label={faculty}>
                        {depts.map(d => <option key={d} value={d}>{d}</option>)}
                      </optgroup>
                    ))}
                    <option value="Other">Other (specify in description)</option>
                  </select>
                </Field>
                <Field label="Course Code">
                  <input className="pf-input" style={inp} name="courseCode" value={form.courseCode} onChange={handle} placeholder="e.g. CHE 301" />
                </Field>
              </div>

              {/* ── Level + Semester ── */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <Field label="Level">
                  <select className="pf-input" style={inp} name="level" value={form.level} onChange={handle}>
                    {LEVELS.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
                  </select>
                </Field>
                <Field label="Semester">
                  <select className="pf-input" style={inp} name="semester" value={form.semester} onChange={handle}>
                    <option value="">— Select —</option>
                    {SEMESTERS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </Field>
              </div>

              <Field label="Academic Session" hint="e.g. 2024/2025">
                <input className="pf-input" style={inp} name="session" value={form.session} onChange={handle} placeholder="2024/2025" />
              </Field>

              {/* ── Genre (optional) ── */}
              <Field label="Genre / Category" hint="Optional">
                <select className="pf-input" style={inp} name="genre" value={form.genre} onChange={handle}>
                  <option value="">— Select Genre —</option>
                  {GENRES.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </Field>

              {/* ── Bounty escrow info ── */}
              {isBounty && selectedBounty && (
                <div style={{ display: "flex", gap: 10, padding: "12px 14px", background: "rgba(13,34,68,.04)", border: ".5px solid rgba(13,34,68,.12)" }}>
                  <LockIcon />
                  <div>
                    <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: "#888", fontFamily: "'Lato',sans-serif", margin: "0 0 3px" }}>Bounty Escrow</p>
                    <p style={{ fontSize: 11, color: "#777", fontFamily: "'Lato',sans-serif", margin: 0 }}>
                      Bounty ID <code style={{ background: CREAM, padding: "1px 5px", fontSize: 10 }}>{selectedBounty.id}</code> — Reward:{" "}
                      <strong style={{ color: NAVY }}>₦{Number(selectedBounty.reward).toLocaleString("en-NG")}</strong>
                      {" · "}Your payout: <strong style={{ color: "#16a34a" }}>₦{payout.toLocaleString("en-NG")}</strong>
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 28 }}>
              <button onClick={() => setStep(1)} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "10px 20px", background: "none", border: ".5px solid #e5ddd0", fontSize: 11, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", cursor: "pointer", color: "#888", fontFamily: "'Lato',sans-serif" }}>
                <ChevronLeft /> Back
              </button>
              <button onClick={() => { if (form.bookTitle) setStep(3); }} disabled={!form.bookTitle}
                style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "12px 28px", background: form.bookTitle ? GOLD : "#e5ddd0", color: form.bookTitle ? NAVY : "#aaa", border: "none", fontSize: 11, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", cursor: "pointer", fontFamily: "'Lato',sans-serif" }}>
                Continue <ChevronRight />
              </button>
            </div>
          </div>
        )}

        {/* ══ STEP 3 — UPLOAD & PRICE ══ */}
        {step === 3 && (
          <div style={{ animation: "fadeUp .25s both" }}>
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".22em", textTransform: "uppercase", color: GOLD, marginBottom: 8, fontFamily: "'Lato',sans-serif" }}>Step 3</p>
            <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: 28, fontWeight: 700, color: NAVY, marginBottom: 24 }}>Upload & Pricing</h2>

            {/* PDF upload */}
            <div style={{ marginBottom: 20 }}>
              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", color: "#888", fontFamily: "'Lato',sans-serif", marginBottom: 10 }}>PDF Document <span style={{ color: "#ea580c" }}>*</span></p>
              <div onDragOver={(e) => { e.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)}
                onDrop={(e) => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) { setFile(f); setDriveLink(""); } }}
                onClick={() => document.getElementById("pf-file-input").click()}
                style={{ border: `1.5px dashed ${dragging ? GOLD : (file ? GOLD : "#e5ddd0")}`, background: dragging ? "rgba(184,150,62,.05)" : (file ? "rgba(184,150,62,.04)" : BG), padding: "36px 24px", textAlign: "center", cursor: "pointer", transition: "all .2s", marginBottom: 12 }}>
                <input id="pf-file-input" type="file" accept=".pdf,.doc,.docx,.ppt,.pptx" style={{ display: "none" }} onChange={(e) => { const f = e.target.files[0]; if (f) { setFile(f); setDriveLink(""); } }} />
                <div style={{ color: file ? GOLD : "#ccc", display: "flex", justifyContent: "center", marginBottom: 10 }}><UploadIcon /></div>
                {file ? (
                  <>
                    <p style={{ fontSize: 14, fontWeight: 700, color: NAVY, fontFamily: "'Lato',sans-serif", marginBottom: 4 }}>{file.name}</p>
                    <p style={{ fontSize: 11, color: "#aaa", fontFamily: "'Lato',sans-serif" }}>{(file.size / 1024 / 1024).toFixed(2)} MB · Click to replace</p>
                  </>
                ) : (
                  <>
                    <p style={{ fontSize: 14, fontWeight: 700, color: NAVY, fontFamily: "'Lato',sans-serif", marginBottom: 4 }}>Drop your file here or click to browse</p>
                    <p style={{ fontSize: 11, color: "#aaa", fontFamily: "'Lato',sans-serif" }}>PDF, DOC, DOCX, PPT, PPTX · Max 50 MB</p>
                  </>
                )}
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                <div style={{ flex: 1, height: 1, background: "#e5ddd0" }} />
                <span style={{ fontSize: 10, color: "#bbb", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".08em", fontFamily: "'Lato',sans-serif" }}>or paste Google Drive link</span>
                <div style={{ flex: 1, height: 1, background: "#e5ddd0" }} />
              </div>

              <input className="pf-input" type="url" placeholder="https://drive.google.com/file/d/…"
                value={driveLink} onChange={(e) => { setDriveLink(e.target.value); if (e.target.value) setFile(null); }}
                disabled={!!file} style={{ ...inp, opacity: file ? 0.5 : 1, cursor: file ? "not-allowed" : "text" }} />
              {driveLink && !file && (
                <p style={{ fontSize: 11, color: "#d97706", marginTop: 6, display: "flex", alignItems: "center", gap: 4, fontFamily: "'Lato',sans-serif" }}>
                  ⚠ Ensure sharing is set to "Anyone with the link can view"
                </p>
              )}
            </div>

            {/* Upload progress */}
            {uploadPct > 0 && uploadPct < 100 && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#888", marginBottom: 4, fontFamily: "'Lato',sans-serif" }}>
                  <span>Uploading…</span><span>{uploadPct}%</span>
                </div>
                <div style={{ height: 4, background: "#e5ddd0" }}>
                  <div style={{ height: "100%", background: GOLD, width: `${uploadPct}%`, transition: "width .3s" }} />
                </div>
              </div>
            )}

            {/* Cover image */}
            <div style={{ marginBottom: 20 }}>
              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", color: "#888", fontFamily: "'Lato',sans-serif", marginBottom: 4 }}>
                Cover Image <span style={{ fontWeight: 400, textTransform: "none", letterSpacing: 0, color: "#bbb" }}>(Optional — documents with covers sell 2× more)</span>
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 80px", gap: 12, alignItems: "start" }}>
                <label style={{ border: `1.5px dashed ${selectedCoverImage ? GOLD : "#e5ddd0"}`, background: selectedCoverImage ? "rgba(184,150,62,.04)" : BG, padding: "20px 16px", textAlign: "center", cursor: "pointer", display: "block", transition: "all .2s" }}>
                  <input type="file" accept="image/jpeg,image/png,image/webp" style={{ display: "none" }}
                    onChange={(e) => { const f = e.target.files[0]; if (f) { setSelectedCoverImage(f); set("coverImagePreview", URL.createObjectURL(f)); } }} />
                  {selectedCoverImage ? (
                    <div>
                      <p style={{ fontSize: 12, fontWeight: 700, color: "#16a34a", margin: "0 0 4px" }}>{selectedCoverImage.name}</p>
                      <button type="button" onClick={e => { e.preventDefault(); setSelectedCoverImage(null); set("coverImagePreview", null); }}
                        style={{ fontSize: 10, color: "#ef4444", background: "none", border: "none", cursor: "pointer", textDecoration: "underline", fontFamily: "'Lato',sans-serif" }}>Remove</button>
                    </div>
                  ) : (
                    <p style={{ fontSize: 12, color: "#aaa", fontFamily: "'Lato',sans-serif", margin: 0 }}>Click to upload JPG/PNG/WEBP · Max 5 MB</p>
                  )}
                </label>
                <div style={{ aspectRatio: "3/4", background: "#f0ebe0", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                  {form.coverImagePreview ? <img src={form.coverImagePreview} alt="Cover" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span style={{ fontSize: 20 }}>🖼</span>}
                </div>
              </div>
            </div>

            {/* Access type */}
            <div style={{ marginBottom: 20 }}>
              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", color: "#888", fontFamily: "'Lato',sans-serif", marginBottom: 10 }}>Access Type <span style={{ color: "#ea580c" }}>*</span></p>
              <div style={{ display: "flex", border: "2px solid #e5ddd0", overflow: "hidden" }}>
                {[
                  { value: "paid", label: "💰 Paid", desc: "Readers purchase to access" },
                  { value: "free", label: "🔓 Free", desc: "Open access for everyone" },
                ].map((opt, i) => (
                  <button key={opt.value} type="button"
                    onClick={() => { set("accessType", opt.value); if (opt.value === "free") set("price", "0"); }}
                    style={{ flex: 1, padding: "13px 10px", border: "none", cursor: "pointer", background: form.accessType === opt.value ? NAVY : "#fff", color: form.accessType === opt.value ? "#fff" : "#666", transition: "all .18s", display: "flex", flexDirection: "column", alignItems: "center", gap: 3, borderRight: i === 0 ? ".5px solid #e5ddd0" : "none" }}>
                    <span style={{ fontSize: 13, fontWeight: 700 }}>{opt.label}</span>
                    <span style={{ fontSize: 10, opacity: 0.65, fontFamily: "'Lato',sans-serif" }}>{opt.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Pages + Price + Format */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
              <Field label="Number of Pages" required>
                <input className="pf-input" style={inp} type="number" name="pages" value={form.pages} onChange={handle} placeholder="e.g. 64" />
              </Field>

              {form.accessType === "paid" && (
                <Field label="Price (₦)" required>
                  <div style={{ position: "relative" }}>
                    <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: GOLD, fontWeight: 700, fontSize: 14, fontFamily: "'Playfair Display',serif", pointerEvents: "none" }}>₦</span>
                    <input className="pf-input" style={{ ...inp, paddingLeft: 28 }} type="number" name="price" value={form.price} onChange={handle} placeholder="e.g. 2000" />
                  </div>
                </Field>
              )}
            </div>

            {/* Format toggle */}
            <Field label="Format">
              <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                {["PDF", "EPUB", "MOBI"].map(f => (
                  <button key={f} type="button" onClick={() => set("format", f)}
                    style={{ flex: 1, padding: "9px 0", border: `1.5px solid ${form.format === f ? NAVY : "#e5ddd0"}`, background: form.format === f ? NAVY : "#fff", color: form.format === f ? "#fff" : NAVY, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "'Lato',sans-serif", transition: "all .15s" }}>
                    {f}
                  </button>
                ))}
              </div>
            </Field>

            {/* Payout preview */}
            {form.accessType === "paid" && form.price && Number(form.price) > 0 && (
              <div style={{ marginTop: 16, padding: "14px 16px", background: "rgba(22,163,74,.07)", border: ".5px solid rgba(22,163,74,.25)" }}>
                <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: "#15803d", fontFamily: "'Lato',sans-serif", margin: "0 0 4px" }}>Your earnings per sale</p>
                <p style={{ fontFamily: "'Playfair Display',serif", fontSize: 26, fontWeight: 700, color: "#15803d", margin: 0 }}>
                  ₦{Math.round(Number(form.price) * 0.8).toLocaleString("en-NG")}
                </p>
                <p style={{ fontSize: 11, color: "#16a34a", fontFamily: "'Lato',sans-serif", margin: "4px 0 0" }}>
                  80% of ₦{Number(form.price).toLocaleString("en-NG")} · Platform retains 20%
                </p>
              </div>
            )}

            {uploadMsg && <p style={{ textAlign: "center", fontSize: 13, fontWeight: 700, color: NAVY, fontFamily: "'Lato',sans-serif", marginTop: 12 }}>{uploadMsg}</p>}

            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 28 }}>
              <button onClick={() => setStep(2)} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "10px 20px", background: "none", border: ".5px solid #e5ddd0", fontSize: 11, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", cursor: "pointer", color: "#888", fontFamily: "'Lato',sans-serif" }}>
                <ChevronLeft /> Back
              </button>
              <button onClick={() => { if (file || driveLink.trim()) setStep(4); else setError("Please upload a file or paste a Drive link."); }}
                disabled={!file && !driveLink.trim()}
                style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "12px 28px", background: (file || driveLink.trim()) ? GOLD : "#e5ddd0", color: (file || driveLink.trim()) ? NAVY : "#aaa", border: "none", fontSize: 11, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", cursor: "pointer", fontFamily: "'Lato',sans-serif" }}>
                Review <ChevronRight />
              </button>
            </div>
          </div>
        )}

        {/* ══ STEP 4 — REVIEW ══ */}
        {step === 4 && (
          <div style={{ animation: "fadeUp .25s both" }}>
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".22em", textTransform: "uppercase", color: GOLD, marginBottom: 8, fontFamily: "'Lato',sans-serif" }}>Step 4</p>
            <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: 28, fontWeight: 700, color: NAVY, marginBottom: 24 }}>Review &amp; Submit</h2>

            {/* Summary card */}
            <div style={{ border: ".5px solid #e5ddd0", marginBottom: 20 }}>
              <div style={{ background: DARK, padding: "12px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".18em", textTransform: "uppercase", color: GOLD, fontFamily: "'Lato',sans-serif" }}>🎯 Bounty Fulfilment</span>
                {isBounty && selectedBounty && (
                  <span style={{ fontSize: 11, color: "rgba(184,150,62,.7)", fontFamily: "'Lato',sans-serif" }}>
                    Your payout: ₦{payout.toLocaleString("en-NG")}
                  </span>
                )}
              </div>
              <div style={{ padding: "20px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px 24px" }}>
                {[
                  ["Title", form.bookTitle],
                  ["Author", form.author],
                  ["Doc Type", form.docType],
                  ["University", form.institution],
                  ["Department", form.department],
                  ["Course Code", form.courseCode],
                  ["Level", form.level],
                  ["Semester", form.semester],
                  ["Session", form.session],
                  ["Pages", form.pages],
                  ["Format", form.format],
                  ["Price", form.accessType === "free" ? "Free" : `₦${Number(form.price).toLocaleString("en-NG")}`],
                  ["File", file?.name || (driveLink ? "Google Drive link" : null)],
                  ["Cover", selectedCoverImage?.name || null],
                  ["Bounty ID", selectedBounty?.id],
                ].map(([k, v]) => v ? (
                  <div key={k}>
                    <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", color: "#bbb", fontFamily: "'Lato',sans-serif", margin: "0 0 3px" }}>{k}</p>
                    <p style={{ fontSize: 12, color: NAVY, fontFamily: k === "Bounty ID" ? "'Courier New',monospace" : "'Lato',sans-serif", fontWeight: 700, margin: 0, wordBreak: "break-all" }}>{v}</p>
                  </div>
                ) : null)}
              </div>
            </div>

            {/* Approval notice */}
            <div style={{ background: "rgba(13,34,68,.04)", border: ".5px solid rgba(13,34,68,.12)", padding: "14px 16px", marginBottom: 16, display: "flex", alignItems: "flex-start", gap: 10 }}>
              <span style={{ fontSize: 18, flexShrink: 0 }}>⏳</span>
              <div>
                <p style={{ fontSize: 12, fontWeight: 700, color: NAVY, fontFamily: "'Lato',sans-serif", margin: "0 0 4px" }}>Admin review required</p>
                <p style={{ fontSize: 11, color: "#777", fontFamily: "'Lato',sans-serif", margin: 0, lineHeight: 1.6 }}>
                  Your document will be reviewed within 24–48 hours. Once approved, it goes live and the bounty poster can purchase it. Your escrow of <strong>₦{payout.toLocaleString("en-NG")}</strong> is released after purchase.
                </p>
              </div>
            </div>

            {/* Payout info */}
            {isBounty && selectedBounty && (
              <div style={{ background: "rgba(22,163,74,.07)", border: ".5px solid rgba(22,163,74,.25)", padding: "14px 16px", marginBottom: 16, display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 18 }}>💰</span>
                <p style={{ fontSize: 12, color: "#15803d", fontFamily: "'Lato',sans-serif", margin: 0 }}>
                  After the student purchases this document, <strong>₦{payout.toLocaleString("en-NG")}</strong> will be released from escrow to your wallet automatically.
                </p>
              </div>
            )}

            {error && (
              <div style={{ padding: "12px 14px", background: "rgba(220,38,38,.07)", border: ".5px solid rgba(220,38,38,.25)", color: "#dc2626", fontSize: 12, fontFamily: "'Lato',sans-serif", marginBottom: 16, display: "flex", gap: 8, alignItems: "center" }}>
                <AlertIcon /> {error}
              </div>
            )}

            {uploadMsg && <p style={{ textAlign: "center", fontSize: 13, fontWeight: 700, color: NAVY, fontFamily: "'Lato',sans-serif", marginBottom: 12 }}>{uploadMsg}</p>}

            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <button onClick={() => setStep(3)} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "10px 20px", background: "none", border: ".5px solid #e5ddd0", fontSize: 11, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", cursor: "pointer", color: "#888", fontFamily: "'Lato',sans-serif" }}>
                <ChevronLeft /> Back
              </button>
              <button onClick={handleSubmit} disabled={submitting}
                style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "13px 32px", background: submitting ? "#ccc" : GOLD, color: submitting ? "#fff" : NAVY, border: "none", fontSize: 11, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", cursor: submitting ? "not-allowed" : "pointer", fontFamily: "'Lato',sans-serif" }}>
                {submitting
                  ? <><span style={{ width: 13, height: 13, border: "2px solid rgba(13,34,68,.2)", borderTopColor: NAVY, borderRadius: "50%", display: "inline-block", animation: "spin .7s linear infinite" }} />Submitting…</>
                  : "Submit for Review"
                }
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}