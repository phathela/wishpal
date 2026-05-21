import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/client';

const categories = [
  'Houses', 'Jobs', 'Services', 'Items', 'Vehicles', 'Cleaning', 'Repairs', 'Other'
];

const updateFrequencies = ['Hourly', 'Daily', 'Weekly'];

export default function CreateWish() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    category: '',
    description: '',
    targetDate: '',
    returnOffer: '',
    paymentType: 'pay',
    amount: '',
    exchangeItem: '',
    exchangeDetails: '',
    exchangePhoto: null,
    estimatedValue: '',
    expiryDate: '',
    updateFrequency: 'Daily',
    country: '',
    region: '',
    visibleToPads: '',
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: files ? files[0] : value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.title.trim()) newErrors.title = 'Title is required';
    if (!formData.category) newErrors.category = 'Category is required';
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    if (!formData.targetDate) newErrors.targetDate = 'Target date is required';
    if (!formData.returnOffer.trim()) newErrors.returnOffer = 'Please describe what you will do in return';

    if (formData.paymentType === 'pay') {
      if (!formData.amount || parseFloat(formData.amount) <= 0) {
        newErrors.amount = 'Please enter a valid amount';
      }
    } else {
      if (!formData.exchangeItem.trim()) newErrors.exchangeItem = 'Please describe the item';
    }

    if (!formData.expiryDate) newErrors.expiryDate = 'Expiry date is required';
    if (!formData.country.trim()) newErrors.country = 'Country is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      const payload = {
        title: formData.title,
        category: formData.category,
        description: formData.description,
        targetDate: formData.targetDate,
        returnOffer: formData.returnOffer,
        paymentType: formData.paymentType,
        expiryDate: formData.expiryDate,
        updateFrequency: formData.updateFrequency,
        location: formData.country + (formData.region ? `, ${formData.region}` : ''),
        country: formData.country,
        region: formData.region,
        visibleToPads: formData.visibleToPads ? formData.visibleToPads.split(',').map((s) => s.trim()).filter(Boolean) : undefined,
      };

      if (formData.paymentType === 'pay') {
        payload.amount = parseFloat(formData.amount);
      } else {
        payload.exchangeItem = formData.exchangeItem;
        payload.exchangeDetails = formData.exchangeDetails || undefined;
        payload.estimatedValue = formData.estimatedValue ? parseFloat(formData.estimatedValue) : undefined;
      }

      await apiClient.post('/wishes', payload);
      setSubmitted(true);
    } catch (err) {
      const message = err.response?.data?.error || err.response?.data?.message || 'Failed to create wish. Please try again.';
      setErrors({ submit: message });
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 py-16 px-4">
        <div className="max-w-lg mx-auto text-center">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Wish Created Successfully!</h2>
            <p className="text-gray-600 mb-8">
              Your wish has been assigned to WishPal AI Agent. Our AI will now search for the perfect match.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => navigate('/dashboard')}
                className="bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg px-6 py-3 transition-all duration-200"
              >
                Go to Dashboard
              </button>
              <button
                onClick={() => {
                  setSubmitted(false);
                  setFormData({
                    title: '', category: '', description: '', targetDate: '', returnOffer: '',
                    paymentType: 'pay', amount: '', exchangeItem: '', exchangeDetails: '',
                    exchangePhoto: null, estimatedValue: '', expiryDate: '', updateFrequency: 'Daily',
                    country: '', region: '', visibleToPads: '',
                  });
                }}
                className="bg-white hover:bg-gray-50 text-gray-700 font-semibold rounded-lg px-6 py-3 border border-gray-300 transition-all duration-200"
              >
                Create Another Wish
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Create a New Wish</h1>
          <p className="text-gray-500 mt-1">Tell us what you want and let our AI find the perfect match</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {errors.submit && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
              {errors.submit}
            </div>
          )}

          {/* Title */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <label htmlFor="title" className="block text-sm font-semibold text-gray-700 mb-2">
              Wish Title <span className="text-red-500">*</span>
            </label>
            <input
              id="title"
              name="title"
              type="text"
              value={formData.title}
              onChange={handleChange}
              placeholder="e.g., Need a web developer for my startup"
              className={`w-full border ${errors.title ? 'border-red-300' : 'border-gray-300'} rounded-lg px-4 py-2.5 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200`}
            />
            {errors.title && <p className="mt-1 text-sm text-red-500">{errors.title}</p>}
          </div>

          {/* Category */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <label htmlFor="category" className="block text-sm font-semibold text-gray-700 mb-2">
              Category <span className="text-red-500">*</span>
            </label>
            <select
              id="category"
              name="category"
              value={formData.category}
              onChange={handleChange}
              className={`w-full border ${errors.category ? 'border-red-300' : 'border-gray-300'} rounded-lg px-4 py-2.5 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200`}
            >
              <option value="">Select a category</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            {errors.category && <p className="mt-1 text-sm text-red-500">{errors.category}</p>}
          </div>

          {/* Description */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <label htmlFor="description" className="block text-sm font-semibold text-gray-700 mb-2">
              Detailed Description <span className="text-red-500">*</span>
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={5}
              placeholder="Describe your wish in as much detail as possible..."
              className={`w-full border ${errors.description ? 'border-red-300' : 'border-gray-300'} rounded-lg px-4 py-2.5 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 resize-none`}
            />
            {errors.description && <p className="mt-1 text-sm text-red-500">{errors.description}</p>}
          </div>

          {/* Target Date */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <label htmlFor="targetDate" className="block text-sm font-semibold text-gray-700 mb-2">
              Target Date <span className="text-red-500">*</span>
            </label>
            <input
              id="targetDate"
              name="targetDate"
              type="date"
              value={formData.targetDate}
              onChange={handleChange}
              className={`w-full border ${errors.targetDate ? 'border-red-300' : 'border-gray-300'} rounded-lg px-4 py-2.5 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200`}
            />
            {errors.targetDate && <p className="mt-1 text-sm text-red-500">{errors.targetDate}</p>}
          </div>

          {/* Return Offer */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <label htmlFor="returnOffer" className="block text-sm font-semibold text-gray-700 mb-2">
              What will you do in return? <span className="text-red-500">*</span>
            </label>
            <textarea
              id="returnOffer"
              name="returnOffer"
              value={formData.returnOffer}
              onChange={handleChange}
              rows={3}
              placeholder="e.g., I will pay $500, or I can offer my web design services in exchange..."
              className={`w-full border ${errors.returnOffer ? 'border-red-300' : 'border-gray-300'} rounded-lg px-4 py-2.5 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 resize-none`}
            />
            {errors.returnOffer && <p className="mt-1 text-sm text-red-500">{errors.returnOffer}</p>}
          </div>

          {/* Payment Type Toggle */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <label className="block text-sm font-semibold text-gray-700 mb-3">Payment Type</label>
            <div className="flex space-x-1 bg-gray-100 rounded-lg p-1 max-w-xs mb-4">
              <button
                type="button"
                onClick={() => setFormData((prev) => ({ ...prev, paymentType: 'pay' }))}
                className={`flex-1 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                  formData.paymentType === 'pay'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Pay
              </button>
              <button
                type="button"
                onClick={() => setFormData((prev) => ({ ...prev, paymentType: 'exchange' }))}
                className={`flex-1 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                  formData.paymentType === 'exchange'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Exchange
              </button>
            </div>

            {formData.paymentType === 'pay' ? (
              <div>
                <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
                  Amount in USD <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">$</span>
                  <input
                    id="amount"
                    name="amount"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.amount}
                    onChange={handleChange}
                    placeholder="0.00"
                    className={`w-full pl-8 border ${errors.amount ? 'border-red-300' : 'border-gray-300'} rounded-lg px-4 py-2.5 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200`}
                  />
                </div>
                {errors.amount && <p className="mt-1 text-sm text-red-500">{errors.amount}</p>}
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label htmlFor="exchangeItem" className="block text-sm font-medium text-gray-700 mb-1">
                    Item Details <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="exchangeItem"
                    name="exchangeItem"
                    type="text"
                    value={formData.exchangeItem}
                    onChange={handleChange}
                    placeholder="e.g., iPhone 11, 64GB, Good condition"
                    className={`w-full border ${errors.exchangeItem ? 'border-red-300' : 'border-gray-300'} rounded-lg px-4 py-2.5 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200`}
                  />
                  {errors.exchangeItem && <p className="mt-1 text-sm text-red-500">{errors.exchangeItem}</p>}
                </div>
                <div>
                  <label htmlFor="exchangeDetails" className="block text-sm font-medium text-gray-700 mb-1">
                    Additional Details (optional)
                  </label>
                  <textarea
                    id="exchangeDetails"
                    name="exchangeDetails"
                    value={formData.exchangeDetails}
                    onChange={handleChange}
                    rows={2}
                    placeholder="More details about the item..."
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 resize-none"
                  />
                </div>
                <div>
                  <label htmlFor="exchangePhoto" className="block text-sm font-medium text-gray-700 mb-1">
                    Photo Upload (optional)
                  </label>
                  <input
                    id="exchangePhoto"
                    name="exchangePhoto"
                    type="file"
                    onChange={handleChange}
                    accept="image/*"
                    className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                </div>
                <div>
                  <label htmlFor="estimatedValue" className="block text-sm font-medium text-gray-700 mb-1">
                    Estimated Value (optional)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">$</span>
                    <input
                      id="estimatedValue"
                      name="estimatedValue"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.estimatedValue}
                      onChange={handleChange}
                      placeholder="0.00"
                      className="w-full pl-8 border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Expiry Date */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <label htmlFor="expiryDate" className="block text-sm font-semibold text-gray-700 mb-2">
              Expiry Date <span className="text-red-500">*</span>
            </label>
            <input
              id="expiryDate"
              name="expiryDate"
              type="date"
              value={formData.expiryDate}
              onChange={handleChange}
              className={`w-full border ${errors.expiryDate ? 'border-red-300' : 'border-gray-300'} rounded-lg px-4 py-2.5 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200`}
            />
            {errors.expiryDate && <p className="mt-1 text-sm text-red-500">{errors.expiryDate}</p>}
          </div>

          {/* Update Frequency */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <label htmlFor="updateFrequency" className="block text-sm font-semibold text-gray-700 mb-2">
              Update Frequency
            </label>
            <select
              id="updateFrequency"
              name="updateFrequency"
              value={formData.updateFrequency}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
            >
              {updateFrequencies.map((freq) => (
                <option key={freq} value={freq}>{freq}</option>
              ))}
            </select>
          </div>

          {/* Location */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <label className="block text-sm font-semibold text-gray-700 mb-3">Location</label>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="country" className="block text-sm font-medium text-gray-600 mb-1">
                  Country <span className="text-red-500">*</span>
                </label>
                <input
                  id="country"
                  name="country"
                  type="text"
                  value={formData.country}
                  onChange={handleChange}
                  placeholder="e.g., United States"
                  className={`w-full border ${errors.country ? 'border-red-300' : 'border-gray-300'} rounded-lg px-4 py-2.5 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200`}
                />
                {errors.country && <p className="mt-1 text-sm text-red-500">{errors.country}</p>}
              </div>
              <div>
                <label htmlFor="region" className="block text-sm font-medium text-gray-600 mb-1">
                  City / Region (optional)
                </label>
                <input
                  id="region"
                  name="region"
                  type="text"
                  value={formData.region}
                  onChange={handleChange}
                  placeholder="e.g., New York"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                />
              </div>
            </div>
          </div>

          {/* Visible to specific WishPads */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <label htmlFor="visibleToPads" className="block text-sm font-semibold text-gray-700 mb-2">
              Visible to Specific WishPads Only (optional)
            </label>
            <input
              id="visibleToPads"
              name="visibleToPads"
              type="text"
              value={formData.visibleToPads}
              onChange={handleChange}
              placeholder="Comma-separated WishPad names"
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
            />
            <p className="mt-1 text-xs text-gray-400">
              Leave empty to make visible to all WishPads
            </p>
          </div>

          {/* Submit */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 disabled:cursor-not-allowed text-white font-semibold rounded-lg px-6 py-3 transition-all duration-200 shadow-sm"
            >
              {submitting ? (
                <span className="flex items-center justify-center space-x-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Creating Wish...</span>
                </span>
              ) : (
                'Submit Wish'
              )}
            </button>
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="bg-white hover:bg-gray-50 text-gray-700 font-semibold rounded-lg px-6 py-3 border border-gray-300 transition-all duration-200"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
