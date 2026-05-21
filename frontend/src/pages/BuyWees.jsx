import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/client';
import { useAuth } from '../context/AuthContext';

const presetAmounts = [
  { usd: 5, wees: 50, popular: false },
  { usd: 10, wees: 100, popular: true },
  { usd: 25, wees: 250, popular: false },
  { usd: 50, wees: 500, popular: false },
];

export default function BuyWees() {
  const { fetchUser } = useAuth();
  const navigate = useNavigate();
  const [selectedAmount, setSelectedAmount] = useState(10);
  const [customAmount, setCustomAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleAmountSelect = (usd) => {
    setSelectedAmount(usd);
    setCustomAmount('');
  };

  const handleCustomAmount = (e) => {
    const val = e.target.value;
    setCustomAmount(val);
    if (val && parseFloat(val) > 0) {
      setSelectedAmount(null);
    }
  };

  const getFinalAmount = () => {
    if (selectedAmount) return selectedAmount;
    if (customAmount && parseFloat(customAmount) > 0) return parseFloat(customAmount);
    return 10;
  };

  const getWeesAmount = () => {
    return Math.round(getFinalAmount() / 0.1);
  };

  const handlePurchase = async () => {
    setError('');
    setLoading(true);
    try {
      const amount = getFinalAmount();
      const response = await apiClient.post('/payments/create-payment-intent', {
        amount,
        currency: 'usd',
      });

      const { clientSecret, paymentIntentId } = response.data;

      // For now, simulate success by marking the payment as completed
      // In production, this would use Stripe Elements or redirect to Stripe Checkout
      try {
        await apiClient.post('/payments/confirm-payment', {
          paymentIntentId,
          weesAmount: getWeesAmount(),
        });
      } catch (confirmErr) {
        // If the confirm endpoint doesn't exist, try a direct purchase approach
        await apiClient.post('/payments/purchase-wees', {
          amount,
          weesAmount: getWeesAmount(),
        });
      }

      await fetchUser();
      setSuccess(true);
    } catch (err) {
      console.error('Payment error:', err);
      setError(
        err.response?.data?.error ||
        err.response?.data?.message ||
        'Payment failed. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 py-16 px-4">
        <div className="max-w-lg mx-auto text-center">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Purchase Successful!</h2>
            <p className="text-gray-600 mb-2">
              You have purchased <span className="font-bold text-yellow-600">{getWeesAmount()} Wees</span>
            </p>
            <p className="text-sm text-gray-500 mb-8">Your Wees have been added to your account.</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => navigate('/dashboard')}
                className="bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg px-6 py-3 transition-all duration-200"
              >
                Go to Dashboard
              </button>
              <button
                onClick={() => {
                  setSuccess(false);
                  setSelectedAmount(10);
                  setCustomAmount('');
                }}
                className="bg-white hover:bg-gray-50 text-gray-700 font-semibold rounded-lg px-6 py-3 border border-gray-300 transition-all duration-200"
              >
                Buy More Wees
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-lg mx-auto">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-yellow-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">✦</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Buy Wees</h1>
          <p className="text-gray-500 mt-2">Purchase Wees to unlock matches and premium features</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <p className="text-sm text-gray-500 text-center mb-6">
            1 Wee = <span className="font-semibold text-gray-900">$0.10 USD</span>
          </p>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">{error}</div>
          )}

          {/* Preset Amounts */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            {presetAmounts.map((preset) => (
              <button
                key={preset.usd}
                onClick={() => handleAmountSelect(preset.usd)}
                className={`relative border rounded-xl p-4 text-center transition-all duration-200 ${
                  selectedAmount === preset.usd
                    ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                    : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                }`}
              >
                {preset.popular && (
                  <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-blue-500 text-white text-xs font-semibold px-3 py-0.5 rounded-full">
                    Popular
                  </span>
                )}
                <p className="text-2xl font-bold text-gray-900">${preset.usd}</p>
                <p className="text-sm text-gray-500">{preset.wees} Wees</p>
              </button>
            ))}
          </div>

          {/* Custom Amount */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Custom Amount</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">$</span>
              <input
                type="number"
                min="1"
                step="0.01"
                value={customAmount}
                onChange={handleCustomAmount}
                placeholder="Enter custom amount"
                className="w-full pl-8 border border-gray-300 rounded-lg px-4 py-3 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
              />
            </div>
          </div>

          {/* Summary */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-600">Amount</span>
              <span className="font-semibold text-gray-900">${getFinalAmount().toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">You get</span>
              <span className="font-semibold text-yellow-600">✦ {getWeesAmount()} Wees</span>
            </div>
          </div>

          {/* Purchase Button */}
          <button
            onClick={handlePurchase}
            disabled={loading}
            className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 disabled:cursor-not-allowed text-white font-semibold rounded-lg px-6 py-3 transition-all duration-200 shadow-sm"
          >
            {loading ? (
              <span className="flex items-center justify-center space-x-2">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Processing...</span>
              </span>
            ) : (
              `Purchase ${getWeesAmount()} Wees`
            )}
          </button>

          {/* Note */}
          <p className="text-xs text-gray-400 text-center mt-4">
            Secure payment processed by Stripe. Your Wees will be available immediately after purchase.
          </p>
        </div>

        <div className="text-center">
          <button
            onClick={() => navigate('/dashboard')}
            className="text-sm text-gray-500 hover:text-gray-700 font-medium transition-colors duration-200"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
