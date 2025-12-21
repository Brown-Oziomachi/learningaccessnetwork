import { Lock } from "lucide-react";

export const PaymentForm = ({
  formData,
  handleInputChange,
  processing,
  onSubmit,
  paymentMethod,
  book,
}) => {
  return (
    <form onSubmit={onSubmit}>
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
        <p className="text-xs text-gray-500 mt-1">
          PDF will be sent to this email
        </p>
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

      {/* PayPal Button Container */}
      {paymentMethod === "paypal" && (
        <div id="paypal-button-container" className="mb-4"></div>
      )}

      <button
        type="submit"
        disabled={processing}
        className="w-full bg-blue-950 text-white py-4 rounded-lg hover:bg-blue-900 transition-colors font-semibold text-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {processing ? (
          <>
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            Processing Payment...
          </>
        ) : (
          <>
            <Lock size={20} />
            {paymentMethod === "flutterwave"
              ? `Pay ₦ ${book.price.toLocaleString()} with Flutterwave`
              : "Continue to PayPal"}
          </>
        )}
      </button>

      <p className="text-xs text-gray-500 text-center mt-4">
        <Lock className="inline w-3 h-3 mr-1" />
        Your payment information is secure and encrypted
      </p>
    </form>
  );
};
