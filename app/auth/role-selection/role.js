"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { GraduationCap, Store, Building2, X, Loader2, CheckCircle } from "lucide-react";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebaseConfig";

// ─── Constants ────────────────────────────────────────────────────────────────

const STUDENT_ROLES = [
    {
        id: "undergraduate",
        label: "Undergraduate",
        desc: "First degree student at a university or college",
        years: ["Year 1", "Year 2", "Year 3", "Year 4+"],
    },
    {
        id: "postgraduate",
        label: "Postgraduate",
        desc: "Master's, MBA, or coursework graduate student",
        years: ["Year 1", "Year 2", "Year 3+"],
    },
    {
        id: "researcher",
        label: "PhD / Researcher",
        desc: "Doctoral candidate or academic researcher",
        years: ["1st year", "2nd year", "3rd year", "4th year+"],
    },
    {
        id: "professional",
        label: "Professional learner",
        desc: "Taking courses or certifications while working",
        years: ["Part-time", "Full-time"],
    },
];

const FIELDS_OF_STUDY = [
    "Arts & Humanities",
    "Business & Economics",
    "Engineering & Technology",
    "Health & Medicine",
    "Law",
    "Natural Sciences",
    "Social Sciences",
    "Education",
    "Other",
];

// ─── Main Component ────────────────────────────────────────────────────────────

