"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import {
  Search, Package, BookOpen, MapPin, User, CheckCircle,
  AlertCircle, Printer, Plus, ArrowLeft, Layers, FileText,
  Hash, Building2, Loader2, ScanLine, Shield, MessageCircle,
  RefreshCw, Database, Lock, LayoutDashboard
} from "lucide-react";
import {
  collection, query, where, getDocs, addDoc,
  updateDoc, doc, serverTimestamp, getDoc, limit, runTransaction
} from "firebase/firestore";
import { QRCodeSVG } from "qrcode.react";
import { db, auth } from "@/lib/firebaseConfig";

/* ─── Admin check ────────────────────────────────────────────── */
const ADMIN_EMAILS = process.env.NEXT_PUBLIC_ADMIN_EMAILS?.split(",") || [];

/* ─── Asset ID ───────────────────────────────────────────────── */
function generateAssetId() {
  const year = new Date().getFullYear();
  const n = String(Math.floor(Math.random() * 9000) + 1000).padStart(4, "0");
  return `LAN-ABJ-${year}-${n}`;
}

/* ─── Debounce ───────────────────────────────────────────────── */
function useDebounce(value, delay) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

/* ─── Print Sticker (print-only popup) ──────────────────────── */
function printSticker(assetId, bookTitle) {
  const verifyUrl = `https://learningaccessnetwork.vercel.app/verify/${assetId}`;
  const win = window.open("", "_blank", "width=420,height=380");
  win.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Sticker — ${assetId}</title>
      <script src="https://cdn.jsdelivr.net/npm/qrcode/build/qrcode.min.js"><\/script>
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
          background: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          font-family: Georgia, serif;
        }
        .sticker {
          width: 2.6in;
          border: 1.5px solid #0d2244;
          padding: 12px 10px 8px;
          text-align: center;
        }
        .title {
          font-size: 9px;
          font-weight: 700;
          color: #0d2244;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          margin-bottom: 8px;
          line-height: 1.4;
          word-wrap: break-word;
          overflow-wrap: break-word;
          white-space: normal;
          max-width: 100%;
        }
        canvas {
          display: block;
          margin: 0 auto 8px;
        }
        .asset {
          font-family: monospace;
          font-size: 9px;
          font-weight: 700;
          color: #0d2244;
          letter-spacing: 0.1em;
          margin-bottom: 4px;
        }
        .brand {
          font-size: 7px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.18em;
          color: #b8963e;
          border-top: 1px solid #b8963e;
          padding-top: 5px;
          margin-top: 3px;
        }
        @media print {
          body { margin: 0; }
        }
      </style>
    </head>
    <body>
      <div class="sticker">
        <div class="title">${bookTitle}</div>
        <canvas id="qr"></canvas>
        <div class="asset">${assetId}</div>
        <div class="brand">LAN Library Registry</div>
      </div>
      <script>
        window.onload = function() {
          QRCode.toCanvas(
            document.getElementById('qr'),
            '${verifyUrl}',
            {
              width: 110,
              margin: 1,
              errorCorrectionLevel: 'H',
              color: { dark: '#0d2244', light: '#ffffff' }
            },
            function(error) {
              if (error) console.error(error);
              setTimeout(function() {
                window.print();
              }, 300);
            }
          );
        };
      <\/script>
    </body>
    </html>
  `);
  win.document.close();
}

/* ─── Consignment Receipt ────────────────────────────────────── */
function ConsignmentNote({ data, onClose, onPrint }) {
  const dateStr = new Date().toLocaleDateString("en-NG", { day: "2-digit", month: "long", year: "numeric" });
  const verifyUrl = `https://learningaccessnetwork.vercel.app/verify/${data.assetId}`;

  const handleWhatsApp = () => {
    const msg = encodeURIComponent(
      `📚 *LAN Library – Abuja Registry*\nConsignment Receipt\n\nAsset ID: *${data.assetId}*\nDocument: ${data.bookTitle}\nCopies: *${data.totalConsignment}*\nShelf: ${data.shelfLocation || "TBA"}\nDate: ${dateStr}\n\nThank you for depositing with LAN Library.`
    );
    window.open(`https://wa.me/?text=${msg}`, "_blank");
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px", backdropFilter: "blur(6px)" }}>
      <div style={{ background: "#fff", width: "100%", maxWidth: "560px", maxHeight: "90vh", overflow: "auto", boxShadow: "0 40px 80px rgba(0,0,0,0.6)", animation: "ciSlideUp 0.3s ease both" }}>

        {/* ── Header ── */}
        <div style={{ background: "#0d2244", padding: "24px 28px", backgroundImage: "radial-gradient(rgba(184,150,62,0.08) 1px,transparent 1px)", backgroundSize: "20px 20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "18px" }}>
            <div style={{ width: "44px", height: "44px", background: "#b8963e", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Shield size={20} style={{ color: "#0d2244" }} />
            </div>
            <div>
              <p style={{ color: "#b8963e", fontSize: "9px", fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", margin: 0 }}>LAN Library — Abuja Registry</p>
              <p style={{ color: "#fff", fontSize: "18px", fontWeight: 700, fontFamily: "Georgia,serif", margin: "2px 0 0" }}>Consignment Receipt</p>
            </div>
          </div>
          <div style={{ display: "flex", gap: "24px", flexWrap: "wrap" }}>
            {[["Asset ID", data.assetId], ["Date", dateStr], ["Status", data.isRestock ? "RESTOCKED" : "NEW ENTRY"]].map(([k, v]) => (
              <div key={k}>
                <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "9px", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", margin: "0 0 2px" }}>{k}</p>
                <p style={{ color: v === "NEW ENTRY" ? "#4ade80" : "#d4aa5a", fontSize: "13px", fontWeight: 700, fontFamily: k === "Asset ID" ? "monospace" : "inherit", margin: 0 }}>{v}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Body ── */}
        <div style={{ padding: "24px 28px" }}>

          {/* Restock banner */}
          {data.isRestock && (
            <div style={{ background: "#fffbeb", border: "0.5px solid #fbbf24", padding: "10px 14px", marginBottom: "16px", display: "flex", gap: "8px" }}>
              <RefreshCw size={13} style={{ color: "#d97706", flexShrink: 0, marginTop: "1px" }} />
              <p style={{ fontSize: "11px", color: "#92400e", margin: 0, lineHeight: 1.6 }}>
                Restock — previous stock of <strong>{data.previousStock}</strong> copies updated.
              </p>
            </div>
          )}

          {/* Document details */}
          <div style={{ background: "#f5f0e8", border: "0.5px solid rgba(184,150,62,0.2)", padding: "16px", marginBottom: "16px" }}>
            <p style={{ fontSize: "9px", fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: "#b8963e", margin: "0 0 12px" }}>Document Details</p>
            {[
              ["Document Title", data.bookTitle],
              ["Seller", data.sellerName],
              ["Seller Email", data.sellerEmail],
              ["Quantity Consigned", `${data.totalConsignment} copies`],
              ["Shelf Location", data.shelfLocation || "To be assigned"],
              ["Course / Ref Code", data.courseCode || "—"],
              ["Asset ID", data.assetId],
            ].map(([k, v]) => (
              <div key={k} style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", padding: "6px 0", borderBottom: "0.5px solid #e5ddd0" }}>
                <span style={{ color: "#999", minWidth: "130px" }}>{k}</span>
                <span style={{ fontWeight: 700, color: "#0d2244", fontFamily: k === "Asset ID" ? "monospace" : "inherit", textAlign: "right", maxWidth: "220px" }}>{v}</span>
              </div>
            ))}
          </div>

          {/* ── QR Code sticker block ── */}
          <div style={{ background: "#f5f0e8", border: "0.5px solid rgba(184,150,62,0.2)", padding: "16px", marginBottom: "16px", display: "flex", alignItems: "center", gap: "20px" }}>
            {/* QR */}
            <div style={{ background: "#fff", padding: "8px", border: "0.5px solid #e5ddd0", flexShrink: 0 }}>
              <QRCodeSVG
                value={verifyUrl}
                size={88}
                fgColor="#0d2244"
                level="H"
                includeMargin={false}
              />
            </div>
            {/* Info */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: "9px", fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: "#b8963e", margin: "0 0 4px" }}>
                Book Sticker — QR Code
              </p>
              <p style={{ fontSize: "11px", color: "#666", margin: "0 0 8px", lineHeight: 1.6 }}>
                Stick this on the inside cover of each physical copy. Students scan it to verify authenticity.
              </p>
              <p style={{ fontSize: "10px", fontFamily: "monospace", color: "#0d2244", wordBreak: "break-all", margin: "0 0 10px" }}>
                {verifyUrl}
              </p>
              <button
                onClick={() => printSticker(data.assetId, data.bookTitle)}
                style={{
                  background: "#0d2244", color: "#b8963e", border: "none",
                  padding: "7px 14px", fontSize: "11px", fontWeight: 700,
                  cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "6px",
                }}
              >
                <Printer size={12} /> Print Sticker Only
              </button>
            </div>
          </div>

          {/* Custody notice */}
          <div style={{ background: "#f8f9fa", border: "0.5px solid #e5e7eb", padding: "12px 14px", marginBottom: "20px" }}>
            <p style={{ fontSize: "10px", color: "#666", margin: 0, lineHeight: 1.7 }}>
              LAN Library retains custody of the above copies until all are cleared or returned upon formal request.
            </p>
          </div>

          {/* Signatures */}
          <style>{`@import url('https://fonts.googleapis.com/css2?family=Dancing+Script:wght@700&display=swap');`}</style>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "24px" }}>
            <div>
              <div style={{ height: "52px", display: "flex", alignItems: "flex-end", paddingBottom: "4px", borderBottom: "1.5px solid #ccc" }}>
                <span style={{
                  fontFamily: "'Dancing Script', cursive",
                  fontSize: "32px",
                  fontWeight: 700,
                  color: "#0d2244",
                  lineHeight: 1,
                }}>
                  LANRegistryABJ
                </span>
              </div>
              <p style={{ fontSize: "10px", color: "#aaa", margin: "5px 0 0" }}>LAN Admin Signature</p>
              <p style={{ fontSize: "9px", color: "#b8963e", margin: "2px 0 0", fontWeight: 700, letterSpacing: "0.06em" }}>
                ABUJA REGISTRY
              </p>
            </div>
            <div>
              <div style={{ height: "52px", borderBottom: "1.5px solid #ccc" }} />
              <p style={{ fontSize: "10px", color: "#aaa", margin: "5px 0 0" }}>Seller Acknowledgment</p>
              <p style={{ fontSize: "9px", color: "#aaa", margin: "2px 0 0", fontStyle: "italic" }}>
                Sign above upon receipt
              </p>
            </div>
          </div>
          {/* Action buttons */}
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            <button
              onClick={onClose}
              style={{ flex: "1 1 80px", background: "#f5f5f5", color: "#666", padding: "12px", border: "0.5px solid #e5ddd0", fontSize: "12px", fontWeight: 700, cursor: "pointer" }}
            >
              Close
            </button>
            <button
              onClick={handleWhatsApp}
              style={{ flex: "1 1 100px", background: "#25d366", color: "#fff", padding: "12px", border: "none", fontSize: "12px", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}
            >
              <MessageCircle size={14} /> WhatsApp
            </button>
            <button
              onClick={onPrint}
              style={{ flex: "2 1 120px", background: "#0d2244", color: "#fff", padding: "12px", border: "none", fontSize: "12px", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}
            >
              <Printer size={14} /> Print / PDF
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MAIN — Admin Office Check-In
═══════════════════════════════════════════════════════════════ */
export default function AdminOfficeCheckInPage() {
  const router = useRouter();
  const [authState, setAuthState] = useState("loading");
  const [adminUser, setAdminUser] = useState(null);

  const [step, setStep] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchLayer, setSearchLayer] = useState(null);
  const [sellerResults, setSellerResults] = useState([]);
  const [selectedSeller, setSelectedSeller] = useState(null);
  const [sellerBooks, setSellerBooks] = useState([]);
  const [selectedBook, setSelectedBook] = useState(null);
  const [isNewPhysical, setIsNewPhysical] = useState(false);
  const [newBookTitle, setNewBookTitle] = useState("");
  const [newCourseCode, setNewCourseCode] = useState("");
  const [quantity, setQuantity] = useState("");
  const [shelfLocation, setShelfLocation] = useState("");
  const [adminNotes, setAdminNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [assetId] = useState(generateAssetId);
  const [consignmentData, setConsignmentData] = useState(null);
  const [showReceipt, setShowReceipt] = useState(false);
  const [recentCheckins, setRecentCheckins] = useState([]);

  const debouncedQuery = useDebounce(searchQuery, 500);

  /* ── Admin gate ── */
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) { setAuthState("denied"); return; }
      try {
        const uDoc = await getDoc(doc(db, "users", u.uid));
        const data = uDoc.exists() ? uDoc.data() : {};
        const isAdmin = data.role === "admin" || data.isAdmin === true || ADMIN_EMAILS.includes(u.email);
        if (isAdmin) { setAdminUser(u); setAuthState("admin"); }
        else setAuthState("denied");
      } catch { setAuthState("denied"); }
    });
    return () => unsub();
  }, []);

  /* ── Auto-search ── */
  useEffect(() => {
    if (debouncedQuery.trim().length >= 2) handleSearch(debouncedQuery.trim());
    else { setSellerResults([]); setSearchLayer(null); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQuery]);

  /* ── 3-Layer Search ── */
  const handleSearch = async (raw) => {
    if (!raw) return;
    setSearching(true); setSellerResults([]); setSearchLayer(null);
    try {
      const usersRef = collection(db, "users");
      const sellersRef = collection(db, "sellers");
      const lower = raw.toLowerCase();
      const upper = lower + "\uf8ff";
      setSearchLayer(1);
      const [fnSnap, snSnap, emSnap, slNameSnap, slEmailSnap, accSnap] = await Promise.all([
        getDocs(query(usersRef, where("firstName_lower", ">=", lower), where("firstName_lower", "<=", upper), limit(10))),
        getDocs(query(usersRef, where("surname_lower", ">=", lower), where("surname_lower", "<=", upper), limit(10))),
        getDocs(query(usersRef, where("email", "==", raw), limit(5))),
        getDocs(query(sellersRef, where("sellerName", ">=", raw), where("sellerName", "<=", raw + "\uf8ff"), limit(10))),
        getDocs(query(sellersRef, where("sellerEmail", "==", raw), limit(5))),
        getDocs(query(sellersRef, where("accountNumber", ">=", raw.toUpperCase()), where("accountNumber", "<=", raw.toUpperCase() + "\uf8ff"), limit(5))),
      ]);
      const uidSet = new Set(); const rawResults = [];
      const push = (d, extra = {}) => { if (!uidSet.has(d.id)) { uidSet.add(d.id); rawResults.push({ uid: d.id, ...d.data(), ...extra }); } };
      [...fnSnap.docs, ...snSnap.docs, ...emSnap.docs].forEach(d => push(d, { source: "users" }));
      await Promise.all([...slNameSnap.docs, ...slEmailSnap.docs, ...accSnap.docs].map(async d => {
        const sid = d.data().sellerId || d.id; if (uidSet.has(sid)) return; uidSet.add(sid);
        try { const ud = await getDoc(doc(db, "users", sid)); rawResults.push({ uid: sid, source: "sellers", ...(ud.exists() ? ud.data() : {}), ...d.data() }); }
        catch { rawResults.push({ uid: sid, source: "sellers", ...d.data() }); }
      }));
      if (rawResults.length === 0) {
        setSearchLayer(3);
        const fb = await getDocs(query(usersRef, where("isSeller", "==", true), limit(300)));
        fb.docs.forEach(d => { const dat = d.data(); const full = `${dat.firstName || ""} ${dat.surname || ""}`.toLowerCase(); if (full.includes(lower) || (dat.email || "").toLowerCase().includes(lower)) push(d, { source: "fallback" }); });
      }
      setSellerResults(rawResults.map(r => ({
        uid: r.uid,
        firstName: r.firstName || r.sellerName?.split(" ")[0] || "Unknown",
        surname: r.surname || r.sellerName?.split(" ").slice(1).join(" ") || "",
        email: r.email || r.sellerEmail || "—",
        lanAccountNumber: r.accountNumber || r.uid.slice(0, 8),
        photoBase64: r.photoBase64 || null,
        source: r.source,
      })));
    } catch (e) { console.error(e); setSellerResults([]); }
    finally { setSearching(false); }
  };

  const handleSelectSeller = async (seller) => {
    setSelectedSeller(seller); setSellerBooks([]);
    try {
      const snap = await getDocs(query(collection(db, "advertMyBook"), where("sellerId", "==", seller.uid)));
      setSellerBooks(snap.docs.map(d => ({ id: d.id, bookTitle: d.data().bookTitle || d.data().title || "Untitled", course: d.data().courseCode || "", ...d.data() })));
    } catch { }
    setStep(2);
  };

  /* ── Submit ── */
  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const bookTitle = isNewPhysical ? newBookTitle : selectedBook.bookTitle;
      const courseCode = isNewPhysical ? newCourseCode : (selectedBook.course || "");
      const bookId = isNewPhysical ? null : selectedBook.id;
      const qty = parseInt(quantity);

      let existingDocRef = null, existingData = null, isRestock = false;
      if (bookId) {
        const es = await getDocs(query(collection(db, "physicalInventory"), where("sellerId", "==", selectedSeller.uid), where("bookId", "==", bookId), limit(1)));
        if (!es.empty) { existingDocRef = es.docs[0].ref; existingData = es.docs[0].data(); isRestock = true; }
      }

      const finalAssetId = isRestock ? existingData.assetId : assetId;

      await runTransaction(db, async (txn) => {
        if (isRestock && existingDocRef) {
          txn.update(existingDocRef, {
            totalConsignment: existingData.totalConsignment + qty,
            currentStock: existingData.currentStock + qty,
            lastRestockDate: serverTimestamp(),
            lastRestockQty: qty,
            shelfLocation: shelfLocation || existingData.shelfLocation,
            adminNotes: adminNotes || existingData.adminNotes,
            updatedAt: serverTimestamp(),
          });
        } else {
          const newRef = doc(collection(db, "physicalInventory"));
          txn.set(newRef, {
            assetId,
            sellerId: selectedSeller.uid,
            sellerName: `${selectedSeller.firstName} ${selectedSeller.surname}`,
            sellerEmail: selectedSeller.email,
            bookId: bookId || null,
            bookTitle, courseCode,
            totalConsignment: qty, currentStock: qty,
            soldCount: 0,
            shelfLocation: shelfLocation || "Unassigned",
            adminNotes: adminNotes || "",
            status: "in_stock", isNewPhysical,
            checkedInAt: serverTimestamp(),
            lastRestockDate: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        }
        if (bookId) {
          try {
            txn.update(doc(db, "advertMyBook", bookId), {
              hasPhysicalCopies: true,
              physicalAssetId: finalAssetId,
              updatedAt: serverTimestamp(),
            });
          } catch { }
        }
      });

      await addDoc(collection(db, "notifications"), {
        userId: selectedSeller.uid,
        type: "physical_intake",
        title: isRestock ? `Restock confirmed: ${bookTitle}` : `${qty} copies checked in: ${bookTitle}`,
        message: `${qty} physical ${isRestock ? "additional " : ""}copies of "${bookTitle}" have been received at the Abuja Registry. Asset ID: ${finalAssetId}.`,
        assetId: finalAssetId,
        createdAt: serverTimestamp(),
        read: false,
      });

      const receipt = {
        assetId: finalAssetId,
        sellerId: selectedSeller.uid,
        sellerName: `${selectedSeller.firstName} ${selectedSeller.surname}`,
        sellerEmail: selectedSeller.email,
        bookTitle, courseCode,
        totalConsignment: qty,
        currentStock: qty,
        shelfLocation: shelfLocation || "Unassigned",
        checkedInAt: new Date().toISOString(),
        isRestock,
        previousStock: isRestock ? existingData?.currentStock : 0,
      };
      setConsignmentData(receipt);
      setRecentCheckins(prev => [receipt, ...prev.slice(0, 4)]);
      setShowReceipt(true);
    } catch (err) { console.error(err); alert("Failed: " + err.message); }
    finally { setSubmitting(false); }
  };

  const handleReset = () => {
    setStep(1); setSearchQuery(""); setSellerResults([]); setSelectedSeller(null);
    setSellerBooks([]); setSelectedBook(null); setIsNewPhysical(false);
    setNewBookTitle(""); setNewCourseCode(""); setQuantity("");
    setShelfLocation(""); setAdminNotes(""); setShowReceipt(false); setConsignmentData(null);
  };

  const STEPS = ["Seller", "Document", "Details", "Confirm"];
  const canSubmit = quantity && parseInt(quantity) > 0 && (isNewPhysical ? newBookTitle : selectedBook);

  /* ── Loading ── */
  if (authState === "loading") return (
    <div style={{ minHeight: "100vh", background: "#0b1628", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ width: "44px", height: "44px", border: "2px solid rgba(59,130,246,0.3)", borderTopColor: "#3b82f6", borderRadius: "50%", animation: "ciSpin 0.8s linear infinite", margin: "0 auto 12px" }} />
        <p style={{ color: "#94a3b8", fontSize: "14px" }}>Verifying access…</p>
        <style>{`@keyframes ciSpin{to{transform:rotate(360deg)}}`}</style>
      </div>
    </div>
  );

  /* ── Denied ── */
  if (authState === "denied") return (
    <div style={{ minHeight: "100vh", background: "#0b1628", display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}>
      <div style={{ background: "#162033", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "16px", padding: "48px 36px", maxWidth: "380px", width: "100%", textAlign: "center" }}>
        <div style={{ width: "64px", height: "64px", background: "rgba(239,68,68,0.12)", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
          <Lock size={28} style={{ color: "#f87171" }} />
        </div>
        <h2 style={{ color: "#e2e8f0", fontSize: "20px", fontWeight: 700, margin: "0 0 8px" }}>Admin Access Only</h2>
        <p style={{ color: "#64748b", fontSize: "13px", lineHeight: 1.6, margin: "0 0 28px" }}>
          The Office Check-In page is restricted to LAN administrators. Sign in with an admin account to continue.
        </p>
        <div style={{ display: "flex", gap: "10px", flexDirection: "column" }}>
          <a href="/auth/signin" style={{ background: "#3b82f6", color: "#fff", padding: "12px 24px", borderRadius: "8px", textDecoration: "none", fontSize: "13px", fontWeight: 600, display: "block" }}>Sign In as Admin</a>
          <a href="/home" style={{ background: "transparent", color: "#64748b", padding: "10px 24px", borderRadius: "8px", textDecoration: "none", fontSize: "13px", border: "1px solid rgba(255,255,255,0.07)", display: "block" }}>Go Home</a>
        </div>
      </div>
    </div>
  );

  /* ══════════════════════════════════════════════════════════════
     MAIN
  ══════════════════════════════════════════════════════════════ */
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=Lato:wght@400;700&display=swap');
        :root {
          --nav-bg:#0d1b2e; --card-bg:#162033; --card-border:rgba(255,255,255,0.07);
          --surface:#1a2740; --surface2:#1f2f47;
          --accent:#3b82f6; --accent-light:#60a5fa; --accent-glow:rgba(59,130,246,0.15);
          --success:#10b981; --warning:#f59e0b; --danger:#ef4444;
          --text-primary:#e2e8f0; --text-secondary:#94a3b8; --text-muted:#64748b;
          --gold:#b8963e; --goldd:#d4aa5a;
        }
        *{box-sizing:border-box;} body{margin:0;}
        .ci-root{font-family:'Lato',sans-serif;background:#0b1628;min-height:100vh;}
        .ci-card{background:var(--card-bg);border:1px solid var(--card-border);border-radius:12px;}
        .ci-card:hover{border-color:rgba(59,130,246,0.3);}
        .ci-input{width:100%;background:var(--surface);border:1px solid var(--card-border);border-radius:8px;padding:10px 13px;font-size:13px;color:var(--text-primary);outline:none;font-family:'Lato',sans-serif;transition:border-color 0.18s;}
        .ci-input:focus{border-color:rgba(59,130,246,0.5);}
        .ci-input::placeholder{color:var(--text-muted);}
        .lec-row{display:flex;align-items:center;gap:12px;padding:12px 14px;border:1px solid var(--card-border);background:var(--card-bg);cursor:pointer;border-radius:8px;transition:all 0.18s;margin-bottom:8px;}
        .lec-row:hover{border-color:var(--accent);background:var(--surface);}
        .book-tile{padding:14px;border:1px solid var(--card-border);background:var(--card-bg);cursor:pointer;border-radius:8px;transition:all 0.18s;}
        .book-tile:hover{border-color:var(--accent);background:var(--surface);}
        .book-tile.selected{border-color:var(--accent);background:var(--accent-glow);}
        @keyframes ciSpin{to{transform:rotate(360deg)}}
        @keyframes ciFadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        @keyframes ciSlideUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
        .ci-fade{animation:ciFadeIn 0.3s ease both;}
        .ci-pulse{animation:ciPulse 2s infinite;}
        @keyframes ciPulse{0%,100%{opacity:1}50%{opacity:0.4}}
        .ci-label{font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:var(--text-muted);display:block;margin-bottom:6px;}
        .btn-primary{background:var(--accent);color:#fff;padding:10px 20px;border:none;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer;display:inline-flex;align-items:center;gap:6px;transition:background 0.18s;}
        .btn-primary:hover{background:#2563eb;}
        .btn-primary:disabled{background:var(--surface2);color:var(--text-muted);cursor:not-allowed;}
        .btn-ghost{background:var(--surface);color:var(--text-secondary);padding:10px 20px;border:1px solid var(--card-border);border-radius:8px;font-size:13px;font-weight:600;cursor:pointer;transition:all 0.18s;}
        .btn-ghost:hover{background:var(--surface2);color:var(--text-primary);}
        .btn-gold{background:var(--gold);color:#0d2244;padding:12px 24px;border:none;border-radius:8px;font-size:13px;font-weight:700;cursor:pointer;display:inline-flex;align-items:center;gap:6px;}
        .btn-gold:disabled{opacity:0.5;cursor:not-allowed;}
        @media print{.ci-root,header{display:none!important;}}
      `}</style>

      <div className="ci-root">

        {/* ── Top Bar ── */}
        <header style={{ background: "var(--nav-bg)", borderBottom: "1px solid var(--card-border)", padding: "0 24px", height: "60px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 50 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <a href="/sys-panel/management-console" style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--text-muted)", textDecoration: "none", fontSize: "12px", fontWeight: 600 }}>
              <LayoutDashboard size={14} /> Admin Panel
            </a>
            <span style={{ color: "var(--card-border)" }}>›</span>
            <span style={{ color: "var(--accent-light)", fontSize: "12px", fontWeight: 700 }}>Office Check-In</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div className="ci-pulse" style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#4ade80" }} />
            <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>Abuja Registry · Live</span>
            <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "linear-gradient(135deg,var(--accent),#8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: 700, color: "#fff" }}>
              {adminUser?.email?.[0]?.toUpperCase() || "A"}
            </div>
          </div>
        </header>

        <div style={{ maxWidth: "820px", margin: "0 auto", padding: "28px 16px 80px" }}>

          {/* ── Page Title ── */}
          <div style={{ marginBottom: "28px" }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: "7px", background: "var(--accent-glow)", border: "1px solid rgba(59,130,246,0.3)", borderRadius: "6px", padding: "4px 12px", marginBottom: "10px" }}>
              <Building2 size={11} style={{ color: "var(--accent-light)" }} />
              <span style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--accent-light)" }}>Admin — Physical Intake</span>
            </div>
            <h1 style={{ fontFamily: "'Playfair Display',Georgia,serif", fontSize: "clamp(22px,4vw,34px)", fontWeight: 700, color: "var(--text-primary)", margin: "0 0 6px" }}>Office Check-In</h1>
            <p style={{ fontSize: "13px", color: "var(--text-muted)", margin: 0, lineHeight: 1.7 }}>
              Register physical consignments from sellers. Creates inventory entries and fires seller notifications.
            </p>
          </div>

          {/* ── Asset ID Banner ── */}
          <div style={{ background: "var(--surface)", border: "1px solid var(--card-border)", borderRadius: "10px", padding: "14px 18px", marginBottom: "24px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "10px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <Hash size={15} style={{ color: "var(--accent)" }} />
              <div>
                <p style={{ fontSize: "9px", fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--text-muted)", margin: 0 }}>Pre-assigned Asset ID</p>
                <p style={{ fontSize: "15px", fontWeight: 700, color: "var(--goldd)", fontFamily: "monospace", margin: "2px 0 0", letterSpacing: "0.1em" }}>{assetId}</p>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "7px", background: "var(--accent-glow)", border: "1px solid rgba(59,130,246,0.2)", borderRadius: "6px", padding: "7px 12px" }}>
              <ScanLine size={12} style={{ color: "var(--accent-light)" }} />
              <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>Session only</span>
            </div>
          </div>

          {/* ── Progress Steps ── */}
          <div style={{ display: "flex", alignItems: "center", marginBottom: "28px" }}>
            {STEPS.map((label, i) => {
              const num = i + 1; const done = step > num; const active = step === num;
              return (
                <div key={label} style={{ display: "flex", alignItems: "center", flex: i < STEPS.length - 1 ? 1 : "none" }}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
                    <div style={{ width: "30px", height: "30px", borderRadius: "50%", background: done ? "var(--success)" : active ? "var(--accent)" : "var(--surface2)", border: `2px solid ${done ? "var(--success)" : active ? "var(--accent)" : "var(--card-border)"}`, display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.3s" }}>
                      {done ? <CheckCircle size={13} style={{ color: "#fff" }} /> : <span style={{ fontSize: "11px", fontWeight: 700, color: active ? "#fff" : "var(--text-muted)" }}>{num}</span>}
                    </div>
                    <span style={{ fontSize: "9px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: active ? "var(--text-primary)" : done ? "var(--success)" : "var(--text-muted)", whiteSpace: "nowrap" }}>{label}</span>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div style={{ flex: 1, height: "1px", background: step > num ? "var(--success)" : "var(--card-border)", margin: "0 6px", marginBottom: "18px", transition: "background 0.4s" }} />
                  )}
                </div>
              );
            })}
          </div>

          {/* ══════════ STEP 1 ══════════ */}
          {step === 1 && (
            <div className="ci-fade">
              <div className="ci-card" style={{ padding: "24px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "18px" }}>
                  <div style={{ width: "38px", height: "38px", background: "var(--accent-glow)", border: "1px solid rgba(59,130,246,0.3)", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <User size={17} style={{ color: "var(--accent-light)" }} />
                  </div>
                  <div>
                    <p style={{ fontSize: "9px", fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--accent-light)", margin: 0 }}>Step 1 of 4</p>
                    <h2 style={{ fontFamily: "'Playfair Display',Georgia,serif", fontSize: "18px", fontWeight: 700, color: "var(--text-primary)", margin: "2px 0 0" }}>Seller Lookup</h2>
                  </div>
                </div>
                <p style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "16px", lineHeight: 1.7 }}>Auto-searches as you type via 3-layer Firestore strategy.</p>
                <div style={{ position: "relative", marginBottom: "12px" }}>
                  {searching
                    ? <Loader2 size={14} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--accent)", animation: "ciSpin 0.8s linear infinite" }} />
                    : <Search size={14} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
                  }
                  <input className="ci-input" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Name, LAN account, or email…" style={{ paddingLeft: "36px" }} />
                </div>
                {searchLayer && searching && (
                  <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: searchLayer === 3 ? "rgba(245,158,11,0.1)" : "rgba(16,185,129,0.1)", border: `1px solid ${searchLayer === 3 ? "rgba(245,158,11,0.3)" : "rgba(16,185,129,0.3)"}`, borderRadius: "6px", padding: "3px 10px", marginBottom: "10px" }}>
                    <Database size={9} style={{ color: searchLayer === 3 ? "var(--warning)" : "var(--success)" }} />
                    <span style={{ fontSize: "9px", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: searchLayer === 3 ? "var(--warning)" : "var(--success)" }}>
                      {searchLayer === 3 ? "Layer 3 — Full Scan" : "Layer 1 — Indexed Query"}
                    </span>
                  </div>
                )}
                {sellerResults.length > 0 && (
                  <div>
                    <p style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--accent-light)", marginBottom: "10px" }}>
                      {sellerResults.length} found {sellerResults.some(s => s.source === "fallback") && <span style={{ color: "var(--warning)" }}>· via Layer 3</span>}
                    </p>
                    {sellerResults.map(s => (
                      <div key={s.uid} className="lec-row" onClick={() => handleSelectSeller(s)}>
                        <div style={{ width: "40px", height: "40px", background: "linear-gradient(135deg,var(--accent),#8b5cf6)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          {s.photoBase64
                            ? <img src={s.photoBase64} style={{ width: "40px", height: "40px", borderRadius: "50%", objectFit: "cover" }} alt="" />
                            : <span style={{ fontSize: "14px", fontWeight: 700, color: "#fff" }}>{(s.firstName?.[0] || "?") + (s.surname?.[0] || "")}</span>
                          }
                        </div>
                        <div style={{ flex: 1 }}>
                          <p style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-primary)", margin: "0 0 2px" }}>{s.firstName} {s.surname}</p>
                          <p style={{ fontSize: "11px", color: "var(--text-muted)", margin: 0 }}>{s.email}</p>
                        </div>
                        <div style={{ background: "var(--surface2)", border: "1px solid var(--card-border)", borderRadius: "6px", padding: "3px 10px" }}>
                          <span style={{ fontSize: "10px", fontWeight: 700, color: "var(--accent-light)", fontFamily: "monospace" }}>{s.lanAccountNumber}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {sellerResults.length === 0 && searchQuery.trim().length >= 2 && !searching && (
                  <div style={{ textAlign: "center", padding: "28px 0", border: "1px dashed var(--card-border)", borderRadius: "8px" }}>
                    <AlertCircle size={24} style={{ color: "var(--text-muted)", margin: "0 auto 8px" }} />
                    <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>No sellers found — all 3 layers tried.</p>
                  </div>
                )}
                {!searchQuery && (
                  <div style={{ background: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.2)", borderRadius: "8px", padding: "12px 14px", display: "flex", gap: "10px" }}>
                    <AlertCircle size={13} style={{ color: "var(--accent)", flexShrink: 0, marginTop: "1px" }} />
                    <p style={{ fontSize: "11px", color: "var(--text-secondary)", margin: 0, lineHeight: 1.7 }}>Seller must have an active LAN account. If not, direct them to <strong style={{ color: "var(--accent-light)" }}>lan.ng/register</strong></p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ══════════ STEP 2 ══════════ */}
          {step === 2 && (
            <div className="ci-fade">
              <div style={{ background: "var(--surface)", border: "1px solid var(--card-border)", borderRadius: "8px", padding: "10px 14px", marginBottom: "14px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <CheckCircle size={13} style={{ color: "var(--success)" }} />
                  <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-primary)" }}>{selectedSeller.firstName} {selectedSeller.surname}</span>
                  <span style={{ fontSize: "11px", color: "var(--text-muted)", fontFamily: "monospace" }}>{selectedSeller.lanAccountNumber}</span>
                </div>
                <button onClick={() => { setStep(1); setSellerResults([]); }} style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: "11px" }}>Change</button>
              </div>
              <div className="ci-card" style={{ padding: "24px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "18px" }}>
                  <div style={{ width: "38px", height: "38px", background: "var(--accent-glow)", border: "1px solid rgba(59,130,246,0.3)", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center" }}><BookOpen size={17} style={{ color: "var(--accent-light)" }} /></div>
                  <div>
                    <p style={{ fontSize: "9px", fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--accent-light)", margin: 0 }}>Step 2 of 4</p>
                    <h2 style={{ fontFamily: "'Playfair Display',Georgia,serif", fontSize: "18px", fontWeight: 700, color: "var(--text-primary)", margin: "2px 0 0" }}>Select Document</h2>
                  </div>
                </div>
                {sellerBooks.length > 0 && (
                  <>
                    <p style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--accent-light)", marginBottom: "10px" }}>Existing Digital Uploads ({sellerBooks.length})</p>
                    <div style={{ display: "grid", gap: "8px", marginBottom: "14px" }}>
                      {sellerBooks.map(book => (
                        <div key={book.id} className={`book-tile${selectedBook?.id === book.id ? " selected" : ""}`} onClick={() => { setSelectedBook(book); setIsNewPhysical(false); }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            <div style={{ width: "34px", height: "34px", background: "var(--surface2)", border: "1px solid var(--card-border)", borderRadius: "6px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><FileText size={14} style={{ color: "var(--accent-light)" }} /></div>
                            <div style={{ flex: 1 }}>
                              <p style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-primary)", margin: "0 0 2px" }}>{book.bookTitle}</p>
                              <p style={{ fontSize: "10px", color: "var(--text-muted)", margin: 0 }}>{book.course || "No course code"}</p>
                            </div>
                            <div style={{ width: "18px", height: "18px", border: `2px solid ${selectedBook?.id === book.id ? "var(--accent)" : "var(--card-border)"}`, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                              {selectedBook?.id === book.id && <div style={{ width: "7px", height: "7px", background: "var(--accent)", borderRadius: "50%" }} />}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
                <div style={{ border: "1px dashed rgba(59,130,246,0.4)", borderRadius: "8px", padding: "14px", cursor: "pointer", background: isNewPhysical ? "var(--accent-glow)" : "transparent", transition: "background 0.2s" }} onClick={() => { setSelectedBook(null); setIsNewPhysical(true); }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <div style={{ width: "34px", height: "34px", background: "var(--accent)", borderRadius: "6px", display: "flex", alignItems: "center", justifyContent: "center" }}><Plus size={15} style={{ color: "#fff" }} /></div>
                    <div>
                      <p style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-primary)", margin: "0 0 1px" }}>New Physical Asset</p>
                      <p style={{ fontSize: "11px", color: "var(--text-muted)", margin: 0 }}>Physical only — no existing digital upload</p>
                    </div>
                  </div>
                </div>
                <div style={{ display: "flex", gap: "10px", marginTop: "18px" }}>
                  <button className="btn-ghost" onClick={() => setStep(1)}>Back</button>
                  <button className="btn-primary" onClick={() => (selectedBook || isNewPhysical) && setStep(3)} disabled={!selectedBook && !isNewPhysical} style={{ flex: 1, justifyContent: "center" }}>Continue →</button>
                </div>
              </div>
            </div>
          )}

          {/* ══════════ STEP 3 ══════════ */}
          {step === 3 && (
            <div className="ci-fade">
              <div style={{ background: "var(--surface)", border: "1px solid var(--card-border)", borderRadius: "8px", padding: "10px 14px", marginBottom: "14px", display: "flex", gap: "18px", flexWrap: "wrap" }}>
                {[{ label: "Seller", val: `${selectedSeller.firstName} ${selectedSeller.surname}` }, { label: "Document", val: isNewPhysical ? "New Physical Asset" : selectedBook.bookTitle }].map(({ label, val }) => (
                  <div key={label} style={{ display: "flex", alignItems: "center", gap: "7px" }}>
                    <CheckCircle size={12} style={{ color: "var(--success)" }} />
                    <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>{label}:</span>
                    <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-primary)", maxWidth: "160px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{val}</span>
                  </div>
                ))}
              </div>
              <div className="ci-card" style={{ padding: "24px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "18px" }}>
                  <div style={{ width: "38px", height: "38px", background: "var(--accent-glow)", border: "1px solid rgba(59,130,246,0.3)", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center" }}><Layers size={17} style={{ color: "var(--accent-light)" }} /></div>
                  <div>
                    <p style={{ fontSize: "9px", fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--accent-light)", margin: 0 }}>Step 3 of 4</p>
                    <h2 style={{ fontFamily: "'Playfair Display',Georgia,serif", fontSize: "18px", fontWeight: 700, color: "var(--text-primary)", margin: "2px 0 0" }}>Consignment Details</h2>
                  </div>
                </div>
                {isNewPhysical && (
                  <div style={{ background: "var(--surface)", border: "1px solid var(--card-border)", borderRadius: "8px", padding: "14px", marginBottom: "16px" }}>
                    <p style={{ fontSize: "9px", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--accent-light)", margin: "0 0 12px" }}>New Physical Asset Info</p>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                      <div style={{ gridColumn: "span 2" }}>
                        <label className="ci-label">Document Title *</label>
                        <input className="ci-input" value={newBookTitle} onChange={e => setNewBookTitle(e.target.value)} placeholder="Full document title" />
                      </div>
                      <div>
                        <label className="ci-label">Course Code</label>
                        <input className="ci-input" value={newCourseCode} onChange={e => setNewCourseCode(e.target.value)} placeholder="e.g. VTE 402" />
                      </div>
                    </div>
                  </div>
                )}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                  <div>
                    <label className="ci-label">Quantity Received *</label>
                    <div style={{ position: "relative" }}>
                      <Package size={13} style={{ position: "absolute", left: "11px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
                      <input type="number" className="ci-input" value={quantity} onChange={e => setQuantity(e.target.value)} placeholder="e.g. 50" min="1" style={{ paddingLeft: "32px" }} />
                    </div>
                    {quantity && parseInt(quantity) > 0 && <p style={{ fontSize: "10px", color: "var(--success)", margin: "4px 0 0" }}>✓ {quantity} copies</p>}
                  </div>
                  <div>
                    <label className="ci-label">Shelf Location</label>
                    <div style={{ position: "relative" }}>
                      <MapPin size={13} style={{ position: "absolute", left: "11px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
                      <input className="ci-input" value={shelfLocation} onChange={e => setShelfLocation(e.target.value)} placeholder="e.g. Aisle 2, Shelf B" style={{ paddingLeft: "32px" }} />
                    </div>
                  </div>
                  <div style={{ gridColumn: "span 2" }}>
                    <label className="ci-label">Admin Notes (optional)</label>
                    <textarea className="ci-input" value={adminNotes} onChange={e => setAdminNotes(e.target.value)} placeholder="Condition, special instructions…" rows={3} style={{ resize: "vertical", display: "block" }} />
                  </div>
                </div>
                {quantity && parseInt(quantity) > 0 && (
                  <div style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)", borderRadius: "8px", padding: "12px 14px", marginTop: "14px" }}>
                    <p style={{ fontSize: "9px", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--success)", margin: "0 0 8px" }}>Stock Preview</p>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <div style={{ flex: 1, height: "6px", background: "var(--surface2)", borderRadius: "4px", overflow: "hidden" }}>
                        <div style={{ width: "100%", height: "100%", background: "var(--success)", borderRadius: "4px" }} />
                      </div>
                      <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--success)", minWidth: "70px", textAlign: "right" }}>{quantity} / {quantity}</span>
                    </div>
                    <p style={{ fontSize: "10px", color: "var(--text-muted)", margin: "5px 0 0" }}>Depletes as students collect copies</p>
                  </div>
                )}
                <div style={{ display: "flex", gap: "10px", marginTop: "18px" }}>
                  <button className="btn-ghost" onClick={() => setStep(2)}>Back</button>
                  <button className="btn-primary" onClick={() => canSubmit && setStep(4)} disabled={!canSubmit} style={{ flex: 1, justifyContent: "center" }}>Review & Confirm →</button>
                </div>
              </div>
            </div>
          )}

          {/* ══════════ STEP 4 ══════════ */}
          {step === 4 && (
            <div className="ci-fade">
              <div className="ci-card" style={{ padding: "24px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "18px" }}>
                  <div style={{ width: "38px", height: "38px", background: "var(--accent-glow)", border: "1px solid rgba(59,130,246,0.3)", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center" }}><Shield size={17} style={{ color: "var(--accent-light)" }} /></div>
                  <div>
                    <p style={{ fontSize: "9px", fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--accent-light)", margin: 0 }}>Step 4 of 4</p>
                    <h2 style={{ fontFamily: "'Playfair Display',Georgia,serif", fontSize: "18px", fontWeight: 700, color: "var(--text-primary)", margin: "2px 0 0" }}>Review & Submit</h2>
                  </div>
                </div>
                <div style={{ background: "var(--surface)", border: "1px solid var(--card-border)", borderRadius: "10px", padding: "18px", marginBottom: "18px" }}>
                  <p style={{ fontSize: "9px", fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--accent-light)", margin: "0 0 12px" }}>Consignment Summary</p>
                  {[
                    ["Asset ID", assetId],
                    ["Seller", `${selectedSeller.firstName} ${selectedSeller.surname}`],
                    ["Document", isNewPhysical ? newBookTitle : selectedBook.bookTitle],
                    ["Course / Ref", isNewPhysical ? (newCourseCode || "—") : (selectedBook.course || "—")],
                    ["Quantity", `${quantity} copies`],
                    ["Shelf", shelfLocation || "To be assigned"],
                  ].map(([k, v]) => (
                    <div key={k} style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", padding: "6px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                      <span style={{ color: "var(--text-muted)" }}>{k}</span>
                      <span style={{ fontWeight: 700, color: k === "Asset ID" ? "var(--goldd)" : "var(--text-primary)", fontFamily: k === "Asset ID" ? "monospace" : "inherit", textAlign: "right", maxWidth: "200px" }}>{v}</span>
                    </div>
                  ))}
                </div>
                <div style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)", borderRadius: "8px", padding: "12px 14px", marginBottom: "18px" }}>
                  <p style={{ fontSize: "9px", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--success)", margin: "0 0 8px" }}>What happens next</p>
                  {[
                    "runTransaction writes to /physicalInventory (restock-aware)",
                    "Seller receives a physical_intake notification instantly",
                    "Receipt + QR sticker generated for book labelling",
                    "Admin notes saved for internal audit trail",
                  ].map((t, i) => (
                    <div key={i} style={{ display: "flex", gap: "7px", marginBottom: "4px" }}>
                      <CheckCircle size={11} style={{ color: "var(--success)", flexShrink: 0, marginTop: "1px" }} />
                      <p style={{ fontSize: "11px", color: "#6ee7b7", margin: 0, lineHeight: 1.6 }}>{t}</p>
                    </div>
                  ))}
                </div>
                <div style={{ display: "flex", gap: "10px" }}>
                  <button className="btn-ghost" onClick={() => setStep(3)}>Back</button>
                  <button className="btn-gold" onClick={handleSubmit} disabled={submitting} style={{ flex: 1, justifyContent: "center", opacity: submitting ? 0.6 : 1 }}>
                    {submitting
                      ? <><Loader2 size={14} style={{ animation: "ciSpin 0.8s linear infinite" }} /> Processing…</>
                      : <><CheckCircle size={14} /> Confirm Check-In</>
                    }
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── Today's Check-ins ── */}
          {recentCheckins.length > 0 && (
            <div style={{ marginTop: "28px" }}>
              <p style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--accent-light)", marginBottom: "10px" }}>Today's Check-ins</p>
              {recentCheckins.map((ci, i) => (
                <div key={i} style={{ background: "var(--card-bg)", border: "1px solid var(--card-border)", borderRadius: "8px", padding: "12px 14px", marginBottom: "8px", display: "flex", alignItems: "center", gap: "10px" }}>
                  <div style={{ width: "7px", height: "7px", borderRadius: "50%", background: ci.isRestock ? "var(--warning)" : "var(--success)", flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-primary)", margin: "0 0 2px" }}>{ci.bookTitle}</p>
                    <p style={{ fontSize: "10px", color: "var(--text-muted)", margin: 0 }}>
                      {ci.sellerName} · {ci.totalConsignment} copies
                      {ci.isRestock && <span style={{ color: "var(--warning)" }}> · RESTOCK</span>}
                    </p>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    {/* Quick sticker reprint */}
                    <button
                      onClick={() => printSticker(ci.assetId, ci.bookTitle)}
                      title="Print sticker"
                      style={{ background: "var(--surface2)", border: "1px solid var(--card-border)", borderRadius: "6px", padding: "4px 8px", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px", color: "var(--text-muted)", fontSize: "10px" }}
                    >
                      <Printer size={11} /> Sticker
                    </button>
                    <div style={{ background: "var(--surface2)", border: "1px solid var(--card-border)", borderRadius: "6px", padding: "2px 8px" }}>
                      <span style={{ fontSize: "10px", fontWeight: 700, color: "var(--goldd)", fontFamily: "monospace" }}>{ci.assetId}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showReceipt && consignmentData && (
        <ConsignmentNote data={consignmentData} onClose={handleReset} onPrint={() => window.print()} />
      )}
    </>
  );
}