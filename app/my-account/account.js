"use client";
import React, { useState, useEffect } from "react";
import {
  Globe, Camera, Save, Settings, X, Mail, Store,
  User, ChevronRight, BookOpen, TrendingUp, LogOut,
  Shield, Calendar, Phone, MapPin, Sparkles,
} from "lucide-react";
import Link from "next/link";
import { auth, db } from "@/lib/firebaseConfig";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useRouter } from "next/navigation";
import Navbar from "@/components/NavBar";
import { uploadImageToCloudinary } from "@/lib/uploadImageToCloudinary";

/* ─── colour tokens (identical to home page) ────────────────── */
const NAVY  = "#0d2244";
const GOLD  = "#b8963e";
const GOLDD = "#d4aa5a";
const CREAM = "#f5f0e8";
const BG    = "#f5f1ea";

/* ════════════════════════════════════════════════════════════════
   COMPONENT
════════════════════════════════════════════════════════════════ */
export default function MyAccountClient() {
  const [user,      setUser]      = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error,     setError]     = useState(null);
  const [showSellerRedirectModal, setShowSellerRedirectModal] = useState(false);
  const isRedirectingRef = React.useRef(false);
  const router = useRouter();

  const [formData, setFormData] = useState({
    firstName: "", surname: "", displayName: "", dateOfBirth: "",
  });

  /* ── auth listener ── */
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (cu) => {
      if (cu) { await fetchUserData(cu.uid); }
      else    { router.push("/auth/signin"); }
    });
    return () => unsubscribe();
  }, [router]);

  const fetchUserData = async (uid) => {
    try {
      setLoading(true); setError(null);
      const snap = await getDoc(doc(db, "users", uid));
      if (snap.exists()) {
        const data = snap.data();
        setUser({ uid, ...data });
        setFormData({
          firstName:   data.firstName   || "",
          surname:     data.surname     || "",
          displayName: data.displayName || "",
          dateOfBirth: data.dateOfBirth || "",
        });
      } else {
        setError("User profile not found.");
        router.push("/role-selection");
      }
    } catch (e) {
      setError(`Failed to load profile: ${e.message}`);
    } finally {
      if (!isRedirectingRef.current) setLoading(false);
    }
  };

 const handleImageUpload = async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  try {
    setUploading(true);
    const url = await uploadImageToCloudinary(file, 'profiles');
    // Write BOTH fields so seller page stays in sync
    await updateDoc(doc(db, 'users', user.uid), { 
      photoURL: url,
      photoBase64: url  // <-- add this
    });
    setUser(p => ({ ...p, photoURL: url, photoBase64: url }));
  } catch (e) {
    alert('Upload failed: ' + e.message);
  } finally {
    setUploading(false);
  }
};

  const handleSave = async () => {
    try {
      await updateDoc(doc(db, "users", user.uid), {
        ...formData,
        displayName: `${formData.firstName} ${formData.surname}`,
      });
      setUser(p => ({ ...p, ...formData, displayName: `${formData.firstName} ${formData.surname}` }));
      setIsEditing(false);
    } catch (e) { alert(`Failed to save: ${e.message}`); }
  };

  const handleLogout = async () => {
    try { await signOut(auth); router.push("/"); }
    catch (e) { alert("Logout failed."); }
  };

  /* ── loading ── */
  if (loading) return (
    <div style={{ minHeight: "100vh", background: BG, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ textAlign: "center" }}>
        <div style={{ width: "52px", height: "52px", border: `3px solid ${GOLD}`, borderTopColor: "transparent", borderRadius: "50%", animation: "spin .8s linear infinite", margin: "0 auto 16px" }} />
        <p style={{ fontFamily: "'Playfair Display',serif", fontSize: "17px", color: NAVY }}>Loading your account…</p>
      </div>
    </div>
  );

  /* ── error ── */
  if (error && !user) return (
    <div style={{ minHeight: "100vh", background: BG, display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}>
      <div style={{ background: "#fff", border: `0.5px solid #e5ddd0`, padding: "48px 40px", maxWidth: "420px", textAlign: "center" }}>
        <Shield size={40} style={{ color: GOLD, margin: "0 auto 16px" }} />
        <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: "22px", color: NAVY, marginBottom: "10px" }}>Profile Error</h2>
        <p style={{ fontSize: "13px", color: "#888", lineHeight: 1.7, marginBottom: "24px" }}>Check your network and try again.</p>
        <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
          <button onClick={() => window.location.reload()} style={{ padding: "10px 22px", background: NAVY, color: "#fff", border: "none", fontSize: "12px", fontWeight: 700, cursor: "pointer", fontFamily: "'Lato',sans-serif" }}>Retry</button>
          <button onClick={() => router.push("/auth/signin")} style={{ padding: "10px 22px", background: "transparent", color: NAVY, border: `0.5px solid ${NAVY}`, fontSize: "12px", fontWeight: 700, cursor: "pointer", fontFamily: "'Lato',sans-serif" }}>Sign Out</button>
        </div>
      </div>
    </div>
  );

  /* ── seller redirect modal ── */
  if (showSellerRedirectModal) return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}>
      <div style={{ background: "#fff", width: "100%", maxWidth: "400px", overflow: "hidden", boxShadow: "0 32px 64px rgba(13,34,68,0.25)" }}>
        <div style={{ background: NAVY, backgroundImage: "radial-gradient(rgba(184,150,62,0.07) 1px,transparent 1px)", backgroundSize: "20px 20px", padding: "32px 24px", textAlign: "center" }}>
          <div style={{ width: "56px", height: "56px", border: `0.5px solid rgba(184,150,62,0.3)`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
            <Store size={24} style={{ color: GOLD }} />
          </div>
          <p style={{ fontFamily: "'Playfair Display',serif", fontSize: "20px", fontWeight: 700, color: "#fff", margin: "0 0 6px" }}>Verified Seller</p>
          <p style={{ fontSize: "12px", color: "rgba(184,150,62,0.7)", fontFamily: "'Lato',sans-serif" }}>You have a seller dashboard</p>
        </div>
        <div style={{ padding: "24px" }}>
          {["Manage your book listings", "Track sales and earnings", "Withdraw your funds", "View purchase history"].map(t => (
            <div key={t} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "8px 0", borderBottom: "0.5px solid #f0ebe0", fontSize: "13px", color: NAVY, fontFamily: "'Lato',sans-serif" }}>
              <div style={{ width: "6px", height: "6px", background: "#16a34a", borderRadius: "50%", flexShrink: 0 }} />{t}
            </div>
          ))}
          <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "20px" }}>
            <button onClick={() => router.push("/my-account/seller-account")}
              style={{ width: "100%", background: NAVY, color: "#fff", padding: "13px", border: "none", fontSize: "13px", fontWeight: 700, cursor: "pointer", fontFamily: "'Lato',sans-serif", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
              <Store size={15} /> Go to Seller Dashboard
            </button>
            <button onClick={() => { setShowSellerRedirectModal(false); router.push("/documents"); }}
              style={{ width: "100%", background: "transparent", color: NAVY, padding: "13px", border: `0.5px solid #e5ddd0`, fontSize: "13px", fontWeight: 700, cursor: "pointer", fontFamily: "'Lato',sans-serif" }}>
              Browse Books Instead
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  if (!user) return null;

  const displayName = user.displayName || `${user.firstName || ""} ${user.surname || ""}`.trim() || "Scholar";
  const initials    = displayName.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();

  /* ── info rows ── */
  const infoRows = [
    { icon: Mail,     label: "Email",         value: user.email },
    { icon: User,     label: "First Name",    value: user.firstName  || "Not set" },
    { icon: User,     label: "Surname",       value: user.surname    || "Not set" },
    { icon: Calendar, label: "Date of Birth", value: user.dateOfBirth || "Not set" },
  ];

  /* ════════ RENDER ════════ */
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400&family=Lato:wght@300;400;700&display=swap');
        .lan-root  { font-family:'Lato',sans-serif; background:${BG}; }
        .lan-serif { font-family:'Playfair Display',Georgia,serif; }
        .hero-bg {
          background-color:${NAVY};
          background-image:
            radial-gradient(rgba(184,150,62,0.06) 1px,transparent 1px),
            radial-gradient(rgba(255,255,255,0.03) 1px,transparent 1px);
          background-size:28px 28px,14px 14px;
          background-position:0 0,7px 7px;
        }
        .action-row {
          display:flex; align-items:center; gap:12px;
          padding:14px 16px; border:0.5px solid #e5ddd0; background:#fff;
          text-decoration:none; transition:border-color .18s,background .18s; cursor:pointer;
        }
        .action-row:hover { border-color:${GOLD}; background:${CREAM}; }
        .info-row { display:flex; justify-content:space-between; align-items:center; padding:13px 16px; border-bottom:0.5px solid #f0ebe0; }
        .info-row:last-child { border-bottom:none; }
        .gold-pill { display:inline-flex; align-items:center; gap:6px; background:rgba(184,150,62,0.12); border:0.5px solid rgba(184,150,62,0.3); padding:5px 12px; border-radius:999px; }
        @keyframes spin  { to { transform:rotate(360deg); } }
        @keyframes slideUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        .anim-up   { animation:slideUp .45s cubic-bezier(.4,0,.2,1) both; }
        .anim-up-2 { animation:slideUp .45s .1s cubic-bezier(.4,0,.2,1) both; }
        .modal-overlay { position:fixed;inset:0;background:rgba(0,0,0,0.65);z-index:50;display:flex;align-items:flex-start;justify-content:center;overflow-y:auto;padding:40px 16px; }
        .modal-inner { background:#fff;width:100%;max-width:580px; }
        input[type=text],input[type=date],input:not([type]) {
          border:0.5px solid #e5ddd0; padding:11px 13px; font-size:13px;
          color:${NAVY}; outline:none; font-family:'Lato',sans-serif;
          transition:border-color .18s; box-sizing:border-box; width:100%;
        }
        input:focus { border-color:${GOLD}; }
        input:disabled { background:#f9f9f9; color:#aaa; cursor:not-allowed; }
        @keyframes pulse2{0%,100%{opacity:1}50%{opacity:.4}}
        .pulse-dot { animation:pulse2 2s infinite; }
      `}</style>

      <div className="lan-root" style={{ minHeight: "100vh" }}>
        <Navbar />

        {/* ══ HERO BANNER ══════════════════════════════════════════════ */}
        <section className="hero-bg anim-up" style={{ padding: "48px 24px 0" }}>
          <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
            {/* top bar */}
            <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: "16px", paddingBottom: "32px" }}>
              {/* avatar + name */}
              <div style={{ display: "flex", alignItems: "center", gap: "18px" }}>
                <div style={{ position: "relative", flexShrink: 0 }}>
                  {user.photoURL ? (
                    <img src={user.photoURL || user.photoBase64} alt="avatar"
                      style={{ width: "72px", height: "72px", borderRadius: "50%", objectFit: "cover", border: `2.5px solid ${GOLD}` }} />
                  ) : (
                    <div style={{ width: "72px", height: "72px", borderRadius: "50%", background: GOLD, display: "flex", alignItems: "center", justifyContent: "center", border: `2.5px solid rgba(184,150,62,0.4)` }}>
                      <span style={{ fontFamily: "'Playfair Display',serif", fontSize: "24px", fontWeight: 700, color: NAVY }}>{initials}</span>
                    </div>
                  )}
                </div>
                <div>
                  <p style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: GOLD, marginBottom: "5px", fontFamily: "'Lato',sans-serif" }}>My Account</p>
                  <h1 className="lan-serif" style={{ fontSize: "clamp(22px, 4vw, 34px)", fontWeight: 700, color: "#fff", margin: 0, lineHeight: 1.1 }}>{displayName}</h1>
                  <p style={{ fontSize: "12px", color: "rgba(245,240,232,0.55)", margin: "5px 0 0", fontFamily: "'Lato',sans-serif" }}>{user.email}</p>
                </div>
              </div>

              {/* status badges */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", alignItems: "center" }}>
                {user.isSeller && (
                  <div className="gold-pill">
                    <div className="pulse-dot" style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#16a34a" }} />
                    <span style={{ fontSize: "9px", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: GOLD, fontFamily: "'Lato',sans-serif" }}>Verified Seller</span>
                  </div>
                )}
                <button onClick={() => setIsEditing(true)} style={{ display: "flex", alignItems: "center", gap: "7px", padding: "9px 18px", background: "rgba(255,255,255,0.1)", color: "#fff", border: "0.5px solid rgba(255,255,255,0.2)", fontSize: "11px", fontWeight: 700, cursor: "pointer", fontFamily: "'Lato',sans-serif", letterSpacing: "0.05em", transition: "background .18s" }}
                  onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.18)"}
                  onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.1)"}>
                  <Settings size={13} /> Edit Profile
                </button>
                <button onClick={handleLogout} style={{ display: "flex", alignItems: "center", gap: "7px", padding: "9px 18px", background: "transparent", color: "rgba(255,255,255,0.5)", border: "0.5px solid rgba(255,255,255,0.12)", fontSize: "11px", fontWeight: 700, cursor: "pointer", fontFamily: "'Lato',sans-serif", letterSpacing: "0.05em", transition: "all .18s" }}
                  onMouseEnter={e => { e.currentTarget.style.background = "rgba(220,38,38,0.15)"; e.currentTarget.style.color = "#f87171"; e.currentTarget.style.borderColor = "rgba(220,38,38,0.3)"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "rgba(255,255,255,0.5)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)"; }}>
                  <LogOut size={13} /> Sign Out
                </button>
              </div>
            </div>

            {/* stats strip */}
            <div style={{ borderTop: "0.5px solid rgba(184,150,62,0.2)", display: "flex", flexWrap: "wrap" }}>
              {[
                { val: user.isSeller ? "Seller" : "Reader", label: "Account Type" },
                { val: user.dateOfBirth || "—",             label: "Date of Birth" },
                { val: user.country    || "Nigeria",        label: "Country" },
                { val: user.phone      || "—",              label: "Phone" },
              ].map(({ val, label }) => (
                <div key={label} style={{ flex: "1 1 120px", padding: "20px 20px 24px", borderRight: "0.5px solid rgba(184,150,62,0.12)" }}>
                  <div className="lan-serif" style={{ fontSize: "16px", fontWeight: 700, color: "#fff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{val}</div>
                  <div style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(184,150,62,0.65)", marginTop: "3px", fontFamily: "'Lato',sans-serif" }}>{label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══ MAIN GRID ════════════════════════════════════════════════ */}
        <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "32px 24px 64px", display: "grid", gridTemplateColumns: "1fr", gap: "20px" }} className="acc-grid">
          <style>{`@media(min-width:1024px){.acc-grid{grid-template-columns:2fr 1fr !important;}}`}</style>

          {/* ── LEFT ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }} className="anim-up-2">

            {/* Account Information card */}
            <div style={{ background: "#fff", border: "0.5px solid #e5ddd0" }}>
              <div style={{ padding: "20px 20px 14px", borderBottom: "0.5px solid #f0ebe0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <p style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: GOLD, marginBottom: "3px", fontFamily: "'Lato',sans-serif" }}>Profile</p>
                  <h2 className="lan-serif" style={{ fontSize: "20px", fontWeight: 700, color: NAVY, margin: 0 }}>Account Information</h2>
                </div>
                <button onClick={() => setIsEditing(true)} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "8px 16px", background: CREAM, color: NAVY, border: "0.5px solid #e5ddd0", fontSize: "11px", fontWeight: 700, cursor: "pointer", fontFamily: "'Lato',sans-serif", letterSpacing: "0.05em", transition: "all .18s" }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = GOLD}
                  onMouseLeave={e => e.currentTarget.style.borderColor = "#e5ddd0"}>
                  <Settings size={12} /> Edit
                </button>
              </div>

              {infoRows.map(({ icon: Icon, label, value }) => (
                <div key={label} className="info-row">
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <div style={{ width: "32px", height: "32px", border: "0.5px solid #e5ddd0", background: CREAM, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <Icon size={13} style={{ color: NAVY }} />
                    </div>
                    <span style={{ fontSize: "12px", color: "#aaa", fontFamily: "'Lato',sans-serif" }}>{label}</span>
                  </div>
                  <span style={{ fontSize: "13px", fontWeight: 700, color: NAVY, fontFamily: "'Lato',sans-serif", maxWidth: "60%", textAlign: "right", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{value}</span>
                </div>
              ))}
            </div>

            {/* Seller CTA — only for non-sellers */}
            {!user.isSeller && (
              <div style={{ background: NAVY, backgroundImage: "radial-gradient(rgba(184,150,62,0.07) 1px,transparent 1px)", backgroundSize: "24px 24px", padding: "32px 28px", position: "relative", overflow: "hidden" }}>
                <div style={{ position: "absolute", top: "-24px", right: "-24px", width: "100px", height: "100px", border: "0.5px solid rgba(184,150,62,0.15)", transform: "rotate(45deg)" }} />
                <div className="gold-pill" style={{ marginBottom: "16px" }}>
                  <Sparkles size={10} style={{ color: GOLD }} />
                  <span style={{ fontSize: "9px", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: GOLD, fontFamily: "'Lato',sans-serif" }}>Earn 80% of every sale</span>
                </div>
                <h3 className="lan-serif" style={{ fontSize: "24px", fontWeight: 700, color: "#fff", margin: "0 0 8px" }}>Start Selling Your Documents</h3>
                <p style={{ fontSize: "13px", color: "rgba(245,240,232,0.6)", marginBottom: "22px", lineHeight: 1.7, fontFamily: "'Lato',sans-serif", maxWidth: "480px" }}>
                  Turn your academic materials into income. Upload once, earn from Africa's 2.4M+ learners.
                </p>
                <button onClick={() => router.push("/become-seller")}
                  style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "12px 24px", background: GOLD, color: NAVY, border: "none", fontSize: "12px", fontWeight: 700, cursor: "pointer", fontFamily: "'Lato',sans-serif", letterSpacing: "0.05em", transition: "background .18s" }}
                  onMouseEnter={e => e.currentTarget.style.background = GOLDD}
                  onMouseLeave={e => e.currentTarget.style.background = GOLD}>
                  <Store size={14} /> Become a Seller
                </button>
              </div>
            )}

            {/* Seller quick-access — only for sellers */}
            {user.isSeller && (
              <div style={{ background: NAVY, backgroundImage: "radial-gradient(rgba(184,150,62,0.07) 1px,transparent 1px)", backgroundSize: "24px 24px", padding: "28px", position: "relative", overflow: "hidden" }}>
                <div style={{ position: "absolute", top: "-24px", right: "-24px", width: "90px", height: "90px", border: "0.5px solid rgba(184,150,62,0.15)", transform: "rotate(45deg)" }} />
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px", flexWrap: "wrap" }}>
                  <div>
                    <div className="gold-pill" style={{ marginBottom: "12px" }}>
                      <div className="pulse-dot" style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#16a34a" }} />
                      <span style={{ fontSize: "9px", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: GOLD, fontFamily: "'Lato',sans-serif" }}>Seller Dashboard Active</span>
                    </div>
                    <p className="lan-serif" style={{ fontSize: "20px", fontWeight: 700, color: "#fff", margin: "0 0 6px" }}>Manage Your Store</p>
                    <p style={{ fontSize: "12px", color: "rgba(245,240,232,0.55)", fontFamily: "'Lato',sans-serif" }}>Track earnings, manage uploads, and withdraw funds</p>
                  </div>
                  <button onClick={() => router.push("/my-account/seller-account")}
                    style={{ display: "inline-flex", alignItems: "center", gap: "7px", padding: "11px 20px", background: GOLD, color: NAVY, border: "none", fontSize: "12px", fontWeight: 700, cursor: "pointer", fontFamily: "'Lato',sans-serif", flexShrink: 0, transition: "background .18s" }}
                    onMouseEnter={e => e.currentTarget.style.background = GOLDD}
                    onMouseLeave={e => e.currentTarget.style.background = GOLD}>
                    Seller Dashboard <ChevronRight size={13} />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* ── RIGHT ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

            {/* Quick Actions */}
            <div style={{ background: "#fff", border: "0.5px solid #e5ddd0", padding: "22px" }}>
              <p style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: GOLD, marginBottom: "6px", fontFamily: "'Lato',sans-serif" }}>Navigate</p>
              <h3 className="lan-serif" style={{ fontSize: "18px", fontWeight: 700, color: NAVY, margin: "0 0 16px" }}>Quick Actions</h3>

              {[
                { href: "/documents",   icon: <Globe size={15} style={{ color: NAVY }} />,      title: "Browse Documents",  sub: "Explore the full library" },
                { href: "/my-books",icon: <BookOpen size={15} style={{ color: NAVY }} />,   title: "My Purchases",      sub: "Access bought materials" },
                ...(user.isSeller ? [
                  { href: "/my-account/seller-account/my-books", icon: <TrendingUp size={15} style={{ color: NAVY }} />, title: "My Uploads", sub: "Manage your documents" },
                  { href: "/upload-document", icon: <Store size={15} style={{ color: NAVY }} />, title: "Upload Document",  sub: "Add new material" },
                ] : []),
              ].map(({ href, icon, title, sub }) => (
                <Link key={href} href={href} className="action-row" style={{ marginBottom: "6px" }}>
                  <div style={{ width: "34px", height: "34px", border: "0.5px solid #e5ddd0", background: CREAM, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{icon}</div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: "12px", fontWeight: 700, color: NAVY, margin: "0 0 1px", fontFamily: "'Lato',sans-serif" }}>{title}</p>
                    <p style={{ fontSize: "11px", color: "#aaa", margin: 0, fontFamily: "'Lato',sans-serif" }}>{sub}</p>
                  </div>
                  <ChevronRight size={13} style={{ color: "#ccc", flexShrink: 0 }} />
                </Link>
              ))}
            </div>

            {/* Account Safety */}
            <div style={{ background: "#fff", border: "0.5px solid #e5ddd0", padding: "22px" }}>
              <p style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: GOLD, marginBottom: "6px", fontFamily: "'Lato',sans-serif" }}>Security</p>
              <h3 className="lan-serif" style={{ fontSize: "18px", fontWeight: 700, color: NAVY, margin: "0 0 14px" }}>Account Safety</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {[
                  { color: "#16a34a", label: "Email verified",         sub: user.email },
                  { color: user.isSeller ? "#16a34a" : "#f59e0b", label: user.isSeller ? "Seller account active" : "Standard account", sub: user.isSeller ? "Full access" : "Upgrade to sell" },
                ].map(({ color, label, sub }) => (
                  <div key={label} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "10px 14px", background: CREAM, border: "0.5px solid #e5ddd0" }}>
                    <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: color, flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: "12px", fontWeight: 700, color: NAVY, margin: 0, fontFamily: "'Lato',sans-serif" }}>{label}</p>
                      <p style={{ fontSize: "11px", color: "#aaa", margin: 0, fontFamily: "'Lato',sans-serif", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "180px" }}>{sub}</p>
                    </div>
                  </div>
                ))}
              </div>
              <button onClick={handleLogout}
                style={{ width: "100%", marginTop: "14px", padding: "11px", background: "transparent", color: "#dc2626", border: "0.5px solid #fecaca", fontSize: "12px", fontWeight: 700, cursor: "pointer", fontFamily: "'Lato',sans-serif", letterSpacing: "0.05em", display: "flex", alignItems: "center", justifyContent: "center", gap: "7px", transition: "all .18s" }}
                onMouseEnter={e => { e.currentTarget.style.background = "#fef2f2"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}>
                <LogOut size={13} /> Sign Out
              </button>
            </div>
          </div>
        </div>

        {/* ══ EDIT PROFILE MODAL ═══════════════════════════════════════ */}
        {isEditing && (
          <div className="modal-overlay">
            <div className="modal-inner mt-20">
              {/* header */}
              <div style={{ background: NAVY, padding: "20px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0 }} >
                <div>
                  <p style={{ fontSize: "10px", color: GOLD, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", margin: "0 0 3px", fontFamily: "'Lato',sans-serif" }}>Profile</p>
                  <h2 className="lan-serif" style={{ fontSize: "20px", fontWeight: 700, color: "#fff", margin: 0 }}>Edit Profile</h2>
                </div>
                <button onClick={() => setIsEditing(false)} style={{ width: "34px", height: "34px", border: "0.5px solid rgba(255,255,255,0.2)", background: "transparent", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "rgba(255,255,255,0.6)" }}>
                  <X size={15} />
                </button>
              </div>

              {/* avatar */}
              <div style={{ padding: "28px 24px 0", textAlign: "center" }} >
                <div style={{ position: "relative", display: "inline-block", marginBottom: "4px" }}>
                  {user.photoURL ? (
                    <img src={user.photoURL || user.photoBase64} alt="avatar" style={{ width: "88px", height: "88px", borderRadius: "50%", objectFit: "cover", border: `3px solid ${GOLD}` }} />
                  ) : (
                    <div style={{ width: "88px", height: "88px", borderRadius: "50%", background: GOLD, display: "flex", alignItems: "center", justifyContent: "center", border: `3px solid rgba(184,150,62,0.4)` }}>
                      <span style={{ fontFamily: "'Playfair Display',serif", fontSize: "28px", fontWeight: 700, color: NAVY }}>{initials}</span>
                    </div>
                  )}
                  <label style={{ position: "absolute", bottom: 0, right: 0, width: "28px", height: "28px", background: NAVY, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", border: "2px solid #fff" }}>
                    <Camera size={13} style={{ color: "#fff" }} />
                    <input type="file" accept="image/*" style={{ display: "none" }} onChange={handleImageUpload} disabled={uploading} />
                  </label>
                  {uploading && (
                    <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.45)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <div style={{ width: "20px", height: "20px", border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin .8s linear infinite" }} />
                    </div>
                  )}
                </div>
                <p style={{ fontSize: "11px", color: "#aaa", fontFamily: "'Lato',sans-serif", marginTop: "8px" }}>Click the camera to update photo</p>
              </div>

              {/* fields */}
              <div style={{ padding: "20px 24px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "12px" }}>
                  {[["First Name", "firstName"], ["Surname", "surname"]].map(([label, key]) => (
                    <div key={key}>
                      <label style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#888", display: "block", marginBottom: "6px", fontFamily: "'Lato',sans-serif" }}>{label}</label>
                      <input value={formData[key]} onChange={e => setFormData({ ...formData, [key]: e.target.value })} />
                    </div>
                  ))}
                </div>
                <div style={{ marginBottom: "12px" }}>
                  <label style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#888", display: "block", marginBottom: "6px", fontFamily: "'Lato',sans-serif" }}>Email</label>
                  <input value={user.email} disabled />
                </div>
                <div style={{ marginBottom: "20px" }}>
                  <label style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#888", display: "block", marginBottom: "6px", fontFamily: "'Lato',sans-serif" }}>Date of Birth</label>
                  <input type="date" value={formData.dateOfBirth} onChange={e => setFormData({ ...formData, dateOfBirth: e.target.value })} />
                </div>

                <div style={{ display: "flex", gap: "10px" }}>
                  <button onClick={() => setIsEditing(false)} style={{ flex: 1, padding: "13px", background: "#f5f5f5", color: "#666", border: "0.5px solid #e5ddd0", fontSize: "12px", fontWeight: 700, cursor: "pointer", fontFamily: "'Lato',sans-serif" }}>Cancel</button>
                  <button onClick={handleSave}
                    style={{ flex: 1, padding: "13px", background: NAVY, color: "#fff", border: "none", fontSize: "12px", fontWeight: 700, cursor: "pointer", fontFamily: "'Lato',sans-serif", display: "flex", alignItems: "center", justifyContent: "center", gap: "7px", transition: "background .18s" }}
                    onMouseEnter={e => e.currentTarget.style.background = "#1a3a6e"}
                    onMouseLeave={e => e.currentTarget.style.background = NAVY}>
                    <Save size={14} /> Save Changes
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}