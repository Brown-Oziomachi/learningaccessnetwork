"use client";
import { useEffect, useRef } from "react";

const NAVY = "#0d2244";
const GOLD = "#b8963e";

/**
 * GoogleAdComponent
 * ─────────────────
 * Safely pushes a single AdSense unit into the DOM.
 * Place this anywhere you want an ad to render.
 */
export default function GoogleAdComponent() {
  const pushed = useRef(false);

  useEffect(() => {
    if (pushed.current) return; // never push twice for the same mount
    pushed.current = true;

    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (e) {
      console.warn("AdSense push error:", e);
    }
  }, []);

  return (
    <div
      style={{
        width: "100%",
        minHeight: "180px",
        background: "rgba(255,255,255,0.04)",
        border: `0.5px solid rgba(184,150,62,0.3)`,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        position: "relative",
      }}
    >
      {/* Subtle "Sponsored" label */}
      <p
        style={{
          position: "absolute",
          top: "6px",
          right: "10px",
          fontSize: "9px",
          fontWeight: 700,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          color: `rgba(184,150,62,0.4)`,
          fontFamily: "'Lato',sans-serif",
          margin: 0,
          zIndex: 1,
        }}
      >
        Sponsored
      </p>

      {/* ── Real AdSense <ins> unit ── */}
      <ins
        className="adsbygoogle"
        style={{ display: "block", width: "100%" }}
        data-ad-client="ca-pub-8408243121163767"
        data-ad-slot="9268059500"
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
}
