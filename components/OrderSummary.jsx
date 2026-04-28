// OrderSummary.jsx - Complete Component with PDF Thumbnail Support

const NAVY  = "#0d2244";
const GOLD  = "#b8963e";
const GOLDD = "#d4aa5a";
const CREAM = "#f5f0e8";

// Helper function to generate thumbnail from PDF
const getThumbnailUrl = (book) => {
  if (!book)
    return "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400";

  // If book has driveFileId, generate thumbnail from PDF first page
  if (book.driveFileId) {
    return `https://drive.google.com/thumbnail?id=${book.driveFileId}&sz=w400`;
  }

  // Extract driveFileId from embedUrl if available
  if (book.embedUrl) {
    const match = book.embedUrl.match(
      /\/d\/(.*?)\/|\/file\/d\/(.*?)\/|id=(.*?)(&|$)/
    );
    if (match) {
      const fileId = match[1] || match[2] || match[3];
      if (fileId) {
        return `https://drive.google.com/thumbnail?id=${fileId}&sz=w400`;
      }
    }
  }

  // Extract from pdfUrl if it's a Google Drive link
  if (book.pdfUrl && book.pdfUrl.includes("drive.google.com")) {
    const match = book.pdfUrl.match(/[-\w]{25,}/);
    if (match) {
      return `https://drive.google.com/thumbnail?id=${match[0]}&sz=w400`;
    }
  }

  // Fallback to existing image or default
  return (
    book.image ||
    book.coverImage ||
    "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400"
  );
};

export const OrderSummary = ({ book }) => {
  if (!book) {
    return (
      <div style={{ background: "#fff", border: "0.5px solid #e5ddd0", padding: 24, position: "sticky", top: 32 }}>
        <p style={{ color: "#888", fontFamily: "'Lato',sans-serif", fontSize: 13 }}>Loading order summary...</p>
      </div>
    );
  }

  return (
    <div style={{ background: "#fff", border: "0.5px solid #e5ddd0", padding: 24, position: "sticky", top: 32 }}>

      {/* Header */}
      <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: ".2em", textTransform: "uppercase", color: GOLD, margin: "0 0 4px", fontFamily: "'Lato',sans-serif" }}>
        Order Summary
      </p>
      <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: 20, fontWeight: 700, color: NAVY, margin: "0 0 20px" }}>
        Your Purchase
      </h3>

      {/* Thumbnail */}
      <div style={{ marginBottom: 16, border: "0.5px solid #e5ddd0", overflow: "hidden", background: CREAM }}>
        <img
          src={getThumbnailUrl(book)}
          alt={book.title}
          style={{ width: "100%", height: 192, objectFit: "cover", display: "block" }}
          onError={(e) => {
            console.log("Thumbnail failed to load, using fallback");
            e.target.src =
              "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400";
          }}
          loading="lazy"
        />
      </div>

      {/* Book info */}
      <div style={{ marginBottom: 20 }}>
        <h4 style={{ fontFamily: "'Playfair Display',serif", fontSize: 15, fontWeight: 700, color: NAVY, margin: "0 0 4px" }}>
          {book.title}
        </h4>
        <p style={{ fontSize: 12, color: "#888", fontFamily: "'Lato',sans-serif", margin: "0 0 4px" }}>
          {book.author}
        </p>
        <p style={{ fontSize: 11, color: "#aaa", fontFamily: "'Lato',sans-serif", margin: 0 }}>
          {book.pages} pages • {book.format}
        </p>
        {book.description && (
          <p style={{ fontSize: 11, color: "#aaa", fontFamily: "'Lato',sans-serif", marginTop: 8, lineHeight: 1.6, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
            {book.description}
          </p>
        )}
      </div>

      {/* Price breakdown */}
      <div style={{ borderTop: "0.5px solid #e5ddd0", paddingTop: 16, display: "flex", flexDirection: "column", gap: 10 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 13, fontFamily: "'Lato',sans-serif" }}>
          <span style={{ color: "#888" }}>Subtotal</span>
          <span style={{ fontWeight: 700, color: NAVY }}>₦ {book.price?.toLocaleString() || "0"}</span>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 13, fontFamily: "'Lato',sans-serif" }}>
          <span style={{ color: "#888" }}>Processing Fee</span>
          <span style={{ fontWeight: 700, color: NAVY }}>₦ 0</span>
        </div>

        {book.discount && (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 13, fontFamily: "'Lato',sans-serif" }}>
            <span style={{ color: "#16a34a" }}>LAN Lib's Discount</span>
            <span style={{ fontWeight: 700, color: "#16a34a" }}>20%</span>
          </div>
        )}

        {/* Total */}
        <div style={{ borderTop: "0.5px solid #e5ddd0", paddingTop: 14, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 13, color: "#888", fontFamily: "'Lato',sans-serif" }}>Total</span>
          <span style={{ fontFamily: "'Playfair Display',serif", fontSize: 24, fontWeight: 700, color: NAVY }}>
            ₦ {book.price?.toLocaleString() || "0"}
          </span>
        </div>
      </div>

      {/* Instant access badge */}
      <div style={{
        marginTop: 20,
        background: NAVY,
        backgroundImage: "radial-gradient(rgba(184,150,62,0.07) 1px,transparent 1px)",
        backgroundSize: "20px 20px",
        border: "0.5px solid rgba(184,150,62,0.2)",
        padding: "14px 16px",
      }}>
        <p style={{ fontSize: 12, color: "rgba(255,255,255,0.85)", fontFamily: "'Lato',sans-serif", lineHeight: 1.65, margin: 0 }}>
          <span style={{ color: GOLDD, fontWeight: 700 }}>✓ Instant Access</span>
          <br />
          Access your PDF immediately after payment
        </p>
      </div>

      {/* Sold by */}
      {book.sellerName && (
        <div style={{ marginTop: 12, background: CREAM, border: "0.5px solid #e5ddd0", padding: "10px 14px" }}>
          <p style={{ fontSize: 11, color: "#888", fontFamily: "'Lato',sans-serif", margin: 0 }}>
            <span style={{ fontWeight: 700, color: NAVY }}>Sold by:</span> {book.sellerName}
          </p>
        </div>
      )}
    </div>
  );
};

export default OrderSummary;