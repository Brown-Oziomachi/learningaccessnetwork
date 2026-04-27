"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  ArrowRight, Copy, Check, Loader2, CheckCircle2, AlertCircle,
  ArrowUpRight, Wallet, Search, Lock, Eye, EyeOff, X, ArrowDownLeft,
} from "lucide-react";
import Navbar from "@/components/NavBar";
import { onAuthStateChanged } from "firebase/auth";
import {
  doc, getDoc, collection, query, where,
  getDocs, runTransaction, serverTimestamp,
  increment, orderBy, limit, updateDoc,
} from "firebase/firestore";
import { auth, db } from "@/lib/firebaseConfig";
import TransferReceipt, { TransferReceiptModal } from "@/components/Transferreceipt";
import Link from "next/link";
import { Smartphone } from "lucide-react";

/* ─── colour tokens ─────────────────────────────────────────── */
const NAVY  = "#0d2244";
const GOLD  = "#b8963e";
const GOLDD = "#d4aa5a";
const CREAM = "#f5f0e8";
const BG    = "#f5f1ea";

/* ─── helpers ───────────────────────────────────────────────── */
export const generateAccountNumber = () => {
  const digits = Math.floor(1000000 + Math.random() * 9000000);
  return `LAN${digits}`;
};

const formatAccountNumber = (acc) => {
  if (!acc) return "";
  const num = acc.replace("LAN", "");
  return `LAN-${num.slice(0, 3)}-${num.slice(3)}`;
};

/* ─── shared inline style objects ───────────────────────────── */
const inputStyle = (focus) => ({
  width: "100%",
  padding: "11px 13px",
  border: `0.5px solid ${focus ? GOLD : "#e5ddd0"}`,
  background: CREAM,
  fontSize: "13px",
  color: NAVY,
  fontFamily: "'Lato', sans-serif",
  outline: "none",
  boxSizing: "border-box",
  transition: "border-color 0.18s",
});

const navyBtn = (disabled) => ({
  width: "100%",
  background: disabled ? "#aaa" : NAVY,
  color: "#fff",
  padding: "13px",
  border: "none",
  fontSize: "12px",
  fontWeight: 700,
  cursor: disabled ? "not-allowed" : "pointer",
  fontFamily: "'Lato', sans-serif",
  letterSpacing: "0.06em",
  transition: "background 0.18s",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "8px",
  opacity: disabled ? 0.5 : 1,
});

const goldBtn = (disabled) => ({
  width: "100%",
  background: disabled ? "#ccc" : GOLD,
  color: NAVY,
  padding: "13px",
  border: "none",
  fontSize: "12px",
  fontWeight: 700,
  cursor: disabled ? "not-allowed" : "pointer",
  fontFamily: "'Lato', sans-serif",
  letterSpacing: "0.06em",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "8px",
  opacity: disabled ? 0.5 : 1,
});

const sectionCard = {
  background: "#fff",
  border: `0.5px solid #e5ddd0`,
  padding: "22px",
  marginBottom: "16px",
};

const eyebrow = {
  fontSize: "9px",
  fontWeight: 700,
  letterSpacing: "0.18em",
  textTransform: "uppercase",
  color: GOLD,
  marginBottom: "4px",
  fontFamily: "'Lato', sans-serif",
};

/* ─── PIN Input Grid ─────────────────────────────────────────── */
function PinInput({ value, onChange, disabled = false, masked = true }) {
  const inputs = useRef([]);

  const handleChange = (i, e) => {
    const v = e.target.value.replace(/\D/g, "").slice(-1);
    const arr = value.split("");
    arr[i] = v;
    const next = arr.join("").slice(0, 4);
    onChange(next);
    if (v && i < 3) inputs.current[i + 1]?.focus();
  };

  const handleKeyDown = (i, e) => {
    if (e.key === "Backspace" && !value[i] && i > 0) {
      inputs.current[i - 1]?.focus();
      const arr = value.split("");
      arr[i - 1] = "";
      onChange(arr.join(""));
    }
  };

  const handlePaste = (e) => {
    const paste = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 4);
    onChange(paste);
    inputs.current[Math.min(paste.length, 3)]?.focus();
    e.preventDefault();
  };

  useEffect(() => { inputs.current[0]?.focus(); }, []);

  return (
    <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
      {[0, 1, 2, 3].map((i) => (
        <input
          key={i}
          ref={(el) => (inputs.current[i] = el)}
          type={masked ? "password" : "text"}
          inputMode="numeric"
          maxLength={1}
          value={value[i] || ""}
          onChange={(e) => handleChange(i, e)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={handlePaste}
          disabled={disabled}
          style={{
            width: "52px",
            height: "54px",
            textAlign: "center",
            fontSize: "22px",
            fontWeight: 700,
            border: `1.5px solid ${value[i] ? NAVY : "#e5ddd0"}`,
            background: value[i] ? CREAM : "#fff",
            color: NAVY,
            outline: "none",
            fontFamily: "'Lato', sans-serif",
            transition: "all 0.15s",
            opacity: disabled ? 0.4 : 1,
          }}
        />
      ))}
    </div>
  );
}

