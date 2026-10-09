"use client";
// components/seller/Kyc.jsx
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { doc, onSnapshot, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebaseConfig";
import { uploadImageToCloudinary } from "@/lib/uploadImageToCloudinary";
import { AFRICAN_COUNTRIES } from "@/lib/africanCountries";
import { X, ShieldCheck, Clock, AlertCircle, Upload, CheckCircle, Eye, EyeOff } from "lucide-react";

const NAVY = "#0d2244";
const GOLD = "#b8963e";
const CREAM = "#f5f0e8";
const LINE = "#e5ddd0";
const MAX_MB = 8;

const ID_TYPES = [
  { value: "national_id", label: "National ID / NIN slip" },
  { value: "passport", label: "International passport" },
  { value: "drivers_license", label: "Driver's licence" },
  { value: "voters_card", label: "Voter's card" },
];

const ageOf = (dob) => {
  const d = new Date(dob);
  if (isNaN(d)) return 0;
  const n = new Date();
  let a = n.getFullYear() - d.getFullYear();
  const m = n.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && n.getDate() < d.getDate())) a--;
  return a;
};

const toCode = (c) => {
  if (!c) return "NG";
  const t = String(c).trim();
  const hit =
    AFRICAN_COUNTRIES.find((x) => x.code === t.toUpperCase()) ||
    AFRICAN_COUNTRIES.find((x) => x.name.toLowerCase() === t.toLowerCase());
  return hit ? hit.code : "NG";
};

/* ── live status: reads kycSubmissions/{uid} ─────────────────── */
export function useKycStatus(uid) {
  const [state, setState] = useState({
    loading: true,
    status: "none",
    data: null,
  });
  useEffect(() => {
    if (!uid) return;
    const unsub = onSnapshot(
      doc(db, "kycSubmissions", uid),
      (s) =>
        setState({
          loading: false,
          status: s.exists()
            ? String(s.data().status || "pending")
                .trim()
                .toLowerCase()
            : "none",

          data: s.exists() ? s.data() : null,
        }),
      () => setState({ loading: false, status: "none", data: null }),
    );
    return () => unsub();
  }, [uid]);
  return state;
}

/* ── dashboard card ──────────────────────────────────────────── */
export function KycCard({ kyc, onStart }) {
  if (!kyc || kyc.loading) return null;
  const s = kyc.status;
  const cfg =
    {
      none: {
        icon: <ShieldCheck size={20} />,
        tone: GOLD,
        bg: "#fff",
        title: "Verify your identity",
        text: "Confirm who you are with a government ID and a selfie. Verified sellers build more trust with buyers.",
        cta: "Start verification",
      },
      pending: {
        icon: <Clock size={20} />,
        tone: "#d97706",
        bg: "#fffbeb",
        title: "Verification under review",
        text: "We received your documents. Review usually takes 24 to 48 hours.",
        cta: null,
      },
      approved: {
        icon: <CheckCircle size={20} />,
        tone: "#16a34a",
        bg: "#f0fdf4",
        title: "Identity verified",
        text: "Your identity has been confirmed.",
        cta: null,
      },
      rejected: {
        icon: <AlertCircle size={20} />,
        tone: "#dc2626",
        bg: "#fef2f2",
        title: "Verification was not approved",
        text:
          kyc.data?.reviewNote ||
          "We could not verify your documents. Check that the photos are clear and the details match, then resubmit.",
        cta: "Resubmit documents",
      },
    }[s] || null;
  if (!cfg) return null;
  return (
    <div
      style={{
        background: cfg.bg,
        border: `0.5px solid ${LINE}`,
        borderLeft: `3px solid ${cfg.tone}`,
        padding: "16px 18px",
        display: "flex",
        alignItems: "center",
        gap: 14,
        flexWrap: "wrap",
      }}
    >
      <div
        style={{
          width: 40,
          height: 40,
          display: "grid",
          placeItems: "center",
          color: cfg.tone,
          border: `0.5px solid ${LINE}`,
          background: "#fff",
          flexShrink: 0,
        }}
      >
        {cfg.icon}
      </div>
      <div style={{ flex: "1 1 220px", minWidth: 0 }}>
        <p
          style={{
            fontFamily: "'Playfair Display',serif",
            fontSize: 15,
            fontWeight: 700,
            color: NAVY,
            margin: "0 0 3px",
          }}
        >
          {cfg.title}
        </p>
        <p
          style={{
            fontFamily: "'Lato',sans-serif",
            fontSize: 12,
            color: "#666",
            margin: 0,
            lineHeight: 1.6,
          }}
        >
          {cfg.text}
        </p>
      </div>
      {cfg.cta && (
        <button
          onClick={onStart}
          style={{
            background: NAVY,
            color: "#fff",
            border: "none",
            padding: "10px 18px",
            fontSize: 12,
            fontWeight: 700,
            cursor: "pointer",
            fontFamily: "'Lato',sans-serif",
          }}
        >
          {cfg.cta}
        </button>
      )}
    </div>
  );
}

