import { Lock, Loader2, AlertCircle } from "lucide-react";

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
        <div className="mb-6 bg-red-50 border-l-4 border-red-600 rounded-r-lg p-4 flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
          <AlertCircle className="text-red-600 mt-0.5" size={20} />
          <div>
            <h3 className="text-sm font-bold text-red-800">Payment Issue</h3>
            <p className="text-sm text-red-700">
              {typeof paymentError === "string"
                ? paymentError
                : paymentError.message}
            </p>
          </div>
        </div>
      )}

      {/* Form Fields */}
      <div className="mb-4">
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Full Name *
        </label>
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleInputChange}
          placeholder="John Doe"
          required
          className="w-full text-blue-950 border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-950"
        />
      </div>

      <div className="mb-4">
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Email Address *
        </label>
        <input
          type="email"
          name="email"
          value={formData.email}
          onChange={handleInputChange}
          placeholder="your@email.com"
          required
          className="w-full text-blue-950 border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-950"
        />
      </div>

      <div className="mb-6">
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Phone Number *
        </label>
        <input
          type="tel"
          name="phone"
          value={formData.phone}
          onChange={handleInputChange}
          placeholder="+234 800 000 0000"
          required
          className="w-full text-blue-950 border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-950"
        />
      </div>

      {paymentMethod === "paypal" && (
        <div className="mt-4">
          <div id="paypal-button-container"></div>
          <p className="text-xs text-center text-gray-500 mt-2">
            Secure payment via PayPal (USD)
          </p>
        </div>
      )}

      <button
        type="submit"
        disabled={processing}
        className={`w-full py-4 rounded-lg transition-colors font-semibold text-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${
          paymentError && paymentMethod === "wallet"
            ? "bg-red-600 hover:bg-red-700"
            : "bg-blue-950 hover:bg-blue-900"
        } text-white`}
      >
        {processing ? (
          <>
            <Loader2 className="animate-spin" size={20} />
            Processing...
          </>
        ) : (
          <>
            <Lock size={20} />
            {getButtonText()}
          </>
        )}
      </button>

      <p className="text-xs text-gray-500 text-center mt-4 flex items-center justify-center gap-1">
        <Lock size={12} />
        Your payment information is secure and encrypted
      </p>
    </form>
  );
};
