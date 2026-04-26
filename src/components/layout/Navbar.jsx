import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Share2, MoreHorizontal, MessageSquareDashed, Pin, Trash2, Edit2, X } from 'lucide-react';
import { useChat } from '../../context/ChatContext';
import ProfileModal from '../modals/ProfileModal';
import './Navbar.css';

export default function Navbar({ variant = 'landing' }) {
  const { state, dispatch, activeConversation } = useChat();
  const navigate = useNavigate();
  const [profileOpen, setProfileOpen] = useState(false);
  const [chatMenuOpen, setChatMenuOpen] = useState(false);



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

  const isEmptyChat = variant === 'landing' || (variant === 'chat' && activeConversation?.messages.length === 0);

  return (
    <>
      <nav className={`navbar ${isEmptyChat ? 'navbar-transparent' : ''}`} role="navigation">
        {/* Brand */}
        <button className="navbar-brand" onClick={() => navigate('/')} id="navbar-brand">
          <span className="brand-dot" />
          <span className="brand-name">Koda</span>
        </button>

        {/* Chat title (only in chat variant) */}
        {variant === 'chat' && activeConversation && !isEmptyChat && (
          <div className="navbar-title anim-fade-in" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>{activeConversation.title}</span>
            {activeConversation.isTemporary && (
              <span style={{ 
                fontSize: '0.65rem', 
                background: 'rgba(124, 106, 255, 0.15)', 
                color: 'var(--accent)', 
                padding: '2px 8px', 
                borderRadius: '10px',
                border: '1px solid var(--accent-dim)',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>Temporary</span>
            )}
          </div>
        )}

        {/* Right actions */}
        <div className="navbar-actions">
          {variant === 'landing' && (
            <button className="icon-btn" onClick={handleTempChat} title="Temporary chat" id="temp-chat-btn">
              <MessageSquareDashed size={18} />
            </button>
          )}

          {variant === 'chat' && !isEmptyChat && (
            <>
              <button className="pill-btn" id="share-btn" title="Share">
                <Share2 size={13} /> Share
              </button>
              <div className="navbar-menu-wrap">
                {chatMenuOpen && (
                  <div 
                    style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 9998, background: 'transparent' }} 
                    onClick={() => setChatMenuOpen(false)} 
                  />
                )}
                <button
                  className={`icon-btn ${chatMenuOpen ? 'active-icon' : ''}`}
                  onClick={() => setChatMenuOpen(o => !o)}
                  style={{ position: 'relative', zIndex: 9999 }}
                  id="chat-options-btn"
                >
                  <MoreHorizontal size={18} />
                </button>
                {chatMenuOpen && (
                  <div className="navbar-dropdown anim-scale-in" style={{ zIndex: 9999 }}>
                    <button onClick={handlePin}>
                      <Pin size={14} />
                      {activeConversation?.pinned ? 'Unpin' : 'Pin'}
                    </button>


                    <button className="danger" onClick={handleDelete}>
                      <Trash2 size={14} /> Delete
                    </button>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Avatar */}
          <button
            className="navbar-avatar"
            onClick={() => setProfileOpen(true)}
            id="profile-avatar-btn"
            title="Manage profile"
          >
            {state.user.avatar}
          </button>
        </div>
      </nav>

      {profileOpen && <ProfileModal onClose={() => setProfileOpen(false)} />}
    </>
  );
}
