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

  const handleRename = () => {
    const t = prompt('Rename chat:', activeConversation?.title);
    if (t && activeConversation) {
      dispatch({ type: 'RENAME_CONVERSATION', payload: { conversationId: activeConversation.id, title: t } });
    }
    setChatMenuOpen(false);
  };

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
    dispatch({ type: 'NEW_CONVERSATION' });
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
          <div className="navbar-title anim-fade-in">
            <span>{activeConversation.title}</span>
          </div>
        )}

        {/* Right actions */}
        <div className="navbar-actions">
          {variant === 'landing' && (
            <button className="icon-btn" onClick={handleTempChat} title="Temporary chat" id="temp-chat-btn">
              <MessageSquareDashed size={18} />
            </button>
          )}

          {variant === 'chat' && (
            <>
              <button className="pill-btn" id="share-btn" title="Share">
                <Share2 size={13} /> Share
              </button>
              <div className="navbar-menu-wrap">
                <button
                  className={`icon-btn ${chatMenuOpen ? 'active-icon' : ''}`}
                  onClick={() => setChatMenuOpen(o => !o)}
                  id="chat-options-btn"
                >
                  <MoreHorizontal size={18} />
                </button>
                {chatMenuOpen && (
                  <div className="navbar-dropdown anim-scale-in">
                    <button onClick={handlePin}>
                      <Pin size={14} />
                      {activeConversation?.pinned ? 'Unpin' : 'Pin'}
                    </button>
                    <button onClick={handleRename}>
                      <Edit2 size={14} /> Rename
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