/* ─── CREATE PIN SCREEN ─────────────────────────────────────── */
function CreatePinScreen({ onSave }) {
  const [step, setStep]           = useState(1);
  const [pin, setPin]             = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [masked, setMasked]       = useState(true);
  const [error, setError]         = useState("");
  const [saving, setSaving]       = useState(false);
  const [done, setDone]           = useState(false);

  const handleNext = () => {
    if (pin.length < 4) { setError("Please enter all 4 digits"); return; }
    setError(""); setStep(2); setConfirmPin("");
  };

  const handleSave = async () => {
    if (confirmPin.length < 4) { setError("Please enter all 4 digits"); return; }
    if (confirmPin !== pin) { setError("PINs don't match. Try again."); setConfirmPin(""); return; }
    setError(""); setSaving(true);
    try { await onSave(pin); setDone(true); }
    catch { setError("Failed to save PIN. Please try again."); }
    finally { setSaving(false); }
  };

  const modalHeader = {
    background: NAVY,
    backgroundImage: "radial-gradient(rgba(184,150,62,0.06) 1px,transparent 1px)",
    backgroundSize: "24px 24px",
    padding: "28px 32px",
    textAlign: "center",
    borderBottom: `0.5px solid rgba(184,150,62,0.2)`,
  };

  if (done) return (
    <>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=Lato:wght@300;400;700&display=swap');`}</style>
      <div style={{ minHeight: "100vh", background: BG, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Lato', sans-serif" }}>
        <div style={{ background: "#fff", border: `0.5px solid #e5ddd0`, padding: "48px 40px", maxWidth: "380px", width: "100%", textAlign: "center" }}>
          <div style={{ width: "64px", height: "64px", border: `0.5px solid rgba(22,163,74,0.3)`, background: "rgba(22,163,74,0.06)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
            <CheckCircle2 size={28} style={{ color: "#16a34a" }} />
          </div>
          <p style={{ ...eyebrow, textAlign: "center" }}>Success</p>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "22px", fontWeight: 700, color: NAVY, marginBottom: "8px" }}>PIN Created!</h2>
          <p style={{ fontSize: "13px", color: "#888" }}>You can now make transfers securely.</p>
          <div style={{ marginTop: "20px", width: "20px", height: "20px", border: `2px solid ${GOLD}`, borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "20px auto 0" }} />
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
      </div>
    </>
  );

  return (
    <>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400&family=Lato:wght@300;400;700&display=swap'); @keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ minHeight: "100vh", background: BG, fontFamily: "'Lato', sans-serif" }}>
        <Navbar />
        {/* Hero */}
        <div style={{ background: NAVY, backgroundImage: "radial-gradient(rgba(184,150,62,0.07) 1px,transparent 1px)", backgroundSize: "28px 28px", padding: "48px 24px 40px", textAlign: "center" }}>
          <div style={{ width: "56px", height: "56px", border: `0.5px solid rgba(184,150,62,0.3)`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
            <Lock size={24} style={{ color: GOLD }} />
          </div>
          <p style={{ ...eyebrow, color: GOLDD, textAlign: "center" }}>Security</p>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "28px", fontWeight: 900, color: "#fff", margin: "4px 0 10px" }}>Secure Your Transfers</h1>
          <p style={{ fontSize: "14px", color: "rgba(245,240,232,0.65)", maxWidth: "380px", margin: "0 auto", lineHeight: 1.7, fontWeight: 300 }}>
            Create a 4-digit PIN required every time you send money
          </p>
          {/* Step dots */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 0, marginTop: "28px" }}>
            {[1, 2].map((s, idx) => (
              <React.Fragment key={s}>
                <div style={{ width: "30px", height: "30px", borderRadius: "50%", background: step >= s ? GOLD : "rgba(255,255,255,0.1)", color: step >= s ? NAVY : "rgba(255,255,255,0.4)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: 700, transition: "all 0.2s" }}>{s}</div>
                {idx === 0 && <div style={{ width: "48px", height: "0.5px", background: step >= 2 ? GOLD : "rgba(255,255,255,0.15)" }} />}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Form */}
        <div style={{ maxWidth: "420px", margin: "0 auto", padding: "32px 20px" }}>
          <div style={{ background: "#fff", border: `0.5px solid #e5ddd0`, padding: "28px" }}>
            {step === 1 ? (
              <>
                <p style={{ ...eyebrow }}>Step 1 of 2</p>
                <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "20px", fontWeight: 700, color: NAVY, marginBottom: "20px" }}>Create Your PIN</h2>
                <p style={{ fontSize: "12px", color: "#888", textAlign: "center", marginBottom: "20px" }}>Choose a 4-digit PIN you'll remember</p>
                <PinInput value={pin} onChange={setPin} masked={masked} />
                <button onClick={() => setMasked((m) => !m)} style={{ display: "flex", alignItems: "center", gap: "5px", margin: "12px auto 0", background: "none", border: "none", cursor: "pointer", color: "#aaa", fontSize: "11px", fontFamily: "'Lato', sans-serif" }}>
                  {masked ? <Eye size={12} /> : <EyeOff size={12} />}
                  {masked ? "Show PIN" : "Hide PIN"}
                </button>
                {error && <p style={{ fontSize: "12px", color: "#dc2626", textAlign: "center", marginTop: "12px" }}>{error}</p>}
                <button onClick={handleNext} disabled={pin.length < 4} style={{ ...navyBtn(pin.length < 4), marginTop: "20px" }}>
                  Continue <ArrowRight size={14} />
                </button>
              </>
            ) : (
              <>
                <p style={{ ...eyebrow }}>Step 2 of 2</p>
                <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "20px", fontWeight: 700, color: NAVY, marginBottom: "20px" }}>Confirm Your PIN</h2>
                <p style={{ fontSize: "12px", color: "#888", textAlign: "center", marginBottom: "20px" }}>Enter the same PIN again to confirm</p>
                <PinInput value={confirmPin} onChange={setConfirmPin} masked={masked} />
                <button onClick={() => setMasked((m) => !m)} style={{ display: "flex", alignItems: "center", gap: "5px", margin: "12px auto 0", background: "none", border: "none", cursor: "pointer", color: "#aaa", fontSize: "11px", fontFamily: "'Lato', sans-serif" }}>
                  {masked ? <Eye size={12} /> : <EyeOff size={12} />}
                  {masked ? "Show PIN" : "Hide PIN"}
                </button>
                {error && <p style={{ fontSize: "12px", color: "#dc2626", textAlign: "center", marginTop: "12px" }}>{error}</p>}
                <button onClick={handleSave} disabled={confirmPin.length < 4 || saving} style={{ ...navyBtn(confirmPin.length < 4 || saving), marginTop: "20px" }}>
                  {saving ? <><div style={{ width: "14px", height: "14px", border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} /> Saving…</> : <><CheckCircle2 size={14} /> Set PIN</>}
                </button>
                <button onClick={() => { setStep(1); setError(""); setConfirmPin(""); }} style={{ width: "100%", marginTop: "8px", background: "none", border: "none", cursor: "pointer", color: "#aaa", fontSize: "11px", fontFamily: "'Lato', sans-serif", padding: "8px" }}>
                  ← Change PIN
                </button>
              </>
            )}
            <div style={{ marginTop: "20px", background: "rgba(184,150,62,0.06)", border: `0.5px solid rgba(184,150,62,0.25)`, padding: "12px 16px" }}>
              <p style={{ fontSize: "11px", color: "#8a6d1e", textAlign: "center", lineHeight: 1.6 }}>
                <strong>Keep your PIN safe.</strong> LAN will never ask for your PIN.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

/* ─── PIN CONFIRM MODAL ─────────────────────────────────────── */
function PinConfirmModal({ onVerify, onClose }) {
  const [pin, setPin]         = useState("");
  const [masked, setMasked]   = useState(true);
  const [error, setError]     = useState("");
  const [attempts, setAttempts] = useState(0);
  const MAX = 3;

  const verify = (p) => {
    const target = p || pin;
    if (target.length < 4) return;
    const ok = onVerify(target);
    if (!ok) {
      const next = attempts + 1;
      setAttempts(next);
      setPin("");
      setError(next >= MAX ? "Too many incorrect attempts. Please close and try again." : `Incorrect PIN. ${MAX - next} attempt${MAX - next === 1 ? "" : "s"} remaining.`);
    }
  };

  useEffect(() => { if (pin.length === 4 && attempts < MAX) verify(pin); }, [pin]); // eslint-disable-line
  const locked = attempts >= MAX;

  const modalHeader = {
    background: NAVY,
    backgroundImage: "radial-gradient(rgba(184,150,62,0.06) 1px,transparent 1px)",
    backgroundSize: "22px 22px",
    padding: "20px 24px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottom: `0.5px solid rgba(184,150,62,0.2)`,
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}>
      <div style={{ background: "#fff", width: "100%", maxWidth: "380px", border: `0.5px solid rgba(184,150,62,0.25)`, overflow: "hidden" }}>
        <div style={modalHeader}>
          <div>
            <p style={{ ...eyebrow, marginBottom: "2px" }}>Confirm Payment</p>
            <p style={{ fontFamily: "'Playfair Display', serif", fontSize: "16px", fontWeight: 700, color: "#fff", margin: 0 }}>Enter Your PIN</p>
          </div>
          <button onClick={onClose} style={{ width: "30px", height: "30px", border: `0.5px solid rgba(255,255,255,0.2)`, background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(255,255,255,0.5)" }}>
            <X size={15} />
          </button>
        </div>
        <div style={{ padding: "24px" }}>
          {error && (
            <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "#fff1f2", border: `0.5px solid #fca5a5`, padding: "10px 14px", marginBottom: "14px" }}>
              <AlertCircle size={14} style={{ color: "#ef4444", flexShrink: 0 }} />
              <p style={{ fontSize: "12px", color: "#dc2626", margin: 0 }}>{error}</p>
            </div>
          )}
          <PinInput value={pin} onChange={locked ? () => {} : setPin} masked={masked} disabled={locked} />
          <button onClick={() => setMasked((m) => !m)} style={{ display: "flex", alignItems: "center", gap: "5px", margin: "12px auto 0", background: "none", border: "none", cursor: "pointer", color: "#aaa", fontSize: "11px", fontFamily: "'Lato', sans-serif" }}>
            {masked ? <Eye size={12} /> : <EyeOff size={12} />}
            {masked ? "Show PIN" : "Hide PIN"}
          </button>
          {!locked && (
            <button onClick={() => verify(pin)} disabled={pin.length < 4} style={{ ...navyBtn(pin.length < 4), marginTop: "16px" }}>
              Confirm
            </button>
          )}
          <button onClick={onClose} style={{ width: "100%", marginTop: "8px", background: "none", border: "none", cursor: "pointer", color: "#aaa", fontSize: "11px", fontFamily: "'Lato', sans-serif", padding: "8px" }}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── MAIN TRANSFER CLIENT ──────────────────────────────────── */
export default function TransferClient() {
  const [seller, setSeller]         = useState(null);
  const [loading, setLoading]       = useState(true);
  const [step, setStep]             = useState(1);
  const [copied, setCopied]         = useState(false);

  const [hasPin, setHasPin]         = useState(null);
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinAction, setPinAction]   = useState(null);

  const [recipientAccount, setRecipientAccount] = useState("");
  const [amount, setAmount]         = useState("");
  const [note, setNote]             = useState("");
  const [recipientInfo, setRecipientInfo] = useState(null);
  const [lookingUp, setLookingUp]   = useState(false);
  const [lookupError, setLookupError] = useState("");
  const [transferring, setTransferring] = useState(false);
  const [transferError, setTransferError] = useState("");
  const [recentTransfers, setRecentTransfers] = useState([]);
  const [selectedTransfer, setSelectedTransfer] = useState(null);
  const [showAllTransfers, setShowAllTransfers] = useState(false);

  /* input focus states */
  const [focusAcct, setFocusAcct]   = useState(false);
  const [focusAmt, setFocusAmt]     = useState(false);
  const [focusNote, setFocusNote]   = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) { setLoading(false); return; }
      try {
        const sellerDoc = await getDoc(doc(db, "sellers", firebaseUser.uid));
        if (sellerDoc.exists()) {
          const data = sellerDoc.data();
          if (!data.accountNumber) {
            const newAccNum = generateAccountNumber();
            await updateDoc(doc(db, "sellers", firebaseUser.uid), { accountNumber: newAccNum });
            setSeller({ uid: firebaseUser.uid, ...data, accountNumber: newAccNum });
          } else {
            setSeller({ uid: firebaseUser.uid, ...data });
          }
          setHasPin(!!data.transferPin);
        }
        await loadRecentTransfers(firebaseUser.uid);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    });
    return () => unsubscribe();
  }, []);

  const loadRecentTransfers = async (uid) => {
    try {
      const sentQ = query(collection(db, "transfers"), where("senderId", "==", uid), orderBy("createdAt", "desc"), limit(20));
      const receivedQ = query(collection(db, "transfers"), where("recipientId", "==", uid), orderBy("createdAt", "desc"), limit(20));
      const [sentSnap, receivedSnap] = await Promise.all([getDocs(sentQ), getDocs(receivedQ)]);
      const sent     = sentSnap.docs.map((d) => ({ id: d.id, ...d.data(), type: "sent" }));
      const received = receivedSnap.docs.map((d) => ({ id: d.id, ...d.data(), type: "received" }));
      const all = [...sent, ...received].sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
      setRecentTransfers(all.slice(0, 20));
    } catch (err) { console.error("Recent transfers error:", err); }
  };

  const handleSavePin = async (pin) => {
    await updateDoc(doc(db, "sellers", seller.uid), { transferPin: pin, updatedAt: serverTimestamp() });
    setSeller((prev) => ({ ...prev, transferPin: pin }));
    setHasPin(true);
  };

  const handleVerifyPin = (enteredPin) => {
    if (enteredPin === seller?.transferPin) {
      setShowPinModal(false);
      if (pinAction) { pinAction(); setPinAction(null); }
      return true;
    }
    return false;
  };

  const requirePin = (action) => { setPinAction(() => action); setShowPinModal(true); };

  const handleLookup = async () => {
    const clean = recipientAccount.replace(/-/g, "").toUpperCase();
    if (!clean.startsWith("LAN") || clean.length < 10) { setLookupError("Enter a valid LAN account number e.g. LAN-284-7391"); return; }
    if (clean === seller?.accountNumber) { setLookupError("You can't transfer to yourself."); return; }
    setLookupError(""); setLookingUp(true); setRecipientInfo(null);
    try {
      const q = query(collection(db, "sellers"), where("accountNumber", "==", clean));
      const snap = await getDocs(q);
      if (snap.empty) { setLookupError("Account number not found. Please check and try again."); }
      else { setRecipientInfo({ id: snap.docs[0].id, ...snap.docs[0].data() }); }
    } catch { setLookupError("Error looking up account. Please try again."); }
    finally { setLookingUp(false); }
  };

  const TRANSFER_FEE = 50;
  const LAN_PLATFORM_UID = "LAN_LIBRARY_PLATFORM";

  const handleTransfer = async () => {
    const amt = Number(amount);
    const totalDeducted = amt + TRANSFER_FEE;
    if (!amt || amt < 100) { setTransferError("Minimum transfer is ₦100"); return; }
    if (totalDeducted > (seller?.accountBalance || 0)) { setTransferError(`Insufficient balance. You need ₦${totalDeducted.toLocaleString()} (₦${amt.toLocaleString()} + ₦50 fee)`); return; }
    if (!recipientInfo) { setTransferError("Please look up a valid recipient first"); return; }
    setTransferring(true); setTransferError("");
    try {
      const senderRef    = doc(db, "sellers", seller.uid);
      const recipientRef = doc(db, "sellers", recipientInfo.id);
      const platformRef  = doc(db, "sellers", LAN_PLATFORM_UID);
      await runTransaction(db, async (transaction) => {
        const senderSnap = await transaction.get(senderRef);
        if (senderSnap.data().accountBalance < totalDeducted) throw new Error("Insufficient balance.");
        transaction.update(senderRef, { accountBalance: increment(-totalDeducted), updatedAt: serverTimestamp() });
        transaction.update(recipientRef, { accountBalance: increment(amt), updatedAt: serverTimestamp() });
        transaction.set(platformRef, { accountBalance: increment(TRANSFER_FEE), totalFeesCollected: increment(TRANSFER_FEE), updatedAt: serverTimestamp() }, { merge: true });
        const transferRef = doc(collection(db, "transfers"));
        transaction.set(transferRef, {
          senderId: seller.uid,
          senderName: seller.businessInfo?.businessName || seller.bankDetails?.accountName || "Unknown",
          senderAccountNumber: seller.accountNumber || "",
          recipientId: recipientInfo.id,
          recipientName: recipientInfo.businessInfo?.businessName || recipientInfo.bankDetails?.accountName || recipientInfo.sellerName || "Unknown",
          recipientAccountNumber: recipientInfo.accountNumber || "",
          amount: amt, fee: TRANSFER_FEE, totalDeducted: amt + TRANSFER_FEE,
          note: note || "", createdAt: serverTimestamp(), status: "completed",
        });
        const feeRef = doc(collection(db, "platformFees"));
        transaction.set(feeRef, {
          transferId: transferRef.id, senderId: seller.uid,
          senderName: seller.businessInfo?.businessName || seller.bankDetails?.accountName || "Unknown",
          fee: TRANSFER_FEE, transferAmount: amt, createdAt: serverTimestamp(), disbursedToFlutterwave: false,
        });
      });
      setSeller((prev) => ({ ...prev, accountBalance: (prev.accountBalance || 0) - totalDeducted }));
      await loadRecentTransfers(seller.uid);
      setStep(3);
    } catch (err) { setTransferError(err.message || "Transfer failed. Please try again."); }
    finally { setTransferring(false); }
  };

  const handleCopyAccount = async () => {
    if (!seller?.accountNumber) return;
    await navigator.clipboard.writeText(formatAccountNumber(seller.accountNumber));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const resetForm = () => {
    setRecipientAccount(""); setAmount(""); setNote("");
    setRecipientInfo(null); setLookupError(""); setTransferError(""); setStep(1);
  };

  const sellerName = seller?.bankDetails?.accountName || seller?.businessInfo?.businessName || "Unknown Seller";

  /* ─── Guard screens ─────────────────────────────────── */
  const guardStyle = { minHeight: "100vh", background: BG, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px", fontFamily: "'Lato', sans-serif" };
  const guardBox   = { background: "#fff", border: `0.5px solid #e5ddd0`, padding: "48px 32px", maxWidth: "380px", width: "100%", textAlign: "center" };

  if (loading) return (
    <>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={guardStyle}>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: "40px", height: "40px", border: `3px solid ${GOLD}`, borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 12px" }} />
          <p style={{ fontFamily: "'Playfair Display', serif", fontSize: "15px", color: NAVY }}>Loading…</p>
        </div>
      </div>
    </>
  );

  if (!seller) return (
    <>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=Lato:wght@400;700&display=swap');`}</style>
      <div style={guardStyle}>
        <div style={guardBox}>
          <div style={{ width: "56px", height: "56px", border: `0.5px solid #e5ddd0`, background: CREAM, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
            <Wallet size={24} style={{ color: "#ccc" }} />
          </div>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "20px", fontWeight: 700, color: NAVY, marginBottom: "8px" }}>No Seller Account</h2>
          <p style={{ fontSize: "13px", color: "#888" }}>You need a seller account to use LAN wallet transfers.</p>
        </div>
      </div>
    </>
  );

  if (hasPin === false) return <CreatePinScreen onSave={handleSavePin} />;

  /* ─── MAIN UI ──────────────────────────────────────── */
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400&family=Lato:wght@300;400;700&display=swap');
        .transfer-root { font-family:'Lato',sans-serif; background:${BG}; min-height:100vh; }
        .txn-row { display:flex; align-items:center; gap:10px; padding:8px 0; border-bottom:0.5px solid #f5f0e8; cursor:pointer; }
        .txn-row:last-child { border-bottom:none; }
        .txn-row:hover .txn-name { color:${GOLD}; }
        .pay-grid { display:grid; grid-template-columns:1fr; gap:16px; }
        @media(min-width:1024px){ .pay-grid{ grid-template-columns:280px 1fr !important; } }
        @keyframes spin { to { transform:rotate(360deg); } }
        @keyframes slideUp { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
        .anim { animation:slideUp 0.4s cubic-bezier(.4,0,.2,1) both; }
      `}</style>

      <div className="transfer-root">
        <Navbar />

        <main style={{ maxWidth: "1100px", margin: "0 auto", padding: "0" }}>

          {/* ── HERO ── */}
          <section style={{ background: NAVY, backgroundImage: "radial-gradient(rgba(184,150,62,0.07) 1px,transparent 1px),radial-gradient(rgba(255,255,255,0.025) 1px,transparent 1px)", backgroundSize: "28px 28px,14px 14px", backgroundPosition: "0 0,7px 7px", padding: "40px 24px 0" }}>
            <div style={{ maxWidth: "1060px", margin: "0 auto" }}>
              <p style={{ ...eyebrow, color: GOLDD }}>LAN Wallet</p>
              <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(28px,5vw,46px)", fontWeight: 900, color: "#fff", lineHeight: 1.05, letterSpacing: "-1px", margin: "6px 0 10px" }}>
                Send money<br /><em style={{ color: GOLD, fontStyle: "italic" }}>to any seller.</em>
              </h1>
              <p style={{ fontSize: "14px", color: "rgba(245,240,232,0.65)", maxWidth: "440px", lineHeight: 1.75, fontWeight: 300, marginBottom: "0" }}>
                Transfer funds instantly within the LAN ecosystem — secure, fee-transparent, PIN-protected.
              </p>
              {/* stat strip */}
              <div style={{ borderTop: "0.5px solid rgba(184,150,62,0.2)", marginTop: "28px", display: "flex", flexWrap: "wrap" }}>
                {[["₦0", "Setup Fee"], ["₦50", "Per Transfer"], ["∞", "Sellers"], ["Instant", "Settlement"]].map(([val, lbl]) => (
                  <div key={lbl} style={{ flex: "1 1 100px", padding: "18px 16px 18px", borderRight: "0.5px solid rgba(184,150,62,0.12)" }}>
                    <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "22px", fontWeight: 700, color: "#fff" }}>{val}</div>
                    <div style={{ fontSize: "9px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(184,150,62,0.7)", marginTop: "3px" }}>{lbl}</div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ── PAGE CONTENT ── */}
          <div style={{ padding: "28px 24px" }}>
            <div style={{ maxWidth: "1060px", margin: "0 auto" }}>
              <div style={{ marginBottom: "24px", display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
                <div>
                  <p style={eyebrow}>Wallet</p>
                  <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(20px,3vw,30px)", fontWeight: 700, color: NAVY, margin: 0 }}>
                    {step === 1 ? "Send Money" : step === 2 ? "Confirm Transfer" : "Transfer Successful"}
                  </h2>
                </div>
                <Link href="/recharge" style={{ display: "flex", alignItems: "center", gap: "10px", background: "#fff", border: `0.5px solid #e5ddd0`, padding: "10px 16px", textDecoration: "none" }}>
                  <div style={{ width: "34px", height: "34px", background: NAVY, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Smartphone size={16} style={{ color: "#fff" }} />
                  </div>
                  <div>
                    <p style={{ fontSize: "11px", fontWeight: 700, color: NAVY, margin: 0 }}>Buy Airtime & Data</p>
                    <p style={{ fontSize: "10px", color: "#aaa", margin: 0 }}>Top up any network</p>
                  </div>
                </Link>
              </div>

              <div className="pay-grid">

                {/* ── LEFT: Account sidebar + recent ── */}
                <div>
                  {/* Account box */}
                  <div style={{ background: NAVY, backgroundImage: "radial-gradient(rgba(184,150,62,0.06) 1px,transparent 1px)", backgroundSize: "22px 22px", padding: "22px", marginBottom: "14px" }}>
                    <p style={{ ...eyebrow, color: "rgba(184,150,62,0.75)", marginBottom: "14px" }}>Your LAN Account</p>
                    <p style={{ fontFamily: "'Playfair Display', serif", fontSize: "15px", fontWeight: 700, color: "#fff", marginBottom: "4px" }}>{sellerName}</p>
                    <p style={{ fontSize: "10px", color: "rgba(255,255,255,0.4)", marginBottom: "10px" }}>LAN Wallet · Verified Seller</p>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "rgba(255,255,255,0.06)", border: `0.5px solid rgba(184,150,62,0.25)`, padding: "8px 12px", marginBottom: "14px" }}>
                      <span style={{ fontFamily: "monospace", fontSize: "13px", fontWeight: 700, color: "rgba(184,150,62,0.95)", letterSpacing: "0.05em", flex: 1 }}>{formatAccountNumber(seller?.accountNumber)}</span>
                      <button onClick={handleCopyAccount} style={{ background: "none", border: "none", cursor: "pointer", color: copied ? "#4ade80" : "rgba(255,255,255,0.4)", padding: "2px", display: "flex", alignItems: "center" }}>
                        {copied ? <Check size={13} /> : <Copy size={13} />}
                      </button>
                    </div>
                    <div style={{ borderTop: "0.5px solid rgba(184,150,62,0.15)", paddingTop: "12px" }}>
                      <p style={{ fontSize: "10px", color: "rgba(255,255,255,0.4)", marginBottom: "3px" }}>Available Balance</p>
                      <p style={{ fontFamily: "'Playfair Display', serif", fontSize: "28px", fontWeight: 700, color: "#fff", margin: 0 }}>₦{(seller?.accountBalance || 0).toLocaleString()}</p>
                    </div>
                  </div>

                  {/* Recent transfers */}
                  {recentTransfers.length > 0 && (
                    <div style={{ background: "#fff", border: `0.5px solid #e5ddd0`, padding: "18px" }}>
                      <p style={{ fontFamily: "'Playfair Display', serif", fontSize: "14px", fontWeight: 700, color: NAVY, marginBottom: "14px" }}>Recent Transfers</p>
                      {(showAllTransfers ? recentTransfers : recentTransfers.slice(0, 5)).map((t) => {
                        const isSent = t.type === "sent";
                        return (
                          <button key={t.id} onClick={() => setSelectedTransfer(t)} className="txn-row" style={{ width: "100%", background: "none", border: "none", textAlign: "left" }}>
                            <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: isSent ? "rgba(239,68,68,0.08)" : "rgba(22,163,74,0.08)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                              {isSent ? <ArrowUpRight size={13} style={{ color: "#dc2626" }} /> : <ArrowDownLeft size={13} style={{ color: "#16a34a" }} />}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <p className="txn-name" style={{ fontSize: "11px", fontWeight: 700, color: NAVY, margin: "0 0 1px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", transition: "color 0.15s" }}>
                                {isSent ? t.recipientName : t.senderName}
                              </p>
                              <p style={{ fontSize: "9px", color: "#aaa", margin: 0, fontFamily: "monospace" }}>
                                {isSent ? formatAccountNumber(t.recipientAccountNumber) : formatAccountNumber(t.senderAccountNumber)}
                              </p>
                            </div>
                            <p style={{ fontSize: "11px", fontWeight: 700, color: isSent ? "#dc2626" : "#16a34a", flexShrink: 0 }}>
                              {isSent ? `-₦${(t.totalDeducted || t.amount + 50).toLocaleString()}` : `+₦${t.amount?.toLocaleString()}`}
                            </p>
                          </button>
                        );
                      })}
                      {recentTransfers.length > 5 && (
                        <button onClick={() => setShowAllTransfers((p) => !p)} style={{ width: "100%", marginTop: "10px", background: "none", border: "none", borderTop: `0.5px solid #f0ebe0`, paddingTop: "10px", cursor: "pointer", fontSize: "10px", fontWeight: 700, color: NAVY, letterSpacing: "0.06em", fontFamily: "'Lato', sans-serif" }}>
                          {showAllTransfers ? "↑ SHOW LESS" : `VIEW ALL (${recentTransfers.length})`}
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* ── RIGHT: Transfer form ── */}
                <div>

                  {/* STEP 1 */}
                  {step === 1 && (
                    <div style={{ ...sectionCard }} className="anim">
                      <p style={eyebrow}>Step 1 of 3</p>
                      <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: "18px", fontWeight: 700, color: NAVY, marginBottom: "22px" }}>Payment Information</h3>

                      {/* Recipient */}
                      <div style={{ marginBottom: "18px" }}>
                        <label style={{ display: "block", fontSize: "11px", fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase", color: NAVY, marginBottom: "8px" }}>Recipient Account Number</label>
                        <div style={{ display: "flex", gap: "8px" }}>
                          <input
                            type="text"
                            placeholder="LAN-284-7391"
                            value={recipientAccount}
                            onChange={(e) => { setRecipientAccount(e.target.value); setRecipientInfo(null); setLookupError(""); }}
                            onFocus={() => setFocusAcct(true)}
                            onBlur={() => setFocusAcct(false)}
                            style={{ ...inputStyle(focusAcct), fontFamily: "monospace" }}
                          />
                          <button onClick={handleLookup} disabled={lookingUp || !recipientAccount} style={{ ...navyBtn(lookingUp || !recipientAccount), width: "auto", padding: "11px 16px", flexShrink: 0 }}>
                            {lookingUp ? <div style={{ width: "13px", height: "13px", border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} /> : <Search size={14} />}
                            Verify
                          </button>
                        </div>
                        {lookupError && (
                          <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "6px" }}>
                            <AlertCircle size={12} style={{ color: "#ef4444", flexShrink: 0 }} />
                            <p style={{ fontSize: "11px", color: "#dc2626", margin: 0 }}>{lookupError}</p>
                          </div>
                        )}
                        {recipientInfo && (
                          <div style={{ display: "flex", alignItems: "center", gap: "10px", background: "rgba(22,163,74,0.06)", border: `0.5px solid rgba(22,163,74,0.3)`, padding: "10px 13px", marginTop: "8px" }}>
                            <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#16a34a", flexShrink: 0 }} />
                            <div>
                              <p style={{ fontSize: "12px", fontWeight: 700, color: "#14532d", margin: 0 }}>
                                {recipientInfo.bankDetails?.accountName || recipientInfo.businessInfo?.businessName || "Unknown account"}
                              </p>
                              <p style={{ fontSize: "10px", color: "#16a34a", fontFamily: "monospace", margin: 0 }}>{formatAccountNumber(recipientInfo.accountNumber)}</p>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Amount */}
                      <div style={{ marginBottom: "18px" }}>
                        <label style={{ display: "block", fontSize: "11px", fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase", color: NAVY, marginBottom: "8px" }}>Amount (₦)</label>
                        <div style={{ position: "relative" }}>
                          <span style={{ position: "absolute", left: "13px", top: "50%", transform: "translateY(-50%)", color: "#aaa", fontWeight: 700, fontSize: "15px" }}>₦</span>
                          <input
                            type="number"
                            placeholder="0.00"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            onFocus={() => setFocusAmt(true)}
                            onBlur={() => setFocusAmt(false)}
                            style={{ ...inputStyle(focusAmt), paddingLeft: "28px" }}
                          />
                        </div>
                        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginTop: "8px" }}>
                          {[500, 1000, 2000, 5000].map((q) => (
                            <button key={q} onClick={() => setAmount(String(q))} style={{ fontSize: "10px", padding: "5px 10px", background: amount === String(q) ? NAVY : "rgba(13,34,68,0.05)", color: amount === String(q) ? "#fff" : NAVY, border: `0.5px solid ${amount === String(q) ? NAVY : "#e5ddd0"}`, cursor: "pointer", fontFamily: "'Lato', sans-serif", fontWeight: 700, transition: "all 0.15s" }}>
                              ₦{q.toLocaleString()}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Fee strip */}
                      {amount && Number(amount) >= 100 && (
                        <div style={{ background: CREAM, border: `0.5px solid rgba(184,150,62,0.2)`, padding: "10px 14px", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                          <div>
                            <p style={{ ...eyebrow, marginBottom: "2px" }}>Transaction Fee</p>
                            <p style={{ fontSize: "10px", color: "#aaa", margin: 0 }}>Applied to every transfer</p>
                          </div>
                          <div style={{ textAlign: "right" }}>
                            <p style={{ fontSize: "13px", fontWeight: 700, color: NAVY, margin: 0 }}>+ ₦50</p>
                            <p style={{ fontSize: "10px", color: "#aaa", margin: 0 }}>Total: ₦{(Number(amount) + 50).toLocaleString()}</p>
                          </div>
                        </div>
                      )}

                      {/* Note */}
                      <div style={{ marginBottom: "18px" }}>
                        <label style={{ display: "block", fontSize: "11px", fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase", color: NAVY, marginBottom: "8px" }}>Note (Optional)</label>
                        <input
                          type="text"
                          placeholder="What's this for?"
                          value={note}
                          onChange={(e) => setNote(e.target.value)}
                          onFocus={() => setFocusNote(true)}
                          onBlur={() => setFocusNote(false)}
                          style={inputStyle(focusNote)}
                        />
                      </div>

                      {transferError && (
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "#fff1f2", border: `0.5px solid #fca5a5`, padding: "10px 13px", marginBottom: "14px" }}>
                          <AlertCircle size={14} style={{ color: "#ef4444", flexShrink: 0 }} />
                          <p style={{ fontSize: "12px", color: "#dc2626", margin: 0 }}>{transferError}</p>
                        </div>
                      )}

                      <button
                        onClick={() => {
                          if (!recipientInfo) { setLookupError("Please verify the account number first"); return; }
                          if (!amount || Number(amount) < 100) { setTransferError("Minimum transfer is ₦100"); return; }
                          if (Number(amount) + 50 > (seller?.accountBalance || 0)) { setTransferError("Insufficient balance"); return; }
                          setTransferError(""); setStep(2);
                        }}
                        disabled={!recipientInfo || !amount}
                        style={navyBtn(!recipientInfo || !amount)}
                      >
                        Continue <ArrowRight size={14} />
                      </button>

                      {/* Referral strip */}
                      <div style={{ marginTop: "14px", background: CREAM, border: `0.5px solid rgba(184,150,62,0.2)`, padding: "10px 14px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <p style={{ fontSize: "11px", fontWeight: 700, color: NAVY, margin: 0 }}>Invite friends & earn ₦500</p>
                        <Link href="/referrals" style={{ fontSize: "11px", fontWeight: 700, color: GOLD, textDecoration: "none" }}>Get link →</Link>
                      </div>
                    </div>
                  )}

                  {/* STEP 2 */}
                  {step === 2 && (
                    <div style={{ ...sectionCard }} className="anim">
                      <button onClick={() => setStep(1)} style={{ background: "none", border: "none", cursor: "pointer", color: "#aaa", fontSize: "11px", fontFamily: "'Lato', sans-serif", padding: "0", marginBottom: "16px", display: "flex", alignItems: "center", gap: "4px" }}>
                        ← Back
                      </button>
                      <p style={eyebrow}>Step 2 of 3</p>
                      <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: "18px", fontWeight: 700, color: NAVY, marginBottom: "20px" }}>Confirm Transfer</h3>

                      <div style={{ background: CREAM, border: `0.5px solid rgba(184,150,62,0.18)`, padding: "18px", marginBottom: "18px" }}>
                        {[
                          ["From", seller?.businessInfo?.businessName || seller?.bankDetails?.accountName || "Unknown", formatAccountNumber(seller?.accountNumber)],
                          ["To", recipientInfo?.businessInfo?.businessName || recipientInfo?.bankDetails?.accountName || recipientInfo?.sellerName || "Unknown", formatAccountNumber(recipientInfo?.accountNumber)],
                        ].map(([lbl, name, acc], idx) => (
                          <React.Fragment key={lbl}>
                            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", padding: "8px 0", borderBottom: "0.5px solid rgba(184,150,62,0.15)" }}>
                              <span style={{ color: "#aaa" }}>{lbl}</span>
                              <div style={{ textAlign: "right" }}>
                                <p style={{ fontWeight: 700, color: NAVY, margin: "0 0 1px" }}>{name}</p>
                                <p style={{ fontSize: "10px", color: "#aaa", margin: 0, fontFamily: "monospace" }}>{acc}</p>
                              </div>
                            </div>
                            {idx === 0 && (
                              <div style={{ display: "flex", justifyContent: "center", padding: "8px 0" }}>
                                <div style={{ width: "28px", height: "28px", border: `0.5px solid rgba(184,150,62,0.2)`, display: "flex", alignItems: "center", justifyContent: "center", background: "#fff" }}>
                                  <ArrowRight size={13} style={{ color: NAVY, transform: "rotate(90deg)" }} />
                                </div>
                              </div>
                            )}
                          </React.Fragment>
                        ))}
                        <div style={{ borderTop: `0.5px solid rgba(184,150,62,0.2)`, paddingTop: "14px", marginTop: "6px" }}>
                          {[["Amount", `₦${Number(amount).toLocaleString()}`], ["Transfer Fee", "+ ₦50"]].map(([lbl, val]) => (
                            <div key={lbl} style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", padding: "5px 0" }}>
                              <span style={{ color: "#aaa" }}>{lbl}</span>
                              <span style={{ fontWeight: 700, color: lbl === "Transfer Fee" ? "#ea580c" : NAVY }}>{val}</span>
                            </div>
                          ))}
                          <div style={{ display: "flex", justifyContent: "space-between", borderTop: `0.5px solid rgba(184,150,62,0.15)`, paddingTop: "10px", marginTop: "6px" }}>
                            <span style={{ fontSize: "12px", fontWeight: 700, color: NAVY }}>Total Deducted</span>
                            <span style={{ fontFamily: "'Playfair Display', serif", fontSize: "18px", fontWeight: 700, color: NAVY }}>₦{(Number(amount) + 50).toLocaleString()}</span>
                          </div>
                          {note && (
                            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", padding: "8px 0 0" }}>
                              <span style={{ color: "#aaa" }}>Note</span>
                              <span style={{ fontWeight: 700, color: NAVY }}>{note}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {transferError && (
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "#fff1f2", border: `0.5px solid #fca5a5`, padding: "10px 13px", marginBottom: "14px" }}>
                          <AlertCircle size={14} style={{ color: "#ef4444", flexShrink: 0 }} />
                          <p style={{ fontSize: "12px", color: "#dc2626", margin: 0 }}>{transferError}</p>
                        </div>
                      )}

                      <button onClick={() => requirePin(handleTransfer)} disabled={transferring} style={navyBtn(transferring)}>
                        {transferring
                          ? <><div style={{ width: "14px", height: "14px", border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} /> Processing…</>
                          : <><Lock size={14} /> Confirm with PIN</>
                        }
                      </button>
                    </div>
                  )}

                  {/* STEP 3 */}
                  {step === 3 && (
                    <TransferReceipt seller={seller} recipientInfo={recipientInfo} amount={amount} note={note} onReset={resetForm} />
                  )}
                </div>
              </div>
            </div>
          </div>
        </main>

        {showPinModal && (
          <PinConfirmModal onVerify={handleVerifyPin} onClose={() => { setShowPinModal(false); setPinAction(null); }} />
        )}
        {selectedTransfer && (
          <TransferReceiptModal transfer={selectedTransfer} onClose={() => setSelectedTransfer(null)} />
        )}
      </div>
    </>
  );
}