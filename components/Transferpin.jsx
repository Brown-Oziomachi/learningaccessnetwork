"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Shield,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  ArrowRight,
  X,
} from "lucide-react";

// ── Shared PIN input grid ──────────────────────────────────────────────────
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
          className={`w-14 h-14 text-center text-2xl font-bold rounded-2xl border-2 outline-none transition-all
                        ${
                          value[i]
                            ? "border-blue-950 bg-blue-950 text-white shadow-lg scale-105"
                            : "border-gray-200 bg-gray-50 text-gray-900"
                        }
                        focus:border-blue-950 focus:bg-blue-50 focus:scale-105
                        disabled:opacity-50 disabled:cursor-not-allowed`}
        />
      ))}
    </div>
  );
}

// ── CREATE PIN PAGE (full screen, shown when seller has no pin) ────────────
export function CreatePinPage({ onSuccess }) {
  const [step, setStep] = useState(1); // 1=create, 2=confirm
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [masked, setMasked] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  const handleCreateNext = () => {
    if (pin.length < 4) {
      setError("Enter a 4-digit PIN");
      return;
    }
    setError("");
    setStep(2);
    setConfirmPin("");
  };

  const handleConfirm = async () => {
    if (confirmPin.length < 4) {
      setError("Enter your PIN to confirm");
      return;
    }
    if (confirmPin !== pin) {
      setError("PINs don't match. Try again.");
      setConfirmPin("");
      return;
    }
    setError("");
    setSaving(true);
    try {
      await onSuccess(pin);
      setDone(true);
    } catch (e) {
      setError("Failed to save PIN. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (done) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 size={40} className="text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            PIN Created!
          </h2>
          <p className="text-gray-500">Redirecting to transfers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-blue-950 px-6 py-8 text-white text-center">
        <div className="w-16 h-16 bg-blue-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Shield size={32} className="text-blue-200" />
        </div>
        <h1 className="text-2xl font-bold mb-1">Secure Your Transfers</h1>
        <p className="text-blue-300 text-sm">
          Create a 4-digit PIN to authorise all transfers
        </p>
      </div>

      {/* Steps indicator */}
      <div className="flex items-center justify-center gap-3 py-5 bg-white border-b border-gray-100">
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all
                    ${step >= 1 ? "bg-blue-950 text-white" : "bg-gray-200 text-gray-500"}`}
        >
          1
        </div>
        <div
          className={`h-0.5 w-12 transition-all ${step >= 2 ? "bg-blue-950" : "bg-gray-200"}`}
        />
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all
                    ${step >= 2 ? "bg-blue-950 text-white" : "bg-gray-200 text-gray-500"}`}
        >
          2
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-sm">
          {step === 1 ? (
            <>
              <h2 className="text-xl font-bold text-gray-900 text-center mb-2">
                Create Your PIN
              </h2>
              <p className="text-gray-500 text-sm text-center mb-8">
                Choose a 4-digit PIN you'll remember. Don't share it with
                anyone.
              </p>

              <PinInput value={pin} onChange={setPin} masked={masked} />

              <button
                onClick={() => setMasked((m) => !m)}
                className="flex items-center gap-1.5 mx-auto mt-4 text-xs text-gray-400 hover:text-gray-600 transition-colors"
              >
                {masked ? <Eye size={14} /> : <EyeOff size={14} />}
                {masked ? "Show PIN" : "Hide PIN"}
              </button>

              {error && (
                <p className="mt-4 text-sm text-red-600 text-center font-medium">
                  {error}
                </p>
              )}

              <button
                onClick={handleCreateNext}
                disabled={pin.length < 4}
                className="w-full mt-8 py-4 bg-blue-950 text-white rounded-2xl font-bold text-base hover:bg-blue-900 transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Continue <ArrowRight size={18} />
              </button>
            </>
          ) : (
            <>
              <h2 className="text-xl font-bold text-gray-900 text-center mb-2">
                Confirm Your PIN
              </h2>
              <p className="text-gray-500 text-sm text-center mb-8">
                Enter the same PIN again to confirm.
              </p>

              <PinInput
                value={confirmPin}
                onChange={setConfirmPin}
                masked={masked}
              />

              <button
                onClick={() => setMasked((m) => !m)}
                className="flex items-center gap-1.5 mx-auto mt-4 text-xs text-gray-400 hover:text-gray-600 transition-colors"
              >
                {masked ? <Eye size={14} /> : <EyeOff size={14} />}
                {masked ? "Show PIN" : "Hide PIN"}
              </button>

              {error && (
                <p className="mt-4 text-sm text-red-600 text-center font-medium">
                  {error}
                </p>
              )}

              <button
                onClick={handleConfirm}
                disabled={confirmPin.length < 4 || saving}
                className="w-full mt-8 py-4 bg-blue-950 text-white rounded-2xl font-bold text-base hover:bg-blue-900 transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <span className="flex items-center gap-2">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Saving...
                  </span>
                ) : (
                  <>
                    <CheckCircle2 size={18} /> Create PIN
                  </>
                )}
              </button>

              <button
                onClick={() => {
                  setStep(1);
                  setError("");
                  setConfirmPin("");
                }}
                className="w-full mt-3 py-3 text-gray-500 text-sm font-semibold hover:text-gray-700 transition-colors"
              >
                ← Change PIN
              </button>
            </>
          )}

          <div className="mt-8 bg-amber-50 border border-amber-200 rounded-2xl p-4">
            <p className="text-xs text-amber-700 text-center">
              <strong>Important:</strong> Your PIN cannot be recovered if
              forgotten. Keep it safe.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── PIN CONFIRM MODAL (shown before every transfer) ────────────────────────
export function PinConfirmModal({
  onSuccess,
  onClose,
  title = "Enter Transfer PIN",
}) {
  const [pin, setPin] = useState("");
  const [masked, setMasked] = useState(true);
  const [error, setError] = useState("");
  const [attempts, setAttempts] = useState(0);

  const handleSubmit = (submittedPin) => {
    const finalPin = submittedPin || pin;
    if (finalPin.length < 4) {
      setError("Enter your 4-digit PIN");
      return;
    }
    // Pass PIN up to parent for verification against Firestore value
    onSuccess(finalPin, (isCorrect) => {
      if (!isCorrect) {
        const newAttempts = attempts + 1;
        setAttempts(newAttempts);
        setPin("");
        if (newAttempts >= 3) {
          setError(`Too many wrong attempts. Please wait before trying again.`);
        } else {
          setError(
            `Incorrect PIN. ${3 - newAttempts} attempt${3 - newAttempts === 1 ? "" : "s"} remaining.`,
          );
        }
      }
    });
  };

  // Auto-submit when 4 digits entered
  useEffect(() => {
    if (pin.length === 4) {
      handleSubmit(pin);
    }
  }, [pin]); // eslint-disable-line

  return (
    <div
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white w-full md:max-w-sm md:rounded-3xl rounded-t-3xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-blue-950 px-6 py-6 text-center relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 hover:bg-blue-800 rounded-xl transition-colors"
          >
            <X size={18} className="text-blue-300" />
          </button>
          <div className="w-12 h-12 bg-blue-800 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <Lock size={22} className="text-blue-200" />
          </div>
          <h3 className="text-white font-bold text-lg">{title}</h3>
          <p className="text-blue-300 text-xs mt-1">
            Enter your 4-digit security PIN
          </p>
        </div>

        <div className="p-6">
          <PinInput
            value={pin}
            onChange={attempts < 3 ? setPin : () => {}}
            masked={masked}
            disabled={attempts >= 3}
          />

          <button
            onClick={() => setMasked((m) => !m)}
            className="flex items-center gap-1.5 mx-auto mt-4 text-xs text-gray-400 hover:text-gray-600 transition-colors"
          >
            {masked ? <Eye size={14} /> : <EyeOff size={14} />}
            {masked ? "Show PIN" : "Hide PIN"}
          </button>

          {error && (
            <div className="mt-4 bg-red-50 border border-red-200 rounded-xl p-3 text-center">
              <p className="text-sm text-red-600 font-medium">{error}</p>
            </div>
          )}

          {attempts < 3 && (
            <button
              onClick={() => handleSubmit(pin)}
              disabled={pin.length < 4}
              className="w-full mt-5 py-4 bg-blue-950 text-white rounded-2xl font-bold text-base hover:bg-blue-900 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Confirm Transfer
            </button>
          )}

          <button
            onClick={onClose}
            className="w-full mt-3 py-3 text-gray-400 text-sm font-semibold hover:text-gray-600 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
