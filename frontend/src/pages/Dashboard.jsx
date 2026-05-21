import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import apiClient from '../api/client';
import WishCard from '../components/WishCard';

export default function Dashboard() {
  const { user, weesBalance } = useAuth();
  const role = user?.role || 'wishmate';
  const [wishes, setWishes] = useState([]);
  const [matches, setMatches] = useState([]);
  const [agentComments, setAgentComments] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('wishes');

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      if (role === 'wishmate') {
        const [wishesRes, matchesRes, commentsRes, alertsRes] = await Promise.all([
          apiClient.get('/wishes').catch(() => null),
          apiClient.get('/matches').catch(() => null),
          apiClient.get('/agent-comments').catch(() => null),
          apiClient.get('/alerts').catch(() => null),
        ]);
        if (wishesRes) setWishes(wishesRes.data.wishes || wishesRes.data || []);
        if (matchesRes) setMatches(matchesRes.data.matches || matchesRes.data || []);
        if (commentsRes) setAgentComments(commentsRes.data.comments || commentsRes.data || []);
        if (alertsRes) setAlerts(alertsRes.data.alerts || alertsRes.data || []);
      } else {
        const [statsRes, matchesRes, alertsRes] = await Promise.all([
          apiClient.get('/wishpad/stats').catch(() => null),
          apiClient.get('/wishpad/matches').catch(() => null),
          apiClient.get('/alerts').catch(() => null),
        ]);
        if (statsRes) setStats(statsRes.data);
        if (matchesRes) setMatches(matchesRes.data.matches || matchesRes.data || []);
        if (alertsRes) setAlerts(alertsRes.data.alerts || alertsRes.data || []);
      }
    } catch (err) {
      console.error('Dashboard fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [role]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const referralLink = `https://wishpal.com/ref/${user?.referralCode || ''}`;

  // WishMate View
  if (role === 'wishmate') {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Welcome back, {user?.displayName || user?.username || user?.email?.split('@')[0] || 'Friend'}
            </h1>
            <p className="text-gray-500 mt-1">Here's what's happening with your wishes</p>
          </div>
          <div className="flex items-center space-x-4 mt-4 sm:mt-0">
            <div className="flex items-center space-x-1 bg-yellow-50 border border-yellow-200 rounded-full px-4 py-2">
              <span className="text-yellow-500 font-semibold">✦</span>
              <span className="text-sm font-semibold text-yellow-700">{weesBalance} Wees</span>
            </div>
            <Link
              to="/buy-wees"
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Buy Wees
            </Link>
          </div>
        </div>

        {/* Quick Action */}
        <div className="mb-8">
          <Link
            to="/wish/new"
            className="inline-flex items-center space-x-2 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg px-6 py-3 transition-all duration-200 shadow-sm hover:shadow-md"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <span>Create New Wish</span>
          </Link>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 bg-gray-100 rounded-lg p-1 mb-8 max-w-md">
          {['wishes', 'matches', 'agent', 'alerts'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2 text-sm font-medium rounded-md capitalize transition-all duration-200 ${
                activeTab === tab
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab === 'agent' ? 'Agent Comments' : tab}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'wishes' && (
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">My Wishes</h2>
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : wishes.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
                <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                <p className="text-gray-500 mb-4">You haven't created any wishes yet</p>
                <Link
                  to="/wish/new"
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  Create your first wish
                </Link>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {wishes.slice().reverse().map((wish) => (
                  <WishCard key={wish._id || wish.id} wish={wish} />
                ))}
              </div>
            )}
          </section>
        )}

        {activeTab === 'matches' && (
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">My Matches</h2>
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : matches.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
                <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <p className="text-gray-500">No matches yet. Your wishes will be matched automatically.</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {matches.map((match) => (
                  <WishCard
                    key={match._id || match.id}
                    wish={match.wish || match}
                    match={match.score || match.matchScore}
                    blurred={!match.unlocked}
                  />
                ))}
              </div>
            )}
          </section>
        )}

        {activeTab === 'agent' && (
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Agent Activity</h2>
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : agentComments.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
                <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-gray-500">No agent activity yet. Create a wish to get started.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {agentComments.map((comment) => (
                  <div key={comment._id || comment.id} className="bg-white rounded-xl border border-gray-200 p-5">
                    <div className="flex items-start space-x-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900">WishPal AI Agent</p>
                        <p className="text-sm text-gray-600 mt-1">{comment.text || comment.content || comment.message}</p>
                        <p className="text-xs text-gray-400 mt-2">
                          {comment.createdAt ? new Date(comment.createdAt).toLocaleString() : ''}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {activeTab === 'alerts' && (
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">My Alerts</h2>
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : alerts.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
                <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                <p className="text-gray-500 mb-4">No alerts set up</p>
                <Link
                  to="/profile"
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  Create an alert
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {alerts.map((alert) => (
                  <div key={alert._id || alert.id} className="bg-white rounded-xl border border-gray-200 p-5 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{alert.keyword || alert.query}</p>
                      <p className="text-sm text-gray-500">{alert.category ? `Category: ${alert.category}` : 'All categories'}</p>
                    </div>
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                      alert.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                    }`}>
                      {alert.active ? 'Active' : 'Paused'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* Referral Section */}
        <section className="mt-8 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100 p-6">
          <h3 className="font-semibold text-gray-900 mb-2">Your Referral Link</h3>
          <p className="text-sm text-gray-600 mb-3">Share this link and earn rewards when people sign up</p>
          <div className="flex items-center space-x-2">
            <input
              type="text"
              value={referralLink}
              readOnly
              className="flex-1 bg-white border border-gray-300 rounded-lg px-4 py-2 text-sm text-gray-700 focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={() => {
                navigator.clipboard.writeText(referralLink);
                alert('Referral link copied!');
              }}
              className="bg-blue-500 hover:bg-blue-600 text-white rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200"
            >
              Copy
            </button>
          </div>
        </section>
      </div>
    );
  }

  // WishPad View
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Welcome back, {user?.displayName || user?.username || 'Business'}
          </h1>
          <p className="text-gray-500 mt-1">Your WishPad dashboard</p>
        </div>
        <div className="flex items-center space-x-4 mt-4 sm:mt-0">
          <div className="flex items-center space-x-1 bg-yellow-50 border border-yellow-200 rounded-full px-4 py-2">
            <span className="text-yellow-500 font-semibold">✦</span>
            <span className="text-sm font-semibold text-yellow-700">{weesBalance} Wees</span>
          </div>
          <Link to="/buy-wees" className="text-sm text-blue-600 hover:text-blue-700 font-medium">Buy Wees</Link>
        </div>
      </div>

      {/* Quick Links */}
      <div className="flex flex-wrap gap-3 mb-8">
        <Link
          to={`/b/${user?.username || user?.slug}`}
          className="inline-flex items-center space-x-2 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg px-5 py-2.5 transition-all duration-200 shadow-sm"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
          <span>My WishPad Page</span>
        </Link>
        <Link
          to="/wish/new"
          className="inline-flex items-center space-x-2 bg-white hover:bg-gray-50 text-gray-700 font-semibold rounded-lg px-5 py-2.5 border border-gray-300 transition-all duration-200"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          <span>Create Competition</span>
        </Link>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <p className="text-sm text-gray-500 mb-1">Total Matches</p>
            <p className="text-3xl font-bold text-gray-900">{stats.totalMatches || 0}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <p className="text-sm text-gray-500 mb-1">Unlocked</p>
            <p className="text-3xl font-bold text-green-600">{stats.unlocked || 0}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <p className="text-sm text-gray-500 mb-1">Top Category</p>
            <p className="text-lg font-bold text-gray-900">{stats.topCategory || 'N/A'}</p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex space-x-1 bg-gray-100 rounded-lg p-1 mb-8 max-w-md">
        {['matches', 'alerts', 'submit'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 text-sm font-medium rounded-md capitalize transition-all duration-200 ${
              activeTab === tab
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab === 'submit' ? 'Direct Submit' : tab}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'matches' && (
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Matches</h2>
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : matches.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
              <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8" />
              </svg>
              <p className="text-gray-500">No matches yet. Wishes will appear here once matched.</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {matches.map((match) => (
                <WishCard
                  key={match._id || match.id}
                  wish={match.wish || match}
                  match={match.score || match.matchScore}
                  blurred={!match.unlocked}
                />
              ))}
            </div>
          )}
        </section>
      )}

      {activeTab === 'alerts' && (
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Alerts</h2>
          {alerts.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
              <p className="text-gray-500">No alerts configured</p>
            </div>
          ) : (
            <div className="space-y-3">
              {alerts.map((alert) => (
                <div key={alert._id || alert.id} className="bg-white rounded-xl border border-gray-200 p-5 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{alert.keyword || alert.query}</p>
                    <p className="text-sm text-gray-500">{alert.category || 'All categories'}</p>
                  </div>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                    alert.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                  }`}>
                    {alert.active ? 'Active' : 'Paused'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {activeTab === 'submit' && (
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Direct Wish Submission</h2>
          <DirectWishForm />
        </section>
      )}

      {/* Referral Section */}
      <section className="mt-8 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100 p-6">
        <h3 className="font-semibold text-gray-900 mb-2">Your Referral Link</h3>
        <p className="text-sm text-gray-600 mb-3">Share this link to get more users</p>
        <div className="flex items-center space-x-2">
          <input
            type="text"
            value={referralLink}
            readOnly
            className="flex-1 bg-white border border-gray-300 rounded-lg px-4 py-2 text-sm text-gray-700 focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={() => {
              navigator.clipboard.writeText(referralLink);
              alert('Referral link copied!');
            }}
            className="bg-blue-500 hover:bg-blue-600 text-white rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200"
          >
            Copy
          </button>
        </div>
      </section>
    </div>
  );
}

function DirectWishForm() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!title.trim() || !description.trim()) {
      setError('Please fill in title and description');
      return;
    }
    setLoading(true);
    try {
      await apiClient.post('/wishes/direct', { title, description, category });
      setSubmitted(true);
      setTitle('');
      setDescription('');
      setCategory('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to submit wish');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <p className="text-lg font-semibold text-gray-900 mb-2">Wish Submitted!</p>
        <p className="text-sm text-gray-500 mb-4">The WishPal AI Agent will process this wish.</p>
        <button
          onClick={() => setSubmitted(false)}
          className="text-blue-600 hover:text-blue-700 font-medium"
        >
          Submit another
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">{error}</div>
      )}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Wish Title</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="What do you need?"
          className="w-full border border-gray-300 rounded-lg px-4 py-2 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-4 py-2 text-gray-900 focus:ring-2 focus:ring-blue-500"
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
          className="w-full border border-gray-300 rounded-lg px-4 py-2 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 resize-none"
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white font-semibold rounded-lg px-6 py-2.5 transition-all duration-200"
      >
        {loading ? 'Submitting...' : 'Submit Wish'}
      </button>
    </form>
  );
}
