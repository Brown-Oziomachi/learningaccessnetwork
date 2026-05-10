"use client";
import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebaseConfig";
import { doc, getDoc, updateDoc, setDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";
import Navbar from "@/components/NavBar";
import {
  Copy, Check, ArrowLeft, Share2,
  ExternalLink, User, GraduationCap
} from "lucide-react";

const NAVY = "#0d2244";
const GOLD = "#b8963e";
const CREAM = "#f5f0e8";
const BG = "#f5f1ea";

export default function ShareProfilePage() {
  const [user, setUser]         = useState(null);
  const [seller, setSeller]     = useState(null);
  const [copied, setCopied]     = useState(false);
  const [loading, setLoading]   = useState(true);
  const [profileUrl, setProfileUrl] = useState("");   // ← async-built URL
  const router = useRouter();

  /* ── Auth + fetch user/seller data ── */
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (cu) => {
      if (!cu) { router.push("/auth/signin"); return; }
      try {
        const [userSnap, sellerSnap] = await Promise.all([
          getDoc(doc(db, "users", cu.uid)),
          getDoc(doc(db, "sellers", cu.uid)),
        ]);
        const userData   = userSnap.exists()   ? userSnap.data()   : {};
        const sellerData = sellerSnap.exists() ? sellerSnap.data() : {};
        setUser({ uid: cu.uid, ...userData });
        setSeller(sellerData);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    });
    return () => unsub();
  }, [router]);

  /* ── Build profile URL once user + seller are loaded ── */
  useEffect(() => {
    if (!user || seller === null) return;

    const build = async () => {
      const base = "https://learningaccessnetwork.vercel.app/faculty";

      const titlePrefix = seller?.title ? `${seller.title} ` : "";
      const fullName    = `${titlePrefix}${user?.firstName || ""} ${user?.surname || ""}`.trim();
      const slug        = fullName
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-");

      const finalSlug = slug || user?.uid;

      // Persist slug so resolveSellerUid can find it via the slug field
      if (slug && user?.uid) {
        try {
          await updateDoc(doc(db, "sellers", user.uid), { slug });
        } catch {
          // Document might not exist yet — create it
          try {
            await setDoc(doc(db, "sellers", user.uid), { slug }, { merge: true });
          } catch {}
        }
      }

      setProfileUrl(`${base}/${finalSlug}`);
    };

    build();
  }, [user, seller]);

  /* ── Copy ── */
  const handleCopy = async () => {
    if (!profileUrl) return;
    try {
      await navigator.clipboard.writeText(profileUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      alert("Copy failed. Please copy manually.");
    }
  };

  /* ── Share ── */
  const handleShare = async () => {
    if (!profileUrl) return;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${displayName} on LAN Library`,
          text: `Check out my academic materials on LAN Library!`,
          url: profileUrl,
        });
      } catch {}
    } else {
      handleCopy();
    }
  };

  /* ── Loading spinner ── */
  if (loading) return (
    <div style={{ minHeight: "100vh", background: BG, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ width: 40, height: 40, border: `3px solid ${GOLD}`, borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  const firstName   = user?.firstName || "";
  const surname     = user?.surname   || "";
  const title       = seller?.title ? `${seller.title} ` : "";
  const displayName = `${title}${firstName} ${surname}`.trim();
  const isLecturer  = user?.isLecturer || user?.role === "lecturer";

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=Lato:wght@300;400;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Lato', sans-serif; background: ${BG}; }
        @keyframes spin    { to { transform: rotate(360deg); } }
        @keyframes fadeUp  { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
        .fade-up { animation: fadeUp 0.4s ease both; }
      `}</style>

      <Navbar />

      <div style={{ maxWidth: 560, margin: "0 auto", padding: "24px 16px 80px" }}>

        {/* Back */}
        <button onClick={() => router.back()}
          style={{ display: "flex", alignItems: "center", gap: 8, background: "none", border: "none", cursor: "pointer", color: "#888", fontFamily: "'Lato',sans-serif", fontSize: 13, marginBottom: 24 }}>
          <ArrowLeft size={16} /> Back
        </button>

        {/* Header card */}
        <div className="fade-up" style={{ background: NAVY, padding: "32px 28px", marginBottom: 16, backgroundImage: "radial-gradient(rgba(184,150,62,0.07) 1px,transparent 1px)", backgroundSize: "24px 24px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20 }}>
            {user?.photoURL || user?.photoBase64 ? (
              <img src={user.photoURL || user.photoBase64} alt={displayName}
                style={{ width: 64, height: 64, borderRadius: "50%", objectFit: "cover", border: `2px solid ${GOLD}` }} />
            ) : (
              <div style={{ width: 64, height: 64, borderRadius: "50%", border: `2px solid ${GOLD}`, background: "rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                {isLecturer
                  ? <GraduationCap size={28} style={{ color: GOLD }} />
                  : <User size={28} style={{ color: GOLD }} />}
              </div>
            )}
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: GOLD, marginBottom: 4, fontFamily: "'Lato',sans-serif" }}>
                {isLecturer ? "Faculty Profile" : "Seller Profile"}
              </div>
              <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 20, fontWeight: 700, color: "#fff" }}>
                {displayName}
              </div>
              {seller?.department && (
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginTop: 3, fontFamily: "'Lato',sans-serif" }}>
                  {seller.department}
                </div>
              )}
            </div>
          </div>

          {/* Info pills */}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {[seller?.university, seller?.title].filter(Boolean).map((val) => (
              <span key={val} style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", background: "rgba(184,150,62,0.15)", border: "1px solid rgba(184,150,62,0.25)", color: GOLD, padding: "4px 10px", fontFamily: "'Lato',sans-serif" }}>
                {val}
              </span>
            ))}
          </div>
        </div>

        {/* Share card */}
        <div className="fade-up" style={{ background: "#fff", border: "0.5px solid #e5ddd0", padding: "28px", marginBottom: 16 }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: GOLD, marginBottom: 6, fontFamily: "'Lato',sans-serif" }}>
            Your Public Profile Link
          </div>
          <p style={{ fontSize: 13, color: "#888", marginBottom: 20, fontFamily: "'Lato',sans-serif", lineHeight: 1.6 }}>
            Share this link with students so they can browse and purchase your materials directly.
          </p>

          {/* URL box */}
          <div style={{ background: BG, border: "0.5px solid #e5ddd0", padding: "14px 16px", marginBottom: 14 }}>
            <span style={{ fontSize: 12, color: NAVY, fontFamily: "monospace", wordBreak: "break-all", lineHeight: 1.5 }}>
              {profileUrl || "Building your link…"}
            </span>
          </div>

          {/* Buttons */}
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={handleCopy} disabled={!profileUrl}
              style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "13px", border: "none", background: copied ? "#16a34a" : NAVY, color: "#fff", fontSize: 13, fontWeight: 700, cursor: profileUrl ? "pointer" : "not-allowed", fontFamily: "'Lato',sans-serif", transition: "background 0.2s", opacity: profileUrl ? 1 : 0.6 }}>
              {copied ? <><Check size={15} /> Copied!</> : <><Copy size={15} /> Copy Link</>}
            </button>
            <button onClick={handleShare} disabled={!profileUrl}
              style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "13px", border: `0.5px solid ${NAVY}`, background: "transparent", color: NAVY, fontSize: 13, fontWeight: 700, cursor: profileUrl ? "pointer" : "not-allowed", fontFamily: "'Lato',sans-serif", opacity: profileUrl ? 1 : 0.6 }}>
              <Share2 size={15} /> Share
            </button>
          </div>
        </div>

        {/* Preview link */}
        <div className="fade-up" style={{ background: "#fff", border: "0.5px solid #e5ddd0", padding: "20px 24px", marginBottom: 16 }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: GOLD, marginBottom: 12, fontFamily: "'Lato',sans-serif" }}>
            Preview Your Profile
          </div>
          <a href={profileUrl || "#"} target="_blank" rel="noopener noreferrer"
            style={{ display: "flex", alignItems: "center", gap: 12, textDecoration: "none", padding: "12px 14px", border: "0.5px solid #e5ddd0", background: BG }}>
            <div style={{ width: 36, height: 36, background: CREAM, border: "0.5px solid #e5ddd0", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <ExternalLink size={15} style={{ color: NAVY }} />
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: NAVY, fontFamily: "'Lato',sans-serif" }}>Open Profile Page</div>
              <div style={{ fontSize: 11, color: "#aaa", fontFamily: "'Lato',sans-serif", marginTop: 2 }}>See what students see when they visit</div>
            </div>
          </a>
        </div>

        {/* Tips */}
        <div className="fade-up" style={{ background: "rgba(184,150,62,0.06)", border: "0.5px solid rgba(184,150,62,0.2)", padding: "20px 24px" }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: GOLD, marginBottom: 12, fontFamily: "'Lato',sans-serif" }}>
            Tips to get more sales
          </div>
          {[
            "📲 Share your link on WhatsApp groups and class chats",
            "📌 Pin it to your social media bio",
            "🎓 Send it to your students at the start of each semester",
            "💬 Add it to your email signature",
          ].map((tip) => (
            <div key={tip} style={{ marginBottom: 10 }}>
              <span style={{ fontSize: 13, lineHeight: 1.6, color: NAVY, fontFamily: "'Lato',sans-serif" }}>{tip}</span>
            </div>
          ))}
        </div>

      </div>
    </>
  );
}