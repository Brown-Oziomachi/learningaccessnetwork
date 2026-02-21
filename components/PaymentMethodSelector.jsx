
import { CreditCard, Lock } from 'lucide-react';

export const PaymentMethodSelector = ({ paymentMethod, setPaymentMethod }) => {
    return (
        <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-950 mb-3">
                Select Payment Method
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                    onClick={() => setPaymentMethod('flutterwave')}
                    className={`p-4 border-2 rounded-lg transition-colors ${
                        paymentMethod === 'flutterwave'
                            ? 'border-blue-950 bg-blue-50'
                            : 'border-gray-300 hover:border-blue-950'
                    }`}
                >
                    <CreditCard className="w-8 h-8 mx-auto mb-2 text-blue-950" />
                    <p className="font-semibold text-gray-950">Flutterwave</p>
                    <p className="text-xs text-gray-950 mt-1">Card, Bank Transfer, USSD</p>
                </button>
                <button
                    onClick={() => setPaymentMethod('paypal')}
                    className={`p-4 border-2 rounded-lg transition-colors ${
                        paymentMethod === 'paypal'
                            ? 'border-blue-950 bg-blue-50'
                            : 'border-gray-300 hover:border-blue-950'
                    }`}
                >
                    <Lock className="w-8 h-8 mx-auto mb-2 text-blue-950" />
                    <p className="font-semibold text-gray-900">PayPal</p>
                    <p className="text-xs text-gray-600 mt-1">International Payments</p>
                </button>
            </div>
        </div>
    );
};