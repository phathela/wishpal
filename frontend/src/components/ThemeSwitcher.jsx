import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';

export default function ThemeSwitcher() {
  const { theme, setTheme, themeOptions } = useTheme();
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center space-x-1 px-2 py-1.5 rounded-lg hover:bg-white/10 transition-colors duration-200 text-sm"
        title="Change theme"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
        </svg>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-1 z-50 bg-white rounded-xl shadow-xl border border-gray-200 py-2 min-w-[180px]">
            <div className="px-4 pb-2 mb-1 border-b border-gray-100">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Theme</p>
            </div>
            {themeOptions.map((opt) => {
              const isActive = theme === opt.id;
              const themeColors = {
                default: { bg: 'bg-purple-500' },
                ocean: { bg: 'bg-cyan-500' },
                sunset: { bg: 'bg-rose-500' },
                forest: { bg: 'bg-emerald-500' },
                midnight: { bg: 'bg-gray-700' },
              };
              const color = themeColors[opt.id] || { bg: 'bg-purple-500' };
              return (
                <button
                  key={opt.id}
                  onClick={() => {
                    setTheme(opt.id);
                    setOpen(false);
                  }}
                  className={`w-full flex items-center space-x-3 px-4 py-2.5 text-sm transition-colors duration-150 ${
                    isActive
                      ? 'bg-purple-50 text-purple-700 font-semibold'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <span className={`w-5 h-5 rounded-full ${color.bg} flex items-center justify-center`}>
                    {isActive && (
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </span>
                  <span className="flex-1 text-left">{opt.icon} {opt.name}</span>
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
