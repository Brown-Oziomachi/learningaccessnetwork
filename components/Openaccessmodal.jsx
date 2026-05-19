"use client";
import { useState, useEffect, useRef } from "react";
import {
  X, Download, Clock, CheckCircle, ExternalLink,
  BookOpen, ArrowRight, Library,
} from "lucide-react";
import GoogleAdComponent from "./GoogleAdComponent";
import { doc, getDoc, updateDoc, setDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebaseConfig";

const NAVY = "#0d2244";
const GOLD = "#b8963e";

/**
 * OpenAccessModal — Mobile-first, responsive
 * ───────────────────────────────────────────
 * Props:
 *   isOpen       — boolean
 *   onClose      — () => void
 *   book         — { id, title, author, pdfUrl, embedUrl, driveFileId, ... }
 *   countdownSec — number (default 10)
 *
 * On download it saves the book into the signed-in user's purchasedBooks
 * map in Firestore so it appears on the My Books page automatically.
 */
export default function OpenAccessModal({ isOpen, onClose, book, countdownSec = 10 }) {
  const [timeLeft,    setTimeLeft]    = useState(countdownSec);
  const [ready,       setReady]       = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [downloaded,  setDownloaded]  = useState(false);
  const [saveError,   setSaveError]   = useState(false);
  const timerRef = useRef(null);

  /* ── Reset each time modal opens ── */
  useEffect(() => {
    if (!isOpen) return;
    setTimeLeft(countdownSec);
    setReady(false);
    setDownloading(false);
    setDownloaded(false);
    setSaveError(false);

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) { clearInterval(timerRef.current); setReady(true); return 0; }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [isOpen, countdownSec]);

  if (!isOpen) return null;

  /* ── Resolve best download URL ── */
  const getDownloadUrl = () => {
    if (book?.pdfUrl) {
      if (book.pdfUrl.includes("drive.google.com")) {
        const m = book.pdfUrl.match(/\/d\/([\w-]{25,})|id=([\w-]{25,})/);
        if (m) return `https://drive.google.com/uc?export=download&id=${m[1] || m[2]}`;
      }
      return book.pdfUrl;
    }
    if (book?.driveFileId)
      return `https://drive.google.com/uc?export=download&id=${book.driveFileId}`;
    return null;
  };

  /* ── Save open-access book to Firestore purchasedBooks ──
     This is what makes the book appear on the My Books page.          */
  const saveToMyBooks = async () => {
    try {
      const user = auth.currentUser;
      if (!user || !book) return;

      // Stable key — strip "firestore-" so it is consistent
      const rawId   = book.id || book.firestoreId || "";
      const cleanId = String(rawId).replace("firestore-", "") || `oa-${Date.now()}`;
      const bookKey = `oa_${cleanId}`;   // "oa_" prefix avoids collision with paid books

      const userRef  = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);
      const existing = userSnap.exists() ? (userSnap.data().purchasedBooks || {}) : {};

      if (existing[bookKey]) return;     // already saved — nothing to do

      const entry = {
        bookId       : cleanId,
        id           : rawId || cleanId,
        firestoreId  : cleanId,
        title        : book.title        || "Untitled",
        author       : book.author       || "Unknown Author",
        pages        : book.pages        ?? null,
        format       : book.format       || "PDF",
        category     : book.category     || "",
        description  : book.description  || "",
        pdfUrl       : book.pdfUrl       || null,
        embedUrl     : book.embedUrl     || null,
        driveFileId  : book.driveFileId  || null,
        coverImage   : book.coverImage   || book.image || null,
        price        : 0,
        isFree       : true,
        accessType   : "free",
        isOpenAccess : true,
        purchaseDate : new Date().toISOString(),
        transactionId: `free-${cleanId}-${Date.now()}`,
        amount       : 0,
        sellerName   : book.sellerName   || "LAN Library",
      };

      if (userSnap.exists()) {
        await updateDoc(userRef, { [`purchasedBooks.${bookKey}`]: entry });
      } else {
        await setDoc(userRef, { purchasedBooks: { [bookKey]: entry } }, { merge: true });
      }
    } catch (err) {
      console.warn("OpenAccessModal: could not save to My Books:", err);
      setSaveError(true);    // non-blocking — download still succeeds
    }
  };

  /* ── Handle download click ── */
  const handleDownload = async () => {
    if (!ready) return;
    const url = getDownloadUrl();
    if (!url) return;

    setDownloading(true);

    // Trigger browser download — straight to device, no new tab
    const a = document.createElement("a");
    a.href = url;
    a.download = `${book?.title || "document"}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    // Save to Firestore in background (non-blocking for UX)
    await saveToMyBooks();

    setTimeout(() => { setDownloading(false); setDownloaded(true); }, 1200);
  };

  /* ── Progress arc maths ── */
  const progress      = ((countdownSec - timeLeft) / countdownSec) * 100;
  const radius        = 26;
  const circumference = 2 * Math.PI * radius;
  const strokeDash    = (progress / 100) * circumference;

  /* ══════════════════════════════════════════════════════════ */
  return (
    <>
      <style>{`
        @keyframes oa-fadeIn  { from{opacity:0} to{opacity:1} }
        @keyframes oa-slideUp { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
        @keyframes oa-pulse-ring {
          0%   { box-shadow:0 0 0 0    rgba(184,150,62,0.45); }
          70%  { box-shadow:0 0 0 14px rgba(184,150,62,0);    }
          100% { box-shadow:0 0 0 0    rgba(184,150,62,0);    }
        }
        @keyframes oa-spin { to{transform:rotate(360deg)} }
        @keyframes oa-pop {
          0%   { transform:scale(0.7); opacity:0; }
          60%  { transform:scale(1.1); opacity:1; }
          100% { transform:scale(1);   opacity:1; }
        }
        .oa-overlay  { animation:oa-fadeIn  0.22s ease both; }
        .oa-card     { animation:oa-slideUp 0.28s cubic-bezier(0.4,0,0.2,1) both; }
        .oa-pulse    { animation:oa-pulse-ring 1.6s ease-out infinite; }
        .oa-spinner  { animation:oa-spin 0.7s linear infinite; }
        .oa-pop-ico  { animation:oa-pop 0.45s cubic-bezier(0.34,1.56,0.64,1) both; }
        .oa-dl-btn {
          width:100%; padding:15px; border:none; cursor:pointer;
          font-size:13px; font-weight:700; letter-spacing:0.06em;
          font-family:'Lato',sans-serif;
          display:flex; align-items:center; justify-content:center; gap:8px;
          transition:background 0.25s, color 0.25s, transform 0.15s;
          box-sizing:border-box;
        }
        .oa-dl-btn:active { transform:scale(0.98); }
        /* ── Mobile (<= 480 px) ── */
        @media (max-width:480px) {
          .oa-card-body   { padding:14px !important; }
          .oa-hdr         { padding:13px 14px !important; }
          .oa-ftr         { padding:8px 14px !important; }
          .oa-h1          { font-size:15px !important; }
          .oa-sub         { font-size:11px !important; }
          .oa-ring-row    { flex-direction:column !important; align-items:center !important; gap:10px !important; }
          .oa-ring-copy   { text-align:center !important; width:100%; }
        }
      `}</style>

      {/* ── Overlay ── */}
      <div
        className="oa-overlay"
        onClick={onClose}
        style={{
          position:"fixed", inset:0,
          background:"rgba(5,12,28,0.88)",
          zIndex:200,
          display:"flex", alignItems:"center", justifyContent:"center",
          padding:"12px", overflowY:"auto",
        }}
      >
        {/* ── Card ── */}
        <div
          className="oa-card"
          onClick={(e) => e.stopPropagation()}
          style={{
            background:NAVY, width:"100%", maxWidth:"460px",
            overflow:"hidden", margin:"auto",
            border:"0.5px solid rgba(184,150,62,0.25)",
          }}
        >
          {/* ══ HEADER ══ */}
          <div
            className="oa-hdr"
            style={{
              background:"rgba(0,0,0,0.28)", padding:"16px 20px",
              display:"flex", alignItems:"center", justifyContent:"space-between",
              borderBottom:"0.5px solid rgba(255,255,255,0.08)",
            }}
          >
            <div>
              <p style={{
                fontSize:"9px", fontWeight:700, letterSpacing:"0.18em",
                textTransform:"uppercase", color:GOLD,
                margin:"0 0 3px", fontFamily:"'Lato',sans-serif",
              }}>
                {downloaded ? "Saved to My Books" : "Open Access"}
              </p>
              <p
                className="oa-h1"
                style={{ fontFamily:"'Playfair Display',serif", fontSize:"17px", fontWeight:700, color:"#fff", margin:0 }}
              >
                {downloaded ? "Book Added to My Library!" : "Preparing Your Download"}
              </p>
            </div>
            <button
              onClick={onClose}
              style={{ background:"transparent", border:"none", cursor:"pointer", color:"rgba(255,255,255,0.45)", padding:"4px", flexShrink:0 }}
            >
              <X size={18} />
            </button>
          </div>

          {/* ══ BODY ══ */}
          <div className="oa-card-body" style={{ padding:"20px" }}>

            {/* ─────────── SUCCESS STATE ─────────── */}
            {downloaded ? (
              <div style={{ textAlign:"center" }}>

                {/* Animated check circle */}
                <div style={{ display:"flex", justifyContent:"center", marginBottom:"16px" }}>
                  <div
                    className="oa-pop-ico"
                    style={{
                      width:"72px", height:"72px", borderRadius:"50%",
                      background:"rgba(22,163,74,0.12)",
                      border:"2px solid rgba(22,163,74,0.5)",
                      display:"flex", alignItems:"center", justifyContent:"center",
                    }}
                  >
                    <CheckCircle size={34} style={{ color:"#22c55e" }} />
                  </div>
                </div>

                {/* Book title pill */}
                {book?.title && (
                  <div style={{
                    display:"flex", alignItems:"center", gap:"8px",
                    background:"rgba(255,255,255,0.05)",
                    border:"0.5px solid rgba(255,255,255,0.1)",
                    padding:"10px 14px", marginBottom:"14px", textAlign:"left",
                  }}>
                    <CheckCircle size={13} style={{ color:GOLD, flexShrink:0 }} />
                    <p style={{
                      fontSize:"12px", color:"rgba(255,255,255,0.8)",
                      margin:0, fontFamily:"'Lato',sans-serif", fontWeight:700,
                      overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap",
                    }}>
                      {book.title}
                    </p>
                  </div>
                )}

                {/* ── "Added to My Books" green box ── */}
                <div style={{
                  background:"rgba(22,163,74,0.08)",
                  border:"0.5px solid rgba(22,163,74,0.3)",
                  padding:"14px 16px", marginBottom:"14px", textAlign:"left",
                }}>
                  <p style={{
                    fontSize:"12px", fontWeight:700, color:"#86efac",
                    fontFamily:"'Lato',sans-serif", margin:"0 0 5px",
                  }}>
                    ✓ Added to My Books
                  </p>
                  <p className="oa-sub" style={{
                    fontSize:"12px", color:"rgba(255,255,255,0.5)",
                    fontFamily:"'Lato',sans-serif", margin:0, lineHeight:1.65,
                  }}>
                    This book is now in your{" "}
                    <span style={{ color:"#86efac", fontWeight:700 }}>My Books library</span>.
                    {" "}Your PDF is also downloading to your device. You can read the book
                    online anytime — no re-download needed.
                  </p>
                </div>

                {/* Save-error warning (non-blocking) */}
                {saveError && (
                  <div style={{
                    background:"rgba(251,191,36,0.08)",
                    border:"0.5px solid rgba(251,191,36,0.3)",
                    padding:"10px 12px", marginBottom:"14px",
                    display:"flex", alignItems:"flex-start", gap:"8px", textAlign:"left",
                  }}>
                    <span style={{ color:"#fbbf24", fontSize:"14px", flexShrink:0, lineHeight:1 }}>⚠</span>
                    <p style={{
                      fontSize:"11px", color:"rgba(255,255,255,0.45)",
                      fontFamily:"'Lato',sans-serif", margin:0, lineHeight:1.6,
                    }}>
                      Couldn&apos;t auto-add to My Books — try signing in again.
                      Your PDF download is unaffected.
                    </p>
                  </div>
                )}

                <div style={{ height:"0.5px", background:"rgba(255,255,255,0.08)", marginBottom:"14px" }} />

                {/* Primary CTA → My Books */}
                <a
                  href="/my-books"
                  style={{
                    display:"flex", alignItems:"center", justifyContent:"center", gap:"8px",
                    width:"100%", padding:"14px",
                    background:GOLD, color:NAVY,
                    fontSize:"13px", fontWeight:700,
                    fontFamily:"'Lato',sans-serif", letterSpacing:"0.06em",
                    textDecoration:"none", boxSizing:"border-box",
                    transition:"background 0.2s",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "#d4aa5a")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = GOLD)}
                >
                  <Library size={15} />
                  View in My Books Library
                  <ArrowRight size={13} />
                </a>

                {/* Secondary — close */}
                <button
                  onClick={onClose}
                  style={{
                    display:"flex", alignItems:"center", justifyContent:"center", gap:"6px",
                    width:"100%", marginTop:"10px", padding:"12px",
                    background:"transparent",
                    border:"0.5px solid rgba(255,255,255,0.15)",
                    color:"rgba(255,255,255,0.45)",
                    fontSize:"12px", fontWeight:700,
                    fontFamily:"'Lato',sans-serif", letterSpacing:"0.04em",
                    cursor:"pointer", boxSizing:"border-box",
                  }}
                >
                  <X size={12} />
                  Close &amp; Continue Reading
                </button>

                <p style={{
                  fontSize:"10px", color:"rgba(255,255,255,0.18)",
                  fontFamily:"'Lato',sans-serif", marginTop:"14px", lineHeight:1.6,
                }}>
                  All open-access &amp; purchased books always appear in My Books.
                </p>
              </div>

            ) : (
              /* ─────────── COUNTDOWN + AD STATE ─────────── */
              <>
                {/* Book title pill */}
                {book?.title && (
                  <div style={{
                    display:"flex", alignItems:"center", gap:"10px",
                    background:"rgba(255,255,255,0.05)",
                    border:"0.5px solid rgba(255,255,255,0.1)",
                    padding:"10px 14px", marginBottom:"16px",
                  }}>
                    <CheckCircle size={14} style={{ color:GOLD, flexShrink:0 }} />
                    <p style={{
                      fontSize:"12px", color:"rgba(255,255,255,0.75)",
                      margin:0, fontFamily:"'Lato',sans-serif", fontWeight:700,
                      overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap",
                    }}>
                      {book.title}
                    </p>
                  </div>
                )}

                {/* Support note */}
                <p
                  className="oa-sub"
                  style={{
                    fontSize:"12px", color:"rgba(255,255,255,0.5)",
                    lineHeight:1.7, fontFamily:"'Lato',sans-serif",
                    marginBottom:"16px", textAlign:"center",
                  }}
                >
                  Your open-access download is preparing.
                  <br />
                  <span style={{ color:"rgba(255,255,255,0.3)", fontSize:"11px" }}>
                    Please support LAN Library by viewing the sponsor message.
                    {!ready && ` Download unlocks in ${timeLeft}s.`}
                  </span>
                </p>

                {/* Ad slot */}
                <div style={{
                  border:"0.5px solid rgba(255,255,255,0.07)",
                  background:"rgba(255,255,255,0.02)", minHeight:"80px",
                }}>
                  <GoogleAdComponent />
                </div>

                {/* Countdown ring row */}
                <div
                  className="oa-ring-row"
                  style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:"18px", margin:"20px 0" }}
                >
                  <div
                    className={`oa-ring-wrap${!ready ? " oa-pulse" : ""}`}
                    style={{ position:"relative", width:"68px", height:"68px", flexShrink:0, borderRadius:"50%" }}
                  >
                    <svg width="68" height="68" viewBox="0 0 68 68" style={{ transform:"rotate(-90deg)" }}>
                      <circle cx="34" cy="34" r={radius} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="4" />
                      <circle
                        cx="34" cy="34" r={radius} fill="none"
                        stroke={ready ? "#22c55e" : GOLD}
                        strokeWidth="4" strokeLinecap="round"
                        strokeDasharray={`${strokeDash} ${circumference}`}
                        style={{ transition:"stroke-dasharray 0.9s linear, stroke 0.3s" }}
                      />
                    </svg>
                    <div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center" }}>
                      {ready
                        ? <CheckCircle size={22} style={{ color:"#22c55e" }} />
                        : <span style={{ fontFamily:"'Playfair Display',serif", fontSize:"18px", fontWeight:700, color:"#fff" }}>{timeLeft}</span>
                      }
                    </div>
                  </div>

                  <div className="oa-ring-copy">
                    {ready ? (
                      <>
                        <p style={{ fontSize:"13px", fontWeight:700, color:"#86efac", fontFamily:"'Lato',sans-serif", margin:"0 0 2px" }}>
                          Download Ready!
                        </p>
                        <p style={{ fontSize:"11px", color:"rgba(255,255,255,0.4)", fontFamily:"'Lato',sans-serif", margin:0 }}>
                          Tap below — also saves to My Books
                        </p>
                      </>
                    ) : (
                      <>
                        <p style={{ fontSize:"12px", fontWeight:700, color:"rgba(255,255,255,0.6)", fontFamily:"'Lato',sans-serif", margin:"0 0 2px" }}>
                          <Clock size={11} style={{ marginRight:"5px", verticalAlign:"middle", color:GOLD }} />
                          Please wait… {timeLeft}s
                        </p>
                        <p style={{ fontSize:"11px", color:"rgba(255,255,255,0.3)", fontFamily:"'Lato',sans-serif", margin:0 }}>
                          Preparing your file
                        </p>
                      </>
                    )}
                  </div>
                </div>

                {/* Download button */}
                <button
                  className="oa-dl-btn"
                  onClick={handleDownload}
                  disabled={!ready || downloading}
                  style={{
                    background: ready ? GOLD : "rgba(255,255,255,0.06)",
                    border:     ready ? "none" : "0.5px solid rgba(255,255,255,0.12)",
                    color:      ready ? NAVY  : "rgba(255,255,255,0.3)",
                    cursor:     ready ? "pointer" : "not-allowed",
                  }}
                >
                  {downloading ? (
                    <>
                      <div className="oa-spinner" style={{ width:"14px", height:"14px", border:`2px solid ${NAVY}`, borderTopColor:"transparent", borderRadius:"50%" }} />
                      Saving to My Books…
                    </>
                  ) : ready ? (
                    <><Download size={15} /> Download &amp; Save to My Books</>
                  ) : (
                    <><Clock size={14} /> Waiting… ({timeLeft}s)</>
                  )}
                </button>

                {/* My Library quiet link */}
                <div style={{ marginTop:"14px", textAlign:"center", paddingTop:"12px", borderTop:"0.5px solid rgba(255,255,255,0.06)" }}>
                  <a
                    href="/my-books"
                    style={{
                      display:"inline-flex", alignItems:"center", gap:"5px",
                      fontSize:"11px", color:"rgba(255,255,255,0.3)",
                      fontFamily:"'Lato',sans-serif", textDecoration:"none",
                      transition:"color 0.18s",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = GOLD)}
                    onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.3)")}
                  >
                    <BookOpen size={11} />
                    View all your books in My Library
                    <ArrowRight size={10} />
                  </a>
                </div>
              </>
            )}
          </div>

          {/* ══ FOOTER ══ */}
          {!downloaded && (
            <div
              className="oa-ftr"
              style={{
                background:"rgba(0,0,0,0.2)", padding:"10px 20px",
                borderTop:"0.5px solid rgba(255,255,255,0.06)",
                display:"flex", alignItems:"center", gap:"6px",
              }}
            >
              <ExternalLink size={10} style={{ color:"rgba(255,255,255,0.2)", flexShrink:0 }} />
              <p style={{ fontSize:"10px", color:"rgba(255,255,255,0.2)", margin:0, fontFamily:"'Lato',sans-serif", lineHeight:1.5 }}>
                Free documents are hosted via LAN Library&apos;s Open Access programme.
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}