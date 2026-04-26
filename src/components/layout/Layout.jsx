import React, { useState } from 'react';
import { useMouseGradient } from '../../hooks/useMouseGradient';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import BackgroundGradientAnimation from './BackgroundGradientAnimation';
import ParticlesBackground from './ParticlesBackground';
import './Layout.css';

export const SidebarToggleContext = React.createContext(() => {});

export default function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(() => window.innerWidth > 1024);
  const toggle = () => setSidebarOpen(o => !o);
  useMouseGradient();

  return (
    <SidebarToggleContext.Provider value={toggle}>
      <div className="layout-root">
        {/* Animated gradient background */}
        <BackgroundGradientAnimation />
        <ParticlesBackground />

        {/* Global Navbar */}
        <Navbar onMenuToggle={toggle} />

        <Sidebar open={sidebarOpen} onToggle={toggle} />

        <div className={`layout-main ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
          {children}
        </div>
      </div>
    </SidebarToggleContext.Provider>
  );
}
