"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";
import {
    Printer, Lock, AlertCircle, CheckCircle, ArrowLeft,
    FileText, Shield, X, WifiOff,
} from "lucide-react";
import Link from "next/link";
import { usePayment } from "@/app/hooks/usePayment";
import { PaymentMethodSelector } from "@/components/PaymentMethodSelector";

const NAVY = "#0d2244";
const GOLD = "#b8963e";
const CREAM = "#f5f0e8";
const BG = "#f5f1ea";

const getThumbnailUrl = (book) => {
    if (!book) return "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400";
    let fileId = book.driveFileId;
    if (!fileId && book.embedUrl) {
        const m = book.embedUrl.match(/\/d\/([\w-]{25,})|id=([\w-]{25,})/);
        if (m) fileId = m[1] || m[2];
    }
    if (fileId) return `https://lh3.googleusercontent.com/d/${fileId}=w400`;
    return book.image || book.coverImage || "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400";
};

/* ─── Printer detection ──────────────────────────────────────── */
function usePrinterStatus() {
    const [status, setStatus] = useState("checking"); // "checking" | "ready" | "none"

    useEffect(() => {
        // The PrintEvent / navigator.printing API isn't universally available,
        // but we can probe via matchMedia + window.print availability.
        // Most reliable cross-browser signal: attempt a silent matchMedia print query.
        const check = () => {
            try {
                // If the browser can construct a print media query object, print is supported
                const mq = window.matchMedia("print");
                // We fire a zero-timeout print probe: listen for beforeprint which only
                // fires if the system has at least one print destination available.
                // We use a flag + short timeout as fallback.
                let detected = false;
                const onBefore = () => { detected = true; };
                window.addEventListener("beforeprint", onBefore, { once: true });

                // Use setTimeout — if beforeprint never fires within 300ms, no printer
                setTimeout(() => {
                    window.removeEventListener("beforeprint", onBefore);
                    // Fallback: treat as ready if window.print exists (most environments)
                    // since beforeprint only fires when print() is actually called.
                    // Real detection happens at print time (see printDocument).
                    setStatus("ready");
                }, 300);
            } catch {
                setStatus("none");
            }
        };
        check();
    }, []);

    return status;
}

/* ─── Silent in-page print (no new tab) ─────────────────────── */
function useSilentPrint() {
    const iframeRef = useRef(null);
    const [printing, setPrinting] = useState(false);
    const [printError, setPrintError] = useState(null);

    const printDocument = useCallback(async (pdfUrl) => {
        if (!pdfUrl) { setPrintError("No document URL available."); return; }
        setPrintError(null);
        setPrinting(true);

        try {
            // Create a hidden iframe that loads the PDF and calls print() on it
            if (iframeRef.current) document.body.removeChild(iframeRef.current);

            const iframe = document.createElement("iframe");
            iframe.style.cssText = "position:fixed;top:-9999px;left:-9999px;width:1px;height:1px;opacity:0;pointer-events:none;border:none;";
            document.body.appendChild(iframe);
            iframeRef.current = iframe;

            await new Promise((resolve, reject) => {
                const timeout = setTimeout(() => {
                    reject(new Error("Document took too long to load. Please try again."));
                }, 30_000);

                iframe.onload = () => {
                    clearTimeout(timeout);
                    try {
                        // Focus the iframe content and call print
                        iframe.contentWindow.focus();

                        // Listen for afterprint to detect if print was cancelled
                        const onAfter = () => {
                            setPrinting(false);
                            // Clean up after a short delay
                            setTimeout(() => {
                                try { document.body.removeChild(iframe); } catch { }
                                iframeRef.current = null;
                            }, 1000);
                        };
                        iframe.contentWindow.addEventListener("afterprint", onAfter, { once: true });

                        iframe.contentWindow.print();
                        resolve();
                    } catch (e) {
                        reject(e);
                    }
                };

                iframe.onerror = () => {
                    clearTimeout(timeout);
                    reject(new Error("Failed to load document. Check your connection."));
                };

                iframe.src = pdfUrl;
            });
        } catch (err) {
            setPrinting(false);
            setPrintError(err.message || "Print failed. Please try again.");
        }
    }, []);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (iframeRef.current) {
                try { document.body.removeChild(iframeRef.current); } catch { }
            }
        };
    }, []);

    return { printDocument, printing, printError };
}

