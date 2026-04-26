import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Share2, MoreHorizontal, MessageSquareDashed, Pin, Trash2, Menu, Sparkles, Settings, FolderOpen, Box, UserPlus } from 'lucide-react';
import { useChat } from '../../context/ChatContext';
import ProfileModal from '../modals/ProfileModal';
import './Navbar.css';

export default function Navbar({ onMenuToggle }) {
  const { state, dispatch, activeConversation } = useChat();
  const navigate = useNavigate();
  const location = useLocation();
  const [profileOpen, setProfileOpen] = useState(false);
  const [chatMenuOpen, setChatMenuOpen] = useState(false);

  const path = location.pathname;

  const handleDelete = () => {
    if (activeConversation && confirm('Delete this chat?')) {
      dispatch({ type: 'DELETE_CONVERSATION', payload: activeConversation.id });
      navigate('/');
    }
    setChatMenuOpen(false);
  };

  const handlePin = () => {
    if (activeConversation) {
      dispatch({ type: 'PIN_CONVERSATION', payload: { conversationId: activeConversation.id } });
    }
    setChatMenuOpen(false);
  };

  const handleTempChat = () => {
    dispatch({ type: 'NEW_CONVERSATION', payload: { isTemporary: true } });
    navigate('/chat');
  };

  // Determine page title/context
  let pageTitle = '';
  if (path === '/') pageTitle = '';
  else if (path.startsWith('/chat')) pageTitle = activeConversation?.messages.length > 0 ? activeConversation.title : 'New Chat';
  else if (path.startsWith('/experts/')) pageTitle = 'Expert Builder';
  else if (path.startsWith('/experts')) pageTitle = 'Experts';
  else if (path.startsWith('/inventory')) pageTitle = 'Inventory';
  else if (path.startsWith('/explorer')) pageTitle = 'Explorer';
  else if (path.startsWith('/settings')) pageTitle = 'Settings';

  return (
    <>
      <nav className="navbar fixed-navbar" role="navigation">
        <div className="navbar-left">
          {/* Hamburger always available in the navbar on mobile */}
          <button
            className="icon-btn navbar-hamburger"
            onClick={onMenuToggle}
            title="Open menu"
            id="navbar-hamburger-btn"
          >
            <Menu size={20} />
          </button>

          {/* Brand - hidden on mobile if there is a title to save space */}
          <button className="navbar-brand" onClick={() => navigate('/')} id="navbar-brand">
            <span className="brand-dot" />
            <span className="brand-name">Koda</span>
          </button>

          {/* Page title / Context */}
          {pageTitle && (
            <div className="navbar-page-context anim-fade-in">
              <span className="context-separator">/</span>
              <span className="navbar-title-text">{pageTitle}</span>
              {path.startsWith('/chat') && activeConversation?.isTemporary && (
                <span className="navbar-temp-badge">Temporary</span>
              )}
            </div>
          )}
        </div>

        {/* Right actions */}
        <div className="navbar-actions">
          {/* Page-specific actions */}
          {path.startsWith('/chat') && (
            <>
              <button className="icon-btn" onClick={handleTempChat} title="Temporary chat">
                <MessageSquareDashed size={18} />
              </button>
              
              {activeConversation?.messages.length > 0 && (
                <>
                  <button className="pill-btn navbar-share-btn" id="share-btn" title="Share">
                    <Share2 size={13} /> <span className="navbar-share-label">Share</span>
                  </button>
                  <div className="navbar-menu-wrap">
                    <button
                      className={`icon-btn ${chatMenuOpen ? 'active-icon' : ''}`}
                      onClick={() => setChatMenuOpen(o => !o)}
                    >
                      <MoreHorizontal size={18} />
                    </button>
                    {chatMenuOpen && (
                      <>
                        <div className="dropdown-overlay" onClick={() => setChatMenuOpen(false)} />
                        <div className="navbar-dropdown anim-scale-in">
                          <button onClick={handlePin}>
                            <Pin size={14} />
                            {activeConversation?.pinned ? 'Unpin' : 'Pin'}
                          </button>
                          <button className="danger" onClick={handleDelete}>
                            <Trash2 size={14} /> Delete
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </>
              )}
            </>
          )}

          {path.startsWith('/experts') && (
            <button className="icon-btn" onClick={() => navigate('/experts/new')} title="Create Expert">
              <UserPlus size={18} />
            </button>
          )}

          {/* Avatar - Always visible */}
          <button
            className="navbar-avatar"
            onClick={() => setProfileOpen(true)}
            id="profile-avatar-btn"
          >
            {state.user.avatar}
          </button>
        </div>
      </nav>

      {profileOpen && <ProfileModal onClose={() => setProfileOpen(false)} />}
    </>
  );
}