/* ── approved summary (read-only, owner only) ────────────────── */
/* ── approved details modal (owner only) ─────────────────────── */
export function KycDetailsModal({ open, onClose, kyc }) {
  const [reveal, setReveal] = useState(false);
  useEffect(() => { if (!open) setReveal(false); }, [open]);

  const d = kyc?.data;
  if (!open || !d || typeof document === "undefined") return null;

  const idLabel = ID_TYPES.find((t) => t.value === d.idType)?.label || d.idType;
  const country = AFRICAN_COUNTRIES.find((c) => c.code === d.country)?.name || d.country;
  const fmtDate = (t) =>
    t?.toDate?.().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }) || null;

  const idNumber = String(d.idNumber || "");
  const masked = idNumber
    ? "•".repeat(Math.max(idNumber.length - 4, 0)) + idNumber.slice(-4)
    : "—";

  const rows = [
    ["Full name", d.fullName],
    ["Date of birth", d.dateOfBirth],
    ["Phone", d.phone],
    ["Email", d.email],
    ["Address", d.address],
    ["Country", country],
    ["ID type", idLabel],
    ["Submitted", fmtDate(d.submittedAt)],
    ["Reviewed", fmtDate(d.reviewedAt)],
  ];

  const photos = [
    ["Front of ID", d.frontUrl],
    ["Back of ID", d.backUrl],
    ["Selfie holding ID", d.selfieUrl],
  ].filter(([, url]) => !!url);

  const rowStyle = {
    display: "flex", justifyContent: "space-between", gap: 12, fontSize: 12,
    padding: "8px 0", borderBottom: "0.5px solid #f0ebe0", fontFamily: "'Lato',sans-serif",
  };

  return createPortal(
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, background: "rgba(7,19,31,.7)", zIndex: 1500,
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 16, backdropFilter: "blur(4px)",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="Identity details"
        style={{
          background: "#fff", width: "100%", maxWidth: 520, maxHeight: "92vh",
          display: "flex", flexDirection: "column", border: `0.5px solid ${LINE}`,
        }}
      >
        <div style={{ background: NAVY, padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
          <div>
            <p style={{ fontSize: 11, color: GOLD, fontWeight: 700, margin: "0 0 3px", fontFamily: "'Lato',sans-serif" }}>
              Identity verification
            </p>
            <p style={{ fontFamily: "'Playfair Display',serif", fontSize: 18, fontWeight: 700, color: "#fff", margin: 0 }}>
              Your submitted details
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{ width: 32, height: 32, border: "0.5px solid rgba(255,255,255,.2)", background: "transparent", color: "rgba(255,255,255,.7)", display: "grid", placeItems: "center", cursor: "pointer" }}
          >
            <X size={16} />
          </button>
        </div>

        <div style={{ padding: 20, overflowY: "auto", flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#f0fdf4", border: "0.5px solid #bbf7d0", padding: "10px 12px", marginBottom: 14 }}>
            <CheckCircle size={16} style={{ color: "#16a34a" }} />
            <span style={{ fontSize: 12, fontWeight: 700, color: "#166534", fontFamily: "'Lato',sans-serif" }}>
              Identity verified
            </span>
          </div>

          {rows.map(([k, v]) => (
            <div key={k} style={rowStyle}>
              <span style={{ color: "#888", flexShrink: 0 }}>{k}</span>
              <span style={{ fontWeight: 700, color: NAVY, textAlign: "right", wordBreak: "break-word" }}>{v || "—"}</span>
            </div>
          ))}

          {/* ID number with eye toggle */}
          <div style={{ ...rowStyle, alignItems: "center" }}>
            <span style={{ color: "#888", flexShrink: 0 }}>ID number</span>
            <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontFamily: "monospace", fontWeight: 700, color: NAVY, letterSpacing: "0.08em", fontSize: 13 }}>
                {reveal ? idNumber || "—" : masked}
              </span>
              {idNumber && (
                <button
                  type="button"
                  onClick={() => setReveal((r) => !r)}
                  aria-label={reveal ? "Hide ID number" : "Show ID number"}
                  title={reveal ? "Hide" : "Show"}
                  style={{ width: 28, height: 28, display: "grid", placeItems: "center", background: CREAM, border: `0.5px solid ${LINE}`, color: NAVY, cursor: "pointer" }}
                >
                  {reveal ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              )}
            </span>
          </div>

          {d.reviewNote && (
            <div style={{ ...rowStyle, borderBottom: "none" }}>
              <span style={{ color: "#888", flexShrink: 0 }}>Review note</span>
              <span style={{ fontWeight: 700, color: NAVY, textAlign: "right" }}>{d.reviewNote}</span>
            </div>
          )}

          {photos.length > 0 && (
            <>
              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: GOLD, margin: "18px 0 10px", fontFamily: "'Lato',sans-serif" }}>
                Documents
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 12 }}>
                {photos.map(([label, url]) => (
                  <div key={label}>
                    <p style={{ ...lbl, marginBottom: 4 }}>{label}</p>
                    <a href={url} target="_blank" rel="noopener noreferrer" style={{ display: "block", background: CREAM, border: `0.5px solid ${LINE}` }}>
                      <img src={url} alt={label} style={{ width: "100%", maxHeight: 240, objectFit: "contain", display: "block" }} />
                    </a>
                  </div>
                ))}
              </div>
              <p style={{ fontSize: 10, color: "#aaa", margin: "8px 0 0", fontFamily: "'Lato',sans-serif" }}>
                Tap a photo to open it full size.
              </p>
            </>
          )}
        </div>

        <div style={{ padding: "14px 20px", borderTop: `0.5px solid ${LINE}`, flexShrink: 0 }}>
          <button
            onClick={onClose}
            style={{ width: "100%", background: NAVY, color: "#fff", padding: 12, border: "none", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'Lato',sans-serif" }}
          >
            Close
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

/* ── small pieces ────────────────────────────────────────────── */
const lbl = {
  display: "block",
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: "0.12em",
  textTransform: "uppercase",
  color: "#888",
  marginBottom: 6,
  fontFamily: "'Lato',sans-serif",
};
const inp = {
  width: "100%",
  border: `0.5px solid ${LINE}`,
  padding: "10px 12px",
  fontSize: 13,
  color: NAVY,
  outline: "none",
  fontFamily: "'Lato',sans-serif",
  background: "#fff",
  boxSizing: "border-box",
};

function Field({ label, children, hint }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={lbl}>{label}</label>
      {children}
      {hint && (
        <p
          style={{
            fontSize: 11,
            color: "#aaa",
            margin: "4px 0 0",
            fontFamily: "'Lato',sans-serif",
          }}
        >
          {hint}
        </p>
      )}
    </div>
  );
}

function FilePick({ label, hint, file, onFile, capture }) {
  const url = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);
  useEffect(
    () => () => {
      if (url) URL.revokeObjectURL(url);
    },
    [url],
  );
  return (
    <Field label={label} hint={hint}>
      <label
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          gap: 6,
          minHeight: 120,
          border: `1.5px dashed ${file ? GOLD : LINE}`,
          background: file ? "#fffdf7" : CREAM,
          cursor: "pointer",
          overflow: "hidden",
          position: "relative",
        }}
      >
        {url ? (
          <img
            src={url}
            alt=""
            style={{
              width: "100%",
              maxHeight: 200,
              objectFit: "contain",
              display: "block",
            }}
          />
        ) : (
          <>
            <Upload size={20} style={{ color: GOLD }} />
            <span
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: NAVY,
                fontFamily: "'Lato',sans-serif",
              }}
            >
              Tap to choose a photo
            </span>
          </>
        )}
        <input
          type="file"
          accept="image/*"
          capture={capture}
          style={{ display: "none" }}
          onChange={(e) => onFile(e.target.files?.[0] || null)}
        />
      </label>
      {file && (
        <button
          type="button"
          onClick={() => onFile(null)}
          style={{
            marginTop: 6,
            background: "none",
            border: "none",
            color: "#dc2626",
            fontSize: 11,
            fontWeight: 700,
            cursor: "pointer",
            fontFamily: "'Lato',sans-serif",
            padding: 0,
          }}
        >
          Remove photo
        </button>
      )}
    </Field>
  );
}

