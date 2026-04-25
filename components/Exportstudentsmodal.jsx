"use client";
import React, { useState, useEffect, useCallback } from "react";
import {
  X,
  Download,
  Search,
  ChevronDown,
  BookOpen,
  Users,
  FileText,
  CheckCircle,
  AlertCircle,
  Loader2,
  BarChart2,
} from "lucide-react";
import {
  collection,
  query,
  where,
  getDocs,
  getDoc,
  doc,
} from "firebase/firestore";
import { db } from "@/lib/firebaseConfig";

// ─── CSV Export Helper ───────────────────────────────────────────────────────
function exportToCSV(rows, fileName) {
  if (!rows.length) return;

const headers = [
    "Student Name",
    "Email",
    "Registration Number",
    "Department",       
    "Phone",
    "Country",
    "Document Title",
    "Amount Paid (NGN)",
    "Date of Purchase",
    "Time of Purchase",
    "Transaction ID",
    "Status",
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
     const date =
       r.createdAtDate instanceof Date
         ? r.createdAtDate
         : new Date(r.createdAtDate || Date.now());
     return [
       escape(r.buyerName || "—"),
       escape(r.buyerEmail || "—"),
       escape(r.studentRegNo || r.regNo || "—"),
       escape(r.department || "—"), 
       escape(r.buyerPhone || r.phone || "—"),
       escape(r.buyerCountry || "—"),
       escape(r.bookTitle || r.title || "—"),
       escape(r.amount || 0),
       escape(date.toLocaleDateString("en-NG")),
       escape(date.toLocaleTimeString("en-NG")),
       escape(r.id || "—"),
       escape("Completed"),
     ].join(",");
   }),
 ];

  const blob = new Blob([csvRows.join("\n")], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${fileName.replace(/\s+/g, "_")}_Student_List.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

// ─── Main Modal ──────────────────────────────────────────────────────────────
export default function ExportStudentsModal({
  isOpen,
  onClose,
  sellerId,
  sellerBooks = [],
}) {
  const [step, setStep] = useState("select"); // select | preview | done
  const [selectedBook, setSelectedBook] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [exportCount, setExportCount] = useState(0);

  // Filter books by search
  const filteredBooks = sellerBooks.filter((b) =>
    (b.title || b.bookTitle || "")
      .toLowerCase()
      .includes(searchQuery.toLowerCase()),
  );

 const fetchStudents = useCallback(
   async (book) => {
     if (!book || !sellerId) return;
     setLoading(true);
     setError("");
     try {
       const rawId = (book.id || "").replace("firestore-", "");
       const prefixedId = `firestore-${rawId}`;

       // Query both ID formats — transactions may store either
       const [snap1, snap2] = await Promise.all([
         getDocs(
           query(
             collection(db, "transactions"),
             where("sellerId", "==", sellerId),
             where("bookId", "==", prefixedId),
           ),
         ),
         getDocs(
           query(
             collection(db, "transactions"),
             where("sellerId", "==", sellerId),
             where("bookId", "==", rawId),
           ),
         ),
       ]);

       // Merge and deduplicate
       const seen = new Set();
       const allDocs = [...snap1.docs, ...snap2.docs].filter((d) => {
         if (seen.has(d.id)) return false;
         seen.add(d.id);
         return true;
       });

       const rows = await Promise.all(
         allDocs.map(async (docSnap) => {
           const data = docSnap.data();
           let buyerEmail = data.buyerEmail || null;
           let buyerPhone = data.buyerPhone || null;
           let buyerCountry = data.buyerCountry || null;
           let studentRegNo = data.studentRegNo || data.regNo || null;

           const buyerId = data.buyerId || data.userId || data.buyerUid || null;
           if (buyerId && (!buyerEmail || !buyerCountry)) {
             try {
               const buyerDoc = await getDoc(doc(db, "users", buyerId));
               if (buyerDoc.exists()) {
                 const bd = buyerDoc.data();
                 buyerEmail = buyerEmail || bd.email || null;
                 buyerPhone = buyerPhone || bd.phone || bd.phoneNumber || null;
                 buyerCountry = buyerCountry || bd.country || null;
                 studentRegNo =
                   studentRegNo || bd.regNo || bd.studentRegNo || null;
               }
             } catch (_) {}
           }

           return {
             id: docSnap.id,
             ...data,
             buyerEmail,
             buyerPhone,
             buyerCountry,
             studentRegNo,
             createdAtDate:
               data.createdAt?.toDate?.() ||
               new Date(data.purchaseDate || Date.now()),
           };
         }),
       );

       rows.sort((a, b) => b.createdAtDate - a.createdAtDate);
       setStudents(rows);
       setStep("preview");
     } catch (err) {
       console.error(err);
       setError("Failed to load students. Please try again.");
     } finally {
       setLoading(false);
     }
   },
   [sellerId],
 );

  const handleSelectBook = (book) => {
    setSelectedBook(book);
    setDropdownOpen(false);
    setSearchQuery("");
  };

  const handleExport = () => {
    if (!students.length) return;
    exportToCSV(students, selectedBook?.title || "Document");
    setExportCount(students.length);
    setStep("done");
  };

  const handleReset = () => {
    setStep("select");
    setSelectedBook(null);
    setStudents([]);
    setError("");
    setSearchQuery("");
  };

  useEffect(() => {
    if (!isOpen) {
      setTimeout(handleReset, 300);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white w-full sm:max-w-xl rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* ── Header ── */}
        <div className="bg-gradient-to-r from-blue-950 to-blue-800 px-6 py-5 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
              <FileText size={20} className="text-white" />
            </div>
            <div>
              <p className="text-blue-300 text-[11px] font-medium uppercase tracking-widest">
                Export
              </p>
              <p className="text-white font-bold text-lg leading-tight">
                Student Purchase List
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-blue-200 hover:text-white transition-all"
          >
            <X size={16} />
          </button>
        </div>

        {/* ── Step Indicator ── */}
        <div className="flex items-center px-6 py-3 bg-blue-950/5 border-b border-gray-100 flex-shrink-0">
          {["Select Document", "Preview", "Download"].map((label, i) => {
            const stepMap = { 0: "select", 1: "preview", 2: "done" };
            const active = step === stepMap[i];
            const past =
              (i === 0 && (step === "preview" || step === "done")) ||
              (i === 1 && step === "done");
            return (
              <React.Fragment key={label}>
                <div className="flex items-center gap-1.5">
                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold transition-all ${
                      past
                        ? "bg-green-500 text-white"
                        : active
                          ? "bg-blue-950 text-white"
                          : "bg-gray-200 text-gray-400"
                    }`}
                  >
                    {past ? "✓" : i + 1}
                  </div>
                  <span
                    className={`text-[11px] font-semibold ${
                      active
                        ? "text-blue-950"
                        : past
                          ? "text-green-600"
                          : "text-gray-400"
                    }`}
                  >
                    {label}
                  </span>
                </div>
                {i < 2 && <div className="flex-1 h-px bg-gray-200 mx-2" />}
              </React.Fragment>
            );
          })}
        </div>

        {/* ── Body ── */}
        <div className="flex-1 overflow-y-auto">
          {/* STEP 1: Select */}
          {step === "select" && (
            <div className="p-6 space-y-5">
              <div>
                <p className="text-sm font-semibold text-blue-950 mb-1">
                  Choose a document
                </p>
                <p className="text-xs text-gray-400">
                  Select which document's buyer list you want to export as a CSV
                  file.
                </p>
              </div>

              {/* Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setDropdownOpen((o) => !o)}
                  className="w-full flex items-center justify-between gap-3 px-4 py-3.5 rounded-xl border-2 border-gray-200 hover:border-blue-300 focus:border-blue-950 focus:outline-none transition-all bg-white"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <BookOpen
                      size={18}
                      className="text-blue-950 flex-shrink-0"
                    />
                    <span
                      className={`text-sm font-medium truncate ${selectedBook ? "text-blue-950" : "text-gray-400"}`}
                    >
                      {selectedBook?.title ||
                        selectedBook?.bookTitle ||
                        "Select a document…"}
                    </span>
                  </div>
                  <ChevronDown
                    size={16}
                    className={`text-gray-400 flex-shrink-0 transition-transform ${dropdownOpen ? "rotate-180" : ""}`}
                  />
                </button>

                {dropdownOpen && (
                  <div className="absolute top-full left-0 right-0 z-10 mt-1 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden">
                    {/* Search inside dropdown */}
                    <div className="p-2 border-b border-gray-100">
                      <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg">
                        <Search size={14} className="text-gray-400" />
                        <input
                          autoFocus
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="Search documents…"
                          className="flex-1 text-sm bg-transparent outline-none text-blue-950 placeholder-gray-400"
                        />
                      </div>
                    </div>
                    <div className="max-h-52 overflow-y-auto">
                      {filteredBooks.length === 0 ? (
                        <div className="px-4 py-6 text-center text-sm text-gray-400">
                          {sellerBooks.length === 0
                            ? "No uploaded documents found."
                            : "No matching documents."}
                        </div>
                      ) : (
                        filteredBooks.map((book) => (
                          <button
                            key={book.id}
                            onClick={() => handleSelectBook(book)}
                            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-blue-50 transition-colors text-left"
                          >
                            <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                              <BookOpen size={14} className="text-blue-950" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-blue-950 truncate">
                                {book.title || book.bookTitle}
                              </p>
                              {book.price && (
                                <p className="text-xs text-gray-400">
                                  ₦{Number(book.price).toLocaleString()}
                                </p>
                              )}
                            </div>
                            {selectedBook?.id === book.id && (
                              <CheckCircle
                                size={16}
                                className="text-blue-950 ml-auto flex-shrink-0"
                              />
                            )}
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Info box */}
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex gap-3">
                <BarChart2
                  size={18}
                  className="text-blue-600 flex-shrink-0 mt-0.5"
                />
                <div>
                  <p className="text-xs font-semibold text-blue-900 mb-1">
                    What's included in the export?
                  </p>
                  <p className="text-xs text-blue-700 leading-relaxed">
                    Student name, email, registration number, department, phone,
                    country, amount paid, purchase date &amp; time, and a unique
                    transaction ID.
                  </p>
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl p-3">
                  <AlertCircle
                    size={15}
                    className="text-red-500 flex-shrink-0"
                  />
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}
            </div>
          )}

          {/* STEP 2: Preview */}
          {step === "preview" && (
            <div className="p-6 space-y-4">
              {/* Summary bar */}
              <div className="flex items-center justify-between bg-blue-950 rounded-xl px-4 py-3">
                <div>
                  <p className="text-blue-300 text-[11px] font-semibold uppercase tracking-wider">
                    Document
                  </p>
                  <p className="text-white font-bold text-sm truncate max-w-[220px]">
                    {selectedBook?.title || selectedBook?.bookTitle}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-blue-300 text-[11px] font-semibold uppercase tracking-wider">
                    Buyers
                  </p>
                  <p className="text-white font-bold text-sm">
                    {students.length}
                  </p>
                </div>
              </div>

              {students.length === 0 ? (
                <div className="text-center py-10">
                  <Users size={40} className="mx-auto text-gray-300 mb-3" />
                  <p className="font-semibold text-gray-500 mb-1">
                    No purchases yet
                  </p>
                  <p className="text-xs text-gray-400">
                    No one has bought this document yet.
                  </p>
                </div>
              ) : (
                <>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Preview — first {Math.min(students.length, 5)} of{" "}
                    {students.length}
                  </p>
                  <div className="space-y-2">
                    {students.slice(0, 5).map((s, i) => (
                      <div
                        key={s.id || i}
                        className="flex items-center gap-3 bg-gray-50 rounded-xl p-3"
                      >
                        {/* Avatar initials */}
                        <div className="w-9 h-9 rounded-full bg-blue-950 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                          {(s.buyerName || "?").charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-blue-950 truncate">
                            {s.buyerName || "Unknown"}
                          </p>
                          <p className="text-xs text-gray-400 truncate">
                            {s.buyerEmail || "No email"}
                          </p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-sm font-bold text-green-600">
                            ₦{(s.amount || 0).toLocaleString()}
                          </p>
                          <p className="text-[10px] text-gray-400">
                            {s.createdAtDate?.toLocaleDateString("en-NG")}
                          </p>
                        </div>
                      </div>
                    ))}
                    {students.length > 5 && (
                      <p className="text-center text-xs text-gray-400 py-1">
                        +{students.length - 5} more rows in the export
                      </p>
                    )}
                  </div>

                  {/* Totals */}
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    {[
                      {
                        label: "Total Revenue",
                        value: `₦${students.reduce((s, t) => s + (t.amount || 0), 0).toLocaleString()}`,
                        color: "text-blue-950",
                      },
                    ].map((stat) => (
                      <div
                        key={stat.label}
                        className="bg-gray-50 rounded-xl p-3 text-center"
                      >
                        <p className="text-[10px] text-gray-400 mb-1">
                          {stat.label}
                        </p>
                        <p className={`text-sm font-bold ${stat.color}`}>
                          {stat.value}
                        </p>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {/* STEP 3: Done */}
          {step === "done" && (
            <div className="p-6 text-center space-y-4">
              <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto">
                <CheckCircle size={40} className="text-green-500" />
              </div>
              <div>
                <p className="text-xl font-bold text-blue-950 mb-1">
                  Export Successful!
                </p>
                <p className="text-sm text-gray-500">
                  Your CSV file with <strong>{exportCount}</strong> student
                  {exportCount !== 1 ? "s" : ""} has been downloaded.
                </p>
              </div>
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-left space-y-2">
                <p className="text-xs font-semibold text-green-800">
                  📂 File saved as:
                </p>
                <p className="text-xs font-mono text-green-700 break-all">
                  {(selectedBook?.title || "Document").replace(/\s+/g, "_")}
                  _Student_List.csv
                </p>
                <p className="text-xs text-green-600 mt-1">
                  You can open this file in Microsoft Excel, Google Sheets, or
                  any spreadsheet app.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* ── Footer Buttons ── */}
        <div className="px-6 pb-8 pt-4 border-t border-gray-100 flex gap-3 flex-shrink-0">
          {step === "select" && (
            <>
              <button
                onClick={onClose}
                className="flex-1 py-3 rounded-xl border-2 border-gray-200 text-sm font-semibold text-gray-500 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => fetchStudents(selectedBook)}
                disabled={!selectedBook || loading}
                className="flex-1 py-3 rounded-xl bg-blue-950 text-white text-sm font-bold hover:bg-blue-900 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Loading…
                  </>
                ) : (
                  <>
                    Preview List
                    <ChevronDown size={16} className="-rotate-90" />
                  </>
                )}
              </button>
            </>
          )}

          {step === "preview" && (
            <>
              <button
                onClick={handleReset}
                className="flex-1 py-3 rounded-xl border-2 border-gray-200 text-sm font-semibold text-gray-500 hover:bg-gray-50 transition-colors"
              >
                ← Back
              </button>
              <button
                onClick={handleExport}
                disabled={students.length === 0}
                className="flex-1 py-3 rounded-xl bg-green-600 text-white text-sm font-bold hover:bg-green-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Download size={16} />
                Download CSV
              </button>
            </>
          )}

          {step === "done" && (
            <>
              <button
                onClick={handleReset}
                className="flex-1 py-3 rounded-xl border-2 border-gray-200 text-sm font-semibold text-gray-500 hover:bg-gray-50 transition-colors"
              >
                Export Another
              </button>
              <button
                onClick={onClose}
                className="flex-1 py-3 rounded-xl bg-blue-950 text-white text-sm font-bold hover:bg-blue-900 transition-colors"
              >
                Done
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
