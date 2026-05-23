import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';

const flagColors = {
  en: { bg: 'from-blue-700 to-red-600', dot: 'bg-blue-600' },
  fr: { bg: 'from-blue-600 to-red-600', dot: 'bg-blue-600' },
  es: { bg: 'from-red-500 to-yellow-500', dot: 'bg-red-500' },
  zh: { bg: 'from-red-600 to-yellow-400', dot: 'bg-red-600' },
  sw: { bg: 'from-green-600 to-red-600', dot: 'bg-green-600' },
  ar: { bg: 'from-green-500 to-white', dot: 'bg-green-600' },
  pt: { bg: 'from-green-600 to-red-600', dot: 'bg-green-600' },
  zu: { bg: 'from-green-500 to-yellow-400', dot: 'bg-yellow-500' },
  de: { bg: 'from-yellow-400 to-red-600', dot: 'bg-yellow-500' },
  st: { bg: 'from-blue-600 to-green-500', dot: 'bg-blue-600' },
  tn: { bg: 'from-blue-500 to-black', dot: 'bg-blue-600' },
  hi: { bg: 'from-orange-500 to-green-500', dot: 'bg-orange-500' },
  bn: { bg: 'from-green-500 to-red-600', dot: 'bg-green-600' },
  ur: { bg: 'from-green-500 to-white', dot: 'bg-green-600' },
  id: { bg: 'from-red-500 to-white', dot: 'bg-red-500' },
  ja: { bg: 'from-white to-red-500', dot: 'bg-red-500' },
  ha: { bg: 'from-green-600 to-white', dot: 'bg-green-600' },
};

export default function LanguageSwitcher() {
  const { language, setLanguage, languageOptions } = useLanguage();
  const [open, setOpen] = useState(false);

  const current = languageOptions.find((l) => l.code === language) || languageOptions[0];

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center space-x-1 px-2 py-1.5 rounded-lg hover:bg-white/10 transition-colors duration-200 text-sm"
        title="Change language"
      >
        <span className="text-base leading-none">{current.flag}</span>
        <svg
          className={`w-3 h-3 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-1 z-50 bg-white rounded-xl shadow-xl border border-gray-200 py-1 min-w-[180px] max-h-[300px] overflow-y-auto">
            {languageOptions.map((lang) => {
              const fc = flagColors[lang.code] || { dot: 'bg-gray-400' };
              return (
                <button
                  key={lang.code}
                  onClick={() => {
                    setLanguage(lang.code);
                    setOpen(false);
                  }}
                  className={`w-full flex items-center space-x-3 px-4 py-2.5 text-sm transition-colors duration-150 ${
                    language === lang.code
                      ? 'bg-purple-50 text-purple-700 font-semibold'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <span className={`w-4 h-4 rounded-full ${fc.dot} flex-shrink-0 ring-1 ring-white`} />
                  <span className="text-lg flex-shrink-0">{lang.flag}</span>
                  <span className="truncate">{lang.name}</span>
                  {language === lang.code && (
                    <svg className="w-4 h-4 ml-auto text-purple-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
