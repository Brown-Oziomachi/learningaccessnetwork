/**
 * BOOK PREVIEW PAGE PATCHES
 * ──────────────────────────────────────────────────────────────────────────
 * Drop these three things into your existing app/book/preview/page.js
 *
 * 1. FrozenBanner  — shows when isGloballyFrozen === true (overrides everything)
 * 2. LicenseButton — the "Get Hard-Copy License" button with all gate checks
 * 3. Updated fetchBook logic additions (add to your existing fetchBook useEffect)
 * ──────────────────────────────────────────────────────────────────────────
 */

// ═══════════════════════════════════════════════════════════════════════════
// PATCH 1 — Add to state declarations at top of BookPreviewPage component
// ═══════════════════════════════════════════════════════════════════════════
/*
  const [isPrintLicensingEnabled, setIsPrintLicensingEnabled] = useState(false);
  const [isGloballyFrozen, setIsGloballyFrozen] = useState(false);
*/

// ═══════════════════════════════════════════════════════════════════════════
// PATCH 2 — Add inside your existing fetchBook useEffect, after setBook(...)
//           This reads the two licensing fields off the already-fetched doc.
// ═══════════════════════════════════════════════════════════════════════════
/*
  // Inside your existing fetchBook try block, after `setBook({ ...bookData, ... })`:
  setIsPrintLicensingEnabled(bookData?.isPrintLicensingEnabled === true);
  setIsGloballyFrozen(bookData?.isGloballyFrozen === true);
*/

// ═══════════════════════════════════════════════════════════════════════════
// PATCH 3 — Replace your existing handleRequestLicenseClick and the button
//           in the options modal with these components.
// ═══════════════════════════════════════════════════════════════════════════

import { AlertTriangle, Snowflake, Printer } from "lucide-react";

/* ── NAVY / GOLD pulled from your existing palette constants ─────────── */
// const NAVY = "#0d2244";
// const GOLD = "#b8963e";

/**
 * FrozenBanner
 * Place this ABOVE the PdfViewer in both the desktop sidebar and the mobile
 * book-info card. When rendered, it overrides every other call-to-action.
 *
 * Usage:
 *   {isGloballyFrozen && <FrozenBanner />}
 */
export function FrozenBanner() {
  return (
    <div
      role="alert"
      style={{
        background: "rgba(59,130,246,0.08)",
        border: "1px solid rgba(59,130,246,0.35)",
        borderLeft: "4px solid #3b82f6",
        padding: "18px 20px",
        margin: "0 0 16px",
        display: "flex",
        alignItems: "flex-start",
        gap: 14,
      }}
    >
      <Snowflake
        size={22}
        color="#60a5fa"
        style={{ flexShrink: 0, marginTop: 2 }}
      />
      <div>
        <p
          style={{
            fontSize: 13,
            fontWeight: 700,
            color: "#60a5fa",
            margin: "0 0 4px",
            fontFamily: "'Lato',sans-serif",
            letterSpacing: "0.04em",
          }}
        >
          Resource Frozen by Platform Administration
        </p>
        <p
          style={{
            fontSize: 12,
            color: "#93c5fd",
            margin: 0,
            fontFamily: "'Lato',sans-serif",
            lineHeight: 1.7,
          }}
        >
          This resource has been frozen by platform administration pending
          copyright verification. All access — including preview, purchase, and
          print licensing — is temporarily suspended. Contact{" "}
          <a
            href="mailto:legal@lanlibrary.com"
            style={{ color: "#60a5fa", fontWeight: 700 }}
          >
            legal@lanlibrary.com
          </a>{" "}
          for inquiries.
        </p>
      </div>
    </div>
  );
}

/**
 * LicenseButton
 * The "Get Hard-Copy License" button with full gate logic.
 *
 * Props:
 *   book                   — the book object from state
 *   isGloballyFrozen       — boolean from state
 *   isPrintLicensingEnabled — boolean from state
 *   router                 — from useRouter()
 *   cleanBookId            — string (bookId without 'firestore-' prefix)
 *   style                  — optional extra styles for the wrapper div
 *
 * Usage (replace your existing hardcopy button in the options modal and sidebar):
 *   <LicenseButton
 *     book={book}
 *     isGloballyFrozen={isGloballyFrozen}
 *     isPrintLicensingEnabled={isPrintLicensingEnabled}
 *     router={router}
 *     cleanBookId={cleanId}
 *   />
 */
