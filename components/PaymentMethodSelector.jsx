import { CreditCard, Lock, Wallet } from "lucide-react";

export const PaymentMethodSelector = ({ paymentMethod, setPaymentMethod }) => {
  return (
    <div className="mb-6">
      <label className="block text-sm font-semibold text-gray-950 mb-3">
        Select Payment Method
      </label>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {" "}
        {/* Changed to 3 columns for better layout */}
        {/* Flutterwave */}
        <button
          type="button"
          onClick={() => setPaymentMethod("flutterwave")}
          className={`p-4 border-2 rounded-lg transition-colors text-center ${
            paymentMethod === "flutterwave"
              ? "border-blue-950 bg-blue-50"
              : "border-gray-200 hover:border-blue-950"
          }`}
        >
          <CreditCard className="w-8 h-8 mx-auto mb-2 text-blue-950" />
          <p className="font-semibold text-gray-950">Flutterwave</p>
          <p className="text-xs text-gray-500 mt-1">Card, Transfer, USSD</p>
        </button>
        {/* PayPal */}
        <button
          type="button"
          onClick={() => setPaymentMethod("paypal")}
          className={`p-4 border-2 rounded-lg transition-colors text-center ${
            paymentMethod === "paypal"
              ? "border-blue-950 bg-blue-50"
              : "border-gray-200 hover:border-blue-950"
          }`}
        >
          <Lock className="w-8 h-8 mx-auto mb-2 text-blue-950" />
          <p className="font-semibold text-gray-950">PayPal</p>
          <p className="text-xs text-gray-500 mt-1">International</p>
        </button>
        {/* LAN Wallet */}
        <button
          type="button"
          onClick={() => setPaymentMethod("wallet")}
          className={`p-4 border-2 rounded-lg transition-colors text-center ${
            paymentMethod === "wallet"
              ? "border-blue-950 bg-blue-50"
              : "border-gray-200 hover:border-blue-950"
          }`}
        >
          <Wallet className="w-8 h-8 mx-auto mb-2 text-blue-950" />
          <p className="font-semibold text-gray-950">LAN Wallet</p>
          <p className="text-xs text-gray-500 mt-1">Fast & Instant</p>
        </button>
      </div>
    </div>
  );
};
