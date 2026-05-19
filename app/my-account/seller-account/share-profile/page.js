"use client";

import { useEffect, useState, useCallback } from "react";
import { auth, db } from "@/lib/firebaseConfig";
import { doc, getDoc, updateDoc, setDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";
import Navbar from "@/components/NavBar";
import {
  Copy,
  Check,
  ArrowLeft,
  Share2,
  ExternalLink,
  User,
  GraduationCap,
  Link2,
  ChevronRight,
  Sparkles,
  Zap,
  MessageCircle,
  Instagram,
  Mail,
  Calendar,
  BookOpen,
} from "lucide-react";

/* ─── Design Tokens ─────────────────────────────────────── */
const NAVY = "#0d2244";
const GOLD = "#b8963e";
const GOLDD = "#d4aa5a";
const CREAM = "#f5f0e8";
const BG = "#f5f1ea";

const buildSlug = (title, firstName, surname) =>
  [title, firstName, surname]
    .filter(Boolean)
    .join(" ")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

const BASE_URL = "https://learningaccessnetwork.vercel.app/profile";

/* ═══════════════════════════════════════════════════════════
   GLOBAL STYLES
═══════════════════════════════════════════════════════════ */
const GlobalStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400&family=Lato:wght@300;400;700&display=swap');
    
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: 'Lato', sans-serif;
      background: ${BG};
      color: #333;
    }

    .lan-serif {
      font-family: 'Playfair Display', Georgia, serif;
    }

    /* Animations */
    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    @keyframes fadeUp {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    @keyframes slideIn {
      from {
        opacity: 0;
        transform: translateX(-10px);
      }
      to {
        opacity: 1;
        transform: translateX(0);
      }
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }

    .fade-in-1 { animation: fadeUp 0.5s cubic-bezier(0.4, 0, 0.2, 1) forwards; }
    .fade-in-2 { animation: fadeUp 0.5s 0.1s cubic-bezier(0.4, 0, 0.2, 1) forwards; opacity: 0; }
    .fade-in-3 { animation: fadeUp 0.5s 0.2s cubic-bezier(0.4, 0, 0.2, 1) forwards; opacity: 0; }
    .fade-in-4 { animation: fadeUp 0.5s 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards; opacity: 0; }

    /* Scrollbar */
    .sbar-none {
      scrollbar-width: none;
      -ms-overflow-style: none;
    }
    .sbar-none::-webkit-scrollbar { display: none; }

    /* Card styles */
    .card {
      background: #fff;
      border: 0.5px solid #e5ddd0;
      padding: 32px;
      margin-bottom: 20px;
      border-radius: 2px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
      transition: box-shadow 0.2s, border-color 0.2s;
    }

    .card:hover {
      border-color: ${GOLD};
      box-shadow: 0 8px 24px rgba(13, 34, 68, 0.08);
    }

    /* Hero card */
    .hero-card {
      background: linear-gradient(135deg, ${NAVY} 0%, #1a2e50 100%);
      position: relative;
      overflow: hidden;
      padding: 40px;
      margin-bottom: 24px;
      border-radius: 2px;
    }

    .hero-card::before {
      content: '';
      position: absolute;
      inset: 0;
      background-image: radial-gradient(rgba(184, 150, 62, 0.08) 1px, transparent 1px),
                        radial-gradient(rgba(255, 255, 255, 0.04) 1px, transparent 1px);
      background-size: 28px 28px, 14px 14px;
      background-position: 0 0, 7px 7px;
      pointer-events: none;
    }

    .hero-card::after {
      content: 'LAN';
      position: absolute;
      bottom: -20px;
      right: -10px;
      font-family: 'Playfair Display', serif;
      font-size: 180px;
      font-weight: 900;
      color: rgba(255, 255, 255, 0.05);
      line-height: 1;
      pointer-events: none;
      user-select: none;
    }

    .hero-content {
      position: relative;
      z-index: 2;
    }

    /* Role badge */
    .role-badge {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: rgba(184, 150, 62, 0.15);
      border: 1px solid rgba(184, 150, 62, 0.35);
      border-radius: 999px;
      padding: 6px 14px;
      margin-bottom: 20px;
      font-size: 9px;
      font-weight: 700;
      letter-spacing: 0.18em;
      text-transform: uppercase;
      color: ${GOLDD};
      font-family: 'Lato', sans-serif;
    }

    .role-badge::before {
      content: '';
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: ${GOLDD};
    }

    /* URL strip */
    .url-strip {
      display: flex;
      align-items: center;
      gap: 12px;
      background: ${BG};
      border: 1px solid #e5ddd0;
      padding: 14px 16px;
      cursor: pointer;
      transition: all 0.2s;
      border-radius: 2px;
    }

    .url-strip:hover {
      border-color: ${GOLD};
      background: #fff;
      box-shadow: 0 4px 12px rgba(184, 150, 62, 0.12);
    }

    .url-strip-value {
      flex: 1;
      font-size: 12px;
      color: ${NAVY};
      font-family: 'SF Mono', 'Monaco', 'Courier New', monospace;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      font-weight: 500;
    }

    .url-copy-icon {
      flex-shrink: 0;
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: ${BG};
      border: 0.5px solid #e5ddd0;
      border-radius: 2px;
      transition: all 0.2s;
    }

    .url-strip:hover .url-copy-icon {
      background: ${GOLD};
      border-color: ${GOLD};
      color: #fff;
    }

    /* Buttons */
    .btn-primary {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 13px 16px;
      background: ${NAVY};
      color: #fff;
      border: none;
      cursor: pointer;
      font-family: 'Lato', sans-serif;
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      transition: all 0.2s;
      border-radius: 2px;
      min-width: 0;
    }

    .btn-primary:hover:not(:disabled) {
      background: ${GOLD};
      color: ${NAVY};
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(184, 150, 62, 0.2);
    }

    .btn-primary.success {
      background: #16a34a;
      color: #fff;
    }

    .btn-primary:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .btn-ghost {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 13px 16px;
      background: transparent;
      border: 1px solid #d8d0c4;
      color: ${NAVY};
      cursor: pointer;
      font-family: 'Lato', sans-serif;
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      transition: all 0.2s;
      border-radius: 2px;
      min-width: 0;
    }

    .btn-ghost:hover:not(:disabled) {
      border-color: ${GOLD};
      background: ${GOLD};
      color: ${NAVY};
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(184, 150, 62, 0.15);
    }

    .btn-ghost:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    /* Social pills */
    .social-pills {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }

    .soc-pill {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      padding: 10px 16px;
      background: #fff;
      border: 1px solid #e5ddd0;
      color: ${NAVY};
      font-size: 11px;
      font-weight: 700;
      font-family: 'Lato', sans-serif;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      cursor: pointer;
      transition: all 0.2s;
      border-radius: 2px;
      white-space: nowrap;
      min-width: fit-content;
    }

    .soc-pill:hover:not(:disabled) {
      border-color: ${GOLD};
      background: ${GOLD};
      color: ${NAVY};
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(184, 150, 62, 0.2);
    }

    .soc-pill:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }

    /* Tip rows */
    .tip-item {
      display: grid;
      grid-template-columns: 40px 1fr;
      gap: 16px;
      padding: 18px 0;
      border-bottom: 0.5px solid rgba(184, 150, 62, 0.15);
      align-items: flex-start;
    }

    .tip-item:last-child {
      border-bottom: none;
      padding-bottom: 0;
    }

    .tip-icon {
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(184, 150, 62, 0.12);
      border: 1px solid rgba(184, 150, 62, 0.2);
      border-radius: 2px;
      font-size: 18px;
      flex-shrink: 0;
    }

    .tip-content h4 {
      font-family: 'Playfair Display', serif;
      font-size: 14px;
      font-weight: 700;
      color: ${NAVY};
      margin: 0 0 4px 0;
    }

    .tip-content p {
      font-size: 13px;
      color: #666;
      font-family: 'Lato', sans-serif;
      line-height: 1.6;
      margin: 0;
    }

    /* Preview link */
    .preview-link {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 18px 16px;
      background: ${BG};
      border: 1px solid #e5ddd0;
      border-radius: 2px;
      text-decoration: none;
      transition: all 0.2s;
      cursor: pointer;
    }

    .preview-link:hover {
      border-color: ${GOLD};
      background: #fff;
      box-shadow: 0 6px 16px rgba(13, 34, 68, 0.1);
    }

    .preview-icon {
      width: 44px;
      height: 44px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #fff;
      border: 1px solid #e5ddd0;
      border-radius: 2px;
      flex-shrink: 0;
      transition: all 0.2s;
    }

    .preview-link:hover .preview-icon {
      border-color: ${GOLD};
      background: ${GOLD};
      color: ${NAVY};
    }

    .preview-text h4 {
      font-family: 'Playfair Display', serif;
      font-size: 14px;
      font-weight: 700;
      color: ${NAVY};
      margin: 0 0 3px 0;
    }

    .preview-text p {
      font-size: 12px;
      color: #888;
      font-family: 'Lato', sans-serif;
      margin: 0;
    }

    .preview-arrow {
      margin-left: auto;
      flex-shrink: 0;
      color: #ddd;
      transition: all 0.2s;
    }

    .preview-link:hover .preview-arrow {
      color: ${GOLD};
      transform: translateX(2px);
    }

    /* Section header */
    .section-header {
      font-size: 9px;
      font-weight: 700;
      letter-spacing: 0.2em;
      text-transform: uppercase;
      color: ${GOLD};
      font-family: 'Lato', sans-serif;
      margin-bottom: 12px;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .section-header::before {
      content: '';
      flex-shrink: 0;
      width: 3px;
      height: 3px;
      border-radius: 50%;
      background: ${GOLD};
    }

    /* Layout */
    .share-page {
      max-width: 640px;
      margin: 0 auto;
      padding: 40px 20px 100px;
    }

    .back-button {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: none;
      border: none;
      cursor: pointer;
      color: #aaa;
      font-family: 'Lato', sans-serif;
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      padding: 8px 0;
      margin-bottom: 32px;
      transition: all 0.2s;
    }

    .back-button:hover {
      color: ${NAVY};
    }

    /* Copy feedback */
    .copy-feedback {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 11px;
      font-weight: 700;
      color: #16a34a;
      font-family: 'Lato', sans-serif;
      animation: slideIn 0.3s ease-out;
    }

    /* Info chips */
    .info-chips {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
      margin-top: 16px;
    }

    .info-chip {
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      background: rgba(184, 150, 62, 0.14);
      border: 1px solid rgba(184, 150, 62, 0.28);
      color: ${GOLDD};
      padding: 5px 12px;
      font-family: 'Lato', sans-serif;
      border-radius: 999px;
    }

    /* Responsive */
    @media (max-width: 640px) {
      .share-page { padding: 24px 16px 80px; }
      .card { padding: 24px 20px; }
      .hero-card { padding: 32px 24px; }
      .hero-name { font-size: clamp(18px, 5vw, 24px) !important; }
      .btn-row { flex-direction: column; }
      .btn-primary, .btn-ghost { width: 100%; }
    }

    @media (max-width: 480px) {
      .share-page { padding: 20px 12px 60px; }
      .card { padding: 20px 16px; margin-bottom: 16px; }
      .hero-card { padding: 28px 20px; }
      .section-header { font-size: 8px; }
    }
  `}</style>
);

/* ═══════════════════════════════════════════════════════════
   SHARE PROFILE PAGE
═══════════════════════════════════════════════════════════ */
export default function ShareProfilePage() {
  const [user, setUser] = useState(null);
  const [seller, setSeller] = useState(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [profileUrl, setProfileUrl] = useState("");
  const [slugSaved, setSlugSaved] = useState(false);
  const router = useRouter();

  /* ── Auth + data fetch ── */
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (cu) => {
      if (!cu) {
        router.push("/auth/signin");
        return;
      }
      try {
        const [uSnap, sSnap] = await Promise.all([
          getDoc(doc(db, "users", cu.uid)),
          getDoc(doc(db, "sellers", cu.uid)),
        ]);
        setUser({ uid: cu.uid, ...(uSnap.exists() ? uSnap.data() : {}) });
        setSeller(sSnap.exists() ? sSnap.data() : {});
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    });
    return () => unsub();
  }, [router]);

  /* ── Build + persist slug ── */
  useEffect(() => {
    if (!user || seller === null) return;
    const build = async () => {
      const title = seller?.title || user?.title || "";
      const firstName = user?.firstName || "";
      const surname = user?.surname || "";
      const slug = buildSlug(title, firstName, surname) || user.uid;
      const finalUrl = `${BASE_URL}/${slug}`;
      if (slug && user.uid && !slugSaved) {
        try {
          await updateDoc(doc(db, "sellers", user.uid), { slug });
        } catch {
          try {
            await setDoc(doc(db, "sellers", user.uid), { slug }, { merge: true });
          } catch { }
        }
        setSlugSaved(true);
      }
      setProfileUrl(finalUrl);
    };
    build();
  }, [user, seller, slugSaved]);

  /* ── Copy ── */
  const handleCopy = useCallback(async () => {
    if (!profileUrl) return;
    try {
      await navigator.clipboard.writeText(profileUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      try {
        const ta = document.createElement("textarea");
        ta.value = profileUrl;
        Object.assign(ta.style, { position: "fixed", top: "-9999px" });
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      } catch {
        alert("Copy failed — please copy manually:\n" + profileUrl);
      }
    }
  }, [profileUrl]);

  /* ── Native share ── */
  const handleShare = useCallback(async () => {
    if (!profileUrl) return;
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: `${displayName} on LAN Library`,
          text: "Check out my academic materials on LAN Library!",
          url: profileUrl,
        });
        return;
      } catch (err) {
        if (err?.name === "AbortError") return;
      }
    }
    handleCopy();
  }, [profileUrl]);

  /* ── WhatsApp ── */
  const handleWhatsApp = () => {
    if (!profileUrl) return;
    window.open(
      `https://wa.me/?text=${encodeURIComponent(
        `Check out my academic materials on LAN Library! ${profileUrl}`
      )}`,
      "_blank",
      "noopener"
    );
  };

  /* ── Loading ── */
  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: BG,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <GlobalStyles />
        <div
          style={{
            width: 48,
            height: 48,
            border: `3px solid ${GOLD}`,
            borderTopColor: "transparent",
            borderRadius: "50%",
            animation: "spin 0.8s linear infinite",
          }}
        />
      </div>
    );
  }

  /* ── Derived ── */
  const title = seller?.title ? `${seller.title} ` : "";
  const firstName = user?.firstName || "";
  const surname = user?.surname || "";
  const displayName = `${title}${firstName} ${surname}`.trim() || "Your Profile";
  const isLecturer = user?.isLecturer || user?.role === "lecturer";
  const roleLabel = isLecturer ? "🎓 Academic Educator" : "✍️ Independent Creator";
  const department = seller?.department || user?.department || "";
  const university = seller?.university || user?.university || "";
  const photo = user?.photoURL || user?.photoBase64 || null;

  /* ── Share links ── */
  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
    `Check out my academic materials on LAN Library! ${profileUrl}`
  )}`;
  const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
    profileUrl
  )}`;

  return (
    <>
      <GlobalStyles />
      <Navbar />

      <div className="share-page">
        {/* ── Back Button ── */}
        <button
          onClick={() => router.back()}
          className="back-button"
          onMouseEnter={(e) => (e.currentTarget.style.color = NAVY)}
          onMouseLeave={(e) => (e.currentTarget.style.color = "#aaa")}
        >
          <ArrowLeft size={14} /> Back to Dashboard
        </button>

        {/* ══ HERO SECTION ══ */}
        <div className="fade-in-1 hero-card">
          <div className="hero-content">
            {/* Role badge */}
            <div className="role-badge">{roleLabel}</div>

            {/* Avatar + info */}
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "20px",
                flexWrap: "wrap",
              }}
            >
              {/* Avatar */}
              <div style={{ flexShrink: 0 }}>
                {photo ? (
                  <img
                    src={photo}
                    alt={displayName}
                    style={{
                      width: "80px",
                      height: "80px",
                      borderRadius: "50%",
                      objectFit: "cover",
                      border: `3px solid ${GOLDD}`,
                      display: "block",
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: "80px",
                      height: "80px",
                      borderRadius: "50%",
                      border: `3px solid ${GOLDD}`,
                      background: "rgba(255, 255, 255, 0.1)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {isLecturer ? (
                      <GraduationCap size={40} style={{ color: GOLDD }} />
                    ) : (
                      <User size={40} style={{ color: GOLDD }} />
                    )}
                  </div>
                )}
              </div>

              {/* Name + metadata */}
              <div style={{ flex: 1, minWidth: "220px", color: "#fff" }}>
                <h2
                  className="lan-serif hero-name"
                  style={{
                    fontSize: "clamp(20px, 5vw, 28px)",
                    fontWeight: 900,
                    margin: "0 0 8px 0",
                    lineHeight: 1.1,
                    wordBreak: "break-word",
                  }}
                >
                  {displayName}
                </h2>

                {department && (
                  <p
                    style={{
                      fontSize: "13px",
                      color: "rgba(245, 240, 232, 0.8)",
                      fontFamily: "'Lato', sans-serif",
                      margin: "0 0 12px 0",
                      fontWeight: 300,
                    }}
                  >
                    {department}
                  </p>
                )}

                {/* Info chips */}
                {(university || seller?.title) && (
                  <div className="info-chips">
                    {university && <span className="info-chip">{university}</span>}
                    {seller?.title && <span className="info-chip">{seller.title}</span>}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ══ SHARE LINK SECTION ══ */}
        <div className="fade-in-2 card">
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "16px",
              flexWrap: "wrap",
              gap: "8px",
            }}
          >
            <div className="section-header">
              <Link2 size={12} />
              Your Public Profile Link
            </div>
            {copied && <div className="copy-feedback">
              <Check size={12} /> Copied!
            </div>}
          </div>

          <p
            style={{
              fontSize: "13px",
              color: "#888",
              fontFamily: "'Lato', sans-serif",
              marginBottom: "20px",
              lineHeight: 1.6,
            }}
          >
            Share this link with friends to showcase your materials. Your profile
            shows everything you've uploaded in one beautiful page.
          </p>

          {/* URL strip */}
          <div className="url-strip" onClick={handleCopy} title="Click to copy">
            <Link2 size={14} style={{ color: GOLD, flexShrink: 0 }} />
            <span className="url-strip-value">{profileUrl || "Building your link…"}</span>
            <div className="url-copy-icon">
              {copied ? (
                <Check size={14} style={{ color: "#16a34a" }} />
              ) : (
                <Copy size={14} style={{ color: "#bbb" }} />
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div
            style={{
              display: "flex",
              gap: "12px",
              marginTop: "20px",
              marginBottom: "20px",
            }}
          >
            <button
              onClick={handleCopy}
              disabled={!profileUrl}
              className={`btn-primary ${copied ? "success" : ""}`}
            >
              {copied ? (
                <>
                  <Check size={14} /> Copied!
                </>
              ) : (
                <>
                  <Copy size={14} /> Copy Link
                </>
              )}
            </button>
            <button onClick={handleShare} disabled={!profileUrl} className="btn-ghost">
              <Share2 size={14} /> Share
            </button>
          </div>

          {/* Social pills */}
          <div className="social-pills">
            <button
              onClick={handleWhatsApp}
              disabled={!profileUrl}
              className="soc-pill"
              title="Share via WhatsApp"
            >
              <MessageCircle size={12} /> WhatsApp
            </button>
            <button
              onClick={() => profileUrl && window.open(twitterUrl, "_blank", "noopener")}
              disabled={!profileUrl}
              className="soc-pill"
              title="Post on Twitter/X"
            >
              <span style={{ fontWeight: 900 }}>𝕏</span>
            </button>
            <button
              onClick={() => profileUrl && window.open(linkedinUrl, "_blank", "noopener")}
              disabled={!profileUrl}
              className="soc-pill"
              title="Share on LinkedIn"
            >
              <span style={{ fontWeight: 900, color: "#0077b5" }}>in</span>
            </button>
          </div>
        </div>

        {/* ══ PREVIEW SECTION ══ */}
        <div className="fade-in-3 card" style={{ padding: "24px" }}>
          <div className="section-header">
            <ExternalLink size={12} />
            See Your Profile
          </div>

          <p
            style={{
              fontSize: "12px",
              color: "#888",
              fontFamily: "'Lato', sans-serif",
              marginBottom: "16px",
              lineHeight: 1.6,
            }}
          >
            Preview exactly how your profile looks to students
          </p>

          <a
            href={profileUrl || "#"}
            target="_blank"
            rel="noopener noreferrer"
            className="preview-link"
          >
            <div className="preview-icon">
              <ExternalLink size={18} style={{ color: NAVY }} />
            </div>
            <div className="preview-text" style={{ flex: 1, minWidth: 0 }}>
              <h4>Open Profile Page</h4>
              <p>View your public profile exactly as students see it</p>
            </div>
            <ChevronRight size={18} className="preview-arrow" />
          </a>
        </div>

        {/* ══ GROWTH TIPS SECTION ══ */}
        <div className="fade-in-4 card" style={{ backgroundColor: "rgba(184, 150, 62, 0.04)" }}>
          <div className="section-header" style={{ marginBottom: "24px" }}>
            <Zap size={12} />
            Boost Your Profile
          </div>

          {[
            {
              icon: "💬",
              title: "WhatsApp Strategy",
              desc: "Share your link in class groups, departmental chats, and course channels. Make it easy for classmates to find you.",
            },
            {
              icon: "📱",
              title: "Social Media",
              desc: "Add your profile link to your Twitter, Instagram, and TikTok bio. Pin it to stories and highlight it in your feed.",
            },
            {
              icon: "📅",
              title: "Semester Kickoff",
              desc: "Send your link to students at the start of each semester when they're buying materials and looking for resources.",
            },
            {
              icon: "✉️",
              title: "Email Signature",
              desc: "Add your profile link to your email signature, so every email you send promotes your store automatically.",
            },
          ].map(({ icon, title, desc }, idx) => (
            <div key={title} className="tip-item">
              <div className="tip-icon">{icon}</div>
              <div className="tip-content">
                <h4>{title}</h4>
                <p>{desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ══ CTA FOOTER ══ */}
        <div
          style={{
            background: "rgba(184, 150, 62, 0.08)",
            border: `1px solid rgba(184, 150, 62, 0.2)`,
            padding: "24px",
            marginTop: "32px",
            borderRadius: "2px",
            textAlign: "center",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              marginBottom: "12px",
            }}
          >
            <Sparkles size={14} style={{ color: GOLD }} />
            <span
              style={{
                fontSize: "11px",
                fontWeight: 700,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: GOLD,
                fontFamily: "'Lato', sans-serif",
              }}
            >
              Ready to grow?
            </span>
          </div>
          <p
            style={{
              fontSize: "13px",
              color: "#666",
              fontFamily: "'Lato', sans-serif",
              lineHeight: 1.6,
              marginBottom: "16px",
            }}
          >
            Your profile link is live. Start sharing it now and watch your sales grow as more
            students discover your materials.
          </p>
          <button
            onClick={() => router.push("/dashboard")}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "10px 20px",
              background: NAVY,
              color: "#fff",
              border: "none",
              cursor: "pointer",
              fontSize: "12px",
              fontWeight: 700,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              fontFamily: "'Lato', sans-serif",
              borderRadius: "2px",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = GOLD;
              e.currentTarget.style.color = NAVY;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = NAVY;
              e.currentTarget.style.color = "#fff";
            }}
          >
            <BookOpen size={13} /> Back to Dashboard
          </button>
        </div>
      </div>
    </>
  );
}