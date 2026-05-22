import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import apiClient from '../api/client';

export default function Profile() {
  const { user, weesBalance, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('general');
  const [alerts, setAlerts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  // General form state
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [email, setEmail] = useState(user?.email || '');
  const [saveMsg, setSaveMsg] = useState('');
  const [saveError, setSaveError] = useState('');

  // Password form state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [passwordMsg, setPasswordMsg] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // Alert form state
  const [newAlertKeyword, setNewAlertKeyword] = useState('');
  const [newAlertCategory, setNewAlertCategory] = useState('');

  const referralLink = `https://wishpal.com/ref/${user?.referralCode || ''}`;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [alertsRes, txRes] = await Promise.all([
          apiClient.get('/alerts').catch(() => null),
          apiClient.get('/payments/transactions').catch(() => null),
        ]);
        if (alertsRes) setAlerts(alertsRes.data?.data?.alerts || []);
        if (txRes) setTransactions(txRes.data?.data?.transactions || []);
      } catch (err) {
        console.error('Profile fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaveMsg('');
    setSaveError('');
    try {
      await apiClient.put('/auth/profile', { displayName });
      setSaveMsg('Profile updated successfully');
    } catch (err) {
      setSaveError(err.response?.data?.error || 'Failed to update profile');
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordMsg('');
    setPasswordError('');

    if (!currentPassword || !newPassword || !confirmNewPassword) {
      setPasswordError('Please fill in all password fields');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setPasswordError('New passwords do not match');
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters');
      return;
    }

    try {
      await apiClient.put('/auth/change-password', {
        currentPassword,
        newPassword,
      });
      setPasswordMsg('Password changed successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (err) {
      setPasswordError(err.response?.data?.error || 'Failed to change password');
    }
  };

  const handleCreateAlert = async (e) => {
    e.preventDefault();
    if (!newAlertKeyword.trim()) return;
    try {
      const response = await apiClient.post('/alerts', {
        keyword: newAlertKeyword,
        category: newAlertCategory || undefined,
      });
      setAlerts((prev) => [...prev, response.data.alert || response.data]);
      setNewAlertKeyword('');
      setNewAlertCategory('');
    } catch (err) {
      console.error('Failed to create alert:', err);
    }
  };

  const handleDeleteAlert = async (alertId) => {
    try {
      await apiClient.delete(`/alerts/${alertId}`);
      setAlerts((prev) => prev.filter((a) => (a._id || a.id) !== alertId));
    } catch (err) {
      console.error('Failed to delete alert:', err);
    }
  };

  const handleToggleAlert = async (alertId, active) => {
    try {
      await apiClient.put(`/alerts/${alertId}`, { active: !active });
      setAlerts((prev) =>
        prev.map((a) =>
          (a._id || a.id) === alertId ? { ...a, active: !active } : a
        )
      );
    } catch (err) {
      console.error('Failed to toggle alert:', err);
    }
  };

  const getUserInitials = () => {
    const name = displayName || user?.username || user?.email || '';
    return name.charAt(0).toUpperCase();
  };

  const tabs = [
    { id: 'general', label: 'General' },
    { id: 'password', label: 'Password' },
    { id: 'alerts', label: 'Alerts' },
    { id: 'transactions', label: 'Transactions' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6">Profile Settings</h1>

        <div className="flex flex-col md:flex-row gap-6">
          {/* Sidebar */}
          <aside className="md:w-64 flex-shrink-0">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sticky top-24">
              <div className="text-center mb-6">
                <div className="w-20 h-20 bg-blue-500 rounded-full flex items-center justify-center text-3xl font-bold text-white mx-auto mb-3">
                  {getUserInitials()}
                </div>
                <h2 className="font-semibold text-gray-900">{displayName || user?.username || 'User'}</h2>
                <p className="text-sm text-gray-500">{email || user?.email}</p>
              </div>

              <div className="flex items-center justify-center space-x-1 bg-yellow-50 border border-yellow-200 rounded-full px-4 py-2 mb-6">
                <span className="text-yellow-500 font-semibold">✦</span>
                <span className="text-sm font-semibold text-yellow-700">{weesBalance} Wees</span>
              </div>

              <nav className="space-y-1">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                      activeTab === tab.id
                        ? 'bg-blue-50 text-blue-600'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>
          </aside>

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {/* General */}
            {activeTab === 'general' && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-6">General Settings</h2>

                {saveMsg && (
                  <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-600">{saveMsg}</div>
                )}
                {saveError && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">{saveError}</div>
                )}

                <form onSubmit={handleSaveProfile} className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Display Name</label>
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 focus:ring-2 focus:ring-blue-500 transition-all duration-200"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input
                      type="email"
                      value={email || user?.email || ''}
                      disabled
                      className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-gray-400 bg-gray-50 cursor-not-allowed"
                    />
                    <p className="text-xs text-gray-400 mt-1">Email cannot be changed</p>
                  </div>

                  {/* Username Section */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={user?.username || ''}
                        disabled
                        className="flex-1 border border-gray-200 rounded-lg px-4 py-2.5 text-gray-400 bg-gray-50 cursor-not-allowed"
                      />
                      {!user?.premiumUsername && (
                        <button
                          type="button"
                          className="text-sm bg-yellow-50 border border-yellow-200 text-yellow-700 rounded-lg px-3 py-2.5 font-medium hover:bg-yellow-100 transition-all duration-200 whitespace-nowrap"
                        >
                          Upgrade to Premium
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Referral Link */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Referral Link</label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={referralLink}
                        readOnly
                        className="flex-1 border border-gray-300 rounded-lg px-4 py-2.5 text-sm text-gray-700 bg-gray-50 focus:ring-2 focus:ring-blue-500"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(referralLink);
                          setSaveMsg('Referral link copied!');
                        }}
                        className="bg-blue-500 hover:bg-blue-600 text-white rounded-lg px-4 py-2.5 text-sm font-medium transition-all duration-200"
                      >
                        Copy
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg px-6 py-2.5 transition-all duration-200"
                  >
                    Save Changes
                  </button>
                </form>
              </div>
            )}

            {/* Password */}
            {activeTab === 'password' && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-6">Change Password</h2>

                {passwordMsg && (
                  <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-600">{passwordMsg}</div>
                )}
                {passwordError && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">{passwordError}</div>
                )}

                <form onSubmit={handleChangePassword} className="space-y-5 max-w-md">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
                    <input
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 focus:ring-2 focus:ring-blue-500 transition-all duration-200"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="At least 8 characters"
                      className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 transition-all duration-200"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                    <input
                      type="password"
                      value={confirmNewPassword}
                      onChange={(e) => setConfirmNewPassword(e.target.value)}
                      placeholder="Re-enter new password"
                      className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 transition-all duration-200"
                    />
                  </div>

                  <div className="pt-2 border-t border-gray-100">
                    <p className="text-xs text-red-400 font-medium mb-3">Danger Zone</p>
                    <button
                      type="submit"
                      className="bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg px-6 py-2.5 transition-all duration-200"
                    >
                      Change Password
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Alerts */}
            {activeTab === 'alerts' && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-6">Saved Alerts</h2>

                {/* Create Alert */}
                <form onSubmit={handleCreateAlert} className="flex items-end space-x-2 mb-6">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Keyword</label>
                    <input
                      type="text"
                      value={newAlertKeyword}
                      onChange={(e) => setNewAlertKeyword(e.target.value)}
                      placeholder="e.g., house cleaning"
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="w-40">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                    <select
                      value={newAlertCategory}
                      onChange={(e) => setNewAlertCategory(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">All</option>
                      {['Houses', 'Jobs', 'Services', 'Items', 'Vehicles', 'Cleaning', 'Repairs', 'Other'].map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                  <button
                    type="submit"
                    className="bg-blue-500 hover:bg-blue-600 text-white rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200"
                  >
                    Add Alert
                  </button>
                </form>

                {/* Alert List */}
                {loading ? (
                  <div className="flex justify-center py-8">
                    <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                ) : alerts.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <p>No alerts yet. Create one above to get notified about matching wishes.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {alerts.map((alert) => (
                      <div key={alert._id || alert.id} className="flex items-center justify-between border border-gray-200 rounded-lg p-4 hover:border-blue-200 transition-all duration-200">
                        <div>
                          <p className="font-medium text-gray-900">{alert.keyword || alert.query}</p>
                          <p className="text-sm text-gray-500">{alert.category || 'All categories'}</p>
                        </div>
                        <div className="flex items-center space-x-3">
                          <button
                            onClick={() => handleToggleAlert(alert._id || alert.id, alert.active)}
                            className={`text-xs font-semibold px-3 py-1.5 rounded-full transition-all duration-200 ${
                              alert.active
                                ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                            }`}
                          >
                            {alert.active ? 'Active' : 'Paused'}
                          </button>
                          <button
                            onClick={() => handleDeleteAlert(alert._id || alert.id)}
                            className="text-red-400 hover:text-red-600 transition-colors duration-200"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Transactions */}
            {activeTab === 'transactions' && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-6">Transaction History</h2>

                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-1 bg-yellow-50 border border-yellow-200 rounded-full px-4 py-2">
                    <span className="text-yellow-500 font-semibold">✦</span>
                    <span className="text-sm font-semibold text-yellow-700">{weesBalance} Wees Balance</span>
                  </div>
                </div>

                {loading ? (
                  <div className="flex justify-center py-8">
                    <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                ) : transactions.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p>No transactions yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {transactions.map((tx) => (
                      <div key={tx._id || tx.id} className="flex items-center justify-between border border-gray-200 rounded-lg p-4">
                        <div>
                          <p className="font-medium text-gray-900">{tx.description || 'Wees Purchase'}</p>
                          <p className="text-sm text-gray-500">
                            {tx.createdAt ? new Date(tx.createdAt).toLocaleDateString() : ''}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-green-600">
                            {tx.amount > 0 ? '+' : ''}{tx.weesAmount || tx.amount} Wees
                          </p>
                          {tx.amount && (
                            <p className="text-xs text-gray-400">${tx.amount.toFixed(2)}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
