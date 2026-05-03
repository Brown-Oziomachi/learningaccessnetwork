// components/ConsignmentModal.jsx
"use client";
import { useState } from "react";
import { X, BookOpen, Send } from "lucide-react";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebaseConfig";

const NAVY = "#0d2244";
const GOLD = "#b8963e";

export default function ConsignmentModal({ user, onClose }) {
  const [form, setForm] = useState({
    bookTitle: "",
    quantity: "",
    dropOffDate: "",
    notes: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async () => {
    if (!form.bookTitle.trim() || !form.quantity) return;
    setSubmitting(true);
    try {
      // Save intent to Firestore — appears in admin notification bell
      await addDoc(collection(db, "consignmentIntents"), {
        sellerId: user.uid,
        sellerName: user.displayName || user.name || "Unknown Seller",
        sellerEmail: user.email || "",
        bookTitle: form.bookTitle.trim(),
        quantity: Number(form.quantity),
        dropOffDate: form.dropOffDate || null,
        notes: form.notes.trim() || null,
        status: "pending",
        createdAt: serverTimestamp(),
      });

      // Fire admin notification
      await addDoc(collection(db, "adminNotifications"), {
        type: "consignment_intent",
        title: `Consignment Intent — ${user.displayName || user.email}`,
        message: `Plans to bring ${form.quantity} copies of "${form.bookTitle}"${form.dropOffDate ? ` on ${new Date(form.dropOffDate).toLocaleDateString("en-NG", { day: "2-digit", month: "short", year: "numeric" })}` : ""}.`,
        sellerId: user.uid,
        sellerName: user.displayName || user.email,
        bookTitle: form.bookTitle,
        quantity: Number(form.quantity),
        dropOffDate: form.dropOffDate || null,
        createdAt: serverTimestamp(),
        read: false,
      });

      setDone(true);
    } catch (e) {
      alert("Failed to submit: " + e.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 80,
        background: "rgba(0,0,0,0.55)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
      }}
    >
      <div
        style={{
          background: "#fff",
          width: "100%",
          maxWidth: "460px",
          animation: "fadeUp 0.25s ease both",
          border: "0.5px solid #e5ddd0",
        }}
      >
        {/* Header */}
        <div
          style={{
            background: NAVY,
            padding: "24px 28px",
            position: "relative",
            overflow: "hidden",
            backgroundImage:
              "radial-gradient(rgba(184,150,62,0.07) 1px,transparent 1px)",
            backgroundSize: "20px 20px",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: "-24px",
              right: "-24px",
              width: "96px",
              height: "96px",
              border: "0.5px solid rgba(184,150,62,0.2)",
              transform: "rotate(45deg)",
            }}
          />
          <button
            onClick={onClose}
            style={{
              position: "absolute",
              top: "16px",
              right: "16px",
              background: "rgba(255,255,255,0.08)",
              border: "0.5px solid rgba(255,255,255,0.18)",
              color: "rgba(255,255,255,0.6)",
              width: "28px",
              height: "28px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
            }}
          >
            <X size={13} />
          </button>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              background: "rgba(184,150,62,0.15)",
              border: "0.5px solid rgba(184,150,62,0.35)",
              padding: "4px 12px",
              marginBottom: "12px",
            }}
          >
            <BookOpen size={10} style={{ color: "#d4aa5a" }} />
            <span
              style={{
                fontSize: "9px",
                fontWeight: 700,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: "#d4aa5a",
                fontFamily: "'Lato',sans-serif",
              }}
            >
              Physical Consignment
            </span>
          </div>
          <h2
            style={{
              fontFamily: "'Playfair Display',serif",
              fontSize: "20px",
              fontWeight: 700,
              color: "#fff",
              margin: "0 0 6px",
              lineHeight: 1.3,
            }}
          >
            Consign Your Books
          </h2>
          <p
            style={{
              fontSize: "12px",
              color: "rgba(255,255,255,0.5)",
              fontFamily: "'Lato',sans-serif",
              margin: 0,
              lineHeight: 1.6,
            }}
          >
            Ready to deposit hard copies at our Abuja Registry? Let us know what
            you're bringing and we'll prepare shelf space.
          </p>
        </div>

        {/* Body */}
        <div style={{ padding: "24px 28px" }}>
          {done ? (
            <div style={{ textAlign: "center", padding: "24px 0" }}>
              <div
                style={{
                  width: "52px",
                  height: "52px",
                  background: "rgba(22,163,74,0.1)",
                  border: "0.5px solid rgba(22,163,74,0.3)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 14px",
                }}
              >
                <Send size={22} style={{ color: "#16a34a" }} />
              </div>
              <p
                style={{
                  fontFamily: "'Playfair Display',serif",
                  fontSize: "17px",
                  fontWeight: 700,
                  color: NAVY,
                  margin: "0 0 8px",
                }}
              >
                Request Logged
              </p>
              <p
                style={{
                  fontSize: "12px",
                  color: "#888",
                  fontFamily: "'Lato',sans-serif",
                  lineHeight: 1.6,
                  margin: "0 0 20px",
                }}
              >
                Our Registry officer will contact you to confirm shelf
                availability before your visit.
              </p>
              <button
                onClick={onClose}
                style={{
                  background: NAVY,
                  color: "#fff",
                  border: "none",
                  padding: "12px 28px",
                  fontSize: "11px",
                  fontWeight: 700,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  cursor: "pointer",
                  fontFamily: "'Lato',sans-serif",
                }}
              >
                Done
              </button>
            </div>
          ) : (
            <>
              {[
                {
                  label: "Book Title",
                  key: "bookTitle",
                  type: "text",
                  placeholder: "e.g. Modern Microbiology, 3rd Ed.",
                  full: true,
                },
              ].map(({ label, key, type, placeholder }) => (
                <div key={key} style={{ marginBottom: "18px" }}>
                  <label
                    style={{
                      display: "block",
                      fontSize: "9px",
                      fontWeight: 700,
                      letterSpacing: "0.16em",
                      textTransform: "uppercase",
                      color: GOLD,
                      fontFamily: "'Lato',sans-serif",
                      marginBottom: "8px",
                    }}
                  >
                    {label}
                  </label>
                  <input
                    type={type}
                    value={form[key]}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, [key]: e.target.value }))
                    }
                    placeholder={placeholder}
                    style={{
                      width: "100%",
                      border: "0.5px solid #e5ddd0",
                      padding: "10px 14px",
                      fontSize: "13px",
                      color: NAVY,
                      outline: "none",
                      fontFamily: "'Lato',sans-serif",
                      background: "#fafaf8",
                    }}
                  />
                </div>
              ))}

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "14px",
                  marginBottom: "18px",
                }}
              >
                {[
                  {
                    label: "Estimated Quantity",
                    key: "quantity",
                    type: "number",
                    placeholder: "50",
                  },
                  {
                    label: "Preferred Drop-off Date",
                    key: "dropOffDate",
                    type: "date",
                    placeholder: "",
                  },
                ].map(({ label, key, type, placeholder }) => (
                  <div key={key}>
                    <label
                      style={{
                        display: "block",
                        fontSize: "9px",
                        fontWeight: 700,
                        letterSpacing: "0.16em",
                        textTransform: "uppercase",
                        color: GOLD,
                        fontFamily: "'Lato',sans-serif",
                        marginBottom: "8px",
                      }}
                    >
                      {label}
                    </label>
                    <input
                      type={type}
                      value={form[key]}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, [key]: e.target.value }))
                      }
                      placeholder={placeholder}
                      style={{
                        width: "100%",
                        border: "0.5px solid #e5ddd0",
                        padding: "10px 14px",
                        fontSize: "13px",
                        color: NAVY,
                        outline: "none",
                        fontFamily: "'Lato',sans-serif",
                        background: "#fafaf8",
                      }}
                    />
                  </div>
                ))}
              </div>

              <div style={{ marginBottom: "20px" }}>
                <label
                  style={{
                    display: "block",
                    fontSize: "9px",
                    fontWeight: 700,
                    letterSpacing: "0.16em",
                    textTransform: "uppercase",
                    color: GOLD,
                    fontFamily: "'Lato',sans-serif",
                    marginBottom: "8px",
                  }}
                >
                  Additional Notes (optional)
                </label>
                <input
                  type="text"
                  value={form.notes}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, notes: e.target.value }))
                  }
                  placeholder="e.g. Please call before my arrival"
                  style={{
                    width: "100%",
                    border: "0.5px solid #e5ddd0",
                    padding: "10px 14px",
                    fontSize: "13px",
                    color: NAVY,
                    outline: "none",
                    fontFamily: "'Lato',sans-serif",
                    background: "#fafaf8",
                  }}
                />
              </div>

              <button
                onClick={handleSubmit}
                disabled={
                  submitting || !form.bookTitle.trim() || !form.quantity
                }
                style={{
                  width: "100%",
                  background: submitting ? "#888" : NAVY,
                  color: "#fff",
                  border: "none",
                  padding: "14px",
                  fontSize: "12px",
                  fontWeight: 700,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  cursor: submitting ? "not-allowed" : "pointer",
                  fontFamily: "'Lato',sans-serif",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  marginBottom: "14px",
                  transition: "background 0.18s",
                }}
              >
                {submitting ? (
                  "Submitting…"
                ) : (
                  <>
                    <Send size={13} /> Submit Consignment Intent
                  </>
                )}
              </button>

              <a
                href="https://wa.me/234XXXXXXXXXX"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                  fontSize: "11px",
                  color: "#aaa",
                  fontFamily: "'Lato',sans-serif",
                  textDecoration: "none",
                  transition: "color 0.18s",
                }}
              >
                <span
                  style={{
                    width: "7px",
                    height: "7px",
                    borderRadius: "50%",
                    background: "#25d366",
                    display: "inline-block",
                  }}
                />
                Or chat with the Abuja Registry on WhatsApp
              </a>
            </>
          )}
        </div>
      </div>
      <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}`}</style>
    </div>
  );
}
