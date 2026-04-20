import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Menu, Search, Plus, Package, Sprout, MessageSquare,
  Settings, ChevronRight, Pin, MoreHorizontal, X,
  Palette, ChevronDown, Clock, Type
} from 'lucide-react';
import { useChat } from '../../context/ChatContext';
import { useTheme } from '../../context/ThemeContext';
import ThemePicker from '../sidebar/ThemePicker';
import './Sidebar.css';

export default function Sidebar({ open, onToggle }) {
  const { state, dispatch, activeConversation } = useChat();
  const { activeTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const [searchQuery, setSearchQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [showThemePicker, setShowThemePicker] = useState(false);
  const [hoveredChat, setHoveredChat] = useState(null);
  const [chatMenuOpen, setChatMenuOpen] = useState(null);
  const [seedsExpanded, setSeedsExpanded] = useState(true);

  const [renamingId, setRenamingId] = useState(null);
  const [renameValue, setRenameValue] = useState('');
  const [draggedChat, setDraggedChat] = useState(null);
  const [sortBy, setSortBy] = useState('custom');

  React.useEffect(() => {
    if (!open) {
      setShowThemePicker(false);
      setSearchOpen(false);
    }
  }, [open]);

  const conversations = state.conversations.filter(c =>
    searchQuery === '' ||
    c.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const pinned = conversations.filter(c => c.pinned);
  const unpinned = conversations.filter(c => !c.pinned);

  const handleNewChat = () => {
    dispatch({ type: 'NEW_CONVERSATION' });
    navigate('/chat');
  };

  const handleSelectChat = (id) => {
    dispatch({ type: 'SET_ACTIVE_CONVERSATION', payload: id });
    navigate('/chat');
    setChatMenuOpen(null);
  };

  const handlePin = (e, id) => {
    e.stopPropagation();
    dispatch({ type: 'PIN_CONVERSATION', payload: { conversationId: id } });
    setChatMenuOpen(null);
  };

  const handleDelete = (e, id) => {
    e.stopPropagation();
    dispatch({ type: 'DELETE_CONVERSATION', payload: id });
    if (state.activeConversationId === id) navigate('/');
    setChatMenuOpen(null);
  };

  const handleRenameClick = (e, id, currentTitle) => {
    e.stopPropagation();
    setRenamingId(id);
    setRenameValue(currentTitle);
    setChatMenuOpen(null);
  };

  const submitRename = (id) => {
    if (renameValue.trim()) {
      dispatch({ type: 'RENAME_CONVERSATION', payload: { conversationId: id, title: renameValue.trim() } });
    }
    setRenamingId(null);
  };

  const handleDragStart = (e, conv) => {
    setDraggedChat(conv);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e, targetConv) => {
    e.preventDefault();
    if (!draggedChat || draggedChat.id === targetConv.id) return;
    dispatch({ type: 'REORDER_CONVERSATIONS', payload: { draggedId: draggedChat.id, targetId: targetConv.id } });
    setDraggedChat(null);
    setSortBy('custom');
  };

  const handleSort = (type) => {
    setSortBy(type);
    dispatch({ type: 'SORT_CONVERSATIONS', payload: type });
  };

  const handleSeedClick = (seedId) => {
    dispatch({ type: 'NEW_CONVERSATION', payload: { seedId, force: true } });
    navigate('/chat');
  };

  const renderChatItem = (conv) => {
    const isActive = conv.id === state.activeConversationId;
    return (
      <div
        key={conv.id}
        draggable
        onDragStart={(e) => handleDragStart(e, conv)}
        onDragOver={handleDragOver}
        onDrop={(e) => handleDrop(e, conv)}
        className={`sidebar-chat-item ${isActive ? 'active' : ''}`}
        onClick={() => handleSelectChat(conv.id)}
        onMouseEnter={() => setHoveredChat(conv.id)}
        onMouseLeave={() => { setHoveredChat(null); if (chatMenuOpen === conv.id) setChatMenuOpen(null); }}
      >
        <MessageSquare size={13} className="chat-icon" />

        {renamingId === conv.id ? (
          <input
            autoFocus
            className="rename-input"
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            onBlur={() => submitRename(conv.id)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') submitRename(conv.id);
              if (e.key === 'Escape') setRenamingId(null);
            }}
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <span className="chat-title">{conv.title}</span>
        )}

        {conv.pinned && !renamingId && <Pin size={11} className="pin-icon" />}
        {!renamingId && (
          <div className="chat-item-actions" onClick={e => { e.stopPropagation(); setChatMenuOpen(chatMenuOpen === conv.id ? null : conv.id); }}>
            <MoreHorizontal size={14} />
          </div>
        )}
        {chatMenuOpen === conv.id && !renamingId && (
          <div className="chat-context-menu anim-scale-in">
            <button onClick={e => handleRenameClick(e, conv.id, conv.title)}>Rename</button>
            <button onClick={e => handlePin(e, conv.id)}>{conv.pinned ? 'Unpin' : 'Pin'}</button>
            <button className="danger" onClick={e => handleDelete(e, conv.id)}>Delete</button>
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {/* Backdrop on mobile */}
      {open && <div className="sidebar-backdrop" onClick={onToggle} />}

      <aside className={`sidebar ${open ? 'open' : 'closed'}`}>
        {/* Header row */}
        <div className="sidebar-header">
          <button className="icon-btn sidebar-toggle" onClick={onToggle} id="sidebar-toggle-btn" title="Toggle sidebar">
            <Menu size={18} />
          </button>
          <button
            className={`icon-btn sidebar-search-btn ${searchOpen ? 'active-icon' : ''}`}
            onClick={() => setSearchOpen(o => !o)}
            title="Search chats"
          >
            <Search size={16} />
          </button>
        </div>

        {/* Search input */}
        {searchOpen && (
          <div className="sidebar-search anim-slide-up">
            <Search size={13} />
            <input
              autoFocus
              placeholder="Search chats..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
            {searchQuery && <button className="icon-btn" onClick={() => setSearchQuery('')}><X size={12} /></button>}
          </div>
        )}

        {/* New Chat */}
        <button className="sidebar-new-chat" onClick={handleNewChat} id="new-chat-btn">
          <Plus size={16} /> <span>New Chat</span>
        </button>

        <div className="sidebar-nav">
          {/* My Inventory */}
          <button
            className={`sidebar-nav-item ${location.pathname === '/inventory' ? 'active' : ''}`}
            onClick={() => navigate('/inventory')}
          >
            <Package size={16} /> <span>My Inventory</span>
          </button>

          {/* Seeds */}
          <div className="sidebar-section">
            <button
               className={`sidebar-nav-item ${location.pathname.startsWith('/seeds') ? 'active' : ''}`}
               onClick={() => navigate('/seeds')}
               id="seeds-nav-btn"
            >
              <Sprout size={16} /> <span>Seeds</span>
              <button
                className="expand-btn"
                onClick={e => { e.stopPropagation(); setSeedsExpanded(p => !p); }}
              >
                <ChevronDown size={13} className={`expand-icon ${seedsExpanded ? 'rotated' : ''}`} />
              </button>
            </button>

            {seedsExpanded && state.seeds.length > 0 && (
              <div className="sidebar-seeds-list anim-fade-in">
                {state.seeds.map(seed => (
                  <button
                    key={seed.id}
                    className="sidebar-seed-item"
                    onClick={() => handleSeedClick(seed.id)}
                  >
                    <span className="seed-dot" style={{ background: seed.color || 'var(--accent)' }} />
                    <span>{seed.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="divider" />

          {/* Chats heading */}
          <div className="sidebar-section-header">
            <div className="sidebar-section-label">Chats</div>
            <div className="sidebar-sort-controls">
              <button 
                title="Sort by Date" 
                className={sortBy === 'date' ? 'active-sort' : ''} 
                onClick={() => handleSort('date')}
              >
                <Clock size={11} />
              </button>
              <button 
                title="Sort by Name" 
                className={sortBy === 'name' ? 'active-sort' : ''} 
                onClick={() => handleSort('name')}
              >
                <Type size={11} />
              </button>
            </div>
          </div>

          {pinned.length > 0 && (
            <>
              <div className="sidebar-subsection-label"><Pin size={10} /> Pinned</div>
              {pinned.map(renderChatItem)}
            </>
          )}

          <div className="sidebar-chat-list">
            {unpinned.length === 0 && pinned.length === 0 && (
              <div className="sidebar-empty">No chats yet</div>
            )}
            {unpinned.map(renderChatItem)}
          </div>
        </div>

        <div className="sidebar-footer">
          {/* Theme picker toggle */}
          <button
            className={`sidebar-nav-item ${showThemePicker ? 'active' : ''}`}
            onClick={() => setShowThemePicker(p => !p)}
            id="theme-picker-btn"
          >
            <Palette size={16} /> <span>Theme</span>
            <ChevronRight size={13} className={`expand-icon ${showThemePicker ? 'rotated-right' : ''}`} />
          </button>

          {showThemePicker && (
            <div className="anim-slide-up">
              <ThemePicker />
            </div>
          )}

          {/* Settings */}
          <button
            className={`sidebar-nav-item ${location.pathname === '/settings' ? 'active' : ''}`}
            onClick={() => navigate('/settings')}
            id="settings-nav-btn"
          >
            <Settings size={16} /> <span>Settings & Help</span>
          </button>
        </div>
      </aside>
    </>
  );
}
