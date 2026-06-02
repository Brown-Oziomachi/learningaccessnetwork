"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Book,
  Mail,
  Phone,
  MapPin,
  Youtube,
  ArrowRight,
  CreditCard,
  Building2,
  Smartphone,
  Wallet,
  Star,
} from "lucide-react";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "@/lib/firebaseConfig";
import { doc, getDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";

const NAVY = "#0d2244";
const GOLD = "#b8963e";
const GOLDD = "#d4aa5a";
const CREAM = "#f5f0e8";

const FOOTER_COLUMNS = [
  {
    heading: "For Students",
    links: [
      { label: "AI Tutor", href: "/students/ai-tutor" },
      { label: "My Library", href: "/students/my-library" },
      { label: "How to Buy", href: "/students/how-to-buy" },
      { label: "Past Questions", href: "/students/past-questions" },
      { label: "Study Groups", href: "/students/study-groups" },
      { label: "Saved", href: "/students/wishlist" },
      { label: "Student Network", href: "/students/network" },
    ],
  },
  {
    heading: "For Sellers",
    links: [
      { label: "Seller Network", href: "/seller/network" },
      { label: "Upload Document", href: "/seller/upload-document" },
      { label: "LAN Wallet", href: "/seller/lan-wallet" },
      { label: "Withdraw Earnings", href: "/seller/withdraw-earnings" },
      { label: "Referral Programme", href: "/seller/referral" },
      { label: "Seller Dashboard", href: "/seller/seller-dashboard" },
      { label: "Recharge Services", href: "/seller/recharge-services" },
    ],
  },
  {
    heading: "For Faculty",
    links: [
      { label: "Faculty Network", href: "/faculty/network" },
      { label: "Faculty Verification", href: "/faculty/verify" },
      { label: "Upload Materials", href: "/faculty/upload" },
      { label: "Faculty Dashboard", href: "/faculty/dashboard" },
      { label: "Withdraw Earnings", href: "/faculty/withdraw" },
      { label: "Recharge Services", href: "/faculty/recharge" },
      { label: "Referral Programme", href: "/faculty/referral" },
    ],
  },
  {
    heading: "Quick Links",
    links: [
      { label: "About LAN", href: "/about/lan" },
      { label: "Contact Us", href: "/contact/lan/4/enquiry" },
      { label: "Help Centre", href: "/lan/net/help-center" },
      { label: "Documentation", href: "/docs" },
      { label: "Invite a Friend", href: "/ref/invite-friends" },
      { label: "Social Impact", href: "/social-impart" },
      { label: "Privacy Policy", href: "/lan/privacy-policy" },
      { label: "Terms of Service", href: "/lan/terms-of-service" },
      { label: "User Agreement", href: "/user-agreement=lib" },
      { label: "Author Development Series", href: "/writers-mindset" },
    ],
  },
  {
    heading: "Categories",
    links: [
      { label: "Education", href: "/category/education" },
      { label: "Past Questions", href: "/category/past-questions" },
      { label: "Lecture Notes", href: "/category/lecture-notes" },
      { label: "Engineering", href: "/category/engineering" },
      { label: "Medicine & Health", href: "/category/medicine" },
      { label: "Law", href: "/category/law" },
      { label: "Business", href: "/category/business" },
      { label: "Technology", href: "/category/technology" },
      { label: "Science", href: "/category/science" },
      { label: "All Documents", href: "/documents" },
    ],
  },
];

export default function Footer() {
  const currentYear = new Date().getFullYear();
  const [checkingSeller, setCheckingSeller] = useState(true);
  const [isSeller, setIsSeller] = useState(false);
  const [user, setUser] = useState(null);
  const router = useRouter();

  const checkSellerStatus = async (userId) => {
    try {
      setCheckingSeller(true);
      const snap = await getDoc(doc(db, "users", userId));
      if (snap.exists()) setIsSeller(snap.data().isSeller === true);
      else setIsSeller(false);
    } catch {
      setIsSeller(false);
    } finally {
      setCheckingSeller(false);
    }
  };

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) await checkSellerStatus(u.uid);
      else {
        setIsSeller(false);
        setCheckingSeller(false);
      }
    });
    return () => unsub();
  }, []);

  const handleUploadClick = () => {
    if (!user) {
      router.push("/auth/signin");
      return;
    }
    if (isSeller) router.push("/upload-document");
    else router.push("/become-seller");
  };

  return (
    <footer
      style={{
        background: NAVY,
        borderTop: "0.5px solid rgba(184,150,62,0.2)",
        fontFamily: "'Lato', sans-serif",
      }}
    >
      {/* gold accent line */}
      <div
        style={{
          height: 2,
          background: "linear-gradient(90deg,transparent,#b8963e,transparent)",
        }}
      />

      <div
        style={{ maxWidth: 1200, margin: "0 auto", padding: "64px 20px 32px" }}
      >
        {/* ── TOP GRID ── */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
            gap: 32,
            marginBottom: 48,
          }}
        >
          {/* Brand col */}
          <div>
            <Link
              href="/home"
              style={{
                textDecoration: "none",
                display: "block",
                marginBottom: 16,
              }}
            >
              <div
                style={{
                  fontFamily: "'Playfair Display', Georgia, serif",
                  fontSize: 26,
                  fontWeight: 700,
                  color: CREAM,
                  lineHeight: 1.1,
                }}
              >
                LAN Library
              </div>
              <div
                style={{
                  fontFamily: "'Lato', sans-serif",
                  fontSize: 12,
                  fontWeight: 300,
                  color: GOLD,
                  marginTop: 4,
                }}
              >
                The Global Student Library
              </div>
            </Link>

            {/* gold divider */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 14,
              }}
            >
              <div
                style={{ height: 1, flex: 1, background: GOLD, opacity: 0.4 }}
              />
              <div
                style={{
                  width: 6,
                  height: 6,
                  background: GOLD,
                  transform: "rotate(45deg)",
                }}
              />
              <div
                style={{ height: 1, flex: 1, background: GOLD, opacity: 0.4 }}
              />
            </div>

            <p
              style={{
                fontSize: 13,
                color: "#a08c5b",
                lineHeight: 1.7,
                marginBottom: 12,
              }}
            >
              Africa's #1 Student Library. Share the wealth of knowledge with
              90M+ learners worldwide.
            </p>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                fontSize: 12,
                color: GOLD,
              }}
            >
              <Book size={14} />
              <span>90M+ Documents Available</span>
            </div>

            {/* contact block */}
            <div
              style={{
                marginTop: 20,
                display: "flex",
                flexDirection: "column",
                gap: 10,
              }}
            >
              {[
                {
                  icon: <Mail size={13} />,
                  val: "support@lanlibrary.com",
                  href: "mailto:support@lanlibrary.com",
                },
                {
                  icon: <Phone size={13} />,
                  val: "+234 8142 995 114",
                  href: "tel:+2348142995114",
                },
                {
                  icon: <MapPin size={13} />,
                  val: "Abuja, Nigeria",
                  href: null,
                },
              ].map(({ icon, val, href }) => (
                <div
                  key={val}
                  style={{ display: "flex", alignItems: "flex-start", gap: 8 }}
                >
                  <span style={{ color: GOLD, marginTop: 1, flexShrink: 0 }}>
                    {icon}
                  </span>
                  {href ? (
                    <a
                      href={href}
                      style={{
                        fontSize: 12,
                        color: "#a08c5b",
                        textDecoration: "none",
                        transition: "color .15s",
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.color = GOLDD)
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.color = "#a08c5b")
                      }
                    >
                      {val}
                    </a>
                  ) : (
                    <span style={{ fontSize: 12, color: "#a08c5b" }}>
                      {val}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Dynamic link columns */}
          {FOOTER_COLUMNS.map(({ heading, links }) => (
            <div key={heading}>
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: ".18em",
                  textTransform: "uppercase",
                  color: GOLD,
                  marginBottom: 18,
                  fontFamily: "'Lato',sans-serif",
                }}
              >
                {heading}
              </div>
              <ul
                style={{
                  listStyle: "none",
                  padding: 0,
                  margin: 0,
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                }}
              >
                {links.map(({ label, href }) => (
                  <li key={label}>
                    <Link
                      href={href}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        fontSize: 13,
                        color: "#a08c5b",
                        textDecoration: "none",
                        transition: "color .15s",
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.color = GOLDD)
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.color = "#a08c5b")
                      }
                    >
                      <ArrowRight
                        size={11}
                        style={{ color: GOLD, flexShrink: 0 }}
                      />
                      {label}
                    </Link>
                  </li>
                ))}
                {/* Upload/Become Seller button only in For Sellers column */}
                {heading === "For Sellers" && (
                  <li>
                    <button
                      onClick={handleUploadClick}
                      disabled={checkingSeller}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        fontSize: 13,
                        color: "#a08c5b",
                        background: "none",
                        border: "none",
                        padding: 0,
                        cursor: "pointer",
                        fontFamily: "'Lato',sans-serif",
                        transition: "color .15s",
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.color = GOLDD)
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.color = "#a08c5b")
                      }
                    >
                      <ArrowRight
                        size={11}
                        style={{ color: GOLD, flexShrink: 0 }}
                      />
                      {checkingSeller
                        ? "Loading…"
                        : isSeller
                          ? "Upload a Document"
                          : "Become a Seller"}
                    </button>
                  </li>
                )}
              </ul>
            </div>
          ))}
        </div>

        {/* ── SOCIAL + NEWSLETTER ── */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: 24,
            borderTop: "0.5px solid rgba(184,150,62,0.2)",
            borderBottom: "0.5px solid rgba(184,150,62,0.2)",
            padding: "32px 0",
            marginBottom: 32,
          }}
        >
          {/* Social */}
          <div>
            <div
              style={{
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: ".18em",
                textTransform: "uppercase",
                color: GOLD,
                marginBottom: 12,
              }}
            >
              Connect With Us
            </div>
            <a
              href="https://youtube.com"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                width: 38,
                height: 38,
                borderRadius: "50%",
                border: "0.5px solid rgba(184,150,62,0.4)",
                background: "rgba(184,150,62,0.08)",
                color: GOLD,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "background .18s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(184,150,62,0.2)";
                e.currentTarget.style.borderColor = GOLD;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(184,150,62,0.08)";
                e.currentTarget.style.borderColor = "rgba(184,150,62,0.4)";
              }}
            >
              <Youtube size={15} />
            </a>
          </div>

          {/* Newsletter */}
          <div style={{ flex: "1 1 300px", maxWidth: 480 }}>
            <div
              style={{
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: ".18em",
                textTransform: "uppercase",
                color: GOLD,
                marginBottom: 12,
              }}
            >
              Stay Updated
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <input
                type="email"
                placeholder="Enter your email"
                style={{
                  flex: 1,
                  minWidth: 0,
                  padding: "9px 14px",
                  background: "rgba(184,150,62,0.06)",
                  border: "0.5px solid rgba(184,150,62,0.3)",
                  fontSize: 13,
                  color: CREAM,
                  outline: "none",
                  fontFamily: "'Lato', sans-serif",
                }}
              />
              <button
                style={{
                  background: GOLD,
                  color: NAVY,
                  border: "none",
                  padding: "9px 18px",
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: "pointer",
                  fontFamily: "'Lato', sans-serif",
                  whiteSpace: "nowrap",
                  transition: "background .18s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = GOLDD)}
                onMouseLeave={(e) => (e.currentTarget.style.background = GOLD)}
              >
                Subscribe
              </button>
            </div>
            <p style={{ fontSize: 11, color: "#6b5a35", marginTop: 6 }}>
              Get the latest books and updates delivered to your inbox
            </p>
          </div>
        </div>

        {/* ── PAYMENT METHODS ── */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div
            style={{
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: ".18em",
              textTransform: "uppercase",
              color: GOLD,
              marginBottom: 18,
            }}
          >
            Safe &amp; Secure Payment Methods
          </div>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
              marginBottom: 12,
            }}
          >
            {/* Flutterwave badge */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "7px 14px",
                background: "rgba(184,150,62,0.08)",
                border: "0.5px solid rgba(184,150,62,0.3)",
              }}
            >
              <span style={{ fontSize: 11, color: GOLD }}>Powered by</span>
              <span style={{ fontSize: 14, fontWeight: 700, color: GOLDD }}>
                Flutterwave
              </span>
            </div>
            {[
              {
                label: "Card",
                bg: "#1e3a6e",
                icon: <CreditCard size={13} style={{ color: GOLDD }} />,
              },
              {
                label: "Bank Transfer",
                bg: "#14532d",
                icon: <Building2 size={13} style={{ color: GOLDD }} />,
              },
              {
                label: "USSD",
                bg: "#3b1a6b",
                icon: <Smartphone size={13} style={{ color: GOLDD }} />,
              },
              {
                label: "eNaira",
                bg: "#0f4a44",
                icon: <Wallet size={13} style={{ color: GOLDD }} />,
              },
            ].map(({ label, bg, icon }) => (
              <div
                key={label}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "7px 12px",
                  background: bg,
                  border: "0.5px solid rgba(184,150,62,0.2)",
                }}
              >
                {icon}
                <span style={{ fontSize: 12, fontWeight: 700, color: GOLDD }}>
                  {label}
                </span>
              </div>
            ))}
          </div>
          <p
            style={{
              fontSize: 11,
              color: "#6b5a35",
              maxWidth: 480,
              margin: "0 auto",
            }}
          >
            All transactions are encrypted and secured with industry-standard
            SSL technology.
          </p>
        </div>

        {/* ── BOTTOM BAR ── */}
        <div
          style={{
            borderTop: "0.5px solid rgba(184,150,62,0.2)",
            paddingTop: 24,
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12,
          }}
        >
          <p style={{ fontSize: 12, color: "#6b5a35" }}>
            © {currentYear} LAN Library — Learning Access Network. All rights
            reserved.
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: "#22c55e",
              }}
            />
            <span style={{ fontSize: 11, color: "rgba(245,240,232,0.4)" }}>
              All systems operational
            </span>
          </div>
          <div style={{ display: "flex", gap: 20 }}>
            {[
              { label: "Privacy Policy", href: "/lan/privacy-policy" },
              { label: "Terms of Service", href: "/lan/terms-of-service" },
            ].map(({ label, href }) => (
              <Link
                key={label}
                href={href}
                style={{
                  fontSize: 12,
                  color: "#6b5a35",
                  textDecoration: "none",
                  transition: "color .15s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = GOLD)}
                onMouseLeave={(e) => (e.currentTarget.style.color = "#6b5a35")}
              >
                {label}
              </Link>
            ))}
          </div>
        </div>

        {/* legal note */}
        <p
          style={{
            fontSize: 10,
            color: "rgba(245,240,232,0.25)",
            textAlign: "center",
            marginTop: 20,
            lineHeight: 1.7,
          }}
        >
          LAN Library is operated by Learning Access Network Ltd., a digital
          academic resource platform dedicated to connecting African students
          and educators with quality learning materials. We are headquartered in
          Abuja, Nigeria, and serve learners within the African continent.
        </p>
      </div>

      {/* Back to top */}
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        style={{
          position: "fixed",
          bottom: 28,
          right: 28,
          width: 44,
          height: 44,
          borderRadius: "50%",
          background: GOLD,
          border: "none",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 4px 16px rgba(184,150,62,0.4)",
          transition: "transform .2s, background .18s",
          zIndex: 40,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "scale(1.1)";
          e.currentTarget.style.background = GOLDD;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "scale(1)";
          e.currentTarget.style.background = GOLD;
        }}
        aria-label="Back to top"
      >
        <ArrowRight
          size={18}
          style={{ color: NAVY, transform: "rotate(-90deg)" }}
        />
      </button>
    </footer>
  );
}
