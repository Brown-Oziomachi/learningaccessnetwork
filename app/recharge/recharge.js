"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Smartphone, Wifi, Loader2, CheckCircle2, AlertCircle,
  ArrowLeft, Lock, Eye, EyeOff, X, Zap, Signal,
  RefreshCw, Receipt, Wallet, Tv, CreditCard, Copy, Check, ArrowRight,
} from "lucide-react";
import Navbar from "@/components/NavBar";
import { onAuthStateChanged } from "firebase/auth";
import {
  doc, getDoc, collection, runTransaction, serverTimestamp,
  increment, getDocs, query, where, orderBy, limit,
} from "firebase/firestore";
import { auth, db } from "@/lib/firebaseConfig";
import { useSearchParams } from "next/navigation";
import Script from "next/script";

/* ─── colour tokens (matching transfer page) ──────────────────── */
const NAVY  = "#0d2244";
const GOLD  = "#b8963e";
const GOLDD = "#d4aa5a";
const CREAM = "#f5f0e8";
const BG    = "#f5f1ea";

/* ─── constants ───────────────────────────────────────────────── */
const NETWORKS = [
  { id: "MTN",     name: "MTN",     color: "#FFC107" },
  { id: "AIRTEL",  name: "Airtel",  color: "#E53935" },
  { id: "GLO",     name: "Glo",     color: "#4CAF50" },
  { id: "9MOBILE", name: "9Mobile", color: "#006633" },
];

const NETWORK_BILLER_CODES = {
  MTN: "BIL108", AIRTEL: "BIL110", GLO: "BIL109", "9MOBILE": "BIL111",
};

/* ─── shared inline styles (matching transfer page exactly) ───── */
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
  borderRadius: 0,
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
  borderRadius: 0,
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
  borderRadius: 0,
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

const label = {
  display: "block",
  fontSize: "11px",
  fontWeight: 700,
  letterSpacing: "0.05em",
  textTransform: "uppercase",
  color: NAVY,
  marginBottom: "8px",
  fontFamily: "'Lato', sans-serif",
};

/* ─── PIN Input ────────────────────────────────────────────────── */
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
            width: "52px", height: "54px", textAlign: "center",
            fontSize: "22px", fontWeight: 700,
            border: `1.5px solid ${value[i] ? NAVY : "#e5ddd0"}`,
            background: value[i] ? CREAM : "#fff",
            color: NAVY, outline: "none",
            fontFamily: "'Lato', sans-serif",
            transition: "all 0.15s",
            opacity: disabled ? 0.4 : 1,
            borderRadius: 0,
          }}
        />
      ))}
    </div>
  );
}

/* ─── PIN Confirm Modal (transfer page style) ──────────────────── */
function PinConfirmModal({ onVerify, onClose }) {
  const [pin, setPin]       = useState("");
  const [masked, setMasked] = useState(true);
  const [error, setError]   = useState("");
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
      setError(next >= MAX
        ? "Too many incorrect attempts. Please close and try again."
        : `Incorrect PIN. ${MAX - next} attempt${MAX - next === 1 ? "" : "s"} remaining.`);
    }
  };
  useEffect(() => { if (pin.length === 4 && attempts < MAX) verify(pin); }, [pin]); // eslint-disable-line
  const locked = attempts >= MAX;

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}>
      <div style={{ background: "#fff", width: "100%", maxWidth: "380px", border: `0.5px solid rgba(184,150,62,0.25)`, overflow: "hidden" }}>
        <div style={{ background: NAVY, backgroundImage: "radial-gradient(rgba(184,150,62,0.06) 1px,transparent 1px)", backgroundSize: "22px 22px", padding: "20px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: `0.5px solid rgba(184,150,62,0.2)` }}>
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

/* ─── detect network from phone number ─────────────────────────── */
function detectNetwork(phone) {
  const clean = phone.replace(/\D/g, "");
  const prefix = clean.substring(0, 4);
  const prefixMap = {
    "0803": "MTN", "0806": "MTN", "0703": "MTN", "0706": "MTN",
    "0813": "MTN", "0816": "MTN", "0810": "MTN", "0814": "MTN",
    "0903": "MTN", "0906": "MTN", "0913": "MTN", "0916": "MTN",
    "0802": "AIRTEL", "0808": "AIRTEL", "0708": "AIRTEL",
    "0812": "AIRTEL", "0701": "AIRTEL", "0902": "AIRTEL",
    "0901": "AIRTEL", "0904": "AIRTEL", "0907": "AIRTEL", "0912": "AIRTEL",
    "0805": "GLO", "0807": "GLO", "0705": "GLO", "0815": "GLO",
    "0811": "GLO", "0905": "GLO", "0915": "GLO",
    "0809": "9MOBILE", "0818": "9MOBILE", "0817": "9MOBILE",
    "0909": "9MOBILE", "0908": "9MOBILE",
  };
  return prefixMap[prefix] || null;
}

/* ─── Network button (transfer-page style: sharp corners) ──────── */
function NetworkBtn({ network, selected, onClick }) {
  const n = NETWORKS.find((x) => x.id === network.id);
  return (
    <button
      onClick={onClick}
      style={{
        flex: "1 1 0",
        padding: "10px 6px",
        border: `0.5px solid ${selected ? NAVY : "#e5ddd0"}`,
        background: selected ? NAVY : CREAM,
        color: selected ? "#fff" : NAVY,
        fontFamily: "'Lato', sans-serif",
        fontSize: "11px",
        fontWeight: 700,
        letterSpacing: "0.04em",
        cursor: "pointer",
        transition: "all 0.15s",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "4px",
        borderRadius: 0,
      }}
    >
      <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: selected ? "#fff" : n.color, opacity: selected ? 0.8 : 1 }} />
      {network.name}
    </button>
  );
}

/* ─── Success Screen (transfer page aesthetic) ─────────────────── */
function SuccessScreen({ type, network, phone, amount, plan, txRef, paymentMethod, onReset }) {
  const net = NETWORKS.find((n) => n.id === network);
  const typeLabel = type === "airtime" ? "Airtime" : type === "data" ? "Data Bundle" : type === "electricity" ? "Electricity" : "TV/Cable";

  return (
    <div style={{ ...sectionCard, textAlign: "center", padding: "40px 28px" }}>
      <div style={{ width: "64px", height: "64px", border: `0.5px solid rgba(22,163,74,0.3)`, background: "rgba(22,163,74,0.06)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
        <CheckCircle2 size={28} style={{ color: "#16a34a" }} />
      </div>
      <p style={{ ...eyebrow, textAlign: "center" }}>Success</p>
      <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "22px", fontWeight: 700, color: NAVY, marginBottom: "8px" }}>
        {typeLabel} Purchased!
      </h2>
      <p style={{ fontSize: "13px", color: "#888", marginBottom: "20px" }}>Your request was processed successfully.</p>

      {/* Payment method badge */}
      <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: CREAM, border: `0.5px solid rgba(184,150,62,0.25)`, padding: "5px 12px", marginBottom: "20px" }}>
        {paymentMethod === "card" ? <CreditCard size={11} style={{ color: GOLD }} /> : <Wallet size={11} style={{ color: GOLD }} />}
        <span style={{ fontSize: "10px", fontWeight: 700, color: NAVY, letterSpacing: "0.06em", textTransform: "uppercase" }}>
          Paid {paymentMethod === "card" ? "by Card" : "from Wallet"}
        </span>
      </div>

      {/* Receipt */}
      <div style={{ background: CREAM, border: `0.5px solid rgba(184,150,62,0.18)`, padding: "16px", marginBottom: "20px", textAlign: "left" }}>
        {(type === "airtime" || type === "data") && (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", padding: "6px 0", borderBottom: "0.5px solid rgba(184,150,62,0.12)" }}>
              <span style={{ color: "#aaa" }}>Phone</span>
              <span style={{ fontWeight: 700, color: NAVY, fontFamily: "monospace" }}>{phone}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", padding: "6px 0", borderBottom: "0.5px solid rgba(184,150,62,0.12)" }}>
              <span style={{ color: "#aaa" }}>Network</span>
              <span style={{ fontWeight: 700, color: NAVY }}>{net?.name}</span>
            </div>
          </>
        )}
        {plan && (
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", padding: "6px 0", borderBottom: "0.5px solid rgba(184,150,62,0.12)" }}>
            <span style={{ color: "#aaa" }}>Plan</span>
            <span style={{ fontWeight: 700, color: NAVY }}>{plan.size || plan.name || "—"}</span>
          </div>
        )}
        <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0 0", alignItems: "center" }}>
          <span style={{ fontSize: "12px", color: "#aaa" }}>Amount</span>
          <span style={{ fontFamily: "'Playfair Display', serif", fontSize: "20px", fontWeight: 700, color: NAVY }}>₦{Number(amount || 0).toLocaleString()}</span>
        </div>
        {txRef && (
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", paddingTop: "8px", borderTop: "0.5px solid rgba(184,150,62,0.12)", marginTop: "8px" }}>
            <span style={{ color: "#aaa" }}>Reference</span>
            <span style={{ fontFamily: "monospace", color: "#aaa" }}>{txRef}</span>
          </div>
        )}
      </div>

      <button onClick={onReset} style={navyBtn(false)}>
        <RefreshCw size={13} /> Make Another Purchase
      </button>
    </div>
  );
}

