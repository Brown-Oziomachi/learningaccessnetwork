"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Smartphone,
  Wifi,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  Lock,
  Eye,
  EyeOff,
  X,
  Zap,
  Signal,
  RefreshCw,
  Receipt,
  Wallet,
  Tv,
  CreditCard,
} from "lucide-react";
import Navbar from "@/components/NavBar";
import { onAuthStateChanged } from "firebase/auth";
import {
  doc,
  getDoc,
  collection,
  runTransaction,
  serverTimestamp,
  increment,
  getDocs,
  query,
  where,
  orderBy,
  limit,
} from "firebase/firestore";
import { auth, db } from "@/lib/firebaseConfig";
import { useSearchParams } from "next/navigation";
import Script from "next/script";

// ─── Constants ────────────────────────────────────────────────────────────────
const NETWORKS = [
  {
    id: "MTN",
    name: "MTN",
    color: "#FFC107",
    bg: "bg-yellow-400",
    text: "text-yellow-900",
    border: "border-yellow-400",
  },
  {
    id: "AIRTEL",
    name: "Airtel",
    color: "#E53935",
    bg: "bg-red-500",
    text: "text-white",
    border: "border-red-500",
  },
  {
    id: "GLO",
    name: "Glo",
    color: "#4CAF50",
    bg: "bg-green-500",
    text: "text-white",
    border: "border-green-500",
  },
  {
    id: "9MOBILE",
    name: "9Mobile",
    color: "#006633",
    bg: "bg-emerald-700",
    text: "text-white",
    border: "border-emerald-700",
  },
];
const AIRTIME_AMOUNTS = [50, 100, 200, 500, 1000, 2000];
const ELEC_BILLERS = [
  { id: "IKEDC", name: "Ikeja Electric" },
  { id: "EKEDC", name: "Eko Electric" },
  { id: "AEDC", name: "Abuja Electric" },
  { id: "PHEDC", name: "Port Harcourt Electric" },
  { id: "KEDCO", name: "Kano Electric" },
  { id: "IBEDC", name: "Ibadan Electric" },
  { id: "JEDC", name: "Jos Electric" },
  { id: "BEDC", name: "Benin Electric" },
  { id: "EEDC", name: "Enugu Electric" },
];
const TV_BILLER_LIST = [
  { id: "DSTV", name: "DStv" },
  { id: "GOTV", name: "GOtv" },
  { id: "STARTIMES", name: "StarTimes" },
];

// ─── PIN Input ────────────────────────────────────────────────────────────────
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
    const paste = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, 4);
    onChange(paste);
    inputs.current[Math.min(paste.length, 3)]?.focus();
    e.preventDefault();
  };
  useEffect(() => {
    inputs.current[0]?.focus();
  }, []);
  return (
    <div className="flex gap-3 justify-center">
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
          className={`w-14 h-14 text-center text-2xl font-bold rounded-2xl border-2 outline-none transition-all duration-150
            ${value[i] ? "border-blue-950 bg-blue-950 text-white shadow-lg scale-105" : "border-gray-200 bg-gray-50 text-gray-900"}
            focus:border-blue-950 focus:bg-blue-50 focus:scale-105 disabled:opacity-40 disabled:cursor-not-allowed`}
        />
      ))}
    </div>
  );
}

