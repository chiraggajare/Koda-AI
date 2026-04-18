import React, { useState } from 'react';
import { useMouseGradient } from '../../hooks/useMouseGradient';
import Sidebar from './Sidebar';
import BackgroundGradientAnimation from './BackgroundGradientAnimation';
import './Layout.css';

export default function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  useMouseGradient();

  return (
    <div className="layout-root">
      {/* Animated gradient background */}
      <BackgroundGradientAnimation />

      <Sidebar open={sidebarOpen} onToggle={() => setSidebarOpen(o => !o)} />

      <div className={`layout-main ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
        {children}
      </div>
    </div>
  );
}
