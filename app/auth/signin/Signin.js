"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { AlertCircle, CheckCircle, Sparkles } from "lucide-react";
import GoogleSignInButton from "@/components/auth/GoogleSignInButton";
import { handleEmailPasswordSignIn } from "@/lib/auth/authHelpers";
import { useAuth } from "@/hooks/useAuth";

const NAVY = "#0d2244";
const GOLD = "#b8963e";
const GOLDD = "#d4aa5a";
const CREAM = "#f5f0e8";
const BG = "#f5f1ea";

export default function SignInClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { loading: authLoading } = useAuth(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [loginData, setLoginData] = useState({ email: "", password: "" });

  useEffect(() => {
    const passwordReset = searchParams.get("passwordReset");
    if (passwordReset === "success") {
      setSuccessMessage("Password reset successful! Please sign in with your new password.");
      setTimeout(() => router.replace("/auth/signin", { scroll: false }), 100);
    }
    const prefilledEmail = searchParams.get("email");
    if (prefilledEmail) setLoginData((prev) => ({ ...prev, email: prefilledEmail }));
    const reason = searchParams.get("reason");
    if (reason === "deactivated") setError("deactivated");
  }, [searchParams, router]);

  const handleLogin = async () => {
    if (!loginData.email || !loginData.password) { setError("Please fill in all fields"); return; }
    setLoading(true); setError(null);
    try {
      const result = await handleEmailPasswordSignIn(loginData.email.toLowerCase().trim(), loginData.password);
      if (result.success) {
        router.push("/home");
      } else {
        const code = result.error?.code || "";
        if (code === "auth/account-deactivated") setError("deactivated");
        else if (code === "auth/account-suspended") setError("suspended");
        else if (code === "auth/account-pending") setError("pending");
        else if (code === "auth/invalid-credential") setError("Incorrect email or password.");
        else if (code === "auth/too-many-requests") setError("Too many attempts. Try again later.");
        else setError(result.error?.message || "Login failed. Please try again.");
      }
    } catch { setError("Something went wrong. Please try again."); }
    finally { setLoading(false); }
  };

  if (authLoading) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: BG }}>
      <div style={{ width: 40, height: 40, border: `3px solid rgba(13,34,68,0.1)`, borderTopColor: NAVY, borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  const bannerProps = {
    deactivated: { color: "#dc2626", title: "Account Deactivated", body: "This account has been deactivated. Contact support if you'd like to restore access." },
    suspended:   { color: "#dc2626", title: "Account Suspended",   body: "This account has been suspended due to a violation of our Terms of Service." },
    pending:     { color: "#d97706", title: "Account Under Review", body: "Your account is currently under review. You'll be notified once approved." },
  };
  const activeBanner = bannerProps[error];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400&family=Lato:wght@300;400;700&display=swap');
        .lan-serif { font-family: 'Playfair Display', Georgia, serif; }
        .lan-root  { font-family: 'Lato', sans-serif; }
        .hero-bg {
          background-color: ${NAVY};
          background-image:
            radial-gradient(rgba(184,150,62,0.06) 1px, transparent 1px),
            radial-gradient(rgba(255,255,255,0.03) 1px, transparent 1px);
          background-size: 28px 28px, 14px 14px;
          background-position: 0 0, 7px 7px;
        }
        .lan-input {
          width: 100%; padding: 13px 16px;
          background: #fff; border: 0.5px solid #e5ddd0;
          font-family: 'Lato', sans-serif; font-size: 13px; color: ${NAVY};
          outline: none; transition: border-color 0.15s; margin-bottom: 12px;
          box-sizing: border-box;
        }
        .lan-input:focus { border-color: ${GOLD}; }
        .lan-input::placeholder { color: #bbb; }
        .btn-primary {
          width: 100%; padding: 14px; background: ${NAVY}; color: #fff;
          border: none; font-family: 'Lato', sans-serif; font-size: 13px;
          font-weight: 700; letter-spacing: 0.04em; cursor: pointer; transition: background 0.15s;
        }
        .btn-primary:hover:not(:disabled) { background: #162d57; }
        .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
        .btn-outline {
          display: block; width: 100%; padding: 14px; text-align: center;
          background: transparent; color: ${NAVY}; border: 0.5px solid ${NAVY};
          font-family: 'Lato', sans-serif; font-size: 13px; font-weight: 700;
          letter-spacing: 0.04em; cursor: pointer; text-decoration: none;
          transition: background 0.15s; box-sizing: border-box;
        }
        .btn-outline:hover { background: rgba(13,34,68,0.05); }
        .divider { display: flex; align-items: center; gap: 12px; margin: 20px 0; }
        .divider::before, .divider::after { content: ''; flex: 1; height: 0.5px; background: #e5ddd0; }
        .divider span { font-size: 11px; color: #bbb; }
        @keyframes slideUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
        .anim-up  { animation: slideUp 0.55s cubic-bezier(0.4,0,0.2,1) both; }
        .anim-up2 { animation: slideUp 0.55s 0.1s cubic-bezier(0.4,0,0.2,1) both; }
        .anim-up3 { animation: slideUp 0.55s 0.2s cubic-bezier(0.4,0,0.2,1) both; }
        @keyframes spin { to { transform: rotate(360deg); } }

        /* ── Responsive ── */
        .signin-body { flex: 1; display: flex; }
        .signin-left { width: 46%; padding: 56px 48px; display: flex; flex-direction: column; justify-content: center; }
        .signin-right { flex: 1; background: ${BG}; padding: 48px 48px; display: flex; align-items: center; justify-content: center; }

        @media (max-width: 768px) {
          .signin-body { flex-direction: column; }
          .signin-left { width: 100%; padding: 40px 24px 32px; }
          .signin-left h1 { font-size: 36px !important; }
          .signin-left p { display: none; }
          .signin-stats { display: none !important; }
          .signin-right { padding: 32px 24px 48px; align-items: flex-start; }
          .signin-right > div { max-width: 100% !important; }
        }

        @media (max-width: 480px) {
          .signin-left { padding: 28px 20px 24px; }
          .signin-right { padding: 24px 20px 40px; }
          header { padding: 14px 20px !important; }
        }
      `}</style>

      <div className="lan-root" style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>

        {/* ── Header ── */}
        <header className="hero-bg" style={{ padding: "18px 32px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span className="lan-serif" style={{ fontSize: 20, fontWeight: 900, color: "#fff", letterSpacing: -0.5 }}>
            [LAN <span style={{ color: GOLD, fontStyle: "italic" }}>Library</span>]
          </span>
          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.45)" }}>The Global Student Library 📚</span>
        </header>

        {/* ── Body: two-column (stacks on mobile) ── */}
        <div className="signin-body">

          {/* LEFT — navy editorial panel */}
          <div className="hero-bg signin-left">

            <div className="anim-up" style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(184,150,62,0.14)", border: "1px solid rgba(184,150,62,0.3)", borderRadius: 999, padding: "6px 14px", marginBottom: 24, width: "fit-content" }}>
              <Sparkles size={12} color={GOLD} />
              <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: GOLDD }}>Africa's #1 Student Library</span>
            </div>

            <h1 className="lan-serif anim-up2" style={{ fontSize: "clamp(32px,4vw,52px)", fontWeight: 900, color: "#fff", lineHeight: 1.05, letterSpacing: -1, marginBottom: 18 }}>
              Welcome back,<br />
              <span style={{ color: GOLD, fontStyle: "italic" }}>Scholar.</span>
            </h1>

            <p className="anim-up3" style={{ fontSize: 13, color: "rgba(245,240,232,0.65)", lineHeight: 1.8, fontWeight: 300, maxWidth: 320, marginBottom: 36 }}>
              Access your library of 90 million academic documents, past questions, and lecture notes — all in one place.
            </p>

            <div className="signin-stats" style={{ borderTop: "0.5px solid rgba(184,150,62,0.2)", paddingTop: 24, display: "flex", gap: 0 }}>
              {[{ v: "90M+", l: "Documents" }, { v: "2.4M+", l: "Learners" }, { v: "Free", l: "Basic Access" }].map(({ v, l }, i) => (
                <div key={l} style={{ flex: 1, paddingRight: 16, borderRight: i < 2 ? "0.5px solid rgba(184,150,62,0.12)" : "none", marginRight: i < 2 ? 16 : 0 }}>
                  <div className="lan-serif" style={{ fontSize: 22, fontWeight: 700, color: "#fff" }}>{v}</div>
                  <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(184,150,62,0.7)", marginTop: 3 }}>{l}</div>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT — form */}
          <div className="signin-right">
            <div style={{ width: "100%", maxWidth: 380, }} >

              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: GOLD, marginBottom: 8 }}>Scholar Access</p>
              <h2 className="lan-serif" style={{ fontSize: 26, fontWeight: 700, color: NAVY, marginBottom: 6 }}>Sign into your account</h2>
              <div style={{ width: 36, height: 3, background: GOLD, marginBottom: 28 }} />

              {/* Success */}
              {successMessage && (
                <div style={{ background: "#f0fdf4", border: "0.5px solid #bbf7d0", padding: "12px 16px", display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 20 }}>
                  <CheckCircle size={15} color="#16a34a" style={{ flexShrink: 0, marginTop: 1 }} />
                  <p style={{ fontSize: 12, color: "#15803d" }}>{successMessage}</p>
                </div>
              )}

              {/* Status banners */}
              {activeBanner && (
                <div style={{ background: activeBanner.color, padding: "20px 20px", marginBottom: 20, textAlign: "center" }}>
                  <AlertCircle size={28} color="#fff" style={{ margin: "0 auto 8px" }} />
                  <p style={{ color: "#fff", fontWeight: 900, fontSize: 15, marginBottom: 6 }}>{activeBanner.title}</p>
                  <p style={{ color: "rgba(255,255,255,0.8)", fontSize: 12, marginBottom: 14, lineHeight: 1.6 }}>{activeBanner.body}</p>
                  <a href="mailto:support@lanlibrary.com" style={{ display: "inline-block", background: "#fff", color: activeBanner.color, fontWeight: 700, fontSize: 11, padding: "7px 18px", textDecoration: "none" }}>Contact Support</a>
                </div>
              )}

              {/* Generic error */}
              {error && !activeBanner && (
                <div style={{ background: "#fef2f2", border: "0.5px solid #fecaca", padding: "12px 16px", display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 16 }}>
                  <AlertCircle size={15} color="#dc2626" style={{ flexShrink: 0, marginTop: 1 }} />
                  <p style={{ fontSize: 12, color: "#991b1b" }}>Your Network is Bad</p>
                </div>
              )}

              <div className="divider"><span>Continue with email</span></div>

              <input className="lan-input" type="email" placeholder="Email address"
                value={loginData.email}
                onChange={(e) => { setLoginData((p) => ({ ...p, email: e.target.value })); setError(null); setSuccessMessage(null); }}
                disabled={loading}
              />
              <input className="lan-input" type="password" placeholder="Password"
                value={loginData.password}
                onChange={(e) => { setLoginData((p) => ({ ...p, password: e.target.value })); setError(null); setSuccessMessage(null); }}
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                disabled={loading}
              />

              <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 20 }}>
                <Link href="/auth/forgot-password" style={{ fontSize: 12, color: NAVY, textDecoration: "none", fontWeight: 700 }}>Forgotten password?</Link>
              </div>

              <button className="btn-primary" onClick={handleLogin} disabled={loading} style={{ marginBottom: 10 }}>
                {loading ? (
                  <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                    <span style={{ width: 12, height: 12, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", display: "inline-block", animation: "spin 0.7s linear infinite" }} />
                    Logging in…
                  </span>
                ) : "Log In"}
              </button>

              <div className="divider"><span>or</span></div>

              <Link href="/auth/signup" className="btn-outline" style={{ marginBottom: 0 }}>Create new account</Link>

              <p style={{ fontSize: 11, color: "#bbb", textAlign: "center", marginTop: 20 }}>Learning Access Network &nbsp;·&nbsp; Africa's Student Library</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}