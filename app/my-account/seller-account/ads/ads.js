"use client";
import { useState, useEffect } from "react";
import {
    collection, getDocs, addDoc, query,
    where, serverTimestamp, doc, getDoc,
    updateDoc, increment, runTransaction,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "@/lib/firebaseConfig";
import {
    Zap, Star, Award, BookOpen, CheckCircle,
    X, AlertCircle, Lock, CreditCard, Wallet,
} from "lucide-react";
import { initializeFlutterwave } from "@/lib/flutterwaveService";

/* ─── tokens (matches your existing platform theme) ──────── */
const NAVY = "#0d2244";
const GOLD = "#b8963e";
const GOLDD = "#d4aa5a";
const CREAM = "#f5f0e8";
const BG = "#f5f1ea";

/* ─── tier config ─────────────────────────────────────────── */
const TIERS = {
    Bronze: {
        dailyRate: 500,
        color: "#cd7f32",
        bg: "rgba(205,127,50,0.10)",
        border: "rgba(205,127,50,0.35)",
        Icon: Award,
        perks: ["Sidebar placement", "Category pages", "Basic click stats"],
    },
    Silver: {
        dailyRate: 1000,
        color: "#94a3b8",
        bg: "rgba(148,163,184,0.10)",
        border: "rgba(148,163,184,0.35)",
        Icon: Star,
        perks: ["Homepage sidebar", "Category + Search pages", "Click & impression stats"],
    },
    Gold: {
        dailyRate: 2000,
        color: GOLD,
        bg: "rgba(184,150,62,0.10)",
        border: "rgba(184,150,62,0.35)",
        Icon: Zap,
        perks: ["Hero carousel on Homepage", "All pages — max exposure", "Priority placement + full analytics"],
    },
};

const DURATIONS = [7, 14, 30, 60, 90];

/* ══════════════════════════════════════════════════════════ */
export default function SellerAdCreatorClient() {
    /* ── auth + books ─────────────────────────────────────── */
    const [user, setUser] = useState(null);
    const [books, setBooks] = useState([]);
    const [loadingBooks, setLoadingBooks] = useState(true);

    /* ── ad form ──────────────────────────────────────────── */
    const [selectedBook, setSelectedBook] = useState(null);
    const [selectedTier, setSelectedTier] = useState("Gold");
    const [selectedDays, setSelectedDays] = useState(30);
    const [bannerUrl, setBannerUrl] = useState("");
    const [headline, setHeadline] = useState("");
    const [ctaText, setCtaText] = useState("Get Your Copy");

    /* ── payment modal ────────────────────────────────────── */
    const [showPayModal, setShowPayModal] = useState(false);
    const [payMethod, setPayMethod] = useState("flutterwave"); // "flutterwave" | "wallet"
    const [buyerName, setBuyerName] = useState("");
    const [buyerEmail, setBuyerEmail] = useState("");
    const [buyerPhone, setBuyerPhone] = useState("");

    /* ── pin sub-flow ─────────────────────────────────────── */
    const [pinView, setPinView] = useState("enter"); // enter | setup | forgot | otp
    const [enteredPin, setEnteredPin] = useState("");
    const [setupPin, setSetupPin] = useState("");
    const [setupPinConf, setSetupPinConf] = useState("");
    const [otpInput, setOtpInput] = useState("");
    const [newResetPin, setNewResetPin] = useState("");
    const [pinError, setPinError] = useState("");

    /* ── status ───────────────────────────────────────────── */
    const [processing, setProcessing] = useState(false);
    const [payError, setPayError] = useState("");
    const [submitted, setSubmitted] = useState(false);



    /* ── auth ─────────────────────────────────────────────── */
    useEffect(() => {
        const unsub = onAuthStateChanged(auth, (u) => {
            setUser(u);
            if (u) {
                setBuyerEmail(u.email || "");
                fetchBooks(u.uid);
            } else {
                setLoadingBooks(false);
            }
        });
        return () => unsub();
    }, []);

    const fetchBooks = async (uid) => {
        try {
            const q = query(
                collection(db, "advertMyBook"),
                where("userId", "==", uid),
                where("status", "==", "approved"),
            );
            const snap = await getDocs(q);
            setBooks(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        } catch (e) { console.error(e); }
        finally { setLoadingBooks(false); }
    };

    /* ── computed ─────────────────────────────────────────── */
    const tier = TIERS[selectedTier];
    const totalPrice = tier.dailyRate * selectedDays;
const canOpenPay = selectedBook && headline.trim();
    /* ═══════════════════════════════════════════════════════
       SAVE PROMOTION DOC  (after successful payment)
    ═══════════════════════════════════════════════════════ */
    const savePromotion = async (paymentMeta) => {
        await addDoc(collection(db, "promotions"), {
            /* seller */
            sellerId: user.uid,
            sellerEmail: user.email,
            /* book */
            bookId: selectedBook.id,
            bookTitle: selectedBook.bookTitle || selectedBook.title || "Untitled",
            bookAuthor: selectedBook.author || "",
            bookPrice: Number(selectedBook.price) || 0,
            link: `/book/preview?id=${selectedBook.id}`,
            /* creative */
            bannerUrl: bannerUrl.trim() || (selectedBook?.driveFileId
                ? `https://drive.google.com/thumbnail?id=${selectedBook.driveFileId}&sz=w400`
                : selectedBook?.image || selectedBook?.coverImage || ''),            headline: headline.trim(),
            ctaText: ctaText.trim() || "Get Your Copy",
            /* plan */
            tier: selectedTier,
            durationDays: selectedDays,
            dailyRate: tier.dailyRate,
            totalPrice,
            status: "pending",          
            expiryDate: null,        // admin sets this on approval
            /* analytics */
            clicks: 0,
            impressions: 0,
            /* meta */
            paymentMethod: paymentMeta.method,
            paymentRef: paymentMeta.ref,
            createdAt: serverTimestamp(),
        });

        /* also log to revenue collection for admin dashboard */
        await addDoc(collection(db, "revenue"), {
            type: "ad_boost",
            amount: totalPrice,
            sellerId: user.uid,
            sellerEmail: user.email,
            tier: selectedTier,
            durationDays: selectedDays,
            bookId: selectedBook.id,
            bookTitle: selectedBook.bookTitle || selectedBook.title,
            paymentMethod: paymentMeta.method,
            paymentRef: paymentMeta.ref,
            status: "completed",
            createdAt: serverTimestamp(),
        });
    };

    /* ═══════════════════════════════════════════════════════
       FLUTTERWAVE PAYMENT
    ═══════════════════════════════════════════════════════ */
    const handleFlutterwavePayment = async () => {
        if (!buyerEmail || !buyerPhone || !buyerName) {
            setPayError("Please fill in all contact fields.");
            return;
        }

        setProcessing(true);
        setPayError("");

        let FlutterwaveCheckout;
        try {
            FlutterwaveCheckout = await initializeFlutterwave();
        } catch {
            setPayError("Payment gateway failed to load. Please refresh and try again.");
            setProcessing(false);
            return;
        }
        setProcessing(false); // stop spinner — modal takes over from here

        const txRef = `AD-FLW-${Date.now()}-${Math.random().toString(36).substr(2, 8)}`;

        FlutterwaveCheckout({
            public_key: process.env.NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY,
            tx_ref: txRef,
            amount: totalPrice,
            currency: "NGN",
            payment_options: "card,ussd,banktransfer",
            customer: {
                email: buyerEmail,
                phone_number: buyerPhone,
                name: buyerName,
            },
            /* ── KEY: meta tells your webhook this is an ad, not a book ── */
            meta: {
                type: "ad_boost",          // webhook checks this field
                tier: selectedTier,
                days: selectedDays,
                bookId: selectedBook.id,
                sellerId: user.uid,
            },
            customizations: {
                title: "LAN Library — Ad Promotion",
                description: `${selectedTier} tier · ${selectedDays} days`,
                logo: "/lan-logo.png",
            },
            callback: async (response) => {
                if (response.status === "successful" || response.status === "completed") {
                    try {
                        setProcessing(true);
                        await savePromotion({ method: "flutterwave", ref: response.transaction_id || txRef });
                        setShowPayModal(false);
                        setSubmitted(true);
                    } catch (err) {
                        setPayError("Payment succeeded but record failed. Contact support with ref: " + txRef);
                    } finally {
                        setProcessing(false);
                    }
                } else {
                    setPayError("Payment was not completed. Please try again.");
                }
            },
            onclose: () => { },
        });
    };

    /* ═══════════════════════════════════════════════════════
       WALLET PAYMENT
    ═══════════════════════════════════════════════════════ */
    const handleWalletPayment = async () => {
        setPinError("");
        if (!enteredPin || enteredPin.length < 4) { setPinError("Enter your 4-digit PIN."); return; }

        setProcessing(true);
        try {
            const sellerRef = doc(db, "sellers", user.uid);
            let newBalance = null;

            await runTransaction(db, async (tx) => {
                const snap = await tx.get(sellerRef);
                if (!snap.exists()) throw new Error("Wallet not found. Become a seller first.");

                const data = snap.data();
                const storedPin = data.transactionPin ?? data.transferPin;

                if (storedPin === undefined || storedPin === null) throw new Error("PIN_NOT_SET");
                if (enteredPin.trim() !== storedPin.toString().trim()) throw new Error("Incorrect PIN. Try again.");

                const balance = data.accountBalance || 0;
                if (balance < totalPrice) throw new Error(`Insufficient balance. You have ₦${balance.toLocaleString()}.`);

                newBalance = balance - totalPrice;
                tx.update(sellerRef, { accountBalance: newBalance, updatedAt: serverTimestamp() });
            });

            const walletRef = `AD-WAL-${Date.now()}`;
            await savePromotion({ method: "wallet", ref: walletRef });
            setShowPayModal(false);
            setSubmitted(true);

        } catch (err) {
            if (err.message === "PIN_NOT_SET") {
                setPinError("You haven't set a PIN yet.");
                setPinView("setup");
            } else {
                setPinError(err.message);
            }
        } finally {
            setProcessing(false);
        }
    };

    /* ── PIN helpers (mirrors usePayment.js pattern) ─────── */
    const handleSetupPin = async () => {
        setPinError("");
        if (setupPin.length < 4) { setPinError("PIN must be 4 digits."); return; }
        if (setupPin !== setupPinConf) { setPinError("PINs do not match."); return; }
        setProcessing(true);
        try {
            await updateDoc(doc(db, "sellers", user.uid), {
                transactionPin: setupPin.trim(),
                transferPin: setupPin.trim(),
                updatedAt: serverTimestamp(),
            });
            setSetupPin(""); setSetupPinConf(""); setPinView("enter"); setPinError("");
        } catch { setPinError("Failed to set PIN. Try again."); }
        finally { setProcessing(false); }
    };

    const handleRequestOtp = async () => {
        setPinError("");
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        try {
            await updateDoc(doc(db, "sellers", user.uid), {
                resetOtp: otp, otpExpiry: Date.now() + 600000,
            });
            console.log("[SECURITY] OTP:", otp); // replace with email service
            setPinView("otp");
        } catch { setPinError("Failed to send code. Try again."); }
    };

    const handleVerifyOtp = async () => {
        setPinError("");
        if (otpInput.length < 6) { setPinError("Enter the 6-digit code."); return; }
        if (newResetPin.length < 4) { setPinError("New PIN must be 4 digits."); return; }
        const snap = await getDoc(doc(db, "sellers", user.uid));
        const data = snap.data();
        if (otpInput === data?.resetOtp && Date.now() < data?.otpExpiry) {
            await updateDoc(doc(db, "sellers", user.uid), {
                transactionPin: newResetPin.trim(),
                transferPin: newResetPin.trim(),
                resetOtp: null, otpExpiry: null,
            });
            setOtpInput(""); setNewResetPin(""); setPinView("enter"); setPinError("");
        } else {
            setPinError("Invalid or expired code.");
        }
    };

    /* ── close + reset modal ──────────────────────────────── */
    const closeModal = () => {
        setShowPayModal(false);
        setPayError("");
        setPinError("");
        setEnteredPin("");
        setPinView("enter");
        setSetupPin(""); setSetupPinConf("");
        setOtpInput(""); setNewResetPin("");
    };

    /* ════════════════════════════════════════════════════════
       SHARED MODAL STYLES  (exact same tokens as PaymentClient)
    ════════════════════════════════════════════════════════ */
    const modalOverlay = {
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.72)",
        zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
    };
    const modalBox = {
        background: "#fff", width: "100%", maxWidth: 440,
        border: `0.5px solid rgba(184,150,62,0.3)`, overflow: "hidden",
    };
    const modalHeader = {
        background: NAVY,
        backgroundImage: "radial-gradient(rgba(184,150,62,0.06) 1px,transparent 1px)",
        backgroundSize: "24px 24px",
        padding: "20px 24px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        borderBottom: "0.5px solid rgba(184,150,62,0.2)",
    };
    const inputSt = (err) => ({
        width: "100%", padding: "12px 14px",
        border: `0.5px solid ${err ? "#ef4444" : "#e5ddd0"}`,
        background: CREAM, fontSize: 13, color: NAVY,
        fontFamily: "'Lato',sans-serif", outline: "none",
        boxSizing: "border-box", marginBottom: 4,
    });
    const navyBtn = (disabled) => ({
        width: "100%", background: disabled ? "#94a3b8" : NAVY, color: "#fff",
        padding: "13px", border: "none", fontSize: 12,
        fontWeight: 700, cursor: disabled ? "not-allowed" : "pointer",
        fontFamily: "'Lato',sans-serif", letterSpacing: "0.06em",
    });
    const goldBtn = (disabled) => ({
        width: "100%", background: disabled ? "#94a3b8" : GOLD, color: NAVY,
        padding: "13px", border: "none", fontSize: 12,
        fontWeight: 700, cursor: disabled ? "not-allowed" : "pointer",
        fontFamily: "'Lato',sans-serif", letterSpacing: "0.06em",
    });

    /* ════════════════════════════════════════════════════════
       SUCCESS
    ════════════════════════════════════════════════════════ */
    if (submitted) return (
        <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, background: BG }}>
            <div style={{ textAlign: "center", maxWidth: 440 }}>
                <div style={{ width: 72, height: 72, background: "rgba(184,150,62,.12)", border: `2px solid ${GOLD}`, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
                    <CheckCircle size={32} style={{ color: GOLD }} />
                </div>
                <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: 28, fontWeight: 700, color: NAVY, margin: "0 0 10px" }}>
                    Payment Received!
                </h2>
                <p style={{ fontSize: 14, color: "#888", lineHeight: 1.75, margin: "0 0 8px" }}>
                    Your <strong style={{ color: GOLD }}>{selectedTier} Tier</strong> promotion is now <strong>pending admin review</strong>.
                    Once approved, it goes live for <strong>{selectedDays} days</strong>.
                </p>
                <p style={{ fontSize: 12, color: "#bbb", margin: "0 0 28px", fontFamily: "'Lato',sans-serif" }}>
                    You'll be notified when your ad is approved and live.
                </p>
                <button
                    onClick={() => { setSubmitted(false); setSelectedBook(null); setBannerUrl(""); setHeadline(""); setCtaText("Get Your Copy"); }}
                    style={{ background: NAVY, color: "#fff", border: "none", padding: "11px 28px", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "'Lato',sans-serif", letterSpacing: ".04em", textTransform: "uppercase" }}>
                    Submit Another Ad
                </button>
            </div>
        </div>
    );

    /* ════════════════════════════════════════════════════════
       MAIN FORM
    ════════════════════════════════════════════════════════ */
    return (
        <>
            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400&family=Lato:wght@300;400;700&display=swap');
        .adcr-root  { font-family:'Lato',sans-serif; background:${BG}; }
        .adcr-input { width:100%; border:0.5px solid #e5ddd0; padding:10px 14px; font-size:13px; color:${NAVY}; outline:none; font-family:'Lato',sans-serif; background:#fafaf8; transition:border-color .18s; box-sizing:border-box; }
        .adcr-input:focus  { border-color:${GOLD}; }
        .adcr-input::placeholder { color:#bbb; }
        .adcr-label { font-size:9px; font-weight:700; letter-spacing:.2em; text-transform:uppercase; color:${GOLD}; font-family:'Lato',sans-serif; display:block; margin-bottom:8px; }
        .book-opt   { padding:12px 14px; border:1.5px solid #e5ddd0; cursor:pointer; background:#fff; transition:all .18s; }
        .book-opt:hover { border-color:${GOLD}; }
        .book-opt.sel { border-color:${GOLD}; background:rgba(184,150,62,.06); box-shadow:0 0 0 3px rgba(184,150,62,.12); }
        .tier-card  { border:1.5px solid #e5ddd0; padding:18px 16px; cursor:pointer; background:#fff; transition:all .2s; }
        .tier-card:hover { transform:translateY(-2px); box-shadow:0 8px 24px rgba(13,34,68,.08); }
        .tier-card.sel  { box-shadow:0 0 0 3px rgba(184,150,62,.18); }
        .dur-pill   { padding:8px 18px; border:0.5px solid #e5ddd0; cursor:pointer; font-size:12px; font-weight:700; background:#fff; color:${NAVY}; transition:all .15s; font-family:'Lato',sans-serif; }
        .dur-pill:hover { border-color:${GOLD}; }
        .dur-pill.sel   { background:${NAVY}; color:#fff; border-color:${NAVY}; }
        .pay-tab    { flex:1; padding:12px; border:1.5px solid #e5ddd0; background:#fff; cursor:pointer; transition:all .18s; display:flex; align-items:center; justify-content:center; gap:8px; font-family:'Lato',sans-serif; font-size:12px; font-weight:700; color:#888; }
        .pay-tab:hover { border-color:${GOLD}; }
        .pay-tab.sel { border-color:${NAVY}; background:${CREAM}; color:${NAVY}; }
        @keyframes spin { to { transform:rotate(360deg) } }
        @keyframes pulse { 0%,100%{opacity:1}50%{opacity:.5} }
      `}</style>

            <div className="adcr-root" style={{ maxWidth: 780, margin: "0 auto", padding: "40px 24px 80px" }}>

                {/* Header */}
                <div style={{ marginBottom: 44 }}>
                    <div style={{ display: "inline-flex", alignItems: "center", gap: 7, background: "rgba(184,150,62,.1)", border: "1px solid rgba(184,150,62,.3)", borderRadius: 999, padding: "5px 14px", marginBottom: 16 }}>
                        <Zap size={10} style={{ color: GOLD }} />
                        <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: ".16em", textTransform: "uppercase", color: GOLDD, fontFamily: "'Lato',sans-serif" }}>Premium Advertising</span>
                    </div>
                    <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: "clamp(28px,5vw,44px)", fontWeight: 900, color: NAVY, margin: "0 0 12px", lineHeight: 1.08 }}>
                        Promote Your<br />
                        <span style={{ color: GOLD, fontStyle: "italic" }}>Academic Materials.</span>
                    </h1>
                    <p style={{ fontSize: 14, color: "#888", lineHeight: 1.75, maxWidth: 520, fontWeight: 300 }}>
                        Reach over <strong style={{ color: NAVY }}>2.4 million</strong> students across Africa.
                        Pick a tier, set your duration, and get your book in front of the right audience.
                    </p>
                </div>

                {/* ── STEP 1: Book ─────────────────────────────────── */}
                <section style={{ marginBottom: 40 }}>
                    <p className="adcr-label">Step 1 — Select Your Book <span style={{ color: "#f87171" }}>*</span></p>
                    {loadingBooks ? (
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))", gap: 10 }}>
                            {[1, 2, 3].map(i => <div key={i} style={{ height: 64, background: "#ede8df", animation: "pulse 1.5s infinite" }} />)}
                        </div>
                    ) : books.length === 0 ? (
                        <div style={{ background: "#fff", border: "0.5px solid #e5ddd0", padding: "28px 20px", textAlign: "center" }}>
                            <BookOpen size={28} style={{ color: "#ddd", display: "block", margin: "0 auto 10px" }} />
                            <p style={{ fontSize: 13, color: "#bbb", margin: 0 }}>No approved books yet. Upload and get a book approved first.</p>
                        </div>
                    ) : (
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(210px,1fr))", gap: 10 }}>
                            {books.map(b => (
                                <div key={b.id} className={`book-opt${selectedBook?.id === b.id ? " sel" : ""}`}
                                    onClick={() => {
                                        setSelectedBook(b);
                                        if (!bannerUrl.trim()) {
                                            const thumb = b.driveFileId
                                                ? `https://drive.google.com/thumbnail?id=${b.driveFileId}&sz=w400`
                                                : b.embedUrl
                                                    ? (() => { const m = b.embedUrl.match(/\/d\/(.*?)\/|\/file\/d\/(.*?)\/|id=(.*?)(&|$)/); if (m) { const id = m[1]||m[2]||m[3]; if (id) return `https://drive.google.com/thumbnail?id=${id}&sz=w400`; } return ''; })()
                                                    : b.pdfUrl?.includes('drive.google.com')
                                                        ? (() => { const m = b.pdfUrl.match(/[-\w]{25,}/); return m ? `https://drive.google.com/thumbnail?id=${m[0]}&sz=w400` : ''; })()
                                                        : b.image || b.coverImage || '';
                                            if (thumb) setBannerUrl(thumb);
                                        }
                                    }}>
                                    <p style={{ fontFamily: "'Playfair Display',serif", fontSize: 13, fontWeight: 700, color: NAVY, margin: "0 0 3px", lineHeight: 1.3, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                                        {b.bookTitle || b.title}
                                    </p>
                                    <p style={{ fontSize: 10, color: "#aaa", margin: 0 }}>₦{Number(b.price).toLocaleString()}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </section>

                {/* ── STEP 2: Tier ─────────────────────────────────── */}
                <section style={{ marginBottom: 40 }}>
                    <p className="adcr-label">Step 2 — Choose Your Tier <span style={{ color: "#f87171" }}>*</span></p>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14 }}>
                        {Object.entries(TIERS).map(([key, t]) => {
                            const Icon = t.Icon;
                            const active = selectedTier === key;
                            return (
                                <div key={key} className={`tier-card${active ? " sel" : ""}`}
                                    style={{ borderColor: active ? t.color : "#e5ddd0", background: active ? t.bg : "#fff" }}
                                    onClick={() => setSelectedTier(key)}>
                                    <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 14 }}>
                                        <div style={{ width: 38, height: 38, background: t.bg, border: `1px solid ${t.border}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                            <Icon size={16} style={{ color: t.color }} />
                                        </div>
                                        <div>
                                            <p style={{ fontSize: 13, fontWeight: 700, color: NAVY, margin: 0 }}>{key}</p>
                                            <p style={{ fontSize: 10, color: t.color, fontWeight: 700, margin: 0 }}>₦{t.dailyRate.toLocaleString()}/day</p>
                                        </div>
                                    </div>
                                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                                        {t.perks.map(p => (
                                            <div key={p} style={{ display: "flex", alignItems: "flex-start", gap: 7, fontSize: 11, color: "#666" }}>
                                                <div style={{ width: 4, height: 4, borderRadius: "50%", background: t.color, flexShrink: 0, marginTop: 5 }} />
                                                {p}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </section>

                {/* ── STEP 3: Duration ─────────────────────────────── */}
                <section style={{ marginBottom: 40 }}>
                    <p className="adcr-label">Step 3 — Duration <span style={{ color: "#f87171" }}>*</span></p>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        {DURATIONS.map(d => (
                            <button key={d} className={`dur-pill${selectedDays === d ? " sel" : ""}`} onClick={() => setSelectedDays(d)}>
                                {d} days
                            </button>
                        ))}
                    </div>
                </section>

                {/* ── STEP 4: Creative ─────────────────────────────── */}
                <section style={{ marginBottom: 40 }}>
                    <p className="adcr-label">Step 4 — Ad Creative <span style={{ color: "#f87171" }}>*</span></p>
                    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                        <div>
                            <label style={{ fontSize: 10, color: "#aaa", display: "block", marginBottom: 6 }}>
                                Banner Image URL <span style={{ color: "#bbb" }}>(optional — book cover used if empty)</span> — recommended 1200 × 400 px                            </label>
                            <input className="adcr-input" placeholder="https://…/banner.jpg" value={bannerUrl} onChange={e => setBannerUrl(e.target.value)} />
                            {bannerUrl && (
                                <div style={{ marginTop: 8, border: "0.5px solid #e5ddd0", overflow: "hidden", background: "#ede8df" }}>
                                    <img src={bannerUrl} alt="Banner preview" style={{ width: "100%", height: 120, objectFit: "cover", display: "block" }} onError={e => { e.target.style.display = "none"; }} />
                                </div>
                            )}
                        </div>
                        <div>
                            <label style={{ fontSize: 10, color: "#aaa", display: "block", marginBottom: 6 }}>
                                Headline <span style={{ color: "#f87171" }}>*</span> (max 80 chars)
                            </label>
                            <input className="adcr-input" placeholder="e.g. Ace Your Finals with Dr. Smith's Past Questions" value={headline} onChange={e => setHeadline(e.target.value.slice(0, 80))} />
                            <p style={{ fontSize: 10, color: headline.length > 70 ? "#f59e0b" : "#bbb", margin: "4px 0 0" }}>{headline.length}/80</p>
                        </div>
                        <div>
                            <label style={{ fontSize: 10, color: "#aaa", display: "block", marginBottom: 6 }}>Button Text (max 30 chars)</label>
                            <input className="adcr-input" placeholder="Get Your Copy" value={ctaText} onChange={e => setCtaText(e.target.value.slice(0, 30))} />
                        </div>
                    </div>
                </section>

                {/* ── Price Summary + Pay CTA ───────────────────────── */}
                <div style={{
                    background: NAVY,
                    backgroundImage: "radial-gradient(rgba(184,150,62,.06) 1px,transparent 1px)",
                    backgroundSize: "22px 22px",
                    padding: "28px 32px",
                    display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 20,
                }}>
                    <div>
                        <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: ".18em", textTransform: "uppercase", color: "rgba(184,150,62,.6)", margin: "0 0 4px" }}>Total Investment</p>
                        <p style={{ fontFamily: "'Playfair Display',serif", fontSize: 40, fontWeight: 900, color: GOLD, margin: "0 0 4px", lineHeight: 1 }}>
                            ₦{totalPrice.toLocaleString()}
                        </p>
                        <p style={{ fontSize: 11, color: "rgba(255,255,255,.35)", margin: 0 }}>
                            {selectedTier} · {selectedDays} days · ₦{tier.dailyRate.toLocaleString()}/day
                        </p>
                    </div>
                    <button
                        onClick={() => { if (canOpenPay) { setPayError(""); setShowPayModal(true); } }}
                        disabled={!canOpenPay}
                        style={{
                            display: "inline-flex", alignItems: "center", gap: 8,
                            padding: "14px 32px", background: canOpenPay ? GOLD : "#555", color: NAVY,
                            border: "none", fontSize: 13, fontWeight: 700,
                            cursor: canOpenPay ? "pointer" : "not-allowed",
                            fontFamily: "'Lato',sans-serif", letterSpacing: ".04em", textTransform: "uppercase",
                            transition: "background .18s",
                        }}>
                        <Zap size={14} /> Proceed to Payment
                    </button>
                </div>

                {!canOpenPay && (
                    <p style={{ fontSize: 11, color: "#f59e0b", textAlign: "center", marginTop: 10 }}>
                        Complete all required fields above to unlock payment.
                    </p>
                )}

                <p style={{ fontSize: 11, color: "#bbb", textAlign: "center", marginTop: 16, lineHeight: 1.7 }}>
                    Ads go live within 24 hours of payment, once reviewed by our team.
                </p>
            </div>

            {/* ══════════════════════════════════════════════════════
                PAYMENT MODAL
            ══════════════════════════════════════════════════════ */}
            {showPayModal && (
                <div style={modalOverlay} onClick={e => { if (e.target === e.currentTarget) closeModal(); }}>
                    <div style={modalBox}>

                        {/* Header */}
                        <div style={modalHeader}>
                            <div>
                                <p style={{ fontSize: 9, color: GOLD, fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", margin: "0 0 3px", fontFamily: "'Lato',sans-serif" }}>
                                    Ad Promotion Payment
                                </p>
                                <p style={{ fontFamily: "'Playfair Display',serif", fontSize: 17, fontWeight: 700, color: "#fff", margin: 0 }}>
                                    {selectedTier} Tier · {selectedDays} days · ₦{totalPrice.toLocaleString()}
                                </p>
                            </div>
                            <button
                                onClick={closeModal}
                                style={{ width: 32, height: 32, border: "0.5px solid rgba(255,255,255,0.2)", background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(255,255,255,0.6)" }}>
                                <X size={16} />
                            </button>
                        </div>

                        <div style={{ padding: 24 }}>

                            {/* Global error */}
                            {payError && (
                                <div style={{ display: "flex", alignItems: "center", gap: 10, background: "#fff1f2", border: "0.5px solid #fca5a5", padding: "10px 14px", marginBottom: 16 }}>
                                    <AlertCircle size={14} style={{ color: "#ef4444", flexShrink: 0 }} />
                                    <p style={{ fontSize: 12, color: "#dc2626", margin: 0 }}>{payError}</p>
                                </div>
                            )}

                            {/* ── Payment method tabs ── */}
                            <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
                                <button className={`pay-tab${payMethod === "flutterwave" ? " sel" : ""}`} onClick={() => { setPayMethod("flutterwave"); setPinError(""); setPinView("enter"); setEnteredPin(""); }}>
                                    <CreditCard size={14} /> Card / Bank
                                </button>
                                <button className={`pay-tab${payMethod === "wallet" ? " sel" : ""}`} onClick={() => { setPayMethod("wallet"); setPayError(""); }}>
                                    <Wallet size={14} /> LAN Wallet
                                </button>
                            </div>

                            {/* ════════════════════════════════════════════
                                FLUTTERWAVE FORM
                            ════════════════════════════════════════════ */}
                            {payMethod === "flutterwave" && (
                                <>
                                    <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", color: GOLD, marginBottom: 12 }}>Your Details</p>
                                    <input style={inputSt(false)} placeholder="Full name *" value={buyerName} onChange={e => setBuyerName(e.target.value)} />
                                    <input style={{ ...inputSt(false), marginTop: 8 }} placeholder="Email *" type="email" value={buyerEmail} onChange={e => setBuyerEmail(e.target.value)} />
                                    <input style={{ ...inputSt(false), marginTop: 8 }} placeholder="Phone *" type="tel" value={buyerPhone} onChange={e => setBuyerPhone(e.target.value)} />

                                    <div style={{ background: CREAM, border: "0.5px solid rgba(184,150,62,0.2)", padding: "10px 14px", margin: "16px 0", display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                                        <span style={{ color: "#888" }}>Total</span>
                                        <span style={{ fontWeight: 700, color: NAVY }}>₦{totalPrice.toLocaleString()}</span>
                                    </div>

                                    <button onClick={handleFlutterwavePayment} disabled={processing} style={navyBtn(processing)}>
                                        {processing ? "Processing…" : `PAY ₦${totalPrice.toLocaleString()} VIA CARD/BANK`}
                                    </button>
                                </>
                            )}

                            {/* ════════════════════════════════════════════
                                WALLET / PIN FLOW  (mirrors PaymentClient exactly)
                            ════════════════════════════════════════════ */}
                            {payMethod === "wallet" && (
                                <>
                                    {/* Pin error inside wallet section */}
                                    {pinError && (
                                        <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#fff1f2", border: "0.5px solid #fca5a5", padding: "10px 14px", marginBottom: 14 }}>
                                            <AlertCircle size={13} style={{ color: "#ef4444", flexShrink: 0 }} />
                                            <p style={{ fontSize: 12, color: "#dc2626", margin: 0 }}>{pinError}</p>
                                        </div>
                                    )}

                                    {/* ── Enter PIN ── */}
                                    {pinView === "enter" && (
                                        <>
                                            <p style={{ fontSize: 12, color: "#888", textAlign: "center", marginBottom: 16 }}>
                                                Authorise <strong style={{ color: NAVY }}>₦{totalPrice.toLocaleString()}</strong> from your LAN Wallet
                                            </p>
                                            {/* PIN dots */}
                                            <div style={{ display: "flex", justifyContent: "center", gap: 10, marginBottom: 12 }}>
                                                {Array.from({ length: 4 }, (_, i) => i < enteredPin.length).map((filled, i) => (
                                                    <div key={i} style={{ width: 52, height: 54, border: `1.5px solid ${filled ? NAVY : "#e5ddd0"}`, background: filled ? CREAM : "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, color: filled ? NAVY : "#e5ddd0" }}>
                                                        {filled ? "●" : "○"}
                                                    </div>
                                                ))}
                                            </div>
                                            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 14 }}>
                                                <button onClick={() => { setPinView("forgot"); setPinError(""); }} style={{ background: "transparent", border: "none", cursor: "pointer", color: GOLD, fontSize: 11, fontWeight: 700 }}>Forgot PIN?</button>
                                                {pinError.includes("haven't set") && (
                                                    <button onClick={() => { setPinView("setup"); setPinError(""); }} style={{ background: "transparent", border: "none", cursor: "pointer", color: "#16a34a", fontSize: 11, fontWeight: 700 }}>Setup PIN</button>
                                                )}
                                            </div>
                                            {/* Numpad */}
                                            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 6, marginBottom: 6 }}>
                                                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => (
                                                    <button key={n} onClick={() => { if (enteredPin.length < 4) { setEnteredPin(p => p + String(n)); setPinError(""); } }}
                                                        disabled={enteredPin.length >= 4}
                                                        style={{ height: 50, border: "0.5px solid #e5ddd0", background: "#fff", fontSize: 18, fontWeight: 700, color: NAVY, cursor: "pointer" }}>
                                                        {n}
                                                    </button>
                                                ))}
                                            </div>
                                            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 6, marginBottom: 16 }}>
                                                <div />
                                                <button onClick={() => { if (enteredPin.length < 4) { setEnteredPin(p => p + "0"); setPinError(""); } }} disabled={enteredPin.length >= 4}
                                                    style={{ height: 50, border: "0.5px solid #e5ddd0", background: "#fff", fontSize: 18, fontWeight: 700, color: NAVY, cursor: "pointer" }}>0</button>
                                                <button onClick={() => setEnteredPin(p => p.slice(0, -1))} style={{ height: 50, border: "0.5px solid #e5ddd0", background: "#fff", fontSize: 18, color: "#aaa", cursor: "pointer" }}>⌫</button>
                                            </div>
                                            <button onClick={handleWalletPayment} disabled={enteredPin.length < 4 || processing} style={navyBtn(enteredPin.length < 4 || processing)}>
                                                {processing ? "Verifying…" : "CONFIRM PAYMENT"}
                                            </button>
                                        </>
                                    )}

                                    {/* ── Setup PIN ── */}
                                    {pinView === "setup" && (
                                        <>
                                            <p style={{ fontSize: 12, color: "#888", textAlign: "center", marginBottom: 16 }}>Create a 4-digit wallet PIN</p>
                                            <input type="password" value={setupPin} onChange={e => setSetupPin(e.target.value.replace(/\D/g, "").slice(0, 4))} style={{ ...inputSt(false), textAlign: "center", fontSize: 22, letterSpacing: 8 }} placeholder="New PIN" maxLength={4} inputMode="numeric" />
                                            <input type="password" value={setupPinConf} onChange={e => setSetupPinConf(e.target.value.replace(/\D/g, "").slice(0, 4))} style={{ ...inputSt(false), textAlign: "center", fontSize: 22, letterSpacing: 8, marginTop: 8 }} placeholder="Confirm PIN" maxLength={4} inputMode="numeric" />
                                            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 16 }}>
                                                <button onClick={handleSetupPin} disabled={processing || setupPin.length < 4 || setupPinConf.length < 4} style={goldBtn(processing || setupPin.length < 4 || setupPinConf.length < 4)}>
                                                    {processing ? "SAVING…" : "SET PIN & CONTINUE"}
                                                </button>
                                                <button onClick={() => { setPinView("enter"); setPinError(""); }} style={{ background: "transparent", border: "none", cursor: "pointer", color: "#aaa", fontSize: 11, padding: 6 }}>Back</button>
                                            </div>
                                        </>
                                    )}

                                    {/* ── Forgot PIN ── */}
                                    {pinView === "forgot" && (
                                        <>
                                            <p style={{ fontSize: 12, color: "#888", textAlign: "center", marginBottom: 20 }}>We'll send a 6-digit reset code to your registered email.</p>
                                            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                                                <button onClick={handleRequestOtp} disabled={processing} style={navyBtn(processing)}>
                                                    {processing ? "SENDING…" : "SEND RESET CODE"}
                                                </button>
                                                <button onClick={() => { setPinView("enter"); setPinError(""); }} style={{ background: "transparent", border: "none", cursor: "pointer", color: "#aaa", fontSize: 11, padding: 6 }}>Back</button>
                                            </div>
                                        </>
                                    )}

                                    {/* ── OTP + New PIN ── */}
                                    {pinView === "otp" && (
                                        <>
                                            <p style={{ fontSize: 12, color: "#888", textAlign: "center", marginBottom: 16 }}>Enter the 6-digit code and your new PIN</p>
                                            <input type="text" value={otpInput} onChange={e => setOtpInput(e.target.value.replace(/\D/g, "").slice(0, 6))} style={{ ...inputSt(false), textAlign: "center", fontSize: 18, letterSpacing: 6 }} placeholder="6-digit code" maxLength={6} inputMode="numeric" />
                                            <input type="password" value={newResetPin} onChange={e => setNewResetPin(e.target.value.replace(/\D/g, "").slice(0, 4))} style={{ ...inputSt(false), textAlign: "center", fontSize: 22, letterSpacing: 8, marginTop: 8 }} placeholder="New 4-digit PIN" maxLength={4} inputMode="numeric" />
                                            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 16 }}>
                                                <button onClick={handleVerifyOtp} disabled={processing || otpInput.length < 6 || newResetPin.length < 4} style={navyBtn(processing || otpInput.length < 6 || newResetPin.length < 4)}>
                                                    {processing ? "VERIFYING…" : "RESET PIN & CONTINUE"}
                                                </button>
                                                <button onClick={() => { setPinView("forgot"); setPinError(""); }} style={{ background: "transparent", border: "none", cursor: "pointer", color: "#aaa", fontSize: 11, padding: 6 }}>Back</button>
                                            </div>
                                        </>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}