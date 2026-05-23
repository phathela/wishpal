import React, { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';

function WishPalLogo({ size = 32, showText = true }) {
  const boxSize = size;
  const textSize = Math.round(size * 0.58);
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: showText ? '6px' : '0', lineHeight: 1 }}>
      <svg width={boxSize} height={boxSize} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
        <rect width="32" height="32" rx="7" fill="#3B82F6" />
        <path d="M8 10l4 12 4-12 4 12 4-12" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </svg>
      {showText && <span style={{ fontWeight: 700, fontSize: textSize, color: '#1F2937', letterSpacing: '-0.3px' }}>WishPal</span>}
    </span>
  );
}

const sections = [
  { id: 'individuals', labelKey: 'features.individuals.title', color: 'from-blue-500 to-indigo-600', bg: 'bg-blue-50', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
  { id: 'businesses', labelKey: 'features.businesses.title', color: 'from-emerald-500 to-green-600', bg: 'bg-emerald-50', icon: 'M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' },
  { id: 'ngos', labelKey: 'features.ngos.title', color: 'from-purple-500 to-pink-600', bg: 'bg-purple-50', icon: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z' },
];

const benefitsList = [
  { key: 'benefit1', num: '01' },
  { key: 'benefit2', num: '02' },
  { key: 'benefit3', num: '03' },
  { key: 'benefit4', num: '04' },
  { key: 'benefit5', num: '05' },
  { key: 'benefit6', num: '06' },
  { key: 'benefit7', num: '07' },
];

export default function Benefits() {
  const { currentTheme } = useTheme();
  const { t } = useLanguage();
  const location = useLocation();

  // Scroll to anchor on mount
  useEffect(() => {
    const hash = location.hash?.replace('#', '');
    if (hash && sections.some(s => s.id === hash)) {
      setTimeout(() => {
        const el = document.getElementById(hash);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }, [location.hash]);

  const renderBenefits = (group) => {
    if (!group) return null;
    return benefitsList.map((b) => {
      const benefit = group[b.key];
      if (!benefit) return null;
      return (
        <div key={b.key} className="flex items-start space-x-4 p-5 rounded-xl bg-white border border-gray-100 hover:shadow-md hover:border-gray-200 transition-all duration-300">
          <span className="text-2xl font-black text-gray-200 leading-none flex-shrink-0 w-10">{b.num}</span>
          <div className="flex-1 min-w-0">
            <h4 className="font-bold text-gray-900 text-lg mb-2">{benefit.title}</h4>
            <p className="text-gray-600 leading-relaxed">{benefit.desc}</p>
          </div>
        </div>
      );
    });
  };

  const bp = (key) => {
    const val = t(`benefitsPage.${key}`);
    // If the key returned itself (no translation), return empty
    return val === `benefitsPage.${key}` ? '' : val;
  };

  return (
    <div className={`min-h-screen ${currentTheme.sectionAlt === 'bg-gray-50' ? 'bg-gradient-to-b from-gray-50 to-white' : currentTheme.sectionAlt}`}>
      {/* ═══════════════ HERO ═══════════════ */}
      <section className={`relative overflow-hidden bg-gradient-to-br ${currentTheme.hero}`}>
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />
        <div className="relative max-w-7xl mx-auto px-4 py-16 sm:py-20 lg:py-28">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-sm text-white rounded-full px-5 py-2 mb-6 text-sm font-medium border border-white/10">
              <WishPalLogo size={20} showText={false} />
              <span>{t('features.title')}</span>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white leading-tight mb-4">
              {t('features.title')}
            </h1>
            <p className="text-lg sm:text-xl text-white/80 max-w-3xl mx-auto leading-relaxed">
              {t('features.subtitle')}
            </p>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 60" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 60V30C240 0 480 0 720 30C960 60 1200 60 1440 30V60H0Z" fill="#F9FAFB" />
          </svg>
        </div>
      </section>

      {/* ═══════════════ QUICK NAV TABS ═══════════════ */}
      <section className="bg-white border-b border-gray-100 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-center space-x-2 sm:space-x-4 overflow-x-auto">
            {sections.map((s) => (
              <a
                key={s.id}
                href={`#${s.id}`}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap ${
                  location.hash === `#${s.id}`
                    ? 'bg-gray-100 text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={s.icon} />
                </svg>
                <span>{t(s.labelKey)}</span>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ INDIVIDUALS SECTION ═══════════════ */}
      <section id="individuals" className="py-16 sm:py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className={`rounded-3xl overflow-hidden shadow-xl border border-gray-200 bg-white`}>
            <div className={`bg-gradient-to-r from-blue-500 to-indigo-600 px-8 py-10 sm:px-12 sm:py-12`}>
              <div className="flex items-center space-x-4 mb-4">
                <div className="w-14 h-14 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div>
                  <span className="text-blue-200 text-sm font-semibold uppercase tracking-wider">{t('features.individuals.title')}</span>
                  <h2 className="text-3xl sm:text-4xl font-bold text-white mt-1">{bp('individuals.title') || t('features.individuals.title')}</h2>
                </div>
              </div>
              <p className="text-blue-100 text-lg max-w-3xl leading-relaxed">
                {bp('individuals.subtitle')}
              </p>
            </div>
            <div className="p-8 sm:p-12">
              <div className="max-w-4xl mb-10">
                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center space-x-2">
                  <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>How It Works</span>
                </h3>
                <p className="text-gray-600 leading-relaxed text-lg">
                  {bp('individuals.hero') || 'WishPal gives individuals a powerful platform to get things done without the hassle. Post a wish, and let AI work around the clock to connect you with the right people, services, and opportunities.'}
                </p>
              </div>
              <div className="space-y-3">
                {renderBenefits({
                  benefit1: {
                    title: bp('individuals.benefit1.title') || 'Instant Access to Solutions',
                    desc: bp('individuals.benefit1.desc') || t('features.individuals.benefit1Desc'),
                  },
                  benefit2: {
                    title: bp('individuals.benefit2.title') || 'Personalized Advice & Leads',
                    desc: bp('individuals.benefit2.desc') || t('features.individuals.benefit2Desc'),
                  },
                  benefit3: {
                    title: bp('individuals.benefit3.title') || 'Problem Solver',
                    desc: bp('individuals.benefit3.desc') || t('features.individuals.benefit3Desc'),
                  },
                  benefit4: {
                    title: bp('individuals.benefit4.title') || 'Free & Stress-Free',
                    desc: bp('individuals.benefit4.desc') || t('features.individuals.benefit4Desc'),
                  },
                  benefit5: {
                    title: bp('individuals.benefit5.title') || 'Always Save Costs when Buying',
                    desc: bp('individuals.benefit5.desc') || 'Get matched with competitive offers for products and services you need.',
                  },
                  benefit6: {
                    title: bp('individuals.benefit6.title') || 'Be Informed on Anything',
                    desc: bp('individuals.benefit6.desc') || 'Stay updated with AI-curated information relevant to your wishes and interests.',
                  },
                  benefit7: {
                    title: bp('individuals.benefit7.title') || 'Generate Quick Cash',
                    desc: bp('individuals.benefit7.desc') || 'Turn your talents, spare time, or unused items into extra income fast.',
                  },
                })}
              </div>
              <div className="mt-10 p-6 bg-blue-50 rounded-xl border border-blue-100">
                <div className="flex items-start space-x-3">
                  <svg className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <p className="text-blue-900 font-semibold text-lg">{bp('individuals.summary') || 'For individuals, WishPal is your personal assistant, researcher, matchmaker, and problem solver — all in one.'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════ BUSINESSES SECTION ═══════════════ */}
      <section id="businesses" className={`py-16 sm:py-20 ${currentTheme.sectionAlt}`}>
        <div className="max-w-7xl mx-auto px-4">
          <div className="rounded-3xl overflow-hidden shadow-xl border border-gray-200 bg-white">
            <div className="bg-gradient-to-r from-emerald-500 to-green-600 px-8 py-10 sm:px-12 sm:py-12">
              <div className="flex items-center space-x-4 mb-4">
                <div className="w-14 h-14 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <span className="text-emerald-200 text-sm font-semibold uppercase tracking-wider">{t('features.businesses.title')}</span>
                  <h2 className="text-3xl sm:text-4xl font-bold text-white mt-1">{bp('businesses.title') || t('features.businesses.title')}</h2>
                </div>
              </div>
              <p className="text-emerald-100 text-lg max-w-3xl leading-relaxed">
                {bp('businesses.subtitle')}
              </p>
            </div>
            <div className="p-8 sm:p-12">
              <div className="max-w-4xl mb-10">
                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center space-x-2">
                  <svg className="w-6 h-6 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>How It Works</span>
                </h3>
                <p className="text-gray-600 leading-relaxed text-lg">
                  {bp('businesses.hero') || 'WishPal gives businesses a direct line to customers who are actively seeking what you offer.'}
                </p>
              </div>
              <div className="space-y-3">
                {renderBenefits({
                  benefit1: {
                    title: bp('businesses.benefit1.title') || 'Revenue Generator',
                    desc: bp('businesses.benefit1.desc') || t('features.businesses.benefit1Desc'),
                  },
                  benefit2: {
                    title: bp('businesses.benefit2.title') || 'Cost-Saving Tool',
                    desc: bp('businesses.benefit2.desc') || t('features.businesses.benefit2Desc'),
                  },
                  benefit3: {
                    title: bp('businesses.benefit3.title') || 'Market Intelligence',
                    desc: bp('businesses.benefit3.desc') || t('features.businesses.benefit3Desc'),
                  },
                  benefit4: {
                    title: bp('businesses.benefit4.title') || '24/7 Lead Generation',
                    desc: bp('businesses.benefit4.desc') || t('features.businesses.benefit4Desc'),
                  },
                  benefit5: {
                    title: bp('businesses.benefit5.title') || 'Build Your WishPad Page',
                    desc: bp('businesses.benefit5.desc') || 'Create a professional business page with your logo, description, social links, and location.',
                  },
                  benefit6: {
                    title: bp('businesses.benefit6.title') || 'Customer Insights Dashboard',
                    desc: bp('businesses.benefit6.desc') || 'Access detailed analytics on who is wishing for what in your area.',
                  },
                  benefit7: {
                    title: bp('businesses.benefit7.title') || 'Brand Visibility & Trust',
                    desc: bp('businesses.benefit7.desc') || 'Get listed among verified WishPads with customer ratings and success metrics.',
                  },
                })}
              </div>
              <div className="mt-10 p-6 bg-emerald-50 rounded-xl border border-emerald-100">
                <div className="flex items-start space-x-3">
                  <svg className="w-6 h-6 text-emerald-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <p className="text-emerald-900 font-semibold text-lg">{bp('businesses.summary') || 'For businesses, WishPad is the most efficient customer acquisition tool you will ever use.'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════ NGOS SECTION ═══════════════ */}
      <section id="ngos" className="py-16 sm:py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="rounded-3xl overflow-hidden shadow-xl border border-gray-200 bg-white">
            <div className="bg-gradient-to-r from-purple-500 to-pink-600 px-8 py-10 sm:px-12 sm:py-12">
              <div className="flex items-center space-x-4 mb-4">
                <div className="w-14 h-14 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </div>
                <div>
                  <span className="text-purple-200 text-sm font-semibold uppercase tracking-wider">{t('features.ngos.title')}</span>
                  <h2 className="text-3xl sm:text-4xl font-bold text-white mt-1">{bp('ngos.title') || t('features.ngos.title')}</h2>
                </div>
              </div>
              <p className="text-purple-100 text-lg max-w-3xl leading-relaxed">
                {bp('ngos.subtitle')}
              </p>
            </div>
            <div className="p-8 sm:p-12">
              <div className="max-w-4xl mb-10">
                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center space-x-2">
                  <svg className="w-6 h-6 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>How It Works</span>
                </h3>
                <p className="text-gray-600 leading-relaxed text-lg">
                  {bp('ngos.hero') || 'WishPal provides NGOs and non-profits with a powerful platform to post community needs, mobilize resources, and connect with supporters worldwide.'}
                </p>
              </div>
              <div className="space-y-3">
                {renderBenefits({
                  benefit1: {
                    title: bp('ngos.benefit1.title') || 'Impact Amplifier',
                    desc: bp('ngos.benefit1.desc') || t('features.ngos.benefit1Desc'),
                  },
                  benefit2: {
                    title: bp('ngos.benefit2.title') || 'Resource Mobilization',
                    desc: bp('ngos.benefit2.desc') || t('features.ngos.benefit2Desc'),
                  },
                  benefit3: {
                    title: bp('ngos.benefit3.title') || 'Problem Solving at Scale',
                    desc: bp('ngos.benefit3.desc') || t('features.ngos.benefit3Desc'),
                  },
                  benefit4: {
                    title: bp('ngos.benefit4.title') || 'Data-Driven Insights',
                    desc: bp('ngos.benefit4.desc') || t('features.ngos.benefit4Desc'),
                  },
                  benefit5: {
                    title: bp('ngos.benefit5.title') || 'Volunteer Matching',
                    desc: bp('ngos.benefit5.desc') || 'Find skilled volunteers who want to contribute their time and expertise to your cause.',
                  },
                  benefit6: {
                    title: bp('ngos.benefit6.title') || 'Partnership Discovery',
                    desc: bp('ngos.benefit6.desc') || 'Identify and connect with other NGOs, government agencies, and corporate partners.',
                  },
                  benefit7: {
                    title: bp('ngos.benefit7.title') || 'Transparent Impact Reporting',
                    desc: bp('ngos.benefit7.desc') || 'Track and showcase every wish fulfilled, resource mobilized, and life impacted.',
                  },
                })}
              </div>
              <div className="mt-10 p-6 bg-purple-50 rounded-xl border border-purple-100">
                <div className="flex items-start space-x-3">
                  <svg className="w-6 h-6 text-purple-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <p className="text-purple-900 font-semibold text-lg">{bp('ngos.summary') || 'For NGOs, WishPal is a force multiplier — do more with less, reach further with AI.'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════ CTA BANNER ═══════════════ */}
      <section className={`bg-gradient-to-r ${currentTheme.tagline} py-16`}>
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/10 backdrop-blur-sm rounded-full mb-6">
            <WishPalLogo size={36} showText={false} />
          </div>
          <h2 className={`text-3xl sm:text-4xl lg:text-5xl font-bold ${currentTheme.heroText} mb-4 leading-tight`}>
            {t('tagline.title')}
          </h2>
          <p className={`${currentTheme.primary50 ? 'text-purple-200' : currentTheme.heroText} opacity-80 text-lg mb-8`}>
            {t('tagline.subtitle')}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/register"
              className={`bg-gradient-to-r ${currentTheme.btnPrimary} hover:${currentTheme.btnPrimaryHover} text-gray-900 font-bold rounded-lg px-8 py-4 transition-all duration-200 shadow-lg hover:shadow-xl`}
            >
              {t('tagline.cta')}
            </Link>
            <Link
              to="/"
              className="bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white font-semibold rounded-lg px-8 py-4 border border-white/20 transition-all duration-200"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </section>

      {/* ═══════════════ FOOTER ═══════════════ */}
      <footer className="bg-gray-900 border-t border-gray-800 py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 mb-10">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center space-x-2 mb-4">
                <WishPalLogo size={28} />
              </div>
              <p className="text-sm text-gray-400 leading-relaxed">
                {t('footer.description')}
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">{t('footer.platform')}</h4>
              <ul className="space-y-2">
                <li><Link to="/search" className="text-sm text-gray-400 hover:text-purple-400 transition-colors duration-200">{t('footer.browseWishes')}</Link></li>
                <li><Link to="/register" className="text-sm text-gray-400 hover:text-purple-400 transition-colors duration-200">{t('footer.joinWishMate')}</Link></li>
                <li><Link to="/register" className="text-sm text-gray-400 hover:text-purple-400 transition-colors duration-200">{t('footer.joinWishPad')}</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">{t('footer.support')}</h4>
              <ul className="space-y-2">
                <li><Link to="#" className="text-sm text-gray-400 hover:text-purple-400 transition-colors duration-200">{t('footer.faq')}</Link></li>
                <li><Link to="#" className="text-sm text-gray-400 hover:text-purple-400 transition-colors duration-200">{t('footer.contactUs')}</Link></li>
                <li><Link to="#" className="text-sm text-gray-400 hover:text-purple-400 transition-colors duration-200">{t('footer.privacyPolicy')}</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">{t('footer.legal')}</h4>
              <ul className="space-y-2">
                <li><Link to="#" className="text-sm text-gray-400 hover:text-purple-400 transition-colors duration-200">{t('footer.termsOfService')}</Link></li>
                <li><Link to="#" className="text-sm text-gray-400 hover:text-purple-400 transition-colors duration-200">{t('footer.cookiePolicy')}</Link></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-gray-800 text-center">
            <p className="text-sm text-gray-500">&copy; {new Date().getFullYear()} WishPal. {t('footer.allRightsReserved')}</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
