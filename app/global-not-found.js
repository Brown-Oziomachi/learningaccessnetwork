import "./globals.css";
import { Inter } from "next/font/google";
import GoHomeButton from "@/components/GoHomeButton";
import { BookOpen, Sparkles } from "lucide-react";

const inter = Inter({ subsets: ["latin"] });

const NAVY  = "#0d2244";
const GOLD  = "#b8963e";
const CREAM = "#f5f0e8";

export default function GlobalNotFound() {
  return (
    <html lang="en" className={inter.className}>
      <body
        style={{
          minHeight: "100vh",
          background: NAVY,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px",
          color: "#fff",
          fontFamily: "Lato, sans-serif",
        }}
      >

        {/* Background pattern (same vibe as landing) */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: `
              radial-gradient(rgba(184,150,62,0.07) 1px, transparent 1px),
              radial-gradient(rgba(255,255,255,0.03) 1px, transparent 1px)
            `,
            backgroundSize: "28px 28px, 14px 14px",
            backgroundPosition: "0 0, 7px 7px",
            zIndex: 0,
          }}
        />

        {/* CARD */}
        <div
          style={{
            position: "relative",
            zIndex: 2,
            background: "#fff",
            border: "1px solid rgba(184,150,62,0.2)",
            borderRadius: "16px",
            padding: "40px 28px",
            maxWidth: 420,
            width: "100%",
            textAlign: "center",
            boxShadow: "0 30px 60px rgba(0,0,0,0.25)",
          }}
        >

          {/* Badge */}
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              background: "rgba(184,150,62,0.12)",
              border: "1px solid rgba(184,150,62,0.25)",
              borderRadius: 999,
              padding: "6px 14px",
              marginBottom: 20,
            }}
          >
            <Sparkles size={12} style={{ color: GOLD }} />
            <span
              style={{
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: ".14em",
                textTransform: "uppercase",
                color: GOLD,
              }}
            >
              LAN Library
            </span>
          </div>

          {/* Icon */}
          <div
            style={{
              width: 72,
              height: 72,
              margin: "0 auto 18px",
              borderRadius: "50%",
              background: "rgba(184,150,62,0.12)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <BookOpen size={30} style={{ color: GOLD }} />
          </div>

          {/* Title */}
          <h1
            style={{
              fontFamily: "Playfair Display, serif",
              fontSize: 28,
              fontWeight: 900,
              color: NAVY,
              marginBottom: 8,
            }}
          >
            Page Not Found
          </h1>

          {/* Subtitle */}
          <p
            style={{
              fontSize: 13,
              color: "#888",
              lineHeight: 1.7,
              marginBottom: 28,
            }}
          >
            The page you're looking for doesn’t exist in{" "}
            <strong style={{ color: NAVY }}>LAN Library</strong>.
            <br />
            Try going back home or explore available resources.
          </p>

          {/* Button */}
          <div style={{ display: "flex", justifyContent: "center" }}>
            <GoHomeButton />
          </div>
        </div>
      </body>
    </html>
  );
}