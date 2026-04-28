import { Lock, Loader2, AlertCircle } from "lucide-react";

const NAVY  = "#0d2244";
const GOLD  = "#b8963e";
const GOLDD = "#d4aa5a";
const CREAM = "#f5f0e8";

const labelStyle = {
  display: "block",
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: ".14em",
  textTransform: "uppercase",
  color: "#aaa",
  marginBottom: 8,
  fontFamily: "'Lato',sans-serif",
};

const inputBase = {
  width: "100%",
  border: "0.5px solid #e5ddd0",
  padding: "12px 14px",
  fontSize: 14,
  color: NAVY,
  fontFamily: "'Lato',sans-serif",
  outline: "none",
  background: "#fff",
  transition: "border-color 0.18s",
  boxSizing: "border-box",
};

export const PaymentForm = ({
  formData,
  handleInputChange,
  processing,
  onSubmit,
  paymentMethod,
  book,
  paymentError, // <--- Add this prop
}) => {
  const getButtonText = () => {
    const formattedPrice = `₦ ${book.price.toLocaleString()}`;

    switch (paymentMethod) {
      case "flutterwave":
        return `Pay ${formattedPrice} with Flutterwave`;
      case "paypal":
        return `Continue to PayPal (${formattedPrice})`;
      case "wallet":
        return `Pay ${formattedPrice} from LAN Wallet`;
      default:
        return `Pay ${formattedPrice} Now`;
    }
  };

  return (
    <form onSubmit={onSubmit}>

      {/* Error Message Display */}
      {paymentError && (
        <div style={{ marginBottom: 24, background: "#fef2f2", borderLeft: "3px solid #ef4444", padding: "14px 16px", display: "flex", alignItems: "flex-start", gap: 10 }}>
          <AlertCircle size={20} style={{ color: "#ef4444", flexShrink: 0, marginTop: 1 }} />
          <div>
            <h3 style={{ fontSize: 13, fontWeight: 700, color: "#991b1b", margin: "0 0 2px", fontFamily: "'Lato',sans-serif" }}>Payment Issue</h3>
            <p style={{ fontSize: 12, color: "#b91c1c", margin: 0, fontFamily: "'Lato',sans-serif" }}>
              {typeof paymentError === "string"
                ? paymentError
                : paymentError.message}
            </p>
          </div>
        </div>
      )}

      {/* Form Fields */}
      <div style={{ marginBottom: 20 }}>
        <label style={labelStyle}>Full Name *</label>
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleInputChange}
          placeholder="John Doe"
          required
          style={inputBase}
          onFocus={e => e.target.style.borderColor = GOLD}
          onBlur={e => e.target.style.borderColor = "#e5ddd0"}
        />
      </div>

      <div style={{ marginBottom: 20 }}>
        <label style={labelStyle}>Email Address *</label>
        <input
          type="email"
          name="email"
          value={formData.email}
          onChange={handleInputChange}
          placeholder="your@email.com"
          required
          style={inputBase}
          onFocus={e => e.target.style.borderColor = GOLD}
          onBlur={e => e.target.style.borderColor = "#e5ddd0"}
        />
      </div>

      <div style={{ marginBottom: 28 }}>
        <label style={labelStyle}>Phone Number *</label>
        <input
          type="tel"
          name="phone"
          value={formData.phone}
          onChange={handleInputChange}
          placeholder="+234 800 000 0000"
          required
          style={inputBase}
          onFocus={e => e.target.style.borderColor = GOLD}
          onBlur={e => e.target.style.borderColor = "#e5ddd0"}
        />
      </div>

      {paymentMethod === "paypal" && (
        <div style={{ marginBottom: 16 }}>
          <div id="paypal-button-container"></div>
          <p style={{ fontSize: 11, color: "#aaa", textAlign: "center", marginTop: 8, fontFamily: "'Lato',sans-serif" }}>
            Secure payment via PayPal (USD)
          </p>
        </div>
      )}

      <button
        type="submit"
        disabled={processing}
        style={{
          width: "100%",
          padding: "15px 20px",
          background: paymentError && paymentMethod === "wallet" ? "#dc2626" : NAVY,
          color: "#fff",
          border: "none",
          cursor: processing ? "not-allowed" : "pointer",
          fontSize: 13,
          fontWeight: 700,
          fontFamily: "'Lato',sans-serif",
          letterSpacing: ".06em",
          textTransform: "uppercase",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          opacity: processing ? 0.6 : 1,
          transition: "background 0.18s",
        }}
        onMouseEnter={e => { if (!processing) e.currentTarget.style.background = paymentError && paymentMethod === "wallet" ? "#b91c1c" : "#1a3560"; }}
        onMouseLeave={e => { if (!processing) e.currentTarget.style.background = paymentError && paymentMethod === "wallet" ? "#dc2626" : NAVY; }}
      >
        {processing ? (
          <>
            <Loader2 size={20} style={{ animation: "spin 0.8s linear infinite" }} />
            Processing...
          </>
        ) : (
          <>
            <Lock size={20} />
            {getButtonText()}
          </>
        )}
      </button>

      <p style={{ fontSize: 11, color: "#aaa", textAlign: "center", marginTop: 12, fontFamily: "'Lato',sans-serif", display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
        <Lock size={12} />
        Your payment information is secure and encrypted
      </p>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </form>
  );
};