export default function RoleSelectionClient() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const emailParam = searchParams.get("email");
    const refParam = searchParams.get("referral_code");

    // Step: "landing" | "student"
    const [step, setStep] = useState("landing");

    // Landing step state
    const [selectedRole, setSelectedRole] = useState(""); // "student" | "seller" | "university"

    // Student step state
    const [studentSubRole, setStudentSubRole] = useState("");
    const [studyLevel, setStudyLevel] = useState("");
    const [fieldOfStudy, setFieldOfStudy] = useState("");
    const [institution, setInstitution] = useState("");

    // Waitlist modal state
    const [showWaitlist, setShowWaitlist] = useState(false);
    const [waitlistEmail, setWaitlistEmail] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [waitlistSubmitted, setWaitlistSubmitted] = useState(false);

    // ── Helpers ────────────────────────────────────────────────────────────────

    const buildQuery = (extra = {}) => {
        const params = new URLSearchParams();
        if (emailParam) params.append("email", emailParam);
        if (refParam) params.append("referral_code", refParam);
        Object.entries(extra).forEach(([k, v]) => v && params.append(k, v));
        const str = params.toString();
        return str ? `?${str}` : "";
    };

    // ── Landing handlers ───────────────────────────────────────────────────────

    const handleLandingCardClick = (role) => {
        if (role === "university") {
            setShowWaitlist(true);
            return;
        }
        setSelectedRole(role);
    };

    const handleLandingContinue = () => {
        if (selectedRole === "student") {
            setStep("student");
        } else if (selectedRole === "seller") {
            sessionStorage.setItem("userRole", "seller");
            if (refParam) sessionStorage.setItem("referredBy", refParam);
            router.push(`/auth/create-account${buildQuery({ role: "seller" })}`);
        }
    };

    // ── Student handlers ───────────────────────────────────────────────────────

    const handleStudentSubRoleClick = (id) => {
        setStudentSubRole(id);
        setStudyLevel(""); // reset year when role changes
    };

    const handleStudentContinue = () => {
        if (!studentSubRole || !studyLevel) return;
        sessionStorage.setItem("userRole", "student");
        sessionStorage.setItem("studentSubRole", studentSubRole);
        sessionStorage.setItem("studyLevel", studyLevel);
        if (fieldOfStudy) sessionStorage.setItem("fieldOfStudy", fieldOfStudy);
        if (institution) sessionStorage.setItem("institution", institution);
        if (refParam) sessionStorage.setItem("referredBy", refParam);
        router.push(
            `/auth/create-account${buildQuery({
                role: "student",
                sub_role: studentSubRole,
                level: studyLevel,
            })}`
        );
    };

    // ── Waitlist handlers ──────────────────────────────────────────────────────

    const handleWaitlistSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await addDoc(collection(db, "waitlist"), {
                email: waitlistEmail,
                roleRequested: "university",
                timestamp: serverTimestamp(),
            });
            setWaitlistSubmitted(true);
            setTimeout(() => {
                setShowWaitlist(false);
                setWaitlistSubmitted(false);
                setWaitlistEmail("");
            }, 3000);
        } catch (error) {
            console.error("Waitlist error:", error);
            alert("Something went wrong. Please try again.");
        }
        setIsSubmitting(false);
    };

    const closeWaitlist = () => {
        setShowWaitlist(false);
        setWaitlistSubmitted(false);
        setWaitlistEmail("");
    };

    const activeStudentRole = STUDENT_ROLES.find((r) => r.id === studentSubRole);

    // ── Render ─────────────────────────────────────────────────────────────────

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">

            {/* ── STEP 1: Landing — choose Student / Seller / Institution ── */}
            {step === "landing" && (
                <div className="flex-1 flex items-center justify-center px-4 py-12">
                    <div className="w-full max-w-2xl">

                        {/* Header */}
                        <div className="text-center mb-8">
                            <h1 className="text-3xl font-bold text-gray-900 mb-2">
                                How would you like to use LAN Library?
                            </h1>
                            <p className="text-gray-500 text-base">Select an option below to get started</p>
                            {refParam && (
                                <div className="mt-3 inline-flex items-center gap-2 bg-green-50 text-green-700 border border-green-200 px-4 py-1.5 rounded-full text-sm font-medium">
                                    🎉 You were invited by a friend!
                                </div>
                            )}
                        </div>

                        {/* Cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">

                            {/* Student */}
                            <button
                                onClick={() => handleLandingCardClick("student")}
                                className={`relative bg-white rounded-2xl p-6 text-left border-2 transition-all duration-200 hover:shadow-md ${selectedRole === "student"
                                        ? "border-blue-600 shadow-md ring-2 ring-blue-100"
                                        : "border-gray-200 hover:border-blue-300"
                                    }`}
                            >
                                <div className="absolute top-3 right-3 flex items-center gap-1">
                                    <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                                    <span className="text-xs font-semibold text-blue-600">Live</span>
                                </div>
                                {selectedRole === "student" && (
                                    <CheckCircle className="absolute top-3 right-3 w-5 h-5 text-blue-600" />
                                )}
                                <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center mb-4">
                                    <GraduationCap className="w-6 h-6 text-blue-600" />
                                </div>
                                <h3 className="font-semibold text-gray-900 mb-1">Student</h3>
                                <p className="text-xs text-gray-500 leading-relaxed">
                                    Access premium academic materials for your studies
                                </p>
                            </button>

                            {/* Seller */}
                            <button
                                onClick={() => handleLandingCardClick("seller")}
                                className={`relative bg-white rounded-2xl p-6 text-left border-2 transition-all duration-200 hover:shadow-md ${selectedRole === "seller"
                                        ? "border-green-600 shadow-md ring-2 ring-green-100"
                                        : "border-gray-200 hover:border-green-300"
                                    }`}
                            >
                                <div className="absolute top-3 right-3 flex items-center gap-1">
                                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                    <span className="text-xs font-semibold text-green-600">Live</span>
                                </div>
                                {selectedRole === "seller" && (
                                    <CheckCircle className="absolute top-3 right-3 w-5 h-5 text-green-600" />
                                )}
                                <div className="w-11 h-11 rounded-xl bg-green-50 flex items-center justify-center mb-4">
                                    <Store className="w-6 h-6 text-green-600" />
                                </div>
                                <h3 className="font-semibold text-gray-900 mb-1">Seller</h3>
                                <p className="text-xs text-gray-500 leading-relaxed">
                                    Monetize your books and research. Earn 80% on every sale
                                </p>
                            </button>

                            {/* Institution */}
                            <button
                                onClick={() => handleLandingCardClick("university")}
                                className="relative bg-white rounded-2xl p-6 text-left border-2 border-gray-200 transition-all duration-200 hover:border-purple-300 hover:shadow-md"
                            >
                                <div className="absolute top-3 right-3 bg-amber-50 text-amber-700 border border-amber-200 text-xs font-medium px-2 py-0.5 rounded-full">
                                    Coming soon
                                </div>
                                <div className="w-11 h-11 rounded-xl bg-purple-50 flex items-center justify-center mb-4">
                                    <Building2 className="w-6 h-6 text-purple-600" />
                                </div>
                                <h3 className="font-semibold text-gray-900 mb-1">Institution</h3>
                                <p className="text-xs text-gray-500 leading-relaxed">
                                    Digital library management for universities
                                </p>
                            </button>
                        </div>

                        {/* Continue button */}
                        {(selectedRole === "student" || selectedRole === "seller") && (
                            <div className="text-center">
                                <button
                                    onClick={handleLandingContinue}
                                    className={`px-10 py-3 rounded-full font-semibold text-white text-sm transition-all shadow hover:shadow-md active:scale-95 ${selectedRole === "seller"
                                            ? "bg-green-600 hover:bg-green-700"
                                            : "bg-blue-600 hover:bg-blue-700"
                                        }`}
                                >
                                    Continue to Registration →
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ── STEP 2: Student sub-role selection ── */}
            {step === "student" && (
                <div className="flex-1 flex items-center justify-center px-4 py-12">
                    <div className="w-full max-w-2xl">

                        {/* Back */}
                        <button
                            onClick={() => { setStep("landing"); setStudentSubRole(""); setStudyLevel(""); }}
                            className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-700 mb-6 transition-colors"
                        >
                            ← Back
                        </button>

                        {/* Header */}
                        <div className="mb-6">
                            <h1 className="text-2xl font-bold text-gray-900 mb-1">What kind of student are you?</h1>
                            <p className="text-gray-500 text-sm">Select the option that best matches your academic situation</p>
                        </div>

                        {/* Sub-role cards */}
                        <div className="grid grid-cols-2 gap-3 mb-6">
                            {STUDENT_ROLES.map((role) => (
                                <button
                                    key={role.id}
                                    onClick={() => handleStudentSubRoleClick(role.id)}
                                    className={`relative bg-white rounded-xl p-5 text-left border-2 transition-all duration-200 hover:shadow-sm ${studentSubRole === role.id
                                            ? "border-blue-600 ring-2 ring-blue-100"
                                            : "border-gray-200 hover:border-blue-200"
                                        }`}
                                >
                                    {studentSubRole === role.id && (
                                        <CheckCircle className="absolute top-3 right-3 w-4 h-4 text-blue-600" />
                                    )}
                                    <p className="font-semibold text-gray-900 text-sm mb-1">{role.label}</p>
                                    <p className="text-xs text-gray-500 leading-relaxed">{role.desc}</p>
                                </button>
                            ))}
                        </div>

                        {/* Year of study */}
                        {activeStudentRole && (
                            <div className="mb-5">
                                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                                    Year of study
                                </p>
                                <div className="flex flex-wrap gap-2">
                                    {activeStudentRole.years.map((yr) => (
                                        <button
                                            key={yr}
                                            onClick={() => setStudyLevel(yr)}
                                            className={`px-4 py-1.5 rounded-full text-sm border transition-all ${studyLevel === yr
                                                    ? "bg-blue-600 text-white border-blue-600"
                                                    : "bg-white text-gray-600 border-gray-200 hover:border-blue-300"
                                                }`}
                                        >
                                            {yr}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Optional fields */}
                        {studentSubRole && (
                            <div className="grid grid-cols-2 gap-3 mb-6">
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1.5">
                                        Field of study
                                    </label>
                                    <select
                                        value={fieldOfStudy}
                                        onChange={(e) => setFieldOfStudy(e.target.value)}
                                        className="w-full text-sm text-gray-800 border border-gray-200 rounded-lg px-3 py-2 bg-white outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition"
                                    >
                                        <option value="">Select a field…</option>
                                        {FIELDS_OF_STUDY.map((f) => (
                                            <option key={f}>{f}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1.5">
                                        Institution <span className="text-gray-300">(optional)</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={institution}
                                        onChange={(e) => setInstitution(e.target.value)}
                                        placeholder="University name"
                                        className="w-full text-sm text-gray-800 border border-gray-200 rounded-lg px-3 py-2 bg-white outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition"
                                    />
                                </div>
                            </div>
                        )}

                        {/* Continue */}
                        <div className="flex items-center justify-between">
                            <p className="text-sm text-gray-400">
                                {studentSubRole && studyLevel ? (
                                    <span>
                                        <span className="font-medium text-gray-700">{activeStudentRole?.label}</span>
                                        {" · "}
                                        {studyLevel}
                                    </span>
                                ) : studentSubRole ? (
                                    "Pick your year of study to continue"
                                ) : (
                                    ""
                                )}
                            </p>
                            <button
                                onClick={handleStudentContinue}
                                disabled={!studentSubRole || !studyLevel}
                                className="px-8 py-2.5 rounded-full bg-blue-600 text-white text-sm font-semibold transition-all shadow hover:bg-blue-700 hover:shadow-md active:scale-95 disabled:opacity-30 disabled:pointer-events-none"
                            >
                                Continue to Registration →
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Waitlist Modal ── */}
            {showWaitlist && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl p-8 max-w-md w-full relative shadow-xl">
                        <button
                            onClick={closeWaitlist}
                            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        {!waitlistSubmitted ? (
                            <>
                                <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center mb-4">
                                    <Building2 className="w-6 h-6 text-purple-600" />
                                </div>
                                <h2 className="text-xl font-bold text-gray-900 mb-2">Join the waitlist</h2>
                                <p className="text-gray-500 text-sm leading-relaxed mb-6">
                                    Institution accounts are coming soon. Leave your email and we'll notify you the
                                    moment we're ready for universities and educational institutions.
                                </p>
                                <form onSubmit={handleWaitlistSubmit} className="space-y-3">
                                    <input
                                        type="email"
                                        required
                                        placeholder="your@email.com"
                                        value={waitlistEmail}
                                        onChange={(e) => setWaitlistEmail(e.target.value)}
                                        className="w-full text-sm text-gray-800 border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition"
                                    />
                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="w-full bg-purple-600 text-white py-3 rounded-xl text-sm font-semibold flex justify-center items-center gap-2 hover:bg-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <Loader2 className="animate-spin w-4 h-4" />
                                                Joining…
                                            </>
                                        ) : (
                                            "Notify me when ready"
                                        )}
                                    </button>
                                </form>
                            </>
                        ) : (
                            <div className="text-center py-6">
                                <div className="w-14 h-14 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4">
                                    <CheckCircle className="w-7 h-7 text-green-600" />
                                </div>
                                <h2 className="text-xl font-bold text-gray-900 mb-2">You're on the list!</h2>
                                <p className="text-gray-500 text-sm">
                                    We'll reach out to{" "}
                                    <span className="font-medium text-gray-800">{waitlistEmail}</span> soon.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}