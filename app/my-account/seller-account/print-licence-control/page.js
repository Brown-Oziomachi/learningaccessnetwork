"use client";
/**
 * PrintLicensingControl.jsx - FIXED VERSION
 * Hardcoded colors for better visibility + permission handling
 */

import { useState, useEffect, useCallback } from "react";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
  serverTimestamp,
  addDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebaseConfig";
import {
  Printer,
  RefreshCw,
  BookOpen,
  ShieldCheck,
  ShieldOff,
  Info,
  Zap,
  FileText,
  AlertCircle,
} from "lucide-react";

/* ── HARDCODED COLORS (fix visibility) ─────────────────────────────────── */
const COLORS = {
  navy: "#0d2244",
  gold: "#b8963e",
  cream: "#f5f0e8",
  bg: "#f5f1ea",
  white: "#ffffff",
  text: "#333333",
  textMuted: "#888888",
  success: "#34d399",
  error: "#f87171",
  info: "#60a5fa",
  warn: "#f59e0b",
  border: "#e5ddd0",
};

/* ── Toggle switch ─────────────────────────────────────────────────────── */
function ToggleSwitch({ enabled, loading, onChange }) {
  return (
    <button
      onClick={onChange}
      disabled={loading}
      aria-label={
        enabled ? "Disable print licensing" : "Enable print licensing"
      }
      style={{
        width: 52,
        height: 28,
        borderRadius: 14,
        border: "none",
        cursor: loading ? "wait" : "pointer",
        background: enabled ? "#10b981" : "#d1d5db",
        position: "relative",
        transition: "background 0.25s",
        flexShrink: 0,
        opacity: loading ? 0.6 : 1,
        outline: "none",
      }}
    >
      <span
        style={{
          position: "absolute",
          top: 4,
          left: enabled ? 26 : 4,
          width: 20,
          height: 20,
          borderRadius: "50%",
          background: "#fff",
          transition: "left 0.22s cubic-bezier(.4,0,.2,1)",
          boxShadow: "0 1px 4px rgba(0,0,0,0.25)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {loading && (
          <span
            style={{
              width: 10,
              height: 10,
              border: "2px solid #3b82f6",
              borderTopColor: "transparent",
              borderRadius: "50%",
              animation: "spin 0.7s linear infinite",
              display: "block",
            }}
          />
        )}
      </span>
    </button>
  );
}

