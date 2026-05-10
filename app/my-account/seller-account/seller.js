"use client";
import React, { useState, useEffect } from "react";
import { DollarSign, TrendingUp, ShoppingBag, Download, Book, Globe, Settings, X, Camera, Save, AlertCircle, ChevronRight, User, Building, Users, ArrowUpRight, ArrowDownLeft, Sparkles, Package } from "lucide-react";
import Link from "next/link";
import { auth, db } from "@/lib/firebaseConfig";
import { doc, getDoc, updateDoc, collection, query, where, getDocs, addDoc, serverTimestamp, increment, setDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";
import Navbar from "@/components/NavBar";
import NotificationBell from "@/components/NotificationBell";
import { usePayment } from "@/app/hooks/usePayment";
import { addStudentRoleToExistingUser } from "@/lib/auth/authHelpers";
import ExportStudentsModal from "@/components/Exportstudentsmodal";
import { uploadImageToCloudinary } from "@/lib/uploadImageToCloudinary";

/* ─── colour tokens ─────────────────────────────────────────── */
const NAVY = "#0d2244";
const GOLD = "#b8963e";
const GOLDD = "#d4aa5a";
const CREAM = "#f5f0e8";
const BG = "#f5f1ea";

const FACULTY_TITLES = ["Dr.", "Prof.", "Mr.", "Mrs.", "Ms.", "Engr.", "Pharm.", "Barr.", "Lecturer"];

const nigerianBanks = [
    { name: "Access Bank", code: "044" },
    { name: "Citibank", code: "023" },
    { name: "Ecobank Nigeria", code: "050" },
    { name: "Fidelity Bank", code: "070" },
    { name: "First Bank of Nigeria", code: "011" },
    { name: "First City Monument Bank (FCMB)", code: "214" },
    { name: "Globus Bank", code: "00103" },
    { name: "Guaranty Trust Bank (GTBank)", code: "058" },
    { name: "Heritage Bank", code: "030" },
    { name: "Keystone Bank", code: "082" },
    { name: "Kuda Bank", code: "50211" },
    { name: "Opay", code: "999992" },
    { name: "Palmpay", code: "999991" },
    { name: "Parallex Bank", code: "526" },
    { name: "Polaris Bank", code: "076" },
    { name: "Providus Bank", code: "101" },
    { name: "Stanbic IBTC Bank", code: "221" },
    { name: "Standard Chartered Bank", code: "068" },
    { name: "Sterling Bank", code: "232" },
    { name: "SunTrust Bank", code: "100" },
    { name: "Union Bank of Nigeria", code: "032" },
    { name: "United Bank for Africa (UBA)", code: "033" },
    { name: "Unity Bank", code: "215" },
    { name: "Wema Bank", code: "035" },
    { name: "Zenith Bank", code: "057" },
];

/* ─── VerifiedFacultyBadge ───────────────────────────────────── */
function VerifiedFacultyBadge({ user, seller }) {
    const isVerified =
        (user?.role === "lecturer" || user?.isLecturer === true) &&
        user?.isVerified === true &&
        user?.lecturerVerificationStatus !== "pending" &&
        user?.lecturerVerificationStatus !== "rejected";

    if (!isVerified) return null;

    return (
        <span
            title={`Verified Faculty — ${user?.department || seller?.title || "Academic Staff"}`}
            aria-label="Verified Faculty"
            style={{
                display: "inline-flex", alignItems: "center", justifyContent: "center",
                width: "16px", height: "16px", borderRadius: "50%",
                background: "#1d9bf0", flexShrink: 0, verticalAlign: "middle",
                marginLeft: "4px", cursor: "default",
            }}
        >
            <svg width="9" height="9" viewBox="0 0 10 10" fill="none" aria-hidden="true">
                <path d="M2 5.2L4 7.2L8 3" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        </span>
    );
}

/* ─── PinModal ───────────────────────────────────────────────── */
function PinModal({ amount, bankDetails, pinError, onDigit, onDelete, onConfirm, onClose, pinValue }) {
    const dots = Array.from({ length: 4 }, (_, i) => i < pinValue.length);
    const maskedAccount = bankDetails?.accountNumber ? `***${bankDetails.accountNumber.slice(-4)}` : "your account";
    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
            <div style={{ background: '#fff', width: '100%', maxWidth: '360px', borderRadius: '0', overflow: 'hidden', boxShadow: '0 32px 64px rgba(13,34,68,0.3)' }} className="mt-30">
                <div style={{ background: NAVY, padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                        <p style={{ color: GOLD, fontSize: '10px', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: '4px', fontFamily: "'Lato',sans-serif" }}>Confirm withdrawal</p>
                        <p style={{ color: '#fff', fontSize: '16px', fontWeight: 700, fontFamily: "'Playfair Display',serif" }}>Enter your PIN</p>
                    </div>
                    <button onClick={onClose} style={{ width: '34px', height: '34px', border: '0.5px solid rgba(255,255,255,0.2)', background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'rgba(255,255,255,0.6)' }}>
                        <X size={15} />
                    </button>
                </div>
                <div style={{ padding: '24px' }}>
                    <p style={{ fontSize: '13px', color: '#888', textAlign: 'center', marginBottom: '20px', lineHeight: 1.6 }}>
                        Authorise withdrawal of <strong style={{ color: NAVY }}>₦{Number(amount).toLocaleString()}</strong> to {bankDetails?.bankName} {maskedAccount}
                    </p>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginBottom: '20px' }}>
                        {dots.map((filled, i) => (
                            <div key={i} style={{ width: '52px', height: '56px', border: `2px solid ${filled ? NAVY : '#e5ddd0'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', color: filled ? NAVY : '#ddd', transition: 'all 0.15s' }}>
                                {filled ? '●' : '○'}
                            </div>
                        ))}
                    </div>
                    {pinError && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#fef2f2', border: '0.5px solid #fecaca', padding: '10px 12px', marginBottom: '14px' }}>
                            <AlertCircle size={14} style={{ color: '#ef4444', flexShrink: 0 }} />
                            <p style={{ fontSize: '12px', color: '#dc2626' }}>{pinError}</p>
                        </div>
                    )}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginBottom: '8px' }}>
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => (
                            <button key={n} onClick={() => onDigit(String(n))} disabled={pinValue.length >= 4}
                                style={{ height: '52px', border: '0.5px solid #e5ddd0', background: '#fff', fontSize: '17px', fontWeight: 700, color: NAVY, cursor: 'pointer', fontFamily: "'Lato',sans-serif", transition: 'background 0.15s' }}
                                onMouseEnter={e => e.currentTarget.style.background = CREAM}
                                onMouseLeave={e => e.currentTarget.style.background = '#fff'}
                            >{n}</button>
                        ))}
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginBottom: '20px' }}>
                        <div />
                        <button onClick={() => onDigit("0")} disabled={pinValue.length >= 4}
                            style={{ height: '52px', border: '0.5px solid #e5ddd0', background: '#fff', fontSize: '17px', fontWeight: 700, color: NAVY, cursor: 'pointer', fontFamily: "'Lato',sans-serif" }}
                            onMouseEnter={e => e.currentTarget.style.background = CREAM}
                            onMouseLeave={e => e.currentTarget.style.background = '#fff'}
                        >0</button>
                        <button onClick={onDelete} style={{ height: '52px', border: '0.5px solid #e5ddd0', background: '#fff', fontSize: '17px', color: '#888', cursor: 'pointer' }}>⌫</button>
                    </div>
                    <button onClick={onConfirm} disabled={pinValue.length < 4}
                        style={{ width: '100%', background: pinValue.length >= 4 ? NAVY : '#e5ddd0', color: pinValue.length >= 4 ? '#fff' : '#aaa', padding: '14px', border: 'none', fontSize: '13px', fontWeight: 700, cursor: pinValue.length >= 4 ? 'pointer' : 'not-allowed', fontFamily: "'Lato',sans-serif", letterSpacing: '0.05em', transition: 'background 0.18s' }}
                    >Confirm withdrawal</button>
                </div>
            </div>
        </div>
    );
}

/* ─── SuccessModal ───────────────────────────────────────────── */
function SuccessModal({ amount, reference, onClose }) {
    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', zIndex: 70, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
            <div style={{ background: '#fff', width: '100%', maxWidth: '360px', overflow: 'hidden', boxShadow: '0 32px 64px rgba(13,34,68,0.3)' }}>
                <div style={{ background: NAVY, padding: '40px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                    <div style={{ width: '64px', height: '64px', background: '#16a34a', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                        <svg style={{ width: '32px', height: '32px', color: '#fff' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <p style={{ color: '#fff', fontSize: '18px', fontWeight: 700, fontFamily: "'Playfair Display',serif", marginBottom: '6px' }}>Request Submitted!</p>
                    <p style={{ color: GOLD, fontSize: '12px', fontFamily: "'Lato',sans-serif" }}>Your withdrawal is pending approval</p>
                </div>
                <div style={{ padding: '24px' }}>
                    {[['Amount', `₦${Number(amount).toLocaleString()}`], ['Reference', reference], ['Status', '⏳ Pending']].map(([k, v]) => (
                        <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '10px', paddingBottom: '10px', borderBottom: '0.5px solid #f0ebe0' }}>
                            <span style={{ color: '#888' }}>{k}</span>
                            <span style={{ fontWeight: 700, color: NAVY, fontFamily: "'Lato',sans-serif", maxWidth: '190px', textAlign: 'right', wordBreak: 'break-all' }}>{v}</span>
                        </div>
                    ))}
                    <p style={{ fontSize: '11px', color: '#888', textAlign: 'center', marginTop: '8px', lineHeight: 1.7 }}>
                        You'll receive a notification once processed (24–48 hrs)
                    </p>
                    <button onClick={onClose}
                        style={{ width: '100%', background: NAVY, color: '#fff', padding: '14px', border: 'none', fontSize: '13px', fontWeight: 700, cursor: 'pointer', marginTop: '16px', fontFamily: "'Lato',sans-serif", letterSpacing: '0.05em' }}
                        onMouseEnter={e => e.currentTarget.style.background = '#1a3a6e'}
                        onMouseLeave={e => e.currentTarget.style.background = NAVY}
                    >Done</button>
                </div>
            </div>
        </div>
    );
}

/* ─── VTUQuickAccess ─────────────────────────────────────────── */
function VTUQuickAccess() {
    const router = useRouter();
    const services = [
        {
            id: "airtime", label: "Airtime", description: "Instant top-up", tab: "airtime", icon: (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} style={{ width: '22px', height: '22px' }}>
                    <rect x="5" y="2" width="14" height="20" rx="2" /><circle cx="12" cy="17" r="1" fill="currentColor" />
                </svg>
            )
        },
        {
            id: "data", label: "Data", description: "All networks", tab: "data", icon: (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} style={{ width: '22px', height: '22px' }}>
                    <path d="M1.5 8.5C5 5 9.5 3 12 3s7 2 10.5 5.5" strokeLinecap="round" />
                    <path d="M5 12c1.9-1.9 4.3-3 7-3s5.1 1.1 7 3" strokeLinecap="round" />
                    <path d="M8.5 15.5c.9-.9 2.1-1.5 3.5-1.5s2.6.6 3.5 1.5" strokeLinecap="round" />
                    <circle cx="12" cy="19" r="1.5" fill="currentColor" />
                </svg>
            )
        },
        {
            id: "electricity", label: "Electricity", description: "Pay bills", tab: "electricity", icon: (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} style={{ width: '22px', height: '22px' }}>
                    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            )
        },
        {
            id: "tv", label: "TV/Cable", description: "DStv, GOtv & more", tab: "tv", icon: (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} style={{ width: '22px', height: '22px' }}>
                    <rect x="2" y="7" width="20" height="13" rx="2" />
                    <path d="M8 7L12 3l4 4" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M9 12h6M9 15h4" strokeLinecap="round" />
                </svg>
            )
        },
    ];
    return (
        <div style={{ background: '#fff', border: '0.5px solid #e5ddd0', padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '20px' }}>
                <div>
                    <p style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: GOLD, marginBottom: '4px', fontFamily: "'Lato',sans-serif" }}>Wallet Services</p>
                    <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: '18px', fontWeight: 700, color: NAVY, margin: 0 }}>Quick Recharge</h3>
                </div>
                <button onClick={() => router.push("/recharge")} style={{ fontSize: '11px', fontWeight: 700, color: NAVY, background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontFamily: "'Lato',sans-serif", letterSpacing: '0.04em' }}>
                    View all <ChevronRight size={13} />
                </button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '10px' }}>
                {services.map(s => (
                    <button key={s.id} onClick={() => router.push(`/recharge?tab=${s.tab}`)}
                        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', padding: '14px 8px', border: '0.5px solid #e5ddd0', background: CREAM, cursor: 'pointer', transition: 'all 0.2s' }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = GOLD; e.currentTarget.style.background = '#fff'; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = '#e5ddd0'; e.currentTarget.style.background = CREAM; }}
                    >
                        <div style={{ width: '40px', height: '40px', background: '#fff', border: '0.5px solid #e5ddd0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: NAVY }}>
                            {s.icon}
                        </div>
                        <div style={{ textAlign: 'center' }}>
                            <p style={{ fontSize: '11px', fontWeight: 700, color: NAVY, fontFamily: "'Lato',sans-serif", margin: 0 }}>{s.label}</p>
                            <p style={{ fontSize: '9px', color: '#aaa', fontFamily: "'Lato',sans-serif", margin: '2px 0 0' }}>{s.description}</p>
                        </div>
                    </button>
                ))}
            </div>
            <div style={{ marginTop: '14px', display: 'flex', alignItems: 'center', gap: '8px', background: CREAM, border: '0.5px solid rgba(184,150,62,0.2)', padding: '10px 14px' }}>
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#16a34a', animation: 'pulse 2s infinite', flexShrink: 0 }} />
                <p style={{ fontSize: '11px', color: NAVY, fontWeight: 600, fontFamily: "'Lato',sans-serif" }}>Payments deducted instantly from your LAN wallet</p>
            </div>
        </div>
    );
}

/* ─── AccountSwitchSheet — redesigned (NAVY / GOLD / CREAM) ──────────────── */
function AccountSwitchSheet({ isOpen, onClose, isStudent, router }) {
    const [showEnrollConfirm, setShowEnrollConfirm] = useState(false);
    const [enrolling, setEnrolling] = useState(false);
    const [enrollError, setEnrollError] = useState("");

    const NAVY = "#0d2244";
    const GOLD = "#b8963e";
    const CREAM = "#f5f0e8";

    const handleEnrollAsStudent = async () => {
        try {
            setEnrolling(true);
            setEnrollError("");

            const currentUser = auth.currentUser;
            if (!currentUser) {
                router.push("/auth/role-selection");
                return;
            }

            const result = await addStudentRoleToExistingUser(currentUser.uid);

            if (result.success) {
                setShowEnrollConfirm(false);
                onClose();
                router.push("/student/dashboard");
            } else {
                setEnrollError("Something went wrong. Please try again.");
            }
        } catch {
            setEnrollError("Something went wrong. Please try again.");
        } finally {
            setEnrolling(false);
        }
    };

    const handleClose = () => {
        setShowEnrollConfirm(false);
        setEnrollError("");
        onClose();
    };

    return (
        <>
            {/* BACKDROP */}
            <div
                className={`fixed inset-0 z-[80] transition-all duration-300 ${
                    isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
                }`}
                style={{ background: "rgba(13,34,68,0.55)" }}
                onClick={handleClose}
            />

            {/* SHEET */}
            <div
                className={`fixed bottom-0 left-0 right-0 z-[90] transition-transform duration-300 ease-out ${
                    isOpen ? "translate-y-0" : "translate-y-full"
                }`}
            >
                <div
                    className="max-w-lg mx-auto rounded-t-3xl shadow-2xl"
                    style={{ background: CREAM }}
                >
                    {/* HANDLE */}
                    <div className="flex justify-center pt-3 pb-1">
                        <div className="w-10 h-1 rounded-full bg-gray-300" />
                    </div>

                    {/* HEADER */}
                    <div className="px-6 pt-3 pb-4 border-b border-black/5">
                        <p
                            className="text-lg font-bold tracking-tight"
                            style={{ color: NAVY }}
                        >
                            Switch Account
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                            Choose which account to view
                        </p>
                    </div>

                    {/* CONTENT */}
                    <div className="p-4 space-y-3 pb-10">

                        {/* ─── STUDENT CARD ─── */}
                        <button
                            onClick={() => {
                                if (isStudent) {
                                    router.push("/student/dashboard");
                                    onClose();
                                }
                            }}
                            disabled={!isStudent}
                            className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all ${
                                isStudent
                                    ? "border-white bg-white hover:shadow-md active:scale-[0.98]"
                                    : "border-gray-200 opacity-60 cursor-not-allowed"
                            }`}
                        >
                            <div
                                className="w-12 h-12 rounded-xl flex items-center justify-center text-white flex-shrink-0"
                                style={{
                                    background: isStudent
                                        ? "linear-gradient(135deg,#10b981,#0d9488)"
                                        : "#9ca3af",
                                }}
                            >
                                🎓
                            </div>

                            <div className="flex-1 text-left">
                                <p
                                    className="font-bold text-sm"
                                    style={{ color: NAVY }}
                                >
                                    Student Account
                                </p>
                                <p className="text-xs text-gray-400 mt-0.5">
                                    Access courses, assignments & library
                                </p>
                            </div>

                            <span className="text-gray-300 text-sm">›</span>
                        </button>

                        {/* ENROLL BUTTON */}
                        {!isStudent && (
                            <button
                                onClick={() => {
                                    setEnrollError("");
                                    setShowEnrollConfirm(true);
                                }}
                                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl border-2 border-dashed transition-all active:scale-[0.98]"
                                style={{
                                    borderColor: GOLD,
                                    background: "rgba(184,150,62,0.08)",
                                }}
                            >
                                <span
                                    className="text-sm font-semibold"
                                    style={{ color: NAVY }}
                                >
                                    Enrol as a Student
                                </span>
                            </button>
                        )}

                        {/* SELLER CARD */}
                        <button
                            onClick={onClose}
                            className="w-full flex items-center gap-4 p-4 rounded-2xl border-2 bg-white transition-all active:scale-[0.98]"
                            style={{ borderColor: "rgba(13,34,68,0.1)" }}
                        >
                            <div
                                className="w-12 h-12 rounded-xl flex items-center justify-center text-white flex-shrink-0"
                                style={{ background: NAVY }}
                            >
                                🛒
                            </div>

                            <div className="flex-1 text-left">
                                <p
                                    className="font-bold text-sm"
                                    style={{ color: NAVY }}
                                >
                                    Seller Account
                                </p>
                                <p className="text-xs text-gray-400 mt-0.5">
                                    Manage earnings, documents & withdrawals
                                </p>
                            </div>

                            <span
                                className="text-xs px-2 py-0.5 rounded-full font-semibold"
                                style={{
                                    background: GOLD,
                                    color: "#fff",
                                }}
                            >
                                Active
                            </span>
                        </button>
                    </div>
                </div>
            </div>

            {/* ─── ENROLL CONFIRM ─── */}
            <div
                className={`fixed inset-0 z-[100] flex items-end justify-center transition-all duration-300 ${
                    showEnrollConfirm
                        ? "opacity-100 pointer-events-auto"
                        : "opacity-0 pointer-events-none"
                }`}
            >
                <div
                    className="absolute inset-0"
                    style={{ background: "rgba(0,0,0,0.45)" }}
                    onClick={() => {
                        setShowEnrollConfirm(false);
                        setEnrollError("");
                    }}
                />

                <div
                    className={`relative w-full max-w-lg rounded-t-3xl shadow-2xl transition-transform duration-300 ${
                        showEnrollConfirm ? "translate-y-0" : "translate-y-full"
                    }`}
                    style={{ background: CREAM }}
                >
                    <div className="flex justify-center pt-3 pb-1">
                        <div className="w-10 h-1 rounded-full bg-gray-300" />
                    </div>

                    <div className="px-6 pt-4 pb-5 text-center">
                        <div
                            className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center text-white"
                            style={{
                                background:
                                    "linear-gradient(135deg,#10b981,#0d9488)",
                            }}
                        >
                            🎓
                        </div>

                        <p
                            className="text-lg font-bold"
                            style={{ color: NAVY }}
                        >
                            Enrol as a Student?
                        </p>

                        <p className="text-sm text-gray-500 mt-1 leading-relaxed">
                            You’ll get student access linked to your seller account.
                        </p>
                    </div>

                    {enrollError && (
                        <div className="mx-5 mb-3 p-3 rounded-xl bg-red-50 border border-red-200">
                            <p className="text-xs text-red-600">
                                {enrollError}
                            </p>
                        </div>
                    )}

                    <div className="px-5 pb-8 space-y-2.5">
                        <button
                            onClick={handleEnrollAsStudent}
                            disabled={enrolling}
                            className="w-full py-3 rounded-2xl text-white font-semibold flex items-center justify-center gap-2"
                            style={{
                                background: enrolling ? "#999" : NAVY,
                            }}
                        >
                            {enrolling ? "Enrolling..." : "Yes, Enrol Me"}
                        </button>

                        <button
                            onClick={() => {
                                setShowEnrollConfirm(false);
                                setEnrollError("");
                            }}
                            className="w-full py-3 rounded-2xl font-semibold"
                            style={{
                                border: "1px solid rgba(13,34,68,0.2)",
                                color: NAVY,
                            }}
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}

/* ════════════════════════════════════════════════════════════════
   MAIN COMPONENT — all state, logic & data fetching preserved
════════════════════════════════════════════════════════════════ */
export default function SellerAccountClient() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [accountBalance, setAccountBalance] = useState(0);
    const [totalEarnings, setTotalEarnings] = useState(0);
    const [booksSold, setBooksSold] = useState(0);
    const [transactions, setTransactions] = useState([]);
    const [withdrawals, setWithdrawals] = useState([]);
    const [showWithdrawModal, setShowWithdrawModal] = useState(false);
    const [showProfileModal, setShowProfileModal] = useState(false);
    const [showTransactionHistory, setShowTransactionHistory] = useState(false);
    const [withdrawAmount, setWithdrawAmount] = useState("");
    const [withdrawing, setWithdrawing] = useState(false);
    const [withdrawalError, setWithdrawalError] = useState("");
    const [seller, setSeller] = useState(null);
    const [successData, setSuccessData] = useState(null);
    const [showPinModal, setShowPinModal] = useState(false);
    const [pinValue, setPinValue] = useState("");
    const [pinError, setPinError] = useState("");
    const [showResetPinModal, setShowResetPinModal] = useState(false);
    const [showDeactivateModal, setShowDeactivateModal] = useState(false);
    const [deactivateConfirmText, setDeactivateConfirmText] = useState("");
    const [deactivating, setDeactivating] = useState(false);
    const [deactivateError, setDeactivateError] = useState("");
    const [resetPinView, setResetPinView] = useState('forgot');
    const [resetOtpInput, setResetOtpInput] = useState('');
    const [resetNewPin, setResetNewPin] = useState('');
    const [resetPinError, setResetPinError] = useState('');
    const [Processing, setProcessing] = useState(false);
    const [resetPinSuccess, setResetPinSuccess] = useState(false);
    const [showSwitchModal, setShowSwitchModal] = useState(false);
    const router = useRouter();
    const [showExportModal, setShowExportModal] = useState(false);
    const [sellerBooks, setSellerBooks] = useState([]);
    const [showBankModal, setShowBankModal] = useState(false);
    const [bankFormData, setBankFormData] = useState({ accountName: "", accountNumber: "", bankName: "", bankCode: "" });
    const [savingBank, setSavingBank] = useState(false);
    const [formData, setFormData] = useState({ firstName: "", surname: "", dateOfBirth: "", phone: "", address: "", country: "" });
    const { processing: pinProcessing, requestPinReset, verifyOtpAndSetPin } = usePayment(null, formData, null);
    const isPendingLecturer = user?.lecturerVerificationStatus === 'pending';

    /* ── All original useEffects & handlers — completely unchanged ── */
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (currentUser) { await fetchUserData(currentUser.uid); }
            else { router.push('/auth/signin'); }
        });
        return () => unsubscribe();
    }, [router]);

    const fetchUserData = async (uid) => {
        try {
            setLoading(true);
            const userDoc = await getDoc(doc(db, "users", uid));
            if (userDoc.exists()) {
                const userData = userDoc.data();
                if (userData.isDeactivated === true) { await auth.signOut(); router.push("/auth/signin?reason=deactivated"); return; }
                // Lecturer pending — allow them to see the page but in pending state
                const isPendingLecturer = userData.lecturerVerificationStatus === 'pending' ||
                    userData.lecturerVerificationStatus === 'rejected';

                if (!userData.isSeller && !isPendingLecturer) {
                    router.push('/my-account');
                    return;
                }
                if (userData.isSeller && window.location.pathname === '/my-account') { router.push('/my-account/seller-account'); return; }
                const sellerDoc = await getDoc(doc(db, "sellers", uid));
                let bankDetails = null;
                if (sellerDoc.exists()) {
                    const sellerData = sellerDoc.data();
                    bankDetails = sellerData.bankDetails || null;
                    setSeller({ uid, ...sellerData });
                    setAccountBalance(sellerData.accountBalance || 0);
                    setTotalEarnings(sellerData.totalEarnings || 0);
                    setBooksSold(sellerData.booksSold || 0);
                    const booksQuery = query(collection(db, "advertMyBook"), where("sellerId", "==", uid));
                    const booksSnap = await getDocs(booksQuery);
                    setSellerBooks(booksSnap.docs.map(d => ({ ...d.data(), id: `firestore-${d.id}`, title: d.data().bookTitle })));
                } else {
                    await setDoc(doc(db, "sellers", uid), { sellerId: uid, sellerEmail: userData.email, sellerName: userData.displayName || `${userData.firstName} ${userData.surname}`, accountBalance: 0, totalEarnings: 0, booksSold: 0, totalWithdrawn: 0, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
                    setAccountBalance(0); setTotalEarnings(0); setBooksSold(0);
                }
                setUser({ uid, ...userData, bankDetails });
                setFormData({ firstName: userData.firstName || "", surname: userData.surname || "", dateOfBirth: userData.dateOfBirth || "", phone: userData.phone || "", address: userData.address || "", country: userData.country || "" });
                await fetchSellerTransactions(uid);
            }
        } catch (error) { console.error("Error fetching user data:", error); }
        finally { setLoading(false); }
    };

    function getCountryFlag(country) {
        const flags = { "Nigeria": "🇳🇬", "Ghana": "🇬🇭", "Kenya": "🇰🇪", "South Africa": "🇿🇦", "United States": "🇺🇸", "United Kingdom": "🇬🇧", "Canada": "🇨🇦", "Australia": "🇦🇺", "India": "🇮🇳", "Germany": "🇩🇪", "France": "🇫🇷", "Brazil": "🇧🇷", "Uganda": "🇺🇬", "Tanzania": "🇹🇿", "Rwanda": "🇷🇼", "Cameroon": "🇨🇲", "Ethiopia": "🇪🇹", "Egypt": "🇪🇬", "Senegal": "🇸🇳", "Ivory Coast": "🇨🇮" };
        return flags[country] || "🌍";
    }

    const fetchSellerTransactions = async (uid) => {
        try {
            let allTransactions = [];
            const transactionsQuery = query(collection(db, "transactions"), where("sellerId", "==", uid));
            const transactionsSnapshot = await getDocs(transactionsQuery);
            const txnsFromCollection = await Promise.all(transactionsSnapshot.docs.map(async (docSnap) => {
                const data = docSnap.data();
                let buyerCountry = null;
                const buyerId = data.buyerId || data.userId || data.buyerUid || data.uid || null;
                if (buyerId) { try { const bd = await getDoc(doc(db, "users", buyerId)); if (bd.exists()) buyerCountry = bd.data().country || null; } catch { } }
                return { id: docSnap.id, ...data, bookTitle: data.bookTitle || data.title, buyerCountry, createdAtDate: data.createdAt?.toDate?.() || (data.purchaseDate ? new Date(data.purchaseDate) : new Date()) };
            }));
            allTransactions = [...txnsFromCollection];
            const withdrawalsQuery = query(collection(db, "withdrawals"), where("sellerId", "==", uid));
            const withdrawalsSnapshot = await getDocs(withdrawalsQuery);
            const withdrawalsList = withdrawalsSnapshot.docs.map(d => ({ id: d.id, ...d.data(), requestedAtDate: d.data().requestedAt?.toDate?.() || new Date() }));
            withdrawalsList.sort((a, b) => b.requestedAtDate - a.requestedAtDate);
            setWithdrawals(withdrawalsList);
            const transfersQuery = query(collection(db, 'transfers'), where('senderId', '==', uid));
            const transfersSnap = await getDocs(transfersQuery);
            const transfersList = transfersSnap.docs.map(d => { const data = d.data(); return { id: d.id, ...data, bookTitle: `Transfer to ${data.recipientName || 'Unknown'}`, buyerName: data.recipientName || 'Unknown', amount: data.amount, sellerAmount: -data.amount, createdAtDate: data.createdAt?.toDate?.() || new Date(), type: 'transfer_out' }; });
            const incomingQuery = query(collection(db, 'transfers'), where('recipientId', '==', uid));
            const incomingSnap = await getDocs(incomingQuery);
            const incomingList = await Promise.all(incomingSnap.docs.map(async d => {
                const data = d.data(); let buyerCountry = null;
                if (data.senderId) { try { const sd = await getDoc(doc(db, "users", data.senderId)); if (sd.exists()) buyerCountry = sd.data().country || null; } catch { } }
                return { id: `incoming-${d.id}`, ...data, bookTitle: `Transfer from ${data.senderName || 'Unknown'}`, buyerName: data.senderName || 'Unknown', amount: data.amount, sellerAmount: data.amount, buyerCountry, createdAtDate: data.createdAt?.toDate?.() || new Date(), type: 'transfer_in' };
            }));

             const physicalSalesQuery = query(
            collection(db, "physicalSales"),
            where("sellerId", "==", uid)
            );
            const physicalSalesSnap = await getDocs(physicalSalesQuery);
            const physicalSalesList = physicalSalesSnap.docs.map(d => {
                const data = d.data();
                const fullPrice = data.salePrice || data.price || 0;
                const payout = data.sellerPayout || 0;
                const fee = data.platformFee || 0;

                return {
                    ...data,
                    bookTitle: `📦 ${data.bookTitle} (Registry Pickup)`,
                    buyerName: data.studentName || data.buyerName || "Student",
                    amount: fullPrice,       
                    sellerAmount: payout,     
                    platformFee: fee,         
                    createdAtDate: data.soldAt?.toDate?.() || new Date(),
                    type: "physical_sale",
                };
            });
            allTransactions = [...allTransactions, ...transfersList, ...incomingList, ...physicalSalesList];
            allTransactions.sort((a, b) => b.createdAtDate - a.createdAtDate);
            setTransactions(allTransactions);
        } catch (error) { console.error("Error fetching seller transactions:", error); }
    };

    const handleSaveBank = async () => {
        if (!bankFormData.accountName || !bankFormData.accountNumber || !bankFormData.bankName) { alert("Please fill in all required fields"); return; }
        try {
            setSavingBank(true);
            await updateDoc(doc(db, "sellers", user.uid), { bankDetails: bankFormData, updatedAt: serverTimestamp() });
            await updateDoc(doc(db, "users", user.uid), { bankDetails: bankFormData });
            setUser(prev => ({ ...prev, bankDetails: bankFormData }));
            try {
                const res = await fetch('/api/flutterwave/create-subaccount', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ uid: user.uid, email: user.email, firstName: user.firstName, surname: user.surname, phoneNumber: user.phoneNumber || user.phone || '00000000000', bankCode: bankFormData.bankCode, accountNumber: bankFormData.accountNumber, businessName: `${user.firstName} ${user.surname}` }) });
                const flwData = await res.json();
                if (flwData.success) { await updateDoc(doc(db, "users", user.uid), { flutterwaveSubaccountId: flwData.subaccount_id }); await updateDoc(doc(db, "sellers", user.uid), { flutterwaveSubaccountId: flwData.subaccount_id }); }
            } catch { }
            setShowBankModal(false); alert("Bank details updated successfully!");
        } catch (error) { alert("Failed to save bank details: " + error.message); }
        finally { setSavingBank(false); }
    };

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploading(true);
        uploadImageToCloudinary(file, 'profiles')
            .then(async (url) => {
                await updateDoc(doc(db, 'users', user.uid), {
                    photoURL: url,
                    photoBase64: url  // keep photoBase64 in sync since seller page uses this field
                });
                setUser(prev => ({ ...prev, photoURL: url, photoBase64: url }));
            })
            .catch(err => alert('Failed to update image: ' + err.message))
            .finally(() => setUploading(false));
    };

    const handleSave = async () => {
        try {
            await updateDoc(doc(db, "users", user.uid), { firstName: formData.firstName, surname: formData.surname, dateOfBirth: formData.dateOfBirth, phone: formData.phone, address: formData.address, country: formData.country, displayName: `${formData.firstName} ${formData.surname}`, updatedAt: serverTimestamp() });
            setUser(prev => ({ ...prev, ...formData, displayName: `${formData.firstName} ${formData.surname}`, updatedAt: new Date() }));
            setIsEditing(false); alert("Profile updated successfully!");
        } catch (error) { alert("Failed to save profile: " + error.message); }
    };

    const handlePinConfirm = async () => {
        if (pinValue !== seller?.transferPin) { setPinError("Incorrect PIN. Please try again."); setPinValue(""); return; }
        setShowPinModal(false);
        try {
            setWithdrawing(true);
            const amountToDeduct = parseFloat(withdrawAmount);
            const timestamp = Date.now(); const randomStr = Math.random().toString(36).substring(2, 9); const userShort = user.uid.substring(0, 6);
            const withdrawalRef = `WD-${timestamp}-${randomStr}-${userShort}`;
            const withdrawalData = { sellerId: user.uid, sellerName: user.displayName || `${user.firstName} ${user.surname}`, sellerEmail: user.email, sellerPhone: user.phone || user.phoneNumber || null, amount: amountToDeduct, status: "pending", requestedAt: serverTimestamp(), processedAt: null, reference: withdrawalRef, bankDetails: { accountName: user.bankDetails.accountName, accountNumber: user.bankDetails.accountNumber, bankName: user.bankDetails.bankName, bankCode: user.bankDetails.bankCode || null }, flutterwaveTransferId: null, processingMethod: "admin_approval_required", processingNote: "Awaiting admin approval" };
            await addDoc(collection(db, "withdrawals"), withdrawalData);
            await updateDoc(doc(db, "sellers", user.uid), { accountBalance: increment(-amountToDeduct), lastWithdrawalRequestDate: serverTimestamp(), updatedAt: serverTimestamp() });
            setAccountBalance(prev => prev - amountToDeduct);
            setWithdrawals(prev => [{ id: `temp-${Date.now()}`, sellerId: user.uid, amount: amountToDeduct, status: "pending", reference: withdrawalRef, bankDetails: user.bankDetails, requestedAtDate: new Date() }, ...prev]);
            setWithdrawAmount(""); setSuccessData({ amount: amountToDeduct, reference: withdrawalRef });
        } catch (error) { setWithdrawalError("Failed to submit withdrawal request: " + error.message); }
        finally { setWithdrawing(false); }
    };

    const handleWithdraw = async () => {
        const amount = parseFloat(withdrawAmount); setWithdrawalError("");
        if (!amount || isNaN(amount)) { setWithdrawalError("Please enter a valid amount"); return; }
        if (amount < 1000) { setWithdrawalError("Minimum withdrawal amount is ₦1,000"); return; }
        if (amount > accountBalance) { setWithdrawalError(`Insufficient balance. Available: ₦${accountBalance.toLocaleString()}`); return; }
        if (!user?.bankDetails) { setWithdrawalError("Please add bank details first"); return; }
        if (!seller?.transferPin) { setWithdrawalError("Please set up a transfer PIN first in the Transfer page."); return; }
        setShowWithdrawModal(false); setPinValue(""); setPinError(""); setShowPinModal(true);
    };

    const handleDeactivateAccount = async () => {
        if (deactivateConfirmText !== "DELETE") return;
        try {
            setDeactivating(true); setDeactivateError("");
            await updateDoc(doc(db, "users", user.uid), { isDeactivated: true, deactivatedAt: serverTimestamp() });
            await updateDoc(doc(db, "sellers", user.uid), { isDeactivated: true, deactivatedAt: serverTimestamp() });
            await auth.signOut(); router.push("/auth/signin");
        } catch (err) { setDeactivateError("Failed to deactivate account. Please try again."); setDeactivating(false); }
    };

    const handleButton = () => router.push("/lan/net/help-center");
    const referral = () => router.push("/referrals");

    /* ── Loading state ── */
    if (loading) return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: BG }}>
            <div style={{ textAlign: 'center' }}>
                <div style={{ width: '56px', height: '56px', border: `3px solid ${GOLD}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
                <p style={{ fontFamily: "'Playfair Display',serif", fontSize: '18px', color: NAVY }}>Loading your account…</p>
                <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
            </div>
        </div>
    );

    /* ══════════════════════════════════════════════════════════════
       RENDER
    ══════════════════════════════════════════════════════════════ */
    return (
        <>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400&family=Lato:wght@300;400;700&display=swap');
                .lan-root { font-family:'Lato',sans-serif; background:${BG}; }
                .lan-serif { font-family:'Playfair Display',Georgia,serif; }
                .action-row { display:flex; align-items:center; gap:12px; padding:14px 16px; border:0.5px solid #e5ddd0; background:#fff; text-decoration:none; transition:border-color 0.18s,background 0.18s; cursor:pointer; }
                .action-row:hover { border-color:${GOLD}; background:${CREAM}; }
                .txn-row { display:flex; align-items:center; justify-content:space-between; padding:14px 16px; border:0.5px solid #f0ebe0; background:#fff; margin-bottom:6px; transition:background 0.15s; }
                .txn-row:hover { background:${CREAM}; }
                .sbar-none { scrollbar-width:none; -ms-overflow-style:none; }
                .sbar-none::-webkit-scrollbar { display:none; }
                .modal-overlay { position:fixed; inset:0; background:rgba(0,0,0,0.65); z-index:50; display:flex; align-items:center; justify-content:flex-start; flex-direction:column; overflow-y:auto; }
                .modal-inner { background:#fff; width:100%; min-height:100vh; max-width:640px; margin:0 auto; }
                @media(min-width:640px){ .modal-inner { min-height:auto; margin:40px auto; } }
                .gold-pill { display:inline-flex; align-items:center; gap:6px; background:rgba(184,150,62,0.12); border:0.5px solid rgba(184,150,62,0.3); padding:5px 12px; border-radius:999px; }
                @keyframes slideUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
                .anim-up { animation:slideUp 0.45s cubic-bezier(0.4,0,0.2,1) both; }
                @keyframes pulse2 { 0%,100%{opacity:1} 50%{opacity:0.4} }
                .pulse-dot { animation:pulse2 2s infinite; }
            `}</style>

            <div className="lan-root" style={{ minHeight: '100vh' }}>
                <Navbar />

                <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px 16px' }}>

                    {/* Pending verification banner — shown only to lecturers awaiting approval */}
                    {user?.lecturerVerificationStatus === 'pending' && (
                        <div style={{
                            background: 'rgba(245,158,11,0.08)',
                            border: '0.5px solid rgba(245,158,11,0.3)',
                            padding: '14px 20px',
                            marginBottom: '20px',
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: '12px',
                        }}>
                            <div style={{
                                width: '36px', height: '36px', borderRadius: '50%',
                                background: 'rgba(245,158,11,0.15)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                            }}>
                                <AlertCircle size={18} style={{ color: '#d97706' }} />
                            </div>
                            <div>
                                <p style={{ fontFamily: "'Lato',sans-serif", fontSize: '13px', fontWeight: 700, color: NAVY, margin: '0 0 3px' }}>
                                    Your Faculty Account is Pending Verification
                                </p>
                                <p style={{ fontFamily: "'Lato',sans-serif", fontSize: '12px', color: '#92400e', margin: 0, lineHeight: 1.6 }}>
                                    Our team is reviewing your credentials. This usually takes <strong>24–48 hours</strong>.
                                    You'll receive a notification once approved and your seller account will be activated.
                                </p>
                            </div>
                        </div>
                    )}

                    {user?.lecturerVerificationStatus === 'rejected' && (
                        <div style={{
                            background: '#fef2f2',
                            border: '0.5px solid #fecaca',
                            padding: '14px 20px',
                            marginBottom: '20px',
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: '12px',
                        }}>
                            <div style={{
                                width: '36px', height: '36px', borderRadius: '50%',
                                background: '#fee2e2',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                            }}>
                                <AlertCircle size={18} style={{ color: '#ef4444' }} />
                            </div>
                            <div>
                                <p style={{ fontFamily: "'Lato',sans-serif", fontSize: '13px', fontWeight: 700, color: '#dc2626', margin: '0 0 3px' }}>
                                    Verification Not Approved
                                </p>
                                <p style={{ fontFamily: "'Lato',sans-serif", fontSize: '12px', color: '#991b1b', margin: '0 0 8px', lineHeight: 1.6 }}>
                                    {user.verificationRejectedReason || 'Your documents could not be verified.'}
                                </p>
                                <a href="/docs" style={{ fontSize: '12px', fontWeight: 700, color: '#dc2626', fontFamily: "'Lato',sans-serif" }}>
                                    Contact support →
                                </a>
                            </div>
                        </div>
                    )}

                    {/* ── Top Header Bar ── */}
                    <div style={{ background: '#fff', border: '0.5px solid #e5ddd0', padding: '16px 24px', marginBottom: '24px', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                        <button onClick={() => setShowProfileModal(true)} style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'transparent', border: 'none', cursor: 'pointer', padding: 0 }}>
                            <img src={user?.photoURL || user?.photoBase64 || "/lan-logo.png"} style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover', border: `2px solid ${GOLD}` }} alt="Profile" />
                            <div style={{ textAlign: 'left' }}>
                                <p style={{ fontFamily: "'Playfair Display',serif", fontSize: '16px', fontWeight: 700, color: NAVY, margin: 0, display: 'flex', alignItems: 'center' }}>
                                 {seller?.title ? `${seller.title} ` : ""}{user?.firstName} {user?.surname}
                                    <VerifiedFacultyBadge user={user} seller={seller} />
                                </p>
                                <div className="gold-pill" style={{ marginTop: '4px' }}>
                                    <div className="pulse-dot" style={{
                                        width: '6px', height: '6px', borderRadius: '50%',
                                        background: user?.lecturerVerificationStatus === 'pending' ? '#f59e0b'
                                            : user?.lecturerVerificationStatus === 'rejected' ? '#ef4444'
                                                : '#16a34a'
                                    }} />                                    <span style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: GOLD, fontFamily: "'Lato',sans-serif" }}>
                                        {user?.lecturerVerificationStatus === 'pending' ? 'Pending Verification'
                                            : user?.lecturerVerificationStatus === 'rejected' ? 'Verification Rejected'
                                                : user?.isLecturer || FACULTY_TITLES.includes(seller?.title) ? 'Verified Faculty'
                                                    : 'Verified Seller'}
                                    </span>
                                </div>
                            </div>
                        </button>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <NotificationBell userId={user?.uid} />
                            <a href="/docs" style={{ background: GOLD, color: NAVY, fontSize: '11px', fontWeight: 700, padding: '9px 18px', textDecoration: 'none', letterSpacing: '0.06em', fontFamily: "'Lato',sans-serif" }}>GET HELP</a>
                            <button onClick={() => setShowSwitchModal(true)} style={{ display: 'flex', flexDirection: 'column', gap: '4px', background: 'transparent', border: 'none', cursor: 'pointer', padding: '6px' }}>
                                {[0, 1, 2].map(i => <span key={i} style={{ width: '18px', height: '2px', background: NAVY, display: 'block' }} />)}
                            </button>
                        </div>
                    </div>

                    {/* ── 2-col layout ── */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px' }} className="lg-grid">
                        <style>{`@media(min-width:1024px){.lg-grid{grid-template-columns:2fr 1fr !important;}}`}</style>

                        {/* LEFT */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

                            {/* Balance Card */}
                            <div className="anim-up" style={{ background: NAVY, backgroundImage: 'radial-gradient(rgba(184,150,62,0.07) 1px,transparent 1px)', backgroundSize: '24px 24px', padding: '28px', position: 'relative', overflow: 'hidden' }}>
                                {/* subtle corner diamond */}
                                <div style={{ position: 'absolute', top: '-30px', right: '-30px', width: '120px', height: '120px', border: `0.5px solid rgba(184,150,62,0.15)`, transform: 'rotate(45deg)' }} />
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                                    <div>
                                        <p style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: GOLD, marginBottom: '4px', fontFamily: "'Lato',sans-serif" }}>Available Balance</p>
                                        <p className="lan-serif" style={{ fontSize: 'clamp(32px,6vw,52px)', fontWeight: 700, color: '#fff', margin: 0, lineHeight: 1 }}>
                                            ₦{accountBalance.toLocaleString()}
                                        </p>
                                        <p style={{ fontSize: '12px', color: 'rgba(184,150,62,0.7)', marginTop: '6px', fontFamily: "'Lato',sans-serif" }}>Total earnings: ₦{totalEarnings.toLocaleString()}</p>
                                    </div>
                                    <button onClick={() => setShowTransactionHistory(true)}
                                        style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 700, color: GOLDD, background: 'transparent', border: 'none', cursor: 'pointer', letterSpacing: '0.06em', fontFamily: "'Lato',sans-serif", textTransform: 'uppercase' }}>
                                        History <ChevronRight size={13} />
                                    </button>
                                </div>
                                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                                    <button onClick={() => setShowWithdrawModal(true)} disabled={accountBalance < 1000 || isPendingLecturer}
                                        style={{ flex: '1', minWidth: '120px', background: GOLD, color: NAVY, padding: '12px 20px', border: 'none', fontSize: '13px', fontWeight: 700, cursor: accountBalance >= 1000 ? 'pointer' : 'not-allowed', fontFamily: "'Lato',sans-serif", letterSpacing: '0.05em', opacity: accountBalance < 1000 ? 0.5 : 1, transition: 'background 0.18s' }}
                                        onMouseEnter={e => { if (accountBalance >= 1000) e.currentTarget.style.background = GOLDD; }}
                                        onMouseLeave={e => e.currentTarget.style.background = GOLD}
                                    >Withdraw</button>
                                    <a href="/transfer" style={{ flex: '1', minWidth: '120px', background: 'rgba(255,255,255,0.1)', color: '#fff', padding: '12px 20px', border: '0.5px solid rgba(255,255,255,0.2)', fontSize: '13px', fontWeight: 700, textDecoration: 'none', textAlign: 'center', fontFamily: "'Lato',sans-serif", letterSpacing: '0.05em', display: 'inline-block', transition: 'background 0.18s' }}
                                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
                                        onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                                    >Transfer</a>
                                </div>
                            </div>

                            {isPendingLecturer && (
                                <p style={{ fontSize: '11px', color: 'rgba(184,150,62,0.6)', marginTop: '8px', fontFamily: "'Lato',sans-serif" }}>
                                    Withdrawals available after verification
                                </p>
                            )}

                            {/* Stats Row */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                {[
                                    { icon: <TrendingUp size={18} style={{ color: GOLD }} />, label: 'Total Earnings', val: `₦${totalEarnings.toLocaleString()}` },
                                    { icon: <ShoppingBag size={18} style={{ color: GOLD }} />, label: 'Documents Sold', val: booksSold },
                                ].map(({ icon, label, val }, i) => (
                                    <div key={i} style={{ background: '#fff', border: '0.5px solid #e5ddd0', padding: '20px' }}>
                                        <div style={{ width: '40px', height: '40px', border: `0.5px solid #e5ddd0`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px' }}>{icon}</div>
                                        <p style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#aaa', margin: '0 0 4px', fontFamily: "'Lato',sans-serif" }}>{label}</p>
                                        <p className="lan-serif" style={{ fontSize: '24px', fontWeight: 700, color: NAVY, margin: 0 }}>{val}</p>
                                    </div>
                                ))}
                            </div>

                            {/* VTU */}
                            <VTUQuickAccess />

                            {/* Recent Transactions */}
                            <div style={{ background: '#fff', border: '0.5px solid #e5ddd0', padding: '24px' }}>
                                <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '20px' }}>
                                    <div>
                                        <p style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: GOLD, marginBottom: '4px', fontFamily: "'Lato',sans-serif" }}>Activity</p>
                                        <h3 className="lan-serif" style={{ fontSize: '20px', fontWeight: 700, color: NAVY, margin: 0 }}>Recent Transactions</h3>
                                    </div>
                                    <button onClick={() => setShowTransactionHistory(true)} style={{ fontSize: '11px', fontWeight: 700, color: NAVY, background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontFamily: "'Lato',sans-serif", letterSpacing: '0.04em' }}>
                                        View all <ChevronRight size={13} />
                                    </button>
                                </div>
                                {transactions.length === 0 ? (
                                    <div style={{ textAlign: 'center', padding: '40px 0', borderTop: '0.5px solid #f0ebe0' }}>
                                        <ShoppingBag size={36} style={{ color: '#ddd', margin: '0 auto 10px' }} />
                                        <p style={{ fontSize: '13px', color: '#aaa', fontFamily: "'Lato',sans-serif" }}>No transactions yet</p>
                                    </div>
                                ) : (
                                    transactions.slice(0, 5).map(txn => (
                                        <div key={txn.id} className="txn-row">
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                <div style={{ width: '38px', height: '38px', border: '0.5px solid #e5ddd0', display: 'flex', alignItems: 'center', justifyContent: 'center', background: CREAM, flexShrink: 0 }}>
                                                    {txn.type === 'transfer_out' ? <ArrowUpRight size={16} style={{ color: '#ef4444' }} />  : txn.type === 'physical_sale' ? <Package size={16} style={{ color: GOLD }} />  : <ShoppingBag size={16} style={{ color: NAVY }} />}
                                                </div>
                                                <div>
                                                    <p style={{ fontSize: '13px', fontWeight: 700, color: NAVY, margin: '0 0 2px', fontFamily: "'Lato',sans-serif" }}>{txn.bookTitle}</p>
                                                    <p style={{ fontSize: '10px', color: '#aaa', margin: 0, fontFamily: "'Lato',sans-serif" }}>{txn.createdAtDate?.toLocaleDateString()}</p>
                                                </div>
                                            </div>
                                            <div style={{ textAlign: 'right' }}>
                                                <p style={{ fontSize: '13px', fontWeight: 700, color: txn.type === 'transfer_out' ? '#ef4444' : '#16a34a', margin: '0 0 2px', fontFamily: "'Lato',sans-serif" }}>
                                                    {txn.type === 'transfer_out' ? `-₦${txn.amount?.toLocaleString()}` : `+₦${(txn.sellerAmount || (txn.amount * 0.80)).toLocaleString()}`}
                                                </p>
                                                <p style={{ fontSize: '10px', color: '#aaa', margin: 0, fontFamily: "'Lato',sans-serif" }}>{txn.type === 'transfer_out' ? 'Sent' : 'Success'}</p>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* RIGHT */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

                            {/* Quick Actions */}
                            <div style={{ background: '#fff', border: '0.5px solid #e5ddd0', padding: '24px' }}>
                                <p style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: GOLD, marginBottom: '6px', fontFamily: "'Lato',sans-serif" }}>Navigate</p>
                                <h3 className="lan-serif" style={{ fontSize: '18px', fontWeight: 700, color: NAVY, margin: '0 0 16px' }}>Quick Actions</h3>
                                {[
                                    { href: "/my-account/seller-account/my-books", icon: <Book size={16} style={{ color: NAVY }} />, title: 'My uploaded documents', sub: 'View uploaded docs' },
                                    { href: "/documents", icon: <Globe size={16} style={{ color: NAVY }} />, title: 'Browse documents', sub: 'Explore library' },
                                    { href: "/upload-document", icon: <TrendingUp size={16} style={{ color: NAVY }} />, title: 'Upload documents', sub: 'Add new document' },
                                    { href: "/upload-document/my-pending-books", icon: <TrendingUp size={16} style={{ color: NAVY }} />, title: 'Pending documents', sub: 'Track documents' },
                                    { href: "/my-account/seller-account/share-profile", icon: <Globe size={16} style={{ color: NAVY }} />, title: 'Share My Profile', sub: 'Copy your public link' },
                                ].map(({ href, icon, title, sub }) => (
                                    <Link key={href} href={href} className="action-row" style={{ marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 14px', border: '0.5px solid #e5ddd0', background: '#fff', textDecoration: 'none', transition: 'all 0.18s' }}>
                                        <div style={{ width: '34px', height: '34px', border: `0.5px solid #e5ddd0`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, background: CREAM }}>{icon}</div>
                                        <div style={{ flex: 1 }}>
                                            <p style={{ fontSize: '13px', fontWeight: 700, color: NAVY, margin: '0 0 1px', fontFamily: "'Lato',sans-serif" }}>{title}</p>
                                            <p style={{ fontSize: '11px', color: '#aaa', margin: 0, fontFamily: "'Lato',sans-serif" }}>{sub}</p>
                                        </div>
                                        <ChevronRight size={14} style={{ color: '#ccc', flexShrink: 0 }} />
                                    </Link>
                                ))}
                            </div>

                            {/* Referral Banner */}
                            <div style={{ background: NAVY, backgroundImage: 'radial-gradient(rgba(184,150,62,0.06) 1px,transparent 1px)', backgroundSize: '20px 20px', padding: '24px', position: 'relative', overflow: 'hidden' }}>
                                <div style={{ position: 'absolute', bottom: '-20px', right: '-20px', width: '80px', height: '80px', border: '0.5px solid rgba(184,150,62,0.2)', transform: 'rotate(45deg)' }} />
                                <div className="gold-pill" style={{ marginBottom: '14px' }}>
                                    <Sparkles size={10} style={{ color: GOLD }} />
                                    <span style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: GOLD, fontFamily: "'Lato',sans-serif" }}>Special Bonus</span>
                                </div>
                                <p className="lan-serif" style={{ fontSize: '22px', fontWeight: 700, color: '#fff', margin: '0 0 6px' }}>Up to ₦5,000,000</p>
                                <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', marginBottom: '18px', fontFamily: "'Lato',sans-serif", lineHeight: 1.6 }}>Earn up to 6% by inviting friends to the platform</p>
                                <button onClick={referral} style={{ width: '100%', background: GOLD, color: NAVY, padding: '12px', border: 'none', fontSize: '12px', fontWeight: 700, cursor: 'pointer', fontFamily: "'Lato',sans-serif", letterSpacing: '0.05em', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: 'background 0.18s' }}
                                    onMouseEnter={e => e.currentTarget.style.background = GOLDD}
                                    onMouseLeave={e => e.currentTarget.style.background = GOLD}
                                ><Users size={14} /> Invite Your Friends</button>
                            </div>

                            {/* Bank Details Card */}
                            {user?.bankDetails && (
                                <div style={{ background: '#fff', border: '0.5px solid #e5ddd0', padding: '24px' }}>
                                    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '16px' }}>
                                        <div>
                                            <p style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: GOLD, marginBottom: '4px', fontFamily: "'Lato',sans-serif" }}>Withdrawal</p>
                                            <h3 className="lan-serif" style={{ fontSize: '18px', fontWeight: 700, color: NAVY, margin: 0 }}>Bank Details</h3>
                                        </div>
                                        <button onClick={() => setShowBankModal(true)} style={{ fontSize: '10px', fontWeight: 700, color: NAVY, background: 'transparent', border: 'none', cursor: 'pointer', letterSpacing: '0.06em', textTransform: 'uppercase', fontFamily: "'Lato',sans-serif" }}>Edit</button>
                                    </div>
                                    {seller?.accountNumber && (
                                        <div style={{ background: CREAM, border: '0.5px solid rgba(184,150,62,0.2)', padding: '10px 14px', marginBottom: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                            <span style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#aaa', fontFamily: "'Lato',sans-serif" }}>LAN Account</span>
                                            <span style={{ fontFamily: 'monospace', fontWeight: 700, color: NAVY, fontSize: '13px' }}>
                                                {(() => { const n = seller.accountNumber.replace('LAN', ''); return `LAN-${n.slice(0, 3)}-${n.slice(3)}`; })()}
                                            </span>
                                        </div>
                                    )}
                                    {[['Account Name', user.bankDetails.accountName], ['Account Number', user.bankDetails.accountNumber], ['Bank', user.bankDetails.bankName]].map(([k, v]) => (
                                        <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', padding: '8px 0', borderBottom: '0.5px solid #f0ebe0' }}>
                                            <span style={{ color: '#aaa', fontFamily: "'Lato',sans-serif" }}>{k}</span>
                                            <span style={{ fontWeight: 700, color: NAVY, fontFamily: "'Lato',sans-serif" }}>{v}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* ── Bottom Nav (mobile) ── */}
                <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: NAVY, borderTop: `0.5px solid rgba(184,150,62,0.2)`, display: 'flex', justifyContent: 'space-around', padding: '10px 0 14px', zIndex: 40 }} className="lg-hide">
                    <style>{`@media(min-width:1024px){.lg-hide{display:none !important;}}`}</style>
                    {[
                        { href: "/home", icon: <DollarSign size={20} />, label: 'Home' },
                        { href: "/my-account/seller-account/my-books", icon: <Book size={20} />, label: 'My Books' },
                        { href: "/documents", icon: <Globe size={20} />, label: 'Browse' },
                        { href: "/advertise", icon: <TrendingUp size={20} />, label: 'Upload' },
                    ].map(({ href, icon, label }) => (
                        <Link key={href} href={href} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', textDecoration: 'none', color: 'rgba(255,255,255,0.55)', fontFamily: "'Lato',sans-serif" }}>
                            {icon}
                            <span style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '0.06em' }}>{label}</span>
                        </Link>
                    ))}
                    <button onClick={() => setShowProfileModal(true)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', background: 'transparent', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.55)', fontFamily: "'Lato',sans-serif" }}>
                        <User size={20} /><span style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '0.06em' }}>Me</span>
                    </button>
                </div>
                <div className="lg-hide" style={{ height: '72px' }} />

                {/* ══════ MODALS (preserved exactly) ══════ */}

                {/* Profile Modal */}
                {showProfileModal && (
                    <div className="modal-overlay mt-25">
                        <div className="modal-inner">
                            <div style={{ background: NAVY, padding: '32px 24px', textAlign: 'center', position: 'relative' }}>
                                <button onClick={() => setShowProfileModal(false)} style={{ position: 'absolute', top: '16px', right: '16px', background: 'transparent', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.6)' }}>
                                    <X size={22} />
                                </button>
                                <div style={{ position: 'relative', display: 'inline-block', marginBottom: '12px' }}>
                                    <img src={user?.photoBase64 || "/lan-logo.png"} style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover', border: `3px solid ${GOLD}` }} alt="Profile" />
                                </div>
                                <p className="lan-serif" style={{ fontSize: '22px', fontWeight: 700, color: '#fff', margin: '0 0 4px' }}> {seller?.title ? `${seller.title} ` : ""}{user?.firstName} {user?.surname}</p>
                                <p style={{ fontSize: '12px', color: GOLD, fontFamily: "'Lato',sans-serif" }}>+234{user?.phone || user?.phoneNumber || '0000000000'}</p>
                            </div>
                            <div style={{ background: BG, flex: 1, overflowY: 'auto', padding: '12px' }}>
                                {[
                                    { label: 'My Profile', icon: <User size={18} style={{ color: NAVY }} />, onClick: () => { setShowProfileModal(false); setIsEditing(true); } },
                                    { label: 'Bank Details', icon: <Building size={18} style={{ color: NAVY }} />, onClick: () => { setShowProfileModal(false); setShowBankModal(true); if (user?.bankDetails) setBankFormData({ accountName: user.bankDetails.accountName || "", accountNumber: user.bankDetails.accountNumber || "", bankName: user.bankDetails.bankName || "", bankCode: user.bankDetails.bankCode || "" }); } },
                                    { label: 'Transaction History', icon: <TrendingUp size={18} style={{ color: NAVY }} />, onClick: () => { setShowProfileModal(false); setShowTransactionHistory(true); } },
                                    { label: 'Physical Repository', icon: <Package size={18} style={{ color: NAVY }} />, onClick: () => { setShowProfileModal(false); router.push('/my-account/seller-account/repository'); } },

                                    {
                                        label: user?.lecturerVerificationStatus === 'pending'
                                            ? 'Impact Analytics (Pending)'
                                            : 'Impact Analytics',
                                        icon: (
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                                                stroke={user?.lecturerVerificationStatus === 'pending' ? '#d97706' : NAVY}
                                                strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                                                <line x1="18" y1="20" x2="18" y2="10" />
                                                <line x1="12" y1="20" x2="12" y2="4" />
                                                <line x1="6" y1="20" x2="6" y2="14" />
                                                <line x1="2" y1="20" x2="22" y2="20" />
                                            </svg>
                                        ),
                                        onClick: () => { setShowProfileModal(false); router.push('/my-account/seller-account/Impact-analytics'); }
                                    },
                                    { label: 'Reset Transfer PIN', icon: <Settings size={18} style={{ color: NAVY }} />, onClick: () => { setShowProfileModal(false); setResetPinView('forgot'); setResetPinError(''); setResetPinSuccess(false); setResetOtpInput(''); setResetNewPin(''); setShowResetPinModal(true); } },
                                    { label: 'Help', icon: <AlertCircle size={18} style={{ color: NAVY }} />, onClick: handleButton },
                                ].map(({ label, icon, onClick }) => (
                                    <button key={label} onClick={onClick} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px', border: '0.5px solid #e5ddd0', background: '#fff', marginBottom: '6px', cursor: 'pointer', transition: 'all 0.15s', textAlign: 'left' }}
                                        onMouseEnter={e => { e.currentTarget.style.borderColor = GOLD; e.currentTarget.style.background = CREAM; }}
                                        onMouseLeave={e => { e.currentTarget.style.borderColor = '#e5ddd0'; e.currentTarget.style.background = '#fff'; }}>
                                        <div style={{ width: '36px', height: '36px', border: '0.5px solid #e5ddd0', display: 'flex', alignItems: 'center', justifyContent: 'center', background: CREAM, flexShrink: 0 }}>{icon}</div>
                                        <span style={{ fontSize: '13px', fontWeight: 700, color: NAVY, fontFamily: "'Lato',sans-serif", flex: 1 }}>{label}</span>
                                        <ChevronRight size={14} style={{ color: '#ccc' }} />
                                    </button>
                                ))}

                                {/* Other info block */}
                                <div style={{ border: '0.5px solid #e5ddd0', background: '#fff', padding: '16px', marginBottom: '6px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
                                        <div style={{ width: '36px', height: '36px', border: '0.5px solid #e5ddd0', display: 'flex', alignItems: 'center', justifyContent: 'center', background: CREAM, flexShrink: 0 }}><Settings size={18} style={{ color: NAVY }} /></div>
                                        <span style={{ fontSize: '13px', fontWeight: 700, color: NAVY, fontFamily: "'Lato',sans-serif" }}>Other Information</span>
                                    </div>
                                    {[['Email', user?.email], ['Date of Birth', user?.dateOfBirth || 'Not set'], ['Address', user?.address || 'Not set'], ['Country', user?.country || 'Not set'], ['Account Type', user?.isLecturer || FACULTY_TITLES.includes(seller?.title) ? 'Verified Faculty' : 'Verified Seller']].map(([k, v]) => (
                                        <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', padding: '8px 0', borderBottom: '0.5px solid #f0ebe0' }}>
                                            <span style={{ color: '#aaa', fontFamily: "'Lato',sans-serif" }}>{k}</span>
                                            <span style={{ fontWeight: 700, color: NAVY, fontFamily: "'Lato',sans-serif", textAlign: 'right', maxWidth: '60%' }}>{v}</span>
                                        </div>
                                    ))}
                                </div>

                                {FACULTY_TITLES.includes(seller?.title) && (
                                    <button onClick={() => { setShowProfileModal(false); setShowExportModal(true); }} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px', border: '0.5px solid #e5ddd0', background: '#fff', marginBottom: '6px', cursor: 'pointer', transition: 'all 0.15s' }}
                                        onMouseEnter={e => { e.currentTarget.style.borderColor = GOLD; e.currentTarget.style.background = CREAM; }}
                                        onMouseLeave={e => { e.currentTarget.style.borderColor = '#e5ddd0'; e.currentTarget.style.background = '#fff'; }}>
                                        <div style={{ width: '36px', height: '36px', border: '0.5px solid #e5ddd0', display: 'flex', alignItems: 'center', justifyContent: 'center', background: CREAM, flexShrink: 0 }}><Download size={18} style={{ color: NAVY }} /></div>
                                        <div style={{ flex: 1, textAlign: 'left' }}>
                                            <p style={{ fontSize: '13px', fontWeight: 700, color: NAVY, margin: 0, fontFamily: "'Lato',sans-serif" }}>Export Student List</p>
                                            <p style={{ fontSize: '11px', color: '#aaa', margin: 0, fontFamily: "'Lato',sans-serif" }}>Download buyer CSV</p>
                                        </div>
                                        <ChevronRight size={14} style={{ color: '#ccc' }} />
                                    </button>
                                )}

                                {/* Deactivate */}
                                <button onClick={() => { setShowProfileModal(false); setDeactivateConfirmText(""); setDeactivateError(""); setShowDeactivateModal(true); }}
                                    style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px', border: '0.5px solid #fecaca', background: '#fef2f2', cursor: 'pointer', marginTop: '8px', transition: 'all 0.15s' }}
                                    onMouseEnter={e => e.currentTarget.style.background = '#fee2e2'}
                                    onMouseLeave={e => e.currentTarget.style.background = '#fef2f2'}>
                                    <div style={{ width: '36px', height: '36px', border: '0.5px solid #fecaca', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fee2e2', flexShrink: 0 }}><AlertCircle size={18} style={{ color: '#ef4444' }} /></div>
                                    <span style={{ fontSize: '13px', fontWeight: 700, color: '#dc2626', fontFamily: "'Lato',sans-serif", flex: 1, textAlign: 'left' }}>Deactivate Account</span>
                                    <ChevronRight size={14} style={{ color: '#f87171' }} />
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Transaction History Modal */}
                {showTransactionHistory && (
                    <div className="modal-overlay mt-25">
                        <div className="modal-inner">
                            <div style={{ background: NAVY, padding: '20px 24px', display: 'flex', alignItems: 'center', gap: '14px', position: 'sticky', top: 0 }}>
                                <button onClick={() => setShowTransactionHistory(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#fff' }}><X size={22} /></button>
                                <h2 className="lan-serif" style={{ fontSize: '20px', fontWeight: 700, color: '#fff', margin: 0 }}>Transaction History</h2>
                            </div>
                            <div style={{ flex: 1, overflowY: 'auto', padding: '16px', background: BG }}>
                                {transactions.length === 0 ? (
                                    <div style={{ textAlign: 'center', padding: '60px 0' }}>
                                        <ShoppingBag size={40} style={{ color: '#ddd', margin: '0 auto 12px' }} />
                                        <p style={{ color: '#aaa', fontFamily: "'Lato',sans-serif" }}>No transactions yet</p>
                                    </div>
                                ) : (
                                    transactions.map(txn => (
                                        <div key={txn.id} style={{ background: '#fff', border: '0.5px solid #e5ddd0', padding: '16px', marginBottom: '8px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                    <div style={{ width: '36px', height: '36px', border: '0.5px solid #e5ddd0', display: 'flex', alignItems: 'center', justifyContent: 'center', background: CREAM, flexShrink: 0 }}>
                                                        {txn.type === 'transfer_out' ? <ArrowUpRight size={16} style={{ color: '#ef4444' }} /> : txn.type === 'transfer_in' ? <ArrowDownLeft size={16} style={{ color: '#16a34a' }} /> : <ShoppingBag size={16} style={{ color: NAVY }} />}
                                                    </div>
                                                    <div>
                                                        <p style={{ fontSize: '13px', fontWeight: 700, color: NAVY, margin: '0 0 2px', fontFamily: "'Lato',sans-serif" }}>{txn.bookTitle}</p>
                                                        <p style={{ fontSize: '10px', color: '#aaa', margin: 0, fontFamily: "'Lato',sans-serif" }}>{txn.createdAtDate?.toLocaleDateString()} {txn.createdAtDate?.toLocaleTimeString()}</p>
                                                    </div>
                                                </div>
                                                <div style={{ textAlign: 'right' }}>
                                                    <p style={{ fontSize: '13px', fontWeight: 700, color: '#16a34a', margin: '0 0 2px', fontFamily: "'Lato',sans-serif" }}>+₦{(txn.sellerAmount || (txn.amount * 0.85)).toLocaleString()}</p>
                                                    <span style={{ fontSize: '10px', background: '#f0fdf4', color: '#16a34a', padding: '2px 8px', fontFamily: "'Lato',sans-serif", fontWeight: 700 }}>Success</span>
                                                </div>
                                            </div>
                                            <div style={{ background: CREAM, border: '0.5px solid #f0ebe0', padding: '10px 12px' }}>
                                                {[
                                                    ['Buyer', txn.buyerName || txn.studentName || '—'],
                                                    ['Price', `₦${(txn.amount || txn.salePrice || 0).toLocaleString()}`],
                                                    ['Country', txn.buyerCountry ? `${getCountryFlag(txn.buyerCountry)} ${txn.buyerCountry}` : '—'],
                                                    ['Your Payout (80%)', `+₦${(txn.sellerAmount || txn.sellerPayout || (txn.amount * 0.80) || 0).toLocaleString()}`],
                                                    ['Platform Fee (20%)', `-₦${(txn.platformFee || txn.fee || ((txn.amount || txn.salePrice || 0) * 0.20)).toLocaleString()}`],
                                                ].map(([k, v]) => (
                                                    <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', padding: '4px 0' }}>
                                                        <span style={{ color: '#aaa', fontFamily: "'Lato',sans-serif" }}>{k}</span>
                                                        <span style={{
                                                            fontWeight: 700, color: k.includes('Fee') ? '#ef4444' : k.includes('Payout') ? '#16a34a' : NAVY, fontFamily: "'Lato',sans-serif" }}>{v}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))
                                )}
                                {withdrawals.length > 0 && (
                                    <div style={{ marginTop: '24px' }}>
                                        <p style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: GOLD, marginBottom: '12px', fontFamily: "'Lato',sans-serif" }}>Withdrawal History</p>
                                        {withdrawals.map(w => (
                                            <div key={w.id} style={{ background: '#fff', border: '0.5px solid #e5ddd0', padding: '16px', marginBottom: '8px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                        <div style={{ width: '36px', height: '36px', border: '0.5px solid #e5ddd0', display: 'flex', alignItems: 'center', justifyContent: 'center', background: CREAM, flexShrink: 0 }}><Download size={16} style={{ color: NAVY }} /></div>
                                                        <div>
                                                            <p style={{ fontSize: '13px', fontWeight: 700, color: NAVY, margin: '0 0 2px', fontFamily: "'Lato',sans-serif" }}>Withdrawal Request</p>
                                                            <p style={{ fontSize: '10px', color: '#aaa', margin: 0, fontFamily: "'Lato',sans-serif" }}>{w.requestedAtDate?.toLocaleDateString()}</p>
                                                        </div>
                                                    </div>
                                                    <div style={{ textAlign: 'right' }}>
                                                        <p style={{ fontSize: '13px', fontWeight: 700, color: '#ef4444', margin: '0 0 2px', fontFamily: "'Lato',sans-serif" }}>₦{w.amount?.toLocaleString()}</p>
                                                        <span style={{ fontSize: '10px', fontWeight: 700, fontFamily: "'Lato',sans-serif", padding: '2px 8px', background: w.status === 'pending' ? '#fef9c3' : w.status === 'completed' ? '#f0fdf4' : '#fef2f2', color: w.status === 'pending' ? '#a16207' : w.status === 'completed' ? '#16a34a' : '#dc2626' }}>
                                                            {w.status === 'pending' ? '⏳ Pending' : w.status === 'completed' ? '✅ Completed' : '❌ ' + w.status}
                                                        </span>
                                                    </div>
                                                </div>
                                                {w.reference && <p style={{ fontSize: '11px', color: '#aaa', background: CREAM, padding: '8px 10px', fontFamily: 'monospace', wordBreak: 'break-all' }}>Ref: {w.reference}</p>}
                                                {w.adminNote && <div style={{ background: '#eff6ff', border: '0.5px solid #bfdbfe', padding: '10px 12px', marginTop: '8px' }}><p style={{ fontSize: '11px', fontWeight: 700, color: NAVY, margin: '0 0 2px' }}>Admin Note:</p><p style={{ fontSize: '11px', color: '#1d4ed8', margin: 0 }}>{w.adminNote}</p></div>}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Withdraw Modal */}
                {showWithdrawModal && (
                    <div className="modal-overlay mt-25 ">
                        <div className="modal-inner">
                            <div style={{ background: NAVY, padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0 }}>
                                <h2 className="lan-serif" style={{ fontSize: '20px', fontWeight: 700, color: '#fff', margin: 0 }}>Withdraw Funds</h2>
                                <button onClick={() => { setShowWithdrawModal(false); setWithdrawalError(""); setWithdrawAmount(""); }} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#fff' }}><X size={22} /></button>
                            </div>
                            <div style={{ padding: '16px 24px', borderBottom: '0.5px solid #f0ebe0', background: '#fffbeb', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <AlertCircle size={16} style={{ color: '#d97706', flexShrink: 0 }} />
                                <div>
                                    <p style={{ fontSize: '12px', fontWeight: 700, color: '#92400e', margin: '0 0 2px', fontFamily: "'Lato',sans-serif" }}>LAN Approval Required</p>
                                    <p style={{ fontSize: '11px', color: '#92400e', margin: 0, fontFamily: "'Lato',sans-serif" }}>Processed within 24–48 hours. Email notification sent once approved.</p>
                                </div>
                            </div>
                            {user?.bankDetails ? (
                                <div style={{ padding: '16px 24px', borderBottom: '0.5px solid #f0ebe0', background: CREAM }}>
                                    <p style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: GOLD, margin: '0 0 8px', fontFamily: "'Lato',sans-serif" }}>Sending to</p>
                                    {[['Account Name', user.bankDetails.accountName], ['Account Number', user.bankDetails.accountNumber], ['Bank', user.bankDetails.bankName]].map(([k, v]) => (
                                        <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', padding: '4px 0' }}>
                                            <span style={{ color: '#aaa', fontFamily: "'Lato',sans-serif" }}>{k}</span>
                                            <span style={{ fontWeight: 700, color: NAVY, fontFamily: "'Lato',sans-serif" }}>{v}</span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div style={{ padding: '16px 24px', borderBottom: '0.5px solid #f0ebe0', background: '#fef9c3', display: 'flex', gap: '10px' }}>
                                    <AlertCircle size={14} style={{ color: '#d97706', flexShrink: 0, marginTop: '1px' }} />
                                    <p style={{ fontSize: '12px', color: '#92400e', fontFamily: "'Lato',sans-serif", margin: 0 }}>Please add bank details to your profile first</p>
                                </div>
                            )}
                            <div style={{ padding: '24px' }}>
                                <div style={{ background: NAVY, padding: '20px', marginBottom: '16px' }}>
                                    <p style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: GOLD, margin: '0 0 4px', fontFamily: "'Lato',sans-serif" }}>Available Balance</p>
                                    <p className="lan-serif" style={{ fontSize: '32px', fontWeight: 700, color: '#fff', margin: 0 }}>₦{accountBalance.toLocaleString()}</p>
                                </div>
                                {withdrawalError && (
                                    <div style={{ display: 'flex', gap: '10px', background: '#fef2f2', border: '0.5px solid #fecaca', padding: '12px', marginBottom: '14px' }}>
                                        <AlertCircle size={14} style={{ color: '#ef4444', flexShrink: 0, marginTop: '1px' }} />
                                        <p style={{ fontSize: '12px', color: '#dc2626', fontFamily: "'Lato',sans-serif", margin: 0 }}>{withdrawalError}</p>
                                    </div>
                                )}
                                <label style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#888', display: 'block', marginBottom: '8px', fontFamily: "'Lato',sans-serif" }}>Amount</label>
                                <input type="number" value={withdrawAmount} onChange={e => { setWithdrawAmount(e.target.value); setWithdrawalError(""); }} placeholder="Enter amount" min="1000" max={accountBalance}
                                    style={{ width: '100%', border: '0.5px solid #e5ddd0', padding: '12px 14px', fontSize: '15px', fontWeight: 700, color: NAVY, outline: 'none', fontFamily: "'Lato',sans-serif", boxSizing: 'border-box', marginBottom: '6px' }} />
                                <p style={{ fontSize: '11px', color: '#aaa', marginBottom: '20px', fontFamily: "'Lato',sans-serif" }}>Minimum: ₦1,000</p>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <button onClick={() => { setShowWithdrawModal(false); setWithdrawalError(""); setWithdrawAmount(""); }}
                                        style={{ flex: 1, background: '#f5f5f5', color: '#666', padding: '13px', border: '0.5px solid #e5ddd0', fontSize: '13px', fontWeight: 700, cursor: 'pointer', fontFamily: "'Lato',sans-serif" }}>Cancel</button>
                                    <button onClick={handleWithdraw} disabled={withdrawing || !user?.bankDetails}
                                        style={{ flex: 1, background: NAVY, color: '#fff', padding: '13px', border: 'none', fontSize: '13px', fontWeight: 700, cursor: 'pointer', fontFamily: "'Lato',sans-serif", display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', opacity: (!user?.bankDetails || withdrawing) ? 0.5 : 1 }}>
                                        {withdrawing ? <><div style={{ width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} /> Processing…</> : <><Download size={15} /> Withdraw Now</>}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Edit Profile Modal */}
                {isEditing && (
                    <div className="modal-overlay mt-25">
                        <div className="modal-inner">
                            <div style={{ background: NAVY, padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0 }}>
                                <h2 className="lan-serif" style={{ fontSize: '20px', fontWeight: 700, color: '#fff', margin: 0 }}>Edit Profile</h2>
                                <button onClick={() => setIsEditing(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#fff' }}><X size={22} /></button>
                            </div>
                            <div style={{ padding: '24px' }}>
                                <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                                    <div style={{ position: 'relative', display: 'inline-block' }}>
                                        <img src={user?.photoBase64 || "/api/placeholder/128/128"} style={{ width: '100px', height: '100px', borderRadius: '50%', objectFit: 'cover', border: `3px solid ${GOLD}` }} alt="profile" />
                                        <label style={{ position: 'absolute', bottom: 0, right: 0, background: NAVY, width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', border: '2px solid #fff' }}>
                                            <Camera size={15} style={{ color: '#fff' }} />
                                            <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageUpload} />
                                        </label>
                                    </div>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                    {[['First Name', 'firstName'], ['Surname', 'surname'], ['Phone', 'phone']].map(([label, key]) => (
                                        <div key={key}>
                                            <label style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#888', display: 'block', marginBottom: '6px', fontFamily: "'Lato',sans-serif" }}>{label}</label>
                                            <input value={formData[key]} onChange={e => setFormData({ ...formData, [key]: e.target.value })} style={{ width: '100%', border: '0.5px solid #e5ddd0', padding: '11px 12px', fontSize: '13px', color: NAVY, outline: 'none', fontFamily: "'Lato',sans-serif", boxSizing: 'border-box' }} />
                                        </div>
                                    ))}
                                    <div>
                                        <label style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#888', display: 'block', marginBottom: '6px', fontFamily: "'Lato',sans-serif" }}>Date of Birth</label>
                                        <input type="date" value={formData.dateOfBirth} onChange={e => setFormData({ ...formData, dateOfBirth: e.target.value })} style={{ width: '100%', border: '0.5px solid #e5ddd0', padding: '11px 12px', fontSize: '13px', color: NAVY, outline: 'none', fontFamily: "'Lato',sans-serif", boxSizing: 'border-box' }} />
                                    </div>
                                    <div style={{ gridColumn: 'span 2' }}>
                                        <label style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#888', display: 'block', marginBottom: '6px', fontFamily: "'Lato',sans-serif" }}>Address</label>
                                        <input value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} style={{ width: '100%', border: '0.5px solid #e5ddd0', padding: '11px 12px', fontSize: '13px', color: NAVY, outline: 'none', fontFamily: "'Lato',sans-serif", boxSizing: 'border-box' }} />
                                    </div>
                                    <div style={{ gridColumn: 'span 2' }}>
                                        <label style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#888', display: 'block', marginBottom: '6px', fontFamily: "'Lato',sans-serif" }}>Country</label>
                                        <input value={formData.country} onChange={e => setFormData({ ...formData, country: e.target.value })} placeholder="e.g. Nigeria" style={{ width: '100%', border: '0.5px solid #e5ddd0', padding: '11px 12px', fontSize: '13px', color: NAVY, outline: 'none', fontFamily: "'Lato',sans-serif", boxSizing: 'border-box' }} />
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                                    <button onClick={() => setIsEditing(false)} style={{ flex: 1, background: '#f5f5f5', color: '#666', padding: '13px', border: '0.5px solid #e5ddd0', fontSize: '13px', fontWeight: 700, cursor: 'pointer', fontFamily: "'Lato',sans-serif" }}>Cancel</button>
                                    <button onClick={handleSave} style={{ flex: 1, background: NAVY, color: '#fff', padding: '13px', border: 'none', fontSize: '13px', fontWeight: 700, cursor: 'pointer', fontFamily: "'Lato',sans-serif", display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                        <Save size={15} /> Save Changes
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Bank Details Modal */}
                {showBankModal && (
                    <div className="modal-overlay mt-25">
                        <div className="modal-inner">
                            <div style={{ background: NAVY, padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0 }}>
                                <h2 className="lan-serif" style={{ fontSize: '20px', fontWeight: 700, color: '#fff', margin: 0 }}>Bank Details</h2>
                                <button onClick={() => { setShowBankModal(false); setBankFormData({ accountName: "", accountNumber: "", bankName: "", bankCode: "" }); }} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#fff' }}><X size={22} /></button>
                            </div>
                            <div style={{ padding: '24px' }}>
                                {user?.bankDetails && (
                                    <div style={{ background: CREAM, border: '0.5px solid rgba(184,150,62,0.2)', padding: '14px 16px', marginBottom: '20px' }}>
                                        <p style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: GOLD, margin: '0 0 8px', fontFamily: "'Lato',sans-serif" }}>Current Bank Details</p>
                                        {[['Account Name', user.bankDetails.accountName], ['Account Number', user.bankDetails.accountNumber], ['Bank', user.bankDetails.bankName]].map(([k, v]) => (
                                            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', padding: '4px 0' }}>
                                                <span style={{ color: '#aaa', fontFamily: "'Lato',sans-serif" }}>{k}</span>
                                                <span style={{ fontWeight: 700, color: NAVY, fontFamily: "'Lato',sans-serif" }}>{v}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                {[
                                    { label: 'Account Name', key: 'accountName', type: 'text', placeholder: 'Enter account holder name' },
                                    { label: 'Account Number', key: 'accountNumber', type: 'text', placeholder: 'Enter account number', maxLength: 10 },
                                ].map(({ label, key, type, placeholder, maxLength }) => (
                                    <div key={key} style={{ marginBottom: '14px' }}>
                                        <label style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#888', display: 'block', marginBottom: '6px', fontFamily: "'Lato',sans-serif" }}>{label} <span style={{ color: '#ef4444' }}>*</span></label>
                                        <input type={type} value={bankFormData[key]} onChange={e => setBankFormData({ ...bankFormData, [key]: e.target.value })} placeholder={placeholder} maxLength={maxLength}
                                            style={{ width: '100%', border: '0.5px solid #e5ddd0', padding: '11px 12px', fontSize: '13px', color: NAVY, outline: 'none', fontFamily: "'Lato',sans-serif", boxSizing: 'border-box' }} />
                                    </div>
                                ))}
                                <div style={{ marginBottom: '14px' }}>
                                    <label style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#888', display: 'block', marginBottom: '6px', fontFamily: "'Lato',sans-serif" }}>Bank Name <span style={{ color: '#ef4444' }}>*</span></label>
                                    <select value={bankFormData.bankName} onChange={e => { const b = nigerianBanks.find(x => x.name === e.target.value); setBankFormData({ ...bankFormData, bankName: e.target.value, bankCode: b ? b.code : "" }); }}
                                        style={{ width: '100%', border: '0.5px solid #e5ddd0', padding: '11px 12px', fontSize: '13px', color: NAVY, outline: 'none', fontFamily: "'Lato',sans-serif", boxSizing: 'border-box', background: '#fff' }}>
                                        <option value="">Select your bank</option>
                                        {nigerianBanks.map(b => <option key={b.code} value={b.name}>{b.name}</option>)}
                                    </select>
                                </div>
                                <div style={{ marginBottom: '20px' }}>
                                    <label style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#888', display: 'block', marginBottom: '6px', fontFamily: "'Lato',sans-serif" }}>Bank Code</label>
                                    <input type="text" value={bankFormData.bankCode} readOnly placeholder="Auto-filled"
                                        style={{ width: '100%', border: '0.5px solid #e5ddd0', padding: '11px 12px', fontSize: '13px', color: '#aaa', background: '#f9f9f9', fontFamily: "'Lato',sans-serif", boxSizing: 'border-box', cursor: 'not-allowed' }} />
                                    <p style={{ fontSize: '10px', color: '#aaa', marginTop: '4px', fontFamily: "'Lato',sans-serif" }}>✓ Auto-filled when you select a bank</p>
                                </div>
                                <div style={{ display: 'flex', gap: '10px', marginBottom: '14px' }}>
                                    <button onClick={() => { setShowBankModal(false); setBankFormData({ accountName: "", accountNumber: "", bankName: "", bankCode: "" }); }}
                                        style={{ flex: 1, background: '#f5f5f5', color: '#666', padding: '13px', border: '0.5px solid #e5ddd0', fontSize: '13px', fontWeight: 700, cursor: 'pointer', fontFamily: "'Lato',sans-serif" }}>Cancel</button>
                                    <button onClick={handleSaveBank} disabled={savingBank}
                                        style={{ flex: 1, background: NAVY, color: '#fff', padding: '13px', border: 'none', fontSize: '13px', fontWeight: 700, cursor: 'pointer', fontFamily: "'Lato',sans-serif", display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', opacity: savingBank ? 0.6 : 1 }}>
                                        {savingBank ? <><div style={{ width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} /> Saving…</> : <><Save size={15} /> Save Bank Details</>}
                                    </button>
                                </div>
                                <div style={{ background: '#fffbeb', border: '0.5px solid #fde68a', padding: '10px 12px' }}>
                                    <p style={{ fontSize: '11px', color: '#92400e', fontFamily: "'Lato',sans-serif", margin: 0 }}><strong>Note:</strong> Ensure your bank details are correct. All withdrawals will be sent to this account.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* PIN Modal */}
                {showPinModal && (
                    <PinModal amount={withdrawAmount} bankDetails={user?.bankDetails} pinValue={pinValue} pinError={pinError}
                        onDigit={d => pinValue.length < 4 && setPinValue(p => p + d)}
                        onDelete={() => setPinValue(p => p.slice(0, -1))}
                        onConfirm={handlePinConfirm}
                        onClose={() => { setShowPinModal(false); setPinValue(""); setPinError(""); }}
                    />
                )}
                {successData && <SuccessModal amount={successData.amount} reference={successData.reference} onClose={() => setSuccessData(null)} />}

                {/* Reset PIN Modal */}
                {showResetPinModal && (
                    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
                        <div style={{ background: '#fff', width: '100%', maxWidth: '360px', overflow: 'hidden', boxShadow: '0 32px 64px rgba(13,34,68,0.3)' }}>
                            <div style={{ background: NAVY, padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <div>
                                    <p style={{ color: GOLD, fontSize: '10px', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: '4px', fontFamily: "'Lato',sans-serif" }}>Security</p>
                                    <p className="lan-serif" style={{ color: '#fff', fontSize: '16px', fontWeight: 700, margin: 0 }}>Reset Transfer PIN</p>
                                </div>
                                <button onClick={() => setShowResetPinModal(false)} style={{ width: '34px', height: '34px', border: '0.5px solid rgba(255,255,255,0.2)', background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'rgba(255,255,255,0.6)' }}><X size={15} /></button>
                            </div>
                            <div style={{ padding: '24px' }}>
                                {resetPinError && <div style={{ display: 'flex', gap: '8px', background: '#fef2f2', border: '0.5px solid #fecaca', padding: '10px 12px', marginBottom: '14px' }}><AlertCircle size={14} style={{ color: '#ef4444', flexShrink: 0 }} /><p style={{ fontSize: '12px', color: '#dc2626', margin: 0, fontFamily: "'Lato',sans-serif" }}>{resetPinError}</p></div>}
                                {resetPinSuccess && (
                                    <div style={{ textAlign: 'center', padding: '16px 0' }}>
                                        <div style={{ width: '60px', height: '60px', background: '#f0fdf4', border: '0.5px solid #86efac', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
                                            <svg style={{ width: '28px', height: '28px' }} fill="none" stroke="#16a34a" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                                        </div>
                                        <p className="lan-serif" style={{ fontSize: '18px', fontWeight: 700, color: NAVY, margin: '0 0 6px' }}>PIN Reset Successful!</p>
                                        <p style={{ fontSize: '12px', color: '#aaa', marginBottom: '20px', fontFamily: "'Lato',sans-serif" }}>Your transfer PIN has been updated.</p>
                                        <button onClick={() => setShowResetPinModal(false)} style={{ width: '100%', background: NAVY, color: '#fff', padding: '13px', border: 'none', fontSize: '13px', fontWeight: 700, cursor: 'pointer', fontFamily: "'Lato',sans-serif" }}>Done</button>
                                    </div>
                                )}
                                {!resetPinSuccess && resetPinView === 'forgot' && (
                                    <>
                                        <p style={{ fontSize: '13px', color: '#888', textAlign: 'center', marginBottom: '20px', lineHeight: 1.6, fontFamily: "'Lato',sans-serif" }}>We'll send a 6-digit reset code to your email to verify your identity.</p>
                                        <button onClick={async () => { setResetPinError(''); const r = await requestPinReset(); if (r.success) setResetPinView('otp'); else setResetPinError('Failed to send code. Try again.'); }} disabled={Processing}
                                            style={{ width: '100%', background: NAVY, color: '#fff', padding: '13px', border: 'none', fontSize: '13px', fontWeight: 700, cursor: 'pointer', fontFamily: "'Lato',sans-serif", marginBottom: '10px', opacity: Processing ? 0.6 : 1 }}>
                                            {Processing ? 'Sending…' : 'Send Reset Code'}
                                        </button>
                                        <button onClick={() => setShowResetPinModal(false)} style={{ width: '100%', background: 'transparent', border: 'none', fontSize: '12px', color: '#aaa', cursor: 'pointer', padding: '8px', fontFamily: "'Lato',sans-serif" }}>Cancel</button>
                                    </>
                                )}
                                {!resetPinSuccess && resetPinView === 'otp' && (
                                    <>
                                        <p style={{ fontSize: '13px', color: '#888', textAlign: 'center', marginBottom: '16px', lineHeight: 1.6, fontFamily: "'Lato',sans-serif" }}>Enter the 6-digit code and choose a new PIN.</p>
                                        <input type="text" value={resetOtpInput} onChange={e => setResetOtpInput(e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="6-digit code" maxLength={6}
                                            style={{ width: '100%', border: '0.5px solid #e5ddd0', padding: '12px', fontSize: '18px', textAlign: 'center', letterSpacing: '0.3em', color: NAVY, outline: 'none', fontFamily: 'monospace', boxSizing: 'border-box', marginBottom: '10px' }} />
                                        <input type="password" value={resetNewPin} onChange={e => setResetNewPin(e.target.value.replace(/\D/g, '').slice(0, 4))} placeholder="New 4-digit PIN" maxLength={4}
                                            style={{ width: '100%', border: '0.5px solid #e5ddd0', padding: '12px', fontSize: '22px', textAlign: 'center', letterSpacing: '0.4em', color: NAVY, outline: 'none', fontFamily: 'monospace', boxSizing: 'border-box', marginBottom: '16px' }} />
                                        <button onClick={async () => { setResetPinError(''); if (resetOtpInput.length < 6) { setResetPinError('Enter the 6-digit code.'); return; } if (resetNewPin.length < 4) { setResetPinError('New PIN must be 4 digits.'); return; } try { await verifyOtpAndSetPin(resetOtpInput, resetNewPin); setResetPinSuccess(true); } catch (err) { setResetPinError(err.message); } }}
                                            disabled={Processing || resetOtpInput.length < 6 || resetNewPin.length < 4}
                                            style={{ width: '100%', background: NAVY, color: '#fff', padding: '13px', border: 'none', fontSize: '13px', fontWeight: 700, cursor: 'pointer', fontFamily: "'Lato',sans-serif", marginBottom: '10px', opacity: (Processing || resetOtpInput.length < 6 || resetNewPin.length < 4) ? 0.4 : 1 }}>
                                            {Processing ? 'Verifying…' : 'Reset PIN & Save'}
                                        </button>
                                        <button onClick={() => { setResetPinView('forgot'); setResetPinError(''); }} style={{ width: '100%', background: 'transparent', border: 'none', fontSize: '12px', color: '#aaa', cursor: 'pointer', padding: '8px', fontFamily: "'Lato',sans-serif" }}>Back</button>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Account Switch Sheet */}
                <AccountSwitchSheet isOpen={showSwitchModal} onClose={() => setShowSwitchModal(false)} isStudent={user?.isStudent === true} router={router} />

                {/* Deactivate Modal */}
                {showDeactivateModal && (
                    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 80, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>
                        <div style={{ background: '#fff', width: '100%', maxWidth: '440px', overflow: 'hidden' }}>
                            <div style={{ background: '#A32D2D', padding: '32px 24px', textAlign: 'center', position: 'relative' }}>
                                <button onClick={() => { setShowDeactivateModal(false); setDeactivateConfirmText(""); setDeactivateError(""); }}
                                    style={{ position: 'absolute', top: '14px', right: '14px', width: '30px', height: '30px', background: 'rgba(255,255,255,0.12)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.7)' }}><X size={15} /></button>
                                <div style={{ width: '64px', height: '64px', border: '1.5px solid rgba(255,255,255,0.2)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
                                    <AlertCircle size={28} style={{ color: '#fff' }} />
                                </div>
                                <p className="lan-serif" style={{ fontSize: '20px', fontWeight: 700, color: '#fff', margin: '0 0 6px' }}>Deactivate account?</p>
                                <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', fontFamily: "'Lato',sans-serif", margin: 0 }}>This action is permanent and cannot be undone</p>
                            </div>
                            <div style={{ padding: '20px 20px 0' }}>
                                <div style={{ background: '#FCEBEB', border: '0.5px solid #F7C1C1', padding: '14px', marginBottom: '16px' }}>
                                    <p style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#791F1F', margin: '0 0 10px', fontFamily: "'Lato',sans-serif" }}>What happens when you deactivate</p>
                                    {["You will be immediately signed out", "All uploaded documents will be hidden", "Wallet balance will be frozen", "You will lose access to all earnings", "Cannot be reversed without contacting support"].map((w, i) => (
                                        <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginBottom: '6px' }}>
                                            <div style={{ width: '16px', height: '16px', background: '#F09595', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '1px' }}><X size={8} color="#A32D2D" strokeWidth={2.5} /></div>
                                            <p style={{ fontSize: '12px', color: '#791F1F', margin: 0, lineHeight: 1.5, fontFamily: "'Lato',sans-serif" }}>{w}</p>
                                        </div>
                                    ))}
                                </div>
                                <div style={{ marginBottom: '16px' }}>
                                    <label style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#aaa', display: 'block', marginBottom: '6px', fontFamily: "'Lato',sans-serif" }}>Type <span style={{ color: '#A32D2D' }}>DELETE</span> to confirm</label>
                                    <input type="text" value={deactivateConfirmText} onChange={e => setDeactivateConfirmText(e.target.value.toUpperCase())} placeholder="Type DELETE here" maxLength={6}
                                        style={{ width: '100%', border: `1.5px solid ${deactivateConfirmText === 'DELETE' ? '#A32D2D' : '#e5e7eb'}`, padding: '12px', fontSize: '15px', fontFamily: 'monospace', letterSpacing: '0.3em', textAlign: 'center', background: deactivateConfirmText === 'DELETE' ? '#FCEBEB' : '#f9fafb', color: deactivateConfirmText === 'DELETE' ? '#A32D2D' : '#374151', outline: 'none', boxSizing: 'border-box' }} />
                                    {deactivateConfirmText.length > 0 && deactivateConfirmText !== 'DELETE' && <p style={{ fontSize: '10px', color: '#aaa', textAlign: 'center', marginTop: '4px', fontFamily: "'Lato',sans-serif" }}>{6 - deactivateConfirmText.length} character{6 - deactivateConfirmText.length !== 1 ? 's' : ''} remaining</p>}
                                </div>
                                {deactivateError && <div style={{ display: 'flex', gap: '8px', background: '#FCEBEB', border: '0.5px solid #F7C1C1', padding: '10px 12px', marginBottom: '12px' }}><AlertCircle size={13} style={{ color: '#A32D2D', flexShrink: 0 }} /><p style={{ fontSize: '11px', color: '#A32D2D', margin: 0, fontFamily: "'Lato',sans-serif" }}>{deactivateError}</p></div>}
                            </div>
                            <div style={{ padding: '10px 20px 32px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <button onClick={handleDeactivateAccount} disabled={deactivateConfirmText !== 'DELETE' || deactivating}
                                    style={{ width: '100%', padding: '14px', fontSize: '13px', fontWeight: 700, fontFamily: "'Lato',sans-serif", border: 'none', cursor: deactivateConfirmText === 'DELETE' && !deactivating ? 'pointer' : 'not-allowed', background: deactivateConfirmText === 'DELETE' && !deactivating ? '#A32D2D' : '#f3f4f6', color: deactivateConfirmText === 'DELETE' && !deactivating ? '#fff' : '#9ca3af', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                    {deactivating ? <><div style={{ width: '14px', height: '14px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />Deactivating…</> : 'Yes, deactivate my account'}
                                </button>
                                <button onClick={() => { setShowDeactivateModal(false); setDeactivateConfirmText(""); setDeactivateError(""); }} disabled={deactivating}
                                    style={{ width: '100%', padding: '12px', fontSize: '13px', fontWeight: 700, color: '#6b7280', background: 'transparent', border: '0.5px solid #e5e7eb', cursor: 'pointer', fontFamily: "'Lato',sans-serif" }}>
                                    Cancel, keep my account
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                <ExportStudentsModal isOpen={showExportModal} onClose={() => setShowExportModal(false)} sellerId={user?.uid} sellerBooks={sellerBooks} />
            </div>
        </>
    );
}