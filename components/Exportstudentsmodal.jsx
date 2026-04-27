"use client";
import React, { useState, useEffect, useCallback } from "react";
import {
  X, Download, Search, ChevronDown, BookOpen, Users,
  FileText, CheckCircle, AlertCircle, Loader2, BarChart2,
} from "lucide-react";
import {
  collection, query, where, getDocs, getDoc, doc,
} from "firebase/firestore";
import { db } from "@/lib/firebaseConfig";

/* ─── colour tokens (match homepage) ─── */
const NAVY  = "#0d2244";
const GOLD  = "#b8963e";
const GOLDD = "#d4aa5a";
const CREAM = "#f5f0e8";
const BG    = "#f5f1ea";

/* ─── CSV Export ─── */
function exportToCSV(rows, fileName) {
  if (!rows.length) return;
  const headers = [
    "Student Name", "Email", "Registration Number", "Department",
    "Phone", "Country", "Document Title", "Amount Paid (NGN)",
    "Date of Purchase", "Time of Purchase", "Transaction ID", "Status",
  ];
  const escape = (val) => {
    const str = val == null ? "" : String(val);
    return str.includes(",") || str.includes('"') || str.includes("\n")
      ? `"${str.replace(/"/g, '""')}"`
      : str;
  };
  const csvRows = [
    headers.join(","),
    ...rows.map((r) => {
      const date = r.createdAtDate instanceof Date
        ? r.createdAtDate : new Date(r.createdAtDate || Date.now());
      return [
        escape(r.buyerName || "—"), escape(r.buyerEmail || "—"),
        escape(r.studentRegNo || r.regNo || "—"), escape(r.department || "—"),
        escape(r.buyerPhone || r.phone || "—"), escape(r.buyerCountry || "—"),
        escape(r.bookTitle || r.title || "—"), escape(r.amount || 0),
        escape(date.toLocaleDateString("en-NG")), escape(date.toLocaleTimeString("en-NG")),
        escape(r.id || "—"), escape("Completed"),
      ].join(",");
    }),
  ];
  const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${fileName.replace(/\s+/g, "_")}_Student_List.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

/* ════════════════════════════════════════════
   MAIN MODAL
════════════════════════════════════════════ */
export default function ExportStudentsModal({ isOpen, onClose, sellerId, sellerBooks = [] }) {
  const [step, setStep] = useState("select");
  const [selectedBook, setSelectedBook] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [exportCount, setExportCount] = useState(0);

  const filteredBooks = sellerBooks.filter((b) =>
    (b.title || b.bookTitle || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  const fetchStudents = useCallback(async (book) => {
    if (!book || !sellerId) return;
    setLoading(true); setError("");
    try {
      const rawId = (book.id || "").replace("firestore-", "");
      const prefixedId = `firestore-${rawId}`;
      const [snap1, snap2] = await Promise.all([
        getDocs(query(collection(db, "transactions"), where("sellerId", "==", sellerId), where("bookId", "==", prefixedId))),
        getDocs(query(collection(db, "transactions"), where("sellerId", "==", sellerId), where("bookId", "==", rawId))),
      ]);
      const seen = new Set();
      const allDocs = [...snap1.docs, ...snap2.docs].filter((d) => {
        if (seen.has(d.id)) return false; seen.add(d.id); return true;
      });
      const rows = await Promise.all(allDocs.map(async (docSnap) => {
        const data = docSnap.data();
        let buyerEmail = data.buyerEmail || null, buyerPhone = data.buyerPhone || null,
          buyerCountry = data.buyerCountry || null, studentRegNo = data.studentRegNo || data.regNo || null;
        const buyerId = data.buyerId || data.userId || data.buyerUid || null;
        if (buyerId && (!buyerEmail || !buyerCountry)) {
          try {
            const buyerDoc = await getDoc(doc(db, "users", buyerId));
            if (buyerDoc.exists()) {
              const bd = buyerDoc.data();
              buyerEmail = buyerEmail || bd.email || null;
              buyerPhone = buyerPhone || bd.phone || bd.phoneNumber || null;
              buyerCountry = buyerCountry || bd.country || null;
              studentRegNo = studentRegNo || bd.regNo || bd.studentRegNo || null;
            }
          } catch (_) {}
        }
        return {
          id: docSnap.id, ...data, buyerEmail, buyerPhone, buyerCountry, studentRegNo,
          createdAtDate: data.createdAt?.toDate?.() || new Date(data.purchaseDate || Date.now()),
        };
      }));
      rows.sort((a, b) => b.createdAtDate - a.createdAtDate);
      setStudents(rows); setStep("preview");
    } catch (err) {
      console.error(err); setError("Failed to load students. Please try again.");
    } finally { setLoading(false); }
  }, [sellerId]);

  const handleSelectBook = (book) => {
    setSelectedBook(book); setDropdownOpen(false); setSearchQuery("");
  };
  const handleExport = () => {
    if (!students.length) return;
    exportToCSV(students, selectedBook?.title || "Document");
    setExportCount(students.length); setStep("done");
  };
  const handleReset = () => {
    setStep("select"); setSelectedBook(null); setStudents([]); setError(""); setSearchQuery("");
  };
  useEffect(() => { if (!isOpen) { setTimeout(handleReset, 300); } }, [isOpen]);

  if (!isOpen) return null;

  const steps = ["Select Document", "Preview", "Download"];
  const stepMap = { select: 0, preview: 1, done: 2 };
  const currentStepIdx = stepMap[step];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400&family=Lato:wght@300;400;700&display=swap');
        .exp-root { font-family: 'Lato', sans-serif; }
        .exp-serif { font-family: 'Playfair Display', Georgia, serif; }
        .exp-overlay {
          position: fixed; inset: 0;
          background: rgba(13,34,68,0.75);
          backdrop-filter: blur(4px);
          z-index: 100;
          display: flex; align-items: flex-end;
        }
        @media (min-width: 640px) { .exp-overlay { align-items: center; padding: 16px; } }
        .exp-modal {
          background: ${BG};
          width: 100%;
          border-top: 2px solid rgba(184,150,62,0.4);
          box-shadow: 0 -20px 60px rgba(13,34,68,0.3);
          display: flex; flex-direction: column; max-height: 92vh; overflow: hidden;
        }
        @media (min-width: 640px) {
          .exp-modal { max-width: 560px; border-top: none; border: 0.5px solid rgba(184,150,62,0.35); border-top: 2px solid ${GOLD}; box-shadow: 0 32px 80px rgba(13,34,68,0.3); }
        }
        .exp-header {
          background: ${NAVY};
          background-image: radial-gradient(rgba(184,150,62,0.06) 1px, transparent 1px);
          background-size: 22px 22px;
          padding: 24px;
          flex-shrink: 0;
        }
        .exp-close {
          width: 34px; height: 34px;
          border: 0.5px solid rgba(184,150,62,0.3);
          background: transparent;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; color: rgba(184,150,62,0.7);
          transition: border-color 0.18s, color 0.18s;
        }
        .exp-close:hover { border-color: ${GOLD}; color: ${GOLD}; }
        .exp-step-bar { display: flex; align-items: center; padding: 14px 24px; background: #fff; border-bottom: 0.5px solid #e5ddd0; flex-shrink: 0; }
        .exp-body { flex: 1; overflow-y: auto; scrollbar-width: none; }
        .exp-body::-webkit-scrollbar { display: none; }
        .exp-footer { padding: 16px 24px 28px; border-top: 0.5px solid #e5ddd0; display: flex; gap: 10px; flex-shrink: 0; background: #fff; }
        .exp-btn-primary {
          flex: 1; padding: 13px;
          background: ${NAVY}; color: #fff;
          font-family: 'Lato', sans-serif; font-size: 12px; font-weight: 700;
          letter-spacing: 0.08em; text-transform: uppercase;
          border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 7px;
          transition: background 0.18s;
        }
        .exp-btn-primary:hover:not(:disabled) { background: #162f5a; }
        .exp-btn-primary:disabled { opacity: 0.4; cursor: not-allowed; }
        .exp-btn-green {
          flex: 1; padding: 13px;
          background: #15803d; color: #fff;
          font-family: 'Lato', sans-serif; font-size: 12px; font-weight: 700;
          letter-spacing: 0.08em; text-transform: uppercase;
          border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 7px;
          transition: background 0.18s;
        }
        .exp-btn-green:hover:not(:disabled) { background: #166534; }
        .exp-btn-green:disabled { opacity: 0.4; cursor: not-allowed; }
        .exp-btn-ghost {
          flex: 1; padding: 13px;
          background: transparent; color: #777;
          font-family: 'Lato', sans-serif; font-size: 12px; font-weight: 700;
          letter-spacing: 0.06em; text-transform: uppercase;
          border: 0.5px solid #e5ddd0; cursor: pointer;
          transition: border-color 0.18s, color 0.18s;
        }
        .exp-btn-ghost:hover { border-color: #ccc; color: ${NAVY}; }
        .exp-input {
          width: 100%; padding: 10px 12px 10px 34px;
          border: 0.5px solid #e5ddd0; background: #fff;
          font-family: 'Lato', sans-serif; font-size: 13px; color: ${NAVY};
          outline: none; box-sizing: border-box;
          transition: border-color 0.18s;
        }
        .exp-input:focus { border-color: ${GOLD}; }
        .exp-dropdown-btn {
          width: 100%; display: flex; align-items: center; justify-content: space-between; gap: 12px;
          padding: 12px 16px; background: #fff; border: 0.5px solid #e5ddd0; cursor: pointer;
          transition: border-color 0.18s;
        }
        .exp-dropdown-btn:hover { border-color: ${GOLD}; }
        .exp-dropdown-list {
          position: absolute; top: calc(100% + 4px); left: 0; right: 0; z-index: 10;
          background: #fff; border: 0.5px solid #e5ddd0; box-shadow: 0 16px 40px rgba(13,34,68,0.12);
        }
        .exp-dropdown-item {
          width: 100%; display: flex; align-items: center; gap: 12px; padding: 12px 16px;
          background: transparent; border: none; cursor: pointer; text-align: left;
          transition: background 0.15s;
        }
        .exp-dropdown-item:hover { background: ${CREAM}; }
        .exp-student-row {
          display: flex; align-items: center; gap: 12px;
          background: #fff; border: 0.5px solid #e5ddd0; padding: 12px;
        }
        .exp-avatar {
          width: 38px; height: 38px;
          background: ${NAVY}; color: #fff;
          display: flex; align-items: center; justify-content: center;
          font-family: 'Playfair Display', serif; font-size: 15px; font-weight: 700;
          flex-shrink: 0;
        }
        .exp-info-box {
          background: #fff; border: 0.5px solid rgba(184,150,62,0.3);
          border-left: 3px solid ${GOLD}; padding: 14px 16px;
          display: flex; gap: 10px;
        }
      `}</style>

      <div className="exp-overlay exp-root">
        <div className="exp-modal">

          {/* ── Header ── */}
          <div className="exp-header">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ width: '44px', height: '44px', border: `0.5px solid rgba(184,150,62,0.3)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <FileText size={20} style={{ color: GOLD }} />
                </div>
                <div>
                  <p style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(184,150,62,0.7)', marginBottom: '3px' }}>
                    Export
                  </p>
                  <p className="exp-serif" style={{ fontSize: '18px', fontWeight: 700, color: '#fff', margin: 0 }}>
                    Student Purchase List
                  </p>
                </div>
              </div>
              <button className="exp-close" onClick={onClose}>
                <X size={15} />
              </button>
            </div>
          </div>

          {/* ── Step Bar ── */}
          <div className="exp-step-bar">
            {steps.map((label, i) => {
              const active = i === currentStepIdx;
              const past = i < currentStepIdx;
              return (
                <React.Fragment key={label}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                    <div style={{
                      width: '22px', height: '22px',
                      background: past ? '#15803d' : active ? NAVY : 'rgba(13,34,68,0.08)',
                      color: past || active ? '#fff' : '#bbb',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '10px', fontWeight: 700,
                    }}>
                      {past ? '✓' : i + 1}
                    </div>
                    <span style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: active ? NAVY : past ? '#15803d' : '#bbb' }}>
                      {label}
                    </span>
                  </div>
                  {i < 2 && <div style={{ flex: 1, height: '0.5px', background: '#e5ddd0', margin: '0 8px' }} />}
                </React.Fragment>
              );
            })}
          </div>

          {/* ── Body ── */}
          <div className="exp-body">

            {/* STEP 1: Select */}
            {step === "select" && (
              <div style={{ padding: '24px' }}>
                <p className="exp-serif" style={{ fontSize: '20px', fontWeight: 700, color: NAVY, margin: '0 0 6px' }}>
                  Choose a document
                </p>
                <p style={{ fontSize: '12px', color: '#999', marginBottom: '24px', fontWeight: 300 }}>
                  Select which document's buyer list you want to export as a CSV file.
                </p>

                {/* Dropdown */}
                <div style={{ position: 'relative', marginBottom: '20px' }}>
                  <button className="exp-dropdown-btn" onClick={() => setDropdownOpen(o => !o)}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                      <BookOpen size={16} style={{ color: GOLD, flexShrink: 0 }} />
                      <span style={{ fontSize: '13px', fontWeight: selectedBook ? 700 : 400, color: selectedBook ? NAVY : '#bbb', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {selectedBook?.title || selectedBook?.bookTitle || "Select a document…"}
                      </span>
                    </div>
                    <ChevronDown size={15} style={{ color: '#bbb', flexShrink: 0, transform: dropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                  </button>

                  {dropdownOpen && (
                    <div className="exp-dropdown-list">
                      <div style={{ padding: '8px', borderBottom: '0.5px solid #e5ddd0' }}>
                        <div style={{ position: 'relative' }}>
                          <Search size={13} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#bbb' }} />
                          <input autoFocus value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search documents…" className="exp-input" />
                        </div>
                      </div>
                      <div style={{ maxHeight: '210px', overflowY: 'auto' }}>
                        {filteredBooks.length === 0 ? (
                          <div style={{ padding: '24px', textAlign: 'center', fontSize: '12px', color: '#bbb' }}>
                            {sellerBooks.length === 0 ? "No uploaded documents found." : "No matching documents."}
                          </div>
                        ) : filteredBooks.map(book => (
                          <button key={book.id} className="exp-dropdown-item" onClick={() => handleSelectBook(book)}>
                            <div style={{ width: '34px', height: '34px', background: CREAM, border: `0.5px solid rgba(184,150,62,0.3)`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                              <BookOpen size={14} style={{ color: GOLD }} />
                            </div>
                            <div style={{ minWidth: 0, flex: 1 }}>
                              <p style={{ fontSize: '13px', fontWeight: 700, color: NAVY, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{book.title || book.bookTitle}</p>
                              {book.price && <p style={{ fontSize: '11px', color: '#999', margin: '2px 0 0' }}>₦{Number(book.price).toLocaleString()}</p>}
                            </div>
                            {selectedBook?.id === book.id && <CheckCircle size={15} style={{ color: GOLD, flexShrink: 0 }} />}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Info box */}
                <div className="exp-info-box">
                  <BarChart2 size={17} style={{ color: GOLD, flexShrink: 0, marginTop: '1px' }} />
                  <div>
                    <p style={{ fontSize: '11px', fontWeight: 700, color: NAVY, margin: '0 0 4px', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                      What's included?
                    </p>
                    <p style={{ fontSize: '12px', color: '#777', lineHeight: 1.6, margin: 0, fontWeight: 300 }}>
                      Student name, email, registration number, department, phone, country, amount paid, purchase date & time, and a unique transaction ID.
                    </p>
                  </div>
                </div>

                {error && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#fef2f2', border: '0.5px solid #fecaca', padding: '12px 14px', marginTop: '16px' }}>
                    <AlertCircle size={14} style={{ color: '#ef4444', flexShrink: 0 }} />
                    <p style={{ fontSize: '12px', color: '#dc2626', margin: 0 }}>{error}</p>
                  </div>
                )}
              </div>
            )}

            {/* STEP 2: Preview */}
            {step === "preview" && (
              <div style={{ padding: '24px' }}>
                {/* Summary strip */}
                <div style={{ background: NAVY, backgroundImage: 'radial-gradient(rgba(184,150,62,0.06) 1px, transparent 1px)', backgroundSize: '22px 22px', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <div>
                    <p style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(184,150,62,0.7)', margin: '0 0 4px' }}>Document</p>
                    <p className="exp-serif" style={{ fontSize: '15px', fontWeight: 700, color: '#fff', margin: 0, maxWidth: '220px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {selectedBook?.title || selectedBook?.bookTitle}
                    </p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(184,150,62,0.7)', margin: '0 0 4px' }}>Buyers</p>
                    <p className="exp-serif" style={{ fontSize: '24px', fontWeight: 700, color: GOLD, margin: 0 }}>{students.length}</p>
                  </div>
                </div>

                {students.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '48px 24px' }}>
                    <div style={{ width: '64px', height: '64px', border: `0.5px solid #e5ddd0`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                      <Users size={28} style={{ color: '#ccc' }} />
                    </div>
                    <p className="exp-serif" style={{ fontSize: '18px', color: NAVY, margin: '0 0 6px' }}>No purchases yet</p>
                    <p style={{ fontSize: '12px', color: '#bbb' }}>No one has bought this document yet.</p>
                  </div>
                ) : (
                  <>
                    <p style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#bbb', marginBottom: '12px' }}>
                      Preview — first {Math.min(students.length, 5)} of {students.length}
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '16px' }}>
                      {students.slice(0, 5).map((s, i) => (
                        <div key={s.id || i} className="exp-student-row">
                          <div className="exp-avatar">{(s.buyerName || "?").charAt(0).toUpperCase()}</div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ fontSize: '13px', fontWeight: 700, color: NAVY, margin: '0 0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {s.buyerName || "Unknown"}
                            </p>
                            <p style={{ fontSize: '11px', color: '#999', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {s.buyerEmail || "No email"}
                            </p>
                          </div>
                          <div style={{ textAlign: 'right', flexShrink: 0 }}>
                            <p style={{ fontSize: '13px', fontWeight: 700, color: '#15803d', margin: '0 0 2px' }}>₦{(s.amount || 0).toLocaleString()}</p>
                            <p style={{ fontSize: '10px', color: '#bbb', margin: 0 }}>{s.createdAtDate?.toLocaleDateString("en-NG")}</p>
                          </div>
                        </div>
                      ))}
                      {students.length > 5 && (
                        <p style={{ textAlign: 'center', fontSize: '11px', color: '#bbb', padding: '6px 0' }}>
                          +{students.length - 5} more rows in the export
                        </p>
                      )}
                    </div>

                    {/* Total revenue */}
                    <div style={{ background: CREAM, border: `0.5px solid rgba(184,150,62,0.3)`, padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <p style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#999', margin: 0 }}>Total Revenue</p>
                      <p className="exp-serif" style={{ fontSize: '18px', fontWeight: 700, color: NAVY, margin: 0 }}>
                        ₦{students.reduce((s, t) => s + (t.amount || 0), 0).toLocaleString()}
                      </p>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* STEP 3: Done */}
            {step === "done" && (
              <div style={{ padding: '40px 24px', textAlign: 'center' }}>
                {/* Icon */}
                <div style={{ width: '72px', height: '72px', border: `0.5px solid rgba(184,150,62,0.35)`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', background: CREAM }}>
                  <CheckCircle size={32} style={{ color: GOLD }} />
                </div>
                <p className="exp-serif" style={{ fontSize: '24px', fontWeight: 700, color: NAVY, margin: '0 0 8px' }}>Export Successful!</p>
                <p style={{ fontSize: '13px', color: '#777', marginBottom: '28px', fontWeight: 300, lineHeight: 1.7 }}>
                  Your CSV file with <strong style={{ color: NAVY }}>{exportCount}</strong> student{exportCount !== 1 ? "s" : ""} has been downloaded.
                </p>

                <div style={{ background: '#fff', border: `0.5px solid #e5ddd0`, borderLeft: `3px solid ${GOLD}`, padding: '16px 18px', textAlign: 'left' }}>
                  <p style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: NAVY, margin: '0 0 6px' }}>
                    📂 File saved as:
                  </p>
                  <p style={{ fontSize: '11px', fontFamily: 'monospace', color: '#555', margin: '0 0 8px', wordBreak: 'break-all' }}>
                    {(selectedBook?.title || "Document").replace(/\s+/g, "_")}_Student_List.csv
                  </p>
                  <p style={{ fontSize: '11px', color: '#999', margin: 0, fontWeight: 300 }}>
                    Open in Microsoft Excel, Google Sheets, or any spreadsheet app.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* ── Footer ── */}
          <div className="exp-footer">
            {step === "select" && (
              <>
                <button className="exp-btn-ghost" onClick={onClose}>Cancel</button>
                <button className="exp-btn-primary" onClick={() => fetchStudents(selectedBook)} disabled={!selectedBook || loading}>
                  {loading ? <><Loader2 size={15} className="animate-spin" /> Loading…</> : <>Preview List <ChevronDown size={14} style={{ transform: 'rotate(-90deg)' }} /></>}
                </button>
              </>
            )}
            {step === "preview" && (
              <>
                <button className="exp-btn-ghost" onClick={handleReset}>← Back</button>
                <button className="exp-btn-green" onClick={handleExport} disabled={students.length === 0}>
                  <Download size={15} /> Download CSV
                </button>
              </>
            )}
            {step === "done" && (
              <>
                <button className="exp-btn-ghost" onClick={handleReset}>Export Another</button>
                <button className="exp-btn-primary" onClick={onClose}>Done</button>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}