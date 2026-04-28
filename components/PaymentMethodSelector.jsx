import { CreditCard, Lock, Wallet } from "lucide-react";

const NAVY  = "#0d2244";
const GOLD  = "#b8963e";
const GOLDD = "#d4aa5a";
const CREAM = "#f5f0e8";

export const PaymentMethodSelector = ({ paymentMethod, setPaymentMethod }) => {
  const methods = [
    { id: "flutterwave", icon: <CreditCard size={22} />, label: "Flutterwave", sub: "Card, Transfer, USSD" },
    { id: "paypal",      icon: <Lock size={22} />,       label: "PayPal",       sub: "International"       },
    { id: "wallet",      icon: <Wallet size={22} />,     label: "LAN Wallet",   sub: "Fast & Instant"      },
  ];

  return (
    <div style={{ marginBottom: 24 }}>
      <label style={{ display: "block", fontSize: 10, fontWeight: 700, letterSpacing: ".18em", textTransform: "uppercase", color: "#aaa", marginBottom: 14, fontFamily: "'Lato',sans-serif" }}>
        Select Payment Method
      </label>

      {/* Changed to 3 columns for better layout */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 }}>

        {/* Flutterwave */}
        <button
          type="button"
          onClick={() => setPaymentMethod("flutterwave")}
          style={{
            padding: "16px 10px",
            border: paymentMethod === "flutterwave" ? `1.5px solid ${NAVY}` : "0.5px solid #e5ddd0",
            background: paymentMethod === "flutterwave" ? CREAM : "#fff",
            cursor: "pointer", textAlign: "center",
            transition: "all 0.18s", position: "relative",
          }}
          onMouseEnter={e => { if (paymentMethod !== "flutterwave") e.currentTarget.style.borderColor = GOLD; }}
          onMouseLeave={e => { if (paymentMethod !== "flutterwave") e.currentTarget.style.borderColor = "#e5ddd0"; }}
        >
          {paymentMethod === "flutterwave" && (
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg,${GOLD},${GOLDD})` }} />
          )}
          <div style={{ width: 40, height: 40, border: `0.5px solid ${paymentMethod === "flutterwave" ? "rgba(13,34,68,0.2)" : "#e5ddd0"}`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 10px", color: paymentMethod === "flutterwave" ? NAVY : "#aaa", background: paymentMethod === "flutterwave" ? "#fff" : CREAM }}>
            <CreditCard size={22} />
          </div>
          <p style={{ fontSize: 12, fontWeight: 700, color: paymentMethod === "flutterwave" ? NAVY : "#555", fontFamily: "'Lato',sans-serif", margin: "0 0 3px" }}>Flutterwave</p>
          <p style={{ fontSize: 10, color: paymentMethod === "flutterwave" ? GOLD : "#aaa", fontFamily: "'Lato',sans-serif", margin: 0 }}>Card, Transfer, USSD</p>
        </button>

        {/* PayPal */}
        <button
          type="button"
          onClick={() => setPaymentMethod("paypal")}
          style={{
            padding: "16px 10px",
            border: paymentMethod === "paypal" ? `1.5px solid ${NAVY}` : "0.5px solid #e5ddd0",
            background: paymentMethod === "paypal" ? CREAM : "#fff",
            cursor: "pointer", textAlign: "center",
            transition: "all 0.18s", position: "relative",
          }}
          onMouseEnter={e => { if (paymentMethod !== "paypal") e.currentTarget.style.borderColor = GOLD; }}
          onMouseLeave={e => { if (paymentMethod !== "paypal") e.currentTarget.style.borderColor = "#e5ddd0"; }}
        >
          {paymentMethod === "paypal" && (
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg,${GOLD},${GOLDD})` }} />
          )}
          <div style={{ width: 40, height: 40, border: `0.5px solid ${paymentMethod === "paypal" ? "rgba(13,34,68,0.2)" : "#e5ddd0"}`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 10px", color: paymentMethod === "paypal" ? NAVY : "#aaa", background: paymentMethod === "paypal" ? "#fff" : CREAM }}>
            <Lock size={22} />
          </div>
          <p style={{ fontSize: 12, fontWeight: 700, color: paymentMethod === "paypal" ? NAVY : "#555", fontFamily: "'Lato',sans-serif", margin: "0 0 3px" }}>PayPal</p>
          <p style={{ fontSize: 10, color: paymentMethod === "paypal" ? GOLD : "#aaa", fontFamily: "'Lato',sans-serif", margin: 0 }}>International</p>
        </button>

        {/* LAN Wallet */}
        <button
          type="button"
          onClick={() => setPaymentMethod("wallet")}
          style={{
            padding: "16px 10px",
            border: paymentMethod === "wallet" ? `1.5px solid ${NAVY}` : "0.5px solid #e5ddd0",
            background: paymentMethod === "wallet" ? CREAM : "#fff",
            cursor: "pointer", textAlign: "center",
            transition: "all 0.18s", position: "relative",
          }}
          onMouseEnter={e => { if (paymentMethod !== "wallet") e.currentTarget.style.borderColor = GOLD; }}
          onMouseLeave={e => { if (paymentMethod !== "wallet") e.currentTarget.style.borderColor = "#e5ddd0"; }}
        >
          {paymentMethod === "wallet" && (
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg,${GOLD},${GOLDD})` }} />
          )}
          <div style={{ width: 40, height: 40, border: `0.5px solid ${paymentMethod === "wallet" ? "rgba(13,34,68,0.2)" : "#e5ddd0"}`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 10px", color: paymentMethod === "wallet" ? NAVY : "#aaa", background: paymentMethod === "wallet" ? "#fff" : CREAM }}>
            <Wallet size={22} />
          </div>
          <p style={{ fontSize: 12, fontWeight: 700, color: paymentMethod === "wallet" ? NAVY : "#555", fontFamily: "'Lato',sans-serif", margin: "0 0 3px" }}>LAN Wallet</p>
          <p style={{ fontSize: 10, color: paymentMethod === "wallet" ? GOLD : "#aaa", fontFamily: "'Lato',sans-serif", margin: 0 }}>Fast & Instant</p>
        </button>

      </div>
    </div>
  );
};