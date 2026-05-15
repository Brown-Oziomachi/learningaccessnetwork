"use client";
import { useState, useEffect, useRef } from "react";
import { X, Download, Clock, CheckCircle, ExternalLink } from "lucide-react";
import GoogleAdComponent from "./GoogleAdComponent";

const NAVY = "#0d2244";
const GOLD  = "#b8963e";

/**
 * OpenAccessModal
 * ───────────────
 * Props:
 *   isOpen       — boolean
 *   onClose      — () => void
 *   book         — { title, author, pdfUrl, embedUrl, driveFileId }
 *   countdownSec — number (default 10)
 */
export default function OpenAccessModal({
  isOpen,
  onClose,
  book,
  countdownSec = 10,
}) {
  const [timeLeft, setTimeLeft]       = useState(countdownSec);
  const [ready, setReady]             = useState(false);
  const [downloading, setDownloading] = useState(false);
  const timerRef = useRef(null);

  /* Reset every time the modal opens */
  useEffect(() => {
    if (!isOpen) return;
    setTimeLeft(countdownSec);
    setReady(false);
    setDownloading(false);

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          setReady(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [isOpen, countdownSec]);

  if (!isOpen) return null;

  /* ── Resolve the best download URL ── */
  const getDownloadUrl = () => {
    if (book?.pdfUrl) {
      if (book.pdfUrl.includes("drive.google.com")) {
        const m = book.pdfUrl.match(/\/d\/([\w-]{25,})|id=([\w-]{25,})/);
        if (m) {
          const fileId = m[1] || m[2];
          return `https://drive.google.com/uc?export=download&id=${fileId}`;
        }
      }
      return book.pdfUrl;
    }
    if (book?.driveFileId) {
      return `https://drive.google.com/uc?export=download&id=${book.driveFileId}`;
    }
    return null;
  };

  const handleDownload = () => {
    if (!ready) return;
    const url = getDownloadUrl();
    if (!url) return;

    setDownloading(true);
    const a = document.createElement("a");
    a.href = url;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    a.download = `${book?.title || "document"}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    setTimeout(() => {
      setDownloading(false);
      onClose();
    }, 1500);
  };

  /* Progress arc */
  const progress      = ((countdownSec - timeLeft) / countdownSec) * 100;
  const radius        = 26;
  const circumference = 2 * Math.PI * radius;
  const strokeDash    = (progress / 100) * circumference;

  return (
    <>
      <style>{`
        @keyframes oa-fadeIn  { from{opacity:0}                        to{opacity:1}                     }
        @keyframes oa-slideUp { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
        @keyframes oa-pulse-ring {
          0%   { box-shadow:0 0 0 0    rgba(184,150,62,0.45); }
          70%  { box-shadow:0 0 0 14px rgba(184,150,62,0);    }
          100% { box-shadow:0 0 0 0    rgba(184,150,62,0);    }
        }
        @keyframes oa-spin { to{transform:rotate(360deg)} }
        .oa-overlay   { animation:oa-fadeIn  0.22s ease both; }
        .oa-card      { animation:oa-slideUp 0.28s cubic-bezier(0.4,0,0.2,1) both; }
        .oa-pulse     { animation:oa-pulse-ring 1.6s ease-out infinite; }
        .oa-spinner   { animation:oa-spin 0.7s linear infinite; }
      `}</style>

      {/* ── Overlay ── */}
      <div
        className="oa-overlay"
        onClick={onClose}
        style={{
          position:"fixed", inset:0,
          background:"rgba(5,12,28,0.82)",
          zIndex:200,
          display:"flex", alignItems:"center", justifyContent:"center",
          padding:"16px",
        }}
      >
        {/* ── Card ── */}
        <div
          className="oa-card"
          onClick={(e) => e.stopPropagation()}
          style={{
            background:NAVY,
            width:"100%", maxWidth:"460px",
            overflow:"hidden",
            border:`0.5px solid rgba(184,150,62,0.25)`,
          }}
        >
          {/* ── Header ── */}
          <div style={{
            background:"rgba(0,0,0,0.25)",
            padding:"18px 22px",
            display:"flex", alignItems:"center", justifyContent:"space-between",
            borderBottom:"0.5px solid rgba(255,255,255,0.08)",
          }}>
            <div>
              <p style={{
                fontSize:"9px", fontWeight:700, letterSpacing:"0.18em",
                textTransform:"uppercase", color:GOLD,
                margin:"0 0 3px", fontFamily:"'Lato',sans-serif",
              }}>Open Access</p>
              <p style={{
                fontFamily:"'Playfair Display',serif",
                fontSize:"17px", fontWeight:700, color:"#fff", margin:0,
              }}>Preparing Your Download</p>
            </div>
            <button onClick={onClose} style={{
              background:"transparent", border:"none",
              cursor:"pointer", color:"rgba(255,255,255,0.45)", padding:"4px",
            }}>
              <X size={18} />
            </button>
          </div>

          {/* ── Body ── */}
          <div style={{ padding:"24px" }}>

            {/* Book title pill */}
            {book?.title && (
              <div style={{
                display:"flex", alignItems:"center", gap:"10px",
                background:"rgba(255,255,255,0.05)",
                border:"0.5px solid rgba(255,255,255,0.1)",
                padding:"10px 14px", marginBottom:"20px",
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

            {/* Support message */}
            <p style={{
              fontSize:"12px", color:"rgba(255,255,255,0.5)",
              lineHeight:1.7, fontFamily:"'Lato',sans-serif",
              marginBottom:"18px", textAlign:"center",
            }}>
              Your open-access download is preparing.
              <br />
              <span style={{ color:"rgba(255,255,255,0.35)", fontSize:"11px" }}>
                Please support LAN Library by viewing the sponsor message below.
                {!ready && ` Your download unlocks in ${timeLeft}s.`}
              </span>
            </p>

            {/* ── LIVE Google Ad ── */}
            <GoogleAdComponent />

            {/* ── Countdown ring ── */}
            <div style={{
              display:"flex", alignItems:"center",
              justifyContent:"center", gap:"18px",
              margin:"22px 0",
            }}>
              <div
                className={!ready ? "oa-pulse" : ""}
                style={{
                  position:"relative", width:"68px", height:"68px",
                  flexShrink:0, borderRadius:"50%",
                }}
              >
                <svg width="68" height="68" viewBox="0 0 68 68"
                     style={{ transform:"rotate(-90deg)" }}>
                  <circle cx="34" cy="34" r={radius}
                    fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="4" />
                  <circle cx="34" cy="34" r={radius}
                    fill="none"
                    stroke={ready ? "#22c55e" : GOLD}
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeDasharray={`${strokeDash} ${circumference}`}
                    style={{ transition:"stroke-dasharray 0.9s linear, stroke 0.3s" }}
                  />
                </svg>
                <div style={{
                  position:"absolute", inset:0,
                  display:"flex", alignItems:"center", justifyContent:"center",
                }}>
                  {ready
                    ? <CheckCircle size={22} style={{ color:"#22c55e" }} />
                    : <span style={{
                        fontFamily:"'Playfair Display',serif",
                        fontSize:"18px", fontWeight:700, color:"#fff",
                      }}>{timeLeft}</span>
                  }
                </div>
              </div>

              <div>
                {ready ? (
                  <>
                    <p style={{
                      fontSize:"13px", fontWeight:700, color:"#86efac",
                      fontFamily:"'Lato',sans-serif", margin:"0 0 2px",
                    }}>Download Ready!</p>
                    <p style={{
                      fontSize:"11px", color:"rgba(255,255,255,0.4)",
                      fontFamily:"'Lato',sans-serif", margin:0,
                    }}>Click the button below to save your PDF</p>
                  </>
                ) : (
                  <>
                    <p style={{
                      fontSize:"12px", fontWeight:700,
                      color:"rgba(255,255,255,0.6)",
                      fontFamily:"'Lato',sans-serif", margin:"0 0 2px",
                    }}>
                      <Clock size={11} style={{ marginRight:"5px", verticalAlign:"middle", color:GOLD }} />
                      Waiting… {timeLeft}s
                    </p>
                    <p style={{
                      fontSize:"11px", color:"rgba(255,255,255,0.3)",
                      fontFamily:"'Lato',sans-serif", margin:0,
                    }}>Please wait while we prepare your file</p>
                  </>
                )}
              </div>
            </div>

            {/* ── Download button ── */}
            <button
              onClick={handleDownload}
              disabled={!ready || downloading}
              style={{
                width:"100%", padding:"14px",
                background: ready ? GOLD : "rgba(255,255,255,0.06)",
                border: ready ? "none" : "0.5px solid rgba(255,255,255,0.12)",
                color: ready ? NAVY : "rgba(255,255,255,0.3)",
                fontSize:"13px", fontWeight:700,
                fontFamily:"'Lato',sans-serif", letterSpacing:"0.06em",
                cursor: ready ? "pointer" : "not-allowed",
                display:"flex", alignItems:"center",
                justifyContent:"center", gap:"8px",
                transition:"background 0.25s, color 0.25s",
              }}
            >
              {downloading ? (
                <>
                  <div className="oa-spinner" style={{
                    width:"14px", height:"14px",
                    border:`2px solid ${NAVY}`,
                    borderTopColor:"transparent", borderRadius:"50%",
                  }} />
                  Opening Download…
                </>
              ) : ready ? (
                <>
                  <Download size={15} />
                  📥 Download Document Ready
                </>
              ) : (
                <>
                  <Clock size={14} />
                  Waiting… ({timeLeft} seconds)
                </>
              )}
            </button>
          </div>

          {/* ── Footer ── */}
          <div style={{
            background:"rgba(0,0,0,0.2)", padding:"10px 24px",
            borderTop:"0.5px solid rgba(255,255,255,0.06)",
            display:"flex", alignItems:"center", gap:"6px",
          }}>
            <ExternalLink size={10} style={{ color:"rgba(255,255,255,0.25)" }} />
            <p style={{
              fontSize:"10px", color:"rgba(255,255,255,0.25)",
              margin:0, fontFamily:"'Lato',sans-serif",
            }}>
              Free documents are hosted via LAN Library's Open Access programme.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}