/* ── Main component ─────────────────────────────────────────────────────── */
export default function PrintLicensingControl({ user }) {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [togglingId, setTogglingId] = useState(null);
  const [toast, setToast] = useState(null);
  const [stats, setStats] = useState({
    enabled: 0,
    disabled: 0,
    licenses: 0,
    revenue: 0,
  });

  /* toast helper */
  const flash = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  /* fetch seller's books */
  const fetchBooks = useCallback(async () => {
    if (!user?.uid) {
      flash("User not authenticated", "error");
      return;
    }
    setLoading(true);
    try {
      const q = query(
        collection(db, "advertMyBook"),
        where("userId", "==", user.uid),
        where("status", "==", "approved"),
      );
      const snap = await getDocs(q);
      const list = snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
        isPrintLicensingEnabled: d.data().isPrintLicensingEnabled ?? false,
      }));
      setBooks(list);

      /* derive stats */
      const enabled = list.filter((b) => b.isPrintLicensingEnabled).length;
      setStats((prev) => ({
        ...prev,
        enabled,
        disabled: list.length - enabled,
      }));

      /* fetch this seller's print license revenue */
      try {
        const licQ = query(
          collection(db, "print_licenses"),
          where("sellerId", "==", user.uid),
        );
        const licSnap = await getDocs(licQ);
        const licenses = licSnap.docs.map((d) => d.data());
        const revenue = licenses.reduce(
          (s, l) => s + (l.sellerRoyalty || 0),
          0,
        );
        setStats((prev) => ({ ...prev, licenses: licenses.length, revenue }));
      } catch (_) {
        /* print_licenses collection may be empty */
      }
    } catch (err) {
      console.error("Fetch books error:", err);
      flash("Failed to load books: " + err.message, "error");
    } finally {
      setLoading(false);
    }
  }, [user?.uid]);

  useEffect(() => {
    fetchBooks();
  }, [fetchBooks]);

  /* toggle handler - with better error handling */
  const handleToggle = async (book) => {
    setTogglingId(book.id);
    const next = !book.isPrintLicensingEnabled;
    try {
      await updateDoc(doc(db, "advertMyBook", book.id), {
        isPrintLicensingEnabled: next,
        printLicensingUpdatedAt: serverTimestamp(),
        printLicensingUpdatedBy: user.email,
      });

      /* audit log (non-critical - don't block on failure) */
      try {
        await addDoc(collection(db, "admin_audit_logs"), {
          actor: user.email,
          actorId: user.uid,
          action: next ? "print_licensing_enabled" : "print_licensing_disabled",
          target: book.id,
          targetTitle: book.bookTitle || "Unknown",
          source: "seller_dashboard",
          ts: serverTimestamp(),
        });
      } catch (auditErr) {
        console.warn("Audit log failed (non-critical):", auditErr);
      }

      setBooks((prev) =>
        prev.map((b) =>
          b.id === book.id ? { ...b, isPrintLicensingEnabled: next } : b,
        ),
      );
      setStats((prev) => ({
        ...prev,
        enabled: prev.enabled + (next ? 1 : -1),
        disabled: prev.disabled + (next ? -1 : 1),
      }));
      flash(
        next
          ? `✅ "${book.bookTitle}" is now licensable for print.`
          : `🔒 Print rights revoked for "${book.bookTitle}".`,
        next ? "success" : "warn",
      );
    } catch (err) {
      console.error("Toggle error:", err);

      // Better error messages
      let errorMsg = "Update failed";
      if (err.code === "permission-denied") {
        errorMsg = "Permission denied. Check Firestore security rules.";
      } else if (err.code === "not-found") {
        errorMsg = "Book not found. Please refresh and try again.";
      } else if (err.message) {
        errorMsg = `Update failed: ${err.message}`;
      }

      flash(errorMsg, "error");
    } finally {
      setTogglingId(null);
    }
  };

  /* ── render ── */
  return (
    <>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeSlide { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
        .plc-row:hover td { background: rgba(0,0,0,0.02) !important; }
      `}</style>

      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 24,
        }}
      >
        <div>
          <div
            style={{
              fontSize: 18,
              fontWeight: 700,
              color: COLORS.navy,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <Printer size={20} color={COLORS.gold} /> Print Licensing Control
          </div>
          <div
            style={{ fontSize: 13, color: COLORS.textMuted, marginTop: 6 }}
          >
            Grant or revoke student print-copy licensing rights per book
          </div>
        </div>
        <button
          onClick={fetchBooks}
          disabled={loading}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "8px 16px",
            borderRadius: "6px",
            fontSize: 12,
            fontWeight: 600,
            cursor: loading ? "not-allowed" : "pointer",
            background: COLORS.cream,
            border: `1px solid ${COLORS.border}`,
            color: COLORS.navy,
            transition: "all 0.18s",
            opacity: loading ? 0.6 : 1,
          }}
          onMouseEnter={(e) => {
            if (!loading) {
              e.currentTarget.style.background = COLORS.gold;
              e.currentTarget.style.color = COLORS.white;
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = COLORS.cream;
            e.currentTarget.style.color = COLORS.navy;
          }}
        >
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Stat cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: 12,
          marginBottom: 24,
        }}
      >
        {[
          {
            label: "Total Books",
            value: books.length,
            color: COLORS.info,
            icon: <BookOpen size={16} />,
          },
          {
            label: "Licensing On",
            value: stats.enabled,
            color: COLORS.success,
            icon: <ShieldCheck size={16} />,
          },
          {
            label: "Licensing Off",
            value: stats.disabled,
            color: COLORS.error,
            icon: <ShieldOff size={16} />,
          },
          {
            label: "Royalties Earned",
            value: `₦${stats.revenue.toLocaleString()}`,
            color: COLORS.gold,
            icon: <Zap size={16} />,
          },
        ].map(({ label, value, color, icon }) => (
          <div
            key={label}
            style={{
              background: COLORS.white,
              border: `1px solid ${COLORS.border}`,
              borderRadius: "8px",
              padding: "16px",
              display: "flex",
              alignItems: "center",
              gap: 12,
            }}
          >
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 10,
                background: `${color}18`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color,
                flexShrink: 0,
              }}
            >
              {icon}
            </div>
            <div>
              <div
                style={{
                  fontSize: 11,
                  color: COLORS.textMuted,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  marginBottom: 4,
                }}
              >
                {label}
              </div>
              <div
                style={{
                  fontSize: 22,
                  fontWeight: 700,
                  color: COLORS.navy,
                }}
              >
                {value}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Info banner */}
      <div
        style={{
          background: `${COLORS.info}12`,
          border: `1px solid ${COLORS.info}30`,
          borderRadius: "8px",
          padding: "14px 16px",
          marginBottom: 20,
          display: "flex",
          alignItems: "flex-start",
          gap: 12,
        }}
      >
        <Info
          size={16}
          color={COLORS.info}
          style={{ flexShrink: 0, marginTop: 2 }}
        />
        <p
          style={{
            fontSize: 13,
            color: COLORS.navy,
            margin: 0,
            lineHeight: 1.65,
          }}
        >
          Toggling a book <strong>OFF</strong> immediately terminates active
          student print-licensing rights for that title. The student-facing
          "Get Hard-Copy License" button is disabled in real-time. You earn{" "}
          <strong>80% royalty</strong> on each license sold; LAN takes a 20%
          platform commission.
        </p>
      </div>

      {/* Books table */}
      <div
        style={{
          background: COLORS.white,
          border: `1px solid ${COLORS.border}`,
          borderRadius: "8px",
          padding: 0,
          overflow: "hidden",
        }}
      >
        {loading ? (
          <div
            style={{ display: "flex", justifyContent: "center", padding: 48 }}
          >
            <div
              style={{
                width: 36,
                height: 36,
                border: `3px solid ${COLORS.gold}`,
                borderTopColor: "transparent",
                borderRadius: "50%",
                animation: "spin 0.8s linear infinite",
              }}
            />
          </div>
        ) : books.length === 0 ? (
          <div style={{ textAlign: "center", padding: 48 }}>
            <Printer
              size={36}
              color={COLORS.textMuted}
              style={{ margin: "0 auto 12px", display: "block" }}
            />
            <div
              style={{
                color: COLORS.navy,
                fontSize: 16,
                fontWeight: 700,
                marginBottom: 6,
              }}
            >
              No approved books found.
            </div>
            <div style={{ color: COLORS.textMuted, fontSize: 13 }}>
              Upload and get a book approved to manage its licensing.
            </div>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: 13,
              }}
            >
              <thead>
                <tr style={{ borderBottom: `1px solid ${COLORS.border}` }}>
                  {[
                    "Book Title",
                    "Pages",
                    "Category",
                    "Price",
                    "License Status",
                    "Toggle",
                  ].map((h) => (
                    <th
                      key={h}
                      style={{
                        padding: "12px 16px",
                        textAlign: "left",
                        fontSize: 11,
                        fontWeight: 700,
                        textTransform: "uppercase",
                        letterSpacing: "0.06em",
                        color: COLORS.textMuted,
                        background: COLORS.cream,
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {books.map((book) => (
                  <tr
                    key={book.id}
                    className="plc-row"
                    style={{
                      borderBottom: `1px solid ${COLORS.border}`,
                    }}
                  >
                    <td style={{ padding: "14px 16px" }}>
                      <div
                        style={{
                          fontWeight: 600,
                          color: COLORS.navy,
                          marginBottom: 4,
                          maxWidth: 220,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {book.bookTitle || "Untitled"}
                      </div>
                      <div style={{ fontSize: 12, color: COLORS.textMuted }}>
                        by {book.author || "—"}
                      </div>
                    </td>
                    <td style={{ padding: "14px 16px", color: COLORS.text }}>
                      <div
                        style={{ display: "flex", alignItems: "center", gap: 5 }}
                      >
                        <FileText size={12} color={COLORS.gold} />
                        {book.pages ? `${book.pages}p` : "—"}
                      </div>
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      <span
                        style={{
                          background: `${COLORS.gold}15`,
                          color: COLORS.gold,
                          fontSize: 12,
                          fontWeight: 600,
                          padding: "4px 10px",
                          borderRadius: 20,
                          display: "inline-block",
                        }}
                      >
                        {book.category || "General"}
                      </span>
                    </td>
                    <td
                      style={{
                        padding: "14px 16px",
                        color: COLORS.success,
                        fontWeight: 700,
                      }}
                    >
                      ₦{Number(book.price || 0).toLocaleString()}
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 5,
                          padding: "4px 12px",
                          borderRadius: 20,
                          fontSize: 12,
                          fontWeight: 600,
                          background: book.isPrintLicensingEnabled
                            ? `${COLORS.success}18`
                            : `${COLORS.error}18`,
                          color: book.isPrintLicensingEnabled
                            ? COLORS.success
                            : COLORS.error,
                        }}
                      >
                        <span
                          style={{
                            width: 6,
                            height: 6,
                            borderRadius: "50%",
                            background: book.isPrintLicensingEnabled
                              ? COLORS.success
                              : COLORS.error,
                          }}
                        />
                        {book.isPrintLicensingEnabled ? "Enabled" : "Disabled"}
                      </span>
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                        }}
                      >
                        <ToggleSwitch
                          enabled={book.isPrintLicensingEnabled}
                          loading={togglingId === book.id}
                          onChange={() => handleToggle(book)}
                        />
                        <span
                          style={{
                            fontSize: 12,
                            color: COLORS.textMuted,
                            minWidth: "28px",
                          }}
                        >
                          {book.isPrintLicensingEnabled ? "On" : "Off"}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Toast notification */}
      {toast && (
        <div
          style={{
            position: "fixed",
            bottom: 24,
            right: 24,
            zIndex: 999,
            background:
              toast.type === "success"
                ? COLORS.success
                : toast.type === "error"
                  ? COLORS.error
                  : toast.type === "warn"
                    ? COLORS.warn
                    : COLORS.info,
            color: "#fff",
            padding: "14px 20px",
            borderRadius: "8px",
            fontSize: 14,
            fontWeight: 600,
            animation: "fadeSlide 0.25s ease",
            boxShadow: "0 10px 32px rgba(0,0,0,0.3)",
            maxWidth: 380,
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          {toast.type === "error" && <AlertCircle size={16} />}
          {toast.msg}
        </div>
      )}
    </>
  );
}