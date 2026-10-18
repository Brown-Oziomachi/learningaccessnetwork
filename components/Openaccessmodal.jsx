"use client";
import { useState, useEffect, useRef } from "react";
import {
  X,
  Download,
  CheckCircle,
  BookOpen,
  ArrowRight,
  Library,
  ShieldCheck,
  FileText,
} from "lucide-react";
import GoogleAdComponent from "./GoogleAdComponent";
import { doc, getDoc, updateDoc, setDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebaseConfig";

const NAVY = "#0d2244";
const GOLD = "#b8963e";
const CREAM = "#f5f0e8";
const LINE = "#e5ddd0";

/**
 * OpenAccessModal
 * Props: isOpen, onClose, book, countdownSec (default 10)
 * Shows a clearly labelled ad slot, a short countdown, then downloads the PDF
 * and saves the book into users/{uid}.purchasedBooks (key "oa_<id>").
 * Desktop: centred card. Mobile: bottom sheet that scrolls inside itself.
 */
export default function OpenAccessModal({
  isOpen,
  onClose,
  book,
  countdownSec = 10,
}) {
  const [timeLeft, setTimeLeft] = useState(countdownSec);
  const [downloading, setDownloading] = useState(false);
  const [downloaded, setDownloaded] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const closeTimer = useRef(null);

  const ready = timeLeft <= 0;

  /* ── Reset and start the countdown each time the modal opens ── */
  useEffect(() => {
    if (!isOpen) return;
    setTimeLeft(countdownSec);
    setDownloading(false);
    setDownloaded(false);
    setSaveError(false);
    const id = setInterval(() => setTimeLeft((t) => (t > 0 ? t - 1 : 0)), 1000);
    return () => clearInterval(id);
  }, [isOpen, countdownSec]);

  /* ── Esc closes, page behind stops scrolling ── */
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [isOpen, onClose]);

  useEffect(() => () => clearTimeout(closeTimer.current), []);

  if (!isOpen) return null;

  /* ── Best download URL ── */
  const getDownloadUrl = () => {
    if (book?.pdfUrl) {
      if (book.pdfUrl.includes("drive.google.com")) {
        const m = book.pdfUrl.match(/\/d\/([\w-]{25,})|id=([\w-]{25,})/);
        if (m)
          return `https://drive.google.com/uc?export=download&id=${m[1] || m[2]}`;
      }
      return book.pdfUrl;
    }
    if (book?.driveFileId)
      return `https://drive.google.com/uc?export=download&id=${book.driveFileId}`;
    return null;
  };

  /* ── Save to Firestore so it shows in My Books ── */
  const saveToMyBooks = async () => {
    try {
      const user = auth.currentUser;
      if (!user || !book) return;

      const rawId = book.id || book.firestoreId || "";
      const cleanId =
        String(rawId).replace("firestore-", "") || `oa-${Date.now()}`;
      const bookKey = `oa_${cleanId}`;

      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);
      const existing = userSnap.exists()
        ? userSnap.data().purchasedBooks || {}
        : {};
      if (existing[bookKey]) return;

      const entry = {
        bookId: cleanId,
        id: rawId || cleanId,
        firestoreId: cleanId,
        title: book.title || "Untitled",
        author: book.author || "Unknown Author",
        pages: book.pages ?? null,
        format: book.format || "PDF",
        category: book.category || "",
        description: book.description || "",
        pdfUrl: book.pdfUrl || null,
        embedUrl: book.embedUrl || null,
        driveFileId: book.driveFileId || null,
        coverImage: book.coverImage || book.image || null,
        price: 0,
        isFree: true,
        accessType: "free",
        isOpenAccess: true,
        purchaseDate: new Date().toISOString(),
        transactionId: `free-${cleanId}-${Date.now()}`,
        amount: 0,
        sellerName: book.sellerName || "LAN Library",
      };

      if (userSnap.exists()) {
        await updateDoc(userRef, { [`purchasedBooks.${bookKey}`]: entry });
      } else {
        await setDoc(
          userRef,
          { purchasedBooks: { [bookKey]: entry } },
          { merge: true },
        );
      }
    } catch (err) {
      console.warn("OpenAccessModal: could not save to My Books:", err);
      setSaveError(true);
    }
  };

  /* ── Download + save ── */
  const handleDownload = async () => {
    if (!ready || downloading) return;
    const url = getDownloadUrl();
    setDownloading(true);

    if (url) {
      const a = document.createElement("a");
      a.href = url;
      a.download = `${book?.title || "document"}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }

    await saveToMyBooks();
    closeTimer.current = setTimeout(() => {
      setDownloading(false);
      setDownloaded(true);
    }, 900);
  };

  const pct = Math.min(100, ((countdownSec - timeLeft) / countdownSec) * 100);

  return (
    <>
      <style>{`
        @keyframes oa-fade { from{opacity:0} to{opacity:1} }
        @keyframes oa-up { from{opacity:0;transform:translateY(28px)} to{opacity:1;transform:translateY(0)} }
        @keyframes oa-pop { 0%{transform:scale(.7);opacity:0} 60%{transform:scale(1.1);opacity:1} 100%{transform:scale(1);opacity:1} }
        @keyframes oa-spin { to{transform:rotate(360deg)} }

        .oa-overlay { position:fixed; inset:0; z-index:200; background:rgba(13,34,68,.72); display:flex; align-items:center; justify-content:center; padding:16px; animation:oa-fade .2s ease both; }
        .oa-sheet { width:100%; max-width:480px; max-height:min(92vh, 760px); max-height:min(92dvh, 760px); display:flex; flex-direction:column; background:#fff; border-top:3px solid ${GOLD}; box-shadow:0 28px 70px rgba(0,0,0,.4); animation:oa-up .26s cubic-bezier(.4,0,.2,1) both; overflow:hidden; }
        .oa-head { background:${NAVY}; padding:14px 16px; display:flex; align-items:center; justify-content:space-between; gap:12px; flex-shrink:0; }
        .oa-scroll { overflow-y:auto; overscroll-behavior:contain; padding:16px; flex:1; min-height:0; -webkit-overflow-scrolling:touch; }
        .oa-eyebrow { font-family:'Lato',sans-serif; font-size:9px; font-weight:700; letter-spacing:.18em; text-transform:uppercase; color:${GOLD}; margin:0 0 2px; }
        .oa-title { font-family:'Playfair Display',serif; font-size:17px; font-weight:700; color:#fff; margin:0; line-height:1.25; }
        .oa-x { width:32px; height:32px; flex-shrink:0; display:flex; align-items:center; justify-content:center; background:transparent; border:.5px solid rgba(255,255,255,.25); color:rgba(255,255,255,.8); cursor:pointer; }
        .oa-x:hover { background:rgba(255,255,255,.08); }

        .oa-doc { display:flex; align-items:center; gap:10px; padding:10px 12px; background:${CREAM}; border:.5px solid ${LINE}; margin-bottom:14px; }
        .oa-doc-ico { width:34px; height:34px; flex-shrink:0; background:${NAVY}; display:flex; align-items:center; justify-content:center; }
        .oa-doc-t { font-family:'Lato',sans-serif; font-size:13px; font-weight:700; color:${NAVY}; margin:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
        .oa-doc-s { font-family:'Lato',sans-serif; font-size:11px; color:#888; margin:1px 0 0; }

        .oa-adwrap { border:1px solid ${LINE}; background:#fff; }
        .oa-adbar { display:flex; align-items:center; justify-content:space-between; padding:6px 10px; border-bottom:1px solid #f0ebe0; background:#fafaf8; }
        .oa-adlabel { font-family:'Lato',sans-serif; font-size:10px; font-weight:700; letter-spacing:.1em; text-transform:uppercase; color:#8a8a8a; }
        .oa-adbody { min-height:250px; display:flex; align-items:center; justify-content:center; padding:10px; overflow:hidden; background:#fff; }
        .oa-adbody > * { max-width:100%; }

        .oa-note { display:flex; align-items:center; gap:7px; font-family:'Lato',sans-serif; font-size:11px; color:#777; margin:12px 0 0; line-height:1.5; }

        .oa-foot { flex-shrink:0; padding:14px 16px 16px; border-top:1px solid ${LINE}; background:#fff; }
        .oa-btn { position:relative; width:100%; overflow:hidden; display:flex; align-items:center; justify-content:center; gap:8px; padding:15px 16px; border:none; font-family:'Lato',sans-serif; font-size:13px; font-weight:700; letter-spacing:.05em; text-transform:uppercase; transition:background .2s, color .2s, transform .12s; }
        .oa-btn.wait { background:#ece6d8; color:#8a8170; cursor:not-allowed; }
        .oa-btn.go { background:${NAVY}; color:${GOLD}; cursor:pointer; }
        .oa-btn.go:hover { background:#17325f; }
        .oa-btn.go:active { transform:scale(.99); }
        .oa-fill { position:absolute; left:0; top:0; bottom:0; background:rgba(184,150,62,.28); transition:width 1s linear; }
        .oa-btn > span, .oa-btn > svg, .oa-btn > div { position:relative; z-index:1; }
        .oa-spin { width:14px; height:14px; border:2px solid ${GOLD}; border-top-color:transparent; border-radius:50%; animation:oa-spin .7s linear infinite; }
        .oa-link { display:flex; align-items:center; justify-content:center; gap:6px; margin-top:10px; font-family:'Lato',sans-serif; font-size:12px; font-weight:700; color:#8a8a8a; text-decoration:none; padding:6px; }
        .oa-link:hover { color:${NAVY}; }

        .oa-ok { text-align:center; padding:8px 0 4px; }
        .oa-okring { width:72px; height:72px; border-radius:50%; background:rgba(22,163,74,.1); border:2px solid rgba(22,163,74,.45); display:flex; align-items:center; justify-content:center; margin:0 auto 14px; animation:oa-pop .45s cubic-bezier(.34,1.56,.64,1) both; }
        .oa-okbox { text-align:left; background:rgba(22,163,74,.07); border:.5px solid rgba(22,163,74,.3); padding:12px 14px; margin:14px 0; }
        .oa-primary { display:flex; align-items:center; justify-content:center; gap:8px; width:100%; padding:14px; background:${NAVY}; color:${GOLD}; font-family:'Lato',sans-serif; font-size:13px; font-weight:700; letter-spacing:.05em; text-decoration:none; text-transform:uppercase; }
        .oa-primary:hover { background:#17325f; }
        .oa-ghost { width:100%; margin-top:10px; padding:12px; background:transparent; border:.5px solid ${LINE}; color:#777; font-family:'Lato',sans-serif; font-size:12px; font-weight:700; cursor:pointer; }
        .oa-ghost:hover { background:${CREAM}; }

        @media (max-width:560px) {
          .oa-overlay { padding:0; align-items:flex-end; }
          .oa-sheet { max-width:none; max-height:94vh; max-height:94dvh; border-radius:16px 16px 0 0; }
          .oa-scroll { padding:14px; }
          .oa-foot { padding:12px 14px calc(14px + env(safe-area-inset-bottom)); }
          .oa-title { font-size:16px; }
          .oa-adbody { min-height:250px; padding:6px; }
        }
        @media (prefers-reduced-motion: reduce) {
          .oa-overlay, .oa-sheet, .oa-okring { animation:none; }
          .oa-fill { transition:none; }
        }
      `}</style>

      <div
        className="oa-overlay"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose?.();
        }}
      >
        <div
          className="oa-sheet"
          role="dialog"
          aria-modal="true"
          aria-label="Open access download"
        >
          <div className="oa-head">
            <div style={{ minWidth: 0 }}>
              <p className="oa-eyebrow">
                {downloaded ? "Saved to My Books" : "Open Access"}
              </p>
              <p className="oa-title">
                {downloaded
                  ? "Added to your library"
                  : "Your free document is almost ready"}
              </p>
            </div>
            <button className="oa-x" onClick={onClose} aria-label="Close">
              <X size={16} />
            </button>
          </div>

          {downloaded ? (
            <div className="oa-scroll">
              <div className="oa-ok">
                <div className="oa-okring">
                  <CheckCircle size={34} style={{ color: "#16a34a" }} />
                </div>

                {book?.title && (
                  <div className="oa-doc" style={{ textAlign: "left" }}>
                    <div className="oa-doc-ico">
                      <FileText size={16} style={{ color: GOLD }} />
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <p className="oa-doc-t">{book.title}</p>
                      <p className="oa-doc-s">{book.author || "LAN Library"}</p>
                    </div>
                  </div>
                )}

                <div className="oa-okbox">
                  <p
                    style={{
                      fontFamily: "'Lato',sans-serif",
                      fontSize: 12,
                      fontWeight: 700,
                      color: "#15803d",
                      margin: "0 0 4px",
                    }}
                  >
                    Added to My Books
                  </p>
                  <p
                    style={{
                      fontFamily: "'Lato',sans-serif",
                      fontSize: 12,
                      color: "#555",
                      margin: 0,
                      lineHeight: 1.65,
                    }}
                  >
                    This document is now in your library, and the PDF is
                    downloading to your device. You can read it online any time
                    without downloading again.
                  </p>
                </div>

                {saveError && (
                  <div
                    style={{
                      textAlign: "left",
                      background: "#fffbeb",
                      border: ".5px solid #fde68a",
                      padding: "10px 12px",
                      marginBottom: 14,
                    }}
                  >
                    <p
                      style={{
                        fontFamily: "'Lato',sans-serif",
                        fontSize: 11,
                        color: "#92400e",
                        margin: 0,
                        lineHeight: 1.6,
                      }}
                    >
                      We couldn&apos;t add it to My Books automatically. Try
                      signing in again. Your PDF download is not affected.
                    </p>
                  </div>
                )}

                <a href="/my-books" className="oa-primary">
                  <Library size={15} /> View in My Books{" "}
                  <ArrowRight size={13} />
                </a>
                <button className="oa-ghost" onClick={onClose}>
                  Close and keep reading
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="oa-scroll">
                {book?.title && (
                  <div className="oa-doc">
                    <div className="oa-doc-ico">
                      <FileText size={16} style={{ color: GOLD }} />
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <p className="oa-doc-t">{book.title}</p>
                      <p className="oa-doc-s">
                        {book.author ? `by ${book.author}` : "Free document"}
                        {book.pages ? ` · ${book.pages} pages` : ""}
                      </p>
                    </div>
                  </div>
                )}

                <div className="oa-adwrap">
                  <div className="oa-adbar">
                    <span className="oa-adlabel">Advertisement</span>
                  </div>
                  <div className="oa-adbody">
                    <GoogleAdComponent />
                  </div>
                </div>

                <p className="oa-note">
                  <ShieldCheck
                    size={13}
                    style={{ color: GOLD, flexShrink: 0 }}
                  />
                  <span>Ads keep LAN Library free for every student.</span>
                </p>
              </div>

              <div className="oa-foot">
                <button
                  className={`oa-btn ${ready ? "go" : "wait"}`}
                  onClick={handleDownload}
                  disabled={!ready || downloading}
                >
                  {!ready && (
                    <div className="oa-fill" style={{ width: `${pct}%` }} />
                  )}
                  {downloading ? (
                    <>
                      <div className="oa-spin" />
                      <span>Saving to My Books</span>
                    </>
                  ) : ready ? (
                    <>
                      <Download size={15} />
                      <span>Download and save to My Books</span>
                    </>
                  ) : (
                    <span>Download available in {timeLeft}s</span>
                  )}
                </button>
                <a href="/my-books" className="oa-link">
                  <BookOpen size={12} /> Go to My Books
                </a>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
