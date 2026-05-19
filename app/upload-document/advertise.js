"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebaseConfig";
import { storage } from "@/lib/firebaseStorage";
import { addDoc, collection, serverTimestamp, doc, getDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import {
    Upload, X, AlertCircle, BookOpen, GraduationCap,
    ChevronRight, Check, FileText, Star,
    ScrollText, ShoppingBag, BookMarked, Image as ImageIcon,
    Globe, TrendingUp,
} from "lucide-react";
import { UNIVERSITIES_BY_COUNTRY, UNIVERSITY_COUNTRIES } from "@/lib/africanUniversities";

/* ─────────────────────────────────────────────────────────────────
   CONSTANTS
───────────────────────────────────────────────────────────────── */
const INTENTS = [
    {
        id: "academic",
        label: "Faculty | Academic",
        icon: GraduationCap,
        color: "#1a3a5c",
        bg: "rgba(26,58,92,0.09)",
        description: "Lecture notes, course materials, handouts for universities & institutions",
    },
    {
        id: "students",
        label: "Student Prep | Notes",
        icon: BookMarked,
        color: "#0d5c2e",
        bg: "rgba(13,92,46,0.09)",
        description: "WAEC, NECO, JAMB past questions and exam preparation materials",
    },
    {
        id: "divinity",
        label: "Religion | Divinity Vault",
        icon: ScrollText,
        color: "#7c3aed",
        bg: "rgba(124,58,237,0.09)",
        description: "Sacred texts, theological research, and faith studies manuscripts",
    },
    {
        id: "commercial",
        label: "Sellers | Commercial",
        icon: ShoppingBag,
        color: "#b45309",
        bg: "rgba(180,83,9,0.09)",
        description: "Published books, novels, and commercial titles for general readers",
    },
];

const STEPS = [
    { id: 1, label: "Intent", icon: Star },
    { id: 2, label: "Details", icon: FileText },
    { id: 3, label: "Upload & Price", icon: Upload },
];

const DOC_TYPES = {
    academic: [
        "Textbook", "Lecture Note", "Handwritten Notes", "Syllabus", "Course Outline",
        "Summary", "Study Guide", "Reading List", "Mind Map", "Flashcards",
        "Cheat Sheet", "Annotated Bibliography", "Tutorial Sheet", "Community Timetable",
        "Thesis", "Research Proposal", "Seminar Paper", "Case Study", "Journal Article",
        "Literature Review", "Conference Paper", "Essay", "Dissertation Chapter",
        "Group Project Report",
        "Lab Manual", "Lab Report", "Technical Drawing", "Project", "Field Report",
        "Software Documentation", "Circuit Diagram", "Code Sample", "Algorithm Sheet",
        "Internship Report", "Clearance Guide", "Scholarship Guide", "Student Handbook",
        "Hostel Guide", "Admission Letter", "Academic Transcript", "Fellowship Application",
        "Medical Notes", "Law Case Brief", "Nursing Guide", "Accounting Workbook",
        "Engineering Formula Sheet", "Pharmacy Notes", "Architecture Portfolio",
        "Workshop Material", "Motivational Resource", "Translation Resource",
        "Presentation Slides", "Infographic", "Video Lecture Notes", "Podcast Transcript",
    ],
    "student-prep": [
        "Past Question", "WAEC Past Questions", "JAMB CBT Practice", "NECO Past Questions",
        "GCE Past Questions", "Post-UTME Past Questions", "Exam Revision", "Mock Exam",
        "Quiz Bank", "Assignment", "Study Guide",
    ],
    divinity: [
        "Sacred Text", "Sermon Notes", "Tafsir", "Bible Commentary", "Hadith Collection",
        "Theological Manuscript", "Religious Journal", "Prayer Book", "Catechism", "Exegesis",
    ],
    commercial: [
        "Novel", "E-Book", "Biography", "Self-Help", "Academic Reference",
        "Children's Book", "Poetry Collection", "Memoir", "Short Stories", "Non-Fiction",
        "CV Template", "Cover Letter Template", "Portfolio", "Career Guide",
        "Interview Prep", "Networking Guide",
        "Recipe Book", "Culinary Notes", "Food Science Notes", "Nutrition Guide", "Meal Plan",
    ],
};

const EXAM_BODIES = ["WAEC", "NECO", "JAMB", "GCE", "Post-UTME", "NABTEB", "NACOS"];
const GENRES = ["Fiction", "Non-Fiction", "Biography", "Self-Help", "Academic", "Science", "History", "Philosophy", "Religion", "Technology", "Business", "Health"];
const SEMESTERS = ["First Semester", "Second Semester", "Both Semesters"];
const THEOLOGICAL_OPTS = [
    { value: "christian_theology", label: "Christian Theology" },
    { value: "islamic_studies", label: "Islamic Studies" },
    { value: "comparative_religion", label: "Comparative Religion & Philosophy" },
    { value: "sacred_texts", label: "Sacred Texts & Manuscripts" },
];
const LEVELS = [
    { value: "100", label: "100 Level" }, { value: "200", label: "200 Level" },
    { value: "300", label: "300 Level" }, { value: "400", label: "400 Level" },
    { value: "500", label: "500 Level" }, { value: "pg", label: "Postgraduate" },
    { value: "ss1", label: "SS1" }, { value: "ss2", label: "SS2" },
    { value: "ss3", label: "SS3" },
];
const DEPARTMENTS_BY_FACULTY = {
    "Sciences": [
        "Medicine & Health Sciences", "Pharmacy", "Nursing", "Biochemistry",
        "Microbiology", "Biology", "Chemistry", "Physics", "Mathematics",
        "Statistics", "Veterinary Medicine", "Dentistry", "Nutrition & Dietetics", "Optometry",
    ],
    "Engineering & Technology": [
        "Computer Science", "Electrical Engineering", "Mechanical Engineering",
        "Civil Engineering", "Chemical Engineering", "Petroleum Engineering",
        "Architecture", "Information Technology", "Agricultural Engineering",
        "Environmental Engineering", "Mining Engineering",
    ],
    "Arts & Social Sciences": [
        "Law", "Economics", "Accounting", "Business Administration",
        "Political Science", "Sociology", "Psychology", "Mass Communication",
        "History & International Studies", "Public Administration",
        "Geography", "Philosophy", "Linguistics",
    ],
    "Humanities & Creative Arts": [
        "Literature", "Fine & Applied Arts", "Music",
        "Theatre & Performing Arts", "Languages & Linguistics", "Religious Studies",
    ],
    "Agriculture & Environment": [
        "Agriculture", "Forestry & Wildlife", "Fisheries & Aquaculture",
        "Environmental Sciences", "Food Science & Technology",
    ],
    "Education": [
        "Education", "Guidance & Counselling", "Early Childhood Education",
        "Special Education", "Physical & Health Education",
    ],
    "Professional": [
        "Finance & Banking", "Insurance", "Estate Management",
        "Hospitality & Tourism", "Library & Information Science",
        "Quantity Surveying", "Urban & Regional Planning", "Social Work",
    ],
};

const FACULTY_TITLES = ["Dr.", "Prof.", "Engr.", "Pharm.", "Barr.", "Lecturer"];

/* ─────────────────────────────────────────────────────────────────
   MULTI-CURRENCY: shared data (mirrors payment page exactly)
───────────────────────────────────────────────────────────────── */

/** Subset of African currencies shown in the seller preview grid */
const PREVIEW_CURRENCIES = [
    { code: "GH", name: "Ghana", currency: "GHS", flag: "🇬🇭", symbol: "GH₵", region: "West Africa" },
    { code: "KE", name: "Kenya", currency: "KES", flag: "🇰🇪", symbol: "KSh", region: "East Africa" },
    { code: "ZA", name: "South Africa", currency: "ZAR", flag: "🇿🇦", symbol: "R", region: "Southern Africa" },
    { code: "SN", name: "Francophone", currency: "XOF", flag: "🌍", symbol: "CFA", region: "WAEMU Zone" },
    { code: "CM", name: "Central Africa", currency: "XAF", flag: "🌍", symbol: "CFA", region: "CEMAC Zone" },
    { code: "UG", name: "Uganda", currency: "UGX", flag: "🇺🇬", symbol: "USh", region: "East Africa" },
    { code: "TZ", name: "Tanzania", currency: "TZS", flag: "🇹🇿", symbol: "TSh", region: "East Africa" },
    { code: "EG", name: "Egypt", currency: "EGP", flag: "🇪🇬", symbol: "E£", region: "North Africa" },
];

/** Fallback exchange rates (NGN as base = 1) */
const FALLBACK_RATES = {
    NGN: 1,
    GHS: 0.010,
    KES: 0.11,
    UGX: 2.85,
    TZS: 2.62,
    RWF: 1.38,
    ZMW: 0.028,
    MWK: 1.77,
    EGP: 0.051,
    MAD: 0.105,
    ZAR: 0.019,
    XOF: 6.56,
    XAF: 6.56,
};

/**
 * Formats a converted amount cleanly, rounding large-integer currencies.
 */
function formatConverted(ngnAmount, currency, rates, symbol) {
    const rate = rates[currency] ?? FALLBACK_RATES[currency] ?? 1;
    const local = ngnAmount * rate;
    const intCurrencies = ["UGX", "RWF", "TZS", "XOF", "XAF", "MWK"];
    const formatted = intCurrencies.includes(currency)
        ? Math.round(local).toLocaleString()
        : local < 10
            ? local.toFixed(2)
            : local.toFixed(2).replace(/\.00$/, "");
    return `${symbol}${formatted}`;
}

/* ─────────────────────────────────────────────────────────────────
   CURRENCY PREVIEW GRID COMPONENT
───────────────────────────────────────────────────────────────── */
function CurrencyPreviewGrid({ ngnPrice, rates, ratesLoaded }) {
    const price = parseFloat(ngnPrice);
    const valid = price > 0 && !isNaN(price);

    return (
        <div style={{
            marginTop: 14,
            border: "1px solid rgba(13,34,68,0.12)",
            borderRadius: 12,
            overflow: "hidden",
            background: "#fff",
            boxShadow: "0 2px 12px rgba(13,34,68,0.06)",
        }}>
            {/* Header */}
            <div style={{
                background: "#0d2244",
                backgroundImage: "radial-gradient(rgba(184,150,62,0.08) 1px, transparent 1px)",
                backgroundSize: "18px 18px",
                padding: "12px 16px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
            }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{
                        width: 28, height: 28, borderRadius: 7,
                        background: "rgba(184,150,62,0.15)",
                        border: "0.5px solid rgba(184,150,62,0.3)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                        <Globe size={13} style={{ color: "#b8963e" }} />
                    </div>
                    <div>
                        <p style={{
                            fontSize: 10, fontWeight: 700, letterSpacing: "0.14em",
                            textTransform: "uppercase", color: "#b8963e", margin: 0,
                        }}>
                            African Price Preview
                        </p>
                        <p style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", margin: 0 }}>
                            {ratesLoaded ? "Live market rates · open.er-api.com" : "Loading live rates…"}
                        </p>
                    </div>
                </div>
                {/* NGN badge */}
                <div style={{
                    background: "rgba(184,150,62,0.15)",
                    border: "0.5px solid rgba(184,150,62,0.3)",
                    padding: "4px 10px", borderRadius: 6,
                }}>
                    <span style={{
                        fontFamily: "'Playfair Display', Georgia, serif",
                        fontSize: 14, fontWeight: 800, color: "#fff",
                    }}>
                        {valid ? `₦${Number(ngnPrice).toLocaleString()}` : "₦—"}
                    </span>
                    <span style={{ fontSize: 9, color: "#b8963e", marginLeft: 4, fontWeight: 700 }}>NGN</span>
                </div>
            </div>

            {/* Grid body */}
            <div style={{ padding: "14px 16px" }}>
                {!valid ? (
                    /* Placeholder state */
                    <div style={{ textAlign: "center", padding: "18px 0" }}>
                        <TrendingUp size={22} style={{ color: "#e5e7eb", marginBottom: 6, display: "block", margin: "0 auto 8px" }} />
                        <p style={{ fontSize: 12, color: "#c0c7d1", margin: 0 }}>
                            Enter a price above to see how much buyers across Africa will pay
                        </p>
                    </div>
                ) : (
                    <>
                        <div style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(auto-fill, minmax(148px, 1fr))",
                            gap: 8,
                        }}>
                            {PREVIEW_CURRENCIES.map((c, i) => {
                                const converted = formatConverted(price, c.currency, rates, c.symbol);
                                return (
                                    <div
                                        key={c.currency + i}
                                        style={{
                                            background: "#f8f7f5",
                                            border: "0.5px solid #ede8e0",
                                            borderRadius: 9,
                                            padding: "10px 12px",
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 9,
                                            transition: "border-color 0.15s, box-shadow 0.15s",
                                        }}
                                        onMouseEnter={e => {
                                            e.currentTarget.style.borderColor = "rgba(184,150,62,0.45)";
                                            e.currentTarget.style.boxShadow = "0 2px 10px rgba(13,34,68,0.07)";
                                        }}
                                        onMouseLeave={e => {
                                            e.currentTarget.style.borderColor = "#ede8e0";
                                            e.currentTarget.style.boxShadow = "none";
                                        }}
                                    >
                                        {/* Flag */}
                                        <span style={{ fontSize: 20, lineHeight: 1, flexShrink: 0 }}>{c.flag}</span>

                                        {/* Info */}
                                        <div style={{ minWidth: 0, flex: 1 }}>
                                            <p style={{
                                                fontSize: 9, fontWeight: 700, letterSpacing: "0.08em",
                                                textTransform: "uppercase", color: "#b8963e", margin: "0 0 1px",
                                            }}>
                                                {c.currency}
                                            </p>
                                            {ratesLoaded ? (
                                                <p style={{
                                                    fontFamily: "'Playfair Display', Georgia, serif",
                                                    fontSize: 15, fontWeight: 800,
                                                    color: "#0d2244", margin: 0,
                                                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                                                }}>
                                                    {converted}
                                                </p>
                                            ) : (
                                                <div style={{
                                                    height: 14, width: "70%", borderRadius: 4,
                                                    background: "linear-gradient(90deg, #e5e7eb 25%, #f3f4f6 50%, #e5e7eb 75%)",
                                                    backgroundSize: "200% 100%",
                                                    animation: "shimmer 1.4s infinite",
                                                    marginTop: 3,
                                                }} />
                                            )}
                                            <p style={{ fontSize: 9, color: "#aab0bd", margin: "1px 0 0" }}>{c.region}</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Footer note */}
                        <div style={{
                            marginTop: 12,
                            padding: "9px 12px",
                            background: "rgba(13,34,68,0.03)",
                            border: "0.5px solid rgba(13,34,68,0.08)",
                            borderRadius: 8,
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                        }}>
                            <TrendingUp size={12} style={{ color: "#b8963e", flexShrink: 0 }} />
                            <p style={{ fontSize: 11, color: "#6b7280", margin: 0, lineHeight: 1.5 }}>
                                Buyers are charged in their local currency at live market rates via Flutterwave.
                                Rates update daily — shown here for planning purposes.
                            </p>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

/* ─────────────────────────────────────────────────────────────────
   SHARED STYLE HELPERS
───────────────────────────────────────────────────────────────── */
const base = {
    width: "100%", padding: "10px 14px", border: "1px solid #e5e7eb",
    borderRadius: 8, fontSize: 14, color: "#111827", outline: "none",
    boxSizing: "border-box", fontFamily: "inherit", background: "#fff",
    transition: "border-color 0.15s, box-shadow 0.15s",
};

function Inp({ sx = {}, ...p }) {
    return <input style={{ ...base, ...sx }} {...p} />;
}
function Sel({ sx = {}, children, ...p }) {
    return <select style={{ ...base, ...sx }} {...p}>{children}</select>;
}
function Txta({ sx = {}, ...p }) {
    return <textarea style={{ ...base, resize: "vertical", ...sx }} {...p} />;
}

function Field({ label, required, hint, children }) {
    return (
        <div>
            <label style={{
                display: "block", fontSize: 10, fontWeight: 700, letterSpacing: "0.12em",
                textTransform: "uppercase", color: "#6b7280", marginBottom: 6
            }}>
                {label} {required && <span style={{ color: "#ea580c" }}>*</span>}
            </label>
            {children}
            {hint && <p style={{ marginTop: 4, fontSize: 11, color: "#9ca3af", margin: "4px 0 0" }}>{hint}</p>}
        </div>
    );
}

function Divider({ label }) {
    return (
        <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "4px 0" }}>
            <div style={{ flex: 1, height: 1, background: "#f3f4f6" }} />
            {label && <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#d1d5db" }}>{label}</span>}
            <div style={{ flex: 1, height: 1, background: "#f3f4f6" }} />
        </div>
    );
}

/* ─────────────────────────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────────────────────────── */
export default function AdvertiseClient() {
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [intent, setIntent] = useState(null);
    const [checkingAuth, setCheckingAuth] = useState(true);
    const [user, setUser] = useState(null);
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [uploadPct, setUploadPct] = useState(0);
    const [uploadMsg, setUploadMsg] = useState("");
    const [uploadingFile, setUploadingFile] = useState(false);
    const [showDriveWarn, setShowDriveWarn] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [selectedCoverImage, setSelectedCoverImage] = useState(null);

    /* ── Exchange rates (mirrors payment page) ── */
    const [exchangeRates, setExchangeRates] = useState(FALLBACK_RATES);
    const [ratesLoaded, setRatesLoaded] = useState(false);

    const [form, setForm] = useState({
        bookTitle: "", author: "", docType: "", description: "", tableOfContents: "",
        price: "", format: "PDF", pages: "", driveLink: "", coverImagePreview: null,
        // academic
        institution: "", universityCountry: "", department: "", courseCode: "",
        semester: "", session: "", level: "100",
        // student-prep
        examBody: "", school: "",
        // divinity
        theologicalCategory: "", doctrine: "",
        // commercial
        isbn: "", genre: "", edition: "",
        // Paid
        accessType: "paid",
    });

    const set = (k, v) => setForm(p => ({ ...p, [k]: v }));
    const handle = e => set(e.target.name, e.target.value);

    /* ── Fetch live exchange rates (same source as payment page) ── */
    useEffect(() => {
        const fetchRates = async () => {
            try {
                const res = await fetch("https://open.er-api.com/v6/latest/NGN");
                if (!res.ok) throw new Error("rate fetch failed");
                const data = await res.json();
                if (data?.rates) {
                    setExchangeRates(prev => ({
                        ...FALLBACK_RATES,
                        ...data.rates,
                        NGN: 1,
                    }));
                }
            } catch {
                console.warn("[Exchange] Using fallback rates on advertise page");
            } finally {
                setRatesLoaded(true);
            }
        };
        fetchRates();
    }, []);

    /* ── Auth + Smart auto-fill ── */
    useEffect(() => {
        const unsub = onAuthStateChanged(auth, async cu => {
            if (!cu) { setCheckingAuth(false); router.replace("/auth/signin?redirect=/advertise"); return; }
            setUser(cu);
            try {
                const snap = await getDoc(doc(db, "users", cu.uid));
                const fd = snap.exists() ? snap.data() : null;
                setUserData(fd);
                setForm(p => ({
                    ...p,
                    author: fd?.displayName || fd?.name || cu.displayName || "",
                    institution: fd?.selectedUniversity || fd?.university || "",
                    universityCountry: fd?.country || "",
                    department: fd?.department || "",
                }));
            } catch {
                setForm(p => ({ ...p, author: cu.displayName || "" }));
            }
            setCheckingAuth(false);
        });
        return () => unsub();
    }, [router]);

    useEffect(() => {
        return () => { if (form.coverImagePreview) URL.revokeObjectURL(form.coverImagePreview); };
    }, [form.coverImagePreview]);

    /* ── Helpers ── */
    const extractDriveId = url => {
        if (!url) return "";
        const m = url.match(/\/d\/([\w-]{25,})|\/file\/d\/([\w-]{25,})|id=([\w-]{25,})/);
        return m ? (m[1] || m[2] || m[3]) : "";
    };

    const uploadPDF = async file => {
        if (!file) return null;
        if (file.type !== "application/pdf") { alert("PDF only"); return null; }
        if (file.size > 50 * 1024 * 1024) { alert("Max 50MB"); return null; }
        try {
            setUploadingFile(true);
            const r = ref(storage, `books/${user.uid}/${Date.now()}_${file.name.replace(/\s+/g, "_")}`);
            const task = uploadBytesResumable(r, file);
            return await new Promise((res, rej) =>
                task.on("state_changed",
                    s => { const p = Math.round(s.bytesTransferred / s.totalBytes * 100); setUploadPct(p); setUploadMsg(`Uploading PDF: ${p}%`); },
                    rej,
                    async () => res(await getDownloadURL(task.snapshot.ref))
                )
            );
        } catch (e) { alert(e.message || "Upload failed"); return null; }
        finally { setUploadingFile(false); setUploadMsg(""); }
    };

    const uploadCover = async file => {
        if (!file) return null;
        if (!["image/jpeg", "image/jpg", "image/png", "image/webp"].includes(file.type)) { alert("JPG/PNG/WEBP only"); return null; }
        if (file.size > 5 * 1024 * 1024) { alert("Max 5MB"); return null; }
        try {
            setUploadMsg("Uploading cover…");
            const r = ref(storage, `covers/${user.uid}/${Date.now()}_${file.name.replace(/\s+/g, "_")}`);
            const task = uploadBytesResumable(r, file);
            return await new Promise((res, rej) =>
                task.on("state_changed", null, rej, async () => res(await getDownloadURL(task.snapshot.ref)))
            );
        } catch (e) { alert(e.message || "Cover upload failed"); return null; }
        finally { setUploadMsg(""); }
    };

    /* ── Validation per step ── */
    const canProceed = () => {
        if (step === 1) return !!intent;
        if (step === 2) {
            const base = form.bookTitle && form.author && form.docType && form.description;
            if (!base) return false;
            if (intent === "divinity" && !form.theologicalCategory) return false;
            if (intent === "commercial" && !form.genre) return false;
            if (intent === "student-prep" && !form.examBody) return false;
            return true;
        }
        if (step === 3) {
            const hasFile = selectedFile || form.driveLink;
            const hasPages = !!form.pages;
            if (!hasFile || !hasPages) return false;
            if (form.accessType === "paid" && (!form.price || Number(form.price) <= 0)) return false;
            return true;
        }
    };

    /* ── Submit ── */
    const handleSubmit = async () => {
        if (!canProceed()) { alert("Please fill all required fields."); return; }
        try {
            setLoading(true);
            let pdfUrl = form.driveLink;
            if (selectedFile) { pdfUrl = await uploadPDF(selectedFile); if (!pdfUrl) { setLoading(false); return; } }
            let coverImageUrl = null;
            if (selectedCoverImage) coverImageUrl = await uploadCover(selectedCoverImage);

            setUploadMsg("Saving document details…");
            const driveId = extractDriveId(pdfUrl);
            const embedUrl = pdfUrl?.includes("drive.google.com") && driveId
                ? `https://drive.google.com/file/d/${driveId}/preview` : pdfUrl;
            const displayName = userData?.displayName || userData?.name || user.displayName || "";

            await addDoc(collection(db, "advertMyBook"), {
                userId: user.uid, sellerId: user.uid,
                sellerEmail: user.email, sellerName: displayName,
                sellerPhone: userData?.phoneNumber || null,
                bookTitle: form.bookTitle, author: form.author,
                docType: form.docType, description: form.description,
                tableOfContents: form.tableOfContents || null,
                format: form.format, pages: Number(form.pages),
                intent,
                pdfUrl, pdfLink: pdfUrl, embedUrl,
                driveFileId: driveId || null,
                coverImage: coverImageUrl, image: coverImageUrl,
                uploadMethod: selectedFile ? "direct_upload" : "drive_link",
                category: intent === "commercial" ? form.genre
                    : intent === "divinity" ? "Religion & Spirituality"
                        : form.department || "General",
                institutionalCategory:
                    intent === "academic" ? "university"
                        : intent === "student-prep" ? "exam-prep"
                            : null,
                university: ["academic"].includes(intent) ? form.institution : null,
                universityCountry: ["academic"].includes(intent) ? form.universityCountry : null,
                department: intent === "academic" ? form.department : null,
                courseCode: intent === "academic" ? (form.courseCode?.toUpperCase() || null) : null,
                semester: intent === "academic" ? form.semester : null,
                session: intent === "academic" ? form.session : null,
                level: ["academic", "student-prep"].includes(intent) ? form.level : null,
                examBody: intent === "student-prep" ? form.examBody : null,
                school: intent === "student-prep" ? (form.school || null) : null,
                isReligiousDocument: intent === "divinity",
                theologicalCategory: intent === "divinity" ? form.theologicalCategory : null,
                doctrine: intent === "divinity" ? (form.doctrine || null) : null,
                isbn: intent === "commercial" ? (form.isbn || "N/A") : null,
                genre: intent === "commercial" ? form.genre : null,
                edition: intent === "commercial" ? (form.edition || null) : null,
                status: "pending", views: 0, purchases: 0,
                createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
                isFree: form.accessType === "free",
                price: form.accessType === "free" ? 0 : Number(form.price),
            });

            alert("Submitted! We'll review within 24–48 hours.");
            router.replace("/upload-document/my-pending-books");
        } catch (e) {
            console.error(e);
            alert(e.message || "Something went wrong.");
        } finally { setLoading(false); setUploadMsg(""); setUploadingFile(false); }
    };

    /* ── Loading state ── */
    if (checkingAuth) return (
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f8f6f2" }}>
            <div style={{ textAlign: "center" }}>
                <div style={{ width: 40, height: 40, border: "2px solid #1a3a5c", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.7s linear infinite", margin: "0 auto" }} />
                <p style={{ marginTop: 12, fontSize: 13, color: "#9ca3af" }}>Loading…</p>
            </div>
        </div>
    );

    /* ── Derived user flags ── */
    const isLecturer = userData?.isLecturer === true || userData?.role === "lecturer";
    const isSeller = userData?.isSeller === true;
    const isFaculty = FACULTY_TITLES.some(t =>
        userData?.lecturerTitle?.includes(t) || userData?.title?.includes(t) ||
        userData?.role === "lecturer" || userData?.isLecturer === true
    );
    const isPending = userData?.lecturerVerificationStatus === "pending";

    const earnings = form.price ? (Number(form.price) * 0.8).toLocaleString() : "0";
    const platformFee = form.price ? (Number(form.price) * 0.2).toLocaleString() : "0";
    const activeIntent = INTENTS.find(i => i.id === intent);

    return (
        <div style={{ minHeight: "100vh", background: "#f8f6f2", fontFamily: "'DM Sans',system-ui,sans-serif" }}>
            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=Playfair+Display:wght@600;700;800&display=swap');
        .pf { font-family:'Playfair Display',Georgia,serif; }
        @keyframes spin { to { transform:rotate(360deg); } }
        @keyframes fadeIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        @keyframes shimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        .fade-in { animation: fadeIn 0.3s ease forwards; }
        .intent-card {
          transition: all 0.18s ease; cursor:pointer;
          border: 2px solid #e5e7eb; background:#fff;
          border-radius:16px; padding:20px 18px;
          position:relative; display:flex; flex-direction:column; gap:10px;
        }
        .intent-card:hover { transform:translateY(-2px); box-shadow:0 8px 28px rgba(0,0,0,0.08); }
        .upload-drop { border:2px dashed #e5e7eb; border-radius:12px; padding:28px;
          text-align:center; cursor:pointer; transition:all 0.2s; display:block; }
        .upload-drop:hover  { border-color:#1a3a5c; background:rgba(26,58,92,0.02); }
        .upload-drop.filled { border-color:#16a34a; background:rgba(22,163,74,0.03); border-style:solid; }
        input:focus, select:focus, textarea:focus {
          border-color:#1a3a5c !important;
          box-shadow: 0 0 0 3px rgba(26,58,92,0.09) !important;
          outline:none;
        }
        .badge-recommended {
          position:absolute; top:10px; right:10px;
          background:#b38b59; color:#fff; font-size:8px; font-weight:800;
          padding:3px 8px; border-radius:4px; letter-spacing:0.07em; text-transform:uppercase;
        }
        .currency-cell:hover { border-color:rgba(184,150,62,0.45) !important; box-shadow:0 2px 10px rgba(13,34,68,0.07) !important; }
        @media(max-width:768px){
          .pub-layout { grid-template-columns:1fr !important; }
          .intent-grid { grid-template-columns:1fr !important; }
          .two-col     { grid-template-columns:1fr !important; }
          .currency-grid { grid-template-columns: 1fr 1fr !important; }
        }
      `}</style>

            {/* ── Header ── */}
            <header style={{ background: "#1a3a5c", padding: "13px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 30, height: 30, background: "rgba(255,255,255,0.15)", borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <BookOpen size={15} color="white" />
                    </div>
                    <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 13 }}>›</span>
                    <a href="/uploader-agreement" style={{ color: "rgba(255,255,255,0.6)", fontSize: 13, textDecoration: "underline" }}>Uploader Agreement</a>
                </div>
                <button onClick={() => router.back()} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.5)", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, fontSize: 13 }}>
                    <X size={14} /> Exit
                </button>
            </header>

            <div style={{ maxWidth: 980, margin: "0 auto", padding: "32px 16px" }}>

                {/* ── Page Title ── */}
                <div style={{ marginBottom: 28 }}>
                    <h1 className="pf" style={{ fontSize: 28, fontWeight: 800, color: "#111827", margin: "0 0 4px" }}>Publish Your Document</h1>
                    <p style={{ fontSize: 14, color: "#6b7280", margin: 0 }}>Reach thousands of students — earn 80% on every sale.</p>
                </div>

                {/* ── Stepper ── */}
                <div style={{ display: "flex", alignItems: "center", marginBottom: 36, maxWidth: 440 }}>
                    {STEPS.map((s, i) => {
                        const Icon = s.icon;
                        const done = step > s.id;
                        const active = step === s.id;
                        return (
                            <React.Fragment key={s.id}>
                                <div style={{ display: "flex", alignItems: "center", gap: 8, cursor: done ? "pointer" : "default" }}
                                    onClick={() => done && setStep(s.id)}>
                                    <div style={{
                                        width: 34, height: 34, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                                        background: done ? "#16a34a" : active ? "#1a3a5c" : "#e5e7eb",
                                        color: done || active ? "#fff" : "#9ca3af", transition: "all 0.25s", flexShrink: 0
                                    }}>
                                        {done ? <Check size={15} /> : <Icon size={15} />}
                                    </div>
                                    <span style={{
                                        fontSize: 12, fontWeight: 700, whiteSpace: "nowrap",
                                        color: active ? "#1a3a5c" : done ? "#16a34a" : "#9ca3af"
                                    }}>
                                        {s.label}
                                    </span>
                                </div>
                                {i < STEPS.length - 1 && (
                                    <div style={{ flex: 1, height: 2, margin: "0 10px", background: "#e5e7eb", position: "relative", overflow: "hidden", minWidth: 24 }}>
                                        <div style={{ position: "absolute", inset: 0, background: "#16a34a", width: done ? "100%" : "0%", transition: "width 0.5s ease" }} />
                                    </div>
                                )}
                            </React.Fragment>
                        );
                    })}
                </div>

                {/* ── Two-column layout ── */}
                <div className="pub-layout" style={{ display: "grid", gridTemplateColumns: "1fr 268px", gap: 20, alignItems: "start" }}>

                    {/* ════════════════════════════════════════════
              MAIN CARD
          ════════════════════════════════════════════ */}
                    <div style={{ background: "#fff", borderRadius: 18, border: "1px solid #ebebeb", boxShadow: "0 1px 6px rgba(0,0,0,0.05)", overflow: "hidden" }}>

                        {/* ══════════ STEP 1 — Intent ══════════ */}
                        {step === 1 && (
                            <div className="fade-in">
                                <div style={{ padding: "24px 28px", borderBottom: "1px solid #f5f5f5", background: "linear-gradient(to right,rgba(26,58,92,0.04),transparent)" }}>
                                    <h2 className="pf" style={{ fontSize: 20, fontWeight: 700, color: "#111827", margin: "0 0 3px" }}>What are you publishing?</h2>
                                    <p style={{ fontSize: 13, color: "#9ca3af", margin: 0 }}>Choose the path that best fits your document</p>
                                </div>

                                <div style={{ padding: 28 }}>
                                    <div className="intent-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 24 }}>
                                        {INTENTS.map(card => {
                                            const Icon = card.icon;
                                            const sel = intent === card.id;
                                            const recommended = (card.id === "academic" && isLecturer) || (card.id === "commercial" && isSeller);
                                            return (
                                                <div key={card.id}
                                                    className="intent-card"
                                                    onClick={() => setIntent(card.id)}
                                                    style={{
                                                        borderColor: sel ? card.color : "#e5e7eb",
                                                        boxShadow: sel ? `0 0 0 3px ${card.color}20` : "none"
                                                    }}>
                                                    {recommended && <span className="badge-recommended">✦ For You</span>}
                                                    {sel && (
                                                        <div style={{
                                                            position: "absolute", top: 10, left: 10, width: 20, height: 20, borderRadius: "50%",
                                                            background: card.color, display: "flex", alignItems: "center", justifyContent: "center"
                                                        }}>
                                                            <Check size={11} color="#fff" />
                                                        </div>
                                                    )}
                                                    <div style={{ width: 42, height: 42, borderRadius: 11, background: card.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                                        <Icon size={20} style={{ color: card.color }} />
                                                    </div>
                                                    <div>
                                                        <h3 style={{ fontSize: 14, fontWeight: 700, color: "#111827", margin: "0 0 3px" }}>{card.label}</h3>
                                                        <p style={{ fontSize: 11.5, color: "#9ca3af", margin: 0, lineHeight: 1.5 }}>{card.description}</p>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {userData && (form.author || form.institution || form.department) && (
                                        <div style={{ background: "#eff6ff", border: "1px solid #c7dff7", borderRadius: 12, padding: "13px 16px" }}>
                                            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#2563eb", margin: "0 0 8px" }}>
                                                ⚡ Smart auto-fill ready for Step 2
                                            </p>
                                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                                                {[
                                                    ["Author", form.author],
                                                    ["Institution", form.institution],
                                                    ["Department", form.department],
                                                    ["Country", form.universityCountry],
                                                ].filter(([, v]) => v).map(([k, v]) => (
                                                    <div key={k} style={{ display: "flex", gap: 6, alignItems: "center" }}>
                                                        <Check size={10} style={{ color: "#16a34a", flexShrink: 0 }} />
                                                        <span style={{ fontSize: 12, color: "#1e3a5f" }}><strong>{k}:</strong> {v}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* ══════════ STEP 2 — Details ══════════ */}
                        {step === 2 && activeIntent && (
                            <div className="fade-in">
                                <div style={{
                                    padding: "22px 28px", borderBottom: "1px solid #f5f5f5",
                                    background: `linear-gradient(to right,${activeIntent.color}0d,transparent)`
                                }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                        <div style={{ width: 32, height: 32, borderRadius: 8, background: activeIntent.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                            {React.createElement(activeIntent.icon, { size: 16, style: { color: activeIntent.color } })}
                                        </div>
                                        <div>
                                            <h2 className="pf" style={{ fontSize: 20, fontWeight: 700, color: "#111827", margin: 0 }}>Document Details</h2>
                                            <p style={{ fontSize: 12, color: "#9ca3af", margin: 0 }}>{activeIntent.label}</p>
                                        </div>
                                    </div>
                                </div>

                                <div style={{ padding: 28, display: "flex", flexDirection: "column", gap: 20 }}>

                                    <Field label="Title" required hint="Use the exact title as it appears on the document">
                                        <Inp name="bookTitle" value={form.bookTitle} onChange={handle} placeholder="e.g. Introduction to Organic Chemistry" />
                                    </Field>

                                    <Field label="Author / Creator" required hint="Auto-filled from your profile">
                                        <Inp name="author" value={form.author} onChange={handle} placeholder="Full author name" />
                                    </Field>

                                    <Field label="Document Type" required>
                                        <Sel name="docType" value={form.docType} onChange={handle}>
                                            <option value="">— Select Type —</option>
                                            {(DOC_TYPES[intent] || []).map(t => <option key={t} value={t}>{t}</option>)}
                                        </Sel>
                                    </Field>

                                    <Field label="Description" required hint="2–5 sentences about the content, target readers, and what makes it valuable">
                                        <Txta name="description" value={form.description} onChange={handle}
                                            placeholder="Describe the content, target readers, and what makes this valuable…" rows={4} />
                                    </Field>

                                    <Field label="Table of Contents / Key Topics" hint="Optional — helps with discovery">
                                        <Txta name="tableOfContents" value={form.tableOfContents} onChange={handle}
                                            placeholder={"Chapter 1: Introduction…\nChapter 2: …"} rows={3} />
                                    </Field>

                                    <Divider label="Intent-specific info" />

                                    {/* ════ ACADEMIC ════ */}
                                    {intent === "academic" && (
                                        <>
                                            <div className="two-col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                                                <Field label="Country">
                                                    <Sel name="universityCountry" value={form.universityCountry}
                                                        onChange={e => { set("universityCountry", e.target.value); set("institution", ""); }}>
                                                        <option value="">— Country —</option>
                                                        {UNIVERSITY_COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                                                    </Sel>
                                                </Field>
                                                <Field label="Institution" hint="Pre-filled from your profile">
                                                    <Sel name="institution" value={form.institution} onChange={handle} disabled={!form.universityCountry}>
                                                        <option value="">— University —</option>
                                                        {(form.universityCountry ? (UNIVERSITIES_BY_COUNTRY[form.universityCountry] || []) : [])
                                                            .map(u => <option key={u.name} value={u.name}>{u.name}</option>)}
                                                    </Sel>
                                                </Field>
                                            </div>

                                            <div className="two-col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                                                <Field label="Department" hint="Pre-filled from your profile — change if needed">
                                                    <Sel name="department" value={form.department} onChange={handle}>
                                                        <option value="">— Select Department —</option>
                                                        {Object.entries(DEPARTMENTS_BY_FACULTY).map(([faculty, depts]) => (
                                                            <optgroup key={faculty} label={faculty}>
                                                                {depts.map(d => <option key={d} value={d}>{d}</option>)}
                                                            </optgroup>
                                                        ))}
                                                        <option value="Other">Other (specify in description)</option>
                                                    </Sel>
                                                </Field>
                                                <Field label="Course Code">
                                                    <Inp name="courseCode" value={form.courseCode} onChange={handle} placeholder="e.g. CHE 301" />
                                                </Field>
                                            </div>

                                            <div className="two-col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                                                <Field label="Level">
                                                    <Sel name="level" value={form.level} onChange={handle}>
                                                        {LEVELS.filter(l => !["ss1", "ss2", "ss3"].includes(l.value)).map(l =>
                                                            <option key={l.value} value={l.value}>{l.label}</option>)}
                                                    </Sel>
                                                </Field>
                                                <Field label="Semester">
                                                    <Sel name="semester" value={form.semester} onChange={handle}>
                                                        <option value="">— Select —</option>
                                                        {SEMESTERS.map(s => <option key={s} value={s}>{s}</option>)}
                                                    </Sel>
                                                </Field>
                                            </div>

                                            <Field label="Academic Session" hint="e.g. 2024/2025">
                                                <Inp name="session" value={form.session} onChange={handle} placeholder="2024/2025" />
                                            </Field>
                                        </>
                                    )}

                                    {/* ════ STUDENT PREP ════ */}
                                    {intent === "student-prep" && (
                                        <>
                                            <div className="two-col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                                                <Field label="Exam Body" required>
                                                    <Sel name="examBody" value={form.examBody} onChange={handle}>
                                                        <option value="">— Select —</option>
                                                        {EXAM_BODIES.map(e => <option key={e} value={e}>{e}</option>)}
                                                    </Sel>
                                                </Field>
                                                <Field label="Level / Class">
                                                    <Sel name="level" value={form.level} onChange={handle}>
                                                        {LEVELS.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
                                                    </Sel>
                                                </Field>
                                            </div>
                                            <Field label="School / Institution" hint="Leave blank for general materials">
                                                <Inp name="school" value={form.school} onChange={handle} placeholder="e.g. Federal Government College Abuja" />
                                            </Field>
                                        </>
                                    )}

                                    {/* ════ DIVINITY ════ */}
                                    {intent === "divinity" && (
                                        <>
                                            <div style={{ padding: "12px 16px", background: "rgba(124,58,237,0.05)", border: "0.5px solid rgba(124,58,237,0.22)", borderRadius: 10 }}>
                                                <p style={{ fontSize: 12, color: "#6d28d9", margin: 0 }}>
                                                    ✦ This document will appear in the <strong>LAN Divinity Vault</strong> alongside sacred texts and theological manuscripts.
                                                </p>
                                            </div>
                                            <Field label="Theological Tradition" required>
                                                <Sel name="theologicalCategory" value={form.theologicalCategory} onChange={handle}
                                                    sx={{ borderColor: "rgba(124,58,237,0.3)" }}>
                                                    <option value="">— Select Tradition —</option>
                                                    {THEOLOGICAL_OPTS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                                                </Sel>
                                            </Field>
                                            <Field label="Doctrine / Sub-discipline" hint="e.g. Systematic Theology, Hadith Sciences, Tafsir">
                                                <Inp name="doctrine" value={form.doctrine} onChange={handle} placeholder="e.g. Systematic Theology" />
                                            </Field>
                                        </>
                                    )}

                                    {/* ════ COMMERCIAL ════ */}
                                    {intent === "commercial" && (
                                        <>
                                            <div style={{ padding: "12px 16px", background: "rgba(180,83,9,0.05)", border: "0.5px solid rgba(180,83,9,0.22)", borderRadius: 10 }}>
                                                <p style={{ fontSize: 12, color: "#92400e", margin: 0 }}>
                                                    📚 Commercial titles are listed in the main bookstore. ISBN and genre help readers discover your work.
                                                </p>
                                            </div>
                                            <div className="two-col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                                                <Field label="ISBN" hint="Optional: 13-digit ISBN if registered.">
                                                    <Inp name="isbn" value={form.isbn} onChange={handle} placeholder="978-1234567890" />
                                                </Field>
                                                <Field label="Edition">
                                                    <Inp name="edition" value={form.edition} onChange={handle} placeholder="e.g. 3rd Edition" />
                                                </Field>
                                            </div>
                                            <Field label="Genre" required>
                                                <Sel name="genre" value={form.genre} onChange={handle}>
                                                    <option value="">— Select Genre —</option>
                                                    {GENRES.map(g => <option key={g} value={g}>{g}</option>)}
                                                </Sel>
                                            </Field>
                                        </>
                                    )}

                                </div>
                            </div>
                        )}

                        {/* ══════════ STEP 3 — Upload & Price ══════════ */}
                        {step === 3 && (
                            <div className="fade-in">
                                <div style={{ padding: "22px 28px", borderBottom: "1px solid #f5f5f5", background: "linear-gradient(to right,rgba(22,163,74,0.05),transparent)" }}>
                                    <h2 className="pf" style={{ fontSize: 20, fontWeight: 700, color: "#111827", margin: "0 0 3px" }}>Upload & Pricing</h2>
                                    <p style={{ fontSize: 13, color: "#9ca3af", margin: 0 }}>Add your file, cover image, and set your price</p>
                                </div>

                                <div style={{ padding: 28, display: "flex", flexDirection: "column", gap: 24 }}>

                                    {/* ── PDF Upload ── */}
                                    <div>
                                        <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#6b7280", marginBottom: 10 }}>
                                            PDF Document <span style={{ color: "#ea580c" }}>*</span>
                                        </p>
                                        <label className={`upload-drop ${selectedFile ? "filled" : ""}`}>
                                            <input type="file" accept="application/pdf" style={{ display: "none" }}
                                                onChange={e => { const f = e.target.files[0]; if (f) { setSelectedFile(f); set("driveLink", ""); } }}
                                                disabled={uploadingFile || loading} />
                                            {selectedFile ? (
                                                <div>
                                                    <div style={{ width: 44, height: 44, background: "#dcfce7", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 10px" }}>
                                                        <Check size={20} style={{ color: "#16a34a" }} />
                                                    </div>
                                                    <p style={{ fontWeight: 600, color: "#16a34a", fontSize: 13, margin: "0 0 2px" }}>{selectedFile.name}</p>
                                                    <p style={{ fontSize: 12, color: "#16a34a", margin: "0 0 8px" }}>{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                                                    <button type="button" onClick={e => { e.preventDefault(); setSelectedFile(null); }}
                                                        style={{ fontSize: 11, color: "#ef4444", background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}>
                                                        Remove
                                                    </button>
                                                </div>
                                            ) : (
                                                <div>
                                                    <div style={{ width: 44, height: 44, background: "#f3f4f6", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 10px" }}>
                                                        <Upload size={20} style={{ color: "#9ca3af" }} />
                                                    </div>
                                                    <p style={{ fontWeight: 600, color: "#374151", fontSize: 13, margin: "0 0 4px" }}>Click to upload PDF</p>
                                                    <p style={{ fontSize: 12, color: "#9ca3af", margin: 0 }}>Max 50 MB</p>
                                                </div>
                                            )}
                                        </label>

                                        {uploadPct > 0 && uploadPct < 100 && (
                                            <div style={{ marginTop: 12 }}>
                                                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#6b7280", marginBottom: 4 }}>
                                                    <span>Uploading…</span><span>{uploadPct}%</span>
                                                </div>
                                                <div style={{ height: 6, background: "#f3f4f6", borderRadius: 99, overflow: "hidden" }}>
                                                    <div style={{ height: "100%", background: "#1a3a5c", width: `${uploadPct}%`, transition: "width 0.3s" }} />
                                                </div>
                                            </div>
                                        )}

                                        <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "18px 0" }}>
                                            <div style={{ flex: 1, height: 1, background: "#e5e7eb" }} />
                                            <span style={{ fontSize: 10, color: "#9ca3af", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>or paste a link</span>
                                            <div style={{ flex: 1, height: 1, background: "#e5e7eb" }} />
                                        </div>

                                        <Inp name="driveLink" type="url"
                                            placeholder="https://drive.google.com/file/d/…"
                                            value={form.driveLink}
                                            onChange={e => {
                                                set("driveLink", e.target.value);
                                                if (e.target.value.includes("drive.google.com")) {
                                                    const hasView = e.target.value.includes("/view") || e.target.value.includes("usp=sharing");
                                                    if (extractDriveId(e.target.value) && !hasView) setShowDriveWarn(true);
                                                }
                                            }}
                                            disabled={!!selectedFile || loading}
                                            sx={selectedFile ? { background: "#f9fafb", color: "#9ca3af", cursor: "not-allowed" } : {}} />
                                        {form.driveLink && (
                                            <p style={{ fontSize: 11, color: "#d97706", marginTop: 6, display: "flex", alignItems: "center", gap: 4 }}>
                                                <AlertCircle size={11} /> Ensure sharing is set to "Anyone with the link can view"
                                            </p>
                                        )}
                                    </div>

                                    <Divider />

                                    {/* ── Cover Image ── */}
                                    <div>
                                        <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#6b7280", marginBottom: 4 }}>
                                            Cover Image <span style={{ fontWeight: 400, textTransform: "none", letterSpacing: 0, color: "#9ca3af" }}>(Optional)</span>
                                        </p>
                                        <p style={{ fontSize: 11.5, color: "#9ca3af", marginBottom: 12 }}>Documents with covers sell 2× more. JPG/PNG/WEBP, max 5 MB.</p>
                                        <div style={{ display: "grid", gridTemplateColumns: "1fr 90px", gap: 14, alignItems: "start" }}>
                                            <label className={`upload-drop ${selectedCoverImage ? "filled" : ""}`} style={{ padding: "20px 16px" }}>
                                                <input type="file" accept="image/jpeg,image/png,image/webp" style={{ display: "none" }}
                                                    onChange={e => { const f = e.target.files[0]; if (f) { setSelectedCoverImage(f); set("coverImagePreview", URL.createObjectURL(f)); } }}
                                                    disabled={loading} />
                                                {selectedCoverImage ? (
                                                    <div>
                                                        <Check size={18} style={{ color: "#16a34a", display: "block", margin: "0 auto 6px" }} />
                                                        <p style={{ fontSize: 11, fontWeight: 600, color: "#16a34a", margin: "0 0 4px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{selectedCoverImage.name}</p>
                                                        <button type="button" onClick={e => { e.preventDefault(); setSelectedCoverImage(null); set("coverImagePreview", null); }}
                                                            style={{ fontSize: 10, color: "#ef4444", background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}>Remove</button>
                                                    </div>
                                                ) : (
                                                    <div>
                                                        <ImageIcon size={22} style={{ color: "#d1d5db", display: "block", margin: "0 auto 6px" }} />
                                                        <p style={{ fontSize: 12, fontWeight: 600, color: "#6b7280", margin: 0 }}>Upload Cover</p>
                                                    </div>
                                                )}
                                            </label>
                                            <div style={{
                                                aspectRatio: "3/4", background: "#f3f4f6", borderRadius: 8, overflow: "hidden",
                                                display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid #e5e7eb"
                                            }}>
                                                {form.coverImagePreview
                                                    ? <img src={form.coverImagePreview} alt="Cover preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                                    : <ImageIcon size={20} style={{ color: "#d1d5db" }} />
                                                }
                                            </div>
                                        </div>
                                    </div>

                                    <Divider label="Pricing" />

                                    {/* ── Access Type Toggle ── */}
                                    <div>
                                        <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#6b7280", marginBottom: 10 }}>
                                            Access Type <span style={{ color: "#ea580c" }}>*</span>
                                        </p>
                                        <div style={{ display: "flex", gap: 0, border: "2px solid #e5e7eb", borderRadius: 12, overflow: "hidden" }}>
                                            {[
                                                { value: "paid", label: "💰 Paid", desc: "Readers purchase to access", color: "#1a3a5c" },
                                                { value: "free", label: "🔓 Free", desc: "Open access for everyone", color: "#16a34a" },
                                            ].map(opt => (
                                                <button
                                                    key={opt.value}
                                                    type="button"
                                                    onClick={() => { set("accessType", opt.value); if (opt.value === "free") set("price", "0"); }}
                                                    style={{
                                                        flex: 1, padding: "14px 12px", border: "none", cursor: "pointer",
                                                        background: form.accessType === opt.value ? opt.color : "#fff",
                                                        color: form.accessType === opt.value ? "#fff" : "#6b7280",
                                                        transition: "all 0.18s", display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
                                                    }}
                                                >
                                                    <span style={{ fontSize: 14, fontWeight: 700 }}>{opt.label}</span>
                                                    <span style={{ fontSize: 11, opacity: form.accessType === opt.value ? 0.8 : 0.6 }}>{opt.desc}</span>
                                                </button>
                                            ))}
                                        </div>

                                        {form.accessType === "free" && (
                                            <div style={{ marginTop: 12, padding: "12px 16px", background: "rgba(22,163,74,0.07)", border: "1px solid rgba(22,163,74,0.25)", borderRadius: 10, display: "flex", alignItems: "flex-start", gap: 10 }}>
                                                <Check size={15} style={{ color: "#16a34a", marginTop: 1, flexShrink: 0 }} />
                                                <div>
                                                    <p style={{ fontSize: 13, fontWeight: 700, color: "#15803d", margin: "0 0 2px" }}>Open Access Document</p>
                                                    <p style={{ fontSize: 12, color: "#16a34a", margin: 0, lineHeight: 1.5 }}>
                                                        This document will be listed on the <strong>Open Access</strong> page and freely downloadable by all students.
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* ── Price + Pages + Format ── */}
                                    <div className="two-col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>

                                        {/* ── Price block ── */}
                                        {form.accessType !== "free" && (
                                            <div>
                                                <Field label="Price (₦)" required>
                                                    <div style={{ position: "relative" }}>
                                                        <span style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", color: "#9ca3af", fontWeight: 700, fontSize: 14 }}>₦</span>
                                                        <Inp type="number" name="price" value={form.price} onChange={handle}
                                                            placeholder="0" sx={{ paddingLeft: 30 }} />
                                                    </div>
                                                </Field>
                                                {form.price && Number(form.price) > 0 && (
                                                    <div style={{ marginTop: 10, padding: "13px 15px", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 10 }}>
                                                        <p style={{ fontSize: 10, color: "#15803d", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 2px" }}>Your earnings per sale</p>
                                                        <p className="pf" style={{ fontSize: 26, fontWeight: 800, color: "#15803d", margin: "0 0 1px" }}>₦{earnings}</p>
                                                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#16a34a", borderTop: "1px solid #bbf7d0", paddingTop: 6, marginTop: 6 }}>
                                                            <span>Your share (80%)</span>
                                                            <span style={{ fontWeight: 700 }}>₦{earnings}</span>
                                                        </div>
                                                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#9ca3af" }}>
                                                            <span>Platform (20%)</span>
                                                            <span>₦{platformFee}</span>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* ── Free placeholder ── */}
                                        {form.accessType === "free" && (
                                            <div style={{ padding: "13px 15px", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 10, display: "flex", flexDirection: "column", justifyContent: "center", gap: 4 }}>
                                                <p style={{ fontSize: 10, fontWeight: 700, color: "#15803d", textTransform: "uppercase", letterSpacing: "0.08em", margin: 0 }}>Open Access</p>
                                                <p className="pf" style={{ fontSize: 22, fontWeight: 800, color: "#15803d", margin: 0 }}>Free for all</p>
                                                <p style={{ fontSize: 11, color: "#16a34a", margin: 0 }}>No wallet balance needed to read</p>
                                            </div>
                                        )}

                                        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                                            <Field label="Number of Pages" required>
                                                <Inp type="number" name="pages" value={form.pages} onChange={handle} placeholder="e.g. 224" />
                                            </Field>
                                            <Field label="Format">
                                                <div style={{ display: "flex", gap: 6 }}>
                                                    {["PDF", "EPUB", "MOBI"].map(f => (
                                                        <button key={f} type="button" onClick={() => set("format", f)}
                                                            style={{
                                                                flex: 1, padding: "9px 0", border: `2px solid ${form.format === f ? "#1a3a5c" : "#e5e7eb"}`,
                                                                background: form.format === f ? "#1a3a5c" : "#fff",
                                                                color: form.format === f ? "#fff" : "#374151",
                                                                borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer", transition: "all 0.15s"
                                                            }}>
                                                            {f}
                                                        </button>
                                                    ))}
                                                </div>
                                            </Field>
                                        </div>
                                    </div>

                                    {/* ══════════════════════════════════════════════════════
                                        MULTI-CURRENCY PRICE PREVIEW GRID
                                        Shown only when access type is "paid"
                                    ══════════════════════════════════════════════════════ */}
                                    {form.accessType !== "free" && (
                                        <CurrencyPreviewGrid
                                            ngnPrice={form.price}
                                            rates={exchangeRates}
                                            ratesLoaded={ratesLoaded}
                                        />
                                    )}

                                    {/* Pricing guide */}
                                    {form.accessType !== "free" && (
                                        <div style={{ background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 12, padding: "15px 18px" }}>
                                            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#6b7280", margin: "0 0 10px" }}>💡 Pricing Guide</p>
                                            {[
                                                ["Past Questions / Notes", "₦500 – ₦1,500"],
                                                ["Lecture Notes / Summaries", "₦1,000 – ₦3,000"],
                                                ["Textbooks / Full Projects", "₦2,500 – ₦8,000"],
                                                ["Premium Thesis / Dissertation", "₦5,000 – ₦15,000"],
                                            ].map(([t, r]) => (
                                                <div key={t} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "2px 0" }}>
                                                    <span style={{ color: "#6b7280" }}>{t}</span>
                                                    <span style={{ fontWeight: 700, color: "#111827" }}>{r}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {uploadMsg && (
                                        <p style={{ textAlign: "center", fontSize: 13, fontWeight: 600, color: "#1a3a5c" }}>{uploadMsg}</p>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* ── Navigation buttons ── */}
                        <div style={{ padding: "0 28px 28px", display: "flex", gap: 10 }}>
                            {step > 1 && (
                                <button type="button" onClick={() => setStep(s => s - 1)} disabled={loading}
                                    style={{
                                        flex: 1, padding: "12px 0", border: "2px solid #e5e7eb", background: "#fff",
                                        color: "#374151", borderRadius: 12, fontSize: 14, fontWeight: 600, cursor: "pointer"
                                    }}>
                                    ← Back
                                </button>
                            )}
                            {step < 3 ? (
                                <button type="button"
                                    onClick={() => { if (canProceed()) setStep(s => s + 1); else alert("Please complete all required fields."); }}
                                    style={{
                                        flex: 1, padding: "12px 0", background: "#1a3a5c", color: "#fff", border: "none",
                                        borderRadius: 12, fontSize: 14, fontWeight: 600, cursor: "pointer",
                                        display: "flex", alignItems: "center", justifyContent: "center", gap: 8
                                    }}>
                                    Continue <ChevronRight size={16} />
                                </button>
                            ) : (() => {
                                if (isFaculty && isPending) return (
                                    <div style={{
                                        flex: 1, padding: "12px 16px", background: "rgba(245,158,11,0.08)",
                                        border: "1px solid rgba(245,158,11,0.3)", borderRadius: 12, display: "flex", gap: 10
                                    }}>
                                        <AlertCircle size={16} style={{ color: "#d97706", flexShrink: 0, marginTop: 1 }} />
                                        <div>
                                            <p style={{ fontSize: 13, fontWeight: 700, color: "#92400e", margin: "0 0 3px" }}>Publishing locked</p>
                                            <p style={{ fontSize: 12, color: "#b45309", margin: 0, lineHeight: 1.5 }}>
                                                Faculty credentials under review (24–48 hrs).
                                            </p>
                                        </div>
                                    </div>
                                );
                                return (
                                    <button type="button" onClick={handleSubmit} disabled={loading}
                                        style={{
                                            flex: 1, padding: "12px 0", background: "#16a34a", color: "#fff", border: "none",
                                            borderRadius: 12, fontSize: 14, fontWeight: 600, cursor: "pointer",
                                            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                                            opacity: loading ? 0.65 : 1
                                        }}>
                                        {loading
                                            ? <><div style={{ width: 16, height: 16, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />Submitting…</>
                                            : <><Check size={16} />Submit for Review</>
                                        }
                                    </button>
                                );
                            })()}
                        </div>
                    </div>

                    {/* ════════════════════════════════════════════
              SIDEBAR
          ════════════════════════════════════════════ */}
                    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

                        {/* Earnings card */}
                        <div style={{ background: "#1a3a5c", borderRadius: 16, padding: 22, color: "#fff" }}>
                            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,0.4)", margin: "0 0 3px" }}>
                                Potential Earnings
                            </p>
                            <p className="pf" style={{ fontSize: 34, fontWeight: 800, margin: "0 0 2px" }}>₦{earnings}</p>
                            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", margin: "0 0 14px" }}>
                                per sale at ₦{form.price ? Number(form.price).toLocaleString() : "0"}
                            </p>
                            <div style={{ borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: 13, display: "flex", flexDirection: "column", gap: 7 }}>
                                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                                    <span style={{ color: "rgba(255,255,255,0.45)" }}>Your share</span>
                                    <span style={{ fontWeight: 700 }}>80%</span>
                                </div>
                                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                                    <span style={{ color: "rgba(255,255,255,0.45)" }}>Platform</span>
                                    <span>20%</span>
                                </div>
                            </div>
                        </div>

                        {/* Progress */}
                        <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #f0f0f0", padding: 16 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                                <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#6b7280", margin: 0 }}>Progress</p>
                                <p style={{ fontSize: 10, fontWeight: 700, color: "#1a3a5c", margin: 0 }}>Step {step} of {STEPS.length}</p>
                            </div>
                            <div style={{ height: 7, background: "#f3f4f6", borderRadius: 99, overflow: "hidden" }}>
                                <div style={{ height: "100%", background: "#1a3a5c", width: `${(step / STEPS.length) * 100}%`, transition: "width 0.5s ease" }} />
                            </div>
                            <p style={{ fontSize: 11, color: "#9ca3af", marginTop: 5 }}>{STEPS[step - 1].label}</p>
                        </div>

                        {/* Selected intent */}
                        {activeIntent && (
                            <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #f0f0f0", padding: 16 }}>
                                <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#6b7280", margin: "0 0 10px" }}>Selected Path</p>
                                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                    <div style={{ width: 34, height: 34, borderRadius: 9, background: activeIntent.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                        {React.createElement(activeIntent.icon, { size: 16, style: { color: activeIntent.color } })}
                                    </div>
                                    <div>
                                        <p style={{ fontSize: 14, fontWeight: 700, color: "#111827", margin: 0 }}>{activeIntent.label}</p>
                                        <button onClick={() => { setIntent(null); setStep(1); }}
                                            style={{ fontSize: 11, color: "#9ca3af", background: "none", border: "none", cursor: "pointer", padding: 0, textDecoration: "underline" }}>
                                            Change
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* What happens next */}
                        <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #f0f0f0", padding: 16 }}>
                            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#6b7280", margin: "0 0 14px" }}>What Happens Next</p>
                            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                                {[
                                    { n: "1", t: "Submit", d: "We receive your document" },
                                    { n: "2", t: "Review", d: "Quality check in 24–48 hrs" },
                                    { n: "3", t: "Live", d: "Listed in the library" },
                                    { n: "4", t: "Earn", d: "Paid for every purchase" },
                                ].map(s => (
                                    <div key={s.n} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                                        <div style={{
                                            width: 22, height: 22, borderRadius: "50%", background: "rgba(26,58,92,0.08)", color: "#1a3a5c",
                                            fontSize: 11, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0
                                        }}>{s.n}</div>
                                        <div>
                                            <p style={{ fontSize: 13, fontWeight: 600, color: "#111827", margin: "0 0 1px" }}>{s.t}</p>
                                            <p style={{ fontSize: 11, color: "#9ca3af", margin: 0 }}>{s.d}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Tips */}
                        <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #f0f0f0", padding: 16 }}>
                            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#6b7280", margin: "0 0 12px" }}>Tips for Fast Approval</p>
                            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                                {[
                                    "Upload a clear, readable PDF",
                                    "Add a cover image — boosts sales",
                                    "Write a detailed description",
                                    "Set a fair, competitive price",
                                    "Ensure Drive links allow 'Anyone with link'",
                                ].map((t, i) => (
                                    <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                                        <Check size={11} style={{ color: "#16a34a", marginTop: 2, flexShrink: 0 }} />
                                        <span style={{ fontSize: 12, color: "#6b7280", lineHeight: 1.5 }}>{t}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Google Drive Warning Modal ── */}
            {showDriveWarn && (
                <div style={{
                    position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", backdropFilter: "blur(3px)",
                    display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50, padding: 16
                }}>
                    <div style={{ background: "#fff", borderRadius: 20, maxWidth: 460, width: "100%", padding: 28, boxShadow: "0 24px 64px rgba(0,0,0,0.2)" }}>
                        <div style={{ display: "flex", alignItems: "flex-start", gap: 14, marginBottom: 18 }}>
                            <div style={{ width: 44, height: 44, background: "#fef3c7", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                <AlertCircle size={20} style={{ color: "#d97706" }} />
                            </div>
                            <div style={{ flex: 1 }}>
                                <h3 className="pf" style={{ fontSize: 17, fontWeight: 700, color: "#111827", margin: "0 0 3px" }}>Check Drive Permissions</h3>
                                <p style={{ fontSize: 13, color: "#6b7280", margin: 0 }}>Your link may not be publicly accessible — buyers will see "Access Denied".</p>
                            </div>
                            <button onClick={() => setShowDriveWarn(false)} style={{ background: "none", border: "none", color: "#d1d5db", cursor: "pointer" }}>
                                <X size={18} />
                            </button>
                        </div>
                        <div style={{ background: "#eff6ff", borderRadius: 10, padding: "14px 16px", marginBottom: 16 }}>
                            {["Open Google Drive", "Right-click your PDF → Share", "Set to \"Anyone with the link\"", "Set permission to Viewer", "Copy & paste the new link"].map((s, i) => (
                                <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start", marginBottom: i < 4 ? 8 : 0 }}>
                                    <span style={{ width: 20, height: 20, background: "#2563eb", color: "#fff", borderRadius: "50%", fontSize: 10, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{i + 1}</span>
                                    <span style={{ fontSize: 13, color: "#1e40af" }}>{s}</span>
                                </div>
                            ))}
                        </div>
                        <div style={{ display: "flex", gap: 10 }}>
                            <button onClick={() => setShowDriveWarn(false)}
                                style={{ flex: 1, padding: "10px 0", border: "1px solid #e5e7eb", background: "#fff", color: "#374151", borderRadius: 12, fontSize: 13, fontWeight: 500, cursor: "pointer" }}>
                                Fix Later
                            </button>
                            <button onClick={() => { setShowDriveWarn(false); window.open("https://drive.google.com", "_blank"); }}
                                style={{ flex: 1, padding: "10px 0", background: "#1a3a5c", color: "#fff", border: "none", borderRadius: 12, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                                Open Google Drive →
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}