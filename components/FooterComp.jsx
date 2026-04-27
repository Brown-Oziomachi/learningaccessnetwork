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
} from "lucide-react";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "@/lib/firebaseConfig";
import { doc, getDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";

export default function Footer() {
  const currentYear = new Date().getFullYear();
  const [checkingSeller, setCheckingSeller] = useState(true);
  const [isSeller, setIsSeller] = useState(false);
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const router = useRouter();

  const checkSellerStatus = async (userId) => {
    try {
      setCheckingSeller(true);
      const userDocRef = doc(db, "users", userId);
      const userDoc = await getDoc(userDocRef);
      if (userDoc.exists()) {
        const userData = userDoc.data();
        setIsSeller(userData.isSeller === true);
        setUserRole(userData.role || null);
      } else {
        setIsSeller(false);
        setUserRole(null);
      }
    } catch (error) {
      console.error("Error checking seller status:", error);
      setIsSeller(false);
      setUserRole(null);
    } finally {
      setCheckingSeller(false);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        await checkSellerStatus(currentUser.uid);
      } else {
        setIsSeller(false);
        setCheckingSeller(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const HandleClick = () => {
    if (!user) {
      router.push("/auth/signin");
      return;
    }
    if (isSeller) {
      router.push("/upload-document");
    } else {
      router.push("/become-seller");
    }
  };

  return (
    <footer
      className="text-amber-100 border-t"
      style={{
        background: "#0d2244",
        borderColor: "rgba(184,150,62,0.2)",
        fontFamily: "'Lato', sans-serif",
      }}
    >
      {/* Top divider accent */}
      <div
        style={{
          height: "2px",
          background:
            "linear-gradient(90deg, transparent, #b8963e, transparent)",
        }}
      />

      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Main Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">
          {/* Brand */}
          <div>
            <Link href="/home" className="flex flex-col flex-shrink-0 mb-4">
              <h1
                style={{
                  fontFamily: "'Playfair Display', Georgia, serif",
                  fontSize: "26px",
                  fontWeight: 700,
                  color: "#f5f0e8",
                  lineHeight: 1.1,
                }}
              >
                [LAN Library]
              </h1>
              <span
                style={{
                  fontFamily: "'Lato', sans-serif",
                  fontSize: "12px",
                  fontWeight: 300,
                  color: "#b8963e",
                  marginTop: "4px",
                }}
              >
                The Global Student Library
              </span>
            </Link>

            {/* Gold divider */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                marginBottom: "14px",
              }}
            >
              <div
                style={{
                  height: "1px",
                  flex: 1,
                  background: "#b8963e",
                  opacity: 0.4,
                }}
              />
              <div
                style={{
                  width: "6px",
                  height: "6px",
                  background: "#b8963e",
                  transform: "rotate(45deg)",
                }}
              />
              <div
                style={{
                  height: "1px",
                  flex: 1,
                  background: "#b8963e",
                  opacity: 0.4,
                }}
              />
            </div>

            <p
              style={{
                fontSize: "13px",
                color: "#a08c5b",
                lineHeight: 1.7,
                marginBottom: "12px",
              }}
            >
              Digital PDF library making knowledge accessible to everyone.
              Discover, learn, and grow with our extensive collection.
            </p>
            <div
              className="flex items-center gap-2"
              style={{ fontSize: "12px", color: "#b8963e" }}
            >
              <Book className="w-4 h-4" />
              <span>90M+ Documents Available</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4
              style={{
                fontSize: "11px",
                fontWeight: 700,
                color: "#b8963e",
                letterSpacing: "2px",
                textTransform: "uppercase",
                marginBottom: "16px",
              }}
            >
              Quick Links
            </h4>
            <ul className="space-y-2">
              {[
                { label: "About Us", href: "/about/lan" },
                { label: "Contact Us", href: "/contact/lan/4/enquiry" },
                { label: "How It Works", href: "/learn/make-money" },
                { label: "FAQs", href: "/lan/faqs" },
                { label: "Referral", href: "/referrals" },
                { label: "Transfer", href: "/transfer" },
                { label: "Help Center", href: "/lan/net/help-center" },
              ].map(({ label, href }) => (
                <li key={label}>
                  <Link
                    href={href}
                    className="group flex items-center gap-2 transition-colors"
                    style={{ fontSize: "13px", color: "#a08c5b" }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.color = "#d4aa5a")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.color = "#a08c5b")
                    }
                  >
                    <ArrowRight
                      className="w-3 h-3 transition-transform group-hover:translate-x-1"
                      style={{ color: "#b8963e" }}
                    />
                    {label}
                  </Link>
                </li>
              ))}
              <li>
                <button
                  onClick={HandleClick}
                  disabled={checkingSeller}
                  className="group flex items-center gap-2 transition-colors"
                  style={{
                    fontSize: "13px",
                    color: "#a08c5b",
                    background: "none",
                    border: "none",
                    padding: 0,
                    cursor: "pointer",
                  }}
                >
                  <ArrowRight
                    className="w-3 h-3"
                    style={{ color: "#b8963e" }}
                  />
                  {checkingSeller ? (
                    <span className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-3 w-3 border-b border-amber-400" />
                      Loading...
                    </span>
                  ) : isSeller ? (
                    "Upload"
                  ) : (
                    "Become a Seller"
                  )}
                </button>
              </li>
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h4
              style={{
                fontSize: "11px",
                fontWeight: 700,
                color: "#b8963e",
                letterSpacing: "2px",
                textTransform: "uppercase",
                marginBottom: "16px",
              }}
            >
              Categories
            </h4>
            <ul className="space-y-2">
              {[
                { label: "Education", href: "/category/education" },
                { label: "Business", href: "/category/business" },
                { label: "Technology", href: "/category/technology" },
                { label: "Science", href: "/category/science" },
                { label: "All Documents", href: "/documents" },
              ].map(({ label, href }) => (
                <li key={label}>
                  <Link
                    href={href}
                    className="group flex items-center gap-2 transition-colors"
                    style={{ fontSize: "13px", color: "#a08c5b" }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.color = "#d4aa5a")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.color = "#a08c5b")
                    }
                  >
                    <ArrowRight
                      className="w-3 h-3 transition-transform group-hover:translate-x-1"
                      style={{ color: "#b8963e" }}
                    />
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Customer Service */}
          <div>
            <h4
              style={{
                fontSize: "11px",
                fontWeight: 700,
                color: "#b8963e",
                letterSpacing: "2px",
                textTransform: "uppercase",
                marginBottom: "16px",
              }}
            >
              Customer Service
            </h4>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <Mail
                  className="w-4 h-4 mt-0.5 flex-shrink-0"
                  style={{ color: "#b8963e" }}
                />
                <a
                  href="mailto:support@lanlibrary.com"
                  style={{ fontSize: "13px", color: "#a08c5b" }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.color = "#d4aa5a")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.color = "#a08c5b")
                  }
                >
                  support@lanlibrary.com
                </a>
              </div>
              <div className="flex items-start gap-3">
                <Phone
                  className="w-4 h-4 mt-0.5 flex-shrink-0"
                  style={{ color: "#b8963e" }}
                />
                <a
                  href="tel:+2348142995114"
                  style={{ fontSize: "13px", color: "#a08c5b" }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.color = "#d4aa5a")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.color = "#a08c5b")
                  }
                >
                  +234 8142 995 114
                </a>
              </div>
              <div className="flex items-start gap-3">
                <MapPin
                  className="w-4 h-4 mt-0.5 flex-shrink-0"
                  style={{ color: "#b8963e" }}
                />
                <span style={{ fontSize: "13px", color: "#a08c5b" }}>
                  Abuja, Nigeria
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Social + Newsletter */}
        <div
          className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 py-8"
          style={{
            borderTop: "0.5px solid rgba(184,150,62,0.2)",
            borderBottom: "0.5px solid rgba(184,150,62,0.2)",
            marginBottom: "28px",
          }}
        >
          {/* Social */}
          <div>
            <h4
              style={{
                fontSize: "11px",
                fontWeight: 700,
                color: "#b8963e",
                letterSpacing: "2px",
                textTransform: "uppercase",
                marginBottom: "12px",
              }}
            >
              Connect With Us
            </h4>
            <a
              href="https://youtube.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="YouTube"
              className="flex items-center justify-center transition-all"
              style={{
                width: "38px",
                height: "38px",
                borderRadius: "50%",
                border: "0.5px solid rgba(184,150,62,0.4)",
                background: "rgba(184,150,62,0.08)",
                color: "#b8963e",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(184,150,62,0.2)";
                e.currentTarget.style.borderColor = "#b8963e";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(184,150,62,0.08)";
                e.currentTarget.style.borderColor = "rgba(184,150,62,0.4)";
              }}
            >
              <Youtube className="w-4 h-4" />
            </a>
          </div>

          {/* Newsletter */}
          <div className="w-full md:w-auto">
            <h4
              style={{
                fontSize: "11px",
                fontWeight: 700,
                color: "#b8963e",
                letterSpacing: "2px",
                textTransform: "uppercase",
                marginBottom: "12px",
              }}
            >
              Stay Updated
            </h4>
            <div className="flex gap-2">
              <input
                type="email"
                placeholder="Enter your email"
                style={{
                  flex: 1,
                  minWidth: "200px",
                  padding: "9px 14px",
                  background: "rgba(184,150,62,0.06)",
                  border: "0.5px solid rgba(184,150,62,0.3)",
                  borderRadius: "8px",
                  fontSize: "13px",
                  color: "#f5f0e8",
                  outline: "none",
                  fontFamily: "'Lato', sans-serif",
                }}
              />
              <button
                style={{
                  background: "#b8963e",
                  color: "#0d2244",
                  border: "none",
                  borderRadius: "8px",
                  padding: "9px 18px",
                  fontSize: "13px",
                  fontWeight: 700,
                  cursor: "pointer",
                  fontFamily: "'Lato', sans-serif",
                  whiteSpace: "nowrap",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "#d4aa5a")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "#b8963e")
                }
              >
                Subscribe
              </button>
            </div>
            <p style={{ fontSize: "11px", color: "#6b5a35", marginTop: "6px" }}>
              Get the latest books and updates delivered to your inbox
            </p>
          </div>
        </div>

        {/* Payment Methods */}
        <div className="mb-8 text-center">
          <h4
            style={{
              fontSize: "11px",
              fontWeight: 700,
              color: "#b8963e",
              letterSpacing: "2px",
              textTransform: "uppercase",
              marginBottom: "18px",
            }}
          >
            Safe &amp; Secure Payment Methods
          </h4>
          <div className="flex flex-wrap items-center justify-center gap-3 mb-4">
            {/* Flutterwave */}
            <div
              className="flex items-center gap-2 px-4 py-2 rounded-lg"
              style={{
                background: "rgba(184,150,62,0.08)",
                border: "0.5px solid rgba(184,150,62,0.3)",
              }}
            >
              <span style={{ fontSize: "11px", color: "#b8963e" }}>
                Powered by
              </span>
              <span
                style={{ fontSize: "14px", fontWeight: 700, color: "#d4aa5a" }}
              >
                Flutterwave
              </span>
            </div>

            {[
              {
                label: "Card",
                bg: "#1e3a6e",
                icon: <CreditCard className="w-3.5 h-3.5 text-amber-300" />,
              },
              {
                label: "Bank Transfer",
                bg: "#14532d",
                icon: <Building2 className="w-3.5 h-3.5 text-amber-300" />,
              },
              {
                label: "USSD",
                bg: "#3b1a6b",
                icon: <Smartphone className="w-3.5 h-3.5 text-amber-300" />,
              },
              {
                label: "eNaira",
                bg: "#0f4a44",
                icon: <Wallet className="w-3.5 h-3.5 text-amber-300" />,
              },
            ].map(({ label, bg, icon }) => (
              <div
                key={label}
                className="flex items-center gap-2 px-3 py-2 rounded-lg"
                style={{
                  background: bg,
                  border: "0.5px solid rgba(184,150,62,0.2)",
                }}
              >
                {icon}
                <span
                  style={{
                    fontSize: "12px",
                    fontWeight: 700,
                    color: "#d4aa5a",
                  }}
                >
                  {label}
                </span>
              </div>
            ))}
          </div>
          <p
            style={{
              fontSize: "11px",
              color: "#6b5a35",
              maxWidth: "480px",
              margin: "0 auto",
            }}
          >
            All transactions are encrypted and secured with industry-standard
            SSL technology.
          </p>
        </div>

        {/* Bottom Bar */}
        <div
          className="flex flex-col md:flex-row justify-between items-center gap-4 pt-6"
          style={{ borderTop: "0.5px solid rgba(184,150,62,0.2)" }}
        >
          <p style={{ fontSize: "12px", color: "#6b5a35" }}>
            &copy; {currentYear} [ LAN Library ] Learning Access Network. All
            rights reserved.
          </p>
          <div className="flex items-center gap-6">
            {[
              { label: "Privacy Policy", href: "/lan/privacy-policy" },
              { label: "Terms of Service", href: "/lan/terms-of-service" },
            ].map(({ label, href }) => (
              <Link
                key={label}
                href={href}
                style={{ fontSize: "12px", color: "#6b5a35" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#b8963e")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "#6b5a35")}
              >
                {label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Back to Top */}
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        className="fixed bottom-8 right-8 w-12 h-12 rounded-full flex items-center justify-center z-40 transition-all duration-300 hover:scale-110"
        style={{ background: "#b8963e", border: "none", cursor: "pointer" }}
        aria-label="Back to top"
      >
        <ArrowRight
          className="w-5 h-5 -rotate-90"
          style={{ color: "#0d2244" }}
        />
      </button>
    </footer>
  );
}
