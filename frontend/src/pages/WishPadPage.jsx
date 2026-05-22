import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import apiClient from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function WishPadPage() {
  const { slug } = useParams();
  const { user } = useAuth();
  const [wishpad, setWishpad] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Direct submission form
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    const fetchWishpad = async () => {
      try {
        setLoading(true);
        const response = await apiClient.get(`/wishpad/b/${slug}`);
        setWishpad(response.data.data || response.data.wishpad);
      } catch (err) {
        setError(err.response?.data?.error || 'WishPad not found');
      } finally {
        setLoading(false);
      }
    };
    if (slug) fetchWishpad();
  }, [slug]);

  const handleSubmitWish = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!title.trim() || !description.trim()) {
      setFormError('Please fill in title and description');
      return;
    }
    setSubmitting(true);
    try {
      await apiClient.post('/wishes/direct', {
        title,
        description,
        category,
        wishpadSlug: slug,
      });
      setSubmitted(true);
    } catch (err) {
      setFormError(err.response?.data?.error || 'Failed to submit wish');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">WishPad Not Found</h2>
          <p className="text-gray-500 mb-6">{error}</p>
          <Link
            to="/search"
            className="inline-block bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg px-6 py-3 transition-all duration-200"
          >
            Browse Wishes
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Business Profile Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden mb-8">
          {/* Cover */}
          <div className="h-32 sm:h-48 bg-gradient-to-r from-blue-500 to-indigo-600" />

          {/* Profile Info */}
          <div className="px-6 sm:px-8 pb-8">
            <div className="flex flex-col sm:flex-row sm:items-end -mt-12 sm:-mt-16 mb-6">
              <div className="w-24 h-24 sm:w-32 sm:h-32 bg-white rounded-2xl shadow-md flex items-center justify-center text-4xl sm:text-5xl border-4 border-white flex-shrink-0">
                {(wishpad?.logoUrl) ? (
                  <img src={wishpad.logoUrl} alt={wishpad.name} className="w-full h-full object-cover rounded-xl" />
                ) : (
                  <span>{wishpad?.name?.charAt(0)?.toUpperCase() || 'B'}</span>
                )}
              </div>
              <div className="sm:ml-6 mt-4 sm:mt-0 sm:pb-2">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{wishpad?.name || 'WishPad'}</h1>
                <p className="text-gray-500">@{wishpad?.username || slug}</p>
              </div>
            </div>

            {/* Description */}
            {wishpad?.description && (
              <p className="text-gray-700 leading-relaxed mb-6">{wishpad.description}</p>
            )}

            {/* Contact & Stats */}
            <div className="flex flex-wrap gap-4 mb-6">
              {wishpad?.email && (
                <a href={`mailto:${wishpad.email}`} className="flex items-center space-x-1.5 text-sm text-gray-500 hover:text-blue-600 transition-colors duration-200">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <span>{wishpad.email}</span>
                </a>
              )}
              {wishpad?.website && (
                <a href={wishpad.website} target="_blank" rel="noopener noreferrer" className="flex items-center space-x-1.5 text-sm text-gray-500 hover:text-blue-600 transition-colors duration-200">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                  </svg>
                  <span>{wishpad.website}</span>
                </a>
              )}
            </div>

            {/* Stats */}
            <div className="flex space-x-8 pt-6 border-t border-gray-100">
              <div>
                <p className="text-2xl font-bold text-gray-900">{wishpad?.matchCount || 0}</p>
                <p className="text-sm text-gray-500">Matches Found</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {wishpad?.createdAt ? new Date(wishpad.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'N/A'}
                </p>
                <p className="text-sm text-gray-500">Joined</p>
              </div>
            </div>
          </div>
        </div>

        {/* Competitions */}
        {wishpad?.competitions && wishpad.competitions.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Active Competitions</h2>
            <div className="space-y-4">
              {wishpad.competitions.map((comp) => (
                <div key={comp._id || comp.id} className="border border-gray-200 rounded-lg p-4 hover:border-blue-200 transition-all duration-200">
                  <h3 className="font-semibold text-gray-900">{comp.title}</h3>
                  <p className="text-sm text-gray-500 mt-1">{comp.description}</p>
                  {comp.reward && (
                    <p className="text-sm font-medium text-blue-600 mt-2">Prize: {comp.reward}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Submit a Wish Form */}
        {user ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Submit a Wish to {wishpad?.name || 'this WishPad'}</h2>

            {submitted ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-lg font-semibold text-gray-900 mb-2">Wish Submitted!</p>
                <p className="text-sm text-gray-500 mb-4">Your wish has been sent to {wishpad?.name} for review.</p>
                <button
                  onClick={() => {
                    setSubmitted(false);
                    setTitle('');
                    setDescription('');
                    setCategory('');
                  }}
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  Submit another
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmitWish} className="space-y-4">
                {formError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">{formError}</div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Wish Title</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="What do you need?"
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select category</option>
                    {['Houses', 'Jobs', 'Services', 'Items', 'Vehicles', 'Cleaning', 'Repairs', 'Other'].map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={4}
                    placeholder="Describe your wish in detail..."
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                </div>
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white font-semibold rounded-lg px-6 py-2.5 transition-all duration-200"
                >
                  {submitting ? 'Submitting...' : 'Submit Wish'}
                </button>
              </form>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
            <p className="text-gray-600 mb-4">Sign in to submit a wish to this WishPad</p>
            <Link
              to="/login"
              className="inline-block bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg px-6 py-2.5 transition-all duration-200"
            >
              Sign In
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