export default function RequestPrintPermissionPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const rawId = searchParams.get("id");
    const bookId = rawId?.startsWith("firestore-") ? rawId : `firestore-${rawId}`;
    const cleanId = rawId?.replace("firestore-", "");

    const [book, setBook] = useState(null);
    const [sellerDetails, setSellerDetails] = useState(null);
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isPurchased, setIsPurchased] = useState(false);
    const [isGloballyFrozen, setIsGloballyFrozen] = useState(false);
    const [isPrintLicensingEnabled, setIsPrintLicensingEnabled] = useState(false);
    const [acceptedTerms, setAcceptedTerms] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState("flutterwave");
    const [showPinModal, setShowPinModal] = useState(false);
    const [enteredPin, setEnteredPin] = useState("");
    const [pinError, setPinError] = useState("");
    const [showPrintModal, setShowPrintModal] = useState(false);
    const [formData, setFormData] = useState({ email: "", phone: "", name: "" });

    const printerStatus = usePrinterStatus();
    const { printDocument, printing: silentPrinting, printError } = useSilentPrint();

    const licenseFee = (book?.pages || 0) * 10;
    const bookForPayment = book ? { ...book, price: licenseFee } : null;
    const {
        processing, paymentSuccess, error: paymentError,
        processFlutterwavePayment, processWalletPayment,
    } = usePayment(bookForPayment, formData, sellerDetails);

    /* ── Auth ── */
    useEffect(() => {
        const unsub = onAuthStateChanged(auth, (cu) => {
            if (cu) {
                setUser(cu);
                setFormData({ email: cu.email || "", phone: "", name: cu.displayName || "" });
            } else {
                router.push("/auth/signin");
            }
        });
        return () => unsub();
    }, [router]);

    /* ── Fetch book ── */
    useEffect(() => {
        if (!cleanId) return;
        const fetchBook = async () => {
            try {
                setLoading(true);
                const snap = await getDoc(doc(db, "advertMyBook", cleanId));
                if (!snap.exists()) { setError("Book not found"); return; }
                const data = snap.data();

                setIsGloballyFrozen(data.isGloballyFrozen === true);
                setIsPrintLicensingEnabled(data.isPrintLicensingEnabled === true);

                const bookObj = {
                    id: bookId, firestoreId: cleanId,
                    title: data.bookTitle || data.title,
                    author: data.author, pages: data.pages || 0,
                    price: data.price || 0, category: data.category,
                    description: data.description,
                    driveFileId: data.driveFileId,
                    embedUrl: data.embedUrl, pdfUrl: data.pdfUrl,
                    sellerName: data.sellerName,
                    sellerId: data.sellerId || data.userId,
                    isFromFirestore: true,
                };
                bookObj.image = getThumbnailUrl(bookObj);
                setBook(bookObj);

                if (auth.currentUser) {
                    const ud = await getDoc(doc(db, "users", auth.currentUser.uid));
                    if (ud.exists()) {
                        const pb = ud.data().purchasedBooks || {};
                        setIsPurchased(!!(pb[bookId] || pb[cleanId] || pb[`firestore-${cleanId}`]));
                    }
                }

                const sellerId = data.sellerId || data.userId;
                if (sellerId) {
                    const sd = await getDoc(doc(db, "sellers", sellerId));
                    if (sd.exists()) {
                        const s = sd.data();
                        setSellerDetails({
                            id: sellerId,
                            name: s.sellerName || data.sellerName,
                            email: s.sellerEmail || data.sellerEmail,
                            accountNumber: s.accountNumber,
                            bankCode: s.bankCode,
                            accountBalance: s.accountBalance || 0,
                        });
                    }
                }
            } catch (e) {
                setError("Failed to load book: " + e.message);
            } finally {
                setLoading(false);
            }
        };
        fetchBook();
    }, [cleanId, bookId]);

    /* ── Show print modal on success ── */
    useEffect(() => {
        if (paymentSuccess) setShowPrintModal(true);
    }, [paymentSuccess]);

    const handlePayment = () => {
        if (!acceptedTerms) { alert("Please accept the terms before proceeding."); return; }
        if (!formData.email || !formData.phone || !formData.name) { alert("Please fill in all required fields."); return; }
        if (!book) { alert("Book details still loading, please wait."); return; }
        if (licenseFee === 0) { alert("This document has 0 pages — license fee cannot be zero."); return; }
        if (paymentMethod === "flutterwave") {
            processFlutterwavePayment({ printLicense: true, bookId: cleanId }, "NGN");
        } else {
            setPinError(""); setEnteredPin(""); setShowPinModal(true);
        }
    };

    const handlePinConfirm = () => {
        if (!enteredPin || enteredPin.length < 4) { setPinError("Please enter your 4-digit PIN."); return; }
        processWalletPayment(enteredPin, { printLicense: true, bookId: cleanId });
        setShowPinModal(false);
        setEnteredPin("");
    };

    /* ── Resolve the printable URL ── */
    const getPrintUrl = () => {
        if (book?.pdfUrl) return book.pdfUrl;
        if (book?.driveFileId) return `https://drive.google.com/uc?export=download&id=${book.driveFileId}`;
        if (book?.embedUrl) {
            const m = book.embedUrl.match(/\/d\/([\w-]{25,})|id=([\w-]{25,})/);
            if (m) return `https://drive.google.com/uc?export=download&id=${m[1] || m[2]}`;
            return book.embedUrl;
        }
        return null;
    };

    const handlePrint = () => {
        const url = getPrintUrl();
        if (!url) { alert("Document URL not available. Contact support."); return; }
        printDocument(url);
    };

    const navyBtn = {
        width: "100%", background: NAVY, color: "#fff",
        padding: "15px 24px", border: "none", fontSize: "13px",
        fontWeight: 700, cursor: "pointer", fontFamily: "'Lato',sans-serif",
        letterSpacing: "0.06em", transition: "background 0.18s",
        display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
    };

    /* ── Loading ── */
    if (loading) return (
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: BG }}>
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
            <div style={{ textAlign: "center" }}>
                <div style={{ width: "48px", height: "48px", border: `3px solid ${GOLD}`, borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 14px" }} />
                <p style={{ fontFamily: "'Playfair Display',serif", fontSize: "16px", color: NAVY }}>Loading document…</p>
            </div>
        </div>
    );

    if (error || !book) return (
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: BG, padding: "16px" }}>
            <div style={{ background: "#fff", border: "0.5px solid #e5ddd0", padding: "40px 32px", maxWidth: "400px", width: "100%", textAlign: "center" }}>
                <AlertCircle size={32} style={{ color: "#ef4444", margin: "0 auto 16px" }} />
                <p style={{ fontFamily: "'Playfair Display',serif", fontSize: "20px", fontWeight: 700, color: NAVY, margin: "0 0 8px" }}>Unavailable</p>
                <p style={{ fontSize: "13px", color: "#666", margin: "0 0 24px" }}>{error || "Book not found."}</p>
                <button onClick={() => router.back()} style={{ ...navyBtn, width: "auto", padding: "12px 28px" }}>GO BACK</button>
            </div>
        </div>
    );

    if (isGloballyFrozen) return (
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: BG, padding: "16px" }}>
            <div style={{ background: "#fff", border: "0.5px solid #e5ddd0", padding: "40px 32px", maxWidth: "420px", width: "100%", textAlign: "center" }}>
                <div style={{ fontSize: "40px", marginBottom: "16px" }}>❄️</div>
                <p style={{ fontFamily: "'Playfair Display',serif", fontSize: "20px", fontWeight: 700, color: NAVY, margin: "0 0 8px" }}>Document Frozen</p>
                <p style={{ fontSize: "13px", color: "#666", margin: "0 0 24px", lineHeight: 1.7 }}>
                    This document has been frozen by platform administration. Print licensing is not available.{" "}
                    Contact <a href="mailto:legal@lanlibrary.com" style={{ color: GOLD }}>legal@lanlibrary.com</a>.
                </p>
                <button onClick={() => router.back()} style={{ ...navyBtn, width: "auto", padding: "12px 28px" }}>GO BACK</button>
            </div>
        </div>
    );

    if (!isPrintLicensingEnabled) return (
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: BG, padding: "16px" }}>
            <div style={{ background: "#fff", border: "0.5px solid #e5ddd0", padding: "40px 32px", maxWidth: "420px", width: "100%", textAlign: "center" }}>
                <Lock size={32} style={{ color: "#aaa", margin: "0 auto 16px" }} />
                <p style={{ fontFamily: "'Playfair Display',serif", fontSize: "20px", fontWeight: 700, color: NAVY, margin: "0 0 8px" }}>Not Available</p>
                <p style={{ fontSize: "13px", color: "#666", margin: "0 0 24px" }}>The author has not enabled print licensing for this document.</p>
                <button onClick={() => router.back()} style={{ ...navyBtn, width: "auto", padding: "12px 28px" }}>GO BACK</button>
            </div>
        </div>
    );

    /* ══ MAIN PAGE ══ */
    return (
        <>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900&family=Lato:wght@300;400;700&display=swap');
                @keyframes spin { to { transform: rotate(360deg); } }
                @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }
                * { box-sizing: border-box; }
                body { background: ${BG}; font-family: 'Lato', sans-serif; margin: 0; }
                @media(min-width:1024px){ .plr-grid { grid-template-columns: 1fr 320px !important; } }
            `}</style>

            <div style={{ minHeight: "100vh", background: BG }}>

                {/* ── Header ── */}
                <header style={{ background: NAVY, padding: "0 16px", height: "56px", display: "flex", alignItems: "center", gap: "12px", position: "sticky", top: 0, zIndex: 40, borderBottom: "0.5px solid rgba(184,150,62,0.2)" }}>
                    <button onClick={() => router.back()} style={{ width: "34px", height: "34px", border: "0.5px solid rgba(255,255,255,0.2)", background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(255,255,255,0.7)", flexShrink: 0 }}>
                        <ArrowLeft size={16} />
                    </button>
                    <div>
                        <p style={{ fontFamily: "'Playfair Display',serif", fontSize: "14px", fontWeight: 700, color: "#fff", margin: 0 }}>[LAN Library]</p>
                        <p style={{ fontSize: "9px", color: GOLD, fontFamily: "'Lato',sans-serif", fontWeight: 700, letterSpacing: "0.1em", margin: 0, textTransform: "uppercase" }}>Print License Request</p>
                    </div>
                </header>

                <main style={{ maxWidth: "900px", margin: "0 auto", padding: "24px 16px" }}>
                    <div style={{ marginBottom: "24px" }}>
                        <p style={{ fontSize: "9px", fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: GOLD, margin: "0 0 4px", fontFamily: "'Lato',sans-serif" }}>Hard-Copy Licensing</p>
                        <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: "26px", fontWeight: 700, color: NAVY, margin: 0 }}>Request Print License</h1>
                    </div>

                    <div className="plr-grid" style={{ display: "grid", gridTemplateColumns: "1fr", gap: "16px" }}>

                        {/* ── LEFT: form ── */}
                        <div>
                            {/* Book card */}
                            <div style={{ background: "#fff", border: "0.5px solid #e5ddd0", padding: "20px", marginBottom: "16px" }}>
                                <div style={{ display: "flex", gap: "16px", alignItems: "flex-start" }}>
                                    <div style={{ position: "relative", flexShrink: 0 }}>
                                        <img src={getThumbnailUrl(book)} alt={book.title}
                                            style={{ width: "80px", aspectRatio: "3/4", objectFit: "cover", display: "block", border: "0.5px solid #e5ddd0" }}
                                            onError={e => { e.target.src = "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400"; }} />
                                        <span style={{ position: "absolute", top: "4px", left: "4px", background: NAVY, color: GOLD, fontSize: "7px", fontWeight: 700, padding: "2px 5px", fontFamily: "'Lato',sans-serif" }}>PDF</span>
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <p style={{ fontSize: "9px", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: GOLD, margin: "0 0 4px", fontFamily: "'Lato',sans-serif" }}>{book.category}</p>
                                        <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: "16px", fontWeight: 700, color: NAVY, margin: "0 0 4px", lineHeight: 1.3 }}>{book.title}</h2>
                                        <p style={{ fontSize: "12px", color: "#888", margin: "0 0 8px", fontFamily: "'Lato',sans-serif" }}>by {book.author}</p>
                                        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                                            <span style={{ fontSize: "11px", color: "#aaa", fontFamily: "'Lato',sans-serif", display: "flex", alignItems: "center", gap: "4px" }}>
                                                <FileText size={11} /> {book.pages} pages
                                            </span>
                                            <span style={{ fontSize: "11px", color: "#aaa", fontFamily: "'Lato',sans-serif" }}>
                                                Uploaded by <strong style={{ color: "#555" }}>{book.sellerName}</strong>
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Policy notice */}
                            <div style={{ background: "rgba(184,150,62,0.06)", border: "0.5px solid rgba(184,150,62,0.25)", padding: "16px", marginBottom: "16px", display: "flex", alignItems: "flex-start", gap: "12px" }}>
                                <Shield size={16} style={{ color: GOLD, flexShrink: 0, marginTop: "2px" }} />
                                <div>
                                    <p style={{ fontSize: "12px", fontWeight: 700, color: NAVY, margin: "0 0 4px", fontFamily: "'Lato',sans-serif" }}>Local Self-Print License</p>
                                    <p style={{ fontSize: "11px", color: "#777", lineHeight: 1.65, margin: 0, fontFamily: "'Lato',sans-serif" }}>
                                        This is <strong>not</strong> a delivery order. You are paying the author <strong style={{ color: NAVY }}>{book.sellerName}</strong> for a one-time personal print license. The document will print <strong>directly to your connected printer</strong> — no files are downloaded or opened in a new tab. Reselling, sharing, or scanning the printed copy violates LAN's IP policy.
                                    </p>
                                </div>
                            </div>

                            {/* Payment method */}
                            <div style={{ background: "#fff", border: "0.5px solid #e5ddd0", padding: "20px", marginBottom: "16px" }}>
                                <p style={{ fontSize: "9px", fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: GOLD, margin: "0 0 4px", fontFamily: "'Lato',sans-serif" }}>Step 1</p>
                                <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: "16px", fontWeight: 700, color: NAVY, margin: "0 0 16px" }}>Payment Method</h3>
                                <PaymentMethodSelector paymentMethod={paymentMethod} setPaymentMethod={setPaymentMethod} />
                            </div>

                            {/* Contact details */}
                            <div style={{ background: "#fff", border: "0.5px solid #e5ddd0", padding: "20px", marginBottom: "16px" }}>
                                <p style={{ fontSize: "9px", fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: GOLD, margin: "0 0 4px", fontFamily: "'Lato',sans-serif" }}>Step 2</p>
                                <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: "16px", fontWeight: 700, color: NAVY, margin: "0 0 16px" }}>Your Details</h3>
                                {[
                                    { name: "name", label: "Full Name", type: "text", placeholder: "Your full name" },
                                    { name: "email", label: "Email Address", type: "email", placeholder: "your@email.com" },
                                    { name: "phone", label: "Phone Number", type: "tel", placeholder: "+234 800 000 0000" },
                                ].map(({ name, label, type, placeholder }) => (
                                    <div key={name} style={{ marginBottom: "12px" }}>
                                        <label style={{ display: "block", fontSize: "10px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#aaa", marginBottom: "6px", fontFamily: "'Lato',sans-serif" }}>{label}</label>
                                        <input type={type} value={formData[name]} onChange={e => setFormData({ ...formData, [name]: e.target.value })} placeholder={placeholder}
                                            style={{ width: "100%", padding: "12px 14px", border: "0.5px solid #e5ddd0", background: CREAM, fontSize: "13px", color: NAVY, fontFamily: "'Lato',sans-serif", outline: "none" }}
                                            onFocus={e => e.target.style.borderColor = GOLD}
                                            onBlur={e => e.target.style.borderColor = "#e5ddd0"} />
                                    </div>
                                ))}
                            </div>

                            {/* Terms */}
                            <div style={{ background: "#fff", border: "0.5px solid #e5ddd0", padding: "16px", marginBottom: "16px", display: "flex", alignItems: "flex-start", gap: "12px" }}>
                                <input type="checkbox" id="terms" checked={acceptedTerms} onChange={e => setAcceptedTerms(e.target.checked)}
                                    style={{ marginTop: "2px", accentColor: NAVY, flexShrink: 0, width: "16px", height: "16px" }} />
                                <label htmlFor="terms" style={{ fontSize: "12px", color: "#555", lineHeight: 1.65, cursor: "pointer", fontFamily: "'Lato',sans-serif" }}>
                                    I agree to print this document <strong style={{ color: NAVY }}>solely for personal study</strong>. I understand that duplicating, scanning, sharing, or reselling physical copies of <strong style={{ color: NAVY }}>{book.sellerName}</strong>'s work violates LAN Library's intellectual property policy and applicable law.
                                </label>
                            </div>

                            {/* Error */}
                            {paymentError && (
                                <div style={{ background: "#fff1f2", border: "0.5px solid #fca5a5", padding: "12px 16px", marginBottom: "16px", display: "flex", alignItems: "center", gap: "10px" }}>
                                    <AlertCircle size={14} style={{ color: "#ef4444", flexShrink: 0 }} />
                                    <p style={{ fontSize: "12px", color: "#dc2626", margin: 0, fontFamily: "'Lato',sans-serif" }}>{paymentError?.message || String(paymentError)}</p>
                                </div>
                            )}

                            {/* Pay button */}
                            <button onClick={handlePayment} disabled={processing || !acceptedTerms}
                                style={{ ...navyBtn, opacity: processing || !acceptedTerms ? 0.5 : 1, cursor: processing || !acceptedTerms ? "not-allowed" : "pointer" }}
                                onMouseEnter={e => { if (!processing && acceptedTerms) e.currentTarget.style.background = "#1a3a6e"; }}
                                onMouseLeave={e => e.currentTarget.style.background = NAVY}>
                                {processing ? (
                                    <><div style={{ width: "14px", height: "14px", border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />PROCESSING…</>
                                ) : (
                                    <><Printer size={15} /> PAY ₦{licenseFee.toLocaleString()} — GET PRINT LICENSE</>
                                )}
                            </button>
                        </div>

                        {/* ── RIGHT: summary ── */}
                        <div>
                            <div style={{ background: "#fff", border: "0.5px solid #e5ddd0", padding: "20px", position: "sticky", top: "72px" }}>
                                <p style={{ fontSize: "9px", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: GOLD, margin: "0 0 16px", fontFamily: "'Lato',sans-serif" }}>License Fee Summary</p>

                                <div style={{ background: NAVY, backgroundImage: "radial-gradient(rgba(184,150,62,0.07) 1px,transparent 1px)", backgroundSize: "20px 20px", border: "0.5px solid rgba(184,150,62,0.25)", padding: "18px 20px", marginBottom: "16px" }}>
                                    <p style={{ fontSize: "9px", fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(184,150,62,0.7)", margin: "0 0 4px", fontFamily: "'Lato',sans-serif" }}>License fee</p>
                                    <p style={{ fontFamily: "'Playfair Display',serif", fontSize: "32px", fontWeight: 900, color: "#fff", margin: 0, lineHeight: 1 }}>₦{licenseFee.toLocaleString()}</p>
                                    <p style={{ fontSize: "10px", color: "rgba(255,255,255,0.4)", margin: "6px 0 0", fontFamily: "'Lato',sans-serif" }}>₦10 × {book.pages} pages</p>
                                </div>

                                {[
                                    ["Document", book.title?.length > 28 ? book.title.slice(0, 28) + "…" : book.title],
                                    ["Pages", `${book.pages} pages`],
                                    ["Rate per page", "₦10.00"],
                                    ["Author royalty (80%)", `₦${Math.round(licenseFee * 0.8).toLocaleString()}`],
                                    ["Platform fee (20%)", `₦${Math.round(licenseFee * 0.2).toLocaleString()}`],
                                    ["Total you pay", `₦${licenseFee.toLocaleString()}`],
                                ].map(([k, v], i, arr) => (
                                    <div key={k} style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", padding: "7px 0", borderBottom: i < arr.length - 1 ? "0.5px solid #f0ebe0" : "none", fontFamily: "'Lato',sans-serif" }}>
                                        <span style={{ color: i === arr.length - 1 ? NAVY : "#aaa", fontWeight: i === arr.length - 1 ? 700 : 400 }}>{k}</span>
                                        <span style={{ fontWeight: 700, color: i === arr.length - 1 ? NAVY : "#555" }}>{v}</span>
                                    </div>
                                ))}

                                {sellerDetails && (
                                    <div style={{ marginTop: "16px", background: CREAM, border: "0.5px solid rgba(184,150,62,0.2)", padding: "12px" }}>
                                        <p style={{ fontSize: "9px", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: GOLD, margin: "0 0 6px", fontFamily: "'Lato',sans-serif" }}>Paid to author</p>
                                        <p style={{ fontSize: "13px", fontWeight: 700, color: NAVY, margin: 0, fontFamily: "'Lato',sans-serif" }}>{sellerDetails.name}</p>
                                    </div>
                                )}

                                <div style={{ marginTop: "12px", padding: "10px 12px", background: "rgba(22,163,74,0.06)", border: "0.5px solid rgba(22,163,74,0.2)" }}>
                                    <p style={{ fontSize: "10px", color: "#555", margin: 0, lineHeight: 1.6, fontFamily: "'Lato',sans-serif" }}>
                                        🔒 Payments processed securely via Flutterwave or your LAN Wallet.
                                    </p>
                                </div>
                            </div>
                        </div>

                    </div>
                </main>
            </div>

            {/* ══ PRINT LICENSE MODAL ══ */}
            {showPrintModal && book && (
                <>
                    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 300 }} />
                    <div style={{ position: "fixed", inset: 0, zIndex: 301, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}>
                        <div style={{ background: "#fff", width: "100%", maxWidth: "480px", border: "0.5px solid rgba(184,150,62,0.3)", overflow: "hidden", maxHeight: "90vh", overflowY: "auto" }}>

                            {/* Header */}
                            <div style={{ background: NAVY, padding: "20px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                <div>
                                    <p style={{ fontSize: "9px", color: GOLD, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", margin: "0 0 2px", fontFamily: "'Lato',sans-serif" }}>License Issued</p>
                                    <p style={{ fontFamily: "'Playfair Display',serif", fontSize: "18px", fontWeight: 700, color: "#fff", margin: 0 }}>Ready to Print!</p>
                                </div>
                                <div style={{ width: "44px", height: "44px", background: "rgba(22,163,74,0.2)", border: "0.5px solid rgba(22,163,74,0.4)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                    <CheckCircle size={22} style={{ color: "#86efac" }} />
                                </div>
                            </div>

                            <div style={{ padding: "24px" }}>

                                {/* Success */}
                                <div style={{ background: "rgba(22,163,74,0.06)", border: "0.5px solid rgba(22,163,74,0.2)", padding: "14px 16px", marginBottom: "20px", display: "flex", alignItems: "flex-start", gap: "10px" }}>
                                    <CheckCircle size={15} style={{ color: "#16a34a", flexShrink: 0, marginTop: "1px" }} />
                                    <div>
                                        <p style={{ fontSize: "12px", fontWeight: 700, color: "#15803d", margin: "0 0 2px", fontFamily: "'Lato',sans-serif" }}>
                                            Payment confirmed — ₦{licenseFee.toLocaleString()}
                                        </p>
                                        <p style={{ fontSize: "11px", color: "#666", margin: 0, fontFamily: "'Lato',sans-serif" }}>
                                            Your print license for <strong>{book.title}</strong> is active. Click the button below to print directly.
                                        </p>
                                    </div>
                                </div>

                                {/* Book info */}
                                <div style={{ display: "flex", gap: "14px", alignItems: "center", padding: "14px", background: CREAM, border: "0.5px solid #e5ddd0", marginBottom: "20px" }}>
                                    <img src={getThumbnailUrl(book)} alt={book.title}
                                        style={{ width: "56px", aspectRatio: "3/4", objectFit: "cover", flexShrink: 0, border: "0.5px solid #e5ddd0" }}
                                        onError={e => { e.target.src = "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400"; }} />
                                    <div>
                                        <p style={{ fontSize: "13px", fontWeight: 700, color: NAVY, margin: "0 0 2px", fontFamily: "'Playfair Display',serif" }}>{book.title}</p>
                                        <p style={{ fontSize: "11px", color: "#888", margin: "0 0 4px", fontFamily: "'Lato',sans-serif" }}>by {book.author}</p>
                                        <p style={{ fontSize: "10px", color: GOLD, fontWeight: 700, fontFamily: "'Lato',sans-serif", display: "flex", alignItems: "center", gap: "4px" }}>
                                            <FileText size={10} /> {book.pages} pages · Personal print license
                                        </p>
                                    </div>
                                </div>

                                {/* Printer status banner */}
                                {printerStatus === "checking" && (
                                    <div style={{ background: "rgba(184,150,62,0.06)", border: "0.5px solid rgba(184,150,62,0.25)", padding: "12px 14px", marginBottom: "16px", display: "flex", alignItems: "center", gap: "10px" }}>
                                        <div style={{ width: "12px", height: "12px", border: `2px solid ${GOLD}`, borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.7s linear infinite", flexShrink: 0 }} />
                                        <p style={{ fontSize: "11px", color: "#777", margin: 0, fontFamily: "'Lato',sans-serif" }}>Checking for connected printers…</p>
                                    </div>
                                )}

                                {/* Print error */}
                                {printError && (
                                    <div style={{ background: "#fff1f2", border: "0.5px solid #fca5a5", padding: "12px 14px", marginBottom: "16px", display: "flex", alignItems: "flex-start", gap: "10px" }}>
                                        <AlertCircle size={14} style={{ color: "#ef4444", flexShrink: 0, marginTop: "1px" }} />
                                        <p style={{ fontSize: "12px", color: "#dc2626", margin: 0, fontFamily: "'Lato',sans-serif" }}>{printError}</p>
                                    </div>
                                )}

                                {/* How it works — no new tab, printer only */}
                                <div style={{ marginBottom: "20px" }}>
                                    <p style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: GOLD, margin: "0 0 12px", fontFamily: "'Lato',sans-serif" }}>What happens when you click Print</p>
                                    {[
                                        { step: "1", text: "Your browser's native print dialog opens — no new tab, no download." },
                                        { step: "2", text: "Select your connected printer from the dialog. If no printer appears, connect one first." },
                                        { step: "3", text: "Confirm and print. One copy is permitted under this license." },
                                        { step: "4", text: "The document is never saved to your device — it prints directly." },
                                    ].map(({ step, text }) => (
                                        <div key={step} style={{ display: "flex", gap: "12px", alignItems: "flex-start", marginBottom: "10px" }}>
                                            <div style={{ width: "24px", height: "24px", background: NAVY, color: GOLD, fontSize: "10px", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontFamily: "'Lato',sans-serif" }}>{step}</div>
                                            <p style={{ fontSize: "12px", color: "#555", margin: 0, lineHeight: 1.65, fontFamily: "'Lato',sans-serif", paddingTop: "4px" }}>{text}</p>
                                        </div>
                                    ))}
                                </div>

                                {/* No printer warning */}
                                <div style={{ background: "rgba(13,34,68,0.04)", border: "0.5px solid rgba(13,34,68,0.12)", padding: "12px 14px", marginBottom: "20px", display: "flex", alignItems: "flex-start", gap: "8px" }}>
                                    <Printer size={13} style={{ color: NAVY, flexShrink: 0, marginTop: "2px" }} />
                                    <p style={{ fontSize: "11px", color: "#555", margin: 0, lineHeight: 1.6, fontFamily: "'Lato',sans-serif" }}>
                                        <strong style={{ color: NAVY }}>Printer required.</strong> Make sure a printer is connected and set as your default before clicking Print. If no printer is listed in the dialog, this action cannot complete.
                                    </p>
                                </div>

                                {/* IP warning */}
                                <div style={{ background: "rgba(184,150,62,0.06)", border: "0.5px solid rgba(184,150,62,0.2)", padding: "12px 14px", marginBottom: "20px", display: "flex", alignItems: "flex-start", gap: "8px" }}>
                                    <Shield size={13} style={{ color: GOLD, flexShrink: 0, marginTop: "2px" }} />
                                    <p style={{ fontSize: "11px", color: "#777", margin: 0, lineHeight: 1.6, fontFamily: "'Lato',sans-serif" }}>
                                        This license permits <strong style={{ color: NAVY }}>one personal print copy only</strong>. Scanning, duplicating, or sharing the printed copy violates LAN's IP policy and applicable copyright law.
                                    </p>
                                </div>

                                {/* ── PRINT BUTTON — only action, no link ── */}
                                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                                    <button
                                        onClick={handlePrint}
                                        disabled={silentPrinting}
                                        style={{
                                            ...navyBtn,
                                            opacity: silentPrinting ? 0.6 : 1,
                                            cursor: silentPrinting ? "not-allowed" : "pointer",
                                            background: silentPrinting ? "#1a3a6e" : NAVY,
                                        }}
                                        onMouseEnter={e => { if (!silentPrinting) e.currentTarget.style.background = "#1a3a6e"; }}
                                        onMouseLeave={e => e.currentTarget.style.background = silentPrinting ? "#1a3a6e" : NAVY}
                                    >
                                        {silentPrinting ? (
                                            <>
                                                <div style={{ width: "14px", height: "14px", border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
                                                SENDING TO PRINTER…
                                            </>
                                        ) : (
                                            <><Printer size={15} /> PRINT DOCUMENT NOW</>
                                        )}
                                    </button>

                                    <button onClick={() => router.push(`/book/preview?id=${cleanId}`)}
                                        style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", background: "transparent", color: NAVY, padding: "12px 24px", fontSize: "12px", fontWeight: 700, border: "0.5px solid #e5ddd0", cursor: "pointer", fontFamily: "'Lato',sans-serif", letterSpacing: "0.04em" }}>
                                        <ArrowLeft size={13} /> Back to Document
                                    </button>
                                </div>

                            </div>
                        </div>
                    </div>
                </>
            )}

            {/* ══ PIN Modal ══ */}
            {showPinModal && (
                <>
                    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 200 }} onClick={() => setShowPinModal(false)} />
                    <div style={{ position: "fixed", inset: 0, zIndex: 201, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}>
                        <div style={{ background: "#fff", width: "100%", maxWidth: "360px", border: "0.5px solid rgba(184,150,62,0.3)", overflow: "hidden" }}>
                            <div style={{ background: NAVY, padding: "18px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                <div>
                                    <p style={{ fontSize: "9px", color: GOLD, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", margin: "0 0 2px", fontFamily: "'Lato',sans-serif" }}>Wallet payment</p>
                                    <p style={{ fontFamily: "'Playfair Display',serif", fontSize: "16px", fontWeight: 700, color: "#fff", margin: 0 }}>Enter Your PIN</p>
                                </div>
                                <button onClick={() => setShowPinModal(false)} style={{ background: "transparent", border: "0.5px solid rgba(255,255,255,0.2)", cursor: "pointer", width: "30px", height: "30px", display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(255,255,255,0.6)" }}>
                                    <X size={14} />
                                </button>
                            </div>
                            <div style={{ padding: "20px" }}>
                                <p style={{ fontSize: "12px", color: "#888", textAlign: "center", marginBottom: "16px", fontFamily: "'Lato',sans-serif" }}>
                                    Authorise payment of <strong style={{ color: NAVY }}>₦{licenseFee.toLocaleString()}</strong>
                                </p>
                                {pinError && (
                                    <div style={{ background: "#fff1f2", border: "0.5px solid #fca5a5", padding: "10px 12px", marginBottom: "12px", fontSize: "12px", color: "#dc2626", fontFamily: "'Lato',sans-serif" }}>{pinError}</div>
                                )}
                                <div style={{ display: "flex", justifyContent: "center", gap: "10px", marginBottom: "16px" }}>
                                    {Array.from({ length: 4 }, (_, i) => (
                                        <div key={i} style={{ width: "50px", height: "50px", border: `1.5px solid ${i < enteredPin.length ? NAVY : "#e5ddd0"}`, background: i < enteredPin.length ? CREAM : "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px", color: i < enteredPin.length ? NAVY : "#e5ddd0" }}>
                                            {i < enteredPin.length ? "●" : "○"}
                                        </div>
                                    ))}
                                </div>
                                <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "6px", marginBottom: "6px" }}>
                                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => (
                                        <button key={n} onClick={() => { if (enteredPin.length < 4) { setEnteredPin(p => p + n); setPinError(""); } }}
                                            style={{ height: "48px", border: "0.5px solid #e5ddd0", background: "#fff", fontSize: "18px", fontWeight: 700, color: NAVY, cursor: "pointer", fontFamily: "'Lato',sans-serif" }}>
                                            {n}
                                        </button>
                                    ))}
                                </div>
                                <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "6px", marginBottom: "16px" }}>
                                    <div />
                                    <button onClick={() => { if (enteredPin.length < 4) { setEnteredPin(p => p + "0"); setPinError(""); } }}
                                        style={{ height: "48px", border: "0.5px solid #e5ddd0", background: "#fff", fontSize: "18px", fontWeight: 700, color: NAVY, cursor: "pointer" }}>0</button>
                                    <button onClick={() => setEnteredPin(p => p.slice(0, -1))}
                                        style={{ height: "48px", border: "0.5px solid #e5ddd0", background: "#fff", fontSize: "18px", color: "#aaa", cursor: "pointer" }}>⌫</button>
                                </div>
                                <button onClick={handlePinConfirm} disabled={enteredPin.length < 4}
                                    style={{ ...navyBtn, opacity: enteredPin.length < 4 ? 0.4 : 1, cursor: enteredPin.length < 4 ? "not-allowed" : "pointer" }}>
                                    CONFIRM PAYMENT
                                </button>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </>
    );
}