/* ─── MAIN RECHARGE CLIENT ─────────────────────────────────────── */
export default function RechargeClient() {
  const searchParams = useSearchParams();
  const [seller, setSeller]   = useState(null);
  const [loading, setLoading] = useState(true);

  const [tab, setTab]   = useState("airtime");
  const [step, setStep] = useState(1);
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinAction, setPinAction]       = useState(null);

  const [selectedNetwork, setSelectedNetwork] = useState(null);
  const [phone, setPhone]                     = useState("");
  const [airtimeAmount, setAirtimeAmount]     = useState("");
  const [customAmount, setCustomAmount]       = useState("");
  const [selectedPlan, setSelectedPlan]       = useState(null);

  const [processing, setProcessing] = useState(false);
  const [error, setError]           = useState("");
  const [txRef, setTxRef]           = useState("");
  const [paymentMethod, setPaymentMethod] = useState("wallet");

  const [recentRecharges, setRecentRecharges]   = useState([]);
  const [dataPlans, setDataPlans]               = useState([]);
  const [loadingPlans, setLoadingPlans]         = useState(false);
  const [plansError, setPlansError]             = useState("");
  const [verifiedName, setVerifiedName]         = useState("");
  const [verifying, setVerifying]               = useState(false);

  const [selectedElecPlan, setSelectedElecPlan]     = useState(null);
  const [loadingElecPlans, setLoadingElecPlans]     = useState(false);
  const [elecPlansError, setElecPlansError]         = useState("");
  const [meterNumber, setMeterNumber]               = useState("");
  const [elecAmount, setElecAmount]                 = useState("");
  const [elecBillers, setElecBillers]               = useState([]);
  const [tvBillers, setTvBillers]                   = useState([]);
  const [loadingBillers, setLoadingBillers]         = useState(false);
  const [elecBillersLoaded, setElecBillersLoaded]   = useState(false);
  const [tvBillersLoaded, setTvBillersLoaded]       = useState(false);
  const [selectedElecBiller, setSelectedElecBiller] = useState(null);
  const [elecPlans, setElecPlans]                   = useState([]);
  const [selectedTvBiller, setSelectedTvBiller]     = useState(null);
  const [tvPlans, setTvPlans]                       = useState([]);
  const [selectedTvPlan, setSelectedTvPlan]         = useState(null);
  const [loadingTvPlans, setLoadingTvPlans]         = useState(false);
  const [tvPlansError, setTvPlansError]             = useState("");
  const [smartcardNumber, setSmartcardNumber]       = useState("");
  const [airtimePlans, setAirtimePlans]             = useState([]);
  const [loadingAirtimePlans, setLoadingAirtimePlans] = useState(false);

  /* focus states */
  const [focusPhone, setFocusPhone]   = useState(false);
  const [focusCustom, setFocusCustom] = useState(false);
  const [focusMeter, setFocusMeter]   = useState(false);
  const [focusElecAmt, setFocusElecAmt] = useState(false);
  const [focusSmart, setFocusSmart]   = useState(false);

  useEffect(() => {
    const t = searchParams.get("tab");
    if (t && ["airtime", "data", "electricity", "tv"].includes(t)) setTab(t);
  }, [searchParams]);