export function LicenseButton({
  book,
  isGloballyFrozen,
  isPrintLicensingEnabled,
  router,
  cleanBookId,
  style = {},
}) {
  const NAVY = "#0d2244";
  const GOLD = "#b8963e";

  /* Both gate conditions that disable the button */
  const frozen = isGloballyFrozen === true;
  const noLicense = !isPrintLicensingEnabled;
  const blocked = frozen || noLicense;

  const blockReason = frozen
    ? "This resource has been frozen by platform administration pending copyright verification."
    : noLicense
      ? "Author has terminated local printing rights for this asset."
      : null;

  const handleClick = () => {
    if (blocked || !book?.id) return;
    const params = new URLSearchParams();
    params.set("id", cleanBookId);
    params.set("title", book.bookTitle || book.title || "Untitled Document");
    params.set("pages", String(book.pages || 0));
    params.set("price", String(book.price || 0));
    router.push(`/document/request-print-permission?${params.toString()}`);
  };

  return (
    <div style={style}>
      {/* Blocked reason warning */}
      {blocked && blockReason && (
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: 8,
            background: frozen
              ? "rgba(59,130,246,0.07)"
              : "rgba(239,68,68,0.07)",
            border: `0.5px solid ${frozen ? "rgba(59,130,246,0.25)" : "rgba(239,68,68,0.25)"}`,
            padding: "10px 14px",
            marginBottom: 10,
            borderRadius: 0,
          }}
        >
          {frozen ? (
            <Snowflake
              size={13}
              color="#60a5fa"
              style={{ flexShrink: 0, marginTop: 1 }}
            />
          ) : (
            <AlertTriangle
              size={13}
              color="#f87171"
              style={{ flexShrink: 0, marginTop: 1 }}
            />
          )}
          <p
            style={{
              fontSize: 11,
              color: frozen ? "#93c5fd" : "#fca5a5",
              margin: 0,
              fontFamily: "'Lato',sans-serif",
              lineHeight: 1.6,
            }}
          >
            {blockReason}
          </p>
        </div>
      )}

      {/* The button */}
      <button
        onClick={handleClick}
        disabled={blocked}
        aria-disabled={blocked}
        title={blocked ? blockReason : "Get a print license for this book"}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          padding: "12px 20px",
          background: blocked ? "rgba(148,163,184,0.1)" : NAVY,
          color: blocked ? "#64748b" : "#fff",
          border: blocked
            ? "0.5px solid rgba(148,163,184,0.2)"
            : `0.5px solid ${GOLD}`,
          fontSize: 12,
          fontWeight: 700,
          cursor: blocked ? "not-allowed" : "pointer",
          fontFamily: "'Lato',sans-serif",
          letterSpacing: "0.06em",
          transition: "background 0.18s",
          opacity: blocked ? 0.65 : 1,
        }}
        onMouseEnter={(e) => {
          if (!blocked) e.currentTarget.style.background = "#1a3a6e";
        }}
        onMouseLeave={(e) => {
          if (!blocked) e.currentTarget.style.background = NAVY;
        }}
      >
        <Printer size={14} />
        {frozen
          ? "Access Frozen"
          : noLicense
            ? "Printing Disabled"
            : "Get Hard-Copy License"}
      </button>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// PATCH 4 — In your existing PdfViewer component, wrap the entire return
//           with a frozen gate at the very top. If frozen, nothing renders
//           except the frozen banner.
// ═══════════════════════════════════════════════════════════════════════════

/**
 * FrozenPdfGate
 * Wrap your PdfViewer or place this just above it.
 * If frozen, renders only the banner and hides all book content.
 *
 * Usage:
 *   {isGloballyFrozen
 *     ? <FrozenPdfGate />
 *     : <PdfViewer heightClass="400px" fullHeight="900px" />
 *   }
 */
export function FrozenPdfGate() {
  const NAVY = "#0d2244";
  const GOLD = "#b8963e";
  const BG = "#f5f1ea";

  return (
    <div
      style={{
        background: BG,
        padding: "24px 20px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        minHeight: 320,
        justifyContent: "center",
        gap: 20,
      }}
    >
      {/* Big freeze icon */}
      <div
        style={{
          width: 72,
          height: 72,
          background: "rgba(59,130,246,0.08)",
          border: "0.5px solid rgba(59,130,246,0.25)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Snowflake size={32} color="#60a5fa" />
      </div>

      <div style={{ textAlign: "center", maxWidth: 420 }}>
        <p
          style={{
            fontFamily: "'Playfair Display',Georgia,serif",
            fontSize: 18,
            fontWeight: 700,
            color: NAVY,
            margin: "0 0 8px",
          }}
        >
          Resource Under Review
        </p>
        <p
          style={{
            fontFamily: "'Lato',sans-serif",
            fontSize: 13,
            color: "#888",
            lineHeight: 1.75,
            margin: 0,
          }}
        >
          This resource has been frozen by platform administration pending
          copyright verification. All student access has been suspended. If you
          are the author, contact{" "}
          <a
            href="mailto:legal@lanlibrary.com"
            style={{ color: GOLD, fontWeight: 700 }}
          >
            legal@lanlibrary.com
          </a>
          .
        </p>
      </div>

      {/* Frozen status pill */}
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          background: "rgba(59,130,246,0.08)",
          border: "0.5px solid rgba(59,130,246,0.3)",
          padding: "8px 18px",
          fontFamily: "'Lato',sans-serif",
          fontSize: 11,
          fontWeight: 700,
          color: "#60a5fa",
          letterSpacing: "0.08em",
        }}
      >
        <Snowflake size={12} />
        GLOBALLY FROZEN BY ADMIN
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// PATCH 5 — LAN Lecturers section: ensure each lecturer card links to
//           their seller profile. Your existing code may already have this;
//           verify the href pattern below matches your route structure.
// ═══════════════════════════════════════════════════════════════════════════

/**
 * SellerProfileLink
 * Wrap each lecturer card's name/avatar with this component.
 * Replaces any plain <span> or non-linked element.
 *
 * Usage (in the mobile and desktop lecturer lists):
 *   <SellerProfileLink sellerId={lec.sellerId} sellerName={lec.sellerName}>
 *     <img src={...} ... />
 *   </SellerProfileLink>
 *
 * Note: your existing code already uses Link for the desktop sidebar.
 * For mobile, replace any non-linked wrappers with this component.
 */
import Link from "next/link";

export function SellerProfileLink({
  sellerId,
  sellerName,
  children,
  style = {},
}) {
  return (
    <Link
      href={`/profile/${lecturer.slug || lecturer.sellerId}`}
      title={`View ${sellerName || "Lecturer"}'s profile`}
      style={{
        textDecoration: "none",
        display: "inline-flex",
        alignItems: "center",
        ...style,
      }}
    >
      {children}
    </Link>
  );
}
