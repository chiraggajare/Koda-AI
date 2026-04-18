import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import './ThemePicker.css';

export default function ThemePicker() {
  const { activeTheme, changeTheme, THEMES } = useTheme();

  return (
    <div className="theme-picker">
      <div className="theme-picker-grid">
        {THEMES.map(theme => (
          <button
            key={theme.id}
            className={`theme-swatch ${activeTheme === theme.id ? 'selected' : ''}`}
            onClick={() => changeTheme(theme.id)}
            title={theme.label}
            id={`theme-${theme.id}`}
          >
            <span
              className="swatch-color"
              style={{
                background: `linear-gradient(135deg, ${theme.color}, ${theme.secondary})`,
              }}
            />
            <span className="swatch-label">{theme.label}</span>
            {activeTheme === theme.id && (
              <span className="swatch-check">✓</span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
