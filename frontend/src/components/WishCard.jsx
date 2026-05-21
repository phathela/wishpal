import React from 'react';

const categoryBadgeColors = {
  Houses: 'bg-blue-100 text-blue-700',
  Jobs: 'bg-green-100 text-green-700',
  Services: 'bg-purple-100 text-purple-700',
  Items: 'bg-yellow-100 text-yellow-700',
  Vehicles: 'bg-orange-100 text-orange-700',
  Cleaning: 'bg-teal-100 text-teal-700',
  Repairs: 'bg-red-100 text-red-700',
  Other: 'bg-gray-100 text-gray-700',
};

const statusBadgeColors = {
  active: 'bg-green-100 text-green-700',
  matched: 'bg-blue-100 text-blue-700',
  expired: 'bg-gray-100 text-gray-500',
  completed: 'bg-teal-100 text-teal-700',
};

export default function WishCard({ wish, match, blurred, onClick }) {
  const {
    title,
    category,
    location,
    amount,
    paymentType,
    status,
    createdAt,
    targetDate,
  } = wish || {};

  const categoryColor = categoryBadgeColors[category] || categoryBadgeColors.Other;
  const statusColor = statusBadgeColors[status] || statusBadgeColors.active;

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const truncatedTitle = title && title.length > 60 ? title.slice(0, 60) + '...' : title;

  if (blurred) {
    return (
      <div className="relative bg-white rounded-xl shadow-sm border border-gray-200 p-5 overflow-hidden group cursor-pointer transition-all duration-200 hover:shadow-md" onClick={onClick}>
        <div className="filter blur-sm select-none">
          <div className="flex items-start justify-between mb-3">
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${categoryColor}`}>
              {category || 'Category'}
            </span>
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${statusColor}`}>
              {status || 'active'}
            </span>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Loading...</h3>
          <p className="text-sm text-gray-500 mb-3">Location placeholder</p>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">$--</span>
            <span className="text-xs text-gray-400">{formatDate(createdAt)}</span>
          </div>
        </div>
        <div className="absolute inset-0 flex items-center justify-center bg-white/60 backdrop-blur-[1px] rounded-xl">
          <div className="text-center">
            <svg className="w-8 h-8 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <p className="text-sm font-semibold text-gray-500">Unlock to view</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 cursor-pointer transition-all duration-200 hover:shadow-md hover:border-blue-200"
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-3">
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${categoryColor}`}>
          {category || 'Other'}
        </span>
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${statusColor}`}>
          {status || 'active'}
        </span>
      </div>

      <h3 className="text-lg font-semibold text-gray-900 mb-2">{truncatedTitle || 'Untitled Wish'}</h3>

      {location && (
        <p className="text-sm text-gray-500 mb-3 flex items-center">
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          {location}
        </p>
      )}

      {amount && paymentType === 'pay' && (
        <p className="text-lg font-bold text-blue-600 mb-2">${amount.toLocaleString()}</p>
      )}

      {match && (
        <div className="mb-3">
          <div className="flex items-center space-x-2">
            <span className="text-xs text-gray-500">Match Score:</span>
            <div className="flex-1 bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-500 rounded-full h-2 transition-all duration-500"
                style={{ width: `${match}%` }}
              />
            </div>
            <span className="text-xs font-semibold text-blue-600">{match}%</span>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
        <span className="text-xs text-gray-400">{formatDate(createdAt)}</span>
        {targetDate && (
          <span className="text-xs text-gray-400">Target: {formatDate(targetDate)}</span>
        )}
      </div>
    </div>
  );
}
