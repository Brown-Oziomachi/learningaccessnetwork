"use client";
import React, { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { auth, db } from "@/lib/firebaseConfig";
import { doc, getDoc } from "firebase/firestore";
import {
    CheckCircle, AlertCircle, X, GraduationCap,
    BookOpen, ChevronRight, ChevronDown, Globe,
    ArrowLeft, Search,
} from "lucide-react";
import Link from "next/link";
import Navbar from "@/components/NavBar";
import { usePayment } from "../hooks/usePayment";
import { fetchBookDetails, validateBookForPurchase, fetchSellerDetails } from "@/utils/bookUtils";
import { PaymentMethodSelector } from "@/components/PaymentMethodSelector";
import { PaymentForm } from "@/components/PaymentForm";
import { OrderSummary } from "@/components/OrderSummary";
import { useAds } from "@/lib/useAds";
import FeaturedAdsCarousel from "@/components/FeaturedAdsCarousel";

/* ─── Design tokens ─────────────────────────────────────────────── */
const NAVY = "#0d2244";
const GOLD = "#b8963e";
const GOLDD = "#d4aa5a";
const CREAM = "#f5f0e8";
const BG = "#f5f1ea";

/* ─── 30+ African countries → Flutterwave currency ─────────────── */
const AFRICAN_COUNTRIES = [
    // Individual currencies
    { code: "NG", name: "Nigeria", currency: "NGN", flag: "🇳🇬", symbol: "₦" },
    { code: "GH", name: "Ghana", currency: "GHS", flag: "🇬🇭", symbol: "GH₵" },
    { code: "KE", name: "Kenya", currency: "KES", flag: "🇰🇪", symbol: "KSh" },
    { code: "UG", name: "Uganda", currency: "UGX", flag: "🇺🇬", symbol: "USh" },
    { code: "TZ", name: "Tanzania", currency: "TZS", flag: "🇹🇿", symbol: "TSh" },
    { code: "RW", name: "Rwanda", currency: "RWF", flag: "🇷🇼", symbol: "RF" },
    { code: "ZM", name: "Zambia", currency: "ZMW", flag: "🇿🇲", symbol: "ZK" },
    { code: "MW", name: "Malawi", currency: "MWK", flag: "🇲🇼", symbol: "MK" },
    { code: "EG", name: "Egypt", currency: "EGP", flag: "🇪🇬", symbol: "E£" },
    { code: "MA", name: "Morocco", currency: "MAD", flag: "🇲🇦", symbol: "DH" },
    // ZAR zone
    { code: "ZA", name: "South Africa", currency: "ZAR", flag: "🇿🇦", symbol: "R" },
    { code: "LS", name: "Lesotho", currency: "ZAR", flag: "🇱🇸", symbol: "R" },
    { code: "NA", name: "Namibia", currency: "ZAR", flag: "🇳🇦", symbol: "R" },
    { code: "SZ", name: "Eswatini", currency: "ZAR", flag: "🇸🇿", symbol: "R" },
    // XOF zone (West African CFA)
    { code: "SN", name: "Senegal", currency: "XOF", flag: "🇸🇳", symbol: "CFA" },
    { code: "CI", name: "Ivory Coast", currency: "XOF", flag: "🇨🇮", symbol: "CFA" },
    { code: "ML", name: "Mali", currency: "XOF", flag: "🇲🇱", symbol: "CFA" },
    { code: "BJ", name: "Benin", currency: "XOF", flag: "🇧🇯", symbol: "CFA" },
    { code: "BF", name: "Burkina Faso", currency: "XOF", flag: "🇧🇫", symbol: "CFA" },
    { code: "NE", name: "Niger", currency: "XOF", flag: "🇳🇪", symbol: "CFA" },
    { code: "TG", name: "Togo", currency: "XOF", flag: "🇹🇬", symbol: "CFA" },
    { code: "GW", name: "Guinea-Bissau", currency: "XOF", flag: "🇬🇼", symbol: "CFA" },
    // XAF zone (Central African CFA)
    { code: "CM", name: "Cameroon", currency: "XAF", flag: "🇨🇲", symbol: "CFA" },
    { code: "GA", name: "Gabon", currency: "XAF", flag: "🇬🇦", symbol: "CFA" },
    { code: "TD", name: "Chad", currency: "XAF", flag: "🇹🇩", symbol: "CFA" },
    { code: "CG", name: "Republic of the Congo", currency: "XAF", flag: "🇨🇬", symbol: "CFA" },
    { code: "GQ", name: "Equatorial Guinea", currency: "XAF", flag: "🇬🇶", symbol: "CFA" },
    { code: "CF", name: "Central African Republic", currency: "XAF", flag: "🇨🇫", symbol: "CFA" },
];

/* ─── Fallback exchange matrix (NGN base) ───────────────────────── */
const FALLBACK_RATES = {
    NGN: 1, GHS: 0.010, KES: 0.11, UGX: 2.85,
    TZS: 2.62, RWF: 1.38, ZMW: 0.028, MWK: 1.77,
    EGP: 0.051, MAD: 0.105, ZAR: 0.019,
    XOF: 6.56, XAF: 6.56,
};

/* ─── GlobalStyles component (from Doc 2) ───────────────────────── */
const GlobalStyles = () => (
    <style dangerouslySetInnerHTML={{
        __html: `
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400&family=Lato:wght@300;400;700&display=swap');
        @keyframes spin { to { transform: rotate(360deg); } }
        .pay-root { font-family:'Lato',sans-serif; background:${BG}; min-height:100vh; }
        .section-card { background:#fff; border:0.5px solid #e5ddd0; padding:24px; margin-bottom:16px; }
        .warn-bar { background:rgba(234,179,8,0.08); border:0.5px solid rgba(234,179,8,0.3); padding:12px 16px; margin-bottom:16px; display:flex; align-items:center; gap:10px; }
        .country-list::-webkit-scrollbar { width:4px; }
        .country-list::-webkit-scrollbar-track { background:#f5f1ea; }
        .country-list::-webkit-scrollbar-thumb { background:rgba(184,150,62,0.3); border-radius:2px; }
        .pay-btn:hover { background:#0a1c38 !important; }
        .pay-grid { display:grid; grid-template-columns:1fr; gap:16px; }
        @media(min-width:1024px) { .pay-grid { grid-template-columns:1fr 320px; } }
    `}} />
);

/* ─── Helpers ────────────────────────────────────────────────────── */
const getThumbnailUrl = (book) => {
    if (!book) return "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400";
    if (book.driveFileId) return `https://drive.google.com/thumbnail?id=${book.driveFileId}&sz=w400`;
    if (book.embedUrl) {
        const m = book.embedUrl.match(/\/d\/(.*?)\/|\/file\/d\/(.*?)\/|id=(.*?)(&|$)/);
        if (m) { const id = m[1] || m[2] || m[3]; if (id) return `https://drive.google.com/thumbnail?id=${id}&sz=w400`; }
    }
    if (book.pdfUrl?.includes("drive.google.com")) {
        const m = book.pdfUrl.match(/[-\w]{25,}/);
        if (m) return `https://drive.google.com/thumbnail?id=${m[0]}&sz=w400`;
    }
    return book.image || book.coverImage || "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400";
};

const formatLocalPrice = (ngnPrice, currency, rates, symbol) => {
    const rate = rates[currency] ?? FALLBACK_RATES[currency] ?? 1;
    const local = ngnPrice * rate;
    const formatted = ["UGX", "RWF", "TZS", "XOF", "XAF", "MWK"].includes(currency)
        ? Math.round(local).toLocaleString()
        : local.toFixed(2).replace(/\.00$/, "");
    return `${symbol}${formatted}`;
};

/* ════════ Country Selector Dropdown ════════════════════════════════ */
function CountrySelector({ selected, onSelect }) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState("");
    const ref = useRef(null);

    useEffect(() => {
        const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    const filtered = AFRICAN_COUNTRIES.filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.currency.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div ref={ref} style={{ position: "relative", width: "100%" }}>
            {/* Trigger */}
            <button
                type="button"
                onClick={() => setOpen(o => !o)}
                style={{
                    width: "100%", display: "flex", alignItems: "center", gap: "10px",
                    padding: "12px 14px", border: `1.5px solid ${open ? GOLD : "#e5ddd0"}`,
                    background: open ? CREAM : "#fff", cursor: "pointer",
                    transition: "border-color 0.18s, background 0.18s",
                    fontFamily: "'Lato', sans-serif",
                }}
            >
                <Globe size={14} style={{ color: GOLD, flexShrink: 0 }} />
                <span style={{ fontSize: "22px", lineHeight: 1 }}>{selected.flag}</span>
                <div style={{ flex: 1, textAlign: "left", minWidth: 0 }}>
                    <p style={{ fontSize: "13px", fontWeight: 700, color: NAVY, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {selected.name}
                    </p>
                    <p style={{ fontSize: "10px", color: "#aaa", margin: 0 }}>{selected.currency}</p>
                </div>
                <ChevronDown size={14} style={{ color: "#aaa", flexShrink: 0, transform: open ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />
            </button>

            {/* Dropdown */}
            {open && (
                <div style={{
                    position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0,
                    background: "#fff", border: `1px solid #e5ddd0`,
                    boxShadow: "0 16px 40px rgba(13,34,68,0.14)", zIndex: 200,
                    maxHeight: "320px", display: "flex", flexDirection: "column",
                }}>
                    {/* Search */}
                    <div style={{ padding: "10px 12px", borderBottom: "0.5px solid #f0ebe0", display: "flex", alignItems: "center", gap: "8px" }}>
                        <Search size={13} style={{ color: "#bbb", flexShrink: 0 }} />
                        <input
                            autoFocus
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Search country or currency…"
                            style={{ border: "none", outline: "none", flex: 1, fontSize: "13px", fontFamily: "'Lato',sans-serif", color: NAVY, background: "transparent" }}
                        />
                    </div>
                    {/* List */}
                    <div style={{ overflowY: "auto", flex: 1 }}>
                        {filtered.length === 0 ? (
                            <p style={{ padding: "16px", fontSize: "12px", color: "#aaa", textAlign: "center", fontFamily: "'Lato',sans-serif" }}>No results</p>
                        ) : filtered.map(c => (
                            <button
                                key={c.code}
                                type="button"
                                onClick={() => { onSelect(c); setOpen(false); setSearch(""); }}
                                style={{
                                    width: "100%", display: "flex", alignItems: "center", gap: "10px",
                                    padding: "10px 14px", border: "none", cursor: "pointer",
                                    background: selected.code === c.code ? CREAM : "transparent",
                                    borderLeft: selected.code === c.code ? `3px solid ${GOLD}` : "3px solid transparent",
                                    transition: "background 0.12s", textAlign: "left",
                                }}
                                onMouseEnter={e => { if (selected.code !== c.code) e.currentTarget.style.background = "#fafaf8"; }}
                                onMouseLeave={e => { if (selected.code !== c.code) e.currentTarget.style.background = "transparent"; }}
                            >
                                <span style={{ fontSize: "18px", lineHeight: 1, flexShrink: 0 }}>{c.flag}</span>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <p style={{ fontSize: "12px", fontWeight: 700, color: NAVY, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.name}</p>
                                    <p style={{ fontSize: "10px", color: "#aaa", margin: 0 }}>{c.currency} · {c.symbol}</p>
                                </div>
                                {selected.code === c.code && <CheckCircle size={13} style={{ color: GOLD, flexShrink: 0 }} />}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

/* ════════ Live Price Badge ══════════════════════════════════════════ */
function LocalPriceBadge({ ngnPrice, selectedCountry, rates, ratesLoaded }) {
    const local = formatLocalPrice(ngnPrice, selectedCountry.currency, rates, selectedCountry.symbol);
    const isNGN = selectedCountry.currency === "NGN";

    return (
        <div style={{
            background: NAVY,
            backgroundImage: "radial-gradient(rgba(184,150,62,0.07) 1px,transparent 1px)",
            backgroundSize: "20px 20px",
            border: `0.5px solid rgba(184,150,62,0.25)`,
            padding: "16px 20px", marginBottom: "20px",
            display: "flex", alignItems: "center", justifyContent: "space-between",
            flexWrap: "wrap", gap: "10px",
        }}>
            <div>
                <p style={{ fontSize: "9px", fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(184,150,62,0.7)", margin: "0 0 4px", fontFamily: "'Lato',sans-serif" }}>
                    You will pay
                </p>
                <p style={{ fontFamily: "'Playfair Display',serif", fontSize: "28px", fontWeight: 900, color: "#fff", margin: 0, lineHeight: 1 }}>
                    {ratesLoaded ? local : "—"}
                </p>
                {!isNGN && (
                    <p style={{ fontSize: "10px", color: "rgba(255,255,255,0.4)", margin: "4px 0 0", fontFamily: "'Lato',sans-serif" }}>
                        = ₦{ngnPrice?.toLocaleString()} NGN
                    </p>
                )}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontSize: "22px" }}>{selectedCountry.flag}</span>
                <div>
                    <p style={{ fontSize: "11px", fontWeight: 700, color: GOLD, margin: 0, fontFamily: "'Lato',sans-serif" }}>{selectedCountry.currency}</p>
                    <p style={{ fontSize: "10px", color: "rgba(255,255,255,0.35)", margin: 0, fontFamily: "'Lato',sans-serif" }}>{selectedCountry.name}</p>
                </div>
            </div>
            {!ratesLoaded && (
                <div style={{ width: "100%", display: "flex", alignItems: "center", gap: "6px" }}>
                    <div style={{ width: "8px", height: "8px", border: "1.5px solid rgba(184,150,62,0.5)", borderTopColor: GOLD, borderRadius: "50%", animation: "spin 0.8s linear infinite", flexShrink: 0 }} />
                    <p style={{ fontSize: "10px", color: "rgba(255,255,255,0.3)", margin: 0, fontFamily: "'Lato',sans-serif" }}>Fetching live exchange rates…</p>
                </div>
            )}
        </div>
    );
}

/* ════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
════════════════════════════════════════════════════════════════════ */
export default function PaymentClient() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const rawBookId = searchParams.get("bookId");
    const bookId = rawBookId?.startsWith("firestore-") ? rawBookId : `firestore-${rawBookId}`;

    /* ── State ── */
    const [book, setBook] = useState(null);
    const [sellerDetails, setSellerDetails] = useState(null);
    const [loading, setLoading] = useState(true);
    const [pageError, setPageError] = useState(null);
    const [paymentMethod, setPaymentMethod] = useState("flutterwave");
    const [alreadyPurchased, setAlreadyPurchased] = useState(false);
    const [isLecturerSeller, setIsLecturerSeller] = useState(false);

    /* Country / currency */
    const [selectedCountry, setSelectedCountry] = useState(AFRICAN_COUNTRIES[0]); // Nigeria default
    const [rates, setRates] = useState(FALLBACK_RATES);
    const [ratesLoaded, setRatesLoaded] = useState(false);

    /* Lecturer modal */
    const [showStudentModal, setShowStudentModal] = useState(false);
    const [studentModalStep, setStudentModalStep] = useState("question");
    const [isClassStudent, setIsClassStudent] = useState(null);
    const [studentRegNo, setStudentRegNo] = useState("");
    const [studentDepartment, setStudentDepartment] = useState("");
    const [regNoError, setRegNoError] = useState("");
    const [departmentError, setDepartmentError] = useState("");
    const [pendingPaymentAction, setPendingPaymentAction] = useState(null);

    /* PIN modal */
    const [showPinModal, setShowPinModal] = useState(false);
    const [enteredPin, setEnteredPin] = useState("");
    const [pinView, setPinView] = useState("enter");
    const [setupPin, setSetupPin] = useState("");
    const [setupPinConfirm, setSetupPinConfirm] = useState("");
    const [otpInput, setOtpInput] = useState("");
    const [newResetPin, setNewResetPin] = useState("");
    const [pinLocalError, setPinLocalError] = useState("");
    const pendingRegNoRef = useRef(null);

    /* Ads */
    const goldAds = useAds("Gold", 3);
    const silverAds = useAds("Silver", 2);

    /* Form */
    const [formData, setFormData] = useState({
        email: auth.currentUser?.email || "",
        phone: "",
        name: "",
    });

    /* Payment hook */
    const {
        processing, paymentSuccess, setPaymentSuccess,
        error: paymentError, setError: setPaymentError,
        processFlutterwavePayment, processWalletPayment,
        setupInitialPin, requestPinReset, verifyOtpAndSetPin,
    } = usePayment(book, formData, sellerDetails);

    const pinNotSet = paymentError?.message?.includes("haven't set");

    /* ── Fetch live exchange rates ── */
    useEffect(() => {
        const fetchRates = async () => {
            try {
                const res = await fetch("https://open.er-api.com/v6/latest/NGN");
                if (!res.ok) throw new Error("rate fetch failed");
                const data = await res.json();
                if (data?.rates) {
                    setRates({
                        ...FALLBACK_RATES,  // safe defaults
                        ...data.rates,      // live rates overwrite
                        NGN: 1,             // pin base currency
                    });
                }
            } catch {
                console.warn("[Exchange] Using fallback rates");
            } finally {
                setRatesLoaded(true);
            }
        };
        fetchRates();
    }, []);

    /* ── Load book ── */
    useEffect(() => {
        const loadBook = async () => {
            if (!bookId) { setPageError("No book ID provided"); setLoading(false); return; }
            try {
                setLoading(true);
                const bookData = await fetchBookDetails(bookId);
                if (!bookData) { setPageError("Book not found"); setLoading(false); return; }
                const validation = validateBookForPurchase(bookData);
                if (!validation.valid) { setPageError(validation.error); setLoading(false); return; }
                setBook(bookData);

                const uid = auth.currentUser?.uid;
                if (uid) {
                    try {
                        const userSnap = await getDoc(doc(db, "users", uid));
                        const pb = userSnap.data()?.purchasedBooks || {};
                        const rawId = bookId.replace("firestore-", "");
                        if (pb[bookId] || pb[rawId]) { setAlreadyPurchased(true); setLoading(false); return; }
                    } catch { /* non-fatal */ }
                }

                const sellerInfo = await fetchSellerDetails(bookData);
                if (sellerInfo) {
                    setSellerDetails(sellerInfo);
                    try {
                        const sid = sellerInfo.id || bookData.sellerId || bookData.userId;
                        if (sid) {
                            const sSnap = await getDoc(doc(db, "sellers", sid));
                            if (sSnap.exists()) {
                                const raw = sSnap.data();
                                setIsLecturerSeller(raw?.title?.toLowerCase() === "lecturer");
                                setSellerDetails(prev => ({
                                    ...prev,
                                    title: raw.title,
                                    sellerName: raw.sellerName || prev?.sellerName,
                                    businessName: raw.businessInfo?.businessName || prev?.businessName,
                                }));
                            }
                        }
                    } catch { /* non-fatal */ }
                } else {
                    setPageError("Seller information unavailable");
                    setLoading(false);
                    return;
                }
            } catch (err) {
                setPageError("Failed to load book: " + err.message);
            } finally {
                setLoading(false);
            }
        };
        loadBook();
    }, [bookId]);

    /* ── Redirect on success ── */
    useEffect(() => {
        if (paymentSuccess) {
            setTimeout(() => router.push(`/book/preview?id=${bookId}&purchased=true`), 3000);
        }
    }, [paymentSuccess, bookId, router]);

    /* ── Handlers ── */
    const handleInputChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });

    const executePayment = (method) => {
        const extraData = { studentRegNo: studentRegNo || null, department: studentDepartment || null };
        if (method === "flutterwave") {
            processFlutterwavePayment(extraData, selectedCountry.currency);
        } else if (method === "wallet") {
            pendingRegNoRef.current = extraData;
            setEnteredPin(""); setPinLocalError(""); setPinView("enter"); setPaymentError(null);
            setShowPinModal(true);
        }
    };

    const handlePayment = (e) => {
        e.preventDefault();
        if (!formData.email || !formData.phone || !formData.name) {
            alert("Please fill in all required fields");
            return;
        }
        if (isLecturerSeller) {
            setPendingPaymentAction(paymentMethod);
            setStudentModalStep("question");
            setIsClassStudent(null);
            setStudentRegNo("");
            setStudentDepartment("");
            setRegNoError("");
            setDepartmentError("");
            setShowStudentModal(true);
            return;
        }
        executePayment(paymentMethod);
    };

    const handleStudentChoice = (choice) => {
        setIsClassStudent(choice);
        if (choice) { setStudentModalStep("regNo"); }
        else { setShowStudentModal(false); executePayment(pendingPaymentAction); }
    };

    // Doc 2 fix: validate both fields before early return, not sequentially
    const handleRegNoSubmit = () => {
        let isValid = true;
        if (!studentRegNo.trim()) { setRegNoError("Please enter your registration number."); isValid = false; } else { setRegNoError(""); }
        if (!studentDepartment.trim()) { setDepartmentError("Please enter your department."); isValid = false; } else { setDepartmentError(""); }
        if (!isValid) return;
        setShowStudentModal(false);
        executePayment(pendingPaymentAction);
    };

    const handlePinConfirm = () => {
        setPinLocalError("");
        if (!enteredPin || enteredPin.length < 4) { setPinLocalError("Please enter your 4-digit PIN."); return; }
        processWalletPayment(enteredPin, pendingRegNoRef.current);
        setShowPinModal(false);
        setEnteredPin("");
    };

    const handleSetupPin = async () => {
        setPinLocalError("");
        if (setupPin.length < 4) { setPinLocalError("PIN must be 4 digits."); return; }
        if (setupPin !== setupPinConfirm) { setPinLocalError("PINs do not match."); return; }
        const result = await setupInitialPin(setupPin);
        if (result.success) { setSetupPin(""); setSetupPinConfirm(""); setPinView("enter"); setPaymentError(null); }
    };

    const handleRequestOtp = async () => {
        setPinLocalError("");
        const result = await requestPinReset();
        if (result.success) setPinView("otp");
        else setPinLocalError("Failed to send code. Try again.");
    };

    const handleVerifyOtp = async () => {
        setPinLocalError("");
        if (otpInput.length < 6) { setPinLocalError("Enter the 6-digit code."); return; }
        if (newResetPin.length < 4) { setPinLocalError("New PIN must be 4 digits."); return; }
        try {
            await verifyOtpAndSetPin(otpInput, newResetPin);
            setOtpInput(""); setNewResetPin(""); setPinView("enter"); setPaymentError(null);
        } catch (err) { setPinLocalError(err.message); }
    };

    const lecturerName = sellerDetails?.name || book?.sellerName || "your Lecturer";

    /* ── Shared styles ── */
    const modalOverlay = { position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" };
    const modalBox = { background: "#fff", width: "100%", maxWidth: "420px", border: `0.5px solid rgba(184,150,62,0.3)`, overflow: "hidden" };
    const modalHeader = { background: NAVY, backgroundImage: "radial-gradient(rgba(184,150,62,0.06) 1px,transparent 1px)", backgroundSize: "24px 24px", padding: "20px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "0.5px solid rgba(184,150,62,0.2)" };
    const modalClose = { width: "32px", height: "32px", border: "0.5px solid rgba(255,255,255,0.2)", background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(255,255,255,0.6)" };
    const inputStyle = (err) => ({ width: "100%", padding: "12px 14px", border: `0.5px solid ${err ? "#ef4444" : "#e5ddd0"}`, background: CREAM, fontSize: "13px", color: NAVY, fontFamily: "'Lato',sans-serif", outline: "none", boxSizing: "border-box", marginBottom: "4px" });
    const navyBtn = { width: "100%", background: NAVY, color: "#fff", padding: "14px", border: "none", fontSize: "12px", fontWeight: 700, cursor: "pointer", fontFamily: "'Lato',sans-serif", letterSpacing: "0.06em", transition: "background 0.18s" };
    const goldBtn = { width: "100%", background: GOLD, color: NAVY, padding: "14px", border: "none", fontSize: "12px", fontWeight: 700, cursor: "pointer", fontFamily: "'Lato',sans-serif", letterSpacing: "0.06em" };

    /* ══ LOADING ══ */
    if (loading) return (
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: BG }}>
            <GlobalStyles />
            <div style={{ textAlign: "center" }}>
                <div style={{ width: "48px", height: "48px", border: `3px solid ${GOLD}`, borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 14px" }} />
                <p style={{ fontFamily: "'Playfair Display',serif", fontSize: "16px", color: NAVY }}>Loading book details…</p>
            </div>
        </div>
    );

    /* ══ ALREADY PURCHASED ══ */
    if (alreadyPurchased && book) return (
        <>
            <GlobalStyles />
            <div style={{ minHeight: "100vh", background: BG, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px", fontFamily: "'Lato',sans-serif" }}>
                <div style={{ background: "#fff", border: "0.5px solid #e5ddd0", padding: "40px 32px", maxWidth: "420px", width: "100%", textAlign: "center" }}>
                    <div style={{ width: "64px", height: "64px", border: `0.5px solid rgba(184,150,62,0.3)`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px", background: CREAM }}>
                        <CheckCircle size={28} style={{ color: "#16a34a" }} />
                    </div>
                    <p style={{ fontSize: "9px", fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: GOLD, margin: "0 0 6px" }}>Already Purchased</p>
                    <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: "22px", fontWeight: 700, color: NAVY, margin: "0 0 10px" }}>You already own this!</h2>
                    <p style={{ fontSize: "13px", color: "#666", lineHeight: 1.7, margin: "0 0 20px" }}>
                        You've already purchased <strong style={{ color: NAVY }}>{book.title}</strong>.
                    </p>
                    <img
                        src={getThumbnailUrl(book)}
                        alt={book.title}
                        style={{ width: "80px", aspectRatio: "3/4", objectFit: "cover", margin: "0 auto 24px", display: "block", border: "0.5px solid #e5ddd0" }}
                    />
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                        <Link href={`/book/preview?id=${bookId}&purchased=true`} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", background: NAVY, color: "#fff", padding: "13px", fontSize: "12px", fontWeight: 700, textDecoration: "none", letterSpacing: "0.06em" }}>
                            <BookOpen size={14} /> READ BOOK NOW
                        </Link>
                        <Link href="/my-books" style={{ display: "block", padding: "13px", border: "0.5px solid #e5ddd0", color: NAVY, fontSize: "12px", fontWeight: 700, textDecoration: "none", letterSpacing: "0.06em", textAlign: "center" }}>
                            GO TO MY LIBRARY
                        </Link>
                        <button onClick={() => router.back()} style={{ background: "transparent", border: "none", cursor: "pointer", color: "#aaa", fontSize: "12px", padding: "8px" }}>
                            ← Go Back
                        </button>
                    </div>
                </div>
            </div>
        </>
    );

    /* ══ ERROR ══ */
    if (pageError || !book) return (
        <>
            <GlobalStyles />
            <div style={{ minHeight: "100vh", background: BG, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}>
                <div style={{ background: "#fff", border: "0.5px solid #e5ddd0", padding: "48px 32px", maxWidth: "400px", width: "100%", textAlign: "center" }}>
                    <AlertCircle size={32} style={{ color: "#ef4444", margin: "0 auto 16px" }} />
                    <p style={{ fontFamily: "'Playfair Display',serif", fontSize: "20px", fontWeight: 700, color: NAVY, margin: "0 0 8px" }}>Book Not Found</p>
                    <p style={{ fontSize: "13px", color: "#666", margin: "0 0 24px" }}>{pageError || "The book doesn't exist."}</p>
                    <button onClick={() => window.history.back()} style={{ ...navyBtn, width: "auto", padding: "12px 28px" }}>GO BACK</button>
                </div>
            </div>
        </>
    );

    /* ══ SUCCESS ══ */
    // Doc 1 version preserved: includes full receipt rows + redirect CTA link
    if (paymentSuccess) return (
        <>
            <GlobalStyles />
            <div style={{ minHeight: "100vh", background: BG, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}>
                <div style={{ background: "#fff", border: "0.5px solid #e5ddd0", padding: "40px 32px", maxWidth: "420px", width: "100%", textAlign: "center" }}>
                    <div style={{ width: "64px", height: "64px", border: "0.5px solid #86efac", background: "#f0fdf4", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
                        <CheckCircle size={28} style={{ color: "#16a34a" }} />
                    </div>
                    <p style={{ fontSize: "9px", fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: GOLD, margin: "0 0 6px" }}>Payment Confirmed</p>
                    <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: "22px", fontWeight: 700, color: NAVY, margin: "0 0 20px" }}>Payment Successful!</h2>
                    <div style={{ background: CREAM, border: "0.5px solid rgba(184,150,62,0.2)", padding: "16px", marginBottom: "20px", textAlign: "left" }}>
                        {[
                            ["Email", formData.email],
                            ["Book", book.title],
                            ["Paid", formatLocalPrice(book.price, selectedCountry.currency, rates, selectedCountry.symbol)],
                            ["Currency", `${selectedCountry.flag} ${selectedCountry.currency}`],
                            sellerDetails ? ["Seller", sellerDetails.name] : null,
                        ].filter(Boolean).map(([k, v]) => (
                            <div key={k} style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", padding: "5px 0", borderBottom: "0.5px solid rgba(184,150,62,0.15)" }}>
                                <span style={{ color: "#aaa" }}>{k}</span>
                                <span style={{ fontWeight: 700, color: NAVY, maxWidth: "200px", textAlign: "right", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{v}</span>
                            </div>
                        ))}
                    </div>
                    <p style={{ fontSize: "12px", color: "#aaa", marginBottom: "16px" }}>Redirecting to book preview…</p>
                    <Link href={`/book/preview?id=${bookId}&purchased=true`} style={{ display: "block", background: NAVY, color: "#fff", padding: "13px", fontSize: "12px", fontWeight: 700, textDecoration: "none", letterSpacing: "0.06em", textAlign: "center" }}>
                        VIEW YOUR BOOK
                    </Link>
                </div>
            </div>
        </>
    );

    /* ══════════════════════════════════════════════════════════════════
       MAIN CHECKOUT PAGE
    ══════════════════════════════════════════════════════════════════ */
    return (
        <>
            <GlobalStyles />
            <div className="pay-root">
                <Navbar />

                <main style={{ maxWidth: "1100px", margin: "0 auto", padding: "24px 16px" }}>

                    {/* Page header */}
                    <div style={{ marginBottom: "24px", display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
                        <button
                            onClick={() => router.back()}
                            style={{ background: "transparent", border: "0.5px solid #e5ddd0", cursor: "pointer", width: "34px", height: "34px", display: "flex", alignItems: "center", justifyContent: "center", color: NAVY, flexShrink: 0 }}
                        >
                            <ArrowLeft size={14} />
                        </button>
                        <div>
                            <p style={{ fontSize: "9px", fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: GOLD, margin: "0 0 2px" }}>Secure Checkout</p>
                            <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: "24px", fontWeight: 700, color: NAVY, margin: 0 }}>Complete Your Purchase</h1>
                        </div>
                    </div>

                    {!sellerDetails && (
                        <div className="warn-bar">
                            <AlertCircle size={16} style={{ color: "#ca8a04", flexShrink: 0 }} />
                            <p style={{ fontSize: "12px", color: "#713f12", fontWeight: 700, margin: 0 }}>Warning: Seller information is missing.</p>
                        </div>
                    )}

                    {/* Book hero */}
                    <div className="section-card" style={{ padding: "20px" }}>
                        <div style={{ display: "flex", gap: "20px", alignItems: "flex-start" }}>
                            <div style={{ position: "relative", flexShrink: 0 }}>
                                <img
                                    src={getThumbnailUrl(book)}
                                    alt={"Cover of " + book.title}
                                    style={{ width: "90px", aspectRatio: "3/4", objectFit: "cover", display: "block", border: "0.5px solid #e5ddd0" }}
                                    onError={e => { e.target.src = "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400"; }}
                                    loading="lazy"
                                />
                                <span style={{ position: "absolute", top: "5px", left: "5px", background: NAVY, color: GOLD, fontSize: "7px", fontWeight: 700, padding: "2px 5px" }}>PDF</span>
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <p style={{ fontSize: "9px", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: GOLD, margin: "0 0 4px" }}>{book.category || "Document"}</p>
                                <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: "17px", fontWeight: 700, color: NAVY, margin: "0 0 4px", lineHeight: 1.3 }}>{book.title}</h2>
                                <p style={{ fontSize: "12px", color: "#888", margin: "0 0 10px" }}>by {book.author}</p>
                                <p style={{ fontSize: "20px", fontWeight: 700, color: NAVY, fontFamily: "'Playfair Display',serif", margin: 0 }}>₦{book.price?.toLocaleString()}</p>
                            </div>
                        </div>
                        {book.description && (
                            <div style={{ marginTop: "14px", background: CREAM, border: "0.5px solid rgba(184,150,62,0.15)", padding: "12px 14px" }}>
                                <p style={{ fontSize: "10px", fontWeight: 700, color: GOLD, letterSpacing: "0.12em", textTransform: "uppercase", margin: "0 0 4px" }}>Description</p>
                                <p style={{ fontSize: "12px", color: "#666", lineHeight: 1.65, margin: 0, WebkitLineClamp: 5, WebkitBoxOrient: "vertical" }}>{book.description}</p>
                            </div>
                        )}
                    </div>

                    {/* Main grid */}
                    <div className="pay-grid">

                        {/* ── LEFT: payment form ── */}
                        <div>
                            <div className="section-card">
                                <p style={{ fontSize: "9px", fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: GOLD, margin: "0 0 4px" }}>Step 1 of 2</p>
                                <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: "18px", fontWeight: 700, color: NAVY, margin: "0 0 20px" }}>Your Country & Currency</h3>

                                {/* Country selector */}
                                <div style={{ marginBottom: "20px" }}>
                                    <label style={{ display: "block", fontSize: "10px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#aaa", marginBottom: "8px", fontFamily: "'Lato',sans-serif" }}>
                                        Select your country
                                    </label>
                                    <CountrySelector selected={selectedCountry} onSelect={setSelectedCountry} />
                                </div>

                                {/* Live price badge */}
                                <LocalPriceBadge
                                    ngnPrice={book.price}
                                    selectedCountry={selectedCountry}
                                    rates={rates}
                                    ratesLoaded={ratesLoaded}
                                />

                                {/* Rate note */}
                                {selectedCountry.currency !== "NGN" && ratesLoaded && (
                                    <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "rgba(184,150,62,0.06)", border: "0.5px solid rgba(184,150,62,0.2)", padding: "10px 14px", marginBottom: "20px" }}>
                                        <Globe size={12} style={{ color: GOLD, flexShrink: 0 }} />
                                        <p style={{ fontSize: "11px", color: "#888", margin: 0, fontFamily: "'Lato',sans-serif" }}>
                                            Live rate: <strong style={{ color: NAVY }}>1 NGN = {(rates[selectedCountry.currency] ?? 1).toFixed(4)} {selectedCountry.currency}</strong>
                                            {" "}· Powered by open.er-api.com
                                        </p>
                                    </div>
                                )}

                                <div style={{ borderTop: "0.5px solid #f0ebe0", paddingTop: "20px", marginBottom: "20px" }}>
                                    <p style={{ fontSize: "9px", fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: GOLD, margin: "0 0 4px" }}>Step 2 of 2</p>
                                    <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: "18px", fontWeight: 700, color: NAVY, margin: "0 0 16px" }}>Payment Details</h3>
                                    <PaymentMethodSelector paymentMethod={paymentMethod} setPaymentMethod={setPaymentMethod} />
                                    <PaymentForm
                                        formData={formData}
                                        handleInputChange={handleInputChange}
                                        processing={processing}
                                        onSubmit={handlePayment}
                                        paymentMethod={paymentMethod}
                                        book={book}
                                        paymentError={paymentError}
                                    />
                                </div>

                                {/* Big pay button */}
                                <button
                                    onClick={handlePayment}
                                    disabled={processing || !ratesLoaded}
                                    className="pay-btn"
                                    style={{
                                        width: "100%", background: NAVY, color: "#fff",
                                        border: "none", padding: "16px 24px",
                                        cursor: processing ? "not-allowed" : "pointer",
                                        opacity: processing || !ratesLoaded ? 0.6 : 1,
                                        display: "flex", alignItems: "center", justifyContent: "center", gap: "10px",
                                        fontFamily: "'Lato',sans-serif", fontSize: "13px", fontWeight: 700, letterSpacing: "0.08em",
                                        transition: "background 0.18s",
                                    }}
                                >
                                    {processing ? (
                                        <>
                                            <div style={{ width: "14px", height: "14px", border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
                                            PROCESSING…
                                        </>
                                    ) : (
                                        <>
                                            <span style={{ fontSize: "16px" }}>{selectedCountry.flag}</span>
                                            PAY {ratesLoaded ? formatLocalPrice(book.price, selectedCountry.currency, rates, selectedCountry.symbol) : "…"}
                                            <span style={{ fontSize: "10px", opacity: 0.6 }}>({selectedCountry.currency})</span>
                                        </>
                                    )}
                                </button>

                                {/* Referral strip */}
                                <div style={{ marginTop: "14px", background: CREAM, border: "0.5px solid rgba(184,150,62,0.2)", padding: "10px 14px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                    <p style={{ fontSize: "11px", color: NAVY, fontWeight: 700, margin: 0 }}>Invite friends & earn ₦500</p>
                                    <Link href="/referral" style={{ fontSize: "10px", fontWeight: 700, color: GOLD, textDecoration: "none" }}>Get link →</Link>
                                </div>
                            </div>
                        </div>

                        {/* ── RIGHT: order summary ── */}
                        <div>
                            {/* Currency summary card */}
                            <div style={{ background: "#fff", border: "0.5px solid #e5ddd0", padding: "16px", marginBottom: "16px" }}>
                                <p style={{ fontSize: "9px", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: GOLD, margin: "0 0 12px", fontFamily: "'Lato',sans-serif" }}>Payment Summary</p>
                                {[
                                    ["Book price (NGN)", `₦${book.price?.toLocaleString()}`],
                                    ["Your currency", `${selectedCountry.flag} ${selectedCountry.currency}`],
                                    ["You pay", ratesLoaded ? formatLocalPrice(book.price, selectedCountry.currency, rates, selectedCountry.symbol) : "—"],
                                ].map(([k, v]) => (
                                    <div key={k} style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", padding: "7px 0", borderBottom: "0.5px solid #f0ebe0" }}>
                                        <span style={{ color: "#aaa", fontFamily: "'Lato',sans-serif" }}>{k}</span>
                                        <span style={{ fontWeight: 700, color: NAVY, fontFamily: "'Lato',sans-serif" }}>{v}</span>
                                    </div>
                                ))}
                                <div style={{ marginTop: "12px", background: CREAM, padding: "10px 12px", border: "0.5px solid rgba(184,150,62,0.2)" }}>
                                    <p style={{ fontSize: "10px", color: "#888", margin: 0, lineHeight: 1.6, fontFamily: "'Lato',sans-serif" }}>
                                        🔒 Payments processed securely via Flutterwave. Your local currency is charged at live market rates.
                                    </p>
                                </div>
                            </div>
                            <OrderSummary book={book} sellerDetails={sellerDetails} />
                        </div>
                    </div>

                    {/* Featured ads */}
                    <div style={{ marginTop: "40px" }}>
                        <FeaturedAdsCarousel goldAds={goldAds} silverAds={silverAds} tier="Gold" maxAds={2} autoPlay={true} autoPlayMs={4500} style={{ marginBottom: "20px" }} />
                    </div>

                </main>

                {/* ══════════ STUDENT IDENTITY MODAL ══════════════════════════ */}
                {showStudentModal && (
                    <div style={modalOverlay}>
                        <div style={modalBox}>
                            <div style={modalHeader}>
                                <div>
                                    <p style={{ fontSize: "9px", color: GOLD, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", margin: "0 0 3px", fontFamily: "'Lato',sans-serif" }}>Almost there</p>
                                    <p style={{ fontFamily: "'Playfair Display',serif", fontSize: "17px", fontWeight: 700, color: "#fff", margin: 0 }}>One quick question</p>
                                </div>
                                <button
                                    style={modalClose}
                                    onClick={() => { setShowStudentModal(false); setIsClassStudent(null); setStudentRegNo(""); setStudentDepartment(""); setRegNoError(""); setDepartmentError(""); }}
                                >
                                    <X size={16} />
                                </button>
                            </div>
                            <div style={{ padding: "24px" }}>
                                {studentModalStep === "question" && (
                                    <>
                                        <div style={{ display: "flex", alignItems: "center", gap: "12px", background: CREAM, border: "0.5px solid rgba(184,150,62,0.2)", padding: "12px 14px", marginBottom: "16px" }}>
                                            <div style={{ width: "36px", height: "36px", background: NAVY, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                                <GraduationCap size={16} style={{ color: GOLD }} />
                                            </div>
                                            <div>
                                                <p style={{ fontSize: "9px", color: GOLD, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", margin: "0 0 2px", fontFamily: "'Lato',sans-serif" }}>Uploaded by</p>
                                                <p style={{ fontSize: "13px", fontWeight: 700, color: NAVY, margin: 0 }}>{lecturerName}</p>
                                            </div>
                                        </div>
                                        <p style={{ fontSize: "13px", color: "#555", lineHeight: 1.65, marginBottom: "16px" }}>
                                            Are you a student of <strong style={{ color: NAVY }}>{lecturerName}</strong>?
                                        </p>
                                        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                                            {[
                                                { choice: true, title: "Yes, I'm in this lecturer's class", sub: "Reg No required for class records" },
                                                { choice: false, title: "No, I'm buying for personal study", sub: "Reg No not required" },
                                            ].map(({ choice, title, sub }) => (
                                                <button
                                                    key={String(choice)}
                                                    onClick={() => handleStudentChoice(choice)}
                                                    style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px", border: `1.5px solid ${choice ? NAVY : "#e5ddd0"}`, background: "#fff", cursor: "pointer", transition: "background 0.15s", fontFamily: "'Lato',sans-serif" }}
                                                    onMouseEnter={e => e.currentTarget.style.background = CREAM}
                                                    onMouseLeave={e => e.currentTarget.style.background = "#fff"}
                                                >
                                                    <div style={{ textAlign: "left" }}>
                                                        <p style={{ fontSize: "13px", fontWeight: 700, color: choice ? NAVY : "#555", margin: "0 0 2px" }}>{title}</p>
                                                        <p style={{ fontSize: "11px", color: "#aaa", margin: 0 }}>{sub}</p>
                                                    </div>
                                                    <ChevronRight size={16} style={{ color: choice ? NAVY : "#ccc", flexShrink: 0 }} />
                                                </button>
                                            ))}
                                        </div>
                                    </>
                                )}
                                {studentModalStep === "regNo" && (
                                    <>
                                        <p style={{ fontSize: "13px", fontWeight: 700, color: NAVY, margin: "0 0 4px" }}>Enter your details</p>
                                        <p style={{ fontSize: "12px", color: "#aaa", marginBottom: "16px", lineHeight: 1.6 }}>
                                            Your details will be recorded for <strong style={{ color: "#666" }}>{lecturerName}</strong>.
                                        </p>
                                        <input
                                            type="text"
                                            value={studentRegNo}
                                            onChange={e => { setStudentRegNo(e.target.value); if (regNoError) setRegNoError(""); }}
                                            style={inputStyle(!!regNoError)}
                                            placeholder="Registration number e.g. 2021/123456"
                                            autoFocus
                                        />
                                        {regNoError && <p style={{ fontSize: "11px", color: "#ef4444", margin: "0 0 8px" }}>{regNoError}</p>}
                                        <input
                                            type="text"
                                            value={studentDepartment}
                                            onChange={e => { setStudentDepartment(e.target.value); if (departmentError) setDepartmentError(""); }}
                                            style={{ ...inputStyle(!!departmentError), marginTop: "8px" }}
                                            placeholder="Department e.g. Computer Science"
                                        />
                                        {departmentError && <p style={{ fontSize: "11px", color: "#ef4444", margin: "0 0 8px" }}>{departmentError}</p>}
                                        <div style={{ marginTop: "16px", display: "flex", flexDirection: "column", gap: "8px" }}>
                                            <button onClick={handleRegNoSubmit} style={navyBtn}>CONFIRM & PROCEED TO PAYMENT</button>
                                            <button
                                                onClick={() => { setStudentModalStep("question"); setRegNoError(""); setDepartmentError(""); }}
                                                style={{ background: "transparent", border: "none", cursor: "pointer", color: "#aaa", fontSize: "11px", padding: "6px" }}
                                            >
                                                ← Back
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* ══════════ PIN MODAL ════════════════════════════════════════ */}
                {showPinModal && (
                    <div style={modalOverlay}>
                        <div style={modalBox}>
                            <div style={modalHeader}>
                                <div>
                                    <p style={{ fontSize: "9px", color: GOLD, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", margin: "0 0 3px", fontFamily: "'Lato',sans-serif" }}>Confirm payment</p>
                                    <p style={{ fontFamily: "'Playfair Display',serif", fontSize: "17px", fontWeight: 700, color: "#fff", margin: 0 }}>
                                        {pinView === "setup" ? "Create Your PIN" : pinView === "forgot" ? "Reset PIN" : pinView === "otp" ? "Enter Reset Code" : "Enter Your PIN"}
                                    </p>
                                </div>
                                <button
                                    style={modalClose}
                                    onClick={() => { setShowPinModal(false); setEnteredPin(""); setPinLocalError(""); setPinView("enter"); }}
                                >
                                    <X size={16} />
                                </button>
                            </div>
                            <div style={{ padding: "24px" }}>
                                {(pinLocalError || paymentError) && (
                                    <div style={{ display: "flex", alignItems: "center", gap: "10px", background: "#fff1f2", border: "0.5px solid #fca5a5", padding: "10px 14px", marginBottom: "16px" }}>
                                        <AlertCircle size={14} style={{ color: "#ef4444", flexShrink: 0 }} />
                                        <p style={{ fontSize: "12px", color: "#dc2626", margin: 0 }}>{pinLocalError || paymentError?.message}</p>
                                    </div>
                                )}

                                {pinView === "enter" && (
                                    <>
                                        <p style={{ fontSize: "12px", color: "#888", textAlign: "center", marginBottom: "4px" }}>
                                            Authorise payment of <strong style={{ color: NAVY }}>{formatLocalPrice(book.price, selectedCountry.currency, rates, selectedCountry.symbol)}</strong>
                                        </p>
                                        <p style={{ fontSize: "11px", color: "#bbb", textAlign: "center", marginBottom: "20px" }}>for <em>{book.title}</em></p>

                                        {/* Visual PIN dots */}
                                        <div style={{ display: "flex", justifyContent: "center", gap: "10px", marginBottom: "16px" }}>
                                            {Array.from({ length: 4 }, (_, i) => i < enteredPin.length).map((filled, i) => (
                                                <div key={i} style={{ width: "52px", height: "54px", border: `1.5px solid ${filled ? NAVY : "#e5ddd0"}`, background: filled ? CREAM : "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "22px", color: filled ? NAVY : "#e5ddd0", transition: "all 0.15s" }}>
                                                    {filled ? "●" : "○"}
                                                </div>
                                            ))}
                                        </div>

                                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "16px" }}>
                                            <button onClick={() => { setPinView("forgot"); setPinLocalError(""); }} style={{ background: "transparent", border: "none", cursor: "pointer", color: GOLD, fontSize: "11px", fontWeight: 700 }}>Forgot PIN?</button>
                                            {pinNotSet && (
                                                <button onClick={() => { setPinView("setup"); setPinLocalError(""); }} style={{ background: "transparent", border: "none", cursor: "pointer", color: "#16a34a", fontSize: "11px", fontWeight: 700 }}>Setup PIN Now</button>
                                            )}
                                        </div>

                                        {/* Numpad */}
                                        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "6px", marginBottom: "6px" }}>
                                            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => (
                                                <button
                                                    key={n}
                                                    onClick={() => { if (enteredPin.length < 4) { setEnteredPin(p => p + String(n)); setPinLocalError(""); setPaymentError(null); } }}
                                                    disabled={enteredPin.length >= 4}
                                                    style={{ height: "50px", border: "0.5px solid #e5ddd0", background: "#fff", fontSize: "18px", fontWeight: 700, color: NAVY, cursor: "pointer", fontFamily: "'Lato',sans-serif" }}
                                                >
                                                    {n}
                                                </button>
                                            ))}
                                        </div>
                                        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "6px", marginBottom: "16px" }}>
                                            <div />
                                            <button
                                                onClick={() => { if (enteredPin.length < 4) { setEnteredPin(p => p + "0"); setPinLocalError(""); setPaymentError(null); } }}
                                                disabled={enteredPin.length >= 4}
                                                style={{ height: "50px", border: "0.5px solid #e5ddd0", background: "#fff", fontSize: "18px", fontWeight: 700, color: NAVY, cursor: "pointer" }}
                                            >
                                                0
                                            </button>
                                            <button
                                                onClick={() => setEnteredPin(p => p.slice(0, -1))}
                                                style={{ height: "50px", border: "0.5px solid #e5ddd0", background: "#fff", fontSize: "18px", color: "#aaa", cursor: "pointer" }}
                                            >
                                                ⌫
                                            </button>
                                        </div>

                                        <button
                                            onClick={handlePinConfirm}
                                            disabled={enteredPin.length < 4 || processing}
                                            style={{ ...navyBtn, opacity: enteredPin.length < 4 || processing ? 0.4 : 1 }}
                                        >
                                            {processing ? "VERIFYING…" : "CONFIRM PAYMENT"}
                                        </button>
                                    </>
                                )}

                                {pinView === "setup" && (
                                    <>
                                        <p style={{ fontSize: "12px", color: "#888", textAlign: "center", marginBottom: "16px" }}>Create a 4-digit wallet PIN</p>
                                        <input type="password" value={setupPin} onChange={e => setSetupPin(e.target.value.replace(/\D/g, "").slice(0, 4))} style={{ ...inputStyle(false), textAlign: "center", fontSize: "22px", letterSpacing: "8px" }} placeholder="New PIN" maxLength={4} inputMode="numeric" />
                                        <input type="password" value={setupPinConfirm} onChange={e => setSetupPinConfirm(e.target.value.replace(/\D/g, "").slice(0, 4))} style={{ ...inputStyle(false), textAlign: "center", fontSize: "22px", letterSpacing: "8px", marginTop: "8px" }} placeholder="Confirm PIN" maxLength={4} inputMode="numeric" />
                                        <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "16px" }}>
                                            <button onClick={handleSetupPin} disabled={processing || setupPin.length < 4 || setupPinConfirm.length < 4} style={{ ...goldBtn, opacity: processing || setupPin.length < 4 || setupPinConfirm.length < 4 ? 0.4 : 1 }}>
                                                {processing ? "SAVING…" : "SET PIN & CONTINUE"}
                                            </button>
                                            <button onClick={() => { setPinView("enter"); setPinLocalError(""); }} style={{ background: "transparent", border: "none", cursor: "pointer", color: "#aaa", fontSize: "11px", padding: "6px" }}>Back</button>
                                        </div>
                                    </>
                                )}

                                {pinView === "forgot" && (
                                    <>
                                        <p style={{ fontSize: "12px", color: "#888", textAlign: "center", marginBottom: "20px" }}>We'll send a 6-digit reset code to verify your identity.</p>
                                        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                                            <button onClick={handleRequestOtp} disabled={processing} style={{ ...navyBtn, opacity: processing ? 0.5 : 1 }}>
                                                {processing ? "SENDING…" : "SEND RESET CODE"}
                                            </button>
                                            <button onClick={() => { setPinView("enter"); setPinLocalError(""); }} style={{ background: "transparent", border: "none", cursor: "pointer", color: "#aaa", fontSize: "11px", padding: "6px" }}>Back</button>
                                        </div>
                                    </>
                                )}

                                {pinView === "otp" && (
                                    <>
                                        <p style={{ fontSize: "12px", color: "#888", textAlign: "center", marginBottom: "16px" }}>Enter the 6-digit code and your new PIN</p>
                                        <input type="text" value={otpInput} onChange={e => setOtpInput(e.target.value.replace(/\D/g, "").slice(0, 6))} style={{ ...inputStyle(false), textAlign: "center", fontSize: "18px", letterSpacing: "6px" }} placeholder="6-digit code" maxLength={6} inputMode="numeric" />
                                        <input type="password" value={newResetPin} onChange={e => setNewResetPin(e.target.value.replace(/\D/g, "").slice(0, 4))} style={{ ...inputStyle(false), textAlign: "center", fontSize: "22px", letterSpacing: "8px", marginTop: "8px" }} placeholder="New 4-digit PIN" maxLength={4} inputMode="numeric" />
                                        <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "16px" }}>
                                            <button onClick={handleVerifyOtp} disabled={processing || otpInput.length < 6 || newResetPin.length < 4} style={{ ...navyBtn, opacity: processing || otpInput.length < 6 || newResetPin.length < 4 ? 0.4 : 1 }}>
                                                {processing ? "VERIFYING…" : "RESET PIN & CONTINUE"}
                                            </button>
                                            <button onClick={() => { setPinView("forgot"); setPinLocalError(""); }} style={{ background: "transparent", border: "none", cursor: "pointer", color: "#aaa", fontSize: "11px", padding: "6px" }}>Back</button>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}