// ─── PIN Confirm Modal ────────────────────────────────────────────────────────
function PinConfirmModal({ onVerify, onClose }) {
  const [pin, setPin] = useState("");
  const [masked, setMasked] = useState(true);
  const [error, setError] = useState("");
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
      setError(
        next >= MAX
          ? "Too many incorrect attempts. Please close and try again."
          : `Incorrect PIN. ${MAX - next} attempt${MAX - next === 1 ? "" : "s"} remaining.`,
      );
    }
  };
  useEffect(() => {
    if (pin.length === 4 && attempts < MAX) verify(pin);
  }, [pin]); // eslint-disable-line
  const locked = attempts >= MAX;
  return (
    <div
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white w-full md:max-w-sm md:rounded-3xl rounded-t-3xl shadow-2xl overflow-hidden">
        <div className="bg-blue-950 px-6 py-6 text-center relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 hover:bg-blue-800 rounded-xl transition-colors"
          >
            <X size={18} className="text-blue-300" />
          </button>
          <div className="w-12 h-12 bg-blue-800/60 rounded-2xl flex items-center justify-center mx-auto mb-3 border border-blue-700">
            <Lock size={22} className="text-blue-200" />
          </div>
          <h3 className="text-white font-bold text-lg">Confirm with PIN</h3>
          <p className="text-blue-300 text-xs mt-1">
            Enter your 4-digit security PIN
          </p>
        </div>
        <div className="p-6">
          <PinInput
            value={pin}
            onChange={locked ? () => {} : setPin}
            masked={masked}
            disabled={locked}
          />
          <button
            onClick={() => setMasked((m) => !m)}
            className="flex items-center gap-1.5 mx-auto mt-4 text-xs text-gray-400 hover:text-gray-600 transition-colors"
          >
            {masked ? <Eye size={13} /> : <EyeOff size={13} />}
            {masked ? "Show PIN" : "Hide PIN"}
          </button>
          {error && (
            <div className="mt-4 bg-red-50 border border-red-200 rounded-xl p-3 text-center">
              <p className="text-sm text-red-600 font-medium">{error}</p>
            </div>
          )}
          {!locked && (
            <button
              onClick={() => verify(pin)}
              disabled={pin.length < 4}
              className="w-full mt-5 py-4 bg-blue-950 text-white rounded-2xl font-bold hover:bg-blue-900 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Confirm
            </button>
          )}
          <button
            onClick={onClose}
            className="w-full mt-3 py-3 text-gray-400 text-sm hover:text-gray-600 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Network Badge ────────────────────────────────────────────────────────────
function NetworkBadge({ network, selected, onClick }) {
  const n = NETWORKS.find((x) => x.id === network.id);
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl border-2 transition-all duration-150 font-bold text-sm
        ${selected ? `${n.bg} ${n.text} ${n.border} shadow-md scale-105` : "bg-gray-50 text-gray-500 border-gray-200 hover:border-gray-300"}`}
    >
      <span className="text-xs font-extrabold tracking-tight">
        {network.name}
      </span>
    </button>
  );
}

// ─── Success Screen ───────────────────────────────────────────────────────────
function SuccessScreen({
  type,
  network,
  phone,
  amount,
  plan,
  txRef,
  paymentMethod,
  onReset,
}) {
  const net = NETWORKS.find((n) => n.id === network);
  return (
    <div className="flex flex-col items-center justify-center py-10 px-6 text-center">
      <div className="relative mb-6">
        <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center">
          <CheckCircle2 size={48} className="text-green-500" />
        </div>
        <div
          className={`absolute -bottom-1 -right-1 w-8 h-8 ${net?.bg || "bg-blue-950"} rounded-full flex items-center justify-center`}
        >
          {type === "airtime" ? (
            <Smartphone size={14} className={net?.text || "text-white"} />
          ) : type === "data" ? (
            <Wifi size={14} className={net?.text || "text-white"} />
          ) : type === "tv" ? (
            <Tv size={14} className="text-white" />
          ) : (
            <Zap size={14} className="text-white" />
          )}
        </div>
      </div>
      <h2 className="text-2xl font-bold text-gray-900 mb-1">
        {type === "airtime"
          ? "Airtime Sent!"
          : type === "data"
            ? "Data Purchased!"
            : type === "electricity"
              ? "Electricity Paid!"
              : "TV Subscription Done!"}
      </h2>
      <p className="text-gray-500 text-sm mb-2">
        Your request was processed successfully
      </p>
      {paymentMethod === "card" && (
        <span className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 text-xs font-semibold px-3 py-1 rounded-full mb-4">
          <CreditCard size={12} /> Paid by card
        </span>
      )}
      {paymentMethod === "wallet" && (
        <span className="inline-flex items-center gap-1.5 bg-green-50 text-green-700 text-xs font-semibold px-3 py-1 rounded-full mb-4">
          <Wallet size={12} /> Paid from wallet
        </span>
      )}

      <div className="w-full bg-gray-50 rounded-2xl p-5 border border-gray-100 text-left space-y-3 mb-6">
        {(type === "airtime" || type === "data") && (
          <>
            <div className="flex justify-between">
              <span className="text-gray-500 text-sm">Phone Number</span>
              <span className="font-bold text-gray-900">{phone}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500 text-sm">Network</span>
              <span className="font-bold text-gray-900">{net?.name}</span>
            </div>
          </>
        )}
        <div className="flex justify-between">
          <span className="text-gray-500 text-sm">
            {type === "airtime"
              ? "Airtime"
              : type === "data"
                ? "Data Plan"
                : "Service"}
          </span>
          <span className="font-bold text-gray-900">
            {type === "airtime"
              ? `₦${Number(amount).toLocaleString()}`
              : plan?.size || plan?.name || "—"}
          </span>
        </div>
        <div className="flex justify-between pt-3 border-t border-gray-200">
          <span className="text-gray-500 text-sm">Amount</span>
          <span className="font-bold text-blue-950 text-lg">
            ₦{Number(amount).toLocaleString()}
          </span>
        </div>
        {txRef && (
          <div className="flex justify-between">
            <span className="text-gray-500 text-sm">Reference</span>
            <span className="font-mono text-xs text-gray-400 truncate max-w-[160px]">
              {txRef}
            </span>
          </div>
        )}
      </div>

      <button
        onClick={onReset}
        className="w-full py-4 bg-blue-950 text-white rounded-2xl font-bold hover:bg-blue-900 transition-all flex items-center justify-center gap-2"
      >
        <RefreshCw size={17} /> Make Another Purchase
      </button>
    </div>
  );
}

// ─── MAIN RECHARGE CLIENT ─────────────────────────────────────────────────────
export default function RechargeClient() {
  const searchParams = useSearchParams();
  const [seller, setSeller] = useState(null);
  const [loading, setLoading] = useState(true);

  const [tab, setTab] = useState("airtime");
  const [step, setStep] = useState(1);
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinAction, setPinAction] = useState(null);

  const [selectedNetwork, setSelectedNetwork] = useState(null);
  const [phone, setPhone] = useState("");
  const [airtimeAmount, setAirtimeAmount] = useState("");
  const [customAmount, setCustomAmount] = useState("");
  const [selectedPlan, setSelectedPlan] = useState(null);

  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");
  const [txRef, setTxRef] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("wallet"); // "wallet" | "card"

  const [recentRecharges, setRecentRecharges] = useState([]);
  const [dataPlans, setDataPlans] = useState([]);
  const [loadingPlans, setLoadingPlans] = useState(false);
  const [plansError, setPlansError] = useState("");

  const [selectedElecBiller, setSelectedElecBiller] = useState(null);
  const [elecPlans, setElecPlans] = useState([]);
  const [selectedElecPlan, setSelectedElecPlan] = useState(null);
  const [loadingElecPlans, setLoadingElecPlans] = useState(false);
  const [elecPlansError, setElecPlansError] = useState("");
  const [meterNumber, setMeterNumber] = useState("");
  const [elecAmount, setElecAmount] = useState("");

  const [selectedTvBiller, setSelectedTvBiller] = useState(null);
  const [tvPlans, setTvPlans] = useState([]);
  const [selectedTvPlan, setSelectedTvPlan] = useState(null);
  const [loadingTvPlans, setLoadingTvPlans] = useState(false);
  const [tvPlansError, setTvPlansError] = useState("");
  const [smartcardNumber, setSmartcardNumber] = useState("");

  // ── Read tab from query param ──
  useEffect(() => {
    const t = searchParams.get("tab");
    if (t && ["airtime", "data", "electricity", "tv"].includes(t)) setTab(t);
  }, [searchParams]);

  // ── Fetch plans directly from onClick ──
  const fetchElecPlans = (billerId) => {
    setElecPlans([]);
    setSelectedElecPlan(null);
    setElecPlansError("");
    setLoadingElecPlans(true);
    fetch(`/api/recharge?type=electricity-plans&biller=${billerId}`)
      .then((r) => r.json())
      .then((res) => {
        if (res.error) throw new Error(res.error);
        setElecPlans(res.plans || []);
      })
      .catch((err) =>
        setElecPlansError(err.message || "Failed to load meter types"),
      )
      .finally(() => setLoadingElecPlans(false));
  };

  const fetchTvPlans = (billerId) => {
    setTvPlans([]);
    setSelectedTvPlan(null);
    setTvPlansError("");
    setLoadingTvPlans(true);
    fetch(`/api/recharge?type=tv-plans&biller=${billerId}`)
      .then((r) => r.json())
      .then((res) => {
        if (res.error) throw new Error(res.error);
        setTvPlans(res.plans || []);
      })
      .catch((err) => setTvPlansError(err.message || "Failed to load packages"))
      .finally(() => setLoadingTvPlans(false));
  };

  // ── Data plans ──
  useEffect(() => {
    if (tab !== "data" || !selectedNetwork) return;
    setDataPlans([]);
    setSelectedPlan(null);
    setPlansError("");
    setLoadingPlans(true);
    fetch(`/api/recharge?network=${selectedNetwork}`)
      .then((r) => r.json())
      .then((res) => {
        if (res.error) throw new Error(res.error);
        setDataPlans(res.plans || []);
      })
      .catch((err) => setPlansError(err.message || "Failed to load plans"))
      .finally(() => setLoadingPlans(false));
  }, [selectedNetwork, tab]);

  // ── Auth ──
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setLoading(false);
        return;
      }
      try {
        const snap = await getDoc(doc(db, "sellers", user.uid));
        if (snap.exists()) setSeller({ uid: user.uid, ...snap.data() });
        await loadRecentRecharges(user.uid);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    });
    return () => unsub();
  }, []);

  const loadRecentRecharges = async (uid) => {
    try {
      const q = query(
        collection(db, "recharges"),
        where("sellerId", "==", uid),
        orderBy("createdAt", "desc"),
        limit(10),
      );
      const snap = await getDocs(q);
      setRecentRecharges(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (e) {
      console.error(e);
    }
  };

  // ── PIN gate ──
  const requirePin = (action) => {
    setPinAction(() => action);
    setShowPinModal(true);
  };
  const handleVerifyPin = (entered) => {
    if (entered === seller?.transferPin) {
      setShowPinModal(false);
      if (pinAction) {
        pinAction();
        setPinAction(null);
      }
      return true;
    }
    return false;
  };

  // ── Derived ──
  const SERVICE_FEE = 0; // Set to e.g. 50 to charge ₦50 flat, or use 0 for no fee

  const baseAmount =
    tab === "airtime"
      ? airtimeAmount === "custom"
        ? Number(customAmount)
        : Number(airtimeAmount)
      : tab === "data"
        ? selectedPlan?.price || 0
        : tab === "electricity"
          ? Number(elecAmount)
          : tab === "tv"
            ? selectedTvPlan?.price || 0
            : 0;

  const finalAmount = baseAmount + SERVICE_FEE;

  const walletBalance = seller?.accountBalance || 0;
  const hasEnoughBalance = walletBalance >= finalAmount && finalAmount > 0;

  const isFormValid = () => {
    if (tab === "airtime") {
      if (!selectedNetwork || !phone || phone.length < 11) return false;
      const amt =
        airtimeAmount === "custom"
          ? Number(customAmount)
          : Number(airtimeAmount);
      return amt >= 50;
    }
    if (tab === "data")
      return !!(selectedNetwork && phone && phone.length >= 11 && selectedPlan);
    if (tab === "electricity")
      return !!(
        selectedElecBiller &&
        selectedElecPlan &&
        meterNumber.length >= 11 &&
        Number(elecAmount) >= 500
      );
    if (tab === "tv")
      return !!(
        selectedTvBiller &&
        smartcardNumber.length >= 10 &&
        selectedTvPlan
      );
    return false;
  };

  const callFlutterwaveVTU = async (type, payload) => {
    const res = await fetch("/api/recharge", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type,
        phone: payload.phone,
        amount: payload.amount,
        network: payload.network,
        item_code: payload.item_code,
        biller_code: payload.biller_code,
        meter_number: payload.meter_number,
        smartcard_number: payload.smartcard_number,
      }),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || "Recharge failed");
    return { ref: result.ref, data: result.data };
  };

  // ── Process via wallet ──
  const processRechargeWallet = async () => {
    setProcessing(true);
    setError("");
    const amt = finalAmount;
    const net = selectedNetwork;
    const cleanPhone = phone.replace(/\D/g, "");
    try {
      if (amt > walletBalance)
        throw new Error(
          `Insufficient balance. You need ₦${amt.toLocaleString()}.`,
        );
      const { ref, data: flwData } = await callFlutterwaveVTU(tab, {
        phone: cleanPhone,
        amount: amt,
        network: net,
        item_code:
          tab === "tv"
            ? selectedTvPlan?.item_code
            : tab === "electricity"
              ? selectedElecPlan?.item_code
              : selectedPlan?.item_code,
        biller_code:
          tab === "tv"
            ? selectedTvPlan?.biller_code
            : tab === "electricity"
              ? selectedElecPlan?.biller_code
              : selectedPlan?.biller_code,
        meter_number: meterNumber,
        smartcard_number: smartcardNumber,
      });
      const sellerRef = doc(db, "sellers", seller.uid);
      const rechargeRef = doc(collection(db, "recharges"));
      await runTransaction(db, async (tx) => {
        const snap = await tx.get(sellerRef);
        if ((snap.data()?.accountBalance || 0) < amt)
          throw new Error("Insufficient balance.");
        tx.update(sellerRef, {
          accountBalance: increment(-amt),
          updatedAt: serverTimestamp(),
        });
        tx.set(rechargeRef, {
          sellerId: seller.uid,
          sellerName:
            seller.businessInfo?.businessName ||
            seller.bankDetails?.accountName ||
            "Unknown",
          type: tab,
          network: net,
          phone: cleanPhone,
          amount: amt,
          plan:
            tab === "data"
              ? selectedPlan
              : tab === "tv"
                ? selectedTvPlan
                : tab === "electricity"
                  ? selectedElecPlan
                  : null,
          flwReference: ref,
          flwResponse: flwData,
          status: "completed",
          paymentMethod: "wallet",
          createdAt: serverTimestamp(),
        });
      });
      setSeller((prev) => ({
        ...prev,
        accountBalance: (prev.accountBalance || 0) - amt,
      }));
      setTxRef(ref);
      setPaymentMethod("wallet");
      await loadRecentRecharges(seller.uid);
      setStep(3);
    } catch (err) {
      setError(err.message || "Purchase failed. Please try again.");
    } finally {
      setProcessing(false);
    }
  };

  // ── Process via card (called after Flutterwave payment success) ──
  const processRechargeCard = async (flwTxRef) => {
    setProcessing(true);
    setError("");
    const amt = finalAmount;
    const net = selectedNetwork;
    const cleanPhone = phone.replace(/\D/g, "");
    try {
      const { ref, data: flwData } = await callFlutterwaveVTU(tab, {
        phone: cleanPhone,
        amount: amt,
        network: net,
        item_code:
          tab === "tv"
            ? selectedTvPlan?.item_code
            : tab === "electricity"
              ? selectedElecPlan?.item_code
              : selectedPlan?.item_code,
        biller_code:
          tab === "tv"
            ? selectedTvPlan?.biller_code
            : tab === "electricity"
              ? selectedElecPlan?.biller_code
              : selectedPlan?.biller_code,
        meter_number: meterNumber,
        smartcard_number: smartcardNumber,
      });
      // Save to Firestore (no wallet deduction — card was charged)
      const rechargeRef = doc(collection(db, "recharges"));
      await runTransaction(db, async (tx) => {
        tx.set(rechargeRef, {
          sellerId: seller.uid,
          sellerName:
            seller.businessInfo?.businessName ||
            seller.bankDetails?.accountName ||
            "Unknown",
          type: tab,
          network: net,
          phone: cleanPhone,
          amount: amt,
          plan:
            tab === "data"
              ? selectedPlan
              : tab === "tv"
                ? selectedTvPlan
                : tab === "electricity"
                  ? selectedElecPlan
                  : null,
          flwReference: ref,
          flwResponse: flwData,
          status: "completed",
          paymentMethod: "card",
          cardTxRef: flwTxRef,
          createdAt: serverTimestamp(),
        });
      });
      setTxRef(ref);
      setPaymentMethod("card");
      await loadRecentRecharges(seller.uid);
      setStep(3);
    } catch (err) {
      setError(
        err.message ||
          "Purchase failed after card payment. Please contact support with ref: " +
            flwTxRef,
      );
    } finally {
      setProcessing(false);
    }
  };

  // ── Trigger Flutterwave inline payment ──
  const payWithCard = () => {
    if (typeof window === "undefined" || !window.FlutterwaveCheckout) {
      setError("Payment widget not loaded. Please refresh and try again.");
      return;
    }
    const flwPubKey = process.env.NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY;
    const ref =
      "LAN_CARD_" +
      Date.now() +
      "_" +
      Math.random().toString(36).slice(2, 7).toUpperCase();

    window.FlutterwaveCheckout({
      public_key: flwPubKey,
      tx_ref: ref,
      amount: finalAmount,
      currency: "NGN",
      payment_options: "card",
      customer: {
        email: seller?.email || "customer@example.com",
        name:
          seller?.bankDetails?.accountName ||
          seller?.businessInfo?.businessName ||
          "Customer",
      },
      customizations: {
        title: "LAN Recharge",
        description: `${tab.charAt(0).toUpperCase() + tab.slice(1)} purchase`,
        logo: "/lan-logo.png",
      },
      callback: (response) => {
        if (
          response.status === "successful" ||
          response.status === "completed"
        ) {
          processRechargeCard(response.transaction_id || ref);
        } else {
          setError("Card payment was not completed. Please try again.");
        }
      },
      onclose: () => {
        // user closed modal — do nothing
      },
    });
  };

  const resetForm = () => {
    setTab("airtime");
    setStep(1);
    setSelectedNetwork(null);
    setPhone("");
    setAirtimeAmount("");
    setCustomAmount("");
    setSelectedPlan(null);
    setSelectedElecBiller(null);
    setElecPlans([]);
    setSelectedElecPlan(null);
    setMeterNumber("");
    setElecAmount("");
    setSelectedTvBiller(null);
    setTvPlans([]);
    setSelectedTvPlan(null);
    setSmartcardNumber("");
    setError("");
    setTxRef("");
    setPaymentMethod("wallet");
  };

  const switchTab = (id) => {
    setTab(id);
    setSelectedNetwork(null);
    setSelectedPlan(null);
    setSelectedElecBiller(null);
    setSelectedElecPlan(null);
    setElecPlans([]);
    setElecPlansError("");
    setSelectedTvBiller(null);
    setSelectedTvPlan(null);
    setTvPlans([]);
    setTvPlansError("");
    setAirtimeAmount("");
    setCustomAmount("");
    setMeterNumber("");
    setSmartcardNumber("");
    setError("");
  };

  // ─── Loading / auth guards ─────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="animate-spin text-blue-950" size={40} />
      </div>
    );
  }
  if (!seller) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 text-center max-w-md shadow border border-gray-200">
          <Wallet size={48} className="mx-auto text-gray-300 mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            No Seller Account
          </h2>
          <p className="text-gray-500">
            You need a seller account to buy airtime & data.
          </p>
        </div>
      </div>
    );
  }
  if (!seller.transferPin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 text-center max-w-md shadow border border-gray-200">
          <Lock size={48} className="mx-auto text-blue-950 mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">PIN Required</h2>
          <p className="text-gray-500">
            Please set up your transfer PIN in the Transfer page before buying
            airtime or data.
          </p>
        </div>
      </div>
    );
  }

  const sellerName =
    seller.bankDetails?.accountName ||
    seller.businessInfo?.businessName ||
    "Unknown Seller";

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Load Flutterwave inline JS */}
      <Script
        src="https://checkout.flutterwave.com/v3.js"
        strategy="lazyOnload"
      />

      <Navbar />
      <div className="max-w-5xl mx-auto px-4 py-6 md:py-10">
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-blue-900 mb-1">
            Buy Airtime & Data
          </h1>
          <p className="text-sm text-gray-500">
            Top up any Nigerian network instantly
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* ── Sidebar ── */}
          <div className="hidden lg:flex flex-col gap-4">
            <div className="bg-blue-950 text-white rounded-2xl p-6">
              <p className="text-blue-300 text-xs font-semibold uppercase tracking-widest mb-3">
                LAN Wallet
              </p>
              <p className="text-xl font-bold text-white truncate mb-1">
                {sellerName}
              </p>
              <div className="pt-3 border-t border-blue-800 mt-3">
                <p className="text-blue-300 text-xs mb-1">Available Balance</p>
                <p className="text-3xl font-bold text-white">
                  ₦{walletBalance.toLocaleString()}
                </p>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-gray-200">
              <h3 className="font-bold text-gray-900 text-sm mb-3 flex items-center gap-2">
                <Zap size={14} className="text-yellow-500" /> Quick Tips
              </h3>
              <ul className="space-y-2 text-xs text-gray-500">
                <li className="flex items-start gap-2">
                  <Signal
                    size={12}
                    className="mt-0.5 flex-shrink-0 text-blue-400"
                  />{" "}
                  All purchases are instant and non-refundable
                </li>
                <li className="flex items-start gap-2">
                  <Wallet
                    size={12}
                    className="mt-0.5 flex-shrink-0 text-blue-400"
                  />{" "}
                  Pay from wallet or directly with your card
                </li>
                <li className="flex items-start gap-2">
                  <Lock
                    size={12}
                    className="mt-0.5 flex-shrink-0 text-blue-400"
                  />{" "}
                  Wallet payments require your PIN
                </li>
                <li className="flex items-start gap-2">
                  <Receipt
                    size={12}
                    className="mt-0.5 flex-shrink-0 text-blue-400"
                  />{" "}
                  Transactions are saved to your history
                </li>
              </ul>
            </div>

            {recentRecharges.length > 0 && (
              <div className="bg-white rounded-2xl p-5 border border-gray-200">
                <h3 className="font-bold text-gray-900 text-sm mb-3">Recent</h3>
                <div className="space-y-3">
                  {recentRecharges.slice(0, 5).map((r) => {
                    const net = NETWORKS.find((n) => n.id === r.network);
                    return (
                      <div key={r.id} className="flex items-center gap-3">
                        <div
                          className={`w-7 h-7 ${net?.bg || "bg-gray-200"} rounded-full flex items-center justify-center flex-shrink-0`}
                        >
                          {r.type === "airtime" ? (
                            <Smartphone
                              size={12}
                              className={net?.text || "text-gray-600"}
                            />
                          ) : r.type === "tv" ? (
                            <Tv size={12} className="text-white" />
                          ) : r.type === "electricity" ? (
                            <Zap size={12} className="text-white" />
                          ) : (
                            <Wifi
                              size={12}
                              className={net?.text || "text-gray-600"}
                            />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-gray-800 truncate">
                            {r.type === "electricity" || r.type === "tv"
                              ? r.plan?.name
                              : `${r.phone} · ${net?.name}`}
                          </p>
                          <p className="text-xs text-gray-400">
                            {r.type === "data"
                              ? r.plan?.size
                              : r.type === "tv"
                                ? "TV/Cable"
                                : r.type === "electricity"
                                  ? "Electricity"
                                  : "Airtime"}
                            {r.paymentMethod === "card"
                              ? " · Card"
                              : " · Wallet"}
                          </p>
                        </div>
                        <p className="text-xs font-bold text-red-500 flex-shrink-0">
                          -₦{r.amount?.toLocaleString()}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* ── Main Card ── */}
          <div className="lg:col-span-2">
            {/* Mobile balance */}
            <div className="lg:hidden mb-4 bg-blue-950 text-white rounded-2xl p-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-blue-300 text-xs mb-0.5">
                    LAN Wallet Balance
                  </p>
                  <p className="text-2xl font-bold">
                    ₦{walletBalance.toLocaleString()}
                  </p>
                </div>
                <Wallet size={28} className="text-blue-400" />
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              {/* ── Step 1: Form ── */}
              {step === 1 && (
                <div>
                  <div className="flex border-b border-gray-100 overflow-x-auto">
                    {[
                      {
                        id: "airtime",
                        label: "Airtime",
                        icon: <Smartphone size={14} />,
                      },
                      { id: "data", label: "Data", icon: <Wifi size={14} /> },
                      {
                        id: "electricity",
                        label: "Electricity",
                        icon: <Zap size={14} />,
                      },
                      { id: "tv", label: "TV/Cable", icon: <Tv size={14} /> },
                    ].map((t) => (
                      <button
                        key={t.id}
                        onClick={() => switchTab(t.id)}
                        className={`flex-1 min-w-[80px] flex items-center justify-center gap-1.5 py-4 font-bold text-xs sm:text-sm transition-all whitespace-nowrap
                          ${tab === t.id ? "text-blue-950 border-b-2 border-blue-950 bg-blue-50/50" : "text-gray-400 hover:text-gray-600"}`}
                      >
                        {t.icon} {t.label}
                      </button>
                    ))}
                  </div>

                  <div className="p-5 md:p-7 space-y-6">
                    {/* Network Select */}
                    {(tab === "airtime" || tab === "data") && (
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-3">
                          Select Network
                        </label>
                        <div className="grid grid-cols-4 gap-2">
                          {NETWORKS.map((n) => (
                            <NetworkBadge
                              key={n.id}
                              network={n}
                              selected={selectedNetwork === n.id}
                              onClick={() => {
                                setSelectedNetwork(n.id);
                                setSelectedPlan(null);
                              }}
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Phone Number */}
                    {(tab === "airtime" || tab === "data") && (
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">
                          Phone Number
                        </label>
                        <input
                          type="tel"
                          inputMode="numeric"
                          placeholder="08012345678"
                          value={phone}
                          onChange={(e) =>
                            setPhone(
                              e.target.value.replace(/\D/g, "").slice(0, 11),
                            )
                          }
                          className="w-full border text-black border-gray-200 rounded-xl px-4 py-3 font-mono text-base focus:outline-none focus:ring-2 focus:ring-blue-950 focus:border-transparent"
                        />
                        {phone.length > 0 && phone.length < 11 && (
                          <p className="text-xs text-amber-600 mt-1.5 flex items-center gap-1">
                            <AlertCircle size={11} /> {11 - phone.length} digit
                            {11 - phone.length !== 1 ? "s" : ""} remaining
                          </p>
                        )}
                      </div>
                    )}

                    {/* Airtime Amount */}
                    {tab === "airtime" && (
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-3">
                          Amount
                        </label>
                        <div className="grid grid-cols-3 gap-2 mb-3">
                          {AIRTIME_AMOUNTS.map((amt) => (
                            <button
                              key={amt}
                              onClick={() => {
                                setAirtimeAmount(String(amt));
                                setCustomAmount("");
                              }}
                              className={`py-3 rounded-xl font-bold text-sm transition-all
                                ${
                                  airtimeAmount === String(amt) &&
                                  airtimeAmount !== "custom"
                                    ? "bg-blue-950 text-white shadow-sm"
                                    : "bg-gray-50 text-gray-700 border border-gray-200 hover:border-blue-300"
                                }`}
                            >
                              ₦{amt}
                            </button>
                          ))}
                        </div>
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">
                            ₦
                          </span>
                          <input
                            type="number"
                            placeholder="Custom amount (min ₦50)"
                            value={customAmount}
                            onChange={(e) => {
                              setCustomAmount(e.target.value);
                              setAirtimeAmount("custom");
                            }}
                            onFocus={() => setAirtimeAmount("custom")}
                            className="w-full border text-black border-gray-200 rounded-xl pl-9 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-950 focus:border-transparent"
                          />
                        </div>
                      </div>
                    )}

                    {/* Data Plans */}
                    {tab === "data" && (
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-3">
                          {selectedNetwork
                            ? `${NETWORKS.find((n) => n.id === selectedNetwork)?.name} Data Plans`
                            : "Select a network first"}
                        </label>
                        {!selectedNetwork ? (
                          <div className="bg-gray-50 rounded-xl p-6 text-center text-gray-400 text-sm border border-dashed border-gray-200">
                            Please select a network above to see data plans
                          </div>
                        ) : loadingPlans ? (
                          <div className="flex items-center justify-center py-8 gap-2 text-gray-400">
                            <Loader2 size={18} className="animate-spin" />{" "}
                            Loading plans...
                          </div>
                        ) : plansError ? (
                          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-600 text-center">
                            {plansError}
                          </div>
                        ) : (
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-72 overflow-y-auto pr-1">
                            {dataPlans.map((plan) => (
                              <button
                                key={plan.id}
                                onClick={() => setSelectedPlan(plan)}
                                className={`py-3 rounded-xl font-bold text-sm transition-all text-left p-3
                                  ${selectedPlan?.id === plan.id ? "bg-blue-950 text-white shadow-sm" : "bg-gray-50 text-gray-700 border border-gray-200 hover:border-blue-300"}`}
                              >
                                <p className="font-extrabold text-sm leading-tight">
                                  {plan.size}
                                </p>
                                <p className="text-xs mt-0.5 opacity-70">
                                  {plan.duration}
                                </p>
                                <p className="text-sm font-bold mt-1.5">
                                  ₦{plan.price.toLocaleString()}
                                </p>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Electricity */}
                    {tab === "electricity" && (
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-bold text-gray-700 mb-3">
                            Select Provider
                          </label>
                          <div className="grid grid-cols-2 gap-2">
                            {ELEC_BILLERS.map((biller) => (
                              <button
                                key={biller.id}
                                onClick={() => {
                                  setSelectedElecBiller(biller.id);
                                  fetchElecPlans(biller.id);
                                }}
                                className={`py-3 rounded-xl font-bold text-sm transition-all
                                  ${selectedElecBiller === biller.id ? "bg-blue-950 text-white" : "bg-gray-50 text-gray-700 border border-gray-200 hover:border-blue-300"}`}
                              >
                                {biller.name}
                              </button>
                            ))}
                          </div>
                        </div>
                        {selectedElecBiller && (
                          <div>
                            <label className="block text-sm font-bold text-gray-700 mb-3">
                              Meter Type
                            </label>
                            {loadingElecPlans ? (
                              <div className="flex items-center justify-center py-4 gap-2 text-gray-400">
                                <Loader2 size={16} className="animate-spin" />{" "}
                                Loading...
                              </div>
                            ) : elecPlansError ? (
                              <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-600 text-center">
                                {elecPlansError}
                              </div>
                            ) : elecPlans.length === 0 ? (
                              <div className="bg-gray-50 rounded-xl p-4 text-center text-gray-400 text-sm border border-dashed border-gray-200">
                                No meter types found
                              </div>
                            ) : (
                              <div className="grid grid-cols-2 gap-2">
                                {elecPlans.map((plan) => (
                                  <button
                                    key={plan.id}
                                    onClick={() => setSelectedElecPlan(plan)}
                                    className={`py-3 rounded-xl font-bold text-sm transition-all
                                      ${selectedElecPlan?.id === plan.id ? "bg-blue-950 text-white" : "bg-gray-50 text-gray-700 border border-gray-200 hover:border-blue-300"}`}
                                  >
                                    {plan.name}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                        <div>
                          <label className="block text-sm font-bold text-gray-700 mb-2">
                            Meter Number
                          </label>
                          <input
                            type="text"
                            placeholder="Enter meter number"
                            value={meterNumber}
                            onChange={(e) => setMeterNumber(e.target.value)}
                            className="w-full border text-black border-gray-200 rounded-xl px-4 py-3 font-mono text-base focus:outline-none focus:ring-2 focus:ring-blue-950 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-gray-700 mb-2">
                            Amount
                          </label>
                          <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">
                              ₦
                            </span>
                            <input
                              type="number"
                              placeholder="Min ₦500"
                              value={elecAmount}
                              onChange={(e) => setElecAmount(e.target.value)}
                              className="w-full border text-black border-gray-200 rounded-xl pl-9 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-950 focus:border-transparent"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* TV/Cable */}
                    {tab === "tv" && (
                      <div className="space-y-5">
                        <div>
                          <label className="block text-sm font-bold text-gray-700 mb-3">
                            Select Provider
                          </label>
                          <div className="grid grid-cols-3 gap-2">
                            {TV_BILLER_LIST.map((b) => (
                              <button
                                key={b.id}
                                onClick={() => {
                                  setSelectedTvBiller(b.id);
                                  fetchTvPlans(b.id);
                                }}
                                className={`p-3 rounded-xl border-2 text-sm font-semibold transition-all
                                  ${selectedTvBiller === b.id ? "border-blue-950 bg-blue-950 text-white" : "border-gray-200 bg-gray-50 text-gray-700 hover:border-blue-200"}`}
                              >
                                {b.name}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-gray-700 mb-2">
                            Smartcard / IUC Number
                          </label>
                          <input
                            type="text"
                            inputMode="numeric"
                            placeholder="Enter smartcard number"
                            value={smartcardNumber}
                            onChange={(e) =>
                              setSmartcardNumber(
                                e.target.value.replace(/\D/g, "").slice(0, 12),
                              )
                            }
                            className="w-full border text-black border-gray-200 rounded-xl px-4 py-3 font-mono text-base focus:outline-none focus:ring-2 focus:ring-blue-950 focus:border-transparent"
                          />
                        </div>
                        {selectedTvBiller && (
                          <div>
                            <label className="block text-sm font-bold text-gray-700 mb-3">
                              Select Package
                            </label>
                            {loadingTvPlans ? (
                              <div className="flex items-center justify-center py-6 gap-2 text-gray-400">
                                <Loader2 size={16} className="animate-spin" />{" "}
                                Loading packages...
                              </div>
                            ) : tvPlansError ? (
                              <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-600 text-center">
                                {tvPlansError}
                              </div>
                            ) : tvPlans.length === 0 ? (
                              <div className="bg-gray-50 rounded-xl p-4 text-center text-gray-400 text-sm border border-dashed border-gray-200">
                                No packages found
                              </div>
                            ) : (
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-60 overflow-y-auto pr-1">
                                {tvPlans.map((plan) => (
                                  <button
                                    key={plan.id}
                                    onClick={() => setSelectedTvPlan(plan)}
                                    className={`p-3 rounded-xl border-2 text-left transition-all
                                      ${selectedTvPlan?.id === plan.id ? "border-blue-950 bg-blue-950 text-white" : "border-gray-200 bg-gray-50 text-gray-700 hover:border-blue-200"}`}
                                  >
                                    <p className="font-bold text-sm">
                                      {plan.name}
                                    </p>
                                    <p
                                      className={`text-sm font-bold mt-1 ${selectedTvPlan?.id === plan.id ? "text-white" : "text-blue-950"}`}
                                    >
                                      ₦{plan.price.toLocaleString()}
                                    </p>
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Summary */}
                    {isFormValid() && (
                      <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 flex justify-between items-center">
                        <div>
                          <p className="text-xs text-blue-700 font-semibold">
                            Amount
                          </p>
                          <p className="text-xs text-blue-500">
                            {hasEnoughBalance
                              ? "Will deduct from wallet"
                              : "Wallet insufficient — pay with card"}
                          </p>
                        </div>
                        <p className="text-xl font-bold text-blue-950">
                          ₦{finalAmount.toLocaleString()}
                        </p>
                      </div>
                    )}

                    {error && (
                      <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-center gap-2">
                        <AlertCircle
                          size={16}
                          className="text-red-600 flex-shrink-0"
                        />
                        <p className="text-sm text-red-700">{error}</p>
                      </div>
                    )}

                    <button
                      onClick={() => {
                        setError("");
                        setStep(2);
                      }}
                      disabled={!isFormValid()}
                      className="w-full py-4 bg-blue-950 text-white rounded-xl font-bold text-base hover:bg-blue-900 transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      Review Order{" "}
                      <ArrowLeft size={17} className="rotate-180" />
                    </button>
                  </div>
                </div>
              )}

              {/* ── Step 2: Confirm ── */}
              {step === 2 && (
                <div className="p-5 md:p-7">
                  <button
                    onClick={() => setStep(1)}
                    className="flex items-center gap-1 text-gray-500 text-sm mb-5 hover:text-gray-800"
                  >
                    <ArrowLeft size={15} /> Back
                  </button>
                  <h2 className="text-xl font-bold text-gray-900 mb-5">
                    Confirm Purchase
                  </h2>

                  <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100 space-y-4 mb-5">
                    <div className="flex justify-between">
                      <span className="text-gray-500 text-sm">Type</span>
                      <span className="font-bold text-gray-900">
                        {tab === "airtime"
                          ? "📱 Airtime"
                          : tab === "data"
                            ? "📶 Data"
                            : tab === "electricity"
                              ? "⚡ Electricity"
                              : "📺 TV/Cable"}
                      </span>
                    </div>
                    {(tab === "airtime" || tab === "data") && (
                      <>
                        <div className="flex justify-between">
                          <span className="text-gray-500 text-sm">Network</span>
                          <span className="font-bold text-gray-900">
                            {
                              NETWORKS.find((n) => n.id === selectedNetwork)
                                ?.name
                            }
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500 text-sm">Phone</span>
                          <span className="font-bold text-gray-900 font-mono">
                            {phone}
                          </span>
                        </div>
                      </>
                    )}
                    {tab === "data" && selectedPlan && (
                      <>
                        <div className="flex justify-between">
                          <span className="text-gray-500 text-sm">Plan</span>
                          <span className="font-bold text-gray-900">
                            {selectedPlan.size}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500 text-sm">
                            Validity
                          </span>
                          <span className="font-bold text-gray-900">
                            {selectedPlan.duration}
                          </span>
                        </div>
                      </>
                    )}
                    {tab === "electricity" && (
                      <>
                        <div className="flex justify-between">
                          <span className="text-gray-500 text-sm">
                            Provider
                          </span>
                          <span className="font-bold text-gray-900">
                            {
                              ELEC_BILLERS.find(
                                (b) => b.id === selectedElecBiller,
                              )?.name
                            }
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500 text-sm">
                            Meter Type
                          </span>
                          <span className="font-bold text-gray-900">
                            {selectedElecPlan?.name}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500 text-sm">
                            Meter Number
                          </span>
                          <span className="font-bold text-gray-900 font-mono">
                            {meterNumber}
                          </span>
                        </div>
                      </>
                    )}
                    {tab === "tv" && (
                      <>
                        <div className="flex justify-between">
                          <span className="text-gray-500 text-sm">
                            Provider
                          </span>
                          <span className="font-bold text-gray-900">
                            {
                              TV_BILLER_LIST.find(
                                (b) => b.id === selectedTvBiller,
                              )?.name
                            }
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500 text-sm">Package</span>
                          <span className="font-bold text-gray-900">
                            {selectedTvPlan?.name}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500 text-sm">
                            Smartcard No.
                          </span>
                          <span className="font-bold text-gray-900 font-mono">
                            {smartcardNumber}
                          </span>
                        </div>
                      </>
                    )}
                    <div className="border-t border-gray-200 pt-4 flex justify-between items-center">
                      <span className="text-gray-700 font-semibold text-sm">
                        Total
                      </span>
                      <span className="text-2xl font-bold text-blue-950">
                        ₦{finalAmount.toLocaleString()}
                      </span>
                    </div>

                    {/* Wallet balance info */}
                    <div
                      className={`rounded-xl p-3 flex items-center justify-between text-sm ${hasEnoughBalance ? "bg-green-50 border border-green-100" : "bg-amber-50 border border-amber-200"}`}
                    >
                      <div className="flex items-center gap-2">
                        <Wallet
                          size={15}
                          className={
                            hasEnoughBalance
                              ? "text-green-600"
                              : "text-amber-600"
                          }
                        />
                        <span
                          className={
                            hasEnoughBalance
                              ? "text-green-700 font-medium"
                              : "text-amber-700 font-medium"
                          }
                        >
                          Wallet: ₦{walletBalance.toLocaleString()}
                        </span>
                      </div>
                      {hasEnoughBalance ? (
                        <span className="text-green-600 text-xs font-semibold">
                          ✓ Sufficient
                        </span>
                      ) : (
                        <span className="text-amber-600 text-xs font-semibold">
                          Insufficient
                        </span>
                      )}
                    </div>
                  </div>

                  {error && (
                    <div className="mb-4 bg-red-50 border border-red-200 rounded-xl p-3 flex items-center gap-2">
                      <AlertCircle
                        size={16}
                        className="text-red-600 flex-shrink-0"
                      />
                      <p className="text-sm text-red-700">{error}</p>
                    </div>
                  )}

                  {/* ── Payment buttons ── */}
                  {hasEnoughBalance ? (
                    // Wallet payment
                    <button
                      onClick={() => requirePin(processRechargeWallet)}
                      disabled={processing}
                      className="w-full py-4 bg-blue-950 text-white rounded-xl font-bold text-base hover:bg-blue-900 transition-all flex items-center justify-center gap-2 disabled:opacity-70"
                    >
                      {processing ? (
                        <>
                          <Loader2 size={18} className="animate-spin" />{" "}
                          Processing...
                        </>
                      ) : (
                        <>
                          <Lock size={17} /> Pay from Wallet
                        </>
                      )}
                    </button>
                  ) : (
                    // Card payment — wallet insufficient
                    <div className="space-y-3">
                      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-center">
                        <p className="text-amber-700 text-sm font-medium">
                          Your wallet balance (₦{walletBalance.toLocaleString()}
                          ) is insufficient.
                        </p>
                        <p className="text-amber-600 text-xs mt-0.5">
                          Pay ₦{finalAmount.toLocaleString()} directly with your
                          card.
                        </p>
                      </div>
                      <button
                        onClick={payWithCard}
                        disabled={processing}
                        className="w-full py-4 bg-blue-950 text-white rounded-xl font-bold text-base hover:bg-blue-900 transition-all flex items-center justify-center gap-2 disabled:opacity-70"
                      >
                        {processing ? (
                          <>
                            <Loader2 size={18} className="animate-spin" />{" "}
                            Processing...
                          </>
                        ) : (
                          <>
                            <CreditCard size={17} /> Pay ₦
                            {finalAmount.toLocaleString()} with Card
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* ── Step 3: Success ── */}
              {step === 3 && (
                <SuccessScreen
                  type={tab}
                  network={selectedNetwork}
                  phone={phone}
                  amount={finalAmount}
                  plan={
                    tab === "tv"
                      ? selectedTvPlan
                      : tab === "electricity"
                        ? selectedElecPlan
                        : selectedPlan
                  }
                  txRef={txRef}
                  paymentMethod={paymentMethod}
                  onReset={resetForm}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {showPinModal && (
        <PinConfirmModal
          onVerify={handleVerifyPin}
          onClose={() => {
            setShowPinModal(false);
            setPinAction(null);
          }}
        />
      )}
    </div>
  );
}
