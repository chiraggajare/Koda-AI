import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ChatProvider } from './context/ChatContext';
import { ThemeProvider } from './context/ThemeContext';
import Layout from './components/layout/Layout';
import LandingPage from './components/pages/LandingPage';
import ChatPage from './components/pages/ChatPage';
import SeedsPage from './components/pages/SeedsPage';
import SeedBuilder from './components/pages/SeedBuilder';
import InventoryPage from './components/pages/InventoryPage';
import SettingsPage from './components/pages/SettingsPage';
import './styles/global.css';

export default function App() {
  return (
    <ThemeProvider>
      <ChatProvider>
        <BrowserRouter>
          <Layout>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/chat" element={<ChatPage />} />
              <Route path="/seeds" element={<SeedsPage />} />
              <Route path="/seeds/new" element={<SeedBuilder />} />
              <Route path="/seeds/:id" element={<SeedBuilder />} />
              <Route path="/inventory" element={<InventoryPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Layout>
        </BrowserRouter>
      </ChatProvider>
    </ThemeProvider>
  );
}