useEffect(() => {
    if (tab !== "airtime" || !selectedNetwork) return;
    setAirtimePlans([]); setLoadingAirtimePlans(true);
    fetch(`/api/recharge?type=airtime-plans&biller=${selectedNetwork}`)
      .then((r) => r.json())
      .then((res) => { if (!res.error) setAirtimePlans(res.plans || []); })
      .catch(console.error).finally(() => setLoadingAirtimePlans(false));
  }, [selectedNetwork, tab]);

  const fetchElecPlans = (billerId) => {
    setElecPlans([]); setSelectedElecPlan(null); setElecPlansError(""); setLoadingElecPlans(true);
    fetch(`/api/recharge?type=electricity-plans&biller=${billerId}`)
      .then((r) => r.json())
      .then((res) => { if (res.error) throw new Error(res.error); setElecPlans(res.plans || []); })
      .catch((err) => setElecPlansError(err.message || "Failed to load meter types"))
      .finally(() => setLoadingElecPlans(false));
  };

  const fetchTvPlans = (billerId) => {
    setTvPlans([]); setSelectedTvPlan(null); setTvPlansError(""); setLoadingTvPlans(true);
    fetch(`/api/recharge?type=tv-plans&biller=${billerId}`)
      .then((r) => r.json())
      .then((res) => { if (res.error) throw new Error(res.error); setTvPlans(res.plans || []); })
      .catch((err) => setTvPlansError(err.message || "Failed to load packages"))
      .finally(() => setLoadingTvPlans(false));
  };

  useEffect(() => {
    if (tab !== "data" || !selectedNetwork) return;
    setDataPlans([]); setSelectedPlan(null); setPlansError(""); setLoadingPlans(true);
    const billerCode = NETWORK_BILLER_CODES[selectedNetwork];
    if (!billerCode) { setPlansError("Network not supported"); setLoadingPlans(false); return; }
    fetch(`/api/recharge?type=plans&biller_code=${billerCode}`)
      .then((r) => r.json())
      .then((res) => { if (res.error) throw new Error(res.error); setDataPlans(res.plans || []); })
      .catch((err) => setPlansError(err.message || "Failed to load plans"))
      .finally(() => setLoadingPlans(false));
  }, [selectedNetwork, tab]);

 useEffect(() => {
  if (tab === "electricity" && !elecBillersLoaded) {
    setElecBillersLoaded(true);
    setLoadingBillers(true);
    fetch("/api/recharge?type=electricity")
      .then((r) => r.json())
      .then((res) =>
        setElecBillers(
          (res.billers || []).map((b) => ({
            biller_code: b.code,
            biller_id: b.id,
            biller_name: b.name,
          }))
        )
      )
      .catch(console.error)
      .finally(() => setLoadingBillers(false));
  }
  if (tab === "tv" && !tvBillersLoaded) {
    setTvBillersLoaded(true);
    setLoadingBillers(true);
    fetch("/api/recharge?type=tv")
      .then((r) => r.json())
      .then((res) =>
        setTvBillers(
          (res.billers || []).map((b) => ({
            biller_code: b.code,
            biller_id: b.id,
            biller_name: b.name,
          }))
        )
      )
      .catch(console.error)
      .finally(() => setLoadingBillers(false));
  }
}, [tab, elecBillersLoaded, tvBillersLoaded]);

  useEffect(() => {
    const customerId = tab === "electricity" ? meterNumber : smartcardNumber;
    const selectedPlanObj = tab === "electricity" ? selectedElecPlan : selectedTvPlan;
    const isReadyToVerify = selectedPlanObj?.item_code && selectedPlanObj?.biller_code;
    if ((tab !== "electricity" && tab !== "tv") || !customerId || customerId.length < 10 || !isReadyToVerify) {
      setVerifiedName(""); return;
    }
    setVerifying(true); setVerifiedName("");
    const timeoutId = setTimeout(() => {
      fetch(`/api/recharge?type=verify&item_code=${selectedPlanObj.item_code}&biller_code=${selectedPlanObj.biller_code}&customer=${customerId}`)
        .then((r) => r.json())
        .then((res) => { setVerifiedName(res.skipped ? "__skipped__" : res.name || "Verification failed"); })
        .catch(() => setVerifiedName("Error verifying name"))
        .finally(() => setVerifying(false));
    }, 1000);
    return () => clearTimeout(timeoutId);
  }, [meterNumber, smartcardNumber, selectedElecPlan, selectedTvPlan, tab]);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) { setLoading(false); return; }
      try {
        const snap = await getDoc(doc(db, "sellers", user.uid));
        if (snap.exists()) setSeller({ uid: user.uid, ...snap.data() });
        await loadRecentRecharges(user.uid);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    });
    return () => unsub();
  }, []);

  const loadRecentRecharges = async (uid) => {
    try {
      const q = query(collection(db, "recharges"), where("sellerId", "==", uid), orderBy("createdAt", "desc"), limit(10));
      const snap = await getDocs(q);
      setRecentRecharges(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (e) { console.error(e); }
  };

  const requirePin = (action) => { setPinAction(() => action); setShowPinModal(true); };
  const handleVerifyPin = (entered) => {
    if (entered === seller?.transferPin) {
      setShowPinModal(false);
      if (pinAction) { pinAction(); setPinAction(null); }
      return true;
    }
    return false;
  };

  const finalAmount =
    tab === "airtime"
      ? airtimeAmount === "custom" ? Number(customAmount || 0) : Number(airtimeAmount || 0)
      : tab === "data"   ? selectedPlan?.price || selectedPlan?.amount || 0
      : tab === "electricity" ? Number(elecAmount || 0)
      : tab === "tv"     ? selectedTvPlan?.price || selectedTvPlan?.amount || 0
      : 0;

  const walletBalance = seller?.accountBalance || 0;
  const hasEnoughBalance = walletBalance >= finalAmount && finalAmount > 0;

  const isFormValid = () => {
    if (tab === "airtime") return !!(selectedNetwork && phone && phone.length >= 11 && finalAmount > 0);
    if (tab === "data")    return !!(selectedNetwork && phone && phone.length >= 11 && selectedPlan);
    if (tab === "electricity") return !!(selectedElecBiller && selectedElecPlan && meterNumber.length >= 11 && Number(elecAmount) >= 500);
    if (tab === "tv") return !!(selectedTvBiller && smartcardNumber.length >= 10 && selectedTvPlan);
    return false;
  };

  const buildPostBody = () => {
    const cleanPhone = phone.replace(/\D/g, "");
    if (tab === "airtime") return { type: "airtime", phone: cleanPhone, amount: finalAmount, biller_code: NETWORK_BILLER_CODES[selectedNetwork] };
    if (tab === "data") return { type: "data", network: selectedNetwork, phone: cleanPhone, amount: selectedPlan.price, item_code: selectedPlan.item_code, biller_code: selectedPlan.biller_code, bundle_name: selectedPlan.name };
    if (tab === "electricity") return { type: "electricity", meter_number: meterNumber, amount: Number(elecAmount), item_code: selectedElecPlan.item_code, biller_code: selectedElecPlan.biller_code };
    if (tab === "tv") return { type: "tv", smartcard_number: smartcardNumber, amount: selectedTvPlan.price, item_code: selectedTvPlan.item_code, biller_code: selectedTvPlan.biller_code };
  };

  const callFlutterwaveVTU = async () => {
    const body = buildPostBody();
    const res = await fetch("/api/recharge", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || "Recharge failed");
    return { ref: result.ref, data: result.data };
  };

  const processRechargeWallet = async () => {
    setProcessing(true); setError("");
    const amt = finalAmount; const net = selectedNetwork;
    try {
      if (amt > walletBalance) throw new Error(`Insufficient balance. You need ₦${(amt || 0).toLocaleString()}.`);
      const { ref, data: flwData } = await callFlutterwaveVTU();
      const sellerRef = doc(db, "sellers", seller.uid);
      const rechargeRef = doc(collection(db, "recharges"));
      await runTransaction(db, async (tx) => {
        const snap = await tx.get(sellerRef);
        if ((snap.data()?.accountBalance || 0) < amt) throw new Error("Insufficient balance.");
        tx.update(sellerRef, { accountBalance: increment(-amt), updatedAt: serverTimestamp() });
        tx.set(rechargeRef, {
          sellerId: seller.uid,
          sellerName: seller.businessInfo?.businessName || seller.bankDetails?.accountName || "Unknown",
          type: tab, network: net, phone: phone.replace(/\D/g, ""), amount: amt,
          plan: tab === "data" ? selectedPlan : tab === "tv" ? selectedTvPlan : tab === "electricity" ? selectedElecPlan : null,
          flwReference: ref, flwResponse: flwData, status: "completed", paymentMethod: "wallet", createdAt: serverTimestamp(),
        });
      });
      setSeller((prev) => ({ ...prev, accountBalance: (prev.accountBalance || 0) - amt }));
      setTxRef(ref); setPaymentMethod("wallet");
      await loadRecentRecharges(seller.uid);
      setStep(3);
    } catch (err) { setError(err.message || "Purchase failed. Please try again."); }
    finally { setProcessing(false); }
  };

  const processRechargeCard = async (flwTxRef) => {
    setProcessing(true); setError("");
    const amt = finalAmount; const net = selectedNetwork;
    try {
      const verifyRes = await fetch(`/api/recharge/verify-payment?tx_ref=${flwTxRef}&amount=${amt}`);
      const verifyResult = await verifyRes.json();
      if (!verifyRes.ok || !verifyResult.verified) throw new Error(verifyResult.error || "Payment verification failed.");
      const { ref, data: flwData } = await callFlutterwaveVTU();
      const rechargeRef = doc(collection(db, "recharges"));
      await runTransaction(db, async (tx) => {
        tx.set(rechargeRef, {
          sellerId: seller.uid,
          sellerName: seller.businessInfo?.businessName || seller.bankDetails?.accountName || "Unknown",
          type: tab, network: net, phone: phone.replace(/\D/g, ""), amount: amt,
          plan: tab === "data" ? selectedPlan : tab === "tv" ? selectedTvPlan : tab === "electricity" ? selectedElecPlan : null,
          flwReference: ref, flwResponse: flwData, status: "completed", paymentMethod: "card", cardTxRef: flwTxRef, createdAt: serverTimestamp(),
        });
      });
      setTxRef(ref); setPaymentMethod("card");
      await loadRecentRecharges(seller.uid); setStep(3);
    } catch (err) { setError(err.message || "Purchase failed after card payment. Please contact support with ref: " + flwTxRef); }
    finally { setProcessing(false); }
  };

  const payWithCard = () => {
    if (typeof window === "undefined" || !window.FlutterwaveCheckout) { setError("Payment widget not loaded. Please refresh."); return; }
    const ref = "LAN_CARD_" + Date.now() + "_" + Math.random().toString(36).slice(2, 7).toUpperCase();
    window.FlutterwaveCheckout({
      public_key: process.env.NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY,
      tx_ref: ref, amount: finalAmount, currency: "NGN", payment_options: "card",
      customer: { email: seller?.email || "customer@example.com", name: seller?.bankDetails?.accountName || seller?.businessInfo?.businessName || "Customer" },
      customizations: { title: "LAN Recharge", description: `${tab.charAt(0).toUpperCase() + tab.slice(1)} purchase`, logo: "/lanlog.png" },
      callback: (response) => {
        if (response.status === "successful" || response.status === "completed") processRechargeCard(response.transaction_id?.toString() || ref);
        else setError("Card payment was not completed. Please try again.");
      },
      onclose: () => {},
    });
  };

  const clearCommonFields = () => { setPhone(""); setError(""); setVerifiedName(""); };
  const resetForm = () => {
    setTab("airtime"); setStep(1); clearCommonFields(); setTxRef(""); setPaymentMethod("wallet");
    setSelectedNetwork(null); setAirtimeAmount(""); setCustomAmount(""); setSelectedPlan(null);
    setSelectedElecBiller(null); setElecPlans([]); setSelectedElecPlan(null); setMeterNumber(""); setElecAmount("");
    setSelectedTvBiller(null); setTvPlans([]); setSelectedTvPlan(null); setSmartcardNumber("");
  };
  const switchTab = (id) => {
    setTab(id); clearCommonFields(); setSelectedNetwork(null); setAirtimePlans([]); setSelectedPlan(null);
    setSelectedElecBiller(null); setSelectedElecPlan(null); setElecPlans([]); setElecPlansError("");
    setSelectedTvBiller(null); setSelectedTvPlan(null); setTvPlans([]); setTvPlansError("");
    setAirtimeAmount(""); setCustomAmount(""); setMeterNumber(""); setElecBillersLoaded(false);
    setTvBillersLoaded(false); setSmartcardNumber("");
  };

  const sellerName = seller?.bankDetails?.accountName || seller?.businessInfo?.businessName || "Unknown Seller";

  /* ─── guard screens ────────────────────────────────────── */
  const guardStyle = { minHeight: "100vh", background: BG, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px", fontFamily: "'Lato', sans-serif" };
  const guardBox = { background: "#fff", border: `0.5px solid #e5ddd0`, padding: "48px 32px", maxWidth: "380px", width: "100%", textAlign: "center" };

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
      <div style={guardStyle}><div style={guardBox}>
        <div style={{ width: "56px", height: "56px", border: `0.5px solid #e5ddd0`, background: CREAM, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
          <Smartphone size={24} style={{ color: "#ccc" }} />
        </div>
        <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "20px", fontWeight: 700, color: NAVY, marginBottom: "8px" }}>No Seller Account</h2>
        <p style={{ fontSize: "13px", color: "#888" }}>You need a seller account to use LAN VTU services.</p>
      </div></div>
    </>
  );
  if (!seller.transferPin) return (
    <>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=Lato:wght@400;700&display=swap');`}</style>
      <div style={guardStyle}><div style={guardBox}>
        <div style={{ width: "56px", height: "56px", border: `0.5px solid rgba(184,150,62,0.3)`, background: CREAM, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
          <Lock size={24} style={{ color: GOLD }} />
        </div>
        <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "20px", fontWeight: 700, color: NAVY, marginBottom: "8px" }}>PIN Required</h2>
        <p style={{ fontSize: "13px", color: "#888" }}>Please set up your transfer PIN in the Transfer page first.</p>
      </div></div>
    </>
  );

  /* ─── tab config ─────────────────────────────────────── */
  const tabs = [
    { id: "airtime", label: "Airtime", icon: <Smartphone size={13} /> },
    { id: "data", label: "Data", icon: <Wifi size={13} /> },
    { id: "electricity", label: "Electricity", icon: <Zap size={13} /> },
    { id: "tv", label: "TV/Cable", icon: <Tv size={13} /> },
  ];

  const tabIcons = { airtime: <Smartphone size={13} />, data: <Wifi size={13} />, electricity: <Zap size={13} />, tv: <Tv size={13} /> };

  /* ─── helper: biller select button ──────────────────── */
  const BillerBtn = ({ label: lbl, selected, onClick }) => (
    <button onClick={onClick} style={{
      padding: "10px 12px", border: `0.5px solid ${selected ? NAVY : "#e5ddd0"}`,
      background: selected ? NAVY : CREAM, color: selected ? "#fff" : NAVY,
      fontSize: "11px", fontWeight: 700, fontFamily: "'Lato', sans-serif",
      cursor: "pointer", transition: "all 0.15s", borderRadius: 0, textAlign: "left",
    }}>
      {lbl}
    </button>
  );

  /* ─── helper: plan select button ─────────────────────── */
  const PlanBtn = ({ label: lbl, sub, price, selected, onClick }) => (
    <button onClick={onClick} style={{
      padding: "10px 12px", border: `0.5px solid ${selected ? NAVY : "#e5ddd0"}`,
      background: selected ? NAVY : CREAM, color: selected ? "#fff" : NAVY,
      fontSize: "11px", fontFamily: "'Lato', sans-serif",
      cursor: "pointer", transition: "all 0.15s", borderRadius: 0, textAlign: "left",
    }}>
      <p style={{ fontWeight: 700, margin: "0 0 2px", fontSize: "12px" }}>{lbl}</p>
      {sub && <p style={{ margin: "0 0 4px", fontSize: "10px", opacity: 0.6 }}>{sub}</p>}
      {price !== undefined && <p style={{ fontWeight: 700, margin: 0, fontSize: "12px", color: selected ? GOLDD : GOLD }}>₦{price.toLocaleString()}</p>}
    </button>
  );

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400&family=Lato:wght@300;400;700&display=swap');
        .recharge-root { font-family:'Lato',sans-serif; background:${BG}; min-height:100vh; }
        .txn-row { display:flex; align-items:center; gap:10px; padding:8px 0; border-bottom:0.5px solid #f5f0e8; cursor:pointer; }
        .txn-row:last-child { border-bottom:none; }
        .pay-grid { display:grid; grid-template-columns:1fr; gap:16px; }
        @media(min-width:1024px){ .pay-grid{ grid-template-columns:280px 1fr !important; } }
        @keyframes spin { to { transform:rotate(360deg); } }
        @keyframes slideUp { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
        .anim { animation:slideUp 0.4s cubic-bezier(.4,0,.2,1) both; }
        input[type=number]::-webkit-outer-spin-button,
        input[type=number]::-webkit-inner-spin-button { -webkit-appearance:none; margin:0; }
      `}</style>
      <Script src="https://checkout.flutterwave.com/v3.js" strategy="lazyOnload" />

      <div className="recharge-root">
        <Navbar />

        <main style={{ maxWidth: "1100px", margin: "0 auto", padding: "0" }}>

          {/* ── HERO (identical to transfer page) ── */}
          <section style={{ background: NAVY, backgroundImage: "radial-gradient(rgba(184,150,62,0.07) 1px,transparent 1px),radial-gradient(rgba(255,255,255,0.025) 1px,transparent 1px)", backgroundSize: "28px 28px,14px 14px", backgroundPosition: "0 0,7px 7px", padding: "40px 24px 0" }}>
            <div style={{ maxWidth: "1060px", margin: "0 auto" }}>
              <p style={{ ...eyebrow, color: GOLDD }}>LAN Wallet · VTU Services</p>
              <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(28px,5vw,46px)", fontWeight: 900, color: "#fff", lineHeight: 1.05, letterSpacing: "-1px", margin: "6px 0 4px" }}>
                Buy Airtime &amp; Data.
              </h1>
              <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(24px,4vw,40px)", fontWeight: 900, color: GOLD, fontStyle: "italic", lineHeight: 1.1, margin: "0 0 12px" }}>
                Instantly.
              </h1>
              <p style={{ fontSize: "14px", color: "rgba(245,240,232,0.65)", maxWidth: "440px", lineHeight: 1.75, fontWeight: 300, marginBottom: "0" }}>
                Top up any Nigerian network from your LAN wallet or card. No queues, no delays.
              </p>
              {/* stat strip */}
              <div style={{ borderTop: "0.5px solid rgba(184,150,62,0.2)", marginTop: "28px", display: "flex", flexWrap: "wrap" }}>
                {[["4", "Networks"], ["Instant", "Delivery"], ["TV+Elec", "Bills Too"], ["₦50", "Min Top-Up"]].map(([val, lbl]) => (
                  <div key={lbl} style={{ flex: "1 1 100px", padding: "18px 16px", borderRight: "0.5px solid rgba(184,150,62,0.12)" }}>
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
              <div style={{ marginBottom: "24px" }}>
                <p style={eyebrow}>Services</p>
                <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(20px,3vw,30px)", fontWeight: 700, color: NAVY, margin: 0 }}>
                  {step === 1 ? "Buy Airtime & Data" : step === 2 ? "Confirm Purchase" : "Purchase Successful"}
                </h2>
              </div>

              <div className="pay-grid">

                {/* ── LEFT SIDEBAR ── */}
                <div>
                  {/* Account box — dark navy, identical to transfer page */}
                  <div style={{ background: NAVY, backgroundImage: "radial-gradient(rgba(184,150,62,0.06) 1px,transparent 1px)", backgroundSize: "22px 22px", padding: "22px", marginBottom: "14px" }}>
                    <p style={{ ...eyebrow, color: "rgba(184,150,62,0.75)", marginBottom: "14px" }}>Your LAN Account</p>
                    <p style={{ fontFamily: "'Playfair Display', serif", fontSize: "15px", fontWeight: 700, color: "#fff", marginBottom: "4px" }}>{sellerName}</p>
                    <p style={{ fontSize: "10px", color: "rgba(255,255,255,0.4)", marginBottom: "14px" }}>LAN Wallet · Verified Seller</p>
                    <div style={{ borderTop: "0.5px solid rgba(184,150,62,0.15)", paddingTop: "12px" }}>
                      <p style={{ fontSize: "10px", color: "rgba(255,255,255,0.4)", marginBottom: "3px" }}>Available Balance</p>
                      <p style={{ fontFamily: "'Playfair Display', serif", fontSize: "28px", fontWeight: 700, color: "#fff", margin: 0 }}>
                        ₦{(seller?.accountBalance || 0).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {/* Quick tips */}
                  <div style={{ background: "#fff", border: `0.5px solid #e5ddd0`, padding: "18px", marginBottom: "14px" }}>
                    <p style={{ fontFamily: "'Playfair Display', serif", fontSize: "14px", fontWeight: 700, color: NAVY, marginBottom: "14px" }}>Quick Tips</p>
                    {[
                      [<Signal size={11} />, "All purchases are instant and non-refundable"],
                      [<Wallet size={11} />, "Pay from wallet or directly with your card"],
                      [<Lock size={11} />, "Wallet payments require your PIN"],
                      [<Receipt size={11} />, "Transactions are saved to your history"],
                    ].map(([icon, text], i) => (
                      <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "8px", paddingBottom: "10px", borderBottom: i < 3 ? "0.5px solid #f5f0e8" : "none", marginBottom: i < 3 ? "10px" : 0 }}>
                        <span style={{ color: GOLD, marginTop: "1px", flexShrink: 0 }}>{icon}</span>
                        <p style={{ fontSize: "11px", color: "#888", margin: 0, lineHeight: 1.5 }}>{text}</p>
                      </div>
                    ))}
                  </div>

                  {/* Recent purchases */}
                  {recentRecharges.length > 0 && (
                    <div style={{ background: "#fff", border: `0.5px solid #e5ddd0`, padding: "18px" }}>
                      <p style={{ fontFamily: "'Playfair Display', serif", fontSize: "14px", fontWeight: 700, color: NAVY, marginBottom: "14px" }}>Recent Purchases</p>
                      {recentRecharges.slice(0, 5).map((r) => {
                        const net = NETWORKS.find((n) => n.id === r.network);
                        const icon = r.type === "tv" ? <Tv size={11} /> : r.type === "electricity" ? <Zap size={11} /> : r.type === "data" ? <Wifi size={11} /> : <Smartphone size={11} />;
                        return (
                          <div key={r.id} className="txn-row">
                            <div style={{ width: "28px", height: "28px", background: CREAM, border: `0.5px solid rgba(184,150,62,0.2)`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: GOLD }}>
                              {icon}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <p style={{ fontSize: "11px", fontWeight: 700, color: NAVY, margin: "0 0 1px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                {r.type === "electricity" || r.type === "tv" ? r.plan?.name : `${r.phone} · ${net?.name || ""}`}
                              </p>
                              <p style={{ fontSize: "9px", color: "#aaa", margin: 0, fontFamily: "monospace" }}>
                                {r.type === "data" ? r.plan?.size : r.type === "tv" ? "TV/Cable" : r.type === "electricity" ? "Electricity" : "Airtime"}
                                {" · "}{r.paymentMethod === "card" ? "Card" : "Wallet"}
                              </p>
                            </div>
                            <p style={{ fontSize: "11px", fontWeight: 700, color: "#dc2626", flexShrink: 0 }}>
                              -₦{(r.amount || 0).toLocaleString()}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* ── RIGHT: Form area ── */}
                <div>

                  {/* STEP 1 */}
                  {step === 1 && (
                    <div className="anim">
                      {/* Tab bar — sharp corners, transfer page style */}
                      <div style={{ display: "flex", background: "#fff", border: `0.5px solid #e5ddd0`, marginBottom: "0", overflow: "hidden" }}>
                        {tabs.map((t) => (
                          <button
                            key={t.id}
                            onClick={() => switchTab(t.id)}
                            style={{
                              flex: 1,
                              padding: "14px 6px",
                              display: "flex",
                              flexDirection: "column",
                              alignItems: "center",
                              gap: "5px",
                              border: "none",
                              borderBottom: tab === t.id ? `2px solid ${NAVY}` : "2px solid transparent",
                              background: tab === t.id ? CREAM : "transparent",
                              color: tab === t.id ? NAVY : "#aaa",
                              fontFamily: "'Lato', sans-serif",
                              fontSize: "9px",
                              fontWeight: 700,
                              letterSpacing: "0.1em",
                              textTransform: "uppercase",
                              cursor: "pointer",
                              transition: "all 0.15s",
                            }}
                          >
                            <span style={{ color: tab === t.id ? GOLD : "#ccc" }}>{t.icon}</span>
                            {t.label}
                          </button>
                        ))}
                      </div>

                      {/* Form card */}
                      <div style={{ ...sectionCard, marginTop: 0, borderTop: "none" }}>
                        <p style={eyebrow}>Step 1 of 3</p>
                        <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: "18px", fontWeight: 700, color: NAVY, marginBottom: "22px" }}>
                          {tab === "airtime" ? "Airtime Top-Up" : tab === "data" ? "Data Bundle" : tab === "electricity" ? "Electricity Payment" : "TV / Cable Subscription"}
                        </h3>

                        {/* ── AIRTIME & DATA ── */}
                        {(tab === "airtime" || tab === "data") && (
                          <>
                            {/* Network */}
                            <div style={{ marginBottom: "18px" }}>
                              <label style={label}>Select Network</label>
                              <div style={{ display: "flex", gap: "6px" }}>
                                {NETWORKS.map((n) => (
                                  <NetworkBtn
                                    key={n.id}
                                    network={n}
                                    selected={selectedNetwork === n.id}
                                    onClick={() => { setSelectedNetwork(n.id); setSelectedPlan(null); setAirtimePlans([]); }}
                                  />
                                ))}
                              </div>
                            </div>

                            {/* Phone */}
                            <div style={{ marginBottom: "18px" }}>
                              <label style={label}>Phone Number</label>
                              <input
                                type="tel"
                                inputMode="numeric"
                                placeholder="08012345678"
                                value={phone}
                                onFocus={() => setFocusPhone(true)}
                                onBlur={() => setFocusPhone(false)}
                                onChange={(e) => {
                                  const val = e.target.value.replace(/\D/g, "").slice(0, 11);
                                  setPhone(val);
                                  if (val.length >= 4) {
                                    const detected = detectNetwork(val);
                                    if (detected && detected !== selectedNetwork) {
                                      setSelectedNetwork(detected); setSelectedPlan(null); setAirtimePlans([]);
                                    }
                                  }
                                }}
                                style={{ ...inputStyle(focusPhone), fontFamily: "monospace" }}
                              />
                              {phone.length > 0 && phone.length < 11 && (
                                <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "6px" }}>
                                  <AlertCircle size={11} style={{ color: "#ea580c" }} />
                                  <p style={{ fontSize: "11px", color: "#ea580c", margin: 0 }}>
                                    {11 - phone.length} digit{11 - phone.length !== 1 ? "s" : ""} remaining
                                  </p>
                                </div>
                              )}
                              {phone.length === 11 && selectedNetwork && detectNetwork(phone) && detectNetwork(phone) !== selectedNetwork && (
                                <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "#fffbeb", border: `0.5px solid #fbbf24`, padding: "8px 12px", marginTop: "8px" }}>
                                  <AlertCircle size={12} style={{ color: "#d97706", flexShrink: 0 }} />
                                  <p style={{ fontSize: "11px", color: "#92400e", margin: 0 }}>
                                    This looks like a {NETWORKS.find((n) => n.id === detectNetwork(phone))?.name} number.{" "}
                                    <button onClick={() => { setSelectedNetwork(detectNetwork(phone)); setSelectedPlan(null); setAirtimePlans([]); }}
                                      style={{ background: "none", border: "none", cursor: "pointer", color: "#92400e", fontWeight: 700, fontSize: "11px", textDecoration: "underline", padding: 0 }}>
                                      Switch now
                                    </button>
                                  </p>
                                </div>
                              )}
                            </div>

                            {/* Airtime Amount */}
                            {tab === "airtime" && (
                              <div style={{ marginBottom: "18px" }}>
                                <label style={label}>Select Amount</label>
                                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "6px", marginBottom: "10px" }}>
                                  {[100, 200, 500, 1000, 2000, 5000].map((amt) => (
                                    <button
                                      key={amt}
                                      onClick={() => { setAirtimeAmount(String(amt)); setCustomAmount(""); }}
                                      style={{
                                        padding: "10px", border: `0.5px solid ${airtimeAmount === String(amt) && airtimeAmount !== "custom" ? NAVY : "#e5ddd0"}`,
                                        background: airtimeAmount === String(amt) && airtimeAmount !== "custom" ? NAVY : CREAM,
                                        color: airtimeAmount === String(amt) && airtimeAmount !== "custom" ? "#fff" : NAVY,
                                        fontSize: "12px", fontWeight: 700, cursor: "pointer",
                                        fontFamily: "'Lato', sans-serif", transition: "all 0.15s", borderRadius: 0,
                                      }}
                                    >
                                      ₦{amt.toLocaleString()}
                                    </button>
                                  ))}
                                </div>
                                <div style={{ position: "relative" }}>
                                  <span style={{ position: "absolute", left: "13px", top: "50%", transform: "translateY(-50%)", color: "#aaa", fontWeight: 700, fontSize: "14px" }}>₦</span>
                                  <input
                                    type="number"
                                    placeholder="Custom amount (min ₦50)"
                                    value={customAmount}
                                    onFocus={() => { setFocusCustom(true); setAirtimeAmount("custom"); }}
                                    onBlur={() => setFocusCustom(false)}
                                    onChange={(e) => { setCustomAmount(e.target.value); setAirtimeAmount("custom"); }}
                                    style={{ ...inputStyle(focusCustom), paddingLeft: "28px" }}
                                  />
                                </div>
                              </div>
                            )}

                            {/* Data Plans */}
                            {tab === "data" && (
                              <div style={{ marginBottom: "18px" }}>
                                <label style={label}>
                                  {selectedNetwork ? `${NETWORKS.find((n) => n.id === selectedNetwork)?.name} Data Plans` : "Select a network first"}
                                </label>
                                {!selectedNetwork ? (
                                  <div style={{ background: CREAM, border: `0.5px solid #e5ddd0`, padding: "24px", textAlign: "center" }}>
                                    <p style={{ fontSize: "12px", color: "#aaa", margin: 0 }}>Please select a network above</p>
                                  </div>
                                ) : loadingPlans ? (
                                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", padding: "24px", color: "#aaa" }}>
                                    <div style={{ width: "16px", height: "16px", border: `2px solid ${GOLD}`, borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                                    <span style={{ fontSize: "12px" }}>Loading plans…</span>
                                  </div>
                                ) : plansError ? (
                                  <div style={{ display: "flex", alignItems: "center", gap: "6px", background: "#fff1f2", border: `0.5px solid #fca5a5`, padding: "10px 13px" }}>
                                    <AlertCircle size={12} style={{ color: "#ef4444" }} />
                                    <p style={{ fontSize: "12px", color: "#dc2626", margin: 0 }}>{plansError}</p>
                                  </div>
                                ) : (
                                  <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "6px", maxHeight: "280px", overflowY: "auto" }}>
                                    {dataPlans.map((plan) => (
                                      <PlanBtn
                                        key={plan.id}
                                        label={plan.size}
                                        sub={plan.duration}
                                        price={plan.price}
                                        selected={selectedPlan?.id === plan.id}
                                        onClick={() => setSelectedPlan(plan)}
                                      />
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}
                          </>
                        )}

                        {/* ── ELECTRICITY ── */}
                        {tab === "electricity" && (
                          <>
                            <div style={{ marginBottom: "18px" }}>
                              <label style={label}>Select Provider</label>
                              {loadingBillers ? (
                                <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#aaa", padding: "8px 0" }}>
                                  <div style={{ width: "14px", height: "14px", border: `2px solid ${GOLD}`, borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                                  <span style={{ fontSize: "12px" }}>Loading providers…</span>
                                </div>
                              ) : (
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px" }}>
                                 {elecBillers.map((b) => (
                                  <BillerBtn
                                    key={b.biller_code}
                                    label={b.biller_name}
                                    selected={selectedElecBiller === b.biller_code}
onClick={() => {
  console.log('Elec biller selected:', b);
  setSelectedElecBiller(b.biller_code);
  fetchElecPlans(b.biller_id);
}}
                                  />
                                ))}
                                </div>
                              )}
                            </div>

                            {selectedElecBiller && (
                              <div style={{ marginBottom: "18px" }}>
                                <label style={label}>Meter Type</label>
                                {loadingElecPlans ? (
                                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", padding: "16px", color: "#aaa" }}>
                                    <div style={{ width: "14px", height: "14px", border: `2px solid ${GOLD}`, borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                                    <span style={{ fontSize: "12px" }}>Loading…</span>
                                  </div>
                                ) : elecPlansError ? (
                                  <p style={{ fontSize: "12px", color: "#dc2626" }}>{elecPlansError}</p>
                                ) : (
                                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px" }}>
                                    {elecPlans.map((plan) => (
                                      <BillerBtn
                                        key={plan.id}
                                        label={plan.name}
                                        selected={selectedElecPlan?.id === plan.id}
                                        onClick={() => setSelectedElecPlan(plan)}
                                      />
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}

                            <div style={{ marginBottom: "18px" }}>
                              <label style={label}>Meter Number</label>
                              <div style={{ position: "relative" }}>
                                <input
                                  type="text"
                                  placeholder="Enter meter number"
                                  value={meterNumber}
                                  onFocus={() => setFocusMeter(true)}
                                  onBlur={() => setFocusMeter(false)}
                                  onChange={(e) => setMeterNumber(e.target.value.replace(/\D/g, ""))}
                                  style={{ ...inputStyle(focusMeter), fontFamily: "monospace" }}
                                />
                                {verifying && (
                                  <div style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)" }}>
                                    <div style={{ width: "14px", height: "14px", border: `2px solid ${GOLD}`, borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                                  </div>
                                )}
                              </div>
                              {verifiedName && verifiedName !== "__skipped__" && (
                                <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px 12px", marginTop: "6px", background: verifiedName.includes("failed") ? "#fff1f2" : "rgba(22,163,74,0.06)", border: `0.5px solid ${verifiedName.includes("failed") ? "#fca5a5" : "rgba(22,163,74,0.3)"}` }}>
                                  {verifiedName.includes("failed") ? <AlertCircle size={12} style={{ color: "#ef4444" }} /> : <CheckCircle2 size={12} style={{ color: "#16a34a" }} />}
                                  <p style={{ fontSize: "11px", fontWeight: 700, color: verifiedName.includes("failed") ? "#dc2626" : "#14532d", margin: 0, textTransform: "uppercase", letterSpacing: "0.05em" }}>{verifiedName}</p>
                                </div>
                              )}
                              {verifiedName === "__skipped__" && (
                                <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px 12px", marginTop: "6px", background: CREAM, border: `0.5px solid rgba(184,150,62,0.25)` }}>
                                  <AlertCircle size={12} style={{ color: GOLD }} />
                                  <p style={{ fontSize: "11px", color: "#8a6d1e", margin: 0 }}>Verification not available — meter confirmed at payment.</p>
                                </div>
                              )}
                            </div>

                            <div style={{ marginBottom: "18px" }}>
                              <label style={label}>Amount (₦)</label>
                              <div style={{ position: "relative" }}>
                                <span style={{ position: "absolute", left: "13px", top: "50%", transform: "translateY(-50%)", color: "#aaa", fontWeight: 700, fontSize: "14px" }}>₦</span>
                                <input
                                  type="number"
                                  placeholder="Min ₦500"
                                  value={elecAmount}
                                  onFocus={() => setFocusElecAmt(true)}
                                  onBlur={() => setFocusElecAmt(false)}
                                  onChange={(e) => setElecAmount(e.target.value)}
                                  style={{ ...inputStyle(focusElecAmt), paddingLeft: "28px" }}
                                />
                              </div>
                            </div>
                          </>
                        )}

                        {/* ── TV / CABLE ── */}
                        {tab === "tv" && (
                          <>
                            <div style={{ marginBottom: "18px" }}>
                              <label style={label}>Select Provider</label>
                              {loadingBillers ? (
                                <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#aaa", padding: "8px 0" }}>
                                  <div style={{ width: "14px", height: "14px", border: `2px solid ${GOLD}`, borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                                  <span style={{ fontSize: "12px" }}>Loading providers…</span>
                                </div>
                              ) : (
                                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "6px" }}>
                               {tvBillers.map((b) => (
                                  <BillerBtn
                                    key={b.biller_code}
                                    label={b.biller_name}
                                    selected={selectedTvBiller === b.biller_code}
onClick={() => {
  console.log('TV biller selected:', b);
  setSelectedTvBiller(b.biller_code);
  fetchTvPlans(b.biller_id);
}}                                  />
                                ))}
                                </div>
                              )}
                            </div>

                            <div style={{ marginBottom: "18px" }}>
                              <label style={label}>Smartcard / IUC Number</label>
                              <div style={{ position: "relative" }}>
                                <input
                                  type="text"
                                  inputMode="numeric"
                                  placeholder="Enter smartcard number"
                                  value={smartcardNumber}
                                  onFocus={() => setFocusSmart(true)}
                                  onBlur={() => setFocusSmart(false)}
                                  onChange={(e) => setSmartcardNumber(e.target.value.replace(/\D/g, "").slice(0, 12))}
                                  style={{ ...inputStyle(focusSmart), fontFamily: "monospace" }}
                                />
                                {verifying && (
                                  <div style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)" }}>
                                    <div style={{ width: "14px", height: "14px", border: `2px solid ${GOLD}`, borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                                  </div>
                                )}
                              </div>
                              {verifiedName && (
                                <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px 12px", marginTop: "6px", background: verifiedName.includes("failed") ? "#fff1f2" : "rgba(22,163,74,0.06)", border: `0.5px solid ${verifiedName.includes("failed") ? "#fca5a5" : "rgba(22,163,74,0.3)"}` }}>
                                  {verifiedName.includes("failed") ? <AlertCircle size={12} style={{ color: "#ef4444" }} /> : <CheckCircle2 size={12} style={{ color: "#16a34a" }} />}
                                  <p style={{ fontSize: "11px", fontWeight: 700, color: verifiedName.includes("failed") ? "#dc2626" : "#14532d", margin: 0, textTransform: "uppercase", letterSpacing: "0.05em" }}>{verifiedName}</p>
                                </div>
                              )}
                            </div>

                            {selectedTvBiller && (
                              <div style={{ marginBottom: "18px" }}>
                                <label style={label}>Select Package</label>
                                {loadingTvPlans ? (
                                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", padding: "16px", color: "#aaa" }}>
                                    <div style={{ width: "14px", height: "14px", border: `2px solid ${GOLD}`, borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                                    <span style={{ fontSize: "12px" }}>Loading packages…</span>
                                  </div>
                                ) : tvPlansError ? (
                                  <p style={{ fontSize: "12px", color: "#dc2626" }}>{tvPlansError}</p>
                                ) : tvPlans.length === 0 ? (
                                  <div style={{ background: CREAM, border: `0.5px solid #e5ddd0`, padding: "16px", textAlign: "center" }}>
                                    <p style={{ fontSize: "12px", color: "#aaa", margin: 0 }}>No packages found</p>
                                  </div>
                                ) : (
                                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px", maxHeight: "240px", overflowY: "auto" }}>
                                    {tvPlans.map((plan) => (
                                      <PlanBtn
                                        key={plan.id}
                                        label={plan.name}
                                        price={plan.price}
                                        selected={selectedTvPlan?.id === plan.id}
                                        onClick={() => setSelectedTvPlan(plan)}
                                      />
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}
                          </>
                        )}

                        {/* Fee / summary strip */}
                        {isFormValid() && (
                          <div style={{ background: CREAM, border: `0.5px solid rgba(184,150,62,0.2)`, padding: "10px 14px", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                            <div>
                              <p style={{ ...eyebrow, marginBottom: "2px" }}>Total Amount</p>
                              <p style={{ fontSize: "10px", color: "#aaa", margin: 0 }}>
                                {hasEnoughBalance ? "Will deduct from wallet" : "Wallet insufficient — pay with card"}
                              </p>
                            </div>
                            <p style={{ fontFamily: "'Playfair Display', serif", fontSize: "20px", fontWeight: 700, color: NAVY, margin: 0 }}>
                              ₦{finalAmount.toLocaleString()}
                            </p>
                          </div>
                        )}

                        {error && (
                          <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "#fff1f2", border: `0.5px solid #fca5a5`, padding: "10px 13px", marginBottom: "14px" }}>
                            <AlertCircle size={14} style={{ color: "#ef4444", flexShrink: 0 }} />
                            <p style={{ fontSize: "12px", color: "#dc2626", margin: 0 }}>{error}</p>
                          </div>
                        )}

                        <button
                          onClick={() => {
                            setError("");
                            const detected = detectNetwork(phone);
                            if (detected && detected !== selectedNetwork) {
                              setSelectedNetwork(detected); setSelectedPlan(null); setAirtimePlans([]);
                            }
                            setStep(2);
                          }}
                          disabled={!isFormValid()}
                          style={navyBtn(!isFormValid())}
                        >
                          Review Order <ArrowRight size={14} />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* STEP 2 — Confirm */}
                  {step === 2 && (
                    <div style={{ ...sectionCard }} className="anim">
                      <button onClick={() => setStep(1)} style={{ background: "none", border: "none", cursor: "pointer", color: "#aaa", fontSize: "11px", fontFamily: "'Lato', sans-serif", padding: "0", marginBottom: "16px", display: "flex", alignItems: "center", gap: "4px" }}>
                        ← Back
                      </button>
                      <p style={eyebrow}>Step 2 of 3</p>
                      <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: "18px", fontWeight: 700, color: NAVY, marginBottom: "20px" }}>Confirm Purchase</h3>

                      <div style={{ background: CREAM, border: `0.5px solid rgba(184,150,62,0.18)`, padding: "18px", marginBottom: "18px" }}>
                        {/* Type */}
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", padding: "7px 0", borderBottom: "0.5px solid rgba(184,150,62,0.12)" }}>
                          <span style={{ color: "#aaa" }}>Type</span>
                          <span style={{ fontWeight: 700, color: NAVY }}>
                            {tab === "airtime" ? "📱 Airtime" : tab === "data" ? "📶 Data" : tab === "electricity" ? "⚡ Electricity" : "📺 TV/Cable"}
                          </span>
                        </div>

                        {(tab === "airtime" || tab === "data") && (
                          <>
                            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", padding: "7px 0", borderBottom: "0.5px solid rgba(184,150,62,0.12)" }}>
                              <span style={{ color: "#aaa" }}>Network</span>
                              <span style={{ fontWeight: 700, color: NAVY }}>{NETWORKS.find((n) => n.id === selectedNetwork)?.name}</span>
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", padding: "7px 0", borderBottom: "0.5px solid rgba(184,150,62,0.12)" }}>
                              <span style={{ color: "#aaa" }}>Phone</span>
                              <span style={{ fontWeight: 700, color: NAVY, fontFamily: "monospace" }}>{phone}</span>
                            </div>
                          </>
                        )}

                        {tab === "data" && selectedPlan && (
                          <>
                            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", padding: "7px 0", borderBottom: "0.5px solid rgba(184,150,62,0.12)" }}>
                              <span style={{ color: "#aaa" }}>Plan</span>
                              <span style={{ fontWeight: 700, color: NAVY }}>{selectedPlan.size}</span>
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", padding: "7px 0", borderBottom: "0.5px solid rgba(184,150,62,0.12)" }}>
                              <span style={{ color: "#aaa" }}>Validity</span>
                              <span style={{ fontWeight: 700, color: NAVY }}>{selectedPlan.duration}</span>
                            </div>
                          </>
                        )}

                        {tab === "electricity" && (
                          <>
                            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", padding: "7px 0", borderBottom: "0.5px solid rgba(184,150,62,0.12)" }}>
                              <span style={{ color: "#aaa" }}>Provider</span>
                              <span style={{ fontWeight: 700, color: NAVY }}>{elecBillers.find((b) => b.biller_code === selectedElecBiller)?.biller_name}</span>
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", padding: "7px 0", borderBottom: "0.5px solid rgba(184,150,62,0.12)" }}>
                              <span style={{ color: "#aaa" }}>Meter Type</span>
                              <span style={{ fontWeight: 700, color: NAVY }}>{selectedElecPlan?.name}</span>
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", padding: "7px 0", borderBottom: "0.5px solid rgba(184,150,62,0.12)" }}>
                              <span style={{ color: "#aaa" }}>Meter No.</span>
                              <span style={{ fontWeight: 700, color: NAVY, fontFamily: "monospace" }}>{meterNumber}</span>
                            </div>
                          </>
                        )}

                        {tab === "tv" && (
                          <>
                            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", padding: "7px 0", borderBottom: "0.5px solid rgba(184,150,62,0.12)" }}>
                              <span style={{ color: "#aaa" }}>Provider</span>
                              <span style={{ fontWeight: 700, color: NAVY }}>{tvBillers.find((b) => b.biller_code === selectedTvBiller)?.biller_name}</span>
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", padding: "7px 0", borderBottom: "0.5px solid rgba(184,150,62,0.12)" }}>
                              <span style={{ color: "#aaa" }}>Package</span>
                              <span style={{ fontWeight: 700, color: NAVY }}>{selectedTvPlan?.name}</span>
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", padding: "7px 0", borderBottom: "0.5px solid rgba(184,150,62,0.12)" }}>
                              <span style={{ color: "#aaa" }}>Smartcard No.</span>
                              <span style={{ fontWeight: 700, color: NAVY, fontFamily: "monospace" }}>{smartcardNumber}</span>
                            </div>
                          </>
                        )}

                        {/* Total */}
                        <div style={{ borderTop: `0.5px solid rgba(184,150,62,0.2)`, paddingTop: "14px", marginTop: "6px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span style={{ fontSize: "12px", fontWeight: 700, color: NAVY }}>Total</span>
                          <span style={{ fontFamily: "'Playfair Display', serif", fontSize: "22px", fontWeight: 700, color: NAVY }}>₦{finalAmount.toLocaleString()}</span>
                        </div>

                        {/* Wallet status */}
                        <div style={{ marginTop: "12px", background: hasEnoughBalance ? "rgba(22,163,74,0.06)" : "#fffbeb", border: `0.5px solid ${hasEnoughBalance ? "rgba(22,163,74,0.3)" : "#fbbf24"}`, padding: "10px 13px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <Wallet size={13} style={{ color: hasEnoughBalance ? "#16a34a" : "#d97706" }} />
                            <span style={{ fontSize: "11px", fontWeight: 700, color: hasEnoughBalance ? "#14532d" : "#92400e" }}>
                              Wallet: ₦{walletBalance.toLocaleString()}
                            </span>
                          </div>
                          <span style={{ fontSize: "10px", fontWeight: 700, color: hasEnoughBalance ? "#16a34a" : "#d97706", letterSpacing: "0.05em", textTransform: "uppercase" }}>
                            {hasEnoughBalance ? "✓ Sufficient" : "Insufficient"}
                          </span>
                        </div>
                      </div>

                      {error && (
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "#fff1f2", border: `0.5px solid #fca5a5`, padding: "10px 13px", marginBottom: "14px" }}>
                          <AlertCircle size={14} style={{ color: "#ef4444", flexShrink: 0 }} />
                          <p style={{ fontSize: "12px", color: "#dc2626", margin: 0 }}>{error}</p>
                        </div>
                      )}

                      {hasEnoughBalance ? (
                        <button onClick={() => requirePin(processRechargeWallet)} disabled={processing} style={navyBtn(processing)}>
                          {processing
                            ? <><div style={{ width: "14px", height: "14px", border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} /> Processing…</>
                            : <><Lock size={14} /> Pay from Wallet</>
                          }
                        </button>
                      ) : (
                        <div>
                          <div style={{ background: CREAM, border: `0.5px solid rgba(184,150,62,0.25)`, padding: "10px 14px", marginBottom: "10px" }}>
                            <p style={{ fontSize: "11px", color: "#8a6d1e", textAlign: "center", margin: 0, lineHeight: 1.6 }}>
                              Your wallet balance (₦{walletBalance.toLocaleString()}) is insufficient.
                              Pay ₦{finalAmount.toLocaleString()} directly with your card.
                            </p>
                          </div>
                          <button onClick={payWithCard} disabled={processing} style={goldBtn(processing)}>
                            {processing
                              ? <><div style={{ width: "14px", height: "14px", border: "2px solid rgba(13,34,68,0.3)", borderTopColor: NAVY, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} /> Processing…</>
                              : <><CreditCard size={14} /> Pay ₦{finalAmount.toLocaleString()} with Card</>
                            }
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* STEP 3 — Success */}
                  {step === 3 && (
                    <SuccessScreen
                      type={tab}
                      network={selectedNetwork}
                      phone={phone}
                      amount={finalAmount}
                      plan={tab === "tv" ? selectedTvPlan : tab === "electricity" ? selectedElecPlan : selectedPlan}
                      txRef={txRef}
                      paymentMethod={paymentMethod}
                      onReset={resetForm}
                    />
                  )}

                </div>
              </div>
            </div>
          </div>
        </main>

        {showPinModal && (
          <PinConfirmModal
            onVerify={handleVerifyPin}
            onClose={() => { setShowPinModal(false); setPinAction(null); }}
          />
        )}
      </div>
    </>
  );
}