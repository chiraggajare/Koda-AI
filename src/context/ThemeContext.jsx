import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext(null);

const THEMES = [
  { id: 'midnight', label: 'Midnight', color: '#7c6aff', secondary: '#a78bfa' },
  { id: 'aurora',   label: 'Aurora',   color: '#00ffc2', secondary: '#0096ff' },
  { id: 'ember',    label: 'Ember',    color: '#ff6b35', secondary: '#ffaa5e' },
  { id: 'ocean',    label: 'Ocean',    color: '#38bdf8', secondary: '#0ea5e9' },
  { id: 'sakura',   label: 'Sakura',   color: '#f472b6', secondary: '#a855f7' },
  { id: 'slate',    label: 'Slate',    color: '#818cf8', secondary: '#6366f1' },
];

export function ThemeProvider({ children }) {
  const [activeTheme, setActiveTheme] = useState(() => {
    return localStorage.getItem('koda_theme') || 'midnight';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', activeTheme === 'midnight' ? '' : activeTheme);
    localStorage.setItem('koda_theme', activeTheme);
  }, [activeTheme]);

  const changeTheme = (themeId) => {
    setActiveTheme(themeId);
  };

  return (
    <ThemeContext.Provider value={{ activeTheme, changeTheme, THEMES }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
};
