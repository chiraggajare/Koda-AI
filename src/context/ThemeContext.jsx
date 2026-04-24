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

  const [particlesEnabled, setParticlesEnabled] = useState(() => {
    const saved = localStorage.getItem('koda_particles');
    return saved !== 'false';
  });

  const [gradientEnabled, setGradientEnabled] = useState(() => {
    const saved = localStorage.getItem('koda_gradient');
    return saved !== 'false';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', activeTheme === 'midnight' ? '' : activeTheme);
    localStorage.setItem('koda_theme', activeTheme);
  }, [activeTheme]);

  useEffect(() => {
    localStorage.setItem('koda_particles', particlesEnabled);
  }, [particlesEnabled]);

  useEffect(() => {
    localStorage.setItem('koda_gradient', gradientEnabled);
  }, [gradientEnabled]);

  const changeTheme = (themeId) => {
    setActiveTheme(themeId);
  };

  const toggleParticles = () => {
    setParticlesEnabled(p => !p);
  };

  const toggleGradient = () => {
    setGradientEnabled(p => !p);
  };

  return (
    <ThemeContext.Provider value={{ activeTheme, changeTheme, THEMES, particlesEnabled, toggleParticles, gradientEnabled, toggleGradient }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
};