/* ── modal ───────────────────────────────────────────────────── */
export function KycModal({ open, onClose, user, onSubmitted }) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    fullName: "",
    dob: "",
    phone: "",
    address: "",
    country: "NG",
    idType: "national_id",
    idNumber: "",
  });
  const [files, setFiles] = useState({ front: null, back: null, selfie: null });
  const [agree, setAgree] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    setStep(1);
    setError("");
    setAgree(false);
    setBusy(false);
    setFiles({ front: null, back: null, selfie: null });
    setForm({
      fullName: `${user?.firstName || ""} ${user?.surname || ""}`.trim(),
      dob: user?.dateOfBirth || "",
      phone: user?.phoneNumber || user?.phone || "",
      address: user?.address || "",
      country: toCode(user?.country),
      idType: "national_id",
      idNumber: "",
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!open || typeof document === "undefined") return null;

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const setFile = (k) => (file) => {
    if (
      file &&
      (!file.type.startsWith("image/") || file.size > MAX_MB * 1024 * 1024)
    ) {
      setError(`Choose an image under ${MAX_MB} MB.`);
      return;
    }
    setError("");
    setFiles((p) => ({ ...p, [k]: file }));
  };

  const validate = (s) => {
    if (s === 1) {
      if (form.fullName.trim().length < 3) return "Enter your full legal name.";
      if (ageOf(form.dob) < 18)
        return "You must be 18 or older and enter a valid date of birth.";
      if (form.phone.replace(/\D/g, "").length < 7)
        return "Enter a valid phone number.";
      if (form.address.trim().length < 8)
        return "Enter your full residential address.";
    }
    if (s === 2) {
      if (form.idNumber.trim().length < 5)
        return "Enter the number on your ID.";
      if (!files.front) return "Add a clear photo of the front of your ID.";
      if (form.idType !== "passport" && !files.back)
        return "Add a photo of the back of your ID.";
    }
    if (s === 3) {
      if (!files.selfie) return "Add a selfie of you holding your ID.";
      if (!agree) return "Confirm the declaration to continue.";
    }
    return "";
  };

  const next = () => {
    const msg = validate(step);
    if (msg) {
      setError(msg);
      return;
    }
    setError("");
    setStep((s) => s + 1);
  };

  const submit = async () => {
    const msg = validate(3);
    if (msg) {
      setError(msg);
      return;
    }
    const cu = auth.currentUser;
    if (!cu) {
      setError("Please sign in again and retry.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const [frontUrl, backUrl, selfieUrl] = await Promise.all([
        uploadImageToCloudinary(files.front, "kyc"),
        files.back
          ? uploadImageToCloudinary(files.back, "kyc")
          : Promise.resolve(null),
        uploadImageToCloudinary(files.selfie, "kyc"),
      ]);
      const idNumber = form.idNumber.trim();
      await setDoc(doc(db, "kycSubmissions", cu.uid), {
        uid: cu.uid,
        email: cu.email || null,
        fullName: form.fullName.trim(),
        dateOfBirth: form.dob,
        phone: form.phone.trim(),
        address: form.address.trim(),
        country: form.country,
        idType: form.idType,
        idNumber,
        idLast4: idNumber.slice(-4),
        frontUrl,
        backUrl,
        selfieUrl,
        status: "pending",
        reviewNote: null,
        reviewedBy: null,
        reviewedAt: null,
        submittedAt: serverTimestamp(),
      });
      onSubmitted?.();
      onClose();
    } catch (e) {
      setError(e?.message || "Could not submit your documents. Try again.");
    } finally {
      setBusy(false);
    }
  };

  const titles = [
    "Personal details",
    "Identity document",
    "Selfie and confirmation",
  ];

  return createPortal(
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(7,19,31,.7)",
        zIndex: 1500,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
        backdropFilter: "blur(4px)",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="Identity verification"
        style={{
          background: "#fff",
          width: "100%",
          maxWidth: 480,
          maxHeight: "92vh",
          display: "flex",
          flexDirection: "column",
          border: `0.5px solid ${LINE}`,
        }}
      >
        <div style={{ background: NAVY, padding: "16px 20px", flexShrink: 0 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 12,
            }}
          >
            <div>
              <p
                style={{
                  fontSize: 11,
                  color: GOLD,
                  fontWeight: 700,
                  margin: "0 0 3px",
                  fontFamily: "'Lato',sans-serif",
                }}
              >
                Step {step} of 3
              </p>
              <p
                style={{
                  fontFamily: "'Playfair Display',serif",
                  fontSize: 18,
                  fontWeight: 700,
                  color: "#fff",
                  margin: 0,
                }}
              >
                {titles[step - 1]}
              </p>
            </div>
            <button
              onClick={onClose}
              aria-label="Close"
              style={{
                width: 32,
                height: 32,
                border: "0.5px solid rgba(255,255,255,.2)",
                background: "transparent",
                color: "rgba(255,255,255,.7)",
                display: "grid",
                placeItems: "center",
                cursor: "pointer",
              }}
            >
              <X size={16} />
            </button>
          </div>
          <div style={{ height: 3, background: "rgba(255,255,255,.12)" }}>
            <div
              style={{
                height: "100%",
                width: `${(step / 3) * 100}%`,
                background: GOLD,
                transition: "width .3s",
              }}
            />
          </div>
        </div>

        <div style={{ padding: 20, overflowY: "auto", flex: 1 }}>
          {step === 1 && (
            <>
              <Field
                label="Full legal name"
                hint="Exactly as it appears on your ID."
              >
                <input
                  style={inp}
                  value={form.fullName}
                  onChange={set("fullName")}
                  autoComplete="name"
                />
              </Field>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 12,
                }}
              >
                <Field label="Date of birth">
                  <input
                    type="date"
                    style={inp}
                    value={form.dob}
                    onChange={set("dob")}
                  />
                </Field>
                <Field label="Phone number">
                  <input
                    type="tel"
                    style={inp}
                    value={form.phone}
                    onChange={set("phone")}
                    autoComplete="tel"
                  />
                </Field>
              </div>
              <Field label="Residential address">
                <input
                  style={inp}
                  value={form.address}
                  onChange={set("address")}
                  autoComplete="street-address"
                />
              </Field>
              <Field label="Country">
                <select
                  style={inp}
                  value={form.country}
                  onChange={set("country")}
                >
                  {AFRICAN_COUNTRIES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </Field>
            </>
          )}

          {step === 2 && (
            <>
              <Field label="ID type">
                <select
                  style={inp}
                  value={form.idType}
                  onChange={set("idType")}
                >
                  {ID_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="ID number">
                <input
                  style={inp}
                  value={form.idNumber}
                  onChange={set("idNumber")}
                  autoComplete="off"
                />
              </Field>
              <FilePick
                label="Front of ID"
                hint="All four corners visible, no glare."
                file={files.front}
                onFile={setFile("front")}
              />
              {form.idType !== "passport" && (
                <FilePick
                  label="Back of ID"
                  file={files.back}
                  onFile={setFile("back")}
                />
              )}
            </>
          )}

          {step === 3 && (
            <>
              <FilePick
                label="Selfie holding your ID"
                hint="Your face and the ID must both be clear."
                file={files.selfie}
                onFile={setFile("selfie")}
                capture="user"
              />
              <label
                style={{
                  display: "flex",
                  gap: 10,
                  alignItems: "flex-start",
                  fontSize: 12,
                  color: "#555",
                  lineHeight: 1.6,
                  fontFamily: "'Lato',sans-serif",
                  cursor: "pointer",
                }}
              >
                <input
                  type="checkbox"
                  checked={agree}
                  onChange={(e) => setAgree(e.target.checked)}
                  style={{ marginTop: 3 }}
                />
                <span>
                  I confirm these details and documents are mine and accurate. I
                  understand false information can lead to my account being
                  suspended.
                </span>
              </label>
            </>
          )}

          {error && (
            <div
              role="alert"
              style={{
                display: "flex",
                gap: 8,
                alignItems: "flex-start",
                background: "#fef2f2",
                border: "0.5px solid #fecaca",
                padding: "10px 12px",
                marginTop: 14,
              }}
            >
              <AlertCircle
                size={14}
                style={{ color: "#ef4444", flexShrink: 0, marginTop: 1 }}
              />
              <p
                style={{
                  fontSize: 12,
                  color: "#dc2626",
                  margin: 0,
                  fontFamily: "'Lato',sans-serif",
                }}
              >
                {error}
              </p>
            </div>
          )}
        </div>

        <div
          style={{
            padding: "14px 20px",
            borderTop: `0.5px solid ${LINE}`,
            display: "flex",
            gap: 10,
            flexShrink: 0,
          }}
        >
          <button
            onClick={() => {
              setError("");
              step === 1 ? onClose() : setStep((s) => s - 1);
            }}
            disabled={busy}
            style={{
              flex: 1,
              background: "#f5f5f5",
              color: "#666",
              padding: 12,
              border: `0.5px solid ${LINE}`,
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
              fontFamily: "'Lato',sans-serif",
            }}
          >
            {step === 1 ? "Cancel" : "Back"}
          </button>
          {step < 3 ? (
            <button
              onClick={next}
              style={{
                flex: 1,
                background: NAVY,
                color: "#fff",
                padding: 12,
                border: "none",
                fontSize: 13,
                fontWeight: 700,
                cursor: "pointer",
                fontFamily: "'Lato',sans-serif",
              }}
            >
              Continue
            </button>
          ) : (
            <button
              onClick={submit}
              disabled={busy}
              style={{
                flex: 1,
                background: GOLD,
                color: NAVY,
                padding: 12,
                border: "none",
                fontSize: 13,
                fontWeight: 700,
                cursor: busy ? "wait" : "pointer",
                opacity: busy ? 0.6 : 1,
                fontFamily: "'Lato',sans-serif",
              }}
            >
              {busy ? "Uploading…" : "Submit for review"}
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
