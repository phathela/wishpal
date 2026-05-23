import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const themes = {
  default: {
    name: 'Default Purple',
    icon: '🟣',
    hero: 'from-indigo-900 via-purple-800 to-pink-800',
    heroText: 'text-white',
    heroAccent: 'from-yellow-300 to-pink-300',
    primary: '#7c3aed',
    primaryLight: '#a78bfa',
    primary50: '#f5f3ff',
    btnPrimary: 'from-yellow-400 to-orange-500',
    btnPrimaryHover: 'from-yellow-300 to-orange-400',
    section: 'from-white to-purple-50',
    sectionAlt: 'bg-gray-50',
    tagline: 'from-indigo-900 via-purple-800 to-pink-800',
    card: 'hover:border-purple-200',
    stat1: 'from-purple-50 to-blue-50',
    stat2: 'from-green-50 to-emerald-50',
    stat3: 'from-blue-50 to-indigo-50',
    stat4: 'from-orange-50 to-amber-50',
    feature1: 'from-green-50 to-emerald-50',
    feature2: 'from-blue-50 to-indigo-50',
    feature3: 'from-purple-50 to-pink-50',
    feature4: 'from-orange-50 to-amber-50',
  },
  ocean: {
    name: 'Ocean Blue',
    icon: '🔵',
    hero: 'from-blue-900 via-cyan-800 to-teal-800',
    heroText: 'text-white',
    heroAccent: 'from-cyan-300 to-teal-300',
    primary: '#0891b2',
    primaryLight: '#22d3ee',
    primary50: '#ecfeff',
    btnPrimary: 'from-cyan-400 to-blue-500',
    btnPrimaryHover: 'from-cyan-300 to-blue-400',
    section: 'from-white to-cyan-50',
    sectionAlt: 'bg-cyan-50',
    tagline: 'from-blue-900 via-cyan-800 to-teal-800',
    card: 'hover:border-cyan-200',
    stat1: 'from-cyan-50 to-blue-50',
    stat2: 'from-teal-50 to-emerald-50',
    stat3: 'from-sky-50 to-indigo-50',
    stat4: 'from-blue-50 to-cyan-50',
    feature1: 'from-teal-50 to-emerald-50',
    feature2: 'from-cyan-50 to-blue-50',
    feature3: 'from-sky-50 to-indigo-50',
    feature4: 'from-blue-50 to-cyan-50',
  },
  sunset: {
    name: 'Sunset Warm',
    icon: '🟠',
    hero: 'from-orange-900 via-red-800 to-rose-800',
    heroText: 'text-white',
    heroAccent: 'from-yellow-300 to-red-300',
    primary: '#e11d48',
    primaryLight: '#fb7185',
    primary50: '#fff1f2',
    btnPrimary: 'from-orange-400 to-red-500',
    btnPrimaryHover: 'from-orange-300 to-red-400',
    section: 'from-white to-orange-50',
    sectionAlt: 'bg-orange-50',
    tagline: 'from-orange-900 via-red-800 to-rose-800',
    card: 'hover:border-rose-200',
    stat1: 'from-rose-50 to-pink-50',
    stat2: 'from-orange-50 to-amber-50',
    stat3: 'from-red-50 to-rose-50',
    stat4: 'from-pink-50 to-fuchsia-50',
    feature1: 'from-rose-50 to-pink-50',
    feature2: 'from-orange-50 to-amber-50',
    feature3: 'from-red-50 to-rose-50',
    feature4: 'from-pink-50 to-fuchsia-50',
  },
  forest: {
    name: 'Forest Green',
    icon: '🟢',
    hero: 'from-green-900 via-emerald-800 to-teal-800',
    heroText: 'text-white',
    heroAccent: 'from-lime-300 to-emerald-300',
    primary: '#059669',
    primaryLight: '#34d399',
    primary50: '#ecfdf5',
    btnPrimary: 'from-emerald-400 to-green-500',
    btnPrimaryHover: 'from-emerald-300 to-green-400',
    section: 'from-white to-emerald-50',
    sectionAlt: 'bg-emerald-50',
    tagline: 'from-green-900 via-emerald-800 to-teal-800',
    card: 'hover:border-emerald-200',
    stat1: 'from-emerald-50 to-green-50',
    stat2: 'from-teal-50 to-cyan-50',
    stat3: 'from-green-50 to-emerald-50',
    stat4: 'from-lime-50 to-green-50',
    feature1: 'from-emerald-50 to-green-50',
    feature2: 'from-teal-50 to-cyan-50',
    feature3: 'from-green-50 to-emerald-50',
    feature4: 'from-lime-50 to-green-50',
  },
  midnight: {
    name: 'Midnight Dark',
    icon: '⚫',
    hero: 'from-gray-950 via-slate-900 to-gray-900',
    heroText: 'text-gray-100',
    heroAccent: 'from-purple-400 to-pink-400',
    primary: '#8b5cf6',
    primaryLight: '#a78bfa',
    primary50: '#1e1b4b',
    btnPrimary: 'from-purple-500 to-pink-600',
    btnPrimaryHover: 'from-purple-400 to-pink-500',
    section: 'from-gray-900 to-slate-900',
    sectionAlt: 'bg-gray-800',
    tagline: 'from-gray-950 via-slate-900 to-gray-900',
    card: 'hover:border-purple-700',
    stat1: 'from-indigo-900 to-purple-900',
    stat2: 'from-emerald-900 to-teal-900',
    stat3: 'from-blue-900 to-indigo-900',
    stat4: 'from-amber-900 to-orange-900',
    feature1: 'from-indigo-900 to-purple-900',
    feature2: 'from-blue-900 to-cyan-900',
    feature3: 'from-purple-900 to-pink-900',
    feature4: 'from-amber-900 to-orange-900',
  },
};

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem('wishpal-theme') || 'default';
    } catch { return 'default'; }
  });

  useEffect(() => {
    try { localStorage.setItem('wishpal-theme', theme); } catch {}
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const currentTheme = themes[theme] || themes.default;

  const themeOptions = Object.entries(themes).map(([key, t]) => ({
    id: key,
    name: t.name,
    icon: t.icon,
  }));

  return (
    <ThemeContext.Provider value={{ theme, setTheme, currentTheme, themeOptions }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}

export { themes };
