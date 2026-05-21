import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const testimonials = [
  {
    date: '12/10/2026',
    name: 'TG Smith',
    text: 'Wished Car for $100,000',
    result: 'Bought house for $90,000',
    emoji: '🏠',
  },
  {
    date: '06/10/2026',
    name: 'TG Gonzalez',
    text: 'Wished someone to clean my house in exchange for iPhone 11',
    result: 'Cleaner found',
    emoji: '🧹',
  },
];

const steps = [
  {
    number: '01',
    title: 'Post a Wish',
    description: 'Tell us what you want — a job, a service, an item, or anything else. Add details, set a budget, and let the AI work for you.',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
      </svg>
    ),
  },
  {
    number: '02',
    title: 'AI Matches',
    description: 'Our AI agents scan thousands of WishPads and potential fulfillers to find the perfect match for your wish — automatically.',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    ),
  },
  {
    number: '03',
    title: 'Connect',
    description: 'Get matched and connect directly with the person or business that can fulfill your wish. No middlemen, no fees.',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
];

export default function Landing() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-blue-50">
        <div className="absolute inset-0 bg-grid-slate-100 bg-[size:40px_40px] opacity-30" />
        <div className="relative max-w-7xl mx-auto px-4 py-20 sm:py-28 lg:py-36">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center space-x-2 bg-blue-100 text-blue-700 rounded-full px-4 py-1.5 mb-8 text-sm font-medium">
              <span className="text-lg">✨</span>
              <span>AI-Powered Wish Matching</span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 leading-tight mb-6">
              This is where your wishes are actualised. AI agents will do everything for you whilst you get what you want.
            </h1>
            <p className="text-xl sm:text-2xl text-gray-600 mb-10 max-w-3xl mx-auto leading-relaxed">
              Your wishes are somebody's opportunity. Be matched by technology.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
              {user ? (
                <Link
                  to="/wish/new"
                  className="bg-blue-500 hover:bg-blue-600 text-white text-lg font-semibold rounded-lg px-8 py-4 transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  Make a Wish
                </Link>
              ) : (
                <Link
                  to="/register"
                  className="bg-blue-500 hover:bg-blue-600 text-white text-lg font-semibold rounded-lg px-8 py-4 transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  Get Started
                </Link>
              )}
              <Link
                to="/search"
                className="bg-white hover:bg-gray-50 text-gray-700 text-lg font-semibold rounded-lg px-8 py-4 border border-gray-300 transition-all duration-200"
              >
                Explore Wishes
              </Link>
            </div>

            {/* Search Bar */}
            <form onSubmit={handleSearch} className="max-w-2xl mx-auto">
              <div className="relative">
                <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search wishes... e.g., 'house cleaning', 'web developer job'"
                  className="w-full pl-12 pr-4 py-4 bg-white border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 shadow-sm"
                />
                <button
                  type="submit"
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg px-6 py-2 font-medium transition-all duration-200"
                >
                  Search
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">How It Works</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Three simple steps to get your wishes fulfilled
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((step) => (
              <div key={step.number} className="relative bg-white rounded-xl border border-gray-200 p-8 text-center hover:shadow-lg transition-all duration-200">
                <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-xl flex items-center justify-center mx-auto mb-6">
                  {step.icon}
                </div>
                <span className="text-sm font-bold text-blue-500 tracking-wider uppercase mb-2 block">
                  Step {step.number}
                </span>
                <h3 className="text-xl font-bold text-gray-900 mb-4">{step.title}</h3>
                <p className="text-gray-600 leading-relaxed">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Success Stories</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Real wishes that found their match
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {testimonials.map((item, index) => (
              <div key={index} className="bg-white rounded-xl border border-gray-200 p-8 hover:shadow-lg transition-all duration-200">
                <div className="flex items-start space-x-4">
                  <div className="w-14 h-14 bg-blue-50 rounded-full flex items-center justify-center text-2xl flex-shrink-0">
                    {item.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-blue-500 font-medium">{item.date}</span>
                      <span className="text-xs bg-blue-50 text-blue-600 font-semibold px-2.5 py-1 rounded-full">Verified</span>
                    </div>
                    <p className="font-bold text-gray-900 text-lg mb-1">{item.name}</p>
                    <p className="text-gray-600 mb-1">{item.text}</p>
                    <div className="flex items-center space-x-2 mt-3 pt-3 border-t border-gray-100">
                      <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-green-700 font-medium">{item.result}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Legal Disclaimer */}
      <section className="bg-gray-900 text-gray-300 py-8">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-gray-800 rounded-full mb-4">
            <svg className="w-6 h-6 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <p className="text-sm leading-relaxed max-w-3xl mx-auto">
            WishPal does not sell products or accept payments for services. We only match wishes with potential fulfillers. All transactions are between users.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center space-x-2 mb-4">
                <span className="text-2xl">✨</span>
                <span className="text-xl font-bold text-gray-900">WishPal</span>
              </div>
              <p className="text-sm text-gray-500 leading-relaxed">
                Your wishes, matched by AI. We connect you with the right people to fulfill your wishes.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-4">Platform</h4>
              <ul className="space-y-2">
                <li><Link to="/search" className="text-sm text-gray-500 hover:text-blue-600 transition-colors duration-200">Browse Wishes</Link></li>
                <li><Link to="/register" className="text-sm text-gray-500 hover:text-blue-600 transition-colors duration-200">Join as WishMate</Link></li>
                <li><Link to="/register" className="text-sm text-gray-500 hover:text-blue-600 transition-colors duration-200">Join as WishPad</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-4">Support</h4>
              <ul className="space-y-2">
                <li><Link to="#" className="text-sm text-gray-500 hover:text-blue-600 transition-colors duration-200">FAQ</Link></li>
                <li><Link to="#" className="text-sm text-gray-500 hover:text-blue-600 transition-colors duration-200">Contact Us</Link></li>
                <li><Link to="#" className="text-sm text-gray-500 hover:text-blue-600 transition-colors duration-200">Privacy Policy</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-4">Legal</h4>
              <ul className="space-y-2">
                <li><Link to="#" className="text-sm text-gray-500 hover:text-blue-600 transition-colors duration-200">Terms of Service</Link></li>
                <li><Link to="#" className="text-sm text-gray-500 hover:text-blue-600 transition-colors duration-200">Cookie Policy</Link></li>
              </ul>
            </div>
          </div>
          <div className="mt-10 pt-8 border-t border-gray-200 text-center">
            <p className="text-sm text-gray-400">&copy; {new Date().getFullYear()} WishPal. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
